---
owner: marcus803
updated: 2026-08-14
review_by: 2026-11-14
status: draft
---

# Airtable-basens defekt-register mot live: vad som fortfarande gäller, vad som redan är löst, och vad ingen mätt

> **Proveniens:** avgränsat research-pass (bakgrundsagent), 2026-08-14, kört
> oisolerat i huvudkatalogen på gren `proto/s103-checkin-d-konvergens` @
> `9e8e8e1d`. Underlag för åtgärdsplanen efter Marcus beslut samma dag:
> *"Vi ska INTE vänta på basmaximeringen, vi ska maxa basen kontinuerligt."*
>
> **READ-ONLY hela vägen.** Inget fält, ingen formel, ingen automation, ingen
> vy och ingen datarad har skapats, ändrats eller raderats i någon
> Airtable-bas. Samtliga anrop var `GET` mot Meta-API:t och Records-API:t,
> plus två läsande anrop mot claude.ai-connectorn (`list_automations`,
> `get_automation`). Granskningsfixturen `ZZ-GRANSKNING-S103` är läst, aldrig
> rörd. Denna fil är den enda som skrivits.

---

## Vad jag hittade i repot först

Inventeringen kördes före första live-anropet, per research-passets ordning.

| Yta | Vad den redan täckte | Ålder / status |
|---|---|---|
| [`data-model.md`](../reference/data-model.md) § Kända fällor | **Defekt-registret självt** — 47 numrerade poster. Kravspec per [`ADR-063`](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md) beslut 3. | Posterna daterade 2026-04-28 → 2026-08-10. **Sju av dem hade inte mätts om på 50–108 dagar.** |
| Tråd `T16` ([`tasks/threads/README.md`](../../tasks/threads/README.md) rad 59) | Registrets hemvist. Tunn radform, inget kort. Bär vidgningarna från S27/S33/S35/S38/S60. | `paused` sedan S26 — registrering, ej aktivering |
| [`S103`](../../tasks/sessions/2026-08-10-session-103.md) Del 7 + Carry 11 | Tre bas-defekter belagda (§46, §47, `Manuella flagga`) + **Carry 11, den fjärde, ej registrerad**. | 4 dagar — håller |
| [`airtable-constraints.md`](../reference/airtable-constraints.md) | 30 plattformsväggar A–G. Avgörande för att inte klassa en vägg som defekt. | håller |
| [`prodbas-synk-staging-till-prod-2026-08-11.md`](prodbas-synk-staging-till-prod-2026-08-11.md) | Schema-diff staging↔prod + additiv apply-plan. | 3 dagar — **planens steg 1–2 är UTFÖRDA sedan dess, se § Oväntade fynd** |
| [`claude-ai-airtable-connector-flera-baser-2026-08-10.md`](claude-ai-airtable-connector-flera-baser-2026-08-10.md) | Connectorn nådde bara prod; vägen att lägga till staging. | 4 dagar — **åtgärdad, connectorn når nu båda** |
| [`schema_reference.md`](../reference/schema_reference.md) | Automationerna A1–A11 med skriptkod. | **Frusen mars 2026** — därför live-omläst här |

**Vad som därför är nytt i detta pass:** ingen tidigare post mäter registret
som helhet mot live. De befintliga passen mäter angränsande ytor (schema-diff,
fixturer, connector-räckvidd) men ingen ställer frågan *"håller de 47
posterna fortfarande, och hur mycket data träffas?"*. Detta pass gör det, med
verbatim formeltext ur båda baserna och räknade utfall ur prod.

**Ingen ADR förkastar någon åtgärd som föreslås här.** `ADR-063` beslut 3
pekar tvärtom uttryckligen ut registret som den kravspec som ska lösas ut
i basen.

---

## Kort svar

**Registret håller. 22 av 24 prövbara poster är fortfarande sanna i basen,
och samtliga defekta formler är IDENTISKA i staging och prod** — det finns
ingen miljö där problemet redan är löst.

Tre saker väger tyngst:

1. **Carry 11 är bekräftad i prod, och den är värre än S103 antog.** Alla 57
   prod-personer med ett kommande event visar fel tal — inte några, alla.
   Fördelningen är uteslutande jämna tal (2, 4, 6, 8), den mekaniska
   signaturen på att varje event räknas dubbelt. Och **basen har redan löst
   samma problem på två oberoende sätt på andra fält** — `Kommande event` är
   den enda räknaren i familjen utan dedup. Fix-mallen behöver alltså inte
   uppfinnas, bara kopieras.

2. **Fälla 45 (`Månad/år`-horisonten) är den enda posten med en deadline.**
   Optionerna slutar vid `December 2026`. Från i dag är det 4,5 månader tills
   `create-event` börjar svara 500 på varje event bortom horisonten. Alla
   andra poster är stabila fel; denna blir en driftstörning på ett datum.

3. **Två poster är tysta bomber med känd utlösningsordning.** Fälla 31 (RIM 3
   saknas i `Totala deltaganden`) och fälla 32 (`Fjärrskådning ×` blandar
   utbildning med föreläsning) ger noll fel i dag — enbart för att datan som
   skulle utlösa dem inte är avstämd än. Åtgärdas fälla 34 (de 16 oavstämda
   föreläsnings-raderna) **före** fälla 32, aktiveras ett fel för 14 rader
   som i dag är osynligt. Ordningen mellan posterna är alltså inte fri.

**Två poster kan avföras: fälla 37 och 38 är lösta i båda baserna.**

**Registrets enda faktafel jag hittade** gäller fälla 28. Den beskriver
risken som "gamla fältet saknar RIM 3". I skarp data i dag går divergensen
åt motsatt håll: 78 av 78 personer har ett HÖGRE värde i det gamla fältet,
för att det fångar Psionautics-deltagande som de fyra kursräknarna medvetet
missar. Slutsatsen (migrera bort från det gamla fältet) står, men motiveringen
i registret stämmer inte med basen.

---

## Metod och mätvärden

| Vad | Värde |
|---|---|
| Schema hämtat | Meta-API `GET /v0/meta/bases/{base}/tables`, båda baserna |
| Staging `apphjj8Q7lkXCMsL4` | 21 tabeller, 412 fält |
| Prod `app8uGPrVCVOm6LfD` | 21 tabeller, 410 fält |
| Data läst ur prod | 667 Personer, 866 Anmälningar, 1700 Deltaganden, 51 Eventplanering |
| Data läst ur staging | 60 Personer, Eventformat |
| Automationer | claude.ai-connectorn, `list_automations` mot båda baserna + `get_automation` för A3 (prod) |
| Formelparitet staging↔prod | 22 nyckelfält jämförda mekaniskt på `type` + serialiserad `options` |

**Formeltexterna i denna fil är verbatim ur Meta-API:t.** Airtable lagrar
formler med fält-ID:n, inte fältnamn; där jag visar namn är de upplösta
mekaniskt ur samma schema-dump, aldrig skrivna för hand.

---

## Tabell — hela registret mot live

Kolumnen **Klass** använder uppdragets fyra värden. `latent` markerar en
defekt som är strukturellt kvar men i dag inte producerar fel utfall, för att
utlösande data saknas.

| # | Post | Källa | Live-status | Belägg | Kvantifiering | Fix-kandidat |
|---|---|---|---|---|---|---|
| **C11** | `Kommande event` saknar sessions-dedup | S103 Carry 11 | **defekt, KVARSTÅR** | `Kommande poäng` refererar aldrig `Session` | **57/57 prod-personer fel**; Σ=142 där sant=71 | Kopiera sessionsfiltret ur `Genomfört event` |
| 23 | `RECORD_ID({länk})` ger eget ID | 2026-04-28 | **defekt, KVARSTÅR** | Formler oförändrade, `isValid: true` | **1652/1652** Deltaganden fel | `ARRAYJOIN`-länk, eller stryk fälten |
| 24 | Case-dubletter i `Vill anmäla sig till` | 2026-04-28 | **defekt, KVARSTÅR** | 8 optioner, 2 par kollisioner | **62 records** på fel option (55 + 7) | Konsolidera till kanonisk option |
| 25 | `Manuella flagga` + `Systemkälla` tomma | 2026-04-28 | **defekt, KVARSTÅR** | `choices: []` i båda baserna | 0 rader kan bära värde | Stryk fälten i UI |
| 26 | SHA256-hashar som option-namn | 2026-04-28 | **defekt, KVARSTÅR** | 2 hash-optioner oförändrade | **100 records** bär obegriplig källa | Byt namn, backfilla |
| 27 | `Är aktiv (1/0)` exkluderar ej `Inställt` | 2026-04-28 | **defekt, KVARSTÅR** | Formeln oförändrad | 2 Inställt-anmälningar, båda `=1` | Utöka formelns `OR` |
| 28 | Två parallella `Antal genomförda event` | 2026-04-28 | **defekt, KVARSTÅR** (motivering fel) | Båda fälten kvar | **78 personer divergerar**, alla gammal > ny | Migrera konsumenter, radera gamla |
| 31 | `Totala deltaganden` saknar RIM 3 | 2026-06-25 | **defekt, latent** | Formeln saknar `{RIM 3 ×}` | 0 fel i dag; **17 personer väntar** | Peka om till `Antal genomförda event` |
| 32 | `Fjärrskådning ×` blandar modaliteter | 2026-06-25 | **defekt, latent** | Formeln refererar aldrig `Session`/`Typ` | 0 fel i dag; **14 rader väntar** | Modalitets-distinkt räknare |
| 33 | Föreläsning + Psionautics surfar ej per person | 2026-06-25 | **lucka, KVARSTÅR** | Ingen sådan räknare finns | 0 av 16 resp. 220 synliga | Per-person (kurs × modalitet) |
| 34 | 16 oavstämda föreläsnings-Deltaganden | 2026-06-25 | **data, KVARSTÅR oförändrat** | Samtliga `Ej avstämt` | **16/16**, 50 dagar utan åtgärd | Stäm av i basen |
| 35 | Naket "Resor i medvetandet" | 2026-06-25 | **KVARSTÅR** | Egen option + eget kursnamn | 2 event, 2 Deltaganden, 2 anmälningar | Entydig etikett |
| 36 | `Månad/år` manuellt singleSelect | 2026-06-27 | **defekt, KVARSTÅR** | `type: singleSelect`, 14 choices | Alla 51 event beroende av manuell synk | Konvertera till formel |
| 37 | `Idempotensnyckel` på Eventplanering | 2026-06-27 | **REDAN LÖST** | Finns i båda baserna | — | avför |
| 38 | `Utskickslogg` saknar idempotens-kolumn | 2026-06-28 | **REDAN LÖST** | Prod `fldXnfsdYxTB7PALv` finns nu | — | avför |
| 39 | `Antal skickade` felräknar (`COUNTA`) | 2026-06-29 | **defekt, KVARSTÅR; roten NU BEVISAD** | Formeln oförändrad | Utfall **omätt** (tabellen tom); roten belagd via fälla 47 | Rollup i stället för `COUNTA` |
| 40 | `Personer.E-post` matchas skiftlägeskänsligt | 2026-07-08 | **defekt, KVARSTÅR** | Inget normaliserat fält på Personer | **14 av 665** avvikande; 1 dubblettpar synligt | Normalisera + matchningsfält |
| 41 | Orphan-Deltaganden | 2026-07-08 | **data, KVARSTÅR och HAR VUXIT** | Alla `Ej avstämt` (åtgärden håller) | **48** (var 44) — 4 nya på ett annat event | Radera + exkludera i närvarobulk |
| 42 | Anmälan utan e-post ⇒ omatchbar Person | 2026-07-09 | **defekt, KVARSTÅR** | A2 trigger fortfarande `recordCreated` | 2 anmälningar, 2 Personer (1 med närvaro) | Obligatoriskt fält, eller A2 läser om |
| 43 | 365 namnlösa anmälningar | 2026-07-09 | **ej åtgärdbar, BEKRÄFTAD exakt** | Alla `Backfill (historisk)` | **365/866**, exakt registrets tal | ingen — bärs |
| 45 | `Månad/år`-horisonten slutar 2026-12 | 2026-07-24 | **defekt, KVARSTÅR — NU AKUT** | Sista option `December 2026` | **4,5 månader kvar** | Formel (permanent) eller påfyllnad |
| 46 | `Motivering (text)` deklarerar fel typ | 2026-07-30 | **defekt, KVARSTÅR — kraftigt utvidgad** | Formeln returnerar rollup orörd | **211/211 är arrays; 80 har flerhet** | Platta, eller deklarera ärligt |
| 46b | `Senaste interaktion (text)` konkatenerar | 2026-08-10 | **defekt, KVARSTÅR strukturellt** | Alla 5 grenar returnerar rollup orörd | 1 instans i staging, **0 i prod** | Platta med separator |
| 47 | `Antal hämtningar` räknar `Engagemang` | 2026-08-10 | **defekt, KVARSTÅR — dubbel** | `COUNTA({Engagemang})` | **68 av 667** divergerar | Peka om + byt bort `COUNTA` |

**Poster jag klassar som plattformsvägg, inte bas-defekt** (rot i
[`airtable-constraints.md`](../reference/airtable-constraints.md), ska inte
åtgärdas i basen): 2 (P12), 3 (P13), 10 (P23), 17 (P14), 18 (P15), 19 (P16),
20 (P17). Fälla 23 är ett gränsfall: **roten** är P8, men **instansen** — att
fälten finns, deklarerar något de inte gör, och konsumeras av `Närvaro
(nyckel)` — är vår egen och åtgärdas i basen.

**Poster som är designval eller dokumenterat beteende, inte defekter:** 1, 4,
5, 6, 7, 8, 11, 13, 14, 21, 22, 44.

**Poster som ligger i appen, inte i basen:** 15 (dead code i frontend —
bekräftad: `Källa` har optionerna `Manuell | +1 | Väntelista`, ingen
"Arrangör"), 29, 30.

**Ej reproducerbara i dag:** 12 och 16 (samtliga 51 prod-event har
`Sessionsmall` satt — noll instanser av felläget just nu).

---

## Carry 11 i detalj — den avgörande delfrågan

Uppdraget bad om båda formlerna och exakt vad sessionsfiltret gör som den
andra saknar. Här är de, verbatim ur prod.

### Den trasiga kedjan

`Personer.Kommande event` (`fldITyVMA9a4SHdgN`) är en rollup över
`Deltaganden.Kommande poäng` via länkfältet `Deltaganden`
(`fld5shm9UER5CMyTl`).

`Deltaganden.Kommande poäng` (`fldahsniYiJ7JVNql`), verbatim:

```text
IF({fldExIP1zw5o6ib63} >= TODAY(), 1, 0)
```

Med fältnamn upplösta:

```text
IF({Event startdatum} >= TODAY(), 1, 0)
```

`Deltaganden.Kommande sammanfattning` (`fldY2qYntd59jI1Iv`), som matar
`Nästa event (rad)`, verbatim:

```text
IF(
  AND(
    {fldExIP1zw5o6ib63} >= TODAY(),
    {fldwuo94BY46VUOm4} = 0
  ),
  {fldowG8oh8PtB8M19},
  BLANK()
)
```

Med fältnamn upplösta:

```text
IF(
  AND(
    {Event startdatum} >= TODAY(),
    {Närvaropoäng} = 0
  ),
  {Event sammanfattning},
  BLANK()
)
```

**Ordet `Session` förekommer inte i någon av dem.** `Event startdatum` är
en rollup från Deltagandet till dess Event, så båda sessionsraderna för ett
tvådagars-event bär samma datum, får båda `1`, och summeras.

### Fix-mallen — vad `Genomfört event` gör som `Kommande` inte gör

`Deltaganden.Genomfört event (1 rad per event)` (`fldRfc4i7HHfc1dFU`),
verbatim:

```text
IF(
  AND(
    {fldwuo94BY46VUOm4}=1,
    OR({fldBPZnsDL0bNIRHx}="Dag 1", {fldBPZnsDL0bNIRHx}="Föreläsning")
  ),
  {fld2pOnpyDl9tVtZd},
  BLANK()
)
```

Med fältnamn upplösta:

```text
IF(
  AND(
    {Närvaropoäng}=1,
    OR({Session}="Dag 1", {Session}="Föreläsning")
  ),
  {Eventlabel (text)},
  BLANK()
)
```

**Skillnaden är exakt en rad:**
`OR({Session}="Dag 1", {Session}="Föreläsning")`. Den släpper igenom precis
en session per event — den första dagen för en utbildning, den enda
föreläsningen för en föreläsning. Alla `Dag 2`-rader faller till `BLANK()`
och bidrar inte till rollupen.

### Basen har redan löst det på TVÅ sätt — och Kommande använder inget av dem

Detta står inte i S103:s carry och är passets starkaste enskilda fynd. Jag
summerade varje räknare över alla 667 prod-Personer och jämförde med antalet
Deltaganden-rader som matar den.

| Räknare | Σ över Personer | Matchande Deltaganden-rader | Kvot |
|---|---|---|---|
| `RIM 1 ×` | 320 | 640 | **0,50** |
| `RIM 2 ×` | 90 | 180 | **0,50** |
| `Fjärrskådning ×` | 136 | 272 | **0,50** |
| `Antal genomförda event (gammal)` | 624 | 624 (`Dag 1`/`Föreläsning`) | **1,00** |
| **`Kommande event`** | **142** | **142 (alla sessioner)** | **1,00 mot fel nämnare** |

De tre kursräknarna dedupar trots att deras källformler (`RIM 1 eventkey`
med flera) saknar sessionsfilter. Mekanismen sitter i rollupens
aggregering över `Eventkey (lookup)`, och jag bevisade den mekaniskt:

> För `RIM 1 ×` gäller att värdet är lika med antalet **distinkta**
> eventkeys för **310 av 310** personer, och lika med antalet **rader** för
> **0 av 310**. Samtliga 310 har fler rader än distinkta event.

Det ger två färdiga mallar:

- **Mall A — unik-aggregering.** Rolla upp en eventnyckel och räkna unika
  värden. Kräver ingen formeländring i Deltaganden.
- **Mall B — sessionsfilter i källformeln.** Det `Genomfört event` gör.
  Krävs när fältet är text som ska sammanfogas, eftersom sammanfogning inte
  kan deduplicera.

`Nästa event (rad)` är ett textfält och behöver därför **mall B**.
`Kommande event` är ett tal och kan använda endera.

### Kvantifiering i prod

| Mätvärde | Prod |
|---|---|
| Personer med `Kommande event` > 0 | **57** |
| Fördelning av värdet | 2 → 47 st · 4 → 7 st · 6 → 2 st · 8 → 1 st |
| Udda värden | **0** — signaturen på systematisk dubbelräkning |
| Deltaganden med `Kommande poäng` = 1 | 142 |
| Deras sessionsfördelning | **71 `Dag 1` + 71 `Dag 2`** |
| Distinkta (Person, Event)-par | **68** |
| Vad rollupen borde ge | **71** (antalet `Dag 1`-rader) |
| Vad den ger | **142** |

Överräkningen är alltså exakt 2× för varje tvådagars-event, och **inget** av
de 57 personerna visar rätt tal.

`Nästa event (rad)` bär samma händelse två gånger, verbatim ur API:t:

```text
"Rönninge – Utbildning – Resor i medvetandet 1 – 2026-08-22\nRönninge – Utbildning – Resor i medvetandet 1 – 2026-08-22"
```

Flera personer bär dessutom inledande tomrader, eftersom rollupen tar med
`BLANK()`-värdena som tomma rader:

```text
"\n\n\n\nRönninge – Utbildning – Resor i medvetandet 3 – 2026-09-05\nRönninge – Utbildning – Resor i medvetandet 3 – 2026-09-05"
```

Det är en andra, kosmetisk defekt i samma fält, och den försvinner inte av
sessionsfiltret ensamt.

### Varför prod träffas så hårt

| Mätvärde | Prod |
|---|---|
| Event med sessionsmallen `Dag 1 + Dag 2` | **47 av 51** (92 %) |
| Event med sessionsmallen `Föreläsning` | 4 |
| **Kommande** event (start ≥ i dag) | 6, varav **6 tvådagars** |
| Anmälningar på dessa | 75 |

Staging visar samma bild: 16 av 17 personer med kommande event bär värdet 2.

### Roten bekräftad i A3:s källkod

Uppdraget sade att A3 skapar en rad per session. Läst ur prod
(`get_automation wfl4qb2eP28SfKlck`), verbatim ur skriptet:

```javascript
const passVals = eventRec.getCellValue(FLD_EVENT_PASSES) || [];
const sessions = passVals
  .map(p => (typeof p === "string" ? p : (p?.name ?? p)))
  .filter(Boolean);
...
for (const s of sessions) {
  if (existing.has(s)) continue;
  toCreate.push({ fields: { ... [FLD_DEL_SESSION]: { name: s }, ... } });
}
```

**A3 är korrekt.** Den är till och med idempotent — `existing`-mängden
hindrar dubbletter vid omkörning. En rad per session är avsedd design, och
närvaro per dag kräver den. Defekten sitter i räknaren, inte i automationen,
och fixen ska därför inte röra A3.

---

## Per-defekt-detalj — de poster där live-läget ändrar bilden

### Fälla 28 — registrets motivering stämmer inte med basen

Registret säger att konsumenter på det gamla fältet får data **utan RIM 3**.
I prod i dag går divergensen åt motsatt håll i samtliga fall.

| Mätning | Värde |
|---|---|
| Personer där gammalt ≠ nytt | **78** |
| Av dessa: gammalt **högre** | **78** |
| Av dessa: nytt högre | **0** |
| Personer med `RIM 3 ×` > 0 | **0** |

Ett exempel, verbatim: John Carter har `Antal genomförda event (gammal)` = 1
och `Antal genomförda event` = 0, med alla fyra kursräknare på 0 och
`Genomförda event (lista)` = `"Ödeshög – Utbildning – Psionautics – 2026-05-01"`.

Orsaken är att det gamla fältet rollar upp `Genomfört event`, som gäller
**alla** kursnamn, medan det nya summerar fyra namngivna räknare.
Psionautics (fälla 4, avsiktligt uteslutet) och det nakna "Resor i
medvetandet" (fälla 35) faller därför utanför det nya fältet men fångas av
det gamla. Det är fälla 33:s lucka, synlig i data.

Slutsatsen står — migrera bort från det gamla fältet — men **det gamla fältet
är i dag bredare, inte smalare, än det nya.** Raderas det utan att fälla 33
åtgärdas förloras 78 personers Psionautics-historik ur den räknade vyn.

### Fälla 39 — hypotesen om roten är nu bevisad, mot en annan instans

Registret bär `[HYPOTES om rot — EJ verifierad]`: att `COUNTA` behandlar en
länkcell som ett enda värde. `Utskickslogg` är tom i **båda** baserna, så
felutfallet kan inte mätas om. Men samma formelform finns på ett fält med
gott om data — fälla 47:s `Antal hämtningar` = `COUNTA({Engagemang})`, där
`Engagemang` är `multipleRecordLinks`. Prövat mot alla 667 prod-Personer:

| Länkade `Engagemang`-rader | `COUNTA` gav | Antal personer |
|---|---|---|
| 0 | 0 | 554 |
| 1 | 1 | 105 |
| **2** | **1** | **8** |

Hypotesen håller: `COUNTA` mättas vid 1 för länkfält. **Fälla 39 och fälla 47
har därmed samma bevisade rot**, och båda kräver samma sorts fix — en rollup
med `COUNT`-aggregering, inte en formel.

Det gör också fälla 47 till en **dubbel** defekt: fältet räknar (a) fel
tabell och (b) med en funktion som kapar vid 1. Att bara peka om formeln till
rätt relation löser hälften.

### Fälla 46 — registrets omätta led är nu mätta, i prod

Registret noterade flerhet som observerad enbart i staging (Sofia Isaksson,
fyra element). I prod:

| Mätning | Värde |
|---|---|
| Personer med `Motivering (text)` | **211** |
| Returnerade som array | **211 av 211** (100 %) |
| Med fler än ett element | **80** |

Fältet deklarerar `singleLineText` och levererar array i **varje** fall där
det har ett värde. `TASK-52`:s app-fix (`stringArray` + `z.array(z.string())`)
är därmed inte bara förenlig med verkligheten — den är den enda formen som
kan fungera. Bas-sidan av posten står oförändrat öppen.

### Fälla 46b — strukturellt kvar, men noll instanser i prod

S103 skrev att konsekvensen är *"LEVANDE i den promoverade personlistan"*.
Det är sant om formen, men jag hittar **noll** prod-personer där fältet bär
konkatenerad text. Sökt över alla 667 med två oberoende mönster (flera
verbfraser i samma sträng; ordgräns utan separator). Längsta prod-värdet är
46 tecken och innehåller en enda mening.

Staging bär däremot exakt den instans registret bokför, verbatim:

```text
"Anmälde sig till RIM 1 i FalköpingAnmälde sig till RIM 2 i FalköpingAnmälde sig till Fjärrskådning i Falköping"
```

**Ärlig klassning:** defekten är verklig och formeln är oförändrad i båda
baserna, men den utlöses bara när en person har flera interaktioner som
samma datetimekey väljer mellan. Ingen prod-person uppfyller det i dag.
Prioriteringsmässigt är den lägre än registret antyder, och kravet på fix
kvarstår oförändrat.

### Fälla 45 — den enda posten med ett datum

`Månad/år` (`fld2BjFdBd964TzVb`) är `singleSelect` med 14 optioner, från
`November 2025` till `December 2026`, identiskt i båda baserna. Prod har
redan event i September (2), Oktober (1) och November 2026 (2).

`create-event` härleder värdet ur `Startdatum` och skriver utan typecast, så
det första event någon lägger in med start i januari 2027 ger 500. Från i dag
är det **4,5 månader**. Detta är den enda posten i registret som förvandlas
från fel till driftstopp på ett bestämt datum.

Fälla 36 är samma fält och samma fix: konverteras det till en formel härledd
ur `Startdatum` försvinner både drift-risken och horisonten permanent.

### Fällorna 31, 32 och 34 — ordningen mellan dem är inte fri

Alla tre är i dag utan synligt fel, av besläktade skäl.

| Post | Varför noll fel i dag | Vad som utlöser den |
|---|---|---|
| 31 | `RIM 3 ×` = 0 för alla 667 personer | RIM 3-event genomförs och stäms av |
| 32 | Alla 14 FS-föreläsningsrader är `Ej avstämt` | Föreläsningsnärvaro stäms av (= fälla 34) |
| 34 | — (posten ÄR den oavstämda datan) | ingenting; den är felet |

Prod har 36 RIM 3-Deltaganden fördelade på **17 personer**, och två kommande
RIM 3-event (2026-09-05 med 10 anmälda, 2026-11-28 med 9). När det första
stäms av börjar `Totala deltaganden` ljuga för exakt de personerna. Fälla 31
har alltså också en ungefärlig deadline: **omkring tre veckor.**

Fälla 32 är farligare i sin koppling. Prod har 322 FS-Deltaganden: 308
`Utbildning` och 14 `Föreläsning`. Endast utbildningsraderna har
`Närvaropoäng` = 1. **Stäms fälla 34 av innan fälla 32 är fixad, räknas 14
föreläsningsdeltaganden in som FS-kurs** — och blandningen registret varnar
för blir verklig i samma ögonblick. Åtgärdsplanen behöver därför lägga 32
före 34.

### Fälla 41 — antalet har vuxit

| Mätning | 2026-07-08 (registret) | 2026-08-14 (nu) |
|---|---|---|
| Orphan-Deltaganden i prod | 44 | **48** |
| Fördelning | Event-17 (Psionautics) | 44 Psionautics + **4 Varberg-Fjärrskådning** |
| Status | (åtgärdade till `Ej avstämt`) | **48 av 48 `Ej avstämt`** |

Två avläsningar: Session 60:s icke-destruktiva åtgärd **håller** — ingen av
de gamla har glidit tillbaka. Men fyra nya har uppstått på ett **annat**
event sedan dess. Orphans är alltså inte en avslutad historisk hög utan ett
pågående flöde, och registrets åtgärdsförslag (exkludera länklösa Deltaganden
i närvarobulken) är den del som faktiskt stoppar tillväxten.

### Fälla 24 — dubbletterna bär skarp data

| Option | Records |
|---|---|
| `Resor i medvetandet 1` (kanonisk) | 111 |
| **`Resor i Medvetandet 1`** (versal M) | **55** |
| `Resor i medvetandet 2` (kanonisk) | 41 |
| **`Resor i Medvetandet 2`** (versal M) | **7** |
| `Resor i medvetandet` (naket, fälla 35) | 2 |

En tredjedel av alla RIM 1-val (55 av 166) ligger på fel option. Det är inte
en teoretisk namnfälla utan en aktiv splittring av det mest använda kursvalet
i basen. RIM 3 och Fjärrskådning har ingen dubblett.

### Fällorna 25, 26, 27, 40, 42, 43 — oförändrade, kvantifierade

| Post | Mätning i prod |
|---|---|
| 25 | `Manuella flagga` och `Systemkälla`: `choices: []` och **0 rader med värde** i båda baserna |
| 26 | Hash-optionerna bär **100 records** (66 + 34) |
| 27 | 2 anmälningar med `Status = Inställt`, båda med `Är aktiv (1/0)` = **1** |
| 40 | **14 av 665** Person-e-postadresser avviker i skiftläge eller blanksteg; `K***@hotmail.com` (maskad, verklig adress) förekommer **två gånger** — dubbletten har redan inträffat |
| 42 | 2 anmälningar utan e-post; 2 Personer utan e-post, varav **1 med Deltaganden** |
| 43 | **365 av 866** namnlösa, samtliga `Från formulär = Backfill (historisk)` — exakt registrets tal, oförändrat |

Personer-tabellen har fortfarande inget normaliserat e-postfält (endast
`E-post` `multilineText` och `E-post (manuell inmatning)` `email`), medan
Anmälningar har `Normaliserad e-post`. Asymmetrin som orsakar fälla 40 är
alltså intakt.

---

## Miljöparitet — defekterna finns i BÅDA baserna

22 nyckelfält jämfördes mekaniskt på typ och serialiserad konfiguration.
**21 är byte-identiska.** Det enda undantaget är `Senaste interaktion (text)`,
där staging refererar `fldeiyO7B8xDzBB2D` och prod `fldj5IxwmjJ3giZhT` —
båda upplöses till `Personer.Senaste anmälan datetimekey`. Ren
fält-ID-substitution, samma klass som
[`prodbas-synk-passet`](prodbas-synk-staging-till-prod-2026-08-11.md)
avfärdade mekaniskt. Formelns struktur är identisk.

**Konsekvens för åtgärdsplanen:** varje fix måste göras två gånger, och
staging kan bära hela verifieringen först. Ingen defekt är prod-unik.

Tabellparitet: 21 tabeller i båda, noll diff åt något håll.

---

## Vad jag inte kunde belägga

1. **Rollupens aggregeringsuttryck går inte att läsa.** Meta-API:t returnerar
   `recordLinkFieldId`, `fieldIdInLinkedTable`, `referencedFieldIds: []` och
   `result` — men **inte** funktionen (`SUM`, `COUNTA(ARRAYUNIQUE(values))`
   eller annat). Dedup-mekanism A är därför **härledd ur mätning**
   (310/310 mot distinkta, 0/310 mot rader), inte avläst. Slutsatsen om
   beteendet är stark; den exakta formuleringen av aggregatet är **OMÄTT**
   och måste läsas i Airtables UI innan den skrivs av i en fix.

2. **Fälla 39:s felutfall kunde inte mätas om.** `Utskickslogg` har **noll
   rader** i båda baserna, så det observerade "2 mottagare visade 1" från
   Session 40 kan inte reproduceras. Formeln är oförändrad och roten är
   bevisad via fälla 47, men utfallet självt är **OMÄTT** i dag.

3. **`Öppningsgrad (%)`-ärvningen är omätt av samma skäl** — utan rader finns
   ingen nämnare att observera.

4. **Fälla 26:s orsak är fortfarande obelagd.** Jag bekräftade att
   hash-optionerna finns och bär 100 records, men **inte** vilken integration
   som skapade dem. Registrets `[HYPOTES]` om Zapier eller Make står kvar
   oprövad — det kräver åtkomst till de integrationerna, inte till basen.

5. **Fälla 42:s trigger-snapshot-mekanism är fortfarande hypotes.** Jag
   bekräftade att A2:s trigger är `recordCreated` på Anmälningar och att
   grenstrukturen matchar registrets beskrivning (gren 1 uppdaterar namn men
   har **ingen** nod som kopplar anmälan — synligt i grafen). Men **att**
   fälten var tomma i trigger-ögonblicket kan inte bevisas i efterhand;
   det kräver körhistorik jag inte når.

6. **Vyer, formulär, interfaces och extensions är oprövade.** Passet läste
   fält, formler, data och automationer. Om någon vy eller något formulär
   konsumerar ett defekt fält vet jag det inte, och konsument-analysen för
   fälla 28 (`grep` efter `flddymQaYJGVCInzq`) är därmed ofullständig på
   bas-sidan.

7. **Jag har inte prövat om någon fix faktiskt fungerar.** Passet är
   read-only. Varje fix-kandidat nedan är härledd ur ett mönster som redan
   fungerar i basen, men ingen av dem är körd.

8. **Registrets poster 1–22 prövades mot schema och data där det var
   möjligt, men flera av dem är beteendepåståenden om automationer**
   (9, 12, 16, 21) som bara kan bekräftas genom att observera en körning.
   Jag klassade dem utifrån automationsgrafen, inte utifrån ett observerat
   förlopp. Fälla 12 och 16 har dessutom noll aktuella instanser eftersom
   samtliga 51 prod-event har `Sessionsmall` satt.

---

## Rekommendation

Detta är en rekommendation, inte ett beslut. Hemvist och ordning är Marcus.

**Ordningen är inte godtycklig.** Två beroenden är mätta och måste hållas:

- **Fälla 32 före fälla 34.** Stäms föreläsningsnärvaron av först aktiveras
  ett fel för 14 rader som i dag är osynligt.
- **Fälla 33 före fälla 28:s radering.** Raderas det gamla fältet innan
  Psionautics har en egen signal förloras 78 personers historik ur den
  räknade vyn.

**Föreslagen sekvens:**

1. **Carry 11** — registrera posten i
   [`data-model.md`](../reference/data-model.md) § Kända fällor som **48**,
   och fixa båda formlerna med mall B (sessionsfiltret ur `Genomfört event`).
   Störst mätt påverkan i registret: 57 av 57 personer, synligt i den
   promoverade personlistan.
2. **Fälla 45 och 36** — samma fält, en åtgärd. Konvertera `Månad/år` till
   formel härledd ur `Startdatum`. Har en deadline; de andra har det inte.
3. **Fälla 32**, sedan **fälla 34**. Ordningen är obligatorisk.
4. **Fälla 31** — före det första RIM 3-eventet 2026-09-05.
5. **Fällorna 39 och 47** — samma rot, samma fix-form, en arbetsenhet.
6. **Fälla 24** — 62 records på fel option i det mest använda kursvalet.
7. **Fälla 40** — normaliserat matchningsfält på Personer; en dubblett har
   redan inträffat.
8. **Fälla 41** — exkludera länklösa Deltaganden i närvarobulken. Stoppar
   tillväxten; städningen av de 48 är en separat, destruktiv handling.
9. **Fällorna 25, 26, 46, 46b, 23, 27, 42, 33, 35** — stabila fel utan
   deadline.
10. **Avför 37 och 38** ur registret med en not om att de är lösta.

**Rätta samtidigt fälla 28:s motivering i registret.** Den beskriver i dag
en risk som data motsäger.

**Två noteringar om form:**

- Varje fix körs mot staging först och verifieras där. Formlerna är
  identiska, så staging är en giltig proxy — det är mätt, inte antaget.
- Airtables Meta-API kan **inte** ändra ett fälts typ och **inte** radera
  fält (bokfört i registret vid fälla 25). Fälla 36/45 och samtliga
  raderingar kräver därför handgrepp i Airtables UI, inte MCP-anrop. Det
  påverkar hur åtgärdsplanen kan delegeras.

---

## Oväntade fynd utanför frågan

Registrerade, inte tyst förkastade.

1. **Prodbas-synkens apply-plan är utförd.** Passet från 2026-08-11
   rekommenderade tre steg. Steg 1 och 2 är gjorda — `Bilagor` och `Kvitton`
   finns nu i prod, och tabellparitet är 21 mot 21 med noll diff. Steg 3
   (`Väntelista.Event (länk)`) är **inte** gjort, vilket följer passets egen
   rekommendation att skjuta upp det. Ordningen är alltså genomförd precis
   som föreslagen. Jag hittar ingen bokföring av att steg 1–2 landat.

2. **claude.ai-connectorn når nu båda baserna.** Passet från 2026-08-10
   lämnade det som en öppen lucka. Den är stängd — `list_automations`
   fungerade mot både prod och staging i detta pass. Men
   `~/.claude/CLAUDE.md` § Verktygsfakta bär fortfarande formuleringen
   *"pariteten mot staging förblir overifierad och får aldrig antas"*. Den
   raden är åldrad och bör rättas.

3. **Stagings automationer är `undeployed`, prods är `deployed`.** Detta är
   redan känt (S103 Del 4, `todo.md`), och jag re-bekräftade det. Värt att
   upprepa i åtgärdssammanhang: **automationsdrivna defekter kan inte
   reproduceras i staging.** Fällorna 9, 12, 16, 21 och 42 kan bara
   observeras i prod, vilket är den ena defektklass där staging-först-regeln
   inte är tillgänglig.

4. **`Anmälningar.Källa` har en option som heter `+1`.** Optionerna är
   `Manuell | +1 | Väntelista`. Fälla 15 bokför att "Arrangör" saknas, vilket
   stämmer, men nämner inte `+1`. Vad den betyder framgår inte av schemat och
   jag har inte utrett det. Möjlig kandidat för samma städning som fälla 26.

5. **`Nästa event (rad)` bär ledande tomrader** från `BLANK()`-värden i
   rollupen. Kosmetiskt, men det är text som renderas i appen, och
   sessionsfiltret ensamt tar inte bort det. Bör hanteras i samma fix som
   Carry 11.

6. **Fälla 43:s 365 är exakt oförändrat** — samma tal som Session 60 mätte,
   alla på `Backfill (historisk)`. Ingen drift på 36 dagar. Registrets
   klassning "bärs, jagas inte" är intakt.

---

## Källförteckning

**Primärkällor — live, denna dag (2026-08-14), read-only:**

- Airtable Meta-API, `GET https://api.airtable.com/v0/meta/bases/apphjj8Q7lkXCMsL4/tables` — stagings fullständiga schema (21 tabeller, 412 fält)
- Airtable Meta-API, `GET https://api.airtable.com/v0/meta/bases/app8uGPrVCVOm6LfD/tables` — prods fullständiga schema (21 tabeller, 410 fält)
- Airtable Records-API, `GET /v0/app8uGPrVCVOm6LfD/{tbl6ZyCm3V026iFTU,tbloOcrppVoyrHbrq,tbldWHH6sSHWoQPHH,tblVE3UKWl1CKrphV,tblqFpgxEhJ95AEcM,tblIesjbuSWNp6oxK,tbl22SCvlHrgcAiZi,tbl8qhuJQ5ZWPMRk4}` — paginerat
- Airtable Records-API, motsvarande läsningar mot `apphjj8Q7lkXCMsL4`
- claude.ai Airtable-connector, `list_automations` mot båda baserna
- claude.ai Airtable-connector, `get_automation` (`wfl4qb2eP28SfKlck`, A3, prod) — skriptkoden citerad ovan
- Airtable Web API-dokumentation, [`https://airtable.com/developers/web/api/field-model`](https://airtable.com/developers/web/api/field-model) — fältmodellen; bekräftar att rollup-aggregatet inte exponeras i `options`

**Repo-källor:**

- [`docs/reference/data-model.md`](../reference/data-model.md) § Kända fällor — registret, poster 1–47
- [`docs/reference/airtable-constraints.md`](../reference/airtable-constraints.md) — plattformsväggarna P1–P30
- [`docs/reference/schema_reference.md`](../reference/schema_reference.md) — frusen automationskarta, mars 2026
- [`docs/reference/testkonton.md`](../reference/testkonton.md) — identitetsroller, relevant för fällorna 41 och 44
- [`tasks/threads/README.md`](../../tasks/threads/README.md) rad 59 och 203 — tråd `T16`
- [`tasks/sessions/2026-08-10-session-103.md`](../../tasks/sessions/2026-08-10-session-103.md) — Del 7, Carry 11, Del 4 (automations-deploystatus)
- [`docs/decisions/ADR-063`](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md) — registret som kravspec
- [`docs/decisions/ADR-062`](../decisions/ADR-062-segment-yta-berakn-medlemskap-fran-kalla.md) — route-around-but-register
- [`docs/decisions/ADR-064`](../decisions/ADR-064-segment-taxonomi-fran-domanen-strikt-narvaro.md) — beslut 4(a)/4(b), fällorna 34 och 35
- [`docs/decisions/ADR-066`](../decisions/ADR-066-skapa-event-write-vertikal-idempotens.md) — beslut 3 och 6, fällorna 36, 37, 45
- [`docs/decisions/ADR-050`](../decisions/ADR-050-isolerad-staging-miljo.md) — staging-miljöns isolering
- [`docs/research/prodbas-synk-staging-till-prod-2026-08-11.md`](prodbas-synk-staging-till-prod-2026-08-11.md) — schema-diffen vars plan nu är delvis utförd
- [`docs/research/claude-ai-airtable-connector-flera-baser-2026-08-10.md`](claude-ai-airtable-connector-flera-baser-2026-08-10.md) — connectorns räckvidd
- [`docs/research/staging-fixturinventering-2026-08-10.md`](staging-fixturinventering-2026-08-10.md) — stagings fixturer
