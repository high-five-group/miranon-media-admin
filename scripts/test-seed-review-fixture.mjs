#!/usr/bin/env node
// scripts/test-seed-review-fixture.mjs — tester för seed-skriptets pura
// guard- och byggfunktioner (samma konvention som
// scripts/test-purge-staging-sentinels.mjs och scripts/test-check-*.sh:
// verktygsskript bär eget test-skript, körs lokalt vid skript-utveckling).
//
// Kör: node scripts/test-seed-review-fixture.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.
//
// Testfallen kodar de fyra dyrköpta fällorna:
//   1. Purge-kollisionen — en fixtur som matchar setup-purgens mönster
//      försvinner mitt under granskningen. Korsläses mot den SKARPA policyn.
//   2. De permanenta fixturerna — personerna ZZ-Arbetsko / ZZ-History
//      (TASK-31) och eventen ZZ-belaggning-fixtur / ZZ-arbetsko-fixtur
//      (Event-681 / Event-845, TASK-114) — bär exakta assertions och får
//      aldrig raderas eller länkas till.
//   3. Datumvalet — fixturen ska ligga nära i tiden, inte i 2026-09-15-klustret.
//   4. Beläggningen — `Anmäld beläggning (%)` får aldrig nå 100 % (A6).

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  arForaldralosFixturperson,
  arIsoDatum,
  avslutningsOrsak,
  betalstatusFor,
  buildDeltaganden,
  buildEvent,
  buildRegistrations,
  buildRikAnteckningar,
  buildRikHistoryEventSpecs,
  buildRikPrimaryRad,
  buildRikTouchpoints,
  CONFIG,
  chunk,
  eventUrl,
  fixtureEmail,
  fixtureEmailFormula,
  fixtureEmailPattern,
  harOrt,
  isFixtureEmailRecord,
  isFixtureEvent,
  isoDatum,
  isoTidBakat,
  kapacitetFor,
  lankadeIdn,
  legacyEmailFormula,
  legacyRakningsavvikelser,
  legacyRegisterOversikt,
  parseArgs,
  parseUtgangsdatum,
  personLinkGuardTrips,
  planClean,
  planLegacyClean,
  planSweep,
  purgeCollisions,
  slugify,
  sweepEventFormula,
  utgangsstampel,
  validateConfig,
} from './seed-review-fixture.mjs';

const PURGE_POLICY = JSON.parse(
  readFileSync(new URL('../.purge-staging-policy.json', import.meta.url), 'utf8'),
);

const NU = new Date('2026-07-26T12:00:00.000Z');

/**
 * Default-fixturens rader — indata till varje markör-test nedan. Att de byggs
 * av buildRegistrations i stället för att skrivas för hand är poängen: testet
 * prövar de adresser skriptet FAKTISKT skriver, inte en avskrift av dem.
 */
const DEFAULTRADER = buildRegistrations({
  ort: CONFIG.defaults.ort,
  bekraftade: CONFIG.defaults.bekraftade,
  obekraftade: CONFIG.defaults.obekraftade,
  nu: NU,
  config: CONFIG,
});

let failed = 0;
function t(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`❌ ${name}: ${err.message}`);
  }
}

// --- Skyddsräcke 1: bas-guarden ---

t('den skarpa CONFIG passerar validateConfig', () => {
  assert.equal(validateConfig(CONFIG), CONFIG);
});

t('CONFIG pekar på STAGING, aldrig prod', () => {
  assert.equal(CONFIG.expectedBaseId, 'apphjj8Q7lkXCMsL4');
  assert.ok(CONFIG.forbiddenBaseIds.includes('app8uGPrVCVOm6LfD'), 'prod måste vara blockerad');
});

t('prod-basen som expectedBaseId REFUSERAS', () => {
  assert.throws(
    () => validateConfig({ ...CONFIG, expectedBaseId: 'app8uGPrVCVOm6LfD' }),
    /BLOCKERAD/,
  );
});

t('icke-app-formad bas refuseras (tabell-ID i bas-fältet)', () => {
  assert.throws(
    () => validateConfig({ ...CONFIG, expectedBaseId: 'tblVE3UKWl1CKrphV' }),
    /app-formad/,
  );
});

t('tom forbiddenBaseIds refuseras — prod måste vara blockerad', () => {
  assert.throws(() => validateConfig({ ...CONFIG, forbiddenBaseIds: [] }), /forbiddenBaseIds/);
});

t('saknad Eventtyp-rad refuseras (ADR-066 b5 kräver länken vid create)', () => {
  assert.throws(() => validateConfig({ ...CONFIG, eventformatRecordId: '' }), /rec-formad/);
});

t('tomt select-värde refuseras — pinnade värden är kontraktet utan schema-scope', () => {
  assert.throws(
    () => validateConfig({ ...CONFIG, select: { ...CONFIG.select, eventStatus: '' } }),
    /select\.eventStatus/,
  );
});

t('beläggnings-tak på 100 % refuseras (A6 skickar fullbokat-notis)', () => {
  assert.throws(
    () => validateConfig({ ...CONFIG, belaggning: { maxKvot: 1, minPlatser: 20 } }),
    /maxKvot/,
  );
});

// --- FÄLLA 1: purge-kollisionen ---

/** Varje markörbärande värde default-fixturen faktiskt skriver. */
const defaultSamples = () => [
  { table: 'Eventplanering', field: 'Ort', value: CONFIG.defaults.ort },
  ...DEFAULTRADER.filter((r) => typeof r.anmalan.Ort === 'string').map((r) => ({
    table: 'Anmälningar',
    field: 'Ort',
    value: r.anmalan.Ort,
  })),
  ...DEFAULTRADER.map((r) => ({
    table: 'Anmälningar',
    field: 'E-post',
    value: r.anmalan['E-post'],
  })),
];

t('FÄLLA 1: default-fixturens markörer kolliderar ALDRIG med skarpa purge-policyn', () => {
  assert.deepEqual(purgeCollisions(defaultSamples(), PURGE_POLICY), []);
});

t('FÄLLA 1: den REALISTISKA orten är lika immun — vakten prövar, antar inte', () => {
  // TASK-97 bytte ZZ-GRANSKNING-FIXTUR mot en riktig svensk stad. Immuniteten
  // får inte vila på att någon minns att purgen bara jagar ZZ-create-event-test.
  for (const stad of ['Varberg', 'Rönninge', 'Ödeshög', 'Falköping', 'Skövde', 'Östersund']) {
    assert.deepEqual(
      purgeCollisions(
        [
          { table: 'Eventplanering', field: 'Ort', value: stad },
          { table: 'Anmälningar', field: 'Ort', value: stad },
        ],
        PURGE_POLICY,
      ),
      [],
      `${stad} får aldrig kunna purgas`,
    );
  }
});

t('FÄLLA 1: vakten FÅNGAR en fixtur som skulle purgas (Ort = ZZ-create-event-test)', () => {
  const hits = purgeCollisions(
    [{ table: 'Eventplanering', field: 'Ort', value: 'ZZ-create-event-test' }],
    PURGE_POLICY,
  );
  assert.equal(hits.length, 1);
  assert.equal(hits[0].target, 'create-event-sentineler');
});

t('FÄLLA 1: vakten FÅNGAR en create-test+<uuid>@staging.test-adress', () => {
  const hits = purgeCollisions(
    [
      {
        table: 'Anmälningar',
        field: 'E-post',
        value: 'create-test+01234567-89ab-4cde-8f01-23456789abcd@staging.test',
      },
    ],
    PURGE_POLICY,
  );
  assert.equal(hits.length, 1);
  assert.equal(hits[0].target, 'create-registration-sentineler');
});

t('FÄLLA 1: fixtur-domänerna ligger utanför purgens @staging.test-mönster', () => {
  for (const doman of CONFIG.marker.emailDomains) {
    assert.notEqual(doman, 'staging.test');
    assert.ok(!doman.endsWith('.staging.test'));
  }
  assert.ok(!CONFIG.marker.tidigareEmailPrefix.startsWith('create-test+'));
});

// --- FÄLLA 2: de permanenta fixturerna ---

t('FÄLLA 2: ZZ-Arbetsko och ZZ-History står i protectedRecordIds', () => {
  assert.ok(CONFIG.protectedRecordIds.includes('rec7F8jYc7rczwwkM'), 'ZZ-Arbetsko Person 01');
  assert.ok(CONFIG.protectedRecordIds.includes('recqxaFNwHAdQlAqb'), 'ZZ-History Person 01');
});

t('FÄLLA 2: en skyddad person raderas ALDRIG — inte ens med matchande e-post', () => {
  const pattern = fixtureEmailPattern(CONFIG.marker);
  const plan = planClean({
    events: [],
    registrations: [],
    persons: [
      {
        id: 'rec7F8jYc7rczwwkM',
        fields: { 'E-post': DEFAULTRADER[0].person['E-post'] },
      },
    ],
    ort: CONFIG.defaults.ort,
    pattern,
    config: CONFIG,
  });
  assert.deepEqual(plan.persons, []);
  assert.equal(plan.skippedPersons[0].orsak, 'skyddad record-ID (permanent fixtur)');
});

t('FÄLLA 2: skriptet skapar EGNA personer — varje adress är fixtur-formad', () => {
  const pattern = fixtureEmailPattern(CONFIG.marker);
  for (const rad of DEFAULTRADER) {
    assert.ok(
      pattern.test(rad.person['E-post']),
      `${rad.person['E-post']} måste matcha fixtur-mönstret`,
    );
    assert.ok(!CONFIG.protectedRecordIds.includes(rad.person['E-post']));
  }
});

t('FÄLLA 2: event-fixturerna Event-681 och Event-845 står i protectedRecordIds (TASK-114)', () => {
  assert.ok(
    CONFIG.protectedRecordIds.includes('recIFrxHZw165ycXk'),
    'ZZ-belaggning-fixtur (EventKey Event-681)',
  );
  assert.ok(
    CONFIG.protectedRecordIds.includes('recZyRIzbqWSifAQO'),
    'ZZ-arbetsko-fixtur (EventKey Event-845)',
  );
});

t('FÄLLA 2: ett skyddat event raderas ALDRIG — inte ens med matchande Ort + sentinel', () => {
  // Planterat kollisionsfall: det permanenta beläggnings-eventet bär här (mot
  // förmodan) BÅDE clean-ortens Ort och Notering-sentinelen. Utan record-ID-
  // skyddet hade isFixtureEvent klassat det för radering — exakt det läge
  // skyddsräcke 3 lovar bort ("inte ens om de mot förmodan matchar en markör").
  const pattern = fixtureEmailPattern(CONFIG.marker);
  const plan = planClean({
    events: [
      {
        id: 'recIFrxHZw165ycXk',
        fields: {
          Ort: CONFIG.defaults.ort,
          Notering: `${CONFIG.marker.noteringSentinel} planterat kollisionsfall`,
        },
      },
    ],
    registrations: [],
    persons: [],
    ort: CONFIG.defaults.ort,
    pattern,
    config: CONFIG,
  });
  assert.deepEqual(plan.events, []);
  assert.equal(plan.skippedEvents[0].orsak, 'skyddad record-ID');
});

t('FÄLLA 2: listans ordning är bärande — personerna står först (index 0 adresseras)', () => {
  assert.equal(CONFIG.protectedRecordIds[0], 'rec7F8jYc7rczwwkM');
  assert.equal(CONFIG.protectedRecordIds[1], 'recqxaFNwHAdQlAqb');
});

// --- FÄLLA 3: datumvalet ---

t('FÄLLA 3: default-dagar lägger eventet nära i tiden, långt från 2026-09-15-klustret', () => {
  assert.ok(CONFIG.defaults.dagar > 0 && CONFIG.defaults.dagar <= 14);
  const start = isoDatum(NU, CONFIG.defaults.dagar);
  assert.equal(start, '2026-08-03');
  assert.notEqual(start, '2026-09-15');
});

t('FÄLLA 3: slutdatum är dagen efter start (Eventformatet är Dag 1 + Dag 2)', () => {
  assert.equal(isoDatum(NU, 8), '2026-08-03');
  assert.equal(isoDatum(NU, 9), '2026-08-04');
});

t('isoDatum klarar månadsskifte', () => {
  assert.equal(isoDatum(new Date('2026-12-30T00:00:00.000Z'), 3), '2027-01-02');
});

// --- FÄLLA 4: beläggningen ---

t('FÄLLA 4: kapaciteten håller beläggningen under taket för hela spannet', () => {
  for (let n = 1; n <= CONFIG.limits.maxAnmalningar; n += 1) {
    const platser = kapacitetFor(n, CONFIG.belaggning);
    assert.ok(n / platser <= CONFIG.belaggning.maxKvot, `${n}/${platser} överskrider taket`);
    assert.ok(n / platser < 1, 'beläggningen får aldrig nå 100 % (A6)');
  }
});

t('FÄLLA 4: 16 anmälningar ger 30 platser (53 % beläggning)', () => {
  assert.equal(kapacitetFor(16, CONFIG.belaggning), 30);
});

t('FÄLLA 4: golvet håller även för en enda anmälan', () => {
  assert.equal(kapacitetFor(1, CONFIG.belaggning), CONFIG.belaggning.minPlatser);
});

// --- Argument-tolkning ---

t('default-argumenten är 8 + 8 på default-orten', () => {
  const a = parseArgs([], CONFIG);
  assert.equal(a.bekraftade, 8);
  assert.equal(a.obekraftade, 8);
  assert.equal(a.ort, CONFIG.defaults.ort);
  assert.equal(a.dagar, 8);
  assert.equal(a.clean, false);
  assert.equal(a.dryRun, false);
});

t('flaggorna tolkas', () => {
  const a = parseArgs(
    [
      '--ort',
      'ZZ-TEST-ORT',
      '--bekraftade',
      '3',
      '--obekraftade',
      '5',
      '--dagar',
      '2',
      '--dry-run',
    ],
    CONFIG,
  );
  assert.equal(a.ort, 'ZZ-TEST-ORT');
  assert.equal(a.bekraftade, 3);
  assert.equal(a.obekraftade, 5);
  assert.equal(a.dagar, 2);
  assert.equal(a.dryRun, true);
});

t('--clean känns igen', () => {
  assert.equal(parseArgs(['--clean'], CONFIG).clean, true);
});

t('ort med citattecken REFUSERAS (värdet går in i filterByFormula)', () => {
  assert.throws(() => parseArgs(['--ort', "ZZ-O'Brien"], CONFIG), /avvisas/);
  assert.throws(() => parseArgs(['--ort', 'ZZ-"X"'], CONFIG), /avvisas/);
});

t('för kort ort refuseras', () => {
  assert.throws(() => parseArgs(['--ort', 'ZZ'], CONFIG), /avvisas/);
});

t('icke-numeriska och negativa antal refuseras', () => {
  assert.throws(() => parseArgs(['--bekraftade', 'åtta'], CONFIG), /heltal/);
  assert.throws(() => parseArgs(['--obekraftade', '-1'], CONFIG), /heltal/);
  assert.throws(() => parseArgs(['--dagar', '1.5'], CONFIG), /heltal/);
});

t('taket för totalt antal anmälningar hålls', () => {
  assert.throws(() => parseArgs(['--bekraftade', '40', '--obekraftade', '40'], CONFIG), /taket/);
});

t('0 + 0 refuseras i create-läget men är giltigt för clean', () => {
  assert.throws(
    () => parseArgs(['--bekraftade', '0', '--obekraftade', '0'], CONFIG),
    /inget att skapa/,
  );
  assert.equal(
    parseArgs(['--clean', '--bekraftade', '0', '--obekraftade', '0'], CONFIG).clean,
    true,
  );
});

// --- Markörer ---

t('slugify ger formel- och e-post-säkra tecken', () => {
  assert.equal(slugify('ZZ-GRANSKNING-FIXTUR'), 'zz-granskning-fixtur');
  assert.equal(slugify('Skövde Åre'), 'skovde-are');
  assert.match(slugify('ZZ  Test..Ort'), /^[a-z0-9-]+$/);
});

// ═══════════════════════════════════════════════════════════════════════════
// TASK-97 — REALISTISK DATA UTAN ATT TAPPA GREPPET
//
// Marcus 2026-08-10: "riktiga namn, riktiga e-postadresser, riktiga orter …
// det ska likna verkligheten, inte massa ZZ-skit överallt." Sviten nedan är
// tvåsidig: varje test om att adressen ser ÄKTA ut har en motpart som bevisar
// att den ändå aldrig kan vara någons — och att clean fortfarande hittar den.
// ═══════════════════════════════════════════════════════════════════════════

t('TASK-97: e-posten är fornamn.efternamn på en RFC 2606-reserverad domän', () => {
  assert.equal(fixtureEmail('Astrid', 'Almqvist', 0, CONFIG.marker), 'astrid.almqvist@example.com');
  assert.equal(fixtureEmail('Åke', 'Törnqvist', 1, CONFIG.marker), 'ake.tornqvist@example.org');
  assert.equal(fixtureEmail('Össur', 'Ödman', 2, CONFIG.marker), 'ossur.odman@example.net');
  // Rotationen börjar om — listan ska inte se maskinstansad ut.
  assert.equal(fixtureEmail('Bengt', 'Kvist', 3, CONFIG.marker), 'bengt.kvist@example.com');
});

t('TASK-97: INGEN fixtur-adress ligger på en icke-reserverad domän', () => {
  // Hela realism-argumentet vilar på reservationen: en adress på example.com
  // kan aldrig tilldelas någon. Faller den raden är "ser äkta ut" en risk.
  for (const rad of DEFAULTRADER) {
    assert.match(
      rad.anmalan['E-post'],
      /@example\.(com|org|net)$/,
      `${rad.anmalan['E-post']} ligger utanför RFC 2606 § 3`,
    );
  }
});

t('TASK-97 · RÖD SIDA: en icke-reserverad domän REFUSERAS av validateConfig', () => {
  for (const doman of ['miranon.se', 'gmail.com', 'example.se', 'staging.test']) {
    assert.throws(
      () => validateConfig({ ...CONFIG, marker: { ...CONFIG.marker, emailDomains: [doman] } }),
      /RFC 2606/,
      `${doman} måste refuseras`,
    );
  }
  assert.throws(
    () => validateConfig({ ...CONFIG, marker: { ...CONFIG.marker, emailDomains: [] } }),
    /emailDomains saknas/,
  );
});

t('TASK-97: namnpoolen måste reducera till rena [a-z] — annars matchar inte mönstret', () => {
  // Namnet BÄR adressens local-part sedan TASK-97. Ett namn som ger bindestreck
  // hade gett en adress cleanens ankrade mönster inte känner igen — och raden
  // hade lämnats kvar tyst, först upptäckt vid städningen.
  assert.throws(
    () => validateConfig({ ...CONFIG, fornamn: [...CONFIG.fornamn, 'Anna-Lena'] }),
    /local-part måste bli rena/,
  );
  assert.throws(
    () => validateConfig({ ...CONFIG, efternamn: [...CONFIG.efternamn, "O'Brien"] }),
    /local-part måste bli rena/,
  );
  assert.throws(() => validateConfig({ ...CONFIG, fornamn: [] }), /fornamn saknas/);
});

t('TASK-97: mönstret matchar den NYA formen — och den pre-TASK-97:a', () => {
  const p = fixtureEmailPattern(CONFIG.marker);
  assert.ok(p.test('astrid.almqvist@example.com'));
  assert.ok(p.test('viktor.zetterlund@example.org'));
  assert.ok(p.test('hanna.rehn@example.net'));
  // Formen skriptet skrev FÖRE bytet. Utan den vore varje fixtur som redan
  // ligger i staging ostädbar från och med denna commit.
  assert.ok(p.test('seed-review+zz-granskning-s103-01@granskning.test'));
  assert.ok(p.test('seed-review+zz-granskning-fixtur-16@granskning.test'));
});

t('TASK-97 · GRÖN SIDA: mönstret matchar ALDRIG en riktig, permanent eller legacy-rad', () => {
  const p = fixtureEmailPattern(CONFIG.marker);
  const forbjudna = [
    ['lotta@miranon.se', 'riktig adress'],
    ['roger.andersson@miranon.se', 'riktig adress med punkt i local-part'],
    ['zz-lead-person-01@staging.test', 'permanent lead-fixtur (asserteras vid värde)'],
    ['zz-arbetsko-person01@staging.test', 'permanent rollup-fixtur'],
    ['zz-granskning-15@staging.test', 'S91-fixturen (legacy-registrets område)'],
    ['granskning-review@example.com', 'Skövde-fixturen (legacy-registrets område)'],
    ['granskning-review-plus1@example.com', 'samma, med suffix'],
    ['create-test+01234567-89ab-4cde-8f01-23456789abcd@staging.test', 'purge-ägd sentinel'],
    ['astrid.almqvist@example.se', 'nära miss: icke-reserverad domän'],
    ['astrid@example.com', 'nära miss: ingen punkt i local-part'],
    ['astrid.almqvist.b@example.com', 'nära miss: tre led'],
  ];
  for (const [adress, vad] of forbjudna) {
    assert.ok(!p.test(adress), `${vad}: ${adress} får ALDRIG matcha`);
  }
});

t('TASK-97: grovfiltret är formel-säkert och täcker båda formerna', () => {
  assert.equal(
    fixtureEmailFormula(CONFIG.marker),
    "OR(FIND('@example.com', {E-post}) > 0, FIND('@example.org', {E-post}) > 0, " +
      "FIND('@example.net', {E-post}) > 0, FIND('@granskning.test', {E-post}) > 0)",
  );
  assert.ok(!fixtureEmailFormula(CONFIG.marker).includes("''"), 'inga tomma citattecken');
});

t('TASK-97: default-orten är en RIKTIG svensk stad — men aldrig legacy-ankarets', () => {
  assert.ok(!/^ZZ-/i.test(CONFIG.defaults.ort), 'ingen ZZ-prefixad default-ort kvar');
  for (const post of CONFIG.legacy) {
    assert.notEqual(
      CONFIG.defaults.ort,
      post.ort,
      `default-orten får inte krocka med legacy-posten ${post.namn} — dess guard hade larmat`,
    );
  }
});

t('TASK-97: anmälans Ort = eventets ort, på prods andel av raderna', () => {
  const medOrt = DEFAULTRADER.filter((r) => 'Ort' in r.anmalan);
  const utanOrt = DEFAULTRADER.filter((r) => !('Ort' in r.anmalan));
  for (const rad of medOrt) assert.equal(rad.anmalan.Ort, CONFIG.defaults.ort);
  assert.ok(utanOrt.length > 0, 'luckan MÅSTE finnas — prod är inte uniformt');
  assert.ok(medOrt.length > utanOrt.length, 'de allra flesta rader bär Ort');
  // Fältet UTELÄMNAS på luckraderna; en tomsträng hade gett rollupen ett tomt
  // element i stället för ingen post alls.
  for (const rad of utanOrt) assert.equal(rad.anmalan.Ort, undefined);
});

t('TASK-97: andelen med Ort landar på prods ~82 % över hela taket', () => {
  const rader = buildRegistrations({
    ort: 'Varberg',
    bekraftade: CONFIG.limits.maxAnmalningar,
    obekraftade: 0,
    nu: NU,
    config: CONFIG,
  });
  const andel = rader.filter((r) => 'Ort' in r.anmalan).length / rader.length;
  assert.ok(
    Math.abs(andel - CONFIG.realism.ortKvot) < 0.05,
    `andelen ${(andel * 100).toFixed(1)} % ska ligga nära ${CONFIG.realism.ortKvot * 100} %`,
  );
});

t('TASK-97: harOrt är deterministisk, jämnt spridd, och ger rad 0 en Ort', () => {
  assert.equal(harOrt(0, 0.82), true, 'listans första rad ska inte se trasig ut');
  // Samma index ⇒ samma svar, alltid. Ingen slump, inget beroende av klockan.
  for (let i = 0; i < 200; i += 1) assert.equal(harOrt(i, 0.82), harOrt(i, 0.82));
  // Luckorna klumpar inte ihop sig: aldrig två i rad vid 82 %.
  for (let i = 1; i < 200; i += 1) {
    assert.ok(harOrt(i, 0.82) || harOrt(i - 1, 0.82), `två luckor i rad vid index ${i}`);
  }
  // Ytterlägena: kvot 1 fyller allt.
  for (let i = 0; i < 50; i += 1) assert.equal(harOrt(i, 1), true);
});

t('TASK-97 · RÖD SIDA: en ogiltig ortKvot REFUSERAS', () => {
  for (const kvot of [0, -0.5, 1.5, undefined, 'mycket']) {
    assert.throws(
      () => validateConfig({ ...CONFIG, realism: { ortKvot: kvot } }),
      /ortKvot/,
      `${kvot} måste refuseras`,
    );
  }
});

t('TASK-97: personen får ALDRIG Telefon — Marcus-beslutet, mekaniserat', () => {
  for (const rad of DEFAULTRADER) {
    assert.equal('Telefon' in rad.person, false, 'Telefon visas inte i personlistan');
    assert.deepEqual(Object.keys(rad.person).sort(), ['E-post', 'Efternamn', 'Förnamn']);
    // …medan anmälans Mobilnummer är ett ANNAT fält och sätts som förut.
    assert.match(rad.anmalan.Mobilnummer, /^070-/);
  }
});

t('TASK-97: länkfälten är obligatoriska — de bär identifieringen', () => {
  for (const nyckel of ['eventAnmalningar', 'anmalanPerson', 'personAnmalningar']) {
    assert.throws(
      () =>
        validateConfig({ ...CONFIG, linkFields: { ...CONFIG.linkFields, [nyckel]: undefined } }),
      new RegExp(`linkFields\\.${nyckel} saknas`),
    );
  }
});

// --- Event-bygget ---

t('eventet bär Eventtyp-länken (ADR-066 b5) och sätter ALDRIG Månad/år', () => {
  const e = buildEvent({
    ort: 'ZZ-GRANSKNING-FIXTUR',
    startdatum: '2026-08-03',
    slutdatum: '2026-08-04',
    maxPlatser: 30,
    utgangsdatum: '2026-08-13',
    config: CONFIG,
  });
  assert.deepEqual(e.Eventtyp, ['recclDd7hUQsfxoVs']);
  assert.equal('Månad/år' in e, false, 'Månad/år härleds klientside ur Startdatum');
  assert.equal(e.Status, 'Planerat');
  assert.equal(e['Event (source)'], 'Fjärrskådning');
  assert.equal(e.Typ, 'Utbildning');
  assert.ok(e.Notering.startsWith(CONFIG.marker.noteringSentinel));
});

t('eventet sätter inga formel-/system-fält', () => {
  const e = buildEvent({
    ort: 'ZZ-X',
    startdatum: '2026-08-03',
    slutdatum: '2026-08-04',
    maxPlatser: 30,
    utgangsdatum: '2026-08-13',
    config: CONFIG,
  });
  for (const forbjudet of ['EventKey', 'Event-nr', 'Eventlabel', 'Event (text)', 'Säsong']) {
    assert.equal(forbjudet in e, false, `${forbjudet} är computed och får aldrig skrivas`);
  }
});

// --- Anmälnings-bygget (realismen) ---

const RADER = buildRegistrations({
  ort: 'ZZ-GRANSKNING-FIXTUR',
  bekraftade: 8,
  obekraftade: 8,
  nu: NU,
  config: CONFIG,
});

t('rätt antal, rätt statusfördelning', () => {
  assert.equal(RADER.length, 16);
  assert.equal(RADER.filter((r) => r.anmalan.Status === 'Bekräftad (mail skickat)').length, 8);
  assert.equal(RADER.filter((r) => r.anmalan.Status === 'Obekräftad').length, 8);
});

t('Källa blandas: Manuell (kategori-pillen) och TOM (formuläranmälan)', () => {
  const manuella = RADER.filter((r) => r.anmalan.Källa === 'Manuell').length;
  const formular = RADER.filter((r) => !('Källa' in r.anmalan)).length;
  assert.equal(manuella, 8);
  assert.equal(formular, 8);
});

t('tom Källa UTELÄMNAS — tomsträng vore en ogiltig option (ingen typecast)', () => {
  const utanKalla = RADER.find((r) => !('Källa' in r.anmalan));
  assert.ok(utanKalla, 'minst en formuläranmälan förväntas');
  assert.equal(utanKalla.anmalan.Källa, undefined);
});

t('Bekräftelse skickad sätts på ALLA bekräftade och på INGEN obekräftad', () => {
  for (const r of RADER) {
    const harBekraftelse = 'Bekräftelse skickad' in r.anmalan;
    assert.equal(harBekraftelse, r.anmalan.Status === 'Bekräftad (mail skickat)');
  }
});

t('Inskickad är utspridd bakåt och strikt fallande i ålder (kön: äldst först)', () => {
  const tider = RADER.map((r) => Date.parse(r.anmalan.Inskickad));
  for (let i = 1; i < tider.length; i += 1) {
    assert.ok(tider[i] > tider[i - 1], `rad ${i} ska vara nyare än rad ${i - 1}`);
  }
  assert.ok(
    tider.every((ms) => ms < NU.getTime()),
    'ingen anmälan får ligga i framtiden',
  );
  const spann = (tider.at(-1) - tider[0]) / 86_400_000;
  assert.ok(spann > 25, `spannet ska vara flera veckor, var ${spann.toFixed(1)} dagar`);
});

t('Bekräftelse skickad ligger aldrig i framtiden', () => {
  for (const r of RADER) {
    if (!('Bekräftelse skickad' in r.anmalan)) continue;
    assert.ok(Date.parse(r.anmalan['Bekräftelse skickad']) < NU.getTime());
  }
});

t('betalstatus varieras i BÅDA grupperna — ingen vy blir enfärgad', () => {
  const bekraftade = RADER.filter((r) => r.anmalan.Status === 'Bekräftad (mail skickat)');
  const obekraftade = RADER.filter((r) => r.anmalan.Status === 'Obekräftad');
  assert.ok(new Set(bekraftade.map((r) => r.anmalan.Anmälningsavgift)).size > 1);
  assert.ok(new Set(bekraftade.map((r) => r.anmalan.Slutbetalning)).size > 1);
  assert.ok(new Set(obekraftade.map((r) => r.anmalan.Anmälningsavgift)).size > 1);
});

t('betalstatus använder ENDAST pinnade select-värden', () => {
  const giltiga = new Set([CONFIG.select.betalningMottagen, CONFIG.select.betalningEjMottagen]);
  for (let i = 0; i < 30; i += 1) {
    for (const bekraftad of [true, false]) {
      const b = betalstatusFor(i, bekraftad, CONFIG.select);
      assert.ok(giltiga.has(b.Anmälningsavgift));
      assert.ok(giltiga.has(b.Slutbetalning));
    }
  }
});

t('namn och e-post är unika över hela taket', () => {
  const rader = buildRegistrations({
    ort: 'ZZ-GRANSKNING-FIXTUR',
    bekraftade: CONFIG.limits.maxAnmalningar,
    obekraftade: 0,
    nu: NU,
    config: CONFIG,
  });
  const epost = new Set(rader.map((r) => r.anmalan['E-post']));
  const namn = new Set(rader.map((r) => `${r.person.Förnamn} ${r.person.Efternamn}`));
  assert.equal(epost.size, CONFIG.limits.maxAnmalningar, 'e-post måste vara unika');
  assert.equal(namn.size, CONFIG.limits.maxAnmalningar, 'namn måste vara unika');
});

t('personen speglar anmälans namn/e-post — Person-länken bär historikraden', () => {
  for (const r of RADER) {
    assert.equal(r.person['E-post'], r.anmalan['E-post']);
    assert.equal(r.person.Förnamn, r.anmalan.Förnamn);
    assert.equal(r.person.Efternamn, r.anmalan.Efternamn);
  }
});

t('personen sätter inga formel-/rollup-fält', () => {
  for (const forbjudet of ['Namn', 'Antal genomförda event', 'Erfarenhetsbadge']) {
    assert.equal(forbjudet in RADER[0].person, false);
  }
});

t('en enda anmälan fungerar (ingen division med noll i spridningen)', () => {
  const [rad] = buildRegistrations({
    ort: 'ZZ-X',
    bekraftade: 1,
    obekraftade: 0,
    nu: NU,
    config: CONFIG,
  });
  assert.ok(Date.parse(rad.anmalan.Inskickad) < NU.getTime());
});

t('bygget är deterministiskt — samma indata ger identisk fixtur', () => {
  const a = buildRegistrations({
    ort: 'ZZ-X',
    bekraftade: 4,
    obekraftade: 4,
    nu: NU,
    config: CONFIG,
  });
  const b = buildRegistrations({
    ort: 'ZZ-X',
    bekraftade: 4,
    obekraftade: 4,
    nu: NU,
    config: CONFIG,
  });
  assert.deepEqual(a, b);
});

t('isoTidBakat ger stabila, giltiga ISO-timestamps', () => {
  assert.equal(isoTidBakat(NU, 10, 0), '2026-07-16T07:00:00.000Z');
  assert.match(isoTidBakat(NU, 3, 5), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
});

// --- Clean-planen ---

const PATTERN = fixtureEmailPattern(CONFIG.marker);
const FIXTUR_EPOST = DEFAULTRADER[0].person['E-post'];
const ORT = CONFIG.defaults.ort;

t('fixtur-eventet kräver BÅDE rätt Ort OCH notering-sentineln', () => {
  const medSentinel = {
    id: 'recA',
    fields: { Ort: ORT, Notering: `${CONFIG.marker.noteringSentinel} …` },
  };
  const utanSentinel = {
    id: 'recB',
    fields: { Ort: ORT, Notering: 'Riktigt event i samma stad' },
  };
  const utanNotering = { id: 'recC', fields: { Ort: ORT } };
  assert.equal(isFixtureEvent(medSentinel, ORT, CONFIG.marker), true);
  assert.equal(isFixtureEvent(utanSentinel, ORT, CONFIG.marker), false);
  assert.equal(isFixtureEvent(utanNotering, ORT, CONFIG.marker), false);
});

t('Ort-matchen är EXAKT — prefix räcker inte (S91-fixturen överlever)', () => {
  const s91 = {
    id: 'recBepsw4Qy9scfoj',
    fields: { Ort: 'ZZ-GRANSKNING-S91', Notering: `${CONFIG.marker.noteringSentinel} …` },
  };
  assert.equal(isFixtureEvent(s91, 'ZZ-GRANSKNING', CONFIG.marker), false);
  assert.equal(isFixtureEvent(s91, 'ZZ-GRANSKNING-FIXTUR', CONFIG.marker), false);
});

t('länk-guarden skyddar en person med Anteckningar (S103: ÄNDRAD från Deltaganden)', () => {
  const rec = {
    id: 'recD',
    fields: { 'E-post': FIXTUR_EPOST, 'Anteckningar 2': ['recQWjimysYJrkY0n'] },
  };
  assert.deepEqual(personLinkGuardTrips(rec, CONFIG.personDataLinkFields), ['Anteckningar 2']);
});

t('Anmälningar-länken triggar INTE guarden — den är fixturens egen', () => {
  const rec = {
    id: 'recE',
    fields: { 'E-post': FIXTUR_EPOST, 'Anmälningar (länkat fält)': ['recAAAABBBBCCCCDD'] },
  };
  assert.deepEqual(personLinkGuardTrips(rec, CONFIG.personDataLinkFields), []);
});

t(
  'S103 · BEVIS I BÅDA RIKTNINGAR: Deltaganden triggar INTE längre guarden (RIK-LÄGET kräver det)',
  () => {
    const rec = {
      id: 'recRik',
      fields: { 'E-post': FIXTUR_EPOST, Deltaganden: ['recX'], Touchpoints: ['recY'] },
    };
    assert.deepEqual(
      personLinkGuardTrips(rec, CONFIG.personDataLinkFields),
      [],
      'en person med ENDAST Deltaganden/Touchpoints ska vara städbar — stadaOrt raderar dem explicit',
    );
  },
);

t(
  'S103: en person med BÅDE Deltaganden OCH Anteckningar fälls fortfarande — bara Anteckningar rapporteras',
  () => {
    const rec = {
      id: 'recBada',
      fields: {
        'E-post': FIXTUR_EPOST,
        Deltaganden: ['recX'],
        'Anteckningar 2': ['recZ'],
      },
    };
    assert.deepEqual(personLinkGuardTrips(rec, CONFIG.personDataLinkFields), ['Anteckningar 2']);
  },
);

t('planClean klassar radera/skyddad/länkad/icke-markerad korrekt', () => {
  const plan = planClean({
    events: [
      {
        id: 'recEv1',
        fields: { Ort: ORT, Notering: `${CONFIG.marker.noteringSentinel} x` },
      },
      { id: 'recEv2', fields: { Ort: ORT, Notering: 'Riktigt event' } },
    ],
    registrations: [
      { id: 'recAn1', fields: { 'E-post': FIXTUR_EPOST } },
      { id: 'recAn2', fields: { 'E-post': 'lotta@miranon.se' } },
    ],
    persons: [
      { id: 'recPe1', fields: { 'E-post': FIXTUR_EPOST } },
      { id: 'recPe2', fields: { 'E-post': FIXTUR_EPOST, 'Anteckningar 2': ['recX'] } },
      { id: 'recqxaFNwHAdQlAqb', fields: { 'E-post': FIXTUR_EPOST } },
    ],
    ort: ORT,
    pattern: PATTERN,
    config: CONFIG,
  });
  assert.deepEqual(plan.events, ['recEv1']);
  assert.deepEqual(plan.registrations, ['recAn1']);
  assert.deepEqual(plan.persons, ['recPe1']);
  assert.equal(plan.skippedEvents.length, 1);
  assert.equal(plan.skippedRegistrations.length, 1);
  assert.equal(plan.skippedPersons.length, 2);
});

t('clean raderar INGENTING när inget bär markören (fail-safe)', () => {
  const plan = planClean({
    events: [{ id: 'recBepsw4Qy9scfoj', fields: { Ort: 'ZZ-GRANSKNING-S91' } }],
    registrations: [{ id: 'recR', fields: { 'E-post': 'zz-granskning-15@staging.test' } }],
    persons: [{ id: 'recP', fields: { 'E-post': 'zz-arbetsko-person01@staging.test' } }],
    ort: ORT,
    pattern: PATTERN,
    config: CONFIG,
  });
  assert.deepEqual(plan.events, []);
  assert.deepEqual(plan.registrations, []);
  assert.deepEqual(plan.persons, []);
});

t('saknat E-post-fält matchar aldrig', () => {
  assert.equal(isFixtureEmailRecord({ id: 'recF', fields: {} }, PATTERN), false);
});

// ═══════════════════════════════════════════════════════════════════════════
// TASK-97 — LÄNKGRAFEN ÄR CLEANENS BÄRANDE IDENTIFIERING
//
// E-posten kan inte längre koda orten (den ska se äkta ut), så grafen gör det
// i stället: event med sentinel → dess anmälningar → deras Person-länkar.
// Sviten är tvåsidig: den prövar att grafen NÅR sina egna rader, och att den
// inte kan nå någon annans.
// ═══════════════════════════════════════════════════════════════════════════

/** Ett fixtur-event med angivna anmälnings-länkar. */
const grafEvent = (id, anmalningar, ort = ORT) => ({
  id,
  fields: {
    Ort: ort,
    Notering: `${CONFIG.marker.noteringSentinel} [UTGÅR: 2026-08-24] fixtur`,
    [CONFIG.linkFields.eventAnmalningar]: anmalningar,
  },
});

t('TASK-97: grafen läser eventets anmälnings-länkar i ordning och utan dubbletter', () => {
  const idn = lankadeIdn(
    [grafEvent('recEv1', ['recAn1', 'recAn2']), grafEvent('recEv2', ['recAn2', 'recAn3'])],
    CONFIG.linkFields.eventAnmalningar,
  );
  assert.deepEqual(idn, ['recAn1', 'recAn2', 'recAn3']);
});

t('TASK-97: tomt eller saknat länkfält ger tom lista — aldrig ett kast', () => {
  assert.deepEqual(lankadeIdn([], CONFIG.linkFields.eventAnmalningar), []);
  assert.deepEqual(lankadeIdn([{ id: 'recEv', fields: {} }], 'Person'), []);
  assert.deepEqual(lankadeIdn([{ id: 'recEv' }], 'Person'), [], 'ett event utan anmälningar är OK');
  assert.deepEqual(lankadeIdn([{ id: 'recEv', fields: { Person: [] } }], 'Person'), []);
});

t('TASK-97 · GRÖN SIDA: ett VERKLIGT event i samma stad bidrar med NOLL rader', () => {
  // Kärnan i bytet från ZZ-ort till riktig stad. Grafen startar i exakt den
  // mängd planClean godkänner — ett event utan sentinel kommer aldrig med, och
  // därmed listas dess anmälningar och personer aldrig ens.
  const events = [
    grafEvent('recFixtur', ['recAn1', 'recAn2']),
    {
      id: 'recVerkligtVarberg',
      fields: {
        Ort: ORT,
        Notering: 'Riktigt event i Varberg — anmälningar från riktiga deltagare',
        [CONFIG.linkFields.eventAnmalningar]: ['recRiktig1', 'recRiktig2'],
      },
    },
  ];
  const plan = planClean({
    events,
    registrations: [],
    persons: [],
    ort: ORT,
    pattern: PATTERN,
    config: CONFIG,
  });
  assert.deepEqual(plan.events, ['recFixtur']);
  const fixturEvents = events.filter((rec) => plan.events.includes(rec.id));
  assert.deepEqual(lankadeIdn(fixturEvents, CONFIG.linkFields.eventAnmalningar), [
    'recAn1',
    'recAn2',
  ]);
});

t('TASK-97 · GRÖN SIDA: ett SKYDDAT event bidrar med noll rader, sentinel eller ej', () => {
  const events = [grafEvent(CONFIG.protectedRecordIds[2], ['recAn1'])];
  const plan = planClean({
    events,
    registrations: [],
    persons: [],
    ort: ORT,
    pattern: PATTERN,
    config: CONFIG,
  });
  assert.deepEqual(plan.events, []);
  assert.deepEqual(
    lankadeIdn(
      events.filter((rec) => plan.events.includes(rec.id)),
      CONFIG.linkFields.eventAnmalningar,
    ),
    [],
    'de permanenta fixturernas anmälningar får aldrig ens listas',
  );
});

t('TASK-97: föräldralös-vägen kräver BÅDA villkoren', () => {
  const falt = CONFIG.linkFields.personAnmalningar;
  const foraldralos = { id: 'recP1', fields: { 'E-post': FIXTUR_EPOST } };
  const tomLista = { id: 'recP2', fields: { 'E-post': FIXTUR_EPOST, [falt]: [] } };
  const harAnmalan = { id: 'recP3', fields: { 'E-post': FIXTUR_EPOST, [falt]: ['recAn1'] } };
  const riktigPerson = { id: 'recP4', fields: { 'E-post': 'lotta@miranon.se' } };
  assert.equal(arForaldralosFixturperson(foraldralos, PATTERN, falt), true);
  assert.equal(arForaldralosFixturperson(tomLista, PATTERN, falt), true);
  assert.equal(
    arForaldralosFixturperson(harAnmalan, PATTERN, falt),
    false,
    'en person med anmälan tillhör en LEVANDE fixtur — grafen äger den, inte svepet',
  );
  assert.equal(
    arForaldralosFixturperson(riktigPerson, PATTERN, falt),
    false,
    'en riktig adress är aldrig föräldralös fixturdata, hur tom länken än är',
  );
});

t('TASK-97 · GRÖN SIDA: en annan LEVANDE fixturs personer kan aldrig fångas', () => {
  // Två samtidiga granskningsfixturer är hela poängen med bytet: e-posten
  // kodar inte längre orten, så det är grafen som håller isär dem.
  const falt = CONFIG.linkFields.personAnmalningar;
  const annanFixturperson = {
    id: 'recAnnan',
    fields: { 'E-post': 'bengt.lindqvist@example.org', [falt]: ['recAnAnnan'] },
  };
  assert.equal(arForaldralosFixturperson(annanFixturperson, PATTERN, falt), false);
});

t('TASK-97: en person grafen pekar ut men vars adress är främmande raderas ALDRIG', () => {
  // Andra spärren. Länken säger "radera", adressen säger nej — nej vinner.
  const plan = planClean({
    events: [],
    registrations: [{ id: 'recAn1', fields: { 'E-post': 'kund@miranon.se' } }],
    persons: [{ id: 'recP1', fields: { 'E-post': 'kund@miranon.se' } }],
    ort: ORT,
    pattern: PATTERN,
    config: CONFIG,
  });
  assert.deepEqual(plan.registrations, []);
  assert.deepEqual(plan.persons, []);
  assert.equal(plan.skippedRegistrations[0].orsak, 'e-post matchar inte fixtur-mönstret');
  assert.equal(plan.skippedPersons[0].orsak, 'e-post matchar inte fixtur-mönstret');
});

t('TASK-97: en fixtur skapad FÖRE bytet är fortfarande städbar', () => {
  // Orkestreraren städar de befintliga ZZ-GRANSKNING-fixturerna med DENNA kod.
  // Faller detta test är de ostädbara — värre än att de var fula.
  const gammalOrt = 'ZZ-GRANSKNING-S103';
  const gammalEpost = 'seed-review+zz-granskning-s103-01@granskning.test';
  const plan = planClean({
    events: [
      {
        id: 'recGammal',
        fields: {
          Ort: gammalOrt,
          Notering: `${CONFIG.marker.noteringSentinel} [UTGÅR: 2026-08-24]`,
        },
      },
    ],
    registrations: [{ id: 'recAn1', fields: { 'E-post': gammalEpost } }],
    persons: [{ id: 'recP1', fields: { 'E-post': gammalEpost } }],
    ort: gammalOrt,
    pattern: PATTERN,
    config: CONFIG,
  });
  assert.deepEqual(plan.events, ['recGammal']);
  assert.deepEqual(plan.registrations, ['recAn1']);
  assert.deepEqual(plan.persons, ['recP1']);
});

// --- Övrigt ---

t('chunk delar i ≤10-batchar (Airtables create/delete-gräns)', () => {
  const b = chunk(
    Array.from({ length: 23 }, (_, i) => i),
    10,
  );
  assert.equal(b.length, 3);
  assert.equal(b[0].length, 10);
  assert.equal(b[2].length, 3);
});

t('batchstorleken överskrider aldrig Airtables gräns', () => {
  assert.ok(CONFIG.batchSize <= 10);
});

t('throttlen håller sig under 5 req/s per bas', () => {
  assert.ok(CONFIG.requestThrottleMs >= 200, '≥200 ms ⇒ ≤5 req/s');
});

t('slutraden är den direkta event-URL:en', () => {
  assert.equal(
    eventUrl(CONFIG.appBaseUrl, 'recBepsw4Qy9scfoj'),
    'http://localhost:5173/event/recBepsw4Qy9scfoj',
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// TASK-95 DEL A — FIXTURENS LIVSTID
//
// Kärnan i sviten nedan är TVÅSIDIG med flit. En städmekanism som bara
// bevisas radera är förenlig med en som raderar ALLT — och det felet vore
// värre än det den lagar, eftersom det tar granskningsdata mitt under en
// pågående granskning. Varje rad-test har därför en motpart som bevisar att
// mekanismen HÅLLER SIG BORTA.
// ═══════════════════════════════════════════════════════════════════════════

const IDAG = new Date('2026-08-01T09:00:00.000Z');

t('DEL A: utgangsstampel bygger stämpeln och REFUSERAR allt som inte är ISO-datum', () => {
  assert.equal(utgangsstampel('2026-08-14', CONFIG.livstid), '[UTGÅR: 2026-08-14]');
  for (const trasigt of [undefined, null, '', '14 aug', '2026-8-14', 20260814]) {
    assert.throws(() => utgangsstampel(trasigt, CONFIG.livstid), /inte ett ISO-datum/);
  }
});

t('DEL A: stämpeln som buildEvent skriver är läsbar av parsern (rundgång)', () => {
  const e = buildEvent({
    ort: 'ZZ-GRANSKNING-FIXTUR',
    startdatum: '2026-08-03',
    slutdatum: '2026-08-04',
    maxPlatser: 30,
    utgangsdatum: '2026-08-13',
    config: CONFIG,
  });
  assert.ok(e.Notering.startsWith(CONFIG.marker.noteringSentinel), 'sentineln måste stå först');
  assert.equal(parseUtgangsdatum(e.Notering, CONFIG), '2026-08-13');
});

t(
  'DEL A: buildEvent utan giltigt utgångsdatum KASTAR — en odödlig fixtur får aldrig skapas tyst',
  () => {
    const bas = {
      ort: 'ZZ-X',
      startdatum: '2026-08-03',
      slutdatum: '2026-08-04',
      maxPlatser: 30,
      config: CONFIG,
    };
    assert.throws(() => buildEvent(bas), /inte ett ISO-datum/);
    assert.throws(() => buildEvent({ ...bas, utgangsdatum: '13 aug' }), /inte ett ISO-datum/);
  },
);

t('DEL A: parsern läser stämpeln oavsett var i noteringen den står', () => {
  const n = `${CONFIG.marker.noteringSentinel} [UTGÅR: 2026-09-01] blabla`;
  assert.equal(parseUtgangsdatum(n, CONFIG), '2026-09-01');
});

t(
  'DEL A: parsern ger null för ingen/trasig/omöjlig stämpel — null betyder ALLTID "rör aldrig"',
  () => {
    const fall = [
      ['Granskningsfixtur S91 — task-48. Raderas efter granskning.', 'handbyggd, ingen stämpel'],
      ['[SEED-REVIEW-FIXTUR] [UTGÅR: ] tom', 'tomt datum'],
      ['[SEED-REVIEW-FIXTUR] [UTGÅR: 2026-13-01] ogiltig månad', 'månad 13'],
      ['[SEED-REVIEW-FIXTUR] [UTGÅR: 2026-02-31] finns inte', 'kalenderdatum som inte finns'],
      ['[SEED-REVIEW-FIXTUR] [UTGÅR: 26-08-13] kort år', 'tvåsiffrigt år'],
      ['[SEED-REVIEW-FIXTUR] [UTGÅR: 2026-08-13 oavslutad', 'ingen stängande klammer'],
      [undefined, 'inget Notering-fält alls'],
    ];
    for (const [notering, vad] of fall) {
      assert.equal(parseUtgangsdatum(notering, CONFIG), null, `${vad} måste ge null`);
    }
  },
);

/** Bygg ett fixtur-event med given stämpel — svepets indata. */
const sweepEvent = (id, ort, utgar) => ({
  id,
  fields: {
    Ort: ort,
    Notering: `${CONFIG.marker.noteringSentinel} [UTGÅR: ${utgar}] Granskningsfixtur.`,
  },
});

t('DEL A · RÖD SIDA: en fixtur vars stämpel PASSERAT klassas som förfallen', () => {
  const plan = planSweep({
    events: [sweepEvent('recGammal', 'ZZ-GRANSKNING-GAMMAL', '2026-07-20')],
    idag: IDAG,
    config: CONFIG,
  });
  assert.equal(plan.forfallna.length, 1);
  assert.equal(plan.forfallna[0].id, 'recGammal');
  assert.equal(plan.forfallna[0].utgar, '2026-07-20');
  assert.deepEqual(plan.aktiva, []);
});

t('DEL A · GRÖN SIDA: en fixtur vars granskning PÅGÅR rörs ALDRIG', () => {
  const plan = planSweep({
    events: [sweepEvent('recAktiv', 'ZZ-GRANSKNING-AKTIV', '2026-08-20')],
    idag: IDAG,
    config: CONFIG,
  });
  assert.deepEqual(plan.forfallna, [], 'en aktiv granskning får ALDRIG städas');
  assert.equal(plan.aktiva.length, 1);
  assert.equal(plan.aktiva[0].utgar, '2026-08-20');
});

t('DEL A · GRÖN SIDA: en fixtur som utgår IDAG får dagen ut (strikt >)', () => {
  const plan = planSweep({
    events: [sweepEvent('recIdag', 'ZZ-GRANSKNING-IDAG', '2026-08-01')],
    idag: IDAG,
    config: CONFIG,
  });
  assert.deepEqual(plan.forfallna, [], 'utgångsdagen själv är fortfarande giltig');
  assert.equal(plan.aktiva.length, 1);
});

t(
  'DEL A · GRÖN SIDA: en fixtur UTAN läsbar stämpel rörs aldrig (handbyggd = legacy-registrets område)',
  () => {
    const plan = planSweep({
      events: [
        {
          id: 'recBepsw4Qy9scfoj',
          fields: {
            Ort: 'ZZ-GRANSKNING-S91',
            Notering: `${CONFIG.marker.noteringSentinel} utan stämpel`,
          },
        },
      ],
      idag: IDAG,
      config: CONFIG,
    });
    assert.deepEqual(plan.forfallna, []);
    assert.equal(plan.utanStampel[0].orsak, 'ingen läsbar utgångsstämpel');
  },
);

t('DEL A · GRÖN SIDA: ett RIKTIGT event utan fixtur-sentinel ignoreras helt av svepet', () => {
  const plan = planSweep({
    events: [
      { id: 'recRiktigt', fields: { Ort: 'Skövde', Notering: 'GRANSKNINGSDATA (S75) …' } },
      { id: 'recTomt', fields: { Ort: 'Göteborg' } },
    ],
    idag: IDAG,
    config: CONFIG,
  });
  assert.deepEqual(plan.forfallna, []);
  assert.deepEqual(plan.aktiva, []);
  assert.deepEqual(plan.utanStampel, [], 'utan sentinel ska raden inte ens klassas');
});

t('DEL A · GRÖN SIDA: ett skyddat record-ID städas aldrig, ens med passerad stämpel', () => {
  const plan = planSweep({
    events: [sweepEvent(CONFIG.protectedRecordIds[0], 'ZZ-X', '2026-01-01')],
    idag: IDAG,
    config: CONFIG,
  });
  assert.deepEqual(plan.forfallna, []);
  assert.equal(plan.utanStampel[0].orsak, 'skyddad record-ID');
});

t('DEL A: svepet skiljer flera fixturer åt i samma körning', () => {
  const plan = planSweep({
    events: [
      sweepEvent('recA', 'ZZ-A', '2026-07-01'),
      sweepEvent('recB', 'ZZ-B', '2026-09-01'),
      sweepEvent('recC', 'ZZ-C', '2026-07-31'),
    ],
    idag: IDAG,
    config: CONFIG,
  });
  assert.deepEqual(
    plan.forfallna.map((f) => f.id),
    ['recA', 'recC'],
  );
  assert.deepEqual(
    plan.aktiva.map((a) => a.id),
    ['recB'],
  );
});

t('DEL A: svepets filterByFormula ankrar sentineln FÖRST i Noteringen', () => {
  assert.equal(sweepEventFormula(CONFIG.marker), "FIND('[SEED-REVIEW-FIXTUR]', {Notering}) = 1");
});

t('DEL A: livstids-konfigurationen är giltig och tvingas fram', () => {
  assert.ok(CONFIG.livstid.dagarDefault >= 1);
  assert.throws(
    () => validateConfig({ ...CONFIG, livstid: { ...CONFIG.livstid, dagarDefault: 0 } }),
    /dagarDefault/,
  );
  assert.throws(
    () => validateConfig({ ...CONFIG, livstid: { ...CONFIG.livstid, stampelPrefix: 'UTGÅR' } }),
    /stampelPrefix/,
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// TASK-95 DEL B — LEGACY-REGISTRET
// ═══════════════════════════════════════════════════════════════════════════

const S91 = CONFIG.legacy.find((p) => p.namn === 'ZZ-GRANSKNING-S91');
const SKOVDE = CONFIG.legacy.find((p) => p.namn === 'Skovde-S75');

/**
 * Samma post som registret bär, fast UTAN avslutningen — den aktiva formen.
 *
 * Bägge registerposterna är avslutade sedan TASK-101, och en avslutad post ger
 * per konstruktion en tom raderingsplan. Ankar-testerna nedan måste därför
 * köras mot den aktiva formen: annars blir de gröna för att posten är
 * avslutad, inte för att record-ID-ankaret eller länk-guarden håller — ett
 * grönt test som bevisar något helt annat än det påstår.
 */
const somAktiv = (post) => {
  const { stadad, ...aktiv } = post;
  return aktiv;
};

t('DEL B: registret bär de två uppmätta fixturerna med sina räkningar', () => {
  assert.ok(S91 && SKOVDE, 'båda posterna måste finnas');
  assert.deepEqual(S91.forvantat, { event: 1, anmalningar: 16, personer: 16 });
  assert.deepEqual(SKOVDE.forvantat, { event: 1, anmalningar: 6, personer: 3 });
  assert.equal(S91.eventRecordId, 'recBepsw4Qy9scfoj');
  assert.equal(SKOVDE.eventRecordId, 'recigcY12dDllUkYt');
});

t('DEL B: ett oankrat legacy-mönster REFUSERAS av validateConfig', () => {
  assert.throws(
    () => validateConfig({ ...CONFIG, legacy: [{ ...S91, emailPattern: 'zz-granskning-' }] }),
    /ankrat i BÅDA ändar/,
  );
  assert.throws(
    () => validateConfig({ ...CONFIG, legacy: [{ ...S91, eventRecordId: '' }] }),
    /rec-formad/,
  );
  assert.throws(
    () => validateConfig({ ...CONFIG, legacy: [{ ...S91, forvantat: { event: 1 } }] }),
    /forvantat\.anmalningar/,
  );
});

t('DEL B · RÖD SIDA: en AKTIV S91-posts faktiska rader klassas för radering', () => {
  const plan = planLegacyClean({
    events: [{ id: 'recBepsw4Qy9scfoj', fields: { Ort: 'ZZ-GRANSKNING-S91' } }],
    registrations: [
      { id: 'recA1', fields: { 'E-post': 'zz-granskning-01@staging.test' } },
      { id: 'recA2', fields: { 'E-post': 'zz-granskning-16@staging.test' } },
    ],
    persons: [{ id: 'recP1', fields: { 'E-post': 'zz-granskning-01@staging.test' } }],
    post: somAktiv(S91),
    config: CONFIG,
  });
  assert.deepEqual(plan.events, ['recBepsw4Qy9scfoj']);
  assert.deepEqual(plan.registrations, ['recA1', 'recA2']);
  assert.deepEqual(plan.persons, ['recP1']);
});

t('DEL B · RÖD SIDA: en AKTIV Skövde-posts faktiska rader klassas för radering', () => {
  const plan = planLegacyClean({
    events: [{ id: 'recigcY12dDllUkYt', fields: { Ort: 'Skövde' } }],
    registrations: [
      { id: 'recB1', fields: { 'E-post': 'granskning-review@example.com' } },
      { id: 'recB2', fields: { 'E-post': 'granskning-scroll-3@example.com' } },
    ],
    persons: [{ id: 'recP2', fields: { 'E-post': 'granskning-review-plus1@example.com' } }],
    post: somAktiv(SKOVDE),
    config: CONFIG,
  });
  assert.deepEqual(plan.events, ['recigcY12dDllUkYt']);
  assert.equal(plan.registrations.length, 2);
  assert.deepEqual(plan.persons, ['recP2']);
});

t('DEL B · GRÖN SIDA: ett ANNAT event med Ort "Skövde" skyddas av record-ID-ankaret', () => {
  // Skövde är ett RIKTIGT ortsnamn. Utan ID-ankaret hade ett verkligt
  // Skövde-event fångats av ort-filtret och raderats. Detta är registrets
  // enskilt viktigaste guard.
  const plan = planLegacyClean({
    events: [{ id: 'recVerkligtSkovde', fields: { Ort: 'Skövde' } }],
    registrations: [],
    persons: [],
    post: somAktiv(SKOVDE),
    config: CONFIG,
  });
  assert.deepEqual(plan.events, [], 'ett verkligt Skövde-event får ALDRIG raderas');
  assert.match(plan.skipped[0].orsak, /record-ID matchar inte registrets ankare/);
});

t('DEL B · GRÖN SIDA: rätt record-ID men FEL Ort skyddas också', () => {
  const plan = planLegacyClean({
    events: [{ id: 'recigcY12dDllUkYt', fields: { Ort: 'Göteborg' } }],
    registrations: [],
    persons: [],
    post: somAktiv(SKOVDE),
    config: CONFIG,
  });
  assert.deepEqual(plan.events, []);
  assert.match(plan.skipped[0].orsak, /Ort "Göteborg" matchar inte/);
});

t('DEL B · GRÖN SIDA: legacy-mönstren matchar ALDRIG riktiga eller permanenta adresser', () => {
  const forbjudna = [
    'lotta@miranon.se',
    'roger@miranon.se',
    'zz-arbetsko-person01@staging.test',
    'create-test+01234567-89ab-4cde-8f01-23456789abcd@staging.test',
    'seed-review+zz-granskning-fixtur-01@granskning.test',
    // TASK-97:s realistiska form. Skövde-postens mönster ligger på SAMMA
    // domän (`granskning-…@example.com`) — bindestrecks-formen mot punkt-
    // formen är det enda som skiljer dem, och det måste hålla.
    'astrid.almqvist@example.com',
    'viktor.zetterlund@example.org',
  ];
  for (const post of CONFIG.legacy) {
    const p = new RegExp(post.emailPattern);
    for (const adress of forbjudna) {
      assert.ok(!p.test(adress), `${post.namn} får aldrig matcha ${adress}`);
    }
  }
});

t('DEL B · GRÖN SIDA: de två legacy-posterna kan aldrig matcha varandras rader', () => {
  assert.ok(!new RegExp(S91.emailPattern).test('granskning-review@example.com'));
  assert.ok(!new RegExp(SKOVDE.emailPattern).test('zz-granskning-01@staging.test'));
});

t('DEL B · GRÖN SIDA: länk-guarden och protectedRecordIds gäller även i legacy-läget', () => {
  const plan = planLegacyClean({
    events: [],
    registrations: [],
    persons: [
      {
        id: 'recLankad',
        fields: { 'E-post': 'zz-granskning-02@staging.test', 'Anteckningar 2': ['recX'] },
      },
      { id: 'rec7F8jYc7rczwwkM', fields: { 'E-post': 'zz-granskning-03@staging.test' } },
    ],
    post: somAktiv(S91),
    config: CONFIG,
  });
  assert.deepEqual(plan.persons, [], 'ingen av de två får raderas');
  const orsak = (id) => plan.skipped.find((s) => s.id === id)?.orsak ?? '';
  assert.match(orsak('rec7F8jYc7rczwwkM'), /skyddad record-ID/);
  assert.match(orsak('recLankad'), /länk-guard: Anteckningar 2/);
});

t('DEL B: räknings-guarden är TYST när basen stämmer mot mätningen', () => {
  const plan = {
    events: ['e'],
    registrations: Array.from({ length: 16 }, (_, i) => `a${i}`),
    persons: Array.from({ length: 16 }, (_, i) => `p${i}`),
  };
  assert.deepEqual(legacyRakningsavvikelser(plan, somAktiv(S91)), []);
});

t('DEL B · RÖD SIDA: räknings-guarden FÄLLER när basen avviker från mätningen', () => {
  const plan = { events: ['e'], registrations: ['a1'], persons: [] };
  const avvikelser = legacyRakningsavvikelser(plan, somAktiv(S91));
  assert.equal(avvikelser.length, 2);
  assert.match(avvikelser[0], /anmalningar: förväntade 16, fann 1/);
  assert.match(avvikelser[1], /personer: förväntade 16, fann 0/);
});

t('DEL B: legacy-grovfiltret ankras server-side och fångar inte den andra posten', () => {
  assert.equal(
    legacyEmailFormula(SKOVDE),
    "FIND('granskning-', LOWER({E-post} & '')) = 1",
    'position 1 utesluter zz-granskning-… där prefixet står på position 4',
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// TASK-101 — LEGACY-REGISTRETS AVSLUTNING
//
// Två tillstånd ska gå att skilja åt: "fixturen ligger kvar" och "fixturen är
// städad". Sviten nedan är tvåsidig av samma skäl som DEL A: en avslutning som
// bara bevisas HINDRA radering är förenlig med en som hindrar ALLT — och då
// vore registret värdelöst för nästa handbyggda fixtur. Varje spärr-test har
// därför en motpart som bevisar att den AKTIVA vägen fortfarande fungerar, och
// att räknings-guarden fortfarande fäller.
// ═══════════════════════════════════════════════════════════════════════════

t('TASK-101: båda registerposterna bär en avslutning med datum OCH referens', () => {
  for (const post of [S91, SKOVDE]) {
    assert.ok(post.stadad, `${post.namn} måste bära stadad`);
    assert.ok(arIsoDatum(post.stadad.datum), `${post.namn}.stadad.datum måste vara ISO`);
    assert.ok(post.stadad.av.length > 0, `${post.namn}.stadad.av måste peka någonstans`);
  }
  assert.equal(S91.stadad.datum, '2026-07-31');
  assert.match(S91.stadad.av, /TASK-95/);
  assert.equal(SKOVDE.stadad.datum, '2026-07-31');
  assert.match(SKOVDE.stadad.av, /TASK-101/);
});

t('TASK-101: kalla-proveniensen är BEVARAD ordagrant — avslutningen kastar inte historiken', () => {
  // Vem byggde fixturen, när, och vem mätte den. Texten är hela skälet till att
  // posten står kvar i registret i stället för att raderas ur det.
  assert.match(S91.kalla, /Handbyggd 2026-07-26 \(S91, task-48 design-review\)/);
  assert.match(S91.kalla, /Mätt av TASK-88, omräknad av TASK-95 2026-07-30/);
  assert.match(S91.kalla, /Marcus godkände städning 2026-07-30/);
  assert.match(SKOVDE.kalla, /Handbyggd 2026-07-22 \(S75 review-våg 1, betalningsvy/);
  assert.match(SKOVDE.kalla, /ett RIKTIGT\s+ortsnamn, därav record-ID-ankaret/);
  // …och städningens utfall är TILLAGT, inte ersättande.
  assert.match(S91.kalla, /STÄDAD 2026-07-31 av TASK-95: 33 poster raderade/);
  assert.match(SKOVDE.kalla, /STÄDAD 2026-07-31 .*6\/6 anmälningar, 3\/3 personer/s);
});

t('TASK-101: forvantat står KVAR på en avslutad post — räkningen är historik, inte skräp', () => {
  // Guardens egen instruktion ("mät om, uppdatera forvantat") hade gett {0,0,0}
  // och kastat mätningen. Att den står kvar är formens kärna.
  assert.deepEqual(S91.forvantat, { event: 1, anmalningar: 16, personer: 16 });
  assert.deepEqual(SKOVDE.forvantat, { event: 1, anmalningar: 6, personer: 3 });
});

t('TASK-101: validateConfig KRÄVER forvantat även på en avslutad post', () => {
  assert.throws(
    () =>
      validateConfig({
        ...CONFIG,
        legacy: [{ ...S91, forvantat: { event: 1, anmalningar: 16 } }],
      }),
    /forvantat\.personer saknas — räkningen är guarden/,
  );
});

t('TASK-101 · RÖD SIDA: en AVSLUTAD post kan INTE radera något — basen till trots', () => {
  // Exakt de rader som den aktiva formen klassar för radering (testet ovan).
  const plan = planLegacyClean({
    events: [{ id: 'recBepsw4Qy9scfoj', fields: { Ort: 'ZZ-GRANSKNING-S91' } }],
    registrations: [
      { id: 'recA1', fields: { 'E-post': 'zz-granskning-01@staging.test' } },
      { id: 'recA2', fields: { 'E-post': 'zz-granskning-16@staging.test' } },
    ],
    persons: [{ id: 'recP1', fields: { 'E-post': 'zz-granskning-01@staging.test' } }],
    post: S91,
    config: CONFIG,
  });
  assert.deepEqual(plan.events, [], 'en avslutad post raderar aldrig ett event');
  assert.deepEqual(plan.registrations, [], 'en avslutad post raderar aldrig en anmälan');
  assert.deepEqual(plan.persons, [], 'en avslutad post raderar aldrig en person');
  assert.equal(plan.skipped.length, 4, 'varje rad ska redovisas, inte tyst släppas');
  for (const s of plan.skipped) assert.match(s.orsak, /posten är AVSLUTAD/);
});

t('TASK-101 · RÖD SIDA: avslutningen håller även när räkningen stämmer EXAKT mot forvantat', () => {
  // Det starkaste fallet: allt en aktiv post kräver är uppfyllt — rätt
  // record-ID, rätt Ort, matchande adresser, räkningen 1/6/3 exakt. Ändå tom
  // plan. Spärren kan alltså inte kringgås genom att återskapa fixturen.
  const plan = planLegacyClean({
    events: [{ id: 'recigcY12dDllUkYt', fields: { Ort: 'Skövde' } }],
    registrations: Array.from({ length: 6 }, (_, i) => ({
      id: `recB${i}`,
      fields: { 'E-post': `granskning-rad-${i}@example.com` },
    })),
    persons: Array.from({ length: 3 }, (_, i) => ({
      id: `recP${i}`,
      fields: { 'E-post': `granskning-person-${i}@example.com` },
    })),
    post: SKOVDE,
    config: CONFIG,
  });
  assert.deepEqual(plan.events, []);
  assert.deepEqual(plan.registrations, []);
  assert.deepEqual(plan.persons, []);
  assert.equal(plan.skipped.length, 10);
});

t('TASK-101 · GRÖN SIDA: den AKTIVA vägen är oförändrad — spärren gäller bara avslutade', () => {
  // Motparten. Utan detta vore "avslutningen hindrar radering" förenligt med
  // "registret kan inte längre radera någonting alls".
  const indata = {
    events: [{ id: 'recBepsw4Qy9scfoj', fields: { Ort: 'ZZ-GRANSKNING-S91' } }],
    registrations: [{ id: 'recA1', fields: { 'E-post': 'zz-granskning-01@staging.test' } }],
    persons: [{ id: 'recP1', fields: { 'E-post': 'zz-granskning-01@staging.test' } }],
    config: CONFIG,
  };
  const aktiv = planLegacyClean({ ...indata, post: somAktiv(S91) });
  const avslutad = planLegacyClean({ ...indata, post: S91 });
  assert.deepEqual(aktiv.events, ['recBepsw4Qy9scfoj'], 'aktiv post raderar fortfarande');
  assert.deepEqual(aktiv.registrations, ['recA1']);
  assert.deepEqual(aktiv.persons, ['recP1']);
  assert.deepEqual(avslutad.events, [], 'samma indata, avslutad post ⇒ ingenting');
});

t('TASK-101 · GRÖN SIDA: räknings-guarden FÄLLER fortfarande för en aktiv post', () => {
  // Guarden är TASK-95:s skarpaste, och den ska inte försvagas av detta kort.
  const plan = planLegacyClean({
    events: [{ id: 'recigcY12dDllUkYt', fields: { Ort: 'Skövde' } }],
    registrations: [{ id: 'recB1', fields: { 'E-post': 'granskning-review@example.com' } }],
    persons: [],
    post: somAktiv(SKOVDE),
    config: CONFIG,
  });
  const avvikelser = legacyRakningsavvikelser(plan, somAktiv(SKOVDE));
  assert.equal(avvikelser.length, 2, 'anmälningar 1≠6 och personer 0≠3 ska båda fällas');
  assert.match(avvikelser[0], /anmalningar: förväntade 6, fann 1/);
  assert.match(avvikelser[1], /personer: förväntade 3, fann 0/);
});

// --- Avslutningens form valideras ---

t('TASK-101: en avslutning UTAN datum refuseras', () => {
  assert.throws(
    () => validateConfig({ ...CONFIG, legacy: [{ ...S91, stadad: { av: 'TASK-95' } }] }),
    /stadad\.datum "undefined" är inget giltigt ISO-datum/,
  );
});

t('TASK-101: en avslutning med OMÖJLIGT kalenderdatum refuseras', () => {
  // 2026-02-31 passerar en ren regex men finns inte — samma kalender-prövning
  // som utgångsstämpeln, via arIsoDatum.
  for (const trasigt of ['2026-02-31', '2026-13-01', '31 juli 2026', '2026-7-31', '']) {
    assert.throws(
      () =>
        validateConfig({
          ...CONFIG,
          legacy: [{ ...S91, stadad: { datum: trasigt, av: 'TASK-95' } }],
        }),
      /stadad\.datum/,
      `"${trasigt}" måste refuseras`,
    );
  }
});

t('TASK-101: en avslutning utan landnings-referens refuseras', () => {
  for (const tom of [undefined, '', '   ', 42]) {
    assert.throws(
      () =>
        validateConfig({
          ...CONFIG,
          legacy: [{ ...S91, stadad: { datum: '2026-07-31', av: tom } }],
        }),
      /stadad\.av saknas/,
      `av=${JSON.stringify(tom)} måste refuseras`,
    );
  }
});

t('TASK-101: en stadad som inte är ett objekt refuseras', () => {
  for (const fel of ['2026-07-31', true, 17, null]) {
    assert.throws(
      () => validateConfig({ ...CONFIG, legacy: [{ ...S91, stadad: fel }] }),
      /stadad måste vara ett objekt/,
      `stadad=${JSON.stringify(fel)} måste refuseras`,
    );
  }
});

t('TASK-101 · GRÖN SIDA: en post UTAN stadad passerar — fältet är valfritt', () => {
  assert.doesNotThrow(() => validateConfig({ ...CONFIG, legacy: [somAktiv(S91)] }));
});

// --- Läsbarhet utan att köra skriptet ---

t('TASK-101: avslutningsOrsak nämner både datum och landnings-referens', () => {
  const orsak = avslutningsOrsak(S91);
  assert.match(orsak, /AVSLUTAD/);
  assert.match(orsak, /2026-07-31/);
  assert.match(orsak, /TASK-95/);
});

t('TASK-101: registeröversikten kan ALDRIG visa en avslutad post som aktiv', () => {
  const oversikt = legacyRegisterOversikt(CONFIG);
  assert.equal(
    oversikt,
    'ZZ-GRANSKNING-S91 (AVSLUTAD 2026-07-31), Skovde-S75 (AVSLUTAD 2026-07-31)',
  );
  // …och en aktiv post märks som aktiv, annars vore märkningen meningslös.
  assert.equal(legacyRegisterOversikt({ legacy: [somAktiv(S91)] }), 'ZZ-GRANSKNING-S91 (aktiv)');
  assert.equal(legacyRegisterOversikt({ legacy: [] }), '(registret är tomt)');
});

t('TASK-101: felmeddelandet för okänt --legacy-namn bär tillståndet, inte bara namnen', () => {
  assert.throws(
    () => parseArgs(['--legacy', 'ZZ-HITTEPÅ'], CONFIG),
    /ZZ-GRANSKNING-S91 \(AVSLUTAD 2026-07-31\)/,
  );
});

t('TASK-101 · GRÖN SIDA: en avslutad post GÖMS inte — --legacy hittar den fortfarande', () => {
  // Formen "flytta posten till en egen legacyStadade-lista" hade gett
  // "finns inte i registret", vilket är missvisande: posten fanns, den är städad.
  const a = parseArgs(['--legacy', 'ZZ-GRANSKNING-S91'], CONFIG);
  assert.equal(a.legacy.namn, 'ZZ-GRANSKNING-S91');
  assert.ok(a.legacy.stadad, 'uppslagningen ska bära avslutningen så korLegacy kan rapportera den');
});

// --- arIsoDatum, delad av avslutningen och utgångsstämpeln ---

t('TASK-101: arIsoDatum är kalender-validerad, inte bara formmässig', () => {
  for (const giltigt of ['2026-07-31', '2024-02-29', '2026-12-31']) {
    assert.equal(arIsoDatum(giltigt), true, `${giltigt} är ett verkligt datum`);
  }
  for (const ogiltigt of [
    '2026-02-31',
    '2025-02-29',
    '2026-13-01',
    '2026-00-10',
    '26-07-31',
    '2026-7-31',
    '',
    undefined,
    null,
    20260731,
  ]) {
    assert.equal(arIsoDatum(ogiltigt), false, `${ogiltigt} måste avvisas`);
  }
});

t('TASK-101: utgångsstämpelns parser delar kalender-prövning med avslutningen', () => {
  // Refaktoreringen får inte ha ändrat svepets beteende.
  assert.equal(parseUtgangsdatum('[SEED-REVIEW-FIXTUR] [UTGÅR: 2026-08-13]', CONFIG), '2026-08-13');
  assert.equal(parseUtgangsdatum('[SEED-REVIEW-FIXTUR] [UTGÅR: 2026-02-31]', CONFIG), null);
});

// ═══════════════════════════════════════════════════════════════════════════
// AC #4 — SKYDDSRÄCKE 2 INTAKT EFTER ÄNDRINGEN
//
// Mekaniskt mot den SKARPA .purge-staging-policy.json, aldrig antaget. En
// granskningsfixtur får ALDRIG bli purge-bar; att lägga en target hade varit
// att riva skyddet, inte att laga det.
// ═══════════════════════════════════════════════════════════════════════════

t('AC #4: purge-policyn har NOLL target som kan matcha en granskningsfixtur', () => {
  const samples = [
    ...defaultSamples(),
    // Legacy-fixturernas markörer måste vara lika immuna.
    ...CONFIG.legacy.map((p) => ({ table: 'Eventplanering', field: 'Ort', value: p.ort })),
    { table: 'Anmälningar', field: 'E-post', value: 'zz-granskning-01@staging.test' },
    { table: 'Anmälningar', field: 'E-post', value: 'granskning-review@example.com' },
    // Den pre-TASK-97:a formen ligger kvar i basen tills orkestreraren städat.
    {
      table: 'Anmälningar',
      field: 'E-post',
      value: 'seed-review+zz-granskning-s103-01@granskning.test',
    },
  ];
  assert.deepEqual(purgeCollisions(samples, PURGE_POLICY), []);
});

t('AC #4: ingen purge-target nämner ZZ-GRANSKNING — direkt mot policy-filen', () => {
  for (const target of PURGE_POLICY.targets) {
    assert.ok(
      !/ZZ-GRANSKNING/i.test(target.exactMatchPattern) &&
        !/ZZ-GRANSKNING/i.test(target.filterByFormula),
      `target "${target.name}" åberopar ZZ-GRANSKNING — skyddsräcke 2 är rivet`,
    );
  }
});

t('AC #4: utgångsstämpeln ligger i Notering, ett fält ingen purge-target läser', () => {
  const lastaFalt = new Set(PURGE_POLICY.targets.map((t2) => t2.exactMatchField));
  assert.ok(!lastaFalt.has('Notering'), 'stämpeln får aldrig bli purge-bar via Notering');
});

// --- Argument-tolkning för de nya lägena ---

t('TASK-95: de nya flaggorna tolkas', () => {
  assert.equal(parseArgs(['--sweep'], CONFIG).sweep, true);
  assert.equal(parseArgs(['--ingen-svep'], CONFIG).ingenSvep, true);
  assert.equal(parseArgs(['--livstid', '30'], CONFIG).livstid, 30);
  assert.equal(parseArgs([], CONFIG).livstid, CONFIG.livstid.dagarDefault);
  assert.equal(parseArgs(['--legacy', 'Skovde-S75'], CONFIG).legacy.namn, 'Skovde-S75');
});

t('TASK-95: legacy-läget är DRY RUN tills --bekrafta ges', () => {
  assert.equal(parseArgs(['--legacy', 'Skovde-S75'], CONFIG).bekrafta, false);
  assert.equal(parseArgs(['--legacy', 'Skovde-S75', '--bekrafta'], CONFIG).bekrafta, true);
});

t('TASK-95 · fail-safe: --dry-run vinner ALLTID över --bekrafta', () => {
  const a = parseArgs(['--legacy', 'Skovde-S75', '--bekrafta', '--dry-run'], CONFIG);
  assert.equal(a.bekrafta, false, 'anges båda är avsikten att titta, inte radera');
});

t('TASK-95: ett okänt legacy-namn refuseras med registret utskrivet', () => {
  assert.throws(() => parseArgs(['--legacy', 'ZZ-HITTEPÅ'], CONFIG), /finns inte i registret/);
});

t('TASK-95: lägena kan inte kombineras', () => {
  assert.throws(() => parseArgs(['--clean', '--sweep'], CONFIG), /kan inte kombineras/);
  assert.throws(() => parseArgs(['--sweep', '--legacy', 'Skovde-S75'], CONFIG), /ETT läge/);
});

t('TASK-95: --livstid utanför spannet refuseras', () => {
  assert.throws(() => parseArgs(['--livstid', '0'], CONFIG), /heltal/);
  assert.throws(() => parseArgs(['--livstid', '999'], CONFIG), /heltal/);
});

t('TASK-95: --sweep och --legacy kräver inga anmälningar (0 + 0 är giltigt)', () => {
  assert.equal(
    parseArgs(['--sweep', '--bekraftade', '0', '--obekraftade', '0'], CONFIG).sweep,
    true,
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// S103 — RIK-LÄGET (--rik): den rika personens kravbild
// ═══════════════════════════════════════════════════════════════════════════

t('--rik tolkas av parseArgs', () => {
  assert.equal(parseArgs(['--rik'], CONFIG).rik, true);
  assert.equal(parseArgs([], CONFIG).rik, false);
});

t('--rik kan INTE kombineras med --clean/--sweep/--legacy', () => {
  assert.throws(() => parseArgs(['--rik', '--clean'], CONFIG), /--rik/);
  assert.throws(() => parseArgs(['--rik', '--sweep'], CONFIG), /--rik/);
  assert.throws(() => parseArgs(['--rik', '--legacy', 'Skovde-S75'], CONFIG), /--rik/);
});

t('validateConfig: richPerson.historyDagarBak saknas refuseras', () => {
  const utanRik = { ...CONFIG, richPerson: { ...CONFIG.richPerson, historyDagarBak: [] } };
  assert.throws(() => validateConfig(utanRik), /historyDagarBak/);
});

t(
  'validateConfig: mismatchande längder mellan historyDagarBak/historyEventSources refuseras',
  () => {
    const fel = {
      ...CONFIG,
      richPerson: { ...CONFIG.richPerson, historyEventSources: ['Fjärrskådning'] },
    };
    assert.throws(() => validateConfig(fel), /historyEventSources/);
  },
);

t('validateConfig: minst ETT historik-event måste bära ≥2 sessionsrader (AC: tvådagars)', () => {
  const fel = {
    ...CONFIG,
    richPerson: {
      ...CONFIG.richPerson,
      historySessions: CONFIG.richPerson.historySessions.map((s) => [s[0]]),
    },
  };
  assert.throws(() => validateConfig(fel), /tvådagars/);
});

t('validateConfig: motiveringar kräver minst en 400–600-tecken-text (AC)', () => {
  const fel = {
    ...CONFIG,
    richPerson: {
      ...CONFIG.richPerson,
      motiveringar: CONFIG.richPerson.motiveringar.map((m) => (m ? 'kort' : m)),
    },
  };
  assert.throws(() => validateConfig(fel), /400–600/);
});

t('validateConfig: motiveringar kräver minst en KORT text (< 150 tecken)', () => {
  const lang = 'x'.repeat(500);
  const fel = {
    ...CONFIG,
    richPerson: { ...CONFIG.richPerson, motiveringar: [lang, lang, null, lang] },
  };
  assert.throws(() => validateConfig(fel), /kort/);
});

t('validateConfig: anteckningar kräver minst TVÅ olika författare (AC)', () => {
  const fel = {
    ...CONFIG,
    richPerson: {
      ...CONFIG.richPerson,
      anteckningar: CONFIG.richPerson.anteckningar.map((a) => ({ ...a, forfattare: 'Lotta' })),
    },
  };
  assert.throws(() => validateConfig(fel), /olika författare/);
});

t('validateConfig: den skarpa CONFIG.richPerson håller alla egna krav', () => {
  // Om detta test går rött har CONFIG själv drivit ifrån sina egna guards —
  // samma disciplin som "den skarpa CONFIG passerar validateConfig" ovan.
  assert.equal(validateConfig(CONFIG), CONFIG);
});

const NU_RIK = new Date('2026-08-10T12:00:00.000Z');

t('buildRikPrimaryRad: e-post matchar fixtur-mönstret och skiljer sig från batchens rader', () => {
  const rad = buildRikPrimaryRad({ ort: ORT, nu: NU_RIK, index: 16, config: CONFIG });
  assert.ok(PATTERN.test(rad.anmalan['E-post']), 'måste matcha samma clean-mönster som batchen');
  assert.ok(
    !DEFAULTRADER.some((r) => r.anmalan['E-post'] === rad.anmalan['E-post']),
    'index 16 ligger utanför default-batchens 0..15 — ingen namnkrock',
  );
});

t(
  'buildRikPrimaryRad: bär Telefon + Flagga (medvetet avsteg, se § DATAN SKA LIKNA VERKLIGHETEN)',
  () => {
    const rad = buildRikPrimaryRad({ ort: ORT, nu: NU_RIK, index: 16, config: CONFIG });
    assert.equal(rad.person.Telefon, CONFIG.richPerson.telefon);
    assert.equal(rad.person.Flagga, CONFIG.richPerson.flagga);
  },
);

t('buildRikPrimaryRad: Ort sätts alltid (100 %) — ingen lucka för DEN här personen', () => {
  const rad = buildRikPrimaryRad({ ort: ORT, nu: NU_RIK, index: 16, config: CONFIG });
  assert.equal(rad.anmalan.Ort, ORT);
});

t('buildRikPrimaryRad: bär den KORTA motiveringen (sista posten i richPerson.motiveringar)', () => {
  const rad = buildRikPrimaryRad({ ort: ORT, nu: NU_RIK, index: 16, config: CONFIG });
  const kort = CONFIG.richPerson.motiveringar.at(-1);
  assert.equal(rad.anmalan['Varför vill du gå den här utbildningen?'], kort);
});

t('buildRikPrimaryRad är deterministisk — samma indata ger samma rad', () => {
  const a = buildRikPrimaryRad({ ort: ORT, nu: NU_RIK, index: 16, config: CONFIG });
  const b = buildRikPrimaryRad({ ort: ORT, nu: NU_RIK, index: 16, config: CONFIG });
  assert.deepEqual(a, b);
});

t('buildRikHistoryEventSpecs: en spec per historyDagarBak-post, alla i DÅTID', () => {
  const specs = buildRikHistoryEventSpecs({ nu: NU_RIK, config: CONFIG });
  assert.equal(specs.length, CONFIG.richPerson.historyDagarBak.length);
  for (const spec of specs) {
    assert.ok(new Date(spec.startdatum) < NU_RIK, `${spec.startdatum} måste ligga före nu`);
    assert.equal(spec.status, CONFIG.select.eventStatusGenomfort);
  }
});

t(
  'buildRikHistoryEventSpecs: minst en spec bär ≥2 sessionsrader (tvådagars-AC:et, bevisat på byggd data)',
  () => {
    const specs = buildRikHistoryEventSpecs({ nu: NU_RIK, config: CONFIG });
    assert.ok(specs.some((s) => s.sessions.length >= 2));
  },
);

t('buildRikHistoryEventSpecs: datumen är SPRIDDA — ingen krock, äldst till senast', () => {
  const specs = buildRikHistoryEventSpecs({ nu: NU_RIK, config: CONFIG });
  const datum = specs.map((s) => s.startdatum);
  assert.equal(new Set(datum).size, datum.length, 'varje historik-event har ett eget datum');
});

t(
  'buildRikTouchpoints: en rad per touchpointDagarBak-post, Erbjudande-värden är PINNADE choices',
  () => {
    const tp = buildRikTouchpoints({ nu: NU_RIK, config: CONFIG });
    assert.equal(tp.length, CONFIG.richPerson.touchpointDagarBak.length);
    const PINNADE = new Set(['Meditationen Kraftfältet', 'Pyramidernas Vajrar', 'Annat']);
    for (const rad of tp) {
      assert.ok(PINNADE.has(rad.Erbjudande), `"${rad.Erbjudande}" är inte en pinnad choice`);
      assert.equal(rad.Typ, CONFIG.select.tpTypHamtning);
      assert.equal(rad.Metadata, CONFIG.richPerson.touchpointMetadataMarker);
    }
  },
);

t('buildRikTouchpoints: datumen är riktiga och SPRIDDA i tid (AC-krav)', () => {
  const tp = buildRikTouchpoints({ nu: NU_RIK, config: CONFIG });
  const datum = new Set(tp.map((r) => r.Datum));
  assert.equal(datum.size, tp.length, 'varje touchpoint har ett eget datum');
  for (const rad of tp) assert.ok(new Date(rad.Datum) < NU_RIK, 'touchpoints ligger i dåtid');
});

t('buildRikAnteckningar: minst två OLIKA författare, ingen sentinel i texten', () => {
  const rader = buildRikAnteckningar({ config: CONFIG });
  const forfattare = new Set(rader.map((r) => r.Författare));
  assert.ok(forfattare.size >= 2, 'AC-krav: olika författare');
  for (const rad of rader) {
    assert.ok(
      !rad.Anteckning.includes(CONFIG.marker.noteringSentinel),
      'anteckningstexten ska ALDRIG bära en synlig sentinel — Marcus läser den vid granskning',
    );
  }
});

t(
  'S103: personDataLinkFields-ändringen är den ENDA raden som styr guarden — regressionslås',
  () => {
    // Om någon av dagens tabeller byter namn i basen bryts detta lås innan
    // stadaOrt/planClean tyst börjar radera fel saker.
    assert.deepEqual(CONFIG.personDataLinkFields, ['Anteckningar 2']);
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// S103 — KASKAD-GUARDEN i planClean (upptäckt LIVE mot staging under detta
// korts skarpa --rik-verifiering, se slutrapporten): en person som lämnas
// kvar fick tidigare se sina EGNA anmälningar och event raderas ändå, vilket
// bröt Deltagandenas Anmälan-/Event-länkar och tystade rollups (RIM ×,
// Erfarenhetsbadge). Fixen gör guarden TRANSITIV: kvarlämnad person ⇒
// kvarlämnad anmälan ⇒ kvarlämnat event (lokalt, bara för DEN klustret).
// ═══════════════════════════════════════════════════════════════════════════

t(
  'KASKAD-GUARD RÖD SIDA (utan fixen hade detta fällt): en kvarlämnad persons EGEN anmälan lämnas också kvar',
  () => {
    const plan = planClean({
      events: [],
      registrations: [
        {
          id: 'recAnmRik',
          fields: { 'E-post': FIXTUR_EPOST, Person: ['recPersonRik'] },
        },
      ],
      persons: [
        {
          id: 'recPersonRik',
          fields: { 'E-post': FIXTUR_EPOST, 'Anteckningar 2': ['recNote1'] },
        },
      ],
      ort: ORT,
      pattern: PATTERN,
      config: CONFIG,
    });
    assert.deepEqual(plan.persons, [], 'personen är guard-blockerad');
    assert.deepEqual(
      plan.registrations,
      [],
      'KASKAD: anmälan får INTE raderas under den kvarlämnade personen',
    );
    assert.match(
      plan.skippedRegistrations.find((s) => s.id === 'recAnmRik')?.orsak ?? '',
      /hör till en person som lämnas kvar/,
    );
  },
);

t(
  'KASKAD-GUARD: ett event med EN kvarlämnad anmälan lämnas också kvar (annars bryts Deltagandets Event-länk)',
  () => {
    const plan = planClean({
      events: [
        {
          id: 'recEvRik',
          fields: {
            Ort: ORT,
            Notering: `${CONFIG.marker.noteringSentinel} x`,
            'Anmälningar (länkat fält)': ['recAnmRik'],
          },
        },
      ],
      registrations: [
        { id: 'recAnmRik', fields: { 'E-post': FIXTUR_EPOST, Person: ['recPersonRik'] } },
      ],
      persons: [
        { id: 'recPersonRik', fields: { 'E-post': FIXTUR_EPOST, 'Anteckningar 2': ['recNote1'] } },
      ],
      ort: ORT,
      pattern: PATTERN,
      config: CONFIG,
    });
    assert.deepEqual(
      plan.events,
      [],
      'KASKAD: eventet krävs fortfarande av den kvarlämnade anmälan',
    );
    assert.match(
      plan.skippedEvents.find((s) => s.id === 'recEvRik')?.orsak ?? '',
      /krävs fortfarande av en anmälan som lämnas kvar/,
    );
  },
);

t(
  'KASKAD-GUARD är LOKAL: ett event delat med ANDRA raderingsbara anmälningar raderas ändå när dess sista kvarlämnade anmälan är borta',
  () => {
    // Samma event, men nu bär den KVARLÄMNADE anmälan ett annat event-ID än
    // det event som prövas — alltså krävs INTE just detta event av någon
    // kvarlämnad rad, och det ska raderas som vanligt.
    const plan = planClean({
      events: [
        {
          id: 'recEvDelat',
          fields: {
            Ort: ORT,
            Notering: `${CONFIG.marker.noteringSentinel} x`,
            'Anmälningar (länkat fält)': ['recAnmTunn'],
          },
        },
      ],
      registrations: [
        { id: 'recAnmTunn', fields: { 'E-post': FIXTUR_EPOST } },
        { id: 'recAnmRik', fields: { 'E-post': FIXTUR_EPOST, Person: ['recPersonRik'] } },
      ],
      persons: [
        { id: 'recPersonRik', fields: { 'E-post': FIXTUR_EPOST, 'Anteckningar 2': ['recNote1'] } },
      ],
      ort: ORT,
      pattern: PATTERN,
      config: CONFIG,
    });
    assert.deepEqual(plan.events, ['recEvDelat'], 'eventets ENDA länkade anmälan var raderingsbar');
    assert.deepEqual(plan.registrations, ['recAnmTunn']);
  },
);

t(
  'KASKAD-GUARD GRÖN SIDA: normalfallet (ingen kvarlämnad person i scope) är HELT oförändrat',
  () => {
    const plan = planClean({
      events: [
        {
          id: 'recEv',
          fields: {
            Ort: ORT,
            Notering: `${CONFIG.marker.noteringSentinel} x`,
            'Anmälningar (länkat fält)': ['recAnm'],
          },
        },
      ],
      registrations: [{ id: 'recAnm', fields: { 'E-post': FIXTUR_EPOST } }],
      persons: [{ id: 'recPe', fields: { 'E-post': FIXTUR_EPOST } }],
      ort: ORT,
      pattern: PATTERN,
      config: CONFIG,
    });
    assert.deepEqual(plan.events, ['recEv']);
    assert.deepEqual(plan.registrations, ['recAnm']);
    assert.deepEqual(plan.persons, ['recPe']);
  },
);

// --- NÄRVARON (TASK-208): Deltaganden för fixturens anmälda ---
//
// Testerna är TVÅSIDIGA per krav: varje egenskap som bär korrektheten prövas
// både i den gröna riktningen (bygget gör rätt) och i den röda (en trolig
// felform FÄLLS). Den röda sidan är den som betyder något — ett test som bara
// bekräftar nuläget hade blivit grönt av fel skäl vid nästa ändring.

const NARVARO_ANM = ['recA1', 'recA2', 'recA3'];
const NARVARO_PERS = ['recP1', 'recP2', 'recP3'];
const NARVARO_EVENT = 'recEvent1';

t('buildDeltaganden: EN rad per anmälan × session (Deltagandens kardinalitet)', () => {
  const rader = buildDeltaganden({
    eventId: NARVARO_EVENT,
    anmalanIds: NARVARO_ANM,
    personIds: NARVARO_PERS,
    config: CONFIG,
  });
  assert.equal(rader.length, NARVARO_ANM.length * CONFIG.narvaro.sessioner.length);
  // Paret (Anmälan, Session) måste vara UNIKT — en dubblett visar samma person
  // två gånger på samma session i dörr-listan.
  const par = rader.map((r) => `${r.Anmälan[0]}§${r.Session}`);
  assert.equal(new Set(par).size, par.length, 'ingen dubblett på Anmälan × Session');
});

t('buildDeltaganden: default-fixturen (8+8) ger 16 dörr-rader PER session', () => {
  const anm = DEFAULTRADER.map((_, i) => `recA${i}`);
  const pers = DEFAULTRADER.map((_, i) => `recP${i}`);
  const rader = buildDeltaganden({
    eventId: NARVARO_EVENT,
    anmalanIds: anm,
    personIds: pers,
    config: CONFIG,
  });
  for (const nyckel of CONFIG.narvaro.sessioner) {
    const iSession = rader.filter((r) => r.Session === CONFIG.select[nyckel]);
    assert.equal(iSession.length, 16, `${CONFIG.select[nyckel]} ska bära 16 rader`);
  }
});

t(
  'buildDeltaganden: alla TRE länkarna satta — Event (get-attendance), Anmälan (prototypens join), Person (länk) (namn + städbarhet)',
  () => {
    const rader = buildDeltaganden({
      eventId: NARVARO_EVENT,
      anmalanIds: NARVARO_ANM,
      personIds: NARVARO_PERS,
      config: CONFIG,
    });
    for (const rad of rader) {
      assert.deepEqual(rad.Event, [NARVARO_EVENT], 'Event bär get-attendances ingång');
      assert.ok(NARVARO_ANM.includes(rad.Anmälan[0]), 'Anmälan bär prototypens join');
      assert.ok(NARVARO_PERS.includes(rad['Person (länk)'][0]), 'Person (länk) bär namn-batchen');
    }
  },
);

t('buildDeltaganden: anmälan och person PARAS per index — aldrig korsade', () => {
  const rader = buildDeltaganden({
    eventId: NARVARO_EVENT,
    anmalanIds: NARVARO_ANM,
    personIds: NARVARO_PERS,
    config: CONFIG,
  });
  // En korsning hade gett dörr-raden fel namn på rätt anmälan — tyst, och
  // omöjligt att se i vyn utan att slå upp record-ID:na för hand.
  for (const rad of rader) {
    const i = NARVARO_ANM.indexOf(rad.Anmälan[0]);
    assert.equal(rad['Person (länk)'][0], NARVARO_PERS[i]);
  }
});

t('buildDeltaganden: varje rad föds "Ej avstämt" — dörren är granskningsobjektet', () => {
  const rader = buildDeltaganden({
    eventId: NARVARO_EVENT,
    anmalanIds: NARVARO_ANM,
    personIds: NARVARO_PERS,
    config: CONFIG,
  });
  for (const rad of rader) {
    assert.equal(rad.Status, CONFIG.select.deltagandeEjAvstamt);
  }
});

t(
  'ROLLUP-NEUTRALITET: statusen får ALDRIG vara en som ger Närvaropoäng 1 (den räknar upp hela kurshistoriken)',
  () => {
    const rader = buildDeltaganden({
      eventId: NARVARO_EVENT,
      anmalanIds: NARVARO_ANM,
      personIds: NARVARO_PERS,
      config: CONFIG,
    });
    // Närvaropoäng (fldwuo94BY46VUOm4) = 1 för dessa två, 0 annars. Bär
    // fixturens rader någon av dem ändras RIM ×, Genomförda dagar och
    // Antal genomförda event på varje seedad person — motiveringen till att
    // raderna kan följa med UTAN flagga faller då.
    const GER_POANG = new Set([CONFIG.select.deltagandeNarvarande, 'Deltog online']);
    for (const rad of rader) {
      assert.ok(!GER_POANG.has(rad.Status), `${rad.Status} skulle ge Närvaropoäng 1`);
    }
  },
);

t('buildDeltaganden: sessions-värdena är PINNADE select-värden, aldrig literaler', () => {
  const rader = buildDeltaganden({
    eventId: NARVARO_EVENT,
    anmalanIds: NARVARO_ANM,
    personIds: NARVARO_PERS,
    config: CONFIG,
  });
  const PINNADE = new Set(CONFIG.narvaro.sessioner.map((n) => CONFIG.select[n]));
  for (const rad of rader) {
    assert.ok(PINNADE.has(rad.Session), `"${rad.Session}" är inte ett pinnat select-värde`);
  }
  // Sessionsmallen på det PINNADE eventformatet är "Dag 1 + Dag 2"
  // (live-verifierat mot staging 2026-08-13). Avviker listan därifrån bär
  // fixturen sessioner eventet inte har.
  assert.deepEqual([...PINNADE], ['Dag 1', 'Dag 2']);
});

t('buildDeltaganden: ren funktion — samma indata ger identiska rader', () => {
  const a = buildDeltaganden({
    eventId: NARVARO_EVENT,
    anmalanIds: NARVARO_ANM,
    personIds: NARVARO_PERS,
    config: CONFIG,
  });
  const b = buildDeltaganden({
    eventId: NARVARO_EVENT,
    anmalanIds: NARVARO_ANM,
    personIds: NARVARO_PERS,
    config: CONFIG,
  });
  assert.deepEqual(a, b);
});

// --- TASK-208, RÖD SIDA: varje guard fälls av sin egen felform ---

t('RÖD SIDA: olika många anmälningar och personer REFUSERAS (parvisheten är kontraktet)', () => {
  assert.throws(
    () =>
      buildDeltaganden({
        eventId: NARVARO_EVENT,
        anmalanIds: ['recA1', 'recA2'],
        personIds: ['recP1'],
        config: CONFIG,
      }),
    /parvisa/,
  );
});

t('RÖD SIDA: tom narvaro.sessioner REFUSERAS av validateConfig', () => {
  assert.throws(
    () => validateConfig({ ...CONFIG, narvaro: { ...CONFIG.narvaro, sessioner: [] } }),
    /narvaro\.sessioner saknas/,
  );
});

t(
  'RÖD SIDA: en session som INTE pekar ut ett pinnat select-värde REFUSERAS (literalen "Dag 1" är just en sådan)',
  () => {
    assert.throws(
      () => validateConfig({ ...CONFIG, narvaro: { ...CONFIG.narvaro, sessioner: ['Dag 1'] } }),
      /pekar inte ut ett pinnat select-värde/,
    );
  },
);

t('RÖD SIDA: dubblerad session REFUSERAS (den ger två rader på samma Anmälan × Session)', () => {
  assert.throws(
    () =>
      validateConfig({
        ...CONFIG,
        narvaro: { ...CONFIG.narvaro, sessioner: ['sessionDag1', 'sessionDag1'] },
      }),
    /dubbletter/,
  );
});

t('RÖD SIDA: okänd statusNyckel REFUSERAS', () => {
  assert.throws(
    () => validateConfig({ ...CONFIG, narvaro: { ...CONFIG.narvaro, statusNyckel: 'finnsInte' } }),
    /statusNyckel/,
  );
});

t(
  'RÖD SIDA: saknad linkFields.eventNarvaro REFUSERAS (efter-verifieringen tappar sitt fält)',
  () => {
    const utan = { ...CONFIG.linkFields };
    delete utan.eventNarvaro;
    assert.throws(() => validateConfig({ ...CONFIG, linkFields: utan }), /eventNarvaro/);
  },
);

t('linkFields.eventNarvaro är EXAKT fältnamnet get-attendance läser — inte ett eget påhitt', () => {
  // Speglar supabase/functions/get-attendance/index.ts:
  //   eventRecord.fields['Närvaro (records)']
  // Driftar namnet isär blir efter-verifieringen grön mot ett fält ingen
  // läser, och vyn tom utan att skriptet klagar.
  assert.equal(CONFIG.linkFields.eventNarvaro, 'Närvaro (records)');
});

t('städbarheten: Person (länk) är spegeln stadaOrt samlar via personDeltaganden', () => {
  // Satellit-städningen gör `lankadeIdn(raderasPersoner, 'Deltaganden')`.
  // Det fältet fylls av `Deltaganden.Person (länk)` (symmetrin live-verifierad
  // mot staging 2026-08-13). Utan länken blir varje seedad Deltagande-rad
  // föräldralös vid clean — osynlig för både grafen och den riktade ID-kollen.
  const rader = buildDeltaganden({
    eventId: NARVARO_EVENT,
    anmalanIds: NARVARO_ANM,
    personIds: NARVARO_PERS,
    config: CONFIG,
  });
  assert.equal(CONFIG.linkFields.personDeltaganden, 'Deltaganden');
  assert.equal(CONFIG.linkFields.deltagandePersonLank, 'Person (länk)');
  for (const rad of rader) {
    assert.ok(Array.isArray(rad[CONFIG.linkFields.deltagandePersonLank]));
  }
});

t('PURGE-KOLLISION: närvaro-raderna bär inga markörer setup-purgen kan matcha', () => {
  // Skyddsräcke 2 i rad-form: Deltaganden bär varken Ort eller E-post, så de
  // enda purge-bara markörerna kan inte uppstå här. Prövas mot den SKARPA
  // policyn, aldrig mot ett antagande om vad den innehåller.
  const rader = buildDeltaganden({
    eventId: NARVARO_EVENT,
    anmalanIds: NARVARO_ANM,
    personIds: NARVARO_PERS,
    config: CONFIG,
  });
  const samples = rader.flatMap((rad) => [
    { table: CONFIG.tables.deltaganden.purgeName, field: 'Session', value: rad.Session },
    { table: CONFIG.tables.deltaganden.purgeName, field: 'Status', value: rad.Status },
  ]);
  assert.deepEqual(purgeCollisions(samples, PURGE_POLICY), []);
});

process.on('beforeExit', () => {
  if (failed > 0) {
    console.error(`\n${failed} test(er) RÖDA`);
    process.exit(1);
  }
  console.log('\nAlla seed-fixtur-tester gröna.');
});
