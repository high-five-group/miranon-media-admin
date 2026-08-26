#!/usr/bin/env node
// scripts/test-review-risk-sektion.mjs — tester för risk-rendreraren
// (TASK-173.3: scripts/lib/review-risk-sektion.mjs +
// scripts/uppdatera-review-sektion.mjs).
//
// Samma konvention som scripts/test-review-policy.mjs: de PURA funktionerna
// importeras direkt (sektion A–D), och ett sista lager prövar CLI:ts
// exit-koder via spawnSync (sektion E–F) — annars vore pure-function-
// testerna förenliga med en CLI som alltid returnerar 0.
//
// ═══ TVÅSIDIGT BEVIS PER INVARIANT ═══
// Varje regel prövas i BÅDA riktningar: brytet → RÖTT/avvikande, den
// rättade formen → GRÖNT. Determinism (AC #2) får ett explicit KONTRAST-par
// (B1 positivt, B2 kontrast) — annars vore B1 vakuös: en trasig
// implementation som alltid returnerade samma konstanta sträng hade också
// "bevisat" determinism.
//
// ═══ FAKE `gh` PÅ PATH — FÖRBÄTTRING MOT 173.2:S KÄNDA LUCKA ═══
// TASK-173.2-granskningen konstaterade att `hamtaPrFiler()` (gh-
// integrationen i scripts/hamta-review-policy.mjs) saknar testtäckning —
// den anropar `gh` direkt utan injicerbar seam. Denna svit upprepar INTE
// den luckan för sina egna analoga funktioner (`hamtaPrKropp`/
// `skrivPrKropp`): sektion F kör CLI:t som RIKTIG subprocess mot en FAKE
// `gh`-binär (ett litet bash-skript i en temp-katalog, satt FÖRST i PATH)
// som svarar deterministiskt på `pr view`/`pr edit --body-file -`. Det ger
// end-to-end-täckning av HELA kedjan (läs utlåtande → validera → hämta
// kropp → beräkna → skriv kropp) utan att någonsin röra nätverket eller
// ett riktigt `gh`-konto — och utan att repot behöver ett nytt
// mock-bibliotek (samma "riktigt temp-repo/binär i stället för mock"-
// disciplin som test-review-policy.mjs redan använder för `git show`).
//
// Kör: node scripts/test-review-risk-sektion.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  byggSektion,
  cell,
  kodcell,
  MARKER_END,
  MARKER_START,
  renderaRiskbedomning,
  uppdateraPrKropp,
} from './lib/review-risk-sektion.mjs';
import { valideraUtlatande } from './lib/review-utlatande.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(REPO, 'scripts', 'uppdatera-review-sektion.mjs');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  OK  ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  RÖD ${name}`);
    console.error(`      ${error.message}`);
  }
}

/** Ett minimalt, schema-giltigt utlåtande — override:as per test. */
function utlatande(overrides = {}) {
  return {
    schemaVersion: '1.0',
    kortId: null,
    prNummer: 1234,
    granskadSha: 'abc1234',
    runda: 1,
    intentKalla: 'pr-text',
    intentKonfidens: 'lag',
    acProvning: [],
    fynd: [],
    risk: { niva: 'lag', motivering: 'Inget att invanda.' },
    policySha: null,
    policyRegler: [],
    ...overrides,
  };
}

/* ════════════════════════════════════════════════════════════════════
   A. renderaRiskbedomning() — pure content
   ════════════════════════════════════════════════════════════════ */

test('A1 minimalt utlåtande renderar grundfälten', () => {
  const md = renderaRiskbedomning(utlatande());
  assert.match(md, /## Riskbedömning/);
  assert.match(md, /🟢 LÅG/);
  assert.match(md, /\*\*Runda:\*\* 1/);
  assert.match(md, /`abc1234`/);
  assert.match(md, /Inga fynd\./);
  assert.doesNotMatch(md, /### AC-prövning/);
  assert.doesNotMatch(md, /path-scopad/);
});

test('A2 HÖG risk visar varningsraden om Marcus-granskning', () => {
  const md = renderaRiskbedomning(utlatande({ risk: { niva: 'hog', motivering: 'Farligt.' } }));
  assert.match(md, /🔴 HÖG/);
  assert.match(md, /väntar på Marcus explicita granskning/);
});

test('A3 KONTRAST: MEDEL risk visar INTE varningsraden (A2 fäller på nivån, inte alltid)', () => {
  const md = renderaRiskbedomning(utlatande({ risk: { niva: 'medel', motivering: 'Ok-ish.' } }));
  assert.match(md, /🟡 MEDEL/);
  assert.doesNotMatch(md, /väntar på Marcus/);
});

test('A4 fynd renderas i tabell med severity/action/beskrivning/plats/bevis', () => {
  const md = renderaRiskbedomning(
    utlatande({
      fynd: [
        {
          beskrivning: 'En bugg',
          severity: 'error',
          action: 'ask-user',
          plats: { fil: 'src/x.ts', rad: 42 },
          bevis: [{ kommando: 'npm test', utdrag: '', exitkod: 1, runIdEllerSha: 'sha1' }],
        },
      ],
    }),
  );
  assert.match(md, /### Fynd \(1\)/);
  assert.match(md, /🔴 error/);
  assert.match(md, /ask-user/);
  assert.match(md, /En bugg/);
  assert.match(md, /`src\/x\.ts:42`/);
  assert.match(md, /`npm test` \(exit 1, `sha1`\)/);
});

test('A5 fynd utan plats (null) visar "—" i Plats-kolumnen', () => {
  const md = renderaRiskbedomning(
    utlatande({
      fynd: [
        {
          beskrivning: 'Generellt fynd',
          severity: 'info',
          action: 'ask-user',
          plats: null,
          bevis: [],
        },
      ],
    }),
  );
  assert.match(md, /\| Generellt fynd \| — \| — \|/);
});

test('A6 bevis med exitkod null renderas som "exit —"', () => {
  const md = renderaRiskbedomning(
    utlatande({
      fynd: [
        {
          beskrivning: 'X',
          severity: 'warning',
          action: 'auto-fix',
          plats: null,
          bevis: [{ kommando: 'kolla', utdrag: '', exitkod: null, runIdEllerSha: 'sha2' }],
        },
      ],
    }),
  );
  assert.match(md, /exit —/);
});

test('A7 flera bevis-poster radbryts med <br> mellan sig', () => {
  const md = renderaRiskbedomning(
    utlatande({
      fynd: [
        {
          beskrivning: 'X',
          severity: 'info',
          action: 'ask-user',
          plats: null,
          bevis: [
            { kommando: 'ett', utdrag: '', exitkod: 0, runIdEllerSha: 'sha-a' },
            { kommando: 'tva', utdrag: '', exitkod: 0, runIdEllerSha: 'sha-b' },
          ],
        },
      ],
    }),
  );
  assert.match(md, /`ett` \(exit 0, `sha-a`\)<br>`tva` \(exit 0, `sha-b`\)/);
});

test('A8 pipe-tecken i beskrivning escapas så tabellen inte går sönder', () => {
  const md = renderaRiskbedomning(
    utlatande({
      fynd: [
        {
          beskrivning: 'a | b | c',
          severity: 'info',
          action: 'ask-user',
          plats: null,
          bevis: [],
        },
      ],
    }),
  );
  assert.match(md, /a \\\| b \\\| c/);
});

/** Simulerar hur en GFM-parser konsumerar bakstreck-escape vänster-till-höger
 * (varje `\` konsumerar SIG SJÄLV plus nästa tecken) och avgör om en
 * OESCAPAD — alltså tabellcell-brytande — pipe finns kvar i strängen. Egen
 * referens-implementation i TESTET (inte i produktionskoden) så att A8b kan
 * BEVISA att den kontrollen faktiskt fäller på den trasiga (pre-fix) formen,
 * inte bara påstå det. Se CodeQL js/incomplete-sanitization, alert #6,
 * PR #1993. */
function harOskyddadPipeEnligtGfm(text) {
  let i = 0;
  while (i < text.length) {
    if (text[i] === '\\') {
      i += 2;
      continue;
    }
    if (text[i] === '|') return true;
    i += 1;
  }
  return false;
}

test('A8b RÖTT-FÖRST-belägg: en naiv escaping som ENDAST escapar pipe (utan att escapa bakstreck FÖRST) lämnar en oskyddad pipe kvar när indata redan har "bakstreck-direkt-före-pipe" — detta VAR CodeQL-fyndet (js/incomplete-sanitization, alert #6, PR #1993)', () => {
  const indata = `a${'\\'}${'|'}b`; // faktiska tecken: a, \, |, b
  const naivEscaping = indata.replace(/\|/g, `${'\\'}|`); // ENDAST pipe-escape — den GAMLA, TRASIGA ordningen (rad 85 före fixen)
  assert.equal(
    harOskyddadPipeEnligtGfm(naivEscaping),
    true,
    'referensimplementationen ska fälla den naiva (pre-fix) escapingen — annars bevisar A8c ingenting',
  );
});

test('A8c cell(): bakstreck-direkt-före-pipe i indata escapas FULLSTÄNDIGT (bakstreck escapas FÖRST, sedan pipe) — ingen oskyddad pipe kvar', () => {
  const indata = `a${'\\'}${'|'}b`; // samma indata som A8b: a, \, |, b
  const escaped = cell(indata);
  assert.equal(
    harOskyddadPipeEnligtGfm(escaped),
    false,
    `cell()s utdata ska INTE innehålla någon oskyddad pipe (fick: ${JSON.stringify(escaped)})`,
  );
});

test('A8d cell(): ett fristående bakstreck utan efterföljande pipe escapas också (rendreras som ett literalt bakstreck, inte tolkas som ett escape-tecken för nästa tecken)', () => {
  const indata = `a${'\\'}b`; // faktiska tecken: a, \, b — inget pipe alls
  const escaped = cell(indata);
  assert.equal(
    harOskyddadPipeEnligtGfm(escaped),
    false,
    'inget pipe i indata → inget pipe ska kunna uppstå i utdata',
  );
  // Bakstrecket ska förekomma DUBBLERAT (escapat) i utdata, inte enkelt.
  assert.ok(
    escaped.includes(`${'\\'}${'\\'}`),
    `förväntade dubblerat bakstreck, fick: ${JSON.stringify(escaped)}`,
  );
});

/* ── kodcell() — samma sårbarhetsklass som cell() (CodeQL
   js/incomplete-sanitization), fångad av granskningen på PR #1993 i
   SYSKONFUNKTIONEN kodcell() (används för plats fil:rad, bevis.kommando,
   runIdEllerSha, policySha, granskadSha, kortId). Ett kodspann skyddar INTE
   mot en pipe som bryter tabellraden — cmark-gfm delar rader på `|` FÖRE
   inline-parsning (github/cmark-gfm#24) — så backtick-substitution ensam är
   otillräcklig; samma bakstreck-FÖRST-ordning som cell() krävs. ── */

test('A8e kodcell(): pipe i bevis.kommando escapas (review-agentens NORMALFALL: pipade shell-kommandon, t.ex. "git log --oneline | grep foo")', () => {
  const indata = 'git log --oneline | grep foo';
  const kod = kodcell(indata);
  assert.equal(
    harOskyddadPipeEnligtGfm(kod),
    false,
    `kodcell()s utdata ska INTE innehålla någon oskyddad pipe (fick: ${JSON.stringify(kod)})`,
  );
});

test('A8f kodcell(): pipe i fil-sökväg escapas', () => {
  const kod = kodcell('src/weird|path.ts');
  assert.equal(
    harOskyddadPipeEnligtGfm(kod),
    false,
    `kodcell()s utdata ska INTE innehålla någon oskyddad pipe (fick: ${JSON.stringify(kod)})`,
  );
});

test('A8g kodcell(): bakstreck-direkt-före-pipe escapas FULLSTÄNDIGT (samma indata-mönster som A8c, nu i kodcell)', () => {
  const indata = `a${'\\'}${'|'}b`; // faktiska tecken: a, \, |, b
  const kod = kodcell(indata);
  assert.equal(
    harOskyddadPipeEnligtGfm(kod),
    false,
    `kodcell()s utdata ska INTE innehålla någon oskyddad pipe (fick: ${JSON.stringify(kod)})`,
  );
});

test('A8h kodcell(): backtick OCH pipe i samma indata hanteras båda (backtick substitueras, pipe escapas — ingen oskyddad pipe, inget backtick-läckage inuti kodspannet)', () => {
  const indata = 'echo `whoami` | tee log';
  const kod = kodcell(indata);
  assert.equal(
    harOskyddadPipeEnligtGfm(kod),
    false,
    `kodcell()s utdata ska INTE innehålla någon oskyddad pipe (fick: ${JSON.stringify(kod)})`,
  );
  assert.ok(
    !kod.slice(1, -1).includes('`'),
    `det inre innehållet ska inte innehålla någon backtick (byts mot citattecken), fick: ${JSON.stringify(kod)}`,
  );
});

test('A8i RÖTT-FÖRST-referens för kodcell() (samma mönster som A8b): en naiv kodcell som ENDAST substituerar backtick — utan att escapa bakstreck/pipe — lämnar en oskyddad pipe kvar (detta VAR den trasiga pre-fix-formen)', () => {
  const indata = 'git log --oneline | grep foo';
  const naivKodcell = (v) => `\`${String(v).replace(/\r?\n/g, ' ').replace(/`/g, "'")}\``;
  assert.equal(
    harOskyddadPipeEnligtGfm(naivKodcell(indata)),
    true,
    'referens-simuleringen av den gamla (pre-fix) kodcell()-formen ska fälla — annars bevisar A8e–A8h ingenting om vad som faktiskt fixades',
  );
});

test('A9 nyrad i beskrivning ersätts med <br>', () => {
  const md = renderaRiskbedomning(
    utlatande({
      fynd: [
        {
          beskrivning: 'rad1\nrad2',
          severity: 'info',
          action: 'ask-user',
          plats: null,
          bevis: [],
        },
      ],
    }),
  );
  assert.match(md, /rad1<br>rad2/);
  assert.doesNotMatch(md, /rad1\nrad2/);
});

test('A10 acProvning renderas som lista med håller/felställd', () => {
  const md = renderaRiskbedomning(
    utlatande({
      acProvning: [
        { nummer: 1, text: 'AC ett', bedomning: 'haller', motivering: 'stämmer' },
        { nummer: 2, text: 'AC två', bedomning: 'felstalld', motivering: 'fel radnummer' },
      ],
    }),
  );
  assert.match(md, /### AC-prövning/);
  assert.match(md, /AC #1.*✅ håller/);
  assert.match(md, /AC #2.*⚠️ felställd/);
});

test('A11 tom acProvning ger ingen AC-prövning-rubrik', () => {
  const md = renderaRiskbedomning(utlatande({ acProvning: [] }));
  assert.doesNotMatch(md, /AC-prövning/);
});

test('A12 policyRegler renderas som fotnot med antal, id och policySha', () => {
  const md = renderaRiskbedomning(
    utlatande({
      policySha: 'deadbeefsha',
      policyRegler: [
        {
          id: 'regel-a',
          scope: { monster: ['src/**'], matchadeFiler: ['src/x.ts'] },
          kalla: 'CLAUDE.md',
        },
      ],
    }),
  );
  assert.match(md, /1 path-scopad\(e\) granskningsregel\(er\) injicerad\(e\) \(regel-a\)/);
  assert.match(md, /`deadbeefsha`/);
});

test('A13 tom policyRegler ger ingen fotnot', () => {
  const md = renderaRiskbedomning(utlatande({ policyRegler: [], policySha: null }));
  assert.doesNotMatch(md, /path-scopad/);
});

test('A14 PR utan kort visar LÅG konfidens och inget kort-ID i Intent-raden', () => {
  const md = renderaRiskbedomning(
    utlatande({ kortId: null, intentKalla: 'pr-text', intentKonfidens: 'lag' }),
  );
  assert.match(md, /\*\*Intent:\*\* PR-text \(inget kort länkat\) — \*\*LÅG konfidens\*\*/);
});

test('A15 extremt lång beskrivning trunkeras synligt med "…"', () => {
  const langText = 'x'.repeat(600);
  const md = renderaRiskbedomning(
    utlatande({
      fynd: [
        { beskrivning: langText, severity: 'info', action: 'ask-user', plats: null, bevis: [] },
      ],
    }),
  );
  assert.match(md, /x{500}…/);
  assert.doesNotMatch(md, /x{501}/);
});

test('A16 riktigt gammalt 173.1-format (utan policySha/policyRegler-fält alls) går genom EKTA valideraUtlatande() och renderar utan fotnot', () => {
  // Kör RAW indata (helt utan policySha/policyRegler-nycklar) genom den
  // FAKTISKA `valideraUtlatande()` från scripts/lib/review-utlatande.mjs —
  // inte en handgjord simulering — och renderar sedan `.data`. Detta är
  // exakt vägen risk-rendreraren konsumerar (aldrig rå JSON direkt, se
  // review-risk-sektion.mjs § Bakåtkompatibilitet). Bevisar att finding (a)
  // ur 173.2-granskningen (JSON-schema-filen listar felaktigt policySha/
  // policyRegler som `required` trots zod .default()) INTE stör DENNA väg:
  // zod applicerar defaults och validerar OK.
  const rawUtanPolicyfalt = {
    schemaVersion: '1.0',
    kortId: 'task-1',
    prNummer: 1,
    granskadSha: 'sha0001',
    runda: 1,
    intentKalla: 'kort',
    intentKonfidens: 'hog',
    acProvning: [],
    fynd: [],
    risk: { niva: 'lag', motivering: 'Ok.' },
    // policySha / policyRegler UTELÄMNADE HELT — 173.1-form.
  };
  const { ok, data, errors } = valideraUtlatande(rawUtanPolicyfalt);
  assert.equal(ok, true, `173.1-format ska validera via defaults: ${errors.join('; ')}`);
  assert.equal(data.policySha, null);
  assert.deepEqual(data.policyRegler, []);
  const md = renderaRiskbedomning(data);
  assert.doesNotMatch(md, /path-scopad/);
  assert.match(md, /## Riskbedömning/);
});

/* ════════════════════════════════════════════════════════════════════
   B. Determinism (AC #2) — tvåsidigt
   ════════════════════════════════════════════════════════════════ */

test('B1 samma utlåtande renderat två gånger ger BYTE-IDENTISK utdata', () => {
  const u = utlatande({
    fynd: [
      {
        beskrivning: 'X',
        severity: 'error',
        action: 'ask-user',
        plats: { fil: 'a.ts', rad: 1 },
        bevis: [{ kommando: 'k', utdrag: '', exitkod: 0, runIdEllerSha: 's' }],
      },
    ],
  });
  const forsta = renderaRiskbedomning(u);
  const andra = renderaRiskbedomning(structuredClone(u));
  assert.equal(forsta, andra);
});

test('B2 KONTRAST: två utlåtanden som skiljer ENDAST i risk.niva ger OLIKA utdata', () => {
  const lag = renderaRiskbedomning(utlatande({ risk: { niva: 'lag', motivering: 'M' } }));
  const hog = renderaRiskbedomning(utlatande({ risk: { niva: 'hog', motivering: 'M' } }));
  assert.notEqual(lag, hog);
});

/* ════════════════════════════════════════════════════════════════════
   C. byggSektion() — markör-inramning
   ════════════════════════════════════════════════════════════════ */

test('C1 sektionen börjar med MARKER_START och slutar med MARKER_END', () => {
  const s = byggSektion(utlatande());
  assert.ok(s.startsWith(MARKER_START));
  assert.ok(s.endsWith(MARKER_END));
});

test('C2 innehållet mellan markörerna matchar renderaRiskbedomning()', () => {
  const u = utlatande();
  const s = byggSektion(u);
  const inneh = s.slice(MARKER_START.length + 1, s.length - MARKER_END.length - 1);
  assert.equal(inneh, renderaRiskbedomning(u));
});

/* ════════════════════════════════════════════════════════════════════
   D. uppdateraPrKropp() — idempotent uppdatering + fail-closed
   ════════════════════════════════════════════════════════════════ */

test('D1 tom kropp: lägger till sektionen, agerande=lade-till', () => {
  const r = uppdateraPrKropp('', utlatande());
  assert.equal(r.ok, true);
  assert.equal(r.agerande, 'lade-till');
  assert.ok(r.kropp.includes(MARKER_START));
});

test('D2 kropp utan markörer men med annat innehåll: sektionen läggs till EFTER, originalet orört', () => {
  // Använder repots RIKTIGA PR-mall som realistisk fixture, inte en påhittad
  // sträng — samma "riktigt fall, inte fabricerat" -disciplin som
  // test-review-policy.mjs sektion F.
  const mall = readFileSync(join(REPO, '.github', 'PULL_REQUEST_TEMPLATE.md'), 'utf8');
  const r = uppdateraPrKropp(mall, utlatande());
  assert.equal(r.ok, true);
  assert.equal(r.agerande, 'lade-till');
  assert.ok(r.kropp.startsWith(mall.trimEnd().length === 0 ? '' : mall.split('\n')[0]));
  assert.ok(r.kropp.includes('## Sammanfattning'));
  assert.ok(r.kropp.includes(MARKER_START));
  assert.ok(r.kropp.indexOf('## Sammanfattning') < r.kropp.indexOf(MARKER_START));
});

test('D3 kropp med befintlig sektion: ERSÄTTS, text före/efter orörd', () => {
  const kroppMedGammalSektion = `FÖRE\n\n${MARKER_START}\ngammalt innehåll (runda 1)\n${MARKER_END}\n\nEFTER`;
  const r = uppdateraPrKropp(kroppMedGammalSektion, utlatande({ runda: 2, granskadSha: 'nysha1' }));
  assert.equal(r.ok, true);
  assert.equal(r.agerande, 'ersatte');
  assert.ok(r.kropp.startsWith('FÖRE'));
  assert.ok(r.kropp.endsWith('EFTER'));
  assert.match(r.kropp, /\*\*Runda:\*\* 2/);
  assert.doesNotMatch(r.kropp, /gammalt innehåll/);
});

test('D4 idempotens: två körningar i rad ger EXAKT EN sektion, ingen dubblering', () => {
  let kropp = '## Sammanfattning\nNågot.';
  kropp = uppdateraPrKropp(kropp, utlatande({ runda: 1 })).kropp;
  kropp = uppdateraPrKropp(kropp, utlatande({ runda: 2 })).kropp;
  const antalStart = (kropp.match(/review-grinden:riskbedomning:start/g) ?? []).length;
  const antalEnd = (kropp.match(/review-grinden:riskbedomning:end/g) ?? []).length;
  assert.equal(antalStart, 1, 'exakt en startmarkör efter två körningar');
  assert.equal(antalEnd, 1, 'exakt en slutmarkör efter två körningar');
  assert.match(kropp, /\*\*Runda:\*\* 2/);
});

test('D5 KORRUPT: endast startmarkör, ingen slutmarkör → ok:false', () => {
  const r = uppdateraPrKropp(`text ${MARKER_START} mer text`, utlatande());
  assert.equal(r.ok, false);
  assert.match(r.fel, /KORRUPT/);
});

test('D6 KORRUPT: endast slutmarkör, ingen startmarkör → ok:false', () => {
  const r = uppdateraPrKropp(`text ${MARKER_END} mer text`, utlatande());
  assert.equal(r.ok, false);
});

test('D7 KORRUPT: två startmarkörer → ok:false', () => {
  const r = uppdateraPrKropp(
    `${MARKER_START}a${MARKER_END}b${MARKER_START}c${MARKER_END}`,
    utlatande(),
  );
  assert.equal(r.ok, false);
});

test('D8 KORRUPT: slutmarkör FÖRE startmarkör (omvänd ordning) → ok:false', () => {
  const r = uppdateraPrKropp(`${MARKER_END}mitt${MARKER_START}`, utlatande());
  assert.equal(r.ok, false);
});

test('D9 KONTRAST: en korrekt enkel start/slut-sektion passerar normalt (D5–D8 fäller inte för strängt)', () => {
  const r = uppdateraPrKropp(`före${MARKER_START}gammalt${MARKER_END}efter`, utlatande());
  assert.equal(r.ok, true);
  assert.equal(r.agerande, 'ersatte');
});

/* ════════════════════════════════════════════════════════════════════
   E. CLI — malformat/CLI-fel (utan gh-beroende)
   ════════════════════════════════════════════════════════════════ */

const tmpRot = mkdtempSync(join(tmpdir(), 'task173-3-cli-'));

function korCli(args, env = {}) {
  return spawnSync('node', [CLI, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

function skrivJson(namn, obj) {
  const p = join(tmpRot, namn);
  writeFileSync(p, JSON.stringify(obj, null, 2));
  return p;
}

try {
  test('E1 ogiltig JSON → exit 1', () => {
    const p = join(tmpRot, 'trasig.json');
    writeFileSync(p, '{ inte json');
    const r = korCli([p]);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /kunde inte läsa\/parsa/);
  });

  test('E2 giltig JSON men schema-brott (saknar risk) → exit 1', () => {
    const p = skrivJson('schema-brott.json', {
      schemaVersion: '1.0',
      kortId: null,
      prNummer: 1,
      granskadSha: 'sha0001',
      runda: 1,
      intentKalla: 'pr-text',
      intentKonfidens: 'lag',
      acProvning: [],
      fynd: [],
    });
    const r = korCli([p]);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /validerar INTE mot schemat/);
  });

  test('E3 inget argument → exit 2', () => {
    const r = korCli([]);
    assert.equal(r.status, 2);
  });

  test('E4 okänt flagga → exit 2', () => {
    const p = skrivJson('giltig-e4.json', utlatande());
    const r = korCli([p, '--okand-flagga']);
    assert.equal(r.status, 2);
  });

  test('E5 --kropp-fil pekar på fil som inte finns → exit 3', () => {
    const p = skrivJson('giltig-e5.json', utlatande());
    const r = korCli([p, '--kropp-fil', join(tmpRot, 'finns-inte.txt')]);
    assert.equal(r.status, 3);
  });

  test('E6 giltigt utlåtande + --kropp-fil (tom fil) → exit 0, stdout innehåller sektionen', () => {
    const tomKropp = join(tmpRot, 'tom-kropp.txt');
    writeFileSync(tomKropp, '');
    const p = skrivJson('giltig-e6.json', utlatande());
    const r = korCli([p, '--kropp-fil', tomKropp]);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /review-grinden:riskbedomning:start/);
    assert.match(r.stderr, /INGEN gh-skrivning gjord/);
  });

  test('E7 KORRUPT markörsituation i --kropp-fil → exit 4', () => {
    const korruptKropp = join(tmpRot, 'korrupt-kropp.txt');
    writeFileSync(korruptKropp, `${MARKER_START}bara start`);
    const p = skrivJson('giltig-e7.json', utlatande());
    const r = korCli([p, '--kropp-fil', korruptKropp]);
    assert.equal(r.status, 4);
    assert.match(r.stderr, /KORRUPT/);
  });

  /* ══════════════════════════════════════════════════════════════════
     F. CLI mot RIKTIG `gh`-integration via FAKE gh-binär på PATH
     ══════════════════════════════════════════════════════════════ */

  const fakeBin = join(tmpRot, 'fake-bin');
  const fakeGhPath = join(fakeBin, 'gh');
  const fakeGhScript = `#!/usr/bin/env bash
set -euo pipefail
if [[ "\${1:-}" == "pr" && "\${2:-}" == "view" ]]; then
  if [[ "\${FAKE_GH_FAIL_VIEW:-0}" == "1" ]]; then
    echo "fake gh: pr view failed" >&2
    exit 1
  fi
  cat "$FAKE_GH_BODY_FILE"
  exit 0
elif [[ "\${1:-}" == "pr" && "\${2:-}" == "edit" ]]; then
  if [[ "\${FAKE_GH_FAIL_EDIT:-0}" == "1" ]]; then
    echo "fake gh: pr edit failed" >&2
    exit 1
  fi
  cat > "$FAKE_GH_CAPTURE_FILE"
  echo "https://github.com/fake/fake/pull/999"
  exit 0
else
  echo "fake gh: unhandled args: $*" >&2
  exit 1
fi
`;

  // Fake gh-binären skrivs och görs körbar synkront här, INNAN F1–F3 körs
  // (inget eget testfall — det är fixture-uppsättning, inte ett prov).
  mkdirSync(fakeBin, { recursive: true });
  writeFileSync(fakeGhPath, fakeGhScript);
  chmodSync(fakeGhPath, 0o755);

  function korCliMedFakeGh(args, extraEnv = {}) {
    return spawnSync('node', [CLI, ...args], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${fakeBin}:${process.env.PATH}`,
        ...extraEnv,
      },
    });
  }

  test('F1 CLI läser via fake `gh pr view`, ersätter befintlig sektion, skriver via fake `gh pr edit --body-file -`', () => {
    const bodyFile = join(tmpRot, 'f1-body.txt');
    const captureFile = join(tmpRot, 'f1-capture.txt');
    const gammalKropp = `## Sammanfattning\nHej\n\n${MARKER_START}\ngammal sektion\n${MARKER_END}\n`;
    writeFileSync(bodyFile, gammalKropp);
    const u = utlatande({ prNummer: 555, runda: 3, granskadSha: 'nysha999' });
    const p = skrivJson('f1-utlatande.json', u);

    const r = korCliMedFakeGh([p], {
      FAKE_GH_BODY_FILE: bodyFile,
      FAKE_GH_CAPTURE_FILE: captureFile,
    });
    assert.equal(r.status, 0, `stderr: ${r.stderr}`);
    assert.match(r.stdout, /ersatte i PR #555/);

    const skriven = readFileSync(captureFile, 'utf8');
    assert.ok(skriven.startsWith('## Sammanfattning\nHej'));
    assert.match(skriven, /\*\*Runda:\*\* 3/);
    assert.match(skriven, /`nysha999`/);
    const antalStart = (skriven.match(/review-grinden:riskbedomning:start/g) ?? []).length;
    assert.equal(antalStart, 1, 'ingen dubblering i den FAKTISKT skrivna kroppen');
    assert.doesNotMatch(skriven, /gammal sektion/);
  });

  test('F2 KONTRAST: fake `gh pr view` fallerar → CLI exit 3, ingen `pr edit` anropas', () => {
    const bodyFile = join(tmpRot, 'f2-body.txt');
    const captureFile = join(tmpRot, 'f2-capture.txt');
    writeFileSync(bodyFile, 'oanvänd');
    const p = skrivJson('f2-utlatande.json', utlatande({ prNummer: 556 }));

    const r = korCliMedFakeGh([p], {
      FAKE_GH_BODY_FILE: bodyFile,
      FAKE_GH_CAPTURE_FILE: captureFile,
      FAKE_GH_FAIL_VIEW: '1',
    });
    assert.equal(r.status, 3);
    assert.match(r.stderr, /kunde inte hämta PR-kroppen/);
    assert.throws(() => readFileSync(captureFile, 'utf8'), 'capture-filen ska ALDRIG skapas');
  });

  test('F3 fake `gh pr edit` fallerar → CLI exit 3', () => {
    const bodyFile = join(tmpRot, 'f3-body.txt');
    const captureFile = join(tmpRot, 'f3-capture.txt');
    writeFileSync(bodyFile, 'tom kropp utan sektion');
    const p = skrivJson('f3-utlatande.json', utlatande({ prNummer: 557 }));

    const r = korCliMedFakeGh([p], {
      FAKE_GH_BODY_FILE: bodyFile,
      FAKE_GH_CAPTURE_FILE: captureFile,
      FAKE_GH_FAIL_EDIT: '1',
    });
    assert.equal(r.status, 3);
    assert.match(r.stderr, /kunde inte skriva PR-kroppen/);
  });
} finally {
  rmSync(tmpRot, { recursive: true, force: true });
}

console.log(`\n${passed} gröna, ${failed} röda.`);
process.exit(failed > 0 ? 1 : 0);
