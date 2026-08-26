---
id: TASK-123
title: Platta ut tests/acceptance/support/ till fil — support-katalog-tvillingen bort
status: To Do
assignee: []
created_date: '2026-08-02 08:19'
updated_date: '2026-08-26 05:03'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 195000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beslutsbordet S91 punkt 5(a), Marcus GO 2026-08-02 på research-rekommendation. Två oberoende läsare snubblade på tests/support/fixturvarld/ mot tests/acceptance/support/ (TASK-59.8:s QA-fynd, sessionsdok Del 17).

UNDERLAG: docs/research/testklass-namn-och-support-kataloger-2026-08-02.md. Branschmönstret är 5/5 entydigt (Cypress support/e2e.js-formen, RSpec rails_helper): EN delad hjälparkatalog per testträd, klasslokala behov som FILER. Katalogen innehåller EN fil. Mätt kostnad: 18 importrader + 11 path-strängar + 1 git mv; urvals-skriptets allowlist-logik och Playwrights testMatch överlever utan logikändring. tests/support/ behåller namnet (förstapartskonvention).

DELBESLUT (b) i samma punkt, för kontext: klassnamnet 'acceptance' byts INTE (defer, Marcus 2026-08-02) — ca 255 förekomster i ca 45 filer, ingen kollisionsfri kandidat; vid framtida byte är kandidaten 'application' (Ember-precedenten). Detta kort rör ENDAST katalog-utplattningen.

BIFYND att ta i samma veva OM ADR-080 ändå öppnas: dess not om tests/visual/support/hermetic.ts pekar på fil som nu bor i tests/support/fixturvarld/hermetic.ts (åldrad pekare, inte fel beslut).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 tests/acceptance/support/ utplattad till fil (researchens form: tests/acceptance/acceptance-bas.ts eller likvärdigt); alla importrader + path-strängar uppdaterade, git mv bevarar historik
- [ ] #2 Full grindkedja grön inkl. acceptance-sviten lokalt; ingen logikändring i urvals-skript/testMatch
- [x] #3 Katalog-referenser i styrande dok korslästa; åldrade pekare rättade eller öppet bokförda
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
Utfört (S112 fix-våg 4, bunt H): git mv tests/acceptance/support/acceptance-bas.ts -> tests/acceptance/acceptance-bas.ts (historik bevarad). 45 spec-filers importrad uppdaterad './support/acceptance-bas' -> './acceptance-bas' (mekaniskt, byte-identiskt bortsett från denna rad — disk-verifierat: 45 filer x 1 rad ändrad, git diff --stat bekräftar). acceptance-bas.ts:s EGNA två interna importer justerade '../../support/...' -> '../support/...' (en katalognivå grundare efter flytten — detta missades INTE i en första körning, fångades av premisspasset innan push).

DIVERGENS mot forskningsdokumentets (docs/research/testklass-namn-och-support-kataloger-2026-08-02.md) kostnadsuppskattning "18 importrader": verklig population 2026-08-26 är 45 filer (T14a i scripts/test-acceptance-urval.sh räknade om det mekaniskt). Antalet acceptance-specar har växt sedan forskningsdokumentet skrevs (2026-08-02); ingen sakfelaktighet i beslutet, bara i det åldrade talet. Forskningsdokumentet självt lämnas orört (frusen punkt-i-tiden-artefakt, samma konvention som ADR-uppdateringar).

Styrande dok korslästa (AC#3): CONTRIBUTING.md (2 ställen), scripts/acceptance-urval.sh (3 kommentarer + SPEC_MONSTER-kommentaren), scripts/test-acceptance-urval.sh (T6 sandlåde-fixtur + T14b LIVE disk-check mot den faktiska sömmen — T14b stärktes med en explicit filexistens-assertion så en framtida omdöpning FÄLLER i stället för att tyst fortsätta "passera"), .github/workflows/ci.yml (kommentar utanför paritet:start/slut-block), tests/support/test-bas.ts (kommentar). scripts/test-acceptance-urval.sh 22/22 gröna efter ändringen (körd lokalt). Historiska arkiv (tasks/sessions/archive/, stängda kort task-59.3/63/65/66/75/110, tasks/threads/T103/T104, docs/research-dokumentet) rörs MEDVETET INTE — de är historisk journal, inte styrande dok; deras path-referenser till den gamla katalogen är korrekta beskrivningar av läget VID DEN TIDPUNKTEN.

ADR-080-bifyndet (not om tests/visual/support/hermetic.ts, åldrad pekare mot tests/support/fixturvarld/hermetic.ts) INTE åtgärdat — kortets egen text villkorar det till "OM ADR-080 ändå öppnas", och denna skiva öppnar den inte. Bokfört öppet, inte tyst tappat.

AC#2 — LÄMNAS AVBOCKAD (öppen): typecheck/biome/build/test:api gröna. test:acceptance (PLAYWRIGHT_ACCEPTANCE_DEV_SERVER=1 npx playwright test --project=acceptance, 368 tester) gav i en full körning 361 passed / 7 failed. Vid isolerad om-körning av de 7 (batchat 2+3+1) självläkte 6 av 7 (persons-list x2, mer-vantelista, hem, login, mer-aktivitetshistorik-filter, tabbar-personer-prefetch) — konsekvent med last-inducerad flakighet, inte kodregression (ingen av filerna har någon annan diff än importradens sökväg). EN TEST kvarstod misstänkt: dokument-rackviddsval.acceptance.test.ts:326 "inline-rullningen: tabb-stopp och max-höjd bara när listan faktiskt rullar" — 4/4 fällningar med ändringarna applicerade, 2/2 gröna med git stash (ändringarna borttagna), interfolierat A,A,B,A,B,A. Ingen trolig kausal mekanism identifierad (den enda relevanta diffen i denna fil/kedja är en importsökväg; typecheck bevisar att importen faktiskt löser rätt modul). Uppmätt systemlast under detta pass: `uptime` load average 17.60/40.62/92.02 (extremt — samtidig fleet-aktivitet, flera post-merge-körningar observerade var 2-4:e minut under samma fönster). Given denna last och avsaknaden av mekanism bedöms fyndet mest sannolikt vara last-inducerad flakighet i en kall Vite-dev-server-uppstart (samma klass som playwright.config.ts:s egna "kall-laddning"-dokumentation, TASK-64/74), men det är INTE dispositivt bevisat — CI:s isolerade runners (utan denna lokala fleet-belastning) är den auktoritativa domaren. Rekommendation till granskaren: läs CI:ns Acceptance-jobb-resultat på den pushade PR:en som facit för AC#2, inte detta lokala pass.
<!-- SECTION:NOTES:END -->
