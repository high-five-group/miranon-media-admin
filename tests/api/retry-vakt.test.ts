// RETRY-VAKTEN — varje `retry:` i frågelagret går genom den DELADE regeln
// (TASK-451.4 runda 3, Marcus beslut "väg A" 2026-09-19). api-pure: ren
// källtextläsning, ingen staging, inga creds, ingen browser.
//
// KONTRAKTET: ett `retry:`-ställe i `src/` är antingen `false` (retryar
// ingenting alls, alltså slutgiltigt per konstruktion) eller EXAKT ett av de
// namn filen själv har bundit genom en OALIASAD värde-import ur
// `src/queries/retry-policy.ts` — och som filen inte samtidigt deklarerar
// lokalt. Ingen tredje form.
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
// ── RUNDA 4: VAKTEN HADE ETT BELAGT KRINGGÅENDE ─────────────────────────────
//
// Runda 3:s form prövade import-kravet på FIL-nivå: "importerar filen NÅGOT ur
// policy-modulen?" plus "står värdets namn i listan över tillåtna namn?". De
// två villkoren var inte bundna till varandra. Granskaren injicerade därför en
// fil som importerar `husetsRetryPolicy` (villkor 1 uppfyllt av ETT namn) och
// samtidigt deklarerar en LOKAL `const globalRetryPolicy = () => true` som den
// använder på `retry:`-stället (villkor 2 uppfyllt av ETT ANNAT namn) — vakten
// var grön 5/5 mot en fil vars retry-värde var en lokal lambda.
//
// Runda 4 binder de två villkoren till varandra: namnet på `retry:`-stället
// måste vara ETT AV DE NAMN JUST DEN FILEN IMPORTERAR ur policy-modulen. Till
// det kommer en skuggnings-kontroll (se {@link lokaltDeklarerade}), eftersom
// ett importerat namn kan skuggas av en lokal deklaration i en inre scope utan
// att importen försvinner. Granskarens injektion bor sedan dess som en
// PERMANENT negativ fixtur i denna fil (§ SYNTETISKA FIXTURER) — den prövas
// mot en källTEXT, aldrig genom att mutera en riktig fil.
//
// MÄTT RÖTT (runda 3): mot trädet före migreringen fällde vakten 18 ställen
// (routerns `retry: 3`, `noRetryOn4xx` ×2, `husetsRetryPolicy` ×6 och de 15
// inline-lambdorna räknat som sina anropsställen). Kommandot och utfallet står
// i PR-kroppens runda 3-avsnitt.
//
// MÄTT RÖTT (runda 4): de fem negativa fixturerna nedan kördes mot runda 3:s
// predikat (`arPolicynamn && filen importerar något ur modulen`) i en
// tillfällig kopia av denna fil — injektion B och skuggnings-fallen var GRÖNA
// där, alltså obevakade. Utfall och kommando står i PR-kroppens runda 4-avsnitt.

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
 * Importsatser som binder ett NAMN till den delade policy-modulen.
 *
 * Matchar BÅDA importformerna huset använder: alias-specificeraren
 * (`@/queries/retry-policy`, komponentlagret) och den relativa
 * (`./queries/retry-policy`, `src/router.ts`).
 */
const POLICY_IMPORT_SATS =
  /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*'[^']*queries\/retry-policy'/g;

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

/**
 * De NAMN filen har bundit till policy-modulen genom en oaliasad VÄRDE-import.
 *
 * Läses ur RÅTEXTEN: skalaren ovan tömmer strängar, och modulspecificeraren ÄR
 * en sträng.
 *
 * Tre former ger med avsikt INGET namn tillbaka, och alla tre gör därmed
 * anropsstället avvikande (fail-closed):
 *
 * - **`import type { … }` / `{ type X }`** — en typ-import binder inget
 *   runtime-värde. Ett `retry:` som pekar på ett typ-importerat namn kan alltså
 *   inte vara den delade regeln.
 * - **`X as Y`** — aliaset `Y` är inte ett namn vakten känner igen, och `X` är
 *   inte det som står på anropsstället. Detta är samma utfall som runda 3 hade
 *   (granskningens kontrollgrupp, "injektion A"), och det är medvetet bevarat:
 *   ett alias gör det dyrare att läsa vilken regel som gäller, för människa och
 *   vakt lika.
 * - **`import * as X from …`** — namnrymds-importen binder `X`, och ett
 *   `retry: X.husetsRetryPolicy` normaliseras till `X`, som aldrig står i
 *   {@link TILLATNA_POLICYER}.
 *
 * Detta är TEXTLÄSNING, inte modulupplösning: en re-export-kedja genom en annan
 * modul (`from '@/queries/nagot-annat'`) matchar inte specificeraren och fälls,
 * även om den i praktiken skulle ge samma funktion. Fail-closed med avsikt —
 * vakten ska vara billig att lita på, inte klok.
 */
function importeradePolicynamn(rå: string): Set<string> {
  const namn = new Set<string>();
  const re = new RegExp(POLICY_IMPORT_SATS.source, 'g');

  let traff = re.exec(rå);
  while (traff !== null) {
    const arTypimport = /^import\s+type\b/.test(traff[0]);
    if (!arTypimport) {
      for (const rådSpec of (traff[1] ?? '').split(',')) {
        const spec = rådSpec.trim();
        if (spec === '' || /^type\s/.test(spec) || /\bas\b/.test(spec)) continue;
        if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(spec)) namn.add(spec);
      }
    }
    traff = re.exec(rå);
  }
  return namn;
}

/**
 * Identifierare som står i en PARAMETERLISTA någonstans i filen.
 *
 * Bara två former läses — `function f(…)` och pilfunktionens `(…) =>` / `x =>`.
 * `if (…)`, `for (…)` och `catch (…)` matchas med avsikt INTE: de kan inte
 * binda ett namn som ett `retry:`-värde läser, och en bredare matchning hade
 * gett falskt RÖTT på ett `if (husetsRetryPolicy)` — en grind som fäller på
 * korrekt kod är värre än ingen grind.
 *
 * Parenteslistan tillåter EN nivå av nästling (`(p: (a) => b)`), vilket räcker
 * för en funktionstypad parameter — den vanliga formen när en policy skickas
 * in. Djupare nästling läses inte; se {@link lokaltDeklarerade} § VAD DEN INTE
 * GÖR.
 */
function parameterIdentifierare(kod: string): Set<string> {
  const namn = new Set<string>();
  const PARENTESLISTA = '\\(((?:[^()]|\\([^()]*\\))*)\\)';
  const listor = [
    new RegExp(`\\bfunction\\s*[A-Za-z0-9_$]*\\s*${PARENTESLISTA}`, 'g'),
    new RegExp(`${PARENTESLISTA}\\s*(?::[^=;{]*)?=>`, 'g'),
  ];

  for (const re of listor) {
    let traff = re.exec(kod);
    while (traff !== null) {
      for (const del of (traff[1] ?? '').split(',')) {
        const id = del.trim().match(/^\.{0,3}\s*([A-Za-z_$][A-Za-z0-9_$]*)/)?.[1];
        if (id !== undefined) namn.add(id);
      }
      traff = re.exec(kod);
    }
  }

  // Enkel pilfunktion utan parenteser: `x => …`. Det inledande teckenklass-
  // undantaget håller `) =>` och `.foo =>` utanför.
  const enkelPil = /(?:^|[^A-Za-z0-9_$.)])([A-Za-z_$][A-Za-z0-9_$]*)\s*=>/g;
  let traff = enkelPil.exec(kod);
  while (traff !== null) {
    if (traff[1] !== undefined) namn.add(traff[1]);
    traff = enkelPil.exec(kod);
  }

  return namn;
}

/**
 * Vilka av {@link TILLATNA_POLICYER} filen ÄVEN deklarerar lokalt.
 *
 * Skälet: en import kan skuggas. `import { husetsRetryPolicy } from …` på rad 3
 * och `const husetsRetryPolicy = () => true` inuti en funktion på rad 40 är
 * giltig TypeScript, och ett `retry: husetsRetryPolicy` i den funktionen läser
 * den LOKALA. Namn-bindningen ensam hade godkänt det.
 *
 * Fem textformer läses: `const`/`let`/`var`/`function`/`class NAMN`, den enkla
 * destruktureringen `const { NAMN } = …`, och parameterlistor
 * ({@link parameterIdentifierare}).
 *
 * VAD DEN INTE GÖR, utskrivet i stället för underförstått: den känner ingen
 * SCOPE. En lokal deklaration var som helst i filen diskvalificerar namnet på
 * VARJE `retry:`-ställe i samma fil — även om skuggningen sitter i en orelaterad
 * funktion. Det är avsiktligt konservativt: utfallet är falskt RÖTT (någon får
 * döpa om sin lokala variabel), aldrig falskt grönt. Nästlad destrukturering och
 * `catch (NAMN)` läses inte alls; för att nå dem krävs en riktig parser, och den
 * kostnaden är inte tagen här.
 */
function lokaltDeklarerade(kod: string, kandidater: readonly string[]): Set<string> {
  const parametrar = parameterIdentifierare(kod);
  const funna = new Set<string>();

  for (const namn of kandidater) {
    const deklaration = new RegExp(`\\b(?:const|let|var|function|class)\\s+${namn}\\b`);
    const destrukturering = new RegExp(`\\b(?:const|let|var)\\s*\\{[^}]*\\b${namn}\\b[^}]*\\}`);
    if (deklaration.test(kod) || destrukturering.test(kod) || parametrar.has(namn)) {
      funna.add(namn);
    }
  }
  return funna;
}

interface Stalle {
  fil: string;
  rad: number;
  /** Värdets första identifierare, se {@link normalisera}. */
  varde: string;
  /** Det som stod EFTER identifieraren på samma rad, före kommatecknet. */
  rest: string;
  /** Namn filen bundit via oaliasad värde-import ur policy-modulen. */
  importerade: ReadonlySet<string>;
  /** Tillåtna policy-namn filen ÄVEN deklarerar lokalt (skuggning). */
  skuggade: ReadonlySet<string>;
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
 * Plockar ut varje `retry:`-ställe i KOD (inte i kommentar/sträng) tillsammans
 * med filens import- och skuggnings-läge.
 *
 * Tar KÄLLTEXT, inte en sökväg, så att vaktens regel kan prövas mot syntetiska
 * fixturer (§ SYNTETISKA FIXTURER) utan att någon riktig fil muteras.
 */
function analyseraKalla(rå: string, fil: string): Stalle[] {
  const kod = skalaBortKommentarerOchStrangar(rå);
  const importerade = importeradePolicynamn(rå);
  const skuggade = lokaltDeklarerade(kod, TILLATNA_POLICYER);
  const stallen: Stalle[] = [];
  const re = /\bretry:\s*([^,\n]*)/g;

  let traff = re.exec(kod);
  while (traff !== null) {
    const rått = (traff[1] ?? '').trim();
    const varde = normalisera(rått);
    stallen.push({
      fil,
      rad: kod.slice(0, traff.index).split('\n').length,
      varde,
      rest: rått.startsWith(varde) ? rått.slice(varde.length) : rått,
      importerade,
      skuggade,
    });
    traff = re.exec(kod);
  }
  return stallen;
}

function retryStallen(fil: string): Stalle[] {
  return analyseraKalla(readFileSync(fil, 'utf8'), path.relative(REPO_ROOT, fil));
}

/**
 * VAKTENS REGEL, som ETT predikat — returnerar skälet, eller `null` när stället
 * håller.
 *
 * Fyra led, i fallande allmängiltighet. Varje led har en egen negativ fixtur
 * nedan, så ingen av dem kan tystna oupptäckt.
 */
function avvikelseSkal(s: Stalle): string | null {
  if (s.varde === 'false') return null;

  if (!(TILLATNA_POLICYER as readonly string[]).includes(s.varde)) {
    return `retry: ${s.varde} — varken false eller ett av policy-modulens namn (${TILLATNA_POLICYER.join(' | ')})`;
  }
  if (!s.importerade.has(s.varde)) {
    return `retry: ${s.varde} — rätt namn, men filen binder inte JUST det namnet genom en oaliasad värde-import ur ${POLICY_MODUL}`;
  }
  if (s.skuggade.has(s.varde)) {
    return `retry: ${s.varde} — namnet är importerat MEN deklareras också lokalt i filen; det lokala värdet skuggar den delade regeln`;
  }
  if (!/^[\s)}\];]*$/.test(s.rest)) {
    return `retry: ${s.varde}${s.rest} — värdet ska vara policy-namnet SJÄLVT, inte ett uttryck byggt på det (anrop, .bind, ?? / && …)`;
  }
  return null;
}

function avvikande(stallen: readonly Stalle[]): string[] {
  return stallen.flatMap((s) => {
    const skal = avvikelseSkal(s);
    return skal === null ? [] : [`${s.fil}:${s.rad} → ${skal}`];
  });
}

// ── SYNTETISKA FIXTURER ─────────────────────────────────────────────────────
// Varje fixtur är KÄLLTEXT, inte en muterad riktig fil. Skälet står i
// filhuvudet: runda 3:s kringgående upptäcktes bara för att granskaren
// injicerade det för hand i en isolerad klon — en engångsmätning som försvann
// med sin scratchpad. Som fixtur körs samma injektion vid varje CI-körning.

const IMPORT_ALIAS = "import { husetsRetryPolicy } from '@/queries/retry-policy';";
const IMPORT_RELATIV = "import { globalRetryPolicy } from './queries/retry-policy';";

/** GRANSKARENS INJEKTION B (runda 3-fyndet, PR #2551) — den lokala lambdan. */
const INJEKTION_B = `${IMPORT_ALIAS}
const globalRetryPolicy = (_f: number, _e: Error): boolean => true;
export function useNagot() {
  return useQuery({ queryKey: ['x'], queryFn: f, retry: globalRetryPolicy });
}
`;

/** GRANSKARENS INJEKTION A (runda 3:s kontrollgrupp) — aliasad import. */
const INJEKTION_A = `import { husetsRetryPolicy as minPolicy } from '@/queries/retry-policy';
export function useNagot() {
  return useQuery({ queryKey: ['x'], queryFn: f, retry: minPolicy });
}
`;

/** Skuggning i inre scope: importen finns, men det lokala namnet vinner. */
const SKUGGNING_CONST = `${IMPORT_ALIAS}
export function useNagot() {
  const husetsRetryPolicy = (_f: number, _e: Error): boolean => true;
  return useQuery({ queryKey: ['x'], queryFn: f, retry: husetsRetryPolicy });
}
`;

/** Skuggning via parameter — samma hål, annan bindningsform. */
const SKUGGNING_PARAMETER = `${IMPORT_ALIAS}
export function bygg(husetsRetryPolicy: (f: number, e: Error) => boolean) {
  return useQuery({ queryKey: ['x'], queryFn: f, retry: husetsRetryPolicy });
}
`;

/** Den historiska formen (`useBetalningar.ts` före migreringen): rätt namn, ingen import. */
const LOKAL_UTAN_IMPORT = `const husetsRetryPolicy = (_f: number, _e: Error): boolean => true;
export function useNagot() {
  return useQuery({ queryKey: ['x'], queryFn: f, retry: husetsRetryPolicy });
}
`;

/** Typ-import binder inget runtime-värde. */
const TYPIMPORT = `import type { husetsRetryPolicy } from '@/queries/retry-policy';
export function useNagot() {
  return useQuery({ queryKey: ['x'], queryFn: f, retry: husetsRetryPolicy });
}
`;

/** Uttryck byggt PÅ namnet i stället för namnet självt. */
const UTTRYCK_PA_NAMNET = `${IMPORT_ALIAS}
export function useNagot() {
  return useQuery({ queryKey: ['x'], queryFn: f, retry: husetsRetryPolicy.bind(null) });
}
`;

/** POSITIV KONTROLL — husets form, alias-specificeraren. */
const GILTIG_ALIASIMPORT = `${IMPORT_ALIAS}
export function useNagot() {
  return useQuery({ queryKey: ['x'], queryFn: f, retry: husetsRetryPolicy });
}
`;

/** POSITIV KONTROLL — routerns form, relativ specificerare. */
const GILTIG_RELATIVIMPORT = `${IMPORT_RELATIV}
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: globalRetryPolicy, staleTime: 1 } },
});
`;

/** POSITIV KONTROLL — `false` kräver ingen import alls. */
const GILTIG_FALSE = `export function registrera(qc: QueryClient) {
  qc.setQueryDefaults(['x'], { retry: false });
}
`;

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

  test('varje retry: är false eller ett IMPORTERAT, oskuggat policy-namn', () => {
    expect(
      avvikande(ALLA_STALLEN),
      `Varje retry: i src/ ska vara ${TILLATNA.join(' | ')}, policy-namnet ska vara bundet av ` +
        `den egna filens oaliasade import ur ${POLICY_MODUL}, och det får inte skuggas av en ` +
        'lokal deklaration — annars går felet inte genom slutgiltighets-regeln ' +
        '(arSlutgiltigtFel) och ett uttömt tidsbudget-fel retryas igen.',
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

  // ── VAKTEN PRÖVAD MOT SIG SJÄLV (runda 4) ───────────────────────────────
  // Regeln ovan mäter trädet. Dessa fall mäter REGELN: att den fäller där den
  // ska, och bara där. Utan dem är en tyst uppmjukning av predikatet osynlig —
  // trädet är ju grönt oavsett hur svagt villkoret blir.

  const NEGATIVA: ReadonlyArray<readonly [string, string, RegExp]> = [
    [
      'granskarens injektion B — lokal lambda med ett tillåtet namn, i en fil som importerar ETT ANNAT tillåtet namn',
      INJEKTION_B,
      /binder inte JUST det namnet/,
    ],
    [
      'granskarens injektion A — aliasad import gör namnet okänt för vakten',
      INJEKTION_A,
      /varken false eller ett av policy-modulens namn/,
    ],
    [
      'skuggning: lokal const med samma namn som importen',
      SKUGGNING_CONST,
      /skuggar den delade regeln/,
    ],
    [
      'skuggning: parameter med samma namn som importen',
      SKUGGNING_PARAMETER,
      /skuggar den delade regeln/,
    ],
    [
      'historiska formen: rätt namn, ingen import alls (useBetalningar.ts före migreringen)',
      LOKAL_UTAN_IMPORT,
      /binder inte JUST det namnet/,
    ],
    ['typ-import binder inget runtime-värde', TYPIMPORT, /binder inte JUST det namnet/],
    [
      'uttryck byggt på namnet i stället för namnet självt',
      UTTRYCK_PA_NAMNET,
      /inte ett uttryck byggt på det/,
    ],
  ];

  for (const [namn, kalla, forvantatSkal] of NEGATIVA) {
    test(`FÄLLER: ${namn}`, () => {
      const funna = avvikande(analyseraKalla(kalla, 'syntetisk-fixtur.tsx'));
      expect(funna, 'fixturen ska ge EXAKT en avvikelse').toHaveLength(1);
      expect(funna[0]).toMatch(forvantatSkal);
    });
  }

  const POSITIVA: ReadonlyArray<readonly [string, string]> = [
    ['husets form — oaliasad import via @/queries/retry-policy', GILTIG_ALIASIMPORT],
    ['routerns form — oaliasad import via relativ specificerare', GILTIG_RELATIVIMPORT],
    ['retry: false kräver ingen import alls', GILTIG_FALSE],
  ];

  for (const [namn, kalla] of POSITIVA) {
    test(`SLÄPPER: ${namn}`, () => {
      expect(avvikande(analyseraKalla(kalla, 'syntetisk-fixtur.tsx'))).toEqual([]);
    });
  }

  test('fixturerna bär faktiskt ett retry-ställe var (fail-closed mot en trasig fixtur)', () => {
    // Utan detta hade en fixtur vars retry-ställe inte längre matchar sett
    // ut som "släpper" i de positiva fallen — grönt av fel skäl.
    for (const [namn, kalla] of [...POSITIVA, ...NEGATIVA.map(([n, k]) => [n, k] as const)]) {
      expect(
        analyseraKalla(kalla, 'syntetisk-fixtur.tsx').length,
        `fixturen "${namn}" ska bära exakt ett retry-ställe`,
      ).toBe(1);
    }
  });
});
