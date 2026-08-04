---
id: TASK-135
title: >-
  Fynd: heartbeat-svep skrev aldrig main-avancemang-raden — usage-blocket lovar
  att den alltid skrivs
status: To Do
assignee: []
created_date: '2026-08-04 10:37'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 221000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
MÄTT 2026-08-04 (S96): PR #684 mergades 10:19:45Z (main 52898a9c → c227593f). Svepet (scripts/heartbeat-svep.sh, startat --quiet i loop-läge, rå-logg i sessionens task-fil) loggade i minst tre svep EFTER mergen enbart ARMERINGS-KANDIDAT/RÖTT-rader — ingen avancemang-rad någonsin. Usage-blocket (§ ANVÄNDNING, ~rad 74) säger ordagrant: "LARM-raderna (RÖTT/DIRTY/ARMERINGS-KANDIDAT/main-avancerade) skrivs ALLTID — de är hela poängen med svepet." Kod och dokumentation motsäger varandra: antingen respekterar avancemang-raden --quiet felaktigt, eller skrivs den inte alls i loop-läget.

KONSEKVENS, T112-klassen: orkestreraren väcktes aldrig av landningen; Marcus fångade stagnationen (~12 min senare) — ytterligare en instans av utebliven väckning, nu i den mekanism som byggdes för att stänga klassen.

ARBETE: (1) laga så att avancemang-raden skrivs även under --quiet (gammal→ny SHA i raden), eller — om skriptets struktur ger ett bättre snitt — rätta dok + ge raden en explicit alltid-på-klass; testfallen avgör formen; (2) tvåsidigt bevis i scripts/test-heartbeat-svep.sh: nytt fall som fäller orört skript och passerar efter fixen; (3) verifiera mot .heartbeat-svep-policy.conf att inget config-värde påverkar radklassen.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
