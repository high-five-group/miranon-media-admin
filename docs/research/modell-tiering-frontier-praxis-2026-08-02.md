---
owner: marcus803
updated: 2026-08-02
review_by: 2027-02-02
status: draft
---

# Modell-tiering per processteg — branschpraxis utanför Anthropic (2026-08-02)

> **Proveniens:** avgränsat research-pass. Frågan: mappar seniora/frontier-team
> modellstyrka mot processteg i agent-baserade kodarbetsflöden, och vilka
> eskalationsstegar/kvot-fallbacks är etablerade mönster? Passet är medvetet
> avgränsat till källor UTANFÖR Anthropics egna kanaler — en systerkörning
> researchar Anthropics förstapartslinje separat. Anthropic-källor som dyker
> upp i sökträffar (t.ex. Claude Code sub-agents) nämns här bara som jämförelse
> och räknas inte in i precedent-räkningen. Ingen kod rörd, inga git-operationer
> mot huvudträdet.

## Kort svar

**Ja — modellstyrka mappad mot processteg är etablerad praxis**, belagd hos
minst sex namngivna produkter (Cognition/Devin Fusion, Sourcegraph Amp,
Factory.ai/Droid, Aider, Cursor, GitHub Copilot) plus två seriösa
agent-ramverk (OpenAI Agents SDK, CrewAI) och en egen akademisk
forskningslinje ("LLM cascades"). **Eskalationsstegar** ("billigare modell
först, eskalera vid fällning") är ett namngivet, etablerat mönster — men den
exakta triggern ("N fällningar → eskalera") är sparsamt dokumenterad hos de
stora leverantörerna själva (de beskriver mekanismen kvalitativt utan att
avslöja tröskelvärden) och bäst konkretiserad hos en mindre tredjepartskälla
plus en akademisk artikel som visar att naiv "alltid eskalera" är en sämre
policy än en budget-kalibrerad router. **Kvot-/fallback-kedjor** är
väletablerad LLM-infrastrukturpraxis (OpenRouter, LiteLLM) men beskrivs
generiskt, inte specifikt för kodningsagenter. **Statisk per-roll-mappning**
— exakt det mönster detta repo redan kör (frontier-orkestrerare, `model:
sonnet` per subagent-frontmatter) — är enligt en tredjepartskälla den
dokumenterat DOMINERANDE formen i produktion i dag; automatisk
klassificerar-routing är etablerad men framväxande och syns tydligast hos
leverantörer som optimerar kostnad i stor skala.

Precedent-rymden är **inte tunn** för sub-fråga 1 och 4 (flera oberoende
namngivna aktörer, delvis triangulerade genom direkt hämtning av
förstapartssidor). Den är **tunnare** för sub-fråga 2:s exakta numeriska
trigger och för rangordningen "statisk slår dynamisk i förekomst" — båda
vilar i hög grad på en enda tredjepartskälla vardera. Det deklareras öppet
nedan i stället för att jämnas ut.

## Delfråga 1 — Hur mappar namngivna precedent modellstyrka mot processteg?

### Cognition — Devin Fusion

"Sidekick"-arkitektur: en frontier-agent och en billigare "sidekick"-agent
kör parallellt med varsin cachead kontext. Frontier-agenten delegerar,
övervakar och behåller ägarskap över planering, tvetydighet och
slutgranskning. Lättviktsklassificerare som körs under uppgiften signalerar
när sidekicken "is proving too challenging" och uppgiften ska tillbaka till
huvudagenten eller bytas till en annan modell. Modellbyten sker medvetet vid
kontext-kompaktering — en punkt som ändå ger en cache-miss, så bytet kostar
inget extra. Resultat: 35 % kostnadsreduktion mot ren frontier-körning på
"FrontierCode"-benchmarken, och 88 % av internt mergade pull requests drevs
helt av den automatiska routern. Cognition har dessutom en egen namngiven
snabb/billig modell-tier ("SWE-1.5 — Our Fast Agent Model"), vilket
ytterligare stödjer att tiering är en medveten produktstrategi, inte en
tillfällighet.
Källor: [cognition.com/blog/devin-fusion](https://cognition.com/blog/devin-fusion),
[cognition.ai/blog/swe-1-5](https://cognition.ai/blog/swe-1-5).

### Sourcegraph Amp

Modell per driftläge: **Smart** (Claude Opus 4.8 — "tighter changes and
checks its own work"), **Deep** (GPT-5.5 — extended thinking/planering),
**Rush** (GPT-5.5 utan reasoning — "twice as fast … tuned for small tasks").
Namnen har sedan konsoliderats till "The Dial" (low/medium/high/ultra), och
Amp byter uttryckligen sina defaultmodeller utan att fråga användaren ("We
swapped the default model overnight. Nobody complained"). Utöver
driftläget har Amp per-subagent-modeller: **Oracle** (GPT-5.4, kodgranskning
och analys), **Librarian** (kodsökning), **Painter** (GPT Image 2,
bildgenerering), samt en sökspecialiserad subagent på Gemini 3 Flash.
Källa: [ampcode.com/news](https://ampcode.com/news) (sammanställd
nyhetslogg — se caveat i § Vad jag inte kunde belägga om att enskilda
inlägg/datum inte gick att isolera per modelltilldelning).

### Factory.ai — Droid / Factory Router

Automatiskt modellval ur "a diverse pool of frontier and efficient models" på
en kostnad/prestanda-paretofront. **Eskalation är explicit del av
designen:** "If the selected model struggles to complete the task, Factory
Router moves the session to a more capable model." Mätta resultat: 99 %
pass rate på Terminal-Bench 2 till 20 % lägre kostnad än Claude Opus 4.7, och
96 % på "Legacy-Bench" till 25 % lägre kostnad — sammantaget 20–25 % lägre
tokenspend. Reliability-lagret (99,9 %+) routar över modeller, leverantörer
OCH kapacitetskällor, inklusive dedikerad enterprise-TPM-allokering och
US-hostade open source-alternativ vid degraderade endpoints.
Källa: [factory.ai/news/factory-router](https://factory.ai/news/factory-router).

### Aider — Architect/Editor

Ett **statiskt** tvåmodells-mönster, inte en fel-driven eskalation: en
reasoning-stark modell ("Architect", t.ex. o1-preview) beskriver lösningen i
prosa; en snabbare "Editor"-modell (t.ex. Claude 3.5 Sonnet eller DeepSeek)
omvandlar beskrivningen till konkreta filredigeringar. Motiveringen i
källan: reasoning-modeller "are strong at reasoning, but often fail to
output properly formatted code editing instructions" — separationen låter
varje modell arbeta i sin styrka. Aiders benchmark: o1-preview som Architect
tillsammans med o1-mini eller DeepSeek som Editor gav 85,0 % (SOTA vid
publiceringen); o1-preview tillsammans med Claude 3.5 Sonnet gav 82,7 %.
Källa: [aider.chat/2024/09/26/architect.html](https://aider.chat/2024/09/26/architect.html).

### Cursor

Auto-läge routar automatiskt "based on capability, cost, and reliability"
för vanlig implementation, refaktorering och buggfix. Max Mode ger tillgång
till en större kontext och en "premium reasoning path" — beskrivet som
användbart när uppgiften genuint kräver en bred skiva av repot, men
"wasteful when the task needs three files and a test". Explicit
manual-eskalations-guidning: välj en starkare modell för tvetydiga
arkitekturbeslut, stora cross-file-refaktoreringar, säkerhetskänslig kod,
komplexa migrationer med många edge-cases, och granskningar "where false
confidence is expensive". **Källbindningen här är svagare** än övriga
poster: en direkt hämtning av `docs.cursor.com/chat/agent` omdirigerade till
`cursor.com/docs` utan att ge samma detaljnivå, så citaten ovan kommer från
sökmotorns syntes av sidan, inte en verifierad råtext-läsning i detta pass.
Innehållet stämmer mot flera oberoende sökträffar men bör betraktas som
näst bäst bekräftat av precedenten i denna lista.

### GitHub Copilot — Auto model selection

Ett uttalat "dual system": ett spår "tracks real-time system health and
availability", ett annat "evaluates task complexity" — tillsammans matchar de
"each task to the model that can solve it most efficiently", vilket
reserverar dyra reasoning-modeller för komplexa problem och routar
rutinarbete till snabbare/billigare modeller. Rullas ut stegvis: Pro/Pro+
2025-12-08, Business/Enterprise 2026-02-19. Auto-läget ger användaren 10 %
rabatt på modellkostnaden. Dokumentationen anger INGEN exakt
eskalationströskel eller fallback-procedur vid kvot/rate limit.
Källor: [GitHub Docs — auto model selection](https://docs.github.com/en/enterprise-cloud@latest/copilot/concepts/auto-model-selection),
[GitHub Changelog 2025-12-08](https://github.blog/changelog/2025-12-08-model-picker-for-copilot-coding-agent-for-copilot-pro-and-pro-subscribers/).

### Seriösa ramverk (inte produkter, men publicerad praxis)

**OpenAI Agents SDK:** modell sätts explicit per agent "when that specialist
consistently needs a different quality, latency, or cost profile". Det
dokumenterade triage-exemplet sätter en STARKARE modell på
orkestrerings-/handoff-agenten och lättare modeller ("gpt-5-mini",
"gpt-5-nano") på de faktiska worker-agenterna — motsatt riktning mot en
naiv intuition om att orkestrering är "billig routing", och matchar i stället
att fel i orkestreringssteget är dyrast att återhämta från.
Källa: [OpenAI Agents SDK — models](https://openai.github.io/openai-agents-python/models/).

**CrewAI:** LLM-agnostisk arkitektur där olika modeller tilldelas olika
agent-roller (t.ex. Gemini för en research-agent, GPT-4o för en
writer-agent), och en separat modell kan sättas för manager-agenten i
hierarkiska processer. Källan här är sökmotorns syntes av
`docs.crewai.com`, inte en djup direkthämtning — behandla som bekräftat
mönster men lägre detaljprecision än de direkthämtade posterna ovan.

### Akademisk grund

"LLM cascades" är ett etablerat forskningsområde som formaliserar exakt det
mönster produkterna ovan implementerar informellt: billig modell körs
först, en beslutsmodul avgör om resultatet räcker eller om frågan ska
eskaleras till en starkare modell. Se t.ex. "Is Escalation Worth It? A
Decision-Theoretic Characterization of LLM Cascades" ([arxiv
2605.06350](https://arxiv.org/pdf/2605.06350)). Mest relevant för denna
frågas domän är **CodeRescue: Budget-Calibrated Recovery Routing for Coding
Agents** ([arxiv 2607.19338](https://arxiv.org/abs/2607.19338)) — se
delfråga 2 för detaljerna, eftersom den artikeln är specifikt om
kodningsagenters post-fel-routing.

## Delfråga 2 — Eskalationsstegar: förekommer "billigare först, eskalera vid fällning"?

**Ja, mönstret förekommer** och har ett eget namn i litteraturen ("LLM
cascade" / cascading routing). Bland produkterna ovan implementerar
Cognition (sidekick → huvudagent vid "struggle") och Factory Router (byter
session vid "struggle") mönstret direkt. **Viktig distinktion:** Aiders
Architect/Editor-mönster är INTE en fel-driven eskalation — det är en fast
rollfördelning utan trigger. Blanda inte ihop "statisk tvåmodells-uppdelning
per roll" med "dynamisk eskalation vid fällning"; båda är etablerade men de
är olika mekanismer som svarar på olika frågor.

**Konkreta triggrar hittades — men bara hos en mindre tredjepartskälla, inte
hos något av de stora namnen:**

Requesty (engineering-blogg, inte en frontier-leverantör):

> "escalate on structured failure, such as invalid JSON or a schema
> violation, not on vague dissatisfaction"
>
> "never escalate on timeout alone"
>
> "two identical failures means escalate or stop rather than retry a third
> time"
>
> "escalate once, then stop, and let a human or a queue take it"
>
> "log every escalation with its trigger so you can measure whether the
> expensive model changed the outcome"

Källa: [requesty.ai/blog/how-to-cap-runaway-agent-spend-2026](https://www.requesty.ai/blog/how-to-cap-runaway-agent-spend-2026).

Den akademiska artikeln CodeRescue ger den mest rigorösa grunden specifikt
för kodningsagenter. Den routar post-fel mellan tre åtgärder: **reflect**
(fixa med exekveringsfeedback, billigt), **replan** (starta om med billig
modell) och **escalate** (använd den dyra modellen), kalibrerat med
Conformal Risk Control mot en kostnadsbudget. Mätta siffror (modellparet
GPT-5.4-nano/GPT-5.4):

|Strategi|Lösningsgrad|Kostnad|
|---|---|---|
|Alltid eskalera|68,6 %|7,22 m$/exempel|
|Budget-kalibrerad router (budget 2,56 m$)|71,7 %|2,56 m$/exempel|
|Ogravad/obegränsad router|81,7 %|5,51 m$/exempel|

Nyckelfyndet: den kalibrerade routern använder bara 35 % av kostnaden för
"alltid eskalera" men löser ÄNDÅ FLER fall (71,7 % mot 68,6 %) — "alltid
eskalera" är alltså en STRIKT sämre policy än en trigger-baserad, inte bara
en dyrare. Uppdelningen av felfallen är inte monoton: 45 % är
"escalation-only" (kräver den dyra modellen), 28 % löses bara med billig
recovery, 27 % har komplementära lösningar — svårighetsgraden avgör
fördelningen (BigCodeBench mest billig-löst, svårare TACO-problem mest
eskalations-beroende).
Källa: [arxiv.org/abs/2607.19338](https://arxiv.org/abs/2607.19338).

**Deklarerat öppet:** ingen av de tre stora namngivna produkterna (Cognition,
Factory, GitHub Copilot) publicerar sin exakta numeriska tröskel för när
eskalation triggas — de beskriver mekanismen kvalitativt ("struggle",
"moves session") och håller tröskelvärdet proprietärt. Den konkreta siffran
"två identiska fällningar" har alltså EN tredjepartskälla, förstärkt av EN
akademisk artikel som stödjer formen (budget-kalibrerad eskalation slår
naiv alltid-eskalera) utan att ge exakt samma tal. Det är en tunnare
precedent-rymd än delfråga 1 och ska inte förväxlas med bred branschkonsensus
om just talet 2.

## Delfråga 3 — Kvot-/fallback-strategier

**OpenRouter** dokumenterar två lager, tydligt åtskilda:

- **Provider-failover** (på som default): håller SAMMA modell vid liv genom
  att byta leverantör vid 5xx eller 429. En leverantör med fel senaste 30
  sekunderna nedprioriteras automatiskt.
- **Model-layer fallback** (opt-in, via en `models`-array): byter till en
  ANNAN modell när alla leverantörer för primärmodellen är uttömda.
  Kontext-längd-fel och moderationsrefuseringar hanteras BARA på detta lager
  (leverantörsbyte hjälper inte mot dem).

Produktionsmönstret som rekommenderas: ordna arrayen med den mest
pålitliga "golv-modellen" sist, t.ex.
`["anthropic/claude-sonnet-4.6", "openai/gpt-5.4-mini",
"google/gemini-3.5-flash"]` — så att den sista posten alltid är den man litar
mest på, inte den starkaste.
Källa: [openrouter.ai/blog/insights/reliability-failover](https://openrouter.ai/blog/insights/reliability-failover/).

**LiteLLM** har motsvarande men mer finkornig konfiguration: en
`fallbacks`-mappning per modell, tre separata feltyper (standard/rate-limit,
context-window, content-policy — var och en konfigureras för sig),
plus produktionsvakter: `rpm`/`tpm` satta ≤ 80 % av den faktiska
nyckelkvoten, `num_retries`, `allowed_fails`, `cooldown_time`, och en
circuit breaker (`max_failures` / `circuit_breaker_duration`). Ett
dokumenterat gap i produktion (öppen GitHub-issue): nyckel-nivå
per-modell-gränser (`model_rpm_limit`) kontrolleras i proxyns
middleware-lager INNAN routerns fallback-logik ser requesten —
den typen av gräns triggar alltså INTE fallback, bara routerns egna
modell-nivå-gränser gör det. Det är en konkret operativ fälla, inte bara
teori.
Källor: [docs.litellm.ai/docs/proxy/reliability](https://docs.litellm.ai/docs/proxy/reliability),
[GitHub — BerriAI/litellm issue #24152](https://github.com/BerriAI/litellm/issues/24152).

**Factory Router** (samma precedent som delfråga 1) lägger till en tredje
dimension utöver modell/leverantör: "capacity sources" — dedikerad
enterprise-TPM-allokering och US-hostade open source-modeller som
fallback när primära endpoints degraderar eller rate-limitar.

**Viktigt att hålla isär:** OpenRouter och LiteLLM är generisk
LLM-infrastruktur, inte kodningsagent-specifik. De är däremot de facto
standarderna som kodningsagent-verktyg bygger sitt providerlager mot — t.ex.
stödjer OpenHands "dussintals LLM-backends" via samma
konfigurationsmönster (`config.toml`, LiteLLM-kompatibla prefix som
`openai/devstral`). Ingen av de namngivna kodningsagent-produkterna
(Cognition, Factory, Amp, Cursor, Copilot) publicerar en egen, detaljerad
kvot-fallback-kedja utöver "vi har 99,9 % reliability" — mekanismen bakom
den siffran är inte offentliggjord i detalj hos någon av dem.

## Delfråga 4 — Är automatisk routing eller statisk mappning dominerande?

En tredjepartsguide (Augment Code) ger den tydligaste ställningstagandet:
**statisk per-roll-mappning är den dominerande formen i produktion i dag**
för team med "predictable workloads where task types map cleanly to agent
roles, such as a fixed Coordinator + Implementor + Reviewer pipeline." Den
bryter ner "when task complexity varies significantly within a single
role" — vilket tvingar fram antingen överdimensionering eller kvalitetstapp
på de svårare uppgifterna inom samma roll.

Namngivna exempel på statisk mappning (samma källa): **Claude Codes
sub-agents-API med fördefinierade modell-alias** (nämns här bara som
jämförelse, inte som del av precedent-räkningen — se proveniens-noten),
CrewAI (LLM-instans per Agent-objekt), OpenAI Agents SDK (modell satt
explicit per agent).

**Det här repot kör redan den dokumenterat dominerande formen:**
orkestrerare på frontier-modell + bygg-/research-subagenter med statisk
`model: sonnet` i `.claude/agents/*.md`-frontmatter är strukturellt samma
mönster som beskrivs som normen — fast en fördefinierad alias-mappning, inte
en klassificerare.

Dynamisk/klassificerar-routing är etablerad men **framväxande**, och syns
tydligast hos just de leverantörer som optimerar kostnad i stor skala:
Cognitions lättviktsklassificerare (mid-session), Factory Routers
paretofront-baserade autoval + eskalation, GitHub Copilots dubbla system
(hälsa + komplexitet). Fristående routing-infrastruktur finns också:
**RouteLLM** (akademiskt ursprung hos LMSYS/Chatbot Arena-teamet, fyra
router-implementationer — matrix factorization, BERT-klassificerare,
cosine similarity, LLM-as-judge — med publicerade förtränade vikter) och
**Martian** (kommersiell, adaptiv routing över tid).
Källor: [GitHub — Not-Diamond/awesome-ai-model-routing](https://github.com/Not-Diamond/awesome-ai-model-routing),
[augmentcode.com/guides/ai-model-routing-guide](https://www.augmentcode.com/guides/ai-model-routing-guide).

En hybridform finns också dokumenterad: en reasoning-modell som planerare
kombinerad med dynamiskt vald exekveringsmodell per steg (nämnt i
Augment Code-guidens syntes av OpenAI:s praxis).

**Bredare kontext, inte kodningsagent-specifik men relevant bakgrund:**
Databricks "State of AI Agents 2026"-rapporten (telemetri från 20 000+
organisationer, 60 %+ av Fortune 500) anger att 78 % av kunderna använder
minst två LLM-familjer, och andelen med tre eller fler familjer steg från
36 % till 59 % på tre månader. Siffran gäller GENERELL
enterprise-LLM-användning — inte specifikt tiering per processteg i
kodningsagenter — och räknas därför som kontext, inte som direkt precedent
för frågan. Den fulla PDF-rapporten gick inte att extrahera text ur i detta
pass (se § Vad jag inte kunde belägga); siffran är i stället bekräftad via
Databricks eget konto på X och tre oberoende sekundärkällor som citerar
samma rapport.
Källor: [databricks.com/sites/.../State-of-AI-Agents-2026-Final.pdf](https://www.databricks.com/sites/default/files/2026-01/State-of-AI-Agents-2026-Final.pdf),
[x.com/databricks/status/2044176992120037759](https://x.com/databricks/status/2044176992120037759).

## Dom

Modell-tiering per processteg är **väletablerad, branschbred praxis** hos
seniora/frontier-team utanför Anthropic — inte en lokal uppfinning och inte
en tunn precedent. Sex namngivna produkter plus två ramverk plus en
akademisk forskningslinje pekar samma väg: låt processstegets krav
(planering/tvetydighet vs rutinimplementation vs granskning) avgöra
modellstyrkan, med orkestrering/planering och granskning konsekvent på den
starkare sidan och rutinimplementation på den billigare.

Eskalationsstegar ("billigt först, eskalera vid fällning") är också
etablerad praxis, men konkretiseringen till ett EXAKT tal ("2 fällningar →
eskalera") är tunt belagd — en tredjepartskälla plus en akademisk artikel
som stödjer formen men inte exakt samma tal. Det ska behandlas som en
rimlig, forskningsstödd STARTPUNKT att kalibrera, inte som ett
branschstandard-tal att importera oprövat.

Kvot-/fallback-kedjor är väletablerad generisk LLM-infrastrukturpraxis
(OpenRouter, LiteLLM) som kodningsagent-verktygen sannolikt bygger på eller
mot, men ingen av de namngivna kodningsagent-produkterna själva
offentliggör sin egen kedja i detalj.

Statisk per-roll-mappning — vad detta repo redan gör — är den dokumenterat
dominerande formen. Automatisk klassificerar-routing är ett verkligt,
växande mönster men kräver egen infrastruktur och är etablerad främst hos
aktörer som optimerar kostnad över mycket stor volym, inte en generell norm
för mindre team.

## Vad jag inte kunde belägga

- **Exakt numerisk eskalationströskel hos något stort namn.** Cognition,
  Factory och GitHub Copilot beskriver alla eskalations-/routingmekanismen
  kvalitativt ("struggle", "moves session", "task complexity") utan att
  publicera tröskelvärden. Det enda konkreta talet ("två identiska
  fällningar") kommer från en mindre tredjepartsblogg (Requesty), inte en
  frontier-leverantör.
- **Cursor-citatens exakthet.** Direkthämtning av `docs.cursor.com/chat/agent`
  omdirigerade till `cursor.com/docs` och gav inte samma detaljerade
  extraktion som sökmotorns syntes. Innehållet stämmer mot flera oberoende
  sökträffar men är inte verifierat mot en läst råtext i detta pass.
- **Exakt datum/inlägg bakom Amps modell-till-läge-tilldelningar.** Fetchen
  av `ampcode.com/news` gav en sammanställd logg ("Chronicle"), inte en
  enskild daterad post per fynd. Amp byter uttryckligen sina defaultmodeller
  utan föregående varning ("swapped the default model overnight"), så
  specifika modellnamn (Opus 4.8, GPT-5.5 osv.) ska läsas som en
  ögonblicksbild vid research-tillfället, inte en frusen spec.
- **Rangordningen "statisk mappning är dominerande."** Vilar på EN
  tredjepartskälla (Augment Code) — en vendor content-guide med kommersiellt
  intresse i routing-produkter. Ingen oberoende marknadsundersökning hittades
  som mäter statisk-vs-dynamisk-andelen specifikt för kodningsagenter.
  Precedent-rymden för just DEN rangordningen är tunn och ska inte
  förväxlas med den bredare, väl belagda observationen att BÅDA formerna
  existerar i produktion.
- **Databricks-rapportens fulla text.** PDF:en
  (`State-of-AI-Agents-2026-Final.pdf`) gick inte att extrahera läsbar text
  ur i detta pass (binär/komprimerad struktur). Siffrorna (78 %/59 %) är
  bekräftade via Databricks eget X-konto och tre oberoende sekundärkällor,
  men inte via en direktläst primärkälle-råtext.
- **Kodningsagent-specifik kvot-fallback-praxis hos de namngivna
  produkterna.** Ingen av Cognition, Factory, Amp, Cursor eller Copilot
  publicerar sin egen detaljerade kvot-/rate-limit-fallback-mekanism —
  Factory nämner "99,9 %+ reliability" i förbigående utan att specificera
  hur. Den detaljerade praxisen som GICK att belägga (OpenRouter, LiteLLM)
  är generisk LLM-infrastruktur, inte kodningsagent-specifik.
- **Ingen instrumenterad mätning kördes i detta pass.** Frågan är en
  bransch-precedent-fråga, inte ett beteende hos vårt eget system — det
  fanns inget lokalt att köra ett minimalt test mot. Den enda konkreta
  mätningen som citeras (CodeRescue-siffrorna) är tredje parts egen
  mätning, återgiven här, inte omprövad av detta pass.

## Rekommendation

**Detta är en rekommendation till uppdragsgivaren, inte ett beslut.**

1. **Häng modellval på processteget** — mönstret är brett precedenterat.
   Föreslagen mappning, grundad direkt i källorna ovan: orkestrering/
   koordinering → starkaste tillgängliga tier (matchar OpenAI Agents
   SDK:s triage-exempel och Cognitions frontier-agent-roll); planering/
   arkitektur → stark reasoning-modell (matchar Aiders Architect och
   Cursors "ambiguous architecture decisions"); implementation mot färdig
   spec → mellantier/billigare modell (matchar Aiders Editor, Amps Rush,
   Copilots "routine work"); review/svår felsökning → stark modell igen
   (matchar Cursors "reviews where false confidence is expensive" och Amps
   Oracle-subagent).
2. **Bygg en explicit, LOGGAD eskalationsstege för mellantier-steget**,
   formad efter Requesty-mönstret och CodeRescues akademiska grund:
   eskalera på strukturerat fel (t.ex. upprepat testfel av samma typ), ALDRIG
   på timeout ensam, en hård gräns (t.ex. 2 identiska fällningar → eskalera
   en gång → fäller det också: stoppa och eskalera till människa/
   STOPPA-OCH-FRÅGA). Eftersom precedensen för EXAKT talet "2" är tunn
   (en tredjepartskälla, ingen frontier-leverantör) — behandla N som en
   justerbar policy-parameter och logga varje eskalation med sin trigger,
   så N går att kalibrera mot detta repos egna felmönster i stället för att
   importeras oprövat.
3. **Håll kvot-/rate-limit-fallback SKILT från kvalitets-eskalation** — olika
   trigger (429/5xx mot innehålls-/kvalitetsfällning), olika mekanism.
   OpenRouters/LiteLLMs mönster ("ordna den mest pålitliga modellen sist i
   kedjan, inte den starkaste") är en rimlig form att låna DEN DAGEN
   orkestreringen faktiskt körs mot en hårt kvoterad leverantör — bygg den
   inte i förväg mot ett problem som inte uppstått.
4. **Bygg inte en egen klassificerare för dynamisk routing nu.** Statisk
   per-roll-mappning (vad repot redan gör) är dokumenterat den dominerande
   formen, och ingen källa jämför dynamisk routing mot statisk FÖR den
   skala detta repo arbetar på. Automatisk routing kräver egen
   infrastruktur (klassificerare, träningsdata eller en tredjeparts-router)
   — en investering utan belagd avkastning här. Matchar den dubbelriktade
   över-engineering-vakten: spekulativ komplexitet ovanför golvet skärs,
   och statisk mappning är golvet branschen redan visat räcker.

## Källförteckning

**Auktoritativa förstapartskällor (direkthämtade i detta pass):**

- [cognition.com/blog/devin-fusion](https://cognition.com/blog/devin-fusion) — Cognition, sidekick-arkitektur, kostnads-/PR-siffror
- [cognition.ai/blog/swe-1-5](https://cognition.ai/blog/swe-1-5) — Cognition, egen snabb/billig modell-tier
- [factory.ai/news/factory-router](https://factory.ai/news/factory-router) — Factory.ai, Factory Router, benchmark- och reliability-siffror
- [ampcode.com/news](https://ampcode.com/news) — Sourcegraph Amp, modell-per-läge och per-subagent (se caveat ovan)
- [aider.chat/2024/09/26/architect.html](https://aider.chat/2024/09/26/architect.html) — Aider, Architect/Editor-mönster och benchmark
- [GitHub Docs — auto model selection](https://docs.github.com/en/enterprise-cloud@latest/copilot/concepts/auto-model-selection) — GitHub Copilot, auto model selection
- [GitHub Changelog 2025-12-08](https://github.blog/changelog/2025-12-08-model-picker-for-copilot-coding-agent-for-copilot-pro-and-pro-subscribers/) — GitHub, model picker-utrullning
- [OpenAI Agents SDK — models](https://openai.github.io/openai-agents-python/models/) — OpenAI Agents SDK, modell per agent
- [openrouter.ai/blog/insights/reliability-failover](https://openrouter.ai/blog/insights/reliability-failover/) — OpenRouter, provider- vs modell-lager-fallback
- [docs.litellm.ai/docs/proxy/reliability](https://docs.litellm.ai/docs/proxy/reliability) — LiteLLM, fallback-konfiguration
- [databricks.com/sites/.../State-of-AI-Agents-2026-Final.pdf](https://www.databricks.com/sites/default/files/2026-01/State-of-AI-Agents-2026-Final.pdf) — Databricks, State of AI Agents 2026 (text ej extraherbar i detta pass, se ovan)

**Tredjepart (sökmotor-syntes eller mindre engineeringbloggar):**

- [docs.cursor.com/chat/agent](https://docs.cursor.com/chat/agent) — Cursor, Auto/Max-läge (svagare källbindning, se caveat)
- [docs.crewai.com/.../concepts/llms](https://docs.crewai.com/v1.15.2/en/concepts/llms) — CrewAI, LLM per agent-roll
- [requesty.ai/blog/how-to-cap-runaway-agent-spend-2026](https://www.requesty.ai/blog/how-to-cap-runaway-agent-spend-2026) — konkreta eskalationstriggrar ("2 identiska fällningar")
- [augmentcode.com/guides/ai-model-routing-guide](https://www.augmentcode.com/guides/ai-model-routing-guide) — statisk vs dynamisk routing, rangordningsclaim
- [GitHub — Not-Diamond/awesome-ai-model-routing](https://github.com/Not-Diamond/awesome-ai-model-routing) — RouteLLM/Martian-översikt
- [GitHub — BerriAI/litellm issue #24152](https://github.com/BerriAI/litellm/issues/24152) — dokumenterat gap: nyckel-nivå-gränser triggar inte fallback
- [x.com/databricks/status/2044176992120037759](https://x.com/databricks/status/2044176992120037759) — Databricks egen bekräftelse av 78 %/59 %-siffrorna

**Akademiska källor:**

- [arxiv.org/abs/2607.19338](https://arxiv.org/abs/2607.19338) — CodeRescue: Budget-Calibrated Recovery Routing for Coding Agents
- [arxiv.org/pdf/2605.06350](https://arxiv.org/pdf/2605.06350) — Is Escalation Worth It? A Decision-Theoretic Characterization of LLM Cascades
