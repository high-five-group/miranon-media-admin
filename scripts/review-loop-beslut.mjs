#!/usr/bin/env node
// scripts/review-loop-beslut.mjs — CLI: ett granskningsutlåtande → loopens
// deterministiska nästa-steg-beslut (TASK-173.5, ADR-105 beslut 4/5).
//
// ═══ ANVÄNDNING ═══
//   node scripts/review-loop-beslut.mjs <utlatande.json>
//   node scripts/review-loop-beslut.mjs <utlatande.json> --json
//   node scripts/review-loop-beslut.mjs <utlatande.json> --foregaende-sha <sha>
//   node scripts/review-loop-beslut.mjs <utlatande.json> --policy-fil <path>
//   npm run review:loop -- <utlatande.json>
//
// PR-numret och rundnumret hämtas ur utlåtandets EGNA fält (`prNummer`,
// `runda`) — ingen separat flagga, så anropet aldrig kan peka mot en annan PR
// eller påstå en annan runda än den granskaren faktiskt körde. Samma val som
// scripts/uppdatera-review-sektion.mjs gör för `prNummer`.
//
// --foregaende-sha: föregående rundas `granskadSha`. Orkestreraren har den —
// 173.3:s Riskbedömnings-sektion i PR-kroppen bär `**Granskad SHA:**` för
// senaste rundan, och utlåtande-filen från förra rundan bär den i klartext.
// Ges den, prövas att något faktiskt pushats mellan rundorna (se
// scripts/lib/review-loop.mjs § RUNDAN ÄR KNUTEN TILL EN SHA). Ges den inte
// hoppas kontrollen över — synligt, som en varning i utdatan, aldrig tyst.
//
// --policy-fil <path>: läser loop-policyn ur en lokal fil i stället för ur
// origin/main (offline/test-läge, samma disciplin som --filer i
// scripts/hamta-review-policy.mjs och --kropp-fil i
// scripts/uppdatera-review-sektion.mjs). Den skarpa vägen läser ALDRIG från
// disk — se nedan.
//
// ═══ POLICYN LÄSES UR origin/main, INTE UR ARBETSTRÄDET ═══
// `git show origin/main:.review-loop-policy.json` — exakt samma tillitsmodell
// som 173.2:s path-regler (ADR-105 beslut 7). En PR-gren som satte `tak: 99`
// eller mildrade `blockeringstroskel` hade annars mildrat granskningen av SIN
// EGEN PR. `--policy-fil` finns för testsviten och för offline-körning, och
// det är ett MEDVETET svagare läge: det skrivs ut i utdatan varje gång det
// används, så en körning på en lokal policy aldrig kan förväxlas med en
// trusted körning.
//
// FÄRSKHET ÄR ANROPARENS ANSVAR: skriptet kör medvetet ingen `git fetch` (en
// mutation av delad state), men skriver ut den lästa SHA:n — en inaktuell
// origin/main är synlig i efterhand i stället för tyst. Samma val som
// scripts/hamta-review-policy.mjs.
//
// ═══ EXIT-KODEN BÄR BESLUTET ═══
// Orkestreraren ska kunna grena på `$?` utan att parsa utdatan, och den
// vanliga formen `node scripts/review-loop-beslut.mjs u.json && gh pr merge
// --auto` ska aldrig armera på annat än konvergens:
//   0  — KONVERGERAD. Loopen är klar; orkestrerarens övriga armerings-regler
//        gäller oförändrat (CLAUDE.md § Landning). Detta är ett grind-utfall,
//        inte en armerings-order.
//   10 — NY RUNDA. Bygg-agenten rättar de auto-fix-klassade fynden, därefter
//        körs nästa runda i FÄRSK kontext.
//   20 — ESKALERA till Marcus (tak nått · HÖG risk · ask-user-fynd · ingen
//        ändring mellan rundorna). Armera INTE. Utdatan bär den markeringsbara
//        STOPPA-OCH-FRÅGA-listan.
//   1  — MALFORMAT utlåtande: filen är inte giltig JSON, eller validerar inte
//        mot scripts/lib/review-utlatande.mjs:s schema. Inget beslut fattas på
//        ett utlåtande som inte går att lita på.
//   2  — felaktig CLI-användning.
//   64 — POLICYFEL: loop-policyn kan inte läsas ur trusted-refen, är inte
//        giltig JSON, eller validerar inte mot schemat. Fail-closed, samma kod
//        och samma skäl som scripts/hamta-review-policy.mjs: loopen ska STANNA,
//        aldrig köras med gissade tak eller trösklar.

// ═══ INSTRUMENTERING (TASK-173.6) ═══
// Varje LYCKAT beslut (utlåtande OCH policy giltiga) appendar EN "korning"-rad
// till scripts/lib/review-metrics.mjs:s loggfil — INGEN ny orkestrerar-
// handling att glömma (CLAUDE.md § Review-grinden varnar uttryckligen om just
// det för de andra review-skripten). Ett malformat utlåtande (exit 1) eller
// ett policyfel (exit 64) loggar INGET — en trasig indata ska inte förorena
// fångstrate-underlaget. En loggnings-MISS (t.ex. filsystemet är skrivskyddat)
// skriver en varning till stderr men ändrar ALDRIG exitkoden: instrumentering
// är en bokföringsyta, aldrig en ny grind (Marcus-mandat, TASK-173.6-kortet).
//
// --metrik-fil <path>: skriv till en annan loggfil än default (test/offline-
// läge, samma disciplin som --policy-fil ovan). Default resolvas mot SAMMA
// `REPO`-konstant som redan styr var git-kommandona körs — vilket är det som
// gör test-review-loop.mjs:s section F (CLI kopierad till ett engångs-repo)
// trygg utan ändring: en kopierad script-fil härleder sin egen repo-rot.
// Section E (CLI körd direkt mot DETTA repo) skickar --metrik-fil explicit
// mot en temp-fil av exakt samma skäl.

import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  beslutaNastaSteg,
  LOOP_POLICY_FIL,
  parsaLoopPolicy,
  renderaBeslut,
} from './lib/review-loop.mjs';
import { byggKorningRad, METRIK_LOGG_FIL } from './lib/review-metrics.mjs';
import { valideraUtlatande } from './lib/review-utlatande.mjs';

const EXIT_KONVERGERAD = 0;
const EXIT_MALFORMAT = 1;
const EXIT_CLI = 2;
const EXIT_NY_RUNDA = 10;
const EXIT_ESKALERA = 20;
const EXIT_POLICYFEL = 64;

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Den ENDA källan loop-policyn får läsas ur i den skarpa vägen. */
export const TRUSTED_REF = 'origin/main';

/** Beslut → exitkod. Exporterad så testsviten prövar SAMMA tabell som CLI:t
 * använder, i stället för en andra kopia som kan glida isär. */
export const BESLUT_EXITKOD = {
  konvergerad: EXIT_KONVERGERAD,
  'ny-runda': EXIT_NY_RUNDA,
  'eskalera-tak': EXIT_ESKALERA,
  'eskalera-risk': EXIT_ESKALERA,
  'eskalera-ask-user': EXIT_ESKALERA,
  'eskalera-ingen-andring': EXIT_ESKALERA,
};

function korGit(repoPath, args) {
  const res = spawnSync('git', args, { cwd: repoPath, encoding: 'utf8' });
  return { status: res.status, stdout: res.stdout ?? '', stderr: res.stderr ?? '' };
}

/**
 * Läser och validerar loop-policyn ur en git-ref. Gör ingen I/O mot
 * arbetsträdet — `git show` läser ur objektdatabasen och är därför säker
 * oavsett vilken gren som råkar vara utcheckad, och oavsett om anroparen står i
 * huvudkatalogen eller i en worktree.
 *
 * Exporterad så testsviten kan peka den mot ett temporärt repo och bevisa
 * trusted-ref-egenskapen i BÅDA riktningar — den skarpa vägen anropar den
 * alltid med TRUSTED_REF.
 *
 * @param {string} repoPath
 * @param {string} [ref]
 * @returns {{ok: true, policy: object, sha: string, errors: []}
 *         | {ok: false, policy: null, sha: string|null, errors: string[]}}
 */
export function lasLoopPolicyUrRef(repoPath, ref = TRUSTED_REF) {
  const shaRes = korGit(repoPath, ['rev-parse', ref]);
  if (shaRes.status !== 0) {
    return {
      ok: false,
      policy: null,
      sha: null,
      errors: [`kunde inte slå upp ref '${ref}': ${shaRes.stderr.trim() || 'okänt git-fel'}`],
    };
  }
  const sha = shaRes.stdout.trim();

  const visa = korGit(repoPath, ['show', `${ref}:${LOOP_POLICY_FIL}`]);
  if (visa.status !== 0) {
    return {
      ok: false,
      policy: null,
      sha,
      errors: [
        `kunde inte läsa ${LOOP_POLICY_FIL} ur '${ref}' (${sha}): ${visa.stderr.trim() || 'okänt git-fel'}`,
      ],
    };
  }

  let raw;
  try {
    raw = JSON.parse(visa.stdout);
  } catch (error) {
    return {
      ok: false,
      policy: null,
      sha,
      errors: [`${LOOP_POLICY_FIL} i '${ref}' (${sha}) är inte giltig JSON: ${error.message}`],
    };
  }

  const { ok, policy, errors } = parsaLoopPolicy(raw);
  if (!ok) return { ok: false, policy: null, sha, errors };
  return { ok: true, policy, sha, errors: [] };
}

/**
 * Läser och validerar loop-policyn ur en lokal fil (--policy-fil).
 *
 * @param {string} path
 * @returns {{ok: true, policy: object, errors: []} | {ok: false, policy: null, errors: string[]}}
 */
export function lasLoopPolicyUrFil(path) {
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    return { ok: false, policy: null, errors: [`kunde inte läsa/parsa ${path}: ${error.message}`] };
  }
  return parsaLoopPolicy(raw);
}

function parseArgv(argv) {
  const ut = {
    path: null,
    json: false,
    foregaendeSha: null,
    policyFil: null,
    metrikFil: null,
    fel: null,
  };
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') {
      ut.json = true;
    } else if (arg === '--foregaende-sha') {
      i += 1;
      const v = argv[i];
      if (!v || v.startsWith('--')) {
        ut.fel = '--foregaende-sha kräver en SHA.';
        return ut;
      }
      ut.foregaendeSha = v;
    } else if (arg === '--policy-fil') {
      i += 1;
      const v = argv[i];
      if (!v || v.startsWith('--')) {
        ut.fel = '--policy-fil kräver en sökväg.';
        return ut;
      }
      ut.policyFil = v;
    } else if (arg === '--metrik-fil') {
      i += 1;
      const v = argv[i];
      if (!v || v.startsWith('--')) {
        ut.fel = '--metrik-fil kräver en sökväg.';
        return ut;
      }
      ut.metrikFil = v;
    } else if (arg.startsWith('--')) {
      ut.fel = `okänt argument: ${arg}`;
      return ut;
    } else {
      rest.push(arg);
    }
  }
  if (rest.length !== 1) {
    ut.fel = 'ange exakt en sökväg till granskningsutlåtandets JSON-fil.';
    return ut;
  }
  ut.path = rest[0];
  return ut;
}

/**
 * Resolvar var instrumenteringsraden ska skrivas: `override` (--metrik-fil)
 * om given, annars METRIK_LOGG_FIL under `repo`. Exporterad ren funktion så
 * testsviten kan bevisa resolutionen utan att göra någon I/O eller spawna
 * CLI:t (TASK-173.6).
 *
 * @param {string} repo
 * @param {string|null} [override]
 * @returns {string}
 */
export function metrikFilFor(repo, override = null) {
  return override ?? resolve(repo, METRIK_LOGG_FIL);
}

/**
 * Appendar en rad till instrumenteringsloggen. Skapar mappen om den saknas
 * (en färsk temp-repo-kopia i test-review-loop.mjs section F har ingen
 * docs/reference/ än). Ren I/O, ingen validering — anroparen skickar en
 * redan schema-validerad rad (`byggKorningRad(...).data`).
 *
 * @param {string} path
 * @param {object} rad
 */
function appendMetrikRad(path, rad) {
  if (!existsSync(dirname(path))) mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${JSON.stringify(rad)}\n`, 'utf8');
}

function main(argv) {
  const args = parseArgv(argv);
  if (args.fel) {
    console.error(`FEL: ${args.fel}`);
    console.error(
      'Användning: node scripts/review-loop-beslut.mjs <utlatande.json> ' +
        '[--json] [--foregaende-sha <sha>] [--policy-fil <path>] [--metrik-fil <path>]',
    );
    return EXIT_CLI;
  }

  let raw;
  try {
    raw = JSON.parse(readFileSync(args.path, 'utf8'));
  } catch (error) {
    console.error(`FEL: kunde inte läsa/parsa ${args.path} som JSON: ${error.message}`);
    return EXIT_MALFORMAT;
  }

  const validerat = valideraUtlatande(raw);
  if (!validerat.ok) {
    console.error(
      `FEL: utlåtandet i ${args.path} validerar INTE mot schemat (${validerat.errors.length} fel) — ` +
        'inget loop-beslut fattas på ett utlåtande som inte går att lita på:',
    );
    for (const message of validerat.errors) console.error(`  - ${message}`);
    return EXIT_MALFORMAT;
  }

  let policy;
  let policyKalla;
  if (args.policyFil !== null) {
    const lokal = lasLoopPolicyUrFil(args.policyFil);
    if (!lokal.ok) {
      console.error(`POLICYFEL: ${LOOP_POLICY_FIL} kunde inte läsas ur ${args.policyFil}.`);
      for (const rad of lokal.errors) console.error(`  - ${rad}`);
      return EXIT_POLICYFEL;
    }
    policy = lokal.policy;
    policyKalla = `lokal fil ${args.policyFil} (SVAGARE LÄGE — inte trusted ${TRUSTED_REF})`;
  } else {
    const trusted = lasLoopPolicyUrRef(REPO);
    if (!trusted.ok) {
      console.error(
        `POLICYFEL: loop-policyn kunde inte läsas ur ${TRUSTED_REF} — avbryter (TASK-173.5).`,
      );
      for (const rad of trusted.errors) console.error(`  - ${rad}`);
      console.error(
        'Loopen ska STANNA här. Ett gissat rundtak eller en gissad tröskel ser ut som en ' +
          'fungerande grind men är ingen.',
      );
      return EXIT_POLICYFEL;
    }
    policy = trusted.policy;
    policyKalla = `${TRUSTED_REF} @ ${trusted.sha}`;
  }

  const beslut = beslutaNastaSteg({
    utlatande: validerat.data,
    policy,
    foregaendeSha: args.foregaendeSha,
  });

  // TASK-173.6: instrumentera EFTER ett lyckat beslut, aldrig före — se
  // filhuvudets § INSTRUMENTERING. En loggnings-miss varnar men fäller
  // aldrig CLI:ts exitkod, som bär loop-BESLUTET, inte bokförings-status.
  const metrikPath = metrikFilFor(REPO, args.metrikFil);
  const metrikRad = byggKorningRad({
    utlatande: validerat.data,
    beslut,
    tidsstampel: new Date().toISOString(),
  });
  if (!metrikRad.ok) {
    console.error('VARNING (TASK-173.6): kunde inte bygga instrumenterings-raden — loggas inte:');
    for (const rad of metrikRad.errors) console.error(`  - ${rad}`);
  } else {
    try {
      appendMetrikRad(metrikPath, metrikRad.data);
    } catch (error) {
      console.error(
        `VARNING (TASK-173.6): kunde inte skriva instrumenterings-raden till ${metrikPath}: ${error.message}`,
      );
    }
  }

  if (args.json) {
    console.log(JSON.stringify({ policyKalla, ...beslut }, null, 2));
  } else {
    console.log(renderaBeslut(beslut));
    console.error(`(loop-policy läst ur ${policyKalla})`);
  }

  return BESLUT_EXITKOD[beslut.beslut] ?? EXIT_ESKALERA;
}

if (import.meta.main) {
  process.exit(main(process.argv.slice(2)));
}
