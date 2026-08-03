---
id: TASK-127.10
title: 'QA: Inbjudningsvandringen skarpt (Spår B)'
status: To Do
assignee: []
created_date: '2026-08-02 14:34'
updated_date: '2026-08-03 11:38'
labels:
  - ready-for-human
dependencies:
  - TASK-127.1
  - TASK-127.2
  - TASK-127.3
  - TASK-127.4
  - TASK-127.5
  - TASK-127.6
  - TASK-127.7
  - TASK-127.8
  - TASK-127.9
parent_task_id: TASK-127
ordinal: 214000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan (FÖRKRAV: Grind 0-paketet klart — DMARC-post satt, SMTP kopplad, publik URL; se T46-kartan):

1. Marcus utlöser skarp inbjudan till egen testadress.
2. Öppnar mailet på iPad: brandad avsändare, svensk copy, rätt avsändardomän.
3. Granskar headers: SPF pass, DKIM pass, DMARC p=reject — alignerat.
4. Accepterar: e-posten låst, sätter lösenord med vägledningen.
5. Loggar in på nya login-vyn.
6. Aktiverar passkey; loggar ut och in igen med passkey.
7. Kör glömt-lösenord hela vägen till ny inloggning.
8. Prövar en utgången länk: vänligt felläge + omskick fungerar.
9. Verifierar enumeration-neutralitet: okänd adress ger samma svar på login och återställning.

Täcker: hela spåret manuellt.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Alla nio stegen genomförda och godkända av Marcus
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Ingen skarp inbjudan till Roger/Lotta före login-omskrivningen är landad och DMARC-posten satt
<!-- DOD:END -->
