---
owner: marcus803
updated: 2026-08-05
review_by: 2027-02-05
status: stable
---

# Handoff-kontraktet mellan orkestrerare och underagent vid långsamt arbete — och hur branschen förhindrar parkering (Code, 2026-08-05)

> **Proveniens:** avgränsat research-pass, 2026-08-05, beställt efter tre
> mätta instanser av samma felklass (`L323`, `L340`, samt tre agenter
> samma dag som parkerade på egna lokala grindar — ~700k tokens brända på
> väntan som strukturellt inte kunde brytas). Kört **oisolerat** i
> huvudkatalogen; ingen kod, config eller kort rört — enda skrivningen är
> denna fil. Ingen commit.
>
> **Arbetsform för detta pass självt:** allt kördes i förgrund. Ingen
> `run_in_background`, ingen `Monitor`, ingen väntan på asynkron signal —
> exakt den disciplin passet undersöker.

---

## Kort svar

**Branschens svar är entydigt på en punkt och tunt på en annan.**

Entydigt: **hos varje undersökt system som löst "en aktör måste vänta på
långsamt arbete utan att processen som väntar behöver leva hela tiden" —
Temporal, AWS Step Functions, Apache Airflow, LangGraph — ligger väntan
**strukturellt i ett annat lager** än utföraren.** Temporals Workflow väntar
på Signals; Activities gör det avgränsade jobbet och returnerar. AWS Step
Functions state machine håller task-token:et och väntar; den anropade
tjänsten returnerar direkt och en **annan** process ringer tillbaka med
`SendTaskSuccess`. Airflows triggerer äger väntan och frigör workerns slot
helt. LangGraphs checkpointer sparar tillståndet **innan** `interrupt()`
pausar grafen, så själva processen kan dö utan att arbetet försvinner.
**Vårt mönster — orkestreraren äger väntan, subagenten gör sitt jobb och
returnerar — är alltså inte en lokal kompromiss. Det är samma arkitektur
som fyra oberoende, mogna system, applicerad på vår skala.**

Tunt, och detta är den delfråga som faktiskt avgjorde utfallet: **exakt hur
en underagent SKA bete sig när den inte hinner klart i sin egen tur** är
dåligt dokumenterat hos alla LLM-agent-ramverk (Claude Code/Agent SDK,
LangGraph, AutoGen, CrewAI, OpenAI Agents SDK). Ingen av dem beskriver ett
sanktionerat "checkpointa och returnera partiellt"-protokoll för en
delegerad agent i egentlig mening. Det som FINNS, och som är den starkaste
enskilda upptäckten i detta pass, är att **Anthropics egen harness redan
gör parkering STRUKTURELLT omöjlig för tre av fyra async-vägar** — inte
genom instruktion, utan genom att inte ge subagenten verktygen alls.
Den fjärde vägen (`Monitor`) är den enda kvarvarande luckan, och den är
**mätt öppen hos oss** (`L340`) trots att verktyget formellt finns kvar i
subagentens verktygslista. Det är den lucka detta pass rekommenderar att
stänga.

---

## Avgränsning mot befintlig research — vad som redan var täckt

Två pass lästes i sin helhet före detta:

- **`orkestrerar-vackning-polling-vs-event-driven-2026-08-02.md`** täcker
  **orkestrerarens** väckning mot GitHub (polling vs. event-driven). Noll
  träffar på "subagent" — bekräftat genom att läsa hela filen. Den andra
  sidan av gränssnittet (underagentens situation) var alltså faktiskt
  outforskad, precis som beställningen antog.
- **`agent-autonomi-eskaleringsdesign-2026-07-29.md`** etablerade redan,
  mätt mot Claude Code 2.1.220: **`AskUserQuestion` saknas strukturellt i
  subagenter** ("jag som skriver detta kan strukturellt inte avbryta
  Marcus"), att `defer` "ends the query so you can resume it later" (billigare
  blockering, inte ett tredje läge), och att **strukturerad note-taking till
  fil** är den enda genuina branschprecedenten för ett icke-blockerande
  mellanläge. Detta pass återanvänder de tre fynden som givna och bygger
  vidare på dem snarare än att mäta om dem. Nytt här: **varför** subagenter
  saknar de verktygen (strukturell filtrering, verifierad ur källtext),
  och en konkret mekaniseringsväg för luckan `agent-autonomi` inte
  undersökte (`Monitor`).

Övriga sju filer skannades (`agent-instruktionsfiler-branschpraxis`,
`kodfils-partitionering-parallella-agenter`,
`sessions-parallellitet-frontier-praxis`, `harness-namnrymd-agenter`,
`nummerallokering-parallella-aktorer`, `push-kadens-agent-arbetstrad`,
`parallell-e2e-mot-delad-backend`) — ingen behandlar handoff-kontraktet vid
väntan; överlappen är ytlig (ordet "subagent" förekommer, men i andra
sammanhang: worktree-namngivning, kodfils-kollisioner, nummerallokering).
Ingen duplicering identifierad.

---

## 1. Handoff-kontraktet hos etablerade multi-agent-ramverk

### 1.1 Claude Code / Agent SDK — den miljö vi faktiskt kör i

Mätt mot lokalt installerad `claude --version`: **2.1.222**, samma
version dokumentationssidorna nedan refererar i sina egna
"As of v2.1.xxx"-noter — dokumentationen är alltså samtida med binären,
inte förlegad.

**Sanktionerad form när en underagent inte hinner klart:** det finns
ingen. En vanlig namngiven subagent (till skillnad från en `Workflow`)
har inget checkpoint-protokoll för att pausa och återuppta sig själv.
Källkodsciterat ur `sub-agents`-dokumentationen (`code.claude.com/docs/en/sub-agents`,
hämtad rått via `curl` mot `.md`-varianten för att undvika sammanfattnings-
risken i `WebFetch`s mindre modell):

> "Subagents inherit the built-in tools and MCP tools available in the
> main conversation, narrowed by two filters: the first removes a short
> list of tools from every subagent... The first filter removes these
> tools, even when listed in the `tools` field:
> `Agent` [vid djup-gräns] · `AskUserQuestion` · `EndConversation` ·
> `EnterPlanMode` · `ExitPlanMode` [om ej `permissionMode: plan`] ·
> `ScheduleWakeup` · `TaskOutput` · `WaitForMcpServers` · `Workflow`"

Detta är passets skarpaste enskilda fynd. Fyra av de nio strukturellt
borttagna verktygen — `ScheduleWakeup`, `TaskOutput`, `WaitForMcpServers`,
`Workflow` — är **exakt de verktyg som förutsätter att en "senare tur"
existerar för agenten att vakna in i**. Anthropic har alltså redan
identifierat och kodifierat precis den princip vi lärde oss den dyra vägen:
**en subagent har ingen framtida tur att bli väckt i, så inget verktyg
som lovar en väckning ska finnas i dess verktygslåda.** Det är inte en
instruktion — verktygen är fysiskt borta, "even when listed in the `tools`
field".

`TaskOutput` självt är dessutom **deprecated på orkestrerar-sidan** också,
till förmån för en fil-läsande form:

> "`TaskOutput` — Retrieves output from a background task. Deprecated in
> favor of `Read` on the task's output file path."

Det är en oberoende bekräftelse av write-ahead-principen (§4): branschens
egen harness-leverantör flyttar SJÄLV bort från "fråga en live-kanal om
resultatet" och mot "läs resultatet ur en fil som redan skrevs" — samma
riktning som Temporals event-historia och Step Functions task-token.

**Luckan:** `Monitor` är INTE i borttagningslistan. Ur samma källa, om
verktyg kvar i en **bakgrunds**-subagent:

> "a background subagent keeps every MCP tool but only these built-in
> tools: `Read`, `Grep`, `Glob`, `Bash`, `PowerShell`, `Edit`, `Write`,
> `NotebookEdit`, `WebFetch`, `WebSearch`, `TodoWrite`, `Skill`,
> `ToolSearch`, `EnterWorktree`, `ExitWorktree`, `Monitor`, `TaskStop`,
> `SendMessage`, and `Artifact`."

`Monitor` är alltså **listad och anropbar** för en subagent — men vår
egen mätning (`L340`, given i uppdraget) visar att callbacken den lovar
aldrig levereras till en subagent. Det är gapet mellan "verktyget finns i
listan" och "leveransmekanismen finns i harnessen", och det är exakt
gapet tre agenter föll i idag. Se § 5 för mekaniseringsförslaget.

**Vad ORKESTRERAREN får som subagenten inte får:** en bakgrunds-subagents
resultat når föräldern som en "completion notification i en senare tur" —
men bara föräldern har en sådan tur att bli väckt in i:

> "A background subagent's results reach Claude as a completion
> notification in a later turn. Claude waits for that notification before
> reporting the subagent's results, and if you ask about progress first,
> it reports that the subagent is still running."

Detta BEKRÄFTAR vårt CLAUDE.md-mönster ("orkestreraren äger väntan") som
den sida av gränssnittet harnessen faktiskt byggt stöd för — inte som en
policy vi valt i brist på alternativ, utan som den enda sida av
gränssnittet som har en fungerande väckningsmekanism överhuvudtaget.

**Auto-bakgrunds-fällan — ny, allvarlig nyansering.** Även en subagent som
ALDRIG explicit ber om `run_in_background: true` kan hamna i samma fälla,
mätt ur `tools-reference`:

> "When a command reaches its timeout without finishing, Claude Code
> moves it to the background instead of stopping it, so Claude keeps
> working while the command runs to completion."

Med `BASH_DEFAULT_TIMEOUT_MS` på 2 minuter och `BASH_MAX_TIMEOUT_MS` på 10
minuter som tak ("two minutes out of the box" / "ten minutes out of the
box") kan alltså ett **synkront** foreground-anrop — t.ex. en subagent som
kör `npm run verify:ci-parity` (dokumenterat i detta repos CLAUDE.md som
"tar god stund") — tystnat konverteras till exakt samma
inget-väckningskanal-läge, utan att subagenten bett om något
bakgrundsläge alls. Den enda dokumenterade helavstängningen är
`CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1`, men den är en processvid
miljövariabel — den går inte att sätta bara för subagent-kontext utan att
också ta bort orkestrerarens egna, fungerande bakgrunds-subagent-mönster.

**Ordagrant Workflow-mekanismens egna checkpoint-gräns** (`workflows.md`,
hämtad direkt): en `Workflow` — Anthropics EGEN lösning på "orkestrera
långsamt arbete över många agenter" — har ett resume-protokoll, men det
är svagare än Temporals event-replay och läcker exakt vår felklass:

> "An agent that was still running when you stopped isn't saved, so it
> starts over on resume." ... "Replay follows the order agents started.
> Cached results stop at the first agent that didn't finish, and every
> agent that started after that one runs again, even if it completed."

och avgörande för vår "processen dog"-klass:

> "Resume works within the same Claude Code session. If you exit Claude
> Code while a workflow is running, the next session starts the workflow
> fresh."

**Detta är ett fynd utanför den ställda frågan, värt att registrera
explicit (ADR-053-triage: värdefullt, ej blockerande, defereras här):**
även Anthropics egen mest avancerade orkestreringsprimitiv förlorar allt
arbete om SESSIONEN (inte bara subagenten) dör medan ett workflow kör.
Den är alltså inte en väg mot äkta durable execution för oss — den är en
bättre in-session-parallellisering, inte ett svar på "processen kan dö
mitt i".

### 1.2 LangGraph — checkpoint FÖRE paus, inte efter

Officiell dokumentation (`docs.langchain.com/oss/python/langgraph/interrupts`),
citerad ordagrant via fetch:

> "Graph execution gets suspended at the exact point where `interrupt` is
> called." ... "State is saved using the checkpointer so execution can be
> resumed later." ... "Graph waits indefinitely until you resume execution
> with a response."

Ordningen är bärande: **state skrivs FÖRE pausen är klar**, inte som en
eftertanke om agenten råkar hinna committa innan den kraschar. Resume
kräver samma `thread_id` och läser tillbaka från checkpointern (Postgres i
produktion; `InMemorySaver` är uttryckligen inte restart-durabel).

**En dokumenterad gotcha, värd att bära vidare:** "the node restarts from
the beginning of the node where the `interrupt` was called when resumed,
so any code before the `interrupt` runs again." Kod före en paus måste
alltså vara idempotent eller sidoeffektfri — samma krav Temporal ställer
på Activities (§3), oberoende härlett i ett annat ramverk.

### 1.3 OpenAI Agents SDK — handoffs löser ett ANNAT problem

Officiell dokumentation (`openai.github.io/openai-agents-python/handoffs/`):
"Handoffs stay within a single run." Handoff är **kontroll-överlämning
inom samma exekvering** (triage → specialist), inte ett svar på "agenten
måste vänta på något långsamt". Relevant som negativt fynd: SDK:t har
ingen egen checkpoint/resume-primitiv för väntan — det problemet ligger
utanför dess scope och lämnas åt den anropande applikationen.

### 1.4 AutoGen (Microsoft) och CrewAI — sekundär bekräftelse, inget nytt mönster

**AutoGen** har `HandoffTermination` och `ExternalTermination` för att
pausa en körning och lämna kontroll till applikationen/användaren, samt en
nativt async API. Inget dokumenterat checkpoint-till-disk-protokoll
hittades. **CrewAI** har `kickoff_async()`/`akickoff()` (icke-blockerande
start) och per-task `async_execution` samt callbacks som triggas vid
task-slut — closer till "notifiera vid färdigt" än till "återuppta ett
avbrutet arbete". Ingen av de två tillför ett mönster utöver vad Claude
Code/LangGraph redan visar; de bekräftar bredden (fyra ramverk, samma
lucka) snarare än att fylla den.

### 1.5 A2A-protokollet (Google, nu Linux Foundation) — det enda ramverket med en NAMNGIVEN icke-blockerande delstatus

A2A-protokollets specifikation (`a2a-protocol.org/latest/specification/`)
definierar en task-livscykel med sju tillstånd, inklusive:

> "`TASK_STATE_INPUT_REQUIRED`: the agent requires additional user input to
> proceed. This is an interrupted state" ... "`TASK_STATE_WORKING`: a task
> is actively being processed by the agent."

och tre leveransvägar för statusuppdateringar — polling (`tasks/get`),
streaming, och **push-notifikationer** ("the agent sends HTTP POST
requests to client-registered endpoints when task state changes"). Detta
är det enda undersökta ramverket som ger den väntande sidan ett **namngivet
tillstånd** ("jag väntar, inte jag är klar, inte jag har fel") snarare än
antingen tystnad eller ett slutresultat. A2A är ett protokoll för
cross-vendor agent-till-agent-kommunikation, inte ett harness vi kör —
relevansen är arkitektonisk (namngiven mellanstatus), inte direkt
applicerbar på vår Claude Code-miljö.

---

## 2. Vem äger långsamt arbete i mogna system?

**Svaret är entydigt, men nyanserat på en punkt värd att hålla isär:** det
är inte "orkestreraren" i meningen "den mänskliga sessionen" som äger
väntan hos de mogna systemen — det är **den durabla, tillstånds-bärande
koordinatorn**, vilken kan vara en helt annan process än den som gör
själva arbetet.

- **Temporal:** Workflow (durabel, replayable) väntar på Signals. Activity
  (worker-exekverad, kan vara icke-deterministisk) gör jobbet och
  returnerar.
- **AWS Step Functions:** state machine-exekveringen håller task-token:et
  och väntar (upp till ett år). Den anropade tjänsten returnerar
  omedelbart.
- **Airflow:** triggerern äger väntan och kör asynkront kod i EN process
  för många väntande tasks samtidigt; workern som startade tasken är fri
  igen.
- **LangGraph:** checkpointern (databasen) äger det sparade tillståndet;
  själva graf-processen behöver inte leva.

**Översatt till vår kontext:** "orkestreraren äger väntan" är rätt
förenkling så länge orkestreraren FAKTISKT är den durabla, längre-levande
parten — vilket den är hos oss (den interaktiva sessionen överlever
turgränser; en subagent gör det inte). Distinktionen som är värd att
minnas är alltså inte "vem är chef" utan **"vem lever längre än
väntetiden"** — och svaret på den frågan råkar hos oss vara orkestreraren,
inte av hierarki utan av arkitektur.

**Finns system där agenten själv äger väntan?** Inget av de sju
undersökta hittades göra det som huvudmönster. Det närmaste är Temporals
och Step Functions egen "worker"/"activity"-nivå när den explicit
polling:ar EFTER egen förfrågan (`.sync`-integrationer, § 3) — men även
där är det den **anropande** parten (state machine / workflow) som håller
den faktiska väntan; workern som utför jobbet gör det och lämnar tillbaka
kontrollen.

---

## 3. Durable execution / workflow-motorer som prior art

Detta är, som beställningen förutspådde, passets mest värdefulla
delfråga — tre oberoende, mogna motorer, alla primärkälle-citerade.

### 3.1 Temporal — namngav själva begreppet "durable execution"

> "Durable Execution ensures that your application behaves correctly
> despite adverse conditions by guaranteeing that it will run to
> completion." ... "if a crash occurs then the state of your
> application's execution is lost" [utan mekanismen] ... "if the Worker
> crashes, the Worker uses the Event History to replay the code and
> recreate the state of the Workflow Execution to what it was immediately
> before the crash."

(`docs.temporal.io/evaluate/understanding-temporal`, hämtad direkt)

Mekaniken är **event sourcing**, inte process-överlevnad: arbetet
överlever inte för att processen hölls vid liv, utan för att varje steg
skrevs till en append-only logg NÅGON ANNAN kan spela upp. Det är den
strukturella lösningen på exakt vår klass av fel ("processen dog med
färdigt arbete").

**Human-in-the-loop-mönstret** (Temporals eget AI-cookbook,
`docs.temporal.io/ai-cookbook/human-in-the-loop-python`) placerar väntan
i Workflow-lagret, inte i Activity-lagret:

> "We use a Temporal Signal to inject information from the human into the
> waiting Workflow." ... "Durable timers: Time limits placed on
> human-in-the-loop steps survive any execution disruptions." ... "Can
> wait for approval for hours, days or indefinitely; while waiting, the
> agent consumes no compute resources."

**Aktivitet vs. Workflow, den bärande distinktionen** (`docs.temporal.io/activities`,
`docs.temporal.io/workflows`):

> "Activities handle everything that interacts with the outside world,
> like: API calls, Database queries, LLM invocations, File I/O." ... "An
> Activity is a normal function or method that executes a single,
> well-defined action (either short or long running)... Activity code can
> be non-deterministic."

Notera vad dokumentationen INTE säger rakt ut: att Activities är strukturellt
förbjudna att vänta på signaler. Det de FAKTISKT visar, genom att placera
`wait_condition` och Signal-mottagning i cookbook-exemplets **Workflow**-kod,
är att **det är där branschens egen referensimplementation lägger väntan** —
en observerad konvention, inte en hård spärr i API:et. Detta noteras
explicit som en SLUTSATS jag drar, inte ett citat jag har för det starkare
påståendet.

**At-least-once och idempotens** — direkt relevant för §4:

> "Activities follow an at-least-once execution model... it's strongly
> recommended to make them idempotent... You can create an idempotency key
> by combining the Workflow Run ID and Activity ID."

### 3.2 AWS Step Functions — task-token är den renaste "checkpointa och lämna tillbaka"-formen

Officiell dokumentation (`docs.aws.amazon.com/step-functions/latest/dg/connect-to-resource.html`),
citerad direkt:

> "Callback tasks provide a way to pause a workflow until a task token is
> returned. A task might need to wait for a human approval, integrate
> with a third party, or call legacy systems... The task will pause until
> it receives that task token back with a SendTaskSuccess or
> SendTaskFailure call."

Mekaniken i tre steg: (1) state machine genererar ett token och pausar,
(2) en HELT ANNAN process (t.ex. en extern kökonsument) gör jobbet, (3)
den processen ringer tillbaka med token + resultat, och EXEKVERINGEN,
inte workern, fortsätter. **Ingen aktör "väntar" i meningen att en process
håller ett minne upptaget** — state machine-exekveringen är i sig en
persisterad post, inte en levande tråd.

**Heartbeat-timeout** förhindrar exakt vårt felläge (evig väntan utan
signal om liv):

> "A task that is waiting for a task token will wait until the execution
> reaches the one year service quota... To avoid stuck executions you can
> configure a heartbeat timeout interval... If the waiting task doesn't
> receive a valid task token within that 10-minute period [exempel], the
> task fails with a `States.Timeout` error name."

Detta är släkt med, men strukturellt starkare än, vårt eget
`heartbeat-svep` (som pollar utifrån snarare än att invänta en signal
inifrån väntan) — task-token-mönstret KRÄVER en aktiv livstecken-signal
från den väntande sidan, annars fälls den automatiskt. Vårt svep har
ingen motsvarande "har den som skulle jobba fortfarande puls?"-kontroll;
det är en skillnad värd att notera men inte agera på i detta pass.

### 3.3 Apache Airflow — den tydligaste "frigör resursen medan du väntar"-formen

Officiell dokumentation (`airflow.apache.org/docs/apache-airflow/stable/authoring-and-scheduling/deferring.html`):

> "When an operator defers, execution moves to the triggerer, where the
> trigger specified by the operator will run." ... "During the deferred
> phase of execution, since work has been offloaded to the triggerer, the
> task no longer occupies a worker slot." ... "Triggers are small,
> asynchronous pieces of Python code designed to run in a single Python
> process."

Detta är den mest direkt kostnads-relevanta precedenten för vårt
incident: **~700k tokens brändes för att tre agenter höll sina "worker
slots" (kontextfönster, tur-budget) upptagna medan de väntade på
ingenting.** Airflow löste exakt det problemet redan innan LLM-agenter
fanns — en väntande task ska INTE hålla den dyra resursen (workern)
upptagen; den ska lämna tillbaka den och låta en billig, dedikerad
process (triggerern) sköta väntan.

**Slutsats för § 3, ärligt vägd:** precedent-rymden här är **bred, inte
tunn** — tre oberoende, väletablerade motorer (plus Cadence, Temporals
egen föregångare, samma linje men inte separat undersökt i detta pass —
flaggat i § Vad jag inte kunde belägga) konvergerar på samma primitiv:
separera "gör jobbet" från "vänta på nästa steg", och lägg väntan i det
lager som är billigt att hålla länge (en persisterad post/logg), aldrig i
det lager som är dyrt att hålla länge (en aktiv worker/kontext).

---

## 4. Hur förhindras "färdigt men oredovisat arbete"?

Mönstren existerar, och de är konsekventa över alla tre durable-execution-
motorerna plus Claude Codes egen senaste riktning:

1. **Skriv resultatet FÖRE du pausar, inte efter.** LangGraphs
   checkpointer sparar state "using the checkpointer so execution can be
   resumed later" — INNAN `interrupt()` returnerar kontroll. Temporals
   Event History skrivs som en del av varje steg, inte som en eftertanke.
2. **At-least-once + idempotens, inte exactly-once.** Temporal löser inte
   "gör exakt en gång" — den löser "gör minst en gång, säkert att göra om".
   Idempotenta handoffs (idempotency key = Workflow Run ID + Activity ID)
   är svaret på "vad händer om samma steg körs två gånger av misstag" —
   INTE ett löfte om att det aldrig händer.
3. **Task-token som explicit, oförfalskningsbar leveranskvittens.** Step
   Functions går längre än "skriv och hoppas" — den kräver en aktiv
   `SendTaskSuccess`/`SendTaskFailure`-signal, med en heartbeat-timeout som
   fäller om den signalen uteblir.
4. **Claude Codes egen riktning stödjer samma princip:** `TaskOutput`
   (en live-fråga om en bakgrundstasks resultat) är explicit deprecated
   till förmån för `Read` på en resultatfil — dvs. samma "skriv resultatet
   till en beständig plats, läs det därifrån" som de tre motorerna ovan,
   fast i miniatyr.

**Skulle en write-ahead-form ha räddat vår tredje instans (tre agenter
med komplett arbete på disk som aldrig committades)?** Delvis ja, delvis
nej, och distinktionen är viktig:

- **Arbetet VAR redan write-ahead** i den mening som spelar roll för
  filsystemet — det låg på disk, inte bara i agentens kontext. Det som
  saknades var inte persistens av ARTEFAKTEN utan **sekvensering**: `git
  commit`/`git push` (den handling som gör artefakten synlig och
  återhämtningsbar för orkestreraren) skedde ALDRIG, eftersom agenten gick
  in i väntan FÖRE den handlingen i stället för EFTER.
- Detta matchar exakt den ordning alla tre durable-motorerna kräver:
  persistens sker som en förutsättning FÖR att gå in i väntan (LangGraphs
  checkpoint sker innan `interrupt()` returnerar; en `.sync`-integration i
  Step Functions committar sitt jobbresultat innan den låter exekveringen
  fortsätta). **Regeln generaliserar: en agent (eller ett system) får
  aldrig gå in i en väntan förrän dess egen färdiga del av arbetet redan
  är i sitt beständiga, återhämtningsbara tillstånd.** Hos oss betyder det
  konkret: commit + push FÖRE `Monitor`/`run_in_background`, aldrig efter.

---

## 5. Mekanisering kontra instruktion

**Fyndet i § 1.1 är svaret här, och det är starkare än frågan förutsatte.**
Anthropic har redan valt mekanisering framför instruktion för TRE av fyra
async-vägar (`TaskOutput`, `ScheduleWakeup`, `WaitForMcpServers` +
`Workflow` strukturellt borttagna ur varje subagents verktygslista, "even
when listed in the `tools` field" — en instruktion kan inte återinföra ett
borttaget verktyg). Den fjärde vägen, `Monitor`, är den enda som INTE är
strukturellt stängd, och är exakt den väg vår mätning (`L340`) visar
läcker: verktyget är listat och anropbart, men leveransen av dess löfte
(en händelsedriven väckning) uteblir för en subagent.

**Detta ger en konkret, byggbar mekaniseringsväg** — inte spekulativ,
grundad i primärkälla för varje beståndsdel:

Hooks kan mekaniskt skilja subagent-kontext från huvudsession. Ur
`code.claude.com/docs/en/hooks` (hämtad rått, verifierad ordagrant):

> "the input carries the `agent_id` and `agent_type` common input fields
> that identify the subagent" ... "`agent_id` — Unique identifier for the
> subagent. Present only when the hook fires inside a subagent call. Use
> this to distinguish subagent hook calls from main-thread calls."

och en `PreToolUse`-hook kan blockera anropet innan det körs:

> "`PreToolUse` — Before a tool call executes. Can block it" ... [exempel]
> `"permissionDecision": "deny", "permissionDecisionReason": "..."`

**Sammanslaget:** en `PreToolUse`-hook som matchar `Monitor` (och,
försiktigare, `Bash` med `run_in_background: true` i `tool_input`), och
som nekar anropet NÄR `agent_id` är närvarande i hook-input, skulle stänga
den enda kvarvarande luckan Anthropic själva lämnat öppen — med exakt
samma medel (strukturellt borttaget verktyg för subagent-kontext) de
redan använder för de andra fyra. Detta är inte en ny idé vi uppfinner;
det är att fullfölja ett mönster förstaparten redan valt men inte
fullbordade för just detta verktyg.

**Vad mekaniseringen INTE löser, och som måste stå bredvid den:**
auto-bakgrunds-fällan (§ 1.1) — ett foreground-kommando som passerar sin
timeout konverteras till bakgrund av harnessen SJÄLV, utan att subagenten
bad om det, och en `PreToolUse`-hook som godkänt det ursprungliga anropet
har ingen möjlighet att ångra den konverteringen i efterhand. Det talar
för en kompletterande, svagare regel: subagenter som kör potentiellt långa
kommandon (fulla grindsviter) ska explicit sätta ett `timeout` de
accepterar riskerar att träffas, snarare än att lita på default-2-minuter
och hoppas att harnessen aldrig auto-backgroundar.

---

## Sök efter det som motsäger — argument MOT "orkestreraren äger all väntan"

**Den starkaste motröst som hittades kommer, överraskande, från Anthropic
själva — och den är ärlig snarare än förnekande.** Deras egen
engineering-artikel om multi-agent-forskningssystemet
(`anthropic.com/engineering/multi-agent-research-system`, hämtad direkt)
skriver rakt ut att deras PRODUKTIONSSYSTEM har exakt den flaskhals vår
arkitektur delar, och att de MEDVETET valt att inte lösa den ännu:

> "Currently, our lead agents execute subagents synchronously, waiting
> for each set of subagents to complete before proceeding. This
> simplifies coordination, but creates bottlenecks in the information
> flow between agents." ... "the entire system can be blocked while
> waiting for a single subagent to finish searching."

och om alternativet:

> "Asynchronous execution would enable additional parallelism: agents
> working concurrently and creating new subagents when needed. But this
> asynchronicity adds challenges in result coordination, state
> consistency, and error propagation across the subagents."

**Detta är inte ett motargument mot vår design — det är den starkaste
formen av precedent: branschledaren som byggde det system vi delegerar
till HAR samma flaskhals, VET om den, och valde ändå synkron
orkestrerar-väntan eftersom asynkron delegering flyttar problemet till ett
svårare ("result coordination, state consistency, error propagation")
snarare än att lösa det.** Kostnaden de accepterade är exakt vår kostnad:
genomströmning offras för koordinations-enkelhet.

**Ett genuint "gick andra vägen"-exempel finns, men det är svagt som
precedent för oss.** Forskningslitteraturen om decentraliserad
multi-agent-koordination (Gossip-protokoll som komplement till Googles
A2A, arXiv 2508.01531) och observationen att "the primary risk in
supervisor/worker orchestration is a supervisor bottleneck: if the
supervisor agent fails, the entire workflow stalls" pekar mot
peer-till-peer-koordinering utan central väntande part. Detta registreras
ärligt som **existerande men forskningsstadiet**, inte
produktionsbelagt hos något av de sju undersökta systemen — ingen av dem
(Claude Code, LangGraph, AutoGen, CrewAI, OpenAI Agents SDK, Temporal,
Step Functions) har en decentraliserad väntar-arkitektur i sin
huvudprodukt.

**Vad detta betyder för oss, ärligt vägt:** orkestreraren-äger-väntan
skalar dåligt i EXAKT den mening Anthropic själva beskriver — en enda
långsam underagent kan blockera hela framdriften. Men ingen av de sju
undersökta systemen har löst det problemet genom att flytta väntan till
agenten. De har antingen (a) accepterat flaskhalsen medvetet (Anthropic),
eller (b) löst den genom att flytta väntan till ett TREDJE lager — en
durabel koordinator som inte är samma process som vare sig orkestreraren
eller arbetaren (Temporal, Step Functions, Airflow). Väg (b) är den
enda som faktiskt löser skalningsproblemet utan att återinföra vår
ursprungliga bugg, men den kräver infrastruktur (en extern, alltid-
uppe köhanterare) vi inte har och sannolikt inte är värd att bygga för
vår skala — se § Rekommendation, alternativ D.

---

## Dom

**BELAGT, primärkälla:** fyra mogna system (Temporal, AWS Step Functions,
Apache Airflow, LangGraph) lägger strukturellt väntan i ett annat lager än
utföraren, och samtliga skriver/persisterar resultatet FÖRE de går in i
väntan. Claude Codes egen harness tar bort tre av fyra async-primitiver
strukturellt ur varje subagents verktygslista (`TaskOutput`,
`ScheduleWakeup`, `WaitForMcpServers`, plus `Workflow`) — mätt ur
primärkälla, inte antaget. Anthropics eget produktionssystem har medvetet
accepterat samma synkrona flaskhals vi har, av samma skäl (koordinations-
komplexitet slår genomströmning).

**BEDÖMT:** vårt mönster ("orkestreraren äger väntan") är branschform
tillämpad rätt på vår skala — inte en kompromiss, utan samma arkitektur
mogna durable-execution-system valt, fast utan deras externa
infrastruktur. Den enda strukturella luckan mellan vår situation och
Anthropics egen redan-mekaniserade policy är `Monitor`-verktyget, som är
listat men vars leveranslöfte är mätt trasigt för subagent-kontext
(`L340`).

**Precedent-rymden för § 3 (durable execution) är bred** — tre oberoende
motorer, samma primitiv, ingen utfyllnad behövdes. **Precedent-rymden för
"sanktionerat checkpoint/resume-protokoll hos LLM-agent-ramverk" är
genuint tunn** — inget av fem undersökta agent-ramverk har det, vilket
deklareras öppet snarare än fylls ut. **Precedent-rymden för "agenten
äger väntan i produktion" är i praktiken tom** hos de sju undersökta
systemen; det enda avstampet är forskningsstadiets Gossip/decentraliserings-
litteratur.

---

## Vad jag inte kunde belägga

1. **Att Temporal-Activities är API-mässigt FÖRBJUDNA att vänta på
   Signals.** Det jag belade är att branschens egen referensimplementation
   (cookbook) placerar väntan i Workflow-lagret. Att detta är en hård
   spärr snarare än stark konvention är min slutsats, inte ett direkt
   citat — flaggat som sådant i § 3.1.
2. **Cadence** (Ubers ursprungliga durable-execution-motor, Temporals
   direkta föregångare) undersöktes inte separat. Rimligt antagande,
   OVERIFIERAT: samma primitiv som Temporal, given det gemensamma
   ursprunget — men detta är inte mätt i detta pass.
3. **Exakt varför `Monitor` lämnades kvar** i subagentens verktygslista
   när fyra andra async-primitiver togs bort. Ingen primärkälla
   diskuterar designbeslutet; det kan vara avsiktligt (Monitor har
   legitima synkrona användningar inom en enda tur, t.ex. att övervaka ett
   kommando som redan körs) eller ett förbiseende. Ingen av de två
   hypoteserna kunde beläggas eller uteslutas.
4. **Om en `PreToolUse`-hook faktiskt kan neka `Monitor` specifikt när
   `agent_id` är satt, testat skarpt.** Mekanismen (hook-fält +
   `permissionDecision: deny`) är primärkälle-belagd var för sig; att de
   samverkar precis som beskrivet för just detta verktyg och denna
   matchning är INTE testat i detta pass — det är ett research-only-pass.
5. **AutoGens och CrewAIs eventuella checkpoint-till-disk-mekanismer.**
   Sökningen var inte lika djup som för Claude Code/LangGraph/Temporal;
   det är möjligt att ett sådant mönster finns i deras källkod utan att
   synas i den dokumentation som söktes fram. Registreras som frånvaro av
   fynd, inte frånvaro av mekanism.
6. **Mergifys arkitektur** — redan flaggat obelagt i
   `orkestrerar-vackning-polling-vs-event-driven-2026-08-02.md`; inte
   omprövat här, eftersom det ligger utanför denna delfråga.
7. **Huruvida `askUserQuestionTimeout`/degradering till självbeslut** (redan
   djupt undersökt i `agent-autonomi-eskaleringsdesign-2026-07-29.md`) har
   någon motsvarighet för `Monitor`-specifik timeout. Inte omundersökt här
   för att undvika duplicering av det passet.

---

## Rekommendation

**Detta är en rekommendation, inte ett beslut.** Orkestreraren och Marcus
äger vägvalet.

### Alternativ A — Mekanisera en `PreToolUse`-hook som nekar `Monitor` och `run_in_background:true` när `agent_id` är satt

**Vad den kostar:** en ny hook-fil + policy-config (samma config-driven
form som `.markdownlint-cli2.jsonc`/`.vale.ini`-mönstret CLAUDE.md redan
kräver för custom grindvakter), en engångs skarp verifiering (kräver egen
session, per `CLAUDE.md`s "En ny hook kan ALDRIG skarpbevisas i sessionen
som byggde den"-regel), löpande underhåll av ännu en mekanism.

**Vad den INTE löser:** auto-bakgrunds-fällan (§ 5) — ett foreground-
kommando som passerar sin timeout konverteras av harnessen oavsett vad
hooken godkände vid anropstillfället. Löser heller inte busy-wait-
mönster (en agent som kör upprepade korta synkrona polling-kommandon i
en loop) — det är ett annat, mindre farligt felläge (bränner tokens men
parkerar inte permanent) som inte adresserades i detta pass.

**Rangordning: 1 (starkast rekommenderad).** Grundad direkt i mönstret
Anthropic redan valt för de fyra andra async-vägarna; billigast att bygga
av de fyra alternativen; adresserar exakt den mätta luckan.

### Alternativ B — Sekvensera "persistens FÖRE väntan" explicit i agent-instruktionsfiler (`bygg-agent.md` m.fl.)

**Vad den kostar:** nästan inget — en formulering, inte en mekanism.
"Committa och pusha ditt eget atomära arbete INNAN du kör något som kan
trigga bakgrund (`Monitor`, långa `Bash`-anrop utan snävt `timeout`)."

**Vad den INTE löser:** vi har nu TRE mätta instanser (`L323`, `L340`,
dagens tre agenter) av att instruktion ensam inte hållit. Detta alternativ
är värdefullt som KOMPLEMENT till A, aldrig som ersättning för den.

**Rangordning: 2, men bara i kombination med A.** Fristående är den
svagast av de fyra, av skäl som redan är empiriskt belagda i detta repo.

### Alternativ C — Generalisera "Activities väntar aldrig, bara Workflows väntar" som explicit namngiven princip i CLAUDE.md

**Vad den kostar:** ren dokumentations-skärpning; inget nytt att bygga.
Namnger mönstret ("Temporal-mönstret: en subagents jobb är att GÖRA, aldrig
att VÄNTA — väntan är alltid orkestrerarens") så framtida läsare förstår
VARFÖR regeln finns, inte bara att den finns — samma motivering som redan
användes för att namnge K8s-reconciliation-mönstret i
`orkestrerar-vackning`-passets rekommendation.

**Vad den INTE löser:** ren namngivning ändrar inget beteende i sig — se
Alternativ B:s begränsning. Värdefull som ett gemensamt vokabulär för A
och B, inte som fristående åtgärd.

**Rangordning: 3, som ett billigt tillägg till A+B, inte ett eget spår.**

### Alternativ D — Bygg en extern, alltid-uppe köhanterare (Temporal/Step-Functions-liknande) för att lösa flaskhalsen Anthropic själva beskriver

**Vad den kostar:** betydande — ny infrastruktur, ny driftsyta, en
komponent som måste vara mer pålitlig än det den ska skydda mot. Detta är
den enda av de fyra som faktiskt löser SKALNINGSPROBLEMET (§ Sök efter det
som motsäger), inte bara parkeringsbugg.

**Vad den INTE löser:** proportionalitet. Vi har mätt EN flaskhals-kostnad
(~700k tokens en session) men noll mätning av hur ofta orkestrerar-väntan
faktiskt blockerar FRAMDRIFT (till skillnad från att bara kosta tokens).
Att bygga extern infrastruktur för ett problem vi inte mätt frekvensen av
är precis den spekulativa komplexitet CLAUDE.md:s
över-engineering-vakt varnar för ("ingen lösning som letar problem").

**Rangordning: 4 — namngiven för fullständighet, EXPLICIT AVRÅDD i nuläget.**
Övervägs igen bara om en framtida mätning visar att synkron
orkestrerar-väntan faktiskt blockerar framdrift (inte bara kostar tokens)
med en frekvens som motiverar kostnaden.

### Vad som talar EMOT förstahandsrekommendationen (Alternativ A)

Ärligt vägt: en hook är ännu en mekanism i ett system som redan har många
(K7-frontmatter-grindvakt, backlog-direct-edit-deny, m.fl.) — varje
tillagd hook är en yta som kan ha egna buggar, kräver den redan
dokumenterade "kan inte skarpbevisas i samma session"-proceduren, och
löser bara EN av flera vägar in i parkering (§ Vad den INTE löser ovan).
Det svagaste argumentet mot den skulle vara "instruktion räcker nu när vi
skärpt den" — men det argumentet är redan empiriskt vederlagt tre gånger
i detta repo, vilket är precis varför A rangordnas före B trots att B är
billigare.

---

## Källförteckning

**Primärkälla — Anthropic / Claude Code, dokumentation (hämtad direkt,
version 2.1.222 lokalt installerad, dokumentationen citerar samma
versionsserie i egna "As of v2.1.xxx"-noter):**

- Orchestrate subagents at scale with dynamic workflows — <https://code.claude.com/docs/en/workflows>
- Create custom subagents — <https://code.claude.com/docs/en/sub-agents>
- Tools reference — <https://code.claude.com/docs/en/tools-reference>
- Intercept and control agent behavior with hooks — <https://code.claude.com/docs/en/hooks>

**Primärkälla — Anthropic, engineering:**

- How we built our multi-agent research system — <https://www.anthropic.com/engineering/multi-agent-research-system>

**Primärkälla — GitHub-issue (produktdokumenterat behov, stängd som
duplikat, ingen synlig motivering i det extraherade innehållet):**

- Feature Request: Background Agent Execution (Task tool async support) — <https://github.com/anthropics/claude-code/issues/9905>

**Primärkälla — durable execution / workflow-motorer:**

- Temporal, Understanding Temporal (event history, replay) — <https://docs.temporal.io/evaluate/understanding-temporal>
- Temporal, Human-in-the-loop AI agent (Signals, durable timers) — <https://docs.temporal.io/ai-cookbook/human-in-the-loop-python>
- Temporal, Workflows — <https://docs.temporal.io/workflows>
- Temporal, Activities (at-least-once, idempotens) — <https://docs.temporal.io/activities>
- AWS Step Functions, Discover service integration patterns (task token, callback, heartbeat) — <https://docs.aws.amazon.com/step-functions/latest/dg/connect-to-resource.html>
- Apache Airflow, Deferrable Operators & Triggerer — <https://airflow.apache.org/docs/apache-airflow/stable/authoring-and-scheduling/deferring.html>

**Primärkälla — övriga agent-ramverk:**

- LangGraph / LangChain, Interrupts — <https://docs.langchain.com/oss/python/langgraph/interrupts>
- OpenAI Agents SDK, Handoffs — <https://openai.github.io/openai-agents-python/handoffs/>
- A2A Protocol Specification (Linux Foundation) — <https://a2a-protocol.org/latest/specification/>
- AutoGen (Microsoft), Termination — <https://microsoft.github.io/autogen/0.4.7//user-guide/agentchat-user-guide/tutorial/termination.html>
- AutoGen (Microsoft), Handoffs — <https://microsoft.github.io/autogen/stable//user-guide/core-user-guide/design-patterns/handoffs.html>
- CrewAI, Kickoff Crew Asynchronously — <https://docs.crewai.com/en/learn/kickoff-async>

**Sekundärkälla (flaggad i text där använd):**

- Revisiting Gossip Protocols: A Vision for Emergent Coordination in
  Agentic Multi-Agent Systems (arXiv 2508.01531) — forskningsstadiets
  motröst mot central väntande orkestrerare, ej produktionsbelagd —
  <https://arxiv.org/pdf/2508.01531>
- Sammanfattningar av CrewAI-callbacks och AutoGen-terminationstyper via
  sökmotor-syntes, ej alltid direkt sidhämtning — flaggat i § 1.4.

**Kontext internt (given av uppdraget, ej ny mätning i detta pass):**

- `tasks/lessons.md` `L323`, `L340` (empiriska fynd som given kontext)
- `docs/research/orkestrerar-vackning-polling-vs-event-driven-2026-08-02.md`
- `docs/research/agent-autonomi-eskaleringsdesign-2026-07-29.md`
- `CLAUDE.md` § Landning (heartbeat-svep, worktree-isoleringens gräns)
