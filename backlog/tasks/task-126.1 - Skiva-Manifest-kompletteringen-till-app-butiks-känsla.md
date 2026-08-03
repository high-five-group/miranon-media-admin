---
id: TASK-126.1
title: 'Skiva: Manifest-kompletteringen till app-butiks-känsla'
status: Done
assignee: []
created_date: '2026-08-02 14:32'
updated_date: '2026-08-03 11:39'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-126
ordinal: 200000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Appens webbmanifest bär efter denna skiva alla fält som ger den rika installationsdialogen i stället för den anonyma infobaren: stabil identitet, svensk beskrivning, kategorier, fokusera-befintligt-fönster-beteendet vid länk-klick, och 2–3 genvägar till appens vanligaste handlingar (urval görs mot aktuell tabb-struktur). Skärmbilder ingår INTE — de är en egen avslutande skiva. Verifikatet bor i preview-skarven som redan bygger appen: fälten granskas i den genererade artefakten, där de uppstår.

Täcker användarberättelser: 5, 6, 7.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Genererat manifest innehåller stabil identitet (id + scope), svensk description, categories och launch_handler focus-existing
- [x] #2 2–3 genvägar (shortcuts) finns och pekar på befintliga routes
- [x] #3 Preview-skarven verifierar manifest-fälten mekaniskt och faller rött om ett fält saknas
- [x] #4 Befintliga PWA-egenskaper (installerbarhet, service worker, offline) utan regression i befintliga sviter
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
GRANSKNINGSFÄRDIG (S96-natten 2026-08-02, orkestreraren). Kod landad: commit 531ebe75, merge b27d6c52 (PR #621). CI: merge_group success. Kö-batchning gör att b27d6c52 saknar egen push-/post-merge-körning — post-merge kördes på batchens slut-SHA (9e018c0d, 3c06fc9c), båda success, på det träd som innehåller denna commit. Inga röda post-merge-larm-ärenden efter #619.

DONE-FLIPPEN ÄR MARCUS. DoD #5 (enhetsverifikat iPad/Mac-Safari/Chromium efter Grind 0) och #6 (Gunilla-principen på install-ytans text) är människo-grindar. #6 är dessutom EJ TILLÄMPLIG på denna skiva enligt agentens rapport — 126.1 bygger ingen install-yta-text, det är TASK-126.3:s scope; lämnad oavbockad i stället för felmarkerad.

HEMVIST-DIVERGENS, godkänd av orkestreraren som avsikt-över-bokstav: AC#3 namnger 'preview-skarven', men den anropas ALDRIG av CI (noll träffar i .github/workflows/ på test:preview:staging / staging-preview / verify:staging-bundle — verifierat av både agent och orkestrerare). Grinden ligger därför i ci-suite.yml:s Pure+Build, motiverad i kommentar på plats. Registrerat som TASK-130 eftersom TASK-126.4 AC#3 och PRD:ns Testbeslut bär samma felaktiga premiss.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
