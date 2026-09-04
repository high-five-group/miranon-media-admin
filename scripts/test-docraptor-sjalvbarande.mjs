#!/usr/bin/env node
// scripts/test-docraptor-sjalvbarande.mjs — självtest för
// scripts/docraptor-sjalvbarande.mjs (TASK-301).
//
// Bevisar den regel TASK-301 inför: en `url(...)` i CSS:en som INTE går
// att hämta från disk NEUTRALISERAS till `local("")` — den lämnas INTE
// längre orörd. En orörd referens är exakt 422-felklassen Prince fäller
// HELA DocRaptor-jobbet på (se skriptets eget filhuvud, § inlinaCssUrls);
// en `local("")` är en giltig men aldrig-matchande @font-face-källa som
// bara faller tillbaka i CSS:ens egen fontstack.
//
// FYRA FALL:
//   (a) ohämtbar font-url() → local("") — och den RÅA sökvägen ska INTE
//       längre finnas kvar i utdatan (RÖTT-sidan om skriptet regredierar
//       till den gamla "lämna orörd"-varianten)
//   (b) hämtbar font-url() → data-URI (GRÖNT-sidan, regressionsskydd mot
//       att fixen av misstag neutraliserar VARJE url(), inte bara de
//       ohämtbara)
//   (c) saknad <img src> är fortfarande ett HÅRT fel — asymmetrin mot (a):
//       en bild har ingen CSS-fallback-mekanism, samma disciplin som
//       EF-lagrets inlinaBilder (supabase/functions/_shared/mall-render.ts)
//   (d) mätningen är synlig: en neutraliserad url() loggas på stderr med
//       både den råa sökvägen och CSS-filens namn
//
// Sandboxad i egen mktemp-katalog, ingen nätverkstrafik — importerar
// gorSjalvbarande direkt (samma "pura funktioner importeras direkt"-
// konvention som scripts/test-review-loop.mjs sektion A–D och
// scripts/test-purge-staging-sentinels.mjs).
//
// Kör: node scripts/test-docraptor-sjalvbarande.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.

import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gorSjalvbarande } from './docraptor-sjalvbarande.mjs';

let failed = 0;
async function t(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`❌ ${name}: ${err.message}`);
  }
}

function mkFixture() {
  return mkdtempSync(join(tmpdir(), 'task301-docraptor-sjalvbarande-'));
}

// Fångar console.error-anrop under `fn()`, återställer ALLTID — även vid
// kastat fel (annars läcker spionen till nästa test och maskerar dess
// egna felmeddelanden).
async function fangaStderr(fn) {
  const rader = [];
  const original = console.error;
  console.error = (...args) => rader.push(args.join(' '));
  try {
    await fn();
  } finally {
    console.error = original;
  }
  return rader;
}

await t('(a) ohämtbar font-url() neutraliseras till local(""), lämnas INTE orörd', async () => {
  const dir = mkFixture();
  writeFileSync(
    join(dir, 'styles.css'),
    '@font-face {\n  font-family: \'Saknas\';\n  src: url("saknas.ttf") format("truetype");\n}\n',
  );
  writeFileSync(
    join(dir, 'granskning.html'),
    '<html><head><link rel="stylesheet" href="styles.css" /></head><body></body></html>',
  );
  const html = await gorSjalvbarande(join(dir, 'granskning.html'));
  assert.match(html, /local\(""\)/, 'förväntade local("") i utdatan');
  assert.doesNotMatch(
    html,
    /saknas\.ttf/,
    'den råa sökvägen "saknas.ttf" ska INTE finnas kvar (en orörd url() är den gamla, felaktiga formen)',
  );
});

await t(
  '(b) hämtbar font-url() blir en data-URI (regressionsskydd — fixen neutraliserar inte allt)',
  async () => {
    const dir = mkFixture();
    writeFileSync(join(dir, 'present.ttf'), Buffer.from('dummy-font-bytes'));
    writeFileSync(
      join(dir, 'styles.css'),
      '@font-face {\n  font-family: \'Present\';\n  src: url("present.ttf") format("truetype");\n}\n',
    );
    writeFileSync(
      join(dir, 'granskning.html'),
      '<html><head><link rel="stylesheet" href="styles.css" /></head><body></body></html>',
    );
    const html = await gorSjalvbarande(join(dir, 'granskning.html'));
    assert.match(
      html,
      /url\("data:font\/ttf;base64,/,
      'förväntade en data:-URI för den hämtbara fonten',
    );
    assert.doesNotMatch(html, /local\(""\)/, 'ingen local("") förväntad när fonten faktiskt finns');
  },
);

await t('(c) saknad <img src> är fortfarande ett HÅRT fel (asymmetrin mot fonter)', async () => {
  const dir = mkFixture();
  writeFileSync(
    join(dir, 'granskning.html'),
    '<html><head></head><body><img src="finns-inte.png" /></body></html>',
  );
  await assert.rejects(
    () => gorSjalvbarande(join(dir, 'granskning.html')),
    /Bild saknas/,
    'förväntade ett kastat fel för en saknad bild — inte en tyst neutralisering',
  );
});

await t('(d) mätningen är synlig: neutraliserad url() loggas på stderr med filnamn', async () => {
  const dir = mkFixture();
  writeFileSync(
    join(dir, 'styles.css'),
    '@font-face {\n  font-family: \'Saknas\';\n  src: url("saknas.ttf") format("truetype");\n}\n',
  );
  writeFileSync(
    join(dir, 'granskning.html'),
    '<html><head><link rel="stylesheet" href="styles.css" /></head><body></body></html>',
  );
  const rader = await fangaStderr(() => gorSjalvbarande(join(dir, 'granskning.html')));
  const traffad = rader.some((r) => r.includes('saknas.ttf') && r.includes('styles.css'));
  assert.ok(
    traffad,
    `förväntade en stderr-rad med både "saknas.ttf" och "styles.css", fick: ${JSON.stringify(rader)}`,
  );
});

process.on('beforeExit', () => {
  if (failed > 0) {
    console.error(`\ntest-docraptor-sjalvbarande: ${failed} test(er) RÖDA`);
    process.exit(1);
  }
  console.log('\ntest-docraptor-sjalvbarande: alla tester gröna.');
});
