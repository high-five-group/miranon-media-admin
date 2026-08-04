# Fragment — ett symptom som återkommer efter en verifierad rättelse har en AKTIV skribent, inte en historisk orsak

**[UNIVERSAL]**

**Fångad:** 2026-08-04, `T121`, orkestreraren + bygg-agent (research-pass).

**Vad som hände:** `core.hooksPath` uppmättes absolut i en delad `.git/config`,
rättades manuellt till relativt, verifierades relativt — och stod absolut
igen inom timmen. Tråden stängdes ändå en gång med rotorsaken
"konfigurations-drift, en engångshändelse" (en handpåläggning som skedde
"någon gång" i månader innan mätningen). Den stängningen var för tidig:
värdet flippade igen samma dag, upprepade gånger, med minuter mellan varje
flip — ett mönster helt oförenligt med "en person skrev över det en gång för
länge sedan".

**Vad som skilde hypotes från slutsats:** ett andra, oberoende mätpass som
INTE tog den första stängningens rotorsak för given. Det körde en
bakgrundsövervakning (poll var 2:a sekund) i stället för att bara läsa värdet
en gång, och fångade två SPONTANA flip på sex minuter utan att agenten körde
något git-kommando alls i det ögonblicket. Frekvensen — flip var 1–4:e minut
— är den signal som avslöjar klassen: en engångs-drift producerar EN
avvikelse som sedan står stilla; en AKTIV skribent producerar en STRÖM.

**Rotorsaken, belagd mot källkod:** skribenten var Claude Codes egen
worktree-skapande kod (`anthropics/claude-code#27474`/`#66993`/`#72714`) —
ett verktyg UTANFÖR repot, som kör vid varje ny worktree-skapelse och som den
egna sessionen (via `EnterWorktree`/`isolation: "worktree"`) triggar
kontinuerligt. Full beläggkedja:
`docs/research/t121-skribenten-claude-code-worktree-hookspath-2026-08-04.md`.

**Två hypoteser som mätningen AVFÄRDADE, och som annars hade kostat tid:**

- *Källan är i vårt eget repo, hub-repot eller en worktree.* Uttömmande
  kodsökning över alla tre gav noll träffar — vilket är precis vad man
  förväntar sig när skribenten är VERKTYGET man kör i, inte kod som
  checkas ut. Sökningen var korrekt utförd; den sökte bara på fel plats.
- *`npm ci`/`npx` i ett riktigt repo (till skillnad från ett minimalt
  temp-repo) beter sig annorlunda.* En rimlig, specifik hypotes från
  orkestreraren — testad direkt (`npm run postinstall` + `npx
  markdownlint-cli2` i en verklig worktree av det verkliga repot) och
  falsifierad rent: värdet förblev relativt i båda fallen.

**Lärdomen, i två delar:**

1. **Ett symptom som återkommer efter en VERIFIERAD rättelse (inte en
   ouppmärksammad, utan en som faktiskt kontrollerades och höll i
   ögonblicket) har per definition en AKTIV skribent — något som kör om och
   om igen — inte en historisk orsak som "hände en gång". Klassificera om
   direkt när återkomsten är bekräftad; fortsätt inte bygga vidare på
   engångs-hypotesen bara för att den var den första som föll ut.** Testet
   för att skilja dem åt är frekvens, inte förekomst: en enda mätning ser
   bara "avvikande igen"; en KORT SERIE mätningar (poll, inte engångsläsning)
   avslöjar om det är en pöl eller en ström.
2. **Kodsökning i det egna repot (inklusive angränsande repon och alla kända
   worktrees) är fel instrument när skribenten kan vara verktyget man kör
   arbetet i.** Noll träffar i en uttömmande sökning är inte bevis på att
   ingen kod gör det — det är bevis på att koden inte bor där sökningen
   tittade. När den egna toolingen (CI-runnern, editorn, agent-harnesset)
   själv rör den påverkade resursen, hör den till kandidatlistan från
   början, inte som sista utväg efter att allt internt är uteslutet.

**Vad som INTE är belagt, och därför inte påstås:** exakt vilket enskilt
`EnterWorktree`-anrop som orsakade var och en av de tre observerade flip-
händelserna i just detta pass — mätmetoden (2-sekunders poll) är strukturellt
för grov för att träffa ett millisekund-kort `git config`-anrop med en `ps`-
ögonblicksbild. Källkods-beläggningen (§ research-passet) gör den luckan
ofarlig för slutsatsen, men den ska inte förväxlas med en fångst på bar
gärning av en specifik process.
