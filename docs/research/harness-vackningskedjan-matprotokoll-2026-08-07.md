---
owner: marcus803
updated: 2026-08-07
review_by: 2027-02-07
status: stable
---

# Harness-mätprotokollet: var bryts väckningskedjan för en idle huvudsession? (Code, 2026-08-07)

> **Proveniens:** avgränsat protokoll-författande pass, `TASK-148.4`
> ("Skiva: harness-mätprotokollet — var bryts väckningskedjan"), barn-kort till
> `TASK-148` (PRD: Subagentens väntekontrakt). Uppdraget besvarar T112 §
> Åtgärdsriktning (iv), den enda av fyra riktningar som stod öppen efter
> Marcus GO 2026-08-01: *"levereras task-notifikationer till en idle
> huvudsession utan användarinteraktion, och bryts kedjan vid
> notifikations-leverans eller vid agent-resume?"*
>
> **Vad passet gjorde:** läste de fyra källorna uppdraget pekade ut
> (`T112`-tråden, `obevakade-tillstand-vaktens-form-2026-07-30.md`,
> `subagent-parkering-handoff-kontrakt-2026-08-05.md` § 1.1,
> sessionsdok S99 Del 2), och körde ett obligatoriskt premiss-pass (ADR-086)
> mot **faktisk lokal sessions-JSONL** i stället för att anta harnessens
> notifikationsschema ur research-textens beskrivning. Det passet avslöjade
> ett konkret, verifierat schema (§ 1) som blev protokollets bärande
> mekanism — starkare grund än det ursprungliga uppdraget förutsatte, och
> en portabilitetsbugg (macOS `date` saknar `%N`) som hade gjort ett
> ograndat protokoll obrukbart på den maskin det ska köras på.
>
> **Vad passet INTE gjorde:** exekverade INTE protokollet. Ingen cell nedan
> är körd; T112:s öppna fråga är **fortfarande obesvarad** efter detta
> dokument. Mätningen är `TASK-148.5`, en dedikerad HITL-session. Ingen kod,
> config eller hook rördes. Ingen commit utöver denna fil + kortets
> statusflipp.

---

## Kort svar

**Protokollet finns nu, mätningen finns inte.** Sex differentialceller
(bakgrunds-Bash · Monitor-event · subagent-completion, vardera mot en
huvudsession som är idle ≥10 minuter eller nyss aktiv ≤60 sekunder före
händelsens sanna avslut) med konkreta steg, en verifierad facitmetod och en
uttrycklig genomförandeordning. Facitmetoden vilar på ett faktiskt fynd, inte
ett antagande: Claude Codes harness loggar varje bakgrundshändelse som en
`queue-operation`-rad i sessionens egen JSONL, följt av en syntetisk
`user`-vändning som bär exakt samma `<task-notification>`-innehåll. Den
sekvensen — `enqueue` → syntetisk `user`-vändning → nästa `assistant`-vändning
— är precis den kedja T112 frågar om, och den går att läsa post-hoc utan att
gissa.

---

## § 0 — Premiss-pass (ADR-086): vad restes och vad höll

| Premiss (uppdrag eller egen arbetshypotes) | Prövad hur | Utfall |
|---|---|---|
| ADR-096 är mintad och kan citeras som styrande | `ls docs/decisions/ \| grep 096` | **Falsk.** ADR-096 finns INTE i repot ännu (`TASK-148.1` är parallell, ej landad). Detta dokument refererar den som "planerad", aldrig som existerande. |
| T112 § Åtgärdsriktning (iv) är den rätta öppna frågan att besvara | Läste `T112`-kortet i sin helhet | **Bekräftad.** (i)–(iii) är låsta i drift 2026-08-01; (iv) står explicit "KVARSTÅR ÖPPEN — kort-kandidat post-S91". |
| Harnessens notifikationsmekanism är obelagd hos oss och måste beskrivas ur andrahandskällor (research-dokumenten) | Inspekterade en faktisk lokal sessions-JSONL (`~/.claude/projects/<projektmapp>/<sessionId>.jsonl`) i stället för att lita på research-textens beskrivning | **Falsk — starkare grund fanns.** JSONL:en bär ett fullt maskinläsbart schema (`type: "queue-operation"`, se § 1) som varken `T112` eller de två research-dokumenten nämner. Detta är protokollets viktigaste enskilda fynd. |
| `date -u +%FT%T.%3NZ` ger millisekund-precision på exekverande maskin (macOS) | Kört skarpt: `date -u +%Y-%m-%dT%H:%M:%S.%3NZ` | **Falsk.** BSD `date` (macOS) saknar `%N` helt — kommandot skriver ut den bokstavliga strängen `.3NZ`, inte millisekunder. Ett protokoll skrivet mot GNU-`date`-antaganden hade producerat obrukbara markörfiler på just den maskin mätsessionen körs på. Protokollet nedan använder därför sekund-precision (`%Y-%m-%dT%H:%M:%SZ`), portabel på båda och gott nog givet minutlånga väntefönster. |
| `Monitor`-verktyget kan monteras på en REDAN körande bakgrunds-Bash-process | Läste `Monitor`-verktygets faktiska schema (ToolSearch, `select:Monitor`) | **Falsk.** `Monitor` startar sitt EGET `command` — det finns inget "montera på befintligt jobb"-läge. `heartbeat-svep.sh`s egen kommentar ("kör skriptet UTAN --once i en bakgrunds-bash och montera med Monitor-verktyget") beskriver alltså två SEPARATA åtgärder (en `run_in_background`-Bash + en fristående `Monitor`-instans som läser samma process via t.ex. `tail -f` på dess loggfil), inte ett enda anrop. § 3, Cell 3–4, är skrivna mot det verifierade schemat. |
| `Monitor`s default-timeout (300 000 ms) räcker för en 15-minuters idle-cell | Läste verktygsschemat (`timeout_ms`, default 300000, max 3600000) | **Falsk om ej satt explicit.** En idle-cell med 900 s väntetid MÅSTE sätta `timeout_ms` > 900000 (protokollet nedan sätter 1 080 000 ms), annars dödar Monitor sig själv innan händelsen hinner inträffa och cellen mäter "monitor-timeout", inte "väckningskedja". |
| `jq`/`python3` finns tillgängliga för facit-läsningen | `which jq && jq --version`; `python3 -c ...` körda skarpt i denna session | **Bekräftad.** `jq-1.7.1`, `python3` fungerande. |
| Spawnade subagenter får en egen, separat sessions-JSONL med `isSidechain: true`-rader i huvudsessionens fil | Sökte `isSidechain: true` i tre olika lokala sessions-JSONL-filer | **Falsk, eller åtminstone obelagd.** Noll träffar i samtliga tre filer trots bekräftat spawnade subagenter i loggen. Protokollet förlitar sig därför INTE på att hitta subagentens egen transkript-fil — Cell 5–6 använder samma externa markör-mekanism som Cell 1–4 (§ 2), vilket sidesteppar antagandet helt. |

**"Inga divergenser" gäller inte här** — fem av åtta prövade premisser föll, samtliga bokförda ovan i stället för tyst korrigerade. Två (ADR-096, `date`-portabiliteten) hade gjort protokollet obrukbart eller felciterande om de fått stå oprövade.

---

## § 1 — Facit-mekanismen: JSONL-schemat, verifierat mot faktisk transcript

Claude Codes harness skriver en rad per händelse till sessionens egen JSONL
(`~/.claude/projects/<projektmapp>/<sessionId>.jsonl` — samma
sökvägskonvention som `docs/research/s83-transkriptgranskning-2026-07-24.md`
använder). Verifierat genom att läsa en faktisk lokal fil rad för rad
(`python3 -c "import json; ..."` + `jq`), inte antaget ur dokumentation:

**Toppnivå-nycklar som faktiskt förekommer** (icke-uttömmande, de som är
relevanta här): `type`, `operation`, `timestamp`, `content`, `sessionId`,
`message`, `pendingBackgroundAgentCount`, `isSidechain`.

**Den bärande sekvensen, tre rader per bakgrundshändelse:**

1. **`{"type": "queue-operation", "operation": "enqueue", "timestamp": "…", "content": "<task-notification>…</task-notification>"}`**
   — harnessen registrerar att en bakgrundshändelse är klar. `content` bär en
   XML-liknande payload med `<task-id>`, valfritt `<tool-use-id>` (finns för
   Bash/Agent-bakgrundsjobb, **saknas** för `Monitor`-events — verifierat, se
   nedan), valfritt `<output-file>`, `<status>`, `<summary>` och för
   `Monitor`-events ett `<event>`-fält i stället för `<result>`.
2. Nollor eller flera `{"type": "queue-operation", "operation": "dequeue"}` —
   **bär ALDRIG `content`** (verifierat: 15/15 `dequeue`-rader i testfilen
   saknade `content`, mot 22/22 `enqueue`- och 7/7 `remove`-rader som bar
   det). En `dequeue`-rad kan alltså INTE matchas mot ett task-id direkt —
   facitmetoden i § 4 kringgår detta genom att inte förlita sig på `dequeue`
   alls.
3. **`{"type": "user", "message": {"role": "user", "content": "<task-notification>…samma payload…</task-notification>"}, "timestamp": "…"}`**
   — en SYNTETISK användar-vändning injiceras i konversationen, med exakt
   samma `<task-id>` som steg 1. Det är HÄR notifikationen blir en faktisk
   del av transkriptet konversationen kan svara på — inte vid `enqueue`.
4. Nästa `{"type": "assistant", …}`-rad EFTER steg 3:s tidsstämpel är
   modellens faktiska svar på notifikationen — **detta är "agent-resume"**
   i T112:s mening.

**Ett fynd ur harnessens EGEN text, inte min tolkning:** en Agent-completion-
notifikation bär ett `<note>`-fält, ordagrant ur en faktisk rad: *"A
task-notification fires each time this agent stops with no live background
children of its own. The user can send it another message and resume it, so
the same task-id may notify more than once."* Detta är förstapartens egen
beskrivning av kontraktet, hittad genom att läsa en levererad notifikation —
starkare källa än något externt dokument.

**Verifierat skillnad mellan händelsetyperna, i samma fält:**

| Händelsetyp | `<tool-use-id>` | `<output-file>` | Slutfält |
|---|---|---|---|
| Bakgrunds-Bash | Finns | Finns | `<result>` (kommandots stdout/status) |
| Subagent (Agent-verktyget) | Finns | Finns | `<result>` (agentens slutrapport) + `<usage><subagent_tokens>…<duration_ms>…</usage>` + `<worktree>…</worktree>` |
| `Monitor`-event | **Saknas** | **Saknas** | `<event>` (den matchande textraden) |

`<usage><duration_ms>` på en subagent-notifikation är en bonus-signal för
Cell 5–6: harnessen självrapporterar subagentens exekveringstid, vilket ger
en andra, oberoende skattning av sann avslutstid (`T_spawn + duration_ms`)
utöver markörfilen.

**Vad som INTE verifierades** (protokollet bygger inte på dessa, men de är
värda att notera för mätsessionen): exakt vad som skiljer `dequeue` från
`remove` semantiskt (båda sågs på olika task-id i testfilen; ingen
primärkälla eller kodläsning gjordes för att fastställa skillnaden) — se
§ 6.

---

## § 2 — Definitioner protokollet vilar på

**IDLE_GAP (≥10 minuter):** huvudsessionens senaste `type: "assistant"` eller
mänskligt författade `type: "user"`-vändning ligger minst 10 minuter före
händelsens sanna avslutstidpunkt (§ ground truth nedan), och **ingen** ny
mänsklig inmatning eller verktygsanrop sker under väntan. 10 minuter valt som
gott-nog-tröskel för en engångs-HITL-mätsession — långt under T112:s faktiska
incident (en hel natt) men tillräckligt för att otvetydigt skilja "just
startad" från "vilande", och praktiskt genomförbart inom en session.

**ACTIVE_GAP (≤60 sekunder):** händelsens sanna avslut inträffar inom 60
sekunder efter senaste sessionsaktivitet (själva start-anropet), och ingen
ytterligare mänsklig inmatning sker under den korta väntan. Skillnaden mot
IDLE_GAP är UTESLUTANDE hur lång tid som förflutit sedan senaste
sessionsaktivitet — inget annat varieras (uppfyller AC#1:s krav "varje cell
skiljer EN variabel").

**Ground truth-avslutstid (`T_complete`):** en extern markörfil, skriven av
den mekanism som testas SJÄLV, med innehållet `date -u +%Y-%m-%dT%H:%M:%SZ`
vid det exakta ögonblick händelsen blir sann. Läses via `cat`, ALDRIG via
`stat`-mtime (portabilitetsskäl, § 0). Detta undviker varje beroende av att
hitta en förmodad intern harness-fil (subagentens egen transkript är,
verifierat, INTE påvisbar via `isSidechain`, § 0).

**HITL-operatörens egen loggbok:** ett separat, av operatören (Marcus) fört
klartextdokument med en rad per mänsklig handling under mätsessionen (`HH:MM:SS
UTC — vad gjordes`). Detta är den ENDA tillförlitliga källan för att skilja
"en syntetisk notifikations-vändning" från "en äkta mänsklig vändning" i
efterhandsläsningen (§ 4) — JSONL:en själv bär ingen sådan flagga.

**Scratchpad-namngivning:** varje markörfil prefixas med den exekverande
sessionens kort-ID (`TASK-148.5`) och cellnamn, t.ex.
`TASK-148.5-cell1-idle-marker.txt` — konventionen som
`docs/research/harness-namnrymd-agenter-2026-07-30.md` dokumenterar
(scratchpad-katalogen delas mellan agenter i samma session; namnlösa filer
kan skrivas över tyst).

**De tre utfallsklasserna** (samma tre för alla sex celler — definieras en
gång här, refereras per cell):

- **Utfall A — kedjan håller.** `enqueue`-rad med matchande task-id finns
  inom rimlig tid efter `T_complete` (< 2 minuter), följt av en syntetisk
  `user`-vändning med samma innehåll, följt av en `assistant`-vändning UTAN
  att någon mänsklig inmatning (enligt loggboken) inträffat mellan
  markörens skrivning och den `assistant`-vändningen.
- **Utfall B — kedjan bryts vid notifikations-leverans.** Ingen
  `enqueue`-rad med matchande task-id existerar i JSONL:en förrän (om alls)
  en tidsstämpel som sammanfaller med nästa MÄNSKLIGA inmatning (enligt
  loggboken) — dvs. harnessens egen köläggning aldrig sker spontant under
  väntan, utan bara triggas av extern aktivitet.
- **Utfall C — kedjan bryts vid agent-resume.** `enqueue` OCH den syntetiska
  `user`-vändningen existerar med tidsstämpel nära `T_complete` (notifikationen
  NÅDDE transkriptet), men ingen `assistant`-vändning följer förrän en
  MÄNSKLIG inmatning (enligt loggboken) inträffar — notifikationen satt
  synlig i historiken utan att trigga ett nytt turvarv.

Utfall B och C är ömsesidigt uteslutande per cell (facitmetoden i § 4 avgör
vilket genom att läsa i just den ordningen).

---

## § 3 — De sex cellerna

| # | Händelsetyp | Sessionstillstånd | Vad som SKILJER sig mot systercellen |
|---|---|---|---|
| 1 | Bakgrunds-Bash-completion | Idle (≥10 min) | — (basfall) |
| 2 | Bakgrunds-Bash-completion | Nyss aktiv (≤60 s) | Endast väntetiden mellan spawn och `T_complete` |
| 3 | Monitor-event | Idle (≥10 min) | — (basfall) |
| 4 | Monitor-event | Nyss aktiv (≤60 s) | Endast väntetiden mellan spawn och `T_complete` |
| 5 | Subagent-completion | Idle (≥10 min) | — (basfall) |
| 6 | Subagent-completion | Nyss aktiv (≤60 s) | Endast väntetiden mellan spawn och `T_complete` |

Alla sex celler körs i SAMMA huvudsession, i sekvens (§ 5), var och en
isolerad i tid så att ingen tidigare cells bakgrundsaktivitet fortfarande
pågår när nästa startas — annars kontaminerar cellernas `queue-operation`-
sekvenser varandra i JSONL:en och matchning blir tvetydig.

### Cell 1 — Bakgrunds-Bash-completion, idle

**Testar:** den DEFAULT-notifikationen för ett avsiktligt bakgrundskört
Bash-kommando (`run_in_background: true` satt av orkestreraren själv — INTE
harnessens auto-bakgrunds-fälla vid timeout, som är en annan, redan flaggad
riskkälla, `subagent-parkering-handoff-kontrakt-2026-08-05.md` § 1.1).

**Steg:**

1. Orkestreraren kör, EXPLICIT med `run_in_background: true`:

   ```bash
   sleep 900 && date -u +%Y-%m-%dT%H:%M:%SZ > "$SCRATCH/TASK-148.5-cell1-idle-marker.txt" && echo CELL1-IDLE-DONE
   ```

2. Operatören noterar i loggboken: `HH:MM:SS UTC — Cell 1 (idle) startad,
   sleep 900`.
3. Operatören gör ABSOLUT INGET mer i sessionen — ingen ny prompt, inget
   tangenttryck som skickar indata — i minst 900 + 300 = 1200 sekunder
   (20 minuter) från starttidpunkten. De extra 300 sekunderna är
   observationsfönstret EFTER förväntat avslut (§ 2, Utfall-definitionerna
   kräver "< 2 minuter" för Utfall A men fönstret ger marginal för att även
   fånga ett sent-men-ändå-spontant resume).
4. Efter fönstret: läs markörfilen (`cat`) för `T_complete`. Kör facitmetoden
   (§ 4) mot sessionens JSONL.

**Förväntat utfall per hypotes:**

- Om T112 § Mätt (1):s mönster generaliserar till EGNA bakgrunds-Bash-jobb
  (inte bara subagenters): **Utfall B eller C** — ingen spontan
  `assistant`-vändning inom fönstret.
- Om default-bakgrundsnotifikationen är strukturellt annorlunda och FAKTISKT
  väcker en idle session (vilket varken `T112` eller forskningsdokumenten
  utesluter — ingen av dem testade EXAKT detta fall för orkestrerarens EGET
  jobb): **Utfall A.**

### Cell 2 — Bakgrunds-Bash-completion, nyss aktiv

**Steg:** identiskt med Cell 1, förutom `sleep 20` i stället för `sleep 900`,
och markörfilen heter `TASK-148.5-cell2-active-marker.txt`. Operatören
väntar minst 20 + 60 = 80 sekunder (inget observationsfönster utöver en
kort marginal — poängen är att fånga om resumet är omedelbart, vilket det
BÖR vara enligt det verifierade exemplet i § 1, där en "nyss aktiv" session
gick `enqueue` → `assistant` på under 7 sekunder).

**Förväntat utfall per hypotes:** **Utfall A förväntas** som nollhypotes
(detta är den enda av de sex cellerna där ett verifierat verkligt exempel
redan finns — heartbeat-svep-loopens egna `Monitor`-notifikationer i en
aktiv session gick konsekvent `enqueue` → syntetisk `user` → `assistant` på
enstaka sekunder, § 1). Ett avvikande resultat (B eller C även här) vore
det MEST förvånande utfallet i hela protokollet och bör flaggas som
prioriterat i facit-rapporten.

### Cell 3 — Monitor-event, idle

**Testar:** notifikationsvägen för `Monitor`-verktygets EGEN händelseström —
skild från Cell 1/2 genom att använda `Monitor` i stället för ren
`run_in_background`-Bash, per det verifierade schemat (§ 0: `Monitor` saknar
`<tool-use-id>`/`<output-file>` i sin notifikation).

**Steg:**

1. Orkestreraren anropar:

   ```text
   Monitor({
     description: "TASK-148.5 cell3 idle-markör",
     command: "sleep 900; date -u +%Y-%m-%dT%H:%M:%SZ | tee $SCRATCH/TASK-148.5-cell3-idle-marker.txt",
     persistent: false,
     timeout_ms: 1080000
   })
   ```

   `timeout_ms` MÅSTE sättas explicit till > 900000 (default är 300000 =
   5 min och skulle döda monitorn innan händelsen inträffar, § 0).
2. Operatören loggar starttid, väntar 1200 sekunder utan interaktion (samma
   fönster-logik som Cell 1).
3. Läs markörfilen, kör facitmetoden.

**Förväntat utfall per hypotes:** samma tre möjliga utfall som Cell 1. Den
intressanta skillnaden att observera MOT Cell 1: går Monitor-vägen genom
SAMMA `queue-operation`-mekanism (§ 1 visar att den gör det för AKTIVA
sessioner — samma schema, bara `<event>` i stället för `<result>`), eller
finns en avvikelse specifikt för idle-fallet? Detta är den konkreta luckan
`subagent-parkering-handoff-kontrakt-2026-08-05.md` § 5 flaggar som mätt
öppen för subagent-kontext (`L340`) — Cell 3 mäter motsvarande för
ORKESTRERARENS EGEN användning av `Monitor`, ett strikt annat fall.

### Cell 4 — Monitor-event, nyss aktiv

**Steg:** identiskt med Cell 3, `sleep 20`, `timeout_ms: 120000`,
markörfil `TASK-148.5-cell4-active-marker.txt`. Vänta 80 sekunder.

**Förväntat utfall per hypotes:** **Utfall A förväntas** — detta ÄR
strukturellt samma situation som det redan-verifierade exemplet i § 1
(heartbeat-svep körd som `Monitor` i en aktiv session). Ett avvikande
resultat här vore lika förvånande som i Cell 2 och bör dubbelkollas mot en
andra körning innan det rapporteras.

### Cell 5 — Subagent-completion, idle

**Testar:** notifikationsvägen när orkestreraren spawnat en subagent
(`Agent`-verktyget) som tar lång tid, och sessionen i övrigt är idle medan
subagenten arbetar.

**Steg:**

1. Orkestreraren spawnar, EXPLICIT med `run_in_background: true`:

   ```text
   Agent({
     description: "TASK-148.5 cell5 idle-markör",
     subagent_type: "general-purpose",
     run_in_background: true,
     prompt: "Kör EXAKT detta enda Bash-kommando i förgrund och vänta tills det
       avslutas: `sleep 900 && date -u +%Y-%m-%dT%H:%M:%SZ >
       $SCRATCH/TASK-148.5-cell5-idle-marker.txt`. Använd INGEN egen bakgrund
       eller Monitor. Svara sedan med exakt ordet KLAR och ingenting annat."
   })
   ```

2. Operatören loggar starttid, väntar 1200 sekunder utan interaktion.
3. Läs markörfilen (ground truth 1) OCH, som oberoende andra källa, notera
   `<usage><duration_ms>` i den funna notifikationens innehåll (§ 4) —
   `T_spawn + duration_ms` ska ligga nära markörfilens tidsstämpel; en stor
   avvikelse mellan de två är i sig ett fynd värt att bokföra.

**Förväntat utfall per hypotes:** detta är cellen som direkt återskapar
T112 § Mätt (1):s form (en spawnad agents bakgrundsvakt som fullbordas utan
att väcka någon). **Utfall B eller C förväntas** som nollhypotes, grundat i
den mätta historiken — men den historiska instansen mätte alltid FRÅN
subagentens egen väntan (subagenten själv parkerad), medan Cell 5 mäter
FRÅN orkestreraren SIDA (väcks orkestreraren när SUBAGENTEN är klar). Det är
en annan länk i samma kedja och kan mycket väl ge ett annat svar.

### Cell 6 — Subagent-completion, nyss aktiv

**Steg:** identiskt med Cell 5, `sleep 20` i subagentens promptkommando,
markörfil `TASK-148.5-cell6-active-marker.txt`. Vänta 80 sekunder.

**Förväntat utfall per hypotes:** **Utfall A förväntas**, med samma
motivering som Cell 2/4 (det verifierade exemplet i § 1 var faktiskt en
Agent-completion-notifikation i en aktiv session, och den gick igenom exakt
denna väg).

---

## § 4 — Facitmetoden i detalj

**Steg 0 — hitta rätt fil.** Sessionens egna JSONL är den senast
MODIFIERADE filen i `~/.claude/projects/<projektmapp>/` vid mättillfället:

```bash
LATEST=$(ls -t ~/.claude/projects/<projektmapp>/*.jsonl | head -1)
```

`<projektmapp>` är cwd:ns path-slugifierade namn (samma konvention som
`docs/research/s83-transkriptgranskning-2026-07-24.md` § "Källa" använder).

**Steg 1 — lista alla `queue-operation`-rader i tidsordning**, med
utläst task-id där det finns:

```bash
jq -r 'select(.type=="queue-operation") |
  [.timestamp, .operation,
   (.content // "" | capture("<task-id>(?<id>[^<]+)</task-id>").id // "NOID")]
  | @tsv' "$LATEST"
```

Kommandot är testat skarpt (§ 0) och producerar `timestamp<TAB>operation<TAB>task-id`
per rad. `dequeue`-rader visar alltid `NOID` (§ 1) — förvänta det, ignorera
det.

**Steg 2 — hitta cellens `enqueue`-rad.** Filtrera Steg 1:s utdata på
tidsfönstret [`T_complete`, `T_complete` + 5 min] (Bash/Agent: matcha även
`<tool-use-id>` mot den ursprungliga verktygsanropets `id`, hämtat ur samma
JSONL:s `assistant`-rad som innehöll `tool_use`-blocket för spawn-anropet;
`Monitor`: matcha i stället `<summary>`/`<event>`-text mot den `description`
som gavs vid Monitor-anropet, eftersom `Monitor`-notifikationer saknar
`<tool-use-id>`, § 1).

```bash
jq -r --arg tid "T_COMPLETE_HÄR" \
  'select(.type=="queue-operation" and .operation=="enqueue" and .timestamp >= $tid) |
   [.timestamp, .content] | @tsv' "$LATEST" | head -5
```

Ingen träff inom fönstret ⇒ gå direkt till **Utfall B**, men verifiera
FÖRST att ingen senare `enqueue`-rad med matchande task-id finns som
sammanfaller med nästa mänskliga inmatning (loggboken) — det skiljer "aldrig
levererad" från "levererad, men bara vid extern trigger" (båda är B, men
värda att bokföra separat i facit-rapporten som B1 respektive B2).

**Steg 3 — hitta den syntetiska `user`-vändningen** med samma task-id:

```bash
jq -c --arg id "TASK_ID_HÄR" \
  'select(.type=="user" and (.message.content|type)=="string"
    and (.message.content | contains($id))) | {timestamp}' "$LATEST"
```

Ingen träff ⇒ **Utfall B** (notifikationen köades men materialiserades
aldrig i konversationen — bokför separat som en tredje underklass, B3,
eftersom det skiljer sig från "aldrig ens `enqueue`ad").

**Steg 4 — hitta nästa `assistant`-rad efter Steg 3:s tidsstämpel:**

```bash
jq -c --arg ts "STEG3_TIMESTAMP_HÄR" \
  'select(.type=="assistant" and .timestamp > $ts) | {timestamp}' "$LATEST" | head -1
```

**Steg 5 — korsläs mot loggboken.** Jämför Steg 4:s tidsstämpel (om någon)
mot operatörens egen logg: skedde en MÄNSKLIG handling mellan Steg 3:s och
Steg 4:s tidsstämpel? Om ja ⇒ **Utfall C** (den `assistant`-raden är ett svar
på operatörens handling, inte ett spontant resume — kedjan bröts vid
agent-resume). Om nej och Steg 4 hittar en träff inom rimlig tid efter
`T_complete` ⇒ **Utfall A**. Om Steg 4 inte hittar NÅGON träff förrän en
mänsklig handling (enligt loggboken) senare i sessionen ⇒ **Utfall C.**

**Bonus-avstämning för Cell 5–6 (subagent):** läs `<usage><duration_ms>`
och `<worktree>` i notifikationens `content` (Steg 2:s träff) och jämför
`T_spawn + duration_ms` mot markörfilens `T_complete` — en oberoende
sanity-check på att subagenten verkligen körde det instruerade
`sleep`-kommandot och inte avvek.

---

## § 5 — Genomförandeordning + HITL-loggbok

1. **Kräver HITL** (per `TASK-148.5`s klassning) eftersom "operatören gör
   absolut inget" måste garanteras av en människa — en agent kan inte
   verifiera sin egen frånvaro av handling.
2. Kör cellerna i par (idle-varianten FÖRE aktiv-varianten inom varje
   händelsetyp, så en lyckad idle-mätning inte riskerar att kontamineras av
   en efterföljande akut aktiv-cells snabba turer): 1 → 2 → 3 → 4 → 5 → 6.
   Total protokolltid: 3×(1200+80) sekunder ≈ 64 minuter ren väntetid,
   exklusive setup.
3. Operatörens loggbok är EN löpande textfil, en rad per handling,
   UTC-tidsstämplad, förd VID SIDAN OM sessionen (inte i den) — annars är
   loggboken själv en mänsklig inmatning som kontaminerar cellen den ska
   döma.
4. Efter alla sex celler: kör facitmetoden (§ 4) för var och en, sammanställ
   en tabell (cell → Utfall A/B/B1/B2/B3/C → tidsdifferenser) som blir
   underlaget för T112-uppdateringen — den uppdateringen sker i
   `TASK-148.5`, inte här.
5. Städa markörfilerna och stoppa eventuella kvarvarande `Monitor`/
   bakgrundsjobb (`TaskStop`) innan sessionen avslutas.

---

## § 6 — Gränser: vad protokollet INTE avgör

- **Ett negativt resultat inom 20 minuter är inte "kedjan bryts aldrig
  senare".** T112:s faktiska incident varade en hel natt. Protokollet mäter
  ett bundet fönster (20 minuter för idle-celler) av praktiska HITL-skäl —
  ett Utfall A inom fönstret utesluter inte att kedjan ändå skulle brutits
  efter timmar. Detta ska stå explicit i facit-rapporten, inte tystas ned.
- **`dequeue` kontra `remove`s exakta semantik är oklarlagd** (§ 1, "Vad som
  INTE verifierades"). Facitmetoden kringgår frågan genom att inte förlita
  sig på någon av de två — men en mätsession som vill förstå HELA
  kö-livscykeln, inte bara leverans-kedjan, behöver en egen kodläsning av
  harness-binären (samma metod som
  `docs/research/obevakade-tillstand-vaktens-form-2026-07-30.md` § Delfråga 4
  redan visat fungerar).
- **Sex celler är sex datapunkter, inte en statistisk serie.** Ett enda
  Utfall B i Cell 1 bevisar inte att bakgrunds-Bash ALLTID bryter kedjan för
  idle sessioner — det är en observation, inte en rat. Upprepning (flera
  körningar per cell) är utanför detta protokolls omfång men en naturlig
  utökning om `TASK-148.5`s första körning ger tvetydiga resultat.
- **Protokollet mäter ORKESTRERARENS EGEN väckning**, inte en subagents
  interna väckning av sig själv. `L340` (given i uppdraget) täcker redan
  det senare för `Monitor` i subagent-kontext. Cell 5–6 är en annan länk i
  kedjan (väcks FÖRÄLDERN när BARNET är klart) och ska inte förväxlas med
  `L340`s fynd.
- **Detta dokument uppdaterar INTE T112.** Tråden förblir `paused` med
  Åtgärdsriktning (iv) markerad "protokoll klart, mätning ej körd" tills
  `TASK-148.5` levererar facit.

---

## Källförteckning

- `backlog/tasks/task-148.4` — kortet detta dokument levererar mot
- `backlog/tasks/task-148` — PRD, § Implementationsbeslut (mätningens form)
- [`tasks/threads/T112-vackningskedjan-over-turgransen.md`](../../tasks/threads/T112-vackningskedjan-over-turgransen.md) — § Mätt, § Åtgärdsriktningar (iv), § Ny instans 2026-08-02
- [`docs/research/obevakade-tillstand-vaktens-form-2026-07-30.md`](obevakade-tillstand-vaktens-form-2026-07-30.md) — metodförebild (sex lokala harness-mätningar mot faktisk binär)
- [`docs/research/subagent-parkering-handoff-kontrakt-2026-08-05.md`](subagent-parkering-handoff-kontrakt-2026-08-05.md) § 1.1 — harness-fakta om notifikationsvägar, `Monitor`-luckan
- `tasks/sessions/2026-08-07-session-99.md` § Del 2 — grillad samsyn, mätningens form
- [`docs/research/s83-transkriptgranskning-2026-07-24.md`](s83-transkriptgranskning-2026-07-24.md) — sessions-JSONL-sökvägskonvention
- [`docs/research/harness-namnrymd-agenter-2026-07-30.md`](harness-namnrymd-agenter-2026-07-30.md) — scratchpad-namngivningsrisken protokollets markörfil-namn undviker
- `docs/decisions/ADR-086-uppdragets-premisser-provas-av-mottagaren.md` — premiss-passets mandat
- **Egen mätning (denna session, 2026-08-07):** JSONL-schema verifierat mot en faktisk lokal sessions-transcript (`type: "queue-operation"`, `enqueue`/`dequeue`/`remove`, den syntetiska `user`-vändningen, `<usage><duration_ms>`), `Monitor`-verktygets schema (ToolSearch), `date`/`jq`/`python3`-portabilitet kontrollerad skarpt på exekverande maskin.
