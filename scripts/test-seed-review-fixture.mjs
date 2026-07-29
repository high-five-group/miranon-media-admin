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
//   2. De permanenta fixturerna (ZZ-Arbetsko / ZZ-History) bär exakta
//      rollup-assertions (TASK-31) och får aldrig raderas eller länkas till.
//   3. Datumvalet — fixturen ska ligga nära i tiden, inte i 2026-09-15-klustret.
//   4. Beläggningen — `Anmäld beläggning (%)` får aldrig nå 100 % (A6).

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  betalstatusFor,
  buildEvent,
  buildRegistrations,
  CONFIG,
  chunk,
  eventUrl,
  fixtureEmail,
  fixtureEmailFormula,
  fixtureEmailPattern,
  isFixtureEmailRecord,
  isFixtureEvent,
  isoDatum,
  isoTidBakat,
  kapacitetFor,
  parseArgs,
  personLinkGuardTrips,
  planClean,
  purgeCollisions,
  slugify,
  validateConfig,
} from './seed-review-fixture.mjs';

const PURGE_POLICY = JSON.parse(
  readFileSync(new URL('../.purge-staging-policy.json', import.meta.url), 'utf8'),
);

const NU = new Date('2026-07-26T12:00:00.000Z');

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
  // TASK-82 AC #3 TVÅSIDIGT BEVIS — TILLFÄLLIGT BRUTEN, ÅTERSTÄLLS.
  assert.doesNotThrow(() => validateConfig({ ...CONFIG, expectedBaseId: 'app8uGPrVCVOm6LfD' }));
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

t('FÄLLA 1: default-fixturens markörer kolliderar ALDRIG med skarpa purge-policyn', () => {
  const slug = slugify(CONFIG.defaults.ort);
  const samples = [
    { table: 'Eventplanering', field: 'Ort', value: CONFIG.defaults.ort },
    ...Array.from({ length: 16 }, (_, i) => ({
      table: 'Anmälningar',
      field: 'E-post',
      value: fixtureEmail(slug, i, CONFIG.marker),
    })),
  ];
  assert.deepEqual(purgeCollisions(samples, PURGE_POLICY), []);
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

t('FÄLLA 1: fixtur-domänen ligger utanför purgens @staging.test-mönster', () => {
  assert.ok(CONFIG.marker.emailDomain !== '@staging.test');
  assert.ok(!CONFIG.marker.emailPrefix.startsWith('create-test+'));
});

// --- FÄLLA 2: de permanenta fixturerna ---

t('FÄLLA 2: ZZ-Arbetsko och ZZ-History står i protectedRecordIds', () => {
  assert.ok(CONFIG.protectedRecordIds.includes('rec7F8jYc7rczwwkM'), 'ZZ-Arbetsko Person 01');
  assert.ok(CONFIG.protectedRecordIds.includes('recqxaFNwHAdQlAqb'), 'ZZ-History Person 01');
});

t('FÄLLA 2: en skyddad person raderas ALDRIG — inte ens med matchande e-post', () => {
  const pattern = fixtureEmailPattern('zz-granskning-fixtur', CONFIG.marker);
  const plan = planClean({
    events: [],
    registrations: [],
    persons: [
      {
        id: 'rec7F8jYc7rczwwkM',
        fields: { 'E-post': fixtureEmail('zz-granskning-fixtur', 0, CONFIG.marker) },
      },
    ],
    ort: 'ZZ-GRANSKNING-FIXTUR',
    pattern,
    config: CONFIG,
  });
  assert.deepEqual(plan.persons, []);
  assert.equal(plan.skippedPersons[0].orsak, 'skyddad record-ID (permanent fixtur)');
});

t('FÄLLA 2: skriptet skapar EGNA personer — ingen anmälan pekar på en skyddad person', () => {
  const rader = buildRegistrations({
    ort: 'ZZ-GRANSKNING-FIXTUR',
    bekraftade: 8,
    obekraftade: 8,
    nu: NU,
    config: CONFIG,
  });
  for (const rad of rader) {
    assert.ok(rad.person['E-post'].startsWith(CONFIG.marker.emailPrefix));
    assert.ok(!CONFIG.protectedRecordIds.includes(rad.person['E-post']));
  }
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

t('fixtur-e-posten är nollpaddad och index-unik', () => {
  assert.equal(
    fixtureEmail('zz-granskning-fixtur', 0, CONFIG.marker),
    'seed-review+zz-granskning-fixtur-01@granskning.test',
  );
  assert.equal(
    fixtureEmail('zz-granskning-fixtur', 15, CONFIG.marker),
    'seed-review+zz-granskning-fixtur-16@granskning.test',
  );
});

t('e-postmönstret matchar EXAKT sin egen slug — aldrig en annan fixturs', () => {
  const p = fixtureEmailPattern('zz-granskning-fixtur', CONFIG.marker);
  assert.ok(p.test('seed-review+zz-granskning-fixtur-01@granskning.test'));
  assert.ok(!p.test('seed-review+zz-annan-ort-01@granskning.test'));
  assert.ok(!p.test('zz-granskning-15@staging.test'), 'S91-fixturens adresser rörs aldrig');
  assert.ok(!p.test('zz-arbetsko-person01@staging.test'), 'permanenta fixturen rörs aldrig');
  assert.ok(!p.test('lotta@miranon.se'), 'riktiga adresser rörs aldrig');
});

t('filterByFormula-strängen bär inga ogiltiga citattecken', () => {
  const f = fixtureEmailFormula('zz-granskning-fixtur', CONFIG.marker);
  assert.equal(
    f,
    "AND(FIND('seed-review+zz-granskning-fixtur-', {E-post}) = 1, FIND('@granskning.test', {E-post}) > 0)",
  );
});

// --- Event-bygget ---

t('eventet bär Eventtyp-länken (ADR-066 b5) och sätter ALDRIG Månad/år', () => {
  const e = buildEvent({
    ort: 'ZZ-GRANSKNING-FIXTUR',
    startdatum: '2026-08-03',
    slutdatum: '2026-08-04',
    maxPlatser: 30,
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

const PATTERN = fixtureEmailPattern('zz-granskning-fixtur', CONFIG.marker);
const FIXTUR_EPOST = fixtureEmail('zz-granskning-fixtur', 0, CONFIG.marker);

t('fixtur-eventet kräver BÅDE rätt Ort OCH notering-sentineln', () => {
  const medSentinel = {
    id: 'recA',
    fields: { Ort: 'ZZ-GRANSKNING-FIXTUR', Notering: `${CONFIG.marker.noteringSentinel} …` },
  };
  const utanSentinel = {
    id: 'recB',
    fields: { Ort: 'ZZ-GRANSKNING-FIXTUR', Notering: 'Riktigt event som råkar heta likadant' },
  };
  const utanNotering = { id: 'recC', fields: { Ort: 'ZZ-GRANSKNING-FIXTUR' } };
  assert.equal(isFixtureEvent(medSentinel, 'ZZ-GRANSKNING-FIXTUR', CONFIG.marker), true);
  assert.equal(isFixtureEvent(utanSentinel, 'ZZ-GRANSKNING-FIXTUR', CONFIG.marker), false);
  assert.equal(isFixtureEvent(utanNotering, 'ZZ-GRANSKNING-FIXTUR', CONFIG.marker), false);
});

t('Ort-matchen är EXAKT — prefix räcker inte (S91-fixturen överlever)', () => {
  const s91 = {
    id: 'recBepsw4Qy9scfoj',
    fields: { Ort: 'ZZ-GRANSKNING-S91', Notering: `${CONFIG.marker.noteringSentinel} …` },
  };
  assert.equal(isFixtureEvent(s91, 'ZZ-GRANSKNING', CONFIG.marker), false);
  assert.equal(isFixtureEvent(s91, 'ZZ-GRANSKNING-FIXTUR', CONFIG.marker), false);
});

t('länk-guarden skyddar en person med Deltaganden', () => {
  const rec = {
    id: 'recD',
    fields: { 'E-post': FIXTUR_EPOST, Deltaganden: ['recQWjimysYJrkY0n'] },
  };
  assert.deepEqual(personLinkGuardTrips(rec, CONFIG.personDataLinkFields), ['Deltaganden']);
});

t('Anmälningar-länken triggar INTE guarden — den är fixturens egen', () => {
  const rec = {
    id: 'recE',
    fields: { 'E-post': FIXTUR_EPOST, 'Anmälningar (länkat fält)': ['recAAAABBBBCCCCDD'] },
  };
  assert.deepEqual(personLinkGuardTrips(rec, CONFIG.personDataLinkFields), []);
});

t('planClean klassar radera/skyddad/länkad/icke-markerad korrekt', () => {
  const plan = planClean({
    events: [
      {
        id: 'recEv1',
        fields: { Ort: 'ZZ-GRANSKNING-FIXTUR', Notering: `${CONFIG.marker.noteringSentinel} x` },
      },
      { id: 'recEv2', fields: { Ort: 'ZZ-GRANSKNING-FIXTUR', Notering: 'Riktigt event' } },
    ],
    registrations: [
      { id: 'recAn1', fields: { 'E-post': FIXTUR_EPOST } },
      { id: 'recAn2', fields: { 'E-post': 'lotta@miranon.se' } },
    ],
    persons: [
      { id: 'recPe1', fields: { 'E-post': FIXTUR_EPOST } },
      { id: 'recPe2', fields: { 'E-post': FIXTUR_EPOST, Deltaganden: ['recX'] } },
      { id: 'recqxaFNwHAdQlAqb', fields: { 'E-post': FIXTUR_EPOST } },
    ],
    ort: 'ZZ-GRANSKNING-FIXTUR',
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
    ort: 'ZZ-GRANSKNING-FIXTUR',
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

process.on('beforeExit', () => {
  if (failed > 0) {
    console.error(`\n${failed} test(er) RÖDA`);
    process.exit(1);
  }
  console.log('\nAlla seed-fixtur-tester gröna.');
});
