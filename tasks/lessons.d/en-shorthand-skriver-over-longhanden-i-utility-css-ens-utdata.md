# En shorthand skriver över longhanden i utility-CSS:ens utdata — blanda aldrig de två för samma egenskap

**[UNIVERSAL] `row-span-2` genererar `grid-row: span 2 / span 2` — en
SHORTHAND som nollställer `grid-row-start`. Står `row-start-1` på samma
element spelar det ingen roll vilken klass som står först i attributet:
kaskaden avgörs av deklarationsordningen i den genererade stilmallen, inte av
ordningen i `class`-strängen. Välj longhand ELLER shorthand per egenskap och
element — aldrig båda.**

Instans (S111, 2026-08-23, `87438ea6`): anmälningsradens `<li>` gjordes om
till ett tvåradigt grid för att ge identiteten plats vid 375 px. Första
försöket satte `row-span-2` tillsammans med `row-start-1` på avataren.
Utfallet: avataren hamnade i **kolumn 3** i stället för kolumn 1 —
`grid-row`-shorthanden hade rensat startpositionen, och auto-placeringen tog
över. Fixen var att byta till enbart longhands
(`row-start`/`row-end`, `col-start`/`col-end`).

## Varför det inte syns i koden

I ett utility-CSS-system ser båda klasserna ut som atomära, likvärdiga
tillägg — `row-span-2` och `row-start-1` läses som "två oberoende egenskaper".
Abstraktionen döljer att den ena expanderar till en shorthand som äger den
andras egenskap. Samma fälla finns i `inset` mot `top`/`left`, `place-items`
mot `align-items`, `grid-area` mot allt fyra, `flex` mot
`flex-grow`/`shrink`/`basis`, och `background` mot varje `background-*`.

## Regeln

1. **Bestäm per egenskap och element: longhand eller shorthand.** Blanda inte.
   Longhand är det säkrare valet när flera klasser rör samma axel, eftersom
   ingen av dem kan radera en annan.
2. **Mät placeringen, anta den inte.** Att klassen står i `class`-attributet
   betyder inte att den är i kraft; det som gäller är den beräknade stilen.
   Här räckte en blick på den renderade kolumnindelningen för att se felet —
   men bara för att någon tittade.
3. **Ett oväntat hopp i placering är en kaskad-fråga före en logik-fråga.**
   Element som "flyttar sig av sig självt" är nästan alltid auto-placering
   som tagit över efter en raderad explicit position.

## Den generella formen

**En abstraktion som gör olika saker likformiga döljer också deras
konflikter.** Utility-klasser, konfigurationsnycklar och flaggor ser i sina
respektive listor ut som jämbördiga poster; under ytan äger vissa av dem
andra. Frågan att ställa när två inställningar rör samma sak är inte "vilken
står sist" utan "expanderar någon av dem till den andra".
