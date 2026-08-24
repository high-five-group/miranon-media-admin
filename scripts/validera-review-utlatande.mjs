#!/usr/bin/env node
// scripts/validera-review-utlatande.mjs — CLI-validator för review-agentens
// JSON-utlåtande mot scripts/lib/review-utlatande.mjs:s schema (TASK-173.1).
//
// ═══ VAD DEN PRÖVAR ═══
// Att en JSON-fil (review-agentens returnerade utlåtande) validerar mot
// utlåtande-kontraktet: alla obligatoriska fält, giltiga enum-värden, och de
// tre strukturella invarianterna (intentKalla/intentKonfidens-korset,
// kortId/acProvning-korset). `action`-fältet fäller ALDRIG hela körningen —
// se scripts/lib/review-utlatande.mjs filhuvud för fail-closed-motiveringen.
//
// ═══ ANVÄNDNING ═══
//   node scripts/validera-review-utlatande.mjs <path-till-utlatande.json>
//
// Exit 0 = giltigt utlåtande. Exit 1 = ogiltig JSON eller schemabrott.
// Exit 2 = felaktig CLI-användning (inget argument).
//
// Detta är den mekanism AC #1 (TASK-173.1) prövas mot: en manuell körning av
// review-agenten producerar en JSON-fil, och DENNA validator avgör om den
// "validerar mot JSON-schemat". Ingen sandlåda, inget nätverk — ren
// filläsning + schemakontroll.
//
// ═══ TVÅSIDIGT BEVIS ═══
// scripts/test-validera-review-utlatande.mjs importerar `valideraUtlatande`
// direkt (samma konvention som scripts/test-check-manifest-fields.mjs) och
// prövar varje invariant i båda riktningar.

import { readFileSync } from 'node:fs';
import { valideraUtlatande } from './lib/review-utlatande.mjs';

function main() {
  const path = process.argv[2];
  if (!path) {
    console.error(
      'Användning: node scripts/validera-review-utlatande.mjs <path-till-utlatande.json>',
    );
    return 2;
  }

  let raw;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    console.error(`FEL: kunde inte läsa/parsa ${path} som JSON: ${error.message}`);
    return 1;
  }

  const { ok, errors, data } = valideraUtlatande(raw);
  if (!ok) {
    console.error(`FEL: utlåtandet i ${path} validerar INTE mot schemat (${errors.length} fel):`);
    for (const message of errors) console.error(`  - ${message}`);
    return 1;
  }

  const askUserNormaliserade = data.fynd.filter((f, i) => {
    // Jämförelsen görs mot råa fyndet för att avgöra om `action` fail-closed
    // normaliserades (rå-värdet saknades/var ogiltigt) snarare än att den
    // faktiskt VAR 'ask-user' i indatan — informativt, aldrig en fällning.
    const ravardet = raw?.fynd?.[i]?.action;
    return f.action === 'ask-user' && ravardet !== 'ask-user';
  }).length;

  console.log(
    `OK: ${path} validerar mot schemat (schemaVersion ${data.schemaVersion}, ` +
      `${data.fynd.length} fynd, risk=${data.risk.niva}, intentKalla=${data.intentKalla}).`,
  );
  if (askUserNormaliserade > 0) {
    console.log(
      `  OBS: ${askUserNormaliserade} fynd saknade/hade ogiltig action-klassning och ` +
        `föll fail-closed till 'ask-user' (AC #2).`,
    );
  }
  return 0;
}

if (import.meta.main) {
  process.exit(main());
}
