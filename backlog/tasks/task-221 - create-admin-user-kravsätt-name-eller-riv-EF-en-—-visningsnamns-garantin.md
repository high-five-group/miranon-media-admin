---
id: TASK-221
title: 'create-admin-user: kravsätt name eller riv EF:en — visningsnamns-garantin'
status: To Do
assignee: []
created_date: '2026-08-15 09:03'
labels:
  - ready-for-human
dependencies: []
ordinal: 424000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
S102-forensiken 2026-08-15: invite-user-EF:en KRÄVER namn sedan TASK-143, men den äldre create-admin-user-EF:en skapar konton HELT utan user_metadata — konton födda den vägen får aldrig visningsnamn (naket 'Hej' för alltid), och TASK-127 användarberättelse 13 ville redan döda den manuella vägen. MARCUS-VÄGVAL i kortet: (A) kravsätt EF:en med samma name-validering som invite-user, eller (B) riv EF:en helt (inbjudningsvägen är enda kontovägen). Efter vägval kan verkställandet delegeras till agent. Kompletterande skyddsnät (valfritt, samma kort): /valkommen skickar med display_name i sitt updateUser-anrop som självläkning för namnlösa sessioner. Prod-datafixen för befintliga konton är REDAN utförd (HITL 2026-08-15: Marcus Johansson, Lotta Gotthardsson, EF-smoke — verifierad).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus har valt väg A (kravsätt) eller B (riv) — bokfört i kortet
- [ ] #2 Vald väg verkställd: antingen name-krav i create-admin-user identiskt med invite-user-valideringen, eller EF:en riven med referenssvep
- [ ] #3 DoD-kvartetten grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
