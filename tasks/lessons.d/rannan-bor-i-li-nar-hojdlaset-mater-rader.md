# Rännan bor inuti `<li>` när höjdlåset mäter rader

**Ett höjdlås som mäter `<li>`-höjder (spann över N rader på nivå 1, radhöjd × N
på nivå 2/3) kan inte se ett `gap` på `<ul>`: gapet ligger MELLAN raderna —
med i spannet, utanför radhöjden — så de två nivåerna ger olika tal för samma
lista.** Vid kortformen 2026-08-29 (S113, `5c34a428`) lades rännan därför som
`py-1` på `<li>` med kortet som inre `div`; li-höjden blev 124 px (116 + 8) och
hookens kod förblev byte-identisk med `main`, `LISTA_SYNLIGA_RADER` orörd.
Regel: när en mätning äger geometrin — lägg avståndet INUTI det som mäts, byt
aldrig mätaren för att passa layouten. Sidofynd i samma pass — och det
FALSIFIERADES dagen efter: här stod att `scrollbar-gutter: stable` åt 11 px
ur content-boxen *"BARA när `overflow-y` var `auto`"*. Mätningen 2026-08-29
gjordes med en `<ul>`-kant som revs i samma T176-drag, och slutsatsen följde
aldrig med; 2026-08-30 (`TASK-309.43`, S113 resume 3) mättes rännan till
11 px i BÅDA lägena (`auto` och `hidden`), precis som CSS Overflow 3 säger
om `stable`. Kvar av sidofyndet är regeln, inte talet: mät bredden i båda
lägena innan du drar en slutsats om när rännan reserveras.
