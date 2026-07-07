---
id: TASK-4.3
title: 'Skiva: Nästa event + Obetalda till facit'
status: To Do
assignee: []
created_date: '2026-07-07 08:56'
labels:
  - ready-for-agent
dependencies:
  - TASK-4.2
parent_task_id: TASK-4
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Nästa event-kortet (temporalt nästa event, primär-tint) renderar per facit: kortrubriken INNE i kortet (text-xl semibold, sentence case, mörk RENDERAT); dagar-kvar som VIT pill topp-höger med de exakta formerna "71 dagar kvar" / "1 dag kvar" / "Idag", härledd ur eventets startdatum; metagrupp i text-small: eventnamnet (medium; HELA kortet klickyta via stretched link till eventets sida — korrekt länksemantik, inga nästlade länkar), ort med kartnålsikon, långdatum ("15 september 2026") med kalenderikon; "X av Y platser bokade" (caption, secondary) med tunn beläggningsstapel (vit track, primär-dämpad fyllnad) — allt inom tokensystemet. Obetalda anmälningsavgifter-kortet: BARA antalet (text-3xl semibold) under sin kortrubrik.

Täcker användarberättelser: 4, 5, 6, 7, 8.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Dagar-kvar-pillens tre former exakta ('71 dagar kvar'/'1 dag kvar'/'Idag') härledda ur startdatum (e2e med route-mockade datum)
- [ ] #2 Klick var som helst på Nästa event-kortet landar på eventets sida; inga nästlade länkar (e2e + axe)
- [ ] #3 Metagruppen renderar eventnamn/ort/långdatum med ikoner per facit; kortrubriken mörk semibold sentence case RENDERAT (computed-style)
- [ ] #4 'X av Y platser bokade' + beläggningsstapel vars fyllnadsandel matchar X/Y (renderad mätning)
- [ ] #5 Obetalda visar ENDAST antalet i text-3xl semibold (e2e)
- [ ] #6 Axe-0 på Hem kvarstår
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT K10-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [ ] #6 Facit-avprickningen: varje berörd facit-/byggkravspunkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
<!-- DOD:END -->
