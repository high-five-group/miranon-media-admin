// Auth-helper för Edge Functions.
//
// Mönster: SECURITY-SPEC.md §5 A01 (Broken Access Control).
//
// Returvärde idag: { user }. Strukturen är icke-breaking — framtida fält
// (tenant_id, memberships) läggs till utan att bryta callers, per K7
// (rekommendation är inte beslut när gate är öppen). Inga tenant- eller
// integration_sources-konstrukt smyg-implementeras här.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuthenticatedUser {
  id: string;
  email: string | undefined;
  role: string | undefined;
}

export interface AuthContext {
  user: AuthenticatedUser;
}

// requireUser extraherar JWT från Authorization-header, verifierar mot
// Supabase Auth, och returnerar AuthContext. Vid fel returneras en färdig
// 401-Response som callern kan skicka direkt vidare:
//
//   const auth = await requireUser(req, corsHeaders);
//   if (auth instanceof Response) return auth;
//   const { user } = auth;
//
// 401 returneras vid:
//   1. Saknad Authorization-header
//   2. Felaktigt header-format (saknar "Bearer ")
//   3. Tom token efter "Bearer "
//   4. supabase.auth.getUser() returnerar fel eller null user (= ogiltig
//      eller utgången JWT, eller anon-key som inte representerar en user)
//   5. user.role === 'anon' (defensiv check ifall Supabase någon gång
//      returnerar en user för anon-key)
//
// 500 returneras om SUPABASE_URL eller SUPABASE_ANON_KEY saknas i miljön
// (kritisk konfigurationsfel — det är inte ett auth-problem).
export async function requireUser(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<AuthContext | Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return unauthorized('Missing Authorization header', corsHeaders);
  }

  if (!authHeader.startsWith('Bearer ')) {
    return unauthorized('Invalid Authorization header format', corsHeaders);
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return unauthorized('Empty bearer token', corsHeaders);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) {
    return new Response(
      JSON.stringify({ error: 'Server auth not configured' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return unauthorized('Invalid or expired token', corsHeaders);
  }

  if (data.user.role === 'anon') {
    return unauthorized('Anon key not accepted as user identity', corsHeaders);
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
    },
  };
}

function unauthorized(
  message: string,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
