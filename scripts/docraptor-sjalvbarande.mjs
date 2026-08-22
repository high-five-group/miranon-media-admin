#!/usr/bin/env node
// scripts/docraptor-sjalvbarande.mjs — S108 MARCUS-SEKVENS punkt 3 (ADR-119
// beslut 7, minimaltestet).
//
// Gör en renderad bilage-mall (docs/mallar/bilagor/<mall>.granskning.html,
// se scripts/render-bilage-mall.mjs) SJÄLVBÄRANDE inför ett DocRaptor-anrop:
//
//   - varje <link rel="stylesheet"> inlinas som <style>
//   - varje url(...) i den CSS:en (typsnitt) ersätts med en data:-URI
//   - varje <img src="..."> ersätts med en data:-URI
//
// VARFÖR: prototypens `renderaDokument()`
// (src/components/dokument/prototyp/GenereringsPrototyp.tsx rad ~542)
// inlinar redan stilmallen av FOUC-skäl i webbläsaren. DocRaptor har inget
// FOUC-problem (ingen målning sker interaktivt) men har ETT AV TVÅ VAL för
// externa tillgångar: en publik bas-URL (`prince_options.baseurl`, kräver
// att våra mallfiler är nåbara via HTTP från DocRaptors nät) eller en HELT
// självbärande HTML-sträng (inga externa hämtningar alls). Det senare är
// FÖRSTAHANDSVALET här — deterministiskt, inga CORS-/publik-URL-beroenden,
// och identiskt oavsett var anropet görs ifrån (S108 MARCUS-SEKVENS-
// uppdraget, ADR-119 beslut 7).
//
// Ren Node (fs/path), regex-baserad — INGEN DOM-parser, inga nya
// beroenden. Samma medvetet minimala val som render-bilage-mall.mjs gör för
// token-ersättning: detta är ett mätpass med en testharness, inte en
// produktionsmotor.
//
// Användning (CLI, för lokal inspektion):
//   node scripts/docraptor-sjalvbarande.mjs docs/mallar/bilagor/kvitto.granskning.html
//   → skriver test-results/docraptor/kvitto.sjalvbarande.html
//
// Programmatiskt (används av scripts/docraptor-minimaltest.mjs):
//   import { gorSjalvbarande, gorSjalvbarandeUtanTypsnitt } from './docraptor-sjalvbarande.mjs';
//   const html = await gorSjalvbarande(sokvag);

import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const REPOROT = join(__dirname, '..');

const MIME_PER_EXT = {
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

function mimeFor(sokvag) {
  return MIME_PER_EXT[extname(sokvag).toLowerCase()] ?? 'application/octet-stream';
}

async function tillDataUri(sokvag) {
  const buf = await readFile(sokvag);
  return `data:${mimeFor(sokvag)};base64,${buf.toString('base64')}`;
}

// Inlinar url(...)-referenser i en CSS-textmassa. `cssDir` är katalogen
// CSS-filen låg i (relativa url()-sökvägar räknas därifrån). Referenser som
// INTE hittas på disk lämnas ORÖRDA (fail-safe, samma princip som
// prototypens FOUC-fallback: en trasig data:-URI är värre än en url() som
// pekar ut i tomma intet men som CSS:en hanterar med sin egen fallback-
// font-stack). `uteslut` är en Set av absoluta sökvägar som MEDVETET ska
// hoppas över — negativt-typsnittstestet i docraptor-minimaltest.mjs
// använder detta för att simulera en saknad font utan att röra disk.
async function inlinaCssUrls(css, cssDir, uteslut = new Set()) {
  const urlRegex = /url\((['"]?)([^'")]+)\1\)/g;
  const ersattningar = [];
  for (const match of css.matchAll(urlRegex)) {
    const [helMatch, , rawPath] = match;
    if (rawPath.startsWith('data:') || rawPath.startsWith('http')) continue;
    const abs = resolve(cssDir, rawPath);
    if (uteslut.has(abs)) continue; // medvetet uteslutet — negativt test
    if (!existsSync(abs)) continue; // fail-safe: lämna url() orörd
    const dataUri = await tillDataUri(abs);
    ersattningar.push({ helMatch, ersattning: `url("${dataUri}")` });
  }
  let resultat = css;
  for (const { helMatch, ersattning } of ersattningar) {
    resultat = resultat.split(helMatch).join(ersattning);
  }
  return resultat;
}

// Gör en renderad HTML-fil (redan tokenfylld, se render-bilage-mall.mjs)
// självbärande: CSS inlinad, typsnitt + bilder som data:-URI:er.
//
// `uteslutTypsnitt` (valfri array av filnamn, t.ex. ["Carlito-Regular.ttf"])
// utesluter EXAKT de typsnittsfilerna ur inlining — resten av CSS:en
// (färger, layout, övriga @font-face) inlinas som vanligt. Används för
// negativ-typsnittstestet (AC/mätpunkt (a) i uppdraget): en PDF där Carlito
// MEDVETET saknas ska visa att renderaren faller tillbaka till en annan
// font, vilket bevisar att en NÄRVARANDE data-URI faktiskt bär fonten i det
// positiva fallet.
export async function gorSjalvbarande(htmlPath, { uteslutTypsnitt = [] } = {}) {
  const absHtmlPath = resolve(htmlPath);
  const htmlDir = dirname(absHtmlPath);
  let html = await readFile(absHtmlPath, 'utf8');

  const uteslutSet = new Set(
    uteslutTypsnitt.map((filnamn) => resolve(REPOROT, 'public', 'fonts', 'bilagor', filnamn)),
  );

  // Steg 1: varje <link rel="stylesheet" href="..."> → <style>…</style>
  const linkRegex = /<link\s+rel="stylesheet"\s+href="([^"]+)"\s*\/?>/g;
  const linkMatches = [...html.matchAll(linkRegex)];
  for (const m of linkMatches) {
    const [helMatch, href] = m;
    const cssAbs = resolve(htmlDir, href);
    if (!existsSync(cssAbs)) {
      throw new Error(`CSS saknas: ${cssAbs} (refererad från ${absHtmlPath})`);
    }
    const cssRaw = await readFile(cssAbs, 'utf8');
    const cssInlinad = await inlinaCssUrls(cssRaw, dirname(cssAbs), uteslutSet);
    html = html.replace(helMatch, `<style>\n${cssInlinad}\n</style>`);
  }

  // Steg 2: varje <img ... src="..."> → src="data:…"
  const imgRegex = /(<img\s+[^>]*?src=")([^"]+)(")/g;
  const imgMatches = [...html.matchAll(imgRegex)];
  for (const m of imgMatches) {
    const [helMatch, pre, src, post] = m;
    if (src.startsWith('data:') || src.startsWith('http')) continue;
    const imgAbs = resolve(htmlDir, src);
    if (!existsSync(imgAbs)) {
      throw new Error(`Bild saknas: ${imgAbs} (refererad från ${absHtmlPath})`);
    }
    const dataUri = await tillDataUri(imgAbs);
    html = html.replace(helMatch, `${pre}${dataUri}${post}`);
  }

  return html;
}

// CLI-läge: skriv self-bearing HTML till test-results/docraptor/ för lokal
// inspektion (`open`). Gitignorerat — samma princip som *.granskning.html.
async function main() {
  const [, , inPath, ...flags] = process.argv;
  if (!inPath) {
    console.error(
      'Användning: node scripts/docraptor-sjalvbarande.mjs <path-till-granskning.html> [--utan-typsnitt Carlito-Regular.ttf,Carlito-Bold.ttf]',
    );
    process.exit(1);
  }
  const utanTypsnittIdx = flags.indexOf('--utan-typsnitt');
  const uteslutTypsnitt =
    utanTypsnittIdx !== -1 ? flags[utanTypsnittIdx + 1].split(',').map((s) => s.trim()) : [];

  const html = await gorSjalvbarande(inPath, { uteslutTypsnitt });
  const utDir = join(REPOROT, 'test-results', 'docraptor');
  await mkdir(utDir, { recursive: true });
  const basnamn = inPath
    .split('/')
    .pop()
    .replace(/\.granskning\.html$/, '')
    .replace(/\.html$/, '');
  const utPath = join(utDir, `${basnamn}.sjalvbarande.html`);
  await writeFile(utPath, html, 'utf8');
  console.log(`Självbärande: ${utPath} (${Buffer.byteLength(html, 'utf8')} bytes)`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
