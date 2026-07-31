# En räkning utan utskrivna poster granskas aldrig

**Ett sammanfattande tal — "tre precedenter", "fyra fall", "nio grindar" — är
kontrollerbart bara om posterna står uppräknade bredvid det. Står talet ensamt
läser nästa person det som resultat i stället för som påstående, och citerar det
vidare utan att räkna om.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-31):** `ADR-081` § Ärlighet om underlaget summerade till
*"tre solida precedenter för principen"* — direkt efter en lista med **två**
poster. Talet motsades alltså av texten det sammanfattade, på samma sida, med tre
raders avstånd.

Felet överlevde **tre månader, två amenderingar och ett research-pass som läste
just den sektionen.** Passet skrev *"ADR-081:s tre precedenter är i praktiken två
för själva tilldelningen"* — det räknade om precedenternas **bärkraft** men ärvde
totalen `3` oprövad. Den som granskar ett tal på en axel antas ha granskat det på
alla.

**Varför den här klassen är svårare än en felaktig siffra i löptext:** ett
aggregat har ingen naturlig plats där det motsägs. En felräknad summa i en tabell
faller mot sina egna rader; ett tal i prosa har inga rader att falla mot. Det blir
sant genom upprepning — `docs/decisions/README.md`:s ADR-rad bar samma *"tre"* med
samma två uppräknade poster, och de två kopiorna bekräftade varandra.

**Formen som fångar det:** skriv aldrig ett aggregat utan att posterna står
bredvid, i samma stycke eller lista. Räknas något per kategori ska räkningen stå
per kategori — `tre för halva 1 (a, b, c) · tre för halva 2 (d, e, f)` är
granskningsbart; `tre solida precedenter` är det inte. Regeln kostar en rad och
gör talet falsifierbart av den som läser i stället för av den som skrev.

Besläktad: [[harled-ur-kallan-skriv-aldrig-av-kortets-tal]] ·
[[tre-samstammiga-kopior-ar-osynliga-for-lasning]]
