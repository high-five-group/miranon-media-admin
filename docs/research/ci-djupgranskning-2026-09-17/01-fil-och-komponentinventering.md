---
owner: marcus803
updated: 2026-09-17
review_by: 2026-12-17
status: draft
---

# Leverabel 2 av 12 — Fullständig fil- och komponentinventering

> **Proveniens:** skriven av en `research-pass`-agent (modell: se § Rapport till
> orkestreraren) som Jobb D2 i CI-djupgranskningens våg 2, Session 126,
> 2026-09-17. Kört i worktreen `s126-ci-djupgranskning`. Ögonblicksbild:
> `origin/main` `eeca8c72` (2026-09-08) för allt kodinnehåll; GitHub-, Vercel-
> och Supabase/Airtable-fakta är citerade ur våg 1:s underlag, som i sin tur
> mätte live mot GitHub 2026-09-17 (se respektive underlags § Metod). Denna
> fil är en SAMMANSTÄLLNING med fullständighetsbevis, inte ny forskning — se
> § Vad jag läste först.

## Kort svar

Ytan omfattar **367 poster**: **337 enskilda filer** i repot (verifierat
mekaniskt mot `git ls-files`, se § Fullständighetsbeviset), **9 aggregerade
testkatalog-poster** (per uppdragets egen instruktion räknas enskilda
`*.test.ts`-filer per katalog, inte fil för fil) och **21 externa/plugin-
poster** som styr flödet men inte bor som en fil i detta repo (GitHub-
inställningar, Vercel, Supabase, Airtable, det delade marcus-system-pluginets
hookar).

| Kategori | Antal |
|---|---:|
| Arbetsflöden (workflows) | 8 |
| Grindvakts-skript | 27 |
| Testsviter för grindvakter | 75 |
| Mätverktyg | 8 |
| Produktionsdeploy | 7 |
| Seed, purge och schema-verktyg | 10 |
| Hjälpbibliotek | 29 |
| Lokala hookar (repots egna) | 30 |
| Lokala hookar (från det delade pluginet) | 4 |
| Agent-definitioner | 3 |
| Policy-/konfigurationsfiler (regelvärden) | 45 |
| Verktygs- och byggkonfiguration | 24 |
| Testinfrastruktur och testkataloger | 39 |
| Styrande dokument | 38 |
| Externa GitHub-inställningar | 14 |
| Extern: Vercel (hosting) | 1 |
| Extern: Supabase (databas) | 2 |
| Extern: Airtable (datakälla) | 2 |
| Föräldralösa filer | 1 |

**Domen i klartext, en nivå upp från siffrorna:** arkitekturen är stor
(74 182 rader i `scripts/` ensamt) men **inte** en okontrollerad utväxt —
nästan varenda gräns, tröskel och undantag jag hittade bär en skriven
motivering kopplad till ett `TASK`-nummer eller en ADR (samma slutsats som
J1a–J1f oberoende av varandra kom fram till). Det som DÄREMOT väger tungt är
**styrande texts tillförlitlighet över tid**: samma felklass — en siffra
eller ett påstående som var sant när det skrevs och blivit falskt genom
tillväxt eller landning ingen uppdaterade prosan för — träffades av
orkestrerarens egna stickprov FEM separata gånger (S4, S10, S16, S17, S18 i
`underlag/01-orkestrerarens-stickprov.md`). Den här inventeringen har samma
sårbarhet: den är en ögonblicksbild av 2026-09-17, och `review_by`-datumet
ovan är satt medvetet kort.

## Hur inventeringen läses

- **Två filer, en sanning.** `01-inventering.json` är maskinläsbar (en
  array av objekt, ett per fil/komponent) och bär FLER fält än denna
  markdown-fil visar i sina tabeller (bl.a. `triggers`, `indata`, `utdata`,
  `beroenden`, `hemligheter`, `kontroller`, `vid_success`, `vid_failure`,
  `vid_skip`, `paverkar`, `markning`, `luckor`). Tabellerna nedan är
  GENERERADE ur samma JSON av `scripts` i denna gransknings scratch-katalog
  (ej committade — se § Metod), så de två filerna kan inte glida isär: varje
  rad i en markdown-tabell är en direkt transformation av motsvarande
  JSON-post, inte en separat avskrift.
- **Fält som saknar uppgift** står som `null` i JSON:en och `—` i markdown.
  Ett `luckor`-fält (om satt) förklarar VARFÖR — det är aldrig en gissning.
- **`blockerar_merge`** har tre möjliga värden: `ja` (fäller direkt),
  `nej` (kan aldrig blockera en merge, strukturellt), eller
  `indirekt-via-aggregatorn` (jobbet/skriptet i sig fäller, men den
  MEKANISKA bindningen till merge sker via `ci-passed`-aggregatorns
  `needs`-lista, inte via jobbet självt).
- **Källfältet (`kalla`)** pekar på vilket av våg 1:s underlag uppgiften
  kommer ur — filnamn + avsnitt där det finns. Det är alltid en
  UNDERLAGS-fil (`underlag/j1a-…md` etc.), aldrig en länk, per
  agentkontraktets regel om djupa relativa länkar.
- **Markning** (`verifierad` / `starkt indikerad` / `osäker` / `ej
  verifierbar`) ärvs från källunderlagets egen märkning för samma
  uppgift, eller nedgraderas till `osäker`/`ej verifierbar` där jag inte
  kunde återfinna en direkt källa (se § Fullständighetsbeviset för hur få
  sådana fall det rör sig om — endast `supabase/config.toml`).
- **Testfiler är aggregerade per katalog**, inte fil för fil — uppdraget
  bad uttryckligen om detta (`tests/**/*.test.ts` inventeras per katalog med
  antal). De nio raderna under "Testinfrastruktur och testkataloger" vars
  sökväg innehåller `*` är sådana aggregat; de ingår INTE i
  fullständighetsbevisets fil-för-fil-avstämning, av samma skäl som de inte
  är enskilda disk-filer.

## Vad jag läste först

Jag inventerade `docs/research/` (grep på ämnesord: `ci-arkitektur`,
`grindvakt`, `inventering`) — ingen befintlig fil bygger en fullständig,
maskinläsbar fil-för-fil-inventering av hela denna yta. Två pass överlappar
smalt men svarar på en annan fråga:
[`arbetsform-reglernas-bararkarta-2026-08-07.md`](../arbetsform-reglernas-bararkarta-2026-08-07.md)
klassar 132 ARBETSFORMSREGLER (mekanisk/konvention/kort-buren) över 15
källfiler — en klassnings-karta, inte en fil-inventering — och
[`verify-ci-parity-regel-vantetid-2026-08-05.md`](../verify-ci-parity-regel-vantetid-2026-08-05.md)
mäter EN specifik grinds kostnad. Ingen av dem konkurrerar med detta
uppdrag; jag har inte byggt om det de redan svarar på.

Denna fils SAKINNEHÅLL är i sin helhet destillerat ur sex av våg 1:s
underlag — `underlag/j1a` till `underlag/j1f` — plus `07-hermetiska-tester-
kontra-realistisk-e2e.md` (testkatalogernas antal) och `underlag/j8-4-
staging-och-e2e.md` (purge/semafor/preflight-detaljerna). Samtliga sex J1-
filer och 07/j8-4 lästes i sin HELHET, inte i utdrag, innan en enda JSON-post
skrevs. Där `underlag/01-orkestrerarens-stickprov.md` rättat, skärpt eller
avgjort ett underlags påstående (S1–S18) är det ALLTID stickprovets version
som är källan i denna fil — jag har korsat varje sådan post mot vilka JSON-
poster den påverkar (t.ex. S7/S12 mot `nightly.yml`, S18 mot `post-
merge.yml`, S17 mot `stada-grenar.sh`).

**Ingen ny läsning av repo-kod gjordes för att bygga JSON:en** — det är
sammanställningens hela poäng (uppdraget: "sammanställning, inte ny
forskning"). Två genuint NYA handlingar utfördes i detta pass, båda
mekaniska, inte tolkande: (1) `git ls-files` mot uppdragets sökvägslista för
att bygga FACIT (§ Fullständighetsbeviset), och (2) en jämförelse mellan
facit och JSON:ens `sokvag`-fält som avslöjade två poster jag först hade
kategoriserat fel (`.github/CODEOWNERS` och `.github/dependabot.yml` — se
§ Fullständighetsbeviset för den fällan och rättelsen).

## Metod

1. **Definierade ytan** som en sökvägslista (nedan), härledd ur uppdragets
   egen minimilista och kompletterad mot vad `underlag/j1c`s § 5
   ("Fullständig lista, alla 44") och `underlag/j1a`s D0-glob-citat redan
   räknat upp.
2. **Räknade facit mekaniskt:** `git ls-files -- <sökvägarna>` mot samtliga
   mönster nedan gav **307 filer**; plus **30 ADR:er** (identifierade genom
   att extrahera varje ADR-nummer citerat av de sex J1-underlagen som
   "styr denna yta", se lista i § Facit) = **337 filer totalt**.
3. **Byggde JSON:en** som en array av 367 objekt (337 fil-poster + 9
   aggregerade testkatalog-poster + 21 externa/plugin-poster), fält för
   fält enligt uppdragets schema, med varje `syfte`/`anropas_av`/`anropar`
   destillerat ur exakt den mening i källunderlaget som säger det.
4. **Körde fullständighetsbeviset** (§ nedan) tills det gav noll träffar i
   båda riktningarna.
5. **Genererade markdown-tabellerna** ur samma JSON med ett engångsskript
   (i scratch, ej committat), så de två filerna delar en enda sanning.

### Sökvägslistan (ytans definition)

```text
.github/**
scripts/**
.githooks/**
.claude/settings.json
.claude/agents/**
.<namn>-policy.conf | .<namn>-policy.json | .<namn>allowlist.conf   (repo-roten)
playwright.config.ts, vite.config.ts, biome.json, tsconfig*.json, tsr.config.json
audit-ci.jsonc, .lycheeignore, .vale.ini, .vale/**, .markdownlint-cli2.jsonc
.yamllint.yml, .editorconfig, .nvmrc, vercel.json, package.json
tests/global-setup.ts, tests/global-teardown.ts, tests/support/**
tests/fixtures/**, tests/kontraktsvakt/**
supabase/config.toml
CLAUDE.md, CONTRIBUTING.md
docs/reference/staging-verifiering-runbook.md
docs/reference/prod-driftsattning-runbook.md
docs/reference/prod-driftsattning-betalningsflodet-runbook.md
docs/decisions/ADR-{010,028,029,030,033,036,039,050,060,061,063,076,077,080,
  082,083,090,091,094,096,097,099,101,104,105,117,127,129,131,132}-*.md
```

**Två jämförelsepunkter, avstämda:** uppdraget nämnde att J8.8 och
ändringsloggen (leverabel 3) har varsin ytdefinition. Jag har jämfört min
lista mot `underlag/j1c`s § 5 (44 policy-filer, exakt samma räkning) och mot
`underlag/j1a`s citat av D0-globens 17 positiva mönster (samma filklasser).
Ingen motsägelse hittad — skillnaderna är bara att de andra dokumenten
beskriver en SNÄVARE delfråga (t.ex. bara vad som styr D0-klassningen), inte
en annan sanning om samma filer.

## Fynd

### Kategoritabeller — samtliga 367 poster, ingen utelämnad

### Arbetsflöden (workflows) (8)

En instruktionsfil GitHub Actions läser och kör automatiskt, t.ex. vid varje kodinlämning.

| Sökväg | Syfte | Anropas av | Blockerar merge | Källa |
|---|---|---|---|---|
| `.github/workflows/ci-suite.yml` | Återanvändbar (workflow_call) testsvit med åtta jobb: purge, test-fast, acceptance, acceptance-sjalvtest, webblasarbeteende, a11y, test-staging, purge-efter. Anropas av tre workflower med olika bredd. | ci.yml (jobbet suite, run_staging:false, run_a11y:false); post-merge.yml (jobbet suite, i… | indirekt-via-aggregatorn | `underlag/j1a-ci-yml-och-ci-suite.md §6-§7, underlag/j8-4-staging-och-e2e.md` |
| `.github/workflows/ci.yml` | Huvudflödet: presubmit-grinden. Sju jobb (changed, lint, audit, suite, docs, review-backstopp, ci-passed) som tillsammans utgör hela PR- och kö-grinden. | GitHub Actions (pull_request mot main, push mot main, merge_group) | ja | `underlag/j1a-ci-yml-och-ci-suite.md §1-§5, underlag/01-orkestrerarens-stickprov.md S1,S2,S3,S5` |
| `.github/workflows/gate-proof.yml` | Bevis-workflow: bevisar med en riktig körning att ci-passed (aggregatorn) fäller fail-closed så fort ett jobb blir rött — körs aldrig automatiskt. | workflow_dispatch (manuell, med boolean simulate_skip) | nej | `underlag/j1b-ovriga-workflows-och-github-katalogen.md §gate-proof.yml` |
| `.github/workflows/nightly-watchdog.yml` | Vakt FÖR nattnätet: kontrollerar klockan 12:00 att natten faktiskt startade och (om den blev röd) att dess eget alarm-jobb verkligen fyrade. Skyddar mot att hela schemaläggningen tyst uteblir. | GitHub Actions (schedule `0 12 * * *`); workflow_dispatch med simulate_missing | nej | `underlag/j1b-ovriga-workflows-och-github-katalogen.md §nightly-watchdog.yml` |
| `.github/workflows/nightly.yml` | Nattnätet: kör en gång per dygn (03:00 Europe/Stockholm) den fulla sviten plus åtta ytterligare kontroller som bara hör hemma i natten (bredare audit, extern länkkontroll, kontraktsvakt, processgrindar). | GitHub Actions (schedule `0 3 * * *`); workflow_dispatch med simulate_failure | nej | `underlag/j1b-ovriga-workflows-och-github-katalogen.md §nightly.yml, underlag/01-orkestrerarens-stickprov.md S7,S12,S15` |
| `.github/workflows/post-merge.yml` | Lager 2: kör den fulla sviten (inkl. staging+a11y som PR-ytan hoppar över) på VARJE landad commit på main, EFTER merge. Larmar vid rött med revert-förslag. | GitHub Actions (push mot main); workflow_dispatch med simulate_failure (manuellt självtes… | nej | `underlag/j1b-ovriga-workflows-och-github-katalogen.md §post-merge.yml, underlag/j8-4-staging-och-e2e.md, underlag/01-orkestrerarens-stickprov.md S18` |
| `.github/workflows/review-backstopp-proof.yml` | Bevis-workflow: bevisar båda riktningarna av review-backstoppen (fäller utan giltig granskningssektion, släpper med en giltig) mot en RIKTIG historisk PR:s text. | workflow_dispatch (manuell, med boolean simulera_gront) | nej | `underlag/j1b-ovriga-workflows-och-github-katalogen.md §review-backstopp-proof.yml` |
| `.github/workflows/visual-baselines.yml` | Referensbild-fabrik: enda platsen nya visuella baseline-bilder föds, i samma Linux-miljö som jämförelsen sker. Öppnar en granskningsbar PR med nya skärmdumpar. | workflow_dispatch (manuell, med valfri specfilter-regex) | nej | `underlag/j1b-ovriga-workflows-och-github-katalogen.md §visual-baselines.yml` |

### Grindvakts-skript (27)

Ett skript som CI kör som en godkänn/blockera-kontroll — en "grind" koden måste passera.

| Sökväg | Syfte | Anropas av | Blockerar merge | Källa |
|---|---|---|---|---|
| `scripts/acceptance-urval.sh` | Avgör om HELA diffen tillåter ett smalt acceptance-urval (TASK-75). Klassningsgate, inte pass/fail | ci.yml changed-jobbet | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/audit-ci-med-degradering.sh` | npx audit-ci med steg-loop + smal nätverksdegradering (TASK-395), eget jobb sedan TASK-395 | ci.yml audit-jobbet | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/check-adr-count.sh` | ADR-filantal == READMEs räkning (ADR-039) | ci.yml lint-jobbet | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/check-backlog-closure.sh` | Done-status men obockad AC/DoD (ADR-073/117/127). 1126 rader, störst i klassen | nightly.yml jobbet backlog-closure | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/check-facit.sh` | Låst facits adresserbarhet + rivningsspärr (ADR-102) | ci.yml lint-jobbet | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/check-fetch-depth-invariant.sh` | fetch-depth-värdet enhetligt över 5 bärare (ADR-039) | ci.yml lint-jobbet | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/check-frontmatter.sh` | YAML-frontmatter på 10 styrande docs (ADR-030), shallow-clone-detection (ADR-033 K4) | ci.yml lint-jobbet | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/check-langa-streck.mjs` | Fäller NYA em/en-dash i src/-strängar (TASK-172) | ci.yml lint-jobbet | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/check-lesson-numbers.sh` | Lesson-nummer tilldelas vid landning, inte skrivning | ci.yml lint-jobbet | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/check-lifecycle.sh` | lifecycle:-fält på sessionsdok/trådkort (ADR-052) | ci.yml lint-jobbet | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/check-listparitet.sh` | Två listor som ska matcha har inte glidit isär (TASK-85); vaktar bl.a. check-docs.sh<->ci.yml | ci.yml lint-jobbet | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/check-mailto.mjs` | Fäller mailto:-länkar i utskicksflöden (TASK-147.8) | ci.yml lint-jobbet | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/check-mallparitet.sh` | Genererade TS-mallmoduler byte-identiska mot källan (TASK-309.4), 17 rader — tunn wrapper | ci.yml lint-jobbet | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/check-manifest-fields.mjs` | App-manifestets fält (TASK-126.1/126.4). Enda check-* i test-fast, inte lint | ci-suite.yml test-fast-jobbet (npm run verify:manifest) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/check-nattvakt-dedup.sh` | Ny avvikelse redan täckt av ett existerande ärende? | nightly-watchdog.yml | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/check-obesvarade-larm.sh` | Larm-ärenden som skapats faktiskt besvarade | nightly.yml | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/check-pausade-sessioner.sh` | Ett sessionsdok som PÅSTÅR paus är faktiskt pausat | nightly.yml | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/check-permissions-claims.sh` | Prosa får inte påstå en permissions.*-mekanism som inte finns (ADR-083) | ci.yml lint-jobbet | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/check-public-checklists.sh` | Oavslutade "- [ ]" i publika docs (ADR-030) | ci.yml lint-jobbet | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/check-sessionsdok-fonster.sh` | Rullande fönster för tasks/sessions/-roten (ADR-099) | nightly.yml | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/check-staging-preflight-wiring.mjs` | Deletion-vakt: hakar preflighten fortfarande i? (TASK-91) | ci.yml lint-jobbet | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/check-thread-index.sh` | Tråd-registrets index (radform/enum/numrering) | ci.yml lint-jobbet | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/classify-post-merge.sh` | Ärver should_skip_tests för post-merge-lagret (TASK-73). Klassningsgate | post-merge.yml jobbet klassning | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/hermetik-sjalvtest.mjs` | Acceptance-klassens tvåsidiga hermetik-bevis (ADR-080). Eget jobb sedan TASK-239. Är själv beviset — ingen egen testsvit | ci-suite.yml jobbet acceptance-sjalvtest (npm run test:acceptance:sjalvtest) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/post-merge-attribution.sh` | Är denna landning primär misstänkt eller del av ett spann? (TASK-334) | post-merge.yml jobbet larm | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/review-backstopp.mjs` | Fäller en merge_group-landning utan giltigt granskningsutlåtande (TASK-173.4, ADR-105). Enda grinden som prövar en LEVANDE GitHub-resurs | ci.yml jobbet review-backstopp | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/visual-baselines-scope.sh` | Vilken delmängd av visual-sviten en baseline-körning ska ta (TASK-298). Klassningsgate | visual-baselines.yml | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |

### Testsviter för grindvakter (75)

Tester som bevisar att en grindvakts EGEN logik fungerar, inte att appen fungerar.

| Sökväg | Syfte | Anropas av | Blockerar merge | Källa |
|---|---|---|---|---|
| `scripts/test-acceptance-urval.sh` | Testsvit för scripts/acceptance-urval.sh — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-agent-spawn-log.sh` | Testsvit — skyddar scripts/agent-spawn-log.shs logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-arkivera-sessionsdok.sh` | Testsvit — skyddar scripts/arkivera-sessionsdok.shs logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-audit-degradering.sh` | Testsvit för scripts/audit-ci-med-degradering.sh — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-backfill-bilagor-dokumentklass.mjs` | Testsvit — skyddar scripts/backfill-bilagor-dokumentklass.mjss logik mot regression. | orkestreraren/utvecklaren manuellt | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-backfill-inbetalningar.mjs` | Testsvit — skyddar scripts/backfill-inbetalningar.mjss logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-backlog-cli.sh` | Testsvit — skyddar scripts/backlog-cli.shs logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-check-adr-count.sh` | Testsvit för scripts/check-adr-count.sh — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-check-backlog-closure.sh` | Testsvit för scripts/check-backlog-closure.sh — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-check-claims-tackning.sh` | Testsvit — skyddar scripts/check-claims-tackning.shs logik mot regression. | orkestreraren/utvecklaren manuellt | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-check-facit.sh` | Testsvit för scripts/check-facit.sh — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-check-fetch-depth-invariant.sh` | Testsvit för scripts/check-fetch-depth-invariant.sh — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-check-frontmatter.sh` | Testsvit för scripts/check-frontmatter.sh — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-check-langa-streck.mjs` | Testsvit för scripts/check-langa-streck.mjs — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-check-lesson-numbers.sh` | Testsvit för scripts/check-lesson-numbers.sh — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-check-lifecycle.sh` | Testsvit för scripts/check-lifecycle.sh — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-check-listparitet.sh` | Testsvit för scripts/check-listparitet.sh — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-check-mailto.mjs` | Testsvit för scripts/check-mailto.mjs — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-check-mallparitet.sh` | Testsvit för scripts/check-mallparitet.sh — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-check-manifest-fields.mjs` | Testsvit för scripts/check-manifest-fields.mjs — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-check-merge-tree.sh` | Testsvit — skyddar scripts/check-merge-tree.shs logik mot regression. | orkestreraren/utvecklaren manuellt | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-check-nattvakt-dedup.sh` | Testsvit för scripts/check-nattvakt-dedup.sh — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-check-obesvarade-larm.sh` | Testsvit för scripts/check-obesvarade-larm.sh — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-check-pausade-sessioner.sh` | Testsvit för scripts/check-pausade-sessioner.sh — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-check-permissions-claims.sh` | Testsvit för scripts/check-permissions-claims.sh — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-check-public-checklists.sh` | Testsvit för scripts/check-public-checklists.sh — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-check-sessionsdok-fonster.sh` | Testsvit för scripts/check-sessionsdok-fonster.sh — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-check-staging-preflight-wiring.mjs` | Testsvit för scripts/check-staging-preflight-wiring.mjs — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-check-thread-index.sh` | Testsvit för scripts/check-thread-index.sh — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-ci-metrics.mjs` | Testsvit — skyddar scripts/ci-metrics.mjss logik mot regression. | ci.yml (nightly.yml nightly-metrics-jobbet) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-ci-wait.sh` | Testsvit — skyddar scripts/ci-wait.shs logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-classify-post-merge.sh` | Testsvit för scripts/classify-post-merge.sh — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-create-betalningsfalt.mjs` | Testsvit — skyddar scripts/create-betalningsfalt.mjss logik mot regression. | orkestreraren/utvecklaren manuellt | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-create-bilagor-table.mjs` | Testsvit — skyddar scripts/create-bilagor-table.mjss logik mot regression. | orkestreraren/utvecklaren manuellt | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-create-eventinnehall-modell.mjs` | Testsvit — skyddar scripts/create-eventinnehall-modell.mjss logik mot regression. | orkestreraren/utvecklaren manuellt | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-create-kvitton-table.mjs` | Testsvit — skyddar scripts/create-kvitton-table.mjss logik mot regression. | orkestreraren/utvecklaren manuellt | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-deny-arbetsform-push.sh` | Testsvit — skyddar scripts/deny-arbetsform-push.shs logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-deny-facit-godkand-skrivning.sh` | Testsvit — skyddar scripts/deny-facit-godkand-skrivning.shs logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-deny-frammande-huvudkatalog.sh` | Testsvit — skyddar scripts/deny-frammande-huvudkatalog.shs logik mot regression. | ci.yml (gatekeeper-steg (55 fall)) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-deny-grind-genom-pipe.sh` | Testsvit — skyddar scripts/deny-grind-genom-pipe.shs logik mot regression. | ci.yml (gatekeeper-steg (25 fall)) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-deny-hemlighet-utskrift.sh` | Testsvit — skyddar scripts/deny-hemlighet-utskrift.shs logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-deny-precompact.sh` | Testsvit — skyddar scripts/deny-precompact.shs logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-deny-prod-airtable.sh` | Testsvit — skyddar scripts/deny-prod-`airtable`.shs logik mot regression. | ci.yml (gatekeeper-steg (20 fall)) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-deny-prod-ref.sh` | Testsvit — skyddar scripts/deny-prod-ref.shs logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-deny-resend-send.sh` | Testsvit — skyddar scripts/deny-resend-send.shs logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-deny-subagent-vantan.sh` | Testsvit — skyddar scripts/deny-subagent-vantan.shs logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-deploy-prod-functions.sh` | Testsvit — skyddar scripts/deploy-prod-functions.shs logik mot regression. | ci.yml (eget steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-docraptor-sjalvbarande.mjs` | Testsvit — skyddar scripts/docraptor-sjalvbarande.mjss logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-facit-godkann.mjs` | Testsvit — skyddar scripts/facit-godkann.mjss logik mot regression. | ci.yml (eget steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-fas4-prod-deploy.sh` | Testsvit — skyddar scripts/fas4-prod-deploy.shs logik mot regression. | ci.yml (gatekeeper-steg (bara pre-nätverk-delen)) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-flake-matserie.mjs` | Testsvit — skyddar scripts/flake-matserie.mjss logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-gh-guard.sh` | Testsvit — skyddar scripts/lib/gh-guard.shs logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-heartbeat-svep.sh` | Testsvit — skyddar scripts/heartbeat-svep.shs logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-jq-guard.sh` | Testsvit — skyddar scripts/lib/jq-guard.shs logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-post-compact-igenkanning.sh` | Testsvit — skyddar scripts/post-compact-igenkanning.shs logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-post-merge-attribution.sh` | Testsvit för scripts/post-merge-attribution.sh — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-pre-commit-hook.sh` | Testsvit — skyddar .githooks/pre-commits logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-purge-staging-sentinels.mjs` | Testsvit — skyddar scripts/purge-staging-sentinels.mjss logik mot regression. | ci.yml (eget steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-review-backstopp.mjs` | Testsvit för scripts/review-backstopp.mjs — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-review-loop.mjs` | Testsvit — skyddar scripts/review-loop-beslut.mjs + scripts/lib/review-loop.mjss logik mot regression. | ci.yml (gatekeeper-steg (103 fall)) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-review-metrics.mjs` | Testsvit — skyddar scripts/review-metrics.mjs + scripts/lib/review-metrics.mjss logik mot regression. | ci.yml (gatekeeper-steg (49 fall)) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-review-policy.mjs` | Testsvit — skyddar scripts/hamta-review-policy.mjs + scripts/lib/review-policy.mjss logik mot regression. | ci.yml (gatekeeper-steg (46 fall)) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-review-risk-sektion.mjs` | Testsvit — skyddar scripts/lib/review-risk-sektion.mjs + scripts/uppdatera-review-sektion.mjss logik mot regression. | ci.yml (gatekeeper-steg (47 fall)) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-seed-review-fixture.mjs` | Testsvit — skyddar scripts/seed-review-fixture.mjss logik mot regression. | ci.yml (eget steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-stada-grenar.sh` | Testsvit — skyddar scripts/stada-grenar.shs logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-staging-semaphore.sh` | Testsvit — skyddar scripts/staging-semaphore.shs logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-stop-vakt.sh` | Testsvit — skyddar scripts/stop-vakt.shs logik mot regression. | ci.yml (gatekeeper-steg (16 fall)) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-supabase-cli-policy.sh` | Testsvit — skyddar scripts/lib/`supabase`-cli.shs logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-synka-labels.mjs` | Testsvit — skyddar scripts/synka-labels.mjs + scripts/lib/synka-labels.mjss logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-task-338-6-prod-migration.mjs` | Testsvit — skyddar scripts/task-338-6-prod-migration.mjss logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-uppdragsrevision.mjs` | Testsvit — skyddar scripts/uppdragsrevision.mjss logik mot regression. | ci.yml (nightly.yml) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-vale-regression.sh` | Testsvit — skyddar Vale-installationens L_X.2-regressionssvits logik mot regression. | ci.yml (EGET steg i docs-jobbet OCH check-docs.sh — dubbel roll) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-validera-review-utlatande.mjs` | Testsvit — skyddar scripts/validera-review-utlatande.mjs + scripts/lib/review-utlatande.mjss logik mot regression. | ci.yml (gatekeeper-steg (35 fall)) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-verify-ci-parity.mjs` | Testsvit — skyddar scripts/verify-ci-parity.mjss logik mot regression. | ci.yml (gatekeeper-steg) | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/test-visual-baselines-scope.sh` | Testsvit för scripts/visual-baselines-scope.sh — skyddar grindens EGEN logik mot regression. | ci.yml lint-jobbets "Test gatekeeper script suites"-steg (eller eget dedikerat steg, se J… | ja | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |

### Mätverktyg (8)

Verktyg som räknar och rapporterar (t.ex. hastighet, flakighet) utan att själva döma godkänt/underkänt.

| Sökväg | Syfte | Anropas av | Blockerar merge | Källa |
|---|---|---|---|---|
| `scripts/agent-spawn-metrics.mjs` | Läser agent-spawn-log.shs JSONL, mäter om typade agenter används | npm run metrics:agents | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/ci-metrics.mjs` | CI-hastighet som DORA-tal (ledtid, kötid, flakighet) | npm run metrics:ci, nightly.yml nightly-metrics | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/flake-matserie.mjs` | Interfolierad A/B-mätrigg för flakighet (TASK-81) | npm run metrics:flake | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/mat-ikon-centrering.mjs` | Mäter PWA-ikoners centrering i faktiska utfiler (TASK-282) | manuellt vid ikon-ändring | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/review-metrics-kalibrering.mjs` | Bokför en Marcus-fångst som grind-miss (ADR-105) | npm run review:kalibrering | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/review-metrics.mjs` | Summerar review-grindens instrumenteringslogg (ADR-105 TASK-173.6) | npm run review:metrics | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/uppdragsrevision.mjs` | Extraherar mönster ur ett transkript (uppdragsrevision) | npm run revision:uppdrag | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/verifiera-farg-atlas.mjs` | Oberoende andra-implementation som verifierar färgatlasen | npm run atlas (sista steget) | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |

### Produktionsdeploy (7)

Skript som skickar kod, databasscheman eller filer till en skarp (produktions-) miljö. Körs alltid manuellt av Marcus, aldrig av CI.

| Sökväg | Syfte | Anropas av | Blockerar merge | Källa |
|---|---|---|---|---|
| `scripts/deploy-prod-functions.sh` | Fail-closed EF-deploy mot en allowlist | Marcus manuellt | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/fas4-prod-deploy.sh` | Hela Fas 4-deploysekvensen som EN körning (--kontrollera via !, --deploya i EGET terminalfönster) | Marcus manuellt | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/kontrollera-bilagor-bucket.sh` | Read-only konvergenskontroll av Storage-bucketen | fas4-prod-deploy.sh | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/kontrollera-hemlighets-namn.sh` | Verifierar att kända hemlighetsNAMN finns i ett projekt | fas4-prod-deploy.sh --kontrollera | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/provision-attachments-bucket.mjs` | Engångsprovisionering av bilagornas Storage-bucket | manuellt (TASK-146.3) | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/task-338-6-prod-migration.mjs` | Förberedelse-skript, KÖRT AV MARCUS mot prod | Marcus manuellt | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/task-346-3-staging-verifiering.sql` | Manuell SQL-verifiering mot staging-databasen, dokumenterad i `supabase`/migrations/README.md | npx `supabase` db query --linked -f … (manuellt) | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |

### Seed, purge och schema-verktyg (10)

Skript som skapar testdata i en delad testmiljö (staging) eller städar bort den efteråt.

| Sökväg | Syfte | Anropas av | Blockerar merge | Källa |
|---|---|---|---|---|
| `scripts/backfill-bilagor-dokumentklass.mjs` | Backfyller ett additivt fält på gamla rader | npm run backfill:bilagor-dokumentklass | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/backfill-inbetalningar.mjs` | Historiska inbetalningar ur basens befintliga sanning (1911 rader, störst i katalogen) | npm run backfill:inbetalningar | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/create-betalningsfalt.mjs` | Additiva prisfält i Airtable-basen, idempotent | npm run schema:betalningsfalt | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/create-bilagor-table.mjs` | Skapar "Bilagor"-tabellen additivt | npm run schema:bilagor | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/create-eventinnehall-modell.mjs` | Skapar tre nya tabeller för bilage-modellen | npm run schema:eventinnehall | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/create-kvitton-table.mjs` | Skapar kvittoseriens ledger-tabell | npm run schema:kvitton | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/purge-staging-sentinels.mjs` | Städar sentinel-rader i staging (ADR-060), 1142 rader | npm run purge:staging, ci-suite.yml purge/purge-efter (gated run_staging) | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/seed-dokument-fixture.mjs` | Permanenta demo-bilagor i staging | npm run seed:dokument[:clean] | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/seed-eventinnehall-modell.mjs` | Standardrader för bilage-datamodellen i staging | npm run seed:eventinnehall | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/seed-review-fixture.mjs` | Granskningsfixturer (event + anmälningar) för Marcus manuella review | npm run seed:review[:clean] | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |

### Hjälpbibliotek (29)

Delad kod som flera andra skript återanvänder. Körs aldrig av sig själv.

| Sökväg | Syfte | Anropas av | Blockerar merge | Källa |
|---|---|---|---|---|
| `scripts/atkomst-diagnos.sh` | Mekaniserad självdiagnos för åtkomst/nycklar | npm run atkomst:diagnos | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/backlog-kortfakta.mjs` | Bulk-svep av kortfakta (ADR-117) | check-backlog-closure.sh | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/build-farg-atlas.mjs` | Bygger färgatlasen ur CSS-tokens | npm run atlas | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/check-staging-bundle.sh` | Verifierar att dist/ är ett STAGING-bygge | npm run verify:staging-bundle | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/docraptor-sjalvbarande.mjs` | Gör en renderad mall självbärande inför DocRaptor | mall-pdf.mjs (import) | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/facit-godkann.mjs` | Stämplar Marcus godkännande i ett facit-manifest | npm run facit:godkann (Marcus, via !-prefix) | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/generate-favicons.mjs` | Genererar favicon-setet ur SVG-källan | manuellt | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/generera-review-schema.mjs` | Genererar portabel JSON-Schema ur zod-schemat | npm run review:schema | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/lib/facit-godkand-skrivning.mjs` | Avgör om en Edit/Write skulle sätta "godkand" i ett facit-manifest | deny-facit-godkand-skrivning.sh (hook) + dess testsvit | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/lib/facit-validera.mjs` | Strukturvalidering av ETT facit-manifest | check-facit.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/lib/farg.mjs` | Oberoende färgmatematik (sRGB<->linjär, WCAG-luminans, OKLab) | build-farg-atlas.mjs, verifiera-farg-atlas.mjs | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/lib/gh-guard.sh` | Delad presence+minimiversion-guard för gh | ~10 skript i grind-/landningsvägen | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/lib/jq-guard.sh` | Delad presence+minimiversion-guard för jq | ~25 anropsställen (hela hook-/grindlagret) | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/lib/review-backstopp.mjs` | CI-backstoppens rena verdikt-logik | scripts/review-backstopp.mjs (CLI-lagret) | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/lib/review-loop.mjs` | Rundtaks-loopens deterministiska nästa-steg-logik | scripts/review-loop-beslut.mjs | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/lib/review-metrics.mjs` | Instrumenteringens schema + summering | scripts/review-metrics.mjs, review-metrics-kalibrering.mjs, review-loop-beslut.mjs | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/lib/review-policy.mjs` | Path-scopade granskningsreglers parsning/matchning | scripts/hamta-review-policy.mjs | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/lib/review-risk-sektion.mjs` | Renderar utlåtandet till PR-kroppens Riskbedömnings-sektion | scripts/uppdatera-review-sektion.mjs | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/lib/review-utlatande.mjs` | zod-schemat för review-agentens JSON-utlåtande | hela review-familjen + scripts/generera-review-schema.mjs | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/lib/skala.mjs` | Design-token-skalning | scripts/build-farg-atlas.mjs | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/lib/staging-preflight.mjs` | Staging-preflight för Node-script utanför Playwrights setup | scripts/purge-staging-sentinels.mjs, seed-review-fixture.mjs m.fl. | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/lib/supabase-cli.sh` | Delad resolver för PINNAD Supabase CLI-version | scripts/deploy-prod-functions.sh, fas4-prod-deploy.sh, kontrollera-bilagor-bucket.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/lib/synka-labels.mjs` | Rena funktioner för GitHub-label-synk | scripts/synka-labels.mjs (CLI-lagret) | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/mall-pdf.mjs` | Lokal PDF-loop för bilage-mallar | npm run mall:pdf | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/pwa-icon-version.ts` | Delad versionsstämpel (innehålls-hash) för PWA-ikonfilnamn — kringgår att Chrome 144+ cachar ikoner permanent baserat på URL | import i `vite`.config.ts / pwa-assets.config.ts | indirekt-via-aggregatorn | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `scripts/render-bilage-mall.mjs` | Granskningsrendering av en bilage-mall (Eta-mallmotor) | npm run mall:granska | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/synka-bilagemallar.mjs` | Genererar TS-strängmoduler ur mallkällan (sync/check-läge) | check-mallparitet.sh (--check), manuellt (sync-läge) | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/synka-labels.mjs` | Skapar/uppdaterar GitHub-labels ur policyn | npm run labels:synka | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/validera-review-utlatande.mjs` | CLI-validator för ett utlåtande mot schemat | npm run review:validera | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |

### Lokala hookar (repots egna) (30)

Ett litet skript som körs AUTOMATISKT av Claude Code eller Git vid ett visst ögonblick — t.ex. precis innan en ändring sparas.

| Sökväg | Syfte | Anropas av | Blockerar merge | Källa |
|---|---|---|---|---|
| `.githooks/pre-commit` | Enda RIKTIGA git-hooken (körs vid varje git commit, oavsett Claude Code). Tre delar: T121-vakt (rättar absolut core.hooksPath, fäller aldrig), frontmatter-bump (styrande docs updated:-fält), staging-preflight-wiring-vak… | git commit (från VILKEN terminal/agent som helst, ej Claude-Code-specifik) | nej | `underlag/j1d-lokala-hookar-och-agentmekanismer.md §2` |
| `scripts/agent-spawn-log.sh` | Skriver en JSONL-rad per subagent-spawn (loggar endast, nekar aldrig) | .claude/settings.json PreToolUse på Agent | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/arbetsform-tillstand.sh` | Sätt/rensa/läs arbetsform-tillståndsfilen | deny-arbetsform-push.sh, skills | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/arkivera-sessionsdok.sh` | Rullande fönster för tasks/sessions/-roten (ADR-099) | orkestreraren manuellt, check-sessionsdok-fonster.sh (torrkörning) | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/backlog-cli.sh` | Backlog-CLI utan gren-skanningens kostnad (ADR-117) | npm run bl | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/check-claims-tackning.sh` | Täcknings-pass FÖRE en parallell-batch-avfyrning | orkestreraren manuellt (ADR-073) | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/check-docs.sh` | Lokal spegel av 14 dokumentationsgrindar — CI kör den ALDRIG | npm run check:docs | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/check-merge-tree.sh` | Merge-tree-grinden EFTER en batch-push, FÖRE gh pr create | orkestreraren manuellt (ADR-073) | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/ci-wait.sh` | Blockerande, avgränsad väntan på en GH Actions-körning | orkestreraren manuellt | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/deny-arbetsform-push.sh` | Spärr vid handlingen (ADR-097) — nekar git push under push-förbjudande arbetsform | .claude/settings.json PreToolUse | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/deny-facit-godkand-skrivning.sh` | Kanalseparation för facit-godkännande (ADR-104) | .claude/settings.json PreToolUse | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/deny-frammande-huvudkatalog.sh` | Ägarskaps-regeln som mekanism (ADR-090), 1200 rader — störst hook i scripts/ | .claude/settings.json PreToolUse | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/deny-grind-genom-pipe.sh` | L440 som mekanism: grind-exitkod tyst förlorad i pipe | .claude/settings.json PreToolUse | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/deny-hemlighet-utskrift.sh` | Lås mot kommandon som skriver ut hemligheters VÄRDE | .claude/settings.json PreToolUse | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/deny-precompact.sh` | PreCompact-grinden (ADR-101) | .claude/settings.json PreToolUse (PreCompact) | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/deny-prod-airtable.sh` | Lås mot agent-kommandon mot Airtable-prod (TASK-419) | .claude/settings.json PreToolUse (mcp__airtable__*, mcp__claude_ai_Airtable__*) | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/deny-prod-ref.sh` | Lås mot kommandon riktade mot prod-Supabase | .claude/settings.json PreToolUse | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/deny-resend-send.sh` | MAIL-LÅSET lager 2 (Bash + MCP-mönster) | .claude/settings.json PreToolUse | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/deny-subagent-vantan.sh` | Spärr mot subagent som väntar in bakgrundssignaler (ADR-096) | .claude/settings.json PreToolUse (Monitor\|Bash) | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/hamta-review-policy.mjs` | Hämtar path-scopade granskningsregler för en PR | npm run review:policy, orkestreraren vid review-agent-spawn | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/heartbeat-svep.sh` | Trevägs-svep för landningsläget (TASK-119) | bakgrunds-heartbeat, orkestreraren | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/katalogagarskap-markor.sh` | Rapporterar en främmande ägarlapp vid SessionStart. Ingen egen testsvit | .claude/settings.json SessionStart | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/katalogagarskap-slapp.sh` | Släpper ägarlappen vid SessionEnd. Ingen egen testsvit | .claude/settings.json SessionEnd | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/post-compact-igenkanning.sh` | SessionStart-igenkänning av compact-källan (ADR-101) | .claude/settings.json SessionStart | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/review-loop-beslut.mjs` | CLI: utlåtande -> loopens nästa-steg-beslut (ADR-105) | npm run review:loop, orkestreraren | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/stada-grenar.sh` | Säker städning av lokala grenar mergade i main | manuellt (TASK-152, TASK-310), heartbeat-svep.sh:s femte väg | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/staging-semaphore.sh` | mkdir-atomiskt fillås för parallella pipelines | Playwright setup-projekt + .claude/settings.json-hook | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/stop-vakt.sh` | Stop/SubagentStop-avstämning mot observerat tillstånd (ADR-087) | .claude/settings.json Stop/SubagentStop | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/uppdatera-review-sektion.mjs` | Skriver Riskbedömnings-sektionen i PR-kroppen (ADR-105) | npm run review:sektion, orkestreraren | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `scripts/verify-ci-parity.mjs` | Lokal spegel (diagnosverktyg, ADR-036) — härlett ur ci.yml/ci-suite.yml, aldrig ett CI-jobb | npm run verify:ci-parity[:fast] | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |

### Lokala hookar (från det delade pluginet) (4)

Samma sak som ovan, men levererad av ett externt "plugin" (tilläggspaket) som delas mellan flera projekt, inte en fil i detta repo.

| Sökväg | Syfte | Anropas av | Blockerar merge | Källa |
|---|---|---|---|---|
| `~/.claude/plugins/cache/marcus-hub/marcus-system/<version>/hooks/deny-askuserquestion.sh` | PreToolUse (AskUserQuestion)-hook från marcus-system-pluginet (hub-repo, INTE en del av miranon-media-admin). Nekar VARJE anrop av AskUserQuestion, ovillkorligt. | Claude Code-harnesset, laddat via user-scope install-record (ADR-035 i hubben) | nej | `underlag/j1d-lokala-hookar-och-agentmekanismer.md §1c` |
| `~/.claude/plugins/cache/marcus-hub/marcus-system/<version>/hooks/deny-sweeping-git-add.sh` | PreToolUse (Bash)-hook från marcus-system-pluginet (hub-repo, INTE en del av miranon-media-admin). Nekar git add -A/./--all (även path-scopat). Ovillkorlig deny. | Claude Code-harnesset, laddat via user-scope install-record (ADR-035 i hubben) | nej | `underlag/j1d-lokala-hookar-och-agentmekanismer.md §1c` |
| `~/.claude/plugins/cache/marcus-hub/marcus-system/<version>/hooks/log-instructions-loaded.sh` | InstructionsLoaded-hook från marcus-system-pluginet (hub-repo, INTE en del av miranon-media-admin). Loggar varje instruktionsfil som faktiskt laddas i sessionen. Ren observation. | Claude Code-harnesset, laddat via user-scope install-record (ADR-035 i hubben) | nej | `underlag/j1d-lokala-hookar-och-agentmekanismer.md §1c` |
| `~/.claude/plugins/cache/marcus-hub/marcus-system/<version>/hooks/session-facts.sh` | SessionStart-hook från marcus-system-pluginet (hub-repo, INTE en del av miranon-media-admin). Injicerar dagens datum + gren + repo-namn som additionalContext. | Claude Code-harnesset, laddat via user-scope install-record (ADR-035 i hubben) | nej | `underlag/j1d-lokala-hookar-och-agentmekanismer.md §1c` |

### Agent-definitioner (3)

En instruktionsfil som beskriver en typ av AI-medhjälpare (t.ex. "bygg-agent") — vad den får och inte får göra.

| Sökväg | Syfte | Anropas av | Blockerar merge | Källa |
|---|---|---|---|---|
| `.claude/agents/bygg-agent.md` | Bygger en backlog-skiva eller ett fynd-kort till pushad PR med gröna grindar. disallowedTools tar bort Airtable-connectorn, Gmail, Calendar, Drive, GitHub-MCP, Resend, Vercel, Nanobanana, Figma. (sonnet, xhigh; isolatio… | Agent-verktyget (orkestreraren spawnar) | nej | `underlag/j1d-lokala-hookar-och-agentmekanismer.md §3` |
| `.claude/agents/research-pass.md` | Kör ett avgränsat research-pass mot primärkällor, landar fynd som markdown i docs/research/. Kör oisolerat i huvudkatalogen, committar aldrig. ((denna agents egen definition)) | Agent-verktyget (orkestreraren spawnar) | nej | `underlag/j1d-lokala-hookar-och-agentmekanismer.md §3` |
| `.claude/agents/review-agent.md` | Granskar en pushad PR adversarialt i FÄRSK kontext, returnerar schema-giltigt JSON-utlåtande (ADR-105). Spawnas av orkestreraren efter push, före armering. Avviker från sina syskon genom att sakna isolation:worktree — o… | Agent-verktyget (orkestreraren spawnar) | nej | `underlag/j1d-lokala-hookar-och-agentmekanismer.md §3` |

### Policy-/konfigurationsfiler (regelvärden) (45)

En fil med VÄRDEN (listor, gränser, namn) som ett skript läser. Skriptets LOGIK är generell; värdena bor här.

| Sökväg | Syfte | Anropas av | Blockerar merge | Källa |
|---|---|---|---|---|
| `.arbetsform-push-policy.conf` | Arbetsforms-tillståndets sökväg och nycklar (ADR-097) | scripts/arbetsform-tillstand.sh; scripts/deny-arbetsform-push.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.arkivera-sessionsdok-policy.conf` | Rullande fönstrets storlek (ADR-099) | scripts/arkivera-sessionsdok.sh; scripts/check-sessionsdok-fonster.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.atkomst-diagnos-policy.conf` | Vilka åtkomster som diagnostiseras | scripts/atkomst-diagnos.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.backfill-inbetalningar-policy.json` | Backfill-körningens fältmappning | scripts/backfill-inbetalningar.mjs | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.backlog-closure-policy.conf` | Grindens mönster, etiketter, tröskelvärden (ADR-117/127) | scripts/check-backlog-closure.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.checklist-policy.conf` | Vita listan av publika docs + undantagssektioner | scripts/check-public-checklists.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.ci-parity-policy.json` | Jobbmängd, härledda jobb, D0-glob-plats, suite-invarianter | scripts/verify-ci-parity.mjs | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.ci-wait-policy.conf` | Pollnings-intervall/tak för väntan | scripts/ci-wait.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.claims-tackning-policy.conf` | Täcknings-passets register | scripts/check-claims-tackning.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.claude/settings.json` | Registrerar 11 egna PreToolUse-hookar + 1 PreCompact + 1 Stop/SubagentStop + 2 SessionStart + 1 SessionEnd, samt permissions.allow/deny för Claude Code-sessionen i detta repo. | Claude Code-harnesset (läses vid sessionsstart) | nej | `underlag/j1d-lokala-hookar-och-agentmekanismer.md §1, §5` |
| `.facit-policy.conf` | Facit-manifestens sökvägar (ADR-102) | scripts/check-facit.sh; scripts/facit-godkann.mjs; scripts/deny-facit-godkand-skrivning.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.frontmatter-policy.conf` | Styrande docs-lista, fetch-depth-tröskel (ADR-030/039) | scripts/check-frontmatter.sh; scripts/check-fetch-depth-invariant.sh; .githooks/pre-commit | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.gh-version-policy.conf` | Pinnad minimiversion för gh | scripts/lib/gh-guard.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.grind-exitkod-policy.conf` | Vilka kommandon räknas som "grind" | scripts/deny-grind-genom-pipe.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.heartbeat-svep-policy.conf` | Sveptakt, ägarskaps-regler | scripts/heartbeat-svep.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.hemlighet-utskrift-policy.conf` | Förbjudna utskriftsmönster | scripts/deny-hemlighet-utskrift.sh; scripts/kontrollera-hemlighets-namn.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.hemlighets-namn-policy.conf` | Kända hemlighetsNAMN (inte värden) | scripts/kontrollera-hemlighets-namn.sh; scripts/fas4-prod-deploy.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.jq-version-policy.conf` | Pinnad minimiversion för jq | scripts/lib/jq-guard.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.katalogagarskap-policy.conf` | Ägarlappens format, liveness-tröskel | scripts/katalogagarskap-markor.sh; katalogagarskap-slapp.sh; deny-frammande-huvudkatalog.… | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.label-policy.json` | GitHub-labels att skapa/uppdatera | scripts/synka-labels.mjs | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.langa-streck-policy.json` | AST-undantag för em/en-dash-vakten | scripts/check-langa-streck.mjs | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.lesson-policy.conf` | Volymfiler att skanna | scripts/check-lesson-numbers.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.listparitet-policy.conf` | Par av listor som ska matcha | scripts/check-listparitet.sh; scripts/check-docs.sh (indirekt) | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.mail-lock-policy.conf` | Mail-låsets aktiveringsvillkor | scripts/deny-resend-send.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.mailto-policy.json` | Legitima kontakt-mailto-undantag | scripts/check-mailto.mjs | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.merge-tree-mandat-policy.conf` | Mandat-berättigade filer vid konflikt | scripts/check-merge-tree.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.mutation-hemvist-policy.conf` | Allowlistade komponent-lokala useMutation | tests/api/mutation-hemvist-vakt.test.ts | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.nattvakt-dedup-policy.conf` | Dedup-fönster för natt-ärenden | scripts/check-nattvakt-dedup.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.permissions-claims-policy.conf` | Vilka filer räknas som "styrande" för ADR-083-grinden | scripts/check-permissions-claims.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.precompact-policy.conf` | Kompakterings-kedjans tröskel/markörer (ADR-101) | scripts/deny-precompact.sh; scripts/post-compact-igenkanning.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.prod-airtable-policy.conf` | Prod-bas-ID och undantagsregler (TASK-419) | scripts/deny-prod-`airtable`.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.prod-functions-allowlist.conf` | De 57 allowlistade EF-namnen | scripts/deploy-prod-functions.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.prod-ref-policy.conf` | Prod-projektreferensen som ska nekas i agent-kommandon | scripts/deny-prod-ref.sh; scripts/fas4-prod-deploy.sh; flera backfill/migration-skript | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.purge-staging-policy.json` | Sentinel-mönster + purge-targets | scripts/purge-staging-sentinels.mjs; scripts/seed-*-fixture.mjs; scripts/check-listparite… | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.review-loop-policy.json` | Rundtak, blockeringströsklar (ADR-105 beslut 4) | scripts/review-loop-beslut.mjs; scripts/lib/review-loop.mjs | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.review-policy.json` | Path-scopade granskningsregler (ADR-105 beslut 7) | scripts/hamta-review-policy.mjs; scripts/lib/review-policy.mjs; scripts/lib/review-utlata… | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.sanningsavstamning-policy.conf` | Sannings-avstämningens fönster/mönster | scripts/check-pausade-sessioner.sh; scripts/check-obesvarade-larm.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.stada-grenar-policy.conf` | Vilka grenar är säkra att radera | scripts/stada-grenar.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.staging-preflight-hook-policy.conf` | Staged path-prefix som triggar preflight-vakten | .githooks/pre-commit | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.staging-preflight-wiring-policy.json` | Upptäcktsnätets kataloger | scripts/check-staging-preflight-wiring.mjs | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.staging-semaphore-policy.conf` | Semaforens timeout/sökväg | scripts/staging-semaphore.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.stop-vakt-policy.json` | Väntepåstående-mönster som fälls | scripts/stop-vakt.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.subagent-vantan-policy.conf` | Verktygsmönster som räknas som "väntan" | scripts/deny-subagent-vantan.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.supabase-cli-policy.conf` | Pinnad Supabase CLI-version | scripts/lib/`supabase`-cli.sh; deploy-familjen | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `.thread-index-policy.conf` | Registrets format/kolumner | scripts/check-thread-index.sh | indirekt-via-aggregatorn | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |

### Verktygs- och byggkonfiguration (24)

Inställningsfiler för de externa verktyg som bygger, testar och kontrollerar koden (TypeScript, Vite, Biome, Playwright, Vale, m.fl.).

| Sökväg | Syfte | Anropas av | Blockerar merge | Källa |
|---|---|---|---|---|
| `.editorconfig` | Editor-baskonfiguration för indentering och radslut | IDE/editor | nej | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `.lycheeignore` | Brusfilter för nattlig länkkontroll sedan ADR-082 (var tidigare grind-tystare). 70 mönster, tillväxt 22->70 på sju veckor | lychee i nightly.yml (extern länkkontroll) | nej | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `.markdownlint-cli2.jsonc` | Markdown-hygien. MD013/MD060 avstängda, MD024 siblings_only. Kritisk .claude/worktrees/**-exkludering (annars dras andra agenters halvskrivna filer in) | npx markdownlint-cli2, del av check:docs och docs-jobbet | ja | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `.nvmrc` | Node-version "24" — läses av actions/setup-node i CI men är BARA rådgivande lokalt (ingen .npmrc med engine-strict) | nvm, actions/setup-node | ja | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `.vale.ini` | Prosa-/terminologikontroll: tre egna stilfiler, två vokabulärer, MinAlertLevel=suggestion (bara error blockerar) | vale, npm run lint:prose, docs-jobbet | ja | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `.vale/styles/config/vocabularies/AriaAttrs/accept.txt` | ARIA-attribut-vokabulär, 49 rader. Tillkommen efter ADR-030, ej dokumenterad där | .vale.ini (StylesPath) | ja (för error-nivå regler) | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `.vale/styles/config/vocabularies/Miranon/accept.txt` | Varumärkets vokabulär (accepterade ord), 25 rader | .vale.ini (StylesPath) | ja (för error-nivå regler) | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `.vale/styles/Miranon/Brand.yml` | Regex som tvingar varumärkets fullständiga tvåordsform | .vale.ini (StylesPath) | ja (för error-nivå regler) | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `.vale/styles/Miranon/Undvik.yml` | Varnar för ett fåtal svepande värdeord (svenska och engelska) — mild suggestion-nivå, blockerar inte | .vale.ini (StylesPath) | ja (för error-nivå regler) | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `.vale/styles/Miranon/VueToReact.yml` | 10 substitutionsregler Vue->React-terminologi (ADR-030 sa "11" — trivial fyra-månaders-drift) | .vale.ini (StylesPath) | ja (för error-nivå regler) | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `.yamllint.yml` | YAML-syntax för workflow-filer. extends:default, line-length disabled, truthy.check-keys:false | yamllint, ci.yml lint-jobbet | ja | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `audit-ci.jsonc` | npm-sårbarhetsgrind, high:true, allowlist just nu TOM. Två öppna high-advisories (sharp, smol-toml) mätt 2026-09-17 | npx audit-ci, ci.yml audit-jobbet | ja | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `biome.json` | Format + lint + import-sortering i ETT kommando (`biome` check .) | `biome` check . (npm run lint) | ja | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `package.json` | 55 npm-skript, devDependencies med pinnade versioner, sju overrides (säkerhetsfixar), engines.node >=24 | npm run [skript-namn], npm ci | ja | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `playwright.config.ts` | Definierar 11 (+3 villkorade) Playwright-testprojekt, portschema, timeouts, reporters, retries (CI:2/lokalt:0) | npx `playwright` test, alla npm run test:* | ja | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `supabase/config.toml` | Supabase CLI:s lokala projektkonfiguration (project_id, portar för lokal Postgres/Studio/API, migrations-sökväg). Styr `npx supabase` när den körs lokalt/mot ett länkat projekt. | npx `supabase` [kommando] (lokalt och i deploy-/migrationsskript via scripts/lib/`supabase`-c… | nej | `Eget stickprov — filen nämns i j1e/j1f men dess exakta innehåll är inte citerat rad för rad av något underlag` |
| `tsconfig.app.json` | Appkodens (src/) TypeScript-konfiguration | tsc -b | ja | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `tsconfig.edge-shared.json` | Typkontrollerar 24 av 73 _shared-filer i `supabase`/functions via en Node-genväg (ADR-010) — Denos EGET verktyg (deno check/lint) är INTE kopplat in någonstans | tsc -b | ja | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `tsconfig.json` | Roten — project references till fyra delprojekt (app/node/tests/edge-shared) | tsc -b (npm run typecheck/build) | ja | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `tsconfig.node.json` | `vite`.config.ts + `playwright`.config.ts TypeScript-konfiguration | tsc -b | ja | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `tsconfig.tests.json` | tests/**/*.ts TypeScript-konfiguration, ärver tsconfig.node.json. Kan dölja fel lokalt pga tsc -b:s cache (lärdom TASK-438) | tsc -b, npm run typecheck:tests | ja | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `tsr.config.json` | TanStack Router route-generering | tsr generate (del av build/typecheck) | ja | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `vercel.json` | Deploy-config + sju säkerhets-HTTP-headrar (ingen CSP ännu), cache-regler | Vercel-plattformen vid deploy | nej | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `vite.config.ts` | Bygg-pipeline: PWA-plugin, mode-koherens-grind (assertModeCoherent fäller build-tid vid fel Supabase-URL/läge), inget CSP ännu (Fas 7-löfte) | `vite` / `vite` build (npm run build/dev) | ja | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |

### Testinfrastruktur och testkataloger (39)

Stödkod och delad data testerna använder, samt en sammanräkning av hur många tester som finns i varje testkategori.

| Sökväg | Syfte | Anropas av | Blockerar merge | Källa |
|---|---|---|---|---|
| `tests/a11y/*.test.ts` | Playwright-projektet "a11y" — 17 filer, 118 tester (mätt 2026-09-17 med npx `playwright` test --list). Hermetisk browser + axe-core-scan. | ci-suite.yml (respektive jobb, se workflow-posterna) | nej | `07-hermetiska-tester-kontra-realistisk-e2e.md §Testpyramiden i tal, §CI-koppling` |
| `tests/acceptance/*.acceptance.test.ts` | Playwright-projektet "acceptance" — 61 filer, 524 tester (mätt 2026-09-17 med npx `playwright` test --list). Hermetisk browser, MSW-mockad backend, egen dev-server :5399 (ADR-080). Vuxit från 18/~164 (aug) till 61/524. | ci-suite.yml (respektive jobb, se workflow-posterna) | ja | `07-hermetiska-tester-kontra-realistisk-e2e.md §Testpyramiden i tal, §CI-koppling` |
| `tests/api/*.setup.ts (api-setup)` | Playwright-projektet "api-setup". Loggar in user+admin EN gång (T24-b). Ingår i api-pure-katalogen, egen fas. | ci-suite.yml (respektive jobb, se workflow-posterna) | nej (stödprojekt) | `07-hermetiska-tester-kontra-realistisk-e2e.md §Testpyramiden i tal, §CI-koppling` |
| `tests/api/*.staging.test.ts (api-staging)` | Playwright-projektet "api-staging" — 63 filer, 529 tester (mätt 2026-09-17 med npx `playwright` test --list). Riktig Supabase + riktig Airtable (staging). Playwright-projekt api-staging. | ci-suite.yml (respektive jobb, se workflow-posterna) | nej | `07-hermetiska-tester-kontra-realistisk-e2e.md §Testpyramiden i tal, §CI-koppling` |
| `tests/api/*.test.ts (api-pure)` | Playwright-projektet "api-pure" — 80 filer, 1786 tester (mätt 2026-09-17 med npx `playwright` test --list). Ren logik, credential-fri, inget nätverk. Playwright-projekt api-pure. | ci-suite.yml (respektive jobb, se workflow-posterna) | ja | `07-hermetiska-tester-kontra-realistisk-e2e.md §Testpyramiden i tal, §CI-koppling` |
| `tests/e2e/*.staging.test.ts (chromium-authenticated)` | Playwright-projektet "e2e (chromium-authenticated)" — 34 filer, 304 tester (mätt 2026-09-17 med npx `playwright` test --list). Blandat: 2 av 34 helt realistiska (invite-rundtur + en describe i skapa-event), 5 mock-fria me… | ci-suite.yml (respektive jobb, se workflow-posterna) | nej | `07-hermetiska-tester-kontra-realistisk-e2e.md §Testpyramiden i tal, §CI-koppling` |
| `tests/fixtures/review-backstopp/pr-2031-med-sektion.txt` | Fixturdata — FAKTISK PR-kropp hämtad ur en riktig, redan granskad PR (#2031), MED Riskbedömnings-sektion | .`github`/workflows/review-backstopp-proof.yml | nej | `underlag/j1b-ovriga-workflows-och-github-katalogen.md` |
| `tests/fixtures/review-backstopp/pr-2031-utan-sektion.txt` | Fixturdata — FAKTISK PR-kropp hämtad ur en riktig, redan granskad PR (#2031), UTAN Riskbedömnings-sektion | .`github`/workflows/review-backstopp-proof.yml | nej | `underlag/j1b-ovriga-workflows-och-github-katalogen.md` |
| `tests/global-setup.ts` | Nollställer en JSONL-mätfil (HERMETIK_RAPPORT_FIL) FÖRE körningen, no-op om ej PLAYWRIGHT_HERMETIK_RAPPORT=1 | `playwright`.config.ts (globalSetup) | indirekt-via-aggregatorn | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `tests/global-teardown.ts` | Redigerar bort lösenord i klartext ur Playwrights error-context.md-artefakter (ADR-061 Pelare 3); skriver hermetik-läcke-sammanställning om samma flagga är satt | `playwright`.config.ts (globalTeardown) | indirekt-via-aggregatorn | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `tests/kontraktsvakt/*.test.ts` | Playwright-projektet "kontraktsvakt" — 1 filer, 10 tester (mätt 2026-09-17 med npx `playwright` test --list). Läser riktig staging (GET), jämför mot fixturschema via zod. 5:e, egen testkategori (varken enhet/integration/a… | ci-suite.yml (respektive jobb, se workflow-posterna) | nej | `07-hermetiska-tester-kontra-realistisk-e2e.md §Testpyramiden i tal, §CI-koppling` |
| `tests/kontraktsvakt/kontraktsfall.ts` | Definierar kontraktsvaktens 8 testfall (7 fixturhandlers + 1 felfall) — jämför fixturvärldens antagna svarsform mot skarp staging | tests/kontraktsvakt/kontraktsvakt.staging.test.ts | nej | `underlag/j1f-test-bygg-och-lintkonfiguration.md, 07-hermetiska-tester-kontra-realistisk-e2e.md` |
| `tests/kontraktsvakt/kontraktsjamforelse.ts` | Jämförelselogik: samma zod-schema mot fixturens antagna svar och det RIKTIGA svaret från skarp staging | tests/kontraktsvakt/kontraktsvakt.staging.test.ts | nej | `07-hermetiska-tester-kontra-realistisk-e2e.md` |
| `tests/kontraktsvakt/kontraktsvakt.staging.test.ts` | Playwright-projektet kontraktsvakt (1 spec, 10 tester) — 7 GET-anrop mot skarp staging, läsande, ingen mutex | nightly.yml jobbet kontraktsvakt (npm run test:kontraktsvakt eller motsvarande) | nej | `underlag/j1f-test-bygg-och-lintkonfiguration.md, 07-hermetiska-tester-kontra-realistisk-e2e.md` |
| `tests/support/dev-portar.ts` | Härleder portnummer per testklass (a11y 5199, visual 5299, acceptance 5399, webblasarbeteende 5499) som basport + worktree-index*1000, för att undvika kollision mellan samtidiga bygg-agenter (TASK-251) | `playwright`.config.ts (webServer-block för fixturbundna klasser) | indirekt-via-aggregatorn | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `tests/support/fixturvarld/assets/inter.css` | Lokal fontfil/stilark för den hermetiska fixturvärlden (undviker nätverksberoende mot Google Fonts i tester) | Hermetiska testprojekt (indirekt via CSS) | nej | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `tests/support/fixturvarld/assets/UcCo3FwrK3iLTcvhYwYL8g.woff2` | Lokal fontfil/stilark för den hermetiska fixturvärlden (undviker nätverksberoende mot Google Fonts i tester) | Hermetiska testprojekt (indirekt via CSS) | nej | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `tests/support/fixturvarld/assets/UcCo3FwrK3iLTcviYwY.woff2` | Lokal fontfil/stilark för den hermetiska fixturvärlden (undviker nätverksberoende mot Google Fonts i tester) | Hermetiska testprojekt (indirekt via CSS) | nej | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `tests/support/fixturvarld/assets/UcCo3FwrK3iLTcvmYwYL8g.woff2` | Lokal fontfil/stilark för den hermetiska fixturvärlden (undviker nätverksberoende mot Google Fonts i tester) | Hermetiska testprojekt (indirekt via CSS) | nej | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `tests/support/fixturvarld/assets/UcCo3FwrK3iLTcvsYwYL8g.woff2` | Lokal fontfil/stilark för den hermetiska fixturvärlden (undviker nätverksberoende mot Google Fonts i tester) | Hermetiska testprojekt (indirekt via CSS) | nej | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `tests/support/fixturvarld/assets/UcCo3FwrK3iLTcvtYwYL8g.woff2` | Lokal fontfil/stilark för den hermetiska fixturvärlden (undviker nätverksberoende mot Google Fonts i tester) | Hermetiska testprojekt (indirekt via CSS) | nej | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `tests/support/fixturvarld/assets/UcCo3FwrK3iLTcvuYwYL8g.woff2` | Lokal fontfil/stilark för den hermetiska fixturvärlden (undviker nätverksberoende mot Google Fonts i tester) | Hermetiska testprojekt (indirekt via CSS) | nej | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `tests/support/fixturvarld/assets/UcCo3FwrK3iLTcvvYwYL8g.woff2` | Lokal fontfil/stilark för den hermetiska fixturvärlden (undviker nätverksberoende mot Google Fonts i tester) | Hermetiska testprojekt (indirekt via CSS) | nej | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `tests/support/fixturvarld/ef-namnforslag.ts` | Funktionsnamnsförslag/normalisering för fixturvärlden | Den hermetiska testklassen (acceptance/webblasarbeteende/a11y/manifest-screenshots) | ja (indirekt) | `07-hermetiska-tester-kontra-realistisk-e2e.md` |
| `tests/support/fixturvarld/fixture-data.ts` | FROZEN_NOW och övrig statisk fixturdata | Den hermetiska testklassen (acceptance/webblasarbeteende/a11y/manifest-screenshots) | ja (indirekt) | `07-hermetiska-tester-kontra-realistisk-e2e.md` |
| `tests/support/fixturvarld/handlers.ts` | Registrerar MSW-mockhandlers för 18 Edge Functions — kärnan i den hermetiska fixturvärlden | tests/support/fixturvarld/hermetic.ts | ja (indirekt, via acceptance-klassen) | `underlag/j1f-test-bygg-och-lintkonfiguration.md, 07-hermetiska-tester-kontra-realistisk-e2e.md` |
| `tests/support/fixturvarld/hermetic.ts` | Registrerar MSW på Playwright-context-nivå; skriver handskriven JWT i localStorage i stället för äkta Supabase Auth-nätverksvalidering | Den hermetiska testklassen (acceptance/webblasarbeteende/a11y/manifest-screenshots) | ja (indirekt) | `07-hermetiska-tester-kontra-realistisk-e2e.md` |
| `tests/support/fixturvarld/hermetik-vakt.ts` | Kastar OmockadRequestError för varje anrop till annat än localhost/127.0.0.1 — avbrytande, inte tyst | Den hermetiska testklassen (acceptance/webblasarbeteende/a11y/manifest-screenshots) | ja (indirekt) | `07-hermetiska-tester-kontra-realistisk-e2e.md` |
| `tests/support/fixturvarld/overskuggnings-rapport.ts` | Egenbyggd Playwright-reporter, fäller körningen vid en "död" mock-deklaration. Avstängs av --shard/--grep/--grep-invert | Den hermetiska testklassen (acceptance/webblasarbeteende/a11y/manifest-screenshots) | ja (indirekt) | `07-hermetiska-tester-kontra-realistisk-e2e.md` |
| `tests/support/fixturvarld/overskuggnings-vakt.ts` | Upptäcker registrerade mock-handlers som aldrig konsumeras av något test i samma fil | Den hermetiska testklassen (acceptance/webblasarbeteende/a11y/manifest-screenshots) | ja (indirekt) | `07-hermetiska-tester-kontra-realistisk-e2e.md` |
| `tests/support/fixturvarld/websocket-vakt.ts` | Mockar Supabase Realtime/WebSocket. Registreras SIST i handler-listan — mätt strukturellt trasig (stänger vägen för att en WS-mock hinner svara) | Den hermetiska testklassen (acceptance/webblasarbeteende/a11y/manifest-screenshots) | ja (indirekt) | `07-hermetiska-tester-kontra-realistisk-e2e.md` |
| `tests/support/hermetik-rapport-fil.ts` | Filsökvägskonstant för hermetik-rapporten, 19 rader | Diverse testprojekt | indirekt-via-aggregatorn | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `tests/support/kastbara-poster.ts` | Ägar-manifestets (.kastbara/poster.jsonl) läs/skriv-logik för purge-efter | Diverse testprojekt | indirekt-via-aggregatorn | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `tests/support/mat-cls.ts` | Core Web Vitals-mätning (Cumulative Layout Shift), 330 rader | Diverse testprojekt | indirekt-via-aggregatorn | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `tests/support/senasteInteraktionGrammatik.ts` | Grammatik-hjälpare för senaste-interaktion-formulering, 49 rader | Diverse testprojekt | indirekt-via-aggregatorn | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `tests/support/staging-preflight.ts` | Anropar scripts/staging-semaphore.sh preflight INNAN lokala staging-tester får röra staging — förhindrar att en lokal körning kolliderar med CI (TASK-70.3-incidenten) | api-setup/setup-projekten (Playwright); Node-skriptens main() (purge/seed) | nej | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `tests/support/test-bas.ts` | Delad testbas/fixture-utökning för Playwright, 109 rader | Diverse testprojekt | indirekt-via-aggregatorn | `underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `tests/visual/*.test.ts (visual-desktop + visual-mobile)` | Playwright-projektet "visual" — 58 filer, 322 tester (mätt 2026-09-17 med npx `playwright` test --list). Hermetisk browser, mockad backend, pixel-diff. Byggd men PR-grinden MEDVETET INAKTIV (tråd T87). 1440x900 desktop + … | ci-suite.yml (respektive jobb, se workflow-posterna) | nej | `07-hermetiska-tester-kontra-realistisk-e2e.md §Testpyramiden i tal, §CI-koppling` |
| `tests/webblasarbeteende/*.test.ts` | Playwright-projektet "webblasarbeteende" — 17 filer, 109 tester (mätt 2026-09-17 med npx `playwright` test --list). Hermetisk browser, NOLL nätverksdimension (ADR-094). | ci-suite.yml (respektive jobb, se workflow-posterna) | ja | `07-hermetiska-tester-kontra-realistisk-e2e.md §Testpyramiden i tal, §CI-koppling` |

### Styrande dokument (38)

Text som människor och agenter läser för att förstå eller besluta. Bär ingen mekanisk kraft i sig själv — men beskriver ofta VARFÖR en mekanism ser ut som den gör.

| Sökväg | Syfte | Anropas av | Blockerar merge | Källa |
|---|---|---|---|---|
| `.github/ISSUE_TEMPLATE/bug.md` | Buggrapport-mall (Beskrivning/Reproduktion/Förväntat/Faktiskt/Miljö/Korsreferens). | GitHub (Ny ärende-formulär) | nej | `underlag/j1b-ovriga-workflows-och-github-katalogen.md` |
| `.github/ISSUE_TEMPLATE/feature.md` | Feature-förslag-mall (Problem/Förslag/Alternativ/Korsreferens). | GitHub (Ny ärende-formulär) | nej | `underlag/j1b-ovriga-workflows-och-github-katalogen.md` |
| `.github/PULL_REQUEST_TEMPLATE.md` | Sexpunkts DoD-checklista (test:api, typecheck, `biome` check, build + två prosakrav) som fylls i manuellt av PR-författaren. | GitHub (visas automatiskt vid PR-skapande) | nej | `underlag/j1b-ovriga-workflows-och-github-katalogen.md` |
| `CLAUDE.md` | Projektets konstitution: DoD-kommandolistan, triage-processen (ADR-053), landnings-ordningen (merge queue, review-grinden), verktygsfakta som lätt gissas fel. Den enda fil som auto-laddas i varje Code-session i detta re… | Läses vid varje Code-sessionsstart | nej | `Denna fil själv, citerad genomgående av samtliga underlag` |
| `CONTRIBUTING.md` | Definition of Done, testklassernas §§ (Acceptance-klassen, Post-merge-lagret, Webbläsarbeteende-klassen, Visuell regression), landnings-ordningens fulla mekanik. | Läses av utvecklare/agent vid behov (auto-laddas EJ i Code-session) | nej | `07-hermetiska-tester-kontra-realistisk-e2e.md, underlag/j1c-ci-wirade-skript-och-policyfiler.md` |
| `docs/decisions/ADR-010-biome-exclude-deno-edge-functions.md` | ADR-010: Biome exkluderar `supabase`/functions. "Fas 7-åtagande" (deno check/lint i CI) fortfarande obetalt 2026-09-17, ~4 månader efter mintning. | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-028-supply-chain-incident-respons.md` | ADR-028: Supply chain-incidentrespons — grunden för audit-ci.jsonc, package.json overrides, Dependabot-cooldown. | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-029-ci-architektur-changed-files-pattern.md` | ADR-029: changed-files-mönstret — grundarkitekturen för changed-jobbets D0/D1/acceptance-klassning. | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-030-docs-grindvakter-frontmatter-policy.md` | ADR-030: Grundbeslutet bakom markdownlint/Vale/yamllint/frontmatter-grindarna. Flera tal (regelantal, filantal) har drivit sedan 2026-05-14. | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-033-shellcheck-strict-grindvakt.md` | ADR-033: shellcheck-strict-scopet: scripts/*.sh + .githooks/* + sourced configar. | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-036-kvalitetsgrind-ci-enda-mekaniska-enforcement.md` | ADR-036: CI som ENDA mekaniska enforcement — grunden för att ingen lokal pre-push-grind är obligatorisk; verify:ci-parity klassat som diagnosverktyg (två amenderingar 2026-08-05). | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-039-konsistens-grindar-kadens.md` | ADR-039: Konsistens-grindarnas kadensprincip + fetch-depth-invariantens ägarskap (5-6 bärare). | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-050-isolerad-staging-miljo.md` | ADR-050: Isolerad staging (Postgres+Airtable), väg C/branching avvisad. Grunden för att EF-deploy till staging är manuellt (Fas 7-skuld). | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-060-sentinel-setup-purge-create-conformance.md` | ADR-060: Sentinel-setup-purge-mönstret (Vlad Mihalceas "setup > teardown"-citat), EF-only-gränsen för purge-secrets. | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-061-lokal-miljo-isolation.md` | ADR-061: Lokal miljöisolation: mode-koherens-grind (assertModeCoherent), .env.local vs committade läges-filer. | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md` | ADR-063: Airtable-basen som förstklassig leverabel — motiverar varför testbarhet kostar (Airtable-plattformens väggar). | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-076-merge-grinden-ruleset-pr-flode.md` | ADR-076: Merge-grinden: ruleset, merge queue, strict avstängd 2026-08-05. Den bäst mekaniserade och mest verifierat drift-fria delen av hela arkitekturen. | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md` | ADR-077: Riskanpassad klassning/dedup/nattnät — grundbeslutet för att staging/a11y flyttades ur PR-ytan. § Updates 2026-08-28 om TASK-334. | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-080-acceptance-klassen-hermetisk-utbrytning.md` | ADR-080: Acceptance-klassens hermetiska utbrytning ur e2e. § 3 varnar själv för tyst fixturdrift. | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-082-lankgrindens-form-presubmit-postsubmit.md` | ADR-082: Länkgrindens form: intern länkkontroll presubmit (--offline), extern flyttad till natten. .lycheeignore bytte roll från grind-tystare till brusfilter. | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-083-prosa-som-pastar-mekanism.md` | ADR-083: Grunden för check-permissions-claims.sh. Täcker påståenden om permissions.deny/ask, INTE om PreToolUse-hookars frånvaro/närvaro (mätt lucka, J1d). | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-090-sessions-parallellitet-detektera-och-fraga.md` | ADR-090: Sessions-parallellitet — grunden för katalogagarskap-*.sh och deny-frammande-huvudkatalog.sh. | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-091-hosting-deploy-vercel-pro.md` | ADR-091: Vercel-valet, Pro-kravet, CSP-falsifieringen. | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-094-webblasarbeteende-testklass.md` | ADR-094: Webbläsarbeteende-klassen — egen hemvist för plattforms-API-tester utan nätverksdimension. | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-096-subagentens-vantekontrakt.md` | ADR-096: Subagentens väntekontrakt — grunden för deny-subagent-vantan.sh; subagent=Activity, orkestrerare=Workflow. | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-097-arbetsformens-tillstandsbarare.md` | ADR-097: Push-ekonomins princip (commit är gratis, push kostar) — grunden för deny-arbetsform-push.sh. | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-099-sessionsdok-rotens-rullande-fonster.md` | ADR-099: Sessionsdok-rotens rullande fönster — grunden för arkivera-sessionsdok.sh/check-sessionsdok-fonster.sh. | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-101-compact-formen-kontrollerad-kompaktering-smal-nisch.md` | ADR-101: Kontrollerad kompaktering — grunden för deny-precompact.sh/post-compact-igenkanning.sh. | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-104-godkannande-mekaniken-kanalseparation.md` | ADR-104: Kanalseparation för godkännande — grunden för deny-facit-godkand-skrivning.sh. | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-105-review-grinden-fyra-deltan-byggs-inte-adopteras.md` | ADR-105: Review-grinden i sin helhet: review-agent-kontraktet, backstoppen (TASK-173.4), rundtaks-loopen, instrumenteringen. Den mest omfattande enskilda ADR:n i denna yta. | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-117-backlog-grindens-faktainsamling-bulk-och-korsvalidering.md` | ADR-117: Backlog-grindens bulk-insamling — grunden för backlog-kortfakta.mjs och npm run bl-wrappern. | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-127-backlog-stangningsformerna-harledd-dod-och-avstadda-krav.md` | ADR-127: Backlog-stängningsformerna: härledd DoD, avstådda krav — de två undantagen i check-backlog-closure.sh. | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-129-jobbmotorn-ko-cron-och-kick.md` | ADR-129: Jobbmotorn (kö, cron, kick) för betalningsflödet — Vault-hemligheternas namn är låsta av denna ADR. | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-131-work-item-substratet-github-issues.md` | ADR-131: Accepted (2026-09-04) men EJ verkställd — river bl.a. check-backlog-closure.sh när den genomförs. Stående kostnad utan brytdag. | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/decisions/ADR-132-demolaget-staging-som-maskinrum-bakom-dorr-i-prod-appen.md` | ADR-132: Demoläget — staging får en andra roll (permanent, svep-undantagen fixtur som Lotta kör mot). Accepted men EJ byggt (TASK-414 och alla sju döttrar To Do). | Läses av agenter/Marcus inför arkitekturbeslut på denna yta | nej | `Citerad av flertalet underlag (se respektive fils § Vad jag läste först)` |
| `docs/reference/prod-driftsattning-betalningsflodet-runbook.md` | Fullständig, genomförd prod-driftsättnings-runbook för betalningsflödet (1240 rader) — inkl. Vault-hemligheternas SHA-256-digest-verifiering och regeln att en prod-databas med verklig data aldrig "rullas tillbaka", bara… | Marcus vid prod-driftsättning av betalningsflödet | nej | `underlag/j1e-externa-installningar-och-deployvagar.md` |
| `docs/reference/prod-driftsattning-runbook.md` | Fullständig, genomförd prod-driftsättnings-runbook (aktivitetsloggen) — Steg 6 kallar sin egen frontend-verifiering "PRELIMINÄR" i väntan på TASK-199. | Marcus vid prod-driftsättning | nej | `underlag/j1e-externa-installningar-och-deployvagar.md` |
| `docs/reference/staging-verifiering-runbook.md` | Browser-QA mot staging, de sex kända fällorna (bl.a. localStorage-fällan, granskningsfixturens livstid). | Marcus/agent vid manuell staging-granskning | nej | `underlag/j1e-externa-installningar-och-deployvagar.md` |

### Externa GitHub-inställningar (14)

Regler som bor på GitHub.com:s servrar (inte i en fil i detta repo) — t.ex. vilka kontroller som måste bli gröna innan kod får slås samman.

| Sökväg | Syfte | Anropas av | Blockerar merge | Källa |
|---|---|---|---|---|
| `.github/CODEOWNERS` | Fyra rader: allt ägs av @marcus803, plus tre extra rader för styrande dokument/.`github`/LICENSE/SECURITY.md. | GitHub PR-gränssnitt (om required_approving_review_count > 0 eller kodägar-krav aktiverat) | nej | `underlag/j1b-ovriga-workflows-och-github-katalogen.md` |
| `.github/dependabot.yml` | Automatiska beroende-uppdateringar för två ekosystem: npm (veckovis, fyra stack-grupper + två catch-all, 7 dagars cooldown) och `github`-actions (månadsvis, en catch-all-grupp). | GitHub Dependabot (plattformstjänst) | nej | `underlag/j1b-ovriga-workflows-och-github-katalogen.md` |
| `CodeQL (code-scanning/default-setup)` | GitHubs EGET Default Setup-läge, INTE en fil i .`github`/workflows/. Veckovis + push (event:dynamic). Ingen required check kopplad. | GitHub (plattformshanterad) | nej | `underlag/j1b-ovriga-workflows-och-github-katalogen.md, underlag/j1e-externa-installningar-och-deployvagar.md` |
| `Dependabot alerts/security updates/secrets` | Alerts PÅ (2 open, båda high: sharp/libheif, smol-toml/DoS). Auto-PR AV (automated_security_fixes:false). Inga Dependabot-secrets. |  | nej | `underlag/j1e-externa-installningar-och-deployvagar.md, underlag/j1f-test-bygg-och-lintkonfiguration.md` |
| `GitHub Actions repo-secrets (8 st)` | STAGING_AIRTABLE_TOKEN, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, TEST_REGISTRATION_RECORD_ID, TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD. | ci.yml/ci-suite.yml test-jobb | indirekt-via-aggregatorn | `underlag/j1e-externa-installningar-och-deployvagar.md` |
| `GitHub Actions-inställningar (allowed_actions:all, default_workflow_permissions:read, sha_pinning_required:false)` | Plattformen TVINGAR inte SHA-pinning — repots konsekventa SHA-pinning i workflow-filer är ett frivilligt arbetssätt, inte en plattformsregel. |  | nej | `underlag/j1e-externa-installningar-och-deployvagar.md` |
| `GitHub merge queue-regel (del av main-skydd-rulesetet)` | grouping_strategy:ALLGREEN, max_entries_to_merge:3, min_entries_to_merge:1, min_entries_to_merge_wait_minutes:5, check_response_timeout_minutes:60. Sekvenserar landningar, ersätter strict. | GitHub (vid gh pr merge --auto-armering) | ja | `underlag/j1e-externa-installningar-och-deployvagar.md` |
| `GitHub org-rulesets (high-five-group)` | Finns INTE (tom lista) — repo-rulesetet är den enda källan. |  | nej | `underlag/j1e-externa-installningar-och-deployvagar.md` |
| `GitHub repo-inställningar (allow_auto_merge, delete_branch_on_merge, allow_update_branch)` | allow_auto_merge:true (krävs för gh pr merge --auto), delete_branch_on_merge:true (sedan TASK-70.6), allow_update_branch:false. | gh pr merge --auto | indirekt-via-aggregatorn | `underlag/j1e-externa-installningar-och-deployvagar.md` |
| `GitHub required status check "CI Passed or Skipped" (integration_id 15368)` | Den enda posten i main-skydd-rulesetets required_status_checks — bunden till GitHub Actions-appens ID, inte bara ett namn, som skydd mot att en annan app/token förfalskar checken. | GitHub ruleset main-skydd | ja | `underlag/j1a-ci-yml-och-ci-suite.md` |
| `GitHub ruleset "main-skydd" (id 19627609, high-five-group/miranon-media-admin)` | Enda mekaniska grinden på main: pull_request-krav (0 approvals), required_status_checks (exakt en post), merge_queue (ALLGREEN, max 3), deletion/non_fast_forward-skydd. allowed_merge_methods låst till ["merge"]. | GitHub (varje push/PR/merge_group mot main) | ja | `underlag/j1a-ci-yml-och-ci-suite.md §Metod, underlag/j1e-externa-installningar-och-deployvagar.md §1, underlag/01-orkestrerarens-stickprov.md S5` |
| `GitHub-miljöer Preview/Production` | Ren deployment-bokföring för Vercels integration, INGA skyddsregler (protection_rules:[]). | Vercels git-integration (vercel[bot]) | nej | `underlag/j1e-externa-installningar-och-deployvagar.md` |
| `Klassisk GitHub branch protection på main` | Finns INTE — avsiktligt, ADR-076 avvisade klassisk branch protection till förmån för rulesets. |  | nej | `underlag/j1e-externa-installningar-och-deployvagar.md` |
| `Secret scanning + push protection (GitHub)` | PÅ (secret_scanning_validity_checks:enabled, secret_scanning_non_provider_patterns:enabled). Push protection kan blockera en push. |  | ja | `underlag/j1e-externa-installningar-och-deployvagar.md` |

### Extern: Vercel (hosting) (1)

Tjänsten som bygger och publicerar webbplatsen. Fungerar helt parallellt med, och oberoende av, GitHub Actions.

| Sökväg | Syfte | Anropas av | Blockerar merge | Källa |
|---|---|---|---|---|
| `Vercel-projektet miranon-media-admin` | Bygger main -> Production, varje PR/gren -> Preview. Helt parallell mekanism till GitHub Actions CI — triggas av git-integrationen, inte av ci.yml. | Vercels git-integration (push mot main/gren) | nej | `underlag/j1e-externa-installningar-och-deployvagar.md §1, §3a, underlag/01-orkestrerarens-stickprov.md S6, S8` |

### Extern: Supabase (databas) (2)

De två databasprojekten (en för test, en skarp) som appen pratar med.

| Sökväg | Syfte | Anropas av | Blockerar merge | Källa |
|---|---|---|---|---|
| `Supabase prod-projekt (lvjsfnphlauldxqlncpl)` | Skarp databas för Lottas data. Mekaniskt SPÄRRAD för agenter (scripts/deny-prod-ref.sh matchar prod-refen som substräng i HELA kommandosträngen). | Marcus manuellt via scripts/fas4-prod-deploy.sh, scripts/deploy-prod-functions.sh, m.fl. | nej | `underlag/j1e-externa-installningar-och-deployvagar.md` |
| `Supabase staging-projekt (pqtshyierkdgwdnxuirz)` | Isolerad staging-databas (ADR-050). All CI-testning mot "riktig backend" går hit. Edge Functions deployas MANUELLT, aldrig av CI. | ci-suite.yml (test-staging, purge, purge-efter); nightly.yml (kontraktsvakt); lokala körn… | nej | `underlag/j1e-externa-installningar-och-deployvagar.md, underlag/j8-4-staging-och-e2e.md` |

### Extern: Airtable (datakälla) (2)

De två Airtable-baserna (en för test, en skarp) som lagrar Lottas verksamhetsdata.

| Sökväg | Syfte | Anropas av | Blockerar merge | Källa |
|---|---|---|---|---|
| `Airtable prod-bas (app8uGPrVCVOm6LfD)` | Lottas skarpa data. Mekaniskt SPÄRRAD för agenter sedan TASK-419 (scripts/deny-prod-`airtable`.sh) — huvudsessionen släpps igenom mot prod via claude.ai-connectorn (Marcus beslut), subagenter aldrig. | Marcus manuellt, via claude.ai-connectorn (huvudsession) eller schema-skript under explic… | nej | `underlag/j1e-externa-installningar-och-deployvagar.md` |
| `Airtable staging-bas (apphjj8Q7lkXCMsL4)` | Isolerad testdata + fixturer (ADR-050). Delas mellan CI, lokala körningar och demoläget (ADR-132). | ci-suite.yml, nightly.yml, lokala seed/purge-skript, demoläget | nej | `underlag/j1e-externa-installningar-och-deployvagar.md, underlag/j8-4-staging-och-e2e.md` |

### Föräldralösa filer (1)

En fil som ingenting längre anropar, importerar eller kör.

| Sökväg | Syfte | Anropas av | Blockerar merge | Källa |
|---|---|---|---|---|
| `scripts/verify-phase-1.ts` | Runtime-verifiering av Fas 1 (schema-parsning, fetchWithRetry, alertScreenReader) — en arkiverad bevis-artefakt för ett redan stängt beslut |  | nej | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` |

## Föräldralösa och döda delar

**Begrepp för den oteknisk läsaren:** en "föräldralös" fil är en fil som
finns kvar i repot men som ingen annan fil längre anropar, importerar eller
kör — den gör ingen skada, men den kostar underhåll (måste läsas, förstås,
och riskerar att bli felaktig utan att någon märker det) utan att ge något
tillbaka.

| Vad | Typ | Var det hittades | Status |
|---|---|---|---|
| `scripts/verify-phase-1.ts` | Föräldralös FIL (173 rader) | `underlag/j1c-ci-wirade-skript-och-policyfiler.md` § 4.8 | Nämns bara av `ADR-005`, `ADR-006` och `docs/BUILD-LOG.md` som redan utfört bevis för ett stängt beslut (Fas 1). Ingen `package.json`-post, inget workflow, inget annat skript kör den. Rekommendation (J1c): arkivera/radera medvetet med en pekare till var beviset numera bor. |
| `needs.changed.outputs.ui_low_risk` | Föräldralös UTDATA (beräknas men styr inget) | `underlag/j1a-ci-yml-och-ci-suite.md` § 3 (`changed`-jobbet) | D1-klassningen (ren UI/CSS-yta) beräknas fortfarande varje körning, men har NOLL konsumenter sedan `suite`-jobbet skickar `run_staging:false` OVILLKORLIGT till `ci-suite.yml`. Filen kallar detta öppet — inte en bugg, ett medvetet kvarlämnat spår (`ADR-077` § Beslut 1 äger klassrymden; beslutet att riva eller bevara den är inte fattat). |
| `needs.changed.outputs.acceptance_local` | Föräldralös UTDATA (samma öde som ovan) | Samma källa | Samma mekanism och samma öppna beslut som `ui_low_risk`. |
| `scripts/katalogagarskap-markor.sh` / `scripts/katalogagarskap-slapp.sh` | Inte föräldralösa, men **helt otestade** | `underlag/j1d-lokala-hookar-och-agentmekanismer.md` § 1 | De två enda `SessionStart`/`SessionEnd`-hookarna i repot utan egen testsvit, trots att deras syskonskript (`deny-frammande-huvudkatalog.sh`, som LÄSER samma ägarlapp) har 55 testfall. En regression i hur ägarlappen skrivs/släpps skulle bara upptäckas i skarp drift. |
| `.github/CODEOWNERS` | Inte föräldralös, men **utan mekanisk effekt i praktiken** | `underlag/j1b-ovriga-workflows-och-github-katalogen.md` § CODEOWNERS, `underlag/j1e` | Fyra rader som alla pekar ut Marcus som ägare — eftersom `main-skydd`-rulesetet kräver 0 godkännanden (`required_approving_review_count: 0`, verifierat live) har filen i praktiken noll urskiljande effekt. Skulle bara göra skillnad om fler bidragsgivare fanns OCH rulesetet krävde kodägar-godkännande. |
| `Vale.Spelling` / vissa `.lycheeignore`-poster | Inte föräldralösa — men **bytt roll utan att namnet ändrats** | `underlag/j1f-test-bygg-och-lintkonfiguration.md` § 5 | `.lycheeignore` bytte 2026-07-28 (ADR-082) från "grind-tystare" (varje rad tog bort en PR-blockerare) till "brusfilter för nattrapporten" (externa länkar blockerar inte längre PR:er alls). Filnamnet och formatet är oförändrat — bara ROLLEN skiftade, vilket gör den lätt att misstolka som fortfarande PR-blockerande. |

**Sidofynd, inte en egen post men värt att notera här:** `check-listparitet.sh`
(en av grindvakterna) vaktar STRUKTUR (finns samma MÄNGD grindnamn på båda
sidor av ett speglat par, t.ex. `check-docs.sh` mot `ci.yml`s docs-grindar)
men inte INNEHÅLL (är värdet i respektive lista detsamma). Det är alltså en
grind som skulle missa en tyst innehålls-drift även om den fångar en
mängd-drift — dokumenterat öppet i `underlag/j1c` § Risker, inte ett dolt
hål.

## Komponenttabell (uppdragets format, de ~30 viktigaste komponenterna)

Detta är en ANNAN tabell än kategori-tabellerna ovan — den följer uppdragets
egen mall (`Komponent · Funktion i dag · Problem den löser · Trigger ·
Beroenden · Unik signal · Merge-blockerande · Risk · Evidens ·
Rekommendation`) och lyfter fram de komponenter som antingen bär den
mekaniska tyngden (aggregatorn, rulesetet) eller den STÖRSTA risken (nattnätets
larm, den delade staging-miljön). Den är handplockad, inte genererad, eftersom
uppdragets kolumner (`Problem den löser`, `Unik signal`, `Risk`,
`Rekommendation`) inte är JSON-fält i `01-inventering.json` — se § Hur
inventeringen läses.

| Komponent | Funktion i dag | Problem den löser | Trigger | Beroenden | Unik signal | Merge-blockerande | Risk | Evidens | Rekommendation |
|---|---|---|---|---|---|---|---|---|---|
| `ci.yml` / `changed` | Klassar diffen (D0/docs/D1/acceptance) + merge-dedup | Onödig full testkörning på trivial diff | Varje push/PR/merge_group | `tj-actions/changed-files` | `should_skip_tests`/`dedup_hit`-outputs | Indirekt (styr vad `suite` kör) | Låg — fail-closed på alla fyra klassningar | `j1a` §3-§4 | Behåll |
| `ci.yml` / `lint` | 35 steg: Biome, tsc, actionlint, yamllint, 17 `check-*`-grindar, 63 gatekeeper-testsviter, shellcheck-strict | Kodkvalitet + repots egna styrande-dokument-invarianter | Alla tre events, ovillkorligt | npm, tre pinnade binärer | Enda jobbet där flertalet interna grindar körs | Ja | Låg — timeout höjt två gånger efter mätt npm-latens | `j1a` §3 | Behåll |
| `ci.yml` / `audit` | `audit-ci` med allowlist + fail-soft-degradering | Supply-chain-sårbarheter | Alla tre events, ovillkorligt | npm-registrets advisory-endpoint (extern) | Enda källan till sårbarhetssignal på PR-ytan | Ja | **Medel/Hög** — TVÅ öppna high-advisories mätt 2026-09-17 (`sharp`, `smol-toml`), degraderingen gäller aldrig på ett rent `push` | `j1a` §3, `j1f` §6 | Åtgärda advisoryerna enligt ADR-028s flöde |
| `ci.yml` / `suite` (+ `ci-suite.yml`) | Delegerar till den delade sviten, tvingar `run_staging:false`/`run_a11y:false` | En testsvit-källa delad av tre workflower | `changed` grön + ej D0/dedup | `ci-suite.yml` | Enda vägen in till de åtta tunga jobben | Ja | **Hög** — 4 av 8 jobb (inkl. den enda staging- och a11y-kontrollen) körs ALDRIG på PR/kö-ytan | `j1a` §3, §7 | Ingen ändring — avvägningen är medvetet mätt (ADR-077), se post-merge-raden nedan för dess baksida |
| `ci.yml` / `docs` | lychee (`--offline`), markdownlint, Vale, Vale-regressionssvit | Dokumentations-/länkintegritet | `docs_changed` | lychee/markdownlint/Vale-binärer | Enda platsen intern länkintegritet mäts på PR-ytan | Ja (när den körs) | Låg | `j1a` §3 | Behåll |
| `ci.yml` / `review-backstopp` | Mekaniskt fäller `merge_group` utan giltigt granskningsutlåtande | Osann/saknad review-grind (ADR-105) | `merge_group`, ej D0 | PR-kroppens Riskbedömnings-sektion | Enda mekaniska bevis att en granskning ägt rum | Ja, i kön | Medel — bevisar bara NÄRVARO av sektionen, inte att granskningen var korrekt (medveten gräns, ADR-105 beslut 2) | `j1a` §3, `j1c` §4.1 | Behåll, känd gräns bokförd |
| `ci.yml` / `ci-passed` | Aggregerar sex `needs`-resultat, `if:always()`, fail-closed på failure/cancelled | Fail-open-hålet från S77 (2026-07-23) | Alla tre events | Alla sex syskonjobb | Den EXAKTA signalen GitHub-rulesetet läser | **Ja — DETTA ÄR grinden** | Låg i sig, men INGEN mekanism skyddar mot att ett framtida sjunde jobb glöms i `needs`-listan | `j1a` §5 | Överväg en periodisk sanity-check av `needs`-listans fullständighet |
| `ci-suite.yml` / `test-staging` (+ `purge`, `purge-efter`) | Enda platsen som når skarp Airtable/Supabase-staging | Bevisar att kedjan hänger ihop | `run_staging` (aldrig sant på PR/kö) | Global mutex, delad Airtable-bas | Enda äkta staging-kontrollen | Endast via post-merge/natt | **Hög** — 28 % av alla post-merge-körningar i ett 211-körnings-sampel var röda/avbrutna, samtliga i EXAKT detta jobb | `j1a` §6, `j8-4` | Bygg motmedel mot L599-fältvärdedriften (se raden nedan) |
| `ci-suite.yml` / `acceptance` (+ `acceptance-sjalvtest`) | Hermetisk Playwright-svit, sharding 1–3, ADR-080-hermetikbevis | Bevisar appens beteende utan staging-beroende | Alltid (när `suite` körs) | MSW-fixturvärld | Kritiska vägen på PR-ytan (404–461 s) | Ja | **Medel** — vuxit 18→61 filer/164→524 tester sedan augusti, orsakade redan två kö-fällningar (PR #2209); en levande FROZEN_NOW-läcka bevisad live i denna granskning (J7) | `j1c` §4.1, `j7` | Sätt ett medvetet tak eller ägarskap för klassens tillväxt |
| `post-merge.yml` / `larm` | Skapar/kommenterar GitHub-ärende (`ci-post-merge`) vid rött, med revert-förslag | Säkerställer att rött på `main` inte blir tyst | Rött/cancelled i needs | `gh issue`, attribution-skript | Enda kanalen som larmar EFTER merge | Nej (körs efter merge) | **Hög** — mätt: 16 ärenden stod obesvarade 10–11 DYGN innan de stängdes i en klump 2026-09-17 (under förberedelserna för denna granskning) | `j8-4`, stickprov S18 | Ge larmet en mekanisk eskaleringsväg (t.ex. i `heartbeat-svep.sh`), inte bara ett GitHub-ärende |
| `post-merge.yml` (täckningsluckan) | Klassar bara TOPPEN av en push | Undviker dubbelkörning på rena docs-landningar | `push: main` | `scripts/classify-post-merge.sh` | Ärver `ci.yml`s klassning, räknar aldrig om | Nej | **Hög, mekanismen nu fastställd (stickprov S18):** merge-kön kan landa flera PR:er i EN push; bara toppens commit klassas. 85 av 686 landningar (12,4 %) saknade post-merge-körning i ett mätfönster; 55 var kod-PR:er vars nästa landning var en docs-PR | `stickprov` S18 | Klassa HELA det pushade spannet, inte bara toppen (liten, reversibel ändring — se S18) |
| `nightly.yml` / `alarm` | Skapar `ci-natt`-ärende vid rött, UTAN dedup | Enda åskådaren natten har | Rött/cancelled i needs | `gh issue` | Ingen — skapar nytt ärende VARJE gång | Nej | **Hög** — 51 av 52 nätter röda sedan 2026-07-28; 21 öppna, obesvarade ärenden i rad | `j1b`, stickprov S7, S12 | Lägg samma dedup-mönster som `check-nattvakt-dedup.sh` redan har på syskonkanalen |
| `nightly.yml` (rödhetens verkliga orsak) | — | — | — | Tre processgrindar (Backlog-stängning, Sessionsdok-fönster, Sannings-avstämning) | Nätet är rött av PROCESSGRINDAR, inte av testsviten (testsviten grön t.o.m. 2026-09-16) | — | Medel — en äkta testregression (2026-09-17) föll in i ett larm som redan varit rött i 50 dygn av andra skäl | Stickprov S12, S15 | Verkställ `ADR-131`s brytdag för `check-backlog-closure.sh`, eller lyft grinden ur nattnätets rött/grönt tills dess |
| `nightly-watchdog.yml` / `watch` | Kontrollerar att natten alls startade, MED egen dedup | Täcker `startup_failure`/uteblivet schema | schedule 12:00 | `gh run list`, egen policy | Enda kanalen med korrekt dedup i denna familj | Nej | Låg — fungerar som avsett, tyst när huvudlarmet redan täcker | `j1b` | Behåll som mönster-förebild för `nightly.yml`s eget `alarm` |
| GitHub ruleset `main-skydd` | Enda mekaniska grinden: 0 approvals, en required check, merge queue | Solo-repo utan klassisk branch protection | Varje push/PR/merge_group mot `main` | GitHub Actions-appen (id 15368) | Den bäst mekaniserade, mest drift-fria delen av hela arkitekturen | Ja | Låg — noll drift mätt sedan 2026-08-05 | `j1a` §Metod, `j1e`, stickprov S5 | Lås även repo-nivåns `allow_squash_merge`/`allow_rebase_merge` till `false` för konsekvens |
| `scripts/review-backstopp.mjs` + `.review-policy.json`/`.review-loop-policy.json` | Mekanisk spärr för review-grinden i kön (ADR-105) | Ett granskningsutlåtande som aldrig krävdes mekaniskt | `merge_group` | PR-kroppens sektion, `gh pr view` | Enda grinden som prövar en LEVANDE GitHub-resurs | Ja | Hög om missförstådd — bevisar närvaro, inte att granskningen ÄGDE RUM (öppet dokumenterat) | `j1c` §7 | Behåll, håll gränsen synlig för läsare |
| `scripts/check-permissions-claims.sh` (ADR-083) | Fäller prosa som påstår en `permissions.*`-mekanism som inte finns | Textdrift om mekanismer | `lint`-jobbet | grep av styrande docs+settings | Fyrar noll gånger när prosan har rätt | Ja | Medel — täcker bara `permissions.deny/ask`-påståenden, INTE påståenden om en PreToolUse-hooks frånvaro/närvaro (mätt lucka: `deny-askuserquestion.sh` motsäger `~/.claude/CLAUDE.md` utan att grinden ser det) | `j1d` §1c, §Risker | Överväg att utöka grinden till hook-baserade frånvaro-påståenden |
| `scripts/verify-ci-parity.mjs` + `.ci-parity-policy.json` | Lokal spegel av RESTEN av grindarna, härlett ur YAML, ALDRIG en CI-gate | "Verifierat innan push"-behov utan en fjärde handkopierad lista | `npm run verify:ci-parity[:fast]` | `js-yaml`, `micromatch` | Preflight fäller exit 2 vid jobb-/inputdrift | Nej (diagnosverktyg, ADR-036) | Låg om använd rätt — 910 s fullt läge mot CI:s 401 s, ~30× kostnad om körd rutinmässigt | `j1c` §1 | Behåll som diagnosverktyg, gör ALDRIG obligatorisk |
| `scripts/check-docs.sh` | Lokal spegel av 14 dokumentationsgrindar, ALDRIG körd av CI | Missad grind vid manuell verifiering (S91) | `npm run check:docs` | 9 `check-*.sh` + tre externa verktyg | Tri-state PASSED/SKIPPED/FAILED, härledd räkning | Nej | Låg | `j1c` §1 | Behåll, medvetet ej CI-wirad |
| `scripts/purge-staging-sentinels.mjs` + `.purge-staging-policy.json` | Städar sentinel-rader i staging (ADR-060), fyra skyddsräcken | Delad, muterbar testdata mellan CI-körningar | `npm run purge:staging`, `ci-suite.yml purge/purge-efter` | Airtable staging-token | Enda platsen som städar per-körning OCH åldersbaserat | Endast via post-merge/natt | **Hög på EN specifik kant:** idempotent för HELA RADER, men skyddar INTE mutation av FÄLTVÄRDEN på en permanent, aldrig-raderad rad — L599, bevisad TRE gånger | `j1c` §4.1, `j8-4` §8.4.2-8.4.3 | Bygg motmedel (a) ur lessons-posten L599 — högst kostnadseffektiva åtgärden i hela granskningen |
| `scripts/staging-semaphore.sh` + global mutex `staging-tests` | Serialiserar ALLA staging-rörande körningar (lokala + post-merge + natt + demoläge) | Två körningar skriver till samma delade backend samtidigt | Varje staging-anrop, lokalt och i CI | `.staging-semaphore-policy.conf`, `/tmp/mm-staging-semaphore.lock` | Enda mutexen som är GEMENSAM för lokalt och CI | Nej (infrastruktur, inte en gate) | Medel — löser SAMTIDIGHET, löser INTE fältvärde-mutation (se raden ovan) | `j8-4` §Samtidighetsmatrisen | Behåll |
| `scripts/fas4-prod-deploy.sh` + `.prod-ref-policy.conf` | Fail-closed EF-deploy-sekvens mot prod | Tre mätta handkörnings-fel (hängande `link`, fel projekt, glömd återlänkning) | Marcus manuellt, `--deploya` ALDRIG via `!`-prefix | `.supabase-cli-policy.conf`, allowlist | EXIT-trap återlänkar staging även vid fel | Nej (prod-deploy, ej PR-CI) | Hög OM körd i fel kanal — mätt SIGKILL-risk via `!`-prefixet (2026-08-28) | `CLAUDE.md` §Prod-EF-deploy, `j1c` §4.4 | Behåll, disciplinen om eget terminalfönster är kritisk |
| `scripts/deny-prod-ref.sh` / `scripts/deny-prod-airtable.sh` | Mekaniskt lås mot agent-kommandon mot prod (Supabase/Airtable) | Ett agent-anrop nådde prod-basen skarpt (TASK-419) | Varje Bash/MCP-anrop | Prod-ID i configen | Substräng-matchning oavsett subkommando | Nej (hook, inte CI) | Medel — `!`-prefixet (Marcus egen kanal) passerar BÅDA hookarna, mätt två gånger (L588); skarpbeviset för `deny-prod-airtable.sh` är öppen skuld | `j1d` §1, §1a | Betala skarpbevis-skulden; håll `!`-kant-medvetenheten vid liv |
| `scripts/deny-frammande-huvudkatalog.sh` | Ägarskaps-regeln som mekanism (ADR-090), störst hook i `scripts/` (1200 rader) | Prosa-regel bruten tre gånger i ETT pass | Varje Bash-git-anrop | `.katalogagarskap-policy.conf` | 55 testfall, en av bara TVÅ hookar som loggar sina fällningar | Nej (hook) | Låg | `j1d` §1, §4 | Behåll |
| `.githooks/pre-commit` | T121-självläkning, frontmatter-bump, staging-preflight-wiring-vakt | Absolut `core.hooksPath` pekade alla worktrees mot huvudkatalogens hook-kopia | `git commit`, alla vägar | `.frontmatter-policy.conf`, `.staging-preflight-hook-policy.conf` | Enda RIKTIGA git-hooken (körs oavsett Claude Code) | Nej | Låg — fail-open på allt utom ETT smalt, mätt villkor | `j1d` §2 | Behåll |
| `tests/support/fixturvarld/handlers.ts` (18 mock) + `tests/kontraktsvakt/` (7 bundna) | Hermetisk fixturvärld + kontraktsvakt som binder en delmängd mot verkligheten | "Hur vet vi att simuleringen fortfarande motsvarar de riktiga tjänsterna" | Varje hermetiskt test / natten (kontraktsvakt) | MSW, zod-schema | Enda mekaniska bindningen mellan mock och verklighet | Ja (indirekt, acceptance-klassen) | **Hög** — 11 av 18 mockar är HELT obundna; en av dem (`hamta-oppna-betalningar`) har en kommentar som SJÄLV säger "RUNTIME-beteendet är overifierat" | `j1f` §8, `j7`, stickprov S10 | Utöka kontraktsvakten till fler av de 11 obundna, prioriterat efter risk |
| Vercel-projektet (frontend-deploy) | Bygger `main` → Production, helt parallellt med GitHub Actions | Kontinuerlig frontend-leverans | Push (Vercels git-integration, ej CI) | `vercel.json` | Ingen GitHub-check alls | Nej (strukturellt omöjligt att blockera via GitHub) | **Hög** — `TASK-199` (öppen, High): prod-frontend stod stale ≥20h utan att NÅGON mekanism upptäckte det | `j1e` §1, §3a, stickprov S6/S8 | Bygg det verifikationskommando `TASK-199` redan efterfrågar (jämför senaste Production-deployens SHA mot `origin/main`) |
| Supabase staging-projekt + Airtable staging-bas (delad miljö) | Enda skarpa test-miljön, delad mellan CI, lokala körningar och demoläget (ADR-132) | Ett enda, verkligt beroende-nät att verifiera mot | Varje staging-berörande körning | Global mutex + semafor | Enda platsen en riktig auth-session/CORS/Airtable-formel möts | Endast via post-merge/natt | Se `test-staging`-raden ovan (L599) — samma risk, sedd från miljösidan | `j8-4` | Se rekommendationen på `purge-staging-sentinels.mjs`-raden |
| Edge Functions (Deno-koden, `supabase/functions/`) | Appens ENDA skrivväg mot Airtable/Postgres, kontrolleras via en Node-genväg | — | `tsc -b` (24 av 135 filer) | `tsconfig.edge-shared.json` | INGEN Deno-egen typkontroll/lintning NÅGONSTANS | Ja, för de 24 typkontrollerade filerna — 0 för resten | **Hög** — `ADR-010`s "Fas 7-åtagande" (`deno check`/`deno lint`) obetalt sedan 2026-05, bekräftat obetalt igen 2026-07-31 och ännu 2026-09-17 | `j1f` §3, stickprov S13 | Schemalägg `deno check`/`deno lint` NU eller skjut upp formellt med ett nytt datum — dagens läge är en tyst, växande skuld |
| `TypeScript 7.0.2` (kompilatorn) | Radikalt ny, nativt kompilerad TS-kompilator | — | `tsc -b`, alla typkontroller | — | En majorversion nästan ingen annan i branschen kör ännu | Ja (typfel fäller bygget) | Medel — inget ADR diskuterar valet, avviker från repots i övrigt konsekventa mönster att motivera varje icke-trivialt val | `j1f` §2 | Dokumentera valet explicit, eller en plan för att gå tillbaka till TS 5.x |

## Fullständighetsbeviset

Ett engångsskript (`node`, i scratch — inte committat, per agentkontraktets
regel om att bara skriva de två namngivna filerna) jämförde facit-listan
(steg 2 i § Metod: `git ls-files` mot sökvägslistan, 307 filer + 30 ADR:er =
337) mot JSON-filens `sokvag`-värden. Testkatalog-poster (vars `sokvag`
innehåller `*`) och genuint externa/plugin-poster undantas explicit från
disk-jämförelsen, av samma skäl som de aldrig kan förekomma i `git
ls-files` — de är antingen en sammanräkning över flera filer eller en
beskrivning av något som inte bor i detta repo.

**Slututdata, ordagrant:**

```text
=== FULLSTÄNDIGHETSBEVIS ===
Facit (disk, git ls-files inom scope): 337 filer
JSON-poster totalt: 367
  - poster som representerar enskilda disk-filer: 337
  - aggregerade testkatalog-poster (glob, ej disk-för-disk): 9
  - externa/plugin-poster (ej repo-filer): 21

(a) Disk-filer i scope som SAKNAS i inventeringen: 0

(b) Poster i inventeringen som INTE finns på disk: 0

=== RESULTAT: FULLSTÄNDIG — (a) och (b) är båda tomma ===
```

**JSON-validering** (`node -e "JSON.parse(require('fs').readFileSync(...))"`):
`JSON parsar OK`.

**En fälla på vägen, redovisad öppet i stället för tystad:** den första
körningen av beviset gav **två** falska positiva i (a):
`.github/CODEOWNERS` och `.github/dependabot.yml`. Orsaken var mitt eget
kontrollskripts fel, inte en lucka i inventeringen — jag hade kategoriserat
båda filerna som `extern-github-installning` (eftersom de KONFIGURERAR ett
externt beteende: kodägarskap respektive Dependabot) och lät
kontrollskriptet undanta HELA den kategorin från disk-jämförelsen. Men båda
filerna bor FYSISKT i repot och ska alltså räknas mot facit. Jag rättade
kontrollskriptets logik (en fil räknas som disk-fil om den finns i facit-
listan, oavsett kategori — kategorin styr bara PRESENTATIONEN, inte
räkningen) och körde om. Detta är precis den typ av mät-fel `CLAUDE.md` §
Instruktioner ber om att inte tysta: skriv om till att JUSTERA VERKTYGET,
inte till att gömma avvikelsen.

## Vad jag inte kunde belägga

- **`supabase/config.toml`s exakta innehåll** (portar, `project_id`) är
  **osäker** — inget av våg 1:s sex kärnunderlag läste filen rad för rad;
  den nämns bara i förbigående. Dess ROLL (Supabase CLI:ts lokala
  projektkonfiguration) är väletablerad plattformskunskap, men den
  SPECIFIKA konfigurationen i detta repo är overifierad i denna granskning.
  **Vad som krävs för att fylla luckan:** en riktad läsning av filen (18
  rader enligt en snabb titt, ej djupt granskad) i ett kommande pass.
- **Om samtliga 44 policy-filer verkligen har EXAKT en konsument** utöver
  de två dokumenterade undantagen (`.mutation-hemvist-policy.conf`,
  `.staging-preflight-hook-policy.conf`) är `verifierad` för de tio par
  `underlag/j1c` stickprovade, men `starkt indikerad` för resten (34 par)
  — jag har inte själv läst källkoden för alla 44, bara ärvt `j1c`s
  stickprov och dess uttalade slutsats ("samtliga 44 filers filhuvuden
  lästa").
- **Om `docs/decisions/ADR-063` och `ADR-129` (två av de 30 ADR:erna jag
  räknat in) hör hemma i just DENNA ytas kärna eller är gränsfall** — jag
  inkluderade dem eftersom de citeras av `j1c`/`j1e` som bakgrund för
  varför testbarhet kostar (ADR-063) respektive varifrån Vault-hemligheters
  namn är låsta (ADR-129), men ingen av dem är en CI-GRINDVAKTS-ADR i
  samma bemärkelse som t.ex. `ADR-076`. Markerat **osäker** som
  gränsdragning, inte som faktafel.
- **Radantal och exakt testfall-antal för de 75 testsviterna var för sig**
  — jag har citerat de tal `underlag/j1c` och `CLAUDE.md` §
  Review-grinden redan räknat (t.ex. 103 fall för `test-review-loop.mjs`),
  men har inte kört om varje enskild svit för att återmäta. **Starkt
  indikerad**, inte omätt av mig i detta pass.
- **Om alla nio Bash-matchade `PreToolUse`-hookar (§ lokal-hook-tabellen)
  verkligen kan kringgås av `!`-prefixet** — `L588` mäter det för TVÅ
  specifika hookar; generaliseringen till samtliga nio är `j1d`s egen
  bedömning, märkt **starkt indikerad**, inte var och en enskilt
  provocerad.

## Rekommendationer

*Markerat som rekommendation, inte beslut — Marcus och orkestreraren väger
detta mot resten av granskningens leverabler.*

1. **Håll de två filerna i synk med samma disciplin som byggde dem:** nästa
   ändring av CI-/grindvaktsytan (ett nytt skript, en ny policy-fil, ett
   nytt workflow-jobb) bör uppdatera BÅDA filerna i samma commit, och
   fullständighetsbevisets skript (principen, om inte den exakta
   scratch-koden) bör köras om innan inventeringen kallas aktuell igen.
   Annars drabbas den av EXAKT den felklass denna gransknings egna
   stickprov hittade fem gånger i styrande text (S4, S10, S16, S17, S18):
   sant när det skrevs, tyst falskt genom tillväxt.
2. **Läs `supabase/config.toml` i ett kommande pass** för att stänga den
   enda genuina täckningsluckan i denna inventering.
3. **Använd komponenttabellen (de 30 viktigaste) som ingångspunkt för
   åtgärdsplanen** (leverabel 11) — den samlar redan de rader där risken
   är `Hög`, med sin evidenspekare till rätt underlag.

## Rapport till orkestreraren

- **Modell:** se nästa rad i mitt eget svar till orkestreraren (returneras
  utanför denna fil, per agentkontraktets format).
- **Gren:** `docs/s126-ci-djupgranskning`, i worktreen
  `s126-ci-djupgranskning`.
- **Ögonblicksbild:** `origin/main` `eeca8c72` (2026-09-08) för allt
  kodinnehåll som citeras; externa mätningar (GitHub/Vercel/Supabase) är
  ärvda från våg 1:s underlag, som mätte live 2026-09-17.

## Källor

**Underlag (våg 1, lästa i sin helhet):**

- `underlag/j1a-ci-yml-och-ci-suite.md`
- `underlag/j1b-ovriga-workflows-och-github-katalogen.md`
- `underlag/j1c-ci-wirade-skript-och-policyfiler.md`
- `underlag/j1d-lokala-hookar-och-agentmekanismer.md`
- `underlag/j1e-externa-installningar-och-deployvagar.md`
- `underlag/j1f-test-bygg-och-lintkonfiguration.md`
- `07-hermetiska-tester-kontra-realistisk-e2e.md`
- `underlag/j8-4-staging-och-e2e.md`
- `underlag/01-orkestrerarens-stickprov.md`
- `underlag/00-agentkontrakt.md`

**Egna kommandon körda i detta pass (2026-09-17, i worktreen
`s126-ci-djupgranskning`):**

```text
git ls-files -- '.github/**' 'scripts/**' '.githooks/**' '.claude/settings.json' \
  '.claude/agents/**' '.*-policy.conf' '.*-policy.json' '.*allowlist.conf' \
  'playwright.config.ts' 'vite.config.ts' 'biome.json' 'tsconfig*.json' \
  'tsr.config.json' 'audit-ci.jsonc' '.lycheeignore' '.vale.ini' '.vale/**' \
  '.markdownlint-cli2.jsonc' '.yamllint.yml' '.editorconfig' '.nvmrc' \
  'vercel.json' 'package.json' 'tests/global-setup.ts' 'tests/global-teardown.ts' \
  'tests/support/**' 'tests/fixtures/**' 'tests/kontraktsvakt/**' \
  'supabase/config.toml' 'CLAUDE.md' 'CONTRIBUTING.md' \
  'docs/reference/staging-verifiering-runbook.md' \
  'docs/reference/prod-driftsattning-runbook.md' \
  'docs/reference/prod-driftsattning-betalningsflodet-runbook.md'
  → 307 filer

git ls-files -- 'docs/decisions/ADR-010-*' … (30 namngivna ADR-mönster)
  → 30 filer, samtliga träffade

node build-inventory.mjs        # bygger 01-inventering.json (367 poster)
node completeness-check.mjs     # fullständighetsbeviset ovan
node build-markdown-tables.mjs  # genererar kategori-tabellerna ur samma JSON
```
