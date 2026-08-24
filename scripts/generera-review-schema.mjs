#!/usr/bin/env node
// scripts/generera-review-schema.mjs — skriver den portabla JSON Schema-
// artefakten ur scripts/lib/review-utlatande.mjs:s zod-schema (TASK-173.1).
//
// Samma motiv som scripts/atlas (build-farg-atlas.mjs): EN källa
// (zod-schemat), en HÄRLEDD artefakt. Filen under docs/reference/ är till
// för konsumenter som inte kör Node/zod (framtida CI-backstopp i 173.4,
// dokumentationsläsare) — den ska ALDRIG redigeras för hand, bara
// regenereras härifrån.
//
// Kör: npm run review:schema
// Skriver om filen ovillkorligt och verifierar direkt efteråt att den
// faktiskt landade som giltig, parsbar JSON (fail-closed på skrivfel,
// inte en tyst framgång).

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { genereraJsonSchema } from './lib/review-utlatande.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const SCHEMA_OUTPUT_PATH = resolve(REPO, 'docs/reference/review-utlatande.schema.json');

function main() {
  const schema = genereraJsonSchema();
  const json = `${JSON.stringify(schema, null, 2)}\n`;
  writeFileSync(SCHEMA_OUTPUT_PATH, json, 'utf8');

  // Läs tillbaka och pröva att det faktiskt är giltig JSON — en trasig skrivning
  // (disk full, avbruten process) ska synas här, inte upptäckas av nästa
  // konsument som försöker parsa filen.
  const roundtrip = JSON.parse(readFileSync(SCHEMA_OUTPUT_PATH, 'utf8'));
  if (roundtrip.$schema !== schema.$schema) {
    console.error('FEL: filen som skrevs kunde inte läsas tillbaka som samma schema.');
    return 1;
  }

  console.log(`OK: ${SCHEMA_OUTPUT_PATH} regenererad ur scripts/lib/review-utlatande.mjs.`);
  return 0;
}

if (import.meta.main) {
  process.exit(main());
}
