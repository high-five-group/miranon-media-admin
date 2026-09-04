# ADR-063: Airtable-basen som förstklassig leverabel — maximering till 11/10, ej ersättning

- **Status:** Accepted
- **Datum:** 2026-06-25
- **Fas:** Projekt-grundande (gäller hela appen + dess datakälla; konsumeras av post-Fas-6-maximerings-milstolpen)
- **Relation:** Förfinar ADR-062 (korrigerar dess maximerings-princips premiss — se Öppen rivning nedan)

> **S81-not (2026-07-24, additiv — ursprungstexten orörd): samdesign-poster
> vid milstolpens dekomponering.** När maximerings-milstolpen dekomponeras
> (grillning → kort) ska två vilande trådar tas med i samma pass, båda med
> denna milstolpe som namngiven trigger: **T85 våg 3** (staging-per-run-
> isolering — mutexen avvecklas; samdesignas med basens datamodell-arbete)
> och **T87** (visual-grindens aktivering — trigger-kandidaten "UI-takten
> lugnar" sammanfaller naturligt med milstolpen). Motpekaren finns här för
> att trådarnas framåt-pekare inte ska vara enda bäraren (kontinuitet:
> dubbelriktad länkning; Marcus-fråga S81).
>
> **S91-not (2026-07-27, additiv — ursprungstexten orörd): vad valet kostar i
> testbarhet.** Marcus fråga: *"Vi tvingas att frångå branschledande
> mönster/config för att Airtable tvingar oss, är det rätt tolkat?"* Svaret är
> delvis ja, och kostnaden fanns belagd i tre research-pass men stod inte i detta
> ADR — den som läste beslutet fick inte veta vad det kostar. Noten stänger den
> luckan. Katalogiserad form med `v1-kompensation` + `Fas E-krav` per post:
> [`airtable-constraints.md`](../reference/airtable-constraints.md) **P26–P27**
> (och P4:s utvidgade manifestation).
>
> **Tre tvång som inte går att designa bort så länge Airtable är datakälla:**
>
> 1. **Per-körning-isolering är omöjlig.** Webb-API:t har exakt tre
>    bas-endpoints (`Create` / `List` / `Delete base`, samtliga 2022-11-15) och
>    ingen duplicerings-endpoint har någonsin skeppats. Två oberoende spärrar:
>    `Create base` kan inte skapa beräknade fälttyper (`formula`, `rollup`,
>    `multipleLookupValues`, `count`, `autoNumber`, `createdTime`, `button`), så
>    en API-klon vore strukturellt icke-ekvivalent med en rollup-tung bas · och
>    `Delete base` är *"available to enterprise users on request"*, så varje
>    körning skulle läcka en bas.
> 2. **5 anrop/sekund per bas är ett delat tak.** Det gäller alla samtidiga
>    klienter mot samma bas, så parallellisering av den Airtable-bundna delen är
>    verkningslös **även med perfekt isolering**.
> 3. **Efemär backend är otillgänglig.** Airtable är inte självhostbar. Branschen
>    köper determinism genom att duplicera backend per körning — Ghost, Supabase
>    och cal.com kan alla det gratis. Precedent för efemär backend mot
>    **icke-självhostbar SaaS** är genuint tom.
>
> **Konsekvensen, mätt:** staging-sviten delar en bas under en global mutex
> (`concurrency: staging-tests`, `queue: max`) och tar 9,25 min serialiserat.
> `playwright.config.ts` bär sex deterministiska kollisioner (TASK-6) som
> uppstår redan vid två samtidiga projekt. Den formen — delad muterbar
> testmiljö — är **lägst rankad i Googles SUT-ranking och HOLD-listad hos
> Thoughtworks**.
>
> **Vad som INTE är Airtables fel** (eget val, kan åtgärdas oberoende): den
> globala mutexens utformning · det delade ankaret `TEST_REGISTRATION_RECORD_ID`
> som muteras av tre tester · att `fullyParallel` inte är satt · att staging är
> **en** långlivad bas (ADR-050:s val, motiverat av prod-spegel-kravet).
>
> **Och en viktig avgränsning: den hermetiska utbrytningen är INTE en
> kompromiss — den ÄR branschmönstret.** Ghost kör 81 hermetiska
> acceptance-filer i eget jobb plus 82 skarpa i docker-stack med en 418-vakt;
> [ADR-080](ADR-080-acceptance-klassen-hermetisk-utbrytning.md) är byggd på den
> precedenten. Mätningen visar att **410 s av 555 s (74 %)** bärs av tester som
> redan mockar sina Edge Functions, medan **~145 s (2,4 min)** genuint behöver
> en verklig backend. Vi når alltså branschmönstret för merparten av sviten. Det
> vi inte kan nå är kompletteringen: branschen tar de sista 26 procenten med
> efemär backend, och den dörren är stängd av tvång 1 och 3.
>
> **Fas E-kopplingen — samtliga tre tvång upphävs av Supabase.** Postgres är
> självhostbar (docker i CI), klonbar och seedbar per körning, och har ingen
> per-bas-throttle. Supabase branching ger dessutom isolerade preview-miljöer per
> PR (ADR-050:s redan öppna dörr, *"kan adderas senare för PR-previews"*). Det
> gör **testbarheten till ett självständigt argument för Fas E** som inte stod
> skrivet någonstans före denna not. Argumentet ändrar INTE beslut 6: migrationen
> förblir ett separat senare spår och basen maxas som egen leverabel oavsett
> tajming. Det tillför en post till Fas E:s värde-sida, inte en deadline.
>
> **Detta är ett medvetet pris för ett medvetet val,** inte en olycka. Beslutets
> skäl (räcker för v1 · mall för Passionslyftet · avtäcker kraven) står
> oförändrade. Vad noten tillför är att priset nu är skrivet där beslutet bor.
>
> Belägg: [`parallell-e2e-mot-delad-backend-2026-07-26.md`](../research/parallell-e2e-mot-delad-backend-2026-07-26.md)
> §5 (spärrarna) · [`staging-svitens-tidsbudget-2026-07-26.md`](../research/staging-svitens-tidsbudget-2026-07-26.md)
> (fördelningen) · [`hermetisk-vs-skarp-e2e-branschpraxis-2026-07-26.md`](../research/hermetisk-vs-skarp-e2e-branschpraxis-2026-07-26.md)
> (rankningarna + Ghost-precedenten).
>
> **S103-not (2026-08-10, additiv — ursprungstexten orörd): Beslut 2:s
> räckvidd är DATA-defekter, inte GRAMMATIK.** Beslut 2 ("Resolution sker
> I BASEN") skrevs för avtäckta data-brister (saknade relationer,
> felaktiga aggregat) — det tar aldrig uttryckligen ställning till SPRÅKLIG
> komposition (ordval, preposition, ordföljd) av redan korrekt data som en
> egen underkategori. [`ADR-108`](ADR-108-presentationsmeningen-stannar-i-basen.md)
> gör den gränsen explicit: DATA/aggregering hör i basen (denna punkt
> orörd), UI-formatering av redan korrekt data hör i princip i appen — med
> ETT namngivet, motiverat undantag (Airtables Interface-sida som andra
> konsument) för just `Senaste interaktion (text)`-familjens meningar, och
> en explicit trigger för när undantaget ska omprövas. Ingen rivning av
> denna ADR — en skärpning av vad "resolution i basen" faktiskt omfattade.

## Kontext

ADR-062 (segment-yta) etablerade principen "beräkna från källan (Deltaganden), registrera projektionens brister" — kallad "route-around-but-register". Den principen bar en outtalad premiss: att Airtable-basen var ett provisorium på väg att ersättas av Supabase, och att man därför inte skulle lägga 11/10-hantverk på "det döende". Den premissen är FALSK och rivs här öppet.

Airtable-basen är inte en byggnadsställning. Den är en **förstklassig leverabel i egen rätt**, vald som datakälla med avsikt:

1. **Den räcker för väldigt många — definitivt för en v1.** Airtable är en fullgod datakälla för en stor klass av användare/produkter, inte en kompromiss man uthärdar tills "den riktiga databasen" byggs.
2. **Den blir mall + övningsprojekt i Passionslyftet.** Slutprodukten är dubbel: en 11/10-app OCH en 11/10-Airtable-bas som tjänar som referensimplementation och pedagogiskt övningsprojekt.
3. **Den är datakälla NU för att avtäcka kraven.** Hela anledningen att bygga mot Airtable just nu är att bygget genererar kunskapen om vad en svinbra app behöver av sin datakälla — "se vad vi behöver från den". Defekt-registret ÄR den kunskapen, gjord durabel.

## Beslut

1. **Airtable-basen ska maxas till 11/10 / branschledarmässig / totalt maxad — som leverabel, ej ersättas.** Att fullända basen är inte slöseri på en döende artefakt; det är att bygga själva artefakten vi vill leverera.
2. **Resolution sker I BASEN.** Avtäckta brister (Airtable-skatten) löses ut genom att städa, fixa och optimera Airtable-basen själv — inte lappa provisoriskt, inte "designa bort" i en efterträdare. Maxa källan.
3. **Defekt-registret är KRAVSPECEN för bas-maximeringen.** data-model.md §Kända fällor + T16 + app↔Airtable-interaktions-registret är inte en lista över problem att gå runt — de är den kravspec, samlad genom att faktiskt bygga mot basen, som bas-maximeringen exekverar mot. "Register" är ett committat åtagande att lösa, inte en deferra-och-glöm-lista.
4. **App-sidans "beräkna från källan" (ADR-062 Beslut 2) står — dess motivering omframas.** Att appen läser källan-av-sanning (Deltaganden) i stället för en lossy projektion (rollupsen) är inte "att gå runt en brist man accepterar". Det är leverans + korrekthet NU, medan basen ännu inte är maxad — och precis vad branschledarna gör (beräkna från händelse-källan, lita aldrig på handunderhållna kumulativa flaggor). Alltså 11/10, ej kompromiss. Korrektheten överlever oavsett basens maximerings-tillstånd.
5. **Post-Fas-6-maximerings-milstolpe (namngiven, committad):** efter Fas 6 — (a) audita att ALLA app↔Airtable-interaktioner är registrerade KORREKT, (b) audita att HELA Airtable-skatten är registrerad KORREKT, (c) lösa ut allt: städa, fixa, optimera Airtable-basen till 11/10 / branschledarmässig / mall-redo. Inte en god intention — en milstolpe i roadmapen (byggplan.md) med ägare och kvitto.
6. **Supabase-migration är ett separat SENARE spår, INTE en ersättning av Airtable.** Airtable-basen lever vidare som referensimplementation/mall i Passionslyftet. Supabase-målmodell-researchen (06b) är inte "destinationen som ersätter Airtable" — ett senare separat spår. Migrations-tajming styr INTE bas-maximeringen; basen maxas som egen leverabel oavsett.

## Öppen rivning (kvitto, ej tyst radering)

ADR-062:s "route-around-but-register"-formulering + dess Migrationsväg-/Konsekvenser-framing bar premissen "Airtable dödsdömd → guldplätera inte det döende → resolution = designa bort i efterträdaren". **Den premissen stryks.** Korrekt: resolution = maxa basen som leverabel; registret = kravspec; route-around-nu = appen läser sanningen medan basen inte är maxad.

Premissen var Chats (Claude), införd i ADR-062:s författning utan förankring i Marcus intent — Marcus korrigerade den i Session 34-dialogen. Noteras explicit så framtida-vi ser VARFÖR ADR-062:s princip förfinades: en Chat-felpremiss, inte ett skifte i projektets riktning. ADR-062:s sak-beslut (1–7) står oförändrade; endast den Airtable-status-bärande framingen korrigeras.

## Konsekvenser

**Positiva:** projektets dubbla leverabel (11/10-app + 11/10-Airtable-bas-mall) är durabelt och kanoniskt; "route-around" missförstås ej längre som undvikande; defekt-registret har ett committat resolutions-hem (post-Fas-6-milstolpen); Airtable-arbete är ej längre felkategoriserat som "slöseri på det döende".

**Negativa / skuld:** bas-maximeringen är reellt arbete som tillkommer roadmapen (post-Fas-6); maximerings-estimatet är osatt (sätts vid milstolpens dekomponering); registret måste hållas KORREKT + KOMPLETT för att vara pålitlig kravspec (auditen i milstolpen säkrar det).

**Blast-radius-not (kvarstår oavsett framing):** Airtable-basen är delad prod (Psionautics gäst) och bär automationer A1–A11. Bas-maximeringen sker med samma försiktighet — eget pass med egen verifiering, ej sidoeffekt.

## Relaterat

- ADR-062 (segment-yta) — sak-besluten står; maximerings-principens framing förfinas av detta ADR (pekar-erratum infällt där).
- byggplan §4 — post-Fas-6-maximerings-milstolpe införs (Session 34 Landning 2).
- data-model.md §Kända fällor + T16 — omframas som kravspec (Session 34 Landning 4).
- L192 — omformuleras: register = committad förbättring (Session 34 Landning 5).
- Passionslyftet — Airtable-basen som mall + övningsprojekt (kontext-lagret, Session 34 Landning 3).

## Updates

### 2026-08-14 — Kontinuerlig bas-maxning; milstolpen omdefinierad till slutgenomlysning (Marcus GO)

Marcus beslut, verbatim: *"Vi ska INTE vänta på basmaximeringen, vi ska maxa
basen kontinuerligt. Åtgärda det som behöver åtgärdas på proffsigast möjliga
sätt. Basmaximeringen är när vi dedikerat tittar EN GÅNG TILL på basen för att
hitta ytterligare förbättringspotential."*

**Öppen rivning, inte tyst — vad som stryks.** Beslut 5(c) ("lösa ut allt:
städa, fixa, optimera Airtable-basen … efter Fas 6") och Konsekvenser-radens
formulering *"defekt-registret har ett committat resolutions-hem
(post-Fas-6-milstolpen)"* bar premissen att resolution av avtäckta defekter
och förbättringspotential VÄNTAR på milstolpen. Den premissen stryks. Den var
aldrig Marcus intent framåt — bara hur milstolpen ursprungligen skrevs
(Session 34), innan kontinuerlig-drift-beslutet fanns.

**Vad som gäller i stället.** Avtäckta defekter och förbättringspotential i
basen (Airtable-skatten, defekt-registret) åtgärdas KONTINUERLIGT, i takt med
att de avtäcks — de samlas inte och väntas inte ut. Varje sådan åtgärd sker
enligt Beslut 2 (I BASEN, aldrig lappa i appen, aldrig designa bort) och
enligt Blast-radius-noten: eget kontrollerat pass, egen verifiering per
ändring — basen är delad prod (Psionautics gäst) med automationerna A1–A11,
och den försiktigheten gäller lika mycket för en enskild kontinuerlig fix som
för milstolpen.

**Milstolpen omdefinieras — den är kvar, men är inte längre
resolutions-hemmet.** Den blir en dedikerad SLUTGENOMLYSNING: en gång till,
dedikerat, för att hitta ytterligare förbättringspotential UTÖVER vad det
kontinuerliga arbetet redan fångat. Beslut 5(a) och 5(b) — audit att ALLA
app↔Airtable-interaktioner respektive HELA Airtable-skatten är registrerade
KORREKT — står KVAR som milstolpens innehåll, oförändrade: en audit av
registrens korrekthet hör rimligen till en dedikerad slutgenomgång, inte till
löpande drift.

**Orört (bekräftat explicit, inte bara underförstått):**

- Beslut 1 — basen maxas som leverabel, ej ersätts.
- Beslut 2 — resolution sker I BASEN, ej lappa, ej designa bort. Detta är
  SKÄLET till att kontinuerlig maxning fungerar utan att bli lapptäcke: varje
  fix går i basen, aldrig runt den.
- Beslut 3 — defekt-registret förblir KRAVSPECEN, ett committat åtagande —
  nu ett löpande sådant i stället för ett som väntar på en framtida dag.
- Beslut 4 — app-sidans "beräkna från källan" (Deltaganden, ej rollups) står.
- Beslut 6 — Supabase-migrationen är fortsatt ett separat SENARE spår, inte
  en ersättning; migrations-tajming styr fortsatt INTE bas-maximeringen.

**Landning i samma svep:** `docs/byggplan.md` §4-milstolpe-blocket (Mål +
Scope-punkt (c)) och `CLAUDE.md` § "Vad är detta projekt?" amenderade för att
spegla samma omdefiniering.

### 2026-08-30 — Öppen rivning av Beslut 2 och 6 FÖR BETALNINGSDOMÄNEN: pengarna flyttar till Postgres, basen bär en app-skriven spegel (S113 Del 11)

Grillningen om Lottas betalningsflöde (S113 Del 11, tretton kvitterade
beslut) flyttar inbetalningar, kvittoledger och jobbtabeller ut ur
Airtable till Supabase Postgres. Lagringsvalet och datamodellen bor i
[`ADR-128`](ADR-128-inbetalningen-som-sanning-postgres-och-spegeln.md);
denna post bär **rivningen**, i samma form som posten 2026-08-14 ovan.

Marcus beslut, verbatim (Del 11, Postgres-beslutet 11/13): *"Om Airtable
är flaskhalsen för något så här viktigt så funderar jag skarpt på om vi
ska migrera det som måste migreras för just detta redan nu till Supabase
… jag vill inte att vi ger Lotta något 'Halvbra'."*

**Detta är en RIVNING, inte ett undantag — och skillnaden är avsiktlig.**
[`ADR-110`](ADR-110-aktivitetsloggens-lagring-supabase-inte-airtable.md)
kunde kalla sitt fall en *"medveten, avgränsad ADR-063-avvikelse"* därför
att `activity_log` — dess egna ord — *"har ALDRIG legat i Airtable … och
detta beslut flyttar ingenting UT ur basen"*. Kvittoledgern LIGGER i
basen (`ADR-109` beslut 5, tabellen `Kvitton`, staging
`tblk8fZcArXPpRYnX`) och flyttas ut. Att låna `ADR-110`:s ord hade varit
att kalla en flytt för en nyetablering. Rättelsen kommer ur den
adversariella granskningen
([`verifiering-kvittoskivning-afk-natt-2026-08-30.md`](../research/verifiering-kvittoskivning-afk-natt-2026-08-30.md)
§ 4), som fällde ordvalet innan ADR-128 skrevs.

**Vad som rivs, avgränsat till betalningsdomänen.**

- **Beslut 2 (*"Resolution sker I BASEN"*)** gäller inte längre för
  pengarna. Airtables strukturella väggar för denna domän — P1 (ingen
  unique-constraint på ett skrivbart fält), P2 (inga transaktioner) och
  P3 (server-side idempotens strukturellt omöjlig),
  [`airtable-constraints.md`](../reference/airtable-constraints.md) §A —
  är inte defekter som kan lösas I basen. De är plattformens form. En
  bokföringsserie som kräver atomär numrering och en unik nyckel kan
  därför inte maxas fram; `ADR-109` beslut 2 byggde ett helt
  kompensationsprotokoll just för att komma runt dem.
- **Beslut 6 (*"Supabase-migration är ett separat SENARE spår, INTE en
  ersättning"*)** gäller inte längre för betalningsdomänen. Den flyttar
  NU. Marcus egen avgränsning står i citatet ovan: *det som måste
  migreras för just detta*.

**Vad som INTE rivs — och det är det mesta.**

- **Beslut 1 står oförändrat.** Basen är fortsatt en förstklassig
  leverabel som maxas kontinuerligt, och den är fortsatt sanning för
  **anmälan, event och priser**. `ADR-128` beslut 5 säger det
  uttryckligen och bygger på det: basen får nya numeriska prisfält
  BREDVID fritexten (som aldrig byter typ, eftersom bilagemallarna läser
  den) och en `Saknas (kr)`-formel.
- **Beslut 2 står för allt annat än pengarna.** Avtäckta databrister i
  anmälnings-, event- och persondomänerna löses fortsatt I basen,
  kontinuerligt, enligt posten 2026-08-14.
- **Beslut 3 står:** defekt-registret är fortsatt KRAVSPECEN.
- **Beslut 4 står:** app-sidans "beräkna från källan" är oförändrad — och
  härledningen av betalningsfacken ur inbetalningarna
  (`ADR-128` beslut 2) är faktiskt samma princip tillämpad på pengar:
  räkna ur händelserna, lita aldrig på en handunderhållen kumulativ
  flagga.
- **Beslut 5 står:** slutgenomlysningen är kvar som milstolpe.
- **Beslut 6 står för allt annat.** Detta är EN domän som flyttar, på ett
  namngivet skäl. Det är inte startskottet för Fas E, och det ger ingen
  framtida domän rätt att flytta utan sitt eget beslut.

**Basen blir INTE fattigare — den får en spegel.** Appen skriver de två
valfälten, `Summa inbetalt (kr)` (ett talfält, inte en rollup — raderna
som skulle summeras ligger i en annan databas) och kvittonumret på
`Anmälningar`, så att Lottas vyer, formulär, automation A7 och rollups
fungerar orörda (`ADR-128` beslut 5). Att basen förblir användbar för sin
ägare är alltså ett konstruktionsvillkor i flytten, inte en förhoppning.
Blast-radius-noten ovan gäller oförändrat: spegelfälten är additiva, och
prod-ändringarna är Marcus-moment per tabell.

**Vad detta kostar, öppet.** Sanningen blir tvålagrig — anmälan i basen,
pengarna i Postgres — med en spegelskrivning som kan fallera (omförsök,
eftersläpning synlig i appen) och en konsistensvakt som larmar på
inbetalningar vars anmälan försvunnit. Priset är redovisat i `ADR-128`
§ Konsekvenser och bokförs här för att den som läser ADR-063 ensam ska se
det.
