# Amendering 2026-08-22 — tomma bokstäver tonas ned (TASK-283.3)

**Pass:** TASK-283.3 (Skiva: Tomma bokstäver tonas ned — raden byter aldrig
längd), barn av PRD TASK-283 (bokstavsindex i personlistan). Bygger direkt
vidare på TASK-283.2 och dess sidofil
`AMENDERING-2026-08-22-bokstavsraden-ovanfor-listan.md`.

**Berört manifest:** `tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json`,
yta `personlistan` (godkänd 2026-08-10, citat *"Ser bra ut, godkänner"*, sha
`4ebdcfc85a78df14c47cff058472d1b4da0d8adf`).

**Skäl för sidofilen, inte ett fält i manifestet:** ett stämplat manifest är
agent-fruset i sin helhet. `scripts/deny-facit-godkand-skrivning.sh` prövar det
simulerade RESULTATET av en Edit/Write, och varje stämplat manifest har per
definition ett satt `godkand` — alltså nekas även en ändring som inte rör
fältet ([`ADR-104`](../../../../docs/decisions/ADR-104-facit-stampeln-kanalseparation.md)
§ Beslut 2). En `amendering`-nyckel i JSON:en är därför inte en möjlig form.
Bokföringen bor i denna fil enligt
[`ADR-102`](../../../../docs/decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md)
§ A3. Föregångare i samma katalog:
`AMENDERING-2026-08-22-svensk-sortering-sentinel-sist.md` (TASK-286.3),
`AMENDERING-2026-08-22-task-286-2-referenser.md` och
`AMENDERING-2026-08-22-bokstavsraden-ovanfor-listan.md` (TASK-283.2).

## Avvikelsen

**Vad som ändrades.** Bokstavsradens knappar har fått ett tredje läge. En
bokstav som ingen i registret börjar på renderas nedtonad och går inte att
aktivera:

| läge | text | platta | attribut |
|---|---|---|---|
| vald | `text-text` | `bg-primary-tint`, `border-primary` | `aria-pressed="true"` |
| aktiv, ovald | `text-text-secondary` | `bg-bg-muted` | `aria-disabled="false"` |
| **nedtonad** | **`text-text-muted`** | **ingen** | **`aria-disabled="true"`** |

Antalet knappar, deras ordning, deras etiketter och deras geometri är
OFÖRÄNDRADE. Nedtoningen byter enbart `color` och `background-color`.

**Två prod-synliga följder utöver färgen:**

1. **En tom bokstav går inte längre att trycka på.** Tillståndet "bokstav utan
   träffar" är inte borta — det nås fortfarande via URL:en (`?bokstav=Ö`, ett
   bokmärke eller en delad länk) och tomlägets copy är oförändrad. Men vägen
   dit via ett klick i raden är stängd, med avsikt (kortets AC #1).
2. **Under `prefers-contrast: more` blir även den AKTIVA knappens text
   mörkare** (`text-text-secondary` → `text-text`). Det är inte en fristående
   putsning: utan den kollapsar den nedtonade textens kontrasthöjning in i den
   aktivas färg, och nedtoningen slutar synas i just det läge där den behövs
   mest. Fångat av mätning, se nedan.

**Grunden:** PRD `TASK-283` och dess skiva `TASK-283.3`, byggd mot
[`ADR-123`](../../../../docs/decisions/ADR-123-forladdat-personregister-sok-och-bokstavsindex-i-klienten.md)
beslut 3 (bokstavsindexet som härledning ur den laddade klientarrayen). Marcus
beslut om VÄGEN för denna ytas facit-amendering är oförändrat väg A (`T157`,
2026-08-21): bygget landar först, Marcus granskar visuellt, och FÖRST DÄREFTER
regenereras ARIA-referenserna i egen commit — `TASK-283.4`.

**Vad som INTE ändrades i listan:** ingenting. Diffen rör
`src/lib/person-sok.ts` (en ny ren funktion) och `src/components/persons/PersonsList.tsx`
(bokstavsradens två delkomponenter plus en `useMemo`). Ingen listrad, ingen
listcontainer och ingen route-fil ingår.

## Mätning

### Raden byter inte längd (kortets AC #3)

Radens egen rect OCH varje enskild knapps rect, mätta med
`getBoundingClientRect` i fyra tillstånd per bredd — utgångsläge ·
bokstavsfilter valt · sökterm med träffar · tomläge. Assertionen jämför hela
geometrin, inte bara bredden, så en knapp som flyttat en halv pixel fäller.

| viewport | radens yta | rader | minsta träffyta | identisk i alla fyra lägena |
|---|---|---|---|---|
| 320 px | 288 x 118 px | 4 | 28 x 28 px | ja |
| 375 px | 343 x 88 px | 3 | 28 x 28 px | ja |
| 430 px | 398 x 88 px | 3 | 28 x 28 px | ja |
| 768 px | 568 x 58 px | 2 | 28 x 28 px | ja |
| 1280 px | 568 x 58 px | 2 | 28 x 28 px | ja |

Talen är BYTE FÖR BYTE desamma som TASK-283.2 mätte före nedtoningen — vilket
är det egentliga beviset: nedtoningen rörde inte geometrin alls.

### Kontrasten (tillgänglighetsribban 11)

Mätt i renderad yta med `prefers-reduced-motion: reduce` så färgövergången är
avstängd och det som läses är VILOLÄGET. Bakgrunden härleds genom att gå uppåt
till första HELT opaka förälder.

| läge | nedtonad | aktiv, ovald |
|---|---|---|
| normalt | `#6b6b6b` på vit = **5,33:1** | `#525151` på `#f5f5f3` = 7,25:1 |
| `prefers-contrast: more` | `#525151` på vit = **7,91:1** | `#242424` på `#f5f5f3` = 14,22:1 |

Båda passerar WCAG 1.4.3 (AA) i båda lägena. Det är ett krav och inte en
artighet: en `aria-disabled`-knapp är fokuserbar, och en fokuserbar kontroll är
inte undantagen kontrastkravet så som en inaktiv är.

### Promoverings-grinden: noll nya fällningar

Samma kommando som TASK-283.2 körde
(`npm run test:visual -- tests/visual/personer-promoverings-grind.spec.ts`):

| | passerade | fällda |
|---|---|---|
| TASK-283.2:s bokförda utfall | 10 | 6 |
| efter denna skiva | 10 | **6** |

Och det är SAMMA sex fall: `listläget` samt de två `?variant=`-degraderings-
fallen, på båda vyporterna. Orsaken är oförändrad — sentinel-radens flytt i
`TASK-286.3`, bokförd i `AMENDERING-2026-08-22-svensk-sortering-sentinel-sist.md`.
Denna skiva tillför **noll** nya fällningar.

Not om beviskraften: talet 10/6 för läget FÖRE denna skiva är hämtat ur
TASK-283.2:s sidofil, inte om-mätt på `main` i detta pass. Talet EFTER är mätt
på denna gren.

**Mekanismen, så slutsatsen inte läses som tur:** Playwrights
`toMatchAriaSnapshot` matchar PARTIELLT, och de sex referenserna innehåller
ingen bokstavsrad alls. Ett `[disabled]`-tillägg på en nod referensen aldrig
nämner kan därför inte fälla den. Att de passerar betyder alltjämt INTE att de
beskriver ytan — de är gröna men ofullständiga, och skulden är fortsatt
`TASK-283.4`:s.

## Klassning: **(c)** — formen ändras faktiskt

`ADR-102` § A2 steg 1 är mekaniskt: `godkand` är satt, alltså inte klass (a).

Steg 2:s test — **"Påverkar ändringen vad en användare ser i prod?"** —
besvaras **JA**, utan gränsdragning. I prods register (559 personer) är det
färre knappar än i testfixturen som är tomma, men Ä och Ö är två av dem, och
Lotta ser dem nedtonade vid varje besök på `/personer`. Att en knapp dessutom
slutar svara på klick är en beteendeändring och inte enbart en färgändring.

Klass (b) är utesluten: den kräver att skillnaden mot prod är en ARTEFAKT
(fixtur, rendering, miljö) och att det kan sägas med en mätning. Här är
skillnaden tvärtom exakt det avsiktliga, prod-synliga tillägget. Att
promoverings-grinden inte fäller på det är en egenskap hos MATCHAREN, inte ett
bevis för att formen står still — samma resonemang TASK-283.2 förde, och
osäkerhet eskalerar uppåt, aldrig nedåt (§ A2).

`ADR-102` § A4 namnger klassen ytterligare: detta är en **utvidgning av
formen**, och B1 (*"vid motsägelse vinner prototypen"*) gäller INOM den låsta
formen, aldrig mot en avsiktlig utvidgning av den.

## Vad som INTE är amenderat

Manifestets låsta formbeslut för ytan `personlistan` är samtliga orörda, mätt i
samma körning som ovan (de tio gröna fallen täcker sökläget, tomläget och
axe-golvet på båda vyporterna):

- tonal kortyta med `divide-y`-avdelare — orörd
- låst radhöjd — orörd
- status (`Aktiv anmälan`) som egen kolumn med reserverad plats — orörd
- e-post ensam på kontaktraden — orörd
- interaktionsraden avskild med 4 px, utan ikon — orörd

Ingen nod inuti `list "Personer"` har lagts till, tagits bort eller döpts om.
Sid-inseten och h1-formen i `src/routes/_authenticated/personer/index.tsx` är
likaså orörda; filen ingår inte i diffen. Tomlägets copy är oförändrad sedan
TASK-283.2 — inklusive `Ingen person börjar på X.`, som nu nås via URL i
stället för via ett klick.

`slutlage-tonal-{desktop,mobil}.png` och pixel-baselinen `personer.png` är
orörda och därmed en generation bakom vad gäller bokstavsraden. Baselines föds
i CI, aldrig lokalt (`CONTRIBUTING.md` § Visuell regression).

**Referens + hash:** ytan `personlistan` deklarerar INGEN `referenser`-array i
`facit.json` (verifierat på denna gren), så `check-facit.sh` invariant (d)
hash-jämför ingenting här och ingen hash-rad är tillämplig. Det betyder också
att den mekaniska bevakningen av just denna ytas referenser fortfarande saknas
— `ADR-102` § A5 punkt 2 kräver att `referenser` deklareras MEDAN manifestet är
ogodkänt, vilket gör `TASK-283.4` till det naturliga tillfället.

## Omstämplings-läge

**VÄNTAR MARCUS OMSTÄMPLING.** `godkand` rörs aldrig av en agent
(`ADR-104` § Beslut 2), och för klass (c) avgörs omstämplingen i Marcus egen
kanal — `ADR-102` § A2: *"En agent avgör detta ALDRIG själv."*

Agenten har därför:

- **INTE** rört `facit.json`.
- **INTE** rört någon av de sex `.aria.yml`-referenserna.
- Bockat kortets AC #1 till #6 (de mäter bygget), och lämnat DoD #3 åt CI.

**Vad Marcus beslut gäller:** ska nedtoningen stå kvar i den form som landat
(tom bokstav = dämpad text utan platta, kvar i tillgänglighetsträdet, inte
klickbar), och ska de sex referenserna därmed fångas om med stämpeln förnyad?
Detta är den sista skivan före omstämplingen; bekräftas formen regenererar
`TASK-283.4` referenserna i egen commit och sätter om `godkand` via Marcus
kanal.
