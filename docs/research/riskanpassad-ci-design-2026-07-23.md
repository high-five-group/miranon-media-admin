# Riskanpassad CI — design (Code, 2026-07-23)

> **Proveniens:** designad av Code på Marcus delegations-mandat 2026-07-23
> ("designen är Codes; Marcus tillfrågas vid märkbar vardags-påverkan"),
> som våg 2 av processgransknings-landningen. Grund: extern
> processgranskning
> ([arbetsflode-processgranskning-2026-07-23.md](arbetsflode-processgranskning-2026-07-23.md))
> tillsammans med Codes verifikation (svars-sektionen där) och riktad
> research verifierad 2026-07-23 (GitHub rulesets-/auto-merge-docs,
> Playwright snapshots-docs). Våg 1
> ([ADR-076](../decisions/ADR-076-merge-grinden-ruleset-pr-flode.md) och
> PR #99) är EXEKVERAD — detta dok är designen för våg 2 (och riktningen
> för våg 3), tråd [T85]. Implementation sker som egna pass; ADR mintas
> vid respektive implementation.

## Designprinciper

1. **Fail-closed är icke förhandlingsbart.** Varje klassning är en
   allowlist; varje fil som inte uttryckligen matchar en lägre klass ger
   full svit. Okänt ⇒ D3.
2. **Deterministiskt från changed files** — ingen ML, inga labels som kan
   rösta ned risk. Nx/Turborepo-"affected" är närmaste branschprecedent
   för deterministisk selektion; Meta/Shopify är ML-/graf-varianterna vi
   medvetet INTE behöver på denna repostorlek.
3. **Paraplyet består:** "CI Passed or Skipped" rapporterar ALLTID (jobb
   skippas internt med `if:`, aldrig via workflow-level path-filter) —
   undviker GitHubs pending-required-check-fälla; aggregatorn förblir
   required-check-stabil (ADR-076).
4. **Husets idiom återanvänds:** changed-files-detektionen (ADR-029),
   config-driven grindvakts-logik, kontrastbevis-runs (TASK-15-
   precedenten), gate-proof-workflows (a11y-grindens run 27337333679).
5. **Snabbt före merge, uttömmande i bakgrunden, trunk alltid mekaniskt
   skyddad** (Fowler staged builds; Google presubmit/postsubmit; DORA
   small batches — processgranskningens källor, återanvända).

## Klasserna (våg 2a)

| Klass | Detektion (allowlist) | Blockerande före merge | Skippat |
|---|---|---|---|
| **D0 docs** | befintlig `should_skip_tests` (orörd) | lint-jobbet + docs-jobbet | test-fast, a11y, test-staging, visual |
| **D1 UI-yta** | NYTT output `ui_low_risk`: `src/styles/**`, `**/*.css`, `public/**` — med SAMMA exkluderingsmönster som D0 (workflows/package*/configs ⇒ aldrig D1) | lint, test-fast (pure+build), a11y, **visual** | test-staging (⇒ ingen mutex) |
| **D3 allt annat** | default | allt (dagens fulla svit + visual) | — |

- Medvetet INGEN D2 i v1 (processgranskningen enig: börja inte med
  testgraf). Copy-ändringar i `.tsx` är inte path-detekterbara ⇒ ärligt
  D3 tills vidare; en framtida D2 kräver E2E-taggning per yta — egen
  designomgång.
- `ui_low_risk` beräknas i `changed`-jobbet som tredje output, samma
  changed-files-actionsteg och quotepath-invariant (TASK-15) som
  D0-detektionen.
- Grind-bevis vid implementation: kontrastbevis-tripel — (i)
  css-only-commit ⇒ D1-run utan staging-jobb, (ii) css+ts ⇒ full, (iii)
  css+ci.yml ⇒ full (exkluderingen biter). Run-ID:n bokförs.

**Effekt:** css-/token-PR ~10 min + kö ⇒ ~2–3 min utan kö, med MER
relevant signal (visual + a11y) än dagens fullsvit ger för CSS.

## Merge-run-dedup (våg 2a)

Problem (processgranskningen § 5): varje merge kör om identiskt innehåll
~10 min på main-push och håller mutexen mot nästa PR.

Design: main-push-runs börjar med tree-jämförelse — `git rev-parse
'HEAD^{tree}'` slås upp mot cache-nyckeln `green-tree-<treehash>` som
gröna PR-runs skriver (`actions/cache`, husidiom). Träff ⇒ heavy-jobben
skippas (`ci-passed` grön per "or Skipped"-semantiken); miss ⇒ full svit.

- Sund TACK VARE ADR-076:s strict up-to-date: merge commit av
  up-to-date-branch har tree ≡ PR-head-tree.
- Fail-closed: cache-miss/eviction/tvivel ⇒ full körning. Dedup kan bara
  ge falsk-KÖRNING, aldrig falsk-skip av otestat träd (nyckeln är
  innehållsadresserad av trädet självt).
- Effekt: mutex-last per merge-cykel ~2×10 min ⇒ ~1×10 min.

## Visual regression byggs från noll (våg 2b; `tests/visual/` är TOM idag)

1. **Baselines föds i CI, aldrig lokalt.** Playwright-docs: skärmdumpar
   är plattformsbundna (`{test}-{browser}-{platform}.png`) och ska
   genereras i miljön de jämförs i. Dedikerad `workflow_dispatch`-workflow
   (`update-snapshots.yml`) kör `test:visual --update-snapshots` på
   ubuntu och öppnar en **baseline-PR** — varje baseline-ändring är en
   granskningsbar diff, aldrig tyst. Endast `-linux.png` committas;
   darwin-baselines gitignoreras.
2. **Deterministisk data:** visual-testerna mockar EF-svaren med
   fixtur-JSON (`page.route`) — noll staging-beroende ⇒ noll mutex,
   stabila pixlar. Datumkänsliga ytor fryses via fixtur + vid behov
   `stylePath`-maskning; stabilitets-config finns redan
   (maxDiffPixelRatio 0.01, threshold 0.2, animations disabled i
   `playwright.config.ts` expect-blocket).
3. **Scope v1:** FACIT-tunga vyerna — Event-listan, Event-detalj, Skapa
   event, Ny anmälan, Hem, Mer — × visual-desktop (1440×900) +
   visual-mobile (375×812) ≈ ~12 bilder, ~1–2 min jobb.
4. **CI-wiring:** eget jobb `visual` (D1+D3, skip på D0), utan mutex.
5. **Kadens-regel:** Playwright-/Chromium-bump ⇒ förväntad baseline-drift
   ⇒ update-snapshots-workflow ⇒ baseline-PR granskas ihop med bumpen.

## Rött-först — bärarbyte (våg 2c; Marcus beslut A låst 2026-07-23)

Nuläge: avsiktligt röda commits pushas ensamma för citerbara röda CI-runs
(7 av 30 senaste runs); varje sådan konsumerar kö + mutex och urvattnar
rött-som-signal. L317 gav dessutom nytt empiriskt stöd: bevisformen
tappar TYST sitt röda varv om PR:en öppnas efter fix-committen.

Verkställs som ADR-071-amendering (fix-vågens kontrakt):

1. Rött-först förblir OBLIGATORISKT lokalt: testet skrivs, körs rött,
   körutdraget (testnamn + fel + antal) citeras i kort/sessionsdok.
2. Rött + grönt pushas IHOP ⇒ CI kör en gång, på grön head; historiken
   behåller båda commits (forensiken via git, inte via röd run).
3. Grind-bevis (att en CI-grind fyrar) flyttar till riktad
   `workflow_dispatch`-workflow som kör ENDAST grinden i fråga —
   gate-proof-precedentens klass, utan att röra staging-kön.
4. Röd CI återfår sin betydelse: OVÄNTAD regression.

## Nightly + larmkedja (våg 2a — landar i SAMMA våg som D1 + dedup)

- `schedule`-workflow ~03:00 Europe/Stockholm: full svit inklusive full
  visual, full lychee utan cache, audit-bredd; staging-stegen i mutexen
  (tom kö nattetid).
- Rött ⇒ automatiskt `gh issue create` (label `ci-natt`, assignee
  marcus803) med run-länk + commit-range sedan senaste gröna nightly.
  Kyrkogårds-vakten: nightly-issue stängs endast med åtgärd eller öppen
  decline-rationale (regel in i CONTRIBUTING vid implementation).
- Nightly är förutsättningen som gör D1-skipp + dedup försvarbara
  (post-submit-nätet under presubmit-selektionen — Google-modellen).
  Sekvens-invariant: D1/dedup aktiveras INTE utan nightly i samma våg.

## Mätning (våg 2a)

`scripts/ci-metrics.mjs` (gh api, ~100 rader): PR lead time p50/p95,
kö-tid (run created → test-staging started), röd-orsak per jobb,
flaky-rate (Playwright retries), dedup-träffkvot. Körs i nightly +
manuellt. Läsregler per L314 (full SHA) + L319 (rerun-medvetenhet;
`cancelled` kan vara jobb-timeout). DORA-måtten som riktning.

## Våg 3 — riktning (samdesignas med bas-maximeringen, ADR-063; EJ nu)

Run-ID-scoping av staging-data (varje run skapar/filtrerar/purgar sina
egna poster; ADR-060-sentinelmönstret generaliseras), fasta delade poster
bort (`TEST_REGISTRATION_RECORD_ID` ⇒ per-run-seed — löser samtidigt
T45), därefter avvecklas mutexen helt (T27 tangeras). Run-scoping förs
in som bas-designkrav i bas-maximeringens kravspec. Mutexen är interim
per ci.yml:s egen deklaration ("defense-in-depth … komplement").

## Sekvensering och status

| Våg | Innehåll | Status |
|---|---|---|
| 1 | ruleset + actionlint + jobb-splitt | **EXEKVERAD S77** (ADR-076, PR #99, grind-bevis i sessionsdok) |
| 2a | D1-klassen + merge-dedup + nightly/larm + mätskript (ETT paket) | design klar (detta dok); ADR vid implementation |
| 2b | visual-bygget (baselines-workflow + ~12 vyer + CI-jobb) | design klar; egen skiva |
| 2c | rött-först-bärarbytet | beslut A låst; verkställs som ADR-071-amendering vid våg 2 |
| 3 | staging-per-run-isolering | riktning satt; samdesign med ADR-063 post-Fas-6 |

ADR-bar-bedömning: våg 2a = EN ADR ("Riskanpassad CI: klassning, dedup,
nightly"); visual-bygget dokumenteras i samma ADR:s konsekvens-del;
bärarbytet = ADR-071-amendering. Avvisat (öppet): merge queue (ägarform),
ML-testselektion, retroaktiv dok-bantning, "flytta allt tungt till
natten" utan presubmit-relevans (sen feedback ersätter inte snabb).
