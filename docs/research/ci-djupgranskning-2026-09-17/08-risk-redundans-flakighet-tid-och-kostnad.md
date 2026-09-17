---
owner: marcus803
updated: 2026-09-17
review_by: 2026-12-17
status: draft
---

# Leverabel 9 av 12 — Risk, redundans, flakighet, tid och kostnad

> **Proveniens.** Skriven 2026-09-17 av analysagenten för jobb 9 i
> CI-djupgranskningen (Session 126). Modell: Opus 5 (1M kontext) — medveten
> avvikelse från repots tier-policy, bokförd i uppdraget, eftersom detta är
> granskningens sammanvägande led. Ögonblicksbild: `origin/main` på
> `eeca8c72` (2026-09-08), worktreen `s126-ci-djupgranskning`. Filen är en
> SYNTES av fjorton agentpass och orkestrerarens arton stickprov, inte en
> sammanfogning av dem: varje bärande tal är spårat till sin källa, och där
> jag mätt om något själv står det utskrivet med kommando och datum. Alla
> `gh`-anrop var läsande. Ingen kod, inget test och ingen GitHub-resurs
> ändrades.

## Kort svar

**Domen: en välmotiverad kvalitetsplattform med fel proportioner.** Varje
enskild del byggdes som svar på ett verkligt fel — men summan har aldrig
prövats, och den är i dag tyngst där den skyddar minst. Maskinen är inte
självmotiverande i sin AVSIKT. Den har blivit det i sin FÖRDELNING.

Tre tal bär domen. En kodändring väntar **cirka 25 minuter** ren maskintid
innan den landar (två körningar à 12,5 minuter i sekvens), och **94–98
procent** av den väntan är ETT jobb — ett test som kontrollerar att de andra
testerna är ärliga. Pengarna är noll: repot är publikt, och GitHub
fakturerade **0 kronor** för augusti månads 76 080 körda minuter. Samtidigt
har det skyddsnät som gör hela konstruktionen försvarbar — nattkörningen —
varit **rött 51 av 52 nätter** sedan 2026-07-28.

### De tre största riskerna

1. **Sextio kodändringar på fyra veckor prövades aldrig mot verkligheten
   efter att de landat** (rättat efter orkestrerarens stickprov S30/KG1 —
   tidigare stod "femtiofem", ett tal ur en annan uppdelning av samma
   underlag). Merge-kön lägger flera ändringar i samma leverans till
   huvudgrenen, men efterkontrollen tittar bara på den översta. Är den
   översta en textändring OCH spannet under bär kod hoppas kontrollen över,
   och koden får aldrig staging-sviten, a11y-scanningen eller städningen —
   de enda proven som körs mot en riktig databas och en riktig inloggning.
   (De hermetiska testklasserna körde ändå, via `CI [push]` som klassar hela
   det pushade spannet.) Mätt: 85 av 686 landningar saknar en egen
   efterkontroll-körning, varav 60 är de verkliga hålen. Det är precis den
   felklass uppdraget kallar farligast — grönt trots att ett relevant test
   aldrig kördes — och den sitter EFTER merge, inte före. Diagnosen fanns
   redan nedskriven i tråden `T166` (2026-08-21, pausad) innan denna
   granskning; `TASK-365` (High, To Do) bär en annan, delvis falsifierad
   rotorsak för samma symptom, och de två pekade inte på varandra.
2. **Ingenting vakar över att koden faktiskt når Lotta.** Hela apparaten
   bevakar vägen fram till huvudgrenen. Att huvudgrenen sedan blir den app
   Lotta öppnar är obevakat: prod-frontenden stod gammal i minst tjugo
   timmar utan att någon mekanism märkte det, och en människa upptäckte det.
   Kortet är fortfarande öppet.
3. **Appen kan inte skapa event med startdatum i januari 2027, och ingen
   larmar.** En lista i databasen ("Månad/år") tar slut vid december 2026 —
   live-mätt mot prod 2026-09-17: fjorton val, november 2025 till december
   2026. Det är känt sedan 2026-07-24, dokumenterat, och helt olöst. Till
   skillnad från de andra riskerna är denna SÄKER att inträffa — men felet
   utlöses av eventets STARTDATUM, inte av dagens datum, så det kan bita
   första gången någon planerar ett event i januari 2027, vilket kan vara i
   dag (rättat efter orkestrerarens stickprov S26 — inte "om drygt tre
   månader").

### De tre tydligaste överflöden

1. **Samma tester körs upp till fyra gånger på identisk kod per ENSAM
   landning.** En gång på ändringsförslaget, en gång i kön, en gång vid
   landningen på huvudgrenen, och en gång i efterkontrollen. Bara den sista
   tillför något nytt, och körningen vid landningen tillför bevisligen
   ingenting alls — **för en ensam landning.** Preciserat efter
   orkestrerarens stickprov S30 (KG1): vid en GRUPPLANDNING är den körningen
   inte overksam, eftersom den klassar och kör mot hela det pushade spannet.
2. **Det dyraste jobbet är känt, kortat med hög prioritet — och taket
   höjdes i stället för att orsaken åtgärdades.** Självtestet kör alla 524
   tester i EN process, medan den vanliga testklassen kör samma 524 tester
   uppdelat på TRE parallella processer. Därför tar självtestet 13,7 minuter
   medan den vanliga klassen tar 5,5. `TASK-366` (hög prioritet) skapades
   2026-09-02 samma dag som fyra avbrott, och `ci-suite.yml:526-535` bokför
   att taket i stället höjdes 12→20 minuter dagen efter (2026-09-03) — femton
   dagar senare är kortet fortfarande To Do (rättat efter orkestrerarens
   stickprov S25 — inte "av misstag").
3. **Städkontroller för repots egen bokföring delar larm med produktens
   tester.** Nattkörningens rödhet kommer i praktiken helt från tre
   pappersgrindar — inte från appen. När ett verkligt testfel väl kom, natten
   till 2026-09-17, landade det i ett larm som redan tystnat för sju veckor
   sedan. En av de tre grindarna är dessutom redan beslutad att rivas.

## Vad jag läste först

Enligt agentkontraktet inventerade jag befintlig kunskap före första egna
mätning. Detta pass bygger uteslutande på granskningens eget material plus
egna kontrollmätningar — jag har inte öppnat `docs/research/`s äldre pass i
fulltext, eftersom de sju underlagen redan läst dem och citerar dem med
åldersbedömning.

| Källa | Vad den avgjort | Vad jag gör med den |
|---|---|---|
| `underlag/00-agentkontrakt.md` | Metodkontraktet, märkningsreglerna, våg 2-tilläggen | Följer det; läste det först, i sin helhet |
| `underlag/01-orkestrerarens-stickprov.md` | Arton egna mätningar; loggens version går före agenternas filer | Styrande. Där en post säger **föll** eller **skärpt** är det loggens tal jag bär vidare |
| `underlag/j8-1` | Fjorton produktionsfel, täckningsmatrisen | Grund för 8.1 och Del 4 fråga 1 |
| `07-hermetiska-tester-kontra-realistisk-e2e.md` (färdig leverabel) | Testpyramiden i tal, 2 av 34 e2e-filer verkligt realistiska, dubblettlistan | Sammanfattar och pekar — skriver inte om |
| `underlag/j8-4` | Staging, purgen, täckningsluckan, larmkedjan | Grund för 8.4 |
| `underlag/j8-5` | Grindlogiken, 46 hotscenarier, dedupen | Grund för 8.5 och Del 4 fråga 3 |
| `underlag/j8-6` | Flakighet, omkörningar, tid till förstådd orsak | Grund för 8.6 och Del 4 fråga 4 |
| `underlag/j8-7` | Väntetid, kritisk väg, kostnad | Grund för 8.7. **Dess huvudpåstående prövade jag om själv** (§ Metod) |
| `underlag/j8-8` | Underhåll, ändringstakt, tvärrepo | Grund för 8.8 och Del 5 |
| `underlag/j1a`, `j1b`, `j1c`, `j1d`, `j1f` | Jobb, workflows, skript, hookar, konfiguration | Stöd; jobblistorna i Del 4 fråga 1 kommer härifrån |
| `03-andringslogg.md`, `06-airtable-…md` | Ändringstakt och korrigeringskedjor; hur mycket av komplexiteten Airtable orsakar | Stöd för Del 5 |

**En rättelse av mitt eget uppdrag, prövad mot disk.** Uppdraget uppger att
jobb 8 bär "51 numrerade frågor". Det är **53**. Mätt 2026-09-17:
`awk 'NR>=296 && NR<=382' tasks/sessions/bilagor/s126-uppdrag/uppdraget-verbatim.md | grep -c "^- "`
ger `53`, fördelat 5 · 6 · 6 · 9 · 7 · 7 · 6 · 7. Alla 53 besvaras i Del 1.

## Metod

Jag gjorde fem saker utöver att läsa underlagen.

1. **Prövade J8.7:s huvudpåstående om den kritiska vägen själv**, eftersom
   uppdraget uttryckligen bad om det och orkestreraren inte hade stickprovat
   det. `gh run view <id> --json jobs` mot tre verkliga körningar
   (`34265004584`, `34248030069`, `34249685743`), utfallet analyserat med ett
   eget Node-skript i scratch-området. Utfall och tabell i 8.7 fråga 2.
2. **Mätte varför det dyraste jobbet är dyrast** — en fråga inget underlag
   ställde. Läste `scripts/hermetik-sjalvtest.mjs` rad 60–110,
   `ci-suite.yml:516–592` och `playwright.config.ts:240`.
3. **Stängde en öppen osäkerhet i J8.1** genom att läsa villkoret själv:
   `sed -n '2278,2292p' .github/workflows/ci.yml`.
4. **Räknade dokumentationsgrindarnas fördelning** mellan det alltid-på
   `lint`-jobbet och det villkorade `docs`-jobbet —
   `grep -n "^run_gate" scripts/check-docs.sh` och `sed -n '236,260p'` på
   samma fil. Ingen av de sju underlagen gör den uppdelningen, och den ändrar
   svaret på två av uppdragets frågor.
5. **Verifierade de tal ur J1c och J8.8 som bär min redundansdom:**
   `ls scripts/check-*.sh | wc -l` (20), `ls scripts/test-* | wc -l` (75),
   `find scripts -type f | wc -l` (186), `find scripts -name "check-*" -type f | wc -l` (24).

Jag körde INTE `npm run check:docs` (kontraktets förbud) och startade ingen
egen testserie — `metrics:flake` och `metrics:ci` är redan körda av J8.6 och
J8.7 samma dag, och en andra serie hade dubblerat data på en delad maskin.

**Tre premisser i uppdragets frågor har fallit, och svaren nedan säger det
rakt** i stället för att besvara en fråga som inte längre gäller:

| Premiss i uppdraget | Vad som gäller | Belägg |
|---|---|---|
| "Körs testet på varje PR…" (8.4, rad 340) | Staging-sviten kör **aldrig** före merge. `ci.yml` skickar `run_staging: false` villkorslöst | S1; `ci.yml:2271–2272`; egen mätning: skippad i 3 av 3 körningar |
| 8.7:s kostnadsfrågor förutsätter en räkning | Repot är **publikt** — minuterna är gratis. Kostnaden är väntetid, samtidighet och uppmärksamhet | S14; `gh api organizations/high-five-group/settings/billing/usage` |
| Den kritiska vägen antas vara staging | Den är ett **självtest av testramverket** | J8.7 § 3, **omprövad av mig i 3 av 3 körningar** |

## Del 1 — Fråga för fråga

Uppdragets 53 frågor, ordagrant, med kort svar, märkning och källa. Märkningen
följer kontraktet: **verifierad** (mekanismen sedd eller beteendet mätt),
**starkt indikerad** (flera oberoende spår), **osäker** (tunna eller
motsägande spår), **ej verifierbar** (åtkomst saknas).

### 8.1 Syfte och risk

| # | Fråga (ordagrant) | Kort svar | Märkning | Källa |
|---|---|---|---|---|
| 1 | Vilka verkliga fel har tidigare nått produktion? | Minst fjorton sedan maj 2026. Sju av dem hittades av Marcus när han använde appen, inte av något test. Fyra var inte appfel utan fel i CI eller hos en leverantör. | verifierad (10 av 14), starkt indikerad (4) | `j8-1` § Delfråga 1 |
| 2 | Vilka av testerna fångar sådana fel? | Bara ETT jobb har belagd, upprepad fångst: beroendegranskningen. Slutgrinden har en belagd fångst av sitt eget tidigare hål. Acceptance-klassen fick nya tester EFTER incident 8 och 9 — den lärde sig av skadan, den förutsåg den inte. | verifierad | `j8-1` § Delfråga 2 |
| 3 | Vilka kontroller finns bara för att de "känns bra att ha"? | Exakt en saknar egen incident och medger det själv: arkitektur-fitness-auditen (ADR-058), som inte är en CI-grind. De fjorton dokumentationsgrindarna har egna incidenter men skyddar aldrig produkten. | verifierad | `j8-1` § Delfråga 3 |
| 4 | Vilka fel är så allvarliga att de måste blockera en merge? | Fem: lint och typkontroll, beroendegranskningen, den hermetiska acceptansklassen med sitt tvåsidiga bevis, slutgrinden, och review-backstoppen. | starkt indikerad (bedömning på verifierat underlag) | `j8-1` § Delfråga 4 |
| 5 | Vilka fel kan i stället vara varningar? | Staging och tillgänglighet är redan flyttade till efter merge — rätt placering. Beroendevarningar av graden "moderate" granskas redan bara på natten. **Nytt här:** tio av fjorton dokumentationsgrindar kör på VARJE kodändring, även en som inte rör ett enda dokument. | verifierad (egen mätning, se 8.7 fråga 6) | `j8-1` § Delfråga 5 + egen mätning |

**Avsnittets viktigaste fynd.** Täckningsmatrisen är obehagligt tunn åt ena
hållet. Av fjorton produktionsfel har **ett** (malware-paketet) stoppats
proaktivt av en automatisk kontroll. Två till (den röda PR:en som mergades,
den mutex-blockerade reverten) var fel i CI-arkitekturen själv, och båda är
lagade. Resterande elva delas mellan "ingen kontroll kunde ha sett detta i
förväg" (arkitektoniska tillståndsval, designval som aldrig prövats mot en
användare) och "en kontroll finns i dag, men den skrevs efter felet".

Det är inte ett underkännande — att skriva ett test efter en bugg är normal,
sund praxis. Men det betyder att den vanliga motiveringen för en tung
presubmit ("den fångar fel innan de når användaren") bärs empiriskt av EN
kontroll i detta repo, och den kontrollen tar trettio sekunder.

**En incidentklass som ingen kontroll täcker, och som har ett datum:** fälla
45, månad/år-gränsen. Airtable-basens fält "Månad/år" är en fast lista som
tar slut vid `2026-12`. Serverfunktionen `create-event` svarar med ett
tekniskt fel när listan inte räcker. Känt och dokumenterat sedan 2026-07-24,
olöst 2026-09-17, och ingen mekanism varnar när datumet närmar sig.

### 8.2 Testnivåerna

| # | Fråga (ordagrant) | Kort svar | Märkning | Källa |
|---|---|---|---|---|
| 1 | Vad testar Pure + Build som inte redan testas av lint och TypeScript? | Att koden ger rätt SVAR, inte bara rätt form. 1 786 tester kör faktisk logik — bankfilsparsning, retry-intervall, summa-härledning. TypeScript kan se att en funktion returnerar ett tal, aldrig att talet är fel. | verifierad | `07` § 8.2 |
| 2 | Vad täcker de hermetiska acceptanstesterna? | 524 tester i 61 filer: att appen renderar och beter sig rätt GIVET ett svar av en viss form. Uttryckligen inte att den formen är sann. | verifierad (`playwright --list`, J7) | `07` § Testpyramiden |
| 3 | Vad täcker staging-E2E som de hermetiska testerna inte kan täcka? | I teorin: att hela kedjan hänger ihop — riktig webbläsare, riktig inloggning, riktig serverfunktion, riktig databas. I praktiken levererar **2 av 34 filer** det fullt ut. | verifierad | `07` § Vilka verkliga kedjor |
| 4 | Finns samma användarflöde testat flera gånger på olika nivåer? | Ja. En medveten, dokumenterad tvådelning (`mark-paid`) och minst en ÄKTA dubblering (bekräftelsemailet, samma `describe`-namn på två nivåer, ingen av dem når en riktig mailtjänst). | verifierad | `07` § Testas samma beteende redundant |
| 5 | Är gränsen tydlig mellan enhetstest, integrationstest, acceptanstest och E2E? | Nej. Elva tester låg i fel klass tills en maskin fällde dem; kontraktsvakten passar inte i fyrdelningen alls och är en femte kategori. Filändelsen `.staging.test.ts` lovar dessutom mer än 32 av 34 filer håller. | verifierad | `07` § 8.2 |
| 6 | Vilken unik information ger varje testnivå? | Sju nivåer, sju distinkta svar — se tabellen i Del 4 fråga 2. Två av dem (visuell regression, delar av e2e) ger i dag ingen information alls, eftersom de inte körs automatiskt respektive är mockade. | verifierad | `07` § Vilken unik information |

**Avsnittets viktigaste fynd.** Nivåerna är i princip rätt tänkta och i
praktiken glidande. Den skarpaste enskilda siffran i hela granskningen sitter
här: katalogen `tests/e2e/` bär 34 filer, men bara **två** gör ett verkligt,
webbläsardrivet anrop mot en riktig serverfunktion utan att mocka det. Fem
filer mockar ingenting men rör heller aldrig en serverfunktion. De övriga 27
mockar mellan 3 och 33 av sina egna nätverksanrop — en av dem 33 stycken,
alltså mer mockat nätverk än någon hermetisk fil behöver ha, i en klass vars
hela existensberättigande är att vara den oskarvade motparten.

Följden är en trovärdighetssignal som inte bärs av innehållet. En läsare
som ser `tests/e2e/*.staging.test.ts` antar rimligen att filen prövar riktig
staging. För 32 av 34 filer är det antagandet helt eller delvis fel.

### 8.3 Den hermetiska miljön

| # | Fråga (ordagrant) | Kort svar | Märkning | Källa |
|---|---|---|---|---|
| 1 | Är den verkligen isolerad från externa tjänster? | Mekaniskt ja — en vakt kastar fel vid varje anrop utanför `localhost`, och den avbryter i stället för att tiga. Men isolerad från TJÄNSTER är inte isolerad från VERKLIGHETEN: väggklockan läckte in och fällde ett test skarpt 2026-09-17. | verifierad (testet kördes live) | `07` § 8.3 punkt 1 |
| 2 | Startar varje test med ett känt dataläge? | Ja. Mockarna är test-scopade, ingen delad state mellan tester, och den globala uppstarten rör bara en mätartefakt. | verifierad | `07` § 8.3 |
| 3 | Kan testerna köras i valfri ordning? | Sannolikt ja — ingen serialisering hittades i katalogen. Men detta är en kodläsning, inte ett körd experiment med slumpad ordning. | osäker | `07` § 8.3 |
| 4 | Kan flera tester köras parallellt utan att påverka varandra? | Ja, klassen delas i tre parallella delar på filgränser. Delningstalet 3 räknades fram vid 461 tester; klassen bär nu 524 och marginalen är inte omprövad. | verifierad (mekanism), osäker (marginalen) | `07` § 8.3 |
| 5 | Används mocks, emulatorer eller tillfälliga databaser? | Enbart mocks. Ingen emulator, ingen tillfällig databas. Inloggningen ersätts av en handskriven biljett direkt i webbläsarens lagring — vilket är just det som gjorde klock-läckan möjlig. | verifierad | `07` § 8.3 |
| 6 | Hur vet vi att simuleringen fortfarande motsvarar de riktiga tjänsterna? | **För 7 av 18, mekaniskt. För de övriga 11 vet vi inte.** Och den nattliga kontraktsvakten fångar bara att ett fälts FORM ändrats — aldrig att dess BETYDELSE ändrats. | verifierad | S10; `07` § 8.3 |

**Avsnittets viktigaste fynd.** Uppdraget kallar fråga 6 särskilt viktig, och
den har det sämsta svaret i hela avsnittet. Den hermetiska världen härmar
arton serverfunktioner. Mekanismen som ska bevisa att härmningen fortfarande
liknar verkligheten jämför sju av dem. Elva är obundna:
`get-activity-log`, `get-attendance`, `get-event-attachments`, `get-leads`,
`get-mail-log`, `get-person-notes`, `get-places`, `get-segments`,
`get-waitlist`, `hamta-oppna-betalningar` och `log-activity`.

Det som gör fyndet skarpt är inte luckan utan att **filen påstår motsatsen**.
`tests/kontraktsvakt/kontraktsfall.ts:25-26` säger ordagrant *"ALLA SJU
FIXTURHANDLERS BEVAKAS"*. Påståendet var sant när det skrevs och blev falskt
när mock-lagret växte från sju till arton. Ingen grind läser prosa i en
testfil, så ingenting fångade det.

Och det tvåsidiga beviset — det jobb som kostar mest av allt — bevisar en
annan sak än många tror. Det bevisar att acceptance-testerna FAKTISKT hänger
på mockarna (att de inte är tomma). Det bevisar aldrig att mockarna liknar
verkligheten. De två frågorna förväxlas lätt, och bara den första är
mekaniserad.

### 8.4 Staging och E2E

| # | Fråga (ordagrant) | Kort svar | Märkning | Källa |
|---|---|---|---|---|
| 1 | Kör stagingtesterna mot en miljö som delas mellan flera PR:er? | Ja — en enda databas och ett enda serverprojekt, delat av efterkontrollen, nattkörningen, lokala körningar och sedan 2026-09-06 även Lottas demoläge. | verifierad | `j8-4` § 8.4.1 |
| 2 | Kan två körningar förstöra data för varandra? | Ja, och det har hänt **tre gånger**, senast 2026-09-07. En avbruten körning lämnar ett fältvärde kvar på en delad rad, och en helt annan testfil faller sedan deterministiskt tills en människa nollställer fältet för hand. | verifierad | `j8-4` § 8.4.2; `L599` |
| 3 | Vad gör `Staging sentinel purge` exakt? | Fyra mekanismer under ett namn: städning före körningen (åldersbaserad), städning efter (manifestbaserad), lagrings- och databas-targets, plus en luckdetektion som fäller på rader ingen gör anspråk på. Fyra hårda skyddsräcken, prod hårt blockerad. | verifierad (1 142 rader lästa) | `j8-4` § 8.4.3 |
| 4 | Varför krävs rensningen före testet? | För att en städning EFTER inte körs om processen kraschar, medan en städning FÖRE alltid körs nästa gång. Efter-städningen tillkom senare för ett annat fönster: 151 kvarliggande testevent syntes som kommande event i Lottas eventväljare. | verifierad | `j8-4` § 8.4.4 |
| 5 | Vad händer om rensningen misslyckas halvvägs? | Den fortsätter. Varje mål körs i eget felskydd, allt som gick att städa städas, och jobbet fäller först i slutet. Kapplöpning mot en annan städning hanteras, inte bara upptäcks. | verifierad | `j8-4` § 8.4.5 |
| 6 | Testas riktig autentisering, databas och externa API:er? | Ja på inloggning, databas och Airtable. Delvis på mail (riktig tjänst, hård adresslista) och PDF (riktig tjänst, leverantörens testläge). Nej på frontend-artefakten. | verifierad | `j8-4` § Paritetstabellen |
| 7 | Används riktiga tjänster i testläge eller ersättningar? | Riktiga tjänster genomgående, aldrig ersättningar — men två av dem i leverantörens eget testläge, och frontend körs som utvecklingsserver, inte som det bygge Vercel levererar till Lotta. | verifierad | `j8-4` § Paritetstabellen |
| 8 | Är staging tillräckligt lik produktion för att testet ska betyda något? | I schemat ja (mätt för fem veckor sedan, ej omkört). Två mätta gap sänker paritetsgraden: serverfunktionerna på staging deployas **för hand** och kan avvika tyst från den commit som testas, och frontend är utvecklingsbygget. | starkt indikerad | `j8-4` § 8.4.8 |
| 9 | Körs testet på varje PR för att det behövs eller bara för att det råkar vara möjligt? | **Premissen har fallit — det körs inte på någon PR alls.** Frågan är i stället om "bara efter landning" är rätt, och svaret är: rätt för väggklockan, men den vilar på en larmkedja som mätt brast i elva dygn. | verifierad | S1; `j8-4` § 8.4.9 |

**Avsnittets viktigaste fynd.** Städrutinen är inte problemet — den är
välbyggd, idempotent och fail-closed. Problemet är en kollisionsklass den
aldrig designades för att se. Purgen känner till HELA RADER: den letar upp
rader med ett visst namnmönster och raderar dem. Men ett test muterar ett
FÄLT på en permanent rad som aldrig ska raderas, och återställer det i ett
avslutningsblock. Avbryts processen däremellan står värdet kvar, och ingen
mekanism i hela systemet kan se det. Motmedlet är beskrivet i lärdomsloggen
och fortfarande obyggt.

Det andra fyndet är mänskligt, inte tekniskt. Efterkontrollen skapar
automatiskt ett ärende varje gång den blir röd, och den mekanismen fungerar
felfritt. Men sexton sådana ärenden från 2026-09-06/07 stod obesvarade i
**tio till elva dygn** och stängdes sedan allihop inom tre minuter
2026-09-17 — i praktiken under förberedelserna för denna granskning.
Automatiken finns. Läsaren fanns inte.

### 8.5 Grindlogiken

| # | Fråga (ordagrant) | Kort svar | Märkning | Källa |
|---|---|---|---|---|
| 1 | Vilka jobb är obligatoriska för merge? | Exakt **ett**: `CI Passed or Skipped`. Det aggregerar sex andra. Tre av de sex kan aldrig hoppas över (klassningen, lint, beroendegranskningen). | verifierad (ruleset mätt tre gånger oberoende) | S5; `j8-5` § F1 |
| 2 | Vad innebär `CI Passed or Skipped`? | Precis vad namnet säger. Den RÄKNAR misslyckanden och avbrott, och fäller om summan inte är noll — i stället för att leta efter framgångar och tiga när de uteblir. Skillnaden är avgörande och är resultatet av en verklig olycka. | verifierad (båda grenarna mot verkliga körningar) | `j8-5` § F2 |
| 3 | Kan ett viktigt test markeras som `skipped` och ändå ge grönt? | **Två halvor, båda måste stå.** Före merge: nej — 46 hotscenarier prövade, inget hål. Efter merge: **ja, mätt** — 60 kodlandningar på fyra veckor (rättat efter S30/KG1 från "55"). Se Del 4 fråga 3. | verifierad (båda halvorna) | `j8-5` § F3; S18, S30 |
| 4 | Hur avgör `Detect changed files` vilka tester som ska köras? | Fyra oberoende TILLÅTELSELISTOR — bara det som uttryckligen står med får hoppa, och utfallet blir sant bara om VARENDA ändrad fil matchar. Noll matchningar ger falskt, inte sant. | verifierad | `j8-5` § F4 |
| 5 | Vad händer när detektionslogiken har fel? | Det har hänt en gång skarpt: filnamn med å, ä och ö klassades fel, och dokumentationsjobbet hoppades TYST över på en äkta dokumentationsändring. Lagat på fyra ställen — **men ingen grind vaktar fixen.** Tas raden bort återkommer felet tyst. | verifierad | `j8-5` § F3, R4 |
| 6 | Finns en säker standard där osäkerhet innebär att fler tester körs? | Ja, i fem oberoende lager. Bekräftat empiriskt: en okänd katalog, en fil utan filändelse och en tom lista faller alla tre till full körning. Detta är konstruktionens starkaste sida. | verifierad | `j8-5` § F6 |
| 7 | Kan en ändring i gemensam kod påverka fler delar än filtret förstår? | I källkoden nej — filtret försöker aldrig vara smart där. I dokumentationsytan ja: den innehåller körbar kod och PDF-mallar. De är nästan alltid grindade ändå, men **sällan av det skäl som står skrivet**, och ett fall (`docs/**/*.sh`) når ingen grind alls. | verifierad | `j8-5` § F7 |

**Avsnittets viktigaste fynd.** Grindlogiken håller. Det ska sägas rakt,
eftersom det är det mest granskade och bäst belagda i hela arkitekturen: den
yttre ramen mättes tre gånger oberoende med identiskt resultat, paraplyet
prövades i båda riktningar mot verkliga körningar, och 46 konstruerade
hotscenarier gav noll träffar på "hoppat av misstag och ändå grönt".

Det som INTE håller är resonemanget under logiken. Hela konstruktionen vilar
på ett uttalat villkor i ADR-077: att hoppa tester före landning är
försvarbart **endast** om ett nät kör dem efteråt. Nattkörningen har varit
röd 51 av 52 nätter. Rött bär därmed ingen information, och när ett verkligt
testfel kom natten till 2026-09-17 landade det i en tystnad.

Och fyra skrivna motiveringar stämmer inte längre med det de motiverar —
bland annat påstår `ci.yml` på rad 162 att ett par listor inte vaktas av
någon grind, femtio rader innan samma fil beskriver grinden som vaktar dem.

### 8.6 Stabilitet och felsökning

| # | Fråga (ordagrant) | Kort svar | Märkning | Källa |
|---|---|---|---|---|
| 1 | Hur ofta fallerar tester utan att produkten faktiskt är trasig? | 15 röda av 100 körningar — men **0 av 100 bevisat flakiga**. Rödheten är två diagnostiserade, deterministiska fel: en äkta säkerhetsvarning (13 av 15) och en klockbugg (4 av 15). | verifierad (repots eget mätverktyg) | `j8-6` § Fynd 1 |
| 2 | Vilka tester är mest flakiga? | Just nu inget, i klassisk mening. Historiskt nio tester i tre mekanismer, samtliga diagnostiserade och åtgärdade. Exakt EN äkta, öppen flake finns: `TASK-418`, ordningsberoende, mätt 2026-09-06, oåtgärdad. | verifierad | `j8-6` § Fynd 2 |
| 3 | Görs automatiska omkörningar, och döljer de i så fall instabilitet? | Ja, två i CI och noll lokalt. **Historiskt dolde de ett äkta race** — 14 av 22 jobb rapporterade internt "flaky" utan att bli röda. Beslutet att behålla dem togs efter att motiveringen falsifierats, med två motvikter. I dagens data döljer de ingenting, eftersom felen är deterministiska. | verifierad | `j8-6` § Fynd 3 |
| 4 | Är felmeddelandena tillräckligt tydliga för att snabbt hitta orsaken? | Blandat, och mönstret är skarpt: där någon SKREV ett felmeddelande med avsikt är kvaliteten ovanligt god. Där felet uppstår i infrastrukturens möte med verkligheten (en klocka som glider, ett långsamt paketregister) krävs källkodsläsning. | verifierad (fem loggar lästa i sin helhet) | `j8-6` § Fynd 4 |
| 5 | Sparas screenshots, loggar, traces och testresultat? | Ja, fem separata uppladdningssteg, 7 dagars lagring, lösenord rensade före uppladdning. Spårning sparas bara vid omkörning, video bara vid fel — och allt är avstängt under självtestet, eftersom det FÖRVÄNTAS fälla. | verifierad | `j8-6` § Fynd 5 |
| 6 | Går det att köra exakt samma test lokalt? | Delvis, och gränsen är mekaniskt vaktad. Lint, dokumentation, de tre hermetiska jobben: ja, härledda ur workflow-filerna. Staging, tillgänglighet och nattens egna grindar: nej, per design. | verifierad | `j8-6` § Fynd 6 |
| 7 | Hur lång tid tar det normalt från rött test till förstådd felorsak? | **Frågan har två svar och det ena ljuger.** Tid till stängt ärende: median 16,6 respektive 44,4 timmar, p90 upp till 257 timmar. Men det mäter administrativ eftersläpning: i ett belagt fall var orsaken förstådd och åtgärdad samma dag, medan ärendet stod oskrivet i tio dygn. | verifierad | `j8-6` § Fynd 7 |

**Avsnittets viktigaste fynd.** Testflödet ljuger nästan aldrig. Noll bevisat
flakiga körningar av hundra är ett bättre tal än de flesta projekt kan visa,
och det är resultatet av verkligt arbete: `TASK-74` spårade tre separata
flake-mekanismer till rotorsak i stället för att höja en tidsgräns.

Men mätningen döljer ett tillstånd. Sedan 2026-09-09 är **14 av 14**
körningar på riktiga utvecklingsgrenar röda, och huvudgrenen har inte rört
sig sedan 2026-09-08. Två kända fel blockerar allt: två säkerhetsvarningar i
beroendeträdet, och en enda testrad som återställer webbläsarens klocka till
verklig tid i stället för testets frusna tid. Den andra är ett par rader att
laga och löser en fjärdedel av rödheten.

Skillnaden mellan "opålitligt" och "två specifika saker att laga" är stor,
och den här är av den andra sorten. Men konsekvensen i stunden är densamma:
ingenting landar.

### 8.7 Tid och kostnad

| # | Fråga (ordagrant) | Kort svar | Märkning | Källa |
|---|---|---|---|---|
| 1 | Hur lång är den faktiska väntetiden, inte summan av alla jobbtider? | Bimodal, inte en skala. Dokumentationsändring: ~4,0 min. Kodändring: 12,5 min median, 13,8 min p95 — nästan oavsett hur stor ändringen är. Efter landning: 16,0 min median, upp till 56 min när databaslåset är taget. | verifierad | `j8-7` § 2, § 3 |
| 2 | Vilket steg ligger på den kritiska vägen? | **Ett självtest av testramverket** — inte staging. Egen mätning, 3 av 3 körningar: 12,8–13,7 min av en total på 13,6–14,0 min. Det är 92–98 procent av väntan. | **verifierad — omprövad av mig** | Egen mätning (se nedan) |
| 3 | Hur mycket GitHub Actions-tid förbrukas per vecka eller månad? | 76 080 minuter i augusti (~17 180 min/vecka, ~286 timmar/vecka). **Nettokostnad 0 kronor** — repot är publikt, rabatten är exakt 100 procent varje månad. Enda verkliga notan är ett Enterprise-abonnemang på ~21 dollar/månad, köpt för merge-kön. | verifierad (två oberoende API-belägg) | S14; `j8-7` § 5 |
| 4 | Hur ofta körs hela flödet i onödan? | Fyra mönster. Samma träd testas upp till fyra gånger per landning. 34 procent av grenarna fick mer än en körning (en gren fick 14 på knappt sex timmar). Beroendegranskningen kör på varje ändring, även rena textändringar. | verifierad | S11; `j8-7` § 6 |
| 5 | Skulle snabbare kontroller kunna köras först och stoppa resten vid fel? | **Nej — det skulle bli långsammare.** De billiga jobben göms redan bakom det dyra och kostar noll väggklocka. Sekventiell ordning hade lagt ~4 min PÅ varje grön körning för att spara 10 min på de sällsynta röda. | starkt indikerad (kalkyl på mätta tider) | `j8-7` § 7 |
| 6 | Behöver länkkontroll, audit och full staging-E2E verkligen köras vid varje kodändring? | Länkkontroll: nej, och den gör det inte — villkorad sedan ADR-082. Staging: nej, och den gör det inte — aldrig på PR-ytan. Beroendegranskningen: **ja, den kör villkorslöst, och det är den enda av de tre där frågan fortfarande är öppen.** | verifierad | `j8-7` § 8 + egen mätning |

**Avsnittets viktigaste fynd — och min egen mätning.** Uppdraget bad mig
pröva J8.7:s huvudpåstående själv, eftersom orkestreraren inte hade
stickprovat det. Jag hämtade jobbnivådata för tre verkliga körningar med
`gh run view <id> --json jobs` (2026-09-17) och räknade start- och sluttider.

| Körning | Total väggklocka | Kritiska vägen | Andel | Näst längsta jobb | Staging/A11y |
|---|---|---|---|---|---|
| `34265004584` | 14,0 min | Självtestet, **13,7 min** | 98 % | Acceptance (2), 5,5 min | skippade |
| `34248030069` | 13,8 min | Självtestet, **12,8 min** | 93 % | Acceptance (1), 6,0 min | skippade |
| `34249685743` | 13,6 min | Självtestet, **13,2 min** | 97 % | Acceptance (1), 5,7 min | skippade |

**Påståendet håller i 3 av 3.** Staging och tillgänglighet stod som
`skipped` i samtliga tre, tillsammans med tre andra jobb. Elva jobb kördes;
slutgrinden väntade på alla och tog tre sekunder.

**Men jag hittade något inget underlag frågade efter: VARFÖR jobbet är
dyrast.** Det är inte en egenskap hos uppgiften. Den vanliga
acceptance-klassen kör sina 524 tester i **tre parallella delar** om 4,2–6,0
minuter. Självtestet kör **samma 524 tester i EN enda process**
(`ci-suite.yml:516–592` skapar inget delningsindex; mätningen ovan visar ett
enda jobb mot tre). Summan av de tre delarna är 15,0 minuter i körning 1 —
alltså ungefär vad självtestet tar odelat.

Delningen infördes 2026-09-02 efter att acceptance-klassen vuxit 98 procent
på två veckor och sparkat en PR ur kön två gånger. Den följde aldrig med till
självtestet. Skriptets eget huvud förutsåg risken att självtestet blir den
kritiska vägen — men längs en annan axel (urvalet), inte längs
delningsaxeln. Det är inte slarv; det är en åtgärd som stannade halvvägs.

**Skärpning efter orkestrerarens stickprov (S25):** "stannade halvvägs" är
för passivt. `ci-suite.yml:526-535` bokför att självtestets tak höjdes 12→20
minuter 2026-09-03 — dagen efter att `TASK-366` (hög prioritet) skapades för
att beskriva exakt denna obalans. Problemet var alltså känt och kortat
samma vecka det uppstod; åtgärden som togs var att höja taket, inte att dela
jobbet. Femton dagar senare (fram till denna granskning) är kortet
fortfarande To Do.

**Två egenskaper som INTE förklarar kostnaden**, prövade och avfärdade:
självtestet kör redan med omkörningar avstängda (`--retries=0`,
`scripts/hermetik-sjalvtest.mjs:101`, med en utskriven och korrekt
motivering), och spårning, skärmdumpar och video är avstängda under det. De
självklara optimeringarna är alltså redan gjorda. Kvar står delningen.

**Vad det betyder i minuter:** delas självtestet i tre på samma sätt som
klassen det speglar, faller den kritiska vägen från ~13,7 till uppskattningsvis
~5–6 minuter, och en kodändrings väntan före landning från ~25 minuter (två
ytor i sekvens) till ~12. **Jag har inte verifierat att det är säkert att
göra** — självtestets dom vägs över hela sviten (`bedomPositivt` avvisar
uttryckligen en tom testmängd), så en delning kräver att domen slås ihop över
delarna. Det är en verklig designfråga, inte en flagga. Rekommendationen i
§ Rekommendationer är formulerad därefter.

### 8.8 Underhåll

| # | Fråga (ordagrant) | Kort svar | Märkning | Källa |
|---|---|---|---|---|
| 1 | Hur många filer, scripts och konfigurationer krävs för att hålla detta igång? | ≈333 filenheter, ≈106 900 rader — mot produktkodens ≈112 400. Kvoten **0,95:1**, eller 1,84:1 om testspecifikationerna räknas in. Konkret: 8 workflow-filer, 186 skript, 44 policyfiler, 30 CI-relaterade beslutsdokument. | verifierad som räknehändelse, osäker som kvalitetsmått | `j8-8` § 1; egen kontrollräkning |
| 2 | Vem eller vad kan förstå hela flödet? | **Ingen, i dag.** Det finns inget dokument som beskriver helheten. Minsta säkra läsmängd före en ändring i `ci.yml`: ≈5 900 rader, och det förutsätter att man redan vet vilka 3–5 beslutsdokument som gäller. | starkt indikerad | `j8-8` § 4 |
| 3 | Hur ofta behöver CI-koden ändras? | `ci.yml` ensam: 116 commits på 15,4 veckor ≈ **7,5 ändringar per vecka**, i snart fyra månader. Hela ytan: 813 av 6 498 commits (12,5 %). **Ingen avtagande trend** — de två högsta veckorna ligger långt in i perioden. | verifierad | `j8-8` § 2 |
| 4 | Hur stor del av den senaste utvecklingstiden har gått till testinfrastruktur? | Ingen tidrapportering finns. Fyra proxyer ger 15–60 procent; trovärdig mittpunkt **20–35 procent**. Ändringsloggen räknar oberoende 22,5 procent av landningarna på `main` (506 av 2 251 — inte PR:er; rättat efter orkestrerarens stickprov S27, se `03` § Kort svar för distinktionen mot PR-antalet). | osäker (proxy, öppet redovisad) | `j8-8` § 3; `03` |
| 5 | Finns samma lösning kopierad i flera repon? | **Nej — exakt en grindvakt** är kopierad, till hubben. Och den kopian har redan glidit i ett faktiskt policyvärde efter mindre än sex veckor. Inget av nio andra repon bär någon del av maskineriet. | verifierad | `j8-8` § 5 |
| 6 | Vilka delar kan lyftas ut till återanvändbara workflows eller ett centralt CI-kit? | Av ~20 stickprovade: ≈9 generella eller generella-med-config, ≈3 produktspecifika, ≈8 **processpecifika** — bundna till Marcus/Code-arbetsformen, varken CI i allmän mening eller Miranon Media-specifika. | verifierad (stickprov) | `j8-8` § 6 |
| 7 | Hur installeras samma standard i ett nytt repo? | För hand, och det har hänt en gång. Hela installationsguiden är **en kommentarsrad inuti det skript som ska kopieras**. Inget bootstrap-skript, ingen mallrepo, ingen checklista. | verifierad | `j8-8` § 7 |

**Avsnittets viktigaste fynd.** Den enskilt mest talande siffran är inte
storleken utan **ändringstakten som inte avtar**. En infrastruktur som är
byggd klar borde plana ut. Denna gör det inte: veckorna 31 och 35 — långt in
i perioden — har högre andel CI-commits än uppstartsveckorna. Ändringsloggen
klassar dessutom cirka 40 procent av det substantiella CI-arbetet som
**korrigering av en tidigare CI-ändring**, med fem namngivna ytor som fixats
tre till fyra gånger var under samma sjuveckorsperiod.

Det andra fyndet är kategorin som uppdraget inte hade ett fack för. En
betydande del av det som ser ut som CI-komplexitet är i själva verket
**agent-orkestreringens** komplexitet: facit-kedjan, arbetsform-tillstånd,
review-loopen, backlog-wrappern. De löser problem som arbetssättet självt
skapat — flera AI-agenter som landar kod parallellt i isolerade
arbetskataloger. Det är inte i sig fel, men det är en annan sorts motivering
än "produkten kräver det", och den bör inte räknas i samma hög.

**En kontrollräkning av mina egna källor.** `j8-8` anger "24 filer" för
globben `scripts/check-*.sh`. Jag mätte 20 för just den globben; 24 stämmer
för `check-*` med alla filändelser (20 `.sh` + 4 `.mjs`). Talet är rätt,
etiketten är fel. `ls scripts/test-* | wc -l` ger 75 och
`find scripts -type f | wc -l` ger 186 — båda bekräftade.

## Del 2 — Redundansanalysen

Uppdragets tumregel (rad 317): *"Om två nivåer i praktiken ger samma svar
finns sannolikt en dubblering."* Här är varje belagd dubblering på ett
ställe, med kostnad, unikt skydd och dom.

| # | Dubblering | Vad den kostar | Vad den skyddar mot som inget annat gör | Dom |
|---|---|---|---|---|
| **D1** | **Samma träd testas upp till fyra gånger per ENSAM landning** — PR-ytan, kö-ytan, `CI [push]` på huvudgrenen, efterkontrollen | ~12,5 min väggklocka per extra körning; körningen på huvudgrenen tillför bevisligen ingenting **vid en ensam landning** | Kö-körningen skyddar mot att två ändringar krockar (kön bygger mot `main` + posterna före). Efterkontrollen tillför staging och tillgänglighet. **`CI [push]`-körningen tillför noll — men bara vid en ENSAM landning (rättat efter orkestrerarens stickprov S30/KG1); vid en grupplandning är det just den som klassar hela det pushade spannet.** | **Reducera den tredje, i rätt ordning.** Låt push-körningen fråga "körde sviten OCH var grön?" — ALDRIG bara "har denna SHA en grön körning?" (KG1:s fälla: på post-merge-luckans 60 hål är kö-körningen grön med sviten hoppad). Görs EFTER att täckningsluckan (P2) är lagad, aldrig före |
| **D2** | **Merge-dedupen som sällan träffar** — jämför det landade trädet med PR-huvudets träd | ~40 rader skal, ett `actions: read`-grant, en egen felklass. 568 av 1 887 (30 %) är J8.5:s TEORETISKA tak ur git-historiken, inte en observerad kvot; orkestrerarens mätning gav 3 av 20 kod-landningar (15 %) i ett fönster på 40 `push`-körningar (rättat efter orkestrerarens stickprov S20 — inte "noll observerade träffar"). **Förstärkt i S30 (KG1):** 32 av 32 träffar där dedupen KAN göra nytta (samma träd, kodspann; 5,3 % av 601 pushar) — samma sak sedd från andra hållet | Ingenting i dag. Dess skrivna motivering vilar dessutom på ett krav (`strict`) som togs bort 2026-08-05 | **Byt fråga — inte riv (S20/S30: gemensam dom).** Fråga om den landade commit-SHA:n redan har en grön `ci.yml`-körning från kön (`merge_group`), i stället för att jämföra mot PR-grenens träd. **Fällan (S30/KG1):** villkoret får ALDRIG vara bara "har SHA:n en grön körning?" — på post-merge-luckans 60 verkliga hål ÄR kö-körningen grön med sviten HOPPAD. Villkoret måste vara "sviten körde OCH var grön", och ändringen får inte göras FÖRE lagningen av post-merge-klassningen (riskregistrets P2 nedan) |
| **D3** | **Självtestet kör hela klassen odelat** medan klassen själv körs delad i tre | **13,7 min mot 5,5 min** — 8 minuter per körning, två ytor i sekvens = ~16 min per landning. Det ÄR den kritiska vägen | Ett äkta, unikt skydd: att acceptance-testerna faktiskt hänger på mockarna. Det har fångat en verklig felklassning (elva tester i fel klass). Inte redundant i SAK | **Behåll skyddet, riv kostnaden.** Delningen infördes för den ena klassen och följde aldrig med till dess spegel. Se § Rekommendationer för caveat |
| **D4** | **Samma användarflöde i acceptance OCH e2e** | Varje `tests/e2e/`-fil betalar städ-, purge- och mutexkostnad även när den är helt mockad | `mark-paid` är en MEDVETEN, dokumenterad tvådelning — UI-form hermetiskt, skrivkontrakt på API-nivå. Bekräftelsemailet är en ÄKTA dubblering: samma `describe`-namn på två nivåer, ingen av dem når en riktig mailtjänst | **Delat.** Behåll tvådelningarna men flytta filerna till rätt katalog. Riv e2e-versionen av bekräftelsemailet — noll unik information förloras |
| **D5** | **75 testsviter för 27 grindvakter** | 34 582 rader (32 % av hela ytan) — testsviter som skyddar grindvakternas EGEN logik | Ett verkligt regressionsskydd: en grind som slutar fälla ser likadan ut som en grind som inte har något att fälla. **Detta är inte redundans — det är den enda motmedicinen mot en tyst vakt** | **Behåll.** Men märk den ärligt: det är kvalitetssäkring FÖR kvalitetssäkringen, och den hör inte hemma i samma hög som produktskydd |
| **D6** | **Fjorton dokumentationsgrindar kontra produktgrindar** | **Nytt fynd:** tio av de fjorton kör i det **alltid-på** `lint`-jobbet och fyrar på VARJE kodändring. Bara fyra sitter i det villkorade `docs`-jobbet | De tio har egna dokumenterade incidenter (en ADR-räkning fel i månader; en falsk mening om en spärr som inte fanns). De skyddar aldrig appen Lotta använder | **Behåll grindarna, flytta de tio.** En ren kodändring bör inte fälla på lesson-numrering. Kostnaden är sekunder, men signalen är fel |
| **D7** | **`verify:ci-parity` och `check:docs` som lokala speglar av CI** | 910,7 s för full paritetskörning; båda är underhållna kopior av CI:s uppsättning | Genuint unikt: de låter en agent pröva lokalt innan push. **Och de är härledda, inte handkopierade** — `verify:ci-parity` läser workflow-filerna och kör deras block ordagrant, med en paritetsvakt som fäller på drift | **Behåll båda.** Detta är den motsatta felklassen mot D2: en dubblering som aktivt försvarar sig mot att bli en dubblering |
| **D8** | **Överlapp mellan lokala hookar och CI-grindar** | 16 hookar (11 egna + 5 från pluginet), 4 162 rader | Hookarna stoppar saker CI aldrig ser: ett anrop mot prod-databasen, en push från fel katalog, en hemlighet på väg till en logg. **Liten faktisk överlappning** — de vaktar en annan axel | **Behåll.** Men: sex av nio nekande hookar **loggar ingenting alls**, så deras fångst kan varken räknas eller utvärderas |
| **D9** | **Två klassnings-utdata som ingen lyssnar på** (`ui_low_risk`, `acceptance_local`) | Beräknas vid varje körning, styr ingenting sedan `TASK-70.3` | Ingenting | **Riv.** Öppet bokfört i `ci.yml:2213–2222` som en skjuten fråga; den är fortfarande skjuten |

**Sammanvägt.** Nio dubbleringar, och domen är INTE "riv allt". Fyra ska
behållas (D5, D7, D8, och skyddet i D3), tre ska rivas helt (D1:s tredje
körning, D2, D9), två ska flyttas eller delas (D4, D6), och en ska behållas
men kostnadssänkas (D3).

Det är värt att säga varför fördelningen ser ut så: **de dubbleringar som
kostar mest är inte de som skyddar minst.** D3 är den dyraste posten i hela
listan och den bär ett äkta, unikt skydd. D2 är den billigaste och bär inget
alls. En analys som bara rankade på kostnad hade gett fel svar på båda.

## Del 3 — Riskregistret

Alla belagda risker, rangordnade, med konsekvensen uttryckt för **Lotta och
hennes deltagare** — inte för repot. Tre klasser hålls isär, eftersom de har
olika rätta åtgärder.

### Produktrisker — fel som kan nå användaren

| # | Risk | Sannolikhet | Konsekvens för Lotta och deltagarna | Vad som skyddar i dag | Belägg | Riktning |
|---|---|---|---|---|---|---|
| **P1** | **Appen kan inte skapa event med startdatum i januari 2027.** En lista i databasen ("Månad/år") tar slut vid december 2026 | **Säker** — biter första gången någon planerar ett event med startdatum i januari 2027, vilket kan vara i dag (rättat efter orkestrerarens stickprov S26 — inte "om drygt tre månader") | Lotta kan inte lägga upp vårens event. Serverfunktionen svarar med ett tekniskt fel, inte ett begripligt meddelande | **Ingenting.** Varken automatiskt eller manuellt | `j8-1` incident 4; `data-model.md` § Kända fällor, post 45, LIVE-bekräftad 2026-07-24; prod-schema live-mätt 2026-09-17 (fjorton val, nov 2025–dec 2026) | Förvärras med kalendern |
| **P2** | **Kodlandningar prövas aldrig mot verkligheten.** Merge-kön landar flera ändringar i en push; efterkontrollen klassar bara den översta | **Inträffat, 60 gånger på fyra veckor** (rättat efter S30/KG1 — tidigare "55"; exponeringsfönster median 0,57 h, längst 33 h) | En regression i riktig data, inloggning eller Airtable-kontrakt når `main` — och därmed Lotta — utan att staging/a11y/städning prövats med läsbart utfall (de hermetiska klasserna körde ändå, via `CI [push]` eller kö-ytan) | De hermetiska klasserna körde på kö-ytan OCH via `CI [push]` vid grupplandning. Det som uteblir är staging, a11y och städning | S18 (mekanismen fastställd), S30 (skärpt); `TASK-365` öppet med delvis falsifierad rotorsak, `T166` bär den rätta | Stabil tills mekanismen ändras |
| **P3** | **Ingen vakt på att `main` når prod** | Inträffat minst en gång, 20+ timmar | Lotta använder en gammal version av appen utan att veta det. En fix hon väntar på finns inte där | Ingenting mekaniskt. Upptäcktes av en människa | S6; `TASK-199`, To Do, `priority: high`, öppet sedan 2026-08-11 | Stabil |
| **P4** | **Mailflödet har inget verklighetstest på någon nivå.** `send-action-email` — bekräftelse, påminnelse, eventinfo, testmail | Okänd, men ytan är aktiv | **Den mest oåterkalleliga handlingen appen gör.** Ett felaktigt utskick till verkliga deltagare går inte att ta tillbaka | Tre oberoende, samstämmiga MOCKAR som aldrig jämförts mot en riktig tjänst | S16; `07` § skriv-flödes-tabellen, uttömmande korsreferens | Stabil |
| **P5** | **Elva av arton mockar är obundna** från verkligheten | Växer med Airtable-basens egen ombyggnad | En serverfunktion ändrar svarsform; den hermetiska världen fortsätter svara som förr; testerna är gröna och appen är trasig | Kontraktsvakten binder 7 av 18 — och fångar bara FORM-drift, aldrig betydelse-drift | S10; `kontraktsfall.ts:25-26` påstår full täckning | Förvärras med basens utveckling |
| **P6** | **Edge Functions körs i Deno men typkontrolleras av Node** — 24 av 135 filer, och Denos egna verktyg är inte inkopplade någonstans | Inträffar vid varje ändring i de 111 otäckta filerna | Edge Functions är appens ENDA skrivväg mot Airtable och Postgres. Ett fel märks först när funktionen kraschar i drift | Ingenting. ADR-010 lovade det 2026-05; obetalt 2026-09-17 | S13; `j1f` § Risker punkt 2 | Stabil skuld, växande yta |
| **P7** | **Skrivvägen mot Airtable saknar omförsök vid 429.** Läsvägen har det; de sex skrivande funktionerna anropar det aldrig | Ökar när staging och prod delar hastighetstak | En registrering eller betalning Lotta gör kan falla på att en testkörning samtidigt använde kvoten | Ingenting. Ingen bokförd motivering till asymmetrin | S9; `airtable-client.ts`, rad 121/196/241 mot 266/308/353/411/448/497 | Stabil |
| **P8** | **Sentinel-drift på en delad testrad (L599)** | Inträffat **tre gånger**, senast 2026-09-07 | Indirekt: efterkontrollen blir röd av fel skäl, larmen förlorar värde, och en äkta regression drunknar | Purgen känner bara till HELA RADER. Motmedlet är designat och obyggt | `j8-4` § 8.4.2; issue `#2447` | Strukturell — återkommer tills motmedlet byggs |

### Processrisker — fel som gör systemet blint

| # | Risk | Sannolikhet | Konsekvens | Vad som skyddar i dag | Belägg | Riktning |
|---|---|---|---|---|---|---|
| **Pr1** | **Nattnätets döda signal.** Rött 51 av 52 nätter; senaste gröna natt 2026-07-29; 21 öppna larm-ärenden, noll kommentarer | Inträffat, pågående i sju veckor | Nätet är VILLKORET för att presubmiten får hoppa tester (ADR-077). Ett villkor som inte infrias gör hela konstruktionen obevisad. **Skärpt i S30 (KG1):** ett produktskyddande jobb var rött 25 av 52 nätter — signalen är alltså inte bara död, den är BEGRAVD | Larmet skapas — utan dedup, så varje natt ger ett NYTT ärende i stället för en uppdaterad tråd | S7, S12, S30; `nightly.yml` `alarm` saknar dedup-kontroll | Förvärras — ärendehögen växer |
| **Pr2** | **Prosa som blir falsk genom tillväxt.** Fyra mätta instanser i olika filer | Inträffat fyra gånger, åt BÅDA håll | Nästa läsare lutar sig mot ett skäl som inte längre bär. En agent planerar mot en mekanism som inte finns — eller avstår från en som finns | ADR-083 vaktar prosa som påstår en MEKANISM. **Ingenting vaktar prosa som bär ett TAL eller påstår en FRÅNVARO** | S4, S10, S16, S17 — samma felklass, fyra oberoende fynd | Förvärras med varje tillväxtperiod |
| **Pr3** | **Ett Accepted-beslut utan brytdag.** ADR-131 river backlog-stängningsgrinden; Accepted 2026-09-04, `## Updates`: "Inga än" | Inträffat | Maskineriet underhålls tills någon river det. Just nu städar en session 30 inkonsistenta kort i en grind som är beslutad att försvinna | Ingenting. Ett beslut utan datum har ingen bevakare | S15; `ADR-131` rad 3, 170–172, 295–297 | Stabil kostnad tills verkställd |
| **Pr4** | **Larmkedjan är obevisad som operativ mekanism** | Mätt: 16 ärenden obesvarade i 10–11 dygn | En äkta regression kan ligga på `main` — och därmed i Lottas app — så länge ingen läser larmet | Automatiken fungerar felfritt. Det finns ingen mekanism som tvingar fram ett svar | `j8-4` § 8.4.9; `j8-6` § Fynd 7 | Stabil |
| **Pr5** | **En vecka utan människa och allt står still.** `main` frusen sedan 2026-09-08; 14 av 14 körningar röda; fem Dependabot-PR:er öppna sedan 2026-09-14 | Inträffat, pågående | Inga fixar når Lotta. De två blockerande felen är kända och små — men ingen mekanism lagar dem, och gren-städningen kör bara medan en session är igång | Ingenting. Systemet har ingen självläkning och ingen vilolägesdrift | `j8-6` § Risker; `j8-4` § Proveniens (main fryst nio dagar) | Stabil — strukturell |

### Risken i maskinen själv

| # | Risk | Sannolikhet | Konsekvens | Belägg | Riktning |
|---|---|---|---|---|---|
| **M1** | **Ändringstakten avtar inte.** `ci.yml` 7,5 ändringar/vecka i snart fyra månader; veckorna 31 och 35 högst, långt in i perioden | Inträffat, mätt över 15,4 veckor | Varje timme på maskinen är en timme som inte gick till produkten. Om kurvan aldrig planar ut är detta inte en investering utan en löpande kostnad | `j8-8` § 2 | Ingen avtagande trend synlig |
| **M2** | **Fixar av fixar.** ~40 % av det substantiella CI-arbetet är korrigering av en tidigare CI-ändring; fem ytor fixade 3–4 gånger var på sju veckor | Inträffat | Arbetet ger inte varaktig avkastning. Samma yta kostar om och om igen | `03` § Korrigeringskedjor, § Andelar | Stabil |
| **M3** | **Begriplighet — vem kan ändra `ci.yml` säkert?** Ingen enda fil beskriver helheten. Minsta säkra läsmängd ≈5 900 rader, och man måste redan veta vilka beslutsdokument som gäller | Inträffat (fyra mätta prosa-fel är symptomet) | Systemet kan bara ändras av den som redan kan det. En agent med färsk kontext kan inte nå den tröskeln inom en rimlig budget | `j8-8` § 4 | Förvärras med varje tillägg |
| **M4** | **Grinden definieras av koden som granskas.** En PR kan ändra `ci.yml` — inklusive paraplyets `needs`-lista — och landa med noll godkännanden; `CODEOWNERS` är rådgivande | Ej inträffad | Strukturell. I dag låg risk (två användare), men ingen mekanism hindrar det, och ingen vakt ser ett jobb som tas bort ur listan | `j8-5` R7; ruleset mätt: `required_approving_review_count: 0` | Stabil |
| **M5** | **Den dolda kostnaden per agent-spawn.** `CLAUDE.md`s CI-avsnitt är 80 % av filens vikt och laddas i varje färsk agent-session — ≈1 589 spawns på 51 dagar | Inträffat löpande | Varje agent betalar för CI-kunskap den oftast inte behöver, i en budget som annars gått till uppgiften | `j8-8` § 4 (starkt indikerad — byte/4-tumregel, ej tokeniserad) | Växer med filen |

**Läsanvisning till registret.** Produktriskerna är få och konkreta;
processriskerna är fler och mer diffusa. Det är inte en slump: apparaten är
byggd för att fånga produktfel, och den gör det — den har bara vuxit ett lager
process ovanpå sig som ingen grind kan mäta, och det lagret är där tre av de
fem processriskerna sitter.

## Del 4 — De fem viktigaste frågorna

Uppdraget (rad 385–391) begär *"särskilt tydliga och fristående svar"* på fem
frågor. Varje avsnitt nedan går att läsa utan resten av filen.

### Fråga 1 — Vilket verkligt produktionsfel skyddar varje jobb mot?

**Kort svar för en oteknisk läsare:** av ungefär trettiofem automatiska
kontroller kan **fyra** peka på ett verkligt fel de faktiskt stoppade.
**Nio** skyddar mot fel som rimligen kan inträffa men aldrig har gjort det
här. **Sexton** skyddar inte appen alls, utan repots egen bokföring — vilket
är legitimt, men en annan sak. **Sex** hittade jag inget belägg för åt något
håll.

Fyra klasser, med belägg per rad:

- **A — belagd fångst av ett verkligt fel.** Det finns en namngiven händelse.
- **B — skydd mot ett hypotetiskt fel.** Rimligt skydd, ingen dokumenterad
  instans.
- **C — processkydd.** Skyddar repots dokumentation, bokföring eller egna
  mekanismer, aldrig appen Lotta använder.
- **D — inget belägg.** Jag hittade inget åt något håll. *Frånvaro av bevis
  är inte bevis på frånvaro.*

| Jobb (dagens namn) | Var | Klass | Belägg |
|---|---|---|---|
| `Detect changed files` | PR, kö, push | **B** | Styr vad som körs. Har själv orsakat ett verkligt fel (å/ä/ö-klassningen) — lagat, ovaktat |
| `Lint + TypeCheck` | PR, kö, push | **B** | Inget eget "det här hände" i underlaget. Var själv trasig en gång (typkontrollen en tom operation i veckor) |
| — dess ~63 inbyggda grindsviter | samma jobb | **C** | Skyddar grindarnas egen logik mot regression |
| `Audit dependencies (audit-ci)` | PR, kö, push | **A** | **Starkast i hela systemet.** Stoppade ett publicerat skadligt paket maj 2026 innan det installerades, plus fyra verkliga säkerhetsvarningar sedan dess |
| `Pure + Build` | PR, kö, push | **B** | Inget dokumenterat produktionsfel. Men bygget är förutsättningen för att allt annat ska betyda något |
| `Acceptance (hermetisk)` ×3 | PR, kö, push | **A (i efterhand)** | Bär de nya testerna för incident 8 (långa bilagenamn) och 9 (plockarens mängd). Fångade en verklig layout-regression i körning `34247598715`. Men den lärde sig av skadan — den förutsåg den inte |
| `Acceptance — tvåsidigt bevis` | PR, kö, push | **A (maskin)** | Fångade en verklig felklassning: elva tester låg i fel klass och klarade sig utan mockarna. Skyddar testklassens ärlighet, inte produkten |
| `Webblasarbeteende` | PR, kö, push | **D** | J8.1 kunde inte hitta den grundande incidenten. Uttryckligen ej verifierbar inom passets fönster |
| `Docs link check` (4 grindar) | PR om docs ändrats | **C** | Intern länkintegritet. Rör aldrig appens kod |
| 10 av 14 dokumentationsgrindar | `lint`, **alltid på** | **C** | Egna dokumenterade instanser (ADR-räkning fel i månader; falsk mening om en spärr). Skyddar aldrig produkten |
| `Review-backstopp` | kö | **C** (grinden) / **A** (granskaren bakom) | Backstoppen bevisar bara att ett utlåtande FINNS. Granskaren har fångat verkliga problem före merge (`#2055`, `#2312`, `#2474`). Backstoppen har **aldrig fällt skarpt i kön** |
| `CI Passed or Skipped` | PR, kö, push | **A** | **Den mest bevisade enskilda kontrollen.** 2026-07-23 mergades en röd PR för att grinden räknade "hoppad" som "godkänd". Lagningen är fail-closed och har ett eget tvåsidigt självtest |
| `Staging sentinel purge` (före) | efter merge, natt | **B** | Hygien. Förhindrar att basen växer |
| `Staging sentinel purge` (efter) | efter merge, natt | **A** | 151 kvarliggande testevent syntes som **kommande event i Lottas eventväljare**; hon valde ett och fick en tom vy. Ett verkligt, användarsynligt fel |
| `A11y (axe-runner)` | efter merge, natt | **D** | Inget dokumenterat fall där den fångade en regression som annars nått Lotta |
| `Staging (API + E2E)` | efter merge, natt | **A** | Fångade ett ärvt länkfilter i en Airtable-formel som matchade fel data — ett äkta kontraktsfel. **Men:** samtliga 59 röda efterkontroller i ett 211-körningars fönster var samma jobb, och de var självförvållade (L599), inte produktfel |
| `post-merge` / `klassning`, `suite` | efter merge | **B** | Bär efterkontrollen. Klassningen är själv källan till täckningsluckan (P2) |
| `post-merge` / `larm` | efter merge | **C** | Mekaniken felfri. 16 ärenden obesvarade i 10–11 dygn |
| `post-merge` / `exponeringsfonster` | efter merge | **C** | Mäter hur länge ett fel kan ligga dolt. Mäter — stoppar aldrig |
| `post-merge` / `sjalvtest` | endast dispatch | **B** | Bevisar att larmkedjan reagerar på äkta rött |
| `nightly` / `suite` | natt | **B** | Nätet som gör presubmiten försvarbar. Rött 51 av 52 nätter — bär i dag ingen signal |
| `nightly` / `nightly-audit` | natt | **B** | Lägre tröskel än dagens grind. Rimlig avvägning |
| `nightly` / `nightly-links` | natt | **C** | Enda ytan som ser extern länkröta. Medvetet utanför larmet |
| `nightly` / `kontraktsvakt` | natt | **A (osäker)** | Ett spår antyder att den fångat en inaktuell prisfixtur; J8.1 kunde inte bekräfta detaljerna. **Täcker 7 av 18 mockar** |
| `nightly` / `nightly-metrics` | natt | **C** | Gör CI-hälsa mätbar |
| `nightly` / `backlog-closure` | natt | **C** | Håller arbetsregistret ärligt. **Redan beslutad att rivas** (ADR-131) |
| `nightly` / `pausade-sessioner`, `sessionsdok-fonster`, `obesvarade-larm` | natt | **C** | Håller kontinuitets-artefakterna sanna. Tre av nattens röda orsaker |
| `nightly` / `alarm` | natt | **C** | Enda åskådaren natten har. **Saknar dedup** — därför 21 separata öppna ärenden |
| `nightly-watchdog` / `watch` | dagtid | **B** | Vakt FÖR vakten: kontrollerar att natten alls startade. Fungerar som avsett |
| `visual-baselines` / `generate` | endast dispatch | **B** | Enda källan till nya referensbilder. Grinden som skulle konsumera dem är medvetet inaktiv |
| `gate-proof` (3 jobb) | endast dispatch | **A (maskin)** | Bevisar lagningen av incident 2. **Men prövar en replik, inte instansen** — och kördes inte efter `ci.yml`:s två senaste ändringar |
| `review-backstopp-proof` (3 jobb) | endast dispatch | **B** | Bevisar granskningsgrinden i båda riktningar, offline. Ej körd på tre veckor |

**Det ärliga sammandraget.** Frågan "vilket verkligt produktionsfel skyddar
detta jobb mot?" har ett tillfredsställande svar för fyra jobb. För resten är
svaret antingen "ett rimligt fel som inte hänt än", "ett fel i vår egen
bokföring" eller "jag vet inte".

Det är **inte** ett argument för att riva de trettioen andra. En brandvarnare
som aldrig larmat är inte en dålig brandvarnare. Men det är ett argument mot
att rättfärdiga nya tillägg med att de befintliga har bevisat sig — det har
de i huvudsak inte, och den som bygger nästa grind bör veta det.

### Fråga 2 — Vilken unik information ger de hermetiska testerna respektive staging-E2E?

**Kort svar för en oteknisk läsare:** de svarar på två olika frågor och kan
inte ersätta varandra. De hermetiska testerna svarar på *"beter sig appen
rätt när den får ett svar av den här formen?"* Staging-testerna svarar på
*"kommer svaret faktiskt i den formen, och hänger hela kedjan ihop?"*

Skarvet mellan de två frågorna är den svaga punkten: det som binder ihop dem
är ett formschema, och det schemat prövas mot verkligheten för **7 av 18**
serverfunktioner.

| Nivå | Unik information den ger | Vad den inte kan ge |
|---|---|---|
| `api-pure` (1 786 tester) | Att ren logik ger rätt UTFALL — parsning, härledning, retry-beräkning | Om appen renderar rätt; om en backend finns |
| `acceptance`, hermetisk (524 tester) | Att appen renderar och beter sig rätt GIVET en viss svarsform. Snabb, deterministisk, parallelliserbar | Att staging eller Airtable faktiskt producerar den formen; att riktig inloggning, riktiga CORS-huvuden eller riktig latens fungerar |
| `webblasarbeteende` (109 tester) | Att en komponent läser plattform och tillstånd rätt via webbläsar-API:er, helt utan nätverksdimension | Något om nätverk över huvud taget |
| `api-staging` (529 tester) | Att en serverfunktionskedja fungerar mot RIKTIG Airtable och Postgres — rätt statuskod, rätt skrivning, rätt avvisning | Att frontend anropar den korrekt; att en människa kan slutföra flödet i en webbläsare |
| `e2e` — **de 2 verkligt realistiska filerna** | Att HELA kedjan hänger ihop: webbläsare → riktig inloggning → riktig serverfunktion → riktig databas. **Den enda nivån som kan visa detta** | Bredd. För dyrt och för skört för mer än ett fåtal flöden |
| `e2e` — de övriga 32 | Delmängder: allt från ren webbläsarmekanik till nästan helt mockad backend i en fil som ändå betalar mutexpriset | Det filändelsen lovar |
| `kontraktsvakt` (10 tester) | Att fixturens ANTAGNA svarsform matchar den riktiga — **för 7 av 18** | Beteende (kör aldrig appen). Och bara FORM-drift, aldrig betydelse-drift |
| `visual` (322 tester) | Pixel-exakt regression i sex facit-tunga vyer | Allt annat — **och den körs i dag inte automatiskt alls** |

**Vad det betyder i praktiken.** Marcus princip — testa det mesta snabbt och
isolerat, och ett litet antal kritiska flöden genom hela kedjan — är
genomförd till hälften. Den hermetiska halvan finns och grindar merge; den
är byggd, bevisad och fungerar. Den realistiska halvan finns knappt: det
"lilla antalet kritiska flöden" är i praktiken **två**, och de valdes inte
för att de var repots högsta risk utan för att någon råkade bygga en funktion
som krävde ett äkta flöde.

Samtidigt saknar den hermetiska sidan ett tak. Acceptance-klassen växte från
18 filer till 61, och 98 procent på två veckor i september — tillräckligt för
att slå i sin tidsgräns och sparka en PR ur kön två gånger. Åtgärden blev att
dela klassen i tre, inte att sätta en gräns.

### Fråga 3 — Kan CI bli grönt trots att ett relevant test har hoppats över?

**Svaret har två halvor, och båda måste stå.**

#### Före merge: nej

Detta är den bäst belägda slutsatsen i hela granskningen. Grinden är
konstruerad så att den **räknar misslyckanden** och säger ifrån, i stället för
att leta efter framgångar och tiga när de uteblir. Skillnaden låter liten och
är avgörande — den är resultatet av en verklig olycka 2026-07-23, då en trasig
ändring slank igenom på exakt den punkten.

Fyra oberoende angreppsvägar prövades och gav samma svar:

1. Ett villkor som faller fel — kan inte inträffa utan att klassningsjobbet
   självt blir rött, vilket fäller paraplyet.
2. Ett beroende som drar med sig sina barn — klassningen står kvar i
   paraplyets egen lista och fäller det.
3. Ett `continue-on-error` som maskerar rött — finns inte i någon av de två
   filerna, och båda bär utskrivna förbud mot att införa det.
4. Ett hoppat jobb inuti den anropade sviten — ett hoppat inre jobb gör inte
   anropet rött, men ett **rött** inre jobb gör det. Bekräftat i verkliga
   körningar åt båda håll.

Därtill prövades **46 konstruerade ändringsscenarier** mot klassningens
verkliga mönster. Inget gav "borde ha kört men hoppades, och ändå grönt". En
okänd katalog, en fil utan filändelse och en tom lista faller alla tre till
full körning.

Regeln är skriven som en lista över vad som FÅR hoppa, inte vad som är
förbjudet. Allt nytt och okänt hamnar därför automatiskt i den försiktiga
högen. Det är rätt konstruktion.

#### Efter merge: ja — mätt, och mekanismen är fastställd

**Sextio kodlandningar på fyra veckor fick aldrig den kontroll som bara
finns efter merge** (rättat efter orkestrerarens stickprov S30/KG1 — se
nedan för hur talet 60 förhåller sig till "femtiofem").

Så här går det till. Merge-kön kan landa upp till tre köade ändringar i EN
enda leverans till huvudgrenen. Bara den översta commiten utlöser en
push-händelse, och efterkontrollen klassar bara den översta: *"körde
PR-grinden sviten?"* Är den översta en ren textändring hoppas sviten över,
körningen blir grön — och kodändringen UNDER den får aldrig staging-provet
eller tillgänglighetsprovet.

Mätningen, i fyra steg (orkestrerarens eget stickprov S18):

| Steg | Utfall |
|---|---|
| Landningar på `main` jämförda mot efterkontrollens körningar | **85 av 686 (12,4 %) saknar körning helt** |
| Följdes de av en ny landning? | Alla 85 inom 15 minuter (6 inom 5 sekunder) |
| Vilka är de? | 14 är själva textändringar · **55 är kodändringar följda av en textändring** · 16 är kod följt av kod |
| Vad visar de saknade commitsen? | En enda körning var: `CI [merge_group]`. Ingen push-händelse alls för den SHA:n |
| Vad gjorde efterföljaren? | Grön, med *"Verifierande svit på det mergade trädet: skipped"* — i båda stickproven |

**Skärpt i S30 (KG1):** av de 85 är **60 de verkliga hålen** — bara de fall
där toppen är en textändring OCH spannet under faktiskt bär kod (en delmängd
av ovanstående 55+16, korsgranskad mot koddiffen i stället för bara
grenprefix). KG1 mätte också exponeringsfönstret direkt: alla 60 täcktes av
nästa kod-landning, median 0,57 timmar, längst 33 timmar.

**Hur allvarligt är det?** De hermetiska klasserna KÖRDE på kodändringen —
både på kö-ytan OCH, vid en grupplandning, via `push`-ytans körning som
klassar hela det pushade spannet (S30; se § 8.5/Del 2 D1 om den körningens
roll). Det som uteblir är det efterkontrollen ensam tillför: riktig databas,
riktig inloggning, tillgänglighetsgranskning, städning. Men det är precis
den kontrollen ADR-077 gör till VILLKORET för att presubmiten får hoppa
tester — och det enda återstående nätet, natten, har varit rött i femtio
dygn.

För 60 kodlandningar på fyra veckor har alltså ingen verklig kedja för
staging och a11y prövats med ett läsbart utfall. **Det är uppdragets
farligaste felklass — grönt trots att ett relevant test aldrig kördes — och
den sitter inte där någon letade.**

En tidigare förklaring (att en efterföljande push AVBRYTER den pågående
sviten) är falsifierad: grupperingen är per commit-SHA, så ingenting kan
avbrytas. Kortet `TASK-365` (High, To Do) beskriver symptomet men bär en
delvis falsifierad rotorsak. **Fynd i S30 (KG1):** rätt mekanism — att
`post-merge.yml` bara läser toppens `HEAD^2` och aldrig hela spannet — stod
redan nedskriven i tråden `T166` (2026-08-21, pausad,
`tasks/threads/README.md:209`), fyra veckor innan denna granskning
återupptäckte den. `TASK-365` och `T166` pekade inte på varandra: ett
högprioriterat kort med fel rotorsak, bredvid en pausad tråd med rätt.

**Och en tredje instans, mindre men äkta.** Före `TASK-15` saknade
klassningen en inställning som gjorde att filnamn med å, ä och ö inte
matchade mönstren. Följden: dokumentationsjobbet blev TYST HOPPAT på en äkta
dokumentationsändring — filens egna ord. Det är lagat på fyra ställen, men
**ingen grind kräver att fixen finns kvar**. Tas raden bort ur ett steg
återkommer felet tyst.

### Fråga 4 — Hur ofta orsakar testflödet falska stopp eller kräver eget underhåll?

**Kort svar för en oteknisk läsare:** falska stopp i klassisk mening — testet
säger nej utan anledning — är **ovanliga**. Repots eget mätverktyg hittade
**noll bevisat flakiga körningar av hundra**. Det är ett bättre tal än de
flesta projekt kan visa.

Men just nu säger portvakten nej till nästan allt, av två skäl som inte har
med det som bärs in att göra: en äkta säkerhetsvarning i ett beroende (13 av
15 röda körningar) och en klocka som glider sedan ett visst klockslag
2026-09-16 (4 av 15). Båda är kända, förstådda och små att åtgärda. Sedan
2026-09-09 är **14 av 14** körningar röda och huvudgrenen har inte rört sig
sedan 2026-09-08.

Det är en viktig skillnad: en portvakt som slumpmässigt säger nej är svår att
laga. En som har exakt två saker att laga är inte opålitlig — den är
blockerad.

#### Falska stopp, i tal

| Mått | Värde | Källa |
|---|---|---|
| Röda körningar av 100 | 15 (Wilson 95 %: ~9–24 %) | `metrics:ci`, 2026-09-17 |
| **Bevisat flakiga** (rött → grönt på omkörd identisk kod) | **0 av 100** | samma |
| Rödhet orsakad av EN känd säkerhetsvarning | 13 av 15 (87 %) | samma, källa läst per instans |
| Rödhet orsakad av EN känd klockbugg | 4 av 15 (27 %) | `hem.acceptance.test.ts:281` |
| Avbrutna körningar (ny push ersatte en pågående) | 15 av 31 i stickprovet (48 %) | **Egen kategori** — de utvärderade aldrig något |
| Äkta fel i diffen | 2 av 31 (6 %) | `34247598715` m.fl. |
| Öppen, äkta flake | **1** (`TASK-418`, ordningsberoende, mätt 2026-09-06) | backlog |

#### Omkörningar

Två automatiska omkörningar i CI, noll lokalt. Historien här är ovanligt
ärlig och förtjänar att lyftas: den ursprungliga motiveringen ("absorbera
infrastrukturbrus utan att maskera äkta fel") **falsifierades av egen
mätning** — omkörningarna maskerade ett äkta race, 14 av 22 jobb rapporterade
internt "flaky" utan att bli röda. Beslutet blev ändå att behålla dem, som ett
medvetet och kostnadskänt val, med två motvikter: en egenbyggd rapportör
skriver en synlig rad i loggen, och lokalt är omkörningar helt avstängda.

I dagens data maskerar de ingenting, eftersom felen är deterministiska — alla
tre försök faller identiskt. Men **ingen mekanism läser "N flaky"-raden och
sammanställer den över tid**; de mätningarna gjordes för hand.

#### Eget underhåll

| Mått | Värde | Märkning |
|---|---|---|
| `ci.yml` ensam | 116 commits / 15,4 veckor ≈ **7,5 ändringar per vecka** | verifierad |
| Hela CI-ytan | 813 av 6 498 commits (**12,5 %**) | verifierad |
| Landningar på `main` som rör CI-ytan (ej PR:er — S27) | 506 av 2 251 (**22,5 %**) över sju veckor, stabilt 15–30 % per vecka | verifierad |
| Andel av CI-arbetet som är KORRIGERING av tidigare CI-arbete | **~40 %** | starkt indikerad (45–50 PR:er lästa) |
| Andel av arbetets fokus på CI/process | 20–35 % (trovärdig mitt), 15–60 % (yttre proxyer) | osäker, öppet redovisad |
| Avtagande trend? | **Nej.** Veckorna 31 och 35 ligger långt in i perioden | verifierad |

#### Tid från rött till förstådd orsak

Frågan har två svar och det ena ljuger. Tid till stängt ärende: median 16,6
respektive 44,4 timmar, p90 upp till 257 timmar (10,7 dygn). Men det måttet
mäter administrativ eftersläpning, inte förståelse: i ett belagt fall var
orsaken förstådd och åtgärdad **samma dag**, medan ärendet stod oskrivet i tio
dygn tills en senare session skrev in facit i efterhand. Femton ärenden till
följer samma mönster.

Ett bättre mått — tid mellan att ett problem uppstår och att en åtgärd landar
— ger: samma dag för de två historiska flake-utredningarna, samma dag för
npm-latensen. **För dagens klockbugg och säkerhetsvarningar: ännu inte
åtgärdade.**

### Fråga 5 — Vilka delar är en generell CI-produkt och vilka är specifika för just denna app?

**Kort här — leverabel 10 äger den fulla klassningen.** Ett stickprov på ~20
komponenter (J8.8 § 6) ger tre grupper plus en fjärde som uppdragets
ursprungliga indelning saknade fack för:

| Klass | Antal i stickprovet | Exempel |
|---|---|---|
| **Generell, eller generell med config** | ≈9 | `ci.yml`:s huvudstruktur, `ci-suite.yml`, natt- och post-merge-mönstren, `check-frontmatter.sh` (**bevisat portabel** — kopierad till hubben, noll skillnad i körbar logik), de universella hookarna |
| **Produktspecifik** | ≈3 | `fas4-prod-deploy.sh` (57 namngivna serverfunktioner), fixturvärlden, kontraktsvakten |
| **Processpecifik** | ≈8 | Facit-kedjan, arbetsform-tillstånd, review-loopen, backlog-wrappern, agent-definitionerna, bevis-workflowsen |
| Föräldralös | 1 | `scripts/verify-phase-1.ts` — ingen mekanism anropar den |

**Den viktiga observationen** är den fjärde kategorin. En betydande del av det
som ser ut som CI-komplexitet är i själva verket **agent-orkestreringens**
komplexitet — den löser problem som arbetssättet självt skapat, inte problem
produkten eller en branschstandard kräver. Den kategorin följer sannolikt med
till ett framtida andra produktrepo (samma arbetsform används där), medan de
produktspecifika delarna uttryckligen inte ska det.

**Och spridningen har aldrig skett.** Exakt en grindvakt är kopierad, och den
kopian har redan glidit i ett faktiskt policyvärde efter mindre än sex veckor.
Hela installationsguiden för ett nytt repo är en kommentarsrad inuti det
skript som ska kopieras.

## Del 5 — Domen över slutfrågan

Marcus slutord (uppdraget rad 393): frågorna avgör *"om vi har byggt en
välmotiverad kvalitetsplattform eller en mycket avancerad maskin vars
komplexitet har börjat motivera sig själv."*

Underlagen drar åt olika håll, och den spänningen ska bäras, inte slätas ut.
`j1f` skriver att konfigurationen *"inte är en självrättfärdigande maskin —
den är i stort verifierat motiverad"*. `j8-8` landar på att evidensen
*"motiverar en medveten NEDSKALNINGS-övning snarare än ännu ett tillägg"*.
`j8-5` formulerar det skarpast: *"grindlogiken håller; skyddsnätet gör det
inte"*.

### Argumenten sida vid sida

| FÖR "välmotiverad kvalitetsplattform" | EMOT — "maskinen motiverar sig själv" |
|---|---|
| **Nästan varje mekanism är svar på ett mätt, namngivet fel.** Mönstret i lärdomsregistret är genomgående "hände två gånger → mekaniserades", inte spekulativ förbyggnad | **Ändringstakten avtar inte.** 7,5 ändringar/vecka på `ci.yml` i snart fyra månader; de två högsta veckorna ligger långt in i perioden. En färdigbyggd grund borde plana ut |
| **Grindlogiken är den bäst belagda delen av hela systemet.** Rulesetet mätt tre gånger oberoende med identiskt resultat; paraplyet prövat i båda riktningar; 46 hotscenarier, noll hål | **~40 % av CI-arbetet är korrigering av tidigare CI-arbete.** Fem ytor fixade 3–4 gånger var på sju veckor. Arbetet ger inte varaktig avkastning |
| **Skalan motiverar mekaniken.** Omkring 2 200 PR:er, varav omkring 2 100 landade (rättat efter orkestrerarens stickprov S27 — inte "~2 500"), på fyra månader, 6 498 commits, 1 589 färska agent-spawns på 51 dagar. Merge-kön och review-grinden löser specifikt "flera agenter landar kod samtidigt" — ett problem en ensam människa aldrig har | **En tredjedel av ytan skyddar ytan själv.** 34 582 rader (32 %) är testsviter för grindvakternas egen logik. Kvoten mot produktkoden är 0,95:1 |
| **Den höga kommentarandelen är en investering i begriplighet** — 78,5 % i `ci.yml`. Varje regel bär sitt eget "varför står detta här" | **Ingen kan ändå förstå helheten.** Minsta säkra läsmängd ≈5 900 rader, spridda över fyra ojämnt underhållna ytor plus 30 beslutsdokument |
| **Frånvaron av kopiering är disciplin, inte slöseri.** Apparaten har inte spridits till repon som inte behöver den | **En växande del löser problem arbetsformen själv skapat.** Åtta av tjugo stickprovade komponenter är processpecifika — komplexitet som föder komplexitet i en sluten cirkel |
| **Kontrollerna har fångat verkliga fel.** Malware-paketet, fyra säkerhetsvarningar, den röda PR:en, testevent i Lottas eventväljare, granskarens fynd före merge | **Men bara fyra jobb av ~35 kan peka på ett verkligt fel.** Sju av fjorton produktionsfel hittades av Marcus i appen, inte av något test |
| **Avvägningarna är medvetna och utskrivna.** Staging flyttad ur presubmiten med en mätt 25-minutersincident som skäl; fail-fast prövat och räknebart avfärdat | **Villkoret för den avvägningen infrias inte.** Nätet under den har varit rött 51 av 52 nätter. En medveten avvägning vars förutsättning fallit är inte längre en avvägning |

### Min bedömning — öppet märkt som bedömning

**Detta är en välmotiverad kvalitetsplattform med fel proportioner.** Den är
inte självmotiverande i sin avsikt: jag har inte hittat en enda mekanism som
byggdes utan ett skäl, och skälen är genomgående utskrivna, daterade och
spårbara till en verklig händelse. Det är ovanligt, och det ska sägas.

Men **ingen mekanism i hela systemet frågar någonsin om SUMMAN av alla
välmotiverade tillägg fortfarande är proportionerlig.** ADR-baren prövar det
enskilda beslutet. Review-loopen prövar den enskilda ändringen.
Lärdomsregistret fångar det enskilda misstaget. Ingenting prövar helheten —
och det är därför denna session finns.

#### Marcus läsning, prövad mot evidensen

Uppdraget ber mig pröva en möjlig läsning: *maskinen är tyngst där den
skyddar minst, och tunnast där produkten faktiskt är utsatt.*

**Den stämmer, i huvudsak — men inte överallt, och avvikelserna är viktiga.**

**Där den stämmer:**

- **Efter merge, deploy, mail, Edge Functions** — exakt de fyra ytorna där
  produkten möter verkligheten. 60 kodlandningar utan efterkontroll (rättat
  efter S30/KG1 — tidigare "55"); ingen vakt på att `main` når Lotta;
  mailflödet utan verklighetstest på någon nivå; 111 av 135 Deno-filer utan
  typkontroll. Fyra tunna punkter, alla mätta, alla där en användare
  faktiskt kan drabbas.
- **Processgrindarna** — fjorton dokumentationsgrindar (tio av dem alltid-på),
  tre nattliga städkontroller som ensamma håller nattnätet rött, varav en
  redan beslutad att rivas. De skyddar aldrig appen.
- **De fyrdubbla körningarna, och dedupen som bara träffar var sjätte
  kod-landning** (3 av 20, rättat efter orkestrerarens stickprov S20) — ren
  kostnad, i praktiken nästan inget skydd.

**Där den INTE stämmer, och det är tre viktiga undantag:**

1. **Det dyraste jobbet skyddar något äkta.** Självtestet är den kritiska
   vägen (92–98 % av väntan), men det bevisar att 524 tester inte är tomma —
   och det har fångat en verklig felklassning. Läsningen "tungt = skyddar
   lite" faller här. Det tunga är däremot **känt, kortat med hög prioritet
   (`TASK-366`, skapat 2026-09-02) — och taket höjdes 12→20 minuter dagen
   efter i stället för att orsaken åtgärdades** (rättat efter orkestrerarens
   stickprov S25 — inte "av misstag"): det körs odelat medan klassen det
   speglar körs delad i tre. Kostnaden är en känd, femton dagar gammal öppen
   skuld, skyddet är essentiellt.
2. **De 75 testsviterna för grindvakterna ser ut som ren självspegling men
   är det inte.** En grind som slutar fälla ser exakt likadan ut som en grind
   utan något att fälla. Utan sviterna hade ingen vetat vilket. Det är den
   dyraste enskilda posten i radräkningen (32 %) och en av de få som
   verkligen bär sin vikt.
3. **Grindlogiken själv är varken tung eller tunn — den är rätt.** Fem
   oberoende säkerhetslager, fail-closed genomgående, 46 hotscenarier utan
   hål. Att den är den mest granskade delen av systemet och också den
   friskaste är ingen slump: den fick en verklig incident 2026-07-23, och den
   incidenten betalade för sin egen lagning.

**Skärpningen av läsningen, som evidensen bär:** maskinen är inte tyngst där
den skyddar minst. Den är **tyngst där den skyddar SIG SJÄLV, och tunnast där
produkten möter verkligheten.** Det är en annan diagnos med en annan åtgärd:
problemet är inte att de tunga delarna är onödiga, utan att ingen har flyttat
resurser från den inre ringen till den yttre.

### Gjorde jag rätt som byggde detta så tidigt?

Marcus egna ord, 2026-09-17: *"det enda jag ser och märker av är ju väntan på
alla tester, omkörningar och fel som uppkommer och som måste få en resurs.
Jag har länge funderat på om jag gjort rätt eller fel genom att bygga upp en
sådan här test-arkitektur så tidigt i projektet, jag ser att många proffs
liksom kör direkt-PR väldigt långt in i projekten och kan därför jobba mycket
snabbare och 'produkt-effektivare', vi har ju ganska stor fast overhead som
tar mycket resurser, och ganska (som jag uppfattar det i alla fall) lång
ledtid."*

Detta avsnitt går att läsa utan resten av filen. Tre saker hålls isär: vad
overheaden faktiskt ÄR, vad den har KÖPT, och var gränsen går.

#### 1. Vad overheaden faktiskt är, i tal

**Väntan på maskinen, för en kodändring som landar:**

| Steg | Tid | Märkning |
|---|---|---|
| Körningen på ändringsförslaget (PR-ytan) | 12,5 min median, 13,8 min p95 | verifierad |
| Körningen i kön — **samma tester, samma kod, i SEKVENS efter den föregående** | 12,5 min median | verifierad |
| **Summa ren maskintid före landning** | **≈25 minuter** | verifierad |
| Körningen på huvudgrenen vid landning | +12,5 min — **tillför bevisligen ingenting vid en ENSAM landning; vid en grupplandning klassar den hela spannet** (rättat efter S30/KG1) | verifierad (S11, S30) |
| Efterkontrollen | 16,0 min median, 32,2 min p90, upp till 56 min | verifierad |
| Granskningsrundor (agent + eventuell andra runda) | ej mätt i minuter; rundtaket är 2 | ej verifierbar |
| **PR skapad → mergad, totalt** | median **40,5 min**, p90 146,2 min | starkt indikerad |

Marcus upplevelse av "ganska lång ledtid" är alltså korrekt, och den är
underskattad snarare än överdriven: de 25 minuterna före landning är ren
maskintid som inte kan förkortas genom att arbeta snabbare.

**Men 92–98 procent av den väntan är ETT jobb.** Egen mätning, 3 av 3
körningar: självtestet tar 12,8–13,7 minuter av en total på 13,6–14,0. Allt
annat — lint, bygge, säkerhetsgranskning, de tre acceptance-delarna,
webbläsartesterna, dokumentationsgrindarna — göms bakom det och kostar
praktiskt taget noll extra väggklocka.

**Omkörningar och falska stopp:**

| Mått | Värde |
|---|---|
| Bevisat flakiga körningar | **0 av 100** |
| Röda körningar | 15 av 100, varav 13 en känd säkerhetsvarning och 4 en känd klockbugg |
| Grenar som fick mer än en körning | 41 av 121 (**34 %**) — en gren fick 14 körningar på 5 h 46 min |
| Avbrutna av en ny push | 15 av 31 i stickprovet (48 %) — utvärderade aldrig något |

Iterationen är den enskilt största posten i den totala minutvolymen. Det är
arbetets natur, inte ett fel — men tio fulla körningar à 12–14 minuter för EN
logisk ändring är en kostnad värd att se.

**Den fasta kostnaden i underhåll:**

| Mått | Värde | Märkning |
|---|---|---|
| Landningar på `main` som rör CI-ytan (ej PR:er — rättat efter orkestrerarens stickprov S27) | 506 av 2 251 (**22,5 %**), stabilt 15–30 % per vecka | verifierad |
| `ci.yml` ensam | **7,5 ändringar per vecka** i snart fyra månader | verifierad |
| Andel av arbetets fokus på CI/process | **20–35 %** trovärdig mitt | **proxy — ingen tidrapportering finns** |
| Andel av CI-arbetet som är korrigering av tidigare CI-arbete | ~40 % | starkt indikerad |
| Pengar | **0 kronor.** Repot är publikt | verifierad |

Ungefär var femte PR rör maskinen i stället för produkten, och den andelen
har inte sjunkit på fyra månader.

#### 2. Vad den har köpt

**Vad grindarna bevisligen stoppade:**

- Ett publicerat **skadligt npm-paket** i maj 2026, innan det installerades.
- **Fyra verkliga säkerhetsvarningar** sedan dess, var och en blockerade
  landning tills den åtgärdades.
- **En röd PR som mergades** 2026-07-23 — hålet upptäcktes, lagades samma
  dag, och lagningen har ett eget tvåsidigt självtest.
- **151 kvarliggande testevent** som syntes som kommande event i Lottas
  eventväljare — hon valde ett och fick en tom vy.
- **Verkliga fynd från granskaren före merge**: ett felmeddelande som aldrig
  nollställdes, felaktiga premisser i produktbeskrivningar.

**Vad som nådde prod ändå, och hittades av Marcus:**

Sju av fjorton incidenter hittades av Marcus när han använde appen — inte av
något test. Bland dem: betalningsraden som försvann ur kön vid flikbyte,
bilagenamn som rann 584 pixlar utanför sitt kort i fem dagar, en plockare som
aldrig visade avmarkerade personer, inbjudningslänkar som landade på fel
sida. **Alla utom en av dessa var fel som inget generiskt test hade kunnat
förutse** — de är designval och arkitekturval, inte kodfel.

Det är en obehaglig men viktig symmetri: apparaten fångade **noll** av de fel
som faktiskt drabbade Lotta. Den fångade leverantörsfel, sina egna fel, och
testartefakter.

**Det kontrafaktiska — är jämförelsen med "proffs som kör direkt-PR" rättvis?**

Jag prövade resonemanget mot evidensen i stället för att anta det, och det
håller inte — men inte av det skäl man först tror.

Det som skiljer är inte teamstorlek. Det är **vem som håller ändringen i
huvudet**. En människa som kör direkt-PR är författare till sin egen kod: hon
vet vad hon ändrade, varför, och vad som kan gå sönder. Grinden är för henne
ett skyddsnät under en förståelse som redan finns.

I detta arbetssätt finns ingen sådan förståelse någonstans:

| Mätt faktum | Belägg |
|---|---|
| Omkring 2 200 PR:er, varav omkring 2 100 landade, på fyra månader (rättat efter orkestrerarens stickprov S27 — inte "~2 500") | GraphQL-mätningen i S27 (`underlag/01-orkestrerarens-stickprov.md`) |
| **Noll mänskliga godkännanden krävs per PR** (`required_approving_review_count: 0`, `CODEOWNERS` rådgivande) | ruleset mätt 2026-09-17 |
| 1 589 färska agent-spawns på 51 dagar, varav 767 bygg-agenter | `agent-spawn-log.jsonl` |
| Varje bygg-agent arbetar i egen isolerad katalog och **återvänder aldrig** | `.claude/agents/bygg-agent.md`; ADR-096 |

**Författaren till en ändring i detta repo är en agent med färsk kontext som
aldrig kommer att se konsekvensen av sitt arbete.** Den kan inte kallas
tillbaka, kan inte lära sig av en bugg som visar sig tre dagar senare, och
har ingen minnesbild av systemet utöver vad den läste den turen.

I det läget ÄR grinden granskaren. Den är inte ett skyddsnät under en
mänsklig förståelse — den är den enda instans som finns som läser hela
ändringen mot hela systemet. Jämförelsen med "proffs som kör direkt-PR" mäter
alltså fel storhet: de har en människa i loopen per ändring. Här finns ingen,
per konstruktion och med avsikt.

Det stärker argumentet för merge-kön, för review-grinden, för slutgrindens
fail-closed-konstruktion och för de hermetiska klasserna. **Det stärker inte
argumentet för fyra körningar av samma träd, för tio dokumentationsgrindar på
en kodändring, eller för ett odelat självtest.**

#### 3. Var gränsen går

**Den nödvändiga kärnan för ett agentdrivet flöde** — det som inte kan skäras
utan att flödet blir osäkert:

| Del | Varför den är kärna | Kostnad i dag |
|---|---|---|
| Slutgrinden, fail-closed | Enda mekaniska instansen mellan en agents arbete och `main`. Har bevisligen behövts | 3 sekunder |
| Merge-kön | Löser "flera agenter landar samtidigt" — problemet arbetsformen skapar | ingen egen tid |
| Lint + typkontroll | Billigast som finns, och var själv trasig en gång utan att någon märkte det | 3,6–4,0 min, dold bakom självtestet |
| Beroendegranskningen | Den enda kontroll med belagd, upprepad fångst av verkliga fel | 25–34 sek |
| Pure + Build, Acceptance (hermetisk) | Det enda som prövar att appen faktiskt beter sig rätt | 0,9 min + 4,2–6,0 min, parallella |
| Det tvåsidiga beviset (skyddet, inte kostnaden) | Utan det kan 524 tester vara tomma och ingen vet | **13,7 min — se nedan** |
| Review-grinden | Enda instansen som läser en hel ändring. Ersätter en människa som inte finns | ingen egen CI-tid |
| Prod-låsen (hookar mot prod-databas, prod-ref) | Stoppar det CI aldrig ser. En agent nådde prod-basen skarpt en gång | noll |

**Overhead som kan skäras utan att kärnan försvagas**, i minuter och rader:

| Vad | Vinst | Risk att skära |
|---|---|---|
| **Dela självtestet i tre**, som klassen det speglar | **~8 min per körning → ~16 min per landning.** Kritisk väg från ~13,7 till ~5–6 min | Kräver att domen slås ihop över delarna — designfråga, inte flagga. Skyddet behålls oförändrat |
| **Riv körningen på huvudgrenen vid landning** (`CI [push]`) | 12,5 min per ENSAM landning, där den tillför noll | **Inte låg, och inte först** (rättat efter orkestrerarens stickprov S30 och S31): vid en grupplandning är det denna körning som klassar hela det pushade spannet och kör de hermetiska klasserna för kod som landat under en text-topp — sett live 2026-09-17. Får röras först när efterkontrollen klassar hela spannet; åtgärdsplanen (leverabel 11) väger den |
| **Byt merge-dedupens fråga** (SHA-identitet mot kön, i stället för träd-identitet mot PR-huvudet) | ~40 rader, ett behörighetsgrant, en egen felklass | Dedupen träffar redan 3 av 20 kod-landningar (15 %; KG1: 32/32 där den kan göra nytta, S30), inte noll (rättat efter orkestrerarens stickprov S20); dess nuvarande motivering (`strict`) föll 2026-08-05. **KG1:s fälla (S30):** villkoret får aldrig vara "grön körning på samma SHA" (på post-merge-luckans 60 hål är kö-körningen grön med sviten hoppad) — det måste vara "sviten körde och var grön", och bytet görs EFTER post-merge-klassningen är lagad, inte före |
| **Flytta de tio alltid-på dokumentationsgrindarna** till docs-villkoret | Sekunder per körning, men rätt signal: en kodändring ska inte fälla på lesson-numrering | Låg — de fäller ändå på varje dokumentationsändring |
| **Villkora beroendegranskningen** mot att beroendeträdet ändrats | ~30 sek per textändring | **Medel — pröva noga.** Jobbet är medvetet oberoende av klassningen sedan `TASK-395`, och den avvägningen är en säkerhetsfråga, inte en kostnadsfråga |
| **Riv de två döda klassnings-utdata** | Beräknas varje körning, styr ingenting | Ingen |
| **Skilj processgrindarna från testsviten i nattnätet** | Gör "natten är röd" till en signal igen | Ingen — och en av de tre är redan beslutad att rivas |

**Summan av de säkra posterna:** en kodändrings väntan före landning faller
från ~25 minuter till **~12**, och maskinen blir enklare, inte mer
komplicerad. Ingen av dem rör kärnan.

#### Domen på Marcus fråga, tvådelad

**Rätt att bygga grinden tidigt. Fel proportioner i vad som lades bakom den.**

Det var **rätt** att bygga en mekanisk grind tidigt, och rättare än det
kändes. Ett arbetssätt där 5–15 AI-agenter landar omkring 2 100 PR:er (av
omkring 2 200 öppnade) på fyra månader (rättat efter orkestrerarens
stickprov S27 — inte "2 500") med noll mänskliga godkännanden har ingen
annan instans som läser en ändring.
Jämförelsen med proffs som kör direkt-PR håller inte: de har en människa per
ändring, och här finns ingen. Grinden ÄR granskaren. Utan merge-kö och
fail-closed-aggregator hade parallella agenter kolliderat i `main` — och den
ena gången grinden hade ett hål mergades faktiskt en röd PR.

Det var **fel** att låta det som växte bakom grinden växa utan ett tak.
Acceptance-klassen gick från 18 filer till 61; e2e-katalogen blev ett
historiskt sediment där 32 av 34 filer inte gör vad namnet lovar; samma träd
testas fyra gånger; det dyraste jobbet är dyrt av en delning som stannade
halvvägs; och fjorton dokumentationsgrindar hamnade i samma hög som
produktskydd. Ingen av de tillväxterna var ett beslut. De var frånvaron av
ett.

**Och den känsla Marcus beskriver är korrekt kalibrerad mot det han ser.** Han
ser väntan, omkörningar och fel som kräver en resurs — och det är precis vad
overheaden består av, eftersom pengarna är noll och underhållet är osynligt
tills något går sönder. Det han INTE ser är att ungefär hälften av väntan går
att ta bort utan att något skydd försvinner, och att den mest värdefulla delen
av apparaten (grindlogiken) är den billigaste.

**Rekommendationens riktning är därför inte "riv" utan "flytta".** Inre ringen
— maskinen som skyddar maskinen — är tillräckligt byggd. Den yttre ringen,
där produkten möter Lotta, är tunn på fyra mätta punkter. Den nedskalning
`j8-8` efterlyser och den förstärkning produktriskerna kräver är samma
åtgärd, inte två konkurrerande.

## Osäkerheter och vad jag inte kunde belägga

- **Delningen av självtestet är inte prövad som säker.** Jag mätte att jobbet
  är odelat och att klassen det speglar är delad i tre, och jag räknade vad en
  delning skulle ge. Jag har **inte** verifierat att domen (`bedomPositivt`)
  kan slås ihop över delar — den avvisar uttryckligen en tom testmängd, och en
  delning ändrar vad "tom" betyder per del. **Vad som krävs:** en läsning av
  `scripts/hermetik-sjalvtest.mjs` § domslogik plus ett kastbart prov.
- **Granskningsrundornas bidrag till ledtiden är inte mätt i minuter.**
  Rundtaket är 2 och instrumenteringen finns sedan `TASK-173.6`, men
  `docs/reference/review-instrumentering.jsonl` gäller först från den skivan
  och de 14 skarpa körningarna från S112 är inte backfyllda. **Ej verifierbar**
  utan att läsa loggen, som kan vara ospårad i en agents arbetskatalog.
- **Jag har inte omprövat de underlag jag syntetiserar, utom där det står
  utskrivet.** Mina egna mätningar gäller den kritiska vägen (3 körningar),
  dokumentationsgrindarnas fördelning, `docs`-jobbets villkor, frågeantalet
  och fyra skriptantal. Allt annat bär sin källas märkning, inte min.
- **Klassningen i Del 4 fråga 1 är min egen bedömning per jobb**, byggd på
  J8.1:s incidentregister och J1a/J1b:s jobblistor. En annan granskare skulle
  sannolikt flytta 3–5 rader mellan B och C. Klasserna A och D är fastare:
  A kräver en namngiven händelse, D betyder att jag inte hittade något.
- **Andelen av utvecklingstiden (20–35 %) förblir en proxy.** Ingen
  tidrapportering finns i detta arbetssätt, och det är själva skälet till att
  uppdraget bad om proxyer. **Ej verifierbar** utan en mekanism som inte
  existerar.
- **Jag har inte prövat om de fyra ytorna med tunt produktskydd (efter merge,
  deploy, mail, Edge Functions) faktiskt har orsakat fel som nått Lotta.**
  Incidentregistret visar fel i tre av dem (deploy, inbjudningslänkar,
  bilagenamn) men jag har inte kunnat koppla ett enskilt fel till den saknade
  efterkontrollen. Kopplingen är **starkt indikerad, inte verifierad**.
- **Nattnätets rödhet är klassad på två nätter, inte på alla 51.** S12 mätte
  09-15 och 09-16 och fann fyra röda jobb, samtliga processgrindar. Att
  mönstret gäller hela serien är starkt indikerat men inte uttömmande mätt.

## Risker

Risk-registret är **Del 3** ovan. Det står i sin ordning i stället för som en
efterhandsammanfattning, eftersom det är leverabelns tyngdpunkt: tretton
rangordnade risker i tre klasser, var och en med sannolikhet, konsekvens för
Lotta och hennes deltagare, nuvarande skydd, belägg och riktning.

## Rekommendationer

**Rekommendationer, aldrig beslut.** Marcus äger prioriteringen. Jag har hållit
dem proportionerliga och ordnat dem efter vad de kostar att göra mot vad de
ger — sex av elva river eller flyttar något i stället för att bygga nytt.

**Först, för att de har ett datum eller pågår:**

1. **Sätt ett larm för månad/år-gränsen (P1).** Det är den enda risken i hela
   registret som är SÄKER att inträffa, och den biter första gången någon
   planerar ett event med startdatum i januari 2027 — vilket kan vara i dag,
   inte om tre månader (rättat efter orkestrerarens stickprov S26). Antingen
   ett backlog-kort med förfallodatum, eller — bättre — konvertera fältet
   till en beräknad formel, som datamodellens egen fällpost redan föreslår.
2. **Laga klockbuggen och de två säkerhetsvarningarna.** Ett par rader
   respektive en beroendeuppgradering. De blockerar varje landning just nu och
   huvudgrenen har stått stilla sedan 2026-09-08.

**Sedan, för att de återställer signalvärde:**

1. **Skilj processgrindarna från testsviten i nattnätet.** Så länge natten är
   röd av backlog-kort är hela den riskanpassade presubmiten obevisad, eftersom
   ADR-077 gör nätet till dess uttryckliga villkor. Antingen två workflows
   eller två distinkta larm. Ge samtidigt nattlarmet en dedup-kontroll — den
   finns redan i två syskonjobb och saknas bara här.
2. **Stäng täckningsluckan efter merge (P2).** Låt efterkontrollen klassa HELA
   det pushade spannet i stället för bara toppen, och kör sviten om NÅGON
   landning i spannet är kodklassad. `TASK-365` finns och är plockbart.
3. **Ge post-merge-larmet en mekanisk eskaleringsväg.** Ett rött larm som står
   obesvarat längre än N timmar bör synas i heartbeat-svepet, inte kräva att
   någon råkar öppna ärendelistan.

**Sedan, för att de tar bort väntan utan att ta bort skydd:**

1. **Utred om självtestet kan delas i tre.** Största enskilda vinsten i hela
   granskningen: ~16 minuter per landning. Börja med domslogiken — se
   § Osäkerheter för vad som måste prövas först.
2. **Reducera körningen på huvudgrenen vid en ENSAM landning, och byt
   merge-dedupens fråga.** Vid en ensam landning tillför den förra noll
   (S11). **Preciserat i S30 (KG1): vid en grupplandning är den INTE
   overksam** — det är just den som klassar och kör mot hela det pushade
   spannet, och en ändring här måste bevara den täckningen. Dedupen träffar
   3 av 20 kod-landningar (15 %; KG1: 32/32 där den kan göra nytta, 5,3 % av
   601 pushar — S30), inte noll (rättat efter orkestrerarens stickprov S20)
   — men dess skrivna motivering (kravet `strict`) föll för sex veckor
   sedan. **KG1:s fälla (S30):** den enklare frågan får ALDRIG vara "har den
   landade commit-SHA:n redan en grön `ci.yml`-körning från kön?" — på
   post-merge-luckans 60 verkliga hål ÄR kö-körningen grön, med sviten
   HOPPAD. Frågan måste vara "sviten körde OCH var grön", och ändringen görs
   EFTER att täckningsluckan (P2, föregående avsnitts punkt 2) är lagad,
   aldrig före. Uppdatera ADR-077 § 2 i samma andetag.
3. **Flytta de tio alltid-på dokumentationsgrindarna** till docs-villkoret, och
   riv de två döda klassnings-utdata.

**Och sist, för att de gör nästa granskning onödig:**

1. **Bygg en vakt mot prosa som bär ett TAL eller påstår en FRÅNVARO.**
   ADR-083 vaktar prosa som påstår en mekanism. Fyra mätta instanser i denna
   granskning är den spegelvända felklassen — "alla sju bevakas" när det är
   arton, "18 spec-filer" när det är 61, "inte byggt" när det är byggt.
2. **Ge ADR-131 en brytdag.** Ett Accepted-beslut utan datum är en stående
   kostnad: grinden underhålls tills någon river den, och just nu städas 30
   kort i en grind som ska bort.
3. **Kuratera en namngiven lista över 5–15 kritiska realistiska flöden**,
   rankad efter risk — skrivvägar mot pengar, mot data som inte går att
   återskapa, mot extern kommunikation. `invite-rundtur.staging.test.ts` är
   mallen. Mailflödet (P4) är den mest uppenbara första kandidaten.

## Källor

**Granskningens egna filer** (samtliga i
`docs/research/ci-djupgranskning-2026-09-17/`):

- `underlag/00-agentkontrakt.md` — metodkontraktet, läst i sin helhet
- `underlag/01-orkestrerarens-stickprov.md` — arton stickprov, läst i sin
  helhet; styrande över agenternas filer
- `underlag/j8-1-produktionsfel-och-vad-som-skyddar.md`
- `underlag/j8-4-staging-och-e2e.md`
- `underlag/j8-5-grindlogik-skip-och-gront.md`
- `underlag/j8-6-stabilitet-flakighet-och-felsokning.md`
- `underlag/j8-7-tid-och-kostnad.md`
- `underlag/j8-8-underhall-och-andra-repon.md`
- `07-hermetiska-tester-kontra-realistisk-e2e.md` (färdig leverabel)
- `underlag/j1a-ci-yml-och-ci-suite.md`, `underlag/j1b-ovriga-workflows-och-github-katalogen.md`,
  `underlag/j1c-ci-wirade-skript-och-policyfiler.md`,
  `underlag/j1d-lokala-hookar-och-agentmekanismer.md`,
  `underlag/j1f-test-bygg-och-lintkonfiguration.md`
- `03-andringslogg.md`, `06-airtable-kompromisser-och-empiriska-fynd.md`
- `tasks/sessions/bilagor/s126-uppdrag/uppdraget-verbatim.md` rad 296–393

**Repo-filer jag läste själv** (sökvägar relativt repo-roten):

- `.github/workflows/ci.yml` — `2278–2292` (`docs`-jobbets villkor)
- `.github/workflows/ci-suite.yml` — `516–592` (självtest-jobbet)
- `scripts/check-docs.sh` — `130–160` (`run_gate`), `236–260` (de tio
  alltid-på grindarna)
- `scripts/hermetik-sjalvtest.mjs` — `60–110` (`--retries=0`, filter, domslogik)
- `playwright.config.ts` — `240` (omkörningar)

**Egna mätningar, samtliga 2026-09-17, samtliga läsande:**

- `gh run view 34265004584 --json jobs`, samma för `34248030069` och
  `34249685743` — jobbnivåtider, analyserade med ett eget Node-skript i
  scratch-området (kritiska vägen, § 8.7 fråga 2)
- `awk 'NR>=296 && NR<=382' …/uppdraget-verbatim.md | grep -c "^- "` → `53`
- `grep -n "^run_gate" scripts/check-docs.sh` → 10 i den alltid-på regionen
- `ls scripts/check-*.sh | wc -l` → `20`; `find scripts -name "check-*" -type f | wc -l` → `24`
- `ls scripts/test-* | wc -l` → `75`; `find scripts -type f | wc -l` → `186`
