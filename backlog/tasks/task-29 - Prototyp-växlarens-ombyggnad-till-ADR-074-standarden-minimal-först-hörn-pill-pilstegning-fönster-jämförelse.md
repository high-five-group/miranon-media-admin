---
id: TASK-29
title: >-
  Prototyp-växlarens ombyggnad till ADR-074-standarden (minimal-först hörn-pill
  + pilstegning + fönster-jämförelse)
status: Done
assignee: []
created_date: '2026-07-22 14:38'
updated_date: '2026-07-22 15:50'
labels:
  - ready-for-agent
dependencies: []
references:
  - >-
    docs/decisions/ADR-074-prototyp-substratets-adress-struktur-och-vaxlar-standard.md
  - tasks/sessions/2026-07-22-session-76.md
  - src/components/dev/PrototypeSwitcher.tsx
priority: medium
ordinal: 78000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bygg om src/components/dev/PrototypeSwitcher.tsx till ADR-074 beslut 2–3 (Vercel-Toolbar-formen). Design LÅST i grillad samsyn S76 Del 3 — inga öppna designfrågor. Stående delad dev-komponent (DEV-grindad); INTE 11/11/11-produktbiblioteket, men körbarhets-golvet gäller. API-ytan mot befintliga call-sites (variants + aliases-props) består; aliases är legacy-only per ADR-074 beslut 1.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Default-läget är minimerad hörn-pill nere höger ovanför bottom-naven (aldrig bottom-center); expansion är opt-in och localStorage-minnet består (nyckeln mm-proto-switcher-minimerad återanvänds; default-värdet inverteras)
- [ ] #2 Minimal-läget bär ‹/›-pilstegning som cyklar skarpa vyn → varianterna i ordning, och visar aktiv nyckel + steg-badge (identitetsraden i kompakt form)
- [ ] #3 Expanderad panel behåller variant-chips + identitetsrad + demo/verklig-växeln och får handlingen 'Öppna i nytt fönster' (window.open på samma route med vald variant-nyckel — jämförelse i fönster-lagret per ADR-074 beslut 3)
- [x] #4 Utseendet stylas med designsystemets tokens (inga hårdkodade färger; den massiva svarta plattan ersätts); a11y-golvet består (aria-pressed, aria-label, synlig fokus, tab-ordning)
- [x] #5 DEV-grinden består (monteras endast bakom import.meta.env.DEV); produktion renderar skarpa vyn oförändrat
- [x] #6 Befintliga call-sites (EventsListPrototype, EventDetailPrototype m.fl.) fungerar utan ändring av sina props
- [x] #7 RAIL-FORMEN (facit-revideringen, ADR-074-amenderingen): vertikal ikon-rail dockad vid höger kant vertikalt centrerad som default; endast ikon-knappar med tooltips (öga=skarpa vyn · variant-bokstäver · data-toggle · nytt-fönster); aktiv variant bär steg-badge; gamla pill/panel-formen borta
- [x] #8 Railen är flyttbar via grip-handtaget (pointer-drag, viewport-begränsad); positionen persisteras (mm-proto-switcher-pos) och överlever omladdning; dubbelklick på grippen dockar tillbaka och rensar nyckeln
- [x] #9 Inga knapp-namn i dev-överlägget kolliderar med appens namn-rymd (bl.a. /^Visa/-frånvaro-assertionen; e2e-sviterna på växlarens routes gröna i samma körform)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FACIT-REVIDERING (Marcus-direktiv under granskningen, ADR-074-amenderingen): AC 1–3 SUPERSEDED av rail-formen (AC 7–9) — ej omötta, ersatta; pill-formen revs öppet (L299 lösningsklass-byte, underkännande #2). Rail levererad: dockad dragbar ikon-rail med tooltips; ref-baserad synkron persistens (side-effect-i-updater-buggen fångad rött-först i L304-skriptet); e2e 56/56 gröna på växlarens routes inkl. det CI-röda /^Visa/-kollisionstestet (run 29933197540 = pill-formens röda; rail läker strukturellt). Känd mindre kvarvaro: tooltip klipper vid extrem vänster-drag (alltid vänster-sida) — noterad, ej blockerande.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit a123254 (leverans 2 rail; leverans 1 dadd8a3 CI-röd → facit-reviderad på Marcus-direktiv) · CI-run 29934613949 grön per jobb · CI-grön-första-pass: nej för kortet (leverans 1 föll på /^Visa/-namn-kollisionen; leverans 2 first-pass grön) · defekter under körning: 2 (dev-överlägg i appens namn-rymd + side-effect-i-setState-updater — båda rött-först-fångade och läkta) · TDD: ej tillämplig (dev-verktyg utan test-harness; L304-script-assertions med rött-först-bevis som ersättningsform)
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
