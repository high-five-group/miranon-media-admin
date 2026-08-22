---
owner: marcus803
updated: 2026-08-22
review_by: 2026-11-21
status: stable
lifecycle: closed
---

# T161 — `ADR-122` § Fynd 1 felkarakteriserar `Event (namn)` som uppslagsfält

> Registrerad i S110 (2026-08-21) under bygget av `TASK-284.1`. Fyndet gjordes
> av bygg-agenten och **verifierades oberoende av orkestreraren** med egen
> `describe_table` mot prod (`app8uGPrVCVOm6LfD`, `tbloOcrppVoyrHbrq`,
> read-only). Tråden väntar på Marcus — en låst ADR amenderas inte på
> agentens eller orkestrerarens bevåg.

## Vad ADR:n säger

`ADR-122` § Tre fynd som formade beslutet, punkt 1, listar `Event (namn)`
(`fldK1aYEm3iCg8OOh`) bland **"lookup-fält från det länkade eventet"**, och
avslutar meningen med *"live-verifierat via `describe_table` 2026-08-21"*.

## Vad basen säger

```json
{"name":"Event (namn)","type":"formula",
 "options":{"formula":"{fld6RC3r0R9tuKgdF}",
            "referencedFieldIds":["fld6RC3r0R9tuKgdF"]},
 "id":"fldK1aYEm3iCg8OOh"}
```

`fld6RC3r0R9tuKgdF` är `Vill anmäla sig till` — anmälans **egna**
`multipleSelects`-fält, som ADR:n i SAMMA mening listar på påstående-sidan.
Fältet är alltså en formel som ekar anmälans egen text, inte ett uppslag från
det länkade eventet.

## Varför det spelar roll

Vakten i `ADR-122` bygger på att facit och påstående ligger sida vid sida.
`Event (namn)` står på facit-sidan i ADR:n men bär påstående-sidans data.
Hade kursnamns-axeln jämförts mot det fältet vore jämförelsen en
**tautologi** — alltid lika, vakten hade aldrig fällt på kurs, och det utan
felmeddelande.

`TASK-284.1` byggdes inte så: agenten mätte fälten i stället för att läsa
ADR:n som facit och använde `Kurs (from Event)` (`fldfqU6MfBQdaeLUk`), som är
ett äkta uppslag (`fieldIdInLinkedTable: fldNIc8I2ynUoLkNn`). **Bygget är
alltså korrekt — det är ADR-texten som är fel.**

## Vad som INTE faller

Beslutet står. Korsfältsvalidering kräver fortfarande ett nytt uppslagsfält
och ingen ny mekanism — `Ort (from Event)` och `Kurs (from Event)` är äkta
uppslag, och `Datum (from Event)` skapades i `TASK-284.1`. Det är det
**stödjande faktapåståendet** som faller, inte slutsatsen det stödde.

## Vad som behöver hända

1. Marcus kvitterar att ADR:n amenderas — öppen rivning med daterad
   amendering, aldrig tyst redigering.
2. § Fynd 1 rättas: `Event (namn)` flyttas till påstående-sidan med sin
   formel-definition utskriven, och meningens `describe_table`-hänvisning
   korrigeras.
3. Notera i amenderingen att felet stod i en ADR som påstod live-verifiering
   — det är den egenskapen som gör posten värd att minnas, inte fältet i sig.

## Besläktat

- `docs/reference/data-model.md` — bygg-agenten bokförde fältets verkliga form
  där i `TASK-284.1`:s commit, så den auktoritativa fält-ytan är redan rättad.
- `ADR-100` § 1 (sanningshierarkin): vid motsägelse mellan ADR-prosa och
  datakällans faktiska schema vinner den yta domäntabellen pekar ut för
  fält-data — `data-model.md`, inte ADR:n.

## Hur tråden stängdes (2026-08-22)

Marcus kvitterade amenderingen (*"Ta T161 då"*, S110 Del 13). § Fynd 1 i
`ADR-122` är rättat på plats med synlig markering — `Event (namn)` står nu
på påstående-sidan med formeln utskriven — och en daterad post i
`ADR-122` § Updates bär rivningen, varför beslutet står, och varför posten
är värd att minnas: en ADR som påstår live-verifiering läses inte om.

Bekräftat efter stängningen av det skarpa provet i prod (`284.6`,
2026-08-22): kurs-axeln fällde på *"Fjärrskådning" vs "Resor i medvetandet
1"* — facit-sidan läser `Eventplanering.Event (text)`, inte `Event (namn)`.
Tautologin som tråden varnade för finns inte i bygget.
