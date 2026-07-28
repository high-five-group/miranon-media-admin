---
owner: marcus803
updated: 2026-07-28
review_by: 2027-01-28
status: stable
---

# Är en `PreToolUse`-hook på `Agent` rätt sätt att tvinga fram worktree-isolering? (Code, 2026-07-28)

> **Proveniens:** avgränsat research-pass. Ingen produktionskod, ingen config och
> ingen workflow rörd — enda leveransen är denna fil. Varje bärande påstående bär
> antingen en käll-URL till Anthropics förstapartsdokumentation eller en mätning
> jag själv körde 2026-07-28 mot Claude Code **2.1.220** på Marcus maskin. Fem
> mätningar gjordes med riktiga `claude -p`-körningar och riktiga hookar; de
> redovisas med sina faktiska payloads. Där jag lutar mig på en hämtning som
> sammanfattats av WebFetch utan att jag kunnat verifiera ordalydelsen står det
> utskrivet. Det jag inte kunde belägga står i egen sektion — aldrig utjämnat.

## Kort svar

**Hooken fungerar. Den är ändå fel förstaval.**

Delfråga 2 — den som kunde ha fällt hela designen — faller ut till hookens
fördel: en `PreToolUse`-hook ser `Agent`-anropets `isolation`-parameter ordagrant,
och kan både blockera och **skriva om** anropet. Jag verifierade båda mot en
körande session, inte mot dokumentation.

Men samma pass visade att Anthropic redan byggt en plats för exakt vår regel, ett
lager under hooken: `isolation: worktree` i subagentens **frontmatter**. Den är
deklarativ, kräver ingen kod, ingen plugin-hook och inget underhåll — och jag
verifierade att den ger worktree utan att anroparen ber om det. En hook som
tvingar fram något ramverket redan kan deklarera är komplexitet ovanför golvet.

Ordningen jag rekommenderar är därför: **typade skrivande agenter med
`isolation` i frontmatter → `permissions.deny` som stänger vägen förbi dem →
hook först om de två mätbart läcker, och då som `updatedInput`-korrigering, aldrig
som `deny`.**

Ett fynd till, som ändrar problembilden: plattformen bär redan en egen spärr åt
det håll vi är rädda för. Jag utlöste den två gånger under detta pass utan att
försöka.

## A · Delfråga 2 — ser hooken `isolation`? (KRITISK)

Detta avgörs inte av dokumentation. Jag körde det.

### A.1 Schemat, ur den binär vi faktiskt kör

`Agent`-verktygets input-schema levereras med CLI:t som genererade
TypeScript-definitioner. Från
`/Users/marcus/.npm-global/lib/node_modules/@anthropic-ai/claude-code/sdk-tools.d.ts`,
rad 484–521 — `AgentInput`:

```ts
export interface AgentInput {
  description: string;
  prompt: string;
  subagent_type?: string;
  model?: "sonnet" | "opus" | "haiku" | "fable";
  run_in_background?: boolean;
  name?: string;
  team_name?: string;   // deprecated
  mode?: "acceptEdits" | ... ;   // deprecated
  isolation?: "worktree" | "remote";
}
```

`isolation` är alltså ett **top-level-fält** på verktygets input. Det spelar roll
längre ner: både hook-payloaden och permissions-reglerna arbetar på top-level-fält.

Hook-referensen beskriver `tool_input` som *"Arguments being passed to the tool"*
([hooks-referensen, PreToolUse](https://code.claude.com/docs/en/hooks)). Det gör
kopplingen sannolik men inte bevisad — dokumentationen räknar inte upp `Agent`
bland sina matcher-exempel, och flera GitHub-rapporter hävdar att hookar hoppas
över kring subagenter. Därför mätning.

### A.2 Mätningarna

Uppställning: en egen `settings.json` med en `PreToolUse`-hook, `matcher: "Agent"`,
som dumpar hela stdin till fil. Kördes med `claude -p` mot ett kast-repo i
scratchpad. Fem körningar, alla 2026-07-28 på 2.1.220.

|# |Fråga|Utfall|
|---|---|---|
|1|Utlöses `PreToolUse` alls för `Agent`?|**JA** — `"tool_name":"Agent"`|
|2|Syns `isolation` i `tool_input`?|**JA** — ordagrant|
|3|Saknas fältet när anroparen utelämnar det?|**JA** — helt frånvarande|
|4|Biter `permissionDecision: "deny"`?|**JA** — anropet stoppades|
|5|Kan `updatedInput` injicera `isolation`?|**JA** — subagenten hamnade i worktree|

Payloaden ur körning 1, med `isolation` satt (osaneread, endast radbruten):

```json
{"session_id":"9af77471-…","cwd":"/Users/marcus/Repon/miranon-media-admin/.claude/worktrees/agent-a85041a284ed8abfa",
 "permission_mode":"bypassPermissions","hook_event_name":"PreToolUse","tool_name":"Agent",
 "tool_input":{"description":"hook probe","prompt":"Reply with the single word hi and stop.",
 "subagent_type":"general-purpose","run_in_background":false,"isolation":"worktree"},
 "tool_use_id":"toolu_01MjRXYExMV24JvEQBsh25cv"}
```

Samma uppställning, körning 2, där modellen instruerades att **inte** sätta
`isolation`:

```json
"tool_input":{"description":"hook probe two","prompt":"Reply with the single word hi and stop.",
 "subagent_type":"general-purpose","run_in_background":false}
```

Fältet saknas helt. En hook kan alltså skilja "bad om isolering" från "bad inte om
isolering" på fältets blotta närvaro — ingen gissning på fritext behövs.

Två bieffekter värda att notera, båda synliga i payloaden ovan:

- `permission_mode` var `bypassPermissions`, och hookens `deny` bet ändå.
  Dokumentationen påstår detsamma, men här är det mätt: hookar kringgås inte av
  permissions-läget.
- Payloaden bär `cwd`, `session_id` och `permission_mode`. En hook kan därmed
  villkora på var sessionen står — relevant, eftersom en orkestrerare som redan
  arbetar i egen worktree är ett annat fall än en som står i huvudkatalogen.

### A.3 Det viktigaste fyndet: hooken kan korrigera, inte bara blockera

`PreToolUse` stödjer `updatedInput` — ett fält som byter ut verktygets argument
före körning ([hooks-referensen](https://code.claude.com/docs/en/hooks)). Jag
skrev en hook som läser payloaden, lägger till `isolation: "worktree"` och
returnerar `permissionDecision: "allow"` med det nya inputet. Sedan bad jag en
huvudsession att spawna en subagent **utan** isolering, och lät subagenten
rapportera sin `pwd`.

Svaret tillbaka:

```text
/private/tmp/…/scratchpad/hooktest/.claude/worktrees/agent-aff8dd6f67de93d24
```

Anroparen bad aldrig om worktree. Subagenten fick en ändå. Det flyttar hooken från
en trubbig spärr som avbryter arbete till en tyst korrigering som inte syns i
flödet — och det tar udden av hela falsk-positiv-argumentet, eftersom en
korrigering inte har några falska positiv i samma mening som en blockering har.

Skillnaden är inte kosmetisk. En `deny` från `PreToolUse` **avslutar turen** som
standard; `reason` visas som en varningsrad i chatten i stället för att gå
tillbaka till modellen, om man inte sätter `continueOnBlock: true` (beteendet
ändrades i 2.1.210, per [hooks-guiden](https://code.claude.com/docs/en/hooks-guide)).
En blockerande hook kostar alltså en avbruten tur per träff. En korrigerande
kostar noll.

**Svar på delfråga 2: designen faller inte. Hooken ser fältet, kan blockera, och
kan dessutom rätta anropet i tysthet.**

## B · Delfråga 1 — vad Anthropic säger att hookar är till för

Förstapartskällorna är samstämmiga och de talar för vår användning, inte emot.

Från [hooks-guiden](https://code.claude.com/docs/en/hooks-guide), inledningen:

> Hooks are user-defined shell commands that execute at specific points in Claude
> Code's lifecycle. They provide deterministic control over Claude Code's
> behavior, ensuring certain actions always happen rather than relying on the LLM
> to choose to run them. Use hooks to enforce project rules […]

Från [Extend Claude Code](https://code.claude.com/docs/en/features-overview),
fliken *Hook vs Skill*:

> **Put guardrails in hooks.** An instruction like "never edit `.env`" in
> CLAUDE.md or a skill is a request, not a guarantee. A `PreToolUse` hook that
> blocks the edit is enforcement. If a rule must hold every time, make it a hook
> rather than a prompt instruction.

Från [Best practices](https://code.claude.com/docs/en/best-practices):

> Use hooks for actions that must happen every time with zero exceptions. […]
> Unlike CLAUDE.md instructions which are advisory, hooks are deterministic and
> guarantee the action happens.

Och från Anthropics egen blogg,
[Steering Claude Code](https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more):

> When there's something that absolutely must not happen, an instruction is the
> wrong tool.

Bloggen anvisar då **hooks och permissions**, i den ordningen som ett par.

Det är svårt att hitta en mer exakt beskrivning av vår situation. Vi har en regel,
den är nedskriven, den efterlevs inte, och samma felklass har inträffat minst tre
gånger. Anthropics egen formulering — *"an instruction is the wrong tool"* — är
ordagrant vår ADR-079-empiri uttryckt av leverantören.

**Uttalade anti-mönster.** Jag hittade inget förbud mot att hooka
arbetsflödeshygien. De begränsningar som står utskrivna är andra:

- Agent-hookar (`type: "agent"`) är märkta experimentella; guiden säger uttryckligen
  *"For production workflows, prefer command hooks"*. Vår hook vore en command-hook,
  så det gäller inte oss.
- Exit-kodsemantiken är en fälla: *"Claude Code treats exit code 1 as a
  non-blocking error and proceeds with the action […] If your hook is meant to
  enforce a policy, use `exit 2`."* En policy-hook som returnerar 1 gör alltså
  ingenting alls, tyst.

En tredjepartsformulering som cirkulerar — att en hook som behöver villkorslogik
hellre borde vara en skill — hittade jag **inte** i förstapartskällorna. Jag
markerar den som obelagd och stödjer inget resonemang på den.

**Svar på delfråga 1: att tvinga fram arbetsflödesregler är ett uttalat avsett
användningsfall. Hookar är inte begränsade till formatering och notifieringar.**

## C · Delfråga 3 — rekommenderar Anthropic en annan mekanism?

Ja. Och den ligger närmare problemet än hooken gör.

### C.1 Subagent-definitionens frontmatter — den avsedda platsen

`.claude/agents/*.md` stödjer ett `isolation`-fält. Ur
[subagent-dokumentationens frontmatter-tabell](https://code.claude.com/docs/en/sub-agents):

> `isolation` — Set to `worktree` to run the subagent in a temporary git worktree,
> giving it an isolated copy of the repository branched by default from your
> default branch rather than the parent session's `HEAD`. The worktree is
> automatically cleaned up if the subagent makes no changes

Och i [worktree-dokumentationen](https://code.claude.com/docs/en/worktrees),
under rubriken *Isolate subagents with worktrees*, står vårt exakta behov som
brödtext:

> Subagents can run in their own worktrees so parallel edits don't conflict. […]
> make the isolation permanent for a custom subagent by adding `isolation:
> worktree` to its frontmatter.

Jag verifierade att fältet biter utan att anroparen ber om något. Körning 5:
en agenttyp definierad via `--agents` med `isolation: "worktree"`, anropad med
uttrycklig instruktion att **inte** sätta parametern. Subagentens `pwd`:

```text
/private/tmp/…/scratchpad/hooktest/.claude/worktrees/agent-a3deb9ec8b5ba7a1f
```

Det här är hela regeln, deklarerad på en rad, utan skript, utan jq, utan
exit-kodsemantik att få fel.

En detalj som spelar roll för plugin-vägen: frontmatter-tabellen märker
`permissionMode`, `mcpServers` och `hooks` med *"Ignored for plugin subagents"*.
`isolation` bär **ingen** sådan reservation. Jag har inte testat en
plugin-levererad agent, så jag noterar det som frånvaro av undantag, inte som
positivt bevis.

### C.2 `permissions.deny` — kan uttrycka halva regeln, inte hela

Permissions-systemet har förstklassigt stöd för precis vår parameter. Ur
[permissions-dokumentationen](https://code.claude.com/docs/en/permissions),
avsnittet *Match by input parameter*:

> Deny and ask rules can match a top-level input parameter on any tool with
> `Tool(param:value)`.

Med `Agent(isolation:worktree)` som ett av tabellens tre exempel. Att Anthropic
väljer just vår parameter som illustration säger något om hur väntat behovet är.

Men riktningen går fel väg, och en punktsats i samma avsnitt stänger dörren:

> A parameter the model omits is never matched, so `Agent(model:*)` doesn't match
> a call that leaves `model` unset.

Vi behöver träffa **frånvaron** av `isolation`. Deny-regler träffar bara närvaro.
Och allow-regler kan inte kompensera: *"allow rules continue to use each tool's
own specifier syntax"*, alltså `Agent(AgentName)` — inte parametrar. Det finns
ingen negativ matchning.

Vad permissions **kan** göra är att stänga sidodörren. `Agent(AgentName)`-regler
styr vilka agenttyper som får användas alls, och kan ligga i `deny`. Att neka
`Agent(general-purpose)` tvingar orkestreraren till våra egna typer — och de bär
`isolation` i frontmatter. Två svaga mekanismer som tillsammans blir en hel regel.

### C.3 `SubagentStart` — ser spawnen, men kan inte stoppa den

Det finns en hook-händelse som fyrar exakt när en subagent startar. Den är
värdelös här. Ur hooks-referensen:

> SubagentStart does not support blocking or modifying the subagent spawn. It is
> informational only. […] the subagent will spawn regardless of the hook's output
> or exit code. Exit code 2 and other non-zero exit codes do not block the
> subagent.

Den duger till loggning och mätning, vilket är användbart i ett första steg, men
inte till tvång.

### C.4 Mekanismkartan

|Mekanism|Vad den är avsedd för (förstapartskälla)|Kan uttrycka vår regel?|
|---|---|---|
|CLAUDE.md|*"always do X" rules*, alltid-på kontext|Nej — rådgivande. Vår empiri: ~0 %|
|`.claude/rules/`|Path-scopade konventioner|Nej — samma klass som CLAUDE.md|
|Skills|Procedurella arbetsflöden, on-demand|Nej — modellen väljer att ladda dem|
|Output styles|*"Significant role changes"*|Nej — fel verktygsklass|
|**Agent-frontmatter**|Permanent isolering per agenttyp|**Ja, deklarativt. Verifierat**|
|`permissions.deny`|Neka verktyg/parameter/agenttyp|Halvt — träffar närvaro, inte frånvaro|
|`SubagentStart`-hook|Informationell|Nej — kan inte blockera|
|**`PreToolUse`-hook**|*"Put guardrails in hooks"*|**Ja, både blockera och rätta. Verifierat**|

**Svar på delfråga 3: ja — agent-definitionens frontmatter är den avsedda platsen
för en regel av vår typ. Hooken är den avsedda platsen för det frontmatter inte
kan täcka.**

## D · Delfråga 4 — vad gör branschen?

Här måste precedent-rymden deklareras öppet i stället för räknas upp.

**Jag hittade noll publicerade exempel på en hook som tvingar fram
worktree-isolering.** Jag sökte på hook-konfigurationer mot `Task`/`Agent`,
på publicerade `.claude/settings.json`-uppsättningar och på 2026-års
subagent-playbooks. Träffarna på "hook + subagent" handlar genomgående om något
annat: att blockera destruktiva Bash-kommandon, att linta efter edits, eller om
buggrapporter om att hookar **inte** fyrar kring subagenter. Frånvaron är ett
resultat, men den är frånvaro av bevis — inte bevis på att ingen gör det.

Det som däremot har tydlig precedent är frontmatter-vägen:

- Claude Codes egen skapare Boris Cherny beskriver mönstret publikt i en
  [Threads-post](https://www.threads.com/@boris_cherny/post/DVAAruogVK4/custom-agents-support-git-worktrees-you-can-also-make-subagents-always-run-in):
  *"custom agents support git worktrees […] just add `isolation: worktree` to your
  agent frontmatter"*. Nära förstapartskälla, men socialt medium — jag citerar
  den som stöd, inte som auktoritet.
- Flera 2026-playbooks landar i samma råd, formulerat som default snarare än
  undantag: använd `isolation: worktree` på varje kodskrivande subagent. Se
  [Developers Digest](https://www.developersdigest.tech/blog/git-worktrees-claude-code-parallel-agents-guide)
  och [Totalums subagent-playbook](https://www.totalum.app/blog/claude-code-subagents-totalum).
  Tredjeparts, ovaliderade, men samstämmiga.

Det finns också precedent **i vårt eget repo**: `.claude/settings.json` bär redan
en `PreToolUse`-hook på `Bash` — CI-vakts-grinden från S76, som nekar `gh run
watch` i förgrunden med en `permissionDecision: "deny"`. Formen vi överväger är
alltså inte ny här; den är en andra instans av ett mönster vi redan kör.

**Svar på delfråga 4: precedenten för hook-vägen är tunn till obefintlig.
Precedenten för frontmatter-vägen är tydlig och inkluderar Claude Codes egen
skapare.**

## E · Delfråga 5 — motargumenten

### E.1 Trubbighet: hooken kan inte se skillnad på läsare och skrivare

Detta är det starkaste argumentet mot en `deny`-variant. De fält hooken har att gå
på är `subagent_type`, `description` och `prompt`. De två sista är modellskriven
fritext — att klassa skrivande mot läsande på dem är gissning, och en grind som
gissar fel blir avstängd.

`subagent_type` är däremot en tillförlitlig diskriminator — men bara om
agenttyperna är våra egna och namngivna. Och har vi väl namngivna typer, ligger
`isolation` redan i deras frontmatter. Argumentet blir cirkulärt på ett sätt som
avgör frågan: **hookens precision förutsätter exakt den struktur som gör hooken
onödig.**

`updatedInput`-varianten undkommer detta delvis. Att tvinga en läsande agent in i
en worktree är inte fel, bara onödigt — den kostar disk och en kall katalog, men
avbryter inget. Detta pass är självt beviset: jag är en läsande agent som fick en
worktree, och den enda kostnaden var en `node_modules`-symlink.

### E.2 Kostnaden för en worktree är inte de 200–500 millisekunderna

Mätt på min egen worktree i detta repo, 2026-07-28:

|Post|Värde|
|---|---|
|Diskstorlek|**39 MB**|
|`node_modules`|**Saknas**|
|`.env.local`|**Saknas**|

De 39 megabyten är oväsentliga. Det som kostar är att en färsk worktree är en
tom utvecklingsmiljö: `npm run typecheck`, `npm run build` och `npm run test:api`
fungerar inte förrän beroenden finns. Dokumentationen säger det rakt ut — *"A
worktree is a fresh checkout, so initialize your development environment there"*
— och erbjuder `.worktreeinclude` för gitignorerade filer, men bara för filer,
inte för `npm ci`. Vi har ingen `.worktreeinclude` i repot idag.

Det är en verklig kostnad per skrivande agent, i minuter, inte millisekunder. Den
går att bära (symlink eller `npm ci`), men den ska räknas med och den ska
mekaniseras samtidigt som isoleringen — annars byter vi en felklass mot en annan.

### E.3 Bas-grenen är en fälla, och den slog till under detta pass

Standardvärdet för `worktree.baseRef` är `"fresh"`: worktrees grenas från repots
**default-gren**, inte från förälderns `HEAD`. Dokumentationen anvisar `"head"`
uttryckligen *"when isolating subagents that need to operate on in-progress
work"*.

Mätt live, i denna session:

```text
huvudkatalogen                      9cff98f [main]
min worktree (agent-a85041a28…)     fc6fb38 [worktree-agent-a85041a284ed8abfa]
```

Min worktree står **bakom** `origin/main`. Ett påtvingat isolerings-beslut hade
alltså, utan `worktree.baseRef: "head"`, tyst placerat en skrivande agent på en
annan — och i detta fall äldre — bas än den orkestreraren står på. För arbete som
bygger vidare på pågående grenarbete är det en ny felklass, inte en åtgärdad.

### E.4 Kända buggar i själva isoleringen

Två rapporter är direkt relevanta, båda stängda:

- [#51596](https://github.com/anthropics/claude-code/issues/51596) — grennamnet
  härleds ur ett 8-teckens prefix av `agentId`. Vid prefixkollision **återanvänds
  en gammal worktree tyst**, inklusive kvarvarande ändringar och stash. Tyst
  datakontaminering, alltså precis den klass vi försöker undvika.
- [#55708](https://github.com/anthropics/claude-code/issues/55708) — isoleringen
  var filsystemsnivå: en subagent som körde `git switch -c` kunde flytta
  **förälderrepots** `HEAD`. Stängd som duplikat.

Slutsatsen är inte att isolering är dålig, utan att den inte är magi. Den ska
införas med öppna ögon, och den ska mätas efteråt.

### E.5 Hookar och subagenter — en täckningslucka

Flera rapporter hävdar att hookar inte fyrar för verktygsanrop som görs **av**
subagenter: [#34692](https://github.com/anthropics/claude-code/issues/34692)
(stängd som *not planned*, rapporterad mot 2.1.76) och
[#42385](https://github.com/anthropics/claude-code/issues/42385). Det påverkar
inte vårt huvudfall — jag mätte att spawnen från en huvudsession fyrar — men det
gör det troligt att en **nästlad** spawn (subagent som själv spawnar) inte täcks.
Jag har inte testat det på 2.1.220. Se § "Vad jag inte kunde belägga".

### E.6 Risken att grinden stängs av

Reell, och den ska vägas mot att vi redan bär en `PreToolUse`-hook på `Bash`. Två
grindar är fortfarande få; fem är en tröskel. En `deny`-variant som avbryter turen
vid varje missad isolering skulle träffa ofta i början — och en grind man måste gå
runt varje dag är en grind man till slut tar bort. En `updatedInput`-variant har
inte den egenskapen: den syns aldrig.

### E.7 Underhåll och beroende av intern form

`tool_input`-formen för `Agent` är inget publicerat stabilt kontrakt — den
levereras som genererade typer med CLI:t och kan ändras vid en version-bump. En
hook som läser `isolation` bryts tyst om fältet döps om. Frontmatter-fältet är
dokumenterat och därmed en säkrare yta att bygga på. Det är ett argument om
hållbarhet, inte om funktion.

## F · Delfråga 6 — det enklare svaret

Ja, och det finns i tre lager.

### F.1 Plattformen bär redan spärren åt vårt håll

Det här är passets näst viktigaste fynd. Sedan 2.1.203, utvidgat i 2.1.210 och
2.1.216, kontrollerar Claude Code aktivt att en worktree-isolerad subagent inte
skriver in i huvudkatalogen. Ur
[subagent-dokumentationen](https://code.claude.com/docs/en/sub-agents):

> For Bash commands, Claude Code also checks the command itself: a command that
> redirects git into the main checkout fails with an error, whether it uses
> `git -C`, `--git-dir`, a `GIT_DIR` or `GIT_WORK_TREE` variable, or a `cd` into
> the main checkout first. A command too complex to check also fails […]

Jag utlöste den två gånger under detta pass utan att försöka. Vid ett `git -C`
mot huvudkatalogen svarade harnesset:

> This agent is isolated in the worktree […] but this command redirects git to the
> shared checkout via `-C`. Refusing to run it — a worktree-isolated agent's git
> operations must target its own worktree.

Det betyder att den del av problemet som handlar om att en isolerad agent smittar
huvudkatalogen redan är löst av leverantören, i den version vi kör. Vi behöver
inte bygga den. Det som återstår är enbart att få `isolation` **påslagen**.

### F.2 Regeln om orkestreraren är mindre än regeln om subagenten

Vår faktiska felkedja är: orkestreraren växlade gren i huvudkatalogen medan en
icke-isolerad subagent hade okommitterat arbete där. Git bär okommitterade
ändringar med sig över en grenväxling — det är dokumenterat git-beteende, inte en
Claude Code-egenhet.

Det ger ett smalare mål: **orkestreraren växlar inte gren i huvudkatalogen medan
agenter arbetar.** Den regeln är mekaniserbar med en `PreToolUse`-hook på `Bash`
som nekar `git switch`/`git checkout` mot huvudkatalogen — samma form, samma fil
och samma verktyg som CI-vakts-grinden vi redan har. Ingen plugin-bump, ingen
reinstall, ett verktyg som redan är hookat.

Notera att `Bash(git switch:*)` och `Bash(git branch:*)` ligger i repots
`permissions.allow` idag. En sådan hook skulle alltså kringgå en explicit
tillåtelse — vilket den får, eftersom hookar körs oberoende av permissions-läget
(mätt i § A.2).

Regeln är dessutom snävare på rätt sätt: den träffar en operation orkestreraren
gör sällan och medvetet, inte varje spawn.

### F.3 Merge-grinden gör redan halva jobbet

Sedan 2026-07-23 landar allt via gren + PR (ADR-076). Ju mindre orkestreraren
växlar gren i huvudkatalogen över huvud taget, desto mindre finns kvar att
mekanisera. Det är inte en spärr, men det krymper ytan.

## Dom

**Bygg inte hooken nu. Bygg agent-typerna.**

Motiveringen är inte att hooken inte fungerar — jag bevisade att den gör det, i
båda varianterna. Motiveringen är att den löser ett problem som ramverket redan
har en deklarativ plats för, och att den binder oss till ett ogaranterat internt
format för att göra det.

Stegordning, med mätpunkt mellan varje steg:

1. **Definiera skrivande agenttyper med `isolation: worktree` i frontmatter.**
   Börja i repots `.claude/agents/` — katalogen finns inte idag, så detta är rent
   tillägg och kräver **ingen** plugin-bump och ingen reinstall. Verifierat att
   fältet biter (§ C.1). Lös samtidigt `node_modules`-frågan, annars byter vi
   felklass (§ E.2), och besluta om `worktree.baseRef` (§ E.3).
2. **Mät om det räcker.** Lägg en `SubagentStart`- eller icke-blockerande
   `PreToolUse`-hook som bara **loggar** `subagent_type` och närvaron av
   `isolation`. Noll risk, noll friktion, och efter en vecka har vi siffror i
   stället för åsikter om hur ofta orkestreraren går förbi typerna.
3. **Stäng sidodörren om mätningen visar läckage.** `permissions.deny` med
   `Agent(general-purpose)` tvingar fram våra typer. Väg mot att rena
   läs-agenter då också måste typas.
4. **Hooken sist, och som korrigering.** Om steg 1–3 mätbart läcker: en
   `PreToolUse`-hook på `Agent` som injicerar `isolation` via `updatedInput` —
   aldrig `deny`. Först då är plugin-bumpen motiverad, och först då vet vi vad
   den ska täcka.

Steg 1 och 2 kostar tillsammans mindre än den plugin-bump frågan ursprungligen
gällde, och de producerar det underlag som avgör om steg 4 behövs alls.

## Vad jag inte kunde belägga

- **Nästlade spawns.** Om `PreToolUse` fyrar när en *subagent* anropar `Agent`
  har jag inte testat. Rapporterna (#34692, #42385) gäller subagenters
  verktygsanrop generellt och är stängda mot äldre versioner. Vårt huvudfall —
  huvudsession som spawnar — är mätt och fungerar.
- **Precedens mellan anropsparameter och frontmatter.** Dokumentationen anger
  upplösningsordning för `model`, men **inte** för `isolation`. Ur det levererade
  schemat följer att ett anrop inte kan uttrycka "ingen isolering" (enum saknar
  `none`), vilket gör frontmatter till ett golv — men det är slutledning från
  schemat, inte en mätning. Om ett anrops `isolation: "remote"` slår en
  frontmatter-satt `worktree` är oprövat.
- **Plugin-levererade agenters `isolation`.** Frontmatter-tabellen märker
  `permissionMode`, `mcpServers` och `hooks` som ignorerade för plugin-subagenter;
  `isolation` bär ingen sådan märkning. Frånvaro av undantag, inte bevisad
  funktion. Måste testas innan regeln flyttas till pluginet.
- **`updatedInput`-semantiken vid partiell ersättning.** Referensens tabell och
  dess brödtext motsäger varandra: tabellen säger *"include only the fields to
  override"*, brödtexten säger att hela `tool_input` ersätts och visar ett exempel
  där ett utelämnat fält går förlorat. Min hook slog ihop hela objektet och
  undvek frågan. Behandla den som helersättning tills annat är mätt.
- **Ordalydelsen i dokumentationen.** WebFetch renderar sidor genom en mindre
  modell. Citaten ovan är återgivna som de kom tillbaka; för varje bärande
  påstående har jag därför mätt beteendet i stället för att luta mig på citatet.
- **Tidskostnaden för att skapa en worktree i detta repo.** Ej mätt — jag kunde
  inte skapa en worktree inifrån en worktree-isolerad agent utan att utlösa
  git-spärren (§ F.1). Endast disk (39 MB) och de saknade miljöfilerna är mätta.
- **Publicerad hook-precedent.** Jag hittade ingen. Det är frånvaro av bevis och
  rapporteras som sådan.

## Rekommendation

Gå på steg 1 och 2 i domen ovan: typade skrivande agenter med `isolation` i
frontmatter, plus en icke-blockerande loggande hook som mäter efterlevnaden. Låt
mätningen avgöra om plugin-bumpen behövs. Om den behövs — bygg hooken som
`updatedInput`-korrigering, inte som `deny`, och ge den `continueOnBlock: true`
om en `deny`-gren ändå införs.

Två följdfrågor bör landa i tråd-registret snarare än här, eftersom de blockerar
inget just nu men avgör om isoleringen blir hel:

- `worktree.baseRef` — `"fresh"` eller `"head"`? Standardvärdet är fel för agenter
  som bygger vidare på pågående grenarbete (§ E.3).
- `node_modules` i agent-worktrees — symlink, `.worktreeinclude` eller `npm ci`
  per agent? Utan svar blir varje isolerad byggagent oförmögen att köra repots
  Definition of Done (§ E.2).
