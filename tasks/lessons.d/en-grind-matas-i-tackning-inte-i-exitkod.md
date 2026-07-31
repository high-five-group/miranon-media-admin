# En grind mäts i täckning, inte i exitkod

**En grön grind säger bara att den inte hittade något i det den tittade på. Mät
alltid hur stor andel av ytan den faktiskt läser — annars är exitkoden ett svar
på en fråga du inte ställde.** `[UNIVERSAL]`

`TASK-108` skulle bygga en kontroll för trådregistret på premissen att registret
saknade mekanisk kontroll helt. Premissen var falsk: `scripts/check-lifecycle.sh`
hade validerat tråd-kort sedan Session 21, wirad två gånger — `check-docs.sh` som
grind 6 av 10, och `ci.yml`. Den var grön. Den hade varit grön i månader.

Mätt mot disk såg den **13 av 109 trådar — 11,9 %**. Tre klasser föll utanför:

- 8 av 21 trådfiler saknade `lifecycle:`-fältet, och skriptets `[[ -z ... ]] &&
  continue` hoppar tyst över dem. Regeln är korrekt i sig (frånvaro = ej
  livscykel-spårat, ADR-052 beslut 6) — men den gör täckningen till en funktion
  av vad skribenter råkat fylla i.
- 88 trådar har ingen fil alls. Loopen itererar över filer, så de existerade inte
  för grinden.
- Registrets egen integritet — numrering, radform, tillstånds-kolumn — validerades
  av ingenting.

Ingen av dessa syns i utfallet. Grinden skriver `✅ lifecycle-validering OK` och
`check-docs.sh` kallar den *"Lifecycle på sessionsdok + trådkort"*. Båda sanna.
Båda smalare än de låter.

**Det farliga är inte luckan utan att den läses som täckt.** En yta utan grind blir
granskad för hand, för alla vet att den är ogrindad. En yta med en grind som ser
12 % blir inte granskad alls — grönt utfall läses som "kontrollerad". Restlistans
`§ Filens egna fel` hade redan bokfört klassen: *en kontroll som tyst inte täcker
en radklass är farligare än ingen kontroll*. Den bokföringen fanns, och luckan
upptäcktes ändå först när någon räknade.

Praktiskt, i den ordningen:

1. **Räkna nämnaren innan du litar på ett grönt utfall.** Hur många objekt finns i
   ytan, och hur många itererade grinden över? Skillnaden är den otäckta klassen.
2. **Varje `continue` är en täcknings-gräns.** Skriv ut vilken klass den släpper
   igenom, i skriptets header, med tal — inte bara varför regeln är riktig.
3. **Nya grindar deklarerar sitt scope och sitt icke-scope.** `check-lifecycle.sh`
   gjorde det redan föredömligt för sin *kategori-skillnad* mellan sessioner och
   trådar; det som saknades var samma explicitet om vad som helt faller utanför.
4. **Bygg beviset som testsvit, inte som körning.** En engångskörning som visats
   grön bevisar inget om nästa ändring. `TASK-108`:s grind fick 15 testfall varav
   13 planterar ett känt fel — plus sex skarpa planteringar i det verkliga
   registret, en per invariant.
