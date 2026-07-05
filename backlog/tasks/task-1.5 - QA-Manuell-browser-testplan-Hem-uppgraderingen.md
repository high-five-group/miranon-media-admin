---
id: TASK-1.5
title: 'QA: Manuell browser-testplan Hem-uppgraderingen'
status: To Do
assignee: []
created_date: '2026-07-05 21:09'
labels:
  - ready-for-human
dependencies:
  - TASK-1.1
  - TASK-1.2
  - TASK-1.3
  - TASK-1.4
parent_task_id: TASK-1
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell browser-genomgång efter skivorna 1–4 (utöver design-review-grinden per skiva — detta är helhetens slutprövning):
(1) Logga in → Hem hälsar 'Hej {namn}!' — aldrig e-postadressen.
(2) Nästa event-kortet: klicka mitt på kortet, på texten och nära kanten — samtliga landar på eventets detaljsida.
(3) Obetalda avgifter: antalet stämmer mot verklig staging-data; de första namnen syns under.
(4) Nya anmälningar: klicka en rad → rätt events anmälda-vy; hitta eller simulera en anmälan utan event → raden visar 'Utan event' och är olänkad.
(5) CTA 'Visa alla anmälningar' → /mer/anmalningar; listan visar senaste först; rad-klick → rätt anmälda-vy; posten finns även i Mer-landningens länklista.
(6) Tabbaren: ikon + etikett + tydlig aktiv-markering korrekt på alla fyra flikar; navigera runt hela appen.
(7) Tomma lägen (route-mock eller tömd staging-data): vänliga texter, inget ser trasigt ut.
(8) Tangentbord: hela Hem + anmälningslistan utan mus — fokus synligt överallt.
(9) Systeminställningar: förhöjd kontrast och reducerad rörelse respekteras.
(10) Print: Hem skrivs ut läsbart.
(11) Mobil-bredd: vertikal stapling, max två kort i rad, tabbarens träffytor ≥ 44 px.
Fynd → NYTT kort (backloggen växer som en graf) — denna plan retuscheras aldrig.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Samtliga 11 testplan-punkter genomgångna i webbläsaren; varje fynd registrerat som NYTT kort med exakt symptom + förväntat beteende
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
