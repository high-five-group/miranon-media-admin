// facit-godkand-skrivning.mjs
//
// Avgör om en Edit- eller Write-nyttolast skulle sätta "godkand"-fältet i
// ett facit-manifest till något ANNAT än null. Delas mellan
// scripts/deny-facit-godkand-skrivning.sh (PreToolUse-hooken) och dess
// testsvit (scripts/test-deny-facit-godkand-skrivning.sh).
//
// UPPDELNINGEN följer husets form: bash äger filsystem/jq-extraktion
// (deny-*.sh), node äger JSON-tolkningen — exakt samma snitt som
// scripts/check-facit.sh (bash) mot scripts/lib/facit-validera.mjs (node),
// se den filens eget huvud: "bash äger filsystem/grep, node äger JSON".
//
// Anrop:
//   node facit-godkand-skrivning.mjs write <content>
//   node facit-godkand-skrivning.mjs edit <nuvarande-innehall> <old_string> <new_string> [replace_all]
// Utdata: exakt "DENY" eller "ALLOW" på stdout (ingen radbrytning krävs av
// anroparen — hooken jämför strängen rakt av). Exit alltid 0: utfallet BÄRS
// av texten, inte av exitkoden — se hookens egen motivering för varför
// (skiljer "helperen kunde inte avgöra" INTE ut ett tredje tillstånd; se
// § HELLRE FÖR BRETT nedan för varför den skillnaden aldrig behövs).
//
// § HELLRE FÖR BRETT ÄN FÖR SMALT (ADR-104 § Beslut 2; forskningspasset
// docs/research/godkannande-mekanik-hitl-branschmonster-2026-08-08.md § 3.1,
// Boucle-citatet: "Tool-level enforcement is a game of whack-a-mole.").
// Kan resultatet inte tolkas som giltig JSON (vanligt för en Edit-hunk som
// bara är ett FRAGMENT av filen) faller logiken tillbaka på ett tolerant
// reguttrycks-mönster som hellre NEKAR en oskyldig skrivning än SLÄPPER en
// förfalskning igenom — en falsk fällning av en agent är billig, en missad
// förfalskning är dyr (uppdragets egen formulering, TASK-167).

/**
 * @param {string} text
 * @returns {boolean} true om "godkand" i texten (tolkad som fullständig
 *   JSON om möjligt, annars som fragment) bär ett värde som INTE är null.
 */
export function harIckeNullGodkand(text) {
  const kandidat = text ?? '';

  // Försök 1: giltig, fristående JSON — den mest exakta vägen. Gäller
  // Write (som alltid bär HELA filinnehållet) och de sällsynta Edit-fallen
  // där new_string råkar vara ett helt objekt.
  try {
    const objekt = JSON.parse(kandidat);
    if (objekt && typeof objekt === 'object' && !Array.isArray(objekt) && 'godkand' in objekt) {
      return objekt.godkand !== null;
    }
    // Giltig JSON utan "godkand"-nyckel — inte denna funktionens fråga.
    return false;
  } catch {
    // Försök 2: fragment. POSITIV matchning (inte negativ lookahead) av
    // avsiktliga portabilitetsskäl dokumenterade i hookens eget huvud —
    // denna modul körs alltid via node så lookahead hade fungerat här,
    // men samma mönster hålls medvetet enhetligt med bash-sidans grepp
    // för att en läsare inte ska behöva hålla två semantiskt olika
    // varianter i huvudet. Matchar "godkand" följt av kolon och ett värde
    // som INTE är ordet null: objekt (`{`), sträng (`"`), bool (`t`/`f`)
    // eller siffra.
    return /"godkand"\s*:\s*[{"tf0-9]/.test(kandidat);
  }
}

/**
 * Simulerar Edit-verktygets ersättning (första förekomst, eller alla vid
 * replace_all) och avgör om RESULTATET bär en icke-null "godkand" — PLUS en
 * bred sidokontroll av new_string ENSAM (§ HELLRE FÖR BRETT), som täcker
 * fallet där old_string inte hittas i nuvarande innehåll (t.ex. filen läst
 * fel, eller ett redan felande Edit-anrop) men new_string ändå avslöjar ett
 * försök.
 *
 * @param {string} nuvarande - filens innehåll FÖRE ändringen
 * @param {string} oldStr
 * @param {string} newStr
 * @param {boolean} replaceAll
 */
export function harIckeNullGodkandEfterEdit(nuvarande, oldStr, newStr, replaceAll) {
  const bas = nuvarande ?? '';
  const old = oldStr ?? '';
  const ny = newStr ?? '';

  let resultat = null;
  if (old !== '' && bas.includes(old)) {
    // .replace(sträng, sträng) är LITERAL substitution i JS (ingen
    // regex-tolkning av `old` eftersom första argumentet är en sträng,
    // inte ett RegExp-objekt) — ingen escaping behövs.
    resultat = replaceAll ? bas.split(old).join(ny) : bas.replace(old, ny);
  }

  const viaResultat = resultat !== null && harIckeNullGodkand(resultat);
  const viaNewStringEnsam = harIckeNullGodkand(ny);
  return viaResultat || viaNewStringEnsam;
}

// ---------------------------------------------------------------------------
// CLI — kallas av deny-facit-godkand-skrivning.sh. Guardad mot import (samma
// mönster som scripts/seed-review-fixture.mjs) så modulen kan importeras rent
// av testsviten utan att köra CLI-grenen.
// ---------------------------------------------------------------------------
function main(argv) {
  const [lage, ...rest] = argv;

  if (lage === 'write') {
    const [content] = rest;
    process.stdout.write(harIckeNullGodkand(content) ? 'DENY' : 'ALLOW');
    return;
  }

  if (lage === 'edit') {
    const [nuvarande, oldStr, newStr, replaceAllRaw] = rest;
    const replaceAll = replaceAllRaw === 'true';
    process.stdout.write(
      harIckeNullGodkandEfterEdit(nuvarande, oldStr, newStr, replaceAll) ? 'DENY' : 'ALLOW',
    );
    return;
  }

  // Okänt läge — § HELLRE FÖR BRETT gäller matchningen mot innehåll, inte
  // anropskontraktet mot detta skript: ett internt anropsfel här är
  // hookens eget fel, inte ett bevis på ett förfalskningsförsök. Hookens
  // egen infra-fail-open (jq/node saknas etc.) täcker den bredare klassen;
  // se scripts/deny-facit-godkand-skrivning.sh § FAIL-OPEN.
  process.stdout.write('ALLOW');
}

if (process.argv[1]?.endsWith('facit-godkand-skrivning.mjs')) {
  main(process.argv.slice(2));
}
