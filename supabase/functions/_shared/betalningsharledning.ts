// Betalningsfackens HÄRLEDNING — TASK-346.4 AC #2, ADR-128 beslut 2.
//
// REN MODUL, TRANSITIVT DENO-FRI (importerar bara `betalningsbelopp.ts`, som
// själv är importfri) → Node-typkollad via `tsconfig.edge-shared.json` och
// hermetiskt testbar i `api-pure` (`tests/api/betalningsharledning.test.ts`).
//
// ═══════════════════════════════════════════════════════════════════════════
// REGELN, ORDAGRANT UR ADR-128 BESLUT 2
// ═══════════════════════════════════════════════════════════════════════════
//   "Anmälningsavgift och Slutbetalning är inte något Lotta bockar i. De
//    räknas ut ur summan av inbetalningarna mot priset:
//      - avgiften är klar när summan når anmälningsavgiftens pris,
//      - allt är klart när summan når hela priset,
//      - oavsett i vilken ordning och i hur många poster pengarna kom,
//      - en föreläsning har ett pris utan fack.
//    `Avtalat pris` per anmälan (frivilligt, förvalt = eventets pris) vinner
//    över eventets pris när Lotta gett rabatt eller par-pris."
//
// Tre egenskaper faller ut ur formuleringen och är värda att namnge, för de
// är precis de som ett test måste kunna fälla:
//
//   1. HÄRLEDNINGEN ÄR EN FUNKTION AV SUMMAN, INTE AV HISTORIKEN. Ordningen
//      mellan posterna kan strukturellt inte spela roll, eftersom bara
//      summan går in. Det är varför "1500 först, sedan 1000" och "1000
//      först, sedan 1500" ger samma utfall utan en enda rad kod som handlar
//      om ordning.
//   2. "ALLT KLART" IMPLICERAR "AVGIFT KLAR". Om hela priset är betalt är
//      avgiften betald, även när avgiftens pris är OKÄNT. Utan den
//      implikationen hade en fullbetald anmälan utan ifylld
//      `Anmälningsavgift (kr)` visat "avgift ej mottagen" — en synlig
//      motsägelse i Lottas vy.
//   3. ETT OKÄNT PRIS GER ETT OKÄNT FACK, ALDRIG "EJ MOTTAGEN". Ett fack
//      vars gräns saknas kan inte avgöras, och att gissa "Ej mottagen" hade
//      skrivit en osanning in i basen. `null` betyder "rör inte fältet".
//
// ═══════════════════════════════════════════════════════════════════════════
// NOLL ÄR ETT SATT PRIS — SAMMA FÄLLA SOM `Saknas (kr)`-FORMELN GICK I
// ═══════════════════════════════════════════════════════════════════════════
// `TASK-346.2` runda 2 mätte den: Airtables `OR()`/`IF()` läser talet 0 som
// falskt, precis som JavaScript, och den ursprungliga formeln behandlade
// därför ett explicit 0-pris (gratis-/comp-event, avtalat 0-pris) som "inget
// pris känt" (`data-model.md` § RUNDA 2-FIX, fall iii och iv). Samma fälla
// gäller ordagrant här. Därför prövas priset ALLTID med `!== null`, aldrig
// med sanningsvärde — och `avtalatPris: 0` VINNER över eventets pris.

import { summeraKronor } from './betalningsbelopp.ts';

/**
 * Valfältens värden på Anmälningar, VERBATIM ur basens schema
 * (`data-model.md` § Anmälningar: `Anmälningsavgift` `fldJtKQ3qLxRKOvR6`
 * har Mottagen/Ej mottagen; `Slutbetalning` `fldIImadnJUZHr5Qh` har
 * Mottagen/Ej mottagen/`Ej relevant (för föreläsningar)`).
 *
 * PARENTESEN I FÖRELÄSNINGSVÄRDET ÄR INTE VALFRI. `data-model.md` § Kända
 * fällor 52 dokumenterar vad som händer när någon kortar det till
 * `"Ej relevant"`: basens egen formel `Deadline slutbetalning` gör exakt det,
 * dess likhetstest matchar därför aldrig, och undantagsgrenen har varit död
 * kod sedan den skrevs. Ett skrivfel här hade gett ett Airtable-fel Lotta
 * ser, inte ett fel vi ser.
 */
export const ANMALNINGSAVGIFT_VARDEN = ['Mottagen', 'Ej mottagen'] as const;
export const SLUTBETALNING_VARDEN = [
  'Mottagen',
  'Ej mottagen',
  'Ej relevant (för föreläsningar)',
] as const;

export type AnmalningsavgiftVarde = (typeof ANMALNINGSAVGIFT_VARDEN)[number];
export type SlutbetalningVarde = (typeof SLUTBETALNING_VARDEN)[number];

/** Eventtypen som avgör om anmälan har fack alls (ADR-128 beslut 2). */
export const FORELASNING = 'Föreläsning';

/**
 * Prisbilden för EN anmälan. Alla fyra fälten kan vara `null` — basen
 * garanterar inget av dem, och härledningen måste klara varje kombination
 * utan att gissa.
 */
export type Prisbild = {
  /** `Anmälningar.Avtalat pris (kr)` — vinner över eventets pris NÄR SATT, 0 inkluderat. */
  avtalatPris: number | null;
  /** `Eventplanering.Pris (kr)`, med `Eventinnehåll.Pris (kr)` som standard. */
  eventPris: number | null;
  /** `Eventplanering.Anmälningsavgift (kr)`, med Eventinnehållets som standard. */
  anmalningsavgift: number | null;
  /** `Eventplanering.Typ` (selectName) — `Föreläsning` saknar fack. */
  eventTyp: string | null;
};

/** EN inbetalnings bidrag till summan. Fler fält behövs inte för härledningen. */
export type InbetalningsBidrag = {
  belopp: number;
  /** Bara `aktiv` räknas — en makulerad post är rättad, inte betald. */
  status: 'aktiv' | 'makulerad';
};

export type Harledning = {
  /** Summan av de AKTIVA posterna, i kronor. Negativa poster (återbetalningar) drar ned den. */
  summa: number;
  /** Priset som gäller: avtalat när satt, annars eventets. `null` = okänt. */
  gallandePris: number | null;
  /** Gränsen för att avgiften ska räknas klar. För föreläsning: hela priset. `null` = okänd. */
  avgiftsgrans: number | null;
  /**
   * `gallandePris - summa`, eller `null` när priset är okänt.
   *
   * NORMALT samma tal som basens `Saknas (kr)` — men INTE per definition, och
   * avvikelsen har två oberoende källor (granskningsfynd runda 1):
   *
   *   1. FÄRSKHET. Basens formel räknar på SPEGELVÄRDET `Summa inbetalt (kr)`;
   *      detta tal räknas på Postgres-raderna. Släpar spegeln skiljer de sig
   *      tills nästa lyckade spegelskrivning (ADR-128 § Konsekvenser).
   *   2. PRISKÄLLA. Basens formel läser `Avtalat pris (kr)` och lookupen
   *      `Pris (kr) (from Event)` — alltså EVENTETS pris, aldrig
   *      Eventinnehåll-standarden. `gallandePris` här faller dessutom tillbaka
   *      på standarden (`valjPris`, tre nivåer). För ett event vars pris bara
   *      finns i standarden är basens tal BLANK medan detta är satt.
   *
   * Använd detta tal för appens egna beslut; basens för att förstå vad Lottas
   * vyer visar.
   */
  saknas: number | null;
  avgiftKlar: boolean;
  alltKlart: boolean;
  arForelasning: boolean;
  /** Värdet att spegla till `Anmälningar.Anmälningsavgift`, eller `null` = rör inte fältet. */
  anmalningsavgiftVarde: AnmalningsavgiftVarde | null;
  /** Värdet att spegla till `Anmälningar.Slutbetalning`, eller `null` = rör inte fältet. */
  slutbetalningVarde: SlutbetalningVarde | null;
};

/**
 * Härleder facken ur summan mot priset. REN — inga sidoeffekter, ingen
 * klocka, ingen I/O. Anropas av `registrera-inbetalning`, av
 * `hantera-inbetalning` (radera/makulera räknar om samma sak) och av
 * `hamta-inbetalningar`.
 */
export function harledBetalning(
  inbetalningar: readonly InbetalningsBidrag[],
  pris: Prisbild,
): Harledning {
  const summa = summeraKronor(
    inbetalningar.filter((post) => post.status === 'aktiv').map((post) => post.belopp),
  );

  // 0 ÄR ETT SATT PRIS — se filhuvudets § NOLL.
  const gallandePris = pris.avtalatPris !== null ? pris.avtalatPris : pris.eventPris;
  const arForelasning = pris.eventTyp === FORELASNING;

  // "En föreläsning har ett pris utan fack": det enda betalningssteget ÄR
  // hela priset, så avgiftens gräns sammanfaller med prisets.
  const avgiftsgrans = arForelasning ? gallandePris : pris.anmalningsavgift;

  const alltKlart = gallandePris !== null && summa >= gallandePris;
  // Egenskap 2 i filhuvudet: hela priset betalt ⇒ avgiften betald, även när
  // avgiftens egen gräns är okänd.
  const avgiftKlar = alltKlart || (avgiftsgrans !== null && summa >= avgiftsgrans);

  const saknas = gallandePris === null ? null : avrundaOre(gallandePris - summa);

  // Egenskap 3: okänd gräns ⇒ `null` (rör inte fältet), aldrig 'Ej mottagen'.
  //
  // VILLKORET ÄR `|| alltKlart`, INTE `|| gallandePris !== null` — och den
  // skillnaden ÄR egenskapen (granskningsfynd, runda 1). Med pris-ledet blir
  // en anmälan där HELPRISET är känt men AVGIFTENS pris saknas märkt
  // "Ej mottagen" så snart summan understiger helpriset — ett påstående om
  // ett fack vars gräns vi inte känner. Sonderingen: summa 1000, pris 2500,
  // avgift okänd ⇒ pris-ledet ger 'Ej mottagen', detta led ger `null`.
  //
  // Att `alltKlart` ändå gör facket avgörbart följer av ADR-128 beslut 2:
  // "allt är klart när summan når hela priset". Är allt betalt ÄR avgiften
  // betald — samma implikation `avgiftKlar` bär en rad ovanför, och i det
  // fallet blir värdet 'Mottagen', aldrig 'Ej mottagen'.
  const avgiftKanAvgoras = avgiftsgrans !== null || alltKlart;
  const anmalningsavgiftVarde: AnmalningsavgiftVarde | null = avgiftKlar
    ? 'Mottagen'
    : avgiftKanAvgoras
      ? 'Ej mottagen'
      : null;

  const slutbetalningVarde: SlutbetalningVarde | null = arForelasning
    ? 'Ej relevant (för föreläsningar)'
    : alltKlart
      ? 'Mottagen'
      : gallandePris !== null
        ? 'Ej mottagen'
        : null;

  return {
    summa,
    gallandePris,
    avgiftsgrans,
    saknas,
    avgiftKlar,
    alltKlart,
    arForelasning,
    anmalningsavgiftVarde,
    slutbetalningVarde,
  };
}

/**
 * Avrundar till hela ören. `2500 - 0.05` ger `2499.95` exakt, men
 * `2500.55 - 0.05` ger `2500.4999999999995` i IEEE 754 — och det talet skulle
 * skrivas rakt in i basens `Summa inbetalt (kr)`-spegel.
 */
function avrundaOre(kronor: number): number {
  return Math.round(kronor * 100) / 100;
}

/**
 * Priset som gäller för anmälan, med eventets värde som standard och
 * Eventinnehållets som standard för eventet. Härledd i KOD därför att det
 * inte finns någon lagrad länk Eventplanering→Eventinnehåll
 * (`data-model.md` § Stagingbasens additiva tillskott, raden för
 * `Eventplanering.Pris (kr)`).
 *
 * `null` faller igenom till nästa nivå; `0` gör det INTE (samma
 * noll-är-satt-regel som ovan).
 */
export function valjPris(
  perAnmalan: number | null,
  perEvent: number | null,
  standard: number | null,
): number | null {
  if (perAnmalan !== null) return perAnmalan;
  if (perEvent !== null) return perEvent;
  return standard;
}
