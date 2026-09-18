#!/usr/bin/env node
// scripts/hermetik-sjalvtest.mjs — acceptance-klassens tvåsidiga bevis, körbart
// (task-60 / tråd T104 / ADR-080 beslut 3).
//
// VARFÖR SKRIPTET FINNS. Fram till och med task-59.4 bevisades hermetiken för
// hand: neutralisera testets egna `network.use()`-överskuggningar, töm
// normalläget, kör, läs utfallet, återställ ur en scratchpad-kopia. Tre skivor i
// rad gjorde exakt det (59.2, 59.3, 59.4) — och beviset fanns bara i agentens
// rapporttext. Inget i repot kunde köra om det. Klassen är densamma som flera
// fynd i S91: något som SER verifierat ut men inte kan verifieras om.
//
// VAD BEVISET SÄGER. Att varje test i acceptance-klassen faktiskt HÄNGER PÅ
// fixturvärlden. Tas svaren bort ska testet falla — och falla PÅ VAKTEN. Ett
// test som passerar ändå konsumerar inget EF-svar och bevisar därför ingenting
// om appens databeteende, hur grönt det än ser ut.
//
// VARFÖR ORSAKEN KONTROLLERAS OCH INTE BARA UTFALLET. Ett test kan falla av
// tusen skäl. Vore villkoret enbart "sviten blir röd" hade en trasig assertion,
// en timeout eller ett syntaxfel räknats som bevis för hermetiken. Skriptet
// kräver därför `OmockadRequestError` per test — samma skärpa som `TASK-57` gav
// vaktens meddelande. Det är också skälet att beviset INTE byggdes som
// `test.fail()` i sömmen: den annotationen kontrollerar att testet fälls, aldrig
// varför, och hade dessutom lagts i en delad modul vars kropp ESM-cachen kör en
// enda gång oavsett hur många spec-filer som importerar den.
//
// FORMEN ÄR REPOTS EGEN. `gate-proof.yml` (task-36.1) bevisar merge-grindens
// FAIL-gren genom att göra grindens utfall till leveransen, med en negativ
// kontroll som självtest. Detta skript är samma mönster på testklassen:
//
//   (default)           positivt bevis — kör med HERMETIK_SJALVTEST=1 och kräver
//                       att ALLA tester fälls, var och en av vakten.
//   --negativ-kontroll  kör UTAN flaggan. Sviten blir då grön, och skriptet ska
//                       FÄLLA. Utan detta läge vore skriptets gröna besked
//                       oskiljbart från ett skript som inte kan fälla alls.
//
// ═══ SKÄRVOR OCH TÄCKNING (TASK-366 / N6, 2026-09-18) ═══
// Beviset kördes fram till nu över HELA klassen i EN process, medan den skarpa
// sviten sedan TASK-239 varv 3 körs på tre parallella shards. Jobbet blev
// därmed CI:s kritiska väg. `--shard=I/N` ger beviset samma delning.
//
// Delningen kostar dock exakt det tomhetsspärren nedan skyddar: varje skärva för
// sig är icke-tom, så spärren säger grönt i var och en även om de TILLSAMMANS
// inte täckte klassen. `--tackning=<fil>` är motmedlet — skärvan skriver ned
// både sitt prövade antal och klassens listade antal, och ett sammanfattande
// jobb kräver att summan går ihop (scripts/hermetik-tackning.mjs). Kontrollen
// byggdes FÖRE delningen, i samma ändringsförslag, med avsikt.
//
// ═══ RÄKNESÄTTET — SAMMA FUNKTION PÅ BÅDA SIDOR ═══
// "Prövat antal" och "listat antal" MÅSTE räknas likadant, annars jämför
// summakontrollen två olika saker och blir antingen blind eller falsklarmande.
// Därför räknas båda av `plattaTester` nedan, på Playwrights JSON-rapport:
// körningen ger den ena, `--list --reporter=json` den andra, ur samma config,
// samma projekt och samma filter. Tre egenskaper gör det hållbart:
//
//   RETRIES påverkar `test.results[]`, aldrig antalet `spec.tests[]` —
//   räkningen är därmed retry-oberoende. (Beviset kör ändå `--retries=0`, av
//   korrekthetsskäl som står i korSvit nedan.)
//
//   `--list` ger varje test `status: 'skipped'` och tom `results` — en artefakt
//   av att inget kördes, inte av att testet är skippat. `plattaTester` räknar
//   POSTER, inte statusar, så den artefakten påverkar inte talet. Mätt
//   2026-09-18: 524 tester i 61 filer, identiskt i list- och körningsläge.
//
//   `test.skip`/`test.fixme` skulle synas som `expectedStatus: 'skipped'` i
//   listan och som status `skipped` i körningen — det förra räknas med, det
//   senare fälls redan av `bedomPositivt` ("status 'skipped', väntat
//   'unexpected'"). En sådan annotation gör alltså skärvan röd INNAN summan
//   hinner bli fel. Mätt 2026-09-18: noll annoterade tester i klassen.
//
// Exit: 0 = beviset håller · 1 = beviset håller INTE (drift) · 2 = körfel.

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { byggTackningsrapport } from './lib/hermetik-tackning.mjs';

/** Vaktens felklass. Träffas som substräng i Playwrights felmeddelande. */
const VAKT_FEL = 'OmockadRequestError';

/** Playwright-projektet beviset gäller. */
const PROJEKT = 'acceptance';

// ---------------------------------------------------------------------------
// Körning
// ---------------------------------------------------------------------------

/**
 * Kör acceptance-sviten och returnerar den parsade JSON-rapporten.
 *
 * Rapporten skrivs till FIL, aldrig till stdout: `global-teardown.ts` skriver
 * hermetik-mätningens sammanfattning till stdout i varje körning, vilket gör
 * stdout oanvändbart som JSON-kanal. `PLAYWRIGHT_JSON_OUTPUT_FILE` har högsta
 * prioritet i Playwrights `resolveOutputFile` och tar en explicit sökväg.
 */
function korSvit({ sjalvtest, filter = [], shard = null, listaBara = false }) {
  const katalog = mkdtempSync(path.join(tmpdir(), 'hermetik-sjalvtest-'));
  const rapportFil = path.join(katalog, 'rapport.json');

  const miljo = {
    ...process.env,
    PLAYWRIGHT_ACCEPTANCE_DEV_SERVER: '1',
    PLAYWRIGHT_JSON_OUTPUT_FILE: rapportFil,
  };
  if (sjalvtest) miljo.HERMETIK_SJALVTEST = '1';
  else delete miljo.HERMETIK_SJALVTEST;

  // `--retries=0` ÄR INTE EN OPTIMERING UTAN EN KORREKTHETSFRÅGA. Config sätter
  // `retries: process.env.CI ? 2 : 0` för att en flaky körning ska få en andra
  // chans. I självtestläget är en fällning det FÖRVÄNTADE utfallet, så varje
  // test kördes tre gånger och spelades in på video — 153 körningar i stället
  // för 51, för noll extra information. Mätt skarpt: CI-jobbets steg tog 289 s
  // med retries, och samma körning lokalt med CI=1 tog 297 s, vilket band
  // orsaken till retries och inte till runner-hastighet.
  //
  // Skärpan är dessutom en annan: ett test som fäller vid första försöket men
  // passerar vid andra är per definition INTE ett hermetik-bevis. Med retries
  // hade en sådan halv fällning räknats som grön.
  // FILTER = PR-GRINDENS URVAL (TASK-75), aldrig en egen bedömning. Posterna
  // kommer från ci-suite.yml:s `acceptance_selection`, som ci.yml redan
  // validerat mot mönster och disk. Tomt filter = hela klassen, vilket är vad
  // post-merge.yml och nightly.yml alltid kör.
  //
  // Beviset följer med urvalet av en anledning: körs den skarpa sviten på EN
  // spec-fil men självtestet på arton, blir självtestet jobbets nya kritiska
  // väg och urvalet en halv besparing. Att beviset därmed gäller delmängden och
  // inte hela klassen är samma arbetsdelning som sviten själv — hela klassens
  // tvåsidiga bevis körs på det mergade trädet.
  //
  // FAIL-CLOSED PÅ TOMHET GÄLLER FORTFARANDE: träffar filtret ingenting blir
  // testmängden tom, och `bedomPositivt` avvisar en tom svit uttryckligen. Ett
  // trasigt filter kan alltså inte ge grönt besked.
  //
  // SKÄRVAN GÅR ALDRIG IN I LIST-LÄGET (TASK-366). `--list` mäter vad KLASSEN
  // (eller urvalet) innehåller och är summakontrollens nämnare — hade `--shard`
  // följt med hade nämnaren krympt med täljaren och kontrollen blivit en
  // tautologi som alltid går ihop.
  const extra = listaBara ? ['--list'] : shard ? [`--shard=${shard}`] : [];
  const utfall = spawnSync(
    'npx',
    [
      'playwright',
      'test',
      `--project=${PROJEKT}`,
      '--reporter=json',
      '--retries=0',
      ...extra,
      ...filter,
    ],
    // stdout ÄRVS, buffras inte. `'pipe'` + `encoding` lät `spawnSync` samla
    // Playwrights list-utdata i minnet mot Nodes `maxBuffer`-default (1 MB) —
    // trots att bufferten aldrig lästes: enda referensen till `utfall` är
    // `.error`, och rapporten kommer från FIL via `PLAYWRIGHT_JSON_OUTPUT_FILE`
    // (se docblocket ovan). När acceptance-sviten växte förbi taket returnerade
    // `spawnSync` `ENOBUFS`, skriptet kastade "kunde inte starta Playwright",
    // och jobbet föll rött UTAN att ett enda test kört. Mätt 2026-08-22 på
    // PR #1831 och #1841 (två identiska fällningar, noll testutdata i loggen),
    // medan PR #1840 med färre nya tester passerade — en SKALNINGSVÄGG, inte
    // en flake. `'inherit'` tar bort taket helt och gör dessutom körningen
    // synlig i jobbloggen, som hittills varit tom vid just detta fel.
    // LIST-LÄGET TYSTAR STDOUT (TASK-366). Rapporten kommer från FIL även här,
    // och `--list` skriver en rad per test — 524 rader ren dubblett i varje
    // jobblogg, ovanpå körningens egen utdata. `'ignore'` och inte `'pipe'`:
    // pipe:en var just det som gav ENOBUFS när klassen växte (se ovan), och en
    // buffert som aldrig läses är ändå bara en vägg att slå i.
    {
      env: miljo,
      encoding: 'utf8',
      stdio: ['ignore', listaBara ? 'ignore' : 'inherit', 'inherit'],
    },
  );

  if (utfall.error) {
    rmSync(katalog, { recursive: true, force: true });
    throw new Error(`kunde inte starta Playwright: ${utfall.error.message}`);
  }

  let rapport;
  try {
    rapport = JSON.parse(readFileSync(rapportFil, 'utf8'));
  } catch (orsak) {
    rmSync(katalog, { recursive: true, force: true });
    throw new Error(`kunde inte läsa JSON-rapporten (${rapportFil}): ${orsak.message}`);
  }
  rmSync(katalog, { recursive: true, force: true });

  return rapport;
}

/** Plattar Playwrights godtyckligt djupa suite-träd till en lista av tester. */
export function plattaTester(rapport) {
  const specs = (rapport.suites ?? []).flatMap(function ned(svit) {
    return [...(svit.specs ?? []), ...(svit.suites ?? []).flatMap(ned)];
  });

  return specs.flatMap((spec) =>
    (spec.tests ?? []).map((test) => ({
      fil: spec.file,
      titel: spec.title,
      status: test.status,
      // Alla försök vägs in, inte bara det sista: med retries aktiverade ska
      // vakten vara orsaken i minst ett försök för att beviset ska gälla.
      vaktenFallde: (test.results ?? []).some((r) =>
        `${r.error?.message ?? ''}${(r.errors ?? []).map((e) => e.message ?? '').join('')}`.includes(
          VAKT_FEL,
        ),
      ),
    })),
  );
}

// ---------------------------------------------------------------------------
// Bedömning
// ---------------------------------------------------------------------------

/**
 * Prövar den positiva formen: varje test ska ha fällts, och vakten ska vara
 * orsaken i vart och ett.
 */
export function bedomPositivt(tester) {
  const avvikelser = [];

  // FAIL-CLOSED PÅ TOMHET. En tom svit uppfyller "alla tester fälldes" vakuöst.
  // Utan denna kontroll hade ett trasigt filter, ett felstavat projektnamn eller
  // en flyttad testkatalog gett grönt besked utan att ett enda test kört.
  if (tester.length === 0) {
    avvikelser.push('noll tester kördes — en tom svit bevisar ingenting (fail-closed)');
    return { hallbart: false, avvikelser };
  }

  for (const test of tester) {
    if (test.status !== 'unexpected') {
      avvikelser.push(
        `${test.fil} › ${test.titel} — status '${test.status}', väntat 'unexpected'. ` +
          'Testet överlever utan fixturens svar och bevisar därför inget om appens databeteende.',
      );
      continue;
    }
    if (!test.vaktenFallde) {
      avvikelser.push(
        `${test.fil} › ${test.titel} — fälldes, men INTE av hermetik-vakten. ` +
          `Utan ${VAKT_FEL} i felet är fällningen inget hermetik-bevis.`,
      );
    }
  }

  return { hallbart: avvikelser.length === 0, avvikelser };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

/** Plockar ut ett `--flagga=värde` ur argumentlistan. */
function flaggvarde(argv, namn) {
  const prefix = `--${namn}=`;
  const trad = argv.find((a) => a.startsWith(prefix));
  return trad ? trad.slice(prefix.length) : null;
}

/**
 * Tolkar `--shard=I/N`. Fail-closed på varje avvikande form: ett tyst ignorerat
 * shard-argument hade kört HELA klassen i varje skärva — tre gånger arbetet,
 * en summa på 3×listat, och ett besked ingen kan tolka.
 */
export function parsaShard(varde) {
  if (varde === null) return { shardIndex: 1, shardTotal: 1, fel: null };

  const traff = /^(\d+)\/(\d+)$/.exec(varde);
  if (!traff) {
    return { shardIndex: null, shardTotal: null, fel: `--shard='${varde}' — väntad form I/N` };
  }
  const shardIndex = Number(traff[1]);
  const shardTotal = Number(traff[2]);
  if (shardTotal < 1) {
    return { shardIndex: null, shardTotal: null, fel: `--shard='${varde}' — N måste vara >= 1` };
  }
  if (shardIndex < 1 || shardIndex > shardTotal) {
    return {
      shardIndex: null,
      shardTotal: null,
      fel: `--shard='${varde}' — I måste ligga i 1..${shardTotal}`,
    };
  }
  return { shardIndex, shardTotal, fel: null };
}

function main(argv) {
  const negativKontroll = argv.includes('--negativ-kontroll');
  // Allt som inte är en flagga är ett fil-filter som skickas vidare till
  // Playwright ordagrant (TASK-75). Skriptet tolkar dem aldrig — validering av
  // formen bor på ETT ställe, i scripts/acceptance-urval.sh.
  const filter = argv.filter((a) => !a.startsWith('--'));

  const shardArg = flaggvarde(argv, 'shard');
  const { shardIndex, shardTotal, fel: shardFel } = parsaShard(shardArg);
  if (shardFel) throw new Error(shardFel);
  const tackningsFil = flaggvarde(argv, 'tackning');

  if (filter.length > 0) {
    console.log(`▶ URVAL — beviset körs på ${filter.length} spec-fil(er): ${filter.join(' ')}\n`);
  }

  if (shardArg) console.log(`▶ SKÄRVA ${shardIndex}/${shardTotal} av klassen.\n`);

  if (negativKontroll) {
    console.log('▶ NEGATIV KONTROLL — kör UTAN HERMETIK_SJALVTEST. Sviten ska bli grön,');
    console.log('  och detta skript ska då FÄLLA. Ett grönt besked här vore regressionen.\n');
  } else {
    console.log('▶ POSITIVT BEVIS — kör med HERMETIK_SJALVTEST=1: normalläget tömt och');
    console.log('  testens egna network.use()-överskuggningar verkningslösa.\n');
  }

  const rapport = korSvit({
    sjalvtest: !negativKontroll,
    filter,
    shard: shardArg ? `${shardIndex}/${shardTotal}` : null,
  });
  const tester = plattaTester(rapport);
  const { hallbart, avvikelser } = bedomPositivt(tester);

  const fallda = tester.filter((t) => t.status === 'unexpected').length;
  const avVakten = tester.filter((t) => t.vaktenFallde).length;
  console.log(
    `\n${tester.length} tester · ${fallda} fällda · ${avVakten} med ${VAKT_FEL} som orsak`,
  );

  // TÄCKNINGSRAPPORTEN SKRIVS FÖRE DOMEN NEDAN, med avsikt: en skärva som faller
  // på sin egen bedömning ska ändå lämna sitt tal efter sig, så summasteget kan
  // säga VILKEN skärva som inte gick ihop i stället för bara att en saknas.
  if (tackningsFil) {
    // `--list` UTAN shard mäter hela klassen (eller hela urvalet) — nämnaren i
    // summakontrollen. Kostnaden är mätt till ~3 s lokalt mot en körning på
    // minuter; den startar ingen dev-server (Playwright hoppar över webServer i
    // list-läget) trots att env-flaggan är satt.
    const listRapport = korSvit({ sjalvtest: !negativKontroll, filter, listaBara: true });
    const listat = plattaTester(listRapport).length;

    const tackning = byggTackningsrapport({
      shardIndex,
      shardTotal,
      provade: tester.length,
      listat,
      projekt: PROJEKT,
      filter,
    });
    mkdirSync(path.dirname(path.resolve(tackningsFil)), { recursive: true });
    writeFileSync(tackningsFil, `${JSON.stringify(tackning, null, 2)}\n`, 'utf8');
    console.log(
      `\n▶ TÄCKNING — skärva ${shardIndex}/${shardTotal} prövade ${tester.length} av ` +
        `${listat} listade. Nedskriven i ${tackningsFil}.`,
    );
  }

  if (negativKontroll) {
    // Inverterad läsning: den positiva bedömningen SKA falla här.
    if (hallbart) {
      console.error(
        '\n❌ NEGATIV KONTROLL MISSLYCKADES — bedömningen höll utan självtestläget.\n' +
          '   Grinden kan alltså inte skilja en hermetisk svit från en tömd, och dess\n' +
          '   gröna besked betyder ingenting.',
      );
      return 1;
    }
    console.log(
      '\n✅ NEGATIV KONTROLL GRÖN — bedömningen föll som den skulle utan självtestläget.',
    );
    console.log(`   Första avvikelsen: ${avvikelser[0]}`);
    return 0;
  }

  if (!hallbart) {
    console.error(`\n❌ BEVISET HÅLLER INTE — ${avvikelser.length} avvikelser:\n`);
    for (const rad of avvikelser) console.error(`   · ${rad}`);
    console.error(
      '\n   Ett test som överlever utan fixturens svar hör inte hemma i klassen, eller\n' +
        '   behöver skrivas om så att det faktiskt konsumerar svaret det påstår sig pröva.',
    );
    return 1;
  }

  console.log('\n✅ BEVISET HÅLLER — varje test i acceptance-klassen hänger på fixturvärlden,');
  console.log('   och vakten är fällningsorsaken i vart och ett.');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (orsak) {
    console.error(`\n❌ KÖRFEL: ${orsak.message}`);
    process.exit(2);
  }
}
