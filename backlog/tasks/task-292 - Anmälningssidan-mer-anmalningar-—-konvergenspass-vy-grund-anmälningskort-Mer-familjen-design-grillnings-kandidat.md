---
id: TASK-292
title: >-
  Anmälningssidan (/mer/anmalningar) — konvergenspass: vy-grund, anmälningskort,
  Mer-familjen (design, grillnings-kandidat)
status: To Do
assignee: []
created_date: '2026-08-22 10:59'
labels:
  - ready-for-human
dependencies: []
priority: medium
ordinal: 534000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QA-fynd 284.5 (Marcus, 2026-08-22): klicket på åtgärdskö-raden leder till /mer/anmalningar?visa=atgardskon — den BEFINTLIGA Fas 1-anmälningssidan (task-1.4, routefilen 39 rader) med ett filter (src/routes/_authenticated/mer/anmalningar.tsx:19-38; AnmalningarList.tsx:106-110, 184-202). Sidan är ALDRIG facitstämplad (saknas i alla 12 manifest/27 ytor), har aldrig gått ett konvergenspass (ingen /dev-prototyp, ingen markör i .facit-policy.conf) och inget kort planerade en omdesign. Marcus: 'skitful'. BESLUT (S110 Del 8): sidan ska göras — som EGEN arbetsenhet, INTE som utvidgning av 284 (vaktens prod-värde är oberoende av sidans form; prod-kön är 0 efter städning + rotfix så raden är osynlig tills nästa felkoppling). Process: grillning → /to-prd → prototype UI-gren tvåfas (divergens 3 varianter → konvergens → facit → promovering ADR-103); befintlig yta startar som EXAKT kopia. TRE GRILLNINGSFRÅGOR, disk-mätta: (1) det finns INGEN delad vy-grund — Sidhuvud (rund chevron + header + h1) är en lokal funktion som KOPIERAS (ManuellAnmalanForm.tsx:113-146 → AtgardsSida.tsx:1887; egen variant AktivitetsHistorik.tsx:755; prototypens SidRam aldrig promoverad; DokumentYta.tsx:58 förkastar den) — lyfta till delad bibliotekskomponent (11/11/11) eller kopiera en fjärde gång? (2) initial-cirkeln finns i två kopior + två inline (hem/InitialAvatar.tsx, registrations/PersonMiniKort.tsx, Gruppdynamik.tsx:94, PersonsList.tsx:582), ingen primitiv — samma val. (3) anmälningssidan är en av FEM i Mer-familjen med samma gamla '← Tillbaka till Mer'-textlänk (waitlist, maillog, intresserade, installera-appen) — en sida eller familjens form? SEKVENS: efter 284.6 prod, i egen session (distinkt scope, ADR-051). Grillnings-kandidat: Marcus startar.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Grillning genomförd till samsyn på de tre frågorna (delad vy-grund · initial-primitiv · en sida eller Mer-familjen); ADR-baren prövad öppet per fråga
- [ ] #2 PRD-kort mintat via /to-prd ur grillningen; detta kort stängs med pekare till PRD:n
- [ ] #3 Divergensfasen startar från en EXAKT kopia av nuvarande /mer/anmalningar (prototype-skillens UI-kontrakt), inte från ett tomt blad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
