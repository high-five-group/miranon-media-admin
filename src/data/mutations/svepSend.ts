import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { type Utfall, verkligtUtfallTillUtfall } from '@/components/events/atgarder/atgardsutfall';
import { displayName } from '@/components/registrations/registration-display';
import type { SvepEventGrupp, SvepTyp } from '@/components/svep/types';
import {
  ACTIVITY_OBJECT_TYPES,
  mailVerb,
  registrationObjectId,
} from '@/data/activityLog/activityTypes';
import { recordActivity } from '@/data/activityLog/recordActivity';
import { useDataSource } from '@/data/useDataSource';
import { queryKeys } from '@/queries/keys';

/**
 * [TASK-241.3 AC #1/#2] Bekräftelsesvepets (och framtida påminnelsesvepets,
 * TASK-241.4) sändväg — `useConfirmAll`-MÖNSTRET återuppstår som ny
 * konsument (ADR-114 § Konsekvenser), inte den rivna hookens KOD: den
 * verkliga sändningen går genom SAMMA server-kontrakt som Åtgärds-sidans
 * `useSendActionEmail` (`dataSource.sendActionEmail`, TASK-147.1/147.2) —
 * STOPP-VILLKORET (AC #1) prövade ytan och den räckte, ingen ny EF byggdes.
 *
 * VARFÖR EN NY HOOK OCH INTE `useSendActionEmail` RAKT AV: den hooken är
 * bunden till ETT `eventId` vid MONTERING (`useSendActionEmail(eventId)`) —
 * en React-hook kan inte anropas i en loop över event-grupper (Rules of
 * Hooks). Sändytan är cross-event (ADR-114 beslut 2), så denna hook gör
 * SJÄLVA loopen: ETT `dataSource.sendActionEmail`-anrop PER event-grupp
 * (ADR-114 beslut 3 — "ett sändanrop per event-grupp under huven"), parallellt
 * (`Promise.all`), och mappar varje grupps `SendActionEmailResult` genom
 * EXAKT samma `verkligtUtfallTillUtfall` (`atgardsutfall.ts`, ren flytt ur
 * `AtgardsSida.tsx`) som den per-event-ytan redan använder — samma
 * server-till-svensk-text-mappning, noll ny logik att hålla i synk.
 *
 * HEMVIST-VAKTEN (`tests/api/mutation-hemvist-vakt.test.ts`, TASK-201.15):
 * `useMutation` MÅSTE bo under `src/data/mutations/` — SvepOverlay.tsx är
 * därför BARA en konsument, aldrig ägare av mutationen.
 *
 * EN GRUPPS NÄTVERKSFEL FÄLLER ALDRIG HELA SVEPET (ADR-114 beslut 3): ett
 * kastat fel för EN grupp fångas lokalt och mappas till samma `'failed'`-form
 * som ett server-rapporterat totalt misslyckande för just den gruppen — de
 * ÖVRIGA gruppernas resultat renderas ändå. Facitets "fel-resultat"-läge
 * visar exakt detta: sent/partial/failed SAMTIDIGT, aldrig en global
 * felskärm som döljer de grupper som faktiskt gick fram.
 *
 * AKTIVITETSLOGGEN (AC #4): EN post per FAKTISKT skickad mottagare
 * (`utfall.lyckade` — "servern är facit", samma disciplin som
 * `useSendActionEmail`), taggad med DEN GRUPPENS `eventId` — inte ett
 * globalt/första-event-ID — så aktivitetshistorikens per-event-filter ser
 * rätt event för varje rad. Verbet (`mailVerb`) går genom DEN DELADE
 * verb-copy-modulen (`src/data/activityLog/verbCopy.ts`, S106-formen) vid
 * RENDERING, precis som varje annan mail-aktivitetsrad — ingen egen
 * sweep-specifik copy myntas.
 */

export type SvepGruppUtfall = Utfall & { eventId: string };

export interface SvepSendInput {
  svepTyp: SvepTyp;
  eventGrupper: SvepEventGrupp[];
  amne: (grupp: SvepEventGrupp) => string;
  mailtext: (grupp: SvepEventGrupp) => string;
}

export function useSendSvep() {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const { user } = useAuth();

  return useMutation<SvepGruppUtfall[], Error, SvepSendInput>({
    mutationFn: async ({ svepTyp, eventGrupper, amne, mailtext }) =>
      Promise.all(
        eventGrupper.map(async (grupp): Promise<SvepGruppUtfall> => {
          try {
            const result = await dataSource.sendActionEmail({
              actionType: svepTyp,
              eventId: grupp.event.id,
              registrationIds: grupp.mottagare.map((r) => r.id),
              amne: amne(grupp),
              mailtext: mailtext(grupp),
              idempotencyKey: crypto.randomUUID(),
            });
            return {
              eventId: grupp.event.id,
              ...verkligtUtfallTillUtfall(result, grupp.mottagare),
            };
          } catch (error) {
            return {
              eventId: grupp.event.id,
              status: 'failed',
              lyckade: [],
              fallna: grupp.mottagare.map((reg) => ({
                reg,
                skal: error instanceof Error ? error.message : 'Inget felmeddelande angavs.',
              })),
            };
          }
        }),
      ),

    // SAMMA FALLBACK-FORM SOM `useSendActionEmail` (TASK-201.3): entiteten
    // är en ANMÄLAN (`registrationObjectId`), `mail` är kategorin.
    onSuccess: (utfallPerGrupp, { svepTyp }) => {
      for (const utfall of utfallPerGrupp) {
        for (const reg of utfall.lyckade) {
          void recordActivity({
            dataSource,
            queryClient,
            actor: { id: user?.id ?? '', name: user?.displayName ?? null },
            verb: mailVerb(svepTyp),
            object: {
              id: registrationObjectId(reg.id),
              type: ACTIVITY_OBJECT_TYPES.mail,
              name: `${displayName(reg)} (${reg.eventNamn ?? 'okänt event'})`,
            },
            eventId: utfall.eventId,
            personId: reg.personId ?? undefined,
          });
        }
      }
    },

    // BÅDA CACHE-YTORNA: hemmets dashboard-queries (så Morgonkollens
    // räknare/rader speglar det nya läget direkt, AC #3) OCH varje berörd
    // events egna queries (samma två `useSendActionEmail` redan invaliderar
    // — en Lotta som navigerar vidare till eventet ska inte se inaktuell
    // data där heller).
    onSettled: (utfallPerGrupp) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.registrations });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.events });
      for (const utfall of utfallPerGrupp ?? []) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.registrations.byEvent(utfall.eventId),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(utfall.eventId) });
      }
    },
  });
}
