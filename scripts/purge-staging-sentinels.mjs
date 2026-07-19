#!/usr/bin/env node
// scripts/purge-staging-sentinels.mjs — setup-purge av sentinel-rader i
// staging-basen (ADR-060 punkt 3–4, wirad via TASK-16).
//
// Körs som SEPARAT CI-jobb (egen runner, egen secret) FÖRE Test + Build —
// aldrig i test-jobbet (EF-only-gränsen: testet får ALDRIG Airtable-token,
// ADR-060 punkt 2+4). Lokalt: `npm run purge:staging` (token ur .env.seed).
//
// Logiken är universell; alla projekt-värden bor i .purge-staging-policy.json
// (config-driven grindvakts-konvention, CLAUDE.md). Token via env:
// STAGING_AIRTABLE_TOKEN — en least-privilege-PAT scopad till ENBART
// staging-basen med data.records:read + data.records:write
// (airtable.com/developers/web/guides/personal-access-tokens).
//
// Fyra skyddsräcken (i denna ordning, alla hårda):
//   1. Bas-guard: policyns expectedBaseId måste vara app-formad och får inte
//      finnas i forbiddenBaseIds (prod hårt blockerad — staging och prod delar
//      tabell-/fält-ID:n för duplicerade fält, data-model.md §ID-topologi, så
//      bas-ID:t är DEN bärande skyddslinjen).
//   2. Ålders-guard: endast sentineler äldre än minAgeMinutes raderas (skyddar
//      in-flight-körningar; staging-mutexen täcker CI↔CI men inte CI↔lokal).
//      Åldern läses ur record.createdTime (dokumenterat på varje list-svar) —
//      medvetet i KOD, inte i filterByFormula (CREATED_TIME() i filterByFormula
//      är odokumenterat).
//   3. Exakt markör-match: filterByFormula grovsorterar server-side; koden
//      asserterar exakt mönster per rad. ZZ-History-fixturerna (S52) och
//      Eventformat-fixturen ZZ-create-event-test-format träffas aldrig
//      (exakt-match + tabell-scope).
//   4. Länk-guard (linkGuard: true): rader med NÅGOT icke-tomt fält som bär
//      rec-ID-arrayer hoppas över och rapporteras i stället för att raderas
//      (namn-agnostiskt — immunt mot fältnamns-drift som
//      "Anmälningar (länkat fält)", live-verifierat S71). Fail-safe-riktning:
//      hellre lämna kvar + rapportera än radera fel. linkGuardExcludeFields
//      undantar konstruktions-kända utgående referens-länkar som sitter på
//      varje sentinel by design (Eventtyp, ADR-066 b5 — skarp-belagt S71).
//
// Flaggor: --dry-run (planera + rapportera, radera inget).
// Exit: 0 = OK (även "inget att purga"), 1 = guard-/konfigurationsfel,
//       2 = Airtable-API-fel.
//
// Airtable-mekanik (verifierad mot developers-docs 2026-07-19): 5 req/s per
// bas, 429 ⇒ vänta 30 s; delete via ?records[]=… (batchas ≤10 per anrop —
// S69-empirin: 36 batchar à ≤10); list pagineras via offset.

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AIRTABLE_API_URL = 'https://api.airtable.com/v0';
const BASE_ID_PATTERN = /^app[A-Za-z0-9]{14}$/;
const REC_ID_PATTERN = /^rec[A-Za-z0-9]{14}$/;

// ---------------------------------------------------------------------------
// Pura funktioner (exporterade för scripts/test-purge-staging-sentinels.mjs)
// ---------------------------------------------------------------------------

/** Validera policy-formen + bas-guarden (skyddsräcke 1). Kastar vid fel. */
export function validatePolicy(policy) {
  if (!policy || typeof policy !== 'object') {
    throw new Error('policy: förväntade ett objekt');
  }
  const { expectedBaseId, forbiddenBaseIds, minAgeMinutes, targets } = policy;
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
  if (!Number.isFinite(minAgeMinutes) || minAgeMinutes < 10) {
    throw new Error('ålders-guard: minAgeMinutes måste vara ≥ 10 (skydd för in-flight-körningar)');
  }
  if (!Array.isArray(targets) || targets.length === 0) {
    throw new Error('policy: targets saknas');
  }
  for (const t of targets) {
    if (!t.name || !t.table || !t.filterByFormula || !t.exactMatchField || !t.exactMatchPattern) {
      throw new Error(`policy: target "${t.name ?? '?'}" saknar obligatoriska fält`);
    }
  }
  return policy;
}

/** Skyddsräcke 3: exakt markör-match på fältvärdet (aldrig prefix/substräng). */
export function isExactSentinel(record, target) {
  const value = record.fields?.[target.exactMatchField];
  if (typeof value !== 'string') return false;
  return new RegExp(target.exactMatchPattern).test(value);
}

/** Skyddsräcke 2: äldre än minAgeMinutes räknat från createdTime. */
export function isOldEnough(record, minAgeMinutes, nowMs) {
  const created = Date.parse(record.createdTime ?? '');
  if (Number.isNaN(created)) return false; // okänd ålder ⇒ fail-safe: rör ej
  return nowMs - created > minAgeMinutes * 60_000;
}

/**
 * Skyddsräcke 4: namn-agnostisk länk-detektion — icke-tom rec-ID-array i något
 * fält. excludeFields (policy: linkGuardExcludeFields) undantar konstruktions-
 * KÄNDA utgående referens-länkar som sitter på varje sentinel by design (t.ex.
 * Eventtyp — create-EF:ns obligatoriska typ-länk per ADR-066 b5; skarp-belagt
 * S71: 288/288 event-sentineler bar EXAKT den och inget annat). Guarden
 * fortsätter trippa på verkliga data-länkar (Anmälningar/Närvaro/Touchpoints).
 */
export function linkGuardTrips(record, excludeFields = []) {
  const tripped = [];
  for (const [field, value] of Object.entries(record.fields ?? {})) {
    if (excludeFields.includes(field)) continue;
    if (
      Array.isArray(value) &&
      value.length > 0 &&
      value.every((v) => typeof v === 'string' && REC_ID_PATTERN.test(v))
    ) {
      tripped.push(field);
    }
  }
  return tripped;
}

/** Klassa listade records till en purge-plan (raderas / skippas med orsak). */
export function planPurge(records, target, minAgeMinutes, nowMs) {
  const plan = { toDelete: [], skippedYoung: [], skippedMismatch: [], skippedLinked: [] };
  for (const record of records) {
    if (!isExactSentinel(record, target)) {
      plan.skippedMismatch.push(record.id);
      continue;
    }
    if (!isOldEnough(record, minAgeMinutes, nowMs)) {
      plan.skippedYoung.push(record.id);
      continue;
    }
    if (target.linkGuard) {
      const tripped = linkGuardTrips(record, target.linkGuardExcludeFields ?? []);
      if (tripped.length > 0) {
        plan.skippedLinked.push({ id: record.id, fields: tripped });
        continue;
      }
    }
    plan.toDelete.push(record.id);
  }
  return plan;
}

/** Dela id-lista i batchar om max size (Airtable delete ≤10 per anrop). */
export function chunk(ids, size) {
  const out = [];
  for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size));
  return out;
}

// ---------------------------------------------------------------------------
// Airtable-API (throttlad, 429-medveten)
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function airtableRequest(url, token, throttleMs, init = {}) {
  await sleep(throttleMs); // enkel throttle: sekventiella anrop < 5 req/s
  let res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 429) {
    // Dokumenterat kontrakt: vänta 30 s, försök igen (en gång).
    console.log('   429 rate limit — väntar 30 s och försöker igen …');
    await sleep(30_000);
    res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}` } });
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(`Airtable ${init.method ?? 'GET'} ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

class ApiError extends Error {}

async function listSentinels(baseId, target, token, throttleMs) {
  const records = [];
  let offset;
  do {
    const url = new URL(`${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(target.table)}`);
    url.searchParams.set('filterByFormula', target.filterByFormula);
    url.searchParams.set('pageSize', '100');
    if (offset) url.searchParams.set('offset', offset);
    const page = await airtableRequest(url, token, throttleMs);
    records.push(...page.records);
    offset = page.offset;
  } while (offset);
  return records;
}

async function deleteRecords(baseId, target, ids, token, throttleMs, batchSize) {
  let deleted = 0;
  for (const batch of chunk(ids, batchSize)) {
    const url = new URL(`${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(target.table)}`);
    for (const id of batch) url.searchParams.append('records[]', id);
    const result = await airtableRequest(url, token, throttleMs, { method: 'DELETE' });
    deleted += (result.records ?? []).filter((r) => r.deleted).length;
  }
  return deleted;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const policyPath = join(scriptDir, '..', '.purge-staging-policy.json');

  let policy;
  try {
    policy = validatePolicy(JSON.parse(await readFile(policyPath, 'utf8')));
  } catch (err) {
    console.error(`❌ Policy-/guard-fel: ${err.message}`);
    process.exit(1);
  }

  const token = process.env.STAGING_AIRTABLE_TOKEN;
  if (!token) {
    console.error(
      '❌ STAGING_AIRTABLE_TOKEN saknas i env. CI: repo-secret. Lokalt: .env.seed ' +
        '(gitignorad; se .env.seed.example). Token = least-privilege-PAT scopad till ' +
        'ENBART staging-basen (data.records:read + data.records:write).',
    );
    process.exit(1);
  }

  const { expectedBaseId, minAgeMinutes, requestThrottleMs, deleteBatchSize } = policy;
  const nowMs = Date.now();
  console.log(
    `Sentinel-purge mot ${expectedBaseId} (ålders-guard: > ${minAgeMinutes} min)` +
      `${dryRun ? ' — DRY RUN, inget raderas' : ''}`,
  );

  let hadApiError = false;
  for (const target of policy.targets) {
    try {
      const records = await listSentinels(expectedBaseId, target, token, requestThrottleMs);
      const plan = planPurge(records, target, minAgeMinutes, nowMs);
      console.log(
        `▸ ${target.name} (${target.table}): ${records.length} träffar — ` +
          `${plan.toDelete.length} raderas, ${plan.skippedYoung.length} för färska, ` +
          `${plan.skippedLinked.length} länk-guardade, ${plan.skippedMismatch.length} icke-exakta`,
      );
      for (const s of plan.skippedLinked) {
        console.log(
          `   ⚠️  ${s.id} hoppas över — länkade fält: ${s.fields.join(', ')} (S52-formen: rapportera, radera ej)`,
        );
      }
      for (const id of plan.skippedMismatch) {
        console.log(`   ⚠️  ${id} träffade formeln men INTE exakt-mönstret — rörs ej`);
      }
      if (dryRun || plan.toDelete.length === 0) continue;

      const deleted = await deleteRecords(
        expectedBaseId,
        target,
        plan.toDelete,
        token,
        requestThrottleMs,
        deleteBatchSize,
      );
      console.log(`   🗑  ${deleted}/${plan.toDelete.length} raderade`);

      // Efter-verifiering (S52/S69-formen): inga radera-bara sentineler kvar.
      const remaining = planPurge(
        await listSentinels(expectedBaseId, target, token, requestThrottleMs),
        target,
        minAgeMinutes,
        nowMs,
      );
      if (remaining.toDelete.length > 0) {
        throw new ApiError(
          `efter-verifiering: ${remaining.toDelete.length} radera-bara sentineler kvarstår`,
        );
      }
      console.log('   ✅ efter-verifiering: 0 radera-bara sentineler kvar');
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
      hadApiError = true;
      console.error(`❌ ${target.name}: ${err.message}`);
    }
  }

  if (hadApiError) process.exit(2);
  console.log(dryRun ? 'Dry run klar.' : 'Purge klar.');
}

// Kör endast som CLI — inte vid import från test-skriptet.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`❌ Oväntat fel: ${err.stack ?? err}`);
    process.exit(2);
  });
}
