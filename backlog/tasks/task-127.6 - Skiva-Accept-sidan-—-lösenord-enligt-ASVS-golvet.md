---
id: TASK-127.6
title: 'Skiva: Accept-sidan — lösenord enligt ASVS-golvet'
status: To Do
assignee: []
created_date: '2026-08-02 14:33'
updated_date: '2026-08-05 11:55'
labels:
  - ready-for-agent
dependencies:
  - TASK-127.1
  - TASK-127.2
parent_task_id: TASK-127
ordinal: 210000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Den nya publika sidan där inbjudan landar: e-postadressen förifylld och oredigerbar, mottagaren sätter lösenord enligt ASVS-golvet med snäll svensk vägledning, engångstoken hanteras korrekt (utgången eller redan använd länk ger ett vänligt läge som pekar mot omskick). Formen följer prototyp-facit.

Täcker användarberättelser: 2, 3, 4, 7.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 E-postfältet är förifyllt och låst — kan inte ändras via UI eller manipulerad request
- [x] #2 Lösenordsgolvet upprätthålls: minst 8 tecken med 15 rekommenderat, kontroll mot läckta lösenord, pedagogisk svensk vägledning
- [x] #3 Utgången eller förbrukad länk ger vänligt felläge med väg framåt — aldrig rå felkod
- [x] #4 Acceptance- och a11y-sviterna gröna på sidans alla tillstånd
- [x] #5 Prototyp-facit följt
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
SKARP NYSKRIVNING av accept-sidan (`/valkommen`, ADR-092 beslut 2), fristående route utanför `_authenticated`. Prototypkoden (`src/components/dev/prototyp-auth/VariantB.tsx`) rörs aldrig — kastas per throwaway-kontraktet.

SESSIONS-MEKANIK: Supabases invite-mail länkar med access/refresh-token i URL:ens HASH-fragment. Verifierat mot Supabase-dokumentationen (context7): appens klient sätter ingen `flowType` → defaultar till `implicit`, och `detectSessionInUrl: true` (default) konsumerar fragmentet automatiskt INNAN React mountar. Ingen manuell `verifyOtp` behövs — `getSession()` väntar internt in den processen. En ogiltig/förbrukad/obefintlig länk ger samma observerbara utfall (`getSession()` → null) som en direkt besökt URL utan token — enumeration-neutralt (AC #3, ASVS 6.3.8) FÖLJER av mekaniken, ingen särskild gren krävdes.

LÖSENORDSGOLVET (AC #2) — EGENBYGGD BREACH-KONTROLL, INTE SUPABASES NATIVA: Supabase Auth har en inbyggd HIBP-integration, men den är entitlement-gated till Pro Plan (verifierat mot Supabase Studios källkod via context7: `entitlementKey: 'auth.password_hibp'`) och styrs via en dashboard-toggle jag varken kan läsa eller sätta via `supabase config push` (ingen `config pull` finns). Om togglen faktiskt är på för detta projekt är alltså overifierat — ett obelagt påstående (ADR-086). I stället byggdes `src/lib/auth/pwnedPasswordCheck.ts`: klientsidans k-anonymitets-kontroll mot HaveIBeenPwneds Pwned Passwords-API (samma mekanism Supabase själv bygger sin funktion på; industristandard, används av 1Password/GitHub/Microsoft). Lösenordet lämnar aldrig klienten (endast 5 hex-tecken av en SHA-1-hash). Fail-open vid nätverksfel (blockerar inte kontoskapandet om HIBP är nere) — loggat till Sentry som warning. CSP-tillägg: `docs/specs/SECURITY-SPEC.md`s `connect-src` utökad med `https://api.pwnedpasswords.com` på alla tre ställen CSP dokumenteras — CSP är INTE kopplad in någonstans i den faktiska appen ännu (ingen `_headers`, ingen middleware, ingen `<meta>`-tagg finns i repot), så ändringen bryter inget levande skydd.

DIVERGENS MOT FACIT, ÖPPET FLAGGAD (AC #5 ändå avbockad — strukturell/visuell fidelity hålls, copy-avvikelsen är data-driven, inte ett hörn skuret): facit-bilderna visar "Välkommen, Lotta" och "Marcus Johansson har bjudit in dig". Den skarpa sidan visar generiskt "Du har bjudits in" utan namn eller inbjudare. Skälet: `invite-user`-EF:ens (TASK-127.5, redan mergad) kontrakt är `{email, role}` — inget namnfält för mottagaren, ingen inbjudar-identitet propageras till den nya sessionen eller dess metadata. Att hårdkoda "Marcus Johansson" hade varit ett fel state-of-the-world-antagande (bryter den dag en andra admin bjuder in någon). Att härleda ett förnamn ur e-postens lokal-del är UTTRYCKLIGEN FÖRBJUDET redan i `AuthProvider.tsx` (`sessionToUser`-kommentaren: "Konsumenter får ALDRIG falla tillbaka på e-postadressen, Gunilla-principen, TASK-1 beslut 5"). Övrig struktur följer facit troget: en spalt, varm toning (`[data-auth-fond]`, permanent base.css-infrastruktur sedan S96), formuläret i vitt `rounded-2xl`-kort, e-post readonly med hänglås-ikon, ETT lösenordsfält med visa/dölj (inget bekräftelsefält — facitets research-grundade val), TTL-fotnot "Länken gäller i 24 timmar...". Öppen fråga till Marcus/orkestreraren: bör en uppföljande skiva utöka invite-user-EF:ens kontrakt med namn/inbjudare för att stänga denna copy-gap?

POST-SKAPANDE-FLÖDE: `updateUser({password})` lämnar en giltig session (invite-sessionen blir en riktig session). Koden signar explicit ut (`scope: 'local'`) och visar en "Kontot är skapat"-yta med länk till `/login` — ETT medvetet inloggningssteg, inte tyst navigering in i appen. Grund: S96/TASK-127.2:s konvergens-signal ("Logga in direkt efteråt — klart" byttes till "Logga in och upptäck ditt nya verktyg", en uttalad Marcus-formulering för precis detta ögonblick) plus TASK-127.9:s egen framing ("inbjudan → mail-länk → accept → inloggning" som skilda steg).

KÄND, ÖPPET FLAGGAD TESTLUCKA: grenen som mappar `updateUser`-fel `session_not_found`/`session_expired` till samma vänliga felläge som en direkt ogiltig länk är BYGGD men INTE oberoende testad — jag kunde inte verifiera GoTrues exakta felsvars-wire-format (`error_code`/`msg`-fält) med tillräcklig säkerhet från dokumentationen för att skriva ett tillförlitligt test utan att gissa. Testet för "updateUser misslyckas" täcker i stället den GENERISKA felgrenen (5xx utan specifik kod), som jag kunde verifiera med säkerhet.

TESTKLASSNING (ADR-094): Ursprunglig acceptance-fil (13 tester) kördes genom `scripts/hermetik-sjalvtest.mjs` (ADR-080 beslut 3, VILLKOR för klassens existens) — 9 av 13 överlevde ett tömt normalläge (`getSession()` läser localStorage utan nätverksanrop, så ingen fixturdata konsumerades). Flyttade de 9 till `tests/webblasarbeteende/valkommen.test.ts` (ADR-094 Beslut 2-kriteriet: "har testet ett databeteende att bevisa formen av? Nej på båda → webblasarbeteende") — samma mönster som `install-prompt.test.ts`s egen historia. De 4 kvarvarande (HIBP-träff, fel→rätt-sekvensen, lyckad path, updateUser 5xx) hänger genuint på mockat nätverk och självtestet BEVISAR det nu (4/4 fällda av vakten). "a11y-sviterna gröna" (AC #4) tolkat som axe-scan-täckning på sidans samtliga tillstånd (Hem-vy-precedentet: axe inbäddad i den fil som äger sidans state), inte bokstavligen `tests/a11y/` — den katalogen är enligt playwright.config.ts:s egen dokumentation avgränsad till `/dev/primitives`+`/dev/patterns`, inte produktroutes.

ROLL-VISNING: `app_metadata.role` (v1-allowlisten tillåter bara 'admin' → visas "administratör"); en okänd framtida roll visas rått i stället för att tystas bort.

React Arias validationBehavior="native"-buggen (kortets byggkrav ur TASK-127.2): `validationBehavior="aria"` satt på lösenordsfältet. Regressionstest skriver fel→rätt i SAMMA test (acceptance-filen), inte bara ett enda felaktigt försök.

GRÄNSEN (inget vertikalt scroll): verifierat på desktop (1280×800) och mobil (390×844) — renderad `scrollHeight`-mätning, ingen scroll. En tredje, ÖPPET FLAGGAD approximation (390×420, ~halva mobilhöjden) bevisar att lösenordsfältet och knappen förblir nåbara — men detta är EN approximation av "mjukt tangentbord uppe", inte en verifiering: Playwright kan inte trigga en riktig VisualViewport-resize. `min-h-dvh` (facit-mönstret) är byggd för scenariot, men mekanismen är inte vad testet mäter.

GRINDAR KÖRDA (lokalt, denna worktree): typecheck 0 fel · biome (nya filer + fullt repo) 0 fel (endast pre-existerande, orörda warnings) · build grön (ny `valkommen`-chunk bekräftad i output) · npm run test:api 450/450 gröna · npm run check:docs 13/13 gröna (endast SECURITY-SPEC.md rörd av docs-klassen) · acceptance (valkommen.acceptance.test.ts) 4/4 gröna + hermetik-självtest 4/4 fällda av vakten (bevisar hermetiskt beroende) · webblasarbeteende (valkommen.test.ts) 9/9 gröna.

PREMISS-PASSETS FYND (ADR-086): TASK-127.2 visade "To Do" i denna worktree (forkad ur origin/main) men "Done" i orkestrerarens huvudkatalog (uncommitted lokalt, 2026-08-05). Detta är EN landning jag inte sett än, inte ett fel i uppdraget — bekräftat facit-innehåll (bilagorna) läst direkt från disk oavsett kortets committade status.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
