---
id: TASK-213.9
title: 'Skiva: Å8 — Fynd 1: Antal anmälningar / Antal anmälda (§O3, efter §27)'
status: To Do
assignee: []
created_date: '2026-08-14 17:24'
labels:
  - ready-for-human
dependencies:
  - TASK-213.8
parent_task_id: TASK-213
ordinal: 396000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: på Psionautics-eventet (`recQ2TPsY69fQXA8a`) går `Antal
anmälningar` från 88 till 79 och `Platser kvar` från 0 till 9 — eventkortets
tal matchar eventsidans register, i stället för att visa "Fullt" när
sanningen är 79 aktiva av 88 totalt (9 avbokade räknas i dag med).

**Bevisat i planens pass (M-a, M-b), inte härlett:** fältet är ett
ovillkorat `count` över länkfältet och räknar avbokade och inställda.
Fix: ersätt `count` med en ROLLUP över `Anmälningar.Är aktiv (1/0)` med
`SUM` — FÖRUTSATT att skiva 8 (Å7/O3) är landad och verifierad, annars ärvs
§27:s defekt in i den nya räkningen.

**BLAST-RADIUS — läs innan något rörs.** Följdfälten `Anmäld beläggning (%)`
(`fldqkyeE7cVHMNRpH`), `Platser kvar` (`fldaqwIdTNJ54Xn5P`) och `Antal
slutbetalning saknas` (`fldgv8tekGEbNBZfw`) bygger alla på `Antal anmälda`.
**Automation A6 triggar på `Anmäld beläggning (%) = 1`** — att ändra
nämnaren ändrar NÄR A6 fyrar, i en delad prod-bas där Psionautics är gäst.
`schema_reference.md:789-790` visar dessutom ett interface som exponerar
båda fälten. Läs A6:s skriptkod (claude.ai-connectorns `get_automation`)
FÖRE denna skiva rör prod.

**R3, inte R1:** ett fält kan inte byta typ via API:t — bytet görs troligen
som nytt fält + omstyrning av följdfälten, vilket kräver export/förbild
FÖRE och en egen landning.

**HITL — Marcus-moment, obligatoriskt.** Fälttypbyte i Airtables UI som rör
en LIVE automation (A6) i en DELAD prod-bas. Prod-mutationen sker ALDRIG
utan uttalat Marcus-GO för just denna skiva, och A6:s skriptkod läses FÖRE.

Källa: `docs/research/bas-atgardsplan-2026-08-14.md` § P3 · Å8 (Fynd 1), med
underlag i `bas-defekt-konsumtionskarta-2026-08-14.md` § Fynd 1 och
`schema_reference.md:1409,789-790`.

Täcker användarberättelser: 8
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Eventplanering.Antal anmälningar (fldU5MCQmagdHtz4G) ersatt av en rollup över Anmälningar.Är aktiv (1/0) med SUM — förutsatt att skiva 8 är landad och verifierad (O3)
- [ ] #2 Automation A6:s skriptkod (triggervillkor Anmäld beläggning (%)=1) läst via claude.ai-connectorns get_automation FÖRE prod-mutationen, och dess triggerpunkt efter fixen dokumenterad
- [ ] #3 På Psionautics-eventet (recQ2TPsY69fQXA8a) går Antal anmälningar 88→79 och Platser kvar 0→9 i prod, verifierat efter landning
- [ ] #4 Rollback-väg: export/förbild av det gamla count-fältet sparad FÖRE typbytet (fältet kan inte byta typ via API, R3)
- [ ] #5 Marcus-GO för prod-mutationen inhämtat och citerat innan fälttypbytet utförs i prod
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Rollback-väg dokumenterad och bevisat reversibel (formeltext eller record-ID:n sparade verbatim) FÖRE varje prod-mutation, per skiva
- [ ] #6 Marcus-GO för prod-mutationen explicit citerat i skivans Implementation Notes, per skiva
<!-- DOD:END -->
