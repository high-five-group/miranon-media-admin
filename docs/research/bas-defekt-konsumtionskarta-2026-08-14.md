# Konsumtionskarta: vilka bas-defekter Lotta faktiskt ser

> **Proveniens:** avgränsat research-pass (bakgrundsagent), 2026-08-14, som
> prioriteringsunderlag för Marcus beslut samma dag att basen maxas
> kontinuerligt (en defekt som når UI väger tyngre än en ingen läser).
> Kört **oisolerat i huvudkatalogen**, ocommittat, mot HEAD `9e8e8e1d`
> (huvudkatalogen stod på `main` vid passets start och hade av orkestreraren
> flyttats till `proto/s103-checkin-d-konvergens` vid dess slut — samma SHA,
> inget av mina belägg påverkat).
> **RENT KOD/DOCS-PASS:** noll MCP-anrop mot Airtable, ingen bas rörd, ingen
> datarad läst. Varje påstående om basens fältform är citerat ur repots egna
> schema-dokument; varje påstående om appens beteende är `fil:rad`-belagt mot
> disk. Där de två går isär gäller koden (`ADR-100` §1).

## Vad jag redan hade, innan sökningen

**Inget befintligt pass svarar på frågan.** Jag läste `docs/research/`
(110 filer) och fann tre grannar som gränsar men inte överlappar:

- `datamodell-research/01-extraction.md` + `02-live-state.md` (2026-06) —
  fält-för-fält-extraktion av basens schema. **Auktoritativ för fältformerna
  jag citerar nedan** (den bär `count`/`rollup`/`formula`-typen per fält-ID),
  men den kartlägger basen, inte konsumtionen.
- `touchpoint-kurs-och-ort-2026-08-10.md` — rör `Senaste interaktion`-familjen
  men frågar vad touchpointen bör BÄRA, inte vem som läser den.
- `personlista-scanlista-branschmonster-2026-08-10.md` — formfrågan för den yta
  som visar sig vara en av de tyngst drabbade.

**Två styrande beslut ramar in svaret och jag läste båda i sin helhet:**
[`ADR-062`](../decisions/ADR-062-segment-yta-berakn-medlemskap-fran-kalla.md)
beslut 2 (appen läser KÄLLAN där projektionen är lossy) och
[`ADR-063`](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md)
(registret är kravspec, resolution I BASEN). Detta pass river inget av dem —
det mäter hur långt beslut 2 faktiskt har kommit i koden.

**Åldersbedömning:** `02-live-state.md` är från 2026-06 och beskriver
formel-DEFINITIONER, som åldras långsamt. De sex fält jag lutar mig tyngst mot
är dessutom korsverifierade mot `schema_reference.md` (oberoende kopia). Ett
fält kan ändå ha ändrats i basen sedan dess utan att någotdera doket vet — se
§ Vad jag inte kunde belägga.

---

## Kort svar

**Av registrets 47 poster bär 23 en konkret fält-defekt. Tio av dem når UI;
sju av de tio gör det okompenserat.** Resten stannar i Edge Function-lagret
eller läses inte alls — basen bär felet ensam.

Mönstret är skarpare än väntat och pekar åt ett håll registret inte förutsåg:
**de defekter som når Lotta är nästan aldrig de förberäknade rollups
`ADR-062`/`ADR-063` handlar om.** De rollupsen (`Totala deltaganden`,
`Erfarenhetsnivå`, `Fjärrskådning ×`, `Antal genomförda event (gammal)`) läses
antingen inte alls eller stannar i EF:ens domänobjekt utan att någon komponent
renderar dem — `ADR-062` beslut 2 har i praktiken redan neutraliserat hela den
familjen. Det som når Lotta är i stället **strängfält och räknare hon läser
ordagrant**: ett namn, en klumpad mening, ett mottagarantal, ett hämtningstal.

**Topp tre efter användarpåverkan:**

1. **§43 — "Ej tillgängligt" som personnamn.** 186 personer med genomförd
   kursnärvaro saknar namn. Basens `Namn`-formel skriver strängen
   `"Ej tillgängligt"`, som är truthy och därför passerar varje `if (person.namn)`
   -fallback i huset. De renderas som namn i alla tre personytorna, och
   `get-persons` sorterar på `Namn` — så de bildar ett kluster identiska rader
   under bokstaven E i personlistan.
2. **§39 — maillogens mottagarantal är alltid 1.** `COUNTA` på ett länkfält ger
   1 oavsett antal mottagare. `MailLog.tsx:52` renderar talet ordagrant, och
   öppningsgraden ärver nämnaren — ett utskick där 3 av 40 öppnade visas som
   "1 mottagare, 300 %".
3. **§45 — `Månad/år`-väggen är fyra och en halv månad bort.** `create-event`
   skriver ett härlett `Månad/år` utan typecast; basens optionslista slutar vid
   December 2026. Första januari-2027-eventet Lotta försöker skapa ger ett rått
   500-fel.

**Extra-frågan (Carry 11) har ett rent svar: nej.** Varken personlistan eller
persondetaljen konsumerar `Kommande event` eller `Nästa event (rad)` — noll
träffar i hela `src/` + `supabase/functions/`. Defekten är osynlig i det
Marcus granskar just nu, och persondetaljen är dessutom immun mot felklassen
av ett oberoende skäl (se § Carry 11).

---

## Prioriteringstabell

Sorterad efter användarpåverkan, inte registernummer. "Kompenserat" betyder att
app-koden aktivt hanterar defekten — ytan är då korrekt, men kompensationen är
en app-lapp som `ADR-063` säger ska kunna rivas när basen fixas.

| # | Fält | Räckvidd | Ytor | Vad Lotta ser |
|---|---|---|---|---|
| §43 | `Personer.Namn` `fldnYys0Ac3UGOdpe` | **NÅR UI** | Personlistan, persondetaljen, Intresserade | "Ej tillgängligt" som namn på 186 personer; de klumpas ihop i namnsorteringen |
| §39 | `Utskickslogg.Antal skickade` `fldqJBTOwErzMdCAO` | **NÅR UI** | Maillogg | "1 mottagare" för varje utskick; öppningsgrad kan visa 300 % |
| §45/§36 | `Eventplanering.Månad/år` `fld2BjFdBd964TzVb` | **NÅR UI** | Skapa event, Ändra event | Rått 500-fel vid varje startdatum från 2027-01-01 |
| §46(b) | `Personer.Senaste interaktion (text)` `fldRnujWHT3ADToC1` | **NÅR UI** | Personlistan, Intresserade | Tre meningar utan mellanrum: "…i FalköpingAnmälde sig till…" |
| §47 | `Personer.Antal hämtningar` `fld4UQOdKTvWixZ9F` | **NÅR UI** | Intresserade (+ lead-filtret) | Räknar distinkta erbjudanden, inte hämtningar — talet motsäger listan ovanför på samma rad |
| §27 | `Anmälningar.Är aktiv (1/0)` `fld4j7PeckDViTdIB` | **NÅR UI** (via JS-replikering) | Eventsidans register, Gruppdynamik, Åtgärder | Inställda anmälningar räknas som aktiva deltagare |
| §40 + §42 | `Personer.E-post` `fldcd5HnYooVZY4Ts` | **NÅR UI** | Personlistan, persondetaljen, segment-export | Samma människa som två rader, med halva historiken var |
| §35 | `Eventplanering.Event (source)` (nakna "Resor i medvetandet") | NÅR UI, **kompenserat** | Segmentbyggaren | Inget fel — appen skriver ut "fristående föreläsning (ej del 1/2/3)" |
| §34 | `Deltaganden.Status` (16 oavstämda föreläsnings-rader) | NÅR UI, **korrekt beteende** | Segmentbyggaren | Föreläsnings-segment räknar 0 personer — sant, men orsaken är oavstämd närvaro, inte tom domän |
| §24 | `Anmälningar.Vill anmäla sig till` `fld6RC3r0R9tuKgdF` | NÅR UI, **marginellt** | Persondetaljens motiveringsblock | Kursnamn med avvikande versalisering på backfill-anmälningar |
| §8 | `Personer.Erfarenhetsnivå` `fldWSkxHJS2xWav4t` | ENDAST EF | — | Läses av tre EF:er, renderas av ingen komponent |
| §31 | `Personer.Totala deltaganden` `fldBP7xdEmpXDwUpz` | ENDAST EF | — | Samma: bor i domänobjektet, når aldrig en skärm |
| §25 | `Personer.Manuella flagga` `fldNtwQt6tOCIdf4f` | ENDAST EF | — | Avlöst av `Flagga`; det gamla fältet läses men renderas inte |
| §46(a) | `Personer.Motivering (text)` `fld4ENxbma679wvcC` | ENDAST EF | — | App-konsekvensen stängd i `TASK-52`; bas-deklarationen ljuger fortfarande |
| §23 | `Anmälan (ID)`, `Event (ID)`, `Närvaro (nyckel)` | **KONSUMERAS INTE** | — | Noll träffar i kodbasen |
| §26 | `Hämtade erbjudanden.Källa` `fldF9SgJS1Zv5kmtr` | **KONSUMERAS INTE** | — | Appen läser `Anmälningar.Källa`, ett helt annat fält |
| §28 | `Antal genomförda event (gammal)` `flddymQaYJGVCInzq` | **KONSUMERAS INTE** | — | Appen läser konsekvent det nya fältet |
| §32 | `Personer.Fjärrskådning ×` `fldlczklhguSg02H6` | **KONSUMERAS INTE** | — | Segmentmotorn räknar från Deltaganden i stället |
| §33 | Föreläsnings-/Psionautics-signaler | **KONSUMERAS INTE** | — | Samma: källan bär det projektionen saknar |
| §25b | `Touchpoints.Systemkälla` | **KONSUMERAS INTE** | — | Noll träffar |
| Carry 11 | `Kommande event` `fldITyVMA9a4SHdgN`, `Nästa event (rad)` `fldHN2Ar5E6tQWlYF` | **KONSUMERAS INTE** | — | Noll träffar; se egen sektion |

---

## Per-defekt-detalj

### §43 — namnlösheten når varje personyta, och sorteringen förvärrar den

Basens `Namn` är formeln
`IF(AND(Förnamn="", Efternamn=""), "Ej tillgängligt", TRIM(...))`. Den returnerar
alltså en icke-tom STRÄNG för en namnlös person — inte `null`. Varje
visningsnamns-fallback i huset är byggd på truthiness och släpper därför igenom
den:

- `src/components/persons/PersonsList.tsx:107-111` — `if (person.namn) return person.namn;`
- `src/components/persons/PersonDetail.tsx:283-288` — samma form
- `src/components/intresserade/Intresserade.tsx:16-23` — samma form

Persondetaljen bokför problemet öppet i sin egen docstring
(`PersonDetail.tsx:276-281`), verbatim: *"Fallbacken nedan når därför aldrig
fram i drift för en namnlös lead — rubriken blir bokstavligen 'Ej
tillgängligt'."* Personlistan och Intresserade bär ingen sådan not.

**Det som inte står någonstans, och som förvärrar utfallet:**
`supabase/functions/get-persons/index.ts:143` sorterar
`sort: [{ field: 'Namn', direction: 'asc' }]`. Eftersom alla namnlösa delar
exakt samma sträng hamnar de i ett sammanhängande block under E — inte utspridda
som enskilda luckor. En sida i personlistan kan alltså bestå av identiska rader
som bara skiljs åt av e-postadressen på raden under.

Personlistans bas-filter (`get-persons/index.ts:121`,
`{Antal anmälningar (totalt)} > 0`) släpper igenom dem: de 186 har genomförd
kursnärvaro och därmed anmälningar.

**Ej åtgärdbart i basen** (§43 är dataförlust vid källan, Marcus-verifierad
2026-07-09). Det som ÄR åtgärdbart är app-sidan: fallbacken behöver pröva mot
strängen `"Ej tillgängligt"`, inte mot truthiness. Det är en app-fix, inte en
bas-fix — och den enda posten i tabellen där jag rekommenderar det.

### §39 — maillogens två tal är båda fel, och de är sidans hela innehåll

`get-mail-log/index.ts:31,33` coercar `Antal skickade` och `Öppningsgrad (%)`
rakt av. `MailLog.tsx:52,54` renderar dem ordagrant:

```text
Mottagare: {antalSkickade} mottagare
Öppningsgrad: {Math.round(oppningsgrad * 100)} %
```

Basens formel är `COUNTA({Skickat till})` över ett `multipleRecordLinks`-fält
— den ger 1 så länge minst en länk finns (§39, live-observerat vid ett utskick
med 2 mottagare). `Öppningsgrad (%)` är `{Antal öppnade mail}/{Antal skickade}`
och ärver därmed nämnaren 1: tre öppningar av fyrtio utskick renderas som
`300 %`.

Vyn är monterad på `/mer/maillogg` (`src/routes/_authenticated/mer/maillogg.tsx:14`)
och består av fyra fält per rad. Två av dem är dessa. Det finns ingen annan yta
där Lotta kan se utfallet av ett bulkutskick — segment-prototypernas egna
räknare bygger medvetet ur mottagarlistan i stället
(`VariantA.tsx:399`, `VariantD.tsx:3684` säger båda rakt ut att de undviker
fältet av just detta skäl). **Den enda skarpa ytan är alltså den enda som inte
kompenserar.**

### §45/§36 — `Månad/år`-väggen har ett datum, och det är om drygt fyra månader

`create-event/index.ts:204` skriver `'Månad/år': deriveManadAr(startdatum)`.
Skriptets eget huvud bokför konsekvensen verbatim (`create-event/index.ts:55-60`):

> *"options-listan i basen är ändlig (range Nov 2025 – Dec 2026 i nuläget); ett
> datum utanför den gör att `typecast:false`-upserten FELAR (→ 500) i stället
> för att tyst skapa en option. Det är medvetet."*

`update-event/index.ts:222` omhärleder samma fält när `Startdatum` ändras och
bär samma vägg. Skarpt bekräftat 2026-07-24 i T40-prod-smoken (§45).

Beslutet att låta det synas är rätt — men "synas" betyder i dag ett rått
500-fel i skapa-event-formuläret (`src/components/event/CreateEventForm.tsx:123`),
inte ett begripligt meddelande. Lotta får ingen ledtråd om att problemet är
basens optionslista.

Detta är den enda posten i tabellen med ett **förfallodatum**. Basens sista
option är December 2026; passets datum är 2026-08-14. Vårterminens
planeringsarbete börjar normalt före årsskiftet.

### §46(b) — klumpen är åtgärdad på EN av tre ytor

`Senaste interaktion (text)` väljer mellan tre källrollups och returnerar den
valda **orörd**; är källan fler-värd konkatenerar Airtable elementen utan
avgränsare. Skarpt mätt (§46, S103), verbatim:

```text
Anmälde sig till RIM 1 i FalköpingAnmälde sig till RIM 2 i FalköpingAnmälde sig till Fjärrskådning i Falköping
```

Konsumtionen är tre ytor, med tre olika utfall:

| Yta | Fil:rad | Utfall |
|---|---|---|
| Personlistan | `PersonsList.tsx:589-597` | **Renderas rått** — klumpen står som radens interaktionstext |
| Intresserade | `Intresserade.tsx:54` | **Renderas rått** |
| Persondetaljen (D) | `PersonDetail.tsx:630-664` | **Undviker fältet** — bygger en post per anmälan ur `person.motiveringar` |

Persondetaljens kod bokför bytet och dess skäl utförligt
(`PersonDetail.tsx:605-629`), och säger uttryckligen: *"Bas-defekten är kvar och
är Marcus/ADR-063-mark; det som åtgärdas här är att vyn LÄSER ett fält den inte
behöver."* Variant C behåller rollup-vägen med avsikt.

Personlistan är **promoverad, skarp yta** — `data-model.md` §46 rad 1337 bokför
det redan ("renderas i den PROMOVERADE personlistan"). Den noten är korrekt och
kvarstår. Intresserade-vyn nämns inte där; det är en lucka i registret.

Klumpen syns bara när en person har flera interaktioner samma dygn — vilket är
vad en aktiv deltagare har.

### §47 — fältnamnet ljuger om GRANULARITET, och lead-filtret vilar på det

Detta är passets mest nyanserade post, och den registret beskriver minst exakt.

`Antal hämtningar` är `COUNTA({Engagemang})` (`schema_reference.md:334`).
`Engagemang` är en egen tabell — `schema_reference.md:31` beskriver den som
*"Aggregerat engagemang per person+erbjudande"*, och A5 skapar **en rad per
(person × erbjudande)** och uppdaterar `Senaste hämtning` vid upprepning
(`data-model.md` § Grupp 2). `Alla hämtningar` är däremot en rollup över
**Touchpoints**, där A4 skapar en rad per hämtnings-HÄNDELSE.

**Domen är därför precisare än §47:s formulering "räknar INTE hämtningar":**
fältet räknar distinkta erbjudanden, inte hämtnings-händelser. Hämtar någon
samma erbjudande tre gånger blir det tre touchpoints och en Engagemang-rad.

Två konsumtionspunkter, båda i Intresserade-flödet:

1. **`Intresserade.tsx:52-53` renderar båda talen på samma rad.** "Nappat på"
   listar `allaHamtningar` (touchpoint-rollupen), "Antal hämtningar" visar
   Engagemang-räknaren. De kan alltså motsäga varandra i Lottas synfält —
   exakt den jämförelse som **revs ur persondetaljen** 2026-08-10 med
   motiveringen att den *"sår tvivel om en lista som är korrekt"*
   (`PersonDetail.tsx:1473-1483`). Rivningen gjordes på ett ställe; det andra
   stod kvar.
2. **`get-leads/index.ts:23-24` filtrerar på fältet:**
   `AND({Antal hämtningar} > 0, {Antal anmälningar (totalt)} = 0)`. En lead vars
   Engagemang-länk är tom är därmed **osynlig i hela appen** — hon faller utanför
   både detta filter och personlistans `{Antal anmälningar (totalt)} > 0`.
   `get-persons/index.ts:104-108` påstår att de två filtren täcker basen *"utan
   hål och utan överlapp"*. Det påståendet håller bara om `Antal hämtningar`
   räknar det namnet lovar.

**Viktig nyansering av §47:s belägg, som ändrar prioriteringen:** postens
live-bevis (Sofia Isaksson — tre hämtningar, räknaren 0) kommer från
**staging-granskningsfixturen** `recxF88ZKUbP9JUs1`. `scripts/seed-review-fixture.mjs:2596-2614`
skapar Touchpoints direkt och skapar **inga** Engagemang-rader — nollan följer
alltså av seedningen, inte av prod-flödet. I prod kör A5, som skapar
Engagemang-raden. **Divergensen i prod är därför sannolikt mindre än
fixturen antyder** — men den är inte noll, och hålets storlek är omätt (jag fick
inte röra basen). Se § Vad jag inte kunde belägga.

### §27 — fältet läses aldrig, men formeln är kopierad till JS på tre ställen

`Personer.Antal anmälningar (aktiva)` (rollupen över `Är aktiv`) konsumeras
**inte** av någon EF. Persondetaljen avvisar den till och med explicit
(`PersonDetail.tsx:1127-1130`): *"Basens `Antal anmälningar (aktiva)` räknar allt
som inte avbokats, genomförda event inkluderade — att lista dem här vore samma
blandning om igen."* Den räknar `aktivaAnmalningar` själv.

**Men defektens LOGIK är replikerad i JS, med avsikt, på tre ställen:**

```text
src/components/events/detail/Deltagare.tsx:153-156
src/components/events/detail/Gruppdynamik.tsx:49-52
src/components/events/atgarder/AtgardsSida.tsx:3101-3105
```

Alla tre bär samma kommentar — *"Aktiv anmälan (basens 'Är aktiv'-formel):
endast Avbokad/Ombokad räknas bort"* — och samma predikat:
`r.status !== RegistrationStatus.AVBOKAD`. Enum:en bär `INSTALLT: 'Inställt'`
(`src/domain/types/Status.ts:16`), som alltså räknas som aktiv.

Detta är den enda posten i registret där app-koden **medvetet har speglat en
känd bas-defekt**. Konsekvensen är operativ och pekar framåt: fixas basen enligt
§27:s rekommendation blir de tre JS-predikaten tyst ur synk med basen, och
appen fortsätter räkna Inställt som aktiv. Bas-fixen är alltså inte
självständig — den kräver en samtidig kod-ändring.

Registret som ligger under (`hallplats-steg-prototyp.ts:158`) hanterar däremot
`INSTALLT` explicit som eget sorteringssteg, så statusen är inte osynlig i
listan — det är räkningen som är fel, inte visningen.

### §40 + §42 — dubblett-Personer syns som dubblettrader

Ingen kod läser ett defekt fält här; defekten är i DATAN. Men den når UI direkt:
båda posterna producerar två Person-records för samma människa, och
`get-persons` listar records. Lotta ser två rader med samma namn, med
historiken delad mellan dem (§42:s Ulrika Arvas bar RIM 1 på ena raden och
Psionautics-närvaron på den andra).

Konsekvensen sträcker sig till segment-ytan: `segment-resolution.ts:122-124`
berikar per person-record, så en dubblett ger två rader i en Skool-union —
exakt vad §42 bokför.

Appen kan inte kompensera för detta utan att uppfinna en matchningsregel basen
inte har. **Ren bas-fix, och den enda av topp-posterna där app-sidan saknar
handlingsutrymme.**

### §35 och §34 — når UI men är hanterade

**§35 (nakna "Resor i medvetandet")** når segmentbyggaren via
`deriveTaxonomy` (`src/lib/segment-taxonomy.ts:22-36`), som självväxande bygger
kurslistan ur event-domänen — det nakna namnet dyker alltså upp bredvid
RIM 1/2/3. Men `labelForPar` (`segment-taxonomy.ts:52-58`) har en explicit
fälla-35-gren som skriver ut
`"Resor i medvetandet - fristående föreläsning (ej del 1/2/3)"`, med en
kommentar som säger att grenen är *"borttagbar när bas-maximeringen löser ut
fälla 35 i basen"*. Mönstergill hantering: kompensationen är märkt med sitt eget
utgångsvillkor.

**§34 (16 oavstämda föreläsnings-Deltaganden)** når segmentbyggaren via
`segment-resolution.ts:40` (`NARVARO_FILTER = '{Närvaropoäng}=1'`). Ett
föreläsnings-segment räknar därför 0 personer. Det är **korrekt beteende på fel
data** — golvet är medvetet inte lättat (`ADR-064` beslut 4a). Lotta kan tolka
nollan som "ingen har gått föreläsningen", när sanningen är att närvaron aldrig
registrerades. Ren bas-fix (stäm av de 16 raderna); ingen kodändring behövs.

### De fem som stannar i EF-lagret

`Totala deltaganden` (§31), `Erfarenhetsnivå (Miranon Media)` (§8/§31),
`Manuella flagga` (§25) och `Motivering (text)` (§46a) läses alla av EF:erna och
bor i domänobjekten:

```text
get-persons/index.ts:34,38,39   ·  get-person/index.ts:249,253,254,303
get-leads/index.ts:47,51,52
```

Ingen av dem renderas av någon komponent — verifierat med grep över hela `src/`:
`antalDeltaganden` och `erfarenhetsniva` förekommer enbart i
`src/domain/models/Person.ts:25-26` och `src/domain/schemas/Person.schema.ts:18-19`,
aldrig i en `.tsx`. `manuellFlagga` har exakt en förekomst utanför schemat, och
den är en kommentar som säger att fältet INTE läses
(`PersonDetail.tsx:1261`).

**Det betyder att `ADR-062` beslut 2 redan är genomfört i praktiken för hela
rollup-familjen** — inte som en policy utan som ett observerbart faktum. De
fyra defekterna kostar i dag noll i UI. De kostar däremot fortfarande i
BEGRIPLIGHET: en framtida yta som plockar upp `antalDeltaganden` ur
domänobjektet ärver §31:s RIM 3-blindhet utan varning, eftersom fältet ser ut
som ett färdigt totaltal.

### De sex som inte konsumeras alls

`Anmälan (ID)` / `Event (ID)` / `Närvaro (nyckel)` (§23),
`Hämtade erbjudanden.Källa` (§26), `Antal genomförda event (gammal)` (§28),
`Fjärrskådning ×` (§32), föreläsnings-/Psionautics-signalerna (§33) och
`Touchpoints.Systemkälla` (§25b): **noll träffar** i `src/` +
`supabase/functions/`, sökt på både fältnamn och fält-ID.

Två är värda en not:

- **§28** — `flddymQaYJGVCInzq` (gamla fältet) har noll träffar medan
  `flddy8JND3YnlgZxe` (nya) har två. §28:s föreslagna åtgärd *"sök igenom alla
  konsumenter (`grep -r flddymQaYJGVCInzq`)"* är alltså **utförd av detta pass,
  med resultatet noll**. Fältet kan raderas i basen utan app-risk.
- **§26** — appen läser ett fält som HETER `Källa`
  (`registration-read.ts:142`, `get-event/index.ts:86,97`), men det är
  `Anmälningar.Källa` (Manuell/+1/Väntelista), inte det SHA256-bärande
  `Hämtade erbjudanden.Källa`. Lätt att förväxla vid en framtida grep.

---

## Carry 11 — extra-frågan, i sin helhet

**Fältkedjan, ur repots schema-dokument:**

| Fält | ID | Form |
|---|---|---|
| `Deltaganden.Kommande poäng` | `fldahsniYiJ7JVNql` | `IF(Event startdatum >= TODAY(), 1, 0)` |
| `Personer.Kommande event` | `fldITyVMA9a4SHdgN` | rollup, SUM av `Kommande poäng` |
| `Personer.Nästa event (rad)` | `fldHN2Ar5E6tQWlYF` | rollup av `Deltaganden.Kommande sammanfattning` |
| `Personer.Nästa event (text)` | `fldc0Zdap83E3jMwi` | *"Tar första raden ur rollup"* |

Carry 11:s diagnos är korrekt och följer direkt av formerna: A3 skapar en
Deltagande-rad per session, `Kommande poäng` ger 1 per rad, och rollupen
summerar dem — ett tvådagars-event ger alltså 2. Samma för raden.

**Konsumtionen är noll för de två defekta fälten.** Sökt på både namn och
fält-ID över hela `src/` + `supabase/functions/`:

```text
Kommande event      / fldITyVMA9a4SHdgN  →  0 träffar
Nästa event (rad)   / fldHN2Ar5E6tQWlYF  →  0 träffar
Nästa event (text)  / fldc0Zdap83E3jMwi  →  1 träff (get-person/index.ts:284)
```

De enda `Kommande event`-träffarna i kodbasen är två kommentarer i
`EventValjare.tsx:88,141` som handlar om eventlistans sortering — inte om
Personer-fältet.

**`Nästa event (text)` läses men renderas aldrig.** `get-person/index.ts:284`
mappar det till `nastaEvent`; `PersonDetail.schema.ts:135` bär det i shapen;
**ingen komponent läser det.** S103 Del 8 bokförde detta oberoende i sin
felräkning: *"'Nästa event' visades aldrig (dött fält)"*. Fältet är dessutom
strukturellt immunt mot dubbleringen — det tar första raden ur rollupen, så en
upprepning påverkar det inte.

**Svaret på extra-frågan: nej.** Persondetaljen och personlistan konsumerar
inget av Carry 11:s fält. Defekten är osynlig i det Marcus granskar nu.

**Men felKLASSEN når persondetaljen på en annan väg — och neutraliseras där.**
`get-person` batch-hämtar personens Deltaganden och levererar dem som `historik`
— "en rad per Anmälan × Session" (`get-person/index.ts:167-176`). Ett
tvådagars-event ger alltså två historikposter. `PersonDetail.tsx:423-458`
grupperar dem per event innan rendering, och docstringen beskriver exakt Carry
11:s fenomen, oberoende upptäckt (`PersonDetail.tsx:405-407`):

> *"Nödvändigt, inte kosmetiskt: ett tvådagars-event ger TVÅ deltagande-rader
> (Dag 1 + Dag 2). Dagens vy listar dem som två likvärdiga poster, så en person
> med fem event ser ut att ha tio."*

Samma dedup finns i segmentmotorn, där den är kommenterad lika explicit
(`_shared/segment-membership.ts:27-32`): *"Set ⇒ tvådagars-event (Dag 1 + Dag 2
= två Närvaropoäng=1-rader, samma par) kollapsar gratis → personen räknas EN
gång."*

**Slutsats för hemvist-beslutet:** Carry 11 är en verklig bas-defekt som
förtjänar sin plats i registret, men den hör **längst ned** i
prioriteringsordningen. Ingen app-yta läser fälten, och de två ytor som ser
samma underliggande session-dubblering hanterar den redan — oberoende av
varandra och innan Carry 11 upptäcktes. Registrera den som dokumentation av en
lurande fälla för framtida konsumenter, inte som en åtgärd som betalar sig nu.

---

## Oväntade fynd utanför frågan

**Fynd 1 — `Eventplanering.Antal anmälda` räknar avbokade och inställda. Ej
registrerad, och den når UI dagligen.**

`Antal anmälda` (`fldTQkYOz9O2BGEIZ`) = `{Antal anmälningar} + {Manuella platser}`.
`Antal anmälningar` (`fldU5MCQmagdHtz4G`) är enligt båda schema-källorna en ren
`count` över länkfältet `Anmälningar (länkat fält)`, utan villkor
(`02-live-state.md:89`: *"count | recordLinkFieldId=fldUAjTutSM0fziMT"*;
`schema_reference.md:122`: *"Räknar records i Anmälningar (länkat fält)"*).
Alla anmälningar räknas alltså — inklusive `Avbokad/Ombokad` och `Inställt`.

Fältet renderas på Lottas mest trafikerade ytor:

```text
src/components/events/EventCard.tsx:77       — beläggningsmätarens bredd
src/components/events/EventCard.tsx:245-246  — "N av M platser reserverade"
src/components/hem/NastaEventCard.tsx:87     — Hem-sidans nästa-event-kort
src/components/events/EventCard.tsx:27       — "Fullt"-märket via platserKvar
```

Följdfälten ärver: `Anmäld beläggning (%)`, `Platser kvar` och
`Antal slutbetalning saknas` bygger alla på `Antal anmälda`. Dessutom triggar
A6 på `Anmäld beläggning (%) = 1`.

Detta är samma felklass som §27, men på event-axeln i stället för person-axeln
— och den är **inte** registrerad. Konkret följd: eventkortet kan visa "12 av 12
platser reserverade" och märket "Fullt" medan eventsidans register, som räknar
själv via `arAktiv`, listar 10 rader. Två tal för samma sak, i samma app.

**Detta är ett HÄRLETT fynd, inte ett mätt.** Kedjan är belagd i två oberoende
schema-dokument, men jag fick inte röra basen och har alltså inte sett ett
event där talen faktiskt går isär. Verifieringsväg står nedan.

**Fynd 2 — §46:s "kvarstående omätt" kan smalnas av utan ny mätning.**
Posten listar `Nästa event (text)` bland de omätta syskonfälten i
`Motivering`-familjen. Schema-dokumentet beskriver det som *"Tar första raden ur
rollup"* (`schema_reference.md:321`) — vilket är en annan formelform än
`Senaste interaktion (text)`s "returnera vald rollup orörd". Det gör
array-risken för just det fältet strukturellt osannolik. `get-person/index.ts:279-284`
bär redan en kommentar som säger att fältet *"i praktiken ALLTID är null i
drift"*. Två oberoende skäl att flytta ned det i §46:s omätt-lista.

**Fynd 3 — §28:s föreslagna åtgärd är utförd.** Se § De sex som inte
konsumeras. `grep -r flddymQaYJGVCInzq` ger noll träffar i `src/` +
`supabase/functions/`. §28 steg (1) kan bockas; endast steg (2), raderingen i
basen, kvarstår.

---

## Vad jag inte kunde belägga

1. **Att någon av fältformerna fortfarande gäller live.** Passet var
   MCP-fritt per uppdrag. Varje formel jag citerar kommer ur
   `schema_reference.md` (frusen mars 2026) eller
   `datamodell-research/02-live-state.md` (2026-06). Ett fält kan ha ändrats
   sedan dess utan att någotdera doket vet. **Störst osäkerhet: Fynd 1** — hela
   slutsatsen vilar på att `fldU5MCQmagdHtz4G` saknar filtervillkor.
   Verifieringsväg: `get_table_schema` mot Eventplanering, läs `count`-fältets
   `config`.
2. **Hur stort §47-hålet är i prod.** Jag visade att fältet mäter en annan
   granularitet än namnet lovar, och att lead-filtret vilar på det. Jag kunde
   inte mäta hur många Person-records som har touchpoints men tom
   Engagemang-länk. Verifieringsväg: räkna `Personer` med
   `AND({Antal hämtningar} = 0, {Antal anmälningar (totalt)} = 0)` som ändå har
   länkade Touchpoints. **Utan det talet är §47:s prioritering en uppskattning.**
3. **Om Fynd 1 faktiskt divergerar på ett verkligt event.** Kedjan är härledd,
   inte observerad. Ett event med minst en avbokad anmälan avgör saken direkt:
   jämför eventkortets tal med registrets radantal.
4. **Om `Antal skickade` fortfarande visar 1 efter Fas 6h:s senare landningar.**
   §39:s observation är från Session 40. Jag verifierade att koden fortfarande
   läser fältet oförändrat, inte att basens formel är oförändrad.
5. **Renderingen.** Hela passet är en KOD-läsning. `L450`-familjens lärdom
   från S103 gäller: sju av elva fel i persondetaljen syntes bara i renderad
   form. Att ett fält inte förekommer i en `.tsx` är starkt bevis för att det
   inte visas; att ett fält förekommer är svagare bevis för HUR det ser ut.
6. **Övriga 24 registerposter.** De 47 posterna innehåller
   process-/automations-fällor (A1-överskrivning, transaktionsluckor,
   beräkningsfördröjning) som inte har ett bärande fält och därför faller
   utanför en konsumtionskarta. De är inte bedömda här och ska inte läsas som
   "når inte UI".

---

## Rekommendation

Detta är en **rekommendation**, inte ett beslut. Prioriteringen följer
användarpåverkan × åtgärdskostnad, och skiljer medvetet på vad som hör hemma i
basen och vad som hör hemma i koden.

**Först, för att den har ett datum:** fyll på `Månad/år` med 2027 års optioner
(§45). Tolv klick i Airtable-UI:t, och väggen flyttas ett år. Den riktiga
fixen — konvertera fältet till en formel härledd ur `Startdatum` — är fortsatt
rätt T16-kandidat, men den behöver inte vänta på interimet.

**Sedan, de tre bas-fixarna som betalar mest per arbetsinsats:**

1. **§39** — byt `COUNTA({Skickat till})` mot en korrekt räkning. Ensam post i
   registret där EN formeländring gör två synliga tal sanna samtidigt.
2. **§46(b)** — platta `Senaste interaktion (text)`s valda rollup med
   separator. Fixar två skarpa ytor utan kodändring, och gör persondetaljens
   app-sidiga omväg valfri i stället för nödvändig.
3. **§34** — stäm av de 16 föreläsnings-Deltagandena. Ingen formeländring alls;
   ren datahandling som gör en hel segment-modalitet användbar.

**Två poster kräver samordning och bör inte tas ensamma i basen:**

- **§27** — fixas `Är aktiv`-formeln utan att de tre JS-predikaten
  (`Deltagare.tsx:155`, `Gruppdynamik.tsx:51`, `AtgardsSida.tsx:3105`) ändras i
  samma andetag, hamnar app och bas tyst i osynk. Bunta dem.
- **§47** — mät hålets storlek FÖRE något ändras. Är det litet räcker att
  Intresserade-vyns räknarrad rivs, precis som den revs ur persondetaljen; är
  det stort behöver `LEAD_FILTER` peka på touchpoint-relationen i stället.

**En app-fix rekommenderas, och bara en:** §43:s
`"Ej tillgängligt"`-genomsläpp. Basen kan inte laga namnlösheten (dataförlust
vid källan), men appen kan sluta återge basens platshållare som om den vore ett
namn. Fixen hör hemma i `displayName` på alla tre ytorna
(`PersonsList.tsx:107`, `PersonDetail.tsx:283`, `Intresserade.tsx:16`) och är
en jämförelse mot strängen, inte mot truthiness.

**Registerhygien, som kostar nästan ingenting:**

- Registrera Fynd 1 (`Antal anmälda` räknar avbokade) som ny post — den har
  högre användarpåverkan än flera befintliga.
- Lägg Carry 11 i registret som Marcus föreslog, men markera den uttryckligen
  som **ej konsumerad** så att en framtida läsare inte prioriterar upp den.
- Bocka §28 steg (1); noteringen "sök igenom alla konsumenter" är utförd.
- Utöka §46:s app-konsekvens-not med Intresserade-vyn — i dag nämns bara
  personlistan.

**Vad som INTE bör göras:** kompensera §31/§8/§25 app-sidigt. De når inte UI,
och en app-lapp för en osynlig defekt är ren spekulativ komplexitet. Låt dem
ligga som rena bas-kandidater.

---

## Källförteckning

**Repo-interna primärkällor (disk, HEAD `9e8e8e1d`):**

- `docs/reference/data-model.md` § Kända fällor (rad 1146–1341) — defektregistret
- `docs/reference/data-model.md` § Den kritiska distinktionen (rad 606–642) — spår 1/2
- `docs/reference/data-model.md` § Grupp 2 (A4/A5) — Engagemang-tabellens fyllnad
- `docs/reference/schema_reference.md` rad 31, 122, 126–144, 254, 280–283, 321, 334, 391
- `docs/research/datamodell-research/02-live-state.md` rad 89–116, 231–236, 304
- `docs/reference/airtable-interaction.md` §4 (adressering per namn), §5.0
- `tasks/sessions/archive/2026-08/2026-08-10-session-103.md` rad 1210–1216 (Del 8), 1767–1775 (Carry 11)
- [`ADR-062`](../decisions/ADR-062-segment-yta-berakn-medlemskap-fran-kalla.md) beslut 2
- [`ADR-063`](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md)
- [`ADR-064`](../decisions/ADR-064-segment-taxonomi-fran-domanen-strikt-narvaro.md) beslut 4
- [`ADR-100`](../decisions/ADR-100-sanningshierarkin-koden-ager-beteendet.md) §1

**Kod (samtliga `fil:rad` i löptexten är lästa mot denna commit):**

- `supabase/functions/get-person/index.ts` · `get-persons/index.ts` ·
  `get-leads/index.ts` · `get-mail-log/index.ts` · `get-event/index.ts` ·
  `get-events/index.ts` · `get-attendance/index.ts` · `create-event/index.ts` ·
  `update-event/index.ts`
- `supabase/functions/_shared/segment-membership.ts` · `segment-resolution.ts` ·
  `registration-read.ts` · `field-allowlists.ts`
- `src/components/persons/PersonsList.tsx` · `PersonDetail.tsx`
- `src/components/intresserade/Intresserade.tsx` ·
  `src/components/maillog/MailLog.tsx`
- `src/components/events/detail/Deltagare.tsx` · `Gruppdynamik.tsx` ·
  `hallplats-steg-prototyp.ts` · `src/components/events/EventCard.tsx` ·
  `src/components/hem/NastaEventCard.tsx` ·
  `src/components/events/atgarder/AtgardsSida.tsx`
- `src/components/segment/SegmentBuilder.tsx` · `src/lib/segment-taxonomy.ts`
- `src/domain/types/Status.ts` · `src/domain/models/Person.ts` ·
  `src/domain/schemas/Person.schema.ts` · `PersonDetail.schema.ts` ·
  `Intresserad.schema.ts` · `MailPayload.schema.ts`
- `src/routes/_authenticated/mer/maillogg.tsx` · `intresserade.tsx` ·
  `segment.tsx` · `src/routes/_authenticated/personer/index.tsx`
- `scripts/seed-review-fixture.mjs` rad 2596–2614

**Externa källor:** inga. Frågan är helt intern; Airtables egen dokumentation
om `COUNTA`-beteende på länkfält hade kunnat stärka §39:s rotorsakshypotes, men
den hypotesen är inte bärande för konsumtionskartan.
