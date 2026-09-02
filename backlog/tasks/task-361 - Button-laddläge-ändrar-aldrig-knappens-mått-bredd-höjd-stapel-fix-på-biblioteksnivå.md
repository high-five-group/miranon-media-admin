---
id: TASK-361
title: >-
  Button: laddläge ändrar aldrig knappens mått — etiketten äger måttet, spinnern
  ligger ovanpå (overlay-form, ADR-113 punkt 4)
status: To Do
assignee: []
created_date: '2026-09-02 09:08'
updated_date: '2026-09-02 10:50'
labels: []
dependencies: []
ordinal: 662000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus 2026-09-02 (prod-röktest): 'när man trycker på knappen och den ändrar till laddläge så växer knappen i bredd … så gör inte proffs.' Rotorsak: Button.tsx isLoading ersatte innehållet med spinner + loadingText, så måttet följde det innehåll som råkade visas. FORM (efter review r1 på PR #2212 som fällde första ansatsen): etiketten (children) renderas ALLTID i flödet och äger bredd/höjd ensam (invisible under laddning); ladd-lagret (Loader2) är absolute inset-0 ovanpå och kan strukturellt aldrig påverka måttet; loadingText visas aldrig synligt utan går enbart till skärmläsaren (role=status aria-live=polite sr-only) — ADR-113 § Beslut punkt 4. Första ansatsen (CSS-grid-stapel med visibility, MAX av båda lagren) FÖRKASTADES i review r1: den gjorde knappar med längre loadingText än etikett permanent bredare i VILA (login 'Logga in', Radera/Makulera, Spara/Registrera) — negativt bevis sm 108→401 px, md 126→458, lg 142→511. De två Förhandsgranska-knapparna i inkorgen var handbyggda utan isLoading och migrerades. Landad: PR #2212, main 2bf26258.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Button.tsx: isLoading ändrar aldrig knappens bredd/höjd (grid-stack), verifierat med hermetiskt Playwright-test i båda riktningarna (kort och lång loadingText)
- [x] #2 Negativt bevis: samma test kört mot förlagans Button.tsx (origin/main) fäller
- [x] #3 loadingText-annonseringen (role=status, polite) och tillgänglighetskontraktet är oförändrat — verifierat
- [x] #4 DoD (test:api, typecheck, biome, build) + check-langa-streck.mjs gröna; relevanta acceptance-tester för betalningsinkorgen körda
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
