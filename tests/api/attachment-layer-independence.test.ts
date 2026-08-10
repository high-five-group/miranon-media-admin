// Bilage-lager-oberoendets mekaniska vakt — TASK-146.4 AC #2, DoD #6, ADR-057
// klausul a ("UI-lagret når datakällan ENDAST via DataSourceAdapter... aldrig
// via direkt-import av en konkret adapter... eller av en Edge-Function-
// klient") + klausul c (full port-paritet).
//
// KÄLLKODS-NIVÅ, INTE RUNTIME: samma motivering som ef-metod-vakt.test.ts —
// ordnings-/gränsegenskaper ("rör aldrig lagrings-API:t utanför data-lagret")
// är mest träffsäkert observerade i KÄLLAN, körs utan creds i api-pure och
// fäller i review innan en regression hinner deployas.
//
// VAD "LAGRINGS-API:T" BETYDER HÄR, PRECIST: Supabase STORAGE-ytan
// (`.storage.from(...)`, `createSignedUploadUrl`, `uploadToSignedUrl`, rå
// `/storage/v1/object`-paths) — INTE hela `@supabase/supabase-js`-importen.
// SDK:n importeras legitimt utanför src/data/ redan idag för AUTH
// (`src/auth/AuthProvider.tsx`, `src/lib/auth/passkey.ts`) — auth är en
// tvärgående plattformsangelägenhet, inte "datakällan" i ADR-057:s mening.
// Ett grep mot hela SDK-importen skulle falsklarma på dessa två filer; grepet
// är därför medvetet SMALT mot storage-ytan.
//
// TVÅ BEVIS I VARDERA RIKTNING (uppdragets krav — "att den fäller när den
// ska, inte bara att den är grön"):
//   1. En KONSTRUERAD sträng (aldrig en riktig fil) bevisar att
//      `containsStorageApiCall` själv diskriminerar rätt/fel.
//   2. En KONSTRUERAD temp-fil (skapad i denna testkörning, aldrig i src/)
//      bevisar att `walkTsFiles` + scan-slingan tillsammans faktiskt
//      DETEKTERAR en överträdelse i en verklig fil på disk — inte bara att
//      hjälpfunktionen i isolering gör det.
//
// Ingen mutation av verklig källkod krävs för något av bevisen — grinden
// prövas mot konstruerat material, aldrig mot en temporärt trasig kopia av
// riktiga filer (som skulle riskera att lämnas trasig vid ett avbrott).

import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC_DIR = path.join(REPO_ROOT, 'src');
const DATA_LAYER_DIR = path.join(SRC_DIR, 'data');
const ADAPTERS_DIR = path.join(DATA_LAYER_DIR, 'adapters');

// Smalt mot Supabase STORAGE-ytan specifikt — se filhuvudet § VAD
// "LAGRINGS-API:T" BETYDER HÄR.
const STORAGE_API_PATTERNS: RegExp[] = [
  /\.storage\.from\(/,
  /createSignedUploadUrl/,
  /uploadToSignedUrl/,
  /storage\/v1\/object/,
];

function containsStorageApiCall(source: string): boolean {
  return STORAGE_API_PATTERNS.some((re) => re.test(source));
}

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkTsFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      out.push(full);
    }
  }
  return out;
}

test.describe('Bilage-lager-oberoendet (TASK-146.4 AC #2, ADR-057 klausul a)', () => {
  test('detektorn fäller på en KONSTRUERAD överträdelse (självtest, ingen riktig fil)', () => {
    const violating = [
      "import { createClient } from '@supabase/supabase-js';",
      "const supabase = createClient('url', 'key');",
      "await supabase.storage.from('bilagor').upload(path, bytes);",
    ].join('\n');
    expect(containsStorageApiCall(violating)).toBe(true);

    const violatingViaTicket = 'const t = await x.createSignedUploadUrl(path);';
    expect(containsStorageApiCall(violatingViaTicket)).toBe(true);

    const violatingViaUpload = 'await x.uploadToSignedUrl(path, token, file);';
    expect(containsStorageApiCall(violatingViaUpload)).toBe(true);
  });

  test('detektorn släpper igenom oskyldig text (negativ kontroll)', () => {
    const clean = [
      "import { dataSource } from '@/router';",
      'await dataSource.uploadAttachment({ eventId, file });',
      '// omnämner "storage.from" bara i en helt annan kontext: storagelösning för möbler',
    ].join('\n');
    expect(containsStorageApiCall(clean)).toBe(false);
  });

  test('detektorn fäller på en KONSTRUERAD temp-fil på disk (bevisar hela walk+scan-kedjan)', () => {
    const tmpDir = mkdtempSync(path.join(tmpdir(), 'attachment-layer-vakt-'));
    try {
      writeFileSync(
        path.join(tmpDir, 'FejkKomponent.tsx'),
        "export function Fejk() { return null; } // await x.storage.from('bilagor').upload();",
      );
      const files = walkTsFiles(tmpDir);
      expect(files.length).toBe(1);
      const violations = files.filter((f) => containsStorageApiCall(readFileSync(f, 'utf8')));
      expect(violations.length).toBe(1);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('UI-lagret (src/, exklusive src/data/) rör noll gånger lagrings-API:t direkt', () => {
    const allFiles = walkTsFiles(SRC_DIR);
    const uiFiles = allFiles.filter((f) => !f.startsWith(`${DATA_LAYER_DIR}${path.sep}`));

    // FAIL-CLOSED (samma disciplin som ef-metod-vakt.test.ts § allowlisten är
    // läst och icke-tom): en tom fil-lista gör grinden tyst grön av fel skäl.
    expect(uiFiles.length).toBeGreaterThan(50);

    const violations = uiFiles
      .filter((f) => containsStorageApiCall(readFileSync(f, 'utf8')))
      .map((f) => path.relative(REPO_ROOT, f));

    expect(
      violations,
      `Filer utanför src/data/ som rör Supabase Storage-API:t direkt (ADR-057 ` +
        `klausul a-brott): ${violations.join(', ') || '(inga funna — assertionen ovan borde ha varit tom-array)'}`,
    ).toEqual([]);
  });

  test('DataSourceAdapter deklarerar uploadAttachment (AC #1)', () => {
    const source = readFileSync(path.join(ADAPTERS_DIR, 'DataSourceAdapter.ts'), 'utf8');
    expect(source).toContain('uploadAttachment(input: UploadAttachmentInput): Promise<Attachment>');
  });

  test('BÅDA adaptrarna deklarerar uploadAttachment — port-paritet (AC #1)', () => {
    // Källkods-grep är DEFENSE-IN-DEPTH ovanpå TypeScripts egna `implements
    // DataSourceAdapter`-tvång (npm run typecheck fäller redan om endera
    // adaptern saknar en kontrakts-metod — se slutrapportens § grindar för
    // det faktiska bevis-i-båda-riktningar-provet mot TSC).
    const airtable = readFileSync(path.join(ADAPTERS_DIR, 'AirtableAdapter.ts'), 'utf8');
    const supabaseAdapter = readFileSync(path.join(ADAPTERS_DIR, 'SupabaseAdapter.ts'), 'utf8');

    expect(airtable).toContain(
      'async uploadAttachment(input: UploadAttachmentInput): Promise<Attachment>',
    );
    expect(supabaseAdapter).toContain(
      'async uploadAttachment(_input: UploadAttachmentInput): Promise<Attachment>',
    );
  });

  test('AirtableAdapter är den ENDA UI-nåbara filen som rör lagrings-API:t (dokumenterar var undantaget bor)', () => {
    const source = readFileSync(path.join(ADAPTERS_DIR, 'AirtableAdapter.ts'), 'utf8');
    expect(containsStorageApiCall(source)).toBe(true);
  });
});
