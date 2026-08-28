#!/usr/bin/env node
// scripts/review-backstopp.mjs — CI-backstoppen: fäller en landning vars PR
// inte bär ett giltigt granskningsutlåtande (TASK-173.4, ADR-105 beslut 2/3).
//
// ═══ ANVÄNDNING ═══
//   node scripts/review-backstopp.mjs --merge-group-ref "$MG_REF"   # CI (merge_group)
//   node scripts/review-backstopp.mjs --pr <nr>                     # preflight före armering
//   npm run review:backstopp -- --pr <nr>
//   node scripts/review-backstopp.mjs --pr <nr> --head-sha <sha> --kropp-fil <path>   # offline
//   … --json                                                        # maskinläsbart
//
// ═══ VARFÖR GRINDEN SITTER PÅ `merge_group`-YTAN, INTE PÅ PR-YTAN ═══
// Review-grindens sekvens är: bygg-agenten PUSHAR → orkestreraren spawnar
// granskaren → sektionen skrivs → PR:en armeras (CLAUDE.md § Review-grinden,
// ADR-105 beslut 2). Vid PUSH-tillfället SAKNAS sektionen med nödvändighet —
// granskningen har inte hänt än. En grind på PR-ytan hade därför gjort VARJE
// kod-PR röd som normaltillstånd, vilket bryter mot CONTRIBUTING.md
// § Rött-först: *"rött i CI ska betyda EN sak: oväntad regression"*.
//
// På `merge_group`-ytan är läget det motsatta: PR:en är armerad och står i
// kön, alltså MÅSTE granskningen redan ha skett. Rött där betyder exakt en
// sak — någon armerade en PR utan giltigt utlåtande — och det ÄR en oväntad
// regression. Grinden fäller alltså i landnings-ögonblicket, via samma
// required check (`CI Passed or Skipped`) som allt annat.
//
// PRISET, öppet: en fällning sparkar posten ur kön och KONSUMERAR armeringen
// (CLAUDE.md § Landning, fjärde läget). Därför finns `--pr`-läget: kör det
// som preflight FÖRE `gh pr merge --auto`, så betalas kostnaden aldrig i
// normaldrift.
//
// ═══ EN PR PER merge_group-EVENT — OCH VARFÖR DET RÄCKER ═══
// Kö-grenen namnger EN PR (`pr-<nr>-<bas-sha>`), medan en merge group kan
// innehålla upp till `max_entries_to_merge` (3, mätt i rulesetet
// `main-skydd` 2026-08-28) poster. Att bara pröva den namngivna PR:en är
// ändå fullständigt SÅ LÄNGE `grouping_strategy` är `ALLGREEN`: varje
// köad post bygger sin EGEN spekulativa grupp (verifierat mot 30 skarpa
// merge_group-körningar — samtliga namngav exakt en PR, med kedjade
// bas-SHA:n) och ALLGREEN kräver att varje sådan grupp är grön innan något
// mergas. Byts strategin till `HEADGREEN` faller det argumentet, och denna
// grind måste då räkna upp gruppens alla PR:er. Skriv aldrig om denna rad
// utan att först mäta rulesetet.
//
// ═══ EXIT-KODER ═══
// 0 — GRINDEN SLÄPPER: PR:en bär en välformad, färsk Riskbedömnings-sektion.
// 1 — GRINDEN FÄLLER: sektionen saknas, är korrupt, pekar på fel PR, eller
//     granskade en tidigare commit (STALE).
// 2 — felaktig CLI-användning.
// 3 — kunde inte HÄMTA PR:ens tillstånd via `gh` (nätverk, auth, fel nummer)
//     eller läsa en angiven --kropp-fil. Fail-closed i CI: jobbet blir rött —
//     men skälet är I/O, inte ett saknat utlåtande, och loggen säger vilket.

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parsaMergeGroupRef, provaPrKropp } from './lib/review-backstopp.mjs';

const EXIT_OK = 0;
const EXIT_FALLER = 1;
const EXIT_CLI = 2;
const EXIT_GH_FEL = 3;

/**
 * Hämtar PR:ens kropp och head-SHA via `gh pr view` — GitHubs faktiska
 * tillstånd, aldrig en lokal gissning (samma tillitsmodell som
 * `hamtaPrKropp()` i scripts/uppdatera-review-sektion.mjs).
 *
 * @param {number} prNummer
 * @returns {{ok: true, kropp: string, headSha: string, fel: null}
 *        | {ok: false, kropp: null, headSha: null, fel: string}}
 */
export function hamtaPrTillstand(prNummer) {
  const res = spawnSync('gh', ['pr', 'view', String(prNummer), '--json', 'body,headRefOid'], {
    encoding: 'utf8',
  });
  if (res.status !== 0) {
    return {
      ok: false,
      kropp: null,
      headSha: null,
      fel: (res.stderr ?? '').trim() || `gh gav exit ${res.status}`,
    };
  }
  let data;
  try {
    data = JSON.parse(res.stdout ?? '');
  } catch (err) {
    return { ok: false, kropp: null, headSha: null, fel: `Kunde inte tolka gh-svaret: ${err}` };
  }
  if (typeof data?.headRefOid !== 'string' || data.headRefOid.length === 0) {
    return { ok: false, kropp: null, headSha: null, fel: 'gh-svaret saknade headRefOid.' };
  }
  return { ok: true, kropp: data.body ?? '', headSha: data.headRefOid, fel: null };
}

function anvandning(skal) {
  process.stderr.write(`${skal}\n\nAnvändning:\n`);
  process.stderr.write('  node scripts/review-backstopp.mjs --merge-group-ref <ref>\n');
  process.stderr.write('  node scripts/review-backstopp.mjs --pr <nr>\n');
  process.stderr.write(
    '  node scripts/review-backstopp.mjs --pr <nr> --head-sha <sha> --kropp-fil <path>\n',
  );
  process.stderr.write('  (lägg till --json för maskinläsbar utdata)\n');
  return EXIT_CLI;
}

/** @param {string[]} argv */
export function main(argv) {
  const flaggor = new Map();
  let json = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') {
      json = true;
      continue;
    }
    if (!arg.startsWith('--')) return anvandning(`Okänt argument: ${arg}`);
    const varde = argv[i + 1];
    if (varde === undefined || varde.startsWith('--')) {
      return anvandning(`Flaggan ${arg} kräver ett värde.`);
    }
    flaggor.set(arg, varde);
    i += 1;
  }

  const mgRef = flaggor.get('--merge-group-ref');
  let prNummer = null;

  if (mgRef !== undefined) {
    if (flaggor.has('--pr')) {
      return anvandning('--merge-group-ref och --pr utesluter varandra.');
    }
    const parsad = parsaMergeGroupRef(mgRef);
    if (!parsad.ok) {
      // FAIL-CLOSED: en okänd ref-form får aldrig tolkas som "ingen PR att
      // pröva". Se lib:ens § parsaMergeGroupRef.
      process.stderr.write(`❌ ${parsad.fel}\n`);
      return EXIT_CLI;
    }
    prNummer = parsad.prNummer;
  } else if (flaggor.has('--pr')) {
    prNummer = Number(flaggor.get('--pr'));
    if (!Number.isInteger(prNummer) || prNummer <= 0) {
      return anvandning(`--pr måste vara ett positivt heltal (fick '${flaggor.get('--pr')}').`);
    }
  } else {
    return anvandning('Ange --merge-group-ref <ref> ELLER --pr <nr>.');
  }

  const kroppFil = flaggor.get('--kropp-fil');
  const headShaFlagga = flaggor.get('--head-sha');
  let kropp;
  let headSha;

  if (kroppFil !== undefined) {
    if (headShaFlagga === undefined) {
      return anvandning('--kropp-fil kräver --head-sha (offline-läget hämtar inget via gh).');
    }
    try {
      kropp = readFileSync(kroppFil, 'utf8');
    } catch (err) {
      process.stderr.write(`❌ Kunde inte läsa --kropp-fil '${kroppFil}': ${err}\n`);
      return EXIT_GH_FEL;
    }
    headSha = headShaFlagga;
  } else {
    if (headShaFlagga !== undefined) {
      return anvandning('--head-sha är endast giltig tillsammans med --kropp-fil.');
    }
    const hamtad = hamtaPrTillstand(prNummer);
    if (!hamtad.ok) {
      process.stderr.write(`❌ Kunde inte hämta PR #${prNummer} via gh: ${hamtad.fel}\n`);
      return EXIT_GH_FEL;
    }
    kropp = hamtad.kropp;
    headSha = hamtad.headSha;
  }

  const verdikt = provaPrKropp({ kropp, prNummer, headSha });

  if (json) {
    process.stdout.write(`${JSON.stringify({ prNummer, headSha, ...verdikt }, null, 2)}\n`);
  } else if (verdikt.ok) {
    process.stdout.write(`✅ Review-backstopp: PR #${prNummer} — ${verdikt.skal}\n`);
    process.stdout.write(
      `   Nivå: ${verdikt.sektion.niva} · runda ${verdikt.sektion.runda} · ` +
        `schemaVersion ${verdikt.sektion.schemaVersion}\n`,
    );
  } else {
    process.stdout.write(`❌ Review-backstopp FÄLLER PR #${prNummer} [${verdikt.kod}]\n`);
    process.stdout.write(`   ${verdikt.skal}\n`);
    process.stdout.write(`   Åtgärd: ${verdikt.atgard}\n`);
    process.stdout.write(
      '   Detta är INTE ett skäl att armera om — armering utan granskning ger samma fällning igen.\n',
    );
  }

  return verdikt.ok ? EXIT_OK : EXIT_FALLER;
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main(process.argv.slice(2)));
}
