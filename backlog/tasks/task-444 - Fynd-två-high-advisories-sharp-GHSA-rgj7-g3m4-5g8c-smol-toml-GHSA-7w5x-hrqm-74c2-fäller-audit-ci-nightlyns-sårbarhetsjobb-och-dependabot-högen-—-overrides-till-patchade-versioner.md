---
id: TASK-444
title: >-
  Fynd: två high-advisories (sharp GHSA-rgj7-g3m4-5g8c, smol-toml
  GHSA-7w5x-hrqm-74c2) fäller audit-ci, nightlyns sårbarhetsjobb och
  dependabot-högen — overrides till patchade versioner
status: Done
assignee: []
created_date: '2026-09-17 08:59'
updated_date: '2026-09-17 11:40'
labels: []
dependencies: []
priority: high
ordinal: 771000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Rotorsak

`npx audit-ci --config audit-ci.jsonc` föll (exit 1, mätt 2026-09-17 ~08:30Z
på main eeca8c72) med två high-advisory-paths:

- `GHSA-7w5x-hrqm-74c2|markdownlint-cli2>smol-toml` — smol-toml <= 1.7.0
  (DoS via malformad TOML, oändlig loop i parse()). first_patched_version
  1.7.1 (gh api /advisories/GHSA-7w5x-hrqm-74c2).
- `GHSA-rgj7-g3m4-5g8c|@vite-pwa/assets-generator>sharp` (även
  sharp-ico>sharp) — sharp < 0.35.4 (libheif-sårbarheter, RCE-potential).
  first_patched_version 0.35.4 (gh api /advisories/GHSA-rgj7-g3m4-5g8c).

Samma två advisories fällde nightlyns "Bredare sårbarhetsgranskning" sedan
2026-09-09 och blockerade dependabot-PR:erna #2480–#2484 på
"Audit dependencies (audit-ci)".

## Lösning

ADR-028 § Updates 2026-08-04 (incidentklass-amendering, TASK-133) fastslår
att en ORDINÄR patchad advisory (first_patched_version publicerad, ingen
kompromiss-misstanke) löses med riktad overrides-bump + riktad
`npm install` — INTE full lock-regenerering (den klassen är reserverad för
malware/kompromiss). sharp hade redan ett overrides-block sedan commit
8f4aeb3d (2026-07-22, 0.35.3) — bumpat till 0.35.4. smol-toml fick ett NYTT
overrides-block: markdownlint-cli2@latest (0.23.2, verifierat `npm view`)
pinnar fortfarande smol-toml@1.7.0 uppströms, så ingen icke-override-väg
finns ännu. Version 1.7.1 valdes (minsta patch som stänger advisoryn,
first_patched_version) i stället för senaste 1.8.0 — samma minimal-bump-
princip som repots övriga overrides-poster.

## Källor

- `gh api /advisories/GHSA-rgj7-g3m4-5g8c`
- `gh api /advisories/GHSA-7w5x-hrqm-74c2`
- `docs/decisions/ADR-028-supply-chain-incident-respons.md` § Updates 2026-08-04
- `package.json` `overrides`-block (commit 8f4aeb3d för sharp-precedenten)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 audit-ci exit 0 lokalt och i CI
- [x] #2 npm ls visar sharp 0.35.4 + smol-toml >= 1.7.1 utan sårbar rest
- [x] #3 markdownlint och ikon-genereringen fungerar oförändrat
- [x] #4 DoD gröna (test:api, typecheck, biome check, build)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Done av S125-orkestreraren 2026-09-17: landad via #2491 (main 87aa3dc4), review-grinden konvergerad, DoD mot PR-kroppens grind-tabell.
<!-- SECTION:NOTES:END -->
