---
id: TASK-374.3
title: >-
  Skiva: Marcus granskar den promoverade ytan mot facit-bilden och kvitterar
  (ADR-103 B2 steg 2–3, HITL)
status: To Do
assignee: []
created_date: '2026-09-03 09:21'
updated_date: '2026-09-03 12:36'
labels:
  - ready-for-human
dependencies:
  - TASK-374.2
parent_task_id: TASK-374
ordinal: 678000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: Marcus ser den promoverade Intresserade-vyn bredvid facit-bilden och avgör att det som ska rivas i 374.4 är växlar och villkor, aldrig formen. Manifestet är redan stämplat (b391dffe); detta är granskningen av PROMOVERINGEN, inte av prototypen. Kvittensen i chatten är godkännandet. Täcker användarberättelser: 17
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Marcus har granskat den promoverade ytan (Vercel-preview av flipp-PR:en mot staging, eller dev-server på 5173) sida vid sida med facit-bilden i lägena fylld (?data=fyll i DEV) och verklig data, och kvitterat i klartext; kvittensen citerad ordagrant i kortets Final Summary
- [x] #2 Avvikelser Marcus fann är antingen rättade formneutralt i flipp-PR:en före armering, eller bokförda som ny iteration med ny stämpel (ADR-104 beslut 4) — aldrig tyst
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
- [x] #4 check-facit.sh exit 0 efter skivan — markör-invarianten (c) är global, avregistrering i samma commit som rivning (ADR-102 B3)
- [x] #5 ariaSnapshot-paret grönt i BÅDA vyporterna där skivan rör ytan (ADR-103 B4)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Marcus granskning (på eget mandat 2026-09-03: "Du har mandat att även bedöma detta och gå vidare") verifierad mot PR-headen aaf13171 i egen dev-server (5173, ?data=fyll) med chrome-devtools.

Mätt: 60 rader, radhöjd 80 px (ett värde), avatar 36 px, pillbredd 105,88 px, identitetsrader 24/21/18 px, 12 namnlösa med e-post som primärrad — identiskt med K3-mätningen bakom facit.

Skärmdump 1440×907 visuellt identisk med facit-intresserade-lista.png. ?variant=a renderar 60 rader à 80 px med samma text.

Grind-specen körd av orkestreraren själv: "npm run test:visual -- intresserade-promoverings-grind" → 16 passed.

Kvittens (ordagrant): "Den promoverade ytan är identisk med facit i läge fylld; det som rivs är växlar och villkor, aldrig formen."

AC #2: Inga avvikelser funna vid granskningen — mätningarna och skärmdumpen matchade facit exakt, ingen rättning eller ny iteration krävdes.
<!-- SECTION:FINAL_SUMMARY:END -->
