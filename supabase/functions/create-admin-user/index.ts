import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireUser } from '../_shared/auth.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

// Caller-verifiering — endast users vars email finns i ADMIN_EMAILS-listan
// (komma-separerad env-secret) får skapa nya admin-users.
//
// K7-respekt (rekommendation ≠ beslut när gate är öppen): hårdkodad
// email-allowlist är en medveten pre-S-track-bridge. Ersätts av
// `tenant_memberships.role IN ('owner', 'admin')` när 06b §A3 byggs.
// Strukturera så att utbyte är icke-breaking — denna helpers signatur
// (returvärde { allowed: boolean, reason?: string }) håller även när
// källdata flyttas från env till tabellen.
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

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // 1. Auth-gate: caller måste vara en inloggad user (inte anon-key,
  //    inte saknad header).
  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  // 2. Server-config-check: ADMIN_EMAILS måste vara satt. Saknad
  //    config → 500 (infrastruktur är fel, inte caller). Skiljer
  //    sig från 403 så att Marcus kan se i loggar att secret saknas.
  const adminEmailsConfigured = (Deno.env.get('ADMIN_EMAILS') ?? '').trim().length > 0;
  if (!adminEmailsConfigured) {
    console.error('[create-admin-user] ADMIN_EMAILS env-secret saknas eller tom.');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 3. Authorization: caller's email måste finnas på allowlisten.
  //    Loggar caller_user_id för audit innan deny så att obehöriga
  //    försök är spårbara. Läcker inte allowlist eller varför till
  //    klienten — bara generic "Forbidden".
  if (!isAdminEmail(user.email)) {
    console.warn(
      `[create-admin-user] DENY: caller_user_id=${user.id} email=${user.email ?? '<missing>'} not in ADMIN_EMAILS`,
    );
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'email and password required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(
      `[create-admin-user] ALLOW: caller_user_id=${user.id} email=${user.email} → creating new admin email=${email}`,
    );

    // Kräver service_role key — BARA för admin-operationer
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skippa e-postverifiering
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ user: { id: data.user.id, email: data.user.email } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
