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
// ═══ SPRÅKMATRISEN — FLYTTAD HIT (review runda 4 fynd 2) ═══
//
// TASK-464.2 review runda 3 byggde en första matris-språk-vakt direkt i
// scripts/check-codeql-d0-kodfri.sh (en BASH-grind), med en REGEX mot
// bokstavliga `- language: <värde>`-rader. Review runda 4 fann att den
// blev ett TYST NO-OP om matrisen i stället skrevs i FLOW-form
// (`language: [a, b]`) eller en BLOCK-listform utan `include:` — noll
// rader matchade regexet, vilket tolkades som "ingen matris, inget att
// pröva" (skip) i stället för "matrisen finns, men jag kunde inte läsa
// den" (fail). Flyttad hit av samma skäl som runda 1 fynd 2 redan flyttade
// push/pull_request-paritetskontrollen hit: SKRIPTET PARSAR REDAN HELA
// FILEN MED js-yaml. En riktig parser känner BÅDA formerna utan
// specialfall — flow- och block-listor normaliseras till IDENTISKA
// JS-arrayer, det är bara TEXT-syntax som skiljer.
//
// KÄNDA SPRÅK (matchar codeql.yml:s faktiska matris i dag): `javascript-
// typescript`, `actions`.
//
// STÖDDA FORMER:
//   (a) matrix.include[].language  — den VERKLIGA formen i codeql.yml i
//       dag, en array av objekt där varje post bär ett `language`-fält.
//   (b) matrix.language (array)    — kortformen. `language: [a, b]`
//       (flow-syntax) och en YAML-blocklista (`language:\n  - a\n  - b`)
//       parsar till EXAKT SAMMA JS-array via js-yaml — ingen särskild
//       hantering krävs för de två SYNTAKTISKA varianterna av (b).
//
// FAIL-CLOSED-KONTRAKTET (review runda 4 fynd 2, Marcus-mandat):
//   - INGET jobb har en `strategy.matrix`-sektion ALLS → kontrollen är ett
//     no-op. Arbetsflödet använder helt enkelt inte matrisdriven språkval
//     — ett annat, giltigt mönster, inte en defekt. Detta håller alla
//     BEFINTLIGA testfixturer (T1–T11, som aldrig definierar `jobs:`)
//     opåverkade.
//   - Ett jobbs `strategy.matrix` ÄR ett objekt, men VARKEN (a) eller (b)
//     ger några språk (tom lista, `include`-poster utan `.language`, en
//     okänd form) → FÄLLER (anropsfel-koden, 2) — "matrisen gick inte att
//     härleda". Detta är EXAKT fail-closed-fallet fyndet krävde: en matris
//     som SYNS men inte kan LÄSAS ska aldrig tolkas som "inget att pröva".
//   - Språk hittade, men ETT är okänt (varken javascript-typescript eller
//     actions) → FÄLLER (avvikelse-koden, 1) — ett nytt matrisspråk kräver
//     att någon verifierar dess D0-täckning (check-codeql-d0-kodfri.sh)
//     innan vakten kan lita på att befintlig logik räcker.
//
// Körning: node scripts/check-codeql-push-pr-parity.mjs [sökväg-till-workflow]
//   default: .github/workflows/codeql.yml
//
// Exit 0 = referensen finns, push bär den, och varje annan trigger som bär
//          paths-ignore matchar den djupt — ingen trigger bär paths
//          (positiv form). Hittas en matris: varje matrisspråk är känt.
// Exit 1 = en avvikelse funnen: push saknar paths-ignore, en trigger bär
//          paths (positiv form), en triggers paths-ignore skiljer sig
//          från referensen, ELLER matrisen innehåller ett OKÄNT matrisspråk
//          (review runda 4 fynd 2).
// Exit 2 = anropsfel — filen saknas, är inte parsbar YAML, `on:` saknas,
//          referensen (pull_request paths-ignore) själv saknas/är tom
//          (inget att jämföra mot), ELLER en `strategy.matrix` hittades
//          men INGET språk kunde härledas ur den (review runda 4 fynd 2).

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

// ─── Språkmatrisen — vaktens täckning, INTE en kopia (review runda 4 fynd 2) ─
// Se skriptets filhuvud § SPRÅKMATRISEN för fail-closed-kontraktet.
const KANDA_SPRAK = new Set(['javascript-typescript', 'actions']);

function extraheraMatrisSprak(dokument) {
  const jobs = dokument?.jobs;
  if (!jobs || typeof jobs !== 'object' || Array.isArray(jobs)) {
    return { status: 'ingen-matrix' };
  }
  let matrisHittad = false;
  const sprak = new Set();
  for (const jobbNamn of Object.keys(jobs)) {
    const matrix = jobs[jobbNamn]?.strategy?.matrix;
    if (!matrix || typeof matrix !== 'object' || Array.isArray(matrix)) continue;
    matrisHittad = true;
    if (Array.isArray(matrix.include)) {
      for (const post of matrix.include) {
        if (
          post &&
          typeof post === 'object' &&
          typeof post.language === 'string' &&
          post.language.length > 0
        ) {
          sprak.add(post.language);
        }
      }
    }
    if (Array.isArray(matrix.language)) {
      for (const varde of matrix.language) {
        if (typeof varde === 'string' && varde.length > 0) sprak.add(varde);
      }
    }
  }
  if (!matrisHittad) return { status: 'ingen-matrix' };
  if (sprak.size === 0) return { status: 'tolkningsfel' };
  return { status: 'sprak', sprak: [...sprak] };
}

let matrisSprakRad = '';
const matrisResultat = extraheraMatrisSprak(doc);
if (matrisResultat.status === 'tolkningsfel') {
  console.error(
    `❌ ${filsokvag}: en strategy.matrix hittades i minst ett jobb, men INGET språk kunde härledas ur den (varken matrix.include[].language eller matrix.language som array). Matrisen gick inte att härleda.`,
  );
  process.exit(2);
} else if (matrisResultat.status === 'sprak') {
  const okanda = matrisResultat.sprak.filter((s) => !KANDA_SPRAK.has(s));
  if (okanda.length > 0) {
    console.error(
      `❌ ${filsokvag}: matrisen innehåller ${okanda.length === 1 ? 'ett språk' : 'språk'} grinden inte känner: ${okanda.join(', ')}. Kända: ${[...KANDA_SPRAK].join(', ')}.`,
    );
    console.error(
      '   Ett nytt matrisspråk kräver att någon verifierar dess D0-täckning (scripts/check-codeql-d0-kodfri.sh) innan grinden kan lita på att befintlig logik räcker.',
    );
    felkod = 1;
  } else {
    matrisSprakRad = ` Matrisspråk kända: ${matrisResultat.sprak.join(', ')}.`;
  }
}

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
    `✅ codeql-push-pr-parity: on.${REFERENS_TRIGGER}['paths-ignore'] (${referens.length} poster) är referensen; push bär den; ${provade} annan trigger med paths-ignore prövad, alla djupt lika; ingen trigger bär paths (positiv form).${matrisSprakRad}`,
  );
}

process.exit(felkod);
