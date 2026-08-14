// Mutationens HEMVIST-vakt (TASK-201.15) — api-pure (källkods-nivå, ingen
// staging, inga creds, ingen browser).
//
// ROTORSAKEN grinden stänger: TASK-201.13:s mekaniska invariant ("varje
// exporterad mutationshook loggar", mätt 15/15) var MAPP-SCOPAD — den
// räknade exporterade hooks + recordActivity-anropsplatser under
// src/data/mutations/*.ts. En useMutation som ALDRIG flyttat dit är per
// konstruktion osynlig för den räkningen. Tre skrivande hooks
// (createEvent, sendEmail, saveSegment) bodde komponent-lokalt (S105 Del 9
// Explore-svepet) och undgick därför upptäckt — inte trots invarianten,
// utan för att invarianten strukturellt inte kunde se dem.
//
// KONTRAKTET: varje `useMutation`-anrop under src/ ska bo i
// src/data/mutations/*.ts — mutationskatalogens hemvist, den ENDA plats
// TASK-201.13:s invariant (och varje framtida sådan) kan se. Undantag är
// FILE-GRANULÄRA och config-drivna (repo-konventionen: grindvaktslogik är
// universell, värden lever i .<grindvakt>-policy.conf), aldrig hårdkodade
// här — se .mutation-hemvist-policy.conf för VILKA filer och VARFÖR.
//
// SAMMA KÄLLKODS-NIVÅ-MOTIVERING SOM SYSKONGRINDARNA
// (ef-metod-vakt.test.ts, attachment-layer-independence.test.ts): en
// hemvists-egenskap ("bor mutationen i katalogen") är en KÄLLKODS-
// egenskap, inte en runtime-egenskap — den mäts träffsäkrast i källan,
// körs utan creds i api-pure, och fäller i review innan en regression
// hinner landas.
//
// TVÅ BEVIS I VARDERA RIKTNING (uppdragets krav — AC #5 "tvåsidigt
// bevisad"):
//   1. En KONSTRUERAD sträng (aldrig en riktig fil) bevisar att
//      `containsMutationCall` själv diskriminerar rätt/fel — INKLUSIVE
//      negativkontrollen mot en verklig, redan existerande gråzon
//      (`src/components/events/CheckinPrototyp.tsx` NÄMNER "useMutation"
//      i ett docblock-kommentar utan att någonsin ANROPA den — grinden får
//      inte fälla på ordet, bara på anropet).
//   2. En KONSTRUERAD temp-fil (skapad i denna testkörning, aldrig i
//      src/) bevisar att `walkTsFiles` + scan-slingan TILLSAMMANS
//      faktiskt detekterar en överträdelse på disk.
// Den TREDJE, SKARPASTE formen av bevis 2 — en injicerad överträdelse i
// EN RIKTIG repo-fil, körd, fälld, återställd bit-identiskt via
// `git checkout --` — hör till byggverifieringen (bokförd i
// TASK-201.15s slutrapport), INTE till denna permanenta testfil: en
// permanent test som tillfälligt förstör en riktig fil riskerar att lämna
// trädet trasigt vid ett avbrott (samma resonemang som
// attachment-layer-independence.test.ts § filhuvudet).

import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC_DIR = path.join(REPO_ROOT, 'src');
const MUTATIONS_DIR = path.join(SRC_DIR, 'data', 'mutations');
const ALLOWLIST_FILE = path.join(REPO_ROOT, '.mutation-hemvist-policy.conf');

/** Matchar ett FAKTISKT `useMutation`-ANROP (`(` eller `<` direkt efter,
 * generic-typerad eller ej) — INTE ordet i en kommentar/docblock-mening
 * ("en skarp skiva skulle här ha en `useMutation`..."). Smal med avsikt,
 * samma disciplin som attachment-layer-independence.test.ts § STORAGE_API_PATTERNS. */
const MUTATION_CALL_RE = /\buseMutation\s*[(<]/;

function containsMutationCall(source: string): boolean {
  return MUTATION_CALL_RE.test(source);
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

/** Samma parsningsform som .prod-functions-allowlist.conf/ef-metod-vakt.test.ts:
 * en sökväg per rad, `#` inleder kommentar (även inline), blankrader ignoreras. */
function readAllowlist(): string[] {
  return readFileSync(ALLOWLIST_FILE, 'utf8')
    .split('\n')
    .map((line) => line.replace(/#.*$/, '').trim())
    .filter((line) => line.length > 0);
}

test.describe('Mutationens hemvist-vakt — detektorn (TASK-201.15)', () => {
  test('detektorn fäller på KONSTRUERADE överträdelser (självtest, ingen riktig fil)', () => {
    expect(containsMutationCall('const m = useMutation({ mutationFn: () => x() });')).toBe(true);
    expect(
      containsMutationCall(
        'const m = useMutation<Result, Error, Input>({ mutationFn: (i) => x(i) });',
      ),
    ).toBe(true);
  });

  test('detektorn släpper igenom oskyldig text — INKLUSIVE en verklig gråzon (negativ kontroll)', () => {
    // Ordet "useMutation" förekommer, men INGET anrop — HISTORISKT
    // CheckinPrototyp.tsx's faktiska rad (S90, PROTOTYPE STUB, `useDorrLage`):
    // en kommentar som FÖRKLARAR varför ingen mutation används, aldrig en
    // som använder en. Raden själv är riven ur filen sedan TASK-214.4
    // (A/B/C-teardownen, D skriver numera SKARPT via `useSetAttendanceStatus`
    // — den bor korrekt i `src/data/mutations/attendance.ts`, inte här) —
    // fixturen frysta ordalydelsen som en fristående regex-negativkontroll,
    // den behöver inte spegla en levande rad för att bevisa rätt sak.
    const checkinPrototypForm =
      '// [PROTOTYPE] STUB — en skarp skiva skulle här ha en `useMutation`\n' +
      '// med onMutate/rollback — latensbudgeten vid dörren är sub-sekund.\n' +
      'setOverlag((nu) => new Map(nu).set(rad.id, status));';
    expect(containsMutationCall(checkinPrototypForm)).toBe(false);

    const clean = [
      "import { useQuery } from '@tanstack/react-query';",
      'const q = useQuery({ queryKey: [x], queryFn: () => y() });',
      '// "useMutationsbenägenhet" — helt annan mening, inget anrop',
    ].join('\n');
    expect(containsMutationCall(clean)).toBe(false);
  });

  test('detektorn fäller på en KONSTRUERAD temp-fil på disk (bevisar hela walk+scan-kedjan)', () => {
    const tmpDir = mkdtempSync(path.join(tmpdir(), 'mutation-hemvist-vakt-'));
    try {
      writeFileSync(
        path.join(tmpDir, 'FejkKomponent.tsx'),
        "import { useMutation } from '@tanstack/react-query';\n" +
          'export function Fejk() {\n' +
          '  const m = useMutation({ mutationFn: () => fetch("/x") });\n' +
          '  return null;\n' +
          '}\n',
      );
      writeFileSync(
        path.join(tmpDir, 'OskyldigKomponent.tsx'),
        'export function Oskyldig() { return null; } // nämner useMutation bara i text\n',
      );

      const found = walkTsFiles(tmpDir);
      expect(found).toHaveLength(2);

      const violations = found.filter((f) => containsMutationCall(readFileSync(f, 'utf8')));
      expect(violations).toHaveLength(1);
      expect(violations[0]).toContain('FejkKomponent.tsx');
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

test.describe('Mutationens hemvist-vakt — REPOT (TASK-201.15 AC #5)', () => {
  test('allowlisten är läst och bär de förväntade posterna (canary mot en tom/trasig conf)', () => {
    const allowlist = readAllowlist();
    expect(allowlist).toContain('src/components/segment/SegmentBuilder.tsx');
    expect(allowlist).toContain('src/components/segment/prototyp/VariantA.tsx');
  });

  test('INGEN useMutation utanför src/data/mutations/ som inte är allowlistad', () => {
    const allowlist = new Set(readAllowlist());
    const violations: string[] = [];

    for (const file of walkTsFiles(SRC_DIR)) {
      if (file.startsWith(MUTATIONS_DIR)) continue; // hemvistet självt
      const source = readFileSync(file, 'utf8');
      if (!containsMutationCall(source)) continue;

      const relative = path.relative(REPO_ROOT, file).split(path.sep).join('/');
      if (allowlist.has(relative)) continue;
      violations.push(relative);
    }

    expect(
      violations,
      violations.length > 0
        ? `${violations.length} komponent-lokal(a) useMutation utanför src/data/mutations/, ` +
            `oallowlistad(e): ${violations.join(', ')}. Extrahera till katalogen, eller ` +
            'lägg till i .mutation-hemvist-policy.conf med ett motiverat skäl.'
        : undefined,
    ).toEqual([]);
  });
});
