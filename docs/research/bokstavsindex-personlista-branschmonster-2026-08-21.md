---
owner: marcus803
updated: 2026-08-21
review_by: 2026-11-21
status: draft
---

# Bokstavsindex (A–Ö) ovanför sökrutan i en lång personlista — branschmönster och a11y-golv

> **Proveniens:** avgränsat research-pass (bakgrundsagent), 2026-08-21, kört
> oisolerat i huvudkatalogen. Frågan är EN, nedskriven, avgränsad: hur bygger
> branschledare ett bokstavsindex ovanför/under en sökruta i en lång
> personlista, och vad är a11y-golvet för formen? Formvalet (filter, inte
> scroll-hopp) är redan kvitterat av Marcus 2026-08-20 — detta pass stänger
> fyra öppna delfrågor och ger belägg. Ingen kod, ingen ADR och inget kort i
> detta repo har rörts — enda leveransen är denna fil.

## Vad jag redan hade, innan sökningen

`docs/research/` gav två falska vänner och en sann träff:

- **`personlista-scanlista-branschmonster-2026-08-10.md`** (2026-08-10) — om
  radform (tonal kontra zebra) och statuspiller i samma lista. Rör inte
  bokstavsindex; grep på "bokstav/alfabet/index-jump" gav noll relevanta
  träffar i den filen.
- **`register-index-skalning-branschmonster-2026-08-07.md`** (2026-08-07) —
  handlar om hur **dokument-register** (ADR-index, changelogs) skalar när de
  växer. Ett falskt positivt på ordet "index" — helt annat ämne, ingen
  överlappning.
- **Sann träff, i själva källkoden:** `PersonsList.tsx`s egen docblock (rad
  ~243) säger rakt ut: *"Det som INTE byggdes, medvetet: bokstavsgruppering
  (Marcus-beslut; cursor-pagineringen skär grupper mitt itu vid
  sidgränsen)."* Detta är precis den `#pre-K`-forensik uppdraget bad om — och
  den bekräftar uppdragets premiss: bokstavsindex avfärdades EN gång redan
  (som gruppering-i-listan, inte som filter), av exakt det skälet arkitektur-
  avsnittet nedan mäter i detalj.

`docs/decisions/` och `tasks/lessons.md` gav **noll träffar** på bokstavsindex/
alfabetindex som eget ämne (sökningen på ordet "bokstav" gav bara träffar på
frasen "till bokstaven" i orelaterade ADR:er). Ingen ADR reglerar detta i
förväg. Ingen tidigare research finns att komplettera i stället för att
duplicera — **detta pass körs i full bredd.**

`data-model.md` fälla 43 verifierades ordagrant mot filen (rad 1443): 365 av
816 Anmälningar och 186 av 414 Skool-union-personer är namnlösa, återvinning
0 av 187, Marcus-verifierat 2026-07-09 att namnen aldrig funnits digitalt.
Detta är **inte åldrat** — det är en engångs-backfill-händelse från en historisk
importkörning, inget som förändras av att tiden gått.

## Kort svar

**Dom:** bygg bokstavsraden som en **rad frikopplade filter-knappar**
(`role`-fritt, vanliga `<button>` i en `<nav>` eller enkel `<div>`-grupp med
roving tabindex), var och en `aria-pressed`, som lägger till EN extra
`LEFT({Namn},1)="X"`-villkor i samma `AND(...)`-formel sökfältet redan bygger.
Följ **svensk kollationsordning** (A–Z, sedan Å, Ä, Ö, i den ordningen) och ge
den 186-postersstora `"Ej tillgängligt"`-klumpen en **egen, namngiven hink**
(`{Namn}="Ej tillgängligt"`, exakt jämförelse) — ALDRIG låt den falla in under
bokstaven E, dit den annars hamnar av ren sträng-sortering. Kombinera fritext
och bokstav med AND, precis som appens sökfält redan kombineras med
bas-filtret. Håll varje knapp ≥24×24 CSS px (WCAG 2.5.8, AA) och räkna med att
29–31 sådana mål inte får plats i en rad på mobilbredd — det är en
implementationsfråga att lösa i spec, inte i detta pass.

**Den avgörande delfrågan:** fokusfråga 1. Svaret där avgör att "filter kontra
hopp" i praktiken inte är två vägar till samma mål när backend är Airtables
REST-lista (ingen offset-räkning, ingen count-primitiv, `airtable-
constraints.md` P6) — de konvergerar till SAMMA MEKANISM, en ny filtrerad
fråga. Marcus formval är därför inte bara UX-preferens, det är den enda
billiga vägen givet arkitekturen.

## Arkitektur-facit ur egen källkod (MÄTT, styr alla sex delfrågor)

- **MÄTT:** `supabase/functions/get-persons/index.ts:125` sätter
  `BAS_FILTER = '{Antal anmälningar (totalt)} > 0'`, och rad 131 bygger
  `filterByFormula = AND(${BAS_FILTER}, ${sokFilter})` — sökfältet är REDAN en
  AND-komponerad extra-villkor-mekanism. En bokstavsknapp är arkitektoniskt
  bara ETT TREDJE AND-villkor.
- **MÄTT:** `supabase/functions/_shared/cursor.ts` — cursorn är en OPAK
  base64-wrapping av Airtables egen `offset`-token (`{ o: string }`). Klienten
  kan aldrig räkna ut "vilken offset motsvarar bokstaven K" — token betyder
  ingenting utanför en pågående, redan startad sidsekvens.
- **MÄTT:** `get-persons/index.ts:175–184` — totalantalet (`total`) beräknas
  med en SEPARAT full-walk (`fetchFromAirtable` med bara `fields: ['Namn']`),
  körd EN gång per sökning (bara på sida 1, `offset` saknas), och degraderar
  tyst till `undefined` vid fel. Totalen är alltså känd (nästan) gratis —
  **positionen inom sekvensen är det aldrig**, exakt uppdragets premiss.
- **MÄTT:** `supabase/functions/_shared/airtable-filter.ts` — `SEARCH()`-
  baserad sökning (`buildSearchAcrossFieldsFilter`) och `combineWithAnd`
  finns redan som generella byggstenar; att lägga till en
  `LEFT({Namn},1)="X"`-sträng i samma lista är samma mönster, inte ett nytt.

## Fokusfråga 1 — Filter kontra hopp

**De två branschmönstren är arkitektoniskt olika djupt ner, inte bara i UI:**

1. **Scroll-ankare (native OS-mönstret).** iOS: `UITableViewDataSource`s
   `sectionIndexTitles(for:)` + `UILocalizedIndexedCollation` — en array av
   korta strängar som mappas till sektioner i en REDAN LADDAD, REDAN
   SORTERAD, i minnet hållen datamängd; ett tryck ger tabellen kommandot att
   scrolla till en känd sektion-`Int`
   ([sectionIndexTitles(for:)](https://developer.apple.com/documentation/uikit/uitableviewdatasource/sectionindextitles(for:)),
   Apples egen sida — **kunde inte hämtas fulltext, JS-renderad SPA, exakt det
   föregående passet varnade för**; sekundärkälla nedan). Android:
   `AlphabetIndexer`/`SectionIndexer` gör samma sak via **binärsökning över en
   cursor**: *"If the items in the adapter are sorted by simple
   alphabet-based sorting, then this class provides a way to do fast indexing
   of large lists using binary search"* — verbatim ur arkiverad primärkälla
   ([AlphabetIndexer, arkiverad
   snapshot](https://webarchive.library.unt.edu/web/20160706182902mp_/https://developer.android.com/reference/android/widget/AlphabetIndexer.html)).
   **Gemensamt för båda: mekanismen FÖRUTSÄTTER en lokalt adresserbar,
   fullständig, färdigsorterad datamängd.** Det är precis den förutsättning
   vår app avsiktligt inte har (cursor-paginering, `PAGE_SIZE=50`, `ADR-056`)
   — och precis det skäl `PersonsList.tsx` själv anger för att redan ha
   avfärdat bokstavsgruppering en gång.

2. **Filter (branschens svar när datan INTE är lokal).** Att visa "bara K"
   genom att skicka en NY fråga till servern med ett extra villkor, och låta
   paginering/cursor starta om från den frågans första sida.

**Varför de facto konvergerar i vår arkitektur:** Airtables REST-API har
ingen numerisk offset och ingen count-primitiv (`docs/reference/airtable-
constraints.md` P6, citerat redan i `get-persons/index.ts`s egen kommentar
rad ~157–160). Ett "hoppa till K" byggt ärligt mot detta API kan INTE vara ett
klientsidigt scroll-kommando (det finns ingen lokal, redan hämtad lista att
scrolla i) — det måste vara en NY, serverstyrd fråga med
`Namn >= "K"`-liknande villkor, som återstartar cursor-sekvensen därifrån.
Det är **exakt samma verkan** som ett filter (`Namn` börjar på K), förutom att
ett äkta "hopp" skulle fortsätta in i L, M... medan ett rent filter stannar
vid K. Given att Airtable-formler stöder både `=` och `>=`/`<` på textfält
(sträng-jämförelse, samma collation som `sort` — se fokusfråga 4), är valet
mellan de två en **en-rads-skillnad i formelbyggaren**, inte en
arkitekturskillnad. Marcus val av filter (visa bara K, `=`) framför
kvasi-hopp (`>=`K, fortsätt scrolla) är alltså en ren UX-avvägning ovanpå en
redan avgjord arkitekturfråga — inte tvärtom.

**Ingen branschledare jag hittade bygger "filter" och "hopp" som SAMMA
komponent mot en icke-lokal datakälla** — sidor med statiskt, redan
serverrenderat, FULLSTÄNDIGT innehåll (NHS.uk:s läkemedels-A–Ö, se fokusfråga
3) löser det med `#a`/`#k`-URL-ankare inom en enda, redan komplett sida — inte
en paginerad lista. Det är en tredje, för vår sida orealistisk väg (skulle
kräva att hela 559-personerslistan renderas i ett svep, vilket cursor-
pagineringen uttryckligen finns för att undvika).

## Fokusfråga 2 — Hinken för namnlösa

**iOS `"#"`-konventionen är förstapartsdokumenterad, men jag nådde den bara
via sekundärkälla — Apples egen sida gick inte att hämta fulltext (JS-
renderad SPA, samma mönster föregående pass varnade för).** Vad jag KUNDE
belägga:

- **MÄTT (egen källa, sekundär men teknisk och detaljerad):**
  [NSHipster, "UILocalizedIndexedCollation"](https://nshipster.com/uilocalizedindexedcollation/)
  visar Apples faktiska, lokal-genererade `sectionIndexTitles`-arrayer:
  `en_US`: `A, B, C, ..., Z, #`. `sv_SE`: `A, B, C, ..., Z, Å, Ä, Ö, #`. `"#"`
  är alltså sista posten i BÅDA lokalerna — ett universellt, icke
  språkspecifikt suffix.
- Sökmotor-utdrag ur Apples egen sida (kunde inte verifieras mot fulltext,
  markeras som svagare källgrund): *"Section index titles are short...
  generally limited to 2 Unicode characters"* och att `"#"` fungerar som
  konvention för icke-alfabetiska poster.
- **Android har INGEN motsvarande inbyggd konvention.** `AlphabetIndexer`s
  alfabet är utvecklar-tillhandahållet, en ren sträng
  (`" ABCDEFGHIJKLMNOPQRSTUVWXYZ"` i exemplet, verbatim ur arkiverad
  primärkälla) — klassen har ingen egen `"#"`-hantering inbyggd. Ett
  eventuellt `"#"` i Android-appar (t.ex. Kontakter) är app-egen logik, inte
  ett OS-primitiv på samma sätt som iOS.

**Vad ingen av källorna säger:** att `"#"` (eller någon motsvarighet) betyder
"posten saknar namn". Både iOS och Android beskriver bucketen som en
katalog för **icke-alfabetiska SORTERINGSNYCKLAR** (siffror, symboler,
emoji) — inte för en sentinelsträng som `"Ej tillgängligt"` som BÖRJAR med en
vanlig bokstav. Jag hittade **ingen primärkälla, i någon av de två
ekosystemen, för en NAMNGIVEN hink** ("No Name", "Utan namn" eller
motsvarande) som skiljs ut explicit från `"#"`.

**Det starkaste, helt egna fyndet i hela passet (MÄTT, 2026-08-21, prod-basen
`app8uGPrVCVOm6LfD`):** `filterByFormula {Namn}="Ej tillgängligt"` mot
`Personer`-tabellen visar att hela klumpen sorterar **sammanhållet inom
bokstaven E** — direkt efter `"Desiree Andersson"` och före `"Eleonor
Bondesson"`, eftersom strängen bokstavligen börjar med "E". Ett naivt
`LEFT({Namn},1)="E"`-filter skulle alltså blanda ~200+ namnlösa poster med de
äkta E-namnen (Erik, Emma, Eva, Elin...) och göra bokstaven E meningslös som
filter. **`"Ej tillgängligt"` måste undantas via en EXAKT sträng-jämförelse
(`{Namn}<>"Ej tillgängligt"` i alla bokstavsvillkor, plus en egen hink med
`{Namn}="Ej tillgängligt"`)** — detta är inte en industri-precedent-fråga,
det är en mätt korrekthetsbugg som annars uppstår med säkerhet.

## Fokusfråga 3 — Tomma bokstäver

**Android ger ett konkret, primärkälls-belagt svar — men för SCROLL-modellen,
inte filter-modellen.** `getPositionForSection`: *"Performs a binary search or
cache lookup to find the first row that matches a given section's starting
letter"*, och returnerar *"the row index of the first occurrence, or the
nearest next letter"* (arkiverad primärkälla, se ovan). En tom bokstav
SNAPPAR ALLTSÅ FRAMÅT till nästa icke-tomma bokstav — den varken döljs eller
inaktiveras, för att mekanismen är en scroll-position, inte ett resultat.
**Detta mönster överförs inte rakt av till ett filter:** klickar man "Ö" i ett
filter och noll personer heter något på Ö, finns inget "nästa" att snappa
till — resultatet måste vara en tom lista eller en förhindrad knapptryckning.

**Två verkliga, men INTE branschledande, precedent hittade för hur en
STATISK A–Ö-sida hanterar tomma bokstäver** (markerade tredjepart/tertiär
källa, inte "branschledare" i samma klass som Apple/Android/W3C):

- **NHS.uk, läkemedels-A–Ö** (produktionskod, hämtad direkt):
  bokstäverna **X och Y UTELÄMNAS HELT** ur navigeringslistan när inga
  läkemedel finns där — de renderas varken som länk eller som inaktiv knapp,
  sidan visar bara texten "There are currently no medicines listed" under
  respektive ankare.
- **Oxfordshire A-to-Z-komponenten** (LocalGov Drupal-släkt, brukas av flera
  engelska kommuners digitala tjänster — produktionskod, hämtad direkt):
  tomma bokstäver renderas som en **icke-interaktiv `<span
  class="...__letter--off">`** — SYNLIG på sin plats i raden (rutnätet
  förblir helt) men utan länk/knapp, och därmed automatiskt utanför tab-
  ordningen eftersom ett `<span>` aldrig är fokuserbart. **Ingen ARIA
  används** i detta exempel (inget `aria-disabled`) — ett genuint a11y-hål i
  precedentet värt att inte kopiera rakt av.

**Ingen primärkälla (WCAG/WAI-ARIA APG) tar uttryckligen ställning** till om
en knapp vars tillgänglighet ändras baserat på LIVE, filtrerad data ska vara
`disabled`, `aria-disabled="true"` (kvar i tab-ordning, med visuell
markering) eller helt utelämnad. Den generella branschpraxisen (sekundärkälla,
CSS-Tricks m.fl.) rekommenderar `aria-disabled="true"` + kvarhållen
fokuserbarhet när användaren annars inte kan förstå VARFÖR en kontroll saknas
— vilket talar för Oxfordshire-mönstret (synlig, men markerad) framför
NHS-mönstret (osynlig), men detta är en syntes, inte ett direkt citat av en
regel som namnger just detta scenario.

**Egen, implementationsnära observation (ej industriprecedent, egen
slutsats):** i FILTER-modellen är "är bokstaven tom" inte känt förrän EFTER
en fråga körts — till skillnad från Android/iOS scroll-index (som byggs på
en redan hämtad, komplett sorterad array där tomhet är trivial att avgöra
lokalt). Att veta i förväg vilka av 29 bokstäver som har noll träffar kräver
antingen en extra full-walk (kostnad, samma mönster som `total`-fältet redan
betalar en gång) eller att låta knappen alltid vara klickbar och visa ett
"0 träffar"-tillstånd efter frågan. Detta är en lokal avvägning för spec, inte
något branschen har löst åt oss.

## Fokusfråga 4 — Svensk kollation

**MÄTT, det starkaste enskilda fyndet i hela passet (prod-basen, sort:
`Namn` asc, samma sortering `get-persons/index.ts:147` skickar till
Airtable):** basens defaultsortering är **INTE** svensk kollationsordning.
Den VECKAR diakritiska tecken mot sin basbokstav i stället för att sortera
Å/Ä/Ö efter Z:

- `Åsa Ganell`, `Åsa Jansson`, `Åsa Jeborn`, `Åsa Karner`, `Åsa Reinholdson`
  (samtliga 5 poster som börjar på Å i hela basen) sorterar mellan `Annika
  Svessar` och `Axel Andersson` — exakt där "Asa" (utan diakrit) hade
  hamnat alfabetiskt (n < s < x).
- `Anneli Åsblom` sorterar FÖRE `Anneli Clevenrot` — konsekvent med samma
  veckning (`Åsblom` ≈ `Asblom` < `Clevenrot`).
- **MÄTT:** noll poster i basen börjar på Ä eller Ö (`LEFT({Namn},1)="Ä"` och
  `="Ö"` gav båda tomma träfflistor, 2026-08-21) — vilket också gör
  fokusfråga 3:s "tom bokstav"-problem KONKRET och NUVARANDE för just dessa
  två knappar, inte hypotetiskt.

**Samtidigt är FILTER-jämförelse (`=`) diakritik-KÄNSLIG, till skillnad från
sortering** — **MÄTT:** `filterByFormula OR(LEFT({Namn},1)="Ä",
LEFT({Namn},1)="A")` returnerade UTESLUTANDE literal-A-namn (inga Å-namn
blandades in); `LEFT({Namn},1)="Å"` gav uteslutande de 5 Åsa-posterna. Detta
är den avgörande tekniska poängen: **även om basens BLÄDDRINGS-sortering
veckar Å mot A, kan bokstavsFILTRET ändå byggas diakritik-korrekt** eftersom
filter-jämförelse och sorteringscollation är två olika mekanismer i Airtable
— den ena (`=`) skiljer Å från A, den andra (`sort`) gör det inte.

**Svensk kollationsordning i sig — belagt via två oberoende, samstämmiga men
inga av dem hundraprocentigt primära källor:**

- **CLDR (Unicode):** sökmotor-syntes (ej verbatim primärkälls-citat — jag
  nådde inte en renderad CLDR-diagramsida eller rå XML-tailoring för `sv`)
  anger att svensk kollation lägger Å, Ä, Ö som egna bokstäver EFTER Z,
  till skillnad från t.ex. tyskans `ä`≈`ae`-veckning. Detta är konsekvent
  med allmän skolkunskap om svenska alfabetet (29 bokstäver, sista tre
  Å Ä Ö).
- **iOS `sv_SE`-lokalens faktiska `sectionIndexTitles`** (sekundärkälla,
  NSHipster, se fokusfråga 2): `A, B, ..., Z, Å, Ä, Ö, #` — Apples egna
  levererade lokal-data bekräftar samma ordning oberoende av CLDR-sökningen.
- **SS 01 40 01** (Svenska institutet för standarder, den formella svenska
  sorteringsstandarden uppdraget efterfrågade specifikt): **kunde INTE
  beläggas** — det är en betalstandard utan fri webbkälla; jag hittade ingen
  tillgänglig fulltext att citera. Deklareras uttryckligen som obelagt nedan,
  inte antaget identiskt med CLDR även om de sannolikt sammanfaller i sak.

## Fokusfråga 5 — Kombination bokstav + fritext

**Arkitektoniskt är detta redan löst i vår kodbas, inte en öppen fråga (MÄTT,
egen källa):** `get-persons/index.ts:131` bygger redan
`AND(${BAS_FILTER}, ${sokFilter})`. Ett bokstavsvillkor
(`LEFT({Namn},1)="K"`) är ett tredje AND-lem i samma formel —
`combineWithAnd` (`_shared/airtable-filter.ts`) är redan skriven för N
villkor, inte bara två. Ingen ny mekanism krävs.

**Industri-precedent för UX-FRÅGAN (kombinera eller uteslut varandra
ömsesidigt):** Baymard Institute (UX-forskningsbyrå, sekundärkälla — inte en
"branschledare"-produkt utan en respekterad forskningsorganisation som
studerar branschledarna) anger som etablerat mönster för e-handelsfilter:
**AND mellan olika filter-TYPER, OR inom samma filter-typ** — t.ex. "(Blå
ELLER Röd) OCH (Under 100 kr) OCH (Nike)". Bokstav och fritext är två olika
filtertyper i denna mening; AND mellan dem är alltså det etablerade mönstret,
inte ömsesidig uteslutning.

**Jag kunde INTE belägga hur flaggskeppsprodukter (iOS Kontakter, Android
Kontakter, Gmail) hanterar SAMSPELET mellan en aktiv sökterm och det
synliga indexet** (t.ex. om indexraden döljs medan sökfältet har text) — de
sökträffar jag fick var forumtrådar och community-diskussioner, inte
förstaparts- eller ens stark tredjepartsdokumentation. Detta redovisas som
obelagt, inte som "beteendet finns inte".

**Egen syntes (uttryckligen min slutsats, inte ett citat):** eftersom bokstav
och fritext i vår arkitektur mynnar i EXAKT SAMMA `filterByFormula`, är de
inte i spänning på det sätt en klientrenderad indexrad kan vara mot en
separat sökvy (där indexet ofta är en helt egen renderingsmod som byts ut).
De kan samexistera som två oberoende, AND-ade fasetter: välj bokstav
och/eller skriv text, båda smalnar samma resultatmängd — samma modell som
Baymards cross-facet-AND, applicerad på vår konkreta backend.

## Fokusfråga 6 — A11y-golvet

**Träffyta — WCAG 2.5.8 Target Size (Minimum), primärkälla, hämtad direkt
från w3.org:**

- **Nivå AA** (WCAG 2.2).
- Kravtext (verbatim): *"The size of the target for pointer inputs is at
  least 24 by 24 CSS pixels, except when:"* — följt av fem undantag, varav
  **spacing-undantaget** är direkt relevant för en tät bokstavsrad: en
  visuellt liten glyf är tillåten OM en tänkt cirkel med 24 px diameter,
  centrerad på målytan, inte skär in i grannmålets cirkel. Det ger
  utrymme för smala, tätt packade bokstavsknappar MED tillräcklig osynlig
  padding, utan att varje glyf självt behöver vara 24 px bred.
- Övriga undantag (`equivalent`, `inline`, `user agent control`,
  `essential`) är inte relevanta för en bokstavsrad.

**Roller/markup — WAI-ARIA APG, primärkälla, hämtad direkt:**

- **Toolbar-mönstret** (`w3.org/WAI/ARIA/apg/patterns/toolbar/`): *"A
  toolbar is a container for grouping a set of controls, such as buttons,
  menubuttons, or checkboxes"*, avsett för grupper om **3 eller fler**
  kontroller som visuellt hör ihop — exakt vår situation (29+ knappar).
  Tangentbordsmodellen är **roving tabindex**: *"Tab and Shift+Tab: Move
  focus into and out of the toolbar"* (ETT tabb-stopp för hela raden), och
  *"Left Arrow"*/*"Right Arrow"* flyttar fokus MELLAN knapparna i raden. Detta
  är den korrekta, W3C-förankrade modellen för en horisontell rad
  besläktade knappar — INTE 29 separata tabb-stopp.
- **Button-mönstret, toggle-varianten** (`w3.org/WAI/ARIA/apg/patterns/
  button/`): *"To tell assistive technologies that a button is a toggle
  button, specify a value for the attribute aria-pressed"* (`true`/`false`),
  med det kritiska tillägget: *"It is critical the label on a toggle does
  not change when its state changes"* — bokstaven "K" ska förbli "K" oavsett
  om den är vald; tillståndet bärs av `aria-pressed` + visuell stil, aldrig
  av att byta text.
- **Dokumenterad lucka, verifierad genom fetch:** APG:s Toolbar- och
  Button-mönster tar INTE uttryckligen ställning till hur en grupp
  toggle-knappar där EXAKT EN ska vara aktiv i taget (ömsesidigt
  uteslutande) ska markeras — ingen `radiogroup`-hänvisning görs i någon av
  de två mönstersidorna. Detta är ett genuint gap i förstapartskällan, inte
  min brist på sökning.

**Vad vår egen kodbas redan gör (MÄTT, direkt relevant precedent för
konsekvens, `Deltagare.tsx`):** filterknappar i eventsidans deltagarlista
använder REDAN mönstret `<button type="button" aria-pressed={aktiv}>` —
docblocket (rad ~165) säger uttryckligen: *"A11y (11/10): summeringsraderna
är knappar med `aria-pressed` (filtret är ett toggle-tillstånd)"*, och
noterar att en tidigare `ToggleButtonGroup`/kategori-flik-lösning
**medvetet revs och promoverades bort** (TASK-162.3) till förmån för enkla,
fristående `aria-pressed`-knappar. Samma idiom syns i `VariantD.tsx` och
`PrototypeSwitcher.tsx`. **Toolbar + `aria-pressed` per knapp är alltså inte
bara branschmönstret — det är redan den etablerade, medvetet valda
konventionen i DENNA kodbas**, vilket väger tungt för konsekvens (Gunilla-
principen om återanvändning gäller lika mycket internt som mot branschen).

**Egen räkning (ej citat, ren aritmetik):** svensk bokstavsrad = 26 + Å, Ä,
Ö = 29 mål, plus en namnlös-hink och sannolikt en "visa alla"-nollställning
= **upp till 31 diskreta mål**. Vid exakt 24 px/mål och noll marginal blir
det **31 × 24 = 744 CSS px** i bredd — bredare än de flesta mobilskärmar i
stående läge (iPhone SE: 375 px; större telefoner: 390–430 px). En enda rad
utan radbrytning ryms alltså INTE på mobil utan antingen (a) flera rader,
(b) horisontell scroll, eller (c) spacing-undantaget med mycket smala
synliga glyfer och generös osynlig padding — sannolikt fortfarande med fler
än en rad. **Detta förklarar varför iOS/Androids native-mönster i stället är
en VERTIKAL, drag-skrubbad strimma** (Apples HIG, tredjepartsspegel av
Apples egen text, `codershigh.github.io`-mirror): *"An optional index can
appear vertically along the right edge of a plain table"*, kontrollerad
genom *"large swiping gestures"* snarare än 29 diskreta pekträffar. Vår
redan valda FORM (filterrad ovanför/under sökrutan, inte en sidostrimma)
ärver INTE den lösningen automatiskt — brytning/scroll måste beslutas
separat i spec. Detta lämnas uttryckligen öppet, inte löst av detta pass.

## Vad jag inte kunde belägga

1. **Apples egna sidor för `sectionIndexTitles(for:)` och
   `UILocalizedIndexedCollation`** gick inte att hämta i fulltext (JS-
   renderad SPA, tomt skal) — precis det föregående passet i detta repo
   varnade för. Allt om iOS `"#"`-konventionen och `sv_SE`-arrayen vilar på
   NSHipster (teknisk, väletablerad sekundärkälla) plus ett sökmotor-utdrag,
   inte ett verifierat citat från apple.com självt.
2. **SS 01 40 01** (den svenska sorteringsstandarden uppdraget uttryckligen
   pekade ut) kunde inte nås — betalstandard, ingen fri webbkälla hittad.
   CLDR:s `sv`-collation och iOS:s `sv_SE`-lokaldata pekar samstämmigt åt
   samma håll, men det är INTE samma sak som att ha läst SS 01 40 01 själv.
3. **En namngiven "namnlös"-hink** ("No Name" e.dyl.) i iOS eller Android
   Kontakter kunde inte beläggas mot förstapartsdokumentation — bara `"#"`
   för icke-alfabetiska SORTERINGSNYCKLAR är dokumenterat, vilket är en
   annan sak än en sentinelsträng för dataförlust.
4. **Hur iOS/Android/Gmail Kontakter hanterar samspelet mellan aktiv
   sökterm och synligt index** (döljs indexraden vid sökning?) — endast
   forumtrådar hittades, ingen förstaparts- eller stark tredjepartskälla.
5. **Material Design (M2 och M3), Carbon v11 och Apples HIG-sida för
   tabeller** gick i olika grad inte att hämta i fulltext (JS-renderade
   SPA:er eller DNS-fel för en subdomän) — där jag ändå har ett fynd (Carbon
   Content Switcher, Apple HIG-tabellsida) är det via sökmotor-utdrag eller
   en tredjepartsspegel, inte ett direkt, verifierat citat från källans egen
   domän.
6. **Exakt aktuellt antal `"Ej tillgängligt"`-poster i Personer-vyn just nu**
   — jag bekräftade MÖNSTRET (sammanhållen klump inom bokstaven E, betydligt
   fler än 186 vid en rå frågeträff mot hela BAS_FILTER-scopet) men räknade
   inte fram en exakt, aktuell siffra; `data-model.md`s 186/414-tal är från
   2026-07-09 och kan ha förskjutits sedan dess i takt med att nya
   anmälningar/leads tillkommit.
7. **Ingen WCAG/APG-källa tar uttryckligen ställning** till (a) hur en knapp
   vars tillgänglighet beror på LIVE, filtrerad data ska markeras
   (disabled/aria-disabled/utelämnad), eller (b) hur en grupp ömsesidigt
   uteslutande toggle-knappar (exakt en aktiv) ska rollsättas. Båda är
   syntetiserade ur närliggande, men inte identiska, mönster.

## Rekommendation (rekommendation, inte beslut)

- **Bygg raden som `role="toolbar"` (eller motsvarande roving-tabindex-grupp)
  av vanliga `<button aria-pressed>`**, konsekvent med APG:s Toolbar-mönster
  OCH med `Deltagare.tsx`s redan etablerade, medvetet valda idiom i denna
  kodbas. Håll bokstaven som statisk `children`-text; bär tillståndet enbart
  via `aria-pressed` + stil.
- **Ordning: A–Z, Å, Ä, Ö** (svensk konvention, samstämmig CLDR + iOS
  `sv_SE`-data) — trots att basens BLÄDDRINGS-sortering veckar Å/Ä/Ö mot
  A/O. Bygg varje knapp mot en `=`-filterjämförelse (diakritik-korrekt,
  MÄTT), inte mot den veckade sorteringen.
- **Ge `"Ej tillgängligt"` en egen, namngiven hink** (t.ex. "Utan namn"), med
  `{Namn}="Ej tillgängligt"` som exakt villkor, och undanta samma sentinel
  explicit ur alla bokstavsvillkor (`{Namn}<>"Ej tillgängligt"` AND
  `LEFT({Namn},1)="E"`) — detta är inte valfritt, det är en mätt
  korrekthetsbugg annars.
- **AND:a bokstav med fritext** i samma `filterByFormula`, återanvänd
  `combineWithAnd`. Ingen ömsesidig uteslutning.
- **Bestäm tomma-bokstäver-hanteringen explicit i spec, inte i detta pass**
  — Oxfordshire-mönstret (synlig men icke-interaktiv, `aria-disabled="true"`
  och kvarhållen i tab-ordning för upptäckbarhet, TILL SKILLNAD från deras
  ARIA-lösa exempel) väger något starkare än NHS-mönstret (utelämna helt)
  given den allmänna a11y-praxisen för disabled-kontroller, men ingen
  förstapartskälla tvingar valet.
- **Räkna med flerraders eller scrollbar layout på mobil** (31 mål × 24 px
  golv ≫ mobilbredd) — lös explicit i spec, t.ex. via flerraders
  radbrytning eller horisontell scroll-container, snarare än att anta att
  en enda rad räcker.

## Källförteckning

**Förstapart, hämtat direkt (primärkälla):**

- [WCAG 2.2 — Understanding SC 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [WAI-ARIA APG — Toolbar Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)
- [WAI-ARIA APG — Button Pattern (toggle button)](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
- [Android — AlphabetIndexer, arkiverad primärkälla](https://webarchive.library.unt.edu/web/20160706182902mp_/https://developer.android.com/reference/android/widget/AlphabetIndexer.html)

**Förstapart, endast sökmotor-utdrag (sidan själv gick inte att hämta i
fulltext — JS-renderad SPA):**

- [Apple — sectionIndexTitles(for:)](https://developer.apple.com/documentation/uikit/uitableviewdatasource/sectionindextitles(for:))
- [Apple — UILocalizedIndexedCollation.sectionIndexTitles](https://developer.apple.com/documentation/uikit/uilocalizedindexedcollation/sectionindextitles)
- [Apple HIG — Tables (tredjepartsspegel, ej apple.com)](https://codershigh.github.io/guidelines/ios/human-interface-guidelines/ui-views/tables/index.html)
- [Carbon Design System — Content Switcher (sökmotor-utdrag, v11-sidan gick inte att nå — DNS-fel)](https://carbondesignsystem.com/components/content-switcher/usage/)

**Tredjepart, teknisk sekundärkälla:**

- [NSHipster — UILocalizedIndexedCollation](https://nshipster.com/uilocalizedindexedcollation/)

**Tredjepart, produktionskod (hämtad direkt, ej "branschledare"-klass):**

- [NHS.uk — Medicines A to Z](https://www.nhs.uk/medicines/)
- [Oxfordshire A-to-Z-komponent (LocalGov Drupal-släkt)](http://occlss.oxfordshire.gov.uk/components/atoz/)

**Tredjepart, UX-forskning:**

- [Baymard Institute — Filtering UX: Combining Filter Options](https://baymard.com/blog/allow-applying-of-multiple-filter-values)
- Sökmotor-syntes om CLDR svensk kollation (ingen enskild sida verifierad i
  fulltext) — se § Vad jag inte kunde belägga punkt 2.

**Egen källkod och egen mätning (MÄTT, slår alla citat ovan när de
motsäger varandra):**

- `supabase/functions/get-persons/index.ts` (rad 98–103, 125, 131, 147,
  155–184)
- `supabase/functions/_shared/cursor.ts`
- `supabase/functions/_shared/airtable-filter.ts` (rad 140–175)
- `src/components/persons/PersonsList.tsx` (docblock, rad ~157, ~243)
- `src/components/events/detail/Deltagare.tsx` (rad ~165, ~312)
- `docs/reference/data-model.md` fälla 43 (rad 1443)
- Airtable prod-bas `app8uGPrVCVOm6LfD`, tabell `Personer`
  (`tbl6ZyCm3V026iFTU`), direkta `list_records`-frågor 2026-08-21 (sort,
  `LEFT(Namn,1)`-filter för A/Ä/Å/Ö/O/Ö/P, exakt-matchning på
  `"Ej tillgängligt"`)
