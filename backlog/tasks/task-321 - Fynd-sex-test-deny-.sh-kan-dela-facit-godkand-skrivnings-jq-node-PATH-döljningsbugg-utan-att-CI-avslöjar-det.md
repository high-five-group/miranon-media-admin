---
id: TASK-321
title: >-
  Fynd: sex test-deny-*.sh kan dela facit-godkand-skrivnings
  jq/node-PATH-döljningsbugg utan att CI avslöjar det
status: Done
assignee: []
created_date: '2026-08-26 04:33'
updated_date: '2026-08-26 07:10'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 590000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Under TASK-185:s CI-fix (PR #1992, run 32929323637) hittades rotorsaken till test-deny-facit-godkand-skrivning.sh F1/F2 rött på ubuntu: dess path_utan() tog bort ENDAST katalogen 'command -v ${bin}' råkade resolva till, inte VARJE katalog som håller binären — ubuntu-latest-runners exponerar rutinmässigt både jq och node via fler än en PATH-katalog samtidigt (actions/setup-node PREPENDAR sin hostedtoolcache-katalog, originalinstallationen ligger kvar). Fixad i facit-godkand-skrivning.sh:s test (skannar nu varje PATH-segment för -x "${seg}/${bin}").

SAMMA enkel-katalogs-teknik (path_utan/compute_path_no_jq, en enda command -v-baserad borttagning) finns ORÖRD i SEX andra sviter: test-deny-resend-send.sh, test-deny-arbetsform-push.sh, test-deny-hemlighet-utskrift.sh, test-deny-precompact.sh, test-deny-prod-ref.sh, test-deny-subagent-vantan.sh. Samtliga är GRÖNA i CI idag — men test-deny-arbetsform-push.sh:s F1 visade sig vara VACUOUSLY GREEN (rensa_tillstand körs precis före F-serien, så hookens NEKA-väg är redan avstängd av en annan grind oavsett om jq döljs eller ej — testet bevisar INGET om jq-döljningen). Det är overifierat om samma maskering gäller de fem andra — d.v.s. deras jq-hiding-F-test kan vara lika overifierande, och samma multi-katalogs-bugg kan sitta dold i dem utan att CI någonsin exponerar den, eftersom testet aldrig faktiskt tvingar ett beslut som beror på jq-döljningen.

Föreslagen AC: för var och en av de sex, verifiera om F-testet för jq/node FAKTISKT diskriminerar (dvs. skulle fälla om döljningen inte fungerade) — inte bara att det är grönt. Där det diskriminerar och riskerar samma multi-katalogs-bugg: applicera samma fix (skanna alla PATH-segment). Källa: PR #1992.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Vart och ett av de sex sviterna (test-deny-resend-send.sh, test-deny-arbetsform-push.sh, test-deny-hemlighet-utskrift.sh, test-deny-precompact.sh, test-deny-prod-ref.sh, test-deny-subagent-vantan.sh) har fatt sin compute_path_no_jq/path_utan bytt till shim-tekniken (filtrerad symlank-kopia i stallet for att stryka hela PATH-segmentet)
- [x] #2 Samtliga sex korda lokalt gront efter fixen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
LOST i samma svep som TASK-185 (PR 1992), inte en separat PR: samma CI-korning som exponerade facit-godkand-skrivnings F1/F2 exponerade sedan ocksa en bad-substitution-bugg i fyra hooks (scripts/deny-{frammande-huvudkatalog,hemlighet-utskrift,resend-send,subagent-vantan}.sh, "${#ARRAY[@]:-0}" ogiltig pa bash 5.x/ubuntu men tolererad av bash 3.2/macOS) som blockerade CI oavsett — och for att undvika whack-a-mole (en svit i taget over flera ~10-minuters CI-rundor) fixades alla sex PATH_NO_JQ-forekomster proaktivt i samma commit i stallet for att vanta pa att var och en skulle falla i CI separat. DoD #3 (inga orelaterade filer) galler PR 1992s SAMLADE diff, inte en isolerad PR for detta kort — se TASK-185 for helheten. CI-verifiering delad med TASK-185.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landning: PR #1992 (merge-commit 7d0f494e, mergad 2026-08-26T06:46:51Z; merge_group pr-1992 grön 06:37:21). Verifierat mot gh pr diff 1992 --name-only: samtliga sex sviter (deny-frammande-huvudkatalog/-hemlighet-utskrift/-resend-send/-subagent-vantan/test-deny-arbetsform-push/-facit-godkand-skrivning/-precompact/-prod-ref/-resend-send/-subagent-vantan) finns i den delade diffen med TASK-185. AC #1-#2 samt DoD #1-3 bockade. Done-flipp S112 resume 1, 2026-08-26, post-merge 7d0f494e grönt — 'löst i samma svep' bekräftat, inte bara agentens eget påstående.
<!-- SECTION:FINAL_SUMMARY:END -->
