# ADR-096: Subagentens väntekontrakt — en subagent GÖR, orkestreraren VÄNTAR

- Status: Accepted (grillad samsyn S99 Del 2, Marcus-kvitterad 2026-08-07)
- Datum: 2026-08-07
- Fas: Session 99 (tråd `T112`, PRD `TASK-148`)

## Kontext

Tre mätta instanser av samma felklass: `L323` (2026-07-23), `L340`
(2026-07-25), och tre agenter som samma dag (2026-08-05) parkerade
samtidigt på egna lokala grindar och tillsammans brände ~700k tokens på
väntan som strukturellt inte kunde brytas. Rotorsaken på subagent-sidan är
belagd: en subagent har ingen framtida tur att vakna i, `Monitor`-verktygets
callback levereras aldrig till en subagent (`L340`), och `TaskOutput` finns
inte i dess verktygslista överhuvudtaget.

Orkestreraren märker inte parkeringen heller. `T112` mätte att en
fullbordad bakgrundsvakt inte väcker en idle huvudsession — en agents
`gh pr checks --watch` fullföljde med exit 0 utan att agentens
återupptagning nådde sessionen, och elva spawnade agenter stod en hel natt
parkerade innan Marcus första meddelande nästa dag väckte dem. Harnessets
egen tasklista visade samtidigt "No tasks found" medan elva agenter var
aktiva.

Kompensationer finns redan och löser en ANNAN del av problemet:
heartbeat-svepet (`scripts/heartbeat-svep.sh`, `CLAUDE.md` § Landning) och
stop-vakten ([ADR-087](ADR-087-stop-vakten-avslutspastaende-mot-observerat-tillstand.md))
stämmer av ett redan avgivet avslutspåstående mot observerat tillstånd, och
vakt-design-regeln i `.claude/agents/bygg-agent.md` säger åt agenter att inte
parkera på landnings-vakter. Ingen av dem täcker vägen **IN** i parkeringen:
`Monitor` och `Bash` med `run_in_background: true` är anropbara i
subagent-kontext, oavsett vad instruktionstexten säger — och instruktion
ensam har redan bevisats otillräcklig tre gånger i detta repo.

**Research-passet** (`docs/research/subagent-parkering-handoff-kontrakt-2026-08-05.md`,
avgränsat pass, primärkälle-citerat, kört oisolerat) granskade sju
multi-agent-/workflow-system — Temporal, AWS Step Functions, Apache Airflow,
LangGraph, OpenAI Agents SDK, AutoGen, CrewAI — plus A2A-protokollet. Fyndet
är entydigt på en punkt: **hos varje moget durable-execution-system ligger
väntan strukturellt i ett ANNAT lager än utföraren**, och samtliga
persisterar resultatet FÖRE de går in i väntan (Temporals Event History,
LangGraphs checkpointer som sparar state innan `interrupt()` returnerar,
Step Functions task-token). Det starkaste enskilda fyndet: **Claude Codes
egen harness gör detta redan, mekaniskt, för TRE av fyra async-vägar** —
`ScheduleWakeup`, `TaskOutput`, `WaitForMcpServers` och `Workflow` är
strukturellt borttagna ur varje subagents verktygslista, "even when listed
in the `tools` field" (`sub-agents`-dokumentationen, mätt mot lokalt
installerad `claude 2.1.222`). `Monitor` är den enda av de fyra som lämnats
kvar — listad och anropbar, men med sitt leveranslöfte mätt trasigt för
subagent-kontext (`L340`). Det är exakt den lucka detta beslut stänger.

Anthropics eget produktionssystem (`multi-agent-research-system`-artikeln)
bekräftar dessutom att branschledaren själv delar vår flaskhals och
medvetet valt att inte lösa den asynkront ännu — "the entire system can be
blocked while waiting for a single subagent to finish searching" — av
skälet att asynkron delegering flyttar problemet till "result coordination,
state consistency, and error propagation" i stället för att lösa det.

**Grillad samsyn** (`tasks/sessions/archive/2026-08/2026-08-07-session-99.md` § Del 2, fem
kvitterade frågor):

1. **Scope:** båda sidorna — sida 1 (subagenten parkerar; rotorsak belagd)
   mekaniseras, sida 2 (orkestreraren märker inget; rotorsak obelagd, `T112`
   mätning iv aldrig körd) mäts till 100 %.
2. **Mekaniseringarna:** alla tre, i ordning — PreToolUse-spärren →
   instruktionskompletteringen → principnamngivningen. Extern köhanterare
   avrådd.
3. **Mätningens form:** differentialprotokoll i dedikerad HITL-session,
   facit ur sessions-JSONL.
4. **ADR + hemvist:** detta beslut, spoke-lokalt (hooks distribueras inte
   via plugin, `L370`).
5. **Leveransform:** PRD-kort + skivor i beroendeordning.

**Premiss-korrektionen** (skarv-steget i samma grillning): planens skiva
"bygg ADR-087-hooken" utgick — `scripts/stop-vakt.sh` är redan byggd,
registrerad på `Stop` + `SubagentStop` i `.claude/settings.json` och
tvåsidigt bevisad (`TASK-113`). Marcus process-markering skördad som
lärdom: kod-verifiera substratet FÖRE frågorna formuleras — samma disciplin
som [ADR-086](ADR-086-uppdragets-premisser-provas-av-mottagaren.md) redan
kräver av uppdragsmottagaren, nu inbakad som obligatoriskt premiss-pass i
varje skiva under `TASK-148`.

## Beslut

**Kontraktet namnges och mekaniseras: en subagents jobb är att GÖRA, aldrig
att VÄNTA.** Temporal-mönstret som förebild för namngivningen: subagenten är
Activity (utför ett avgränsat jobb, kan vara icke-deterministiskt, returnerar)
— orkestreraren är Workflow (durabel, överlever turgränser, äger väntan och
väckningen). Distinktionen som bär mönstret är inte hierarki utan
**livslängd**: orkestreraren lever längre än väntetiden, en subagent gör det
inte. Fyra delar, i den ordning grillningen låste:

### 1. Kontraktet

En subagent avslutar sin tur genom att GÖRA klart sitt avgränsade arbete och
returnera — aldrig genom att gå in i en väntan på en händelse som inträffar
efter turens slut. Orkestreraren är den enda parten med en framtida tur att
vakna i, och därmed den enda parten som får äga väntan. Detta är inte en
policy vald i brist på alternativ; det är samma arkitektur fyra oberoende,
mogna durable-execution-system valt, applicerad på vår skala, och samma
princip Anthropics egen harness redan kodifierat för tre av fyra
async-primitiver.

### 2. Mekaniseringen — PreToolUse-spärren (`TASK-148.2`)

En `PreToolUse`-hook nekar `Monitor`-anrop och `Bash`-anrop med
`tool_input.run_in_background == true` när hook-indatan bär `agent_id`
(subagent-kontext) — samma fält `hooks`-dokumentationen anger som avsett för
just denna distinktion: *"Present only when the hook fires inside a
subagent call. Use this to distinguish subagent hook calls from main-thread
calls."* Detta fullföljer, med exakt samma medel (strukturellt borttaget
verktyg för subagent-kontext), mönstret Anthropic redan valt för de fyra
andra async-vägarna — det är inte en ny idé, det är att stänga en lucka
förstaparten lämnat öppen för just `Monitor`.

Logiken är universell; värdena (matchade verktyg, mönster för
`agent_id`-fältet) bor i egen policy-config per repots grindvakts-konvention
(Lesson #6). Registreras i `.claude/settings.json` — hooks distribueras inte
via pluginet (`L370`, mätt: `hooks`-nyckeln tappas tyst) — och måste därför
dupliceras per spoke, samma medvetna kostnad som `stop-vakt.sh` redan bär.

Skarpbevis kan aldrig tas i den session som bygger hooken (repots egen
hook-laddningsregel, `CLAUDE.md`: *"En ny hook kan ALDRIG skarpbevisas i
sessionen som byggde den"*) — logiken bevisas tvåsidigt med en syntetisk
testsvit i byggsessionen, och den faktiska fyrningen bokförs som öppen skuld
och betalas som en av nästa sessions första handlingar, med samma
differentialmätning ADR-087 använde (provocera en redan laddad hook parallellt
för att skilja "fel logik" från "ej laddad än").

### 3. Instruktionskompletteringen (`TASK-148.3`)

Kompletterar `.claude/agents/bygg-agent.md`s befintliga sektion **"Ingen
asynkron signal når dig — kör allt du måste invänta i FÖRGRUNDEN"** — inte en
ny sektion, en komplettering, eftersom sektionen redan finns och redan bär
`L323`/`L340`-empirin. Två tillägg:

- **Persistens före väntan.** `git commit` + `git push` av det egna
  atomära, färdiga arbetet INNAN något anrop som kan trigga bakgrundsläge
  (`Monitor`, eller ett `Bash`-kommando utan snävt satt `timeout`).
  Motiveringen är forskningspassets § 4-fynd: samtliga tre durable-motorer
  KRÄVER att persistens sker som en förutsättning för att gå in i väntan,
  aldrig som en eftertanke efteråt. Vår tredje incident (2026-08-05) hade
  arbetet på disk men aldrig committat/pushat — sekvensen, inte artefakten,
  var det som saknades.
- **Explicit timeout på långa kommandon.** Enda försvaret mot harnessens
  egen tysta auto-bakgrunds-konvertering: ett synkront förgrundskommando som
  passerar sin timeout (`BASH_DEFAULT_TIMEOUT_MS` 2 min ute-av-lådan,
  `BASH_MAX_TIMEOUT_MS` 10 min tak) flyttas till bakgrund AV HARNESSEN SJÄLV,
  utan att subagenten bad om det — och ingen `PreToolUse`-hook kan ångra den
  konverteringen i efterhand, eftersom den godkände det ursprungliga
  förgrunds-anropet. Detta är den väg PreToolUse-spärren i del 2 INTE täcker,
  och som därför måste stå bredvid den som instruktion, inte som ersättning.

### 4. Harness-mätningen (`TASK-148.4`/`TASK-148.5`)

Ett differentialprotokoll som skiljer EN variabel per cell — bakgrunds-`Bash`
· `Monitor`-event · subagent-completion, vardera mätt mot en idle session
respektive en nyss aktiv session — med facit läst ur sessionens JSONL-
transcript i efterhand. Protokollet författas av agent (`TASK-148.4`);
mätningen körs i en dedikerad HITL-session (`TASK-148.5`), eftersom `T112`
mätning iv (*"levereras task-notifikationer till en idle huvudsession utan
användarinteraktion? Bryts kedjan vid agent-resume eller vid
notifikations-leverans?"*) prövar precis den händelsekedja en agent
strukturellt inte kan orkestrera på sig själv — att mäta om en idle session
vaknar kräver bokstavligen att sitta idle över en turgräns, vilket ingen
agent kan iscensätta åt sig själv inifrån sin egen tur. Landar som
research-dokument + uppdatering av `T112`. En upstream-issue till
harness-leverantören (`TASK-148.6`) filas bara om mätningen bekräftar ett
brott mot dokumenterat beteende — agenten författar utkastet, Marcus
godkänner texten före filing, eftersom det är en utåtriktad handling.

## Syskonmekanism — [ADR-087](ADR-087-stop-vakten-avslutspastaende-mot-observerat-tillstand.md), refererad och oförändrad

ADR-087s stop-vakt (`Stop`/`SubagentStop`-hook, `scripts/stop-vakt.sh`)
löser en ANNAN del av samma problemfamilj och rörs inte av detta beslut: den
stämmer av ett redan AVGIVET avslutspåstående mot observerat tillstånd —
*"väntar på att `#439` landar"* utan att `background_tasks` bär det. Detta
beslut löser vägen IN i parkeringen, före turen ens avslutas — stop-vakten
täcker fallet där en aktör ändå säger något den inte kan bära. De två
mekanismerna komponerar snarare än överlappar:

- PreToolUse-spärren (del 2) stänger den identifierade luckan (`Monitor` +
  explicit `run_in_background`).
- Auto-bakgrunds-fällan (§ Beslut del 3) är en väg spärren INTE täcker —
  harnessen konverterar en godkänd förgrunds-körning till bakgrund efter
  eget beslut.
- Går ett väntepåstående ändå igenom — via just den fällan, eller via ett
  mönster ingen av de två mekanismerna förutsett — är stop-vakten
  andra försvarslinjen: den fäller påståendet mot observerat tillstånd
  innan turen tillåts sluta.

ADR-087s egen § Ärliga svagheter punkt 2 säger det rakt ut: *"`T112`-hålet
täcks INTE... Vakten prövar att en väckningsmekanism finns — den kan inte
bevisa att väckningen når fram."* Detta beslut stänger inte det hålet
heller — `TASK-148.4`/`TASK-148.5` är mätningen som kan ge det hålet ett
facit, inte en mekanism som redan löser det.

## Decline-rationale — extern köhanterare avrådd (research-passets alternativ D)

**Explicit avrådd, inte tyst uteslutet.** Research-passets alternativ D — en
extern, alltid-uppe köhanterare i Temporal/Step-Functions-stil som ett tredje
lager mellan orkestrerare och subagent — är den ENDA av de fyra granskade
alternativen som faktiskt löser SKALNINGSPROBLEMET Anthropics egen
engineering-artikel öppet beskriver (en enda långsam subagent kan blockera
hela framdriften). Det är alltså inte förkastat på grund av svaghet i
argumentet för det.

Det är förkastat på PROPORTIONALITET. Vi har mätt EN
flaskhals-kostnad (~700k tokens en session) och NOLL mätning av hur ofta
orkestrerar-väntan faktiskt blockerar FRAMDRIFT, till skillnad från att bara
kosta tokens. Att bygga extern infrastruktur — en komponent som måste vara
mer pålitlig än det den ska skydda mot, med egen driftsyta och egna
felklasser — för ett problem vars FREKVENS vi inte känner, är precis den
spekulativa komplexitet CLAUDE.md:s dubbelriktade över-engineering-vakt
varnar för: "ingen lösning som letar problem", "inget byggt ifall".

**Omprövningsvillkoret är explicit, inte en stängd dörr:** alternativet tas
upp igen bara om en framtida mätning visar att synkron orkestrerar-väntan
faktiskt blockerar framdrift — inte bara kostar tokens — med en frekvens som
motiverar kostnaden. `TASK-148.4`/`TASK-148.5`s harness-mätning är steget som
skulle kunna producera den mätningen; den finns inte i dag.

## ADR-baren — prövad

1. **Svår att återställa?** Ja, i båda meningarna. I kod: PreToolUse-spärren
   ändrar vilka verktyg som faktiskt fungerar för varje subagent i repot —
   att riva den återinför en klass av fel som redan kostat ~700k tokens en
   enda session. I koherens: gränsen mellan detta beslut och `ADR-087`
   (vägen in i parkering vs. avstämning av ett redan avgivet påstående) är
   omöjlig att rekonstruera ur skripten ensamma utan denna ADR.
2. **Överraskande utan kontext?** Ja — att `Monitor`, ett verktyg som formellt
   finns kvar i en subagents verktygslista, tyst nekas för just den agenten
   är oväntat om man inte känner till att dess leveranslöfte är mätt trasigt
   (`L340`). Utan denna ADR ser spärren ut som ett godtyckligt förbud mot ett
   fungerande verktyg.
3. **Verklig avvägning?** Ja: PreToolUse-spärren kostar ännu en mekanism i
   ett system som redan har många (samma erkännande research-passet gör
   öppet i sin § "Vad som talar EMOT förstahandsrekommendationen"), och
   löser ändå bara EN av flera vägar in i parkering — auto-bakgrunds-fällan
   kvarstår som instruktion, inte mekanism. Vägdes mot att instruktion ensam
   redan är empiriskt vederlagd tre gånger i detta repo (`L323`, `L340`,
   2026-08-05).

## Alternativ som övervägdes

Fyra alternativ vägda i research-passet, rangordning bevarad:

- **A — PreToolUse-spärren (vald, rangordning 1).** Grundad direkt i mönstret
  Anthropic redan valt för de fyra andra async-vägarna; billigast att bygga
  av de fyra; adresserar exakt den mätta luckan. Löser INTE
  auto-bakgrunds-fällan eller busy-wait-mönster (upprepade korta polling-
  anrop — bränner tokens men parkerar inte permanent, egen framtida yta om
  mätning motiverar).
- **B — Instruktionskomplettering ensam (vald som KOMPLEMENT till A,
  rangordning 2 i kombination).** Fristående den svagaste av de fyra: tre
  mätta instanser visar redan att instruktion utan mekanism inte hållit.
  Vald ändå, som del 3, eftersom den täcker auto-bakgrunds-fällan som A inte
  kan nå.
- **C — Principnamngivning i konstitutionen (vald som billigt tillägg,
  rangordning 3).** Ren dokumentations-skärpning, inget nytt att bygga.
  Ändrar inget beteende i sig — värdefull som gemensamt vokabulär för A och
  B, inte som fristående åtgärd. Namnges i detta beslut (§ Beslut del 1) och
  refereras framåt.
- **D — Extern köhanterare (rangordning 4, EXPLICIT AVRÅDD).** Se § Decline-
  rationale ovan.

## Konsekvenser

**Positiva:** vägen in i den mätta parkerings-klassen får för första gången
en mekanisk spärr i anropsögonblicket, i stället för att bero på att varje
agent minns och följer en instruktionsrad. Kontraktet får ett namn
(Temporal-mönstret) som en framtida läsare kan slå upp och förstå VARFÖR,
inte bara ATT. `ADR-087` och detta beslut komponerar till en tvåstegs
försvarslinje för samma problemfamilj i stället för att överlappa.
Proportionalitets-resonemanget för att INTE bygga extern infrastruktur står
skrivet, granskningsbart och omprövningsbart, i stället för att vara ett
tyst antagande.

**Negativa/skuld, öppet burna:** PreToolUse-spärren är ännu en hook-mekanism
i ett system som redan har flera, med egen risk för buggar i matchningen.
Skarpbeviset för spärren kan inte tas förrän en session efter byggsessionen
(hook-laddningsregeln) — bokförs som öppen skuld i `TASK-148.2`, inte som
gjort här. Auto-bakgrunds-fällan förblir instruktion, inte mekanism — ett
foreground-kommando som passerar sin timeout konverteras av harnessen
oavsett vad denna ADR säger. `T112`-hålet (väcker en fullbordad vakt
verkligen en idle session?) är INTE stängt av detta beslut — det är
`TASK-148.4`/`TASK-148.5`s jobb att mäta det, och till dess kvarstår hålet
öppet, precis som `ADR-087` redan bokför det. Busy-wait-klassen (upprepade
korta polling-anrop som bränner tokens utan att parkera) adresseras inte
alls av detta beslut — egen, framtida yta om mätning motiverar.

## Relaterat

- Research: [`subagent-parkering-handoff-kontrakt-2026-08-05.md`](../research/subagent-parkering-handoff-kontrakt-2026-08-05.md)
  — sju system + A2A-protokollet, primärkälle-citerat, hela underlaget för
  § Kontext och § Decline-rationale.
- [ADR-087](ADR-087-stop-vakten-avslutspastaende-mot-observerat-tillstand.md)
  — syskonmekanismen, refererad i § Syskonmekanism, oförändrad av detta
  beslut.
- [ADR-086](ADR-086-uppdragets-premisser-provas-av-mottagaren.md) — samma
  disciplin (kod-verifiera substratet före frågorna/designen) som
  premiss-korrektionen i grillningen bekräftade och som varje skiva under
  `TASK-148` bär obligatoriskt.
- [ADR-053](ADR-053-trad-arkitektur-forensisk-lasbarhet-triage.md) (Triage
  av det oväntade) och
  [ADR-090](ADR-090-sessions-parallellitet-detektera-och-fraga.md)
  (sessions-parallellitet) — styrande i området per PRD `TASK-148` §
  ADR-koppling.
- [`tasks/threads/T112-vackningskedjan-over-turgransen.md`](../../tasks/threads/T112-vackningskedjan-over-turgransen.md)
  — väckningskedjan över turgränsen, mätning iv fortfarande öppen,
  § Åtgärdsriktningar (iv).
- `tasks/threads/README.md` tråd `T108` — orkestreraren väntar på
  notifieringar som strukturellt aldrig kommer.
- `backlog/tasks/task-148*` — PRD + skivor (`TASK-148.1`–`TASK-148.7`).
- `tasks/sessions/archive/2026-08/2026-08-07-session-99.md` § Del 2 — grillad samsyn, fem
  kvitterade frågor + premiss-korrektionen.
- `.claude/agents/bygg-agent.md` § "Ingen asynkron signal når dig" —
  sektionen `TASK-148.3` kompletterar.
- `tasks/lessons.md` `L323`, `L340`, `L370` — de tre mätta instanserna av
  instruktion-utan-mekanism, och plugin-hooks-distributionshindret.
