---
id: TASK-220
title: Hälsningen visar förnamnet — display_name bär fulla namnet
status: To Do
assignee: []
created_date: '2026-08-15 08:59'
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
- [ ] #1 display_name 'Marcus Johansson' ⇒ hälsningen 'Hej Marcus' (första rendering) resp. 'Marcus' (återbesök) — aldrig hela namnet i hälsningsraden
- [ ] #2 Enords-display_name och saknat namn beter sig exakt som i dag (naket 'Hej' vid saknat; e-post aldrig fallback)
- [ ] #3 AuthProviderns displayName förblir hela namnet — endast hälsningens visning ändras (grep-bevis: inga andra konsumenter påverkade)
- [ ] #4 DoD-kvartetten grön (test:api, typecheck, biome, build)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
