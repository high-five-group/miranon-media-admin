#!/usr/bin/env node
// scripts/task-338-6-prod-migration.mjs — FÖRBEREDELSE-skriptet för
// TASK-338.6 (ADR-125 § Beslut 1, § 8: Marcus GO per tabell). Byggt av en
// agent, KÖRT AV MARCUS mot prod — se § PROD-LÅSET nedan för varför.
//
// VAD SKRIPTET GÖR (samma STAGING-halva som TASK-338.1 redan bevisade skarpt,
// generaliserat till ett IDEMPOTENT, ÅTERANVÄNDBART verktyg i stället för
// engångs-MCP-anrop):
//   Steg (i)  schema, additivt:
//     — option "Gemensam" på Bilagor.Räckvidd (singleSelect kan INTE få en
//       ny choice via Meta-API PATCH, se § PLATTFORMSVÄGG nedan — vägen som
//       FUNGERAR är en records-skrivning med typecast:true, TASK-338.1s
//       skarpt bevisade fynd)
//     — länkfältet Bilagor.Plats → Platser (multipleRecordLinks)
//     — lookup-fältet Bilagor.Platsnamn (Platser.Namn via Plats)
//   Steg (iii) radmigrering: alla Bilagor-rader med Räckvidd ∈
//     {Kurstyp, Alla event} → Gemensam, i batchar om 10, Kursfamilj/Kursnivå
//     ORÖRDA (fälten ingår aldrig i PATCH-payloaden), räknat före/efter.
//
// Steg (ii) — EF-deployen — är UTTRYCKLIGEN INTE detta skripts jobb.
// scripts/fas4-prod-deploy.sh --deploya gör det, i Marcus EGET
// terminalfönster (CLAUDE.md § Prod-EF-deploy — aldrig via `!`-prefixet).
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
// bas-ID som `--kontrollera`/`--utfor` fick, INNAN någon nätverksanrop görs.
// Denna guard KÖRDES skarpt av agenten mot app8uGPrVCVOm6LfD (utan att sätta
// miljövariabeln) och VÄGRADE — se PR-rapporten för den exakta utskriften.
// Det är beviset uppdraget bad om, fast producerat av rätt mekanism.
//
// Samma öppna gräns som deny-prod-ref.sh § header redan medger: detta är en
// DOKUMENTERAD konvention (env-var måste sättas av Marcus, i klartext, på
// KOMMANDORADEN — aldrig av en agent på eget initiativ), inte ett
// matematiskt bevisat outbrytbart lås. Se PROD_GODKAND_ENV_VAR nedan.
//
// ─────────────────────────────────────────────────────────────────────────
// PLATTFORMSVÄGG (TASK-338.1, skarpt mätt, återanvänd här) — val-tillägg
// ─────────────────────────────────────────────────────────────────────────
// `mcp__airtable__update_field` (och den bakomliggande Meta-API PATCH mot
// /v0/meta/bases/{baseId}/tables/{tableId}/fields/{fieldId}) kan INTE lägga
// till en choice på en BEFINTLIG singleSelect — Airtables egen 422:
// "Changing a field's type or number precision is not currently supported."
// Vägen som FUNGERAR: en records-skrivning (POST/PATCH mot
// /v0/{baseId}/{tableId}) med `typecast: true` och ett okänt strängvärde —
// Airtable skapar choicen automatiskt. Detta skript använder DÄRFÖR:
//   — om det finns en rad med Räckvidd ∈ {Kurstyp, Alla event}: PATCHa DEN
//     raden till "Gemensam" (typecast:true). Detta är en KORREKT, PERMANENT
//     migrering av den raden — inget att ångra, ingen "sätt-och-återställ".
//   — annars (tabellen har inga legacy-rader men minst en rad totalt):
//     samma trick på en ANNAN rad hade rört RIKTIG produktionsdata i onödan
//     (en kort tidslucka där en obesläktad bilagas Räckvidd tillfälligt
//     visar "Gemensam"). I stället: skapa en KASTBAR rad
//     ({Räckvidd:"Gemensam"}, typecast:true), radera den omedelbart. Denna
//     reservväg är OPRÖVAD SKARPT (dokumenterad här, inte mätt) — se
//     `planOptionAdd` § reservväg. Prod har i praktiken alltid legacy-rader
//     (Marcus två "Alla event"-dokument, TASK-338 § Implementationsbeslut)
//     så primärvägen förväntas alltid vinna.
//   — tabellen helt tom: guard-fel, kräver manuell hantering.
//
// ─────────────────────────────────────────────────────────────────────────
// TOKEN (samma källa som repots övriga Airtable-skript, TASK-146.2/309.2-
// mönstret): AIRTABLE_SCHEMA_TOKEN (schema.bases:read+write — fältskapelse)
// och STAGING_AIRTABLE_TOKEN (data.records:read+write — options-tillägg via
// typecast + radmigrering). Namnet "STAGING_AIRTABLE_TOKEN" är historiskt
// (ADR-060 punkt 4); för en prod-körning sätter Marcus samma variabelnamn
// till en prod-scopad PAT INLINE på kommandoraden (aldrig i .env.seed) —
// exakt samma konvention som create-eventinnehall-modell.mjs § filhuvud
// "PROD-KÖRNINGEN" redan etablerar.
//
// API-FORMEN: Airtable Web API (Meta för schema, vanliga records-API:t för
// data), samma som repots övriga schema-/migreringsskript.
//
// Exit: 0 = OK. 1 = prod-lås-VÄGRAN (icke-staging-bas utan
// AIRTABLE_PROD_GODKAND_AV_MARCUS). 2 = argument-/bas-ID-form-fel. 3 =
// Airtable-API-fel (nätverk/HTTP).

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

/** Tolka argv. Formen är `--kontrollera <bas-id>` ELLER `--utfor <bas-id>` —
 *  bas-ID:t är ALLTID ett argument, ALDRIG ur config (prod-ref-låsets
 *  disciplin, se filhuvudet). Kastar ArgError vid okänt läge, saknat
 *  bas-ID, eller ett bas-ID som inte är app-format (exit 2, se main()). */
export function parseArgs(argv) {
  const kontrolleraIdx = argv.indexOf('--kontrollera');
  const utforIdx = argv.indexOf('--utfor');
  if (kontrolleraIdx === -1 && utforIdx === -1) {
    throw new ArgError('Ange antingen --kontrollera <bas-id> eller --utfor <bas-id>.');
  }
  if (kontrolleraIdx !== -1 && utforIdx !== -1) {
    throw new ArgError('Ange ENDAST ett läge: --kontrollera ELLER --utfor, inte båda.');
  }
  const mode = kontrolleraIdx !== -1 ? 'kontrollera' : 'utfor';
  const flagIdx = kontrolleraIdx !== -1 ? kontrolleraIdx : utforIdx;
  const bas = argv[flagIdx + 1];
  if (!bas || bas.startsWith('--')) {
    throw new ArgError(
      `--${mode === 'kontrollera' ? 'kontrollera' : 'utfor'} kräver ett bas-ID som argument.`,
    );
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
// --utfor — planering (ren funktion) + exekvering (injicerade API-anrop)
// ---------------------------------------------------------------------------

/**
 * Planerar VAD --utfor behöver göra, givet redan hämtat schema + redan
 * hämtade Bilagor-rader (med Räckvidd). Rör inget nätverk. Testbar med
 * syntetiska indata för alla tre tillstånd: allt finns (no-op-plan),
 * delvis (bara fältet saknas), inget finns (allt planeras).
 */
export function planUtfor({ tables, bilagorRecords }) {
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

  // Plan A: option-tillägget. Legacy-raderna (om några) är den ENDA källan
  // till "vilka rader behöver migreras" — samma lista konsumeras av
  // rowsToMigrate nedan. Väljer vi en legacy-rad som optionAdd-bäraren
  // exkluderas den ur rowsToMigrate (annars dubbel-PATCH — harmlöst men
  // onödigt).
  const legacyRader = bilagorRecords.filter((r) =>
    LEGACY_RACKVIDD_VARDEN.includes(r.fields?.[RACKVIDD_FIELD_NAME]),
  );

  let optionAdd;
  if (hasChoice(rackviddField, GEMENSAM_CHOICE_NAME)) {
    optionAdd = { strategy: 'already-exists' };
  } else if (legacyRader.length > 0) {
    optionAdd = { strategy: 'migrate-existing-row', recordId: legacyRader[0].id };
  } else if (bilagorRecords.length > 0) {
    optionAdd = { strategy: 'throwaway-record' };
  } else {
    throw new GuardError(
      `"${GEMENSAM_CHOICE_NAME}"-choicen saknas och ${BILAGOR_TABLE_NAME} har INGA rader att typecasta ` +
        'mot (varken en legacy-rad eller någon annan rad). Kräver manuell hantering — se filhuvudets § PLATTFORMSVÄGG.',
    );
  }

  const platsFieldPlan = platsField
    ? { strategy: 'skip', existingId: platsField.id }
    : {
        strategy: 'create',
        body: {
          name: PLATS_FIELD_NAME,
          type: 'multipleRecordLinks',
          description:
            'Räckvidd = Gemensam: bilagans platsaxel (ADR-125 § Beslut 1, TASK-338.1/338.6). ' +
            'Länkad tabell: Platser. Högst en plats avsedd — Airtable kan inte tvinga max 1 ' +
            '(multipleRecordLinks), invarianten vaktas av adapter/EF (TASK-338.2/338.3), inte av basen. ' +
            'Tom = platsen begränsar inte.',
          options: { linkedTableId: platserTable.id },
        },
      };

  // Om Plats-fältet redan finns används dess LEVANDE id; skapas det i
  // SAMMA körning är id:t okänt förrän efter skapelsen (trådas av
  // runUtfor, se nedan — planen bär bara strategin).
  const platsnamnFieldPlan = platsnamnField
    ? { strategy: 'skip' }
    : {
        strategy: 'create',
        // recordLinkFieldId sätts av runUtfor (behöver Plats-fältets id,
        // känt först vid exekvering om det skapas i samma pass).
        bodyTemplate: {
          name: PLATSNAMN_FIELD_NAME,
          type: 'multipleLookupValues',
          description:
            'Lookup av Platser.Namn via länken Plats (ADR-125 § Beslut 1, TASK-338.1/338.6). Låter ' +
            'appen och Lotta läsa platsnamnet utan extra uppslag; server-läsvägen matchar ändå på ' +
            'Plats-länkens record-ID, aldrig på detta namn.',
          fieldIdInLinkedTable: platserNamnField.id,
        },
      };

  const optionAddRecordId =
    optionAdd.strategy === 'migrate-existing-row' ? optionAdd.recordId : null;
  const rowsToMigrate = legacyRader
    .filter((r) => r.id !== optionAddRecordId)
    .map((r) => ({ id: r.id, namn: r.fields?.Namn }));

  return {
    optionAdd,
    platsField: platsFieldPlan,
    platsnamnField: platsnamnFieldPlan,
    rowsToMigrate,
    legacyRaderTotalt: legacyRader.length,
  };
}

/** Dela en array i batchar om `size` (Airtables PATCH/POST-tak). */
export function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Exekverar en plan från planUtfor(). Alla sido-effekter går via injicerade
 * API-funktioner (samma DI-mönster som create-eventinnehall-modell.mjs §
 * runOperations) — hermetiskt testbar utan nätverk.
 *
 * @param {object} plan  Från planUtfor().
 * @param {{
 *   patchRackvidd: (recordIds: string[]) => Promise<void>,
 *   createThrowawayAndDelete: () => Promise<void>,
 *   createField: (body: object) => Promise<{id: string}>,
 * }} api
 */
export async function runUtfor(plan, api) {
  const skrivningar = { optionAdd: 0, platsField: 0, platsnamnField: 0, radMigrering: 0 };
  const logg = [];

  if (plan.optionAdd.strategy === 'already-exists') {
    logg.push(`✅ Choicen "${GEMENSAM_CHOICE_NAME}" finns redan — inget att göra.`);
  } else if (plan.optionAdd.strategy === 'migrate-existing-row') {
    await api.patchRackvidd([plan.optionAdd.recordId]);
    skrivningar.optionAdd = 1;
    logg.push(
      `🛠️  Choicen "${GEMENSAM_CHOICE_NAME}" skapad via typecast på rad ${plan.optionAdd.recordId} ` +
        '(korrekt permanent migrering av en legacy-rad, inget att återställa).',
    );
  } else {
    await api.createThrowawayAndDelete();
    skrivningar.optionAdd = 2; // create + delete
    logg.push(
      `🛠️  Choicen "${GEMENSAM_CHOICE_NAME}" skapad via en kastbar rad (skapad + raderad — RESERVVÄG, ` +
        'ej skarpt bevisad förut, se filhuvudets § PLATTFORMSVÄGG).',
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
    const body = { ...plan.platsnamnField.bodyTemplate, recordLinkFieldId: platsFieldId };
    const created = await api.createField(body);
    skrivningar.platsnamnField = 1;
    logg.push(`🛠️  Fältet "${PLATSNAMN_FIELD_NAME}" skapat — ${created.id}.`);
  }

  if (plan.rowsToMigrate.length === 0) {
    logg.push('✅ Inga ytterligare rader att migrera (utöver ev. option-tilläggets rad ovan).');
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

// ---------------------------------------------------------------------------
// Airtable-API (nätverksanropande skal runt de pura funktionerna ovan)
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function airtableRequest(url, token, init = {}) {
  const headers = { Authorization: `Bearer ${token}` };
  if (init.body) headers['Content-Type'] = 'application/json';
  let res = await fetch(url, { ...init, headers });
  if (res.status === 429) {
    console.log('   429 rate limit — väntar 30 s och försöker igen …');
    await sleep(30_000);
    res = await fetch(url, { ...init, headers });
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(`Airtable ${init.method ?? 'GET'} ${res.status}: ${body.slice(0, 800)}`);
  }
  return res.json();
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
        `Token behöver schema.bases:read+write mot målbasen (${targetBaseId}).`,
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

  if (args.mode === 'utfor') {
    console.log(
      'ℹ️  --utfor körs. Har --kontrollera <bas-id> körts först för att granska planen? Inte obligatoriskt, ' +
        'men rekommenderat (TASK-338.6).',
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
    if (!bilagorTable)
      throw new GuardError(
        `tabellen "${BILAGOR_TABLE_NAME}" hittades inte i basen ${targetBaseId}.`,
      );
    const bilagorRecords = await listAllRecords(targetBaseId, bilagorTable.id, recordsToken, {
      fields: ['Namn', RACKVIDD_FIELD_NAME],
    });

    if (args.mode === 'kontrollera') {
      const report = buildKontrolleraReport({ tables, bilagorRecords });
      console.log(formatKontrolleraReport(report, targetBaseId));
      process.exit(0);
    }

    // --utfor
    const plan = planUtfor({ tables, bilagorRecords });
    const { skrivningar, logg } = await runUtfor(plan, {
      patchRackvidd: (ids) => patchRackvidd(targetBaseId, bilagorTable.id, recordsToken, ids),
      createThrowawayAndDelete: () =>
        createThrowawayAndDelete(targetBaseId, bilagorTable.id, recordsToken),
      createField: (body) => createFieldApi(targetBaseId, bilagorTable.id, schemaToken, body),
    });
    for (const rad of logg) console.log(rad);

    // Räkneverifiering efter (AC #2/#3 — samma form som TASK-275/338.1).
    const efterLegacy = await listAllRecords(targetBaseId, bilagorTable.id, recordsToken, {
      filterByFormula: `OR({${RACKVIDD_FIELD_NAME}}='Kurstyp',{${RACKVIDD_FIELD_NAME}}='Alla event')`,
      fields: ['Namn'],
    });
    const efterGemensam = await listAllRecords(targetBaseId, bilagorTable.id, recordsToken, {
      filterByFormula: `{${RACKVIDD_FIELD_NAME}}='${GEMENSAM_CHOICE_NAME}'`,
      fields: ['Namn'],
    });
    console.log('');
    console.log('── Räkneverifiering efter ──');
    console.log(`Kurstyp/Alla event kvar: ${efterLegacy.length} (förväntat 0)`);
    console.log(`Gemensam totalt: ${efterGemensam.length}`);
    console.log('');
    console.log(
      `Skrivningar: optionAdd=${skrivningar.optionAdd} platsField=${skrivningar.platsField} ` +
        `platsnamnField=${skrivningar.platsnamnField} radMigrering=${skrivningar.radMigrering}`,
    );
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
