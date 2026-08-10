# Touchpointen ska bära kurs och ort: vad som faktiskt krävs

> **Proveniens:** avgränsat utredningspass (bakgrundsagent) för `TASK-184`,
> 2026-08-10. Kört i worktreen `.claude/worktrees/s103-t97-personvyerna`,
> ocommittat. **Read-only hela vägen:** inget fält, ingen formel, ingen
> automation och ingen datarad har ändrats i någon bas. Alla live-mätningar
> nedan är gjorda mot prod `app8uGPrVCVOm6LfD` (schema och aggregat, ingen
> persondata återges) och parietets-kontrollerna mot staging
> `apphjj8Q7lkXCMsL4`.

## Frågan

`Personer.Senaste interaktion (text)` (`fldRnujWHT3ADToC1`) ska för
anmälnings-grenen kunna säga `Anmälde sig till RIM 1 i Trollhättan 7 maj
2026`. I dag säger den `2026-04-19 18:26 – Inskickad anmälan`. Kursen och
orten saknas.

Marcus invändning, som passet fanns till för att pröva: antagandet att detta
kräver nytt länkfält plus automationsändring plus backfill är oprövat, och
det kanske räcker med en formel, en lookup eller ett länkat fält.

## Svar upp front

**Ingen backfill krävs. Men inte av det skäl invändningen antog.**

Invändningen håller i sin slutsats och faller i sin mekanism. Två saker är
sanna samtidigt:

1. **Touchpointen kan inte fås att bära kurs och ort utan ett nytt länkfält,
   och det länkfältet kan inte fyllas av någon formel.** Airtables egen
   dokumentation säger det rakt ut om lookup-fält: *"Lookup fields can only
   pull data from tables that are already connected via a linked record
   field"* (`support.airtable.com/v1/docs/lookup-field-overview`, hämtad
   2026-08-10), och om länkfält: *"There is no built-in way to have a linked
   record field computed automatically by a formula"*
   (`support.airtable.com/v1/docs/linked-record-field`, samma datum). Väljer
   man den vägen är backfill obligatorisk, för ett nyskapat länkfält föds
   tomt på samtliga befintliga rader.

2. **Men den vägen behöver inte väljas.** Anmälnings-grenen kan läsas direkt
   ur `Anmälningar` via länken `Personer.Anmälningar (länkat fält)`
   (`fld8pOivka8YdiywK`), som redan finns och redan är fylld. Ingen ny
   relation, ingen automationsändring, ingen backfill: bara beräknade fält,
   och beräknade fält får värde på alla befintliga rader i samma ögonblick de
   skapas.

Den avgörande mätningen mot härlednings-vägen: kopplingen touchpoint till
anmälan går **inte** att härleda tillförlitligt ur person plus datum. Bland
de 12 personer i prod som har fyra eller fler anmälningar stämde antalet
`Inskickad anmälan`-touchpoints mot antalet anmälningar i **4** fall, var
**lägre** i **5** fall och **högre** i **3** fall. Relationen är alltså inte
1:1 i någondera riktningen, och en härledning skulle tyst gissa fel i
majoriteten av de mätta fallen.

## Vägarna som prövades

### 1. Formel som når en annan tabell utan länk: föll

Airtable kan det inte, och det är citerat ovan ur förstapartskällan.
`docs/reference/airtable-constraints.md` har ingen egen post för just detta
(P1 till P29 genomgångna); den närmast liggande är **P9** (*"lookup över ett
länkfält ger record-ID:n, inte primärvärdet"*, rad 184) som gäller något
annat. Väggen är alltså verklig men står inte i vår katalog, vilket i sig är
ett litet fynd.

Konsekvensen: varje väg som ska ge touchpointen kurs eller ort måste gå via
ett länkfält på `Touchpoints`. I dag finns bara två:
`Person (länkat fält)` (`fldLiC0ZiUAdxXu9u`) och
`Mail logg (rådata)` (`fldcSJPi1Vweh7Gyc`). Live-verifierat med
`describe_table` mot prod 2026-08-10.

### 2. `Metadata` bär något användbart: föll

Mätt, inte antaget. `list_records` mot `Touchpoints` (`tbl22SCvlHrgcAiZi`)
med `filterByFormula: LEN({Metadata}&"")>0` gav **noll** poster. Samma filter
mot `Kanal` gav **noll** poster. Kontrollmätningen med identisk syntax
(`LEN({Typ}&"")>0`) gav poster, så nollan är äkta och inte ett trasigt
filter. `Systemkälla` är dessutom en singleSelect utan definierade val
(`choices: []`), alltså strukturellt osättbar (samma fälla som
`data-model.md` §Kända fällor 25 redan registrerar).

Det enda ifyllda beskrivande fältet på touchpointen är `Erbjudande`
(`fldpgd7ayzjcbKL98`), och det bär bara värden på
`Angett e-post`-touchpointer, aldrig på anmälnings-touchpointer.

### 3. `Mail logg (rådata)`-länken når anmälan indirekt: föll

`Kontaktlogg (rådata)` (`tblzg4DsRzCCXH8Vy`) har exakt två länkfält:
`Person` (`fld8cQQyMqwqJBInZ`) och `Länkad touchpoint`
(`fldVqrMPEOaWgBes2`). Ingen väg till `Anmälningar` eller `Eventplanering`.
Live-verifierat 2026-08-10. Kedjan är dessutom irrelevant för
anmälnings-grenen: den fylls av kontaktformulär-flödet, inte av A2.

### 4. Två hopp: Touchpoint till Person till Anmälningar: föll

Tekniskt möjligt (en lookup på `Touchpoints` av ett rollup-fält på
`Personer`), men värdelöst: den returnerar **alla** personens anmälningar,
inte den anmälan touchpointen gäller. Ingen formel kan filtrera ut rätt
element, och rollup med IF-filter inuti aggregeringen är dessutom bokförd som
opålitlig i vår egen katalog (**P21**,
`airtable-constraints.md` rad 220).

### 5. Härledning ur person plus datum: föll på mätning

Detta var invändningens starkaste form och den enda som kunde ha gjort
backfill onödig **på touchpoint-vägen**. Den föll mot data.

A2:s touchpoint-create sätter `Datum` till
`getWorkflowExecutionIsoDateTime()`, alltså automationens körtid, inte
anmälans egen tidsstämpel (live-läst ur automationen `wflRPMp5QNGEa7wH1` via
claude.ai-connectorn 2026-08-10). Tidsstämplarna ligger därför nära men inte
exakt på anmälans, vilket i sig är hanterbart.

Det som inte är hanterbart är kardinaliteten. Mätning i prod, 12 personer med
minst fyra anmälningar, `Antal anmälningar (totalt)` mot antalet
`Inskickad anmälan`-rader i `TP sammanfattning (rollup)`:

| Utfall | Antal personer |
|---|---|
| Lika många touchpoints som anmälningar | 4 |
| Färre touchpoints än anmälningar | 5 |
| Fler touchpoints än anmälningar | 3 |

Två konkreta ytterlighetsfall: `recHNKmSKquVX69WT` har 4 anmälningar och **1**
touchpoint; `recPyHkKMh7kJyZJ4` har 4 anmälningar och **6** touchpoints.

Mekanismen bakom underskottet är läst ur automationen, inte gissad: A2:s
`conditionalGroup` har en gren *"Om person utan namn hittades"* som **bara**
uppdaterar namnet. Den skapar ingen touchpoint och kopplar inte anmälan.
Grenen *"Om flera personer hittades"* skriver bara till Error-log, också utan
touchpoint. Överskottet (fler touchpoints än anmälningar) har ingen läst
mekanism och lämnas som omätt, men det räcker för slutsatsen: kopplingen är
inte funktionell åt något håll, och en datum-närmast-matchning skulle
producera fel länkar tyst.

Tätt intill ligger ett andra skäl att inte lita på tidsstämpeln:
`Anmälningar.Inskickad` (`fldNtSHQivkL26B6L`) är ojämnt ifylld. I ett
stickprov på en person var fältet tomt på alla tre huvudformulär-anmälningar
och ifyllt på alla tre backfill-anmälningar; ett bredare stickprov visade
samtidigt ifyllda värden på icke-backfill-rader. Fältet är alltså patchigt.
`Rad skapad` (`fldet9MU1rJBSpo3y`, createdTime, Europe/Stockholm) är däremot
alltid satt.

### 6. Konvertera ett textfält till länkfält (Airtables auto-matchning): föll

Detta är den enda backfill-mekanism Airtable erbjuder utan skript: vid
konvertering matchas cellvärdena mot måltabellens primärfält, och
*"new records with the names of those values will be created automatically"*
för det som inte matchar (`linked-record-field`, hämtad 2026-08-10). Den
kräver ett textfält på `Touchpoints` som bär anmälans primärvärde. Det enda
kandidat-fältet är `Metadata`, och det är tomt i samtliga poster (mätt, se
väg 2). Vägen finns alltså men har inget att arbeta med, och en felmatchning
hade dessutom skapat skräp-rader i `Anmälningar`.

### 7. Nytt länkfält på Touchpoints plus A2-ändring plus backfill: håller, men dyrast

Fullt genomförbar. A2:s båda `createRecord`-noder mot `Touchpoints`
(`wacXk240STE9j0Ory` och `wacDCG3kSmETZg8lj`) sätter i dag exakt tre fält:
personlänken, `Typ` (choice `sel8DlybaDi9slhD3`) och `Datum`. Att lägga till
anmälningslänken är en liten ändring, och referensen finns redan i
automationens uttrycks-språk (`{"$ref":"trigger","path":["id"]}` används av
grannoden `wacGPdvix9kI22TNq`).

Men: alla befintliga touchpointer förblir olänkade, backfillen kan inte
härledas (väg 5), och grenarna som aldrig skapar någon touchpoint blir kvar
som hål. Vägen kostar mest och täcker minst.

### 8. Läs anmälnings-grenen direkt ur Anmälningar: håller, noll backfill

Länken `Personer.Anmälningar (länkat fält)` (`fld8pOivka8YdiywK`, invers
`Anmälningar.Person` `fldQekqRlLfup8x5K`) finns och är i praktiken komplett:
**7** anmälningar i prod saknar person-länk (mätt med
`filterByFormula: COUNTA({Person})=0`). Länken används redan av tolv
rollup-fält på `Personer`, bland dem `Ort` (`fldBd946g2waLT7NG`) och
`Motiveringar (lista)` (`fld58ihHj9MSv6Svu`).

Mönstret finns alltså redan i basen och behöver bara speglas.
`Anmälningar.Motivering (sammanfattning)` (`fldrMT8cWP3NmBc9T`) bygger redan
strängen kurs, ort och datum:

```text
IF({Varför vill du gå}, {Event (namn)} & IF({Ort}, " – " & {Ort}, "")
  & IF({Startdatum}, " – " & DATETIME_FORMAT({Startdatum}, "YYYY-MM-DD"), "")
  & "\n" & {Varför vill du gå}, BLANK())
```

Den strängen rullas upp till `Personer` och plockas isär av
`Motivering (text)`. Exakt samma tre-stegs-form (formel på anmälan, rollup på
person, text-formel som tar första raden) bär redan `Senast deltagande (text)`
och `Senast touchpoint (text)`.

**En viktig avvikelse från den befintliga formeln:** den använder anmälans
**egna** fält `Event (namn)` (= `Vill anmäla sig till`) och `Ort`, och båda är
tomma på backfill-raderna. Mätt: `filterByFormula: AND(LEN({Ort}&"")=0,
COUNTA({Event})>0)` gav backfill-rader med giltigt `Startdatum` men tom `Ort`.
Den nya formeln ska därför hämta kurs och ort från **eventet**, inte från
formulärsvaret.

## Rekommenderad minsta väg, steg för steg

Alla steg är additiva. Inget befintligt fält ändras utom i steg 5, och den
ändringen är en utvidgning av en formel som redan finns.

**Steg 1. Två lookups på `Anmälningar`, båda via den befintliga
Event-länken** (`fldi3enUaMdbuGSlm`):

- `Ort (from Event)` av `Eventplanering.Ort` (`fldRvwXnDsgjwva2L`)
- `Kurs (from Event)` av `Eventplanering.Event (text)` (`fldNIc8I2ynUoLkNn`)

Precedens i samma tabell: `Startdatum` (`fldAHtyo4P7Z08Vuj`), `Slutdatum`,
`Månad/år (from Event)` och `Tid kvar till event (from Event)` är redan
lookups över exakt den länken. Lookups är beräknade: de får värde på alla
befintliga rader direkt.

**Steg 2. Ett formelfält på `Anmälningar`**, förslagsvis
`Anmälan (sammanfattning)`, som bygger den mänskliga meningen av lookup-
värdena med anmälans egna fält som fallback när Event-länken saknas
(**25** anmälningar i prod saknar Event-länk, mätt med
`COUNTA({Event})=0`; deras ID:n ligger i intervallet 850 till 972, alltså
sena rader).

**Steg 3. En rollup på `Personer`** av steg 2:s fält via
`fld8pOivka8YdiywK`, med samma aggregering som `TP sammanfattning (rollup)`
använder (se omätt-listan nedan om vad den aggregeringen är).

**Steg 4. En rollup på `Personer` av `Rad skapad`** (`fldet9MU1rJBSpo3y`),
`MAX`, som datum-kandidat för grenen. `Rad skapad` väljs framför `Inskickad`
därför att `Inskickad` är patchig (mätt, väg 5).

**Steg 5. Utvidga `Senaste interaktion (text)` och
`Senaste interaktion (datum)` från två till tre kandidater.** Nuvarande
prod-formel för `fldRnujWHT3ADToC1` jämför exakt två datum
(`fld8e65ppGbVzaSv4` mot `fldHsZVnerqflbWCp`) och väljer motsvarande text.
Den ska bli ett trevägsval där anmälnings-kandidaten deltar.

Tie-break måste skrivas explicit: A2:s touchpoint stämplas med automationens
körtid och ligger därför typiskt några sekunder **efter** anmälans
`Rad skapad`. Utan en regel som låter anmälnings-kandidaten vinna vid
praktiskt samtidiga värden vinner touchpointen jämförelsen och den fattiga
texten visas ändå. Enklaste robusta formen: låt anmälnings-kandidaten vinna
när dess datum ligger inom samma dygn som touchpoint-kandidatens.

**Steg 6. Staging först, sedan prod.** Fält-ID:n för **nya** fält skiljer sig
mellan baserna även när tabell-ID:n är identiska: prod `Bor över` är
`fld4Flif4NoFnNsxS` medan staging-fältet är `fldGYYNnQi7XlfbhP` (samma
mönster för de tre notering-/påminnelse-fälten). Adressera per namn vid
skapandet och notera ID:t per bas efteråt, precis som
`data-model.md` §ID-topologi redan föreskriver.

**Steg 7. Bokför i `docs/reference/data-model.md`** och lägg en post i
`airtable-constraints.md` för väggen i väg 1, som saknas där i dag.

### Vad detta INTE gör, medvetet

Det river inte anmälnings-touchpointen. Den finns kvar som logg-rad, och
`Touchpoints` behåller sin roll som interaktionshistorik. Vad förändringen
gör är att flytta **texten** för anmälnings-grenen till den yta som faktiskt
äger uppgiften. Det är i linje med `ADR-063`: defekten löses i basen, inte i
appen, och inte genom att designa bort kravet.

Vill man senare ändå ge touchpointen egen bärighet (väg 7) är den vägen
oförhindrad, och steg 1 till 2 är återanvändbara i den.

## Backfill-frågan avgjord

**Nej, backfill krävs inte, på den rekommenderade vägen.** Avgörandet vilar
på fyra mätta led, inte på resonemang:

1. Länken `Personer` till `Anmälningar` finns redan och är fylld: 7 anmälningar
   utan person-länk i hela prod.
2. Lookups, formler och rollups är **beräknade** fälttyper. De existerar inte
   som lagrad data på raden och kan därför inte vara ofyllda på gamla rader.
   Precedens i samma tabell: `Startdatum`-lookupen levererar värde även på
   backfill-anmälningar från 2024 (mätt: anmälan `ID 389` bär
   `Startdatum 2024-10-05` med tom egen `Ort`).
3. Den enda komponent som hade krävt backfill är ett nytt **länkfält** på
   `Touchpoints`, och den rekommenderade vägen skapar inget sådant.
4. Väljer man ändå länkfälts-vägen (väg 7) är backfill **obligatorisk och
   dessutom inte härledbar**: kardinaliteten mellan anmälningar och
   touchpointer är inte 1:1 (4 lika, 5 färre, 3 fler av 12 mätta personer).

## Vad som är omätt

- **Rollupens aggregeringsfunktion.** Airtables metadata-API returnerar inte
  aggregerings-uttrycket för rollup-fält (`describe_table` ger
  `recordLinkFieldId`, `fieldIdInLinkedTable` och `result`, men inget
  aggregat). Vad `TP sammanfattning (rollup)` (`fldgzFXqDGTdKEf60`) faktiskt
  räknar är alltså inte läst, bara observerat: utdata är radbruten och
  **fallande** på datum, vilket är varför `Senast touchpoint (text)` som tar
  första raden ger den senaste. Steg 3 måste kopiera den aggregeringen genom
  att öppna fältet i Airtable-UI:t, inte gissa den.
  En näraliggande varning från samma glapp: `Totalt antal hämtningar
  (erbjudande)` (`fldd782imiCRtFJ4t`) ser i API:t ut som en rollup över
  `Touchpoint ID`, men returnerar **1** för en person med **6** touchpointer
  (varav en erbjudande-touchpoint). Fältet räknar alltså inte det API-formen
  antyder. En första mätning i detta pass byggde på just det antagandet och
  fick kastas.
- **Staging-basens automationer.** claude.ai-connectorn nekar åtkomst till
  `apphjj8Q7lkXCMsL4` (`INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND`), och
  PAT-servern kan strukturellt inte se automationer (**P24**). Att staging bär
  samma A2 som prod är alltså **ej verifierat**. Schema-pariteten är däremot
  mätt: `Touchpoints` och `Personer` har identiska fältuppsättningar och
  identiska fält-ID:n i båda baserna.
- **Exakt antal anmälningar och touchpointer.** Nämnarna är inte räknade
  (MCP-ytan ger inga aggregat). Talen ovan är absoluta antal ur filtrerade
  träfflistor, inte andelar.
- **Överskotts-touchpointerna.** Att 3 av 12 personer har fler
  anmälnings-touchpointer än anmälningar har ingen läst mekanism. Trolig
  kandidat är raderade eller ompekade anmälningar vid dubblett-konsolidering
  (jämför `data-model.md` §Kända fällor 40 och 42, där touchpointer flyttades
  för hand), men det är en hypotes.
- **Målsträngens exakta form.** Två saker i exemplet
  `Anmälde sig till RIM 1 i Trollhättan 7 maj 2026` är oavgjorda och bör
  bestämmas av Marcus innan formeln skrivs:
  - **Vilket datum?** Formuleringen läser som eventets startdatum, men fältet
    heter `Senaste interaktion` och sorteras på interaktionsdatum. Systerfältet
    `Senast deltagande (text)` visar i dag eventets label med **eventdatum**
    (mätt: `Falköping – Utbildning – Fjärrskådning – 2025-11-15`), så
    eventdatum har precedens i grannfältet. Båda är tillgängliga i den
    rekommenderade vägen.
  - **`RIM 1` finns inte i data.** `Eventplanering.Event (source)` bär
    `Resor i medvetandet 1`, och `Anmälningar.Vill anmäla sig till` bär både
    `Resor i medvetandet 1` och skiftläges-varianten `Resor i Medvetandet 1`.
    Vill man ha kortformen krävs en `SWITCH`-mappning, vilket är en egen
    liten designfråga (och en kandidat för bas-maximeringen i stället: normalisera
    kursnamnen vid källan).
- **S103:s formeländring.** Kortets premiss är att en formeländring redan
  gett erbjudande- och deltagande-grenarna rätt text. Prod-formeln för
  `fldRnujWHT3ADToC1` var vid mätningen 2026-08-10 fortfarande den gamla
  tvåvägs-formen, och staging-Personer har oförändrad fältuppsättning. Den
  ändringen är alltså inte landad i någon av baserna vid detta pass, och steg
  5 ovan måste läsa om formeln innan den skrivs om.
