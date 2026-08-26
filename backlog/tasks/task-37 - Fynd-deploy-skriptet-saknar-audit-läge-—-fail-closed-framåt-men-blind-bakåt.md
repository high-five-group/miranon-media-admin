---
id: TASK-37
title: 'Fynd: deploy-skriptet saknar audit-läge — fail-closed framåt men blind bakåt'
status: To Do
assignee: []
created_date: '2026-07-24 19:41'
updated_date: '2026-08-26 03:27'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 98000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-35 AC2-beslutet (2026-07-24, S84): REKOMMENDATION JA — implementera '--audit --project-ref <ref>' i scripts/deploy-prod-functions.sh: hämta live-funktionslistan, diffa mot .prod-functions-allowlist.conf, rapportera icke-allowlistade och exit 1 vid träff. Återanvänd skriptets befintliga allowlist-inläsning (ingen duplicerad parsning; logik universell, värden i conf per CI-grindvakts-principen). Design: docs/research/t39-ef-sync-preflight-2026-07-24.md §7. Bakgrund: test-auth låg i prod i 81 dagar trots allowlist-förbud — grinden hindrar nya deployer men ser inte historiska rester.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ett --audit-anrop mot prod rapporterar 0 icke-allowlistade (nuläget efter S84-städet) och exit 0
- [x] #2 Testfall i scripts/test-deploy-prod-functions.sh täcker träff (exit 1) + icke-träff (exit 0)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
S112 fix-våg 4 bunt D: --audit --project-ref <ref> implementerat i scripts/deploy-prod-functions.sh (fail-closed, pinnad Supabase CLI via scripts/lib/supabase-cli.sh, JSON-diff via scripts/lib/jq-guard.sh). Premiss-pass (2026-08-26): deploy-prod-functions.sh saknade fortfarande --audit vid start — S108s scripts/fas4-prod-deploy.sh --kontrollera är ETT ANNAT skript med en ANNAN funktion (listar prod-läge + secrets + bucket, gör INGEN allowlist-diff, exit alltid 0) och löste alltså inte detta fynd. AC #2 (T8 icke-träff exit0 + T9 träff exit1) bevisat i scripts/test-deploy-prod-functions.sh, 10/10 PASS totalt (T1-T7 oförändrade/gröna). shellcheck-strict (CI-exakt: --severity=style --enable=all, hela filsvepet) 0/0/0/0. AC #1 (skarpt --audit-anrop mot verklig prod, exit 0) KAN INTE köras av en agent — scripts/deny-prod-ref.sh fäller varje agent-kommando som bär prod-refen (TASK-203-låset, avsiktligt). Kvarstår som Marcus egen körning: bash scripts/deploy-prod-functions.sh --audit --project-ref <prod-ref-ur-.prod-ref-policy.conf>.
<!-- SECTION:NOTES:END -->
