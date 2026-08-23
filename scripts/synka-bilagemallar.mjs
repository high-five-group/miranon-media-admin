#!/usr/bin/env node
// scripts/synka-bilagemallar.mjs — TASK-309.4, ADR-125 § Beslut 4 + § Updates
// 2026-08-23 ("Vald väg framåt: (c), genererade TS-strängmoduler").
//
// VARFÖR TS-STRÄNGMODULER, INTE `static_files` (den ADR-125 § 4 ursprungligen
// föreslog): TASK-309.1s minimaltest (skiva 0) bevisade SKARPT att
// `static_files` + `Deno.readFile` FALLERAR i denna miljös deploy-väg
// (API-bundling, maskinen saknar Docker) — `NotFound` vid runtime trots
// lyckad deploy. Text-import (`with { type: 'text' }`) fallerar HÅRDARE
// (deployen själv nekas, 400). Genererade TS-moduler (vanliga `export
// const`-satser, samma mekanism som VARJE `_shared/*.ts`-import redan
// använder) är den enda av de tre vägarna som mättes fungera. Se
// `docs/decisions/ADR-125-bilagornas-modell-och-promoveringsvag.md` §
// Updates 2026-08-23 för de tre mätningarna i sin helhet.
//
// VAD SKRIPTET GÖR: läser
//   - `docs/mallar/bilagor/*.html` och `*.css` (ENDAST toppnivån — inte
//     `fixtures/` eller den gitignorerade `lokala-typsnitt/`)
//   - `public/fonts/bilagor/*.ttf` (de sex FRIA typsnittsfilerna — Cavolini
//     bundlas ALDRIG, se docs/mallar/bilagor/README.md § Fontstrategin)
//   - varje `public/…`-bild som NÅGON av html-mallarna refererar via
//     `<img src="../../../public/…">` (logga, ikoner, bokomslag) —
//     AUTO-UPPTÄCKT ur mallarnas eget innehåll, ingen hårdkodad lista att
//     glömma uppdatera när en mall får en ny bild
// och skriver EN TS-modul per fil till `supabase/functions/_shared/mallar/`
// — `export const <namn>: string = "…";` (JSON.stringify-escapad, byte-
// identisk vid avkodning mot källan). Filnamnen är MEDVETET distinkta från
// TASK-309.1s regressionsvakt-fixturer (`minimaltest.text.ts`,
// `carlito-regular.base64.ts`, `minimaltest.html`, `Carlito-Regular.ttf`) —
// se `<slot>Suffix` nedan — så synken ALDRIG skriver över eller tar bort
// dem (AC #3 i TASK-309.1: "test-static-files rivs INTE").
//
// LÄGE:
//   node scripts/synka-bilagemallar.mjs          — skriver filerna
//   node scripts/synka-bilagemallar.mjs --check  — skriver INGET; regenererar
//     i minnet och jämför mot vad som faktiskt ligger på disk. Exit 0 = i
//     paritet, exit 1 = drift (rader skrivs ut per skillnad). Detta ÄR
//     `scripts/check-mallparitet.sh`s hela grind — EN generator, TVÅ lägen,
//     ingen fjärde handhållen kopia av jämförelselogiken (samma disciplin
//     som `scripts/fas4-prod-deploy.sh --kontrollera/--deploya`).
//
// Ny mallfil i `docs/mallar/bilagor/` (t.ex. TASK-309.5:s kvitto-koppling)
// kräver INGEN ändring av detta skript — globen är generisk.

import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPOROT = join(__dirname, '..');

// Katalogerna är ÖVERSTYRBARA via env — ENDA syftet är
// scripts/test-check-mallparitet.sh:s sandboxade tvåsidiga bevis (en
// fixtur-katalogträd i mktemp, aldrig repots riktiga docs/mallar/bilagor/).
// Skarp körning (sync ELLER --check) sätter ALDRIG dessa — default är
// alltid de riktiga repo-sökvägarna.
const MALLKALLA_DIR =
  process.env.MALLPARITET_MALLKALLA_DIR ?? join(REPOROT, 'docs', 'mallar', 'bilagor');
const FONT_DIR = process.env.MALLPARITET_FONT_DIR ?? join(REPOROT, 'public', 'fonts', 'bilagor');
const PUBLIC_DIR = process.env.MALLPARITET_PUBLIC_DIR ?? join(REPOROT, 'public');
const MALKOPIA_DIR =
  process.env.MALLPARITET_MALKOPIA_DIR ??
  join(REPOROT, 'supabase', 'functions', '_shared', 'mallar');

const MIME_PER_EXT = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

// Delar en enskild bindestrecks-del vidare på gemener→VERSAL-gränser
// ("BoldItalic" → ["Bold", "Italic"], "ComicNeue" → ["Comic", "Neue"]).
// UPPTÄCKT SKARPT (TASK-309.4): utan detta gav "Carlito-BoldItalic" →
// `carlitoBolditalicFontBase64` (gement "i" i "italic") och
// "ComicNeue-Bold" → `comicneueBoldFontBase64` (gement "n" i "neue") — INTE
// vad en människa naturligt hade skrivit för hand i en konsumerande import,
// vilket orsakade ett SKARPT deploy-boot-fel (`BOOT_ERROR`, "does not
// provide an export named") när `_shared/mall-render.ts`s handskrivna
// importnamn (`carlitoBoldItalicFontBase64`, `comicNeueBoldFontBase64`)
// inte matchade de FAKTISKT genererade exporten. Se
// scripts/test-check-mallparitet.sh:s "blandad Versal/gemen"-fall för det
// tvåsidiga beviset.
function delaPaVersalGranser(del) {
  return del.match(/[A-Z]+(?=[A-Z][a-z])|[A-Z]?[a-z]+|[A-Z]+|[0-9]+/g) ?? [del];
}

/** "bilaga-delad" | "Carlito-Regular" | "Carlito-BoldItalic" →
 *  "bilagaDelad" | "carlitoRegular" | "carlitoBoldItalic". */
function tillCamelCase(basnamn) {
  const delar = basnamn.split(/[-_]/).filter(Boolean).flatMap(delaPaVersalGranser);
  return delar
    .map((del, i) => {
      const lower = del.toLowerCase();
      return i === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
}

// Gitignorerade granskningsfiler (`<mall>.granskning.html`,
// `scripts/render-bilage-mall.mjs`) delar KATALOG med de riktiga mallarna
// och delar SLUTET av ändelsen ("…granskning.html" ändar på ".html") —
// utan denna uteslutning skulle en lokal `npm run mall:granska`-körning
// smyga in en tredje, oavsiktlig .html.ts-modul per mall nästa gång synken
// körs. Uteslut även dolda filer (macOS `.DS_Store` etc.).
function arGranskningsartefakt(filnamn) {
  return filnamn.endsWith('.granskning.html') || filnamn.startsWith('.');
}

function listaToppnivaFiler(dir, ext) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(ext) && !arGranskningsartefakt(e.name))
    .map((e) => e.name)
    .sort();
}

/** Alla unika `public/…`-bildsökvägar som NÅGON html-mall refererar. */
function hittaReferaradeBilder(htmlFilnamn) {
  const funna = new Set();
  const regex = /<img\s+[^>]*?src="\.\.\/\.\.\/\.\.\/public\/([^"]+)"/g;
  for (const filnamn of htmlFilnamn) {
    const kalla = readFileSync(join(MALLKALLA_DIR, filnamn), 'utf8');
    for (const match of kalla.matchAll(regex)) {
      funna.add(match[1]);
    }
  }
  return [...funna].sort();
}

function genereraTextModul(exportNamn, innehall) {
  return `// AUTOGENERERAD av scripts/synka-bilagemallar.mjs — redigera ALDRIG för hand.\n// Källa: docs/mallar/bilagor/ (se scripts/check-mallparitet.sh för paritetsgrinden).\nexport const ${exportNamn}: string = ${JSON.stringify(innehall)};\n`;
}

function genereraBase64Modul(exportNamn, buffer) {
  return genereraTextModul(exportNamn, buffer.toString('base64'));
}

function genereraDataUriModul(exportNamn, buffer, mime) {
  const dataUri = `data:${mime};base64,${buffer.toString('base64')}`;
  return genereraTextModul(exportNamn, dataUri);
}

/**
 * Bygger { filnamn (i _shared/mallar/) → TS-modulinnehåll } för ALLA
 * källfiler skriptet känner till. REN funktion (ingen skrivning) — både
 * sync-läget och --check-läget använder SAMMA karta.
 */
function byggMalKarta() {
  const karta = new Map();

  const htmlFilnamn = listaToppnivaFiler(MALLKALLA_DIR, '.html');
  for (const filnamn of htmlFilnamn) {
    const basnamn = filnamn.slice(0, -'.html'.length);
    const innehall = readFileSync(join(MALLKALLA_DIR, filnamn), 'utf8');
    const exportNamn = `${tillCamelCase(basnamn)}Html`;
    karta.set(`${basnamn}.html.ts`, genereraTextModul(exportNamn, innehall));
  }

  const cssFilnamn = listaToppnivaFiler(MALLKALLA_DIR, '.css');
  for (const filnamn of cssFilnamn) {
    const basnamn = filnamn.slice(0, -'.css'.length);
    const innehall = readFileSync(join(MALLKALLA_DIR, filnamn), 'utf8');
    const exportNamn = `${tillCamelCase(basnamn)}Css`;
    karta.set(`${basnamn}.css.ts`, genereraTextModul(exportNamn, innehall));
  }

  const fontFilnamn = listaToppnivaFiler(FONT_DIR, '.ttf');
  for (const filnamn of fontFilnamn) {
    const basnamn = filnamn.slice(0, -'.ttf'.length);
    const buffer = readFileSync(join(FONT_DIR, filnamn));
    const exportNamn = `${tillCamelCase(basnamn)}FontBase64`;
    karta.set(`${basnamn}.font.ts`, genereraBase64Modul(exportNamn, buffer));
  }

  const bildSokvagar = hittaReferaradeBilder(htmlFilnamn);
  for (const relSokvag of bildSokvagar) {
    const absSokvag = join(PUBLIC_DIR, relSokvag);
    const ext = extname(relSokvag).toLowerCase();
    const mime = MIME_PER_EXT[ext];
    if (!mime) {
      throw new Error(`Okänd bildtyp för self-bearing-inbäddning: ${relSokvag} (${ext})`);
    }
    // basename(relSokvag), INTE relSokvag självt — den genererade filen
    // ligger platt i _shared/mallar/ oavsett vilken undermapp bilden bor i
    // under public/ (idag alla direkt i public/, men globen är generisk).
    // `basename()` importerad lokalt (node:path) för att undvika en extra
    // toppnivå-import bara för detta enda anrop.
    const basnamn = basename(relSokvag).slice(0, -ext.length);
    const buffer = readFileSync(absSokvag);
    const exportNamn = `${tillCamelCase(basnamn)}ImageDataUri`;
    karta.set(`${basnamn}.image.ts`, genereraDataUriModul(exportNamn, buffer, mime));
  }

  return karta;
}

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function main() {
  const checkMode = process.argv.includes('--check');
  const karta = byggMalKarta();

  mkdirSync(MALKOPIA_DIR, { recursive: true });

  if (!checkMode) {
    for (const [filnamn, innehall] of karta) {
      writeFileSync(join(MALKOPIA_DIR, filnamn), innehall, 'utf8');
    }
    console.log(`Synkade ${karta.size} mallfiler → ${MALKOPIA_DIR}`);
    return;
  }

  const avvikelser = [];
  for (const [filnamn, forvantat] of karta) {
    const disksokvag = join(MALKOPIA_DIR, filnamn);
    let faktiskt;
    try {
      faktiskt = readFileSync(disksokvag, 'utf8');
    } catch {
      avvikelser.push(
        `SAKNAS: ${filnamn} (kör 'node scripts/synka-bilagemallar.mjs' för att skapa den)`,
      );
      continue;
    }
    if (sha256(faktiskt) !== sha256(forvantat)) {
      avvikelser.push(
        `AVVIKER: ${filnamn} (disk matchar inte källan — kör 'node scripts/synka-bilagemallar.mjs')`,
      );
    }
  }

  // Motsatt riktning: en genererad fil på disk som INTE längre motsvarar
  // någon källfil (mallen togs bort) — bevisar att grinden prövar BÅDA
  // riktningarna, inte bara "källan är nyare". De kända regressionsvakt-
  // fixturerna (TASK-309.1) undantas explicit.
  const kandaRegressionsvaktFiler = new Set([
    'minimaltest.text.ts',
    'carlito-regular.base64.ts',
    'minimaltest.html',
    'Carlito-Regular.ttf',
  ]);
  let diskFiler = [];
  try {
    diskFiler = readdirSync(MALKOPIA_DIR, { withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => e.name);
  } catch {
    diskFiler = [];
  }
  for (const filnamn of diskFiler) {
    if (kandaRegressionsvaktFiler.has(filnamn)) continue;
    if (!karta.has(filnamn)) {
      avvikelser.push(`FÖRÄLDRALÖS: ${filnamn} (ingen källfil producerar längre denna modul)`);
    }
  }

  if (avvikelser.length > 0) {
    console.error('Mallparitet BRUTEN:');
    for (const rad of avvikelser) console.error(`  - ${rad}`);
    process.exit(1);
  }

  console.log(`Mallparitet OK — ${karta.size} genererade moduler matchar källan.`);
}

main();
