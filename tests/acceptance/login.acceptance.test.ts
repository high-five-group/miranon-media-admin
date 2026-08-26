import crypto from 'node:crypto';
import { delay, HttpResponse, http } from 'msw';
import { FROZEN_NOW } from '../support/fixturvarld/fixture-data';
import { expect, test } from './acceptance-bas';

/**
 * `/login` (TASK-127.3) — DENNA FIL täcker ENDAST det TASK-127.8 lägger
 * till: passkey-erbjudandets routing-beslut EFTER en lyckad lösenords-
 * inloggning, och "Logga in med passkey"-knappen. Sidan hade INGEN egen
 * acceptance-/webblasarbeteende-fil före denna (verifierat — `git log
 * --diff-filter=A -- 'tests/**\/*login*'` gav noll träffar); denna fil
 * bygger inte ikapp den förexisterande skulden (fältvalidering,
 * enumeration-neutralt fel vid fel lösenord m.m.) — bara det nytillkomna,
 * databeroende beteendet (ADR-094 Beslut 2).
 *
 * MÅLET för "direkt vidare" (ingen /passkey-omväg) är `/mer/installera-appen`
 * — samma val och samma skäl som `tests/acceptance/passkey.acceptance.test.ts`s
 * topp-kommentar: 0 träffar på datahämtning i sin källkod, undviker att dra
 * in ett helt dashboard-datalager i ett test som prövar routing-BESLUTET,
 * inte destinationsvyn.
 *
 * PASSKEY-INLOGGNINGSKNAPPENS lyckade väg återanvänder samma CDP-mönster
 * (Chromiums virtuella WebAuthn-autentiserare) som
 * `passkey.acceptance.test.ts` — se den filens topp-kommentar för det
 * fulla resonemanget kring varför CDP och inte en mockad
 * `navigator.credentials`.
 */
const SAKERT_MAL = '/mer/installera-appen';

function b64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

/** Rå HTTP-svarsform för `POST /auth/v1/token?grant_type=password` — det
 * klassiska OAuth2-token-svaret GoTrue skickar, användaren inbäddad. Samma
 * fält som en seedad session (`sb-visual-fixture-auth-token`), men detta
 * är det NÄTVERKSSVAR som producerar en session, inte en förseedad en. */
function lyckadLosenordsInloggningSvar(overrides: { userMetadata?: Record<string, unknown> } = {}) {
  const expiresAt = Math.floor(FROZEN_NOW.getTime() / 1000) + 24 * 60 * 60;
  const userId = '00000000-0000-4000-8000-000000000096';
  const email = 'login-acceptance@visual-fixture.se';
  const accessToken = [
    b64url({ alg: 'HS256', typ: 'JWT' }),
    b64url({ sub: userId, email, role: 'authenticated', exp: expiresAt }),
    'login-acceptance-test-signatur',
  ].join('.');
  return HttpResponse.json({
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 24 * 60 * 60,
    expires_at: expiresAt,
    refresh_token: 'login-acceptance-test-refresh',
    user: {
      id: userId,
      aud: 'authenticated',
      role: 'authenticated',
      email,
      email_confirmed_at: '2026-01-01T00:00:00Z',
      app_metadata: { provider: 'email', providers: ['email'], role: 'admin' },
      user_metadata: overrides.userMetadata ?? {},
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  });
}

/**
 * MSW matchar INTE query-strängen i ett `http.post()`-mönster (varnar
 * "redundant usage of query parameters" och faller igenom till
 * omockad-vakten om man skriver query-strängen rakt in i mönstret) —
 * sökvägen matchas separat, `grant_type` läses ur `request.url` i
 * resolvern. Mätt skarpt: utan denna fix hängde varje test ~60 s (auth-js
 * egen retry-policy, inte `fetchWithRetry`s dokumenterade ~7–8 s) innan
 * det till slut föll.
 */
function losenordsGrantHandler(overrides: { userMetadata?: Record<string, unknown> } = {}) {
  return http.post('*/auth/v1/token', ({ request }) => {
    const grantType = new URL(request.url).searchParams.get('grant_type');
    if (grantType !== 'password') return undefined;
    return lyckadLosenordsInloggningSvar(overrides);
  });
}

/**
 * Fixturvärldens EGNA `page`-fixture seedar en INLOGGAD session per default
 * (`hermetic.ts` § "Sessionen seedas FÖRE app-JS via init-script — appen
 * vaknar inloggad") — motsatsen till vad DENNA fil behöver. `/login`s
 * `beforeLoad` redirectar direkt bort en redan autentiserad besökare, så
 * utan denna rensning hann formuläret ALDRIG mount:a — `getByLabel(
 * 'E-postadress')` väntade ut hela testets 60 s innan det föll (mätt
 * skarpt, root-cause för det första hänget i denna fil).
 */
const AUTH_STORAGE_KEY = 'sb-visual-fixture-auth-token';
function rensaInloggadSession(page: import('@playwright/test').Page) {
  return page.addInitScript((key) => {
    window.localStorage.removeItem(key as string);
  }, AUTH_STORAGE_KEY);
}

async function loggaInMedLosenord(page: import('@playwright/test').Page) {
  await rensaInloggadSession(page);
  await page.goto(`/login?redirect=${encodeURIComponent(SAKERT_MAL)}`);
  await page.getByLabel('E-postadress').fill('login-acceptance@visual-fixture.se');
  await page.getByLabel('Lösenord').fill('ett-testlosenord-1234');
  // `exact: true` KRÄVS — utan den matchar en substräng-sökning på "Logga
  // in" ÄVEN "Logga in med passkey"-knappen (strict-mode-krock, som
  // Playwright löser genom att vänta ut hela testets timeout i stället för
  // att fela snabbt — mätt skarpt, 60 s per test innan denna fix).
  await page.getByRole('button', { name: 'Logga in', exact: true }).click();
}

test.describe('/login — routing efter lyckad lösenords-inloggning (AC #1)', () => {
  test('passkey otillgängligt (404 passkey_disabled) → navigerar DIREKT till redirect-målet, ingen /passkey-omväg', async ({
    page,
    network,
  }) => {
    network.use(
      losenordsGrantHandler(),
      http.get('*/auth/v1/passkeys', () =>
        HttpResponse.json(
          { code: 404, error_code: 'passkey_disabled', msg: 'Passkeys are disabled' },
          { status: 404 },
        ),
      ),
    );
    await loggaInMedLosenord(page);

    await expect(page).toHaveURL(new RegExp(`${SAKERT_MAL.replace('/', '\\/')}$`));
  });

  test('passkey tillgängligt, ingen befintlig → navigerar till /passkey med redirect-målet bevarat', async ({
    page,
    network,
  }) => {
    network.use(
      losenordsGrantHandler(),
      http.get('*/auth/v1/passkeys', () => HttpResponse.json([])),
    );
    await loggaInMedLosenord(page);

    await expect(page).toHaveURL(/\/passkey\?/);
    const url = new URL(page.url());
    expect(url.searchParams.get('redirect')).toBe(SAKERT_MAL);
  });

  test('TASK-261: Förberedelseskärmen blinkar ALDRIG fram mellan inloggningen och passkey-erbjudandet', async ({
    page,
    network,
  }) => {
    // ═══ VAD DETTA TESTAR, OCH VARFÖR SPANAREN BEHÖVS ═══
    //
    // Marcus observerade i prod (2026-08-17) att Förberedelseskärmen
    // blinkade till MELLAN inloggningen och passkey-förfrågan. Rotorsaken
    // är ett RACE mellan två navigeringsvägar som båda startar när
    // `auth.login()` flippar `isAuthenticated` (login.tsx `handleSubmit`):
    //
    //   VÄG A (snabb, mikrotask): InnerApps effekt (main.tsx) kör
    //     `router.invalidate()` → `/login`s EGEN `beforeLoad` re-evaluerar
    //     → ser `isAuthenticated: true` → `throw redirect({ to:
    //     search.redirect })`. Målet är en `_authenticated`-yta, så
    //     `AuthenticatedLayout` monteras → dess app-yta-gate
    //     (`useAppYtaVarmningsgate`) ser en KALL cache redan i sin lazy
    //     `useState`-initierare → Förberedelseskärmen renderas.
    //   VÄG B (långsam, TVÅ await): `routaEfterLyckadInloggning()` väntar
    //     in `getSession()` OCH `probaPasskeyTillganglighet()` (ett riktigt
    //     nätverksanrop) innan den navigerar till `/passkey`.
    //
    // Väg A vinner alltid; skärmen den monterar rivs ned igen när väg B
    // landar. Det ÄR blinket.
    //
    // `_authenticated.tsx`s eget docblock bokförde förutsättningen som
    // gjorde racet harmlöst: destinationen var densamma oavsett vem som
    // vann — "förutom det just nu avstängda passkey-erbjudandet". TASK-231
    // slog PÅ passkey-erbjudandet, och därmed föll den förutsättningen.
    //
    // FÖRDRÖJNINGEN gör racet DETERMINISTISKT i stället för "ibland":
    // 1200 ms på probe-anropet garanterar att väg A hinner montera
    // `_authenticated` först. Utan den avgörs utfallet av nätverksjitter —
    // exakt därför Marcus såg det som ett "ibland"-fenomen.
    //
    // SPANAREN, inte en `toBeVisible()`-koll: blinket är per definition
    // TRANSIENT. En assertion som körs EFTER navigeringen ser en redan
    // nedriven skärm och blir grön på ett trasigt flöde. MutationObserver:n
    // installeras före första bytet app-JS och latchar `true` för alltid om
    // Förberedelseskärmens LÅSTA textrad (Forberedelseskarm.tsx) någonsin
    // funnits i DOM — även för en enda frame.
    // ═══ SPANAREN — TRE FALLGROPAR, ALLA MÄTTA I DENNA SKIVA ═══
    //
    // (1) Den rapporterar via `console`, inte via en variabel på `window`
    //     eller i `sessionStorage`. Båda de senare lästes tomma från
    //     `page.evaluate()` efter navigeringen trots att spanaren
    //     bevisligen kört — de gav "ingen blink" på ett flöde som blinkade.
    // (2) Den använder INTE `MutationObserver`. `document.documentElement`
    //     är `null` när ett init-script kör, så `.observe(null, …)` kastar
    //     och dödar resten av scriptet TYST — inklusive all kod som
    //     deklarerats efter den.
    // (3) Den mäter inte tid. Fixturvärlden fryser klockan
    //     (`hermetic.ts`, `page.clock.setFixedTime`), så `Date.now()`-
    //     deltan är alltid 0. Timers kör däremot i realtid, vilket är
    //     varför ren polling fungerar.
    //
    // Pollintervallet (5 ms) ligger långt under blinkets längd: det varar
    // hela probe-anropet, som fördröjs 1200 ms nedan.
    // MÄTFÖNSTRET ÖPPNAS FÖRST VID KLICKET, inte vid sidladdningen. Utan den
    // avgränsningen fångar spanaren `InnerApp`s auth-resolution-placeholder
    // (`main.tsx`, ADR-112 beslut 5) — en dokumenterad, ALLTID närvarande
    // mikro-rendering av samma komponent under `auth.isLoading`, som inträffar
    // på varje sidladdning INNAN någon ens loggat in. Den är ett annat,
    // förexisterande beteende än det race denna skiva åtgärdar, och att
    // blanda ihop dem gör testet falskt rött. (Mätt: utan avgränsningen
    // fällde testet med `FORBEREDELSESKARM @ /login` även med fixen på plats.)
    const konsollogg: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.startsWith('[TASK-261]')) konsollogg.push(text);
    });
    await page.addInitScript(() => {
      const LAST_TEXTRAD = 'Förbereder ditt administrationsverktyg';
      let sag = false;
      setInterval(() => {
        const aktiv = (window as unknown as { __task261Aktiv?: boolean }).__task261Aktiv;
        if (aktiv && !sag && document.body?.textContent?.includes(LAST_TEXTRAD)) {
          sag = true;
          console.log(`[TASK-261] FORBEREDELSESKARM @ ${location.pathname}`);
        }
      }, 5);
    });

    network.use(
      losenordsGrantHandler(),
      http.get('*/auth/v1/passkeys', async () => {
        await delay(1200);
        return HttpResponse.json([]);
      }),
    );

    await rensaInloggadSession(page);
    await page.goto(`/login?redirect=${encodeURIComponent(SAKERT_MAL)}`);
    await page.getByLabel('E-postadress').fill('login-acceptance@visual-fixture.se');
    await page.getByLabel('Lösenord').fill('ett-testlosenord-1234');
    // Auth-resolutionen är avgjord här (formuläret är interaktivt) — allt
    // som renderas härefter tillhör inloggningsövergången.
    await page.evaluate(() => {
      (window as unknown as { __task261Aktiv?: boolean }).__task261Aktiv = true;
    });
    await page.getByRole('button', { name: 'Logga in', exact: true }).click();

    // Destinationen ska fortfarande vara erbjudandet — fixen får inte
    // "lösa" blinket genom att tappa bort passkey-omvägen.
    await expect(page).toHaveURL(/\/passkey\?/);
    expect(new URL(page.url()).searchParams.get('redirect')).toBe(SAKERT_MAL);

    // Rubriken bevisar att erbjudandet FAKTISKT renderades (inte bara att
    // URL:en råkar stämma) — samma överskuggnings-disciplin som testet
    // nedan följer med sin `waitForRequest`.
    await expect(
      page.getByRole('heading', { level: 1, name: 'Vill du logga in snabbare nästa gång?' }),
    ).toBeVisible();

    expect(konsollogg).toEqual([]);
  });

  test('kontot har REDAN en passkey → navigerar DIREKT (hoppar över erbjudandet), markerar sett', async ({
    page,
    network,
  }) => {
    network.use(
      losenordsGrantHandler(),
      http.get('*/auth/v1/passkeys', () =>
        HttpResponse.json([{ id: 'existing', created_at: '2026-07-01T00:00:00Z' }]),
      ),
      http.put('*/auth/v1/user', () =>
        HttpResponse.json({
          id: '00000000-0000-4000-8000-000000000096',
          email: 'login-acceptance@visual-fixture.se',
          user_metadata: { passkey_erbjudande_sett: true },
        }),
      ),
    );

    // BEVISET FÅR ALDRIG VILA PÅ ATT URL-ASSERTIONEN RÅKAR PASSERA (rättad
    // fällning, överskuggnings-vakten): koden navigerar till `SAKERT_MAL`
    // via TRE OLIKA vägar (passkey otillgängligt, redan sett, redan
    // registrerad), så en ren URL-koll bevisar inte VILKEN väg som kördes.
    // `waitForRequest` registreras FÖRE triggande handling (ingen race) och
    // gör själva PUT-anropet till assertionen — testet fäller om
    // `markeraErbjudandeSett()` aldrig körs, oavsett vad URL:en råkar visa.
    const putRequestPromise = page.waitForRequest(
      (req) => req.method() === 'PUT' && req.url().includes('/auth/v1/user'),
      { timeout: 10000 },
    );
    await loggaInMedLosenord(page);
    const putRequest = await putRequestPromise;
    expect(putRequest.postDataJSON()).toMatchObject({
      data: { passkey_erbjudande_sett: true },
    });

    // Navigeringen sker EFTER `await markeraErbjudandeSett()` i koden.
    await expect(page).toHaveURL(new RegExp(`${SAKERT_MAL.replace('/', '\\/')}$`));
  });

  test('kontot har redan SETT erbjudandet → navigerar DIREKT UTAN att ens fråga passkey-servern', async ({
    page,
    network,
  }) => {
    network.use(
      losenordsGrantHandler({ userMetadata: { passkey_erbjudande_sett: true } }),
      // MEDVETET ingen handler för GET /auth/v1/passkeys: koden ska aldrig
      // proba när `harSettErbjudandeTidigare` redan är sann. En omockad
      // probe här hade fällt testet — det ÄR beviset att koden korrekt
      // hoppar över den.
    );
    await loggaInMedLosenord(page);

    await expect(page).toHaveURL(new RegExp(`${SAKERT_MAL.replace('/', '\\/')}$`));
  });
});

test.describe('/login — "Logga in med passkey"-knappen (AC #2, virtuell WebAuthn-autentiserare)', () => {
  test('lyckad passkey-inloggning → navigerar DIREKT till redirect-målet (ingen /passkey-omväg — kontot har redan en)', async ({
    page,
    network,
  }) => {
    const userId = '00000000-0000-4000-8000-000000000095';
    const expiresAt = Math.floor(FROZEN_NOW.getTime() / 1000) + 24 * 60 * 60;
    const accessToken = [
      b64url({ alg: 'HS256', typ: 'JWT' }),
      b64url({
        sub: userId,
        email: 'passkey-login@visual-fixture.se',
        role: 'authenticated',
        exp: expiresAt,
      }),
      'login-passkey-test-signatur',
    ].join('.');

    network.use(
      http.post('*/auth/v1/passkeys/authentication/options', () =>
        HttpResponse.json({
          challenge_id: 'login-test-challenge-id',
          options: {
            rpId: 'localhost',
            challenge: Buffer.from('login-acceptance-challenge-bytes').toString('base64url'),
            timeout: 60000,
            userVerification: 'preferred',
          },
        }),
      ),
      http.post('*/auth/v1/passkeys/authentication/verify', () =>
        HttpResponse.json({
          access_token: accessToken,
          token_type: 'bearer',
          expires_in: 24 * 60 * 60,
          expires_at: expiresAt,
          refresh_token: 'login-passkey-test-refresh',
          user: {
            id: userId,
            aud: 'authenticated',
            role: 'authenticated',
            email: 'passkey-login@visual-fixture.se',
            email_confirmed_at: '2026-01-01T00:00:00Z',
            app_metadata: { provider: 'email', providers: ['email'], role: 'admin' },
            user_metadata: {},
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
        }),
      ),
    );

    const cdp = await page.context().newCDPSession(page);
    await cdp.send('WebAuthn.enable');
    const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', {
      options: {
        protocol: 'ctap2',
        transport: 'internal',
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
      },
    });
    // En passkey MÅSTE vara registrerad hos den virtuella autentiseraren
    // för att `navigator.credentials.get()` ska ha något att välja bland —
    // WebAuthn.addCredential injicerar en färdig credential direkt (CDP-
    // domänens avsedda mekanism för just detta scenario). `privateKey`
    // MÅSTE vara en äkta PKCS8-DER-kodad EC P-256-nyckel (base64,
    // ATT INTE base64url) — CDP validerar formen strikt server-side
    // ("Invalid parameters" mätt skarpt mot en handhållen dummy-nyckel
    // innan denna fix). Byte-innehållet i credentialId/userHandle spelar
    // ingen roll för TESTET (verifieringssvaret nedan är mockat och
    // kontrollerar inte assertionens kryptografiska innehåll) — bara att
    // formen är giltig binärdata.
    await cdp.send('WebAuthn.addCredential', {
      authenticatorId,
      credential: {
        credentialId: crypto.randomBytes(16).toString('base64'),
        isResidentCredential: true,
        rpId: 'localhost',
        privateKey: crypto
          .generateKeyPairSync('ec', { namedCurve: 'P-256' })
          .privateKey.export({ type: 'pkcs8', format: 'der' })
          .toString('base64'),
        signCount: 0,
        userHandle: crypto.randomBytes(8).toString('base64'),
      },
    });

    await rensaInloggadSession(page);
    await page.goto(`/login?redirect=${encodeURIComponent(SAKERT_MAL)}`);
    await page.getByRole('button', { name: 'Logga in med passkey' }).click();

    await expect(page).toHaveURL(new RegExp(`${SAKERT_MAL.replace('/', '\\/')}$`), {
      timeout: 10000,
    });
  });

  test('WebAuthn-ceremonin misslyckas (ingen registrerad passkey hos autentiseraren) → TYST, inget felmeddelande, lösenordsformuläret kvar användbart', async ({
    page,
    network,
  }) => {
    network.use(
      http.post('*/auth/v1/passkeys/authentication/options', () =>
        HttpResponse.json({
          challenge_id: 'login-test-challenge-id-2',
          options: {
            rpId: 'localhost',
            challenge: Buffer.from('login-acceptance-challenge-bytes-2').toString('base64url'),
            timeout: 60000,
            userVerification: 'preferred',
          },
        }),
      ),
      // MEDVETET ingen handler för /authentication/verify — ceremonin ska
      // aldrig nå så långt utan en matchande credential hos autentiseraren.
    );

    const cdp = await page.context().newCDPSession(page);
    await cdp.send('WebAuthn.enable');
    // Autentiserare registrerad, men UTAN någon credential — samma
    // deterministiska "ingen matchande" NotAllowedError-väg som
    // `passkey.acceptance.test.ts`s motsvarande registrerings-test.
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

    await rensaInloggadSession(page);
    await page.goto(`/login?redirect=${encodeURIComponent(SAKERT_MAL)}`);
    await page.getByRole('button', { name: 'Logga in med passkey' }).click();

    await expect(page.getByRole('button', { name: 'Logga in med passkey' })).toBeEnabled({
      timeout: 10000,
    });
    await expect(page.getByRole('alert')).toHaveCount(0);
    // Fortfarande på /login, INTE navigerad — och lösenordsvägen är
    // opåverkad (ADR-093 beslut 2: lösenordet är permanent fallback).
    await expect(page).toHaveURL(/\/login\?/);
    await expect(page.getByLabel('E-postadress')).toBeEditable();
    await expect(page.getByLabel('Lösenord')).toBeEditable();
  });
});
