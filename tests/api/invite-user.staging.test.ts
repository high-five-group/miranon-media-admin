// TASK-127.5 deny-path- + kontrakt-tester för invite-user (ADR-092/ADR-093).
//
// Fyra scenarier per kortets AC:
//   1. anon-key → 401 (gateway eller requireUser fångar — classify401Body
//      hanterar båda format, samma mönster som create-admin-user).
//   2. user utan admin-email → 403 (requireUser passerar, ADMIN_EMAILS-
//      checken faller). Body: { error: 'Forbidden' }.
//   3. admin-email, MEN redan-bekräftad mottagare → 4xx (INTE 401/403/5xx).
//      Target är TEST_ADMIN_EMAIL SJÄLV — en redan inloggningsbar (alltså
//      BEKRÄFTAD) användare. GoTrues /invite-handler avgör
//      "redan bekräftad?" FÖRE den någonsin når mail-sändningskoden
//      (internal/api/invite.go: isConfirmed-checken ligger FÖRE
//      transaktionen som anropar sendInvite) — testet är alltså
//      SMTP-oberoende: det bevisar att auth-gaten passerade, precis som
//      create-admin-user:s motsvarande test, oavsett om custom SMTP är
//      kopplat i staging eller inte (T95 Spår B:s Grind 0, explicit
//      UTANFÖR denna skivas omfattning — PRD § Utanför omfattningen).
//   4. Samma anrop UPPREPAT (AC#3, "omskick... utan dubblett-effekter"):
//      två anrop mot SAMMA (redan bekräftade) target ska ge SAMMA klass av
//      svar båda gångerna — inte 401/403/5xx, och inte en degraderad andra
//      körning. Detta bevisar repeated-call-säkerhet vid HTTP-gränsen.
//
// Denna svit skapar MEDVETET ingen ny, riktig auth.users-rad (vilket hade
// krävt en service-role-nyckel i testmiljön för att sedan städa bort raden
// — en privilegie-utökning av testharnesset som INTE görs unilateralt här).
// Det fulla lyckade-anrop-flödet (ny obekräftad user, app_metadata.role
// satt) är i stället VERIFIERAT MANUELLT under detta korts bygge, en gång,
// med en engångs-hämtad staging-service-role-nyckel + omedelbar städning
// (invite → 200 → app_metadata las {role:'admin'} bekräftat via Admin-API
// → delete → verifierad borta). Den körningen visade att staging-projektets
// nuvarande mail-dispatch FAKTISKT lyckas för adresser under Marcus egen
// h5gruppen.se-domän (plus-adressering) — vilket något överraskande
// motsäger den initiala tolkningen av S96-blockeringskartans "SMTP/OTP/
// redirect EFTER 127.4"-rad. Det bevisar INTE att leverans till Roger/
// Lottas riktiga adresser (gral.se/outsidereality.se) fungerar idag — det
// är fortfarande DoD #7:s (parent-kortets) grind, oberoende av detta fynd.
// Källa för GoTrues resend-semantik (internal/api/invite.go + mail.go):
// en obekräftad existerande rad hoppar över signupNewUser och går rakt
// till sendInvite, vilket regenererar token utan att skapa en ny rad.
// Den FULLA rundturen (riktig mottagare, riktig mail-länk) hör till
// TASK-127.9.
//
// Validerings-tester (EF3 deny-by-default): okänd/saknad roll och ogiltig
// e-post nekas med 400 FÖRE något Supabase-adminanrop görs.

import { expect, test } from '@playwright/test';
import { classify401Body, getApiConfig, getValidAdminUserJWT, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/invite-user';

test.describe('invite-user — auth + admin-allowlist (TASK-127.5)', () => {
  test('deny: anon-key → 401', async ({ request }) => {
    const config = getApiConfig();

    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${config.anonKey}` },
      data: { email: 'foo@test.local', role: 'admin' },
    });

    await classify401Body(res);
  });

  test('deny: user utan admin-email → 403', async ({ request }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);

    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${userJwt}` },
      data: { email: 'foo@test.local', role: 'admin' },
    });

    expect(res.status()).toBe(403);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe('Forbidden');
  });

  test('deny: admin-email men okänd roll → 400 (EF3 deny-by-default)', async ({ request }) => {
    const config = getApiConfig();
    const adminJwt = await getValidAdminUserJWT(request, config);

    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${adminJwt}` },
      data: { email: 'foo@test.local', role: 'super-owner-root' },
    });

    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/role/);
  });

  test('deny: admin-email men ogiltig e-post → 400', async ({ request }) => {
    const config = getApiConfig();
    const adminJwt = await getValidAdminUserJWT(request, config);

    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${adminJwt}` },
      data: { email: 'not-an-email', role: 'admin' },
    });

    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/email/);
  });

  test('allow: admin-email → gate passerad (4xx från redan-bekräftad mottagare, ej 401/403/5xx)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const adminJwt = await getValidAdminUserJWT(request, config);

    // Target = admin-userens EGEN e-post → GoTrue ser en BEKRÄFTAD
    // användare och nekar FÖRE sendInvite (se fil-header). Bevisar att
    // auth-gaten passerade utan att skapa någon ny rad eller skicka mail.
    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${adminJwt}` },
      data: { email: config.adminEmail, role: 'admin' },
    });

    expect(res.status()).not.toBe(401);
    expect(res.status()).not.toBe(403);
    expect(res.status()).toBeLessThan(500);
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('omskick (AC#3): upprepat anrop mot samma mål ger samma icke-degraderade svar', async ({
    request,
  }) => {
    const config = getApiConfig();
    const adminJwt = await getValidAdminUserJWT(request, config);

    const call = () =>
      request.post(`${config.baseUrl}${ENDPOINT}`, {
        headers: { Authorization: `Bearer ${adminJwt}` },
        data: { email: config.adminEmail, role: 'admin' },
      });

    const first = await call();
    const second = await call();

    for (const res of [first, second]) {
      expect(res.status()).not.toBe(401);
      expect(res.status()).not.toBe(403);
      expect(res.status()).toBeLessThan(500);
    }

    // Samma klass av svar båda gångerna — andra anropet varken kraschar
    // annorlunda eller degraderar till 5xx. Se fil-header för vad detta
    // bevisar kontra det fulla (SMTP-beroende) omskicksflödet.
    expect(first.status()).toBe(second.status());
  });
});
