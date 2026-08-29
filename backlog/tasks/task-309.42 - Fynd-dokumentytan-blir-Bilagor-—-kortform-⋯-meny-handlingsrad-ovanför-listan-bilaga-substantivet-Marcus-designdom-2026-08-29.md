---
id: TASK-309.42
title: >-
  Fynd: dokumentytan blir Bilagor — kortform, ⋯-meny, handlingsrad ovanför
  listan, bilaga-substantivet (Marcus designdom 2026-08-29)
status: In Progress
assignee: []
created_date: '2026-08-29 21:38'
labels: []
dependencies: []
parent_task_id: TASK-309
ordinal: 631000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus prod-vandring 2026-08-29 (S113 resume 2, före testplanen): tre anmärkningar på dokumentytan — punkt 5 (T176, Alla-togglen), 'Event-mallad' i metaraden, och de högerställda ikonknapparna som var inkonsekventa och många (fem på delade-ytan). Orkestrerarens designbedömning mot prod (skärmdumpar + DOM-mätning: 6 rader varav 2 dolda utan scroll-signal, fem lika viktade grå ikonlådor, namn trunkerat, mobil wrap-inkonsekvens): listan saknade hierarki. Marcus GO: bygg om direkt i skarp yta (ingen prototyp), lokala commits, push när nöjd; senare samma kväll: kort-format i stället för rader (hover på hela kortet — separatorer + radhover såg fel ut) och 'bilaga' som substantiv (ORDLISTA § Bilaga) inkl. Mer-fliken 'Bilagor'. AFK-mandat: promovera till prod när orkestreraren godkänt. Byggt av bygg-agent (Opus) i huvudkatalogen, granskat av orkestreraren med egna mätskript mot dev-servern. Höjdlåsets hook (useLastaListhojd) KOD orörd; Marcus kvitterade explicit att separator-halvan (fjärde linjen klipps / sista raden bär linje) rivs — fyra-synliga-med-inline-rullning kvar. Landar i EN PR (tio commits): klass-ledet bort · radformen + Meny-primitiv (react-aria MenuTrigger/Popover/Menu) · fokusring-släckare för menybehållare · handlingsrad (Ladda upp bilaga + Skapa bilaga ▾) och filterraden riven (T176) · 44 px-knappar, full bredd på mobil · linjering · trigger-fokusring efter musstängning · kortformen · bilaga-substantivet i etiketter, flik och rubrik · resterande texter. Kvittots 'Ladda ner' utgår medvetet (kvittoserien lever i Åtgärder, AtgardsSida.tsx § Skicka kvitto). Route /mer/dokument, testid:n och komponentnamn orörda (URL-byte = eget kort).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Listan är kort per bilaga direkt på den grå behållaren (inget kort-i-kort); hover tonar hela kortet; mätt: kort vit rgb(255,255,255), hover rgb(237,238,233), behållare rgb(245,245,243); kortkanter = handlingsradens knappkanter (0 px avvikelse vid 390 och 1280)
- [ ] #2 Höjdlåset håller: useLastaListhojd:s kod byte-identisk med main; li 124 px uniform; exakt fyra hela kort synliga (fjärde bottom ≤ ul bottom, femte top ≥ ul bottom); båda höjdlås-acceptance-sviterna gröna med kort-invarianter i stället för separator-asserts
- [ ] #3 Varje kort: typglyf · namn = Öppna-knapp (44 px, full bredd) · EN ⋯-meny (Ladda ner · Ersätt · Skapa om · Ändra räckvidd · ─ · Radera i rött) — tangentbord, fokus tillbaka till triggern, ingen fokusring på behållare eller trigger efter musstängning, ring kvar vid Escape/Tab
- [ ] #4 Ovanför listan: Ladda upp bilaga + Skapa bilaga ▾ (Bekräftelsebilaga · Deltagarinformation · Betalningskvitto), 44 px, staplade i full bredd under sm; filterraden och ?typ= rivna; Event-mallad borta ur metaraden; kortram 8 px
- [ ] #5 Bilaga är substantivet: Mer-fliken, h1 och listans aria-label 'Bilagor'; 'Delade bilagor'; 'Till bilagorna'; tomlägen/laddning/fel/tillbaka-knappar/räckviddsdialog på 'bilaga'; ORDLISTA § Bilaga-notens 'Dokument är YTAN' rättad i docs-PR
- [ ] #6 Landat via review-grinden (ADR-105) och verifierat i prod med smoke-kontot read-only: h1 Bilagor, Skapa bilaga synlig, kortform, ingen filterrad, inget Event-mallad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
