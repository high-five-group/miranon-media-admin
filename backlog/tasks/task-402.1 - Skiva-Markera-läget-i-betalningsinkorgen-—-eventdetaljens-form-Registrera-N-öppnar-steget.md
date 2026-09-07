---
id: TASK-402.1
title: >-
  Skiva: Markera-läget i betalningsinkorgen — eventdetaljens form, Registrera N
  öppnar steget
status: Done
assignee: []
created_date: '2026-09-05 19:02'
updated_date: '2026-09-07 15:52'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-402
ordinal: 697000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lotta trycker Markera i betalningsinkorgen; varje öppen rad i alla eventgrupper får ett kryss (klara rader har inget), en åtgärdsrad visar 'Registrera N' som primär knapp, 'Markera alla synliga' och 'Rensa', och Esc avbryter läget. I läget bockar ett tryck på raden i stället för att öppna radformuläret. Markeringen bevaras när hon söker eller filtrerar, räknaren 'N markerade' syns även när markerade rader är bortfiltrerade, och markeringen ligger i ett sessionsbundet markeringsminne så den finns kvar när hon går till bekräftelsesteget och tillbaka; den rensas vid registrering, Rensa eller när hon lämnar betalningsfamiljen. 'Registrera N' navigerar till bekräftelsesteget med de markerade anmälningarnas ID:n i sök-parametern ids. Formen ärvs från eventdetaljens markera-läge — samma knappar, samma åtgärdsrad, samma grammatik (S121 Del 2 beslut 6). Täcker användarberättelser: 1, 2, 3, 4, 6, 27.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Markera-läget i inkorgen är identiskt med eventdetaljens markera-läge i form (Markera-knappen, kryss per öppen rad, åtgärdsraden med 'Registrera N' primär, 'Markera alla synliga', 'Rensa', Esc avbryter, tryck på rad bockar) — mätt med DOM-jämförelse mot eventdetaljen, inte ögonmått
- [x] #2 Markeringen bevaras över sök och filter i inkorgen; räknaren 'N markerade' visar rätt tal även när alla markerade rader är bortfiltrerade
- [x] #3 Klara rader (inget kvar att betala) saknar kryss och kan inte markeras
- [x] #4 'Registrera N' navigerar till /mer/betalningar/registrera med ids satt till de markerade anmälningarnas ID:n; tillbaka-pilen från steget återvänder till inkorgen med markeringen kvar
- [x] #5 Markeringsminnet rensas vid registrering, vid Rensa och vid navigation utanför betalningsfamiljen — bevisat i staging-e2e
- [x] #6 Staging-e2e (samma skarv som inkorgens utskicksflödes-test) täcker markera, filtrera, räknare, Registrera N, Esc och tillbaka-pilen, med axe-svep utan fel; api-pure täcker markeringsminnets regler som rena funktioner
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-425: DoD bockad mot belägg — samtliga AC #1-#6 redan avbockade. Final Summary dokumenterar landning PR #2363 → main b1f0dae6 (2026-09-06); review runda 1 (Sonnet 5) 0 fynd/risk låg; review-loop-beslut exit 0; backstopp grön för b360efd5; 14/14 e2e, 25/25 api-pure, axe 0 i två lägen, regression 40/40.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landad som PR #2363 → main b1f0dae6 (2026-09-06 ~05:15 UTC). AFK-proveniens: S121 resume 3 (Marcus mandat vid paus 3), bygg-agent Opus 5 (bokförd tier-avvikelse) i egen worktree, staplad på #2362 och rebasad på dess fix-runda, landad utan rebase efter #2362. Review runda 1 (Sonnet 5): 0 fynd, risk låg, AC #1–#6 håller med förlagan Deltagare.tsx läst i sin helhet; review-loop-beslut exit 0; backstopp grön för b360efd5. Levererat: markerings-minne.ts (sessionStorage, samma modulklass som betalsatt-minne.ts), markera-läget i BetalningsInkorg.tsx med tre kortformer (kryss, inert klar rad, oförändrat), åtgärdsraden i eventdetaljens form (DOM-signaturer byte-identiska mot batch-baren), 'Registrera N' → /mer/betalningar/registrera?ids=…, rensning via efterRegistrering() i steget, Rensa och navigation utanför betalningsfamiljen; 14/14 e2e, 25/25 api-pure, axe 0 i två lägen, regression 40/40. Designval bokförda: formen ärvs, koden inte (ingen extraktion av useMarkeringsLage/MarkeringsBatchBar); 'Markera alla synliga' är union; Esc stänger läget utan att rensa urvalet (PRD:ns tre rensningstillfällen). Fynd utan kort: tests/e2e/helpers/valjar-lista.ts hårdkodar typ Utbildning. Sessionsdok S121 Del 6 §6.6.
<!-- SECTION:FINAL_SUMMARY:END -->
