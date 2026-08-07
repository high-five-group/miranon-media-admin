#!/usr/bin/env node
// scripts/test-check-staging-preflight-wiring.mjs
//
// Empirisk testsvit för scripts/check-staging-preflight-wiring.mjs (TASK-91).
//
// ═══ TVÅSIDIGT BEVIS PER YTA — INTE ETT STICKPROV ═══
// En deletion-vakt som bara bevisats GRÖN har inte bevisats alls: den kan vara
// grön för att den inte tittar. Sviten bevisar därför per yta att vakten FÄLLER
// när wiringen tas bort. Fem ytor, båda halvorna där ytan har två:
//
//   Yta 1  api-setup → api-staging + kontraktsvakt
//            R1  anropet borta ur tests/api/auth.setup.ts        → RÖD
//            R1b dependencyn borta ur playwright.config.ts       → RÖD
//   Yta 2  setup → chromium-authenticated
//            R2  anropet borta ur tests/e2e/auth.setup.ts        → RÖD
//            R2b dependencyn borta                                → RÖD
//   Yta 3  preview-setup → staging-preview
//            R3  anropet borta ur tests/preview/preflight.setup.ts → RÖD
//            R3b dependencyn borta                                → RÖD
//   Yta 4  scripts/purge-staging-sentinels.mjs
//            R4  anropet borta ur main()                          → RÖD
//   Yta 5  scripts/seed-review-fixture.mjs
//            R5  anropet borta ur main()                          → RÖD
//
// Plus de sätt en hake försvinner UTAN att raden raderas:
//   R6/R7  anropet bortkommenterat (Playwright- resp. Node-sidan)  → RÖD
//   R8     anropet flyttat UT ur main(), importen kvar             → RÖD
//
// Plus sjätte-yta-nätet (AC #5) i båda riktningar:
//   R9     nytt Playwright-projekt, oklassat                       → RÖD
//   R14    nytt projekt bakom en ODEKLARERAD env-flagga            → RÖD
//   R10    nytt scripts/-skript med staging-markör, oklassat       → RÖD
//   R11    policy-post utan motsvarighet i configen                → RÖD
//   R15    bärare utan kvarvarande konsument (obevisad yta)         → RÖD
//   G1     nytt projekt som ÄR klassat som undantagen              → GRÖN
//   G2     nytt scripts/-skript UTAN markör                        → GRÖN
//
// G1 och G2 är inte dekoration: utan dem vore hela röd-sidan förenlig med en
// vakt som fäller på VARJE ändring, vilket hade bevisat ingenting.
//
// Plus fail-closed:
//   R12    policy-filen borta                                      → 64
//   R13    tom policy                                              → 64
//
// Plus TASK-115 — G0-stegets bounded retry kring playwright --list:
//   G3     TRANSIENT fel: 1:a försöket faller, 2:a lyckas            → GRÖN,
//          exakt 2 anrop (inte 1, inte 3)
//   R16    fel VARJE försök (deterministiskt/uttömt)                 → kastar
//          efter PLAYWRIGHT_LIST_FORSOK anrop, fail-closed bevarat
// Dessa två testar listaProjektMedRetry() DIREKT (importerad, inte
// spawnSync:ad) mot en minimal fejk-CLI i /tmp — retry-mekanismen är
// parametriserad över (repo, cli, projekt) och oberoende av sandlådans
// wiring-läsning, så den prövas isolerat i stället för genom hela G0-kedjan.
//
// ═══ SANDLÅDAN ÄR EN KOPIA AV DET RIKTIGA TRÄDET ═══
// Inte en syntetisk mini-config: `/tmp/t91-check-staging-preflight-wiring/` får
// repots FAKTISKA playwright.config.ts, tests/, de policy-deklarerade
// Node-skripten (härlett ur .staging-preflight-wiring-policy.json, se
// NODE_YTOR nedan — inte en handskriven lista) och vakten — i samma inbördes
// relation som i repot, så den faktiska sökvägsupplösningen provas.
// Mutationerna skär alltså i den riktiga wiringen.
// node_modules symlänkas (kopieras aldrig). Vakten körs med cwd satt till det
// RIKTIGA repot, vilket samtidigt bevisar att den härleder sin rot ur sin egen
// plats och inte ur cwd.
//
// Varje mutation verifieras ha ÄNDRAT något innan vakten körs — en mutation som
// tyst inte tog hade gett ett rött testfall av fel skäl.
//
// Kör: node scripts/test-check-staging-preflight-wiring.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listaProjektMedRetry, PLAYWRIGHT_LIST_FORSOK } from './check-staging-preflight-wiring.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SANDLADA = '/tmp/t91-check-staging-preflight-wiring';
const VAKT = join(SANDLADA, 'scripts', 'check-staging-preflight-wiring.mjs');
const POLICY = '.staging-preflight-wiring-policy.json';
const CONFIG = 'playwright.config.ts';

// ═══ POLICYN ÄR KÄLLAN — inte en fjärde handskriven kopia ═══
// Sandlådans kopieringslista och G0:s förväntan härleddes tidigare ur
// handskrivna literaler (två Node-skript, uppräknade). TASK-146.2 lade till
// ett tredje Node-skript (scripts/create-bilagor-table.mjs) korrekt i
// .staging-preflight-wiring-policy.json — men den hårdkodade listan visste
// inte om det, så vakten SJÄLV var grön (den läser policyn) medan dess EGET
// självtest föll inuti sin egen sandlåda (G0/G1/G2, se kortets uppdrag).
// Samma anti-mönster CLAUDE.md § Custom CI-grindvakts-logik förbjuder för
// vakten gäller lika mycket för dess självtest. Härled i stället.
const wiringPolicy = JSON.parse(readFileSync(join(REPO, POLICY), 'utf-8'));
const PREFLIGHT_SYMBOL = wiringPolicy.preflightSymbol;
const NODE_YTOR = wiringPolicy.nodeSkript ?? [];
const BARARE_ANTAL = (wiringPolicy.playwrightProjekt ?? []).filter(
  (p) => p.klass === 'bärare',
).length;

const KOPIERADE_FILER = [
  'package.json',
  CONFIG,
  POLICY,
  'scripts/check-staging-preflight-wiring.mjs',
  // scripts/lib/staging-preflight.mjs är den delade modulen ALLA Node-ytor
  // importerar från — den är själv ingen "yta" i policyns mening (den bär
  // ingen egen nodeSkript-post) och förblir därför hårdkodad med flit.
  'scripts/lib/staging-preflight.mjs',
  ...NODE_YTOR.map((p) => p.sökväg),
];

// tests/ ensamt räcker INTE: testfilerna importerar `../../src/…` och
// `../../supabase/functions/_shared/…`, och Playwright kan inte samla in tester
// vars imports inte resolvar. Mätt, inte antaget — utan dessa två föll
// `--project=kontraktsvakt --list` på "Cannot find module .../src/lib/env-coherence".
const KOPIERADE_KATALOGER = ['tests', 'src', 'supabase'];

/* ── Sandlåda ───────────────────────────────────────────────────────────── */

function byggSandlada() {
  rmSync(SANDLADA, { recursive: true, force: true });
  mkdirSync(join(SANDLADA, 'scripts', 'lib'), { recursive: true });
  symlinkSync(join(REPO, 'node_modules'), join(SANDLADA, 'node_modules'));
  for (const katalog of KOPIERADE_KATALOGER) {
    cpSync(join(REPO, katalog), join(SANDLADA, katalog), { recursive: true });
  }
  for (const fil of KOPIERADE_FILER) cpSync(join(REPO, fil), join(SANDLADA, fil));
}

process.on('exit', () => rmSync(SANDLADA, { recursive: true, force: true }));

/* ── Mutationer med återställning ───────────────────────────────────────── */

const original = new Map();
const tillagda = [];

function mutera(relativ, omvandla) {
  const fil = join(SANDLADA, relativ);
  if (!original.has(relativ)) original.set(relativ, readFileSync(fil, 'utf-8'));
  const fore = readFileSync(fil, 'utf-8');
  const efter = omvandla(fore);
  if (efter === fore) {
    throw new Error(`mutationen av ${relativ} ändrade ingenting — testfallet hade blivit falskt`);
  }
  writeFileSync(fil, efter);
}

function laggTill(relativ, innehall) {
  writeFileSync(join(SANDLADA, relativ), innehall);
  tillagda.push(relativ);
}

function taBort(relativ) {
  const fil = join(SANDLADA, relativ);
  if (!original.has(relativ)) original.set(relativ, readFileSync(fil, 'utf-8'));
  rmSync(fil);
}

function aterstall() {
  for (const [relativ, innehall] of original) writeFileSync(join(SANDLADA, relativ), innehall);
  original.clear();
  for (const relativ of tillagda) rmSync(join(SANDLADA, relativ), { force: true });
  tillagda.length = 0;
}

/** Tar bort FÖRSTA raden som innehåller `nal`. */
function utanForstaRadenMed(kalla, nal) {
  const rader = kalla.split('\n');
  const i = rader.findIndex((rad) => rad.includes(nal));
  if (i === -1) return kalla;
  rader.splice(i, 1);
  return rader.join('\n');
}

/** Kommenterar bort FÖRSTA raden som innehåller `nal`. */
function bortkommenteraForstaRadenMed(kalla, nal) {
  const rader = kalla.split('\n');
  const i = rader.findIndex((rad) => rad.includes(nal));
  if (i === -1) return kalla;
  rader[i] = `// ${rader[i].trim()}`;
  return rader.join('\n');
}

const API_PURE_ANKARE = "    {\n      name: 'api-pure',";

/* ── Testkörning ────────────────────────────────────────────────────────── */

let rott = 0;

function korVakt() {
  const r = spawnSync(process.execPath, [VAKT], {
    // cwd = det RIKTIGA repot: vakten måste hitta sin sandlåde-policy via sin
    // egen plats, inte via arbetskatalogen.
    cwd: REPO,
    encoding: 'utf-8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return { kod: r.status, ut: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

/**
 * @param {string} namn
 * @param {{forbered?: () => void, kod: number, kravText?: string[], forbjudenText?: string[]}} spec
 */
function fall(namn, spec) {
  try {
    spec.forbered?.();
    const { kod, ut } = korVakt();

    if (kod !== spec.kod) {
      throw new Error(`exit ${kod}, förväntat ${spec.kod}\n--- vaktens utdata ---\n${ut}`);
    }
    for (const text of spec.kravText ?? []) {
      if (!ut.includes(text)) {
        throw new Error(`utdata saknar "${text}"\n--- vaktens utdata ---\n${ut}`);
      }
    }
    for (const text of spec.forbjudenText ?? []) {
      if (ut.includes(text)) {
        throw new Error(`utdata nämner "${text}" men skulle inte\n--- vaktens utdata ---\n${ut}`);
      }
    }
    console.log(`✅ ${namn}`);
  } catch (fel) {
    rott += 1;
    console.error(`❌ ${namn}: ${fel.message}`);
  } finally {
    aterstall();
  }
}

/* ── Fallen ─────────────────────────────────────────────────────────────── */

byggSandlada();

// Playwright-halvan (Yta 1–3) är INTE del av detta korts scope (TASK-146.2
// rörde bara Node-ytorna) och förblir därför literal med flit — se kortets
// gräns-avsnitt. Bärarantalet i rubriktexten härleds ändå ur policyn i
// stället för att vara ett fjärde ställe med talet "3" inskrivet för hand.
const G0_PLAYWRIGHT_KRAVTEXT = [
  'api-staging → api-setup',
  'kontraktsvakt → api-setup',
  'chromium-authenticated → setup',
  'staging-preview → preview-setup',
];
// Node-halvan (Yta 4+) härleds ur samma policy-läsning som KOPIERADE_FILER
// ovan — en rad per deklarerad nodeSkript-post, i den ordning policyn
// listar dem. Formen är IDENTISK med vaktens egen framgångsrad
// (`✅ ${post.sökväg} → ${symbol}() i ${post.funktion}()`, minus ✅-prefixet
// som `fall()` matchar med `.includes()`).
const G0_NODE_KRAVTEXT = NODE_YTOR.map(
  (post) => `${post.sökväg} → ${PREFLIGHT_SYMBOL}() i ${post.funktion}()`,
);
// Talet i rubriken är härlett — inte skrivet för hand — så det aldrig kan
// ljuga om antalet ytor: bärare (Playwright, fast 3) + antal Node-ytor
// policyn faktiskt deklarerar just nu.
const G0_TOTAL_YTOR = BARARE_ANTAL + NODE_YTOR.length;

fall(`G0  orörd kopia av trädet → GRÖN, och namnger samtliga ${G0_TOTAL_YTOR} ytor`, {
  kod: 0,
  kravText: [...G0_PLAYWRIGHT_KRAVTEXT, ...G0_NODE_KRAVTEXT, '0 oklassade'],
});

/* Yta 1 — api-setup → api-staging + kontraktsvakt */

fall('R1  yta 1: anropet borta ur tests/api/auth.setup.ts → RÖD', {
  forbered: () =>
    mutera('tests/api/auth.setup.ts', (k) =>
      utanForstaRadenMed(k, "kravStagingLedigt('lokal Playwright-körning (api-setup)')"),
    ),
  kod: 1,
  kravText: ['api-staging', 'kontraktsvakt', 'Anropsraden är borta'],
});

fall('R1b yta 1: dependencyn borta för api-staging → RÖD, och pekar ut RÄTT konsument', {
  forbered: () => mutera(CONFIG, (k) => utanForstaRadenMed(k, "dependencies: ['api-setup'],")),
  kod: 1,
  kravText: ['api-staging', 'Dependencyn ser ut att ha tappats'],
  // kontraktsvakt behåller sin dependency → ska inte dras med i fällningen.
  forbjudenText: ['kontraktsvakt'],
});

/* Yta 2 — setup → chromium-authenticated */

fall('R2  yta 2: anropet borta ur tests/e2e/auth.setup.ts → RÖD', {
  forbered: () =>
    mutera('tests/e2e/auth.setup.ts', (k) =>
      utanForstaRadenMed(k, "kravStagingLedigt('lokal Playwright-körning (e2e setup)')"),
    ),
  kod: 1,
  kravText: ['chromium-authenticated', 'Anropsraden är borta'],
});

fall('R2b yta 2: dependencyn borta för chromium-authenticated → RÖD', {
  forbered: () => mutera(CONFIG, (k) => utanForstaRadenMed(k, "dependencies: ['setup'],")),
  kod: 1,
  kravText: ['chromium-authenticated', 'Dependencyn ser ut att ha tappats'],
});

/* Yta 3 — preview-setup → staging-preview */

fall('R3  yta 3: anropet borta ur tests/preview/preflight.setup.ts → RÖD', {
  forbered: () =>
    mutera('tests/preview/preflight.setup.ts', (k) =>
      utanForstaRadenMed(k, "kravStagingLedigt('lokal Playwright-körning (preview-setup)')"),
    ),
  kod: 1,
  kravText: ['staging-preview', 'Anropsraden är borta'],
});

fall('R3b yta 3: dependencyn borta för staging-preview → RÖD', {
  forbered: () => mutera(CONFIG, (k) => utanForstaRadenMed(k, "dependencies: ['preview-setup'],")),
  kod: 1,
  kravText: ['staging-preview', 'Dependencyn ser ut att ha tappats'],
});

/* Yta 4 + 5 — Node-skriptens main() */

fall('R4  yta 4: anropet borta ur purge-skriptets main() → RÖD', {
  forbered: () =>
    mutera('scripts/purge-staging-sentinels.mjs', (k) =>
      utanForstaRadenMed(k, "kravStagingLedigt('lokal purge:staging')"),
    ),
  kod: 1,
  kravText: ['scripts/purge-staging-sentinels.mjs', 'anropas INTE i main()'],
});

fall('R5  yta 5: anropet borta ur seed-skriptets main() → RÖD', {
  forbered: () =>
    mutera('scripts/seed-review-fixture.mjs', (k) =>
      utanForstaRadenMed(k, "kravStagingLedigt('lokal seed:review')"),
    ),
  kod: 1,
  kravText: ['scripts/seed-review-fixture.mjs', 'anropas INTE i main()'],
});

/* De sätt en hake försvinner utan att raden raderas */

fall('R6  anropet BORTKOMMENTERAT på Playwright-sidan → RÖD (inte lurad av kommentar)', {
  forbered: () =>
    mutera('tests/api/auth.setup.ts', (k) =>
      bortkommenteraForstaRadenMed(k, "kravStagingLedigt('lokal Playwright-körning (api-setup)')"),
    ),
  kod: 1,
  kravText: ['Anropsraden är borta'],
});

fall('R7  anropet BORTKOMMENTERAT på Node-sidan → RÖD', {
  forbered: () =>
    mutera('scripts/purge-staging-sentinels.mjs', (k) =>
      bortkommenteraForstaRadenMed(k, "kravStagingLedigt('lokal purge:staging')"),
    ),
  kod: 1,
  kravText: ['anropas INTE i main()'],
});

fall('R8  anropet flyttat UT ur main(), importen kvar → RÖD', {
  forbered: () =>
    mutera('scripts/purge-staging-sentinels.mjs', (k) => {
      const utanAnrop = utanForstaRadenMed(k, "kravStagingLedigt('lokal purge:staging')");
      return utanAnrop.replace(
        "import { kravStagingLedigt } from './lib/staging-preflight.mjs';",
        "import { kravStagingLedigt } from './lib/staging-preflight.mjs';\nkravStagingLedigt('flyttad ut ur main');",
      );
    }),
  kod: 1,
  kravText: ['anropas INTE i main()'],
});

/* Sjätte-yta-nätet (AC #5) */

fall('R9  nytt Playwright-projekt, oklassat → RÖD med instruktion', {
  forbered: () =>
    mutera(CONFIG, (k) =>
      k.replace(
        API_PURE_ANKARE,
        `    {\n      name: 'ny-staging-yta',\n      testDir: './tests/api',\n      testMatch: '**/*.staging.test.ts',\n    },\n${API_PURE_ANKARE}`,
      ),
    ),
  kod: 1,
  kravText: ['`ny-staging-yta` är OKLASSAT', 'undantagen'],
});

fall('R14 nytt projekt bakom ODEKLARERAD env-flagga (syns bara i configens text) → RÖD', {
  forbered: () =>
    mutera(CONFIG, (k) =>
      k.replace(
        API_PURE_ANKARE,
        `    ...(process.env.MM_T91_ODEKLARERAD === '1'\n      ? [\n          {\n            name: 'gomd-staging-yta',\n            testDir: './tests/api',\n          },\n        ]\n      : []),\n${API_PURE_ANKARE}`,
      ),
    ),
  kod: 1,
  kravText: ['`gomd-staging-yta` är OKLASSAT'],
});

fall(
  'G1  nytt projekt som ÄR klassat som undantagen → GRÖN (vakten fäller inte på VARJE ändring)',
  {
    forbered: () => {
      mutera(CONFIG, (k) =>
        k.replace(
          API_PURE_ANKARE,
          `    {\n      name: 'ny-hermetisk-yta',\n      testDir: './tests/a11y',\n    },\n${API_PURE_ANKARE}`,
        ),
      );
      mutera(POLICY, (k) => {
        const p = JSON.parse(k);
        p.playwrightProjekt.push({
          namn: 'ny-hermetisk-yta',
          klass: 'undantagen',
          skäl: 'Testfixtur (TASK-91 G1): hermetisk yta som aldrig når staging-basen.',
        });
        return `${JSON.stringify(p, null, 2)}\n`;
      });
    },
    kod: 0,
    // Talet är EGEN repots reella projektantal (policyn) + 1 testfixtur-
    // projekt som `forbered()` lägger till ovan — inte handplockat.
    // TASK-131/ADR-094 lade `webblasarbeteende` till policyn (12 → 13 reella
    // projekt), vilket höjde detta tal 13 → 14 → 15 (TASK-126.4 la manifest-screenshots). Räkna om ur
    // `.staging-preflight-wiring-policy.json`s `playwrightProjekt`-lista vid
    // nästa klassad tillskott i stället för att ärva talet.
    kravText: ['15 projekt klassade, 0 oklassade'],
  },
);

fall('R10 nytt scripts/-skript med staging-markör, oklassat → RÖD (fångas AUTOMATISKT)', {
  forbered: () =>
    laggTill(
      'scripts/ny-staging-yta.mjs',
      'const token = process.env.STAGING_AIRTABLE_TOKEN;\nconsole.log(token);\n',
    ),
  kod: 1,
  kravText: ['scripts/ny-staging-yta.mjs', 'bär staging-markören', 'STAGING_AIRTABLE_TOKEN'],
});

fall('G2  nytt scripts/-skript UTAN markör → GRÖN (upptäckten är inte en filräknare)', {
  forbered: () => laggTill('scripts/ny-oskyldig.mjs', "console.log('rör ingen bas');\n"),
  kod: 0,
});

fall('R11 policy-post utan motsvarighet i configen → RÖD', {
  forbered: () =>
    mutera(POLICY, (k) => {
      const p = JSON.parse(k);
      p.playwrightProjekt.push({ namn: 'sedan-lange-borttaget', klass: 'undantagen', skäl: 'x' });
      return `${JSON.stringify(p, null, 2)}\n`;
    }),
  kod: 1,
  kravText: ['`sedan-lange-borttaget` motsvarar inget projekt'],
});

fall('R15 bärare utan kvarvarande konsument i policyn → RÖD', {
  // Bäraren bekräftas GENOM konsumenternas dependency-kedjor. Slutar en bärare
  // vara refererad blir den obevisad — och en obevisad bärare är en yta vakten
  // tror sig täcka utan att göra det. Klassbytet (konsument → undantagen)
  // väljer felet rent: projektet är fortfarande klassat, så OKLASSAT-nätet
  // fyrar inte och bärar-grenen prövas ensam.
  forbered: () =>
    mutera(POLICY, (k) => {
      const p = JSON.parse(k);
      const post = p.playwrightProjekt.find((x) => x.namn === 'staging-preview');
      post.klass = 'undantagen';
      post.skäl = 'Testfixtur (TASK-91 R15).';
      return `${JSON.stringify(p, null, 2)}\n`;
    }),
  kod: 1,
  kravText: ['Bäraren `preview-setup` bekräftades inte'],
});

/* Fail-closed */

fall('R12 policy-filen borta → 64, aldrig grön', {
  forbered: () => taBort(POLICY),
  kod: 64,
  kravText: ['Fail-closed'],
});

fall('R13 tom policy → 64, aldrig grön', {
  forbered: () => mutera(POLICY, () => '{}\n'),
  kod: 64,
  kravText: ['ofullständig'],
});

/* ── TASK-115: G0-stegets bounded retry (listaProjektMedRetry) ───────────
 *
 * Tvåsidigt bevis (kortets AC #2), mot listaProjektMedRetry() DIREKT — inte
 * spawnSync mot sandlådan, eftersom funktionen är parametriserad över
 * (repo, cli, projekt) och därmed oberoende av wiring-läsningen G0–R15
 * prövar. En minimal fejk-CLI i /tmp ersätter playwright: den ignorerar sina
 * argv (samma anropsform vakten faktiskt använder: `test --project=X --list
 * --reporter=json`) och styrs enbart av en räknarfil.
 */

/** Skriver en fejk-"playwright"-CLI som faller på de `falliaForsok` första
 * anropen och därefter svarar med ett tomt men GILTIGT --list-svar. Sätt
 * `falliaForsok` >= PLAYWRIGHT_LIST_FORSOK för att simulera ett
 * deterministiskt/uttömt fel som aldrig läks. */
function skrivFejkCli(sokvag, falliaForsok) {
  const raknarfil = `${sokvag}.raknare`;
  rmSync(raknarfil, { force: true });
  writeFileSync(
    sokvag,
    [
      "import { existsSync, readFileSync, writeFileSync } from 'node:fs';",
      `const RAKNARFIL = ${JSON.stringify(raknarfil)};`,
      "let n = existsSync(RAKNARFIL) ? Number(readFileSync(RAKNARFIL, 'utf-8')) : 0;",
      'n += 1;',
      'writeFileSync(RAKNARFIL, String(n));',
      `if (n <= ${falliaForsok}) {`,
      "  process.stderr.write('[testfixtur T115] simulerat playwright --list-fel, försök ' + n + '\\n');",
      '  process.exit(1);',
      '}',
      "process.stdout.write(JSON.stringify({ config: { rootDir: '/tmp', projects: [] }, suites: [], errors: [] }));",
      'process.exit(0);',
      '',
    ].join('\n'),
  );
  return raknarfil;
}

async function tAsync(namn, fn) {
  try {
    await fn();
    console.log(`✅ ${namn}`);
  } catch (fel) {
    rott += 1;
    console.error(`❌ ${namn}: ${fel.message}`);
  }
}

await tAsync(
  'G3  TASK-115: playwright --list TRANSIENT fel (1:a försöket faller, 2:a lyckas) → grönt, exakt 2 anrop',
  async () => {
    const cli = '/tmp/t115-fake-playwright-cli-transient.mjs';
    const raknarfil = skrivFejkCli(cli, 1);
    try {
      const rapport = await listaProjektMedRetry('/tmp', cli, { namn: 'test-transient' });
      assert.deepEqual(rapport.suites, []);
      assert.equal(
        Number(readFileSync(raknarfil, 'utf-8')),
        2,
        'ska ha gjort exakt två anrop (1 fel + 1 lyckat) — inte 1, inte 3',
      );
    } finally {
      rmSync(cli, { force: true });
      rmSync(raknarfil, { force: true });
    }
  },
);

await tAsync(
  'R16 TASK-115: playwright --list faller VARJE försök (deterministiskt/uttömt) → kastar, aldrig grönt',
  async () => {
    const cli = '/tmp/t115-fake-playwright-cli-persistent.mjs';
    const raknarfil = skrivFejkCli(cli, 99); // 99 >> PLAYWRIGHT_LIST_FORSOK — faller ALLTID inom bounded retry
    try {
      await assert.rejects(() => listaProjektMedRetry('/tmp', cli, { namn: 'test-persistent' }));
      assert.equal(
        Number(readFileSync(raknarfil, 'utf-8')),
        PLAYWRIGHT_LIST_FORSOK,
        `ska ha gjort exakt PLAYWRIGHT_LIST_FORSOK (${PLAYWRIGHT_LIST_FORSOK}) anrop — bounded, inte oändligt`,
      );
    } finally {
      rmSync(cli, { force: true });
      rmSync(raknarfil, { force: true });
    }
  },
);

/* ── Summering ──────────────────────────────────────────────────────────── */

if (rott > 0) {
  console.error(`\n${rott} testfall RÖDA`);
  process.exit(1);
}
console.log('\nAlla wiring-vaktens testfall gröna.');
