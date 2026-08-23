import { displayName, inskickadTid } from '@/components/registrations/registration-display';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import { PaymentStatus, RegistrationStatus } from '@/domain/types/Status';

/**
 * [PROTOTYPE-DATA, TASK-226] Delad härledningslogik för hem-vyns divergens-
 * prototyp (V1 ro · V2 kontroll · V3 skönhet — /dev/hem-prototyp). SAMMA data
 * i alla tre varianter, bara ytan skiljer — annars mäter Marcus tre olika
 * datamodeller i stället för tre estetiska riktningar (S102 Del 8-kvittensen).
 *
 * Formlerna nedan är hämtade VERBATIM eller nästan verbatim ur skarp kod:
 * `velNastaEvent`/`dagarKvarText` ur `hem/NastaEventCard.tsx`,
 * `eventIdentitet`/`initialer` ur `hem/NyaAnmalningarCard.tsx` respektive
 * `persons/PersonsList.tsx` k13, `obekraftad`/`saknar*`/14-dagars-deadlinen
 * ur `events/atgarder/AtgardsSida.tsx`. Ingen ny EF, ingen mock — allt läses
 * ur `useDashboardEvents`/`useDashboardRegistrations` (hem/useDashboardData.ts)
 * som redan hämtar riktig staging-data.
 *
 * Throwaway-kontraktet (ADR-102/103): filen bor UNDER dev-routen och rivs med
 * förlorarna. Vinnarens konvergens skriver facitet om från grunden — den
 * absorberar ingen kod härifrån rakt av.
 */

const DEADLINE_DAGAR = 14;
export const DAG_MS = 86_400_000;

/** Lokal dagsstart (midnatt) för ett godtyckligt ms-ögonblick. */
export function dagsStart(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startTid(e: Event): number {
  if (!e.startdatum) return Number.POSITIVE_INFINITY;
  const t = new Date(e.startdatum).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

/**
 * "Nästa kommande" — TEMPORALT (startdatum ≥ idag), ALDRIG via
 * `status`-enumet (samma T14-disciplin som NastaEventCard.tsx-facitet).
 */
export function velNastaEvent(events: Event[] | undefined, idagStartMs: number): Event | null {
  if (!events) return null;
  const kommande = events
    .filter((e) => startTid(e) >= idagStartMs)
    .sort((a, b) => startTid(a) - startTid(b));
  return kommande[0] ?? null;
}

/** Dagar-kvar-pillens tre former: "Idag" / "1 dag kvar" / "N dagar kvar" (NastaEventCard.tsx-facit). */
export function dagarKvarText(startMs: number, idagStartMs: number): string {
  const dagar = Math.round((startMs - idagStartMs) / DAG_MS);
  if (dagar <= 0) return 'Idag';
  return dagar === 1 ? '1 dag kvar' : `${dagar} dagar kvar`;
}

/** Beläggningsandelen 0–100, clampad och division-säkrad (NastaEventCard.tsx-facit). */
export function belaggningAndel(belagda: number, maxPlatser: number | null): number {
  if (maxPlatser == null || maxPlatser <= 0) return 0;
  return Math.min(100, Math.round((belagda / maxPlatser) * 100));
}

export function eventsById(events: Event[] | undefined): Map<string, Event> {
  const m = new Map<string, Event>();
  for (const e of events ?? []) m.set(e.id, e);
  return m;
}

const KORTDATUM = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' });
/**
 * [TASK-226 konvergensvarv 2, punkt 2] EXPORTERAD sedan varv 2 — samma
 * formel ("9 aug") återanvänds av "Dags att ringa"-gruppens "Påmind {kortdatum}
 * · obetald"-copy (Marcus ordagrant, S102 Del 10 beslut 8), i stället för en
 * ny parallell formatterare.
 */
export function kortDatum(iso: string | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : KORTDATUM.format(t).replace(/\.$/, '');
}

/**
 * [TASK-226 konvergensvarv 1, punkt 4] ISO-tidsstämpeln → "ÅÅÅÅ-MM-DD"
 * (badgen "Påminnelse skickad ÅÅÅÅ-MM-DD" i V1 — `sv-SE` med explicita
 * `2-digit`-alternativ, inte locale-default, så månad/dag alltid är
 * nollutfyllda). Null eller oparsbar sträng → null, aldrig ett kraschat
 * datum i UI:t.
 */
const PAMINNELSEDATUM = new Intl.DateTimeFormat('sv-SE', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
export function paminnelsedatumText(iso: string | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : PAMINNELSEDATUM.format(t);
}

/** Radens event-identitet "kurs · ort · kortdatum" (NyaAnmalningarCard.tsx-facit, klient-join). */
export function eventIdentitet(reg: Registration, event: Event | undefined): string {
  if (!reg.eventId) return 'Utan event';
  if (!event) return reg.eventNamn ?? 'Uppgift saknas';
  const namn = event.eventNamn ?? event.eventlabel ?? 'Namnlöst event';
  return [namn, event.ort, kortDatum(event.startdatum)].filter(Boolean).join(' · ');
}

/**
 * Initialerna för avatar-cirkeln (PersonsList.tsx k13-facit, KOPIERAD med
 * avsikt — samma per-fil-duplicering husets rader redan bär; den delade ytan
 * är datalagret, inte presentationsformlerna).
 */
export function initialer(namn: string): string {
  return namn
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((d) => d[0]?.toUpperCase() ?? '')
    .join('');
}

export interface AnmalningRad {
  reg: Registration;
  namn: string;
  identitet: string;
}

export interface AnmalningarVy {
  /** Totalt antal obekräftade — räknar-rubrikens tal (kan vara > rows.length). */
  total: number;
  /** Initial-lista, senast inskickade först. */
  rows: AnmalningRad[];
}

/**
 * Obekräftade anmälningar — de som väntar på bekräftelsesvep. `obekraftad`
 * är hämtad ur AtgardsSida.tsx (`r.status === RegistrationStatus.OBEKRAFTAD`);
 * hem-kortets facit (`NyaAnmalningarCard`) är recency-baserat UTAN
 * status-filter — divergens-prototypens räknar-rubrik ("N nya anmälningar
 * att bekräfta") kräver just statusfiltret, per S102 Del 8-kvittensen.
 */
export function obekraftadeAnmalningar(
  regs: Registration[] | undefined,
  eventsMap: Map<string, Event>,
  maxRows: number,
): AnmalningarVy {
  if (!regs) return { total: 0, rows: [] };
  const obekraftade = regs
    .filter((r) => r.status === RegistrationStatus.OBEKRAFTAD)
    .sort((a, b) => inskickadTid(b) - inskickadTid(a));
  return {
    total: obekraftade.length,
    rows: obekraftade.slice(0, maxRows).map((reg) => ({
      reg,
      namn: displayName(reg),
      identitet: eventIdentitet(reg, reg.eventId ? eventsMap.get(reg.eventId) : undefined),
    })),
  };
}

const saknarAnmalningsavgift = (r: Registration) =>
  r.anmalningsavgift === PaymentStatus.EJ_MOTTAGEN;
const saknarSlutbetalning = (r: Registration) => r.slutbetalning === PaymentStatus.EJ_MOTTAGEN;

export type Avgiftstyp = 'Anmälningsavgift' | 'Slutbetalning';

export interface ForfallenRad {
  reg: Registration;
  namn: string;
  eventNamn: string;
  avgiftstyp: Avgiftstyp;
  /** Skickat-markören: har EN påminnelse redan gått ut för just denna avgiftstyp. */
  skickat: boolean;
  /**
   * [TASK-226 konvergensvarv 1, punkt 4] Senaste påminnelse-tidsstämpeln
   * (ISO, Airtable dateTime) för just denna avgiftstyp — samma källfält
   * `skickat` deriveras ur (`Registration.paminnelseAnmalningsavgiftSkickad`
   * / `…SlutbetalningSkickad`, `docs/reference/data-model.md` rad ~120–121).
   * ADDITIVT fält: `skickat` behålls oförändrat för V2/V3 (VariantKontroll/
   * VariantBento läser bara den, ORÖRDA); V1 formaterar detta till
   * "Påminnelse skickad ÅÅÅÅ-MM-DD" via `paminnelsedatumText` nedan. Ingen
   * räkning finns i datamodellen — skriv aldrig "Påminnelse 1/2".
   */
  paminnelseSkickadIso: string | null;
  deadlineMs: number;
}

export interface ForfallnaVy {
  /** Totalt antal förfallna rader (en registrering med två saknade avgifter ⇒ 2). */
  total: number;
  /** Initial-lista, mest förfallna (äldsta deadline) först. */
  rows: ForfallenRad[];
}

/**
 * Förfallna betalningar — "betalning saknas OCH eventstart−14 dagar
 * passerad" (S102 Del 8-kvittensen, task-226 AC #1). Deadline-formeln är
 * DELAD med `AtgardsSida.tsx` `deadlineDatum` / `Betalningar.tsx`
 * `deadlineStatus` — 14 dagar före start, ALDRIG en andra kopia av regeln.
 *
 * EN RAD PER AVGIFTSTYP (task-226 AC-språket "avgiftstyp per rad"): en
 * registrering som saknar BÅDA anmälningsavgift och slutbetalning ger två
 * rader, en per typ — samma modell som AtgardsSida.tsx:s fyra parallella
 * åtgärder (`ATGARDER`), inte en sammanslagen "obetald"-boolean.
 *
 * Härlett UR BEFINTLIGA Registration-fält (`anmalningsavgift`,
 * `slutbetalning`, `paminnelseAnmalningsavgiftSkickad`,
 * `paminnelseSlutbetalningSkickad`) — ingen ny EF, ingen ny datakälla
 * (task-226 hård ram).
 */
export function forfallnaBetalningar(
  regs: Registration[] | undefined,
  eventsMap: Map<string, Event>,
  nuMs: number,
  maxRows: number,
): ForfallnaVy {
  if (!regs) return { total: 0, rows: [] };
  const rader: ForfallenRad[] = [];
  for (const reg of regs) {
    if (!reg.eventId) continue;
    const event = eventsMap.get(reg.eventId);
    if (!event?.startdatum) continue;
    const start = Date.parse(event.startdatum);
    if (Number.isNaN(start)) continue;
    const deadlineMs = start - DEADLINE_DAGAR * DAG_MS;
    if (deadlineMs > nuMs) continue; // deadline inte passerad än
    const eventNamn = event.eventNamn ?? event.eventlabel ?? 'Namnlöst event';
    const namn = displayName(reg);
    if (saknarAnmalningsavgift(reg)) {
      rader.push({
        reg,
        namn,
        eventNamn,
        avgiftstyp: 'Anmälningsavgift',
        skickat: reg.paminnelseAnmalningsavgiftSkickad != null,
        paminnelseSkickadIso: reg.paminnelseAnmalningsavgiftSkickad ?? null,
        deadlineMs,
      });
    }
    if (saknarSlutbetalning(reg)) {
      rader.push({
        reg,
        namn,
        eventNamn,
        avgiftstyp: 'Slutbetalning',
        skickat: reg.paminnelseSlutbetalningSkickad != null,
        paminnelseSkickadIso: reg.paminnelseSlutbetalningSkickad ?? null,
        deadlineMs,
      });
    }
  }
  rader.sort((a, b) => a.deadlineMs - b.deadlineMs);
  return { total: rader.length, rows: rader.slice(0, maxRows) };
}

/**
 * [TASK-226 konvergensvarv 2] Eventinfo-fönstret (bevakningsraden, punkt 1) —
 * EGEN namngiven konstant, ALDRIG delad med betalnings-deadlinen
 * (`DEADLINE_DAGAR`, 14 ovan) eller ringtröskeln (`RINGTROSKEL_DAGAR`, 7
 * nedan). Tre oberoende tidstal, var för sig Marcus-beslutade (S102 Del 10
 * beslut 7: "Tre tidskonstanter, aldrig delade tal").
 */
export const EVENTINFO_FONSTER_DAGAR = 21;

/**
 * Ringtröskeln — en-påminnelse-modellens tredje tillstånd ("Dags att ringa")
 * tänds när SENASTE påminnelsen är minst detta gammal (S102 Del 10 beslut
 * 7). Egen konstant, se ovan.
 */
export const RINGTROSKEL_DAGAR = 7;

/**
 * Bekräftad ⟺ Status har lämnat 'Obekräftad' — FACIT-MÖNSTER-STÖLD, ordagrant
 * ur `AtgardsSida.tsx` `arBekraftad` (samma canon som ORDLISTA.md
 * "Obekräftad/Bekräftad"). Bevakningsradens definition B ("minst en
 * bekräftad anmälan saknar Deltagarinfo-stämpeln") vilar på just denna
 * gräns.
 */
const arBekraftad = (r: Registration) => r.status !== RegistrationStatus.OBEKRAFTAD;

export type BevakningLage = 'ej-skickad' | 'eftersalantrare';

export interface BevakningRad {
  event: Event;
  eventNamn: string;
  /** "Startar om N dagar" — clampad till ≥0 (samma golv som `dagarKvarText`). */
  dagarTillStart: number;
  lage: BevakningLage;
  /** Antal bekräftade deltagare som saknar Deltagarinfo-stämpeln — radens
      "X" i eftersläntrar-copyn (oanvänd i `ej-skickad`-läget). */
  antalUtanEventinfo: number;
}

/**
 * [TASK-226 konvergens-varv 4, AC 1] Bevakningsradens statuscopy — EN delad
 * källa PER BEVAKNINGSTYP i stället för en lokal ternary i `VariantRo.tsx`,
 * så ett kommande facit kan låsa strängarna på ETT ställe. Marcus-
 * granskning 2026-08-16: den gamla "N nya deltagare saknar eventinfo"
 * klipptes med ellipsis i demo-läget ("3 nya deltagare saknar e…") — en
 * klippt mening är obegriplig för Lotta (Gunilla-principen). Mönster:
 * behåll betydelsen, stryk utfyllnadsordet "nya". ORDBYTET 2026-08-23
 * (TASK-303, Marcus: "Jag vänder beslutet"): canon-ordet i UI-text är
 * numera "deltagarinfo". Den gamla regeln — canon-ordet "eventinfo",
 * aldrig "deltagarinfo" i UI-text — är RIVEN, se ORDLISTA § Deltagarinfo.
 * Historiken ovan står kvar verbatim: den beskriver copyn som den löd
 * 2026-08-16.
 *
 * [TASK-303 AC #4, 2026-08-23] DIVERGENSEN ÄR UPPLÖST — ordet "nya" är
 * TILLBAKA här, och den kanoniska formulering båda ytorna nu bär är
 * `"N nya saknar deltagarinfo"`. Den strykning som motiveras ovan
 * ("stryk utfyllnadsordet 'nya'") är därmed RIVEN som regel; motiveringen
 * står kvar verbatim eftersom den beskriver ett faktiskt granskningsfynd
 * 2026-08-16, inte en gällande regel. Skälet till att den kunde rivas:
 * TASK-303:s radanatomi gav undertexten en EGEN rad, så platsbristen som
 * strykningen löste finns inte längre — och ordet "nya" bär betydelse
 * (S102-grillningens beslut 4). AUKTORITATIV KÄLLA för strängen är
 * `src/components/hem/hem-derivations.ts` § `bevakningStatusText`; denna
 * kopia hör till det frysta prototyp-substratet (ADR-102 B3) och hålls
 * synkad i stället för konsulterad.
 */
export function bevakningStatusText(
  rad: Pick<BevakningRad, 'lage' | 'antalUtanEventinfo'>,
): string {
  return rad.lage === 'ej-skickad'
    ? 'Deltagarinfo saknas'
    : `${rad.antalUtanEventinfo} nya saknar deltagarinfo`;
}

/**
 * [TASK-226 konvergens-varv 4, AC 1] Live-mätning mot en riktig browser
 * (375 px) visade att den gamla frasen "startar om N dagar" ensam redan åt
 * upp ~19 tecken av bevakningsradens ~33-teckens enradsbudget — kortare
 * copy på STATUS-delen räckte inte, hela raden (namn + dagar + status)
 * måste rymmas. Samma tre textformer `dagarKvarText` (ovan, "Nästa event"-
 * heroets facit) redan bär, men tar `BevakningRad.dagarTillStart` — ett
 * REDAN avrundat/clampat tal — direkt i stället för rå ms (samma
 * dubblerings-mönster som `EventCard.tsx`s egen lokala `dagarKvarText`-kopia
 * redan etablerar: en 3-radig vy-lokal formatterare, ingen delad modul).
 */
export function bevakningDagarText(dagarTillStart: number): string {
  if (dagarTillStart <= 0) return 'Idag';
  return dagarTillStart === 1 ? '1 dag kvar' : `${dagarTillStart} dagar kvar`;
}

/**
 * [TASK-226 konvergensvarv 2, punkt 1] Bevakningsraden (S102 Del 10 beslut
 * 2–4). Trigger: `idag ≥ start − 21 dagar` OCH minst en bekräftad anmälan
 * saknar Deltagarinfo-stämpeln (definition B — fångar eftersläntrare, inte
 * bara "inget skickat än"). INGEN cap (till skillnad från blocken ovan):
 * varje träffande event får en rad, sorterad närmast start först.
 *
 * ÖVRE GRÄNS, TILLAGD EFTER LIVE-VERIFIERING MOT STAGING (konvergensvarv 2):
 * `start ≥ idag` — samma T14-disciplin `velNastaEvent` ovan bygger på
 * ("TEMPORALT, ALDRIG via status-enumet"). Uppdraget specificerade bara den
 * NEDRE gränsen (fönstret öppnar 21 dagar före); utan en övre gräns visade
 * staging-verifieringen rader som "ZZ-Checkin-fixtur … 2025-11-01 · startar
 * om 0 dagar" — ett event nästan ett år tillbaka i tiden, klampat till 0 av
 * `Math.max` och därmed felaktigt läst som "idag". Eventinfo inför ett
 * redan passerat event är per definition moot. Bokförd i slutrapporten som
 * en avsiktlig, källbelagd precisering av uppdragets spec, inte en tyst
 * avvikelse.
 *
 * Simulerar INGEN cron/schemaläggning — utskicksmotorn byggdes aldrig (Del
 * 10 beslut 3, disk-verifierat: noll cron/schedule-referenser i repot).
 * Detta är en ren klientside-härledning över redan hämtad data, precis som
 * `forfallnaBetalningar` ovan.
 */
export function bevakningar(
  events: Event[] | undefined,
  regs: Registration[] | undefined,
  idagStartMs: number,
): BevakningRad[] {
  if (!events || !regs) return [];
  const rader: BevakningRad[] = [];
  for (const event of events) {
    if (!event.startdatum) continue;
    const start = Date.parse(event.startdatum);
    if (Number.isNaN(start)) continue;
    if (idagStartMs < start - EVENTINFO_FONSTER_DAGAR * DAG_MS) continue; // fönstret inte öppnat än
    if (start < idagStartMs) continue; // eventet är redan igång eller förbi — eventinfo inför det är moot
    const bekraftade = regs.filter((r) => r.eventId === event.id && arBekraftad(r));
    const utanEventinfo = bekraftade.filter((r) => r.deltagarinfoSkickad == null);
    if (utanEventinfo.length === 0) continue; // inget att bevaka — allt skickat eller ingen bekräftad
    rader.push({
      event,
      eventNamn: event.eventNamn ?? event.eventlabel ?? 'Namnlöst event',
      dagarTillStart: Math.max(0, Math.round((start - idagStartMs) / DAG_MS)),
      lage: utanEventinfo.length === bekraftade.length ? 'ej-skickad' : 'eftersalantrare',
      antalUtanEventinfo: utanEventinfo.length,
    });
  }
  rader.sort((a, b) => a.dagarTillStart - b.dagarTillStart);
  return rader;
}

export type ForfallenGrupp = 'att-paminna' | 'vantar' | 'dags-att-ringa';

/**
 * [TASK-226 konvergensvarv 2, punkt 2] En-påminnelse-modellens tre
 * tillstånd (S102 Del 10 beslut 7): **Att påminna** (ingen stämpel) →
 * **Väntar** (stämpel yngre än `RINGTROSKEL_DAGAR`, badgen kvar från varv 1)
 * → **Dags att ringa** (stämpel `RINGTROSKEL_DAGAR` eller äldre — "fortfarande
 * obetald" är GARANTERAT av att `rad` bara existerar för obetalda rader,
 * `forfallnaBetalningar` ovan, aldrig en andra check här).
 */
export function forfallenGrupp(rad: ForfallenRad, nuMs: number): ForfallenGrupp {
  if (rad.paminnelseSkickadIso == null) return 'att-paminna';
  const skickadMs = Date.parse(rad.paminnelseSkickadIso);
  if (Number.isNaN(skickadMs)) return 'att-paminna'; // oparsbart datum, samma golv som paminnelsedatumText
  return nuMs - skickadMs >= RINGTROSKEL_DAGAR * DAG_MS ? 'dags-att-ringa' : 'vantar';
}

/**
 * xAPI Language Map → sv-SE-strängen (samma form som `SenasteAktivitet.tsx`
 * `sprakText` — medvetet EJ delad dit, samma per-fil-duplicering som filens
 * övriga presentationsformler; den delade ytan är datalagret, inte formen).
 */
export function sprakText(map: Record<string, string>): string {
  return map['sv-SE'] ?? Object.values(map)[0] ?? '';
}

/**
 * Förnamnet ur ett fullt visningsnamn (`Greeting.tsx`-facitets `fornamn`,
 * KOPIERAD med avsikt). AVVIKELSE FRÅN GREETING.TSX, öppet bokförd: de tre
 * varianterna delar INTE sessionStorage-flaggan `mm-hem-greeted` — "Hej
 * {förnamn}" visas ALLTID, aldrig det avskalade "{förnamn}". Skälet är
 * dubbelt: (1) sessionStorage-nyckeln är delad med den skarpa /hem-sidan —
 * ett besök där innan granskningen hade tystat hälsningen på ETT håll av tre
 * varianter men inte de andra två, en ren artefakt av besöksordning, inte en
 * designskillnad Marcus ska behöva tolka; (2) varje variant äger sin egen
 * rubrik-typografi (task-226: "radikalt olika, inte tre nyanser") —
 * `Greeting`s `<h1>`-klass är hårdkodad utan prop, så komponenten själv
 * återanvänds inte, bara denna extraktionslogik.
 */
export function fornamn(helaNamnet: string): string {
  return helaNamnet.trim().split(/\s+/)[0];
}
