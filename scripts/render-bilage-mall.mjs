#!/usr/bin/env node
// render-bilage-mall.mjs — TASK-279 § AC #3, granskningsväg. Uppgraderad i
// TASK-309.4 (ADR-125 § Beslut 4) från ren strängersättning till EN RIKTIG
// mallmotor (Eta) för de två mallar som blivit Eta-syntax
// (bekraftelsebilaga/deltagarinformation) — den framtida skivan
// filhuvudet tidigare pekade mot ("en riktig mallmotor hör hemma i den
// framtida skivan som faktiskt kopplar ihop mallen med en renderare") ÄR
// denna skiva.
//
// SAMMA ETA-KONFIG SOM SKARP DRIFT: `new Eta({ autoEscape: true, varName:
// 'data' })` — identisk med `supabase/functions/_shared/mall-render.ts`s
// instans, så en lokal granskning fylls PRECIS som PDF:en skulle bli
// (minus self-bearing-inbäddningen och DocRaptor-anropet, som kräver
// nätverk/en riktig funktionskörning — se AC #4:s staging-test för det).
//
// kvitto.html är ÄNNU INTE konverterat (TASK-309.5:s scope) och behåller
// den GAMLA {{token}}-strängersättningen nedan — AUTO-DETEKTERAD per mall
// (Eta-syntax → Eta-vägen, annars → legacy-vägen), ingen manuell flagga.
//
// Fixturerna (`docs/mallar/bilagor/fixtures/*.exempel.json`) för de
// Eta-konverterade mallarna bär numera EXAKT samma platta form som
// `_shared/mall-data.ts`s `BekraftelseMallData`/`DeltagarinfoMallData` —
// se den filens typdefinitioner. Skriptet renderar fixturen DIREKT genom
// Eta (bypasser `byggBekraftelseData`/`byggDeltagarinfoData`, som testas
// separat i `tests/api/mall-data.test.ts`) eftersom syftet här är att
// bevisa MALLEN + ETA-MOTORN, inte hela resolutionskedjan.
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
import { Eta } from 'eta';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MALLROT = join(__dirname, '..', 'docs', 'mallar', 'bilagor');
const KANDA_MALLAR = ['bekraftelsebilaga', 'deltagarinformation', 'kvitto'];

// Mallar som redan bär Eta-syntax (`<%= %>`/`<% %>`) — TASK-309.4. Ny mall
// som konverteras (t.ex. kvitto i TASK-309.5) läggs till här ELLER, ännu
// hellre, autodetekteras — se `arEtaMall` nedan, som INTE läser denna
// listan: den avgör per mallens FAKTISKA innehåll, så en glömd uppdatering
// av listan aldrig kan göra en redan konverterad mall tyst fel-renderad.
function arEtaMall(mallKalla) {
  return /<%[=~]?\s|<%\s*(if|for|const|let)\b/.test(mallKalla);
}

function larsArgv() {
  const args = process.argv.slice(2);
  const mall = args[0];
  const dataFlagIndex = args.indexOf('--data');
  const dataPath = dataFlagIndex !== -1 ? args[dataFlagIndex + 1] : null;
  return { mall, dataPath };
}

/*
 * SPEGLAR `fetMarkera` i supabase/functions/_shared/fet-markering.ts.
 *
 * Den filen är KANONISK — läs motiveringen där (whitelist i två steg: escapa
 * allt, återinför sedan enbart <strong>). Kopian finns här därför att detta
 * skript är ren Node (.mjs) och inte kan importera Deno-TypeScript, medan den
 * lokala granskningen ändå MÅSTE visa samma resultat som skarp drift — annars
 * granskar man en annan bilaga än den som skickas.
 *
 * De två får inte glida isär. `tests/api/mall-data.test.ts` läser BÅDA
 * filerna och jämför regex-litteralen tecken för tecken; ändras den ena utan
 * den andra blir testet rött.
 */
const FET_MONSTER = /\*\*([^*\n]+?)\*\*/g;

function fetMarkeraLokalt(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(FET_MONSTER, '<strong>$1</strong>');
}

function renderaMedEta(mallKalla, fixture) {
  const eta = new Eta({ autoEscape: true, varName: 'data' });
  // Beskrivningen förbehandlas som i mall-data.ts, så den lokala
  // granskningen visar fetstilen precis som den skarpa vägen gör.
  const data = Array.isArray(fixture?.beskrivning)
    ? { ...fixture, beskrivning: fixture.beskrivning.map(fetMarkeraLokalt) }
    : fixture;
  return eta.renderString(mallKalla, data);
}

function renderaMedLegacyStrangersattning(mallKalla, fixture) {
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
  return rendered;
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

  const rendered = arEtaMall(mallKalla)
    ? renderaMedEta(mallKalla, fixture)
    : renderaMedLegacyStrangersattning(mallKalla, fixture);

  const utPath = join(MALLROT, `${mall}.granskning.html`);
  writeFileSync(utPath, rendered, 'utf8');

  console.log(`Renderad: ${utPath}`);
  console.log(`Öppna direkt i webbläsaren: open "${utPath}"`);
}

main();
