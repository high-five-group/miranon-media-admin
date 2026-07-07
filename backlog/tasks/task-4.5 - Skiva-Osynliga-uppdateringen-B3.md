---
id: TASK-4.5
title: 'Skiva: Osynliga uppdateringen (B3)'
status: To Do
assignee: []
created_date: '2026-07-07 08:56'
labels:
  - ready-for-agent
dependencies:
  - TASK-4.3
  - TASK-4.4
parent_task_id: TASK-4
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Alla Hem-hämtningars bakgrundsuppdateringar är HELT osynliga (stale-while-revalidate): tidigare data renderas orörd under tyst omhämtning (placeholderData-mekaniken), ingen spinner, blur, dimning eller layout-rörelse någonstans på Hem; innehåll ändras ENDAST när datat faktiskt ändrats. Enda ärliga undantag: kall första-laddning visar ett lugnt laddläge. Bevis per S55 Del 11-mönstret: renderad före/under/efter-identitet med bevisat aktiv omhämtning (neutraliserad muspekare; jämför text-kanter, inte border-boxar — L246-mätfällorna). Persist-cache ingår INTE (bokförd senare förfining, PRD-beslut 10).

Täcker användarberättelser: 15, 16.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ingen visuell indikation under bevisat aktiv bakgrundsomhämtning: renderat FÖRE == UNDER == EFTER (identitetsbevis med neutraliserad pekare)
- [ ] #2 Oförändrat data ger noll synlig förändring; ändrat data byter endast berörda värden utan layout-rörelse (containrar mät-stilla)
- [ ] #3 Kall första-laddning visar laddläge — asserterad med robust vänte-strategi, inte fast delay (TASK-3-fyndet)
- [ ] #4 Hela e2e-/axe-sviten grön
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
