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
// 4 — PLATTFORMS-ANTAGANDET BRUTET: merge_group-refen har en form vi inte
//     känner igen, så PR-numret går inte att härleda. Detta är INTE ett
//     användarfel (därav inte 2) och inte ett I/O-fel (därav inte 3) — det
//     betyder att GitHub ändrat kö-grenens namngivning, och då är HELA
//     grindens PR-uppslag ogiltigt tills formen mätts om. Fail-closed: varje
//     landning blockeras hellre än att en enda PR släpps igenom ogranskad.
//     Åtgärden är att mäta den nya formen (`gh run list --workflow ci.yml
//     --event merge_group`) och uppdatera `parsaMergeGroupRef`.

import { spawnSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parsaMergeGroupRef, provaPrKropp } from './lib/review-backstopp.mjs';

const EXIT_OK = 0;
const EXIT_FALLER = 1;
const EXIT_CLI = 2;
const EXIT_GH_FEL = 3;
const EXIT_PLATTFORM = 4;

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
      // FAIL-CLOSED, och med EGEN exitkod (runda 2-fynd I1, PR #2049): en
      // okänd ref-form får aldrig tolkas som "ingen PR att pröva", men den är
      // heller inte ett anropsfel — den betyder att plattformens namngivning
      // av kö-grenen ändrats under oss. Se exit-kod-tabellen i filhuvudet.
      process.stderr.write(`❌ ${parsad.fel}\n`);
      process.stderr.write(
        '   Detta är ett BRUTET PLATTFORMS-ANTAGANDE, inte ett anropsfel: mät om ' +
          'kö-grenens form (`gh run list --workflow ci.yml --event merge_group`) ' +
          'och uppdatera parsaMergeGroupRef.\n',
      );
      return EXIT_PLATTFORM;
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

// ═══ ENTRYPOINT-VAKTEN — TVÅ MÄTTA FAIL-OPEN-LÄGEN STÄNGDA ═══
// Misslyckas jämförelsen körs `main()` ALDRIG, och processen avslutas med
// exit 0 och NOLL byte utdata. För just DENNA fil är det den värsta tänkbara
// defekten: en saknad Riskbedömnings-sektion ser då ut som "grinden släppte
// igenom". Båda lägena nedan är reproducerade 2026-08-28 (runda 2-fynd W1,
// PR #2049), inte befarade:
//
//   1. `file://${process.argv[1]}` (formen denna fil bar först) är ingen
//      giltig URL-konstruktion — mellanslag och icke-ASCII procent-kodas i
//      `import.meta.url` men inte i mallsträngen. Mätt i en katalog med
//      mellanslag och åäö: exit 0, noll byte, på en kropp UTAN sektion.
//   2. `pathToFileURL(process.argv[1])` ensamt (repots form i 14 av 17
//      CLI-skript) räcker inte heller när sökvägen går genom en SYMLÄNK:
//      Node löser modulens egen sökväg med realpath, medan `argv[1]` bär
//      vägen som den skrevs. På macOS är `os.tmpdir()` exakt ett sådant fall
//      (`/var/folders/…` → `/private/var/folders/…`) — mätt när
//      regressionstestet nedan först skrevs.
//
// Därför realpath:as BÅDA sidor. Detta AVVIKER medvetet från repots 14 andra
// skript; för dem är läget kosmetiskt (ett verktyg som inte startar märks
// direkt), för en fail-closed grind är det en säkerhetsegenskap. `realpathSync`
// kastar om sökvägen inte finns — då är detta ändå inte en direktkörning.
let arKord = false;
try {
  arKord =
    Boolean(process.argv[1]) &&
    import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
} catch {
  arKord = false;
}
if (arKord) {
  process.exit(main(process.argv.slice(2)));
}
