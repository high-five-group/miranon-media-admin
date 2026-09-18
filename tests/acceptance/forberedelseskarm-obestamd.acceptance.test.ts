import type { NetworkFixture } from '@msw/playwright';
import { HttpResponse, http } from 'msw';
import {
  EVENTS_RESPONSE,
  FROZEN_NOW,
  REGISTRATIONS_RESPONSE,
} from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { FIXTUR_EPOST, FIXTUR_SESSION_EXP_S } from '../support/fixturvarld/hermetic';
import { expect, type Page, test } from './acceptance-bas';

/**
 * TASK-451.1 — rött-först-bevis för AC #1/#2/#3 (PRD TASK-451,
 * docs/research/kallstarten-diagnoskarta-2026-09-18.md § 1.4–1.5, § 5.3
 * scenario A + C, § 6 punkt 1).
 *
 * ═══ VAD DEN BEVISAR ═══
 *
 * Förberedelseskärmens bar är `width: 0%` (en nollbred, osynlig div) under
 * HELA auth-fasen (`main.tsx:439`, `FORBEREDELSESKARM_VANTAR = {klara:0,
 * totalt:1}`) och tills FÖRSTA av startvärmningens sju hämtningar settlar
 * (`startvarmningen.ts:414–417`, `.finally()`-räknaren). En seende användare
 * ser ingenting röra sig i det fönstret — diagnoskartans § 1.5.
 *
 * Denna fil bevisar mekaniskt att skärmen, från att den blir SYNLIG tills
 * första hämtningen settlat, visar en OBESTÄMD (indeterminate) men SYNLIG
 * rörelse i stället för en osynlig 0-bredd — och att den övergår till
 * dagens determinate "X av N"-bar så fort något settlar. Två oberoende
 * mekanismer kan producera "klara=0"-fönstret (diagnoskartans § 4 H-B/H-F),
 * så båda scenarierna nedan täcks var för sig:
 *
 *   A. Warmup-fasen: batch 1 (`get-events`+`get-registrations`,
 *      `startvarmningen.ts:409–421`) hålls tillbaka — samma fönster som
 *      diagnoskartans § 5.3 scenario A isolerar.
 *   C. Auth-fasen: en seg `refresh_token`-runda (`AuthProvider.tsx:74–89`,
 *      `@supabase/auth-js` `GoTrueClient.__loadSession()` — läst källkod,
 *      `node_modules/@supabase/auth-js/dist/module/GoTrueClient.js:2503–2586`:
 *      `getSession()` väntar in HELA `_callRefreshToken`-anropet innan den
 *      resolvar, så `AuthProvider`s `isLoading` förblir `true` under hela
 *      fördröjningen) — diagnoskartans § 5.3 scenario C, H-F.
 *
 * ═══ HALLBARMOCK, INTE `delay()` (samma korrigering som `laddning-cls.
 * acceptance.test.ts` § HALLBARMOCK) ═══
 *
 * Ett tidsstyrt `delay(ms)` + en sampling-loop är i sig ett tidsfönster att
 * missa under CI-last. `nyHallbarState()` (duplicerad lokal kopia av
 * mönstret — etablerad konvention, se `laddning-cls.acceptance.test.ts`,
 * `event-checkin-laddlage.acceptance.test.ts`, `mer-aktivitetshistorik-
 * laddlage.acceptance.test.ts`: varje fil bär sin egen kopia, ingen delad
 * modul finns i `tests/support/`) parkerar svaret DETERMINISTISKT tills
 * testet självt släpper det — inget tidsfönster, ingen flake.
 *
 * ═══ TIMEOUT-OVERRIDEN (§5.2) ═══
 *
 * `playwright.config.ts` sätter `VITE_E2E_WARMUP_TIMEOUT_MS: '50'` för
 * acceptance-webServern (normalläget för de ~190 tester som inte bryr sig om
 * warmup-UI:t). Utan override hade gaten TIMEOUT:at efter 50 ms oavsett hur
 * länge hallen hålls, och skärmen hade försvunnit innan något gick att
 * observera. `sessionStorage['e2eVarmningTimeoutMs']` (läst av
 * `lasVarmningTimeoutOverride()`, `startvarmningen.ts:357–366`) går FÖRE
 * env-defaulten (`main.tsx:beraknaVarmningTimeoutMs`) — satt till 9000 ms
 * (produktionens riktiga ADR-112-timeout) ger gott om marginal för
 * testkoden att hinna assertera INNAN gaten skulle timeouta av sig själv.
 *
 * ═══ SCENARIO C:S EXPIRED SESSION ═══
 *
 * `tests/support/fixturvarld/hermetic.ts`s `page`-fixtur seedar redan en
 * INLOGGAD, ALDRIG UTGÅENDE session (`expires_at` = `FIXTUR_SESSION_EXP_S`,
 * 10 år fram) — motsatsen till vad detta scenario behöver. Denna fil
 * återanvänder mönstret från `login.acceptance.test.ts` § "Fixturvärldens
 * EGNA page-fixtur seedar…": ett EGET `page.addInitScript()` i testkroppen
 * körs EFTER fixturens (registreringsordning), skriver över samma
 * `localStorage`-nyckel med en session vars `expires_at` redan passerat
 * `FROZEN_NOW` — `GoTrueClient.__loadSession()`s `hasExpired`-koll läser
 * ENDAST det lagrade `expires_at`-fältet (inte JWT:ens egen `exp`-claim), så
 * en förfluten `expires_at` räcker för att tvinga fram
 * `_callRefreshToken()`-vägen.
 */

// ─── Håll-bar mock-state (hallbarMock-mönstret) ────────────────────────────

type HallbarState = { slappAlla: () => void };

function nyHallbarState(): HallbarState & { vantaOmHallen: () => Promise<void> } {
  let hall = true;
  const parkerade: Array<() => void> = [];
  return {
    vantaOmHallen: () =>
      hall ? new Promise<void>((slapp) => parkerade.push(slapp)) : Promise.resolve(),
    slappAlla() {
      hall = false;
      for (const slapp of parkerade.splice(0)) slapp();
    },
  };
}

/** Batch 1 = `events` + `registrations` (`startvarmningen.ts:242–265`,
 *  `BATCH_SIZE = 2`, indexordningen i `WARMUP_ITEMS`). */
function hallbarBatch1(network: NetworkFixture): HallbarState {
  const st = nyHallbarState();
  network.use(
    http.get(EF('get-events'), async () => {
      await st.vantaOmHallen();
      return json(EVENTS_RESPONSE);
    }),
    http.get(EF('get-registrations'), async () => {
      await st.vantaOmHallen();
      return json(REGISTRATIONS_RESPONSE);
    }),
  );
  return st;
}

// ─── Scenario C:s expired session + hallbar refresh-grant ─────────────────

const AUTH_STORAGE_KEY = 'sb-visual-fixture-auth-token';

function b64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

/** En session vars `expires_at` redan passerat FROZEN_NOW — se filhuvudets
 *  § "Scenario C:s expired session" för varför bara detta fältet spelar roll. */
function seedaUtganganSession(page: Page) {
  const forflutenExpiresAt = Math.floor(FROZEN_NOW.getTime() / 1000) - 3600;
  const userId = '00000000-0000-4000-8000-000000000097';
  const accessToken = [
    b64url({ alg: 'HS256', typ: 'JWT' }),
    b64url({ sub: userId, email: FIXTUR_EPOST, role: 'authenticated', exp: forflutenExpiresAt }),
    'forberedelseskarm-obestamd-test-signatur',
  ].join('.');
  const session = {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 0,
    expires_at: forflutenExpiresAt,
    refresh_token: 'forberedelseskarm-obestamd-test-refresh',
    user: {
      id: userId,
      aud: 'authenticated',
      role: 'authenticated',
      email: FIXTUR_EPOST,
      email_confirmed_at: '2026-01-01T00:00:00Z',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { display_name: 'Lotta' },
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  };
  return page.addInitScript(
    ([key, s]) => {
      window.localStorage.setItem(key as string, JSON.stringify(s));
    },
    [AUTH_STORAGE_KEY, session] as const,
  );
}

/** Lyckad `refresh_token`-grant — samma GoTrue-svarsform som
 *  `login.acceptance.test.ts`s `lyckadLosenordsInloggningSvar`, men med en
 *  NY, giltig `expires_at` (FIXTUR_SESSION_EXP_S) så inget FÖLJANDE
 *  EF-anrops egna `getSession()`-läsning (`supabase-client.ts`
 *  `getAuthHeader()`) triggar en ANDRA refresh-runda. */
function refreshadSessionSvar() {
  const expiresAt = FIXTUR_SESSION_EXP_S;
  const userId = '00000000-0000-4000-8000-000000000097';
  const accessToken = [
    b64url({ alg: 'HS256', typ: 'JWT' }),
    b64url({ sub: userId, email: FIXTUR_EPOST, role: 'authenticated', exp: expiresAt }),
    'forberedelseskarm-obestamd-test-signatur-refreshed',
  ].join('.');
  return HttpResponse.json({
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 24 * 60 * 60,
    expires_at: expiresAt,
    refresh_token: 'forberedelseskarm-obestamd-test-refresh-2',
    user: {
      id: userId,
      aud: 'authenticated',
      role: 'authenticated',
      email: FIXTUR_EPOST,
      email_confirmed_at: '2026-01-01T00:00:00Z',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { display_name: 'Lotta' },
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  });
}

function hallbarRefreshGrant(network: NetworkFixture): HallbarState {
  const st = nyHallbarState();
  network.use(
    http.post('*/auth/v1/token', async ({ request }) => {
      // MSW matchar INTE query-strängen i mönstret (samma gotcha som
      // `login.acceptance.test.ts` § dokumenterar) — grant_type läses ur
      // request.url i resolvern. `return undefined` för andra grant-typer
      // låter dem falla igenom (ingen annan grant-typ förekommer i detta
      // scenario — noll `signInWithPassword`-anrop sker).
      const grantType = new URL(request.url).searchParams.get('grant_type');
      if (grantType !== 'refresh_token') return undefined;
      await st.vantaOmHallen();
      return refreshadSessionSvar();
    }),
  );
  return st;
}

// ─── Delade lokatorer + hjälpare ───────────────────────────────────────────

const BLOCK = '[data-testid="forberedelseskarm-block"]';
const BAR = '[role="progressbar"]';
const OBESTAMD_SEGMENT = '[data-testid="forberedelseskarm-bar-obestamd"]';

function sattVarmningTimeout(page: Page, ms: number) {
  // Se filhuvudets § "Timeout-overriden". Try/catch: samma skyddsräcke som
  // startvarmningen.ts:s egen `lasVarmningTimeoutOverride()` — låst lagring
  // ger produktionsdefaulten i stället för en kraschad sida.
  return page.addInitScript((varde) => {
    try {
      sessionStorage.setItem('e2eVarmningTimeoutMs', String(varde));
    } catch {
      // Se ovan.
    }
  }, ms);
}

test.describe('Forberedelseskarm — obestämd rörelse vid klara=0 (TASK-451.1)', () => {
  test('Scenario A: batch 1 hålls tillbaka — bevisligen obestämd innan första settle, determinate direkt efter', async ({
    page,
    network,
  }) => {
    await sattVarmningTimeout(page, 9000);
    const batch1 = hallbarBatch1(network);

    await page.goto('/hem');

    const block = page.locator(BLOCK);
    await expect(block).toBeVisible();

    const bar = page.locator(BAR);
    await expect(bar).toHaveCount(1);

    // AC #3 — RÖD I DAG: `aria-valuenow="0"` (determinate 0 %).
    // GRÖNT EFTER FIX: attributet är helt frånvarande (W3C APG: obestämd
    // progressbar bär ALDRIG aria-valuenow).
    await expect(bar).not.toHaveAttribute('aria-valuenow');
    await expect(bar).not.toHaveAttribute('aria-valuetext');

    // AC #2 — RÖD I DAG: fyllnaden är `style="width: 0%"`, en nollbred div
    // (`Forberedelseskarm.tsx:385` FÖRE denna skiva) — `data-testid` finns
    // inte alls, `toBeVisible()` timeoutar mot noll matchande element.
    // GRÖNT EFTER FIX: en synlig, icke-nollbred obestämd-indikator.
    const segment = page.locator(OBESTAMD_SEGMENT);
    await expect(segment).toBeVisible();
    const box = await segment.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(0);

    // Släpp batch 1 — bar ska övergå till DAGENS determinate "X av N".
    batch1.slappAlla();
    await expect(bar).toHaveAttribute('aria-valuenow', '2');
    await expect(bar).toHaveAttribute('aria-valuetext', '2 av 7 hämtningar klara');
    await expect(page.locator(OBESTAMD_SEGMENT)).toHaveCount(0);
  });

  test('Scenario C: seg token-refresh — auth-fasens 0/1-skärm är LIKA obestämd, ingen egen skärm-artefakt', async ({
    page,
    network,
  }) => {
    await sattVarmningTimeout(page, 9000);
    await seedaUtganganSession(page);
    const refresh = hallbarRefreshGrant(network);

    await page.goto('/hem');

    const block = page.locator(BLOCK);
    await expect(block).toBeVisible();

    const bar = page.locator(BAR);
    // AC #3 — samma bevis som scenario A, men i AUTH-fasen
    // (`FORBEREDELSESKARM_VANTAR = {klara:0, totalt:1}`, `main.tsx:439`) —
    // en HELT ANNAN kodväg än warmup-fasens klara=0, och måste bevisas
    // separat: de delar bara predikatet `klara === 0`, inte samma anrop.
    await expect(bar).not.toHaveAttribute('aria-valuenow');
    const segment = page.locator(OBESTAMD_SEGMENT);
    await expect(segment).toBeVisible();
    const box = await segment.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(0);

    // Släpp refresh-anropet — auth löser, warmup startar mot normalläget
    // (fixturvärldens fasta EF-svar, snabba) och bar övergår till
    // determinate utan att skärmen någonsin visat en osynlig 0-bredd.
    refresh.slappAlla();
    await expect(bar).toHaveAttribute('aria-valuenow', /^[1-7]$/);
  });
});
