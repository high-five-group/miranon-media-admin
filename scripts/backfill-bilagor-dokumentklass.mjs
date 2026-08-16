#!/usr/bin/env node
// scripts/backfill-bilagor-dokumentklass.mjs — backfyller Bilagor.Dokumentklass
// (TASK-147.12, additivt fält skapat 2026-08-16) på RADER SOM SKAPADES INNAN
// fältet fanns. Idempotent och tryggt att köra flera gånger: bara rader där
// `Dokumentklass` redan är tomt rörs (AC #3, "gissa aldrig").
//
// VARFÖR ETT SKRIPT OCH INTE ETT ENGÅNGS-MCP-ANROP: samma motivering som
// scripts/create-bilagor-table.mjs (§ filhuvud) — ett konsolklick/löst
// verktygsanrop är odokumenterat och oupprepbart. Detta skript ÄR den
// deklarativa, körbara audit-trailen för backfillen (vilka rader, vilken
// klass, varför) i stället för en rad i en agentrapport som inte går att
// köra om.
//
// KLASSIFICERINGSREGELN (AC #3, "härledbar" ⇒ backfyllas; annars tom):
// Bilagor-tabellens ENDA två skrivande EF:er, historiskt och idag, är
// upload-attachment/finalize-attachment-upload (klass A) och
// generate-event-attachment (klass B) — verifierat genom att läsa BÅDA
// EF:ernas källkod (TASK-147.12 slutrapport). generate-event-attachment
// bygger `Namn` som `${MALL_NAMN} – ${eventlabel}.pdf` med MALL_NAMN =
// 'Deltagarinformation' HÅRDKODAT och UNIKT i hela kodbasen (grep-verifierat,
// en enda träff) — ett Namn som börjar med den exakta strängen
// `GENERATED_MALL_PREFIX` nedan KAN ALLTSÅ ENDAST komma från den EF:en.
// Allt annat, per konstruktion av tabellens fullständiga skrivhistorik
// (ingen tredje skrivväg finns i denna kodbas vid detta korts bygge — klass
// C/kvitto skriver till den SEPARATA Kvitton-tabellen, TASK-147.7), är klass
// A. Detta är INTE samma sak som DokumentYta.tsx:s avvisade
// filnamns-GISSNING (dess docblock Fynd 1) — den gällde RUNTIME-klassning av
// EN OKÄND framtida rad utan känd skrivhistorik; detta är en ENGÅNGS-
// BACKFILL av rader vars fullständiga skrivväg-population är känd och
// uttömmande läst källkods-verifierad.
//
// OM EN TREDJE SKRIVVÄG TILLKOMMER SENARE utan att denna fil uppdateras:
// klassificeringen blir för bred (allt "inte B" landar som A). Det är därför
// skriptet EXPLICIT loggar varje klassat Namn i klartext (aldrig tyst) —
// en framtida körning som producerar en oväntad klassning syns i loggen,
// inte bara i Airtable.
//
// TOKEN: STAGING_AIRTABLE_TOKEN (data.records:read+write, samma least-
// privilege-PAT som purge-staging-sentinels.mjs/seed-review-fixture.mjs —
// detta skript LÄSER/SKRIVER RECORDS, inte schema, så AIRTABLE_SCHEMA_TOKEN
// (create-bilagor-table.mjs) behövs inte här).
//
// Exit: 0 = OK (inklusive "inget att backfylla"), 1 = guard-/argumentfel,
// 2 = Airtable-API-fel.

import { pathToFileURL } from 'node:url';
import { kravStagingLedigt } from './lib/staging-preflight.mjs';

export const CONFIG = {
  expectedBaseId: 'apphjj8Q7lkXCMsL4',
  forbiddenBaseIds: ['app8uGPrVCVOm6LfD'],
  tableId: 'tblFamrna53MVf1nG', // Bilagor, staging (data-model.md § Tabell-ID:n)
  requestThrottleMs: 250,
};

// Samma sträng som MALL_NAMN i supabase/functions/generate-event-attachment/index.ts.
const GENERATED_MALL_PREFIX = 'Deltagarinformation – ';

export const DOKUMENTKLASS = {
  UPPLADDAD: 'Uppladdad',
  EVENT_MALLAD: 'Event-mallad',
};

/** Bas-guard, identisk form som repots övriga Airtable-skript. Kastar vid fel. */
export function validateBaseGuard(config) {
  const BASE_ID_PATTERN = /^app[A-Za-z0-9]{14}$/;
  if (!BASE_ID_PATTERN.test(config?.expectedBaseId ?? '')) {
    throw new Error(`bas-guard: expectedBaseId "${config?.expectedBaseId}" är inte app-formad`);
  }
  if (!Array.isArray(config?.forbiddenBaseIds) || config.forbiddenBaseIds.length === 0) {
    throw new Error('bas-guard: forbiddenBaseIds saknas — prod-basen måste vara blockerad');
  }
  if (config.forbiddenBaseIds.includes(config.expectedBaseId)) {
    throw new Error(
      `bas-guard: expectedBaseId "${config.expectedBaseId}" är BLOCKERAD (forbiddenBaseIds)`,
    );
  }
  return config;
}

/**
 * Klassificerar EN rads Namn → Dokumentklass-värde, eller `null` om icke-
 * härledbar (se filhuvudets § KLASSIFICERINGSREGELN). Ren funktion, testbar
 * i isolation.
 */
export function classifyByNamn(namn) {
  if (typeof namn !== 'string' || namn.length === 0) return null;
  if (namn.startsWith(GENERATED_MALL_PREFIX)) return DOKUMENTKLASS.EVENT_MALLAD;
  return DOKUMENTKLASS.UPPLADDAD;
}

/**
 * Planerar backfillen: filtrerar bort rader som redan har Dokumentklass satt
 * (idempotens) och klassificerar resten. Returnerar `{ updates, oklassificerbara }`
 * — `oklassificerbara` är rader `classifyByNamn` inte kunde härleda (AC #3,
 * "lämnas tomma + bokförs" — bokföringen är denna listan, aldrig tyst).
 */
export function planBackfill(records) {
  const updates = [];
  const oklassificerbara = [];
  for (const r of records) {
    const befintlig = r.fields?.Dokumentklass;
    if (typeof befintlig === 'string' && befintlig.length > 0) continue; // redan satt — idempotent skip
    const klass = classifyByNamn(r.fields?.Namn);
    if (klass === null) {
      oklassificerbara.push({ id: r.id, namn: r.fields?.Namn ?? '(inget Namn)' });
      continue;
    }
    updates.push({ id: r.id, namn: r.fields?.Namn, klass });
  }
  return { updates, oklassificerbara };
}

const AIRTABLE_API_URL = 'https://api.airtable.com/v0';
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

/** Hämtar ALLA rader (paginerad), bara Namn + Dokumentklass — minimal yta. */
async function listAllRecords(baseId, tableId, token, throttleMs) {
  const out = [];
  let offset;
  do {
    const url = new URL(`${AIRTABLE_API_URL}/${baseId}/${tableId}`);
    url.searchParams.set('fields[]', 'Namn');
    url.searchParams.append('fields[]', 'Dokumentklass');
    if (offset) url.searchParams.set('offset', offset);
    const data = await airtableRequest(url.toString(), token, throttleMs);
    out.push(...(data.records ?? []));
    offset = data.offset;
  } while (offset);
  return out;
}

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function patchBatch(baseId, tableId, updates, token, throttleMs) {
  const url = `${AIRTABLE_API_URL}/${baseId}/${tableId}`;
  const body = {
    records: updates.map((u) => ({ id: u.id, fields: { Dokumentklass: u.klass } })),
  };
  return airtableRequest(url, token, throttleMs, { method: 'PATCH', body: JSON.stringify(body) });
}

async function main() {
  try {
    validateBaseGuard(CONFIG);
  } catch (err) {
    console.error(`❌ Guard-/konfigurationsfel: ${err.message}`);
    process.exit(1);
  }

  const dryRun = process.argv.includes('--dry-run');
  const token = process.env.STAGING_AIRTABLE_TOKEN;
  if (!token) {
    console.error(
      '❌ STAGING_AIRTABLE_TOKEN saknas i env. Lokalt: .env.seed (gitignorad; se ' +
        '.env.seed.example). Samma token som purge:staging/seed:review.',
    );
    process.exit(1);
  }

  kravStagingLedigt('lokal backfill:bilagor-dokumentklass');

  try {
    console.log(`🔍 Läser ${CONFIG.tableId} …`);
    const records = await listAllRecords(
      CONFIG.expectedBaseId,
      CONFIG.tableId,
      token,
      CONFIG.requestThrottleMs,
    );
    console.log(`   ${records.length} rader totalt.`);

    const { updates, oklassificerbara } = planBackfill(records);
    console.log(
      `   ${updates.length} rader att backfylla, ${oklassificerbara.length} icke-härledbara ` +
        `(lämnas tomma), ${records.length - updates.length - oklassificerbara.length} ` +
        'redan klassade (idempotent skip).',
    );

    for (const u of updates) {
      console.log(`   • ${u.id} → ${u.klass} (Namn: "${u.namn}")`);
    }
    for (const o of oklassificerbara) {
      console.log(`   ⚠️  OKLASSIFICERBAR: ${o.id} (Namn: "${o.namn}") — lämnas tom.`);
    }

    if (updates.length === 0) {
      console.log('✅ Inget att backfylla (redan i synk) — idempotent.');
      process.exit(0);
    }

    if (dryRun) {
      console.log(`📝 DRY-RUN: skulle uppdatera ${updates.length} rader. Inget skrivet.`);
      process.exit(0);
    }

    for (const batch of chunk(updates, 10)) {
      await patchBatch(
        CONFIG.expectedBaseId,
        CONFIG.tableId,
        batch,
        token,
        CONFIG.requestThrottleMs,
      );
      console.log(`   ✅ Batch om ${batch.length} skriven.`);
    }
    console.log(`✅ Klart. ${updates.length} rader backfyllda.`);
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`❌ Oväntat fel: ${err.stack ?? err}`);
    process.exit(2);
  });
}
