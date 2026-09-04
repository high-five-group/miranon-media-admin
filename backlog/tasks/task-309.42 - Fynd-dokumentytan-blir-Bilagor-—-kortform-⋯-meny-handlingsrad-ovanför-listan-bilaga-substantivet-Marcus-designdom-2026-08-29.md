---
id: TASK-309.42
title: >-
  Fynd: dokumentytan blir Bilagor — kortform, ⋯-meny, handlingsrad ovanför
  listan, bilaga-substantivet (Marcus designdom 2026-08-29)
status: Done
assignee: []
created_date: '2026-08-29 21:38'
updated_date: '2026-09-04 08:14'
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
- [x] #1 Listan är kort per bilaga direkt på den grå behållaren (inget kort-i-kort); hover tonar hela kortet; mätt: kort vit rgb(255,255,255), hover rgb(237,238,233), behållare rgb(245,245,243); kortkanter = handlingsradens knappkanter (0 px avvikelse vid 390 och 1280)
- [x] #2 Höjdlåset håller: useLastaListhojd:s kod byte-identisk med main; li 124 px uniform; exakt fyra hela kort synliga (fjärde bottom ≤ ul bottom, femte top ≥ ul bottom); båda höjdlås-acceptance-sviterna gröna med kort-invarianter i stället för separator-asserts
- [x] #3 Varje kort: typglyf · namn = Öppna-knapp (44 px, full bredd) · EN ⋯-meny (Ladda ner · Ersätt · Skapa om · Ändra räckvidd · ─ · Radera i rött) — tangentbord, fokus tillbaka till triggern, ingen fokusring på behållare eller trigger efter musstängning, ring kvar vid Escape/Tab
- [x] #4 Ovanför listan: Ladda upp bilaga + Skapa bilaga ▾ (Bekräftelsebilaga · Deltagarinformation · Betalningskvitto), 44 px, staplade i full bredd under sm; filterraden och ?typ= rivna; Event-mallad borta ur metaraden; kortram 8 px
- [x] #5 Bilaga är substantivet: Mer-fliken, h1 och listans aria-label 'Bilagor'; 'Delade bilagor'; 'Till bilagorna'; tomlägen/laddning/fel/tillbaka-knappar/räckviddsdialog på 'bilaga'; ORDLISTA § Bilaga-notens 'Dokument är YTAN' rättad i docs-PR
- [x] #6 Landat via review-grinden (ADR-105) och verifierat i prod med smoke-kontot read-only: h1 Bilagor, Skapa bilaga synlig, kortform, ingen filterrad, inget Event-mallad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Nattgrind-stängning 2026-09-04: DoD bockad mot belägg — samtliga 6 AC redan bockade (mekanisk DoD#1); DoD#2 styrks av kortets Final Summary (review-grinden r1/r2 låg risk, backstopp exit 0, prod-verifierat); DoD#3 verifierat mot git show --stat 50c6493d (PR #2123): enbart dokumentyte-komponenter, aria-snapshots och tester ändrade.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landat 2026-08-29 22:17Z som 50c6493d via PR #2123 (elva commits, review-grinden ADR-105: r1 risk låg 2 info, r2 risk låg 4 info, loop konvergerad, backstopp exit 0). Vercel prod-deploy 6160692081 success 22:18Z; orkestrerarens read-only prod-verifiering (smoke-kontot, fyra ytor, 1280+390): h1 Bilagor · Ladda upp bilaga + Skapa bilaga · ingen filterrad · kort 124 px · inget Event-mallad · en ⋯ per kort · Mer-fliken Bilagor. useLastaListhojd:s kod byte-identisk med main (bara docblock). Mätvärden i sessionsdok S113 Del 8. AC #5:s ORDLISTA-led landar i docs-PR:en som sätter detta kort Done. Beslut under mandat: kvittots Ladda ner utgår (kvittoserien i Åtgärder), URL /mer/dokument kvar (eget kort), rullningssignal som skugga, en-radsnamn på mobil. Öppet åt Marcus: strängbytena i 93dbf275 (veto-lista i agentrapporten), tomytan under fyra-korts-låset vid 2–3 bilagor.
<!-- SECTION:FINAL_SUMMARY:END -->
