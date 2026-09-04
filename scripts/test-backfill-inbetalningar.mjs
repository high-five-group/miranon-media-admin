#!/usr/bin/env node
// scripts/test-backfill-inbetalningar.mjs — enhetstester för
// scripts/backfill-inbetalningar.mjs (TASK-346.8).
//
// Kör: node scripts/test-backfill-inbetalningar.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.
//
// HERMETISK: importerar bara de rena funktionerna, rör aldrig fetch, Airtable,
// Postgres eller `supabase`-CLI:t, kräver ingen token. Skriptets `main()` körs
// inte vid import (körvakten längst ned i skriptet).
//
// ═══════════════════════════════════════════════════════════════════════════
// VARJE PENGAREGEL HAR EN NEGATIV KONTROLL — DoD #5
// ═══════════════════════════════════════════════════════════════════════════
// Kortets DoD #5 kräver att pengalogikens regler "har var sin negativ kontroll
// bokförd — testet fäller en trasig implementation". Ett test som bara visar
// att det RÄTTA fallet ger rätt svar är vakuöst: det passerar lika gärna mot
// en funktion som returnerar en konstant. Sviten är därför byggd i KONTRASTPAR
// genomgående — det tydligaste är § B17, där samma sträng (`'2.500'`) prövas
// mot BÅDA parsrarna och måste ge OLIKA svar, eftersom det är hela skälet till
// att prisfritextens parser finns vid sidan av `normaliseraBelopp`.
//
// Två fall bär mer än sitt eget påstående och är värda att känna till:
//   § D6  bevisar VARFÖR fack-motsägelsen listas i stället för att backfillas
//         — beloppet hade flippat BÅDA facken i basen.
//   § K4  bevisar att `betalningsdatum`-kolumnen ÄR nullable. Faller den är
//         kortets "datum tomt"-krav omöjligt och skivan måste ritas om.
//
// Sektioner:
//   A  guards (bas, project-ref, prod-refens frånvaro i policyn)
//   B  prisfritextens tolkning + kontrasten mot `normaliseraBelopp`
//   C  prisbildens fyra nivåer och källbokföringen
//   D  klassificeringsregeln, fall för fall
//   E  SQL-bygget (escaping, tomt datum, idempotens-predikatet)
//   F  idempotensen tvåsidigt
//   G  spegelpatchen mot EF-lagrets allowlist
//   H  FÖRE/EFTER-mätningen
//   I  eventprisernas plan
//   J  db query-svarets parsning
//   K  korsläsningen mot de delade EF-modulerna
//   L  länktillståndets preflight            (runda 1, fynd 1)
//   M  beloppsgrinden: 0 kr och negativt     (runda 1, fynd 2)
//   N  aktiva icke-Historik-inbetalningar    (runda 1, fynd 3)
//   O  spegelns konvergens                   (runda 1, fynd 4)
//   P  indexeringen: förekomst och filter    (runda 2, fynd 1 + 3)
//   Q  kopplingsvakter mot main()            (runda 2, fynd 2)
//   R  patch-hoppet och ref-maskeringen      (runda 2, fynd 4c/4d)

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normaliseraBelopp } from '../supabase/functions/_shared/betalningsbelopp.ts';

import { harledBetalning } from '../supabase/functions/_shared/betalningsharledning.ts';
import {
  findDisallowedField,
  getOperation,
} from '../supabase/functions/_shared/field-allowlists.ts';
import {
  avrundaOre,
  BESLUT,
  berknaMatning,
  byggInsertSats,
  byggSpegelPatch,
  escapeSqlText,
  harledPrisbild,
  INGA_AKTIVA,
  indexeraInbetalningar,
  klassificera,
  LANKTILLSTAND_FIL,
  lasLanktillstand,
  losToken,
  maskeraRef,
  PROD_GODKAND_ENV_VAR,
  parsaDbQuerySvar,
  patchArIdentisk,
  planera,
  planeraEventpriser,
  provaLanktillstand,
  SPEGEL_OPERATION,
  skrivRapport,
  sqlBelopp,
  sqlDatum,
  standardNyckel,
  tolkaPrisFritext,
  validateBaseGuard,
  validateMiljoKonsistens,
  validateProjectRef,
} from './backfill-inbetalningar.mjs';

const REPO_ROT = join(dirname(fileURLToPath(import.meta.url)), '..');
const POLICY = JSON.parse(
  readFileSync(join(REPO_ROT, '.backfill-inbetalningar-policy.json'), 'utf8'),
);

let passed = 0;
let failed = 0;

function test(namn, fn) {
  try {
    fn();
    passed += 1;
    console.log(`✅ ${namn}`);
  } catch (fel) {
    failed += 1;
    console.error(`❌ ${namn}`);
    console.error(`   ${fel.message}`);
  }
}

/** Samma kontrakt som `test`, men AWAIT:ar `fn()` — för `losToken` m.fl. som
 *  är async (TASK-360 runda 2). `test()` fångar bara SYNKRONA kast; ett kast
 *  inuti en async-funktion når aldrig dess try/catch, det blir en
 *  unhandled rejection i stället för en röd rad. Filen körs som ESM med
 *  top-level await, så `await testAsync(...)` vid anropsstället räcker. */
async function testAsync(namn, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`✅ ${namn}`);
  } catch (fel) {
    failed += 1;
    console.error(`❌ ${namn}`);
    console.error(`   ${fel.message}`);
  }
}

/** Minimal anmälan. Överskriv bara det fallet handlar om. */
const anm = (over = {}) => ({
  id: 'recAAAAAAAAAAAAAA',
  namn: 'Test Testsson',
  eventId: 'recBBBBBBBBBBBBBB',
  anmalningsavgiftFack: null,
  slutbetalningFack: null,
  avtalatPris: null,
  summaInbetaltSpegel: null,
  status: 'Bekräftad',
  ...over,
});

const ev = (over = {}) => ({
  id: 'recBBBBBBBBBBBBBB',
  namn: 'Fjärrskådning',
  typ: 'Utbildning',
  ort: 'Falköping',
  startdatum: '2026-02-11',
  pris: null,
  anmalningsavgift: null,
  ...over,
});

const std = (over = {}) => ({
  id: 'recCCCCCCCCCCCCCC',
  namn: 'Fjärrskådning',
  typ: 'Utbildning',
  pris: null,
  anmalningsavgift: null,
  prisFritext: null,
  anmalningsavgiftFritext: null,
  ...over,
});

const klass = (over = {}) =>
  klassificera({
    anmalan: anm(),
    event: ev(),
    standard: std(),
    harNarvaro: false,
    harHistorik: false,
    policy: POLICY,
    ...over,
  });

// ═══════════════════════════════════════════════════════════════════════════
// A — GUARDS
// ═══════════════════════════════════════════════════════════════════════════

test('A1: policyn pekar på staging-basen, inte prod', () => {
  assert.equal(POLICY.expectedBaseId, 'apphjj8Q7lkXCMsL4');
  assert.ok(!POLICY.forbiddenBaseIds.includes(POLICY.expectedBaseId));
});

test('A2: prod-basen står i forbiddenBaseIds', () => {
  assert.ok(POLICY.forbiddenBaseIds.includes('app8uGPrVCVOm6LfD'));
});

test('A3: validateBaseGuard FÄLLER prod-basen (negativ kontroll)', () => {
  assert.throws(() => validateBaseGuard(POLICY, 'app8uGPrVCVOm6LfD'), /BLOCKERAD/);
});

test('A4: validateBaseGuard FÄLLER utan forbiddenBaseIds (fail-closed)', () => {
  assert.throws(
    () => validateBaseGuard({ expectedBaseId: POLICY.expectedBaseId, forbiddenBaseIds: [] }, 'x'),
    /forbiddenBaseIds/,
  );
});

test('A5: validateBaseGuard FÄLLER ett felformat bas-ID', () => {
  assert.throws(() => validateBaseGuard(POLICY, 'inte-ett-bas-id'), /fel form/);
});

test('A6: validateBaseGuard SLÄPPER staging-basen', () => {
  assert.equal(validateBaseGuard(POLICY, POLICY.expectedBaseId), true);
});

test('A7: validateProjectRef SLÄPPER staging-refen', () => {
  assert.equal(
    validateProjectRef(POLICY, POLICY.tillatnaProjectRefs[0], 'zzzzzzzzzzzzzzzzzzzz'),
    true,
  );
});

test('A8: validateProjectRef FÄLLER prod-refen med rätt skäl (negativ kontroll)', () => {
  // Prod-refen läses ur .prod-ref-policy.conf — repots enda hemvist för den.
  const conf = readFileSync(join(REPO_ROT, '.prod-ref-policy.conf'), 'utf8');
  const prodRef = conf.match(/^PROD_REF_PROD="([^"]+)"/m)?.[1];
  assert.ok(prodRef, 'PROD_REF_PROD saknas i .prod-ref-policy.conf');
  assert.throws(() => validateProjectRef(POLICY, prodRef, prodRef), /BLOCKERAD.*PROD/s);
});

test('A9: validateProjectRef FÄLLER en okänd ref', () => {
  assert.throws(
    () => validateProjectRef(POLICY, 'abcdefghijklmnopqrst', null),
    /tillatnaProjectRefs/,
  );
});

test('A10: validateProjectRef FÄLLER utan tillatnaProjectRefs (fail-closed)', () => {
  assert.throws(() => validateProjectRef({}, 'abcdefghijklmnopqrst', null), /tillatnaProjectRefs/);
});

test('A11: POLICYN INNEHÅLLER INTE prod-refen — låset förblir verksamt', () => {
  // Invarianten policyfilens `_kommentar` bokför: kopieras prod-refen hit blir
  // scripts/deny-prod-ref.sh verkningslös för varje agent som läser repot
  // (CLAUDE.md § Prod-EF-deploy). Detta test är den mekaniska vakten över den.
  const conf = readFileSync(join(REPO_ROT, '.prod-ref-policy.conf'), 'utf8');
  const prodRef = conf.match(/^PROD_REF_PROD="([^"]+)"/m)?.[1];
  const policyText = readFileSync(join(REPO_ROT, '.backfill-inbetalningar-policy.json'), 'utf8');
  assert.ok(!policyText.includes(prodRef), 'prod-refen får inte stå i backfill-policyn');
});

// ─────────────────────────────────────────────────────────────────────────
// A12–A17: PROD-VÄGEN (TASK-360) — typa-för-att-bekräfta-override
// ─────────────────────────────────────────────────────────────────────────

const A_PROD_REF = readFileSync(join(REPO_ROT, '.prod-ref-policy.conf'), 'utf8').match(
  /^PROD_REF_PROD="([^"]+)"/m,
)?.[1];
const A_PROD_BAS = 'app8uGPrVCVOm6LfD';

test('A12: validateBaseGuard SLÄPPER prod-basen NÄR godkandEnv matchar EXAKT', () => {
  assert.equal(validateBaseGuard(POLICY, A_PROD_BAS, { godkandEnv: A_PROD_BAS }), true);
});

test('A13: NEGATIV — validateBaseGuard FÄLLER prod-basen med FEL godkandEnv-värde', () => {
  assert.throws(() => validateBaseGuard(POLICY, A_PROD_BAS, { godkandEnv: 'true' }), /BLOCKERAD/);
  assert.throws(
    () => validateBaseGuard(POLICY, A_PROD_BAS, { godkandEnv: POLICY.expectedBaseId }),
    /BLOCKERAD/,
  );
});

test('A14: NEGATIV — validateBaseGuard FÄLLER prod-basen UTAN godkandEnv (oförändrat)', () => {
  assert.throws(() => validateBaseGuard(POLICY, A_PROD_BAS), /BLOCKERAD/);
  assert.throws(() => validateBaseGuard(POLICY, A_PROD_BAS, {}), /BLOCKERAD/);
});

test('A15: validateProjectRef SLÄPPER prod-refen NÄR godkandEnv matchar EXAKT', () => {
  assert.ok(A_PROD_REF, 'PROD_REF_PROD saknas i .prod-ref-policy.conf');
  assert.equal(
    validateProjectRef(POLICY, A_PROD_REF, A_PROD_REF, { godkandEnv: A_PROD_REF }),
    true,
  );
});

test('A16: NEGATIV — validateProjectRef FÄLLER prod-refen med FEL godkandEnv-värde', () => {
  assert.throws(
    () => validateProjectRef(POLICY, A_PROD_REF, A_PROD_REF, { godkandEnv: '1' }),
    /BLOCKERAD.*PROD/s,
  );
  assert.throws(
    () =>
      validateProjectRef(POLICY, A_PROD_REF, A_PROD_REF, {
        godkandEnv: POLICY.tillatnaProjectRefs[0],
      }),
    /BLOCKERAD.*PROD/s,
  );
});

test('A17: NEGATIV — validateProjectRef FÄLLER prod-refen UTAN godkandEnv (oförändrat)', () => {
  assert.throws(() => validateProjectRef(POLICY, A_PROD_REF, A_PROD_REF), /BLOCKERAD.*PROD/s);
  assert.throws(() => validateProjectRef(POLICY, A_PROD_REF, A_PROD_REF, {}), /BLOCKERAD.*PROD/s);
});

test('A18: PROD_GODKAND_ENV_VAR är SAMMA variabelnamn som create-betalningsfalt.mjs', () => {
  // Uppdragets krav: "EN bypass-form i huset" — samma namn, inte en egen
  // uppfinning för denna skiva.
  assert.equal(PROD_GODKAND_ENV_VAR, 'AIRTABLE_PROD_GODKAND_AV_MARCUS');
  const precedent = readFileSync(join(REPO_ROT, 'scripts/create-betalningsfalt.mjs'), 'utf8');
  assert.match(precedent, /PROD_GODKAND_ENV_VAR = 'AIRTABLE_PROD_GODKAND_AV_MARCUS'/);
});

test('A19: validateMiljoKonsistens SLÄPPER när båda pekar mot staging', () => {
  assert.equal(validateMiljoKonsistens({ basGodkand: false, refGodkand: false }), true);
});

test('A20: validateMiljoKonsistens SLÄPPER när båda pekar mot prod', () => {
  assert.equal(validateMiljoKonsistens({ basGodkand: true, refGodkand: true }), true);
});

test('A21: NEGATIV — validateMiljoKonsistens FÄLLER bas=PROD men ref=staging', () => {
  assert.throws(
    () => validateMiljoKonsistens({ basGodkand: true, refGodkand: false }),
    /BLOCKERAD kombination/,
  );
});

test('A22: NEGATIV — validateMiljoKonsistens FÄLLER bas=staging men ref=PROD', () => {
  assert.throws(
    () => validateMiljoKonsistens({ basGodkand: false, refGodkand: true }),
    /BLOCKERAD kombination/,
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// B — PRISFRITEXTENS TOLKNING (AC #2)
// ═══════════════════════════════════════════════════════════════════════════

test('B1: "2.500" → 2500 (den bokförda tolkningen, data-model.md)', () => {
  assert.equal(tolkaPrisFritext('2.500'), 2500);
});

test('B2: "1000:-" → 1000 (den bokförda tolkningen)', () => {
  assert.equal(tolkaPrisFritext('1000:-'), 1000);
});

test('B3: "2 500 kr" → 2500 (blanksteg + valutasuffix)', () => {
  assert.equal(tolkaPrisFritext('2 500 kr'), 2500);
});

test('B4: "2500" → 2500', () => {
  assert.equal(tolkaPrisFritext('2500'), 2500);
});

test('B5: "2500.50" → 2500.5 (TVÅ siffror efter punkt = decimaler)', () => {
  assert.equal(tolkaPrisFritext('2500.50'), 2500.5);
});

test('B6: "12,5" → 12.5 (EN siffra efter komma = decimal)', () => {
  assert.equal(tolkaPrisFritext('12,5'), 12.5);
});

test('B7: "2,500" → 2500 (TRE siffror efter komma = tusental)', () => {
  assert.equal(tolkaPrisFritext('2,500'), 2500);
});

test('B8: KONTRASTPAR — "2.50" och "2.500" tolkas OLIKA', () => {
  // Detta par ÄR disambigueringsregeln. Faller den samman är regeln borta.
  assert.equal(tolkaPrisFritext('2.50'), 2.5);
  assert.equal(tolkaPrisFritext('2.500'), 2500);
});

test('B9: NEGATIV — "abc" → null (aldrig ett gissat tal)', () => {
  assert.equal(tolkaPrisFritext('abc'), null);
});

test('B10: NEGATIV — tom sträng och blanksteg → null', () => {
  assert.equal(tolkaPrisFritext(''), null);
  assert.equal(tolkaPrisFritext('   '), null);
});

test('B11: NEGATIV — "ca 2500" → null (prefixtext gissas aldrig bort)', () => {
  assert.equal(tolkaPrisFritext('ca 2500'), null);
});

test('B12: NEGATIV — "1.234.567" → null (två avgränsare är tvetydigt)', () => {
  assert.equal(tolkaPrisFritext('1.234.567'), null);
});

test('B13: NEGATIV — "2.5000" → null (fyra siffror är varken tusental eller öre)', () => {
  assert.equal(tolkaPrisFritext('2.5000'), null);
});

test('B14: NEGATIV — "-100" → null (ett pris är aldrig negativt)', () => {
  assert.equal(tolkaPrisFritext('-100'), null);
});

test('B15: NEGATIV — icke-strängar → null', () => {
  assert.equal(tolkaPrisFritext(null), null);
  assert.equal(tolkaPrisFritext(undefined), null);
  assert.equal(tolkaPrisFritext(2500), null);
  assert.equal(tolkaPrisFritext({}), null);
});

test('B16: NEGATIV — "1e3" → null (exponentnotation, samma fälla som Number())', () => {
  assert.equal(tolkaPrisFritext('1e3'), null);
});

test('B17: KONTRAST MOT normaliseraBelopp — samma sträng, OLIKA svar, med avsikt', () => {
  // `normaliseraBelopp` avvisar '2.500' fail-closed (Lotta står vid fältet och
  // kan skriva om). Prisfritextens parser tolkar den (ingen finns att fråga om
  // en historisk prislapp). Konvergerar de två är den ena felaktig.
  assert.equal(normaliseraBelopp('2.500'), null);
  assert.equal(tolkaPrisFritext('2.500'), 2500);
  // Där de SKA vara överens är de det:
  assert.equal(normaliseraBelopp('2 500,00'), 2500);
  assert.equal(tolkaPrisFritext('2 500,00'), 2500);
});

// ═══════════════════════════════════════════════════════════════════════════
// C — PRISBILDENS NIVÅER OCH KÄLLBOKFÖRINGEN
// ═══════════════════════════════════════════════════════════════════════════

test('C1: avtalat pris vinner över eventets', () => {
  const p = harledPrisbild({
    anmalan: anm({ avtalatPris: 2000 }),
    event: ev({ pris: 2500 }),
    standard: std(),
  });
  assert.equal(p.pris, 2000);
  assert.equal(p.prisKalla, 'anmalan.avtalat-pris');
});

test('C2: avtalat pris 0 VINNER (noll är ett satt pris — samma fälla som Saknas-formeln)', () => {
  const p = harledPrisbild({
    anmalan: anm({ avtalatPris: 0 }),
    event: ev({ pris: 2500 }),
    standard: std(),
  });
  assert.equal(p.pris, 0);
  assert.equal(p.prisKalla, 'anmalan.avtalat-pris');
});

test('C3: eventets pris vinner över standarden', () => {
  const p = harledPrisbild({
    anmalan: anm(),
    event: ev({ pris: 3000 }),
    standard: std({ pris: 2500 }),
  });
  assert.equal(p.pris, 3000);
  assert.equal(p.prisKalla, 'eventplanering.pris-kr');
});

test('C4: standarden används när eventet saknar pris', () => {
  const p = harledPrisbild({ anmalan: anm(), event: ev(), standard: std({ pris: 2500 }) });
  assert.equal(p.pris, 2500);
  assert.equal(p.prisKalla, 'eventinnehall.pris-kr');
});

test('C5: fritexten används SIST, och källan bokförs som fritext', () => {
  const p = harledPrisbild({
    anmalan: anm(),
    event: ev(),
    standard: std({ prisFritext: '2.500', anmalningsavgiftFritext: '1000:-' }),
  });
  assert.equal(p.pris, 2500);
  assert.equal(p.prisKalla, 'eventinnehall.pris-fritext');
  assert.equal(p.anmalningsavgift, 1000);
  assert.equal(p.avgiftKalla, 'eventinnehall.anmalningsavgift-fritext');
});

test('C6: NEGATIV — allt tomt ger pris null OCH källa null', () => {
  const p = harledPrisbild({ anmalan: anm(), event: ev(), standard: std() });
  assert.equal(p.pris, null);
  assert.equal(p.prisKalla, null);
  assert.equal(p.anmalningsavgift, null);
  assert.equal(p.avgiftKalla, null);
});

test('C7: en OTOLKBAR fritext flaggas separat (listas för Marcus, inte gissas)', () => {
  const p = harledPrisbild({
    anmalan: anm(),
    event: ev(),
    standard: std({ prisFritext: 'ca 2500 beroende på' }),
  });
  assert.equal(p.pris, null);
  assert.equal(p.otolkbarPrisFritext, 'ca 2500 beroende på');
});

test('C8: numeriskt pris gör att fritexten ALDRIG konsulteras', () => {
  const p = harledPrisbild({
    anmalan: anm(),
    event: ev({ pris: 3000 }),
    standard: std({ prisFritext: '2.500' }),
  });
  assert.equal(p.pris, 3000);
  assert.equal(p.otolkbarPrisFritext, null);
});

// ═══════════════════════════════════════════════════════════════════════════
// D — KLASSIFICERINGSREGELN
// ═══════════════════════════════════════════════════════════════════════════

test('D1: ingen event-länk → hoppa', () => {
  const u = klass({ anmalan: anm({ eventId: null }) });
  assert.equal(u.beslut, BESLUT.hoppa);
  assert.equal(u.kod, 'ingen-event-lank');
});

test('D2: ZZ-ort → hoppa (fixturskyddet)', () => {
  const u = klass({ event: ev({ ort: 'ZZ-GRANSKNING-S113' }) });
  assert.equal(u.beslut, BESLUT.hoppa);
  assert.equal(u.kod, 'exkluderat-event');
});

test('D3: exkluderat event-ID → hoppa ÄVEN med icke-ZZ-ort (spärr i djupled)', () => {
  // Fixturens Ort kan döpas om; ID:t kan den inte. Detta är skälet till att
  // exkluderadeEventIds finns vid sidan av ortprefixet.
  const fixturId = POLICY.exkluderadeEventIds[0];
  const u = klass({ event: ev({ id: fixturId, ort: 'Falköping' }) });
  assert.equal(u.beslut, BESLUT.hoppa);
  assert.equal(u.kod, 'exkluderat-event');
});

test('D4: en redan backfillad anmälan backfillas inte igen', () => {
  const u = klass({
    anmalan: anm({ anmalningsavgiftFack: 'Mottagen', slutbetalningFack: 'Mottagen' }),
    event: ev({ pris: 2500 }),
    harHistorik: true,
  });
  assert.equal(u.beslut, BESLUT.redanBackfillad);
});

test('D5: fack-motsägelse (avgift Ej, slut Mottagen) → AVVIKELSE, aldrig en rad', () => {
  const u = klass({
    anmalan: anm({ anmalningsavgiftFack: 'Ej mottagen', slutbetalningFack: 'Mottagen' }),
    event: ev({ pris: 2500, anmalningsavgift: 1000 }),
  });
  assert.equal(u.beslut, BESLUT.avvikelse);
  assert.equal(u.kod, 'fack-motsagelse');
  assert.equal(u.belopp, undefined);
});

test('D6: NEGATIV KONSEKVENS — hade D5 backfillats hade BÅDA facken flippat', () => {
  // Bevisar VARFÖR D5 är en avvikelse och inte en backfill: beloppet
  // (pris − avgift = 1500) ger en härledning som säger raka motsatsen till vad
  // basen säger i dag. Testet fäller om någon "förbättrar" D5 till en backfill.
  const h = harledBetalning([{ belopp: 1500, status: 'aktiv' }], {
    avtalatPris: null,
    eventPris: 2500,
    anmalningsavgift: 1000,
    eventTyp: 'Utbildning',
  });
  assert.equal(h.anmalningsavgiftVarde, 'Mottagen'); // basen säger "Ej mottagen"
  assert.equal(h.slutbetalningVarde, 'Ej mottagen'); // basen säger "Mottagen"
});

test('D7: inget betalt och ingen närvaro → hoppa (inte en avvikelse)', () => {
  const u = klass({
    anmalan: anm({ anmalningsavgiftFack: 'Ej mottagen', slutbetalningFack: 'Ej mottagen' }),
    event: ev({ pris: 2500 }),
  });
  assert.equal(u.beslut, BESLUT.hoppa);
  assert.equal(u.kod, 'inget-betalt');
});

test('D8: mottaget fack men okänt pris → AVVIKELSE (aldrig gissat)', () => {
  const u = klass({
    anmalan: anm({ anmalningsavgiftFack: 'Mottagen', slutbetalningFack: 'Mottagen' }),
    event: ev(),
  });
  assert.equal(u.beslut, BESLUT.avvikelse);
  assert.equal(u.kod, 'pris-okant');
});

test('D9: närvaro → HELA priset', () => {
  const u = klass({ event: ev({ pris: 2500, anmalningsavgift: 1000 }), harNarvaro: true });
  assert.equal(u.beslut, BESLUT.backfilla);
  assert.equal(u.kod, 'narvaro');
  assert.equal(u.belopp, 2500);
});

test('D10: närvaro SLÅR facken — även när båda säger Ej mottagen', () => {
  const u = klass({
    anmalan: anm({ anmalningsavgiftFack: 'Ej mottagen', slutbetalningFack: 'Ej mottagen' }),
    event: ev({ pris: 2500, anmalningsavgift: 1000 }),
    harNarvaro: true,
  });
  assert.equal(u.beslut, BESLUT.backfilla);
  assert.equal(u.belopp, 2500);
});

test('D11: båda facken Mottagen → hela priset', () => {
  const u = klass({
    anmalan: anm({ anmalningsavgiftFack: 'Mottagen', slutbetalningFack: 'Mottagen' }),
    event: ev({ pris: 2500, anmalningsavgift: 1000 }),
  });
  assert.equal(u.beslut, BESLUT.backfilla);
  assert.equal(u.kod, 'bada-facken');
  assert.equal(u.belopp, 2500);
});

test('D12: bara avgiften Mottagen → AVGIFTENS pris, inte hela', () => {
  const u = klass({
    anmalan: anm({ anmalningsavgiftFack: 'Mottagen', slutbetalningFack: 'Ej mottagen' }),
    event: ev({ pris: 2500, anmalningsavgift: 1000 }),
  });
  assert.equal(u.beslut, BESLUT.backfilla);
  assert.equal(u.kod, 'anmalningsavgift');
  assert.equal(u.belopp, 1000);
});

test('D13: bara avgiften Mottagen men avgiftens pris OKÄNT → AVVIKELSE', () => {
  const u = klass({
    anmalan: anm({ anmalningsavgiftFack: 'Mottagen', slutbetalningFack: 'Ej mottagen' }),
    event: ev({ pris: 2500 }),
  });
  assert.equal(u.beslut, BESLUT.avvikelse);
  assert.equal(u.kod, 'avgiftspris-okant');
});

test('D14: föreläsning — ett pris utan fack, mottaget fack ⇒ hela priset', () => {
  const u = klass({
    anmalan: anm({ anmalningsavgiftFack: 'Mottagen', slutbetalningFack: null }),
    event: ev({ typ: 'Föreläsning', pris: 500 }),
    standard: std({ typ: 'Föreläsning' }),
  });
  assert.equal(u.beslut, BESLUT.backfilla);
  assert.equal(u.kod, 'forelasning');
  assert.equal(u.belopp, 500);
});

test('D15: KOPPLINGSBEVIS — D12:s belopp gör härledningen sann mot basens fack', () => {
  // Hela skivans syfte i ett test: backfillas 1000 kr på en anmälan där basen
  // säger Mottagen/Ej mottagen, ska härledningen säga PRECIS samma sak.
  const u = klass({
    anmalan: anm({ anmalningsavgiftFack: 'Mottagen', slutbetalningFack: 'Ej mottagen' }),
    event: ev({ pris: 2500, anmalningsavgift: 1000 }),
  });
  const h = harledBetalning([{ belopp: u.belopp, status: 'aktiv' }], {
    avtalatPris: null,
    eventPris: 2500,
    anmalningsavgift: 1000,
    eventTyp: 'Utbildning',
  });
  assert.equal(h.anmalningsavgiftVarde, 'Mottagen');
  assert.equal(h.slutbetalningVarde, 'Ej mottagen');
  assert.equal(h.saknas, 1500);
});

test('D16: KOPPLINGSBEVIS — D11:s belopp ger "allt betalt" och saknas 0', () => {
  const u = klass({
    anmalan: anm({ anmalningsavgiftFack: 'Mottagen', slutbetalningFack: 'Mottagen' }),
    event: ev({ pris: 2500, anmalningsavgift: 1000 }),
  });
  const h = harledBetalning([{ belopp: u.belopp, status: 'aktiv' }], {
    avtalatPris: null,
    eventPris: 2500,
    anmalningsavgift: 1000,
    eventTyp: 'Utbildning',
  });
  assert.equal(h.alltKlart, true);
  assert.equal(h.saknas, 0);
});

test('D17: avrundaOre håller öret (IEEE 754-driften är verklig)', () => {
  assert.equal(avrundaOre(0.1 + 0.2), 0.3); // 0.30000000000000004 utan avrundning
  assert.equal(avrundaOre(2500.4999999999995), 2500.5);
  assert.equal(avrundaOre(2500), 2500);
});

test('D18: KÄND KANT — halvören avrundas NEDÅT, och det är samma kant som EF-lagrets', () => {
  // `2500.555 * 100` är `250055.49999999997` i IEEE 754, inte `250055.5`, så
  // `Math.round` ger `250055` → `2500.55` och INTE `2500.56` som en
  // decimalintuition säger. Formen är kopierad verbatim ur
  // `_shared/betalningsharledning.ts` § avrundaOre, alltså EXAKT den semantik
  // härledningen redan har — att "rätta" den här hade gjort backfillens öre
  // oense med appens.
  //
  // Kanten är ofarlig i denna skiva: varje backfillat belopp kommer ur ett
  // Airtable-talfält med precision 2 eller ur `tolkaPrisFritext`, som avvisar
  // mer än två decimaler. Ett tresiffrigt öre kan alltså inte nå hit.
  assert.equal(avrundaOre(2500.555), 2500.55);
});

// ═══════════════════════════════════════════════════════════════════════════
// E — SQL-BYGGET
// ═══════════════════════════════════════════════════════════════════════════

const post = (over = {}) => ({
  anmalanRecordId: 'recAAAAAAAAAAAAAA',
  ogonblicksbildNamn: 'Test Testsson',
  ogonblicksbildEvent: 'Fjärrskådning',
  ogonblicksbildEventdatum: '2026-02-11',
  belopp: 2500,
  skapadAv: 'Backfill TASK-346.8 (bada-facken)',
  ...over,
});

test('E1: escapeSqlText dubblar apostrof (O’Brien-fallet)', () => {
  assert.equal(escapeSqlText("O'Brien"), "'O''Brien'");
});

test('E2: NEGATIV — escapeSqlText FÄLLER på NUL-byte', () => {
  assert.throws(() => escapeSqlText(`a${String.fromCharCode(0)}b`), /NUL-byte/);
});

test('E3: sqlDatum ger literalen null för tomt datum', () => {
  assert.equal(sqlDatum(null), 'null');
  assert.equal(sqlDatum(undefined), 'null');
  assert.equal(sqlDatum(''), 'null');
});

test('E4: NEGATIV — sqlDatum FÄLLER på skräp', () => {
  assert.throws(() => sqlDatum('igår'), /fel form/);
});

test('E5: NEGATIV — sqlBelopp FÄLLER på icke-tal', () => {
  assert.throws(() => sqlBelopp('2500'), /inte ett tal/);
  assert.throws(() => sqlBelopp(Number.NaN), /inte ett tal/);
  assert.throws(() => sqlBelopp(Number.POSITIVE_INFINITY), /inte ett tal/);
});

test('E6: AC #1 — satsen sätter betalningsdatum till NULL, aldrig ett datum', () => {
  const sql = byggInsertSats(post(), POLICY);
  // Kolumnlistan har betalningsdatum på plats 7; värdet på samma plats är null.
  assert.match(sql, /betalsatt, betalningsdatum, typ, status, skapad_av/);
  assert.match(sql, /\n\s*null, 'inbetalning', 'aktiv',/);
  assert.ok(!/betalningsdatum\s*=\s*date/.test(sql));
});

test('E7: AC #1 — satsen bär idempotens-predikatet i DATABASEN', () => {
  const sql = byggInsertSats(post(), POLICY);
  assert.match(sql, /where not exists \(/);
  assert.match(sql, /anmalan_record_id = 'recAAAAAAAAAAAAAA' and betalsatt = 'Historik'/);
});

test('E8: satsen sätter betalsätt Historik och status aktiv', () => {
  const sql = byggInsertSats(post(), POLICY);
  assert.match(sql, /'Historik'/);
  assert.match(sql, /'inbetalning', 'aktiv'/);
});

test('E9: satsen bär källan per rad (AC #1: "källa bokförd per rad")', () => {
  const sql = byggInsertSats(
    post({ skapadAv: 'Backfill TASK-346.8 (narvaro; pris ur X)' }),
    POLICY,
  );
  assert.match(sql, /'Backfill TASK-346\.8 \(narvaro; pris ur X\)'/);
});

test('E10: NEGATIV — byggInsertSats FÄLLER på fel record-ID-form', () => {
  assert.throws(
    () => byggInsertSats(post({ anmalanRecordId: 'inte-ett-rec-id' }), POLICY),
    /fel form/,
  );
  assert.throws(() => byggInsertSats(post({ anmalanRecordId: '' }), POLICY), /fel form/);
});

test('E11: ett namn med apostrof ger en giltig sats, inte en bruten', () => {
  const sql = byggInsertSats(post({ ogonblicksbildNamn: "Lotta O'Hara" }), POLICY);
  assert.match(sql, /'Lotta O''Hara'/);
  // Antalet apostrofer måste vara jämnt — annars är strängen obalanserad.
  assert.equal((sql.match(/'/g) ?? []).length % 2, 0);
});

test('E12: beloppet skrivs med två decimaler (numeric(12,2))', () => {
  assert.equal(sqlBelopp(2500), '2500.00');
  assert.equal(sqlBelopp(1000.5), '1000.50');
});

// ═══════════════════════════════════════════════════════════════════════════
// F — IDEMPOTENSEN, TVÅSIDIGT
// ═══════════════════════════════════════════════════════════════════════════

const planIndata = (historik = []) => ({
  anmalningar: [
    anm({
      id: 'recAAAAAAAAAAAAAA',
      anmalningsavgiftFack: 'Mottagen',
      slutbetalningFack: 'Mottagen',
    }),
  ],
  event: [ev({ pris: 2500, anmalningsavgift: 1000 })],
  standarder: new Map(),
  narvaroPerAnmalan: new Set(),
  historikPerAnmalan: new Set(historik),
  // KRÄVS av `planera` sedan granskningsrunda 3 — en utelämnad Map stängde
  // tidigare dubbelräkningsgrinden tyst. N5 skriver över den med innehåll.
  aktivIckeHistorikPerAnmalan: new Map(),
  policy: POLICY,
});

test('F1: FÖRSTA körningen planerar raden', () => {
  const p = planera(planIndata());
  assert.equal(p.backfill.length, 1);
  assert.equal(p.backfill[0].belopp, 2500);
});

test('F2: NEGATIV — ANDRA körningen planerar INGEN rad (idempotensen)', () => {
  const p = planera(planIndata(['recAAAAAAAAAAAAAA']));
  assert.equal(p.backfill.length, 0);
  assert.equal(p.hoppade.length, 1);
  assert.equal(p.hoppade[0].kod, 'redan-backfillad');
});

test('F3: planen bokför källan i skapad_av per rad', () => {
  const p = planera(planIndata());
  assert.match(p.backfill[0].skapadAv, /^Backfill TASK-346\.8 \(bada-facken; pris ur /);
});

test('F4: ögonblicksbilden fylls ur eventet, aldrig tom', () => {
  const p = planera(planIndata());
  assert.equal(p.backfill[0].ogonblicksbildEvent, 'Fjärrskådning');
  assert.equal(p.backfill[0].ogonblicksbildEventdatum, '2026-02-11');
  assert.equal(p.backfill[0].ogonblicksbildNamn, 'Test Testsson');
});

test('F5: en namnlös anmälan får en läsbar platshållare, inte tom sträng (NOT NULL)', () => {
  const indata = planIndata();
  indata.anmalningar = [
    anm({ namn: '', anmalningsavgiftFack: 'Mottagen', slutbetalningFack: 'Mottagen' }),
  ];
  const p = planera(indata);
  assert.equal(p.backfill[0].ogonblicksbildNamn, 'Okänt namn');
});

// ═══════════════════════════════════════════════════════════════════════════
// G — SPEGELPATCHEN
// ═══════════════════════════════════════════════════════════════════════════

test('G1: spegeln bär summan och båda facken', () => {
  const h = harledBetalning([{ belopp: 2500, status: 'aktiv' }], {
    avtalatPris: null,
    eventPris: 2500,
    anmalningsavgift: 1000,
    eventTyp: 'Utbildning',
  });
  const patch = byggSpegelPatch(h);
  assert.equal(patch['Summa inbetalt (kr)'], 2500);
  assert.equal(patch['Anmälningsavgift'], 'Mottagen');
  assert.equal(patch['Slutbetalning'], 'Mottagen');
});

test('G2: ett fack härledningen inte kan avgöra RÖRS INTE (null rensar aldrig)', () => {
  const h = harledBetalning([{ belopp: 500, status: 'aktiv' }], {
    avtalatPris: null,
    eventPris: null,
    anmalningsavgift: null,
    eventTyp: 'Utbildning',
  });
  assert.equal(h.anmalningsavgiftVarde, null);
  const patch = byggSpegelPatch(h);
  assert.ok(!('Anmälningsavgift' in patch));
  assert.ok(!('Slutbetalning' in patch));
  assert.equal(patch['Summa inbetalt (kr)'], 500);
});

test('G3: NEGATIV — allowlisten FÄLLER ett fält spegeln inte äger', () => {
  // `Saknas (kr)` är en Airtable-FORMEL (basen räknar själv) och ligger
  // MEDVETET utanför operationen. Testet prövar den mekanism `byggSpegelPatch`
  // faktiskt kör — `findDisallowedField` ur EF-lagret — på en patch som bär
  // ett otillåtet fält. Skulle någon lägga till formelfältet i allowlisten
  // fäller detta test innan skrivningen når basen.
  const operation = getOperation(SPEGEL_OPERATION);
  assert.ok(operation, 'allowlist-operationen måste finnas i EF-lagret');
  assert.ok(!operation.allowedFields.includes('Saknas (kr)'));
  assert.equal(findDisallowedField(operation, { 'Saknas (kr)': 0 }), 'Saknas (kr)');
  // Och det omvända: en giltig spegelpatch släpps igenom.
  assert.equal(findDisallowedField(operation, { 'Summa inbetalt (kr)': 2500 }), null);
});

test('G4: spegelns fält är EXAKT de EF-lagret äger (drift fälls här)', () => {
  const operation = getOperation(SPEGEL_OPERATION);
  for (const f of ['Summa inbetalt (kr)', 'Anmälningsavgift', 'Slutbetalning']) {
    assert.ok(operation.allowedFields.includes(f), `${f} saknas i allowlisten`);
  }
  assert.equal(operation.tableId, 'Anmälningar');
});

// ═══════════════════════════════════════════════════════════════════════════
// H — MÄTNINGEN
// ═══════════════════════════════════════════════════════════════════════════

test('H1: FÖRE-mätningen räknar noll betalt när inga inbetalningar finns', () => {
  const m = berknaMatning({
    anmalningar: [anm()],
    event: [ev({ pris: 2500 })],
    standarder: new Map(),
    inbetalningarPerAnmalan: new Map(),
  });
  assert.equal(m.antalAnmalningar, 1);
  assert.equal(m.antalInbetalningar, 0);
  assert.equal(m.summaKronor, 0);
  assert.equal(m.antalMedKantPris, 1);
  assert.equal(m.antalAlltBetalt, 0);
});

test('H2: EFTER-mätningen räknar "allt betalt" när summan når priset', () => {
  const m = berknaMatning({
    anmalningar: [anm()],
    event: [ev({ pris: 2500 })],
    standarder: new Map(),
    inbetalningarPerAnmalan: new Map([['recAAAAAAAAAAAAAA', [{ belopp: 2500, status: 'aktiv' }]]]),
  });
  assert.equal(m.antalInbetalningar, 1);
  assert.equal(m.summaKronor, 2500);
  assert.equal(m.antalAlltBetalt, 1);
  assert.equal(m.andelAlltBetaltAvAlla, 1);
  assert.equal(m.andelAlltBetaltAvKantPris, 1);
});

test('H3: de två nämnarna skiljer sig när priset är okänt för några', () => {
  const m = berknaMatning({
    anmalningar: [
      anm({ id: 'recAAAAAAAAAAAAAA' }),
      anm({ id: 'recDDDDDDDDDDDDDD', eventId: null }),
    ],
    event: [ev({ pris: 2500 })],
    standarder: new Map(),
    inbetalningarPerAnmalan: new Map([['recAAAAAAAAAAAAAA', [{ belopp: 2500, status: 'aktiv' }]]]),
  });
  assert.equal(m.antalAnmalningar, 2);
  assert.equal(m.antalMedKantPris, 1);
  assert.equal(m.andelAlltBetaltAvAlla, 0.5);
  assert.equal(m.andelAlltBetaltAvKantPris, 1);
});

test('H4: NEGATIV — en MAKULERAD post räknas inte som betald', () => {
  const m = berknaMatning({
    anmalningar: [anm()],
    event: [ev({ pris: 2500 })],
    standarder: new Map(),
    inbetalningarPerAnmalan: new Map([
      ['recAAAAAAAAAAAAAA', [{ belopp: 2500, status: 'makulerad' }]],
    ]),
  });
  assert.equal(m.antalInbetalningar, 1);
  assert.equal(m.summaKronor, 0);
  assert.equal(m.antalAlltBetalt, 0);
});

// ═══════════════════════════════════════════════════════════════════════════
// I — EVENTPRISERNAS PLAN
// ═══════════════════════════════════════════════════════════════════════════

const eventprisIndata = (over = {}) => ({
  event: [ev()],
  standarder: new Map([
    [standardNyckel('Fjärrskådning', 'Utbildning'), std({ pris: 2500, anmalningsavgift: 1000 })],
  ]),
  anmalningar: [anm()],
  policy: POLICY,
  ...over,
});

test('I1: ett event utan egna priser men med standard får båda fälten', () => {
  const p = planeraEventpriser(eventprisIndata());
  assert.equal(p.length, 1);
  assert.equal(p[0].falt['Pris (kr)'], 2500);
  assert.equal(p[0].falt['Anmälningsavgift (kr)'], 1000);
  assert.match(p[0].kallor['Pris (kr)'], /^Eventinnehåll recCCCCCCCCCCCCCC · Pris \(kr\)$/);
});

test('I2: NEGATIV — ett event som REDAN har sina priser rörs inte', () => {
  const p = planeraEventpriser(
    eventprisIndata({ event: [ev({ pris: 3000, anmalningsavgift: 1200 })] }),
  );
  assert.equal(p.length, 0);
});

test('I3: bara det TOMMA fältet fylls (delvis ifyllt event)', () => {
  const p = planeraEventpriser(eventprisIndata({ event: [ev({ pris: 3000 })] }));
  assert.equal(p.length, 1);
  assert.ok(!('Pris (kr)' in p[0].falt));
  assert.equal(p[0].falt['Anmälningsavgift (kr)'], 1000);
});

test('I4: NEGATIV — ett event UTAN anmälningar rörs inte (skrivningen vore meningslös)', () => {
  const p = planeraEventpriser(eventprisIndata({ anmalningar: [] }));
  assert.equal(p.length, 0);
});

test('I5: NEGATIV — ett exkluderat (ZZ) event rörs inte', () => {
  const p = planeraEventpriser(eventprisIndata({ event: [ev({ ort: 'ZZ-GRANSKNING-S113' })] }));
  assert.equal(p.length, 0);
});

test('I6: NEGATIV — utan Eventinnehåll-standard finns inget att skriva', () => {
  const p = planeraEventpriser(eventprisIndata({ standarder: new Map() }));
  assert.equal(p.length, 0);
});

test('I7: fritext-källan bokförs ORDAGRANT i planen', () => {
  const p = planeraEventpriser(
    eventprisIndata({
      standarder: new Map([
        [standardNyckel('Fjärrskådning', 'Utbildning'), std({ prisFritext: '2.500' })],
      ]),
    }),
  );
  assert.equal(p[0].falt['Pris (kr)'], 2500);
  assert.match(p[0].kallor['Pris (kr)'], /fritext "2\.500"/);
});

test('I8: standardNyckel skiljer (A, "B C") från ("A B", C) — separatorn bär sin vikt', () => {
  assert.notEqual(standardNyckel('A', 'B C'), standardNyckel('A B', 'C'));
});

// ═══════════════════════════════════════════════════════════════════════════
// J — db query-SVARETS PARSNING
// ═══════════════════════════════════════════════════════════════════════════

test('J1: rows plockas ur CLI:ts brusiga utdata', () => {
  const stdout = [
    'Initialising login role...',
    '{',
    '  "boundary": "abc",',
    '  "rows": [ { "antal": 2 } ],',
    '  "warning": "untrusted"',
    '}',
    'A new version of Supabase CLI is available: v2.116.0',
  ].join('\n');
  assert.deepEqual(parsaDbQuerySvar(stdout), [{ antal: 2 }]);
});

test('J2: NEGATIV — ett _tag:Error-svar KASTAR i stället för att läsas som tomt', () => {
  const stdout = '{"_tag":"Error","error":{"code":"X","message":"trasigt"}}';
  assert.throws(() => parsaDbQuerySvar(stdout), /db query-fel: X trasigt/);
});

test('J3: NEGATIV — utdata utan JSON KASTAR', () => {
  assert.throws(() => parsaDbQuerySvar('bara brus'), /Kunde inte hitta JSON/);
  assert.throws(() => parsaDbQuerySvar(''), /Kunde inte hitta JSON/);
});

test('J4: NEGATIV — trasig JSON KASTAR', () => {
  assert.throws(() => parsaDbQuerySvar('{ "rows": [ }'), /inte giltig JSON/);
});

test('J5: ett svar utan rows ger tom lista, inte undefined', () => {
  assert.deepEqual(parsaDbQuerySvar('{"boundary":"x"}'), []);
});

// ═══════════════════════════════════════════════════════════════════════════
// K — KORSLÄSNINGEN MOT DE DELADE EF-MODULERNA
// ═══════════════════════════════════════════════════════════════════════════

test('K1: skriptet använder EF-lagrets härledning, inte en egen kopia', () => {
  // Om någon duplicerar `harledBetalning` in i skriptet slutar detta test vara
  // meningsfullt — men då fäller D15/D16, som korsläser de två.
  const kalla = readFileSync(join(REPO_ROT, 'scripts/backfill-inbetalningar.mjs'), 'utf8');
  assert.match(kalla, /from '\.\.\/supabase\/functions\/_shared\/betalningsharledning\.ts'/);
  assert.match(kalla, /from '\.\.\/supabase\/functions\/_shared\/field-allowlists\.ts'/);
  assert.ok(
    !/function harledBetalning/.test(kalla),
    'härledningen får aldrig kopieras in i skriptet',
  );
});

test('K2: policyns närvarostatus matchar basens poänggivande värden', () => {
  // data-model.md § Status-värden — Deltaganden: Närvarande och Deltog online
  // är de två som ger Närvaropoäng = 1.
  assert.deepEqual(POLICY.narvaroStatus, ['Närvarande', 'Deltog online']);
});

test('K3: policyns betalsätt finns i migrationens check-constraint', () => {
  const migration = readFileSync(
    join(
      REPO_ROT,
      'supabase/migrations/20260830195728_betalningsdomanen_inbetalningar_kvitton.sql',
    ),
    'utf8',
  );
  assert.match(migration, /check \(betalsatt in \('Swish', 'Bankgiro', 'Plusgiro', 'Historik'\)\)/);
  assert.equal(POLICY.betalsatt, 'Historik');
});

test('K4: betalningsdatum-kolumnen ÄR nullable — AC #1:s förutsättning', () => {
  // Faller detta är hela "datum tomt"-kravet omöjligt och skivan måste ritas om.
  const migration = readFileSync(
    join(
      REPO_ROT,
      'supabase/migrations/20260830195728_betalningsdomanen_inbetalningar_kvitton.sql',
    ),
    'utf8',
  );
  assert.match(migration, /^\s*betalningsdatum date,$/m);
});

// ═══════════════════════════════════════════════════════════════════════════
// L — LÄNKTILLSTÅNDETS PREFLIGHT (granskningsrunda 1, fynd 1)
// ═══════════════════════════════════════════════════════════════════════════

const STAGING = POLICY.tillatnaProjectRefs[0];
const PROD_REF = readFileSync(join(REPO_ROT, '.prod-ref-policy.conf'), 'utf8').match(
  /^PROD_REF_PROD="([^"]+)"/m,
)?.[1];

test('L1: filen SAKNAS ⇒ olänkat läge, körningen släpps (den mätta vägen)', () => {
  const u = provaLanktillstand({ lanktRef: null, malRef: STAGING, prodRef: PROD_REF });
  assert.equal(u.ok, true);
  assert.equal(u.lage, 'olankat');
});

test('L2: tom fil behandlas som olänkat, inte som en ref', () => {
  assert.equal(
    provaLanktillstand({ lanktRef: '   ', malRef: STAGING, prodRef: PROD_REF }).ok,
    true,
  );
});

test('L3: filen bär MÅLREFEN ⇒ släpps', () => {
  const u = provaLanktillstand({ lanktRef: STAGING, malRef: STAGING, prodRef: PROD_REF });
  assert.equal(u.ok, true);
  assert.equal(u.lage, 'lankat-till-mal');
});

test('L4: NEGATIV — filen bär ett ANNAT projekt ⇒ VÄGRAR (fail-closed)', () => {
  const u = provaLanktillstand({
    lanktRef: 'abcdefghijklmnopqrst',
    malRef: STAGING,
    prodRef: PROD_REF,
  });
  assert.equal(u.ok, false);
  assert.equal(u.lage, 'lankat-till-annat');
  assert.match(u.skal, /Fail-closed/);
});

test('L5: NEGATIV — filen bär PROD ⇒ VÄGRAR ÄVEN med korrekt --projekt-ref', () => {
  // Detta är fyndets kärna: argumentet är helt rätt (staging), och körningen
  // ska ändå stoppas, eftersom flaggans företräde över sticky länktillstånd
  // är obevisat åt säkerhetshållet.
  assert.ok(PROD_REF, 'PROD_REF_PROD saknas i .prod-ref-policy.conf');
  const u = provaLanktillstand({ lanktRef: PROD_REF, malRef: STAGING, prodRef: PROD_REF });
  assert.equal(u.ok, false);
  assert.equal(u.lage, 'lankat-till-prod');
  assert.match(u.skal, /PROD/);
});

test('L6: trailing newline i filen tolkas bort (link skriver den)', () => {
  assert.equal(
    provaLanktillstand({ lanktRef: `${STAGING}\n`, malRef: STAGING, prodRef: PROD_REF }).ok,
    true,
  );
});

test('L7: lasLanktillstand ger null när filen saknas (ingen krasch)', () => {
  assert.equal(lasLanktillstand('/tmp/finns-inte-t3468'), null);
  assert.equal(LANKTILLSTAND_FIL, 'supabase/.temp/project-ref');
});

// ─────────────────────────────────────────────────────────────────────────
// L8–L11: prodGodkand (TASK-360) — den HÅRDA "länk=PROD"-vägran gäller ändå
// för VARJE annan kombination, och släpper ENDAST länk=PROD + mål=PROD.
// ─────────────────────────────────────────────────────────────────────────

test('L8: prodGodkand SLÄPPER ENDAST när länk=PROD OCH mål=PROD', () => {
  assert.ok(PROD_REF, 'PROD_REF_PROD saknas i .prod-ref-policy.conf');
  const u = provaLanktillstand({
    lanktRef: PROD_REF,
    malRef: PROD_REF,
    prodRef: PROD_REF,
    prodGodkand: true,
  });
  assert.equal(u.ok, true);
  assert.equal(u.lage, 'lankat-till-prod-godkand');
});

test('L9: NEGATIV — prodGodkand UTAN flaggan (default false) är OFÖRÄNDRAT samma som L5', () => {
  const u = provaLanktillstand({ lanktRef: PROD_REF, malRef: PROD_REF, prodRef: PROD_REF });
  assert.equal(u.ok, false);
  assert.equal(u.lage, 'lankat-till-prod');
});

test('L10: NEGATIV — prodGodkand=true räddar INTE länk=PROD + mål=staging (samma som L5)', () => {
  // Kärnan i fyndet: godkännandet gäller den EXAKTA "båda pekar mot prod"
  // -kombinationen, aldrig "länken råkar vara prod men ingen bad om det".
  const u = provaLanktillstand({
    lanktRef: PROD_REF,
    malRef: STAGING,
    prodRef: PROD_REF,
    prodGodkand: true,
  });
  assert.equal(u.ok, false);
  assert.equal(u.lage, 'lankat-till-prod');
  assert.match(u.skal, /PROD/);
});

test('L11: prodGodkand=true stör INTE det normala länk=mål-fallet (staging, oförändrat)', () => {
  const u = provaLanktillstand({
    lanktRef: STAGING,
    malRef: STAGING,
    prodRef: PROD_REF,
    prodGodkand: true,
  });
  assert.equal(u.ok, true);
  assert.equal(u.lage, 'lankat-till-mal');
});

// ═══════════════════════════════════════════════════════════════════════════
// M — BELOPPSGRINDEN (granskningsrunda 1, fynd 2)
// ═══════════════════════════════════════════════════════════════════════════

test('M1: 0-pris HOPPAS ÖVER — "allt betalt" är redan sant utan rader', () => {
  const u = klass({
    anmalan: anm({ anmalningsavgiftFack: 'Mottagen', slutbetalningFack: 'Mottagen' }),
    event: ev({ pris: 0, anmalningsavgift: 0 }),
  });
  assert.equal(u.beslut, BESLUT.hoppa);
  assert.equal(u.kod, 'noll-belopp');
  // Kontrasten som gör hoppet rätt: härledningen säger redan alltKlart.
  const h = harledBetalning([], {
    avtalatPris: null,
    eventPris: 0,
    anmalningsavgift: 0,
    eventTyp: 'Utbildning',
  });
  assert.equal(h.alltKlart, true);
  assert.equal(h.saknas, 0);
});

test('M2: NEGATIV — negativt pris är en AVVIKELSE, aldrig en rad', () => {
  const u = klass({
    anmalan: anm({ anmalningsavgiftFack: 'Mottagen', slutbetalningFack: 'Mottagen' }),
    event: ev({ pris: -500 }),
  });
  assert.equal(u.beslut, BESLUT.avvikelse);
  assert.equal(u.kod, 'negativt-pris');
});

test('M3: NEGATIV — sqlBelopp FÄLLER 0 när positivt krävs (belopp_ej_noll)', () => {
  assert.throws(() => sqlBelopp(0, { mastePositivt: true }), /måste vara > 0/);
});

test('M4: NEGATIV — sqlBelopp FÄLLER negativt när positivt krävs (tecken_foljer_typ)', () => {
  assert.throws(() => sqlBelopp(-100, { mastePositivt: true }), /måste vara > 0/);
});

test('M5: byggInsertSats FÄLLER en nollrad innan den når databasen', () => {
  assert.throws(() => byggInsertSats(post({ belopp: 0 }), POLICY), /måste vara > 0/);
  assert.throws(() => byggInsertSats(post({ belopp: -2500 }), POLICY), /måste vara > 0/);
});

test('M6: sqlBelopp utan flaggan är oförändrad (0 är ett giltigt tal att rendera)', () => {
  assert.equal(sqlBelopp(0), '0.00');
});

// ═══════════════════════════════════════════════════════════════════════════
// N — AKTIVA ICKE-HISTORIK-INBETALNINGAR (granskningsrunda 1, fynd 3)
// ═══════════════════════════════════════════════════════════════════════════

test('N1: NEGATIV — en aktiv Swish-post gör anmälan till avvikelse, inte backfill', () => {
  const u = klass({
    anmalan: anm({ anmalningsavgiftFack: 'Mottagen', slutbetalningFack: 'Mottagen' }),
    event: ev({ pris: 2500, anmalningsavgift: 1000 }),
    aktivaIckeHistorik: { antal: 1, summa: 1000 },
  });
  assert.equal(u.beslut, BESLUT.avvikelse);
  assert.equal(u.kod, 'har-aktiva-inbetalningar');
  assert.equal(u.aktivaIckeHistorik.antal, 1);
  assert.equal(u.aktivaIckeHistorik.summa, 1000);
  assert.match(u.skal, /dubbelräknat/);
});

test('N2: KONSEKVENSEN — utan grinden hade summan blivit 3500 av 2500', () => {
  // Bevisar VARFÖR N1 är en avvikelse: den befintliga posten plus en
  // backfill av hela priset ger en summa som ingen betalat, och spegeln hade
  // sagt "allt betalt" på den.
  const h = harledBetalning(
    [
      { belopp: 1000, status: 'aktiv' },
      { belopp: 2500, status: 'aktiv' },
    ],
    { avtalatPris: null, eventPris: 2500, anmalningsavgift: 1000, eventTyp: 'Utbildning' },
  );
  assert.equal(h.summa, 3500);
  assert.equal(h.saknas, -1000);
});

test('N3: utan aktiva poster backfillas anmälan normalt (grindens andra sida)', () => {
  // Att MAKULERADE poster inte räknas in bevisas i § P, mot den FAKTISKA
  // indexeringen — inte här, där värdet skickas in färdigt.
  const u = klass({
    anmalan: anm({ anmalningsavgiftFack: 'Mottagen', slutbetalningFack: 'Mottagen' }),
    event: ev({ pris: 2500, anmalningsavgift: 1000 }),
    aktivaIckeHistorik: INGA_AKTIVA,
  });
  assert.equal(u.beslut, BESLUT.backfilla);
  assert.equal(u.belopp, 2500);
});

test('N4: grinden ligger EFTER redan-backfillad (en egen Historik-post vinner)', () => {
  const u = klass({
    anmalan: anm({ anmalningsavgiftFack: 'Mottagen', slutbetalningFack: 'Mottagen' }),
    event: ev({ pris: 2500 }),
    harHistorik: true,
    aktivaIckeHistorik: { antal: 1, summa: 1000 },
  });
  assert.equal(u.beslut, BESLUT.redanBackfillad);
});

test('N5: planen listar avvikelsen med record-ID och summa', () => {
  const indata = planIndata();
  indata.aktivIckeHistorikPerAnmalan = new Map([['recAAAAAAAAAAAAAA', { antal: 2, summa: 1500 }]]);
  const p = planera(indata);
  assert.equal(p.backfill.length, 0);
  assert.equal(p.avvikelser.length, 1);
  assert.equal(p.avvikelser[0].kod, 'har-aktiva-inbetalningar');
  assert.equal(p.avvikelser[0].anmalanRecordId, 'recAAAAAAAAAAAAAA');
  assert.equal(p.avvikelser[0].aktivaIckeHistorik.antal, 2);
  assert.equal(p.avvikelser[0].aktivaIckeHistorik.summa, 1500);
});

// ═══════════════════════════════════════════════════════════════════════════
// O — SPEGELNS KONVERGENS (granskningsrunda 1, fynd 4)
// ═══════════════════════════════════════════════════════════════════════════

test('O1: en redan backfillad anmälan hamnar i EGEN lista, inte bara i hoppade', () => {
  // Del C itererar backfill ∪ redanBackfillad; utan den egna listan hade en
  // spegel som fallerade i en tidigare körning aldrig reparerats.
  const p = planera(planIndata(['recAAAAAAAAAAAAAA']));
  assert.equal(p.redanBackfillad.length, 1);
  assert.equal(p.redanBackfillad[0].anmalanRecordId, 'recAAAAAAAAAAAAAA');
  assert.equal(p.backfill.length, 0);
});

test('O2: listan är tom när inget är backfillat sedan tidigare', () => {
  const p = planera(planIndata());
  assert.equal(p.redanBackfillad.length, 0);
});

test('O3: Del C:s iteration täcker BÅDA listorna (kopplingsvakt mot koden)', () => {
  const kalla = readFileSync(join(REPO_ROT, 'scripts/backfill-inbetalningar.mjs'), 'utf8');
  assert.match(kalla, /for \(const p of \[\.\.\.plan\.backfill, \.\.\.plan\.redanBackfillad\]\)/);
});

test('O4: prosan överlovar inte — filhuvudet skiljer strukturell från konvergent', () => {
  // ADR-083: en text som säger "körs om rakt av" om BÅDA halvorna påstår en
  // garanti spegeln inte har.
  const kalla = readFileSync(join(REPO_ROT, 'scripts/backfill-inbetalningar.mjs'), 'utf8');
  assert.match(kalla, /SPEGELN är KONVERGENT, inte idempotent i samma mening/);
  assert.ok(!/En avbruten körning kan alltså köras om rakt av/.test(kalla));
});

// ═══════════════════════════════════════════════════════════════════════════
// P — INDEXERINGEN (granskningsrunda 2, fynd 1 + 3)
// ═══════════════════════════════════════════════════════════════════════════

const pgRad = (over = {}) => ({
  anmalan_record_id: 'recAAAAAAAAAAAAAA',
  belopp: '2500.00',
  status: 'aktiv',
  betalsatt: 'Swish',
  ...over,
});

test('P1: en aktiv Swish-post räknas som förekomst med sitt belopp', () => {
  const i = indexeraInbetalningar([pgRad()], 'Historik');
  assert.deepEqual(i.aktivIckeHistorikPerAnmalan.get('recAAAAAAAAAAAAAA'), {
    antal: 1,
    summa: 2500,
  });
});

test('P2: NEGATIV — status-filtret håller: en MAKULERAD post räknas inte', () => {
  // Fallet som tidigare var obevakat: en mutation av `rad.status === 'aktiv'`
  // överlevde hela sviten (granskningsrunda 2, fynd 3).
  const i = indexeraInbetalningar([pgRad({ status: 'makulerad' })], 'Historik');
  assert.equal(i.aktivIckeHistorikPerAnmalan.has('recAAAAAAAAAAAAAA'), false);
  // Men posten finns kvar i mängden härledningen räknar på:
  assert.equal(i.inbetalningarPerAnmalan.get('recAAAAAAAAAAAAAA').length, 1);
});

test('P3: NEGATIV — en Historik-post räknas som backfillad, inte som "aktiv annan"', () => {
  const i = indexeraInbetalningar([pgRad({ betalsatt: 'Historik' })], 'Historik');
  assert.equal(i.historikPerAnmalan.has('recAAAAAAAAAAAAAA'), true);
  assert.equal(i.aktivIckeHistorikPerAnmalan.has('recAAAAAAAAAAAAAA'), false);
});

test('P4: KÄRNFALLET — +2500 och −2500 ger netto 0 men ANTAL 2', () => {
  // Granskarens skarpbevisade motexempel mot netto-formen. En `summa > 0`-grind
  // hade släppt igenom detta och backfillat hela priset ovanpå — spegeln hade
  // sagt "allt betalt" för någon som netto betalat noll.
  const i = indexeraInbetalningar(
    [pgRad({ belopp: '2500.00' }), pgRad({ belopp: '-2500.00' })],
    'Historik',
  );
  const v = i.aktivIckeHistorikPerAnmalan.get('recAAAAAAAAAAAAAA');
  assert.equal(v.summa, 0, 'nettot ÄR noll — det är hela poängen');
  assert.equal(v.antal, 2);
});

test('P5: KÄRNFALLET, andra halvan — netto 0 FÄLLER ändå (förekomst, inte netto)', () => {
  const u = klass({
    anmalan: anm({ anmalningsavgiftFack: 'Mottagen', slutbetalningFack: 'Mottagen' }),
    event: ev({ pris: 2500, anmalningsavgift: 1000 }),
    aktivaIckeHistorik: { antal: 2, summa: 0 },
  });
  assert.equal(u.beslut, BESLUT.avvikelse);
  assert.equal(u.kod, 'har-aktiva-inbetalningar');
});

test('P6: NEGATIV — negativt netto fälls av samma grind, utan specialfall', () => {
  const u = klass({
    anmalan: anm({ anmalningsavgiftFack: 'Mottagen', slutbetalningFack: 'Mottagen' }),
    event: ev({ pris: 2500 }),
    aktivaIckeHistorik: { antal: 1, summa: -500 },
  });
  assert.equal(u.beslut, BESLUT.avvikelse);
  assert.equal(u.kod, 'har-aktiva-inbetalningar');
});

test('P7: flera anmälningar hålls isär', () => {
  const i = indexeraInbetalningar(
    [pgRad(), pgRad({ anmalan_record_id: 'recBBBBBBBBBBBBBB', belopp: '1000.00' })],
    'Historik',
  );
  assert.equal(i.aktivIckeHistorikPerAnmalan.get('recAAAAAAAAAAAAAA').summa, 2500);
  assert.equal(i.aktivIckeHistorikPerAnmalan.get('recBBBBBBBBBBBBBB').summa, 1000);
});

test('P8: tom indata ger tomma uppslag (ingen krasch)', () => {
  const i = indexeraInbetalningar([], 'Historik');
  assert.equal(i.inbetalningarPerAnmalan.size, 0);
  assert.equal(i.historikPerAnmalan.size, 0);
  assert.equal(i.aktivIckeHistorikPerAnmalan.size, 0);
});

// ═══════════════════════════════════════════════════════════════════════════
// Q — KOPPLINGSVAKTER MOT main() (granskningsrunda 2, fynd 2)
// ═══════════════════════════════════════════════════════════════════════════

const KALLA = readFileSync(join(REPO_ROT, 'scripts/backfill-inbetalningar.mjs'), 'utf8');

test('Q1: preflighten är FAKTISKT anropad i main(), inte bara definierad', () => {
  // Fyndet: en `{ ok: true }`-mutation i main() överlevde 118/118, eftersom
  // ingen vakt band den rena funktionen till anropsstället.
  assert.match(KALLA, /const lankUtfall = provaLanktillstand\(\{/);
  assert.match(KALLA, /if \(!lankUtfall\.ok\) \{/);
  assert.match(KALLA, /Länktillstånd: \$\{lankUtfall\.skal\}/);
});

test('Q2: preflighten körs FÖRE staging-semaforen (ordningen är lastbärande)', () => {
  // Semaforen kan avsluta processen med 76/77; ligger länkkontrollen efter den
  // blir den aldrig nådd när CI håller basen.
  const iPreflight = KALLA.indexOf('const lankUtfall = provaLanktillstand(');
  const iSemafor = KALLA.indexOf("kravStagingLedigt('backfill-inbetalningar')");
  assert.ok(iPreflight > 0, 'provaLanktillstand-anropet saknas i main()');
  assert.ok(iSemafor > 0, 'kravStagingLedigt-anropet saknas i main()');
  assert.ok(iPreflight < iSemafor, 'länkpreflighten måste ligga FÖRE semaforen');
});

test('Q3: länktillståndet LÄSES från disk, inte antaget', () => {
  assert.match(KALLA, /const lankt = lasLanktillstand\(\);/);
});

test('Q4: identisk-patch-hoppet är inkopplat i Del C', () => {
  assert.match(KALLA, /if \(patchArIdentisk\(patch, a\)\) \{/);
});

test('Q5: aktiv-indexet är FAKTISKT med i planera-anropet i main()', () => {
  // Granskningsrunda 3: en mutation som kapade `aktivIckeHistorikPerAnmalan`
  // ur anropet gav 137/137 gröna med dubbelräkningsgrinden tyst avstängd.
  // Vakten binder argumentet till anropsstället, precis som Q1 binder
  // preflighten.
  const anrop = KALLA.match(/const plan = planera\(\{[\s\S]*?\}\);/);
  assert.ok(anrop, 'planera-anropet i main() hittades inte');
  for (const arg of [
    'anmalningar',
    'event',
    'standarder',
    'narvaroPerAnmalan',
    'historikPerAnmalan',
    'aktivIckeHistorikPerAnmalan',
    'policy',
  ]) {
    assert.match(anrop[0], new RegExp(`\\b${arg},`), `planera-anropet saknar ${arg}`);
  }
});

test('Q6: KRAVFORMEN — planera KASTAR när aktiv-indexet saknas (djupare fixen)', () => {
  // Vakten ovan är källkodsläsning; detta är körbar semantik. Tillsammans
  // täcker de både "argumentet kapades" och "en ny anropare glömde det".
  const indata = planIndata();
  indata.aktivIckeHistorikPerAnmalan = undefined;
  assert.throws(() => planera(indata), /aktivIckeHistorikPerAnmalan krävs/);
});

test('Q7: KRAVFORMEN — fel TYP kastar också (en tom array räddar ingen)', () => {
  const indata = planIndata();
  indata.aktivIckeHistorikPerAnmalan = [];
  assert.throws(() => planera(indata), /måste vara en Map/);
});

test('Q8: en anmälan som SAKNAS i indexet är normalt, inte ett fel', () => {
  // Nivåskillnaden: hela uppslaget saknas ⇒ kastar (Q6). En enskild anmälan
  // utan aktiva poster ⇒ INGA_AKTIVA och backfillas normalt.
  const p = planera(planIndata());
  assert.equal(p.backfill.length, 1);
});

// ─────────────────────────────────────────────────────────────────────────
// Q9–Q14: PROD-VÄGENS KOPPLINGSVAKTER MOT main() (TASK-360)
// main() gör nätverksanrop (Airtable/Postgres) och kan inte köras hermetiskt
// — samma begränsning Q1–Q8 redan löser genom att pröva KÄLLTEXTEN i stället
// för att exekvera. Samma form här.
// ─────────────────────────────────────────────────────────────────────────

test('Q9: validateBaseGuard/validateProjectRef anropas MED override-objektet i main()', () => {
  assert.match(KALLA, /validateBaseGuard\(policy, basId, \{ godkandEnv: airtableGodkandEnv \}\)/);
  assert.match(
    KALLA,
    /validateProjectRef\(policy, ref, prodRef, \{ godkandEnv: refGodkandEnv \}\)/,
  );
});

test('Q10: validateMiljoKonsistens är FAKTISKT anropad i main(), inte bara definierad', () => {
  assert.match(KALLA, /validateMiljoKonsistens\(\{ basGodkand, refGodkand \}\)/);
});

test('Q11: bypass-loggningen är villkorad på basGodkand/refGodkand, ALDRIG ovillkorlig', () => {
  assert.match(KALLA, /if \(basGodkand\) \{\s*\n\s*console\.error\(\s*\n\s*`BAS-GUARD/);
  assert.match(KALLA, /if \(refGodkand\) \{\s*\n\s*console\.error\(\s*\n\s*`PROJEKT-REF-GUARD/);
  assert.match(
    KALLA,
    /if \(lankUtfall\.lage === 'lankat-till-prod-godkand'\) \{\s*\n\s*console\.error\(/,
  );
});

test('Q12: provaLanktillstand får prodGodkand: korMotProd — inte en fri sträng', () => {
  assert.match(KALLA, /prodGodkand: korMotProd,/);
});

test('Q13: staging-semaforen hoppas ÖVER när korMotProd — aldrig ovillkorligt', () => {
  // Ordningen (Q2) gäller fortfarande: preflighten ligger FÖRE denna gren.
  assert.match(
    KALLA,
    /if \(!korMotProd\) \{\s*\n\s*kravStagingLedigt\('backfill-inbetalningar'\);/,
  );
});

test('Q14: PROD_GODKAND_ENV_VAR läses ur process.env — aldrig hårdkodat värde', () => {
  assert.match(KALLA, /const airtableGodkandEnv = process\.env\[PROD_GODKAND_ENV_VAR\];/);
  assert.match(KALLA, /const prodRefBypassVar = await lasProdRefBypassVar\(\);/);
  assert.match(
    KALLA,
    /const refGodkandEnv = prodRefBypassVar \? process\.env\[prodRefBypassVar\] : undefined;/,
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// R — PATCH-HOPPET OCH REF-MASKERINGEN (granskningsrunda 2, fynd 4c/4d)
// ═══════════════════════════════════════════════════════════════════════════

test('R1: en patch vars värden redan står i basen är identisk', () => {
  assert.equal(
    patchArIdentisk(
      { 'Summa inbetalt (kr)': 2500, Anmälningsavgift: 'Mottagen', Slutbetalning: 'Mottagen' },
      anm({
        summaInbetaltSpegel: 2500,
        anmalningsavgiftFack: 'Mottagen',
        slutbetalningFack: 'Mottagen',
      }),
    ),
    true,
  );
});

test('R2: NEGATIV — ett avvikande tal gör patchen icke-identisk', () => {
  assert.equal(
    patchArIdentisk({ 'Summa inbetalt (kr)': 2500 }, anm({ summaInbetaltSpegel: 1000 })),
    false,
  );
});

test('R3: NEGATIV — ett avvikande FACK gör patchen icke-identisk', () => {
  assert.equal(
    patchArIdentisk(
      { 'Summa inbetalt (kr)': 2500, Slutbetalning: 'Mottagen' },
      anm({ summaInbetaltSpegel: 2500, slutbetalningFack: 'Ej mottagen' }),
    ),
    false,
  );
});

test('R4: FAIL-OPEN — saknat värde i basen ⇒ skriv ändå', () => {
  assert.equal(
    patchArIdentisk({ 'Summa inbetalt (kr)': 2500 }, anm({ summaInbetaltSpegel: null })),
    false,
  );
  assert.equal(patchArIdentisk({ 'Summa inbetalt (kr)': 0 }, null), false);
});

test('R5: maskeraRef ger igenkänning utan en kopierbar ref', () => {
  const m = maskeraRef('pqtshyierkdgwdnxuirz');
  assert.equal(m, 'pqts…(20 tecken)');
  assert.ok(!m.includes('pqtshyierkdgwdnxuirz'));
});

test('R6: NEGATIV — länkpreflightens meddelanden bär ALDRIG hela refen', () => {
  const PROD_I_CONF = readFileSync(join(REPO_ROT, '.prod-ref-policy.conf'), 'utf8').match(
    /^PROD_REF_PROD="([^"]+)"/m,
  )?.[1];
  const u = provaLanktillstand({
    lanktRef: PROD_I_CONF,
    malRef: STAGING,
    prodRef: PROD_I_CONF,
  });
  assert.equal(u.ok, false);
  assert.ok(!u.skal.includes(PROD_I_CONF), 'prod-refen får inte stå okodad i utskriften');
  assert.ok(u.skal.includes(maskeraRef(PROD_I_CONF)));
});

test('R8: NEGATIV — validateProjectRef ekar aldrig en GILTIG ref okodad', () => {
  // Granskningsrunda 3, punkt 2: de två grenar där värdet ÄR en giltig ref
  // maskerar nu. Formkontrollens gren gör det MEDVETET inte — en sträng som
  // fallit formkontrollen är ingen ref, och den som stavat fel behöver se vad
  // som togs emot.
  const PROD_I_CONF = readFileSync(join(REPO_ROT, '.prod-ref-policy.conf'), 'utf8').match(
    /^PROD_REF_PROD="([^"]+)"/m,
  )?.[1];
  assert.throws(
    () => validateProjectRef(POLICY, PROD_I_CONF, PROD_I_CONF),
    (fel) => fel.message.includes(maskeraRef(PROD_I_CONF)) && !fel.message.includes(PROD_I_CONF),
  );
  assert.throws(
    () => validateProjectRef(POLICY, 'abcdefghijklmnopqrst', null),
    (fel) =>
      fel.message.includes(maskeraRef('abcdefghijklmnopqrst')) &&
      !fel.message.includes('abcdefghijklmnopqrst'),
  );
});

test('R9: formkontrollens gren visar värdet OKODAT — bokfört undantag', () => {
  assert.throws(() => validateProjectRef(POLICY, 'inte-en-ref', null), /inte-en-ref/);
});

test('R7: NEGATIV — inte heller fel-projekt-meddelandet bär hela refen', () => {
  const u = provaLanktillstand({
    lanktRef: 'abcdefghijklmnopqrst',
    malRef: STAGING,
    prodRef: null,
  });
  assert.equal(u.ok, false);
  assert.ok(!u.skal.includes('abcdefghijklmnopqrst'));
  assert.ok(!u.skal.includes(STAGING));
});

// ═══════════════════════════════════════════════════════════════════════════
// S — TASK-360 RUNDA 2 (review-fynd A + B, PR #2208 granskad SHA 0dfade88)
// ═══════════════════════════════════════════════════════════════════════════

const S_MINIMAL_PLAN = { eventpriser: [], backfill: [], avvikelser: [], hoppade: [] };
const S_MINIMAL_FORE = {
  antalAnmalningar: 0,
  antalInbetalningar: 0,
  summaKronor: 0,
  antalMedKantPris: 0,
  antalAlltBetalt: 0,
  andelAlltBetaltAvAlla: 0,
  andelAlltBetaltAvKantPris: 0,
};

await testAsync(
  'S1: losToken — FYND A: prod-läge UTAN env-token vägrar UTAN att läsa .env.seed-fallbacken',
  async () => {
    let anropad = false;
    const resultat = await losToken({
      korMotProd: true,
      envToken: undefined,
      lasFallback: async () => {
        anropad = true;
        return 'FALLBACK-VARDE-UR-ENV-SEED';
      },
    });
    assert.equal(resultat, null);
    assert.equal(anropad, false, 'fallbacken fick ALDRIG anropas i prod-läge');
  },
);

await testAsync(
  'S2: losToken — FYND A: prod-läge MED env-token fortsätter, fallbacken anropas ändå inte',
  async () => {
    let anropad = false;
    const resultat = await losToken({
      korMotProd: true,
      envToken: 'ETT-PROD-SCOPAT-TOKEN',
      lasFallback: async () => {
        anropad = true;
        return 'FALLBACK';
      },
    });
    assert.equal(resultat, 'ETT-PROD-SCOPAT-TOKEN');
    assert.equal(anropad, false);
  },
);

await testAsync(
  'S3: losToken — staging-läge UTAN env-token läser fallbacken (OFÖRÄNDRAT beteende)',
  async () => {
    let anropad = false;
    const resultat = await losToken({
      korMotProd: false,
      envToken: undefined,
      lasFallback: async () => {
        anropad = true;
        return 'STAGING-VARDE-UR-ENV-SEED';
      },
    });
    assert.equal(resultat, 'STAGING-VARDE-UR-ENV-SEED');
    assert.equal(anropad, true, 'staging-läget SKA läsa fallbacken, precis som innan');
  },
);

await testAsync(
  'S4: losToken — staging-läge MED env-token vinner över fallbacken utan att anropa den',
  async () => {
    let anropad = false;
    const resultat = await losToken({
      korMotProd: false,
      envToken: 'ETT-STAGING-TOKEN',
      lasFallback: async () => {
        anropad = true;
        return 'FALLBACK';
      },
    });
    assert.equal(resultat, 'ETT-STAGING-TOKEN');
    assert.equal(anropad, false);
  },
);

test('S5: kopplingsvakt — main() anropar losToken med lasFallback: lasTokenUrEnvFil', () => {
  assert.match(KALLA, /const token = await losToken\(\{/);
  assert.match(KALLA, /envToken: process\.env\.STAGING_AIRTABLE_TOKEN,/);
  assert.match(KALLA, /lasFallback: lasTokenUrEnvFil,/);
});

test('S6: skrivRapport — FYND B: refen skrivs MASKERAD, aldrig okodad', () => {
  const rapport = skrivRapport({
    plan: S_MINIMAL_PLAN,
    fore: S_MINIMAL_FORE,
    efter: null,
    utfor: false,
    ref: PROD_REF,
    basId: 'app8uGPrVCVOm6LfD',
  });
  assert.ok(PROD_REF, 'PROD_REF_PROD saknas i .prod-ref-policy.conf');
  assert.ok(!rapport.includes(PROD_REF), 'rapporten får ALDRIG bära den okodade refen');
  assert.ok(rapport.includes(maskeraRef(PROD_REF)), 'rapporten ska bära den MASKERADE refen');
});

test('S7: NEGATIV — skrivRapport maskerar ÄVEN en helt vanlig staging-ref (inte bara prod)', () => {
  const rapport = skrivRapport({
    plan: S_MINIMAL_PLAN,
    fore: S_MINIMAL_FORE,
    efter: null,
    utfor: false,
    ref: STAGING,
    basId: POLICY.expectedBaseId,
  });
  assert.ok(!rapport.includes(STAGING), 'rapporten får inte bära den okodade STAGING-refen heller');
  assert.ok(rapport.includes(maskeraRef(STAGING)));
});

test('S8: skrivRapport lämnar Airtable-bas-ID:t OKODAT (bokfört undantag, samma som resten av filen)', () => {
  const rapport = skrivRapport({
    plan: S_MINIMAL_PLAN,
    fore: S_MINIMAL_FORE,
    efter: null,
    utfor: false,
    ref: STAGING,
    basId: 'app8uGPrVCVOm6LfD',
  });
  // Bas-ID:n maskeras INTE i denna fil (se t.ex. "BLOCKERAD bas: ${basId}") —
  // detta test bevisar att fynd B:s fix inte råkade utvidgas dit den inte
  // bads om.
  assert.ok(rapport.includes('app8uGPrVCVOm6LfD'));
});

// ═══════════════════════════════════════════════════════════════════════════

console.log('');
console.log(`${passed} gröna, ${failed} röda (${passed + failed} fall totalt)`);
process.exit(failed === 0 ? 0 : 1);
