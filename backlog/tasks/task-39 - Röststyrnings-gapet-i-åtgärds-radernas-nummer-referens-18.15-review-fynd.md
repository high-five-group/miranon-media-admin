---
id: TASK-39
title: Röststyrnings-gapet i åtgärds-radernas nummer-referens (18.15-review-fynd)
status: Done
assignee: []
created_date: '2026-07-25 00:58'
updated_date: '2026-08-24 14:41'
labels:
  - ready-for-human
  - wontfix
dependencies: []
ordinal: 100000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Review-pilot-fynd (task-18.15, utanför skivans scope; T86). SYMPTOM: åtgärds-radernas radnummer 1–6 är aria-hidden dekor (AT-pariteten Marcus-låst i 18.15) och ingår INTE i det tillgängliga namnet — en röststyrningsanvändare som följer en manual som säger 'gå till åtgärd 4' och säger 'klicka fyra' träffar ingenting; kortets eget motiv (referentbarhet i instruktioner/manualer, Gunilla-principen) är alltså inte uppfyllt för röststyrning. FÖRVÄNTAT BETEENDE: spänningen manual-referens ↔ accessible name avgörs medvetet INNAN manualerna skrivs — t.ex. nummer i accessible name (reviderar AT-paritetsbeslutet öppet), manualspråk som bär radNAMNET ('gå till åtgärd 4, Markera alla obetalda som betalda'), eller dokumenterat avslag. Ingen defekt i 18.15-leveransen — beslutspunkt före manual-arbetet.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fött ur review-pilotens utanför-scope-sektion 2026-07-25 (granskat träd e9cff7d8). Oetiketterat tills Marcus klassar (ADR-053: aldrig tyst förkastande).

Beslutat av Code på Marcus-mandat 2026-08-24 (GO i klartext), S112. Motiv: objektet (Åtgärds-sidans numrerade rader) rivet via TASK-162.2. Verifierat mot Atgarder.tsx 2026-08-24 innan stängning; ingen divergens.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-24 14:41
---
WONTFIX 2026-08-24 (S112, Marcus-mandat): objektet fyndet gäller är rivet. src/components/events/detail/Atgarder.tsx (rad 37-51, 83-91, 257-274) dokumenterar att Åtgärds-gruppen — den rubricerade sektionen med de numrerade rutor-raderna 1-6 detta fynd (aria-hidden radnummer utanför accessible name) rör — är PROMOVERAD BORT via TASK-162.2 (ADR-103 B2 steg 1): 'den gamla grenen fanns bakom ?variant=a-villkoret, nu riven (git bevarar)'. Ersatt av AtgarderKort ('Gå till åtgärder') + SkrivUtKort, som inte bär numrerade rader alls. Röststyrnings-gapet fyndet beskrev finns inte kvar att åtgärda.
---
<!-- COMMENTS:END -->
