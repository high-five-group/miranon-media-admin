---
owner: marcus803
updated: 2026-07-30
review_by: 2027-01-30
status: stable
---

# Obevakade tillstånd: vilka tillstånd antar en aktör att någon berättar om? (Code, 2026-07-30)

> **Proveniens:** avgränsat research- och designpass på tråd `T108`, flaggad
> MÅSTE LÖSAS av Marcus 2026-07-29. Uppdraget var att hitta branschens form, pröva
> level/edge-ramen mot trådens fyra former och rekommendera EN — med kravet att en
> rekommendation utan mekanism är förkastad på förhand.
>
> **Vad passet gjorde:** fyra parallella sökaxlar mot primärkällor (Kubernetes,
> CI/CD-leverantörer, agent-ramverk, lokal mekanik) samt **sex egna mätningar mot
> Claude Code v2.1.220** — den version vi faktiskt kör. Mätningarna avgjorde
> frågan; de stängde bland annat den enda punkt en av sökaxlarna uttryckligen
> lämnade obelagd.
>
> **Vad passet INTE gjorde:** ingen hook installerad, ingen ADR skriven, ingen
> regel ändrad, ingen fil utanför denna rörd. Rekommendationen är märkt som
> rekommendation.
>
> **Metod-kaveat:** web-verktygens veckokvot tog slut mitt i passet. Citat hämtade
> via `WebFetch` renderas av en sammanfattande modell och är **starkt belagda, inte
> verbatim-garanterade** — utom de som lästes ur råfil (`raw.githubusercontent.com`)
> och de sex lokala mätningarna, vilka är exakta.

---

## Kort svar

**Tråden är rätt ställd men underspecificerad, och dess egen favoritform är den
svagaste. Domen: klassen är inte "missade notifieringar" utan att en aktör
avslutar sin tur med ett påstående om framtiden som ingen mekanism bär.**

Fyra domar, i fallande ordning efter hur säkert de är belagda:

1. **Level-triggered kontra edge-triggered är rätt ram — men vårt fel är inte en
   missad flank.** Kubernetes formulering är exakt den tråden söker: *"Edge-triggered
   behavior must be just an optimization."* Hos oss finns dock ingen notifierare
   alls som kunde missas. Aktören **hallucinerar en signalkälla**. Det är en
   skarpare felklass än den k8s beskriver, och den har en följd: bättre
   händelsehantering löser den inte.
2. **Mekanismen finns redan i verktyget vi kör, och jag har mätt den skarpt.** En
   `Stop`-hook kan **vägra låta en tur avslutas** i Claude Code v2.1.220. Jag mätte
   det live: en agent som beordrats svara `KLAR` tvingades i stället svara `ANANAS`.
   `SubagentStop` har samma förmåga och **fyrar för både synkrona och
   bakgrundsspawnade subagenter** — alltså täcks **båda aktörsklasserna** av samma
   mekanism.
3. **Trådens form (b), periodisk avstämning, kan inte lösa klassen.** En
   avstämningsloop som bor i den aktör som slutade arbeta dör med den. Den är rätt
   mönster på fel plats — och det är just skillnaden mellan Kubernetes controller
   (en **separat** process som stämmer av någon annans tillstånd) och vår situation.
4. **Vakten kan ljuga grönt, och det är belagt fem gånger i vårt eget repo.**
   Branschen har redan svarat: pytest, Jest och Playwright behandlar **tom mängd som
   RÖTT** by default. Vår egen `scripts/ci-wait.sh` gör redan rätt. Grinden
   `check-backlog-closure.sh` gjorde det inte, och upptäcktes.

**Rekommenderad form:** trådens **(d) omvänd default — mekaniserad som en
`Stop`/`SubagentStop`-hook som stämmer av aktörens avslutspåstående mot observerat
tillstånd och vägrar avslutet när påståendet inte bärs.** Det är den enda av de
prövade formerna som har en tvingande verkställighetspunkt, och den enda som täcker
båda aktörsklasserna. Vad den kostar står i § Rekommendation.

---

## Delfråga 1 — Hur löser branschen det?

### Kubernetes: den mognaste precedenten, och den håller

Kubernetes design-principer säger saken rakare än någon annan källa jag hittade:

> "Functionality must be *level-based*, meaning the system must operate correctly
> given the desired state and the current/observed state, regardless of how many
> intermediate state updates may have been missed. **Edge-triggered behavior must be
> just an optimization.**"

Samma dokument bär en sällan citerad CAP-analogi för precis vårt val:

> "There should be a CAP-like theorem regarding the tradeoffs between driving control
> loops via polling or events about simultaneously achieving high performance,
> reliability, and simplicity -- pick any 2."

Tim Hockins skrivguide för controllers säger det ännu kortare — *"Watches, etc, are
all merely optimizations of this logic."* — och namnger exakt vår felklass:

> "If an API object appears with a marker value of `true`, you can't count on having
> seen it turn from `false` to `true`, only that you now observe it being `true`.
> **Even an API watch suffers from this problem.**"

Mekaniken bakom att en händelse kan förloras för alltid är läsbar i `client-go`:
vid **HTTP 410 Gone** är eventhistoriken borta permanent, och reflectorn svarar med
en omlistning mot auktoritativt tillstånd för att *"ensure the reflector makes
forward progress."* `shared_informer.go` formaliserar kontraktet som en **delsekvens**
— *"some states might never appear in the cache"*. Informern lovar eventual
consistency mot sanningen, aldrig händelse-fullständighet.

**Viktig nyans jag tar med i rekommendationen:** controller-runtimes egen kommentar
säger att skyddet mot *missade events* **inte** ligger i `SyncPeriod` — den synkar
inte cache mot server — utan i reflectorn och i per-objekt-requeue
(`reconcile.Result{RequeueAfter: t}`). Resync-talen blandas ofta ihop:

|Lager|Symbol|Värde|
|---|---|---|
|kube-controller-manager|`MinResyncPeriod`|12h × (rand+1) ⇒ 12–24h per controller|
|controller-runtime|`defaultSyncPeriod`|10h + 10 % jitter|

Jittern motiveras i källan med *"this is because that multiple controllers don't get
into lock-step"*.

### Flux säger principen rakast av alla

> "Webhook receivers are used to make Flux's pull-based model as fast and responsive
> as push-based pipelines, but importantly **they do not make Flux 'push-based' as the
> event contains no instructions, and only serves as an 'early wake-up call'**."

Det är precis den hållning tråden famlar efter: händelsen är en väckarklocka,
aldrig beviset. Flux gör dessutom `.spec.interval` till ett **obligatoriskt** fält —
en avstämningstakt går inte att glömma bort.

### Plattformarna säger själva att man inte får lita på deras notiser

GitHub, ordagrant: **"GitHub does not automatically redeliver failed deliveries."**
Rekommendationen därefter är i praktiken en level-triggered loop — *"Your script
should run on a schedule and do the following:"* (hämta leveransdata, hitta status
≠ OK, leverera om). Stripe har samma doktrin: **"Stripe doesn't guarantee the
delivery of events in the order that they're generated"** … **"You can also use the
API to retrieve any missing objects."**

**Ett fynd som nyanserar trådens premiss:** kanalen finns faktiskt. `pull_request`
har `closed` (med `merged: true`), `enqueued`, `dequeued`, `auto_merge_enabled`, och
`merge_group` har `checks_requested`/`destroyed`. Tråden säger *"en mergad PR gör det
inte"* — korrekt om **vår** uppsättning, men det är för att vi inte konsumerar
kanalen, inte för att den saknas. Väg det mot att kanalen ändå är edge-triggered.

### Agent-ramverken: mönstret är entydigt

**Temporal** validerar i API:t: *"An Activity Execution must have either this timeout
(Start-To-Close) or the Schedule-To-Close Timeout set."* Tvånget ligger i att beslutet
är **explicit**, inte i att det är ändligt — default för Schedule-To-Close är ∞. Och
fällan är vår: sätter du `heartbeatTimeout` utan att faktiskt heartbeata så ignoreras
timeouten. **En deklarerad bevakning som ingen matar är ingen bevakning.**

**AWS Step Functions** beskriver vårt fel ordagrant: *"A task that is waiting for a
task token will wait until the execution reaches the one year service quota."* AWS
term för tillståndet är **"stuck executions"**.

**LangGraph** löser det genom att inte ha någon väntande process alls: `interrupt()`
persisterar tillståndet och lägger ned grafen.

**Mönstret över samtliga: den som väntar äger aldrig sin egen väckning.** Antingen
dör väntaren och tillståndet persisteras, eller så bevakas väntan utifrån av en timer
som ramverket äger. Vår agent gör tvärtom — håller sin process levande och gör sig
beroende av en signal den inte kontrollerar.

### Precedent-rymden: TÄT, inte tunn

Fyra oberoende domäner (container-orkestrering, GitOps, betalnings-/webhook-plattformar,
durable execution) konvergerar på samma princip. Räkningen behöver inte tänjas. Det jag
**inte** hittade precedent för står i § Vad jag inte kunde belägga.

---

## Delfråga 2 — Level kontra edge, prövat mot vårt faktiska fel

Ramen håller, men den behöver skärpas för att beskriva oss rätt.

|Felläge|Vad som gick fel|Finns i k8s-litteraturen?|
|---|---|---|
|Missad flank|Notifieraren sköt, mottagaren missade|Ja — kärnan i level-argumentet|
|**Ingen flank alls**|**Ingen notifierare existerade; väntaren uppfann en**|**Nej — vår klass är skarpare**|
|Falsk nivå|Avstämningen mätte fel mängd och läste tomhet som klar|Delvis (admission-webhookens hål)|

Rad 2 är T108. `L328`-empirin, `TASK-77`/`78`/`82`, `#439`/`#440`/`#442` och
`TASK-89`:s bygg-agent har alla samma form: aktören formulerade en väntan mot en
kanal som aldrig varit ansluten. Concurrency-litteraturens *lost wakeup* förutsätter
en notifierare som sköt för tidigt — vi har ingen notifierare. **Fixen från
litteraturen är ändå identisk och 30+ år gammal:** vänta aldrig naket; loopa på ett
predikat du själv kan omvärdera, med timeout.

Rad 3 är det andra felläget tråden måste bära — lärdomen
[`en-vakt-vars-villkor-matchar-noll-objekt-ar-fail-open`](../../tasks/lessons.md)
(konsoliderad som `L415`).
Det är inte en variant av rad 2 utan dess spegel: rad 2 ger tystnad, rad 3 ger ett
falskt grönt besked. **Tystnad väcker till slut misstanke; ett grönt besked gör det
aldrig.** En form som bara adresserar rad 2 löser halva tråden.

**Branschen har redan svarat på rad 3, och svaret är enhälligt:**

|Verktyg|Beteende på tom mängd|Ordagrant|
|---|---|---|
|pytest|exit 5|"Exit code 5: No tests were collected"|
|Jest|faller default|`--passWithNoTests`: "Allows the test suite to pass when no files are found."|
|Playwright|faller default|`--pass-with-no-tests`: "Makes test run succeed even if no tests were found."|

Läs de två sista baklänges: Jest och Playwright kräver att man **aktivt slår på**
grönt-på-tomt. Vårt fail-open-fel är alltså inte en subtil upptäckt utan en
avvikelse från etablerad default.

**Vi har fem egna instanser av rad 3, alla i repot:** det påhittade SHA:t (S91),
`TASK-72` (vakten kunde följa fel workflow och rapportera grönt), `--commit` med
förkortat SHA (tom lista, exit 0, ingen varning), `check-backlog-closure.sh`
0-AC-fallet (mätt vid `b8ca291`: 46 öppna kort, 30 utan egna AC, **16 faktiskt
prövade** — utskriften "0 inkonsistenta" lästes som full täckning), samt L322:s
skippbara required check.

---

## Delfråga 3 — Trådens fyra former, vägda

### (a) Parkoppling armering ↔ vakt

**Håller delvis. Rätt instinkt, för smal räckvidd.** Formen kan mekaniseras — och
har redan precedent i detta repo: `.claude/settings.json` bär en `PreToolUse`-hook
som **nekar** `gh run watch` i förgrunden och hänvisar till bakgrundsformen. Samma
form skulle kunna neka `gh pr merge --auto` utan efterföljande vakt.

**Varför den inte räcker:** den binder en vakt till *en känd armeringspunkt*. Tråden
säger själv att klassen är bredare — kö-läge, CI-utfall, externa system, en annan
sessions landningar. Varje ny väntetyp kräver en ny parkoppling, och den som glöms
bort är osynlig. Den skyddar inte heller bygg-agenten i `TASK-89`, som väntade på en
**förgrundsgrind** utan någon armeringspunkt att koppla mot.

**Dom: behåll som komplement, inte som huvudform.**

### (b) Periodisk tillstånds-avstämning under aktivt arbete

**Måste delas i två. Den ena hälften är förkastad, den andra är redan byggd.**

**(b1) En `/loop` inuti den aktör som ska skyddas: förkastad.** Kubernetes controller
är en **separat process som stämmer av någon annans tillstånd**. En `/loop`-variant
bor inuti aktören. **När aktören slutar arbeta slutar loopen också** — och felet vi
vill fånga är exakt "aktören slutade". Detektorn dör i samma ögonblick den behövs.

Det argumentet är inte mitt, utan repots eget, och det är empiriskt avgjort. Så här
motiverar [`nightly-watchdog.yml`](../../.github/workflows/nightly-watchdog.yml) sin
egen existens:

> "nightly.yml:s larm-jobb bor INNE i den körning det bevakar. Det kan därför bara
> larma om körningen faktiskt äger rum."

Med bevis: körning `30038460735` (2026-07-23) hade `total_count: 0` jobb — larm-jobbet
instansierades aldrig, och *"den verkliga incidenten lämnade noll spår."*

**(b2) En avstämning som står UTANFÖR aktören: rätt, och den finns redan.**
`nightly-watchdog.yml` är precis den formen — en cron som bevakar kanalen och ligger
bredvid larmen, med uttalad Prometheus-Watchdog-förebild. Den är alltså inte ett
förslag utan en **precedent i vårt eget repo** för hur T108-klassen ska adresseras.

Den bär också sin egen begränsning öppet, och det är den ärlighet formen kräver:

> "vakten är själv en GitHub Actions-cron och ärver därmed exakt den defekt den ska
> täcka."

**Dom: (b1) förkastad. (b2) giltig men täcker inte T108** — den bevakar
nattkörningen, inte agenternas väntetillstånd. Att utvidga den är ett realistiskt
alternativ till hooken, med den fördelen att den överlever aktörens död och den
nackdelen att den upptäcker felet timmar senare i stället för i sekunden.

### (c) `check-backlog-closure.sh` i varje leverans-kadens

**Håller, men fångar fel sak — vilket tråden själv redan noterar.** Grinden prövar
kort-registrets **interna konsistens** (alla AC bockade + status ≠ Done är
inkonsistent). Det är en äkta level-triggered avstämning och den är byggd av precis
detta skäl, dokumenterat i skriptets eget huvud.

Men den fångar **utfallet** — kort som blev stående — timmar efter att orsaken
inträffade, och bara för korttypen. Den ser inte en bygg-agent som stannat mitt i ett
grind-pass, och den ser inte en väntan på ett externt system.

**Ett fynd som gör formen mer angelägen än tråden anar:** jag mätte anropsytan för
båda vakterna. **Varken `check-backlog-closure.sh` eller `ci-wait.sh` har någon
`npm run`-ingång** — noll träffar i `package.json`. Två fail-closed vakter, byggda av
goda skäl, är därmed osynliga för varje kadens som går via `npm run`. Trådens form (c)
säger "körd lokalt som del av varje leverans-kadens", och det förutsätter en ingång som
inte finns.

Det är samma felklass en nivå upp, och den är bekräftad på annat håll samma dygn:
`TASK-98` bokför att `check-permissions-claims.sh` körs **0 gånger** i `ci.yml` medan
`check-docs.sh` påstår att alla tio syskongrindarna körs. **En grind som ingen kör är
inte en grind** — och en grind som *påstås* köras är `ADR-083`:s felklass.

**Dom: behåll grinden, men formen är inte levererad förrän den har en ingång.** Att ge
båda vakterna varsin `npm run`-ingång är den billigaste åtgärden i hela detta pass och
kan göras oberoende av allt annat här.

### (d) Omvänd default — anta aldrig att en väntan är bevakad

**Rätt princip. Som nedskriven är den exakt den form huset förkastar på förhand** —
den säger "kom ihåg", vilket är `L328`-klassen. Tråden erkänner det själv.

**Men den har en mekanism, och den finns redan i verktyget.** Se § Rekommendation.

### (e) Femte formen jag hittade — väntaren äger aldrig sin egen väckning

Ur Temporal/Step Functions/LangGraph-mönstret: **uttryck varje väntan som ett
harness-spårat objekt vars *avslut* producerar notifieringen**, aldrig som prosa i en
tur. Vårt repo har redan halva den formen mekaniserad (`PreToolUse` nekar
förgrunds-`gh run watch`) och hela den nedskriven i
[`bakgrundsprocess-utan-harness-sparning-notifierar-aldrig`](../../tasks/lessons.md)
(konsoliderad som `L397`).

Den lärdomen bär passets skarpaste mening om varför fel aktör är detektor:

> "Felet har ingen intern signal — det syns bara utifrån, som tystnad. Det är därför
> människan blir detektorn, vilket är precis fel aktör för uppgiften."

**Dom: rätt och redan delvis byggd. Den täcker "hur man väntar" men inte "att man
råkade inte vänta alls" — vilket är T108:s kärna.**

---

## Delfråga 4 — Mätningarna mot Claude Code v2.1.220

Sex mätningar, alla lokala, alla mot den version vi kör (`claude --version` →
`2.1.220`). Den tredje sökaxeln lämnade uttryckligen `stop_hook_active` som
**OBELAGT** och flaggade att skillnaden mellan en grind och en oändlig loop hänger på
det. Mätning 2 och 3 stänger den punkten.

### Mätning 1 — en `Stop`-hook kan vägra låta turen avslutas

En hook som returnerar `{"decision":"block","reason":"…Skriv exakt ordet ANANAS…"}`
mot prompten *"Svara med exakt ordet KLAR och ingenting mer."*:

```text
utfall: ANANAS
```

Agenten avslutade sin tur, hooken vägrade, agenten fortsatte. **Verkställigheten är
reell, inte rådgivande.**

### Mätning 2 — `stop_hook_active` finns och vänder

Hookens indata, ordagrant ur loggen, första och andra anropet:

```json
{"hook_event_name":"Stop","stop_hook_active":false,"last_assistant_message":"KLAR", …}
{"hook_event_name":"Stop","stop_hook_active":true,"last_assistant_message":"ANANAS", …}
```

Fältet existerar, är `false` vid första avslutsförsöket och `true` efter en blockering.
Det är den dokumenterade escape-hatchen mot oändlig stopp-loop — **nu belagd genom
mätning i stället för genom tredjepartskällor.**

### Mätning 3 — harnesset bär själv ett tak, oberoende av hookens disciplin

Ur den körda binären (`claude-code-darwin-x64`, v2.1.220):

```js
let Kt = Cue(process.env.CLAUDE_CODE_STOP_HOOK_BLOCK_CAP, 8);
if (Kt > 0 && yo > Kt) return O("tengu_stop_hook_block_count",
  {count: yo, is_subagent: Boolean(V.agentId), hit_max_turns:!1, hit_cap:!0}),
  yield ml(`A hook blocked the turn from ending ${yo} consecutive times — overriding and ending turn. `
  + "For Stop/SubagentStop hooks, check stop_hook_active in the input and return success while it's true. "
  + "Set CLAUDE_CODE_STOP_HOOK_BLOCK_CAP to raise this limit.", "warning"), {reason:"completed"};
```

**Default-taket är 8 sammanhängande blockeringar**, därefter överstyr harnesset och
avslutar turen med en varning. En buggig hook kan alltså inte låsa systemet — taket
ligger i verktyget, inte i vår disciplin. `is_subagent`-flaggan i samma kodväg visar
att subagenter går genom samma loop.

### Mätning 4 — hookens indata bär både påståendet och verkligheten

```json
"last_assistant_message":"KLAR"
"background_tasks":[{"id":"bj9bkiu6o","type":"shell","status":"running",
  "description":"Start a 90-second background job","command":"sleep 90"}]
```

Detta är fyndet som gör formen möjlig. Hooken får **vad aktören just påstod** och
**vad som faktiskt kör**, i samma anrop, i det ögonblick avslutet försöks. Den kan
alltså mekaniskt pröva: *aktören säger sig vänta — finns det något som någonsin
skulle väcka den?*

Verifierat att fältet faktiskt populeras: tomt (`[]`) utan bakgrundsjobb, ifyllt med
`status` när ett kör.

### Mätning 5 och 6 — `SubagentStop` täcker bygg-agent-klassen, även i bakgrunden

`SubagentStop` fyrade och blockerade för en **synkron** subagent, och därefter för en
**bakgrundsspawnad** subagent — det senare är exakt `TASK-89`:s felläge:

```json
{"hook_event_name":"SubagentStop","agent_type":"general-purpose",
 "stop_hook_active":false,"last_assistant_message":"HEJ", …}
{"hook_event_name":"SubagentStop","agent_type":"general-purpose","stop_hook_active":true,
 "last_assistant_message":"Förstått. Jag avsluter inte än, utan lägger till ordet MANGO sist i mitt svar.\n\nMANGO"}
```

Indatan bär `agent_id`, `agent_type` och en separat `agent_transcript_path`.

**Detta avgör kravet att formen ska gälla båda aktörsklasserna: den gör det, med
samma mekanism och samma konfiguration.**

### Mätning 5b — en viktig begränsning, funnen i samma körning

I den synkrona subagent-körningen **blockerades turen korrekt men subagenten
efterlevde inte instruktionen** — `last_assistant_message` var oförändrat `"HEJ"` vid
andra anropet. I bakgrundskörningen efterlevde den (`MANGO`).

**Slutsatsen är viktig och begränsande: mekanismen garanterar att turen inte tar slut
— inte att aktören gör rätt sak.** `reason`-fältet är prosa till modellen och lyder
under samma svaghet som all prosa-styrning. Designföljd: hooken ska leverera
**tillstånd**, inte en tillsägelse.

### Sidofynd — leverantören använder själv prosa-klassning för detta

Binären innehåller en klassificerare som märker turavslutande prosa med
`branch:"awaiting-user"`, `state:"blocked"`, `tempo:"blocked"`, och en regex som
matchar bl.a. `please (?:run|provide|confirm|clarify|choose|let me know)` och
`should I (?:proceed|continue|use)`. Den innehåller också en no-progress-watchdog som
avbryter med `stalled — no progress for ${Te}ms`.

**Jag kunde inte avgöra vilket delsystem som konsumerar dem** — se § Vad jag inte
kunde belägga. Men existensen visar att förstaparten angriper samma problem med samma
grundform: heuristisk prosa-klassning ovanpå en mekanisk avbrottspunkt.

---

## Dom

**T108:s form är (d), och (d) har en mekanism.** Den heter
`Stop`/`SubagentStop`-hook, den finns i den version vi kör, den är mätt skarp sex
gånger, och den täcker båda aktörsklasserna inklusive bakgrundsspawnade bygg-agenter.

Tre saker faller ut som bör rättas i tråden:

1. **Tråden är underspecificerad.** Den bokför felet som orkestrerarens. `TASK-89`
   visade att det är en egenskap hos **varje aktör**, och mätning 5–6 visar att
   lösningen måste — och kan — adressera båda.
2. **Trådens form (b) bör förkastas, inte utforskas vidare.** En avstämningsloop
   inuti den aktör som ska övervakas dör med den.
3. **Trådens premiss "en mergad PR notifierar ingen" är sann om vår uppsättning,
   inte om plattformen.** `pull_request.closed` finns. Det öppnar en väg vi inte
   utvärderat.
4. **Trådens form (c) förutsätter en ingång som inte finns.** Varken
   `check-backlog-closure.sh` eller `ci-wait.sh` är anropbara via `npm run`. En grind
   som ingen kör är inte en grind — samma sak `TASK-98` mätte för
   `check-permissions-claims.sh` samma dygn.

En fjärde observation, utanför frågan men samma klass en nivå ned: **under detta
pass dog min egen tur av en API-gräns, och tre subagenters returvägar bröts med
den.** Deras rapporter nådde orkestreraren i stället. Det är samma felklass —
en väntande part antog att ett resultat skulle levereras längs en kanal som inte
överlevde. Registrerad här, inte tyst förkastad; den bör bli en egen tråd.

---

## Vad jag inte kunde belägga

- **`background_tasks` listar spawnade agenter.** Mätt: fältet bar ett `type:"shell"`-jobb.
  I båda subagent-körningarna var det `[]` — även när en bakgrundsagent kördes. **En
  detektor som bara läser `background_tasks` skulle alltså missa "väntar på en
  subagent".** Detta måste mätas före bygge; det avgör detektorns täckning.
- **Vilket delsystem som konsumerar `awaiting-user`-klassificeraren och
  `stalled`-watchdogen** i binären. Strängarna och kodformen är mätta; kopplingen till
  den vanliga turloopen är det inte. Använd dem inte som belägg för att verktyget
  redan skyddar oss.
- **Repots egen `bygg-agent`-typ under hooken.** Mätningarna kördes mot
  `general-purpose`. Att `.claude/agents/`-definierade typer beter sig likadant är
  sannolikt men **inte mätt**.
- **Modellberoendet i efterlevnaden.** Mätningarna kördes på `haiku`. Blockeringen är
  harness-nivå och modelloberoende; **efterlevnaden av `reason` är det inte**, och
  föll i ett av tre fall.
- **Google SRE-boken som källa för level/edge-principen.** Sökt, ingen källa hittad.
  Meta-monitoring-citatet *"How do you know if the reason you haven't been alerted
  today is because everything is fine or because the monitoring system has failed?"*
  pekar mot **Limoncelli, The Practice of Cloud System Administration — inte Google
  SRE-boken.** Attribuera det inte till Google utan verifiering.
- **Argo CD:s motivering för sitt reconciliation-intervall.** Default
  `timeout.reconciliation` är 3m och webhooken beskrivs som att *"eliminate this delay
  from polling"* — men **ingen mening hittades** där Argo CD säger att intervallet är
  ett skyddsnät. Den slutsatsen vore härledd, inte citerad. Flux bär den explicit;
  använd Flux som källa.
- **En etablerad branschterm för "grön för att den mätte ingenting".** Ingen hittad —
  varken "vacuous pass" eller "empty-set green". `fail-open` är etablerat och belagt.
  Vi saknar alltså ett lånat ord och bör använda vårt eget.
- **Kubernetes admission-webhookens nollmatchnings-hål.** `failurePolicy` defaultar
  till `Fail`, men täcker bara fel **vid anrop**; en webhook vars `rules` matchar noll
  objekt anropas aldrig. **Ingen auktoritativ formulering av just det hålet hittades.**
- **`gh pr checks --watch` timeout.** Källkoden (läst ur råfil, `trunk`) visar ren
  polling via `time.Sleep(opts.Interval)`, default 10 s, exit 8 = pending. **Ingen
  `--timeout`-flagga sedd** — svagt belagt, och exakt release-version ej fastställd.
- **Ej hunnet alls:** OpenAI Agents SDK, AutoGen, CrewAI · Anthropic Engineering-bloggen
  · Shopify/Twilio/Slack · `gh run watch` · `kubectl wait`.

---

## Rekommendation

> Detta är en **rekommendation**, inte ett beslut. Formen når ADR-baren (svår att
> återställa i koherens, överraskande utan kontext, resultat av en verklig avvägning)
> och bör beslutas som ADR, inte glida in via ett kort.

**Bygg en `Stop`- och `SubagentStop`-hook i `.claude/settings.json` som stämmer av
aktörens avslutspåstående mot observerat tillstånd, och vägrar avslutet när
påståendet inte bärs.**

Rangordnat, med skäl:

1. **Hooken (form d, mekaniserad).** Enda formen med tvingande verkställighetspunkt;
   enda formen som mätt täcker båda aktörsklasserna; ligger i verktyget vi redan kör.
2. **Form (c), men först som ingång — inte som ny grind.** Ge
   `check-backlog-closure.sh` och `ci-wait.sh` varsin `npm run`-ingång. Timmar, noll
   ny mekanik, och utan den är form (c) inte levererad. **Gör detta oavsett vad som
   beslutas om hooken.**
3. **Form (e) — utvidga `PreToolUse`-nekandet** till fler väntetyper än
   `gh run watch`. Billig, precedent finns i samma fil.
4. **Form (a) — parkoppling** som `PreToolUse` på `gh pr merge --auto`. Smal men
   exakt; kompletterar hooken vid den vanligaste armeringspunkten.
5. **Form (b2) — utvidga `nightly-watchdog.yml`.** Det reella alternativet till
   hooken om den bedöms för dyr: överlever aktörens död, men upptäcker felet timmar
   senare i stället för i sekunden.
6. **Form (b1) — förkasta.** Detektorn dör med aktören den ska övervaka; repots egen
   nattvakt är byggd på just den insikten.

**Fyra egenskaper formen måste ha, var och en härledd ur ett belagt fel:**

- **Fail-closed, som `scripts/ci-wait.sh` redan är.** Kan hooken inte avgöra
  tillståndet ska den blockera eller larma, aldrig släppa igenom. `ci-wait.sh` visar
  formen: den **vägrar köra** utan workflow-namn (exit 3) och kräver full 40-teckens
  SHA — *"Ett mätinstrument som går sönder ljudlöst är värre än inget"*.
- **Leverera tillstånd, inte tillsägelse.** Mätning 5b visade att `reason` som
  instruktion kan ignoreras. Skriv in **avstämningens resultat** (vilken PR, vilket
  läge, vilket kort) så aktören har underlaget, inte en förmaning.
- **Läs `stop_hook_active` och släpp igenom när det är `true`.** Mätt i mätning 2.
  Taket på 8 finns som andra försvarslinje, men att gå i det producerar en varning och
  är ett fel, inte en design.
- **Billig i normalfallet.** Hooken kör vid *varje* turavslut för *alla* aktörer.
  Kör den dyra avstämningen endast när `last_assistant_message` matchar ett
  väntepåstående; annars exit 0 direkt.
- **Avfyrbar på beställning.** `nightly-watchdog.yml` slår redan fast beviskravet, och
  det gäller ordagrant även här: *"an untested dead man's switch is worse than none at
  all because it gives false confidence."* Hooken måste kunna provoceras fram mot ett
  känt fel — samma praxis som `nightly.yml`:s `simulate_failure` och `gate-proof.yml`.
  Utan det återskapar vi `check-backlog-closure.sh`:s 0-AC-fall.

**Vad den kostar — rakt ut:**

- **Latens på varje turavslut, för varje agent.** Med sex parallella bygg-agenter är
  det den enda löpande kostnaden, och den betalas alltid medan nyttan faller ut sällan.
- **Detektionen är heuristisk.** Verkställigheten är mekanisk och säker;
  *upptäckten* av att ett avslutspåstående är obevakat vilar på prosa-matchning och
  på `background_tasks`. Den kommer att ha falska negativ. **Detta är formens
  ärliga svaghet, och den ska stå i ADR:n — inte döljas.** Den är ändå strikt bättre
  än nuläget, där detektorn är Marcus.
- **Hemvisten är låst till repot, och det är en verklig kostnad.** Hooken fungerar
  från `settings.json` oavsett hur agenten distribuerats — mätt: den fyrade för en
  subagent utan egen hook-nyckel. Men
  [`plugin-agenter-stodjer-inte-hooks`](../../tasks/lessons.md) (konsoliderad
  som `L370`) gäller åt andra hållet: **formen kan inte distribueras hub-brett via pluginet.**
  Den måste dupliceras per repo, och driva isär över tid — precis det som
  config-driven grindvakts-praxis finns för att undvika. Precedent för att bära det
  ändå finns i samma fil (`matcher: "Agent"` → `scripts/agent-spawn-log.sh`).
- **En ny fil som kan gå sönder tyst.** Hooken blir själv ett mätinstrument. Se
  beviskravet ovan — det är inte en trevlig extra, utan villkoret för att formen
  ska räknas.
- **Ytan är oanvänd idag.** Varken `Stop` eller `SubagentStop` används i repots eller
  användarens `settings.json`. Det är den enda hook-punkt som per definition fyrar när
  en aktör är på väg att sluta — och den står tom, samtidigt som roll-disciplinens
  handover-avsnitt redan *kräver* att en aktör redovisar vad den väntar på. Ännu en
  regel utan mekanism, i exakt den yta mekanismen skulle bo.

**Det jag uttryckligen inte rekommenderar:** att skriva en lesson som säger "sätt
alltid en vakt". Den formen är redan prövad och föll — `L328` var nedskriven sedan
S81 och gicks i två gånger under en enda resume, och `registret-mot-disk-ar-den-obevakade-axeln`
skrevs fyra timmar innan samma aktör gick i samma fälla tre gånger.

---

## Källförteckning

**Primärkällor, web:**

- Kubernetes design-principer (level/edge, CAP-analogin) — <https://github.com/kubernetes/design-proposals-archive/blob/main/architecture/principles.md>
- Tim Hockin, controllers-skrivguide — <https://github.com/kubernetes/community/blob/master/contributors/devel/sig-api-machinery/controllers.md>
- `client-go` reflector (HTTP 410 Gone, forward progress) — <https://github.com/kubernetes/client-go/blob/master/tools/cache/reflector.go>
- `client-go` shared informer (delsekvens-kontraktet) — <https://github.com/kubernetes/client-go/blob/master/tools/cache/shared_informer.go>
- Flux E2E ("early wake-up call") — <https://fluxcd.io/flux/flux-e2e/>
- Argo CD reconciliation-inställningar — <https://argo-cd.readthedocs.io/en/stable/operator-manual/high_availability/>
- GitHub, hantering av misslyckade webhook-leveranser — <https://docs.github.com/en/webhooks/using-webhooks/handling-failed-webhook-deliveries>
- GitHub, webhook-events och payloads — <https://docs.github.com/en/webhooks/webhook-events-and-payloads>
- Stripe webhooks — <https://docs.stripe.com/webhooks>
- Temporal, detecting activity failures — <https://docs.temporal.io/encyclopedia/detecting-activity-failures>
- AWS Step Functions, wait for callback med task token — <https://docs.aws.amazon.com/step-functions/latest/dg/connect-to-resource.html>
- AWS Builders' Library, Colm MacCárthaigh, "Reliability, constant work, and a good cup of coffee" — <https://aws.amazon.com/builders-library/reliability-and-constant-work/>
- Claude Code hooks-referens — <https://code.claude.com/docs/en/hooks>
- pytest exit-koder — <https://docs.pytest.org/en/stable/reference/exit-codes.html>
- Jest CLI (`--passWithNoTests`) — <https://jestjs.io/docs/cli>
- Playwright test CLI (`--pass-with-no-tests`) — <https://playwright.dev/docs/test-cli>
- kube-prometheus Watchdog-alerten — <https://github.com/prometheus-operator/kube-prometheus>
- healthchecks.io — <https://healthchecks.io/>
- `cli/cli` checks-implementationen — <https://github.com/cli/cli/blob/trunk/pkg/cmd/pr/checks/checks.go>

**Egna mätningar (Claude Code v2.1.220, macOS, 2026-07-30):** sex mätningar av
`Stop`/`SubagentStop` — blockering, `stop_hook_active`, blockeringstaket i binären,
`last_assistant_message` + `background_tasks`, samt subagent-täckning synkront och i
bakgrunden. Utförda i scratchpad, inga repo-filer rörda.

**Lokala källor:**

- [`tasks/threads/README.md`](../../tasks/threads/README.md) — tråd `T108` (och `T109`)
- `tasks/lessons.d/en-vakt-vars-villkor-matchar-noll-objekt-ar-fail-open.md` —
  konsoliderad som [`L415`](../../tasks/lessons.md)
- `tasks/lessons.d/bakgrundsprocess-utan-harness-sparning-notifierar-aldrig.md` —
  konsoliderad som [`L397`](../../tasks/lessons.md)
- `tasks/lessons.d/plugin-agenter-stodjer-inte-hooks.md` — konsoliderad som
  [`L370`](../../tasks/lessons.md)
- `tasks/lessons.d/lardom-utan-grind-tillampas-inkonsekvent.md` — konsoliderad
  som [`L382`](../../tasks/lessons.md)
- [`scripts/ci-wait.sh`](../../scripts/ci-wait.sh) — fail-closed vaktkontrakt, exit 0/1/2/3/4
- [`scripts/check-backlog-closure.sh`](../../scripts/check-backlog-closure.sh) — form (c), inkl. 0-AC-fallet
- [`.ci-wait-policy.conf`](../../.ci-wait-policy.conf) — `CI_WAIT_WORKFLOW`, TASK-72-motiveringen
- [`.claude/settings.json`](../../.claude/settings.json) — befintlig `PreToolUse`-precedent
- [`.github/workflows/nightly-watchdog.yml`](../../.github/workflows/nightly-watchdog.yml) — form (b2), beviskravet, öppet bokförd rekursion
- [`CONTRIBUTING.md`](../../CONTRIBUTING.md) § Landnings-ordningen
