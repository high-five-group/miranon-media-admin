---
id: TASK-8.4
title: 'Skiva: Hem till Lugnt laddläge'
status: To Do
assignee: []
created_date: '2026-07-11 22:55'
updated_date: '2026-07-12 11:36'
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
- [ ] #1 Tom cache → Hem renderar rubriker + kort-chrome direkt med skeleton-block endast i datakropparna; kortens och listans boundingBox IDENTISK under laddning och efter data (layout-skift ≈ 0, e2e-mätning)
- [ ] #2 'Laddar…'-textraderna borta ur Hem; anmälningslistans yta dimensionsreserverad med listrads-block som speglar kommande innehåll
- [ ] #3 Framträdande-beteendet implementerat per task-8.1:s låsta form (kommentaren på detta kort) — e2e-bevisat
- [ ] #4 Laddande containrar bär aria-busy + tillgängligt laddbesked; reduced-motion → statiska block (emulateMedia); axe 0 violations på Hem i laddläge
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review: Marcus-granskning i webbläsaren av laddläget godkänd (per skiva med UI-yta; L220/L269)
- [ ] #6 Layout-skift ≈ 0 bevisad med renderad mätning före granskning (L245/L246; task-4.5-bevismönstret)
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
