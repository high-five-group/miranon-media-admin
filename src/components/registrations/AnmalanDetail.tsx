import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Bell, ChevronLeft, ChevronRight, Inbox, Mail, UserPlus } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { AnmalansBetalningar } from '@/components/betalningar/AnmalansBetalningar';
import { DetaljGrupp, EtikettVardeRad } from '@/components/events/detail/DetaljGrupp';
import { Button } from '@/components/primitives/Button';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useSendConfirmationFromDetail } from '@/data/mutations/registrationConfirmation';
import { useDataSource } from '@/data/useDataSource';
import type { Registration } from '@/domain/models/Registration';
import type { RegistrationDetail } from '@/domain/schemas';
import { PaymentStatus, RegistrationSource, RegistrationStatus } from '@/domain/types/Status';
import { betalningarPa } from '@/lib/funktionsflaggor';
import { kursfargForKurs } from '@/lib/kursfarg';
import { queryKeys } from '@/queries/keys';
import { harledBehorighet } from './behorighet';
import { FritextRad } from './FritextRad';
import { IdChip } from './IdChip';
import { PersonMiniKort } from './PersonMiniKort';
import { displayName } from './registration-display';
import { StatusBadge } from './StatusBadge';
import { Tidslinje, type TidslinjeHandelse } from './Tidslinje';

/**
 * Per-anmälan-detaljvyn (task-18.17; S83-facit, Marcus-låst 2026-07-24
 * "Lås den"). Anmäld-radens länkmål från eventsidans personkort — hela
 * anmälans liv på EN sida, uppifrån och ned: header (namn + autonummer-pill +
 * status-badge) → Kontakt (med bekräfta-åtgärden hos mailadressen den skickar
 * till) → Avser (eventet länkat + RIM-behörigheten HÄRLEDD) → Betalningar
 * (RÅ status + symmetriska noteringar + deadline med dagar-kvar-pill) →
 * Uppgifter (platser + bor över + relationerna som PersonMiniKort) →
 * Ansökningssvar → Inkom (proveniensen) → Interna noteringar → Händelser
 * (tidslinjen, senast överst). Nyskriven mot facit-koden (throwaway-
 * kontraktet — prototypkod absorberas aldrig; prototyp-SHA 5437fb1 är
 * facit-referensen).
 *
 * INSTANT (ADR-078): navigeringen väntar aldrig på data som redan finns —
 * placeholderData ur eventsidans anmälnings-cache ger header + Kontakt
 * DIREKT (alla deras fält bor i list-shapen); grupper vars fält kräver
 * detalj-hämtningen (lookups, formler, relationer) står i skeleton i
 * SLUTGEOMETRI tills riktiga data landat — aldrig fabricerade värden
 * (placeholder-skyddet: "Anmälan #null" får inte existera). Prefetch på
 * avsikt sker vid Anmäld-radens hover/fokus (Deltagare.tsx). Golvet mätt:
 * get-registration svarar ~1–3 s varm mot staging (2026-07-25) — utan
 * placeholder hade hela sidan väntat ut det.
 *
 * A11y (11): fokus → <h1> + document.title + aria-live vid dataanländning
 * (EventDetail-mönstret); alla ikoner aria-hidden (texten bär, byggkrav 13);
 * mono-identiteter är text (kopierbara); grupperna är aria-labelledby-
 * sektioner (DetaljGrupp).
 */

const LANGDATUM = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const DATUM_TID = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function datum(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : LANGDATUM.format(d);
}

function datumTid(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : DATUM_TID.format(d);
}

/**
 * Headerns statusläge — TRE former, inte två (review-fynd F1: basens sex
 * statusvärden får aldrig kollapsas till en falsk grön):
 *   - 'obekraftad' → warning-badge + bekräfta-åtgärden i Kontakt.
 *   - 'bekraftad' → success-badge + tid. Bekräftad ⟺ bekräftelsen är skickad
 *     (ORDLISTA; S73 K53) — Status 'Bekräftad (mail skickat)' och dess
 *     nedströms 'Betalningspåminnelse skickad' bär båda den utsagan.
 *   - 'avvikande' (Avbokad/Ombokad · Inställt · Flytta till väntelista ·
 *     okänt/null) → RÅ statusen i en NEUTRAL pill (kategori-pillarnas
 *     grammatik) — arbetskön filtrerar bort avbokade (arAktiv) men detaljvyn
 *     nås via URL och +1-relationslänkar; en avbokad anmälan med grön
 *     "Bekräftad"-badge vore en falsk state-utsaga (RÅ-disciplinen).
 */
function statusLage(reg: Registration): 'obekraftad' | 'bekraftad' | 'avvikande' {
  if (reg.status === RegistrationStatus.OBEKRAFTAD) return 'obekraftad';
  if (
    reg.status === RegistrationStatus.BEKRAFTAD ||
    reg.status === RegistrationStatus.BETALNINGSPAMINNELSE
  ) {
    return 'bekraftad';
  }
  return 'avvikande';
}

/**
 * Dagar-kvar-pillens text (EventCards status-slot-grammatik: samma form för
 * samma sak i hela familjen). Passerad deadline är en AVVIKELSE och ersätter
 * nedräkningen (status-slottens semantik) — texten bär, error-tonen
 * förstärker. Facit-demon visade endast n=3; passerad-/idag-mappningen följer
 * Betalningar-gruppens deadline-semantik (öppet skiv-beslut).
 */
function dagarKvarPill(n: number): { text: string; cls: string } {
  if (n > 1) return { text: `${n} dagar kvar`, cls: '' };
  if (n === 1) return { text: '1 dag kvar', cls: '' };
  if (n === 0) return { text: 'Idag', cls: 'font-medium text-warning' };
  return { text: 'Passerad', cls: 'font-medium text-error' };
}

/**
 * Inkom-händelsens text ur anmälans proveniens (byggkrav 11): formulärvägen
 * (Källa TOM) namnger formuläret; övriga vägar följer Källa-semantiken
 * (ORDLISTA — Manuell/+1/Väntelista sätts av create-registration).
 */
function inkomText(reg: RegistrationDetail): string {
  if (reg.kalla === RegistrationSource.MEDFOLJANDE) {
    return `Anmälan skapad som medföljande (+1)${
      reg.medfoljandeTillNamn ? ` till ${reg.medfoljandeTillNamn}` : ''
    }`;
  }
  if (reg.kalla === RegistrationSource.MANUELL) return 'Anmälan tillagd manuellt';
  if (reg.kalla === RegistrationSource.VANTELISTA) return 'Anmälan skapad från väntelistan';
  return reg.franFormular ? `Anmälan inkom via ${reg.franFormular}` : 'Anmälan inkom';
}

/**
 * Tidslinjen HÄRLEDD ur tidsstämplarna (byggkrav 11) — ingen händelselogg
 * finns i basen; varje rad med en faktisk tidsstämpel blir en nod. Betalning-
 * mottagen saknar tidsstämpel i basen ⇒ ingen betalningsnod fabriceras
 * (RÅ-disciplinen: bara det som kan beläggas renderas). SENAST ÖVERST.
 */
function harledHandelser(reg: RegistrationDetail): TidslinjeHandelse[] {
  const kandidater: { nar: string | null; text: string; ikon: TidslinjeHandelse['ikon'] }[] = [
    {
      nar: reg.inskickad,
      text: inkomText(reg),
      ikon: reg.kalla === RegistrationSource.MEDFOLJANDE ? UserPlus : Inbox,
    },
    { nar: reg.bekraftelseSkickad ?? null, text: 'Bekräftelsemail skickat', ikon: Mail },
    { nar: reg.plusOneForfraganSkickad, text: 'Plus-one-förfrågan skickad', ikon: Mail },
    { nar: reg.deltagarinfoSkickad ?? null, text: 'Deltagarinfo skickad', ikon: Mail },
    {
      nar: reg.betalningspaminnelseSkickad,
      text: 'Betalningspåminnelse skickad',
      ikon: Bell,
    },
    {
      nar: reg.paminnelseAnmalningsavgiftSkickad ?? null,
      text: 'Påminnelse om anmälningsavgift skickad',
      ikon: Bell,
    },
    {
      nar: reg.paminnelseSlutbetalningSkickad ?? null,
      text: 'Påminnelse om slutbetalning skickad',
      ikon: Bell,
    },
  ];
  return kandidater
    .flatMap((k) =>
      k.nar != null && !Number.isNaN(Date.parse(k.nar)) ? [{ ...k, nar: k.nar }] : [],
    )
    .sort((a, b) => Date.parse(b.nar) - Date.parse(a.nar))
    .map((k) => ({
      id: `${k.nar}-${k.text}`,
      text: k.text,
      tid: datumTid(k.nar) ?? k.nar,
      ikon: k.ikon,
    }));
}

/** Detalj-nycklarnas placeholder-nollor (aldrig renderade som data — se INSTANT-docen). */
const DETALJ_PLACEHOLDER = {
  anmalanId: null,
  franFormular: null,
  franFormularId: null,
  fragorFunderingar: null,
  villkorOk: false,
  eventTyp: null,
  eventOrt: null,
  startdatum: null,
  slutdatum: null,
  tidKvar: null,
  eventKey: null,
  deadlineSlutbetalning: null,
  dagarKvarTillDeadline: null,
  plusOneForfraganSkickad: null,
  medfoljandeTillNamn: null,
  plusEttor: [],
  sidUrl: null,
  utm: null,
} satisfies Omit<RegistrationDetail, keyof Registration>;

export function AnmalanDetail({
  eventId,
  registrationId,
}: {
  eventId: string;
  registrationId: string;
}) {
  const dataSource = useDataSource();
  const queryClient = useQueryClient();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announceRef = useRef(false);

  const {
    data: reg,
    isPending,
    isError,
    error,
    isPlaceholderData,
  } = useQuery({
    queryKey: queryKeys.registrations.detail(registrationId),
    queryFn: () => dataSource.fetchRegistration(registrationId),
    // Seedning ur eventsidans anmälnings-cache (INSTANT, ADR-078): list-raden
    // bär identiteten + kontakten + status — headern och Kontakt står direkt.
    // `placeholderData`, inte `initialData`, med avsikt: raden är PARTIELL
    // (detalj-nycklarna är nollade ovan) och får aldrig persisteras som hel.
    placeholderData: () => {
      const rad = queryClient
        .getQueryData<Registration[]>(queryKeys.registrations.byEvent(eventId))
        ?.find((r) => r.id === registrationId);
      return rad ? ({ ...rad, ...DETALJ_PLACEHOLDER } satisfies RegistrationDetail) : undefined;
    },
    // 4xx (inkl. 404) är klient-fel → meningslöst att retrya (fetchEvent-mönstret).
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  const bekrafta = useSendConfirmationFromDetail(eventId, registrationId);

  const notFound = error instanceof EdgeFunctionError && error.status === 404;

  // Fokus → <h1> + document.title när data anlänt (en gång per laddning).
  useEffect(() => {
    if (reg && !announceRef.current) {
      announceRef.current = true;
      headingRef.current?.focus();
      document.title = `${displayName(reg)} - Anmälan`;
    }
  }, [reg]);

  // Sid-chromen står ALLTID i slutgeometri (Lugnt laddläge) — chevronen
  // tillbaka till eventsidan är sidans enda navigations-krom upptill.
  const sidRam = (innehall: React.ReactNode) => (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      <Link
        to="/event/$eventId"
        params={{ eventId }}
        aria-label="Tillbaka till eventet"
        className="mx-4 flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-muted"
      >
        <ChevronLeft aria-hidden="true" size={26} />
      </Link>
      {innehall}
    </section>
  );

  // Detalj-gruppernas skeleton i slutgeometri (delas av pending- och
  // placeholder-läget — samma ytor saknar samma data).
  const gruppSkeleton = (
    <div role="status" aria-busy="true" className="flex flex-col gap-6">
      <span className="sr-only">Laddar anmälan…</span>
      <Skeleton variant="listRow" className="h-56 rounded-2xl" />
      <Skeleton variant="listRow" className="h-44 rounded-2xl" />
      <Skeleton variant="listRow" className="h-36 rounded-2xl" />
      <Skeleton variant="listRow" className="h-32 rounded-2xl" />
    </div>
  );

  if (isPending) {
    // Helt kall start (ingen list-cache att stå på): header + grupper i skeleton.
    return sidRam(
      <div role="status" aria-busy="true" className="flex flex-col gap-6">
        <span className="sr-only">Laddar anmälan…</span>
        <Skeleton variant="text" className="mx-4 w-3/5 text-3xl" />
        <Skeleton variant="listRow" className="h-40 rounded-2xl" />
        <Skeleton variant="listRow" className="h-56 rounded-2xl" />
        <Skeleton variant="listRow" className="h-44 rounded-2xl" />
      </div>,
    );
  }

  if (isError) {
    return sidRam(
      notFound ? (
        <MessageBox intent="error" title="Anmälan hittades inte">
          Ingen anmälan med det ID:t finns. Den kan ha tagits bort, eller så är länken felaktig.
        </MessageBox>
      ) : (
        <MessageBox intent="error" title="Kunde inte hämta anmälan">
          {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
        </MessageBox>
      ),
    );
  }

  const namn = displayName(reg);
  const lage = statusLage(reg);
  const bekraftadTid = datumTid(reg.bekraftelseSkickad ?? null);
  const behorighet = harledBehorighet(reg.eventNamn, reg.kurshistorik);
  const kursfarg = kursfargForKurs(reg.eventNamn);
  const handelser = harledHandelser(reg);
  const pill = reg.dagarKvarTillDeadline != null ? dagarKvarPill(reg.dagarKvarTillDeadline) : null;

  return sidRam(
    <>
      {/* aria-live: bekräftar för skärmläsare att anmälan anlänt. */}
      <p className="sr-only" role="status" aria-live="polite">
        {`Anmälan för ${namn} laddad.`}
      </p>

      {/* Header (byggkrav 3): h1 = namnet + autonummer-pillen (mutad mono, samma
          grammatik som eventsidans EventKey-pill); statusraden bär ENDAST
          badgen + tid — åtgärden bor i Kontakt-sektionen (Marcus-iteration 2). */}
      <header className="flex flex-col gap-2.5 border-border border-b px-4 pb-5">
        <div className="flex items-center justify-between gap-3">
          <h1 ref={headingRef} tabIndex={-1} className="min-w-0 break-words font-semibold text-3xl">
            {namn}
          </h1>
          {reg.anmalanId != null && (
            <span className="shrink-0 rounded-full bg-bg-muted px-3 py-1 font-medium font-mono text-small text-text-secondary">
              Anmälan #{reg.anmalanId}
            </span>
          )}
        </div>
        <p className="my-0 flex flex-wrap items-center gap-2">
          {lage === 'bekraftad' && (
            <>
              <StatusBadge ton="success">Bekräftad</StatusBadge>
              {bekraftadTid && <span className="text-small text-text-muted">{bekraftadTid}</span>}
            </>
          )}
          {/* NEUTRAL, INTE WARNING (Marcus dom 2026-09-01) — samma byte som på
              betalningsytorna, av samma skäl: "Obekräftad" är det normala läget
              för en ny anmälan, inte ett larm. Se `StatusBadge.tsx` § TON_FORM.
              `md`-steget är oförändrat; detta är detaljsidans statusrad. */}
          {lage === 'obekraftad' && <StatusBadge ton="neutral">Obekräftad</StatusBadge>}
          {lage === 'avvikande' && (
            <span className="rounded-full bg-bg-muted px-2.5 py-1 font-medium text-small text-text-secondary">
              {reg.status ?? 'Okänd status'}
            </span>
          )}
        </p>
      </header>

      {/* Kontakt FÖRST (byggkrav 4): E-post finns ALLTID (Marcus-beslut — ingen
          saknas-gren); vid obekräftad bor bekräfta-åtgärden hos mailadressen den
          faktiskt skickar till. Grön knapp per 18.16-regeln (når utomstående). */}
      <DetaljGrupp id="grupp-kontakt" rubrik="Kontakt">
        {/* EtikettVardeRad-sekvenser bor i <dl> (OmEventet-formen — dt/dd
            kräver dl-förälder, axe dlitem); åtgärdsraden står utanför som
            kortets syskon. Samma mönster i varje grupp nedan. */}
        <dl className="my-0 divide-y divide-border">
          <EtikettVardeRad term="E-post">{reg.email}</EtikettVardeRad>
          <EtikettVardeRad term="Telefon">
            {reg.telefon ?? <span className="text-text-muted">Inget nummer</span>}
          </EtikettVardeRad>
        </dl>
        {/* Åtgärden ENDAST i obekräftat läge (F1): en avvikande anmälan
            (avbokad/inställd/väntelista) ska aldrig bära en skicka-knapp. */}
        {lage === 'obekraftad' && (
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <span className="text-small text-text-muted">
              Bekräftelsen skickas till e-postadressen ovan.
            </span>
            <Button
              intent="success"
              size="sm"
              isDisabled={bekrafta.isPending}
              onPress={() => bekrafta.mutate({ registration: reg })}
            >
              <Mail aria-hidden="true" size={14} className="shrink-0" />
              {bekrafta.isPending ? 'Skickar…' : 'Skicka bekräftelse'}
            </Button>
          </div>
        )}
      </DetaljGrupp>

      {isPlaceholderData ? (
        gruppSkeleton
      ) : (
        <>
          {/* Avser (byggkrav 5): eventet som länkrad (kursfärgs-prick + namn +
              EventKey mutad mono + chevron — 18.18 B-formens kontextrad-
              grammatik) + rader; RIM-behörigheten HÄRLEDD (verifierat
              deltagande slår självrapport; rå-svaret renderas aldrig). */}
          <DetaljGrupp id="grupp-eventet" rubrik="Avser">
            <div className="flex flex-col py-1.5">
              <Link
                to="/event/$eventId"
                params={{ eventId }}
                className="-mx-2 flex w-auto items-center gap-2 rounded-lg px-2 py-1.5 text-left font-medium text-body hover:bg-bg-emphasized motion-safe:transition-colors"
              >
                <span
                  aria-hidden="true"
                  className={`size-2.5 shrink-0 rounded-full ${kursfarg.bgClass}`}
                />
                {reg.eventNamn ?? 'Namnlöst event'}
                {reg.eventKey ? (
                  <span className="ml-auto shrink-0 font-mono font-normal text-caption text-text-muted">
                    {reg.eventKey}
                  </span>
                ) : null}
                <ChevronRight
                  aria-hidden="true"
                  size={18}
                  className={`shrink-0 text-text-secondary ${reg.eventKey ? '' : 'ml-auto'}`}
                />
              </Link>
            </div>
            <dl className="my-0 divide-y divide-border">
              <EtikettVardeRad term="Typ">{reg.eventTyp}</EtikettVardeRad>
              {/* EVENTETS ort (review-fynd F2: anmälans eget Ort-fält är
                  formulärets kopia och står tomt för app-skapade anmälningar);
                  anmälans kopia är fallback för historiska rader utan länk. */}
              <EtikettVardeRad term="Ort">{reg.eventOrt ?? reg.ort}</EtikettVardeRad>
              <EtikettVardeRad term="Datum">
                {datum(reg.startdatum)}
                {reg.slutdatum && datum(reg.slutdatum) ? ` - ${datum(reg.slutdatum)}` : ''}
              </EtikettVardeRad>
              <EtikettVardeRad term="Tid kvar">{reg.tidKvar}</EtikettVardeRad>
              {behorighet && (
                <EtikettVardeRad term="Behörighet">
                  <span className="flex flex-col items-end gap-1">
                    <StatusBadge ton={behorighet.lage === 'godkand' ? 'success' : 'warning'}>
                      {behorighet.krav}
                    </StatusBadge>
                    {/* Grunden är ALLTID länken till personkortet (understruken,
                      BÅDA lägena) — personkortets kurshistorik-yta är belägget. */}
                    {reg.personId ? (
                      <Link
                        to="/personer/$personId"
                        params={{ personId: reg.personId }}
                        className="text-caption text-text-muted underline underline-offset-2 hover:text-text"
                      >
                        {behorighet.grund}
                      </Link>
                    ) : (
                      <span className="text-caption text-text-muted">{behorighet.grund}</span>
                    )}
                  </span>
                </EtikettVardeRad>
              )}
            </dl>
          </DetaljGrupp>

          {/* Betalningar (byggkrav 6): RÅ status (basens 'visuell status'-formel
              används EJ); noterings-raderna ALLTID symmetriska; deadline-raden
              dold när mottagen, med VIT dagar-kvar-pill (EventCards
              status-slot-grammatik). */}
          <DetaljGrupp id="grupp-betalningar" rubrik="Betalningar">
            <dl className="my-0 divide-y divide-border">
              <EtikettVardeRad term="Anmälningsavgift">
                {reg.anmalningsavgift ?? <span className="text-text-muted">—</span>}
              </EtikettVardeRad>
              <EtikettVardeRad term="Notering (avgift)">
                {reg.noteringAnmalningsavgift ?? (
                  <span className="text-text-muted">Ingen notering</span>
                )}
              </EtikettVardeRad>
              <EtikettVardeRad term="Slutbetalning">
                {reg.slutbetalning ?? <span className="text-text-muted">—</span>}
              </EtikettVardeRad>
              {reg.slutbetalning !== PaymentStatus.MOTTAGEN && reg.deadlineSlutbetalning && (
                <EtikettVardeRad term="Deadline">
                  <span className="flex items-center justify-end gap-2">
                    {datum(reg.deadlineSlutbetalning)}
                    {pill && (
                      <span
                        data-testid="deadline-pill"
                        className={`rounded-full bg-surface px-2.5 py-0.5 font-medium text-caption ${pill.cls}`}
                      >
                        {pill.text}
                      </span>
                    )}
                  </span>
                </EtikettVardeRad>
              )}
              <EtikettVardeRad term="Notering (slutbetalning)">
                {reg.noteringSlutbetalning ?? (
                  <span className="text-text-muted">Ingen notering</span>
                )}
              </EtikettVardeRad>
            </dl>
            {/* [TASK-346.7 AC #3] Saknas-belopp, inbetalningar, kvitton och
                Registrera betalning — bakom miljöflaggan. Blocket ligger
                UTANFÖR `<dl>`:en med avsikt: en `<dl>` får bara bära
                `<dt>`/`<dd>`-par (axe `definition-list`/`only-dlitems`), och
                detta är en yta med rubrik, knapp och lista, inte ett
                term-värde-par.

                MED FLAGGAN AV ÄR GRUPPEN EXAKT DAGENS: de fem raderna ovan,
                oförändrade. */}
            {betalningarPa() && <AnmalansBetalningar anmalanRecordId={reg.id} />}
          </DetaljGrupp>

          {/* Uppgifter (byggkrav 7): platser + bor över + RELATIONERNA som
              PersonMiniKort — huvudanmälan (när denna är +1), +1:orna
              (inversen) och personkortet, hela ytan klickbar. */}
          <DetaljGrupp id="grupp-uppgifter" rubrik="Uppgifter">
            <dl className="my-0 divide-y divide-border">
              <EtikettVardeRad term="Antal platser">{reg.antalPlatser}</EtikettVardeRad>
              <EtikettVardeRad term="Bor över">{reg.borOver ? 'Ja' : 'Nej'}</EtikettVardeRad>
            </dl>
            {reg.medfoljandeTill && (
              <PersonMiniKort
                namn={reg.medfoljandeTillNamn ?? 'Namn saknas'}
                roll="Huvudanmälan (denna anmälan är +1)"
                to="/event/$eventId/anmalan/$registrationId"
                params={{ eventId, registrationId: reg.medfoljandeTill }}
              />
            )}
            {reg.plusEttor.map((p) => (
              <PersonMiniKort
                key={p.id}
                namn={p.namn ?? 'Namn saknas'}
                roll="Medföljande (+1)"
                to="/event/$eventId/anmalan/$registrationId"
                params={{ eventId, registrationId: p.id }}
              />
            ))}
            {reg.personId && (
              <PersonMiniKort
                namn={namn}
                roll="Personkort"
                to="/personer/$personId"
                params={{ personId: reg.personId }}
              />
            )}
          </DetaljGrupp>

          {/* Ansökningssvar (byggkrav 8): fullbredds-fritext med läs mer-klipp;
              tomma döljs — hela gruppen utgår när båda saknas. Etiketten
              "Frågor" (facit-revidering, Marcus-beslut 2026-07-25 — kortare
              än fältnamnets "Frågor/funderingar"; bas-fältet heter kvar). */}
          {(reg.motivering || reg.fragorFunderingar) && (
            <DetaljGrupp id="grupp-svar" rubrik="Ansökningssvar">
              {reg.motivering && <FritextRad etikett="Motivering" text={reg.motivering} />}
              {reg.fragorFunderingar && (
                <FritextRad etikett="Frågor" text={reg.fragorFunderingar} />
              )}
            </DetaljGrupp>
          )}

          {/* Inkom (byggkrav 9, proveniensen): inskickad med klockslag ·
              formulär med kopierbart options-ID (staplad högerställd — namnet
              behåller kant-positionen, chippen mutad under) · Källa · villkor
              (Ej tillämpligt vid icke-formulär — en +1:a/manuell har aldrig
              mött kryssrutan; "Nej" hade läst som complianceproblem) · URL/UTM
              renderas när data finns (BAS-GAP: fälten är AT-Max-kandidater). */}
          <DetaljGrupp id="grupp-inkom" rubrik="Inkom">
            <dl className="my-0 divide-y divide-border">
              <EtikettVardeRad term="Inskickad">{datumTid(reg.inskickad)}</EtikettVardeRad>
              <EtikettVardeRad term="Formulär">
                {reg.kalla == null ? (
                  <span className="flex flex-col items-end gap-1">
                    <span>{reg.franFormular ?? <span className="text-text-muted">—</span>}</span>
                    {reg.franFormularId ? (
                      <IdChip id={reg.franFormularId} kopieraEtikett="Kopiera formulär-ID" />
                    ) : null}
                  </span>
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </EtikettVardeRad>
              <EtikettVardeRad term="Källa">{reg.kalla ?? 'Formulär'}</EtikettVardeRad>
              <EtikettVardeRad term="Villkor godkända">
                {reg.kalla != null && !reg.villkorOk ? (
                  <span className="text-text-muted">Ej tillämpligt ({reg.kalla})</span>
                ) : reg.villkorOk ? (
                  'Ja'
                ) : (
                  'Nej'
                )}
              </EtikettVardeRad>
              {reg.sidUrl && (
                <EtikettVardeRad term="URL">
                  <a
                    href={`https://${reg.sidUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-small underline underline-offset-2 hover:text-text"
                  >
                    {reg.sidUrl}
                  </a>
                </EtikettVardeRad>
              )}
              {reg.utm && (
                <EtikettVardeRad term="UTM">
                  <span className="font-mono text-small">{reg.utm}</span>
                </EtikettVardeRad>
              )}
            </dl>
          </DetaljGrupp>

          {/* Interna noteringar (byggkrav 10) — INTERIMET: basens odelade
              Notering-fält (EN anonym text) utan författarrad. Målbilden är
              Anteckningar-mönstret (ADR-075) utvidgat till anmälningar —
              egen skiva/ADR-kandidat (task-43); gapet visas som det är. */}
          {reg.notering && (
            <DetaljGrupp id="grupp-noteringar" rubrik="Interna noteringar">
              <div className="flex flex-col py-1">
                <div className="my-2 flex flex-col gap-1.5 rounded-xl bg-surface p-3">
                  <p className="my-0 whitespace-pre-line text-body leading-relaxed">
                    {reg.notering}
                  </p>
                </div>
              </div>
            </DetaljGrupp>
          )}

          {/* Händelser SIST (byggkrav 11): tidslinjen härledd ur tidsstämplarna,
              senast överst. */}
          {handelser.length > 0 && (
            <DetaljGrupp id="grupp-handelser" rubrik="Händelser">
              <Tidslinje handelser={handelser} />
            </DetaljGrupp>
          )}
        </>
      )}
    </>,
  );
}
