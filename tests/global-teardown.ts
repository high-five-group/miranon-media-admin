// ADR-061 Pelare 3 (T29) — error-context klartext-cred-purge.
//
// Playwrights `error-context.md` (genereras vid testfail) innehåller en
// page-snapshot där input-värden listas per textbox — ÄVEN för `type=password`
// (som har AX-rollen textbox). Vid ett login-fail hamnar därför lösenordet i
// KLARTEXT i artefakten (T29). Appens a11y är korrekt (fältet ÄR type=password,
// login.tsx) — läckan sitter enbart i test-artefakten.
//
// Denna globalTeardown körs EN gång efter hela testrunnet (lokalt + CI) och
// redigerar bort värdet på varje password-märkt textbox-rad i alla
// error-context.md. Diagnostiken bevaras (formstruktur, fel, källa intakt) —
// endast det känsliga värdet ersätts. Påverkar INTE testbeteende eller
// produktions-UX; ren artefakt-efterbearbetning (minst invasiva T29-fixen).

import type { Dirent } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { HERMETIK_RAPPORT_FIL } from './e2e/support/hermetik-rapport-fil';

const OUTPUT_DIR = 'test-results';
const REDACTION = '<REDACTED (ADR-061 Pelare 3 / T29)>';

// Matchar en aria-snapshot-rad där den tillgängliga namnet innehåller
// "lösenord" eller "password" (case-insensitivt) följt av `: <värde>`.
// Redigerar bort värdet, behåller rad-strukturen (roll + namn + ref).
// Ex: `- textbox "Lösenord" [ref=e11]: hemligt`  →  `- textbox "Lösenord" [ref=e11]: <REDACTED…>`
const PASSWORD_LINE = /^(\s*-\s+\w+ "[^"]*(?:lösenord|password)[^"]*"(?: \[[^\]]+\])*: ).+$/gim;

async function* walk(dir: string): AsyncGenerator<string> {
  let entries: Dirent<string>[];
  try {
    entries = await readdir(dir, { withFileTypes: true, encoding: 'utf-8' });
  } catch {
    return; // test-results saknas (inga fails) → inget att purga.
  }
  for (const entry of entries) {
    // @types/node ger Dirent<Buffer> för withFileTypes här → normalisera namnet.
    const name = entry.name.toString();
    const full = join(dir, name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (name === 'error-context.md') {
      yield full;
    }
  }
}

/**
 * Hermetik-rapporten (S91, mätningens steg 1) — sammanställs hit och skrivs till
 * stdout, så utfallet hamnar direkt i CI-loggen utan artefakt-hantering.
 * No-op när mätläget inte körts och filen alltså saknas.
 *
 * Läser JSONL:en som `tests/e2e/support/test-bas.ts` skrivit under körningen.
 * Källa: docs/research/staging-svitens-tidsbudget-2026-07-26.md § 5 steg 1.
 */
const RAPPORT_FIL = HERMETIK_RAPPORT_FIL;

interface Restanrop {
  fil: string;
  test: string;
  host: string;
  metod: string;
  sokvag: string;
}

async function rapporteraHermetik(): Promise<void> {
  let rader: string;
  try {
    rader = (await readFile(RAPPORT_FIL)).toString('utf-8');
  } catch {
    return; // Mätläget kördes inte — inget att rapportera.
  }

  const anrop: Restanrop[] = rader
    .split('\n')
    .filter((rad) => rad.trim() !== '')
    .flatMap((rad) => {
      try {
        return [JSON.parse(rad) as Restanrop];
      } catch {
        return [];
      }
    });

  const perFil = new Map<string, Map<string, number>>();
  for (const a of anrop) {
    const nyckel = `${a.host}${a.sokvag}`;
    const fil = perFil.get(a.fil) ?? new Map<string, number>();
    fil.set(nyckel, (fil.get(nyckel) ?? 0) + 1);
    perFil.set(a.fil, fil);
  }

  const ut: string[] = [
    '',
    '═══ HERMETIK-RAPPORT (S91 steg 1) ═══',
    `Restanrop som slank förbi testernas egna mockar: ${anrop.length} st`,
    `Filer med restanrop: ${perFil.size}`,
    '',
  ];

  for (const [fil, mal] of [...perFil.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const summa = [...mal.values()].reduce((s, n) => s + n, 0);
    ut.push(`  ${fil} — ${summa} anrop`);
    for (const [nyckel, antal] of [...mal.entries()].sort((a, b) => b[1] - a[1])) {
      ut.push(`      ${antal.toString().padStart(4)} × ${nyckel}`);
    }
  }

  ut.push(
    '',
    'Filer UTAN restanrop är kandidater för det mutexfria jobbet (steg 2).',
    'En fil saknas här enbart om den aldrig lät ett anrop nå nätverket.',
    '═══════════════════════════════════',
    '',
  );

  process.stdout.write(`${ut.join('\n')}\n`);
}

export default async function globalTeardown(): Promise<void> {
  for await (const file of walk(OUTPUT_DIR)) {
    const content = (await readFile(file)).toString('utf-8');
    const purged = content.replace(PASSWORD_LINE, `$1${REDACTION}`);
    if (purged !== content) {
      await writeFile(file, purged);
    }
  }
  await rapporteraHermetik();
}
