#!/usr/bin/env node
// scripts/synka-labels.mjs — skapar/uppdaterar GitHub-labels ur
// .label-policy.json. (GitHub-issue #2298, ADR-131 § 5.)
//
// ═══ ANVÄNDNING ═══
//   node scripts/synka-labels.mjs                # torrkörning (default)
//   node scripts/synka-labels.mjs --dry-run       # samma, explicit
//   node scripts/synka-labels.mjs --utfor         # skarp körning mot GitHub
//   node scripts/synka-labels.mjs --json          # maskinläsbar utdata
//   node scripts/synka-labels.mjs --policy <path> # annan policy-fil (test/manuellt)
//   npm run labels:synka -- --utfor
//
// ═══ VARFÖR TORRKÖRNING ÄR DEFAULT ═══
// Samma grindvakts-disciplin som scripts/purge-staging-sentinels.mjs och
// scripts/review-backstopp.mjs --pr: en operation mot en delad, extern yta
// (här: repots GitHub-labels) ska aldrig vara skarp av misstag. `--utfor`
// är den EXPLICITA opt-in.
//
// ═══ ALDRIG RADERA ═══
// Skriptet skapar och uppdaterar — det raderar aldrig en label. En label som
// finns i GitHub men saknas i policyn (skyddad, GitHub-default, eller okänd)
// rörs inte. Se scripts/lib/synka-labels.mjs § ALDRIG RADERA.
//
// ═══ EN SEKUND MELLAN SKRIVNINGAR ═══
// GitHubs sekundära rate limits kräver seriella skrivningar med paus
// (samma disciplin som ADR-131 § Konsekvenser bokför för hela migrationen).
// scripts/lib/synka-labels.mjs `synka()` pausar 1000 ms mellan varje
// create/edit-anrop (injicerbart för test — se scripts/test-synka-labels.mjs).
//
// ═══ EXIT-KODER ═══
// 0 — OK: torrkörning utan drift, ELLER en lyckad --utfor-körning.
// 1 — DRIFT (bara i torrkörning): policyn och GitHubs labels skiljer sig —
//     för CI-bruk (`npm run labels:synka` i en grind skulle fälla här).
// 2 — ANROPSFEL/POLICYFEL: ogiltig CLI-användning, trasig/ogiltig JSON-policy
//     (fail-closed — se valideraPolicy i scripts/lib/synka-labels.mjs), eller
//     ett `gh`-anrop som fallerade under --utfor.

import { spawnSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { formateraTorrkorning, synka } from './lib/synka-labels.mjs';

const EXIT_OK = 0;
const EXIT_DRIFT = 1;
const EXIT_FEL = 2;

const HAR_KATALOG = dirname(fileURLToPath(import.meta.url));
const REPO_ROT = resolve(HAR_KATALOG, '..');
const DEFAULT_POLICY_PATH = join(REPO_ROT, '.label-policy.json');

/**
 * Bygger den RIKTIGA gh-klienten — enda platsen i denna fil som pratar med
 * subprocessen. Testerna injicerar en fejkad klient i stället (aldrig denna
 * funktion), se scripts/test-synka-labels.mjs.
 */
export function skapaGhKlient() {
  return {
    listLabels() {
      const res = spawnSync(
        'gh',
        ['label', 'list', '--json', 'name,description,color', '--limit', '200'],
        { encoding: 'utf8' },
      );
      if (res.status !== 0) {
        throw new Error(
          `gh label list misslyckades: ${(res.stderr ?? '').trim() || `exit ${res.status}`}`,
        );
      }
      let data;
      try {
        data = JSON.parse(res.stdout ?? '');
      } catch (err) {
        throw new Error(`Kunde inte tolka gh label list-svaret: ${err}`);
      }
      if (!Array.isArray(data)) {
        throw new Error('gh label list gav inte en JSON-array.');
      }
      return data;
    },
    createLabel(spec) {
      const res = spawnSync(
        'gh',
        ['label', 'create', spec.name, '--color', spec.color, '--description', spec.beskrivning],
        { encoding: 'utf8' },
      );
      if (res.status !== 0) {
        throw new Error(
          `gh label create misslyckades för "${spec.name}": ${(res.stderr ?? '').trim() || `exit ${res.status}`}`,
        );
      }
    },
    updateLabel(spec) {
      const res = spawnSync(
        'gh',
        ['label', 'edit', spec.name, '--color', spec.color, '--description', spec.beskrivning],
        { encoding: 'utf8' },
      );
      if (res.status !== 0) {
        throw new Error(
          `gh label edit misslyckades för "${spec.name}": ${(res.stderr ?? '').trim() || `exit ${res.status}`}`,
        );
      }
    },
  };
}

function anvandning(skal) {
  return `${skal}\n\nAnvändning:\n  node scripts/synka-labels.mjs [--dry-run|--utfor] [--json] [--policy <path>]\n`;
}

/**
 * @param {string[]} argv
 * @param {object} [deps]
 * @param {ReturnType<typeof skapaGhKlient>} [deps.ghKlient]
 * @param {string} [deps.policyPath]
 * @param {(chunk: string) => void} [deps.stdout]
 * @param {(chunk: string) => void} [deps.stderr]
 * @param {number} [deps.sleepMs] Paus mellan skrivningar under --utfor (default 1000 ms — se
 *   scripts/lib/synka-labels.mjs `synka()`). Testerna sätter denna till 0 för att slippa
 *   verklig väggklocka; produktions-CLI:t lämnar den orörd.
 * @param {(ms: number) => Promise<void>} [deps.sleepFn] Injicerbar väntefunktion (test: instant).
 * @returns {Promise<number>}
 */
export async function main(argv, deps = {}) {
  const stdout = deps.stdout ?? ((s) => process.stdout.write(s));
  const stderr = deps.stderr ?? ((s) => process.stderr.write(s));

  let utfor = false;
  let json = false;
  let policyPath = deps.policyPath ?? DEFAULT_POLICY_PATH;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      utfor = false;
      continue;
    }
    if (arg === '--utfor') {
      utfor = true;
      continue;
    }
    if (arg === '--json') {
      json = true;
      continue;
    }
    if (arg === '--policy') {
      const varde = argv[i + 1];
      if (varde === undefined) {
        stderr(anvandning('--policy kräver ett värde.'));
        return EXIT_FEL;
      }
      policyPath = resolve(varde);
      i += 1;
      continue;
    }
    stderr(anvandning(`Okänt argument: ${arg}`));
    return EXIT_FEL;
  }

  let radaText;
  try {
    radaText = readFileSync(policyPath, 'utf8');
  } catch (err) {
    stderr(`Kunde inte läsa policy-filen "${policyPath}": ${err.message}\n`);
    return EXIT_FEL;
  }
  let policy;
  try {
    policy = JSON.parse(radaText);
  } catch (err) {
    stderr(`Policy-filen "${policyPath}" är inte giltig JSON: ${err.message}\n`);
    return EXIT_FEL;
  }

  const ghKlient = deps.ghKlient ?? skapaGhKlient();

  let resultat;
  try {
    resultat = await synka({
      policy,
      ghKlient,
      utfor,
      ...(deps.sleepMs !== undefined ? { sleepMs: deps.sleepMs } : {}),
      ...(deps.sleepFn !== undefined ? { sleepFn: deps.sleepFn } : {}),
    });
  } catch (err) {
    stderr(`gh-anrop fallerade: ${err.message}\n`);
    return EXIT_FEL;
  }

  if (!resultat.ok) {
    stderr(`Policyfel: ${resultat.fel}\n`);
    return EXIT_FEL;
  }

  const { diff, aliasKarta } = resultat;
  const harDrift = diff.skapa.length > 0 || diff.uppdatera.length > 0;

  if (json) {
    stdout(
      `${JSON.stringify(
        {
          utford: utfor,
          diff,
          alias: aliasKarta,
        },
        null,
        2,
      )}\n`,
    );
  } else {
    stdout(formateraTorrkorning(diff, aliasKarta));
    if (utfor) {
      stdout(
        harDrift
          ? `\nUTFÖRD: ${diff.skapa.length} skapade, ${diff.uppdatera.length} uppdaterade.\n`
          : '\nUTFÖRD: inget att göra (redan i synk).\n',
      );
    }
  }

  if (utfor) {
    return EXIT_OK;
  }
  return harDrift ? EXIT_DRIFT : EXIT_OK;
}

// Samma realpath-på-båda-sidor-vakt som scripts/review-backstopp.mjs — en
// symlänkad eller mellanslag-bärande sökväg får annars entrypointen att
// tyst hoppas över (fail-open), vilket för ett CLI som avgör CI-exitkoden
// vore den värsta tänkbara defekten.
let arKord = false;
try {
  arKord =
    Boolean(process.argv[1]) &&
    import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
} catch {
  arKord = false;
}
if (arKord) {
  main(process.argv.slice(2)).then((kod) => process.exit(kod));
}
