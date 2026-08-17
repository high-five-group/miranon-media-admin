---
id: TASK-261
title: >-
  Fynd: Förberedelseskärmen blinkar mellan inloggning och passkey-förfrågan
  (prod)
status: To Do
assignee: []
created_date: '2026-08-17 09:36'
updated_date: '2026-08-17 10:12'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 477000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus-observation 2026-08-17 under QA 243.4-morgonkollen, skarp prod (admin.miranon.dev): vid inloggning blinkade Förberedelseskärmen till MELLAN inloggningen och passkey-förfrågan ('Vill du logga in snabbare nästa gång'). TASK-233 (Done) fixade mikro-blinket vid SIDBYTEN (rotens Suspense-fallback fick delay) och TASK-240 (Done) loadingbaren vid utloggning→inloggning — denna övergång (post-login → passkey-prompt) är antingen en ANNAN kodväg utan delay-tröskeln eller ett fall där tröskeln korsas (prod-latens). Lotta-synligt = hög prioritet. Frekvens: 'ibland' (en observation); prod-miljö. Passkey-ytan: p1–p4 i prod, task-231 öppen (p5–6 återstår).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Rotorsak identifierad med reproduktion (dev/staging räcker; koppling till 233:s delay-mekanik eller separat kodväg klarlagd)
- [x] #2 Fix: övergången inloggning→passkey-förfrågan visar ingen Förberedelseskärm-blink
- [x] #3 Regressionstäckning i lämplig testklass (233:s mönster som förlaga)
- [x] #4 Verifierad i faktiska login→passkey-övergången (dev/staging; prod-verifikat vid nästa deploy-svep)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ROTORSAK (belagd i kod + deterministisk repro): ETT RACE mellan två navigeringsvägar som båda startar när auth.login() flippar auth.isAuthenticated i login.tsx handleSubmit.

VÄG A (snabb, mikrotask): InnerApps effekt (main.tsx rad 199-201) kör router.invalidate() -> /login:s EGEN beforeLoad (login.tsx rad 27-33 före fixen) re-evalueras -> ser isAuthenticated: true -> throw redirect({ to: search.redirect }). Målet är en _authenticated-yta, så AuthenticatedLayout monteras och dess app-yta-gate (useAppYtaVarmningsgate, _authenticated.tsx rad 120-124) ser KALL cache redan i sin lazy useState-initierare -> Forberedelseskarm renderas (rad 171-173).
VÄG B (långsam, TVÅ await): routaEfterLyckadInloggning (login.tsx rad 170-187 före fixen) väntar in supabase.auth.getSession() OCH probaPasskeyTillganglighet() (ett riktigt nätverksanrop, passkey.ts rad 105) innan den navigerar till /passkey.

Väg A vinner alltid; skärmen den monterar rivs när väg B landar. Blinkets längd = probe-anropets latens, vilket förklarar 'ibland' i prod (nätverksjitter avgör om det hinner målas).

PREMISSEN SOM REVS: _authenticated.tsx rad 74-78 bokför uttryckligen att racet var harmlöst eftersom 'den slutliga destinationen är densamma oavsett VILKEN väg som vinner racet (search.redirect, FÖRUTOM DET JUST NU AVSTÄNGDA PASSKEY-ERBJUDANDET)'. TASK-231 aktiverade passkey-erbjudandet server-side (p1-p4 i prod) -> de två vägarna har inte längre samma mål, och den dokumenterade förutsättningen föll. Ett kort rev alltså en annan kodvägs bärande antagande utan att den kommentaren uppdaterades.

UPPDRAGETS DEPLOY-HYPOTES FALSIFIERAD: prod-fronten kör 8044e5b6 (origin/main:s spets vid mätningen), bevisat via deploykedjan (vercel inspect https://admin.miranon.dev -> dpl_7CfGaqJxcAtjWcNHqYHc7xgrb4gH -> Vercel REST v13 gitSource.sha), INTE gissat ur minifierad bundle. git merge-base --is-ancestor bekräftar att TASK-233:s fix-commit 8457cf2e OCH merge-commit 1d81e36b båda ligger bakom den deployade SHA:n. 233-fixen ÄR alltså i prod; blinket är en ANNAN kodväg som 233 aldrig rörde (233 gäller route-chunkars Suspense-fallback, detta är app-yta-gatens riktiga montering).

FIX: ny delad modul src/lib/auth/inloggningsdestination.ts (borja-/sluta-/inloggningsdestinationenAgs). login.tsx handleSubmit öppnar fönstret FÖRE auth.login() (racet startar när anropet flippar auth-tillståndet, inte när det returnerar); /login:s beforeLoad avstår från sin redirect medan fönstret är öppet; routaEfterLyckadInloggning stänger det ovillkorligt i finally och har fått en catch-gren som navigerar till search.redirect även om beslutet kastar (fail-safe: inloggningen HAR lyckats där, bara destinationsbeslutet gick fel — utan den kunde en inloggad användare blivit kvar på /login sedan beforeLoad börjat lämna företräde).

VARFÖR INTE 233:s DELAY-MÖNSTER (som kortet föreslog som förlaga): en fördröjd fallback hade bara DOLT skärmen. Layouten hade fortfarande monterats och dess gate hade startat en HEL startvärmning — sju EF-anrop — som kastas bort ett ögonblick senare, precis den straggler-klass TASK-240 dokumenterade som skadlig. Racet togs bort i stället.

MODUL-DUPLICERINGS-FYND (mätt, kostade ett helt varv): första fixen lade flaggan som en modul-scope let i login.tsx. Logiken var identisk och effekten var NOLL — vite.config.ts kör tanstackRouter({ autoCodeSplitting: true }), som delar route-filen i separata chunkar, så beforeLoad och komponenten fick VAR SIN kopia av variabeln. Bevisat empiriskt: samma logik, enda ändringen var att flytta flaggan till en delad modul -> rött blev grönt. Route-fil-lokalt modultillstånd delat mellan beforeLoad och komponent är strukturellt opålitligt i detta repo.

REPRODUKTION (deterministisk, acceptance-klassen): 1200 ms MSW-fördröjning på GET */auth/v1/passkeys garanterar att väg A hinner först. Mätt vägsekvens FÖRE fix: 'FORBEREDELSESKARM @ /mer/installera-appen' följt av URL -> /mer/installera-appen -> /passkey.

TVÅSIDIGT BEVIS: utan fixen (git stash på src/) FÄLLER testet, exit 1, med utskriften [TASK-261] FORBEREDELSESKARM @ /mer/installera-appen. Med fixen exit 0. Hela login+passkey-sviten 13/13 grön.

TRE MÄTINSTRUMENT-FÄLLOR som gav FALSKT GRÖNT innan de stängdes (alla mätta i denna skiva): (1) window-variabel som latch — page.evaluate läste den tom efter navigering trots att spanaren kört; (2) MutationObserver i addInitScript — document.documentElement är null där, så .observe(null) kastar och dödar resten av scriptet TYST, inklusive kod deklarerad efter; (3) sessionStorage-latch — skrevs i callbacks men lästes tom. Fungerande metod: ren setInterval-polling som rapporterar via console, insamlat av page.on('console') utanför sidkontexten. Fixturvärlden fryser dessutom klockan (hermetic.ts rad 428, page.clock.setFixedTime), så Date.now()-deltan är alltid 0 — timers kör däremot i realtid.

FALSKT POSITIVT som också stängdes: spanaren måste aktiveras FÖRST vid klicket. Utan den avgränsningen fångar den InnerApps auth-resolution-placeholder (main.tsx rad 305-308, ADR-112 beslut 5) — en dokumenterad, ALLTID närvarande mikro-rendering av samma komponent under auth.isLoading, som sker på varje sidladdning innan någon loggat in. Den är ett annat, förexisterande beteende än detta race.

GRINDAR (faktiska exitkoder, mätta före push): typecheck exit 0 · biome exit 0 (0 fel, 7 warnings/47 infos, samtliga pre-existerande) · build exit 0 · acceptance login+passkey 13/13 exit 0.

test:api: ROTT, men EJ av denna skiva — differentialbevisat. Körning 1 fällde 3 tester i update-record.staging.test.ts; samma fil isolerat gav 19/19 grön BÅDE på orörd baseline och med fixen (transient staging-samtidighet). Körning 2 fällde i stället get-person.staging.test.ts:119 ('S103 steg 2: hamtningar/motiveringar/flagga är RIKTIGA poster'); den fäller IDENTISKT på orörd baseline (9 passed / 1 failed, samma signatur) och är alltså preexisterande, utanför denna skivas domän.

SEPARAT DEFEKT FUNNEN OCH MÄTT, EJ ÅTGÄRDAD (Marcus live-observation via orkestreraren: logotyp+loadingbar ocentrerade på staging-preview): Forberedelseskarm.tsx rad 183 bär 'flex h-full min-h-full ... items-center justify-center'. h-full/min-h-full är procenthöjder och kräver att hela förälderkedjan bär höjd — men base.css rad 19-23 sätter 'html, body { margin: 0; padding: 0; }' UTAN height, och #root har ingen CSS-regel alls (noll träffar i src/styles/). SKARP MÄTNING i browsern: viewport=720, men root.clientHeight=176, container.clientHeight=176, bodyHeight=176px, htmlHeight=176px — containern kollapsar till innehållshöjden, så justify-center centrerar inom en 176px-låda högst upp på sidan och innehållet ser topp-ankrat ut. Orkestrerarens hypotes 1 (höjdkedje-kollaps) BEKRÄFTAD; hypotes 2 (fel komponent renderas) FALSIFIERAD — klassnamnet i mätningen matchar Forberedelseskarms egen rad 183 exakt. Detta är en SEPARAT rot från blinket (CSS-höjdkedja, inte navigerings-race) och åtgärdades INTE här: komponenten är ADR-112-/TASK-242-styrd med tätt specat layoutankare, så valet av ersättning (login.tsx använder viewport-baserad min-h-dvh för samma centrering och är immun mot kedjan) är ett designbeslut, inte en agent-solofix. Inget kort mintat per orkestrerarens instruktion.
<!-- SECTION:NOTES:END -->
