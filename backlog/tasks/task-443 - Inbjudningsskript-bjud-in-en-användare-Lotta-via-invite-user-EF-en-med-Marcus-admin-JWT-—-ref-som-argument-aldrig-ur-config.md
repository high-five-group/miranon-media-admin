---
id: TASK-443
title: >-
  Inbjudan från appen — en riktig inbjudningsprocess i UI:t (bjud in, omskick,
  utfall i klartext) mot invite-user-EF:en; Marcus-beslut 2026-09-08, grillas
  före bygge
status: To Do
assignee: []
created_date: '2026-09-08 18:18'
updated_date: '2026-09-08 18:28'
labels:
  - ready-for-human
dependencies: []
ordinal: 770000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
MARCUS BESLUT 2026-09-08 (S124, efter kompakteringen): på frågan "Hur bjuder jag in Roger då? Han har ju inte något konto. Hur gör jag rent praktiskt?" fick han den manuella vägen (inloggad som admin → access_token ur localStorage → curl mot EF:en). Svaret: "Nej vafan är det för inbjudningsprocess. Det gör jag inte. Då väntar jag tills vi har en riktig inbjudningsprocess från appen på plats." Detta kort ÄR den processen. Det tidigare utkastet av samma kort (ett terminalskript `scripts/bjud-in-anvandare.mjs` med ref som argument) och den manuella curl-vägen är därmed AVVISADE som leveransform — ingen av dem byggs.

LÄGET I PROD (källor: tasks/sessions/archive/2026-08/2026-08-10-session-102.md rad ~538-546, 2026-08-15; docs/reference/testkonton.md): Lotta HAR ett prod-konto (display_name satt i prod-Auth för Marcus Johansson · Lotta Gotthardsson · EF-smoke, HITL-verifierat) — ett för-TASK-143-konto skapat innan inbjudningsflödet fanns via `create-admin-user` (e-post + lösenord, `email_confirm: true`), så lösenordet sattes av skaparen; hon loggar in med det eller använder `/glomt-losenord`, och en inbjudan till henne ger 422 `email_exists`. Roger HAR INGET prod-konto ("hans namn kommer via skarp inbjudan (127.10)") — han är processens första skarpa mottagare.

VAD SOM FINNS (Spår B, PRD TASK-127, skivorna 127.1–127.9 Done): EF:en `supabase/functions/invite-user/index.ts` (läst i sin helhet 2026-09-08): POST med `Authorization: Bearer <admin-JWT>` (`verify_jwt = true`, EF:en läser bara Authorization), body `{ email, role: 'admin', name }` — tre fält, `name` obligatoriskt (`user_metadata.display_name`), `role` enda giltiga värde `admin` (`VALID_ROLES`, rad ~101), caller-email måste finnas i `ADMIN_EMAILS` (rad ~198; 403 annars), inbjudarens namn härleds ur JWT:n (`readDisplayNameFromJwt`). Svar `{ invited: { id, email, role, name } }`; fel 400 (validering) / 401 / 403 / GoTrue-status rakt av (422 `email_exists` för bekräftad mottagare). Omskick = samma anrop (GoTrue slår upp e-posten före transaktionen, ingen dubblett, fil-header rad ~24-38). Mottagaren får mail från `konto@send.miranon.dev` (Auth-SMTP via Resend, `supabase/config.toml` § auth.email.smtp), länken (`otp_expiry = 86400`, 24 h) landar på `/valkommen` (`src/routes/valkommen.tsx`, `INVITE_REDIRECT_URL` satt i båda miljöerna 2026-09-02, registret `docs/reference/atkomst-och-nycklar.md` rad ~122; redirect-allowlisten bär `/valkommen` och `/nytt-losenord`). Testharness för e2e: `supabase/functions/test-invite-completion` (STAGING-ONLY, admin-JWT-gated `generateLink` + `deleteUser`) och rundturen `TASK-127.9`.

VAD SOM SAKNAS — luckan detta kort fyller: ingen yta i appen UTLÖSER inbjudan. TASK-127:s skivor täcker EF, accept-sida, login, glömt lösenord, passkey och e2e — men inte den admin-yta som anropar EF:en. Klienten anropar redan EF:er med sessionens JWT (`src/data/config/supabase-client.ts` § Authorization-header), så anropet är husets vanliga `postEdgeFunction`-väg.

FORMEN AVGÖRS I GRILLNING (CLAUDE.md § GRILLNING — Marcus startar `/grill-me`; ingen design låses här). Kandidat-punkter att grilla, inte beslut: (a) placering — Mer-fliken (`NavCard`-raden "Användare"/"Bjud in") eller en egen inställningsyta; (b) admin-gate i UI:t — klienten kan inte läsa `ADMIN_EMAILS`, så antingen visas ytan för alla inloggade och EF:ens 403 översätts till klartext, eller så exponeras admin-status server-side (ny liten EF eller claim); (c) formuläret — namn + e-post (rollen är implicit `admin` tills fler roller finns), bekräftelsesteg i husets form (ADR-126-mönstret), utfall i klartext: skickad / omskickad / "har redan ett konto — be personen använda Glömt lösenord" (422) / "du saknar behörighet" (403); (d) omskick — samma knapp, samma anrop; (e) en lista över inbjudna och deras läge (väntar / bekräftad) kräver en ny list-EF mot `auth.admin.listUsers` — grillas som scope-fråga (v1 utan lista?); (f) Gunilla-principen i all copy; (g) 11/10/10, axe 0, prefers-contrast/reduced-motion/print.

TESTBARHET: e2e mot staging med `test-invite-completion`-harnesset (provisionera/riva testmottagare) i samma rigg som `TASK-127.9`; EF:en mockas aldrig i rundturen. Första skarpa körningen i prod = Roger, via appen, som steg 1 i QA-vandringen `TASK-127.10`.

KÄLLOR: `supabase/functions/invite-user/index.ts`, `supabase/functions/test-invite-completion/index.ts`, `supabase/config.toml`, `docs/decisions/ADR-092-invite-identitetsmodellen-anvandarinbjudan.md`, `docs/decisions/ADR-093-auth-faktor-strategin-losenord-passkey.md`, `docs/reference/atkomst-och-nycklar.md`, `docs/reference/testkonton.md`, `src/routes/valkommen.tsx`, `src/data/config/supabase-client.ts`, PRD `TASK-127` + skivorna, sessionsdok S124 Del 8 (Marcus-beslutet), S102 (prod-kontonas läge).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Grillning genomförd till samsyn (Marcus startar /grill-me): placering, admin-gate, formulär, utfallstexter och listfrågan (e) avgjorda och bokförda i sessionsdok; detta korts AC skrivs om mot samsynen innan bygge
- [ ] #2 En yta i appen låter en inloggad admin bjuda in en användare med namn + e-post; anropet går till invite-user-EF:en med sessionens JWT via husets EF-klient, aldrig med service-role eller anon-fallback
- [ ] #3 Utfallet visas i klartext enligt Gunilla-principen: skickad / omskickad / redan ett konto (422 → hänvisning till Glömt lösenord) / saknar behörighet (403) / valideringsfel (400) — varje gren bevisad i test
- [ ] #4 Rundturs-e2e mot staging i TASK-127.9:s rigg med test-invite-completion-harnesset: inbjudan från appens yta → mail-länk → /valkommen → inloggad; testmottagaren rivs efteråt
- [ ] #5 11/10/10: axe 0 på ytan, prefers-contrast more, prefers-reduced-motion och print prövade; DoD-kommandona och check-langa-streck gröna med faktiska exitkoder
- [ ] #6 Ögonmätt av Marcus mot dev-server/staging före Done; första skarpa inbjudan i prod (Roger) sker via denna yta som steg 1 i TASK-127.10
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
