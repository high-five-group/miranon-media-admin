#!/usr/bin/env node
// scripts/create-bilagor-table.mjs — skapar bilage-fundamentets METADATA- och
// eventkopplings-tabell ("Bilagor") ADDITIVT i Airtable-basen, INCHECKAT och
// idempotent i stället för konsolklick (TASK-146.2, AC #1–#3).
//
// VARFÖR ETT SKRIPT OCH INTE ETT KONSOLKLICK (TASK-146.2 kortets egen motivering,
// oförändrad här): repot har varken `supabase/migrations` eller
// storage-konfiguration (`ls supabase/` visar bara config.toml, functions/,
// templates/) — Supabase används idag bara för Edge Functions och Auth. Ingen
// extern resurs har alltså en deklarativ hemvist. Görs uppsättningen för hand
// blir den odokumenterad och oupprepbar, och nästa miljö (prod, eller en framtida
// staging-återskapelse) får gissa sig fram. Detta skript ÄR den deklarativa
// hemvisten för tabellens fältuppsättning tills ett riktigt migrations-system
// finns.
//
// VAD TABELLEN ÄR (TASK-146, PRD "Delad hemvist"): bytesen (själva filen) bor i
// privat objektlagring (TASK-146.3, Supabase Storage) — ALDRIG i Airtables egna
// attachment-fält. Skälet är väggkatalogens P28 (attachment-URL:er utgår efter
// 2 timmar) och P29 (upload-API:t kapat till 5 MB direkt-byte), se
// docs/reference/airtable-constraints.md § G. Denna tabell bär bara METADATAT
// och EVENTKOPPLINGEN — "veta VILKA bilagor som finns och vilket event de hör
// till" (kortets egen avgränsning). Fältuppsättningen är medvetet MINIMAL:
// dokumentklass (A/B/C), lagringsnyckel och person-koppling hör till de skivor
// som faktiskt konsumerar dem (TASK-146.3 lagringsvägen, TASK-146.4 adaptern,
// TASK-146.5 klass B, Åtgärds-sidan/kort 3 klass C-kvitton) — additivt i basen
// betyder att VARJE skiva lägger till exakt det den behöver, inte att en enda
// skiva ska gissa hela slutmodellen i förväg.
//
// FÄLTEN, TRACEADE MOT KORTETS EGEN TEXT (ingen är påhittad):
//   "veta VILKA bilagor som finns"        → Namn (primärfält)
//   "vilket event de hör till"            → Event (länk till Eventplanering)
//   US4 "namn, storlek och när den lades
//        upp, så att jag kan avgöra om
//        det är rätt version"             → Namn, Storlek (bytes), Skapad
//
// "Skapad" är medvetet NEUTRALT namngivet, inte "Uppladdad": klass B/C-bilagor
// "laddas" inte upp, de GENERERAS — PRD:n säger uttryckligen att alla tre
// klasser "landar som samma sorts bilaga med samma metadata, oavsett hur de
// uppstod" (TASK-146 § Lösning). Fältet är en manuellt satt `dateTime`, INTE
// Airtables `createdTime`-autofält — se motiveringen vid CONFIG.fields nedan
// (den skarpa 422:an som satte stopp för det förstahandsvalet, och varför
// det manuella alternativet faktiskt är arkitektoniskt bättre för US14).
//
// API-FORMEN (Airtable Web API, verifierad mot developers-docs 2026-08-07):
//   GET  /v0/meta/bases/{baseId}/tables                        (schema.bases:read)
//   POST /v0/meta/bases/{baseId}/tables                        (schema.bases:write)
//   POST /v0/meta/bases/{baseId}/tables/{tableId}/fields        (schema.bases:write)
// Källor: airtable.com/developers/web/api/create-table,
// airtable.com/developers/web/api/create-field,
// airtable.com/developers/web/api/get-base-schema.
//
// TOKEN: AIRTABLE_SCHEMA_TOKEN ur gitignorade .env.seed (se .env.seed.example),
// laddad av npm-skriptet via `node --env-file-if-exists=.env.seed` — samma
// mekanism som `purge:staging`/`seed:review`. SKILD från STAGING_AIRTABLE_TOKEN
// med flit (ADR-060 § Beslut punkt 4, "purge bor i Airtable-creddad seed-tooling
// SKILD från testet" — samma separations-princip tillämpad en nivå till):
// STAGING_AIRTABLE_TOKEN är pinnad till data.records:read+write ENDAST
// (seed-review-fixture.mjs § SCHEMA-BLINDHET ÄR ETT DESIGNVILLKOR) och används
// av CI:s purge-jobb — att bredda DEN token:en till schema.bases:write hade
// givit CI:s automatiska purge-jobb en skriv-till-schema-förmåga det aldrig ska
// ha. Ett schema-skrivande verktyg får sin EGEN, snävare token.
//
// ÄRLIG GRÄNS PÅ TOKENET, INTE DOLD: den PAT som var tillgänglig vid detta
// skripts första körning (samma nyckel som `mcp__airtable__*`-MCP-servern
// använder) har `create`-behörighet mot BÅDA baserna — staging OCH prod
// (verifierat 2026-08-07 via mcp__airtable__list_bases). Det är INTE
// least-privilege i STAGING_AIRTABLE_TOKEN-bemärkelse. Skyddet mot en
// oavsiktlig prod-skrivning ligger därför HELT i kodens bas-guard nedan
// (expectedBaseId/forbiddenBaseIds), inte i tokenets egen scope. En dedikerad
// least-privilege-PAT (schema.bases:read+write, ENDAST staging-basen) är
// FÖREDRAGET för framtida körningar — se .env.seed.example.
//
// PROD-KÖRNINGEN (TASK-146.2 AC #4) är UTTRYCKLIGEN INTE detta skripts jobb att
// utföra. Skriptet är hårdkodat mot staging med prod hårt blockerad (samma
// mönster som seed-review-fixture.mjs/purge-staging-sentinels.mjs — se
// validateConfig). Att köra mot prod kräver en MEDVETEN, granskningsbar
// kod-redigering av en människa (byt CONFIG.expectedBaseId till
// 'app8uGPrVCVOm6LfD' OCH ta bort den ur CONFIG.forbiddenBaseIds) — aldrig ett
// CLI-flaggval. Det är avsiktligt: prod-åtkomst ska aldrig vara "ett ord bort"
// på kommandoraden för ett skript med skriv-till-schema-behörighet.
//
// Exit: 0 = OK (inklusive "redan i synk, inget att göra"), 1 = guard-/
// konfigurations-/argument-/schemamissmatch-fel, 2 = Airtable-API-fel.

import { pathToFileURL } from 'node:url';
import { kravStagingLedigt } from './lib/staging-preflight.mjs';

// ---------------------------------------------------------------------------
// CONFIG — projekt-specifikt. Logiken nedanför är universell.
// ---------------------------------------------------------------------------

export const CONFIG = {
  /** Staging. Prod är hårt blockerad (skyddsräcke 1) — se headern ovan. */
  expectedBaseId: 'apphjj8Q7lkXCMsL4',
  forbiddenBaseIds: ['app8uGPrVCVOm6LfD'],

  table: {
    name: 'Bilagor',
    description:
      'Bilage-fundamentets metadata- och eventkopplingstabell (TASK-146.2). ' +
      'Bytesen (filen) bor i Supabase Storage (TASK-146.3), ALDRIG i denna bas — ' +
      'se docs/reference/airtable-constraints.md § G (P28 tvåtimmars-URL:er, ' +
      'P29 5 MB-uppladdningstak). Skapad additivt av ' +
      'scripts/create-bilagor-table.mjs — redigera INTE fälten via konsolen, ' +
      'redigera skriptet och kör om det.',
  },

  /**
   * Fältuppsättningen — se filhuvudets spårning mot kortets text för VARFÖR
   * just dessa fyra och inte fler. `Namn` måste stå FÖRST: Airtables
   * create-table-API gör det första fältet i arrayen till primärfältet.
   */
  fields: [
    {
      name: 'Namn',
      type: 'singleLineText',
      description: 'Bilagans namn/filnamn, t.ex. "Deltagarinformation.pdf".',
      options: {},
    },
    {
      name: 'Storlek (bytes)',
      type: 'number',
      description:
        'Filstorlek i bytes. Samma enhetsnamngivning som basens övriga ' +
        'procent-/mätfält (t.ex. "Anmäld beläggning (%)").',
      options: { precision: 0 },
    },
    {
      name: 'Skapad',
      // INTE `createdTime`: Airtables Metadata-API vägrar skapa den typen
      // programmatiskt — varken vid table-create ELLER som separat
      // field-create (verifierat skarpt mot staging 2026-08-07, båda vägarna
      // gav UNSUPPORTED_FIELD_TYPE_FOR_CREATE; bekräftat mot Airtable
      // Community: "these system-generated fields cannot be created through
      // the API and must be added manually through the Airtable interface").
      // En manuellt satt `dateTime` är dessutom ARKITEKTONISKT BÄTTRE för
      // US14 (lager-oberoende): Airtables auto-fält har ingen ren
      // motsvarighet att SKRIVA från adapter-kod, medan "adaptern sätter
      // Skapad = nu vid radskapelse" är exakt samma kontrakt oavsett om
      // adaptern pratar med Airtable eller en framtida Postgres-adapter
      // (Fas E). Konsekvens, öppet bokförd: fältet fylls INTE automatiskt om
      // en rad skapas direkt i Airtable-konsolen utan att gå via adaptern —
      // samma mönster som basens övriga automations-beroende fält (se
      // data-model.md § Kända fällor 11+16, "manuella rader kopplas inte
      // automatiskt").
      type: 'dateTime',
      description:
        'När bilagan skapades (satt av skrivande adapter/EF, inte automatiskt av ' +
        'Airtable) — täcker alla tre dokumentklasser (uppladdad, mall-genererad, ' +
        'person-genererad), inte bara klass A.',
      // Exakt samma options-form som basens BEFINTLIGA dateTime-fält (t.ex.
      // Anmälningar.Inskickad, Deltaganden.Avstämt) — live-läst ur schemat
      // 2026-08-07 i stället för gissad, så fältet ser ut och beter sig som
      // resten av basens tidsstämplar.
      options: {
        dateFormat: { name: 'local', format: 'l' },
        timeFormat: { name: '24hour', format: 'HH:mm' },
        timeZone: 'client',
      },
    },
    {
      name: 'Event',
      type: 'multipleRecordLinks',
      description: 'Vilket event bilagan hör till. Länkad tabell: Eventplanering.',
      // tblVE3UKWl1CKrphV = Eventplanering, docs/reference/data-model.md
      // § Snabbreferens — Tabell-ID:n. Samma ID i staging och prod
      // (ID-topologin delas mellan baserna, data-model.md § ID-topologi).
      //
      // ÄRLIG GRÄNS PÅ ADDITIVITETEN (mätt 2026-08-07, se slutrapporten):
      // Airtable skapar AUTOMATISKT ett spegelfält (samma namn som denna
      // tabell, "Bilagor") på Eventplanering när detta länkfält skapas —
      // det finns ingen dokumenterad API-väg att stänga av det (varje
      // länkfält i Airtable är strukturellt tvåvägs). Redan känt platform-
      // beteende, data-model.md § Kända fällor 3 ("Spegelfält skapar inga
      // relationer... Skriv alltid från ägar-sidan"). Konsekvensen ÄR mätt:
      // Eventplanering fick ETT nytt, tomt fält (`Bilagor`) och INGET annat
      // rördes — inget befintligt fält togs bort, döptes om eller bytte typ
      // (verifierat med ett schema-diff FÖRE/EFTER över HELA basen, alla
      // 19 tabeller). Detta är additivt i sak (en ren tillägg, ingen
      // förändring av något befintligt), men INTE bokstavligt "tabellen
      // Eventplanering orörd" — den läsningen registreras här öppet i
      // stället för att glömmas eller mätas bort.
      options: { linkedTableId: 'tblVE3UKWl1CKrphV' },
    },
  ],

  requestThrottleMs: 250,
};

const AIRTABLE_META_URL = 'https://api.airtable.com/v0/meta/bases';
const BASE_ID_PATTERN = /^app[A-Za-z0-9]{14}$/;

/**
 * KÄND VÄGG, INTE EN GISSNING (skarpt upptäckt 2026-08-07 mot staging, se
 * CONFIG.fields → "Skapad" för den fullständiga motiveringen): Airtables
 * Metadata-API kan INTE skapa "computed"/systemfälttyper — `createdTime`,
 * och rimligen samma familj (`lastModifiedTime`, `createdBy`,
 * `lastModifiedBy`, `autoNumber`) — programmatiskt. Det gäller BÅDA vägarna,
 * inte bara table-create: POST .../tables gav
 * `UNSUPPORTED_FIELD_TYPE_FOR_CREATE` med meddelandet "Create the table
 * first, then add these fields separately" — men det påföljande POST
 * .../tables/{id}/fields-anropet gav SAMMA feltyp. Airtable Community
 * bekräftar mönstret (sökning 2026-08-07): "these system-generated fields
 * cannot be created through the API and must be added manually through the
 * Airtable interface." Det finns alltså INGEN skriptbar väg till en
 * `createdTime`-fälttyp — vilket är VARFÖR "Skapad" nedan är en manuellt satt
 * `dateTime` i stället. Detta skript försöker aldrig skapa en fälttyp ur
 * denna familj; om ett framtida CONFIG.fields-tillägg gör det kommer
 * Airtable fälla det med samma 422, och felmeddelandet pekar hit.
 */

// ---------------------------------------------------------------------------
// Pura funktioner (exporterade för scripts/test-create-bilagor-table.mjs)
// ---------------------------------------------------------------------------

/** Skyddsräcke 1: bas-guarden. Kastar vid fel — samma form som de befintliga
 * Airtable-skripten (seed-review-fixture.mjs, purge-staging-sentinels.mjs). */
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
 * Klassa önskad fältuppsättning mot en befintlig tabells fält.
 *
 * Detta ÄR additivitets-mätningen (AC #3/DoD #7) i pur, testbar form: en
 * körning som inte ändrar NÅGOT av det befintliga producerar `toCreate: []`
 * och `mismatches: []` — noop. `mismatches` är en HÅRD guard: om ett fält med
 * samma NAMN redan finns men med en ANNAN typ, rör skriptet det aldrig — det
 * bara larmar. Att "reparera" ett avvikande fält vore att skriva över någon
 * annans (eller en tidigare körnings) medvetna schema-ändring, och är exakt
 * den klass av tyst korrigering resten av basens skript undviker (jämför
 * legacyRakningsavvikelser i seed-review-fixture.mjs: avviker basen från det
 * förväntade vägrar skriptet, det gissar aldrig).
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
 * Fältets API-payload. `options` UTELÄMNAS helt när den är tom — INTE en
 * gissning: den skarpa 422:an (staging, 2026-08-07, andra körningen) löd
 * ordagrant för `Namn` (singleLineText, CONFIG.fields[0].options = {}):
 * `"INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE","message":"Invalid options for
 * Bilagor.Namn: Failed schema validation: options is not included in the
 * Namn.(type=singleLineText) schema"`. developers-docs field-model-sidan sa
 * uttryckligen "options: object (required)" för singleLineText/multilineText
 * (verifierad 2026-08-07) — API:t self höll INTE med. Typer med en faktisk
 * options-nyttolast (number, dateTime, multipleRecordLinks, …) är opåverkade:
 * de har alltid minst en nyckel.
 */
function toApiFieldPayload({ name, type, description, options }) {
  const harOptions = options && typeof options === 'object' && Object.keys(options).length > 0;
  return { name, type, description, ...(harOptions ? { options } : {}) };
}

/**
 * Request-body för POST .../tables. Samtliga CONFIG.fields skapas i EN
 * batch — `Namn` (första fältet) blir primärfältet i Airtable. (Ingen av
 * fälten är i den API-vägrade computed-familjen, se kommentaren ovan
 * `toApiFieldPayload` — därav ingen tvåfas-uppdelning här.)
 */
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
        'se filhuvudets motivering.',
    );
    process.exit(1);
  }

  kravStagingLedigt('lokal schema:bilagor');

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
