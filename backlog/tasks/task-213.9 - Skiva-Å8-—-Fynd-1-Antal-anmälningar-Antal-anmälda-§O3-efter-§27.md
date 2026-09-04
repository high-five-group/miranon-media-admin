---
id: TASK-213.9
title: 'Skiva: Å8 — Fynd 1: Antal anmälningar / Antal anmälda (§O3, efter §27)'
status: Done
assignee: []
created_date: '2026-08-14 17:24'
updated_date: '2026-09-03 08:54'
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
- [x] #1 Eventplanering.Antal anmälningar (fldU5MCQmagdHtz4G) ersatt av en rollup över Anmälningar.Är aktiv (1/0) med SUM — förutsatt att skiva 8 är landad och verifierad (O3)
- [x] #2 Automation A6:s skriptkod (triggervillkor Anmäld beläggning (%)=1) läst via claude.ai-connectorns get_automation FÖRE prod-mutationen, och dess triggerpunkt efter fixen dokumenterad
- [x] #3 På Psionautics-eventet (recQ2TPsY69fQXA8a) går Antal anmälningar 88→79 och Platser kvar 0→9 i prod, verifierat efter landning
- [x] #4 Rollback-väg: export/förbild av det gamla count-fältet sparad FÖRE typbytet (fältet kan inte byta typ via API, R3)
- [x] #5 Marcus-GO för prod-mutationen inhämtat och citerat innan fälttypbytet utförs i prod
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Rollback-väg dokumenterad och bevisat reversibel (formeltext eller record-ID:n sparade verbatim) FÖRE varje prod-mutation, per skiva
- [ ] #6 Marcus-GO för prod-mutationen explicit citerat i skivans Implementation Notes, per skiva
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
S112-förberedelse (agent-säkert, 2026-08-24) — AC#2 GJORT. Automation A6 ("A6 - Event fullbokat (Beläggning 100 %)", id wfl0filPx4wyAcaQ8, prod app8uGPrVCVOm6LfD) läst i sin helhet via claude.ai-connectorns get_automation:
Trigger: recordMatchesConditions på Eventplanering (tblVE3UKWl1CKrphV), villkor fldqkyeE7cVHMNRpH ("Anmäld beläggning (%)") = 1 (exakt likhet, inte >=).
Åtgärd: sendEmail till lotta@outsidereality.se + marcus@h5gruppen.se, statisk ämnesrad "Event fullbokat! Ändra status på webbsidan nu." och statiskt meddelande — inga dynamiska fält/formler i mailkroppen.
Konsekvens för fixen: eftersom A6 triggar på EXAKT beläggning=1 (inte tröskel-överskridande), och fixen ändrar täljaren (Antal anmälda, exkluderar avbokade/inställda), kommer A6 fira vid ett ANNAT faktiskt antal aktiva anmälningar efter fixen än före — samma procentvärde (100%) men mot en mindre population. Ingen formel i A6 själv behöver ändras; endast NÄR den fyrar flyttas. Detta är precis vad AC#2 efterfrågar dokumenterat.
Bekräftat samtidigt (identifiersOnly/full describe_table, prod): Antal anmälningar (fldU5MCQmagdHtz4G) är type="count" (ovillkorat, ej rollup) — matchar kortets "M-a/M-b"-premiss exakt. Anmäld beläggning (%) = {Antal anmälda}/{Max antal platser}; Platser kvar = {Max antal platser}-{Antal anmälda}; Antal slutbetalning saknas = {Antal anmälda}-{Antal mottagna slutbetalningar} — samtliga tre följdfält bekräftat beroende av Antal anmälda, exakt som blast-radius-varningen anger.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-09-03 08:54
---
Utförd via TASK-368.1 (S115, 2026-09-03). AC1 uppfyllt i R3-formen kortet förutsåg: inget fälttypsbyte (API:t kan inte byta typ) — i stället NYTT rollup-fält Antal aktiva anmälningar (SUM över Är aktiv, prod fldO9pTic9Mm8G6P4, staging fld1LGJ6HVCLDJhFC) och Antal anmälda ompekad till det; Antal anmälningar (count) kvar orört med beskrivning, eftersom Verksamhetspuls-interfacet summerar det. Skiva 8 (213.8) landad först, samma leverans. AC2: A6 läst via get_automation — trigger Anmäld beläggning (%) = 1, åtgärd sendEmail till lotta@outsidereality.se + marcus@h5gruppen.se; efter fixen fyrar den när AKTIVA anmälningar plus manuella platser når max, inte längre på avbokade. AC3: Psionautics recQ2TPsY69fQXA8a i prod: Antal anmälningar 88 (kvar), Antal anmälda 88→79, Platser kvar 0→9, beläggning 100→90 %. AC4: inget typbyte skedde, så ingen export behövdes — Rollback (formeltext verbatim, mätt före ändring, identisk i staging och prod): Är aktiv (1/0) fld4j7PeckDViTdIB = IF({fldWr5cCPNx9HEKtL}="Avbokad/Ombokad", 0, 1); Antal anmälda fldTQkYOz9O2BGEIZ = {fldU5MCQmagdHtz4G} + {fld8pUb6x2G3YIovs}. Återställ = sätt tillbaka de två formlerna och radera rollup-fältet Antal aktiva anmälningar (staging fld1LGJ6HVCLDJhFC, prod fldO9pTic9Mm8G6P4). Antal anmälningar (count, fldU5MCQmagdHtz4G) rördes aldrig. AC5: Marcus GO citerat i 368.1.
---
<!-- COMMENTS:END -->
