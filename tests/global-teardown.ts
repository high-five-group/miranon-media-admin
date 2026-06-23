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

export default async function globalTeardown(): Promise<void> {
  for await (const file of walk(OUTPUT_DIR)) {
    const content = (await readFile(file)).toString('utf-8');
    const purged = content.replace(PASSWORD_LINE, `$1${REDACTION}`);
    if (purged !== content) {
      await writeFile(file, purged);
    }
  }
}
