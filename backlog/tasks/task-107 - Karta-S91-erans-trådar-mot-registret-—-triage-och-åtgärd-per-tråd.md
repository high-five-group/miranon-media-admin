---
id: TASK-107
title: 'Karta: S91-erans trådar mot registret — triage och åtgärd per tråd'
status: To Do
assignee: []
created_date: '2026-07-31 08:36'
updated_date: '2026-07-31 08:46'
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

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
