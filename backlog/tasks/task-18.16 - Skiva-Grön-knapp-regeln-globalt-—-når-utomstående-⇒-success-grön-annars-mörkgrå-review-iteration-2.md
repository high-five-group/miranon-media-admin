---
id: TASK-18.16
title: >-
  Skiva: Grön-knapp-regeln globalt — når-utomstående ⇒ success-grön, annars
  mörkgrå (review-iteration 2)
status: In Progress
assignee: []
created_date: '2026-07-23 08:55'
updated_date: '2026-07-25 01:54'
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
- [x] #2 Intent-regeln + storleks-reglerna kodifierade i DESIGN-SYSTEM-SPEC §Button (K77-rivningen öppet bokförd med återvändo-not)
- [x] #3 App-bred knapp-audit utförd och bokförd: avvikare flippade per båda regelverken ('Skapa event' → primary; 'Skicka bekräftelse' → success; fler ur auditen)
- [x] #4 Berörda e2e uppdaterade i samma skiva (inkl. skapa-sidans K77-lås)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Levererad i S86-nattbatchen (AFK, F6-fönstret: lägre effort). TDD rött-först (S80): 2 röda e2e-körningar citerade — (1) event-bekraftelse 'Skicka bekräftelse-knappen bor ENDAST…': toHaveCSS background-color förväntat rgb(96,107,87), observerat rgba(0,0,0,0) (1 failed); (2) mer-segment-send 'happy path…': sendBtn förväntat rgb(96,107,87), observerat danger-röd (1 failed). Rött+grönt pushat IHOP. AC#2: DESIGN-SYSTEM-SPEC §19 (intent-regeln + dynamisk intent + K77-rivningen öppet bokförd med återvändo-not på token-nivå + storleks-reglerna sm/md/lg per ytklass) + ändringslogg-rad. AC#3: app-bred audit — flippade avvikare: personkortets Skicka bekräftelse (grå kortfot → Button intent=success, geometri via className) + segment-utskickets 'Skicka till N personer' (danger → success; oåterkallelighets-skyddet bärs av skriv-för-att-bekräfta-grinden, Bekräfta alla-precedenten); övriga ytor konforma (Betalningars Påminn = mailto-länk, åtgärds-rader = rad-grammatik, enda kvarvarande danger = dev-rutten + Ta bort-klassen); Skapa event-flippen redan verkställd i review-våg 5 (PR #94). AC#4: färg-lås tillagda i event-bekraftelse + mer-segment-send; skapa-sidans K77-lås verifierat grönt orört. Bifix i berörd fil: axe-flake-guarden i event-bekraftelse skärpt (överläggets data-entering/opacity — fade:en bor på ModalOverlay, inte dialogen; 3x-repeat grön). Review-piloten: 7+1 fynd, 7 åtgärdade, 0 avfärdade, 3 routade (task-41 · task-42 · T91); logg i T86 § Pilot-loggen; diff e8b011bbbb50 → ompass. 91d00ce3232f. Grindar lokalt: test:api 376 grön · typecheck 0 · biome 0 fel · build grön · berörda e2e 13/13 (+37/37 vid 3x-repeat). DoD#3 (CI per jobb) bockas av CI-svansen post-merge.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-07-23 10:36
---
AMENDERING (2026-07-23, review-våg 5, PR #94): K77-beslutet A (statiskt primary) RIVET av Marcus-resonemanget — Skapa event får DYNAMISK intent: primary oarmerad publicering, success armerad (grön-regeln på knappens faktiska semantik i stunden; schemalagda publiceringar gör oarmerat skapande internt). Implementerad direkt i vågen — 18.16:s audit-scope för Skapa event är därmed VERKSTÄLLT; kvar i skivan: regelkodifieringen i DESIGN-SYSTEM-SPEC (inkl. dynamisk-intent-mönstret) + resten av app-auditen + storleks-reglerna.
---
<!-- COMMENTS:END -->
