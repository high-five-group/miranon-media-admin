#!/usr/bin/env node
// check-codeql-push-pr-parity.mjs — TASK-464.2, review runda 1 fynd 2
// (warning): prosan i .listparitet-policy.conf och codeql.yml:s eget
// filhuvud påstod att YAML-ankaret (`&d0-paths`/`*d0-paths`) gör en
// avvikande push-kopia "strukturellt omöjlig" — det stämmer bara så länge
// ingen ERSÄTTER aliaset med en handskriven lista. Byter någon `*d0-paths`
// mot en egen array fångar INGEN grind det: check-listparitet.sh läser bara
// EN region (under `pull_request`, se paret `klassning-codeql-positiv`).
//
// Detta skript stänger den luckan SEMANTISKT — det parsar den FAKTISKA
// YAML-strukturen (inte text/markörer) och kräver att
// `on.push["paths-ignore"]` är djupt lika med `on.pull_request["paths-ignore"]`,
// oavsett HUR de skrevs (ankare, alias eller två separata literaler som
// råkar matcha). Det är alltså en STARKARE, oberoende kontroll — inte en
// omskrivning av check-listparitet.sh:s mekanik.
//
// Körning: node scripts/check-codeql-push-pr-parity.mjs [sökväg-till-workflow]
//   default: .github/workflows/codeql.yml
//
// Exit 0 = push.paths-ignore === pull_request.paths-ignore (djup likhet).
// Exit 1 = de skiljer sig åt, eller push.paths-ignore saknas helt (en
//          REGRESSION mot Marcus-mandatet 2026-09-19 att push ska filtreras
//          precis som pull_request).
// Exit 2 = anropsfel — filen saknas, eller pull_request.paths-ignore själv
//          saknas/är tom (inget att jämföra mot).

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

const pr = doc?.on?.pull_request?.['paths-ignore'];
const push = doc?.on?.push?.['paths-ignore'];

if (!Array.isArray(pr) || pr.length === 0) {
  console.error(
    `❌ on.pull_request['paths-ignore'] saknas eller är tom i ${filsokvag} — inget att jämföra push mot.`,
  );
  process.exit(2);
}

if (!Array.isArray(push) || push.length === 0) {
  console.error(
    `❌ on.push['paths-ignore'] saknas eller är tom i ${filsokvag} — push filtreras INTE längre av D0, en regression mot Marcus-mandatet 2026-09-19.`,
  );
  process.exit(1);
}

const prJson = JSON.stringify(pr);
const pushJson = JSON.stringify(push);

if (prJson !== pushJson) {
  console.error(
    `❌ on.push['paths-ignore'] (${push.length} poster) ≠ on.pull_request['paths-ignore'] (${pr.length} poster) i ${filsokvag}.`,
  );
  console.error(
    '   Listorna har glidit isär — YAML-ankaret (om det fortfarande används) har ersatts av en avvikande literal.',
  );
  process.exit(1);
}

console.log(
  `✅ codeql-push-pr-parity: on.push['paths-ignore'] === on.pull_request['paths-ignore'] (${pr.length} poster, djupt lika).`,
);
process.exit(0);
