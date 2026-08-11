---
id: TASK-197
title: >-
  check-pausade-sessioner.sh falsklarmar: nåbarhetstest presenteras som
  kronologi — parallella PR:er före pausen flaggas som arbete efter paus
status: To Do
assignee: []
created_date: '2026-08-11 18:30'
labels: []
dependencies: []
priority: high
ordinal: 362000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Belägg (rödklassningen 2026-08-11, run 31454392944 job 93665096969): grinden flaggade S103 för 'arbete landat efter pausen' på commits fa41a1be (22:21:14+02) och 0507c77c (22:34:10+02) — men paus-commiten 9af3c004 är 23:02:29+02, så arbetet FÖREGÅR pausen med 28 resp 41 min. Mekanismen: skriptets rad 152+198 tar PAUS_SHA=git log -1 -- <fil> och listar PAUS_SHA..HEAD — ett NÅBARHETSTEST, inte kronologi. Arbetet landade via parallella PR:er (#1151 merge 20:25Z, #1153 merge 20:48Z) som paus-grenen grenades ut före → icke-nåbara från paus-SHA → flaggade. Mekaniskt motbevis: git merge-base --is-ancestor fa41a1be 9af3c004 → NEJ (dito 0507c77c). Fix-riktning: jämför %ct mot paus-commitens %ct före larm, ELLER mät mot första-förälder-historiken på main. Larmet återkommer varje natt tills grinden lagas eller S103 stängs — S103 pausades KORREKT, det är grinden som räknar fel. Oprövat om tidigare nätter drabbats (endast denna run granskad).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
