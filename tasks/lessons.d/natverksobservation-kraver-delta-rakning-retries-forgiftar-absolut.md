# Nätverksobservation kräver delta-räkning per steg — retry-lager förgiftar absoluträkning

**Ett test som räknar nätverksanrop ackumulerat över flera interaktionssteg
räknar även RETRY-LAGRETS omtag från tidigare steg. En provocerad felväg
(abortad request) genererar N omtag som alla syns i request-loggen — nästa
stegs assertion "exakt 1 anrop" läser då N+1. Räkna DELTAT från en snapshot
tagen omedelbart före det observerade steget.** `[UNIVERSAL]`

Mätt 2026-08-15 (S103, QA-vandringen 214.8): felvägs-steget abortade
`update-record` via route-intercept; husets `fetchWithRetry` gjorde fyra
väntade omtag. Nästa stegs assertion `writes.length === 1` (absoluträknad
från testets start) läste 5 och fällde — appens beteende var korrekt i båda
stegen, mätinstrumentet räknade fel population. Fixen: snapshot av räknaren
före klicket, assertion på `slice(innan)`.

**Det generella:** varje observations-assertion behöver en explicit
population — "alla anrop sedan testets start" är nästan aldrig den avsedda.
Gäller särskilt när samma test både PROVOCERAR fel (som multiplicerar
trafik via retries) och BEVISAR exakthet (som kräver ren räkning); de två
lägena delar logg men inte population.
