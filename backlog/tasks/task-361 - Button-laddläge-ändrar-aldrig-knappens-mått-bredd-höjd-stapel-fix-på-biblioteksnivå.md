---
id: TASK-361
title: >-
  Button: laddläge ändrar aldrig knappens mått — etiketten äger måttet, spinnern
  ligger ovanpå (overlay-form, ADR-113 punkt 4)
status: Done
assignee: []
created_date: '2026-09-02 09:08'
updated_date: '2026-09-02 12:15'
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
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit 2bf26258 · PR #2212 runda 2 (MERGED 2026-09-02T10:46:43Z, granskad SHA ac2143f7) · CI-run-familjen grön (Lint+Audit+TypeCheck, Pure+Build, Acceptance ×2, Webblasarbeteende, Docs link, CodeQL — samtliga SUCCESS på ac2143f7). AC-RADERNA ÄR STALE — dokumenterat i stället för bockade bokstavligt (paus 9-noten, mission-uppdraget för denna stängningsbatch): kortets titel/beskrivning/AC1-3 beskriver r1:s FÖRKASTADE grid-stack-teknik (revad i granskning runda 1, risk HÖG). Faktisk landad implementation (verifierad mot src/components/primitives/Button.tsx på origin/main HEAD 59c3f7e3) är r2: etiketten (children) renderas ALLTID i flödet och äger bredd/höjd ensam (invisible under laddning); ladd-laget är absolute inset-0, utanför flödet, villkorat monterat. Detta är exakt review-agentens egen AC-prövning i PR #2212-kroppen (färsk kontext, embedded Riskbedömning, risk MEDEL — ej blockerande): AC1 'håller i substans (stabil bredd, hermetiskt test båda riktningar, per storlek) — AC-texten om HUR (grid-stack) gör det inte'. AC2 'andemeningen håller (negativt bevis finns), den literala måltavlan gör det inte — negativt bevis kördes mot r1:s commit c4c65e40, inte mot origin/main (den sanna pre-361-baslinjen saknar demots data-testid-ankare och testfilen själv är ny i denna PR, så ett bokstavligt test mot origin/main är strukturellt omöjligt)'. AC3 'mekaniken (role=status, polite) är oförändrad sedan r1, men mot den SANNA baslinjen (56ae3c46) var loadingText SYNLIG text — r2 gör den permanent sr-only, en avsiktlig ADR-113 punkt 4-sanktionerad ändring, inte bokstavligt oförändrad'. AC4 håller rent: DoD (test:api, typecheck, biome, build) + check-langa-streck.mjs bekräftat gröna i CI för ac2143f7. Källa: gh pr view 2212 --json body (Riskbedömnings-sektionen, review-agent schemaVersion 1.0). Ingen kod-ändring föreslås här — bara stängningen av det landade, granskade och armerade tillståndet. Landning: PR #2212. Avvikelse: AC-textens 'grid-stack'/'origin/main'/'oförändrad'-ordval är stale mot den faktiska, granskade r2-implementationen; funktionaliteten de avser att styrka håller.
<!-- SECTION:FINAL_SUMMARY:END -->
