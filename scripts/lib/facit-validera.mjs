// facit-validera.mjs
//
// Strukturvalidering av ETT facit-manifest. Anropas av scripts/check-facit.sh,
// som äger config, katalog-svepet och B3-spärren; denna modul äger JSON:en.
//
// Uppdelningen följer husets form: bash äger filsystem/grep (check-*.sh),
// node äger JSON (scripts/lib/*.mjs, jfr staging-preflight.mjs).
//
// Anrop:  node scripts/lib/facit-validera.mjs <manifest-path> <bild-glob>
// Utdata: en rad per fynd på stdout, prefix "FEL: ". Tyst vid grönt.
// Exit:   0 = manifestet är konsistent, 1 = minst ett fynd, 3 = anropsfel.
//
// Källa: docs/decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md
//        R4 (facit förväxlingsbart) + R5 (täckningens luckor osynliga).

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const [manifestPath, bildGlob] = process.argv.slice(2);

if (!manifestPath || !bildGlob) {
  process.stderr.write('facit-validera: anrop kräver <manifest-path> <bild-glob>\n');
  process.exit(3);
}

const fynd = [];
const rapportera = (rad) => fynd.push(`FEL: ${rad}`);

// Glob-mönstret är avsiktligt enkelt (prefix + '*') — samma uttrycksnivå som
// policy-filens övriga värden. En full glob-motor vore komplexitet utan
// nuvarande användare.
const globTillRegex = (glob) =>
  new RegExp(
    `^${glob
      .split('*')
      .map((del) => del.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*')}$`,
  );

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch (fel) {
  rapportera(`${manifestPath} går inte att tolka som JSON: ${fel.message}`);
  process.stdout.write(`${fynd.join('\n')}\n`);
  process.exit(1);
}

const katalog = dirname(manifestPath);

// --- Toppnivåns obligatoriska fält ---------------------------------------
// "godkand" MÅSTE finnas som nyckel men får vara null. Skillnaden är hela
// poängen: null = "Marcus har inte godkänt" (B3 spärrar rivning), saknad
// nyckel = manifestet är ofullständigt och får inte tolkas som godkänt.
for (const falt of ['prototyp', 'last', 'lasning']) {
  if (typeof manifest[falt] !== 'string' || manifest[falt].trim() === '') {
    rapportera(`${manifestPath}: fältet "${falt}" saknas eller är tomt.`);
  }
}

if (!('godkand' in manifest)) {
  rapportera(
    `${manifestPath}: nyckeln "godkand" saknas. Den ska vara null tills Marcus godkänt att skarpa är identisk med prototypen (ADR-102 B3) — en saknad nyckel får aldrig läsas som godkänd.`,
  );
} else if (manifest.godkand !== null && typeof manifest.godkand !== 'string') {
  rapportera(
    `${manifestPath}: "godkand" ska vara null eller ett datum som sträng, inte ${typeof manifest.godkand}.`,
  );
}

if (!Array.isArray(manifest.ytor) || manifest.ytor.length === 0) {
  rapportera(
    `${manifestPath}: "ytor" saknas eller är tom. Ett manifest utan ytor deklarerar ingenting.`,
  );
  process.stdout.write(`${fynd.join('\n')}\n`);
  process.exit(1);
}

// --- Varje yta ------------------------------------------------------------
const deklareradeBilder = new Set();

for (const [index, yta] of manifest.ytor.entries()) {
  const namn = typeof yta.yta === 'string' ? yta.yta : `#${index}`;

  if (typeof yta.yta !== 'string' || yta.yta.trim() === '') {
    rapportera(`${manifestPath}: yta #${index} saknar fältet "yta".`);
  }

  // R5: "bilder" MÅSTE finnas som nyckel. En tom array är en DEKLARERAD
  // frånvaro ("ingen facit-bild låstes"); en saknad nyckel är ett
  // förbiseende. Utan denna skillnad är de två oskiljbara — vilket är
  // exakt rotorsaken.
  if (!Array.isArray(yta.bilder)) {
    rapportera(
      `${manifestPath}: ytan "${namn}" saknar nyckeln "bilder". Tom array = ingen facit-bild låst (deklarerad frånvaro); saknad nyckel = odeklarerad lucka.`,
    );
  } else {
    for (const bild of yta.bilder) {
      deklareradeBilder.add(bild);
      if (!existsSync(join(katalog, bild))) {
        rapportera(
          `${manifestPath}: ytan "${namn}" pekar på "${bild}" som inte finns i ${katalog}/.`,
        );
      }
    }
  }

  if (!Array.isArray(yta.kallor) || yta.kallor.length === 0) {
    rapportera(
      `${manifestPath}: ytan "${namn}" saknar "kallor". Utan källsökvägar kan ingen avgöra vilken kod ytan äger.`,
    );
  } else {
    for (const kalla of yta.kallor) {
      if (!existsSync(kalla)) {
        rapportera(`${manifestPath}: ytan "${namn}" pekar på källan "${kalla}" som inte finns.`);
      }
    }
  }
}

// --- Föräldralösa facit-bilder -------------------------------------------
// R4: en bild som HETER facit men inte är deklarerad är en fälla — den ser
// auktoritativ ut för var och en som läser katalogen.
const bildRe = globTillRegex(bildGlob);
for (const fil of readdirSync(katalog)) {
  if (!bildRe.test(fil)) continue;
  if (!deklareradeBilder.has(fil)) {
    rapportera(
      `${katalog}/${fil} matchar facit-mönstret men är inte deklarerad i ${manifestPath}. Deklarera den, eller döp om den om den inte är facit.`,
    );
  }
}

if (fynd.length > 0) {
  process.stdout.write(`${fynd.join('\n')}\n`);
  process.exit(1);
}

process.exit(0);
