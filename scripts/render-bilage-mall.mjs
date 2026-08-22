#!/usr/bin/env node
// render-bilage-mall.mjs — TASK-279 § AC #3, granskningsväg
//
// Fyller en av de tre bilage-mallarna (docs/mallar/bilagor/*.html) med riktig
// eventdata ur en fixture-JSON och skriver ut en fristående HTML-fil som kan
// öppnas direkt i webbläsaren — ingen server, ingen extern tjänst.
//
// Ren strängersättning av {{tokenNamn}} — INTE en mallmotor. Det är ett
// medvetet minimalt val: skivan bygger ingen renderings-integration (se
// kortets § "Vad som INTE görs här"), så en riktig mallmotor hör hemma i den
// framtida skivan som faktiskt kopplar ihop mallen med en renderare.
//
// Användning:
//   node scripts/render-bilage-mall.mjs bekraftelsebilaga
//   node scripts/render-bilage-mall.mjs deltagarinformation
//   node scripts/render-bilage-mall.mjs kvitto
//   node scripts/render-bilage-mall.mjs bekraftelsebilaga --data egen-fixture.json
//
// Output: docs/mallar/bilagor/<mall>.granskning.html — SAMMA katalog som
// mallen (medvetet, inte en undermapp: mallens relativa sökvägar till CSS/
// bilder/typsnitt gäller då oförändrat för utdatan också, i stället för att
// varje sökväg måste räknas om en nivå extra). Gitignorerat mönster, se
// .gitignore — genererat innehåll checkas aldrig in, samma princip som
// dist/ eller coverage/.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MALLROT = join(__dirname, '..', 'docs', 'mallar', 'bilagor');
const KANDA_MALLAR = ['bekraftelsebilaga', 'deltagarinformation', 'kvitto'];

function larsArgv() {
  const args = process.argv.slice(2);
  const mall = args[0];
  const dataFlagIndex = args.indexOf('--data');
  const dataPath = dataFlagIndex !== -1 ? args[dataFlagIndex + 1] : null;
  return { mall, dataPath };
}

function main() {
  const { mall, dataPath } = larsArgv();

  if (!mall || !KANDA_MALLAR.includes(mall)) {
    console.error(
      `Användning: node scripts/render-bilage-mall.mjs <${KANDA_MALLAR.join('|')}> [--data <fixture.json>]`,
    );
    process.exit(1);
  }

  const mallPath = join(MALLROT, `${mall}.html`);
  const fixturePath = dataPath
    ? resolve(dataPath)
    : join(MALLROT, 'fixtures', `${mall}.exempel.json`);

  const mallKalla = readFileSync(mallPath, 'utf8');
  const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));

  let rendered = mallKalla;
  for (const [nyckel, varde] of Object.entries(fixture)) {
    if (nyckel.startsWith('_')) continue; // metadata-fält, t.ex. "_kalla" — inte en mall-token
    const token = new RegExp(`{{\\s*${nyckel}\\s*}}`, 'g');
    rendered = rendered.replaceAll(token, String(varde));
  }

  const kvarvarande = rendered.match(/{{\s*[\w]+\s*}}/g);
  if (kvarvarande) {
    console.warn(
      `VARNING: ${kvarvarande.length} ofyllda token kvar i utdatan: ${[...new Set(kvarvarande)].join(', ')}`,
    );
  }

  const utPath = join(MALLROT, `${mall}.granskning.html`);
  writeFileSync(utPath, rendered, 'utf8');

  console.log(`Renderad: ${utPath}`);
  console.log(`Öppna direkt i webbläsaren: open "${utPath}"`);
}

main();
