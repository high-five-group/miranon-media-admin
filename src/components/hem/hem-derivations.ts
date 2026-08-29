import {
  antalBehoverAtgard,
  displayName,
  inskickadTid,
} from '@/components/registrations/registration-display';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import { PaymentStatus, RegistrationStatus } from '@/domain/types/Status';

// RE-EXPORTEN AV `atgardskoText` ÄR BORTTAGEN (TASK-291 AC #3, 2026-08-23).
// Den fanns av EN anledning: `Bevakningsrad.tsx` importerade frasen härifrån
// för att slippa två importkällor för samma bevakningsrad-modul. Den
// promoverade åtgärdskö-raden bär en tvådelad copy i stället (rubrik + orsak,
// se `Bevakningsrad.tsx` § `AtgardskoRadLink`) och importerar ingenting alls
// från `registration-display.ts`. Kvarlämnad hade re-exporten varit en
// vidarekoppling utan konsument, med en kommentar som påstår ett beroende som
// inte finns. `/mer/anmalningar` importerar frasen direkt ur sin egen modul.

/**
 * [TASK-243.1] Morgonkollens härledningslogik — SKARPT DATALAGER (AC #3).
 *
 * PROMOVERAD, INTE ÅTERBYGGD (ADR-102/103): formen och formlerna är hämtade
 * ur den låsta facit-prototypen (`src/components/dev/hem-prototyp/data.ts`,
 * TASK-226, facit-manifestet `tasks/sessions/bilagor/s102-hem-konvergens/`).
 * Prototyp-substratet självt rörs INTE (ADR-102 B3) — denna fil är en
 * FRISTÅENDE kopia i produktionslagret, inte en import därifrån.
 *
 * Formlerna var i sin tur redan hämtade VERBATIM eller nästan verbatim ur
 * skarp kod innan prototypen fanns: `velNastaEvent`/`dagarKvarText` ur den nu
 * retirerade `hem/NastaEventCard.tsx`, `eventIdentitet`/`initialer` ur
 * `hem/NyaAnmalningarCard.tsx` respektive `persons/PersonsList.tsx` k13,
 * `obekraftad`/`saknar*`/14-dagars-deadlinen ur `events/atgarder/AtgardsSida.tsx`.
 * Ingen ny EF, ingen mock — allt läses ur `useDashboardEvents`/
 * `useDashboardRegistrations` (`hem/useDashboardData.ts`, ORÖRD).
 */

const DEADLINE_DAGAR = 14;
const DAG_MS = 86_400_000;

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
 * `status`-enumet (samma T14-disciplin som EventsList/NastaEventCard-facitet).
 */
export function velNastaEvent(events: Event[] | undefined, idagStartMs: number): Event | null {
  if (!events) return null;
  const kommande = events
    .filter((e) => startTid(e) >= idagStartMs)
    .sort((a, b) => startTid(a) - startTid(b));
  return kommande[0] ?? null;
}

/** Dagar-kvar-formens tre former: "Idag" / "1 dag kvar" / "N dagar kvar". */
export function dagarKvarText(startMs: number, idagStartMs: number): string {
  const dagar = Math.round((startMs - idagStartMs) / DAG_MS);
  if (dagar <= 0) return 'Idag';
  return dagar === 1 ? '1 dag kvar' : `${dagar} dagar kvar`;
}

/** Beläggningsandelen 0–100, clampad och division-säkrad. */
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
/** "9 aug" — delad av eventidentitetens metarad OCH "Dags att ringa"-radens "Påmind {kortdatum} · obetald". */
export function kortDatum(iso: string | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : KORTDATUM.format(t).replace(/\.$/, '');
}

/** ISO-tidsstämpeln → "ÅÅÅÅ-MM-DD" (badgen "Påminnelse skickad ÅÅÅÅ-MM-DD"). */
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

/** Radens event-identitet "kurs · ort · kortdatum" (klient-join). */
export function eventIdentitet(reg: Registration, event: Event | undefined): string {
  if (!reg.eventId) return 'Utan event';
  if (!event) return reg.eventNamn ?? 'Uppgift saknas';
  const namn = event.eventNamn ?? event.eventlabel ?? 'Namnlöst event';
  return [namn, event.ort, kortDatum(event.startdatum)].filter(Boolean).join(' · ');
}

/**
 * Initialerna för avatar-cirkeln — KOPIERAD med avsikt (samma per-fil-
 * duplicering husets rader redan bär, t.ex. PersonsList.tsx k13,
 * AktivitetsHistorik.tsx, AtgardsSida.tsx; den delade ytan är datalagret,
 * inte presentationsformlerna).
 */
export function initialer(namn: string): string {
  return namn
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((d) => d[0]?.toUpperCase() ?? '')
    .join('');
}

// [FLYTTAD, TASK-309.38] `fornamn()` bor nu i `@/lib/fornamn` — den delas
// sedan denna skiva med dokumentgenereringens väntetext, som annars hade
// fått ett feature→feature-beroende mot `hem/`. `Hem.tsx` importerar den
// därifrån direkt (se den filens importblock).

export interface AnmalningRad {
  reg: Registration;
  namn: string;
  identitet: string;
}

export interface AnmalningarVy {
  /** Totalt antal obekräftade — räknar-rubrikens tal. */
  total: number;
  /** Initial-lista, senast inskickade först. */
  rows: AnmalningRad[];
}

/**
 * Obekräftade anmälningar — de som väntar på bekräftelsesvep. `status ===
 * RegistrationStatus.OBEKRAFTAD`, INTE recency-utan-filter (facit-formen:
 * räknar-rubriken "N nya anmälningar att bekräfta" kräver just statusfiltret).
 */
export function obekraftadeAnmalningar(
  regs: Registration[] | undefined,
  eventsMap: Map<string, Event>,
): AnmalningarVy {
  if (!regs) return { total: 0, rows: [] };
  const obekraftade = regs
    .filter((r) => r.status === RegistrationStatus.OBEKRAFTAD)
    .sort((a, b) => inskickadTid(b) - inskickadTid(a));
  return {
    total: obekraftade.length,
    rows: obekraftade.map((reg) => ({
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
  /** Senaste påminnelse-tidsstämpeln (ISO) för just denna avgiftstyp. */
  paminnelseSkickadIso: string | null;
  deadlineMs: number;
}

export interface ForfallnaVy {
  /** Totalt antal förfallna rader (en registrering med två saknade avgifter ⇒ 2). */
  total: number;
  /** Mest förfallna (äldsta deadline) först. */
  rows: ForfallenRad[];
}

/**
 * Förfallna betalningar — "betalning saknas OCH eventstart−14 dagar
 * passerad" (AC #3). EN RAD PER AVGIFTSTYP: en registrering som saknar BÅDA
 * anmälningsavgift och slutbetalning ger två rader, en per typ.
 */
export function forfallnaBetalningar(
  regs: Registration[] | undefined,
  eventsMap: Map<string, Event>,
  nuMs: number,
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
  return { total: rader.length, rows: rader };
}

/**
 * Eventinfo-fönstret (bevakningsraden) — EGEN namngiven konstant, ALDRIG
 * delad med betalnings-deadlinen (`DEADLINE_DAGAR`, 14) eller ringtröskeln
 * (`RINGTROSKEL_DAGAR`, 7). Tre oberoende tidstal (S102 Del 10 beslut 7).
 */
export const EVENTINFO_FONSTER_DAGAR = 21;

/**
 * Ringtröskeln — en-påminnelse-modellens tredje tillstånd ("Dags att ringa")
 * tänds när SENASTE påminnelsen är minst detta gammal.
 */
export const RINGTROSKEL_DAGAR = 7;

/**
 * Bekräftad ⟺ Status har lämnat 'Obekräftad' (samma canon som
 * ORDLISTA.md "Obekräftad/Bekräftad", ur AtgardsSida.tsx `arBekraftad`).
 * Bevakningsradens definition B ("minst en bekräftad anmälan saknar
 * Deltagarinfo-stämpeln") vilar på just denna gräns.
 */
const arBekraftad = (r: Registration) => r.status !== RegistrationStatus.OBEKRAFTAD;

export type BevakningLage = 'ej-skickad' | 'eftersalantrare';

export interface EventinfoBevakningRad {
  typ: 'eventinfo';
  event: Event;
  eventNamn: string;
  /** "Startar om N dagar" — clampad till ≥0. */
  dagarTillStart: number;
  lage: BevakningLage;
  /** Antal bekräftade deltagare som saknar Deltagarinfo-stämpeln. */
  antalUtanEventinfo: number;
}

/**
 * Åtgärdskö-raden (TASK-284.4; ADR-122 beslut 7, § 22 Åtgärdskön) — den
 * ANDRA bevakningsradstypen, vid sidan av eventinfo-utskicket. Till
 * skillnad från eventinfo-raden (EN RAD PER EVENT, tidsstyrd av
 * `EVENTINFO_FONSTER_DAGAR`) är detta EN rad för HELA appen: en
 * tillståndsbunden räkning (ORDLISTA.md "Åtgärdskö"), inte en
 * per-event-observation, och den bär ingen `event`-referens — klicket
 * navigerar till åtgärdsytan i stället för att öppna ett event-scopat svep.
 * `antal` är räknat ur `Anmälningar.Eventmatchning` via `antalBehoverAtgard`
 * (AC #3) — ALDRIG en egen klientberäkning.
 */
export interface AtgardskoBevakningRad {
  typ: 'atgardsko';
  antal: number;
}

/**
 * De TVÅ bevakningsradstyperna (TASK-284.4) — en diskriminerad union så
 * `Bevakningsrad.tsx` kan rendera olika innehåll/interaktion per typ utan
 * att de två formerna blandas ihop i ett enda löst shape.
 */
export type BevakningRad = EventinfoBevakningRad | AtgardskoBevakningRad;

/**
 * Bevakningsradens statuscopy — EN delad källa per bevakningstyp.
 *
 * [TASK-241.8] "nya" ÅTERINFÖRT i eftersläntrare-formen (Marcus beslut
 * 2026-08-18, mitt i denna skivas bygge — kortets ursprungliga gräns 4 mot
 * copy-ändring UPPHÄVDES uttryckligen). Ordet ströks tyst i commit
 * `d0366271` (TASK-226 varv 4) som en platsbesparing (`truncate` klippte
 * "3 nya deltagare saknar e…" mitt i ordet vid 375px) — men SAMMA commit
 * bytte samtidigt `truncate` mot `line-clamp-2`, som löser klippningen på
 * ett annat sätt. Skälet till strykningen försvann alltså redan då, utan
 * att någon bokförde det. Grillningens beslut 4
 * (`tasks/sessions/2026-08-10-session-102.md:726-727`) motiverar ordet
 * uttryckligen: "'nya' friar Lotta från falsk glömske-signal" — utan det
 * kan Lotta läsa en oförändrad kvarstående siffra som att INGET hänt sedan
 * senast, när det i själva verket är rätt personer, bara ännu inte
 * skickat till. `ej-skickad`-formen ("Deltagarinfo saknas") är ORÖRD — endast
 * eftersläntrare-formen bär ett tal att kvalificera.
 *
 * [TASK-303 AC #4, 2026-08-23] ORDET "deltagare" STRUKET, ordet "nya" KVAR.
 * Formen är nu `"N nya saknar deltagarinfo"`. Beslutet är Marcus eget i S111
 * Del 5 och togs av ETT skäl: den promoverade radanatomin centrerar
 * dagar-pillen mot HELA raden (`Bevakningsrad.tsx` § `RadInnehall`), vilket
 * kostar undertexten kolumnbredd — den fulla formen behövde 201 px mot 171
 * tillgängliga vid 375 px, och klippning är inte ett alternativ. Marcus valde
 * kortningen framför att sätta bakgrund på siffran, med sin egen motivering:
 * ordet "nya" bär betydelsen (samma skäl som TASK-241.8 ovan), ordet
 * "deltagare" gör det inte — raden står redan under ett eventnamn i en lista
 * om deltagare.
 *
 * DETTA ÄR SYNKPUNKTEN. TASK-303 AC #4 krävde att skarpa ytan och
 * `dev/hem-prototyp/data.ts` bär SAMMA sträng; de tre varianter som fanns
 * före detta pass ("N nya deltagare saknar deltagarinfo" här, "N deltagare
 * saknar deltagarinfo" i prototyp-substratet, "N nya saknar deltagarinfo" i
 * den godkända formen) är nu EN. Prototyp-substratets kopia pekar hit i sin
 * egen docblock.
 */
export function bevakningStatusText(
  rad: Pick<EventinfoBevakningRad, 'lage' | 'antalUtanEventinfo'>,
): string {
  return rad.lage === 'ej-skickad'
    ? 'Deltagarinfo saknas'
    : `${rad.antalUtanEventinfo} nya saknar deltagarinfo`;
}

/** Dagar-kvar-formen för bevakningsraden — samma tre textformer som `dagarKvarText`. */
export function bevakningDagarText(dagarTillStart: number): string {
  if (dagarTillStart <= 0) return 'Idag';
  return dagarTillStart === 1 ? '1 dag kvar' : `${dagarTillStart} dagar kvar`;
}

/**
 * [TASK-241.8 AC #1] Bekräftade anmälningar för ETT event som saknar
 * Deltagarinfo-stämpeln (definition B ovan) — den DELADE predikat-källan
 * bakom BÅDE bevakningsradens räknare/läge (`bevakningar()` nedan) OCH
 * eventinfo-svepets mottagarurval (`svep-urval.ts` §
 * `eventinfoSvepUrval`). Extraherad hit så mottagarurvalet ALDRIG härleds
 * en andra gång — en avvikande filtrering i sändytan hade gjort
 * bevakningsradens räknare och svepets adresslista inkonsekventa.
 */
export function eventinfoMottagare(
  regs: Registration[] | undefined,
  eventId: string,
): Registration[] {
  if (!regs) return [];
  return regs.filter(
    (r) => r.eventId === eventId && arBekraftad(r) && r.deltagarinfoSkickad == null,
  );
}

/**
 * Bevakningsraden (S102 Del 10 beslut 2–4). Trigger: `idag ≥ start − 21
 * dagar` OCH minst en bekräftad anmälan saknar Deltagarinfo-stämpeln
 * (definition B). INGEN cap: varje träffande event får en rad, sorterad
 * närmast start först.
 *
 * ÖVRE GRÄNS: `start ≥ idag` (samma T14-disciplin `velNastaEvent` bygger
 * på) — annars kan ett passerat event läsas som "startar om 0 dagar"
 * (klampat av `Math.max`). Eventinfo inför ett redan passerat event är per
 * definition moot.
 */
export function bevakningar(
  events: Event[] | undefined,
  regs: Registration[] | undefined,
  idagStartMs: number,
): EventinfoBevakningRad[] {
  if (!events || !regs) return [];
  const rader: EventinfoBevakningRad[] = [];
  for (const event of events) {
    if (!event.startdatum) continue;
    const start = Date.parse(event.startdatum);
    if (Number.isNaN(start)) continue;
    if (idagStartMs < start - EVENTINFO_FONSTER_DAGAR * DAG_MS) continue; // fönstret inte öppnat än
    if (start < idagStartMs) continue; // eventet är redan igång eller förbi
    const bekraftade = regs.filter((r) => r.eventId === event.id && arBekraftad(r));
    const utanEventinfo = eventinfoMottagare(regs, event.id);
    if (utanEventinfo.length === 0) continue; // inget att bevaka
    rader.push({
      typ: 'eventinfo',
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

/**
 * Åtgärdskö-raden (TASK-284.4 AC #2/#3) — `null` vid noll träffar (samma
 * osynlig-vid-noll-kontrakt som `Bevakningsrad` bär för HELA komponenten,
 * upprepat här så konsumenten aldrig behöver kontrollera `antal === 0`
 * själv). Räknar via `antalBehoverAtgard` — det DELADE predikatet
 * `AnmalningarSida`s markör (f.d. `AnmalningarList`, `TASK-299.5`) också
 * läser, aldrig en egen klientberäkning.
 */
export function atgardskoRad(regs: Registration[] | undefined): AtgardskoBevakningRad | null {
  const antal = antalBehoverAtgard(regs);
  return antal === 0 ? null : { typ: 'atgardsko', antal };
}

export type ForfallenGrupp = 'att-paminna' | 'vantar' | 'dags-att-ringa';

/**
 * En-påminnelse-modellens tre tillstånd (S102 Del 10 beslut 7): **Att
 * påminna** (ingen stämpel) → **Väntar** (stämpel yngre än
 * `RINGTROSKEL_DAGAR`) → **Dags att ringa** (stämpel `RINGTROSKEL_DAGAR`
 * eller äldre).
 */
export function forfallenGrupp(rad: ForfallenRad, nuMs: number): ForfallenGrupp {
  if (rad.paminnelseSkickadIso == null) return 'att-paminna';
  const skickadMs = Date.parse(rad.paminnelseSkickadIso);
  if (Number.isNaN(skickadMs)) return 'att-paminna'; // oparsbart datum, samma golv som paminnelsedatumText
  return nuMs - skickadMs >= RINGTROSKEL_DAGAR * DAG_MS ? 'dags-att-ringa' : 'vantar';
}
