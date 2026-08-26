# Closure-grindens 24-timmars-karens kan dölja färska Done-flippar som saknar sin landnings-pekare — "noll oskötta" kan vara sant bara temporärt

**En slutmätning som visar "N röda, noll oskötta" direkt efter en batch
Done-flippar kan vara sann ENDAST för att de färska flipparna ännu
ligger inom closure-grindens 24-timmars-karens — en flippad post vars
Final Summary saknar sin `Landning: PR #<nr>`-pekare (per `TASK-281`s
DoD-mekanism) blir röd så fort karensen löper ut. En slutmätning tagen
omedelbart efter flippar är alltså inte en slutlig mätning.**

Instans (S112, Del 3 § Slutmätningen + Del 4 § Handoff-verifikat,
2026-08-24→26): slutmätningen 2026-08-24 visade **14 röda av 643, noll
oskötta**. Vid resumens ommätning (2026-08-26, agent, read-only,
snapshot `179325fd`) hade talet gått till **15 röda av 650**: samma 11
poster historisk skuld + `241.5` + `284.4`, plus **`190` och `193`** —
S112:s egna våg 3-flippar (`#1943`) vars Final Summary saknar
`Landning: PR #1940`. De låg inom 24-h-karensen vid slutmätningen och
var därför osynliga då. `309.1` hade under tiden försvunnit ur listan
(en parallell S108-session flippade den).

**Det generella:** en grace-period-grind (karens) är rätt design för
att undvika att fälla en post innan dess dokumentation hunnit ikapp —
men den gör varje mätning tagen INNAN karensen löpt ut till en
ögonblicksbild med ett känt utgångsdatum, inte ett slutgiltigt facit.
En "grön" slutmätning tagen samma dag som flipparna landade måste
antingen omprövas efter karensen, eller uttryckligen flagga vilka
poster som fortfarande är inom fönstret och därför overifierade.
