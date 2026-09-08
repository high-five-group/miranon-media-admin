// CORS-helpers — origin-allowlist via env (M3).
//
// Allowlist läses från CORS_ALLOWED_ORIGINS-secret (komma-separerad
// lista av origins). Origin-headern från klienten matchas exakt mot
// allowlisten — inga wildcards, ingen substring-matchning.
//
// TASK-415.1 (2026-09-06): en ANDRA, valfri secret —
// CORS_ALLOWED_ORIGIN_PATTERNS — prövas EFTER exaktlistan. Den bär
// kommaseparerade MÖNSTER (`*` som enda jokertecken) för Vercel-
// förhandsvisningarnas växlande origins (staging-only; sätts ALDRIG i
// prod). Hela mönster-/beslutslogiken bor i `cors-origin-policy.ts`
// (Deno-fri, med avsikt — se den filens filhuvud) så att den kan
// enhetstestas i Node; denna fil är en tunn wrapper som läser env och
// delegerar dit. Se docs/specs/SECURITY-SPEC.md §6.2 och
// docs/decisions/ADR-050-isolerad-staging-miljo.md § Updates.
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

import { decideOrigin, parseCommaSeparatedList } from './cors-origin-policy.ts';

const BASE_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
};

function getAllowlist(): string[] {
  return parseCommaSeparatedList(Deno.env.get('CORS_ALLOWED_ORIGINS'));
}

/** CORS_ALLOWED_ORIGIN_PATTERNS — ORÖRD/tom i prod, satt enbart i staging (TASK-415.1). */
function getPatternAllowlist(): string[] {
  return parseCommaSeparatedList(Deno.env.get('CORS_ALLOWED_ORIGIN_PATTERNS'));
}

function isAllowedOrigin(origin: string): boolean {
  const { allowed, rejectedPatterns } = decideOrigin(origin, getAllowlist(), getPatternAllowlist());
  for (const pattern of rejectedPatterns) {
    console.warn(
      `[cors] Ogiltigt mönster i CORS_ALLOWED_ORIGIN_PATTERNS, ignoreras (fail-closed): "${pattern}"`,
    );
  }
  return allowed;
}

// Bygger CORS-headers för en specifik request. Sätter
// Access-Control-Allow-Origin BARA om Origin finns och är på
// allowlisten (exakt eller mönster). Saknad Origin (server-till-server)
// eller otillåten Origin → bara base-headers utan Allow-Origin (browser
// blockerar då response, server-till-server bryr sig inte).
//
// Vary: Origin sätts på varje svar som BÄR Access-Control-Allow-Origin
// (TASK-415.1, research sidofynd 3) — MDN: "the server should also
// include Origin in the Vary response header to indicate to clients
// that server responses will differ based on the value of the Origin
// request header." Utan den kan en delad cache (CDN, proxy) servera ett
// svar avsett för origin A till origin B.
export function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin');
  if (origin && isAllowedOrigin(origin)) {
    return { ...BASE_HEADERS, 'Access-Control-Allow-Origin': origin, Vary: 'Origin' };
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
