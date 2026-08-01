---
id: TASK-115
title: >-
  Fynd: TASK-91-vaktens G0-transient — playwright --list faller i temp-kopian,
  fem instanser på två dygn, två kö-utsparkningar som konsumerar armeringen
status: To Do
assignee: []
created_date: '2026-08-01 12:30'
updated_date: '2026-08-01 22:20'
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
- [x] #1 Åtgärdsform vald och motiverad mot alla fyra öppna vägarna i åtgärdsrymden; valet och bortvalen bokförda i kortet
- [x] #2 Fail-closed-egenskapen bevarad och bevisad åt båda håll: transient (första försöket faller, nästa lyckas) ger grönt; deterministiskt/oavgörbart fel ger fortsatt exit 64 efter uttömda försök
- [x] #3 Om flakigheten kvantifieras: npm run metrics:flake-riggen används; ingen egen mätserie byggd
- [x] #4 CLAUDE.md § Landning-tabellens fjärde läge (failed_checks konsumerar armeringen) dokumenterat, eller vägen explicit avstådd med skäl i kortet
- [x] #5 Instansregistret i kortet uppdaterat med utfall efter åtgärden
<!-- AC:END -->



## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**Instans 6** (2026-08-01 ~20:37Z, PR #557, merge_group-run 30717361846, headBranch gh-readonly-queue/main/pr-557-4d0a60d33dfdbf3bbb7060467aa6aa56fac6d1f6): steget "Check staging-preflightens wiring (TASK-91 deletion-vakt)" fail-closed — "playwright --list kunde inte köras: Command failed" → "Process completed with exit code 64." Dequeue (failed_checks), konsumerad armering. **Instans 7** (samma PR, ~20:43Z, merge_group-run 30717544509): G0 i "Test wiring-vaktens fyrning (TASK-91, tvåsidigt bevis)" — "G0 orörd kopia av trädet → GRÖN, och namnger alla fem ytor: exit 64, förväntat 0" + samma "playwright --list kunde inte köras: Command failed"-signatur i sandlådekopian. Andra utsparkningen i rad på SAMMA PR. Tredje försöket (merge_group-run 30717774404) grönt — PR:n landade som aac16c757ce9319b4d5a3db7cfc790187c8e867e. PR #557:s diff var uteslutande .claude/agents/bygg-agent.md + .claude/agents/research-pass.md (bekräftat: gh pr diff 557 --name-only) — två agent-frontmatter-filer som inte kan påverka playwright-listningen i en cpSync:ad sandlåda. **Eskalation:** frekvensen har gått från spridda enstaka instanser (1-5, över flera PR:er och dagar) till BACK-TO-BACK på samma PR inom sex minuter (20:37Z → 20:43Z) — det stärker transient/last-hypotesen (§ Belägg för transient) men skärper samtidigt kostnaden: två konsumerade armeringar på en enda PR-landning.

## Åtgärd landad — motivering per AC (Marcus GO 2026-08-01: väg 1 + väg 4, väg 3 avstått öppet, väg 2 gratis i retryn)

**AC #1 — vald åtgärdsform mot alla fyra vägarna:**

- **Väg 1 (bounded retry) — VALD.** `listaProjektMedRetry()` i `scripts/check-staging-preflight-wiring.mjs`, `PLAYWRIGHT_LIST_FORSOK = 3`, kort linjär-dubblerande backoff (200 ms, 400 ms — lokal buffert/last-contention, inte nätverkslatens). Placerad kring själva G0-stegets `playwright --list`-anrop, eftersom instans 6 föll i det skarpa CI-steget (inte i test-sandlådan) — källa: Implementation Notes ovan + runs `30717361846`/`30717544509`. Branschmönster-belägg (ingen egen mätserie krävdes för VALET, se väg 3): repots eget curl-`--retry`-precedent (TASK-83-klassen — shellcheck/actionlint/vale hämtas med `curl --retry 5 --retry-all-errors --retry-max-time 60`, `.github/workflows/ci.yml` rad ~993–1020, bokfört i `tasks/s91-restlistan.md` rad ~285–299) plus etablerad transient-retry-praxis i GitHub Actions/SRE-litteraturen: bounded retry med backoff kring ett enskilt lokalt CLI-anrop som uppvisar en icke-noll transient-felfrekvens under parallell last, utan att dölja ett verkligt fel (retryn ger upp och kastar orört efter uttömda försök).
- **Väg 2 (rotorsaksanalys) — TILLGODOSEDD SOM GRATIS-INSTRUMENTERING, ingen egen mekanism.** Varje misslyckat försök loggar RÅ stdout + `os.loadavg()` (se retryns doc-block i skriptet). Buffert/last-hypotesen (instans 3) förblir obekräftad i sak, men nästa instans — om den inträffar — bär nu data den saknade förut, utan att ett separat mätverktyg byggts.
- **Väg 3 (mät-först, `npm run metrics:flake`) — AVSTÅTT ÖPPET.** Transient-beviset är redan starkt utan egen mätserie: instans 5 visade att FÖRSTA `--list`-anropet föll medan 15+ efterföljande anrop i SAMMA sandlåda kördes felfritt (R-fallens röda utfall kräver en fungerande CLI); hela vaktsviten kördes lokalt mot det exakta felande kö-trädet (main `6ea9dce` + PR #539) med exit 0 varje gång; vakten mot PR-trädet lokalt gav också exit 0. Felet är för sällsynt (7 instanser på ~2 dygn, mätt mot dussintals gröna CI-körningar under samma period) för att en lokal `metrics:flake`-serie skulle tillföra ett jämförbart n — se CLAUDE.md § Flakighet: "en flake som bara CI ser kan en lokal serie vara fel instrument helt och hållet." Ingen egen mätserie byggd (AC #3).
- **Väg 4 (CLAUDE.md § Landning-tabellen) — VALD, dokumenterad.** Fjärde raden tillagd i tabellens BEFINTLIGA form (`| Läge | Fältet | Vad det betyder |`): `failed_checks`-utsparkning → `autoMergeRequest: null` → "KONSUMERAD armering — PR:en ser identisk ut med en aldrig armerad". Plus en kort förklarande paragraf med källhänvisning till detta kort + `tasks/sessions/2026-07-26-session-91.md` rad ~7908–7909.

**AC #2 — fail-closed bevisat åt båda håll, som TESTFALL (inte engångskörning):** `scripts/test-check-staging-preflight-wiring.mjs` fall **G3** (transient: 1:a `--list`-försöket faller, 2:a lyckas → grönt resultat från `listaProjektMedRetry()`, räknarfil bekräftar EXAKT 2 anrop) och fall **R16** (deterministiskt/uttömt: fejk-CLI:t faller på ALLA anrop → funktionen kastar efter EXAKT `PLAYWRIGHT_LIST_FORSOK` (3) anrop, aldrig ett grönt resultat). Negativ kontroll körd manuellt (ej i den landade sviten): satte `PLAYWRIGHT_LIST_FORSOK = 1` tillfälligt → G3 föll korrekt röd (`Command failed`, ingen retry-chans kvar) medan R16 förblev grön — bevisar att G3 faktiskt detekterar retryns FRÅNVARO och inte är vakuöst grönt.

**AC #3 — väg 3 avstådd (se ovan), ingen egen mätserie byggd.**

**AC #5 — instansregistret, utfall efter åtgärden:** Instans 1–7 (ovan) predaterar denna landning. Bounded retry (väg 1) landar i samma PR som denna notering; framtida instanser av G0-transienten förväntas nu självläka inom G0-steget (transient första-försöks-fel → tyst grönt efter retry, synligt endast som en `⚠️`-rad i CI-loggen) utan att konsumera armeringen eller trigga en `failed_checks`-dequeue. Ett DETERMINISTISKT wiring-fel fortsätter fälla identiskt (exit 64) efter uttömda försök — ingen regression i vaktens kärnsyfte. Inga nya instanser observerade vid tidpunkten för denna landning (samma dag som instans 6/7).

**Sidoeffekt, dokumenterad öppet (inte en avvikelse i sak):** `listaProjektMedRetry()`/`main()`-gränsen i `check-staging-preflight-wiring.mjs` fick en import-säkerhetsguard (`import.meta.main`, ej `import.meta.url === pathToFileURL(...)` — den senare formen jämför strängar och gav en TYST false-negativ (`main()` körde aldrig, exit 0 utan utdata) när testsviten körde just DENNA vakt-kopia från `/tmp` på macOS, där `/tmp` är en symlink till `/private/tmp` och `import.meta.url` realpath-upplöses medan `pathToFileURL(process.argv[1])` inte gör det. Mätt under bygget av G3/R16 — hela den befintliga G0–R15-sviten föll tyst (exit 0/"utdata saknar X") innan felet spårades och guarden byttes. Ingen funktionell ändring för normal CLI-körning (`node scripts/check-staging-preflight-wiring.mjs`), verifierad oförändrad.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
