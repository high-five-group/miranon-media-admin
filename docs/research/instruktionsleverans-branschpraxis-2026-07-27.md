---
owner: marcus803
updated: 2026-07-27
review_by: 2027-01-27
status: stable
---

# Instruktionsleverans till kodagenter — vad hör hemma i vilket lager (Code, 2026-07-27)

> **Proveniens:** avgränsat research-pass (T100), 2026-07-27. Beställt av T100-kortet efter
> att fyra artefakter som konstitutionen bygger på visat sig aldrig nå en session.
>
> **Vad passet gjorde:** läste T100-kortet och det föregående passet
> (`agent-instruktionsfiler-branschpraxis-2026-07-27.md`) i sin helhet; hämtade tio
> förstapartsdokument från `code.claude.com/docs` samt Anthropics steering-blogg; hämtade
> förstapartsdokumentation från OpenAI Codex, Cursor, GitHub Copilot och Letta; hämtade fyra
> arXiv-abstract direkt från källan; körde sex **läs-only** kontroller mot disk för att
> verifiera leveransvägarnas faktiska tillstånd.
>
> **Vad passet INTE gjorde:** inga git-kommandon, ingen testsvit, ingen linter, inget
> `npm`-kommando, ingen fil ändrad eller raderad. Enda skrivna filen är denna.
>
> **Korrigering av T100-kortets premiss:** kortet talar om "hub-`CLAUDE.md`" som något skilt
> från den laddade användarfilen. Verifierat på disk: `~/.claude/CLAUDE.md` är en **symlänk**
> till `~/Repon/marcus-system/CLAUDE.md` (samma innehåll, 217 rader). Konstitutionen ÄR alltså
> användar-scope-filen och laddas i varje session. Det ändrar inte fyndet — de fyra
> refererade artefakterna når fortfarande aldrig fram — men det ändrar vilka åtgärder som är
> möjliga. Se [§Åtgärdsalternativen](#åtgärdsalternativen-mot-belägget).

---

## Kort svar

**Fyndet är inte en felkonfiguration. Det är en kategorifel, och Anthropic har skrivit ner det
i klartext.**

Ett plugin kan inte bära instruktionskontext i filform. Förstapartsdokumentationen är
kategorisk: *"A `CLAUDE.md` file at the plugin root is not loaded as project context. Plugins
contribute context through skills, agents, and hooks rather than CLAUDE.md. To ship
instructions that load into Claude's context, put them in a skill."* Och: *"Installed plugins
cannot reference files outside their directory."* Att lägga `templates/` i plugin-cachen fixar
alltså ett symptom (filen finns) men inte problemet (den levereras inte).

Fyra svar, komprimerat:

1. **Mekanik.** Anthropic publicerar en explicit avbildning mekanism → innehållstyp.
   Alltid-på: `CLAUDE.md` + `.claude/rules/` utan `paths`. Villkorligt: rules med `paths`,
   skills. Determinstiskt: hooks + `permissions`. Systemprompt: agentdefinitioner + output
   styles. `@`-import **sparar ingen kontext** — importerade filer laddas vid start.
2. **Gränsen.** Din lokala hypotes håller och skärps: *"an instruction is the wrong tool"*
   för hårda krav, *"a real guardrail needs to be deterministic, and the enforcement methods
   are hooks and permissions."* Men prosa har en starkare fil-lane du inte använder:
   **systemprompten** (agentdefinitionens kropp), inte användarmeddelandet CLAUDE.md är.
3. **Kontextbudget.** Det finns kontrollerad mätdata sedan juni–juli 2026, och den säger:
   *"Progressive disclosure buys context, not intelligence."* Den hjälper när materialet är
   för stort att navigera — och **underpresterar** när uppgiften hänger på exakta konventioner
   och trösklar. `IDENTITET.md` är den senare klassen. Det talar EMOT skill-vägen för den.
4. **Identitet/profil.** Precedent-rymden är **tunn och deklareras här öppet**: exakt EN
   jämförbar precedent (Letta/MemGPT `persona`+`human`-block), tre angränsande men
   annorlunda (preferenskanaler hos Cursor, Copilot, Codex), ett öppet ej antaget förslag.
   Lärdomen från den enda riktiga precedensen: **pinnad, hårt teckenbegränsad, kurerad** —
   inte en 312-raders fil.

**Bredare frågan:** belägget lutar tydligt mot **operatörsskicklighet**. Anthropics egen
best-practices-guide ägnar en (1) av ~20 sektioner åt att skriva CLAUDE.md; resten är
operativa val. Dess egen slutsats är *"you'll develop intuition that no guide can capture."*
Den enda robusta effekten i den enda faktorstudien av instruktionsfiler är **sessionslängd**,
inte filstruktur. Och det enda som mätbart lyfte efterlevnad från 0 % var att **ta bort
verktyget** (75 %) och att **belöna revisionsspår** (97 %) — bägge operatörsbeslut, inte text.

---

## Fråga 1 — Anthropics egen mekanik: vad är avsett för vad

Anthropic publicerar avbildningen explicit i två dokument: `features-overview` (§"Match
features to your goal", §"Context cost by feature") och steering-bloggen. Detta är inte
härlett — det står skrivet.

### Avbildningen, med förstapartsformulering

| Mekanism | Avsett innehåll (förstapartsord) | När den laddas |
|---|---|---|
| `CLAUDE.md` | *"Project conventions, 'always do X' rules"* | Session start, full content, **varje request** |
| `.claude/rules/` utan `paths` | *"Language-specific or directory-specific guidelines"* | Varje session, *"same priority as `.claude/CLAUDE.md`"* |
| `.claude/rules/` med `paths` | Samma, men scopat | *"only load when Claude works with matching files"* |
| Skill (`SKILL.md`) | *"Reference material, repeatable workflows"* | Beskrivning vid start, kropp vid invokering |
| Agentdefinition (`.claude/agents/`) | *"a separately scoped helper for a focused task"* | Kroppen **är** agentens systemprompt |
| Hook | *"Deterministic automation … block commands"* | Vid livscykelhändelse; *"Zero [context cost], unless the hook returns output"* |
| `settings.json` / `permissions` | Teknisk *enforcement* | Klient-tvingad, oberoende av modellen |
| Output style | *"a different role, tone, or default response format every turn"* | Modifierar systemprompten direkt |
| Auto memory (`MEMORY.md`) | *"Learnings and patterns"* som Claude själv skriver | Första 200 rader / 25 KB varje session |

Källor: [features-overview](https://code.claude.com/docs/en/features-overview),
[memory](https://code.claude.com/docs/en/memory),
[output-styles](https://code.claude.com/docs/en/output-styles).

### `@`-import: fungerar, men löser inte längdproblemet

*"CLAUDE.md files can import additional files using `@path/to/import` syntax. Imported files
are expanded and loaded into context at launch alongside the CLAUDE.md that references
them."* Både relativa och absoluta vägar tillåts; relativa löses *"relative to the file
containing the import"*; max fyra hopp djupt.

Och rakt ut, i felsökningsavsnittet: *"Splitting into `@path` imports helps organization but
doesn't reduce context, since imported files load at launch."*

Två detaljer som spelar roll för oss:

- Importer i användar-scope laddas **utan godkännandedialog**: *"Imports in user-scope memory
  files, such as `~/.claude/CLAUDE.md` and `~/.claude/rules/`, are files you wrote yourself,
  so they load without the dialog."* Vår konstitution ligger på just den vägen (via symlänk).
- Vad en **relativ** import gör från en symlänkad `CLAUDE.md` är **odokumenterat**. Löses den
  mot symlänkens plats (`~/.claude/`) eller mot målet (`~/Repon/marcus-system/`)? Ingen källa
  säger. Använd absolut form (`@~/Repon/marcus-system/…`), som dokumentationen visar explicit.

### Plugin-distribution: vad som kommer med, och vad som inte gör det

Det här är passets skarpaste fynd, och det avgör T100 direkt.

Ett plugin får innehålla: `skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`,
`monitors/`, `bin/`, `output-styles/`, `themes/` och ett `settings.json`
([plugins](https://code.claude.com/docs/en/plugins),
[plugins-reference](https://code.claude.com/docs/en/plugins-reference)).

Tre citat som tillsammans stänger frågan:

- *"A `CLAUDE.md` file at the plugin root is not loaded as project context. Plugins contribute
  context through skills, agents, and hooks rather than CLAUDE.md. To ship instructions that
  load into Claude's context, put them in a skill."*
- *"Installed plugins cannot reference files outside their directory. Paths that traverse
  outside the plugin root (such as `../shared-utils`) will not work after installation because
  those external files are not copied to the cache."*
- Symlänkar hanteras efter mål: inuti plugin-katalogen bevaras de; *"Elsewhere within the same
  marketplace: the symlink is dereferenced. The target's content is copied into the cache in
  its place."*; utanför marknadsplatsen *"the symlink is skipped for security."*

**Verifierat mot disk 2026-07-27** (läs-only): hubbens plugin-rot
`~/Repon/marcus-system/plugins/marcus-system/` innehåller `README.md` + `skills/`. Ingenting
annat. Cachen `~/.claude/plugins/cache/marcus-hub/marcus-system/1.20.2/` innehåller
`README.md`, `.claude-plugin/` och 17 skills. Sökning efter `code-role-discipline.md`,
`IDENTITET.md` och `profile.md` över hela cachen: **noll träffar**. Det stämmer exakt med
citatet ovan — filerna ligger utanför plugin-roten och kopieras därför aldrig.

`settings.json` i ett plugin stöder **endast två nycklar**: `agent` och `subagentStatusLine`.
Och `agent`-nyckeln är intressantare än den låter: *"Setting `agent` activates one of the
plugin's custom agents as the main thread, applying its system prompt, tool restrictions, and
model. This lets a plugin change how Claude Code behaves by default when enabled."* Det är den
**enda** vägen för ett plugin att leverera alltid-på-instruktioner till huvudtråden.

### Agentdefinitioner: kroppen är systemprompten

*"The frontmatter defines the subagent's metadata and configuration. The body becomes the
system prompt that guides the subagent's behavior. Subagents receive only this system prompt
plus basic environment details like the working directory, not the full Claude Code system
prompt."* ([sub-agents](https://code.claude.com/docs/en/sub-agents))

Frontmatter-fälten som är regler snarare än prosa: `tools`, `disallowedTools`, `model`,
`maxTurns`, `effort`, `isolation`, `permissionMode`, `memory`, `skills`, `initialPrompt`.

`skills`-fältet är underskattat: *"skills listed in the subagent's `skills` field are fully
preloaded into its context at launch."* Det är den enda mekanismen i hela produkten som
**deterministiskt** levererar en namngiven artefakt till en agent — ingen upptäckt, ingen
matchning, ingen slump.

Och: en hel session kan köras som en agentdefinition. *"Pass `--agent <name>` to start a
session where the main thread itself takes on that subagent's system prompt, tool
restrictions, and model."* Med varningen: *"The subagent's system prompt replaces the default
Claude Code system prompt entirely … `CLAUDE.md` files and project memory still load through
the normal message flow."*

Vad som når en subagent vid start: *"every level of the CLAUDE.md hierarchy the main
conversation loads, including `~/.claude/CLAUDE.md`, project rules, `CLAUDE.local.md`, and
managed policy files. The built-in Explore and Plan agents skip this."* Konstitutionen når
alltså subagenter — de fyra artefakterna gör det fortfarande inte.

### Skills och progressiv disclosure

*"Create a skill when you keep pasting the same instructions, checklist, or multi-step
procedure into chat, or when a section of CLAUDE.md has grown into a procedure rather than a
fact. Unlike CLAUDE.md content, a skill's body loads only when it's used."*
([skills](https://code.claude.com/docs/en/skills))

Tre mekaniska fakta som är mer avgörande än råden:

- **Beskrivnings-budgeten är 1 % av kontextfönstret.** *"The listing always contains every
  skill name, but if you have many skills, Claude Code shortens descriptions to fit the
  listing's character budget … When the listing overflows, Claude Code drops descriptions
  starting with the skills you invoke least."* Det är den **mekaniska förklaringen** till vår
  K8-observation (S6.7) att meta-disciplin inte auto-upptäcks tillförlitligt: med 17+ skills
  konkurrerar beskrivningarna om en fast budget, och de minst använda tappar sin text först.
  Vår slutsats var korrekt; nu finns orsaken.
- **En invokerad skill stannar hela sessionen.** *"the rendered `SKILL.md` content enters the
  conversation as a single message and stays there for the rest of the session."* Vid
  kompaktering återfästs de: första 5 000 tokens per skill, 25 000 tokens totalt, äldst
  tappas först.
- **Storleksrådet:** *"Keep `SKILL.md` under 500 lines. Move detailed reference material to
  separate files."*

### Hooks, permissions — och verifierings-grinden T100 efterfrågar

`PreToolUse` kan neka: `permissionDecision: "deny"` med skäl. `SessionStart` kan injicera text:
*"Any text your hook script prints to stdout is added as context for Claude"*, alternativt
strukturerat via `hookSpecificOutput.additionalContext`. `UserPromptSubmit` kan lägga till
kontext men *"can't replace the prompt"*.

Och — det här är svaret på T100:s steg 3 ("verifiera **mekaniskt** att artefakterna faktiskt
når en session"): **`InstructionsLoaded`-hooken finns redan och gör exakt det.** *"When a
CLAUDE.md or `.claude/rules/*.md` file is loaded into context. Fires at session start and when
files are lazily loaded during a session."* Med matchare för laddningsorsak: `session_start`,
`nested_traversal`, `path_glob_match`, `include`, `compact`. Den kan inte blockera (*"exit code
is ignored"*) — den är ren observabilitet, vilket är precis vad grinden behöver. Komplement:
`/context` listar faktiskt laddade filer under **Memory files**, och `claude plugin inspect`
visar *"a plugin's component inventory and projected token cost."*
([hooks](https://code.claude.com/docs/en/hooks))

---

## Fråga 2 — konfiguration kontra kunskap kontra självdisciplin

Hypotesen som växte fram lokalt håller. Den behöver en korrigering och en skärpning.

### Vad förstaparten säger, ordagrant

- *"Claude treats them as context, not enforced configuration. To block an action regardless
  of what Claude decides, use a PreToolUse hook instead."* (memory)
- *"Settings rules are enforced by the client regardless of what Claude decides to do.
  CLAUDE.md instructions shape Claude's behavior but are not a hard enforcement layer."*
  (memory)
- *"**Put guardrails in hooks.** An instruction like 'never edit `.env`' in CLAUDE.md or a
  skill is a request, not a guarantee. A `PreToolUse` hook that blocks the edit is enforcement.
  If a rule must hold every time, make it a hook rather than a prompt instruction."*
  (features-overview)
- *"When there's something that absolutely must not happen, an instruction is the wrong tool …
  A real guardrail needs to be deterministic, and the enforcement methods are hooks and
  permissions."* (steering-bloggen)
- Och mekanismen bakom svagheten: *"CLAUDE.md content is delivered as a user message after the
  system prompt, not as part of the system prompt itself. Claude reads it and tries to follow
  it, but there's no guarantee of strict compliance."* (memory)

### Mätdatan

*The Compliance Gap* (arXiv-preprint 2605.01771, **ej peer-reviewad**) är den enda källan med
siffror på just den här gränsen, och siffrorna är brutala:

- 0 % efterlevnad av processinstruktionen under default-villkor, över sex frontier-modeller.
- **75 %** när delegeringsverktyget **togs bort** (Cohen's d = 2,47) — *"the issue stems from
  environmental affordances rather than inherent model limitations."*
- **97 %** när revisionsspår belönades.
- Teorem 2: gapet är *"undetectable from text alone — by any human or LLM observer, present or
  future."* Nio blindade mänskliga bedömare låg på slumpnivå (Fleiss κ = 0,130) och
  identifierade **noll av femton** efterlevande sessioner korrekt.

Det tredje resultatet — att synlig verifikation lyfte till 97 % — är en **tredje lane** som
varken din hypotes eller T100-kortet nämner: mellan "mekanisera" och "skriv prosa" ligger
"gör efterlevnaden synlig och kontrollerbar". Det är exakt vad konstitutionens egen
transparens-rapport (~64 % fångst) redan gör, oberoende härlett.

### Skärpningen: prosa har en starkare lane än den använder

Din hypotes säger *"ren självdisciplin i prosa har nära noll effekt."* Det är för trubbigt.
Prosa i ett **användarmeddelande** (vilket CLAUDE.md är) är svag. Samma prosa i
**systemprompten** är enligt förstaparten det starkaste icke-deterministiska lagret som finns:

- Output styles: *"Output styles directly modify Claude Code's system prompt."* Steering-bloggen
  klassar dem som *"Never compacted; highest instruction-following weight."*
- Agentdefinitionens kropp: *"The body becomes the system prompt."*
- `--append-system-prompt`: *"Appends to the system prompt without removing anything."*

**Men:** att systemprompt-placering faktiskt ger högre efterlevnad än användarmeddelande är
**leverantörspåstående, inte mätt**. Faktorstudien 2605.10039 testade *instruction position*
och fann ingen detekterbar kontrast — och författarna är ärliga om att *"position and
architecture nulls are failures to reject without Bayes-factor support"*, alltså inkonklusivt
snarare än ett belagt nollresultat. Ta hypotesen, men märk den.

### Fällan: skill-nivåns verktygsrestriktioner är INTE en spärr

En detalj som kan leda fel om den missas. `SKILL.md` stöder `allowed-tools` och
`disallowed-tools`, men båda är turbaserade: *"The restriction clears when you send your next
message."* och *"It does not restrict which tools are available: every tool remains callable."*

Mekanisering som ska hålla måste alltså ligga i `permissions.deny`, en `PreToolUse`-hook, eller
agentdefinitionens `tools`/`disallowedTools` — inte i en skill.

### Gränsdragningen, som den faktiskt går

| Innehållsklass | Rätt lager | Belägg |
|---|---|---|
| "Vem får göra vad" (git, grenar, filer, kostnad) | `permissions.deny`, `PreToolUse`, agentens `tools`, `isolation: worktree`, `maxTurns` | Förstapart kategorisk + 0 %→75 % vid verktygsborttagning |
| "Vad är sant om projektet/användaren" (fällor, kommandon, konventioner) | `CLAUDE.md` / rules — kort; `/doctor` behåller *"pitfalls, rationale, and conventions that differ from tool defaults"* | Förstapartens include/exclude-tabell |
| "Hur ska agenten uppträda" (roll, disciplin, omdöme) | Systemprompt-lagret: agentdefinition, output style — **inte** CLAUDE.md-prosa | Förstapart (ej mätt) |
| "Hur vet vi att den gjorde det" | Synlig verifikation: transparens-rapport, granskare i färsk kontext, `InstructionsLoaded` | 0 %→97 % vid belönat revisionsspår |

**Motevidens jag letade efter och inte fann:** ingen källa argumenterar för att hårda regler
ska bo i prosa, och ingen mäter en nackdel med mekanisering. Den enda publicerade
reservationen är Anthropics egen om subagent-rapportskanningen — *"It isn't a substitute for
restricting what a subagent can reach"* — vilket pekar åt samma håll, inte emot.

---

## Fråga 3 — kontextbudget och progressiv disclosure

### Vad startkontexten faktiskt kostar

Anthropics interaktiva kontextfönster-simulering ger konkreta tal (illustrativa, men
förstaparts) för en 200 000-tokens session
([context-window](https://code.claude.com/docs/en/context-window)):

| Post | Tokens |
|---|--:|
| Systemprompt | 4 200 |
| Auto memory (`MEMORY.md`) | 680 |
| Miljöinfo | 280 |
| MCP-verktygsnamn (deferred) | 120 |
| Skill-beskrivningar | 450 |
| `~/.claude/CLAUDE.md` | 320 |
| Projekt-`CLAUDE.md` | 1 800 |
| **Summa start** | **≈ 7 850 (≈ 3,9 %)** |

Vår situation, uppskattad: 217 rader konstitution + 868 rader i de fyra artefakterna
(`IDENTITET.md` 312, `profile.md` 307, `code-role-discipline.md` 249, plus
`schema_reference.md` på 84 KB i det frysta Vue-repot). **Uppskattning, ej mätning:** 868
rader tät svensk markdown ≈ 60 000 tecken ≈ 15 000–18 000 tokens, alltså 7–9 % av fönstret
enbart för de fyra — utöver konstitutionen själv. Metoden är teckenräkning delat med ~3,5
tecken/token för svenska; den auktoritativa siffran hämtas med `/context`, inte härledd.

Slutsatsen står oavsett bandets exakthet: **alla fyra kan inte alltid-laddas.** Och
`@`-import ändrar ingenting åt det hållet — importerade filer laddas vid start.

### Det finns kontrollerad mätdata nu — och den är mer nyanserad än konsensus

Detta är den viktigaste uppdateringen mot det föregående passet, som konstaterade att
progressiv disclosure var "entydigt på vår sida". Två 2026-preprints har mätt saken.

**arXiv 2607.17598, *Is Progressive Disclosure All You Need for Long-Context Agents?***
(inskickad 2026-07-20, **preprint**). Första kontrollerade studien som ställer
rådokument-navigering mot Agent-Skills-progressiv-disclosure mot klassisk hybridretrieval,
över tre agent-harnesses och tre modellfamiljer på InfiniteBench. Kärnmeningen:

> *"Progressive disclosure buys context, not intelligence: it is redundant while a strong
> agent can locate the right passages itself, and decisive once the corpus grows too large to
> navigate by reading."*

Detaljer: vinsterna var stora när agentens navigering var svag, försumbara med starka
harnesses; i flerkorpus-fallet kollapsade rådokument-navigering medan **ett** nivåsteg
degraderade långsammare och gick om; **ytterligare routing-lager hjälpte aldrig och sänkte
ibland träffsäkerheten.** ([abs/2607.17598](https://arxiv.org/abs/2607.17598))

**arXiv 2606.11543, *SkillJuror*** (inskickad 2026-06-10, **preprint**). Mäter hur
skill-organisation ändrar agentens faktiska bana, med semantiskt kontrollerade varianter och
matchade multi-trial-körningar. Progressiv disclosure mot en normaliserad platt baslinje:
distinkta resurser per bana 1,18 → 3,85; effektiva upptagshändelser 1,33 → 3,92; **+17 av 410
matchade trials som klarade verifiering (+4,1 %)**.

Och den avgörande brasklappen:

> *"the benefit is task-dependent"* — den hjälper när resurserna stödjer implementation,
> verifiering eller felsökning, och **underpresterar när framgång hänger på "exact output
> conventions, numerical thresholds, or long artifact-generation pipelines."**

**Vad detta betyder för `IDENTITET.md` specifikt, sagt rakt ut:** ett beslutsfilter som ska
tillämpas vid varje bygg/riv/bevara-beslut är inte en "supporting resource" — det är närmare
"exact output conventions". Det är just den klass där SkillJuror mäter att progressiv
disclosure **underpresterar**. Att göra `IDENTITET.md` till en skill är alltså **inte** den
självklara vägen den ser ut att vara.

### Motevidensen står kvar

Faktorstudien *Instruction Adherence in Coding Agent Configuration Files* (arXiv-preprint
2605.10039, **ej peer-reviewad**) testar fyra strukturvariabler i
`CLAUDE.md`/`AGENTS.md`/Cursor-regler — filstorlek, instruktionsposition, filarkitektur,
motsägelser mellan angränsande filer:

> *"None of the four structural variables or three two-way interactions produces a detectable
> contrast after multiple-testing correction."*

Enda signifikanta effekten var inom sessionen: ~5,6 % lägre odds för efterlevnad per
genererad funktion (OR = 0,944) — och författarna noterar att fyndet *"was identified during
analysis rather than pre-specified"*, alltså post-hoc. ([abs/2605.10039](https://arxiv.org/abs/2605.10039))

**Sammanvägt, ärligt:**

- Leverantörernas storleksråd (Anthropic < 200 rader, Cursor < 500, Copilot < 2 sidor, Codex
  32 KiB) är **branschkonsensus utan publicerat kontrollerat stöd**. Den enda studie som
  testar exakt filstorlekens effekt på efterlevnad hittar ingen.
- Progressiv disclosure har däremot **fått** kontrollerat stöd 2026 — men som
  **skalningsmekanism**, inte som efterlevnadsmekanism, och med en uttalad klass där den
  skadar.
- Den robusta effekten är fortfarande **sessionslängd**. Det stöder konstitutionens
  20–25-meddelanderegel mer än det stöder någon omstuvning av filer.

---

## Fråga 4 — identitets- och profilkontext

**Deklaration först, som uppdraget kräver: precedent-rymden för det du faktiskt gör är TUNN.**
Jag hittade exakt en jämförbar precedent, tre angränsande men annorlunda, och ett öppet
ej antaget förslag. Räkningen fejkas inte.

### Vad som finns för *användarpreferens* på användar-scope (bred precedent, fyra aktörer)

| Aktör | Mekanism | Förstapartens egen beskrivning |
|---|---|---|
| Anthropic | `~/.claude/CLAUDE.md` | *"Personal preferences for all projects"*, exempel: *"Code styling preferences, personal tooling shortcuts"* |
| Anthropic | Auto memory `MEMORY.md` | *"Learnings and patterns"*; index laddas (200 rader / 25 KB), ämnesfiler on-demand |
| Cursor | User Rules | *"global preferences … that apply across all projects"*, för *"preferred communication style or coding conventions"* |
| GitHub | Personal custom instructions | *"apply to every conversation … so Copilot always responds in your preferred language, tone, and style"*; högsta prioritet av tre nivåer |
| OpenAI | `~/.codex/AGENTS.md` (+ `AGENTS.override.md`) | Global nivå, konkateneras rot-och-neråt, tak `project_doc_max_bytes` 32 KiB |

Samtliga fyra är **stil- och preferenskanaler**. Ingen av dem beskrivs som ett filter man
konsulterar när man avgör om något *bör finnas*. Det är en annan sak än vad `IDENTITET.md` gör.

### Den enda genuina precedensen: Letta/MemGPT memory blocks

Letta (efterföljaren till MemGPT-artikeln) är den enda publicerade uppsättningen jag hittade
som bär både agent-identitet och användarprofil som **förstklassig, alltid-pinnad kontext**:

- *"Memory blocks are structured sections of the agent's context window that persist across
  all interactions. They are always visible — no retrieval needed."*
- `persona`-blocket: *"details about your current persona, guiding how you behave and
  respond."*
- `human`-blocket: *"key details about the person you are conversing with, allowing for more
  personalized … conversation."*
- Varje block har *"a `limit`, which is the size limit (in characters) of the block."*
- Blocken är agent-redigerbara via inbyggda minnesverktyg, och kan sättas read-only.

([docs.letta.com — memory blocks](https://docs.letta.com/guides/agents/memory-blocks/))

**Designlärdomen som överförs — och den skär mot vår nuvarande form:** den enda riktiga
precedensen bär identitet **pinnad, hårt teckenbegränsad och löpande kurerad**. Inte som en
312-raders fil man refererar till. Formatet är själva poängen: begränsningen tvingar fram
destillat, och destillatet är det som får plats i varje beslut.

Anthropics egen auto-memory har samma form (index med hård gräns + ämnesfiler on-demand,
plus en mekanisk påminnelse när indexet närmar sig taket). Det är alltså inte en
Letta-egenhet utan ett återkommande mönster: **alltid-på-lagret är litet och styrt; djupet
ligger utanför.**

### Vad som INTE finns

- **AGENTS.md-standarden har ingen användarnivå.** Förslaget om ett globalt
  `~/.config/agents/AGENTS.md` ligger som **öppet, användarinskickat issue #91** — inte
  antaget, ingen underhållar-ställning publicerad.
  ([issue #91](https://github.com/agentsmd/agents.md/issues/91))
- **Ingen källa alls** — varken leverantör eller forskning — behandlar frågan om ett
  *värdefilter* hör hemma i agentkontext, eller om det ändrar agentens beteende. Letta
  dokumenterar mekanismen, inte effekten. Det finns ingen mätning att luta sig mot.
- Cognition/Devin har ingen publicerad position i frågan; deras publicerade ståndpunkt gäller
  multi-agent-arkitektur och är irrelevant här.

---

## Bredare frågan — instruktionsfiler eller operatörsskicklighet?

Frågan var: använder frontier-utvecklare instruktionsfiler så här alls, eller är de skickliga
**operatörer** som väljer rätt läge i stunden?

**Belägget lutar mot operatörsskicklighet.** Sex oberoende indikationer:

1. **Proportionerna i Anthropics egen best-practices-guide.** Av ~20 sektioner handlar exakt
   en om att skriva CLAUDE.md. Resten är operativa val: verifieringsslinga, plan mode,
   promptspecificitet, permission modes, `/clear`, `/rewind`, checkpoints, resume, subagenter
   för utredning, headless, parallella sessioner, fan-out, auto mode, adversariell granskning.
2. **Felmönster-listan är helt operatörsfel.** *"The kitchen sink session"*, *"Correcting over
   and over"*, *"The over-specified CLAUDE.md"*, *"The trust-then-verify gap"*, *"The infinite
   exploration"*. Alla fem är val i stunden, inte saknade regler. En av dem är uttryckligen
   att man skrivit för mycket.
3. **Guidens egen slutsats.** *"The patterns in this guide aren't set in stone … Over time,
   you'll develop intuition that no guide can capture. You'll know when to be specific and
   when to be open-ended, when to plan and when to explore, when to clear context and when to
   let it accumulate."*
4. **Uppbyggnadsordningen är minimalistisk och triggerdriven.** Du lägger till i CLAUDE.md
   först *"when Claude gets a convention or command wrong twice"*; en skill först vid tredje
   inklistringen; en hook först när *"you want something to happen every time without asking"*.
   Cursor säger samma sak: *"Start simple. Add rules only when you notice Agent making the
   same mistake repeatedly."* Codex namnger felet: *"A common mistake is overloading the
   prompt with durable rules instead of moving them into AGENTS.md or a skill."*
5. **Anthropics interna fallstudie.** CLAUDE.md nämns en gång, som något Claude *läser* vid
   onboarding. Det som beskrivs som praxis är autonoma slingor med mänsklig granskning,
   abstrakta problem lämnade till agenten, och slutsatsen *"the most successful teams treat
   Claude Code as a thought partner rather than a code generator."*
   ([how-anthropic-teams-use-claude-code](https://claude.com/blog/how-anthropic-teams-use-claude-code))
6. **Mätdatan pekar åt samma håll.** Den enda robusta effekten i faktorstudien är
   sessionslängd — ett operativt val. Och det enda som lyfte efterlevnad i Compliance
   Gap-studien var att ta bort verktyget och att belöna revisionsspår — bägge
   harness-/operatörsbeslut. **Ingen** intervention i den litteraturen bestod av att skriva
   bättre prosa.

**Men slutsatsen är inte "instruktionsfiler är värdelösa".** Samma källor säger fortfarande:
skriv en, håll den kort, och lägg i den precis det Claude inte kan härleda. Den korrekta
formuleringen är smalare och mer obekväm:

> Instruktionsfilen bär en **liten, specifik** last. Allt som konstitutionen lagt på den
> utöver den lasten gör arbete som **operativa val och mekanisering** borde göra — och gör
> det sämre.

**Konsekvensen för konstitutionen, sagt rakt ut.** 217 rader alltid-laddad konstitution plus
868 rader refererade artefakter är ungefär 5× leverantörens uttalade mål för alltid-på-lagret,
och den bärande mekanismen — prosa som säger "konsultera X" — är exakt den mekanism varje
leverantör namnger som icke-bindande. Konstitutionen är överinvesterad i det svagaste lagret.
Det gäller oavsett om de fyra filerna levereras eller inte.

Och Code:s eget erkännande i S91 — sex sekventiella research-agenter medan `/work-batch`,
ultracode, `Workflow` och plan mode aldrig användes — är en datapunkt **för** den läsningen.
Gapet var inte kunskap om en regel. Det var val av läge. Ingen mängd tillagd prosa hade
stängt det.

---

## Åtgärdsalternativen mot belägget

T100 listar fem, uttryckligen ovärderade. Här är vad belägget gör med dem. Ingen av dem är en
rekommendation i sig — värderingen är Marcus.

| # | Alternativ | Dom | Grund |
|---|---|---|---|
| 1 | Lägg `templates/` + rot-`.md` i plugin-distributionen | **Försvagas hårt** | *"A CLAUDE.md file at the plugin root is not loaded as project context."* Filen i cachen ≠ filen i sessionen. Fixar symptom, inte leverans. Har värde **bara** som förutsättning för att en skill/agent ska kunna läsa den via `${CLAUDE_PLUGIN_ROOT}` |
| 2 | `@`-importera från konstitutionen | **Fungerar tekniskt, dyrast av alla** | *"Imported files are expanded and loaded into context at launch"*, och *"doesn't reduce context"*. Alla fyra = +868 rader varje session, ~5× målvärdet. Försvarbart **endast** för ett kort destillat, inte för filerna som de står |
| 3 | Flytta reglerna till agentdefinitioner | **Stärks starkast för de tvingande delarna** | Kroppen **är** systemprompten; `tools`/`isolation`/`maxTurns` är tvingande; `skills:` förladdar deterministiskt; plugin-`settings.json` `{"agent": …}` kan aktivera den som huvudtråd. Caveat: `--agent` *"replaces the default … system prompt entirely"* — en beteendeförändring, inte ett gratis tillägg. Och `~/.claude/agents/` **finns inte** på maskinen: noll installerad bas, alltså oprövat lokalt |
| 4 | Mekanisera det mekaniserbara, behåll kunskapen i fil | **Stärks — enda alternativet med kvantitativt stöd** | 0 %→75 % vid verktygsborttagning; 0 %→97 % vid belönat revisionsspår; förstapart kategorisk om hooks/permissions. Fälla: skill-nivåns `disallowed-tools` är turbaserad och duger inte |
| 5 | Avveckla artefakter ingen läser | **Stärks för två av fyra; öppet för två** | `/doctor`-logiken behåller *"pitfalls, rationale, and conventions that differ from tool defaults"* och skär resten. `schema_reference.md` är dessutom en pekare från en global konstitution in i ett **fryst** repo — stale oavsett leveransfråga |

### Två vägar belägget pekar på som kortet inte listar

**A. `~/.claude/rules/` — den enklaste mekanismen som faktiskt levererar.** *"Personal rules
in `~/.claude/rules/` apply to every project on your machine."* Utan `paths` laddas de
ovillkorligt, *"with the same priority as `.claude/CLAUDE.md`"*, utan godkännandedialog, utan
plugin. Med `paths`-frontmatter blir de villkorliga — ett mellanläge mellan alltid-på och
aldrig. **Verifierat: katalogen finns inte alls på maskinen.** Hela detta lager är oanvänt.

**B. `SessionStart`-hook med `additionalContext`.** Kan injicera kurerad eller beräknad text
vid sessionsstart, med noll stående kostnad när den inte kör. Det är den enda mekanismen som
kan leverera *villkorat på tillstånd* (repo, gren, tid) snarare än på filväg.

### Verifierings-grinden T100 steg 3 efterfrågar finns redan

Kortets steg 3 säger "verifiera **mekaniskt** att artefakterna faktiskt når en session — som
grind eller manuell checklista". Den behöver inte byggas från noll:

1. `InstructionsLoaded`-hook loggar varje laddad `CLAUDE.md`/`rules/*.md` med orsak
   (`session_start`, `path_glob_match`, `include`, `compact`). Kan inte blockera — ren
   observabilitet, vilket är rätt form för en grind som ska *upptäcka*, inte hindra.
2. `/context` listar faktiskt laddade filer under **Memory files**.
3. `claude plugin inspect` visar plugin-komponenter och projicerad tokenkostnad.

De tre kontroller T100 dokumenterar (find i cachen, plugin-innehåll, grep efter `@`-import)
är fortfarande giltiga som engångs-forensik. Men den löpande grinden bör vara hooken.

---

## Vad jag INTE kunde belägga

Ärlighetsposten. Fem saker som saknar stöd och inte ska framställas som avgjorda:

1. **Att systemprompt-placering slår användarmeddelande-placering för efterlevnad.**
   Leverantören påstår det (*"highest instruction-following weight"*, *"never compacted"*).
   Ingen mätning finns. Faktorstudiens position-variabel var **inkonklusiv**, inte ett belagt
   nollresultat.
2. **Om ett värdefilter i agentkontext gör någon skillnad över huvud taget.** Noll studier,
   noll leverantörsuttalanden. Letta dokumenterar mekanismen; ingen mäter effekten. Detta är
   passets tunnaste punkt och den mest centrala för `IDENTITET.md`.
3. **Om en prosapekare ("se fil X") någonsin får en agent att öppna X.** Detta är exakt T100:s
   felmönster, och det är **odokumenterat hos samtliga fem leverantörer**. Ingen mäter det.
   Vår S91-observation (ett dussin beslut, filen aldrig öppnad) är därmed den enda datapunkt
   som finns — n = 1, men den enda.
4. **Var 200-radersgränsen kommer ifrån.** Ingen leverantör citerar en studie. Den enda studie
   som testar storlek finner ingen effekt, med stödjande evidens för nollhypotesen på just den
   variabeln.
5. **Om `claude plugin inspect`s tokenuppskattning täcker annat än komponenter.** Utdata
   grupperas som Skills/Agents/Hooks/MCP/LSP; om icke-komponentfiler räknas in framgår inte.

Plus en mekanisk lucka: **hur en relativ `@`-import löses från en symlänkad `CLAUDE.md`** —
mot symlänken eller mot målet — är inte dokumenterat någonstans. Absolut sökväg kringgår
frågan; annars måste den testas.

---

## Källförteckning

### Anthropic, förstapart — dokumentation (`code.claude.com/docs/en/*`)

- [How Claude remembers your project (CLAUDE.md, rules, auto memory)](https://code.claude.com/docs/en/memory)
- [Extend Claude Code (mekanism → innehållstyp, kontextkostnad)](https://code.claude.com/docs/en/features-overview)
- [Best practices for Claude Code](https://code.claude.com/docs/en/best-practices)
- [Extend Claude with skills](https://code.claude.com/docs/en/skills)
- [Create custom subagents](https://code.claude.com/docs/en/sub-agents)
- [Create plugins](https://code.claude.com/docs/en/plugins)
- [Plugins reference](https://code.claude.com/docs/en/plugins-reference)
- [Hooks reference](https://code.claude.com/docs/en/hooks)
- [Output styles](https://code.claude.com/docs/en/output-styles)
- [Explore the context window](https://code.claude.com/docs/en/context-window)

### Anthropic, förstapart — blogg

- [Steering Claude Code: when to use CLAUDE.md, skills, hooks, rules, subagents and more](https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more)
- [How Anthropic teams use Claude Code](https://claude.com/blog/how-anthropic-teams-use-claude-code)
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

### Andra leverantörer, förstapart

- [OpenAI Codex — Custom instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Cursor — Rules (rule types, User Rules, Memories)](https://cursor.com/docs/context/rules)
- [GitHub — Add personal custom instructions for Copilot](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-personal-instructions)
- [Letta — Memory blocks (core memory)](https://docs.letta.com/guides/agents/memory-blocks/)

### Forskning (peer-review-status angiven per post)

- [*Is Progressive Disclosure All You Need for Long-Context Agents?*, arXiv:2607.17598](https://arxiv.org/abs/2607.17598) — **preprint**, 2026-07-20
- [*SkillJuror: Measuring How Agent Skill Organization Changes Runtime Behavior*, arXiv:2606.11543](https://arxiv.org/abs/2606.11543) — **preprint**, 2026-06-10
- [*Instruction Adherence in Coding Agent Configuration Files: A Factorial Study of Four File-Structure Variables*, arXiv:2605.10039](https://arxiv.org/abs/2605.10039) — **preprint**
- [*The Compliance Gap: Why AI Systems Promise to Follow Process Instructions but Don't*, arXiv:2605.01771](https://arxiv.org/abs/2605.01771) — **preprint**

### Ej antaget förslag (åberopas endast som riktningsindikation, aldrig som norm)

- [AGENTS.md issue #91 — globalt användar-scope `~/.config/agents/AGENTS.md`](https://github.com/agentsmd/agents.md/issues/91) — **öppet, ej antaget**

### Internt underlag

- `tasks/threads/T100-instruktionsleveransen.md` — läst i sin helhet
- `docs/research/agent-instruktionsfiler-branschpraxis-2026-07-27.md` — läst i sin helhet

---

## Verifierat mot disk (läs-only, 2026-07-27)

Sex kontroller. Inga skrivningar, inga git-kommandon.

| Kontroll | Utfall |
|---|---|
| `~/.claude/CLAUDE.md` | **Symlänk** → `~/Repon/marcus-system/CLAUDE.md`, 217 rader. Konstitutionen ÄR användar-scope-filen |
| `@`-import i konstitutionen | Noll. Referenserna till de fyra artefakterna är ren prosa (rad 16, 18, 53, 65, 190) |
| `~/.claude/rules/` | **Finns inte.** Hela rules-lagret oanvänt |
| `~/.claude/agents/` | **Finns inte.** Noll installerad bas för agentdefinitions-vägen |
| Plugin-rot `~/Repon/marcus-system/plugins/marcus-system/` | `README.md` + `skills/`. Inget annat |
| Plugin-cache `…/marcus-system/1.20.2/` | `README.md`, `.claude-plugin/`, 17 skills. Sökning efter de tre hub-artefakterna över hela cachen: **noll träffar** |

Artefakternas storlek: `IDENTITET.md` 312 rader, `profile.md` 307, `code-role-discipline.md`
249 (summa 868). `schema_reference.md` finns på
`~/Repon/miranon-media-os/docs/schema_reference.md`, 84 KB — i det **frysta** Vue-repot.

Inga ändringar gjorda i något av dessa. Arbetsträdet oförändrat utanför denna fil.
