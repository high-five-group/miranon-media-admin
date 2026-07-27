---
owner: marcus803
updated: 2026-07-27
review_by: 2027-01-26
status: stable
---

# Merge queue mot vår staging-mutex — löser den serialiseringen? (Code, 2026-07-26)

> **Proveniens:** avgränsat research-pass (S91), 2026-07-26. Ingen kod rörd —
> passet är läsning plus denna fil. Inga git-kommandon körda. Repo-fakta är
> hämtade read-only via `gh api` mot `marcus803/miranon-media-admin` samma dag;
> CI-fakta är lästa ur `.github/workflows/` på disk. Alla bärande
> GitHub-påståenden är verifierade mot förstapartskälla — i flera fall mot
> `github/docs`-repots råa källfil, eftersom den renderade sidan är
> versionsfiltrerad och därför utelämnar avgörande stycken beroende på vilken
> plan-variant läsaren råkar hamna på.

---

> **AMENDERING 2026-07-27 (S91, tredje resumen) — LAGER 1 ÄR UPPHÄVT, LAGER 2 STÅR.**
>
> Marcus överförde repot till organisationen `high-five-group` (skapad
> 2026-07-27 kl 11:15:43Z) på **enterprise-plan**, uttryckligen för att öppna
> merge queue. Verifierat samma dag: `plan=enterprise` (1/50 seats), ägartyp
> `Organization`, synlighet `public`. Åtgärden gjordes i förebyggande syfte,
> före det CI-arkitekturarbete den betjänar.
>
> **Vad som faller.** Hela **Lager 1 — spärren** (§ Kort svar, § Spärren) samt
> premiss-tabellens rad 2. Merge queue kan nu aktiveras i rulesetet
> `main-skydd`. Meningarna "Vårt ägs av ett användarkonto", "ägaren är av typen
> `User`" och "Kombinationen publikt men användarägt faller utanför båda de
> tillåtna formerna" är från detta datum **historik, inte gällande läge**.
> GitHubs citerade tillgänglighetsregel är oförändrad — det är vår ägarform som
> flyttat sig in i den.
>
> **Vad som står.** **Lager 2 i sin helhet**, och det är avsiktligt skrivet så:
> rubriken lyder "det som gäller även efter en org-flytt". Slutsatsen vilar inte
> på ägarformen utan på att `merge_group`-bygg inte slås ihop (*"Merge limits do
> not combine `merge_group` builds"*, GitHubs egen mening) mot en global mutex
> som serialiserar exakt de byggena. Räknetabellen i § Om vi ändå flyttade
> repot gäller därför oförändrad: **bästa fallet är oförändrade ≈27 min,
> sämsta fallet ≈55 min.** Det sämsta fallet är default — det kräver att det
> tunga jobbet villkoras på `github.event_name` för att undvikas. Även § Roten
> står orörd: taket är `9,1 min × antal tunga körningar` så länge staging är en
> delad muterbar Airtable-bas och ett delat Supabase-projekt.
>
> **Vad som nu är möjligt och inte var det.** Öppen fråga 1 (`concurrency` ×
> `merge_group` dokumenteras inte alls) stämplades *"obekräftad tills den mätts
> skarpt"*, och § Öppna frågor punkt 6 slog fast att *"ingen sådan drift är
> möjlig att observera i dagens ägarform"*. Den meningen är inte längre sann.
> Hela Lager 2:s kalkyl är en härledning ur två separata dokumentationsytor —
> **den kan från och med nu mätas i stället för härledas**, och det är den mest
> materiella konsekvensen av överföringen.
>
> **Precedent i eget underlag.** [Eftergranskningen
> 2026-07-24](arbetsflode-processgranskning-eftergranskning-2026-07-24.md)
> (rad 191 + rekommendation 10) pekade ut organisationsflytt för merge queue som
> rationell nästa åtgärd *om BEHIND-svälten fortsatte* — och BEHIND-svälten är
> skördad som lesson L328. Åtgärden följer alltså dokumenterad rekommendation,
> och den vinst passet självt tillskriver merge queue — bortautomatiseringen av
> BEHIND-cykeln, "en verklig och icke-trivial vinst" — är den vinst som faktiskt
> är köpt. Den ligger i koordination och latens, inte i CI-väggklockan.
>
> **Status för slutsatsen som helhet:** oförändrad rekommendation, halverad
> grund. Merge queue är inte längre stängd, men den löser fortfarande inte
> serialiseringen. Beslutet om aktivering är Marcus och ännu inte taget;
> CI-/grind-arkitekturen tas som eget pass.

---

## Kort svar

**Nej — och nejet kommer i två oberoende lager.**

**Lager 1 — spärren.** Merge queue går inte att aktivera i rulesetet
`main-skydd` över huvud taget. GitHub kräver att repot ägs av en
**organisation**. Vårt ägs av ett användarkonto. Beslutet är därmed avgjort
redan före mekaniken: frågan "ska vi aktivera merge queue" har inget
ja-alternativ i dagens ägarform.

**Lager 2 — det som gäller även efter en org-flytt.** Merge queue skulle inte
lösa serialiseringen. Merge queue:s enda genomströmnings-hävstång är att bygga
köade poster **spekulativt parallellt**. Vår globala mutex `staging-tests`
serialiserar exakt de byggena. Och batchningen — den mekanism man intuitivt tror
skulle slå ihop fem PR:er till ett staging-bygg — gör bevisligen inte det:
GitHub skriver ordagrant att *"Merge limits do not combine `merge_group`
**builds**"*. Fem köade PR:er ger fem bygg, inte ett.

Nettot av en org-flytt vore alltså: **samma 9,1 minuter × N i serie**, plus
extra ombyggen vid fel och köhopp. Det som faktiskt skulle vinnas är
BEHIND-cykeln — den manuella uppdatera-och-vänta-loopen som strict-läget tvingar
fram — inte väggklockan för själva staging-sviten.

**Den skarpa slutsatsen:** merge queue adresserar *logisk* integritet
(semantiska konflikter mellan PR:er). Vår flaskhals är en *fysisk* resursmutex
(en Airtable-bas, ett Supabase-projekt). Fel verktyg för vår flaskhals. Roten är
att staging-sviten inte är parallellsäker — och den roten flyttar sig inte av
någon kö-mekanism.

### Två korrigeringar mot uppdragets premisser

| Premiss i uppdraget | Verifierat läge |
| --- | --- |
| "Privat repo" | **Publikt.** `gh api` ger `"private": false`, `"visibility": "public"` |
| Merge queue kan aktiveras i rulesetet | **Kan inte** — kräver org-ägt repo; ägaren är av typen `User` |

Att repot är publikt hjälper inte: kravet är org-**ägt**, inte publikt.
Kombinationen "publikt men användarägt" faller utanför båda de tillåtna
formerna.

---

## 1. `merge_group`-eventet — trigger, synlighet och kopplingen till PR-checkar

**Hur det triggas.** Workflowen måste explicit lyssna på eventet. GitHub är
ovanligt kategorisk:

> You **must** use the `merge_group` event to trigger your GitHub Actions
> workflow when a pull request is added to a merge queue.

Och konsekvensen av att glömma det:

> Otherwise, status checks will not be triggered when you add a pull request to
> a merge queue. The merge will fail as the required status check will not be
> reported. The `merge_group` event is separate from the `pull_request` and
> `push` events.

Källa: [`managing-a-merge-queue.md`](https://raw.githubusercontent.com/github/docs/main/content/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue.md)
och reusable-filen
[`merge-group-event-with-required-checks.md`](https://raw.githubusercontent.com/github/docs/main/data/reusables/actions/merge-group-event-with-required-checks.md).

Enda aktivitetstypen är `checks_requested`.
[Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)

**Vad workflowen ser.** `GITHUB_SHA` blir "SHA of the merge group" och
`GITHUB_REF` blir "Ref of the merge group". Kön skapar temporära grenar med
prefixet `gh-readonly-queue/{base_branch}` — GitHub pekar ut dem explicit för
tredjeparts-CI:

> With third-party CI providers, you will need to update your CI configuration
> to run when a branch that begins with the special prefix
> `gh-readonly-queue/{base_branch}` is pushed to. These are the temporary
> branches that are created on your behalf by a merge queue and contain a
> different `sha` from the pull request.

**Kan man ha olika checkar på PR:en och i kön?** Nej — inte som konfiguration.
GitHub skriver rakt ut:

> Merge queue and pull requests checks are **coupled** and configured under
> branch protection rules or rulesets.

Det finns alltså **en** lista över required checks, och den gäller båda ytorna.
Att kräva en lätt svit på PR:en och en tung svit enbart i kön är inte en
inställning som existerar.

Däremot går det att åstadkomma i praktiken via workflow-logik i stället för
policy: samma *check-namn* rapporteras på båda ytorna, medan de underliggande
jobben villkoras på `github.event_name`. Detta är en känd, efterfrågad lucka —
[community-diskussion #103114](https://github.com/orgs/community/discussions/103114)
(öppnad februari 2024) begär just per-yt-checkar; flera användare fyller på,
och GitHub har inte utfäst något. Workaround-mönstret som diskussionen landar i
är exakt villkorade jobb bakom ett gemensamt aggregator-namn.

Det mönstret är värt att notera: vår `CI Passed or Skipped` **är** redan en
sådan aggregator (`.github/workflows/ci.yml`, jobbet `ci-passed`, `if:
always()` + `needs`-läsning som failar explicit på `failure`/`cancelled`). Vi
har alltså redan formen som krävs — vilket gör frågan om run-antal, inte om
konfigurerbarhet.

---

## 2. Delar köade körningar arbete? — kärnfrågan

**Nej. Batchning slår inte ihop bygg.** Detta är passets viktigaste fynd, och
det står ordagrant i dokumentationens källfil, som en `NOTE` direkt under
inställningen "Merge limits":

> Merge limits do not combine `merge_group` **builds**. Merge limits only
> affect merges to the base branch once one or more `merge_group` has satisfied
> build checks.

Källa: [`managing-a-merge-queue.md`](https://raw.githubusercontent.com/github/docs/main/content/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue.md)
(rad 71–72 i källfilen, hämtad 2026-07-26).

`min_entries_to_merge` / `max_entries_to_merge` styr alltså hur många PR:er som
**mergas ihop** till basgrenen när de väl är gröna — inte hur många som
**byggs ihop**. Fem köade PR:er ger fem `merge_group`-bygg.

**Modellen är kumulativ spekulation, inte batchning.** Varje post får sin egen
temporära gren som innehåller basgrenen plus alla PR:er före den i kön:

> The merge queue creates a temporary branch with the prefix of `main/pr-2`
> that contains code changes from the target branch, pull request #1, and pull
> request #2, and dispatches webhooks.

Merge sker sedan från den längsta gröna prefixen — i exemplet mergas `main/pr-2`
och basgrenen får med både #1 och #2.

**Build concurrency är en strypventil, inte en delningsmekanism.** GitHubs egen
formulering i ruleset-dokumentationen:

> For example, if there are 5 pull requests added to the queue and the build
> concurrency setting is 3, merge queue will dispatch the `checks_requested`
> event for the first 3 pull requests. When it receives a result for one of
> those pull requests, merge queue will dispatch the event for the 4th pull
> request, and so on.

Källa: [`available-rules-for-rulesets.md`](https://raw.githubusercontent.com/github/docs/main/content/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets.md)

**Slutsats för uppdragets kärnfråga:** kön batchar inte. Varje post kör sitt
eget bygg. Merge queue är därmed — mätt i antal tunga körningar — **en flyttad
kö**, inte en delad körning. Hela dess vinst ligger i att de N byggen får ske
*samtidigt*. Tas den samtidigheten bort återstår ingenting av
genomströmnings-argumentet.

---

## 3. Hur samspelar `concurrency`-grupper med merge queue?

**Kort:** `merge_group`-körningar är vanliga workflow-körningar och lyder under
`concurrency` precis som alla andra. Delar de gruppnamn med PR- och
push-körningar hamnar de i samma kö.

Concurrency-gruppen är bara en sträng, och räckvidden är **repot** — inte
workflowen, inte grenen, inte eventet:

> Use `concurrency` to ensure that only a single job or workflow using the same
> concurrency group will run at a time. A concurrency group can be any string
> or expression.

Och — avgörande för vår analys — räckvidden anges explicit:

> When a concurrent job or workflow is queued, if another job or workflow using
> the same concurrency group **in the repository** is in progress, the queued
> job or workflow will be `pending`.

GitHub varnar dessutom explicit för korsning mellan workflows:

> If you have multiple workflows in the same repository, concurrency group
> names must be unique across workflows to avoid canceling in-progress jobs or
> runs from other workflows. Otherwise, any previously in-progress or pending
> job will be canceled, regardless of the workflow.

Källa: [`actions-group-concurrency.md`](https://raw.githubusercontent.com/github/docs/main/data/reusables/actions/actions-group-concurrency.md)
och [Control workflow concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).

**`queue: max` respektive `cancel-in-progress` i det läget.** Vårt `queue: max`
är en färsk GitHub-funktion — [changelog 2026-05-07](https://github.blog/changelog/2026-05-07-github-actions-concurrency-groups-now-allow-larger-queues/).
Semantiken:

- `single` (default): högst en väntande körning per grupp; en ny köad körning
  **avbryter och ersätter** den väntande.
- `max`: upp till **100** väntande körningar per grupp; när kön är full avbryts
  ytterligare körningar.
- Ordningen är FIFO efter när körningen började vänta på gruppen — med
  reservationen "ordering is not guaranteed".
- Kombinationen `queue: max` + `cancel-in-progress: true` är **förbjuden** och
  ger workflow-valideringsfel.

Konsekvensen för ett merge queue-scenario med vår nuvarande grupp: varje
`merge_group`-bygg skulle ställa sig i samma FIFO-kö som PR-byggen och
nightly-körningen. Kön skulle hålla (100 platser är gott om marginal), men
serialiseringen består. Hade vi i stället kört `single` — dagens default utan
`queue`-nyckeln — skulle spekulativa bygg **avbryta varandra**, vilket vore
sämre: kön skulle svälta sig själv.

**Dokumentations-lucka, öppet deklarerad:** GitHub dokumenterar inte någon
merge queue-specifik interaktion med `concurrency`, och inte heller någon
rekommendation om hur `merge_group` bör grupperas. Slutsatsen ovan är en
härledning ur två oberoende, citerade dokumentationsytor (concurrency-räckvidd
respektive `merge_group` som ordinärt event) — inte ett direkt citat. Den bör
behandlas som välgrundad men obekräftad tills den mätts.

---

## 4. Failure-hanteringen

**Ingen bisection dokumenteras.** Modellen är enklare — och dyrare — än så: den
felande posten plockas ut, och de efterföljande grupperna **byggs om**.

GitHubs eget scenario:

> When the GitHub API receives a failing status for `main/pr-1`, the merge queue
> automatically removes pull request #1 from the merge queue.

Och i nästa steg:

> The merge queue **recreates** the temporary branch with the prefix of
> `main/pr-2` to only contain changes from the target branch and pull request #2.

Så: bara den felande PR:en åker ut — men varje efterföljande post i kön får ett
nytt bygg, eftersom dess innehåll ändrats. Kostnaden för ett fel på plats 1 i en
kö med N poster är alltså upp till N−1 extra bygg.

**Köhopp är dyrast av allt.** GitHub varnar själva:

> Be aware that jumping to the top of a merge queue will cause a **full rebuild
> of all in-progress pull requests**, as the reordering of the queue introduces
> a break in the commit graph. Heavily utilizing this feature can slow down the
> velocity of merges for your target branch.

**Ventilen för flakiga tester.** Inställningen "Only merge non-failing pull
requests" (API: `grouping_strategy`) styr toleransen:

| Läge | Innebörd |
| --- | --- |
| `ALLGREEN` | Varje post i gruppen måste passera alla required checks |
| `HEADGREEN` | Endast commiten i gruppens huvud — den som innehåller alla PR:ers ändringar — måste passera |

GitHubs motivering för `HEADGREEN`: *"useful if you have intermittent test
failures, but don't want false negatives to hold up the queue."*

**Övriga utplocknings-orsaker**, ordagrant: CI rapporterar fel för en merge
group; timeout mot `check_response_timeout_minutes`; användare tar bort posten
via API eller gränssnitt; branch protection-fel som inte kunde lösas
automatiskt.

Källor: [`managing-a-merge-queue.md`](https://raw.githubusercontent.com/github/docs/main/content/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue.md),
[`merge-queue-removal-reasons.md`](https://raw.githubusercontent.com/github/docs/main/data/reusables/pull_requests/merge-queue-removal-reasons.md).

---

## 5. Kräver merge queue att strict up-to-date stängs av?

**Nej — dokumentationen beskriver dem inte som ömsesidigt uteslutande.** Det
uppdraget hört som "ömsesidigt uteslutande" är sannolikt en förskjutning av
GitHubs faktiska formulering, som handlar om **funktionell överlappning**:

> The merge queue provides the same benefits as the **Require branches to be up
> to date before merging** branch protection, but does not require a pull
> request author to update their pull request branch and wait for status checks
> to finish before trying to merge.

Källa: [`merge-queue-overview.md`](https://raw.githubusercontent.com/github/docs/main/data/reusables/pull_requests/merge-queue-overview.md)

Merge queue är alltså en **ersättare** för strict-läget i funktion, inte en
konfiguration som kolliderar med det. Att behålla båda är inte dokumenterat som
ogiltigt — men det är redundant: kön testar redan merge-kandidaten mot färsk
bas, vilket är precis vad strict-läget försöker garantera på ett dyrare sätt.

**Den enda explicit dokumenterade oförenligheten** gäller något annat:

> A merge queue cannot be enabled with branch protection rules that use wildcard
> characters (`*`) in the branch name pattern.

Den träffar inte oss: `main-skydd` matchar `~DEFAULT_BRANCH`, inte ett
wildcard-mönster (verifierat via `gh api .../rulesets/19627609`). Noteras dock
att formuleringen talar om *branch protection rules*; motsvarande utsaga för
rulesets saknas i dokumentationen.

---

## 6. Ruleset-vägen — parametrar och begränsningar

Regeln heter **"Require merge queue"** och konfigureras på repo-nivå. En
begränsning står ordagrant i dokumentationen:

> This rule is not available for rulesets created at the **organization** level.

Merge queue-regeln kan alltså bara sättas i ett **repository**-ruleset. Notera
den lätt paradoxala kombinationen: repot måste ägas av en organisation, men
regeln får inte sättas på organisationsnivå.

**Exakta API-parametrar** (schema `repository-rule-merge-queue`, hämtat ur
[GitHubs OpenAPI-beskrivning](https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json)
2026-07-26). Samtliga sju är `required` när regeln sätts:

| Parameter | Typ / intervall | Betydelse |
| --- | --- | --- |
| `merge_method` | `MERGE` / `SQUASH` / `REBASE` | Metod vid merge av köade PR:er |
| `max_entries_to_build` | 0–100 | Hur många köade PR:er som samtidigt begär checkar och workflow-körningar |
| `min_entries_to_merge` | 0–100 | Minsta antal PR:er som mergas ihop i en grupp |
| `max_entries_to_merge` | 0–100 | Största antal PR:er som mergas ihop i en grupp |
| `min_entries_to_merge_wait_minutes` | 0–360 | Väntetid efter första posten för att nå minsta gruppstorlek; därefter ignoreras minimum |
| `grouping_strategy` | `ALLGREEN` / `HEADGREEN` | Om varje post eller endast gruppens huvud måste vara grön |
| `check_response_timeout_minutes` | 1–360 | Maxtid för en required check att rapportera slutsats; därefter antas den ha failat |

Observera att `min_entries_to_merge` / `max_entries_to_merge` — de parametrar
som *låter* som batchning — enligt fynd 2 inte påverkar antalet bygg.

---

## Vad det betyder för OSS

### Spärren

Repot är `marcus803/miranon-media-admin`, ägartyp **`User`**, synlighet
**public** (verifierat `gh api` 2026-07-26). GitHubs tillgänglighetsregel,
ordagrant ur den gated-features-fil som genererar banderollen på varje
merge queue-sida:

> Pull request merge queues are available in any public repository owned by an
> **organization**, or in private repositories owned by organizations using
> GitHub Enterprise Cloud.

Källa: [`gated-features/merge-queue.md`](https://raw.githubusercontent.com/github/docs/main/data/reusables/gated-features/merge-queue.md),
bekräftad av [GA-changeloggen 2023-07-12](https://github.blog/changelog/2023-07-12-pull-request-merge-queue-is-now-generally-available/):
*"Merge queue is available on private and public repos on the GitHub Enterprise
Cloud plan and all public repos owned by organizations."*

Vår kombination — publikt men **användarägt** — träffar ingen av formerna.
Detta bekräftar och skärper den bokföring som redan finns i
[ADR-076](../decisions/ADR-076-merge-grinden-ruleset-pr-flode.md) och i
[processgranskningen 2026-07-23](arbetsflode-processgranskning-2026-07-23.md).
Den tidigare formuleringen "kräver org-ägt repo" höll; det som var oprecist var
antagandet om privat repo — publiciteten spelar ingen roll när ägarformen
fäller.

### Om vi ändå flyttade repot till en organisation

Vår mutex ligger på det tunga jobbet i `.github/workflows/ci-suite.yml`:

```yaml
concurrency:
  group: staging-tests
  queue: max
```

Gruppnamnet är en konstant sträng utan `github.ref`. Det betyder att **allt**
som tar mutexen hamnar i samma FIFO-kö — PR-körningar, main-push-körningar,
nightly (`.github/workflows/nightly.yml` tar samma mutex), och i ett
merge queue-scenario även varje `merge_group`-bygg.

Räkneexemplet med tre parallella kod-PR:er, staging 9,1 min:

| Scenario | Tunga körningar genom mutexen | Serialiserad väggklocka |
| --- | --- | --- |
| Idag (PR-körning per PR) | 3 | ≈ 27 min |
| Merge queue, staging på båda ytorna | 6 | ≈ 55 min |
| Merge queue, staging villkorad till enbart kön | 3 | ≈ 27 min |

Bästa fallet är alltså **oförändrat** — och det kräver att vi villkorar det
tunga jobbet på `github.event_name`, med `CI Passed or Skipped` som gemensamt
check-namn (mönstret ur diskussion #103114). Sämsta fallet är dubbleringen. Till
det kommer ombyggen: ett fel på plats 1 i en kö med N poster kostar upp till N−1
extra bygg, och varje köhopp bygger om allt pågående.

**Vad som faktiskt skulle vinnas:** BEHIND-cykeln. Idag tvingar strict-läget
fram att varje merge gör nästa PR inaktuell → människa uppdaterar → ytterligare
en körning genom samma lås. Merge queue automatiserar bort både människan och
den omkörningen, eftersom kön testar merge-kandidaten direkt. Det är en verklig
och icke-trivial vinst i ett läge med fyra parallella agenter och 7–11 PR:er per
dag — men den ligger i **koordination och latens**, inte i CI-väggklockan.

### Roten, som ingen kö-mekanism flyttar

Flaskhalsen är inte kö-disciplin. Den är att `test-staging` inte är
parallellsäker, därför att staging är **en** delad muterbar Airtable-bas och
**ett** delat Supabase-projekt. Så länge det gäller är taket för hela systemets
genomströmning `9,1 min × antal tunga körningar`, oavsett vilken mekanism som
delar ut turordningen.

Merge queue löser *logisk* integritet — att två var för sig gröna PR:er inte
bryter huvudgrenen tillsammans. Vår kostnad kommer från en *fysisk* resursmutex.
Det är två olika problem, och det förklarar varför verktyget inte biter: vi har
redan logisk integritet via strict-läget, och det är just den garantin vi betalar
9,1 minuter styck för.

Den enda åtgärd som höjer taket är att göra staging-körningar isolerade från
varandra — separat datanamnrymd per körning, eller separat miljö per körning —
så att mutexen kan tas bort eller partitioneras. Först *därefter* skulle
spekulativ parallellism (vare sig via merge queue eller via dagens PR-körningar)
ge någon utdelning. Det är ett eget spår och ett eget beslut; passet noterar det
som implikation, inte som rekommendation.

---

## Öppna frågor — vad dokumentationen inte svarar på

1. **`concurrency` × `merge_group` dokumenteras inte alls.** GitHub beskriver
   ingenstans hur köade bygg beter sig mot en delad concurrency-grupp, och ger
   ingen rekommendation om gruppnamngivning för `merge_group`. Avsnitt 3 är en
   härledning ur två citerade men separata dokumentationsytor. Obekräftad tills
   den mätts skarpt.
2. **Suppression av bygg under `HEADGREEN` är oklart.** Dokumentationen säger
   att endast gruppens huvud *måste passera* — men inte om bygg för
   mellanliggande poster ändå *avfyras*. Läst bokstavligt påverkas bara
   merge-villkoret, inte antalet körningar. Om `HEADGREEN` i praktiken skulle
   minska antalet dispatchade `merge_group`-event vore det materiellt för vår
   kalkyl. Går inte att avgöra ur dokumentationen.
3. **Tidsordningen mellan `max_entries_to_build` och kö-ackumulering.** Om
   build concurrency är 1 och fyra PR:er köas medan det första bygget kör —
   bildas då fyra separata poster, eller kan kön forma en enda grupp av de
   väntande? Dokumentationens exempel förutsätter en post per PR, men fallet
   "poster som anländer under pågående bygg" behandlas inte explicit.
4. **Ingen förstapartssiffra på batchstorlek.** Tredjepartskällor anger "upp
   till fem som standard"; det stöds inte av GitHubs dokumentation, där
   intervallet är 0–100 utan angivet default. Behandlas som obelagt.
5. **Rulesets kontra branch protection i wildcard-regeln.** Wildcard-förbudet är
   formulerat för branch protection rules. Om samma begränsning gäller
   ruleset-villkor sägs inte. Träffar inte oss (`~DEFAULT_BRANCH`), men luckan
   noteras.
6. **Ingen mätning gjord.** Detta pass är källbelagt, inte empiriskt. Siffrorna
   i tabellen ovan är aritmetik på uppdragets uppmätta 9,1 min — inte observerad
   merge queue-drift. Ingen sådan drift är möjlig att observera i dagens
   ägarform.

---

## Källförteckning

Samtliga hämtade 2026-07-26. Förstapartskällor om inget annat anges.

**GitHub-dokumentation, råa källfiler** (`github/docs`, `main`) — valda framför
de renderade sidorna eftersom versionsfiltreringen döljer stycken:

- [`managing-a-merge-queue.md`](https://raw.githubusercontent.com/github/docs/main/content/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue.md)
  — merge limits-noten, spekulationsmodellen, fel- och köhopps-scenarierna
- [`available-rules-for-rulesets.md`](https://raw.githubusercontent.com/github/docs/main/content/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets.md)
  — "Require merge queue", build concurrency-exemplet, org-nivå-begränsningen
- [`gated-features/merge-queue.md`](https://raw.githubusercontent.com/github/docs/main/data/reusables/gated-features/merge-queue.md)
  — tillgänglighetsregeln
- [`pull_requests/merge-queue-overview.md`](https://raw.githubusercontent.com/github/docs/main/data/reusables/pull_requests/merge-queue-overview.md)
  — relationen till strict up-to-date
- [`pull_requests/merge-queue-removal-reasons.md`](https://raw.githubusercontent.com/github/docs/main/data/reusables/pull_requests/merge-queue-removal-reasons.md)
  — utplocknings-orsakerna
- [`actions/merge-group-event-with-required-checks.md`](https://raw.githubusercontent.com/github/docs/main/data/reusables/actions/merge-group-event-with-required-checks.md)
  — kravet på `merge_group`-trigger
- [`actions/actions-group-concurrency.md`](https://raw.githubusercontent.com/github/docs/main/data/reusables/actions/actions-group-concurrency.md)
  — concurrency-räckvidd, `queue: single` / `max`, FIFO-reservationen

**GitHub-dokumentation, renderade sidor:**

- [Managing a merge queue](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue)
- [Merging a pull request with a merge queue](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/merging-a-pull-request-with-a-merge-queue)
- [Available rules for rulesets (Enterprise Cloud)](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
- [Control workflow concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)

**GitHub API-beskrivning:**

- [`api.github.com.json`](https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json)
  — schemat `repository-rule-merge-queue`

**GitHub Changelog och engineering-blogg:**

- [Pull request merge queue is now generally available](https://github.blog/changelog/2023-07-12-pull-request-merge-queue-is-now-generally-available/)
  (2023-07-12) — tillgänglighet
- [GitHub Actions concurrency groups now allow larger queues](https://github.blog/changelog/2026-05-07-github-actions-concurrency-groups-now-allow-larger-queues/)
  (2026-05-07) — `queue: max`
- [How GitHub uses merge queue to ship hundreds of changes every day](https://github.blog/engineering/engineering-principles/how-github-uses-merge-queue-to-ship-hundreds-of-changes-every-day/)
  (2024-03-06) — 33 % lägre väntetid, dynamisk gruppformning. Innehåller inga
  uppgifter om bygg per grupp eller spekulation, trots ämnesnärheten

**GitHub Community Discussions** (användarsvar där GitHub inte utfäst något —
markeras som svagare belägg):

- [#51483 — Merge Queue feature availability](https://github.com/orgs/community/discussions/51483)
  — samstämmigt med gated-features-filen
- [#103114 — Merge queue specific checks](https://github.com/orgs/community/discussions/103114)
  — bekräftar att per-yt-checkar saknas; workaround-mönstret

**Lokala artefakter (läst på disk, ej ändrade):**

- `.github/workflows/ci.yml`, `.github/workflows/ci-suite.yml`,
  `.github/workflows/nightly.yml`
- `gh api repos/marcus803/miranon-media-admin` samt
  `.../rulesets/19627609` — ägartyp, synlighet, ruleset-villkor
- [ADR-076](../decisions/ADR-076-merge-grinden-ruleset-pr-flode.md),
  [processgranskningen 2026-07-23](arbetsflode-processgranskning-2026-07-23.md)
  — tidigare bokföring av merge queue-otillgängligheten
