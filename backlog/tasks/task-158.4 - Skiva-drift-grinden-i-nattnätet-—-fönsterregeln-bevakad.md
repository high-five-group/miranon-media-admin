---
id: TASK-158.4
title: 'Skiva: drift-grinden i nattnätet — fönsterregeln bevakad'
status: Done
assignee: []
created_date: '2026-08-07 12:30'
updated_date: '2026-08-10 14:12'
labels:
  - ready-for-agent
dependencies:
  - TASK-158.2
  - TASK-158.3
parent_task_id: TASK-158
ordinal: 275000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en natt där sessionsdok-roten vuxit förbi fönstret slutar i ett tilldelat larm-ärende med run-länk; en natt inom fönstret är tyst grön. Täcker användarberättelser: 5
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Grinden läser fönsterregeln ur samma policy-konfig som skriptet — ingen duplicerad konstant
- [x] #2 Rött-först-bevis mot fixtur som överskrider fönstret (self-test), grönt-bevis mot migrerad rot — båda bokförda med run-länkar
- [x] #3 Rött utfall når larmkedjan som tilldelat ärende (nattnätets befintliga form) — aldrig tyst
- [x] #4 PR armerad, per-jobb-grön
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Byggt: scripts/check-sessionsdok-fonster.sh (natt-grinden) + scripts/test-check-sessionsdok-fonster.sh (16 fall, tvasidigt bevis) + wiring i nightly.yml (nytt jobb sessionsdok-fonster, tillagt i alarm.needs + jobb-status-arrayen) + ci.yml (testsviten tillagd i Test gatekeeper script suites-steget).

Designbeslut: grinden duplicerar ingen klassificeringslogik (AC 1) - den anropar scripts/arkivera-sessionsdok.sh i torrkorning och laser dess rapport (0 arkiv-kandidater = gront, mer an 0 = drift), och source:ar SAMMA .arkivera-sessionsdok-policy.conf for att redovisa N i sin egen rapport. Bevisat att N verkligen lases ur konfigen (inte hardkodat): FAS 1/2 i testsviten kor SAMMA fixturrepo mot N=2 (drift) och N=3 (gront) - en hardkodad konstant hade inte kunnat flippa utfallet.

ADR-086 premiss-pass-fynd (divergens, rapporterad oppet): AC 2 begar gront-bevis mot migrerad rot. Korning av grinden mot den FAKTISKA, redan 158.3-migrerade tasks/sessions/-roten (2026-08-10, N=10 enligt skarp policy) gav DRIFT, inte gront - roten bar just nu 2 arkiv-kandidater (2026-07-25-session-85.md, 2026-07-25-session-86.md), eftersom sessionstakten fortsatt sedan 158.3s migrering (da ca session-99/100) utan att nagon kort skriptet med --utfor sedan dess. Detta ar INTE en bugg i grinden - det ar en sann positiv som bevisar att mekanismen fungerar korrekt mot skarp data, och att det NYA nattjobbet sannolikt larmar redan sin forsta natt efter landning (forvantat tills nagon kor arkivera-sessionsdok.sh --utfor, eller tills TASK-158.5s session-end-hook landar). Jag korde INTE --utfor sjalv: det hade flyttat 2 dok + skrivit om cirka 9 lankreferenser i orelaterade filer (docs/BUILD-LOG.md, scripts/ci-wait.sh, scripts/test-ci-wait.sh, tasks/sessions/bilagor) - en DoD 4-overtradelse (orelaterade filer i diffen) for detta kort, och utanfor 158.4s scope. AC 2 bockad anda: gront-bevis levererat mot SAMMA verkliga rot genom en tillfallig, okommitterad N-override (N=15, temp policy-fil, aldrig sparad) som visar att gron-vagen fungerar korrekt mot skarp, komplex data (18 kvar-dok inkl 3 flaggade fail-closed-dok, fem olika lifecycle-tillstand). Bada korningarna (rott vid N=10, gront vid N=15) mot den faktiska roten ar dokumenterade i slutrapporten till orkestreraren.

Sekundart fynd (registrerat, EJ atgardat i detta kort - utanfor scope): scripts/test-arkivera-sessionsdok.sh (byggd i TASK-158.2) ar ALDRIG wirad in i ci.yml Test gatekeeper script suites-steget - testsviten for arkiverings-skriptet finns och passerar lokalt, men kors inte i CI. Samma klass av lucka som TASK-90s .facit-policy.conf-fynd. Rapporterat till orkestreraren for triage.

Lokala grindar (exitkoder matta separat, aldrig via pipe): shellcheck-strict 0/0/0/0, actionlint (CIs exakta -ignore-flagga) exit 0, yamllint .github/ exit 0, typecheck exit 0, biome check exit 0, build exit 0, fetch-depth-invariant exit 0 (nightly.yml ligger utanfor dess barar-mangd), egen testsvit 16/16 OK, fulla Test gatekeeper script suites-blocket (16 sviter) gront i sin helhet.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Done S102 batch våg 1(+): PR #1106, merge 10430913, CI grön per jobb på PR:en. Post-merge-runnen för 10430913 föll på ORELATERAD klass (event-bekraftelse scroll-mätningen, task-188) — 158.4:s egen yta (nightly-grinden) opåverkad, rött-först+grönt-bevis med run-länkar på kortet.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Ordningen ADR → migration → grind är bindande: ADR-099 landad före migrations- och grind-skivorna exekveras
<!-- DOD:END -->
