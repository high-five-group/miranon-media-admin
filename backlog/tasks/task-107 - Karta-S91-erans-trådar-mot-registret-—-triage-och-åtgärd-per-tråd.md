---
id: TASK-107
title: 'Karta: S91-erans trådar mot registret — triage och åtgärd per tråd'
status: Done
assignee: []
created_date: '2026-07-31 08:36'
updated_date: '2026-07-31 08:59'
labels: []
dependencies: []
ordinal: 180000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus beställde 2026-07-31 en kartläggning som måste finnas före nästa resume av Session 91: hur ligger vi till med registrerade trådar i förhållande till S91-scopet, vad behöver utredas, vad är redan utrett, och hur ska vi agera på de trådar som mintats under S91.

Kartan är en AGGREGERING MED TRIAGE, inte en statuskopia. tasks/threads/README.md äger trådstatus; kartan pekar dit och lägger till det ingen enskild registerpost bär: vad som behöver hända med tråden, och varför nu.

Skälet till att den inte får kopiera status: en audit 2026-07-28 fann tolv statusfel i restlistan, samtliga kopior av register som redan hade rätt svar.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 S91-eran avgränsad mot faktiskt underlag (sessionsdokets ingångstillstånd + git-historiken för trådregistret), inte mot en antagen numerisk gräns
- [x] #2 Varje S91-tråd triagerad mot ADR-053:s två axlar och landad i EN åtgärdsklass: stäng / minta kort / behöver research / väntar på Marcus / vilande med skäl
- [x] #3 Kort-existens per tråd kontrollerad mot backlog-CLI:t och mot systeragenternas ocommitterade arbete, aldrig mot registrets egen text
- [x] #4 Blockeringar mellan trådar och kort utskrivna med riktning
- [x] #5 De 68 pausade trådarna genomgångna och fördelade på relevant-för-S91 / moot / levande-utanför-S91, med de moot namngivna och belagda
- [x] #6 Egna luckor deklarerade: varje tråd vars läge inte gick att avgöra ur underlaget är utpekad som sådan i stället för gissad
- [x] #7 check:docs grön
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Kartan landad som tasks/threads/S91-tradkarta-2026-07-31.md (egen fil; tasks/threads/README.md orörd — en systeragent arbetar i den parallellt).

MÄTT, INTE ANTAGET:
- S91-eran = T100-T109 (tio tradar). Harledd ur sessionsdokets ingangstillstand (rad 37-40: 'Numrering vid ingang: ... T100 ... T99 var redan forbrukad') plus introducerande commit per rad via git log -S. Orkestrerarens gissning T90-T109 ar for bred; T99 mintades 2026-07-26 kl 11:38, mellan S90:s stangning (99be5a6, 11:33) och S91:s sessionsdok (fc3b3da, 13:56).
- Ingen tidigare tråd fick innehåll i S91 via registret: git diff 8f36629 HEAD ger tolv +-rader, varav T74/T79 endast FLYTTADES (ordnivå-diff mot 4eed6e7 'trådregistret ordnat').
- Registrets omfang: 109 rader, 13 active / 68 paused / 28 closed. Grovmatningen sa 110 / 14 active.

TRIAGE: minta kort 1 (T103) - behover research 2 (T108, T109) - vantar pa Marcus 1 (T100) - vilande med skal 4 (T101, T102, T106, T107) - redan stangd och verifierad 2 (T104 via TASK-60 Done, T105 via TASK-59.7 Done). Stang: noll.

RATTELSE UNDER ARBETET: T102 sag ut att vara en stang-kandidat (tre skivor rapporterar att instabiliteten inte visade sig) men skalet ar STRUKTURELLT i alla tre - TASK-59.4/59.5/59.6 skriver alla ut att ingen av deras filer bar en skarmdumps-jamforelse. Fenomenet ar lika oprovat som vid registreringen. Matt: toHaveScreenshot i noll acceptance-filer, sex visual-filer; uppvarmningsskottet lever pa tests/acceptance/hem.acceptance.test.ts:1152.

MOOT-BELAGG (rapporterade, ej andrade - registret ar forbjuden fil):
- T14: ?period=upcoming|past ar URL-kontraktet (EventsList.tsx:90), TASK-17.2 Done - tradens egen stangningsvillkor uppfyllt.
- T37: dependabot.yml saknar bade npm.pkg.github.com och registries:; Dependabot Updates gav completed success x5 (2026-07-28/29); sex origin/dependabot/*-grenar finns.
- T64: TASK-16 Done 2026-07-19 med egen secret STAGING_AIRTABLE_TOKEN least-privilege scopad till staging - det ar exakt tradens Marcus-vagval; ADR-060 p5 ERSATT.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Trådregistret kartlagt mot S91-scopet på Marcus order ("Detta behöver vara kartlagt innan nästa resume"). Kartan bor i tasks/threads/S91-tradkarta-2026-07-31.md. S91-ERAN ÄR T100-T109, TIO TRÅDAR — inte T90-T109 som orkestreraren gissade. Härledd ur två oberoende källor: sessionsdokets ingångstillstånd (som räknar T100 som nästa lediga och bokför T99 som redan förbrukad) plus introducerande commit per registerrad via git log -S. T99 mintades 11:38, i glappet mellan S90:s stängning och S91:s sessionsdok. Ingen tidigare tråd fick innehåll i S91 — de tolv plus-raderna i registerdiffen är T74/T79 som bara flyttades vid en sortering. ÅTGÄRDSKLASSER: minta kort 1 (T103) · behöver research 2 (T108, T109) · väntar på Marcus 1 (T100) · vilande med skäl 4 (T101, T102, T106, T107) · redan stängd och verifierad 2 (T104, T105) · STÄNG: NOLL. Ingen S91-tråd är färdig-och-verkställd. T87 är kartans nav — T101, T102 och T106 pekar alla på den; blockeraren TASK-55 är Done, triggern är Marcus. DE 68 PAUSADE: 16 relevanta för S91, 3 MOOT belagt mot disk (T14, T37, T64), 49 levande utanför S91. AGENTEN RÄTTADE SIN EGEN SLUTSATS: T102 såg ut som stäng-kandidat eftersom tre kort rapporterar att instabiliteten uteblev — men skälet är strukturellt i alla tre, ingen av deras filer bär en skärmdumps-jämförelse (toHaveScreenshot i NOLL acceptance-filer). Fenomenet är lika oprövat som vid registreringen. Egna luckor deklarerade i § 6 i stället för gissade. Landad #510 (78e08b8), merge_group grön (3657f105).
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
