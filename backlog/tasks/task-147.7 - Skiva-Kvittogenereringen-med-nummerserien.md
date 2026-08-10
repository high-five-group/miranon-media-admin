---
id: TASK-147.7
title: 'Skiva: Kvittogenereringen med nummerserien'
status: To Do
assignee: []
created_date: '2026-08-10 07:03'
updated_date: '2026-08-10 07:21'
labels:
  - ready-for-agent
dependencies:
  - TASK-147.5
parent_task_id: TASK-147
priority: high
ordinal: 344000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Kvittot genereras ur betalningsdata som klass C-bilaga — en PDF per mottagare, via singelloop-grenen. Räknaren bor i basen (additivt, ADR-063), numret allokeras server-side vid genereringen, formatet synligt avgränsat från Rogers serie (eget prefix + löpnummer + årssuffix, start skild från ett). En betalning kvitteras i exakt ETT system. Egen ADR mintas för nummerserien (klarar ADR-baren per PRD § ADR-koppling).

FÖRKRAV (PRD DoD 10): Roger-avstämningen om kvittogränsen bokförd FÖRE bygget — de fem frågorna står i sessionsdok S102; Marcus tar dem med Roger i dag.

Täcker användarberättelser: 20, 21, 22, 23, 24.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Roger-avstämningen bokförd i kortets notes (fem frågorna besvarade, eller Marcus-beslut med efterhandsbekräftelse öppet bokförd)
- [ ] #2 Kvittonummer: unikhet under samtidighet bevisad + ingen retroaktiv omnumrering + server-side-allokering
- [ ] #3 Kvitto-PDF genereras per mottagare och bevisas FRAMME som bilaga
- [ ] #4 ADR för nummerserien mintad
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MARCUS-BESLUT 2026-08-10 (S102, kvittogränsen — Roger-feedback i efterhand, öppet bokfört per PRD DoD 10):

(a) Appens kvittoserie ERSÄTTER Rogers manuella kvittogenerering i fakturasystemet. Allt som prickas av i appen (Swish/bankgiro/plusgiro) kan få app-kvitto. Kvittot är en AKTIV handling (Lotta skickar) — aldrig automatik. Sällsynta faktura-fall (vid förfrågan, Rogers system) prickas av UTAN app-kvitto — en betalning kvitteras i exakt ett system.
(b) Format: MM-<år>-<löpnummer>, start 1001 (MM-2026-1001) — synligt avgränsad från Rogers serie.
(c) Kvittoinnehåll: datum, belopp, betalsätt, event, kundnamn, Miranons org-uppgifter. MOMSRADEN ÖPPEN PUNKT: Rogers bekräftelse av momsstatus krävs innan kvitton går skarpt till kunder — skattefakta gissas aldrig.
(d) Ångrad avprickning efter utskickat kvitto: kvittot består med sitt nummer + notering. Kreditrutin + bokförings-export = Roger-feedback senare, ej v1.

Kvitterat i klartext av Marcus i huvudsessionen (S102). AC 1 därmed uppfylld i formen 'Marcus-beslut med efterhandsbekräftelse öppet bokförd'.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Kvittonummer: unikhet + beständighet + server-side bevisad (PRD DoD 8-arv)
- [ ] #6 Roger-avstämningen bokförd före kvitto-skivan låses (PRD DoD 10-arv)
<!-- DOD:END -->
