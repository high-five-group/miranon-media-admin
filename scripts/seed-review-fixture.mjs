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
//   npm run seed:review:clean                 # radera default-fixturen
//   npm run seed:review:clean -- --ort ZZ-X --dry-run
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
  return config;
}

/** Tolka argv. Kastar med läsbart fel vid ogiltig inmatning. */
export function parseArgs(argv, config) {
  const args = {
    clean: argv.includes('--clean'),
    dryRun: argv.includes('--dry-run'),
    ort: config.defaults.ort,
    bekraftade: config.defaults.bekraftade,
    obekraftade: config.defaults.obekraftade,
    dagar: config.defaults.dagar,
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
      default:
        break;
    }
  }
  const totalt = args.bekraftade + args.obekraftade;
  if (!args.clean && totalt === 0) {
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

/** Eventets fält. `Månad/år` sätts ALDRIG — se doc-kommentar i main. */
export function buildEvent({ ort, startdatum, slutdatum, maxPlatser, config }) {
  return {
    'Event (source)': config.select.eventSource,
    Typ: config.select.eventTyp,
    Ort: ort,
    Startdatum: startdatum,
    Slutdatum: slutdatum,
    Status: config.select.eventStatus,
    'Max antal platser': maxPlatser,
    Eventtyp: [config.eventformatRecordId],
    Notering:
      `${config.marker.noteringSentinel} Granskningsfixtur skapad av scripts/seed-review-fixture.mjs. ` +
      'Syntetisk data i staging — raderas med `npm run seed:review:clean -- --ort ' +
      `${ort}\`.`,
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
  const eventFalt = buildEvent({ ort: args.ort, startdatum, slutdatum, maxPlatser, config });

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
  console.log(`Städa efteråt: npm run seed:review:clean -- --ort ${args.ort}`);
  return 0;
}

async function korClean({ args, config, token }) {
  const { expectedBaseId, tables, requestThrottleMs, batchSize } = config;
  const slug = slugify(args.ort);
  const pattern = fixtureEmailPattern(slug, config.marker);
  const emailFormula = fixtureEmailFormula(slug, config.marker);

  console.log(
    `Städning av granskningsfixtur "${args.ort}" i ${expectedBaseId}` +
      `${args.dryRun ? ' — DRY RUN, inget raderas' : ''}`,
  );

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
    return 0;
  }
  if (args.dryRun) {
    console.log('\nDry run klar — inget raderades.');
    return 0;
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

  try {
    const kod = args.clean
      ? await korClean({ args, config: CONFIG, token })
      : await korCreate({ args, config: CONFIG, token, purgePolicy });
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
