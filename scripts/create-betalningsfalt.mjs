#!/usr/bin/env node
// scripts/create-betalningsfalt.mjs — betalningsflödets NUMERISKA prisfält,
// spegelfält och Saknas (kr)-formeln, ADDITIVT i Airtable-basen, INCHECKAT
// och idempotent i stället för konsolklick (TASK-346.2, ADR-128 beslut 5+7).
// SAMMA MÖNSTER som scripts/create-kvitton-table.mjs (TASK-147.7) — logiken
// nedanför är den etablerade formen (bas-guard, planFields/toApiFieldPayload,
// idempotent noop, fält-ID-utskrift), utvidgad till FLERA tabeller eftersom
// denna skiva LÄGGER FÄLT PÅ tre BEFINTLIGA tabeller i stället för att skapa
// en ny.
//
// DEKLARATIV HEMVIST, INTE EXEKVERAD DENNA LANDNING: AIRTABLE_SCHEMA_TOKEN
// saknas lokalt (samma läge TASK-147.5/TASK-147.12/TASK-309.2 redan bokförde
// — se create-kvitton-table.mjs § filhuvud och data-model.md § "Stagingbasens
// additiva tillskott 2026-08-16") — fälten skapades i stället DIREKT via
// Airtable MCP (`mcp__airtable__create_field`, staging `apphjj8Q7lkXCMsL4`,
// 2026-08-30, TASK-346.2) med EXAKT det fältset CONFIG nedan uttrycker.
// Detta skript är den deklarativa hemvisten som gör skapelsen upprepbar och
// granskningsbar — kör det (med en riktig AIRTABLE_SCHEMA_TOKEN) och det
// verifierar sig självt idempotent: `planFields` ser att alla fält redan
// finns och gör noop.
//
// FÄLTEN, TRACEADE MOT ADR-128 (ingen är påhittad):
//   Eventinnehåll.Pris (kr) / Anmälningsavgift (kr)
//     → numeriska STANDARDPRIS, BREDVID de befintliga fritext-fälten
//       Pris/Anmälningsavgift (beslut 7 — fritexten byter ALDRIG typ,
//       bilagemallarna läser den via _shared/document-sources.ts).
//   Eventplanering.Pris (kr) / Anmälningsavgift (kr)
//     → numeriska PER-EVENT-ÖVERRIDES, BREDVID de befintliga
//       (bilagetext)-fritext-fälten. Tomt = Eventinnehållets standard
//       gäller (härledningen sker i KOD, inte i basen — ingen lagrad länk
//       Eventplanering→Eventinnehåll finns, samma uppslagsform som
//       Event(source)×Typ, data-model.md § "Uppslaget Event (source) × Typ").
//   Anmälningar.Avtalat pris (kr)
//     → frivilligt, vinner över eventets pris (beslut 2).
//   Anmälningar.Summa inbetalt (kr)
//     → APP-SKRIVET spegelfält, TALFÄLT — INTE en rollup (rollup kan inte
//       summera rader i en annan databas, beslut 5).
//   Anmälningar.Kvittonummer
//     → APP-SKRIVET spegelfält (singleLineText) — skild från det befintliga
//       länkfältet "Kvitton" (fld2Axx3FsfXndJ39, multipleRecordLinks).
//   Anmälningar."Pris (kr) (from Event)"
//     → ADDITIVT HJÄLPFÄLT (lookup), inte i AC #1:s lista men uttryckligen
//       tillåtet av uppdraget ("behövs ett additivt hjälpfält (lookup) för
//       formeln är det tillåtet och bokförs"). Lookup av
//       Eventplanering."Pris (kr)" via länken Event (fldi3enUaMdbuGSlm).
//       Namnkonvention: samma "(from Event)"-suffix som tabellens befintliga
//       lookuper (Ort (from Event), Kurs (from Event), …).
//   Anmälningar."Saknas (kr)"
//     → formel: Avtalat pris (kr) om SATT (närvaro, inte sanningsvärde),
//       annars "Pris (kr) (from Event)", minus Summa inbetalt (kr). BLANK()
//       (INTE ett negativt tal) när INGET pris är känt alls — skyddar mot
//       skräp-negativa värden ur saknad prisdata. Ett GENUINT överskott
//       (summa > pris) FÅR bli negativt — legitimt signal-värde
//       (överbetalning), inte skräp.
//       RUNDA 2-FIX (review-fynd, TASK-346.2): den FÖRSTA versionen
//       (`OR({X},{Y})` rakt av) läste explicit 0-pris som "okänt" — Airtable
//       tolkar talet 0 som falskt i OR()/IF(). Fixad med ett NÄRVARO-test
//       (`{Fält} & "" != ""`, Airtable saknar ISBLANK()) i stället för
//       sanningsvärde. Fem fall + en bråkdels-kontroll empiriskt verifierade
//       live mot staging (TASK-346.2 slutrapport runda 2): (i) inget pris
//       känt → BLANK, (ii) eventets pris-fallback, (iii) Avtalat pris VINNER
//       ÄVEN vid 0 (negativ kontroll: gamla formeln ignorerade 0:an), (iv) ett
//       genuint 0-pris ger `0 − summa` (negativ kontroll: gamla formeln gav
//       BLANK), (v) en genuin överbetalning ger ett negativt värde. Mekaniskt
//       tvång vid rättningen: `mcp__airtable__update_field` kan inte ändra
//       ett formelfälts formula (bara name/description) och denna MCP-server
//       saknar delete_field — det gamla fältet döptes om
//       ("Saknas (kr) [ERSATT 2026-08-30 — 0-pris-bugg]", kvarlämnat orört)
//       och ett nytt "Saknas (kr)" skapades med den korrekta formeln.
//
// API-FORMEN, TOKEN-SEPARATIONEN och PROD-SPÄRREN: identiska med
// create-bilagor-table.mjs/create-kvitton-table.mjs § filhuvud. Lookup-
// fältets body-form (options.recordLinkFieldId + options.fieldIdInLinkedTable
// NÄSTLAT under options, aldrig på toppnivå) är samma form
// scripts/task-338-6-prod-migration.mjs redan dokumenterar en tidigare bugg
// kring (§ buildPlatsnamnFieldBody). formula-fält skickar `options.formula`
// med fältNAMN i klammerform — Airtable resolvar namn→ID internt vid
// create-anropet (bekräftat: svarets `referencedFieldIds` bär de rätta ID:na).
//
// ORDNINGEN ÄR EN INVARIANT: Eventinnehåll/Eventplanerings egna fält skapas
// FÖRE Anmälningars lookup (som pekar på Eventplanering."Pris (kr)"), och
// lookupen skapas FÖRE formeln (som refererar lookup-fältets NAMN). En
// omkastad ordning ger "fält hittades inte"-fel från Airtable, inte tyst fel
// data.
//
// Exit: 0 = OK (inklusive "redan i synk, inget att göra"), 1 = guard-/
// konfigurations-/argument-/schemamissmatch-fel, 2 = Airtable-API-fel.

import { pathToFileURL } from 'node:url';
import { kravStagingLedigt } from './lib/staging-preflight.mjs';

// ---------------------------------------------------------------------------
// CONFIG — projekt-specifikt. Logiken nedanför är universell.
// ---------------------------------------------------------------------------

export const CONFIG = {
  /** Staging. Prod är hårt blockerad (skyddsräcke 1) — se create-bilagor-table.mjs § filhuvud. */
  expectedBaseId: 'apphjj8Q7lkXCMsL4',
  forbiddenBaseIds: ['app8uGPrVCVOm6LfD'],

  eventinnehall: {
    tableId: 'tblwqaBrkm6hJPITd',
    tableName: 'Eventinnehåll',
    fields: [
      {
        name: 'Pris (kr)',
        type: 'number',
        description:
          'Numeriskt standardpris (ADR-128 beslut 7) — BREDVID fritexten Pris ' +
          '(fldaNE6ZU42lVNyrS), som bilagemallarna läser och som ALDRIG byter ' +
          'typ. Källa för Anmälningars pris-härledning via Eventplanering.' +
          '"Pris (kr)" (per-event override).',
        options: { precision: 2 },
      },
      {
        name: 'Anmälningsavgift (kr)',
        type: 'number',
        description:
          'Numerisk standard-anmälningsavgift (ADR-128 beslut 7) — BREDVID ' +
          'fritexten Anmälningsavgift (fldih0ePhJqD8raEa), som bilagemallarna ' +
          'läser och som ALDRIG byter typ.',
        options: { precision: 2 },
      },
    ],
  },

  eventplanering: {
    tableId: 'tblVE3UKWl1CKrphV',
    tableName: 'Eventplanering',
    fields: [
      {
        name: 'Pris (kr)',
        type: 'number',
        description:
          'Numeriskt PER-EVENT-överrides-pris (ADR-128 beslut 7) — BREDVID ' +
          'fritexten "Pris (bilagetext)" (fld6SoKgMvTsgicDm), som ' +
          'bilagemallarna läser och som ALDRIG byter typ. Tomt = ' +
          'Eventinnehållets standard gäller (härledningen sker i KOD, ingen ' +
          'lagrad länk Eventplanering→Eventinnehåll finns). Källa för ' +
          'Anmälningar."Pris (kr) (from Event)"-lookupen.',
        options: { precision: 2 },
      },
      {
        name: 'Anmälningsavgift (kr)',
        type: 'number',
        description:
          'Numerisk PER-EVENT-överrides-anmälningsavgift (ADR-128 beslut 7) ' +
          '— BREDVID fritexten "Anmälningsavgift (bilagetext)" ' +
          '(fld2DSzLOcXn1REBK), som bilagemallarna läser och som ALDRIG ' +
          'byter typ. Tomt = Eventinnehållets standard gäller.',
        options: { precision: 2 },
      },
    ],
  },

  anmalningar: {
    tableId: 'tbloOcrppVoyrHbrq',
    tableName: 'Anmälningar',
    /** Fält UTAN cross-table-beroende — skapas i valfri ordning, FÖRE lookup/formel. */
    egnaFält: [
      {
        name: 'Avtalat pris (kr)',
        type: 'number',
        description:
          'Frivilligt — vinner över eventets pris när Lotta gett rabatt ' +
          'eller par-pris (ADR-128 beslut 2). Förvalt = eventets pris ' +
          '(app-läge, INTE en Airtable-formel). Läst av Saknas (kr)-formeln.',
        options: { precision: 2 },
      },
      {
        name: 'Summa inbetalt (kr)',
        type: 'number',
        description:
          'APP-SKRIVET spegelfält (ADR-128 beslut 5) — TALFÄLT, INTE en ' +
          'rollup (rollup kan inte summera rader i en annan databas). ' +
          'Summan av inbetalningarna för denna anmälan, skrivet av appen ' +
          'från Postgres i samma operation som inbetalningen (med ' +
          'omförsök). Lotta rör aldrig detta fält för hand.',
        options: { precision: 2 },
      },
      {
        name: 'Kvittonummer',
        type: 'singleLineText',
        description:
          'APP-SKRIVET spegelfält (ADR-128 beslut 5) — MM-<år>-<löpnummer>, ' +
          'satt av appen när ett kvitto utfärdats. Skild från länkfältet ' +
          '"Kvitton" (fld2Axx3FsfXndJ39, multipleRecordLinks → ' +
          'Kvitton-tabellen) — detta är en snabb läsbar text-spegel, inte ' +
          'en länk.',
        // INGEN options-nyckel: singleLineText avvisar `options: {}` med
        // 422 INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE (mätt live, TASK-346.2)
        // — samma "options UTELÄMNAS helt när den är tom"-regel som
        // toApiFieldPayload nedan redan kodar.
      },
    ],
    /** Länken Anmälningar.Event → Eventplanering (data-model.md § Snabbreferens). */
    eventLänkFieldId: 'fldi3enUaMdbuGSlm',
    lookup: {
      name: 'Pris (kr) (from Event)',
      description:
        'ADDITIVT hjälpfält för Saknas (kr)-formeln (ADR-128 beslut 2, ' +
        'bokfört TASK-346.2). Lookup av Eventplanering."Pris (kr)" via ' +
        'länken Event (fldi3enUaMdbuGSlm). Samma namnkonvention som övriga ' +
        '"(from Event)"-lookuper i denna tabell (t.ex. Ort (from Event)).',
    },
    formula: {
      name: 'Saknas (kr)',
      description:
        'ADR-128 beslut 2/5 — pris-ledet är Avtalat pris (kr) om SATT ' +
        '(närvaro, inte sanningsvärde), annars eventets Pris (kr) (via ' +
        'lookupen "Pris (kr) (from Event)"), minus Summa inbetalt (kr). ' +
        'BLANK() när INGET pris är känt alls — skyddar mot skräp-negativa ' +
        'värden från saknad prisdata (bokfört TASK-346.2). RUNDA 2-FIX ' +
        '(review-fynd): föregående version läste explicit 0-pris som ' +
        '"okänt" (Airtables OR()/IF() tolkar 0 som falskt) — fixad med ett ' +
        'närvaro-test ({Fält} & "" != "") i stället för sanningsvärde. Så ' +
        'färsk som spegeln (Summa inbetalt (kr)), aldrig färskare.',
      // Fältnamn i klammerform — Airtable resolvar namn→ID vid create-anropet.
      // RUNDA 2-FIX: narvaro-test via textform-tvang (Airtable saknar
      // ISBLANK()), inte sanningsvarde — sa att ett explicit 0-pris raknas
      // som "kant", inte "okant" (se filhuvudet ovan).
      text:
        'IF(\n' +
        '  OR({Avtalat pris (kr)} & "" != "", {Pris (kr) (from Event)} & "" != ""),\n' +
        '  IF({Avtalat pris (kr)} & "" != "", {Avtalat pris (kr)}, {Pris (kr) (from Event)}) - {Summa inbetalt (kr)},\n' +
        '  BLANK()\n' +
        ')',
    },
  },

  requestThrottleMs: 250,
};

const AIRTABLE_META_URL = 'https://api.airtable.com/v0/meta/bases';
const BASE_ID_PATTERN = /^app[A-Za-z0-9]{14}$/;

// ---------------------------------------------------------------------------
// Pura funktioner (exporterade för ev. framtida test-skript)
// ---------------------------------------------------------------------------

/** Skyddsräcke 1: bas-guarden. Kastar vid fel — samma form som create-kvitton-table.mjs. */
export function validateConfig(config) {
  if (!config || typeof config !== 'object') throw new Error('config: förväntade ett objekt');
  const { expectedBaseId, forbiddenBaseIds, eventinnehall, eventplanering, anmalningar } = config;
  if (!BASE_ID_PATTERN.test(expectedBaseId ?? '')) {
    throw new Error(`bas-guard: expectedBaseId "${expectedBaseId}" är inte app-formad`);
  }
  if (!Array.isArray(forbiddenBaseIds) || forbiddenBaseIds.length === 0) {
    throw new Error('bas-guard: forbiddenBaseIds saknas — prod-basen måste vara blockerad');
  }
  if (forbiddenBaseIds.includes(expectedBaseId)) {
    throw new Error(
      `bas-guard: expectedBaseId "${expectedBaseId}" är BLOCKERAD (forbiddenBaseIds)`,
    );
  }
  for (const [key, entry] of Object.entries({ eventinnehall, eventplanering })) {
    if (typeof entry?.tableId !== 'string' || entry.tableId.trim().length === 0) {
      throw new Error(`${key}.tableId saknas`);
    }
    if (!Array.isArray(entry.fields) || entry.fields.length === 0) {
      throw new Error(`${key}.fields måste vara en icke-tom lista`);
    }
  }
  if (typeof anmalningar?.tableId !== 'string' || anmalningar.tableId.trim().length === 0) {
    throw new Error('anmalningar.tableId saknas');
  }
  if (!Array.isArray(anmalningar.egnaFält) || anmalningar.egnaFält.length === 0) {
    throw new Error('anmalningar.egnaFält måste vara en icke-tom lista');
  }
  if (typeof anmalningar.eventLänkFieldId !== 'string' || !anmalningar.eventLänkFieldId) {
    throw new Error('anmalningar.eventLänkFieldId saknas');
  }
  if (typeof anmalningar.lookup?.name !== 'string' || !anmalningar.lookup.name) {
    throw new Error('anmalningar.lookup.name saknas');
  }
  if (typeof anmalningar.formula?.text !== 'string' || !anmalningar.formula.text) {
    throw new Error('anmalningar.formula.text saknas');
  }
  return config;
}

/** Tolka argv. Enda flaggan är --dry-run: planera, skriv inget. */
export function parseArgs(argv) {
  return { dryRun: argv.includes('--dry-run') };
}

/** Hitta en tabell efter ID i schema-svarets tables-array. */
export function findTableById(tables, id) {
  return (tables ?? []).find((t) => t.id === id);
}

/** Hitta ett fält efter NAMN i en tabells fields-array. */
export function findFieldByName(table, name) {
  return (table?.fields ?? []).find((f) => f.name === name);
}

/**
 * Klassa önskad fältuppsättning mot en befintlig tabells fält — additivitets-
 * mätningen i pur, testbar form (samma disciplin som create-kvitton-table.mjs
 * § planFields: mismatches är en HÅRD guard, aldrig en tyst reparation).
 */
export function planFields(existingTable, expectedFields) {
  const existingByName = new Map((existingTable?.fields ?? []).map((f) => [f.name, f]));
  const toCreate = [];
  const mismatches = [];
  for (const expected of expectedFields) {
    const existing = existingByName.get(expected.name);
    if (!existing) {
      toCreate.push(expected);
    } else if (existing.type !== expected.type) {
      mismatches.push({
        name: expected.name,
        expectedType: expected.type,
        actualType: existing.type,
      });
    }
  }
  return { toCreate, mismatches };
}

/**
 * Fältets API-payload. `options` UTELÄMNAS helt när den är tom — samma
 * skarpa 422:a create-bilagor-table.mjs/create-kvitton-table.mjs dokumenterade.
 */
function toApiFieldPayload({ name, type, description, options }) {
  const harOptions = options && typeof options === 'object' && Object.keys(options).length > 0;
  return { name, type, description, ...(harOptions ? { options } : {}) };
}

/** Request-body för POST .../tables/{tableId}/fields — vanligt fält. */
export function buildCreateFieldBody(field) {
  return toApiFieldPayload(field);
}

/**
 * Lookup-fältets body. `recordLinkFieldId`/`fieldIdInLinkedTable` NÄSTLAT
 * under `options` — den formen scripts/task-338-6-prod-migration.mjs redan
 * dokumenterar en tidigare bugg kring (toppnivå fungerar INTE).
 */
export function buildLookupFieldBody({
  name,
  description,
  recordLinkFieldId,
  fieldIdInLinkedTable,
}) {
  return {
    name,
    type: 'multipleLookupValues',
    description,
    options: { recordLinkFieldId, fieldIdInLinkedTable },
  };
}

/** Formel-fältets body. `formula` är fri text med fältNAMN i klammerform. */
export function buildFormulaFieldBody({ name, description, formula }) {
  return { name, type: 'formula', description, options: { formula } };
}

// ---------------------------------------------------------------------------
// Airtable-API (samma throttlad/429-medvetna form som repots övriga skript)
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class ApiError extends Error {}
class GuardError extends Error {}

async function airtableRequest(url, token, throttleMs, init = {}) {
  await sleep(throttleMs);
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

async function getBaseSchema(baseId, token, throttleMs) {
  const url = `${AIRTABLE_META_URL}/${baseId}/tables`;
  const data = await airtableRequest(url, token, throttleMs);
  return data.tables ?? [];
}

async function createField(baseId, tableId, body, token, throttleMs) {
  const url = `${AIRTABLE_META_URL}/${baseId}/tables/${tableId}/fields`;
  return airtableRequest(url, token, throttleMs, { method: 'POST', body: JSON.stringify(body) });
}

/** Skapar de saknade fälten i `plan.toCreate` för en given tabell. Returnerar skapade fält. */
async function createMissingFields(baseId, tableId, plan, token, throttleMs, dryRun, label) {
  if (plan.mismatches.length > 0) {
    const beskrivning = plan.mismatches
      .map((m) => `"${m.name}": förväntade "${m.expectedType}", fann "${m.actualType}"`)
      .join('; ');
    throw new GuardError(`schema-missmatch i "${label}" — rör INGET: ${beskrivning}`);
  }
  if (plan.toCreate.length === 0) {
    console.log(`✅ "${label}": alla förväntade fält finns redan — inget att göra.`);
    return [];
  }
  if (dryRun) {
    console.log(
      `📝 DRY-RUN "${label}": skulle LÄGGA TILL fälten: ` +
        plan.toCreate.map((f) => f.name).join(', '),
    );
    return [];
  }
  console.log(`🛠️  "${label}": lägger till ${plan.toCreate.length} saknade fält …`);
  const created = [];
  for (const field of plan.toCreate) {
    const body = buildCreateFieldBody(field);
    const res = await createField(baseId, tableId, body, token, throttleMs);
    console.log(`   • ${res.name} (${res.type}) — ${res.id}`);
    created.push(res);
  }
  return created;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  let args;
  try {
    validateConfig(CONFIG);
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`❌ Guard-/konfigurationsfel: ${err.message}`);
    process.exit(1);
  }

  const token = process.env.AIRTABLE_SCHEMA_TOKEN;
  if (!token) {
    console.error(
      '❌ AIRTABLE_SCHEMA_TOKEN saknas i env. Lokalt: .env.seed (gitignorad; se ' +
        '.env.seed.example). Token behöver schema.bases:read + schema.bases:write ' +
        'mot staging-basen (apphjj8Q7lkXCMsL4). SKILD från STAGING_AIRTABLE_TOKEN — ' +
        'se create-kvitton-table.mjs § filhuvud.',
    );
    process.exit(1);
  }

  kravStagingLedigt('lokal schema:betalningsfalt');

  try {
    console.log(`🔍 Läser schema för ${CONFIG.expectedBaseId} …`);
    let tables = await getBaseSchema(CONFIG.expectedBaseId, token, CONFIG.requestThrottleMs);

    // 1) Eventinnehåll — inga cross-table-beroenden.
    const eventinnehallTable = findTableById(tables, CONFIG.eventinnehall.tableId);
    if (!eventinnehallTable) {
      throw new GuardError(
        `tabellen "${CONFIG.eventinnehall.tableId}" (Eventinnehåll) hittades inte`,
      );
    }
    await createMissingFields(
      CONFIG.expectedBaseId,
      CONFIG.eventinnehall.tableId,
      planFields(eventinnehallTable, CONFIG.eventinnehall.fields),
      token,
      CONFIG.requestThrottleMs,
      args.dryRun,
      CONFIG.eventinnehall.tableName,
    );

    // 2) Eventplanering — inga cross-table-beroenden, MEN dess "Pris (kr)"-
    //    fält-ID krävs av Anmälningars lookup nedan. Läs om schemat efteråt.
    const eventplaneringTable = findTableById(tables, CONFIG.eventplanering.tableId);
    if (!eventplaneringTable) {
      throw new GuardError(
        `tabellen "${CONFIG.eventplanering.tableId}" (Eventplanering) hittades inte`,
      );
    }
    await createMissingFields(
      CONFIG.expectedBaseId,
      CONFIG.eventplanering.tableId,
      planFields(eventplaneringTable, CONFIG.eventplanering.fields),
      token,
      CONFIG.requestThrottleMs,
      args.dryRun,
      CONFIG.eventplanering.tableName,
    );

    if (args.dryRun) {
      // Dry-run kan inte tråda vidare Eventplanerings ev. nyskapade fält-ID
      // (samma kända kant som create-eventinnehall-modell.mjs § "Torrkörnings-
      // kant" — dry-run skapar inget, så inget ID finns att peka lookupen på).
      console.log(
        '📝 DRY-RUN: Anmälningars lookup/formel kan inte planeras fullt utan ' +
          'Eventplanerings "Pris (kr)"-fält-ID — kör utan --dry-run för fullständig plan.',
      );
      console.log('✅ Klart (dry-run).');
      process.exit(0);
    }

    // Läs om schemat: Eventplanering kan ha fått ett nytt fält-ID i steg 2.
    tables = await getBaseSchema(CONFIG.expectedBaseId, token, CONFIG.requestThrottleMs);
    const eventplaneringEfter = findTableById(tables, CONFIG.eventplanering.tableId);
    const prisFältEventplanering = findFieldByName(eventplaneringEfter, 'Pris (kr)');
    if (!prisFältEventplanering) {
      throw new GuardError(
        'Eventplanering."Pris (kr)" saknas efter skapelse-steget — kan inte bygga lookupen',
      );
    }

    // 3) Anmälningar — egna fält (ingen cross-table-beroende) FÖRST.
    const anmalningarTable = findTableById(tables, CONFIG.anmalningar.tableId);
    if (!anmalningarTable) {
      throw new GuardError(`tabellen "${CONFIG.anmalningar.tableId}" (Anmälningar) hittades inte`);
    }
    await createMissingFields(
      CONFIG.expectedBaseId,
      CONFIG.anmalningar.tableId,
      planFields(anmalningarTable, CONFIG.anmalningar.egnaFält),
      token,
      CONFIG.requestThrottleMs,
      args.dryRun,
      CONFIG.anmalningar.tableName,
    );

    // 4) Lookupen — beror på Eventplanering."Pris (kr)"s fält-ID (steg 2/ovan).
    tables = await getBaseSchema(CONFIG.expectedBaseId, token, CONFIG.requestThrottleMs);
    let anmalningarEfter = findTableById(tables, CONFIG.anmalningar.tableId);
    const befintligLookup = findFieldByName(anmalningarEfter, CONFIG.anmalningar.lookup.name);
    if (befintligLookup) {
      if (befintligLookup.type !== 'multipleLookupValues') {
        throw new GuardError(
          `schema-missmatch: "${CONFIG.anmalningar.lookup.name}" finns men är ` +
            `"${befintligLookup.type}", förväntade "multipleLookupValues"`,
        );
      }
      console.log(`✅ "${CONFIG.anmalningar.lookup.name}" finns redan — inget att göra.`);
    } else {
      const lookupBody = buildLookupFieldBody({
        name: CONFIG.anmalningar.lookup.name,
        description: CONFIG.anmalningar.lookup.description,
        recordLinkFieldId: CONFIG.anmalningar.eventLänkFieldId,
        fieldIdInLinkedTable: prisFältEventplanering.id,
      });
      console.log(`🛠️  Skapar lookupen "${CONFIG.anmalningar.lookup.name}" …`);
      const skapad = await createField(
        CONFIG.expectedBaseId,
        CONFIG.anmalningar.tableId,
        lookupBody,
        token,
        CONFIG.requestThrottleMs,
      );
      console.log(`   • ${skapad.name} (${skapad.type}) — ${skapad.id}`);
    }

    // 5) Formeln — beror på lookupens NAMN (steg 4), refererat i formula.text.
    tables = await getBaseSchema(CONFIG.expectedBaseId, token, CONFIG.requestThrottleMs);
    anmalningarEfter = findTableById(tables, CONFIG.anmalningar.tableId);
    const befintligFormel = findFieldByName(anmalningarEfter, CONFIG.anmalningar.formula.name);
    if (befintligFormel) {
      if (befintligFormel.type !== 'formula') {
        throw new GuardError(
          `schema-missmatch: "${CONFIG.anmalningar.formula.name}" finns men är ` +
            `"${befintligFormel.type}", förväntade "formula"`,
        );
      }
      console.log(`✅ "${CONFIG.anmalningar.formula.name}" finns redan — inget att göra.`);
    } else {
      const formulaBody = buildFormulaFieldBody({
        name: CONFIG.anmalningar.formula.name,
        description: CONFIG.anmalningar.formula.description,
        formula: CONFIG.anmalningar.formula.text,
      });
      console.log(`🛠️  Skapar formeln "${CONFIG.anmalningar.formula.name}" …`);
      const skapad = await createField(
        CONFIG.expectedBaseId,
        CONFIG.anmalningar.tableId,
        formulaBody,
        token,
        CONFIG.requestThrottleMs,
      );
      console.log(`   • ${skapad.name} (${skapad.type}) — ${skapad.id}`);
    }

    console.log('✅ Klart.');
    process.exit(0);
  } catch (err) {
    if (err instanceof GuardError) {
      console.error(`❌ Guard: ${err.message}`);
      process.exit(1);
    }
    if (err instanceof ApiError) {
      console.error(`❌ ${err.message}`);
      process.exit(2);
    }
    throw err;
  }
}

// Kör endast som CLI — inte vid import från ett ev. framtida test-skript.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`❌ Oväntat fel: ${err.stack ?? err}`);
    process.exit(2);
  });
}
