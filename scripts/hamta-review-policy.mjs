#!/usr/bin/env node
// scripts/hamta-review-policy.mjs — hämtar de path-scopade granskningsregler
// som gäller en given PR, lästa ENDAST ur main (TASK-173.2, ADR-105 beslut 7).
//
// ═══ ANVÄNDNING ═══
//   node scripts/hamta-review-policy.mjs --pr 1234            # text för prompt-injektion
//   node scripts/hamta-review-policy.mjs --pr 1234 --json     # maskinläsbart
//   node scripts/hamta-review-policy.mjs --filer a.ts,b.css   # explicit fil-lista (offline)
//   npm run review:policy -- --pr 1234
//
// Exit 0  — OK (noll matchande regler är också OK; det står i utdatan).
// Exit 2  — felaktig CLI-användning (inget/motstridigt argument).
// Exit 64 — POLICYFEL: filen kan inte läsas ur trusted-refen, är inte giltig
//           JSON, eller validerar inte mot schemat. Fail-closed — granskningen
//           ska stanna, ALDRIG köras med en tyst halverad regelmängd.
// Exit 65 — kan inte fastställa PR:ens ändrade filer (gh saknas, fel PR-nummer,
//           ingen auth). Också fail-closed: utan fil-lista finns ingen
//           matchning att lita på.
//
// ═══ VARFÖR DET INTE FINNS NÅGON `--ref`-FLAGGA ═══
// Trusted-refen är hårdkodad till `origin/main` (TRUSTED_REF nedan). En
// CLI-flagga för att byta källa hade gjort AC #1 till en konvention i stället
// för en egenskap: den som kör granskningen hade kunnat peka den mot PR-grenens
// egen version av reglerna. Testsviten behöver ändå en annan källa, och når
// den via `lasPolicyUrRef(repoPath, ref)` som IMPORTERAS direkt — inte via en
// flagga som finns kvar i den skarpa vägen. Samma disciplin som
// scripts/fas4-prod-deploy.sh: en bekväm konfig-väg hade gjort låset
// verkningslöst (CLAUDE.md § Prod-EF-deploy).
//
// ═══ VARFÖR `git show` OCH INTE readFileSync ═══
// `git show origin/main:.review-policy.json` läser ur objektdatabasen och rör
// aldrig arbetsträdet — resultatet är detsamma oavsett vilken gren som råkar
// vara utcheckad, och oavsett om anroparen står i huvudkatalogen eller i en
// worktree. En `readFileSync` hade läst PR-grenens egen version när skriptet
// körs från en utcheckad PR-gren, vilket är precis den manipulation AC #1
// stänger. Samma tillitsmodell som GitHubs CODEOWNERS: "pull requests use the
// version of CODEOWNERS from the base branch of the pull request"
// (docs.github.com, About code owners, verifierat 2026-08-26).
//
// FÄRSKHET ÄR ANROPARENS ANSVAR: skriptet kör medvetet INGEN `git fetch` (en
// mutation av delad state som review-agenten inte ska göra — den rör aldrig
// arbetsträdet). I stället skrivs den lästa SHA:n ut i varje utdata, så en
// inaktuell `origin/main` är synlig i efterhand i stället för tyst.

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { matchaRegler, POLICY_FIL, parsaPolicy, renderaRegler } from './lib/review-policy.mjs';

const EXIT_OK = 0;
const EXIT_CLI = 2;
const EXIT_POLICYFEL = 64;
const EXIT_INDATAFEL = 65;

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Den ENDA källan reglerna får läsas ur (ADR-105 beslut 7, AC #1). */
export const TRUSTED_REF = 'origin/main';

function korGit(repoPath, args) {
  const res = spawnSync('git', args, { cwd: repoPath, encoding: 'utf8' });
  return { status: res.status, stdout: res.stdout ?? '', stderr: res.stderr ?? '' };
}

/**
 * Läser och validerar policyn ur en git-ref. Gör ingen I/O mot arbetsträdet.
 *
 * Exporterad så testsviten kan peka den mot ett temporärt repo och bevisa
 * AC #1 i båda riktningar — den skarpa vägen anropar den alltid med
 * TRUSTED_REF.
 *
 * @param {string} repoPath
 * @param {string} [ref]
 * @returns {{ok: true, policy: object, sha: string, errors: []}
 *         | {ok: false, policy: null, sha: string|null, errors: string[]}}
 */
export function lasPolicyUrRef(repoPath, ref = TRUSTED_REF) {
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

  const visa = korGit(repoPath, ['show', `${ref}:${POLICY_FIL}`]);
  if (visa.status !== 0) {
    return {
      ok: false,
      policy: null,
      sha,
      errors: [
        `kunde inte läsa ${POLICY_FIL} ur '${ref}' (${sha}): ${visa.stderr.trim() || 'okänt git-fel'}`,
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
      errors: [`${POLICY_FIL} i '${ref}' (${sha}) är inte giltig JSON: ${error.message}`],
    };
  }

  const { ok, policy, errors } = parsaPolicy(raw);
  if (!ok) return { ok: false, policy: null, sha, errors };
  return { ok: true, policy, sha, errors: [] };
}

/**
 * Hämtar PR:ens ändrade filer via `gh`. Läser från GitHub, aldrig från en
 * lokal diff — huvudkatalogen kan ha en annan gren utcheckad, och en lokal
 * diff är då inte PR:ens faktiska innehåll (.claude/agents/review-agent.md
 * § Du rör aldrig arbetsträdet).
 *
 * @param {number} prNummer
 * @returns {{ok: true, filer: string[]} | {ok: false, fel: string}}
 */
export function hamtaPrFiler(prNummer) {
  const res = spawnSync(
    'gh',
    ['pr', 'view', String(prNummer), '--json', 'files', '--jq', '.files[].path'],
    { cwd: REPO, encoding: 'utf8' },
  );
  if (res.status !== 0) {
    return { ok: false, fel: (res.stderr ?? '').trim() || `gh gav exit ${res.status}` };
  }
  const filer = (res.stdout ?? '')
    .split('\n')
    .map((rad) => rad.trim())
    .filter(Boolean);
  return { ok: true, filer };
}

function parseArgv(argv) {
  const ut = { pr: null, filer: null, json: false, fel: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') {
      ut.json = true;
    } else if (arg === '--pr') {
      i += 1;
      const v = argv[i];
      if (!/^\d+$/.test(v ?? '')) {
        ut.fel = '--pr kräver ett positivt heltal (PR-nummer).';
        return ut;
      }
      ut.pr = Number(v);
    } else if (arg === '--filer') {
      i += 1;
      const v = argv[i];
      if (!v) {
        ut.fel = '--filer kräver en kommaseparerad lista med sökvägar.';
        return ut;
      }
      ut.filer = v
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);
    } else {
      ut.fel = `okänt argument: ${arg}`;
      return ut;
    }
  }
  if (ut.pr === null && ut.filer === null) {
    ut.fel = 'ange antingen --pr <nummer> eller --filer <a,b,c>.';
  } else if (ut.pr !== null && ut.filer !== null) {
    ut.fel = '--pr och --filer är ömsesidigt uteslutande.';
  }
  return ut;
}

function main(argv) {
  const args = parseArgv(argv);
  if (args.fel) {
    console.error(`FEL: ${args.fel}`);
    console.error(
      'Användning: node scripts/hamta-review-policy.mjs (--pr <nummer> | --filer <a,b,c>) [--json]',
    );
    return EXIT_CLI;
  }

  const policyResultat = lasPolicyUrRef(REPO);
  if (!policyResultat.ok) {
    console.error(`POLICYFEL: granskningsreglerna kunde inte läsas ur ${TRUSTED_REF} — avbryter.`);
    for (const rad of policyResultat.errors) console.error(`  - ${rad}`);
    console.error(
      'Granskningen ska STANNA här. En halverad regelmängd är farligare än ingen granskning:',
    );
    console.error('den ser ut som en fullständig granskning men saknar regler ingen ser saknas.');
    return EXIT_POLICYFEL;
  }

  let filer;
  if (args.filer !== null) {
    filer = args.filer;
  } else {
    const prFiler = hamtaPrFiler(args.pr);
    if (!prFiler.ok) {
      console.error(`FEL: kunde inte hämta ändrade filer för PR #${args.pr}: ${prFiler.fel}`);
      return EXIT_INDATAFEL;
    }
    filer = prFiler.filer;
  }

  const traffar = matchaRegler(filer, policyResultat.policy);

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          ref: TRUSTED_REF,
          policySha: policyResultat.sha,
          antalAndradeFiler: filer.length,
          policyRegler: traffar,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(renderaRegler(traffar, policyResultat.sha));
  }
  return EXIT_OK;
}

if (import.meta.main) {
  process.exit(main(process.argv.slice(2)));
}
