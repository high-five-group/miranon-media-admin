#!/usr/bin/env node
// scripts/check-staging-preflight-wiring.mjs — deletion-vakt för staging-
// preflightens WIRING (TASK-91).
//
// ═══ VAD DEN PRÖVAR — OCH VAD DEN INTE PRÖVAR ═══
// Semaforens LOGIK är väl täckt: scripts/test-staging-semaphore.sh har 19 fall
// som bevisar att den fäller när den ska och släpper igenom när den ska. Denna
// vakt rör inte den frågan med en tumme. Den prövar EN sak: att haken
// fortfarande sitter i kodvägen — att de fem ytor TASK-77 och TASK-84 wirade
// fortfarande når `kravStagingLedigt`.
//
//   Playwright-ytorna (dependency-vägen):
//     api-setup     → api-staging + kontraktsvakt
//     setup         → chromium-authenticated
//     preview-setup → staging-preview
//   Node-ytorna (anrop i main()):
//     scripts/purge-staging-sentinels.mjs
//     scripts/seed-review-fixture.mjs
//
// ═══ VARFÖR EN VAKT FÖR ETT FEL SOM ALDRIG INTRÄFFAT ═══
// Huset mekaniserar normalt när felet HAR inträffat, eller när det FÖRSTA
// felet vore oacceptabelt. Ingetdera gäller här. Skälet är en tredje egenskap:
// FRÅNVARON SYNS INTE. GitLabs postmortem 2017-01-31 är det dokumenterade
// fallet — fyra återställningsmekanismer fanns på papperet, pg_dump-backuperna
// hade aldrig körts, och felrapporteringen var också trasig: "we were never
// aware of the backups failing, until it was too late." Motmedlet är att
// övervaka att vägen fortfarande finns.
//
// Tappas en anropsrad här märks det först vid en kollision — och då ser det ut
// som ett slumpmässigt staging-fel, inte som en saknad mekanism.
// Källa: docs/research/reversibilitet-som-delegeringsaxel-2026-07-29.md § C1.
//
// ═══ VARFÖR PLAYWRIGHTS EGEN UPPLÖSNING, INTE EN REGEX ÖVER CONFIGEN ═══
// `playwright test --project=X --list` drar in projektets dependencies
// TRANSITIVT och redovisar dem i JSON-rapporten (mätt 2026-07-30:
// `--project=api-staging` listar `api-setup :: api/auth.setup.ts`). Vakten
// läser därför den FAKTISKA upplösningen i stället för att bygga en andra,
// sämre kopia av Playwrights dependency-logik. Det spelar roll: configens
// preview-projekt bor bakom ett villkorat spread
// (`...(isPreviewRun ? [...] : [])`), som en regex-läsare hade behövt
// specialfalla.
//
// ═══ HUR EN SJÄTTE YTA FÅNGAS (AC #5) ═══
// Två kompletterings-nät, båda fail-closed:
//   1. Playwright — varje projekt som finns i den upplösta configen ELLER
//      deklareras i playwright.config.ts måste vara KLASSAT i policyn
//      (bärare / konsument / undantagen-med-skäl). Ett oklassat projekt fäller
//      vakten med en instruktion, inte med tystnad.
//   2. Node — varje fil under scripts/ som bär en staging-markör måste vara
//      antingen deklarerad yta eller uttryckligen undantagen med skäl. Den
//      halvan fångar en ny yta AUTOMATISKT.
//
// ═══ ÄRLIGA GRÄNSER, skrivna och inte underförstådda ═══
//   · Projekt som bara existerar under en env-flagga ingen policy-post
//     deklarerar syns inte i den upplösta configen. Text-nätet över
//     playwright.config.ts finns just för det fallet — men det läser text, och
//     ett projekt vars namn byggs dynamiskt undgår båda näten.
//   · Node-upptäckten letar efter markör-STRÄNGAR. En ny yta som når basen via
//     en indirektion utan någon av markörerna undgår den.
//   · Vakten prövar ATT haken finns i kodvägen — inte att den ANROPAS vid
//     körning. Det senare ägs av semaforens egen svit.
//
// Användning:
//   node scripts/check-staging-preflight-wiring.mjs
//
// Inga flaggor, med flit: testsviten speglar i stället PRODUKTIONENS LAYOUT i
// en sandlåda (vakten + policyn + configen i samma inbördes relation som i
// repot), så den FAKTISKA sökvägsupplösningen provas — samma disciplin som
// scripts/test-staging-semaphore.sh. En `--repo`-flagga hade haft testsviten
// som enda användare och gjort den upplösningen obevisad.
//
// Exit 0  — all wiring på plats.
// Exit 1  — wiring saknas, eller en yta är oklassad.
// Exit 64 — policy-/miljöfel (fail-closed: en vakt som inte kunde svara
//           rapporteras ALDRIG som grön).

import { execFile } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const EXIT_OK = 0;
const EXIT_WIRING_SAKNAS = 1;
const EXIT_POLICYFEL = 64;

const STANDARD_POLICY = '.staging-preflight-wiring-policy.json';

/** Repo-roten härleds ur vaktens EGEN plats — samma relation i repot som i sandlådan. */
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* ── Källkods-läsning som inte låter sig luras av kommentarer ───────────── */

/**
 * Tar bort kommentarer rad för rad och lämnar sträng-literaler orörda.
 *
 * Riktningen är medvetet vald: att strippa FÖR MYCKET ger en falsk FÄLLNING
 * (loud, fail-closed), att strippa för lite hade låtit ett bortkommenterat
 * anrop räknas som närvarande — det enda utfall en deletion-vakt aldrig får
 * ge. Backtick-strängar bärs över radgränsen; `'` och `"` kan inte spänna
 * över rader utan fortsättningstecken och nollställs därför per rad.
 */
function kodrader(kalla) {
  const rader = kalla.split('\n');
  const ut = [];
  let iBlockkommentar = false;
  let strang = null;

  for (const rad of rader) {
    let kod = '';
    let i = 0;

    while (i < rad.length) {
      const c = rad[i];
      const nasta = rad[i + 1];

      if (iBlockkommentar) {
        if (c === '*' && nasta === '/') {
          iBlockkommentar = false;
          i += 2;
        } else {
          i += 1;
        }
        continue;
      }

      if (strang) {
        kod += c;
        if (c === '\\') {
          kod += nasta ?? '';
          i += 2;
          continue;
        }
        if (c === strang) strang = null;
        i += 1;
        continue;
      }

      if (c === '/' && nasta === '/') break;
      if (c === '/' && nasta === '*') {
        iBlockkommentar = true;
        i += 2;
        continue;
      }
      if (c === "'" || c === '"' || c === '`') {
        strang = c;
        kod += c;
        i += 1;
        continue;
      }

      kod += c;
      i += 1;
    }

    if (strang !== '`') strang = null;
    ut.push(kod);
  }

  return ut;
}

/** Ett ANROP av symbolen — inte importraden, inte ett omnämnande i text. */
function anropFinns(rader, symbol) {
  const monster = new RegExp(`(^|[^\\w$.])${symbol}\\s*\\(`);
  return rader.some((rad) => monster.test(rad));
}

/**
 * Kroppen av en toppnivå-funktion: från deklarationsraden till nästa rad som
 * börjar med `}` i kolumn 0. Formen är repots (Biome-formaterad kod har
 * toppnivå-funktioners avslutande klammer i kolumn 0). Hittas ingen region
 * FÄLLER vakten i stället för att gissa — samma fail-closed-riktning som
 * kommentar-strippningen.
 */
function funktionsregion(rader, funktionsnamn) {
  const deklaration = new RegExp(
    `^(?:export\\s+)?(?:async\\s+)?function\\s+${funktionsnamn}\\s*\\(`,
  );
  const start = rader.findIndex((rad) => deklaration.test(rad));
  if (start === -1) return null;

  for (let i = start + 1; i < rader.length; i += 1) {
    if (/^\}/.test(rader[i])) return rader.slice(start, i + 1);
  }
  return null;
}

/* ── Playwright: den faktiska dependency-upplösningen ───────────────────── */

async function listaProjekt(repo, cli, projekt) {
  const { stdout } = await execFileAsync(
    process.execPath,
    [cli, 'test', `--project=${projekt.namn}`, '--list', '--reporter=json'],
    {
      cwd: repo,
      env: { ...process.env, ...(projekt.env ?? {}) },
      maxBuffer: 64 * 1024 * 1024,
    },
  );

  const start = stdout.indexOf('{');
  if (start === -1) throw new Error('playwright --list gav ingen JSON på stdout');

  const rapport = JSON.parse(stdout.slice(start));
  // Playwright kan avsluta 0 och ändå rapportera fel i JSON:en. En rapport med
  // fel är inte ett underlag att döma wiring på — fail-closed.
  if ((rapport.errors ?? []).length > 0) {
    throw new Error(
      `--list rapporterade fel: ${rapport.errors
        .map((e) => e.message)
        .join(' | ')
        .slice(0, 2000)}`,
    );
  }
  return rapport;
}

/** Karta projektnamn → absoluta testfiler, ur en --list-rapport. */
function filerPerProjekt(rapport) {
  const rot = rapport.config?.rootDir;
  if (!rot) throw new Error('--list-rapporten saknar config.rootDir');

  const karta = new Map();
  const ga = (svit) => {
    for (const under of svit.suites ?? []) ga(under);
    for (const spec of svit.specs ?? []) {
      for (const test of spec.tests ?? []) {
        if (!karta.has(test.projectName)) karta.set(test.projectName, new Set());
        karta.get(test.projectName).add(resolve(rot, spec.file));
      }
    }
  };
  for (const svit of rapport.suites ?? []) ga(svit);

  return karta;
}

/** Projektnamn som deklareras i configens TEXT — nätet under den upplösta configen. */
function projektnamnITexten(configKalla) {
  const namn = new Set();
  for (const rad of kodrader(configKalla)) {
    const traff = rad.match(/^\s*name:\s*'([^']+)'\s*,?\s*$/);
    if (traff) namn.add(traff[1]);
  }
  return namn;
}

/* ── Node-ytorna ────────────────────────────────────────────────────────── */

function filerUnder(katalog, andelser) {
  const ut = [];
  const ga = (dir) => {
    for (const post of readdirSync(dir)) {
      const full = join(dir, post);
      if (statSync(full).isDirectory()) ga(full);
      else if (andelser.some((a) => post.endsWith(a))) ut.push(full);
    }
  };
  if (existsSync(katalog)) ga(katalog);
  return ut.sort();
}

/* ── Huvudflödet ────────────────────────────────────────────────────────── */

async function main() {
  const repo = REPO;
  const policySokvag = join(repo, STANDARD_POLICY);

  let policy;
  try {
    policy = JSON.parse(readFileSync(policySokvag, 'utf-8'));
  } catch (fel) {
    console.error(`❌ Policy-filen kunde inte läsas: ${policySokvag}`);
    console.error(`   ${fel.message}`);
    console.error('   Fail-closed: en vakt utan policy rapporteras ALDRIG som grön.');
    return EXIT_POLICYFEL;
  }

  const symbol = policy.preflightSymbol;
  const projektposter = policy.playwrightProjekt ?? [];
  const nodeposter = policy.nodeSkript ?? [];
  const upptackt = policy.nodeSkriptUpptäckt ?? {};

  if (!symbol || projektposter.length === 0 || nodeposter.length === 0) {
    console.error(`❌ Policyn är ofullständig: ${policySokvag}`);
    console.error(
      '   Krävs: preflightSymbol, minst en playwrightProjekt-post, minst en nodeSkript-post.',
    );
    console.error(
      '   Tyst grön på tom policy får inte gå (samma regel som staging-semaforens T14).',
    );
    return EXIT_POLICYFEL;
  }

  const cli = join(repo, policy.playwrightCli);
  if (!existsSync(cli)) {
    console.error(`❌ Playwright-CLI:t saknas: ${cli}`);
    console.error('   Kör `npm ci` först — vakten läser Playwrights EGEN dependency-upplösning.');
    return EXIT_POLICYFEL;
  }

  const fel = [];
  const rader = [];

  /* ── 1. Playwright-ytorna ────────────────────────────────────────────── */

  const konsumenter = projektposter.filter((p) => p.klass === 'konsument');
  const barare = projektposter.filter((p) => p.klass === 'bärare');

  let listningar;
  try {
    listningar = await Promise.all(
      konsumenter.map(async (k) => ({ konsument: k, rapport: await listaProjekt(repo, cli, k) })),
    );
  } catch (listFel) {
    // Verktygets EGET utdata återges. En fail-closed-rapport som bara säger
    // "gick inte" kostar en hel diagnosrunda — mätt under bygget av denna vakt.
    console.error(`❌ playwright --list kunde inte köras: ${listFel.message}`);
    const detaljer = `${listFel.stderr ?? ''}${listFel.stdout ?? ''}`.trim();
    if (detaljer) console.error(`\n--- playwrights utdata ---\n${detaljer.slice(0, 4000)}`);
    console.error('\n   Fail-closed: en vakt som inte kunde svara läses ALDRIG som grönt ljus.');
    return EXIT_POLICYFEL;
  }

  const sedaProjekt = new Set();
  const bekraftadeBarare = new Set();
  const kallCache = new Map();
  const lasKodrader = (fil) => {
    if (!kallCache.has(fil)) kallCache.set(fil, kodrader(readFileSync(fil, 'utf-8')));
    return kallCache.get(fil);
  };

  for (const { konsument, rapport } of listningar) {
    for (const p of rapport.config?.projects ?? []) sedaProjekt.add(p.name);

    const karta = filerPerProjekt(rapport);
    const slutenhet = [...karta.keys()].filter((namn) => namn !== konsument.namn);

    if (slutenhet.length === 0) {
      fel.push(
        `${konsument.namn}: INGET dependency-projekt drogs in av \`--project=${konsument.namn} --list\`. ` +
          `Förväntat: \`${konsument.viaSetupProjekt}\`. Dependencyn ser ut att ha tappats i playwright.config.ts.`,
      );
      continue;
    }

    if (!slutenhet.includes(konsument.viaSetupProjekt)) {
      fel.push(
        `${konsument.namn}: setup-projektet \`${konsument.viaSetupProjekt}\` finns inte i den upplösta ` +
          `dependency-kedjan (fann: ${slutenhet.join(', ')}). Dependencyn pekar någon annanstans.`,
      );
      continue;
    }

    const setupfiler = [...karta.get(konsument.viaSetupProjekt)];
    const barande = setupfiler.filter((fil) => anropFinns(lasKodrader(fil), symbol));

    if (barande.length === 0) {
      fel.push(
        `${konsument.namn}: setup-projektet \`${konsument.viaSetupProjekt}\` körs, men INGEN av dess filer ` +
          `anropar ${symbol}() — ${setupfiler.map((f) => relative(repo, f)).join(', ')}. Anropsraden är borta.`,
      );
      continue;
    }

    bekraftadeBarare.add(konsument.viaSetupProjekt);
    rader.push(
      `✅ ${konsument.namn} → ${konsument.viaSetupProjekt} (${barande
        .map((f) => relative(repo, f))
        .join(', ')})`,
    );
  }

  for (const b of barare) {
    if (!bekraftadeBarare.has(b.namn)) {
      fel.push(
        `Bäraren \`${b.namn}\` bekräftades inte av någon konsument-körning. Antingen saknar den konsument ` +
          'i policyn, eller så nås den inte längre via en dependency.',
      );
    }
  }

  /* ── 2. Klassnings-nätet för Playwright (AC #5) ──────────────────────── */

  const configSokvag = join(repo, policy.playwrightConfig);
  if (!existsSync(configSokvag)) {
    console.error(`❌ Playwright-configen saknas: ${configSokvag}`);
    return EXIT_POLICYFEL;
  }
  const textProjekt = projektnamnITexten(readFileSync(configSokvag, 'utf-8'));

  const klassade = new Set(projektposter.map((p) => p.namn));
  const kanda = new Set([...sedaProjekt, ...textProjekt]);

  for (const namn of [...kanda].sort()) {
    if (!klassade.has(namn)) {
      fel.push(
        `Playwright-projektet \`${namn}\` är OKLASSAT. Lägg en post i ${STANDARD_POLICY}: ` +
          '`konsument` (med viaSetupProjekt), `bärare`, eller `undantagen` med skäl. ' +
          'En ny staging-rörande yta utan hake är exakt det denna vakt finns för.',
      );
    }
  }
  for (const namn of [...klassade].sort()) {
    if (!kanda.has(namn)) {
      fel.push(
        `Policy-posten \`${namn}\` motsvarar inget projekt i playwright.config.ts. ` +
          'Antingen är projektet borttaget (städa policyn) eller omdöpt (uppdatera posten).',
      );
    }
  }

  /* ── 3. Node-ytorna ──────────────────────────────────────────────────── */

  for (const post of nodeposter) {
    const fil = join(repo, post.sökväg);
    if (!existsSync(fil)) {
      fel.push(
        `${post.sökväg}: filen finns inte. Policyn pekar på en yta som inte längre existerar.`,
      );
      continue;
    }

    const kod = lasKodrader(fil);
    if (!kod.some((rad) => new RegExp(`import\\s*\\{[^}]*\\b${symbol}\\b`).test(rad))) {
      fel.push(`${post.sökväg}: importerar inte ${symbol} — hela haken är borta.`);
      continue;
    }

    const region = funktionsregion(kod, post.funktion);
    if (region === null) {
      fel.push(
        `${post.sökväg}: hittade ingen toppnivå-\`${post.funktion}()\` att läsa. Vakten vägrar gissa; ` +
          'har funktionen bytt form måste policyn eller vakten följa med.',
      );
      continue;
    }

    if (!anropFinns(region, symbol)) {
      fel.push(
        `${post.sökväg}: ${symbol}() anropas INTE i ${post.funktion}(). ` +
          'Importen finns kvar, men kodvägen bär inte längre preflighten — precis den refaktorering ' +
          'TASK-84:s agent flaggade att ingen grind fångar.',
      );
      continue;
    }

    rader.push(`✅ ${post.sökväg} → ${symbol}() i ${post.funktion}()`);
  }

  /* ── 4. Upptäckts-nätet för Node-ytor (AC #5) ────────────────────────── */

  const deklarerade = new Set(nodeposter.map((p) => p.sökväg));
  const undantagna = new Set((upptackt.undantagna ?? []).map((p) => p.sökväg));
  const markorer = upptackt.markörer ?? [];

  for (const katalog of upptackt.kataloger ?? []) {
    for (const fil of filerUnder(join(repo, katalog), upptackt.filändelser ?? [])) {
      const relativ = relative(repo, fil);
      if (deklarerade.has(relativ) || undantagna.has(relativ)) continue;

      const kalla = readFileSync(fil, 'utf-8');
      const traffad = markorer.find((m) => kalla.includes(m));
      if (traffad) {
        fel.push(
          `${relativ}: bär staging-markören \`${traffad}\` men är varken deklarerad yta eller undantagen. ` +
            `Lägg den i ${STANDARD_POLICY} — under \`nodeSkript\` om den ska bära preflighten, ` +
            'under `nodeSkriptUpptäckt.undantagna` med skäl om den inte når basen.',
        );
      }
    }
  }

  /* ── Rapport ─────────────────────────────────────────────────────────── */

  if (fel.length > 0) {
    console.error('❌ Staging-preflightens wiring är INTE intakt:\n');
    for (const f of fel) console.error(`   · ${f}`);
    console.error(
      '\n   Bakgrund: haken finns för att en lokal staging-körning inte ska kollidera med ett\n' +
        '   CI-jobb i samma delade Airtable-bas. Tappas den märks det först vid kollisionen, och\n' +
        '   ser då ut som ett slumpmässigt staging-fel. Se CONTRIBUTING.md § Staging-preflighten.',
    );
    return EXIT_WIRING_SAKNAS;
  }

  for (const rad of rader) console.log(rad);
  console.log(
    `\n✅ Staging-preflightens wiring intakt: ${konsumenter.length} Playwright-konsumenter över ` +
      `${barare.length} setup-projekt, ${nodeposter.length} Node-ytor. ` +
      `${klassade.size} projekt klassade, 0 oklassade.`,
  );
  return EXIT_OK;
}

process.exit(await main());
