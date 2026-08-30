# Två brutna invarianter kan maskera varandra — negativ kontroll en i taget

**[UNIVERSAL] En assertion som jämför två renderade kanter mot varandra
("skuggan slutar där kortet slutar") blir GRÖN när båda är trasiga på samma
sätt — bryts rännan (0 px) och skuggans `right` (0) samtidigt sammanfaller
kanterna igen.** Mätt av bygg-agenten för `TASK-309.44` (2026-08-30) när
granskarfyndet från PR #2128 skulle bevisas tvåsidigt: med `scrollbar-inline`
borttagen OCH skuggans `right` nollad var skugg-testet grönt; först när varje
brott provocerades ISOLERAT föll rätt test på rätt sätt (*"rännan ska vara
reserverad i overflow auto (mätt 0 px)"* respektive *"skuggan slutar vid
899 px, kortet vid 888 px"*). Regel: en negativ kontroll per invariant, aldrig
flera brott i samma körning — relativa assertioner (A === B) bevisar bara att
A och B rör sig ihop, och det gör de även när båda har fallit.
