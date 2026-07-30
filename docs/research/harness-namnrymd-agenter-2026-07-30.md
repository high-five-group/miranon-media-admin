---
owner: marcus803
updated: 2026-07-30
review_by: 2027-01-30
status: draft
---

# Äger vi namnrymden för agenters temporärfiler? (Code, 2026-07-30)

> **Proveniens:** avgränsat research-pass, 2026-07-30. Beställt för att pröva ett
> designbeslut som redan landat i slutsatsen *"bygg inte alls"* — en slutsats som
> vilar på ett overifierat antagande om att scratchpad-sökvägen är harnessets och
> inte kan konfigureras. Ingen kod, inget kort, ingen ADR rörd — enda leveransen
> är denna fil.
>
> Denna fil skrevs som **skelett och pushades före första källäsningen**. Skälet
> är empiriskt: tre tidigare pass i samma session dog på serverfel och förlorade
> allt arbete eftersom inget landat på disk. Varje stängd delfråga pushades.
>
> Allt som står som mätning kördes 2026-07-30 mot **Claude Code 2.1.220** på
> Marcus maskin (`claude --version`). Där jag lutar mig på en sida hämtad via
> WebFetch har jag i de bärande fallen greppat ut ordalydelsen ur den hämtade
> texten och citerar den ordagrant med radnummer. Det jag inte kunde belägga står
> i egen sektion — aldrig utjämnat.

## Frågan, ordagrant

> Äger vi — som repo och som orkestrerare — namnrymden för agenters
> temporärfiler, och vilka skydd mot samtidig överskrivning tillhandahåller
> Claude Code-harnesset faktiskt?

## Kort svar

**Ja, vi äger namnrymden — men inte katalogen.** Scratchpad-*katalogen* är
harnessets och kan inte konfigureras; påstående 5 håller bokstavligt efter en
uttömmande genomgång av settings-referensen, miljövariabel-listan, CLI-referensen
och subagent-frontmatterns fältuppsättning. **Men slutsatsen som byggdes på det
antagandet faller.** Vi äger varje *filnamn* i katalogen, och harnesset
tillhandahåller fyra lager att grinda dem med — varav två är starkare än vi trott.

Två mätningar vänder bilden. För det första: read-before-write-spärren **är**
dokumenterad, och den är **per agent-kontext**, inte per session — jag nekades
skriva till en fil som min egen subagent just läst och skrivit. Den är alltså ett
reellt skydd mot att agent B tyst skriver över agent A:s `Write`. För det andra:
Bash-omdirigering **kan** grindas, och inte bara syntaktiskt — `sandbox.filesystem.denyWrite`
hävdas på OS-nivå och gäller varje barnprocess, alltså även `python -c`, `tee`
och `sed -i` som en hook aldrig ser.

Delfråga 2 gav dessutom den strukturella förklaringen till att sökvägen delas, och
den är inte en bugg: subagenter **kör i samma process** som föräldersessionen och
har därför per konstruktion samma sessions-temp-katalog.

## Våra fem påståenden — dom per rad

| # | Påstående (vår formulering) | Dom | Grund |
|---|---|---|---|
| 1 | Subagenter ärver sin förälders scratchpad-katalog | **HÅLLER** — och är nu förklarad, inte bara observerad | Mätt igen idag: min subagent rapporterade ordagrant samma sökväg som min egen. Förklaringen är dokumenterad: *"Subagents run in the same process as the parent session"* ([sandboxing.md](https://code.claude.com/docs/en/sandboxing.md) § Scope) |
| 2 | Katalogerna är en per session, inte en per agent | **HÅLLER** för scratchpad — men "session" är inte entydigt | Mätt: 21 UUID-kataloger, ingen per-agent-katalog. Avvikelse: `scratchpad/` och `tasks/` pekade på **olika** UUID i samma agent (se § Vad jag inte kunde belägga) |
| 3 | `Write` har en read-before-write-spärr | **HÅLLER, och är dokumenterad** — men vår antagna räckvidd var fel: spärren är **per agent-kontext**, inte global | [tools-reference.md](https://code.claude.com/docs/en/tools-reference.md) rad 440, ordagrant nedan. Räckvidden mätt av mig — se delfråga 3 |
| 4 | Bash-omdirigering har ingen motsvarande spärr | **HÅLLER** för read-before-write — men **FALLER** i sin bärande form ("går inte att grinda") | Mätt: exit 0, ingen spärr. Men `sandbox.filesystem.denyWrite` grindar det på OS-nivå ([sandboxing.md](https://code.claude.com/docs/en/sandboxing.md) § Filesystem isolation) |
| 5 | Vi kan inte konfigurera scratchpad-sökvägen | **HÅLLER bokstavligt** — men den *slutsats* vi drog ur det faller | Uttömmande genomgång av settings, env-vars, CLI, frontmatter (delfråga 1). Namnrymden ägs ändå av oss (delfråga 6) |

Raden som avgör beslutet är **3**, inte 5. Påstående 5 höll — men det var aldrig
det som bar slutsatsen.

## Delfråga 1 — kan scratchpad-sökvägen sättas eller påverkas?

**Nej, inte direkt.** Genomgången täckte fem ytor och kom upp tom på alla:

- **`settings.json`, alla scope** (user, project, local, managed): ingen nyckel för
  scratchpad- eller temporärkatalog. Närmaste träff är `autoMemoryDirectory`, som
  styr auto-memory och inte temp-filer.
  ([settings.md](https://code.claude.com/docs/en/settings.md))
- **Miljövariabler:** hela den dokumenterade listan genomgången. Ingen
  `CLAUDE_SCRATCHPAD_DIR` eller motsvarighet.
  ([env-vars.md](https://code.claude.com/docs/en/env-vars.md))
- **CLI-flaggor:** `--add-dir` och `--cwd` finns och påverkar arbetskatalog och
  åtkomst, men ingen flagga rör scratchpad.
  ([cli-reference.md](https://code.claude.com/docs/en/cli-reference.md))
- **Subagent-frontmatter:** den fullständiga fältuppsättningen är ordagrant
  `description`, `prompt`, `tools`, `disallowedTools`, `model`, `permissionMode`,
  `mcpServers`, `hooks`, `maxTurns`, `skills`, `initialPrompt`, `memory`,
  `effort`, `background`, `isolation` och `color`
  ([sub-agents.md](https://code.claude.com/docs/en/sub-agents.md) rad 222).
  **Inget fält rör kataloger eller temp-sökvägar.**
- **`CLAUDE.md` och plugin-mekanismer:** inget dokumenterat stöd hittades.

**Mätt:** `TMPDIR` på maskinen är den vanliga macOS-sökvägen under
`/var/folders/.../T/` — alltså en *annan* katalog än scratchpad. Att sätta
`TMPDIR` flyttar därför inte scratchpad.

**En indirekt påverkan finns dock, och den är dokumenterad.** Under sandbox-läge
gäller: *"Claude Code sets `$TMPDIR` to this directory for sandboxed commands"*,
där "this directory" är sessionens temp-katalog
([sandboxing.md](https://code.claude.com/docs/en/sandboxing.md)). Harnesset styr
alltså `$TMPDIR` för sandboxade kommandon — men mot sin egen sessions-temp-katalog,
inte mot en vi väljer. Det ger oss ingen omdirigering, men det visar att
temp-sökvägen är en storhet harnesset aktivt hanterar snarare än råkar ärva.

## Delfråga 2 — vad ärver en subagent från sin förälder?

Detta är passets mest värdefulla delfråga, eftersom den förklarar *varför*
sökvägen delas — och förklaringen gör beteendet förutsägbart i stället för
slumpmässigt.

**Den avgörande meningen** står inte i subagent-dokumentationen utan i
sandbox-dokumentationens § Scope
([sandboxing.md](https://code.claude.com/docs/en/sandboxing.md)):

> *"Subagents run in the same process as the parent session and use the same
> sandbox configuration. Bash commands inside a subagent are sandboxed when
> sandboxing is enabled in the parent session."*

En subagent är alltså inte en egen process. Då kan den heller inte ha en egen
sessions-temp-katalog — den delade scratchpaden är en **konsekvens av
processmodellen**, inte en bieffekt någon glömt.

Övrigt kartlagt, per [sub-agents.md](https://code.claude.com/docs/en/sub-agents.md):

| Aspekt | Delas eller isoleras | Källa |
|---|---|---|
| Arbetskatalog | Delas som utgångspunkt: *"A subagent starts in the main conversation's current working directory"* | rad 263 |
| Kontextfönster | **Isolerat:** *"Each subagent runs in its own context window"* | sidans inledning |
| Systemprompt | Isolerad: subagenten får *"only this system prompt plus basic environment details like the working directory, not the full Claude Code system prompt"* | rad 259 |
| Verktyg | Ärvs men filtreras alltid i två steg — arvet är aldrig obegränsat | § Available tools |
| Process, sandbox-config | **Delas** | sandboxing.md § Scope |
| Temp-/scratchpad-katalog | **Dokumentationen är tyst.** Delningen följer av processmodellen men sägs aldrig ut | — |
| Hooks | Delas: *"Hooks from settings files, managed policy settings, and plugins all apply inside subagents, so a `PreToolUse` hook in `settings.json` also runs before every tool a subagent uses"* | rad 613 |

**Vad `isolation: worktree` uttryckligen isolerar** — och därmed vad den inte gör
— står i fältdokumentationen (rad 290):

> *"Set to `worktree` to run the subagent in a temporary git worktree, giving it
> an isolated copy of the repository branched by default from your default branch
> rather than the parent session's `HEAD`. The worktree is automatically cleaned
> up if the subagent makes no changes."*

Räckvidden är alltså **repository-kopian**. Den säger ingenting om temp-kataloger,
och kan strukturellt inte isolera dem, eftersom processen är delad. Vår mätning
stämmer med dokumentationen: jag kör själv med `isolation: worktree` och fick
ändå förälderns scratchpad.

**Ett oväntat fynd inom samma delfråga.** `isolation: worktree` bär en
Bash-grind som jag utlöste skarpt två gånger under passet, utan att leta efter
den. Den är dokumenterad med versionsmarkering (rad 269):

> *"For Bash commands, Claude Code also checks the command itself: a command that
> redirects git into the main checkout fails with an error, whether it uses
> `git -C`, `--git-dir`, a `GIT_DIR` or `GIT_WORK_TREE` variable, or a `cd` into
> the main checkout first. A command too complex to check also fails, with an
> error telling Claude to split it into separate plain commands. This check
> applies to Bash only."*

Mitt utfall ordagrant, på en `for`-loop över temp-katalogerna:

```text
This agent is isolated in the worktree …, but this command is too complex to
verify that it stays inside the worktree; break it into plain, separate commands.
```

Detta är **precedent från leverantören själv** för exakt det mönster delfråga 4
frågar efter: en syntaktisk Bash-inspektion som skyddar en sökvägs-namnrymd, och
som **failar stängt** när kommandot inte går att analysera. Anthropic bygger
alltså själva den grind vi övervägde — vilket flyttar den från "egen uppfinning"
till "etablerad form".

## Delfråga 3 — vilka skydd mot filöverskrivning dokumenterar Anthropic?

**Spärren är dokumenterad.** Ordagrant, från
[tools-reference.md](https://code.claude.com/docs/en/tools-reference.md) rad 440:

> *"If the target path already exists, Claude must have read that file at least
> once in the current conversation before overwriting it. A Write to an unread
> existing file fails with an error. This constraint doesn't apply to new files."*

Och rad 442, som är viktig för delfråga 4:

> *"Viewing the file with Bash also satisfies this requirement under the same
> rules described in Edit tool behavior."*

**Räckvidd per verktyg:**

- **`Write`:** gäller, för befintliga filer. Inte för nya filer.
- **`Edit`:** gäller, men mjukare (rad 173): *"Read-before-edit: Claude reads the
  file in the current conversation before editing it… Claude Opus 4.6, Claude
  Haiku 4.5, and older models always require the read. Newer models can edit an
  unread file when reading it wouldn't need a permission prompt and the Read tool
  is available."* Spärren är alltså **modellberoende** för `Edit` — värt att veta
  innan man förlitar sig på den.
- **`NotebookEdit`:** har eget avsnitt som beskriver cell-riktad redigering; jag
  hittade **ingen** uttrycklig read-before-write-mening för det verktyget.
  Obelagt, inte motbevisat.

### Den mätning som fällde vår antagna räckvidd

Frågan "per agent eller global?" avgör beslutet, och dokumentationens formulering
*"in the current conversation"* är tvetydig för en subagent. Jag mätte i stället.

Uppställningen: jag skapade `kollisionstest.txt` via Bash utan att läsa den.
En subagent fick i uppdrag att (a) `Read` filen, (b) `Write` till den, (c) skriva
över den via Bash-omdirigering. Därefter försökte **jag** — som aldrig läst
filen — göra `Write` till samma sökväg.

| Steg | Aktör | Operation | Utfall |
|---|---|---|---|
| 1 | jag | Bash `printf > fil` (ny fil) | OK, exit 0 |
| 2 | subagent | `Read` | OK, läste `A-original` |
| 3 | subagent | `Write` | **Lyckades** — hade läst filen |
| 4 | subagent | Bash `printf > fil` | **Lyckades**, exit 0, ingen prompt |
| 5 | **jag** | `Write` (aldrig läst filen) | **NEKAD:** `File has not been read yet. Read it first before writing to it.` |

Steg 5 är beviset. Min subagent hade läst *och* skrivit filen i samma session,
i samma process — och jag nekades ändå. **Spärren är per agent-kontext, inte per
session.** Det stämmer med att varje subagent har eget kontextfönster: "the
current conversation" betyder agentens egen konversation.

**Vad det betyder för kollisionsrisken:** spärren är ett *reellt* skydd mot tyst
cross-agent-överskrivning via `Write`. Agent B kan inte skriva över agent A:s
befintliga fil utan att först läsa den. Den tysta överskrivning vi mätte tidigare
kan därför inte ha gått via `Write` på en befintlig fil — den gick via Bash
(steg 4 ovan), eller via en agent som skapade filen först (nya filer är undantagna).

**En bieffekt subagenten rapporterade, värd att registrera:** efter
Bash-skrivningen fick den en automatisk systemnotis om att filen ändrats externt,
med det nya innehållet. Harnesset **upptäcker** alltså extern ändring och synkar
fil-tillståndet — men *efteråt*, som notifiering, inte som spärr. Jag hittade
ingen dokumentation för detta beteende; det står som obelagt.

## Delfråga 4 — kan hooks grinda Bash-omdirigering?

**Ja — men hooks är fel förstaval, och Anthropic säger det själv.**

**Hook-API:ts räckvidd räcker till uppgiften.** `PreToolUse`-input bär hela
kommandostängen för `Bash` och hela `file_path` för `Write`/`Edit`, och — direkt
relevant för vårt fall — **`agent_id` och `agent_type`**
([hooks.md](https://code.claude.com/docs/en/hooks.md)):

> *"When running with `--agent` or inside a subagent, two additional fields are
> included"* — `agent_id` är *"Present only when the hook fires inside a subagent
> call"*.

Och hooken kan **skriva om** anropet, inte bara blockera:

> *"`updatedInput` directly under `hookSpecificOutput` replaces a tool's arguments
> before it runs."*

`permissionDecision` tar `allow`, `deny`, `ask` eller `defer`. En hook kan alltså
i princip läsa `agent_id` och skriva om en icke-namnrymdad sökväg till en
namnrymdad. Att hooks körs inuti subagenter är uttryckligen dokumenterat
([sub-agents.md](https://code.claude.com/docs/en/sub-agents.md) rad 613).

**Men begränsningarna är allvarliga, och två av dem är diskvalificerande.**

1. **Hooken är en syntaktisk kommandoinspektion, inte en filsystemgrind.** Detta
   sägs rakt ut för deny-reglernas del
   ([permissions.md](https://code.claude.com/docs/en/permissions.md) rad 272):

   > *"Read and Edit deny rules apply to Claude's built-in file tools and to file
   > commands Claude Code recognizes in Bash, such as `cat`, `head`, `tail`, and
   > `sed`. They don't apply to arbitrary subprocesses that read or write files
   > indirectly, like a Python or Node script that opens files itself. For
   > OS-level enforcement that blocks all processes from accessing a path, enable
   > the sandbox."*

   Kringgåendena är därmed triviala och många: `bash script.sh`, `python -c`,
   `tee`, `sed -i`, heredoc, `mv`, subshell, base64-avkodning.

2. **Anthropic avråder uttryckligen från hooks som hård grind**
   ([hooks.md](https://code.claude.com/docs/en/hooks.md)):

   > *"Because the `if` filter is best-effort, use the permission system rather
   > than a hook to enforce a hard allow or deny."*

3. **Exit-kods-fällan.** *"For most hook events, only exit code 2 blocks the
   action. Claude Code treats exit code 1 as a non-blocking error and proceeds
   with the action… If your hook is meant to enforce a policy, use `exit 2`."*
   En hook som failar på konventionellt Unix-vis grindar alltså ingenting.

**Den mekanism som faktiskt grindar Bash-omdirigering är sandboxen, inte hooken.**
`sandbox.filesystem.denyWrite` (och `allowWrite`) hävdas på OS-nivå
([sandboxing.md](https://code.claude.com/docs/en/sandboxing.md)):

> *"These paths are enforced at the OS level, so all commands running inside the
> sandbox, including their child processes, respect them."*

Det täcker precis de kringgåenden hooken är blind för. Sista pusselbiten: sandboxen
gäller subagenter, eftersom de kör i samma process och *"use the same sandbox
configuration"*.

Ordningen som följer av delfrågan är alltså: **`permissions.deny` och
`sandbox.filesystem.denyWrite` före hook** — hook först som ergonomiskt hjälpmedel
(`updatedInput`-korrigering med `agent_id`), aldrig som säkerhetsgrind.

## Delfråga 5 — rekommenderar Anthropic något mönster för parallella agenters temporärfiler?

(ej besvarad än — pass pågår)

## Delfråga 6 — om påstående 5 faller, vad blir den ordentliga formen?

Påstående 5 **föll inte**: sökvägen kan inte sättas. Men frågan bakom det —
*äger vi namnrymden?* — besvaras med ja, och formen blir därför en annan än
"sätt sökvägen per agent".

**Den bärande insikten: katalogen är harnessets, filnamnen är våra.** Harnesset
namnrymdar redan sin egen agent-output per agent — jag mätte
`…/<uuid>/tasks/<agentId>.output`, en fil per agent med agent-ID som filnamn, i
samma delade katalog. Det är exakt mönstret, och harnesset använder det självt:
**delad katalog, agent-ID i filnamnet.**

Vi har agent-ID:t tillgängligt på båda ställen där det behövs:

- **I hooken:** `agent_id` finns i `PreToolUse`-input, dokumenterat.
- **I agenten:** varje agent kan skriva under ett eget prefix; vår
  worktree-sökväg bär redan agent-ID:t (`agent-a1ab9d2b2b5cd1ad2`), så det är
  läsbart utan ny mekanism.

**Den ordentliga formen, i fyra lager, svagast till starkast:**

1. **Konvention (bär hela värdet, kostar nästan intet).** Varje agent skriver
   temporärfiler till `<scratchpad>/<agent-id>/…` i stället för
   `<scratchpad>/<filnamn>`. Kollisionsrymden försvinner, eftersom två agenter
   aldrig har samma ID. Detta är samma form harnessets `tasks/` redan använder.
2. **Read-before-write, som redan finns.** Per delfråga 3 är den per agent-kontext
   och nekar en agent att skriva över en befintlig fil den inte läst. Gratis, redan
   aktiv, men täcker bara `Write`/`Edit` — inte Bash, och inte nya filer.
3. **`permissions.deny` för de inbyggda filverktygen.** Anthropics eget råd för
   hård grind. Täcker `Write`/`Edit` men inte subprocesser.
4. **`sandbox.filesystem.denyWrite` för OS-nivå.** Det enda lagret som faktiskt
   stoppar `python -c` och `tee`. Kräver att sandboxen är aktiverad.

En konkret konfiguration som skulle fungera för vårt fall, om lager 4 väljs —
notera att den **inte** är testad av mig och därför ska prövas i litet innan den
tas i bruk:

```json
{
  "sandbox": {
    "enabled": true,
    "filesystem": {
      "denyWrite": ["/tmp/claude-501/**/scratchpad/*"]
    }
  }
}
```

Tanken är att neka skrivning till scratchpads *rot* medan underkataloger per
agent-ID förblir skrivbara, så att konventionen i lager 1 blir mekaniskt tvingad
snarare än ombedd. **Att glob-formen ovan träffar som avsett är obelagt** — jag
har inte mätt den, och sandbox-sökvägarnas prefixregler skiljer sig från
permission-reglernas (`/tmp/build` är absolut i sandbox-syntax, medan
permission-regler använder `//path` för absolut). Pröva före bruk.

**Rekommendation** — märkt som rekommendation, inte beslut. Beslutet är Marcus.

Börja med **lager 1 ensamt**. Det löser hela det mätta problemet, kräver ingen
config, ingen hook och inget underhåll, och följer den form leverantören själv
använder. Lägg till lager 3 eller 4 först om lager 1 mätbart läcker — alltså om
en agent faktiskt observeras skriva utanför sitt prefix. Bygg **ingen hook** för
detta: Anthropic avråder uttryckligen från hooks som hård grind, och en hook som
ska fånga `tee` och `python -c` syntaktiskt kommer att läcka.

## Vad detta betyder för beslutet

**Beslutet `"bygg inte alls"` bör omprövas, men inte av det skäl frågan förutsåg.**

Antagandet som skulle fällas höll: scratchpad-sökvägen kan inte konfigureras.
Hade det varit hela grunden skulle beslutet stått kvar. Men slutsatsen vilade på
ett andra, outtalat led — *att en icke-konfigurerbar katalog betyder att vi inte
äger namnrymden*. Det ledet är falskt. Katalogen är harnessets; filnamnen i den är
våra, och harnesset demonstrerar självt konventionen med `tasks/<agentId>.output`.

Tre fynd flyttar dessutom risken nedåt jämfört med den bild beslutet togs mot:

1. Delningen är **strukturell och förutsägbar** (samma process), inte en
   slumpmässig bieffekt som kan ändras utan förvarning.
2. Read-before-write är ett **reellt cross-agent-skydd** för `Write` — starkare
   än vi trodde, eftersom den är per agent-kontext.
3. Bash-omdirigering **kan** grindas hårt, på OS-nivå, om det någonsin behövs.

Vad som *inte* ändrats: Bash-omdirigering är fortfarande oskyddad i vårt
nuvarande läge, och nya filer är undantagna från read-before-write. Risken är
alltså verklig — den är bara billig att stänga.

Min rekommendation är därför att vända beslutet från *"bygg inte alls"* till
*"bygg det minsta: en namnkonvention per agent-ID"*, och att uttryckligen avstå
från hook-vägen. **Beslutet är Marcus.**

## Vad jag inte kunde belägga

- **Varför `scratchpad/` och `tasks/` pekade på olika UUID i samma agent.** Min
  scratchpad-sökväg slutar på `404149b6-…`, medan mina egna subagenters
  `output_file` landade under `8ff024bf-…/tasks/`. Båda katalogerna finns; den
  senares `scratchpad/` var tom. Endast `404149b6` har en `.jsonl` under
  `~/.claude/projects/…`. Jag hittade ingen dokumentation som förklarar
  relationen och gissar inte. **Detta gör påstående 2:s ord "per session"
  otillräckligt preciserat** — det finns minst två UUID-rymder i spel, och jag vet
  inte vilken som är "sessionen".
- **Om read-before-write är avsett som race-skydd eller hallucinations-skydd.**
  Dokumentationen anger beteendet men aldrig avsikten. Att den fungerar som
  cross-agent-skydd är mätt; att det är *syftet* är obelagt.
- **`NotebookEdit`:s read-before-write-status.** Ingen uttrycklig mening hittad.
  Frånvaro av dokumentation, inte belagd frånvaro av spärr.
- **Om harnesset detekterar "stale read"** — alltså A läser, B skriver, A skriver.
  Jag såg en efterhands-notifiering om extern ändring men mätte aldrig om en
  `Write` efter en främmande ändring blockeras. Inte prövat.
- **Att `denyWrite`-globmönstret i delfråga 6 träffar som avsett.** Skrivet men
  aldrig kört.
- **Ett negativt fynd jag inte kunde reproducera:** ett delpass rapporterade att
  strängen `scratchpad` inte förekommer i binären. Binären är 266 MB kompilerad
  (`claude.exe`), och jag verifierade inte greppet självständigt. Behandla det
  som obekräftat — inte som bevis för att sökvägen är hårdkodad utanför räckhåll.
- **Delfråga 5 var vid denna revision inte stängd.** Se dess avsnitt.

## Källförteckning

Förstapartskällor, alla lästa som faktisk sida (inte via referat):

- [Tools reference](https://code.claude.com/docs/en/tools-reference.md) —
  read-before-write för `Write` (rad 440) och `Edit` (rad 173)
- [Create custom subagents](https://code.claude.com/docs/en/sub-agents.md) —
  frontmatter-fält (rad 222), arbetskatalog (rad 263), Bash-worktree-grind
  (rad 269), `isolation` (rad 290), hooks i subagenter (rad 613)
- [Configure the sandboxed Bash tool](https://code.claude.com/docs/en/sandboxing.md) —
  subagenter i samma process (§ Scope), `$TMPDIR`-styrning,
  `filesystem.denyWrite` med OS-nivå-hävdande
- [Hooks reference](https://code.claude.com/docs/en/hooks.md) —
  `PreToolUse`-schema med `agent_id`, `updatedInput`, exit-kods-semantik,
  avrådan från hook som hård grind
- [Configure permissions](https://code.claude.com/docs/en/permissions.md) —
  deny-reglers räckvidd mot subprocesser (rad 272)
- [Settings](https://code.claude.com/docs/en/settings.md),
  [Environment variables](https://code.claude.com/docs/en/env-vars.md),
  [CLI reference](https://code.claude.com/docs/en/cli-reference.md) — genomgångna
  för scratchpad-nyckel, utan träff

Mätningar: Claude Code **2.1.220**, macOS, 2026-07-30. Kollisionsexperimentet
(fem steg) och katalogkartläggningen (21 UUID-kataloger) kördes av mig; steg 2–4
kördes av en subagent på mitt uppdrag och rapporterades ordagrant.
