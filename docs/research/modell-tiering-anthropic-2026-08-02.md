---
owner: marcus803
updated: 2026-08-02
review_by: 2027-02-02
status: draft
---

# Hur tilldelar Anthropic modeller till orkestrerare vs. subagenter — och vad styr Claude Code? (2026-08-02)

> **Proveniens:** avgränsat research-pass 2026-08-02, beställt av orkestreraren
> för att grunda ett kommande policybeslut om modell per processteg
> (orkestrering / arkitektur / implementation / review / felsökning) och
> default-agenternas modellval. Ingen kod, ingen config och inget kort rört —
> enda avsedda skrivningen i repot är denna fil.
>
> **Källor mätta/hämtade 2026-08-02** mot: `code.claude.com/docs` (sub-agents,
> model-config, agent-sdk/subagents, agent-sdk/overview — hämtade i sin
> helhet via WebFetch), `claude.com/blog` (modell-/effort-guiden samt
> dynamic-workflows-inlägget), `anthropic.com/engineering` (multi-agent
> research-system-posten samt "effective context engineering"), GitHub-issues
> i `anthropics/claude-code` (läst via `gh issue view --json`, inte
> sökmotor-sammanfattning), och repots egen `git log` / installerade
> `claude --version` (lokalt `2.1.220`). Där en uppgift kommer från en
> tredjeparts-sammanfattning i stället för primärkällans egen text står det
> utskrivet.

---

## Kort svar

**Anthropics enda publicerade referensarkitektur (multi-agent
research-system, 2025-06) körde en starkare modell som orkestrerare (Opus 4)
och en billigare modell som subagenter (Sonnet 4) — men det är ett
fallstudie-resultat, inte en uttalad, generell regel.** Ingen förstapartskälla
säger explicit "orkestreraren ska alltid köra den starkaste modellen". Det
närmaste till en regel är dels **strukturellt inbyggt** i Claude Code självt
(de inbyggda subagenterna Explore/Plan/general-purpose ärver huvudloopens
modell och kan aldrig automatiskt köra dyrare än den), dels en generell
uppgifts-svårighets-heuristik ("matcha modell mot uppgiftens svårighetsgrad")
som gäller per agent, inte per roll (orkestrerare kontra utförare).

**Claude Code erbjuder fyra oberoende lager för modellstyrning**, i
dokumenterad prioritetsordning vid subagent-anrop: (1) miljövariabeln
`CLAUDE_CODE_SUBAGENT_MODEL`, (2) per-anropets `model`-parameter, (3)
subagent-filens `model`-fält i frontmatter, (4) huvudsessionens modell. På
sessionsnivå: `/model`, `--model`-flaggan, `ANTHROPIC_MODEL`-miljövariabeln
och `model`-fältet i `settings.json`, i den ordningen.

**Detta repos premiss håller.** `.claude/agents/bygg-agent.md` och
`research-pass.md` bär `model: sonnet` sedan PR #557 (verifierat, se nedan) —
och **detta forskningspass självt är den levande mätningen**: jag kör som
Sonnet 5 (`claude-sonnet-5`), exakt vad `research-pass.md`:s frontmatter
föreskriver, i en session vars huvudloop enligt `CLAUDE.md` kör
`claude-fable-5[1m]`. Claude Code-versionen i denna worktree är `2.1.220`
(mätt via `claude --version`). Detta är en positiv, färsk mätning — men den
står mot en dokumenterad historik av GitHub-issues (2026-01 till 2026-07,
versioner 2.1.7–2.1.177) där precis samma frontmatter-fält rapporterades
ignorerat. Se § Vad jag inte kunde belägga.

---

## Delfråga 1 — Anthropics multi-agent-forskningssystem: vilka modeller, och finns uppdateringar?

**Källa:** [anthropic.com/engineering/multi-agent-research-system](https://www.anthropic.com/engineering/multi-agent-research-system)
(publicerad 2025-06-13/14 enligt [Simon Willisons referat](https://simonwillison.net/2025/Jun/14/multi-agent-research-system/),
som är den enda tredjepartskälla som gav ett exakt datum).

- **Lead agent:** Claude Opus 4. **Subagenter:** Claude Sonnet 4.
- **Resultat:** *"a multi-agent system with Claude Opus 4 as the lead agent
  and Claude Sonnet 4 subagents outperformed single-agent Claude Opus 4 by
  90.2%"* på interna research-utvärderingar.
- **Motivering för själva flermodell-arkitekturen** (inte specifikt för
  Opus-vs-Sonnet-valet): *"The improvement was strongly linked to token
  usage and the ability to spread reasoning across multiple independent
  context windows"* — token-användning förklarar enligt artikeln ~80 % av
  variansen i browsing-utvärderingar; modellval och antal tool-calls är
  ytterligare faktorer (tillsammans ~95 %).
- **Modellkvalitet som hävstång, citerat rakt:** *"upgrading to Claude
  Sonnet 4 is a larger performance gain than doubling the token budget on
  Claude Sonnet 3.7."* Detta är ett generellt uttalande om att modellkvalitet
  slår tokenvolym — inte ett uttalande om ORKESTRERARENS roll specifikt.
- **Vad som INTE passar arkitekturen**, citerat: *"most coding tasks involve
  fewer truly parallelizable tasks than research, and LLM agents are not yet
  great at coordinating and delegating to other agents in real time"* samt
  *"Some domains that require all agents to share the same context or
  involve many dependencies between agents are not a good fit for
  multi-agent systems today."*
- **Kostnadsbild, citerat:** *"agents typically use about 4× more tokens
  than chat interactions, and multi-agent systems use about 15× more tokens
  as chats"* — därav kravet att uppgiftens värde måste överstiga den ökade
  kostnaden för att vara ekonomiskt motiverat.

**Finns senare förstapartskällor som uppdaterar mönstret?** Två kandidater
prövades direkt:

1. [anthropic.com/engineering/effective-context-engineering-for-ai-agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
   (2025, efter forskningssystem-posten) beskriver samma
   orkestrerare/subagent-mönster ur ett kontext-isolerings-perspektiv
   (*"specialized sub-agents can handle focused tasks with clean context
   windows, while the main agent coordinates with a high-level plan"**)
   men **säger ingenting om vilken modell orkestreraren respektive
   subagenterna ska köra**. Prövat direkt via WebFetch med explicit fråga
   om modellval — inget relevant textstycke hittades.
2. [claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code)
   (publicerat 2026-06-02 — det senaste förstaparts-inlägget som rör
   multi-agent-orkestrering jag hittade) inför `Workflow`-verktyget för att
   orkestrera "dozens to hundreds" av subagenter från ett skript. Det
   närmaste till modellstyrnings-vägledning där: *"Create a classifier
   agent tuned to your tasks that decides which model to use"* — en
   klassificerare som routar till Sonnet eller Opus baserat på uppgiftens
   förväntade svårighetsgrad. Detta är en **uppgifts-baserad
   routing-princip**, inte en orkestrerare-kontra-subagent-regel: samma
   klassificerare kan i princip route:a både orkestrerarens och en
   subagents nästa steg.

**Slutsats delfråga 1:** 2025-fallstudien (Opus-lead + Sonnet-subagenter) är
Anthropics enda konkreta, sifferbelagda referenspunkt för
orkestrerare-starkare-än-utförare-mönstret. Den är inte formellt uppdaterad
eller omprövad i senare förstapartsmaterial jag hittade — "effective context
engineering"-posten återanvänder arkitekturmönstret men lämnar modellvalet
oadresserat, och dynamic-workflows-posten (nyast, 2026-06) lägger till en
uppgifts-svårighets-klassificerare som ett KOMPLEMENT, inte en ersättning,
för samma grundprincip.

---

## Delfråga 2 — Claude Code-dokumentationen: modellval per subagent, per anrop, per session, och effort

**Primärkälla:** [code.claude.com/docs/en/sub-agents](https://code.claude.com/docs/en/sub-agents)
och [code.claude.com/docs/en/model-config](https://code.claude.com/docs/en/model-config)
(hämtade i sin helhet 2026-08-02; sidorna bär `min-version`-annoteringar ner
till enskilda patch-versioner, vilket tyder på att de genereras direkt ur
produktens källa — hög tillförlitlighet som primärkälla).

### Subagent-frontmatterns `model`-fält

> *"`model` — Model to use: `sonnet`, `opus`, `haiku`,
> `fable`, a full model ID (for example, `claude-opus-5`), or `inherit`.
> Defaults to `inherit`"*

Giltiga värden alltså: **`sonnet`, `opus`, `haiku`, `fable`, en fullständig
modell-ID-sträng, eller `inherit`** (default vid utelämnat fält).

### Resolutionsordning vid subagent-anrop (dokumenterad, prioritetsordning)

> *"Claude Code resolves the subagent's model in this order: 1. The
> `CLAUDE_CODE_SUBAGENT_MODEL` environment variable, when set to a model
> alias or model ID 2. The per-invocation `model` parameter 3. The subagent
> definition's `model` frontmatter 4. The main conversation's model"*

Två versionsnoterade nyanser, båda direkt relevanta för detta repos historik:

- **Sedan v2.1.196:** `CLAUDE_CODE_SUBAGENT_MODEL=inherit` behandlas som
  "unset" — resolutionen fortsätter till per-anrops-parametern och
  frontmatter. **Före v2.1.196 tvingade `inherit` subagenten till
  huvudsessionens modell och ignorerade båda de senare källorna** — exakt
  det beteende som beskrivs i GitHub-issue #68392 (se § Vad jag inte kunde
  belägga).
- **Sedan v2.1.211:** en per-anrops `model`-parameter håller kvar sitt val
  även när subagenten återupptas (`resume`) eller får en uppföljning — före
  detta föll den tillbaka på frontmatter/huvudmodell vid återupptagning.
- Valen kontrolleras mot organisationens `availableModels`-allowlist; ett
  värde utanför listan hoppas över och subagenten kör den ärvda modellen
  i stället.

### Byggda default-agenter — direkt svar på uppdragets HYPOTES

Uppdragets kontext beskrev som HYPOTES att "harnessets default-agenter
(Explore, Plan, general-purpose) ärver huvudloopens modell om inget annat
anges per anrop". Dokumentationen **bekräftar detta rakt av**, med en
version-gated nyans:

| Agent | Modell (dokumenterat) |
|---|---|
| **Explore** | *"inherits from the main conversation, capped at Opus on the Claude API, so Explore never runs on a more expensive model than the one you already chose for the session"* — **sedan v2.1.198**. Före v2.1.198 körde Explore **alltid på Haiku**, oavsett huvudsessionens modell. |
| **Plan** | *"inherits from the main conversation"* |
| **general-purpose** | *"inherits from the main conversation"* |
| **statusline-setup** | Sonnet (hårdkodat) |
| **claude-code-guide** | Haiku (hårdkodat) |

Explore-capen ("aldrig dyrare än sessionens modell") är den tydligaste
**mekaniska** motsvarigheten i dokumentationen till principen "subagent ska
inte automatiskt kosta mer än orkestreraren" — men den gäller bara de
inbyggda agenterna, inte egendefinierade `.claude/agents/*.md`-filer (som
bygg-agent och research-pass), vars `model`-fält är helt oberoende av
huvudsessionens modell och kan sättas till vad som helst (inklusive dyrare
än huvudloopen).

### Modellval per session

Dokumenterad prioritetsordning ("Setting your model"):

1. `/model <alias|name>` under sessionen (öppnar väljare utan argument).
   Sedan v2.1.153 sparas valet som default för nya sessioner (`Enter`) om
   man inte uttryckligen väljer sessions-only (`s`).
2. `--model <alias|name>` vid uppstart (gäller endast den sessionen).
3. `ANTHROPIC_MODEL`-miljövariabeln (gäller endast den sessionen).
4. `model`-fältet i `settings.json` (permanent default).

Alias: `default`, `best` (Fable 5 där org har access, annars senaste Opus),
`fable`, `sonnet`, `opus`, `haiku`, samt `sonnet[1m]` / `opus[1m]` för
1M-kontext-varianter, och `opusplan` (Opus i plan-läge, Sonnet i
exekveringsläge — en inbyggd hybrid).

### Effort/reasoning-nivåer och samspelet med modellval

> *"The available effort levels depend on the model."* Fable 5, Opus 5,
> Sonnet 5, Opus 4.8 och Opus 4.7 stödjer alla fem nivåerna
> (`low`/`medium`/`high`/`xhigh`/`max`); Opus 4.6 och Sonnet 4.6 saknar
> `xhigh`. Default är `high` på varje modell utom Opus 4.7 (`xhigh`).

Subagent-frontmattern har ett eget `effort`-fält:

> *"`effort` — Effort level when this subagent is active. Overrides the
> session effort level. Default: inherits from session."*

Precedensordning för effort (dokumenterad): miljövariabeln
`CLAUDE_CODE_EFFORT_LEVEL` slår allt annat, därefter din konfigurerade nivå,
därefter modellens default; **subagent-frontmatterns `effort` gäller när den
subagenten är aktiv och slår sessionsnivån, men inte miljövariabeln.**

Extended thinking (utökat resonemang) ärvs sedan v2.1.198 av subagenter
direkt från huvudsessionens inställning — det finns inget separat
per-subagent-reglage för på/av, bara `effort`.

**Slutsats delfråga 2:** samtliga fyra styrlager uppdraget frågade efter
finns och är väldokumenterade med exakt precedensordning: frontmatter (per
subagent), per-Agent-anrop (`model`-parameter), per session (`/model` +
tre lager till), och miljövariabler på båda nivåerna. Samspelet
modell×effort är dokumenterat explicit: effort är en egen dimension som kan
sättas per subagent oberoende av modell, men modellen avgör vilka
effort-nivåer som är tillgängliga.

---

## Delfråga 3 — Finns förstaparts-guidance "Opus för X, Sonnet för Y, Haiku för Z"?

**Ja, en dedikerad artikel finns**, länkad direkt från model-config-sidan:
[claude.com/blog/claude-model-and-effort-level-in-claude-code](https://claude.com/blog/claude-model-and-effort-level-in-claude-code).
Exakta citat:

> *"Fable is a specialist who's seen problems almost no one else has, Opus
> is the expert, and Sonnet is a really good generalist."*
>
> *"Pick a smaller model when the work is routine. For example, edits you
> can describe precisely, mechanical changes, or questions about code
> that's already in context."*
>
> *"Pick a larger model when the problem is genuinely hard. For example,
> problems like subtle bugs, unfamiliar domains, or architecture
> decisions."*
>
> *"If Claude has all the pertinent context and clearly tried and still got
> it wrong, that's a signal to pick a larger model."*

Effort-vägledning från samma artikel: *"For most tasks you should use the
model's default effort level"* och *"Pick a higher effort level if Claude
got it wrong by skipping a file, not running the tests, or not
double-checking its work."*

**Viktigt att notera explicit:** denna artikel nämner **inte** subagenter,
orkestrering eller flerarkiv-uppsättningar en enda gång (prövat direkt via
en andra, riktad WebFetch-fråga). Den är skriven för valet "vilken modell
ska DEN HÄR sessionen/uppgiften köra", inte "vilken modell ska
orkestreraren köra kontra utföraren".

Kompletterande första-parts-exempel på samma princip appliceras PER AGENT
(inte per roll):

- Sub-agents-dokumentationen listar bland skälen att använda subagenter:
  *"**Control costs** by routing tasks to faster, cheaper models like
  Haiku"* — en generell kostnadskontrolls-princip, applicerad nedåt i
  svårighetsgrad, inte uppåt mot orkestrering.
- Agent SDK-dokumentationens dynamiska agent-exempel (se delfråga 4) har
  kommentaren *"Key insight: use a more capable model for high-stakes
  reviews"* — samma svårighetsgrad-princip, kodad som ett konkret
  runtime-val (`model="opus" if is_strict else "sonnet"`).

**Slutsats delfråga 3:** vägledningen som finns är en
uppgifts-svårighets-heuristik ("matcha modellstyrka mot problemets
svårighetsgrad"), inte en rollbaserad regel ("orkestreraren är alltid
svårast"). Den appliceras i Anthropics egna exempel per agent/uppgift, och
den bekräftar indirekt att en subagent MED en svår, hög-insats-uppgift (t.ex.
en strikt säkerhetsgranskning) förväntas köra en STARKARE modell än en enkel
orkestrerande överblick — vilket är precis den situation där
"orkestreraren-är-alltid-starkast"-antagandet bryter samman i Anthropics
egen exempeldesign.

---

## Delfråga 4 — Agent SDK: modellval per subagent, och rekommendationer

**Primärkällor:** [code.claude.com/docs/en/agent-sdk/subagents](https://code.claude.com/docs/en/agent-sdk/subagents)
och [code.claude.com/docs/en/agent-sdk/overview](https://code.claude.com/docs/en/agent-sdk/overview)
(hämtade i sin helhet).

### `AgentDefinition.model`-fältet (programmatisk definition, rekommenderad väg i SDK:t)

| Fält | Typ | Krävs | Beskrivning |
|---|---|---|---|
| `model` | `string` | Nej | *"Model override for this agent. Accepts an alias such as `'fable'`, `'opus'`, `'sonnet'`, `'haiku'`, `'inherit'`, or a full model ID. Defaults to main model if omitted"* |

Samma semantik som Claude Code CLI:ts filbaserade subagenter (bekräftat i
dokumentationstexten: *"You can also define subagents as markdown files in
`.claude/agents/` directories… Programmatically defined agents take
precedence over filesystem-based agents with the same name."*).

### Rekommenderat mönster: dynamisk modellvalsfabrik

Dokumentationen visar ett explicit "best practice"-kodexempel (Python och
TypeScript, identiskt mönster) för att sätta modell **beroende på
körtids-svårighetsgrad**, inte på agentens roll i hierarkin:

```python
def create_security_agent(security_level: str) -> AgentDefinition:
    is_strict = security_level == "strict"
    return AgentDefinition(
        description="Security code reviewer",
        prompt=f"You are a {'strict' if is_strict else 'balanced'} security reviewer...",
        tools=["Read", "Grep", "Glob"],
        # Key insight: use a more capable model for high-stakes reviews
        model="opus" if is_strict else "sonnet",
    )
```

Kommentaren *"Key insight: use a more capable model for high-stakes
reviews"* är den mest konkreta, kodifierade första-parts-vägledningen jag
hittade om NÄR en subagent bör köra en starkare modell — kopplat till
uppgiftens insats (stakes), inte till om agenten är orkestrerare eller
utförare.

### Övrigt SDK-relevant

- Inga skalnings-relaterade rekommendationer bortom "Subagents work well for
  a few delegated tasks per turn" — för dussintals/hundratals agenter
  hänvisar dokumentationen till `Workflow`-verktyget (dynamic workflows),
  där orkestreringen flyttas till ett skript utanför konversationskontexten.
- Subagenter ärver huvudsessionens `extended thinking`-inställning (samma
  regel som CLI:t, sedan v2.1.198).
- Ingen egen SDK-specifik regel för orkestrerarens modell hittades utöver
  vad som redan gäller för huvudsessionen generellt (delfråga 2/3).

**Slutsats delfråga 4:** Agent SDK:t exponerar samma `model`-fält och samma
"default till huvudmodell om inget annat anges"-beteende som Claude Code
CLI:t, och dess enda konkreta vägledning i kod är
svårighetsgrad-baserad modellvals-fabrik, inte en orkestrerare/subagent-regel.

---

## Delfråga 5 — Vad säger Anthropic om ORKESTRERARENS modell specifikt?

Detta är den delfråga uppdraget pekar ut som avgörande, och den som gav
minst en direkt, uttalad regel. Sammanställning av alla spår som ÄR
dokumenterade eller belagda:

1. **Empirisk precedens (starkast, men smalast):** multi-agent
   research-system-posten (delfråga 1) är den enda konkreta,
   sifferbelagda instansen av "starkare modell orkestrerar, billigare
   modeller utför" i Anthropics förstapartsmaterial. Den beskriver ETT
   experiment, inte en generell regel — och artikeln själv ägnar mer
   utrymme åt att förklara VARFÖR flera agenter (token-spridning,
   parallellisering) än varför just Opus-som-lead.
2. **Strukturell inbyggnad (mekanisk, men bara för byggda default-agenter):**
   Explore är sedan v2.1.198 hård-capad vid huvudsessionens modell ("never
   runs on a more expensive model than the one you already chose for the
   session"), och Plan/general-purpose ärver rakt av. Detta är den enda
   platsen där Claude Code SJÄLVT mekaniskt förhindrar att en subagent
   automatiskt blir dyrare än orkestreraren — men det gäller uttryckligen
   INTE egendefinierade `.claude/agents/*.md`-filer, vars `model`-fält är
   fritt och oberoende (bekräftat i dokumentationstexten: en
   projekt-/användarnivå-agent döpt `Explore` "overrides the built-in and
   keeps its own `model` field").
3. **Uppgifts-svårighets-heuristik (generell, men rollagnostisk):** både
   modell-/effort-bloggen (delfråga 3) och Agent SDK:ts kodexempel
   (delfråga 4) formulerar regeln som "matcha modell mot problemets
   svårighetsgrad", tillämpad per agent/uppgift — INTE "orkestrerare-roll
   ⇒ starkare modell". En hög-insats-subagent (t.ex. en strikt
   säkerhetsgranskare) förväntas explicit köra starkare modell än en enkel
   orkestrerande överblick i Anthropics eget exempel.
4. **Relaterad, men separat, mekanik med samma RIKTNING:** Claude API:ts
   `advisor`-verktyg (dokumenterat i Claude API-referensen, inte Claude
   Code) har en HÅRD valideringsregel: *"The advisor model must be at least
   as capable as the executor. An invalid pairing returns 400
   invalid_request_error."* Detta är en annan produkt-yta (rådgivare kontra
   utförare i ETT enda API-anrop, inte multi-agent-orkestrering), men den
   kodifierar samma princip — "den rådgivande/planerande rollen ska aldrig
   vara svagare än den utförande rollen" — som en teknisk spärr, inte bara
   en rekommendation. Värt att notera som precedent för RIKTNINGEN, inte
   som bevis för orkestrerare-specifikt.
5. **`opusplan`-aliaset** (Opus i planläge, Sonnet i exekvering) är ett
   inbyggt Claude Code-mönster som direkt sätter en starkare modell på
   PLANERINGS-steget och en billigare på EXEKVERINGS-steget inom SAMMA
   session — konceptuellt närmast en "orkestrerare (planerar) = stark,
   utförare (kodar) = billigare"-uppdelning, men återigen inom en session,
   inte mellan huvudloop och subagent.

**Sammanvägd dom för delfråga 5:** mönstret "starkaste modellen
orkestrerar, billigare modeller utför" är **belagt som Anthropics EGEN
referens-precedens och som en strukturell default** för de inbyggda
agenterna, men **INTE dokumenterat som en generell, uttalad regel för alla
multi-agent-uppsättningar**. Den motsatta situationen — en subagent som
medvetet ges en STARKARE modell än huvudloopen för en specifik,
hög-insats-deluppgift — är lika väl belagd i Anthropics eget SDK-exempel.
Slutsatsen är att Anthropics vägledning är **uppgifts-driven, inte
rolldriven**: frågan är inte "är detta orkestreraren eller subagenten?" utan
"hur svår/hög-insats är just den här uppgiften?".

---

## Dom

För detta repos konkreta situation (bygg-agent.md + research-pass.md på
`model: sonnet`, orkestrerare på `claude-fable-5[1m]`):

- **Konfigurationen följer ett dokumenterat, existerande mönster** —
  Anthropics egen 2025-fallstudie körde precis denna typ av uppdelning
  (starkare lead, billigare parallella utförare), och Claude Codes
  inbyggda Explore/Plan/general-purpose-design bekräftar samma riktning
  strukturellt för de agenter som INTE fått ett eget `model`-fält.
- **Men den vilar på en mekanism med en dokumenterad historik av att gå
  sönder.** Frontmatter-fältets faktiska verkan är den svagaste länken:
  minst åtta separata GitHub-issues (#44385, #18346, #68392, #47488, #5456,
  #10993, #19174, #34821) beskriver samma symptomklass — subagenten kör
  tyst huvudsessionens (dyrare) modell i stället för den deklarerade — över
  versionerna 2.1.7 till 2.1.177 (2026-01 till 2026-07). Flera stängdes av
  en automatisk stale-bot som dubblett, inte av en bekräftad
  utvecklarkommentar om fix. **Ett av dessa fall (#68392,
  `CLAUDE_CODE_SUBAGENT_MODEL=inherit`) är dock uttryckligen dokumenterat
  som åtgärdat i v2.1.196** i den nuvarande dokumentationstexten — vilket
  ger konkret, om än partiell, belagd grund för att bugklassen aktivt
  åtgärdas versions-för-version snarare än att stå still.
- **Detta forskningspass är självt en färsk, positiv datapunkt** för
  just den installerade versionen (2.1.220): jag kör som Sonnet 5, exakt
  vad `research-pass.md`:s `model: sonnet` föreskriver, i en session vars
  huvudloop kör Fable 5. Om frontmatter-fältet ignorerats hade jag körts som
  Fable 5. Det gjorde jag inte.

**Domen i klartext:** premissen — att `model: sonnet` i frontmatter faktiskt
styr vilken modell subagenten kör — håller för den Claude Code-version detta
repo faktiskt kör (2.1.220), mätt direkt i denna session. Den vilar dock på
en mekanism som historiskt varit skör över flera på varandra följande
versioner, och ingen enskild källa bekräftar att HELA bugklassen (till
skillnad från den specifika `inherit`-instansen) är stängd för gott.

---

## Vad jag inte kunde belägga

- **Om frontmatter-modell-bugklassen är helt löst i alla kodvägar, eller
  bara den specifika `CLAUDE_CODE_SUBAGENT_MODEL=inherit`-instansen.** Jag
  hittade en explicit fix-i-version-not för `inherit`-fallet (v2.1.196),
  men ingen samlad changelog-post som säger "subagent frontmatter model-fältet:
  fixat i vX.Y.Z" för den bredare bugklassen. Flera GitHub-issues stängdes av
  en automatiserad stale-bot ("Closing for now — inactive for too long"),
  vilket INTE är samma sak som en bekräftad kod-fix.
- **Om orkestreringssessionens faktiska modell just nu genuint är Fable 5.**
  Jag kunde bekräfta att (a) inget `model`-fält finns i vare sig repots
  `.claude/settings.json` eller `~/.claude/settings.json`, vilket är
  konsistent med att Fable 5 valts via `/model fable` i sessionen (Claude
  Code-dokumentationen säger uttryckligen att Fable 5 "is not the default
  model. Select it with `/model fable`."), och (b) samtliga granskade
  commit-trailers i repot bär `Co-Authored-By: Claude Fable 5`. Jag kunde
  INTE direkt observera huvudsessionens live-modellval utifrån (ingen åtkomst
  till den processen från detta forskningspass) — detta är alltså indirekt,
  starkt men inte direkt, belagt.
- **Om Anthropic internt (dogfooding av Claude Code i det egna
  ingenjörsteamet) använder en specifik, namngiven orkestrerare/subagent-
  modelltilldelningsstandard.** Ingen förstapartskälla jag hittade beskriver
  detta explicit — endast det generella "matcha svårighetsgrad"-mönstret.
- **Precedens-rymden för "3+ branschledar-projekt" är tunn för just frågan
  orkestrerare-kontra-subagent-modell.** Jag hittade EN förstaparts-
  fallstudie (Anthropics egen, 2025-06) och tre tredjeparts-bloggar
  (CloudZero, MindStudio, claudefa.st) som alla i praktiken återger SAMMA
  Anthropic-ursprungliga mönster snarare än att representera oberoende,
  konkurrerande arkitektur-beslut hos andra branschledare. Detta är alltså
  INTE 3+ oberoende precedent-projekt — det deklareras öppet här snarare än
  att räkningen fejkas.
- **Om `advisor`-verktygets executor≤advisor-valideringsregel (Claude API,
  inte Claude Code) är avsedd som en generell arkitekturprincip eller bara
  en produktspecifik gräns för den funktionen.** Jag citerar den som
  RIKTNINGS-precedent i delfråga 5, men Anthropic kopplar den aldrig
  explicit till multi-agent-orkestrering i Claude Code.

---

## Rekommendation

**Detta är en rekommendation, inte ett beslut — Marcus äger vägvalet.**

1. **Behåll nuvarande uppdelning** (orkestrerare på starkast tillgängliga
   modell, hårt speccade CI-gated exekveringsagenter på Sonnet 5) — den
   matchar både Anthropics enda konkreta fallstudie och Claude Codes egen
   strukturella default för byggda agenter. Ingen ny research pekar mot att
   riva den.
2. **Behåll eskalationsstegen** som redan är nedskriven i commit `d0a49b28`
   (två fällningar på samma skiva ⇒ respawn med `model: fable` via
   Agent-anropets `model`-parameter) — den är en direkt tillämpning av
   modell-/effort-bloggens egen regel: *"If Claude has all the pertinent
   context and clearly tried and still got it wrong, that's a signal to
   pick a larger model."*
3. **Låt Explore/Plan/general-purpose vara orörda.** De ärver och capas
   redan mekaniskt vid huvudloopens modell (Explore: aldrig dyrare än
   sessionen, sedan v2.1.198) — det finns inget policybeslut att fatta här,
   Claude Code löser det strukturellt.
4. **Lägg in ett periodiskt, billigt sanity-check** av att
   frontmatter-modellen faktiskt appliceras — t.ex. låt en bygg-agent eller
   research-pass-agent skriva sin egen `model`-identitet (exakt den rad
   detta pass själv fick i sin systemprompt: *"You are powered by the model
   named X. The exact model ID is Y."*) i sin slutrapport en gång per
   ~10–20 körningar. Motiveringen är inte spekulativ: åtta separata,
   oberoende GitHub-issues beskriver exakt detta fält tyst brytande sönder
   över ett halvårs versionshistorik, och kostnadsargumentet i `d0a49b28`
   (3,3× billigare) förutsätter tyst att fältet faktiskt verkställs.
5. **Uppgifts-svårighet, inte bara rolltyp, bör vara kriteriet vid framtida
   agent-tillägg.** Anthropics eget SDK-mönster (`model="opus" if
   is_strict else "sonnet"`) visar att en enskild subagent med genuint hög
   insats (t.ex. en säkerhetskritisk kod-granskning) kan motivera en
   starkare modell än orkestrerarens egen — det är inte en princip-brytning
   om en framtida agent-definition avviker från "alla exekveringsagenter på
   Sonnet" när uppgiften motiverar det.

---

## Källförteckning

**Anthropic förstapart — engineering/blogg:**

- [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) — Anthropic Engineering, ~2025-06 (datum via Simon Willisons referat nedan; artikeln själv bär inget synligt publiceringsdatum i den hämtade texten)
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — Anthropic Engineering
- [Choosing a Claude model and effort level in Claude Code](https://claude.com/blog/claude-model-and-effort-level-in-claude-code) — Anthropic/Claude blogg
- [A harness for every task: dynamic workflows in Claude Code](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code) — Anthropic/Claude blogg, publicerad 2026-06-02 (datum bekräftat av hämtningen)

**Anthropic förstapart — produktdokumentation:**

- [code.claude.com/docs/en/sub-agents](https://code.claude.com/docs/en/sub-agents) — Claude Code subagents (frontmatter-fält, resolutionsordning, byggda default-agenter)
- [code.claude.com/docs/en/model-config](https://code.claude.com/docs/en/model-config) — modellval per session, alias, effort-nivåer, miljövariabler
- [code.claude.com/docs/en/agent-sdk/subagents](https://code.claude.com/docs/en/agent-sdk/subagents) — `AgentDefinition.model`, dynamiskt agentmönster
- [code.claude.com/docs/en/agent-sdk/overview](https://code.claude.com/docs/en/agent-sdk/overview) — Agent SDK-översikt, länk till dynamic-workflows-posten

**Tredjepart — sekundära referat (används endast för datum/kontext, aldrig som ensam källa för sakpåståenden):**

- [Simon Willison — Anthropic: How we built our multi-agent research system](https://simonwillison.net/2025/Jun/14/multi-agent-research-system/) — publiceringsdatum 2025-06-14
- CloudZero, MindStudio, claudefa.st — bloggposter om Claude Code-modelltiering; återger samma Anthropic-ursprungliga mönster, räknas INTE som oberoende precedent (se § Vad jag inte kunde belägga)

**GitHub-issues (`anthropics/claude-code`), lästa direkt via `gh issue view --json`:**

- [#44385](https://github.com/anthropics/claude-code/issues/44385) — "agent definition frontmatter `model:` field is ignored" (öppnad 2026-04-06, auto-stängd som dubblett av #18346 2026-04-10)
- [#18346](https://github.com/anthropics/claude-code/issues/18346) — samma symptom, originalissue (öppnad 2026-01-15, kommentarer till 2026-05, auto-stängd inaktiv 2026-06-11)
- [#68392](https://github.com/anthropics/claude-code/issues/68392) — `CLAUDE_CODE_SUBAGENT_MODEL=inherit` ignorerar per-anrops-parameter (öppnad 2026-06-14, matchar den fix som model-config-dokumentationen daterar till v2.1.196)
- #47488, #5456, #10993, #19174, #34821 — samma symptomklass, identifierade via sökning men inte var och en läst i fulltext i detta pass

**Repot självt (verifierat direkt, inte antaget):**

- `.claude/agents/bygg-agent.md`, `.claude/agents/research-pass.md` — `model: sonnet` i frontmatter
- `git log` — commit `d0a49b28` (PR #557, "konfig(agenter): [S91] bygg-agent + research-pass körs på Sonnet") och 20+ senare commit-trailers med `Co-Authored-By: Claude Fable 5`
- `claude --version` → `2.1.220` (mätt lokalt i denna worktree, 2026-08-02)
- `.claude/settings.json` (repo) och `~/.claude/settings.json` — inget `model`-fält satt i någon, kontrollerat direkt
- Denna sessions egen systemprompt — "You are powered by the model named Sonnet 5. The exact model ID is claude-sonnet-5." — den levande mätningen som underbygger domen ovan
