// CORS-helpers — origin-allowlist via env (M3).
//
// Allowlist läses från CORS_ALLOWED_ORIGINS-secret (komma-separerad
// lista av origins). Origin-headern från klienten matchas exakt mot
// allowlisten — inga wildcards, ingen substring-matchning.
//
// K7-respekt (rekommendation ≠ beslut när gate är öppen): env-driven
// allowlist är medveten pre-S-track-bridge. Kan flyttas till
// `tenants.allowed_origins` när 06b §A1 byggs. Strukturera så att
// utbyte är icke-breaking — corsHeadersFor(req) signaturen håller
// även när källdata flyttas från env till tabellen.
//
// Två särskilda fall:
//
// 1. Non-browser-klienter (curl, server-till-server, Playwright API
//    request context) skickar oftast ingen Origin-header. Då gör vi
//    inget — request släpps genom utan Allow-Origin-header. CORS
//    är browser-säkerhet, inte server-side-auth.
//
// 2. Preflight (OPTIONS) kräver Origin på allowlisten — annars 403.
//    Browsers skickar alltid Origin på preflight per spec. Saknad
//    Origin på preflight indikerar manipulation eller bugg.

const BASE_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
};

function getAllowlist(): string[] {
  const raw = Deno.env.get('CORS_ALLOWED_ORIGINS') ?? '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function isAllowedOrigin(origin: string): boolean {
  const allowlist = getAllowlist();
  if (allowlist.length === 0) return false; // deny-by-default
  return allowlist.includes(origin);
}

// Bygger CORS-headers för en specifik request. Sätter
// Access-Control-Allow-Origin BARA om Origin finns och är på
// allowlisten. Saknad Origin (server-till-server) eller otillåten
// Origin → bara base-headers utan Allow-Origin (browser blockerar
// då response, server-till-server bryr sig inte).
export function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin');
  if (origin && isAllowedOrigin(origin)) {
    return { ...BASE_HEADERS, 'Access-Control-Allow-Origin': origin };
  }
  return { ...BASE_HEADERS };
}

// Hanterar preflight OPTIONS-requests. Returnerar:
//   - 403 om OPTIONS med saknad eller otillåten Origin
//   - 200 OK med corsHeadersFor(req) om OPTIONS med tillåten Origin
//   - null för non-OPTIONS (caller fortsätter med vanlig hantering)
export function handleCors(req: Request): Response | null {
  if (req.method !== 'OPTIONS') return null;

  const origin = req.headers.get('Origin');
  if (!origin || !isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('ok', { headers: corsHeadersFor(req) });
}
