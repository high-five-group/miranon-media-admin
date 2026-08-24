---
id: TASK-231
title: >-
  Fynd: passkeys AVSTÄNGDA server-side - aktivera i Supabase Auth (staging
  bevisat, prod mäts av Marcus)
status: Done
assignee: []
created_date: '2026-08-15 23:26'
updated_date: '2026-08-24 13:06'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 432000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
S102 Lotta-vandringen punkt 8-rotorsaken (2026-08-16): staging-Supabase svarar 404 passkey_disabled på /auth/v1/passkeys/authentication/options (curl-bevisat med anon key). Klientflödet (127.8/ADR-093) byggdes MEDVETET mot detta läge - passkey.ts topp-kommentaren bokför det och degraderar tyst (probe - servertillgangligt false - vidare utan sedd-markering), exakt vad Marcus upplevde ('Kontrollerar ditt konto' - hem-studs; login-knappens 'Kunde inte logga in med passkey' = samma serverorsak, medvetet oavslöjande copy). Funktionen är alltså KOMPLETT byggd klient-side men VILANDE server-side, och det kommunicerades aldrig som driftläge. GÖR: (1) research-verifiera exakta aktiveringsvägen för Supabase Auth passkeys (hosted dashboard vs config; beta-status, ev. krav) mot forstapartsdocs; (2) aktivera STAGING forst, verifiera probe-svaret flippar + registrering/inloggning fungerar e2e; (3) PROD-aktiveringen ar Marcus HITL-klick (prod-ref-laset TASK-203) - leverera exakt klicklista; (4) darefter ar QA 127.10 steg 6 kortbar. Prod-lagets matning: Marcus kor curl-kommandot sjalv (levererat i chatten).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Aktiveringsvagen kallbelagd mot Supabase forstapartsdocs
- [x] #2 Staging aktiverad och e2e-verifierad (probe + registrera + logga in)
- [x] #3 Prod-klicklista levererad till Marcus; prod-aktivering utford av Marcus och verifierad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Research + staging-aktivering (TASK-231)

Fullständig källbelagd research: `docs/research/task-231-passkey-aktiveringen-2026-08-16.md`.

**Aktiveringsväg (källbelagd):** `PATCH /v1/projects/{ref}/config/auth` (Supabase
Management API), fält `passkey_enabled` (bool), `webauthn_rp_display_name`,
`webauthn_rp_id`, `webauthn_rp_origins` (strängar, partial update). Källor:
supabase.com/docs/reference/api/v1-update-auth-service-config +
supabase.com/docs/guides/auth/passkeys + supabase.com/changelog/46458.

**Staging:** agenten kunde INTE extrahera Supabase-PATs råvärde själv
(`scripts/deny-hemlighet-utskrift.sh`, TASK-203, blockerar mekaniskt —
"det är Marcus beslut, inte agentens"). Marcus körde PATCH-anropet själv i sin
EGEN terminal (2026-08-16). NY fälla avtäckt under den körningen:
nyckelringsposten (Supabase CLI-posten i macOS-nyckelringen) returnerar INTE
PAT-strängen rakt av från en vanlig uppslagning — värdet är wrappat i en
go-keyring-base64-prefix (Go-biblioteket go-keyring) och måste packas
upp (prefix bort + base64-avkodning) innan det duger som bearer-token.
Fullständig kommandoform bokförd i
`docs/reference/atkomst-och-nycklar.md` § Register (ny anmärkning under
Supabase CLI-raden).

**Lågrisk-notering, ingen åtgärd nu:** PATCH-svaret ekade hela
auth-configen (242 fält) inklusive smtp_pass (stagings SMTP-lösenord) i
klartext i Marcus terminal/chatthistorik. Rotations-option öppen, ingen
skarp åtgärd i detta pass (utanför kortets scope).

**E2E-bevis (agenten, efter aktiveringen), fullständigt i research-filen § 6:**
- Probe: POST .../passkeys/authentication/options → 200 med rpId=localhost
  (var 404 passkey_disabled före).
- Playwright MCP + CDP virtual authenticator (WebAuthn.enable +
  addVirtualAuthenticator, protocol ctap2/internal, resident key,
  user-verified) mot npm run dev -- --port 5173 --strictPort
  (staging-backend via .env.development).
- staging-admin@miranon.test: utloggad → login → redirectad till
  /passkey-erbjudandet → "Skapa en passkey" → "Passkey skapad" (registrering
  OK) → utloggad → "Logga in med passkey" → inloggad direkt UTAN lösenord.
- probe.harRedanPasskey: direkt navigering till /passkey medan inloggad
  visade INTE erbjudandet igen (tyst redirect), bekräftat även via
  supabase.auth.passkey.list() körd i sidkontext (1 post).
- Städning: testpasskeyn borttagen igen (DELETE /auth/v1/passkeys/{id}
  med testsessionens egna access_token — ingen infra-hemlighet inblandad).
  Bonusfynd: SDK-metoden auth.passkey.delete() skickar id=undefined
  oavsett {id}/{credentialId}-form (trolig beta-SDK-bugg) — kringgådd
  med en direkt REST-fetch mot samma endpoint. Utanför scope att fixa
  (Supabase-SDK).

## Prod-klicklista (Marcus, dashboard-baserad)

Kräver INGEN kommandorad för själva aktiveringen — allt via Supabase-
dashboarden, prod-projektet (raden "miranon-media-admin" i
docs/reference/atkomst-och-nycklar.md § Register — INTE staging-raden;
agenten rör den refen ALDRIG).

1. Gå till supabase.com/dashboard → välj prod-projektet
   (miranon-media-admin) → Authentication i vänstermenyn → Passkeys-sektionen.
2. Slå på togglen "Enable Passkey authentication".
3. Fyll i (eller verifiera auto-ifyllda) tre fält — SKRIV DEM EXPLICIT,
   lita inte enbart på auto-ifyllnad:
   - Relying Party Display Name: Miranon Media Admin
   - Relying Party ID: admin.miranon.dev — EXAKT denna, inte
     miranon.dev (för brett — delas med mail-domänen) och inte
     admin.miranon.se (fel TLD, en tidigare felkälla ADR-093 redan
     rättade en gång).
   - Relying Party Origins: https://admin.miranon.dev
4. Spara.
5. Verifiera direkt mot API:et (kör själv, i din EGEN terminal — byt ut
   prod-URL mot VITE_SUPABASE_URL ur .env.production, och prod-anon-key
   mot samma fils VITE_SUPABASE_ANON_KEY):
   curl -X POST prod-URL/auth/v1/passkeys/authentication/options -H "apikey: prod-anon-key" -H "Content-Type: application/json" -d "{}"
   — ska ge 200 med rpId=admin.miranon.dev, inte längre 404 passkey_disabled.
6. Testa i webbläsaren på https://admin.miranon.dev/login: logga in,
   se erbjudandet, skapa en passkey, logga ut, logga in igen med
   passkey-knappen.

Känd, avsiktlig begränsning — inget att åtgärda: Vercels förhandsgransknings-
URL:er (miranon-media-admin-<hash>.vercel.app) kan STRUKTURELLT aldrig
stödja passkey-inloggning, oavsett RP-ID-val — WebAuthn kräver att varje
origin i webauthn_rp_origins matchar eller är subdomän till webauthn_rp_id,
och *.vercel.app är varken. Passkey fungerar alltså bara på
admin.miranon.dev (produktionstrafikens enda origin, ADR-091), aldrig på
en förhandsgranskningslänk.

Efter aktivering: QA 127.10 steg 6 blir kortbar (kortets egen premiss, punkt 4).

AC3 STÄNGD 2026-08-17: Marcus rapporterade att han redan aktiverat passkeys i Supabase-dashboarden. VERIFIERAT, ej antaget — anon-probe mot prod (curl POST /auth/v1/passkeys/authentication/options, anon key ur .env.production):

HTTP 200 med {challenge_id, options:{challenge, timeout:300000, rpId:'admin.miranon.dev', userVerification:'preferred'}, expires_at}.

Jämför utgångsläget kortet beskriver: 404 passkey_disabled. Flippen är alltså bevisad på samma endpoint och med samma metod som staging-verifieringen i AC2.

BIFYND: rpId är 'admin.miranon.dev' — Supabase-projektets domänkonfiguration bekräftar prod-domänen oberoende av DNS-mätningen på TASK-270.

KVARSTÅR för QA 127.10 steg 6: registrering + inloggning med passkey e2e i browsern. Serverledet är nu öppet; klientflödet byggdes mot det (127.8/ADR-093) och degraderade tyst så länge servern svarade 404 — den tystnaden ska nu vara borta.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
S112 bokföringspass (2026-08-24): PR #1548 (fix: [S102] create-attendance allowlistad + 231 stängd + 270 rättad) MERGED 2026-08-17T12:17:03Z, samtliga checks SUCCESS (gh pr view 1548). Ingen egen src-kod för detta korts arbete (Supabase Auth-dashboard-aktivering); AC redan verifierade i notes (curl mot prod, HTTP 200). Samtliga 4 DoD bockade mot detta.
<!-- SECTION:FINAL_SUMMARY:END -->
