---
id: TASK-334
title: >-
  Fynd: post-merge.yml:s Ärvd klassning hoppar staging-verifieringen på VARJE
  docs-only-landning — döljer ett känt rött i tre dagar (2026-08-27→2026-08-28)
status: To Do
assignee: []
created_date: '2026-08-28 03:50'
updated_date: '2026-08-28 04:50'
labels:
  - fynd
  - ready-for-agent
dependencies: []
modified_files:
  - scripts/post-merge-attribution.sh
  - scripts/test-post-merge-attribution.sh
  - .github/workflows/post-merge.yml
  - .github/workflows/ci.yml
  - docs/decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md
  - CONTRIBUTING.md
ordinal: 605000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Uppdragets ursprungliga hypotes ('concurrency-avbrott när nästa commit landar sekunder senare') PRÖVAD och FALSIFIERAD (ADR-086 premiss-pass, 2026-08-28): gh run view 33137040114/33138604694 --json jobs visar jobbet 'Verifierande svit på det mergade trädet' som skipped, INTE cancelled, och de två merge-commiten (7a0a2a46 kl 02:48:54Z, 10ae24f3 kl 03:20:36Z) ligger 32 min isär — inte sekunder. Den FAKTISKA, verifierade mekanismen (gh run view --log, jobbet 'Ärvd klassning'): 'docs_only=true — Test suite skippades i merge_group-körning 33136831515 ⇒ ci.yml klassade det landade trädet D0 (docs-only) — inget att skydda, sviten hoppas.' — scripts/classify-post-merge.sh (TASK-73, ADR-077) ÄRVER medvetet PR-grindens klassning av DENNA PR:s EGEN diff, räknar aldrig om. Konsekvensen: PR #2025 (fix/task-309-27-fetstil, icke-docs-only) körde full svit och FÅNGADE rätt — Staging (API+E2E) = failure, och 'Larm vid rött post-merge' körde och lyckades (run 33095380581). Men VARJE efterföljande docs-only PR:s post-merge-körning (#2029, #2030, #2033 — allihop 'success' på workflow-nivå) ärver bara 'inget nytt att skydda', och re-verifierar ALDRIG det redan trasiga trädet. Den underliggande get-document-sources.staging.test.ts-röda förblev därmed osynlig i tre dagar tills denna diagnos, trots att larmet faktiskt hade fyrat en gång. Mekanismen är EXAKT som ADR-077 designade den (ärvd klassning av PR:ens EGEN diff, inte av trädets aktuella hälsa) — frågan är om det är rätt kontrakt för en signal (post-merge/nattvakt) vars HELA syfte är att fånga sådant PR-grinden inte kan se (t.ex. Airtable-datadrift). Källor citerade: gh run list --workflow post-merge.yml, gh run view <id> --json jobs, gh run view <id> --log.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Marcus/orkestreraren beslutar om ärvd-klassnings-kontraktet ska ändras för post-merge (t.ex. alltid köra Staging oavsett docs_only, eller ett separat larm som eskalerar om senaste ICKE-skippade körning var röd) eller om nuvarande beteende accepteras som avsett tradeoff
- [x] #2 Om ändring: en skiva myntas under lämpligt ADR (ADR-077 tillägg) som dokumenterar det nya kontraktet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Premiss-pass (ADR-086) — utfall

Prövade premisser ur uppdraget, med kommandot som avgjorde:

- `post-merge.yml` klassar via `scripts/classify-post-merge.sh` — **STÄMMER**
  (post-merge.yml, jobbet `klassning`, steget `Ärv ci.yml:s klassning`).
- `7a0a2a46` och `10ae24f3` hade sviten hoppad — **STÄMMER**
  (`gh run view 33137040114/33138604694 --json jobs`:
  `Verifierande svit på det mergade trädet => skipped`).
- Larm `#2043` på körning `33139629247` — **STÄMMER**, och texten är verifierad
  ordagrant i ärendets kropp: "Föregående post-merge-körning var **GRÖN** ⇒ den
  här landningen är den primära misstänkta."
- **DIVERGENS 1:** uppdraget/kortet säger "döljer ett känt rött i **tre
  dagar**". Mätt är ~11 timmar för det aktuella röda: nattkörning
  `33065848810` (2026-08-27T11:05Z) hade `Nattlig fullsvit / Staging (API +
  E2E) => success`, och första röda post-merge-körningen samma dag var
  `33090950465` (16:00Z). Kortets egen titel säger också
  "2026-08-27→2026-08-28", alltså ~1 dygn — inte tre. Talet är inte
  bärande för beslutet, men rapporteras hellre än tystas.
- **DIVERGENS 2:** uppdraget beskriver larmet som fyrande på "nästa landning i
  KODKLASS". Mätt: `#2043`:s landning var PR `#2035` från grenen
  `docs/s112-arkivering-s93-95` — alltså en DOCS-gren vars kö-körning ändå
  klassade kod (arkiverings-flytten rörde mer än allowlisten). Mekanismen är
  densamma; klass-etiketten i uppdraget stämmer inte.
- **DIVERGENS 3 (fynd, utanför scope):** larmet fyrade **två** gånger med
  samma falska mening inom 13 minuter — `#2043` (körning `33139629247`) och
  `#2047` (körning `33140227702`). Uppdraget nämnde bara den första.

## Options-rymden — vad som prövades och varför

Frågan: post-merge ÄRVER PR-grindens D0-beslut och hoppar sviten på varje
docs-only-landning. Är det rätt kontrakt för ett lager vars syfte är att fånga
sådant PR-grinden inte kan se?

| Väg | Utfall | Mätt skäl |
|---|---|---|
| **A** — kör alltid staging oavsett klass | FÖRKASTAD | Återinför TASK-73:s mätta defekt: merge `ed51b95` (8 rader i EN `.md`) tog den globala `staging-tests`-mutexen i körning `30393323548`; revert-PR `#375` låg `pending` bakom den, `ci-wait.sh` timade ut efter 900 s, revert-vägen mätte 25 min 16 s. Med ~15 landningar/dygn är kostnaden inte marginell. |
| **B** — tidsbaserad drift-vakt (kör om > N h sedan senaste faktiska mätning) | FLAGGAD, EJ BYGGD — **öppen Marcus-fråga** | Uppdragets villkor var "D om nattnätet inte redan täcker, annars C". **Nattnätet TÄCKER:** `nightly.yml` (cron `0 3 * * *`, Europe/Stockholm) anropar `ci-suite.yml` UTAN `with:`-block och får defaulten `run_staging: true`; verifierat grönt i körning `33065848810`. B är alltså en KADENS-fråga (≤24 h → ≤N h), inte ett hål. Priset: en TREDJE daglig tagning av den globala `staging-tests`-mutexen, mot ett jobb som ligger ~6-7 min under ett `timeout-minutes: 12`-tak (≈1,8× marginal) och som skarpt slagit i taket tre gånger 2026-08-07. |
| **C** — rätta larmets ATTRIBUTION | **VALD OCH BYGGD** | Se nedan. |
| **D** — B + C | DELVIS (C byggd) | Villkoret för D föll på mätningen ovan. |

**Två kadens-caveats som Marcus bör känna till innan B avfärdas helt** (mätta,
utanför scope):

1. Nattnätets schema är best-effort. `nightly.yml` rad 23-28 bokför ~3 h uppmätt
   eftersläp, och i mätfönstret fanns **ingen nattkörning alls för 2026-08-28**
   (senaste var 2026-08-27T11:05Z, ~9 h efter nominell cron).
2. Nattnätet har varit `failure` på workflow-nivå **12 nätter i rad**
   (2026-08-16→2026-08-27), men rödheten kom från andra jobb
   (`Länkkontroll`, `Backlog-stängning`, `Kontraktsvakt`, `Sessionsdok-fönstret`,
   `Sannings-avstämning`) — `Nattlig fullsvit / Staging (API + E2E)` var GRÖN
   2026-08-27. Staging-signalen är alltså intakt men ligger begravd i ett
   ärende som stängts varje natt.

## Vad som byggdes (C)

`scripts/post-merge-attribution.sh` ersätter larm-jobbets inline-steg (b).
Den går bakåt i post-merge-körningarna på `main` till den senaste som FAKTISKT
körde sviten, räknar landningarna däremellan och formulerar därefter:

- ankare grönt + noll omätta däremellan → "primär misstänkt" (sant, behålls)
- ankare grönt + k > 0 omätta däremellan → NEKAR primär misstanke, anger
  spannet `git log --oneline <ankare>..<denna>` och listar de hoppade träden
- ankare rött → "felet är äldre", nu förankrat i en körning som faktiskt mätte
- API-fel / saknad env / ingen mätning i fönstret → **OKÄND**, aldrig ett
  påstående byggt på frånvaro av data

Signalen är densamma som `classify-post-merge.sh` läser på ci.yml-sidan: ett
SKIPPAT reusable-anrop rapporteras som ETT jobb med anropets egna namn, ett
KÖRT expanderas till inner-jobb prefixade `"<namn> / "`. Verifierat binärt utan
undantag över elva skarpa post-merge-körningar 2026-08-28.

**Fixad på köpet:** körningslistan skärs nu vid EGEN körnings index i stället
för att bara filtrera bort den. Den gamla formen
(`[.[] | select(.databaseId != RUN_ID)][0]`) kunde plocka en NYARE körning som
en parallell landning lagt ovanför oss och kalla den "föregående".

**Medveten avvikelse från `classify-post-merge.sh`:** skriptet returnerar
ALLTID 0. Det körs INNE i larm-steget (`set -euo pipefail`), så en exitkod
skild från noll hade dödat själva ärendet — tystnad i exakt det läge signalen
behövs. Ett ärende med "OKÄND" slår inget ärende alls.

**Två nya failure-ytor, öppet bokförda:** larm-jobbet gör nu en `checkout` (det
gjorde ingen förut), och behöver `actions: read` även för `gh run view`
(grantet fanns redan).

## Grindar och tvåsidigt bevis

`scripts/test-post-merge-attribution.sh` — 47 hävdanden, hermetisk gh-stub,
CI-wirad i `ci.yml`:s lint-jobb. Lokalt: **47 passerade, 0 failade** (exit 0).

Tre av hävdandena är kopplings-/wiringsvakter: A11 (skriptets
`POST_MERGE_SUITE_JOB_NAME` == post-merge.yml:s svit-jobbnamn), A12 (workflowen
anropar skriptet), A13 (ADR-083-vakten: den falska meningen får inte återinföras
hårdkodad i YAML).

Tvåsidigheten är MÄTT mot fem muterade kopior, inte antagen:

| Mutant | Utfall |
|---|---|
| M0 omuterad kontroll | 47/0 grön |
| M1 listan filtreras i stället för att skäras vid eget index | **3 fällda** (A9) |
| M2 kopplingsdrift i svit-jobbnamnet | **14 fällda** (A11 + 13 innehållsfall) |
| M3 den falska meningen återinförd i post-merge.yml | **1 fälld** (A13) |
| M4 anropet borttaget ur post-merge.yml | **1 fälld** (A12) |
| M5 gamla logiken återskapad (grönt ankare ⇒ ovillkorlig primär misstanke) | **9 fällda** (A2 fäller med exakt den falska meningen) |

Övriga grindar, mätta exitkoder: `shellcheck --severity=style --enable=all` 0 ·
`actionlint -color -ignore 'unexpected key "queue"…'` 0 · `yamllint -c
.yamllint.yml .github/workflows/` 0 · `npm run check:docs` 0 (14 gröna) ·
`scripts/test-classify-post-merge.sh` 0 (27/0, oförändrad) ·
`node scripts/check-langa-streck.mjs` 0.

## Vad som INTE ändrades

ADR-077 § Beslut 1 och 2 står orörda. Klassningen ärvs fortsatt, räknas
fortsatt aldrig om, och docs-landningar hoppar fortsatt sviten.
`scripts/classify-post-merge.sh` är inte rörd. `.ci-parity-policy.json` krävde
ingen ändring — paritetsvakten läser `ci.yml`/`ci-suite.yml`, inte
`post-merge.yml`, och ett nytt STEG i ett känt jobb plockas upp automatiskt
(policyfilens egen `_readme`); endast nya JOBB och nya `${{ }}`-uttryck fäller
fail-closed, och steget har inget av dem.

## Öppna punkter (STOPPA-punkter för Marcus)

1. **Option B — drift-vaktens kadens.** Byggd: nej. Beslutet kräver en
   avvägning mot staging-mutexen som är en arkitekturfråga, inte en följdändring
   av denna rättelse. Underlaget står i tabellen ovan och i ADR-077 § Updates.
2. **Nattnätet är rött 12 nätter i rad och ärendena stängs.** Utanför detta
   korts scope (ADR-053: blockerar ej + värdefullt → defer). Klassisk
   kyrkogårdseffekt; värd ett eget kort.
3. **`scripts/test-classify-post-merge.sh`:s filhuvud säger "21 testfall" medan
   sviten rapporterar 27 passerade.** Pre-existerande räknings-drift, inte
   införd här. Låg risk, men samma kopierings-drift-klass som `CLAUDE.md`
   varnar för.
<!-- SECTION:NOTES:END -->
