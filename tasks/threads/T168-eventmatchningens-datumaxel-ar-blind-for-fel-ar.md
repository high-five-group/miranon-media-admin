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
  fält-ändring i basen. **Rättad formulering 2026-08-22:** raden sade
  tidigare *"staging autonomt, prod kräver Marcus GO"*, vilket läste som om
  fältet fanns i prod. Det gör det inte — `284.1` byggdes staging-only på
  Marcus GO (kortets § Implementation Notes), och prods `Anmälningar` saknar
  BÅDA fälten (`Datum (from Event)` och `Eventmatchning`; mätt fält för fält
  2026-08-22). Prod ärver den rättade formeln via `TASK-284.6` — ingen egen
  prod-rättning tillkommer av `T168`.
- **`284.2` är ännu inte live.** Rättas skriptet innan det klistras in
  slipper vi två omgångar.
- `284.3` (resolutionen) berörs inte — den skriver, den bedömer inte.

## Utfall — rättad i staging 2026-08-22 (S110 resume 3)

Marcus beslut: *"Ja rätta nu"*. Rekommendationen ovan verkställd i BÅDA
ytorna, med samma jämförelse så de inte kan drifta isär.

**Formen jämförs som förut** (den löser de tre mätta formateringsklasserna);
**årtalen prövas som en EGEN axel.** Formen: extrahera första fyrsiffriga
årtalet ur varje sida och pröva att det förekommer i den andra sidans råa
sträng — **tvåvägs**, så jämförelsen är symmetrisk och tål att facit
upprepar årtalet vid månadsskifte. Saknas årtal på någondera sidan ger
axeln ALDRIG avvikelse (`ADR-122` beslut 4, oförändrad).

Det är den praktiska formen av "jämför årtalens mängd": för högst två
distinkta årtal — vilket alla realistiska datumsträngar bär — är den
ekvivalent med en mängdjämförelse.

### Bevis

**Ny permanent fixtur:** `ZZ-TASK-284.1 Fixtur Fel år`
(`recdKgK82XA0Oa2ee`), registrerad i `tests/api/fixtures.ts`. Egen `Datum`
= `31 oktober–1 november 2025` mot facit `31 oktober 2026 – 1 november
2026`. Mätt i BÅDA riktningar mot samma rad:

| | `Eventmatchning` |
|---|---|
| Före rättningen | **`OK`** — buggen bekräftad live, inte bara härledd |
| Efter rättningen | **`Avviker`** |

**Regressionsskyddet:** de fyra befintliga fixturerna OFÖRÄNDRADE över
rättningen — `OK` (tre formateringsklasser) · `Avviker` (ort + kurs) ·
`OK` (tom ort, trestegslogiken) · `Utan event`.

**Skriptet:** `datumAvviker` prövad isolerat i Node, 9 fall gröna —
inklusive årsskiftesspannet `2026→2027` (ska INTE fälla) och saknat årtal
på en sida (ska INTE fälla).

### Landat

- Formelfältet `fldYz2NRZJjyX8VWB` i staging `apphjj8Q7lkXCMsL4`,
  `actionId: actQ2Y7XUOsqI5dMo`.
- Skriptet + fixtur-registreringen: commit `f5b7ee25` på `#1722`:s gren
  (`spec/s110-284.2-vakten-matchningssteget`, kvar som draft).

### Rättningens FÖRSTA form revs samma dag — den bröt tomma datum

Den form som beskrivs ovan (extrahera årtalet, jämför som egen axel) var
korrekt i JavaScript men **fel som Airtable-formel**. Porterad blev den
`REGEX_EXTRACT({Datum} & "", "\\d{4}")` — och Airtables `AND()` kortsluter
**inte**, så uttrycket evaluerades även när tomt-guarden redan var falsk.
`REGEX_EXTRACT` utan träff ger **fel**, inte blank.

**Utfall:** `#ERROR!` på VARJE anmälan med Event-länk och tomt `Datum`.
Mätt live i staging på befintlig data (`Petra Kvist`, `Elin Vikström`,
sentinel- och arbetskö-fixturerna), inte bara på nya rader. Det bröt
`ADR-122` beslut 4, markören i anmälningslistan och åtgärdsköns räknare
samtidigt.

**Varför den första verifieringen inte fångade det:** de fyra fixturerna
mättes och rapporterades oförändrade — men **ingen av dem hade tomt
`Datum`**. `Fixtur Backfill` bär tom *Ort*. Tomheten som fanns testades;
tomheten på den axel som faktiskt ändrades gjorde det inte. Fyndet kom
först i `284.2`:s ände-till-ände-pass, på en express-rad som saknar
`Datum` helt.

**Slutlig form** (`act9gDpZDjafASryW`, och `e81192ec` för skriptet):
`REGEX_EXTRACT` är borta helt — inte inlindad i fler guards. `normDatum`
kollapsar i stället ett årtal som följs av tankstreck
(`\d{4}\s*([-–—])` → `$1`), så båda sidor bär årtalet exakt en gång och
det jämförs som en del av strängen. Ingen funktion som kan fela, alltså
ingen guard att glömma. Det var alternativet denna tråd själv pekade ut
som *"möjligen enklare i Airtable-formelsyntax"*.

**Medveten kant, mätt till noll:** ett ifyllt `Datum` som SAKNAR årtal
fäller nu mot ett facit som har det (den strippande formen gav dem lika).
Populationen är **0 rader i både prod och staging** (mätt 2026-08-22) —
fältet fylls ur `AnmälningsURL`:ens parameter, som alltid bär årtalet.
Kanten är dessutom åt rätt håll för en fail-closed vakt: ett ofullständigt
datum är inte ett TOMT fält.

**Lärdomskandidat:** en rättning som verifieras mot befintliga fixturer
prövar den tomhet som råkar finnas i dem, inte den axel ändringen rör.
Och en konstruktion som är korrekt i ett språk kan vara fel i ett annat
med samma semantik på ytan — `AND()` som inte kortsluter är inte en bugg,
det är en annan språkfamilj.

### Kvarstår

Prod-utrullningen via `TASK-284.6` — den skapar fälten för första gången
och ärver därmed den rättade formeln direkt. `T168` stängs när `284.6`
är verkställd.

## Besläktat

- `ADR-122` beslut 3 (formelfältet) och beslut 4 (trestegslogiken).
- `T158` — kalenderlänk-driften, rotorsaken som gör årsfallet sannolikt.
- `T167` — `284.2`:s blockering; samma skiva, annan fråga.
