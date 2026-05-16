<!-- vale Vale.Terms = NO -->
<!-- DEFERRED: Session 6.6.6 — Vale.Terms canonical-cap fix -->

# ADR-030: Docs-grindvakter + frontmatter-policy

- Status: Accepted
- Datum: 2026-05-14
- Fas: Session 6.6 — Docs-grindvakter + frontmatter-policy + observations-pass (mellan Fas 2 och Fas 2.5)

## Kontext

ADR-029 (2026-05-13) etablerade Strategi E (changed-files + needs-skip + aggregator) som kanonisk CI-arkitektur och lade till lychee broken-link-validering som NY kvalitets-check i `docs`-jobbet. ADR-029 § "Konvention för framtida CI-utvidgningar" säger explicit: *"Nya docs-checkar (markdownlint, cross-doc-grep-automation, spell-check) — läggs som steg i `docs`-jobbet"*. ADR-030 är förstā exekvering av den konventionen.

Session 6.5 (2026-05-14) eliminerade 54 broken refs men exponerade att lychee endast fångar **referensdrift** (samma ord, fel länkmål) — inte **innehållsdrift** (samma faktum, olika ord) eller **terminologi-drift** (Vue→React stack-skifte per ADR-027). Lessons från Session 6 (K1.14 lychee + cross-doc-grep komplementära) + Session 6.5 (K6.5.4 markdown-länk-divergens, K6.5.7 polish-inom-semantik-domän) bekräftade att en single-check-strategi inte fångar drift-domänen heltäckande.

Två konkreta drift-kategorier saknar mekanisk grindvakt idag:

1. **Språklig/terminologi-drift.** ADR-027 stack-skifte Vue→React (Session 5b) etablerade ny terminologi (`hook` istället för `composable`, `useState` istället för `ref()`, etc.). Pre-existing Vue-formuleringar i prosa upptäcktes manuellt via K5.9c cross-doc-grep men endast för specifika strängar — Vale ger fullbredd preventiv detektion på rad-nivå.

2. **Metadata-drift på styrande dokument.** Hub-CLAUDE.md + projekt-CLAUDE.md + byggplan.md + BYGGPLAN-LÄTTLÄST-v3.md har idag manuella "Senast uppdaterad: YYYY-MM-DD"-fält i prosa. Session 6.5 K2.13 bekräftade att dessa driftar (projekt-CLAUDE.md angav `2026-05-06` när faktisk senaste edit var senare). Inget mekaniskt skydd existerar.

Marcus' Gate 2-kvalitetsregel 2026-05-13 ("INTE sänker kvaliten på våra CI utan höjer kvaliten") + K1.16 success-signal från Session 6 (grindvakt avslöjar oväntade kategorier) motiverar samma strategi: investering i grindvakter har empiriskt avslöjat högre värde än baseline-antagit varje gång.

Pre-Fas-2.5-positionen är fortfarande idealisk för process-investering: ingen pågående fas-blocking, kontextfärsk lessons-trail (Session 6.5 13 hub-lyfta lessons), och framtida-konsumenten (Fas 2.5 + 3 + 3.5 + ... = stora doc-volymer producerade) drar nytta direkt.

## Beslut

### Del 1 — 4 docs-grindvakter

Följande 4 grindvakter etableras, fördelade över `docs`-jobbet och `lint`-jobbet per ADR-029 § Konvention. Position #2 (typos) är **Considered + rejected** post-K3-baseline (2026-05-14) men bevaras som slot-numrering för trail-spårbarhet per ADR-022 kategori-utvidgning-mönstret:

1. **markdownlint-cli2** (docs-jobb) — implementerad K4 2026-05-14, Strategi B+
   - Markdown-hygien: rubriknivåer (MD001/MD003), listor (MD007), kodblock (MD040 språk-tag), tabeller (MD055/056/058/060)
   - Lokal config `.markdownlint-cli2.jsonc` med 3 motiverade rule-anpassningar:
     - **MD013 (line-length): disable** — svensk prosa har långa sammansatta ord; branschpraxis (Vite/Next.js/Astro) disable:ar MD013 i markdown
     - **MD060 (table-column-style): disable** — repo använder kompakt `|kol|`-stil konsekvent över ~250 tabeller; aktivt val, ej slapphet
     - **MD024 (no-duplicate-heading): siblings_only** — Keep-a-Changelog-konvention `### Changed` per `## [X.Y.Z]`-release; siblings_only flaggar duplicering inom samma parent (legitim hygien) utan TOC-störning
   - Scope: `docs/**/*.md` + `tasks/*.md` + `./*.md` (matchar lychee-scope; sessionsdok-archive + docs/archive exkluderade)
   - **Empirisk baseline + fix-resa (K4):** 10 570 → 0 fynd (~99.86 % reduktion):
     - Config-disables (MD013/MD060/MD024 siblings): 9 668 → 0
     - Auto-fix `--fix` (MD032/22/31/58/34/50/29/26/7): 902 → 0 inkl. MD034 bare-URLs som auto-konverterades till `<url>`-format
     - Manuell MD040 (77 språk-tags): `text`-default på alla bare ``` -block; selektiv upgrade till bash/yaml/json deferras som polish till framtida session
     - Manuell MD036 (38 fynd, Strategi B+ hybrid): 14 strukturella → `### N. ...` (ADRs alternativ-listor + data-model.md trigger-sekvenser); 24 inline-emfas → `<!-- markdownlint-disable-next-line MD036 -->`-disable (gap-analysis Betyg-tags, BYGGPLAN-LÄTTLÄST estimat-tags, metadata-headers)
     - Sub-A inline DEFERRED-FIX-MARKER (15 fynd, per K1.13 per-item-spårbarhet): MD051 (7 broken-anchors i Vue-referens-doc), MD056 (4 tabell-cell-överskott i frusen Vue-referens), MD041 (2 first-line-heading), MD028 (1 BYGGPLAN-LÄTTLÄST blockquote), MD025 (1 multi-section analys-rapport)
   - **Implementation:** npm devDependency (`markdownlint-cli2: ^0.22.1` i package.json), körs via `npx markdownlint-cli2` i docs-jobbet efter lychee. Ingen pre-commit-hook (markdownlint är CI-only-grindvakt; pre-commit reserveras för biome + K7-frontmatter)

2. **typos** — Considered + rejected per empirisk baseline 2026-05-14

   <!-- vale Miranon.Brand = NO -->
   **Pre-empirisk antagande:** typos listades som generic stavfels-detektor med custom-dictionary av 22 termer (prep-dok Del 3.3 — Airtable, Supabase, TanStack, nuqs, Biome, Vite, Playwright, FK, Lotta, Roger, Miranon, RLS, JWT, OWASP, ARIA, CVA, OAuth, PKCE, Edge Functions, Dependabot, lychee, markdownlint, yamllint).
   <!-- vale Miranon.Brand = YES -->

   **Empirisk baseline (Session 6.6 K3, 2026-05-14):** `typos-cli 1.46.1` default-extends mot full repo producerade **6 490 fynd**. Topp-30 fel-ord sorterat efter frekvens: alla är svenska ord (2742 `som` → `some`, 244 `appen` → `append`, 183 `dokument` → `document`, 178 `separat` → `separated`, 125 `tre` → `tree`, 120 `ser` → `seer`, 99 `modell` → `model`, 95 `manuell` → `manual`, etc.). 22-term-dictionary skulle åtgärda ~0.3 % av faktiska problemet.

   **Beslut:** Skippa typos helt. Verktyget är engelsk-only-default; svensk-prosa-dominerande kodbas producerar massiv false-positive-rate. Stavnings-substans flyttas till Vale (#3, scope utvidgad nedan). Custom-vocabulary från ursprunglig design migreras till Vale-styles.

   **Disciplin-trail:** K11-tillämpning ("minimalt test pre-implementation") på ADR-design-tid: empirisk baseline-mätning fångar tool-uppgift-mismatch innan permanent CI-integration. K1.16 success-signal i inverterad form — grindvakts-baseline avslöjar att verktyget inte hör hemma i stacken. Lokal `typos-cli` avinstallerad 2026-05-14 post-beslut.

   Slot-numrering #2 bevaras för trail-spårbarhet per ADR-022 kategori-utvidgning-precedent.

3. **Vale** (docs-jobb) — implementerad K6 2026-05-14 (post-K6.1+K6.2-empirisk pivot)
   - **Vale.Spelling AV (F.1' pivot per K6.1):** Engelsk-hunspell-default producerade 49 664 svenska false-positives på K6.1 baseline. Mönsterförstärkning av K3-typos-rejection. Stavnings-validering levereras INTE av Vale i K6 — flyttat till per-fall manuell granskning eller framtida F.1''-strategi (svensk hunspell-paket)
   <!-- vale Vale.Repetition = NO --> <!-- legitim meta-referens: svensk förkortning "m.m." nämnd som data-domän -->
   - **Vale.Repetition PÅ:** Verifierad fungera; 2 fynd hanterade inline-disable i K6.2 (Event.Event Airtable-notation + m.m. svensk förkortning)
   <!-- vale Vale.Repetition = YES -->
   - **`Vocab/Miranon/accept.txt` (25 termer):** Auto-genererad Vale.Terms via Vale 3.14.1 (case-folding canonical-substitution). Dubbel-funktion (spelling-bypass + canonical-cap) bekräftad empirisk i K6.2 V1-V3. Stavning.yml-fil borttagen — Vocab är single source via Vale.Terms (TypeScript/GitHub-canonical migrerade till Vocab i K6.2 Steg 6)
   - **3 Miranon-stilguide-filer (post-K6.2 — Stavning.yml borttagen):**
     - **VueToReact.yml** (substitution, error): 11 unika substitutions per ADR-027 stack-skifte
     - **Brand.yml** (substitution, error): inline-lookbehind+lookahead `(?<!Miranon )Miranon(?! Media)(?![-a-zA-Z0-9_])`. K6.1 RE2-test bekräftade lookbehind/lookahead-stöd (mot pre-empirisk hypotes). Empirisk K6.2 baseline: 0 fynd — förebyggande-regel mot framtida drift per Marcus' Alt A
     - **Undvik.yml** (existence, suggestion): `obviously`/`uppenbarligen`/`simply`/`enkelt`-domän
   - **Frontmatter quote-fix (emergent K6.2):** `docs/research/datamodell-research/03-gap-analysis.md` + `01-extraction.md` YAML-frontmatter quote-fix:ad. Vale's YAML-parser stoppade på okvoterade kolonkonkretade värden. K1.16 success-signal — grindvakts-introduktion avslöjade pre-existing-skuld
   - **K6.2 V4 empirisk fynd:** Vale 3.14.1 har INGEN `--fix`-flagga. Manuell sed-batch är osäker för 3/5 unika Vale.Terms-substitutioner (`aria`/`fk`/`vite` har hög kod-bryt-risk i HTML-attribut + CSS-klasser + filnamn)
   - **Defer-strategi (K6.2 Steg 7 Alt F per Marcus):** 425 Vale.Terms + 114 VueToReact-regel-fynd deferade till mini-session 6.6.6 via **per-fil rad-1-disable** (utan = YES, open-ended scoping till filslut). Regression-skydd: vid 6.6.6 K-sista tas disable-raderna bort → Vale återaktiveras automatiskt. K1.13-utvidgning: per-fil-spårbarhet är legitim defer-form när inline-per-occurrence inte robust (Vale wrap-around failade vid bulk pga nested-wrap-bug)

   - **Empirisk K6.2 baseline:** 566 → 8 fynd (~98.6 % reduktion). 8 kvarstående är Miranon.Undvik suggestions (mild). Vale exit 0 (suggestions blockerar inte CI)
   - **CI-integration:** Vale-binary download v3.14.1 per ADR-029 § Third-party Actions-policy (vale-action ~17 mån gammal; binary minimerar Actions-supply-chain-yta). Docs-jobb-step efter markdownlint-cli2
   - Scope: `docs/` + `tasks/` + repo-root publika `.md` (sessionsdok-archive + docs/archive exkluderade via `.vale.ini`-fil-pattern)
   - Ingen pre-commit-hook (CI-only-grindvakt)

4. **yamllint** (lint-jobb — snabb)
   - YAML-syntax + indentering
   - Scope: `.github/workflows/*.yml` + `.github/dependabot.yml`
   - Lokal config `.yamllint.yml` med `line-length: disable` (CI YAML har långa rader)

5. **scripted-checklist-check** (lint-jobb — snabb shell) — implementerad K5 2026-05-14
   - Detektera oavslutade `- [ ]` i publika docs som **inte** är legitima mall-sektioner
   - Scope (vita listan, måste vara grön): `README.md`, `CHANGELOG.md`, `SECURITY.md`, `CONTRIBUTING.md`, `docs/byggplan.md`, `docs/specs/BYGGPLAN-LÄTTLÄST-v3.md`
   - **Per-sektion-medveten exklusion i CONTRIBUTING.md:** `^## Definition of Done`-rubriker triggar skip=1 tills nästa H2-rubrik (`^##`) påträffas, då skip=0. Säkerställer att `- [ ]`-rader UNDER en exklusions-sektion ignoreras MEN rader UNDER en följande sektion fångas normalt — Marcus' caveat-test bekräftad empiriskt
   - **Empirisk baseline (K5):** 0 fynd utanför CONTRIBUTING-mallar — vita listan redan grön före grindvakt-aktivering
   - **Felmeddelande-design (K11.5 11/10-disciplin):** fil:rad-format (klickbart) + faktisk item-text + actionable fix-rekommendation (3 alternativ: complete / move-to-todo / move-to-sessionsdok)
   - **Empirisk 4-test-suite verifierad:** (1) clean state → exit 0, (2) README.md inject → exit 1 + actionable output, (3) CONTRIBUTING.md inject UNDER Definition of Done → exit 0 (exkluderad), (4) Marcus' caveat-test CONTRIBUTING.md inject EFTER Definition of Done-sektioner under annan H2-rubrik → exit 1 (per-sektion-skopa)
   - Implementation: [`scripts/check-public-checklists.sh`](../../scripts/check-public-checklists.sh) — bash + awk, inga deps, <1s exekvering
   - CI-integration: lint-jobb-step efter yamllint, kör alltid (även kod-only)
   - Ingen pre-commit-hook (CI-only-grindvakt; pre-commit reserveras för biome + K7-frontmatter)
   - *Refactored 2026-05-15 till config-driven (`.checklist-policy.conf`) per K7 Lesson #6 (UNIVERSAL) hub-spoke-portabilitet. Test-suite utvidgad till 5 testfall (T5 = saknad config → actionable error). Trail: Session 6.6 fortsättning #2 K7.5.*

### Del 2 — Frontmatter-policy (4 fält)

YAML-frontmatter etableras på styrande dokument med exakt 4 fält:

```yaml
---
owner: marcus803
updated: 2026-05-14
review_by: 2026-11-14
status: stable  # draft | stable | deprecated
---
```

**Tillämpas på 10 styrande dokument** (1 hub off-scope + 9 i validator-scope per `.frontmatter-policy.conf`; konkretiserad post-Session 6.6 K-sista per K7.A pre-flight-fynd + K7.5 Block A drift-detektering):

1. `~/Repon/marcus-system/CLAUDE.md` (hub-konstitution, validerad separat i marcus-system-repot)
2. `CLAUDE.md` (projekt-konstitution)
3. `docs/byggplan.md`
4. `docs/specs/BYGGPLAN-LÄTTLÄST-v3.md`
5. `docs/specs/KVALITETSDEFINITIONER-11-REACT.md`
6. `docs/specs/SECURITY-SPEC.md`
7. `docs/reference/hur-systemet-funkar.md`
8. `docs/reference/data-model.md`
9. `tasks/lessons.md`
10. `docs/decisions/README.md`

**Tillämpas EJ på:**

- Sessionsdok (immutable per ADR-023 vid arkivering)
- ADR-er (egen `Status: ... | Datum: ... | Fas: ...`-header per `docs/decisions/README.md` § Format)
- Publika top-level docs (`README.md`, `CHANGELOG.md`, `SECURITY.md`, `CONTRIBUTING.md`) — egen ADR-024-domän (`README.md` har badges + status-rad istället; `CHANGELOG.md` har Keep-a-Changelog-format)

### Del 3 — Pre-commit hook + CI-validering (frontmatter)

**Pre-commit hook** (`.git/hooks/pre-commit` eller `lefthook`-style — beslutas i K7):

- Vid stage av styrande dokument (lista ovan) — auto-bump `updated:` till `git log -1 --format=%cs` motsvarighet (om värdet driver)
- Ingen ändring om `updated:` redan matchar dagens datum (idempotent)
- Hoppas över för `--amend` (bevarar ursprunglig commit-datum)
- Hoppas över om commit inte rör styrande docs (mekanisk file-pattern-check)

**CI-validering** (lint-jobb — snabb):

1. Validera att frontmatter finns på alla filer i styrande-docs-listan (failar om saknas)
2. Validera att `updated` matchar `git log -1 --format=%cs <fil>` (mekanisk konsistens — failar om drift > 1 dag, tillåter race-condition mellan commit + push)
3. Validera att `review_by > today()` (failar om passerat → tvingar re-verifiering)
4. Validera att `status ∈ {draft, stable, deprecated}` (enum-strikt)
5. Validera att `owner` matchar `marcus803` (enum-strikt; utvidgas vid behov om andra ägare tillkommer)

### Implementations-krav på CI-miljö

> Sub-§ tillkommen Session 6.6.5 K-sista #3 (2026-05-16) efter L8-fyndet — latent shallow-clone-incompatibility upptäckt vid K1.5 forensisk-pass.

Check 2 anropar `git log -1 --format=%cs -- <fil>` som returnerar filens senaste touch-datum. På GitHub Actions med default shallow clone (`fetch-depth: 1`) returnerar kommandot HEAD-commit-datum istället för filens senaste touch — vilket bryter Check 2-logiken för filer som inte rörts i HEAD.

**Krav på CI-jobb som kör `scripts/check-frontmatter.sh`:**

- `actions/checkout@vX` MÅSTE använda `fetch-depth: 50` (eller mer)
- Motivering: konsistent med ADR-029 § Utelämning #6 (single-author push-pattern <15 commits/session; 50 = 3x-marginal)
- Tillämpas på alla jobs som direkt eller indirekt anropar `check-frontmatter.sh` (lint, test, docs i denna repo-konfiguration)

**Bug-historik:** Latent shallow-clone-incompatibility upptäckt 2026-05-16 (Session 6.6.5 K1.5 forensisk-pass) — triggades första gången efter dag-rollover som bröt sammanträffande invariant från K7.C atomisk bake-in (2026-05-15, alla 9 styrande docs samma `updated:`-datum som HEAD). Rotorsak-fix via K2.1 fetch-depth-retrofit på lint + test + docs jobs (commit `a67908d`).

**Hub-portabilitet:** Vid duplicering av frontmatter-grindvakten till annan spoke per K7.6, kopiera fetch-depth-config tillsammans med skript- och config-filer. Glömd fetch-depth-config triggar samma latent bug. Lessons-trail: `tasks/lessons.md` L8 (Session 6.6.5).

**Defensive programming (implementerad i ADR-033 K4):** Shallow-clone-detection via hybrid-check (`git rev-parse --is-shallow-repository` + `git rev-list --count HEAD < threshold`) implementerad i `scripts/check-frontmatter.sh` (detection-block PRE-Check-2-loop) som defense-in-depth-lager 2 mot fetch-depth-config-glömma vid spoke-kopiering. Threshold konfigurerbar via `FRONTMATTER_MIN_HISTORY_DEPTH` i `.frontmatter-policy.conf` (default 50, matchar `fetch-depth: 50`-konvention). Hard-fail på unsafe-shallow (`is-shallow=true` AND `count<threshold`); safe-shallow (`count>=threshold`) + full-clone (`is-shallow=false`) passerar. Implementations-trail: K4.1 ([ADR-033](ADR-033-shellcheck-strict-grindvakt.md) commit `b2970fd`) → K4.1.1 hot-fix för fetch-depth: 50-false-positive (commit `4dc55e5`) → K4.2 test-suite T10-T12 (commit `47f8ed8`). Test-täckning: 4 truth-table-scenarier i `scripts/test-check-frontmatter.sh` (T10/T11a/T11b/T12).

### Del 4 — ADR-numrering vs ADR-029-utvidgning

ADR-030 är **ny ADR**, inte utvidgning av ADR-029. Konceptuellt distinkta domäner:

- **ADR-029:** CI-arkitektur (jobs/job-flow/changed-files/aggregator) + third-party Actions supply-chain-policy
- **ADR-030:** Docs-hygien-policy (lint-verktyg/språkstilguide/metadata-konvention)

Båda lever i `.github/workflows/ci.yml` men har olika konsekvenser, olika underhållsdomäner, och olika typer av framtida-utvidgning. Trail-spårning blir tydligare när 2 ADR:er istället för 1 omfattande.

Konsekvensen relateras explicit: ADR-030 § Spårbarhet pekar tillbaka till ADR-029 som föregångare; ADR-029 § Konvention för framtida CI-utvidgningar förutsätter denna typ av extension.

## Alternativ övervägda

| # | Alternativ | Varför avvisad |
|---|---|---|
| A | Manuella "Senast uppdaterad"-fält som idag (status quo) | K2.13 (Session 6.5) drift-bekräftat empiriskt; ingen mekanisk garanti; läsare har ingen "när reviewades?"-svar |
| B | YAML frontmatter med fler fält (tags, changelog, authors, related-adrs) | Överengineering per K11-disciplin; 4 fält räcker för K7-CI-validering; fler fält ökar pre-commit-hook-komplexitet utan empirisk drivande observation |
| C | Frontmatter på ALLA docs (inkl. sessionsdok + ADR:er) | ADR-023 immutability + ADR-egen-`Status:`-header-konvention bryts; sessionsdok är immutable vid arkivering så `updated:`-auto-bump är meningslös |
| D | Externt metadata-register (`docs.json` eller liknande) | Otdetekterbart vid file-edit; två sanningskällor (fil + register) skapar synk-problem; bryter "läs filen och se metadata"-friktionsfrihet |
| E | ESLint-style egen markdown-parser (single tool) | Ingen branschstandard; underhållsbörda; jämför med 5 specialiserade verktyg som har egen community |
| **F** | **markdownlint + typos + Vale + yamllint + scripted-check + frontmatter med pre-commit + CI-validering** | **Ursprunglig VAL — post-K3-baseline reviderad: typos avvisat per Alt G, övriga 4 grindvakter aktiva** |
| G | Behåll typos med svensk allow-list (~100+ ord) | Avvisad post-empirisk K3-baseline 2026-05-14: 6 490 fynd indikerar tool-uppgift-mismatch, inte tunable config-gap. Permanent underhållsbörda utan substantiell vinst. K11-disciplin (testa minimalt pre-implementation) tillämpad på ADR-design-tid. Stavnings-substans flyttad till Vale (#3) post-revision |

## Konsekvenser

**Positivt:**

- 4 grindvakter fångar drift FÖREBYGGANDE (vs reaktivt som K5.9c cross-doc-grep + lychee), bygger ut docs-jobb-yta etablerad av ADR-029
- K4 markdownlint-cli2 (Strategi B+) reducerade 10 570 pre-existing fynd till 0 i en enda session — bevisar att aggressiv config + auto-fix + manuell hybrid är 11/10-ergonomisk även för stora baselines. Mönsterförstärkning av K1.16 (grindvakt avslöjar emergent värde)
- K5 scripted-checklist-check etablerade publika-docs-status-skydd med per-sektion-medveten awk-pattern (CONTRIBUTING.md `## Definition of Done`-mallar exkluderas korrekt). Felmeddelande-design per K11.5 11/10-disciplin: fil:rad + item-text + actionable fix-rekommendation
- Vale specifikt fångar ADR-027-typ-stack-skifte-drift på rad-nivå — *före* den blir lessons-skuld. Vale-scope utvidgad post-K3 med stavnings-validering — en sammanhållen pipeline för språk/ton/terminologi/stavning
- Frontmatter ger mekanisk "när reviewades senast?"-svar (eliminerar manuell-prosa-drift bekräftad i K2.13)
- `review_by`-fält tvingar tidsbunden re-verifiering — disciplin-trail genom CI istället för manuell påminnelse
- Pre-commit hook = ingen manuell jobb för Marcus/AI vid commit (idempotent)
- Vale-vocab ger tre-läsare-symmetri (terminologi i CLAUDE.md = terminologi i CI). 22-term-dictionary från ursprunglig typos-design migrerad
- Scripted checklist-check fångar publika-docs-friktion utan att begränsa legitim CLAUDE.md/CONTRIBUTING-mall-användning
- typos-avvisning post-K3-baseline är K11/K1.16-disciplin tillämpad på ADR-design-tid — empirisk pre-flight-test fångar tool-uppgift-mismatch innan permanent CI-friktion

**Negativt:**

- 4 nya CI-steg → docs-jobb-tid ökar (~30s baseline → uppskattat ~35-50s med markdownlint + Vale; lint-jobb ~22s → ~25-30s med yamllint + scripted-checklist). yamllint empiriskt verifierat 2s overhead i K2 (run 25860230593)
  - Mitigation: ADR-029 changed-files-skip-mönster betyder docs-only-commits ändå är ~3-4x snabbare än kod-commits; absolut tid-ökning är liten
- 3 nya CI-verktyg (markdownlint-cli2, Vale, yamllint) + 1 scripted-shell (scripted-checklist-check) → utvecklingsmiljö-friktion (npm install + lokal-run-rekommendation för pre-commit-feedback)
  - Mitigation: dokumentation i `CONTRIBUTING.md` "Lokala dev-verktyg (frivilligt)"-sektion + brew/pipx-install-instruktioner per verktyg
- Frontmatter-migration kräver bulk-add till 7+ filer + pre-commit-hook-verifikation att hooken funkar
  - Mitigation: K7 är dedikerad till migration + verifiering; "Senast uppdaterad"-prosa borttagning samordnas
- Vale-vokabulär kräver underhåll vid nya stack-skiften eller brand-justeringar. Post-K3-utvidgning lägger till stavnings-vocab-underhåll
  - Mitigation: `.vale/`-config är versionerad; ändringar via PR med ADR-trail; veckovis-granskning *inte* nödvändig (drift är låg-frekvent); accept-list growth-takten begränsad av Vale's smarta default-vocab
- markdownlint kan rapportera baseline-fynd som kräver fix-paket eller DEFERRED-FIX-MARKER per ADR-029 § Baseline-fynd-mönster
  - Mitigation: empirisk add-only-policy (samma som `.lycheeignore`) — pre-existing-skuld blir explicit defer eller fix, inte tystas

**Cross-ref till ADR-029:**

ADR-030 bygger vidare på ADR-029:s CI-arkitektur med ett docs-hygien-lager. ADR-029 etablerade `docs`-jobbet som hemvist för markdown-link-validering (lychee); ADR-030 utvidgar samma jobb med markdownlint-cli2 + Vale. typos + yamllint + scripted-checklist-check hänger på `lint`-jobbet (typos = stavning är universellt, yamllint = config-syntax är inte docs i strikt mening, scripted-checklist-check = snabb shell-script).

ADR-029 § Konvention sa: *"Nya docs-checkar — läggs som steg i `docs`-jobbet"*. ADR-030 följer den konventionen.

Strategi E changed-files-skip-mönster är intakt: kod-only-commits skippar fortfarande `docs`-jobbet (markdownlint + Vale inkluderat); docs-only-commits skippar `test`-jobbet. Empirisk ~64 % CI-tids-besparing per ADR-029 § Baseline-fynd bevaras.

**Säkerhet (Actions-supply-chain):**

Nya CI-steg använder antingen npm-paket (markdownlint-cli2, typos, Vale, yamllint) som körs lokalt på runner via `npx`/Python — *inte* tredjeparts-Actions. Lägre supply-chain-yta jämfört med lychee/changed-files-Actions. K17-disciplin gäller fortsatt: nya tunga Actions skulle kräva SHA-pin per ADR-028 + ADR-029 § Actions-policy.

Pre-commit-hook implementation (lefthook eller pure-shell) introducerar ev. nytt npm-paket — beslutas i K7 med pin-verifiering per ADR-028.

## Medvetna utelämningar och scope-avgränsningar

Per Marcus' Gate 2-kvalitetsregel 2026-05-13: varje utelämning dokumenteras explicit med motivering, senior-team-test och 11/10-test.

1. **Sessionsdok-archive (`tasks/sessions/archive/**`) exkluderas från alla 5 grindvakter.** Per ADR-023 är arkiverade sessionsdok immutable. Lint-fynd här skulle vara historisk-drift som inte kan/ska åtgärdas. Senior-team-test: ja, frozen content lint-checkas inte. 11/10-test: konsekvent med ADR-023. **Beslut:** låt stå.

2. **Publika top-level docs (`README.md`, `CHANGELOG.md`, `SECURITY.md`, `CONTRIBUTING.md`) får INTE frontmatter.** Egen ADR-024-domän + Keep-a-Changelog/standard-format. Senior-team-test: branschstandard har egna metadata-konventioner per fil-typ. 11/10-test: respekterar etablerade ADR-024-konventioner. **Beslut:** låt stå.

3. **ADR-er får INTE frontmatter (behåller `Status: ... | Datum: ... | Fas: ...`-prosa-header).** Etablerad konvention per `docs/decisions/README.md` § Format. Ändring skulle bryta 29 befintliga ADR:er + kräva bulk-edit av immutable-historik. Senior-team-test: ja, ADR-konvention ska inte ändras post-hoc. 11/10-test: respekterar oföränderlighet. **Beslut:** låt stå.

4. **markdownlint MD013 (line-length) inaktiveras.** Svensk prosa + sessionsdok-format har långa rader naturligt. MD013 skulle generera baseline-fynd som inte representerar drift utan stilval. Senior-team-test: många branschledande markdown-config:ar (Vite docs, TanStack docs) inaktiverar MD013. 11/10-test: konfigurations-val baserat på prosa-natur, inte lathet. **Beslut:** låt stå.

5. **Vale-scope inkluderar ADR-er trots semi-frusen-natur.** Motivering: ADR-027 Vue→React stack-skifte etablerade nya termer; pre-stack-skifte-ADR:er kan ha legacy Vue-referenser som *bör* fångas. Senior-team-test: ja, Vale-error på ADR är acceptabel signal — kräver explicit beslut (lägg till undantag) eller content-fix. 11/10-test: bättre fångning > respekterar äldre konvention. **Beslut:** låt stå; revidera om underhållsbörda visar sig hög.

6. **Pre-commit hook installeras ENDAST i `miranon-media-admin`, inte globalt.** Spoke-repo-disciplin. Hub-repo (`marcus-system`) har egen hub-CLAUDE.md-frontmatter men ingen pre-commit-hook (lägre commit-frekvens, manuell-bump acceptabel). Senior-team-test: scope-isolation per repo. 11/10-test: minimerar global tooling-frikoppling. **Beslut:** låt stå.

7. **`status: draft` är pre-frontmatter-migrations-default; `stable` är post-K7-default.** Under K7-migration sätts alla styrande docs till `status: stable` (de ÄR stable; CLAUDE.md är inte ett WIP-dokument). `draft` reserveras för nya specs som inte är reviewade än. Senior-team-test: enum-värden ska reflektera faktisk tillstånd, inte mall-tomt-värde. **Beslut:** låt stå.

8. **Default `review_by = updated + 180 dagar` (6 månader).** Tvingar halvårsvis re-verifiering — tätt nog för att fånga ADR-drift, glest nog för att inte vara frustration. Senior-team-test: branschstandard för "stale docs"-detektion är 3-12 månader. 11/10-test: empirisk justering möjlig om 6 månader visar sig fel. **Beslut:** låt stå; revideras vid första CI-fail av `review_by`-check.

## Konvention för framtida docs-utvidgningar

- **Nya markdown-stil-regler** (MD-koder) — läggs till i `.markdownlint.jsonc`. Aktivering av tidigare-inaktiverad regel kräver lessons-skörd ifall pre-existing-skuld upptäcks.
- **Nya Vale-rules** (substitution/consistency/vocabulary) — läggs till i `.vale/`-config. Stack-skiften (typ ADR-027 Vue→React) triggar Vale-rule-uppdatering som del av samma ADR.
- **Nya typos-ord** (custom-dictionary) — läggs till i `_typos.toml`. Tröskel: ordet förekommer ≥3 gånger i repo + är legitim teknik/brand-term.
- **Nya scripted-checklist-mönster** — läggs till i `scripts/check-public-checklists.sh`. Tröskel: ny publik-doc-typ tillkommer eller ny undantag-zon behöver explicit pattern.
- **Nya frontmatter-fält** kräver egen ADR. 4-fält-konventionen är minimal-tillstånd; tillägg ska motiveras empiriskt, inte preventivt.
- **Nya styrande docs** (där frontmatter ska appliceras) — läggs till i CI-validerings-listan + K7-equivalent migrations-jobb i sessionsdok.

## Spårbarhet

- **Föregångare:** [ADR-029](ADR-029-ci-architektur-changed-files-pattern.md) (CI-arkitektur — changed-files-pattern + Actions-policy, 2026-05-13). ADR-030 utvidgar `docs`-jobb-och-`lint`-jobb-yta med 5 nya grindvakter + frontmatter-validering.
- **Drivande observationer:**
  - Session 6 K1.14 — lychee + cross-doc-grep komplementära (referensdrift vs innehållsdrift); behov av tredje typ (terminologi-drift) avslöjat
  - Session 6 K1.16 — Grindvakt avslöjar oväntade kategorier (success-signal)
  - Session 6.5 K6.5.4 — Markdown-länk-divergens (visa-text vs länkmål) som klass av drift
  - Session 6.5 K6.5.7 — Polish-uppdatering inom samma semantik-domän är 11/10 (motiverar samtidig migration vid frontmatter-add)
  - Session 6.5 K2.13 — Projektkunskaps-färskhet driftar; "Senast uppdaterad"-prosa-fält är instans av samma fenomen i versionskontroll
  - Marcus' explicita begäran 2026-05-14 om frontmatter-policy med pre-commit-auto-bump
- **Etablerad:** Session 6.6 K1 2026-05-14 (sessionsdok [`tasks/sessions/archive/2026-05/2026-05-14-session-6-6.md`](../../tasks/sessions/archive/2026-05/2026-05-14-session-6-6.md)).
- **Implementation:**
  - K2 ✅ KLAR 2026-05-14 — yamllint (uppvärmning, 17 fynd → 0, commit `16ee4ec`)
  - K3 ✅ STÄNGD 2026-05-14 — typos avvisat per empirisk baseline (6 490 fynd, tool-uppgift-mismatch; commit `e74eb2f`)
  - K4 ✅ KLAR 2026-05-14 — markdownlint-cli2 Strategi B+ (10 570 → 0 fynd, commit `dba0440`)
  - K5 ✅ KLAR 2026-05-14 — scripted-checklist-check (0 pre-existing skuld utanför CONTRIBUTING-mallar, commit `5df97b8`+`f408469`)
  - K6 ✅ KLAR 2026-05-14 — Vale + Miranon-stilguide (K6.1 empirisk + K6.2 V1-V5 + Alt F per-fil-disable; 566 → 8 suggestions; 539 deferade till 6.6.6 per per-fil rad-1-disable)
  - K7 — Frontmatter-policy + pre-commit hook + CI-validering (inkluderar "Senast uppdaterad"-prosa-borttagning)
  - K8 — Checklist-trimning av sessionsavslut-checklistan (konservativ; halv-mekaniska defer till Session 6.7 per Marcus' Block D #3)
  - K9 — Empirisk verifikation (full CI-run; tids-mätning per Strategi E-paradigm)
  - K-sista — bake-in commits #1-#3 + lessons + ADR Draft → Accepted (Session 6.6 K-sista commits `01f5cbb` + `4e80647` + `9b5ea87`)
  - **Post-K-sista — Session 6.6.5 K-sista #3 (2026-05-16):** Sub-§ "Implementations-krav på CI-miljö" tillkommen under Del 3 efter L8-fyndet (latent shallow-clone-incompatibility) — rotorsak-fix:ad via Session 6.6.5 K2.1 fetch-depth: 50 retrofit på lint + test + docs jobs (commit `a67908d`). Spårbar via Session 6.6.5 BUILD-LOG-block + `tasks/lessons.md` L8.
- **Verifikation:** empirisk via K9 CI-run. Status bumpas från Draft till Accepted vid K-sista bake-in.
- **Baseline-fynd 2026-05-14:** Lämnas tom i Draft-status; fylls i vid K-sista efter K2-K9 implementation har producerat empirisk data per grindvakt (analog till ADR-029 § Baseline-fynd 2026-05-14).

## Baseline-fynd 2026-05-14

Empirisk data per grindvakt, ifylld vid Session 6.6 K-sista bake-in (commit #1, 2026-05-15). Format analogt till ADR-029 § Baseline-fynd.

| Grindvakt | Filer skannade | Träffar | Klassning | Hantering |
|---|---|---|---|---|
| yamllint | 2 (ci.yml + dependabot.yml) | 17 (12 line-length + 2 truthy + 2 doc-start + 2 comments-spacing + 1 truthy `on:`) | Pre-existing config-syntax-friktion | 2 config-disables (line-length + truthy check-keys) + 4 content-fixes |
| typos | n/a (Considered + rejected) | 6 490 empirisk baseline; topp-30 ord svenska false-positives (`som`, `appen`, `dokument`) | Tool-uppgift-mismatch (engelsk-only-default mot svensk-dominant repo) | Inte aktiverad; slot-numrering bevarad per ADR-022 kategori-utvidgning-mönster |
| markdownlint-cli2 | 83 (`docs/**/*.md` + `tasks/*.md` + `./*.md`) | 10 570 → 0 | Mix: 9 668 config-disable-domän (MD013/MD060/MD024) + 902 auto-fix + 38 MD036 hybrid + 77 MD040 manuell + 15 Sub-A defer | 3 config-disables + `--fix`-batch + 14 strukturella `### N. ...` + 24 inline-disable + DEFERRED-FIX-MARKER |
| scripted-checklist-check | 6 publika docs (vita listan + CONTRIBUTING-exklusion) | 0 utanför `## Definition of Done`-mallar | 0 pre-existing skuld | Grön baseline från start; K7.5 retroaktivt config-driven (`.checklist-policy.conf`) |
| Vale | docs/ + tasks/ + 5 toppfiler (README/CHANGELOG/SECURITY/CONTRIBUTING/CLAUDE.md-skikt) | 566 → 8 suggestions | Mix: 49 664 Vale.Spelling rejected (svensk false-positives); 539 defer (425 Vale.Terms + 114 VueToReact) | Vale.Spelling AV; 3 Miranon-stilguide-filer (Brand/VueToReact/Undvik); per-fil rad-1-disable Alt F → Session 6.6.6 |
| Frontmatter-validering | 9 styrande docs (config-driven via `.frontmatter-policy.conf`) | 0 fel post-K7.C | 0 pre-existing skuld | Grön baseline från K7.C (commit `866dd7c`); 5 checks (existens + updated + review_by + status + owner) |

Pre-existing-skuld klassas per ADR-022 3-kategori-modell + ADR-029-konvention: empirisk add-only-policy för ev. ignore-listor; defer-fix dokumenteras explicit per fil i `tasks/todo.md`.
