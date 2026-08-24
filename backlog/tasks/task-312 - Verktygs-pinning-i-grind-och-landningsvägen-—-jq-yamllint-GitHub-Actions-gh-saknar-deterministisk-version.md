---
id: TASK-312
title: >-
  Verktygs-pinning i grind- och landningsvägen — jq, yamllint, GitHub Actions,
  gh saknar deterministisk version
status: Done
assignee: []
created_date: '2026-08-24 13:35'
updated_date: '2026-08-24 17:23'
labels:
  - ready-for-agent
dependencies: []
ordinal: 575000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Sveparen i S108 (2026-08-24, efter att en opinnad Supabase-CLI fällde en prod-deploy efter 18 av 45 funktioner) kartlade hela klassen. Supabase-CLI:t åtgärdas i sitt eget spår; DETTA kort bär resten — verkliga svagheter som INTE orsakade den fällningen och som är Marcus prioritering.

FYND (alla verifierade mot disk av sveparen, radnummer per 2026-08-24):

1. jq — STÖRST BLAST-RADIUS, HELT UTAN MITIGERING. ~25 anropsställen, bar system-binär, verifierat frånvarande ur package.json. Driver hela hook-/grind-lagret: .claude/settings.json:9 (inline PreToolUse-hook), samtliga deny-*.sh, stop-vakt.sh, katalogagarskap-*.sh, arbetsform-tillstand.sh, check-claims-tackning.sh, check-obesvarade-larm.sh m.fl. Till skillnad från shellcheck/actionlint/vale finns INGEN versionsassert nagonstans.

2. yamllint — repots ENDA CI-verktyg utan pin. .github/workflows/ci.yml:545-546 kor 'pip install --quiet yamllint' utan version. Bryter monstret som actionlint (1.7.12 + SHA256), shellcheck (v0.11.0 + SHA256) och vale (3.14.1 + SHA256) annars foljer. Bootstrap och grind ar dessutom konflaterade i samma run:-block (noterat i verify-ci-parity.mjs:606-620).

3. GitHub Actions — TRE samexisterande pinningsdiscipliner i samma filer: SHA-pinnad (lycheeverse/lychee-action@e747777, tj-actions/changed-files@9426d40), exakt tagg (actions/setup-node@v7.0.0 x13, actions/cache@v6.1.0 x6), flytande major (actions/checkout@v7 x12, actions/upload-artifact@v7 x4). Flytande major ar strukturellt samma svaghet som ett opinnat npx-anrop: en tagg leverantoren kan flytta.

4. gh — bar system-binar, ej i package.json. Ligger i LANDNINGSVAGEN: gh pr create (post-merge.yml:494, visual-baselines.yml:216), gh issue create, samt classify-post-merge.sh, check-nattvakt-dedup.sh, check-obesvarade-larm.sh, ci-metrics.mjs, nightly-watchdog.yml.

5. Mitigerade men lokalt opinnade (lagre prioritet): shellcheck, actionlint, vale, lychee — alla CI-pinnade med SHA, lokalt opinnade, men verify-ci-parity.mjs version-asserterar mot CI:s pin.

FOREDOME ATT KOPIERA: backlog.md ar exakt-pinnad (package.json 1.49.1), anropas via node_modules/.bin, och npx-formen ar uttryckligen FORBJUDEN med skalet nedskrivet pa fyra stallen (backlog-cli.sh:70-71, check-backlog-closure.sh:199-211, nightly.yml:386-387). Det ar behandlingsformen.

TRIAGE (ADR-053): blockerar ej, vardefullt -> registrerat. Prioritering och ev. skivning ar Marcus.

KALLA: S108 Del 18; sveparens fulla tabell i sessionsdoket.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Varje fynd 1-4 har ett medvetet beslut: pinnad, eller oppet deklarerad som medvetet opinnad med skal i fil
- [x] #2 jq-ytan (fynd 1) har antingen versionsassert eller dokumenterat skal till varfor den inte behover en
- [x] #3 Inget verktyg i grind- eller landningsvagen saknar bade pin OCH mitigering efter kortet
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
Done-flipp S112: PR #1942 landad, post-merge d80acb16 grön; 19 jq-vakter + gh-vakter + yamllint-pin + 45 Actions-SHA-pins, tvåsidigt bevisade. Landning: PR #1942
<!-- SECTION:NOTES:END -->
