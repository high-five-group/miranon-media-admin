# Var ska en användarvänd MENING byggas — i Airtables formelfält eller i appen?

> **Proveniens:** avgränsat research-pass (bakgrundsagent), 2026-08-10. Kört
> oisolerat i `.claude/worktrees/s103-t97-personvyerna`, ocommittat.

## Vad jag redan hade, innan sökningen

Tre pass från samma dag (2026-08-10) täcker angränsande mark:

- **[`touchpoint-kurs-och-ort-2026-08-10.md`](./touchpoint-kurs-och-ort-2026-08-10.md)**
  är den styrande utredningen för `TASK-184`, som redan **implementerat** en
  bas-sida lösning: åtta nya beräknade fält plus utvidgade formler, för att ge
  anmälningsgrenen i `Personer.Senaste interaktion (text)` kurs och ort. Passet
  rekommenderade uttryckligen "läs strukturerade fakta via befintlig länk,
  bygg meningen i basen" och motiverade det med `ADR-063`. Det är **mekanik**
  för EN specifik gren, inte en generell arkitekturprövning av VAR
  presentationslogik hör hemma — den frågan ställdes aldrig i det passet.
- **`docs/reference/data-model.md:488-584`** dokumenterar vad `TASK-184`
  faktiskt landade, i BÅDA baserna, samma dag.
- **`personlista-scanlista-branschmonster-2026-08-10.md`** är orelaterat
  (radstil/statuspiller, inte presentationslogikens placering).
- **`ADR-063`** är det styrande beslutet ("Resolution sker I BASEN") men tar
  aldrig explicit ställning till just SPRÅK/GRAMMATIK-komposition som en egen
  underkategori av "defekt" — det generaliseras här för första gången.
- **`ADR-100`** (sanningshierarkin) pekar ut `data-model.md` som auktoritativ
  källa FÖR EXTERNA SYSTEMS SCHEMA, men tar inte ställning till var
  presentationssträngar KOMPONERAS.

**Vad som är nytt i detta pass:** (1) branschprecedent (DDD, Fowler,
i18n-litteratur, headless-CMS, strukturerade activity-feeds) vägd mot det
redan fattade beslutet, (2) en LIVE-verifiering att Airtable-interfacet
faktiskt konsumerar exakt det aktuella fältet (ej bara den frusna
mars-2026-ögonblicksbilden), (3) en prövning av premissen "vi har mätt
`#ERROR`-fält" (falsifierad för de kontrollerade fälten, se nedan), (4) en
läsning av den FAKTISKA, live formeltexten för `Senaste anmälan
(sammanfattning)` (`fldEos4UvVBpk2reB`) som visar att en presentations-mappning
(kortformen "RIM 1") redan fick trängas in i formelspråket TIDIGARE SAMMA DAG,
och (5) en jämförelse mellan vad som FAKTISKT skickas ut nu och Marcus
uttalade målform.

## Kort svar

**Dagens val (bygg i basen) var rätt för STRUKTUR-delen (lookups, gren-val)
och är tveksamt för GRAMMATIK-delen (den färdiga meningen).** Branschpraxis
— DDD, Fowlers presentation/domän/data-lagring, i18n-litteraturen och
headless-CMS-mönstret — pekar samstämmigt åt att den SISTA, språkliga
komponeringen (ordval, prepositioner, ordning) hör hemma närmast
presentationslagret, av skäl som är mätbara i just denna bas: `ADR-063`s
egna mandat väger emot generell praxis, men träffar inte den specifika
skillnaden mellan "beräkna en atom" (bra i Airtable) och "komponera en
mening" (dåligt i Airtable). Den redan skickade produkten
(`Anmälde sig · RIM 1, Rönninge`) är dessutom INTE Marcus målform
(`Anmälde sig till Fjärrskådning i Varberg`) — skillnaden är exakt den typ av
grammatik (prepositionsval) som formelspråket hanterar sämst, mätbart, i
denna bas redan idag.

---

## 1. Vad säger branschpraxis?

### Separation of concerns: presentation vs domän vs data

Martin Fowler, **PresentationDomainDataLayering** (ThoughtWorks, primärkälla):
domänobjekt "should be completely self contained and work without reference
to the presentation" och ett konkret exempel — färgen en varians ska visas i
— avfärdas explicit: *"the color by which we display a value isn't part of
the domain."* Mönstret existerar specifikt för att en och samma domänberäkning
ska kunna bära FLERA presentationer samtidigt.
<https://martinfowler.com/eaaDev/uiArchs.html>, <https://martinfowler.com/eaaDev/SeparatedPresentation.html>

Domain-Driven Design (Eric Evans-traditionen, sekundärt refererad via
DevIQ/Medium-syntes eftersom förstapartsboken inte är webb-citerbar):
applikationslagret "should not contain Business Rules or Knowledge", och en
domänmodell som blandas med visningsformat tenderar mot **anemisk modell**
(data utan beteende, all logik utflyttad) — vilket är precis den riktning
Airtables formelfält-mönster drar mot: fälten BÄR ingen egen logik förutom
formeln själv, och formeln själv blir alltmer en presentationsmotor.
<https://deviq.com/domain-driven-design/anemic-model/>

### i18n-litteraturen: sammansatt sträng vs mall med platshållare

Unicode ICU MessageFormat — branschstandarden bakom `react-intl`, `vue-i18n`,
Symfonys Translator, Androids quantity strings och iOS `stringsdict` — är
byggd på exakt detta problem: *"Writing 'You have ' + count + ' messages'
guarantees grammatically wrong output for most of the world's top
languages."* Regeln är att hela meningen ska vara EN översättningsbar enhet,
inte konkatenerade fragment — annars kan verken ordföljd eller preposition
rättas per språk.
<https://unicode-org.github.io/icu/userguide/format_parse/messages/>

**Ärlig avgränsning:** detta projekt har i dag **noll** i18n-krav. Sökning i
repot gav noll träffar på i18n-bibliotek i `package.json`, och de två enda
träffarna på "i18n" i `src/` (`InstallPrompt.tsx:17`, `MessageBox.tsx:35`)
gäller tillgängliga namn, inte innehållssträngar. Argumentet är alltså
**framåtriktat, inte ett aktuellt smärtpunkt** — men principen bakom det
(en mening är en grammatisk enhet, inte en concat-kedja) håller oavsett
språkantal, av samma skäl som Airtables egen formel för `RIM 1 events
(pretty)` (`Personer`, `fldzd4YElq4zUdePZ`) redan bygger krystade
parentes-listor med `SUBSTITUTE`-hack för att simulera det en riktig
mall-motor gör i en rad.

### Headless CMS: strukturerat innehåll, inte förrenderade strängar

Contentfuls egen positionering: strukturerat innehåll bryts ner i
byggblock och levereras via API till valfri yta; content modeling *"ensures
data is clean, reusable, and ready for any frontend application or
channel"* — den uttalade poängen är att SAMMA data ska kunna presenteras
OLIKA på olika ytor, vilket kräver att data lagras som atomer, inte som en
redan komponerad sträng. <https://www.contentful.com/headless-cms/>

### Strukturerad activity-feed: verb + objekt, klienten komponerar meningen

GitHubs Events API är branschens mest konkreta precedent för EXAKT denna
produktklass (en "senaste händelse"-rad i en personlista/aktivitetsflöde):
varje event har ett `type`, en `actor` och en typ-specifik `payload` — texten
("X öppnade en pull request i Y") komponeras av KONSUMENTEN, inte av API:t.
<https://docs.github.com/en/rest/using-the-rest-api/github-event-types>

### No-code/low-code formelfält: communityns egen erfarenhet

**Airtable, förstaparts-support:** `#ERROR!` är en uttrycklig catch-all för
"a number of potential problems", och Airtable **visar inte källan**:
*"We currently don't display any more information about the source of the
error, so you'll need to troubleshoot to find the source."*
<https://support.airtable.com/v1/docs/common-formula-errors-and-how-to-fix-them>
Community-artikeln "What Nobody Tells You About Airtable Formulas"
konkretiserar: nästlade funktioner med typinkompatibla mellanled (t.ex. en
`IF` som returnerar antingen en sträng eller ett datum, matat in i
`DATETIME_FORMAT`) är en primär felkälla — precis den typ av
mellanled-krock som `Senaste anmälan (sammanfattning)`s fyrfaldiga
`IF(ARRAYJOIN(...), ARRAYJOIN(...), fält&"")`-fallback-mönster (se §5) är
byggd av. <https://medium.com/@builderben/what-nobody-tells-you-about-airtable-formulas-4664ddd133e2>

**Notion, förstaparts-support** har en egen sida dedikerad åt att fixa
vanliga formelfel — samma mönster som Airtables, en annan leverantör.
<https://www.notion.com/help/common-formula-errors>

**Precedent-rymden här är TUNN, deklarerat öppet.** Jag hittar bara **två**
no-code-plattformar (Airtable, Notion) med förstaparts-dokumentation som
uttryckligen erkänner att formelfält producerar odiagnostiserbara fel.
Retool gav ingen jämförbar träff (det är en app-byggare, inte ett
formelfält-i-kalkylark-verktyg, så jämförelsen haltar). Det räcker INTE för
den "3+ branschledar-precedent"-baren repots ADR-disciplin normalt kräver —
jag stannar vid två och säger det rakt ut i stället för att fylla ut listan
med svagare källor.

---

## 2. Krafter FÖR basen — mätta, inte antagna

**Live-verifierat 2026-08-10 mot prod (`app8uGPrVCVOm6LfD`):** Airtables
egen Interface 2, sidan **"Personöversikt"** (`pagGjTvd2Uq6wz6b5`), listar
`Senaste interaktion (text)` (`fldRnujWHT3ADToC1`) som en av sina synliga
kolumner — hämtat live via `list_pages_for_base`, inte ur den frusna
mars-2026-ögonblicksbilden i `schema_reference.md:818` (som säger samma
sak men är fem månader gammal och därför INTE i sig ett tillräckligt
bevis). **Detta är den avgörande enskilda faktorn:** Airtable-interfacet är
en RIKTIG, LEVANDE andra konsument av exakt det fält appen läser. Roger och
Lotta kan öppna Airtable direkt och se samma fält. Skulle
meningskompositionen flytta helt till appen skulle den konsumenten antingen
tappa den läsbara meningen (se rå-atomer i stället) eller kräva en EGEN,
parallell formel — vilket inte är en besparing, det är en duplicering till.

Övriga krafter:

- **`ADR-063` Beslut 2** är explicit: *"Resolution sker I BASEN. ...
  inte lappa provisoriskt, inte 'designa bort' i en efterträdare."*
  (`ADR-063:98`). Det är ett medvetet, redan fattat projektval som väger
  TYNGRE än generisk branschpraxis för DENNA specifika beslutsklass — men
  se §Dom för var gränsen mellan "defekt" och "grammatik" bör dras.
- **Gren-valet (vilken interaktion är "senast") bor redan i basen** och
  fungerar: en tie-break-regel (`data-model.md:542-565`) väljer mellan tre
  kandidater. Att flytta ENBART strängkompositionen ut, medan gren-valet
  stannar kvar, är arkitektoniskt sammanhängande — det är samma mönster som
  en databas-vy som väljer RADEN, medan applikationen formaterar CELLEN.
- **TASK-184 var billigt att göra i basen** — åtta beräknade fält, noll
  backfill, noll app-kodändring (`data-model.md:490-493`). Kostnaden av
  dagens val är redan betald.

---

## 3. Krafter EMOT — mätta, inte antagna

- **`airtable-constraints.md` P25, ordagrant:** *"Bas-strukturen lever bara
  i Airtable-UI:t. Det finns inget versionerat schema-as-code, ingen diff,
  ingen automatiserad schema-deploy... Schema-ändringar kan inte spåras i
  git eller granskas i PR."* (rad 405-410). Det gäller ALLA formler,
  inklusive de som bygger meningar. `TASK-184`s formeländringar gick
  igenom utan code review, utan CI, utan diff — i motsats till VARJE annan
  ändring i detta repo, som `ADR-036`/DoD-disciplinen gate:ar.
- **Två baser, hand-synkade.** `TASK-184` krävde identiska ändringar i BÅDA
  baserna, med OLIKA fält-ID:n per bas (`data-model.md:504-523`,
  konkret: `Senaste anmälan (sammanfattning)` är `fldEos4UvVBpk2reB` i prod,
  `fldwgo1fJirUwUiOC` i staging). Åtta fält × två baser = 16
  hand-verifierade skapelser för EN presentationsändring.
- **Formeln är genuint komplex, mätt live.** `Senaste anmälan
  (sammanfattning)` (`fldEos4UvVBpk2reB`, hämtad via `describe_table`
  2026-08-10) refererar 6 fält, nästlar `IF`/`SWITCH`/`ARRAYJOIN` fyra
  nivåer djupt, och upprepar samma
  `IF(ARRAYJOIN(X,""), ARRAYJOIN(X,""), Y&"")`-fallback-uttryck **fyra
  gånger** inom en och samma formel — därför att Airtables äldre
  formelsyntax saknar lokala variabler och tvingar fram kopiering i stället
  för en enda `const`. `Senaste interaktion (text)` (`fldRnujWHT3ADToC1`)
  refererar **åtta** fält i en trevägs nästlad jämförelse. Ingen av dessa
  formler har en enda automatiserad test.
- **Testbarhetsgapet är mätt, inte teoretiskt.**
  `tests/support/fixturvarld/fixture-data.ts:367-370` dokumenterar
  `senasteInteraktion`s format **innan** `TASK-184` — fixturvärdena
  (`"2026-09-13 09:41 – Inskickad anmälan"`) är redan omoderna jämfört med
  vad basen FAKTISKT skickar sedan i dag (`"Anmälde sig · RIM 1,
  Rönninge"`). `tests/acceptance/persons-list.acceptance.test.ts:68-69`
  sätter fältet till `null` i sin enda beröring. **Ingen automatiserad
  test i repot verifierar branschvals-/tie-break-logiken eller den
  komponerade meningens innehåll** — den enda bevakningen är manuell
  granskning i Airtable-UI:t. En framtida formelregression (fel
  tie-break, trasig `SWITCH`) skulle inte fällas av CI.
- **Presentations-mappning trängs redan in i formeln, mätt.** Fältets EGEN
  beskrivning (live, `describe_table`) säger: *"RIM-kortformerna är en
  VISNINGSmappning — basens kursnamn rörs aldrig (fem formler i
  Deltaganden jämför mot de exakta strängarna)."* — en `SWITCH` med sex
  grenar lades till TIDIGARE SAMMA DAG bara för att mappa
  `"Resor i medvetandet 1"` → `"RIM 1"` UTAN att röra källsträngen fem
  andra formler beror på. Det är exakt den typ av uppslagstabell en
  `Record<string,string>` i TypeScript löser i tre rader, med
  testtäckning, utan risk att röra domändata.
- **Premisstest: `#ERROR`-fält i produktion — INTE bekräftat.** Jag sökte
  live (`filterByFormula: FIND("#ERROR", ...)`, prod `app8uGPrVCVOm6LfD`,
  2026-08-10) i samtliga fem meningsbyggande fält
  (`Personer.Senaste interaktion (text)`, `Anmälningar.Senaste anmälan
  (sammanfattning)`, `Anmälningar.Motivering (sammanfattning)`,
  `Deltaganden.Deltog sammanfattning`, `Touchpoints.TP sammanfattning`) —
  **noll träffar i samtliga.** Uppdragets premiss ("vi har mätt
  `#ERROR`-fält i produktion av just den typen") kunde alltså INTE
  verifieras och bör tills vidare behandlas som **obelagd, möjligen
  föråldrad eller syftande på ett annat fält** jag inte kontrollerat. Vad
  som DÄREMOT är dokumenterat i repot, som en annan men besläktad
  formel-svaghetsklass (tyst FEL utdata, inte `#ERROR`): fælla 39
  (`Utskickslogg.Antal skickade` — `COUNTA` på ett länkfält ger alltid 1,
  `data-model.md:168`) och `Totalt antal hämtningar (erbjudande)` som
  returnerar `1` för en person med 6 touchpoints
  (`touchpoint-kurs-och-ort-2026-08-10.md` rad 292-297). Formelspråket är
  alltså mätbart svagt på ANNAT sätt än det uppdraget påstod — tyst
  felräkning, inte synligt `#ERROR`.

---

## 4. Finns en tredje väg — och är "parsa strängen" strikt sämre?

### Fjärde alternativet (parsa den färdiga strängen): FALSIFIERAT som ens värt att pröva vidare — bekräftat sämre

Misstanken bekräftas, av tre oberoende skäl, varav ett redan är kodifierat
i appen:

1. **Appen har redan medvetet valt bort det.** `PersonDetailPrototyp.tsx`
   hämtar `person.senasteInteraktionDatum` som ett EGET, separat fält
   (`fldXZyVlSKg5mX8rP`/motsvarande) i stället för att parsa ut ett datum ur
   `senasteInteraktion`-strängen — trots att strängen tidigare BAR datumet
   inbakat (kommentaren i `PersonsListPrototyp.tsx:525-526` säger uttryckligen
   att datumet togs BORT ur strängen 2026-08-10 just för att slippa den
   dubbleringen). Koden demonstrerar alltså redan, i praktiken, att
   "hämta atomen separat" slår "parsa den ur meningen" — det är inte en
   hypotes, det är vad som redan gjordes.
2. **Strängens exakta form är en formel-implementationsdetalj utan
   kontrakt.** `PersonsListPrototyp.tsx:522-524`s egen kommentar firar att
   "formeländringar slår igenom utan kodändring" — vilket är sant EXAKT
   därför att appen inte parsar. En parser skulle vara skört kopplad till
   Airtable-formelns exakta separatorval (mellanpunkt och komma) utan
   varning vid ändring — och formeln HAR ändrats minst två gånger på en dag
   (datumet togs bort; RIM-kortformen lades till).
3. **Parsning duplicerar arbete åt fel håll.** Att extrahera "kurs" och
   "ort" ur en redan-komponerad svensk mening kräver att återuppfinna
   samma segmentering basen redan gjorde en gång — med regex i stället för
   fältreferenser, och utan Airtables egna fältgarantier (typ, null-hantering).

**Slutsats: falsifieringen håller. Parsning är strikt sämre än de tre andra
vägarna** (allt-i-basen / allt-i-appen / atomer-i-basen-mening-i-appen) —
ingen motsägande signal hittad.

### Tredje vägen (bas exponerar atomer, appen komponerar meningen): håller, och är redan HALVVÄGS byggd

Grenvalet (vilken interaktion är senast — tie-break-regeln,
`data-model.md:542-565`) är genuint tabell-övergripande aggregering.
Airtable gör den delen bra och den är redan skriven och fungerar. Det som
INTE är tabell-övergripande aggregering är den sista svenska
meningsbyggnaden ("Anmälde sig" + preposition + kurs + preposition + ort) —
det är ren textformatering, och just den delen är vad DDD/Fowler/i18n-
litteraturen ovan enhälligt placerar närmast presentationslagret.

En rimlig tredje väg: basen fortsätter avgöra VILKEN gren som vann (det
gör den redan) och exponerar dess ATOMER (verb/typ, kurs, ort, datum) i
stället för en färdig mening; appen — en liten, testbar
`composeInteraktionsMening()`-funktion — bygger Marcus faktiska målform med
korrekt svensk grammatik (`till <kurs>`, `i <ort>`).

**Viktig nyans som talar för att INTE ta bort bas-meningen helt:**
Airtable-interfacet (§2) är en riktig konsument som bara kan visa
TABELLKOLUMNER, inte app-komponerade strängar. Om basen bara exponerade
atomer skulle Interface-vyn för Roger/Lotta försämras (från en läsbar
mening till separata kolumner) — SÅVIDA man inte accepterar att en
kolumn-per-atom-vy (verb, kurs, ort som separata, sorterbara/filtrerbara
kolumner) faktiskt är BÄTTRE Airtable-UX än en opak sammanslagen sträng,
vilket är plausibelt men obelagt (ingen källa i detta pass testar
just den frågan för Airtable Interfaces specifikt).

---

## 5. Vad kostar den tredje vägen konkret i detta repo?

Räknat mot faktisk struktur i `data-model.md` och live-schema, inte
abstrakt. Detta är en **grov, öppet markerad uppskattning** — inte en
färdig fältspec.

**Redan på plats (kan återanvändas, byggda av `TASK-184`):**

- `Anmälningar.Ort (from Event)` (`fld5560T3pQZSUBaJ`) — atom, klar.
- `Anmälningar.Kurs (from Event)` (`fldfqU6MfBQdaeLUk`) — atom, klar (fast
  bär fortfarande den långa formen "Resor i medvetandet 1" — kortformens
  `SWITCH` sitter i sammanfattnings-formeln, inte på en egen atom).
- Gren-val/tie-break-logiken i `Senaste interaktion (text)`/`(datum)` —
  klar, återanvänds oförändrad.

**Skulle behöva läggas till, för att nå verb+kurs+ort ända fram till
`get-persons`:**

1. **En "vinnande gren"-diskriminator på `Personer`** (t.ex.
   `"anmalan"|"touchpoint"|"deltagande"`) — samma jämförelselogik som redan
   finns i `Senaste interaktion (text)`, omskriven att returnera en
   kortkod i stället för en sträng. **1 nytt fält × 2 baser.**
2. **Kurs- och ort-ATOMER för deltagande-grenen** — `Deltaganden.Kursnamn`
   (`Event (source)`, singleSelect) finns redan
   (`data-model.md:319`), men "ort" för Deltaganden är INTE verifierad i
   detta pass (fanns inte i de rader jag läste — kräver ett riktat
   `describe_table` på `Deltaganden` för att avgöra om den redan finns
   eller måste läggas till via samma Event-länk-mönster som `TASK-184`
   använde för Anmälningar). **Uppskattat 0–2 nya fält × 2 baser,
   OVERIFIERAT.**
3. **Rollups av de vinnande atomerna upp till `Personer`** — samma mönster
   som `TASK-184`s steg 1–3 i `touchpoint-kurs-och-ort-2026-08-10.md`, en
   rollup per atom (verb, kurs, ort) i stället för en rollup av en redan
   sammansatt sträng. **Ungefär 3 nya fält × 2 baser.**
4. **Touchpoint-grenen saknar kurs/ort helt** (bekräftat av
   `touchpoint-kurs-och-ort-2026-08-10.md` väg 2 — `Erbjudande` är det enda
   ifyllda fältet och bär aldrig kurs/ort för `Inskickad anmälan`-typer).
   Verbet ("Angav e-post för...") är det enda atom touchpoint-grenen kan
   bidra med utan ny modellering.
5. **`get-persons/index.ts` och `Person.schema.ts`** utökas med de nya
   fälten (samma mönster som `senasteInteraktion`/`senasteInteraktionDatum`
   redan följer, `supabase/functions/get-persons/index.ts:41-42`) —
   kodändring, ingen ny bas-struktur.
6. **En liten, testbar komponeringsfunktion i appen** — en `switch` på
   diskriminatorn, tre grenar, svensk preposition per grentyp. Detta ÄR den
   nya presentationslogiken, och den enda delen av hela kedjan som får en
   unit-test.

**Sammanfattad grov uppskattning: 4–6 nya fält × 2 baser (8–12
fält-skapelser)** — samma STORLEKSORDNING som `TASK-184` redan gjorde (8
fält × 2 baser = 16 skapelser), inte en dramatiskt större insats. Den
STÖRSTA overifierade posten är Deltagande-grenens ort-atom (punkt 2) — det
är den enda luckan som kräver ny live-verifiering innan en exakt siffra kan
ges.

---

## Dom

**Behåll gren-valet och atom-lookuperna i basen — det är rätt lager för
tabell-övergripande aggregering och `ADR-063` täcker det uttryckligen.**
**Flytta den SISTA, grammatiska meningskompositionen (prepositionsval,
ordföljd) till appen** — inte för att `TASK-184` var fel, utan för att
`TASK-184` löste STRUKTUR-delen korrekt och sedan, av nödvändighet,
fortsatte in i GRAMMATIK-delen (RIM-kortforms-`SWITCH`:en) med samma
verktyg, vilket är precis där formelspråket är mätbart svagast (§3, §1) och
där appen är mätbart starkare (testbarhet, versionering via git, en enda
`ADR-036`-gated DoD som redan gäller allt annat i repot).

Detta är INTE en rivning av `ADR-063`. `ADR-063` Beslut 2 säger "resolution
sker I BASEN" om **defekter** appen avtäcker — och atomerna (kurs, ort,
gren-val) ÄR en avtäckt defekt korrekt löst i basen. Den grammatiska
meningen är däremot inte en bas-defekt i samma mening: det är
UI-formatering av redan korrekt data, den kategori `ADR-063` aldrig
adresserade och som Fowler/DDD/i18n-litteraturen namnger som presentation,
inte domän. Skillnaden är skarp nog att den bör läggas till som en
explicit undantags-not i `ADR-063` snarare än att uppfattas som att
`TASK-184` gjorde fel.

## Vad jag inte kunde belägga

- **`#ERROR`-fält i produktion "av just den typen".** Sökt live i fem
  meningsbyggande formelfält, noll träffar. Kan vara föråldrat, kan syfta
  på ett fält jag inte kontrollerat, eller kan ha varit en generalisering
  från den BESLÄKTADE men annorlunda felklassen (tyst felräkning, fælla 39)
  jag DÄREMOT kunde belägga.
- **Deltagande-grenens ort-atom.** Om `Deltaganden` redan har ett
  ort-fält (direkt eller via lookup) är overifierat i detta pass — kräver
  ett riktat `describe_table`-anrop jag inte gjorde för att hålla passet
  avgränsat.
- **Om en kolumn-per-atom-vy faktiskt är bättre UX i Airtable Interface än
  en sammanslagen mening.** Plausibelt resonemang, ingen källa testar det
  direkt för just Interface-komponenten.
- **Om Retool eller andra "riktiga" low-code-appbyggare (till skillnad från
  formelfält-i-kalkylark-verktyg som Airtable/Notion) har en jämförbar
  förstaparts-varning om formel-/uttrycksfragilitet.** Sökningen gav ingen
  träff värd att räkna — precedent-rymden för just "no-code formelfält
  bygger visningstext" stannar vid två leverantörer (§1), öppet deklarerat.
- **Om staging-basens motsvarande formler är identiska med prods.**
  `touchpoint-kurs-och-ort-2026-08-10.md` noterade att claude.ai-connectorn
  saknar åtkomst till staging (`apphjj8Q7lkXCMsL4`,
  `INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND`) — detta pass läste bara prod
  live. `data-model.md` anger att fält-STRUKTUREN speglar (fält-ID:n per
  bas dokumenterade), men FORMELINNEHÅLLET i staging är inte
  live-kontrollerat i detta pass.

## Rekommendation

**Rangordnad, tydligt märkt som rekommendation — inte beslut.**

1. **Gör ingen ytterligare grammatik-komposition i Airtable-formler.**
   Nästa steg mot Marcus målform ("Anmälde sig till Fjärrskådning i
   Varberg") bör INTE vara en ännu djupare nästlad `IF`/`SWITCH` i
   `Senaste anmälan (sammanfattning)` eller `Senaste interaktion (text)`.
   Formeln är redan vid gränsen för vad som är läsbart och auditerbart för
   en människa (6–8 fältreferenser, 4 nästlingsnivåer).
2. **Exponera atomerna (verb-diskriminator, kurs, ort, datum) i stället
   för att bygga meningen längre i basen**, enligt kostnadsuppskattningen
   i §5. Behåll gren-valet där det redan fungerar.
3. **Bygg en liten, testad `composeInteraktionsMening()`-funktion i
   appen** som tar atomerna och bygger Marcus målform med rätt svensk
   preposition per grentyp. Detta blir den FÖRSTA automatiserade
   testtäckningen av logik som idag är helt obevakad (§3).
4. **Behåll `Senaste interaktion (text)` i basen OFÖRÄNDRAD, som fallback
   och för Interface-konsumenten**, tills en medveten avvägning görs om
   Interface-sidan hellre ska visa atom-kolumner. Riv den INTE i samma
   steg som appen får sin egen komposition — det är två separata beslut.
5. **Lägg till en kort not i `ADR-063`** som gör distinktionen explicit:
   "resolution sker i basen" gäller avtäckta DATA-defekter (saknade
   relationer, felaktiga aggregat), inte den sista språkliga
   presentationen av korrekt data. Utan den noten riskerar nästa
   liknande fall (nästa "bygg en mening"-önskan) att tolka `ADR-063` som
   ett blankt mandat även för grammatik, vilket detta pass argumenterar
   att det inte var avsett att vara.

**Vad rekommendationen kostar, ärligt:**

- Uppskattningsvis 4–6 nya fält × 2 baser (§5) — samma STORLEKSORDNING som
  redan spenderades på `TASK-184`, inte en ny stor investering, men inte
  gratis heller.
- Ny app-kod (schema-utökning i `get-persons`, en komposit-funktion, dess
  tester) — en liten men verklig kodleverans, i motsats till dagens
  "noll kodändring"-läge som `PersonsListPrototyp.tsx:523` firar.
- Två parallella meningskällor under en övergångsperiod (basens
  `Senaste interaktion (text)` för Interface, appens komposition för
  personlistan) tills ett medvetet beslut tas om Interface-sidan — en
  tillfällig, namngiven skuld, inte en dold en.
- Risken att detta uppfattas som en delvis rivning av ett fräscht,
  samma-dag-landat arbete (`TASK-184`) om det inte tydligt ramas som en
  **komplettering av strukturen**, inte en underkännande av den.

## Källförteckning

### Förstapartskällor

- Martin Fowler, "Application Architectures" /
  PresentationDomainDataLayering: <https://martinfowler.com/eaaDev/uiArchs.html>
- Martin Fowler, "Separated Presentation":
  <https://martinfowler.com/eaaDev/SeparatedPresentation.html>
- Unicode ICU, "Formatting Messages" (MessageFormat):
  <https://unicode-org.github.io/icu/userguide/format_parse/messages/>
- Contentful, "Headless CMS explained":
  <https://www.contentful.com/headless-cms/>
- GitHub Docs, "GitHub event types" (Events API):
  <https://docs.github.com/en/rest/using-the-rest-api/github-event-types>
- Airtable Support, "Troubleshooting Common Airtable Formula Errors":
  <https://support.airtable.com/v1/docs/common-formula-errors-and-how-to-fix-them>
- Notion Help, "Fix common formula errors in Notion":
  <https://www.notion.com/help/common-formula-errors>

### Sekundärkällor

- DevIQ, "Anemic Model": <https://deviq.com/domain-driven-design/anemic-model/>
- Brennan Young, "What Nobody Tells You About Airtable Formulas" (Medium):
  <https://medium.com/@builderben/what-nobody-tells-you-about-airtable-formulas-4664ddd133e2>

### Repo-fakta (mätt live 2026-08-10 om inget annat anges)

- `ADR-063-airtable-bas-som-forstklassig-leverabel.md` (särskilt Beslut 2,
  rad 98, och S91-noten om testbarhetskostnad)
- `docs/reference/airtable-constraints.md` P25 (rad 405-410, schema-as-code),
  P24 (rad 389-402)
- `docs/reference/data-model.md:488-584` (`TASK-184`s facit i båda baserna)
- `docs/reference/schema_reference.md:793-819` (frusen mars-2026-ögonblicksbild
  av Interface 2 — kompletterad, inte ersatt, av live-verifieringen ovan)
- `docs/research/touchpoint-kurs-och-ort-2026-08-10.md` (styrande utredning
  för `TASK-184`)
- `src/components/persons/PersonsListPrototyp.tsx:490-548` (verbatim-render,
  höjdlås, kommentar om formeländringars genomslag)
- `src/components/persons/PersonDetailPrototyp.tsx:820-834` (separat hämtning
  av `senasteInteraktionDatum`, inte parsning ur strängen)
- `supabase/functions/get-persons/index.ts:41-42` (rå passthrough)
- `tests/support/fixturvarld/fixture-data.ts:367-374` (fixturens format,
  omodernt relativt dagens live-data)
- `tests/acceptance/persons-list.acceptance.test.ts:68-69` (enda testberöringen)
- Live Airtable-schema, `app8uGPrVCVOm6LfD`: `describe_table` på
  `Personer` (`tbl6ZyCm3V026iFTU`) och `Anmälningar` (`tbloOcrppVoyrHbrq`);
  `list_records` med `filterByFormula: FIND("#ERROR", ...)` mot fem fält;
  `list_pages_for_base` (Interface-konsumtion, `claude_ai_Airtable`-konnektorn)
