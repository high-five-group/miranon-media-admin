---
id: TASK-275.1
title: 'Skiva: Basstruktur — Räckvidd/Kursfamilj/Kursnivå på Bilagor'
status: Done
assignee: []
created_date: '2026-08-17 15:34'
updated_date: '2026-08-20 07:16'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-275
ordinal: 496000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Basen bär räckviddsdimensionen (ADR-118 beslut 4): fälten skapas via Airtable-MCP i staging först, verifieras, sedan prod — samma valslag som Eventplanering (data-model § ADR-115-fälten). Marcus GO given i grillningens slutkvittens 2026-08-17. Täcker användarberättelser: grunden för 1-5.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Bilagor-tabellen i STAGING och PROD bär tre nya fält: Räckvidd (singleSelect: Event / Kurstyp / Alla event) samt Kursfamilj och Kursnivå med exakt samma valslag som Eventplanerings motsvarande fält — alla fält-ID:n bokförda i rapporten per bas
- [x] #2 Befintliga Bilagor-rader default-migrerade till Räckvidd = Event i båda baserna (dagens sanning) — antal rader per bas bokfört, count-verifierat före/efter
- [x] #3 docs/reference/data-model.md § Bilagor uppdaterad med de nya fälten (båda basernas ID:n, valslag, skrivbarhet) enligt referensens etablerade form
- [x] #4 Ingen applikationskod rörd i denna skiva — ren basstruktur + referensregistrering (diff-bevis)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Räckvidd/Kursfamilj/Kursnivå-fälten skapade på Bilagor-tabellen i staging OCH prod via Airtable-MCP, befintliga rader default-migrerade till Räckvidd=Event, data-model.md uppdaterad — PR #1577 (3f9092d6), CI grön per jobb.
<!-- SECTION:FINAL_SUMMARY:END -->
