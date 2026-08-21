---
owner: marcus803
updated: 2026-08-21
review_by: 2026-11-21
status: draft
---

# Förladdat personregister med klientsök — branschmönster och likvärdighetskrav

> **Proveniens:** avgränsat research-pass (bakgrundsagent), 2026-08-21, kört
> oisolerat i huvudkatalogen. Frågan är EN, nedskriven, avgränsad: hur bygger
> branschledare sök i ett register på hundratals-till-tusental poster så att
> varje tecken svarar OMEDELBART — förladdat register, sök i klienten — och
> vad krävs för att vår personlista kan gå den vägen utan att tappa
> korrekthet mot dagens server-sök. Ingen kod, ingen ADR och inget kort i
> detta repo har rörts — enda leveransen är denna fil.

## Vad jag redan hade, innan sökningen

`docs/research/` gav en direkt syskonfil och två falska vänner:

- **`bokstavsindex-personlista-branschmonster-2026-08-21.md`** (samma dag,
  läst i sin helhet) — undersökte UI-formen för ett bokstavsindex under
  antagandet att arkitekturen förblir server-filtrerad cursor-paginering.
  Dess fokusfråga 1 landade i en insikt som DETTA pass bygger vidare på:
  iOS `sectionIndexTitles`/Android `AlphabetIndexer` **förutsätter en
  lokalt adresserbar, fullständig, färdigsorterad datamängd** — exakt den
  förutsättning vår cursor-arkitektur (`ADR-056`) avsiktligt saknade. Det
  passet löste alltså spänningen genom att välja "filter, inte hopp" inom
  server-arkitekturen. Detta pass frågar i stället om själva
  server-arkitektur-antagandet ska hållas fast vid.
- **`personlista-scanlista-branschmonster-2026-08-10.md`** — radform (tonal
  kontra zebra), inget om laddstrategi. Rör inte denna fråga.
- **`register-index-skalning-branschmonster-2026-08-07.md`** — dokument-
  register (ADR-index, changelogs) som skalar, inte data-register i en app.
  Falskt positivt på ordet "register".

**Ett stämplat PRD skrevs SAMMA DAG, FÖRE detta uppdrag, och valde motsatt
arkitektur.** `TASK-283` (`npm run bl -- task 283 --plain`, skapat
2026-08-21 08:41 UTC) låser explicit **väg A**: *"Filtret byggs som ett
tredje AND-villkor i Personer-EF:ens befintliga formel"*, med en egen skiva
**`TASK-283.1` — "Personer-EF:en lär sig bokstavsfiltret och
bokstavsfördelningen"**. Det är inte ett åldrat dokument att slå upp mot —
det är en timmar-gammal, explicit avvägning som Marcus efterföljande beslut
("Då kör vi B!", S109 Del 7, klagomålet *"listan 'Laddas om' vid varje
teckeninmatning"*) river. Uppdragets egen Beslutsläge-sektion bekräftar att
`TASK-283.1` därför är **stoppad** och `283.2–283.4` ska omprövas mot
klientdata — detta pass prövar om den omprövningen håller, inte om den ska
göras.

`docs/decisions/` gav sex direkt styrande ADR:er, alla lästa i sin helhet:
`ADR-078` (INSTANT-regeln, mätta EF-latenser 1,0–1,4 s), `ADR-112`
(Förberedelseskärmens blockerande startvärmning), `ADR-113` (laddtrappan),
`ADR-055`/`ADR-057` (adapter-kontraktet), `ADR-121` (nämns i sibling-filen
som fälla 51:s "systerbeslut" — orört av denna fråga, ingen ny läsning
krävdes). Ingen av dem tar ställning till "förladdat register kontra
server-sök" som fråga — de reglerar navigering, startvärmning och
lager-oberoende, alla FÖRENLIGA med båda vägarna. Ingen ADR reglerar detta
i förväg; `tasks/lessons.md` gav noll relevanta träffar på "förladdat",
"klientsök" eller "preload".

**Åldersbedömning:** allt ovanstående är från 2026-08-07 till 2026-08-21 —
inget är åldrat i den mening att premisserna hunnit ändras. Det enda som
konkret ändrats UNDER dagen är Marcus egen arkitekturpreferens (PRD → "Kör
vi B"), vilket är precis skälet till att detta pass finns.

**Slutsats: ingen tidigare research svarar på denna fråga. Passet körs i
full bredd**, men återanvänder sibling-filens redan belagda fällor (43, 51)
i stället för att mäta om dem.

## Kort svar

**Dom: väg B håller — 559 poster (dagens mätta registerstorlek,
`data-model.md` fälla 43) ligger en till två storleksordningar under varje
skala där branschledarna fortfarande kör "ladda allt, filtrera lokalt" utan
särskild optimering** (Linear: ett 10 000-ärenden-arbetsyta startar lika
snabbt som ett 100-ärenden; Superhuman: hela e-postarkivet cachas lokalt
för sökning; MiniSearch, det lättaste av de undersökta biblioteken,
avråds först bortom ~50 000 poster). **Den starkaste enskilda precedenten
är dessutom INTERN, inte extern:** `EventValjare.tsx` — appens eget
"sökfälts-facit" som `ADR-078` (INSTANT-regeln) föddes ur — laddar REDAN
hela eventlistan via startvärmningen (`queryKeys.events.list`,
`startvarmningen.ts:229–233`) och filtrerar REDAN lokalt med React Arias
`useFilter({ sensitivity: 'base' })` (`EventValjare.tsx:177`, `<Autocomplete
filter={contains}>` rad 393). Väg B är alltså inte en ny teknik för denna
kodbas — det är samma mönster som redan körs, bara inte för personer.

**Den avgörande delfrågan är fokusfråga 3 (laddstrategin), inte fokusfråga 1
(precedent).** `get-persons` gör REDAN idag, på VARJE besök på `/personer`
med tom sökning, en fullständig sekventiell walk av HELA den
filtrerade tabellen (`get-persons/index.ts:177`,
`fetchFromAirtable(TABLE_NAME, { filterByFormula, fields: ['Namn'] })`) —
bara för att räkna `total`. Att bredda samma walk till alla fält och
returnera posterna i stället för att bara räkna dem är en förlängning av en
redan existerande mekanism, inte en ny.

**Likvärdighetskravet har en mätt, konkret gräns: Airtables `SEARCH()` är
skiftläges-OKÄNSLIG men diakritik-KÄNSLIG** — mätt i staging 2026-08-21
(`filterByFormula SEARCH("asa", LOWER({Namn}))` → 0 träffar;
`SEARCH("åsa", LOWER({Namn}))` → 1 träff). En klientfilter måste alltså
vara ett rent `.toLowerCase().includes()` för byte-för-byte-paritet.
Appens EGEN, redan valda `useFilter({ sensitivity: 'base' })` (React
Aria, `EventValjare.tsx`) är enligt MDN:s `Intl.Collator`-spec
diakritik-OKÄNSLIG ("a = á, a = A") — att återanvända det mönstret för
personer vore alltså INTE paritet utan en medveten breddning, och måste
beslutas öppet, inte ärvas av bekvämlighet.

## Arkitektur-facit ur egen källkod (MÄTT, styr alla sex delfrågor)

- **MÄTT:** `PersonsList.tsx:104` `SEARCH_DEBOUNCE_MS = 250`; `:267`
  `queryKey: queryKeys.persons.search({ q })` i en `useInfiniteQuery`
  (`:266`) UTAN `placeholderData`/`keepPreviousData` — varje ny sökterm (efter
  debounce) byter query-nyckel och triggar `isPending`-grenens skeleton
  (`:352` i den tidigare läsningen), vilket ÄR det Marcus klagomål beskriver.
- **MÄTT:** `get-persons/index.ts:125` `BAS_FILTER =
  '{Antal anmälningar (totalt)} > 0'`; sök-formeln byggs via
  `buildSearchAcrossFieldsFilter` (`airtable-filter.ts:149`) som
  `OR(SEARCH(escapedTerm, LOWER(field)), ...)` — escapedTerm är HELA
  söksträngen `toLowerCase()`:ad och wrappad EN gång, inte tokeniserad per
  ord.
- **MÄTT (staging, `apphjj8Q7lkXCMsL4`, tabell `Personer`, 2026-08-21):**
  `SEARCH("asa", LOWER({Namn}))` → 0 poster. `SEARCH("åsa",
  LOWER({Namn}))` → 1 post (`"Åsa-ZZ-Bokstavsindex Fixture"`). Airtables
  `SEARCH()` är alltså skiftläges-okänslig (båda sidor `LOWER()`:as i
  koden) men diakritik-KÄNSLIG — samma mekanism-delning som sibling-filens
  fälla 51 mätte för `=`, nu bekräftad för `SEARCH()` också, en NY mätning
  detta pass tillför.
- **MÄTT:** staging-basen har bara 60 poster som uppfyller `BAS_FILTER`
  (inklusive `ZZ-*`-testfixturer) — staging är INTE representativ för
  registrets STORLEK. Skalfrågorna i detta pass utgår därför från prods
  redan dokumenterade **559** (fälla 43), inte från en ny mätning mot
  staging, i linje med uppdragets instruktion att mäta åtkomst/beteende i
  staging men storlek ur redan etablerad fakta.
- **MÄTT (egen extrapolering ur ett staging-sample):** en persons fullständiga
  Airtable-fältmängd (samtliga fält `mapPerson` läser) väger **616 bytes**
  JSON okomprimerat för en representativ post. `559 × 616 B ≈ 336 KiB`
  okomprimerad nyttolast för hela registret — se § Fokusfråga 3 för
  gräns-jämförelsen.
- **MÄTT:** `router.ts:14` `staleTime: 5 * 60 * 1000`; `:18` `gcTime:
  PERSIST_MAX_AGE_MS` (24 h, `ADR-072`, persisteras över appstarter);
  `:21` `refetchOnWindowFocus: true`; `:22` `refetchOnReconnect: 'always'`;
  `:25`/`:30` `networkMode: 'online'` (queries OCH mutations pausar
  offline, `ADR-047` B5).
- **MÄTT (grep, noll träffar):** ingen `src/data/mutations/*.ts` eller annan
  fil i `src/data/` invaliderar `queryKeys.persons.search` eller
  `queryKeys.persons.all` NÅGONSTANS i kodbasen — `persons.all` (`keys.ts`
  rad 62) är definierad men ANVÄNDS ALDRIG. En ny anmälan (`useCreate
  Registration.ts`, som SKAPAR en ny person i basen) invaliderar alltså
  ingenting i personlistan; listan förlitar sig helt på det globala 5-
  minuters `staleTime` + `refetchOnWindowFocus`. **Detta är en redan
  existerande korrekthets-svaghet, inte något väg B inför** — men väg B gör
  frånvaron av invalidering DYRARE att ignorera, se § Fokusfråga 3.
- **MÄTT (kodkommentar, `startvarmningen.ts:222–224`):** warmup-mängden
  exkluderar UTTRYCKLIGEN `persons.search` med motiveringen *"parametriserad
  på söktext, ingen naturlig 'kärn'-fråga"*. Detta resonemang FALLER om en
  parameterlös "hela registret"-fråga införs — den HAR en naturlig
  kärn-fråga, exakt som `events` (`:229–233`) redan har.
- **MÄTT (grep, noll träffar):** ingen virtualiseringsbibliotek
  (`react-window`, `react-virtual`, `@tanstack/react-virtual`) finns i
  `package.json` eller `src/`. Dagens lista renderar redan sina laddade
  rader ovirtualiserat i en enda `<ul>` (`PersonsList.tsx`).
- **MÄTT (`EventValjare.tsx:177`, `:393`):** appens EGNA sökfälts-facit
  filtrerar redan en fullt förladdad, warmup-varmad lista
  (`queryKeys.events.list`) lokalt med React Aria `useFilter({ sensitivity:
  'base' })` + `<Autocomplete filter={contains}>`. Detta är väg B, redan
  byggt, för en annan yta.
- **MÄTT (Supabase-dokumentation, hämtad direkt 2026-08-21):** Edge
  Functions-gränser är minne 256 MB, CPU-tid 2 s, wall-clock 150 s (Free)
  / 400 s (Paid), request idle timeout 150 s. Ingen dokumenterad
  svarsstorleks-gräns hittades (sökt riktat, se § Vad jag inte kunde
  belägga).
- **MÄTT (`airtable-constraints.md` P4/P5/P6):** delad rate-limit 5
  req/s/bas; `pageSize` ≤ 100; opak offset-token utan sid-hopp eller
  räkne-primitiv. En full walk av 559 poster kräver **6 sekventiella
  Airtable-anrop** (100/sida) — samma walk `fetchFromAirtable` redan gör
  för `total` idag, bara med `fields: ['Namn']` i stället för alla fält.
- **MÄTT (adapter-kontrakt):** `DataSourceAdapter.listPersons(params?):
  Promise<PersonsPage>` (`DataSourceAdapter.ts:63`) implementeras av BÅDE
  `AirtableAdapter.ts:118` och en stub i `SupabaseAdapter.ts:68` — varje
  omskrivning måste bevara detta kontrakt (`ADR-055`/`ADR-057`s
  lager-oberoende) snarare än att specialfalla Airtable i komponenten.

## Fokusfråga 1 — Precedent (3+ branschledare)

**Ingen källa jag hittade anger en exakt sifferbrytpunkt** ("under N poster,
förladda; över N, server-sök"). Det starkaste jag har är biblioteks-
kapacitetstal (sekundärkälla) och två branschledares egna nyanser om VAD de
faktiskt förladdar kontra lat-hydrerar.

- **Superhuman (förstapart, hämtat i fulltext,
  `blog.superhuman.com`):** *"This post describes the architecture of a
  delightful search experience that runs inside the web browser itself."*
  och *"Superhuman caches as much emails as possible on your device, which
  allows the search to be Local."* Sökningen körs mot en lokal WebSQL
  Full-Text-Search-tabell. Ett Superhuman-arkiv är typiskt tiotusentals
  till hundratusentals mejl per användare — storleksordningar större än
  våra 559 personer — och strategin är ändå lokal cache + lokalt index,
  inte per-tecken serverfråga.
- **Slack Quick Switcher (förstapart, hämtat i fulltext,
  `slack.engineering`):** *"We prefetched the data needed to search on open
  (rather than on keydown)"* — explicit prefetch-sedan-lokal-matchning.
  **Viktig nyans:** listan är MEDVETET begränsad till olästa kanaler/DM,
  *"we settled on 24"* — inte hela teamets kanal-/medlemslista. Det är ett
  ANNAT designmål (senast-relevant, inte fullständigt register) än Lottas
  "bläddra hela registret" — precedenten stödjer prefetch-mönstret men
  INTE "visa allt", och det är en öppet flaggad skillnad.
- **Linear (sekundärkälla, `performance.dev`, teknisk genomgång — Linears
  egna bloggsida `linear.app/blog/scaling-the-linear-sync-engine` gick INTE
  att hämta i fulltext, se § Vad jag inte kunde belägga):** *"The actual
  database the UI reads from is in the browser, in IndexedDB."* Filtrering
  är omedelbar eftersom *"the index is already built. There's nothing to
  fetch because there's nothing missing."* Kommandopaletten söker *"the
  local MobX object pool, not a server."* **Explicit skalnyans:** *"A
  10,000-issue workspace boots about as fast as a 100-issue one"* — MEN
  *"the two heaviest tables, Issue and Comment, lazy-hydrate on demand"* —
  Linear förladdar alltså arbetsytans STRUKTUR direkt, inte de TYNGSTA
  tabellerna. 559 personer med ~616 B/post ligger närmare "struktur"-
  klassen än Linears tyngsta tabeller.
- **Apple `CNContactStore` (förstapart, endast sökmotor-utdrag — Apples
  egen sida är JS-renderad och gick inte att hämta i fulltext, samma
  mönster sibling-passet redan flaggade):** kontaktdatabasen är i sig
  lokal (synkad från iCloud i bakgrunden), men Apples EGEN vägledning för
  STORA kontaktregister är nyanserad, inte "hämta allt eagerly": *"first
  fetch all contact identifiers, then fetch batches of detailed contacts
  by identifiers as required."* Även flaggskeppet för lokal kontaktdata
  rekommenderar alltså batchad hydrering vid VOLYM, inte att alla fält för
  alla poster hålls i minnet på en gång.
- **Google Contacts:** INTE undersökt i detta pass (tidsprioritering — de
  fyra källorna ovan gav reachable, förstaparts- eller nära-förstaparts-
  belägg; Google Contacts webbklientens exakta laddarkitektur hittades
  inte i den tid som fanns). Deklareras som ORESEARCHAD lucka, inte ett
  negativt fynd.
- **TanStack Query (dokumentation, sökmotor-syntes, inte en enskild sida
  fulltext-verifierad):** `staleTime: Infinity` (eller v5+ `'static'`) är
  det dokumenterade mönstret för "ladda en gång, filtrera i minnet";
  `ensureQueryData` motsvarar `prefetchQuery` + `staleTime: Infinity`.
  Detta är mekanismen, inte ett precedent-BELÄGG för brytpunkten.
- **React 19 `useDeferredValue` (förstapart, hämtat i fulltext,
  `react.dev`):** rekommenderas för CPU-bundna listfiltreringar vid
  tangenttryck. Kritisk brasklapp, citerad: *"useDeferredValue does not by
  itself prevent extra network requests... What's being deferred here is
  displaying results (until they're ready), not the network requests
  themselves."* **Detta är en nyckelinsikt för OSS:** `useDeferredValue`
  blir bara relevant EFTER väg B tagit bort nätverksrundturen — mot dagens
  server-sök (väg A) löser den ingenting; debounce (redan byggt, 250 ms)
  är rätt verktyg där.
- **Interna precedenten, starkast eftersom noll överförbarhetsrisk finns:**
  `EventValjare.tsx` — se § Arkitektur-facit. **Ej mätt:** exakt antal
  events i prod, så precedentens giltighet vid "hundratals rader"
  specifikt är en arkitektur-likhetsargumentation, inte en storleks-matchad
  jämförelse.
- **Skalproxy (sekundärkälla, aggregator, inte biblioteksförfattarens egen
  sida verifierad i fulltext):** MiniSearch beskrivs indexera
  "tusentals dokument på tiotals millisekunder" och avråds först "ovanför
  ~50 000 poster klientsidan". 559 ligger ~90× under den gränsen.

## Fokusfråga 2 — Likvärdighet i sök-semantik

**Skiftläge:** Airtables `SEARCH()` `LOWER()`:ar båda sidor
(`airtable-filter.ts:149–175`) → skiftläges-okänslig. Klientens
`.toLowerCase()` på båda sidor är exakt paritet.

**Diakritik — MÄTT, den centrala skillnaden:** `SEARCH("asa",
LOWER({Namn}))` matchar INTE `"Åsa..."`; `SEARCH("åsa", ...)` gör det
(staging, 2026-08-21, se § Arkitektur-facit). En byte-för-byte-likvärdig
klientimplementation är alltså ett RENT `haystack.toLowerCase().includes
(needle.toLowerCase())` UTAN `String.prototype.normalize('NFD')` och UTAN
`Intl.Collator`/`localeCompare`-baserad jämförelse — båda de senare
skulle göra sökningen MER tillåtande än dagens server (matcha "asa" mot
"Åsa"), vilket är en medveten breddning, inte paritet. Appens egen
`useFilter({ sensitivity: 'base' })`-precedent (`EventValjare.tsx:177`)
gör PRECIS den breddningen — MDN:s `Intl.Collator`-spec (hämtad i
fulltext) definierar `"base"` verbatim: *"Only strings that differ in
base letters compare as unequal. Examples: a ≠ b, a = á, a = A."* Att
återanvända `useFilter`-mönstret för personer vore alltså INTE
likvärdighet utan en explicit UX-förbättring som måste beslutas öppet.

**Flerordssökning — MÄTT ur koden, inte antaget:** `escapeFormulaValue
(term.toLowerCase())` (`airtable-filter.ts:161`) wrappar HELA
söksträngen som EN sammanhängande substräng, inte som tokeniserade ord med
AND emellan. `"anna svensson"` matchar alltså bara om `Namn` bokstavligen
innehåller den exakta delsträngen "anna svensson" (ordning och mellanslag
spelar roll) — INTE ett AND av "anna" OCH "svensson" var för sig. En
klientfilter måste replikera EXAKT detta (en enda `.includes()`-jämförelse
av hela söksträngen), inte byta till per-ord-AND (vilket både MiniSearch
och Fuse.js gör som default) — ett ytterligare paritetskrav värt att
uttryckligen bygga bort ifrån biblioteksstandard-beteendet, om ett
bibliotek ändå väljs.

**Telefonnummer:** samma `SEARCH()`-mekanism mot `{Telefon}` som rått
textfält, ingen normalisering av mellanslag/bindestreck synlig i
`buildSearchAcrossFieldsFilter`. **Ej oberoende verifierat** mot en levande
post med formaterat telefonnummer i det staging-sample jag drog (ingen av
raderna jag hämtade bar ett telefonnummer med separatorer) — se § Vad jag
inte kunde belägga.

**Ort (array/rollup-fält):** `ARRAYJOIN({Ort})` följt av `SEARCH()`
(`airtable-filter.ts` `fieldRef` för `isArray: true`-fält) — Airtable
joinar arrayen till EN sträng (kommaseparerad enligt Airtables dokumenterade
default) INNAN sökningen körs. En klientekvivalent måste göra samma sak
(`ort.join(', ').toLowerCase().includes(...)`), INTE `ort.some(o =>
o.toLowerCase().includes(...))` — de två ger olika resultat vid en
delsträng som spänner över en join-gräns (t.ex. `"öping,Ale"` som
delsträng av `["Falköping", "Ale"]`). Ett litet men verkligt paritetskrav.

**Är Fuse.js/MiniSearch motiverat? Nej — dubbelriktad över-
engineering-vakt slår mot båda.** 559–1 000 poster är trivialt under
MiniSearch egen komfortzon (tusentals dokument, sub-millisekund) och
milslångt under dess avrådda tak (~50 000). En handskriven `.filter(p =>
haystack(p).includes(needle))` över en array av den storleken kör på en
bråkdel av en millisekund — inget index behöver byggas. **Golvet
(paritet) kräver ingen bibliotek.** Ett bibliotek blir motiverat först om
Marcus EXPLICIT vill ha bortom-paritet (fuzzy/stavfelstolerant sökning) —
det är ett produktbeslut, inte ett prestandabehov.

## Fokusfråga 3 — Laddstrategi

**EF-variant som returnerar hela registret: arkitektoniskt redan hälften
byggd.** `fetchFromAirtable`s `do/while`-loop (`airtable-client.ts`)
walkar REDAN hela den filtrerade tabellen sekventiellt — används idag för
`total` med `fields: ['Namn']` (`get-persons/index.ts:177`). Att byta
`fields: ['Namn']` mot alla `mapPerson`-fält och returnera `records.map
(mapPerson)` i stället för `records.length` är en förlängning av samma
mekanism, ingen ny.

**Nätverkskostnad — INTE en ny kostnad, en OMFÖRDELNING av en befintlig.**
`get-persons` gör redan idag, på VARJE tomt-sök-besök,
`Promise.all([pagePromise, totalPromise])`
(`get-persons/index.ts:145–177`) — pagePromise (1 sida, 50 poster) OCH
totalPromise (fullständig 6-sidors walk för `total`) KÖRS SAMTIDIGT. Att
gå till "en enda fullwalk som returnerar allt" ersätter två parallella
anrop (1 sida + 1 fullwalk-räknare) med ETT fullwalk-anrop som returnerar
både data och (via `.length`) total. Nettoeffekten på Airtables delade
5 req/s-tak (P4) är **neutral eller positiv**, inte en ny belastning.

**MÄTT nyttolast:** ≈336 KiB okomprimerad JSON för 559 fulla poster
(616 B/post-sample × 559, se § Arkitektur-facit). Väl innanför Supabase
Edge Functions minne (256 MB) och CPU-tid (2 s) — **ingen dokumenterad
svarsstorleks-gräns hittades** (sökt riktat mot `supabase.com/docs/guides/
functions/limits`, se § Vad jag inte kunde belägga).

**Värmning kontra lat laddning (ADR-112):** `startvarmningen.ts:222–224`s
motivering för att UTESLUTA `persons.search` — *"parametriserad på
söktext, ingen naturlig 'kärn'-fråga"* — HÅLLER INTE LÄNGRE för en
parameterlös "hela registret"-fråga. En sådan fråga HAR en naturlig
kärnfråga, precis som `events` (samma fils rad 229–233). Om den ska GÅ IN
i warmup-mängden (blockerande, ADR-112 beslut 1) eller laddas lat vid
första besök på `/personer` är en avvägning ADR-112 redan ger
verktygen för (blockerande startkostnad kontra senare per-besök-latens) —
**en spec-fråga, inte löst av detta pass.**

**Invalidering — MÄTT LUCKA, förvärras av väg B om den inte täpps.**
Ingen fil invaliderar `persons.search`/`persons.all` idag (§
Arkitektur-facit) — en ny anmälan syns i listan bara efter 5 minuters
`staleTime` eller ett fönster-refokus. Detta är en REDAN EXISTERANDE
svaghet. Men: dagens arkitektur GÖR ändå ett nytt nätverksanrop vid varje
navigering till `/personer` med tom sökning (query-nyckeln `{q:''}`
`staleTime`:as ut efter 5 min precis som allt annat), så en ny person DYKER
UPP inom rimlig tid av sig själv via normal navigeringsomsökning. Ett
"ladda en gång, cacha för alltid" (`staleTime: Infinity`/`'static'`)
mönster för väg B skulle GÖRA DENNA LUCKA VÄRRE — hela sessionen kan visa
ett register som aldrig ser en nyskapad person. **Rekommendation:** behåll
`staleTime: 5 min` (samma globala default) för den nya queryn tills
explicit invalidering (`queryClient.invalidateQueries` i
`useCreateRegistration` och personens övriga skrivvägar) är byggd och
bevisad — annars byts "laddas om vid varje tecken" mot ett tystare och
värre fel, "visar aldrig nya personer".

**Offline (PWA, `ADR-047`):** ingen persons-lista-specifik offline-regel
hittades i `ADR-047` (grep, noll träffar) — global mekanik gäller:
`networkMode: 'online'` pausar hämtningar offline och visar cachad data;
`ADR-072`s 24-timmars persist-lager gör ett tidigare laddat register
tillgängligt offline. **Väg B förbättrar offline-fallet mätbart:** hela
registret blir sökbart offline i stället för bara de sidor Lotta råkat
scrolla förbi tidigare — ett positivt sidoeffekt-fynd, ingen risk.

## Fokusfråga 4 — Skalgräns, uttalad

**Ingen branschledare gav en exakt sifferbrytpunkt** (§ Fokusfråga 1).
Tillgängliga proxytal: MiniSearch (sekundärkälla, ~50 000-tak, "tusentals
dokument" komfortzon); Linear (sekundärkälla, `performance.dev`,
"10 000-ärenden lika snabbt som 100" men med lazy-hydrate-brasklapp för de
TYNGSTA tabellerna).

**Tillväxttakt:** uppdragets egen ram ("tiotals personer per år") mot
dagens 559 är en trivial kurva relativt varje citerat tak — även ett
decennium av tillväxt i den takten ligger en storleksordning under
MiniSearch-taket.

**MÄTT, den faktiska bindande gränsen är RENDERING, inte DATA:** ingen
virtualisering finns i appen idag (§ Arkitektur-facit). 559 personer × ~6–8
DOM-noder/rad (initial-span, länk, två-tre metaspann, pill, chevron) ≈
3 500–4 500 noder om HELA registret renderas ovirtualiserat samtidigt —
ÖVER den vanligt citerade ~1 500-nod-tumregeln (sekundärkälla, `web.dev`/
aggregator-syntes, ingen enskild primärkälla verifierad i fulltext för det
exakta talet). **Detta är den skarpaste, mätbara gränsen i hela passet:**
datamängden (559, 336 KiB) är trivial för klientsök; RENDERAD DOM-storlek
är det som knäcker FÖRST om man visar allt på en gång. Se § Fokusfråga 5
för konsekvensen.

**Egen, uttryckligen icke-branschbelagd sammanfattning:** jag kan INTE ge
en enda sifferbelagd brytpunkt där klientsök SLUTAR vara rätt för just
denna app. Jag kan säga att 559 (dagens läge) ligger 1–2 storleksordningar
under varje tak jag hittat belägg för, och att rendering — inte
datainladdning — är den komponent som knäcker före datamängden gör det,
om man naivt renderar allt.

## Fokusfråga 5 — Paginering och "Ladda fler"

**Rekommendation: behåll paginerad RENDERING oberoende av att datan är
fullt laddad.** Skälet är § Fokusfråga 4:s DOM-nodtak, inte
nätverkskostnad. Praktiskt: bokstav och/eller fritext filtrerar HELA den
laddade arrayen (ren `.filter()`, ingen nätverksfråga), men bara de första
`PAGE_SIZE` (50) TRÄFFARNA renderas initialt; "Ladda fler" blir en ren
klient-side `slice`-utökning av redan-filtrerad data, samma
knapp-komponent, samma `aria-live`-annonsering — INGEN ny UI-mekanism,
bara ett annat data-ursprung bakom samma rad.

**Branschsignal:** `EventValjare.tsx` (intern precedent) visar ALLA
filtrerade träffar i en scrollbar `Popover`/`ListBox` utan egen
"load more" — men eventlistans faktiska storlek är EJ MÄTT i detta pass
(se § Vad jag inte kunde belägga), så den precedenten stödjer "rendera
allt" bara under förutsättningen att eventlistan är kort nog för att vara
under DOM-taket, vilket inte är verifierat. Linear (sekundärkälla)
lazy-hydrerar uttryckligen sina tyngsta tabeller snarare än att rendera
allt på en gång.

**Bieffekt värd att notera:** räknarraden ("Visar N av TOTAL personer…",
`PersonsList.tsx`s `totalCount`-logik, TASK-277 AC #2) blir TRIVIAL i väg
B — `filtreradArray.length` i stället för dagens separata,
full-walk-beroende `total`-fält med sin egen skew-säkra fallback-logik. En
förenkling värd att bokföra, inte bara ett sidospår.

## Fokusfråga 6 — Bokstavsindexet i klienten (TASK-283)

**Bekräftat: PRD-283 valde väg A, timmar innan detta uppdrag.** Läst i sin
helhet via `npm run bl -- task 283 --plain` — implementationsbeslutet är
explicit *"Filtret byggs som ett tredje AND-villkor i Personer-EF:ens
befintliga formel"*, med `TASK-283.1` namngiven just för det
EF-arbetet. Uppdragets egen premiss (`283.1` stoppad, `283.2–283.4`
omprövas mot klientdata om väg B går igenom) bekräftas av min läsning —
inget i PRD-texten motsäger det.

**Om väg B antas, blir hela bokstavsindexet en `.reduce()`, ingen EF-
ändring krävs alls.** Fördelning per bokstav OCH filtrering blir båda
rena klient-operationer över den redan laddade arrayen. Detta löser dessutom
DIREKT den spänning sibling-passets fokusfråga 1 lämnade öppen (native
scroll-index-mönstret "förutsätter en lokalt adresserbar, fullständig,
färdigsorterad datamängd" — en förutsättning väg A aldrig kunde uppfylla,
väg B gör det per konstruktion).

**Sentinel-undantaget (fälla 43/51, 186 av 559 `"Ej tillgängligt"`):**
blir `p.namn !== 'Ej tillgängligt'` som ett vanligt JS-strängvillkor inuti
`.reduce()`-byggaren — SAMMA korrekthetskrav (mätt bugklass, fälla 51),
NOLL arkitekturskillnad från en server-`<>`-villkor, bara utfört i
JavaScript i stället för en Airtable-formel.

**Svensk kollationsordning — NYTT, POSITIVT fynd detta pass tillför:**
sibling-passets fälla 51 dokumenterade en KVARSTÅENDE inkonsekvens även
med väg A: bokstavsFILTRET kan byggas diakritik-korrekt, men BLÄDDRINGS-
ordningen (Airtables `sort: Namn asc`) veckar Å mot A ändå, eftersom
sortering och filter är olika Airtable-mekanismer. **I väg B försvinner
det problemet helt, om man vill:** sorterar man den fullt laddade arrayen
klientsidan med `Intl.Collator('sv-SE')`/`localeCompare('sv-SE')} (samma
korrekta collation som redan används för bokstavsradens ORDNING, se
sibling-fokusfråga 4) INNAN rendering, blir bläddring OCH filter för
FÖRSTA gången collation-konsekventa med varandra — något väg A aldrig
kunde uppnå fullt ut (servern styr sorteringen, appen kan bara göra
FILTRET korrekt). Detta är en tillkommande möjlighet, inte ett
paritetskrav — flaggas som ett explicit, litet scope-tillägg för Marcus
att ta ställning till, inte något som "följer automatiskt".

**Tomma bokstäver (283.3):** mekaniskt opåverkat, men PRD:ns egen
riskformulering försvinner. PRD:n varnar: *"Antalet per bokstav ska komma
ur den genomgång EF:en redan gör. Går det inte... är nedtoningen en egen
kostnad."* I väg B finns ingen separat genomgång att misslyckas — arrayen
ÄR genomgången, `letterCounts[bokstav] === 0` är alltid tillgängligt utan
extra kostnad.

**Facit-amendering (283.4, väg A, `T157`) och QA (283.5):** orörda av
detta pass — ren process- respektive verifieringsfråga, utanför denna
frågas scope.

## Vad jag inte kunde belägga

1. **Ingen branschledare anger en exakt "N poster"-brytpunkt** för när
   klientsök slutar vara rätt val. Talen jag citerar (MiniSearch ~50 000,
   Linears "10 000-ärenden") är biblioteks-/sekundärkälle-kapacitetstal,
   inte en uttalad regel från en förstaparts-produktbeslut.
2. **Supabase Edge Functions' svars-/nyttolaststorleksgräns** — sökt
   riktat mot `supabase.com/docs/guides/functions/limits` (hämtad i
   fulltext), hittade minne/CPU/varaktighet men INGEN explicit
   svarsstorleks-siffra. Kan inte uteslutas att en sådan gräns finns men
   är dokumenterad på annan sida.
3. **Telefonnummer- och Ort-array-gränsfallen** (mellanslag/bindestreck-
   normalisering, join-gräns-läckage) är resonerade ur källkoden, INTE
   verifierade mot en levande post med formaterat telefonnummer — det
   staging-sample jag drog bar inga sådana värden.
4. **Linears förstaparts-tekniska artikel** (`linear.app/blog/scaling-
   the-linear-sync-engine` och `linear.app/now/...`) gick INTE att hämta i
   fulltext — båda sidorna jag nådde var ANNONSSIDOR för en video, inte
   den tekniska texten. Alla Linear-fynd vilar på `performance.dev`
   (sekundärkälla, teknisk genomgång) plus en GitHub-repo som enligt
   sökträffen är "endorsed by Linear CTO" men som jag INTE själv
   verifierat mot repot.
5. **Apples exakta gränsvärde** för "hur många kontakter är för många att
   hämta eagerly" hittades inte som en siffra, bara kvalitativ vägledning
   (batch-hydrering) via sökmotor-utdrag — samma "JS-renderad SPA"-
   begränsning sibling-passet redan flaggade för Apples egna sidor.
6. **Google Contacts webbklientens laddarkitektur** — INTE undersökt i
   detta pass. Deklarerad ORESEARCHAD lucka, inte ett negativt fynd.
7. **`EventValjare.tsx`s faktiska eventantal** i prod är INTE MÄTT — den
   interna precedentens giltighet vid "hundratals rader" specifikt vilar
   på arkitektur-likhet, inte på en storleks-matchad jämförelse.
8. **React Arias `useFilter`-sidas fullständiga API-signatur** (exakt
   beteende för `startsWith`/`endsWith`, alla sensitivity-nivåer) kunde
   inte hämtas komplett i fulltext (sammanfattningsverktyget rapporterade
   att signaturerna låg i en icke-inkluderad komponent). `"base"`-
   semantiken verifierades i stället oberoende mot MDN:s
   `Intl.Collator`-specifikation, vilket är auktoritativt för den
   underliggande mekaniken även om det inte är en verbatim-signatur från
   `react-aria.adobe.com` självt.
9. **Det exakta 1 500-DOM-nod-tumreglestalet** (§ Fokusfråga 4) är en
   sekundärkälle-/aggregator-syntes (web.dev-artikel om `react-window` +
   flera bloggposter), inte spårat till en enskild, namngiven
   förstaparts-rekommendation (t.ex. en specifik Chrome DevTools- eller
   Lighthouse-regel).

## Rekommendation (rekommendation, inte beslut)

1. **Bygg en parameterlös "hela registret"-retur** som bygger ut den
   redan existerande `fetchFromAirtable`-fullwalken (idag använd för
   `total` med `fields: ['Namn']`) till att returnera samtliga
   `mapPerson`-fält för samtliga poster som uppfyller `BAS_FILTER`. Ingen
   ny mekanism — en breddning av en befintlig.
2. **Klientfilter: rent `.toLowerCase().includes()`, ingen
   diakritik-normalisering, ingen tokenisering.** Detta är paritetskravet,
   mätt mot Airtables `SEARCH()`-semantik (§ Fokusfråga 2). Om Marcus vill
   ha den diakritik-toleranta sökning appen redan har på eventsidan
   (`useFilter({ sensitivity: 'base' })`) är det ett EXPLICIT, separat
   produktbeslut — inte något som ska smygas in via omskrivningen.
3. **Bokstavsindexet byggs som en `.reduce()` över samma laddade array.**
   `TASK-283.1` stoppas (bekräftar uppdragets premiss); `283.2–283.4`
   byggs om mot klientdata. Överväg SEPARAT (egen litet beslut, inte
   krävt för paritet) att sortera den laddade arrayen med
   `Intl.Collator('sv-SE')` före rendering — det löser fälla 51:s
   kvarstående bläddrings-/filter-inkonsekvens för första gången.
4. **Behåll paginerad RENDERING ("Ladda fler") ovanpå den fullt laddade
   arrayen.** DOM-nodtaket (§ Fokusfråga 4), inte datamängden, är skälet.
5. **Koppla in explicit invalidering** av den nya queryns nyckel i
   `useCreateRegistration` (och personens övriga skrivvägar) INNAN eller
   SAMTIDIGT som `staleTime` höjs bortom det globala 5-minuters-defaulten.
   Behåll 5 min tills dess — annars byts dagens irritation ("laddas om vid
   varje tecken") mot ett tystare, värre fel ("visar aldrig nya
   personer").
6. **Avgör warmup-inkludering (`ADR-112`) explicit i spec**, inte i detta
   pass — motiveringen som idag utesluter `persons.search` ur
   warmup-mängden håller inte längre för en parameterlös registerfråga,
   men om den ändå ska ingå i den BLOCKERANDE startvärmningen är en
   kostnads-avvägning `ADR-112` redan ger ramen för.

## Källförteckning

**Förstapart, hämtat i fulltext:**

- [React — useDeferredValue](https://react.dev/reference/react/useDeferredValue)
- [Superhuman Engineering Blog — Delightful search](https://blog.superhuman.com/delightful-search-more-than-meets-the-eye/)
- [Slack Engineering — A faster, smarter Quick Switcher](https://slack.engineering/a-faster-smarter-quick-switcher/)
- [React Aria — useFilter](https://react-aria.adobe.com/useFilter)
- [MDN — Intl.Collator, sensitivity-option](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator/Collator)
- [Supabase Docs — Edge Functions Limits](https://supabase.com/docs/guides/functions/limits)

**Förstapart, endast sökmotor-utdrag (sidan gick inte att hämta i
fulltext):**

- [Apple — CNContactStore.unifiedContacts(matching:keysToFetch:)](https://developer.apple.com/documentation/contacts/cncontactstore/unifiedcontacts(matching:keystofetch:))
- [Linear — Scaling the Linear Sync Engine (annonssida, ej teknisk text)](https://linear.app/blog/scaling-the-linear-sync-engine)

**Tredjepart, teknisk sekundärkälla:**

- [performance.dev — How's Linear so fast? A technical breakdown](https://performance.dev/how-is-linear-so-fast-a-technical-breakdown)
- [GitHub — wzhudev/reverse-linear-sync-engine (uppges "endorsed by Linear CTO", ej oberoende verifierat av mig)](https://github.com/wzhudev/reverse-linear-sync-engine)
- MiniSearch/Fuse.js kapacitetstal — aggregator-syntes, ingen enskild
  primärkälla fulltext-verifierad (npm-compare.com, devpick.co)
- ~1500-DOM-nod-tumregeln — web.dev/react-window-artikel + aggregator-
  bloggposter, ingen enskild namngiven regel spårad

**Egen källkod och egen mätning (MÄTT, slår citat ovan när de motsäger
varandra):**

- `src/components/persons/PersonsList.tsx` (rad 76, 104, 261, 266–267)
- `supabase/functions/get-persons/index.ts` (rad 125, 145, 177)
- `supabase/functions/_shared/airtable-filter.ts` (rad 149–175)
- `supabase/functions/_shared/cursor.ts`
- `supabase/functions/_shared/airtable-client.ts` (do/while full-walk)
- `src/router.ts` (rad 11–31, QueryClient-defaults)
- `src/queries/keys.ts` (rad 61–75, `persons`-grenen)
- `src/data/warmup/startvarmningen.ts` (rad 222–224, 229–233)
- `src/components/events/EventValjare.tsx` (rad 177, 393)
- `src/data/adapters/DataSourceAdapter.ts` (rad 63),
  `AirtableAdapter.ts` (rad 118), `SupabaseAdapter.ts` (rad 68)
- Grep, noll träffar: `queryKeys.persons.search`/`.all`-invalidering i
  `src/data/mutations/`; virtualiseringsbibliotek i `package.json`/`src/`
- `docs/reference/data-model.md` § Kända fällor, post 43 (rad 1443) och
  post 51 (rad 1465)
- `docs/reference/airtable-constraints.md` § B, post P4/P5/P6
- Airtable staging-bas `apphjj8Q7lkXCMsL4`, tabell `Personer`
  (`list_records`-frågor 2026-08-21: `BAS_FILTER`-räkning, `SEARCH("asa"…)`
  kontra `SEARCH("åsa"…)`, fullt fält-sample för nyttolaststorlek)
- `backlog/tasks/task-283` — PRD läst i sin helhet via
  `npm run bl -- task 283 --plain`, 2026-08-21

**Redan etablerad, återanvänd utan omprövning:**

- [`bokstavsindex-personlista-branschmonster-2026-08-21.md`](bokstavsindex-personlista-branschmonster-2026-08-21.md)
  (fälla 43/51-fynden, svensk kollations-belägg, WCAG/APG-a11y-golvet)
