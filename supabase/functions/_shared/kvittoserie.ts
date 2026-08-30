// Kvittoserien — den rena, hermetiskt bevisbara halvan (TASK-346.3, ADR-128
// beslut 4, ADR-109 beslut 1).
//
// VAD SOM BOR HÄR OCH VAD SOM BOR I DATABASEN — läs detta innan du utökar
// filen. ADR-128 beslut 4 flyttar kvittoseriens garantier från BEVISAD KOD
// till DATABASEGENSKAPER: atomiciteten är `nextval` på en Postgres-sekvens,
// unikheten är en `unique`-klausul på `kvitton.inbetalning_id`, och formatet
// är en `generated always as … stored`-kolumn. Ingen av de tre kan eller ska
// bevisas om i TypeScript — en hermetisk modell av en Postgres-sekvens vore
// teater, inte ett test.
//
// Kvar i KOD är två regler som databasen inte kan känna till, eftersom de
// hämtar sitt underlag utanför Postgres:
//
//   1. GOLVET — "sekvensen startar efter det högsta befintliga numret i
//      respektive miljö" (ADR-128 beslut 4). Det högsta befintliga numret
//      ligger i AIRTABLE-ledgern, som Postgres inte kan läsa. Härledningen
//      är därför kod, och `public.kvittoserie_golv` är dess utdata.
//   2. FORMATET som LÄSVÄG — `tolkaKvittonummer` behövs för att läsa
//      Airtable-ledgerns strängar (`MM-2026-1002`) när golvet ska härledas.
//      Skrivvägen använder den ALDRIG; där är formatet en genererad kolumn.
//
// Därtill `arTatOchStigande`, som är verifieringens instrument (AC #4:
// "sekvensen bevisas tät") — den prövar en UTDELAD serie, den producerar
// ingen.
//
// FÖRHÅLLANDE TILL `receipt-numbering.ts`: den filen bär ADR-109 beslut 2:s
// läs-verifiera-retry-protokoll mot Airtable, som ADR-128 river. Denna fil
// importerar den MEDVETET inte — en riven väg ska inte bära en ny domän, och
// duplicerandet av en trerads-formatterare under en övergång är billigare än
// den kopplingen. `receipt-numbering.ts` pensioneras med Airtable-ledgern i
// TASK-346.12.
//
// Deno-global-fri i sin yta → Node-importerbar för api-pure-tester OCH
// Deno-importerbar av TASK-346.4:s Edge Functions (samma DI-form som
// `_shared/receipt-numbering.ts` och `_shared/send-action-email.ts`).

/**
 * Kvittoseriens start per år (ADR-109 beslut 1, Marcus-beslut S102).
 * Ett nytt år börjar på 1001, aldrig som en fortsättning av föregående års
 * serie.
 */
export const KVITTOSERIE_START = 1001;

/** Serien är årsbunden och Postgres-sidans check speglar exakt detta spann. */
export const KVITTOSERIE_AR_MIN = 2026;
export const KVITTOSERIE_AR_MAX = 2999;

/** `MM-<år>-<löpnummer>` — synligt avgränsad från Rogers fakturaserie. */
export function formatKvittonummer(ar: number, lopnummer: number): string {
  if (!Number.isInteger(ar) || ar < KVITTOSERIE_AR_MIN || ar > KVITTOSERIE_AR_MAX) {
    throw new RangeError(`kvittoserie: ogiltigt år ${ar}`);
  }
  if (!Number.isInteger(lopnummer) || lopnummer < KVITTOSERIE_START) {
    throw new RangeError(`kvittoserie: ogiltigt löpnummer ${lopnummer}`);
  }
  return `MM-${ar}-${lopnummer}`;
}

/**
 * Läser ett kvittonummer tillbaka till sina delar. Returnerar `null` för
 * allt som inte är exakt seriens form — aldrig ett gissat värde, eftersom
 * anroparen härleder golvet ur svaret och ett gissat år hade gett en serie
 * som startar på fel ställe.
 *
 * Nollpaddning och extra tecken avvisas medvetet: `MM-2026-01001` är inte
 * ett nummer serien någonsin utfärdat.
 */
export function tolkaKvittonummer(
  kvittonummer: string,
): { ar: number; lopnummer: number } | null {
  const traff = /^MM-(\d{4})-([1-9]\d{3,})$/.exec(kvittonummer);
  if (!traff) return null;

  const ar = Number(traff[1]);
  const lopnummer = Number(traff[2]);
  if (ar < KVITTOSERIE_AR_MIN || ar > KVITTOSERIE_AR_MAX) return null;
  if (lopnummer < KVITTOSERIE_START) return null;

  return { ar, lopnummer };
}

/**
 * Härleder årets GOLV — det första löpnummer sekvensen ska dela ut — ur det
 * högsta löpnummer som redan finns i miljöns befintliga ledger.
 *
 * `null` (tom ledger) ⇒ `KVITTOSERIE_START`. Ett befintligt högsta ⇒ ett
 * MER än det. Ett högsta under seriens start kan inte sänka golvet.
 *
 * Detta är utdatan som seedas till `public.kvittoserie_golv`. Mätt underlag
 * 2026-08-30: staging-ledgern (Airtable `Kvitton`) bär `MM-2026-1001` och
 * `MM-2026-1002` ⇒ golv 1003; prod-ledgern är tom ⇒ golv 1001.
 */
export function harledGolv(hogstaBefintligaLopnummer: number | null): number {
  if (hogstaBefintligaLopnummer === null) return KVITTOSERIE_START;

  if (!Number.isInteger(hogstaBefintligaLopnummer)) {
    throw new RangeError(
      `kvittoserie: högsta befintliga löpnummer måste vara ett heltal eller null, fick ${hogstaBefintligaLopnummer}`,
    );
  }

  return Math.max(KVITTOSERIE_START, hogstaBefintligaLopnummer + 1);
}

/**
 * Härleder golvet direkt ur en befintlig ledgers kvittonummer för ETT år.
 * Nummer som inte tolkas, eller som hör till ett annat år, ignoreras — en
 * främmande sträng i ledgern får aldrig flytta golvet.
 */
export function harledGolvUrLedger(kvittonummer: readonly string[], ar: number): number {
  let hogsta: number | null = null;

  for (const nummer of kvittonummer) {
    const tolkat = tolkaKvittonummer(nummer);
    if (tolkat === null || tolkat.ar !== ar) continue;
    if (hogsta === null || tolkat.lopnummer > hogsta) hogsta = tolkat.lopnummer;
  }

  return harledGolv(hogsta);
}

/**
 * Är en utdelad serie TÄT och STIGANDE? Verifieringens instrument (AC #4) —
 * den prövar en serie, den producerar ingen.
 *
 * Tät = varje nummer är exakt ett mer än det föregående. En tom serie och en
 * ensam post är trivialt täta. Hopp och upprepningar fäller båda, och en
 * fallande ordning fäller — utfärdandeordningen är en bokföringsegenskap
 * Roger läser (ADR-129 beslut 9).
 *
 * OBS: tätheten gäller en serie som FAKTISKT delats ut i följd. Hål efter en
 * påbörjad men avbruten allokering är en accepterad konsekvensklass
 * (ADR-128 beslut 4) — den här funktionen används därför på mätningar av en
 * sammanhängande körning, aldrig som en löpande invariant över hela ledgern.
 */
export function arTatOchStigande(lopnummer: readonly number[]): boolean {
  if (lopnummer.length <= 1) return true;

  for (let i = 1; i < lopnummer.length; i += 1) {
    const forra = lopnummer[i - 1];
    const detta = lopnummer[i];
    if (!Number.isInteger(forra) || !Number.isInteger(detta)) return false;
    if (detta !== forra + 1) return false;
  }

  return true;
}
