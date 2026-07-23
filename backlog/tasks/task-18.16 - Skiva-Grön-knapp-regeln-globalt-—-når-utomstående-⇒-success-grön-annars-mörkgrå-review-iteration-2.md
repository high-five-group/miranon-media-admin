---
id: TASK-18.16
title: >-
  Skiva: Grön-knapp-regeln globalt — når-utomstående ⇒ success-grön, annars
  mörkgrå (review-iteration 2)
status: To Do
assignee: []
created_date: '2026-07-23 08:55'
updated_date: '2026-07-23 10:36'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-18
ordinal: 84000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus review-våg 2 (2026-07-23), lyft vid 18.6-granskningen; SCOPE-UTÖKAD + designbesluten AVGJORDA 2026-07-23 på delegerad senior-order ('Du är senior … Jag kvitterar det du kvitterar som branschledarsenior' — Del 4-precedentets orderklass, tolkningen öppet bokförd i Del 15). SKIVAN = SAMLAD KNAPP-STANDARD: (1) INTENT-REGELN — handlingar som NÅR UTOMSTÅENDE (mail/SMS till deltagare o.dyl.) bär intent success (grön); interna handlingar mörkgrå standard (primary). K77-KONFLIKTEN AVGJORD: A — regeln vinner, 'Skapa event' flippas till primary och S73-facit K77 rivs ÖPPET (semantisk färgregel utan ad-hoc-undantag; upplevd svärta hanteras i så fall på token-nivå, aldrig per undantag; lätt återvändo bokförs). Känd avvikare in i regeln: personkortets 'Skicka bekräftelse' → success. (2) STORLEKS-REGLERNA — användningsregler för primitivens skala sm/md/lg (32/40/48) per ytklass (primärflöden md/lg, kort/rader sm; ACCESSIBILITY-CHECKLIST §2-golvet) kodifieras i DESIGN-SYSTEM-SPEC §Button. (3) APP-BRED AUDIT av samtliga knappytor mot båda regelverken, avvikare flippas, berörda e2e uppdateras. Exekveras i ordinarie backlog-ordning (ingen gräddfil).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Marcus-beslut bokfört: regelformuleringen + K77-konflikten (A/B/C) — ev. facit-revidering rivs öppet
- [ ] #2 Intent-regeln + storleks-reglerna kodifierade i DESIGN-SYSTEM-SPEC §Button (K77-rivningen öppet bokförd med återvändo-not)
- [ ] #3 App-bred knapp-audit utförd och bokförd: avvikare flippade per båda regelverken ('Skapa event' → primary; 'Skicka bekräftelse' → success; fler ur auditen)
- [ ] #4 Berörda e2e uppdaterade i samma skiva (inkl. skapa-sidans K77-lås)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-07-23 10:36
---
AMENDERING (2026-07-23, review-våg 5, PR #94): K77-beslutet A (statiskt primary) RIVET av Marcus-resonemanget — Skapa event får DYNAMISK intent: primary oarmerad publicering, success armerad (grön-regeln på knappens faktiska semantik i stunden; schemalagda publiceringar gör oarmerat skapande internt). Implementerad direkt i vågen — 18.16:s audit-scope för Skapa event är därmed VERKSTÄLLT; kvar i skivan: regelkodifieringen i DESIGN-SYSTEM-SPEC (inkl. dynamisk-intent-mönstret) + resten av app-auditen + storleks-reglerna.
---
<!-- COMMENTS:END -->
