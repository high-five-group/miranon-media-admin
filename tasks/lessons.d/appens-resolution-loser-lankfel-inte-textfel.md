# Appens resolution löser länkfel, inte textfel — en formaterings-falsk-positiv blir en permanent kö-rad

**"Koppla till event" sätter `Event` + `EventKey`. Anmälans egen
`Datum`-/`Ort`-text rörs inte. En rad som ligger i åtgärdskön för att
TEXTEN avviker i form (inte i sak) går därför inte att lösa från appen —
Lotta kan välja rätt event hur många gånger som helst, raden blir kvar.**

Mätt i S110 (2026-08-22): i staging (steg 7) låg texten rätt och
resolutionen gav `OK`; i prod låg två rader (ID 197 `+`-kodade mellanslag,
ID 960 kalenderlänkens mellanform) som resolutionen inte hade kunnat
flytta. De rättades i basen (ADR-063, spårbarhetsrad) och återfallet
bokfördes som `TASK-293`.

Designkonsekvens för `ADR-122`-familjen: det finns två felklasser i kön —
**fel länk** (resolution i appen är rätt verktyg) och **fel form på
texten** (normalisering i formel + skript är rätt verktyg, eller en
datarättning). Kön visar dem likadant. Nästa gång en kö-rad inte försvinner
efter resolution är första frågan *vilken klass*, inte *vad gick fel i
skrivningen*.
