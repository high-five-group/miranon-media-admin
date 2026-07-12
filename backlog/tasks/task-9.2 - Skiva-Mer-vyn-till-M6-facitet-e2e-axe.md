---
id: TASK-9.2
title: 'Skiva: Mer-vyn till M6-facitet + e2e/axe'
status: To Do
assignee: []
created_date: '2026-07-12 10:16'
labels:
  - ready-for-agent
dependencies:
  - TASK-9.1
parent_task_id: TASK-9
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mer-landningen NYSKRIVEN mot M6-facitet (throwaway-kontraktet: prototypkod befordras aldrig; facit-källa sessionsdok S64 Del 3 + bilagor s64-mer-konvergens, återupplivningsväg bokförd där). Beteendet ände-till-ände: Lotta öppnar Mer-fliken och möter facitets lugna kortmeny — rubrik, två luftgrupper, centrerad utloggning — och varje rad leder till sitt mål; tangentbord och skärmläsare får samma struktur (nav-landmärke, radnamn utan ikonbrus, handling utanför nav). Skarv 2 (mer-e2e/axe) utökas mot facitet. Täcker användarberättelser: 1, 2, 3, 7, 10, 12 (+ 4–6, 8–9 på vynivå)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 /mer renderar M6-facitet: synlig h1 'Mer' (30/600), shell-headern av, sex NavCard-rader i två grupper ([Anmälningar, Väntelista, Intresserade, Maillogg] · [Skapa nytt event, Bygg segment]) med PRD:ns ikonval inkl. Filter för Bygg segment
- [ ] #2 Måtten computed-verifierade mot facitet: sidmarginal 16 (ingen egen sidopadding), radhöjd ca 58, 10 px radgap inom grupp, 32 px vertikal rytm, topp-luft i Hem-paritet
- [ ] #3 Logga ut: ghost-Button med utloggnings-ikon + text, centrerad under grupperna, UTANFÖR nav-landmärket; logout-kedjan fungerar oförändrat (utloggning → inloggningssidan)
- [ ] #4 Mer-e2e/axe-sviten grön: befintligt kontrakt består (nav-namnet, Logga ut utanför nav, ingen Inställningar, axe 0, logout-flödet) + facit-assertioner (synlig h1, header-frånvaro, tvågruppsstruktur, ingen chevron)
- [ ] #5 Sidtitel-annonseringen oförändrad ('Mer' i fönstertitel + route-annonsering)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review mot M6-facitet godkänd av Marcus (granskningsfärdigt läge per ADR-071 för UI-skivor)
- [ ] #6 Facit-paritet: renderad vy computed-verifierad mot M6-måtten (sessionsdok S64 Del 3)
<!-- DOD:END -->
