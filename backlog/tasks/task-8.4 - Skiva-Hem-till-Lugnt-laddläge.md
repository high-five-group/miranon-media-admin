---
id: TASK-8.4
title: 'Skiva: Hem till Lugnt laddläge'
status: Done
assignee: []
created_date: '2026-07-11 22:55'
updated_date: '2026-07-12 21:03'
labels:
  - ready-for-agent
dependencies:
  - TASK-8.1
  - TASK-8.2
parent_task_id: TASK-8
ordinal: 23000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hem-vyns laddläge byts från dagens underkända form (kollapsade kort + 'Laddar…'-textrader som växer — granskningsfyndet S62) till Lugnt laddläge (ORDLISTA). Beteende ände-till-ände: vid tom cache renderas Hem från FÖRSTA bildrutan med riktiga kortrubriker och riktig kort-chrome i full slutgeometri — endast datakropparna visar Skeleton-primitivens block (eventmeta-rader i Nästa event, talet i Obetalda, listrader i Nya anmälningar — blocken speglar det innehåll som kommer); anmälningslistans yta är dimensionsreserverad; när datat landar byts block mot innehåll UTAN att något flyttar sig (layout-skift ≈ 0 — grindkravet, bevisas med boundingBox-mätning under/efter laddning per task-4.5-bevismönstret); framträdande-beteendet följer den form task-8.1 låst (skeleton direkt ELLER ~1 s CSS-driven framträdande-fördröjning — läs 8.1:s kommentar på detta kort före bygget); laddande containrar bär aria-busy + tillgängligt laddbesked per tillgänglighets-checklistan; reduced-motion ger statiska block; 'Laddar…'-textraderna utgår ur Hem och ingen spinner införs (över FK-golvet, öppet bokfört i PRD:n). Axe 0 violations på Hem i laddläge. Täcker användarberättelser: 2, 3, 5, 6, 7, 11, 16.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Tom cache → Hem renderar rubriker + kort-chrome direkt med skeleton-block endast i datakropparna; kortens och listans boundingBox IDENTISK under laddning och efter data (layout-skift ≈ 0, e2e-mätning)
- [x] #2 'Laddar…'-textraderna borta ur Hem; anmälningslistans yta dimensionsreserverad med listrads-block som speglar kommande innehåll
- [x] #3 Framträdande-beteendet implementerat per task-8.1:s låsta form (kommentaren på detta kort) — e2e-bevisat
- [x] #4 Laddande containrar bär aria-busy + tillgängligt laddbesked; reduced-motion → statiska block (emulateMedia); axe 0 violations på Hem i laddläge
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
S66 parallell-batch 2 (do-work-agent, ADR-073): Lugnt laddläge implementerat — DashboardCard bär Roselli-anatomin (role=status + aria-busy + sr-only-laddbesked) med ny obligatorisk pendingBody-prop; korten speglar sina datakroppar (eventmeta-rader/tal/listrads-block, listytan dimensionsreserverad h-80 = laddade listans max-h-80-klienthöjd). role=status-kontraktet oförändrat → task-4.5- och persist-svitens befintliga assertions står orörda. Ny permanent e2e-svit tests/e2e/hem-laddlage.staging.test.ts (AC 1–4; tom cache arrangeras explicit via init-script-removal av persist-nyckeln FÖRE app-boot — auth.setup:s storageState kan bära persistad cache; boundingBox-mätning per task-4.5-bevismönstret med nätverksparkering). E2E-BEVISFORM: PR-CI — port 5173 upptagen lokalt (Marcus dev-server; repo-kontraktets hårda vägran) → varken RÖD- eller GRÖN-körning av e2e-specen möjlig lokalt; specen skrevs FÖRE implementationen (TDD-ordningen hålls i leveransformen). Lokala grindar: typecheck 0 · biome 0 · build 0 · test:a11y 31/31 (semaforfönster) · test:api först 6 röda av DOKUMENTERAD env-klass (TEST_REGISTRATION_RECORD_ID saknas i lokal .env.test; CONTRIBUTING § Not) → med BUILD-LOG-seed-ankaret satt 294 passed + 2 väg D-timeouts (staging-latens) → riktad omkörning grön (semaforfönster). AC 1–4 bockas post-CI (bevisen är e2e-runnet); DoD 5 väntar Marcus design-review, DoD 6 bockas när CI-runnets mätning är grön.

GRANSKNINGSFÄRDIG (S66 parallell-batch 2): levererad 2946b29c3bdc1351064fa18f4a33dead8b941c55, PR #55, PR-CI 29207342730 + main-CI 29207597879 gröna per jobb. e2e-bevisform: pr-ci. Väntar design-review (DoD 5) — Done-flippen är Marcus. AFK-proveniens: batch 2 pipeline TASK-8.4.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review: Marcus-granskning i webbläsaren av laddläget godkänd (per skiva med UI-yta; L220/L269)
- [x] #6 Layout-skift ≈ 0 bevisad med renderad mätning före granskning (L245/L246; task-4.5-bevismönstret)
<!-- DOD:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-07-12 11:36
---
Formbeslut från mätskivan task-8.1 (AC 2): **skeleton från första bildrutan — ingen framträdande-fördröjning.**

Motivering per samsynens 1 s-regel (S63 Del 2 beslut 4; PRD-implementationsbeslut 8): det uppmätta kallstartsfönstret prod-lika (staging-mode-bygge mot deployade läs-EF:er, tom cache, hård omladdning, 8 rundor per query) ligger KLART över 1 s i båda klasserna — varm EF: samtliga kort-fönster 1311–1696 ms (median ~1,5 s; n=7 per query); kall dataväg: 7634–7942 ms (n=1; nedre gräns för helt kall produktion). Lokal bundle-servering gör värdena till nedre gräns för verklig drift. "Ofta under 1 s"-grenen (framträdande-fördröjning ~1 s) är därmed INTE tillämplig — ett fördröjt skeleton skulle bara addera ~1 s tom yta ovanpå ett fönster som redan är 1,3–7,9 s.

Konsekvens för bygget (8.2/8.4): skeletonen renderas omedelbart vid isPending — ingen CSS-fördröjningsmekanism behövs. Efter task-8.3 (persist) täcker skeletonen enbart äkta kallstartsfall (första besöket på enheten, efter utloggning, efter versions-bump) — exakt de fall där fönstret är som störst (kall dataväg).

Metod + råvärden: task-8.1 implementation notes.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · leverans 9ffdd5dc → PR #55 → merge 2946b29c · PR-CI 29207342730 + main-CI 29207597879 gröna per jobb · CI-grön-första-pass: ja · defekter under körning: 0 · TDD: spec-först (7 e2e-tester skrivna före implementation; RÖD ej lokalt observerbar — 5173 upptagen, pr-ci-bevisformen; GRÖN delta-verifierad i PR-CI-jobbloggen +7) · Design-review (DoD 5) GODKÄND av Marcus 2026-07-12 i granskningsvågen ('allt ser bra ut'; endast siduppdatering krävdes — inga klient-deps i diffen). AFK-proveniens: S66 parallell-batch 2 pipeline A.
<!-- SECTION:FINAL_SUMMARY:END -->
