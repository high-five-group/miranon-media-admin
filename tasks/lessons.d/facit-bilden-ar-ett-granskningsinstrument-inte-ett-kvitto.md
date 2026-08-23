# Facit-bilden är ett granskningsinstrument, inte ett kvitto — läs bilden, inte agentens beskrivning av den

**[UNIVERSAL] En bild som tas för att LÅSA en yta är samtidigt den sista
billiga chansen att GRANSKA den. Läser man bara agentens sammanfattning av
bilden byter man ut ett instrument mot ett påstående — och ett påstående
formulerat som "dokumenterat, avsiktligt beteende" är den formulering som
lättast passerar, eftersom den låter som om granskningen redan är gjord.**

Instans (S111, 2026-08-23, `TASK-299.4`-manifestet `a8af2f85`): agenten tog
sju facit-bilder ur den hermetiska fixturvärlden och skrev i manifestet att
mobilens trunkering av identiteten till **"R"** var *"dokumenterat, avsiktligt
beteende"*. Orkestrerarens egen blick på samma bild visade något
sammanfattningen inte nämnde: namnet var dessutom klippt **mitt i ordet** —
*"Disa Danielssc"*, utan ellips. Gunilla-principen faller på det, och felet
låg i åtgärdskö-läget, alltså sidan Lotta landar på från Hem. Marcus hade
granskat på desktop, där defekten inte finns.

Orsaken var mätbar ur koden och bilden tillsammans (`87438ea6`): tidskolumnen
(*"för 5 dagar sedan"*, ~104 px) plus badgen (*"Behöver kopplas"*, ~135 px)
översteg innehållskolumnen (~106 px), så identiteten fick 0 px; och
resolutions-triggern var `inline-flex`, där `text-overflow: ellipsis` aldrig
verkar — den kräver en block-container med inline-innehåll. Ingen av de två
halvorna syns i en textsammanfattning. Båda syns i bilden.

## Varför "dokumenterat beteende" är den farliga formuleringen

En docblock som beskriver ett beteende är en beskrivning av vad koden GÖR,
inte ett beslut om att den BÖR göra det. Att citera den tillbaka som skäl
förvandlar en observation till ett mandat utan att någon fattat beslutet.
Formen är svår att fånga eftersom den bär två sanna delar — beteendet ÄR
dokumenterat, och dokumentationen ÄR läst — och en falsk slutsats mellan dem.

## Regeln

1. **Öppna varje facit-bild innan stämpeln.** Bilden är billig att titta på
   och dyr att ångra: en stämplad yta blir referens för allt som byggs efter
   den.
2. **Granska i det läge och den vyport där ytan faktiskt används**, inte bara
   i det som råkar vara bekvämt. Här var defekten mobil-only och
   åtgardskö-only; två av sju bilder bar den.
3. **Behandla "dokumenterat/avsiktligt beteende" i en agentrapport som en
   hypotes med källkrav.** Fråga vilket beslut som dokumenterade det, inte
   vilken fil som beskriver det.

## Den generella formen

**Ett artefakt som produceras för att bevisa något är också det bästa
tillfället att pröva det.** Skärmdumpen, den genererade rapporten,
diff-utskriften: var och en passerar en gång genom någons synfält innan den
fryses. Den passagen är gratis granskning, och den enda som fångar det som
ingen tänkt att leta efter — men bara om en människa faktiskt tittar på
artefakten och inte på texten bredvid den.

Besläktat: `L246` (visuell egenskap verifieras mot det renderade, aldrig mot
källkoden) — där var källkoden fel instrument, här var agentens prosa det.
