---
id: TASK-226
title: >-
  Prototyp: hem-vyns divergens — tre varianter på dev-route (V1 ro · V2 kontroll
  · V3 skönhet)
status: To Do
assignee: []
created_date: '2026-08-15 09:59'
labels:
  - ready-for-agent
dependencies: []
ordinal: 428000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Divergensfasen i hem-omdesignens ADR-102/103-flöde (grillad samsyn S102 Del 8, Marcus kvittens 2026-08-15). EN nedskriven fråga prototypen besvarar: VILKEN estetisk riktning ska hem-vyns morgonkoll bära — ro (V1 Lugna morgonen: redaktionell, luftig, fri hälsningsrubrik, stillsamt fullbredds-hero), kontroll (V2 Kommandocentralen: räknar-chips, prominenta svep-knappar, allt inom en skärmhöjd) eller skönhet (V3 Bento: asymmetrisk kortmosaik, hero med kursfärgs-accent, tonala ytor ur tolvstegsskalorna)? Alla tre bär SAMMA kvitterade innehåll och blockordning: fri hälsning · Nästa event fullbredd · Nya anmälningar (räknar-rubrik + personlistans initial-form + bekräftelsesvep-INGÅNG) · Förfallna betalningar (antal + initial-lista + påminnelsesvep-INGÅNG; def start−14-deadline passerad + betalning saknas) · Genvägar (manuell anmälan · Åtgärds-sidan) · Senaste aktivitet (kompakt, alla bredder). WOW-ribban: riktiga tokens, riktiga primitiver, riktig staging-data, facit-mönster-stöld (personlistan, Åtgärds-sidan, check-in-D, historiken) — inga gråbox-skisser. UTANFÖR scope: sveparnas egna ytor (knapparna är döda ingångar med tooltip 'byggs i svep-PRD:n'), AppShell/TabBar, all skarp fil — prototypen bor på växlingsbar dev-route. Throwaway-kontraktet: vinnaren konvergeras, förlorarna rivs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tre växlingsbara varianter på en dev-route (ADR-044-mönstret, redirect i prod), alla mot riktig staging-data via befintliga hooks — ingen ny datahämtning byggs
- [ ] #2 Varje variant bär hela den kvitterade blockordningen och är komplett nog att bedömas som WOW-kandidat (tokens/primitiver/a11y-grundform — inga hårdkodade färger)
- [ ] #3 Ingen skarp fil rörd (grep-bevis: diffen ligger under dev-routen + ev. ny prototyp-mapp)
- [ ] #4 DoD-kvartetten grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
