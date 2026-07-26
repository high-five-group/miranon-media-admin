# Deltaganden — live-verifierat schema (staging, 2026-07-26)

Verifierat via Airtable MCP mot `apphjj8Q7lkXCMsL4` (staging),
tabell `tbldWHH6sSHWoQPHH`. Detta uppfyller CLAUDE.md:s **Airtable-schema
före write** och L294-mönstret (en referens kan inte bevisa frånvaro) —
kravet gäller innan någon allowlist-rad för närvaro-write låses.

## Skrivbara fält (allt annat är formel, rollup eller lookup)

| Fält | Fält-ID | Typ | Not |
|---|---|---|---|
| Anmälan | `fldwQdDpRK8vByNhb` | multipleRecordLinks → Anmälningar | `prefersSingleRecordLink: true` |
| Event | `fldaj5mbpU3yPw2np` | multipleRecordLinks → Eventplanering | |
| Session | `fldBPZnsDL0bNIRHx` | singleSelect | Dag 1 · Dag 2 · Föreläsning |
| **Status** | `fldRFOzNqVswqZ1mN` | singleSelect | **sex val, se nedan** |
| Noteringar | `fldpCVTUC0C47ci0S` | multilineText | |
| Avstämt | `fld61tbzc2fqqf116` | dateTime | se fällan nedan |
| Person (länk) | `fldiU06kbTxSafkm4` | multipleRecordLinks → Personer | |

`Status`-valen med sina choice-ID:n (krävs vid filtrering, MCP-instruktionen):

| Namn | Choice-ID |
|---|---|
| Ej avstämt | `sel6U4DjySnASdN8C` |
| Närvarande | `selL6dOK1XDN8UmKQ` |
| Frånvarande | `selhXfNgpF7dCoFn4` |
| Försenad | `selckiXY869eiLmrX` |
| Avbröt | `selJ1f9Yv9J7jjqrH` |
| Deltog online | `selWGhz7v8MPTVpT8` |

Detta **bekräftar** `docs/reference/data-model.md:204-217` (sex options) —
referensen stämmer mot basen. S87-spaningens öppna lucka ("inte
live-verifierat") är därmed stängd.

## Fynd 1 — `Registrerad av` går inte att lita på för attribuering

`fldhx3tludhu1gH7w` är av typen **`lastModifiedBy`**, alltså inte skrivbar
och inte styrbar. Airtable sätter den till den som senast ändrade posten —
och vid en API-skrivning är det **token-ägaren, inte den inloggade Lotta**.

Det är exakt samma attribuerings-fälla som fälldes för Airtable record
comments vid ADR-075:s vägval (PRD task-18 beslut 13: *"API-skrivningar
bokförs på token-ägaren, inte på den inloggade"*). Konsekvens för check-in:
en närvaro-registrering kommer att stå som gjord av integrationskontot
oavsett vem som checkade in. Vill vi veta VEM som checkade in måste det
bäras av ett eget fält, precis som Anteckningar-tabellens författarfält.

Bokförs som öppen fråga till check-in-grillningen — inte löst här.

## Fynd 2 — `Avstämt` ska appen sannolikt inte skriva

Fältet är skrivbart (dateTime), men enligt automations-referensen sätts det
av A8 vid statusändring. **MCP kan inte se automationer** (CLAUDE.md:s
guard), så detta är verifierat mot dokumentationen, inte mot basen —
påståendet är alltså referens-grundat, inte live-grundat. Skriver appen
fältet samtidigt som A8 gör det får vi två skrivare på samma fält.

Kräver HAR-export eller skärmdump av A8 för att avgöras skarpt. Öppen.

## Fynd 3 — närvaropoängen är binär i källan

`Närvaropoäng` (`fldwuo94BY46VUOm4`) är en formel:

```text
IF(OR(Status="Närvarande", Status="Deltog online"), 1, 0)
```

Alla sex statusvärden kollapsar alltså till 1 eller 0. Det stödjer
research-passets slutsats att **dörren är binär** (`Ej avstämt` ↔
`Närvarande`) medan de fyra övriga statusarna är register-arbete: en
dörr-toggle driver närvaropoängen korrekt utan att röra de andra värdena.

## Vad detta betyder för write-forken

Per-post-skrivning mot `Deltaganden.Status` är **möjlig och smal**: ett
singleSelect-fält, sex kända choice-ID:n, en formel som konsumerar det.
Ingen ny tabell, inget nytt fält, ingen additiv bas-ändring krävs för
dörr-vertikalen — vilket gör den billigare än S87-spaningen antog.

Kvarstår att avgöra i grillningen: attribueringen (fynd 1), `Avstämt`-
ägarskapet (fynd 2), och om "markera alla"-genvägen ska gå via A9/A10 på
Eventplanering eller via en batch-EF.
