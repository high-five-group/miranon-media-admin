# En mätning som inte isolerar mekanismen bevisar fel sak

**[UNIVERSAL] En instrumenterad mätning kan vara sann och ändå bevisa fel
sak, om den inte isolerar exakt det villkor den påstår sig mäta.** Mätt
2026-09-03 (S115, `tasks/sessions/2026-09-03-session-115.md` Del 7, `#2267`
runda 2–3): byggarens mount-instrument visade "remount=true i båda
cache-lägen" och drog slutsatsen att ombokningssteget remountades korrekt —
men instrumentet mätte i själva verket `isPending`-skelettets unmount vid
cache-miss, inte den kritiska övergången, och testet gjorde dessutom
`page.goto` FÖRE den övergången i stället för en varm klient-sidig
navigering. Granskarens källäsning av `node_modules/@tanstack/
react-router/dist/esm/Match.js` (1.170.21) avgjorde: `key` beräknas där
enbart ur `remountDeps`, som aldrig var satt — premissen föll på
bibliotekets faktiska implementation, inte på byggarens mätvärde. Regel:
vid oenighet om en mekanism, läs bibliotekets källa i stället för att lita
på ett eget instrument, och bygg testet så det träffar exakt villkoret
(varm cache, samma app-instans, ingen `page.goto`) — annars mäter testet
sin egen uppställning, inte det påstådda beteendet.
