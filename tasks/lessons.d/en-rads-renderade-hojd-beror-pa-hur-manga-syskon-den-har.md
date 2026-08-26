# En rads renderade höjd beror MÄTT på hur många syskon den har i DOM — inte bara sitt eget innehåll

**Mät ALDRIG "höjden på de första N raderna" genom att observera en RAD i en
kontext med FLER än N rader, och sedan applicera talet i en kontext med EXAKT
N. Browserns layout-avrundning fördelas över HELA flödet, inte per element —
samma rad, samma props, kan rendera 1 px olika beroende på hur många syskon
den har.** `[UNIVERSAL]`

Mätt (TASK-309.24, dokumentlistans höjdlåsning): en identisk rad
(`getBoundingClientRect().height`) gav **99 px** när sju rader låg i samma
`<ul>`, men **98 px** när bara fyra gjorde det. Samma DOM-nod-typ, samma
textinnehåll, samma CSS-klasser — enda skillnaden var antalet SYSKON i
flödet. En diagnos-fil (`page.evaluate` som loggade `offsetTop`/
`getBoundingClientRect()` för rad 1–4 i båda kontexterna) bekräftade det
direkt, INTE en teori som stod oprövad.

Konsekvensen för mätnings-kod: en cache-strategi som mäter EN gång (i vilken
kontext som helst) och återanvänder värdet överallt håller INTE pixel-exakt
när olika kontexter har olika radantal. Rätt fix är att identifiera den ENA
kontexten där precisionen faktiskt prövas (i det här fallet: filtret som kan
visa EXAKT gränsvärdet, `antalSynliga === N`) och låta DEN vara den
auktoritativa mätkällan — övriga kontexter tolererar ±1 px eftersom de redan
är i ett "gott nog"-läge (t.ex. redan rullningsbara).

Negativ kontroll: att temporärt ta bort den auktoritativa källans särbehandling
och låta VILKEN SOM HELST kontext skriva över cachen reproducerade omedelbart
en riktig, mätbar 1 px-diff mellan de två kontexterna — bekräftar att
skillnaden är verklig layoutbeteende, inte en bugg i mätverktyget.
