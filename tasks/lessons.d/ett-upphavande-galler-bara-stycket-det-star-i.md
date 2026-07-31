# Ett upphävande gäller bara stycket det står i — citaten instruerar vidare [UNIVERSAL]

**En regel som förklaras UPPHÄVD dör i sitt eget stycke. Varje annan sektion som
citerar regeln fortsätter instruera enligt den, eftersom citatet ligger där
regeln ANVÄNDS och är osynligt från platsen där beslutet fattades.** `[UNIVERSAL]`

**Empiri (S91, `TASK-96`, 2026-07-30).** `TASK-70.1` mekaniserade
landnings-ordningen till en merge queue 2026-07-29 och skrev det med versaler i
`CONTRIBUTING.md` § Landnings-ordningen: *"den manuella sekvenseringen nedan är
UPPHÄVD"*. Ett dygn senare instruerade **fyra** andra ställen i samma fil
fortfarande enligt de upphävda formerna A och B:

| Ställe | Vad det sade efter upphävandet |
|---|---|
| § Revert-vägen, köordningen | revert-PR:n armeras FÖRST, andra PR:er får vänta — *"det är form B i sektionen ovan"* |
| § Revert-vägen, steg 3 | *"Blir revert-PR:n `BEHIND` gäller § Landnings-ordningens form B"* |
| § Landnings-ordningen, CI-vakten | *"Bikostnad som hör till form B"* |
| § Landnings-ordningen, avgränsningen | merge queue *"är en egen öppen post … tills den finns är ordningen en aktörs ansvar"* — 24 h efter att kön aktiverats |

Samma klass fanns i `.claude/agents/bygg-agent.md`, där instruktionen *"armera
inte"* var riktig men motiveringen (`BEHIND`) var falsifierad av mekaniseringen.
Den rättades separat 2026-07-30.

**Varför upphävandet inte räcker.** Beslutet skrivs där regeln BESLUTAS.
Citaten står där regeln TILLÄMPAS — i en runbook, i en roll-tabell, i en
agentdefinition — och de är formulerade i regelns egna termer, inte i sektionens.
Den som skriver upphävandet läser sin egen sektion och ser att den nu stämmer.
Ingen läsning av den sektionen kan avslöja de andra fyra.

**Motmedlet är en sökning, inte en genomläsning.** Vid varje upphävande: grep
efter regelns EGENNAMN (*"form A"*, *"form B"*) och efter dess MOTIVERING
(*"BEHIND"*) över hela repot — inklusive agentdefinitioner och runbooks — och
gör svepet till en del av upphävandets egen landning. Ett citat som blir kvar är
inte inaktuell text: det är en gällande instruktion som säger emot den nya, och
den som följer den gör fel utan att bryta mot något.

**Skilj instruktion från motivering när citatet rättas.** I tre av fem fall ovan
var instruktionen fortfarande rätt och bara skälet fel. Att stryka hela stycket
hade tagit bort en regel som gäller; att lämna det orört hade lämnat kvar ett
skäl som är falskt. Rätt operation är att byta motiveringen och behålla
instruktionen — och skriva ut att det är vad som gjordes.

Besläktad: [[en-regel-som-pastas-mekaniserad-granskas-inte]] (påståendet om
mekanism) · [[tre-samstammiga-kopior-ar-osynliga-for-lasning]] (kopior som
bekräftar varandra).
