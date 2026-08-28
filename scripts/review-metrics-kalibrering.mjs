#!/usr/bin/env node
// scripts/review-metrics-kalibrering.mjs — CLI: bokför en risk-kalibreringspost
// (TASK-173.6 AC #2, ADR-105 beslut 5: "varje Marcus-fångst på en låg-stämplad
// PR bokförs som grind-miss").
//
// ═══ ANVÄNDNING ═══
//   node scripts/review-metrics-kalibrering.mjs --pr <N> --fangst "<text>"
//   node scripts/review-metrics-kalibrering.mjs --pr <N> --fangst "<text>" \
//     --kort <ID> --risk lag|medel|hog --kalla "<namn>"
//   npm run review:kalibrering -- --pr <N> --fangst "<text>"
//
// Detta är, MEDVETET, det ENDA av review-grindens skript som INTE körs
// automatiskt av det befintliga flödet — kalibrering är per definition en
// händelse NÅGON måste observera (Marcus, eller orkestreraren å hans vägnar)
// och bokföra, aldrig något ett skript kan härleda ur ett utlåtande.
//
// ═══ FLAGGOR ═══
// --pr <N>        (krävs) PR-numret som granskades (eller inte granskades —
//                 se --risk nedan).
// --fangst <text> (krävs) Fri text: vad fångades, och (om känt) varför
//                 granskningen missade det.
// --kort <ID>     Kort-ID:t PR:en bar, om något (t.ex. TASK-173.6).
// --risk <niva>   Den risknivå granskningen STÄMPLADE (lag/medel/hog).
//                 UTELÄMNAS när PR:en aldrig granskades (t.ex. den var
//                 D0-undantagen) — `null` är själva D0-omprövnings-signalen,
//                 se scripts/lib/review-metrics.mjs § kalibreringarUtanKorning.
// --kalla <namn>  Vem som bokför posten. Default: `git config user.name`
//                 (samma identitet som står på commits i detta repo);
//                 `--kalla` skriver över om den behöver vara en annan.
// --fil <path>    Skriv till en annan loggfil än default (test/offline-läge).
//
// ═══ EXIT-KODER ═══
// 0  — posten skrevs.
// 1  — obligatorisk flagga saknas (--pr eller --fangst).
// 2  — felaktig CLI-användning (okänt argument, ogiltigt värde på ett flaggnamn).
// 3  — posten validerar inte mot schemat (bör inte kunna inträffa givet CLI:ts
//      egen validering av flaggorna, men fail-closed hellre än att skriva en
//      rad som senare visar sig oläsbar).

import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { byggKalibreringRad, METRIK_LOGG_FIL } from './lib/review-metrics.mjs';

const EXIT_OK = 0;
const EXIT_SAKNAS = 1;
const EXIT_CLI = 2;
const EXIT_MALFORMAT = 3;

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function gitAnvandarnamn() {
  const res = spawnSync('git', ['config', 'user.name'], { encoding: 'utf8' });
  const namn = (res.stdout ?? '').trim();
  return res.status === 0 && namn !== '' ? namn : 'okänd';
}

function parseArgv(argv) {
  const ut = {
    pr: null,
    fangst: null,
    kort: null,
    risk: null,
    kalla: null,
    fil: null,
    fel: null,
  };
  const flaggaMedVarde = (namn, satt) => {
    return (i, argv2) => {
      const v = argv2[i + 1];
      if (!v || v.startsWith('--')) {
        ut.fel = `${namn} kräver ett värde.`;
        return null;
      }
      satt(v);
      return i + 1;
    };
  };
  const hanterare = {
    '--pr': flaggaMedVarde('--pr', (v) => {
      ut.pr = v;
    }),
    '--fangst': flaggaMedVarde('--fangst', (v) => {
      ut.fangst = v;
    }),
    '--kort': flaggaMedVarde('--kort', (v) => {
      ut.kort = v;
    }),
    '--risk': flaggaMedVarde('--risk', (v) => {
      ut.risk = v;
    }),
    '--kalla': flaggaMedVarde('--kalla', (v) => {
      ut.kalla = v;
    }),
    '--fil': flaggaMedVarde('--fil', (v) => {
      ut.fil = v;
    }),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const h = hanterare[arg];
    if (!h) {
      ut.fel = `okänt argument: ${arg}`;
      return ut;
    }
    const nyttIndex = h(i, argv);
    if (ut.fel) return ut;
    i = nyttIndex;
  }
  return ut;
}

function main(argv) {
  const args = parseArgv(argv);
  if (args.fel) {
    console.error(`FEL: ${args.fel}`);
    console.error(
      'Användning: node scripts/review-metrics-kalibrering.mjs --pr <N> --fangst "<text>" ' +
        '[--kort <ID>] [--risk lag|medel|hog] [--kalla <namn>] [--fil <path>]',
    );
    return EXIT_CLI;
  }
  if (args.pr === null || args.fangst === null) {
    console.error('FEL: --pr och --fangst är obligatoriska.');
    return EXIT_SAKNAS;
  }
  const prNummer = Number(args.pr);
  if (!Number.isInteger(prNummer) || prNummer <= 0) {
    console.error(`FEL: --pr måste vara ett positivt heltal, fick '${args.pr}'.`);
    return EXIT_CLI;
  }
  if (args.risk !== null && !['lag', 'medel', 'hog'].includes(args.risk)) {
    console.error(`FEL: --risk måste vara lag/medel/hog, fick '${args.risk}'.`);
    return EXIT_CLI;
  }

  const rad = byggKalibreringRad({
    prNummer,
    kortId: args.kort,
    stampladRisk: args.risk,
    fangst: args.fangst,
    kalla: args.kalla ?? gitAnvandarnamn(),
    tidsstampel: new Date().toISOString(),
  });
  if (!rad.ok) {
    console.error('FEL: kalibreringsposten validerar inte mot schemat:');
    for (const e of rad.errors) console.error(`  - ${e}`);
    return EXIT_MALFORMAT;
  }

  const filPath = args.fil ?? resolve(REPO, METRIK_LOGG_FIL);
  if (!existsSync(dirname(filPath))) mkdirSync(dirname(filPath), { recursive: true });
  appendFileSync(filPath, `${JSON.stringify(rad.data)}\n`, 'utf8');

  console.log(
    `Kalibreringspost skriven till ${filPath}: PR #${prNummer}${args.kort ? ` (${args.kort})` : ''}.`,
  );
  return EXIT_OK;
}

if (import.meta.main) {
  process.exit(main(process.argv.slice(2)));
}
