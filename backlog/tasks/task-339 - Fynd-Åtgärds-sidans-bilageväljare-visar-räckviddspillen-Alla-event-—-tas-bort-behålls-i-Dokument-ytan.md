---
id: TASK-339
title: >-
  Fynd: Åtgärds-sidans bilageväljare visar räckviddspillen ('Alla event') — tas
  bort, behålls i Dokument-ytan
status: To Do
assignee: []
created_date: '2026-08-29 08:10'
labels:
  - ready-for-agent
dependencies: []
ordinal: 618000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus prod-röktest 2026-08-29 (S113, TASK-309.11 punkt 8), ordagrant: "Inne på åtgärdssidan för ett event så visas alla bilagor med sin 'pill' typ 'Alla event'. Jag tror jag vill ta bort pillen, blir inte snyggt."

BESLUT (orkestreraren på Marcus mandat 2026-08-29, bokfört): pillen (RackviddBadge) tas bort ur Åtgärds-sidans bilageväljare och behålls i Dokument-ytans listor. Skäl: i bilageväljaren väljer Lotta VAD som ska bifogas — varifrån dokumentet kommer (räckvidden) är inte ett beslutsunderlag där, och pillen konkurrerar visuellt med kryssrutan och filnamnet; i Dokument-ytan förklarar badgen däremot varför en delad bilaga inte går att radera från ett event (ADR-118 beslut 3) och behålls. ADR-118 beslut 2:s formulering "… och i Åtgärds-sidans bilageväljare" amenderas öppet i TASK-338.5 (§ Updates), och TASK-338.3:s AC om badgens synlighet är omskrivet till att inte omfatta Åtgärds-sidan.

VERIFIERAT LÄGE (main 86c343bb): badgen renderas i src/components/events/atgarder/AtgardsSida.tsx:1560 (import :164, docblock :1556 som motiverar samma komponent som Dokument-ytans lista). Acceptance-testet tests/acceptance/atgarder-bilageval-send.acceptance.test.ts (rad ~47–83) bevisar TASK-275.3 AC #3 "unionen med badge" — unionen ska fortsatt bevisas, badge-påståendet tas bort. Facit: s93-atgardssida-promovering är STÄMPLAT 2026-08-11 (före badgen, som kom med TASK-275.3 2026-08-17) — kör bash scripts/check-facit.sh och bokför utfallet; fäller den på innehållslås är det ett STOPP att rapportera, inte kringgå. Ordning i väljaren (event-egna först, sedan delade) behålls så strukturen ändå läses utan pill. Rör inte Dokument-ytan.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ingen RackviddBadge/pill renderas i Åtgärds-sidans bilageväljare (event-egna och delade bilagor listas utan räckviddsmarkering); Dokument-ytans listor oförändrade — bevisat i acceptance-test (bilageväljaren utan badge, Dokument-ytan med)
- [ ] #2 atgarder-bilageval-send.acceptance.test.ts bevisar fortsatt unionen (event-egen + delad bilaga i väljaren, sändning med bifogad delad bilaga) utan badge-påståendet; axe-svep grönt
- [ ] #3 Stale prosa rättad: AtgardsSida.tsx-docblocket vid badgen, RackviddBadge.tsx:s docblock ('… och i Åtgärds-sidans bilageväljare') och DokumentYta.tsx:2187-noten; check-facit.sh exit 0 eller fällning bokförd som STOPP
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
