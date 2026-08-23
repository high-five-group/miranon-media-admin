#!/usr/bin/env node
// scripts/create-eventinnehall-modell.mjs — skapar bilage-datamodellens
// TRE nya tabeller (Eventinnehåll, Agendapunkter, Platser) och lägger till
// fälten på Eventplanering och Bilagor ADDITIVT i Airtable-basen, INCHECKAT
// och idempotent i stället för konsolklick (TASK-309.2 AC #1, ADR-125 § 2).
//
// SAMMA LÅS-MÖNSTER SOM scripts/create-bilagor-table.mjs (staging-låst,
// bas-guard, idempotent no-op vid omkörning, mismatch → GuardError, aldrig
// tyst korrigering) — generaliserat från EN tabell till FEM OPERATIONER (tre
// tabellskapelser + två fält-tilllägg på befintliga tabeller), eftersom
// ADR-125 § 2:s modell spänner över dem alla i en och samma logiska
// leverans. Logiken är universell; CONFIG.operations är projekt-specifik
// (samma separationsprincip som `~/.claude/CLAUDE.md` § "Custom
// CI-grindvakts-logik i spokes är alltid config-driven").
//
// ─────────────────────────────────────────────────────────────────────────
// SKARPT KÖRT REDAN, AV SKÄL SOM TASK-147.12 REDAN ETABLERADE SOM PRECEDENT
// ─────────────────────────────────────────────────────────────────────────
// AIRTABLE_SCHEMA_TOKEN SAKNADES i lokal .env.seed vid detta korts
// byggtillfälle (2026-08-23) — exakt samma lucka som TASK-147.12:s
// Dokumentklass-fält (create-bilagor-table.mjs § filhuvud). Hela modellen
// (tre tabeller, 18 fält på Eventplanering, 2 fält på Bilagor) skapades
// därför LIVE via Airtable MCP (mcp__airtable__create_table/create_field)
// i STÄLLET FÖR att köra detta skript. CONFIG nedan SPEGLAR EXAKT den
// skapade specen (verifierat via describe_table efteråt — samtliga fält-ID:n
// i kommentarerna är disk/API-verifierade, inte gissade) så att en FRAMTIDA
// körning av detta skript (med token på plats) är en NO-OP för samtliga fem
// operationer i stället för att försöka skapa dem på nytt eller — värre —
// larma mismatch. Skriptet förblir den deklarativa hemvisten för SPECEN;
// detta är samma dokumenterade undantag från "skriptet utförde skapandet"
// som create-bilagor-table.mjs § Dokumentklass redan etablerar.
//
// ─────────────────────────────────────────────────────────────────────────
// PLATTFORMSVÄGG, TESTAD SKARPT (TASK-309.2): FORMEL-FÄLT KAN INTE VARA
// PRIMÄRFÄLT
// ─────────────────────────────────────────────────────────────────────────
// ADR-125 § 2 specificerar `Eventinnehåll.Namn` som "formel {Event} & ' · '
// & {Typ}, primär". Två oberoende Airtable Meta-API-väggar gör den
// bokstavliga specen OMÖJLIG att realisera via API, mätta skarpt mot en
// kastbar testtabell (ZZ-formula-order-test, skapad och riven i samma pass):
//
//   1. Formelfält kan INTE skapas som en del av POST .../tables (samma
//      "computed field family"-vägg som create-bilagor-table.mjs redan
//      dokumenterar för `createdTime`) — svaret är
//      `UNSUPPORTED_FIELD_TYPE_FOR_CREATE`, "Create the table first, then
//      add these fields separately."
//   2. Ett formelfält KAN skapas via den SEPARATA POST .../fields-endpointen
//      EFTER att tabellen finns (testat, fungerar) — men primärfältet är
//      OÅTERKALLELIGT det FÖRSTA fältet i tabellskapelsens fields-array
//      (create-bilagor-table.mjs § "Namn måste stå FÖRST"), och Airtables
//      Meta-API exponerar INGEN endpoint för att byta primärfält i
//      efterhand.
//
// Slutsats: "formel OCH primärfält samtidigt" är strukturellt onåbart för
// ett NYSKAPAT fält via denna plattform. `Namn` är därför `singleLineText`
// (primärfält, precis som specen kräver) — men POPULERAD av den skrivande
// koden (seed-skriptet vid radskapelse, TASK-309.3:s skrivväg vid framtida
// redigering) med strängen `"{Event} · {Typ}"`, INTE en levande Airtable-
// formel. Praktisk konsekvens: värdet är en ÖGONBLICKSBILD, inte
// härlett — redigeras `Event`/`Typ` på en rad UTAN att skrivvägen samtidigt
// uppdaterar `Namn`, glider de isär. Lågriskkant: `Event`×`Typ` är radens
// IDENTITETSNYCKEL (uppslagsnyckeln hela modellen vilar på, ADR-125 § 2 §
// "Uppslag, inte länk") och är inte avsedd att redigeras fritt efter
// skapelse. Bokfört öppet här och i docs/reference/data-model.md, inte
// tyst designat bort.
//
// ─────────────────────────────────────────────────────────────────────────
// API-FORMEN (Airtable Web API, samma som create-bilagor-table.mjs):
//   GET  /v0/meta/bases/{baseId}/tables                        (schema.bases:read)
//   POST /v0/meta/bases/{baseId}/tables                        (schema.bases:write)
//   POST /v0/meta/bases/{baseId}/tables/{tableId}/fields        (schema.bases:write)
//
// TOKEN: AIRTABLE_SCHEMA_TOKEN — se create-bilagor-table.mjs § filhuvud för
// den fulla motiveringen (skild från STAGING_AIRTABLE_TOKEN, ADR-060 punkt 4).
//
// PROD-KÖRNINGEN är UTTRYCKLIGEN INTE detta skripts jobb (ADR-125 § 8:
// Marcus GO per tabell). Samma hårda bas-guard som create-bilagor-table.mjs.
//
// Exit: 0 = OK (inklusive "redan i synk, inget att göra" per operation),
// 1 = guard-/konfigurations-/argument-/schemamissmatch-fel, 2 = Airtable-API-fel.

import { pathToFileURL } from 'node:url';
import { kravStagingLedigt } from './lib/staging-preflight.mjs';

// ---------------------------------------------------------------------------
// CONFIG — projekt-specifikt. Logiken nedanför är universell.
// ---------------------------------------------------------------------------

const BILAGETEXT_SUFFIX = ' (bilagetext)'; // inledande mellanslag (ADR-125 § 2)

/** Eventplanering.Event (source)-valen — SPEGLAS här (data-model.md § Schema
 *  cheat sheet, `flddlv4JA5C5CeH5R`), inte importerat: Eventinnehåll.Event
 *  måste bära IDENTISKA optionsnamn men får EGNA option-ID:n (Airtable delar
 *  aldrig option-ID:n mellan fält, samma mönster som ADR-118:s
 *  Kursfamilj/Kursnivå-speglingar). Live-verifierat mot staging 2026-08-23. */
const EVENT_SOURCE_CHOICES = [
  'Fjärrskådning',
  'Resor i medvetandet',
  'Resor i medvetandet 1',
  'Resor i medvetandet 2',
  'Resor i medvetandet 3',
  'Psionautics',
];

/** Eventplanering.Typ-valen (`fldkiFRVYG0xTAhJ4`), samma speglings-princip. */
const TYP_CHOICES = ['Utbildning', 'Föreläsning'];

export const CONFIG = {
  /** Staging. Prod är hårt blockerad (skyddsräcke 1) — se headern ovan. */
  expectedBaseId: 'apphjj8Q7lkXCMsL4',
  forbiddenBaseIds: ['app8uGPrVCVOm6LfD'],

  requestThrottleMs: 250,

  /**
   * Ordnad lista — CREATE-operationer FÖRE ADD_FIELDS-operationer som
   * refererar dem via `linkedTableName` (Agendapunkter länkar Eventinnehåll;
   * Eventplanering länkar Platser). En ADD_FIELDS-operation mot en tabell som
   * inte finns är ett guard-fel, inte en implicit CREATE — Eventplanering/
   * Bilagor FÖRVÄNTAS redan existera.
   */
  operations: [
    {
      kind: 'createTable',
      name: 'Platser',
      description:
        'ADR-125 §2 (TASK-309.2). En rad per plats (ORDLISTA § Plats) — de ' +
        'uppgifter som hör till PLATSEN snarare än till ett enskilt ' +
        'eventtillfälle: adress, parkering, transport, kläder. Rönninge ' +
        'seedas (Roger & Lottas hem, stabila värden). Skapad additivt av ' +
        'scripts/create-eventinnehall-modell.mjs — redigera INTE fälten via ' +
        'konsolen, redigera skriptet och kör om det.',
      // Verifierat live 2026-08-23: tbl7ER0wNqAZ9ZhEq.
      fields: [
        {
          name: 'Namn',
          type: 'singleLineText',
          description: 'Platsens namn, t.ex. "Rönninge".',
          options: {},
          // fldSDJcY7cb4dam3Y — primärfält (måste stå FÖRST, se create-bilagor-table.mjs).
        },
        {
          name: 'Adress',
          type: 'singleLineText',
          description: 'Platsens adress, t.ex. "Uttringe Hages väg 17, Rönninge".',
          options: {},
          // fldLWwDxEKaeeC30x
        },
        {
          name: 'Parkering',
          type: 'multilineText',
          description:
            'Parkeringsinformation för platsen (standardvärde för eventets bilagor, ADR-125 beslut 6).',
          options: {},
          // fldOVc9oWsJDSqeuX
        },
        {
          name: 'Transport',
          type: 'multilineText',
          description:
            'Transportinformation för platsen (standardvärde för eventets bilagor, ADR-125 beslut 6).',
          options: {},
          // fldS2ILC5sQ7emsjp
        },
        {
          name: 'Kläder',
          type: 'multilineText',
          description:
            'Klädinformation för platsen (standardvärde för eventets bilagor, ADR-125 beslut 6).',
          options: {},
          // fldfp4P7ywOPxLq4A
        },
      ],
      // Auto-född vid Eventplanering.Plats-skapelsen (ADD_FIELDS-op nedan):
      // "Eventplanering" (fld9B4mEmUFn2Bc4b) — samma oundvikliga spegel-
      // mekanik som Bilagor↔Eventplanering (create-bilagor-table.mjs § Event).
    },
    {
      kind: 'createTable',
      name: 'Eventinnehåll',
      description:
        'ADR-125 §2 (TASK-309.2). En rad per kombination av Event × Typ ' +
        '(ORDLISTA § Eventinnehåll) — standardtexterna som fyller bilagorna ' +
        'om eventet inte skrivit över dem. Sju kombinationer (mätt läs-only ' +
        'mot prod 2026-08-23, bekräftar ADR-125/ORDLISTA:s "sju ' +
        'kombinationer i hela beståndet"). PLATTFORMSVÄGG (se filhuvudet): ' +
        'Namn kan INTE vara en live-formel OCH primärfält samtidigt — Namn ' +
        'är därför singleLineText, populerad med "{Event} · {Typ}" av ' +
        'seed-/skrivvägen, inte en levande formel. Skapad additivt av ' +
        'scripts/create-eventinnehall-modell.mjs — redigera INTE fälten via ' +
        'konsolen, redigera skriptet och kör om det.',
      // Verifierat live 2026-08-23: tblwqaBrkm6hJPITd.
      fields: [
        {
          name: 'Namn',
          type: 'singleLineText',
          description:
            '"{Event} · {Typ}", satt av seed-/skrivvägen vid radskapelse ' +
            '(INTE en Airtable-formel — se tabellens beskrivning för ' +
            'plattformsväggen). Primärfält.',
          options: {},
          // fldRE8x232epAbotc — primärfält.
        },
        {
          name: 'Event',
          type: 'singleSelect',
          description:
            'Samma val som Eventplanering.Event (source) (fldd…, ' +
            'data-model.md). Del av uppslagsnyckeln Event×Typ.',
          options: { choices: EVENT_SOURCE_CHOICES.map((name) => ({ name })) },
          // fld7tHYHQEmaTsDGC — egna option-ID:n, se data-model.md.
        },
        {
          name: 'Typ',
          type: 'singleSelect',
          description: 'Samma val som Eventplanering.Typ. Del av uppslagsnyckeln Event×Typ.',
          options: { choices: TYP_CHOICES.map((name) => ({ name })) },
          // fldR2sF3H5sbVCwdU
        },
        {
          name: 'Tid',
          type: 'singleLineText',
          description:
            'Standardtid, t.ex. "kl. 10:00 - 17:00". Kopieras till ' +
            'Eventplanering.Tid (bilagetext) om eventet skriver över.',
          options: {},
          // fldJyBRVQ6lhVFAcj
        },
        {
          name: 'Pris',
          type: 'singleLineText',
          description: 'Standardpris, verbatim text (t.ex. "2.500").',
          options: {},
          // fldaNE6ZU42lVNyrS
        },
        {
          name: 'Anmälningsavgift',
          type: 'singleLineText',
          description: 'Standard anmälningsavgift, verbatim text (t.ex. "1000:-").',
          options: {},
          // fldih0ePhJqD8raEa
        },
        {
          name: 'Resterande belopp',
          type: 'singleLineText',
          description:
            'Standard resterande belopp, verbatim text (ADR-125 § 2 — explicit ' +
            'singleLineText, ej beräknat).',
          options: {},
          // flduP85aMxv8T8J1j
        },
        {
          name: 'Beskrivning',
          type: 'multilineText',
          description: 'Standard utbildningsbeskrivning (lång löptext, Rogers verbatim-text).',
          options: {},
          // fldo4nvKt0k2UEbdX
        },
        {
          name: 'Förberedelser',
          type: 'multilineText',
          description: 'Standardtext om förberedelser inför eventet.',
          options: {},
          // fldMCifxBTnQRtoSd
        },
        {
          name: 'Tag med',
          type: 'multilineText',
          description: 'Standardtext om vad deltagaren ska ta med.',
          options: {},
          // fldAgCE6LKwnqVu7A
        },
        {
          name: 'För dig som röker',
          type: 'multilineText',
          description: 'Standardtext om rökning på plats.',
          options: {},
          // fldvOyLPbu9WBUHyl
        },
        {
          name: 'Parfym och kosmetika',
          type: 'multilineText',
          description: 'Standardtext om parfym/kosmetika.',
          options: {},
          // fldGoTDzZiO1v1ncA
        },
        {
          name: 'Mat/fika',
          type: 'multilineText',
          description: 'Standardtext om mat och fika.',
          options: {},
          // fldmoVQmnHDyJT9Nk
        },
        {
          name: 'Övernattning',
          type: 'multilineText',
          description: 'Standardtext om övernattning.',
          options: {},
          // fldkLoZt63jaTnTqE
        },
        {
          name: 'Utrustning',
          type: 'multilineText',
          description: 'Standardtext om utrustning (ADR-125 § 2 — explicit multilineText).',
          options: {},
          // fldb0RQRdpINzlV2w
        },
      ],
      // Auto-född vid Agendapunkter.Eventinnehåll-skapelsen: "Agendapunkter"
      // (fldgiX7Tzhu1yPuBY) — se Agendapunkter-operationen nedan.
    },
    {
      kind: 'createTable',
      name: 'Agendapunkter',
      description:
        'ADR-125 §2 (TASK-309.2). En rad per agendapunkt; hör till EXAKT EN ' +
        'av Eventinnehåll (standard-agendan) eller Eventplanering (eventets ' +
        'egen kopia) — invarianten vaktas av skrivvägen (TASK-309.3), inte ' +
        'av basen. Skapad additivt av scripts/create-eventinnehall-modell.mjs ' +
        '— redigera INTE fälten via konsolen, redigera skriptet och kör om det.',
      // Verifierat live 2026-08-23: tblgEItD0UM1oJVI9.
      fields: [
        {
          name: 'Text',
          type: 'singleLineText',
          description: 'Agendapunktens text, t.ex. "Additiv Meditation".',
          options: {},
          // fldTxLMMDARMnOdR8 — primärfält.
        },
        {
          name: 'Dag',
          type: 'number',
          description: '1 eller 2 — vilken dag agendapunkten hör till.',
          options: { precision: 0 },
          // fldn9vWItzUDlKnwz
        },
        {
          name: 'Ordning',
          type: 'number',
          description: 'Sorteringsordning inom dagen.',
          options: { precision: 0 },
          // fldHvSoPN7CHbcGtQ
        },
        {
          name: 'Tid',
          type: 'singleLineText',
          description: 'Valfri tidsangivelse för punkten, t.ex. "30 min".',
          options: {},
          // fldR05lpsymw7ZFMS
        },
        {
          name: 'Meditation',
          type: 'checkbox',
          description: 'Sant om punkten är en meditation.',
          options: { color: 'greenBright', icon: 'check' },
          // fldisTbc8lvtBDxK4
        },
        {
          name: 'Eventinnehåll',
          type: 'multipleRecordLinks',
          description:
            'Länk till standardagendans Eventinnehåll-rad. Tom om punkten är ' +
            'eventets egen kopia (länkad via fältet Event i stället).',
          linkedTableName: 'Eventinnehåll',
          // fldRdpSQuTXBKw9Fh — inverse (auto-född på Eventinnehåll): fldgiX7Tzhu1yPuBY.
        },
        {
          name: 'Event',
          type: 'multipleRecordLinks',
          description:
            'Länk till eventets egen kopia av agendan (Eventplanering). Tom ' +
            'om punkten hör till standardagendan (länkad via fältet ' +
            'Eventinnehåll i stället).',
          linkedTableName: 'Eventplanering',
          // fld4BWQpUtqBwMJBH — inverse (auto-född på Eventplanering): fldHGLB2wAmbTFSqC.
        },
      ],
    },
    {
      kind: 'addFields',
      name: 'Eventplanering',
      // Verifierat live 2026-08-23 — samtliga 18 fält skapade på tblVE3UKWl1CKrphV.
      fields: [
        {
          name: 'Plats',
          type: 'multipleRecordLinks',
          description:
            'Länk till eventets Plats (Platser-tabellen, ADR-125 §2). Tomt ' +
            'fält = ingen plats angiven; eventets (bilagetext)-fält gäller ' +
            'ändå, plats-källade block (adress/parkering/transport/kläder) ' +
            'saknar då en standard att falla tillbaka på.',
          linkedTableName: 'Platser',
          // fld8OmPGNgEYZ8eER — inverse (auto-född på Platser): fld9B4mEmUFn2Bc4b.
        },
        ...[
          ['Tid', 'singleLineText', 'fldewV6lrmPgciA1B'],
          ['Pris', 'singleLineText', 'fld6SoKgMvTsgicDm'],
          ['Anmälningsavgift', 'singleLineText', 'fld2DSzLOcXn1REBK'],
          ['Resterande belopp', 'singleLineText', 'fldIGx40AnUbtZwCH'],
          ['Beskrivning', 'multilineText', 'fldHELN1vXMYPxDZQ'],
          ['Förberedelser', 'multilineText', 'fldKJq4sWYsdOc4gL'],
          ['Tag med', 'multilineText', 'fld2z51nPJ7b0RCuy'],
          ['För dig som röker', 'multilineText', 'fldBuoSeNeKwirZUP'],
          ['Parfym och kosmetika', 'multilineText', 'fld1uszm3tRVqVo25'],
          ['Mat/fika', 'multilineText', 'fldLGEFJ5V5LSySco'],
          ['Övernattning', 'multilineText', 'flde6KJWelaTW0nDN'],
          ['Utrustning', 'multilineText', 'fldmvZ8eYs8VOdldI'],
          ['Adress', 'singleLineText', 'fld04gOk8BkHFhCoo'],
          ['Parkering', 'multilineText', 'fld4KRAV0AiedrbtP'],
          ['Transport', 'multilineText', 'fldl7YtvlDac94AFh'],
          ['Kläder', 'multilineText', 'fldSCL2J6r5o9vtOl'],
          // Tredje tupel-elementet (fält-ID:t) är dokumentation för läsaren
          // — samma verifierade ID:n som § "Bilagornas datamodell" i
          // data-model.md — och konsumeras inte av koden.
        ].map(([basNamn, type, _fieldId]) => ({
          name: `${basNamn}${BILAGETEXT_SUFFIX}`,
          type,
          description:
            `Eventets egen kopia av ${basNamn} (ADR-125 §2). Tomt = ` +
            (basNamn === 'Adress' ||
            basNamn === 'Parkering' ||
            basNamn === 'Transport' ||
            basNamn === 'Kläder'
              ? 'Platsens standard gäller.'
              : 'Eventinnehållets standard gäller.'),
          options: {},
        })),
        {
          name: `Sista betalningsdag${BILAGETEXT_SUFFIX}`,
          type: 'date',
          description:
            'Eventets egen sista betalningsdag (ADR-125 §2). Tomt = härledd ' +
            'Startdatum − 14 dagar (samma regel som Anmälningar.Deadline ' +
            'slutbetalning).',
          options: { dateFormat: { name: 'iso', format: 'YYYY-MM-DD' } },
          // fldMJfhRIfbqQ3UKE
        },
      ],
      // Auto-född vid Agendapunkter.Event-skapelsen: "Agendapunkter"
      // (fldHGLB2wAmbTFSqC) — inte i denna lista (skapas inte direkt av
      // detta skript, se Agendapunkter-operationen ovan).
    },
    {
      kind: 'addFields',
      name: 'Bilagor',
      // Verifierat live 2026-08-23 — båda fälten skapade på tblFamrna53MVf1nG.
      fields: [
        {
          name: 'Mall',
          type: 'singleSelect',
          description:
            'Vilken mall bilagan renderades från (ADR-125 §2/§4). Satt av ' +
            'generate-event-attachment vid persisterande generering.',
          options: {
            choices: ['Bekräftelsebilaga', 'Deltagarinformation'].map((name) => ({ name })),
          },
          // fldyaXdITEdqPTy5O
        },
        {
          name: 'Källhash',
          type: 'singleLineText',
          description:
            'SHA-256 över den kanoniskt serialiserade ifyllnadsdatan vid ' +
            'genereringstillfället (ADR-125 §3, härledd inaktualitet). ' +
            'Server-internt — används för att jämföra mot dagens hash vid listning.',
          options: {},
          // fld03lo2OEehq1KlJ
        },
      ],
    },
  ],
};

const AIRTABLE_META_URL = 'https://api.airtable.com/v0/meta/bases';
const BASE_ID_PATTERN = /^app[A-Za-z0-9]{14}$/;

// ---------------------------------------------------------------------------
// Pura funktioner (exporterade för scripts/test-create-eventinnehall-modell.mjs)
// ---------------------------------------------------------------------------

/** Skyddsräcke 1: bas-guarden — samma form som create-bilagor-table.mjs. */
export function validateConfig(config) {
  if (!config || typeof config !== 'object') throw new Error('config: förväntade ett objekt');
  const { expectedBaseId, forbiddenBaseIds, operations } = config;
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
  if (!Array.isArray(operations) || operations.length === 0) {
    throw new Error('operations måste vara en icke-tom lista');
  }
  const seenTables = new Set();
  for (const op of operations) {
    if (op.kind !== 'createTable' && op.kind !== 'addFields') {
      throw new Error(`operations: okänt kind "${op.kind}"`);
    }
    if (typeof op.name !== 'string' || op.name.trim().length === 0) {
      throw new Error('varje operation måste ha ett name');
    }
    if (op.kind === 'createTable' && seenTables.has(op.name)) {
      throw new Error(`dubblett createTable-operation för "${op.name}"`);
    }
    if (op.kind === 'createTable') seenTables.add(op.name);
    if (!Array.isArray(op.fields) || op.fields.length === 0) {
      throw new Error(`operations["${op.name}"].fields måste vara en icke-tom lista`);
    }
    const namn = new Set();
    for (const f of op.fields) {
      if (typeof f?.name !== 'string' || f.name.trim().length === 0) {
        throw new Error(`operations["${op.name}"]: varje fält måste ha ett name`);
      }
      if (namn.has(f.name)) {
        throw new Error(`dubblettfält i operations["${op.name}"]: "${f.name}"`);
      }
      namn.add(f.name);
      if (typeof f?.type !== 'string' || f.type.trim().length === 0) {
        throw new Error(`operations["${op.name}"].fields["${f.name}"].type saknas`);
      }
      if (f.linkedTableName !== undefined && typeof f.linkedTableName !== 'string') {
        throw new Error(`operations["${op.name}"].fields["${f.name}"].linkedTableName ogiltig`);
      }
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
 * Klassa önskad fältuppsättning mot en befintlig tabells fält — SAMMA
 * mismatch-hårda guard som create-bilagor-table.mjs § planFields. En
 * auto-född spegel-fält (t.ex. Eventplanering.Agendapunkter) som INTE finns
 * i `expectedFields` klassas aldrig — mismatch-kontrollen är envägs
 * (förväntat → befintligt), aldrig tvärtom.
 */
export function planFields(existingTable, expectedFields, resolveLinkedTableId) {
  const existingByName = new Map((existingTable?.fields ?? []).map((f) => [f.name, f]));
  const toCreate = [];
  const mismatches = [];
  for (const expected of expectedFields) {
    const existing = existingByName.get(expected.name);
    if (!existing) {
      toCreate.push(expected);
      continue;
    }
    if (existing.type !== expected.type) {
      mismatches.push({
        name: expected.name,
        expectedType: expected.type,
        actualType: existing.type,
      });
      continue;
    }
    if (expected.linkedTableName) {
      const expectedLinkedId = resolveLinkedTableId(expected.linkedTableName);
      const actualLinkedId = existing.options?.linkedTableId;
      if (expectedLinkedId && actualLinkedId && expectedLinkedId !== actualLinkedId) {
        mismatches.push({
          name: expected.name,
          expectedType: `linkedTableId=${expectedLinkedId}`,
          actualType: `linkedTableId=${actualLinkedId}`,
        });
      }
    }
  }
  return { toCreate, mismatches };
}

/** Fältets API-payload. `options` UTELÄMNAS helt när tom (samma 422-fälla
 *  som create-bilagor-table.mjs § toApiFieldPayload dokumenterar). Löser
 *  `linkedTableName` → `options.linkedTableId` via resolvern precis före
 *  sändning (sent-bunden, eftersom syskontabeller kan skapas TIDIGARE i
 *  SAMMA körning). */
function toApiFieldPayload(
  { name, type, description, options, linkedTableName },
  resolveLinkedTableId,
) {
  const resolvedOptions = linkedTableName
    ? { linkedTableId: resolveLinkedTableId(linkedTableName) }
    : options;
  const harOptions =
    resolvedOptions &&
    typeof resolvedOptions === 'object' &&
    Object.keys(resolvedOptions).length > 0;
  return { name, type, description, ...(harOptions ? { options: resolvedOptions } : {}) };
}

export function buildCreateTableBody(op, resolveLinkedTableId) {
  return {
    name: op.name,
    description: op.description,
    fields: op.fields.map((f) => toApiFieldPayload(f, resolveLinkedTableId)),
  };
}

export function buildCreateFieldBody(field, resolveLinkedTableId) {
  return toApiFieldPayload(field, resolveLinkedTableId);
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
        'se filhuvudets motivering. (TASK-309.2: modellen är REDAN skapad live via ' +
        'Airtable MCP — denna körning är avsedd att vara en NO-OP-verifiering när ' +
        'token finns, se filhuvudets § "Skarpt kört redan".)',
    );
    process.exit(1);
  }

  kravStagingLedigt('lokal schema:eventinnehall');

  // tableIdByName threadas genom hela körningen: startar med redan kända
  // tabeller (Eventplanering/Bilagor MÅSTE redan existera — se
  // validateConfig-kommentaren om addFields), fylls på när varje createTable-
  // operation lyckas (eller hittar en befintlig tabell).
  const tableIdByName = new Map();

  try {
    console.log(`🔍 Läser schema för ${CONFIG.expectedBaseId} …`);
    const tables = await getBaseSchema(CONFIG.expectedBaseId, token, CONFIG.requestThrottleMs);
    for (const t of tables) tableIdByName.set(t.name, t.id);

    const resolveLinkedTableId = (name) => {
      const id = tableIdByName.get(name);
      if (!id)
        throw new GuardError(`länkad tabell "${name}" hittades inte (ordningsfel i operations?)`);
      return id;
    };

    let anyChange = false;

    for (const op of CONFIG.operations) {
      const existingTable = findTableByName(tables, op.name) ?? {
        id: tableIdByName.get(op.name),
        fields: [],
      };
      const tableExists = tableIdByName.has(op.name);

      if (op.kind === 'addFields' && !tableExists) {
        throw new GuardError(
          `addFields riktad mot "${op.name}" som inte finns — den tabellen förväntas ` +
            'existera SEDAN TIDIGARE (Eventplanering/Bilagor), inte skapas av detta skript',
        );
      }

      if (op.kind === 'createTable' && tableExists) {
        // Tabellen finns redan — behandla som addFields (idempotent-vägen).
        const liveTable = tables.find((t) => t.id === tableIdByName.get(op.name));
        const plan = planFields(liveTable, op.fields, resolveLinkedTableId);
        if (plan.mismatches.length > 0) {
          const beskrivning = plan.mismatches
            .map((m) => `"${m.name}": förväntade "${m.expectedType}", fann "${m.actualType}"`)
            .join('; ');
          throw new GuardError(
            `schema-missmatch mot befintlig tabell "${op.name}" — rör INGET: ${beskrivning}`,
          );
        }
        if (plan.toCreate.length === 0) {
          console.log(
            `✅ Tabellen "${op.name}" (${liveTable.id}) finns redan med alla förväntade fält — inget att göra.`,
          );
          continue;
        }
        if (args.dryRun) {
          console.log(
            `📝 DRY-RUN: tabellen "${op.name}" finns, skulle LÄGGA TILL: ${plan.toCreate.map((f) => f.name).join(', ')}`,
          );
          anyChange = true;
          continue;
        }
        for (const field of plan.toCreate) {
          const body = buildCreateFieldBody(field, resolveLinkedTableId);
          const created = await createField(
            CONFIG.expectedBaseId,
            liveTable.id,
            body,
            token,
            CONFIG.requestThrottleMs,
          );
          console.log(`   • ${created.name} (${created.type}) — ${created.id}`);
        }
        anyChange = true;
        continue;
      }

      if (op.kind === 'createTable') {
        const body = buildCreateTableBody(op, resolveLinkedTableId);
        if (args.dryRun) {
          console.log(
            `📝 DRY-RUN: skulle SKAPA tabellen "${op.name}" med fälten: ${body.fields.map((f) => f.name).join(', ')}`,
          );
          // Dry-run kan inte threada ett riktigt ID vidare — efterföljande
          // operationer som länkar hit rapporteras separat i dry-run-läget.
          anyChange = true;
          continue;
        }
        console.log(`🛠️  Skapar tabellen "${op.name}" med ${body.fields.length} fält …`);
        const created = await createTable(
          CONFIG.expectedBaseId,
          body,
          token,
          CONFIG.requestThrottleMs,
        );
        tableIdByName.set(op.name, created.id);
        console.log(`✅ Tabell skapad: ${created.id} ("${created.name}")`);
        for (const f of created.fields ?? []) console.log(`   • ${f.name} (${f.type}) — ${f.id}`);
        anyChange = true;
        continue;
      }

      // op.kind === 'addFields', tabellen finns.
      const liveTable = tables.find((t) => t.id === tableIdByName.get(op.name)) ?? existingTable;
      const plan = planFields(liveTable, op.fields, resolveLinkedTableId);
      if (plan.mismatches.length > 0) {
        const beskrivning = plan.mismatches
          .map((m) => `"${m.name}": förväntade "${m.expectedType}", fann "${m.actualType}"`)
          .join('; ');
        throw new GuardError(
          `schema-missmatch mot befintlig tabell "${op.name}" — rör INGET: ${beskrivning}`,
        );
      }
      if (plan.toCreate.length === 0) {
        console.log(
          `✅ Tabellen "${op.name}" (${liveTable.id}) bär redan alla förväntade fält — inget att göra.`,
        );
        continue;
      }
      if (args.dryRun) {
        console.log(
          `📝 DRY-RUN: tabellen "${op.name}" (${liveTable.id}), skulle LÄGGA TILL: ${plan.toCreate.map((f) => f.name).join(', ')}`,
        );
        anyChange = true;
        continue;
      }
      console.log(
        `🛠️  Tabellen "${op.name}" (${liveTable.id}), lägger till ${plan.toCreate.length} saknade fält …`,
      );
      for (const field of plan.toCreate) {
        const body = buildCreateFieldBody(field, resolveLinkedTableId);
        const created = await createField(
          CONFIG.expectedBaseId,
          liveTable.id,
          body,
          token,
          CONFIG.requestThrottleMs,
        );
        console.log(`   • ${created.name} (${created.type}) — ${created.id}`);
      }
      anyChange = true;
    }

    console.log(anyChange ? '✅ Klart.' : '✅ Allt redan i synk — no-op.');
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
