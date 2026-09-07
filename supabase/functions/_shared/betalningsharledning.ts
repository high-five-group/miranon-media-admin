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
//   3. ETT OKÄNT PRIS GER ETT OKÄNT FACK — UTOM VID `summa <= 0` MED KÄNT
//      HELPRIS. Ett fack vars gräns saknas kan i regel inte avgöras, och att
//      gissa "Ej mottagen" hade skrivit en osanning in i basen; `null`
//      betyder "rör inte fältet". Undantaget kräver att BÅDA villkoren
//      håller — `summa <= 0` OCH `gallandePris !== null` — och det är ingen
//      gissning: en OKÄND gräns är härledbart STRIKT POSITIV (0 är ett SATT
//      pris, se § NOLL; ett pris kan inte vara negativt), alltså gäller
//      `summa <= 0 < gräns` utan att någon vet vad gränsen är. Kravet på
//      känt helpris är däremot en MEDVETEN avgränsning som sanningen INTE
//      kräver: saknas helpriset rörs facket inte ens vid summa 0. Undantaget
//      uttömmer egenskapen, det bryter den inte. Båda halvorna — och varför
//      avgränsningen finns — står i § SUMMA NOLL.
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

// ═══════════════════════════════════════════════════════════════════════════
// SUMMA NOLL MÅSTE KUNNA SKRIVA TILLBAKA — ASYMMETRIN SOM GAV SPÖKFLAGGOR
// ═══════════════════════════════════════════════════════════════════════════
// `TASK-372` mätte felet i prod 2026-09-03: tre anmälningar på RIM 3 Rönninge
// (`recLJ3SuZz8A1UEND`) fick helpriset 2 500 kr registrerat och sedan RADERAT
// via appen. Efteråt stod `Summa inbetalt (kr)` på 0 med noll rader i
// `public.inbetalningar` — men `Anmälningsavgift` stod kvar på `Mottagen`.
// Eventet saknade `Anmälningsavgift (kr)`.
//
// MEKANIKEN, HELT INOM DENNA FIL: helpriset täckte avgiften vid
// registreringen (egenskap 2 ⇒ `Mottagen`). Vid raderingen var summan 0,
// alltså under helpriset, och avgiftens EGEN gräns okänd — egenskap 3 i sin
// GAMLA form gav då `null`, och `skrivSpegel` hoppar över `null` (den rensar
// inte, `betalningar-bas.ts`). Flaggan kunde alltså flippas TILL `Mottagen`
// men aldrig tillbaka. En ENVÄGS-funktion, och det är felet: en flagga appen
// självt satte genom en inbetalning måste kunna följa med när inbetalningen
// försvinner.
//
// FIXEN ÄR EN HÄRLEDNING, INGEN GISSNING — se egenskap 3 ovan: en okänd
// gräns är strikt positiv, så `summa <= 0` understiger den bevisligen.
// `<= 0` och inte `=== 0`, därför att en nettonegativ summa (återbetalning
// större än inbetalningarna) bär exakt samma sanning.
//
// ═══ VARFÖR UNDANTAGET DESSUTOM KRÄVER ETT KÄNT HELPRIS ═══
// Sanningsargumentet ovan behöver INTE `gallandePris !== null` — det håller
// för varje anmälan med summa 0. Villkoret är alltså medvetet SMALARE än vad
// sanningen tillåter, och skälet är data som inte bor i Postgres:
//
//   305 historiska anmälningar bär Lottas MANUELLA `Mottagen`-flaggor utan
//   en enda inbetalningsrad (backfillen kunde inte prissätta dem —
//   `docs/reference/backfill-inbetalningar.md`). För dem är basens flagga
//   enda källan; summan 0 betyder "aldrig registrerad i det nya systemet",
//   inte "aldrig betald".
//
// Med helpriset KÄNT skriver härledningen redan i dag `Ej mottagen` i
// `slutbetalningVarde` för samma anmälan (ternären längst ned prövar exakt
// `gallandePris !== null`). Undantaget lägger alltså INTE till en ny yta där
// appen uttalar sig — det gör avgiftsfacket lika avgörbart som
// slutbetalningsfacket redan är, vid summa 0. Är helpriset OKÄNT rörs
// ingetdera facket, precis som förut.
//
// Samma linje som backfillen redan drar: en anmälan utan känt pris klassas
// som AVVIKELSE med koden `pris-okant` (`BESLUT.avvikelse`, inte
// `BESLUT.hoppa` — `scripts/backfill-inbetalningar.mjs`, låst av D8 i
// `scripts/test-backfill-inbetalningar.mjs`) och hamnar i `plan.avvikelser`.
// Spegel-loopen kör bara över `plan.backfill ∪ plan.redanBackfillad`, så
// varken avvikelserna eller de hoppade skrivs. Under ADR-bar (en rad, ingen ny
// yta, ingen ny kolumn) — beslutet bokförs här och i `data-model.md`
// § Kända fällor 54, inte i en egen ADR.

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
  // ANDRA LEDET (`|| alltKlart`) ÄR OPERATIVT OÅTKOMLIGT — SAGT RAKT UT
  // (granskningsfynd runda 2). Är `alltKlart` sant är `avgiftKlar` sant
  // (raden ovanför), och då tas 'Mottagen'-grenen i ternären nedan innan
  // `avgiftKanAvgoras` någonsin får betydelse. Ledet ändrar alltså inget
  // utfall i dag, och det är INTE det som gör beteendet rätt — det gör
  // ternärens ordning.
  //
  // Det står kvar ändå, som DOKUMENTATION OCH FÖRSVAR I DJUPLED: invarianten
  // "allt betalt ⇒ avgiften avgörbar" (ADR-128 beslut 2, "allt är klart när
  // summan når hela priset") blir läsbar HÄR, vid predikatet den handlar om,
  // i stället för att bara vara en följd av två grenars inbördes ordning tre
  // rader ned. Skrivs ternären om — och den ordningen är lätt att röra utan
  // att märka vad man rör — bär predikatet fortfarande regeln.
  //
  // Alternativet vore att stryka ledet och lita på ordningen plus sviten
  // (`betalningsharledning.test.ts` § 6 låser båda riktningarna). Det hade
  // varit korrekt men tystare; valet är bokfört, inte råkat.
  //
  // TREDJE LEDET (`summa <= 0 && gallandePris !== null`) ÄR `TASK-372`:s FIX
  // — hela härledningen och avgränsningen står i filhuvudet § SUMMA NOLL, och
  // den läses innan detta rörs. I korthet: en okänd gräns är strikt positiv,
  // så summa 0 understiger den BEVISLIGEN — `Ej mottagen` är därmed härlett,
  // inte gissat, och egenskap 3 är intakt. `gallandePris !== null` är den
  // medvetet smalare avgränsningen som skyddar de 305 historiska anmälningar
  // vars `Mottagen` är Lottas manuella, inte appens.
  //
  // ORDNINGEN I TERNÄREN BÄR FORTFARANDE 0-PRISET: ett gratisevent har
  // `alltKlart` sant redan vid summa 0, så `avgiftKlar`-grenen tas FÖRE detta
  // predikat får betydelse och facket blir `Mottagen`, inte `Ej mottagen`.
  const avgiftKanAvgoras =
    avgiftsgrans !== null || alltKlart || (summa <= 0 && gallandePris !== null);
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

/**
 * [TASK-367 review runda 1, FYND 1] Räknas raden som FÖRFALLEN i
 * `hamta-oppna-betalningar`s toppnivåfält `forfallna`?
 *
 * ADR-128 beslut 2, ordagrant: "FÖRFALLEN = slutbetalningens deadline
 * passerad." — men den meningen står i sammanhanget "ÖPPEN BETALNING =
 * `Saknas (kr) > 0` OCH status ≠ Avbokad/Ombokad … FÖRFALLEN = …": förfallen
 * är ett attribut HOS EN ÖPPEN BETALNING, inte ett fristående datumvillkor.
 * En anmälan där inget längre saknas är per definition inte en öppen
 * betalning, och kan därför strukturellt inte vara förfallen — oavsett hur
 * gammalt slutbetalningsdatumet är.
 *
 * VARFÖR DENNA FUNKTION FINNS EFTER TASK-367: innan dess kom VARJE rad
 * `hamta-oppna-betalningar` räknade ur `OPPEN_BETALNING_FILTER`
 * (`{Saknas (kr)} > 0`), så `saknas > 0` höll IMPLICIT för varje rad
 * `forfallna`-räkningen såg. TASK-367s `raderExtra` (fullbetalda
 * anmälningar med ett oskickat kvitto, hämtade UTANFÖR det filtret) bröt
 * det antagandet — utan denna vakt hade en fullbetald anmälan med ett
 * gammalt slutbetalningsdatum blåst upp `forfallna` felaktigt.
 *
 * `saknas === null` (basen kunde inte räkna fram ett pris) räknas INTE som
 * förfallen — samma fail-open-princip som `saknas <= 0`: ett okänt belopp
 * är inte ett bevisat skuldbelopp.
 */
export function raknasSomForfallen(
  saknas: number | null,
  deadline: string | null,
  idag: string,
): boolean {
  if (saknas === null || saknas <= 0) return false;
  if (deadline === null) return false;
  return deadline.slice(0, 10) < idag;
}
