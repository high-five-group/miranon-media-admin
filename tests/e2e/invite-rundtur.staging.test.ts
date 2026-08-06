import { randomUUID } from 'node:crypto';
import { getApiConfig, loginUser } from '../api/helpers';
import { expect, test } from '../support/test-bas';

/**
 * TASK-127.9 — Rundturs-e2e: HELA inbjudningskedjan, ände till ände, mot
 * staging. ETT test, inte många (kortets Beskrivning + AC #1).
 *
 * KEDJAN: invite-user (admin-JWT, det RIKTIGA inbjudningskontraktet — roll
 * låst i app_metadata, namn i user_metadata) → test-invite-completion
 * (generate_link, kortar ENDAST mail-hoppet — staging-only testharness,
 * `#817`+`#820`) → /valkommen (riktig UI: sätt lösenord) → /login (riktig
 * UI: logga in) → /hem (autentiserad vy under `_authenticated`) → teardown
 * (delete_user, AC #2 — inga rester i staging).
 *
 * Mönstret matchar branschprecedenten (Ghost PR #21637, cal.com × två
 * flöden) läst i
 * docs/research/auth-invite-e2e-service-role-branschprecedent-2026-08-05.md
 * §5: korta EN specifik, icke-deterministisk länk mellan mail-server och
 * app (mail-hoppet, steg 2→3 nedan) — men kör ALLT annat, inklusive
 * formulär, redirects och den slutliga autentiserade vyn, genom RIKTIG
 * UI-interaktion. Ingen av precedenten hoppar över inloggnings-/formulär-
 * kedjan i sin helhet.
 *
 * FÄLLAN (uppdragets § FÄLLAN): `chromium-authenticated`-projektet
 * (playwright.config.ts rad 400–412) startar VARJE test redan inloggat som
 * TEST_USER (`storageState: 'playwright/.auth/user.json'`). En rundtur som
 * ska BEVISA ett riktigt inloggningssteg (steg 5 nedan) måste bryta det —
 * annars finns risken att /login:s `beforeLoad`-guard ser en redan giltig
 * TEST_USER-session och redirectar direkt till /hem UTAN att någonsin
 * exekvera formuläret vi tror vi testar. Ghosts motsvarande test
 * (`invites.spec.js`, PR #21637) gör en explicit signout av exakt det
 * skälet. Löst här genom att override:a storageState till TOM (ingen
 * cookie, ingen origin-storage) för hela filen — testet börjar alltså
 * precis som en riktig ny inbjuden användares FÖRSTA besök i webbläsaren,
 * inte som en redan-inloggad admin.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Rundtur: inbjudan → inloggad (TASK-127.9)', () => {
  // Delad mellan testkroppen och teardown-hooken (module-scope räcker — filen
  // bär EN rundtur, ingen parallell körning inom samma fil). `null` tills
  // testkroppen faktiskt har en adress/JWT att riva.
  let cleanupEmail: string | null = null;
  let cleanupAdminJwt: string | null = null;

  // AC #2: "Flödet skapar och river sin egen testanvändare — inga rester i
  // staging" — SKA HÅLLA ÄVEN OM TESTET FALLERAR PÅ VÄGEN (uppdragets § Vad
  // testet ska göra, steg 7). `afterEach` körs oavsett testutfall; villkoret
  // nedan gör teardown till ett no-op om testet aldrig hann skapa något att
  // riva (t.ex. admin-inloggningen själv misslyckades).
  test.afterEach(async ({ request }) => {
    if (!cleanupEmail || !cleanupAdminJwt) return;

    const config = getApiConfig();
    const res = await request.post(`${config.baseUrl}/functions/v1/test-invite-completion`, {
      headers: { Authorization: `Bearer ${cleanupAdminJwt}` },
      data: { action: 'delete_user', email: cleanupEmail },
    });

    // Ingen try/catch — en misslyckad teardown SKA synas som ett fällt test,
    // inte tystas (samma disciplin som test-invite-completion.staging.test.ts
    // rad ~147, "Medvetet ingen try/catch").
    expect(res.status(), await res.text()).toBe(200);
  });

  test('inbjudan → sätt lösenord → logga in → autentiserad vy', async ({ page, request }) => {
    const config = getApiConfig();

    // Steg 1: unik +e2e-adress per körning (UUID-suffix) — parallella
    // körningar kolliderar aldrig. Samma plus-adress-konvention som
    // test-invite-completion.staging.test.ts (`+e2e-` är EF:ens
    // adress-allowlist-segment, se EF:ens fil-header § ADRESS-ALLOWLIST).
    const email = `test-127-9+e2e-${randomUUID()}@h5gruppen.se`;
    const mottagarNamn = 'Rundtur Testsson';
    // Slumpat, unikt per körning — aldrig återanvänt, aldrig loggat.
    const nyttLosenord = `Rundtur-${randomUUID()}!`;

    // Admin-JWT via en FRISTÅENDE inloggning (denna fil delar INTE
    // tests/api/auth.setup.ts:s persisterade api-tokens.json —
    // `chromium-authenticated`-projektet har ingen `dependencies`-koppling
    // till `api-setup`, bara till `setup` som loggar in TEST_USER, inte
    // TEST_ADMIN). `loginUser` är samma helper `tests/api/*.staging.test.ts`
    // bygger på, importerad läsande — ingen ändring av den filen.
    cleanupAdminJwt = await loginUser(
      request,
      config.baseUrl,
      config.anonKey,
      config.adminEmail,
      config.adminPassword,
    );
    // Satt EFTER en lyckad admin-inloggning: en misslyckad inloggning ska
    // inte trigga en teardown-körning utan giltig JWT (afterEach-villkoret
    // kräver ändå båda, men ordningen här gör avsikten explicit).
    cleanupEmail = email;

    // Steg 2: utlös inbjudan via DET RIKTIGA kontraktet (invite-user) —
    // roll låses i app_metadata, namn i user_metadata (TASK-143). Detta är
    // inte en genväg: det är samma EF och samma kontrakt en riktig admin
    // använder i produktion.
    const inviteRes = await request.post(`${config.baseUrl}/functions/v1/invite-user`, {
      headers: { Authorization: `Bearer ${cleanupAdminJwt}` },
      data: { email, role: 'admin', name: mottagarNamn },
    });
    expect(inviteRes.status(), await inviteRes.text()).toBe(200);

    // Steg 3: hämta en konsumerbar länk via testharnesset — kortar ENDAST
    // mail-hoppet (branschprecedent, se filhuvudet). `redirect_to` matchar
    // den registrerade STAGING-wildcarden (`http://localhost:5173/**`, satt
    // 2026-08-05 — se kortets Implementation Notes § Fas 7-beroendet).
    const linkRes = await request.post(`${config.baseUrl}/functions/v1/test-invite-completion`, {
      headers: { Authorization: `Bearer ${cleanupAdminJwt}` },
      data: {
        action: 'generate_link',
        email,
        redirect_to: 'http://localhost:5173/valkommen',
      },
    });
    expect(linkRes.status(), await linkRes.text()).toBe(200);
    const linkBody = (await linkRes.json()) as { action_link?: string };
    expect(linkBody.action_link).toBeTruthy();
    const actionLink = linkBody.action_link as string;

    // Steg 4: navigera till länken — landar på /valkommen. INGEN manuell
    // verifyOtp krävs: supabase-js persisterar sessionen ur hash-fragmentet
    // (implicit flow, detectSessionInUrl: true) INNAN komponenten mountar,
    // och getSession() väntar in den processen (valkommen.tsx rad 31–39).
    await page.goto(actionLink);
    await expect(page).toHaveURL(/\/valkommen/);

    // Formuläret visar den personliga hälsningen (TASK-143) — bevisar att
    // sessionen verkligen kommer från VÅR nyss skapade inbjudan, inte en
    // slumpmässig annan.
    await expect(
      page.getByRole('heading', { name: `Välkommen, ${mottagarNamn}`, exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel('E-postadress', { exact: true })).toHaveValue(email);

    // Sätt lösenord genom RIKTIG UI-interaktion — inte via API (uppdragets
    // § Vad testet ska göra, steg 4).
    await page.getByLabel('Lösenord', { exact: true }).fill(nyttLosenord);
    await page.getByRole('button', { name: 'Skapa mitt konto' }).click();

    // "Kontot är skapat" (valkommen.tsx KontotSkapat) — updateUser lyckades
    // och sidan har loggat ut sessionen lokalt (ett medvetet, explicit
    // inloggningsmoment väntar på /login, se komponentens egen kommentar).
    await expect(
      page.getByRole('heading', { name: 'Kontot är skapat', exact: true }),
    ).toBeVisible();

    // Steg 5: logga in på /login-vyn med det NYSS satta lösenordet, genom
    // riktig UI-interaktion. Klicket är en SPA-navigering (TanStack Router
    // Link) — ingen full sidladdning, så AuthProvider-tillståndet (utloggat,
    // efter valkommen.tsx:s signOut) är intakt när formuläret renderas.
    await page.getByRole('link', { name: 'Logga in och upptäck ditt nya verktyg' }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.locator('#login-email').fill(email);
    await page.locator('#login-password').fill(nyttLosenord);
    await Promise.all([page.waitForURL('**/hem'), page.locator('button[type="submit"]').click()]);

    // Steg 6: autentiserad vy nådd (/hem under den pathless _authenticated-
    // layout-routen) — samma assertion-form som auth-flow.staging.test.ts
    // Test 3.
    await expect(page).toHaveURL(/\/hem$/);
    await expect(page.locator('h1')).toHaveText(/^Hej/);

    // Steg 7 (teardown) körs i test.afterEach ovan — oavsett om detta test
    // faller innan denna punkt.
  });
});
