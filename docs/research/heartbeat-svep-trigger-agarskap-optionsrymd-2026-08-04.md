---
owner: marcus803
updated: 2026-08-04
review_by: 2027-02-04
status: stable
---

# Heartbeat-svepets trigger — options-rymd och rekommendation (T119 arbetslista (c))

> **Proveniens:** avgränsat research-pass 2026-08-04, beställt via `T119`
> arbetslista-punkt (c) (`tasks/sessions/archive/2026-08/2026-08-04-session-97.md` rad 726–728,
> § "Paushistorik — Session 97, andra pausen" → CARRY): *"Heartbeat-svepets
> trigger får en ägare (relaterat `TASK-135`). Svepet är redan korrekt designat
> som periodisk level-triggered reconciliation — det är TRIGGERN som saknas,
> inte mönstret."* Uppdraget krävde ett STOPPA-GRIND-beslut: bygg endast om
> valet faller ut entydigt ur mätning; annars landa denna rapport och avstå
> från kod. Utfallet (§ 8) är: **avstå.**
>
> Läst före detta pass: `scripts/heartbeat-svep.sh` + `.heartbeat-svep-policy.conf`
> i sin helhet · `CLAUDE.md` § Landning ("Svep vid varje väckning") ·
> `tasks/threads/README.md` raderna `T111`/`T112` samt
> `T111-autonom-orkestrering-kontexttroskel.md` och
> `T112-vackningskedjan-over-turgransen.md` i sin helhet ·
> `docs/research/orkestrerar-vackning-polling-vs-event-driven-2026-08-02.md` ·
> `backlog/tasks/task-135` via `npx backlog task 135 --plain`.
>
> **Mätningar i detta pass:** `ToolSearch` mot min egen (bygg-agentens)
> deferred-tool-yta för `CronCreate`/`CronList`/`CronDelete` (noll träffar,
> två oberoende sökningar) · `WebFetch` mot fyra sidor i Anthropics officiella
> Claude Code-dokumentation (`routines.md`, `scheduled-tasks.md`,
> `desktop-scheduled-tasks.md`, `agent-view.md`), citat återgivna ordagrant
> nedan · `grep` mot `.claude/settings.json`, `.claude/settings.local.json`
> och hela arbetsträdet för `CLAUDE_CODE_DISABLE_CRON`/`DISABLE_GROWTHBOOK`/
> `DISABLE_TELEMETRY`/`DO_NOT_TRACK` (noll träffar) · läsning av
> `.heartbeat-svep-policy.conf` (`HEARTBEAT_INTERVAL=90`).

---

## Kort svar

**Frågan "vem startar svepet" är egentligen TVÅ frågor, inte en — och de har
olika svar.**

1. **Leverans INOM en redan öppen orkestrator-session, över turgränsen**
   (exakt `T112`:s uppmätta felläge — sessionen var vaken, men ingen väcktes):
   det finns nu ett **dokumenterat, förstahandsbelagt** förstapartsmönster
   (`/loop` + `CronCreate`/`CronList`/`CronDelete`, kombinerat med
   `/background`) som är byggt exakt för detta. Det skiljer sig strukturellt
   från den ad hoc-form `heartbeat-svep.sh` idag pekar på (rå `Bash
   run_in_background` + `Monitor`-verktyget): en schemalagd `CronCreate`-post
   injicerar en **genuin ny tur** i sessionen mellan turer — den kräver inte
   att någon "märker" att ett bakgrundsjobb blev klart, vilket var precis det
   `T112` Mätt (1) visade brister.
2. **Vem/vad SÄTTER IGÅNG det, och håller det vid liv över en
   sessions-gräns** (ny session, `session-paus`/`session-resume`, natt utan
   någon interaktion alls): **INGEN av de tre schemaläggnings-formerna löser
   detta för vår faktiska arbetsform.** Molnroutiner och Desktop-uppgifter
   startar båda en **helt ny, fristående session** varje gång — de kan aldrig
   "väcka" den specifika orkestrator-kontext som pausades. `/loop` överlever
   bara en **äkta `--resume`/`--continue`** eller en **bakgrundlagd session**
   (`/background`) — och vår egen dokumenterade praxis
   (`tasks/sessions/archive/2026-08/2026-08-04-session-97.md` rad 799: *"Öppna nytt
   terminalfönster, kör `session-resume`"*) startar en **ny konversation**,
   inte en `--resume`. Det är samma slutsats `T111` redan drog för
   kontext-återställning (halva B), nu bekräftad för trigger-frågan från en
   annan vinkel.

**Detta är alltså två problem med olika svårighetsgrad**, och den enda delen
som föll ut nära entydigt (§ 1) hade ändå en tredje invändning (§ 7,
kostnad) stark nog att flytta helheten under STOPPA-GRIND. Se § 8.

---

## 1. Läget idag — vad som faktiskt saknas

`scripts/heartbeat-svep.sh` (rad 99–103) dokumenterar sin egen avsedda
startform:

> *"Startform som bakgrunds-monitor (den form § Landning pekar på): kör
> skriptet UTAN `--once` i en Code-sessions bakgrunds-bash och montera med
> `Monitor`-verktyget."*

Detta är ett **manuellt, ihågkommet steg** — exakt den felklass `T119`s hela
mekaniserings-program (`tasks/threads/README.md` rad 162) är byggt mot:
*"regler i prosa bryts av färska kontexter."* Ingenting i harnesset eller
repot tvingar fram att en ny orkestrator-session faktiskt startar svepet;
`.heartbeat-svep-policy.conf` sätter bara **värden** (`HEARTBEAT_INTERVAL=90`
etc.), inte en **trigger**.

Notera avgränsningen mot `TASK-135` (Done, verifierat via
`npx backlog task 135 --plain`): det kortet fixade en **observabilitetslucka
i skriptets EGET utdata** (en kallstart gick tyst genom `say()`-grenen även
utan `--quiet`) — inte frågan om vem som startar processen. De är besläktade
men disjunkta, precis som item (c):s egen formulering ("relaterat", inte
"samma") antyder.

---

## 2. Options-rymden: tre schemaläggningsformer, mätt mot primärkälla

Anthropics officiella dokumentation (`code.claude.com/docs/en/scheduled-tasks.md`,
hämtad 2026-08-04) ger en ordagrann jämförelsetabell över **exakt** de tre
formerna uppdraget bad om, plus en fjärde mekanism (`/background`) som ingen
av `T111`/`T112` kände till. Detta är den viktigaste nya datapunkten i detta
pass — `T111` hade bara halva bilden.

### 2.1 Jämförelsetabellen (citerad ordagrant)

| | Cloud (`/schedule`-routiner) | Desktop (schemalagda uppgifter) | `/loop` (sessions-scopad) |
|---|---|---|---|
| Runs on | Anthropic cloud | Your machine | Your machine |
| Requires machine on | No | Yes | Yes |
| Requires open session | No | No | Yes |
| Persistent across restarts | Yes | Yes | Restored on `--resume` if unexpired |
| Access to local files | No (fresh clone) | Yes | Yes |
| MCP servers | Connectors configured per task | Config files and connectors | Inherits from session |
| Permission prompts | No (runs autonomously) | Configurable per task | Inherits from session |
| Minimum interval | 1 hour | 1 minute | 1 minute |

### 2.2 Cloud routines (`/schedule`) — bekräftar och skärper `T111`

Detta är samma mekanism `T111` redan undersökte (`T111`-kortet §
"Docs-utredningen: vägen finns"). Detta pass bekräftar oberoende, med färsk
hämtning av samma sida:

> *"Routines run autonomously as full Claude Code cloud sessions: there is
> no permission-mode picker and no approval prompts during a run."*
>
> *"Each run creates a new session alongside your other sessions, where you
> can see what Claude did, review changes, and create a pull request."*

**Konsekvens för vår fråga:** en molnroutine kan **aldrig** väcka den
specifika, pausade orkestrator-sessionen — den startar alltid en helt
fristående ny session utan koppling till den gamla kontexten. Den skulle
kunna köra `scripts/heartbeat-svep.sh --once` (skriptet behöver bara `gh`,
inte lokal git-historik, så en färsk klon duger) och **självständigt agera**
på larmet — men det vore en ny, oprövad autonomi-yta helt utanför vad
skriptets egen design tillåter (se skriptets § kommentar: disambiguering är
"orkestrerarens steg, inte skriptets"). Att lägga den befogenheten på en
obevakad molnsession är ett arkitekturbeslut i sig, inte en implikation av
denna undersökning.

### 2.3 Desktop scheduled tasks — en tredje form `T111`/`T112` aldrig hittade

Ny sida, hämtad 2026-08-04 (`desktop-scheduled-tasks.md`). Detta är **INTE**
CLI-harnesset vi kör i (Claude Code CLI i VS Code, enligt Marcus egen
`~/.claude/CLAUDE.md`: *"Claude Code körs i VS Code, inte fristående
terminal"*) — det är en separat, fristående macOS-app ("Claude Code
Desktop") med egen sidopanel:

> *"Scheduled tasks run on your machine. Desktop checks the schedule every
> minute while the app is open and starts a fresh session when a task is
> due, independent of any manual sessions you have open."*
>
> *"Tasks only run while the desktop app is running and your computer is
> awake."*
>
> *"When a task fires, you get a desktop notification and a new session
> appears under a Scheduled section in the sidebar."*

**Konsekvens:** teknisk sett den enda formen som (a) körs lokalt med
filåtkomst OCH (b) inte kräver en öppen session — men den kräver en
**helt annan app** än den vi faktiskt kör, den startar också alltid en
**ny, fristående session** (ingen kontinuitet med orkestratorn), och dess
enda direkta koppling till en människa är en macOS-notis. Att införa den
skulle vara ett infrastrukturbyte, inte en konfigurationsändring.

### 2.4 `/loop` + `CronCreate`/`CronList`/`CronDelete` — sessions-scopad, MEN med en avgörande begränsning

Nytt fynd i detta pass, direkt relevant för `T111`s öppna fråga om den
"lokala cron-vägen":

> *"Tasks are session-scoped: they live in the current conversation and stop
> when you start a new one. Resuming with `--resume` or `--continue` brings
> back any task that hasn't expired."*
>
> *"The scheduler checks every second for due tasks and enqueues them at low
> priority. A scheduled prompt fires between your turns, not while Claude is
> mid-response."*
>
> **Begränsningar, citerade ordagrant:**
> *"Tasks only fire while Claude Code is running and idle. Closing the
> terminal or letting the session exit stops them firing."*
> *"Starting a fresh conversation clears all session-scoped tasks."*
> *"Recurring tasks automatically expire 7 days after creation."*

Detta är den mekanism som `CronCreate`/`CronList`/`CronDelete` (de
deferred tools `T111` redan hittat hos orkestraren) faktiskt implementerar —
**inte** ett OS-cron och **inte** en fristående process. Den kör **inuti
den befintliga sessionens kontext** och levererar sitt resultat som en
**äkta ny tur**, vilket är strukturellt annorlunda än `Bash
run_in_background` + `Monitor` (som `T112` Mätt (1) redan mätte som
otillräckligt — en fullbordad bakgrundsvakt väckte ingen).

### 2.5 `/background` — pusselbiten varken `T111` eller `T112` kände till

Ytterligare en sida (`agent-view.md`), hämtad i detta pass eftersom
`scheduled-tasks.md` självt hänvisar dit för hur `/loop`-poster kan
överleva en stängd terminal:

> *"Background sessions don't need any terminal open to keep working. A
> separate supervisor process runs them, so you can close agent view, close
> your shell, or start a new interactive session and your dispatched work
> keeps going."*
>
> *"Sessions are also preserved when your machine sleeps. Their processes
> resume on wake and the supervisor reconnects to them instead of treating
> the time gap as idle. Shutting down still stops running sessions."*
>
> *"[scheduled tasks you created with `/loop`] all carry over and keep
> running there [i en bakgrundlagd session]."*

**Detta är den starkaste enskilda kandidaten som framkom i passet:** en
session som kör `/loop` och sedan bakgrundläggs (`/bg`) med `/background`
överlever stängd terminal OCH maskinsömn, behåller sitt session-ID och sin
transkript, och kan återanslutas (`claude attach <id>`) — **inte som en ny
session, utan som samma.** Det skulle strukturellt kunna lösa BÅDA
sub-problemen i § 6 samtidigt: triggern lever vidare (samma mekanism som
§ 2.4) OCH den överlever en "sessions-gräns" som i praktiken bara är en
frånkoppling, inte en process-död.

**Detta är ändå INTE samma sak som vår nuvarande `session-paus`/
`session-resume`-praxis**, som medvetet startar en **ny konversation**
(`tasks/sessions/archive/2026-08/2026-08-04-session-97.md` rad 799: *"Öppna nytt
terminalfönster"*) — ett val `T111` redan grundade i att `--resume`/
`--continue` ärver *"the full history, including tool calls and results"*
och att kontext-återställning kräver just detta brott. Att byta till
`/background` för att lösa trigger-frågan skulle alltså **kollidera med**
`T111`s halva B-slutsats om man inte samtidigt avgör hur de två målen
(bevarad trigger vs. färsk kontext) förhåller sig till varandra. Det är
inte denna undersöknings att avgöra.

---

## 3. Mitt eget verktygsyta-fynd — jag saknar Cron-verktygen helt

Mätt i detta pass, inte antaget: `ToolSearch` mot min egen (den här
bygg-agentens) deferred-tool-yta gav **noll träffar** på två oberoende
sökningar — `select:CronCreate,CronList,CronDelete` ("No matching deferred
tools found") och den fritextsökande `+cron background scheduled task`
(samma resultat). Min systemprompts inledande deferred-tool-lista
(`EnterWorktree`, `ExitWorktree`, `Monitor`, `NotebookEdit`, `SendMessage`,
`TaskStop`, `WebFetch`, `WebSearch`, plus `mcp__*`) bär heller inga
`Cron*`-namn.

`T111`-kortet fastslog (2026-07-31, en `claude-code-guide`-agents
verifiering mot **orkestratorns** verktygsyta): *"orkestreraren har
`CronCreate` / `CronDelete` / `CronList` som deferred tools."* Jag kan inte
motsäga eller bekräfta det påståendet — min egen mätning gäller bara **mig
själv**, en spawnad bygg-agent i egen worktree, inte orkestratorn. Detta är
samma strukturella klass som `CLAUDE.md` redan namnger:
*"MCP-verktygsytan (S97 Del 2)... bestäms vid sessionsstart och uppdateras
inte retroaktivt"* — olika sessionstyper kan ha olika verktygsytor, och det
är väntat, inte motsägande.

**Praktisk konsekvens:** jag kan inte själv skarpbevisa någon `/loop`-
eller `CronCreate`-baserad lösning. Ett sådant bevis kan bara produceras
av en aktör som faktiskt har verktyget — precis den disciplin `CLAUDE.md`
§ "En ny hook kan ALDRIG skarpbevisas i sessionen som byggde den" redan
kräver för hooks, applicerad här på ett verktyg snarare än en hook.

---

## 4. Besvarar detta `T111`:s öppna fråga?

`T111`s § "Verifieringens egen lucka" ställde frågan rakt ut: *"Den LOKALA
cron-vägen — harnessets `CronCreate` på Marcus maskin — fick inget direkt
dokumentsvar... Är det den enda som verifieringen INTE kunde utesluta,
och den avgörande frågan är obesvarad: startar varje cron-körning i FÄRSK
kontext?"*

**Svaret, nu belagt:** NEJ — `CronCreate`/`/loop` startar INTE en färsk
kontext. Den kör **i den befintliga sessionens kontext** (§ 2.4). Det är
molnroutiner (§ 2.2) och Desktop-uppgifter (§ 2.3) som **alltid** startar
färsk kontext — och `T111` hade redan belagt cloud-routine-halvan korrekt
(*"en routine-körning (cloud) startar ALLTID i färsk session"*). Det som
saknades var att harnessets EGEN `CronCreate` inte är samma mekanism som
en molnroutine — det är en tredje, distinkt form, och den är den ENDA av
de tre som **inte** ger färsk kontext. `T111`s halva B (kontext-
återställning) hittar alltså sin väg i cloud-routines/Desktop-uppgifter,
INTE i `CronCreate` — vilket är precis tvärtom mot vad trigger-frågan
(detta kort) behöver, som vill ha KONTINUITET, inte återställning. De två
trådarna pekar åt motsatta håll i samma verktygslåda, vilket är värt att
bokföra explicit: det finns ingen enskild mekanism som löser båda `T111`
och `T119`(c) samtidigt, utom möjligen `/background` (§ 2.5) för det senare.

---

## 5. Besvarar detta `T112`:s öppna fråga (iv)?

`T112`s Åtgärdsriktning (iv), fortfarande öppen: *"Avgränsad
harness-mätning — levereras task-notifikationer till en idle huvudsession
utan användarinteraktion? Bryts kedjan vid agent-resume eller vid
notifikations-leverans?"*

**Delvis, och indirekt — inte en direkt mätning av samma fråga.**
Dokumentationens ordval (§ 2.4: *"A scheduled prompt fires between your
turns... enqueues them at low priority"*) beskriver en mekanism som är
**strukturellt** annorlunda från den `T112` redan mätte som opålitlig
(`Bash`-bakgrundsjobb + `Monitor`, § Mätt (1)–(2)): `CronCreate` är en
förstapartsdel av CLI-schemaläggaren, inte ett OS-processresultat som
någon måste "märka". Det är en **stark indikation**, källbelagd i officiell
dokumentation, att `CronCreate`/`/loop` skulle ha undvikit `T112`s faktiska
incident (en öppen, vaken session som aldrig fick en ny tur trots landad
PR). **Men det är fortfarande INTE samma sak som en skarp mätning** —
ingen `CronCreate`-post har faktiskt körts och observerats leverera i en
genuint idle orkestrator-session över en natt. Den skarpa mätningen kräver
verktyget (§ 3) och kan bara göras av orkestratorn själv, precis som
`T112`s (iv) redan var formulerad att kräva.

---

## 6. Två distinkta sub-problem, inte ett

### 6.1 Sub-problem A — leverans inom en öppen session, över turgränsen

Det här är exakt `T112`s uppmätta felläge. Kandidat: `CronCreate`/`/loop`
(§ 2.4), ev. kombinerat med `/background` (§ 2.5) om sessionen annars skulle
stängas. Denna del är **nära entydig** på pappret — men se § 7, som är
skälet den ändå inte kvalificerar för "bygg det" under STOPPA-GRIND.

### 6.2 Sub-problem B — start/återstart över en sessions-gräns

Det här är den del av item (c):s fråga ("vem STARTAR svepet, i grunden")
som ingen av de tre formerna löser rent för vår faktiska arbetsform:

- Molnroutiner och Desktop-uppgifter löser "körs utan öppen session" —
  men producerar alltid en **ny, urkopplad** session, aldrig en väckning av
  den specifika orkestrator-kontext som pausades.
- `/loop` kräver antingen en session som aldrig stängs (`/background`,
  vilket är en verklig arbetsform-förändring) eller `--resume`/`--continue`
  vid nästa start — och vår dokumenterade praxis
  (`session-paus`/`session-resume`) startar medvetet en **ny konversation**,
  inte en `--resume`, av skäl `T111` redan grundat (kontext-återställning).

**Detta är alltså ett genuint arkitekturval mellan sinsemellan oförenliga
mål** (bevarad trigger-kontinuitet vs. färsk kontext vid varje ny session)
och kan inte avgöras av en enskild mätning. Det är precis den situation
STOPPA-GRIND beskriver.

---

## 7. Kostnadsinvändningen som gör detta INTE entydigt ens för sub-problem A

`heartbeat-svep.sh`s nuvarande form är en **ren skal-loop**: `HEARTBEAT_INTERVAL=90`
(`.heartbeat-svep-policy.conf` rad 43) sekunder mellan `gh api`-anrop, noll
LLM-anrop inuti loopen. Kostnaden är mätt i
`docs/research/orkestrerar-vackning-polling-vs-event-driven-2026-08-02.md`:
~40 GitHub API-anrop/timme, 0,8 % av en 5 000/timme-budget.

**En `CronCreate`/`/loop`-baserad ersättning är strukturellt annorlunda
dyr.** Varje schemalagd post är en **prompt som en modell processar** —
"a scheduled prompt fires between your turns" betyder en genuin ny
modell-tur, inte ett skal-kommando. Att köra samma `HEARTBEAT_INTERVAL=90`
genom `/loop` vore **40 modell-turer i timmen, ~960 över en natt** — en helt
annan kostnadsklass än dagens skal-loop, och i rak konflikt med `T111`s
"tredje spår" (§ Docs-utredningen i `T111`-kortet): *"gör orkestrerarens
kontext ITERATIV i stället för monotont växande"* — varje `/loop`-tur lägger
själv till kontext i en session som redan ska hållas tunn. Ett glesare
`/loop`-intervall (minuter, inte sekunder) skulle mildra detta, men **vilket
intervall** är i sig en avvägning mellan kostnad och upptäcktsfördröjning —
återigen ett val, inte en mätning.

Detta är skälet att § 6.1, trots att den är den del av frågan som kommer
närmast ett tydligt svar, ändå inte kvalificerar som "bygg det": den byter
ett **mätt litet problem** (opålitlig leverans, `T112` Mätt (1)) mot ett
**omätt men strukturellt sannolikt större** problem (turkostnad), utan att
någon avvägning mellan de två är gjord.

---

## 8. STOPPA-GRIND-utfall

**BYGG INGENTING.** Ingen kod, inget skript, ingen hook, ingen
`CronCreate`-registrering, ingen ändring av `heartbeat-svep.sh`s
dokumenterade startform. Skälen, sammanfattade:

1. Frågan är **två frågor**, och den ena (§ 6.2) är ett obestritt
   arkitekturval mellan sinsemellan oförenliga mål — precis
   STOPPA-GRIND-villkoret "genuint arkitekturval mellan flera livskraftiga
   former".
2. Den andra (§ 6.1), även om den är nära entydig på pappret, bär en
   omätt kostnadsinvändning (§ 7) stark nog att den inte kan kallas
   "uppenbart rätt, andra uteslutna på belagd grund".
3. Verktyget som skulle krävas för att ens BÖRJA bygga (`CronCreate`)
   finns strukturellt inte i min egen verktygsyta (§ 3) — jag skulle bygga
   blint mot ett kontrakt jag inte kan pröva, exakt den felklass
   `ADR-086`/premiss-passet finns för att förhindra.
4. Det uttryckliga förbudet i uppdraget ("Starta INGEN cron/launchd-post
   som faktiskt börjar köra periodiskt utan att det är den beslutade
   formen") utesluter ändå varje konkret prövning av § 2.4/§ 2.5 här.

---

## 9. Rekommendation (icke-bindande — Marcus/orkestratorn äger vägvalet)

1. **Behåll den nuvarande skal-baserade `heartbeat-svep.sh` + ad hoc
   `Bash`/`Monitor`-startformen tills vidare.** Den är branschbelagd
   (`orkestrerar-vackning-polling-vs-event-driven-2026-08-02.md`) för
   SJÄLVA svepmönstret; det som saknas är bara triggern, och ingen av
   kandidaterna här är billig eller entydig nog att byta till utan ett
   uttalat beslut.
2. **Om sub-problem A (§ 6.1) prioriteras:** låt orkestratorn — som är den
   enda aktör med `CronCreate` i sin verktygsyta — köra ett **eget,
   avgränsat, mätt** experiment: schemalägg `scripts/heartbeat-svep.sh
   --once` via `/loop` med ett GLEST intervall (t.ex. 15–20 min, inte 90 s,
   för att hålla turkostnaden nere) under en natt med känt PR-läge, och
   mät om alarmet faktiskt levereras som en ny tur i en session ingen
   interagerar med. Det är den skarpa mätning § 5 saknar och som bara
   orkestratorn kan producera.
3. **Om sub-problem B (§ 6.2) prioriteras:** detta kräver ett Marcus-beslut
   om `/background` ska ersätta delar av `session-paus`/`session-resume`-
   praxisen för just denna typ av natt-drift — vilket i sin tur kräver att
   förhållandet till `T111`s halva B (som medvetet VILL ha färsk kontext)
   klargörs. Ren mekanism-fråga, inte en jag kan avgöra här.
4. **Namnge fyndet i `T111`- och `T112`-trådarna** (inte bara här) — båda
   bär öppna frågor detta pass delvis besvarar (§ 4, § 5); en isolerad
   research-fil utan tillbaka-länk till de trådar som ställde frågorna
   riskerar att bli overifierad kunskap nästa gång någon läser bara
   trådregistret.

---

## 10. Vad jag inte kunde belägga

- **Om `CronCreate`/`/loop` faktiskt levererar en tur till en genuint idle
  toppnivå-session** (inte bara "mellan turer" i en session som redan är
  aktiv och väntar på nästa modell-anrop av annan anledning). Dokumentationen
  är tydlig i ord, men ingen skarp mätning gjordes eller kunde göras av mig
  (§ 3, § 5).
- **Om `CLAUDE_CODE_DISABLE_CRON` eller GrowthBook-flaggorna är satta i
  Marcus faktiska interaktiva miljö.** Jag sökte min egen worktree,
  `.claude/settings.json`/`.claude/settings.local.json` och miljövariablerna
  i min egen bash-process — noll träffar — men min process ärver inte
  nödvändigtvis exakt samma skal-miljö som en interaktiv orkestrator-session
  i VS Code.
- **Om `/loop`s dynamiska (självvalda) intervall-läge**, som enligt
  dokumentationen kan använda `Monitor`-verktyget direkt i stället för
  fasta cron-turer ("often more token-efficient... avoids polling
  altogether"), skulle undvika kostnadsinvändningen i § 7. Detta är en
  lovande men oprövad tredje variant av § 2.4/§ 6.1 som inte hann mätas i
  detta pass.
- **Mergifys arkitektur och `gh webhook forward`s beteende i vår sandbox**
  — redan flaggat obelagt av det tidigare passet
  (`orkestrerar-vackning-polling-vs-event-driven-2026-08-02.md` § "Vad jag
  inte kunde belägga"); ingen ny information i detta pass.

---

## Källor

**Primärkälla — Anthropics officiella dokumentation, hämtad 2026-08-04 i
detta pass:**

- [Automate work with routines](https://code.claude.com/docs/en/routines.md)
- [Run prompts on a schedule](https://code.claude.com/docs/en/scheduled-tasks.md)
- [Schedule recurring tasks in Claude Code Desktop](https://code.claude.com/docs/en/desktop-scheduled-tasks.md)
- [Agent view / backgrounding a session](https://code.claude.com/docs/en/agent-view.md)

**Kontext internt (ej ny research, refererad för sammanhang):**

- `scripts/heartbeat-svep.sh` + `.heartbeat-svep-policy.conf`
- `CLAUDE.md` § Landning, "Svep vid varje väckning"
- `tasks/threads/T111-autonom-orkestrering-kontexttroskel.md`
- `tasks/threads/T112-vackningskedjan-over-turgransen.md`
- `tasks/threads/README.md` (`T111`, `T112`, `T119`-raderna)
- `backlog/tasks/task-135 - ...md` (Done — observabilitetsfix, disjunkt fråga)
- `docs/research/orkestrerar-vackning-polling-vs-event-driven-2026-08-02.md`
- `tasks/sessions/archive/2026-08/2026-08-04-session-97.md` (uppdragets källrad, rad 726–728)

## Släktskap

`T111` (autonom orkestrering — kontext-tröskel; motsatt mål på samma
verktygsyta, se § 4) · `T112` (väckningskedjan över turgränsen — denna
rapport besvarar delar av dess öppna punkt (iv), se § 5) · `TASK-135`
(Done — disjunkt observabilitetsfix i samma skript) · `T119` (mekaniserings-
programmet, arbetslistans punkt (c), källan till detta uppdrag).
