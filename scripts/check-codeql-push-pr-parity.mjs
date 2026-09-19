#!/usr/bin/env node
// check-codeql-push-pr-parity.mjs — TASK-464.2, review runda 1 fynd 2
// (warning) + review runda 2 fynd 2 (info, generalisering).
//
// ═══ VARFÖR SKRIPTET FINNS (runda 1) ═══
//
// Prosan i .listparitet-policy.conf och codeql.yml:s eget filhuvud påstod
// att YAML-ankaret (`&d0-paths`/`*d0-paths`) gör en avvikande push-kopia
// "strukturellt omöjlig" — det stämmer bara så länge ingen ERSÄTTER aliaset
// med en handskriven lista. Byter någon `*d0-paths` mot en egen array
// fångar INGEN grind det: check-listparitet.sh läser bara EN region (under
// `pull_request`, se paret `klassning-codeql-positiv`).
//
// Detta skript stänger den luckan SEMANTISKT — det parsar den FAKTISKA
// YAML-strukturen (inte text/markörer) och kräver DJUP LIKHET mot en
// referenslista, oavsett HUR listorna skrevs (ankare, alias eller separata
// literaler som råkar matcha).
//
// ═══ GENERALISERINGEN (runda 2 fynd 2) ═══
//
// Runda 1-versionen kände bara push ↔ pull_request. Review runda 2 pekade
// ut att mekanismen borde vara GENERELL: VARJE trigger under `on:` som bär
// `paths` eller `paths-ignore` ska prövas, inte bara de två som råkade
// finnas när skriptet skrevs. En framtida tredje trigger (t.ex.
// `merge_group`) med en egen, avvikande `paths-ignore`-lista hade annars
// passerat helt osedd.
//
// Referensen är `on.pull_request['paths-ignore']` — SAMMA region
// check-listparitet.sh:s par `klassning-codeql-positiv` vaktar mot ci.yml:s
// D0-allowlist, alltså den enda listan som har en OBEROENDE källa att
// vaktas mot. Alla ANDRA triggers under `on:` prövas mot DEN referensen:
//
//   - bär triggern `paths` (POSITIV form) → FÄLLER alltid, med förklaring.
//     Denna fil äger `paths-ignore` som sin enda avsedda mekanism (se
//     codeql.yml:s filhuvud § SÖKVÄGSLISTAN); en `paths`-nyckel är per
//     definition en ANNAN, oöversedd mekanism — närvaro är i sig felet,
//     oavsett innehåll.
//   - bär triggern `paths-ignore` → måste vara DJUPT LIKA referensen.
//   - bär triggern VARKEN `paths` eller `paths-ignore` → hoppas (t.ex.
//     `schedule`/`workflow_dispatch`, som strukturellt saknar path-filter,
//     eller en trigger utan filtrering — den är per definition inte i
//     scope för DENNA vakt).
//
// `push` har DESSUTOM ett eget, NAMNGIVET krav utöver den generiska svepen:
// den MÅSTE bära `paths-ignore` (Marcus-mandat 2026-09-19 — push ska
// D0-filtreras precis som pull_request). Utan den explicita kontrollen
// hade en BORTTAGEN `paths-ignore`-nyckel på push tolkats av den rent
// generiska regeln som "ingen path-filtrering på denna trigger, inget att
// pröva" — och regressionen hade passerat tyst. Den generiska regeln
// fångar FEL INNEHÅLL; det namngivna kravet fångar FRÅNVARO.
//
// Körning: node scripts/check-codeql-push-pr-parity.mjs [sökväg-till-workflow]
//   default: .github/workflows/codeql.yml
//
// Exit 0 = referensen finns, push bär den, och varje annan trigger som bär
//          paths-ignore matchar den djupt — ingen trigger bär paths
//          (positiv form).
// Exit 1 = en avvikelse funnen: push saknar paths-ignore, en trigger bär
//          paths (positiv form), eller en triggers paths-ignore skiljer
//          sig från referensen.
// Exit 2 = anropsfel — filen saknas, är inte parsbar YAML, `on:` saknas,
//          eller referensen (pull_request paths-ignore) själv saknas/är
//          tom (inget att jämföra mot).

import fs from 'node:fs';
import * as yaml from 'js-yaml';

const filsokvag = process.argv[2] ?? '.github/workflows/codeql.yml';

if (!fs.existsSync(filsokvag)) {
  console.error(`❌ workflow-filen saknas: ${filsokvag}`);
  process.exit(2);
}

let doc;
try {
  doc = yaml.load(fs.readFileSync(filsokvag, 'utf8'));
} catch (err) {
  console.error(`❌ kunde inte parsa ${filsokvag} som YAML: ${err.message}`);
  process.exit(2);
}

const on = doc?.on;
if (!on || typeof on !== 'object' || Array.isArray(on)) {
  console.error(`❌ on: saknas eller är inte ett objekt i ${filsokvag}`);
  process.exit(2);
}

const REFERENS_TRIGGER = 'pull_request';
const referens = on[REFERENS_TRIGGER]?.['paths-ignore'];

if (!Array.isArray(referens) || referens.length === 0) {
  console.error(
    `❌ on.${REFERENS_TRIGGER}['paths-ignore'] saknas eller är tom i ${filsokvag} — inget att jämföra mot.`,
  );
  process.exit(2);
}
const referensJson = JSON.stringify(referens);

let felkod = 0;

// ─── Namngivet krav: push MÅSTE bära D0-filtret ─────────────────────────
const KRAVDA_TRIGGERS = ['push'];
for (const kravd of KRAVDA_TRIGGERS) {
  const lista = on[kravd]?.['paths-ignore'];
  if (!Array.isArray(lista) || lista.length === 0) {
    console.error(
      `❌ on.${kravd}['paths-ignore'] saknas eller är tom i ${filsokvag} — ${kravd} filtreras INTE längre av D0, en regression mot Marcus-mandatet 2026-09-19.`,
    );
    felkod = 1;
  }
}

// ─── Generisk svep: VARJE annan trigger under on: (review runda 2) ─────
const ovrigaTriggers = Object.keys(on).filter((namn) => namn !== REFERENS_TRIGGER);
let provade = 0;

for (const namn of ovrigaTriggers) {
  const konfig = on[namn];
  if (!konfig || typeof konfig !== 'object' || Array.isArray(konfig)) continue;

  if (Object.hasOwn(konfig, 'paths')) {
    console.error(
      `❌ on.${namn}.paths (POSITIV form) förekommer i ${filsokvag} — odokumenterad/oöversedd mekanism för denna fil.`,
    );
    console.error(
      `   paths-ignore är den enda avsedda formen (se codeql.yml:s filhuvud § SÖKVÄGSLISTAN). En paths-nyckel kräver ett medvetet beslut, inte en tyst tillagd trigger.`,
    );
    felkod = 1;
    continue;
  }

  if (!Object.hasOwn(konfig, 'paths-ignore')) continue; // ingen path-filtrering på denna trigger — utanför vaktens scope

  provade++;
  const lista = konfig['paths-ignore'];
  if (!Array.isArray(lista) || lista.length === 0) {
    console.error(`❌ on.${namn}['paths-ignore'] är tom i ${filsokvag}.`);
    felkod = 1;
    continue;
  }
  const listaJson = JSON.stringify(lista);
  if (listaJson !== referensJson) {
    console.error(
      `❌ on.${namn}['paths-ignore'] (${lista.length} poster) ≠ on.${REFERENS_TRIGGER}['paths-ignore'] (${referens.length} poster) i ${filsokvag}.`,
    );
    console.error('   Listorna har glidit isär.');
    felkod = 1;
  }
}

if (felkod === 0) {
  console.log(
    `✅ codeql-push-pr-parity: on.${REFERENS_TRIGGER}['paths-ignore'] (${referens.length} poster) är referensen; push bär den; ${provade} annan trigger med paths-ignore prövad, alla djupt lika; ingen trigger bär paths (positiv form).`,
  );
}

process.exit(felkod);
