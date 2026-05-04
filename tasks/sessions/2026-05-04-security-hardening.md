# Säkerhetshardening — Fas A arbetsdokument

*Datum: 2026-05-04 | Verifierat mot HEAD `d138989` (main, clean) | Författare: Claude Code (Opus 4.7)*
*Plan: Marcus + Claude Chats steg-för-steg-plan 2026-05-04*
*Sanningskälla: `~/Repon/miranon-media-os/docs/react-migration/SECURITY-SPEC.md`*

---

## Status nu

**STOPPAD vid Gate A1.** Detta dokument levererar RAPPORTERA + PLANERA. Implementation startar inte förrän Marcus svarat på frågorna i §C.

- Branch: `main`, clean tree
- HEAD: `d138989` ("docs(research): Sidospår — Odoo-validering av S-track event-domän")
- Inga ändringar gjorda i kod, schema, Airtable, npm-paket eller config

---

## §A — Aktuellt läge per fynd (verifierat mot HEAD `d138989`)

Varje rad nedan är verifierad mot kod via `Read` eller `Bash`. Inga hypoteser. Källa anges som filsökväg + radnummer.

### A1. Wildcard CORS — BEKRÄFTAD

[supabase/functions/_shared/cors.ts:1-5](supabase/functions/_shared/cors.ts#L1-L5):
```ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
};
```

SECURITY-SPEC §5 A05 (rad 460): *"`Access-Control-Allow-Origin` ska ALDRIG vara `*` i produktion."* — bryts.

### A2. Ingen `requireUser`/JWT-extrahering i någon datafunktion — BEKRÄFTAD

`grep -rn "requireUser\|getUser\|getSession\|auth\." supabase/functions/`:
- Endast en träff: [supabase/functions/create-admin-user/index.ts:24](supabase/functions/create-admin-user/index.ts#L24) — och den är `supabaseAdmin.auth.admin.createUser()`, inte caller-verifiering.

Ingen av `get-events`, `get-persons`, `get-registrations`, `update-record`, `create-admin-user` extraherar caller-identitet.

SECURITY-SPEC §5 A01 (rad 393–419) visar exakt det mönster som krävs (Authorization-header → `supabase.auth.getUser()` → 401 vid fel). **Inte implementerat.**

### A3. Anon-key-fallback i klient — BEKRÄFTAD

[src/data/config/supabase-client.ts:16-22](src/data/config/supabase-client.ts#L16-L22):
```ts
async function getAuthHeader(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? env.VITE_SUPABASE_ANON_KEY;
  return `Bearer ${token}`;
}
```

Klienten faller tyst tillbaka till anon-key om session saknas. I kombination med A2 = full skrivåtkomst för alla med anon-key (publik per definition).

### A4. `update-record` saknar fält- och operations-allowlist — BEKRÄFTAD

[supabase/functions/update-record/index.ts:5-24](supabase/functions/update-record/index.ts#L5-L24): 18 tabell-IDs på allowlist.
[supabase/functions/update-record/index.ts:38](supabase/functions/update-record/index.ts#L38): `const { tableId, recordId, fields } = await req.json()` — `fields` skickas direkt vidare till Airtable PATCH utan fält-validering eller operations-koncept.

Alla auth'd (idag = alla med anon-key) kan skriva på alla fält i 18 produktionstabeller, inkl. `Status`, `Är aktiv`, betalstatus, `Anteckningar`, automation-trigger-fält.

### A5. Formula-injektion i `get-registrations` och `get-persons` — BEKRÄFTAD

[supabase/functions/get-registrations/index.ts:51-60](supabase/functions/get-registrations/index.ts#L51-L60):
```ts
if (eventId) filters.push(`FIND("${eventId}", ARRAYJOIN({Event}))`);
if (status)  filters.push(`{Status} = "${status}"`);
if (flagga)  filters.push(`{Flagga} = "${flagga}"`);
```
Tre query-parametrar interpoleras **utan eskapering** in i Airtable filterByFormula.

[supabase/functions/get-persons/index.ts:55](supabase/functions/get-persons/index.ts#L55):
```ts
const term = search.replace(/"/g, '\\"');
```
Eskaperar bara `"`, inte `\`, `(`, `)`, `,`, nyrad eller formel-funktioner. Otillräckligt.

### A6. `create-admin-user` saknar caller-verifiering helt — BEKRÄFTAD

[supabase/functions/create-admin-user/index.ts:8-16](supabase/functions/create-admin-user/index.ts#L8-L16): Funktionen tar emot `email` och `password`, skapar admin-user via `service_role`-nyckel, **utan att verifiera vem som ringer**.

`supabase/config.toml` saknas i repo:t (`ls supabase/` → bara `functions/`). Default `verify_jwt`-beteende vid deploy är odefinierat. Även med default `verify_jwt=true` accepteras anon-key som "valid JWT" eftersom den är ett JWT signerat av Supabase med `role: anon`.

[src/env.ts:14](src/env.ts#L14): `VITE_SUPABASE_ANON_KEY` exponeras till klienten — alltså publik.

**Konsekvens:** Om denna funktion deployas idag = vem som helst kan skapa admins.

### A7. Alla fem Edge Functions läcker råa felmeddelanden — BEKRÄFTAD

Mönstret återupprepas i alla fem index.ts-filer:
```ts
return new Response(JSON.stringify({ error: (error as Error).message }), {
  status: 500, ...
});
```
- [supabase/functions/get-events/index.ts:53](supabase/functions/get-events/index.ts#L53)
- [supabase/functions/get-persons/index.ts:77](supabase/functions/get-persons/index.ts#L77)
- [supabase/functions/get-registrations/index.ts:77](supabase/functions/get-registrations/index.ts#L77)
- [supabase/functions/update-record/index.ts:73](supabase/functions/update-record/index.ts#L73)
- [supabase/functions/create-admin-user/index.ts:41](supabase/functions/create-admin-user/index.ts#L41)

Underliggande Airtable-fel ([supabase/functions/_shared/airtable-client.ts:77, 111](supabase/functions/_shared/airtable-client.ts#L77)): `throw new Error(\`Airtable ${res.status}: ${body}\`)` — inkluderar Airtable response-body inkl. ev. token-fragment.

### A8. Sentry installerat men aldrig initierat — BEKRÄFTAD

[package.json:20](package.json#L20): `"@sentry/react": "^10.48.0"`.

`grep -rn "Sentry" src/`: **0 träffar** för faktisk init. Endast 4 referenser i [src/lib/report-web-vitals.ts](src/lib/report-web-vitals.ts) och alla är "TODO Fas 7"-kommentarer. Paid-for-but-unused.

### A9. `supabase/config.toml` saknas — BEKRÄFTAD

`ls supabase/` returnerar bara `functions`. Ingen `config.toml`. Default-konfig vid deploy varierar mellan Supabase CLI-versioner — `verify_jwt`-status per funktion är inte committad i repot.

### A10. PostCSS moderate vulnerability — BEKRÄFTAD

`npm audit`:
```
postcss  <8.5.10
Severity: moderate
PostCSS has XSS via Unescaped </style> in its CSS Stringify Output
fix available via `npm audit fix`
1 moderate severity vulnerability
```
Trivialt fixbart, men inte i scope för säkerhets-hardening (M1–M8). Föreslås som separat sidofix om Marcus vill ta det samtidigt.

### A11. Vite saknar säkerhetsplugin — BEKRÄFTAD (men medvetet uppskjutet)

[vite.config.ts:10](vite.config.ts#L10): `// [GA] Fas 7: security headers-plugin med CSP-nonce läggs till här.` — medveten avvikelse från SECURITY-SPEC §1 som säger Fas 0. Saknar ADR. Inte i scope för Fas A enligt Marcus + Claude Chats plan, men noteras.

---

### Sammanfattning §A

Alla 8 fynd från Code-verifieringen 2026-04-29 står oförändrade i HEAD `d138989`. Inga regressioner, inga improvements. Tillägg från min läsning:

- **A9 (config.toml saknas)** är inte explicit i Code-verifieringen som egen punkt, men implicerat i §B "create-admin-user". Lyfter den som egen rad eftersom M8 hänger på den.
- **A10 (PostCSS audit)** står oförändrad sedan Codex 2026-04-28. Inte M1–M8-scope.
- **A11 (Vite CSP-plugin)** står oförändrad. Inte Fas A-scope (Fas 7-arbete).

---

## §B — Föreslagna milstolpar M1–M8

Alla M1–M8 är *säkert-idag*-arbete enligt 06a Del F + K6/K7 i datamodell-research-projektet: ingen tenant-abstraktion, inga `integration_sources`/`service_clients`-konstrukt, ingen smyg-implementation av S-track-design. Helpers struktureras så de kan utökas post-S-track utan refaktorering.

### M1 — `_shared/auth.ts` med `requireUser(req)`

| Fält | Värde |
|---|---|
| Estimat | 2 h |
| Påverkade filer | **NY:** `supabase/functions/_shared/auth.ts`. Inga befintliga filer ändras. |
| Beroenden | Ingen ny env-var (använder befintliga `SUPABASE_URL` + `SUPABASE_ANON_KEY` från Supabase-runtime). |
| Definition of Done | (a) Helper exporterar `requireUser(req): Promise<{ user }>` som kastar 401-Response vid (i) saknad header (ii) ogiltig JWT (iii) `role: anon` JWT. (b) Tre Playwright-tester (anonym/ogiltig/anon-key) returnerar 401 mot en testnyttjande funktion. |
| K7-respekt | Returvärde idag är `{ user }`. Strukturera så framtida utökning till `{ user, tenant_id, memberships }` är icke-breaking. |

### M2 — Lägg `requireUser` först i alla 4 datafunktioner

| Fält | Värde |
|---|---|
| Estimat | 2 h |
| Påverkade filer | `supabase/functions/get-events/index.ts`, `get-persons/index.ts`, `get-registrations/index.ts`, `update-record/index.ts`. (`create-admin-user` hanteras separat i M6.) |
| Beroenden | M1 klar. |
| Definition of Done | (a) Varje funktion anropar `requireUser(req)` direkt efter `handleCors`. (b) `console.log` i `update-record` (rad 62) inkluderar `caller_user_id=${user.id}`. (c) Fyra deny-path-tester per funktion (anonym → 401, ogiltig JWT → 401, anon-key → 401, giltig user-JWT → 200). |
| K7-respekt | Ingen tenant-koppling. Bara user-id loggas. |

### M3 — `_shared/cors.ts` v2 med origin-allowlist

| Fält | Värde |
|---|---|
| Estimat | 1 h |
| Påverkade filer | `supabase/functions/_shared/cors.ts`. |
| Beroenden | Marcus beslut på origin-allowlist (Gate A1 fråga 3). |
| Definition of Done | (a) `corsHeaders` blir en funktion `buildCorsHeaders(origin: string \| null)` som returnerar `Access-Control-Allow-Origin: ${origin}` om origin är på allowlist, annars utelämnar headern (vilket gör att browsern blockerar). (b) `handleCors` returnerar 403 om origin saknas/otillåten på preflight. (c) Allowlist hämtas från `Deno.env.get('CORS_ALLOWED_ORIGINS')` (komma-separerad). (d) Två Playwright-tester (tillåten origin → 200, otillåten origin → 403). |
| K7-respekt | Env-driven, inte tenant-driven. När `tenants.tenant_key` finns kan listan flyttas dit utan API-ändring. |

### M4 — Fält- och operations-allowlist i `update-record`

| Fält | Värde |
|---|---|
| Estimat | 4 h |
| Påverkade filer | **NY:** `supabase/functions/_shared/field-allowlists.ts`. Ändrad: `supabase/functions/update-record/index.ts`. |
| Beroenden | Marcus beslut på första uppsättningen operations + fält per tabell. Förslag i Gate A1 fråga 6. |
| Definition of Done | (a) Helper exporterar `getOperation(operationKey: string): { tableId, allowedFields[] }` eller `null`. (b) `update-record` tar emot `{ operationKey, recordId, fields }` istället för `{ tableId, recordId, fields }`. (c) Avvisar 400 om `operationKey` är okänd, eller om `fields` innehåller nyckel utanför `allowedFields[]`. (d) Klient-API i `AirtableAdapter` uppdateras till operations-baserad signatur. (e) Fyra deny-path-tester (okänd operation → 400, fält utanför allowlist → 400, korrekt → 200, recordId utan `rec`-prefix → 400 [befintligt beteende]). |
| K7-respekt | Hårdkodad i `field-allowlists.ts` med kommentar "ska migreras till `integration_source_configs.config_values.write_allowlist` post-S-track". |
| K9-respekt | Operations använder domännamn (`'registration.set-status'`), inte Airtable table-IDs. Kunskap om table-IDs lever kvar i helpern, inte i klient-API:t. |

### M5 — Eskapering av filterByFormula-input

| Fält | Värde |
|---|---|
| Estimat | 3 h |
| Påverkade filer | **NY:** `supabase/functions/_shared/airtable-filter.ts`. Ändrad: `get-registrations/index.ts`, `get-persons/index.ts`. |
| Beroenden | Inga. |
| Definition of Done | (a) Helper exporterar `escapeFormulaValue(s: string): string` som hanterar `"`, `'`, `\`, `(`, `)`, `,`, nyrad/CR, kontrolltecken. (b) Helper exporterar typade builders: `buildLinkedRecordFilter(field, recordId)`, `buildEqualsFilter(field, value)`. (c) Båda funktioner refaktoreras att använda buildern. (d) Fuzz-test i Playwright med 20 illvilliga inputs verifierar att resulting formula inte ändrar utvärderingen (t.ex. `") OR TRUE("` ska resultera i strikt-equals-jämförelse, inte tautologi). |
| K6-respekt | Filter-builder vet ingenting om source-koncept. Hanterar bara Airtable-formler. |

### M6 — Caller-verifiering i `create-admin-user`

| Fält | Värde |
|---|---|
| Estimat | 2 h (givet att M1 + M8 är klara) |
| Påverkade filer | `supabase/functions/create-admin-user/index.ts`. |
| Beroenden | M1 (`requireUser`), M8 (`config.toml`), Marcus beslut på admin-roll-listan (Gate A1 fråga 4). |
| Definition of Done | (a) `requireUser(req)` anropas. (b) Caller's email matchas mot `Deno.env.get('ADMIN_EMAILS')` (komma-separerad lista). Mismatch → 403. (c) `supabase/config.toml` har explicit `[functions.create-admin-user] verify_jwt = true`. (d) Tre deny-path-tester (anon-key → 403, user utan admin-email → 403, admin-email → 200). |
| K7-respekt | Hårdkodad email-lista i env. Kommentar: "ska flyttas till `tenant_memberships.role` post-S-track när 06b §A3 byggs". |

### M7 — Generisk felmodell + Sentry-init

| Fält | Värde |
|---|---|
| Estimat | 4 h |
| Påverkade filer | **NY:** `supabase/functions/_shared/errors.ts`, `src/observability/sentry.ts`. Ändrad: alla 5 funktioners catch-block, `src/main.tsx`. **Uppdaterad:** `docs/SECURITY-SPEC.md` (DSN-strategi). |
| Beroenden | Marcus beslut på Sentry-DSN-strategi (Gate A1 fråga 5). |
| Definition of Done | (a) `errors.ts` exporterar `mapErrorToResponse(error, requestId): Response` som loggar full stack via `console.error` (Edge Functions runtime → Supabase logs) + ev. Sentry-edge, returnerar `{ error: 'Internal error', requestId }`. (b) Alla fem catch-block byter till `mapErrorToResponse`. (c) `requestId` genereras per request via `crypto.randomUUID()` i en wrapper. (d) `src/observability/sentry.ts` exporterar `initSentry()`, anropas från `src/main.tsx` före React-mount. (e) Manuellt test: trigga ett kontrollerat fel (t.ex. ogiltigt `recordId`-format), verifiera att klient ser `{ error: 'Internal error', requestId: 'uuid' }` utan stack-detaljer, och att server-loggen har full stack med samma `requestId`. |
| K7-respekt | Felmodellen struktureras så att framtida `audit_log`-skrivning (06b §C1) kan ta över utan API-ändring mot klient. |

### M8 — `supabase/config.toml` committad med `verify_jwt`-konfig

| Fält | Värde |
|---|---|
| Estimat | 1 h |
| Påverkade filer | **NY:** `supabase/config.toml`. |
| Beroenden | Inga (men M6 förlitar sig på den). |
| Definition of Done | (a) `config.toml` committad med explicit `[functions.<name>] verify_jwt = true` per funktion. (b) Deploy till staging verifierar att config.toml respekteras (test: anrop utan Authorization-header mot någon funktion → 401 från Supabase Gateway, inte 200). |
| K7-respekt | Inga tenant- eller subdomäns-konstrukt i config.toml. Bara `verify_jwt` per funktion. |

---

### Sammantagen estimat och ordning

| M | Tid | Blockeras av |
|---|---|---|
| M1 | 2 h | — |
| M2 | 2 h | M1 |
| M3 | 1 h | Marcus origin-allowlist |
| M4 | 4 h | Marcus operations + fält-listor |
| M5 | 3 h | — |
| M6 | 2 h | M1 + M8 + Marcus admin-emails |
| M7 | 4 h | Marcus Sentry-DSN |
| M8 | 1 h | — |

**Total: ~19 h** (ca 2,5 dagar koncentrerad utveckling, inkl. tester, exkl. Marcus verifieringspauser mellan milstolpar).

**Föreslagen körordning:** M1 → M2 → M8 → M6 → M3 → M4 → M5 → M7. Motiv:
- M1+M2 låser auth-grunden tidigt — alla efterföljande tester kan anta auth.
- M8 + M6 stänger den största exponeringen (`create-admin-user` på publik anon-key).
- M3 stänger CORS — klient kan fortfarande nå funktionerna via origin-spoof från curl, men en webbläsare-baserad XSS-attack kan inte längre rikta sig från godtycklig domän.
- M4 + M5 stramar åt write-pathen och read-pathen.
- M7 läggs sist eftersom den drar in alla tidigare felresponser i ett gemensamt mönster — billigare att migrera dem alla en gång än att skriva om i varje milstolpe.

---

## §C — Gate A1-svar (Marcus 2026-05-04)

Gate A1 passerad 2026-05-04. Alla svar nedan är Marcus ord verbatim där relevant.

### Fråga 1 — Är aktuellt läge i §A korrekt verifierat mot HEAD?

> "Ja. §A korrekt verifierat. A9-A11-tilläggen godkända med Code:s scoping."

### Fråga 2 — Är M1–M8-sekvensen rätt?

> "Ja. M1→M2→M8→M6→M3→M4→M5→M7 godkänd. Inga milstolpar saknas, inga ska tas bort."

### Fråga 3 — CORS origin-allowlist

> "CORS origin-allowlist:
> - Produktion: [admin.miranon.se]
> - Lokal dev: http://localhost:5173, http://localhost:4173
> - Preview och test-domäner läggs till vid behov"

Beslutad initial allowlist (env `CORS_ALLOWED_ORIGINS`, komma-separerad):
```
https://admin.miranon.se,http://localhost:5173,http://localhost:4173
```

### Fråga 4 — `create-admin-user`: vilken roll får skapa admins?

> "Admin-emails initialt:
> - marcus@h5gruppen.se
>
> Lagras i Deno.env.get('ADMIN_EMAILS') per förslag."

Beslutad initial admin-allowlist (env `ADMIN_EMAILS`):
```
marcus@h5gruppen.se
```

### Fråga 5 — Sentry-DSN

> "Klient-DSN (alternativ A). Standardmönster för SPA."

Beslut: `VITE_SENTRY_DSN` läggs till i `src/env.ts` som klient-exponerad variabel. Init i `src/main.tsx` före React-mount.

### Fråga 6 — Operations + fält-allowlist för `update-record`

> "8 operations godkända som utgångspunkt, MEN M4 ska starta med en discovery-fas:
>
> 1. Läs alla callers av AirtableAdapter.updateRecord i miranon-media-admin/src/.
> 2. Läs motsvarande skrivflöden i miranon-media-os/src/ (Vue-versionen där allt är implementerat).
> 3. Bygg empirisk lista över vad UI:t faktiskt anropar.
> 4. Jämför mot hypotes-listan. Presentera diff till Marcus.
> 5. Implementation startar först efter Marcus godkänt slutgiltig lista.
>
> Estimat M4 justeras från 4 h till ~5 h för att rymma discovery + diff-rapport."

**M4 uppdaterad estimat: 5 h.** M4 öppnar med en mini-Gate (Gate A4) där Marcus godkänner slutgiltig operations-lista efter discovery-rapport. Hypotes-listan (8 operations) är arbetshypotes, inte beslut.

### Fråga 7 — Scope

> "Scope rätt. Inget att lägga till/ta bort. PostCSS audit fix tas som separat sidofix när du har tid — inte i Fas A."

PostCSS audit fix är inte M1–M8-arbete. Tas separat när tid finns.

### Effekter på milstolpar

- M3: använder beslutade origin-allowlisten ovan
- M4: estimat 5 h, börjar med discovery (Gate A4)
- M6: använder beslutade admin-emails ovan
- M7: klient-DSN-mönster

**Total uppdaterad estimat: ~20 h** (M4 +1 h för discovery).

---

## §D — Guardrails som följs i denna runda

Från prompten:
- ✅ Inga MCP-anrop mot Airtable. Detta är kod-arbete.
- ✅ Inga ändringar i Airtable-basen.
- ✅ Inga ändringar i 06b/07-design.
- ✅ Inga pushes från Claude Code till `main`. Bara commits + rapport.
- ✅ Lessons.md uppdateras per fynd. UNIVERSAL-kandidater markeras `[UNIVERSAL]`.

Från CLAUDE.md (projekt + global):
- ✅ Verifierat varje hypotes mot HEAD via grep/Read före påstående.
- ✅ LÄS → RAPPORTERA → PLANERA → STOPP. Inga implementations-steg gjorda.
- ✅ Fullständiga sökvägar i alla filreferenser.

Från lessons (2026-04-28/29):
- ✅ Live-state vinner — alla §A-rader är verifierade mot kod, inte minne.
- ✅ K6 (klassning vid integrationskanten) — milstolparna blandar inte source-koncept med write-koncept.
- ✅ K7 (rekommendation ≠ beslut när gate öppen) — milstolparna föregriper inte tenant/integration_sources/service_clients-design.
- ✅ K8 (preserve aktivt) — alla helpers struktureras för utökning, inte unifiering.

---

## §E — Definition av Gate A1

Marcus svarar på Fråga 1–7 i §C. Innan Marcus svarat:

- ❌ Ingen kod skrivs eller ändras
- ❌ Inga commits görs
- ❌ Ingen ny session-start-prompt skrivs

När Marcus svarat:

1. Detta dokument uppdateras i §C med Marcus svar (citerat verbatim där relevant).
2. M1 startar. Mellan varje milstolpe: commit + push (Marcus pushar) + Marcus verifierar i staging + grönt CI → nästa milstolpe.
3. lessons.md uppdateras per fynd inom varje milstolpe.

---

*Slut på arbetsdokument vid Gate A1. Inga ytterligare ändringar görs förrän Marcus svarat.*

---

## §F — Milstolpe-logg

Kort logg per milstolpe. Spårbarhet: commits + DoD-uppfyllnad + avvikelser från §B-design.

### M1 — `requireUser`-helper (klar 2026-05-04)

**Commits:** `9490d8e` (Gate A1-doc), `6d84bb8` (M1-helper).

**Levererat:**
- `supabase/functions/_shared/auth.ts` — 103 rader. `requireUser(req, corsHeaders): Promise<AuthContext | Response>`. Discriminated union istället för throw (Marcus godkänd avvikelse).

**Verifiering:** tsc 0, biome 0, build 0. Playwright deferred till M2 (Marcus godkänd, men M2 DoD utökad så de tre deny-paths också körs direkt mot helpern via `_test_auth`).

**Inga avvikelser från §B-design utöver throw → discriminated union.**

### M2 — Wire requireUser i 4 datafunktioner + Playwright-tester (klar 2026-05-04)

**Commits:** Pågående (denna session).

**Levererat:**
- Wire i 4 funktioner: [get-events](supabase/functions/get-events/index.ts), [get-persons](supabase/functions/get-persons/index.ts), [get-registrations](supabase/functions/get-registrations/index.ts), [update-record](supabase/functions/update-record/index.ts). Alla anropar `requireUser` direkt efter `handleCors` (eller `405`-check i update-record). update-record:s `console.log` inkluderar nu `caller_user_id=${user.id}`.
- **NY:** [supabase/functions/_test_auth/index.ts](supabase/functions/_test_auth/index.ts) — minimal endpoint för isolerad helper-testning. Anropar bara `requireUser`, returnerar `{ ok, userId }` vid success.
- **NY:** Playwright-test-infrastruktur:
  - [playwright.config.ts](playwright.config.ts) — uppdaterad med `api`-projekt + `visual-desktop`/`visual-mobile`-projekt. testDir: `./tests`.
  - [tests/api/helpers.ts](tests/api/helpers.ts) — `getApiConfig()` skipper tester om TEST_*-env saknas. `getValidUserJWT()` loggar in test-user via Supabase Auth REST. `INVALID_JWT`-konstant för deny-test.
  - [tests/api/require-user.test.ts](tests/api/require-user.test.ts) — 4 tester direkt mot `_test_auth` (3 deny + 1 allow).
  - [tests/api/edge-functions.test.ts](tests/api/edge-functions.test.ts) — 16 tester (4 deny-paths × 4 funktioner). update-record:s allow-test väntar `!= 401` (4xx från senare validering är OK — poängen är att auth har passerat).
- **NY:** [.env.test.example](.env.test.example) — mall för test-env-vars.
- **Ändrad:** [.gitignore](.gitignore) — `!.env.test.example`-undantag så mallen committas.
- **Ändrad:** [package.json](package.json) — `test:visual` riktar mot `visual-*`-projekt; ny `test:api`-script.

**Verifiering (lokalt):**
- `npx tsc --noEmit` → 0
- `npx @biomejs/biome check .` → 0 (4 pre-existerande warnings i base.css; tester och config auto-fixade till format-konformitet)
- `npm run build` → 0 (244 kB bundle, oförändrad — supabase/+ tests/ påverkar inte src/-bundlen)

**Verifiering (staging — kräver Marcus):**
- Deploy `_test_auth` + de 4 ändrade funktionerna till staging Supabase
- Sätt `TEST_SUPABASE_URL`, `TEST_SUPABASE_ANON_KEY`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` i Marcus shell-env
- Kör `npm run test:api` → förväntat 20 tester gröna (4 i require-user.test + 16 i edge-functions.test)

**Avvikelser från §B-design:**
- `_test_auth` Edge Function lades till för att möta Marcus utökade DoD (isolerad helper-test). Detta tillkom inte i §B-original — bör städas bort eller markeras som "test-only" före produktionsdeploy. Föreslår att `supabase/config.toml` (M8) sätter `verify_jwt=false` på `_test_auth` eftersom den ÄR auth-testet.
- `playwright.config.ts` ändrade testDir-struktur (`./tests/visual` → `./tests` med projekt-specifika `testDir`). Existerande `tests/visual/`-mappen finns inte ännu så ingen migration krävdes.
- `package.json` `test:visual`-script smalnades till `--project=visual-desktop --project=visual-mobile` så det inte också drar in API-tester. Ny `test:api`-script.

**Notering om `_test_auth` säkerhet:** Endpointen exponerar bara `userId` för en redan auth'd user. Den utför inga sidoeffekter och läser ingen data. Risken vid att den lever i produktion är minimal, men M8 bör bestämma om den ska deployas eller exkluderas via `config.toml`.

#### M2-godkännande (Marcus 2026-05-04) + TODO till Fas 7

Marcus valde **alternativ A**: `_test_auth` (och alla `_test_*`-prefixade funktioner generellt) deployas ENDAST till staging-projektet, aldrig till produktion. Två konsekvenser:

**(a) Prod-deploy-procedur måste exkludera test-prefixade funktioner.**

> **TODO Fas 7 — `_test_*` får ALDRIG nå produktion.** När Fas 7-deploy-pipelinen byggs (Vercel/Supabase deploy-script eller CI-jobb), måste prod-deploy explicit filtrera bort funktioner med prefix `_test_` (eller motsvarande konvention). Lämpligast som ett deploy-script eller en allowlist i CI/deploy-flödet. Mekanism kan vara `supabase functions deploy --project-ref <prod>` med uttrycklig funktion-lista, eller en `.deployignore`-konvention.

**(b) M8 — `_test_auth` får `verify_jwt = false` i `config.toml`.**

`config.toml` är samma fil oavsett projekt — eftersom `_test_auth` aldrig deployas till prod blir `verify_jwt=false`-raden inert där. M8-implementationen ska:
1. Sätta `[functions._test_auth] verify_jwt = false` (annars dubbel auth-check som blockerar testet).
2. Sätta `[functions.<övriga>] verify_jwt = true` per funktion.
3. Lägga en kommentar i config.toml som hänvisar till TODO Fas 7 ovan.


