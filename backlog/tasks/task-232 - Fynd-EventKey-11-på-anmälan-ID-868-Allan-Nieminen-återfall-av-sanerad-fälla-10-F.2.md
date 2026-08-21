---
id: TASK-232
title: >-
  Fynd: EventKey 11 på anmälan ID 868 (Allan Nieminen) - återfall av sanerad
  fälla 10/F.2
status: To Do
assignee: []
created_date: '2026-08-15 23:37'
updated_date: '2026-08-21 09:14'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 433000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bifynd ur TASK-229:s olänkade-svep (2026-08-16): anmälan ID 868 (Allan Nieminen, Rad skapad 2026-05-12) bär EventKey '11' - en återkommande instans av buggen i data-model.md §Kända fällor 10 / F.2 som sanerades 2026-04-26. Ny rad med felformen har alltså uppstått EFTER saneringen - antingen kör en formel/automation fortfarande den gamla logiken för vissa grenar, eller finns en oidentifierad skapandeväg. GÖR: (1) läs fälla 10/F.2:s historik i data-model.md, (2) rotorsak (vilken väg skapade raden med kort EventKey), (3) datafix av ID 868 i basen - PROD-WRITE kräver Marcus-GO, (4) uppdatera data-model.md-fällan med återfallsinstansen. Raden är också en av de 7 kvarvarande olänkade i 229-svepet - samordna.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Rotorsaken till återfallet belagd eller öppet obestämbar med uteslutningar
- [x] #2 ID 868 datafixad i basen efter Marcus-GO
- [x] #3 Fälla 10/F.2 i data-model.md uppdaterad med återfallet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BIFYND ur TASK-248 (Inskickad-backfillen, 2026-08-17) — OMFATTNINGEN AR STORRE AN DETTA KORT ANTAR.

Kortet beskriver EN rad (ID 868, Allan Nieminen). Mätning mot prod-basen (app8uGPrVCVOm6LfD, tbloOcrppVoyrHbrq, REST paginerad, 2026-08-17) visar 26 rader med EventKey utan Event-prefix — inom den delmängd (294 rader) som saknade Inskickad. Hela tabellen är INTE genomsökt för detta; 26 är ett GOLV, inte totalen.

EventKey '11': 17 rader — ID 856, 857, 864, 865, 868, 872, 875, 885, 886, 889, 900, 901, 906, 914, 939, 944, 946
EventKey '10': 9 rader  — ID 850, 913, 938, 940, 947, 967, 970, 972, 986

MONSTER: samtliga 26 bär 'Från formulär = Huvudformulär' (Zap 4). Ingen annan formulärklass förekommer. Det pekar rotorsaken mot Huvudformulärets pre-fill-parameter (EventKey kommer dynamiskt via URL enligt schema_reference.md rad ~1170), inte mot en formel/automation i basen.

TIDSSPANN: 2026-04-26 (ID 850) till 2026-08-15 (ID 986). Kortet anger att fälla 10/F.2 sanerades 2026-04-26 — den tidigaste återfallsraden bär SAMMA datum. Återfallet började alltså omedelbart och pågår: senaste instansen är 2026-08-15, dagen före denna mätning. Buggen är LEVANDE, inte historisk.

Ingen av dessa rader ändrades av TASK-248 utöver fältet Inskickad — EventKey rördes ALDRIG (mandatet var fält-avgränsat).

S110 (2026-08-21): ROTORSAK BELAGD — inte formel/automation utan Elfsight Event Calendar-widgeten på miranon.se (8d8c059d-…): handskrivna anmälningslänkar per kalenderpost, kopierade poster behåller gamla URL-parametrar. '11' = juli-Fjärrskådningspostens nyckel, '10' = oktober-postens. ID 868 (Allan Nieminen) låg i 17-klustret som S107 länkade till Event-60 2026-08-17 — datafixad. Fälla 10/F.2 i data-model.md omskriven S110 (hypotesen falsifierad, felklassen utvidgad med tyst felmatchning: 64 rader mätta, städade). Vakt-designen fortsätter i T157.

Rättelse: tråden heter T158, inte T157 (S109 landade sitt T157 parallellt 2026-08-21 — omnumrerat vid konfliktlösning).
<!-- SECTION:NOTES:END -->
