import { Link } from '@tanstack/react-router';
import { ChevronDown, Clock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BasenSlaparPill } from '@/components/betalningar/BasenSlaparPill';
import { idagIso } from '@/components/betalningar/idag';
import {
  arRentDatum,
  inbetalningsHandelser,
} from '@/components/betalningar/inbetalnings-handelser';
import { harledRad, type InkorgsRad } from '@/components/betalningar/inkorg-harledningar';
import { KvarAttBetala } from '@/components/betalningar/KvarAttBetala';
import { Button, MessageBox, Skeleton } from '@/components/primitives';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import { type AnmalanHandelse, harledHandelser } from '@/components/registrations/handelser';
import { displayName } from '@/components/registrations/registration-display';
import { StatusBadge } from '@/components/registrations/StatusBadge';
import { Tidslinje, type TidslinjeHandelse } from '@/components/registrations/Tidslinje';
import { useInbetalningarForEvent, useOppnaBetalningar } from '@/data/betalningar/useBetalningar';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import type { InbetalningarBatchGrupp } from '@/domain/schemas';
import { PaymentStatus, RegistrationStatus } from '@/domain/types/Status';
import { DAGMANAD } from './datumSpann';
import { kategoriPillText } from './hallplats-steg-prototyp';

/**
 * Betalningarnas LÄSYTA (`BetalningsDetaljer`; task-18.8/TASK-145.4, S73-facit
 * K27–K34; formen omgjord i TASK-436, 2026-09-08). Monteras fällbar under
 * registret, inuti Anmälda deltagare (`Deltagare.tsx`s `ArbetsKo`, "Öppna
 * detaljer") — inget eget toppnivå-block sedan TASK-145.4.
 *
 * Formen (uppifrån och ned): flikar i familje-kapseln (Saknar betalning /
 * Klara — K30, läser basens spegel) + deadline som STATUS-BADGE → person-
 * korten (`BetalningsPersonRad`): namn + status-/kategoripill, en rad
 * "Kvar att betala" (`KvarAttBetala`, samma block som anmälans detaljvy) och
 * Händelseloggen (`Tidslinje`, senast överst, samma härledning som detaljvyns
 * Händelser — `registrations/handelser.ts`).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TASK-436 (Marcus 2026-09-08): KRYSSRADERNA ÄR RIVNA, BELOPPET BÄR STATUSEN
 * ═══════════════════════════════════════════════════════════════════════════
 * Fram till 2026-09-08 bar varje person två permanent inaktiverade kryssrutor
 * (Anmälningsavgift/Slutbetalning) med basens notering som läsvärde. Tre
 * skäl rev dem, alla mätta: (1) en avstängd kryssruta är en kontroll som ser
 * ut som en kontroll men inte är det — samma dom Marcus fällde för knappar
 * 2026-09-01 (`AtgardsSida.tsx` § TASK-402.5); (2) sedan ADR-128 säger de
 * bara "klart/inte klart", medan varje annan betalningsyta talar i kronor —
 * samma sak ska heta samma sak var Lotta än står; (3) basens två
 * noteringsfält bar NOLL innehåll i prod (mätt 2026-09-08, read-only).
 *
 * Beloppet kommer ur `useOppnaBetalningar` — SAMMA anrop som inkorgen och
 * anmälans detaljvy, en rad per anmälan med öppet belopp — slaget upp per
 * person. Noll extra anrop för sjutton personer, och hämtningen väntar tills
 * Lotta faktiskt öppnat detaljerna (`aktiv`): sidladdningen kostar ingenting.
 *
 * TVÅ KÄLLOR, OCH VILKEN SOM VINNER: flikarna läser basens spegel
 * (`anmalningsavgift`/`slutbetalning`), beloppet läser Postgres via samma
 * härledning som inkorgen (`harledRad`). Finns en rad vinner Postgres —
 * även under fliken Klara, då med "Basen släpar" på namnraden (ADR-128
 * beslut 5: eftersläpningen SYNS, tystas aldrig). Finns ingen rad säger
 * fliken Klara "Allt betalt" (spegeln själv påstår det).
 *
 * PRISET SAKNAS: EF:en utelämnar exakt de anmälningar vars pris basen inte
 * kan räkna fram (`hamta-oppna-betalningar` § ÖPPEN BETALNING). Saknar
 * eventet pris sägs det EN gång, på eventnivå ovanför listan, och
 * beloppsraden hoppas över per person — fjorton identiska "Pris saknas i
 * basen" hade varit samma brus som de arton tomma rutorna våg 10 rev
 * ("bar noll information och ändå dominerade ytan").
 *
 * HÄNDELSELOGGEN ersätter utskicksloggen (K34): samma tidslinje, men senast
 * överst och med "Anmäld" ur `inskickad` — och sedan TASK-438 även
 * inbetalningarna (nästa stycke). Ingen synlig rubrik (Marcus 2026-08-06: "'Utskick' kan vi
 * ta bort … man fattar ändå"); ingen sr-only-rubrik heller — den som stod
 * här rev två CI-grindar (axe `heading-order` + strict mode), och varje nod
 * läses redan "text, tid" inuti personens egen listpost. Listan bär i
 * stället sitt namn som `aria-label` ("Händelselogg"): inget rubrikelement,
 * ingen roll, inget lint-undantag — skärmläsaren hör "lista, Händelselogg",
 * ögat ser noderna. Tomtexten säger i klartext att inget hänt (Gunilla).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TASK-438 (2026-09-08): INBETALNINGARNA I LOGGEN — ETT ANROP FÖR HELA EVENTET
 * ═══════════════════════════════════════════════════════════════════════════
 * Loggen bär sedan steg 2 även inbetalningar och återbetalningar, blandade
 * med utskicken och sorterade senast överst: "Inbetalning 2 500 kr · Swish"
 * med kvittostatus, makulering och notering som dämpade underrader
 * (`betalningar/inbetalnings-handelser.ts` äger ordvalen — betalningssidans,
 * aldrig en tredje formulering). Återbetalningar är en egen händelsetyp med
 * egen ikon; makulerade rader syns med sitt skäl (ADR-128: sanningen rättas
 * utan att historiken försvinner).
 *
 * VARFÖR ETT BATCH-ANROP OCH INTE ETT PER PERSON: läsningen per anmälan
 * (`useInbetalningarPerAnmalan`) hade gett ett Edge Function-anrop per person
 * — sjutton för ett fullt event — exakt det mönster `PanelBetalningar.tsx`s
 * docblock dömde ut ("tjugo Edge Function-anrop"). `hamta-inbetalningar`
 * tar sedan TASK-437 en batch av anmälnings-id:n (POST, tak 200) och svarar
 * grupperat per anmälan; `useInbetalningarForEvent` hämtar den EN gång per
 * event, först när detaljerna öppnats (`aktiv`) — noll anrop vid sidladdning,
 * bevisat i e2e via nätverksräkning. Prod-EF:en deployades av Marcus
 * 2026-09-08 (version 6) innan denna klientändring landade.
 *
 * LADDNING OCH FEL följer `InbetalningsLista.tsx`: skelett per person
 * (`role="status"`) medan svaret väntas — loggen visar INTE utskicken först
 * och sorterar om efteråt — och ETT fel för hela ytan med "Försök igen"
 * (beloppen och inbetalningarna kommer ur var sitt anrop, så de får var sin
 * ruta; båda lämnar utskicken orörda). Tiden: en betalning bär ofta bara ett
 * datum — se `loggtid` nedan.
 *
 * Skrivvertikalen bor på betalningssidan (PRD TASK-402); eventsidan skriver
 * ingenting (TASK-145 DoD #7): ingen mutation instansieras i denna fil, och
 * ytan bär inte en enda kryssruta, textruta eller knapp per person.
 *
 * A11y (11/10): disclosure med aria-expanded/aria-controls; flikarna är
 * ToggleButtonGroup (radiogroup-semantik); loggen är en riktig `<ol>`
 * (Tidslinje); laddning annonseras via `role="status"`, fel via MessageBox
 * med "Försök igen".
 */

/** Avgiften klar = Mottagen (null/Ej mottagen = saknas). */
function avgiftKlar(r: Registration): boolean {
  return r.anmalningsavgift === PaymentStatus.MOTTAGEN;
}

/** Slutbetalningen kräver inget mer: Mottagen ELLER Ej relevant (föreläsning). */
function slutKlar(r: Registration): boolean {
  return (
    r.slutbetalning === PaymentStatus.MOTTAGEN || r.slutbetalning === PaymentStatus.EJ_RELEVANT
  );
}

/** Slutbetalning SAKNAS (deltat): varken mottagen eller irrelevant. */
function slutSaknas(r: Registration): boolean {
  return !slutKlar(r);
}

/**
 * Deadline som STATUS-DATA (K30; LÅST REGEL, Marcus 2026-07-21): slutbetalningen
 * förfaller 14 dagar före eventets startdatum — härleds ur startdatum, inget
 * bas-fält (basens formel 'Deadline slutbetalning' bär samma regel). Färgen
 * följer läget: lugnt → neutral · imorgon/idag → warning · passerad → error.
 * Aldrig rå negativ siffra (Gunilla).
 */
export function deadlineStatus(startdatum: string | null): { text: string; cls: string } | null {
  if (!startdatum) return null;
  const start = new Date(startdatum);
  if (Number.isNaN(start.getTime())) return null;
  const deadline = new Date(start);
  deadline.setDate(deadline.getDate() - 14);
  deadline.setHours(0, 0, 0, 0);
  const idag = new Date();
  idag.setHours(0, 0, 0, 0);
  const diff = Math.round((deadline.getTime() - idag.getTime()) / 86_400_000);
  const datum = DAGMANAD.format(deadline);
  if (diff > 1) return { text: `Deadline ${datum} · om ${diff} dagar`, cls: 'text-text-secondary' };
  if (diff === 1) return { text: `Deadline ${datum} · imorgon`, cls: 'font-medium text-warning' };
  if (diff === 0) return { text: 'Deadline idag', cls: 'font-medium text-warning' };
  return { text: `Deadline passerad · ${datum}`, cls: 'font-medium text-error' };
}

/** Loggens tidsstämpel: dag, månad OCH klockslag. Två utskick samma dag är
    annars oskiljbara, och ordningsföljden är precis vad en logg ska belägga,
    inte förutsätta. Året utelämnas: ytan står i eventets egen datumkontext. */
const LOGGTID = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * [TASK-438] En inbetalning bär ofta bara ett DATUM (`betalningsdatum`,
 * Lottas eget val vid registreringen) — inget klockslag finns, och ett
 * "1 september kl. 00:00" hade påstått ett som aldrig fanns. Rent datum
 * formateras därför utan tid; en tidpunkt (utskick, `skapadNar`) med.
 * Noon-förankringen håller kalenderdagen intakt oavsett tidszon: ett
 * `new Date('2026-09-01')` är UTC-midnatt, som i en tidszon väster om
 * Greenwich hade blivit 31 augusti.
 */
function loggtid(nar: string): string {
  return arRentDatum(nar)
    ? DAGMANAD.format(new Date(`${nar}T12:00:00`))
    : LOGGTID.format(new Date(nar));
}

/** Sorteringsvärde för "senast överst": rent datum räknas som dagens början,
    så ett utskick med klockslag samma dag hamnar ovanför betalningen. */
function tidsvarde(nar: string): number {
  return Date.parse(arRentDatum(nar) ? `${nar}T00:00:00` : nar);
}

/** K27-disclosure: "Öppna/Stäng detaljer" centrerad rad; chevron-down roterar
    (disclosure-branschformen — skild från navigationsradernas höger-chevron).
    EXPORTERAD sedan konvergens-passet (S93 Del 3 beslut 1): återanvänds av
    `Deltagare.tsx` för den INFLYTTADE arbetsytan (samma K27-form, inte en
    kopia — se `Deltagare.tsx`s `ArbetsKo` för montering).

    HOVER (S93 våg 17, Marcus 2026-08-06: "'Öppna detaljer' har ingen hover,
    fixa det"). Formen speglar appens etablerade rad-hover:
    `hover:bg-bg-emphasized` + `motion-safe:transition-colors`, samma som
    `AnmalanDetail`s eventlänk och `EventsList`. Geometrin är familjens
    48 px-rad (6+6+24+6+6): hover-plattan ligger på KNAPPEN och kan därför
    bära `rounded-lg`. `focus-visible` bärs globalt via `--mm-color-focus-ring`. */
export function DetaljRad({
  oppen,
  kontrollerarId,
  onToggle,
}: {
  oppen: boolean;
  kontrollerarId: string;
  onToggle: () => void;
}) {
  return (
    <div className="py-1.5">
      <button
        type="button"
        aria-expanded={oppen}
        aria-controls={kontrollerarId}
        onClick={onToggle}
        className="flex w-full items-center justify-center gap-2 rounded-lg py-1.5 font-medium text-body hover:bg-bg-emphasized motion-safe:transition-colors"
      >
        {oppen ? 'Stäng detaljer' : 'Öppna detaljer'}
        <ChevronDown
          aria-hidden="true"
          size={18}
          className={`shrink-0 text-text-secondary motion-safe:transition-transform ${oppen ? 'rotate-180' : ''}`}
        />
      </button>
    </div>
  );
}

/**
 * Person-kortet i arbetsytan (K29, promoverad TASK-145.6/ADR-103 B2 steg 4;
 * formen omgjord TASK-436). Formen är `DetaljGrupp`s, den som gör anmälnings-
 * sidan läsbar: NAMNRADEN UTANFÖR kortet (namn + pillar, `px-4` in till där
 * rundningen slutar), KORTET under (`rounded-2xl bg-surface px-4`, vitt mot
 * arbetsytans muted botten — muted på muted var osynligt, mätt 2026-08-06)
 * med `divide-y` mellan raderna: "Kvar att betala" överst, Händelseloggen
 * under. Namnet länkar till person-detaljvyn när anmälan bär person-länken
 * (annars stilla text — länk utan mål ljuger). Namnraden är medvetet INGET
 * rubrikelement: fjorton syskon-rubriker under en enda `<h2>` vore en
 * semantisk lögn, och listan är redan en `<ul>` med poster.
 */
function BetalningsPersonRad({
  registration,
  rad,
  klar,
  prisOkant,
  laddar,
  inbetalningar,
  inbetalningarLaddar,
}: {
  registration: Registration;
  /** Postgres-raden ur `useOppnaBetalningar`, eller `null` när anmälan inte är öppen enligt basen. */
  rad: InkorgsRad | null;
  /** Fliken Klara: basens spegel säger att båda betalningarna är klara. */
  klar: boolean;
  /** Eventet bär inget pris i basen — beloppsraden hoppas över, notisen står på eventnivå. */
  prisOkant: boolean;
  laddar: boolean;
  /** [TASK-438] Anmälans grupp ur batch-svaret (ett anrop för hela eventet), `null` tills svaret finns. */
  inbetalningar: InbetalningarBatchGrupp | null;
  inbetalningarLaddar: boolean;
}) {
  const namn = displayName(registration);
  const kategoriPill = kategoriPillText(registration);
  const arObekraftad = registration.status === RegistrationStatus.OBEKRAFTAD;

  // POSTGRES VINNER NÄR DEN HAR NÅGOT ATT SÄGA (ADR-128): finns en rad är
  // dess belopp sanningen, oavsett flik. Finns ingen rad står bara spegeln
  // kvar — "Allt betalt" under Klara (det är spegelns eget påstående), och
  // under Saknar det enda EF-utelämnandet som är förenligt med fliken:
  // priset kan inte räknas fram (`hamta-oppna-betalningar` § ÖPPEN BETALNING).
  const saknas = rad ? (rad.kvar ?? rad.betalning.saknas) : klar ? 0 : null;

  // Händelseloggen: utskicken (delad härledning) OCH inbetalningarna (TASK-438,
  // ur batch-svaret) i EN lista, senast överst; tiden formateras här.
  const poster: Array<AnmalanHandelse & { undertext?: readonly string[] }> = [
    ...harledHandelser(registration),
    ...(inbetalningar ? inbetalningsHandelser(inbetalningar) : []),
  ];
  const handelselogg: TidslinjeHandelse[] = poster
    .sort((a, b) => tidsvarde(b.nar) - tidsvarde(a.nar))
    .map((h) => ({
      id: h.id,
      text: h.text,
      tid: loggtid(h.nar),
      ikon: h.ikon,
      undertext: h.undertext,
    }));

  return (
    <li className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-3 px-4">
        {registration.personId ? (
          <Link
            to="/personer/$personId"
            params={{ personId: registration.personId }}
            className="min-w-0 font-semibold text-lg underline-offset-2 hover:underline"
          >
            {namn}
          </Link>
        ) : (
          <span className="min-w-0 font-semibold text-lg">{namn}</span>
        )}
        {(arObekraftad || kategoriPill || rad?.spegelSlapar) && (
          <span className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            {arObekraftad && (
              /* NEUTRAL, INTE WARNING (Marcus dom 2026-09-01): "Obekräftad"
                 har ett eget bekräftelseflöde och är det NORMALA läget för en
                 ny anmälan. Se `StatusBadge.tsx` § TON_FORM. */
              <StatusBadge ton="neutral" storlek="sm">
                Obekräftad
              </StatusBadge>
            )}
            {/* Kategori-pillen: VIT fyllning på muted botten (våg 16, Marcus:
                ingen kontur) — appens etablerade neutrala pill mot muted
                underlag (EventCard, NastaEventCard, AnmalanDetail).
                `contrast-more` behåller en kant för dem som begärt det. */}
            {kategoriPill && (
              <span className="rounded-full border border-transparent bg-surface px-2 py-0.5 font-medium text-caption text-text-secondary contrast-more:border-border-strong">
                {kategoriPill}
              </span>
            )}
            {rad?.spegelSlapar && <BasenSlaparPill />}
          </span>
        )}
      </div>
      <div className="divide-y divide-border rounded-2xl border border-transparent bg-surface px-4 contrast-more:border-border-strong">
        {(saknas !== null || !prisOkant) && (
          <div className="py-3">
            {laddar ? (
              <div aria-busy="true" role="status" className="py-1">
                <span className="sr-only">Laddar belopp ...</span>
                <Skeleton variant="listRow" />
              </div>
            ) : (
              <KvarAttBetala saknas={saknas} />
            )}
          </div>
        )}
        {inbetalningarLaddar ? (
          // Loggen väntar in inbetalningarna i stället för att visa utskicken
          // först och sortera om när svaret kommer — en lista som byter
          // ordning under ögonen på Lotta läser som ett fel, inte som en
          // laddning. Samma skelett och annonsering som beloppsraden ovan.
          <div aria-busy="true" role="status" className="py-3">
            <span className="sr-only">Laddar händelser ...</span>
            <Skeleton variant="listRow" />
          </div>
        ) : handelselogg.length > 0 ? (
          <Tidslinje etikett="Händelselogg" handelser={handelselogg} />
        ) : (
          <p className="py-3 text-small text-text-muted">
            Inga händelser ännu för den här personen.
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * Arbetsytan (K29–K30): flikar i familje-kapseln (Saknar betalning / Klara,
 * räknarna följer basens spegel) + deadline-STATUS-BADGEN (listkortens
 * status-slot-form: bg-surface-pill + statusfärgad text) + person-listan.
 *
 * EXPORTERAD sedan konvergens-passet (S93 Del 3 beslut 1): monteras inuti
 * Anmälda deltagare (`Deltagare.tsx`s `ArbetsKo`), fällbar under registret,
 * bakom samma `DetaljRad`. Deadline-badgen följer med — den renderas HÄR.
 *
 * `aktiv` är disclosure-läget: beloppen hämtas först när Lotta öppnat
 * detaljerna (ett anrop för hela eventet, samma cache som inkorgen), aldrig
 * vid sidladdning.
 */
export function BetalningsDetaljer({
  event,
  registreringar,
  aktiv = true,
}: {
  event: Event;
  registreringar: Registration[];
  aktiv?: boolean;
}) {
  const [flik, setFlik] = useState<'saknar' | 'klara'>('saknar');
  const deadline = deadlineStatus(event.startdatum);
  const saknar = registreringar.filter((r) => !avgiftKlar(r) || slutSaknas(r));
  const klara = registreringar.filter((r) => avgiftKlar(r) && slutKlar(r));
  const lista = flik === 'saknar' ? saknar : klara;

  const oppna = useOppnaBetalningar(aktiv);
  const idag = useMemo(idagIso, []);
  const raderPerAnmalan = useMemo(
    () =>
      new Map<string, InkorgsRad>(
        (oppna.data?.betalningar ?? []).map((b) => [b.anmalanRecordId, harledRad(b, idag)]),
      ),
    [oppna.data, idag],
  );
  const prisOkant = event.pris == null;
  const laddar = aktiv && oppna.isPending;

  // [TASK-438] INBETALNINGARNA: ETT anrop för HELA eventet (batch av
  // anmälnings-id:n, `hamta-inbetalningar` POST, TASK-437), först när Lotta
  // öppnat detaljerna. Id-listan sorteras så query-nyckeln är stabil oavsett
  // registrets ordning — annars hade en omsortering av listan kostat en ny
  // hämtning. Båda flikarnas personer ingår: fliken byts utan nytt anrop.
  const anmalanRecordIds = useMemo(
    () => registreringar.map((r) => r.id).sort((a, b) => a.localeCompare(b)),
    [registreringar],
  );
  const batch = useInbetalningarForEvent(event.id, anmalanRecordIds, aktiv);
  const grupperPerAnmalan = useMemo(
    () =>
      new Map<string, InbetalningarBatchGrupp>(
        (batch.data?.grupper ?? []).map((g) => [g.anmalanRecordId, g]),
      ),
    [batch.data],
  );
  const inbetalningarLaddar = aktiv && anmalanRecordIds.length > 0 && batch.isPending;

  return (
    <div className="flex flex-col gap-3 py-3">
      <ToggleButtonGroup
        label="Visa betalningar"
        spread
        className="bg-bg-emphasized"
        selectedKey={flik}
        onSelectionChange={(key) => setFlik(key as 'saknar' | 'klara')}
      >
        <ToggleButton id="saknar" size="sm">
          {`Saknar betalning (${saknar.length})`}
        </ToggleButton>
        <ToggleButton id="klara" size="sm">
          {`Klara (${klara.length})`}
        </ToggleButton>
      </ToggleButtonGroup>
      {deadline && (
        <p
          data-testid="betalning-deadline"
          className={`inline-flex items-center gap-1.5 self-start rounded-full bg-surface px-2.5 py-1 text-small ${deadline.cls}`}
        >
          <Clock aria-hidden="true" size={14} />
          {deadline.text}
        </p>
      )}
      {prisOkant && flik === 'saknar' && lista.length > 0 && (
        // EN gång, på eventnivå — se docblocket § PRISET SAKNAS. Ordvalet är
        // inkorgens och personkortets ("Pris saknas i basen").
        <MessageBox intent="warning" title="Pris saknas i basen">
          Beloppen kan inte räknas fram förrän eventet har ett pris.
        </MessageBox>
      )}
      {oppna.isError && (
        // ETT fel för hela ytan, inte ett per person: beloppen kommer ur ett
        // enda anrop, så de saknas för alla eller ingen. Loggen och flikarna
        // står kvar — de läser basen, inte Postgres.
        <MessageBox
          intent="error"
          title="Beloppen kunde inte hämtas"
          actions={
            <Button intent="secondary" size="sm" onPress={() => void oppna.refetch()}>
              Försök igen
            </Button>
          }
        >
          Kontrollera att du är uppkopplad och försök igen.
        </MessageBox>
      )}
      {batch.isError && (
        // [TASK-438] Samma form och samma ord som `InbetalningsLista.tsx`
        // (TASK-346.7.1: Gunilla-klar text, aldrig felmeddelandet rakt ut).
        // ETT fel för hela ytan: inbetalningarna kommer ur ett enda anrop.
        // Utskicken i loggen står kvar — de läser basen, inte Postgres.
        <MessageBox
          intent="error"
          title="Inbetalningarna kunde inte hämtas"
          actions={
            <Button intent="secondary" size="sm" onPress={() => void batch.refetch()}>
              Försök igen
            </Button>
          }
        >
          Kontrollera att du är uppkopplad och försök igen.
        </MessageBox>
      )}
      {lista.length > 0 ? (
        // Korten separeras av LUFT, inte av hårstreck: när varje person bär
        // en egen kortyta blir en avdelare emellan en andra gräns runt samma
        // sak (DetaljGrupp-formen på anmälnings-sidan har samma gap-4 mellan
        // grupperna).
        <ul className="flex flex-col gap-4">
          {lista.map((r) => (
            <BetalningsPersonRad
              key={r.id}
              registration={r}
              rad={raderPerAnmalan.get(r.id) ?? null}
              klar={flik === 'klara'}
              prisOkant={prisOkant}
              laddar={laddar}
              inbetalningar={grupperPerAnmalan.get(r.id) ?? null}
              inbetalningarLaddar={inbetalningarLaddar}
            />
          ))}
        </ul>
      ) : (
        <p className="py-2 text-small text-text-secondary">
          {flik === 'saknar'
            ? 'Alla anmälda har betalat.'
            : 'Ingen är klar med båda betalningarna ännu.'}
        </p>
      )}
    </div>
  );
}
