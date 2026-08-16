---
owner: marcus803
updated: 2026-08-16
review_by: 2027-02-16
status: draft
---

# Passkeys server-side i Supabase Auth — aktiveringsvägen, RP-ID-djupet och en blockerad staging-aktivering

> **Proveniens:** avgränsat research- och aktiveringspass för `TASK-231`
> (S106, 2026-08-16), kört i egen worktree. Uppdraget: (1) källbelägga exakt
> aktiveringsväg för Supabase Auth Passkeys, (2) aktivera STAGING och bevisa
> e2e, (3) leverera en prod-klicklista. Del (2) blockerades — se § 4.

## Sammanfattning

Aktiveringen sker via Supabase Management API, `PATCH
/v1/projects/{ref}/config/auth`, fyra fält: `passkey_enabled` (bool),
`webauthn_rp_display_name`, `webauthn_rp_id`, `webauthn_rp_origins` (alla
strängar). Endpointen stöder partial update — bara de fält som skickas
ändras. Källor: [Supabase Management API-referensen,
v1-update-auth-service-config](https://supabase.com/docs/reference/api/v1-update-auth-service-config)
och [Passkey authentication-guiden](https://supabase.com/docs/guides/auth/passkeys),
båda lästa 2026-08-16 via WebFetch.

Funktionen är uttryckligen **beta**: "Passkey support is experimental. The
API may change without notice." ([Passkeys for Supabase Auth (Beta) ·
Changelog](https://supabase.com/changelog/46458-passkeys-for-supabase-auth-beta),
läst 2026-08-16) — samma beta-status ADR-093 redan byggde in i klientkoden
(`passkey.ts`s beta-isolerings-kommentar).

RP-ID:t för prod ska vara **`admin.miranon.dev`** — inte `miranon.dev` och
inte det ADR-093 själv flaggade som en tidigare felkälla,
`admin.miranon.se`. Källa: [ADR-091](../decisions/ADR-091-hosting-deploy-vercel-pro.md)
§ punkt 2 (appens origin) + [ADR-093](../decisions/ADR-093-auth-faktor-strategin-losenord-passkey.md)
§ Kontext punkt 2 (samma fel i den GAMLA roadmapen, redan en gång rättat).

**Staging aktiverades av Marcus, inte agenten** — se § 4. Ett repo-lås
(`scripts/deny-hemlighet-utskrift.sh`, TASK-203, Marcus-order 2026-08-12)
blockerar mekaniskt varje extraktion av Supabase-PAT:ets råvärde ur
macOS-nyckelringen, och CLI:t (2.114.0, verifierat `npx supabase
--version`) har ingen partial-config-subcommand — bara `config push`, som är
fullt deklarativt (dokumenterad regressionsrisk i `supabase/config.toml`
rad 262–320: 7 oavsiktliga regressioner vid första skarpa pushen 2026-08-05).
Agenten källbelade vägen, skrev den riktade PATCH:en och rapporterade
blockern; Marcus körde den själv i sin EGEN terminal (2026-08-16) — se § 4
för formen och en ny fälla den avtäckte (nyckelringsvärdet var
base64-wrappat). Agenten tog därefter över: probe-verifiering, e2e med
virtual authenticator, städning — se § 6.

## 1. Dashboard-vägen

[Passkey authentication | Supabase
Docs](https://supabase.com/docs/guides/auth/passkeys) (läst via WebFetch
2026-08-16):

1. **Meny:** Authentication → Passkeys-sektionen i dashboarden.
2. Slå på togglen "Enable Passkey authentication".
3. Fyll i tre WebAuthn relying party-fält:
   - **Relying Party Display Name** — "a human-readable name for your
     application shown during the passkey prompt (for example, 'My App')."
   - **Relying Party ID** — "the bare domain name for your application (for
     example, 'example.com'). Do not include a scheme, port, or path."
   - **Relying Party Origins** — "comma-separated list of allowed origins
     (for example 'https://example.com,https://app.example.com'). Up to 5
     origins."

Dashboarden **auto-fyller** dessa tre fält ur projektets Site URL och namn —
enligt samma sida ska värdet justeras manuellt om produktion använder en
annan domän. Vår `site_url` (`supabase/config.toml` rad 336) är redan
`https://admin.miranon.dev`, så auto-fyllningen ska i teorin träffa rätt för
prod — men klicklistan (§ 5) instruerar Marcus att skriva/verifiera värdet
explicit i stället för att bara lita på auto-fyllningen, eftersom vi inte
har mätt auto-fyll-beteendet live (ingen aktiv dashboard-session i detta
pass, se § 4).

**Kritisk varning från samma sida, citerad verbatim:** "Passkeys are
cryptographically bound to the Relying Party (RP) ID they were registered
against. Changing the RP ID makes every existing passkey unusable for
sign-in." — RP-ID:t ska alltså INTE ändras i efterhand utan att veta att det
ogiltigförklarar alla redan registrerade passkeys.

**Origin-krav** (samma sida): HTTPS obligatoriskt utom för loopback-adresser
(`localhost`, `127.0.0.1`, `[::1]`); varje hostname i origins-listan måste
matcha eller vara en subdomän till RP-ID.

## 2. Management API-vägen (den vi behöver för staging)

[Management API-referensen,
v1-update-auth-service-config](https://supabase.com/docs/reference/api/v1-update-auth-service-config)
(läst via WebFetch 2026-08-16, bekräftad äkta URL via WebSearch-träff mot
samma sida):

```
PATCH /v1/projects/{ref}/config/auth
Authorization: Bearer <Supabase PAT, sbp_…>
Content-Type: application/json

{
  "passkey_enabled": true,
  "webauthn_rp_display_name": "Miranon Media Admin",
  "webauthn_rp_id": "<RP-ID>",
  "webauthn_rp_origins": "<origins, kommaseparerat>"
}
```

Alla fyra fält är "Optional" i referensen — partial update, endast
inskickade fält ändras. Detta matchar exakt mönstret `supabase/config.toml`
rad 277–279 redan etablerade för `additional_redirect_urls`/`site_url`: "För
ETT ELLER TVÅ enskilda fält är en riktad `PATCH` mot samma endpoint säkrare
än en full push."

Två närliggande fält, **inte** del av detta uppdrag och medvetet
oanvända: `mfa_web_authn_enroll_enabled` / `mfa_web_authn_verify_enabled`
styr WebAuthn som ANDRA faktor (MFA) ovanpå en redan inloggad session — en
annan mekanism än `passkey_enabled`, som styr passkey som FÖRSTA faktor
(`signInWithPasskey`, det klientkoden faktiskt använder). ADR-093 beslutade
uttryckligen bort TOTP-/MFA-spåret för v1; att sätta MFA-WebAuthn-fälten nu
vore scope utöver kortet.

## 3. RP-ID-djupet — admin.miranon.dev vs *.vercel.app

Prod-appens origin är låst till `admin.miranon.dev`
([ADR-091](../decisions/ADR-091-hosting-deploy-vercel-pro.md) § punkt 2).
Vercels hash-alias (`miranon-media-admin-<hash>.vercel.app`) används för
förhandsgranskningar men **aldrig** för produktionstrafik — bekräftat i
`docs/research/task-199-frontend-deployvagen-och-sw-precachen-2026-08-13.md`
rad 351: "aldrig `admin.miranon.dev`" om vercel.app-aliaset, dvs. omvänt:
produktionstrafik går alltid via `admin.miranon.dev`, aldrig via
vercel.app-aliaset.

**Konsekvens för RP-ID-valet:** eftersom WebAuthn kräver att varje origin i
`webauthn_rp_origins` matchar eller är subdomän till `webauthn_rp_id` (§ 1),
och `*.vercel.app` varken matchar eller är subdomän till `admin.miranon.dev`,
**kan Vercels preview-URL:er strukturellt aldrig stödja passkey-inloggning**
— oavsett hur RP-ID sätts. Det är inte en konfigurationsmiss att åtgärda,
det är WebAuthns säkerhetsmodell (RP-ID binder credentialen till en
specifik, verifierad domän). Detta ska bokföras som en känd, avsiktlig
begränsning i prod-klicklistan (§ 5), inte som ett kvarstående TODO.

RP-ID valdes till **`admin.miranon.dev`** (den EXAKTA domänen), inte det
bredare `miranon.dev`. Skäl: `miranon.dev` bär även den sändande
mail-domänen (`docs/decisions/ADR-091-hosting-deploy-vercel-pro.md` rad
116: "`miranon.dev` bär appen (`admin.miranon.dev`) och den sändande
domänen [...] parallellt"). Ett RP-ID på `miranon.dev` hade brett ut
WebAuthn-behörigheten till varje nuvarande och framtida subdomän under
`miranon.dev` — bredare än nödvändigt för en app med en enda origin. Den
smalaste giltiga formen (RP-ID == origin-domänen exakt) är golvet enligt
"minsta nödvändiga behörighet", och `admin.miranon.dev` matchar det golvet.

## 4. Varför staging INTE aktiverades i detta pass

Aktivering av staging kräver en autentiserad `PATCH` mot Management API.
Två vägar undersöktes:

**(a) CLI-mediated.** `npx supabase --version` → `2.114.0`. `npx supabase
config --help` visar EN subcommand: `push`. `push` skickar HELA
`config.toml` deklarativt — dokumenterat i filen själv (rad 283–289) som
en verklig risk: första skarpa pushen mot staging (2026-08-05) ändrade 22
av 242 fält, varav 7 var oavsiktliga regressioner (MFA/TOTP avstängt,
e-postbekräftelse avstängd, OTP-längd 8→6, mail-frekvensspärr 60s→1s).
`config.toml` innehåller dessutom medvetet INTE stagings
`localhost:5173`-specifika värden (rad 305–320, samma fil) eftersom filen
delas mellan staging och prod — en riktad PATCH är den etablerade,
säkrare vägen för exakt den här typen av miljöspecifikt fält. En full
`config push` nu, bara för att lägga till fyra passkey-fält, hade
återupprepat den redan en gång bevisade regressionsrisken.

**(b) Direkt Management API-anrop.** Kräver Supabase-PAT:ets råvärde som
`Authorization: Bearer`-header. PAT:et ligger i macOS-nyckelringen (tjänst
"Supabase CLI", konto "supabase" — `docs/reference/atkomst-och-nycklar.md`
§ Register). `scripts/deny-hemlighet-utskrift.sh` (TASK-203) blockerar
mekaniskt (fail-closed, exit 2) varje Bash-kommando som matchar
`security find-generic-password ... -w` eller `... -g` — de enda kommandon
som kan läsa ut värdet på denna maskin. Låsets egen feltext: "Behöver du
GENUINT värdet: det är Marcus beslut, inte agentens — fråga honom."
Ingen bypass-form är dokumenterad för detta lås (till skillnad från
prod-ref-låset, som HAR en dokumenterad `PROD_REF_GODKAND_AV_MARCUS`-väg)
— vilket lästes som avsiktligt: extraktion av det RÅA PAT-värdet kräver
Marcus, punkt.

**Dashboard-vägen undersöktes också** som en tänkbar omväg (samma UI Marcus
ändå ska använda för prod): en ny flik öppnades mot
`supabase.com/dashboard/project/pqtshyierkdgwdnxuirz/auth/providers` via
`chrome-devtools`-MCP:n. Ingen aktiv inloggad session fanns — sidan
omdirigerade till `/dashboard/sign-in`. Ingen inloggning försöktes (kräver
Marcus egna credentials, som agenten varken har eller ska ha).

**Ingen kodväg (t.ex. ett Node-skript som internt anropar `security` och
bara skickar HTTP-svaret vidare) konstruerades för att kringgå låset.**
Det hade tekniskt inte matchat regex-mönstret (som bara läser Bash-
kommandots textsträng), men hade bevisligen brutit mot låsets uttalade
syfte — "det är Marcus beslut, inte agentens" gäller VÄRDET, inte bara HUR
det når stdout.

**Upplösning, körd:** Marcus körde den riktade PATCH:en själv i sin EGEN
terminal (2026-08-16), mot **staging-referensen** (`pqtshyierkdgwdnxuirz`,
inte prod). Under körningen avtäcktes en NY fälla, inte tidigare
dokumenterad: nyckelringsposten (`Supabase CLI`/`supabase`) returnerar inte
`sbp_…` rakt av från `security find-generic-password -w` — värdet är
wrappat som `go-keyring-base64:<base64>` (Go-biblioteket `go-keyring`, som
Supabase CLI:t använder, base64-kodar värden innan lagring i macOS-
nyckelringen). Uppackning: `... -w | sed 's/^go-keyring-base64://' |
base64 -d`. Bokfört i `docs/reference/atkomst-och-nycklar.md` §
Register (ny anmärkning under Supabase CLI-raden) så nästa som genuint
behöver värdet (Marcus, aldrig agenten) slipper återupptäcka detta.

API-svaret ekade tillbaka HELA auth-configen (242 fält), inklusive
`smtp_pass` (stagings SMTP-lösenord) i klartext i Marcus egen
terminal/chatthistorik — ett väntat beteende av ett fullständigt
config-objekt-svar, inte en ny sårbarhet i sig (samma yta som `GET
/config/auth` alltid exponerat), men värt att notera som en LÅG-risk-post
med en rotations-option öppen, ingen åtgärd nu (kortets Implementation
Notes).

## 5. Prod-klicklista — se kortets Implementation Notes

Den fullständiga, numrerade klicklistan för Marcus (dashboard-baserad, per
§ 1) är levererad i `backlog/tasks/task-231…md` § Implementation Notes —
kortet är verktygets ägda yta för den, inte denna forskningsfil (se
CLAUDE.md § Issue-substrat). Sammanfattning här för spårbarhet:

- RP Display Name: `Miranon Media Admin`
- RP ID: `admin.miranon.dev`
- RP Origins: `https://admin.miranon.dev`
- Känd, avsiktlig begränsning: Vercel-previewalias (`*.vercel.app`) kan
  strukturellt inte stödja passkey (§ 3) — inget att åtgärda.

## 6. E2E-bevis mot staging (agenten, 2026-08-16, efter Marcus aktivering)

**(a) Probe-flippen.** Samma curl som kortets premiss, körd om:

```
curl -X POST https://pqtshyierkdgwdnxuirz.supabase.co/auth/v1/passkeys/authentication/options \
  -H "apikey: <staging anon key>" -H "Content-Type: application/json" -d '{}'
```

Före Marcus aktivering: `404 {"code":404,"error_code":"passkey_disabled",...}`.
Efter: `200 {"challenge_id":"266f3685-…","options":{"challenge":"…",
"timeout":300000,"rpId":"localhost","userVerification":"preferred"},
"expires_at":…}` — `rpId: "localhost"` bekräftar att PATCH:ens
`webauthn_rp_id`/`webauthn_rp_origins` (`localhost`/`http://localhost:5173`)
landade rätt.

**(b) E2E med virtual authenticator.** `npm run dev -- --port 5173
--strictPort` (mode `development`, `.env.development` pekar redan mot
staging). Playwright MCP (`browser_run_code_unsafe`), CDP `WebAuthn.enable`
+ `WebAuthn.addVirtualAuthenticator` (`protocol: ctap2, transport:
internal, hasResidentKey: true, hasUserVerification: true, isUserVerified:
true, automaticPresenceSimulation: true`) — en simulerad plattforms-
autentiserare (Touch ID-motsvarighet), eftersom en riktig sådan inte kan
triggas programmatiskt.

Flöde körd mot `staging-admin@miranon.test` (`.env.test`):

1. Utloggad → `/login` → fyllde e-post/lösenord → "Logga in" → **redirectad
   till `/passkey`** (erbjudande-vyn visades — "Vill du logga in snabbare
   nästa gång?"), INTE `passkey_disabled`-studsen kortets premiss beskrev.
2. Klick "Skapa en passkey" → virtuella autentiseraren svarade WebAuthn-
   ceremonin → vyn växlade till **"Passkey skapad"**, inga fel.
3. "Fortsätt" → landade på `/mer` (ursprunglig `redirect`-parameter).
4. "Logga ut" → tillbaka på `/login`.
5. Klick **"Logga in med passkey"** (synlig även utan aktiv session, ren
   klient-capability-check) → virtuella autentiseraren svarade → **inloggad
   direkt till `/mer` UTAN lösenord**, ingen mellanlandning.

**(c) `probe.harRedanPasskey`.** Direkt navigering till `/passkey` MEDAN
inloggad (efter steg 5) → sidan visade ALDRIG erbjudande-vyn, bara ett
kort mellansteg innan tyst redirect till `/hem` (Page Title gick direkt
"Skydda ditt konto" → "Hem", ingen "Vill du logga in snabbare"-rubrik
synlig i snapshotten) — matchar exakt koden i `passkey.tsx` rad 83–88
(`probe.harRedanPasskey` → `markeraErbjudandeSett()` → `navigate` utan att
visa `vy: 'erbjudande'`). Bekräftat en tredje väg: `supabase.auth.passkey.
list()` kört direkt i sidkontext (via `import('/src/data/config/
supabase-client.ts')` i en Vite dev-graf) returnerade en post
(`id: "447833e9-…", friendly_name: "Passkey"`) omedelbart efter
registreringen.

**Städning, utförd:** kontots testpasskey togs bort igen efter verifieringen
— `DELETE /auth/v1/passkeys/{id}` med den inloggade testsessionens egna
`access_token` (INGEN infra-hemlighet inblandad, bara den vanliga
sessions-token en inloggad testanvändare redan har). SDK:t
(`supabase.auth.passkey.delete()`) skickade konsekvent `id: undefined`
oavsett `{id}`/`{credentialId}`-form (nätverksloggen visade `DELETE
.../passkeys/undefined` → 404) — en trolig SDK-bugg i beta-klienten, kringgådd
med en direkt `fetch` mot samma REST-endpoint (`204`, verifierat tomt
`passkey.list()` efteråt). Bokfört som ett bonusfynd, inte en blockerare —
inte i scope att laga (Supabase-SDK, inte vår kod), men värt att veta om
en framtida self-service "hantera dina passkeys"-yta byggs (utanför detta
korts scope). CDP-autentiseraren och WebAuthn-domänen togs bort/inaktiverades
efteråt; dev-servern stoppades.

## Källor

- [Passkey authentication | Supabase Docs](https://supabase.com/docs/guides/auth/passkeys) — dashboard-fält, origin-krav, RP-ID-varningen. Läst 2026-08-16.
- [Passkeys for Supabase Auth (Beta) · Changelog](https://supabase.com/changelog/46458-passkeys-for-supabase-auth-beta) — beta-status, alternativa aktiveringsvägar (CLI + Management API). Läst 2026-08-16.
- [Management API Reference — Update auth config](https://supabase.com/docs/reference/api/v1-update-auth-service-config) — exakt endpoint, fältnamn, partial-update-semantik. Läst 2026-08-16.
- [ADR-091](../decisions/ADR-091-hosting-deploy-vercel-pro.md) — prod-origin `admin.miranon.dev`, vercel.app-aliasets roll.
- [ADR-093](../decisions/ADR-093-auth-faktor-strategin-losenord-passkey.md) — auth-faktor-strategin, den tidigare `admin.miranon.se`-felkällan.
- `supabase/config.toml` rad 262–336 — deklarativ-push-risken, det etablerade riktad-PATCH-mönstret, `site_url`.
- `scripts/deny-hemlighet-utskrift.sh` + `.hemlighet-utskrift-policy.conf` (TASK-203) — låsets exakta mönster och avsikt.
- `docs/reference/atkomst-och-nycklar.md` § Register — Supabase PAT:ets plats och klass.
- Egen körning 2026-08-16: `curl -X POST
  https://pqtshyierkdgwdnxuirz.supabase.co/auth/v1/passkeys/authentication/options`
  → `404 passkey_disabled` (re-verifierad, samma svar som kortets premiss).
- Egen körning 2026-08-16: `npx supabase --version` → `2.114.0`;
  `npx supabase config --help` → enda subcommand `push`.
- Marcus egen körning 2026-08-16 (chatt, relä via orkestreraren) —
  PATCH-svaret, `go-keyring-base64:`-uppackningsformen, `smtp_pass`-
  exponeringen.
- Egen körning 2026-08-16: full e2e mot staging med Playwright MCP +
  CDP virtual authenticator (§ 6) — registrering, inloggning,
  `harRedanPasskey`-verifiering, städning.
