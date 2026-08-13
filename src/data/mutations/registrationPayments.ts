import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { displayName } from '@/components/registrations/registration-display';
import {
  ACTIVITY_OBJECT_TYPES,
  betalningsnoteringVerb,
  betalningspaminnelseVerb,
  betalningVerb,
  registrationObjectId,
} from '@/data/activityLog/activityTypes';
import { recordActivity } from '@/data/activityLog/recordActivity';
import { useDataSource } from '@/data/useDataSource';
import type { Registration } from '@/domain/models/Registration';
import type { PaymentStatusValue } from '@/domain/types/Status';
import { PaymentStatus } from '@/domain/types/Status';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/**
 * Betalnings-arbetsytans tre mutationer (task-18.8; ADR-016 fem-komponents-
 * mönster per mutation — mall: `useMarkRegistrationPaid`, som ersattes av
 * `useSetPaymentStatus` när arbetsytan tog över betalnings-vyns jobb).
 *
 * Alla tre är OPTIMISTISKA (PRD task-18 beslut 20: kryssen kräver det —
 * deltan/flikar/grupper härleds live ur cachen; noteringen och påminnelse-
 * loggen delar samma cache-rad och samma rollback-form). Servern nås via
 * update-record-operationerna (deny-by-default, allowlist-SSOT):
 *   avgift-kryss  → mark-registration-fee-paid  → 'Anmälningsavgift'
 *   slut-kryss    → mark-final-payment-paid     → 'Slutbetalning'
 *   notering      → update-registration-payment-note → de två ADDITIVA
 *                   per-betalnings-noteringsfälten
 *   påminn-logg   → log-payment-reminder → de två ADDITIVA per-betalnings-
 *                   tidsstämpelfälten (SENASTE påminnelsen per betalning)
 */

/** Betalnings-identiteten i arbetsytan: anmälningsavgiften eller slutbetalningen. */
export type Betalning = 'avgift' | 'slut';

/** Läsbar etikett per betalning (facit-språket — även mailto-ämnesraden). */
export const BETALNING_LABEL: Record<Betalning, string> = {
  avgift: 'Anmälningsavgift',
  slut: 'Slutbetalning',
};

const STATUS_OPERATION: Record<Betalning, string> = {
  avgift: 'mark-registration-fee-paid',
  slut: 'mark-final-payment-paid',
};

const STATUS_FALT: Record<Betalning, string> = {
  avgift: 'Anmälningsavgift',
  slut: 'Slutbetalning',
};

const NOTERING_FALT: Record<Betalning, string> = {
  avgift: 'Notering anmälningsavgift',
  slut: 'Notering slutbetalning',
};

const PAMINNELSE_FALT: Record<Betalning, string> = {
  avgift: 'Påminnelse anmälningsavgift skickad',
  slut: 'Påminnelse slutbetalning skickad',
};

/** Rollback-context (ADR-016 komponent C): snapshot före optimistisk write. */
interface PaymentContext {
  previous: Registration[] | undefined;
}

/** Optimistisk cache-patch av EN anmälans rad i event-listan. */
function patchRegistration(
  queryClient: QueryClient,
  key: readonly unknown[],
  id: string,
  patch: Partial<Registration>,
) {
  queryClient.setQueryData<Registration[]>(key, (old) =>
    old?.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  );
}

/**
 * Kryssets mutation: sätt en betalning till Mottagen/Ej mottagen (toggle —
 * allowlisten gatar fältet, inte värdet). 'Ej relevant' skrivs ALDRIG av
 * UI:t (föreläsnings-semantiken ägs av basen; linjen renderas då utan kryss —
 * `AtgardsSida.tsx` § `BetalningsSkrivYta` VAKT 1: ingen kryssruta finns att
 * klicka för den raden, så en "skriv-över" strukturellt inte kan avfyras
 * härifrån).
 *
 * TAKTVAKTEN (TASK-147.4, PRD task-147 § Implementationsbeslut: "basens takt
 * tål inte obegränsad parallellitet vid en batch-avprickning") — `scope.id`
 * SERIALISERAR alla avprickningar av denna typ: klickar Lotta igenom flera
 * kryss i snabb följd (en "batch" i betydelsen flera klick i följd, inte en
 * dedikerad massknapp — ytan har ingen, se `AtgardsSida.tsx` rad ~1171–1175)
 * exekveras varje `mutate()`-anrop EFTER att föregående med samma scope helt
 * avslutats, aldrig samtidigt. Detta är TanStack Querys EGNA, dokumenterade
 * mekanism för seriella mutationer ("Mutations with the same scope.id will
 * be queued and automatically resume once any preceding mutation within that
 * scope has completed" — `docs/framework/react/guides/mutations.md`,
 * `@tanstack/query-core` `mutationCache.ts#canRun`); ingen egen semafor
 * uppfanns. Skälet 5 req/s är basens hela budget, DELAD mellan alla klienter
 * (`docs/reference/airtable-constraints.md` § P4) — ett obegränsat antal
 * samtidiga kryss-klick hade kunnat trigga 429-låsningen (30 s, delad av
 * ALLA sessioner) för en operation som i sig är billig och sällan brådskar.
 * Scope-id:t är MEDVETET inte event-scopat: rate-limiten är bas-bred, inte
 * per event, så serialiseringen ska hålla även om Lotta har två event-flikar
 * öppna samtidigt.
 */
const TAKTVAKT_SCOPE = { id: 'atgardssida-betalningsstatus' };

export function useSetPaymentStatus(eventId: string) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const { user } = useAuth();
  const key = queryKeys.registrations.byEvent(eventId);

  return useMutation<
    void,
    Error,
    { registration: Registration; betalning: Betalning; value: PaymentStatusValue },
    PaymentContext
  >({
    scope: TAKTVAKT_SCOPE,
    mutationFn: ({ registration, betalning, value }) =>
      dataSource.updateRecord(STATUS_OPERATION[betalning], registration.id, {
        [STATUS_FALT[betalning]]: value,
      }),

    onMutate: async ({ registration, betalning, value }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Registration[]>(key);
      patchRegistration(
        queryClient,
        key,
        registration.id,
        betalning === 'avgift' ? { anmalningsavgift: value } : { slutbetalning: value },
      );
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },

    // aria-live för den lyckade flippen — ingen annan SR-signal finns
    // (kryssets visuella tillstånd är flippens enda uttryck).
    //
    // AKTIVITETSLOGGEN (TASK-201.3, pilot 1/3): fire-and-forget EFTER den
    // riktiga skrivningen redan lyckats — se `recordActivity`s filhuvud för
    // varför den aldrig kan fälla denna mutation. Loggar BÅDA riktningarna
    // (mottagen/ej mottagen) — `betalningVerb` väljer verb-texten.
    onSuccess: (_data, { registration, betalning, value }) => {
      const utfall = value === PaymentStatus.MOTTAGEN ? 'mottagen' : 'ej mottagen';
      alertScreenReader(
        `${BETALNING_LABEL[betalning]} markerad som ${utfall} för ${displayName(registration)}`,
      );
      void recordActivity({
        dataSource,
        queryClient,
        actor: { id: user?.id ?? '', name: user?.displayName ?? null },
        verb: betalningVerb(value),
        object: {
          id: registrationObjectId(registration.id),
          type: ACTIVITY_OBJECT_TYPES.betalning,
          name: `${displayName(registration)} (${registration.eventNamn ?? 'okänt event'})`,
        },
        // TASK-201.4: betalar 201.3s deferrade EVENT_ID_EXTENSION_IRI-skuld —
        // eventId var redan hook-bundet (`useSetPaymentStatus(eventId)`).
        eventId,
        // TASK-201.12: registration.personId är NULLABLE (anmälan kan sakna
        // Person-länk) — ?? undefined utelämnar nyckeln helt i det läget,
        // aldrig ett påhittat person-ID.
        personId: registration.personId ?? undefined,
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

/**
 * Noteringens mutation (commit-punkt: fältets blur i BetalningsLinje).
 * Skriver betalningens EGET additiva fält — gamla odelade 'Notering' rörs
 * aldrig (ADR-063-avgränsningen, allowlist-bevisad i api-sviten).
 */
export function useUpdatePaymentNote(eventId: string) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const { user } = useAuth();
  const key = queryKeys.registrations.byEvent(eventId);

  return useMutation<
    void,
    Error,
    { registration: Registration; betalning: Betalning; notering: string },
    PaymentContext
  >({
    mutationFn: ({ registration, betalning, notering }) =>
      dataSource.updateRecord('update-registration-payment-note', registration.id, {
        [NOTERING_FALT[betalning]]: notering,
      }),

    onMutate: async ({ registration, betalning, notering }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Registration[]>(key);
      // Tom sträng round-trippar till null vid läsning (multilineText) —
      // cachen normaliseras direkt så refetch aldrig ändrar visningen.
      const varde = notering === '' ? null : notering;
      patchRegistration(
        queryClient,
        key,
        registration.id,
        betalning === 'avgift'
          ? { noteringAnmalningsavgift: varde }
          : { noteringSlutbetalning: varde },
      );
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },

    // aria-live: fältet självt visar texten men sparandet saknar visuell
    // bekräftelse — annonsera utfallet (mark-paid-precedentens F-komponent).
    //
    // AKTIVITETSLOGGEN (TASK-201.13, Marcus-order "inte en enda lucka"):
    // fire-and-forget EFTER den riktiga skrivningen, samma form som
    // `useSetPaymentStatus` ovan.
    //
    // INTEGRITETEN ÄR ABSOLUT OCH STRUKTURELL: `onSuccess` destrukturerar
    // MEDVETET INTE mutationens `notering`-variabel — fritexten finns inte
    // ens som binding i det här scopet, så den kan inte läcka in i
    // statementet ens av misstag. `betalningsnoteringVerb` tar bara
    // betalningens identitet (avgift/slut) och `object.name` är samma
    // namn+event-form som alla andra registration-scopade statements.
    // Loggen bär ATT en notering ändrades — ALDRIG vad den säger (S105 Del 2
    // beslut 2, samma regel som anteckningar). Payload-nivå-bevis:
    // `tests/api/activity-log-luckor-statements.ts` § INTEGRITETSVAKTEN.
    onSuccess: (_data, { registration, betalning }) => {
      alertScreenReader(
        `Notering för ${BETALNING_LABEL[betalning].toLowerCase()} sparad för ${displayName(registration)}`,
      );
      void recordActivity({
        dataSource,
        actor: { id: user?.id ?? '', name: user?.displayName ?? null },
        verb: betalningsnoteringVerb(betalning),
        object: {
          id: registrationObjectId(registration.id),
          type: ACTIVITY_OBJECT_TYPES.betalning,
          name: `${displayName(registration)} (${registration.eventNamn ?? 'okänt event'})`,
        },
        eventId,
        // Samma NULLABLE-disciplin som `useSetPaymentStatus` ovan.
        personId: registration.personId ?? undefined,
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

/**
 * Påminnelse-loggens mutation: Påminn-klicket öppnar Lottas mailklient
 * (mailto — basens etablerade påminnelse-väg, formelfältet 'Skicka
 * betalningspåminnelse') och antecknar SAMTIDIGT tidsstämpeln i betalningens
 * additiva fält — historiken under personen härleds ur den (spårbarheten i
 * användarberättelse 22). Semantiken är öppet bokförd i kortet: tidsstämpeln
 * = när påminnelsen initierades från appen (klientens sändning kan inte
 * observeras); ett framtida server-side-utskick (18.6:s EF-mönster) kan
 * ersätta mailto utan att fälten ändrar form.
 */
export function useLogPaymentReminder(eventId: string) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const { user } = useAuth();
  const key = queryKeys.registrations.byEvent(eventId);

  return useMutation<
    void,
    Error,
    { registration: Registration; betalning: Betalning; tidpunkt: string },
    PaymentContext
  >({
    mutationFn: ({ registration, betalning, tidpunkt }) =>
      dataSource.updateRecord('log-payment-reminder', registration.id, {
        [PAMINNELSE_FALT[betalning]]: tidpunkt,
      }),

    onMutate: async ({ registration, betalning, tidpunkt }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Registration[]>(key);
      patchRegistration(
        queryClient,
        key,
        registration.id,
        betalning === 'avgift'
          ? { paminnelseAnmalningsavgiftSkickad: tidpunkt }
          : { paminnelseSlutbetalningSkickad: tidpunkt },
      );
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },

    // AKTIVITETSLOGGEN (TASK-201.13): fire-and-forget EFTER tidsstämpeln
    // faktiskt skrivits. Verbet är "antecknade", inte "skickade" — se
    // `betalningspaminnelseVerb`s docblock: klientens mailto-sändning kan
    // aldrig observeras, och loggen får inte påstå mer än den vet.
    onSuccess: (_data, { registration, betalning }) => {
      alertScreenReader(
        `Påminnelse om ${BETALNING_LABEL[betalning].toLowerCase()} antecknad för ${displayName(registration)}`,
      );
      void recordActivity({
        dataSource,
        actor: { id: user?.id ?? '', name: user?.displayName ?? null },
        verb: betalningspaminnelseVerb(betalning),
        object: {
          id: registrationObjectId(registration.id),
          type: ACTIVITY_OBJECT_TYPES.betalning,
          name: `${displayName(registration)} (${registration.eventNamn ?? 'okänt event'})`,
        },
        eventId,
        // Samma NULLABLE-disciplin som `useSetPaymentStatus` ovan.
        personId: registration.personId ?? undefined,
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
