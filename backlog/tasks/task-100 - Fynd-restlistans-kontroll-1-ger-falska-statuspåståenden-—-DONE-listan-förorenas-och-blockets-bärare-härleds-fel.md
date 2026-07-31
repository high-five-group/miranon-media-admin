---
id: TASK-100
title: >-
  Fynd: restlistans kontroll 1 ger falska statuspåståenden — DONE-listan
  förorenas och blockets bärare härleds fel
status: To Do
assignee: []
created_date: '2026-07-31 07:50'
updated_date: '2026-07-31 08:07'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 180000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`tasks/s91-restlistan.md` bär i sin ingress två mekaniska kontroller som ska köras FÖRE varje uppdatering av filen. Kontroll 1 ("Done-kort som står öppna i kroppen") kördes skarpt 2026-07-31 och gav **fem FEL**. Två av dem är falska, och de avslöjar två skilda defekter i kontrollens form.

**Defekt A — DONE-listan förorenas av kort-ID:n som bara NÄMNS i andra korts titlar.**
Extraktionen är `grep -oE 'TASK-[0-9.]+'` över hela Done-blockets rader. Raden
`[MEDIUM] TASK-89 - Fynd: person-detail-fallets orsakskedja mot TASK-52 är ej verifierad`
lägger därför in **både** `TASK-89` och `TASK-52` i DONE. Mätt: den gamla formen ger 137 ID:n, en ledande-position-förankrad form ger 136 — och det enda som skiljer är `TASK-52`, som står i **To Do**. Kontrollen rapporterade den som Done, alltså ett **falskt påstående om ett korts status** — exakt felklassen filen redan bokfört i § Filens egna fel post 7.

**Defekt B — varje fet kod-span i ett block antas vara blockets bärare.**
Spår E:s post om `ZZ-GRANSKNING-S91` bärs av `TASK-88` (öppen) men nämner i sin brödtext `TASK-95` i fet kod-span. `TASK-95` är Done, så kontrollen fäller blocket. Blocket är korrekt — bäraren är öppen. Ingressens egen kommentar hävdar att kort som *"bara NÄMNS"* inte matchar, men det gäller bara nämnanden utan fetstil; ett **fett** nämnande går rakt igenom.

**Defekt C — funnen under arbetet, samma familj som B.** Bärar-mönstret ser bara ID i FET kod-span, alltså där asteriskerna står omedelbart intill backticken. Två block bär sitt ID i **vanlig** kod-span och är därför helt osynliga för kontrollen:

- **A5-posten** — `TASK-36.8` står som avbockad i kroppen, i strid med filens egen underhållsregel att kroppen bara bär öppna poster. Kortet är Done.
- **A3-posten** — bäraren står som "kortad som `TASK-85`" inuti en fet span, men utan asterisker intill backticken. Kortet är Done, posten står öppen.

Båda är ÄKTA fel som legat oupptäckta. Det är samma klass som post 8 bokför — tredje gången.

Bakgrunden gör kravet på tvåsidigt bevis obligatoriskt: § Filens egna fel post 8 bokför att den FÖREGÅENDE versionen av kontrollen bar en blind fläck som dolde tre fel, och att *"lärdomen är inte att regexen var slarvig utan att den aldrig prövades mot ett känt fel."*

**Avgränsning.** A3-posten (`TASK-85`) går inte att skilja syntaktiskt från ett rent nämnande: block "Två namn-/strukturfrågor" bär `TASK-59.8` i exakt samma form, och där ÄR ID:t ett nämnande — posten säger uttryckligen att inget kort bär den. Kontrollen får därför inte gissa. Den rapporterar klassen som OKLAR i stället för att tiga, och städningen av A3- och A5-posterna lämnas som eget beslut.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Defekt A lagad: DONE-listan bär bara radens EGET kort-ID (ledande position). Mekaniskt bevisat att TASK-52 inte längre står i listan, och att noll rader i Done-blocket faller utanför den nya förankringen (ingen radklass tappas)
- [x] #2 Defekt B lagad: blockets bärare identifieras entydigt, så ett nämnande i blockets svans inte fäller blocket. Bevisat mot ZZ-GRANSKNING-blocket: bäraren TASK-88 är öppen, blocket nämner Done-kortet TASK-95, och ingen fällning sker
- [x] #3 Defekt C lagad: bärare i vanlig kod-span i radens ledande position identifieras. Bevisat genom att TASK-36.8 — osynlig för den gamla formen — fälls av den nya
- [x] #4 TVÅSIDIGT BEVIS, inte enkelriktat: (a) noll falska positiva på TASK-52 och TASK-95 mot dagens fil, OCH (b) fortsatt fällning av minst ett KÄNT ÄKTA fel. Båda utfallen uppmätta och redovisade
- [x] #5 Mutationsprov per bärarklass: ett Done-kort planteras som bärare i var och en av de former ingressen påstår sig täcka (fet kod-span på rad 1, vanlig kod-span i ledande position, fet kod-span sist i blocket / A7-klassen) och kontrollen fäller i samtliga
- [x] #6 Kontrollen tiger INTE om block vars bärare den inte kan avgöra — ett block utan entydig bärare som nämner ett Done-kort rapporteras som OKLAR i stället för att tyst hoppas över. Post 8:s lärdom kodad: en radklass som inte täcks får inte vara osynlig
- [x] #7 Kroppen städad: TASK-86, TASK-87 och TASK-89 flyttade till § Avbockningslogg med sina landningar, med sakinnehållet bevarat — särskilt Spår E:s klassvarning att ZZ-GRANSKNING-* ALDRIG får en purge-target. TASK-88-posten står kvar öppen
- [x] #8 Varje korts status verifierad mot backlog-CLI:t före flytt — aldrig härledd ur filen själv (post 7:s lärdom)
- [x] #9 Defekten bokförd som post 9 i § Filens egna fel, i samma öppna form som post 7 och 8
- [x] #10 Båda kontrollerna (1 och 2) körda efter ändringen med utfall och exitkoder redovisade; kontroll 2 fortsatt ren
- [x] #11 Raden 'Senast verifierad mot disk' uppdaterad
- [x] #12 Fail-closed mot formatdrift: en tom DONE-lista ger en rad som BÖRJAR med FEL, så den fångas av samma läsning som övriga fynd, i stället för att läsas som allt rent. Inget exit — blocket klistras ibland rakt in i ett skal. Kontrastbevis mot gamla formen redovisat
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MÄTT FÖRE (kontroll 1 i sin gamla form, skarpt mot registret): 5 FEL, exit 0.
TASK-86 · TASK-87 · TASK-89 (äkta) · TASK-95 · TASK-52 (falska).
Kontroll 2: ren, exit 0.

DEFEKT A, mätt i stället för resonerad: gamla extraktionen ger 137 unika ID ur
Done-blocket, ledande-position-förankrad ger 136. Enda skillnaden är TASK-52,
som står i To Do. Att den nya formen inte tappar en radklass är mätt separat:
136 rader i Done-blocket innehåller "TASK-", och 0 av dem faller utanför den nya
förankringen.

DEFEKT B: ZZ-GRANSKNING-blocket bärs av TASK-88 (To Do) och nämner TASK-95
(Done) i sin svans. Ny form fäller inte — bäraren läses ur blockets FÖRSTA rad,
nämnandena bor i svansen.

DEFEKT C, funnen under lagningen: bärar-mönstret såg bara FET kod-span. Två
block bär sitt ID i vanlig kod-span och var därmed helt osynliga. Båda är äkta
fel: TASK-36.8 (Done, står [x] i kroppen mot filens egen underhållsregel) och
TASK-85 (Done, står [ ]). Tredje instansen av post 8:s klass.

BÄRAR-REGELN, tre fallande grenar, var och en mot en verklig radklass i filen:
  (a) fet kod-span på rad 1    — **`TASK-53`** — …   ·   (**`TASK-88`**, …)
  (b) ledande kod-span rad 1   — `TASK-36.8` — …     ·   `T87` — …
  (c) fet kod-span sist        — A7-klassen: … → **`TASK-70.7`**

MUTATIONSPROV, en per gren, i separata kopior så fällningen kan attribueras:
  (a) (**`TASK-88`**…) → (**`TASK-75`**…)      ⇒ FEL: TASK-75      FÄLLER
  (b) - [ ] `T85` våg 3 → `TASK-70.2`          ⇒ FEL: TASK-70.2    FÄLLER
  (c) → **`TASK-70.7`** → **`TASK-70.6`**      ⇒ FEL: TASK-70.6    FÄLLER

MÄTT EFTER (ny form, ordagrant extraherad UR FILEN, inte ur en kopia):
  FEL   1  — TASK-36.8, äkta och kvarstående
  OKLAR 5  — TASK-93 · TASK-70.5 · TASK-85 · TASK-59.8 · TASK-54.2
  falska positiva 0 — TASK-52 och TASK-95 förekommer inte i utdatan
  exit 0. Identiskt utfall i bash och zsh.
Kontroll 2: ren. Att den KÖR är bevisat med kontrastprov — TASK-53 borttaget ur
kartans steg 7 ger "FEL: TASK-53 … saknar steg i kartan".

FAIL-CLOSED: tom DONE-lista ger nu en FEL-prefixad rad. Kontrastbevis: gamla
formen ger tomt och exit 0 på exakt samma indata — alltså grönt på en trasig
avläsning.

VARFÖR OKLAR FINNS I STÄLLET FÖR EN BREDARE REGEX: A3-postens form
("**kortad som `TASK-85`**") är syntaktiskt IDENTISK med ett rent nämnande —
posten "Två namn-/strukturfrågor ur `TASK-59.8`:s QA-vandring" bär ID:t likadant
och säger uttryckligen att inget kort bär den. En regex som fångar den ena
fäller den andra falskt. Att jaga en form som "verkar täcka allt" är just
felmönstret post 8 bokför, så räckvidden redovisas i stället för att gissas.

EJ ÅTGÄRDAT, medvetet och utanför kortets städ-scope: TASK-36.8 och TASK-85
ligger kvar i kroppen. TASK-36.8 tjänar som det kvarstående äkta felet i det
tvåsidiga beviset, och båda posterna bär sakinnehåll vars flytt är ett eget
beslut. Se rapporten.

GRINDAR: check:docs 10/10 exit 0 (fällde först på MD038 — backslash-escape
fungerar inte inuti kod-spans; stycket omskrivet). check-backlog-closure.sh
exit 0, 173 kort, 0 inkonsistenta.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
