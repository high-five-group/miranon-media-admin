#!/usr/bin/env node
// scripts/flake-matserie.mjs — mätrigg för flake-diagnos: interfolierad A/B
// under kontrollerad last (TASK-81). Riggen är HÄMTAD ur TASK-74:s agents
// arbete, inte omskriven ur minnet; skärpningarna mot originalet står under
// "VAD SOM ÄNDRADES" nedan.
//
// ───────────────────────────────────────────────────────────────────────────
// VERKTYGET MÄTER. DET FIXAR INTE OCH DET DÖMER INTE.
//
// Här finns INGEN tröskel för vad som är "acceptabel" flakighet. Ingen
// gräns-siffra, ingen grön/röd-etikett, ingen exit-kod som betyder "för
// flakigt". Den bedömningen hör till kortet som använder riggen, och den
// måste göras med kortets egen kontext. Ett verktyg som dömer flyttar den
// bedömningen till en plats där kontexten inte finns.
//
// `--load-gate` ser ut som en tröskel men är det INTE: den styr NÄR en
// mätning får starta (mätformen), inte hur utfallet ska värderas. Samma sak
// gäller `--cooldown` och `--gate-timeout`.
// ───────────────────────────────────────────────────────────────────────────
//
// VARFÖR VERKTYG OCH INTE PROTOKOLL I ETT KORT
//
// Fyra kort behöver riggen (TASK-77, TASK-78, TASK-79, TASK-80). Bygger var
// och en sin egen variant är talen inte jämförbara mellan korten — vilket är
// precis det fel riggen finns för att undvika. Precedensen är
// scripts/ci-metrics.mjs: en mätning som ska upprepas av flera aktörer får
// inte bo i prosa.
//
// DE FYRA EGENSKAPERNA SOM BÄR RIGGEN (TASK-74, mätta — inte designvalda)
//
//   1. INTERFOLIERING, INTE BLOCKNING. Armarna körs A,B,A,B,… i samma serie.
//      TASK-64:s block-design (alla FÖRE först, alla EFTER sedan) mätte
//      tidsfönstret lika mycket som ändringen: körtiden drev 107 → 173 s och
//      drev därmed rakt in i arm-skillnaden. Interfoliering ger båda armarna
//      samma chans att träffa en lasttopp.
//   2. LOADAVG PER KÖRNING, LOGGAD. Utan den kan ett utfall inte deflateras i
//      efterhand. Deflateringen var det som gjorde TASK-74:s rapport ärlig:
//      12 av arm A:s 13 fällningar kom ur EN körning vid loadavg 125, och utan
//      den körningen var ställningen 1 mot 1.
//   3. --retries=0, KODAD. Retries döljer flaken inuti ett grönt jobb
//      (L-klassen från TASK-64). Flaggan går inte att slå av här.
//   4. RÅDATA PER TESTRESULTAT, INTE BARA AGGREGAT. TASK-74:s slutsats
//      "skillnaden ligger i formen, inte i antalet" gick bara att dra för att
//      de enskilda utfallen — status, varaktighet OCH felutskrift — fanns
//      kvar. Pass/fail på n=10 har nästan ingen upplösning för en rat runt
//      10 %; varaktigheten mäter marginalen mot budgeten kontinuerligt.
//
// VAD SOM ÄNDRADES MOT ORIGINALET (och varför)
//
//   · `--plan A,B,A,B` → `--varv N`. Originalet TOG EMOT planen, vilket gjorde
//     `--plan A,A,A,B,B,B` fullt möjligt — alltså exakt den block-design
//     egenskap 1 finns för att förhindra. Planen genereras nu internt och kan
//     inte anges. Formen är kodad, inte en instruktion att följa.
//   · loadavg som inte går att läsa rapporteras som `null` → "OKÄND" i
//     utskriften, ALDRIG som 0. `os.loadavg()` returnerar [0,0,0] på
//     plattformar utan stöd (Windows), och en nolla som läses som "vilande
//     maskin" gör en deflatering osann i fel riktning.
//   · Rådatan skrivs dessutom NORMALISERAD till resultat.jsonl — en rad per
//     testresultat, denormaliserad med körningens loadavg. Deflatering av
//     TASK-74:s typ blir då ett filter, inte en omkörning plus kunskap om
//     Playwrights JSON-schema.
//   · Repo-roten härleds ur skriptets läge i stället för att hårdkodas.
//   · Läge `--las` läser en färdig serie utan att köra om något.
//
// ANVÄNDNING
//
//   Mät (baslinje — inga armar skiljer sig, ren rat-mätning):
//     node scripts/flake-matserie.mjs --varv 5 --utdir /tmp/serie
//
//   Mät (A/B — arm B = trädet med patchen applicerad):
//     node scripts/flake-matserie.mjs --varv 5 --utdir /tmp/serie \
//       --patch /tmp/fix.patch
//
//   Avgränsa till ett test (TASK-79-formen):
//     node scripts/flake-matserie.mjs --varv 5 --utdir /tmp/serie \
//       --grep 'identitetsbeviset'
//
//   Läs en färdig serie (kör ingenting):
//     node scripts/flake-matserie.mjs --las /tmp/serie
//     node scripts/flake-matserie.mjs --las /tmp/serie --json
//
// UTDATA I --utdir
//   serie.jsonl      en rad per KÖRNING (arm, exit, sekunder, loadavg, config)
//   resultat.jsonl   en rad per TESTRESULTAT (AC 3 — deflaterbar rådata)
//   run-NN-X.json    Playwrights orörda JSON-rapport per körning
//
// Testfil: scripts/test-flake-matserie.mjs (fixtur-data, kör aldrig Playwright).

import { execFileSync, spawn } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { loadavg } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
// Samma hemvist som playwright.config.ts läser porten ur (TASK-251) — riggens
// portvakt nedan MÅSTE gälla den port webServer faktiskt startar på, och en
// egen literal här hade blivit osann i samma stund som en agent kör i en
// worktree. `.ts` från `.mjs` går via Nodes type stripping (default sedan
// 22.18; .nvmrc-golvet är 24).
import { devPort } from '../tests/support/dev-portar.ts';

// ---------------------------------------------------------------------------
// Pura funktioner (exporterade för scripts/test-flake-matserie.mjs)
// ---------------------------------------------------------------------------

/**
 * Bygger körplanen ur antal varv. ETT varv = ETT A/B-par, alltid i ordningen
 * A,B. Det är hela mekaniseringen bakom egenskap 1: den som kallar kan välja
 * HUR MÅNGA varv, aldrig i vilken ORDNING armarna kommer. En blockad serie
 * (A,A,A,B,B,B) är därmed inte uttryckbar.
 *
 * @param {number} varv antal A/B-par, heltal >= 1
 * @returns {Array<'A'|'B'>} plan med 2*varv poster
 */
export function byggPlan(varv) {
  if (!Number.isInteger(varv) || varv < 1) {
    throw new Error(`--varv måste vara ett heltal >= 1 (fick: ${varv})`);
  }
  const plan = [];
  for (let i = 0; i < varv; i++) plan.push('A', 'B');
  return plan;
}

/**
 * Normaliserar `os.loadavg()` till ett läsbart 1-minutersvärde eller null.
 *
 * AC 2: en körning utan loadavg-värde ska rapporteras som OKÄND, ALDRIG som
 * noll. Node dokumenterar att loadavg() returnerar [0, 0, 0] på plattformar
 * utan stöd (Windows). Läses det som 0 blir "maskinen var vilande" — och en
 * deflatering byggd på den nollan pekar åt fel håll: den friskförklarar en
 * körning i stället för att flagga att lasten är omätt.
 *
 * Alla tre värden exakt 0 tolkas därför som SAKNAT stöd, inte som vilande
 * maskin. En genuint vilande maskin ger i praktiken aldrig tre exakta nollor,
 * och den falska OKÄND-etiketten kostar inget — den falska nollan kostar en
 * slutsats.
 *
 * @param {number[]|undefined} raa utfallet av os.loadavg()
 * @returns {number|null} 1-min loadavg avrundad till 2 decimaler, eller null
 */
export function normaliseraLoadavg(raa) {
  if (!Array.isArray(raa) || raa.length < 3) return null;
  if (!raa.every((v) => typeof v === 'number' && Number.isFinite(v) && v >= 0)) return null;
  if (raa[0] === 0 && raa[1] === 0 && raa[2] === 0) return null;
  return Number(raa[0].toFixed(2));
}

/** Formaterar ett loadavg-värde för utskrift. null → OKÄND, aldrig 0. */
export function visaLoadavg(v) {
  return v === null || v === undefined ? 'OKÄND' : String(v);
}

const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

/**
 * Plattar ut Playwrights JSON-rapport till en rad per TESTRESULTAT.
 *
 * Ett testresultat, inte ett test: med retries (som riggen tvingar till 0)
 * eller Playwrights egna omkörningar kan samma spec bära flera results, och
 * varje sådant är en egen observation.
 *
 * @param {object} rapport parsad Playwright-JSON
 * @returns {Array<object>} rader med fil, rad, titel, status, ms, fel
 */
export function plattaUtRapport(rapport) {
  const ut = [];
  const gå = (sviter) => {
    for (const svit of sviter ?? []) {
      for (const spec of svit.specs ?? []) {
        for (const test of spec.tests ?? []) {
          for (const res of test.results ?? []) {
            ut.push({
              fil: spec.file,
              rad: spec.line,
              titel: spec.title,
              status: res.status,
              ms: res.duration,
              forsok: res.retry ?? 0,
              fel: (res.errors ?? []).map((e) =>
                String(e.message ?? '')
                  .replace(ANSI, '')
                  .trim(),
              ),
            });
          }
        }
      }
      gå(svit.suites);
    }
  };
  gå(rapport?.suites);
  return ut;
}

/**
 * Läser projektets EFFEKTIVA konfiguration ur Playwrights JSON-rapport.
 *
 * Detta är TASK-74:s armkoll, kodad: "att ändringarna faktiskt biter är
 * verifierat UR ARTEFAKTERNA, inte antaget". Rapporten bär projektets
 * test-timeout och retries, så två armar som ska köra olika kod men visar
 * identiskt fingeravtryck avslöjar ett A/B som aldrig blev ett A/B.
 *
 * Verktyget DÖMER inte på detta — patchen behöver inte röra configen (en fix
 * i testkod syns inte här). Fingeravtrycket redovisas; tolkningen är kortets.
 *
 * @param {object} rapport parsad Playwright-JSON
 * @param {string} projekt projektnamn
 */
export function konfigFingeravtryck(rapport, projekt) {
  const p = (rapport?.config?.projects ?? []).find((x) => x.name === projekt);
  if (!p) return null;
  return {
    timeout: p.timeout ?? null,
    retries: p.retries ?? null,
    workers: p.metadata?.actualWorkers ?? null,
  };
}

/**
 * Sammanfattar en serie ur körnings- och resultat-rader. REN redovisning:
 * antal, rater och lastspann per arm. Inga omdömen, inga trösklar.
 *
 * @param {Array<object>} korningar rader ur serie.jsonl
 * @param {Array<object>} resultat rader ur resultat.jsonl
 */
export function sammanfatta(korningar, resultat) {
  const armar = {};
  for (const arm of ['A', 'B']) {
    const k = korningar.filter((x) => x.arm === arm);
    const r = resultat.filter((x) => x.arm === arm);
    const fallda = r.filter((x) => x.status !== 'passed');
    const laster = k.map((x) => x.loadVidSlut).filter((x) => x !== null && x !== undefined);
    armar[arm] = {
      korningar: k.length,
      korningarMedFallning: new Set(fallda.map((x) => x.korning)).size,
      testresultat: r.length,
      fallda: fallda.length,
      lastOkand: k.length - laster.length,
      lastMin: laster.length ? Math.min(...laster) : null,
      lastMax: laster.length ? Math.max(...laster) : null,
      lastMedel: laster.length
        ? Number((laster.reduce((a, b) => a + b, 0) / laster.length).toFixed(2))
        : null,
      sekunderMedel: k.length
        ? Math.round(k.reduce((a, b) => a + (b.sekunder ?? 0), 0) / k.length)
        : null,
    };
  }
  return armar;
}

/**
 * Renderar sammanfattningen som läsbar text. Bär fällningarnas FORM (den
 * första raden av varje felutskrift) och inte bara deras antal — TASK-74:s
 * bevis låg i formen ("Timeout: 5000ms" mot "Timeout: 15000ms"), inte i
 * 13-mot-1.
 */
export function formateraSammanfattning(korningar, resultat) {
  const rader = [];
  const armar = sammanfatta(korningar, resultat);
  rader.push('=== KÖRNINGAR ===');
  for (const k of korningar) {
    const gate =
      k.loadGateOk === null ? 'EJ TILLÄMPLIG (last OKÄND)' : k.loadGateOk ? 'ok' : 'TIMEOUT';
    rader.push(
      `[${String(k.nr).padStart(2)}] arm=${k.arm} exit=${k.exit} ${k.sekunder}s ` +
        `load ${visaLoadavg(k.loadVidStart)}->${visaLoadavg(k.loadVidSlut)} gate=${gate} ` +
        `träd=${k.tradRent} config=${k.config ? JSON.stringify(k.config) : 'OLÄST'}`,
    );
  }

  rader.push('');
  rader.push('=== PER ARM (redovisning — ingen bedömning) ===');
  for (const arm of ['A', 'B']) {
    const a = armar[arm];
    if (a.korningar === 0) continue;
    rader.push(
      `arm ${arm}: ${a.fallda} fällda av ${a.testresultat} testresultat ` +
        `i ${a.korningarMedFallning} av ${a.korningar} körningar · ` +
        `last vid slut medel ${visaLoadavg(a.lastMedel)} (${visaLoadavg(a.lastMin)}–${visaLoadavg(a.lastMax)}` +
        `${a.lastOkand > 0 ? `, ${a.lastOkand} OKÄND` : ''}) · ` +
        `körtid medel ${a.sekunderMedel} s`,
    );
  }

  const fallda = resultat.filter((x) => x.status !== 'passed');
  rader.push('');
  rader.push(`=== FÄLLNINGAR MED FORM (${fallda.length}) ===`);
  if (fallda.length === 0) rader.push('(inga)');
  for (const f of fallda) {
    rader.push(
      `körning ${f.korning} arm=${f.arm} last(slut)=${visaLoadavg(f.loadVidSlut)} ` +
        `${f.fil}:${f.rad} [${f.status} ${f.ms}ms] ${f.titel}`,
    );
    for (const e of f.fel) {
      for (const r of e.split('\n').slice(0, 4)) rader.push(`      ${r.slice(0, 200)}`);
    }
  }

  rader.push('');
  rader.push(
    'DEFLATERING: resultat.jsonl bär loadavg per rad. Vill du utesluta en ' +
      'lasttopp, filtrera på loadVidSlut — ingen omkörning behövs.',
  );
  rader.push(
    'INGEN TRÖSKEL FÖR ACCEPTABEL FLAKIGHET FINNS I VERKTYGET. Bedömningen ' +
      'hör till kortet som beställde mätningen.',
  );
  return rader.join('\n');
}

/** Läser en JSONL-fil till en array. Saknad fil → tom array. */
export function lasJsonl(fil) {
  if (!existsSync(fil)) return [];
  return readFileSync(fil, 'utf8')
    .split('\n')
    .filter((r) => r.trim())
    .map((r) => JSON.parse(r));
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function arg(namn, fallback) {
  const i = process.argv.indexOf(`--${namn}`);
  return i === -1 ? fallback : process.argv[i + 1];
}
const flagga = (namn) => process.argv.includes(`--${namn}`);

const sov = (ms) => new Promise((r) => setTimeout(r, ms));

function tradStatus(repo) {
  return execFileSync('git', ['status', '--porcelain'], { cwd: repo }).toString().trim();
}

async function kor() {
  const lasDir = arg('las', null);
  if (lasDir) {
    const dir = path.resolve(lasDir);
    const korningar = lasJsonl(path.join(dir, 'serie.jsonl'));
    const resultat = lasJsonl(path.join(dir, 'resultat.jsonl'));
    console.log(
      flagga('json')
        ? JSON.stringify(sammanfatta(korningar, resultat), null, 2)
        : formateraSammanfattning(korningar, resultat),
    );
    return 0;
  }

  const varv = Number(arg('varv', ''));
  const utdirArg = arg('utdir', null);
  if (!utdirArg) {
    console.error('FEL: --utdir krävs. Se filhuvudet för användning.');
    return 2;
  }
  const plan = byggPlan(varv); // kastar på ogiltigt --varv
  const utdir = path.resolve(utdirArg);
  const projekt = String(arg('projekt', 'acceptance'));
  const workers = String(arg('workers', '8'));
  const grep = arg('grep', null);
  const patchFil = arg('patch', null) ? path.resolve(String(arg('patch'))) : null;
  const loadGate = Number(arg('load-gate', '5.5'));
  const cooldown = Number(arg('cooldown', '45')) * 1000;
  const gateTimeout = Number(arg('gate-timeout', '180')) * 1000;

  mkdirSync(utdir, { recursive: true });

  const smutsigt = tradStatus(REPO);
  if (smutsigt) {
    console.error(`ABORT: trädet är inte rent före serien:\n${smutsigt}`);
    return 2;
  }
  if (patchFil && !existsSync(patchFil)) {
    console.error(`ABORT: patchfilen finns inte: ${patchFil}`);
    return 2;
  }

  console.log(
    `Plan: ${plan.join(',')} (${varv} varv, ${plan.length} körningar) · projekt=${projekt} ` +
      `workers=${workers} retries=0 · patch=${patchFil ?? 'ingen (armarna identiska)'}`,
  );

  const seriefil = path.join(utdir, 'serie.jsonl');
  const resultatfil = path.join(utdir, 'resultat.jsonl');

  /** Väntar tills 1-min loadavg fallit under grinden. Är lasten OKÄND är
   *  grinden inte tillämplig — den passeras då med gateOk=null, aldrig med en
   *  nolla som låtsas att maskinen var vilande. */
  async function vantaPaLast() {
    const start = Date.now();
    let v = normaliseraLoadavg(loadavg());
    if (v === null) return { gateOk: null };
    while (v > loadGate) {
      if (Date.now() - start > gateTimeout) return { gateOk: false };
      await sov(5000);
      v = normaliseraLoadavg(loadavg());
      if (v === null) return { gateOk: null };
    }
    return { gateOk: true };
  }

  /** Acceptance-klassens dev-serverport MÅSTE vara ledig. webServer kör
   *  reuseExistingServer: false + --strictPort, så en dröjande dev-server ger
   *  hård vägran och en NOLL-körning som ser ut som en fällning. Det hände i
   *  TASK-74:s A/B-serie (run-02-B, 2 s, exit 1) och är ett MÄTFEL, inte data
   *  — därför vakten.
   *
   *  PORTEN HÄMTAS, DEN SKRIVS INTE (TASK-251). Vakten stod tidigare på
   *  literalen 5399 och `pkill -f 'vite --port 5399'`. Båda blev fel så fort
   *  riggen kördes i en worktree: lsof hade tittat på en port ingen av VÅRA
   *  processer lyssnade på, och pkill hade dödat en ANNAN agents dev-server —
   *  en mätrigg som saboterar grannen är värre än ingen vakt alls. */
  const ACCEPTANCE_PORT = devPort('acceptance');

  async function vantaPaPort() {
    for (let i = 0; i < 30; i++) {
      try {
        execFileSync('lsof', ['-ti', `:${ACCEPTANCE_PORT}`], {
          stdio: ['ignore', 'pipe', 'ignore'],
        });
      } catch {
        return true; // lsof exit 1 = ingen lyssnare
      }
      if (i === 10) {
        try {
          execFileSync('pkill', ['-f', `vite --port ${ACCEPTANCE_PORT}`], { stdio: 'ignore' });
        } catch {
          /* redan borta */
        }
      }
      await sov(2000);
    }
    return false;
  }

  function patcha(riktning) {
    if (!patchFil) return;
    const flaggor = riktning === 'på' ? ['apply'] : ['apply', '-R'];
    execFileSync('git', [...flaggor, patchFil], { cwd: REPO, stdio: 'inherit' });
  }

  async function korEn(nr, arm) {
    const jsonUt = path.join(utdir, `run-${String(nr).padStart(2, '0')}-${arm}.json`);
    const portLedig = await vantaPaPort();
    const gate = await vantaPaLast();
    const loadVidStart = normaliseraLoadavg(loadavg());

    if (arm === 'B') patcha('på');

    const argv = [
      'playwright',
      'test',
      `--project=${projekt}`,
      `--workers=${workers}`,
      '--retries=0', // kodad — se egenskap 3 i filhuvudet
      '--reporter=json,./tests/support/fixturvarld/overskuggnings-rapport.ts',
    ];
    if (grep) argv.push('--grep', String(grep));

    const t0 = Date.now();
    const exit = await new Promise((resolve) => {
      const p = spawn('npx', argv, {
        cwd: REPO,
        env: {
          ...process.env,
          PLAYWRIGHT_ACCEPTANCE_DEV_SERVER: '1',
          PLAYWRIGHT_JSON_OUTPUT_NAME: jsonUt,
        },
        stdio: ['ignore', 'ignore', 'pipe'],
      });
      let stderr = '';
      p.stderr.on('data', (d) => {
        stderr += d.toString();
      });
      p.on('close', (c) => {
        if (stderr.trim()) writeFileSync(`${jsonUt}.stderr.txt`, stderr);
        resolve(c);
      });
    });
    const sekunder = Math.round((Date.now() - t0) / 1000);

    if (arm === 'B') patcha('av');

    const loadVidSlut = normaliseraLoadavg(loadavg());

    // Rådatan (AC 3): en rad per TESTRESULTAT, denormaliserad med körningens
    // loadavg så en deflatering blir ett filter i stället för en omkörning.
    let rader = [];
    let config = null;
    let rapportLast = 'saknas';
    if (existsSync(jsonUt)) {
      try {
        const rapport = JSON.parse(readFileSync(jsonUt, 'utf8'));
        rader = plattaUtRapport(rapport);
        config = konfigFingeravtryck(rapport, projekt);
        rapportLast = 'ok';
      } catch (err) {
        rapportLast = `TRASIG: ${err.message}`;
      }
    }
    for (const r of rader) {
      appendFileSync(
        resultatfil,
        `${JSON.stringify({ korning: nr, arm, loadVidStart, loadVidSlut, ...r })}\n`,
      );
    }

    const post = {
      nr,
      arm,
      exit,
      sekunder,
      loadVidStart,
      loadVidSlut,
      loadGateOk: gate.gateOk,
      portLedig,
      rapport: rapportLast,
      testresultat: rader.length,
      config,
      tradRent: tradStatus(REPO) === '' ? 'rent' : 'SMUTSIGT',
      json: existsSync(jsonUt) ? path.basename(jsonUt) : null,
      tid: new Date().toISOString(),
    };
    appendFileSync(seriefil, `${JSON.stringify(post)}\n`);

    const gateText = gate.gateOk === null ? 'EJ TILLÄMPLIG' : gate.gateOk ? 'ok' : 'TIMEOUT';
    console.log(
      `[${nr}/${plan.length}] arm=${arm} exit=${exit} ${sekunder}s ` +
        `load ${visaLoadavg(loadVidStart)}->${visaLoadavg(loadVidSlut)} ` +
        `gate=${gateText} resultat=${rader.length} rapport=${rapportLast} träd=${post.tradRent}`,
    );
    return post;
  }

  for (let i = 0; i < plan.length; i++) {
    await korEn(i + 1, plan[i]);
    if (i < plan.length - 1) await sov(cooldown);
  }

  console.log(`\nKLAR. Rådata: ${seriefil} · ${resultatfil}\n`);
  console.log(formateraSammanfattning(lasJsonl(seriefil), lasJsonl(resultatfil)));
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  kor()
    .then((kod) => {
      process.exitCode = kod;
    })
    .catch((err) => {
      console.error(`FEL: ${err.message}`);
      process.exitCode = 2;
    });
}
