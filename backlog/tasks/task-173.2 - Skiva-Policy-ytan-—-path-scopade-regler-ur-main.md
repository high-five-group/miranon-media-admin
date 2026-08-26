---
id: TASK-173.2
title: 'Skiva: Policy-ytan — path-scopade regler ur main'
status: Done
assignee: []
created_date: '2026-08-09 13:12'
updated_date: '2026-08-26 04:17'
labels:
  - ready-for-agent
  - intentionally-unchecked
dependencies:
  - TASK-173.1
parent_task_id: TASK-173
ordinal: 325000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: granskningsregler knutna till path-mönster (t.ex. Airtable-write-ytor mot fällkatalogen, a11y-ytor mot 11-golvet) definieras config-drivet, läses ur main i granskningsögonblicket och injiceras scope-etiketterade i review-agentens input — en pushad gren kan aldrig manipulera sin egen granskning (ADR-105 beslut 7). Täcker användarberättelser: 12.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Path-scopade regler läses ENDAST ur main/trusted-källan — en regeländring på PR-grenen påverkar inte granskningen av samma gren (tvåsidigt bevisad)
- [x] #2 Regler injiceras endast för filer som matchar sitt mönster, med scope-etikett i utlåtandet så en regel aldrig läses som repo-bred
- [x] #3 Policy-ytan är config-driven per grindvakts-konventionen: värden i config, logik i skript
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Tvåsidig skript-testsvit (ska-fälla + ska-passera) per nytt deterministiskt skript, grön lokalt
- [ ] #6 CI-backstoppens grind-verkan bevisad med rött-först-form: positivt bevis + negativ self-test
- [ ] #7 Instrumenteringsloggen bevisat skrivande från första skarpa körningen (findings-per-runda + risk-kalibrering + grind-missar)
- [x] #8 Mekanism som inte kan skarpbevisas i byggsessionen bokförs som öppen skuld i handoff, aldrig som klar
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
DoD-avstämning + öppna punkter S112 resume 1 (2026-08-26, stängnings-batch 1):

(a) hämtaPrFiler() (gh-integrationen i scripts/hamta-review-policy.mjs) saknar egen testtäckning — test-review-policy.mjs:s 44 fall kör mot en hermetisk git-fixtur, inte mot gh pr-anrop. Bokförs som öppen skuld till TASK-173.4/173.6.

(b) docs/reference/review-utlatande.schema.json listar policySha/policyRegler (zod .default()-fält) som required i JSON Schema-representationen trots att de har defaultvärden i zod. TASK-173.4 måste välja en JSON Schema-validator som är defaults-medveten (eller generera schemat på ett sätt som respekterar .default()) för att inte falskt fälla utlåtanden som saknar dessa fält före policySha/policyRegler infördes.

(c) Öppet Marcus-beslut: vem/vad får ändra .review-policy.json (en dedikerad CODEOWNERS-post, eller en egen grind som kräver granskning av regeländringar). Byggagenten valde att låta den nya regeln 'granskningsreglerna-sjalva' (i .review-policy.json) själv synliggöra ändringar av policyfilen inom ramen för denna skiva, i väntan på beslutet.

(d) DoD #8 betalt nu (skarpbevis mot en verklig, öppen PR): npm run review:policy -- --pr 1985 exit 0. Utdrag: 'Path-scopade granskningsregler (1 st) — lästa ur .review-policy.json @ 9d15fa0a282f21d5d169be270b3c9e491f54c91b. ... ### Prod-vägar och hemligheter [id: prod-och-hemligheter] ... Scope — matchade filer i denna PR: .backlog-closure-policy.conf'. PR #1985 verifierad OPEN vid körning (gh pr view 1985). Läsningen skedde ur origin/main (policyn låg där sedan #1980 landade) — exakt den gröna vägen som var obevisad vid PR-skrivningen.

DoD #6/#7 lämnas MED AVSIKT obockade: OBOCKAT MED AVSIKT: DoD #6 (CI-backstoppens grind-verkan) och #7 (instrumenteringsloggen) hör till skivorna TASK-173.4/173.6 (CI-wiring resp. instrumentering), exakt samma avgränsning som redan etablerad på föräldraskivan TASK-173.1 (dess Implementation Notes: 'DoD #6 (CI-backstopp) och #7 (instrumentering) hör till skivorna 173.4/173.6 — att bocka dem här vore falsk klarrapportering'). Att bocka dem på 173.2 vore samma falska klarrapportering.

DoD #1/#2/#4/#5 checkade med bevis: #1 = 3/3 AC [x]. #2 = PR #1980-body: typecheck 0, biome 0, build 0, check:docs 0 (14 grindar), check-langa-streck.mjs 0 (260 filer), biome-baseline oförändrad (11 warnings/61 infos). #4 = git diff efa98ffe..c375e035 (#1980:s egen förälder->merge-commit, verifierat via git show -s --format='%H %P') = exakt 11 filer, samtliga i policy-ytans deklarerade scope (.review-policy.json, review-policy.mjs, hamta-review-policy.mjs, review-utlatande.mjs, test-review-policy.mjs, test-validera-review-utlatande.mjs, review-utlatande.schema.json, review-agent.md, CLAUDE.md, package.json, kortfilen) — ingen vilsen fil. #5 = test-review-policy.mjs 44/0 (positivt) + negativ self-test (implementationen muterad git show→readFileSync, sviten omkörd → exit 1, 7 röda: D1/D2/D3/D7/E1/E2/E5 — precis AC #1-bärande fallen) + implementationen återställd och verifierad grön igen.

AVVIKELSE UPPTÄCKT (ADR-086, rapporteras öppet): #1980:s merge-commit c375e035 saknar HELT en Post-merge-workflow-körning (gh run list --workflow "Post-merge" visar ingen post för c375e035, varken push- eller annat event; verifierat även direkt mot GitHub API workflows/post-merge.yml/runs). Sannolik orsak: c375e035 (03:43:58Z) landade endast 2 sekunder före nästa kö-post (bd94382, push-run skapad 03:44:00Z) — trolig GitHub-webhook-koalescering av snabbt på varandra följande pushar till main, inte ett fel i vårt eget workflow (concurrency-gruppen är per-SHA, cancel-in-progress:false, så det är inte en avbruten körning). Detta BLOCKERAR INTE Done-flippen: merge_group-körningen för pr-1980 var conclusion=success (kön mergar aldrig en röd post, ADR-076), och Post-merge är uttryckligen ALDRIG en required check (post-merge.yml:s eget huvud). Men det är en genuin observationslucka, bokförd i stället för tyst antagen som 'pending'.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landning: PR #1980. Done-flipp S112 resume 1, 2026-08-26, post-merge c375e035b636: INGEN Post-merge-körning hittad (avvikelse, se Implementation Notes) — merge_group för pr-1980 var conclusion=success, vilket är den auktoritativa CI-gaten (ADR-076); Post-merge är ej required check.
<!-- SECTION:FINAL_SUMMARY:END -->
