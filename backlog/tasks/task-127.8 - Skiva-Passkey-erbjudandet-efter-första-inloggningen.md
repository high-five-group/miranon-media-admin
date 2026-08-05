---
id: TASK-127.8
title: 'Skiva: Passkey-erbjudandet efter första inloggningen'
status: Done
assignee: []
created_date: '2026-08-02 14:33'
updated_date: '2026-08-05 14:24'
labels:
  - ready-for-agent
dependencies:
  - TASK-127.3
parent_task_id: TASK-127
ordinal: 212000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Efter första lyckade inloggningen erbjuds passkey som frivillig säkerhetsuppgradering på egen yta — att avböja är förstklassigt och tjatfritt. Registrering och inloggning med passkey som alternativ; lösenordet är alltid fallback. Plattformens beta-API isoleras bakom egen abstraktion så att beta-risken bor i en fil.

Täcker användarberättelse: 9.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Erbjudandet visas efter första inloggningen och kan avböjas utan att återkomma vid varje inloggning
- [x] #2 Registrerad passkey fungerar för inloggning; lösenordet kvarstår alltid som fallback
- [x] #3 Plattformens beta-API inkapslat i egen modul — en API-ändring träffar en fil, inte flödet
- [x] #4 Acceptance- och a11y-sviterna gröna; flödet degraderar snyggt på enheter utan stöd
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
STÄNGD 2026-08-05 (S96, orkestrerarens CI-verifiering).

LEVERERAD via PR #789 (MERGED 14:21Z). CI grön per jobb: Lint+Audit+TypeCheck · Pure+Build · Acceptance (hermetisk) · Webblasarbeteende · Docs link check · CodeQL · Analyze ×2 · Detect changed files · CI Passed or Skipped · Vercel · Vercel Preview Comments — samtliga SUCCESS. A11y/Staging/purge korrekt SKIPPED.

TVÅ INGREPP AV ORKESTRERAREN FÖRE LANDNING:

(1) MERGE-KONFLIKT mot TASK-127.7 i src/routes/login.tsx (commit 49a215ae). Båda skivorna rörde filen — 127.7 ersatte glömt-lösenord-notisen med en <Link>, 127.8 la till post-login-routing och passkey-knappen. Konflikten låg enbart i importraderna; löst som union (Link + Fingerprint + Loader2). useId togs bort: den användes av 127.8:s glomtNotisId, för den notis 127.7 ersatte, och hade utan borttagning fällt biome.

(2) ÖVERSKUGGNINGS-VAKTEN fällde acceptance-sviten (EXIT 1 trots 12/12 gröna). Fyndet reproducerades i CI, inte bara lokalt.

ROTORSAKEN VAR INTE DEN ORKESTRERAREN GISSADE. Orkestrerarens diagnos — att webblasarenStodjerPasskey() ger false utan virtuell autentiserare — PRÖVADES av agenten och FÖLL: funktionen är sann per default i headless Chromium, och passkey.list() är ett rent GET-anrop som aldrig rör navigator.credentials. Verklig orsak: testets enda assertion var slut-URL:en, och koden når samma SAKERT_MAL via TRE grenar (otillgängligt / redan-sett / redan-registrerad). Testet kunde därför aldrig bevisa VILKEN gren som kördes — det passerade oavsett om markeraErbjudandeSett() anropades.

Rättat i c48292de: page.waitForRequest() registrerad FÖRE triggande handling (ingen race) gör själva PUT-anropet till assertionen, med body-innehållet verifierat. Ingen medvetetOanvand() — registreringen är genuint menad att användas. HELA acceptance-sviten kör nu 177 passed EXIT 0.

Detta är ADR-086 riktat mot orkestreraren: agenten behandlade orkestrerarens diagnos som HYPOTES, prövade den, och levererade en bättre analys.

VERIFIERAT OM PLATTFORMEN, inte antaget: passkey_enabled = false på staging (Management API) och en oautentiserad probe mot /auth/v1/passkeys/authentication/options ger 404 passkey_disabled. supabase-js 2.110.8 HAR API:et bakom auth.experimental.passkey. Funktionen degraderar alltså tyst i skarp drift tills plattformsflaggan slås på — det är AC #4:s beteende, inte en defekt.

ÖPPEN GRÄNS, kodgranskad men aldrig browser-bevisad: NotAllowedError-grenen i tolkaPasskeyFel (användaren avbryter ceremonin). Agenten hittade ingen CDP-konfiguration som deterministiskt triggar just den DOMException. Dokumenterad i passkey.acceptance.test.ts:s toppkommentar.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
