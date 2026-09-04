# ADR-077: Riskanpassad CI — klassning, dedup, nightly

- Status: Accepted
- Datum: 2026-07-23
- Fas: Meta (Session 79 — T85 våg 2a, ci.yml-trion)

> Denna ADR mintas vid trions FÖRSTA skiva (36.2 nattnätet) och bär hela den
> beslutade arkitekturen — klassning (36.3), dedup (36.4) och nattnät (36.2) —
> så att de efterföljande skivorna refererar en stabil record i stället för att
> kapplöpa om att skapa den sist. Varje skiva bär sin egen implementations- och
> kontrastbevis-trail på sitt backlog-kort; konsekvens-noteringar landar här när
> D1/dedup/visual byggs.

## Kontext

Varje ändring betalade samma CI-pris. En ren CSS-token-ändring drog hela sviten
inklusive den enda staging-mutexen (~10 min plus kötid), och efter merge kördes
IDENTISKT innehåll en gång till på main-push — samma mutex, samma tid. Trögheten
Marcus känner var alltså inte grindvakterna (33 s) utan ETT jobb genom EN global
mutex, körd två gånger per ändring.

Underlaget är designdoket från S77
([riskanpassad-ci-design-2026-07-23.md](../research/riskanpassad-ci-design-2026-07-23.md)),
framtaget på Marcus delegationsmandat och grundat i den externa
processgranskningen (Codex) plus Codes verifikation mot repo och API. EN punkt i
underlaget — cache-baserad merge-dedup — är riven och ersatt efter web-research
mot förstapartsdokumentation (se Beslut §2 nedan); rivningen är öppen, aldrig
tyst.

Google-modellen (presubmit/postsubmit) är precedenten: en snabb, riskanpassad
presubmit-svit är försvarbar ENDAST med ett post-submit-nät under sig. Utan nätet
blir varje presubmit-skipp ett permanent hål; med nätet blir det en fördröjning
på högst ett dygn. Därför är sekvensen hård: nattnätet landar FÖRE eller MED
klassning och dedup, aldrig efter.

## Beslut

### 1. Riskklassning som allowlist (36.3)

En NY riskklass-dimension i `changed`-jobbet, deklarativ (inte ett eget
klassnings-skript — se rationale nedan):

- **D0** — dokumentation, befintlig och orörd: hoppar hela testsviten (idag).
- **D1** — UI-yta (stilmallar, CSS, publika statiska filer): kör lint,
  snabbtester, a11y och visuell regression men INTE staging.
- **D3** — allt annat, default. Okänt givet klassas D3.

Klassrymden är en **allowlist, aldrig en blocklist**: D1 bär SAMMA
exkluderingsmönster som D0 — CI-workflow, paketmanifest, låsfil och
byggkonfigurationer kan ALDRIG bli D1. En ny filtyp hamnar aldrig tyst i
snabbfilen. Ingen D2-klass i v1 (copy-ändringar i komponentfiler är inte
path-detekterbara; klassas ärligt D3 tills en framtida testgrafs-design).

**Klassningen förblir deklarativ i changed-files-steget.** Skarv-kvittensen
2026-07-23: D0 har levt deklarativt sedan ADR-029 och dess enda verkliga bugg var
en action-INPUT-bugg (quotepath, TASK-15) som ett eget skript inte hade fångat
bättre — det var kontrastbevis-runs som fångade den. Ett eget skript hade dessutom
tvingat fram en omimplementation av glob-semantik som actionen redan äger, med
divergens-risk mot D0.

### 2. Merge-dedup via git-förälder + körnings-API — INTE cache (36.4)

Designdokets ursprungliga cache-mekanism är **FALSIFIERAD och öppet riven**
(L325). GitHubs dokumentation slår fast att en cache skapad av en
`pull_request`-körning skapas för merge-referensen och "can only be restored by
re-runs of the pull request". En cache skriven av PR-körningen är alltså osynlig
för main-körningen som skulle läsa den — mekanismen hade gett permanent
cache-miss (noll besparing plus en onödig skrivning per PR) utan att någonsin se
trasig ut.

Ersättaren, bevisad mot faktisk disk och API 2026-07-23 på merge-commit `db6ef53`:

    HEAD^{tree}    == HEAD^2^{tree}     (identiska träd)
    gh run list --commit <PR-head full SHA>  →  conclusion: success

Main-körningen läser andra föräldern (PR-headen), verifierar att merge-commitens
träd är identiskt med PR-headens, och frågar körnings-API:t om den SHA:n redan har
en grön körning. Sunt TACK VARE merge-grindens strict up-to-date-krav (ADR-076):
en up-to-date-branch ger merge-commit vars träd är identiskt med PR-headens.
**Fail-closed på varje avvikelse:** ingen andra förälder, träd-avvikelse, API-fel
eller icke-grön körning ⇒ full svit. En besparing kan aldrig bli ett hål. Steget
bor i `changed`-jobbet, som redan har full historik — fetch-depth-bärar-invarianten
(ADR-039/054, exakt tre bärande rader) förblir ORÖRD.

### 3. Nattnätet — reusable fullsvit + larmkedja (36.2)

Den tunga testsviten (purge · pure+build · a11y · staging) extraheras till en
**reusable workflow** (`ci-suite.yml`, `workflow_call`), anropad av BÅDE `ci.yml`
(presubmit, villkorat på changed-detection) OCH en ny `nightly.yml` (`schedule`
~03:00 Europe/Stockholm + `workflow_dispatch`). EN KÄLLA, ingen jobb-duplicering.

**Arkitektur-valet reusable-svit över alternativen** (L324): nattnätet kräver
ci.yml:s FULLA svit — en additiv, fristående nightly-fil hade duplicerat jobb-
definitionerna med divergens-risk. `secrets: inherit` når inner-jobben (bevisat
via kastbar spike 2026-07-23, run 30036119790, som även bevisade att job-nivå
`queue: max` accepteras i reusable-kontext). De tre fetch-depth-bärarna
(`changed`/`lint`/`docs`) stannar KVAR i `ci.yml` — bara de historik-oberoende
tunga jobben extraheras.

Nattkörningen tar den delade `staging-tests`-mutexen (tom kö nattetid) och kör
full svit inklusive full visuell regression, **länkkontroll utan cache** (dagsviten
cachar för fart; natten kör kall för att fånga länk-röta) och **bredare
sårbarhetsgranskning** (moderate vs dagsvitens high). En röd natt skapar
automatiskt ett tilldelat, etiketterat (`ci-natt`) ärende med körningslänk och
commit-spann sedan senaste gröna natt; en grön natt lämnar inga spår.

**Larmkedjans motgift mot kyrkogårdseffekten:** stängningsregeln (åtgärd ELLER
öppet skriven motivering — aldrig tyst) bor i CONTRIBUTING § Nattnätet så att den
överlever sessionen.

### 4. Paraply-checken förblir fail-closed genom refaktorn

`ci-passed` ("CI Passed or Skipped", required check i ADR-076:s ruleset) behåller
`if: always()` ENSAMT plus exit-1-steget — L322-invarianten får inte regressa när
`needs`-listan byter från de sju gamla jobben till `[changed, lint, docs, suite]`.
`gate-proof.yml` (task-36.1, S78) är vakten och körs efter varje ci.yml-ändring;
dess jq-fail-closed-gren är en verbatim replik av `ci-passed`:s och speglas om
`ci-passed` ändras.

## Konsekvenser

- **Reusable-extraktionen** gör `ci.yml` kortare och flyttar de fyra tunga jobben
  till `ci-suite.yml`. Nya jobb i den tunga sviten läggs där, EN gång, och når
  både presubmit och natt.
- **Nattnätet körs inte om de deterministiska lint-grindarna** (de kan inte drifta
  på ett oförändrat main-träd; deras värde ligger vid merge). Medvetet val, inte
  utelämning.
- **Visuell regression från noll (36.7)** byggs i egen session (testkatalogen
  saknas på disk medan de två visuella vyporterna redan finns i
  testkonfigurationen). Nattnätet skrivs så att tillägget blir en rad men låtsas
  aldrig köra något som inte finns. Konsekvens-not landar här när 36.7 byggts.
- **Mätskriptet (36.5)** gör CI-hastigheten till siffror; **rött-först-bärarbytet
  (36.6)** landar som ADR-071-amendering, inte här.
- **Staging-per-run-isolering och mutexens avveckling** är våg 3 (samdesignas med
  bas-maximeringen, ADR-063); mutexen är interim. Reusable-formen ändrar inte den
  riktningen — den delade mutex-gruppen är en global sträng oavsett anropare.
- **Kontrastbevis är beviskravet** för klassning och dedup (TASK-15-precedenten
  med citerade körnings-ID:n). Ett kontrastbevis utan citerat ID är inget bevis;
  ID:n bokförs per skiva.

## Relaterade dokument

- [riskanpassad-ci-design-2026-07-23.md](../research/riskanpassad-ci-design-2026-07-23.md)
  — designunderlaget (S77), med cache-rättelse-noten.
- [ADR-029](ADR-029-ci-architektur-changed-files-pattern.md) — CI-arkitekturen,
  changed-files-idiomet, säkerhetshärdningen (klassningens värd).
- [ADR-039](ADR-039-konsistens-grindar-kadens.md) +
  [ADR-054](ADR-054-fetch-depth-full-historik.md) — fetch-depth-bärar-invarianten
  (som denna våg INTE rubbar).
- [ADR-045](ADR-045-a11y-runner-arkitektur.md) — a11y-runnerns mutex-frihet.
- [ADR-060](ADR-060-sentinel-setup-purge-create-conformance.md) — sentinel-purgen
  före staging.
- [ADR-063](ADR-063-airtable-bas-som-forstklassig-leverabel.md) — våg 3:s
  designfönster.
- [ADR-071](ADR-071-afk-batch-kontraktet.md) — AFK-batch-kontraktet
  (rött-först-bärarbytets värd, 36.6).
- [ADR-076](ADR-076-merge-grinden-ruleset-pr-flode.md) — merge-grinden (dedupens
  sundhetsvillkor: strict up-to-date).

## Updates

### 2026-08-28 — Den ärvda klassningen BEHÅLLS; larmets ATTRIBUTION rättas (TASK-334)

**Vad som prövades.** Post-merge-lagrets `klassning`-jobb ärver ci.yml:s
D0-beslut om den landande PR:ens EGEN diff (Beslut 1-2 ovan, byggt i TASK-73,
utvidgat med kö-ytan i TASK-78). Följden är att svit-anropet hoppas på VARJE
docs-only-landning. `TASK-334` frågade om det är rätt kontrakt för ett lager
vars hela syfte är att fånga sådant PR-grinden inte kan se.

**Mätt utfall, inte antaget** (`gh run view <id> --json jobs`, 2026-08-28):
åtta av elva lästa post-merge-körningar hade `Verifierande svit på det mergade
trädet` med conclusion `skipped` — bland dem `33137040114` (`7a0a2a46`),
`33138604694` (`10ae24f3`), `33139966256` (`50eff8ad`) och `33141170428`
(`5a3daf5b`). De tre som körde sviten föll alla på `Staging (API + E2E)`.

**Det verkliga felet låg inte i vad som kördes, utan i vad larmet PÅSTOD.**
Larm-jobbets steg (b) läste föregående post-merge-körnings WORKFLOW-nivå-
conclusion. En körning vars svit hoppades är `success` på den nivån utan att ha
mätt någonting, och larmet skrev då ordagrant: *"Föregående post-merge-körning
var **GRÖN** ⇒ den här landningen är den primära misstänkta. Revert nedan är
sannolikt rätt första åtgärd."* Mätt två gånger inom 13 minuter — ärende
`#2043` (körning `33139629247`, träd `d5607d6254a3`, PR `#2035`) och `#2047`
(körning `33140227702`, träd `55d83d0d674d`, PR `#2038`). Rotorsaken låg i
staging-fixturens drift och åtgärdades i `TASK-333`; ingen av de två utpekade
landningarna hade med den att göra.

**Options-rymden, med skälen:**

| Väg | Utfall | Skäl |
|---|---|---|
| **A** — kör alltid staging oavsett klass | **FÖRKASTAD** | Återinför exakt den defekt TASK-73 stängde: merge `ed51b95` (åtta rader i EN `.md`-fil) tog den globala `staging-tests`-mutexen i körning `30393323548`, revert-PR `#375` låg `pending` bakom den, `ci-wait.sh` timade ut efter 900 s och revert-vägen mätte 25 min 16 s. Med ~15 landningar på ett dygn är kostnaden inte marginell. |
| **B** — tidsbaserad drift-vakt (kör sviten om > N h sedan senaste faktiska mätning) | **FLAGGAD, EJ BYGGD** | Nattnätet täcker redan staging på `main`: `nightly.yml` anropar `ci-suite.yml` utan `with:`-block och får därmed `run_staging: true` — verifierat grönt i körning `33065848810` (2026-08-27). B är alltså inte ett hål utan en KADENS-fråga (≤ 24 h → ≤ N h). Priset är en TREDJE daglig tagning av den globala `staging-tests`-mutexen, mot ett jobb som ligger på ~6-7 min under ett `timeout-minutes: 12`-tak (≈1,8× marginal) och som skarpt slagit i taket (tre instanser 2026-08-07). Kadensfrågan är en avvägning för Marcus, inte en följdändring av denna rättelse. |
| **C** — rätta larmets attribution | **VALD** | Se nedan. |
| **D** — B + C | **DELVIS** — C byggd, B flaggad | Villkoret för D var "om nattnätet inte redan täcker". Mätningen visar att det gör det. |

**Vad som ÄNDRADES (C).** Larmets attribution bor nu i
`scripts/post-merge-attribution.sh`. Den går bakåt till senaste post-merge-
körning som FAKTISKT körde sviten (inner-jobb prefixade svit-jobbets namn,
till skillnad från ett skippat anrop som rapporteras som ETT jobb med exakt
namnet), räknar landningarna däremellan och formulerar därefter:

- ankare grönt, noll omätta däremellan → primär misstanke, som förut
- ankare grönt, k > 0 omätta däremellan → nekar primär misstanke, anger
  spannet `<ankare>..<denna>`
- ankare rött → felet är äldre, som förut men nu förankrat i en körning som
  faktiskt mätte
- API-fel, saknad env eller ingen mätning inom fönstret → **OKÄND**, aldrig ett
  påstående byggt på frånvaro av data (`TASK-51`, L322-klassen)

**Vad som INTE ändrades.** Beslut 1 och 2 ovan står orörda. Klassningen ärvs
fortsatt, räknas fortsatt aldrig om, och docs-landningar hoppar fortsatt
sviten. `scripts/classify-post-merge.sh` är inte rörd av detta kort.

**Grindarna.** `scripts/test-post-merge-attribution.sh` (48 hävdanden) körs i
`ci.yml`:s lint-jobb. Tre av dem är kopplings- och wiringsvakter: att skriptets
`POST_MERGE_SUITE_JOB_NAME` är post-merge.yml:s faktiska svit-jobbnamn (A11),
att workflowen anropar skriptet (A12), och — ADR-083-vakten — att den falska
meningen inte återinförs hårdkodad i YAML (A13). Tvåsidigheten är mätt mot fem
muterade kopior: A9 fäller om körningslistan filtreras i stället för att skäras
vid egen körnings index; A11 vid namndrift; A12 vid borttaget anrop; A13 vid
återinförd mening; och en mutant som återskapar den GAMLA logiken (grönt ankare
⇒ ovillkorlig primär misstanke) fäller A2 med exakt den falska meningen.

En sjätte mutant tillkom i granskningens runda 2 (2026-08-28): skriptets två
tak — `MAX_KORNINGAR` (körningslistans fönster) och `MAX_JOBBFRAGOR` (taket för
`gh run view`-anrop) — stod på 30 respektive 20, vilket gav ett läge där
attributionen svarade OKÄND trots outforskade kandidater. Taken är nu LIKA
(20/20), så jobbfråge-taket aldrig kan bli det bindande, och `A19` fäller om de
glider isär.
