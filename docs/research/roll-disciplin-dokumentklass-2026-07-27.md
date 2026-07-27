---
owner: marcus803
updated: 2026-07-27
review_by: 2027-01-27
status: stable
---

# Roll-disciplin som dokumentklass — finns den, var bor den, hur skrivs innehållet (Code, 2026-07-27)

> **Proveniens:** avgränsat research-pass, 2026-07-27. Beställt efter fyndet att
> `templates/code-role-discipline.md` (249 rader, v1.0 → v1.3) aldrig laddats i en session.
>
> **Vad passet gjorde:** läste granskningsobjektet och konstitutionen i sin helhet, samt de
> två föregående passen (`instruktionsleverans-branschpraxis-2026-07-27.md` och
> `agent-instruktionsfiler-branschpraxis-2026-07-27.md`); hämtade förstapartsdokumentation
> från Anthropic (Claude Code-docs + platform-docs), Cognition/Devin, Cline, Cursor, AWS Kiro
> och GitHub; inventerade tre OSS-uppsättningar (HumanLayer, BMAD-METHOD, Agent OS); hämtade
> fem forskningsartiklar direkt från källan; körde **läs-only** kontroller mot disk
> (teckenräkning, katalog-inventering) och HTTP-statuskontroll av samtliga citerade URL:er
> med och utan browser-UA.
>
> **Vad passet INTE gjorde:** inga git-kommandon, ingen testsvit, ingen linter utöver
> markdownlint på den egna filen, inget `npm`-kommando, ingen fil ändrad eller raderad utanför
> denna. `~/Repon/marcus-system/`-filerna är lästa, aldrig rörda.
>
> **Avgränsning mot föregående pass:** leveransfrågan (vilket lager bär vad) är besvarad i
> `instruktionsleverans-branschpraxis-2026-07-27.md` och upprepas inte. Detta pass besvarar
> två andra frågor: existerar dokumentklassen hos branschledare, och hur ska innehållet
> struktureras. En punkt i det föregående passet **korrigeras** — se
> [§Fråga 2](#fråga-2--var-bor-den-och-hur-levereras-den).

---

## Kort svar

### Ställningstagande: avveckla filen som dokumentklass, splittra innehållet

Dokumentklassen finns och är mogen — nio undersökta uppsättningar bär ett dokument om
agentens egen arbetsprocess, skilt från projektfakta. Men **ingen enda av dem levererar det
som en separat, alltid-gällande fil som pekas ut i prosa**: de levererar det antingen som
systemprompt (agentdefinition, output style, persona) eller som något som anropas i
ögonblicket (playbook, workflow, kommando, skill). Formen `templates/code-role-discipline.md`
valde har alltså noll precedent — inte för att innehållet är fel, utan för att bäraren är det.

Den andra halvan av grunden är mätdata som inte fanns i något tidigare pass: den enda
kontrollerade utvärderingen av repo-nivåns kontextfiler mot faktisk uppgiftslösning
(Gloaguen m.fl., ETH Zürich, MemAgents @ ICLR 2026) finner **ingen** förbättring av
lösningsgrad och **över 20 % högre inferenskostnad**, med slutsatsen att *"unnecessary
requirements from context files make tasks harder, and human-written context files should
describe only minimal requirements."* Att leverera 249 rader till varje session är alltså
inte en neutral åtgärd — det är den åtgärd som är mätt och som inte lönade sig.

### Målformen i en tabell

| Sektion i filen | Vart innehållet tar vägen | Varför |
|---|---|---|
| §1 Operativ loop | Konstitutionen (redan där, som princip) + mekanisering av de två checkbara punkterna | Loopen är redan en alltid-på-rad; §1.4/§1.5 är verifierbara, inte omdöme |
| §2 Transparens-rapport-format | Plugin-levererad **output style** (systemprompt) | Förstapartens uttalade hemvist för *"role, tone, or default response format every turn"* |
| §3 STOPPA-grindarna | Samma output style (3 rader) + `permissions.deny` för det irreversibla | Grinden som ska hålla varje gång får inte vara prosa |
| §4 Handover-protokoll | Samma output style (rapportens självbärande-krav är en formatregel) | Det är ett svarsformat, inte en procedur |
| §5 Vad Code inte gör | Delas: `git add -A` → `permissions.deny`; resten → en rad i konstitutionen | Två av fyra punkter är mekaniserbara |
| §6 Delegering till subagenter | Agentdefinitioner (`tools`, `isolation`, `maxTurns`) + brief-mallen in i de skills som redan anropas vid delegering | §6 är per definition inte i kontext när den behövs — den behöver bo där delegeringen sker |
| Empirisk grund, versionshistorik, motiveringar | `lessons.md` + ADR-lagret | Rationale hör till beslutslagret, inte till ett alltid-på-lager |

Vill Marcus ändå ha **en** fil är det korrekta valet `~/.claude/rules/`, inte `templates/` —
den laddas i varje projekt på maskinen, utan dialog, med samma prioritet som `CLAUDE.md`. Men
då måste den vara ≤ 40 rader och **ersätta**, inte komplettera. Se
[§Rekommenderad målform](#rekommenderad-målform).

---

## Fråga 1 — finns dokumentklassen alls?

Ja. Innehållsklassen "agentens egen arbetsprocess" är väletablerad och har egna namn hos flera
leverantörer: *playbook*, *workflow*, *custom agent*, *persona*, *steering*, *output style*.
Det är inte en hemsnickrad kategori.

### De nio uppsättningarna

| Uppsättning | Dokumentet | Vad det innehåller | Bärare | Alltid-på? |
|---|---|---|---|---|
| Cognition / Devin | Playbook (`.devin.md`) | Procedure · Specifications · Advice · **Forbidden Actions** · Required from User | Anropas via makro (`!namn`) eller drag-and-drop | Nej |
| Cline | `.clinerules/workflows/*.md` | Procedurer att köra nu | Anropas som slash-kommando | Nej |
| Cline | `.clinerules/*.md` | *"coding standards, architectural constraints, and project-specific context"* | Läses varje request | Ja — men innehållet är konventioner, inte en loop |
| Cursor | `.cursor/rules/*.mdc`, typ **Always Apply** | Samma klass | *"Always included. Globs and description are ignored."* | Ja — samma innehållsklass |
| AWS Kiro | `.kiro/steering/*.md`, `inclusion: always` | Standard-dokumenten är `product.md`, `tech.md`, `structure.md`; exempel på egna: `api-standards.md`, `testing-standards.md` | Laddas i varje interaktion | Ja — samma innehållsklass |
| GitHub Copilot | `.github/agents/*.agent.md` | *"custom instructions that define the agent's behavior and expertise"* | Kroppen **är** agentens systemprompt; väljs per uppgift | Nej |
| Anthropic / Claude Code | Output style · agentdefinition · skill | Roll, ton, svarsformat · systemprompt · arbetsflöde | Systemprompt (output style, agent) eller vid anrop (skill) | Output style: ja. Övriga: nej |
| HumanLayer (OSS) | `.claude/commands/create_plan.md` m.fl., ~650 rader | Faser, stopp-punkter före varje fasövergång, rapportformat, handover | Anropas som slash-kommando | Nej |
| BMAD-METHOD (OSS) | Agent-persona: `role`, `identity`, `communication_style`, `principles` | Rollen och dess principer | Kompileras till agentdefinition, aktiveras på begäran | Nej |
| Agent OS (OSS) | `standards/` + `/inject-standards` | Kodstandarder som injiceras när de behövs | Injiceras på begäran, *"the right standards at the right time"* | Nej |

Källor: [Devin — Creating Playbooks](https://docs.devin.ai/product-guides/creating-playbooks),
[Cline — Rules](https://docs.cline.bot/customization/cline-rules),
[Cursor — Rules](https://cursor.com/docs/context/rules),
[Kiro — Steering](https://kiro.dev/docs/steering/),
[GitHub — About custom agents](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-custom-agents),
[Claude Code — Output styles](https://code.claude.com/docs/en/output-styles),
[humanlayer/humanlayer `.claude/commands/create_plan.md`](https://github.com/humanlayer/humanlayer/blob/main/.claude/commands/create_plan.md),
[BMAD Method — Named agents](https://docs.bmad-method.org/explanation/named-agents/),
[Agent OS](https://buildermethods.com/agent-os).

### Den skarpa nyansen: klassen finns, formen finns inte

Läs tabellens sista kolumn tillsammans med kolumnen före. Där svaret är "ja, alltid-på" är
innehållet **konventioner och projektfakta** — inte en operativ loop, ett rapportformat eller
stopp-grindar. Där innehållet faktiskt är agentens arbetsprocess är svaret **utan undantag
"nej, den anropas"** eller **"den är systemprompt"**.

Cline har skrivit ut skiljelinjen i klartext, och det är den bästa formuleringen jag hittade
av vad Marcus fil egentligen är:

> *"Workflows are procedural ('execute this process now'), while clinerules are behavioral
> ('always behave this way')."*
> ([Cline — Stop adding rules when you need workflows](https://cline.ghost.io/stop-adding-rules-when-you-need-workflows/))

`code-role-discipline.md` är **båda** i samma fil. §1, §2 och §6 är procedurella — de gäller i
ett bestämt ögonblick (arbetsenhetens start, leveransögonblicket, delegeringsögonblicket). §3
och §5 är beteendemässiga — de gäller alltid. Att blanda dem i en artefakt är precis det
Cline namnger som felvalet, och det är också varför ingen bärare passar hela filen: det finns
ingen bärare för "alltid + procedurell", eftersom en procedur som alltid är laddad är en
procedur som mestadels är irrelevant.

### Precedent-räkningen, deklarerad öppet

- **Nio uppsättningar** bär ett dokument om agentens arbetsprocess. Klassen finns.
- **Fem** av dem levererar det vid anrop. **Tre** levererar det som systemprompt. **En**
  (Cline/Cursor/Kiro-mönstret) har en alltid-på-fil, men dokumenterad för konventioner.
- **Noll** levererar processdokumentet som en separat alltid-gällande fil utpekad i prosa från
  huvudinstruktionsfilen. Det är formen `templates/code-role-discipline.md` valde, och den har
  ingen publicerad förebild.

Frånvaro av publicerad förebild är inte bevis för frånvaro i praktiken — privata
agentkonfigurationer publiceras sällan. Men samtliga fem leverantörer och tre OSS-ramverk som
faktiskt dokumenterar sin lösning valde en annan.

---

## Fråga 2 — var bor den, och hur levereras den?

Fyra bärare finns, och förstaparten säger rakt ut vad var och en är till för.

| Bärare | Förstapartens beskrivning | Laddas | Väger som |
|---|---|---|---|
| Output style | *"change how Claude responds, not what Claude knows. They modify the system prompt to set role, tone, and output format"* | Varje session, systemprompt | Systemprompt |
| Agentdefinition | *"The body becomes the system prompt"* | När agenten körs | Systemprompt |
| `CLAUDE.md` / `.claude/rules/` | *"Project conventions, 'always do X' rules"* | Varje session | Användarmeddelande |
| Skill | *"Loads task-specific instructions when invoked or relevant"* | Vid anrop | Meddelande i konversationen |

Källa: [Output styles](https://code.claude.com/docs/en/output-styles),
[sub-agents](https://code.claude.com/docs/en/sub-agents),
[memory](https://code.claude.com/docs/en/memory).

### Anthropics egen processdisciplin bor i systemprompten

Det starkaste enskilda belägget för var innehållet hör hemma står i output-styles-dokumentet,
och det handlar inte om Marcus fil utan om Anthropics egen:

> *"Custom output styles leave out Claude Code's built-in software engineering instructions,
> **such as how to scope changes, write comments, and verify work**, unless
> `keep-coding-instructions` is set to `true`."*

Alltså: leverantörens egen "hur agenten arbetar"-disciplin — hur man avgränsar en ändring, hur
man verifierar sitt arbete — är **systemprompt-innehåll**, inte en fil. Den distribueras inte
som markdown man ombeds konsultera. Det är samma innehållsklass som §1, §2 och §5 i Marcus
fil, och branschledaren har placerat den ett lager ovanför det lager Marcus valde.

Två mekaniska egenskaper som ingen annan bärare har:

- *"All output styles trigger reminders for Claude to adhere to the output style instructions
  during the conversation."* Det är en inbyggd repetitionsmekanism mot den enda effekt som är
  robust i litteraturen — att efterlevnaden sjunker inom sessionen.
- Output style är **inte** kompaktbar bort på samma sätt som konversationsinnehåll, eftersom
  den ligger i systemprompten som läses en gång per session.

Kostnaden är ärlig och liten: *"Adding instructions to the system prompt increases input
tokens, though prompt caching reduces this cost after the first request in a session."*

### Korrigering av det föregående passet

`instruktionsleverans-branschpraxis-2026-07-27.md` skriver att plugin-`settings.json`
`{"agent": …}` är *"den **enda** vägen för ett plugin att leverera alltid-på-instruktioner till
huvudtråden"*. Det stämmer inte. Det finns en andra väg, och den är billigare och mindre
ingripande:

> `force-for-plugin` — *"Plugin output styles only: apply this style automatically whenever the
> plugin is enabled, without requiring users to select it. Overrides the user's `outputStyle`
> setting."*

Och i plugin-referensens komponentlista, verifierad ordagrant:

> `output-style` — *"An `output-styles/<name>.md` that applies automatically while the plugin
> is enabled"*, med `output-styles/` uppräknad bland de kataloger som måste ligga i
> plugin-roten.

Skillnaden mot `agent`-nyckeln är avgörande. `--agent`/`settings.agent` *"replaces the default
Claude Code system prompt entirely"* — en beteendeförändring med stor blast radius. En output
style med `keep-coding-instructions: true` **lägger till** i slutet av systemprompten och
lämnar Claude Codes egen ingenjörsdisciplin orörd. Det är exakt den operation Marcus vill
göra, och den är sedan tidigare tillgänglig via ett plugin han redan har installerat i
user-scope.

En begränsning som måste stå med: *"Output styles apply to the main conversation only: a
subagent runs its own system prompt, so styles don't change how subagents respond."* §6 kan
alltså inte levereras den vägen — den måste bo i agentdefinitionerna och i briefen. Vilket är
rätt ändå: §6 gäller orkestreraren i delegeringsögonblicket, inte alla sessioner.

---

## Fråga 3 — om klassen inte kodifieras som alltid-på-fil, vad görs i stället?

Alla fyra alternativ som frågan listar förekommer, och de förekommer i en tydlig
prioritetsordning.

### (a) Mekanisering i harnesset — det som ska hålla varje gång

Mönstret är samma hos alla som publicerat något:

- Copilots molnagent kan *"[not] push directly to your default branch"* och *"cannot directly
  run `git push` or other Git commands"* — plattformsspärr, inte instruktion.
- Claude Code: `permissions.deny`, `PreToolUse`, agentens `tools`/`disallowedTools`,
  `isolation: worktree`, `maxTurns`.
- Devins **Forbidden Actions** är undantaget som bekräftar regeln: det är prosa, men det är den
  enda sektionen i playbooken som beskrivs som absolut (*"Include any action Devin should
  absolutely not take"*) — och den sitter i det dokument som faktiskt laddas när uppgiften
  startar, inte i ett dokument som pekas ut på avstånd.

### (b) Systemprompt — rollen och svarsformatet

Copilot custom agents, BMAD-personor, Claude Codes output styles och agentdefinitioner. Alla
fyra placerar "vem agenten är och hur den svarar" i systemprompten. Ingen av dem placerar det i
en fil som agenten ombeds läsa.

Att systemprompt-placering faktiskt köper efterlevnad har numera **partiellt** stöd, till
skillnad från vad det föregående passet kunde säga. Wallace m.fl. (OpenAI) konstaterar problemet
och tränar bort det: dagens modeller behandlar systemprompt och användarindata med lika
prioritet, och artikeln inför en hierarki som *"drastically increases robustness"*
([arXiv:2404.13208](https://arxiv.org/abs/2404.13208)). SysBench mäter sedan systemmeddelandets
efterlevnad direkt över sex begränsningstyper — bland dem **roll** och **format** — och
rapporterar att uppmärksamhet riktad mot systemmeddelandet korrelerar positivt med efterlevnad
([arXiv:2408.10943](https://arxiv.org/abs/2408.10943)).

Två reservationer som måste stå kvar: hierarkin är tränad för **konfliktlösning**, inte för
"följs bättre i allmänhet", och ingen av artiklarna mäter Claude Codes specifika uppdelning
systemprompt kontra `CLAUDE.md`-användarmeddelande. Belägget är starkare än "leverantörspåstående"
men svagare än "mätt för vårt fall".

### (c) Anrop i ögonblicket — procedurerna

Devin-playbooks, Cline-workflows, Copilot-promptfiler, Claude-skills, HumanLayers
`.claude/commands/`. HumanLayer är det mest jämförbara fallet: deras `create_plan.md` är cirka
650 rader ren processdisciplin — faser, obligatoriska stopp före varje fasövergång,
rapportformat, explicit paus för mänsklig verifiering, regler för när subagenter får startas
(*"DO NOT spawn sub-tasks before reading these files yourself in the main context"*). Alltså
exakt Marcus innehåll, i exakt Marcus utförlighet — men levererat som ett kommando som körs när
planeringen börjar. Utförligheten är inte problemet. Placeringen är.

### (d) Inte kodifierat alls

Anthropics egen best-practices-guide ägnar en av ~20 sektioner åt att skriva `CLAUDE.md`; resten
är operativa val. Det fyndet är redan draget i det föregående passet och upprepas inte här mer
än som konstaterande: bilden från detta pass är **inte** att branschen låter processdisciplin
vara oskriven. Den skriver ned den — men i en bärare som avfyras vid rätt tillfälle.

---

## Fråga 4 — strukturfrågan: hur skrivs ~60 omdömesregler så att de följs?

Här är svaret obekvämt och måste delas i två: vad som är **mätt**, och vad som är **konvention
med mekanistisk plausibilitet**. De blandas rutinmässigt ihop i sekundärlitteraturen.

### Vad som faktiskt är mätt

| Fynd | Källa | Status | Vad det säger om struktur |
|---|---|---|---|
| Kontextfiler ger **ingen** höjning av lösningsgrad och **+20 %** inferenskostnad; *"unnecessary requirements … make tasks harder"* | Gloaguen m.fl., ETH Zürich, MemAgents @ ICLR 2026 ([arXiv:2602.11988](https://arxiv.org/abs/2602.11988)) | Workshop-artikel, oral + runner-up best paper | Mindre innehåll är den enda intervention med mätstöd |
| AGENTS.md ger **−28,6 %** median-körtid och **−16,6 %** utdata-tokens vid jämförbar lösningsgrad (10 repon, 124 PR:er) | Lulla m.fl. ([arXiv:2601.20404](https://arxiv.org/abs/2601.20404)) | Preprint | Filen köper **effektivitet**, inte korrekthet |
| Ingen av fyra strukturvariabler (storlek, position, filarkitektur, motsägelser) ger detekterbar kontrast | [arXiv:2605.10039](https://arxiv.org/abs/2605.10039) | Preprint | Struktur i just denna filklass är omätt-utan-effekt |
| Upp till **76 accuracy-poäng** spridning mellan betydelsebevarande formatval | Sclar m.fl., ICLR 2024 ([arXiv:2310.11324](https://arxiv.org/abs/2310.11324)) | **Peer-reviewad** | Format kan spela enorm roll — men mätt på few-shot-uppgiftsprompter, inte agentkonfiguration |
| Efterlevnad faller med instruktionstäthet; bias mot tidigare instruktioner | IFScale ([arXiv:2507.11538](https://arxiv.org/abs/2507.11538)) | Preprint | Färre och tidigare slår fler och senare |
| Systemmeddelandets efterlevnad faller med begränsningskomplexitet och över turer | SysBench ([arXiv:2408.10943](https://arxiv.org/abs/2408.10943)) | Preprint | Stabilitet över lång session är den svaga punkten |

Sammanvägt, ärligt: **det enda strukturgrepp med kontrollerat stöd är att skriva mindre.**
Rubriker, imperativform, gruppering och exempel har ingen mätning bakom sig i denna domän.
FormatSpread visar att format *kan* ha dramatisk effekt, men i en annan uppgiftsklass, och den
visar lika mycket att effekten är oförutsägbar — vilket är ett argument för att **mäta sin egen
fil**, inte för att lita på en formkonvention.

### Vad förstaparten faktiskt föreskriver för exakt denna innehållsklass

Anthropics skill-författningsguide är den mest detaljerade publicerade anvisningen som finns för
att skriva procedurella agentinstruktioner. Den är råd, inte mätning — men den är förstapart och
den är konkret ([Skill authoring best
practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)):

- *"Claude is already very smart. Only add context Claude doesn't already have."* Testfrågorna:
  *"Does Claude really need this explanation?"*, *"Does this paragraph justify its token cost?"*
- **Frihetsgrader ska matcha uppgiftens bräcklighet.** Analogin är explicit: *"Narrow bridge
  with cliffs on both sides"* → exakta instruktioner; *"Open field with no hazards"* → *"Give
  general direction and trust Claude to find the best route."*
- **Checklista för komplexa flöden:** *"provide a checklist that Claude can copy into its
  response and check off as it progresses."*
- **Återkopplingsslinga:** *"Run validator → fix errors → repeat … This pattern greatly improves
  output quality."*
- **Konsekvent terminologi:** *"Choose one term and use it throughout … Consistency helps Claude
  parse and follow instructions."*
- **Prominens som verktyg vid faktiskt observerat brott:** *"using stronger language such as
  'MUST filter' instead of 'always filter,' or restructuring the workflow section."*
- **Referenser högst ett steg djupt:** *"Claude may partially read files when they're referenced
  from other referenced files … Keep references one level deep."*
- **Innehållsloftet:** *"Keep SKILL.md body under 500 lines."*
- **Skiljedomaren:** *"Create evaluations BEFORE writing extensive documentation … Evaluations
  are your source of truth for measuring Skill effectiveness."*

### Den punkt som träffar Marcus arkitektur rakt

*"Avoid deeply nested references"* är skriven om filer inuti en skill, men mekanismen är
generell och beskriver precis felmönstret: en referens från en refererad fil läses ofta bara
delvis, eller inte alls. Marcus kedja är ett steg värre än det dokumenterade felfallet —
konstitutionen är laddad, den nämner filen i prosa, och filen ligger utanför varje mekanism som
kan hämta den. Att den aldrig lästes på fyra versioner är alltså inte ett olycksfall utan det
dokumenterade beteendet.

### Vad detta ger för de ~60 omdömesreglerna

Frihetsgrads-resonemanget är den mest användbara enskilda idén passet hittade, och det ger en
tredelning som är skarpare än "behåll eller stryk":

1. **Smal bro** — regeln har ett verifierbart utfall och ett dyrt fel. Exempel ur filen: `git
   add -A`-förbudet, datum-invarianten (§1.4), governing/non-governing-kontrollen (§1.5),
   "commit/push bakom kvittens" (§3.3). Dessa ska **inte** vara prosa alls. De ska vara
   `permissions.deny`, en hook, eller en CI-grind. Att de står som "checkpunkter" med
   "operationalisering" är att skriva en spärr som en påminnelse.
2. **Öppet fält** — regeln är genuint omdöme utan verifierbart utfall: "hitta grundorsaker",
   "kräv elegans", "förklara så Gunilla förstår". Förstapartens råd är att ge **generell
   riktning och lita på modellen**, inte att specificera vidare. Här är varje tillagd mening
   negativ nettoinsats enligt Gloaguen. Formen ska vara: en kort imperativ rad, inget
   "operationalisering"-stycke, ingen empirisk grund inbakad.
3. **Ögonblicksbunden procedur** — regeln gäller vid en identifierbar händelse
   (leveransögonblicket, delegeringen, sessionsavslutet). Den ska bo i den skill eller det
   kommando som redan avfyras då, med checklist-mönstret, inte i ett alltid-på-lager.

Och Anthropics redigeringstest gäller varenda rad: *"Would removing this cause Claude to make
mistakes? If not, cut it."* Filen har idag ett fast mönster — **Checkpunkt** ·
**Operationalisering** · **Empirisk grund** — där tredje delen aldrig styr beteende och andra
delen ofta upprepar första. Två tredjedelar av radmassan är sådant som redigeringstestet
stryker. Motiveringen är inte värdelös; den hör hemma i `lessons.md` och ADR-lagret, som är
byggda för just rationale.

---

## Fråga 5 — `SessionStart`-hook som leveransväg

### Domen: fel verktyg för detta innehåll, rätt verktyg för en liten del av det

Förstaparten uttalar sig direkt om precis den här användningen, i hooks-referensens avsnitt om
`additionalContext`:

> *"Use `additionalContext` for information Claude should know about **the current state of your
> environment or the operation that just ran**"* — miljötillstånd, villkorliga projektregler,
> extern data.
>
> *"**For instructions that never change, prefer `CLAUDE.md`. It loads without running a script**
> and is the standard place for static project conventions."*
>
> *"**Write the text as factual statements rather than imperative system instructions.** …
> **Text framed as out-of-band system commands can trigger Claude's prompt-injection defenses**,
> which causes Claude to surface the text to you instead of treating it as context."*

Den sista meningen är avgörande och lätt att missa. `code-role-discipline.md` är från första
till sista raden imperativ processinstruktion — *"Rör inget"*, *"Läs aldrig agentens
transkript"*, *"Path-scopad `git add` alltid"*. Det är exakt den fras-klass förstaparten varnar
för att injicera via hook. Bästa utfallet är att den behandlas som kontext; ett realistiskt
utfall är att den ytas till Marcus som misstänkt injektion.

### Den mekaniska spärren, mätt mot filen

> *"If a value exceeds 10,000 characters, Claude Code writes the full text to a file in the
> session directory and passes Claude the file path with a short preview instead."*

Uppmätt på disk 2026-07-27: `templates/code-role-discipline.md` är **15 464 tecken**. En
`SessionStart`-hook som injicerar filen ordagrant faller alltså över tröskeln och levererar —
en sökväg och en förhandsvisning. Det vill säga: **exakt den pekare-som-aldrig-öppnas som är
hela problemet**, fast nu i dyrare förpackning. Hooken skulle reproducera felet den var tänkt
att laga.

### Väger hooken tyngre än en fil? Nej

*"Claude Code wraps the string in a system reminder and inserts it into the conversation at the
point where the hook fired."* För `SessionStart`: *"at the start of the conversation, before the
first prompt."* Det är samma viktklass som `CLAUDE.md` — konversationsinnehåll efter
systemprompten, inte systemprompt. Hooken köper alltså **noll** efterlevnadsvinst jämfört med
`~/.claude/rules/`. Den köper villkorlighet och beräknat innehåll. Inget annat.

Ytterligare två egenskaper som talar emot: `SessionStart` har *"No blocking or decision
control"*, och vid fel *"Claude doesn't see it, and the session … proceeds"* — hooken kan
misslyckas tyst utan att någon märker det.

### Kostnadsjämförelsen

| Väg | Laddas | Viktklass | Löpande kostnad | Failure mode |
|---|---|---|---|---|
| Prosapekare i `CLAUDE.md` (nuläget) | Aldrig | — | Noll tokens, full underhållskostnad | Tyst — filen läses inte, ingen märker det |
| `@`-import | Vid start, ordagrant | Användarmeddelande | Hela filen varje session; *"doesn't reduce context"* | Ingen — men dyrast av alla |
| `~/.claude/rules/` utan `paths` | Varje session, alla projekt på maskinen, utan dialog | Användarmeddelande, *"same priority as `.claude/CLAUDE.md`"* | Hela filen varje session | Ingen; enklaste korrekta mekanismen |
| `SessionStart`-hook | Varje start/resume/fork | System reminder i konversationen | Noll när den inte kör; skriptunderhåll | Tyst fel; >10 000 tecken degraderar till sökväg; imperativ text kan trigga injektionsförsvar |
| Plugin-output style (`force-for-plugin`) | Varje session | **Systemprompt**, med inbyggda påminnelser | Systemprompt-tokens, cachade efter första requesten | Endast huvudtråden — subagenter påverkas inte |

Källor: [hooks](https://code.claude.com/docs/en/hooks),
[memory](https://code.claude.com/docs/en/memory),
[output-styles](https://code.claude.com/docs/en/output-styles).

### Vad hooken däremot är rätt för

En sak i filen är genuint hook-material, och det är den enda del som idag är skriven som prosa
trots att den är beräkningsbar: **datum-invarianten i §1.4**. Regeln lyder att datum ska hämtas
live i skrivögonblicket. Den regeln behöver inte stå skriven — dagens datum ska stå i kontexten.
En `SessionStart`-hook som skriver ut en faktapåstående-rad (`Dagens datum är 2026-07-27.
Aktuell gren är …`) följer förstapartens formkrav ordagrant, kostar noll när den inte kör, och
gör regeln överflödig i stället för att upprepa den.

Repot har för övrigt redan tagit första steget på observabilitetssidan: hub-pluginet levererar
nu en `InstructionsLoaded`-hook (`hooks/log-instructions-loaded.sh`, matchare
`session_start|nested_traversal|path_glob_match|include|compact`). Den mäter vad som faktiskt
laddas — men den levererar ingenting, och ska inte förväxlas med en leveransväg.

---

## Rekommenderad målform

### 1. Filen avvecklas som dokumentklass

`templates/code-role-discipline.md` upphör att vara en levande artefakt. Den arkiveras med en
supersession-not; versionshistoriken och de empiriska grunderna bevaras där de hör hemma
(`lessons.md`, ADR-lagret). Ingen ny version mintas.

### 2. Rollen, rapportformatet och stopp-regeln blir en output style i pluginet

Ny fil: `plugins/marcus-system/output-styles/code-roll.md`. Målstorlek **40–60 rader** — den
betalar systemprompt-tokens i varje session och konkurrerar med allt annat.

```markdown
---
name: Code-rollen
description: Marcus arbetsform - rapportformat, stopp-grind, handover
keep-coding-instructions: true
force-for-plugin: true
---

## Rapportformat

Varje leverans avslutas med en numrerad transparens-rapport: ett block per verifierat
område, faktiskt värde per punkt, verbatim där det begärts. Avvikelse mot förväntat
värde prefixas AVVIKELSE: med faktiskt vs förväntat. En ren läsning avslutas med
"Inga andringar gjorda - working tree oforandrad."

## Stopp-grind

Vid tvetydighet som data inte kan avgöra, vid arkitektur- eller scope-beslut, vid
divergens mellan prompt-antagande och verifierat tillstånd: STOPPA. Rör inget,
rapportera det oväntade verbatim, föreslå ingen kringgående fallback, invänta kvittens
i klartext.

## Handover

Rapporten är beslutsunderlag, inte en relä-etapp. Den ska vara självbärande: vad som
gjordes, verifieringsutfall, avvikelser, kvarvarande arbetsträds-tillstånd, vad som
väntas på.
```

Grunderna: *"role, tone, or default response format every turn"* är förstapartens egen
definition av bäraren; `keep-coding-instructions: true` behåller Claude Codes inbyggda
ingenjörsdisciplin; `force-for-plugin: true` gör att den gäller så snart pluginet är aktiverat,
utan att Marcus behöver välja den. Notera att `output-styles/` inte plockas upp live —
*"Run `/reload-plugins` or restart Claude Code"* — samt att en plugin-bump enligt Marcus egen
praxis ska följas av `claude plugin update` i samma landning.

### 3. Det mekaniserbara mekaniseras

- `git add -A`-förbudet och det irreversibla steget → `permissions.deny` respektive
  `PreToolUse`. En regel som ska hålla varje gång får inte vara en mening.
- Datum-invarianten → `SessionStart`-hook som skriver ut dagens datum och aktuell gren som
  faktapåståenden.
- Governing/non-governing-frontmatter-kontrollen → den är redan en repo-mekanism
  (`.frontmatter-policy.conf` + pre-commit-hook); prosaregeln om att verifiera den är
  överflödig när hooken faktiskt kör.

### 4. §6 flyttar dit delegeringen sker

- Tvingande delarna → agentdefinitioner: en läs-/analysagent utan `Bash` kan inte köra git,
  oavsett vad briefen säger; `isolation: worktree` gör filpartitionen omöjlig att bryta;
  `maxTurns` sätter storleksramen.
- Brief-mallen (§6.2) → in i kroppen på de skills som redan anropas vid delegering
  (`research`, `do-work`, `work-batch`). Där är den i kontext i det enda ögonblick den betyder
  något, och den kan förladdas deterministiskt via subagentens `skills:`-fält.

### 5. Om Marcus ändå vill ha en fil

Då är det `~/.claude/rules/code-roll.md`, inte `templates/`. Den laddas i varje projekt på
maskinen, utan godkännandedialog, med samma prioritet som `CLAUDE.md`. Villkoren: **≤ 40 rader**,
imperativ, en rad per regel, ingen "empirisk grund"-sektion, och den **ersätter** motsvarande
rader i konstitutionen i stället för att dubbla dem — motsägelser mellan angränsande filer är
den enda felklass både Anthropic och GitHub varnar för explicit.

### 6. Grinden: mät i stället för att anta

Förstaparten är entydig om skiljedomaren: *"Evaluations are your source of truth."* Minimiformen
här är billig och konkret — tre representativa uppgifter körda med och utan output style, med
ett mätbart utfall (levererades transparens-rapporten i rätt form? stannade agenten vid
divergens?). Utan den mätningen är valet mellan output style, rules och prosa fortfarande en
smaksak, och detta pass har bara flyttat gissningen till ett bättre lager.

---

## Vad jag INTE kunde belägga

1. **Att ett roll-/processdokument över huvud taget förbättrar en agents beteende.** Ingen av de
   fem artiklarna mäter det. Den enda mätningen i närheten (Gloaguen) finner ingen effekt på
   lösningsgrad för kontextfiler i allmänhet. Detta är passets tunnaste punkt och gäller lika
   mycket den rekommenderade målformen som nuvarande fil.
2. **Att output style ger högre efterlevnad än `CLAUDE.md` i Claude Code specifikt.** Mekanismen
   är förstapartsdokumenterad (systemprompt + påminnelser), och instruktionshierarki-litteraturen
   stöder riktningen, men ingen har mätt just den kontrasten i detta harness.
3. **Att påminnelse-mekanismen ("output styles trigger reminders") faktiskt höjer efterlevnad.**
   Leverantörspåstående utan publicerad mätning.
4. **Att någon i branschen kör en separat alltid-gällande processfil privat.** Jag hittade noll
   publicerade instanser. Privata konfigurationer publiceras sällan — frånvaron av förebild är
   ett svagt negativt bevis, inte ett starkt.
5. **Var 200- och 500-radersgränserna kommer ifrån.** Fortfarande ingen leverantör som citerar en
   studie, och den enda studie som testar filstorlek finner ingen effekt. Oförändrat sedan
   föregående pass.
6. **Om Gloaguens rapporterade delresultat (+4 % för människoskrivna, −3 % för LLM-genererade)
   står i artikeln.** Siffrorna förekommer i sekundära sammanfattningar; det jag kunde verifiera
   direkt mot abstract och institutionens publiceringssida är "ingen förbättring av lösningsgrad"
   och "+20 % kostnad". Delresultatet åberopas därför inte som grund här.

---

## Källförteckning

### Anthropic, förstapart

- [Output styles](https://code.claude.com/docs/en/output-styles) — bäraren för roll/format, `force-for-plugin`, `keep-coding-instructions`
- [Hooks reference](https://code.claude.com/docs/en/hooks) — `SessionStart`, `additionalContext`, 10 000-teckengränsen, formkravet på injicerad text
- [Plugins reference](https://code.claude.com/docs/en/plugins-reference) — `output-styles/` som plugin-komponent, `settings.json`-nycklar, `CLAUDE.md` i plugin-rot
- [How Claude remembers your project](https://code.claude.com/docs/en/memory) — `CLAUDE.md` och `.claude/rules/`
- [Create custom subagents](https://code.claude.com/docs/en/sub-agents) — kroppen är systemprompten
- [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) — frihetsgrader, checklistor, återkopplingsslingor, referensdjup, evals
- [Improving skill-creator: test, measure, and refine Agent Skills](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills) — *"Testing turns a skill that seems to work into one you know works."*

### Andra leverantörer, förstapart

- [Cognition / Devin — Creating Playbooks](https://docs.devin.ai/product-guides/creating-playbooks) — Procedure, Specifications, Advice, Forbidden Actions, Required from User
- [Cline — Rules](https://docs.cline.bot/customization/cline-rules) — `.clinerules/`, globala regler, `paths`-villkor
- [Cline — Stop adding rules when you need workflows](https://cline.ghost.io/stop-adding-rules-when-you-need-workflows/) — procedurell kontra beteendemässig; **påstående utan mätning**
- [Cursor — Rules](https://cursor.com/docs/context/rules) — regeltyperna, "Always included"
- [AWS Kiro — Steering](https://kiro.dev/docs/steering/) — `inclusion: always` / `fileMatch` / `manual`, en domän per fil
- [GitHub — About custom agents](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-custom-agents) — `.github/agents/*.agent.md`, kroppen som systemprompt

### OSS-uppsättningar

- [humanlayer/humanlayer — `.claude/commands/create_plan.md`](https://github.com/humanlayer/humanlayer/blob/main/.claude/commands/create_plan.md) — ~650 rader processdisciplin som slash-kommando
- [BMAD Method — Named agents](https://docs.bmad-method.org/explanation/named-agents/) — persona med `role`, `identity`, `communication_style`, `principles`
- [Agent OS](https://buildermethods.com/agent-os) — standarder injicerade på begäran

### Forskning (peer-review-status per post)

- [Gloaguen m.fl., *Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?*](https://www.sri.inf.ethz.ch/publications/gloaguen2026agentsmd) — **MemAgents @ ICLR 2026** (workshop, oral + runner-up best paper); [arXiv:2602.11988](https://arxiv.org/abs/2602.11988)
- [Lulla m.fl., *On the Impact of AGENTS.md Files on the Efficiency of AI Coding Agents*, arXiv:2601.20404](https://arxiv.org/abs/2601.20404) — **preprint**
- [Sclar m.fl., *Quantifying Language Models' Sensitivity to Spurious Features in Prompt Design*, arXiv:2310.11324](https://arxiv.org/abs/2310.11324) — **peer-reviewad, ICLR 2024**
- [Wallace m.fl., *The Instruction Hierarchy*, arXiv:2404.13208](https://arxiv.org/abs/2404.13208) — **preprint**
- [*SysBench: Can Large Language Models Follow System Messages?*, arXiv:2408.10943](https://arxiv.org/abs/2408.10943) — **preprint**
- [*Instruction Adherence in Coding Agent Configuration Files*, arXiv:2605.10039](https://arxiv.org/abs/2605.10039) — **preprint**
- [*How Many Instructions Can LLMs Follow at Once?* (IFScale), arXiv:2507.11538](https://arxiv.org/abs/2507.11538) — **preprint**

### Internt underlag

- `~/Repon/marcus-system/templates/code-role-discipline.md` — v1.3, läst i sin helhet
- `~/Repon/marcus-system/CLAUDE.md` — 217 rader, läst i sin helhet
- `docs/research/instruktionsleverans-branschpraxis-2026-07-27.md` — läst i sin helhet
- `docs/research/agent-instruktionsfiler-branschpraxis-2026-07-27.md` — läst i sin helhet

---

## Verifierat mot disk och nät (läs-only, 2026-07-27)

| Kontroll | Utfall |
|---|---|
| `templates/code-role-discipline.md` | 249 rader, **15 464 tecken** — över `additionalContext`-gränsen på 10 000 |
| `~/Repon/marcus-system/CLAUDE.md` | 217 rader, 17 023 tecken |
| `~/Repon/marcus-system/IDENTITET.md` | 312 rader, 17 196 tecken |
| `~/.claude/output-styles/` | Finns inte — lagret helt oanvänt |
| `~/.claude/rules/` | Finns inte — lagret helt oanvänt |
| `~/.claude/agents/` | Finns inte — noll installerad bas |
| Plugin-rot `plugins/marcus-system/` | `README.md`, `hooks/`, `skills/` (17 skills). Ingen `output-styles/`, ingen `agents/` |
| Plugin-hook | `InstructionsLoaded` registrerad mot `log-instructions-loaded.sh` — observabilitet, ingen leverans |
| HTTP-status, samtliga 12 citerade externa URL:er | 200 med och utan browser-UA; inga länkgrinds-undantag behövs |

Inga ändringar gjorda i något av dessa. Arbetsträdet oförändrat utanför denna fil.
