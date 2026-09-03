/**
 * Ombokningens REN LOGIK (TASK-368.4, PRD TASK-368 beslut 7/8; ADR-130).
 *
 * REN MODUL — importerar ENDAST andra rena moduler (`cancel-registration.ts`,
 * `betalningsbelopp.ts`). Ingen Deno-global, ingen fjärr-import, ingen I/O.
 * Samma form och samma skäl som `_shared/cancel-registration.ts`s filhuvud
 * beskriver: den mest felbenägna delen av skivan (tillståndsbeslutet som bär
 * idempotensen, Notering-radens exakta form, ögonblicksbildens fallbacks) ska
 * bevisas uttömmande och snabbt utan staging-koppling
 * (`tests/api/rebook-registration.test.ts`), och samtidigt vara importerbar av
 * `rebook-registration`-EF:en i Deno.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TILLSTÅNDSBESLUTET ÄR IDEMPOTENSNYCKELN — DET FINNS INGEN ANNAN
 * ═══════════════════════════════════════════════════════════════════════════
 * Uppdraget bad om en motiverad nyckel. Valet är SERVER-SIDA FAKTA, inte en
 * klient-buren sträng och inte Notering-radens text:
 *
 *   (a) gamla anmälans STATUS — samma facit som `cancel-registration` redan
 *       använder (TASK-368.2: "statusen ÄR sitt eget idempotens-facit"), och
 *   (b) FINNS DET REDAN EN ANMÄLAN för samma person på MÅL-eventet — den
 *       frågan besvaras av `create-registration`s befintliga affärs-unikhet
 *       (Normaliserad e-post × EventKey), alltså av basen, inte av oss.
 *
 * Varför INTE en `Idempotency-Key` i kroppen: `create-registration` KRÄVER en
 * sådan nyckel men dedupar den bevisligen INTE server-side (dess eget filhuvud:
 * "Nyckeln dedupas alltså INTE server-side ännu"). En nyckel som ingen lagrar
 * ger noll idempotens — den hade sett ut som ett skydd utan att vara ett
 * (`ADR-083`-felklassen, i kod i stället för i prosa).
 *
 * Varför INTE Notering-raden: fältet är Lottas fria text i basen. Hon kan
 * redigera bort raden i Airtable, och då hade en "idempotensnyckel" försvunnit
 * med den. Ett tillstånd som en människa får skriva över är inget facit.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR ÅTERUPPTAGNING FINNS (och varför den INTE är samma sak som ett 409)
 * ═══════════════════════════════════════════════════════════════════════════
 * Ordningen (kortets AC #4) är: ny anmälan → flytt i Postgres → statusbyte →
 * spegel → logg. Den ordningen är vald så att allt som kan gå fel gör det
 * MEDAN gamla anmälan fortfarande är aktiv — då är läget läsbart och Lotta kan
 * göra om. Följden är att ett halvfärdigt läge kan se ut på två sätt:
 *
 *   1. Gamla är AKTIV men mål-anmälan finns redan → första försöket kom förbi
 *      skapandet men inte hela vägen. Ett andra anrop ska då ADOPTERA den
 *      befintliga mål-anmälan och köra klart resten (som var för sig är
 *      idempotent: flytten matchar noll rader andra gången, spegeln räknas om
 *      från grunden). Det beslutas inte här — `lage: 'utfor'` täcker båda —
 *      men det är skälet till att ett dubblett-svar från skapandet inte får
 *      vara ett hårt fel i EF:en.
 *   2. Gamla är AVBOKAD och mål-anmälan finns → hela operationen är redan
 *      gjord. `lage: 'aterupptagning'` betyder: skriv INTE status igen, logga
 *      INTE igen, men räkna om spegeln och svara med samma fakta som första
 *      gången. Ingen dubbel anmälan, ingen dubbel flytt, ingen dubbel loggrad.
 *
 * Är gamla AVBOKAD och mål-anmälan INTE finns är det ingen ombokning som
 * påbörjats — det är en vanlig avbokning som någon försöker boka om. Den
 * avvisas (`redan_avbokad`), exakt som `cancel-registration` avvisar en andra
 * avbokning.
 */

import { summeraKronor } from './betalningsbelopp.ts';
import { beslutaCancelOvergang, STATUS_AVBOKAD } from './cancel-registration.ts';

/** Maskinläsbar identitet på avvisningen (EF:ens `code`-fält). */
export type OmbokningsAvvisningskod = 'samma_event' | 'redan_avbokad' | 'status_ej_tillaten';

export type OmbokningsUnderlag = {
  /** Gamla anmälans nuvarande Status i basen. `null` = fältet är tomt. */
  aktuellStatus: string | null;
  /** Gamla anmälans Event-länk (första ID:t), eller `null` när den saknas. */
  gammaltEventId: string | null;
  /** Eventet det ska bokas om TILL. */
  nyttEventId: string;
  /** Finns redan en anmälan för samma person på mål-eventet? */
  malAnmalanFinns: boolean;
};

export type OmbokningsBeslut =
  | {
      ok: true;
      /** `utfor` = kör hela sekvensen. `aterupptagning` = allt är redan gjort. */
      lage: 'utfor' | 'aterupptagning';
      /** Ska gamla anmälans Status/Notering skrivas i detta anrop? */
      statusSkaSkrivas: boolean;
      /** Statusen som ska skrivas när `statusSkaSkrivas` är sant. */
      nyStatus: string;
    }
  | { ok: false; kod: OmbokningsAvvisningskod; felmeddelande: string };

/**
 * Beslutar om (och hur) en ombokning ska utföras. KASTAR ALDRIG — en okänd
 * eller tom status är ett avvisat läge, inte ett programmeringsfel.
 *
 * ÖVERGÅNGSTABELLEN ÄGS INTE HÄR. Vilka statusar som räknas som aktiva står i
 * `beslutaCancelOvergang` (`_shared/cancel-registration.ts`, TASK-368.2) och
 * återanvänds rakt av — en ombokning ÄR en avbokning med ett nytt hem för
 * pengarna, och två kopior av samma tabell hade kunnat glida isär tyst.
 */
export function beslutaOmbokning(underlag: OmbokningsUnderlag): OmbokningsBeslut {
  // SAMMA EVENT PRÖVAS FÖRST, oavsett status: att boka om till det event
  // anmälan redan sitter på är alltid ett handhavandefel, och att svara
  // "redan avbokad" på det hade pekat ut fel sak för Lotta.
  if (underlag.gammaltEventId !== null && underlag.gammaltEventId === underlag.nyttEventId) {
    return {
      ok: false,
      kod: 'samma_event',
      felmeddelande: 'Anmälan sitter redan på det eventet. Välj ett annat event.',
    };
  }

  const cancelBeslut = beslutaCancelOvergang('avboka', underlag.aktuellStatus, null);
  if (cancelBeslut.ok) {
    return { ok: true, lage: 'utfor', statusSkaSkrivas: true, nyStatus: cancelBeslut.nyStatus };
  }

  if (underlag.aktuellStatus === STATUS_AVBOKAD) {
    if (underlag.malAnmalanFinns) {
      // Hela operationen är redan gjord (se filhuvudets fall 2).
      return {
        ok: true,
        lage: 'aterupptagning',
        statusSkaSkrivas: false,
        nyStatus: STATUS_AVBOKAD,
      };
    }
    return {
      ok: false,
      kod: 'redan_avbokad',
      felmeddelande: 'Anmälan är redan avbokad och kan därför inte bokas om.',
    };
  }

  return {
    ok: false,
    kod: 'status_ej_tillaten',
    felmeddelande: cancelBeslut.felmeddelande,
  };
}

/**
 * Bygger EN rad för Notering-appendet på den GAMLA anmälan. Formen är LÅST
 * (kortets AC #2, ordagrant):
 *   '[Ombokad ÅÅÅÅ-MM-DD av <aktör>] till <event, datum>'
 *
 * Saknas eventets datum utelämnas kommatecknet OCH datumet — aldrig ett
 * hängande komma eller ordet null i en text Lotta läser i basen. Saknas
 * eventets namn skrivs 'okänt event', samma disciplin som ögonblicksbildens
 * 'Okänt event' (raden ska gå att läsa ensam år efteråt).
 *
 * Appendet självt (`appendNotering`) och datumet (`stockholmDatum`) återanvänds
 * oförändrade från `_shared/cancel-registration.ts` — ingen andra kopia.
 */
export function byggOmbokningsrad(
  datum: string,
  aktor: string,
  nyttEventNamn: string | null,
  nyttEventDatum: string | null,
): string {
  const namn = nyttEventNamn?.trim() ? nyttEventNamn.trim() : 'okänt event';
  const datumDel = nyttEventDatum?.trim() ? `, ${nyttEventDatum.trim()}` : '';
  return `[Ombokad ${datum} av ${aktor}] till ${namn}${datumDel}`;
}

/**
 * Ögonblicksbildens två kolumner för en FLYTTAD inbetalningsrad.
 *
 * `ogonblicksbild_namn` ingår MEDVETET INTE: personen är densamma efter en
 * ombokning, och kolumnen är dessutom purge-sentinelns fält
 * (`.purge-staging-policy.json` → `postgresTargets`). Att skriva om den hade
 * ändrat vilka rader städningen ser.
 *
 * `ogonblicksbild_event` är `not null` i schemat — samma 'Okänt event'-fallback
 * som `registrera-inbetalning` redan använder vid insert.
 */
export function byggFlyttadOgonblicksbild(
  nyttEventNamn: string | null,
  nyttEventDatum: string | null,
): { ogonblicksbild_event: string; ogonblicksbild_eventdatum: string | null } {
  return {
    ogonblicksbild_event: nyttEventNamn?.trim() ? nyttEventNamn.trim() : 'Okänt event',
    ogonblicksbild_eventdatum: nyttEventDatum?.trim() ? nyttEventDatum.trim() : null,
  };
}

/**
 * Summan av de flyttade raderna, i kronor. `summeraKronor` (öre-heltal internt)
 * i stället för en rå `reduce` — samma flyttalsfälla `betalningsbelopp.ts`s
 * filhuvud beskriver, och samma funktion `harledBetalning` själv använder.
 */
export function summeraFlyttat(belopp: readonly number[]): number {
  return summeraKronor(belopp);
}
