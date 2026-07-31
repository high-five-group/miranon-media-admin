---
id: TASK-98
title: >-
  Fynd: ADR-083:s egen grind körs aldrig i CI — och check-docs.sh påstår att den
  gör det
status: To Do
assignee: []
created_date: '2026-07-30 21:38'
updated_date: '2026-07-31 07:57'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 178000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`scripts/check-docs.sh` rad 40–46 räknar upp tio grindar under rubriken *"ci.yml lint-jobbet (kör alltid, även på kod-PR:er)"*. Verifierat mot disk 2026-07-30 med `grep -c 'bash scripts/<grind>.sh' .github/workflows/ci.yml`:

| Grind | Körningar i ci.yml |
|---|---|
| check-frontmatter | 1 |
| check-lifecycle | 1 |
| check-public-checklists | 1 |
| check-adr-count | 1 |
| check-lesson-numbers | 1 |
| **check-permissions-claims** | **0** |

Fem av sex körs. Den sjätte gör det inte. Enda träffarna på `permissions-claims` i `.github/workflows/` är TEST-sviten (rad 623) och shellcheck-scopet (rad 844/861) — alltså körs grindens self-test i CI, men aldrig grinden mot repot.

**Ironin är exakt och hör till fyndet:** detta ÄR `ADR-083`:s felklass. ADR:n mintades för prosa som påstår sig vara mekanism, dess egen grind byggdes för att fånga just det — och grindens egen dokumentation påstår en CI-körning som inte finns. ADR-083 deklarerade dessutom öppet att *"hubben saknar CI, så hub-filen är oskyddad — en grind som ingen kör är inte en grind"*. Samma mening gäller nu spoke-sidan.

Funnen av `TASK-85`:s agent under härledningen av listpar; den klassade det som ett sjätte par med faktisk drift och byggde det INTE, eftersom åtgärden har CI-verkan och är ett scope-beslut.

Kortet är HIGH för att luckan är aktiv: varje styrande fil kan i dag få ett falskt permissions-påstående utan att någon grind fäller.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Formen VALD och motiverad: wira grinden i ci.yml lint-jobbet, ELLER rätta prosan i check-docs.sh till var den faktiskt körs — förkastat alternativ bär sitt skäl
- [x] #2 Väljs wiring: grinden körs av ett jobb som kör ALLTID, inte ett villkorat på docs_changed — annars kan en kod-PR införa ett falskt påstående utan att fällas
- [x] #3 Tvåsidigt bevis i CI: grinden fäller skarpt mot ett planterat falskt permissions-påstående, och är grön mot repots faktiska innehåll
- [x] #4 Räkningen i check-docs.sh stämmer med verkligheten efter ändringen — verifierad mekaniskt med grep, inte läst
- [x] #5 Sökt efter FLER grindar med samma drift mellan check-docs.sh:s uppräkning och ci.yml — utfallet redovisat även om det är noll
<!-- AC:END -->





## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
