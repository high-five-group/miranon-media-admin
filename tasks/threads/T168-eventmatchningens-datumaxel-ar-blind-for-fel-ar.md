---
owner: marcus803
updated: 2026-08-21
review_by: 2026-11-21
status: stable
lifecycle: active
---

# T168 — Eventmatchningens datum-axel är blind för FEL ÅR

> Registrerad i S110 (2026-08-21) vid orkestrerarens granskning av
> `TASK-284.2`:s skript, före Marcus eventuella inklistring. **`active`** —
> den rör redan LANDAD kod och bör avgöras innan vakten går live.

## Fyndet

Både `284.1`:s landade formelfält `Eventmatchning` (`fldYz2NRZJjyX8VWB`) och
`284.2`:s ännu ej live-satta skript normaliserar datum genom att **stryka
alla fyrsiffriga årtal** före jämförelsen.

Formeln, live-läst ur staging (`describe_table`, 2026-08-21):

```text
REGEX_REPLACE(LOWER({Datum} & ""), "\\d{4}", "")
```

Skriptets motsvarighet (`a1-eventmatchning-vakt.js`, `normDatum`):

```js
.replace(/\d{4}/g, '')
```

Samma konstruktion på **båda sidor** av jämförelsen.

## Vad det kostar — mätt

| Anmälans `Datum` | Eventets facit | Normaliserat | Utfall |
|---|---|---|---|
| `31 oktober–1 november 2026` | `31 oktober 2026 – 1 november 2026` | `31 oktober-1 november` | LIKA ✅ *(avsett)* |
| `12–13 september 2025` | `12–13 september 2026` | `12-13 september` | **LIKA ❌** |
| `7–8 mars 2026` | `12–13 september 2026` | olika | AVVIKER ✅ |

Rad 2 är felet: **samma datum i olika år normaliseras identiskt.**

## Varför just detta fall är det farligaste

Rotorsaken bakom hela `T158` är att Roger **duplicerar gamla
kalenderposter** på miranon.se utan att redigera URL-parametrarna. En
duplicerad post från förra året bär:

- samma kurs → kurs-axeln passerar
- samma ort → ort-axeln passerar
- samma dag och månad, annat år → **datum-axeln passerar efter strippningen**

Utfallet blir `OK`. Anmälan länkas till FÖRRA ÅRETS event, markören visas
inte, kö-raden skapas inte, och vakten fäller inte. Det är exakt den
felklass familjen byggdes för att fånga, i dess mest sannolika framtida form
— återkommande kurser går årsvis.

De 64 felmatchade rader S110 städade skilde sig i månad (`Event-10` = mars
mot september), så de fångades. Ett årsfel hade inte fångats.

## Varför strippningen finns

Den löser en verklig, mätt formateringsklass: `31 oktober 2026 – 1 november
2026` mot `31 oktober–1 november 2026`, där årtalet står **två gånger** på
ena sidan och **en gång** på den andra. Att stryka årtal helt är det enkla
sättet att göra dem jämförbara — och priset är att årtalet slutar bära
information.

## Rekommenderad riktning (Marcus avgör)

Behåll shape-jämförelsen, men jämför årtalen **separat**:

1. Normalisera som i dag för formen (årtal strippade) — fångar
   formateringsklasserna.
2. Extrahera dessutom **mängden** årtal ur båda sidor. Skiljer sig
   mängderna → **avvikelse**.

Det bevarar alla tre mätta formateringsklasser (upprepat årtal ger samma
mängd `{2026}` på båda sidor) och stänger årsblindheten.

Alternativet — kollapsa upprepade identiska årtal till ett och jämföra med
årtalen kvar — ger samma resultat och är möjligen enklare i
Airtable-formelsyntax.

## Omfattning

- **`284.1` är LANDAD och `Done`** — formelfältet driver markören
  (`AnmalningarList`) och räknaren (åtgärdskön på Hem). Rättningen är en
  fält-ändring i basen: staging autonomt, prod kräver Marcus GO.
- **`284.2` är ännu inte live.** Rättas skriptet innan det klistras in
  slipper vi två omgångar.
- `284.3` (resolutionen) berörs inte — den skriver, den bedömer inte.

## Besläktat

- `ADR-122` beslut 3 (formelfältet) och beslut 4 (trestegslogiken).
- `T158` — kalenderlänk-driften, rotorsaken som gör årsfallet sannolikt.
- `T167` — `284.2`:s blockering; samma skiva, annan fråga.
