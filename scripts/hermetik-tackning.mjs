#!/usr/bin/env node
// scripts/hermetik-tackning.mjs — summasteget för det SHARDADE hermetik-
// självtestet (TASK-366 / N6). Läser skärvornas täckningsrapporter och kräver
// att de TILLSAMMANS täckte klassen.
//
// Logiken bor i scripts/lib/hermetik-tackning.mjs och prövas tvåsidigt av
// scripts/test-hermetik-tackning.mjs (CI-wirad gatekeeper-svit). Den här filen
// är CLI-lagret: hitta filerna, parsa dem, skriv ut domen, sätt exitkoden.
//
// ═══ VARFÖR ETT EGET JOBB OCH INTE ETT STEG I SKÄRVAN ═══
// En skärva kan per konstruktion inte se de andra. Den enda punkt i CI där de
// tre domarna finns samtidigt är EFTER matrisen, alltså ett jobb med
// `needs: [acceptance-sjalvtest]`. Jobbet är medvetet billigt: det kör varken
// `npm ci` eller Playwright, eftersom varje skärva redan har mätt både sitt
// prövade antal och klassens listade antal (se hermetik-sjalvtest.mjs
// § RÄKNESÄTTET). Här återstår bara aritmetik.
//
// Användning:
//   node scripts/hermetik-tackning.mjs --katalog=<dir>
//   node scripts/hermetik-tackning.mjs --katalog=<dir> --json
//
// Exit 0 — skärvorna täckte klassen tillsammans.
// Exit 1 — TÄCKNINGEN HÅLLER INTE (summan går inte ihop, en skärva saknas,
//          rapporterna är inbördes motstridiga eller en rapport är trasig).
// Exit 2 — CLI-fel (ingen katalog angiven, katalogen finns inte).

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { bedomTackning, parsaTackningsrapport } from './lib/hermetik-tackning.mjs';

/** Filnamnsmönstret skärvorna skriver, se ci-suite.yml. */
const RAPPORT_MONSTER = /^hermetik-tackning-.*\.json$/;

const EXIT_OK = 0;
const EXIT_TACKNING_BRUTEN = 1;
const EXIT_CLI_FEL = 2;

/** Plockar ut ett `--flagga=värde` ur argumentlistan. */
export function flaggvarde(argv, namn) {
  const prefix = `--${namn}=`;
  const trad = argv.find((a) => a.startsWith(prefix));
  return trad ? trad.slice(prefix.length) : null;
}

/**
 * Samlar rapportfilerna under `katalog`, rekursivt.
 *
 * REKURSIVT MED AVSIKT: `actions/download-artifact` med `pattern` + utan
 * `merge-multiple` lägger varje artefakt i en EGEN undermapp uppkallad efter
 * artefaktnamnet. Att bara läsa katalogens topplager hade då gett noll filer —
 * vilket fail-closed-spärren i bedomTackning visserligen fäller på, men med fel
 * skäl utskrivet.
 */
export function samlaRapportfiler(katalog) {
  const traffar = [];
  for (const post of readdirSync(katalog, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const full = path.join(katalog, post.name);
    if (post.isDirectory()) traffar.push(...samlaRapportfiler(full));
    else if (RAPPORT_MONSTER.test(post.name)) traffar.push(full);
  }
  return traffar;
}

function main(argv) {
  const katalog = flaggvarde(argv, 'katalog');
  const somJson = argv.includes('--json');

  if (!katalog) {
    console.error('❌ CLI-FEL: --katalog=<dir> krävs (katalogen med skärvornas rapporter).');
    return EXIT_CLI_FEL;
  }

  try {
    if (!statSync(katalog).isDirectory()) {
      console.error(`❌ CLI-FEL: ${katalog} är inte en katalog.`);
      return EXIT_CLI_FEL;
    }
  } catch (orsak) {
    console.error(`❌ CLI-FEL: kunde inte läsa ${katalog} (${orsak.message}).`);
    return EXIT_CLI_FEL;
  }

  const filer = samlaRapportfiler(katalog);
  const rapporter = [];
  const parsfel = [];

  for (const fil of filer) {
    const kalla = path.relative(katalog, fil) || path.basename(fil);
    let raw;
    try {
      raw = readFileSync(fil, 'utf8');
    } catch (orsak) {
      parsfel.push(`${kalla}: kunde inte läsas (${orsak.message})`);
      continue;
    }
    const { rapport, fel } = parsaTackningsrapport(raw, kalla);
    if (fel) parsfel.push(fel);
    else rapporter.push(rapport);
  }

  const dom = bedomTackning(rapporter);
  // En trasig rapport är ALLTID ett täckningsbrott: den skärvans tal är okänt,
  // och ett okänt tal kan aldrig summeras till en giltig täckning.
  const avvikelser = [...parsfel, ...dom.avvikelser];
  const hallbart = avvikelser.length === 0;

  if (somJson) {
    console.log(
      JSON.stringify(
        {
          hallbart,
          summa: dom.summa,
          listat: dom.listat,
          shardTotal: dom.shardTotal,
          skarvor: rapporter.map((r) => ({
            shardIndex: r.shardIndex,
            shardTotal: r.shardTotal,
            provade: r.provade,
            listat: r.listat,
          })),
          avvikelser,
        },
        null,
        2,
      ),
    );
    return hallbart ? EXIT_OK : EXIT_TACKNING_BRUTEN;
  }

  console.log(`▶ TÄCKNINGSKONTROLL — ${filer.length} rapportfil(er) under ${katalog}\n`);
  for (const r of [...rapporter].sort((a, b) => a.shardIndex - b.shardIndex)) {
    console.log(
      `   skärva ${r.shardIndex}/${r.shardTotal}: ${r.provade} prövade ` +
        `(klassen listar ${r.listat})`,
    );
  }
  console.log(`\n   summa ${dom.summa} · listat ${dom.listat ?? 'OKÄNT'}`);

  if (!hallbart) {
    console.error(`\n❌ TÄCKNINGEN HÅLLER INTE — ${avvikelser.length} avvikelse(r):\n`);
    for (const rad of avvikelser) console.error(`   · ${rad}`);
    console.error(
      '\n   Det tvåsidiga beviset gäller bara de tester som faktiskt prövades. Gick inte\n' +
        '   summan ihop är klassen inte bevisad, hur gröna de enskilda skärvorna än var.',
    );
    return EXIT_TACKNING_BRUTEN;
  }

  console.log(
    '\n✅ TÄCKNINGEN HÅLLER — skärvorna prövade tillsammans exakt de tester klassen listar.',
  );
  return EXIT_OK;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
