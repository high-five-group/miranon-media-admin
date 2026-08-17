---
id: TASK-220
title: Hälsningen visar förnamnet — display_name bär fulla namnet
status: Done
assignee: []
created_date: '2026-08-15 08:59'
updated_date: '2026-08-17 08:17'
labels:
  - ready-for-agent
dependencies: []
ordinal: 424000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus-beslut 2026-08-15 (S102 Lotta-vandringen): visningsnamnen i Supabase user_metadata är FULLA namn (t.ex. Marcus Johansson — sätts via prod-datafixen + invite-EF:ens name-fält), men hälsningsraden på hem-vyn ska visa BARA förnamnet: 'Hej Marcus' vid första renderingen, 'Marcus' vid återbesök i samma flik-session. Extraktionen (första ordet av display_name) hör hemma i hälsnings-komponentens visningslogik — AuthProviderns displayName förblir hela namnet (andra konsumenter, t.ex. inbjudarnamn och aktivitetsloggens vem-fält, ska bära fullt namn). E-post är fortsatt ALDRIG fallback (TASK-1 beslut 5, orört); saknat namn ger nakna 'Hej' precis som i dag.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 display_name 'Marcus Johansson' ⇒ hälsningen 'Hej Marcus' (första rendering) resp. 'Marcus' (återbesök) — aldrig hela namnet i hälsningsraden
- [x] #2 Enords-display_name och saknat namn beter sig exakt som i dag (naket 'Hej' vid saknat; e-post aldrig fallback)
- [x] #3 AuthProviderns displayName förblir hela namnet — endast hälsningens visning ändras (grep-bevis: inga andra konsumenter påverkade)
- [x] #4 DoD-kvartetten grön (test:api, typecheck, biome, build)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementerat: Greeting.tsx extraherar förnamnet (första ordet) ur AuthProviderns displayName i visningslogiken — AuthProvider orört, bär hela namnet till sina andra konsumenter (grep-bevisat: mutationers actor.name, recordActivity, waitlist/persons/registrations-modulernas EGNA lokala displayName()-helprar är obesläktade namn-funktioner, valkommen.tsx läser rå session-metadata separat). Enordsnamn och saknat namn oförändrat; robust mot inre/omgivande whitespace. Tester: tests/acceptance/hem.acceptance.test.ts utökad med två nya fall (fullt namn → endast förnamnet i båda lägena; whitespace-kantfall) — verifierat RÖTT utan fixen och GRÖNT med den (git stash-provocerat). DoD-kvartetten grön lokalt: typecheck exit 0, biome check (touched files) exit 0, build exit 0, test:api 750 passed. Full hem.acceptance.test.ts-svit (30 test) grön mot lokal dev-server.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad i PR #1331 (commit 6c4d1a77, MERGED på main afd4fc3f, 2026-08-15). fornamn()-helper i hälsningens visningslogik; AuthProvider orörd (fulla namnet till actor/aktivitetslogg, grep-bevisat); tvåsidigt testbevis (rött utan fix, grönt med; 30/30 hem-acceptance). 'Hej Marcus' aktiv efter nästa inloggning.
<!-- SECTION:FINAL_SUMMARY:END -->
