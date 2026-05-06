# SECURITY-SPEC — Säkerhetsspecifikation

*Skapad: 2026-04-07 | Integrerad från gap-analysis.md*
*Gäller: miranon-media-admin (React 19 SPA med Vite + Supabase)*

---

## 1. Content Security Policy (CSP Level 3)

### Varför CSP

CSP är det viktigaste försvaret mot XSS i en SPA. Utan CSP kan vilken injicerad
`<script>`-tagg som helst exekvera godtycklig kod i Lottas session. Med en
nonce-baserad CSP tillåts bara skript som servern explicit markerat.

### Implementation per fas

| Fas | Vad | Varför |
|-----|-----|--------|
| Fas 0 | CSP-header-definition, Vite-plugin för nonce-generering | Lättare att börja strikt än att strama åt i efterhand |
| Fas 7 | Vercel `_headers`-fil för produktion | Produktionsheaders med korrekt nonce-kedja |

### Nonce-baserad strikt CSP

Exakt CSP-header för miranon-media-admin:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'nonce-{RANDOM}' 'strict-dynamic';
  style-src 'nonce-{RANDOM}' 'self';
  img-src 'self' data: https://*.supabase.co;
  font-src 'self';
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  object-src 'none';
  base-uri 'none';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
```

**Förklaring:**
- `script-src 'nonce-{RANDOM}' 'strict-dynamic'` — bara skript med korrekt nonce körs. `strict-dynamic` tillåter dynamiskt laddade skript från godkända skript (t.ex. chunks från Vite).
- `connect-src` tillåter Supabase-anrop (REST + Realtime WebSocket).
- `object-src 'none'` — blockerar Flash/Java-plugins (klassisk XSS-vektor).
- `base-uri 'none'` — förhindrar `<base>`-tag-kapning.
- `frame-ancestors 'none'` — ersätter X-Frame-Options, förhindrar clickjacking.

### Vite-plugin för CSP-nonce

```typescript
// vite-plugin-csp-nonce.ts
import { randomBytes } from 'node:crypto';
import type { Plugin } from 'vite';

export function cspNonce(): Plugin {
  return {
    name: 'csp-nonce',
    transformIndexHtml(html) {
      const nonce = randomBytes(16).toString('base64');

      // Injicera nonce i alla script-taggar
      html = html.replace(
        /<script/g,
        `<script nonce="${nonce}"`
      );

      // Injicera nonce i alla style-taggar
      html = html.replace(
        /<style/g,
        `<style nonce="${nonce}"`
      );

      // Injicera CSP meta-tag (dev-läge)
      const csp = [
        `default-src 'self'`,
        `script-src 'nonce-${nonce}' 'strict-dynamic'`,
        `style-src 'nonce-${nonce}' 'self'`,
        `img-src 'self' data: https://*.supabase.co`,
        `connect-src 'self' https://*.supabase.co wss://*.supabase.co`,
        `object-src 'none'`,
        `base-uri 'none'`,
        `frame-ancestors 'none'`,
      ].join('; ');

      html = html.replace(
        '<head>',
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}">`
      );

      return html;
    },
  };
}
```

Registrering i `vite.config.ts`:

```typescript
import { cspNonce } from './vite-plugin-csp-nonce';

export default defineConfig({
  plugins: [
    react(),
    cspNonce(),
    TanStackRouterVite(),
  ],
});
```

### Vercel deployment

`public/_headers`:

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'nonce-{RANDOM}' 'strict-dynamic'; style-src 'nonce-{RANDOM}' 'self'; img-src 'self' data: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
```

**Obs:** Vercel stöder inte dynamisk nonce i `_headers` direkt. För nonce per
request krävs Vercel Edge Middleware:

```typescript
// middleware.ts (Vercel Edge Middleware)
import { next } from '@vercel/edge';

export default function middleware(request: Request) {
  const nonce = crypto.randomUUID().replace(/-/g, '');

  const csp = [
    `default-src 'self'`,
    `script-src 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'nonce-${nonce}' 'self'`,
    `img-src 'self' data: https://*.supabase.co`,
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co`,
    `object-src 'none'`,
    `base-uri 'none'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ');

  const response = next();
  response.headers.set('Content-Security-Policy', csp);
  return response;
}
```

### Bakåtkompatibilitet — 3-stegs fallback

```
Content-Security-Policy:
  script-src 'nonce-{RANDOM}' 'strict-dynamic' https: 'unsafe-inline';
```

- **CSP Level 3:** `strict-dynamic` godkänns → `https:` och `unsafe-inline` ignoreras.
- **CSP Level 2:** `strict-dynamic` okänd → `nonce-{RANDOM}` godkänns → `unsafe-inline` ignoreras.
- **CSP Level 1:** `nonce` okänd → `https:` + `unsafe-inline` används (svagast, men fortfarande bättre än inget).

---

## 2. Trusted Types

### Varför

Trusted Types förhindrar DOM XSS genom att kräva att alla värden som tilldelas
farliga DOM-sänkor (innerHTML, document.write, eval) först passerar en
definierad policy. React skyddar mot XSS som standard — men tredjepartsbibliotek
och `dangerouslySetInnerHTML` går förbi React.

### Implementation

#### DOMPurify-policy

```typescript
// src/security/trusted-types.ts

if (window.trustedTypes) {
  // Huvudpolicy: sanera HTML via DOMPurify
  window.trustedTypes.createPolicy('dompurify', {
    createHTML: (input: string) =>
      DOMPurify.sanitize(input, {
        RETURN_TRUSTED_TYPE: true,
      }) as unknown as string,
  });

  // Default-policy: fångar alla osanerande tilldelningar
  // Loggar varning i dev, blockerar i produktion
  window.trustedTypes.createPolicy('default', {
    createHTML: (input: string) => {
      if (import.meta.env.DEV) {
        console.warn(
          '[Trusted Types] Osanererad HTML-tilldelning fångad:',
          input.slice(0, 100)
        );
      }
      return DOMPurify.sanitize(input);
    },
    createScript: () => {
      throw new Error('[Trusted Types] Dynamisk script-skapande blockerat');
    },
    createScriptURL: (url: string) => {
      // Tillåt bara samma origin
      const parsed = new URL(url, window.location.origin);
      if (parsed.origin === window.location.origin) {
        return url;
      }
      throw new Error(`[Trusted Types] Blockerad script-URL: ${url}`);
    },
  });
}
```

#### CSP-direktiv för Trusted Types

Lägg till i CSP-headern:

```
require-trusted-types-for 'script';
trusted-types dompurify default;
```

#### Utrullningsplan

1. **Fas 3 (UI-primitiver):** Starta i `Content-Security-Policy-Report-Only`-läge.
   Logga övertramp utan att blockera.
2. **Fas 7 (konsolidering):** Granska rapporter. Fixa tredjepartsbibliotek som
   skriver till DOM direkt. Byt till enforcing-läge.

---

## 3. Säkerhetsheaders

### Komplett headertabell

| Header | Värde | Syfte |
|--------|-------|-------|
| `Content-Security-Policy` | Se paragraf 1 ovan | XSS-skydd |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Tvinga HTTPS i 1 år |
| `X-Content-Type-Options` | `nosniff` | Förhindra MIME-sniffing |
| `X-Frame-Options` | `DENY` | Clickjacking-skydd (fallback för CSP frame-ancestors) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Begränsar referrer-info till tredje part |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` | Blockera oanvända webbläsar-API:er |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolerar browsing context |
| `Cross-Origin-Embedder-Policy` | `credentialless` | Tillåter cross-origin resurser utan CORP-header |
| `Cross-Origin-Resource-Policy` | `same-origin` | Förhindrar cross-origin laddning |
| `X-DNS-Prefetch-Control` | `off` | Förhindra DNS-prefetch (integritetsskydd) |

**Obs om COEP:** `require-corp` är striktast men kräver att alla externt laddade
resurser har CORP-header. `credentialless` är pragmatiskt för en SPA som laddar
Supabase-resurser.

### Vercel `_headers`-fil (komplett)

```
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: credentialless
  Cross-Origin-Resource-Policy: same-origin
  X-DNS-Prefetch-Control: off
```

CSP-headern skapas av Edge Middleware (se paragraf 1) — inte i `_headers`-filen,
eftersom nonce måste genereras per request.

### Verifiering

Kör `securityheaders.com` mot produktions-URL:en. Mål: **A+**-betyg.

---

## 4. Supply Chain Security

### 7 försvarslager

#### 1. Lockfiler committade och verifierade

```json
// package.json
{
  "packageManager": "npm@10.x",
  "engines": {
    "node": ">=20"
  }
}
```

`package-lock.json` ska ALLTID vara committad. Installationer i CI kör
`npm ci` (aldrig `npm install`).

#### 2. npm audit som preinstall-hook

```json
// package.json
{
  "scripts": {
    "preinstall": "npx npm-audit-action --audit-level=high || (echo 'Säkerhetsbrister hittade — kör npm audit för detaljer' && exit 1)",
    "postinstall": "npm audit --audit-level=high"
  }
}
```

#### 3. Socket.dev för beteendeanalys

Installera Socket.dev GitHub App på repot. Den analyserar:
- Nya beroenden vid PR
- Typosquatting
- Obfuskerad kod
- Oförklarad nätverksåtkomst
- Installationsskript

#### 4. npm provenance (Sigstore)

Verifiera att paket är byggda från publika repon:

```bash
npm audit signatures
```

Lägg till i CI-pipeline.

#### 5. Overrides för transitiva sårbarheter

```json
// package.json
{
  "overrides": {
    "semver": ">=7.5.4"
  }
}
```

Används när ett direkt beroende drar in en sårbar transitiv version. Dokumentera
varje override med kommentar i `docs/SECURITY-OVERRIDES.md`.

#### 6. Beroendemininering

**Strategi:** Maximalt 30 direkta beroenden i `dependencies`. Varje nytt paket
kräver motivering:
- Hur många GitHub-stjärnor? (>1000)
- Senaste commit? (<3 månader)
- Hur många maintainers? (>1)
- Finns alternativ i standardbiblioteket?

**Nuvarande kärnberoenden (målbild):**

```
react, react-dom
@tanstack/react-router, @tanstack/react-query, @tanstack/react-table
react-aria-components
@supabase/supabase-js
tailwindcss, class-variance-authority, clsx, tailwind-merge
motion, lucide-react
zod, @t3-oss/env-core
```

#### 7. Granska alla nya beroenden innan installation

Innan `npm install <nytt-paket>`:
1. Kontrollera GitHub-repot: stjärnor, senaste commit, öppna issues
2. Kör `npx socket-npm info <paket>` (om Socket installerat)
3. Kontrollera `npm audit` efter installation
4. Dokumentera motivering i commit-meddelande

---

## 5. OWASP-checklista för SPA + Supabase

### Relevanta OWASP Top 10 för denna stack

| # | OWASP-kategori | Risknivå | Status | Åtgärd |
|---|----------------|----------|--------|--------|
| A01 | Broken Access Control | **Hög** | **Implementerat (M1+M2)** | `requireUser(req, corsHeaders)` i `supabase/functions/_shared/auth.ts` extraherar JWT, verifierar mot Supabase Auth, returnerar `AuthContext \| Response`. Wired i alla 4 datafunktioner + `create-admin-user`. 20 deny-path-tester per funktion. Se §6. |
| A02 | Cryptographic Failures | Låg | OK | Supabase hanterar JWT-signering. HTTPS via Vercel. Inga hemligheter i klientkod |
| A03 | Injection | **Medel** | Delvis | Supabase Edge Functions MÅSTE använda parameteriserade frågor. Validera alla inputs med Zod. `DOMPurify` för HTML-rendering |
| A04 | Insecure Design | Låg | OK | Scenariodriven utveckling, DataSourceAdapter-pattern, auth guard på alla routes |
| A05 | Security Misconfiguration | **Medel** | **Delvis (M3 klar, CSP defer:ad)** | CORS implementerat via `corsHeadersFor(req)` per-request, env-driven allowlist (M3). CSP Vite-plugin medvetet defer:ad till Fas 7 (ADR i P3). Env-validering klar via `@t3-oss/env-core` (Fas 0). Se §6. |
| A06 | Vulnerable Components | **Medel** | Delvis | npm audit, men inga automatiserade kontroller i CI. Se paragraf 4 |
| A07 | Auth Failures | **Hög** | Delvis | Supabase PKCE för OAuth. Se paragraf 8. Session-timeout, token refresh |
| A08 | Data Integrity Failures | Låg | Delvis | npm provenance ej konfigurerat. Se paragraf 4.4 |
| A09 | Logging & Monitoring | **Medel** | **Implementerat (M7)** | Structured JSON-loggning i alla Edge Functions med `{level, requestId, errorName, stack, function, method, callerUserId}`. `isOperationalError`-klassning skyddar Sentry-quota mot 4xx-spam. Sentry-init i `src/observability/sentry.ts` + `initSentry()` i `main.tsx`. Se §6. |
| A10 | SSRF | Låg | OK | Inte relevant — SPA har inga server-side requests. Edge Functions: validera URL-inputs |

### Detaljerade åtgärder för hög-risk

#### A01: Broken Access Control

```typescript
// supabase/functions/get-events/index.ts — MÅSTE-mönster

import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  // 1. Hämta Authorization-header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 2. Verifiera token mot Supabase Auth
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 3. Nu är användaren verifierad — hämta data
  // ...
});
```

#### A03: Injection — Zod-validering vid systemgränser

```typescript
// src/domain/schemas/event.schema.ts
import { z } from 'zod';

export const EventSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: z.string().datetime(),
  status: z.enum(['upcoming', 'completed', 'cancelled']),
  maxParticipants: z.number().int().positive().optional(),
});

export type Event = z.infer<typeof EventSchema>;

// I AirtableAdapter:
const rawData = await response.json();
const events = z.array(EventSchema).parse(rawData.records);
// Kastar ZodError om Airtable-schemat ändrats — snabb felupptäckt
```

#### A05: CORS på Edge Functions

```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://admin.miranon.se',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// I varje Edge Function:
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders });
}
```

**Kritiskt:** `Access-Control-Allow-Origin` ska ALDRIG vara `*` i produktion.
Bara appens egen domän tillåts.

---

## 6. Fas A — etablerade arkitekturmönster (2026-05-04)

Fas A levererade 8 milstolpar (M1–M8) som stänger hela exponeringen från Code-verifieringen 2026-04-29. Mönstren nedan ska refereras i fas-prompterna i Fas 5.5+ och alla framtida Edge Function-utvecklingar.

Detaljer: `tasks/sessions/archive/2026-05/2026-05-04-security-hardening.md` (frusen efter slutsummering).

### 6.1 Operations-baserat write-API

Klient skickar `{operationKey, recordId, fields}` istället för `{tableId, ...}`. Operations-registret (`supabase/functions/_shared/field-allowlists.ts`) är den enda sanningskällan för "vad får skrivas av vem."

- Deny-by-default vid okänd `operationKey` eller fält utanför `allowedFields[]`.
- K9-respekt: domännamn (`'registration.set-status'`) i klient-API, table-IDs i Edge Function-implementationen.
- Strukturerad för K7-utökning till `{tenant_id, operation_scope}` post-S-track utan API-ändring.

Korsreferens: `STATE-STRATEGY.md §8` för klient-sidans optimistic-mutation-mönster.

### 6.2 `corsHeadersFor(req)` per request

CORS-headers genereras per-request baserat på Origin matchat mot env-allowlist (`CORS_ALLOWED_ORIGINS`). Inte en global konstant.

- Browser-CORS (preflight 403 på otillåten origin) särskiljs från server-till-server (no Origin → tillåts genom).
- Skalar till tenant-baserade allowlists post-S-track utan refaktorering.

### 6.3 `AuthContext | Response` discriminated union

Auth-helpers returnerar antingen success-payload eller färdig 401-Response. Caller-mönster:

```ts
const auth = await requireUser(req, corsHeaders);
if (auth instanceof Response) return auth;
const { user } = auth;
```

Generaliserbart för alla validation-helpers — inte bara auth.

### 6.4 Deny-by-default genomgående

Tom config (operations-allowlist, `ADMIN_EMAILS`, `CORS_ALLOWED_ORIGINS`) → allt nekas. Aldrig "allow om vi inte vet." Säkrast vid konfigurations-glitches.

### 6.5 Generic external errors + `requestId`

Klient ser `{error: 'Internal error', requestId}` för 5xx. Server-loggen har full stack. `requestId` (UUID v4) länkar klient-fel till server-stack. Operationella 4xx (401/403/400) behåller specifika error-meddelanden för debugging.

### 6.6 `isOperationalError`-klassning

4xx-HttpError loggas på info-nivå (ingen Sentry-event), 5xx på error-nivå (Sentry-event skapas). Skyddar Sentry-quota mot triviala 4xx-spam.

### 6.7 Structured JSON-loggning

`console.error(JSON.stringify({level, requestId, errorName, errorMessage, stack, function, method, callerUserId}))`. Sökbart i Supabase Logs på `requestId`. Inte fri text.

### 6.8 INVARIANT round-trip-mönster för säkerhetshelpers

För säkerhetskritiska transformationer (eskapering, parsing, klassning) ska det finnas ett atomärt round-trip-test som bevisar att `transform → inverse` återger exakt input. Skyddar mot hela klasser av attacker, inte bara de vi tänkt på.

Tillämpat i:
- `escapeFormulaValue` (M5) — escape → unescape returnerar exakt input för alla edge-cases (`"`, `'`, `\`, `(`, `)`, `,`, nyrad, kontrolltecken).
- `classify401Body` (M2) — atomär status + body-verifiering i tester. Future-bug-skydd: 200 med felmeddelande kastar.

### 6.9 Fas A-milstolpsöversikt

| Milstolpe | Stänger | Mönster införs |
|---|---|---|
| M1 | Auth-grund | §6.3 (`AuthContext \| Response`) |
| M2 | Ingen `requireUser`-gate i datafunktioner | §6.3 + §6.8 (`classify401Body` round-trip) |
| M3 | Wildcard CORS | §6.2 (`corsHeadersFor(req)`) |
| M4 | `update-record` saknar fält/operations-allowlist | §6.1 + §6.4 |
| M5 | Formula-injektion | §6.4 + §6.8 (`escapeFormulaValue` round-trip) |
| M6 | `create-admin-user` saknar caller-verifiering | §6.4 + ADMIN_EMAILS-allowlist |
| M7 | Råa felmeddelanden + Sentry oinitierad | §6.5 + §6.6 + §6.7 |
| M8 | `config.toml` saknades | Per-funktion `verify_jwt`-kontroll |

Hela exponeringen från Code-verifieringen 2026-04-29 stängd. 113 tester (110 + 3 skipped för Fas 5.5-aktivering). Bundle 244 → 324 kB (+80 kB Sentry SDK).

---

## 7. React 19-specifik granskning

### React2Shell (CVE-2025-55182)

**Vad:** En sårbarhet i React 19:s Server Actions som tillät fjärrkodskörning
(RCE) via manipulerade formulärdata. Exponerade 644 000+ domäner.

**Vektor:** Angriparen skickar manipulerade `FormData` till en Server Action
som deserialiserar input utan validering.

**Påverkar Miranon Media Admin?** **Nej, men med förbehåll:**

- Appen är en Vite SPA — inga Server Actions, inget `"use server"`.
- React 19:s Server Actions är en Next.js App Router / React Server Components-
  funktion som inte existerar i en ren Vite-build.
- **Förbehåll:** Om framtida migration till Next.js genomförs, blir detta kritiskt.

**Verifieringsåtgärd (Fas 7):**

```bash
# Verifiera att inga Server Actions existerar i kodbasen
grep -r '"use server"' src/ && echo "VARNING: Server Actions hittade" || echo "OK: Inga Server Actions"
```

### Allmänna React 19-säkerhetshänsyn

| Område | Risk | Åtgärd |
|--------|------|--------|
| `dangerouslySetInnerHTML` | Hög (om använd) | Greppa kodbasen. Alla förekomster MÅSTE använda DOMPurify + Trusted Types-policy |
| `ref`-callbacks | Låg | React 19 stöder cleanup-funktioner i ref callbacks — inga minnesläckor |
| Hydration mismatch | Ej relevant | Ingen SSR — ingen hydration |
| `useFormStatus` / `useActionState` | Låg | Används utan Server Actions. Ingen sårbarhet |
| React DevTools i prod | Låg | Inaktivera i produktion via build-konfiguration |

### dangerouslySetInnerHTML — policy

**Regel:** `dangerouslySetInnerHTML` är FÖRBJUDET utan explicit godkännande.

Om det måste användas (t.ex. rendering av rik text från Airtable):

```tsx
import DOMPurify from 'dompurify';

function SafeHTML({ html }: { html: string }) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });

  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

---

## 8. Auth-strategi

### Supabase Auth — sessionflöde

```
Lotta öppnar appen
  |
  v
AuthProvider kontrollerar session
  |
  +--> Session finns + giltig JWT --> Inloggad
  |
  +--> Session finns + JWT utgången --> supabase.auth.refreshSession()
  |        |
  |        +--> Lyckas --> Ny JWT --> Inloggad
  |        +--> Misslyckas --> Redirect till /login
  |
  +--> Ingen session --> Redirect till /login
```

### JWT-flöde i detalj

```typescript
// src/providers/auth-provider.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../data/config/supabase-client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContext {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hämta initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Lyssna på auth-ändringar (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ...
}
```

### PKCE för OAuth

Supabase använder PKCE (Proof Key for Code Exchange) automatiskt för alla
OAuth-flöden. Detta förhindrar authorization code interception-attacker.

**Vad PKCE gör:**
1. Klienten genererar en `code_verifier` (slumpsträng) och en `code_challenge` (SHA-256-hash).
2. `code_challenge` skickas med i auth-request.
3. Servern returnerar en authorization code.
4. Klienten skickar `code_verifier` + authorization code för att hämta token.
5. Servern verifierar att `code_verifier` matchar `code_challenge`.

**Konfiguration:** Supabase aktiverar PKCE per default. Ingen manuell konfiguration
krävs för `@supabase/supabase-js` v2.

### Token refresh

Supabase refreshar JWT automatiskt när:
- `supabase.auth.getSession()` anropas och JWT är utgången
- `onAuthStateChange` triggas med event `TOKEN_REFRESHED`

**JWT-livslängd:** Supabase default är 3600 sekunder (1 timme).

**Refresh token:** Har längre livslängd (standardmässigt 1 vecka). Sparas i
`localStorage` under `sb-{project-ref}-auth-token`.

### Session-timeout-beteende

```typescript
// I auth guard (TanStack Router beforeLoad)
export const authenticatedRoute = createRoute({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: '/login' });
    }
  },
});
```

### Offline auth

**Problem:** Lotta är på event-plats utan stabil uppkoppling. Appen kräver
auth-check vid varje navigering --> blank skärm.

**Lösning:** Cachad auth-session med TTL.

```typescript
// src/lib/offline-auth.ts
const AUTH_CACHE_KEY = 'miranon-auth-cache';
const AUTH_CACHE_TTL = 60 * 60 * 1000; // 1 timme

interface CachedAuth {
  userId: string;
  email: string;
  cachedAt: number;
}

export function cacheAuthSession(user: { id: string; email?: string }) {
  const cache: CachedAuth = {
    userId: user.id,
    email: user.email ?? '',
    cachedAt: Date.now(),
  };
  localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cache));
}

export function getCachedAuth(): CachedAuth | null {
  const raw = localStorage.getItem(AUTH_CACHE_KEY);
  if (!raw) return null;

  const cache: CachedAuth = JSON.parse(raw);
  const age = Date.now() - cache.cachedAt;

  if (age > AUTH_CACHE_TTL) {
    localStorage.removeItem(AUTH_CACHE_KEY);
    return null;
  }

  return cache;
}

export function clearCachedAuth() {
  localStorage.removeItem(AUTH_CACHE_KEY);
}
```

**Beteende när TTL går ut offline:**
1. Appen visar senast cachad data (read-only).
2. Mutationer köas lokalt (Background Sync).
3. En diskret banner visas: "Du är offline. Senast synkad: 08:14."
4. När uppkoppling återupprättas: auth refreshas automatiskt, köade mutationer
   skickas, bannern försvinner.

### Passkey-roadmap (Fas 8)

**Varför passkeys:** Lotta ska aldrig behöva komma ihåg ett lösenord.
FaceID/TouchID och sedan inne. Inget lösenord, inget "jag glömde".

**Supabase WebAuthn-status (2026):** Experimentellt stöd via
`supabase.auth.signInWithPasskey()`. Inte produktionsredo för alla providers.

**SimpleWebAuthn-plan:**

```bash
npm install @simplewebauthn/browser @simplewebauthn/server
```

**Migrationväg lösenord till passkey:**

| Steg | Vad | När |
|------|-----|-----|
| 1 | Lotta loggar in med lösenord (som nu) | Fas 2 |
| 2 | "Inställningar: Lägg till passkey" erbjuds i Mer-fliken | Fas 8 |
| 3 | Lotta registrerar passkey via FaceID/TouchID | Fas 8 |
| 4 | Nästa inloggning: "Logga in med passkey" visas som förstaval | Fas 8 |
| 5 | Lösenord behålls som fallback | Permanent |

**Edge Function för passkey-registrering:**

```typescript
// supabase/functions/register-passkey/index.ts (utkast)
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';

// 1. Generera registreringsalternativ
const options = await generateRegistrationOptions({
  rpName: 'Miranon Media Admin',
  rpID: 'admin.miranon.se',
  userID: user.id,
  userName: user.email,
  attestationType: 'none', // Enklast — ingen attestering krävs
  authenticatorSelection: {
    residentKey: 'preferred',
    userVerification: 'preferred',
  },
});

// 2. Skicka till klienten --> klienten anropar navigator.credentials.create()
// 3. Klienten skickar tillbaka --> verifyRegistrationResponse()
// 4. Spara credential i Supabase-tabell
```

---

## 9. Bilaga: Säkerhetschecklista

Använd denna checklista i Fas 7 för att verifiera all säkerhetsinfrastruktur.

### CSP och headers

- [ ] CSP Level 3 implementerad med nonce per request
- [ ] CSP testad i report-only-läge före enforcing
- [ ] `strict-dynamic` verifierat med Vites chunk-laddning
- [ ] Alla säkerhetsheaders verifierade via securityheaders.com (mål: A+)
- [ ] HSTS aktiv med `includeSubDomains`
- [ ] `X-Frame-Options: DENY` satt (clickjacking-skydd)
- [ ] `Permissions-Policy` blockerar oanvända webbläsar-API:er

### Trusted Types

- [ ] Trusted Types i report-only-läge (Fas 3)
- [ ] DOMPurify-policy skapad och testad
- [ ] Default-policy fångar oväntade DOM-skrivningar
- [ ] Alla `dangerouslySetInnerHTML`-förekomster inventerade och sanerande
- [ ] Trusted Types i enforcing-läge (Fas 7)

### Supply chain

- [ ] `package-lock.json` committad
- [ ] `npm ci` används i CI (aldrig `npm install`)
- [ ] `npm audit --audit-level=high` returnerar 0 sårbarheter
- [ ] `npm audit signatures` — alla paket har giltig provenance
- [ ] Socket.dev GitHub App installerad på repot
- [ ] Inga `overrides` utan dokumentation i `docs/SECURITY-OVERRIDES.md`
- [ ] Max 30 direkta beroenden i `dependencies`

### Auth

- [ ] Supabase PKCE aktivt för alla auth-flöden
- [ ] Session-token (inte anon key) används i alla Edge Function-anrop
- [ ] Token refresh fungerar transparent för Lotta
- [ ] Offline auth-cache med 1h TTL implementerad
- [ ] Auth guard på alla skyddade routes (`_authenticated`)
- [ ] Logout rensar alla lokala tokens och cache

### React 19

- [ ] `grep -r '"use server"' src/` returnerar 0 träffar
- [ ] Inga förekomster av `dangerouslySetInnerHTML` utan DOMPurify
- [ ] React DevTools inaktiverat i produktionsbuild
- [ ] Inga kända React 19 CVE:er påverkar SPA-konfigurationen

### Supabase

- [ ] RLS-policies aktiva på alla tabeller
- [ ] Edge Functions: alla inputs validerade med Zod
- [ ] Edge Functions: `supabase.auth.getUser()` anropas före dataåtkomst
- [ ] Edge Functions: CORS konfigurerat (bara tillåt appens domän)
- [ ] Inga hårdkodade hemligheter i Edge Functions (alla via `Deno.env.get()`)
- [ ] Airtable API-nyckel finns BARA i Edge Function-miljön (aldrig i klientkod)

### Miljövariabler

- [ ] `.env.local` finns i `.gitignore`
- [ ] Inga hårdkodade hemligheter i klientkod (grep: `sk_`, `key_`, `secret`)
- [ ] `VITE_SUPABASE_URL` och `VITE_SUPABASE_ANON_KEY` validerade med `@t3-oss/env-core`
- [ ] Alla `VITE_`-prefixade variabler är godkända att exponera till klienten
- [ ] Supabase anon key är publik (by design) — men session-token används för API-anrop

### Nätverkssäkerhet

- [ ] Alla API-anrop går över HTTPS
- [ ] CORS på Edge Functions begränsar `Access-Control-Allow-Origin`
- [ ] Inga mixed content-varningar i konsolen
- [ ] WebSocket-anslutning till Supabase Realtime använder `wss://`
- [ ] DNS pekar på Cloudflare (DDoS-skydd)

### Testning

- [ ] Playwright-test: verifiera att CSP blockerar inline-skript
- [ ] Playwright-test: verifiera auth guard (oautentiserad --> redirect till /login)
- [ ] `npm audit` kör i CI-pipeline
- [ ] Manuell penetrationstest: XSS, CSRF, auth bypass (minst 1 gång före lansering)
- [ ] securityheaders.com-resultat dokumenterat (screenshot i `docs/audits/`)

---

*Senast uppdaterad: 2026-05-04 (P2 — Fas A-införlivande)*
*Underlag: gap-analysis.md paragraf 3 + 5, byggplan-direktiv.md §8.5.4–§8.5.5, tasks/sessions/archive/2026-05/2026-05-04-security-hardening.md*
*Nästa review: efter Fas 5.5 (operations-baserade write-flow etablerade i UI)*
