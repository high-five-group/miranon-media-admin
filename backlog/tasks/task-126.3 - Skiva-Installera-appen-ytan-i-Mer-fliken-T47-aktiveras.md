---
id: TASK-126.3
title: 'Skiva: Installera appen-ytan i Mer-fliken (T47 aktiveras)'
status: To Do
assignee: []
created_date: '2026-08-02 14:32'
updated_date: '2026-08-05 11:43'
labels:
  - ready-for-agent
dependencies:
  - TASK-126.2
parent_task_id: TASK-126
ordinal: 202000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mer-fliken får en Installera appen-yta och aktiverar därmed T47:s vilande Inställnings-hemvist. iOS/iPadOS-instruktionen är huvudpersonen — steg-för-steg så att Lotta klarar den ensam på första försöket — med Mac-Safari Lägg till i Dock och Chromium-knappen (via bibliotekskomponenten) som sekundära vägar. Ytan visar rätt väg för besökarens plattform först, och bekräftar i stället för instruerar när appen redan är installerad.

Täcker användarberättelser: 1, 2, 3, 4, 8.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Besökarens plattform avgör vilken instruktion som visas överst; övriga vägar nås men dominerar inte
- [ ] #2 iOS/iPadOS-instruktionen är komplett steg-för-steg utan en enda oförklarad teknisk term (Gunilla-principen)
- [x] #3 På Chromium utlöser knappen riktig installationsdialog; efter installation visar ytan installerat-läget
- [x] #4 Redan installerad (standalone) ger bekräftelse-läge i stället för instruktion
- [x] #5 a11y-sviten grön på hela ytan — ribban är 11, inga undantag
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BYGGD (bygg-agent, S98/S96-fortsättning). Gren task-126.3-installera-appen-yta, PR öppnad.

AC 1/3/4/5 checkade — verifierade: webblasarbeteende (8/8 gröna, tests/webblasarbeteende/installera-appen.test.ts, mot /dev/installera-appen dev-guardad demo-route) + a11y (5/5 gröna, tests/a11y/InstalleraAppen.spec.ts, axe 0 violations på alla fyra innehållsblock: default/fallback, chromium-knapp, iOS-details öppnad, Mac-details öppnad, redan-installerad-bekräftelse).

AC 2 LÄMNAD OUKRYSSAD MED AVSIKT — samma substans som DoD 5 (Gunilla-principen på iOS-instruktionens text): strukturellt bevisad (5 numrerade steg, varje ikon/knapp/meny förklarad innan handlingen, testad att rätt textblock visas), men den PEDAGOGISKA bedömningen ("utan en enda oförklarad teknisk term") är Marcus-grinden per uppdraget — självgraderas inte.

DoD 1 därför oavbockad (ej alla AC). DoD 3 oavbockad (CI-verifiering i orkestrerarens svep). DoD 5 oavbockad (Marcus-grinden, väntande).

DoD 2 LÄMNAD OUKRYSSAD — delvis verifierad, inte helt: typecheck/biome/build/test:api (DoD-kvartetten) gröna, webblasarbeteende + a11y (fulla sviter, inte bara nya filerna) gröna, 0 regressioner mot task-126.2:s befintliga InstallPrompt-tester. MEN tests/e2e/mer-index.staging.test.ts (chromium-authenticated-projektet, rörd fil — uppdaterad från TVÅ/fem till TRE/sex NavCard-rader efter den nya Inställningar-gruppen) kunde INTE köras lokalt: port 5173 är hård-låst av staging-CORS (playwright.config.ts:110-ish) och upptagen av en redan körande, ORELATERAD process (PID 13597, startad 2026-08-03, cwd huvudkatalogen — inte min, rördes inte). Fixet är källäst korrekt (grupper.nth(2), toHaveText(['Installera appen']), count 5→6, chevron 5→6) men oskarpbevisat. test-staging-jobbet i ci-suite.yml kör bara vid inputs.run_staging=true (ej default för en vanlig PR) — sannolikt ingen presubmit-blockering, men flaggat öppet.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Install-ytans instruktioner klarar Gunilla-principen: begriplig utan tekniska förkunskaper
<!-- DOD:END -->
