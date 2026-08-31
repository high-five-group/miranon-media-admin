import type { Inbetalning, Kvitto } from '@/domain/schemas';
import { visaKronor } from './belopp-inmatning';
import type { InkorgsRad } from './inkorg-harledningar';

/**
 * [TASK-346.7, PRD TASK-346 § Ytorna (beslut 10)] De RENA härledningarna för
 * de fyra ingångarna utanför inkorgen: Åtgärds-panelen, anmälans detaljvy,
 * personkortet och Hem-kortet.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR EN EGEN MODUL BREDVID `inkorg-harledningar.ts`
 * ═══════════════════════════════════════════════════════════════════════════
 * `inkorg-harledningar.ts` äger reglerna för LISTAN över öppna betalningar:
 * gruppering, rankning, sökning, belopps-knappar. Denna modul äger reglerna
 * för EN anmälan eller EN person: vad en inbetalningsrad säger om sitt
 * kvitto, i vilken ordning raderna står, och vad personkortets översikt
 * summerar. De två delar domän men inte konsumenter, och en enda fil hade
 * blivit den sortens modul man slutar läsa.
 *
 * SAMMA TVÅ DISCIPLINER SOM SYSKONMODULEN, ORDAGRANT:
 *   1. INGEN FUNKTION HÄR LÄSER KLOCKAN. Behövs "i dag" trädas det in.
 *   2. Varje regel har en NEGATIV KONTROLL i
 *      `tests/api/betalningar-ytor.test.ts` (PRD DoD #5) — ett test som visar
 *      att en trasig implementation fälls, inte bara att den rätta passerar.
 */

/* ═══════════════════════════ KVITTOTS LÄGE PER RAD ═══════════════════════════ */

export type Kvittolage = {
  /** Kvittot raden hör till, när det finns. */
  kvitto: Kvitto | null;
  /** Vad raden säger om sitt kvitto, på svenska, för Lotta. */
  text: string;
  /** Får "Visa" erbjudas? Kräver en sparad PDF, inte bara ett nummer. */
  kanVisa: boolean;
  /**
   * Får "Skicka igen" erbjudas? ENBART för ett kvitto som FAKTISKT gått i
   * väg.
   *
   * Regeln är inte kosmetisk. `skickaKvittoIgen` skickar om SAMMA PDF med
   * SAMMA nummer (`Betalningar.schema.ts` § SkickaKvittoIgenInput) och
   * förutsätter alltså att det finns ett utskickat kvitto att upprepa. Ett
   * kvitto som ännu bara är UTFÄRDAT väntar på jobbmotorn; att erbjuda
   * "Skicka igen" där hade bett Lotta att åtgärda något som redan är på väg,
   * och en FALLERAD rad köas om via `koaKvitton` — aldrig via denna väg
   * (samma skillnad `BetalningsInkorg.tsx` § SKICKA IGEN redan bokför).
   */
  kanSkickaIgen: boolean;
};

/**
 * Vad EN inbetalningsrad säger om sitt kvitto.
 *
 * MAKULERAD INBETALNING VINNER ÖVER KVITTOTS EGET LÄGE. Är posten makulerad
 * är det det Lotta behöver veta först; kvittot består och är fortfarande
 * synligt (ADR-128: "sanningen rättas utan att kvittot försvinner ur
 * bokföringen"), men raden ska inte se ut som en levande betalning.
 */
export function kvittolage(inbetalning: Inbetalning, kvitton: readonly Kvitto[]): Kvittolage {
  const kvitto = kvitton.find((k) => k.inbetalningId === inbetalning.id) ?? null;
  const harPdf = kvitto !== null && kvitto.lagringsnyckel !== null;

  if (kvitto === null) {
    return { kvitto: null, text: 'Inget kvitto', kanVisa: false, kanSkickaIgen: false };
  }

  if (kvitto.status === 'makulerat') {
    return {
      kvitto,
      text: `Kvitto ${kvitto.kvittonummer} · makulerat`,
      kanVisa: harPdf,
      kanSkickaIgen: false,
    };
  }

  if (kvitto.status === 'skickat') {
    return {
      kvitto,
      text: `Kvitto ${kvitto.kvittonummer} · skickat`,
      kanVisa: harPdf,
      // ═══ EN MAKULERAD INBETALNING SKICKAR ALDRIG OM SITT KVITTO ═══
      //
      // MÄTT I ACCEPTANSVANDRINGEN 2026-08-31, inte befarat: Cecilia Ödmans
      // två inbetalningar i staging är MAKULERADE (städade testposter), men
      // deras kvitton står kvar som `skickat` - och raden erbjöd "Skicka
      // igen". Ett tryck hade skickat om ett kvitto för en betalning som
      // inte längre gäller, till deltagaren.
      //
      // Läget är inte en bugg i datan. ADR-128 säger att kvittot BESTÅR när
      // inbetalningen makuleras ("sanningen rättas utan att kvittot
      // försvinner ur bokföringen") - ledgern ska ha kvar sin verifikation.
      // Men det som består är ARKIVET, inte en levande utskicksväg.
      //
      // `kanVisa` står därför kvar: Lotta ska kunna se vad som en gång
      // skickades, och raden säger redan "Makulerad: <skäl>" bredvid.
      kanSkickaIgen: inbetalning.status !== 'makulerad',
    };
  }

  return {
    kvitto,
    text: `Kvitto ${kvitto.kvittonummer} · väntar på att skickas`,
    kanVisa: harPdf,
    kanSkickaIgen: false,
  };
}

/* ═══════════════════════════ RADERA / MAKULERA (TASK-346.9 AC #1/#2) ═══ */

/**
 * Får RADERA erbjudas på raden? AC #1, ordagrant: "inbetalning utan kvitto
 * kan raderas från raden". `hantera-inbetalning/index.ts`s egen kontroll är
 * bredare (den stoppar bara på `kvittoId !== null`) — UI:t lägger till
 * `status === 'aktiv'` för att inte erbjuda en handling på en rad som redan
 * ÄR resolverad (raden visar redan "Makulerad: <skäl>"; ett radera-alternativ
 * bredvid hade varit en andra, motsägande väg ut ur samma post).
 */
export function kanRadera(inbetalning: Inbetalning): boolean {
  return inbetalning.kvittoId === null && inbetalning.status === 'aktiv';
}

/**
 * Får MAKULERA erbjudas på raden? AC #2, ordagrant: "inbetalning med kvitto
 * får 'Makulera' med skäl (obligatoriskt)". Samma UI-skärpning som
 * `kanRadera`: en redan makulerad rad erbjuds inte makulering igen (EF:en
 * själv fäller det försöket med 409 `redan_makulerad`, se
 * `hantera-inbetalning/index.ts`).
 */
export function kanMakulera(inbetalning: Inbetalning): boolean {
  return inbetalning.kvittoId !== null && inbetalning.status === 'aktiv';
}

/* ═══════════════════════════ RADERNAS ORDNING ═══════════════════════════ */

/**
 * Inbetalningarna i den ordning Lotta läser dem: SENAST BETALD FÖRST.
 *
 * `betalningsdatum` är det Lotta känner igen (det banken visade), och
 * `skapadNar` är när posten råkade skrivas in. Sorteringen använder därför
 * datumet i första hand och registreringsögonblicket som avgörare när två
 * poster bär samma dag — annars hade två inbetalningar samma dag legat i
 * godtycklig ordning mellan två renderingar.
 *
 * EN SAKNAD `betalningsdatum` HAMNAR SIST, inte först. Samma regel som
 * `sorteraGrupper` i syskonmodulen: ett okänt datum är inte ett tidigt
 * datum, och backfillens `Historik`-poster (ADR-128 beslut 8, "datum okänt")
 * är precis den mängden.
 */
export function sorteraInbetalningar(inbetalningar: readonly Inbetalning[]): Inbetalning[] {
  return [...inbetalningar].sort((a, b) => {
    if (a.betalningsdatum === null && b.betalningsdatum === null) {
      return b.skapadNar.localeCompare(a.skapadNar);
    }
    if (a.betalningsdatum === null) return 1;
    if (b.betalningsdatum === null) return -1;
    if (a.betalningsdatum !== b.betalningsdatum) {
      return b.betalningsdatum.localeCompare(a.betalningsdatum);
    }
    return b.skapadNar.localeCompare(a.skapadNar);
  });
}

/* ═══════════════════════════ RADENS EGEN TEXT ═══════════════════════════ */

/**
 * Radens sammanfattning: belopp, betalsätt och datum, i den ordningen.
 *
 * ÅTERBETALNINGEN SÄGS RAKT UT i stället för att visas som ett minustecken
 * ensamt. Ett `-500` i en lista med positiva tal läses lätt som ett fel;
 * ordet gör handlingen entydig (PRD berättelse 18).
 */
export function inbetalningsText(inbetalning: Inbetalning): string {
  const belopp = visaKronor(Math.abs(inbetalning.belopp));
  const ord = inbetalning.typ === 'aterbetalning' ? 'återbetalt' : 'kr';
  const huvud = inbetalning.typ === 'aterbetalning' ? `${belopp} kr ${ord}` : `${belopp} ${ord}`;
  const datum = inbetalning.betalningsdatum ?? 'datum okänt';
  return `${huvud} · ${inbetalning.betalsatt} · ${datum}`;
}

/* ═══════════════════════════ PERSONENS ÖVERSIKT ═══════════════════════════ */

export type PersonOversikt = {
  /** Anmälningar med något öppet, närmast event först. */
  rader: InkorgsRad[];
  /** Summan av det som saknas över alla öppna anmälningar. */
  saknasTotalt: number;
  /** Hur många av de öppna som är förfallna. */
  forfallna: number;
};

/**
 * Personkortets översikt: vad personen har öppet över ALLA event
 * (PRD berättelse 24, "Cecilia swishade - vad har hon öppet?").
 *
 * URVALET GÖRS PÅ ANMÄLNINGS-ID, ALDRIG PÅ NAMN. `OppenBetalning` bär inget
 * person-ID (`Betalningar.schema.ts`), och inkorgens sökläge löser det med
 * en namn-matchning som den själv kallar "en känd grovhet". Personkortet
 * behöver inte ta den grovheten: persondetaljen känner sina egna
 * anmälnings-record-ID:n (`PersonMotiveringEntry.id` och
 * `PersonHistoryEntry.registrationId`), och ett ID kan inte råka vara en
 * namne.
 *
 * `saknasTotalt` räknas ur `rad.kvar` (POSTGRES, sanningen) och faller
 * tillbaka på basens `saknas` först när priset är okänt för appen - samma
 * rangordning mellan de två källorna som resten av domänen håller
 * (ADR-128 § Konsekvenser).
 */
export function personOversikt(
  rader: readonly InkorgsRad[],
  anmalningsIds: readonly string[],
): PersonOversikt {
  const mina = new Set(anmalningsIds);
  const traffar = rader.filter((rad) => mina.has(rad.betalning.anmalanRecordId) && !rad.klar);

  const sorterade = [...traffar].sort((a, b) => {
    if (a.forfallen !== b.forfallen) return a.forfallen ? -1 : 1;
    const aDatum = a.betalning.eventStartdatum;
    const bDatum = b.betalning.eventStartdatum;
    if (aDatum === null && bDatum === null) return a.namn.localeCompare(b.namn, 'sv');
    if (aDatum === null) return 1;
    if (bDatum === null) return -1;
    return aDatum.localeCompare(bDatum);
  });

  const saknasTotalt = sorterade.reduce((summa, rad) => {
    const belopp = rad.kvar ?? rad.betalning.saknas ?? 0;
    return summa + Math.round(belopp * 100);
  }, 0);

  return {
    rader: sorterade,
    saknasTotalt: saknasTotalt / 100,
    forfallna: sorterade.filter((rad) => rad.forfallen).length,
  };
}
