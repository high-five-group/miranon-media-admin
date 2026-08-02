---
id: TASK-127.5
title: 'Skiva: Invite-EF:en — användarinbjudan med låst roll och e-post'
status: To Do
assignee: []
created_date: '2026-08-02 14:33'
labels:
  - ready-for-agent
dependencies:
  - TASK-127.1
parent_task_id: TASK-127
ordinal: 209000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
En ny Edge Function utlöser användarinbjudan (admin-handling med secret key — aldrig från klienten): admin-grindad via befintlig allowlist, sätter roll och e-post låsta i inbjudans metadata, bär omskicks-väg för utgången länk, och är byggd icke-breaking mot den framtida medlemsmodellen per ADR:n. Gamla vägen (manuellt konto + lösenord via sidokanal) dör härmed som metod.

Täcker användarberättelser: 7, 10, 11, 12, 13.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 EF:en nekar oautentiserade och icke-admin-anrop — deny-triple grön enligt EF-familjens mönster
- [ ] #2 Lyckat anrop skapar inbjudan med roll och e-post låsta i metadata; mottagaren kan inte ändra dem
- [ ] #3 Omskick för utgången inbjudan fungerar utan dubblett-effekter
- [ ] #4 Allowlist- och konfigurationsdeklarationer kompletta enligt EF-familjens mönster
- [ ] #5 api-pure- och api-staging-sviterna gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Prototyp-pass (tvåfas, T66-formen) Marcus-godkänt FÖRE login- och accept-skivornas bygge
- [ ] #6 Rundturs-e2e (inbjudan → accept → inloggning) grön mot staging före kortets Done
- [ ] #7 Ingen skarp inbjudan till Roger/Lotta före login-omskrivningen är landad och DMARC-posten satt
<!-- DOD:END -->
