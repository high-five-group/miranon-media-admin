# Tre samstämmiga kopior är osynliga för läsning — bara registret avslöjar dem

**När samma påstående står i flera dokument och alla säger samma sak, kan ingen
mängd korsläsning *mellan dokumenten* avslöja att det är fel. Felet syns bara
mot den auktoritativa källan.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-29):** `PAUSLÄGE`-blocket, `todo.md`-kadensen och
`s91-restlistan.md` påstod alla **"NIO KORT STÄNGDA … `63`"**. Backlog-CLI:t
sade `○ To Do`.

Vad som faktiskt gällde: PR #385 var mergad, alla AC bockade, tre av fyra DoD
bockade — och **DoD #3 (CI grön per jobb) obockad**, eftersom den kräver en
signal som inte finns när bygg-agenten lämnar ifrån sig arbetet. Stängningen är
orkestrerarens svans, och den tappades i en paus mitt i vågen.

Felet överlevde **en paus, en resume och en full genomläsning av samtliga tre
dokument.** Det upptäcktes först när kortets status slogs upp mot registret av
ett annat skäl.

**Varför samstämmighet är farligare än motsägelse:** två dokument som säger emot
varandra tvingar fram en kontroll. Tre som säger samma sak *bekräftar varandra*
för läsaren och släcker impulsen att verifiera. Antalet kopior ökar
trovärdigheten utan att öka sanningshalten — de härstammar ju alla från samma
ursprungliga påstående.

**Formen som fångar det:** vid varje läge där ett dokument påstår en STATUS
(stängd, landad, klar, avblockerad), slå upp den mot registret som äger den —
backlog-CLI:t för kort, `threads/README.md` för trådar, `git`/`gh` för
landningar. Räkna aldrig statusen ur prosa, hur många ställen den än står på.

**Detta är skälet bakom restlistans egen formregel** — *"kopior driftar; pekare
gör det inte"* — och beviset för att regeln behöver gälla handoff-blocken också,
inte bara den fil där den råkar stå skriven. Se
[[lardom-utan-grind-tillampas-inkonsekvent]] för samma mönster på en annan yta.
