---
id: TASK-309.19
title: >-
  BlockDialogs datum-gren är onåbar död kod — riv den eller flytta blocket ur
  Inforutan
status: To Do
assignee: []
created_date: '2026-08-24 17:53'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 585000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FALSIFIERAR PREMISSEN I TASK-309.17. Avtäckt av skiva 9-agenten 2026-08-24, verifierad oberoende av orkestreraren.

TASK-309.17 skapades på antagandet att block-dialogens datum-läge är ett fjärde nåbart läge vid sidan av text/agenda/plats, och att dess ariaSnapshot-par saknades. Antagandet var FEL: grenen går inte att nå alls.

sistaBetalningsdag är enda blocket med datum: true (blockDefinitioner.ts rad 90) och bor i bekräftelsebilagans Inforutan-grupp. Tre oberoende spärrar i GenereringsVy.tsx stänger vägen till BlockDialog:

  rad 270  dialogRader() filtrerar bort INFORUTA_IDN ur dialogens bläddring
  rad 835  varningsrutan: INFORUTA_IDN.has(id) ? oppnaMorf(id) : oppnaBlock(id)
  rad 941  lasEndast = r.def.last || arInforutan — raden blir en div, ingen knapp

Inforutans block redigeras alltså i sektionsmorfen, aldrig i BlockDialog. Datum-grenen i BlockDialog.tsx är död kod.

Spec-filens ursprungliga docblock hade detta rätt. Kortet 309.17 skrevs utan den läsningen — av orkestreraren, på en snabb kodläsning som såg datum: true och en segment-form och drog fel slutsats.

VARFÖR DET INTE BARA ÄR EN RIVNING: att flytta sistaBetalningsdag ut ur Inforutan vore en FORMÄNDRING på en yta vars form Marcus just godkänt, och ADR-103 B2 steg 4 fredar den. Rivning av den döda grenen är däremot additiv-negativ och rör ingen renderad yta. Valet är Marcus.

BESLÄKTAT: TASK-309.18 bär två andra döda kodvägar (adapter-metoder mot en riven Edge Function). Samma klass, olika ursprung — överväg att ta dem i samma pass.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Avgjort och bokfört: rivs BlockDialogs datum-gren, eller flyttas sistaBetalningsdag ut ur Inforutan (formändring, kräver Marcus)?
- [ ] #2 Beslutet verkställt; blockDefinitioner.ts:s datum-flagga och dess docblock speglar utfallet (ADR-083 — prosan och koden säger samma sak)
- [ ] #3 TASK-309.17:s AC #1 stängd som obsolet med falsifieringen bokförd, eller omformulerad mot det som faktiskt gäller
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
