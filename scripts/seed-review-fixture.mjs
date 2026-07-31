#!/usr/bin/env node
// scripts/seed-review-fixture.mjs — skapar OCH städar GRANSKNINGSFIXTURER i
// staging-basen: ett kommande event med N bekräftade + M obekräftade
// anmälningar, realistiskt varierade, redo för design-review i browsern.
//
// VARFÖR SKRIPTET FINNS: exakt samma jobb gjordes för hand 2026-07-22
// (Event-796, Ort "Skövde", noteringen "GRANSKNINGSDATA (S75 review-våg 1)")
// och igen 2026-07-26 (Ort "ZZ-GRANSKNING-S91"). Andra gången kostade lika
// mycket som första, eftersom den första inte lämnade någon väg efter sig.
// Detta ÄR vägen — tredje gången är ett kommando.
//
// Kör:
//   npm run seed:review                       # default-fixtur, 8 + 8
//   npm run seed:review -- --ort ZZ-X --dagar 5 --bekraftade 4 --obekraftade 12
//   npm run seed:review -- --dry-run          # planera, skriv inget
//   npm run seed:review -- --livstid 30       # längre granskningsfönster
//   npm run seed:review:clean                 # radera default-fixturen
//   npm run seed:review:clean -- --ort ZZ-X --dry-run
//   npm run seed:review -- --sweep            # ENDAST förfallo-svepet
//   npm run seed:review -- --sweep --dry-run  # visa vad svepet skulle ta
//   npm run seed:review -- --legacy <namn>              # dry-run, alltid
//   npm run seed:review -- --legacy <namn> --bekrafta   # radera på riktigt
//
// LIVSTIDEN (TASK-95 del A): create stämplar ett utgångsdatum i eventets
// Notering. Förfallo-svepet läser stämpeln och städar det som passerat — det
// körs automatiskt i create och clean (stäng av med --ingen-svep) och kan
// köras ensamt med --sweep. En fixtur vars datum inte passerat rörs ALDRIG:
// det är "granskningen pågår". Svepet är ingen tidsdriven automat — det körs
// när skriptet körs; se CONFIG.livstid för hela avvägningen.
//
// LEGACY-LÄGET (TASK-95 del B): handbyggda fixturer från tiden före skriptet
// bär inte dess markörer och är osynliga för både clean och svepet.
// CONFIG.legacy är ett slutet register över dem, med mätt räkning per post.
// Dry-run är default; radering kräver --bekrafta.
//
// Token: STAGING_AIRTABLE_TOKEN ur gitignorade .env.seed (se
// .env.seed.example), laddad av npm-skriptet via
// `node --env-file-if-exists=.env.seed` — samma mekanism som
// `npm run purge:staging`. Tokenet är least-privilege: ENBART
// data.records:read + data.records:write mot staging-basen.
//
// SCHEMA-BLINDHET ÄR ETT DESIGNVILLKOR: tokenet saknar `schema.bases:read`
// (`meta/bases/…/tables` svarar 403). Skriptet får därför ALDRIG läsa schemat
// — alla select-värden är PINNADE konstanter i CONFIG nedan, verifierade mot
// docs/reference/data-model.md § Schema cheat sheet. `typecast` används
// ALDRIG: ett ogiltigt select-värde ska ge hårt 422, aldrig tyst föda en ny
// option i basen.
//
// Fyra skyddsräcken (alla hårda, i denna ordning):
//   1. Bas-guard: CONFIG.expectedBaseId måste vara app-formad och får inte
//      finnas i forbiddenBaseIds (PROD app8uGPrVCVOm6LfD hårt blockerad —
//      staging och prod delar tabell-/fält-ID:n för duplicerade fält
//      (data-model.md § ID-topologi), så bas-ID:t är DEN bärande linjen).
//   2. Purge-kollisionsvakt (fälla 1): fixturens markörer korsläses mot den
//      SKARPA .purge-staging-policy.json och avvisas om de skulle kunna
//      matchas av setup-purgen. Policyn LÄSES — mönstren dupliceras aldrig
//      hit, så vakten kan inte drifta ifrån den purge som faktiskt körs.
//   3. Skyddade record-ID:n (fälla 2): de permanenta assertion-fixturerna
//      (ZZ-Arbetsko / ZZ-History) står i CONFIG.protectedRecordIds och kan
//      aldrig raderas — inte ens om de mot förmodan matchar en markör.
//   4. Länk-guard vid clean: en person med data-länkar (Deltaganden) lämnas
//      kvar och rapporteras i stället för att raderas. Fail-safe-riktning,
//      samma form som purge-skriptets skyddsräcke 4.
//   5. Utgångsstämpeln (TASK-95): svepet raderar ENDAST en fixtur vars stämpel
//      passerat. Saknad, trasig eller framtida stämpel ⇒ rörs aldrig. Det är
//      den halva som gör att en pågående granskning inte kan städas bort.
//   6. Legacy-registrets räknings-guard (TASK-95): varje post bär sin MÄTTA
//      räkning, och avviker basen från den vägrar skriptet och raderar
//      ingenting. Registret är slutet — inga mönster från kommandoraden.
//
// SKYDDSRÄCKE 2 ÄR OFÖRÄNDRAT OCH SKA FÖRBLI DET: en granskningsfixtur får
// ALDRIG bli purge-bar. Att lösa livstidsfrågan med en target i
// .purge-staging-policy.json vore att riva skyddet, inte att laga det —
// setup-purgen kör före varje staging-CI-jobb och hade raderat fixturen mitt
// under granskningen. Restlistan bokförde en gång ZZ-GRANSKNING-* och
// app-segment-test som samma klass av lucka; de har MOTSATTA rätta svar.
//
// Logiken är universell (kan bära ett annat projekt utan refactor); ALLA
// projekt-värden bor i CONFIG högst upp. Medvetet avsteg från
// .<grindvakt>-policy.conf-konventionen (CLAUDE.md): den gäller CI-grindvakts-
// logik med flera konsumenter. Detta är ett lokalt utvecklarverktyg med EN
// konsument, och de pinnade select-värdena är ett korrekthetskontrakt med
// koden (schema-blindheten ovan) — att flytta dem till en fristående fil
// hade lagt till ett felläge utan att lägga till en konsument.
//
// Airtable-mekanik (developers-docs, verifierad 2026-07-19/26): max 10 records
// per create/delete-anrop; 5 req/s per bas (≈250 ms throttle); delete via
// ?records[]=…; list pagineras via offset. Formelfält har beräkningsfördröjning
// (data-model § Kända fällor 17) — därav poll vid EventKey-läsning.
//
// Exit: 0 = OK, 1 = guard-/konfigurations-/argumentfel, 2 = Airtable-API-fel.

import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { kravStagingLedigt } from './lib/staging-preflight.mjs';

// ---------------------------------------------------------------------------
// CONFIG — allt projekt-specifikt bor här. Logiken nedanför är universell.
// ---------------------------------------------------------------------------

export const CONFIG = {
  /** Staging. Prod är hårt blockerad (skyddsräcke 1). */
  expectedBaseId: 'apphjj8Q7lkXCMsL4',
  forbiddenBaseIds: ['app8uGPrVCVOm6LfD'],

  /** Tabeller: id används i API-anropen, namn för korsläsning mot purge-policyn. */
  tables: {
    eventplanering: { id: 'tblVE3UKWl1CKrphV', purgeName: 'Eventplanering' },
    anmalningar: { id: 'tbloOcrppVoyrHbrq', purgeName: 'Anmälningar' },
    personer: { id: 'tbl6ZyCm3V026iFTU', purgeName: 'Personer' },
  },

  /**
   * PINNADE select-värden — tokenet kan inte läsa schemat, och `typecast`
   * används aldrig. Källa: docs/reference/data-model.md § Schema cheat sheet,
   * samtliga skarpt belagda mot staging 2026-07-26.
   */
  select: {
    eventSource: 'Fjärrskådning',
    eventTyp: 'Utbildning',
    eventStatus: 'Planerat',
    regStatusBekraftad: 'Bekräftad (mail skickat)',
    regStatusObekraftad: 'Obekräftad',
    regKallaManuell: 'Manuell',
    betalningMottagen: 'Mottagen',
    betalningEjMottagen: 'Ej mottagen',
  },

  /**
   * Eventformat-raden "Dag 1 + Dag 2". Eventtyp-länken KRÄVS vid create
   * (ADR-066 b5) — utan den saknar eventet Sessionsmall och blir felaktigt.
   */
  eventformatRecordId: 'recclDd7hUQsfxoVs',

  /**
   * Fixtur-markörerna. Medvetet VID SIDAN AV purge-mönstren (fälla 1):
   * setup-purgen jagar `Ort = 'ZZ-create-event-test'` och
   * `create-test+<uuid>@staging.test`. En granskningsfixtur som matchade dem
   * hade raderats mitt under granskningen av nästa CI-körning. Egen
   * e-postdomän `@granskning.test` (purgen tittar bara på `@staging.test`)
   * och en notering-sentinel som purgen aldrig läser. Vakten verifierar det
   * mekaniskt mot den skarpa policyn — se purgeCollisions.
   */
  marker: {
    noteringSentinel: '[SEED-REVIEW-FIXTUR]',
    emailPrefix: 'seed-review+',
    emailDomain: '@granskning.test',
  },

  /**
   * Permanenta fixturer som bär exakta rollup-assertions i testsviten
   * (TASK-31): ZZ-Arbetsko Person 01 + ZZ-History Person 01. Att länka nya
   * anmälningar till dem — eller radera dem — fäller tester (fälla 2).
   * Skriptet skapar därför EGNA personer och kan aldrig röra dessa.
   */
  protectedRecordIds: ['rec7F8jYc7rczwwkM', 'recqxaFNwHAdQlAqb'],

  /** Länkfält på Personer vars närvaro blockerar radering (skyddsräcke 4). */
  personDataLinkFields: ['Deltaganden'],

  /**
   * Beläggnings-tak (fälla 4). Automation A6 skickar fullbokat-notis vid
   * 100 % `Anmäld beläggning (%)`. Automationerna är avstängda i staging idag,
   * men fixturen förlitar sig inte på det: kapaciteten sätts så att kvoten
   * aldrig kan nå taket.
   */
  belaggning: { maxKvot: 0.6, minPlatser: 20 },

  defaults: {
    ort: 'ZZ-GRANSKNING-FIXTUR',
    bekraftade: 8,
    obekraftade: 8,
    /**
     * Dagar till eventstart (fälla 3). Ett kluster på ~15 identiska
     * sentinel-event ligger på 2026-09-15 — en fixtur där drunknar i listan.
     * Nära i tiden ⇒ överst i "Kommande".
     */
    dagar: 8,
  },

  /** Anmälnings-taket är en rimlighetsspärr, inte en Airtable-gräns. */
  limits: { maxAnmalningar: 60 },

  /**
   * FIXTURENS LIVSTID (TASK-95 del A). Skapandet stämplar ett utgångsdatum i
   * eventets Notering; förfallo-svepet (korSweep) läser stämpeln och städar
   * det som passerat, via exakt samma planClean-väg och samma skyddsräcken.
   *
   * VAD STÄMPELN LÖSER, OCH VARFÖR DEN BEHÖVS FÖR ATT ÖVERHUVUDTAGET KUNNA
   * SKILJA FALLEN: skyddsräcke 2 svarar på "vem får INTE radera fixturen
   * medan granskningen pågår". Ingenting svarade på "vem raderar den när
   * granskningen är slut" — och ingen mekanism KUNDE svara, eftersom
   * "granskningen pågår" inte var uttryckt någonstans i datan. Stämpeln gör
   * det uttryckbart. Utan den är varje automatisk städning en gissning.
   *
   * TRE FAIL-SAFE-RIKTNINGAR, alla åt samma håll (hellre lämna kvar):
   *   - fixtur UTAN stämpel rörs ALDRIG (t.ex. en handbyggd, eller en skapad
   *     före denna landning) — det är legacy-registrets område, inte svepets
   *   - fixtur vars datum INTE passerat rörs ALDRIG — det ÄR "granskningen
   *     pågår", och det är den halvan som gör mekanismen säker
   *   - ogiltigt/oparsbart datum rörs ALDRIG — en trasig stämpel läses aldrig
   *     som "förfallen"
   *
   * ÄRLIG GRÄNS, utskriven i stället för dold: svepet körs NÄR SKRIPTET KÖRS
   * (create, clean eller --sweep). Det är ingen tidsdriven automat. En fixtur
   * vars stämpel passerat ligger kvar tills någon kör skriptet igen. Det är
   * ett medvetet val — alternativet (ett raderande CI-jobb mot staging)
   * återinför precis den risk skyddsräcke 2 finns för att stänga, med en
   * aktör ingen ser innan den fyrar. Avvägningen i sin helhet, inklusive de
   * tre förkastade formerna, står i TASK-95:s PR — den är INTE ADR-fäst.
   */
  livstid: {
    dagarDefault: 14,
    maxDagar: 365,
    /** Stämpelns form i Noteringen. Läses av parseUtgangsdatum. */
    stampelPrefix: '[UTGÅR:',
  },

  /**
   * LEGACY-REGISTRET (TASK-95 del B) — handbyggda granskningsfixturer från
   * tiden FÖRE skriptet. De bär inte skriptets markörer och är därför
   * osynliga för både clean och svepet (fail-safe: "en rad utan fixtur-markör
   * rörs aldrig"). Registret är den enda vägen till dem.
   *
   * VARFÖR ETT REGISTER OCH INTE EN FRI `--legacy-monster <regex>`: ett
   * mönster som skrivs på kommandoraden i stunden flyttar hela skyddet till
   * den som skriver det. Det är prosa som utger sig för att vara mekanism —
   * ADR-083:s synd, i kodform. Registret flyttar skyddet till kodgranskning
   * och testsvit: varje post är granskad, testad mot riktiga adresser den
   * INTE får matcha, och bär sin egen räkning.
   *
   * FYRA ANKARE PER POST, alla måste hålla:
   *   1. `ort` — grovsorterar server-side
   *   2. `eventRecordId` — EXAKT record-ID. Bärande för `Skövde`, som är ett
   *      RIKTIGT ortsnamn: utan ID-ankaret hade en framtida verklig Skövde-rad
   *      kunnat matchas av ort-filtret.
   *   3. `emailPattern` — ankrat (^…$), aldrig delsträng
   *   4. `forvantat` — räkningen från mätningen. Avviker basen från den
   *      VÄGRAR skriptet. Det gör "räkna FÖRE du raderar" mekaniskt i stället
   *      för en uppmaning till människan (TASK-76:s lärdom).
   */
  legacy: [
    {
      namn: 'ZZ-GRANSKNING-S91',
      ort: 'ZZ-GRANSKNING-S91',
      eventRecordId: 'recBepsw4Qy9scfoj',
      // Grovfilter server-side (måste stå FÖRST i adressen, därav `= 1`);
      // emailPattern är finfiltret som avgör.
      emailSokPrefix: 'zz-granskning-',
      emailPattern: '^zz-granskning-\\d{2}@staging\\.test$',
      forvantat: { event: 1, anmalningar: 16, personer: 16 },
      kalla:
        'Handbyggd 2026-07-26 (S91, task-48 design-review). Mätt av TASK-88, ' +
        'omräknad av TASK-95 2026-07-30. Marcus godkände städning 2026-07-30.',
    },
    {
      namn: 'Skovde-S75',
      ort: 'Skövde',
      eventRecordId: 'recigcY12dDllUkYt',
      // `= 1` gör att detta prefix INTE fångar S91:s `zz-granskning-…`,
      // där `granskning-` står på position 4.
      emailSokPrefix: 'granskning-',
      emailPattern: '^granskning-[a-z0-9-]+@example\\.com$',
      forvantat: { event: 1, anmalningar: 6, personer: 3 },
      kalla:
        'Handbyggd 2026-07-22 (S75 review-våg 1, betalningsvy-granskningen). ' +
        'Mätt av TASK-95 2026-07-30. Event-796, Ort "Skövde" — ett RIKTIGT ' +
        'ortsnamn, därav record-ID-ankaret.',
    },
  ],

  /** Inskickad-spridning bakåt i tiden (kön sorteras äldst först). */
  inskickadSpann: { aldstDagar: 35, senasteDagar: 2 },

  batchSize: 10,
  requestThrottleMs: 250,
  appBaseUrl: 'http://localhost:5173',

  /** Namnpool. Index-rotationen ger unika par för väl över maxAnmalningar. */
  fornamn: [
    'Astrid',
    'Bengt',
    'Cecilia',
    'David',
    'Elin',
    'Fredrik',
    'Gunilla',
    'Hassan',
    'Ingrid',
    'Johan',
    'Karin',
    'Lars',
    'Maja',
    'Nils',
    'Petra',
    'Rasmus',
    'Sofia',
    'Tobias',
    'Ulrika',
    'Viktor',
    'Yasmin',
    'Zara',
    'Åke',
    'Ärla',
    'Össur',
    'Bodil',
    'Erik',
    'Frida',
    'Gustav',
    'Hanna',
  ],
  efternamn: [
    'Almqvist',
    'Bergström',
    'Cederlund',
    'Dahlgren',
    'Ekström',
    'Fjellner',
    'Gunnarsson',
    'Hedlund',
    'Isaksson',
    'Jonsson',
    'Kvist',
    'Lindqvist',
    'Mattsson',
    'Nyberg',
    'Olsson',
    'Pettersson',
    'Rehn',
    'Sandberg',
    'Törnqvist',
    'Ullman',
    'Vikström',
    'Wallin',
    'Ödman',
    'Zetterlund',
  ],
};

const AIRTABLE_API_URL = 'https://api.airtable.com/v0';
const BASE_ID_PATTERN = /^app[A-Za-z0-9]{14}$/;
const REC_ID_PATTERN = /^rec[A-Za-z0-9]{14}$/;
/** Ort används i filterByFormula — citattecken och backslash är bannlysta. */
const ORT_PATTERN = /^[A-Za-z0-9ÅÄÖåäöÉé _.:-]{3,60}$/;

// ---------------------------------------------------------------------------
// Pura funktioner (exporterade för scripts/test-seed-review-fixture.mjs)
// ---------------------------------------------------------------------------

/** Skyddsräcke 1: bas-guarden + CONFIG-formen. Kastar vid fel. */
export function validateConfig(config) {
  if (!config || typeof config !== 'object') throw new Error('config: förväntade ett objekt');
  const { expectedBaseId, forbiddenBaseIds, eventformatRecordId, protectedRecordIds } = config;
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
  if (!REC_ID_PATTERN.test(eventformatRecordId ?? '')) {
    throw new Error(
      `eventformatRecordId "${eventformatRecordId}" är inte rec-formad — Eventtyp-länken KRÄVS vid create (ADR-066 b5)`,
    );
  }
  if (
    !Array.isArray(protectedRecordIds) ||
    !protectedRecordIds.every((i) => REC_ID_PATTERN.test(i))
  ) {
    throw new Error(
      'protectedRecordIds måste vara en lista av rec-ID:n (de permanenta fixturerna)',
    );
  }
  for (const [nyckel, varde] of Object.entries(config.select ?? {})) {
    if (typeof varde !== 'string' || varde.length === 0) {
      throw new Error(
        `select.${nyckel} saknas — select-värden måste vara pinnade (ingen typecast)`,
      );
    }
  }
  if (!(config.belaggning?.maxKvot > 0) || config.belaggning.maxKvot >= 1) {
    throw new Error('belaggning.maxKvot måste ligga i (0, 1) — A6 larmar vid 100 %');
  }
  const { dagarDefault, maxDagar, stampelPrefix } = config.livstid ?? {};
  if (!Number.isInteger(dagarDefault) || dagarDefault < 1 || dagarDefault > (maxDagar ?? 0)) {
    throw new Error(
      `livstid.dagarDefault måste vara ett heltal 1–${maxDagar} — utan livstid har fixturen ingen avslutning`,
    );
  }
  if (typeof stampelPrefix !== 'string' || !stampelPrefix.startsWith('[')) {
    throw new Error('livstid.stampelPrefix måste vara en [-inledd sträng (läses ur Noteringen)');
  }
  // Legacy-registret: varje post måste bära alla fyra ankarna, och mönstret
  // måste vara ankrat i BÅDA ändar. Ett oankrat mönster matchar delsträngar
  // och kunde träffa en riktig adress — det är hela skälet posterna finns i
  // kod i stället för på kommandoraden.
  for (const post of config.legacy ?? []) {
    const namn = post?.namn ?? '(namnlös)';
    if (!ORT_PATTERN.test(post?.ort ?? '')) {
      throw new Error(
        `legacy[${namn}].ort "${post?.ort}" avvisas — värdet går in i filterByFormula`,
      );
    }
    if (!REC_ID_PATTERN.test(post?.eventRecordId ?? '')) {
      throw new Error(
        `legacy[${namn}].eventRecordId saknas eller är inte rec-formad — record-ID-ankaret är obligatoriskt`,
      );
    }
    if (
      typeof post?.emailPattern !== 'string' ||
      !post.emailPattern.startsWith('^') ||
      !post.emailPattern.endsWith('$')
    ) {
      throw new Error(
        `legacy[${namn}].emailPattern måste vara ankrat i BÅDA ändar (^…$) — ett oankrat mönster matchar delsträngar`,
      );
    }
    // Grovfiltret går in i filterByFormula — citattecken och backslash är
    // bannlysta av samma skäl som i ORT_PATTERN.
    if (!/^[a-z0-9+._-]{3,40}$/.test(post?.emailSokPrefix ?? '')) {
      throw new Error(
        `legacy[${namn}].emailSokPrefix saknas eller bär otillåtna tecken (värdet går in i filterByFormula)`,
      );
    }
    for (const nyckel of ['event', 'anmalningar', 'personer']) {
      if (!Number.isInteger(post?.forvantat?.[nyckel]) || post.forvantat[nyckel] < 0) {
        throw new Error(
          `legacy[${namn}].forvantat.${nyckel} saknas — räkningen är guarden, inte en anteckning`,
        );
      }
    }
  }
  return config;
}

/** Tolka argv. Kastar med läsbart fel vid ogiltig inmatning. */
export function parseArgs(argv, config) {
  const args = {
    clean: argv.includes('--clean'),
    dryRun: argv.includes('--dry-run'),
    /** Kör ENDAST förfallo-svepet — inget skapas, ingen namngiven ort städas. */
    sweep: argv.includes('--sweep'),
    /** Stäng av det automatiska svepet i create/clean. */
    ingenSvep: argv.includes('--ingen-svep'),
    /**
     * Legacy-läget raderar först med --bekrafta. Utan den är det dry-run.
     * Kortets krav "aktivt val och dry-run först" mekaniseras därmed i stället
     * för att stå som en uppmaning: den farliga vägen kräver ETT extra ord,
     * och den ofarliga är default.
     */
    bekrafta: argv.includes('--bekrafta'),
    legacy: null,
    ort: config.defaults.ort,
    bekraftade: config.defaults.bekraftade,
    obekraftade: config.defaults.obekraftade,
    dagar: config.defaults.dagar,
    livstid: config.livstid.dagarDefault,
  };
  const tal = (namn, ravarde, { min, max }) => {
    const n = Number(ravarde);
    if (!Number.isInteger(n) || n < min || n > max) {
      throw new Error(`--${namn} måste vara ett heltal ${min}–${max} (fick "${ravarde}")`);
    }
    return n;
  };
  for (let i = 0; i < argv.length; i += 1) {
    const flagga = argv[i];
    const varde = argv[i + 1];
    switch (flagga) {
      case '--ort':
        if (!ORT_PATTERN.test(varde ?? '')) {
          throw new Error(
            `--ort "${varde}" avvisas: 3–60 tecken, inga citattecken (värdet går in i filterByFormula)`,
          );
        }
        args.ort = varde;
        i += 1;
        break;
      case '--bekraftade':
        args.bekraftade = tal('bekraftade', varde, { min: 0, max: config.limits.maxAnmalningar });
        i += 1;
        break;
      case '--obekraftade':
        args.obekraftade = tal('obekraftade', varde, { min: 0, max: config.limits.maxAnmalningar });
        i += 1;
        break;
      case '--dagar':
        args.dagar = tal('dagar', varde, { min: 0, max: 365 });
        i += 1;
        break;
      case '--livstid':
        args.livstid = tal('livstid', varde, { min: 1, max: config.livstid.maxDagar });
        i += 1;
        break;
      case '--legacy': {
        const post = (config.legacy ?? []).find((p) => p.namn === varde);
        if (!post) {
          const kanda =
            (config.legacy ?? []).map((p) => p.namn).join(', ') || '(registret är tomt)';
          throw new Error(
            `--legacy "${varde}" finns inte i registret. Kända poster: ${kanda}. ` +
              'Registret är avsiktligt slutet — en handbyggd fixtur läggs till i CONFIG.legacy ' +
              'med mätt räkning, aldrig som ett mönster på kommandoraden.',
          );
        }
        args.legacy = post;
        i += 1;
        break;
      }
      default:
        break;
    }
  }
  // Lägena är ömsesidigt uteslutande — annars blir det tvetydigt vad --ort styr.
  const lagen = [
    args.clean && '--clean',
    args.sweep && '--sweep',
    args.legacy && '--legacy',
  ].filter(Boolean);
  if (lagen.length > 1) {
    throw new Error(`${lagen.join(' och ')} kan inte kombineras — välj ETT läge`);
  }
  // Fail-safe: --dry-run vinner ALLTID över --bekrafta. Anges båda är avsikten
  // att titta, inte att radera.
  if (args.dryRun) args.bekrafta = false;
  const totalt = args.bekraftade + args.obekraftade;
  if (!args.clean && !args.sweep && !args.legacy && totalt === 0) {
    throw new Error('--bekraftade + --obekraftade är 0 — inget att skapa');
  }
  if (totalt > config.limits.maxAnmalningar) {
    throw new Error(
      `--bekraftade + --obekraftade = ${totalt} överskrider taket ${config.limits.maxAnmalningar}`,
    );
  }
  return args;
}

/** Ort → markör-slug. Endast [a-z0-9-], så den är formel- och e-post-säker. */
export function slugify(ort) {
  return ort
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/é/g, 'e')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Fixturens e-postadress för anmälan nr `index` (0-indexerat). */
export function fixtureEmail(slug, index, marker) {
  return `${marker.emailPrefix}${slug}-${String(index + 1).padStart(2, '0')}${marker.emailDomain}`;
}

/** Exakt regex för fixturens e-postadresser — clean matchar aldrig bredare. */
export function fixtureEmailPattern(slug, marker) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${esc(marker.emailPrefix)}${esc(slug)}-\\d{2,3}${esc(marker.emailDomain)}$`);
}

/** filterByFormula som grovsorterar fixtur-rader server-side. */
export function fixtureEmailFormula(slug, marker) {
  return `AND(FIND('${marker.emailPrefix}${slug}-', {E-post}) = 1, FIND('${marker.emailDomain}', {E-post}) > 0)`;
}

/**
 * filterByFormula som hämtar ALLA event skriptet självt skapat — svepets
 * ingång. Sentineln står först i Noteringen, därav `= 1`.
 */
export function sweepEventFormula(marker) {
  return `FIND('${marker.noteringSentinel}', {Notering}) = 1`;
}

/** filterByFormula som grovsorterar en legacy-posts rader server-side. */
export function legacyEmailFormula(post) {
  return `FIND('${post.emailSokPrefix}', LOWER({E-post} & '')) = 1`;
}

/**
 * Skyddsräcke 2 (fälla 1): korsläs fixturens markörer mot den SKARPA
 * purge-policyn. Träff = fixturen skulle raderas av setup-purgen mitt under
 * granskningen. Returnerar kollisionerna; tom lista = säkert.
 */
export function purgeCollisions(samples, purgePolicy) {
  const kollisioner = [];
  for (const target of purgePolicy?.targets ?? []) {
    for (const sample of samples) {
      if (sample.table !== target.table || sample.field !== target.exactMatchField) continue;
      if (new RegExp(target.exactMatchPattern).test(sample.value)) {
        kollisioner.push({ target: target.name, field: sample.field, value: sample.value });
      }
    }
  }
  return kollisioner;
}

/** ISO-datum (YYYY-MM-DD) `dagar` dagar efter `fran`. */
export function isoDatum(fran, dagar) {
  const d = new Date(fran);
  d.setUTCDate(d.getUTCDate() + dagar);
  return d.toISOString().slice(0, 10);
}

/**
 * Utgångsstämpelns text för ett givet datum: `[UTGÅR: 2026-08-13]`.
 *
 * Kastar vid ogiltigt datum i stället för att foga in det. En stämpel som
 * lyder `[UTGÅR: undefined]` är oläsbar för parseUtgangsdatum, och en oläsbar
 * stämpel betyder "rör aldrig" — fixturen hade alltså blivit odödlig, tyst.
 * Det är precis det felet denna funktion finns för att göra omöjligt.
 */
export function utgangsstampel(datum, livstid) {
  if (typeof datum !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(datum)) {
    throw new Error(`utgangsstampel: "${datum}" är inte ett ISO-datum (YYYY-MM-DD)`);
  }
  return `${livstid.stampelPrefix} ${datum}]`;
}

/**
 * Läs utgångsdatumet ur en Notering. Returnerar `'YYYY-MM-DD'` eller `null`.
 *
 * `null` betyder ALLTID "rör aldrig" för svepet, och täcker tre skilda fall
 * med samma svar: ingen stämpel alls (handbyggd fixtur, eller en skapad före
 * TASK-95), en trasig stämpel, och ett formmässigt korrekt men obefintligt
 * datum (`2026-02-31`). Ett oläsbart datum får ALDRIG tolkas som förfallet —
 * fail-safe-riktningen är densamma som resten av skriptets.
 */
export function parseUtgangsdatum(notering, config) {
  if (typeof notering !== 'string') return null;
  const prefix = config.livstid.stampelPrefix;
  const start = notering.indexOf(prefix);
  if (start === -1) return null;
  const slut = notering.indexOf(']', start + prefix.length);
  if (slut === -1) return null;
  const ravarde = notering.slice(start + prefix.length, slut).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ravarde)) return null;
  // Kalender-validering: 2026-02-31 passerar regexen men finns inte. Date
  // normaliserar den tyst till 2026-03-03 — jämförelsen fångar det.
  const d = new Date(`${ravarde}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== ravarde) return null;
  return ravarde;
}

/**
 * Klassa fixtur-event mot dagens datum. Tre utfall — och bara ETT av dem
 * leder till radering.
 *
 * Detta är den tvåsidiga halvan AC #3 kräver: `forfallna` är "städar när den
 * ska", `aktiva` är "rör INTE en fixtur vars granskning pågår". Att båda
 * listorna returneras i stället för bara den första är med flit — anroparen
 * ska kunna RAPPORTERA vad den lät stå, inte bara vad den tog.
 *
 * Jämförelsen är strikt (`idag > utgår`): en fixtur som går ut IDAG får dagen
 * ut. Granskningen kan pågå just nu.
 */
export function planSweep({ events, idag, config }) {
  const plan = { forfallna: [], aktiva: [], utanStampel: [] };
  const idagIso = idag.toISOString().slice(0, 10);
  for (const rec of events) {
    const notering = rec.fields?.Notering;
    const ort = rec.fields?.Ort;
    // Sentineln är förutsättningen: svepet rör ALDRIG något utanför skriptets
    // egna fixturer. En handbyggd fixtur är legacy-registrets område.
    if (typeof notering !== 'string' || !notering.startsWith(config.marker.noteringSentinel)) {
      continue;
    }
    if (config.protectedRecordIds.includes(rec.id)) {
      plan.utanStampel.push({ id: rec.id, ort, orsak: 'skyddad record-ID' });
      continue;
    }
    const utgar = parseUtgangsdatum(notering, config);
    if (utgar === null) {
      plan.utanStampel.push({ id: rec.id, ort, orsak: 'ingen läsbar utgångsstämpel' });
      continue;
    }
    if (idagIso > utgar) plan.forfallna.push({ id: rec.id, ort, utgar });
    else plan.aktiva.push({ id: rec.id, ort, utgar });
  }
  return plan;
}

/**
 * Klassa rader mot EN legacy-registerpost.
 *
 * Skillnaden mot planClean är eventets ankring: här krävs att record-ID:t
 * matchar registrets, INTE bara Orten. Det är bärande för `Skovde-S75`, vars
 * Ort (`Skövde`) är ett riktigt ortsnamn — ett framtida verkligt Skövde-event
 * skulle träffas av ort-filtret men aldrig av ID-ankaret.
 */
export function planLegacyClean({ events, registrations, persons, post, config }) {
  const pattern = new RegExp(post.emailPattern);
  const plan = { events: [], registrations: [], persons: [], skipped: [] };
  for (const rec of events) {
    if (config.protectedRecordIds.includes(rec.id)) {
      plan.skipped.push({ id: rec.id, orsak: 'skyddad record-ID' });
    } else if (rec.id !== post.eventRecordId) {
      plan.skipped.push({
        id: rec.id,
        orsak: `record-ID matchar inte registrets ankare ${post.eventRecordId}`,
      });
    } else if (rec.fields?.Ort !== post.ort) {
      plan.skipped.push({
        id: rec.id,
        orsak: `Ort "${rec.fields?.Ort}" matchar inte registrets "${post.ort}"`,
      });
    } else {
      plan.events.push(rec.id);
    }
  }
  for (const rec of registrations) {
    if (config.protectedRecordIds.includes(rec.id)) {
      plan.skipped.push({ id: rec.id, orsak: 'skyddad record-ID' });
    } else if (!isFixtureEmailRecord(rec, pattern)) {
      plan.skipped.push({ id: rec.id, orsak: 'e-post matchar inte registrets mönster' });
    } else {
      plan.registrations.push(rec.id);
    }
  }
  for (const rec of persons) {
    if (config.protectedRecordIds.includes(rec.id)) {
      plan.skipped.push({ id: rec.id, orsak: 'skyddad record-ID (permanent fixtur)' });
      continue;
    }
    if (!isFixtureEmailRecord(rec, pattern)) {
      plan.skipped.push({ id: rec.id, orsak: 'e-post matchar inte registrets mönster' });
      continue;
    }
    const lankar = personLinkGuardTrips(rec, config.personDataLinkFields);
    if (lankar.length > 0) {
      plan.skipped.push({ id: rec.id, orsak: `länk-guard: ${lankar.join(', ')}` });
      continue;
    }
    plan.persons.push(rec.id);
  }
  return plan;
}

/**
 * Jämför en legacy-plan mot registrets mätta räkning. Returnerar en lista
 * avvikelser; tom lista = basen ser ut som när posten mättes.
 *
 * Detta är legacy-lägets skarpaste guard, och skälet är TASK-76: en oräknad
 * massradering mot en delad bas är det farliga. Räkningen gör "räkna FÖRE du
 * raderar" till en mekanism i stället för en uppmaning — avviker basen från
 * mätningen har något ändrats sedan dess, och då ska en människa titta.
 */
export function legacyRakningsavvikelser(plan, post) {
  const faktiskt = {
    event: plan.events.length,
    anmalningar: plan.registrations.length,
    personer: plan.persons.length,
  };
  return Object.entries(post.forvantat)
    .filter(([nyckel, vantat]) => faktiskt[nyckel] !== vantat)
    .map(([nyckel, vantat]) => `${nyckel}: förväntade ${vantat}, fann ${faktiskt[nyckel]}`);
}

/** ISO-timestamp `dagar` dagar före `fran`, klockslaget stabilt per index. */
export function isoTidBakat(fran, dagar, timmeOffset = 0) {
  const d = new Date(fran);
  d.setUTCDate(d.getUTCDate() - dagar);
  d.setUTCHours(7 + (timmeOffset % 9), (timmeOffset * 7) % 60, 0, 0);
  return d.toISOString();
}

/**
 * Kapacitet (fälla 4): tillräckligt hög för att `Anmäld beläggning (%)` aldrig
 * ska nå 100 % och trigga A6:s fullbokat-notis. Rundas upp till jämna tiotal
 * så eventet ser mänskligt planerat ut.
 */
export function kapacitetFor(totaltAntal, belaggning) {
  const kravd = Math.ceil(totaltAntal / belaggning.maxKvot);
  const jamnad = Math.ceil(Math.max(kravd, belaggning.minPlatser) / 10) * 10;
  return jamnad;
}

/**
 * Eventets fält.
 *
 * `Månad/år` sätts ALDRIG. Appens månadsgruppering härleds klient-sidan ur
 * `Startdatum`, och fältet är ett manuellt singleSelect (data-model § Kända
 * fällor 36 + 45) — att sätta det kräver en giltig option som inte går att
 * läsa utan schema-scope, och en gissad option ger 422 (ingen typecast).
 * Det befintliga granskningseventet bär fältet tomt och renderar rätt.
 */
export function buildEvent({ ort, startdatum, slutdatum, maxPlatser, utgangsdatum, config }) {
  return {
    'Event (source)': config.select.eventSource,
    Typ: config.select.eventTyp,
    Ort: ort,
    Startdatum: startdatum,
    Slutdatum: slutdatum,
    Status: config.select.eventStatus,
    'Max antal platser': maxPlatser,
    Eventtyp: [config.eventformatRecordId],
    // Sentineln FÖRST (isFixtureEvent kräver det), stämpeln direkt efter.
    // Stämpeln är maskinläsbar och står före prosan med flit: den är det enda
    // i strängen någon mekanism läser.
    Notering:
      `${config.marker.noteringSentinel} ${utgangsstampel(utgangsdatum, config.livstid)} ` +
      'Granskningsfixtur skapad av scripts/seed-review-fixture.mjs. Syntetisk data i ' +
      `staging — städas av förfallo-svepet vid nästa körning efter ${utgangsdatum}, ` +
      `eller nu med \`npm run seed:review:clean -- --ort ${ort}\`.`,
  };
}

/**
 * Betalstatus per rad. Varieras deterministiskt så båda betalvyerna har något
 * att visa: bland de bekräftade saknar var fjärde anmälningsavgift, bland de
 * obekräftade har var tredje ändå betalat in den.
 */
export function betalstatusFor(index, arBekraftad, select) {
  const { betalningMottagen: JA, betalningEjMottagen: NEJ } = select;
  if (arBekraftad) {
    return {
      Anmälningsavgift: index % 4 === 3 ? NEJ : JA,
      Slutbetalning: index % 3 === 0 ? JA : NEJ,
    };
  }
  return { Anmälningsavgift: index % 3 === 0 ? JA : NEJ, Slutbetalning: NEJ };
}

/**
 * Anmälningarnas + personernas fält. Ren funktion av (ort, antal, nu) — samma
 * indata ger alltid samma fixtur, så en granskning går att återskapa exakt.
 *
 * REALISM (så vyn visar allt den ska): varannan rad bär `Källa = Manuell`
 * (ger kategori-pillen "Manuellt tillagd"), varannan lämnar Källa TOM
 * (formuläranmälan — frånvaro är sanningen, data-model § Källa-värden).
 * `Inskickad` sprids linjärt bakåt så kön får en äkta äldst-först-ordning,
 * betalstatus varieras i båda grupperna, och de bekräftade bär
 * `Bekräftelse skickad` så meta-raden syns på deltagarkortet.
 */
export function buildRegistrations({ ort, bekraftade, obekraftade, nu, config }) {
  const slug = slugify(ort);
  const totalt = bekraftade + obekraftade;
  const { aldstDagar, senasteDagar } = config.inskickadSpann;
  const rader = [];

  for (let i = 0; i < totalt; i += 1) {
    const arBekraftad = i < bekraftade;
    const fornamn = config.fornamn[i % config.fornamn.length];
    const efternamn = config.efternamn[(i * 11) % config.efternamn.length];
    const epost = fixtureEmail(slug, i, config.marker);

    // Äldst först: index 0 längst bak i tiden, sista närmast nu.
    const andel = totalt === 1 ? 0 : i / (totalt - 1);
    const dagarBak = Math.round(aldstDagar - andel * (aldstDagar - senasteDagar));
    const inskickad = isoTidBakat(nu, dagarBak, i);

    const anmalan = {
      Förnamn: fornamn,
      Efternamn: efternamn,
      'E-post': epost,
      Mobilnummer: `070-${String(100 + i).padStart(3, '0')} ${String(10 + (i % 80)).padStart(2, '0')} ${String(11 + ((i * 3) % 80)).padStart(2, '0')}`,
      Typ: config.select.eventTyp,
      'Antal platser': 1,
      Inskickad: inskickad,
      Status: arBekraftad ? config.select.regStatusBekraftad : config.select.regStatusObekraftad,
      ...betalstatusFor(i, arBekraftad, config.select),
    };
    // Tom Källa = formuläranmälan. Fältet UTELÄMNAS — tomsträng vore en
    // ogiltig select-option och hade gett 422 (ingen typecast).
    if (i % 2 === 0) anmalan.Källa = config.select.regKallaManuell;
    // Bekräftelsen gick ut dagen efter anmälan, aldrig i framtiden.
    if (arBekraftad) anmalan['Bekräftelse skickad'] = isoTidBakat(nu, Math.max(dagarBak - 1, 1), i);

    rader.push({
      person: { Förnamn: fornamn, Efternamn: efternamn, 'E-post': epost },
      anmalan,
    });
  }
  return rader;
}

/** Exakt fixtur-match på event: rätt Ort OCH notering-sentineln. */
export function isFixtureEvent(record, ort, marker) {
  const raderOrt = record.fields?.Ort;
  const notering = record.fields?.Notering;
  if (raderOrt !== ort) return false;
  return typeof notering === 'string' && notering.startsWith(marker.noteringSentinel);
}

/** Exakt fixtur-match på anmälan/person: e-posten matchar slug-mönstret. */
export function isFixtureEmailRecord(record, pattern) {
  const epost = record.fields?.['E-post'];
  return typeof epost === 'string' && pattern.test(epost);
}

/**
 * Skyddsräcke 4: personer med data-länkar (Deltaganden) raderas ALDRIG.
 * `Anmälningar (länkat fält)` räknas inte — den länken är fixturens egen och
 * försvinner när anmälan raderas i steget före.
 */
export function personLinkGuardTrips(record, linkFields) {
  return linkFields.filter((f) => {
    const v = record.fields?.[f];
    return Array.isArray(v) && v.length > 0;
  });
}

/** Klassa listade rader till en clean-plan (raderas / skyddas med orsak). */
export function planClean({ events, registrations, persons, ort, pattern, config }) {
  const plan = {
    events: [],
    registrations: [],
    persons: [],
    skippedEvents: [],
    skippedRegistrations: [],
    skippedPersons: [],
  };
  for (const rec of events) {
    if (config.protectedRecordIds.includes(rec.id)) {
      plan.skippedEvents.push({ id: rec.id, orsak: 'skyddad record-ID' });
      continue;
    }
    if (isFixtureEvent(rec, ort, config.marker)) plan.events.push(rec.id);
    else plan.skippedEvents.push({ id: rec.id, orsak: 'saknar fixtur-sentinel i Notering' });
  }
  for (const rec of registrations) {
    if (config.protectedRecordIds.includes(rec.id)) {
      plan.skippedRegistrations.push({ id: rec.id, orsak: 'skyddad record-ID' });
      continue;
    }
    if (isFixtureEmailRecord(rec, pattern)) plan.registrations.push(rec.id);
    else
      plan.skippedRegistrations.push({ id: rec.id, orsak: 'e-post matchar inte fixtur-mönstret' });
  }
  for (const rec of persons) {
    if (config.protectedRecordIds.includes(rec.id)) {
      plan.skippedPersons.push({ id: rec.id, orsak: 'skyddad record-ID (permanent fixtur)' });
      continue;
    }
    if (!isFixtureEmailRecord(rec, pattern)) {
      plan.skippedPersons.push({ id: rec.id, orsak: 'e-post matchar inte fixtur-mönstret' });
      continue;
    }
    const lankar = personLinkGuardTrips(rec, config.personDataLinkFields);
    if (lankar.length > 0) {
      plan.skippedPersons.push({ id: rec.id, orsak: `länk-guard: ${lankar.join(', ')}` });
      continue;
    }
    plan.persons.push(rec.id);
  }
  return plan;
}

/** Dela lista i batchar om max size (Airtable create/delete ≤10 per anrop). */
export function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Den enda raden användaren egentligen behöver. */
export function eventUrl(baseUrl, recordId) {
  return `${baseUrl}/event/${recordId}`;
}

// ---------------------------------------------------------------------------
// Airtable-API (throttlad, 429-medveten) — samma form som purge-skriptet
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class ApiError extends Error {}

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
    throw new ApiError(`Airtable ${init.method ?? 'GET'} ${res.status}: ${body.slice(0, 400)}`);
  }
  return res.json();
}

async function listRecords(baseId, tableId, formula, token, throttleMs) {
  const records = [];
  let offset;
  do {
    const url = new URL(`${AIRTABLE_API_URL}/${baseId}/${tableId}`);
    if (formula) url.searchParams.set('filterByFormula', formula);
    url.searchParams.set('pageSize', '100');
    if (offset) url.searchParams.set('offset', offset);
    const page = await airtableRequest(url, token, throttleMs);
    records.push(...page.records);
    offset = page.offset;
  } while (offset);
  return records;
}

async function createRecords(baseId, tableId, fieldsList, token, throttleMs, batchSize) {
  const skapade = [];
  for (const batch of chunk(fieldsList, batchSize)) {
    const url = `${AIRTABLE_API_URL}/${baseId}/${tableId}`;
    // INGEN typecast: ogiltigt select-värde ska ge 422, aldrig föda en option.
    const body = JSON.stringify({ records: batch.map((fields) => ({ fields })) });
    const res = await airtableRequest(url, token, throttleMs, { method: 'POST', body });
    skapade.push(...res.records);
  }
  return skapade;
}

async function deleteRecords(baseId, tableId, ids, token, throttleMs, batchSize) {
  let raderade = 0;
  for (const batch of chunk(ids, batchSize)) {
    const url = new URL(`${AIRTABLE_API_URL}/${baseId}/${tableId}`);
    for (const id of batch) url.searchParams.append('records[]', id);
    const res = await airtableRequest(url, token, throttleMs, { method: 'DELETE' });
    raderade += (res.records ?? []).filter((r) => r.deleted).length;
  }
  return raderade;
}

/**
 * Läs EventKey med poll. Fältet är en formel över autoNumber och har
 * beräkningsfördröjning (data-model § Kända fällor 17) — den får aldrig läsas
 * direkt ur create-svaret.
 */
async function pollEventKey(baseId, tableId, recordId, token, throttleMs) {
  for (let forsok = 0; forsok < 6; forsok += 1) {
    const rec = await airtableRequest(
      `${AIRTABLE_API_URL}/${baseId}/${tableId}/${recordId}`,
      token,
      throttleMs,
    );
    const key = rec.fields?.EventKey;
    if (typeof key === 'string' && /^Event-\d+$/.test(key)) return key;
    await sleep(500);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Lägen
// ---------------------------------------------------------------------------

async function korCreate({ args, config, token, purgePolicy }) {
  const { expectedBaseId, tables, requestThrottleMs, batchSize } = config;
  const slug = slugify(args.ort);
  const totalt = args.bekraftade + args.obekraftade;
  const nu = new Date();

  const rader = buildRegistrations({
    ort: args.ort,
    bekraftade: args.bekraftade,
    obekraftade: args.obekraftade,
    nu,
    config,
  });

  // Skyddsräcke 2: markörerna får aldrig kunna fångas av setup-purgen.
  const samples = [
    { table: tables.eventplanering.purgeName, field: 'Ort', value: args.ort },
    ...rader.map((r) => ({
      table: tables.anmalningar.purgeName,
      field: 'E-post',
      value: r.anmalan['E-post'],
    })),
  ];
  const kollisioner = purgeCollisions(samples, purgePolicy);
  if (kollisioner.length > 0) {
    throw new GuardError(
      'purge-kollision: fixturens markörer skulle raderas av setup-purgen — ' +
        kollisioner.map((k) => `${k.value} ⇒ ${k.target}`).join('; '),
    );
  }

  const startdatum = isoDatum(nu, args.dagar);
  const slutdatum = isoDatum(nu, args.dagar + 1); // Eventformatet är Dag 1 + Dag 2.
  const maxPlatser = kapacitetFor(totalt, config.belaggning);
  const utgangsdatum = isoDatum(nu, args.livstid);
  const eventFalt = buildEvent({
    ort: args.ort,
    startdatum,
    slutdatum,
    maxPlatser,
    utgangsdatum,
    config,
  });

  console.log(
    `Granskningsfixtur mot ${expectedBaseId}${args.dryRun ? ' — DRY RUN, inget skrivs' : ''}`,
  );
  console.log(
    `▸ Event: ${args.ort} · ${startdatum} → ${slutdatum} · ${maxPlatser} platser ` +
      `(beläggning ${Math.round((totalt / maxPlatser) * 100)} %, tak ${Math.round(config.belaggning.maxKvot * 100)} %)`,
  );
  console.log(
    `▸ Anmälningar: ${args.bekraftade} bekräftade + ${args.obekraftade} obekräftade = ${totalt}` +
      ` · ${rader.filter((r) => r.anmalan.Källa).length} manuella, ${rader.filter((r) => !r.anmalan.Källa).length} via formulär`,
  );
  console.log(
    `▸ Markör: Ort "${args.ort}" + Notering-sentinel + ${fixtureEmail(slug, 0, config.marker)} …`,
  );
  console.log('▸ Purge-kollisionsvakt: ren mot .purge-staging-policy.json');
  console.log(
    `▸ Livstid: ${args.livstid} dagar — utgångsstämpel ${utgangsstampel(utgangsdatum, config.livstid)} ` +
      'i Noteringen. Förfallo-svepet städar fixturen vid första körningen därefter.',
  );

  // Svepet FÖRE dubbelkörnings-guarden: en förfallen fixtur på samma Ort ska
  // städas bort, inte blockera skapandet av den nya.
  if (!args.ingenSvep) await korSweep({ config, token, dryRun: args.dryRun, idag: nu });

  if (args.dryRun) {
    console.log('\nDry run klar — inget skrevs. Kör utan --dry-run för att skapa.');
    return 0;
  }

  // Refusera dubbelkörning: två fixturer på samma Ort gör granskningen otydlig.
  const befintliga = (
    await listRecords(
      expectedBaseId,
      tables.eventplanering.id,
      `{Ort} = '${args.ort}'`,
      token,
      requestThrottleMs,
    )
  ).filter((r) => isFixtureEvent(r, args.ort, config.marker));
  if (befintliga.length > 0) {
    throw new GuardError(
      `en fixtur på Ort "${args.ort}" finns redan (${befintliga.map((r) => r.id).join(', ')}). ` +
        `Kör \`npm run seed:review:clean -- --ort ${args.ort}\` först, eller välj ett annat --ort.`,
    );
  }

  const [event] = await createRecords(
    expectedBaseId,
    tables.eventplanering.id,
    [eventFalt],
    token,
    requestThrottleMs,
    batchSize,
  );
  console.log(`   ✅ event skapat: ${event.id}`);

  const eventKey = await pollEventKey(
    expectedBaseId,
    tables.eventplanering.id,
    event.id,
    token,
    requestThrottleMs,
  );
  if (eventKey) console.log(`   ✅ EventKey: ${eventKey}`);
  else console.log('   ⚠️  EventKey hann inte beräknas — anmälningarna får bara Event-länken');

  const personer = await createRecords(
    expectedBaseId,
    tables.personer.id,
    rader.map((r) => r.person),
    token,
    requestThrottleMs,
    batchSize,
  );
  console.log(`   ✅ ${personer.length} personer skapade`);

  /*
   * Person-länken sätts av SKRIPTET, inte av automation A2. Automationerna är
   * avstängda i staging (empiriskt: 16 skapade anmälningar gav 0 Deltaganden,
   * och CI-sentinelerna saknar Person-länk). Utan länken blir personens
   * `Antal genomförda event` okänd, och då uteblir historikraden "Första
   * eventet hos Miranon Media" på deltagarkortet — precis den rad granskningen
   * ofta handlar om.
   */
  const anmalningar = await createRecords(
    expectedBaseId,
    tables.anmalningar.id,
    rader.map((r, i) => ({
      ...r.anmalan,
      Event: [event.id],
      ...(eventKey ? { EventKey: eventKey } : {}),
      Person: [personer[i].id],
    })),
    token,
    requestThrottleMs,
    batchSize,
  );
  console.log(`   ✅ ${anmalningar.length} anmälningar skapade (Person-länk satt av skriptet)`);

  // Efter-verifiering: eventet ska se exakt så många anmälningar som vi skrev.
  let raknat = null;
  for (let forsok = 0; forsok < 6; forsok += 1) {
    const rec = await airtableRequest(
      `${AIRTABLE_API_URL}/${expectedBaseId}/${tables.eventplanering.id}/${event.id}`,
      token,
      requestThrottleMs,
    );
    raknat = (rec.fields?.['Anmälningar (länkat fält)'] ?? []).length;
    if (raknat === totalt) break;
    await sleep(500);
  }
  if (raknat !== totalt) {
    throw new ApiError(
      `efter-verifiering: eventet bär ${raknat} anmälningar, förväntade ${totalt}`,
    );
  }
  console.log(`   ✅ efter-verifiering: ${raknat}/${totalt} anmälningar länkade till eventet`);

  console.log('\nKlart. Öppna:\n');
  console.log(`  ${eventUrl(config.appBaseUrl, event.id)}\n`);
  console.log(
    'Ser appen gammal data ut? Kör `localStorage.clear()` i konsolen — query-cachen\n' +
      'persistas i localStorage och överlever hårdladdning (staleTime 5 min).',
  );
  // Raden är INTE längre mekanismen — utgångsstämpeln är. Den står kvar som
  // genväg för den som vill städa före förfallodagen.
  console.log(
    `Livstid: fixturen utgår ${utgangsdatum} och städas då av förfallo-svepet vid ` +
      `nästa körning.\nStäda tidigare: npm run seed:review:clean -- --ort ${args.ort}`,
  );
  return 0;
}

/**
 * Städa EN fixtur-ort via skriptets egna markörer.
 *
 * Delad av `--clean` och förfallo-svepet. Att svepet går genom EXAKT denna
 * funktion — i stället för en egen raderings-väg — är avsiktligt: det ärver
 * därmed skyddade record-ID:n, länk-guarden, raderings-ORDNINGEN (anmälningar
 * → personer → event) och efter-verifieringen utan att någon av dem kan
 * drifta isär mellan de två vägarna.
 */
async function stadaOrt({ ort, config, token, dryRun }) {
  const { expectedBaseId, tables, requestThrottleMs, batchSize } = config;
  const args = { ort, dryRun };
  const slug = slugify(args.ort);
  const pattern = fixtureEmailPattern(slug, config.marker);
  const emailFormula = fixtureEmailFormula(slug, config.marker);

  // Sekventiellt, inte parallellt: throttlen räknar per anrop och 5 req/s
  // per bas är en delad budget.
  const events = await listRecords(
    expectedBaseId,
    tables.eventplanering.id,
    `{Ort} = '${args.ort}'`,
    token,
    requestThrottleMs,
  );
  const registrations = await listRecords(
    expectedBaseId,
    tables.anmalningar.id,
    emailFormula,
    token,
    requestThrottleMs,
  );
  const persons = await listRecords(
    expectedBaseId,
    tables.personer.id,
    emailFormula,
    token,
    requestThrottleMs,
  );

  const plan = planClean({ events, registrations, persons, ort: args.ort, pattern, config });
  console.log(
    `▸ Träffar: ${events.length} event, ${registrations.length} anmälningar, ${persons.length} personer`,
  );
  console.log(
    `▸ Raderas: ${plan.registrations.length} anmälningar, ${plan.persons.length} personer, ${plan.events.length} event`,
  );
  for (const s of [...plan.skippedEvents, ...plan.skippedRegistrations, ...plan.skippedPersons]) {
    console.log(`   ⚠️  ${s.id} lämnas kvar — ${s.orsak}`);
  }
  if (plan.events.length === 0 && plan.registrations.length === 0 && plan.persons.length === 0) {
    console.log('\nInget att städa.');
    return { raderade: 0, planerade: 0 };
  }
  const planerade = plan.events.length + plan.registrations.length + plan.persons.length;
  if (args.dryRun) {
    console.log('\nDry run klar — inget raderades.');
    return { raderade: 0, planerade };
  }

  // Ordningen är bärande: anmälningarna först (då släpper personernas
  // Anmälningar-länk), personerna sedan, eventet sist.
  const rAnm = await deleteRecords(
    expectedBaseId,
    tables.anmalningar.id,
    plan.registrations,
    token,
    requestThrottleMs,
    batchSize,
  );
  console.log(`   🗑  ${rAnm}/${plan.registrations.length} anmälningar raderade`);
  const rPers = await deleteRecords(
    expectedBaseId,
    tables.personer.id,
    plan.persons,
    token,
    requestThrottleMs,
    batchSize,
  );
  console.log(`   🗑  ${rPers}/${plan.persons.length} personer raderade`);
  const rEv = await deleteRecords(
    expectedBaseId,
    tables.eventplanering.id,
    plan.events,
    token,
    requestThrottleMs,
    batchSize,
  );
  console.log(`   🗑  ${rEv}/${plan.events.length} event raderade`);

  // Efter-verifiering (purge-skriptets form): inget radera-bart kvar.
  const kvar = planClean({
    events: await listRecords(
      expectedBaseId,
      tables.eventplanering.id,
      `{Ort} = '${args.ort}'`,
      token,
      requestThrottleMs,
    ),
    registrations: await listRecords(
      expectedBaseId,
      tables.anmalningar.id,
      emailFormula,
      token,
      requestThrottleMs,
    ),
    persons: await listRecords(
      expectedBaseId,
      tables.personer.id,
      emailFormula,
      token,
      requestThrottleMs,
    ),
    ort: args.ort,
    pattern,
    config,
  });
  const rest = kvar.events.length + kvar.registrations.length + kvar.persons.length;
  if (rest > 0) throw new ApiError(`efter-verifiering: ${rest} radera-bara fixtur-rader kvarstår`);
  console.log('   ✅ efter-verifiering: 0 radera-bara fixtur-rader kvar');
  return { raderade: rAnm + rPers + rEv, planerade };
}

async function korClean({ args, config, token }) {
  console.log(
    `Städning av granskningsfixtur "${args.ort}" i ${config.expectedBaseId}` +
      `${args.dryRun ? ' — DRY RUN, inget raderas' : ''}`,
  );
  await stadaOrt({ ort: args.ort, config, token, dryRun: args.dryRun });
  return 0;
}

/**
 * FÖRFALLO-SVEPET (TASK-95 del A) — fixturens livstidsavslutning.
 *
 * Listar varje event skriptet självt skapat, läser utgångsstämpeln, och
 * städar det som passerat via stadaOrt. Rapporterar BÅDA sidorna: vad som
 * togs, och vad som medvetet lämnades (aktiv granskning, eller ingen stämpel).
 *
 * Att den rapporterar det den lämnar är inte kosmetik. En städmekanism som
 * bara redovisar sina raderingar är omöjlig att granska — man ser att den
 * gjorde något, aldrig att den lät bli det den skulle låta bli.
 */
async function korSweep({ config, token, dryRun, idag = new Date() }) {
  const { expectedBaseId, tables, requestThrottleMs } = config;
  const events = await listRecords(
    expectedBaseId,
    tables.eventplanering.id,
    sweepEventFormula(config.marker),
    token,
    requestThrottleMs,
  );
  const plan = planSweep({ events, idag, config });

  console.log(
    `\n▸ Förfallo-svep (${idag.toISOString().slice(0, 10)})${dryRun ? ' — DRY RUN' : ''}: ` +
      `${plan.forfallna.length} förfallna, ${plan.aktiva.length} aktiva, ` +
      `${plan.utanStampel.length} utan läsbar stämpel`,
  );
  for (const a of plan.aktiva) {
    console.log(`   ⏳ ${a.ort} (${a.id}) lämnas — granskning pågår, utgår ${a.utgar}`);
  }
  for (const u of plan.utanStampel) {
    console.log(`   ⚠️  ${u.ort} (${u.id}) lämnas — ${u.orsak}`);
  }

  let raderade = 0;
  for (const f of plan.forfallna) {
    console.log(`   🕓 ${f.ort} (${f.id}) förföll ${f.utgar} — städas`);
    const utfall = await stadaOrt({ ort: f.ort, config, token, dryRun });
    raderade += utfall.raderade;
  }
  if (plan.forfallna.length === 0) console.log('   ✅ inget förfallet att städa');
  return { plan, raderade };
}

/**
 * LEGACY-LÄGET (TASK-95 del B) — den enda vägen till en handbyggd fixtur.
 *
 * Dry-run är DEFAULT; radering kräver `--bekrafta`. Räkningen mot registrets
 * mätta `forvantat` är hård: avviker basen vägrar skriptet och raderar inget.
 */
async function korLegacy({ args, config, token }) {
  const { expectedBaseId, tables, requestThrottleMs, batchSize } = config;
  const post = args.legacy;
  const skarp = args.bekrafta;
  const emailFormula = legacyEmailFormula(post);

  console.log(
    `Legacy-städning av "${post.namn}" i ${expectedBaseId}` +
      `${skarp ? ' — SKARPT, rader raderas' : ' — DRY RUN (lägg till --bekrafta för att radera)'}`,
  );
  console.log(`▸ Källa: ${post.kalla}`);
  console.log(`▸ Ankare: Ort "${post.ort}" + record-ID ${post.eventRecordId}`);
  console.log(`▸ E-postmönster: ${post.emailPattern}`);

  const events = await listRecords(
    expectedBaseId,
    tables.eventplanering.id,
    `{Ort} = '${post.ort}'`,
    token,
    requestThrottleMs,
  );
  const registrations = await listRecords(
    expectedBaseId,
    tables.anmalningar.id,
    emailFormula,
    token,
    requestThrottleMs,
  );
  const persons = await listRecords(
    expectedBaseId,
    tables.personer.id,
    emailFormula,
    token,
    requestThrottleMs,
  );

  const plan = planLegacyClean({ events, registrations, persons, post, config });
  console.log(
    `▸ Träffar: ${events.length} event, ${registrations.length} anmälningar, ${persons.length} personer`,
  );
  console.log(
    `▸ Planerade: ${plan.events.length} event, ${plan.registrations.length} anmälningar, ${plan.persons.length} personer`,
  );
  for (const s of plan.skipped) console.log(`   ⚠️  ${s.id} lämnas kvar — ${s.orsak}`);

  const avvikelser = legacyRakningsavvikelser(plan, post);
  if (avvikelser.length > 0) {
    throw new GuardError(
      `räkningen avviker från registrets mätning för "${post.namn}" — ${avvikelser.join('; ')}. ` +
        'Basen har ändrats sedan posten mättes. INGET raderades. Mät om, uppdatera ' +
        'CONFIG.legacy[].forvantat i en granskad ändring, och kör igen.',
    );
  }
  console.log(
    `   ✅ räkning stämmer mot registret (${post.forvantat.event} event, ` +
      `${post.forvantat.anmalningar} anmälningar, ${post.forvantat.personer} personer)`,
  );

  if (!skarp) {
    console.log('\nDry run klar — inget raderades. Kör med --bekrafta för att radera.');
    return 0;
  }

  // Samma ordning som stadaOrt: anmälningar → personer → event.
  const rAnm = await deleteRecords(
    expectedBaseId,
    tables.anmalningar.id,
    plan.registrations,
    token,
    requestThrottleMs,
    batchSize,
  );
  console.log(`   🗑  ${rAnm}/${plan.registrations.length} anmälningar raderade`);
  const rPers = await deleteRecords(
    expectedBaseId,
    tables.personer.id,
    plan.persons,
    token,
    requestThrottleMs,
    batchSize,
  );
  console.log(`   🗑  ${rPers}/${plan.persons.length} personer raderade`);
  const rEv = await deleteRecords(
    expectedBaseId,
    tables.eventplanering.id,
    plan.events,
    token,
    requestThrottleMs,
    batchSize,
  );
  console.log(`   🗑  ${rEv}/${plan.events.length} event raderade`);

  // Efter-verifiering mot basen, samma form som stadaOrt.
  const kvarPlan = planLegacyClean({
    events: await listRecords(
      expectedBaseId,
      tables.eventplanering.id,
      `{Ort} = '${post.ort}'`,
      token,
      requestThrottleMs,
    ),
    registrations: await listRecords(
      expectedBaseId,
      tables.anmalningar.id,
      emailFormula,
      token,
      requestThrottleMs,
    ),
    persons: await listRecords(
      expectedBaseId,
      tables.personer.id,
      emailFormula,
      token,
      requestThrottleMs,
    ),
    post,
    config,
  });
  const rest = kvarPlan.events.length + kvarPlan.registrations.length + kvarPlan.persons.length;
  if (rest > 0) throw new ApiError(`efter-verifiering: ${rest} radera-bara legacy-rader kvarstår`);
  console.log(`   ✅ efter-verifiering: 0 radera-bara rader kvar (${rAnm + rPers + rEv} raderade)`);
  return 0;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

class GuardError extends Error {}

async function main() {
  let args;
  let purgePolicy;
  try {
    validateConfig(CONFIG);
    args = parseArgs(process.argv.slice(2), CONFIG);
    purgePolicy = JSON.parse(
      await readFile(new URL('../.purge-staging-policy.json', import.meta.url), 'utf8'),
    );
  } catch (err) {
    console.error(`❌ Guard-/argumentfel: ${err.message}`);
    process.exit(1);
  }

  const token = process.env.STAGING_AIRTABLE_TOKEN;
  if (!token) {
    console.error(
      '❌ STAGING_AIRTABLE_TOKEN saknas i env. Lokalt: .env.seed (gitignorad; se ' +
        '.env.seed.example). Token = least-privilege-PAT scopad till ENBART staging-basen ' +
        '(data.records:read + data.records:write).',
    );
    process.exit(1);
  }

  // TASK-84: EFTER guard-, argument- och token-kontrollerna, FÖRE första
  // begäran mot Airtable. Kolliderar en seed-körning med CI:s staging-purge
  // kan granskningsdata försvinna mitt i Marcus pågående granskning — precis
  // det korsläsningen mot .purge-staging-policy.json finns för att förhindra,
  // fast från den aktör ingen av mutexarna såg. Gäller båda vägarna (create
  // och --clean) och även --dry-run, som läser basen.
  kravStagingLedigt('lokal seed:review');

  try {
    let kod;
    if (args.legacy) {
      // Legacy-läget kör ALDRIG svepet: det rör en fixtur utanför skriptets
      // markörer, och att blanda de två vägarna i en körning gör utfallet
      // svårläst i loggen.
      kod = await korLegacy({ args, config: CONFIG, token });
    } else if (args.sweep) {
      await korSweep({ config: CONFIG, token, dryRun: args.dryRun });
      kod = 0;
    } else if (args.clean) {
      kod = await korClean({ args, config: CONFIG, token });
      if (!args.ingenSvep) await korSweep({ config: CONFIG, token, dryRun: args.dryRun });
    } else {
      kod = await korCreate({ args, config: CONFIG, token, purgePolicy });
    }
    process.exit(kod);
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
