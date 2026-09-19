---
id: TASK-482
title: >-
  E-postvakt mot omaskerad e-postadress i spårade filer — T171 punkt 3,
  config-driven grindvakt
status: To Do
assignee: []
created_date: '2026-09-19 11:44'
labels:
  - ready-for-agent
dependencies: []
references:
  - tasks/threads/T171-personuppgifter-i-publikt-repo.md
  - CLAUDE.md
priority: medium
ordinal: 838000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mekanisera en config-driven grindvakt (T171 punkt 3; CLAUDE.md § Instruktioner, raden 'Basdata citeras med record-ID + stabil pseudonym': 'Detta är PROSA, ingen mekanism ... en e-postvakt är ofärdig') som fäller på en OMASKERAD e-postadress i en spårad textfil. Mönster: samma form som scripts/deny-prod-airtable.sh + .prod-airtable-policy.conf (princip: ~/.claude/CLAUDE.md § 'Custom CI-grindvakts-logik i spokes är alltid config-driven' — skriptets logik är universell, undantagen bor i en egen .conf-fil). Allowlisten ska omfatta minst de undantag CLAUDE.md-raden redan räknar upp: Marcus egna adresser, Roger & Lottas firmauppgifter, samt de test-/exempeldomäner grinden själv måste acceptera för att inte fälla sina egna fixturer. Bygg INTE grinden i detta kort — bara kortet, med mätbar AC. Källa: tasks/sessions/2026-09-17-session-126.md Del 17 beslut 9 (T171 punkt 3 ⇒ kort) + tasks/threads/T171-personuppgifter-i-publikt-repo.md § Öppet punkt 3. Varje faktapåstående här är en HYPOTES tills prövad mot disk (ADR-086).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Grinden fäller (exit ≠ 0) på minst ett testfall med en omaskerad, riktig e-postadress i en spårad fil, och släpper igenom (exit 0) den maskade formen X***@domän
- [ ] #2 Undantagen (Marcus egna adresser, Roger & Lottas firmauppgifter, test-/exempeldomäner) ligger i en egen .conf-fil, aldrig hårdkodade i skriptet
- [ ] #3 Tvåsidig testsvit (minst ett fällande och ett släppande fall) är CI-wirad i ci.yml:s gatekeeper-steg
- [ ] #4 Grinden räknas in i npm run check:docs (eller motsvarande dokumenterad räkning) så dess antal grindar inte behöver skrivas av för hand (TASK-106-klassen)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
