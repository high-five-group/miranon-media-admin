# Rännan bor inuti `<li>` när höjdlåset mäter rader

**Ett höjdlås som mäter `<li>`-höjder (spann över N rader på nivå 1, radhöjd × N
på nivå 2/3) kan inte se ett `gap` på `<ul>`: gapet ligger MELLAN raderna —
med i spannet, utanför radhöjden — så de två nivåerna ger olika tal för samma
lista.** Vid kortformen 2026-08-29 (S113, `5c34a428`) lades rännan därför som
`py-1` på `<li>` med kortet som inre `div`; li-höjden blev 124 px (116 + 8) och
hookens kod förblev byte-identisk med `main`, `LISTA_SYNLIGA_RADER` orörd.
Regel: när en mätning äger geometrin — lägg avståndet INUTI det som mäts, byt
aldrig mätaren för att passa layouten. Sidofynd i samma pass:
`scrollbar-gutter: stable` åt 11 px ur content-boxen BARA när `overflow-y`
var `auto`, så korten blev smalare så fort listan hade fem poster i stället
för fyra — mät bredden i båda lägena.
