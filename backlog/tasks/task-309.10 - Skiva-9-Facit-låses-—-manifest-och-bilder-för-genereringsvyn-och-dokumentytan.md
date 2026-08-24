---
id: TASK-309.10
title: 'Skiva 9: Facit låses — manifest och bilder för genereringsvyn och dokumentytan'
status: To Do
assignee: []
created_date: '2026-08-23 14:46'
updated_date: '2026-08-24 17:46'
labels:
  - ready-for-human
dependencies:
  - TASK-309.8
parent_task_id: TASK-309
ordinal: 571000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Den godkända formen fryses som regressionsstöd (ADR-074/ADR-102) så framtida ändringar mäts mot den — aldrig före godkännandet. Täcker användarberättelser: 24.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 facit.json + facit-*-bilder i s108-generering (lista · generering × 2 mallar · block-dialog × 4 lägen · efter Skapa · INAKTUELL-rad) och s108-dokumentytan, tagna ur den promoverade ytan EFTER Marcus godkännande i skiva 7; check-facit grön
- [x] #2 Facit-policyns prototyp-markörer uppdaterade; referens-scanningen grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #6 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-309.10, bygg-agentens landning 2026-08-24 (gren task-309.10-skiva9-facit).

AC #2 BOCKAD — mätt. Facit-policyns markörlista är uppdaterad med en MOTIVERAD frånvaro i stället för en ny post: `.facit-policy.conf` § REGEL steg 1 säger 'minus redan-skarpa/redan-promoverade filer', och den identifieringen ger TOMMA MÄNGDEN för dessa två ytor (samtliga fjorton kallor är skarp produktionskod; src/components/dokument/prototyp/ finns inte; inget [PROTOTYPE]-docblock kvar; src/components/dev/ bär bara PrototypeSwitcher.tsx och prototyp-auth). B2 steg 4 utfördes redan i PR #1889, FÖRE något facit.json fanns — en markör här hade aldrig kunnat dö och blivit spegelbilden av TASK-192:s döda-markör-bugg. Referens-scanningen är grön OCH nu aktiv: de två ogodkända manifesten väcker B3-spärren (före landningen var samtliga 13 manifest stämplade och spärren hoppades över helt). check-facit.sh exit 0: '15 manifest, 30 ytor deklarerade, 2 ogodkända (3 registrerade prototyp-markörer verifierade kvar i src/)'.

AC #1 MEDVETET OBOCKAD — en klausul saknas, resten är levererat och mätt. Levererat: 18 facit-bilder i s108-generering (lista · generering × 2 mallar · block-dialogens tre nåbara lägen · datum-läget · efter Skapa · INAKTUELL-rad, båda vyporterna), 4 i s108-dokumentytan, två facit.json med 'godkand': null, check-facit grön (exit 0). EJ uppfyllt: klausulen 'EFTER Marcus godkännande i skiva 7'. TASK-309.8 AC #4 ('Marcus granskar ... och godkänner i klartext') står obockad, och ingen godkännande-mening finns — Marcus GRANSKADE ytan 2026-08-24 och gav fyra ordrar (landade i d9d973d5, PR #1889), men det är granskning, inte godkännande. Manifesten är därför lagda FÖRE stämpeln, som designen föreskriver (ADR-102 B3 / ADR-104 § Beslut 2). Kriteriet stängs när Marcus stämplar via sin egen kanal.

ÖPPEN POST FÖR MARCUS: två manifest väntar stämpel — tasks/sessions/bilagor/s108-generering/facit.json och .../s108-dokumentytan/facit.json.

FORMOBSERVATION SOM BÖR SES FÖRE STÄMPELN (bokförd i manifestens 'not'): vid 375 px trunkeras den Event-mallade radens filnamn till 'Bekr…' och metaraden till 'Event-…' av de fyra ikonknapparna, och i räckviddsläget ligger knapparna delvis ÖVER räckviddsbadgen. Ursprunget är MÄTT och ligger utanför skiva 7: ikonparet kom i TASK-273.4 (commit b881fe64, 2026-08-17), alltså EFTER s102-stämpeln (cc1d7c53) och FÖRE promoveringen (1ec70a85) — verifierat med git merge-base --is-ancestor åt båda hållen. Skivan rör inte formen; bilden och noten finns så att stämpeln blir informerad.
<!-- SECTION:NOTES:END -->
