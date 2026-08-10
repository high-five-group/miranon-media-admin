# ADR-108: Presentationsmeningen stannar i basen — en medveten avvikelse

- Status: Accepted (uppdragsspecificerat 2026-08-10 av Marcus via ett
  bygg-agent-uppdrag — mission-briefen återger avvägningen nedan i sin
  helhet, ingen separat grillningssession bakom just detta beslut; GO
  gavs direkt i uppdraget). Källor: mission-briefen 2026-08-10 +
  [`presentationsmening-bas-eller-app-2026-08-10.md`](../research/presentationsmening-bas-eller-app-2026-08-10.md)
  (research-passet vars rekommendation detta beslut medvetet avviker
  från).
- Datum: 2026-08-10
- Fas: Fas 6 (Personer-vyerna, S103)
- Relation: Skärper `ADR-063` Beslut 2 ("Resolution sker I BASEN") med en
  explicit gräns mellan DATA-defekter och GRAMMATIK/UI-formatering — se
  additiv not i `ADR-063` (rubrik "S103-not").

## Kontext

Samma dag (2026-08-10) ändrades två Airtable-formler i BÅDA baserna
(staging `apphjj8Q7lkXCMsL4`, prod `app8uGPrVCVOm6LfD`), på Marcus order:
`Anmälningar.Senaste anmälan (sammanfattning)` och
`Deltaganden.Deltog sammanfattning` gick från en prick-separerad form
("Anmälde sig · RIM 1, Rönninge") till en grammatisk mening ("Anmälde sig
till RIM 1 i Rönninge"). Live-verifierad formeltext (staging,
`describe_table` 2026-08-10):

```text
"Anmälde sig" &
IF(kurs, " till " & SWITCH(kurs, "Resor i medvetandet 1", "RIM 1", …, kurs), "") &
IF(ort,  " i " & ort, "")
```

och för deltagandegrenen, samma mönster plus en explicit fallback:

```text
"Deltog" &
IF(kurs,
  " på " & SWITCH(kurs, …, kurs) & IF(ort, " i " & ort, ""),
  " · " & {Event sammanfattning}   ← prick-formen BEVARAD, med avsikt
)
```

Appen renderar strängen VERBATIM (`src/components/persons/
PersonsListPrototyp.tsx`, kommentaren "Texten kommer FÄRDIGFORMAD ur
basen") — den bygger ingen sträng och parsar ingen. Det gjorde
formeländringen möjlig utan en enda kodrad, precis som `ADR-063` Beslut 2
avsåg för DATA-defekter. Men research-passet (se ovan) visade att detta
INTE bara är en data-fråga: `ADR-063` Beslut 2 tar aldrig uttryckligen
ställning till SPRÅKLIG komposition (ordval, preposition, ordföljd) som
en egen underkategori.

**Branschpraxis pekar bort från basen för just den delen.** Fowlers
`PresentationDomainDataLayering`, DDD:s applikationslager-princip, Unicode
ICU MessageFormat (en mening är EN översättningsbar enhet, aldrig en
konkat-kedja) och GitHubs Events API (klienten komponerar meningen, inte
API:t) pekar samstämmigt mot att den SISTA, grammatiska sammansättningen
hör hemma närmast presentationslagret — inte i en formel. Två
no-code-leverantörer (Airtable, Notion) dokumenterar själva att
formelfält producerar odiagnostiserbara `#ERROR!`-fel utan källangivelse;
precedent-rymden är TUNT belagd (två leverantörer, öppet deklarerat i
research-passet) men pekar åt samma håll.

**Ändå väljer detta beslut att INTE flytta grammatiken till appen just
nu.** Skälet är mätbart, inte en gissning: Airtables egen Interface-sida
"Personöversikt" (`pagGjTvd2Uq6wz6b5`, live-verifierad via
`list_pages_for_base` 2026-08-10) listar `Senaste interaktion (text)`
som en av sina synliga kolumner. Det är en RIKTIG, LEVANDE andra
konsument av exakt det fält appen läser — Roger och Lotta kan öppna
Airtable direkt och se samma mening. Flyttar vi kompositionen till appen
måste basen ändå BEHÅLLA sin egen mening åt den konsumenten (annars ser
Interface-sidan rå-atomer i stället för en läsbar mening) — vilket inte
är en besparing, det är en DUPLICERING till: två ställen som ska säga
samma sak, en flyktig, tillfällig skuld byggd på en icke-flyktig grund
(en Airtable-formel som lever utanför git, `airtable-constraints.md`
P25).

## Beslut

1. **Den generella gränsen sätts uttryckligen.** DATA-defekter och
   tabell-övergripande aggregering (vilka fakta som finns, vilken
   interaktion som är senast, tie-break-regeln) löses I BASEN — detta
   TÄCKS REDAN av `ADR-063` Beslut 2 och rivs inte här. Ren UI-formatering
   av redan korrekt data (ordval, preposition, ordföljd på en redan
   avgjord fakta-mängd) hör i PRINCIP i appen — branschpraxis (§Kontext)
   är samstämmig på den punkten.
2. **Just DENNA mening är ett medvetet undantag från principen i (1), inte
   en rivning av den.** `Senaste interaktion (text)` /
   `Senaste anmälan (sammanfattning)` / `Deltog sammanfattning` behålls
   OFÖRÄNDRADE i basens formelspråk. Skälet är Interface-konsumenten
   (§Kontext) — inte att grammatik-komposition i formler generellt är en
   bra idé. Gren-valet och atom-lookuperna (`Ort (from Event)`,
   `Kurs (from Event)`, tie-break-nycklarna) stannar i basen enligt (1)
   utan undantag; det är bara den SISTA meningsbyggnaden undantaget gäller.
3. **Den tredje vägen (bas exponerar atomer, appen komponerar meningen,
   Interface-sidan behåller sin EGEN formel-mening parallellt) är INTE
   vald nu**, men namnges här som svaret DEN DAG triggern i (5) slår in.
   Kostnaden är uppskattad i research-passet: 4–6 nya fält × 2 baser
   (samma STORLEKSORDNING som `TASK-184` redan spenderade), plus en
   liten testad `composeInteraktionsMening()`-funktion i appen — den
   FÖRSTA automatiserade testtäckningen av logik som idag är helt
   formelburen.
4. **Motargumentet erkänns öppet, det utelämnas inte.** Formeln har
   REDAN tvingats bära presentationslogik: en `SWITCH` med sex grenar
   (`"Resor i medvetandet 1"` → `"RIM 1"` osv.) lades till SAMMA DAG bara
   för att korta kursnamnet i meningen, utan att röra källsträngen fem
   andra formler jämför mot. Det är exakt den typ av uppslagstabell en
   `Record<string,string>` i TypeScript löser i tre rader, med
   testtäckning, utan risk att röra domändata — och det är ett argument
   MOT beslutet i (2), inte för det. Beslutet väger Interface-kostnaden
   (§Kontext) tyngre än denna redan synliga spricka, men sprickan är
   verklig och ska inte glömmas bort nästa gång frågan kommer upp.
5. **Explicit trigger för att byta fot.** Ordalydelsen ändrades EN gång
   denna dag (Marcus bytte form från prick till mening). Varje sådan
   ändring är ett handgrepp i BÅDA baserna, utan diff, utan
   code-review, utan väg tillbaka (`airtable-constraints.md` P25).
   **Blir det en TREDJE eller FJÄRDE ändring av just denna menings
   ordalydelse** (oavsett tidsspann), väger atomvägen (3) upp sin egen
   kostnad — och då ska det ÄVEN prövas om en kolumn-per-atom-vy faktiskt
   är BÄTTRE Interface-UX än en sammanslagen sträng (research-passet
   flaggar det som troligt men uttryckligen OBEVISAT; ingen källa testar
   frågan direkt för Airtable Interfaces).
6. **Testluckan stängs som en direkt följd av detta beslut, i samma PR.**
   Innan denna ändring verifierade INGENTING i repot meningens innehåll —
   en formelregression hade passerat CI oupptäckt. Kontraktet är nu
   tvådelat: `tests/support/senasteInteraktionGrammatik.ts` (regex-
   matchare för formen, inte exakta strängar) + en billig `api-pure`-svit
   (`tests/api/senaste-interaktion-grammatik.test.ts`, bevisar tvåsidigt
   att matcharna fäller FÖRE-formerna och godkänner EFTER-formen) + en
   tunn `api-staging`-pin (`tests/api/senaste-interaktion-grammatik.staging.test.ts`)
   mot de två permanenta fixturerna `ZZ-Arbetsko Person 01` och
   `ZZ-History Person 01`, som är de enda källor som kan bevisa att den
   LIVE formeln — inte bara en handskriven fixtur — fortfarande
   producerar rätt form.

## Konsekvenser

**Positiva:** Interface-konsumenten (Roger/Lotta) behåller sin läsbara
mening utan dubbelarbete just nu; `ADR-063` Beslut 2:s räckvidd
förtydligas (data/aggregering, inte grammatik) utan att rivas; en
tidigare osynlig testlucka stängs i samma PR som beslutet dokumenteras,
så nästa formelregression FÄLLS av CI i stället för att upptäckas manuellt
i Airtable-UI:t; triggern i (5) gör nästa avvägning mätbar i stället för
en ny öppen diskussion.

**Negativa / skuld:** meningskompositionen förblir formelburen — genuint
svårgranskad (`airtable-constraints.md` P25: ingen diff, inget schema-as-
code), och SWITCH-uppslaget (Beslut 4) är en känd, accepterad spricka i
principen, inte en löst fråga. Två hand-synkade baser med olika fält-ID:n
per formel kvarstår som kostnad för varje FRAMTIDA ändring av just denna
mening, tills triggern i (5) slår in.

## Relaterat

- `ADR-063` (Airtable-basen som förstklassig leverabel) — Beslut 2 täcker
  DATA-defekter; detta ADR förtydligar att GRAMMATIK är en annan klass
  och dokumenterar undantaget för just denna mening.
- `docs/reference/airtable-constraints.md` P25 (schema-as-code-väggen) —
  skälet formelburen komposition är genuint svårgranskad.
- `docs/reference/data-model.md` §"Fält tillagda i augusti 2026" —
  `TASK-184`s facit i båda baserna, fält-ID:n och tie-break-regeln.
- [`presentationsmening-bas-eller-app-2026-08-10.md`](../research/presentationsmening-bas-eller-app-2026-08-10.md) —
  hela branschpraxis-genomgången och kostnadsuppskattningen för den
  tredje vägen.
