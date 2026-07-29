// scripts/lib/staging-preflight.mjs — staging-preflight för de Node-script som
// rör staging-basen UTAN att gå via Playwright (TASK-84).
//
// ═══ HÅLET DEN STÄNGER ═══
// TASK-77 wirade preflighten i Playwrights setup-projekt, vilket täcker
// `test:api:staging`, `test:e2e:staging` och `vakt:kontrakt`. Tre ytor har
// inget setup-projekt att haka i och gick därför förbi mekanismen helt.
// `purge:staging` och `seed:review` är två av dem: rena Node-script, ingen
// Playwright, egen väg rakt in i samma delade Airtable-bas.
//
// `purge:staging` är den skarpaste. TASK-76 visade att två samtidiga
// purge-körningar racar om samma poster; den fixen gör skriptet robust mot
// racet, inte fritt från det. En lokal purge mot CI:s `Staging sentinel purge`
// är exakt det racet — bara med en aktör som ingen av de två mutexarna såg.
// `seed:review` bygger granskningsdata åt Marcus, och en CI-purge mitt i den
// körningen är precis vad skriptets korsläsning mot `.purge-staging-policy.json`
// finns för att förhindra.
//
// ═══ VARFÖR HÄR, OCH INTE SOM PREFIX I package.json ═══
// Samma skäl som gjorde att TASK-77 la sin hake i setup-projekten i stället för
// i npm-skripten: ett kommandonamns-prefix bevakar kommandonamnet, inte
// kodvägen. `node scripts/purge-staging-sentinels.mjs` är den form CI självt
// använder (ci-suite.yml rad 125) och den en agent lika gärna skriver lokalt —
// den hade gått rakt förbi ett `&&`-prefix i package.json. Haken sitter därför
// i skriptets `main()`, på den väg som faktiskt når basen.
//
// ═══ NO-OP I CI ═══
// Icke förhandlingsbart, och skarpare här än på Playwright-sidan:
// `purge-staging-sentinels.mjs` ÄR CI-jobbet `Staging sentinel purge`. En
// preflight som körde där hade sett sitt eget jobb som hållare och fällt
// purge-jobbet varje gång. Signalen är `GITHUB_ACTIONS` — den sätts bara av
// GitHubs runner, medan `CI` sätts av godtyckliga verktyg.
//
// ═══ FORMEN ÄR TASK-77:s, ANPASSNINGEN ÄR VÄRDENS ═══
// Logiken duplicerades INTE: både denna modul och `tests/support/
// staging-preflight.ts` anropar samma `scripts/staging-semaphore.sh preflight`,
// som är enda sanningskällan för vad "staging är upptaget" betyder. Skillnaden
// är hur ett fall rapporteras. Playwright-sidan KASTAR (ett setup-projekt
// signalerar fel via undantag); här AVSLUTAS processen, för att ett CLI-script
// inte har någon annan väg ut — och skriptens egna `main()` gör redan exakt så
// vid guard-fel.
//
// Exit-koden PROPAGERAS ORÖRD från semaforen i stället för att mappas till
// skriptens egen `1`: 76 (CI håller staging) och 77 (sonden kunde inte svara)
// är redan dokumenterade i staging-semaphore.sh, och skriptens `1` betyder
// redan "guard-/konfigurationsfel". Att slå ihop dem hade gjort felet
// tvetydigt i loggen.
//
// Vägen förbi är ETT aktivt val och är densamma för hela kedjan:
//
//     MM_STAGING_PREFLIGHT=off npm run purge:staging
//
// Ärlig gräns, ärvd från TASK-77 och inte utökad här: preflighten är en
// kontroll vid START, inte ett hållet lås. En CI-körning som startar EFTER din
// lokala start fångas inte. Fönstret krymper kraftigt men stängs inte — det
// kräver en gemensam sanningskälla över CI/lokal-gränsen, vilket ägs av T85
// våg 3 (staging-per-run-isolering) och inte är fattat här.

import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEMAFOR_SKRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'staging-semaphore.sh');

/**
 * Fäller körningen om ett staging-rörande CI-jobb är igång eller köat.
 *
 * Anropas FÖRE första begäran mot Airtable och EFTER skriptets egna
 * policy-/token-guards: saknas token är det felet som ska synas, och en
 * körning som ändå inte når basen ska inte betala för ett API-anrop mot
 * GitHub. Avslutar processen med semaforens egen exit-kod vid fällning
 * (76 = CI håller staging, 77 = sonden kunde inte svara) — den återvänder
 * bara när vägen är fri.
 *
 * @param {string} agare Vem som vill köra — skrivs ut i fällnings-meddelandet.
 */
export function kravStagingLedigt(agare) {
  if (process.env.GITHUB_ACTIONS === 'true') return;

  // stdio 'inherit' med flit: semaforens fällnings-block förklarar redan VARFÖR
  // och hur man tar sig förbi. Att fånga och skriva om det hade gjort
  // felmeddelandet till en andra, sämre kopia av samma text.
  const resultat = spawnSync('bash', [SEMAFOR_SKRIPT, 'preflight', agare], {
    stdio: ['ignore', 'inherit', 'inherit'],
  });

  if (resultat.error) {
    console.error(`❌ Staging-preflighten kunde inte köras: ${resultat.error.message}`);
    console.error(
      '   Fail-closed: en preflight som inte kunde svara läses ALDRIG som grönt ljus.\n' +
        '   Medvetet förbi: MM_STAGING_PREFLIGHT=off <ditt kommando>',
    );
    process.exit(77);
  }

  // status === null betyder dödad av signal — samma fail-closed-riktning.
  if (resultat.status !== 0) process.exit(resultat.status ?? 77);
}
