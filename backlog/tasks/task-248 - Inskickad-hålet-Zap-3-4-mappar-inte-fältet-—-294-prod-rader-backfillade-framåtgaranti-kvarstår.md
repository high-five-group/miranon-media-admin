---
id: TASK-248
title: >-
  Inskickad-hålet: Zap 3/4 mappar inte fältet — 294 prod-rader backfillade,
  framåtgaranti kvarstår
status: In Progress
assignee: []
created_date: '2026-08-16 22:26'
updated_date: '2026-08-16 22:32'
labels:
  - airtable
  - backfill
  - datakvalitet
  - prod
dependencies: []
priority: high
ordinal: 455000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fältet Inskickad (fldNtSHQivkL26B6L, dateTime) på Anmälningar (tbloOcrppVoyrHbrq) i prod-basen app8uGPrVCVOm6LfD stod TOMT på 294 av 868 rader (mätt 2026-08-17 via REST, paginerat).

ROTORSAK (verifierad mot docs/reference/schema_reference.md rad 1085-1172): Zap 3 (Expressformular) och Zap 4 (Huvudformular) mappar INTE Inskickad. Endast Zap 1 (Anmalan-Psionautics.se) och Edge Function create-registration satter den. Alla zappar satter daremot Rad skapad.

ATGARD: backfill av Inskickad = Rad skapad pa de 294 raderna. Marcus-mandat 2026-08-17 (verbatim: GO pa tid-atgarden).

FRAMATGARANTIN AR INTE STANGD AV DETTA KORT. Halet ar levande: senaste raden utan Inskickad skapades 2026-08-16, dagen fore backfillen. Utan en framatgaranti (Airtable-automation A12 eller Zap-mappning) aterkommer defekten pa varje ny Huvudformular-anmalan.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Alla rader med {Inskickad} = BLANK() i prod-basens Anmalningar har fatt ett varde
- [x] #2 Vardet ar instant-identiskt med radens Rad skapad
- [x] #3 Ingen rad med befintligt Inskickad-varde rordes
- [x] #4 Ingen sidoeffekt i annan tabell (Deltaganden-antalet oforandrat)
- [x] #5 Rotorsaken och fallan bokford i data-model och execute-log
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
FRAMATGARANTIN — A12, skapad av orkestreraren 2026-08-17 (EJ av detta kort, EJ av mig).

STATUS VID DENNA BOKFORING: configurationStatus valid, deploymentStatus UNDEPLOYED. Marcus slar pa den i Airtable-UI:t — plattformen tillater ingen agent-aktivering. Framatgarantin ar alltsa INTE stangd forran den aktiveringen skett; backfillen tackte historiken, A12 ska tacka framtiden.

A12:s FORM (wflVeU33Etsi8g8wh), enligt orkestreraren:
  trigger:  recordCreated pa Anmalningar
  villkor:  Inskickad isEmpty
  atgard:   updateRecord, Inskickad = getWorkflowExecutionIsoDateTime()  (A8-formen)

KOLLISIONSKONTROLL — sex celler, orkestreraren rapporterar samtliga PASS:
  1. delad trigger med A1/A2 utan faltoverlapp
  2. triggar ej A7 (watchFields = Slutbetalning + Event-lank)
  3. triggar ej A3/A9/A10/A11 (inga villkor ror Inskickad)
  4. ingen sjalvloop (create-trigger, update-skrivning)
  5. EF-/Zap1-rader overtrampas ej (guard pa trigger-snapshot dar faltet redan ar satt)
  6. ingen interaktion med backfillen (update != create)

KALLMARKNING OCH VAD JAG SJALV KUNNAT PROVA:
Ovanstaende ar ORKESTRERAR-RAPPORTERAT (kalla: live-listning av A1-A11 via claude.ai-connectorn 2026-08-17 + A8 read-back wfl1iYPrEmlKpEsRU). Jag har INTE kunnat verifiera A12:s existens eller form oberoende: claude.ai-connectorn nekade mig med permission_error ('Unable to verify organization membership'), och PAT-MCP-servern kan inte se automationer. Behandlas darfor som obelagt fran min sida.

EN cell kunde jag dock prova oberoende, och den HALLER: cell 2:s pastaende om A7:s watchFields. Jag laste A7 (wflDxN31sRJNWCqfu) ur miranon_automations_COMPLETE.json och fick watchFields = [fldIImadnJUZHr5Qh (Slutbetalning), fldi3enUaMdbuGSlm (Event)] — exakt vad orkestreraren angav, och samma matning som bevisade att MIN backfill-PATCH inte kunde fyra A7.

ATERSTAENDE VERIFIERING (ej mitt kort): att A12 faktiskt satter faltet, matt pa en verklig ny Huvudformular-anmalan EFTER aktiveringen. En odeployad automation ar en avsikt, inte en garanti.
<!-- SECTION:NOTES:END -->
