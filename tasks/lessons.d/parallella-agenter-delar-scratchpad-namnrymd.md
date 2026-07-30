# Parallella agenter delar scratchpad — filnamn är en delad namnrymd, inte en privat

**Bygg-agenter får var sin git-worktree, men INTE var sin scratchpad. Två agenter
som väljer samma självklara filnamn skriver över varandras arbete, och den som
skriver sist vinner tyst. Isolering av arbetskopian är inte isolering av
temporärfiler.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-29, femtonde resumen):** tre bygg-agenter kördes parallellt,
var och en i egen worktree. `TASK-75`:s agent rapporterade oombett:

> *"scratchpad-katalogen delas mellan oss agenter (jag höll på att skriva över
> `TASK-76`-agentens PR-text — bytte till eget filnamn)"*

Båda hade nått samma naturliga val — en fil för PR-texten, med ett generiskt namn.
Ingen av dem gjorde något fel; formen bjuder in till kollisionen.

**Varför det är värre än det låter.** En överskriven PR-text upptäcks direkt, för
den läses innan den används. Men samma namnrymd bär också mätdata, loggar,
mellanresultat och extraherade skript. En agent som skriver `matning.json` och
läser tillbaka den efter att en annan agent skrivit sin egen `matning.json`
**får fel data utan något felmeddelande** — och rapporterar tal som ser rimliga
ut. Det är den tysta varianten, och den hade ingen fångat.

Kollisionen fångades här bara för att en agent råkade se den andras fil och
**rapporterade den i stället för att tyst byta namn**. Hade den bara bytt namn
hade formen stått kvar orörd till nästa gång.

**Motmedlet, i stigande kostnad:**

1. **Namnge varje scratchpad-fil med sitt kort-ID eller agent-ID** —
   `pr-text-task-76.md`, inte `pr-text.md`. Gratis, och räcker.
2. **Orkestreraren säger det i uppdraget** när fler än en agent körs samtidigt.
   Agenten kan inte veta att den har sällskap; bara den som spawnar vet.
3. **Egen underkatalog per agent** om volymen växer.

## Skärpt 2026-07-30 — framkallat i kontrollerat försök

Fragmentet skrevs på ett andrahandsvittne. Felläget är sedan dess **framkallat**:
två agenter med identiskt uppdrag fick samma sökväg och den ena skrev över den
andra. Tre saker blev skarpare, och de ändrar var motmedlet ska sitta.

**Sökvägen är härledd ur sessions-ID:t.** `CLAUDE_CODE_SESSION_ID` är exakt
scratchpad-katalogens namn, och en subagent ärver den — *"Subagents run in the
same process as the parent session"* (`code.claude.com/docs/en/sandboxing.md`).
Delningen är alltså **strukturell design, inte en bugg**. Worktree-sidans sektion
om delat tillstånd räknar upp `.git`, project-scope-plugins och
permission-approvals; **temp-kataloger nämns inte alls**.

**`Write` är skyddat — skalet är inte.** Harnessets read-before-write-spärr är
**per agent-kontext**, alltså ett reellt cross-agent-skydd: en agent nekas skriva
en fil den inte själv läst, även om en annan agent läst och skrivit den. Men
`echo … > fil` från Bash går rakt igenom, exit 0, ingen varning. **Den tysta
varianten kan bara uppstå via skalet** — och det är precis kanalen mätdata skrivs
i (`flake-matserie.mjs`, `ci-metrics.mjs` tar alla `--utdir` från anroparen).

**Punkt 3 ovan är prosa, inte mekanism.** Vi äger inte katalogen och kan inte
konfigurera den; en egen underkatalog kräver att agenten skapar den, alltså att
den följer en instruktion. Att kalla det mekanism är felklassen
[[en-regel-som-pastas-mekaniserad-granskas-inte]].

**Vad som DÄREMOT är mekanism, och var den biter:** `tools` som allowlist i
agent-frontmatter tar bort verktyg helt (`sub-agents.md` rad 279–280, 340).
Två fällor mätta: `disallowedTools: Edit` tar **inte** bort `NotebookEdit`, så
använd allowlist aldrig denylist; och en agent utan Bash kan **spawna** en agent
med Bash så länge den behåller `Agent`. Mekanismen hjälper alltså läsande
agenttyper — men inte `bygg-agent` eller `research-pass`, som båda behöver Bash
för att göra sitt jobb. Där är konventionen allt vi har, och den ska heta
konvention.

Belägg: `docs/research/harness-namnrymd-agenter-2026-07-30.md`.

**Den generella formen:** när en isoleringsmekanism införs, fråga vad den
FAKTISKT isolerar. Worktree-isoleringen löser filkonflikter i repot och läser
därför som "agenterna är isolerade". Den säger ingenting om `/tmp`, om
miljövariabler, om delade portar, om externa system eller om databaser — och
varje sådan yta är en delad namnrymd tills någon visar motsatsen. **Isolering är
alltid isolering av något bestämt, aldrig isolering i allmänhet.**

Jfr [[L323]] (subagent bär inte asynkron CI-svans — orkestreraren äger den):
samma klass av gränsdragningsfel mellan agent och orkestrerare, åt andra hållet.
