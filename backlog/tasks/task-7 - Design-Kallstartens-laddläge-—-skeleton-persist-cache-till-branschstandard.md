---
id: TASK-7
title: 'Design: Kallstartens laddläge — skeleton + persist-cache till branschstandard'
status: To Do
assignee: []
created_date: '2026-07-11 21:05'
labels: []
dependencies: []
references:
  - tasks/sessions/2026-07-11-session-62.md
  - docs/specs/ACCESSIBILITY-CHECKLIST.md
  - src/router.ts
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Granskningsfynd S62 (design-review av task-4.5, Marcus i webbläsaren): kallstartens laddläge håller inte branschstandard. Vid hård omladdning renderas Hem-korten KOLLAPSADE med textrader ('Laddar nästa event…', 'Laddar obetalda avgifter…', 'Laddar nya anmälningar…') och växer när datat landar — layout-skift; anmälningslistans yta saknas helt tills släppet. Marcus-kravet (kvitterat S62): inget ska röra sig, helst inget synligt laddande alls — 'det ska bara vara där'; måste laddning ändå synas ska den ske enligt branschstandard eller bättre.

Förväntat sluttillstånd (tvådelat — designas IHOP, inte var för sig):
1. persist-cache (persistQueryClient): appen öppnar med senast kända data direkt — kallstarten existerar i praktiken bara allra första gången. Redan bokförd som senare förfining i PRD TASK-4 beslut 10 + 'Utanför omfattningen' (Del 11-optionen, S55) och som defer-kommentar i src/router.ts:19 ('persistQueryClient defer till Fas 6/8') — detta kort ÄR den förfiningens designtillfälle.
2. Skeleton-laddläge för de fall laddning ändå syns: dimensionsstabila platshållare som matchar slutlayouten EXAKT (kortens och listans slutstorlek reserverad från första render, layout-skift ≈ 0), lugn puls som respekterar prefers-reduced-motion, a11y per docs/specs/ACCESSIBILITY-CHECKLIST.md §Loading-tillstånd (aria-busy + synligt + tillgängligt namn), tokensystemets tre lager (inga hårdkodade färger). NN/g-nyansen beaktas: skeleton meningsfull först när laddfönstret > ~0,5 s — mät det faktiska fönstret innan formen låses.

Väg (Marcus-takt): research (NN/g 'Skeleton Screens 101' + LogRocket skeleton-design + React Aria/FK-mönster; käll-länkar i S62 Del 4) → grillning (design-fork: vad betyder 'lugnt', samspelet skeleton/persist-cache, allra-första-starten, scope utanför Hem) → /to-prd → /to-issues. Repo-specarna bär redan skeleton-mönstret (ACCESSIBILITY-CHECKLIST §Loading, PERFORMANCE-BUDGET-exemplet) — dagens textrader ligger under repots eget spec-golv. Kortet är AVSIKTLIGT oetiketterat: designarbete med Marcus-grind före byggbar spec.
<!-- SECTION:DESCRIPTION:END -->
