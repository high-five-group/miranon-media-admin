// RETRY-VAKTEN — varje `retry:` i frågelagret går genom den DELADE regeln
// (TASK-451.4 runda 3, Marcus beslut "väg A" 2026-09-19). api-pure: ren
// källtextläsning, ingen staging, inga creds, ingen browser.
//
// KONTRAKTET: ett `retry:`-ställe i `src/` är antingen `false` (retryar
// ingenting alls, alltså slutgiltigt per konstruktion) eller en av
// `src/queries/retry-policy.ts`s exporter. Ingen tredje form.
//
// VARFÖR EN KÄLLTEXTS-VAKT OCH INTE ETT BETEENDETEST: beteendet mäts av
// `retry-slutgiltighet.test.ts`, men ett beteendetest kan bara mäta de
// policyer det känner till. Felklassen runda 3 lagar var att EN regel låg i 18
// TECKEN-FÖR-TECKEN identiska kopior, och att ett nytt villkor därför måste
// läggas till på 18 ställen i takt. Det som behöver vaktas är alltså inte vad
// en given policy gör, utan att en NITTONDE kopia inte kan smyga in — och den
// frågan är strukturell, inte beteendemässig. Samma form och skäl som
// `ef-metod-vakt.test.ts` (källkods-nivå för en ordnings-egenskap runtime inte
// kan visa) och `intresserade-retry-policy.test.ts` § 4-5 (lås mot att en vy
// återinför en egen `retry` som skuggar den delade defaulten).
//
// MÄTT RÖTT: mot trädet före migreringen fällde vakten 18 ställen (routerns
// `retry: 3`, `noRetryOn4xx` ×2, `husetsRetryPolicy` ×6 och de 15 inline-
// lambdorna räknat som sina anropsställen). Kommandot och utfallet står i
// PR-kroppens runda 3-avsnitt.

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC_DIR = path.join(REPO_ROOT, 'src');
const POLICY_MODUL = path.join('src', 'queries', 'retry-policy.ts');

/**
 * De ENDA tillåtna värdena på ett `retry:`-ställe i frågelagret.
 *
 * `false` räknas som godkänt utan att gå genom modulen: det retryar ingenting
 * alls och är därmed strikt STARKARE än varje regel modulen kan uttrycka
 * (`warmup-retry-policy.ts` bygger på just det).
 */
const TILLATNA_POLICYER = ['husetsRetryPolicy', 'globalRetryPolicy'] as const;
const TILLATNA = ['false', ...TILLATNA_POLICYER] as const;

/**
 * Importspecificeraren som gör ett policy-NAMN till den DELADE regeln.
 *
 * Namnet ensamt räcker inte, och det är inte teoretiskt: före migreringen bar
 * `src/data/betalningar/useBetalningar.ts` en LOKAL `const husetsRetryPolicy`
 * med exakt samma namn som modulens export. En vakt som bara läste namnet
 * godkände alltså den lokala kopian — mätt i vaktens egen första körning, där
 * filens sex ställen saknades i listan över avvikelser. Därför krävs att filen
 * också IMPORTERAR namnet härifrån.
 *
 * Matchar BÅDA importformerna huset använder: alias (`@/queries/retry-policy`,
 * komponentlagret) och relativ (`./queries/retry-policy`, `src/router.ts`).
 */
const POLICY_IMPORT = /from '[^']*queries\/retry-policy'/;

/**
 * FAIL-CLOSED-golv. En vakt vars villkor matchar noll objekt är fail-open: går
 * regexen sönder, byter huset formatering eller flyttas filerna blir sviten
 * tyst grön utan att ha prövat något. Golvet ligger under dagens 26 ställen
 * med marginal för att en fråga tas bort, men långt över noll.
 */
const MINSTA_ANTAL_STALLEN = 20;

/**
 * Tar bort kommentarer OCH stränginnehåll ur källtext, så att `retry:` i ett
 * docblock (det finns dussintals i denna kodbas) inte förväxlas med ett
 * verkligt anropsställe.
 *
 * Handskriven teckenvandring i stället för regex: en regex kan inte hålla reda
 * på om ett `//` står i kod eller inuti en sträng (`'https://…'`), och just den
 * förväxlingen hade tystat vakten på fel ställe. Strängar ersätts med ett
 * blanksteg i stället för att tas bort, så teckenoffset aldrig kollapsar två
 * separata uttryck till ett.
 */
function skalaBortKommentarerOchStrangar(kalla: string): string {
  let ut = '';
  let i = 0;
  let lage: 'kod' | 'radkommentar' | 'blockkommentar' | 'strang' = 'kod';
  let strangTecken = '';

  while (i < kalla.length) {
    const tecken = kalla[i];
    const nasta = kalla[i + 1];

    if (lage === 'kod') {
      if (tecken === '/' && nasta === '/') {
        lage = 'radkommentar';
        i += 2;
      } else if (tecken === '/' && nasta === '*') {
        lage = 'blockkommentar';
        i += 2;
      } else if (tecken === '"' || tecken === "'" || tecken === '`') {
        lage = 'strang';
        strangTecken = tecken;
        ut += ' ';
        i += 1;
      } else {
        ut += tecken;
        i += 1;
      }
      continue;
    }

    if (lage === 'radkommentar') {
      if (tecken === '\n') {
        lage = 'kod';
        ut += '\n';
      }
      i += 1;
      continue;
    }

    if (lage === 'blockkommentar') {
      if (tecken === '*' && nasta === '/') {
        lage = 'kod';
        i += 2;
      } else {
        // Bevara radbrytningar så radnumreringen nedan förblir sann.
        if (tecken === '\n') ut += '\n';
        i += 1;
      }
      continue;
    }

    // lage === 'strang'
    if (tecken === '\\') {
      i += 2;
      continue;
    }
    if (tecken === strangTecken) {
      lage = 'kod';
      strangTecken = '';
    }
    i += 1;
  }

  return ut;
}

/** Alla .ts/.tsx-filer under src/, rekursivt. */
function kallfiler(katalog: string): string[] {
  const funna: string[] = [];
  for (const post of readdirSync(katalog, { withFileTypes: true })) {
    const full = path.join(katalog, post.name);
    if (post.isDirectory()) {
      funna.push(...kallfiler(full));
    } else if (post.name.endsWith('.ts') || post.name.endsWith('.tsx')) {
      funna.push(full);
    }
  }
  return funna;
}

interface Stalle {
  fil: string;
  rad: number;
  varde: string;
  /** Importerar filen policy-namnen från den delade modulen? */
  harPolicyImport: boolean;
}

/**
 * Normaliserar det som följer på `retry:` till sitt FÖRSTA led.
 *
 * `retry: false });` och `retry: false,` ska klassas lika — avslutande
 * hakparenteser hör till objektliteralen, inte till värdet. Börjar värdet inte
 * med en identifierare (en inline-lambda börjar med `(`, den gamla globalen med
 * `3`) returneras råtexten, så felmeddelandet visar vad som faktiskt stod där.
 */
function normalisera(rått: string): string {
  return rått.trim().match(/^[A-Za-z_$][A-Za-z0-9_$]*/)?.[0] ?? rått.trim();
}

/**
 * Plockar ut varje `retry:`-ställe i KOD (inte i kommentar/sträng) med det
 * värde som följer, plus filens import-status: ett policy-NAMN räknas bara som
 * den delade regeln om filen också importerar det härifrån (se
 * {@link POLICY_IMPORT}).
 */
function retryStallen(fil: string): Stalle[] {
  const rå = readFileSync(fil, 'utf8');
  const kod = skalaBortKommentarerOchStrangar(rå);
  // Import-raden läses ur RÅTEXTEN: skalaren tömmer strängar, och
  // modulspecificeraren ÄR en sträng.
  const harPolicyImport = POLICY_IMPORT.test(rå);
  const stallen: Stalle[] = [];
  const re = /\bretry:\s*([^,\n]*)/g;

  let traff = re.exec(kod);
  while (traff !== null) {
    stallen.push({
      fil: path.relative(REPO_ROOT, fil),
      rad: kod.slice(0, traff.index).split('\n').length,
      varde: normalisera(traff[1] ?? ''),
      harPolicyImport,
    });
    traff = re.exec(kod);
  }
  return stallen;
}

const ALLA_STALLEN = kallfiler(SRC_DIR).flatMap(retryStallen);

test.describe('Retry-vakten — varje retry: i frågelagret går genom den delade regeln', () => {
  // ── POSITIV KONTROLL ────────────────────────────────────────────────────
  // Utan dessa två kan vakten passera tomt: hittar den noll ställen finns det
  // inget att underkänna, och sviten blir grön av fel skäl.

  test('vakten hittar faktiskt retry-ställen att pröva (fail-closed)', () => {
    expect(
      ALLA_STALLEN.length,
      `vakten hittade ${ALLA_STALLEN.length} retry-ställen i src/ — under golvet ${MINSTA_ANTAL_STALLEN}. ` +
        'Antingen har frågelagret krympt dramatiskt, eller så matchar vakten inte längre husets form.',
    ).toBeGreaterThanOrEqual(MINSTA_ANTAL_STALLEN);
  });

  test('kommentar-skalningen äter inte kod, och ser inte kommentarer som kod', () => {
    // Skalaren är vaktens enda icke-triviala del. Går den sönder klassas
    // antingen docblock-prosa som anropsställen (falskt rött) eller riktiga
    // anropsställen försvinner (tyst grönt). Båda riktningarna prövas här.
    const prov = [
      'const a = { retry: false };',
      '// retry: 3 i en radkommentar',
      '/** retry: 3 i ett docblock */',
      "const url = 'https://x/retry: 3';",
      'const b = { retry: husetsRetryPolicy };',
    ].join('\n');

    const kod = skalaBortKommentarerOchStrangar(prov);
    const funna = [...kod.matchAll(/\bretry:\s*([^,\n]*)/g)].map((m) => normalisera(m[1] ?? ''));

    expect(funna, 'endast de TVÅ kod-ställena ska räknas').toEqual(['false', 'husetsRetryPolicy']);
  });

  test('policy-modulen finns och exporterar de tillåtna namnen', () => {
    const modul = readFileSync(path.join(REPO_ROOT, POLICY_MODUL), 'utf8');
    expect(modul, 'husetsRetryPolicy ska exporteras').toContain('export const husetsRetryPolicy');
    expect(modul, 'globalRetryPolicy ska exporteras').toContain('export const globalRetryPolicy');
    expect(modul, 'slutgiltighets-predikatet ska exporteras').toContain(
      'export function arSlutgiltigtFel',
    );
  });

  // ── SJÄLVA VAKTEN ───────────────────────────────────────────────────────

  test('varje retry: är false eller en IMPORTERAD av policy-modulens exporter', () => {
    const avvikande = ALLA_STALLEN.filter((s) => {
      if (s.varde === 'false') return false;
      const arPolicynamn = (TILLATNA_POLICYER as readonly string[]).includes(s.varde);
      // Namnet MÅSTE komma från den delade modulen — annars är det en lokal
      // kopia som bara råkar heta rätt (se POLICY_IMPORT:s docblock).
      return !(arPolicynamn && s.harPolicyImport);
    });

    expect(
      avvikande.map(
        (s) =>
          `${s.fil}:${s.rad} → retry: ${s.varde}${
            (TILLATNA_POLICYER as readonly string[]).includes(s.varde)
              ? '  (rätt namn, men filen importerar inte policy-modulen)'
              : ''
          }`,
      ),
      `Varje retry: i src/ ska vara ${TILLATNA.join(' | ')}, och policy-namnen ska vara ` +
        `importerade (${POLICY_IMPORT.source}) — annars går felet inte genom ` +
        'slutgiltighets-regeln (arSlutgiltigtFel) och ett uttömt tidsbudget-fel retryas igen.',
    ).toEqual([]);
  });

  test('de tre policy-registrerande modulerna är faktiskt med i mängden', () => {
    // Skydd mot att vakten tappar just de filer som bär husets defaults —
    // en krympt filmängd hade annars kunnat passera golvet ovan ändå.
    const filer = new Set(ALLA_STALLEN.map((s) => s.fil));
    for (const vantad of [
      path.join('src', 'router.ts'),
      path.join('src', 'queries', 'warmup-retry-policy.ts'),
      path.join('src', 'queries', 'intresserade-retry-policy.ts'),
    ]) {
      expect(filer.has(vantad), `${vantad} ska bära ett retry-ställe vakten ser`).toBe(true);
    }
  });
});
