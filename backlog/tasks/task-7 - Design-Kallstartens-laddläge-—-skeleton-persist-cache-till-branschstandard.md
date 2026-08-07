---
id: TASK-7
title: 'Design: Kallstartens laddläge — skeleton + persist-cache till branschstandard'
status: Done
assignee: []
created_date: '2026-07-11 21:05'
updated_date: '2026-07-11 22:43'
labels: []
dependencies: []
references:
  - tasks/sessions/archive/2026-07/2026-07-11-session-62.md
  - docs/specs/ACCESSIBILITY-CHECKLIST.md
  - src/router.ts
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Granskningsfynd S62 (design-review av task-4.5, Marcus i webbläsaren): kallstartens laddläge håller inte branschstandard. Vid hård omladdning renderas Hem-korten KOLLAPSADE med textrader ('Laddar nästa event…', 'Laddar obetalda avgifter…', 'Laddar nya anmälningar…') och växer när datat landar — layout-skift; anmälningslistans yta saknas helt tills släppet. Marcus-kravet (kvitterat S62): inget ska röra sig, helst inget synligt laddande alls — 'det ska bara vara där'; måste laddning ändå synas ska den ske enligt branschstandard eller bättre.

Förväntat sluttillstånd (tvådelat — designas IHOP, inte var för sig):
1. persist-cache (persistQueryClient): appen öppnar med senast kända data direkt — kallstarten existerar i praktiken bara allra första gången. Redan bokförd som senare förfining i PRD TASK-4 beslut 10 + 'Utanför omfattningen' (Del 11-optionen, S55) och som defer-kommentar i src/router.ts:19 ('persistQueryClient defer till Fas 6/8') — detta kort ÄR den förfiningens designtillfälle.
2. Skeleton-laddläge för de fall laddning ändå syns: dimensionsstabila platshållare som matchar slutlayouten EXAKT (kortens och listans slutstorlek reserverad från första render, layout-skift ≈ 0), lugn animation som respekterar prefers-reduced-motion, a11y per docs/specs/ACCESSIBILITY-CHECKLIST.md §Loading-tillstånd (aria-busy + synligt + tillgängligt namn), tokensystemets tre lager (inga hårdkodade färger). Tröskel-nyansen beaktas: under 1 s behövs ingen laddindikation alls (NN/g:s trösklar är 0,1/1/10 s och FK:s FLoader visas först efter 1 s; kortets ursprungliga '> ~0,5 s' gick inte att verifiera mot någon auktoritativ källa — öppet korrigerad i S63-grillningen) — mät det faktiska fönstret innan formen låses.

Väg (Marcus-takt): research (NN/g 'Skeleton Screens 101' + LogRocket skeleton-design + React Aria/FK-mönster; käll-länkar i S62 Del 4) → grillning (design-fork: vad betyder 'lugnt', samspelet skeleton/persist-cache, allra-första-starten, scope utanför Hem) → /to-prd → /to-issues. Repo-specarna bär redan skeleton-mönstret (ACCESSIBILITY-CHECKLIST §Loading, PERFORMANCE-BUDGET-exemplet) — dagens textrader ligger under repots eget spec-golv. Kortet är AVSIKTLIGT oetiketterat: designarbete med Marcus-grind före byggbar spec.
<!-- SECTION:DESCRIPTION:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-07-11 22:24
---
S63 grillad samsyn NÅDD (2026-07-12, sessionsdok Del 2 = kanonisk plats; 5/5 beslut på Code-rekommendation A): (1) app-bred princip + Skeleton-primitiv, Hem första implementationsyta · (2) persist med skyddsräcken — rensning vid logout (queryClient.clear()-mönstret), maxAge harmonierad med gcTime (gcTime ≥ maxAge-fällan), buster = app-version · (3) riktigt chrome + förenklade datablock, långsam shimmer L→R, prefers-reduced-motion → statisk, 3:1-kontrast, Roselli-markup · (4) mät-först: kallstartsfönstret mäts innan formen låses (1 s-tröskeln verifierad; 0,5s-referensen riven öppet) · (5) ADR för persist-beslutet (blir 072; T76-pekaren justeras vid mint), principen i PRD/spec. ORDLISTA-post 'Lugnt laddläge' landad (e7a70ac). NÄSTA: /to-prd.
---

created: 2026-07-11 22:43
---
FINAL SUMMARY (S63): design-kortets leverans komplett — (1) research käll-verifierad (web-agent: NN/g, Chung, Viget, TanStack-dok+maintainers, OWASP, Roselli, FK; repo-utforskning: laddlägets implementation, poll-lagret, SECURITY-SPEC, spec-golvet), (2) grillad samsyn 5/5 beslut (S63 Del 2 kanonisk trail), (3) ORDLISTA-posten 'Lugnt laddläge' (e7a70ac), (4) ADR-072 mintad (klient-persist med skyddsräcken), (5) PRD-kortet TASK-8 publicerat med Marcus-kvitterad test-skarv (e2e/axe + a11y-primitiv). Kortets väg research → grillning → /to-prd fullföljd; /to-issues körs på TASK-8. Kortets 0,5s-tröskel öppet riven → 1 s (käll-verifierad).
---
<!-- COMMENTS:END -->
