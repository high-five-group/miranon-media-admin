#!/usr/bin/env node
// scripts/uppdatera-review-sektion.mjs — CLI: läser review-agentens JSON-
// utlåtande, validerar det, och skriver/uppdaterar den fasta Riskbedömnings-
// sektionen i PR-kroppen (TASK-173.3, ADR-105 beslut 5/6/7).
//
// ═══ ANVÄNDNING ═══
//   node scripts/uppdatera-review-sektion.mjs <utlatande.json>
//   node scripts/uppdatera-review-sektion.mjs <utlatande.json> --dry-run
//   node scripts/uppdatera-review-sektion.mjs <utlatande.json> --kropp-fil <path>
//   npm run review:sektion -- <utlatande.json>
//
// PR-numret hämtas ur utlåtandets EGNA `prNummer`-fält (schemat kräver det)
// — ingen separat --pr-flagga, så anropet aldrig kan peka mot en ANNAN PR än
// den utlåtandet faktiskt granskade.
//
// --dry-run: beräknar den nya kroppen och skriver den till stdout — ingen
// `gh pr edit` körs. Använd för att förhandsgranska innan skarp skrivning.
//
// --kropp-fil <path>: läser NUVARANDE kropp ur en lokal fil i stället för
// `gh pr view` (offline/test-läge, samma disciplin som --filer i
// scripts/hamta-review-policy.mjs). Detta läge skriver ALDRIG mot `gh` —
// den beräknade kroppen skrivs till stdout, exakt som --dry-run. En
// explicit lokal källa är alltid avsedd för förhandsgranskning/test, aldrig
// för en skarp gh-skrivning mot fel PR.
//
// ═══ EXIT-KODER ═══
// 0 — OK: sektionen skrevs (eller, med --dry-run/--kropp-fil, beräknades och
//     skrevs ENDAST till stdout).
// 1 — MALFORMAT utlåtande: filen är inte giltig JSON, eller validerar inte
//     mot scripts/lib/review-utlatande.mjs:s schema. Ingen tyst tom eller
//     partiell sektion skrivs (AC #3) — avbryter FÖRE någon gh-anrop görs.
// 2 — felaktig CLI-användning.
// 3 — kunde inte HÄMTA eller SKRIVA PR-kroppen via `gh` (nätverk, auth, fel
//     PR-nummer) — eller kunde inte läsa en angiven --kropp-fil. Utlåtandet
//     var giltigt; det är I/O:t som fallerade.
// 4 — PR-kroppen bär en KORRUPT markörsituation (se
//     scripts/lib/review-risk-sektion.mjs § Fail-closed) — vägrar gissa,
//     städa kroppen manuellt och kör om.

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { uppdateraPrKropp } from './lib/review-risk-sektion.mjs';
import { valideraUtlatande } from './lib/review-utlatande.mjs';

const EXIT_OK = 0;
const EXIT_MALFORMAT = 1;
const EXIT_CLI = 2;
const EXIT_GH_FEL = 3;
const EXIT_KORRUPT_MARKOR = 4;

/**
 * Hämtar PR-kroppen via `gh pr view` — läser alltid GitHubs faktiska
 * tillstånd, aldrig en lokal gissning (samma tillitsmodell som
 * `hamtaPrFiler()` i scripts/hamta-review-policy.mjs).
 *
 * @param {number} prNummer
 * @returns {{ok: true, kropp: string, fel: null} | {ok: false, kropp: null, fel: string}}
 */
export function hamtaPrKropp(prNummer) {
  const res = spawnSync('gh', ['pr', 'view', String(prNummer), '--json', 'body', '--jq', '.body'], {
    encoding: 'utf8',
  });
  if (res.status !== 0) {
    return {
      ok: false,
      kropp: null,
      fel: (res.stderr ?? '').trim() || `gh gav exit ${res.status}`,
    };
  }
  return { ok: true, kropp: res.stdout ?? '', fel: null };
}

/**
 * Skriver den nya kroppen via `gh pr edit --body-file -` (stdin) — undviker
 * shell-escaping av godtycklig markdown/kod i sektionen.
 *
 * @param {number} prNummer
 * @param {string} nyKropp
 * @returns {{ok: true, fel: null} | {ok: false, fel: string}}
 */
export function skrivPrKropp(prNummer, nyKropp) {
  const res = spawnSync('gh', ['pr', 'edit', String(prNummer), '--body-file', '-'], {
    input: nyKropp,
    encoding: 'utf8',
  });
  if (res.status !== 0) {
    return { ok: false, fel: (res.stderr ?? '').trim() || `gh gav exit ${res.status}` };
  }
  return { ok: true, fel: null };
}

function parseArgv(argv) {
  const ut = { path: null, dryRun: false, kroppFil: null, fel: null };
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      ut.dryRun = true;
    } else if (arg === '--kropp-fil') {
      i += 1;
      const v = argv[i];
      if (!v) {
        ut.fel = '--kropp-fil kräver en sökväg.';
        return ut;
      }
      ut.kroppFil = v;
    } else if (arg.startsWith('--')) {
      ut.fel = `okänt argument: ${arg}`;
      return ut;
    } else {
      rest.push(arg);
    }
  }
  if (rest.length !== 1) {
    ut.fel = 'ange exakt en sökväg till utlåtandets JSON-fil.';
    return ut;
  }
  ut.path = rest[0];
  return ut;
}

function main(argv) {
  const args = parseArgv(argv);
  if (args.fel) {
    console.error(`FEL: ${args.fel}`);
    console.error(
      'Användning: node scripts/uppdatera-review-sektion.mjs <utlatande.json> [--dry-run] [--kropp-fil <path>]',
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

  const { ok, data, errors } = valideraUtlatande(raw);
  if (!ok) {
    console.error(
      `FEL: utlåtandet i ${args.path} validerar INTE mot schemat (${errors.length} fel) — ` +
        'ingen sektion skrivs (AC #3):',
    );
    for (const message of errors) console.error(`  - ${message}`);
    return EXIT_MALFORMAT;
  }

  let nuvarandeKropp;
  if (args.kroppFil) {
    try {
      nuvarandeKropp = readFileSync(args.kroppFil, 'utf8');
    } catch (error) {
      console.error(`FEL: kunde inte läsa --kropp-fil ${args.kroppFil}: ${error.message}`);
      return EXIT_GH_FEL;
    }
  } else {
    const hamtat = hamtaPrKropp(data.prNummer);
    if (!hamtat.ok) {
      console.error(`FEL: kunde inte hämta PR-kroppen för #${data.prNummer} via gh: ${hamtat.fel}`);
      return EXIT_GH_FEL;
    }
    nuvarandeKropp = hamtat.kropp;
  }

  const resultat = uppdateraPrKropp(nuvarandeKropp, data);
  if (!resultat.ok) {
    console.error(`FEL: ${resultat.fel}`);
    return EXIT_KORRUPT_MARKOR;
  }

  if (args.dryRun || args.kroppFil) {
    console.log(resultat.kropp);
    const skal = args.dryRun ? '--dry-run' : '--kropp-fil';
    console.error(
      `(${skal}: kroppen beräknad (${resultat.agerande}) och skriven till stdout — INGEN gh-skrivning gjord)`,
    );
    return EXIT_OK;
  }

  const skrivet = skrivPrKropp(data.prNummer, resultat.kropp);
  if (!skrivet.ok) {
    console.error(`FEL: kunde inte skriva PR-kroppen för #${data.prNummer} via gh: ${skrivet.fel}`);
    return EXIT_GH_FEL;
  }

  console.log(`OK: Riskbedömnings-sektionen ${resultat.agerande} i PR #${data.prNummer}.`);
  return EXIT_OK;
}

if (import.meta.main) {
  process.exit(main(process.argv.slice(2)));
}
