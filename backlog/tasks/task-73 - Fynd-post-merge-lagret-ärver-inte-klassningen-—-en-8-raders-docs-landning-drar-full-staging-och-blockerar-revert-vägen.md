---
id: TASK-73
title: >-
  Fynd: post-merge-lagret ärver inte klassningen — en 8-raders docs-landning
  drar full staging och blockerar revert-vägen
status: In Progress
assignee: []
created_date: '2026-07-28 20:04'
updated_date: '2026-07-28 21:21'
labels:
  - ready-for-agent
dependencies:
  - TASK-70.2
ordinal: 153000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
post-merge.yml (TASK-70.2, landad 2026-07-28) anropar ci-suite.yml utan run_staging-input, vilket ger default true. Lagret kör därför HELA sviten inklusive Staging (API + E2E) på VARJE main-push — även när landningen är en ren docs-ändring som PR-grinden med rätta skippade.

Konsekvensen är inte teoretisk. Den observerades skarpt inom en timme från landningen.

### EMPIRI — MÄTT 2026-07-28, INTE PROJICERAT

Merge-commit ed51b95 landade EN fil: docs/revert-ovning-2026-07-28.md, 8 rader (revert-övningens no-op för TASK-70.5). Post-merge-körning 30393323548 startade på den och körde Verifierande svit inklusive Staging (API + E2E), vilket tar concurrency-gruppen staging-tests.

Samtidigt låg revert-PR #375 (körning 30393415005) med Test suite / Staging (API + E2E) i status pending — blockerad av mutexen. ci-wait.sh timade ut efter 900 s utan att PR:en kunde landa.

Med andra ord: en 8-raders docs-landning blockerade revert-vägen, som är exakt den väg A7:7 finns till för att göra snabb.

### VARFÖR AC 8:s MÄTNING INTE FÅNGADE DET

TASK-70.2:s AC 8 mätte mutex-takers per landad KOD-PR och fick FÖRE = 1, EFTER = 2 (+100 %), beskrivet som övergångsvis tills A7:5 flyttar staging ur PR-grinden. Den mätningen är korrekt för kod-PR:er.

För DOCS-landningar är talen andra och sämre: FÖRE = 0 takers (PR-grindens Test suite skippas av D0-klassningen, main-pushens svit skippas av dedup), EFTER = 1. Ökningen är från noll. Docs-landningar utgjorde merparten av landningarna under S91:s tolfte resume — tio av tolv PR:er.

### KÄRNAN: LAGRET ÄRVER INTE KLASSNINGEN

ci.yml har ett Detect changed files-jobb som klassar diffen (D0 docs-only, D1 UI, acceptance_local, dedup_hit) och släcker staging där den inte tillför något. post-merge.yml har ingen motsvarighet — den kör allt, alltid.

Det är inte samma fråga som dedup (ci.yml rad 523), som gäller main-push i CI-workflowen. Post-merge är en egen workflow och omfattas inte av den.

### SPÄNNINGEN SOM KORTET MÅSTE LÖSA, INTE GÖMMA

Post-merge-lagrets syfte är att vara skyddsnät för det som INTE kördes i PR-grinden. När A7:5 (TASK-70.3) flyttar staging dit MÅSTE lagret köra staging för kod-landningar — annars är kontrollen borttagen, inte flyttad. Men för docs-landningar finns ingenting att skydda: PR-grinden skippade sviten därför att diffen inte kan påverka den.

Rätt form är därför att post-merge ärver samma klassning som ci.yml gör, inte att staging släcks generellt. Levern finns redan dokumenterad i post-merge.yml:s filhuvud (with: {run_staging: false}), men den är i dag ett allt-eller-inget-val.

### AVGRÄNSNING

Rör INTE ci.yml:s klassningslogik, dedup-grenen eller aggregatorn CI Passed or Skipped — de är bekräftat starka och ligger utanför. Detta kort gäller post-merge.yml:s eget val av svit.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Post-merge-lagret ärver ci.yml:s klassning: en docs-only landning kör INTE Staging (API + E2E) — bevisat med ett run-ID för en docs-landning efter fixen
- [ ] #2 En kod-landning kör fortfarande full svit i post-merge — bevisat med ett run-ID; kontrollen är flyttad, inte borttagen
- [ ] #3 Mutex-takers per landad docs-PR mätt före och efter, båda talen redovisade
- [ ] #4 Tvåsidigt bevis: lagret fäller fortfarande när det ska, prövat efter ändringen
- [x] #5 Formvalet motiverat i PR:n mot A7:5 — hur lagret ska bete sig när staging flyttas dit, så fixen inte måste rivas upp av TASK-70.3
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FORM: ärvd klassning via körnings-API:t, inte en andra glob-lista.

post-merge.yml får ett `klassning`-jobb som kör scripts/classify-post-merge.sh. Skriptet klassar INTE diffen — det läser vad ci.yml redan beslutade om exakt samma träd: andra föräldern (PR-headen) → träd-identitet → grön pull_request-körning → finns ett jobb med EXAKT namnet `Test suite` med conclusion `skipped`? Ja ⇒ D0 ⇒ svit-anropet hoppas. Fail-closed på varje avvikelse.

VARFÖR INTE DUPLICERAD GLOB-LISTA: ADR-077 § Beslut 1 avvisar formen rakt ut ("omimplementation av glob-semantik som actionen redan äger, med divergens-risk mot D0"), och en andra hemvist utan paritetsgrind är restlistans A3-skuld en gång till. Ärvd klassning har ingen kopia som kan drifta. Priset är EN koppling — jobbnamnet `Test suite` — och den grindas mekaniskt av test-classify-post-merge.sh T13a.

SIGNALEN, VERIFIERAD: ett skippat reusable-anrop rapporteras som ETT jobb med anropets namn; ett kört anrop expanderas till inner-jobb prefixade "Test suite / ". 20 på varandra följande pull_request-körningar lästes 2026-07-28: 13 hade exakt ETT `Test suite` (skipped) + NOLL inner-jobb, 7 hade NOLL `Test suite` + FEM inner-jobb. Aldrig blandat. `--event pull_request` är bärande: på PR-körningar är dedup_hit alltid false, så `Test suite skipped` ⇔ should_skip_tests ⇔ D0 exakt.

ENDAST D0 ÄRVS. ui_low_risk (D1) och acceptance_local ärvs MEDVETET INTE — de släcker staging som riskreduktion, vilket är precis varför sådana träd landar utan staging-täckning (post-merge.yml § VARFÖR FILEN FINNS punkt 2). D0 säger något annat: diffen kan strukturellt inte påverka sviten.

SKARPT TVÅSIDIGT BEVIS av klassningen mot verkligt API 2026-07-28:
  ed51b95 (docs-merge, PR #374, 8 rader .md) → docs_only=true  (läste körning 30393253176)
  4543d18 (kod-merge)                        → docs_only=false (läste körning 30389547241)
Fail-closed-grenar skarpt prövade: ej push-event, icke-merge-commit, okänt SHA (API-fel), saknat argument (exit 2), saknad REPO (exit 2).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
