#!/usr/bin/env node
// scripts/seed-eventinnehall-modell.mjs — seedar de PERMANENTA
// standardraderna för bilage-datamodellen i staging (TASK-309.2 AC #2,
// ADR-125 § 2): Platser = Rönninge (verbatim ur förlagorna), Eventinnehåll =
// de sju Event×Typ-kombinationerna (mätt läs-only mot prod 2026-08-23 — se
// docs/reference/data-model.md § "Bilagornas datamodell"), varav "Resor i
// medvetandet 1 × Utbildning" fylls verbatim ur prototypens EVENTINNEHALL-
// konstant (src/components/dokument/prototyp/GenereringsPrototyp.tsx) inkl.
// dess agenda som Agendapunkter-rader.
//
// SKILD TOKEN FRÅN SCHEMA-SKRIPTET (ADR-060 punkt 4, samma separationsprincip
// som create-bilagor-table.mjs): detta skript skriver RECORDS, inte schema —
// STAGING_AIRTABLE_TOKEN (data.records:read+write), INTE
// AIRTABLE_SCHEMA_TOKEN. Kör EFTER schema-skriptet (eller den live MCP-
// skapelsen dokumenterad i create-eventinnehall-modell.mjs § filhuvud) —
// tabellerna/fälten måste redan finnas.
//
// PERMANENTA RADER, INTE TESTFIXTURER: samma klass som Rönninge-adressen och
// de sju kombinationerna är avsedda att vara — de matchar INGEN purge-target
// (.purge-staging-policy.json), och detta skript bär därför INGET
// --clean-läge (jämför seed-review-fixture.mjs:s :clean-variant, som finns
// för att DEN skriptets fixtur ÄR transient granskningsdata). Att radera
// dessa rader för hand görs via Airtable-konsolen om det någonsin behövs —
// inte via detta skript.
//
// IDEMPOTENT: läser befintliga Platser-/Eventinnehåll-rader (by Namn) INNAN
// skrivning — en omkörning skapar inga dubbletter. Agendapunkter-raderna för
// "Resor i medvetandet 1 × Utbildning" skapas bara om Eventinnehåll-raden
// SJÄLV precis skapades (annars antas de redan finnas — samma "skapelsen är
// atomär för den raden" logik som create-bilagor-table.mjs:s tabell/fält-par).
//
// Kör:
//   npm run seed:eventinnehall -- --dry-run   # planera, skriv inget
//   npm run seed:eventinnehall                # skapa (idempotent)
//
// PROD-KÖRNINGEN (TASK-309.9, ADR-125 § 8) — samma MEDVETNA prod-väg som
// create-eventinnehall-modell.mjs: basen anges som ARGUMENT (`--bas
// <baseId>`), aldrig ur config. Utan `--bas` seedas staging precis som
// tidigare. `--bas <baseId>` som SKILJER SIG från staging kräver DESSUTOM
// miljövariabeln AIRTABLE_PROD_GODKAND_AV_MARCUS satt till EXAKT samma
// bas-ID — annars VÄGRAR skriptet (resolveTargetBaseId, delad logik/samma
// form som schema-skriptet). Token: STAGING_AIRTABLE_TOKEN är scopad ENDAST
// till staging (.env.seed.example) — en prod-körning kräver att Marcus
// sätter en prod-scopad PAT inline på kommandoraden. Staging-mutexen
// (kravStagingLedigt) hoppas över vid en prod-körning — den bevakar
// staging-kontention, inte prod.
//
// Exit: 0 = OK (inkl. "redan seedat, inget att göra"), 1 = guard-/config-fel,
// 2 = Airtable-API-fel.

import { pathToFileURL } from 'node:url';
import { kravStagingLedigt } from './lib/staging-preflight.mjs';

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------

export const CONFIG = {
  expectedBaseId: 'apphjj8Q7lkXCMsL4',
  forbiddenBaseIds: ['app8uGPrVCVOm6LfD'],
  requestThrottleMs: 250,
  tables: {
    platser: 'Platser',
    eventinnehall: 'Eventinnehåll',
    agendapunkter: 'Agendapunkter',
  },
};

/**
 * Platser-seedet — Rönninge, verbatim ur PLATSER_SEED
 * (GenereringsPrototyp.tsx rad 188–199).
 */
export const PLATSER_SEED = [
  {
    Namn: 'Rönninge',
    Adress: 'Uttringe Hages väg 17, Rönninge',
    Parkering:
      'Vi har 15 parkeringsplatser om vi dubbelparkerar. Om dessa är fulla så finns det plats att parkera på andra platser i området, det kostar inget, men du kanske får promenera några minuter.',
    Transport:
      'Vi kan hämta och lämna dig på Rönninge Station, boka detta med lotta@outsidereality.se',
    Kläder:
      'Under utbildningen mediterar vi en hel del, så välj några sköna mjukiskläder. Lätta skor eller tofflor är praktiskt att ha med när man går mellan husen. Ta gärna med skor för promenad och lämpliga ytterkläder. Det kan vara så att vi behöver jorda oss mellan meditationerna.',
  },
];

/**
 * De SJU Event×Typ-kombinationerna — mätt READ-ONLY mot prod
 * (app8uGPrVCVOm6LfD, tblVE3UKWl1CKrphV) 2026-08-23 (TASK-309.2
 * premiss-pass): 57 Eventplanering-rader, distinkta (Event (source), Typ)-par.
 * Bekräftar ADR-125 §2 / ORDLISTA.md § Eventinnehåll: "sju kombinationer i
 * hela beståndet" (tidigare bara känt som ett TAL, ingen lista fanns i något
 * repo-dokument — se skivans slutrapport § Premiss-pass).
 */
export const SJU_KOMBINATIONER = [
  { Event: 'Fjärrskådning', Typ: 'Utbildning' },
  { Event: 'Fjärrskådning', Typ: 'Föreläsning' },
  { Event: 'Resor i medvetandet', Typ: 'Föreläsning' },
  { Event: 'Resor i medvetandet 1', Typ: 'Utbildning' },
  { Event: 'Resor i medvetandet 2', Typ: 'Utbildning' },
  { Event: 'Resor i medvetandet 3', Typ: 'Utbildning' },
  { Event: 'Psionautics', Typ: 'Utbildning' },
];

/** Vilken av de sju som fylls verbatim (ADR-125 §2, AC #2). */
const FYLLD_KOMBINATION = { Event: 'Resor i medvetandet 1', Typ: 'Utbildning' };

/**
 * Standardtexterna för "Resor i medvetandet 1 × Utbildning" — verbatim ur
 * EVENTINNEHALL-konstanten, GenereringsPrototyp.tsx rad 131–183.
 */
export const FYLLD_EVENTINNEHALL_FALT = {
  Tid: 'kl. 10:00 - 17:00',
  Pris: '2.500',
  Anmälningsavgift: '1000:-',
  'Resterande belopp': '1500:-',
  Beskrivning:
    'Utbildningen Resor i Medvetandet kommer att ge dig en djupare insikt om medvetandet, både genom att teoretiskt förklara vad vi är och att praktiskt öva i extremt djupa meditationer. Vi går igenom helt nya medvetandemodeller som faktiskt kan förklara det som tidigare kallats för övernaturligt och paranormalt. I denna utbildning får du själv ta de första stegen på din resa i vårt gemensamma medvetande. Medvetandet är det centrala och du kommer både få göra praktiska övningar tillsammans med massor med konkreta tips, samtidigt som vi förklarar de djupare insikter som ligger bakom våra upplevelser i våra liv.\n\nDu behöver inga förberedande kunskaper eller erfarenheter, men du måste komma med ett mycket öppet sinne. I utbildningen har vi lagt ett starkt fokus på din egen upplevelse och din egen personliga resa i medvetandet. Boken Utanför Verkligheten ligger till grund för nya sätt att se på verkligheten genom att öppna upp ditt sinne för en helt ny värld och verklighet.\n\nDu kommer även att få lära dig om Additiv meditation, en meditationsteknik, som gör det möjligt att ta sig extremt djupt i medvetandet. Med en kombination av tusenårig kunskap och modern teknik kan man uppnå mentala tillstånd som helt klart bryter mot vad vi tror är begränsningar i verkligheten. Vi arbetar med mentala ankare och planerar intentioner. Du får tillfälle att fråga om precis vad som helst, exempelvis om synkronicitet, Akashi arkivet, reinkarnationsprocessen, eller om dina guider. Du kommer att i detalj få reda på hur du planerar och utför dina resor med hjälp av extrem meditation och en välfylld mental verktygslåda. Vi berättar om varför Punktmedvetandet är så viktigt för att uppnå högre mentala tillstånd. Du kommer att få en inblick varifrån kreativitet, inspiration och ökade mentala förmågor kommer.',
  Förberedelser:
    'Kom som du är! Ta en lugn hemmakväll dagen före utbildningen, men ändra absolut inte på dina mediciner eller vanor. Sluta inte med nikotin eller kaffe strax före utbildningen. Förändringar påverkar din mentala kapacitet negativt. Däremot skall du inte dricka alkohol alls några dagar före. Naturligtvis tillåter vi inte användandet av droger. Förbered dig gärna genom att läsa boken och lyssna på meditationerna Eken & Kraftfältet som finns på Spotify.',
  'Tag med':
    'Kudde, filt, ögonmask (förtejpade skidglasögon, så du kan öppna ögonen under masken). Vi har madrasser till alla deltagare. Vi mediterar upp till 45 minuter, så det är bra om du kan ligga bekvämt. Tag med ett anteckningsblock, penna och vattenflaska.',
  'För dig som röker':
    'Hela området är rökfritt, med hänsyn till alla andra. Du kommer att få tid att ta en promenad under pauserna.',
  'Parfym och kosmetika':
    'Under meditationerna ägnar vi oss åt sensorisk deprivation, dvs. minimerar sinnesintryck. Var snäll och använd INTE parfym, parfymerade krämer, eller något som luktar starkt.',
  'Mat/fika':
    'Mat ingår inte, men vi kommer att arrangera hämtmat, och det går bra att ta med matlåda. Vi bjuder på fika.',
  Övernattning: 'Ingår inte, maila lotta@outsidereality.se om du vill ha tips på boende.',
  Utrustning:
    'Under utbildningen gör vi meditationer med hörlurar, vi har utrustning till alla. Du får använda egna hörlurar om du vill, men de måste då ha en sladd med 3,5 mm anslutning.',
};

/** Dag 1-agendan — verbatim, GenereringsPrototyp.tsx rad 143–158. */
export const FYLLD_AGENDA_DAG1 = [
  { text: 'Miranon Media', tid: '', meditation: false },
  { text: 'Miranon-Nivåer (lite om)', tid: '', meditation: false },
  { text: 'Additiv Meditation', tid: '', meditation: false },
  { text: 'Meditation: Eken Plus Djup avslappning', tid: '30 min', meditation: true },
  { text: 'Mentala hinder', tid: '', meditation: false },
  { text: 'Filosofi: materialism/idealism', tid: '', meditation: false },
  { text: 'Medvetandemodeller', tid: '', meditation: false },
  { text: 'Kvantfysik', tid: '', meditation: false },
  { text: 'Synkronicitet, fjärrskådning', tid: '', meditation: false },
  { text: 'Meditation: Fåtöljen', tid: '5 min', meditation: true },
  { text: 'Meditation: Kraftfältet Plus', tid: '30 min', meditation: true },
  { text: 'Upplevelser utanför kroppen', tid: '', meditation: false },
  { text: 'Utmaningar utanför kroppen', tid: '', meditation: false },
  { text: 'Meditation: Uthuset', tid: '45 min', meditation: true },
];

/** Dag 2-agendan — verbatim, GenereringsPrototyp.tsx rad 159–170. */
export const FYLLD_AGENDA_DAG2 = [
  { text: 'Meditation Fyren', tid: '40 min', meditation: true },
  { text: 'Intention - Föreställning - Skapande', tid: '', meditation: false },
  { text: 'Meditation & fokus', tid: '', meditation: false },
  { text: 'Klicka ut eller sömn', tid: '', meditation: false },
  { text: 'Punktmedvetande', tid: '', meditation: false },
  { text: 'Mentala Ankare / Grundning/Jordning', tid: '', meditation: false },
  { text: 'Meditation Klockan', tid: '40 min', meditation: true },
  { text: 'Ljud & Frekvenser, EEG', tid: '', meditation: false },
  { text: 'Tankeövning', tid: '5 min', meditation: false },
  { text: 'Var observatören', tid: '', meditation: false },
];

/** Namn-strängen (icke-levande — se create-eventinnehall-modell.mjs § plattformsväggen). */
export function eventinnehallNamn({ Event, Typ }) {
  return `${Event} · ${Typ}`;
}

// ---------------------------------------------------------------------------
// Pura funktioner (planering — testbara utan nätverk)
// ---------------------------------------------------------------------------

const BASE_ID_PATTERN = /^app[A-Za-z0-9]{14}$/;

export function validateConfig(config) {
  if (!config || typeof config !== 'object') throw new Error('config: förväntade ett objekt');
  const { expectedBaseId, forbiddenBaseIds } = config;
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
  return config;
}

/** Miljövariabeln som bär Marcus GO i klartext för en icke-staging-körning
 *  (TASK-309.9, ADR-125 § 8) — samma variabel/logik som
 *  create-eventinnehall-modell.mjs. Duplicerad MEDVETET, inte importerad:
 *  samma "fristående Node-skript utan byggkedja"-princip som
 *  scripts/provision-attachments-bucket.mjs § MILJÖ redan etablerar för
 *  STAGING_PROJECT_REF/PROD_PROJECT_REF. */
export const PROD_GODKAND_ENV_VAR = 'AIRTABLE_PROD_GODKAND_AV_MARCUS';

/** --dry-run: planera, skriv inget. --bas <baseId>: rikta körningen mot en
 *  annan bas än staging (TASK-309.9) — anges explicit, aldrig ur config. */
export function parseArgs(argv) {
  const basIndex = argv.indexOf('--bas');
  const bas = basIndex === -1 ? undefined : argv[basIndex + 1];
  return { dryRun: argv.includes('--dry-run'), bas };
}

/** Se create-eventinnehall-modell.mjs för fullt resonemang — identisk logik. */
export function resolveTargetBaseId({ bas, stagingBaseId, godkandEnv }) {
  if (bas === undefined || bas === stagingBaseId) {
    return stagingBaseId;
  }
  if (godkandEnv !== bas) {
    throw new Error(
      `VÄGRAR: basen "${bas}" skiljer sig från staging ("${stagingBaseId}"). Skrivning mot en ` +
        `icke-staging-bas kräver miljövariabeln ${PROD_GODKAND_ENV_VAR}=<baseId> satt till EXAKT ` +
        `samma bas-ID på kommandoraden — Marcus GO i klartext (ADR-125 § 8). Satt värde: ` +
        `${godkandEnv === undefined ? '(saknas)' : `"${godkandEnv}"`}.`,
    );
  }
  return bas;
}

/** Planera Platser-seedet mot befintliga rader (by Namn). */
export function planPlatser(existingRecords) {
  const existingNames = new Set(existingRecords.map((r) => r.fields?.Namn));
  return PLATSER_SEED.filter((p) => !existingNames.has(p.Namn));
}

/** Planera Eventinnehåll-seedet mot befintliga rader (by Namn — den
 *  icke-levande identitetssträngen, se eventinnehallNamn). */
export function planEventinnehall(existingRecords) {
  const existingNames = new Set(existingRecords.map((r) => r.fields?.Namn));
  return SJU_KOMBINATIONER.filter((k) => !existingNames.has(eventinnehallNamn(k)));
}

/** Bygg Eventinnehåll-radens fält (Namn+Event+Typ, plus de fyllda block-fälten
 *  om kombinationen är FYLLD_KOMBINATION). */
export function buildEventinnehallFields(kombination) {
  const base = {
    Namn: eventinnehallNamn(kombination),
    Event: kombination.Event,
    Typ: kombination.Typ,
  };
  const arFylld =
    kombination.Event === FYLLD_KOMBINATION.Event && kombination.Typ === FYLLD_KOMBINATION.Typ;
  return arFylld ? { ...base, ...FYLLD_EVENTINNEHALL_FALT } : base;
}

/** Bygg Agendapunkter-radernas fält för en Eventinnehåll-record-ID. */
export function buildAgendapunkterFields(eventinnehallRecordId) {
  const rader = [];
  FYLLD_AGENDA_DAG1.forEach((rad, i) => {
    rader.push({
      Text: rad.text,
      Dag: 1,
      Ordning: i + 1,
      Tid: rad.tid,
      Meditation: rad.meditation,
      Eventinnehåll: [eventinnehallRecordId],
    });
  });
  FYLLD_AGENDA_DAG2.forEach((rad, i) => {
    rader.push({
      Text: rad.text,
      Dag: 2,
      Ordning: i + 1,
      Tid: rad.tid,
      Meditation: rad.meditation,
      Eventinnehåll: [eventinnehallRecordId],
    });
  });
  return rader;
}

// ---------------------------------------------------------------------------
// Airtable-API
// ---------------------------------------------------------------------------

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

async function listAll(baseId, tableName, token, throttleMs) {
  const out = [];
  let offset;
  do {
    const url = new URL(`${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableName)}`);
    if (offset) url.searchParams.set('offset', offset);
    const data = await airtableRequest(url.toString(), token, throttleMs);
    out.push(...data.records);
    offset = data.offset;
  } while (offset);
  return out;
}

async function createRecords(baseId, tableName, fieldsList, token, throttleMs) {
  const out = [];
  for (let i = 0; i < fieldsList.length; i += 10) {
    const batch = fieldsList.slice(i, i + 10);
    const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableName)}`;
    const data = await airtableRequest(url, token, throttleMs, {
      method: 'POST',
      body: JSON.stringify({ records: batch.map((fields) => ({ fields })) }),
    });
    out.push(...data.records);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  let args;
  let targetBaseId;
  try {
    validateConfig(CONFIG);
    args = parseArgs(process.argv.slice(2));
    targetBaseId = resolveTargetBaseId({
      bas: args.bas,
      stagingBaseId: CONFIG.expectedBaseId,
      godkandEnv: process.env[PROD_GODKAND_ENV_VAR],
    });
  } catch (err) {
    console.error(`❌ Guard-/konfigurationsfel: ${err.message}`);
    process.exit(1);
  }

  const korMotProd = targetBaseId !== CONFIG.expectedBaseId;

  const token = process.env.STAGING_AIRTABLE_TOKEN;
  if (!token) {
    console.error(
      '❌ STAGING_AIRTABLE_TOKEN saknas i env. Lokalt: .env.seed (gitignorad; se ' +
        `.env.seed.example).${
          korMotProd
            ? ' En prod-körning kräver en prod-scopad PAT satt inline på kommandoraden, ' +
              'aldrig i .env.seed (se docs/reference/atkomst-och-nycklar.md § ' +
              '"Prod-deploy av bilagespåret").'
            : ''
        }`,
    );
    process.exit(1);
  }

  // Staging-mutexen bevakar staging-kontention — irrelevant för en prod-körning.
  if (!korMotProd) {
    kravStagingLedigt('lokal seed:eventinnehall');
  }

  try {
    console.log(
      `🔍 Läser befintliga Platser/Eventinnehåll-rader ur ${targetBaseId}${korMotProd ? ' (PROD)' : ''} …`,
    );
    const [existingPlatser, existingEventinnehall] = await Promise.all([
      listAll(targetBaseId, CONFIG.tables.platser, token, CONFIG.requestThrottleMs),
      listAll(targetBaseId, CONFIG.tables.eventinnehall, token, CONFIG.requestThrottleMs),
    ]);

    const platserToCreate = planPlatser(existingPlatser);
    const eventinnehallToCreate = planEventinnehall(existingEventinnehall);

    if (platserToCreate.length === 0 && eventinnehallToCreate.length === 0) {
      console.log(
        '✅ Platser och Eventinnehåll bär redan alla förväntade rader — inget att göra (idempotent).',
      );
      process.exit(0);
    }

    if (args.dryRun) {
      if (platserToCreate.length > 0) {
        console.log(
          `📝 DRY-RUN: skulle SKAPA Platser: ${platserToCreate.map((p) => p.Namn).join(', ')}`,
        );
      }
      if (eventinnehallToCreate.length > 0) {
        console.log(
          `📝 DRY-RUN: skulle SKAPA Eventinnehåll: ${eventinnehallToCreate.map(eventinnehallNamn).join(', ')}`,
        );
        const fylld = eventinnehallToCreate.find(
          (k) => k.Event === FYLLD_KOMBINATION.Event && k.Typ === FYLLD_KOMBINATION.Typ,
        );
        if (fylld) {
          console.log(
            `📝 DRY-RUN: "${eventinnehallNamn(fylld)}" fylls verbatim + ${
              FYLLD_AGENDA_DAG1.length + FYLLD_AGENDA_DAG2.length
            } Agendapunkter-rader`,
          );
        }
      }
      process.exit(0);
    }

    // Klistervänlig sammanfattning i slutet — samma motiv som
    // create-eventinnehall-modell.mjs § SAMMANFATTNING (TASK-309.9).
    const skapadeRader = [];

    if (platserToCreate.length > 0) {
      console.log(`🛠️  Skapar ${platserToCreate.length} Platser-rad(er) …`);
      const created = await createRecords(
        targetBaseId,
        CONFIG.tables.platser,
        platserToCreate,
        token,
        CONFIG.requestThrottleMs,
      );
      for (const r of created) {
        console.log(`   • ${r.fields.Namn} — ${r.id}`);
        skapadeRader.push(`Platser."${r.fields.Namn}" — ${r.id}`);
      }
    }

    if (eventinnehallToCreate.length > 0) {
      console.log(`🛠️  Skapar ${eventinnehallToCreate.length} Eventinnehåll-rad(er) …`);
      const fieldsList = eventinnehallToCreate.map(buildEventinnehallFields);
      const created = await createRecords(
        targetBaseId,
        CONFIG.tables.eventinnehall,
        fieldsList,
        token,
        CONFIG.requestThrottleMs,
      );
      for (const r of created) {
        console.log(`   • ${r.fields.Namn} — ${r.id}`);
        skapadeRader.push(`Eventinnehåll."${r.fields.Namn}" — ${r.id}`);
      }

      const fylldRecord = created.find(
        (r) => r.fields.Event === FYLLD_KOMBINATION.Event && r.fields.Typ === FYLLD_KOMBINATION.Typ,
      );
      if (fylldRecord) {
        const agendaFields = buildAgendapunkterFields(fylldRecord.id);
        console.log(
          `🛠️  Skapar ${agendaFields.length} Agendapunkter-rader för "${fylldRecord.fields.Namn}" …`,
        );
        const createdAgenda = await createRecords(
          targetBaseId,
          CONFIG.tables.agendapunkter,
          agendaFields,
          token,
          CONFIG.requestThrottleMs,
        );
        console.log(`   • ${createdAgenda.length} agendapunkter skapade.`);
        skapadeRader.push(
          `Agendapunkter: ${createdAgenda.length} rader för "${fylldRecord.fields.Namn}" (${createdAgenda.map((a) => a.id).join(', ')})`,
        );
      }
    }

    console.log('✅ Klart.');
    if (skapadeRader.length > 0) {
      console.log(
        `\n═══ SAMMANFATTNING — klistra in i data-model.md:s ${korMotProd ? 'prod' : 'staging'}-kolumn ═══`,
      );
      for (const rad of skapadeRader) console.log(rad);
    }
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
