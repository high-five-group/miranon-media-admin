#!/usr/bin/env node
// scripts/create-kvitton-table.mjs — kvittoseriens LEDGER- och metadata-tabell
// ("Kvitton") ADDITIVT i Airtable-basen, INCHECKAT och idempotent i stället för
// konsolklick (TASK-147.7, ADR-109). SAMMA MÖNSTER som
// scripts/create-bilagor-table.mjs (TASK-146.2) — logiken nedanför är
// oförändrad universell form, endast CONFIG skiljer.
//
// DEKLARATIV HEMVIST, INTE EXEKVERAD DENNA LANDNING: AIRTABLE_SCHEMA_TOKEN
// saknas lokalt (samma läge TASK-147.5s slutrapport bokförde för Bilagor-
// tabellens Lagringsnyckel-fält) — tabellen skapades i stället DIREKT via
// Airtable MCP (`mcp__airtable__create_table`, staging `apphjj8Q7lkXCMsL4`,
// 2026-08-10) med EXAKT det fältset CONFIG.fields nedan uttrycker. Detta
// skript är alltså den deklarativa hemvisten som gör skapelsen upprepbar och
// granskningsbar (samma motiv som create-bilagor-table.mjs § filhuvud) — inte
// en oanvänd artefakt. Kör det (med en riktig AIRTABLE_SCHEMA_TOKEN) och det
// verifierar sig självt idempotent: `planFields` ser att alla fält redan
// finns och gör noop.
//
// VAD TABELLEN ÄR (`_shared/receipt-numbering.ts` filhuvud, ADR-109): en
// LEDGER för kvittoserien (unikhet under samtidighet, server-side allokerad,
// aldrig retroaktivt omnumrerad) OCH kvittots beständiga metadata (beslut d:
// "kvittot består med sitt nummer + notering" oavsett vad som händer med den
// underliggande betalnings-avprickningen senare — se
// `_shared/send-receipt.ts` filhuvud för varför de två aldrig kopplas ihop).
//
// FÄLTEN, TRACEADE MOT ADR-109 (ingen är påhittad):
//   Kvittonummer  → "MM-<år>-<löpnummer>" — primärfält, det Lotta/kunden ser
//   Löpnummer/År  → allokeringens RÅDATA (receipt-numbering.ts läser/skriver dessa)
//   Anmälan       → länk till Anmälningar — VILKEN betalning kvittot avser
//   Betalning     → Anmälningsavgift/Slutbetalning (closed enum, samma två
//                    betalningar appen redan känner)
//   Belopp        → kronor, Lotta-inmatat (basen saknar ett prisfält, se
//                    ADR-109 § Öppna punkter — INTE en gissning här)
//   Betalsätt     → Swish/Bankgiro/Plusgiro (Marcus-beslut a, S102)
//   Kundnamn      → snapshot vid utfärdandet
//   Event         → länk till Eventplanering
//   Skickad       → när mailet faktiskt gick (finaliseringen, EJ reservationen)
//   Lagringsnyckel → PDF-bytesens storage-leaf (samma bilagor-bucket, TASK-146.3)
//   Notering      → beslut (d):s öppna fält för framtida kreditrutin (EJ v1)
//
// API-FORMEN, TOKEN-SEPARATIONEN och PROD-SPÄRREN: identiska med
// create-bilagor-table.mjs § filhuvud — läs den för fullständiga källor
// (Airtable Web API-dokument, token-scope-motivet, prod-blockeringens
// medvetna friktion). Upprepas inte här.
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

  table: {
    name: 'Kvitton',
    description:
      'Kvittoserien (TASK-147.7, ADR-109). Räknarens ledger + kvittots ' +
      'persisterade metadata — server-side allokerat, aldrig retroaktivt ' +
      'omnumrerat. Formatet MM-<år>-<löpnummer>, start 1001. Skapad additivt ' +
      'av scripts/create-kvitton-table.mjs — redigera INTE fälten via ' +
      'konsolen, redigera skriptet och kör om det.',
  },

  /**
   * `Kvittonummer` måste stå FÖRST: Airtables create-table-API gör det
   * första fältet i arrayen till primärfältet (samma regel som
   * create-bilagor-table.mjs).
   */
  fields: [
    {
      name: 'Kvittonummer',
      type: 'singleLineText',
      description: 'MM-<år>-<löpnummer> — det Lotta/kunden ser. Satt vid allokeringen.',
      options: {},
    },
    {
      name: 'Löpnummer',
      type: 'number',
      description: 'Seriens RÅ löpnummer (start 1001) — allokeringens rådata.',
      options: { precision: 0 },
    },
    {
      name: 'År',
      type: 'number',
      description: 'Seriens år — varje år är sin egen namnrymd, börjar om på 1001.',
      options: { precision: 0 },
    },
    {
      name: 'Anmälan',
      type: 'multipleRecordLinks',
      description: 'Vilken anmälan (person) kvittot avser. Länkad tabell: Anmälningar.',
      // tbloOcrppVoyrHbrq = Anmälningar, docs/reference/data-model.md § Snabbreferens.
      options: { linkedTableId: 'tbloOcrppVoyrHbrq' },
    },
    {
      name: 'Betalning',
      type: 'singleSelect',
      description: 'Vilken av de två betalningarna kvittot avser.',
      options: {
        choices: [{ name: 'Anmälningsavgift' }, { name: 'Slutbetalning' }],
      },
    },
    {
      name: 'Belopp',
      type: 'number',
      description:
        'Kronor, Lotta-inmatat vid sändtillfället (basen har inget prisfält — ADR-109 § Öppna punkter).',
      options: { precision: 2 },
    },
    {
      name: 'Betalsätt',
      type: 'singleSelect',
      description: 'De tre betalsätten Marcus-beslutet namnger (S102, Implementation Notes a).',
      options: {
        choices: [{ name: 'Swish' }, { name: 'Bankgiro' }, { name: 'Plusgiro' }],
      },
    },
    {
      name: 'Kundnamn',
      type: 'singleLineText',
      description: 'Snapshot av mottagarens namn vid utfärdandet.',
      options: {},
    },
    {
      name: 'Event',
      type: 'multipleRecordLinks',
      description: 'Vilket event betalningen hör till. Länkad tabell: Eventplanering.',
      // tblVE3UKWl1CKrphV = Eventplanering (samma ID som create-bilagor-table.mjs).
      options: { linkedTableId: 'tblVE3UKWl1CKrphV' },
    },
    {
      name: 'Skickad',
      type: 'dateTime',
      description:
        'När mailet faktiskt gick (finaliseringen — INTE reservationstillfället). ' +
        'Manuellt satt, samma motiv som Bilagor.Skapad (create-bilagor-table.mjs § "Skapad").',
      options: {
        dateFormat: { name: 'local', format: 'l' },
        timeFormat: { name: '24hour', format: 'HH:mm' },
        timeZone: 'client',
      },
    },
    {
      name: 'Lagringsnyckel',
      type: 'singleLineText',
      description: 'PDF-bytesens storage-leaf (samma "bilagor"-bucket, TASK-146.3-mönstret).',
      options: {},
    },
    {
      name: 'Notering',
      type: 'multilineText',
      description:
        'Öppet fält för en framtida kreditrutin (Marcus-beslut d, S102 — EJ v1: ' +
        '"Kreditrutin + bokförings-export = Roger-feedback senare").',
      options: {},
    },
  ],

  requestThrottleMs: 250,
};

const AIRTABLE_META_URL = 'https://api.airtable.com/v0/meta/bases';
const BASE_ID_PATTERN = /^app[A-Za-z0-9]{14}$/;

// ---------------------------------------------------------------------------
// Pura funktioner (exporterade för scripts/test-create-kvitton-table.mjs)
// ---------------------------------------------------------------------------

/** Skyddsräcke 1: bas-guarden. Kastar vid fel — samma form som create-bilagor-table.mjs. */
export function validateConfig(config) {
  if (!config || typeof config !== 'object') throw new Error('config: förväntade ett objekt');
  const { expectedBaseId, forbiddenBaseIds, table, fields } = config;
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
  if (typeof table?.name !== 'string' || table.name.trim().length === 0) {
    throw new Error('table.name saknas');
  }
  if (!Array.isArray(fields) || fields.length === 0) {
    throw new Error('fields måste vara en icke-tom lista — Airtable kräver minst ett fält');
  }
  const namn = new Set();
  for (const f of fields) {
    if (typeof f?.name !== 'string' || f.name.trim().length === 0) {
      throw new Error('varje fält måste ha ett name');
    }
    if (namn.has(f.name)) throw new Error(`dubblettfält i CONFIG.fields: "${f.name}"`);
    namn.add(f.name);
    if (typeof f?.type !== 'string' || f.type.trim().length === 0) {
      throw new Error(`fields["${f.name}"].type saknas`);
    }
    if (f.options === undefined || typeof f.options !== 'object' || f.options === null) {
      throw new Error(`fields["${f.name}"].options måste vara ett objekt (kan vara tomt {})`);
    }
  }
  return config;
}

/** Tolka argv. Enda flaggan är --dry-run: planera, skriv inget. */
export function parseArgs(argv) {
  return { dryRun: argv.includes('--dry-run') };
}

/** Hitta en tabell efter NAMN (case-sensitive exakt) i schema-svarets tables-array. */
export function findTableByName(tables, name) {
  return (tables ?? []).find((t) => t.name === name);
}

/**
 * Klassa önskad fältuppsättning mot en befintlig tabells fält — additivitets-
 * mätningen i pur, testbar form (samma disciplin som create-bilagor-table.mjs
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
 * skarpa 422:a create-bilagor-table.mjs dokumenterade (§ toApiFieldPayload).
 */
function toApiFieldPayload({ name, type, description, options }) {
  const harOptions = options && typeof options === 'object' && Object.keys(options).length > 0;
  return { name, type, description, ...(harOptions ? { options } : {}) };
}

/** Request-body för POST .../tables. `Kvittonummer` (första fältet) blir primärfältet. */
export function buildCreateTableBody(config) {
  return {
    name: config.table.name,
    description: config.table.description,
    fields: config.fields.map(toApiFieldPayload),
  };
}

/** Request-body för POST .../tables/{tableId}/fields (ETT fält per anrop). */
export function buildCreateFieldBody(field) {
  return toApiFieldPayload(field);
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

async function createTable(baseId, body, token, throttleMs) {
  const url = `${AIRTABLE_META_URL}/${baseId}/tables`;
  return airtableRequest(url, token, throttleMs, { method: 'POST', body: JSON.stringify(body) });
}

async function createField(baseId, tableId, body, token, throttleMs) {
  const url = `${AIRTABLE_META_URL}/${baseId}/tables/${tableId}/fields`;
  return airtableRequest(url, token, throttleMs, { method: 'POST', body: JSON.stringify(body) });
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
        'se create-bilagor-table.mjs § filhuvud.',
    );
    process.exit(1);
  }

  kravStagingLedigt('lokal schema:kvitton');

  try {
    console.log(`🔍 Läser schema för ${CONFIG.expectedBaseId} …`);
    const tables = await getBaseSchema(CONFIG.expectedBaseId, token, CONFIG.requestThrottleMs);
    const existingTable = findTableByName(tables, CONFIG.table.name);

    if (!existingTable) {
      const body = buildCreateTableBody(CONFIG);
      if (args.dryRun) {
        console.log(
          `📝 DRY-RUN: skulle SKAPA tabellen "${CONFIG.table.name}" med fälten: ` +
            body.fields.map((f) => f.name).join(', '),
        );
        process.exit(0);
      }
      console.log(`🛠️  Skapar tabellen "${CONFIG.table.name}" med ${body.fields.length} fält …`);
      const created = await createTable(
        CONFIG.expectedBaseId,
        body,
        token,
        CONFIG.requestThrottleMs,
      );
      console.log(`✅ Tabell skapad: ${created.id} ("${created.name}")`);
      for (const f of created.fields ?? []) {
        console.log(`   • ${f.name} (${f.type}) — ${f.id}`);
      }
      console.log('✅ Klart.');
      process.exit(0);
    }

    const plan = planFields(existingTable, CONFIG.fields);
    if (plan.mismatches.length > 0) {
      const beskrivning = plan.mismatches
        .map((m) => `"${m.name}": förväntade "${m.expectedType}", fann "${m.actualType}"`)
        .join('; ');
      throw new GuardError(
        `schema-missmatch mot befintlig tabell "${CONFIG.table.name}" — rör INGET: ${beskrivning}`,
      );
    }

    if (plan.toCreate.length === 0) {
      console.log(
        `✅ Tabellen "${CONFIG.table.name}" (${existingTable.id}) finns redan med alla ` +
          `${CONFIG.fields.length} förväntade fält — inget att göra (idempotent).`,
      );
      process.exit(0);
    }

    if (args.dryRun) {
      console.log(
        `📝 DRY-RUN: tabellen "${CONFIG.table.name}" finns (${existingTable.id}), skulle LÄGGA ` +
          `TILL fälten: ${plan.toCreate.map((f) => f.name).join(', ')}`,
      );
      process.exit(0);
    }

    console.log(
      `🛠️  Tabellen "${CONFIG.table.name}" finns (${existingTable.id}), lägger till ` +
        `${plan.toCreate.length} saknade fält …`,
    );
    for (const field of plan.toCreate) {
      const body = buildCreateFieldBody(field);
      const created = await createField(
        CONFIG.expectedBaseId,
        existingTable.id,
        body,
        token,
        CONFIG.requestThrottleMs,
      );
      console.log(`   • ${created.name} (${created.type}) — ${created.id}`);
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

// Kör endast som CLI — inte vid import från test-skriptet.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`❌ Oväntat fel: ${err.stack ?? err}`);
    process.exit(2);
  });
}
