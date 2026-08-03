# Fragment — en spår-grind får bara referera skivans eget arbete

**Fångad:** 2026-08-03, Session 96 (resumen), orkestreraren, ur `TASK-132`.

**Vad som hände:** `/to-issues` stämplar PRD:ns spår-nivå-grindar på varje
barnkorts DoD. I T95-spåren slöt det en cirkel: `TASK-127.1`:s DoD krävde
*"rundturs-e2e grön mot staging"* — vilket är `TASK-127.9`:s hela leverabel —
och `127.9` berodde transitivt på `127.1` Done. Spåret kunde inte röra sig.
Kortet skrev rotorsaken som *"skillen stämplade"*.

**Den rotorsaken var för bred.** Mätt över hela `backlog/`: `task-1`, `4`, `8`,
`9`, `17`, `18`, `19`, `36`, `54` och `59` bär **alla** identiska extra-DoD-poster
på samtliga barn. Tio familjer, noll deadlocks. Stämplingen är designat beteende
— den är det som bär granskningsvågorna.

**Lärdomen:** det som avgör är grindens **grammatik**, inte att den ärvs.
Tidigare spår-grindar är predikat över skivans EGET arbete och uppfylls av
skivan själv — verbatim: *"Design-review … per skiva med UI-yta"* · *"varje
BERÖRD facit-punkt"* · *"varje FLYTTAD fil har tvåsidigt bevis"* ·
*"körnings-ID:n citerade PÅ KORTET"*. En skiva utan UI-yta uppfyller
design-review-grinden vakuöst. De skapar granskningsvågor men aldrig ett
beroende utåt.

T95:s grindar refererar i stället (a) en **systerskivas leverabel** eller (b) en
**händelse utanför repot** (*"efter Grind 0"* = Vercel-konto, *"före
DMARC-posten satt"* = DNS). Klass (a) kan sluta en cirkel; klass (b) kan per
konstruktion aldrig uppfyllas av kod alls.

**Regeln:** en skiv-DoD bär endast predikat över skivans eget arbete. Grindar
som namnger en systerskivas leverabel, eller en händelse utanför repot, hör på
PRD-kortet — de gatar spårets Done, inte varje skivas.

**Varför det small först nu:** T95 är det första deploy-bundna spåret, och det
första där e2e-grönt både är spår-grind OCH egen skiva. De tio tidigare
familjerna var rena kod-/testspår inom repot — de klarade sig av tur i sin
form, inte för att kontrollen fanns.

**Metod-noten, värd lika mycket som regeln:** rotorsaken hittades genom att
mäta hela populationen i stället för att resonera ur det trasiga fallet. Ett
`n=1`-fall bär aldrig sin egen rotorsak — den syns först mot de fall som INTE
gick sönder. Samma klass som `T110` A (mätning med ett instrument som ser en
form men inte alla), fast med rätt utfall.

**Kandidat för `[UNIVERSAL]`** — gäller varje repo där en spec bryts ned till
skivor med ärvd Definition of Done. Åtgärdsriktningen mot `/to-issues` bor i
tråd `T115`.
