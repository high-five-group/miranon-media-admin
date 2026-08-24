---
id: TASK-170
title: >-
  Fynd: heartbeat-svepet saknar undantagslista för medvetet parkerade PR:er —
  parkerings-kontexten ska bo i policy-confen
status: Done
assignee: []
created_date: '2026-08-09 07:53'
updated_date: '2026-08-24 15:47'
labels:
  - ready-for-agent
  - intentionally-unchecked
dependencies: []
ordinal: 313000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur S100:s bo vid stängningen (sessionsdok S100 § PAUSLÄGE fjärde pausen, 'kvar sedan tidigare pauser'; triagerad i § Del 7 av S93 2026-08-09). Känd egenskap bokförd i session-resume-/session-start-skillens monitor-avsnitt: svepet larmar på PR:er som är MEDVETET parkerade (t.ex. Dependabot-poster som väntar Marcus-beslut — #635 är stående exempel), eftersom mekanismen saknar kontexten 'detta är parkerat med avsikt'. Fixen: undantagslista i .heartbeat-svep-policy.conf (config-driven per CLAUDE.md-regeln om grindvakts-logik — skriptlogik universell, värden i conf; hårdkodning i skriptet är anti-mönster), t.ex. per författare (dependabot[bot]) och/eller explicit PR-nummer. Besläktad familj men EJ samma brist: T128 (rollup vs required) och T132 (isDraft-filtret); trådregistret grep-verifierat utan träff för denna lucka 2026-08-09. OBS åtgärdsregeln i CLAUDE.md § merge queue kvarstår: egna PR:er ska draftas eller armeras — undantagslistan är för poster som INTE kan/ska bära draft-form (bot-PR:er som väntar Marcus-review).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Undantagslista finns i .heartbeat-svep-policy.conf och skriptet läser den därifrån — inga hårdkodade författare/nummer i heartbeat-svep.sh
- [ ] #2 Armerings-kandidat- och DIRTY-larmen filtrerar mot listan; övriga svep-vägar opåverkade
- [ ] #3 Tvåsidigt bevis: undantagen PR ger tyst svep, icke-undantagen identisk PR larmar (körutdrag i notes)
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
STÄNGNING 2026-08-24 (S112 mandatpasset). Beslutat av Code på Marcus-mandat 2026-08-24 (GO i klartext), S112. AC#1 bockad — löst FÖRE detta kort: HEARTBEAT_EXEMPT_AUTHORS=("dependabot") finns i .heartbeat-svep-policy.conf, och scripts/heartbeat-svep.sh rad 226 (default-deklaration) + rad 244-253 (is_exempt_author) läser den — inga hårdkodade författare/nummer i skriptet. Verifierat på disk 2026-08-24. AC#2 AVVISAT som krav: .heartbeat-svep-policy.conf § GRÄNS dokumenterar en MEDVETEN designgräns — 'undantaget gäller ENDAST armerings-kandidat-vägen. En Dependabot-PR som genuint går RÖD (trasig CI) eller DIRTY (konflikt) larmar OFÖRÄNDRAT — författar-undantaget tystar bara "ingen aktiv auto-merge-begäran", aldrig ett verkligt trädfel.' Att bygga AC#2 (filtrera även DIRTY-larmen) hade motsagt denna dokumenterade, avsiktliga design om att rött aldrig ska tystas. AC#3 lämnas OBOCKAD trots existerande stödjande evidens: scripts/test-heartbeat-svep.sh T25/T25b/T25c/T26 visar exakt det tvåsidiga beviset (undantagen PR ger PARKERAD-rutinrad, icke-undantagen identisk PR-form larmar ARMERINGS-KANDIDAT fortfarande) — körd 2026-08-24, 36 passerade / 0 failade, EXIT=0. Lämnas obockad eftersom mandatet inte uttryckligen instruerade stängning av just den punkten (endast AC#1/#2 nämnda); bokfört här som verifierat bifynd, inte som en bockad AC.

OBOCKAT MED AVSIKT: AC #2:s krav AVVISAT (strider mot heartbeat-policyns § GRÄNS medvetna design — rött tystas aldrig); AC #3 obockad då mandatet inte täckte den. Stängd som löst 2026-08-24.
<!-- SECTION:NOTES:END -->
