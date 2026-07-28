# ADR-080: Acceptance-klassen — hermetisk utbrytning ur e2e, med kontraktsvakt som villkor

- Status: Accepted (Session 91 — 2026-07-27)
- Datum: 2026-07-27
- Fas: Session 91, CI-/grind-arkitekturspåret (processarbete, ej byggfas)

> **Om beslutsvägen — bokförd öppet.** Grillningen fördes 2026-07-27 mot fem
> öppna beslut. Marcus delegerade dem i klump: *"Du har all kontext samt målbild
> från mig för att kunna ta rätt beslut. Kör på det du rekommenderar."* Besluten
> nedan är därför **Codes, fattade på uttrycklig delegering** — inte Marcus egna
> avvägningar. Det noteras här därför att fångst-empirin (ADR-041) säger att
> extern granskning dominerar självgranskning: en framtida läsare ska kunna se
> att just dessa fem inte passerade Marcus-grinden, och väga dem därefter.

## Kontext

Staging-sviten mäter **9,25 min**, varav e2e-steget är 84 %, och hela jobbet
ligger bakom en global mutex `staging-tests`. Alla PR:er serialiseras därför:
tre parallella kod-PR:er blir 9 + 9 + 9 minuter i serie. Mutexen finns för att
staging är **en** delad muterbar Airtable-bas och **ett** delat Supabase-projekt.

Fem research-pass (S91) mätte problemet och letade väg ut:

- **Tidsbudgeten** visade att utbrytning av de hermetiska e2e-testerna tar
  mutex-hållningen från 9,25 min till **~2,4 min** — faktor 3,8 på den enda
  resurs som är knapp.
- **Hermetik-mätningen** kördes skarpt: 865 restanrop, varav **86 % Google
  Fonts**; font-pinning gör **19 av 32 filer** rena på egen hand. Samma pass
  **falsifierade** påståendet att e2e aldrig skriver till staging —
  `skapa-event` skriver skarpt.
- **Branschpraxis-passet** läste sex projekt i källan och fann att vår topologi
  är den lägst rankade i Googles egen ranking och står på Thoughtworks
  HOLD-lista.
- **Merge queue-passet** stängde kö-vägen: `merge_group`-bygg slås inte ihop, så
  kön flyttar serialiseringen utan att upphäva den.
- **Verktygsvals-passet** rev tre av fyra egenbyggs-anklagelser; bara MSW var en
  äkta försummelse.

Två premisser tillkom 2026-07-27 och **ersätter** den tvåveckorshorisont som bar
det ursprungliga snittet:

1. **Horisonten till Supabase är öppen.** Migreringen sker först när appens alla
   sidor är byggda till Marcus facit — fem ytor saknar ännu facit-behandling.
   Två veckor är önskan, inte deadline. Den ursprungliga motiveringen *"resten
   löser migreringen"* håller därmed inte.
2. **90/10-portabilitetskravet:** arkitekturen ska vara 110 % toppdesignad med
   väl underbyggda Airtable-anpassningar, men **~90 % ska överleva
   Airtable→Supabase-bytet** oförändrat och lika förstklassigt.

Premiss 1 gör snittet **mer** värt, inte mindre: vinsten tas ut per körning under
hela den längre perioden. Men den skärper också risken — se Beslut 3.

## Beslut

### 1. Klassbytet är beslutet, inte optimeringen

De utbrutna testerna mockar Edge-funktioner **vi själva äger**. Det gör inte
manövern fel — Ghost gör exakt detta — men resultatet är **inte längre e2e i
precedentens mening**. Klassen får därför eget namn, egen katalog, egen config
och eget jobb: **acceptance**.

Kallas den fortfarande e2e kommer nästa läsare — och nästa agent — att tro att
den bevisar saker den inte bevisar.

**Hemvist för termen:** denna ADR plus `CONTRIBUTING.md`. **Inte** `ORDLISTA.md`
— dess egen avgränsning lyder *"Endast projektspecifika domänbegrepp får post —
allmänna programmeringsbegrepp exkluderas, hur ofta de än används"*, och
acceptance är en testklass, inte ett produktdomänbegrepp. (Grillningsunderlaget
föreslog ORDLISTA; det var fel hemvist och rättas här.)

**Ghost-precedenten gäller formen, inte verktyget.** Ghost kör Vitest Browser
Mode med MSW:s service worker. Playwright-precedenten för MSW är i stället
rust-lang/crates.io, camunda/camunda och coveo/ui-kit.

### 2. Snittet går vid protokollet — 19 hermetiska, 13 skarpa

|Sida|Vad den bevisar|Var den kör|
|---|---|---|
|**Acceptance**|Att **appen** renderar och beter sig rätt givet ett svar av rätt form|Hermetiskt, mot fixtur, utan mutex|
|**API**|Att **staging och Airtable** producerar svar av den formen|Mot staging, bakom mutexen|

Fogen mellan dem är svarsformen, bevakad av att samma zod-schema parsar både
fixtur och skarpt svar. **Tillåts ett schema och en fixtur någon gång divergera
faller hela argumentet.**

Vad som **inte** flyttas:

- **API-sviten. Punkt.** 173 tester, 65 s, 11,7 % av jobbet — och repots enda
  bevis för att Airtable beter sig som koden tror. En läsning mot en mock bevisar
  att mocken stämmer med koden; en läsning mot basen bevisar att **basen** stämmer
  med koden. Sviten är instrumentet för [ADR-063](ADR-063-airtable-bas-som-forstklassig-leverabel.md):s
  leverabel och får inte trubbas av.
- **`skapa-event`** — den skriver skarpt till staging, och det är dess syfte.
- **Tre omvärldsytor:** `auth-flow` (riktig inloggning, riktiga 401:or),
  `pwa-offline` (service worker mot verkliga svar), `css-cascade` (byggd kaskad).
  Nio tester, tolv sekunder.

Kvoten 19/13 (59 % hermetiskt) ligger mellan Ghosts 50 % och Grafanas 0,5 % och
är alltså inom precedent-rymden — men **kvoten bär ingenting**. Kriteriet bär.

> **RÄKNINGEN KORRIGERAD 2026-07-27 (S91, vid A5:s spec-arbete): 19/13 → 18/14.**
> Rådatan räknades om ur hermetik-mätningens JSONL (863 poster, 32 filer) i
> stället för att ärvas. **Den mekaniska räkningen reproducerades exakt:** 19
> filer är rena efter typsnitts-pinning, 13 har kvarvarande skarpa anrop.
>
> **Men de 19 mekaniskt rena är inte samma 19 som beslutet ovan menar.** Av de
> fyra filer som undantas explicit faller tre ut som skarpa av mätningen ändå
> (`skapa-event`, `auth-flow`, `css-cascade`). Den fjärde, **`pwa-offline`, är
> mekaniskt REN** — två anrop, båda typsnitt.
>
> **Undantaget är ändå riktigt**, av ett skäl mätningen strukturellt inte kan
> se: testet kräver **byggd preview** (service workern existerar inte i dev) och
> är rent från EF-anrop enbart för att det kör oautentiserat mot login-sidan.
> Dess bevis är bygg- och serve-kedjan, inte svarsformer — i en fixturvärld
> bevisar det ingenting.
>
> Beslutet ovan tycks alltså ha tagit den mekaniska 19:an som beslutets 19:a
> utan att dra av det egna undantaget. **Rätt tillämpning av kriteriet ger 18
> hermetiska och 14 skarpa** (59 % → 56 %, fortfarande inom samma
> precedent-rymd).
>
> Detta river inget beslut. ADR:n slår själv fast att kvoten inte bär något och
> att kriteriet bär — och kriteriet är oförändrat. Noten finns för att den som
> bygger klassen ska räkna filer mot rätt tal. Räkningen är återskapbar ur
> mätdatan; siffran är inte handplockad.

### 3. Kontraktsvakten är VILLKOR för utbrytningen, inte ett senare tillägg

Zod-schemana är **halva** kontraktet. De fångar form-drift (fält försvinner, typ
ändras). De fångar inte:

1. **Värde-drift** — fältet finns, semantiken har ändrats.
2. **Schemats egen drift** — schemat är *vår bild* av funktionen, inte dess
   deklaration. Ändras funktion och schema i samma commit av samma person är
   fixturen fortfarande grön och ingen signal uppstår. Googles *"there is no
   signal"*.

Vakten: **nattlig, icke-blockerande**, kör fixturerna mot skarp staging och
jämför. Fowlers kadens (*"once a day is plenty"*) och fail-semantik
(*"shouldn't necessarily break the build"*) matchar `nightly.yml`, som redan
finns och redan bär larmkedjan. Ytan är liten — tre endpoints
(`get-event-notes`, `get-registrations`, `get-events`) bär 104 av 118 skarpa
restanrop.

**Varför villkor och inte rekommendation:** [ADR-063](ADR-063-airtable-bas-som-forstklassig-leverabel.md):s
AT-Max-milstolpe kommer **aktivt att bygga om Airtable-basen**. Fixturer utan
vakt driftar tyst under exakt den perioden, och med öppen horisont är perioden
lång. Utan vakten är utbrytningen precis den tysta felklass Google beskriver.

### 4. Vakten i avbrytande läge, skärpt till Ghost-mönstret

Catch-all-vakten körs i **avbrytande** läge (`abort`), inte rapporterande — en
fil som flyttas för tidigt ska bli röd, inte grön av fel skäl. Tyst fallthrough
görs omöjlig.

Formen skärps samtidigt: i stället för `route.abort('blockedbyclient')` svarar
vakten som Ghosts — **statuskod med instruktionstext i klartext**, så ett
läckande anrop säger *vad som ska göras*, inte bara att något gick fel. Halva
mönstret finns redan i den visuella ramen, där omockade Edge-funktioner svarar
501 med namnet utskrivet.

### 5. Portabilitetsgränsen deklareras explicit (90/10)

Vid Supabase-bytet gäller:

**Överlever oförändrat (~90 %)** — hela acceptance-sidan (den bryr sig endast om
svarsform) · kontraktet "varje körning får en isolerad datanamnrymd" ·
mutex-avvecklingen · purge-/städgrinden · mätningen (`ci-metrics`) ·
risk-klassningen D0/D1/full · merge-dedupen · nattnätet med larmkedja ·
gate-proof-mekaniken · rött-först-kontraktet · kontraktsvaktens *form*.

**Skrivs om (~10 %)** — hur datanamnrymden realiseras (i dag prefix- och
sentinel-partitionering i en delad bas, med rate-limit-hänsyn; i Supabase
branch-databas per körning) · API-sviten, som per konstruktion bevisar
Airtables egenheter · kontraktsvaktens endpoint-lista.

Halva Airtable-realiseringen finns redan byggd utan att ha kallats det:
`.purge-staging-policy.json`, sentinel-klustret och
`npm run seed:review -- --ort …` **är** namnrymds-partitionering. Den ska
formuleras som kontrakt med utbytbar implementation — samma mönster som
`DataSourceAdapter` redan bär för appen
([ADR-056](ADR-056-list-paginerings-port-cursor-dubbel-kalla.md)).

## Alternativ som övervägdes

- **Behåll allt skarpt, lev med 9,25 min.** Förkastat: mutexen serialiserar
  varje PR, och latensen träffar hårdast i exakt det multi-agent-arbetsmönster
  som nu är normalformen. Kapabilitets-målbilden (frontier-klass) tolererar inte
  nio minuter för en bash-skriptändring.
- **Merge queue.** Verifierat omöjligt att lösa detta: `merge_group`-bygg slås
  inte ihop, så kön flyttar serialiseringen. Se
  [merge queue-passet](../research/merge-queue-mot-staging-mutex-2026-07-26.md)
  med amendering 2026-07-27. Lager 1 (org-kravet) är sedan dess upphävt; lager 2
  står.
- **Shardning först.** Blockerad: shards skulle slåss om samma staging-data.
  Blir gratis **efter** hermetiseringen, inte före.
- **Efemär skarp backend per körning** — branschens faktiska svar, och det
  starkaste alternativet. **Delvis stängt för oss:** Airtable-basen är inte
  självhostbar och inte klonbar (beräknade fält read-only, `Delete base`
  enterprise-only). Öppnas vid Fas E; då ska denna ADR omprövas.
- **Pact eller motsvarande contract-testing-ramverk.** Förkastat som
  överdimensionerat för tre endpoints med en konsument och en producent i samma
  repo. Den nattliga vakten ger samma signal till en bråkdel av kostnaden.

## Konsekvenser

**Positiva:** mutex-hållningen 9,25 → ~2,4 min (faktor 3,8) · shardning blir
möjlig (steg 3) · klassnamnet gör det omöjligt att förväxla vad sviten bevisar ·
~90 % av arbetet överlever Supabase-bytet · font-pinningen följer Playwrights
egen skrivna rekommendation om tredjepartsservrar.

> **UTFALL 2026-07-28 (A5 klar, `task-59.1`–`59.6`) — projektionen ovan träffade
> inte, och det noteras här hellre än att räknas om i tysthet.**
>
> | mått | ADR:ns projektion | faktiskt utfall |
> |---|---|---|
> | staging-sviten | 9,25 → **~2,4 min** | 9,10 → **6,50 min** |
> | antal filer | 19 rena / 13 skarpa | **18 / 14** (se noten om `pwa-offline`) |
>
> Vinsten är verklig — cirka **29 %** — men långt från faktor 3,8. Varför
> skillnaden uppstår är INTE utrett här; det är `task-59.7`:s uppgift, och den
> ska mäta i stället för att härleda. En hypotes värd att pröva där: de arton
> filerna bar en mindre andel av sviten än tidsbudget-passet uppskattade,
> eftersom mätningen räknade ANROP och inte väggklocka.
>
> **En andra effekt som inte fanns i projektionen:** acceptance-jobbet växte
> från 2,8 till **6,7 min mot ett tak på 8** när sviten gick 51 → 152 tester och
> `task-60`:s självtest kör dem en gång till. Marginalen 1,3 min är en risk för
> falsk röd och överlämnas till `task-59.7`.
>
> **STÄNGD 2026-07-28 av `task-59.7` — den formella mätningen:**
> [`acceptance-utbrytningens-utfall-2026-07-28.md`](../research/acceptance-utbrytningens-utfall-2026-07-28.md).
> Mutex-hållningen mätt till **9,77 → 6,55 min** (median över namngivna
> run-ID:n; efter-siffran reproducerar 6,50, före-siffran 9,10 gör den inte).
> **Avvikelsen är räknad, inte gissad:** projektionens 410 s härleddes ur
> **296 tester som mockar**, men klassnings-kriteriet är fil-nivå och flyttade
> **152 tester i 18 hela filer** — 147 mockande tester bor i filer med minst ett
> live-test och lämnade aldrig e2e. Tidsbudgetens fördelningsmodell träffar inom
> 8 % när den tillämpas på den population som faktiskt flyttades; felet var
> populationen, inte modellen. Hypotesen ovan (*"räknade ANROP och inte
> väggklocka"*) pekar rätt håll men namnger fel mekanism — mätningens § 4.3.
> Tak-marginalen åtgärdad: `timeout-minutes` 8 → 12 på acceptance-jobbet, med
> prislapp och mätdata utskrivna vid jobbet i `ci-suite.yml`.

**Negativa / skuld:** 19 filer med fixturer måste hållas sanna mot en bas som
AT-Max aktivt kommer att ändra — kontraktsvakten är motmedlet, men den är
nattlig och därmed upp till ett dygn långsam · MSW-bytet kostar ~3× slowdown i
ett mätt Vite-fall (msw issue #13) · `skipAssetRequests` är `true` som default
och släpper igenom fonts **tyst**, alltså exakt det vakten finns för att se —
måste sättas `false` · acceptance-klassen kan per definition inte fånga det som
bara uppstår mot skarp backend (förlustlistan i branschpraxis-passet).

> **RÄTTELSE 2026-07-27 (task-54.1) — `skipAssetRequests`-raden ovan är fel och
> rivs öppet.** Raden säger att optionen *"måste sättas `false`"*. Den slutsatsen
> är en felläsning av verktygsvals-passet: den tog passets **varning** för dess
> **rekommendation**. Passets faktiska slutsats
> ([`verktygsval-fyra-egenbyggen-2026-07-27.md`](../research/verktygsval-fyra-egenbyggen-2026-07-27.md)
> rad 170–174) är motsatt — behåll typsnitts-routen som egen **page-route** och
> låt MSW köra med default `true`, *"då undviks båda fällorna"*.
>
> **Varför det håller:** page-routes prövas före context-routes, så en egen
> font-route lämnar ingen typsnitts-trafik kvar för optionen att släppa igenom.
> `false` hade kostat ~3× körtid utan att köpa något.
>
> **Villkoret, som måste följa med:** defaultvärdet är säkert bara så länge
> NÅGOT abort:ar innan context-nivån nås. I dag är det sid-vakten. **Task-54.2
> flyttar vakten till `onUnhandledRequest` — en callback som
> `skipAssetRequests: true` kör FÖRE — och måste därför ompröva optionen i samma
> skiva.** Villkoret står även i koden, vid fixturen.
>
> Samma felläsning fanns i S91-restlistans A3-post och rättades där tidigare
> samma dag; att den också bodde i denna ADR upptäcktes först vid task-54.1:s
> review-pass. Beslutet rivs med kvittens i stället för tyst — ursprungstexten
> ovan är bevarad, inte redigerad.
>
> **UTFALLET AV DEN ANMODADE OMPRÖVNINGEN (task-54.2, infört 2026-07-27).**
> Rättelsen ovan ålade task-54.2 att ompröva optionen i samma skiva. Det gjordes,
> och **omprövningen vände rättelsens rekommendation**: optionen står i dag på
> **`false`** (`tests/visual/support/hermetic.ts`).
>
> **Grunden är källkodsläsning, inte resonemang.** `@msw/playwright`
> `fixture.ts` rad 98–103 kortsluter tillgångs-formade anrop med
> `route.fallback()` **före** `handleRequest`, alltså före callbacken. Med
> `true` når vakten aldrig en URL som slutar på `.png`, `.json`, `.css` … —
> mätt med en probe: en `.txt`-URL nådde **aldrig** callbacken och gick ut på
> nätet. Rättelsens villkor (*"defaultvärdet är säkert bara så länge NÅGOT
> abort:ar innan context-nivån nås"*) föll alltså när sid-vakten togs bort:
> ingenting abort:ar längre först.
>
> **Kostnadssiffran i rättelsen är också falsifierad.** Där står att `false`
> *"hade kostat ~3× körtid utan att köpa något"*. Mätt i vår uppställning:
> **17,3 s mot 14,9 s** — ingen mätbar kostnad. Issue #13:s 3×-varning gäller
> Vite-projekt med långt fler moduler än fixturvärlden laddar, och ärvdes hit
> utan att prövas.
>
> **Läget i dag** (verifierat mot koden 2026-07-27): sid-vakten är **borttagen**,
> endast de två typsnitts-routerna ligger kvar på sid-nivå, hermetiken bärs av
> **en** mekanism i `onUnhandledRequest`, och `skipAssetRequests: false` är
> villkoret för att den ser allt. Villkoret står även i koden, vid fixturen.
>
> Noten är införd eftersom rättelsen ovan annars säger motsatsen till vad koden
> gör — samma felklass som ADR:n redan drabbats av en gång: *felet hade två
> hemvister och bara en var känd*.

## Ärlighet om underlaget

**Motiveringen är inte att mock är förstahandsvalet.** Litteraturen och all
verifierad precedent säger motsatsen — Supabase, PostHog och cal.com mockar
aldrig sina egna tjänster. Den ärliga grunden är att branschens väg ut, efemär
skarp backend, är **delvis stängd för oss** eftersom Airtable inte är
självhostbar. Skulle denna ADR i stället påstå att "hermetisk är bäst praxis"
vore den falsifierbar på fem minuter.

**Evidensläget om mock-drift är tunt** och det sägs rakt ut i branschpraxis-passet
— vi bygger vakten på ett resonemang om felklassen, inte på publicerad
frekvensdata.

**Steg 3:s skalningsprojektion antar linjär skalning i workers.** Det antagandet
är inte verifierat för vår svit och ska mätas i steg 3, inte antas.

## Uppföljning

- Mät `concurrency` × `merge_group` skarpt när tillfälle finns — hela lager 2:s
  kalkyl i merge queue-passet är en härledning, och sedan 2026-07-27 är den
  mätbar. Aktivera inte merge queue före dess.
- Ompröva denna ADR vid **Fas E**: när datakällan är klonbar öppnas den efemära
  vägen, och då kan snittet flyttas närmare precedentens norm.
- `T85` våg 3 (staging-per-run-isolering) och `T87` (visual-grinden) är
  samdesignade med AT-Max per ADR-063:s S81-not och rörs inte här.

## Relaterat

- [ADR-063](ADR-063-airtable-bas-som-forstklassig-leverabel.md) — Airtable-basen
  som förstklassig leverabel; API-sviten är instrumentet för den
- [ADR-077](ADR-077-riskanpassad-ci-klassning-dedup-nightly.md) — risk-klassning,
  dedup och nattnätet som vakten hänger i
- [ADR-071](ADR-071-afk-batch-kontraktet.md) §2(iii) — tri-state-kravet som gör
  `ci-wait.sh` och `check-docs.sh` obytbara
- [ADR-056](ADR-056-list-paginerings-port-cursor-dubbel-kalla.md) —
  dubbel-källa-/swappbarhetsmönstret som portabilitetsgränsen speglar
- Research: [hermetisk kontra skarp](../research/hermetisk-vs-skarp-e2e-branschpraxis-2026-07-26.md) ·
  [tidsbudgeten](../research/staging-svitens-tidsbudget-2026-07-26.md) ·
  [parallell e2e](../research/parallell-e2e-mot-delad-backend-2026-07-26.md) ·
  [merge queue](../research/merge-queue-mot-staging-mutex-2026-07-26.md)
