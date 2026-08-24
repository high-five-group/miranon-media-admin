#!/usr/bin/env node
// scripts/purge-staging-sentinels.mjs — setup-purge av sentinel-rader i
// staging-basen (ADR-060 punkt 3–4, wirad via TASK-16).
//
// Körs som SEPARAT CI-jobb (egen runner, egen secret) FÖRE staging-jobbet
// (test-staging efter S77-splitten) — aldrig i test-jobben (EF-only-gränsen:
// testet får ALDRIG Airtable-token, ADR-060 punkt 2+4). Lokalt:
// `npm run purge:staging` (token ur .env.seed).
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
// IDEMPOTENS MOT SAMTIDIGA KÖRNINGAR (TASK-76): en DELETE av en post som en
// ANNAN purge redan hunnit radera har uppnått sitt mål och får inte fälla
// jobbet. Skriptets två faser — listSentinels() sedan deleteSentinels() — är
// ett TOCTOU-fönster: två samtidiga purges ser samma sentinel, båda kör DELETE,
// den som kommer sist får 404. Ålders-guarden skyddar mot att radera FÖR
// TIDIGT; den skyddar INTE mot att två körningar tävlar om SAMMA post.
// Se isAlreadyDeletedError() för klassificeringen — den är fail-closed, så en
// 404 från fel bas eller fel tabell fäller fortfarande.
//
// ═══ TVÅ LÄGEN (TASK-309.15) ═══
// SETUP-läget (default, allt ovan) är oförändrat och är fortsatt ANDRA
// försvarslinjen — deterministiskt, robust mot krasch, oberoende av att någon
// körning hann städa efter sig.
//
// EFTER-KÖRNING-läget (`--efter-korning [manifestfil]`) är den FÖRSTA
// försvarslinjen och stänger fönstret setup-purgen strukturellt inte kan
// stänga: mellan en testkörning och NÄSTA staging-jobb ligger raderna kvar.
// De kastbara eventen bär framtida `startdatum` och blir därmed KOMMANDE event
// i appens eventväljare — mätt 2026-08-24: 151 kvarliggande ZZ-event, samtliga
// yngre än 2,4 h (setup-purgen HADE alltså kört; fönstret är formen, inte ett
// fel). Marcus valde ett av dem vid en granskning och fick en tom
// genereringsvy, vilket läste som ett designfel i vyn.
//
// Läget läser ett ÄGAR-MANIFEST som testerna skriver
// (`tests/support/kastbara-poster.ts`, JSONL, en rad per skapad post) och
// raderar EXAKT de posterna. Att testet inte kan radera själv är ADR-060
// punkt 2+4: det får ALDRIG en Airtable-token, och ingen delete-EF för event
// finns. Manifestet bär därför KUNSKAPEN över till denna Airtable-creddade
// kodväg, som körs SKILD från testet (CI: eget jobb + egen secret; lokalt:
// `npm run purge:staging:efter`).
//
// ÅLDERS-GUARDEN ERSÄTTS, DEN TAS INTE BORT. I setup-läget är åldern det enda
// tillgängliga beviset för "ingen kör på den här raden just nu". I
// efter-körning-läget finns ett STARKARE bevis: raden skapades av den körning
// som just avslutades, och står namngiven i dess eget manifest. Snittet mot
// manifestet är alltså skyddet — en samtidig lokal körnings rader kan per
// konstruktion aldrig hamna i CI:s manifest. Allt ANNAT skydd är kvar orört:
// bas-guarden, filterByFormula, exakt markör-match och länk-guarden körs
// precis som i setup-läget, via SAMMA `planPurge`.
//
// LUCKDETEKTIONEN: en ägd post som INGEN target gjorde anspråk på men som
// FINNS KVAR i basen är en sentinel-familj utan purge-target — exakt den lucka
// som lät två `ZZ-create-event-test-uppdaterad`-rader ligga kvar i 27
// respektive 32 dygn (update-event-testets `finally`-återställning föll, och
// den uppdaterade orten matchade ingen target). Läget FÄLLER på det i stället
// för att tiga.
//
// Flaggor: --dry-run (planera + rapportera, radera inget),
//          --efter-korning [fil] (ägar-manifest-läget; fil default
//          `.kastbara/poster.jsonl`).
// Exit: 0 = OK (även "inget att purga"), 1 = guard-/konfigurationsfel,
//       2 = Airtable-API-fel ELLER ägd post utan purge-target (luckan ovan).
//
// Airtable-mekanik (verifierad mot developers-docs 2026-07-19): 5 req/s per
// bas, 429 ⇒ vänta 30 s; delete via ?records[]=… (batchas ≤10 per anrop —
// S69-empirin: 36 batchar à ≤10); list pagineras via offset.

import { readFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { kravStagingLedigt } from './lib/staging-preflight.mjs';

const AIRTABLE_API_URL = 'https://api.airtable.com/v0';
const BASE_ID_PATTERN = /^app[A-Za-z0-9]{14}$/;
const REC_ID_PATTERN = /^rec[A-Za-z0-9]{14}$/;

/**
 * [TASK-309.15] Ägar-manifestets default-sökväg. SPEGLAR
 * `KASTBARA_POSTER_FIL` i `tests/support/kastbara-poster.ts` — skrivaren
 * (Playwright/TypeScript) och läsaren (detta Node-script) kan inte dela modul,
 * så konstanten finns på två ställen. Att de två går isär TYST är precis
 * felklassen som gör ett mätinstrument farligare än inget: purgen hade läst en
 * tom fil och rapporterat "inget att städa" utan att något såg fel ut.
 * `scripts/test-purge-staging-sentinels.mjs` korsläser därför de två raderna
 * mot varandra vid varje CI-körning.
 */
export const KASTBARA_POSTER_FIL = '.kastbara/poster.jsonl';

/**
 * Airtables ENDA formulering för "posten finns inte" — live-mätt mot staging
 * 2026-07-29 (se isAlreadyDeletedError). Mönstret binder rec-ID:t så det kan
 * korsläsas mot batchen vi faktiskt bad om.
 */
const RECORD_NOT_FOUND_PATTERN = /^Could not find a record with ID "(rec[A-Za-z0-9]{14})"\.$/;

// ---------------------------------------------------------------------------
// Pura funktioner (exporterade för scripts/test-purge-staging-sentinels.mjs)
// ---------------------------------------------------------------------------

/** Validera policy-formen + bas-guarden (skyddsräcke 1). Kastar vid fel. */
export function validatePolicy(policy) {
  if (!policy || typeof policy !== 'object') {
    throw new Error('policy: förväntade ett objekt');
  }
  const { expectedBaseId, forbiddenBaseIds, minAgeMinutes, targets, storageTargets } = policy;
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
  // [TASK-302.3] storageTargets är OPTIONELLT (Airtable-targets är den
  // ursprungliga, obligatoriska klassen). Formen prövas generiskt här — den
  // FAKTISKA fail-closed-spärren mot "inget annat än utkast/" sitter server-
  // side i test-attachments-storage/index.ts § isAllowedPrefix (samma lager
  // som TEST_EVENT_PREFIX_MARKER-spärren redan bor i), inte duplicerad här.
  if (storageTargets !== undefined) {
    if (!Array.isArray(storageTargets) || storageTargets.length === 0) {
      throw new Error('policy: storageTargets är satt men tomt — ta bort nyckeln helt i stället');
    }
    for (const st of storageTargets) {
      if (!st.name || !st.bucket || !st.pathPrefix) {
        throw new Error(`policy: storageTarget "${st.name ?? '?'}" saknar obligatoriska fält`);
      }
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

// ---------------------------------------------------------------------------
// [TASK-302.3] Storage-targets — samma ålders-guard-princip som Airtable-
// sentinelerna (isOldEnough ovan), men mot Storage-objektens `updatedAt`
// (Supabase Storage FileObject) i stället för Airtables `createdTime`.
// ---------------------------------------------------------------------------

/**
 * Ålders-guarden för ETT Storage-objekt. Samma fail-safe-riktning som
 * isOldEnough: okänd/oparsbar `updatedAt` ⇒ false (rör ej) — ett objekt vi
 * inte kan tidsätta är INTE bevisat gammalt nog att raderas.
 */
export function isStorageObjectOldEnough(entry, minAgeMinutes, nowMs) {
  const updated = Date.parse(entry.updatedAt ?? '');
  if (Number.isNaN(updated)) return false;
  return nowMs - updated > minAgeMinutes * 60_000;
}

/**
 * Klassa listade Storage-objekt till en purge-plan. Ingen exakt-match/
 * länk-guard behövs här (till skillnad från planPurge/Airtable): den
 * gemensamma tillåtna-namnrymds-spärren (`isAllowedPrefix`,
 * test-attachments-storage/index.ts) är redan servad av `list_prefix`
 * själv — allt som listas härifrån ligger per definition i en reserverad
 * namnrymd. Ålders-guarden är den ENDA klassningen kvar.
 */
export function planStoragePurge(entries, minAgeMinutes, nowMs) {
  const plan = { toDelete: [], skippedYoung: [] };
  for (const entry of entries) {
    if (isStorageObjectOldEnough(entry, minAgeMinutes, nowMs)) {
      plan.toDelete.push(entry.path);
    } else {
      plan.skippedYoung.push(entry.path);
    }
  }
  return plan;
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

// ---------------------------------------------------------------------------
// [TASK-309.15] Efter-körning-läget — ägar-manifestet (pura funktioner)
// ---------------------------------------------------------------------------

/**
 * Läs CLI-flaggorna. Egen funktion (i stället för inline i main) enbart för att
 * den ska kunna prövas utan att någon rör Airtable.
 *
 * `--efter-korning` tar en VALFRI filsökväg. Nästa argv-post räknas som
 * sökväg bara om den inte själv är en flagga — annars faller den till
 * KASTBARA_POSTER_FIL, så `--efter-korning --dry-run` betyder vad det ser ut
 * att betyda.
 */
export function parseArgs(argv) {
  const dryRun = argv.includes('--dry-run');
  const i = argv.indexOf('--efter-korning');
  if (i === -1) return { lage: 'setup', dryRun, manifestFil: null };
  const nasta = argv[i + 1];
  const manifestFil =
    typeof nasta === 'string' && nasta !== '' && !nasta.startsWith('--')
      ? nasta
      : KASTBARA_POSTER_FIL;
  return { lage: 'efter-korning', dryRun, manifestFil };
}

/**
 * Tolka ägar-manifestets JSONL.
 *
 * FAIL-CLOSED PER RAD: en rad som inte är JSON, eller vars `id` inte är
 * rec-formad, blir en OGILTIG rad — den bär inget ägarskap och kan därför
 * aldrig leda till en radering. Den rapporteras i stället för att tigas ihjäl:
 * en tyst bortsorterad rad hade betytt att en post inte städades och att ingen
 * fick veta det.
 *
 * Duplicerade ID:n är NORMALA (ett event kan registreras av flera anrop i
 * samma svit) och slås ihop av mängden — `vad` behåller den FÖRSTA
 * beskrivningen, som är den som beskriver skapandet.
 */
export function parseManifest(text) {
  const ids = new Set();
  const vad = new Map();
  const ogiltiga = [];
  for (const rad of (text ?? '').split('\n')) {
    if (rad.trim() === '') continue;
    let post;
    try {
      post = JSON.parse(rad);
    } catch {
      ogiltiga.push(rad.slice(0, 120));
      continue;
    }
    if (!post || typeof post !== 'object' || !REC_ID_PATTERN.test(post.id ?? '')) {
      ogiltiga.push(rad.slice(0, 120));
      continue;
    }
    ids.add(post.id);
    if (!vad.has(post.id)) vad.set(post.id, typeof post.vad === 'string' ? post.vad : '');
  }
  return { ids, vad, ogiltiga };
}

/**
 * Klassa ETT targets listade poster mot ägar-manifestet.
 *
 * Ålders-guarden sätts till 0 — se filhuvudets § "ÅLDERS-GUARDEN ERSÄTTS":
 * snittet mot `agdaIds` är ett STARKARE ägarskapsbevis än åldern, och det är
 * det som skyddar mot att röra någon annans in-flight-rad. Varje ANNAT
 * skyddsräcke (exakt markör-match, länk-guard) körs oförändrat, eftersom detta
 * är SAMMA `planPurge` som setup-läget använder.
 *
 * `isOldEnough(_, 0, now)` är fortfarande fail-safe åt rätt håll: en post med
 * oparsbar `createdTime` klassas som "för färsk" och rörs INTE, även om den är
 * ägd. Konservativt med flit — setup-purgen tar den vid nästa jobb.
 */
export function planEfterKorning(records, target, agdaIds, nowMs) {
  const egna = records.filter((r) => agdaIds.has(r.id));
  return planPurge(egna, target, 0, nowMs);
}

/** Alla ID:n ETT target-plan rörde vid — oavsett utfall. Det som INTE står här
 *  gjorde ingen target anspråk på, och är därför luckdetektionens indata. */
export function hanteradeIds(plan) {
  return [
    ...plan.toDelete,
    ...plan.skippedYoung,
    ...plan.skippedMismatch,
    ...plan.skippedLinked.map((s) => s.id),
  ];
}

/** Airtable-formel som matchar exakt de givna rec-ID:na. Används för
 *  luckdetektionens existens-sond — enda stället där vi frågar "finns denna
 *  post över huvud taget", oberoende av sentinel-mönster. */
export function recordIdFormula(ids) {
  return `OR(${ids.map((id) => `RECORD_ID()='${id}'`).join(',')})`;
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

/**
 * Skiljer NÄTVERKSFEL från API-fel (TASK-50).
 *
 * `fetch()` kastar `TypeError` när anropet aldrig nådde fram — DNS, TCP, TLS.
 * Det är transient och värt ett nytt försök. Ett HTTP-svar med statuskod är
 * något helt annat: 422 betyder att anropet är fel, och att köra om det tre
 * gånger gör bara samma misstag snabbare. Default är därför FALSE — okända
 * feltyper retry:as aldrig.
 */
export function isTransientNetworkError(err) {
  return err instanceof TypeError;
}

/** Exponentiell backoff för försök n (1-indexerat): 1 s, 2 s, 4 s … */
export function backoffMs(attempt) {
  return 1000 * 2 ** (attempt - 1);
}

/**
 * Skiljer "posten är REDAN raderad" från varje annan 404 (TASK-76).
 *
 * En DELETE av en redan raderad post har uppnått sitt mål — den är succé, inte
 * fel. Men 404 får ALDRIG bli ett generellt tyst-svälj: en 404 som beror på fel
 * bas eller fel tabell betyder att purgen sopar fel yta, och den måste fälla
 * jobbet. Fixen vore annars fail-open, samma klass som L322.
 *
 * FELFORMERNA ÄR MÄTTA, INTE ANTAGNA (live mot staging apphjj8Q7lkXCMsL4,
 * 2026-07-29, med den skarpa least-privilege-PAT:en; inget muterades — alla
 * rec-ID:n var fabricerade):
 *
 *   okänd post, rätt bas + tabell → 404 {"error":{"type":"NOT_FOUND",
 *                                   "message":"Could not find a record with
 *                                   ID \"recZZZZZZZZZZZZZZ\"."}}
 *   okänd TABELL, rätt bas        → 403 INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND
 *   okänd BAS                     → 403 INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND
 *   PROD-basen (utan scope)       → 403 INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND
 *
 * Att fel-bas/fel-tabell i dag råkar bli 403 och inte 404 är INTE det som bär
 * säkerheten — det är en egenskap hos den nuvarande token-scopen, och en
 * bredare token kan ge 404 i stället. Därför klassar funktionen på POSITIV
 * matchning av räkna-som-succé-formen, aldrig på frånvaro av felform. Fyra
 * oberoende villkor måste ALLA hålla; faller ett är svaret false (= fällande):
 *
 *   1. statuskoden är exakt 404
 *   2. kroppen är JSON med ett error-OBJEKT (bas-nivåns {"error":"NOT_FOUND"}
 *      är en STRÄNG och faller därmed här)
 *   3. error.type är exakt "NOT_FOUND"
 *   4. meddelandet namnger ett rec-ID som finns i den batch vi bad om
 *
 * Villkor 4 är den bärande: en 404 som namnger en post vi aldrig frågade om är
 * inte vårt race, och behandlas som fel.
 */
export function isAlreadyDeletedError(status, body, requestedIds) {
  if (status !== 404) return false;
  let parsed;
  try {
    parsed = JSON.parse(body ?? '');
  } catch {
    return false; // oparsbar kropp ⇒ vi vet inget ⇒ fail-closed
  }
  const error = parsed?.error;
  if (!error || typeof error !== 'object' || Array.isArray(error)) return false;
  if (error.type !== 'NOT_FOUND') return false;
  const match = RECORD_NOT_FOUND_PATTERN.exec(error.message ?? '');
  if (!match) return false;
  return Array.isArray(requestedIds) && requestedIds.includes(match[1]);
}

const NETWORK_ATTEMPTS = 3;

/**
 * fetch med retry på transienta nätverksfel.
 *
 * INCIDENTEN (2026-07-25 18:47:15, QA-vandringens PR-trio): purge-jobbet dog
 * på `TypeError: fetch failed` 1,5 s in, vid FÖRSTA listanropet — före någon
 * delete. Ett ögonblicks nätverksstörning fällde hela CI-körningen via
 * paraply-checken. 429 hade retry sedan bygget; nätverkslagret hade inget.
 *
 * Retryn är säker även för DELETE: anropet nådde aldrig fram, så det kan inte
 * ha utförts. (Hade felet kommit EFTER ett svar vore det ett HTTP-fel, och
 * de retry:as inte.)
 */
export async function fetchWithNetworkRetry(url, token, init) {
  let lastErr;
  for (let attempt = 1; attempt <= NETWORK_ATTEMPTS; attempt += 1) {
    try {
      return await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      if (!isTransientNetworkError(err)) throw err;
      lastErr = err;
      if (attempt < NETWORK_ATTEMPTS) {
        const wait = backoffMs(attempt);
        console.log(
          `   nätverksfel (${err.message}) — försök ${attempt}/${NETWORK_ATTEMPTS}, väntar ${wait} ms …`,
        );
        await sleep(wait);
      }
    }
  }
  console.error(`   nätverksfel kvarstod efter ${NETWORK_ATTEMPTS} försök`);
  throw lastErr;
}

async function airtableRequest(url, token, throttleMs, init = {}) {
  await sleep(throttleMs); // enkel throttle: sekventiella anrop < 5 req/s
  let res = await fetchWithNetworkRetry(url, token, init);
  if (res.status === 429) {
    // Dokumenterat kontrakt: vänta 30 s, försök igen (en gång).
    console.log('   429 rate limit — väntar 30 s och försöker igen …');
    await sleep(30_000);
    res = await fetchWithNetworkRetry(url, token, init);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(`Airtable ${init.method ?? 'GET'} ${res.status}: ${body.slice(0, 300)}`, {
      status: res.status,
      body,
    });
  }
  return res.json();
}

/**
 * Airtable-fel med statuskod. Bär status + rå kropp SEPARAT från meddelandet:
 * klassificering ska aldrig behöva parsa en formaterad sträng (TASK-76).
 */
class ApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function listByFormula(baseId, table, formula, token, throttleMs) {
  const records = [];
  let offset;
  do {
    const url = new URL(`${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(table)}`);
    url.searchParams.set('filterByFormula', formula);
    url.searchParams.set('pageSize', '100');
    if (offset) url.searchParams.set('offset', offset);
    const page = await airtableRequest(url, token, throttleMs);
    records.push(...page.records);
    offset = page.offset;
  } while (offset);
  return records;
}

async function listSentinels(baseId, target, token, throttleMs) {
  return listByFormula(baseId, target.table, target.filterByFormula, token, throttleMs);
}

/** DELETE-URL för en batch (Airtable: ?records[]=…, ≤10 id:n per anrop). */
function deleteUrl(baseId, target, ids) {
  const url = new URL(`${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(target.table)}`);
  for (const id of ids) url.searchParams.append('records[]', id);
  return url;
}

/**
 * Ta om en batch EN POST I TAGET och räkna de som redan var borta som succé.
 *
 * Varför post för post och inte "svälj felet och gå vidare": batch-svaret
 * namnger bara EN post (live-mätt — två okända id:n i samma anrop gav ändå
 * bara det första i meddelandet), så ett svalt batch-fel lämnar oss utan
 * kunskap om vilka av de övriga som faktiskt raderades. Att ta om batchen post
 * för post ger ett entydigt svar per post och är därmed korrekt OAVSETT om
 * Airtables batch-delete är atomär eller delvis utförande — en egenskap vi
 * medvetet inte behöver lita på.
 */
async function deleteOneByOne(baseId, target, ids, token, throttleMs) {
  let deleted = 0;
  let alreadyGone = 0;
  for (const id of ids) {
    try {
      const result = await airtableRequest(deleteUrl(baseId, target, [id]), token, throttleMs, {
        method: 'DELETE',
      });
      deleted += (result.records ?? []).filter((r) => r.deleted).length;
    } catch (err) {
      if (!(err instanceof ApiError) || !isAlreadyDeletedError(err.status, err.body, [id]))
        throw err;
      alreadyGone += 1;
    }
  }
  return { deleted, alreadyGone };
}

/**
 * Radera i batchar. Faller tillbaka till post-för-post NÄR OCH ENDAST NÄR
 * batchen fällde på "posten finns inte" — alltså när en samtidig purge hann
 * före (TASK-76). Varje annat fel kastas vidare orört.
 *
 * Kostnaden bärs bara på race-vägen: en drabbad batch ger ≤10 extra anrop.
 */
export async function deleteRecords(baseId, target, ids, token, throttleMs, batchSize) {
  let deleted = 0;
  let alreadyGone = 0;
  for (const batch of chunk(ids, batchSize)) {
    try {
      const result = await airtableRequest(deleteUrl(baseId, target, batch), token, throttleMs, {
        method: 'DELETE',
      });
      deleted += (result.records ?? []).filter((r) => r.deleted).length;
    } catch (err) {
      if (!(err instanceof ApiError) || !isAlreadyDeletedError(err.status, err.body, batch)) {
        throw err;
      }
      console.log(
        '   ⓘ  en samtidig purge hann före på minst en post i batchen — tar om batchen post för post',
      );
      const outcome = await deleteOneByOne(baseId, target, batch, token, throttleMs);
      deleted += outcome.deleted;
      alreadyGone += outcome.alreadyGone;
    }
  }
  return { deleted, alreadyGone };
}

// ---------------------------------------------------------------------------
// [TASK-302.3] Storage-purge — anropar test-attachments-storage/index.ts:s
// "list_prefix"/"remove_paths" (JWT-gated testharness-EF, SAMMA
// "privilegierad Storage-operation utan en ny hemlighet"-mönster som
// Airtable-halvan ovan bär för sin egen bas: ingen SERVICE_ROLE-nyckel når
// någonsin detta skript, bara en test-admin-inloggning + EF:ens egen
// auto-injicerade service-role SERVER-SIDE).
//
// GATAD PÅ FYRA REDAN BEFINTLIGA env-variabler (TEST_SUPABASE_URL/
// TEST_SUPABASE_ANON_KEY/TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD — SAMMA fyra
// som tests/api/helpers.ts:s getApiConfig() kräver, ingen ny hemlighet).
// SAKNAS NÅGON → tyst SKIP med en tydlig loggrad, ALDRIG process.exit(1).
//
// [TASK-305, 2026-08-23] `Staging sentinel purge`-CI-jobbet
// (.github/workflows/ci-suite.yml) injicerar sedan denna skiva de fyra
// TEST_*-secreten i tillägg till STAGING_AIRTABLE_TOKEN — grenen körs
// alltså numera i CI också, inte bara lokalt (`.env.test` källad). Dom +
// källor: docs/research/ci-stadjobbets-credential-scope-2026-08-23.md §
// Dom; historik: docs/decisions/ADR-124-…md § Updates 2026-08-23. Gaten
// nedan är kvar orörd som fail-closed skyddsnät om secreten någon gång
// saknas (secret-rotation, nytt jobb som glömmer tråda in dem) — inte
// bara en övergångslösning.
// ---------------------------------------------------------------------------

const TEST_HARNESS_ENDPOINT = '/functions/v1/test-attachments-storage';

/** Vilka fyra env-variabler storage-purgen kräver — en enda källa för både gate och felmeddelande. */
const STORAGE_PURGE_ENV_VARS = [
  'TEST_SUPABASE_URL',
  'TEST_SUPABASE_ANON_KEY',
  'TEST_ADMIN_EMAIL',
  'TEST_ADMIN_PASSWORD',
];

/** Loggar in som test-admin (Supabase Auth REST, samma anrop som tests/api/helpers.ts § loginUser) och returnerar access_token. */
async function loginTestAdmin(baseUrl, anonKey, email, password) {
  const res = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.text();
  if (!res.ok) {
    throw new ApiError(`test-admin-inloggning ${res.status}: ${body.slice(0, 300)}`, {
      status: res.status,
      body,
    });
  }
  return JSON.parse(body).access_token;
}

/** POST mot test-attachments-storage. Kastar ApiError på icke-2xx. */
async function callTestHarness(baseUrl, jwt, action, extra) {
  const res = await fetch(`${baseUrl}${TEST_HARNESS_ENDPOINT}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...extra }),
  });
  const body = await res.text();
  if (!res.ok) {
    throw new ApiError(`test-attachments-storage(${action}) ${res.status}: ${body.slice(0, 300)}`, {
      status: res.status,
      body,
    });
  }
  return JSON.parse(body);
}

/** Purga ETT storage-target: list_prefix → planStoragePurge (pure) → remove_paths. */
async function purgeStorageTarget(baseUrl, jwt, target, minAgeMinutes, nowMs, dryRun) {
  const { entries } = await callTestHarness(baseUrl, jwt, 'list_prefix', {
    prefix: target.pathPrefix,
  });
  const plan = planStoragePurge(entries, minAgeMinutes, nowMs);
  console.log(
    `▸ ${target.name} (bucket "${target.bucket}", prefix "${target.pathPrefix}"): ` +
      `${entries.length} objekt — ${plan.toDelete.length} raderas, ${plan.skippedYoung.length} för färska`,
  );
  if (dryRun || plan.toDelete.length === 0) return;
  const { deleted } = await callTestHarness(baseUrl, jwt, 'remove_paths', { paths: plan.toDelete });
  console.log(`   🗑  ${deleted.length}/${plan.toDelete.length} raderade`);
}

// ---------------------------------------------------------------------------
// [TASK-309.15] Efter-körning-purgen — manifest-driven, ålders-guard ersatt av
// ägarskap. Se filhuvudets § TVÅ LÄGEN för hela resonemanget.
// ---------------------------------------------------------------------------

/**
 * Kör efter-körning-läget. Returnerar true om något gick fel (anropar-sidan
 * mappar det till exit 2) — samma form som setup-flödets `hadApiError`.
 */
async function efterKorning(policy, token, manifestFil, dryRun) {
  const { expectedBaseId, requestThrottleMs, deleteBatchSize } = policy;

  let text;
  try {
    text = await readFile(manifestFil, 'utf8');
  } catch {
    // INGEN fil = ingen körning har registrerat något. Det är ett giltigt
    // utfall (staging-steget skippades, eller sviten skapade inga rader) och
    // ska INTE fälla jobbet — setup-purgen är kvar som andra försvarslinje.
    console.log(
      `ⓘ  Inget ägar-manifest på "${manifestFil}" — inget att städa efter körningen. ` +
        '(Skrivs av tests/support/kastbara-poster.ts när en staging-svit skapar en kastbar rad.)',
    );
    return false;
  }

  const { ids, vad, ogiltiga } = parseManifest(text);
  console.log(
    `Efter-körning-purge mot ${expectedBaseId} — ${ids.size} ägd(a) post(er) i "${manifestFil}"` +
      `${dryRun ? ' — DRY RUN, inget raderas' : ''}`,
  );
  for (const rad of ogiltiga) {
    console.log(`   ⚠️  ogiltig manifest-rad hoppas över (bär inget ägarskap): ${rad}`);
  }
  if (ids.size === 0) return false;

  let hadApiError = false;
  const kvar = new Set(ids);
  const nowMs = Date.now();

  for (const target of policy.targets) {
    try {
      const records = await listSentinels(expectedBaseId, target, token, requestThrottleMs);
      const plan = planEfterKorning(records, target, ids, nowMs);
      for (const id of hanteradeIds(plan)) kvar.delete(id);
      if (
        plan.toDelete.length === 0 &&
        plan.skippedYoung.length === 0 &&
        plan.skippedLinked.length === 0 &&
        plan.skippedMismatch.length === 0
      ) {
        continue; // detta target ägde ingenting i denna körning — tyst.
      }
      console.log(
        `▸ ${target.name} (${target.table}): ${plan.toDelete.length} ägda raderas, ` +
          `${plan.skippedLinked.length} länk-guardade, ${plan.skippedMismatch.length} icke-exakta, ` +
          `${plan.skippedYoung.length} utan läsbar createdTime`,
      );
      for (const s of plan.skippedLinked) {
        console.log(
          `   ⚠️  ${s.id} hoppas över — länkade fält: ${s.fields.join(', ')} (fail-safe: rapportera, radera ej)`,
        );
      }
      for (const id of plan.skippedMismatch) {
        console.log(`   ⚠️  ${id} träffade formeln men INTE exakt-mönstret — rörs ej`);
      }
      if (dryRun || plan.toDelete.length === 0) continue;

      const { deleted, alreadyGone } = await deleteRecords(
        expectedBaseId,
        target,
        plan.toDelete,
        token,
        requestThrottleMs,
        deleteBatchSize,
      );
      console.log(
        `   🗑  ${deleted}/${plan.toDelete.length} raderade` +
          (alreadyGone > 0 ? ` (+${alreadyGone} redan borta — räknas som utfört)` : ''),
      );

      // Efter-verifiering, samma form som setup-flödet: inga ÄGDA rader kvar.
      const remaining = planEfterKorning(
        await listSentinels(expectedBaseId, target, token, requestThrottleMs),
        target,
        ids,
        nowMs,
      );
      if (remaining.toDelete.length > 0) {
        throw new ApiError(
          `efter-verifiering: ${remaining.toDelete.length} ägda sentineler kvarstår`,
        );
      }
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
      hadApiError = true;
      console.error(`❌ ${target.name}: ${err.message}`);
    }
  }

  // ═══ LUCKDETEKTIONEN ═══
  // En ägd post som inget target rörde är ANTINGEN redan borta (normalt — en
  // tidigare körnings manifest-rad, eller setup-purgen hann före) ELLER kvar i
  // basen utan att någon target gör anspråk på den. Det andra fallet är den
  // lucka som lät `ZZ-create-event-test-uppdaterad` ligga i 32 dygn, och den
  // ska fälla — inte tigas. Sonden frågar per TABELL, inte per post: en
  // formel-listning per distinkt tabell i policyn, oavsett antal ID:n.
  if (kvar.size > 0 && !hadApiError) {
    const tabeller = [...new Set(policy.targets.map((t) => t.table))];
    const funna = new Map();
    try {
      for (const tabell of tabeller) {
        for (const batch of chunk([...kvar], 50)) {
          const rader = await listByFormula(
            expectedBaseId,
            tabell,
            recordIdFormula(batch),
            token,
            requestThrottleMs,
          );
          for (const r of rader) funna.set(r.id, tabell);
        }
      }
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
      hadApiError = true;
      console.error(`❌ luckdetektionens existens-sond: ${err.message}`);
    }

    const borta = [...kvar].filter((id) => !funna.has(id));
    if (borta.length > 0) {
      console.log(
        `ⓘ  ${borta.length} ägd(a) post(er) fanns inte längre i basen (redan raderade) — inget att göra.`,
      );
    }
    if (funna.size > 0) {
      console.error(
        `❌ LUCKA: ${funna.size} ägd(a) post(er) FINNS KVAR men matchade ingen purge-target. ` +
          'Sentinel-familjen saknar en target i .purge-staging-policy.json — lägg till den, ' +
          'annars ligger raderna kvar för alltid (setup-purgen ser dem inte heller).',
      );
      for (const [id, tabell] of funna) {
        console.error(`   ⚠️  ${id} i ${tabell} — registrerad som "${vad.get(id) ?? '?'}"`);
      }
      hadApiError = true;
    }
  }

  // Manifestet är förbrukat när körningen lyckats — annars växer den lokala
  // filen obegränsat. Vid fel LÄMNAS den kvar med flit: nästa körning ska få
  // ett nytt försök på samma poster.
  if (!dryRun && !hadApiError) {
    await rm(manifestFil, { force: true });
  }

  return hadApiError;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { lage, dryRun, manifestFil } = parseArgs(process.argv);
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

  // TASK-84: EFTER policy- och token-guarderna, FÖRE första begäran mot
  // Airtable. En lokal purge samtidigt med CI:s `Staging sentinel purge` är
  // exakt TASK-76:s race, bara med en aktör som varken concurrency-gruppen
  // eller fillåset ser. No-op under GITHUB_ACTIONS — detta script ÄR det
  // CI-jobbet. Gäller även --dry-run: en dry run läser basen och delar dess
  // 5 req/s-budget.
  kravStagingLedigt('lokal purge:staging');

  // [TASK-309.15] Efter-körning-läget delar ALLA guards ovan (policy-form,
  // bas-guard, token-krav, staging-preflight) och grenar först här.
  if (lage === 'efter-korning') {
    const fel = await efterKorning(policy, token, manifestFil, dryRun);
    if (fel) process.exit(2);
    console.log(dryRun ? 'Efter-körning-purge: dry run klar.' : 'Efter-körning-purge klar.');
    return;
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

      const { deleted, alreadyGone } = await deleteRecords(
        expectedBaseId,
        target,
        plan.toDelete,
        token,
        requestThrottleMs,
        deleteBatchSize,
      );
      console.log(
        `   🗑  ${deleted}/${plan.toDelete.length} raderade` +
          (alreadyGone > 0
            ? ` (+${alreadyGone} redan borta — samtidig purge hann före, räknas som utfört)`
            : ''),
      );

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

  // [TASK-302.3] Storage-targets — se § "Storage-purge" ovan för gaten och
  // varför en saknad TEST_*-env är ett SKIP, inte ett fel.
  if (Array.isArray(policy.storageTargets) && policy.storageTargets.length > 0) {
    const missingEnv = STORAGE_PURGE_ENV_VARS.filter((name) => !process.env[name]);
    if (missingEnv.length > 0) {
      console.log(
        `ⓘ  storageTargets hoppas över — saknar ${missingEnv.join(', ')} i env ` +
          `(${missingEnv.length}/${STORAGE_PURGE_ENV_VARS.length}). Lokalt: källa .env.test. ` +
          'CI (TASK-305): purge-jobbet injicerar normalt dessa fyra — saknas de ändå har ' +
          'något i .github/workflows/ci-suite.yml drifat, se skriptets § Storage-purge.',
      );
    } else {
      try {
        const jwt = await loginTestAdmin(
          process.env.TEST_SUPABASE_URL,
          process.env.TEST_SUPABASE_ANON_KEY,
          process.env.TEST_ADMIN_EMAIL,
          process.env.TEST_ADMIN_PASSWORD,
        );
        for (const target of policy.storageTargets) {
          await purgeStorageTarget(
            process.env.TEST_SUPABASE_URL,
            jwt,
            target,
            minAgeMinutes,
            nowMs,
            dryRun,
          );
        }
      } catch (err) {
        if (!(err instanceof ApiError)) throw err;
        hadApiError = true;
        console.error(`❌ storageTargets: ${err.message}`);
      }
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
