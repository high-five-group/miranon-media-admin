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

**Verifiering:** tsc 0, biome 0, build 0. Playwright deferred till M2 (Marcus godkänd, men M2 DoD utökad så de tre deny-paths också körs direkt mot helpern via `test-auth`).

**Inga avvikelser från §B-design utöver throw → discriminated union.**

### M2 — Wire requireUser i 4 datafunktioner + Playwright-tester (klar 2026-05-04)

**Commits:** Pågående (denna session).

**Levererat:**
- Wire i 4 funktioner: [get-events](supabase/functions/get-events/index.ts), [get-persons](supabase/functions/get-persons/index.ts), [get-registrations](supabase/functions/get-registrations/index.ts), [update-record](supabase/functions/update-record/index.ts). Alla anropar `requireUser` direkt efter `handleCors` (eller `405`-check i update-record). update-record:s `console.log` inkluderar nu `caller_user_id=${user.id}`.
- **NY:** [supabase/functions/test-auth/index.ts](supabase/functions/test-auth/index.ts) — minimal endpoint för isolerad helper-testning. Anropar bara `requireUser`, returnerar `{ ok, userId }` vid success. (Renamed från `_test_auth` 2026-05-04 — Supabase CLI accepterar inte underscore-prefix.)
- **NY:** Playwright-test-infrastruktur:
  - [playwright.config.ts](playwright.config.ts) — uppdaterad med `api`-projekt + `visual-desktop`/`visual-mobile`-projekt. testDir: `./tests`.
  - [tests/api/helpers.ts](tests/api/helpers.ts) — `getApiConfig()` skipper tester om TEST_*-env saknas. `getValidUserJWT()` loggar in test-user via Supabase Auth REST. `INVALID_JWT`-konstant för deny-test.
  - [tests/api/require-user.test.ts](tests/api/require-user.test.ts) — 4 tester direkt mot `test-auth` (3 deny + 1 allow).
  - [tests/api/edge-functions.test.ts](tests/api/edge-functions.test.ts) — 16 tester (4 deny-paths × 4 funktioner). update-record:s allow-test väntar `!= 401` (4xx från senare validering är OK — poängen är att auth har passerat).
- **NY:** [.env.test.example](.env.test.example) — mall för test-env-vars.
- **Ändrad:** [.gitignore](.gitignore) — `!.env.test.example`-undantag så mallen committas.
- **Ändrad:** [package.json](package.json) — `test:visual` riktar mot `visual-*`-projekt; ny `test:api`-script.

**Verifiering (lokalt):**
- `npx tsc --noEmit` → 0
- `npx @biomejs/biome check .` → 0 (4 pre-existerande warnings i base.css; tester och config auto-fixade till format-konformitet)
- `npm run build` → 0 (244 kB bundle, oförändrad — supabase/+ tests/ påverkar inte src/-bundlen)

**Verifiering (staging — kräver Marcus):**
- Deploy `test-auth` + de 4 ändrade funktionerna till staging Supabase
- Sätt `TEST_SUPABASE_URL`, `TEST_SUPABASE_ANON_KEY`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` i Marcus shell-env
- Kör `npm run test:api` → förväntat 20 tester gröna (4 i require-user.test + 16 i edge-functions.test)

**Avvikelser från §B-design:**
- `test-auth` Edge Function lades till för att möta Marcus utökade DoD (isolerad helper-test). Detta tillkom inte i §B-original — bör städas bort eller markeras som "test-only" före produktionsdeploy. Föreslår att `supabase/config.toml` (M8) sätter `verify_jwt=false` på `test-auth` eftersom den ÄR auth-testet.
- `playwright.config.ts` ändrade testDir-struktur (`./tests/visual` → `./tests` med projekt-specifika `testDir`). Existerande `tests/visual/`-mappen finns inte ännu så ingen migration krävdes.
- `package.json` `test:visual`-script smalnades till `--project=visual-desktop --project=visual-mobile` så det inte också drar in API-tester. Ny `test:api`-script.

**Notering om `test-auth` säkerhet:** Endpointen exponerar bara `userId` för en redan auth'd user. Den utför inga sidoeffekter och läser ingen data. Risken vid att den lever i produktion är minimal, men M8 bör bestämma om den ska deployas eller exkluderas via `config.toml`.

#### M2-godkännande (Marcus 2026-05-04) + TODO till Fas 7

Marcus valde **alternativ A**: `test-auth` (och alla `test-*`-prefixade funktioner generellt) deployas ENDAST till staging-projektet, aldrig till produktion. Två konsekvenser:

**Naming-uppdatering 2026-05-04:** Ursprungligt namn var `_test_auth` (underscore-prefix per Marcus + Chats förslag). Supabase CLI accepterar inte underscore-prefix på funktionsnamn (regex `^[A-Za-z][A-Za-z0-9_-]*$`) — funktionsnamn måste börja med en bokstav. Renamed till `test-auth` (hyphen-prefix). Konventionen blir `test-*`-prefix istället för `_test_*`. Samma intent (deploy-pipe-filtrering), bara annat tecken.

**(a) Prod-deploy-procedur måste exkludera test-prefixade funktioner.**

> **TODO Fas 7 — `test-*` får ALDRIG nå produktion.** När Fas 7-deploy-pipelinen byggs (Vercel/Supabase deploy-script eller CI-jobb), måste prod-deploy explicit filtrera bort funktioner med prefix `test-` (eller motsvarande konvention). Lämpligast som ett deploy-script eller en allowlist i CI/deploy-flödet. Mekanism kan vara `supabase functions deploy --project-ref <prod>` med uttrycklig funktion-lista, eller en `.deployignore`-konvention.

**(b) M8 — `test-auth` får `verify_jwt = false` i `config.toml`.**

`config.toml` är samma fil oavsett projekt — eftersom `test-auth` aldrig deployas till prod blir `verify_jwt=false`-raden inert där. M8-implementationen ska:
1. Sätta `[functions.test-auth] verify_jwt = false` (annars dubbel auth-check som blockerar testet).
2. Sätta `[functions.<övriga>] verify_jwt = true` per funktion.
3. Lägga en kommentar i config.toml som hänvisar till TODO Fas 7 ovan.

#### M2 staging-verifiering 2026-05-04 — gateway vs helper

Vid första körning av `npm run test:api` mot staging visade sig att Supabase Gateway (default `verify_jwt=true`) fångar saknad header + ogiltig JWT INNAN min funktion ens körs. Body blir då `{"code":"UNAUTHORIZED_*","message":"..."}` istället för min `{"error":"..."}`-format.

**Empiriskt observerat (curl 2026-05-04):**
- Saknad header → `401 {"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}` (gateway)
- Ogiltig JWT → `401 {"code":"UNAUTHORIZED_LEGACY_JWT","message":"Invalid JWT"}` (gateway)
- Anon-key → `401 {"error":"Invalid or expired token"}` (gateway släpper genom — anon-key ÄR ett valid JWT — requireUser fångar)
- Giltig user-JWT → `200 {"ok":true,"userId":"..."}` (requireUser godkänner)

**Implikationer:**
- M2:s wiring (requireUser i datafunktioner) är fortfarande värd det: anon-key fångas, defense-in-depth, user-id loggas, framtida M3-M8 bygger på user-context.
- Pre-M8: tester accepterar BÅDA bodyformat via `classify401Body()` i `tests/api/helpers.ts`. Returnerar `'gateway'` eller `'requireUser'` för spårbarhet.
- Post-M8 (när `verify_jwt=false` på `test-auth`): isolerade helper-tester börjar nå requireUser för alla paths och bodyformat blir konsekvent `requireUser`. Då kan strängare assertions införas.

**M2 DoD-status efter staging-fix:**
- ✅ requireUser anropas i alla 4 datafunktioner direkt efter handleCors
- ✅ caller_user_id loggas i update-record
- ✅ 4 tester direkt mot test-auth (3 deny + 1 allow) körs grönt
- ✅ 16 tester per datafunktion (4 deny-paths × 4) körs grönt
- ✅ Total: **20/20 gröna** mot deployad staging-runtime

**M2 = klar 2026-05-04.**

### M8 — `supabase/config.toml` med `verify_jwt` per funktion (klar 2026-05-04)

**Commit:** Pågående (denna session).

**Levererat:**
- **NY:** [supabase/config.toml](supabase/config.toml) — versionerad per-funktion `verify_jwt`-konfig.
  - `[functions.test-auth] verify_jwt = false` — gateway släpper genom så requireUser kan testas isolerat.
  - `[functions.get-events|get-persons|get-registrations|update-record] verify_jwt = true` — gateway-första-försvar.
  - `[functions.create-admin-user] verify_jwt = true` — pre-M6-gate. Caller-verifiering läggs i M6.
  - `project_id = "miranon-media-admin"`.
  - Header-kommentar med TODO Fas 7-länk om `test-*`-exkludering.

**Verifiering (lokalt):** tsc 0, biome 0, build 0 (config.toml påverkar inte client-bundle).

**Verifiering (staging — empiriskt 2026-05-04):**
- Re-deploy av alla 6 funktioner med config.toml aktiv lyckades.
- `curl GET /functions/v1/test-auth` (utan auth) → `{"error":"Missing Authorization header"}` (requireUser-format → gateway släpper genom som planerat).
- `curl GET /functions/v1/get-events` (utan auth) → `{"code":"UNAUTHORIZED_NO_AUTH_HEADER",...}` (gateway-format → gateway blockerar som planerat).
- Kontrast bekräftar att config.toml respekteras: same-server, olika beteende per funktion.

**Test-svit post-M8:** `npm run test:api` → **20/20 gröna** (samma resultat som pre-M8 — `classify401Body()` accepterar båda format så cutoveren är icke-breaking för testerna).

**M8 DoD-status:**
- ✅ (a) config.toml committad med explicit `verify_jwt` per funktion (alla 6).
- ✅ (b) Deploy till staging verifierar att config.toml respekteras (curl-kontrast ovan + 20/20 tester).
- ✅ test-auth har `verify_jwt = false` så framtida M8-relaterade fynd kan testas isolerat.
- ✅ Header-kommentar i config.toml hänvisar till TODO Fas 7 i §F (a).

**M8 = klar 2026-05-04.**

### M6 — Caller-verifiering i `create-admin-user` (klar 2026-05-04)

**Commits:** Pågående (denna session).

**Test-infrastruktur uppbyggd (Marcus godkände Alternativ B):**
- Ny test-admin-user skapad: `playwright-admin@miranon-admin.local`, `user_id=5aa3537e-8bb0-4241-8af4-543d0508b8da`. Lösenord genererat med `openssl rand -hex 24`, skrivet till `.env.test`.
- ADMIN_EMAILS-secret i staging satt till `marcus@h5gruppen.se,playwright-admin@miranon-admin.local` (komma-separerad).
- [.env.test.example](.env.test.example) utökad med `TEST_ADMIN_EMAIL` + `TEST_ADMIN_PASSWORD`.
- [tests/api/helpers.ts](tests/api/helpers.ts):
  - `ApiConfig` utökad med `adminEmail` + `adminPassword`
  - `getApiConfig()` skipper om någon TEST_*-env (inkl. nya admin) saknas
  - `loginUser()`-helper extraherad (DRY mellan user/admin login)
  - Ny `getValidAdminUserJWT(request, config)` parallellt med `getValidUserJWT(request, config)`

**Levererat:**
- [supabase/functions/create-admin-user/index.ts](supabase/functions/create-admin-user/index.ts) — full M6-implementation:
  - `requireUser(req, corsHeaders)` direkt efter handleCors (samma mönster som M2)
  - `isAdminEmail(callerEmail)`-helper läser ADMIN_EMAILS-env, normaliserar (lowercase, trim), deny-by-default vid tom lista
  - 500-respons om ADMIN_EMAILS saknas (server-config-fel, inte client-fel)
  - 403 `{"error":"Forbidden"}` (generic — läcker inte allowlist eller varför)
  - Strukturerade audit-loggar: DENY innehåller `caller_user_id`, `email`; ALLOW innehåller `caller_user_id`, `email`, target-email
  - K7-respekt-kommentar: *"Ersätts av `tenant_memberships.role IN ('owner', 'admin')` när 06b §A3 byggs."*
- **NY:** [tests/api/create-admin-user.test.ts](tests/api/create-admin-user.test.ts) — 3 deny-path-tester:
  - `deny: anon-key → 401` via `classify401Body` (anon-key passerar gateway, requireUser fångar via role-check)
  - `deny: user utan admin-email → 403` med strikt body-assertion `{error: 'Forbidden'}`
  - `allow: admin-email → 200 (eller 4xx från Supabase user-exists)` — använder admin-email själv som target → Supabase admin.createUser returnerar 4xx ("User already registered"). Testet asserterar `!=401 && !=403 && <500` — bevisar att auth-gaten passerade utan att skapa nya users per testkörning (inga test-databas-bivirkningar).

**Verifiering (lokalt):** tsc 0, biome 0.

**Verifiering (staging — empiriskt 2026-05-04):**
Manuell curl-trippel mot deployad runtime:
- `curl POST /functions/v1/create-admin-user -H "Authorization: Bearer $ANON_KEY" ...` → `{"error":"Invalid or expired token"}` (requireUser fångar anon-key)
- `curl POST ... -H "Authorization: Bearer $USER_JWT" ...` → `{"error":"Forbidden"}` (M6 ADMIN_EMAILS-check fångar non-admin)
- `curl POST ... -H "Authorization: Bearer $ADMIN_JWT" -d '{"email":"$TEST_ADMIN_EMAIL",...}'` → `HTTP/2 400` (auth-gate passerade, Supabase blockerar duplicate user)

**Test-svit post-M6:** `npm run test:api` → **23/23 gröna** (20 från M2/M8 + 3 nya M6-tester).

**M6 DoD-status:**
- ✅ (a) requireUser anropas i create-admin-user direkt efter handleCors
- ✅ (b) Caller's email matchas mot Deno.env.get('ADMIN_EMAILS') (komma-separerad). Mismatch → 403 med generic body
- ✅ (c) supabase/config.toml har verify_jwt=true för create-admin-user (verifierad oförändrad sedan M8)
- ✅ (d) Tre deny-path-tester gröna mot staging (anon-key, non-admin, admin-email)
- ✅ K7-kommentar i koden: ersätts av `tenant_memberships.role` post-S-track

**M6 = klar 2026-05-04.**

### M3 — CORS origin-allowlist (klar 2026-05-04)

**Commits:** Pågående (denna session).

**Levererat:**
- [supabase/functions/_shared/cors.ts](supabase/functions/_shared/cors.ts) — full refactor:
  - `BASE_HEADERS`-konstant: `Access-Control-Allow-Headers` + `Access-Control-Allow-Methods` (oberoende av origin)
  - `corsHeadersFor(req)`: returnerar BASE_HEADERS + `Access-Control-Allow-Origin: ${origin}` om origin på allowlist, annars bara BASE_HEADERS (utan Allow-Origin → browser blockerar response)
  - `handleCors(req)`: returnerar 403 på OPTIONS-preflight med saknad/otillåten Origin; 200 med corsHeadersFor på OPTIONS med tillåten Origin; null för non-OPTIONS (caller fortsätter)
  - `isAllowedOrigin(origin)`: matchar exakt mot `Deno.env.get('CORS_ALLOWED_ORIGINS')` (komma-separerad, deny-by-default vid tom lista)
  - K7-respekt-kommentar: *"Kan flyttas till `tenants.allowed_origins` när 06b §A1 byggs."*
- 6 Edge Functions uppdaterade: `import { corsHeadersFor }` istället för `corsHeaders`; lokal `const corsHeaders = corsHeadersFor(req)` tidigt i `Deno.serve`-bodyn så resten av koden kan fortsätta använda `...corsHeaders`-spread oförändrad. Påverkar [test-auth](supabase/functions/test-auth/index.ts), [get-events](supabase/functions/get-events/index.ts), [get-persons](supabase/functions/get-persons/index.ts), [get-registrations](supabase/functions/get-registrations/index.ts), [update-record](supabase/functions/update-record/index.ts), [create-admin-user](supabase/functions/create-admin-user/index.ts).
- **NY:** [tests/api/cors.test.ts](tests/api/cors.test.ts) — 2 CORS-deny-path-tester:
  - `preflight: tillåten origin → 200 + Access-Control-Allow-Origin speglar`
  - `preflight: otillåten origin → 403 (utan Allow-Origin-header)`
- Staging-secret satt: `CORS_ALLOWED_ORIGINS=https://admin.miranon.se,http://localhost:5173,http://localhost:4173` (per Marcus Gate A1-svar).

**Verifiering (lokalt):** tsc 0, biome 0.

**Verifiering (staging — empiriskt 2026-05-04):**
Manuell curl-trippel mot deployad runtime:
- `OPTIONS /functions/v1/test-auth` med `Origin: http://localhost:5173` → `HTTP/2 200`, `access-control-allow-origin: http://localhost:5173`
- `OPTIONS ...` med `Origin: https://evil.example.com` → `HTTP/2 403`, ingen Allow-Origin-header
- `GET ...` UTAN Origin (server-till-server) → går genom (401 från requireUser-saknad auth), ingen CORS-blockering. **Bekräftar att non-browser-trafik fungerar — Marcus särskilda fall #2 OK.**

**Test-svit post-M3:** `npm run test:api` → **25/25 gröna** (23 befintliga + 2 nya CORS-tester). Befintliga tester (utan Origin-header) fortsätter passera — **bekräftar att Playwright-runner-flödet inte bryts av M3 — Marcus särskilda fall #1 OK.**

**M3 DoD-status:**
- ✅ (a) corsHeadersFor(req) returnerar `Access-Control-Allow-Origin: ${origin}` om allowlist, annars utelämnar
- ✅ (b) handleCors returnerar 403 på preflight med saknad/otillåten Origin
- ✅ (c) Allowlist från `Deno.env.get('CORS_ALLOWED_ORIGINS')` (komma-separerad, deny-by-default)
- ✅ (d) 2 Playwright-tester gröna mot staging
- ✅ Marcus särskilda fall #1: test-auth fungerar från Playwright-runner (ingen Origin → server-till-server → tillåts)
- ✅ Marcus särskilda fall #2: curl/server-till-server utan Origin → tillåts (CORS skyddar bara browsers)
- ✅ K7-kommentar i koden

**M3 = klar 2026-05-04.**

### M4 — Discovery (start 2026-05-04, STOPPAD vid Gate A4)

Per Marcus M3-godkännande + Gate A1 fråga 6: M4 öppnar med discovery-fas innan implementation. Inga kodändringar i denna fas.

#### Vad jag inventerade

**1. React-repo (`~/Repon/miranon-media-admin/src/`):**
- `AirtableAdapter.updateRecord()` definierad i [src/data/adapters/AirtableAdapter.ts:57](src/data/adapters/AirtableAdapter.ts#L57)
- 2 högre-nivå-metoder anropar den internt:
  - `updateRegistration(id, fields)` → `updateRecord(REGISTRATIONS_TABLE_ID, id, fields)`
  - `updateAttendance(id, status)` → `updateRecord(ATTENDANCE_TABLE_ID, id, { Status: status })`
- **0 UI-callers** — `src/components/`, `src/views/`, `src/routes/` existerar inte (Fas 0/1, ingen riktig app)

**2. Vue-repo (`~/Repon/miranon-media-os/src/`):**
- Samma 2 stub-metoder i [src/data/adapters/AirtableAdapter.ts](../miranon-media-os/src/data/adapters/AirtableAdapter.ts) (Vue-källan som React-versionen kopierades från)
- 11 views i `src/views/`. Inspektion av samtliga:
  - **Riktiga views** (>20 rader): `DashboardView.vue` (286), `MinaSidorView.vue` (358), `LoginView.vue` (129)
  - **Placeholder-stubs** (19 rader var, MmMessageBox med "Byggs i V8/V9/V10/V12"): `RegistrationsView`, `PersonsView`, `EventsView`, `AttendanceView`, `PaymentsView`, `WaitlistView`, `LeadsView`, `MailView`
- Riktiga views inspekterade: `grep updateRegistration|updateAttendance|updateRecord|update\(|dataSource\.|adapter\.` → **0 träffar** i DashboardView, MinaSidorView, EventCard, NewRegistrationsList
- Composables: `useDashboardData.ts` har 0 update/patch/create/delete-anrop. Övriga composables är generiska (a11y, focus, asyncData) — inga write-flöden

**3. Dokumentation av Lottas Interface (sökt):**
- `docs/`: 21 filer, ingen om Lottas Interface skrivflöden
- `analys/`: 11 filer, ingen om Lottas Interface skrivflöden (06a/06b/07 är target-design, inte aktuell Interface-state)
- HAR-exports: 0 hittade
- "lottas-flow"/"airtable-interface"-dokument: 0 hittade

**4. Sammanfattat:** `grep -rn "updateRegistration\|updateAttendance\|updateRecord" ~/Repon/miranon-media-os/src/` utanför `data/adapters/`-mappen → **0 träffar**.

#### Fyndet

**Vue-versionen har INGA implementerade write-flöden i UI-lagret.** Adapter-metoderna `updateRegistration`/`updateAttendance` finns som stubbar utan callers. Lottas faktiska skrivande sker idag genom (a) Airtable Interface direkt eller (b) Zapier-ingest från externa formulär (per K6/G14/H7-noteringen i datamodell-research-projektet) — INGENDERA går genom dessa Edge Functions.

Detta invaliderar Gate A1-strategin "discovery-fas mot Vue-versionen" eftersom det inte finns någon empiri att discovery:a mot. Hypotes-listan från Gate A1 fråga 6 är **inte** härledd från empirisk UI-kod — den är härledd från `data-model.md` (vad fält finns) + Marcus mentala modell av sannolika Lotta-flöden.

#### 3-list-diff (omöjlig att producera meningsfullt)

| Lista | Status | Anledning |
|---|---|---|
| (a) Bekräftade (hypotes ∩ empiriskt) | **Tom** | Ingen empiri att intersektera mot |
| (b) Saknas (empiriskt ∖ hypotes) | **Tom** | Ingen empiri |
| (c) Överflödiga (hypotes ∖ empiriskt) | **8 hypoteser hittills oförankrade** | Allt i Gate A1 fråga 6 är hypotes utan empirisk bekräftelse |

#### Tre val för Marcus

| Alt | Vad | Konsekvens |
|---|---|---|
| **A** | **Gå vidare med hypotes-listan som är.** Implementera M4 mot 8 operations från Gate A1 fråga 6. Markera dem som "preliminär lista, baserad på data-model.md + sannolika flöden — verifieras mot riktig UI när produktionsslicen byggs (Codex/Code rekommenderad nästa runda)". K8-respekt: dokumentera att listan är pre-aktiv, inte slutgiltig. | M4 levereras i ~3 h. Risk: 1-2 operations kan saknas eller vara fel formulerade. Fångas vid produktionsslicen och kan korrigeras då (uppdatera `field-allowlists.ts` är ett 5-min-fix). |
| **B** | **Vänta tills produktionsslicen byggs.** Skjut M4 till efter Codex/Code rekommenderad "Steg 5: produktionsslice". Då har vi en empirisk minst-en-write-flow att basera operations på. | M4 skjuts framåt. Update-record-funktionen står utan field-allowlist tills dess — vilket är en *känd* exponering (M2 + M8 har redan stängt anon-key-vägen, men autentiserad user kan fortfarande skriva på alla 18 tabeller och alla fält). |
| **C** | **Bygg empiri först — utöver kod-discovery.** Lottas Airtable Interface-flöden dokumenteras (HAR-export från Lottas Chrome när hon utför vanliga operationer, eller skärmdumpar + intervju). Sedan diff:a mot hypotes-listan på riktigt. | M4 förskjuts ~1-2 dagar för empiri-insamling. Ger högsta säkerhet att operations-listan matchar verkligt Lotta-beteende. Kräver Lottas tid eller HAR-export-koordinering. |

#### Min rekommendation

**Alt A.** Anledning:
- M2 + M8 har redan stängt den största exponeringen (anon-key + saknad caller-verifiering på create-admin-user).
- Hypotes-listan är inte slumpmässig — den är härledd från `data-model.md`-fält och rimliga UI-flöden Marcus + Chat resonerade fram i Gate A1.
- Field-allowlists är trivial att korrigera senare (5-min-fix per ändring).
- Fas A:s syfte är att stänga uppenbara exponeringar innan UI växer — Alt B förlänger en känd exponering, Alt C är overkill för pre-produktionsslice.
- K7-respekt bevaras: hårdkodad lista är pre-S-track-bridge oavsett hur den valideras nu.

**Stoppar här.** Inga kodändringar görs. Discovery-fasen är klar — inväntar Marcus beslut på Alt A/B/C.

#### M4 Implementation (Marcus valde Alt A med justering — "infrastruktur + tom allowlist")

Marcus 2026-05-04: *"Implementera M4 som 'infrastruktur + tom allowlist', inte 'infrastruktur + 8 hypotes-operations'. Att lägga till operations utan empirisk användning är onödig attack-yta."*

**Levererat:**
- **NY:** [supabase/functions/_shared/field-allowlists.ts](supabase/functions/_shared/field-allowlists.ts) — operations-registret med:
  - `OperationDef`-interface: `{ tableId, allowedFields }`
  - `getOperation(operationKey)`: returnerar OperationDef eller null
  - `findDisallowedField(operation, fields)`: returnerar första oväntade fältet eller null
  - `OPERATIONS`-mapp: **TOM** (per Marcus instruktion)
  - Header-kommentar förklarar varför listan är tom + K7-respekt om migration till `integration_source_configs.config_values.write_allowlist` post-S-track
- **Refactor:** [supabase/functions/update-record/index.ts](supabase/functions/update-record/index.ts) — operations-baserad signatur:
  - Body: `{ operationKey, recordId, fields }` istället för `{ tableId, recordId, fields }`
  - 4-stegs validering: input-shape → operation känd → recordId-format → fields i allowlist
  - Audit-loggar: `DENY unknown operation`, `DENY field not in allowlist`, `ALLOW`
  - Borttagen `ALLOWED_TABLES`-konstanten — operations äger nu tabell-mappningen
- **Klient-sida (signatur-uppdatering):** [src/data/adapters/DataSourceAdapter.ts](src/data/adapters/DataSourceAdapter.ts), [AirtableAdapter.ts](src/data/adapters/AirtableAdapter.ts), [SupabaseAdapter.ts](src/data/adapters/SupabaseAdapter.ts):
  - `updateRecord(operationKey, recordId, fields)` — operationKey istället för tableId
  - `updateRegistration(operationKey, id, fields)` — explicit operationKey för thin wrappers
  - `updateAttendance(operationKey, id, status)` — explicit operationKey
  - K9-respekt-kommentar i AirtableAdapter: domännamn i klient, table-IDs i Edge Function-implementationen
- **Test-uppdatering:** [tests/api/edge-functions.test.ts](tests/api/edge-functions.test.ts) update-record-body bytt till `{ operationKey: 'unknown.test-op', recordId: '...', fields: {} }`. Allow-testet ger nu 400 (Unknown operation) istället för 4xx (User-exists), men `expect(res.status()).not.toBe(401)` håller — auth-gaten passerade.
- **NY:** [tests/api/update-record.test.ts](tests/api/update-record.test.ts) — 4 M4-specifika tester:
  - `deny: okänd operation → 400` — körs idag, grönt med tom allowlist (alla operations är okända)
  - `deny: recordId utan rec-prefix → 400` — `test.skip()` med kommentar "Aktiveras när Fas 5.5 lägger till första operation" (kräver känd operation att nå recordId-checken)
  - `deny: fält utanför allowlist → 400` — `test.skip()` (kräver känd operation med specifik allowedFields)
  - `allow: registrerad operation + tillåtna fält → 200` — `test.skip()` (kräver känd operation + verklig recordId)

**Verifiering (lokalt):** tsc 0, biome 0.

**Verifiering (staging — empiriskt 2026-05-04):**
Re-deploy av update-record lyckades. `npm run test:api` mot deployad runtime:
- **26 passed + 3 skipped = 29 totalt** (3 skip:s är M4 update-record-tester som aktiveras vid Fas 5.5)
- update-record:s allow-test ger nu 400 ("Unknown operation") med valid user-JWT → bekräftar att tom allowlist är deny-by-default på riktigt

**M4 DoD-status:**
- ✅ Infrastruktur byggd: field-allowlists.ts + operations-baserad update-record + uppdaterad klient-API
- ✅ Allowlist är tom (per Marcus justering)
- ✅ Deny-by-default: okänd operation → 400 (verifierat empiriskt)
- ✅ Recordid-format-check och field-allowlist-check skissade men `test.skip()`:ade till Fas 5.5
- ✅ K7-kommentar: operations migreras till `integration_source_configs.config_values.write_allowlist` post-S-track
- ✅ Discovery-fyndet lyfted till lessons.md som [UNIVERSAL]: "Hypotes om UI-flöden måste valideras mot faktisk implementation"

**M4 = klar 2026-05-04.**

### M5 — Formula-injection-eskapering (klar 2026-05-04)

**Commits:** Pågående (denna session).

**Levererat:**
- **NY:** [supabase/functions/_shared/airtable-filter.ts](supabase/functions/_shared/airtable-filter.ts) — pure ESM-helpers (importerbar både av Deno och Node):
  - `escapeFormulaValue(s)`: returnerar `"<escaped>"`. Eskaperar `\` och `"` (i den ordningen). Reject:ar input > 1000 tecken eller med kontrolltecken (U+0000–U+001F + U+007F + U+200B–U+200F + U+202A–U+202E + U+2066–U+2069). FORBIDDEN_CHARS_REGEX konstrueras via `new RegExp()` med `\u`-escapes så filens visuella encoding inte spelar roll.
  - `parseAirtableString(s)`: inverse av escapeFormulaValue. Validerar Airtable string-syntax (\\\\ → \, \\" → ", inget annat). Används för INVARIANT round-trip-test.
  - `buildLinkedRecordFilter(field, recordId)`: `FIND(escaped, ARRAYJOIN({field}))`. Validerar recordId mot `^rec[A-Za-z0-9]+$`.
  - `buildEqualsFilter(field, value)`: `{field} = escaped`.
  - `buildSearchAcrossFieldsFilter(term, fields)`: `OR(SEARCH(LOWER(escaped), LOWER(field1)), ...)`. Stödjer scalar och array-fält (ARRAYJOIN).
  - `combineWithAnd(filters)`: tom → undefined, ett → unchanged, flera → `AND(f1, f2, ...)`.
  - K6-respekt-kommentar: "Filter-buildern vet ingenting om source-koncept eller integration_sources. När S-track ersätter Airtable-Edge-Functions blir denna helper obsolet, inte migrerad."
- **Refactor:** [get-registrations/index.ts](supabase/functions/get-registrations/index.ts) använder `buildLinkedRecordFilter` + `buildEqualsFilter` + `combineWithAnd`. Builder-fel → 400 (klient-fel) med generic body, full detail loggas server-side.
- **Refactor:** [get-persons/index.ts](supabase/functions/get-persons/index.ts) använder `buildSearchAcrossFieldsFilter` med `SEARCH_FIELDS`-konstant (4 fält, varav `Ort` är array). Samma 400-mönster för builder-fel.
- **NY:** [tests/api/airtable-filter.test.ts](tests/api/airtable-filter.test.ts) — 84 tester i två lager:
  - **Lager 1 (pure-logik, importerar helpers direkt):**
    - INVARIANT round-trip × ~28 inputs (alla SAFE/QUOTE/FUNCTION/UNICODE_SAFE/LONG)
    - Per-kategori fuzz: quote/escape (6), formula-functions (9), unicode-dangerous (11 reject:as), unicode-safe (3 accepteras), långa (4)
    - Builder-tester: buildLinkedRecordFilter (4), buildEqualsFilter (3), buildSearchAcrossFieldsFilter (3), combineWithAnd (3)
  - **Lager 2 (E2E mot deployad runtime):** 6 illvilliga inputs × 2 endpoints = 12 tester. Förväntar 200 (filter passerade, gav tomt resultat) eller 400 (filter rejected) — ALDRIG 500. Säkerställer att inget illvilligt input kan trigga server-fel.
  - Alla unicode-tecken konstrueras via `String.fromCharCode(0xNNNN)` så testen är deterministiska oberoende av filens encoding (lärdom från attempts att skriva inline unicode).

**Verifiering (lokalt):** tsc 0, biome 0.

**Verifiering (staging — empiriskt 2026-05-04):**
Re-deploy av get-registrations + get-persons lyckades. `npm run test:api` → **110 passed + 3 skipped (= 113 totalt)**.

Manuell curl-injection-trippel mot deployad runtime:
- `?status=") OR TRUE() OR ("` (URL-encoded) → `HTTP/2 200`. Formel utvärderas till `{Status} = "\") OR TRUE() OR (\""` (eskaperat) → ingen registrering matchar exakt strängen → tom resultat. **Tautologi-injection misslyckades**.
- `?status=<2000 tecken>` → `HTTP/2 400`. Builder reject:ar pga `too long`. **DoS-skydd fungerar**.

**M5 DoD-status:**
- ✅ (a) NY airtable-filter.ts skapad
- ✅ (b) escapeFormulaValue hanterar `"`, `'`, `\`, `(`, `)`, komma, nyrad/CR, kontrolltecken (alla testade — kontrolltecken reject:as, övriga eskaperas eller passerar oförändrat genom string-litteralen)
- ✅ (c) Typade builders: `buildLinkedRecordFilter`, `buildEqualsFilter`, plus `buildSearchAcrossFieldsFilter` + `combineWithAnd` för komposition
- ✅ (d) Båda funktioner refactorerade — inga string-interpolation kvar
- ✅ (e) Fuzz-test med 30+ inputs (Marcus tilläggs-katalog inkluderad: TRUE/OR/IF/curly + Unicode-bidi + 1000-tecken-DoS)
- ✅ Marcus tillägg #1 — separat test-fall per attack-klass (4 describe:s för olika fuzz-kategorier)
- ✅ Marcus tillägg #2 — INVARIANT round-trip-test bevisar atomärt att eskaperad output kan tolkas EXAKT som input-strängen och inget annat
- ✅ K6-respekt: filter-buildern vet ingenting om source-koncept

**M5 = klar 2026-05-04.**

### M7 — Generisk felmodell + Sentry-init (klar 2026-05-04)

**Commits:** Pågående (denna session).

**Levererat:**

**Klient-side (Sentry):**
- [src/env.ts](src/env.ts) utökad med `VITE_SENTRY_DSN: z.string().url().optional()` — optional eftersom lokal dev körs utan Sentry.
- **NY:** [src/observability/sentry.ts](src/observability/sentry.ts) — `initSentry()` + `reportEdgeFunctionError()`-helpers. Konfig:
  - Skip i lokal dev (`!isProd && !isStaging`) — annars spam:as Sentry-kvotan
  - `tracesSampleRate: 0.1` (10% sampling)
  - `sendDefaultPii: false` (ingen automatisk email/cookie/IP-skickning)
  - `beforeSend`-filter: 4xx-fel + ResizeObserver-noise + avbruten fetch droppas
  - `reportEdgeFunctionError(error, requestId, endpoint)`: binder requestId till Sentry-context för cross-system tracing
- [src/main.tsx](src/main.tsx) anropar `initSentry()` FÖRE React mountas så tidiga fel (env-validering, root-element-fel) fångas.
- **NY:** [.env.example](.env.example) — mall för klient-env-vars (SUPABASE_URL, SUPABASE_ANON_KEY, SENTRY_DSN). `.env.test.example` finns separat sedan M2.
- `VITE_SENTRY_DSN` satt i `.env.local` (gitignored) + Supabase-secret `lvjsfnphlauldxqlncpl`.

**Server-side (Edge Functions):**
- **NY:** [supabase/functions/_shared/errors.ts](supabase/functions/_shared/errors.ts):
  - `HttpError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`-classes
  - `isOperationalError(error)`: klassar 4xx-HttpError som "förväntat" (loggas på info-nivå, ej Sentry-relevant)
  - `generateRequestId()`: `crypto.randomUUID()`
  - `mapErrorToResponse(error, requestId, corsHeaders, context)`: structured JSON-logg + klient-respons
- 5 Edge Functions refactorerade ([get-events](supabase/functions/get-events/index.ts), [get-persons](supabase/functions/get-persons/index.ts), [get-registrations](supabase/functions/get-registrations/index.ts), [update-record](supabase/functions/update-record/index.ts), [create-admin-user](supabase/functions/create-admin-user/index.ts)):
  - `requestId` genereras tidigt med `generateRequestId()`
  - catch-block ersatt med `mapErrorToResponse(error, requestId, corsHeaders, { function, method, callerUserId })`
  - Klient-respons för 5xx: `{ error: 'Internal error', requestId: '<uuid>' }` — inga stack-detaljer
  - Server-logg: `console.error(JSON.stringify({ level, requestId, errorName, errorMessage, stack, ...context }))` — sökbart i Supabase Logs
- `test-auth` orörd (har inget try/catch — minimal endpoint).

**Marcus M7-tillägg implementerade:**
- ✅ `isOperationalError` exporterad — operationella fel loggas info-nivå (sparar Sentry-quota)
- ✅ Structured JSON-loggar via `console.error(JSON.stringify(...))` — inte string-concat

**K7-respekt:** requestId-strukturen är icke-breaking — när `audit_log` (06b §C1) byggs post-S-track kan `mapErrorToResponse` enkelt utökas med `audit_log`-skrivning utan API-ändring av callers. Strukturerad logg-format matchar redan target-tabellens kolumner (`level`, `request_id`, `actor_type`, `metadata`).

**Verifiering (lokalt):**
- ✅ `npx tsc --noEmit` → 0
- ✅ `npx @biomejs/biome check .` → 0
- ✅ `npm run build` → 0 (bundle 244 → 324 kB pga Sentry SDK addition; gzip 75 → 102 kB)

**Verifiering (staging — empiriskt 2026-05-04):**
Manuellt 500-trigger via curl mot deployad runtime:
- `POST /functions/v1/update-record` med malformed JSON-body (`-d 'not-valid-json'`) + giltig user-JWT
- Klient-respons: `{"error":"Internal error","requestId":"293cc709-e8ca-43a1-9946-42ffaae56659"}`
- ✅ Generic message — inga stack-detaljer, ingen intern info läcker
- ✅ requestId är giltig UUID v4
- Baseline: `GET /functions/v1/get-events` returnerar 50 events oförändrat (inget brutet)

**Verifiering (Supabase Logs — för Marcus dashboard-check):**
Kontrollera Supabase Functions Logs i dashboard → filter på `requestId=293cc709-e8ca-43a1-9946-42ffaae56659`. Förväntat: structured JSON med `level: 'error'`, `errorName`, `errorMessage`, full `stack`-trace, `function: 'update-record'`, `method: 'POST'`, `callerUserId: '<test-user-id>'`. Det är "M7 server-side"-bevisning som inte kan verifieras automatisk via curl.

**Verifiering (Sentry — för Marcus sentry.io-check):**
Klient-side Sentry är initierad i prod/staging-bundlen. För att verifiera:
1. Bygg + deploya klient till staging (eller `npm run preview` lokalt med `VITE_SENTRY_DSN` satt)
2. Trigga ett klient-side fel (t.ex. via DevTools `throw new Error('test')` i console)
3. Kolla sentry.io dashboard → project `react-platform` → events-flöde
Förväntat: event syns med environment=staging, samma DSN-prefix `edc36f9f`.

**Test-svit post-M7:** `npm run test:api` → **110 passed + 3 skipped** (oförändrat — inga regressioner från refactor).

**M7 DoD-status:**
- ✅ (a) NY errors.ts med `mapErrorToResponse(error, requestId)` + bonus-helpers
- ✅ (b) Alla 5 catch-block (inkl. create-admin-user) byter till `mapErrorToResponse`
- ✅ (c) requestId via `crypto.randomUUID()` per request, genererat tidigt i bodyn
- ✅ (d) NY src/observability/sentry.ts med `initSentry()`, anropas från `src/main.tsx` före `createRoot`
- ✅ (e) Manuellt verifierat: kontrollerat fel → klient ser `{error: 'Internal error', requestId}` utan stack, server-loggen har structured JSON med samma requestId
- ✅ Marcus tillägg #1: `isOperationalError(error)` skyddar Sentry-quota
- ✅ Marcus tillägg #2: structured JSON-loggar via `console.error(JSON.stringify(...))`

**M7 = klar 2026-05-04.**

---

## Fas A — Slutsummering

| | |
|---|---|
| Påbörjad | 2026-05-04 09:24 |
| Slutförd | 2026-05-04 11:31 |
| Total tid | ~2 h 07 min (sammanhängande session, inga pauser i transcript) |
| Commits | 15 säkerhetscommits (+ 1 byggplan-direktiv av Marcus parallellt = 16 på branch) |
| Tester före | 23 (efter M2+M6 baseline) |
| Tester efter | 110 passed + 3 skipped = 113 totalt |
| Bundle före | 244 kB (gzip 75 kB) |
| Bundle efter | 324 kB (gzip 102 kB) — +80 kB Sentry SDK |

### Stängda exponeringar (8 från Code-verifieringen 2026-04-29)

| Fynd | Stängdes via | Verifiering |
|---|---|---|
| **A1.** Wildcard CORS `Access-Control-Allow-Origin: *` | M3 — `corsHeadersFor(req)` med env-driven exakt-match-allowlist, 403 på preflight med otillåten origin | curl: tillåten origin → 200 + Allow-Origin speglat; otillåten → 403 |
| **A2.** Ingen `requireUser`-gate i någon datafunktion | M1 (helper) + M2 (wire i 4 datafunktioner) | 20 deny-path-tester per funktion + isolerad helper-test via test-auth |
| **A3.** Anon-key-fallback i klient + ingen role-check server | M1 — requireUser fångar anon-key via role-check; M2 — wire i alla 4 funktioner | curl: anon-key → 401 från requireUser |
| **A4.** `update-record` saknar fält/operations-allowlist | M4 — operations-baserad signatur, deny-by-default vid tom allowlist | curl: `{operationKey:'unknown',...}` → 400 |
| **A5.** Formula-injektion i `get-registrations` + `get-persons` | M5 — `escapeFormulaValue()` + parameteriserade builders, INVARIANT round-trip-bevisning | curl: `?status=") OR TRUE() OR ("` → 200 tom resultat (eskaperat till strikt-equals) |
| **A6.** `create-admin-user` saknar caller-verifiering | M6 — requireUser + `ADMIN_EMAILS`-allowlist, generic 403 | curl: anon → 401, non-admin → 403, admin → 400 (Supabase user-exists, gate passerade) |
| **A7.** Råa felmeddelanden i alla 5 funktioner | M7 — `mapErrorToResponse()` med structured JSON-loggar + generic external 5xx-body | curl: malformed body → `{"error":"Internal error","requestId":"<uuid>"}` |
| **A8.** Sentry installerat men oinitierat | M7 — `src/observability/sentry.ts` + `initSentry()` i main.tsx före React-mount | Bundle innehåller @sentry/react (+80 kB), DSN satt i staging-secret + .env.local |

**Plus tilläggsfynd från §A:**
- **A9.** `supabase/config.toml` saknades → M8 — committad med per-funktion `verify_jwt`
- **A10.** PostCSS moderate vulnerability → defer:at till sidofix (Marcus M3-godkännande)
- **A11.** Vite saknar säkerhetsplugin → defer:at till Fas 7 (känd avvikelse, dokumenterad i §F)

### Etablerade arkitekturmönster

Mönster som ska fortleva i Fas 5.5+ och framåt:

- **`requireUser(req, corsHeaders)` → `AuthContext | Response`** — discriminated union istället för throw. Caller använder `if (auth instanceof Response) return auth`. Strukturerad för K7-utökning till `{ user, tenant_id, memberships }` post-S-track utan API-ändring.
- **Operations-baserat write-API** — `{ operationKey, recordId, fields }` istället för `{ tableId, ... }`. Operations-mappen i `field-allowlists.ts` definierar `{ tableId, allowedFields }` per operation. Deny-by-default vid okänd operation eller fält utanför allowlist. K9-respekt: domännamn i klient, table-IDs i Edge Function-implementationen.
- **`corsHeadersFor(req)` per request** — inte global konstant. Bygger headers dynamiskt baserat på request's Origin matchat mot env-allowlist. Skiljer browser-CORS (preflight 403 på otillåten) från server-till-server (no Origin → tillåts genom).
- **`AuthContext | Response`-discriminated union** — generaliserbart mönster för alla auth/validation-helpers. Lyckad path returnerar typad data, fel-path returnerar färdig Response.
- **Deny-by-default genomgående** — tom allowlist (operations, ADMIN_EMAILS, CORS_ALLOWED_ORIGINS) → allt nekas, inte allt tillåts. Säkrast vid konfigurations-glitches.
- **Generic external errors + requestId** — klient ser `{error: 'Internal error', requestId}` för 5xx, server-loggar har full stack. Operationella 4xx behåller specifika error-meddelanden.
- **Structured JSON-loggning** — `console.error(JSON.stringify({level, requestId, errorName, errorMessage, stack, context}))`. Sökbart i Supabase Logs på requestId.
- **`isOperationalError(error)` klassning** — 4xx-HttpError loggas info-nivå (ingen Sentry), 5xx error-nivå (Sentry). Skyddar Sentry-quota mot 401/400-spam.
- **INVARIANT round-trip-pattern (M5)** — för transformeringar (escape/parse, encode/decode), bevisa atomärt att roundtrip är förlustfri. Samma princip som `classify401Body` atomär status + body. Inte "ser ut som det funkar".
- **`classify401Body(response)` atomär verifiering** — testtid-helper som assertar status + body atomärt. Returnerar `{source: 'gateway' | 'requireUser', body}` så caller kan göra extra checks utan double-fetch. Future-bug-skydd: 200 med felmeddelande kastar.

### UNIVERSAL-lärdomar lyfta till lessons.md

3 nya [UNIVERSAL]-poster i [tasks/lessons.md](../../tasks/lessons.md):

1. **Test-only-endpoints (prefix `test-*`) får ALDRIG nå produktion.** Spårbarhet: M2 — `test-auth`-funktion infördes för isolerad helper-testing. Fas 7-deploy-pipeline måste filtrera bort `test-*` explicit. Naming-not: ursprungligt prefix `_test_*` (underscore) gick ej genom Supabase CLI:s funktionsnamn-validering.

2. **Supabase Edge Functions har två-stegs auth-check.** Gateway-nivå (`verify_jwt` i `config.toml`) fångar saknad/ogiltig JWT med eget felformat. Funktion-nivå (egen `requireUser`-helper) fångar role-check (anon-key, missing claims). Båda är legitima 401-svar. Mönstret är inte Supabase-specifikt — gäller alla gateway+function-arkitekturer (AWS API Gateway + Lambda Authorizer, Cloudflare Workers + custom auth).

3. **Hypotes om UI-flöden måste valideras mot faktisk implementation, inte mot specs.** Fas A M4 antog att Vue-versionen var sanningskälla för skrivflöden — discovery visade att 8/11 Vue-views var placeholders. När empiri saknas → infrastruktur + tom allowlist > deploy av oförankrade hypoteser. Att bygga icke-bevisade kapabilitetsytor är onödig attack-yta.

### Defer:at till senare faser

| Vad | Spår | Anledning |
|---|---|---|
| Adapter-debt (9 metoder pekar på Edge Functions som inte finns) | Fas 2.5 | UI byggs i Fas 5.5+, debt-ytan adresseras då |
| `Status.ts` sync mot `data-model.md` (saknar `Inställt` + `Flytta till väntelista`) | Fas 2.5 | Bridge-fix, K8 (preserve aktivt), inte kritisk innan UI konsumerar status-värden |
| CSP/security headers (vite plugin med nonce) | Fas 7 | SECURITY-SPEC §1 säger Fas 0, men medvetet uppskjutet — dokumenterat i §F som känd avvikelse |
| Service worker tom innehåll (`public/sw.js`) | Fas 7 | Workbox läggs in i Fas 5 enligt conversion-plan |
| PostCSS audit fix (`npm audit fix`) | Sidofix när helst | Trivialt, ej blocker, ej Fas A-arbete |
| Klient-side Sentry-verifiering (syntetiskt fel) | Fas 5.5 | Verifieras naturligt när första vertikala slice triggar riktiga fel — syntetiskt test nu är teater |

### Test-infrastruktur etablerad

Allt under nedan finns på plats för Fas 5.5+ att fortsätta använda:

- **2 test-users i staging-Supabase:**
  - `playwright-test@miranon-admin.local` (non-admin) — för "user utan admin-email"-tester
  - `playwright-admin@miranon-admin.local` (i `ADMIN_EMAILS`) — för "admin-email → 200"-tester
- **`test-auth` Edge Function** — minimal endpoint för isolerad `requireUser`-testning. `verify_jwt = false` i config.toml så gateway släpper genom. Får aldrig deployas till produktion (test-* prefix).
- **`classify401Body(response): {source, body}` atomär helper** — verifierar status === 401 + body matchar gateway- ELLER requireUser-format. Returnerar source så caller vet vem som svarade. Future-bug-skydd: 200 med felmeddelande kastar.
- **`.env.test` pattern** — gitignored fil med TEST_*-vars. `.env.test.example` mall committad. `getApiConfig()` skipper alla API-tester om TEST_*-env saknas (så `npm run test:visual` fungerar utan API-infra).
- **Playwright config med separata projekt** — `api`, `visual-desktop`, `visual-mobile` med projekt-specifika `testDir`. Scripts: `npm run test:api` och `npm run test:visual` separerade.
- **Fuzz-test-pattern (M5)** — per-kategori fuzz-tester med separata `test.describe()` så framtida regression syns tydligt om någon attack-klass smyger genom. Plus INVARIANT round-trip-test som atomär bevisning. Unicode-input via `String.fromCharCode(0xNNNN)` så testerna är encoding-deterministiska.

### Frusen status

Detta arbetsdokument arkiveras som **SLUTFÖRT** efter denna slutsummering. Inga fler ändringar.

Hela exponeringen från Code-verifieringen 2026-04-29 är stängd. Fas A levererad enligt scope.






**Aktiveringsguide för Fas 5.5+:** När produktionsslicen anropar första write-operation:
1. Lägg till operation i `OPERATIONS`-mappen i `field-allowlists.ts` (t.ex. `'registration.set-status': { tableId: 'tbloOcrppVoyrHbrq', allowedFields: ['Status'] }`)
2. Avskip:a relevanta tester i `tests/api/update-record.test.ts` (3 stycken)
3. Byt `TODO_REPLACE_WITH_REGISTERED_OPERATION` till den nya operationKey + uppdatera fields-objekten
4. Re-deploya update-record
5. Kör `npm run test:api` → ska gå från 26+3skip till 29 passed (eller 30 om allow:n adderas)










