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

**Den generella formen:** när en isoleringsmekanism införs, fråga vad den
FAKTISKT isolerar. Worktree-isoleringen löser filkonflikter i repot och läser
därför som "agenterna är isolerade". Den säger ingenting om `/tmp`, om
miljövariabler, om delade portar, om externa system eller om databaser — och
varje sådan yta är en delad namnrymd tills någon visar motsatsen. **Isolering är
alltid isolering av något bestämt, aldrig isolering i allmänhet.**

Jfr [[L323]] (subagent bär inte asynkron CI-svans — orkestreraren äger den):
samma klass av gränsdragningsfel mellan agent och orkestrerare, åt andra hållet.
