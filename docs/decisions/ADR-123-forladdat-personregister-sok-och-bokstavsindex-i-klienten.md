# ADR-123: Förladdat personregister — sök och bokstavsindex i klienten

- **Status:** Accepted (Marcus GO 2026-08-21, *"Då kör vi B!"*, efter ett
  STOPP med två vägar och en rekommendation; research-passet landade EFTER
  beslutet och bekräftade det — se § Kontext om ordningen)
- **Datum:** 2026-08-21
- **Fas:** Fas 6 (go-live-förberedelse)
- **Rör:** `src/components/persons/PersonsList.tsx` ·
  `src/data/adapters/DataSourceAdapter.ts` (+ båda implementationerna) ·
  `supabase/functions/get-persons/index.ts` · `src/queries/keys.ts` ·
  `src/data/warmup/startvarmningen.ts` · `src/data/mutations/` (skrivvägar
  som skapar personer) · `TASK-283` (bokstavsindexet)
- **Relation till tidigare beslut:** supersederar INGET. Bygger på
  [`ADR-078`](ADR-078-instant-regeln.md) (INSTANT-regeln — navigering väntar
  aldrig på data vi redan har) och tillämpar den på sök. Respekterar
  [`ADR-055`](ADR-055-datakalla-atkomst-router-context-di.md)/[`ADR-057`](ADR-057-lager-oberoende-fitness-invariant.md)
  (datalagret nås enbart via adaptern — kontraktet breddas, kringgås inte).
  [`ADR-112`](ADR-112-forberedelseskarmen-blockerande-startvarmning.md) ger
  ramen för värmnings-frågan (beslut 6). Amenderar `TASK-283`:s
  implementationsbeslut (väg A, EF-filter) — öppet, i kortet, via CLI:t.

## Kontext

Marcus, på personlistan, verbatim: *"Det är ju sjukt störigt att listan
'Laddas om' vid varje teckeninmatning i sökfältet. Den måste ju vara
'förladdad' eller något. Detta är ju inte proffsigt."*

**Vad koden gör, mätt före svar** (`PersonsList.tsx`, S109 Del 7): debounce
250 ms · `useInfiniteQuery` med `queryKey: persons.search({ q })` **utan**
`keepPreviousData` · `isPending` byter hela listan mot skelett · varje term går
EF → Airtable `filterByFormula` över `Namn`, `E-post`, `Telefon`, `Ort`. Kedjan
*ny term → tom cache → skelett → rundtur → omritning* är det han ser. Repot bär
redan motsatt mönster på två ytor (`useDashboardData.ts:52`,
`AktivitetsHistorik.tsx:456`, `keepPreviousData`).

**Två vägar presenterades som STOPP.** A: lappa symptomet (`keepPreviousData`,
rundturen kvar, ~0,5–1,5 s per term). B: förladda registret och sök i
klienten. Rekommendationen var B; Marcus valde B. **Ordningen var omvänd mot
normen** — beslutet föregick research-passet. Passet
([`forladdat-personregister-klientsok-branschmonster-2026-08-21.md`](../research/forladdat-personregister-klientsok-branschmonster-2026-08-21.md))
kördes direkt efter och hade kunnat falsifiera valet; det gjorde tvärtom, med
tre fynd som inte fanns i underlaget vid beslutet:

1. **Precedenten är intern.** `EventValjare.tsx` — ytan `ADR-078` föddes ur —
   laddar REDAN hela eventlistan vid start och filtrerar REDAN lokalt
   (`useFilter`, rad 177 och 393). Väg B är samma mönster som redan körs, för
   en annan tabell.
2. **Laddningen är ingen ny kostnad utan en omfördelning.** `get-persons`
   gör REDAN, vid varje besök med tom sökning, en fullständig 6-sidors walk
   av hela registret — bara för att räkna `total` (`index.ts:175–177`,
   `fields: ['Namn']`). Att returnera posterna i stället för att räkna dem
   ersätter två parallella anrop med ett.
3. **Airtables `SEARCH()` är diakritik-KÄNSLIG** (mätt i staging:
   `SEARCH("asa", LOWER({Namn}))` → 0, `"åsa"` → 1). Paritet i klienten är
   därför ren `toLowerCase().includes()` — medan appens eget
   `EventValjare`-mönster (`sensitivity: 'base'`) är diakritik-*okänsligt*.
   De två kan inte båda ärvas tyst.

**Storleken, mätt:** 559 personer uppfyller basfiltret i prod (fälla 43/51);
~616 B per post → ~336 KiB okomprimerat för hela registret; sex sekventiella
Airtable-anrop. Tillväxten är tiotals per år. Varje branschtak som hittades
(Linear 10 000 utan särskild optimering, MiniSearch ~50 000) ligger en till
två storleksordningar över. **Den bindande gränsen är renderingen, inte
datan:** ingen virtualisering finns, och 559 rader ovirtualiserat är
~3 500–4 500 DOM-noder.

**En lucka som redan fanns:** ingen mutation invaliderar `persons.*` någonstans
i kodbasen (grep, noll träffar) — en ny anmälan syns i listan först efter
5 minuters `staleTime` eller fönster-refokus. Väg B gör den luckan dyrare att
ignorera, eftersom "ladda en gång, cacha länge" är hela poängen.

## Beslut

### 1. Registret laddas HELT, via adaptern, som en breddning av den walk som redan görs

`DataSourceAdapter` får ett parameterlöst kontrakt som returnerar samtliga
personer som uppfyller basfiltret, med de fält listan redan visar.
Airtable-implementationen breddar `get-persons`:s befintliga fullwalk
(`fields: ['Namn']` → alla `mapPerson`-fält, posterna returneras i stället för
att räknas). Supabase-stubben bär samma kontrakt. `listPersons` med
sök/cursor behålls tills den sista konsumenten är borta — ingen
big-bang-rivning. Adaptern är enda vägen; komponenten specialfallar aldrig
Airtable (`ADR-057`-golvet).

### 2. Sök i klienten är byte-för-byte paritet med dagens formel — breddning är ett separat produktbeslut

Filtret är `toLowerCase().includes()` per term över `Namn`, `E-post`,
`Telefon` och `Ort` (arrayfält: något element), ingen tokenisering, ingen
diakritik-normalisering — exakt `SEARCH()`-semantiken som mättes. Paritet
bevisas med ett testfall som kör samma termer mot EF:ens filter och mot
klientfiltret på samma fixtur-mängd. **Diakritik-tolerans** (att "asa" hittar
Åsa, som eventväljaren redan gör) är en synlig produktförändring: den
registreras som eget kort med Marcus som beslutsfattare, smygs aldrig in.

### 3. Bokstavsindexet och räknarraden blir härledningar ur samma array

Fördelningen per bokstav och sentinel-hinken (fälla 43/51) är en `reduce`
över registret — bunden till HELA registret, aldrig söktermen, exakt som
`TASK-283`:s PRD kräver. `TASK-283.1` (EF-filtret) **utgår** med skäl
bokfört i kortet; `283.2–283.4` byggs mot klientdata; stopp-grinden om "en
andra genomgång" upphör att vara en fråga. Räknarraden (`TASK-277`) blir
`filtrerad.length` — den separata `total`-walken och dess skew-logik rivs
när listan bytt källa.

### 4. Listan sorteras i klienten med svensk kollation

`Intl.Collator('sv')` på den laddade arrayen ger A–Z, Å, Ä, Ö — samma
ordning bokstavsindexet redan beslutat. Det stänger fälla 51:s synliga
inkonsekvens (Å bland A vid bläddring men egen hink vid filter) för första
gången; Airtables sortering var en vägg, vår egen array är det inte.
Sentinelen `"Ej tillgängligt"` sorteras sist, i sin hink.

### 5. Renderingen förblir paginerad — det är DOM:en som sätter gränsen

Hela arrayen filtreras på varje tecken (ingen debounce på filtreringen;
`useDeferredValue` håller fältet responsivt), men bara de första 50
träffarna renderas; "Ladda fler" blir en klientsidig utökning av samma
filtrerade array med samma knapp och samma `aria-live`-annonsering. Skälet
är nodtaket i § Kontext, inte nätverket. URL-parametern `q` behålls
(delbar sökning) men uppdateras debounced — den är en bieffekt av
skrivandet, inte dess motor.

### 6. Färskhet: invalidering byggs FÖRST, sedan får cachen leva längre

`staleTime` för registerfrågan förblir det globala 5-minutersvärdet tills
varje skrivväg som kan skapa eller ändra en person (ny anmälan, manuell
anmälan, personändringar) uttryckligen invaliderar registernyckeln och det är
bevisat med test. Därefter får `staleTime` höjas. Ordningen är tvingande:
annars byts dagens irritation mot ett tystare och värre fel — *listan visar
aldrig nya personer*.

### 7. Värmning: på avsikt och vid första besök — inte i den blockerande startvärmningen

Registret ingår INTE i Förberedelseskärmens blockerande mängd
(`ADR-112`): sex sekventiella Airtable-anrop hör inte hemma framför första
bildrutan på `/hem`. Det värms **på avsikt** (`ADR-078` beslut 3: hover/fokus
på Personer-fliken startar hämtningen) och annars lat vid första besök på
`/personer`, med skelett i slutgeometri för just den första laddningen.
Kommentaren i `startvarmningen.ts` som utesluter `persons.search` för att den
*"saknar naturlig kärnfråga"* uppdateras — den nya frågan HAR en kärnfråga;
den hålls utanför av kostnadsskäl, inte av principskäl. Omprövas om
mätningen av första besöket visar att lat laddning är märkbar.

## Öppet, och medvetet inte beslutat här

- ~~**Diakritik-tolerant sök** (beslut 2) — eget kort, Marcus beslut.~~
  **STÄNGD 2026-08-22.** Marcus svarade JA på `TASK-286.5`; breddningen är
  byggd i `TASK-286.7`. Se § Updates nedan — beslut 2:s paritetskrav är
  därmed upphävt, medan resten av beslut 2 (fältmängden, "något element" för
  arrayfältet Ort, tom sökterm) står orört.
- **Skalgränsens siffra.** Ingen branschledare ger en exakt brytpunkt; vår
  uttalade gräns är *rendering före data*. Omprövas när registret passerar
  ~2 000 eller när första laddningen mäts över en sekund på 3G — då är
  virtualisering (`@tanstack/react-virtual`) nästa steg, inte server-sök.
- **Händelsedriven färskhet** (Airtable-webhook → invalidering) — utanför
  denna ADR; `airtable-constraints.md` P26/P27 sätter ramen.

## Alternativ som förkastades

**A — `keepPreviousData` + dämpad lista.** Skelett-blinket försvinner men
rundturen per term är kvar; "instant" nås aldrig. Förkastat av Marcus som
otillräckligt (*"Detta är ju inte proffsigt"*).

**B′ — förladda men filtrera diakritik-okänsligt från start** (ärv
`EventValjare`-mönstret). Förkastat som *tyst* produktförändring: sökträffarna
hade ändrats samma dag som mekaniken, och ingen hade kunnat skilja regression
från avsikt. Tas som eget beslut.

**C — server-sök med prefetch av vanliga termer.** Gissar vad Lotta ska
skriva; löser inte tecken-för-tecken-latensen; ingen precedent bland de
undersökta produkterna för register i denna storlek.

**D — rendera hela registret utan paginering.** Enkelt, men över
DOM-nodtaket redan i dag (3 500–4 500 noder) och utan virtualisering i
appen; `EventValjare` renderar allt men dess lista är inte mätt stor nog att
vara precedent.

## Konsekvenser

- **Positivt:** sök svarar på varje tecken utan rundtur; noll skelett vid
  skrivning; bokstavsindex, räknarrad och svensk sortering blir gratis
  härledningar; hela registret sökbart offline (PWA, `ADR-072`:s
  persist-lager, [`ADR-072`](ADR-072-klient-persist-av-query-cachen.md)); Airtable-belastningen per besök minskar (ett anrop i
  stället för två parallella).
- **Kostnad:** ~336 KiB vid första besök (sex Airtable-anrop, ~1,5–3 s kall
  — mäts i första skivan); invalidering måste byggas i alla person-skapande
  skrivvägar innan cachen får leva längre; `TASK-283` skrivs om och ett
  påbörjat EF-filter kasseras; paritetstestet måste underhållas så länge
  båda vägarna finns.
- **Risk:** en sökbreddning som smyger in via "bättre" normalisering —
  därför beslut 2:s paritetstest. Och en cache som överlever en ny person
  — därför beslut 6:s ordning.

## Updates

### 2026-08-22 — Beslut 2 breddas: sök i klienten blir diakritik-TOLERANT (`TASK-286.7`)

Beslut 2:s fältmängd, arrayfälts-regel ("något element" för `Ort`) och
tomsträngs-regel står ORÖRDA. Denna post ändrar EN sak: matchningens
diakritik-semantik, och därmed paritetstestets facit-källa.

**Vad som beslutades.** Marcus svarade **JA** på `TASK-286.5` (HITL-kortet
denna ADR själv skapade när den lämnade frågan öppen). Hans motivering,
ordagrant ur kortets notes:

> Svenska namn bär diakritiker som vardag, inte som kant (Åsa, Östergren,
> Ängström). Två sökytor med olika beteende i samma app är en inkonsekvens
> användaren omöjligt kan förutse — eventväljaren är redan tolerant.
> Argumentet emot är ett testargument: paritet med Airtables `SEARCH()` var en
> mätning av dagens läge, aldrig ett mål. Träffmängden växer dessutom åt rätt
> håll — fler namn, aldrig färre.

**Paritetsmålet mot Airtables `SEARCH()` upphävs, med skäl.** Beslut 2 band
klientfiltret byte för byte till EF:ens `SEARCH()`-formel och kallade
breddningen en risk ("en sökbreddning som smyger in via 'bättre'
normalisering"). Den risken var **tystnaden**, inte breddningen: `B′` bland
förkastade alternativ avvisades uttryckligen som en *tyst* produktförändring,
inte som fel produkt. Med ett fattat, daterat och bokfört beslut är villkoret
uppfyllt, och pariteten har gjort sitt. Vad `SEARCH()` gör förblir en
**mätning** av datakällan (§ Kontext fynd 3) — den var aldrig ett mål i sig.

**EF:en tappar ingen täckning.** `get-persons`s `?search=`-gren är oförändrad
och testas fortsatt av `tests/api/get-persons.staging.test.ts`
(cursor-conformance, `ADR-056`). Det som byttes är facit-KÄLLAN i
`tests/api/get-persons-sok-paritet.staging.test.ts`: från likhet med EF:ens
svar till **likvärdighet med eventväljarens filter**, prövad mot en oberoende
replik av `useFilter`s `contains` över samma staging-register.

**Mekanismen: eventväljarens semantik, inte en ny.** `EventValjare.tsx` rad
177 kör `useFilter({ sensitivity: 'base' })`. Hooken kan inte anropas ur
`src/lib/person-sok.ts` (rena funktioner, ingen render-kontext; båda
testsviterna anropar dem direkt), så dess algoritm återanvänds i stället,
tagen ur `react-aria` 3.51.0:s källa: NFC-normalisering plus ett glidande
fönster av `Intl.Collator(..., { usage: 'search', sensitivity: 'base' })`.

**Kortets föreslagna lokal (`'sv'`) föll på en mätning — och det är den
intressanta delen.** `TASK-286.5`/`TASK-286.7` skrev
`Intl.Collator('sv', { sensitivity: 'base' })` som en av två vägar. Den vägen
ger **noll** diakritik-tolerans (node 24.13.1, full ICU):
`compare('asa', 'åsa') = -1`, `compare('o', 'ö') = -1`. Skälet är svensk
ortografi, inte en bugg: **Å, Ä och Ö är egna bokstäver i svensk kollation,
inte accenttecken på A och O**, så `sensitivity: 'base'` har ingenting att
vika bort. Varken `sv-u-co-search` eller `sv-u-ks-level1` ändrar det, och en
utelämnad lokal löses mot runtimens standardlokal — i en svensk webbläsare
`sv`. Vikningslokalen pinnas därför explicit till en kollation utan nordisk
tailoring, låst i BÅDA riktningar av `tests/api/person-sok.test.ts`.

**Följdfynd, bokfört öppet (ingen åtgärd i detta kort).** § Kontext fynd 1/3
beskriver eventväljaren som diakritik-okänslig. Det är sant **villkorat av
webbläsarens språk**: `useFilter` hämtar sin lokal ur `useLocale()`, och
`EventValjare` monteras inte under någon `I18nProvider` (`ManuellAnmalanForm`,
`EventDetail`, `AtgardsSida`) — så den faller tillbaka på
`navigator.language`. I en svensk webbläsare är eventväljaren alltså **inte**
å/ä/ö-tolerant. Personlistan pinnar sin lokal och är det oavsett. De två
ytorna kan därför fortfarande skilja sig, men i motsatt riktning mot före
beslutet, och personlistan är den som följer beslutet. Att pinna
eventväljarens lokal är en egen, oberoende ändring av en produktionsyta och
tas inte här.

**Beslut 4 (svensk sortering) är opåverkat.** Sortering och sökning är olika
axlar: listan sorteras med `Intl.Collator('sv')` (A–Z, sedan Å, Ä, Ö —
å/ä/ö **separerade** från a/o) och söks med vikningskollationen (å/ä/ö
**likställda** med a/o). Två frågor, två rätta svar. De två collatorerna delas
medvetet inte.

**Vad breddningen faktiskt gjorde med träffmängden**, mätt mot staging
2026-08-22 (60 poster i registret, samma register före och efter):

| term | före | efter |
|---|---|---|
| `'asa'` | 0 | **1** |
| `'åsa'` | 1 | 1 |
| `'ås'` | 1 | **11** |
| `'anna'` / `'ej till'` / `'070'` / `'falköping'` / `'example.com'` | 0 / 1 / 1 / 15 / 18 | oförändrade |

Marcus formulering ("fler namn, aldrig färre") höll i varje mätt term. Den
tredje raden är också en varning värd att bära: en KORT term viks till en
kort nyckel, så `'ås'` blev `'as'` och drog in Astrid, Hassan, Rasmus och
Tobias. Det är korrekt beteende — men `TASK-286.7` valde därför att INTE låsa
paritetstestet vid "`'ås'` ger samma mängd som `'asa'`" (kortets AC #2:s
ordalydelse), utan vid den mekaniskt sanna superset-relationen. Likheten var
en förutsägelse om DATAN, inte om semantiken, och den var falsk redan i
landningsögonblicket.

**Kostnad, mätt lokalt** (node 24.13.1, 559 poster = § Kontext:s prod-siffra,
fyra fält, 30 varv): 0,84–4,54 ms per filtrering mot 0,06–0,14 ms för den
gamla `toLowerCase().includes()`. Inom en bildruta, och beslut 5:s
`useDeferredValue` håller fältet responsivt oavsett. Talet är **lokalt** —
ingen mätning på Lottas enhet finns.

Källor: `TASK-286.5` (Marcus beslut + motivering), `TASK-286.7` (utförandet),
`src/lib/person-sok.ts` filhuvud (mättabellen).
