import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';

// invite-user — utlöser en Användarinbjudan (ADR-092/ADR-093, TASK-127.5).
//
// KONTRAKT (ADR-092 beslut 1-4): admin-handling med service-role-nyckel,
// ANROPAS ALDRIG från klienten. Grindad bakom samma ADMIN_EMAILS-allowlist
// som create-admin-user (M6) — isAdminEmail nedan är en MEDVETEN dubblett,
// inte en refaktor-miss: ADR-026:s ≥3-användnings-tröskel för _shared-
// extraktion är inte nådd (2 konsumenter: create-admin-user + denna).
//
// ROLL LÅSES I app_metadata, INTE user_metadata. Detta är en skarpare
// tolkning än ADR-092:s ordval ("...låsta i inbjudans metadata") — ADR:n
// namnger inget specifikt Supabase-fält. `user_metadata` (vad
// `inviteUserByEmail`s `data`-parameter skriver till) är SJÄLV-redigerbart
// av mottagaren via `supabase.auth.updateUser({ data })` — hade vi lagt
// rollen där hade mottagaren kunnat skriva om sin egen roll efter accept,
// exakt den account-takeover-väg ADR-092 säger sig stänga. `app_metadata`
// kan ENDAST skrivas av Admin-API:t (service-role), aldrig av användaren
// själv. Källa: Supabase Auth Row Level Security-guiden — "raw_user_meta_data
// ... can be updated by users and is unsuitable for authorization data, and
// raw_app_meta_data ... cannot be updated by users and is ideal for storing
// authorization information" (verifierat via context7/supabase.com/docs
// under TASK-127.5:s bygge). Se README-notering i PR-beskrivningen.
//
// OMSKICK ÄR EN GRATIS EGENSKAP HOS GOTRUE, INTE EGEN KOD (AC#3): GoTrues
// `/invite`-handler (internal/api/invite.go) slår upp e-posten FÖRE den
// öppnar sin transaktion. Existerar ANVÄNDAREN redan och är OBEKRÄFTAD
// (= en tidigare, ev. utgången inbjudan som aldrig accepterats) hoppar den
// över `signupNewUser` och går rakt till `sendInvite` — SAMMA rad
// regenereras (nytt token, ny `confirmation_sent_at`), ingen dubblett skapas.
// Existerar användaren och ÄR bekräftad → 422 `email_exists` INNAN någon
// email-kod någonsin körs. Denna EF behöver alltså ingen egen
// "är det här en nyinbjudan eller ett omskick"-gren — att bara anropa
// `inviteUserByEmail` igen ÄR omskicket. Källa: GoTrue-källkoden
// (github.com/supabase/auth, internal/api/invite.go + internal/api/mail.go),
// hämtad via context7 under TASK-127.5:s bygge.
//
// TVÅ SEPARATA ADMIN-ANROP (invite + roll-lås) — INTE en enda transaktion:
// `inviteUserByEmail` har inget app_metadata-argument, så rollen sätts i ett
// EGET `updateUserById`-anrop direkt efter. Om DET anropet failar efter en
// HELT NY inbjudan (kontrollerat via created_at===updated_at-heuristiken
// nedan) städas den nyskapade, roll-lösa raden bort (best-effort) så att ett
// omförsök blir rent — en existerande (omskickad) rad rörs ALDRIG av denna
// städning, den kan bära en tidigare korrekt låst roll.
//
// SMTP/leverans är UTANFÖR denna skivas omfattning (Grind 0, PRD § Utanför
// omfattningen) — se testfilens header för hur det påverkar vilka vägar som
// faktiskt kan bevisas mot staging idag.

// Roller giltiga vid inbjudan. v1: enbart 'admin' — matchar dagens
// ADMIN_EMAILS-modell (alla listade adresser har fulla admin-rättigheter,
// ingen finkornig roll finns ännu). Allowlist (EF3, deny-by-default) —
// utökas när tenant_memberships (06b §A3) inför fler roller (t.ex. 'owner',
// 'member') UTAN att {email, role}-kontraktet ändras (ADR-092 beslut 4).
const VALID_ROLES = ['admin'] as const;
type InviteRole = (typeof VALID_ROLES)[number];

function isValidRole(role: unknown): role is InviteRole {
  return typeof role === 'string' && (VALID_ROLES as readonly string[]).includes(role);
}

// Pragmatisk sanity-check, inte RFC 5322-fullständig validering — samma
// anda som övriga EF:er (create-admin-user validerar bara presence). En
// identitets-bärande adress förtjänar dock mer än "finns strängen".
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Caller-verifiering — endast users vars email finns i ADMIN_EMAILS-listan
// (komma-separerad env-secret) får utlösa en inbjudan. Dubblett av
// create-admin-user:s isAdminEmail — se fil-header för ADR-026-motivet.
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

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  // 0. Metod-vakt FÖRE auth (samma form som create-admin-user/create-event):
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
    console.error('[invite-user] ADMIN_EMAILS env-secret saknas eller tom.');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 3. Authorization: caller's email måste finnas på allowlisten.
  if (!isAdminEmail(user.email)) {
    console.warn(
      `[invite-user] DENY: caller_user_id=${user.id} email=${user.email ?? '<missing>'} not in ADMIN_EMAILS`,
    );
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await req.json()) as Record<string, unknown> | null;
    const rawEmail = body?.email;
    const role = body?.role;

    if (typeof rawEmail !== 'string' || !EMAIL_RE.test(rawEmail.trim())) {
      return badRequest('email is required and must be a valid email address', corsHeaders);
    }
    const email = rawEmail.trim().toLowerCase();

    if (!isValidRole(role)) {
      return badRequest(`role is required and must be one of: ${VALID_ROLES.join(', ')}`, corsHeaders);
    }

    console.log(
      `[invite-user] ALLOW caller_user_id=${user.id} caller_email=${user.email} -> inviting email=${email} role=${role}`,
    );

    // Kräver service_role key — BARA för admin-operationer.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Omdirigeringsmål är VALFRITT env-config (ADR-092 § Relaterat: målet
    // registreras separat i plattformens redirect-allowlist, ett Grind
    // 0-moment). Saknas den faller Supabase tillbaka på projektets
    // konfigurerade Site URL — inget hårt krav, ingen 500 vid avsaknad.
    const redirectTo = (Deno.env.get('INVITE_REDIRECT_URL') ?? '').trim() || undefined;

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      redirectTo ? { redirectTo } : {},
    );

    if (inviteError) {
      // Operationellt fel (t.ex. 422 "already registered" för en REDAN
      // BEKRÄFTAD mottagare — GoTrue fäller detta FÖRE sendInvite körs,
      // se fil-header). error.status är den verkliga HTTP-statusen GoTrue
      // gav — mer korrekt än create-admin-user:s hårdkodade 400 (EF4).
      console.warn(
        `[invite-user] DENY-UPSTREAM caller_user_id=${user.id} target=${email} status=${inviteError.status} message=${inviteError.message}`,
      );
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: inviteError.status ?? 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const invitedUser = inviteData.user;

    // Heuristik för "var detta en helt ny rad eller ett omskick": en
    // NYSKAPAD auth.users-rad föds med created_at === updated_at (samma
    // INSERT). Ett omskick av en existerande, obekräftad rad triggar en
    // UPDATE (confirmation_token/confirmation_sent_at/invited_at) som
    // flyttar updated_at framåt medan created_at förblir den URSPRUNGLIGA
    // inbjudningstiden — de två blir därför olika. Används ENDAST för att
    // avgöra om kompensations-radering nedan är säker (se fil-header).
    const isFreshInvite = invitedUser.created_at === invitedUser.updated_at;

    // Rollen LÅSES i app_metadata (admin-only-writable, se fil-header).
    const { error: roleError } = await supabaseAdmin.auth.admin.updateUserById(invitedUser.id, {
      app_metadata: { role },
    });

    if (roleError) {
      if (isFreshInvite) {
        // Best-effort kompensation: en NY inbjudan utan låst roll är en
        // trasig account-takeover-öppning (ADR-092) — städa bort raden så
        // ett omförsök blir rent. En OMSKICKAD rad rörs ALDRIG (kan bära
        // en tidigare korrekt låst roll; se fil-header).
        const { error: cleanupError } = await supabaseAdmin.auth.admin.deleteUser(invitedUser.id);
        if (cleanupError) {
          console.error(
            `[invite-user] kompensations-radering misslyckades invited_user_id=${invitedUser.id}: ${cleanupError.message}`,
          );
        }
      }
      // Genuint oväntat serverfel (inte caller-orsakat) — låt
      // mapErrorToResponse ge strukturerad JSON-logg + generisk 5xx-kropp
      // (EF5/EF6), inte rollErrors interna detalj.
      throw new Error(
        `invite-user: kunde inte låsa app_metadata.role för invited_user_id=${invitedUser.id} (fresh=${isFreshInvite}): ${roleError.message}`,
      );
    }

    // Djup modul: klienten ser ALDRIG Supabase-userens råa fältform —
    // bara den smala, avsiktliga formen (id + e-post + låst roll).
    return new Response(
      JSON.stringify({ invited: { id: invitedUser.id, email: invitedUser.email, role } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'invite-user',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
