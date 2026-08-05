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
// TVÅ SEPARATA ADMIN-ANROP (invite + roll-lås/metadata) — INTE en enda
// transaktion: `inviteUserByEmail` har inget app_metadata-argument, så
// rollen (OCH sedan TASK-143: display_name/inviter_name igen, se nedan)
// sätts i ett EGET `updateUserById`-anrop direkt efter. Om DET anropet
// failar efter en HELT NY inbjudan (kontrollerat via
// created_at===updated_at-heuristiken nedan) städas den nyskapade,
// roll-lösa raden bort (best-effort) så att ett omförsök blir rent — en
// existerande (omskickad) rad rörs ALDRIG av denna städning, den kan bära
// en tidigare korrekt låst roll/metadata.
//
// SMTP/leverans är UTANFÖR denna skivas omfattning (Grind 0, PRD § Utanför
// omfattningen) — se testfilens header för hur det påverkar vilka vägar som
// faktiskt kan bevisas mot staging idag.
//
// TASK-143 (2026-08-05): KONTRAKTET UTÖKAT MED NAMN + INBJUDARE.
// Marcus beslut S96: "Vi ska DEFINITIVT ha namn där vid inbjudan!" — accept-
// sidans (TASK-127.6) facit visar en personlig hälsning ("Välkommen, Lotta" /
// "Marcus Johansson har bjudit in dig...") som det gamla {email, role}-
// kontraktet inte kunde bära. Två nya bitar data, olika ursprung och olika
// säkerhetsklass:
//
//   - `name` (MOTTAGARENS namn): KLIENT-INDATA, precis som email/role — den
//     som utlöser inbjudan skriver in vem som bjuds in. Icke-säkerhetsbärande
//     (bara personalisering), lagras därför i `user_metadata.display_name` —
//     SAMMA fält och SAMMA konvention som `AuthProvider.tsx`s `sessionToUser`
//     redan läser för INLOGGADE users (task-1.1-namekällan). Ingen ny
//     namekälla uppfinns; detta fyller den befintliga för en helt ny user.
//   - Inbjudarens identitet: ALDRIG klient-indata (AC#1) — härleds
//     SERVER-SIDE ur den ANROPANDE adminens egen verifierade JWT, exakt
//     samma spoof-säkra mönster som `create-event-note` använder för
//     Författare-attribution (`readDisplayNameFromJwt` nedan är en medveten
//     DUBBLETT av den funktionen — ADR-026 <3-tröskeln, samma motiv som
//     `isAdminEmail` ovan; nu 2 konsumenter, ingen _shared-extraktion ännu).
//     Lagras i `user_metadata.inviter_name`.
//
// KÄND KANT, VERIFIERAD MOT GOTRUES KÄLLKOD (internal/api/invite.go, hämtad
// via context7 under detta korts bygge): för en NY inbjudan sätter
// `inviteUserByEmail`s `data`-param `user_metadata` FÖRE mailet skickas (via
// `SignupParams.Data` → `signupNewUser`), så den FÖRSTA mailen är alltid
// korrekt personaliserad. För ETT OMSKICK av en REDAN EXISTERANDE, obekräftad
// rad tar `Invite`-handlern en HELT ANNAN gren (`if !isCreate { ... }`) som
// ALDRIG tillämpar det nya anropets `params.Data` — mailet för DET omskicket
// byggs av GoTrue med raden precis SOM DEN REDAN LÅG I DATABASEN, inte det
// nya anropets namn/inbjudare. Denna EF:s egen `updateUserById`-anrop (se
// nedan) uppdaterar ALLTID `user_metadata` efteråt oavsett fresh/omskick —
// så ETT EFTERFÖLJANDE omskick (eller accept-sidans läsning av den lagrade
// metadatan) blir korrekt, men just DEN specifika mailen för ett omskick av
// en rad vars metadata ännu inte hunnit uppdateras kan sakna namn. Praktiskt
// overifierbart idag (noll skarpa, utestående inbjudningar finns i staging
// vid detta korts bygge — DoD #7 på förälderkortet är fortfarande öppet) men
// flaggat öppet, inte tyst antaget bort. `invite.html`s mall är byggd med
// `{{if}}`-vakter kring båda fälten av exakt detta skäl — en tom/saknad
// Go-map-nyckel renderar annars ordagrant `<no value>` i mailet
// (text/template-standardbeteende), inte tom sträng.

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

// Sane längd-tak mot abuse (samma anda som create-event-note:s
// MAX_TEXT_LENGTH) — ett namn är kort; 200 tecken ger ordentlig marginal
// för långa namn utan att vara en öppen fritext-yta.
const MAX_NAME_LENGTH = 200;

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

/**
 * Läser `user_metadata.display_name` ur den REDAN VERIFIERADE JWT:ns payload
 * (requireUser har verifierat signaturen; vi läser bara en claim — ingen ny
 * nätverksrunda). Dubblett av `create-event-note`s hjälpfunktion av samma
 * namn (ADR-026 <3-tröskeln, samma motiv som `isAdminEmail` ovan — 2
 * konsumenter, ingen _shared-extraktion ännu). HÄR läser den den ANROPANDE
 * ADMINENS egen identitet (inbjudaren), inte mottagarens — kontraktsmässigt
 * en annan användning av samma mekanism, men koden är identisk.
 * Base64url + UTF-8-säker avkodning (svenska namn som "Åsa Öberg" ska aldrig
 * manglas — Gunilla-principen). null om claimen saknas/är tom/ogiltig.
 */
function readDisplayNameFromJwt(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const parts = authHeader.slice('Bearer '.length).trim().split('.');
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    const claims = JSON.parse(new TextDecoder().decode(bytes)) as {
      user_metadata?: { display_name?: unknown };
    };
    const raw = claims.user_metadata?.display_name;
    return typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : null;
  } catch {
    return null;
  }
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
  const authHeader = req.headers.get('Authorization');
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
    const rawName = body?.name;

    if (typeof rawEmail !== 'string' || !EMAIL_RE.test(rawEmail.trim())) {
      return badRequest('email is required and must be a valid email address', corsHeaders);
    }
    const email = rawEmail.trim().toLowerCase();

    if (!isValidRole(role)) {
      return badRequest(`role is required and must be one of: ${VALID_ROLES.join(', ')}`, corsHeaders);
    }

    // AC#1 (TASK-143): mottagarens namn är KLIENT-INDATA (den som utlöser
    // inbjudan skriver in vem som bjuds in) — till skillnad från inbjudarens
    // identitet nedan, som ALDRIG får komma härifrån.
    if (typeof rawName !== 'string' || !rawName.trim()) {
      return badRequest('name is required (non-empty string)', corsHeaders);
    }
    if (rawName.trim().length > MAX_NAME_LENGTH) {
      return badRequest(`name exceeds ${MAX_NAME_LENGTH} characters`, corsHeaders);
    }
    const name = rawName.trim();

    // AC#1 (TASK-143): inbjudarens identitet härleds SERVER-SIDE ur den
    // ANROPANDE adminens egen redan-verifierade JWT — aldrig ur `body`.
    // Fallback-kedjan (display_name → e-post → user-id) matchar
    // create-event-note:s exakta mönster, så fältet aldrig blir tomt.
    const inviterName = readDisplayNameFromJwt(authHeader) ?? user.email ?? user.id;

    console.log(
      `[invite-user] ALLOW caller_user_id=${user.id} caller_email=${user.email} inviter_name=${inviterName} -> inviting email=${email} role=${role} name=${name}`,
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

    // `data` blir `user_metadata` (verifierat mot Supabase-docs + GoTrue-
    // källkod via context7, se fil-header): korrekt för en FÄRSK inbjudan,
    // ignorerat av GoTrue för ett omskick av en redan existerande rad (se
    // fil-header § KÄND KANT) — täckt av `updateUserById` nedan istället.
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        ...(redirectTo ? { redirectTo } : {}),
        data: { display_name: name, inviter_name: inviterName },
      },
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
    // user_metadata SÄTTS OM här (TASK-143) — inte bara vid `inviteUserByEmail`
    // ovan — så att ETT OMSKICK alltid lämnar raden med FÄRSK display_name/
    // inviter_name från DETTA anrop, oavsett vad GoTrue gjorde med mailet
    // (se fil-header § KÄND KANT). Samma admin-anrop, två separata metadata-
    // fält — ingen ny risk-yta jämfört med före TASK-143.
    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(invitedUser.id, {
      app_metadata: { role },
      user_metadata: { display_name: name, inviter_name: inviterName },
    });

    if (metadataError) {
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
      // (EF5/EF6), inte metadataErrors interna detalj.
      throw new Error(
        `invite-user: kunde inte låsa app_metadata.role/user_metadata för invited_user_id=${invitedUser.id} (fresh=${isFreshInvite}): ${metadataError.message}`,
      );
    }

    // Djup modul: klienten ser ALDRIG Supabase-userens råa fältform —
    // bara den smala, avsiktliga formen (id + e-post + låst roll + namnet
    // som faktiskt sattes).
    return new Response(
      JSON.stringify({ invited: { id: invitedUser.id, email: invitedUser.email, role, name } }),
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
