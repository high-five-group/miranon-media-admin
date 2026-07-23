---
id: TASK-18.18
title: >-
  Skiva: Eventväljaren på manuell anmälan-sidan — förvald från djuplänken,
  bytbar (review-iteration 4)
status: To Do
assignee: []
created_date: '2026-07-23 09:56'
labels: []
dependencies:
  - TASK-18.12
parent_task_id: TASK-18
ordinal: 86000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus review-våg (2026-07-23), riktnings-beslut kvitterat ('Vi gör så istället'): manuell anmälan-sidan får en EVENTVÄLJARE överst — förvald med eventet man kom ifrån (djuplänks-kontexten), öppningsbar som lista för att byta event, så att Lotta kan stanna på sidan och fortsätta lägga in anmälningar till andra event. Branschledar-precedent: Linear (New issue-teamväljaren) · Stripe (kundväljaren på create-payment) · Notion. Väljarens STÄNGDA läge bär B-formens kontextrad-grammatik (kursfärgs-prick + eventnamn font-medium + ort + kollapsat datumspann) — ersätter den råa eventlabel-raden (punkt 11-fyndet). ÖPPNA DESIGNBESLUT före bygge (Code-rekommendation i parentes): (a) route-semantik — byte navigerar URL:en till /event/$eventId/ny-anmalan (URL:en alltid sann/delbar, samma grammatik som ?vy-kontraktet) (rek. JA); (b) formulär-state vid byte — ifyllda personfält BEHÅLLS (samma person till annat event är ett verkligt flöde; rensa är ett knapptryck) (rek. BEHÅLL); (c) list-innehåll — kommande event, senaste först, sökbar vid många (rek.; efterregistrering på genomförda = öppen fråga); (d) komponent — React Aria Select/ComboBox ur primitiv-biblioteket, 11-ribban (rek. Select först, ComboBox om sök behövs). ready-for-agent flippas på Marcus kvittens av a–d eller grillning.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus designbeslut a–d bokförda (kvittens på rek. eller grillnings-utfall)
- [ ] #2 Väljaren renderad: förvald från djuplänken, bytbar; stängda läget bär B-formens kontextrad (prick + namn medium + ort + kollapsat spann); rå eventlabel borta ur UI:t
- [ ] #3 Route-/state-semantiken per beslut a–b; e2e täcker förval + byte + djuplänk; axe 0 på ytan
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
