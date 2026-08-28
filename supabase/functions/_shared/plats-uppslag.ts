// Ort → Plats-härledningen (TASK-309.30, ADR-066-tillägget 2026-08-28,
// ADR-125 § 2).
//
// PROBLEMET: `create-event`-vertikalen (ADR-066) föddes 2026-06-27, tolv
// veckor före `Plats`-fältet (ADR-125 § 2, 2026-08-24). Ett event som
// skapas i appen fick därför tom `Plats`-länk, och bilagans adress-/
// parkerings-/transport-/klädblock föll tillbaka på TOMT i stället för
// platsens standard (`_shared/document-sources.ts` läser dem ur den
// länkade Platser-raden). Plats-backfillen 2026-08-26 stängde de 27
// BEFINTLIGA Rönninge-eventen i prod; denna modul stänger de FRAMTIDA.
//
// HÄRLEDNING, INTE LÄNK-KRAV — samma anda som ADR-125 § 2:s "uppslag, inte
// länk" för Eventinnehåll (`Event (source)` × `Typ`): eventets EGET
// `Ort`-fält pekar ut Platser-raden via exakt namnmatchning. Ingen ny
// klient-input, ingen ny formkontroll (kortets AC #3), ingen andra sanning
// att hålla synkad.
//
// ═══ VARFÖR "EXAKT EN TRÄFF" ÄR HELA REGELN ═══
// `Platser.Namn` är en singleLineText-primärnyckel (staging
// `fldSDJcY7cb4dam3Y`, live-verifierad via describe_table 2026-08-28) —
// Airtable kan strukturellt INTE tvinga unikhet på den
// (`docs/reference/airtable-constraints.md`). Två rader kan alltså bära
// samma `Namn`, och `save-place-standard`s find-or-create tar medvetet
// FÖRSTA träffen (`maxRecords: 1`) eftersom den skriver till platsen på
// operatörens uttryckliga order i stunden.
//
// Denna väg är motsatsen: en AUTOMATISK härledning som ingen har bett om.
// Att gissa "första träffen" här hade tyst länkat ett nytt event till fel
// plats, och felet hade upptäckts först i en genererad bilaga med fel
// adress. Tvetydighet är därför INGEN länk plus en öppen loggrad — samma
// disciplin som `lookupCourseDimensions` följer för ett okänt kursnamn
// (utelämna, logga, gissa aldrig).
//
// Modulen är REN (ingen Deno-global, ingen I/O) så både Deno-runtimen och
// Node-testerna kan importera den; I/O-omslaget bor i `create-event/
// index.ts`. Samma form som `course-dimensions.ts`.

/** Skälet bakom länknings-utfallet. Bärs ut i create-event:s svar
 *  (`platsLankning.skal`) så beteendet är OBSERVERBART för anroparen och
 *  för conformance-testet — aldrig bara synligt i en serverlogg. */
export type PlatsLankSkal =
  /** Exakt en Platser-rad matchade `Ort`. Länken sattes. */
  | 'exakt-en-traff'
  /** Ingen Platser-rad bär detta namn. Tom länk, per design. */
  | 'ingen-traff'
  /** Flera rader bär samma namn. Tom länk: tvetydigt, se moduldoc. */
  | 'flera-traffar'
  /** Raden bar redan en Plats (idempotent replay). Rörs ALDRIG. */
  | 'redan-satt'
  /** Uppslaget eller skrivningen fallerade. Eventet skapades ändå. */
  | 'uppslag-fel';

/** Beslutet ur en träfflista. `lanka: false` bär alltid ett skäl. */
export type PlatsLankBeslut =
  | { lanka: true; platsId: string }
  | { lanka: false; skal: Extract<PlatsLankSkal, 'ingen-traff' | 'flera-traffar'> };

/** Svarsformen create-event bär ut. `platsId` är satt ENDAST när
 *  `satt: true` — ett skäl utan länk får aldrig bära ett ID som inte
 *  skrevs. */
export interface PlatsLankning {
  satt: boolean;
  platsId: string | null;
  skal: PlatsLankSkal;
}

/**
 * Hur många rader uppslaget hämtar. TVÅ, inte en: ett `maxRecords: 1`
 * hade gjort "exakt en träff" OMÖJLIG att skilja från "flera träffar" —
 * Airtable svarar med en rad i båda fallen. Den andra raden är alltså
 * inte data vi vill ha, den är beviset på att den första inte är ensam.
 */
export const PLATS_UPPSLAG_MAX_RECORDS = 2;

/**
 * Avgör länkningen ur Platser-träffarna för eventets `Ort`.
 *
 * Noll träffar → `ingen-traff`. Fler än en → `flera-traffar` (tvetydigt,
 * se moduldoc). Exakt en → länka den.
 */
export function avgorPlatsLank(rader: readonly { id: string }[]): PlatsLankBeslut {
  if (rader.length === 0) {
    return { lanka: false, skal: 'ingen-traff' };
  }
  if (rader.length > 1) {
    return { lanka: false, skal: 'flera-traffar' };
  }
  return { lanka: true, platsId: rader[0].id };
}

/**
 * Bär raden redan en `Plats`? Airtable UTELÄMNAR ett tomt
 * multipleRecordLinks-fält ur `fields` helt (det är inte `[]`, det finns
 * inte) — båda formerna måste därför behandlas som "osatt", och bara en
 * icke-tom array räknas som en befintlig länk.
 */
export function harRedanPlats(fields: Record<string, unknown>): boolean {
  const varde = fields['Plats'];
  return Array.isArray(varde) && varde.length > 0;
}
