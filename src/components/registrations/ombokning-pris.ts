import { visaKronor } from '@/components/betalningar/belopp-inmatning';

/**
 * [TASK-368.5 / TASK-368.7] Ombokningens RENA TEXT- OCH TALLOGIK: prisbeskedets
 * tre grenar, prisskillnaden före bekräftelsen, och skälets exakta ordalydelse.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR DEN INTE BOR I `ombokning-kvitto.ts` — EN MÄTT TYP-GRÄNS, INTE SMAK
 * ═══════════════════════════════════════════════════════════════════════════
 * Funktionerna bodde i `ombokning-kvitto.ts` fram till `TASK-368.7`. Den filen
 * bär `declare module '@tanstack/react-router'`-augmenteringen för kvittots
 * `HistoryState`, och en augmentering KRÄVER att modulen går att slå upp i det
 * tsconfig-projekt som kompilerar filen. `tests/api/` kompileras under
 * `tsconfig.tests.json` (`types: ["node"]`, ingen router), så ett testimport av
 * `ombokning-kvitto.ts` fäller `tsc -b` med
 * `TS2664: Invalid module name in augmentation` — MÄTT, inte befarat, när
 * `ombokning-prisparitet.test.ts` skrevs.
 *
 * Snittet är därför detsamma som `serverfel.ts` fick i `368.5`: den rena
 * logiken bor för sig och kan prövas av en svit som inte känner React eller
 * routern, medan navigeringens typer och augmenteringen stannar i
 * `ombokning-kvitto.ts`. Ingen rad i logiken är ändrad av flytten.
 *
 * Modulen är fri från React OCH från routern — enda importen är `visaKronor`.
 */

/** Vilken betalningsväg prisskillnaden pekar mot, om någon. */
export type Prisvag = 'inbetalning' | 'aterbetalning' | null;

export type Prisbesked = {
  /** Meningen Lotta läser. Alltid en hel mening, alltid utan valuta-gissning. */
  text: string;
  vag: Prisvag;
};

/**
 * [AC #3] Prisskillnaden sagd rakt ut, i EN formulering som används både i
 * bekräftelsesteget och i kvittot efteråt — "efter bekräftelse visas SAMMA
 * text" är kortets ordalydelse, och två kopior hade kunnat glida isär.
 *
 * TECKNET ÄR SERVERNS: `prisskillnad` är `harledBetalning`s `saknas` för den
 * NYA anmälan, alltså nytt pris minus de aktiva inbetalningar som nu sitter
 * där. Positiv ⇒ personen ska betala mellanskillnaden; negativ ⇒ pengar ska
 * tillbaka; `0` ⇒ jämnt ut. Ingen egen prisregel härleds här.
 *
 * `null` PÅSTÅS ALDRIG VARA NOLL. Saknas priset (eventet har varken eget pris
 * eller en Eventinnehåll-standard) kan vi inte veta om något saknas — och
 * "samma pris" hade då varit ett påstående utan täckning. Texten säger i
 * stället att priset är okänt, och pekar mot ingen betalningsväg alls.
 */
export function prisbesked(nyttPris: number | null, prisskillnad: number | null): Prisbesked {
  if (prisskillnad === null) {
    return {
      text: 'Priset på det nya eventet är inte satt, så prisskillnaden går inte att räkna ut.',
      vag: null,
    };
  }

  const kostar = nyttPris === null ? null : `Nya eventet kostar ${visaKronor(nyttPris)} kr`;

  if (prisskillnad === 0) {
    // Kort bindestreck finns inte här, och det är inte kosmetik:
    // `scripts/check-langa-streck.mjs` (CI-wirad) fäller långt streck i varje
    // användar-synlig sträng, `TemplateElement` inkluderad. Kommatecknet bär
    // samma paus och matchar AC #3:s egen ordform ("… eller 'samma pris'").
    return { text: kostar === null ? 'Samma pris.' : `${kostar}, samma pris.`, vag: null };
  }

  const belopp = `${visaKronor(Math.abs(prisskillnad))} kr`;
  const slut =
    prisskillnad < 0 ? `${belopp} blir att återbetala.` : `${belopp} saknas på den nya anmälan.`;

  return {
    text: kostar === null ? slut.charAt(0).toUpperCase() + slut.slice(1) : `${kostar}, ${slut}`,
    vag: prisskillnad < 0 ? 'aterbetalning' : 'inbetalning',
  };
}

/**
 * [TASK-368.7 AC #2] Prisskillnaden FÖRE bekräftelsen, räknad klient-sidigt ur
 * det nya eventets pris minus de aktiva inbetalningar som kommer att följa med.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SAMMA FORMEL SOM SERVERN — LED FÖR LED, INTE "ungefär samma"
 * ═══════════════════════════════════════════════════════════════════════════
 * Servern svarar EFTER bekräftelsen med `harledBetalning(...).saknas` för den
 * NYA anmälan (`rebook-registration/index.ts` § `prisskillnad`), vilket i
 * `_shared/betalningsharledning.ts` är exakt:
 *
 *     saknas = Math.round((gallandePris - summa) * 100) / 100
 *
 * De två indataleden är parvis samma tal, och det är MÄTT mot koden, inte
 * antaget:
 *
 *   1. `gallandePris` = `valjPris(anmalanAvtalatPris, eventPris, standard)`.
 *      Den nya anmälan skapas av `skapaAnmalanRad` UTAN `Avtalat pris (kr)`
 *      (`rebook-registration/index.ts` § Steg 1 — fältet står inte i anropet),
 *      så nivå 1 är `null` och priset ÄR eventets. `Event.pris` bär samma
 *      `valjPris(null, eventPris, standard)` (`_shared/event-map.ts`
 *      § EVENTETS PRIS), alltså samma två nivåer i samma ordning.
 *   2. `summa` = `summeraKronor(aktiva belopp)` för den nya anmälan efter
 *      flytten. Steg 2 flyttar VARJE aktiv inbetalning från den gamla
 *      (`.eq('status','aktiv')`) och den nyskapade raden har inga egna, så
 *      talet är den gamla anmälans aktiva summa. Klienten läser exakt det ur
 *      `Inbetalningslista.spegel.summaPostgres`, som `hamta-inbetalningar`
 *      räknar med SAMMA uttryck (`summeraKronor` över `status === 'aktiv'`).
 *
 * AVRUNDNINGEN SPEGLAR SERVERNS `avrundaOre`, INTE `summeraKronorKlient`. De
 * är olika funktioner: `summeraKronorKlient([a, -b])` avrundar VARJE term för
 * sig, `avrundaOre(a - b)` avrundar differensen. På halva ören ger de olika
 * svar (`0.005 - 0.005` ⇒ `0.01` respektive `0`), och det är serverns tal som
 * ska återges. Pariteten är tvåsidigt bevisad i
 * `tests/api/ombokning-prisparitet.test.ts`, som kör samma korpus genom
 * `harledBetalning` och denna funktion.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * `null` BETYDER "GÅR INTE ATT RÄKNA" — OCH ANROPAREN MÅSTE VETA VILKET LED
 * ═══════════════════════════════════════════════════════════════════════════
 * Funktionen ger `null` när ENDERA leden saknas. `prisbesked(pris, null)` säger
 * *"Priset på det nya eventet är inte satt"* — sant när PRISET saknas, FALSKT
 * när priset är känt men summan inte är hämtad. Anroparen visar därför beskedet
 * först när summan är känd (`OmbokningsSteg` § PRISBESKEDET), i stället för att
 * låta en okänd summa se ut som ett osatt pris.
 *
 * KÄNDA KANTER, öppet deklarerade i stället för dolda:
 *   • ÅTERUPPTAGNING (samma ombokning körd två gånger, `beslutaOmbokning`
 *     § ADOPTION): serverns `summa` är då mål-anmälans EGNA inbetalningar, som
 *     kan skilja sig från den gamlas. Beskedet före bekräftelsen beskriver
 *     första körningen, som är den Lotta står inför.
 *   • Sätter någon ett `Avtalat pris (kr)` på den nya anmälan EFTER
 *     ombokningen vinner det (nivå 1) — men det kan per definition inte ha
 *     hänt före bekräftelsen, eftersom anmälan inte finns än.
 */
export function prisskillnadFore(
  nyttPris: number | null,
  summaSomFoljerMed: number | null,
): number | null {
  if (nyttPris === null || summaSomFoljerMed === null) return null;
  return Math.round((nyttPris - summaSomFoljerMed) * 100) / 100;
}

/**
 * Skälets text, EXAKT som servern kommer att skriva den — mål-delen av
 * `byggOmbokningsrad` (`supabase/functions/_shared/rebook-registration.ts`
 * § `byggOmbokningsmal`), utan dess datum-/aktörsstämpel.
 *
 * KÄLLPARITETEN ÄR MÄTT, INTE ANTAGEN (2026-09-03): serverns `lasEvent` läser
 * `namn` ur `selectName(f['Event (source)'])` och `startdatum` ur
 * `f['Startdatum']`; klientens `Event.eventNamn`/`startdatum` kommer ur
 * `_shared/event-map.ts` § `mapEventBas` — SAMMA två Airtable-fält, samma
 * coercion. Därför kan förhandsvisningen vara en sann utsaga om vad som
 * kommer att stå i Noteringen, i stället för en ungefärlig.
 *
 * DATUMET LÄMNAS I ISO-FORM med avsikt: serverns rad bär `Startdatum` rått
 * (`byggOmbokningsmal` gör ingen formatering), och ett svenskt långdatum här
 * hade gjort förhandsvisningen visuellt trevligare och sakligt falsk.
 */
export function ombokningsskal(eventNamn: string | null, startdatum: string | null): string {
  const namn = eventNamn?.trim() ? eventNamn.trim() : 'okänt event';
  const datumDel = startdatum?.trim() ? `, ${startdatum.trim()}` : '';
  return `Ombokad till ${namn}${datumDel}`;
}
