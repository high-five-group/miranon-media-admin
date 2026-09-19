---
id: TASK-464.11
title: >-
  Skiva: reglerna efter privat — T171 'aldrig publikt igen med denna historik',
  licensernas omprövningsvillkor, kort för e-postvakten
status: To Do
assignee: []
created_date: '2026-09-19 10:50'
updated_date: '2026-09-19 11:55'
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
Alla fyra AC klara (D0, ren dokumentation). AC #1: CLAUDE.md § Instruktioner (persondata-raden) + tasks/threads/T171-personuppgifter-i-publikt-repo.md punkt 4 bär samma hårda regel (repot blir ALDRIG publikt igen med denna historik; framtida publicering sker som ny historiklös kopia), källmärkt Del 17 beslut 9. AC #2: docs/reference/atkomst-och-nycklar.md ny sektion 'Köpta licenser (GitHub) — omprövningsvillkor' med datum 2026-09-19 och Marcus ord ordagrant ('jag kör väl på att köpa båda då … de kollar vi på då'; omprövningsvillkor 'när appen är klar och aktiv utveckling upphört'). Hemvalet motiverat i PR-kroppen (ADR-100 §1 domän 5, extern-system-register). AC #3: TASK-482 mintat (e-postvakt, config-driven, tvåsidig testsvit, CI-wirad — bara kortet, ingen grind byggd). AC #4: npm run check:docs kört naket två gånger (efter första rundan och efter polish-rundan), exit 0 båda gångerna, '16 gröna'. Dataskyddsbedömningen (T171 § Öppet, ny bullet) är en neutral pekare till Marcus/Miranon Media — ingen juridisk bedömning gjord. Premiss-pass: origin/main var vid start 6d96fcbe (ej aacf3673 som uppdraget angav som utgångsläge — repot rör sig fort under parallell S127/S128-drift; ny gren skapad direkt från fetchad origin/main). Repot fortfarande PUBLIC vid skrivning (väntat, TASK-464.10 är Marcus helgpunkt, ej gjort).
<!-- SECTION:NOTES:END -->
