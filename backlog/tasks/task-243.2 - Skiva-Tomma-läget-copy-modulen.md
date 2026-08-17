---
id: TASK-243.2
title: 'Skiva: Tomma läget + copy-modulen'
status: In Progress
assignee: []
created_date: '2026-08-16 14:34'
updated_date: '2026-08-16 23:42'
labels:
  - ready-for-agent
dependencies:
  - TASK-243.1
parent_task_id: TASK-243
ordinal: 448000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lotta med noll väntande handlingar möts av ett lugnt, positivt kvitto i stället för tomma listor. Tomma lägets form + bevakningsradernas copy-modul (delad kortcopy + line-clamp-2-skyddsnät, varv 4-leveranserna PR #1388) promoveras ur prototypkällorna. Täcker användarberättelser: 7, 8.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Hem-vyn på / är identisk med facit tasks/sessions/bilagor/s102-hem-konvergens/facit.json ytan 'hem-vyn V1 "Lugna morgonen"' i läge tom (desktop + mobil)
- [x] #2 Tomt läge visar grön bock + 'läget är under kontroll' — tomt känns tryggt, inte trasigt; bevakningsraden är helt dold utan träff
- [x] #3 Bevakningsradernas kortcopy-modul + line-clamp-2-skyddsnätet promoverade ur prototypens varv 4: fullständig text utan klippning, aldrig ellips på meningsbärande text
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Facit-granskning utförd mot tasks/sessions/bilagor/s102-hem-konvergens/facit.json (ytan 'hem-vyn V1', läge tom, desktop + mobil)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PREMISS-PASS-FYND (ADR-086): uppdraget presenterade kortet som promoverings-byggarbete. Disk-verifiering visade motsatsen — TASK-243.1:s helträds-kopiering ur VariantRo.tsx (facit-prototypen) hade REDAN portat tomma lägets grön-bock-copy (NyaAnmalningar.tsx/ForfallnaBetalningar.tsx) OCH bevakningsradens kortcopy-modul + line-clamp-2 (Bevakningsrad.tsx/hem-derivations.ts) byte-identiskt ur PR #1388 (diff mot commit f14d8ee9, 0 avvikelser). Ingen funktionell kod saknades. Detta korts faktiska leverabel blev därför DoD #5:s egen, ännu ej utförda facit-granskning i tom-läge (243.1:s AC var scopad till verklig) — inte ny implementation. Divergensen bokförs öppet enligt ADR-086, byggd inte tyst vidare på.

VERIFIERING (AC #1/#2), live mot skarpa /hem, egen dev-server :5190 (ej 5173): get-registrations intercepterad till registrations:[] (samma tomtLage-princip som prototypens TOM_LISTA), get-events + fem övriga kärn-EF:er (get-waitlist/get-leads/get-mail-log/get-segments/get-activity-log) proxade oförändrade (Förberedelseskärmen/ADR-112 kräver alla sju). Desktop (1440x) + mobil (375x) jämförda mot facit-hem-v1-tom-desktop.png/-mobil.png: blockordning, gröna bock-kvittona (läget är under kontroll / Inga förfallna betalningar.) och Bevakningsradens fullständiga frånvaro matchar exakt. Enda avvikelsen är AppShells egen chrome (TabBar/avatar) — facit-prototypen saknar AppShell (redan bokförd distinktion, Hem.tsx BREDD-avsnittet).

VERIFIERING (AC #3), live mot skarpa Bevakningsrad.tsx (grid-formen, TASK-247) med syntetisk värsta-fall-rad KLONAD ur PR #1388:s permanenta demoData.ts-fixtur (91 tecken, 3 stämplade + 12 ostämplade → 12 deltagare saknar eventinfo): realistiska namn klipper inte. Det avsiktligt extrema namnet klipper EFTER två rader i BÅDA viewports (scrollHeight>clientHeight, mätt) — men samma sträng klipper HÅRDARE i den låsta prototypens egen rendering (120px mot 48px vid 375px). Ingen regression; känt, icke-blockerande gränsfall, dokumenterat i Bevakningsrad.tsx docblock (ADR-102 B2 — åtgärdande avsteg kräver ett uttryckligt Marcus-beslut, tas inte här).

OVÄNTAT FYND (ej i scope, rapporteras öppet): CI-run 31979179510 (post-merge.yml, Staging API+E2E-jobbet) slutförde med conclusion=failure under detta korts test:api-körning (staging-preflighten, TASK-77, höll lokal körning tills den var klar). Orelaterat till denna commits diff (dokumentation i .tsx-docblocks). Flaggat för orkestreraren — ingen egen åtgärd tagen.

DoD-kvartett (nakna exitkoder): typecheck 0, biome check 0 (0 findings i rörda filer), build 0, test:api 788 passed / 0 failed (efter att staging frigjorts, 1.3m).
<!-- SECTION:NOTES:END -->
