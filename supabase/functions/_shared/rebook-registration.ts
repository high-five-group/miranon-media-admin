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
 * ADOPTION ÄR BEGRÄNSAD TILL OMKÖRNINGSFALLET (Marcus beslut 2026-09-03)
 * ═══════════════════════════════════════════════════════════════════════════
 * En TIDIGARE version av denna modul lät ombokningen ADOPTERA vilken
 * befintlig mål-anmälan som helst: fanns personen redan på mål-eventet
 * flyttades pengarna dit i stället för att operationen fällde. Det gjorde hela
 * sekvensen omkörbar även efter ett avbrott mitt i — men det innebar också att
 * TVÅ anmälningars ekonomi kunde slås ihop tyst, på en knapptryckning, utan
 * att någon beslutat det. Granskningen av `PR #2247` lyfte det, och Marcus
 * avgjorde: **ingen tyst sammanslagning.**
 *
 * Adoption sker därför ENDAST när anropet bevisligen är SAMMA REQUEST
 * UPPREPAD — vilket kräver TVÅ oberoende fakta samtidigt:
 *
 *   (a) gamla anmälan är redan `Avbokad/Ombokad`, och
 *   (b) dess Notering bär en Ombokad-rad som pekar på PRECIS DETTA målevent
 *       (`barOmbokningsradMot`).
 *
 * Håller båda är ombokningen redan utförd, och `lage: 'aterupptagning'`
 * betyder: skriv INTE status igen, logga INTE igen, men räkna om spegeln och
 * svara med samma fakta som första gången. Ingen dubbel anmälan, ingen dubbel
 * flytt, ingen dubbel loggrad — AC #4:s idempotens är bevarad.
 *
 * I ALLA andra lägen där personen redan har en anmälan på mål-eventet — den
 * må vara aktiv, avbokad eller inställd — avvisas ombokningen med
 * `redan_anmald_pa_malet` (409). Det gäller även det HALVFÄRDIGA läget där ett
 * tidigare försök hann skapa raden men inte skriva statusen: läget är
 * strukturellt oskiljbart från "personen var redan anmäld dit" (den nya raden
 * bär Källa Manuell, status Obekräftad och tom Notering i båda fallen), och
 * mellan de två tolkningarna väljer vi den som aldrig slår ihop någons pengar.
 * Kostnaden — ett smalt fönster som kräver handpåläggning — står utskriven i
 * ADR-130 § Konsekvenser i stället för att döljas.
 *
 * Är gamla AVBOKAD och mål-anmälan INTE finns är det ingen ombokning som
 * påbörjats — det är en vanlig avbokning som någon försöker boka om. Den
 * avvisas (`redan_avbokad`), exakt som `cancel-registration` avvisar en andra
 * avbokning.
 */

import { summeraKronor } from './betalningsbelopp.ts';
import { beslutaCancelOvergang, STATUS_AVBOKAD } from './cancel-registration.ts';

/** Maskinläsbar identitet på avvisningen (EF:ens `code`-fält). */
export type OmbokningsAvvisningskod =
  | 'samma_event'
  | 'redan_anmald_pa_malet'
  | 'redan_avbokad'
  | 'status_ej_tillaten';

export type OmbokningsUnderlag = {
  /** Gamla anmälans nuvarande Status i basen. `null` = fältet är tomt. */
  aktuellStatus: string | null;
  /** Gamla anmälans Event-länk (första ID:t), eller `null` när den saknas. */
  gammaltEventId: string | null;
  /** Eventet det ska bokas om TILL. */
  nyttEventId: string;
  /** Finns redan en anmälan för samma person på mål-eventet? */
  malAnmalanFinns: boolean;
  /**
   * Bär gamla anmälans Notering en Ombokad-rad mot PRECIS detta målevent?
   * Beräknas av anroparen med `barOmbokningsradMot`. Tillsammans med en
   * `Avbokad/Ombokad`-status är detta det ENDA som gör en befintlig
   * mål-anmälan adopterbar (se filhuvudets § ADOPTION).
   */
  omkorningBekraftad: boolean;
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

  // MÅL-ANMÄLAN PRÖVAS FÖRE STATUSAXELN, och det är avsiktligt: att personen
  // redan har en anmälan på mål-eventet är det MEST SPECIFIKA hindret och det
  // enda Lotta kan göra något åt utan att först förstå den gamla anmälans
  // status. Adoptionen är den enda vägen förbi, och den kräver båda fakta
  // (se filhuvudets § ADOPTION).
  if (underlag.malAnmalanFinns) {
    if (underlag.aktuellStatus === STATUS_AVBOKAD && underlag.omkorningBekraftad) {
      // Samma request upprepad — hela operationen är redan gjord.
      return {
        ok: true,
        lage: 'aterupptagning',
        statusSkaSkrivas: false,
        nyStatus: STATUS_AVBOKAD,
      };
    }
    return {
      ok: false,
      kod: 'redan_anmald_pa_malet',
      felmeddelande:
        'Personen är redan anmäld till det eventet. Kontrollera de två anmälningarna i basen ' +
        'innan du bokar om — pengar flyttas aldrig automatiskt mellan två anmälningar.',
    };
  }

  const cancelBeslut = beslutaCancelOvergang('avboka', underlag.aktuellStatus, null);
  if (cancelBeslut.ok) {
    return { ok: true, lage: 'utfor', statusSkaSkrivas: true, nyStatus: cancelBeslut.nyStatus };
  }

  if (underlag.aktuellStatus === STATUS_AVBOKAD) {
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
  return `[Ombokad ${datum} av ${aktor}] ${byggOmbokningsmal(nyttEventNamn, nyttEventDatum)}`;
}

/**
 * Radens MÅL-del: `till <event>` eller `till <event>, <datum>`.
 *
 * Bruten ut ur `byggOmbokningsrad` så att BYGGANDET och IGENKÄNNANDET
 * (`barOmbokningsradMot`) delar exakt en formulering. Två kopior hade kunnat
 * glida isär tyst, och då hade en giltig omkörning tolkats som en främmande
 * anmälan på mål-eventet — alltså ett 409 där idempotensen skulle gälla.
 */
export function byggOmbokningsmal(
  nyttEventNamn: string | null,
  nyttEventDatum: string | null,
): string {
  const namn = nyttEventNamn?.trim() ? nyttEventNamn.trim() : 'okänt event';
  const datumDel = nyttEventDatum?.trim() ? `, ${nyttEventDatum.trim()}` : '';
  return `till ${namn}${datumDel}`;
}

/** Radens INLEDNING, oberoende av aktör och dag. */
const OMBOKNINGSRAD_INLEDNING = /^\[Ombokad \d{4}-\d{2}-\d{2} av .+\] /;

/**
 * Bär anmälans Notering en Ombokad-rad som pekar på PRECIS detta målevent?
 *
 * Detta är adoptionens andra villkor (se filhuvudets § ADOPTION): tillsammans
 * med statusen `Avbokad/Ombokad` gör den ett anrop bevisbart till SAMMA
 * REQUEST UPPREPAD, i stället för ett nytt anrop mot ett event personen råkar
 * ha en anmälan på.
 *
 * Prövar rad för rad: inledningen (`[Ombokad ÅÅÅÅ-MM-DD av …] `) plus exakt
 * den mål-del `byggOmbokningsmal` skulle producera för eventet. Aktören och
 * dagen ingår MEDVETET inte i jämförelsen — en omkörning nästa dag, eller av
 * någon annan, är fortfarande samma request.
 *
 * KÄND KANT, medvetet inte kompenserad: byter eventet namn eller startdatum
 * mellan de två anropen matchar raden inte längre, och omkörningen avvisas som
 * `redan_anmald_pa_malet`. Det är fel åt det säkra hållet — den avvisade
 * omkörningen kräver ett ögonkast i basen, medan en luddigare matchning hade
 * kunnat adoptera fel anmälan.
 */
export function barOmbokningsradMot(
  notering: string | null,
  nyttEventNamn: string | null,
  nyttEventDatum: string | null,
): boolean {
  if (notering === null || notering.trim() === '') return false;
  const mal = byggOmbokningsmal(nyttEventNamn, nyttEventDatum);
  return notering
    .split('\n')
    .map((rad) => rad.trim())
    .some((rad) => OMBOKNINGSRAD_INLEDNING.test(rad) && rad.endsWith(mal));
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
