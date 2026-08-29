#!/usr/bin/env node
// scripts/task-338-6-prod-migration.mjs — FÖRBEREDELSE-skriptet för
// TASK-338.6 (ADR-125 § Beslut 1, § 8: Marcus GO per tabell). Byggt av en
// agent, KÖRT AV MARCUS mot prod — se § PROD-LÅSET nedan för varför.
//
// VAD SKRIPTET GÖR (samma STAGING-halva som TASK-338.1 redan bevisade skarpt,
// generaliserat till ett IDEMPOTENT, ÅTERANVÄNDBART verktyg i stället för
// engångs-MCP-anrop) — TRE separata lägen (review-runda 2, punkt 2 nedan):
//
//   --kontrollera <bas>     läser BÅDE schema och rader, ändrar inget.
//   --utfor-schema <bas>    steg (i): option "Gemensam" + länkfältet Plats +
//                           lookupfältet Platsnamn. Additivt, rör ALDRIG en
//                           riktig Bilagor-rad (se § VAL-TILLÄGG nedan).
//   --utfor-rader <bas>     steg (iii): alla rader Räckvidd ∈
//                           {Kurstyp, Alla event} → Gemensam, batchat om 10,
//                           Kursfamilj/Kursnivå ORÖRDA. Kräver att choicen
//                           redan finns (kör --utfor-schema FÖRST).
//
// Steg (ii) — EF-deployen — är UTTRYCKLIGEN INTE detta skripts jobb.
// scripts/fas4-prod-deploy.sh --deploya gör det, i Marcus EGET
// terminalfönster (CLAUDE.md § Prod-EF-deploy — aldrig via `!`-prefixet).
//
// VARFÖR TRE LÄGEN OCH INTE ETT `--utfor` (review-runda 2, punkt 2 — avgjort
// av orkestreraren på Marcus mandat): ett kombinerat `--utfor` band ihop
// schema (additivt, ofarligt) med radmigrering (irreversibelt i DATA,
// ADR-125 § 8) under EN GO. Splittringen låter Marcus ge sitt GO separat för
// vart och ett, med EF-deployen imellan — exakt kortets (i)/(ii)/(iii) och
// ADR-125 § 8:s "additivt men irreversibelt i data"-distinktion. Varje läge
// är för sig FAIL-CLOSED: en post-skrivnings-räkneverifiering (§ Exit nedan,
// kod 4) som visar diskrepans avslutar processen rött i stället för att bara
// skriva ut en varning.
//
// ─────────────────────────────────────────────────────────────────────────
// PROD-LÅSET — VARFÖR DETTA SKRIPT BÄR EN EGEN GUARD I STÄLLET FÖR ATT LITA
// PÅ scripts/deny-prod-ref.sh (PREMISS-PASS, ADR-086, DIVERGENS BOKFÖRD)
// ─────────────────────────────────────────────────────────────────────────
// Uppdraget till detta skifte antog att scripts/deny-prod-ref.sh EVENTUELLT
// vaktar Airtables prod-bas-ID (app8uGPrVCVOm6LfD) och bad om ett skarpt
// prov: kör --kontrollera med prod-basen och se om hooken faller.
//
// Läst i sin HELHET (.prod-ref-policy.conf + scripts/deny-prod-ref.sh) innan
// någon kod skrevs: hooken vaktar ENDAST `PROD_REF_PROD` =
// "lvjsfnphlauldxqlncpl" — Supabase-projektets ref (TASK-203). Airtables
// prod-bas-ID nämns i policyfilen EN gång, i en KOMMENTAR (rad 52, en
// analogi till CLAUDE.md:s hållning), aldrig som ett matchat värde. Ett
// Bash-kommando som innehåller "app8uGPrVCVOm6LfD" matchar alltså INGET i
// `PROD_REF_PROD`-substrängkontrollen och skulle passera hooken OPÅVERKAT.
//
// Konsekvens: att skarpt köra `--kontrollera app8uGPrVCVOm6LfD` som agent —
// för att "bevisa att hooken faller" — hade i verkligheten inneburit en
// LIVE, OBLOCKERAD läsning mot den bas uppdraget själv kallar FÖRBJUDEN
// ("Du kör det ENDAST mot staging"). Det utfördes DÄRFÖR ALDRIG. I stället
// bär SKRIPTET SJÄLVT den mekaniska spärren — exakt samma mönster som
// scripts/create-eventinnehall-modell.mjs (TASK-309.9, ADR-125 § 8) redan
// etablerar för Platser/Eventinnehåll-modellen: `resolveTargetBaseId` kräver
// miljövariabeln AIRTABLE_PROD_GODKAND_AV_MARCUS satt till EXAKT samma
// bas-ID som körningen fick, INNAN något nätverksanrop görs. Denna guard
// KÖRDES skarpt av agenten mot app8uGPrVCVOm6LfD (utan att sätta
// miljövariabeln) och VÄGRADE — se PR-rapporten för den exakta utskriften.
// Det är beviset uppdraget bad om, fast producerat av rätt mekanism.
//
// Samma öppna gräns som deny-prod-ref.sh § header redan medger: detta är en
// DOKUMENTERAD konvention (env-var måste sättas av Marcus, i klartext, på
// KOMMANDORADEN — aldrig av en agent på eget initiativ), inte ett
// matematiskt bevisat outbrytbart lås. Se PROD_GODKAND_ENV_VAR nedan.
//
// ─────────────────────────────────────────────────────────────────────────
// PLATTFORMSVÄGG (TASK-338.1, skarpt mätt) + VAL-TILLÄGG (review-runda 2)
// ─────────────────────────────────────────────────────────────────────────
// `mcp__airtable__update_field` (och den bakomliggande Meta-API PATCH mot
// /v0/meta/bases/{baseId}/tables/{tableId}/fields/{fieldId}) kan INTE lägga
// till en choice på en BEFINTLIG singleSelect — Airtables egen 422:
// "Changing a field's type or number precision is not currently supported."
// Vägen som FUNGERAR: en records-skrivning (POST/PATCH mot
// /v0/{baseId}/{tableId}) med `typecast: true` och ett okänt strängvärde —
// Airtable skapar choicen automatiskt.
//
// TASK-338.1 bevisade detta via en PATCH på en RIKTIG legacy-rad (samma
// operation som ändå behövde migreras). Efter review-runda 2:s krav att
// --utfor-schema ALDRIG ska röra en riktig rad (§ ovan, "additivt men
// irreversibelt i data" ska hållas isär), byter detta skript till en
// KASTBAR rad för choice-skapelsen ALLTID: POST en rad med
// {Räckvidd:"Gemensam"} + typecast:true, läs tillbaka dess id, DELETE den
// omedelbart. Nettoeffekten på Bilagor-tabellens data är NOLL — schema-steget
// rör aldrig en persisterad rad, vilket var hela poängen med splittringen.
//
// ÄRLIG GRÄNS: create+typecast är INTE independent omprövat denna runda —
// TASK-338.1 bevisade UPDATE-vägen (PATCH på en riktig rad) skarpt; denna
// runda byter till CREATE+DELETE av arkitekturskäl (se ovan), och Airtables
// dokumenterade typecast-beteende är beskrivet som identiskt för create och
// update, men detta specifika create-anrop är INTE självt körts skarpt i
// denna runda (koordinatorn förbjöd en ny --utfor-schema-körning mot staging
// tills review-fyndet #1 var rättat — se PR-rapporten). Bokfört öppet, inte
// dolt.
//
// ─────────────────────────────────────────────────────────────────────────
// TOKEN — SCOPE-KRAVET (review-runda 2, punkt 5)
// ─────────────────────────────────────────────────────────────────────────
// AIRTABLE_SCHEMA_TOKEN måste bära PAT-SCOPET `schema.bases:write` (utöver
// `schema.bases:read`) — annars svarar Meta-API:t 403/422 på fältskapelsen.
// Detta är EN ANNAN AXEL än Airtable-BASENS `permissionLevel` (t.ex.
// "create") som en collaborator/token kan ha på basen som HELHET — en token
// kan ha permissionLevel "create" på basen och ÄNDÅ sakna det granulära
// `schema.bases:write`-PAT-scopet, om token:et skapades med en snävare
// scope-lista. Se docs/reference/atkomst-och-nycklar.md § "TOKEN-FÄLLAN,
// mätt och rättad" för den exakta distinktionen (MCP-serverns PAT har BÅDA:
// permissionLevel "create" på båda baserna OCH fungerar via skript-vägen när
// den exporteras som AIRTABLE_SCHEMA_TOKEN — men det är EMPIRISKT verifierat
// för DEN specifika token:en, inte en generell garanti). Den DEDIKERADE,
// least-privilege-scopade PAT:en (schema.bases:read+write, endast
// målbasen) beskrivs i .env.seed.example (AIRTABLE_SCHEMA_TOKEN-blocket) för
// staging, och i atkomst-och-nycklar.md § "Prod-deploy av bilagespåret" →
// (a) Prod-schemat för prod-varianten.
//
// STAGING_AIRTABLE_TOKEN (data.records:read+write — radläsning/-migrering).
// Namnet är historiskt (ADR-060 punkt 4); för en prod-körning sätter Marcus
// samma variabelnamn till en prod-scopad PAT INLINE på kommandoraden (aldrig
// i .env.seed) — exakt samma konvention som create-eventinnehall-modell.mjs
// § filhuvud "PROD-KÖRNINGEN" redan etablerar.
//
// API-FORMEN: Airtable Web API (Meta för schema, vanliga records-API:t för
// data), samma som repots övriga schema-/migreringsskript. 5xx-fel retries
// upp till 2 gånger med exponentiell backoff (1 s, 2 s) utöver den
// befintliga 429-hanteringen (review-runda 2, punkt 5).
//
// Exit: 0 = OK. 1 = prod-lås-VÄGRAN (icke-staging-bas utan
// AIRTABLE_PROD_GODKAND_AV_MARCUS) ELLER ett guard-fel (schema-/
// konfigurationsmissmatch — se planSchema/planRader). 2 =
// argument-/bas-ID-form-fel. 3 = Airtable-API-/token-fel. 4 =
// POST-VERIFIERINGSFEL — räkneverifieringen EFTER en --utfor-*-körning
// visade diskrepans (schemat konvergerade inte / legacy-rader kvar) —
// fail-closed (review-runda 2, punkt 3).

import { pathToFileURL } from 'node:url';
import { kravStagingLedigt } from './lib/staging-preflight.mjs';

// ---------------------------------------------------------------------------
// Konstanter — projekt-specifika. Logiken nedanför är universell.
// ---------------------------------------------------------------------------

export const STAGING_BASE_ID = 'apphjj8Q7lkXCMsL4';
export const PROD_BASE_ID_KAND = 'app8uGPrVCVOm6LfD'; // KÄND prod-bas, endast för läsbara felmeddelanden — bär INGEN spärr i sig.
export const BASE_ID_PATTERN = /^app[A-Za-z0-9]{14}$/;
export const BILAGOR_TABLE_NAME = 'Bilagor';
export const PLATSER_TABLE_NAME = 'Platser';
export const RACKVIDD_FIELD_NAME = 'Räckvidd';
export const PLATS_FIELD_NAME = 'Plats';
export const PLATSNAMN_FIELD_NAME = 'Platsnamn';
export const PLATSER_NAMN_FIELD_NAME = 'Namn';
export const GEMENSAM_CHOICE_NAME = 'Gemensam';
export const LEGACY_RACKVIDD_VARDEN = ['Kurstyp', 'Alla event'];
export const RECORD_BATCH_SIZE = 10; // Airtables PATCH/POST-tak per anrop.

/** Miljövariabeln som bär Marcus GO i klartext för en icke-staging-körning
 *  (ADR-125 § 8) — samma namn och kontrakt som
 *  scripts/create-eventinnehall-modell.mjs § PROD_GODKAND_ENV_VAR. */
export const PROD_GODKAND_ENV_VAR = 'AIRTABLE_PROD_GODKAND_AV_MARCUS';

const AIRTABLE_META_URL = 'https://api.airtable.com/v0/meta/bases';
const AIRTABLE_RECORDS_URL = 'https://api.airtable.com/v0';

// ---------------------------------------------------------------------------
// Argument-tolkning + bas-guard (pura funktioner, testade utan nätverk)
// ---------------------------------------------------------------------------

export class ArgError extends Error {}
export class GuardError extends Error {}
export class ApiError extends Error {}

const MODE_FLAGS = /** @type {const} */ ({
  '--kontrollera': 'kontrollera',
  '--utfor-schema': 'utfor-schema',
  '--utfor-rader': 'utfor-rader',
});

/** Tolka argv. Formen är `<flagga> <bas-id>` där flagga ∈ {--kontrollera,
 *  --utfor-schema, --utfor-rader}. Bas-ID:t är ALLTID ett argument, ALDRIG
 *  ur config (prod-ref-låsets disciplin, se filhuvudet). Kastar ArgError vid
 *  okänt/dubbelt/saknat läge, saknat bas-ID, eller ett bas-ID som inte är
 *  app-format (exit 2, se main()). */
export function parseArgs(argv) {
  const funna = Object.keys(MODE_FLAGS).filter((flagga) => argv.includes(flagga));
  if (funna.length === 0) {
    throw new ArgError(
      'Ange ett läge: --kontrollera, --utfor-schema eller --utfor-rader, plus ett bas-ID.',
    );
  }
  if (funna.length > 1) {
    throw new ArgError(`Ange ENDAST ETT läge åt gången — fick: ${funna.join(', ')}.`);
  }
  const flagga = funna[0];
  const mode = MODE_FLAGS[flagga];
  const flagIdx = argv.indexOf(flagga);
  const bas = argv[flagIdx + 1];
  if (!bas || bas.startsWith('--')) {
    throw new ArgError(`${flagga} kräver ett bas-ID som argument.`);
  }
  if (!BASE_ID_PATTERN.test(bas)) {
    throw new ArgError(
      `bas-ID "${bas}" är inte app-format (förväntat "app" + 14 tecken, t.ex. "${STAGING_BASE_ID}").`,
    );
  }
  return { mode, bas };
}

/**
 * Löser om körningen får fortsätta mot `bas` (TASK-338.6, samma kontrakt som
 * create-eventinnehall-modell.mjs § resolveTargetBaseId, ADR-125 § 8).
 *
 * `bas` = staging: returnerar rakt av, ingen gate. `bas` skiljer sig från
 * staging (prod, eller ett felskrivet ID): kräver att `godkandEnv` är EXAKT
 * samma sträng som `bas` — annars VÄGRAR (fail-closed generellt, ingen
 * enumererad prod-allowlist, så ett felskrivet ID aldrig glider igenom).
 *
 * @param {{ bas: string, stagingBaseId: string, godkandEnv: string|undefined }} args
 * @returns {string} bas-ID:t att köra mot (== bas, om vi kom hit).
 */
export function resolveTargetBaseId({ bas, stagingBaseId, godkandEnv }) {
  if (bas === stagingBaseId) return bas;
  if (godkandEnv !== bas) {
    throw new GuardError(
      `VÄGRAR: basen "${bas}" skiljer sig från staging ("${stagingBaseId}"). Skrivning/läsning mot en ` +
        `icke-staging-bas kräver miljövariabeln ${PROD_GODKAND_ENV_VAR}=<baseId> satt till EXAKT samma ` +
        `bas-ID på kommandoraden — Marcus GO i klartext (ADR-125 § 8). scripts/deny-prod-ref.sh vaktar ` +
        `INTE Airtable-bas-ID:n (endast Supabase-prod-refen, TASK-203) — denna guard ÄR den mekaniska ` +
        `spärren för detta skript, se filhuvudets § PROD-LÅSET. Satt värde: ` +
        `${godkandEnv === undefined ? '(saknas)' : `"${godkandEnv}"`}.`,
    );
  }
  return bas;
}

// ---------------------------------------------------------------------------
// Schema-hjälpare (pura, testade med syntetiska schema-objekt)
// ---------------------------------------------------------------------------

export function findTableByName(tables, name) {
  return (tables ?? []).find((t) => t.name === name);
}

export function findFieldByName(table, name) {
  return (table?.fields ?? []).find((f) => f.name === name);
}

/** Finns choicen `choiceName` redan i ett singleSelect-fälts options.choices? */
export function hasChoice(field, choiceName) {
  return (field?.options?.choices ?? []).some((c) => c.name === choiceName);
}

// ---------------------------------------------------------------------------
// Fält-body-byggare (review-runda 2, punkt 1) — EXPORTERADE, pura, INGEN
// nätverksanrop. Detta är den kod som tidigare hade buggen: Platsnamn-
// bodyn skickade fieldIdInLinkedTable/recordLinkFieldId på TOPPNIVÅ i
// stället för nästlat under `options`, vilket Airtables Meta-API (POST
// .../fields, variant multipleLookupValues) kräver — exakt som Plats-fältet
// redan gjorde RÄTT (options.linkedTableId). Extraherade till egna,
// exporterade funktioner så testsviten kan asserta body-FORMEN direkt utan
// att gå via hela plan/exekverings-DI:t.
// ---------------------------------------------------------------------------

export function buildPlatsFieldBody(platserTableId) {
  return {
    name: PLATS_FIELD_NAME,
    type: 'multipleRecordLinks',
    description:
      'Räckvidd = Gemensam: bilagans platsaxel (ADR-125 § Beslut 1, TASK-338.1/338.6). ' +
      'Länkad tabell: Platser. Högst en plats avsedd — Airtable kan inte tvinga max 1 ' +
      '(multipleRecordLinks), invarianten vaktas av adapter/EF (TASK-338.2/338.3), inte av basen. ' +
      'Tom = platsen begränsar inte.',
    options: { linkedTableId: platserTableId },
  };
}

export function buildPlatsnamnFieldBody(platsFieldId, platserNamnFieldId) {
  return {
    name: PLATSNAMN_FIELD_NAME,
    type: 'multipleLookupValues',
    description:
      'Lookup av Platser.Namn via länken Plats (ADR-125 § Beslut 1, TASK-338.1/338.6). Låter ' +
      'appen och Lotta läsa platsnamnet utan extra uppslag; server-läsvägen matchar ändå på ' +
      'Plats-länkens record-ID, aldrig på detta namn.',
    options: { recordLinkFieldId: platsFieldId, fieldIdInLinkedTable: platserNamnFieldId },
  };
}

// ---------------------------------------------------------------------------
// --kontrollera — läsvägens rapport (ren funktion: schema + rader in, en
// strukturerad, printbar rapport ut)
// ---------------------------------------------------------------------------

/**
 * Bygger --kontrollera-rapporten. Rör inget nätverk själv — tar redan
 * hämtat schema (tables-array från Meta-API:t) och redan hämtade
 * Bilagor-rader (id/Namn/Räckvidd).
 */
export function buildKontrolleraReport({ tables, bilagorRecords }) {
  const bilagorTable = findTableByName(tables, BILAGOR_TABLE_NAME);
  const platserTable = findTableByName(tables, PLATSER_TABLE_NAME);
  if (!bilagorTable)
    throw new GuardError(`tabellen "${BILAGOR_TABLE_NAME}" hittades inte i basen.`);
  if (!platserTable)
    throw new GuardError(`tabellen "${PLATSER_TABLE_NAME}" hittades inte i basen.`);

  const rackviddField = findFieldByName(bilagorTable, RACKVIDD_FIELD_NAME);
  if (!rackviddField) {
    throw new GuardError(`fältet "${RACKVIDD_FIELD_NAME}" hittades inte på ${BILAGOR_TABLE_NAME}.`);
  }
  const platsField = findFieldByName(bilagorTable, PLATS_FIELD_NAME);
  const platsnamnField = findFieldByName(bilagorTable, PLATSNAMN_FIELD_NAME);

  const rackviddFordelning = {};
  let attMigrera = 0;
  let redanGemensam = 0;
  for (const r of bilagorRecords) {
    const varde = r.fields?.[RACKVIDD_FIELD_NAME] ?? '(tomt)';
    rackviddFordelning[varde] = (rackviddFordelning[varde] ?? 0) + 1;
    if (LEGACY_RACKVIDD_VARDEN.includes(varde)) attMigrera += 1;
    if (varde === GEMENSAM_CHOICE_NAME) redanGemensam += 1;
  }

  return {
    bilagorTableId: bilagorTable.id,
    platserTableId: platserTable.id,
    gemensamChoiceFinns: hasChoice(rackviddField, GEMENSAM_CHOICE_NAME),
    rackviddChoices: (rackviddField.options?.choices ?? []).map((c) => c.name),
    platsFieldFinns: Boolean(platsField),
    platsnamnFieldFinns: Boolean(platsnamnField),
    totaltAntalRader: bilagorRecords.length,
    rackviddFordelning,
    attMigrera,
    redanGemensam,
  };
}

export function formatKontrolleraReport(report, basId) {
  const rader = [
    `Bas: ${basId}`,
    `Bilagor-tabell: ${report.bilagorTableId} · Platser-tabell: ${report.platserTableId}`,
    '',
    `Räckvidd-choices: ${report.rackviddChoices.join(', ')}`,
    `  "${GEMENSAM_CHOICE_NAME}" finns: ${report.gemensamChoiceFinns ? 'JA' : 'NEJ'}`,
    `Plats-fält finns: ${report.platsFieldFinns ? 'JA' : 'NEJ'}`,
    `Platsnamn-fält finns: ${report.platsnamnFieldFinns ? 'JA' : 'NEJ'}`,
    '',
    `Bilagor-rader totalt: ${report.totaltAntalRader}`,
    ...Object.entries(report.rackviddFordelning).map(([v, n]) => `  Räckvidd="${v}": ${n}`),
    `Att migrera (Kurstyp/Alla event → Gemensam): ${report.attMigrera}`,
    `Redan Gemensam: ${report.redanGemensam}`,
  ];
  return rader.join('\n');
}

// ---------------------------------------------------------------------------
// --utfor-schema — planering (ren funktion) + exekvering (injicerade
// API-anrop). Rör ALDRIG en riktig Bilagor-rad (review-runda 2, punkt 2) och
// gör CONFIG-BASERAD idempotens (punkt 4): ett fält som redan existerar men
// är FELKONFIGURERAT (fel typ, fel linkedTableId/recordLinkFieldId/
// fieldIdInLinkedTable) fäller med GuardError i stället för att tystas ner
// som "redan klart".
// ---------------------------------------------------------------------------

/**
 * Planerar VAD --utfor-schema behöver göra, givet redan hämtat schema. Rör
 * inget nätverk och tar INGA Bilagor-rader (schema-steget är radlöst med
 * flit). Testbar med syntetiska schema-objekt för: allt finns (no-op),
 * delvis (ett fält saknas), inget finns, OCH felkonfiguration (mismatch).
 */
export function planSchema({ tables }) {
  const bilagorTable = findTableByName(tables, BILAGOR_TABLE_NAME);
  const platserTable = findTableByName(tables, PLATSER_TABLE_NAME);
  if (!bilagorTable)
    throw new GuardError(`tabellen "${BILAGOR_TABLE_NAME}" hittades inte i basen.`);
  if (!platserTable)
    throw new GuardError(`tabellen "${PLATSER_TABLE_NAME}" hittades inte i basen.`);

  const rackviddField = findFieldByName(bilagorTable, RACKVIDD_FIELD_NAME);
  if (!rackviddField) {
    throw new GuardError(`fältet "${RACKVIDD_FIELD_NAME}" hittades inte på ${BILAGOR_TABLE_NAME}.`);
  }
  const platsField = findFieldByName(bilagorTable, PLATS_FIELD_NAME);
  const platsnamnField = findFieldByName(bilagorTable, PLATSNAMN_FIELD_NAME);
  const platserNamnField = findFieldByName(platserTable, PLATSER_NAMN_FIELD_NAME);
  if (!platserNamnField) {
    throw new GuardError(
      `fältet "${PLATSER_NAMN_FIELD_NAME}" hittades inte på ${PLATSER_TABLE_NAME}.`,
    );
  }

  // Option-tillägget: ALLTID kastbar rad om choicen saknas (aldrig en
  // riktig rad — se filhuvudets § VAL-TILLÄGG).
  const optionAdd = hasChoice(rackviddField, GEMENSAM_CHOICE_NAME)
    ? { strategy: 'already-exists' }
    : { strategy: 'throwaway-record' };

  // Plats-fältet — config-baserad idempotens (punkt 4): existerar det men
  // pekar mot FEL tabell eller har fel typ, rör vi INGET.
  let platsFieldPlan;
  if (platsField) {
    if (
      platsField.type !== 'multipleRecordLinks' ||
      platsField.options?.linkedTableId !== platserTable.id
    ) {
      throw new GuardError(
        `fältet "${PLATS_FIELD_NAME}" finns men är FELKONFIGURERAT (type="${platsField.type}", ` +
          `linkedTableId="${platsField.options?.linkedTableId}" — förväntat multipleRecordLinks → ` +
          `"${platserTable.id}"). Rör INGET — kräver manuell utredning innan skriptet kan fortsätta.`,
      );
    }
    platsFieldPlan = { strategy: 'skip', existingId: platsField.id };
  } else {
    platsFieldPlan = { strategy: 'create', body: buildPlatsFieldBody(platserTable.id) };
  }

  // Platsnamn-fältet — samma disciplin. Ett Platsnamn-fält kan strukturellt
  // inte existera utan att Plats redan fanns (det är en lookup GENOM Plats)
  // — om den kombinationen ändå observeras är basen i ett inkonsistent
  // tillstånd och vi rör INGET.
  let platsnamnFieldPlan;
  if (platsnamnField) {
    if (!platsField) {
      throw new GuardError(
        `fältet "${PLATSNAMN_FIELD_NAME}" finns men "${PLATS_FIELD_NAME}" (dess länk) gör det INTE — ` +
          'inkonsistent schema. Rör INGET — kräver manuell utredning.',
      );
    }
    if (
      platsnamnField.type !== 'multipleLookupValues' ||
      platsnamnField.options?.recordLinkFieldId !== platsField.id ||
      platsnamnField.options?.fieldIdInLinkedTable !== platserNamnField.id
    ) {
      throw new GuardError(
        `fältet "${PLATSNAMN_FIELD_NAME}" finns men är FELKONFIGURERAT (type="${platsnamnField.type}", ` +
          `recordLinkFieldId="${platsnamnField.options?.recordLinkFieldId}" — förväntat "${platsField.id}", ` +
          `fieldIdInLinkedTable="${platsnamnField.options?.fieldIdInLinkedTable}" — förväntat ` +
          `"${platserNamnField.id}"). Rör INGET — kräver manuell utredning innan skriptet kan fortsätta.`,
      );
    }
    platsnamnFieldPlan = { strategy: 'skip' };
  } else {
    platsnamnFieldPlan = { strategy: 'create', platserNamnFieldId: platserNamnField.id };
  }

  return { optionAdd, platsField: platsFieldPlan, platsnamnField: platsnamnFieldPlan };
}

/**
 * Exekverar en plan från planSchema(). Sido-effekter via injicerade
 * API-funktioner (DI-mönstret från create-eventinnehall-modell.mjs §
 * runOperations) — hermetiskt testbar utan nätverk.
 *
 * @param {object} plan  Från planSchema().
 * @param {{
 *   createThrowawayAndDelete: () => Promise<void>,
 *   createField: (body: object) => Promise<{id: string}>,
 * }} api
 */
export async function runSchema(plan, api) {
  const skrivningar = { optionAdd: 0, platsField: 0, platsnamnField: 0 };
  const logg = [];

  if (plan.optionAdd.strategy === 'already-exists') {
    logg.push(`✅ Choicen "${GEMENSAM_CHOICE_NAME}" finns redan — inget att göra.`);
  } else {
    await api.createThrowawayAndDelete();
    skrivningar.optionAdd = 2; // create + delete, ingen riktig rad rörd.
    logg.push(
      `🛠️  Choicen "${GEMENSAM_CHOICE_NAME}" skapad via en kastbar rad (skapad + raderad — ingen ` +
        'riktig Bilagor-rad rörd).',
    );
  }

  let platsFieldId = plan.platsField.existingId ?? null;
  if (plan.platsField.strategy === 'skip') {
    logg.push(`✅ Fältet "${PLATS_FIELD_NAME}" finns redan (${platsFieldId}) — inget att göra.`);
  } else {
    const created = await api.createField(plan.platsField.body);
    platsFieldId = created.id;
    skrivningar.platsField = 1;
    logg.push(`🛠️  Fältet "${PLATS_FIELD_NAME}" skapat — ${created.id}.`);
  }

  if (plan.platsnamnField.strategy === 'skip') {
    logg.push(`✅ Fältet "${PLATSNAMN_FIELD_NAME}" finns redan — inget att göra.`);
  } else {
    const body = buildPlatsnamnFieldBody(platsFieldId, plan.platsnamnField.platserNamnFieldId);
    const created = await api.createField(body);
    skrivningar.platsnamnField = 1;
    logg.push(`🛠️  Fältet "${PLATSNAMN_FIELD_NAME}" skapat — ${created.id}.`);
  }

  return { skrivningar, logg, platsFieldId };
}

/** Fail-closed-beslutet för --utfor-schemas post-verifiering (punkt 3) —
 *  ren funktion, testbar utan I/O. Konvergerat = choicen finns OCH båda
 *  fälten redan finns (dvs en FÄRSK planSchema() mot samma bas ger enbart
 *  skip/already-exists-strategier). */
export function schemaKonvergerad(verifieringsPlan) {
  return (
    verifieringsPlan.optionAdd.strategy === 'already-exists' &&
    verifieringsPlan.platsField.strategy === 'skip' &&
    verifieringsPlan.platsnamnField.strategy === 'skip'
  );
}

// ---------------------------------------------------------------------------
// --utfor-rader — planering (ren funktion) + exekvering (injicerade
// API-anrop). Kräver att choicen redan finns (annars GuardError — kör
// --utfor-schema FÖRST).
// ---------------------------------------------------------------------------

export function planRader({ tables, bilagorRecords }) {
  const bilagorTable = findTableByName(tables, BILAGOR_TABLE_NAME);
  if (!bilagorTable)
    throw new GuardError(`tabellen "${BILAGOR_TABLE_NAME}" hittades inte i basen.`);
  const rackviddField = findFieldByName(bilagorTable, RACKVIDD_FIELD_NAME);
  if (!rackviddField) {
    throw new GuardError(`fältet "${RACKVIDD_FIELD_NAME}" hittades inte på ${BILAGOR_TABLE_NAME}.`);
  }
  if (!hasChoice(rackviddField, GEMENSAM_CHOICE_NAME)) {
    throw new GuardError(
      `Choicen "${GEMENSAM_CHOICE_NAME}" finns INTE ännu på ${RACKVIDD_FIELD_NAME} — kör ` +
        '--utfor-schema FÖRST (TASK-338.6, steg (i) före steg (iii)).',
    );
  }
  const rowsToMigrate = bilagorRecords
    .filter((r) => LEGACY_RACKVIDD_VARDEN.includes(r.fields?.[RACKVIDD_FIELD_NAME]))
    .map((r) => ({ id: r.id, namn: r.fields?.Namn }));
  return { rowsToMigrate };
}

/** Dela en array i batchar om `size` (Airtables PATCH/POST-tak). */
export function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * @param {object} plan  Från planRader().
 * @param {{ patchRackvidd: (recordIds: string[]) => Promise<void> }} api
 */
export async function runRader(plan, api) {
  const skrivningar = { radMigrering: 0 };
  const logg = [];
  if (plan.rowsToMigrate.length === 0) {
    logg.push('✅ Inga rader att migrera.');
  } else {
    const batchar = chunk(
      plan.rowsToMigrate.map((r) => r.id),
      RECORD_BATCH_SIZE,
    );
    for (const batch of batchar) {
      await api.patchRackvidd(batch);
      skrivningar.radMigrering += batch.length;
    }
    logg.push(`🛠️  ${plan.rowsToMigrate.length} rad(er) migrerade till "${GEMENSAM_CHOICE_NAME}".`);
  }
  return { skrivningar, logg };
}

/** Fail-closed-beslutet för --utfor-raders post-verifiering (punkt 3) — ren
 *  funktion. Konvergerat = 0 legacy-rader kvar EFTER migreringen. */
export function raderKonvergerade(efterLegacyCount) {
  return efterLegacyCount === 0;
}

// ---------------------------------------------------------------------------
// Airtable-API (nätverksanropande skal runt de pura funktionerna ovan).
// `fetchImpl`/`sleepImpl` injicerbara (default: globalt fetch/verklig sleep)
// så retry-/backoff-logiken är hermetiskt testbar (review-runda 2, punkt 5).
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const MAX_5XX_RETRIES = 2;

export async function airtableRequest(
  url,
  token,
  init = {},
  { fetchImpl = fetch, sleepImpl = sleep } = {},
) {
  const headers = { Authorization: `Bearer ${token}` };
  if (init.body) headers['Content-Type'] = 'application/json';
  for (let forsok = 0; ; forsok += 1) {
    let res = await fetchImpl(url, { ...init, headers });
    if (res.status === 429) {
      console.log('   429 rate limit — väntar 30 s och försöker igen …');
      await sleepImpl(30_000);
      res = await fetchImpl(url, { ...init, headers });
    }
    if (res.ok) return res.json();
    if (res.status >= 500 && res.status < 600 && forsok < MAX_5XX_RETRIES) {
      const backoffMs = 1000 * 2 ** forsok;
      console.log(
        `   ${res.status} serverfel — försök ${forsok + 1}/${MAX_5XX_RETRIES + 1} misslyckades, ` +
          `väntar ${backoffMs} ms …`,
      );
      await sleepImpl(backoffMs);
      continue;
    }
    const body = await res.text().catch(() => '');
    throw new ApiError(`Airtable ${init.method ?? 'GET'} ${res.status}: ${body.slice(0, 800)}`);
  }
}

async function getBaseSchema(baseId, schemaToken) {
  const data = await airtableRequest(`${AIRTABLE_META_URL}/${baseId}/tables`, schemaToken);
  return data.tables ?? [];
}

/** Hämtar ALLA rader (paginerat) för ett fält-urval, ev. filtrerat. */
async function listAllRecords(baseId, tableId, recordsToken, { filterByFormula, fields } = {}) {
  const out = [];
  let offset;
  do {
    const params = new URLSearchParams();
    if (filterByFormula) params.set('filterByFormula', filterByFormula);
    for (const f of fields ?? []) params.append('fields[]', f);
    params.set('pageSize', '100');
    if (offset) params.set('offset', offset);
    const data = await airtableRequest(
      `${AIRTABLE_RECORDS_URL}/${baseId}/${tableId}?${params.toString()}`,
      recordsToken,
    );
    out.push(...(data.records ?? []));
    offset = data.offset;
  } while (offset);
  return out;
}

async function patchRackvidd(baseId, bilagorTableId, recordsToken, recordIds) {
  await airtableRequest(`${AIRTABLE_RECORDS_URL}/${baseId}/${bilagorTableId}`, recordsToken, {
    method: 'PATCH',
    body: JSON.stringify({
      typecast: true,
      records: recordIds.map((id) => ({
        id,
        fields: { [RACKVIDD_FIELD_NAME]: GEMENSAM_CHOICE_NAME },
      })),
    }),
  });
}

async function createThrowawayAndDelete(baseId, bilagorTableId, recordsToken) {
  const created = await airtableRequest(
    `${AIRTABLE_RECORDS_URL}/${baseId}/${bilagorTableId}`,
    recordsToken,
    {
      method: 'POST',
      body: JSON.stringify({
        typecast: true,
        records: [{ fields: { [RACKVIDD_FIELD_NAME]: GEMENSAM_CHOICE_NAME } }],
      }),
    },
  );
  const id = created.records?.[0]?.id;
  if (!id) throw new ApiError('createThrowawayAndDelete: inget record-id i svaret.');
  const params = new URLSearchParams();
  params.append('records[]', id);
  await airtableRequest(
    `${AIRTABLE_RECORDS_URL}/${baseId}/${bilagorTableId}?${params.toString()}`,
    recordsToken,
    {
      method: 'DELETE',
    },
  );
}

async function createFieldApi(baseId, tableId, schemaToken, body) {
  return airtableRequest(`${AIRTABLE_META_URL}/${baseId}/tables/${tableId}/fields`, schemaToken, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  let args;
  let targetBaseId;
  try {
    args = parseArgs(process.argv.slice(2));
    targetBaseId = resolveTargetBaseId({
      bas: args.bas,
      stagingBaseId: STAGING_BASE_ID,
      godkandEnv: process.env[PROD_GODKAND_ENV_VAR],
    });
  } catch (err) {
    if (err instanceof ArgError) {
      console.error(`❌ Argument-/bas-ID-fel: ${err.message}`);
      process.exit(2);
    }
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }

  const korMotProd = targetBaseId !== STAGING_BASE_ID;
  if (korMotProd) {
    console.log(
      `⚠️  Kör mot ICKE-STAGING-basen ${targetBaseId} — ${PROD_GODKAND_ENV_VAR} verifierad (ADR-125 § 8).`,
    );
  }

  const schemaToken = process.env.AIRTABLE_SCHEMA_TOKEN;
  const recordsToken = process.env.STAGING_AIRTABLE_TOKEN;
  if (!schemaToken) {
    console.error(
      '❌ AIRTABLE_SCHEMA_TOKEN saknas i env. Lokalt: .env.seed (gitignorad; se .env.seed.example). ' +
        `Token behöver PAT-scopet schema.bases:read+write mot målbasen (${targetBaseId}) — se ` +
        'filhuvudets § TOKEN för distinktionen mot basens permissionLevel.',
    );
    process.exit(3);
  }
  if (!recordsToken) {
    console.error(
      '❌ STAGING_AIRTABLE_TOKEN saknas i env. Lokalt: .env.seed. Token behöver data.records:read+write ' +
        `mot målbasen (${targetBaseId}). ${
          korMotProd
            ? 'För en prod-körning: Marcus sätter en prod-scopad PAT under samma variabelnamn inline på kommandoraden (aldrig i .env.seed).'
            : ''
        }`,
    );
    process.exit(3);
  }

  if (args.mode === 'utfor-schema' || args.mode === 'utfor-rader') {
    console.log(
      `ℹ️  ${args.mode} körs. Har --kontrollera <bas-id> körts först för att granska planen? Inte ` +
        'obligatoriskt, men rekommenderat (TASK-338.6).',
    );
  }

  // Staging-mutexen (TASK-91/TASK-84) bevakar staging-kontention — irrelevant
  // för en prod-körning (samma undantag som create-eventinnehall-modell.mjs
  // § TASK-309.9). Körs EFTER policy-/token-guards ovan (ett saknat token ska
  // synas som DET felet) och FÖRE första Airtable-anropet nedan.
  if (!korMotProd) {
    kravStagingLedigt(`lokal task-338-6-prod-migration (${args.mode})`);
  }

  try {
    const tables = await getBaseSchema(targetBaseId, schemaToken);
    const bilagorTable = findTableByName(tables, BILAGOR_TABLE_NAME);
    if (!bilagorTable) {
      throw new GuardError(
        `tabellen "${BILAGOR_TABLE_NAME}" hittades inte i basen ${targetBaseId}.`,
      );
    }

    if (args.mode === 'kontrollera') {
      const bilagorRecords = await listAllRecords(targetBaseId, bilagorTable.id, recordsToken, {
        fields: ['Namn', RACKVIDD_FIELD_NAME],
      });
      const report = buildKontrolleraReport({ tables, bilagorRecords });
      console.log(formatKontrolleraReport(report, targetBaseId));
      process.exit(0);
    }

    if (args.mode === 'utfor-schema') {
      const plan = planSchema({ tables });
      const { skrivningar, logg } = await runSchema(plan, {
        createThrowawayAndDelete: () =>
          createThrowawayAndDelete(targetBaseId, bilagorTable.id, recordsToken),
        createField: (body) => createFieldApi(targetBaseId, bilagorTable.id, schemaToken, body),
      });
      for (const rad of logg) console.log(rad);

      // Fail-closed post-verifiering (punkt 3): läs schemat FÄRSKT och
      // pröva planSchema() igen — konvergerat betyder "allt redan i synk".
      const freshTables = await getBaseSchema(targetBaseId, schemaToken);
      let verifieringsPlan;
      try {
        verifieringsPlan = planSchema({ tables: freshTables });
      } catch (err) {
        console.error(`❌ Räkneverifiering EFTER --utfor-schema: ${err.message}`);
        process.exit(4);
      }
      const konvergerat = schemaKonvergerad(verifieringsPlan);
      console.log('');
      console.log(
        `── Verifiering efter --utfor-schema ── konvergerat: ${konvergerat ? 'JA' : 'NEJ'}`,
      );
      console.log(
        `Skrivningar: optionAdd=${skrivningar.optionAdd} platsField=${skrivningar.platsField} ` +
          `platsnamnField=${skrivningar.platsnamnField}`,
      );
      if (!konvergerat) {
        console.error('❌ Schemat konvergerade INTE efter --utfor-schema — se utskriften ovan.');
        process.exit(4);
      }
      process.exit(0);
    }

    // args.mode === 'utfor-rader'
    const bilagorRecordsFore = await listAllRecords(targetBaseId, bilagorTable.id, recordsToken, {
      fields: ['Namn', RACKVIDD_FIELD_NAME],
    });
    const plan = planRader({ tables, bilagorRecords: bilagorRecordsFore });
    const { skrivningar, logg } = await runRader(plan, {
      patchRackvidd: (ids) => patchRackvidd(targetBaseId, bilagorTable.id, recordsToken, ids),
    });
    for (const rad of logg) console.log(rad);

    // Fail-closed post-verifiering (punkt 3).
    const efterLegacy = await listAllRecords(targetBaseId, bilagorTable.id, recordsToken, {
      filterByFormula: `OR({${RACKVIDD_FIELD_NAME}}='Kurstyp',{${RACKVIDD_FIELD_NAME}}='Alla event')`,
      fields: ['Namn'],
    });
    const efterGemensam = await listAllRecords(targetBaseId, bilagorTable.id, recordsToken, {
      filterByFormula: `{${RACKVIDD_FIELD_NAME}}='${GEMENSAM_CHOICE_NAME}'`,
      fields: ['Namn'],
    });
    const konvergerat = raderKonvergerade(efterLegacy.length);
    console.log('');
    console.log(
      `── Räkneverifiering efter --utfor-rader ── konvergerat: ${konvergerat ? 'JA' : 'NEJ'}`,
    );
    console.log(`Kurstyp/Alla event kvar: ${efterLegacy.length} (förväntat 0)`);
    console.log(`Gemensam totalt: ${efterGemensam.length}`);
    console.log(`Skrivningar: radMigrering=${skrivningar.radMigrering}`);
    if (!konvergerat) {
      console.error(
        `❌ Räkneverifiering: ${efterLegacy.length} legacy-rad(er) kvar EFTER --utfor-rader — förväntat 0.`,
      );
      process.exit(4);
    }
    process.exit(0);
  } catch (err) {
    if (err instanceof GuardError) {
      console.error(`❌ Guard-fel: ${err.message}`);
      process.exit(1);
    }
    console.error(`❌ ${err instanceof ApiError ? 'API-fel' : 'Oväntat fel'}: ${err.message}`);
    process.exit(3);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
