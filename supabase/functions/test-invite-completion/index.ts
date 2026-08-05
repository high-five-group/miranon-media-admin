import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';

// test-invite-completion — STAGING-ONLY testharness-EF (Väg A, Marcus-
// kvitterad rekommendation 2026-08-05).
//
// VAD: en tunn, admin-JWT-gated proxy mot två Supabase Admin-API-anrop
// (`auth.admin.generateLink` typ 'invite' + `auth.admin.deleteUser`) för EN
// smal klass av e-postadresser (se § ADRESS-ALLOWLIST nedan). Ett
// `action`-diskriminerat kontrakt, INTE två separata EF:er — samma yta
// hanterar både att provisionera och riva testanvändaren (djup modul,
// samma anda som invite-user).
//
// VARFÖR (branschprecedent, inte eget påhitt): `docs/research/
// auth-invite-e2e-service-role-branschprecedent-2026-08-05.md` § Rekommendation
// läste TRE oberoende, mergade precedent-projekt (Ghost PR #21637, cal.coms
// forgot-password.e2e.ts + testUtils.ts, twenty PR #9332) som ALLA löser
// "jag behöver en riktig invite/reset-länk deterministiskt i CI" genom
// PRIVILEGIERAD BACKEND-LÄSNING — aldrig genom att läsa en riktig mailinkorg.
// Väg C (`supabase start` + Mailpit) löser ett ANNAT problem (mailinnehålls-
// verifiering) till en mätt CI-kostnad (2–5 min kallstart, §6) och en
// strukturellt bredare paritetsrisk (§7) — se forskningspasset för hela
// avvägningen; den återges inte här.
//
// VILKET BESLUT DEN VERKSTÄLLER: TASK-127.9:s Implementation Notes
// ("Vad som byggs nu i stället", 2026-08-05) beställer exakt denna EF som
// FÖRBEREDANDE mekanism — den gör INTE TASK-127.9:s AC #1 grönt själv
// (frontend-reachability är Fas 7-bundet, § 8 i research-passet); den gör
// mekanismen redo att kopplas in samma dag Fas 7:s Vercel-preview-pipeline
// landar. Detta korts leverans rör därför varken TASK-127.9:s kort eller
// dess AC.
//
// UTELÄMNAD UR .prod-functions-allowlist.conf — MEDVETET, `test-auth`-
// precedenten (samma fil, samma kommentarrad: "test-auth saknas MEDVETET —
// den är test-only och får aldrig nå prod"). En katalog under
// `supabase/functions/` som inte står i allowlisten deployas ALDRIG till
// prod (fail-closed, `scripts/deploy-prod-functions.sh`); att lägga till
// denna katalog utan att röra allowlist-filen är alltså i sig den säkra
// handlingen, inte en lucka att täppa till.
//
// ADRESS-ALLOWLIST — DEN VIKTIGASTE HÄRDNINGEN I DENNA FIL. `generateLink`
// mot en BEFINTLIG admins riktiga e-post ger en giltig, konsumerbar
// inloggningslänk för det kontot — utan en spärr vore denna EF en
// account-takeover-väg MELLAN admins (en admin skulle kunna generera en
// inloggningslänk åt en ANNAN admin). Därför: EF:en accepterar ENDAST
// e-postadresser vars local-part bär segmentet `+e2e-` (case-insensitivt),
// kontrollerat FÖRE något Admin-API-anrop, deny-by-default (403). Detta
// återanvänder plus-adress-konventionen som redan finns i repot
// (`marcus+ef-smoke@h5gruppen.se`, etablerad S84 för prod-smoke) men med
// ett EGET, distinkt segment (`+e2e-` inte `+ef-smoke`) så staging-testadresser
// aldrig kan förväxlas med den permanenta prod-smoke-identiteten. Eftersom
// ADMIN_EMAILS-listan bär adminens VERKLIGA, otaggade e-post (aldrig en
// `+e2e-`-taggad variant), kan denna EF strukturellt aldrig träffa en riktig
// adminidentitet — mönstret är testat i båda riktningar, se testfilens
// § Deny/Allow.
//
// KÄND KANT 1 — generateLink(type:'invite') mot en REDAN BEFINTLIG,
// BEKRÄFTAD mottagare ger 422 email_exists (samma gren som
// invite-user/inviteUserByEmail, verifierat mot GoTrue-källkoden
// internal/api/mail.go via context7 under detta korts bygge — IsConfirmed()
// FÖRE token-regenerering). En OBEKRÄFTAD existerande rad regenererar token
// utan fel. Praktiskt ofarligt här: adressen måste redan matcha
// `+e2e-`-mönstret OCH vara skapad av ett tidigare, ej städat testkörning för
// att träffa denna gren.
//
// KÄND KANT 2 — `deleteUser` tar ett user-ID, inte en e-post, och
// `auth.admin.listUsers()`s TYPADE parameter (`PageParams`) exponerar
// ENDAST `page`/`perPage` — GoTrues eget REST-lager stöder däremot
// `GET /admin/users?filter=<substräng>` (LIKE-matchning mot email/
// full_name, verifierat mot GoTrue-källkoden internal/api/admin.go +
// internal/models/user.go via context7). `findUserIdByEmailExact` nedan
// anropar det lagret direkt (`fetch`, inte SDK:t) i stället för att anta ett
// `perPage`-tak som tyst skulle sluta fungera vid tillräckligt många
// staging-users. Filter-matchningen är en SUBSTRÄNG, så resultatet
// EXAKT-filtreras klientsidan innan ett ID returneras — e-post är unikt i
// auth.users, så efter exakt-filtrering finns högst en träff.
//
// EN ADRESS SOM INTE FINNS (delete_user): EF:en svarar `{deleted: false}`
// (200), INTE 404. Valt medvetet — `delete_user` är tänkt som en
// TEARDOWN-operation (jfr testfilens rensnings-anrop efter `generate_link`),
// och en teardown som redan är i sitt måltillstånd (användaren finns inte)
// är per REST-idempotens-konvention ett giltigt, icke-felaktigt utfall, inte
// ett klientfel. Ett 404 hade tvingat varje anropare (inkl. testfilens egen
// "riv om den finns"-väg) att särskilja "redan borta" från "genuint fel" —
// `{deleted: false}` gör den skillnaden explicit i svarskroppen i stället.
//
// ADR-026-NOT: `isAdminEmail` nedan är en TREDJE lokal dubblett (efter
// create-admin-user och invite-user) av samma ~10-radersfunktion. Det korsar
// ADR-026:s ≥3-användnings-tröskel för _shared-extraktion (se
// invite-user/index.ts:s fil-header för samma resonemang vid 2 konsumenter).
// Denna skiva duplicerar MEDVETET ändå — uppdraget bad uttryckligen om
// "exakt invite-user-formen", och en _shared-extraktion hade rört
// create-admin-user/index.ts och invite-user/index.ts, båda ORELATERADE
// filer för detta kort. Flaggat i slutrapporten som ett öppet
// uppföljnings-beslut, inte tyst nedprioriterat.

const VALID_ACTIONS = ['generate_link', 'delete_user'] as const;
type Action = (typeof VALID_ACTIONS)[number];

function isValidAction(action: unknown): action is Action {
  return typeof action === 'string' && (VALID_ACTIONS as readonly string[]).includes(action);
}

// Samma pragmatiska sanity-check som invite-user (inte RFC 5322-fullständig).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ADRESS-ALLOWLIST (se fil-header § ADRESS-ALLOWLIST). Kräver ett `+e2e-`-
// segment i local-parten, case-insensitivt. Detta är EF:ens viktigaste
// spärr — testas explicit i båda riktningar i testfilen.
const TEST_EMAIL_RE = /^[^\s@]+\+e2e-[^\s@]+@[^\s@]+\.[^\s@]+$/i;

// Dubblett av create-admin-user/invite-user:s isAdminEmail — se fil-header
// § ADR-026-NOT.
function isAdminEmail(callerEmail: string | undefined): boolean {
  if (!callerEmail) return false;

  const raw = Deno.env.get('ADMIN_EMAILS') ?? '';
  const allowlist = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);

  if (allowlist.length === 0) return false; // deny-by-default

  return allowlist.includes(callerEmail.trim().toLowerCase());
}

function badRequest(message: string, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Slår upp user-ID för en EXAKT e-postadress via GoTrues `filter`-query-param
 * (se fil-header § KÄND KANT 2). `filter` är en substräng-matchning
 * (LIKE '%value%') mot email/full_name — resultatet filtreras därför alltid
 * till en exakt (case-insensitiv) e-post-match innan ett ID returneras.
 * `null` om ingen exakt träff. Kastar om fler än en exakt träff hittas
 * (strukturellt omöjligt — e-post är unikt i auth.users — men fail-loud
 * hellre än att tyst returnera fel användare).
 */
async function findUserIdByEmailExact(
  supabaseUrl: string,
  serviceRoleKey: string,
  email: string,
): Promise<string | null> {
  const url = `${supabaseUrl}/auth/v1/admin/users?filter=${encodeURIComponent(email)}&per_page=50`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
  });

  if (!res.ok) {
    throw new Error(
      `test-invite-completion: user-lookup misslyckades (status ${res.status}): ${await res.text()}`,
    );
  }

  const body = (await res.json()) as { users?: Array<{ id: string; email?: string }> };
  const exact = (body.users ?? []).filter((u) => u.email?.toLowerCase() === email);

  if (exact.length > 1) {
    throw new Error(
      `test-invite-completion: flera users matchade exakt email=${email} (oväntat — email ska vara unikt i auth.users)`,
    );
  }

  return exact[0]?.id ?? null;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  // 0. Metod-vakt FÖRE auth (samma form som invite-user/create-admin-user):
  //    fel metod är ett kontraktsfel, inte ett auth-fel.
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 1. Auth-gate: caller måste vara en inloggad user.
  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  // 2. Server-config-check: ADMIN_EMAILS måste vara satt (deny-by-default).
  const adminEmailsConfigured = (Deno.env.get('ADMIN_EMAILS') ?? '').trim().length > 0;
  if (!adminEmailsConfigured) {
    console.error('[test-invite-completion] ADMIN_EMAILS env-secret saknas eller tom.');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 3. Authorization: caller's email måste finnas på allowlisten.
  if (!isAdminEmail(user.email)) {
    console.warn(
      `[test-invite-completion] DENY caller_user_id=${user.id} email=${user.email ?? '<missing>'} not in ADMIN_EMAILS`,
    );
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await req.json()) as Record<string, unknown> | null;
    const action = body?.action;
    const rawEmail = body?.email;
    const rawRedirectTo = body?.redirect_to;

    if (!isValidAction(action)) {
      return badRequest(`action is required and must be one of: ${VALID_ACTIONS.join(', ')}`, corsHeaders);
    }

    if (typeof rawEmail !== 'string' || !EMAIL_RE.test(rawEmail.trim())) {
      return badRequest('email is required and must be a valid email address', corsHeaders);
    }
    const email = rawEmail.trim().toLowerCase();

    if (rawRedirectTo !== undefined && typeof rawRedirectTo !== 'string') {
      return badRequest('redirect_to must be a string if provided', corsHeaders);
    }

    // 4. ADRESS-ALLOWLIST — deny FÖRE något Admin-API-anrop (se fil-header
    //    § ADRESS-ALLOWLIST). Detta är EF:ens huvudsakliga härdning.
    if (!TEST_EMAIL_RE.test(email)) {
      console.warn(
        `[test-invite-completion] DENY-ADDRESS caller_user_id=${user.id} target=${email} does not match test-address pattern`,
      );
      return new Response(
        JSON.stringify({
          error: "Email does not match the test-address pattern (requires a '+e2e-' segment in the local part)",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    if (action === 'generate_link') {
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email,
        options: rawRedirectTo ? { redirectTo: rawRedirectTo } : undefined,
      });

      if (error) {
        // Operationellt fel (t.ex. 422 "already registered" för en REDAN
        // BEKRÄFTAD mottagare — se fil-header § KÄND KANT 1).
        console.warn(
          `[test-invite-completion] DENY-UPSTREAM(generate_link) caller_user_id=${user.id} target=${email} status=${error.status} message=${error.message}`,
        );
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.status ?? 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(
        `[test-invite-completion] ALLOW(generate_link) caller_user_id=${user.id} target=${email} invited_user_id=${data.user.id}`,
      );

      // Djup modul: klienten ser bara den smala, avsiktliga formen —
      // inte hela GenerateLinkProperties (email_otp, redirect_to,
      // verification_type utelämnade, oanvända av denna skivas kontrakt).
      return new Response(
        JSON.stringify({
          action_link: data.properties.action_link,
          hashed_token: data.properties.hashed_token,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // action === 'delete_user'
    const userId = await findUserIdByEmailExact(supabaseUrl, serviceRoleKey, email);

    if (!userId) {
      // Idempotent no-op, INTE 404 — se fil-header § "EN ADRESS SOM INTE
      // FINNS".
      console.log(`[test-invite-completion] ALLOW(delete_user, no-op) caller_user_id=${user.id} target=${email}`);
      return new Response(JSON.stringify({ deleted: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      throw new Error(
        `test-invite-completion: kunde inte radera user_id=${userId} (email=${email}): ${deleteError.message}`,
      );
    }

    console.log(
      `[test-invite-completion] ALLOW(delete_user) caller_user_id=${user.id} target=${email} deleted_user_id=${userId}`,
    );

    return new Response(JSON.stringify({ deleted: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'test-invite-completion',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
