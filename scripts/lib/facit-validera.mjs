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
//        R4 (facit förväxlingsbart) + R5 (täckningens luckor osynliga)
//        + § Updates 2026-08-22 (T157: amenderings-mekaniken — ytans
//        "referenser" och amenderings-SIDOFILERNA nedan).
//        docs/decisions/ADR-104-godkannande-mekaniken-kanalseparation.md
//        § Beslut 2 (schemat "godkand" bär sedan TASK-167).

import { createHash } from 'node:crypto';
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

// Schemat för ett SATT "godkand" (ADR-104 § Beslut 2, TASK-167): ett
// objekt { av, datum, citat, sha, undantag?: [{ yta, skal }] } — Marcus
// egen kanal (scripts/facit-godkann.mjs) stämplar det, ALDRIG en bar
// sträng. Den äldre sträng-formen ("2026-08-10") fanns bara som en
// tillfällig testfixtur (aldrig i ett verkligt manifest i detta repo) och
// stöds inte längre — se ADR-104 för hela resonemanget bakom bytet.
const ISO_DATUM = /^\d{4}-\d{2}-\d{2}$/;
const validateGodkandUndantag = (undantag) => {
  if (!Array.isArray(undantag)) {
    rapportera(
      `${manifestPath}: "godkand.undantag" ska vara en array av { yta, skal }, inte ${typeof undantag}.`,
    );
    return;
  }
  undantag.forEach((post, idx) => {
    if (!post || typeof post !== 'object' || Array.isArray(post)) {
      rapportera(`${manifestPath}: "godkand.undantag[${idx}]" ska vara ett objekt { yta, skal }.`);
      return;
    }
    if (typeof post.yta !== 'string' || post.yta.trim() === '') {
      rapportera(`${manifestPath}: "godkand.undantag[${idx}].yta" saknas eller är tomt.`);
    }
    if (typeof post.skal !== 'string' || post.skal.trim() === '') {
      rapportera(`${manifestPath}: "godkand.undantag[${idx}].skal" saknas eller är tomt.`);
    }
  });
};

if (!('godkand' in manifest)) {
  rapportera(
    `${manifestPath}: nyckeln "godkand" saknas. Den ska vara null tills Marcus godkänt att skarpa är identisk med prototypen (ADR-102 B3) — en saknad nyckel får aldrig läsas som godkänd.`,
  );
} else if (manifest.godkand !== null) {
  const g = manifest.godkand;
  if (typeof g !== 'object' || Array.isArray(g)) {
    rapportera(
      `${manifestPath}: "godkand" ska vara null eller ett objekt { av, datum, citat, sha, undantag? } (ADR-104), inte ${Array.isArray(g) ? 'en array' : typeof g}.`,
    );
  } else {
    if (typeof g.av !== 'string' || g.av.trim() === '') {
      rapportera(`${manifestPath}: "godkand.av" saknas eller är tomt.`);
    }
    if (typeof g.datum !== 'string' || !ISO_DATUM.test(g.datum)) {
      rapportera(
        `${manifestPath}: "godkand.datum" ska vara ett ISO-datum (YYYY-MM-DD), fick ${JSON.stringify(g.datum)}.`,
      );
    }
    if (typeof g.citat !== 'string' || g.citat.trim() === '') {
      rapportera(`${manifestPath}: "godkand.citat" saknas eller är tomt.`);
    }
    if (typeof g.sha !== 'string' || g.sha.trim() === '') {
      rapportera(`${manifestPath}: "godkand.sha" saknas eller är tomt.`);
    }
    if ('undantag' in g) {
      validateGodkandUndantag(g.undantag);
    }
  }
}

// --- Amenderingen bor i en SIDOFIL, aldrig i manifestet -------------------
// ADR-102 § Updates 2026-08-22 (T157). Ett STÄMPLAT manifest är agent-fruset
// i sin helhet: ADR-104-hooken prövar det simulerade RESULTATET av en
// Edit/Write, och varje stämplat manifest har per definition ett satt
// "godkand" — alltså nekas även en ändring som inte rör fältet. Mätt
// 2026-08-22 och tidigare bokfört i S106 ("ADR-104-hooken nekade ×2,
// korrekt"). Bokföringen bor därför i en sidofil bredvid manifestet:
//
//     AMENDERING-<ISO-datum>-<slug>.md
//
// Formen är inte uppfunnen här utan MÄTT: fem sådana filer fanns i repot
// innan denna regel skrevs (s55-hem, s93-atgardssida, s102-hem,
// s102-dokument ×2), samtliga med samma namnform och samma H1. Mönstret var
// etablerat i praktiken men oskrivet — och därför gick en agent 2026-08-22
// rakt in i hooken i stället för att skriva sidofilen direkt.
//
// En "amendering"-NYCKEL i manifestets JSON är därför ett fel, inte en
// alternativ form: den kan ändå aldrig skrivas i ett stämplat manifest, och
// två konkurrerande former gör bokföringen ofinnbar.
const AMENDERING_NAMN = /^AMENDERING-\d{4}-\d{2}-\d{2}-.+\.md$/;

if ('amendering' in manifest) {
  rapportera(
    `${manifestPath}: nyckeln "amendering" hör inte hemma i manifestet. Ett stämplat manifest är agent-fruset i sin helhet (ADR-104-hooken) — bokföringen bor i en sidofil ${katalog}/AMENDERING-<datum>-<slug>.md (ADR-102 § Updates 2026-08-22 § A3).`,
  );
}

// Sidofilernas FORM prövas mekaniskt (namn + rubrik); deras INNEHÅLL är
// konvention, beskriven i ADR-102 § Updates 2026-08-22 § A3. Skillnaden är
// medveten: en grind kan hävda att bokföringen går att hitta och datera, den
// kan aldrig hävda att den är sann.
let amenderingsCache = null;
const amenderingar = () => {
  if (amenderingsCache === null) {
    amenderingsCache = readdirSync(katalog)
      .filter((fil) => fil.startsWith('AMENDERING-'))
      .map((fil) => ({ fil, text: readFileSync(join(katalog, fil), 'utf8') }));
  }
  return amenderingsCache;
};

for (const { fil, text } of amenderingar()) {
  if (!AMENDERING_NAMN.test(fil)) {
    rapportera(
      `${katalog}/${fil}: amenderings-sidofilens namn ska ha formen AMENDERING-<ISO-datum>-<slug>.md. Datumet i namnet är postens identitet och det som gör serien läsbar i katalogordning.`,
    );
  }
  if (!/^# Amendering \d{4}-\d{2}-\d{2} — /m.test(text)) {
    rapportera(
      `${katalog}/${fil}: sidofilen saknar den kanoniska rubriken "# Amendering <ISO-datum> — <vad>". Samtliga fem tidigare amenderingar i repot bär den.`,
    );
  }
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
const SHA256 = /^[0-9a-f]{64}$/;
const sha256Av = (fil) => createHash('sha256').update(readFileSync(fil)).digest('hex');

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

  // --- INVARIANT (d): den stämplade formen är innehållslåst ---------------
  // ADR-102 § Updates 2026-08-22 (T157). "referenser" deklarerar ytans
  // MEKANISKA facit — ariaSnapshot-referenserna (ADR-103 B4), det som
  // faktiskt låser formen; bilderna är regressionsstöd (ADR-103 B2 steg 2).
  //
  // Nyckeln är i dag VALFRI, och det är en öppet bokförd lucka, inte ett
  // designval: 21 av 22 stämplade ytor saknar den (mätt 2026-08-22) och
  // backfillen kräver mätning per yta — bara 4 av 12 manifest namnger sina
  // __aria__-sökvägar. check-facit.sh RÄKNAR UPP de odeklarerade på varje
  // körning så frånvaron aldrig blir tyst (R5-lärdomen).
  //
  // HASH-JÄMFÖRELSEN GÄLLER ENDAST STÄMPLADE MANIFEST. Det är klass (a)
  // kodad: ett ogodkänt facit som ändras av sin egen skiva MÅSTE få sina
  // referenser uppdaterade, annars går promoverings-grinden röd på en
  // legitim ändring och kortet kan inte landa alls.
  if ('referenser' in yta) {
    if (!Array.isArray(yta.referenser)) {
      rapportera(
        `${manifestPath}: ytan "${namn}" — "referenser" ska vara en array av { fil, sha256 }. Tom array = ytan har inget mekaniskt facit (deklarerad frånvaro); saknad nyckel = odeklarerad lucka.`,
      );
    } else {
      for (const [rIdx, ref] of yta.referenser.entries()) {
        if (!ref || typeof ref !== 'object' || Array.isArray(ref)) {
          rapportera(
            `${manifestPath}: ytan "${namn}" — "referenser[${rIdx}]" ska vara ett objekt { fil, sha256 }.`,
          );
          continue;
        }
        if (typeof ref.fil !== 'string' || ref.fil.trim() === '') {
          rapportera(`${manifestPath}: ytan "${namn}" — "referenser[${rIdx}].fil" saknas.`);
          continue;
        }
        if (typeof ref.sha256 !== 'string' || !SHA256.test(ref.sha256)) {
          rapportera(
            `${manifestPath}: ytan "${namn}" — "referenser[${rIdx}].sha256" ska vara 64 hex-tecken (gemener), fick ${JSON.stringify(ref.sha256)}.`,
          );
          continue;
        }
        if (!existsSync(ref.fil)) {
          rapportera(
            `${manifestPath}: ytan "${namn}" — referensen "${ref.fil}" finns inte. En deklarerad referens som saknas på disk är ett lås utan objekt.`,
          );
          continue;
        }
        if (!manifest.godkand) continue;

        const faktisk = sha256Av(ref.fil);
        if (faktisk === ref.sha256) continue;

        // Ändringen är bokförd om NÅGON sidofil i katalogen nämner både
        // filen och dess FAKTISKA sha256. Ingen parser, inget nytt filformat
        // — sidofilerna är prosa i dag och förblir det. Att den faktiska
        // hashen måste stå där är det som håller låset kvar EFTER en
        // amendering: nästa ändring ger en ny hash som ingen sidofil bär.
        const bokford = amenderingar().find(
          (a) => a.text.includes(ref.fil) && a.text.includes(faktisk),
        );
        if (bokford) continue;

        rapportera(
          [
            `${manifestPath}: ytan "${namn}" — referensen "${ref.fil}" har ÄNDRATS och ändringen är inte bokförd.`,
            `  bokförd sha256: ${ref.sha256}`,
            `  faktisk sha256: ${faktisk}`,
            `  Facit är STÄMPLAT (godkand: ${manifest.godkand.av}, ${manifest.godkand.datum}) — stämpeln intygar den form referensen bar.`,
            '  ADR-102 § Updates 2026-08-22 (T157) — klassa ändringen, ändra aldrig tyst:',
            '    (b) FORMEN oförändrad, ändringen är en artefakt (fixtur, rendering, miljö):',
            `        skriv en sidofil ${katalog}/AMENDERING-<datum>-<slug>.md som namnger`,
            '        både referensens sökväg och dess faktiska sha256 ovan. Stämpeln',
            '        behålls, ingen ny granskning. Manifestet rörs INTE — det är fruset.',
            '    (c) FORMEN ändras faktiskt: en agent avgör ALDRIG detta själv — sidofilen',
            '        skrivs på samma sätt, men lämnar omstämplingen till Marcus egen kanal',
            '        (ADR-104 § Beslut 2).',
            '    Testet: påverkar ändringen vad en användare ser i prod? Ja eller OSÄKERT ⇒ (c).',
          ].join('\n'),
        );
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
