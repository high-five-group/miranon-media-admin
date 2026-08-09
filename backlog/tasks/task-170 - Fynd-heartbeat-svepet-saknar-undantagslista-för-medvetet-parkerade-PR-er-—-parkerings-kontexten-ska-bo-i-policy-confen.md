---
id: TASK-170
title: >-
  Fynd: heartbeat-svepet saknar undantagslista för medvetet parkerade PR:er —
  parkerings-kontexten ska bo i policy-confen
status: To Do
assignee: []
created_date: '2026-08-09 07:53'
labels:
  - ready-for-agent
dependencies: []
ordinal: 313000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur S100:s bo vid stängningen (sessionsdok S100 § PAUSLÄGE fjärde pausen, 'kvar sedan tidigare pauser'; triagerad i § Del 7 av S93 2026-08-09). Känd egenskap bokförd i session-resume-/session-start-skillens monitor-avsnitt: svepet larmar på PR:er som är MEDVETET parkerade (t.ex. Dependabot-poster som väntar Marcus-beslut — #635 är stående exempel), eftersom mekanismen saknar kontexten 'detta är parkerat med avsikt'. Fixen: undantagslista i .heartbeat-svep-policy.conf (config-driven per CLAUDE.md-regeln om grindvakts-logik — skriptlogik universell, värden i conf; hårdkodning i skriptet är anti-mönster), t.ex. per författare (dependabot[bot]) och/eller explicit PR-nummer. Besläktad familj men EJ samma brist: T128 (rollup vs required) och T132 (isDraft-filtret); trådregistret grep-verifierat utan träff för denna lucka 2026-08-09. OBS åtgärdsregeln i CLAUDE.md § merge queue kvarstår: egna PR:er ska draftas eller armeras — undantagslistan är för poster som INTE kan/ska bära draft-form (bot-PR:er som väntar Marcus-review).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Undantagslista finns i .heartbeat-svep-policy.conf och skriptet läser den därifrån — inga hårdkodade författare/nummer i heartbeat-svep.sh
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
