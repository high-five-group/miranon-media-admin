# En tråds föreslagna form är en hypotes, inte en spec [UNIVERSAL]

**Ett tråd-kort skrivs i stunden då problemet upptäcks, av någon som ännu inte
läst koden lösningen ska sitta i. Dess "föreslagen form" bär problemets diagnos
troget — men lösningens form är en gissning som ska prövas, inte ett beslut som
ska verkställas.**

**Empiri (S91, 2026-07-28, `T104` → `TASK-60`):** tråden föreslog en flagga som
*tömmer normalläget* för att bevisa att acceptance-testerna hänger på
fixturvärlden. Vid implementation visade läsningen av testfilerna att formen
lämnar en hel klass av tester obevisade: en fil som överskuggar allt den behöver
får sina svar ur sina egna `network.use()`-handlers oavsett vad normalläget
innehåller — och `persons-list` gör precis det, avsiktligt, för att kunna
assertera exakta sidstorlekar. Regimen behövde **båda** leden.

Samma tråd pekade på `test.fail()` som bevisform. Även den föll vid prövning, av
två skäl som bara syns i koden: annotationen kontrollerar aldrig fällningens
orsak, och lagd i en delad söm körs den en enda gång eftersom ESM-cachen kör
modulkroppen för den först importerande spec-filen.

**Diagnosen höll däremot exakt.** *"Beviset finns bara i agentens rapporttext;
inget i repot kan köra om det"* var korrekt och var det som motiverade arbetet.
Det är fördelningen värd att internalisera: **trådar är starka på problem, svaga
på lösning** — de skrivs när problemet är färskt och lösningen ännu ohypotesprövad.

**Motmedlet:** läs kodvägen innan trådens föreslagna form kodas, och skriv ut i
leveransen vad som INTE höll och varför. Ett tyst avsteg från kortets föreslagna
form läser nästa gång som att kortet aldrig lästes.
