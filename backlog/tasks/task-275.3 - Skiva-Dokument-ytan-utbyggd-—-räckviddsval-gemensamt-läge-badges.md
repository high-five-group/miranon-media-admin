---
id: TASK-275.3
title: 'Skiva: Dokument-ytan utbyggd — räckviddsval, gemensamt läge, badges'
status: To Do
assignee: []
created_date: '2026-08-17 15:37'
labels:
  - ready-for-agent
dependencies:
  - TASK-275.2
parent_task_id: TASK-275
ordinal: 498000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lotta laddar upp ett dokument, väljer räckvidd, och ser det landa med badge på varje berört event — och kan byta det en gång med effekt överallt. Ände-till-ände ovanpå 275.2:s serverlager, i husets stämplade formspråk. Täcker användarberättelser: 1-5, 7.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Uppladdningsflödet bär räckviddsval (radio: Detta event / En kurstyp / Alla event; kurstyp visar Kursfamilj + valfri Kursnivå) i husets etablerade formspråk — inga nya formuppfinningar (Marcus kvalitetsdirektiv 2026-08-17, PRD § Implementationsbeslut)
- [ ] #2 Dokument-sidan har ett läge som visar gemensamma dokument UTAN valt event; eventläget visar unionen sammanflätad med räckviddsbadge i husets Pill-grammatik
- [ ] #3 Åtgärdssidans bilageväljare visar unionen med badge och kan bifoga gemensamma bilagor
- [ ] #4 Ersätt/Radera är inte tillgängliga i eventkontext för gemensamma bilagor (badgen bär förklaringen) men tillgängliga i räckviddsläget — UI-lagret ovanpå serverskyddet i 275.2
- [ ] #5 Tillgänglighet 11: namngivna etiketter, fokusordning, contrast-more och reduced-motion gröna; acceptanstester uppdaterade
- [ ] #6 Dokument-ytan är i övrigt identisk med facit tasks/sessions/bilagor/s102-dokument-konvergens/facit.json ytan Dokument-ytan lista + Visa-overlayens tre klasser i dess SENAST stämplade form; utbyggnaden bokförd i amenderings-sidofil för Marcus omstämpling — godkand-fältet rörs aldrig
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-granskning utförd mot tasks/sessions/bilagor/s102-dokument-konvergens/facit.json (ADR-102 R3) — avvikelser utöver de beslutade: noll
- [ ] #6 SEKVENSKRAV verifierat: task-273.4 landad på main INNAN denna skiva startade (samma komponentfil)
<!-- DOD:END -->
