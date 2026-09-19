---
id: TASK-464.11
title: >-
  Skiva: reglerna efter privat — T171 'aldrig publikt igen med denna historik',
  licensernas omprövningsvillkor, kort för e-postvakten
status: To Do
assignee: []
created_date: '2026-09-19 10:50'
updated_date: '2026-09-19 12:16'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-464
priority: medium
ordinal: 827000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beslut 8–9 (S126 Del 17) ska bo i fil, inte i en session. (1) CLAUDE.md-raden om persondata och tasks/threads/T171 får regeln: repot får ALDRIG bli publikt igen med denna historik; en framtida publicering (t.ex. komponentbiblioteket som portfölj) sker som NY, historiklös kopia. Historiken skrivs INTE om (avvisat: förstör SHA-bevisföringen, tar inte tillbaka det redan klonade). (2) Omprövningsvillkoret för Code Security + Secret Protection bokförs där det hittas: 'när appen är klar och aktiv utveckling upphört' (Marcus ord). (3) Minta ett kort för e-postvakten (T171 punkt 3) med mätbar AC. (4) Dataskyddsbedömningen står som Marcus punkt i T171 — agenten gör ingen juridisk bedömning. Rena dokumentändringar (D0). Källa för besluten: tasks/sessions/2026-09-17-session-126.md Del 17 (grillad samsyn, Marcus kvittens 2026-09-19) + Del 11 (ledstjärnan). Underlag: docs/research/actions-minutbudget-2026-09-18.md. Varje faktapåstående här är en HYPOTES tills du prövat den mot disk (ADR-086). Täcker användarberättelser: 2.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Regeln står i CLAUDE.md och i T171, ordagrant förenlig med Del 17 beslut 9
- [x] #2 Omprövningsvillkoret för licenserna står i docs/reference/atkomst-och-nycklar.md eller motsvarande register, med datum och Marcus ord
- [x] #3 Kort för e-postvakten finns, med AC som går att pröva
- [x] #4 npm run check:docs grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
RUNDA 2 (Marcus 'Rätta fynden först'): tre review-fynd i docs/reference/atkomst-och-nycklar.md § Köpta licenser rättade i en commit. Fynd 1 (motsägelse TYST vs röd): uppdelat i två mekanismer med varsin källa — (a) push-skydd/Secret Protection: TYST avstängning, citat ur docs.github.com via docs/research/repo-privat-konsekvenser-2026-09-18.md § B3 ('Advanced Security features will be disabled...'); (b) CodeQL: repot kör en EGEN advanced-setup-workflow (.github/workflows/codeql.yml, TASK-464.2/PR #2558, bekräftat på disk) — hämtade själv (WebFetch) docs.github.com/.../cannot-enable-codeql-in-a-private-repository OCH about-github-advanced-security; ingen av sidorna innehåller frasen 'red X' eller beskriver runtime-felet — granskarens hypotes om exakt ordalydelse var FALSK, skrivet ärligt i dokumentet, märkt 'INTE mätt i vårt repo — mäts vid TASK-464.10'. Fynd 2 (citat i fel kolumn): omprövningsvillkoret ('när appen är klar...') och köp-citatet ('jag kör väl på att köpa båda då...') särskiljs nu — kontrollerat mot Del 17 rad 8: bara ordet 'klar' står i citattecken i källan (Beslut-kolumnen), köp-citatet ligger i en annan kolumn (Marcus). Fynd 3 (pris): '30/19 USD per aktiv committer och månad' + not om repots enda mänskliga aktiva committer (marcus803), källa samma research-fil rad ~216-227. npm run check:docs kört naket efter rättningen: exit 0, 16 gröna.
<!-- SECTION:NOTES:END -->
