// EF-metod-vakten — EN förväntan för alla allowlistade Edge Functions (TASK-38).
//
// KONTRAKTET: varje EF som får deployas till prod avvisar fel HTTP-metod med 405
// FÖRE auth-kontrollen. Fel metod är ett kontraktsfel, inte ett auth-fel — svaret
// ska vara detsamma oavsett vem som frågar.
//
// VARFÖR KÄLLKODS-NIVÅ OCH INTE HTTP: ordnings-egenskapen ("405 före auth") kan
// bara observeras runtime via en anropare som passerar gateway men FALLER i
// requireUser (anon-key), och en sådan probe mäter den DEPLOYADE artefakten —
// inte den kod som just ändrats. Denna grind mäter källan, körs utan creds i
// api-pure och fäller i review innan en regression hinner deployas. Runtime-
// sidan bevakas separat av per-EF-conformance-testerna i api-staging.
//
// S84:s deny-smoke (2026-07-24) behövde en KÄLLKODS-KLASSNING per endpoint för
// att veta om 405 eller 401 var rätt förväntan — sex EF:er bar vakten, sju inte
// (L331). Klassningen är borta i och med TASK-38: kontraktet är ett och samma
// för hela allowlisten, och denna grind är det som håller det så.
//
// KONFIG-DRIVEN (Lesson #6): listan läses ur .prod-functions-allowlist.conf —
// samma SSOT som scripts/deploy-prod-functions.sh. Utvidgas allowlisten (T46:s
// go-live-karta) omfattas den nya funktionen automatiskt av grinden.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ALLOWLIST_FILE = path.join(REPO_ROOT, '.prod-functions-allowlist.conf');
const FUNCTIONS_DIR = path.join(REPO_ROOT, 'supabase', 'functions');

// Metod-vaktens form: `if (req.method !== '<METOD>') {`. MEDVETET SMAL — den
// matchar husets enda befintliga form (en tillåten metod per EF). Behöver en
// framtida EF tillåta flera metoder fäller grinden, och det är rätt utfall: en
// ny vakt-form ska godkännas här explicit, inte glida igenom omärkt.
const GUARD_RE = /if \(req\.method !== '[A-Z]+'\) \{/;
// Fönstret som ska innehålla vaktens EGET svar (405 + felmeddelandet). Håller
// träffen ankrad till vaktens response och inte till någon senare 405 i filen.
const GUARD_BODY_WINDOW = 300;

/**
 * Läser allowlisten på samma form som deploy-skriptet: en funktion per rad,
 * `#` inleder kommentar, blanksteg ignoreras.
 */
function readAllowlist(): string[] {
  return readFileSync(ALLOWLIST_FILE, 'utf8')
    .split('\n')
    .map((line) => line.replace(/#.*$/, '').trim())
    .filter((line) => line.length > 0);
}

const ALLOWLIST = readAllowlist();

// EF:er med INTERN auth i stället för requireUser — maskin-anropade
// konsumenter där anroparen aldrig är en människa. Metod-vaktens kontrakt
// (405 + 'Method not allowed' före auth, handleCors före vakten) kvarstår
// oförändrat; requireUser-kravet ERSÄTTS av krav på den dokumenterade
// interna auth-formen: konstanttids-jämförd delad hemlighet med fail-closed
// på osatt secret. En funktion läggs hit ENDAST med källmärkt rationale i
// sitt eget filhuvud. Detta är den explicita godkännande-punkt filhuvudet
// ovan utlovar ("en ny vakt-form ska godkännas här explicit").
//
//   jobb-konsument: ADR-129 beslut 6 — anroparen är cron (`jobb_cron_tick()`)
//   eller kicken (`koa-kvitton`), aldrig en människa; auth är
//   `x-jobbmotor-hemlighet` jämförd i konstanttid, och `requireUser` avvisar
//   uttryckligen anon-rollen som cron bär. Tillagd 2026-09-01 (PR #2194,
//   promoveringssekvensens steg 8) när funktionen gick in i prod-allowlisten.
const INTERN_AUTH_EF: Record<string, { hemlighetsEnv: string }> = {
  'jobb-konsument': { hemlighetsEnv: 'JOBBMOTOR_DELAD_HEMLIGHET' },
};

test.describe('EF-metod-vakten — 405 före auth för hela prod-allowlisten (TASK-38)', () => {
  // FAIL-CLOSED: per-funktions-testerna genereras ur listan. Blir listan tom
  // (flyttad/omdöpt conf-fil, ändrat kommentar-format) genereras NOLL tester och
  // sviten blir tyst grön — en vakt vars villkor matchar noll objekt är fail-open.
  // Detta test är spärren mot exakt det.
  test('allowlisten är läst och icke-tom', () => {
    expect(ALLOWLIST.length).toBeGreaterThan(0);
  });

  for (const fn of ALLOWLIST) {
    test(`${fn}: metod-vakt returnerar 405 före requireUser`, () => {
      const source = readFileSync(path.join(FUNCTIONS_DIR, fn, 'index.ts'), 'utf8');

      const guardIdx = source.search(GUARD_RE);
      expect(
        guardIdx,
        `${fn}: saknar explicit metod-vakt (if (req.method !== '…'))`,
      ).toBeGreaterThan(-1);

      const guardBody = source.slice(guardIdx, guardIdx + GUARD_BODY_WINDOW);
      expect(guardBody, `${fn}: metod-vakten svarar inte 405`).toContain('405');
      expect(guardBody, `${fn}: metod-vakten saknar 'Method not allowed'-kropp`).toContain(
        'Method not allowed',
      );

      const internAuth = INTERN_AUTH_EF[fn];
      if (internAuth) {
        // Intern-auth-klassen: requireUser FÅR INTE förekomma (dyker den upp
        // är klassningen fel och ska omprövas här, inte glida igenom), och
        // den dokumenterade formen ska finnas: konstanttids-jämförelse plus
        // fail-closed-läsning av hemligheten, EFTER metod-vakten.
        expect(
          source.indexOf('requireUser(req'),
          `${fn}: klassad som intern-auth men anropar requireUser — ompröva klassningen`,
        ).toBe(-1);
        expect(source, `${fn}: saknar konstanttids-jämförelsen`).toContain('likaIKonstantTid(');
        const hemlighetsIdx = source.indexOf(`Deno.env.get('${internAuth.hemlighetsEnv}')`);
        expect(
          hemlighetsIdx,
          `${fn}: läser inte hemligheten ${internAuth.hemlighetsEnv} fail-closed`,
        ).toBeGreaterThan(-1);
        expect(
          guardIdx,
          `${fn}: metod-vakten ligger EFTER den interna auth-kontrollen`,
        ).toBeLessThan(hemlighetsIdx);
      } else {
        const authIdx = source.indexOf('requireUser(req');
        expect(authIdx, `${fn}: anropar inte requireUser`).toBeGreaterThan(-1);
        expect(guardIdx, `${fn}: metod-vakten ligger EFTER auth-kontrollen`).toBeLessThan(authIdx);
      }

      // OPTIONS-preflighten måste fångas av handleCors INNAN metod-vakten —
      // annars 405:ar EF:en varje CORS-preflight och browsern blockerar appen.
      const corsIdx = source.indexOf('handleCors(req)');
      expect(corsIdx, `${fn}: anropar inte handleCors`).toBeGreaterThan(-1);
      expect(corsIdx, `${fn}: metod-vakten ligger FÖRE CORS-preflighten`).toBeLessThan(guardIdx);
    });
  }
});
