# Trådnummer har ingen kollisionsspärr — `check_active_branches` skyddar kort-ID:n, inte trådserien

**`backlog/config.yml`s `check_active_branches: true` (TASK-93) läser andra
aktiva grenar innan CLI:t allokerar ett kort-ID. Trådnummer allokeras i stället
för hand, genom att läsa `tasks/threads/README.md` och ta nästa lediga — en
läsning av det EGNA arbetsträdet, som per definition inte ser vad en parallell
session håller på att skriva. Följden: kortnummer kolliderar sällan, trådnummer
kolliderar rutinmässigt så fort två sessioner arbetar samtidigt.**

Mätt över tre dygn i klustret S108/S109/S110, fyra instanser:

| Instans | Nummer | Vad som hände |
|---|---|---|
| 2026-08-21 | `T157` ×2 | S109 och S110 mintade samma nummer samma dag; S110 omnumrerade till `T158` |
| 2026-08-21 | `T160` | S110 läste disk, såg `T159` som högsta, men S109:s `T160` landade i synken strax före mint — fångad, S110 tog `T161` |
| 2026-08-21 | `T161` | S110 landade `T161` (`#1700`); en parallell sessions `#1701` bar samma nummer och blev DIRTY på indexraden |

Skyddet som FUNGERAR är inte en spärr utan en vana: **re-derivera numret mot
disk i mint-ögonblicket, inte ur en handoff eller ur minnet, och committa
kortet i samma andetag som du skapar det.** Den vanan fångade `T160` ovan.
`ADR-081`s regel "nummer tilldelas vid landning" avgör dessutom tvisten utan
förhandling när två anspråk ändå möts: den som landar först behåller numret,
den andra numrerar om.

Grindarna hjälper inte här. `check-thread-index.sh` fäller på dubblett-nummer
och lucka — men bara INOM ett arbetsträd, alltså först efter att kollisionen
redan skett i ett annat. Den är en konsistensvakt, inte en allokeringsvakt.

**Öppen fråga, ej besvarad här:** om trådserien ska få en mekanism motsvarande
`check_active_branches`, eller om vanan plus landnings-regeln räcker. Det är
ett avvägningsbeslut — en gren-skannande allokering kostar det `TASK-238` mätte
för kort-CLI:t (`task <id>` 1,96 s → 28,5 s med flaggan på), och trådar mintas
långt mer sällan än kort. Frågan hör hos Marcus, inte i en lärdom.
