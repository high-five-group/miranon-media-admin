#!/usr/bin/env node
// scripts/review-metrics.mjs — CLI: läser review-grindens instrumenteringslogg
// och skriver en summering (TASK-173.6, ADR-105 § Konsekvenser).
//
// ═══ ANVÄNDNING ═══
//   node scripts/review-metrics.mjs
//   node scripts/review-metrics.mjs --json
//   node scripts/review-metrics.mjs --fil <path>
//   npm run review:metrics
//   npm run review:metrics -- --json
//
// --fil <path>: läser en annan loggfil än default (offline/test-läge, samma
// disciplin som --policy-fil i scripts/review-loop-beslut.mjs). Default är
// scripts/lib/review-metrics.mjs:s METRIK_LOGG_FIL, repo-relativt.
//
// ═══ SAKNAD LOGGFIL ÄR INTE ETT FEL ═══
// Instrumenteringen gäller FRÅN OCH MED NU (TASK-173.6) — en repo-checkout
// utan en enda körning ännu är det FÖRVÄNTADE starttillståndet, inte ett
// trasigt tillstånd. Exit 0, med ett förklarande meddelande i stället för en
// tom/vilseledande tabell.
//
// ═══ EN TRASIG RAD STOPPAR ALDRIG SUMMERINGEN ═══
// scripts/lib/review-metrics.mjs:s `parsaLoggRader` exkluderar en rad som
// inte går att tolka (ogiltig JSON eller schema-brott) och bokför den i
// `fel` — CLI:t skriver ut antalet till stderr och fortsätter med resten
// (AC #3: loggytan ska vara läsbar/summerbar utan specialverktyg, och en
// enda korrupt rad ska inte göra hela historiken oläsbar).
//
// ═══ EXIT-KODER ═══
// 0 — OK (även vid saknad fil, tom fil, eller enstaka trasiga rader).
// 2 — felaktig CLI-användning (okänt argument, `--fil` utan värde).

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  METRIK_LOGG_FIL,
  parsaLoggRader,
  renderaSummeringMarkdown,
  summera,
} from './lib/review-metrics.mjs';

const EXIT_OK = 0;
const EXIT_CLI = 2;

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function parseArgv(argv) {
  const ut = { fil: null, json: false, fel: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') {
      ut.json = true;
    } else if (arg === '--fil') {
      i += 1;
      const v = argv[i];
      if (!v || v.startsWith('--')) {
        ut.fel = '--fil kräver en sökväg.';
        return ut;
      }
      ut.fil = v;
    } else {
      ut.fel = `okänt argument: ${arg}`;
      return ut;
    }
  }
  return ut;
}

function main(argv) {
  const args = parseArgv(argv);
  if (args.fel) {
    console.error(`FEL: ${args.fel}`);
    console.error('Användning: node scripts/review-metrics.mjs [--json] [--fil <path>]');
    return EXIT_CLI;
  }

  const filPath = args.fil ?? resolve(REPO, METRIK_LOGG_FIL);
  const loggFilVisad = args.fil ?? METRIK_LOGG_FIL;

  const text = existsSync(filPath) ? readFileSync(filPath, 'utf8') : '';
  const { rader, fel } = parsaLoggRader(text);

  if (fel.length > 0) {
    console.error(`VARNING: ${fel.length} rad(er) i ${filPath} kunde inte tolkas och exkluderas:`);
    for (const f of fel) console.error(`  - rad ${f.radnummer}: ${f.meddelande}`);
  }

  const sammanfattning = summera(rader);
  const tidsstampel = new Date().toISOString();

  if (args.json) {
    console.log(
      JSON.stringify(
        { loggFil: loggFilVisad, tidsstampel, felAntal: fel.length, sammanfattning },
        null,
        2,
      ),
    );
  } else {
    console.log(
      renderaSummeringMarkdown(sammanfattning, {
        loggFil: loggFilVisad,
        tidsstampel,
        felAntal: fel.length,
      }),
    );
  }

  return EXIT_OK;
}

if (import.meta.main) {
  process.exit(main(process.argv.slice(2)));
}
