# Orkestrerarens Done-flippar kolliderar med byggarens kortändringar — ta kortet från main och återapplicera via CLI:t

**En stängningsbatch som flippar kort Done på en gren skapad FÖRE byggarnas
PR:er landat konflikterar i exakt de kortfiler byggarna själva bockade AC och
skrev notes i; rätt lösning är att ta mains version av kortet (byggarens
belägg) och återapplicera Done-flippen och stängningsnotes via backlog-CLI:t,
aldrig att lösa konflikten för hand i kortfilen.** Mätt 2026-09-07 (S123
resume 1): PR #2448 blev DIRTY med fyra konflikter (416.21, 420, 422, 426)
eftersom Done-flipparna gjordes mot en bas på `988e0d3b` medan byggarnas PR:er
landade med egna kortändringar. Rebase med `git checkout --ours` (upstreams
version under rebase) per kortfil, `rebase --continue` (stängningscommiten
föll bort som tom), och sedan samma `task edit --append-notes` + `-s Done` en
gång till — samma form S123:s första orkestrerare använde vid pausen
(`00ea4f9c`, `a155249f`). Sökvägarna måste läsas med
`git -c core.quotePath=false`, annars kommer de octal-escapade och matchar
inte. Regel: flippa Done FÖRST när PR:en landat, från en gren skapad från
den landade main, eller räkna med rebasen.
