# Lagningen av en blind fläck inför gärna nästa — pröva mot radklass-rymden, inte mot felet

**Att pröva en rättad kontroll mot det kända felet bevisar bara att just det felet
fångas. Det säger ingenting om de rader som ska INTE fälla, och ingenting om de
radklasser mönstret aldrig rörde. Varje lagning av en kontroll ska därför prövas
i tre riktningar: fäller på det kända felet · fäller INTE på ett rent nämnande ·
och täcker varje radklass som faktiskt finns i materialet — annars byts en blind
fläck mot en annan.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-31, `TASK-100` — `tasks/s91-restlistan.md`):**

Restlistans statuskontroll hade två dygn tidigare lagats efter att ha visat sig
strukturellt blind för hela A7-klassen. Den lagningen gjordes **rätt enligt
dåvarande lärdom**: den nya formen prövades trefaldigt före den skrevs in — tre
FEL mot filen där felen bevisligen fanns, tomt mot den rättade, och ingen falsk
positiv på en rad som nämnde ett `Done`-kort.

Skarp körning gav ändå **fem FEL, varav två falska**, och lagningen visade sig
bära tre defekter:

| Defekt | Vad | Klass |
|---|---|---|
| A | Oförankrat `grep` drog in kort som bara NÄMNS i en annan posts **titel** — `TASK-52` bokfördes som Done fast den står i To Do | falskt statuspåstående |
| B | Varje **fet** kod-span antogs vara blockets bärare, så ett nämnande i brödtexten fällde ett korrekt block | falsk positiv |
| C | Mönstret såg bara **fet** kod-span, så två poster som bär sitt ID i vanlig kod-span var helt osynliga — båda dolde äkta fel | ny blind fläck |

**Defekt C är poängen.** Den infördes av lagningen, i samma operation som stängde
föregående blinda fläck, och av exakt samma orsak: mönstret skrevs mot de rader
som råkade ligga närmast. Prövningen mot det kända felet kunde inte upptäcka den,
eftersom den bara ställde frågan *"fångas felen jag redan känner?"* — aldrig
*"vilka former finns i materialet, och täcks alla?"*

**Motmedlet är att inventera FÖRE man skriver mönstret.** En enkel körning som
listar varje blocks faktiska ID-former tog en tool-call och avtäckte sex skilda
bärarformer där mönstret antog en. Först då gick det att skriva tre fallande
grenar som var och en svarar mot en verklig radklass, och att mutationspröva varje
gren för sig.

**Och den ärligaste delen: sluta jaga en form som täcker allt.** Två poster i
materialet var syntaktiskt **identiska** — samma ID i samma markup — men i den ena
var ID:t bäraren och i den andra ett rent nämnande som posten uttryckligen sa att
inget kort bar. Ingen regex kan skilja dem. En bredare form hade bytt den blinda
fläcken mot en falsk positiv. Kontrollen rapporterar dem därför som `OKLAR` och
ber om en mänsklig blick, i stället för att gissa och se heltäckande ut.

**Skärpningen mot närliggande lärdom:** fragmentet om att en kontroll som aldrig
prövats mot ett känt fel inte är bevisad säger *pröva mot felet*. Denna säger att
det är **nödvändigt men inte tillräckligt** — den prövningen gjordes, och kostade
ändå tre nya defekter. Tre gånger i rad har samma artefakt fått en lagning som
införde nästa blind fläck; klassen stängs inte av en engångsåtgärd, utan av att
räckvidden **redovisas** i utdatan i stället för att antas.
