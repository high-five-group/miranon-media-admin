---
id: TASK-162.1
title: 'Skiva: Promoverings-grinden + manifest-utvidgningen'
status: To Do
assignee: []
created_date: '2026-08-08 07:39'
updated_date: '2026-08-08 08:17'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-162
ordinal: 301000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prefaktoreringen som gör promoveringen enkel: bevismekanismen byggs FÖRE någon flip. Variant-lägets renderade form fångas som ariaSnapshot-referenser i den hermetiska fixturvärlden — de blir grinden som skiva 2 och 3 bevisas mot, och registrets mekaniska facit. Facit-manifestet utvidgas så rivningsspärren täcker registret. Täcker användarberättelser: 13.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 ariaSnapshot-referenser fångade ur variant-läget i hermetiska fixturvärlden: åtgärds-ytan + registrets fyra lägen (default, aktivt filter, Bor över-kryss, noll träffar), incheckade som grindens facit
- [x] #2 Grinden tvåsidigt bevisad: grön på identisk yta, RÖD på avsiktligt muterad
- [x] #3 Facit-manifestet bär registrets yta med källor; png-frånvaron öppet deklarerad (prototypen i variant-läget är facit per ADR-102 B1)
- [x] #4 check-facit-grinden grön efter utvidgningen
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Promoverings-grinden byggd som Playwright-spec tests/visual/eventsida-promoverings-grind.spec.ts (ADR-103 B4), körd mot ?variant=a&data=verklig i hermetiska fixturvärlden. Sex ariaSnapshot-referenser incheckade under tests/visual/__aria__/eventsida-promoverings-grind.spec.ts/ (2x per visual-desktop/visual-mobile = 12 filer): atgarder-kort, skriv-ut-kort, register-default, register-aktivt-filter (Visa: Väntar på bekräftelse), register-bor-over, register-noll-traffar (Visa: Avbokade — fixturen har noll avbokade, verifierat mot REGISTRATIONS_RESPONSE). Ny lokator data-testid="register-yta" i Deltagare.tsx (redan gemensam wrapper för variant- och skarpa-grenen, flippar ingen form). Tvåsidigt grindbevis kört lokalt: grönt (12/12, exit 0) mot identisk yta, rött (exit 1, 2 fällda med exakt diff Förväntat/Mottaget) mot en avsiktlig textmutation i AtgarderKort, mutationen reverterad och grönt återbevisat efteråt. facit.json utvidgat med registrets yta (bilder: [], png-frånvaro öppet deklarerad — facit är ariaSnapshot-referenserna, samma mönster som atgarder-ytan). scripts/check-facit.sh: 5 ytor, grönt. scripts/test-check-facit.sh: 18/18. playwright.config.ts fick expect.toMatchAriaSnapshot.pathTemplate (egen __aria__-katalog, inget platform-suffix eftersom ARIA-strukturen är OS-oberoende till skillnad från pixlar).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter)
- [ ] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i skivans PR
- [ ] #7 Datavägs-invarianten verifierad: inga protoDataMode-grenar flippade
<!-- DOD:END -->
