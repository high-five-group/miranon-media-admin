import AxeBuilder from '@axe-core/playwright';
import type { CDPSession, Page } from '@playwright/test';
import { HttpResponse, http } from 'msw';
import { FROZEN_NOW } from '../support/fixturvarld/fixture-data';
import { expect, test } from './acceptance-bas';

/**
 * Erbjudande-ytan `/passkey` (TASK-127.8, ADR-093 beslut 2) — DATABEROENDE
 * tester: att sidan renderar och beter sig rätt GIVET ETT SVAR AV RÄTT FORM
 * från `passkey.list()`/`registerPasskey()`/`updateUser` (ADR-094 Beslut 2).
 * De klient-enda tillstånden (ingen session, webbläsarstöd saknas) bor i
 * `tests/webblasarbeteende/passkey.test.ts`.
 *
 * PASSKEY-CEREMONIN SIMULERAS MED CHROMIUMS CDP WebAuthn-DOMÄN (`WebAuthn.
 * addVirtualAuthenticator`) — INTE en mockad `navigator.credentials`, som
 * hade testat vår egen mock i stället för att bevisa att appen faktiskt
 * pratar med webbläsarens RIKTIGA WebAuthn-implementation. Detta är
 * etablerad branschpraxis (samma CDP-domän som Puppeteers och Googles egna
 * WebAuthn-testexempel bygger på).
 *
 * TVÅ EMPIRISKT VERIFIERADE VÄGAR (denna byggsession — mätt med engångs-
 * smoke-körningar mot en riktig Chromium-instans innan denna fil skrevs,
 * se slutrapporten):
 *   - `automaticPresenceSimulation: true` + en virtuell autentiserare som
 *     UPPFYLLER kraven i options-svaret → ceremonin LYCKAS snabbt (~1–2 s).
 *   - En virtuell autentiserare UTAN `hasUserVerification` mot ett krav på
 *     `userVerification: 'required'` → ceremonin misslyckas ÄVEN den
 *     snabbt (< 2 s, ingen hängning) — men INTE med `ConstraintError` som
 *     hypotesen var innan detta mättes. Chromiums faktiska implementation
 *     filtrerar bort den icke-matchande autentiseraren ur kandidatlistan
 *     och rapporterar i stället `NotAllowedError` ("ingen matchande
 *     autentiserare"), som SDK:n medvetet INTE särskiljer från "användaren
 *     avbröt" (webauthn.errors.ts, samma passthrough-kod
 *     `ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY`, se `src/lib/auth/passkey.ts`
 *     § tolkaPasskeyFel). Testet nedan verifierar alltså den REDAN
 *     empiriskt sanna grenen (tyst, inget felmeddelande) — en tidigare
 *     version av detta test antog fel DOMException och asserterade ett
 *     synligt felmeddelande som aldrig visas; rättat efter mätning, inte
 *     efter hypotes.
 *   - EN TREDJE VÄG PRÖVADES OCH FÖRKASTADES: `WebAuthn.enable` UTAN någon
 *     registrerad autentiserare alls HÄNGER (väntar > 10 s på en
 *     autentiserare som aldrig svarar) i stället för att snabbt kasta ett
 *     fel — odugligt som deterministiskt testfall.
 *   - KONSEKVENS: en riktig, SYNLIG felyta (den `meddelande`-bärande
 *     grenen i `tolkaPasskeyFel`, för fel SOM INTE är
 *     `ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY`) verifieras INTE av en
 *     automatiserad webbläsartest i denna fil — ingen CDP-konfiguration
 *     som deterministiskt triggar den grenen hittades inom byggsessionens
 *     tidsram. Grenen är kodgranskad (symmetrisk med den redan testade
 *     "ok"-grenen) men INTE browser-bevisad. Öppet flaggad gräns, se
 *     slutrapporten — inte tyst antagen.
 */
const AUTH_STORAGE_KEY = 'sb-visual-fixture-auth-token';
const SAKERT_MAL = '/mer/installera-appen';

function b64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function bygdSession(overrides: { userMetadata?: Record<string, unknown> } = {}) {
  const expiresAt = Math.floor(FROZEN_NOW.getTime() / 1000) + 24 * 60 * 60;
  const user = {
    id: '00000000-0000-4000-8000-000000000097',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'passkey-acceptance@visual-fixture.se',
    email_confirmed_at: '2026-01-01T00:00:00Z',
    app_metadata: { provider: 'email', providers: ['email'], role: 'admin' },
    user_metadata: overrides.userMetadata ?? {},
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
  const accessToken = [
    b64url({ alg: 'HS256', typ: 'JWT' }),
    b64url({ sub: user.id, email: user.email, role: 'authenticated', exp: expiresAt }),
    'passkey-acceptance-test-signatur',
  ].join('.');
  return {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 24 * 60 * 60,
    expires_at: expiresAt,
    refresh_token: 'passkey-acceptance-test-refresh',
    user,
  };
}

function seedaSession(page: Page, overrides: { userMetadata?: Record<string, unknown> } = {}) {
  return page.addInitScript(
    ([key, session]) => {
      window.localStorage.setItem(key as string, JSON.stringify(session));
    },
    [AUTH_STORAGE_KEY, bygdSession(overrides)] as const,
  );
}

const REGISTRERADE_UPPDATE_USER_SVAR = () =>
  HttpResponse.json({
    id: '00000000-0000-4000-8000-000000000097',
    email: 'passkey-acceptance@visual-fixture.se',
    app_metadata: { role: 'admin' },
    user_metadata: { passkey_erbjudande_sett: true },
  });

async function aktiveraVirtuellAutentiserareLyckas(page: Page): Promise<CDPSession> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
  return cdp;
}

/** Virtuell autentiserare UTAN user-verification-stöd — kombinerat med ett
 * `userVerification: 'required'`-krav i options-svaret ger ett SNABBT, RIKTIGT
 * `ConstraintError` (se filens topp-kommentar). */
async function aktiveraVirtuellAutentiserareUtanUserVerification(page: Page): Promise<CDPSession> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: false,
      isUserVerified: false,
      automaticPresenceSimulation: true,
    },
  });
  return cdp;
}

function registreringsOptionsSvar(userVerification: 'preferred' | 'required') {
  return HttpResponse.json({
    challenge_id: 'test-challenge-id',
    options: {
      rp: { id: 'localhost', name: 'Miranon Media Admin' },
      user: {
        id: b64url({ passkeyTest: true }).slice(0, 16),
        name: 'passkey-acceptance@visual-fixture.se',
        displayName: 'passkey-acceptance@visual-fixture.se',
      },
      challenge: Buffer.from('acceptance-test-challenge-bytes').toString('base64url'),
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      timeout: 60000,
      attestation: 'none',
      authenticatorSelection: { userVerification, residentKey: 'preferred' },
    },
  });
}

test.describe('/passkey — servern har stängt av passkey → tyst vidare (AC #4)', () => {
  test('404 passkey_disabled → INGEN erbjudande-yta, navigerar direkt till redirect-målet', async ({
    page,
    network,
  }) => {
    await seedaSession(page);
    network.use(
      http.get('*/auth/v1/passkeys', () =>
        HttpResponse.json(
          { code: 404, error_code: 'passkey_disabled', msg: 'Passkeys are disabled' },
          { status: 404 },
        ),
      ),
    );
    await page.goto(`/passkey?redirect=${encodeURIComponent(SAKERT_MAL)}`);

    await expect(page).toHaveURL(new RegExp(`${SAKERT_MAL.replace('/', '\\/')}$`));
    await expect(page.getByRole('heading', { name: 'Vill du logga in snabbare' })).toHaveCount(0);
  });
});

test.describe('/passkey — kontot har redan en passkey → tyst vidare + markerar sett (AC #1)', () => {
  test('passkey.list() innehåller en post → hoppar över erbjudandet, PUT /auth/v1/user anropas', async ({
    page,
    network,
  }) => {
    await seedaSession(page);
    network.use(
      http.get('*/auth/v1/passkeys', () =>
        HttpResponse.json([{ id: 'existing-passkey-id', created_at: '2026-07-01T00:00:00Z' }]),
      ),
      http.put('*/auth/v1/user', REGISTRERADE_UPPDATE_USER_SVAR),
    );
    await page.goto(`/passkey?redirect=${encodeURIComponent(SAKERT_MAL)}`);

    // Navigeringen sker EFTER en `await markeraErbjudandeSett()` i koden —
    // hade PUT:en inte varit mockad hade hermetik-vakten fällt testet HÄR
    // (bevis på att steget faktiskt konsumeras, inte kringgås).
    await expect(page).toHaveURL(new RegExp(`${SAKERT_MAL.replace('/', '\\/')}$`));
    await expect(page.getByRole('heading', { name: 'Vill du logga in snabbare' })).toHaveCount(0);
  });
});

test.describe('/passkey — erbjudandet (AC #1, #3)', () => {
  test('tom passkey-lista + webbläsarstöd → erbjudandet visas, Gunilla-förklaring synlig', async ({
    page,
    network,
  }) => {
    await seedaSession(page);
    network.use(http.get('*/auth/v1/passkeys', () => HttpResponse.json([])));
    await page.goto(`/passkey?redirect=${encodeURIComponent(SAKERT_MAL)}`);

    await expect(
      page.getByRole('heading', { level: 1, name: 'Vill du logga in snabbare nästa gång?' }),
    ).toBeVisible();
    // Gunilla-principen — förklarar VAD en passkey är, inte bara att den
    // är säkrare (uppdragets ram).
    await expect(page.getByText(/fingeravtryck, ansiktsigenkänning/)).toBeVisible();
    await expect(page.getByText('Lösenordet fortsätter fungera precis som vanligt')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Skapa en passkey' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Inte nu' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('"Inte nu" → markerar sett (PUT) och navigerar till redirect-målet UTAN att erbjuda igen', async ({
    page,
    network,
  }) => {
    await seedaSession(page);
    network.use(
      http.get('*/auth/v1/passkeys', () => HttpResponse.json([])),
      http.put('*/auth/v1/user', REGISTRERADE_UPPDATE_USER_SVAR),
    );
    await page.goto(`/passkey?redirect=${encodeURIComponent(SAKERT_MAL)}`);
    await expect(page.getByRole('button', { name: 'Inte nu' })).toBeVisible();

    await page.getByRole('button', { name: 'Inte nu' }).click();

    // Samma hermetik-bevis som ovan: en omockad PUT hade fällt testet
    // INNAN navigate() någonsin körs (koden awaitar markeraErbjudandeSett()
    // före navigate).
    await expect(page).toHaveURL(new RegExp(`${SAKERT_MAL.replace('/', '\\/')}$`));
  });
});

test.describe('/passkey — registrera en passkey (AC #2, virtuell WebAuthn-autentiserare)', () => {
  test('lyckad registrering → "Passkey skapad", markerar sett, Fortsätt navigerar', async ({
    page,
    network,
  }) => {
    await seedaSession(page);
    network.use(
      http.get('*/auth/v1/passkeys', () => HttpResponse.json([])),
      http.post('*/auth/v1/passkeys/registration/options', () =>
        registreringsOptionsSvar('preferred'),
      ),
      http.post('*/auth/v1/passkeys/registration/verify', () =>
        HttpResponse.json({
          id: 'ny-passkey-id',
          friendly_name: 'Testad passkey',
          created_at: '2026-08-05T00:00:00Z',
        }),
      ),
      http.put('*/auth/v1/user', REGISTRERADE_UPPDATE_USER_SVAR),
    );
    await aktiveraVirtuellAutentiserareLyckas(page);
    await page.goto(`/passkey?redirect=${encodeURIComponent(SAKERT_MAL)}`);
    await expect(page.getByRole('button', { name: 'Skapa en passkey' })).toBeVisible();

    await page.getByRole('button', { name: 'Skapa en passkey' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Passkey skapad' })).toBeVisible({
      timeout: 10000,
    });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);

    await page.getByRole('button', { name: 'Fortsätt' }).click();
    await expect(page).toHaveURL(new RegExp(`${SAKERT_MAL.replace('/', '\\/')}$`));
  });

  test('WebAuthn-ceremonin misslyckas (ingen matchande autentiserare) → TYST tillbaka till erbjudandet, inget felmeddelande', async ({
    page,
    network,
  }) => {
    // Se filens topp-kommentar: denna kombination (autentiserare utan
    // `hasUserVerification` mot ett `userVerification: 'required'`-krav)
    // producerar empiriskt `NotAllowedError`, INTE `ConstraintError` — SDK:n
    // klassar det som "användaren avbröt" (samma passthrough-kod), så AC #1
    // ramens "avböjande är förstklassigt, tjatfritt" gäller symmetriskt
    // även här: inget larmande felmeddelande, bara en tyst återgång.
    await seedaSession(page);
    network.use(
      http.get('*/auth/v1/passkeys', () => HttpResponse.json([])),
      http.post('*/auth/v1/passkeys/registration/options', () =>
        registreringsOptionsSvar('required'),
      ),
      // MEDVETET ingen handler för /registration/verify — ceremonin ska
      // aldrig nå så långt. En omockad handler här hade fällt testet om
      // koden av misstag ändå anropade den.
    );
    await aktiveraVirtuellAutentiserareUtanUserVerification(page);
    await page.goto(`/passkey?redirect=${encodeURIComponent(SAKERT_MAL)}`);
    await expect(page.getByRole('button', { name: 'Skapa en passkey' })).toBeVisible();

    await page.getByRole('button', { name: 'Skapa en passkey' }).click();

    // Knappen återgår till viloläge (inte fastlåst på "Skapar …") och INGET
    // felmeddelande visas — samma tysta, ovärderade utfall som ett
    // uttryckligt användarval.
    await expect(page.getByRole('button', { name: 'Skapa en passkey' })).toBeEnabled({
      timeout: 10000,
    });
    await expect(page.getByRole('button', { name: 'Inte nu' })).toBeEnabled();
    await expect(page.getByRole('alert')).toHaveCount(0);
    // Fortfarande på erbjudandet, inte omdirigerad — och "sedd"-flaggan är
    // ALDRIG satt av ett misslyckat/avbrutet försök (bara av "Inte nu"
    // eller en lyckad registrering), så en riktig PUT-anrop här hade varit
    // ett buggtecken. Ingen handler för PUT registrerad ovan → hermetik-
    // vakten hade fällt testet om koden av misstag ändå markerade "sett".
    await expect(
      page.getByRole('heading', { level: 1, name: 'Vill du logga in snabbare nästa gång?' }),
    ).toBeVisible();
  });
});
