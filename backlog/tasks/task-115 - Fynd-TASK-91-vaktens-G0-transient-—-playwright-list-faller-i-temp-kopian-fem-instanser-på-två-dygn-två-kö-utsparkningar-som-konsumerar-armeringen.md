---
id: TASK-115
title: >-
  Fynd: TASK-91-vaktens G0-transient — playwright --list faller i temp-kopian,
  fem instanser på två dygn, två kö-utsparkningar som konsumerar armeringen
status: To Do
assignee: []
created_date: '2026-08-01 12:30'
updated_date: '2026-08-01 21:01'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 187000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Signaturen

G0 (*"orörd kopia av trädet → GRÖN"*) i [`scripts/test-check-staging-preflight-wiring.mjs`](../scripts/test-check-staging-preflight-wiring.mjs) bygger en sandlåda i `/tmp/t91-check-staging-preflight-wiring/` (`cpSync` av de klassade katalogerna + symlinkad `node_modules`) och kör vakten [`check-staging-preflight-wiring.mjs`](../scripts/check-staging-preflight-wiring.mjs) där. Vakten anropar `playwright test --project=… --list --reporter=json`; kan svaret inte läsas svarar den fail-closed **exit 64** → G0 förväntar 0 → sviten exit 1 → jobbet Lint + Audit + TypeCheck faller → aggregatorn "CI Passed or Skipped" fäller (fail-closed, S77) → i kö-kontext kastas posten ur merge-kön.

## Fem instanser på två dygn, alla samma signatur

1. **#505:s ursprungliga fällning** 2026-07-31.
2. **main-körningen 08:51** 2026-07-31 — självläkte 08:54.
3. **#527:s kö-körning 10:50:06Z** 2026-08-01 — dequeue med reason `failed_checks`, merge_group-run `30696440673`. Rotorsaken här mätt PRECISARE: vakten fick **TRUNKERAD JSON** från `playwright --list` (inte "kunde inte köras") → fail-closed exit 64.
4. **#524:s första körning** 2026-08-01 — löstes med rerun.
5. **#539:s kö-körning 12:16:52Z** 2026-08-01 — merge_group-run `30699382793`, dequeue + **konsumerad armering**; dyraste utfallet.

## Belägg för transient, inte trädinnehåll (mätt på instans 5)

- I samma CI-jobb föll det FÖRSTA playwright-anropet (G0) medan samtliga 15+ efterföljande anrop i **samma sandlåda** (R1–R15, G1–G2) körde playwright utan fel — R-fallen kräver en fungerande CLI för sina RÖD-utfall.
- Hela vaktsviten kördes lokalt mot det **exakta kö-trädet** (main `6ea9dce` + PR #539): exit **0**, alla fall gröna.
- Vakten själv mot PR-trädet lokalt: exit **0**, alla sex ytor namngivna.
- Instans 3:s trunkerade JSON pekar mot **buffert/last vid parallell körning** — inte mot Playwright-installationen (en trasig installation hade fällt även de efterföljande anropen).

## Konsekvens, mätt — och en dokumentationslucka

Vid `failed_checks`-utsparkning **KONSUMERAS armeringen**: PR:en ser efteråt identisk ut med en aldrig armerad (`autoMergeRequest: null`). Det är ett **fjärde läge** som CLAUDE.md § Landning-tabellen inte täcker — den bär tre. Två orkestrerar-svep 2026-08-01 behövde åter-armera manuellt (#527 12:24, #539 12:33). Utan svep står en färdig PR still på obestämd tid — `T108`-klassen igen: ett tillstånd utan bevakare.

## Designramen för åtgärden

Fail-closed-designen är **RÄTT** och får inte försvagas — vaktens egen formulering gäller: *"en vakt som inte kunde svara läses ALDRIG som grönt ljus"*. Men fem instanser på två dygn gör den till en återkommande falsk röd vars kostnad i kö-kontext inte är den röda körningen utan den kastade posten och den konsumerade armeringen.

## Åtgärdsrymd — ÖPPEN, väljs vid exekvering

1. **Retry i G0-steget** kring själva `playwright --list`-anropet — jfr repots etablerade curl-retry-mönster (task-92-klassen). Ett deterministiskt trädfel faller på varje försök; en bounded retry försvagar inte fail-closed.
2. **Rotorsaksanalys**: varför faller/trunkeras CLI-svaret i temp-kopior under parallell last — buffert-hypotesen ur instans 3 är startpunkten.
3. **Mät-först**: ska flakigheten KVANTIFIERAS används `npm run metrics:flake` (`scripts/flake-matserie.mjs`) — riggen är instrumentet, ALDRIG en egen mätserie (CLAUDE.md § Flakighet).
4. **CLAUDE.md § Landning-tabellen**: dokumentera det fjärde läget — `failed_checks` konsumerar armeringen och lämnar PR:en oskiljbar från en aldrig armerad.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Åtgärdsform vald och motiverad mot alla fyra öppna vägarna i åtgärdsrymden; valet och bortvalen bokförda i kortet
- [ ] #2 Fail-closed-egenskapen bevarad och bevisad åt båda håll: transient (första försöket faller, nästa lyckas) ger grönt; deterministiskt/oavgörbart fel ger fortsatt exit 64 efter uttömda försök
- [ ] #3 Om flakigheten kvantifieras: npm run metrics:flake-riggen används; ingen egen mätserie byggd
- [ ] #4 CLAUDE.md § Landning-tabellens fjärde läge (failed_checks konsumerar armeringen) dokumenterat, eller vägen explicit avstådd med skäl i kortet
- [ ] #5 Instansregistret i kortet uppdaterat med utfall efter åtgärden
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**Instans 6** (2026-08-01 ~20:37Z, PR #557, merge_group-run 30717361846, headBranch gh-readonly-queue/main/pr-557-4d0a60d33dfdbf3bbb7060467aa6aa56fac6d1f6): steget "Check staging-preflightens wiring (TASK-91 deletion-vakt)" fail-closed — "playwright --list kunde inte köras: Command failed" → "Process completed with exit code 64." Dequeue (failed_checks), konsumerad armering. **Instans 7** (samma PR, ~20:43Z, merge_group-run 30717544509): G0 i "Test wiring-vaktens fyrning (TASK-91, tvåsidigt bevis)" — "G0 orörd kopia av trädet → GRÖN, och namnger alla fem ytor: exit 64, förväntat 0" + samma "playwright --list kunde inte köras: Command failed"-signatur i sandlådekopian. Andra utsparkningen i rad på SAMMA PR. Tredje försöket (merge_group-run 30717774404) grönt — PR:n landade som aac16c757ce9319b4d5a3db7cfc790187c8e867e. PR #557:s diff var uteslutande .claude/agents/bygg-agent.md + .claude/agents/research-pass.md (bekräftat: gh pr diff 557 --name-only) — två agent-frontmatter-filer som inte kan påverka playwright-listningen i en cpSync:ad sandlåda. **Eskalation:** frekvensen har gått från spridda enstaka instanser (1-5, över flera PR:er och dagar) till BACK-TO-BACK på samma PR inom sex minuter (20:37Z → 20:43Z) — det stärker transient/last-hypotesen (§ Belägg för transient) men skärper samtidigt kostnaden: två konsumerade armeringar på en enda PR-landning.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
