---
owner: marcus803
updated: 2026-07-26
review_by: 2027-01-26
status: stable
---

# Push- och PR-kadens när CI är dyr och arbetsträden är efemära — research (Code, 2026-07-26)

> **Proveniens:** avgränsat research-pass (bakgrundsagent), S91, 2026-07-26.
> Ingen kod rörd, inga git-kommandon körda — passet läser repot och skriver
> denna enda fil. Varje bärande påstående citerar sin käll-URL, verifierad
> samma dag. Där precedent-rymden är tunn deklareras det öppet; räkningen är
> inte fejkad. Repo-tillståndet nedan är läst från disk
> (`.github/workflows/ci.yml`, `.github/workflows/ci-suite.yml`,
> `.claude/settings.json`), inte antaget.

## Kort svar

**Vår kadens är ett designval, inte en glidning — och den ligger rätt.** En
commit per PR och 7–11 PR:er på en dag är inte en avvikelse från branschens
rekommendation; det ÄR rekommendationen, med marginal. Trunk-based development
sätter golvet vid "minst en integration till trunk per dygn" och DORA mäter
elit-team vid "högst tre aktiva brancher" — vi landar nio gånger om dagen från
brancher som lever i timmar. Det gängse flödet vi INTE följer (branch → flera
lokala commits → push → PR) är inte en högre standard vi fallit ifrån; det är
en LÄGRE integrationsfrekvens som Martin Fowler explicit klassar som
"semi-integration", inte som continuous integration.

**Det som har glidit är inte kadensen utan tre andra saker.** (1) Regeln är
oskriven, så den kan inte försvaras när den ifrågasätts och kan inte ärvas av
en ny agent. (2) Vi har blandat ihop två oberoende beslut — *commit-frekvens*
(gratis) och *push-frekvens* (kostar en full CI-körning och en plats i ett
globalt staging-mutex). När de separeras försvinner konflikten mellan
durabilitet och kostnad nästan helt. (3) Kostnadssidan attackeras på fel ställe:
vår `cancel-in-progress` är per-PR och hjälper inte alls mot mutex-kön mellan
fyra parallella agenter, och GitHubs krav på strict up-to-date genererar
omkörningar som växer med antalet öppna PR:er — inte med push-frekvensen.

**Och en premiss faller.** Fallet som motiverade frågan — en färdig lint-fix
som låg ocommittad i ett arbetsträd och "hade försvunnit med katalogen" —
stämmer inte mot Anthropics egen dokumentation. Städ-svepet **hoppar över** ett
arbetsträd som fortfarande håller arbete: ändrade eller otrackade filer, eller
opushade commits. Ocommitterat arbete raderas alltså inte automatiskt. Den
verkliga risken är inte radering utan **oupptäckbarhet** — arbete som ligger
kvar i en katalog ingen tittar i — plus tre smala raderings-vägar
(`git worktree remove --force`, `-p`-körningar som saknar exit-prompt, och
manuell städning). Det flyttar rätt åtgärd från "pusha oftare" till "committa
alltid + leta föräldralösa träd vid sessionsavslut".

---

## 1. Trunk-based development kontra feature-branch-kadens

### Vad källorna faktiskt säger

`trunkbaseddevelopment.com` sätter EN hård siffra: "all team members commit to
trunk at least once every 24 hours"
([källa](https://trunkbaseddevelopment.com/)). För kortlivade feature-brancher
är gränsen lika explicit: "the branch should only last a couple of days. Any
longer than two days, and there is a risk of the branch becoming a long-lived
feature branch", och "the developer count should stay at one (or two if
pair-programming)"
([källa](https://trunkbaseddevelopment.com/short-lived-feature-branches/)).

Martin Fowler formulerar samma golv som praktik: **"Everyone Pushes Commits To
the Mainline Every Day"**, med Kent Becks skarpare version — "No code sits
unintegrated for more than a couple of hours". Han sätter också bygg-tids-målet:
en tio-minuters commit-build är "perfectly within reason for most projects"
([källa](https://martinfowler.com/articles/continuousIntegration.html)).
Avgörande för vår fråga är hans gränsdragning: "Full mainline integration
requires that developers push their work back into the mainline" — en
feature-branch utan daglig push till mainline är semi-integration, inte CI.

I mönster-artikeln väger han riktningen: "Smaller integrations mean less work,
since there's less code changes that might hold up conflicts. But more
importantly than less work, it's also less risk", under principen "if it hurts…
do it more often"
([källa](https://martinfowler.com/articles/branching-patterns.html)).

DORA operationaliserar det i mätbara indikatorer: team med högre
leverans-prestanda "have three or fewer active branches in the application's
code repository", "merge branches to trunk at least once a day" och "don't have
code freezes and don't have integration phases". Brancherna "typically last no
more than a few hours"
([källa](https://dora.dev/capabilities/trunk-based-development/)).

### Vilken evidens vilar det på

Ärligt: **korrelation från självrapporterad enkätdata**, inte experiment.
DORA anger själva att slutsatsen bygger på analys av 2016- och 2017-årens
data, och sambandet är "associated with", inte kausalt bevisat
([källa](https://dora.dev/capabilities/trunk-based-development/)).
Trunk-based-sajtens 24-timmarsgräns är normativ praktikerkonsensus utan
publicerad mätning bakom. Fowlers siffror är erfarenhetsbaserade tumregler som
han själv presenterar som sådana. Evidensen är alltså stark i den meningen att
den är samstämmig över fyra oberoende källor och en stor urvalsbas — men den är
inte ett kontrollerat försök.

### Den distinktion som avgör vår fråga

Ingen av källorna rekommenderar att man **buntar lokala commits före push**.
Rekommendationen handlar genomgående om *integrationsfrekvens mot trunk*, och
den pekar åt ett håll: oftare. Antalet commits inuti en PR är en fråga om
historikens form, inte om integrationstakt — och ingen av primärkällorna har en
åsikt om den. Vår "en commit per PR" är därför inte i konflikt med någon
skriven rekommendation; den ligger vid den frekventa änden av det källorna
förordar.

En sak i Fowlers text pekar dessutom direkt på vår merge-grind: förhands-review
"introduces some latency into the integration process, encouraging a lower
integration frequency". Vår ruleset kräver PR men **0 approvals** — vi har
alltså behållit grindens spårbarhet utan att betala dess latens-kostnad. Det är
en icke-trivial designstyrka som är värd att skriva ned innan någon "förbättrar"
den till 1 approval.

---

## 2. Granularitet per PR och granskningskvalitet

### Googles skrivna praxis

Googles ingenjörspraxis ger de mest citerade siffrorna: "100 lines is usually a
reasonable size for a CL, and 1000 lines is usually too large, but it's up to
the judgment of your reviewer". Spridningen räknas in: "A 200-line change in one
file might be okay, but spread across 50 files it would usually be too large".
Definitionen av "liten" är kvalitativ, inte numerisk — "one self-contained
change" som "makes a minimal change that addresses just one thing"
([källa](https://google.github.io/eng-practices/review/developer/small-cls.html)).

Motiveringen är sju punkter, varav två är direkt relevanta för oss:
granskningen blir snabbare ("It's easier for a reviewer to find five minutes
several times to review small CLs than to set aside a 30 minute block") och
defekt-risken sjunker ("Less likely to introduce bugs. Since you're making fewer
changes, it's easier for you and your reviewer to reason effectively about the
impact of the CL"). Undantagen är två och smala: radering av en hel fil räknas
som en rads ändring, och maskinell refaktorering där granskarens jobb bara är
att bekräfta avsikten.

### Vad mätdatan faktiskt visar

Rigby och Bird mätte peer review över Android, Chromium OS, Bing, Office,
MS SQL, interna AMD-projekt samt sex open source-projekt, och fann att
parametrarna konvergerar trots drastiskt olika kulturer och incitament. Den
uppmätta medianändringen i open source-projekten ligger på **11–32 rader**, och
granskningens effektivitet degraderar med patch-storleken
([källa](https://dl.acm.org/doi/10.1145/2491411.2491444);
[PDF](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/rigby2013convergent.pdf)).

**Deklaration:** PDF:en gick inte att extrahera till läsbar text i detta pass
(binärt innehåll). Siffrorna 11–32 rader och degraderings-påståendet är hämtade
ur sekundär återgivning av samma artikel, inte lästa i originalets resultat-
sektion. Behandla dem som starkt indikativa men inte primärverifierade här.

Meta är intressant i det NEGATIVA: deras eget teknikblogginlägg om
granskningstid ger **inga** siffror om diff-storlek mot granskningstid alls.
Det de mäter är "Time In Review" — P50 på några timmar, P75 upp till ett dygn —
och deras interventioner riktar sig mot granskar-tillgänglighet och
tilldelning, inte mot ändringsvolym
([källa](https://engineering.fb.com/2022/11/16/culture/meta-code-review-time-improving/)).

### Finns ett empiriskt optimum i antal rader?

**Nej.** Det ärliga svaret på den frågan är att det inte finns ett belagt
optimum, och tre skilda saker blandas rutinmässigt ihop:

| Typ | Siffra | Vad det faktiskt är |
|---|---|---|
| Uppmätt median | 11–32 rader (Rigby & Bird) | Deskriptiv observation av vad team gör |
| Heuristiskt riktmärke | ~100 rader (Google) | Normativ tumregel, explicit delegerad till granskarens omdöme |
| Heuristiskt tak | ~1000 rader (Google) | Gräns för "usually too large", inte en mätt brytpunkt |

Google säger själva "it's up to the judgment of your reviewer" — vilket är en
skriven avsägelse av att siffran är ett optimum. Den robusta slutsatsen är
riktnings-baserad, inte punkt-baserad: **mindre är bättre, monotont, ned till
storleksordningen tiotals rader**, och en självständig ändring är ett bättre
snitt än ett radantal.

### Agent-dimensionen — den enda färska mätdatan

En arXiv-artikel från Meta (2026) om deras automatiserade granskningssystem
rapporterar siffror som är direkt relevanta för multi-agent-arbete: "significant
lines of code per human landed diff increased by +105.9% year over year and
diffs per developer per month increased by 51% year over year", med "80%+ of
that increase attributed to agentic AI assistance". Samtidigt sjunker andelen
diffar som granskas inom 24 timmar
([källa](https://arxiv.org/html/2605.30208v1)).

DORA:s 2025-rapport drar samma slutsats från andra hållet och formulerar
motmedlet explicit: "Enforcing the discipline of working in small batches is a
critical countermeasure to the risks of AI-assisted development" — eftersom
"higher AI adoption is associated with an increase in both software delivery
throughput and software delivery instability"
([källa](https://dora.dev/insights/balancing-ai-tensions/)).

**Det är den starkaste enskilda evidensen i hela passet för att INTE gå mot
färre och större PR:er.** Vår faktiska volym — nio små landningar på en dag —
är exakt den disciplin DORA rekommenderar som motmedel mot agent-driven
instabilitet. Att bunta ihop dem för att spara CI-minuter vore att byta bort
den kontrollen mot en driftskostnad.

---

## 3. Kostnadsdimensionen

### `[skip ci]` — mekaniken finns och är oanvändbar för oss

GitHub dokumenterar nyckelorden `[skip ci]`, `[ci skip]`, `[no ci]`,
`[skip actions]`, `[actions skip]` samt trailern `skip-checks: true`. Men den
avgörande meningen är denna: om ett arbetsflöde hoppas via commit-meddelande så
"checks associated with that workflow will remain in a 'Pending' state", vilket
blockerar merge när checken är required — och lösningen är att pusha en ny
commit utan skip-instruktionen
([källa](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs)).

Vår merge-grind har en required check. **`[skip ci]` är därmed direkt
oförenligt med vårt flöde** och ska inte utredas vidare — det byter en
CI-körning mot en låst PR som kräver ännu en push.

### `concurrency` — vad vår nuvarande konfiguration faktiskt gör

GitHubs semantik: bara ett jobb per concurrency-grupp kör åt gången;
`cancel-in-progress: true` avbryter även den pågående körningen. Standardläget
`queue: single` tillåter högst EN väntande körning i gruppen, `queue: max`
tillåter upp till 100 — och kombinationen `queue: max` med
`cancel-in-progress: true` är förbjuden. FIFO-ordning eftersträvas men
garanteras inte
([källa](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#concurrency)).

Läst mot disk ser vårt läge ut så här:

- `ci.yml` har `group: ${{ github.workflow }}-${{ github.event.number || github.sha }}`
  med `cancel-in-progress: true`. Gruppen är alltså **per PR** — den dämpar
  upprepade pushar till SAMMA PR och gör ingenting mellan olika PR:er.
- `ci-suite.yml` har staging-jobbet på `group: staging-tests`, en global
  konstant sträng, med `cancel-in-progress` medvetet osatt (kommentaren i filen
  anger `queue: max`-kravet som skäl). `timeout-minutes: 12`.

Slutsatsen är obekväm men klar: **`cancel-in-progress` löser inte vårt problem.**
Fyra parallella agenter som pushar var sin PR ger fyra grupper, alltså fyra
serialiserade staging-körningar i mutex-kön. Dämpningen träffar bara det
scenario vi redan har minst av — flera pushar till en och samma PR.

### Den kostnad som faktiskt skalar: strict up-to-date

GitHubs egen dokumentation säger rakt ut vad strict-läget kostar: "More builds
may be required, as you'll need to bring the head branch up to date after other
collaborators update the target branch"
([källa](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)).

Det är den verkliga kostnadsdrivaren i vår uppställning, och den skalar med
**antalet samtidigt öppna PR:er**, inte med push-frekvensen. Fyra parallella
agenter betyder att varje landning kan göra de tre övriga inaktuella. Att sänka
push-frekvensen åtgärdar inte detta alls; att sänka antalet samtidiga öppna
PR:er gör det.

### Merge queue — GitHubs dokumenterade svar på exakt detta

Merge queue är designad för att "increase velocity by automating pull request
merges into a busy branch", och GitHub pekar ut användningsfallet: "particularly
useful on branches that have a relatively high number of pull requests merging
each day from many different users". Kön skapar tillfälliga
`gh-readonly-queue/{base_branch}`-brancher som valideras i grupp, och den tar
bort behovet av manuell rebase-och-vänta
([källa](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue)).

Två varningar från samma dokumentation: arbetsflöden måste triggas på
`merge_group` — vanliga `pull_request`-triggers kör inte för köade PR:er, vilket
ger fallerande checkar. Och GitHub gör inget kostnadslöfte; det som finns är en
inställning för "Build concurrency" (1–100).

Nettot för oss: merge queue tar bort rebase-omkörningarna och kan validera flera
PR:er i EN grupp — men den kräver att alla arbetsflöden får en `merge_group`-
trigger och den måste stämmas av mot vår `ADR-077`-dedup, som är byggd på
antagandet att merge-commitens träd är identiskt med PR-headens tack vare just
strict up-to-date.

### Vad vi redan har och som är starkare än de flesta

Två mekanismer i repot är värda att räkna in innan något nytt byggs:

1. **Innehållsadresserad merge-dedup** (`ci.yml`, task-36.4 / ADR-077): på en
   main-push jämförs merge-commitens träd med den mergade PR-headens träd, och
   de tunga jobben hoppas ENDAST om träden är identiska och den SHA:n redan har
   en grön körning. Fail-closed på varje avvikelse. Det halverar i praktiken
   kostnaden per landning utan att släppa igenom otestat.
2. **Aggregator-checken "CI Passed or Skipped"** som alltid rapporterar
   (ADR-076). Den är förutsättningen för att jobb ska kunna hoppas internt med
   `if:` utan att required-checken fastnar i Pending — samma fälla som gör
   `[skip ci]` obrukbart.

**Skriven praxis för att väga push-frekvens mot CI-kostnad finns inte hos
GitHub.** Det de dokumenterar är fyra separata mekanismer (skip-instruktioner,
concurrency, merge queue, sökvägsfilter) och ingen vägledning om när frekvensen
i sig ska sänkas. Det saknas alltså en primärkälla som säger "pusha mer sällan"
— vilket i sig är ett svar.

---

## 4. Agent-drivna arbetsträd — hur tunn är precedent-rymden?

**Deklaration, öppet: precedent-rymden är tunn, men inte tom — och den är
tunnare på REGLER än på MEKANIK.** Fyra leverantörer dokumenterar hur deras
agenter hanterar efemära arbetsytor. Ingen av dem publicerar en kadens-regel
("pusha var N:e minut", "committa vid varje delmål"). Vi ärver alltså inte
någons regel — men vi kan ärva två väl dokumenterade strategier.

### Anthropic — den starkaste primärkällan, och den mest användbara

Claude Codes worktree-dokumentation är explicit om durabiliteten, och den
falsifierar vår premiss:

> "Each subagent gets a temporary worktree that Claude Code removes
> automatically when the subagent finishes without changes; a worktree with
> changes stays on disk until the periodic sweep below can remove it without
> losing work."
>
> "The sweep skips a worktree that still holds work: changed or untracked
> files, or unpushed commits."

Dessutom: `git worktree lock` sätts på arbetsträdet medan agenten kör, svepet
styrs av `cleanupPeriodDays` (standard 30 dagar — vår `.claude/settings.json`
sätter den inte, alltså gäller standardvärdet), icke-interaktiva `-p`-körningar
städas **inte** alls, och ett smutsigt arbetsträd kräver
`git worktree remove --force` för att försvinna
([worktrees](https://code.claude.com/docs/en/worktrees);
[settings](https://code.claude.com/docs/en/settings)).

Interaktiva sessioner varnar dessutom före radering: "Removing deletes the
worktree directory and its branch, along with all the work in them".

Och den mest direkta precedenten för vår fråga, från dokumentationen om
bakgrundssessioner:

> "A background session that isolated its code changes in a worktree also
> commits, pushes its own branch, and opens a draft pull request without
> stopping to ask. […] It never pushes to `main` or `master`, never
> force-pushes or merges, and it skips the pull request when you told it not to
> open one or the repository has no remote."

([källa](https://code.claude.com/docs/en/agent-view))

**Anthropics egen standard för en agent i ett isolerat arbetsträd är alltså:
committa, pusha en gång, öppna draft-PR, landa aldrig själv.** Det är påfallande
nära vår faktiska kadens — med skillnaden att deras PR öppnas som draft och att
commit-steget är obligatoriskt, inte valfritt.

### Cognition (Devin) — durabilitet löst i infrastrukturen, inte i git

Cognition beskriver problemet exakt som vårt och löser det på ett annat lager:

> "An agent opens a PR, waits on CI, responds to code review, reruns tests, and
> pushes a follow-up commit. Between each step, there are gaps — minutes, hours,
> sometimes days — where the agent must preserve its full working state."
>
> "We solved this by snapshotting full machine state at the hypervisor level —
> memory, process trees, and filesystem."

Skälet att containers inte räckte: "A containerized agent can only survive async
breaks by burning compute to stay alive — and if the container is rescheduled,
times out, or crashes, the session is lost." De noterar att detta tog längre tid
att bygga än någon annan del av deras infrastruktur
([källa](https://cognition.com/blog/what-we-learned-building-cloud-agents)).

Ingen vägledning om commit- eller push-frekvens ges — därför att de designat bort
behovet.

### OpenAI Codex och GitHub Copilot — mekanik utan kadens

Codex kör varje uppgift i en egen molnsandlåda, "commits its changes in its
environment" och exporteras sedan som PR eller dras ned lokalt; container-läget
cachas i upp till 12 timmar
([källa](https://developers.openai.com/codex/cloud)).

GitHubs kodande agent arbetar i "its own ephemeral development environment,
powered by GitHub Actions" och "automates branch creation, commit message
writing, and pushing"
([källa](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent)).
Ingen dokumenterad commit-frekvens, inget uttalande om draft-PR:er, ingen
vägledning om ofärdigt arbete.

### Vad tunnheten betyder

Två distinkta lösningsfamiljer finns skrivna, och de utesluter varandra:

| Strategi | Vem | Kostnad för oss |
|---|---|---|
| Infrastruktur-durabilitet (VM-snapshot) | Cognition | Ej tillgänglig — vi kör lokala arbetsträd |
| Git-durabilitet (commit + push + draft-PR) | Anthropic | Tillgänglig i dag, noll bygge |
| Odokumenterad | OpenAI, GitHub | — |

Eftersom snapshot-vägen är stängd för oss är git-vägen den enda kvarvarande, och
Anthropics dokumenterade standard är då den precedent vi bör luta oss mot — inte
för att den är bevisat optimal, utan för att det är den enda skrivna praxis som
gäller exakt vår uppställning. **Att skriva vår egen regel är alltså motiverat,
och den bör skrivas medvetet snarare än ärvas.**

---

## 5. Draft-PR-mekaniken

### Går det att hålla CI tyst på en draft-PR?

Ja, men inte som standard. GitHubs dokumentation anger att `pull_request` som
standard kör på aktivitetstyperna `opened`, `synchronize` och `reopened` — och
ingenstans undantas draft-PR:er
([källa](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request)).
**En draft-PR triggar alltså full CI som standard.** Draft-läget påverkar bara
mergebarhet: "No one can merge the pull request until you mark the pull request
as ready for review again"
([källa](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/changing-the-stage-of-a-pull-request)).

### Den exakta mekaniken

Två delar krävs, och båda behövs — den ena utan den andra ger en PR som aldrig
får sina checkar:

1. Villkoret per jobb: `if: github.event.pull_request.draft == false`. Fältet är
   dokumenterat på PR-objektet som en boolean — "Indicates whether the pull
   request is a draft"
   ([källa](https://docs.github.com/en/rest/pulls/pulls)).
2. Trigger-utökningen: `ready_for_review` måste läggas till i `types:`, annars
   kör ingenting när draften markeras klar. Aktivitetstyperna
   `ready_for_review` och `converted_to_draft` är båda dokumenterade
   ([källa](https://docs.github.com/en/webhooks/webhook-events-and-payloads#pull_request)).

### Vad det kostar i risk

Fyra poster, i fallande allvarlighet:

1. **Pending-fällan.** Ett hoppat jobb som är required check låser PR:en på
   samma sätt som `[skip ci]`. **För oss är fällan redan avväpnad** — vår
   required check är aggregator-jobbet "CI Passed or Skipped" som alltid
   rapporterar (ADR-076). Mönstret är alltså mekaniskt förenligt med vårt repo,
   till skillnad från `[skip ci]`.
2. **Sen återkoppling.** All verifiering flyttas från "per push" till en
   engångssmäll vid `ready_for_review`. Det är precis den latens-mot-frekvens-
   avvägning Fowler varnar för: förhands-granskning som "encourag[es] a lower
   integration frequency". Vinsten i CI-minuter betalas i senare
   felupptäckt.
3. **Interaktion med strict up-to-date.** Ju längre en draft ligger, desto större
   är chansen att den redan är inaktuell i det ögonblick den markeras klar —
   vilket ger ytterligare en omkörning ovanpå den man just sparade.
4. **Fakturering.** Ett hoppat jobb startar ändå en runner kort, och
   Actions-minuter avrundas uppåt till närmaste minut. *Detta är tredjepartsuppgift
   från GitHub-community-diskussion, inte verifierat mot GitHubs
   fakturerings-dokumentation i detta pass*
   ([tredjepart](https://github.com/orgs/community/discussions/25722)).

### Slutsats för oss

Mekaniken är sund och passar vår aggregator — men **den köper oss nästan
ingenting i nuläget**. Poängen med draft-tystnad är att kunna pusha ofta under
en lång utvecklingsfas utan att betala CI varje gång. Vi har ingen sådan fas:
agenterna öppnar PR:en i slutet av arbetet, med en commit. Draft-tystnad blir
relevant först om vi medvetet byter till "pusha tidigt, iterera på branchen" —
vilket vore ett större skifte än denna fråga gäller.

Vad som däremot är värt att ta över utan reservation är **draft-PR som form för
agent-arbete som ännu inte är granskat** — Anthropics dokumenterade standard.
Den signalerar tillstånd till en människa utan att kosta något.

---

## Vad det betyder för OSS

Hypotesen i uppdraget — att svaret skiljer sig mellan människa och agent —
stämmer, men inte där man skulle gissa. Skillnaden ligger inte i vilken
*integrationsfrekvens* som är rätt (den är densamma), utan i **vad en push
BETYDER**.

### Människo-kadens (Marcus och Code i huvudträdet)

**Inget behöver ändras.** Arbetsträdet är beständigt; en lokal commit överlever
maskinbyte, sessionsslut och kontextrot. Push är därför enbart en
integrations-handling, och den ska ske enligt golvet: minst dagligen, i praktiken
när arbetsenheten är grön.

Tre konkreta konsekvenser:

- **En commit per PR är inte en brist.** Källorna har ingen åsikt om antalet
  commits inuti en PR. Att "rätta" det till flera commits per PR vore
  kosmetika utan stöd.
- **Storleks-ribban är riktmärket, inte radantalet.** Google: ~100 rader som
  riktmärke, ~1000 som tak, "one self-contained change" som verkligt kriterium.
  Vår vertikala skivning (PRD-kort → skivor) producerar redan det snittet.
- **Push som "sparning" är den enda faktiska glidningen att stänga.** Varje
  push kostar en full svit och en plats i staging-mutexen; en push mitt i en
  ofärdig tanke betalar den kostnaden utan att köpa integration.

### Agent-kadens (subagenter i efemära arbetsträd)

Här ändras premissen, och därmed regeln. För en agent är push inte bara
integration — den har traditionellt behandlats som den enda durabla artefakten.
Men det är, per Anthropics dokumentation, **fel**: en commit räcker.

Det ger den avgörande separationen:

| Handling | Durabilitet | CI-kostnad | Rätt frekvens |
|---|---|---|---|
| `git commit` i arbetsträdet | Blockerar städ-svepet; överlever i delad `.git` | Noll | Vid varje färdig enhet |
| `git push` av branchen | Ger fjärr-durabilitet och granskbarhet | Full svit + mutex-plats | En gång, vid överlämning |

Med den separationen finns nästan ingen konflikt kvar mellan de två krafterna i
frågan. Durabiliteten köps med commit, som är gratis; kostnaden bärs bara av
push, som sker en gång per arbetsenhet. Att pusha oftare för durabilitetens
skull vore att betala för något commit redan ger.

Tre saker till, specifika för agent-formen:

- **Restrisken efter commit-utan-push är oupptäckbarhet, inte förlust.** Ett
  arbetsträd med opushade commits ligger kvar tills någon kör `--force` eller
  städar manuellt. Rätt motmedel är en **föräldralös-koll** vid sessionsavslut
  (`git worktree list`), inte högre push-frekvens.
- **`-p`-körningar är undantaget som behöver en egen rad.** Anthropics
  dokumentation är explicit: icke-interaktiva körningar har ingen exit-prompt
  och städas inte. De lämnar alltså efter sig — vilket är säkert för arbetet men
  slarvigt för disken.
- **Partitionerings-regeln kolliderar med commit-för-durabilitet.** Vår
  nuvarande praxis — som styrde detta pass — förbjuder agenter att köra
  git-kommandon alls, med orkestreraren som ensam ägare av landningen. Den
  regeln är sund för PUSH och MERGE. Den är kontraproduktiv för COMMIT, som är
  själva durabilitets-mekanismen. Det är den skarpaste konflikten passet hittat,
  och den kräver ett beslut (se öppna frågor).

Och som volym-ram: DORA:s 2025-slutsats gäller oss direkt — små batchar är
"a critical countermeasure to the risks of AI-assisted development", och Metas
data visar att agent-assistans ökar diff-volymen dramatiskt medan
granskningskapaciteten inte följer med. **Nio små PR:er om dagen från fyra
agenter är rätt form. Faran ligger i granskningsledet, inte i CI-räkningen.**

---

## Förslag till skriven regel

Ett utkast, formulerat för att kunna landa i `CONTRIBUTING.md` eller som ADR om
punkt 4 bedöms nå ADR-baren. Sju rader, varav fem är kodifiering av vad vi redan
gör och två är faktiska ändringar.

> ### Kadens-regeln
>
> 1. **Integrationsfrekvens.** Varje arbetsenhet landar på `main` samma dag den
>    blir grön. Ingen branch lever över natten. (Golv: trunk-based development
>    24 h; DORA högst tre aktiva brancher.)
>
> 2. **En PR bär en självständig ändring.** ~100 rader är riktmärket; över ~400
>    rader motiveras i PR-beskrivningen, inte i efterhand. Radantalet är en
>    proxy — kriteriet är "one self-contained change".
>
> 3. **Commit är gratis, push kostar.** Committa vid varje färdig enhet. Pusha
>    när enheten är klar att granskas. Push används aldrig som sparning.
>    *(Ändring: gör skillnaden explicit — den är i dag underförstådd.)*
>
> 4. **Agent i efemärt arbetsträd committar alltid före rapport** — även när
>    orkestreraren äger landningen. En ocommittad ändring existerar inte utanför
>    katalogen. Push, merge och landning förblir orkestrerarens.
>    *(Ändring: kräver att partitionerings-regeln öppnas för commit.)*
>
> 5. **Föräldralös-koll vid sessionsavslut.** `git worktree list` innan
>    sessionen stängs; arbetsträd med opushade commits eller otrackade filer
>    hanteras medvetet — behålls eller töms, aldrig tyst.
>
> 6. **`[skip ci]` används aldrig i detta repo.** Vår required check fastnar i
>    Pending och PR:en låses. Kostnadsdämpning sker via `concurrency`,
>    ADR-077-dedupen och riskklassningen — aldrig via skip-instruktioner.
>
> 7. **Draft-PR är formen för agent-arbete som ännu inte är granskat.** CI-
>    tystnad på draft (`if: github.event.pull_request.draft == false` plus
>    `ready_for_review` i `types:`) övervägs först om vi byter till att pusha
>    tidigt och iterera på branchen.

Regeln säger medvetet **ingenting** om antalet commits inuti en PR. Ingen
primärkälla har en åsikt om det, och en regel utan evidens bakom är en regel
som ingen försvarar när den blir obekväm.

---

## Öppna frågor

1. **Får agenter committa?** Punkt 4 i regelförslaget kräver att
   partitionerings-regeln öppnas för `git commit` i agentens eget arbetsträd,
   med push och merge fortsatt hos orkestreraren. Detta är ett väg-beslut för
   Marcus, inte ett Code-beslut — det rör decision rights, inte bara mekanik.
   Anthropics egen standard går längre än förslaget (deras bakgrundssessioner
   pushar och öppnar PR själva).

2. **Är staging-mutexen faktiskt bindande?** Passet fick inte köra git eller
   `gh`, så ingen mätning gjordes. Frågan som ska besvaras med data: hur många
   minuter per dag står körningar i `staging-tests`-kön, och hur ofta överlappar
   fyra agenters PR:er faktiskt i tiden? `timeout-minutes: 12` är taket, inte
   den uppmätta tiden. Utan den siffran är hela kostnadssidan uppskattad.

3. **Är merge queue värt det vid 7–11 PR:er per dag?** GitHub säger "relatively
   high number" utan siffra. Införandet kräver `merge_group`-trigger i samtliga
   arbetsflöden och en avstämning mot ADR-077-dedupen, som bygger på att strict
   up-to-date ger identiska träd. Kandidat för eget pass, inte för denna fråga.

4. **Stämmer lint-fix-anekdoten?** Premissen "den hade försvunnit med
   katalogen" motsägs av Anthropics dokumenterade svep-semantik. Frågan är
   falsifierbar mot disk: ligger arbetsträdet kvar? Om det gör det är slutsatsen
   "vi tittade inte efter", vilket pekar på punkt 5 i regelförslaget snarare än
   på push-frekvensen.

5. **Rigby & Bird-siffrorna.** 11–32 rader och storleks-degraderingen är inte
   primärverifierade i detta pass (PDF-extraktion misslyckades). Om siffran ska
   bära vikt i en ADR bör originalets resultatsektion läsas.

6. **Granskningsledet, inte CI-ledet.** Metas data visar att agent-assistans
   flyttar flaskhalsen till granskning. Vår ruleset kräver 0 approvals — vilket
   tar bort latensen men också granskningen. Det är en medveten avvägning som
   inte omprövats sedan ADR-076, och den ligger utanför denna frågas scope.

---

## Källförteckning

### Förstapartskällor

| Källa | URL | Använd för |
|---|---|---|
| Trunk Based Development | <https://trunkbaseddevelopment.com/> | 24-timmarsgolvet |
| Trunk Based Development — short-lived branches | <https://trunkbaseddevelopment.com/short-lived-feature-branches/> | Två-dagars-gränsen, en utvecklare per branch |
| Martin Fowler — Continuous Integration | <https://martinfowler.com/articles/continuousIntegration.html> | Daglig mainline-push, tio-minuters-bygget |
| Martin Fowler — Patterns for Managing Source Code Branches | <https://martinfowler.com/articles/branching-patterns.html> | Integrationsfrekvens, review-latens |
| DORA — Trunk-based development | <https://dora.dev/capabilities/trunk-based-development/> | Tre aktiva brancher, daglig merge, evidensgrund |
| DORA — Balancing AI tensions (2025) | <https://dora.dev/insights/balancing-ai-tensions/> | Små batchar som motmedel, genomströmning mot instabilitet |
| Google Engineering Practices — Small CLs | <https://google.github.io/eng-practices/review/developer/small-cls.html> | 100/1000-raders-riktmärkena, undantagen |
| GitHub Docs — Skip workflow runs | <https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs> | Nyckelorden och Pending-fällan |
| GitHub Docs — Workflow syntax, concurrency | <https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#concurrency> | `queue`-lägen, `cancel-in-progress` |
| GitHub Docs — About protected branches | <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches> | Strict up-to-date-kostnaden |
| GitHub Docs — Managing a merge queue | <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue> | Merge queue, `merge_group`-kravet |
| GitHub Docs — Events that trigger workflows | <https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request> | Standard-aktivitetstyper |
| GitHub Docs — Webhook events and payloads | <https://docs.github.com/en/webhooks/webhook-events-and-payloads#pull_request> | `ready_for_review`, `converted_to_draft` |
| GitHub Docs — REST API, pulls | <https://docs.github.com/en/rest/pulls/pulls> | `draft`-fältet |
| GitHub Docs — Changing the stage of a pull request | <https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/changing-the-stage-of-a-pull-request> | Draft-läget och mergebarhet |
| GitHub Docs — About coding agent | <https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent> | Efemär miljö, automatisk push |
| Claude Code Docs — Worktrees | <https://code.claude.com/docs/en/worktrees> | Svep-semantik, lås, `--force` |
| Claude Code Docs — Agent view | <https://code.claude.com/docs/en/agent-view> | Bakgrundssessioners commit/push/draft-PR-standard |
| Claude Code Docs — Settings | <https://code.claude.com/docs/en/settings> | `cleanupPeriodDays` standard 30 |
| OpenAI — Codex cloud | <https://developers.openai.com/codex/cloud> | Sandlåde-commit, 12-timmarscache |
| Cognition — What we learned building cloud agents | <https://cognition.com/blog/what-we-learned-building-cloud-agents> | Hypervisor-snapshot som durabilitets-strategi |

### Peer-reviewad forskning och preprint

| Källa | URL | Status |
|---|---|---|
| Rigby & Bird, *Convergent contemporary software peer review practices*, ESEC/FSE 2013 | <https://dl.acm.org/doi/10.1145/2491411.2491444> | Peer-reviewad. Siffrorna 11–32 rader ej primärverifierade i detta pass |
| RADAR — automatiserad granskning hos Meta (2026) | <https://arxiv.org/html/2605.30208v1> | arXiv-preprint, ej peer-reviewad |

### Tredjepart (markerad som sådan)

| Källa | URL | Använd för |
|---|---|---|
| Meta Engineering — Move faster, wait less | <https://engineering.fb.com/2022/11/16/culture/meta-code-review-time-improving/> | Förstaparts-blogg om egen praxis; använd för NEGATIVT fynd (ingen storleksdata) |
| GitHub community-diskussion #25722 | <https://github.com/orgs/community/discussions/25722> | Fakturerings-avrundning vid hoppade jobb — ej verifierad mot GitHubs fakturerings-dokumentation |

### Läst från disk (vårt eget tillstånd)

- `.github/workflows/ci.yml` — concurrency-grupp per PR; ADR-077-dedupen
- `.github/workflows/ci-suite.yml` — `staging-tests`-mutexen, `timeout-minutes: 12`
- `.claude/settings.json` — `cleanupPeriodDays` ej satt, standardvärdet gäller
