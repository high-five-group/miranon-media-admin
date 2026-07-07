---
id: TASK-4.4
title: 'Skiva: Anmälningslistan till facit'
status: To Do
assignee: []
created_date: '2026-07-07 08:56'
labels:
  - ready-for-agent
dependencies:
  - TASK-4.2
parent_task_id: TASK-4
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
"Nya anmälningar att hantera"-kortet renderar per facit: KOPPAR-kontur runt kortet + koppar-varningsikon (20) vid rubriken; de ~25 senaste anmälningarna i en inline-rullbar lista (maxhöjd, centrerad rundad scrollmarkör, luft mellan markör och innehåll); ZEBRA varannan rad (dämpad ton, rundade rader, INGA skiljelinjer); rad utan chevron = namn (16 semibold) / kursnamn · ort · kortdatum (14) / relativ tid "för 2 tim sedan" (12 dämpad). Eventets identitet på raden hämtas via klient-side-join mot den redan hämtade eventlistan (B4 — INGEN ny EF, ingen bas-ändring, read-only orört; öppet reviderad dataväg, se PRD-beslut 9). Radklick landar på EVENTETS sida (B1); rad utan event-koppling renderas olänkad med "Utan event". Rullningsområdet är fokuserbart och tangentbordsmanövrerbart med begripligt tillgängligt namn (B6).

Täcker användarberättelser: 9, 10, 11, 12, 13, 14, 18.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Raden visar namn / kursnamn · ort · kortdatum / relativ tid med typografin 16/14/12 RENDERAT (computed-style; route-mock)
- [ ] #2 Radklick landar på eventets sida; rad utan event-koppling olänkad med 'Utan event' (e2e)
- [ ] #3 Zebra varannan rad utan skiljelinjer, rundade rader (renderad verifiering)
- [ ] #4 Koppar-kontur + koppar-varningsikon vid rubriken (renderad verifiering)
- [ ] #5 ~25 rader i rullbar lista med maxhöjd och centrerad rundad scrollmarkör
- [ ] #6 Rullningsområdet tangentbordsfokuserbart med begripligt tillgängligt namn; axe-0 på Hem (e2e + axe)
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
