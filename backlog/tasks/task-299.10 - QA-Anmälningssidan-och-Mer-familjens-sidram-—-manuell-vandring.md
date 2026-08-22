---
id: TASK-299.10
title: 'QA: Anmälningssidan och Mer-familjens sidram — manuell vandring'
status: To Do
assignee: []
created_date: '2026-08-22 19:38'
labels:
  - ready-for-human
dependencies:
  - TASK-299.1
  - TASK-299.2
  - TASK-299.3
  - TASK-299.4
  - TASK-299.5
  - TASK-299.6
  - TASK-299.7
  - TASK-299.8
  - TASK-299.9
parent_task_id: TASK-299
ordinal: 550000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell vandring i browsern efter att alla skivor landat. TESTPLAN, i ordning. (1) Öppna Hem, klicka åtgärdskö-raden — verifiera att du landar på anmälningssidan i filtrerat läge, att rubriken säger hur många rader som väntar, och att 'Visa alla anmälningar' tar dig till hela listan. (2) I hela listan: kontrollera att varje rad bär initialer, namn, hur länge sedan anmälan kom in och vilket event den gäller, och att statusen sitter på exakt samma plats i varje rad oavsett namnlängd. (3) Leta upp en rad som behöver kopplas om och klicka den — verifiera att du hamnar i resolutionen, inte på eventet. (4) Jämför radhöjden mellan en rad med status och en utan: de ska vara exakt lika höga. (5) Töm filtret till noll träffar och verifiera att tomt läge säger något vänligt. (6) Gå igenom alla fem Mer-sidorna i tur och ordning och verifiera att tillbaka-knappen ser likadan ut och sitter på samma ställe. (7) Verifiera att väntelistan och intresserade bär initialcirklar men att maillogg inte gör det. (8) Öppna persondetaljen och check-in och kontrollera att de ser ut som de gjorde före passet, i den omfattning du valde i skiva 2. (9) Upprepa steg 1-3 och 6 på telefon. (10) Slå på förstärkt kontrast i systemet och verifiera att inget tappar sin gräns eller sin betydelse. Fynd registreras som NYA kort med exakt symptom och förväntat beteende — aldrig som retuschering av landade kort. Täcker samtliga användarberättelser.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Alla tio stegen i testplanen genomförda på desktop och de utpekade även på mobil
- [ ] #2 Varje fynd registrerat som eget kort med exakt symptom och förväntat beteende
- [ ] #3 Marcus godkänner helheten i klartext, eller pekar ut vad som återstår
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 axe 0 på varje ny/ändrad yta i alla tillstånd (lista, filtrerat, tomt, fel)
- [ ] #6 Dev-växeln riven före arbetsenhetens stängning; formen kvar (ADR-103 B2 steg 4 — villkor och växlar, aldrig form)
<!-- DOD:END -->
