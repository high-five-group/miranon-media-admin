/**
 * Avbokning/återtagning-ORKESTRATOR (TASK-368.2, PRD TASK-368 beslut 1/3/4;
 * grillad samsyn `tasks/sessions/2026-09-03-session-115.md` Del 3).
 *
 * REN MODUL, INGEN IMPORT ALLS — samma form som `_shared/betalningsharledning.ts`
 * och `_shared/inbetalning-notering.ts`: Node-importerbar för hermetiska tester
 * (`tests/api/cancel-registration.test.ts`) OCH Deno-importerbar av
 * `cancel-registration`-EF:en. Anledningen är densamma som `inbetalning-
 * notering.ts`s filhuvud beskriver: en fjärr-import (t.ex. Supabase-klienten)
 * gör modulen otestbar utan deploy, och den mest felbenägna delen av denna
 * skiva (statusövergångstabellen, Notering-appendens exakta form) är precis
 * den som ska bevisas uttömmande, snabbt, utan staging-koppling.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ÖVERGÅNGSTABELLEN (AC #1) — EXAKT TVÅ TILLÅTNA RIKTNINGAR
 * ═══════════════════════════════════════════════════════════════════════════
 * avboka:  { Bekräftad (mail skickat), Betalningspåminnelse skickad,
 *            Obekräftad } → Avbokad/Ombokad
 * aterta:  Avbokad/Ombokad → härledd status (Bekräftad (mail skickat) om
 *          'Bekräftelse skickad' är satt på anmälan, annars Obekräftad)
 *
 * Allt annat (inklusive Inställt, Flytta till väntelista, och en redan
 * avbokad anmälan som avbokas igen, eller en aktiv anmälan som återtas) är
 * en AVVISAD övergång — 409, aldrig en tyst no-op och aldrig ett kastat fel.
 * Den strukturella idempotensen (AC #4: "andra identiska anropet ändrar
 * inget och loggar inget") är EXAKT samma gren som en genuint ogiltig
 * övergång: en redan avbokad anmälan som avbokas igen läser samma
 * `redan_avbokad`-kod som ett förstaförsök från fel status — anroparen (EF:en)
 * skriver aldrig till Airtable och loggar aldrig aktiviteten i det fallet.
 */

/** Basens Status-ord (data-model.md § Status-värden — Anmälningar). */
const STATUS_BEKRAFTAD = 'Bekräftad (mail skickat)';
const STATUS_PAMINNELSE = 'Betalningspåminnelse skickad';
const STATUS_OBEKRAFTAD = 'Obekräftad';
export const STATUS_AVBOKAD = 'Avbokad/Ombokad';

/** De tre statusar en anmälan kan avbokas FRÅN (beslut 1). */
const AKTIVA_STATUSAR_FOR_AVBOKNING = [STATUS_BEKRAFTAD, STATUS_PAMINNELSE, STATUS_OBEKRAFTAD];

export type CancelAtgard = 'avboka' | 'aterta';

/**
 * Felkoden är den maskinläsbara identiteten (EF:ens JSON-svar `code`-fält,
 * samma mönster som `hantera-inbetalning`s `kvitto_finns`/`redan_makulerad`);
 * `felmeddelande` är den svenska, begripliga texten AC #1 kräver.
 */
export type CancelAvvisningskod = 'redan_avbokad' | 'inte_avbokad' | 'status_ej_tillaten';

export type CancelBeslut =
  | { ok: true; nyStatus: string }
  | { ok: false; kod: CancelAvvisningskod; felmeddelande: string };

/**
 * Beslutar en enda övergång. Kastar ALDRIG — en okänd/null status hanteras
 * som "status_ej_tillaten" (avboka) respektive "inte_avbokad" (aterta), inte
 * som ett programmeringsfel.
 *
 * `bekraftelseSkickad` behövs bara för `aterta`s härledning (beslut 4) —
 * `null`/tom sträng räknas som "ej satt" → Obekräftad.
 */
export function beslutaCancelOvergang(
  atgard: CancelAtgard,
  aktuellStatus: string | null,
  bekraftelseSkickad: string | null,
): CancelBeslut {
  if (atgard === 'avboka') {
    if (aktuellStatus !== null && AKTIVA_STATUSAR_FOR_AVBOKNING.includes(aktuellStatus)) {
      return { ok: true, nyStatus: STATUS_AVBOKAD };
    }
    if (aktuellStatus === STATUS_AVBOKAD) {
      return {
        ok: false,
        kod: 'redan_avbokad',
        felmeddelande: 'Anmälan är redan avbokad.',
      };
    }
    return {
      ok: false,
      kod: 'status_ej_tillaten',
      felmeddelande: `Anmälan kan inte avbokas från statusen "${aktuellStatus ?? 'okänd'}".`,
    };
  }

  // atgard === 'aterta'
  if (aktuellStatus !== STATUS_AVBOKAD) {
    return {
      ok: false,
      kod: 'inte_avbokad',
      felmeddelande: 'Anmälan är inte avbokad och kan därför inte återtas.',
    };
  }
  const harBekraftelse = typeof bekraftelseSkickad === 'string' && bekraftelseSkickad.trim() !== '';
  return { ok: true, nyStatus: harBekraftelse ? STATUS_BEKRAFTAD : STATUS_OBEKRAFTAD };
}

/**
 * Bygger EN rad för Notering-appendet. Formen är LÅST (uppdraget, ordagrant):
 *   '[Avbokad ÅÅÅÅ-MM-DD av <aktör>] <skäl>'
 *   '[Avbokning återtagen ÅÅÅÅ-MM-DD av <aktör>] <skäl>'
 * Tomt/frånvarande skäl ger raden UTAN skältext — och utan avslutande
 * blanksteg (`bas` returneras oförändrad, aldrig `${bas} `).
 */
export function byggNoteringsrad(
  atgard: CancelAtgard,
  datum: string,
  aktor: string,
  skal: string | null,
): string {
  const etikett = atgard === 'avboka' ? 'Avbokad' : 'Avbokning återtagen';
  const bas = `[${etikett} ${datum} av ${aktor}]`;
  const trimmatSkal = skal?.trim();
  return trimmatSkal ? `${bas} ${trimmatSkal}` : bas;
}

/**
 * Lägger `nyRad` sist i `befintlig`. Befintlig text BEVARAS BYTE FÖR BYTE
 * (aldrig trimmad eller omformaterad) — `.trim()` används enbart för att
 * AVGÖRA om fältet ska räknas som tomt, inte för att mutera det. Ett tomt
 * eller frånvarande fält ger raden ensam, utan inledande radbrytning.
 */
export function appendNotering(befintlig: string | null, nyRad: string): string {
  if (befintlig === null || befintlig.trim() === '') return nyRad;
  return `${befintlig}\n\n${nyRad}`;
}

/**
 * Dagens datum i Europe/Stockholm, som ÅÅÅÅ-MM-DD. `formatToParts` (inte
 * `.format()`s råa strängutdata) så separatorn aldrig beror på hur ICU
 * råkar rendera `sv-SE`s literal-tecken i den körande motorn (Deno i drift,
 * Node i test) — bara siffror plockas ut och sätts ihop själva.
 */
const STOCKHOLM_DATUM_FORMAT = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Stockholm',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function stockholmDatum(nu: Date): string {
  const delar = STOCKHOLM_DATUM_FORMAT.formatToParts(nu);
  const ar = delar.find((d) => d.type === 'year')?.value ?? '0000';
  const manad = delar.find((d) => d.type === 'month')?.value ?? '00';
  const dag = delar.find((d) => d.type === 'day')?.value ?? '00';
  return `${ar}-${manad}-${dag}`;
}
