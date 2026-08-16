---
id: TASK-239
title: >-
  Acceptance-jobbet 5 sekunder från 12-min-taket — mät och åtgärda före
  nattfällningarna
status: To Do
assignee: []
created_date: '2026-08-16 07:07'
updated_date: '2026-08-16 10:56'
labels:
  - ready-for-agent
dependencies: []
ordinal: 439000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Forensik 2026-08-16 (R5, nyupptäckt obokförd rot): acceptance-väggklockan växer monotont 8m47s (08-12) → 8m17s → 9m39s → 10m43s → 11m55s (08-16) = 5 SEKUNDERS marginal till timeout-minutes: 12. Första fällningen redan skedd: job 95091539477 (#1372, 2026-08-16 00:31) cancelled 12m03s mitt i hermetik-självtestet, EFTER 'BEVISET HÅLLER … 231 tester · 231 fällda'. Hypotes: warmup-gaten fires även i fixturvärlden (varje acceptance-test startar med tom localStorage; 218.3:s egen kodkommentar bokför 30/36 fällningar i hem.acceptance under bygget) — men tillväxten började FÖRE 218.3 (08-13→08-14: +82 s), så mät innan åtgärd. Prognos: nattliga cancelled inom 1–2 landningar.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Tillväxtens orsak identifierad med mätning (Acceptance-steget på 817979a8^1 vs 817979a8, eller metrics:ci-serien) — inte antagen
- [ ] #2 Åtgärd som återtar marginalen (>2 min till taket) utan reflexmässig takhöjning
- [ ] #3 Acceptance grön i nattnätet tre nätter i rad efter åtgärd (belägg: run-ID:n)
- [x] #4 Webblasarbeteende-jobbets artefaktsteg (ci-suite.yml ~rad 433) får samma failure() || cancelled()-villkor — fynd ur task-237 2026-08-16: identiskt mönster, timeout-minutes: 8, samma blindhet vid takfällning
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MÄTNING (AC #1) — Acceptance-jobbets nattliga steg-tider, disk/API-verifierade via gh api repos/.../actions/jobs/<id> mot Nightly-workflowets fem körningar (31560003797…31921753720, Acceptance (hermetisk)-jobbet).

Natt/Testantal/Acceptance-steg/Självtest-steg/Total väggklocka:
08-12: 196 / 230s / 272s / 527s (8m47s)
08-13: 217 / 219s / 248s / 497s (8m17s)
08-14: 224 / 262s / 291s / 579s (9m39s)
08-15: 229 / 286s / 325s / 643s (10m43s)
08-16: 231 / 361s / 318s / 715s (11m55s)

Två SÄRSKILDA komponenter, inte en:
1) ORGANISK TESTANTAL-TILLVÄXT (196→231, +35/+17.9%, hela fönstret) — väntad, pågående, INTE fixbar via engångsåtgärd. Förklarar 08-13→08-14-hoppet (+82s, FÖRE 218.3 — bekräftar kortets egen flagg att tillväxten inte är enbart warmup-gaten) och en del av 08-14→08-15.
2) WARMUP-GATEN (TASK-218.3/ADR-112, commit 817979a8, landad 2026-08-15 12:17 UTC). 08-15-nattkörningen (02:15 UTC) startade FÖRE landningen; 08-16-körningen (02:22 UTC) är FÖRSTA nattkörningen med gaten. Delta 08-15→08-16 (nästan konstant testantal, 229→231): +72s total väggklocka, varav +75s ISOLERAT i Acceptance tests (hermetiska)-steget medan självtest-steget MINSKADE (-7s) — konsekvent med att självtestets EF-mock-vakt fäller warmup-anropen omedelbart (fail-fast) medan huvudkörningens MSW-svar tar verklig tid per test.

LOKAL KONTROLLERAD A/B (kortets efterfrågade jämförelse, 817979a8^1 vs 817979a8, IDENTISK 231-testsvit — verifierat via --list på båda SHA:er, inga acceptance-testfiler ändrades i PR #1343): FÖRE 708.97s (230/231 passed), EFTER 1943.94s (229/231 passed) — 2,74x lokalt. Detta magnitud-tal är EJ CI-jämförbart (samma maskin drabbades av loadavg 300-800 under körningarna, mätt via uptime) men bekräftar MEKANISMEN otvetydigt: samma testsvit, samma maskin, enda skillnaden är gaten.

Mekanismen läst i källan: src/main.tsx:s InnerApp anropar starta(queryClient, { dataSource }) (StartvarmningBeroenden-seamen, startvarmningen.ts) på VARJE auth-löst sidladdning med tom query-cache — exakt fixturvärldens per-test-startvillkor (tom localStorage/tom cache per test). 7 warmup-items i ~4 sekventiella batchar.

ÅTGÄRD (AC #2) — STOPPAT, EJ BYGGT. Mätningen pekar entydigt på att den STÖRSTA identifierade, fixbara komponenten (den enda som ensam förklarar 5-sekundersmarginalen mot 12-min-taket) är SAMMA StartvarmningBeroenden-seam task-236-agenten just nu åtgärdar för staging-e2e (samma fil, samma integrationspunkt, samma mekanism — bara olika testklass runt den). Per uppdragets koordineringsregel: byggde INTE en parallell fix mot samma seam (risk för merge-konflikt/dubblerat designval); byggde heller INTE en kringgående åtgärd (workers-höjning/sharding) eftersom (a) det hade maskerat grundorsaken task-236 redan löser, (b) CI-risken för en oprövad worker-/sharding-ändring inte går att stänga lokalt idag, (c) organisk testtillväxt fortsätter oavsett — margin-återtagningen behöver egentligen BÅDE seam-fixen OCH en strukturell buffert, och den senare är inte detta korts att gissa fram oprövat.

REKOMMENDATION till orkestreraren: låt task-236 landa, mät om Acceptance-jobbets marginal som BIEFFEKT (samma main.tsx-integrationspunkt bär båda testklasserna), och bedöm om en KOMPLETTERANDE strukturell åtgärd (testsvits-sharding, worker-konfig) fortfarande behövs som eget kort när färsk data finns.

AC #3 (tre gröna nätter) — bevakas av orkestreraren/nattnätet, ej görbart idag.

AC #4 byggd: ci-suite.yml rad ~433 (webblasarbeteende-jobbets artefaktsteg) fick if: failure() || cancelled(), identiskt mönster som PR #1380 gav acceptance/test-staging-jobben. actionlint + yamllint gröna. verify:ci-parity (fullt läge, egen CI-ändring) föll först rött (3 poster: test-ci-wait T1 + 13 acceptance-specs) — samtliga verifierade vara LOKALA LOADAVG-artefakter (uppmätt 300-800 under körningen pga mina egna sekventiella lokala A/B-körningar) och INTE orsakade av diffen: test-ci-wait 27/27 grönt vid isolerad ompröving efter att lasten sjunkit, samtliga 11 berörda acceptance-specfiler (96 tester) 0/96 fällda vid isolerad omkörning under normal last. Diffen rör uteslutande webblasarbeteende-jobbet, strukturellt oberoende av acceptance-jobbets testinnehåll.
<!-- SECTION:NOTES:END -->
