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

**[TASK-309.46, 2026-08-30] Regeln håller — rännan är fortfarande INUTI `<li>`
— men VILKEN box den ligger i avgör en andra sak: var rullningslistens spår
börjar.** Ett spår spänner alltid `<ul>`:ets padding-box, så en ränna som ligger
som `padding` på raden hamnar innanför spåret även ovanför FÖRSTA kortet (mätt i
prod: `ul.top` 303 mot `kort1.top` 311 — spåret började 8 px för högt, Marcus:
*"den bör ju börja vid kortet precis"*). Samma 8 px som en transparent
`border-bottom` ligger UTANFÖR padding-boxen: li-höjden är oförändrad 124 px,
spåret börjar exakt vid kortet, och hookens redan befintliga
`separatorBredd`-avdrag (`border-bottom-width`, nivå 1 och 2) får äntligen ett
föremål — låset går 496 → 488 = rad1.top → rad4.bottom.

Regeln som faller ut, utöver den ovan: **avståndet ska ligga inuti det som
MÄTS, men i den box som stämmer med vad det ska AVGRÄNSA.** Padding och border
är samma pixlar för radhöjden och olika pixlar för allt som läser padding-boxen.

Och en följdlärdom om prosa: hookens docblock påstod att nivå 1 *och* 2 skrev
`senastUppmattRadhojd` separator-fritt. Nivå 1 gjorde det; nivå 2 lagrade
radhöjden med sin egen separator kvar. Med en 1 px-separator var felet 4 px och
osynligt i varje mätning; med 8 px blev övergången rader → noll rader 496 i
stället för 488. **En latent avvikelse mellan prosa och kod skalas upp av nästa
ändring — den försvinner inte för att den varit ofarlig.**
