---
id: TASK-358
title: >-
  browserslist ≥ 4.28.7 — audit-ci fäller varje PR (GHSA-73wf-gq98-2v4g +
  GHSA-c83g-rgw3-j3cx)
status: To Do
assignee: []
created_date: '2026-09-02 07:29'
updated_date: '2026-09-02 07:34'
labels: []
dependencies: []
ordinal: 661000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Kontext

CI är röd på VARJE PR sedan 2026-09-01 ~16:42 UTC. Källa: PR #2201 (docs/s113-paus-8, docs-only) run 33564666846, jobb "Lint + Audit + TypeCheck" (id 100044988370), steg "Audit dependencies (audit-ci with allowlist)" fällde med "Failed security audit due to high vulnerabilities" och listade GHSA-73wf-gq98-2v4g|browserslist och GHSA-c83g-rgw3-j3cx|browserslist. main:s sista gröna ci.yml-körning var 2d3647f2 kl 13:43 UTC samma dag (gh run list --branch main --workflow ci.yml).

Advisories (gh api /advisories/<id>): båda `high`, publicerade 2026-09-01 16:41/16:42 UTC, vulnerable_version_range "<= 4.28.6", first_patched_version "4.28.7".
- GHSA-73wf-gq98-2v4g: Uncaught crash / prototype write via untrusted browserslist-stats.json custom stats (normalizeStats).
- GHSA-c83g-rgw3-j3cx: Unbounded memory growth (no cache eviction) via distinct query results, leading to eventual OOM.

Låsfilen bar `browserslist@4.28.2` (package-lock.json rad ~5576 på origin/main 1ed6d7e3), transitivt via:
- @tanstack/router-plugin -> @babel/core -> @babel/helper-compilation-targets (kräver ^4.24.0)
- vite-plugin-pwa -> workbox-build -> @babel/preset-env -> core-js-compat (kräver ^4.28.1)
- update-browserslist-db (peerDependency >= 4.21.0)

Inget direkt beroende i package.json. Ingen Dependabot-PR fanns för detta (gh pr list --search browserslist). audit-ci.jsonc har tom allowlist — ADR-028-konventionen är att allowlist är för advisories UTAN fix; här finns fix (4.28.7+), så bump är rätt väg, inte allowlist.

## Åtgärd

npm update browserslist för att lyfta den hoistade versionen till >= 4.28.7 (alla konsumenters semver-ranges tillåter det: ^4.24.0, ^4.28.1, >= 4.21.0 — ingen package.json-ändring krävs).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 package-lock.json bär browserslist >= 4.28.7 i varje förekomst (npm ls browserslist --all)
- [x] #2 npx audit-ci --config audit-ci.jsonc exit 0 lokalt
- [x] #3 audit-ci.jsonc orörd (ingen allowlist-post)
- [x] #4 DoD-listan + check-langa-streck.mjs gröna lokalt, utfall rapporterat verbatim
- [x] #5 PR pushad, ej armerad, ej draft
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
