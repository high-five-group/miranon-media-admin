---
owner: marcus803
updated: 2026-08-08
review_by: 2026-11-15
status: stable
---

<!-- vale Miranon.VueToReact = NO -->
<!-- DEFERRED: Session 6.6.6 — Miranon.VueToReact Vue→React-drift fix -->
<!-- vale Vale.Terms = NO -->
<!-- Per ADR-032 (Session 6.6.6 K3.5 2026-05-20): helfil-disable mot L_X.2 Vale 3.14.1-upstream-quirk, ärvd från tasks/lessons.md vid volym-splitten (TASK-161.9, ADR-085-formen). Brand-rule-aktivering bevarad — endast Vale.Terms täcks. Lift vid upstream-fix per ADR-032 § Lift-protokoll. -->

# tasks/lessons/vol-06.md — Universella lärdomar, volym 6

> **AKTIV volym** sedan uppdelningen 2026-08-08 · 2026-07-31 →  (L422–L479, senast fångad 2026-08-05/06): Alla nya lärdomar tillkommer SIST i denna fil som ### Lnnn-poster. Flat L-nummer-form.
>
> Ingång, uppslags- och append-regler: [`tasks/lessons.md`](../lessons.md) (indexet).
> Innehållet nedan är bevarat verbatim från uppdelningen 2026-08-08 (ADR-085,
> precedent-tillämpning av hubbens volym-split). Nya poster tillkommer SIST i denna fil.

---

## Fortsättning: flat L-numrering (ingen ny H2 per session i källan)

> Redaktionell rubrik, tillagd vid delningen (TASK-161.9) enbart för att
> hålla giltig rubrik-hierarki (H1 → H2 → H3) — källfilen hade ingen
> `## <datum> — Session N`-omslutning för denna sträcka (se indexets not om
> konventionsskiftet). Posterna nedan är verbatim; nya poster fortsätter
> tillkomma SIST i denna volym.

### L422 — En räkning utan utskrivna poster granskas aldrig

**Ett sammanfattande tal — "tre precedenter", "fyra fall", "nio grindar" — är
kontrollerbart bara om posterna står uppräknade bredvid det. Står talet ensamt
läser nästa person det som resultat i stället för som påstående, och citerar det
vidare utan att räkna om.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-31):** `ADR-081` § Ärlighet om underlaget summerade till
*"tre solida precedenter för principen"* — direkt efter en lista med **två**
poster. Talet motsades alltså av texten det sammanfattade, på samma sida, med tre
raders avstånd.

Felet överlevde **tre månader, två amenderingar och ett research-pass som läste
just den sektionen.** Passet skrev *"ADR-081:s tre precedenter är i praktiken två
för själva tilldelningen"* — det räknade om precedenternas **bärkraft** men ärvde
totalen `3` oprövad. Den som granskar ett tal på en axel antas ha granskat det på
alla.

**Varför den här klassen är svårare än en felaktig siffra i löptext:** ett
aggregat har ingen naturlig plats där det motsägs. En felräknad summa i en tabell
faller mot sina egna rader; ett tal i prosa har inga rader att falla mot. Det blir
sant genom upprepning — `docs/decisions/README.md`:s ADR-rad bar samma *"tre"* med
samma två uppräknade poster, och de två kopiorna bekräftade varandra.

**Formen som fångar det:** skriv aldrig ett aggregat utan att posterna står
bredvid, i samma stycke eller lista. Räknas något per kategori ska räkningen stå
per kategori — `tre för halva 1 (a, b, c) · tre för halva 2 (d, e, f)` är
granskningsbart; `tre solida precedenter` är det inte. Regeln kostar en rad och
gör talet falsifierbart av den som läser i stället för av den som skrev.

Besläktad: [[L394]] ·
[[L401]]

### L423 — En runtime-global i modulen låser hela filen från enhetstest-sviten

**Rör modulen `Deno.env` (eller motsvarande runtime-global) går den inte att
importera från en Node-buren testsvit — och då är ALL logik i filen otestbar,
inte bara den rad som rör globalen.** `[UNIVERSAL]`

**Empiri (S91, `TASK-53`, 2026-07-31):** 429-backoffen skulle enhetstestas med
mockad 429. En sondering visade att bara importera
`supabase/functions/_shared/airtable-client.ts` från `tests/api/` fäller
typecheck med **7 st `TS2304: Cannot find name 'Deno'`** — mätt, inte antaget.
Filen är i dag helt utanför alla `tsconfig`-program och därmed varken typkollad
eller testbar. Defekten hade kunnat leva i tre kopior i månader delvis av det
skälet.

**Motmedlet är inte en ambient-deklaration.** Att deklarera `Deno` i
tests-scopet hade dolt gränsen och dragit in hela filen i tests-programmet med
allt vad den bär. Rätt drag är att flytta den **rena kärnan** till en
runtime-fri modul: backoffen bor nu i `_shared/airtable-retry.ts` utan
`Deno.env` och utan global `fetch` (anropet injiceras), och blir därmed både
typkollad och enhetstestbar. Klienten behåller sina runtime-beroenden — de hör
hemma i adaptern, inte i logiken.

Bonusen är att en mekanism som fanns i tre copy-pastade kopior blev **en**:
"alla tre väntar lika" är efter flytten en egenskap hos koden i stället för ett
påstående om den. Testbarhets-tvånget pekade alltså på samma ställe som
djup-modul-principen redan pekade.

**Generaliseringen:** när en fil vägrar låta sig testas, läs vägran som en
uppgift om var modulgränsen borde gå — inte som ett hinder att kringgå.

### L424 — En vakt som ligger först i din egen kod är inte först i kedjan

**[UNIVERSAL]** Ett ordnings-krav mellan två vakter gäller bara det lager du
äger. Ligger en plattforms-grind framför din kod svarar den först — och ett
smoke-utfall som mäter hela kedjan kan då aldrig bekräfta ordningen du kodat.
Namnge lagret innan du formulerar kravet.

Datum: 2026-07-31 (TASK-38) | Källa: kravet löd "avvisar fel metod med 405 före
auth-kontrollen" för tretton Edge Functions — men `supabase/config.toml` sätter
`verify_jwt = true` på var och en, så Supabase-gatewayen svarar 401 på en
anropare utan giltig JWT innan funktionens kod körs över huvud taget.

Konsekvensen är smal men avgörande för hur kravet får läsas. Efter ändringen
gäller: *för varje anropare som når funktionen* avgörs metoden före
`requireUser`. En anonym begäran med fel metod får fortfarande 401 — från
plattformen, inte från oss. Discriminatorn som faktiskt mäter vår ordning är en
anropare som passerar gatewayen men faller i `requireUser`: anon-nyckeln är ett
giltigt JWT och är därför den enda proben som skiljer 405-före-auth från
auth-först. Det var precis den proben S84:s deny-smoke använde när den fann
asymmetrin (L331).

Två regler följer:

1. Skriv ut vilket lager som äger varje vakt när ordningen är ett krav. "Före
   auth" är otillräckligt när auth finns i två lager.
2. Välj proben efter vilket lager kravet gäller. En probe som fälls av det yttre
   lagret mäter aldrig det inre — den ser grönt eller rött av fel skäl.

Tredje ordningsledet är lätt att missa åt andra hållet: CORS-preflighten måste
fångas FÖRE metod-vakten, annars svarar funktionen 405 på varje `OPTIONS` och
browsern blockerar appen. Ordningen är alltså `handleCors` → metod → auth, och
bara mittenledet är nytt. Den invarianten är mekaniserad i
`tests/api/ef-metod-vakt.test.ts` — inte nedskriven som förhoppning.

### L425 — Två luckor i samma register kan ha motsatta rätta svar

**Att två poster saknas i samma lista gör dem inte till samma klass av fel.
Klassa efter vad resursen ÄR — inte efter var luckan syns. Den ena kan behöva
läggas till i listan, den andra behöva hållas utanför den för alltid, och
skillnaden syns aldrig på raden där båda är frånvarande.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27 → 2026-07-31):** restlistans verifieringspass bokförde
två poster tillsammans — *"`ZZ-GRANSKNING-S91` och `app-segment-test` saknas båda
i purge-policyn (0 förekomster vardera)"*. Observationen var korrekt: båda
saknades, mätt.

Slutsatsen var det inte. De hade **motsatta** rätta svar:

- `app-segment-test` är sentinel-rader ett test lämnat efter sig — skräp i samma
  sekund de skapats. De SKA städas av purgen, och fick sin target i `TASK-87`.
- `ZZ-GRANSKNING-*` är granskningsdata en människa **tittar på i en webbläsare**.
  En target hade raderat den mitt under granskningen — setup-purgen kör före
  varje staging-jobb och ålders-guarden är 60 minuter, medan en granskning pågår
  i dagar. Frånvaron i policyn var ett medvetet skyddsräcke, inte en lucka.

**Varför felslutet var lätt att göra:** registret grupperade efter *symptomet*
(saknas i policyfilen), och fyra targets bredvid bevisade att symptomet brukar
betyda just "lägg till en target". Det som skiljer fallen — vem som använder
datan — står inte i policyfilen och syns inte där felslutet dras.

**Varför det var dyrt trots att ingen agerade på det:** felslutet stod i ett
styrande register, alltså exakt den sortens fil nästa läsare litar på. Och
"fixen" hade varit självkaskaderande: skriptet som skapar fixturen korsläser
markörerna mot den skarpa policyn och hade vägrat skapa något alls, varpå nästa
naturliga åtgärd är att försvaga det räcket. En rad river två.

**Formen:** när flera poster buntas som "samma lucka" — skriv ut vad var och en
av resurserna är och vem som använder den, innan du skriver vad som ska göras.
Håller klassningen bara på frånvaron är den inte en klassning, utan en
sammanträffande observation. Och när ett skyddsräcke består i att något
**medvetet inte finns**, bär frånvaron ingen motivering i sig själv: den måste
skrivas där någon som vill fylla luckan faktiskt läser.

Beslutet som kom ur detta: `ADR-084`.

### L426 — Lagningen av en blind fläck inför gärna nästa — pröva mot radklass-rymden, inte mot felet

**Att pröva en rättad kontroll mot det kända felet bevisar bara att just det felet
fångas. Det säger ingenting om de rader som ska INTE fälla, och ingenting om de
radklasser mönstret aldrig rörde. Varje lagning av en kontroll ska därför prövas
i tre riktningar: fäller på det kända felet · fäller INTE på ett rent nämnande ·
och täcker varje radklass som faktiskt finns i materialet — annars byts en blind
fläck mot en annan.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-31, `TASK-100` — `tasks/s91-restlistan.md`):**

Restlistans statuskontroll hade två dygn tidigare lagats efter att ha visat sig
strukturellt blind för hela A7-klassen. Den lagningen gjordes **rätt enligt
dåvarande lärdom**: den nya formen prövades trefaldigt före den skrevs in — tre
FEL mot filen där felen bevisligen fanns, tomt mot den rättade, och ingen falsk
positiv på en rad som nämnde ett `Done`-kort.

Skarp körning gav ändå **fem FEL, varav två falska**, och lagningen visade sig
bära tre defekter:

| Defekt | Vad | Klass |
|---|---|---|
| A | Oförankrat `grep` drog in kort som bara NÄMNS i en annan posts **titel** — `TASK-52` bokfördes som Done fast den står i To Do | falskt statuspåstående |
| B | Varje **fet** kod-span antogs vara blockets bärare, så ett nämnande i brödtexten fällde ett korrekt block | falsk positiv |
| C | Mönstret såg bara **fet** kod-span, så två poster som bär sitt ID i vanlig kod-span var helt osynliga — båda dolde äkta fel | ny blind fläck |

**Defekt C är poängen.** Den infördes av lagningen, i samma operation som stängde
föregående blinda fläck, och av exakt samma orsak: mönstret skrevs mot de rader
som råkade ligga närmast. Prövningen mot det kända felet kunde inte upptäcka den,
eftersom den bara ställde frågan *"fångas felen jag redan känner?"* — aldrig
*"vilka former finns i materialet, och täcks alla?"*

**Motmedlet är att inventera FÖRE man skriver mönstret.** En enkel körning som
listar varje blocks faktiska ID-former tog en tool-call och avtäckte sex skilda
bärarformer där mönstret antog en. Först då gick det att skriva tre fallande
grenar som var och en svarar mot en verklig radklass, och att mutationspröva varje
gren för sig.

**Och den ärligaste delen: sluta jaga en form som täcker allt.** Två poster i
materialet var syntaktiskt **identiska** — samma ID i samma markup — men i den ena
var ID:t bäraren och i den andra ett rent nämnande som posten uttryckligen sa att
inget kort bar. Ingen regex kan skilja dem. En bredare form hade bytt den blinda
fläcken mot en falsk positiv. Kontrollen rapporterar dem därför som `OKLAR` och
ber om en mänsklig blick, i stället för att gissa och se heltäckande ut.

**Skärpningen mot närliggande lärdom:** fragmentet om att en kontroll som aldrig
prövats mot ett känt fel inte är bevisad säger *pröva mot felet*. Denna säger att
det är **nödvändigt men inte tillräckligt** — den prövningen gjordes, och kostade
ändå tre nya defekter. Tre gånger i rad har samma artefakt fått en lagning som
införde nästa blind fläck; klassen stängs inte av en engångsåtgärd, utan av att
räckvidden **redovisas** i utdatan i stället för att antas.

### L427 — En fixtur som byter tillstånd gör sina egna tester gröna av fel skäl [UNIVERSAL]

**När testdatan får en ny egenskap som kortsluter kodvägen, slutar testerna som
använder den att pröva det de påstår — utan att bli röda. De blir gröna på en
genväg, och grönt utan rödhet ser exakt likadant ut som grönt med den.**

**Empiri (S91, 2026-07-31, `TASK-101`):** legacy-registret i
`scripts/seed-review-fixture.mjs` fick ett `stadad`-fält som ger en avslutad post
en tom raderingsplan per konstruktion. Båda registerposterna märktes som
avslutade i samma ändring — och de var precis de två posterna hela `DEL B`-sviten
använder som indata.

Fem befintliga tester prövade registrets bärande ankare mot dem, bland annat det
som kortet som byggde registret kallade *"registrets enskilt viktigaste guard"*:
att ett verkligt `Skövde`-event skyddas av record-ID-ankaret, eftersom `Skövde`
är ett riktigt ortsnamn. Efter ändringen var den planen tom — men nu för att
posten var avslutad, inte för att ankaret höll. Testet var grönt. Assertionen
`assert.deepEqual(plan.events, [])` var uppfylld. Ankaret prövades inte längre
alls, och hade det varit trasigt hade ingenting sagt ifrån.

Åtgärden var en `somAktiv(post)`-hjälpare som strippar det nya fältet, så
ankar-testerna kör mot den form de faktiskt beskriver. **Att den var nödvändig
och inte kosmetisk är mätt, inte antaget:** en mutation som gjorde `somAktiv` till
identitetsfunktionen fällde 8 tester — däribland de två ankar-testerna. Utan
mutationen hade omskrivningen sett ut som en stilfråga.

**Varför den vanliga vaksamheten inte räcker:** en ändring som gör tester RÖDA
anmäler sig själv. Denna klass gör motsatsen — den tar bort täckning och lämnar
sviten grön, så den passerar varje grind som mäter rödhet. Antalet tester är
oförändrat, körningen är grön, diffen ser ut som en ren utökning.

**Motmedlet:** när delad testdata får en ny egenskap som *kortsluter* en kodväg
— ett tillstånd, en flagga, ett tidigt returvillkor — inventera varje test som
använder den datan och fråga per test: *prövar det fortfarande sin egen orsak,
eller är det grönt på genvägen?* Mekaniskt svar: mutera bort genvägen och kräv
att de fäller. Fäller de inte, mätte de redan ingenting.

**Släkting, andra riktningen:** *En grind som inte prövar orsaken tar emot fel
bevis* — den handlar om fällningar med fel orsak, denna om godkännanden med fel
orsak. Samma grundfråga (*kom utfallet från rätt mekanism?*), spegelvänd.

### L428 — Täckning som uppstår som sidoeffekt är odeklarerad täckning

**En grind som råkar nå en fil därför att något annat drog in den skyddar den
bara så länge det andra finns kvar. Ingen invariant är uttalad, så ingen
uppsägning är synlig.** `[UNIVERSAL]`

**Empiri (`TASK-103`, 2026-07-31):** `supabase/functions/` var bokfört som repots
enda kodbas utan typkontroll. Mätningen visade att **9 av 40 filer typkollades
ändå** — de drogs in i `tsconfig.tests.json`-programmet därför att tester
importerade dem. Ingenting sade att det skulle gälla. Slutade ett test importera
en modul föll den ur täckningen utan att något blev rött.

Formen är farligare än en ren lucka, av samma skäl som ett verktyg som inte körs:
**en inventering ser komplett ut.** `npm run typecheck` var grön, filerna var
kollade, och ingen rapport var röd. Men grönt som vilar på en sidoeffekt är inte
samma sak som grönt som vilar på ett beslut.

Skärpningen här: `TASK-53` hade kort innan **designat** en modul Deno-fri just för
att den skulle kunna typkollas från testsidan. Den designen vilade alltså på en
invariant som ingen skrivit ned och ingen grind vaktade. Ett medvetet designval
kan bygga på en oavsiktlig egenskap utan att någon märker skillnaden.

**Motmedlet är att deklarera gränsen, inte att bredda grinden.** Rätt åtgärd var
inte att slänga in hela mappen — 28 av filerna kör Deno och hade gett 67 falska
fel. Rätt åtgärd var att skriva ned exakt vilken delmängd som ÄR kollbar och låta
grinden fälla när någon lämnar den.

**Två mätfällor som hör till fyndet, båda universella:**

- **`exclude` stoppar inte transitiva importer.** Den filtrerar bara glob-träffar.
  En `include` på en mapp med `exclude` på de olämpliga filerna drar ändå in dem
  via en `import` från en fil som fick vara kvar — mätt: 7 fel från en fil som
  stod explicit i `exclude`.
- **Grep på ett symbolnamn träffar kommentarer.** `grep -l 'Deno\.'` klassade en
  Deno-FRI modul som Deno-rörande, därför att dess dokumentationskommentar
  innehöll ordet. Det auktoritativa svaret på "vad ligger i programmet" kommer
  från kompilatorn (`tsc --listFilesOnly`), aldrig från en approximation av den.

### L429 — En parser som tyst tappar sitt underlag ser ut som ett fynd

**Ett mätskript som inte redovisar hur mycket av indata det faktiskt kunde läsa
producerar ett trovärdigt tal ur nästan ingenting. Nämnaren är inte en detalj i
utskriften — den är det enda som skiljer en mätning från en gissning med
decimaler.**
`[UNIVERSAL]`

**Empiri (TASK-102, 2026-07-31).** Karens-fönstret skulle härledas ur hur länge
kort faktiskt legat i grindens fällande tillstånd. Första körningen svarade:

```text
kort med commit-historik: 179
MÄTPUNKTER: n=23
```

`n=23` är ett fullt rimligt tal. Fördelningen såg vettig ut, percentilerna gick
att räkna, och talet hade kunnat bäras hela vägen in i en policy-fil.

Det var fel. `git log --name-status` citerar sökvägar med icke-ASCII som default
(`core.quotePath=true`), och repots kortfiler bär å/ä/ö och em-streck i sina
titlar. Den citerade strängen kunde `git cat-file` inte slå upp, så **145 av 179
kort returnerade tom blob**. Efter `-c core.quotePath=false`:

```text
oparsbara: 0
MÄTPUNKTER: n=91
```

Fyra gånger så mycket underlag — och en helt annan fördelning, eftersom just de
kort vars titlar var svenska (alltså de nyare) var de som föll bort.

**Varför felet var osynligt:** skriptet räknade bara det som lyckades. Ett kort
som inte gick att parsa passerade genom en `.filter()` utan att lämna spår.
Utskriften kunde därför inte skilja "23 kort låg i tillståndet" från "23 kort gick
att läsa". Detta är exakt samma felklass som `TASK-90` lagade i själva grinden
— *"0 inkonsistenta" lästes som full täckning* — men den uppträdde här i
MÄTNINGEN som skulle kalibrera samma grind.

**Regeln:** varje mätskript redovisar sin nämnare och sin bortfallsräkning i
samma utskrift som resultatet, och ett bortfall större än noll namnger vad som
föll bort. Raden `oparsbara: 0` är inte utfyllnad — den är det som gör `n=91`
till ett tal man får använda. Ett skript som bara kan säga hur många det hittade
kan aldrig säga hur många det missade.

**Följdregel för git-verktyg specifikt:** `-c core.quotePath=false` hör till
varje `git log`/`git diff` vars utdata ska matas till ett annat kommando. Det är
inte kosmetik — det är skillnaden mellan en sökväg och en escapad sträng.

### L430 — npx löser upp binärnamnet som ett PAKETnamn — och de är inte alltid samma

**`npx <namn>` frågar registret efter ett PAKET som heter `<namn>`, inte efter
ett verktyg vars binär heter så. Skiljer sig paketnamn och binärnamn åt är
kommandot en namnkollision med tyst exekvering av främmande kod — och npx
installerar utan att fråga när stdin inte är en TTY, vilket den aldrig är i CI.**
`[UNIVERSAL]`

**Empiri (T107 + TASK-102, 2026-07-30/31).** Repots kort-arbetsflöde vilar på
`backlog.md`, vars binär heter `backlog`. Grindens default var
`BACKLOG_CMD="${BACKLOG_CMD:-npx backlog}"` och fungerade lokalt — men bara för
att en global installation råkade fångas upp. Mätt i isolerad miljö (tom cache,
tomt prefix, ingen global installation):

```text
npm error npx canceled due to missing packages and no YES option: ["backlog@1.4.56"]
```

`backlog@1.4.56` är **ett annat paket av en annan författare**, deklarerar
`bin: {"backlog": …}` och saknar provenance. Tråden hade bokfört risken som *"ett
opinnat paket per anrop"*. Den formuleringen var för mild med en hel klass:
skillnaden mellan *fel version av rätt kod* och *rätt namn på fel kod*.

**Varför det inte upptäcks av att det fungerar.** Felläget uppstår bara i en
miljö utan den globala installationen — alltså aldrig på maskinen där det skrivs,
och alltid på en färsk CI-runner. Ett kommando som är korrekt i utvecklarens
`PATH` och farligt i CI:s ger noll signal förrän det kör skarpt.

**Åtgärden är strukturell, inte disciplinär.** En lokal bin
(`node_modules/.bin/<binär>`) från en pinnad `devDependency` KAN inte förväxlas
med ett registerpaket — uppslaget sker i filsystemet, inte mot npm. Det slår en
nedskriven regel om att komma ihåg `npx --package=<paket>@<version> --yes <bin>`,
som dessutom står på fel sida av OpenSSF:s CI-regel (*"only run npm commands that
treat the lockfile as read-only"* — `npx` och `npm install -g` gör inte det).

**Regeln:** anropa aldrig ett Node-CLI med bara binärnamnet via `npx`.
Kontrollera först om paketnamn ≠ binärnamn; gör de det är bara den deklarerade
lokala binären säker. Och en grind får aldrig skriva ut den osäkra formen som
åtgärds-tips — då lär den ut precis det fel den finns för att stänga.

### L431 — En lista utan utskrivet inklusions-kriterium kan inte granskas för fullständighet

**En korrekt räkning bevisar bara att listan stämmer med sig själv. Vad som
BORDE stå där är en annan fråga, och den går inte att pröva mot en lista vars
inklusions-regel ingen skrivit ned. Kriteriet är det granskningsbara — posterna
är bara dess utfall.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-31, `TASK-106`):** `scripts/check-docs.sh` lovade i sin
egen första rad att köra *"ALLA dokumentations-grindar CI kör"* och räknade upp
tio. Räkningen var **sann** — tio poster, tio uppräknade, tio körda, och
slutraden sade tio. Ändå körde `ci.yml`:s lint-jobb två grindar som listan
saknade, och båda fäller på en ren `.md`-ändring: `check-fetch-depth-invariant.sh`
(erratum-not i ADR-029/030) och `check-listparitet.sh` (`CONTRIBUTING.md` via
paret `sentinel-markorer`). Mätt mot fixtur samma dag: struken erratum-rad ⇒
exit 1; struken sentinel-backtick ⇒ exit 1.

**Varför ingen granskning fångade det.** Filen hade en uppräkning *och* en
undantagslista (*"Biome, typecheck, audit, actionlint, yamllint, shellcheck,
testsviten — de är kod-grindar"*). Den såg fullständig ut åt båda hållen. Men
undantagslistan var en **naken uppräkning utan skäl per post**, och ingenstans
stod regeln som avgjorde vilken sida en grind hamnade på. En läsare som undrade
*"borde `check-listparitet.sh` stå här?"* hade inget att pröva frågan mot — bara
två listor att jämföra med sin egen magkänsla.

**Detta är en annan felklass än en felaktig räkning.**
[[L422]] handlar om ett aggregat som
motsägs av sina egna poster; där är felet synligt för den som räknar. Här stämde
allt som gick att räkna. Felet satt i **frånvaron av en post**, och en frånvaro
har ingen plats där den syns. Samma sak gäller åt andra hållet: räknings-lesson
fångar inte en lista som är intern-konsekvent och ändå ofullständig.

**Formen som fångar det:** skriv kriteriet före listan, och gör det operativt
nog att en läsare kan pröva en ny kandidat mot det utan att fråga någon. För
`check-docs.sh` blev det *"en CI-grind hör hit om en REN dokumentations-ändring
kan fälla den"* — kausalt, inte natur-baserat. Det kriteriet avgjorde direkt de
två tveksamma fallen: invariant-vakterna ingår (de fäller på `.md`-ändringar),
`check-staging-preflight-wiring.mjs` gör det inte (den läser
`playwright.config.ts` och `scripts/*.mjs`) — och det sista skälet står nu
utskrivet i stället för underförstått, eftersom den grinden kör i samma
alltid-på-jobb som de övriga och annars ser ut som en glömd post.

**Bikostnaden är att undantagen måste bära skäl per post.** En post utan skäl är
inte ett undantag utan en tystad avvikelse — samma krav som
`scripts/check-listparitet.sh` redan ställer på sina egna
`LISTPARITET_UNDANTAG`, och av samma anledning.

Besläktad: [[L422]] (talet som
motsägs av sina poster) ·
[[L409]] (påståendet som stoppar
granskningen) ·
[[L373]] (verktyget som finns men
inte avfyras)

### L432 — En grind mäts i täckning, inte i exitkod

**En grön grind säger bara att den inte hittade något i det den tittade på. Mät
alltid hur stor andel av ytan den faktiskt läser — annars är exitkoden ett svar
på en fråga du inte ställde.** `[UNIVERSAL]`

`TASK-108` skulle bygga en kontroll för trådregistret på premissen att registret
saknade mekanisk kontroll helt. Premissen var falsk: `scripts/check-lifecycle.sh`
hade validerat tråd-kort sedan Session 21, wirad två gånger — `check-docs.sh` som
grind 6 av 10, och `ci.yml`. Den var grön. Den hade varit grön i månader.

Mätt mot disk såg den **13 av 109 trådar — 11,9 %**. Tre klasser föll utanför:

- 8 av 21 trådfiler saknade `lifecycle:`-fältet, och skriptets `[[ -z ... ]] &&
  continue` hoppar tyst över dem. Regeln är korrekt i sig (frånvaro = ej
  livscykel-spårat, ADR-052 beslut 6) — men den gör täckningen till en funktion
  av vad skribenter råkat fylla i.
- 88 trådar har ingen fil alls. Loopen itererar över filer, så de existerade inte
  för grinden.
- Registrets egen integritet — numrering, radform, tillstånds-kolumn — validerades
  av ingenting.

Ingen av dessa syns i utfallet. Grinden skriver `✅ lifecycle-validering OK` och
`check-docs.sh` kallar den *"Lifecycle på sessionsdok + trådkort"*. Båda sanna.
Båda smalare än de låter.

**Det farliga är inte luckan utan att den läses som täckt.** En yta utan grind blir
granskad för hand, för alla vet att den är ogrindad. En yta med en grind som ser
12 % blir inte granskad alls — grönt utfall läses som "kontrollerad". Restlistans
`§ Filens egna fel` hade redan bokfört klassen: *en kontroll som tyst inte täcker
en radklass är farligare än ingen kontroll*. Den bokföringen fanns, och luckan
upptäcktes ändå först när någon räknade.

Praktiskt, i den ordningen:

1. **Räkna nämnaren innan du litar på ett grönt utfall.** Hur många objekt finns i
   ytan, och hur många itererade grinden över? Skillnaden är den otäckta klassen.
2. **Varje `continue` är en täcknings-gräns.** Skriv ut vilken klass den släpper
   igenom, i skriptets header, med tal — inte bara varför regeln är riktig.
3. **Nya grindar deklarerar sitt scope och sitt icke-scope.** `check-lifecycle.sh`
   gjorde det redan föredömligt för sin *kategori-skillnad* mellan sessioner och
   trådar; det som saknades var samma explicitet om vad som helt faller utanför.
4. **Bygg beviset som testsvit, inte som körning.** En engångskörning som visats
   grön bevisar inget om nästa ändring. `TASK-108`:s grind fick 15 testfall varav
   13 planterar ett känt fel — plus sex skarpa planteringar i det verkliga
   registret, en per invariant.

### L433 — Heartbeaten: nyckla på målsignalen, re-armera vid varje väckning, den startar inte av sig själv

**En landningssvep-heartbeat är bara så bra som den tillståndsändring den
nycklas mot — poll en proxy och vakten väcker på brus eller missar helt det
den finns för att upptäcka. En armering är inte ett minne mellan två
väckningar: kommandot är billigt och idempotent, så kör det igen i stället
för att lita på gårdagens svar. Och vakten själv är konvention, inte
mekanism — ingen hook eller cron startar den åt dig.** `[UNIVERSAL]`

Tre iterationer mätta samma kväll (S91, 2026-08-01→02): nycklad på
`mergeStateStatus` → brus (Dependabot-PR:er flappade `UNKNOWN`→`CLEAN`) · på
öppna PR-mängden → redundant mot task-notifikationer · på main-toppens SHA
(`git ls-remote origin main`) → väcker exakt på landningar. `#565`:s
armeringssvar såg lyckat ut men PR:en var inte köad vid nästa svep —
re-armering är den enda pålitliga läsningen (andra bekräftelsen av
`TASK-115`-klassens tysta armeringskonsumtion). Mekaniseringen är kortad
(`TASK-119`); cron-beslutet vilar på `T111`-bygget.

### L434 — En obligatorisk referens-skill kostar hela sin korpus, inte delen man behöver

**En skill med brett, alltid-på-triggerkontrakt laddar sin fulla korpus vid
varje triggning — inte den delsektion uppgiften behövde. Bredden köper
täckning; priset betalas i kontext per triggning, även där en rad hade
räckt.** `[UNIVERSAL]`

Empiri (S91, tjugoförsta resumen): `claude-api`-referensskillen triggade
obligatoriskt i kontext-42-%-episoden. Motmedlet är inte att smalna
triggerkontraktet (det återinför missad-täckning-risken skillen finns för att
stänga) utan att räkna in korpus-kostnaden när kontexttak och skill-triggrar
designas tillsammans — nära ett kontexttak kan en obligatorisk triggning vara
marginalen som tvingar en paus.

### L435 — PR-fillistor bär tredot-brus när grenen har inbakade merges

**En PR:s fillista räknas mot tredot-diffen (`branchA...branchB`) — skillnaden
sedan merge-base, inte sedan spetsen. En gren med inbakade merges kan visa
filer som redan landat på `main` via en helt annan väg, utan verklig
innehållskonflikt. Verifiera mot `git merge-base` innan en överlappning
tolkas som konflikt.** `[UNIVERSAL]`

Empiri (S91, 2026-08-01): `#551`/`#553` visade samma tre filer + samma
räknar-bump 86→87 — vid första anblick en rak innehållskonflikt. Lösningen
var `git rebase --onto` över brus-grenen mot härledd fakta (rätt facit 88 på
första försöket), inte rad-för-rad-lösning mot vad den råa fillistan påstod.
Särskilt relevant i merge-queue-flöden med många kortlivade grenar (ADR-076).

### L436 — En vakt som bara pollar efter LYCKAT terminalläge är blind för rött

**Ett terminalvillkor som bara känner igen framgång ("är den mergad än?") ser
aldrig ett misslyckande — det pollar vidare, tyst, tills någon annan märker
att inget händer. Terminalvillkoret måste täcka BÅDA utfallen: lyckat OCH
fällt, annars är vakten strukturellt blind för halva de tillstånd den finns
för att upptäcka.** `[UNIVERSAL]`

Empiri (S91, `TASK-115` instans 6+7): `#557` föll ur kön två gånger på sex
minuter med konsumerad armering; orkestrerarens vakter pollade enbart
`MERGED`, så båda passerade osedda tills Marcus frågade varför PR:en stod
stilla. Fixen samma stund: tvåvägs-vaktsformen (landat OCH utsparkat/fällt
som terminala tillstånd). Tillämpad genomgående vid session-end-dagens
landningsvakter — fångade `#581`:s MD032-röda direkt.

### L437 — En stängning som inte bryter ALLA ytor som bär posten återuppstår som öppen

**När en post bokförs stängd i en yta (logg, register, tråd) men dess
tillstånds-rad i en annan yta (kroppens checkbox, NÄSTA-lista, beslutsbord)
lämnas obruten, återuppstår posten som öppet arbete — och kostar ett helt
besluts-/utredningsvarv innan någon känner igen den. Status ska bo i EN yta;
övriga ytor bär pekare, inte tillstånd.** `[UNIVERSAL]`

Empiri (S91, 2026-08-02): `A2:8` avgjordes 2026-07-29 (Del 28) och
§ Avbockningslogg bokförde KLAR 2026-07-30 — kroppens checkbox bröts aldrig,
och frågan återuppstod som beslutsbords-punkt 4 tills Marcus kände igen den
(*"jag har svaret på denna fråga tidigare"*). Samma dag föll fler instanser:
A3b-svansen (ADR-081-sektionen fanns sedan `TASK-86`) · `TASK-79`/`110`/
`111`-raderna · destillat-raderna (avgjort 2026-08-01, T100 § Steg 4) — och
Codes eget DoD-svep ställde destillat-frågan till Marcus IGEN ur den stale
raden. Motmedlet är mekaniskt, inte minne: grep postens ID i HELA filen före
stängnings-commiten, och låt status bo i EN utpekad yta.

### L438 — En rättelse är en premiss, inte ett facit — verifiera korrigeringar som allt annat

**En rättelse av ett fel kan själv bära ett nytt fel. Att något är formulerat
som korrigering ger det ingen sanningsrabatt: pröva rättelsens påståenden mot
disk som vilken premiss som helst.** `[UNIVERSAL]`

Instans 1 (S91, tjugoandra resumen): orkestrerarens korrigering av ett
task-115-påstående bar själv ett fel ("Done" — kortet stod `To Do`), fångat
av mottagarens premiss-pass (ADR-086). Instans 2 (2026-08-02):
konstitutionsradens rättelse 2026-07-29 (*"PROSA, inte en spärr —
`permissions.deny` har aldrig funnits"*) var till hälften själv fel: spärren
fanns sedan 2026-07-27 som plugin-PreToolUse-hook
(`deny-backlog-direct-edit.sh`, 1.22.0/T100) — sökningen täckte
settings-filer, inte pluginets `hooks.json`. Rättad med full radhistorik
(hub-PR #14).

### L439 — Transcript-mtime är falsk signal — identifiera sessionsfiler via radernas timestamps

**En transcript-JSONL:s mtime säger när filen senast RÖRDES, inte vilken
session den bär eller när innehållet skrevs — harnesset kan röra filer långt
efter sessionsslut. Identifiera sessionsfiler via radernas egna timestamps
(första/sista event-raden), aldrig via filsystemets metadata.** `[UNIVERSAL]`

Empiri: uppdragsrevision #2:s metodfynd (S91, tjugoandra resumen) —
fil-urval på mtime gav fel sessionsmängd; rad-timestamps gav rätt. Samma
klass som memory-posten om live-JSONL som ögonblicksbild.

### L440 — En grinds exitkod genom en pipe är pipens sista led — kör grinden naken

**`grind | tail` returnerar tail:s exit, inte grindens; `grind ; echo $? &&
nästa` kedjar på echo:t. Båda formerna gör en röd grind grön för skalet. Kör
grinden som eget kommando (if-form eller naken), eller läs `PIPESTATUS`
explicit.** `[UNIVERSAL]`

Empiri (S91, 2026-08-02, två instanser inom en timme, båda orkestrerarens):
(1) `markdownlint-cli2 | tail -1` svalde exit 1 → röd grind följdes av
commit + push + armering; fångades först av CI:s Docs link check
(`#584`-kedjan). (2) Rättelsekommandot självt kedjade `&&` på ett
`echo "exit=$?"` och committade trots kvarvarande rött. Klassen är L436 i
kommandoform — en form som bara kan rapportera framgång. Motmedlet användes
direkt efteråt: `if grind; then committa; else stanna; fi`.

### L441 — En regel utan bärare på DIN yta skyddar inte, oavsett hur färsk kunskapen är

**Regler binder per bärare (kontrakt, skill-text, hook), inte per kunskap.
En regel mekaniserad för en roll-yta lämnar de andra ytorna oskyddade —
inventera vilka ytor som saknar bäraren, i stället för att anta att en
landad lesson täcker alla.** `[UNIVERSAL]`

Empiri (S94, 2026-08-02): orkestreraren körde `check:docs | tail` och
armerade en PR trots röd grind — L440 hade landat på main SAMMA morgon och
formen står ordagrant i bygg-agent-kontraktet, men ingen bärare binder
orkestrerar-ytan; klassens tredje orkestrerar-instans på två dygn (L440
§ Empiri bar de två första). Samma mönster som S94:s policy-huvudfynd:
`model: sonnet` reglerade agent-frontmattern medan default-agenter och
orkestrerare stod oreglerade tills tier-policyn (ADR-089) gav varje yta sin
bärare. Fångst: transparens-läsning av grind-utfallet, rättad före kö-fällning.

### L442 — Diffa mot fjärr-refen i långlivade worktrees — lokala refs åldras tyst

**`git diff main..gren` i en worktree jämför mot worktreens FÖDELSE-main,
inte dagens. Diffa mot `origin/<bas>` efter färsk fetch, eller läs PR:ns
egen fillista — en flerfils-diff där bara en fil väntades är signalen,
inte facit.** `[UNIVERSAL]`

Empiri (S94, 2026-08-02): granskningen av research-PR #593 visade 4 filer /
1 618 rader lokalt medan GitHub-PR:n bar exakt 1 fil — lokal `main` stod
kvar på worktreens födelse-SHA (`5d6f05f8`) medan origin hunnit fem
landningar längre. Nära släkt med L435 (tredot-brus vid inbakade merges) —
annan mekanism, samma symptom: lita på fjärrens fillista före lokal diff.

### L443 — Vakter som pollar tillståndsbyte är blinda för rött — vakta utfallsklasser

**En PR-vakt som väntar på "state ≠ OPEN" kan aldrig se en fälld körning:
en röd check lämnar PR:en OPEN, så vakten snurrar förbi exakt det läge den
behövdes för och dör sedan tyst på timeout. Vakta UTFALLSKLASSER med
explicit terminal för varje: grönt-mergat / RÖTT (räkna faktiska
check-fail) / TIMEOUT — aldrig tyst, oavsett utfall.** `[UNIVERSAL]`

Empiri (S95, 2026-08-02): end-passets ad-hoc-vakt på PR #608/#609 pollade
enbart state; #609 fälldes av ADR-count-grinden (rot-README:s kanoniska rad
90 ≠ 91 filer) och stod röd i ~20 minuter tills MARCUS flaggade den —
extern fångst, precis som fångst-raterna förutsäger (~9 % self-review).
Felklassen var dessutom redan bokförd som kort: `TASK-119` (S91) heter
ordagrant "heartbeat-svepet är handstartad konvention med ENVÄGS-historik —
mekanisera med trevägs-terminalvillkor"; sessionen rullade en egen sämre
vakt i stället för att köra den stående formen (T112-svepet). Marcus-order
vid kvittensen: regeln SKA mekaniseras — `TASK-119` prioriterad high, först
i S96-batchen. Tills skriptet finns: varje handrullad vakt bär trevägs-
villkoren själv.

### L444 — en grön grind mäter körbarhet, inte granskningsbarhet: orkestreraren granskar renderat resultat själv före handover

**[UNIVERSAL]**

**Fångad:** 2026-08-02–2026-08-03, Session 93, orkestreraren, hållplats-prototypens
kedja (`T99`-klassen).

**Vad som hände:** två skarpa instanser i samma session, båda fångade av
orkestrerarens EGEN granskning av renderat/beräknat resultat — ingen av dem av
någon automatisk grind (typecheck, lint, build, API-tester var gröna i båda
fallen).

1. **PR #603** (divergens-passet a/b/c på eventsidan, `?variant=`).
   Orkestreraren handövade till Marcus utan att själv ha sett det renderade
   resultatet. Marcus underkände utfallet ("slarvigt byggd") — berättigat på
   processgrund. Efterföljande egen okulär granskning bekräftade defekterna:
   proto-datat nådde bara två block (sidan motsade sig själv), Anteckningar
   var skrivbar trots att den inte skulle vara det, dubbel-etikettering,
   variant B saknade rail-form, eventinfo var inte avskild.
2. **PR #660** (byggkravs-vågen). `Betalningar`-blockets `slutMottagna`
   räknade strikt MOTTAGEN medan `slutSaknasAntal` räknade via `slutKlar` —
   två olika definitioner i samma block sedan `task-18.8` (2026-07-22).
   Orkestrerar-granskningen fällde en 3-vs-2-motsägelse i fixtur-läget — en
   semantisk motsägelse ingen grind kan uttrycka som ett predikat. Rättad i
   `betalningsSplit()`.

Åtgärden efter instans 1 blev en ny stående regel (PR #613): orkestreraren
granskar samtliga varianter i RENDERAD form före armering — inte bara efter
att koden kompilerar och testerna är gröna.

**Lärdomen:** en grön uppsättning grindar bevisar att koden KÖR — inte att
den producerar rätt renderat resultat eller rätt beräknat tal. Körbarhet och
granskningsbarhet är olika egenskaper, och ingen mängd automatiska grindar
ersätter att en människa (eller orkestreraren, som Marcus mänskliga motpart)
faktiskt TITTAR på det renderade/beräknade resultatet före handover. Släkt
med tråden `T87`s syskon `T99` (natt-bygge-skillens kärnfråga): "har du
granskat subagenternas output själv, eller litat på deras sammanfattning?" —
S93 gav den frågan två skarpa svar på en och samma session.

**Vad som INTE är gjort:** regeln ("granska renderat före handover") är
antecknad som stående praxis efter PR #613, men den är inte mekaniserad —
den vilar på omdöme i stunden, samma svaghetsklass ADR-043 kodade bort för
lifecycle. Ingen grind i repot verifierar i dag att en handover föregåtts av
en renderad granskning.

**Varför `[UNIVERSAL]`:** gäller varje agent-orkestrerar-arbetsflöde, oavsett
repo eller domän — CI-grindar mäter alltid en smal, mekaniskt uttryckbar
delmängd av "korrekt", aldrig hela ytan en människa skulle bedöma.

### L445 — visual-riggen fällde en bugg CI:s övriga jobb släppte igenom (T87-omprövningsargument)

**[UNIVERSAL]**

**Fångad:** 2026-08-02–2026-08-03, Session 93, hållplats-prototypens kedja.

**Vad som hände:** nattens röda körning (run `30784851472`) hade två
rotorsaker, båda fixade i PR #639. Den ena — en K6-regression ur #613s
Beläggning-omstrukturering (null-rader läckte) — fångades av testsviten
(rött-först: 1 failed → 12/12). Den andra felet fångades INTE av typecheck,
lint, build eller de vanliga testerna: en rail-gatings-bugg där ett
UI-element läckte mellan varianter i stället för att vara gatat bakom
`?variant`-parametern. Enbart visual-regressionsriggen (skärmdumps-diffning)
fällde den — 2 fällda jämförelser — och efter fixen gick riggen till 94/94.
Samma PR rättade även ett dataväxlar-kontrakt (se syskonfragmentet om att
läsa dev-verktygs kontrakt före spec).

**Varför det spelar roll utöver den enskilda fixen:** tråden `T87` (visual-
grindens CI-aktivering som BLOCKERANDE grind) står `paused` sedan S81 —
Marcus-beslut A: under en tidig UI-fas med många AVSIKTLIGA
utseendeändringar hade en aktiv blockerande visuell grind stoppat
auto-merge på varje medveten designändring, så grinden kördes rådgivande i
stället. Detta S93-fyndet river inte det beslutet — det var korrekt då —
men är en EMPIRISK datapunkt för omprövning när triggervillkoret (`UI-takten
lugnar`) inträffar: visual-riggen fångar en felklass (element som läcker
över tillstånd/varianter) som ingen av de andra jobben i CI-svansen
(typecheck/lint/build/API-tester) ens KAN fånga, eftersom de aldrig renderar
DOM:en.

**Lärdomen:** instrumentval avgör vilken felklass som är synlig.
Typkontroll, lint och enhetstester verifierar KOD; endast ett verktyg som
faktiskt renderar och jämför pixlar kan fånga att något SER fel ut eller
LÄCKER visuellt mellan tillstånd. En CI-svit utan visuell regressionstest
har ett blint fält som inget av de andra jobben täcker in — oavsett hur
många de är.

**Vad som INTE är belagt:** att slutsatsen bör vara "aktivera `T87` nu" —
det beslutet ligger hos Marcus och tråden `T87` själv (aktiveringsjobbet
ligger redan färdigbyggt i kortet; endast triggern saknas). Detta fragment
bokför enbart EMPIRIN som talar för omprövning när triggervillkoret
inträffar, inte ett beslut om aktivering.

**Varför `[UNIVERSAL]`:** gäller all mjukvaruutveckling med visuell yta —
samma princip som varför visuell regressionstestning (Chromatic, Percy,
Playwright-skärmdumpar) existerar som EGEN testklass i branschen, skild
från enhetstester: den mäter något enhetstester strukturellt inte kan mäta.

### L446 — läs ett stående dev-verktygs kontrakt före du skriver en spec mot det, anta det aldrig

**[UNIVERSAL]**

**Fångad:** 2026-08-02–2026-08-03, Session 93, PR #639.

**Vad som hände:** `PrototypeSwitcher`-devtoolet bär ett stående kontrakt
sedan S90/[ADR-074](../../docs/decisions/ADR-074-prototyp-substratets-adress-struktur-och-vaxlar-standard.md):
i variant-läge (`?variant=`) är FIXTUR-data default, och `?data=verklig` är
den explicita opt-in-vägen till riktig data — inte tvärtom. En spec skriven
under sessionen hade INVERTERAT det antagandet utan att kontrollera det
dokumenterade kontraktet. Felet krävde en egen rättning i PR #639
("data-kontraktet rättvänt").

**Lärdomen:** innan en spec eller ett byggkrav skrivs som förlitar sig på
hur ett stående internt dev-verktyg beter sig, LÄS det dokumenterade
kontraktet (ADR, källkodskommentar eller motsvarande) — anta det aldrig
utifrån minnet eller vad som "verkar rimligt". Kostnaden av att anta fel var
inte trivial: en felaktig spec-premiss satte sig i byggkravsvågen och
krävde en egen fix-commit att upptäcka och rätta, i stället för att kosta
noll genom att läsas i förväg.

**Instans vs princip:** den specifika kontraktskällan (`PrototypeSwitcher`
/`ADR-074`) är repo-lokal, men principen den illustrerar — verifiera ett
verktygs dokumenterade kontrakt innan en spec bygger på ett antagande om
dess beteende — är allmängiltig och gäller varje kodbas med stående interna
dev-verktyg (feature-flaggor, test-switchar, miljöväxlare, prototyp-rigger).
Flaggas därför `[UNIVERSAL]` på principnivå, trots att den enskilda instansen
är lokal.

**Släktskap:** samma klass som `CLAUDE.md`s "Airtable-schema före write" och
"Research före implementation"-reglerna i det här repot — kontraktet ska
LÄSAS före designbeslutet fattas, aldrig antas. Den här instansen visar att
regeln gäller lika mycket internt byggda devtools som externa API:er/basar.

### L447 — ett okänt CLI-flagga som --help faller igenom till skarp körning i stället för att visa hjälp

**Fångad:** 2026-08-02, Session 93, seed-eventet `ZZ-GRANSKNING-FIXTUR`.

**Vad som hände:** ett `--help`-försök mot `npm run seed:review` kördes
SKARPT i stället för att visa användning. Grundorsaken är verifierad i
källkoden: `scripts/seed-review-fixture.mjs`s `parseArgs()` (rad 566–664) är
en `switch`-sats över kända flaggor (`--ort`, `--bekraftade`,
`--obekraftade`, `--dagar`, `--livstid`, `--legacy`, `--clean`, `--dry-run`,
`--sweep`, `--ingen-svep`, `--bekrafta`) med `default: break` (rad 638–639)
— ett okänt argument som `--help` matchar ingen `case`, ger inget fel och
ingen hjälptext, utan faller tyst igenom till samtliga default-värden
(`config.defaults`). Eftersom default-summan av `bekraftade`+`obekraftade`
inte är 0, passerar körningen även guard-kontrollen på rad 655–657
(`--bekraftade + --obekraftade är 0 — inget att skapa`), och skriptet
skapar ett RIKTIGT event i staging: `ZZ-GRANSKNING-FIXTUR`
(`reco44UBx6GXcxwu5`, Event-3905), 16 anmälningar, betalningsspridning,
livstid till 2026-08-16.

**Vad som INTE gick fel:** samtliga skyddsräcken (bas-guard mot prod,
purge-policy-korsläsningen) höll — ingen data hamnade fel plats och ingen
permanent skada skedde. Kostnaden var att ett försök att LÄSA om skriptet i
stället skapade skarp data av misstag.

**Lärdomen:** ett CLI-skript vars argumentparser tyst ignorerar okända
flaggor (i stället för att fela på dem, eller explicit hantera `--help`/
`-h`) gör att ett försök att LÄRA SIG verktyget kan trigga en skarp körning
med default-parametrar. Ett skript som skapar data — särskilt mot en delad
miljö som staging — bör antingen (a) explicit hantera `--help`/`-h` med en
usage-text, eller (b) fela på ett okänt argument i stället för att falla
igenom till default. `default: break` är ett tyst ja-till-körning i
praktiken, aldrig en avsiktlig no-op.

**Varför INTE `[UNIVERSAL]`:** den observerade instansen är en egenskap hos
DETTA repos seed-skript (`n=1`, ett enda skript, en enda observerad
instans) — inte ett mönster som visats upprepas över flera verktyg eller
repon, till skillnad från syskonfragmenten i denna skörd som antingen har
flera instanser inom samma session eller en princip som uppenbart
generaliserar oberoende av kodbas. Registreras som skript-hygien-kandidat,
lokal till detta repo tills fler instanser (i detta eller andra skript)
visar motsatsen.

**Källa:** `tasks/sessions/2026-08-02-session-93.md` Del 2 § "Bokfört i
övrigt" (rad ~126–129) + PAUSLÄGE-blockets CARRY-lista, kandidat (5).

### L448 — bokföring på ett kort vars ändringar ligger olandade

**Fångad:** 2026-08-02, Session 96 (AFK-natten), orkestreraren.

**Vad som hände:** `TASK-126.2` stoppade i CI och PR #628 lämnades öppen med
agentens AC/DoD-bockningar ocommittade mot `main`. Orkestreraren skrev då en
parkerings-not på samma kortfil **på main**. Efter 27 landningar var PR #628
`DIRTY`, och den enda konfliktande filen var kortet — grenen bar bockningarna,
`main` bar noten.

**Lärdomen:** bokföring som skrivs till ett kort vars ändringar ligger
olandade i en öppen PR skapar garanterat en konflikt i exakt den filen. Båda
sidor kan vara rena tillägg och ändå kräva handpåläggning.

**Formen i stället:** lägg noten på ytor som INTE finns på grenen — ett eget
fyndkort, sessionsdokets Del, eller trådregistret. Kortets egen fil rörs först
när dess PR är landad eller stängd.

**Sekundärt:** varje ytterligare redigering av den konfliktande filen
fördjupar konflikten. Upptäcks det i efterhand är rätt drag att sluta röra
filen, inte att "rätta" i den.

**Kandidat för `[UNIVERSAL]`** — gäller varje repo med issue-substrat där kort
och kod landar i samma commit.

### L449 — en spår-grind får bara referera skivans eget arbete

**Fångad:** 2026-08-03, Session 96 (resumen), orkestreraren, ur `TASK-132`.

**Vad som hände:** `/to-issues` stämplar PRD:ns spår-nivå-grindar på varje
barnkorts DoD. I T95-spåren slöt det en cirkel: `TASK-127.1`:s DoD krävde
*"rundturs-e2e grön mot staging"* — vilket är `TASK-127.9`:s hela leverabel —
och `127.9` berodde transitivt på `127.1` Done. Spåret kunde inte röra sig.
Kortet skrev rotorsaken som *"skillen stämplade"*.

**Den rotorsaken var för bred.** Mätt över hela `backlog/`: `task-1`, `4`, `8`,
`9`, `17`, `18`, `19`, `36`, `54` och `59` bär **alla** identiska extra-DoD-poster
på samtliga barn. Tio familjer, noll deadlocks. Stämplingen är designat beteende
— den är det som bär granskningsvågorna.

**Lärdomen:** det som avgör är grindens **grammatik**, inte att den ärvs.
Tidigare spår-grindar är predikat över skivans EGET arbete och uppfylls av
skivan själv — verbatim: *"Design-review … per skiva med UI-yta"* · *"varje
BERÖRD facit-punkt"* · *"varje FLYTTAD fil har tvåsidigt bevis"* ·
*"körnings-ID:n citerade PÅ KORTET"*. En skiva utan UI-yta uppfyller
design-review-grinden vakuöst. De skapar granskningsvågor men aldrig ett
beroende utåt.

T95:s grindar refererar i stället (a) en **systerskivas leverabel** eller (b) en
**händelse utanför repot** (*"efter Grind 0"* = Vercel-konto, *"före
DMARC-posten satt"* = DNS). Klass (a) kan sluta en cirkel; klass (b) kan per
konstruktion aldrig uppfyllas av kod alls.

**Regeln:** en skiv-DoD bär endast predikat över skivans eget arbete. Grindar
som namnger en systerskivas leverabel, eller en händelse utanför repot, hör på
PRD-kortet — de gatar spårets Done, inte varje skivas.

**Varför det small först nu:** T95 är det första deploy-bundna spåret, och det
första där e2e-grönt både är spår-grind OCH egen skiva. De tio tidigare
familjerna var rena kod-/testspår inom repot — de klarade sig av tur i sin
form, inte för att kontrollen fanns.

**Metod-noten, värd lika mycket som regeln:** rotorsaken hittades genom att
mäta hela populationen i stället för att resonera ur det trasiga fallet. Ett
`n=1`-fall bär aldrig sin egen rotorsak — den syns först mot de fall som INTE
gick sönder. Samma klass som `T110` A (mätning med ett instrument som ser en
form men inte alla), fast med rätt utfall.

**Kandidat för `[UNIVERSAL]`** — gäller varje repo där en spec bryts ned till
skivor med ärvd Definition of Done. Åtgärdsriktningen mot `/to-issues` bor i
tråd `T115`.

### L450 — en hook som registreras mitt i en session kan inte skarpbevisas i den

**[UNIVERSAL]**

**Fångad:** 2026-08-04, Session 97, orkestreraren, under `T119` (a).

**Vad som hände:** katalogägarskaps-hooken byggdes, testsviten gick 23/23, och
skriptet gav korrekt `permissionDecision: "ask"` när det kördes manuellt mot
detta repo med en planterad ägarlapp. Sedan registrerades den i
`.claude/settings.json` och skulle skarpbevisas — och **fällde ingenting**. Två
provokationer gick rakt igenom.

**Vad som skilde hypotes från slutsats:** en differentialmätning, inte en
gissning. Tre mätpunkter i samma pass:

| Mätning | Utfall |
|---|---|
| ny hook, körd manuellt med identisk hook-JSON | fäller korrekt |
| ny hook, via harnesset (två provokationer) | fäller inte |
| befintlig hook (`deny-resend-send.sh`), via harnesset, samtidigt | **fäller** |

Den tredje raden är den som gör mätningen till ett svar: hooksystemet KÖR. Det
är registreringen som inte tagits i bruk, inte mekanismen som är trasig.

**Rotorsaken, belagd mot förstapartskällan:** `code.claude.com/docs/en/hooks-guide.md`
har ett dedikerat felsökningsavsnitt (§ `/hooks` shows no hooks configured):
*"File edits are normally picked up automatically. If they haven't appeared
after a few seconds, the file watcher may have missed the change: **restart
your session to force a reload**."* Samma dokument lovar på annan plats att ändringar
*"are normally picked up automatically by the file watcher"* — det är den
meningen som leder fel om man läser den ensam.

Community-rapporterna är starkare än dokumentationens "may": issue
[#22679](https://github.com/anthropics/claude-code/issues/22679) heter *"Hook
settings are cached and changes don't take effect until session restart"* och
beskriver exakt samma reproduktionsmönster (ny/ändrad registrering ignoreras
medan befintliga hooks fortsätter fyra). Både den och
[#55867](https://github.com/anthropics/claude-code/issues/55867) — en feature-
request om just mid-session reload — är stängda som dubbletter, och
originalärendet gick inte att spåra.

**Två hypoteser som mätningen AVFÄRDADE, och som annars hade kostat tid:**

- *Ett tyst godkännandesteg blockerar nya hooks.* Nej — den enda trust-grinden i
  dokumentationen gäller subagent-frontmatter-hooks, inte `settings.json`.
- *Det finns ett reload-kommando.* Nej — `/reload-hooks` existerar inte, och
  `/hooks`-menyn är uttryckligen read-only (*"The menu is read-only: to add,
  modify, or remove hooks, edit the settings JSON directly"*). Att `#55867`
  fortfarande efterfrågar funktionen är i sig beviset att den inte finns.

**Lärdomen:** en hook är inte bevisad förrän den har fällt via harnesset, och
det kan **per konstruktion inte ske i sessionen som byggde den**. Planera in det
från början i stället för att upptäcka det vid beviset:

1. Bygg hooken och bevisa LOGIKEN tvåsidigt med en testsvit + manuell körning
   mot verkligt tillstånd. Det är fullt möjligt i byggsessionen.
2. Bokför skarpbeviset som en **öppen skuld i handoffen**, inte som gjort.
3. Betala skulden **först i nästa session**, som en av dess första handlingar.

Detta är samma strukturella klass som MCP-verktygsytan i samma session (S97
Del 2): ytan bestäms vid sessionsstart och uppdateras inte retroaktivt efter
auth. Två olika delsystem, samma form — konfiguration som läses en gång vid
start. Att känna igen klassen är värt mer än de två instanserna var för sig:
**fråga alltid "bestäms detta vid sessionsstart?" innan du planerar ett bevis
som förutsätter motsatsen.**

**Vad som INTE är belagt, och därför inte påstås:** om skillnaden mellan att
LÄGGA TILL en ny matcher och att ÄNDRA en befintlig spelar roll. Ingen källa —
varken dokumentationen eller de granskade ärendena — gör den distinktionen.

### L451 — ett symptom som återkommer efter en verifierad rättelse har en AKTIV skribent, inte en historisk orsak

**[UNIVERSAL]**

**Fångad:** 2026-08-04, `T121`, orkestreraren + bygg-agent (research-pass).

**Vad som hände:** `core.hooksPath` uppmättes absolut i en delad `.git/config`,
rättades manuellt till relativt, verifierades relativt — och stod absolut
igen inom timmen. Tråden stängdes ändå en gång med rotorsaken
"konfigurations-drift, en engångshändelse" (en handpåläggning som skedde
"någon gång" i månader innan mätningen). Den stängningen var för tidig:
värdet flippade igen samma dag, upprepade gånger, med minuter mellan varje
flip — ett mönster helt oförenligt med "en person skrev över det en gång för
länge sedan".

**Vad som skilde hypotes från slutsats:** ett andra, oberoende mätpass som
INTE tog den första stängningens rotorsak för given. Det körde en
bakgrundsövervakning (poll var 2:a sekund) i stället för att bara läsa värdet
en gång, och fångade två SPONTANA flip på sex minuter utan att agenten körde
något git-kommando alls i det ögonblicket. Frekvensen — flip var 1–4:e minut
— är den signal som avslöjar klassen: en engångs-drift producerar EN
avvikelse som sedan står stilla; en AKTIV skribent producerar en STRÖM.

**Rotorsaken, belagd mot källkod:** skribenten var Claude Codes egen
worktree-skapande kod (`anthropics/claude-code#27474`/`#66993`/`#72714`) —
ett verktyg UTANFÖR repot, som kör vid varje ny worktree-skapelse och som den
egna sessionen (via `EnterWorktree`/`isolation: "worktree"`) triggar
kontinuerligt. Full beläggkedja:
`docs/research/t121-skribenten-claude-code-worktree-hookspath-2026-08-04.md`.

**Två hypoteser som mätningen AVFÄRDADE, och som annars hade kostat tid:**

- *Källan är i vårt eget repo, hub-repot eller en worktree.* Uttömmande
  kodsökning över alla tre gav noll träffar — vilket är precis vad man
  förväntar sig när skribenten är VERKTYGET man kör i, inte kod som
  checkas ut. Sökningen var korrekt utförd; den sökte bara på fel plats.
- *`npm ci`/`npx` i ett riktigt repo (till skillnad från ett minimalt
  temp-repo) beter sig annorlunda.* En rimlig, specifik hypotes från
  orkestreraren — testad direkt (`npm run postinstall` + `npx
  markdownlint-cli2` i en verklig worktree av det verkliga repot) och
  falsifierad rent: värdet förblev relativt i båda fallen.

**Lärdomen, i två delar:**

1. **Ett symptom som återkommer efter en VERIFIERAD rättelse (inte en
   ouppmärksammad, utan en som faktiskt kontrollerades och höll i
   ögonblicket) har per definition en AKTIV skribent — något som kör om och
   om igen — inte en historisk orsak som "hände en gång". Klassificera om
   direkt när återkomsten är bekräftad; fortsätt inte bygga vidare på
   engångs-hypotesen bara för att den var den första som föll ut.** Testet
   för att skilja dem åt är frekvens, inte förekomst: en enda mätning ser
   bara "avvikande igen"; en KORT SERIE mätningar (poll, inte engångsläsning)
   avslöjar om det är en pöl eller en ström.
2. **Kodsökning i det egna repot (inklusive angränsande repon och alla kända
   worktrees) är fel instrument när skribenten kan vara verktyget man kör
   arbetet i.** Noll träffar i en uttömmande sökning är inte bevis på att
   ingen kod gör det — det är bevis på att koden inte bor där sökningen
   tittade. När den egna toolingen (CI-runnern, editorn, agent-harnesset)
   själv rör den påverkade resursen, hör den till kandidatlistan från
   början, inte som sista utväg efter att allt internt är uteslutet.

**Vad som INTE är belagt, och därför inte påstås:** exakt vilket enskilt
`EnterWorktree`-anrop som orsakade var och en av de tre observerade flip-
händelserna i just detta pass — mätmetoden (2-sekunders poll) är strukturellt
för grov för att träffa ett millisekund-kort `git config`-anrop med en `ps`-
ögonblicksbild. Källkods-beläggningen (§ research-passet) gör den luckan
ofarlig för slutsatsen, men den ska inte förväxlas med en fångst på bar
gärning av en specifik process.

### L452 — kodsökning i det egna repot är fel instrument när skribenten är verktyget man kör i

**[UNIVERSAL]**

**Fångad:** 2026-08-04, Session 97, `T121`, orkestreraren + bygg-agent
(research-pass). Bokförd som egen post: L451 § "Lärdomen, i två delar" bär
denna regel som sin PUNKT 2, buntad med en annan (frekvens som signal för
aktiv skribent). Sessionsdokets egen paushistorik (tredje pausen,
`tasks/sessions/2026-08-04-session-97.md` rad ~1138–1139) listar den ändå
som en EGEN, fristående lesson-kandidat — den säkras därför här som sin
egen post i stället för att bara vila inuti L451.

**Vad som hände:** jakten på `core.hooksPath`-skribenten (L451) prövade
hypotesen att källan satt i vårt eget repo, hub-repot eller en känd worktree.
En uttömmande kodsökning över alla tre gav **noll träffar** — vilket först
lästes som "ingen av våra kodvägar gör detta". Den rätta läsningen var en
annan: skribenten var Claude Codes egen worktree-skapande kod
(`anthropics/claude-code#27474`/`#66993`/`#72714`), ett verktyg UTANFÖR alla
tre sökta repon. Sökningen var korrekt utförd — den sökte bara på fel plats.

**Lärdomen:** kodsökning i det egna repot (inklusive angränsande repon och
alla kända worktrees) är fel instrument när skribenten kan vara VERKTYGET man
kör arbetet i, inte kod som checkas ut och kan grep:as. Noll träffar i en
uttömmande sökning är inte bevis på att ingen kod gör det — det är bevis på
att koden inte bor där sökningen tittade. När den egna toolingen (CI-runnern,
editorn, agent-harnesset) själv rör den påverkade resursen, hör den till
kandidatlistan FRÅN BÖRJAN, inte som sista utväg efter att allt internt är
uteslutet.

**Varför `[UNIVERSAL]`:** gäller varje diagnos där en resurs delas mellan
checkad-in kod och den tooling som kör den (byggverktyg, editorer, CI-agenter,
IDE-plugins) — inte bara git-worktrees. Källkods-beläggningen bor i
`docs/research/t121-skribenten-claude-code-worktree-hookspath-2026-08-04.md`.

### L453 — isolering efter behov, inte som default

**[UNIVERSAL]**

**Fångad:** 2026-08-04, Session 97, `T121`-kedjan + `#729`, orkestreraren.

**Vad som hände:** varje worktree-skapelse triggar `T121`-buggen (skriver om
`core.hooksPath` till en absolut sökväg i den DELADE `.git/config`, L451).
Kostnaden är därför inte teoretisk utan proportionell mot hur många worktrees
en session skapar. En oisolerad mätagent prövade dagens spawn-beslut mot
spawn-loggen, worktree-reflogarna och vad varje agent faktiskt levererade
(PR #729, `fix(agents): research-pass körs oisolerat — mätt, inte antaget`):
**22 worktree-skapelser under dagen, varav 9 var undvikbara.** Uppdelningen
var inte en enda orsak: **fem** kom av att `research-pass`-agenttypens EGEN
default var fel (varje pass skriver exakt en ny, unikt namngiven fil under
`docs/research/` — noll kollisionsrisk, och tre av de fem grenarna användes
aldrig eftersom orkestreraren landade filen från huvudkatalogen ändå), och
**fyra** kom av att fel AGENTTYP valdes för uppdraget — rena
dokumentationsuppdrag skickades till `bygg-agent`, vars egen isolerings-default
mättes som korrekt (**12 av 12** agenter som faktiskt skrev kod, hook,
CI-config, ADR eller backlog-kort var rätt isolerade). `research-pass`-defaulten
fixades i `#729`; `bygg-agent` rördes inte.

**Lärdomen:** isolering (worktrees, sandboxar, containrar) ska motiveras av
faktisk kollisionsrisk vid merge, inte tillämpas som blankt förval för en hel
agenttyp. Ett research-pass som läser och skriver en enda, unikt namngiven fil
kan per konstruktion inte kollidera — isolering där är ren kostnad utan
motsvarande skydd. Redan bokfört som princip i `CLAUDE.md` § "Agenter kan INTE
arbeta cross-repo — och varje worktree kostar" (*"Isolera efter behov, inte
som default"*); denna post säkrar den bakomliggande MÄTNINGEN (22/9/5/4-talen)
som numrerad lesson, i stället för att bara vila i en governing-fils prosa.

**Varför `[UNIVERSAL]`:** gäller varje agent-/CI-arkitektur som väljer mellan
delad och isolerad exekveringsmiljö — kostnaden för isolering (extra
resurser, sido-effekter som `T121`, uppstartstid) ska vägas mot en verklig,
inte antagen, kollisionsrisk.

### L454 — tid är ingen giltig proxy för "ingen arbetar här"

**[UNIVERSAL]**

**Fångad:** 2026-08-04, Session 97 Del 6, orkestreraren (Marcus fångst 3 av 3,
katalogägarskaps-hooken).

**Vad som hände:** ett tidsbaserat övertagande (`KATALOG_TYSTNAD_MINUTER`:
30 min tystnad från en levande ägarsession ⇒ lappen kan tas över av en annan
session) lades fram och var på väg att landa. Marcus fällde det med ett
konkret scenario, citerat verbatim i ADR-090 § Lager 2: *"det kan ju bara
vara så att jag behöver gå och bajsa, och när jag kommer tillbaka så har vi
ingen katalog att stå på då eller?"* Konsekvensen var värre än förlorat
ägarskap: en session som "tog över" en tyst-men-levande ägare hade kunnat
skriva (`checkout`/`commit`/`merge`) rätt OVANPÅ ägarens ocommittade arbete,
medan ägaren bara var borta från tangentbordet.

**Rotorsaken i det förkastade tänkandet:** TID användes som proxy för "ingen
arbetar här", men ett arbetsträd med ocommittade ändringar är upptaget
oavsett ägarens tystnadslängd. Ett efterföljande eget resonemang — "en död
process kan inte ha ocommittat arbete som går förlorat, den är borta" — var
självt fel av samma skäl: processen är borta, men ARBETET på disk är det inte.

**Lärdomen:** i ett delat, låsbart arbetsträd (huvudkatalog, delad resurs,
gemensam lockfil) är det enda giltiga övertagande-villkoret BEVISAD DÖD
ägarprocess (t.ex. `kill -0` + starttidsgard) — aldrig en tystnadströskel.
Tystnad hos ägaren säger ingenting om huruvida arbetet på disk är säkert att
skriva över; en människa som lämnar skrivbordet är inte en människa som
slutat arbeta. Förkastandet är bokfört öppet i ADR-090 § Lager 2, inte tyst
rivet, så ingen återuppfinner tidsövertagandet i god tro.

**Varför `[UNIVERSAL]`:** samma princip som varför distribuerade
låsmanagers/lease-mekanismer använder liveness-kontroller (heartbeat, PID,
lease-förnyelse) i stället för rena inaktivitets-timers för att avgöra om en
ägare är död — gäller varje system där en delad, skrivbar resurs har exakt en
ägare i taget.

### L455 — en trigger söktes utanför systemet när den fanns i systemets egen rytm

**[UNIVERSAL]**

**Fångad:** 2026-08-04, Session 97 Del 6, orkestreraren (Marcus fångst 4 av 3,
heartbeat-svepets trigger, `T119` (c)).

**Vad som hände:** frågan "vad ska starta heartbeat-svepet?" klassades av
två agenter som ett arkitekturval och togs vidare mot en extern
schemaläggare (cron, `/loop`) — en väg som räknades fram till ~960
modell-turer per natt. Marcus löste den i stället med en fråga:
*"vafan kan inte session-start eller session-resume starta heartbeat?
Allting börjar ju session-start eller session-resume och allt slutar med
session-paus eller session-end, alltid."* Svaret stod redan i
`scripts/heartbeat-svep.sh`s eget filhuvud (rad ~99–100, § "Startform som
bakgrunds-monitor"): montera skriptet som `Monitor`-verktygets bakgrunds-bash
i en redan körande Code-session. Kostnad under väntan: noll LLM-anrop.

**Lärdomen:** innan en trigger eller ett schemaläggningsbehov designas som
NYTT maskineri utanför det körande systemet, fråga om systemet redan har en
egen rytm som kan bära den — en start- och sluthändelse som redan sker vid
varje cykel (här: sessionens `start`/`resume` ↔ `paus`/`end`). Att leta efter
en extern schemaläggare när svaret redan bor i systemets egen livscykel är
dyrare i två led: uppfunnet maskineri att bygga och underhålla, och en
kostnadskalkyl (960 turer/natt) som bara existerar för att fel väg prövades.

**Varför `[UNIVERSAL]`:** gäller varje orkestrerings-/agentarkitektur som
behöver periodiskt återkommande arbete — frågan "har det körande systemet
redan en start/slut-rytm att haka i?" kommer före "vilken extern
schemaläggare behöver vi bygga?", oavsett domän.

### L456 — en regel kan vara bredare än sitt eget belägg

**[UNIVERSAL]**

**Fångad:** 2026-08-04, Session 97 Del 8, orkestreraren (utlöst av Marcus
fråga: *"Det är ju bara bygg-agent och research-pass som inte kan jobba
cross-repo eller?"*).

**Vad som hände:** `CLAUDE.md`s worktree-isoleringsregel bar två påståenden
som inte var samma sak. Mätningen gällde konkret *"en **worktree-isolerad**
agent"* — en bygg-agent i egen worktree vars `git -C`/`cd`-kommando mot det
EGNA repots huvudkatalog avvisades. Slutsatsen som drogs av det sade i
stället *"delegera aldrig till en bygg- eller research-agent"* —
agenttyp, inte isoleringsstatus. Slutsatsen hade tyst bytt axel: från en
mätt cell (isolerad agent × eget repos huvudkatalog) till hela agenttypen,
och därmed även till cross-repo-fallet som aldrig mätts. Regeln stod så i
tre veckor. En efterföljande fyra-cellsmätning (isolerad/oisolerad ×
eget-repo/annat-repo) visade motsatsen på båda spärrade axlarna: en
oisolerad agent (`research-pass`, sedan `#729`) arbetar fritt cross-repo,
och även en ISOLERAD agent får läsa och skriva i andra repon — den
blockeras bara mot sitt eget repos delade huvudkatalog. Beviset var en
commit: den worktree-isolerade mät-agenten skrev och committade skarpt i
ett kastbart testrepo (`c3a9eb5`).

**Lärdomen:** när en slutsats formuleras utifrån en mätning, läs tillbaka
exakt vilken CELL mätningen täckte — vilken agenttyp, vilket mål, vilken
operation — innan slutsatsen skrivs bredare än den cellen. En regel som
generaliserar från "en isolerad agent mot sitt eget repo" till "alla
agenter, alla repon" är inte en försiktig tolkning av beviset; den är en ny,
obelagd regel som råkar dela text med den gamla.

**Varför `[UNIVERSAL]`:** gäller varje regel som härleds ur en enskild
mätning — kod, policy, process eller arkitekturbeslut. Frågan "vilken cell
täckte mätningen faktiskt, och vilken lämnades omätt?" är generisk och
oberoende av domän.

### L457 — en avvisning berättar VAD som stoppades, inte VARFÖR — förrän man läser den

**[UNIVERSAL]**

**Fångad:** 2026-08-04, Session 97 Del 8, orkestreraren.

**Vad som hände:** grunden för L456:s felaktiga regel var en verklig,
korrekt avvisning vars ORDALYDELSE aldrig citerades innan slutsatsen drogs.
Harnessets avvisningstext (verbatim): *"This agent is isolated in the
worktree \<path\>, but this command redirects git to the shared checkout via
-C. Refusing to run it."* Nyckelordet är `shared checkout` — inte "annat
repo". Förstapartsdokumentationen (`code.claude.com/docs/en/sub-agents.md`)
säger samma sak rakt ut: *"a command that redirects git into **the main
checkout** fails … **A command too complex to check also fails**."* Den
sista satsen är den troliga verkliga förklaringen till avvisningen som
startade hela missförståndet: `cd ~/annat-repo && git status` matchar BÅDE
`cd`-mönstret och komplexitetsregeln, och fälls därför oavsett vad målet
faktiskt är. Avvisningen var äkta hela tiden — tolkningen av den, gjord utan
att texten lästes, var fel. Kostnaden var tre veckor med en regel som sa att
cross-repo-arbete inte gick, om något verktyget aldrig påstod.

**Lärdomen:** när ett verktyg eller harness avvisar en operation, citera
avvisningstexten VERBATIM innan en regel byggs på den. En avvisning
beskriver exakt VAD som stoppades (mönstret som matchade) — den beskriver
VARFÖR bara om förklaringen faktiskt läses, och en snabb egen omtolkning
("det här går tydligen inte cross-repo") kan vara en helt annan, bredare
slutsats än den avvisningen faktiskt stödjer.

**Varför `[UNIVERSAL]`:** gäller varje felmeddelande, avvisning eller
exitkod i vilket system som helst — API:er, linters, CI-grindar,
harness-spärrar. Citera texten, tolka inte den föreställda innebörden.

### L458 — två olika indata som ger byte-identiskt svar betyder att mätningen är trasig, inte att svaret är robust

**[UNIVERSAL]**

**Fångad:** 2026-08-04, Session 97 Del 8, orkestreraren.

**Vad som hände:** ett differentialtest skulle skilja "hooken fäller
korrekt" från "hooken är inte laddad" genom att köra två OLIKA kommandon mot
samma hook-JSON och jämföra svaren. Testet gav samma resultat för båda
kommandona — vid ett hastigt påseende läsbart som "hooken är konsekvent,
svaret är stabilt". Den faktiska förklaringen var en trasig testrigg:
`cwd`-fältet i test-JSON:en pekade på en worktree som inte fanns, så hooken
föll tillbaka på PROCESSENS faktiska cwd i stället för den avsedda — och
producerade därför samma svar oavsett vilket av de två kommandona som
skickades in. Omgjort med en verklig worktree gav hooken det förväntade,
DIFFERENTIERADE resultatet: den släpper hub-operationer men fäller mot
huvudkatalogen.

**Lärdomen:** när ett test medvetet varierar EN indata för att observera en
skillnad i utfall, är ett identiskt utfall för båda varianterna inte ett
neutralt eller robust resultat — det är ett tecken på att variationen aldrig
nådde fram till mekanismen som testas. Byte-identiska svar på olika indata
ska trigga misstanke mot RIGGEN (stale fallback, fel variabel, cachat värde)
före någon slutsats dras om systemet som testas.

**Varför `[UNIVERSAL]`:** gäller alla A/B- eller differentialtester — om två
avsiktligt olika körningar producerar identisk output är den första
hypotesen "testet mäter fel sak", inte "systemet är okänsligt för
skillnaden".

### L459 — en skuld kan vara en konsekvens av en felläsning, inte av glömska

**[UNIVERSAL]**

**Fångad:** 2026-08-04, Session 97 Del 8, orkestreraren.

**Vad som hände:** `T06` bokförde `L103`–`L125` som obetald hub-skuld
(lessons som skulle lyftas till hub-repot men aldrig blev det), samtidigt
som `lessons-hub-sync`-skillen påstod att `L103`–`L119` *"saknas"*. Båda
kunde inte stämma samtidigt. Mätningen visade att posterna FANNS — 17 av dem
i en äldre PUNKTLISTFORM (`- [UNIVERSAL] **L103 — Titel**`) som skillens
dokumenterade grep-mönster (`^### L`) missade strukturellt, eftersom de
posterna aldrig var `###`-rubriker. Räkningen stängde saken: 426
rubrikposter + 17 listposter = 443, högsta `L443` — serien var kontinuerlig,
det fanns aldrig något hål. Skillen rättades med en femte igenkänd form (hub
`a72670c`), och hela lyftet betalades i samma svep (hub `8683c69`,
`K17.1`–`K20.6`, 20 poster verbatim, 363 insertions).

**Lärdomen:** en post som ser obetald eller bortglömd ut kan i själva verket
vara osynlig för det VERKTYG som skulle hittat den — inte för att någon
struntade i den. Innan en skuld antas bero på glömska, pröva om mekanismen
som skulle upptäckt den faktiskt TÄCKER formen posten står i. Här var svaret
att grep-mönstret bara kände igen en av fem markörformer; skulden var en
direkt konsekvens av den begränsningen, inte av att någon lät bli att lyfta
posterna.

**Varför `[UNIVERSAL]`:** gäller varje "X är inte gjort"-slutsats som vilar
på ett verktygs sökning eller räkning — en genuint obetald skuld och ett
verktyg med en täckningslucka ser identiska ut tills täckningen faktiskt
prövas.

### L460 — ägarlappen släpps sist av allt, efter all git-aktivitet: en operation kan lyckas och ändå inte lämna det tillstånd man trodde

**[UNIVERSAL]**

**Fångad:** 2026-08-05, Session 97 (fjärde pausens efterhandsanalys),
Marcus.

**Vad som hände:** Marcus, verbatim: *"Lappen låg kvar efter mitt första
släpp — inte för att mekanismen fallerade, utan för att mitt egna
verifieringssteg (`git switch` + `git merge --ff-only`) är git-skrivningar,
och hooken tar lappen vid varje sådan. Steg 6 i paus-skillen släpper
resurserna, men varje git-operation därefter återtar dem."* Mekanismen bakom
är dokumenterad i `scripts/katalogagarskap-markor.sh` § "ÄGARSKAP TAS VID
SKRIVNING, INTE VID ANKOMST" (`T120`, Marcus-GO 2026-08-04): ägarskapet tas
VID SKRIVNING — varje git-skrivoperation i huvudkatalogen — inte vid
ankomst, en medveten design för att ett rent läsande referensfönster aldrig
ska ockupera lappen permanent. Samma design som gör det läsande fönstret
ofarligt gör steg-ORDNINGEN farlig: `session-paus`-skillens Steg 6
(`katalogagarskap-markor.sh --slapp`) släpper lappen korrekt, men om
verifieringen av det egna arbetet (en `git switch`/`git merge --ff-only` för
att bekräfta att pausen faktiskt landade rent) körs EFTER steg 6, tar samma
hook tillbaka lappen omedelbart. Sessionen ser ut att ha släppt korrekt —
skriptet svarade, exitkod 0 — men äger i praktiken katalogen igen.

**Lärdomen:** regeln har två led. (a) **NYTT 2026-08-05:** släpp ägarlappen
som den ABSOLUT SISTA handlingen i en paus- eller avslutssekvens — efter ALL
git-aktivitet, inte före en sista verifiering som själv skriver. (b)
**Lärt redan i tredje pausen (2026-08-04):** verifiera alltid mot FILENS
FRÅNVARO (`$(git rev-parse --git-common-dir)/katalogagarskap-agare.json`
saknas), aldrig mot skriptets exitkod — den här posten bekräftar att samma
regel gäller även när frisläppningen i sig lyckades och något EFTERÅT
återtog lappen tyst. Den överordnade familjen: en operation kan returnera
framgång och ändå inte lämna det tillstånd man trodde, om något EFTER
operationen tyst ogör den.

**Varför `[UNIVERSAL]`:** gäller varje resurs som återtas automatiskt av en
efterföljande operation av samma KLASS som den som släppte den (lås, lease,
session-token, filhandtag, katalogägarskap) — ordningen "släpp sist" är den
enda som håller när frisläppnings-mekanismen och återtagnings-mekanismen
delar samma trigger.

### L461 — Ett flaggat glapp håller kvar sin vikt tills det faktiskt stängs — vare sig man kliver förbi det själv eller ärver det via en precedent

**[UNIVERSAL]**

**Fångad:** 2026-08-05, Session 97 Del 9, orkestreraren (marketplace-research-passet
`#742`, plus hub-agentens uppföljning).

**Vad som hände:** samma glapp bar vikt på två olika sätt i samma ärende. (1)
`#742` flaggade korrekt att `/plugin`-menyns Discover-flik var otestad
headless — verbatim: *"Kvarstående obelagd risk, öppet flaggad… borttaget
verkställs inte förrän luckan är stängd"* — men skrev ändå sin egen
`## Rekommendation`-rubrik som en ren dom, "Ta bort fältet", utan hedge; caveaten
stod som ett eftertankestycke under domen, inte som ett villkor PÅ den. (2)
Rekommendationen åberopade dessutom en precedent — hub-commit `7d4bf51` (Del
7:s borttag av `version`-fältet) — som stöd för samma åtgärd på
`description`-fältet. Precedenten var själv aldrig mätt mot TUI:n: en
uppföljande mätning visade att Discover läser `entry.description` **utan
fallback** (tre renderställen, noll träffar på `entry.description??`), vilket
rev domen — och avslöjade i samma svep att `7d4bf51` redan HADE gjort skada:
samma vyer renderar `entry.version`, så versionsraden hade tyst försvunnit ur
Discovers detaljvy och bläddringslista sedan Del 7, upptäckt först nu (hub
`76d47b7` återställde `version` och skrev om `description`).

**Lärdomen:** ett flaggat men olöst glapp fortsätter stödja slutsatsen tills
det faktiskt stängs — oavsett om glappet är ens EGET uttalade förbehåll (som
en domrubrik kan skriva förbi) eller ETT ÄRVT förbehåll från en precedent man
citerar som stöd. Att NÄMNA glappet räcker inte; domen eller åtgärden måste
faktiskt VÄNTA på att glappet stängs, annars är förbehållet dekoration. Och en
åberopad precedent bär inte bara sin slutsats vidare — den bär sina egna
omätta ytor med sig, som här visade sig vara en tyst regression, inte en
neutral bekräftelse.

**Varför `[UNIVERSAL]`:** gäller varje rekommendation eller citerad precedent
i vilken domän som helst — en explicit flaggad lucka måste vara ett VILLKOR på
handlingen, inte en fotnot bredvid den, och att luta sig mot ett tidigare
beslut kräver att kontrollera vad DET beslutet faktiskt mätte, inte bara vad
det landade på.

### L462 — Ett villkorat agent-mandat är billigare än en återställning

**[UNIVERSAL]**

**Fångad:** 2026-08-05, Session 97 Del 9, orkestreraren.

**Vad som hände:** i samma ärende som `L461` fick hub-agenten som skulle
verkställa borttaget av `description`-fältet ett VILLKORAT mandat i stället
för en ovillkorad order: ta bort fältet BARA om mätningen visar att Discover
läser `plugin.json` eller har en fallback för `entry.description`. Agenten
mätte, fann motsatsen, och **tog stopp-vägen** i stället för att verkställa.
Ett borttag som hade tystat Discovers beskrivning precis före ett
install-beslut blev därför aldrig av — mandatet gjorde att den redan skrivna,
felaktiga domen aldrig hann nå produktion.

**Lärdomen:** när en rekommendation bär ett känt, olöst förbehåll är det
billigare att delegera med en explicit STOPPA-villkor byggd in i ordern än att
lita på att mottagaren själv ifrågasätter en redan formulerad dom. Ett
agent-mandat som säger "gör X, MEN bara om mätning Y håller — annars stanna
och rapportera" flyttar verifieringen till körningsögonblicket, där färska
data finns, i stället för att förlita sig på att beslutsfattaren mindes
förbehållet när ordern skrevs.

**Varför `[UNIVERSAL]`:** gäller varje delegering av en åtgärd som vilar på
ett känt förbehåll — mandatet ska koda in villkoret mekaniskt, inte lita på
att exekutören självmant återupptäcker det.

### L463 — Ett ordinaltal i en styrande text är stale i samma stund en annan post landar före

**[UNIVERSAL]**

**Fångad:** 2026-08-05, Session 97, bygg-agenten (`TASK-141`), rättad av
Marcus i `49acc092`.

**Vad som hände:** `ADR-095` beslut 4 sade att `barn`-manifestet skulle
utökas med en "**femte invariant**". `TASK-140` (`besläktad`) landade FÖRST
och tog slot 5 i `check-thread-index.sh`, så `TASK-141`s `barn`-invariant blev
faktiskt Inv 6 — ADR:ns ordinaltal var stale innan `TASK-141` ens började
byggas. Bygg-agenten läste rätt: den byggde mot den FAKTISKA koden (vad som
redan låg på plats 5) i stället för mot ADR:ns hårdkodade siffra, och
flaggade avvikelsen i stället för att tvinga in fel nummer i
implementationen. Rättelsen (`49acc092`) STRÖK ordinaltalet — "en ny
invariant" i stället för "den femte invarianten" — snarare än att bara räkna
om det till sex.

**Lärdomen:** ett ordinaltal (femte, tredje, nästa) som beskriver en post
RELATIVT andra poster i ett delat, växande register är en förutsägelse om
framtida landningsordning, inte ett faktum — och den förutsägelsen håller bara
tills en annan post landar före. En styrande text (ADR, spec, plan) ska
referera posten genom NAMN eller SYFTE ("barn-manifestets invariant"), aldrig
genom sin förväntade position i en sekvens andra parallella arbeten också
skriver till.

**Varför `[UNIVERSAL]`:** gäller varje dokument som beskriver en framtida post
i ett delat, ordnat register (kö-position, versionsnummer-i-en-lista, "nästa"
av något) när fler än en aktör kan landa poster i registret — ordinaltalet är
en gissning om ordning, inte en identitet.

### L464 — En fras kan läsas som att motsäga en regel som står två stycken högre upp i samma dokument

**[UNIVERSAL]**

**Fångad:** 2026-08-05, Session 97, bygg-agenten (`TASK-141`), rättad av
Marcus i `49acc092`.

**Vad som hände:** samma `ADR-095`-stycke som `L463` bar ett andra, farligare
fel. Beslut 4 sade att den nya invarianten skulle validera "**båda
riktningar**". Läst isolerat är det en rimlig fras. Läst mot BESLUT 2, TVÅ
STYCKEN HÖGRE UPP i samma dokument, som uttryckligen FÖRBJUDER manuell
dubbelbokförd spegling av en relation i två riktningar, blir frasen tvetydig
på ett farligt sätt: den kan tolkas som ett bidirektionellt indexfil-par (som
inv. 3/4 redan är) — precis den konstruktion beslut 2 förbjuder.
Bygg-agenten läste frasen korrekt (som "båda ID-NAMNRYMDERNA" — tråd-ID och
kort-ID valideras var för sig, inte en spegling i två riktningar) och skrev ut
sitt eget skäl explicit i stället för att bygga tyst mot en av de två
tolkningarna. Rättelsen strök frasen helt snarare än att omformulera den, med
motiveringen att invarianten ändå bara validerar existens i den ENDA riktning
manifestet deklarerar — hela poängen med en asymmetrisk relation.

**Lärdomen:** en formulering kan vara korrekt i isolation och ändå läsas som
en motsägelse mot en regel som redan står i samma dokument, om den delar ord
med ett mönster dokumentet på annat ställe uttryckligen förbjuder. En ny
mening måste därför prövas mot dokumentets EGNA tidigare regler, inte bara mot
vad författaren själv menade — och när en byggande agent löser tvetydigheten
genom att skriva ut sin tolkning och sitt skäl (i stället för att bygga tyst
mot en gissning), blir den bästa detektorn för problemet inte författarens
självgranskning utan mottagarens synliga resonemang.

**Varför `[UNIVERSAL]`:** gäller all styrande text med flera beslutspunkter i
samma dokument — en fras några stycken bort från en uttryckligt statuerad
regel ärver risken att läsas mot den regeln, och korsläsning mot HELA
dokumentet (inte bara meningen som skrivs) är den kontroll som fångar det
innan en läsare gör det åt en.

### L465 — Kunskapscutoff känns som kunskap inifrån — verktygsfakta slås upp, gissas aldrig

**[UNIVERSAL]**

**Fångad:** 2026-08-05, Session 97, orkestreraren (självfångst innan
flaggning).

**Vad som hände:** orkestreraren var nära att flagga `js-yaml@5.2.2`
(tillagd som explicit devDependency i `2964ca34`/`#752`) som ett misstänkt
paket, eftersom minnesbilden sade att `js-yaml` ligger på 4.x. En uppslagning
mot npm-registret (`npm view js-yaml version` / `npm view js-yaml versions`)
visade motsatsen: `latest` är **5.2.3**, `5.2.2` är en giltig, publicerad
version, och `package.json`s `overrides`-block tvingade REDAN exakt `5.2.2`
för hela beroendeträdet innan den explicita devDependency-raden ens lades
till (verifierat: rad 91 och rad 106 i `package.json` båda `"js-yaml":
"5.2.2"`) — versionen var alltså inte ett nytt, oöverlagt val utan en
matchning mot ett existerande, medvetet låst värde.

**Lärdomen:** en föråldrad inre bild av "var ett bibliotek ligger" känns
inifrån identisk med aktuell kunskap — det finns ingen introspektiv signal som
skiljer en stale träningsdata-punkt från en färsk fakta. Regeln
"verktygsfakta slås upp, gissas aldrig" gäller därför även, och kanske
särskilt, när magkänslan är STARK och specifik (ett exakt versionsnummer, inte
en vag aning) — självsäkerheten i en hypotes är inte ett mått på dess
färskhet. Ett registeruppslag kostar en tool-call; en felaktig "det här
paketet ser misstänkt ut"-flagga mot ett redan korrekt bygge kostar en hel
omgranskningsrunda.

**Varför `[UNIVERSAL]`:** gäller varje påstående om aktuellt tillstånd
(versionsnummer, API-ytor, prisnivåer, vad ett verktyg stödjer) som en modell
"vet" ur träning — träningsdata har ett stopp-datum, och ingenting i hur en
gissning KÄNNS avslöjar om den är förbi det datumet.

### L466 — Att köra en delmängd av CI:s grindar lokalt är inte verifiering, det är en gissning om vilken delmängd som räknas

**[UNIVERSAL]**

**Fångad:** 2026-08-05, Session 97 — fyra instanser i EN session, samtliga
bekräftade mot commit-historiken.

**Vad som hände:** fyra separata gånger körde en lokal, för-hand ihopplockad
delmängd av CI:s grindar grönt medan den FULLA uppsättningen (den CI faktiskt
kör) hade fällt.

1. `#740` gick rött: `check-adr-count.sh` kördes aldrig lokalt eftersom
   ADR-039-grinden bor i CI:s Lint-jobb, inte i `npm run check:docs` — 94
   räknade mot 95 filer.
2. `#743` gick rött på `Vale.Terms`: `markdownlint` kördes mot de ändrade
   filerna men `npm run lint:prose` inte (`7c1b3802`) — samma KLASS av miss
   som (1), en annan grind.
3. `#747` gick rött i shellcheck-strict: ett kort `shellcheck <fil>`-anrop
   lokalt missade `--severity=style --enable=all`, som aktiverar
   default-disabled-regler (SC2250/SC2310) CI:s exakta invokering kräver
   (`513c244e`).
4. Samma fix (`513c244e`) räknade sina egna verkliga fynd (SC2250×4 +
   SC2310×2 = 6 enligt commit-meddelandet) — men ett naivt `grep -c
   "<regelkod>"` mot rå shellcheck-output räknar FEL: verktyget skriver en
   "For more information"-fotnot med en wiki-länk PER unikt utlöst
   regelkod, en gång per körning, och länkraden innehåller regelkoden som
   text. **Reproducerat oberoende** vid denna lesson-skörd
   (`shellcheck --severity=style --enable=all` mot en scratch-fil med två
   `SC2250`-fynd): `grep -c "SC2250"` gav **3**, inte 2 — ett påslag på exakt
   +1 per unik kod. Applicerat på (3): 6 verkliga fynd över två unika koder +
   2 fotnotsrader = **8 räknade, 6 faktiska**.

Rotorsaken i alla fyra: ingen lokal kommandouppsättning motsvarade CI:s, så
var och en som verifierade för hand plockade ihop sin egen ofullständiga
variant — fel jobb, fel flagga, fel scope, fel räkningsmetod. Åtgärdat med
`npm run verify:ci-parity` (`2964ca34`/`#752`), som HÄRLEDER kommandona ur
`ci.yml`/`ci-suite.yml`s `run:`-block VERBATIM i stället för att duplicera dem
i en femte handhållen lista.

**Lärdomen:** "jag körde grinden" är inte samma påstående som "jag körde
grinden CI faktiskt kör" — skillnaden kan vara ett saknat jobb, en saknad
flagga, ett saknat steg, ELLER ett fel i hur ett korrekt kommandos utdata
TOLKAS efteråt (räkningsfelet i instans 4 är den mest lömska varianten:
kommandot var rätt, verktyget kördes rätt, och felet satt ändå i efterledet).
Ett verktyg som härleder sin uppsättning ur samma källa CI läser (i stället
för att hålla en fjärde, parallell, manuellt underhållen lista) är den enda
formen som strukturellt inte kan glömma en ny grind.

**Varför `[UNIVERSAL]`:** gäller varje kodbas där lokal pre-push-verifiering
och CI:s faktiska grinduppsättning är två separata artefakter som kan
divergera — och gäller specifikt räkningsfel-varianten (4) för varje
användning av `grep -c` mot output från ett verktyg som skriver ut sina egna
referens-/hjälplänkar, oavsett vilket verktyg.

### L467 — Två mekanismer som ger samma garanti kan tillsammans skapa ett dödläge ingen av dem skapar ensam

**[UNIVERSAL]**

**Fångad:** 2026-08-05, Session 97 (fjärde resumen) — `ADR-076` amendering.

**Vad som hände:** rulesetet `main-skydd` bar samtidigt
`strict_required_status_checks_policy: true` OCH en `merge_queue`-regel. Var
för sig gav båda samma garanti — en PR byggs mot en uppdaterad `main`.
Förstapartskällan säger rakt ut att kön ger *"the same benefits … but does
not require a pull request author to update their pull request branch"*. Men
`strict` krävde en uppdaterad gren som VILLKOR FÖR ATT EN POST ENS FICK
KÖAS — så en PR som blev `BEHIND` INNAN den hann köas släpptes aldrig in, och
kön fick aldrig chansen att göra sitt jobb. `#747` och `#748` stod stilla med
`auto=true` tills `gh pr update-branch` kördes för hand på båda. **`ADR-076`
hade redan bokfört branch-uppdateringen som en ACCEPTERAD kostnad — sex dagar
INNAN kön aktiverades** — och ingen konsumerade den raden när förutsättningen
ändrades: en kostnad som var rimlig att acceptera under den gamla mekanismen
blev en tyst deadlock under den nya, och dokumentationen som beskrev den
gamla verkligheten fortsatte att låta som en fullständig förklaring. Åtgärdat
genom att stänga av `strict` (`gh api -X PUT`, en rads diff, övriga fyra
regler verifierat oförändrade) och skarpbevisat när `#752` landade direkt
efter `#751` utan handpåläggning.

**Lärdomen:** när två mekanismer oberoende ger "samma" garanti är det inte
redundans att förlita sig på utan en outforskad ordningsfråga. Fråga: KRÄVER
endera mekanismen ett tillstånd som den ANDRA mekanismen är tänkt att
LEVERERA? Här krävde `strict` ("uppdaterad gren") som FÖRUTSÄTTNING det som
`merge_queue` skulle producera som RESULTAT — ett cirkulärt beroende som bara
syns om man spårar VILLKOR, inte bara UTFALL. Och en
accepterad-kostnad-rad i ett beslutsdokument har ett implicit bäst-före-datum:
den håller bara så länge de förutsättningar den skrevs under också håller, och
ingen läser en ADR igen bara för att en NY mekanism aktiveras intill den
gamla.

**Varför `[UNIVERSAL]`:** gäller varje system med två eller fler
grindar/mekanismer som ger överlappande garantier (redundans-som-avsikt) —
kontrollera alltid om den ENA mekanismens INGÅNGSVILLKOR är den ANDRA
mekanismens UTFALL, inte bara om de "gör samma sak" på pappret. Gäller också
generellt: en rad i ett beslutsdokument som bokför en kostnad som "accepterad"
ärver implicit den förutsättning som gjorde kostnaden acceptabel, och måste
omprövas när förutsättningen ändras, inte bara stå kvar som historik.

### L468 — Ett lokalt kommando som kör CI:s steg verbatim avslöjar miljö-divergens, inte bara substansfel

**[UNIVERSAL]**

**Fångad:** 2026-08-05, vid bygget av `scripts/verify-ci-parity.mjs`
(`2964ca34`/`#752`) — ett lokalt kommando som härleder och kör
`ci.yml`/`ci-suite.yml`s grind-steg verbatim ur workflow-YAML:en i stället för
att duplicera dem i en handhållen lista (så att en ny CI-grind aldrig kan
glömmas i den lokala speglingen). Konsoliderad ur fragmentet
`tasks/lessons.d/verbatim-ci-korning-avslojar-miljodivergens-inte-bara-substansfel.md`
(fragment-vägen, `ADR-081`); fragmentet är borttaget.

**Vad som hände:** vid det första fulla körningsförsöket föll tre steg som
INTE hade något med förändringens sakinnehåll att göra:

1. **`pip install --quiet yamllint`** — CI:s runner har en bar `pip` på PATH;
   en macOS/Homebrew-maskin har ofta bara `pip3`/`python3 -m pip`, även när
   `yamllint` redan är installerat via en annan väg. Verbatim-körning av HELA
   steget föll på bootstrap-raden, inte på YAML-innehållet.
2. **En befintlig deletion-vakt (marker-string-scanner för en annan grind)**
   fällde det NYA skriptets egen fil — den nämnde en secret-variabels NAMN i
   ett förklarande dokumentationsstycke ("varför vi utesluter X"), och vakten
   skiljer per konstruktion inte på kod som läser variabeln och prosa som bara
   nämner den.
3. **Biome-lint** fällde det nya skriptets egna, precis skrivna filer —
   formatering ohanterad, och en sträng som innehöll bokstavligt `${{ … }}`
   (GH Actions-syntax) lästes av `noTemplateCurlyInString` som ett misstänkt
   glömt mall-literal.

Ingen av de tre hade något att göra med förändringens SAKINNEHÅLL (CI-
parity-mekaniken själv). Alla tre var äkta — inte falska larm att undertrycka
— men av en annan KLASS än den grinden primärt existerar för att fånga.

**Lärdomen:** ett verktyg som kör CI:s steg verbatim (i stället för att bygga
en förenklad egen variant) ärver INTE bara CI:s substansgrindar — det ärver
också varenda outtalat antagande CI:s recept gör om sin körmiljö (en
namngivning som `pip` i stället för `pip3`, en förutsättning att verktyget
inte redan finns, en förutsättning att den körande koden är gammal och redan
klassad av angränsande vakter). Bygg därför IN från början med förväntan att
de FÖRSTA felen ett sånt verktyg visar inte är substansfel i det man ville
verifiera, utan miljö-skarvar mellan "var CI antar att den körs" och "var
detta faktiskt körs". Diagnostisera var och en INDIVIDUELLT (kör grinden
direkt, isolerat från resten av kommandot) innan den klassas som antingen
"verktygets bugg" eller "verkligt fel i det som grindas" — de tre exemplen
ovan krävde tre helt olika fixar (special-hantering av en kombinerad
install+kör-rad, en explicit undantags-post i en annan grinds config, och
vanlig lokal lint-fix) och ingen av dem var en bugg i själva parity-
mekaniken.

**Varför `[UNIVERSAL]`:** gäller varje verktyg i vilken kodbas som helst som
väljer "härled och kör CI:s recept verbatim" framför "bygg en egen förenklad
variant" — designen som generellt är RÄTT (den stänger drift-risken en
handhållen lista alltid har) betalar detta pris regelbundet, och priset ska
förväntas, inte tolkas som att designvalet var fel.

### L469 — Prosa om ett fel är inte felet: en mönstermatchning utan fältavgränsning träffar dokumentationen av problemet, inklusive sin egen

**[UNIVERSAL]**

**Fångad:** 2026-08-05 (S98), vid första skarpa nattkörningen av
`scripts/check-pausade-sessioner.sh` (nattnätets sannings-avstämning för
pausade sessioner, byggd dagen innan i `e1e7407d`/`#748`). Grindens allra
första fällning i produktion var en falsk positiv — mot sig själv.

**Vad som hände:** grinden prövar om ett sessionsdok som påstår `lifecycle:
paused` faktiskt är pausat, genom att leta landade commits taggade
`[S<N>]` efter paus-punkten. Sökningen skrevs som:

```bash
git log "${PAUS_SHA}..HEAD" --no-merges --grep="\[S${N}\]" --format='%H %ct'
```

Nattkörningen (run `30974653786`) fällde S96 med **exakt en** träff: commit
`e1e7407d` — grindens egen skapelse-commit. Den är taggad **`[S97]`** i
subject-raden, men dess body förklarar felbilden grinden byggdes för att
fånga, och citerar därför ordagrant *"fem `[S96]`-taggade PR:er landade i
den"*. `git log --grep` prövar **hela** commit-meddelandet, body inkluderad.
Grinden matchade alltså sin egen beskrivning av problemet och rapporterade
den som problemet.

S96 hade ingen paus-drift. Den enda avvikelse grinden någonsin rapporterade
var sitt eget dokumentationsstycke.

Två egenskaper gjorde felet svårt att se i förväg. Det uppstod **först i
produktion**, eftersom testriggarna byggde syntetiska commits med korta
meddelanden utan body — den befintliga sviten hade till och med ett
närliggande fall (`[S97]` i subject fäller inte S96) men inget som satte
taggen i bodyn. Och det uppstod **för att skriptet var välskrivet**: ju
utförligare en mekanism motiverar sig själv i sin egen commit, desto mer
text finns för den att träffa.

Samma felklass finns dokumenterad i angränsande form i `L468` punkt 2 — en
marker-string-scanner som fällde ett dokumentationsstycke för att det NÄMNDE
en secret-variabels namn. Två oberoende instanser inom två dygn.

**Lärdomen:** när en mekanism söker efter en markör i fritext, avgränsa
sökningen till det **fält där markören har betydelse** — inte till hela
texten där den också kan förekomma som omnämnande. Skillnaden mellan att
*bära* en tagg och att *nämna* en tagg är hela skillnaden mellan signal och
brus, och verktyg som `git log --grep`, marker-scanners och
innehållsklassare har normalt hela texten som default. Ställ frågan
uttryckligen vid bygget: **var i texten är markören ett påstående, och var
är den bara ett citat?**

Bygg dessutom minst ett testfall där markören står **enbart** i den yta som
INTE ska räknas. Det fallet är billigt att skriva och är det enda som
skiljer en korrekt avgränsning från en som råkar fungera. Lägg samtidigt
motsidan — markören i rätt fält, något annat i fel fält — annars kan
matchningen degenerera till "leta aldrig" och ändå se grön ut.

**Varför `[UNIVERSAL]`:** gäller varje kodbas där en mekanism söker efter
markörer i text som människor också skriver *om* mekanismen — commit-taggar,
secret-namn, feature-flaggor, ärendereferenser, TODO-markörer. Risken växer
med dokumentationskvaliteten, vilket gör den kontraintuitiv: den träffar
hårdast de projekt som skriver ut sina skäl. Och den träffar mekanismen
själv först, eftersom en mekanisms egen commit är den text som oftast
citerar den markör den letar efter.

### L470 — Agent-parkeringen överlevde dubbel instruktion — empiri, inte ny lärdom

**En regel som står BÅDE i agentens egen definition OCH ordagrant i dess
uppdrag efterlevs ändå inte. Instansen är inte ett nytt fenomen — den är
mätdata på att instruktions-lagret inte bär den här klassen.**

Datum: 2026-08-05 (S96, fjärde resumen) | Klass: `L340`-familjen
(agent-parkering på asynkron signal)

## Instansen (L470)

`TASK-127.8`-agenten (passkey-skivan) avslutade sin tur med, verbatim:

```text
Waiting for the monitor's completion notification before proceeding.
```

Den hade då byggt **åtta filer** — `src/lib/auth/passkey.ts`,
`src/routes/passkey.tsx`, fyra testfiler samt ändringar i
`src/data/config/supabase-client.ts` och `src/routes/login.tsx` — och
committat **noll** av dem. Ingen gren, ingen PR. Worktreen stod kvar på
spawn-tidens SHA. Förbrukat: ~390k tokens, 202 verktygsanrop, 43 minuter.

Arbetet var inte förlorat (orkestreraren väckte agenten med `SendMessage`), men
utan den väckningen hade det dött med worktreen.

## Varför instansen är värd att bokföra

Det som skiljer den från S98:s tre instanser är **täckningen**. Regeln fanns på
två ställen samtidigt:

1. `.claude/agents/bygg-agent.md` § *"Ingen asynkron signal når dig — kör allt
   du måste invänta i FÖRGRUNDEN"* (rad 141–162), som dessutom citerar `L340`
   och skriver rakt ut: *"Skriver du 'jag väntar på notifikationen' och
   avslutar din tur är du inte i väntan — du är parkerad i evighet, med färdigt
   oredovisat arbete."*
2. Orkestrerarens uppdragstext: *"**Parkera ALDRIG på en landnings-vakt.**
   Pusha, öppna PR, rapportera — orkestreraren äger armering och merge-kön."*

Agenten producerade ändå exakt den mening definitionen förbjuder, nästan
ordagrant.

S98 rättade `bygg-agent.md` och `research-pass.md` med instruktionstext, och
bokförde samtidigt i sin egen handoff att **"fixen är instruktion, inte
mekanism, och mätningen är konfunderad"**. Denna instans är belägget för att
den självbedömningen var korrekt: mätningen är inte längre konfunderad, och
instruktionen räckte inte.

## Vad instansen INTE säger

Den säger ingenting om vilken mekanism som är rätt. Marcus uppger 2026-08-05
att en mekanisk lösning finns, och har uttryckligen bordlagt frågan — den tas
upp om klassen återkommer. Denna post är därför ren empiri-bokföring, inte ett
åtgärdsförslag: raden finns för att nästa mätning ska ha en fjärde datapunkt
med känd täckning, inte för att driva ett beslut.

Besläktat: `L340` (grundfyndet) · S98:s tre instanser · `T119`
(mekaniserings-programmet — *"regler i prosa bryts av färska kontexter; det som
håller är mekaniserat"*, vars tes den här instansen stärker).

### L471 — Bokföring kan bli falsk utan att någon ändrar den

**En anteckning som var korrekt när den skrevs kan bli osann av att VÄRLDEN
ändras runt den — inte texten. Ett namn som pekade rätt 2026-05 kan peka på ett
annat objekt 2026-08, utan att en enda tecken redigerats.** `[UNIVERSAL]`

Datum: 2026-08-05 (S96, femte resumen) | Klass: tillståndsytor som ljuger

## Instansen (L471)

Jakten på stagings CORS-allowlist (se
[[L475]]) hittade exakt en dokumenterad post,
i `tasks/sessions/archive/2026-05/2026-05-04-security-hardening.md`:

```text
Staging-secret satt: CORS_ALLOWED_ORIGINS=https://admin.miranon.se,
http://localhost:5173,http://localhost:4173 (per Marcus Gate A1-svar).
```

Den strängen hashade till **produktionens** digest, inte stagings.

Förklaringen är kronologisk, inte slarv: 2026-05-04 fanns bara ETT projekt —
det som skapades 2026-03-30 och i dag är prod. Staging föddes först
2026-06-13. Dokumentet beskrev alltså helt korrekt "det projekt vi jobbar mot",
och ordet *staging* syftade på en miljöroll som senare flyttade till en annan
databas.

## Varför det är lurigt

Detta är svårare att upptäcka än en vanlig stale rad, eftersom texten läser som
sann och **är** internt konsistent. Det finns inget att korrekturläsa bort. Bara
en oberoende mätning — här digest-jämförelsen — kunde visa att namnet bytt
referent.

Samma familj som `T121`-klassen: en konfigurationsrad som fortsätter gälla
bokstavligt medan dess innebörd flyttat.

## Regeln (L471)

Läser du en historisk anteckning om en miljö, ett projekt eller en resurs:
**kontrollera att objektet den namnger är samma objekt i dag.** Fråga när
anteckningen skrevs och vad som fanns då. Vid minsta tvekan — mät mot systemet
i stället för att lita på namnet.

Praktisk följd för oss: bokför miljöer med sitt **projekt-ref**
(`pqtshyierkdgwdnxuirz`), inte bara med rollnamnet "staging". Ref:en byter
aldrig referent.

### L472 — Läs det egna beslutsarkivet före ett arkitekturförslag

**Innan en arkitektur-rekommendation formuleras: sök det EGNA beslutsarkivet
efter frågan. Den kan redan vara besvarad — ibland på användarens egen tidigare
fråga, i samma ämne, med research bakom sig. Att rekommendera utan den
sökningen är att kasta bort arbete som redan är betalt.** `[UNIVERSAL]`

Datum: 2026-08-05 (S96, femte resumen) | Klass: förslag utan förankring

## Instansen (L472)

`TASK-127.9` (rundturs-e2e för inbjudningsflödet) blockerades av att
`generateLink`/`deleteUser` kräver `service_role`, otillgängligt i CI. Jag lade
fram två vägar och rekommenderade **A** — en snäv, staging-only Edge Function —
med motiveringen att repot redan bär `test-auth` som fail-closed-precedent.

Marcus svarade med en fråga, inte ett val:

> *"Om alternativ A är hur branschledare gör så väljer jag det, är de det?"*

Jag hade inte belagt det. Rekommendationen vilade på ett INTERNT mönster, inte
på branschpraxis — och jag hade inte sagt det.

## Vad sökningen hittade

Två saker, i den ordningen:

1. **Förstapartskällan pekade åt ett annat håll.** Supabases egen guide säger
   *"Start Supabase locally in CI with `supabase start`"*, och den lokala
   stacken kör en mail-catcher med API avsett för just automatiserad testning.
   Det löser samtidigt alla tre luckor som blockerade kortet — ingen av dem
   krävde en ny Edge Function.

2. **Vårt eget arkiv hade redan svaret.** `ADR-063` § S91-not, skriven
   2026-07-27, slår fast att *"branschen köper determinism genom att duplicera
   backend per körning"*, citerar Googles SUT-ranking och Thoughtworks
   HOLD-lista mot delad muterbar testmiljö, och konstaterar att de tvång som
   stänger den dörren gäller **Airtable** — inte Supabase.

Noten skrevs dessutom som svar på **Marcus egen fråga**, ordagrant nästan
densamma: *"Vi tvingas att frångå branschledande mönster/config för att
Airtable tvingar oss, är det rätt tolkat?"*

Flödet i `TASK-127.9` rör bara Supabase Auth. Det låg alltså i precis den del
där vårt eget arkiv redan sagt att branschmönstret är öppet för oss.

## Regeln fanns — den efterlevdes inte

Konstitutionen säger det uttryckligen: *"Inför ett arkitekturförslag: läs den
styrande ADR:n i sin helhet och kartlägg hela options-rymden innan förslaget
formuleras."* Jag hoppade båda leden och byggde på det första mönster jag råkade
känna igen i repot.

Det som gör instansen värd att skriva ned är inte att en regel bröts, utan
**vad som maskerade brottet**: förslaget var internt konsistent, byggde på en
äkta precedent i repot (`test-auth`), och lät välgrundat. Ingenting i formen
avslöjade att en hel options-gren saknades. Bara den externa frågan gjorde det.

## Regeln (L472)

Innan du lägger fram ett arkitekturval:

1. **Sök arkivet på ämnet** — ADR:er, research-filer, trådkort. En träff är
   ofta ett färdigt svar med belägg.
2. **Deklarera grunden explicit.** "Detta vilar på ett internt mönster, inte på
   branschbelägg" är en helt annan rekommendation än en källbelagd — och
   mottagaren kan bara väga den om skillnaden syns.
3. **Ett internt mönster är inte precedent.** Att repot gör något på ett visst
   sätt säger att det är möjligt, inte att det är rätt.

Se även [[L471]] — motsatt
felriktning: där ljög arkivet, här lästes det aldrig.

### L473 — Plattformens svar är inte applikationens bevis

**Ett grönt svar från gatewayen kan betyda att din kod aldrig kördes. Ett
CORS-, auth- eller rate-limit-bevis måste NÅ applikationslagret för att bevisa
något om det — annars mäter du plattformens default och kallar det din
konfiguration.** `[UNIVERSAL]`

Datum: 2026-08-05 (S96, femte resumen) | Klass: bevis som mäter fel lager

## Instansen (L473)

CORS-utökningen till `admin.miranon.dev` skulle verifieras mot prod. Första
mätningen:

```text
curl -H "Origin: https://admin.miranon.dev" .../functions/v1/get-events
→ 401
→ access-control-allow-origin: *
```

Headern SÅG ut som ett tillåtande svar. Men vår `corsHeadersFor()` sätter
aldrig `*` — den sätter den exakta origin-strängen eller ingen header alls.
`*` kom från Supabases gateway, som avvisade på JWT-nivå **innan vår funktion
kördes**. Svaret sa exakt ingenting om allowlisten.

Med anon-nyckeln passerade anropet gatewayen och nådde vår kod:

```text
→ 401
→ access-control-allow-origin: https://admin.miranon.dev
```

Samma statuskod, helt annat bevisvärde. 401:an är nu vår egen auth-kontroll,
och headern kan bara komma från vår funktion.

## Det generella mönstret

Varje plattform med ett gateway-lager — Supabase, Vercel, Cloudflare, API
Gateway, en ingress-controller — svarar på egen hand i vissa lägen. Deras
default-svar bär ofta *permissiva* headers, eftersom de är generiska. Det gör
dem farligt lika ett lyckat svar.

Två frågor skiljer lagren åt:

1. **Är svaret unikt för min konfiguration?** `*` är generiskt; den exakta
   origin-strängen kan bara min kod ha satt.
2. **Kan jag skilja lagren med samma anrop två gånger?** Här: utan nyckel
   (gateway svarar) mot med nyckel (koden svarar). Skillnaden i headern är
   beviset.

## Regeln (L473)

Innan ett infrastruktur-bevis bokförs som grönt: **peka ut vilken rad kod som
producerade svaret.** Kan du inte det, har du inte bevisat din ändring — du har
bevisat att tjänsten är uppe.

### L474 — Regeln måste bo på den yta som levererar signalen — annars når den bara den som redan gjort fel

**En regel som levereras enbart på fel-vägen når aldrig den som lyckas undvika
felet. Ju försiktigare aktören är, desto säkrare missar den instruktionen.**
`[UNIVERSAL]`

**Datum:** 2026-08-05 (S93)
**Klass:** mekanism-design / instruktionsleverans

## Vad som hände

Katalogägarskaps-mekanismen bär regeln för vad en session ska göra när
huvudkatalogen är upptagen. Regeln fanns nedskriven, korrekt och otvetydig, i
`scripts/deny-frammande-huvudkatalog.sh` § ÄGARSKAP-TAGANDE — verbatim:
*"ARBETA I DIN EGEN WORKTREE I STÄLLET … eskalera det INTE till Marcus, du har
all information som krävs för att välja rätt katalog."*

Den texten är `permissionDecisionReason` på ett **deny**. Den levereras alltså
**bara till en session som faktiskt försökt en git-skrivning och blivit nekad.**

En resume-session läste i stället `SessionStart`-rapporten, konstaterade att
huvudkatalogen hade en främmande lapp, och drog sin slutsats **i förväg** — utan
att provocera fram en deny. Den nådde därför aldrig regeln. Den stoppade hela
arbetet och eskalerade en fråga den hade fullt mandat att avgöra själv.

## Den kontraintuitiva delen

Sessionen gjorde det som normalt är rätt: den försökte inte en operation den
trodde skulle nekas. **Just den försiktigheten kringgick den enda ytan som bar
regeln.** En slarvigare session — en som bara kört på — hade blivit nekad, fått
regeln, och gjort rätt.

Det är värt att generalisera: **när en regel bara sitter på felvägen belönar
systemet den som gör fel och straffar den som är försiktig.** Det är baklänges,
och det upptäcks inte av tester som bara prövar felvägen.

## Bidragande orsak — samma regel, två grenar, en tappade den

`katalogagarskap-markor.sh` hade två rapportvägar för samma tillstånd. Bara den
ena bar worktree-regeln; stale-grenen nämnde `rm` som enda handling. Lappen råkade
vara över tidströskeln, så sessionen fick just den grenen — vilket ramade om
situationen från "vilken katalog jobbar jag i?" till "är ägaren död, ska jag
radera?". Två grenar av samma budskap divergerade tyst eftersom ingen delade
källa band dem.

Testsviten prövade att hooken inte **skrev** lappen, aldrig vad den
**rapporterade**. Innehållsluckan var därför osynlig för grinden.

## Regel

1. **Placera regeln på den yta som levererar SIGNALEN, inte bara på den som
   levererar AVSLAGET.** Ankomst-ytan (rapport, statusrad, SessionStart) och
   handlings-ytan (deny, felutskrift) ska bära samma regel.
2. **En regel som finns i två utflöden ska komma ur EN sträng.** Duplicerad
   prosa divergerar; den delade källan gör divergensen omöjlig i stället för
   osannolik.
3. **Testa vad mekanismen SÄGER, inte bara vad den GÖR.** En hook vars utdata
   styr en agents beteende har sitt innehåll som kontrakt.
4. **Fråga vid varje ny regel: kan någon nå detta tillstånd utan att passera
   den yta där regeln står?** Kan de det, står regeln på fel ställe.

## Samma familj

Detta är strukturellt samma fel som `[[code-role-discipline-ej-laddad]]`: en
artefakt som bara pekas på i prosa levereras aldrig. ADR-079 rev den en gång
genom att flytta Code-rollen till output-stylen (alltid i systemprompten). Här
återuppstod klassen i en annan mekanism — vilket antyder att mönstret behöver
kontrolleras aktivt vid varje ny regel, inte bara rivas där det hittas.

Åtgärdat i samma landning: delad regel-sträng i båda rapportvägarna, sex
innehållstester (fyra bevisat röd-kapabla mot gamla koden), och regeln inlinad
i `session-resume`-skillen i stället för pekad på.

### L475 — En write-only secret går att BEVISA, inte bara gissa

**Kan värdet inte läsas ut men en digest exponeras, är varje hypotes
verifierbar utan en enda skrivning: hasha kandidaten lokalt och jämför.
Kombinerat med funktionell enumerering rekonstrueras hela värdet — och en
destruktiv skrivning behöver aldrig ske i blindo.** `[UNIVERSAL]`

Datum: 2026-08-05 (S96, femte resumen) | Klass: destruktiva skrivningar mot
oläsbara konfigytor

## Problemet

`supabase secrets set CORS_ALLOWED_ORIGINS=…` skriver över **hela** värdet —
listan är en enda komma-separerad sträng. För att lägga till en origin måste
alla befintliga vara kända. Men värdet är write-only: CLI:t visar bara en
digest, och Management API:ts `/secrets`-endpoint returnerar **samma digest**,
inte värdet.

Vår egen bokföring dög inte som facit heller (se
[[L471]]).

## Vägen fram

Två oberoende instrument, som tillsammans ger visshet:

1. **Digest-matchning.** Digesten visade sig vara rå SHA256 av strängen —
   bevisat genom att en kandidat för ETT projekt matchade exakt. Därmed blev
   varje hypotes prövbar lokalt, till noll risk och noll skrivningar.
2. **Funktionell enumerering.** En `OPTIONS`-preflight mot en Edge Function
   svarar 200 för allowlistad origin och 403 för icke-allowlistad, helt utan
   autentisering. Det ger medlemskapet för varje origin man kan gissa — men
   kan inte upptäcka poster man inte tänkt på.

Instrument 2 matar instrument 1: preflighten hittade kandidaterna, hashen
bevisade den exakta strängen inklusive ordning och separatorer.

## Vad det gav

Det dokumenterade värdet var två origins. Det verkliga var fyra — tre
Vite-portar (`5173`, `5174`, `5175`) plus preview-porten, eftersom Vite trappar
upp porten när 5173 är upptagen. **Ingen bokföring nämnde 5174 eller 5175.**
En skrivning efter dokumentationen hade tystat två fungerande
utvecklingsportar, och felet hade visat sig först när någon körde två
dev-servrar samtidigt.

Sökningen krävde tålamod: 504 whitespace- och separator-varianter av de två
kända gav noll träffar. Det var det negativa utfallet som bevisade att en post
saknades — och som motiverade portsvepet i stället för en kvalificerad gissning.

## Regeln (L475)

Innan en destruktiv skrivning mot en yta vars nuvarande värde inte kan läsas:
leta efter ett *verifierbart* spår — digest, checksumma, funktionellt svar.
Finns ett, är gissning inte längre nödvändig. Finns inget, är det en
STOPPA-grind, inte en kalkylerad risk.

### L476 — en post-merge-larm-heuristik som antar seriella landningar pekar fel i parallella sessioner

**[UNIVERSAL]**

**Fångad:** 2026-08-05–2026-08-06, S96/S93, post-merge-larmet
(`post-merge.yml` + `classify-post-merge.sh`).

**Vad som hände:** larmets revert-heuristik resonerar "föregående post-merge-
körning var GRÖN ⇒ den här landningen är den primära misstänkta" och skapar
ett ärende med ett färdigt `git revert`-kommando. Fyra ärenden i samma serie
(`#821`, `#824`, `#825`, `#828`) pekade var och en ut den senast landade,
oskyldiga PR:en. Rotorsaken (`6f1d8c1a`) hade landat tyst i en PARALLELL
session flera landningar tidigare — `sr-only`-zonrubriker i
`Betalningar.tsx` som bröt både axe `heading-order` och Playwrights strict
mode. `#828` är det skarpaste fallet: den utpekade PR:n (#826, rundturs-e2e
för `TASK-127.9`) hade sitt EGET test grönt i samma körning som fällde den
— de tre fällda testerna låg samtliga i `mark-paid.staging.test.ts`, en helt
annan fil. Diagnostiserat i S96, åtgärdat i S93 (`634950d7`/`#830`),
verifierat mot en efterföljande grön körning med `Staging (API + E2E)` =
`success`, 177/177 tester.

**Lärdomen:** en larm-heuristik byggd på "föregående var grön, alltså är
SENASTE landningen skyldig" antar implicit att landningar är SERIELLA — att
det bara finns en enda gren av orsak och verkan mellan två mätpunkter. I ett
system med parallella sessioner/agenter som landar samtidigt är det antagandet
falskt per konstruktion: flera landningar kan ligga mellan två mätpunkter, och
den SENASTE är bara en av dem. Heuristiken pekar då konsekvent ut fel PR —
inte slumpmässigt fel, utan SYSTEMATISKT fel, eftersom den alltid pekar på
den mest NYLIGEN landade snarare än den som faktiskt införde regressionen.

**Varför `[UNIVERSAL]`:** gäller varje larm- eller bisect-mekanism som
härleder skuld ur "vad landade sist" i ett system som tillåter parallell
landning (merge queues, CI-bisect, feature-flag-rollouts) — antagandet
"en ändring i taget mellan två mätpunkter" måste verifieras, inte förutsättas,
närhelst mer än en aktör kan landa oberoende av varandra. En korrekt heuristik
måste antingen bisecta ALLA landningar i fönstret eller explicit läsa VILKA
filer/ytor varje landning rörde, inte bara ordningen de landade i.

### L477 — prosa som beskriver ett passerat läge konsumeras som fakta — tre oberoende instanser i samma pass, en av dem den egna granskarens

**[UNIVERSAL]**

**Fångad:** 2026-08-05, S96 (femte resumen), orkestreraren, ur
`TASK-127.9`-passet.

**Vad som hände:** tre oberoende instanser av samma fel inom en enda session.
(1) Fem Edge Functions filhuvuden citerade en "ADR-026 ≥3-tröskel för
`_shared`-extraktion" som ADR-026 inte innehåller — ADR:n sätter **≥5** och
gäller `parseList<T>`-helpers i `src/data/adapters/_shared/`, en helt annan
yta. En bygg-agent läste headern, drog slutsatsen att tröskeln var korsad, och
byggde ett scope-beslut på den (registrerat `T124`, `#819`). (2) Tråden
`T46` (go-live-kartan) bar kvar ett `ÖPPET:`-stycke om att GitHub–Vercel-
integrationen saknades — redan löst sedan S95. Orkestreraren bokförde
`TASK-127.9`:s AC #1 som Fas 7-beroende på just den stycket, och Marcus
fällde det direkt: *"Jag har visst kopplat Github och Vercel och du har
bekräftat det."* (3) En kodkommentar i `tests/e2e/auth-flow.staging.test.ts`
rad 24–31, skriven i Session 5, citerades som gällande — sann då, obsolet
sedan Vercel-beslutet. Samtliga fyra ytor rättade i en landning (`#822`,
`f69e7cec`).

Den obekväma delen: **orkestreraren rapporterade instans (1) som fynd och gick
sedan själv i fällan på (2) och (3) inom en timme.** Skillnaden var att
rapportören den första gången var granskaren, den andra gången konsumenten.
Marcus pushback var den fångande mekanismen — precis vad de bokförda
fångst-raterna förutsäger (self-review ~9 %, extern fångst dominerande).

**Lärdomen:** prosa som beskriver ett tillstånd — ett `ÖPPET:`-stycke, en
kodkommentar, en filhuvud-hänvisning till ett beslut — bär inget eget
bäst-före-datum. Den fortsätter att LÄSA som gällande långt efter att
förutsättningen den beskrev har ändrats, och ingenting i formen skiljer en
fortfarande-sann rad från en som blivit stale: båda är grammatiskt identiska
påståenden. Det gäller symmetriskt åt båda hållen — att SKRIVA ett sådant
stycke utan källhänvisning (instans 1) och att LÄSA ett sådant stycke utan att
verifiera det mot nuläget (instans 2, 3) är samma grundfel sett från olika
ändar. Och att ha nyss FÅNGAT felet hos någon annan ger inget skydd mot att
begå det själv en timme senare — vaksamheten var riktad utåt, inte inåt.

**Varför `[UNIVERSAL]`:** gäller varje kunskapsyta som beskriver ett
TILLSTÅND snarare än en händelse — statusfält, "ÖPPET"/"TODO"-stycken,
kodkommentarer om externa beroenden, filhuvud-citat av beslut på annan yta.
Innan ett sådant stycke citeras som grund för ett beslut: verifiera mot
NULÄGET (källan själv, inte en tredje hands referens till den), inte mot när
stycket skrevs. Och att nyss ha granskat samma felklass hos en annan skribent
är ingen immunitet — kontrollera den egna slutsatsen med samma disciplin som
gavs åt fyndet.

### L478 — en grind som inte gäller ytan kan dras in av den som kör den — och lydas som om den gjorde det

**[UNIVERSAL]**

**Fångad:** 2026-08-05/06, orkestreraren, vid granskning av
`backlog/tasks/task-14*.md`.

**Vad som hände:** `npx markdownlint-cli2 "backlog/tasks/task-14*.md"`
kördes direkt mot backlog-kort och gav fel. Samma kommentar skrevs om TVÅ
gånger för att laga dem — innan configen lästes.
`.markdownlint-cli2.jsonc` rad 38 säger rakt ut: *"backlog/ medvetet utanför
globs — verktygsägd yta ([[L226]]; S48 Del 2 gren C)"*. Grinden vaktar
alltså ALDRIG den ytan i sin normala körform (`npx markdownlint-cli2 .`
eller CI:s egen invokation) — men en explicit filangivelse på kommandoraden
kringgår configens `globs`/`ignores`-avgränsning fullständigt, eftersom
`markdownlint-cli2` prioriterar kommandoradens argument över sin egen
glob-lista. Verktyget lyder alltså blint den som frågar, oavsett om ytan är
den avsedda. Reproducerat: samma kommando mot `backlog/tasks/task-14*.md`
gav 12 äkta fel i två filer i denna landning också — mekanismen är stabil,
inte ett engångsutfall.

**Lärdomen:** `[[L226]]` fastslår att en dokumenterad exkludering ÄR
governance, inte en lucka — men den raden beskriver bara CONFIGENS eget
beteende vid NORMAL invokation. Den säger ingenting om vad som händer när en
OPERATÖR kringgår avgränsningen genom att namnge filer explicit. Det är en
annan axel: inte "är exkluderingen medveten" (L226:s fråga, redan besvarad
JA) utan "kan en operatör själv dra in den exkluderade ytan, och lyder hen
då resultatet som om det vore grindens dom." Här är svaret JA på båda —
och just det gör felet farligt: verktyget svarar med exakt samma
felformat och exakt samma allvarlighetsgrad oavsett om ytan är i scope eller
inte, så utfallet BÄR ingen signal om att man just klev utanför configens
avsedda gräns.

**Varför `[UNIVERSAL]`:** gäller varje CLI-verktyg vars scope styrs av en
config-fil (globs/ignores/allowlist) men som accepterar explicita
sökvägsargument på kommandoraden — linters, formatters, testrunners. Innan
ett verktygs UTFALL lyds som bindande: verifiera att INVOKATIONEN gick
igenom verktygets normala, konfigurerade scope (ingen explicit path-override)
— annars mäter kommandot en yta ingen grind faktiskt äger, och resultatet
är operatörens eget påfund, inte verktygets dom.

### L479 — trunkerad mätning gav inte bara ett missat fel — den gav en felaktig hypotes att bygga vidare på

**[UNIVERSAL]**

**Fångad:** 2026-08-05/06, orkestreraren, samma pass som `[[L478]]`.

**Vad som hände:** `markdownlint`s utfall lästes via `tail -2`. Utskriften
visade bara fel från `task-144`, vilket lästes som att `task-143` passerade
rent. Slutsatsen byggdes vidare på: en jakt startade efter en STRUKTURELL
skillnad mellan de två filerna som kunde förklara varför den ena var ren och
den andra inte. Full utskrift (reproducerad i denna landning:
`npx markdownlint-cli2 "backlog/tasks/task-14*.md"`, se `[[L478]]`) visade
**fel i BÅDA filerna** — flertalet pre-existerande, ingen kopplad till den
uppfunna strukturella skillnaden. Jakten sökte en asymmetri som aldrig fanns.

**Lärdomen:** `[[L71]]` fastslår att ett verifieringsfilter snävare än
felrymden maskerar fel utanför filtret — sant här också (`tail -2` är ett
sådant filter). Men det som hände här går längre än att MISSA ett fel: den
trunkerade utskriften gav en POSITIV, konkret men falsk signal — "endast
`task-144` är röd" — och den signalen konsumerades som ett DATAPUNKT att
förklara, inte som en artefakt av mätinstrumentet. Skillnaden mot att bara
missa ett fel (L71:s fall) är att ett missat fel lämnar dig OMEDVETEN; en
trunkerad men till synes fullständig utskrift lämnar dig med en FALSK
FÖRKLARINGSUPPGIFT — och tid går åt att lösa ett problem (varför skiljer sig
filerna åt) som inte existerar. Frånvaro av information i den bortklippta
delen tolkades som NÄRVARO av en skillnad, inte som en lucka i mätningen.

Släktskap, prövat och avgränsat: en parallell kandidat samma pass
(exitkod-maskering via `security … | head -c 12`) övervägdes som samma
klass men förkastades som egen post — den är redan fullt täckt av `[[L75]]`
("Gäller generellt") och `L440` (grind-specifik instans), och hookens
`.grind-exitkod-policy.conf` dokumenterar redan explicit att dess
kommando-lista är "avsiktligt smal" — ingen ny mekanism-lucka upptäcktes där.
Denna post (F) är en annan sak: inte pipe-exitkod utan STDOUT-trunkering, och
inte "missat fel" utan "uppfunnen förklaring till ett artefakt".

**Varför `[UNIVERSAL]`:** gäller varje läsning av flerdels-utfall (multi-fil
lint, multi-test-svit, multi-körnings-loggar) via ett trunkerande verktyg
(`tail`, `head`, en paginerad viewer). Innan en observerad ASYMMETRI mellan
flera objekt (bara X är röd, bara Y skiljer sig) förklaras eller utreds:
verifiera att HELA utfallet faktiskt lästes — en trunkering kan producera en
skenbar asymmetri lika lätt som den kan dölja ett verkligt fel, och den
skenbara varianten är farligare eftersom den ger något att aktivt jaga i
stället för att bara tiga.

### L480 — En rekommendation kräver hela ytan, inte bara filen du öppnade

**Läser du en komponentfil och drar en slutsats om vad som SAKNAS på skärmen, har
du bara läst en del av skärmen. Det som saknas kan mycket väl renderas av
anroparen.** `[UNIVERSAL]`

Mätt 2026-08-06 (S93, iterationsvåg 3). Marcus rapporterade att talen krockade:
topp-räknarna visar 12 (aktiva), registret 14 (alla, inkl. två avbokade).
Rekommendationen blev: *gör de saknade synliga — lägg en "Avbokade 2"-rad i
toppen*, med motiveringen att Lotta då själv räknar 12 + 2 = 14.

Underlaget var `HallplatsToppA` i `DeltagareHallplatsPrototyp.tsx`, där de fyra
stegraderna bor. Där fanns ingen Avbokade-rad. Slutsatsen "raden saknas" följde.

**Den var fel.** Raden fanns — i logistik-gruppen, renderad av `Deltagare.tsx`
intill "Eventinfo skickad" och "Bor över". DOM-mätningen efter bygget visade
**två identiska "Avbokade 2"-knappar 197 px isär**. Rekommendationen vilade på
en premiss som en enda grep över anropande fil hade fällt.

**Vad som räddade det:** att mäta den byggda ytan i browsern i stället för att
lita på att koden gjorde det den skulle. Felet fångades före handover, inte av
Marcus. Men det borde inte ha byggts alls.

**Det generella:** en komponent äger sin egen JSX, aldrig skärmen. Frågor av
formen *"visas X någonstans?"* eller *"saknas X?"* besvaras med en sökning över
hela renderingsvägen — anropare, syskon, wrappers — eller med en DOM-mätning.
Aldrig med "jag läste komponenten och såg inget".

Symptomet var här dubbel rendering, vilket är billigt. Samma felklass i motsatt
riktning — *"det finns redan, jag bygger inget"* — är dyrare, eftersom den inte
lämnar något spår att mäta.

**Fixen som blev kvar:** upplysningen bor nu där talet 14 föds, i registrets fot
("Visar 14 av 14 i registret — 2 av dem är avbokade"). Informationen saknades
alltså aldrig; den stod 200 px från talet den förklarade.

### L481 — Facit måste bäras av en mekanism — en nedskriven lärdom räcker bevisligen inte [UNIVERSAL]

**Mätt 2026-08-07 (S93 Del 11).** Eventsidans skarpa yta landade i ett läge som
inte var identiskt med den prototyp Marcus låst som facit. Ingen enskild
felhandling förklarar det; sex mekanism-luckor gjorde utfallet troligt.

#### Den skarpaste enskilda mätpunkten

Orkestreraren öppnade `konvergens-a-markera-atgarder.png` (daterad 5 augusti,
konvergens-passet), kallade den **facit** inför Marcus, och byggde en slutsats
på den. Det verkliga facit heter `facit-*.png` och är daterat 6 augusti — elva
iterationsvågor senare.

Det inträffade:

- **tjugo minuter** efter att samma orkestrerare beskrivit exakt den felklassen
  för Marcus, och
- **en dag** efter att samma orkestrerare skrivit lärdomen
  `uppdragets-kallmarkning-maste-avse-gallande-text.md` (*"Föråldrat citat som
  gällande facit"*), och
- i en katalog där båda filerna ligger sida vid sida, samma filändelse, åtskilda
  enbart av ett prefix.

**Slutsatsen är inte "läs noggrannare".** Att lärdomen fanns nedskriven, färsk,
och av samma författare, ändrade ingenting. Det är beviset för att facit inte
kan bäras av minne eller läsdisciplin.

#### Vad som brast, i klasser

1. **Facit försvinner mellan verktygen.** I plugin `marcus-system@1.29.0` nämner
   `/to-prd`, `/to-issues` och `/do-work` facit-bilder **noll** gånger (enda
   grep-träffen är ordet "förebilder"). Skillen som skriver acceptanskriterierna
   vet inte att bilderna finns.
2. **Kriterier beskriver defekter i stället för mål.** *"De grå löftena är
   hanterade"* går att uppfylla bokstavligt med godtycklig form.
3. **Granskningen är en bock utan spärr.** DoD-posten "design-review mot facit"
   stod okryssad på båda landade skivorna — som landade gröna.
4. **Facit går att förväxla med icke-facit** när båda bor i samma katalog.
5. **Facit-täckningens luckor är osynliga.** Saknas en bild för en yta går det
   inte att skilja från ett förbiseende.
6. **Ingen mekanisk jämförelse prototyp-mot-skarp existerar.** Den visuella
   vakten jämförde mot en baslinje äldre än hela ombyggnaden.

#### Regeln

**Är en artefakt facit, ska maskineriet bära den — inte läsaren.** Konkret:
kriteriet pekar på facit i stället för att beskriva en delförändring;
granskningen fäller i stället för att bockas; och facit är omöjligt att förväxla
med ett passerat mellansteg.

Under den baren är "facit" bara en bild i en mapp som någon ska komma ihåg att
titta på — och den här mätningen visar vad det är värt.

Beslutet: [`ADR-102`](../../docs/decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md).

### L482 — Grillnings-substrat kod-verifieras FÖRE frågorna — dokumenten är karta, koden är terräng

**Innan en grillningsfråga formuleras ur research-dok, trådar eller ADR:er:
verifiera substratets bärande premisser mot koden. En fråga byggd på en
dok-premiss som koden redan falsifierat slösar en hel kvittensrunda — och
riskerar att låsa ett beslut om att bygga något som redan finns.** `[UNIVERSAL]`

Mätt 2026-08-07 (S99, uppdrag 1-grillningen). Grillningens fråga 2 och 5
presenterade "bygg ADR-087-hooken" som en skiva, med substratets ord "PENDING
IMPLEMENTATION" som grund — hämtat ur research-passens text (2026-07-30) och
ett Explore-svep som läste dokument, inte `scripts/`. Verkligheten:
`scripts/stop-vakt.sh` var byggd, registrerad på båda hook-eventen och
tvåsidigt bevisad sedan `TASK-113` (commit `2971a165`). Divergensen upptäcktes
först i `/to-prd`:s skarv-steg — EFTER att Marcus kvitterat en plan som
innehöll en redan byggd komponent — för att en `ls scripts/` råkade visa
`test-stop-vakt.sh`.

Marcus fällde principen i klartext: *"KODEN är och ska vara den enda
sanningskällan. Hade du använt research-pass på att utforska koden innan
grillningen eller innan frågorna så skulle vi slippa överraskningar."*

**Formen som håller:** grillnings-förberedelsens faktainsamling får aldrig
stanna vid dokument-svep. För varje mekanism substratet påstår vara
byggd/obyggd/pending: ett kod-bevis (filen finns/finns inte, registreringen
finns/finns inte, testsviten finns/finns inte) INNAN premissen bär en fråga.
Kostnad: sekunder per premiss. Alternativkostnad: en felaktig skiva i en
kvitterad plan, en korrektionsrunda, och förtroendeslitage på grillningen som
form.

**Släktskap:** ADR-086 kräver redan att UPPDRAGS-mottagaren prövar premisser —
denna lärdom flyttar samma disciplin ett steg tidigare, till
grillnings-förberedelsen: intervjuaren prövar sitt eget substrat innan det blir
frågor. Pre-K-forensikregeln (hub-CLAUDE.md) säger samma sak för
config-förslag; detta är dess grillnings-form.

### L483 — Mät det ändringen påverkar, inte bara det du ändrade

**En mätning riktad mot ändringens egen yta missar vad ändringen gjorde med
grannarna. Text som växer trycker ihop det som delar dess rad.** `[UNIVERSAL]`

Mätt 2026-08-06 (S93, iterationsvåg 3). Passet mätte knappgeometri noggrant —
höjd, bredd, `border-radius`, bakgrundsfärg, i vila och hover, före och efter —
och rapporterade allt med tal. Varje knapp var 32 px och 4 px radie som avsett.

Samtidigt förlängdes registrets fot från `"Visar 14 av 14 i registret"` till
`"Visar 14 av 14 i registret — 2 av dem är avbokade"`. Foten är en
`flex justify-between` med tre element: texten, "Rensa filter" och "Skriv ut".

Marcus skärmavbild visade resultatet: texten bröt till två rader, **och båda
knapparna bröt inuti sig själva** — "Rensa / filter", "Skriv / ut". Mätningen
hade tittat rakt på de knapparna och sett 32 px höjd, i ett läge där "Rensa
filter" inte var renderad (inget filter aktivt).

**Två fel i samma mätning.** (1) Den mätte objekt, inte layout — geometri per
element säger ingenting om hur de får plats tillsammans. (2) Den mätte ett
tillstånd, inte alla — knappen som bröt visas bara när filter är aktiva, och
mätskriptet körde med tomt filter.

**Praktiskt:** när en ändring rör text i en delad rad, mät radens totala
utrymmesbehov mot dess faktiska bredd, och kör mätningen i det tillstånd där
FLEST element är synliga. Ett `flex`-barn utan `whitespace-nowrap` bryter inuti
sig självt långt innan raden wrappar — det är sällan vad som avses.

Samma disciplin som fällde breddlåset i iterationsvåg 1 (teckenantal är fel proxy
för renderad bredd), men en nivå upp: där mättes fel STORHET, här mättes rätt
storhet på fel OMFÅNG.

Besläktad: [[L480]] —
båda är samma grundfel, att avgränsa observationen till det man själv rörde.

### L484 — En ny conf-fil måste wiras in i grindens egen lista — annars fångas den bara av tur [UNIVERSAL]

**Mätt 2026-08-07 (S93 Del 11).** En agent byggde en config-driven grind
(`scripts/check-facit.sh` + `.facit-policy.conf`) enligt repots konvention:
universell logik i skriptet, projekt-specifika värden i conf-filen.

Conf-filen wirades **inte** in i `ci.yml`:s shellcheck-lista. Den fanns bara i
en prosakommentar (rad 747). Listan bär 22 andra conf-filer och dess egen
kommentar varnar ordagrant för precis detta:

> *"en sourced conf utanför scopet är samma lucka som de övriga redan stänger"*

#### Varför den ändå fångades — och varför det inte är ett skyddsräcke

CI fällde, men på **skriptet**, inte på conf-filen: `check-facit.sh` bar två
äkta shellcheck-strict-fynd (`SC2154`, `SC2312`). Under felsökningen av dem
lästes listan, och luckan blev synlig.

**Hade skriptet varit rent hade conf-filen glidit igenom osedd** — utanför
scopet, utan att någon grind någonsin nämnt den. Fångsten var en bieffekt av ett
orelaterat fel, inte en mekanism.

#### Den andra halvan: grind-påståendet var fel om sitt eget läge

Agenten rapporterade `shellcheck 0`. Det var utan `--enable=all` — alltså inte
CI:s läge. CI kör `--severity=style --enable=all`, och de två fynden är
default-disabled optional checks. **Ett grindpåstående måste ange vilket LÄGE
grinden kördes i**, annars är "0" en uppgift om fel sak.

#### Regeln

**Lägger du till en fil som en grind SOURCAR eller LÄSER — wira in den i
grindens egen lista i samma andetag som du skapar den.** Konventionen som säger
"värden i conf-filen" är halv tills conf-filen faktiskt granskas.

Och: **kör grinden med CI:s exakta flaggor, inte standardläget.** Skillnaden
mellan `shellcheck` och `shellcheck --severity=style --enable=all` var här två
verkliga fel och en missad lista.

Relaterad felklass: `L440` (exitkod förlorad i pipe) — samma familj, en grind
som ser grön ut utan att ha prövat det den påstår.

### L485 — En parkerad PR utan draft-flagga är oskiljbar från en glömd

**Parkerar du en PR med avsikt — under iteration, i väntan på granskning — sätt
den till draft i samma andetag. Annars ser varje bevakningsmekanism en färdig,
oarmerad PR och larmar korrekt, om och om igen.** `[UNIVERSAL]`

Mätt 2026-08-06 (S93). När iterations-kadensen lades om (lokal commit, ingen
push) disarmerades `#838` för att den inte skulle landa mitt i Marcus granskning.
`scripts/heartbeat-svep.sh` larmade omedelbart:

> ARMERINGS-KANDIDAT — PR #838 är CLEAN utan aktiv auto-merge-begäran. Kan vara
> ALDRIG ARMERAD eller UTSPARKAD med konsumerad armering.

Larmet var **rätt**. Svepet kan inte ur ett statiskt API-svar skilja "medvetet
parkerad" från "glömd" — och eftersom det är level-triggered (`L443`) upprepas
larmet var 90:e sekund så länge tillståndet håller.

**Fel väg ut:** undantagslistan i `.heartbeat-svep-policy.conf`. Den är
FÖRFATTAR-baserad, så det enda sättet att tysta en egen PR där hade varit att
undanta den egna identiteten — vilket tystar varje framtida PR från samma
avsändare. Policyn säger uttryckligen att en glömd PR från en människa måste
fortsätta larma; att riva den regeln för ett tillfälligt tillstånd vore att byta
ett brus-problem mot ett `T108`-tillstånd (ett tillstånd utan bevakare).

**Rätt väg ut, och den fanns redan:** `gh pr ready <nr> --undo`. Svepet filtrerar
`isDraft` i själva kandidat-villkoret (`scripts/heartbeat-svep.sh:395`) — ingen
config behövde röras. Draft är dessutom en sann utsaga om PR:en, inte en
tystning: den ÄR inte klar att landa.

**Det generella:** när en bevakningsmekanism larmar på ditt eget avsiktliga
tillstånd, fråga först om tillståndet är korrekt UTTRYCKT innan du dämpar
mekanismen. Ett larm på ett feluttryckt tillstånd är mekanismen som gör sitt
jobb. Den billigaste fixen är nästan alltid att göra tillståndet ärligt, inte att
lära vakten att blunda.

**Bar av mekanism sedan `TASK-153` (2026-08-07):** åtgärdsregeln — en PR
skapas som draft ELLER armeras i samma andetag, aldrig vilande — är
kodifierad i `CLAUDE.md` § Landning (alltid-laddad yta, inte en startdörr)
och i `.claude/agents/bygg-agent.md` § Landning. Ingen mekanisk spärr finns
än — ingen hook nekar en odraftad, oarmerad PR, till skillnad från
`T126`:s push-hook (`TASK-149.3`) — bäraren är läsordningen, inte en grind.
Men den bor nu där varje utförare och orkestrerarens svep faktiskt möter
den, i stället för i det här fragmentet som bara den som råkar läsa det ser.

**Andra instansen, mätt 2026-08-07 (S93 femte resumen) — av den som skrivit
lärdomen.** `#862` (`TASK-145.1`) lämnades medvetet oarmerad i väntan på
Marcus beslut i två scope-frågor. Svepet larmade inom ett svep-intervall med
ordagrant samma text som ovan, nu med `#862`. Draft sattes i efterhand.

Det stärker fragmentets sista stycke i stället för att motsäga det: regeln var
**läst i samma session** — den citeras till och med i resumens egen
rapportering av svepets kända egenskap — och efterlevdes ändå inte i
parkerings-ögonblicket. En regel som misslyckas för sin egen författare, en dag
efter att den skrevs, är inte ett läsnings-problem. Det är belägg för att
`T126`:s mekanism ska bära den, inte prosan.

**Tredje instansen, mätt 2026-08-22 — och den var INTE en parkering.** `#1798`
(`TASK-283.3`) armerades `13:50:47Z`, köades `13:58:32Z` och **sparkades ut av
kön `14:06:15Z`**. Därefter stod den stilla i **48 minuter och 6 sekunder**:
`CLEAN`, odraftad, utanför kön, med armeringen konsumerad. Timeline-API:t bär
**inget** `auto_merge_disabled`-event — ingenting i PR:ens tillstånd skiljer den
från en som aldrig armerats. Ett andra `gh pr merge --auto` i orkestrerarens
svep lade tillbaka den (`14:54:21Z`, direkt `added_to_merge_queue` utan nytt
`auto_merge_enabled`, alltså `CLAUDE.md`-tabellens rad 2 mätt skarpt), och den
landade `15:02:28Z`.

Instansen stärker posten från motsatt håll: larmets disjunktion — *"ALDRIG
ARMERAD eller UTSPARKAD med konsumerad armering"* — är inte akademisk. Båda
grenarna inträffar, bara den ena är avsiktlig, och ingen statisk avläsning
skiljer dem. Det är hela skälet att dämpning aldrig är rätt väg ut: samma larm
som brusar om en feluttryckt parkering är det enda som skiljer en färdig PR från
en som står stilla på obestämd tid.

### L486 — En skivning som inte prövats mot kodens faktiska kopplingar är en hypotes

**Skiva inte efter funktionsyta — pröva varje skivgräns mot koden den ska skära
igenom, innan korten publiceras. En gräns som ser ren ut i en beskrivning kan
gå rakt igenom en delad symbol.** `[UNIVERSAL]`

Mätt 2026-08-07 (S93 femte resumen). `/to-issues` delade `TASK-145` i sju
skivor efter vad Lotta ser: registret, räknarna, markera-läget, betalningsytan.
Varje skiva läste sunt för sig. **Två av gränserna höll inte mot koden**, och
båda upptäcktes först när en byggagent stod i dem.

#### Fel 1 — en rad utan ägare

`TASK-145.2` specades som *"fyra klickbara steg-räknare"*. Summeringsblocket
innehåller åtta rader; de fyra andra — Eventinfo-signalraden, Bor över,
Avbokade — hamnade utanför varje kort. Agenten sökte i backlog-korten, fann
noll träffar på "Bor över", och tog bort raden med sitt E2E-test.

Beslutet fanns hela tiden — i **grillad samsyn beslut 2** (sessionsdok) och i
**facit-bilagan** (radens exakta form, med bevisbild). Men inte i ett kort. Den
som bygger läser kort.

#### Fel 2 — en delad symbol mitt i en gräns

`TASK-145.1` (enad lista) och `TASK-145.3` (markera-läget) såg ut som två
skivor. I koden var de en:

```text
Deltagare.tsx:1652   markeringKandidatIds = protoVariant === 'a'
                       ? registerListaA.map(r => r.id) : obekraftadeIds
Deltagare.tsx:2103   <GruppRubrik handling={<MarkeraKnapp … />}>
                       {`Obekräftade (${obekraftade.length})`}
```

Markera-knappens enda anropsplats satt **inuti rubriken** `145.1` skulle riva,
och kandidatmängden **var** kön som revs. Att nå `145.1`:s första AC utan att
röra `145.3`:s yta var strukturellt omöjligt.

**Ironin som gör lärdomen skarp:** samma sessions Del 8 bokförde redan
kopplingen — *"markera-läget beror på filtreringen, inte bara på registret:
`markeringKandidatIds` ÄR den filtrerade listan (`Deltagare.tsx`:1652)"* — och
skivade ändå isär dem. Att KÄNNA till en koppling räcker inte; den måste
prövas mot varje gräns man drar.

#### Det generella

En skivning är en **hypotes om var koden går att dela**. Den prövas billigast
före publicering — genom att för varje gräns spåra de symboler skivan ska röra
och fråga *vem mer läser dem?* Prövas den i stället av en byggagent kostar den
ett helt pass, och agenten tvingas välja mellan att gissa en form eller stanna.

**Två sunda beteenden räddade båda fallen:** agenten flaggade den oägda raden
öppet i stället för att tyst hoppa över den, och stannade vid den omöjliga
gränsen med fil och rad i stället för att bygga runt. Fångsten skedde alltså
externt — självgranskningen av skivningen hade noll träffar, precis som
fångst-raterna förutsäger.

### L487 — Ett källmärkt uppdrag kan vara precist och ändå fel — källan måste vara GÄLLANDE, och förbudet får inte svälja skyldigheten

**Tre distinkta sätt att skriva ett uppdrag som en kompetent mottagare utför
exakt som skrivet och ändå fel: citera en föråldrad rad, namnge en delmängd som
läses som helheten, och formulera ett förbud som svalde en skyldighet.**
`[UNIVERSAL]`

Mätt 2026-08-07 (S93 femte resumen). Fem uppdrag till byggagenter i ett pass;
**tre av dem bar var sin instans**. Samtliga fångades av mottagaren, ingen av
självgranskningen.

#### 1. Källan var precis, men föråldrad

`TASK-145.2`s uppdrag citerade facit-bilagans rad 131 ordagrant:

> *"Eventinfo-raden + Bor över-raden står kvar, ORÖRDA (signal-slot,
> `AutoKryss`, kryss-läget)"*

Samma fil, rad 681, river `AutoKryss` (*"### 4. Auto-kryssen riven"*), och
grillad samsyn beslut 2 — citerad i **samma uppdrag** — namnger auto-kryssen som
rivning nummer ett. Uppdragets två källhänvisningar motsade varandra; rad 131
var skriven före konvergens-passet.

`ADR-086` kräver att varje faktapåstående källmärks, och det gjordes. **Men en
källmärkning till en föråldrad rad ser exakt likadan ut som en till en
gällande.** I ett dokument som växer våg för våg är den tidiga texten kvar och
läser som nutid. Disciplinen räcker alltså inte: citatet måste dessutom
kontrolleras mot senare avsnitt i samma fil.

#### 2. Delmängden lästes som helheten

`TASK-145.1`s uppföljning bad om att laga *"Personkorten-blocket"* i
`event-detail.staging.test.ts`. Agenten lagade exakt det — 0/8 → 8/8 — och
rapporterade precist. Samma fil bar ett **annat** block
(`Markera-läget — batch-bekräftelse`) som uppdraget aldrig nämnde. Det stod kvar
rött och slog igenom på `main` när den verifierande sviten körde staging-testerna
som PR-klassen skippar.

Att namnge en delmängd är att tyst utesluta resten. Skriv ut regeln, inte bara
instansen.

#### 3. Förbudet svalde skyldigheten

`TASK-145.1` AC #9 löd *"Inga befintliga E2E-filer raderas i denna skiva"*.
Agenten tillämpade det symmetriskt: rörde dem inte alls, och lämnade tretton
tester röda på ytor skivan själv medvetet ändrat.

Läsningen är rimlig. Texten sade vad som var förbjudet och underförstod vad som
krävdes. Rättad lydelse: *"Ingen fil RADERAS. Assertioner som prövar den yta
skivan medvetet ändrat SKA däremot uppdateras — att lämna dem röda är inte samma
sak som att bevara täckning."*

#### Det generella

Ett uppdrag läses **bokstavligt** av en mottagare som inte kan veta vad du menade.
Tre kontroller före utskick, var och en billig:

1. **Är varje citat gällande?** Sök samma term i resten av filen — ett dokument
   som växer i vågor bevarar sin egen historia som löptext.
2. **Namnger jag en instans där jag menar en klass?** Om ja, skriv klassen.
3. **Bär mitt förbud en outtalad skyldighet?** "Radera inte" är inte "lämna
   orört". Skriv ut båda halvorna.

**Fångst-mönstret är det viktigaste i posten.** Alla tre hittades av mottagande
agenter som prövade premisserna mot disk — noll av dem av författarens
genomläsning. Det är `ADR-086`s premiss-pass som fungerar, och det är samma
asymmetri som fångst-raterna redan beskriver: självgranskning är svag, extern
fångst dominerar. Skriv därför uppdrag som **går att motsäga** — med sökbara
källor och mätbara påståenden — hellre än uppdrag som låter säkra.

### L488 — En ändrad yta kräver svep över ALLA test-konsument-ytor före push, inte de man råkar känna till

**[UNIVERSAL]**

**Fångad:** 2026-08-08–09, tre instanssiter i samma vecka: `162.3` (fyra
missade filer, bokfört på `166`-kortet) · `172` varv 1–2 (acceptance-ytan +
datumspann-tvillingarna missade tills CI fällde — kortets egen bokföring
"TREDJE TÄCKNINGSLUCKAN") · `172`-slutrundan (systematiskt AST/grep-svep där
den ANDRA, bredare grep-omgången fångade två träffar första filsökningen
missat).

**Lärdomen:** en sträng eller ett beteende som ändras har konsumenter i
api/acceptance/visual/e2e — och konsument-ytorna är inte symmetriska:
`--fast`-lägen och PR-klassning skippar vissa av dem lokalt och i CI.
Verifieringens scope härleds ur ändringens KONSEKVENSER över alla ytor, inte
ur diffens fil-lista. Identifiera ytorna FÖRE sista push med en systematisk
sökning (och en andra, bredare omgång — första sökningen missar); iteration
efter CI-rött är det dyra alternativet.

**Varför `[UNIVERSAL]`:** gäller varje repo med mer än en testklass.

### L489 — En absolut regel byggd på en möjlighets-källa faller för första motexemplet

**[UNIVERSAL]**

**Fångad:** 2026-08-08 (`167`-notes, skarpbeviset betalt i förtid); rättad
2026-08-09 (`#1062`).

**Vad som hände:** CLAUDE.md sade att en mitt-i-sessionen-registrerad hook
*"tas ALDRIG i bruk"*. Förstapartskällan säger *"the file watcher **may have
missed** the change"* — en möjlighet. Mätningen: en settings-ändring som
anlände via main-ff-synk laddades mitt i byggsessionen och hooken fällde
skarpt. Regeln mildrad till "kan inte FÖRLITAS på": planera för utebliven
laddning, ta emot en tidig fällning som giltigt bevis.

**Lärdomen:** en regel ska bära samma modalitet som sin källa. Ett "may" som
skrivs om till "aldrig" är bekvämare att planera mot men falsifieras av
första motexemplet — och tills dess blockerar det giltiga bevis (en tidig
skarp fällning skulle ha avfärdats som omöjlig). Granne till `[[L481]]`:
samma dokumentations-klass, motsatt riktning.

### L490 — En granskningsyta mot fel träd ger falsk oro

**[UNIVERSAL]**

**Fångad:** 2026-08-08 (S93 Del 13, dev-server-instansen).

Marcus granskade `localhost:5173` — som serverade `main`, inte bygget som
väntade i kön. Ytan såg trasig/oförändrad ut och skapade felsöknings-oro utan
att något fel fanns. Före en granskning: verifiera VILKET träd ytan serverar
(gren/SHA), särskilt när landningar är i flykt. Gransknings-regeln (verifiera
mot dev-server/staging, aldrig mot en väntad landning) förutsätter att
dev-servern faktiskt kör det som ska granskas. Syskon till `[[L494]]` — samma
rotklass: fel träd som facit.

### L491 — Ett monitor-event kan utebli, och TaskGet är fel liveness-instrument — förgrundsverifiera

**[UNIVERSAL]**

**Fångad:** 2026-08-08 (nionde pausens carry).

En enskild landning passerade utan monitor-event, och `TaskGet` svarade
"not found" på en bevisligen levande background-task. Vakt-event är
väckarklocka, aldrig fakta — och även FRÅNVARON av event är osäker
information: lång tystnad verifieras mot monitorns eget liv, inte tolkas som
"inget har hänt". Före varje handling som bygger på ett vakt-tillstånd:
förgrundsverifiera mot git/REST.

### L492 — Ett verktyg som skriver repo-filer måste vara formatter-rent

**[UNIVERSAL]**

**Fångad:** 2026-08-08 (`167`-bygget; Biome-efterfixen `#1025`).

`facit-godkann`-skriptets JSON-serialisering skrev en form Biome ville skriva
om — en efterfix-PR krävdes. Ett skript som producerar incheckade artefakter
ska producera dem i formatter-normaliserad form (kör formattern som del av
skrivningen, eller matcha dess stil exakt) — annars är varje körning av
verktyget en framtida röd grind som fäller FÖRFATTAREN i efterhand, inte
verktyget.

### L493 — ADR-mintning bumpar README-räkningen i SAMMA commit

**Fångad:** 2026-08-08 (ADR-039-grinden fällde `#1020`).

`docs/decisions/README`-räkningen är en del av mintningens
definition-of-done, inte en separat städning — en ADR-commit utan
räknings-bump är per konstruktion röd. **Varför INTE `[UNIVERSAL]`:**
grinden och räkningen är spoke-specifika (ADR-039); klassen "en räknare
uppdateras i samma commit som sin källa" bärs redan av
kopierings-drift-lärdomarna.

### L494 — Ett research-pass i huvudkatalogen ser inte sessionens opushade arbete

**[UNIVERSAL]**

**Fångad:** 2026-08-08 (S100:s carry, uppdrags-instansen).

Ett research-pass prövade uppdragets premiss mot huvudkatalogens träd — som
inte bar sessionens opushade arbete — och kallade utfallet "verifierat".
Rapporten läste i efterhand som om passet kunnat se allt. Uppdrag som ber en
agent pröva KODENS TILLSTÅND måste peka ut vilket träd som är facit
(huvudkatalog, viss worktree, viss gren/SHA); mottagaren ska bokföra vilket
träd som faktiskt lästes. Syskon till `[[L490]]`.

### L495 — Ett ärvt villkor läses om mot den nya ytans semantik, inte mot sin egen kod

**[UNIVERSAL]**

**Fångad:** 2026-08-08 (S100, resultatläges-instansen).

`!arBekraftad && !vald` var rätt i markeringsläget och fel i resultatläget —
och felet syntes bara i det andra läget, där den omarkerade personen är
"klar", inte "utanför". Ett villkor som ärvs till en ny yta bär den GAMLA
ytans antaganden; det måste läsas om mot vad symbolerna BETYDER i den nya
kontexten, inte bara konstateras vara samma kod.

### L496 — En lint-fångst kan vara en designfråga i förklädnad

**[UNIVERSAL]**

**Fångad:** 2026-08-08 (S100, scroll-effekten).

Biomes `useExhaustiveDependencies` på scroll-effekten var formellt korrekt
OCH substantiellt viktig: rätt svar var inte att tysta regeln utan att fråga
vad som ska hända per läge — varpå det föll ut att `skickar` inte ska
scrolla. Innan en lint-varning tystas eller mekaniskt "fixas": pröva om den
pekar på ett obesvarat designbeslut.

### L497 — Marcus fråga om ett ord är ett fynd, inte en lucka i hans kunskap

**[UNIVERSAL]**

**Fångad:** 2026-08-08 (S100, "Vad betyder delutfallet?").

Frågan visade att ett bärande krav i två styrande dokument saknade kanonisk
betydelse. När beslutsfattaren frågar vad ett begrepp betyder är
default-tolkningen att BEGREPPET är odefinierat — svaret är
ordliste-/kanoniseringsarbete (och en kontroll av var begreppet används),
inte en förklaring av vad skribenten råkade mena.

### L498 — En nummer-mätning läser REGISTRET, aldrig katalogen

**[UNIVERSAL]**

**Fångad:** 2026-08-08 (S100, `T137`-instansen).

Trådnumret såg ledigt ut i `tasks/threads/`-listningen men var taget i
README-indexet — ett nummer kan vara reserverat utan att någon fil bär det.
Felet överlevde egen verifiering och fångades av att en parallell sessions
kadensrad krockade och bar rätt siffra: **merge-konflikten var granskaren.**
Där ett register finns är registret den auktoritativa ytan; katalogen är en
projektion.

### L499 — En grön grind mot ett föråldrat träd är ett falskt godkännande — och klassen fäller även den som känner den

**[UNIVERSAL]**

**Fångad:** S100 varv 12 (2026-08-07) + TRE stale-arbetsträds-instanser samma
dag 2026-08-08 trots känd klass (K1/`T138`; åttonde pausens carry — den
kandidatlistan tappades ur carry-kedjan och skördas här med tappet öppet
bokfört, se sessionsdok S93 Del 17).

Varv 12 byggde 30 commits bakom `main` mot en fil som skrivits om samma
eftermiddag; typecheck, biome och build var gröna, och ytan var ändå fel. En
grind prövar trädet den står i — inte trädet som gäller. `git fetch` +
fast-forward före ett bygge som rör filer andra sessioner äger är billigare
än rivningen, och att klassen fällde tre gånger på en dag för läsare som
KÄNDE den är beviset för att disciplinen ska in i uppdragens form (explicit
synk-steg), inte i minnet.

### L500 — Mint-ögonblicket är inte landnings-ögonblicket

**[UNIVERSAL]**

**Fångad:** 2026-08-07 (S100, `T134`→`T136`-kollisionen).

Numret var ledigt när det mintades och taget när det skulle landa;
kollisionen löstes vid merge men commit-taggarna `[T134]` i varv 14–18 kan
inte skrivas om. Vid parallella sessioner: re-verifiera numret i
mint-ögonblicket OCH kontrollera igen vid landning — och räkna med att
historik-artefakter (commit-meddelanden) kan bära det gamla numret.

### L501 — HMR-loggen fångar mellanlägen som ser ut som verkliga fel

**[UNIVERSAL]**

**Fångad:** 2026-08-07 (S100 varv 7, 9, 12–13 — tre instanser).

`Error in route match` loggades för att en symbol refererades innan dess
Edit hunnit landa — ett mellanläge, inget fel. Varje gång krävdes en
framtvingad omladdning för att skilja mellanläge från verkligt fel. I en
HMR-miljö är ett fel som uppstår MITT I en redigeringssekvens misstänkt tills
det reproducerats efter full omladdning.

### L502 — En trunkerad logg-läsning ger inte bara fel förklaring — den ger en ofullständig ARBETSORDER

**[UNIVERSAL]**

**Fångad:** 2026-08-09 (`172` varv 2).

En delvis läst CI-logg gav ett direktiv om två specs; den fulla läsningen
(881 rader, `gh run view --log-failed`) gav fem. Granne till `[[L478]]` och
`[[L479]]`: där producerade trunkeringen en falsk förklaringsuppgift — här
en beskuren åtgärdslista som SÅG komplett ut och skickades som order. Ett
utfall läses i sin helhet innan det blir direktiv; "de fel jag såg" är inte
"felen".

### L503 — En spärr som substräng-matchar kommandotext fäller PAYLOAD — text i argument är data, inte anrop

**[UNIVERSAL]**

**Fångad:** 2026-08-09 (`168`-notes, falsk-positiv-klass 4+5).

`backlog task create`/`task edit`-anrop vars beskrivnings- respektive
notes-TEXT nämnde stämplingsskriptets namn fälldes av hooken — payload-text
som passerar genom Bash-argument är inte en anropsväg. Fixen (`168`,
`#1036`): matcha kommando-POSITION/skrivform (programmet som utförare,
skriv-vektorns mål) i stället för fri substräng över hela kommandotexten. En
vakt över kommandon måste skilja UTFÖRANDE från OMNÄMNANDE — annars nekar
den bokföringen av sig själv.

### L504 — En batch-CLI-edit faller atomiskt på ett antaget index

**Fångad:** 2026-08-09 (`171.5`-stängningen).

En `task edit`-batch mot DoD-index som inte fanns på kortet fällde HELA
batchen — inget delresultat landade. Läs kortets faktiska yta (vilka
AC-/DoD-index som existerar) före en batch-edit mot den. **Varför INTE
`[UNIVERSAL]`:** instans av den redan etablerade verifiera-före-skriv-
klassen, specifik för backlog-CLI:ts atomiska batch-semantik.

### L505 — En radbruten prosarad som börjar med +, - eller * är en fantomlista

**[UNIVERSAL]**

**Fångad:** S93 iterationsvågen (527 fel ur ett tecken) + andra instansen
2026-08-09 (plustecken först på radbruten rad, tionde pausens carry).

markdownlints MD004 `consistent` läser FÖRSTA listmarkören i filen som norm
— en prosarad vars radbrytning råkar lägga `+`, `-` eller `*` först på raden
blir en lista i parserns ögon och kan kapa referensen för HELA filen. Vid
radbrytning av prosa: låt aldrig ett listmarkör-tecken hamna först på raden.

### L506 — Teckenantal är fel proxy för renderad textbredd — mät, härled inte

**[UNIVERSAL]**

**Fångad:** S93 iterationsvåg 1 (breddlåset; skördad ur andra pausens carry
vid tionde resumen).

Beslutet avgjordes av 143,69 mot 142,33 px — en skillnad teckenräkning inte
kan se, eftersom typsnitt är proportionella. När en text ska passa ett
utrymme: mät den renderade bredden (DOM/canvas-mätning), härled den inte ur
stränglängden. Syskon till `[[L483]]` (rätt storhet, rätt omfång).

### L507 — En delad markör i /tmp rapporterar till EN session

**[UNIVERSAL]**

**Fångad:** S93 (heartbeat-fyndet, andra pausens carry; skördad vid tionde
resumen).

Ett verktyg vars state delas mellan sessioner via en gemensam
`/tmp`-baserad markör rapporterar bara till den session som råkar äga
markören — de andra ser tystnad och tolkar den som "inget hänt".
Generaliserbart till varje delad fil-markör utanför repot: delat state är
per-maskin, inte per-session; ska flera sessioner bevaka samma sak behöver
markören per-session-nyckling eller en uttalad ägare.

### L508 — Promovering löser strukturellt vad grindar bara lappar

**[UNIVERSAL]**

**Fångad:** 2026-08-08 (ADR-103-arcen; åttonde pausens carry, skördad med
carry-tappet öppet bokfört).

En yta som promoverats till EN sanning behöver ingen vakt som jagar
divergenser mellan två — grinden vaktar symptomet (att kopiorna glider
isär), promoveringen tar bort symptomets källa (att det finns två). Innan en
ny grind byggs för att hålla två ytor i synk: pröva om den ena ytan kan
promoveras till enda bärare och den andra rivas eller reduceras till pekare.

### L509 — macOS xargs saknar -a

**Fångad:** 2026-08-08 (åttonde pausens carry).

BSD-`xargs` (macOS) läser endast stdin; `-a fil` är GNU-specifikt. Använd
`< fil xargs …` eller `cat fil | xargs …`. **Varför INTE `[UNIVERSAL]`:**
verktygsfakta av stack-klass, inte en arbetsprincip — hör till
plattformsfakta-sektionerna.

### L510 — Ett citerat tal bär sin egen storhet, ett citerat kommando sin egen miljö — re-mät i exekverings-ögonblicket

**[UNIVERSAL]**

**Fångad:** 2026-08-09 (`172`-slutrundan, byggagentens premiss-pass — båda
instanserna fångade av mottagaren, ADR-086 i funktion).

(a) Policy-filens `_readme` sade "15 REST" — det räknade policy-POSTER;
AST-mätningen gav 17 FÖREKOMSTER. Uppdraget sade "verifiera antalet mot
filen, lita inte på siffran"; agenten mätte och byggde på 17. (b) Uppdragets
literala `npx playwright test --project=acceptance` föll hårt utan
`PLAYWRIGHT_ACCEPTANCE_DEV_SERVER=1` — `package.json`-skriptet var den
gällande formen. Granne till `[[L487]]`: ett tal källmärks MOT SIN STORHET
(poster ≠ förekomster ≠ filer) och ett kommando mot den yta som ska
exekveras (repots skript-form, inte en historisk kommandorad). Mottagaren
re-mäter båda med instrumentet som faktiskt ska användas.

### L511 — Ett skript utan --help exekverar när det tillfrågas

**[UNIVERSAL]**

**Fångad:** S93 (seed-skriptet; skördad ur andra pausens carry vid tionde
resumen).

`--help` mot seed-skriptet KÖRDE skriptet skarpt — flaggan var okänd och
ignorerades i stället för att stoppa (bas-vakterna höll, ingen skada).
CLI-skript svarar på `--help`/`-h` utan sidoeffekter, och en OKÄND flagga är
ett fel som stoppar körningen — aldrig något som tyst ignoreras medan
skriptet kör sitt default-beteende.

### L512 — En stoppad agent med deploy i sin DoD har kanske redan lämnat spår utanför git — mät artefakten, inte bara worktreen

**När en bygg-agent vars kort bär "deploy till staging" stoppas mitt i, är
`git status` i dess worktree ett OFULLSTÄNDIGT bokslut. Deployen lämnar inget
spår i git. Följ varje stopp med en artefakt-mätning (`supabase functions
list`, motsvarande för andra mål) och återställ pariteten mot `main` om
artefakten hunnit före.** `[UNIVERSAL]`

Instans (S109, 2026-08-21): `TASK-283.1`-agenten stoppades när Marcus valde
väg B för personlistan, vilket gjorde EF-bokstavsfiltret onödigt. Worktreen
visade sju okommittade filer, ingen gren, ingen PR — "inget förlorat, inget
läckt". Men `functions list` mot staging visade `get-persons` **v27,
uppdaterad 10:02:47Z**, fem minuter före stoppet: agenten hade deployat kod
som aldrig nådde `main`. `main`:s version deployades om (v28, 10:07:51Z) och
pariteten var tillbaka inom fem minuter — staging-CI hade annars kört mot en
EF ingen review sett.

**Det generella:** samma klass som `CLAUDE.md` § Prod-EF-deploy ("en driftkarta
härledd ur git är en HYPOTES om prod, aldrig en mätning") — men riktad mot
STOPP-ögonblicket, där frestelsen att nöja sig med `git status` är störst
eftersom stoppet känns som att inget hann hända. Varje sidoeffekt som inte bor
i git måste ha sin egen mätning i stopp-rutinen; annars är "agenten hann inte"
ett antagande med samma felklass som "EF:en är aldrig deployad".

### L513 — Ett nekat kommando körde INGENTING — omtaget måste upprepa hela kommandot, inte bara ledet efter det som fälldes

**När en PreToolUse-hook nekar ett sammansatt Bash-kommando körs inget av
leden — inte heller de som stod FÖRE det hooken reagerade på. Omtaget måste
därför upprepa allt, eller verifiera varje sidoeffekt mot disk innan nästa
steg. Antagandet "det tidiga ledet hann köras" är en osynlig dataförlust.**
`[UNIVERSAL]`

Instans (S109, 2026-08-21): ett landningskommando bestod av `cat >>`
(sessionsdokets Del 6) · markdownlint · `git add/commit` · `arbetsform rensa`
· `git push`. Push-spärren (ADR-097) fällde hela kommandot på `git push`. I
omtaget kördes bara lint + commit + rensa — appenden upprepades aldrig,
commiten innehöll tre bildfiler och ingen Del 6, och PR `#1682` landade utan
den. Upptäckt en timme senare av en slump (en grep efter `^## Del 6` vid en
rebase-konflikt gav noll). Texten fanns bara i sessionens trail och
återinfördes därifrån; hade sessionen kompakterats emellan hade den varit
borta.

**Det generella:** en nekad tool-call är atomär — allt eller inget. Samma
klass som `L440` (pipens exitkod) fast åt andra hållet: där döljer skalet ett
fel, här döljer hooken en utebliven körning. Bygg omtaget som ett fullständigt
kommando, och låt transparens-rapporten läsa resultatet från disk
(`git show --stat`), inte från minnet av vad som var tänkt att köras.

### L514 — En CI-grind som saknas i agentkontraktets kommandolista fäller agent efter agent — kontraktet är verifieringens yta, inte ci.yml

**En grind som körs i CI men varken finns i ett npm-script eller i
`.claude/agents/bygg-agent.md`:s verifieringslista är osynlig för varje
bygg-agent som följer kontraktet. Agenten kan då ha ALLA sina föreskrivna
grindar gröna och ändå pusha rött — och felet ser ut som slarv fast det är en
kontraktslucka. Mät alltid en röd CI mot vad agenten FICK i uppdrag att köra
innan den klassas som agentens miss.**

Mätt 2026-08-21 (S109 våg 1, fem parallella bygg-agenter). Fyra av dem rörde
`src/`; **två av de fyra** föll på samma grind i samma runda:

| PR | Kort | Träffar |
|---|---|---|
| `#1707` | `TASK-285.2` | 1 långt streck, `src/components/primitives/MessageBox.tsx:114` (dev-throw-strängen) |
| `#1703` | `TASK-285.3` | 4 långa streck, `src/routes/dev/primitives.tsx` (JSX-text i demo-sektionen) |

Grinden är `node scripts/check-langa-streck.mjs`, wirad direkt i `ci.yml`s
`Lint + Audit + TypeCheck`. Verifierat med `grep`: den finns **varken i
`package.json` eller i `scripts/check-docs.sh`**, och stod inte i
bygg-agent-kontraktets lista (`npm run check:docs` · `typecheck` · `biome
check .` · `build` · `test:api`).

Båda agenternas lokala grindar var faktiskt gröna — orkestreraren mätte om dem
på deras egna grenar (`typecheck` exit 0, `biome check .` exit 0 med noll
errors, `audit-ci` exit 0 på `main`) innan någon slutsats drogs. Utan den
mätningen hade två korrekt arbetande agenter fått en felaktig premiss-rättelse
i sitt uppdrag, och nästa våg hade ärvt den.

**Varför `verify:ci-parity` inte täcker hålet i praktiken:** verktyget hade
fångat det — det YAML-parsar `ci.yml` och kör dess `run:`-block verbatim — men
det är per `ADR-036` § Updates ett DIAGNOSVERKTYG, uttryckligen inte en
per-push-rutin (910,7 s mot CI:s 401,0 s; ~30× kostnaden av besparingen). Ett
verktyg som bara får plockas fram i tre namngivna lägen kan inte vara den
mekanism som håller den dagliga kommandolistan sann.

**Det generella (UNIVERSAL):** när en grind läggs till i CI utan att samtidigt
läggas till i den yta utförarna faktiskt läser, uppstår en tyst
verifieringslucka som skalar med antalet parallella utförare — fem agenter ger
fem chanser att falla på den, inte en. Kostnaden syns först som "agenten
slarvade", vilket är den dyraste feldiagnosen: den lagar fel sak.
Motmedlet är att grindens hemvist är EN yta som både CI och kontraktet läser,
eller — när det inte går — att tillägget i CI och tillägget i kontraktet är
samma landning.

### L515 — En grind som mekaniserar ett förbud måste mekanisera dess föreskrivna undantag i samma andetag [UNIVERSAL]

**Ett förbud har nästan alltid ett föreskrivet undantag — "aldrig X, utom
efter Y". Mekaniseras bara förbudet blir grinden grön i åratal, eftersom
ingen ännu nått undantaget, och fäller sedan på den FÖRSTA som gör exakt det
processen kräver. Felet ser då ut som ett fel i arbetet, inte i grinden.
Fråga vid varje ny grind: vad är det tillåtna slutläget, och kan grinden
skilja det från överträdelsen?**

Instans (S110, 2026-08-22, miranon-media-admin): `check-facit.sh` invariant
(b) krävde att varje `kallor`-sökväg i ett facit-manifest finns på disk.
`ADR-103` B2 steg 4 FÖRESKRIVER att prototyp-substratet rivs efter Marcus
stämpel — vilket gör sökvägen död med avsikt. Invarianten skrevs 2026-08-06,
var grön i sexton dagar, och fällde `PR #1769` (`TASK-285.11`) 2026-08-22:
den första rivning som någonsin nådde steget. Fyra familjer till stod på tur
mot samma vägg — 22 prototyp-källor i fem stämplade manifest.

**Vad som gjorde undantaget svårt att se:** grinden var byggd av samma
sessioner som skrev processen, och båda var korrekta var för sig. Förbudet
("riv aldrig före stämpeln", invariant c) hade en mekanism; slutläget
("rivningen ÄR steg 4") hade ingen, eftersom ingen ännu hade utfört det. En
grind kan inte testas mot ett tillstånd som inte finns än — den måste
KONSTRUERAS mot det.

**Formen som löste det, generaliserbar:** härled undantaget ur ett spår som
redan finns, i stället för att beskriva det med en handhållen lista. Här var
det stämpelns commit-SHA, som varje godkänt manifest redan bar: fanns filen
vid stämpeln och är borta nu, är frånvaron det föreskrivna slutläget. Fanns
den inte heller där, är sökvägen trasig. Alternativet — en mönsterlista över
"vad som räknas som prototyp" — hade burit två fel samtidigt: den accepterar
en sökväg som aldrig funnits, och den glider isär från verkligheten. Samma
klass som repot redan mätt två gånger i markörlistan (`TASK-192` döda
markörer, `TASK-287` saknade). Beslut och mätserie:
`ADR-102` § Updates 2026-08-22 (Rivna prototyp-källor).

**Relaterat, men inte samma sak:** fragmentet
`facit-kallor-ompekas-fore-stampeln.md` ger den operativa omvägen — peka om
`kallor` i flip-skivan medan manifestet ännu är skrivbart. Den räcker bara
när prototypfilen har en skarp EFTERTRÄDARE att peka på. Mätt 2026-08-22:
hem- och svep-familjerna har 6 av 6 källor som är rent prototyp-substrat utan
efterträdare, och segment-familjen 7 av 9 — där finns ingenting att peka om
till, och omvägen är strukturellt otillgänglig. En operativ omväg som bara
täcker halva fallmängden är inte en lösning på grindens lucka.

### L516 — Två deploy-mekanismer för samma system skapar ett glapp ingen grind ser

**[UNIVERSAL] När två delar av samma system rullas ut via OLIKA mekanismer —
en automatisk, en manuell — är fönstret mellan dem ett tillstånd ingen mätning
i CI kan se. Klienten och dess API kan vara internt konsistenta i repot,
gröna i varje jobb, och ändå osynkade i produktion. Grinden mäter trädet;
glappet uppstår i utrullningen, efter att trädet lämnat den.**

Asymmetrin är hela felet. Vercel deployar Production automatiskt i
merge-ögonblicket; Supabase Edge Functions deployas inte alls automatiskt.
Två halvor, två utlösare, ingen gemensam grind — och ingenting i repot är
någonsin fel.

Mätt två gånger på fem dagar, med motsatta symptom:

- **2026-08-17 (S107), högljutt.** Prod-EF:erna deployades 13:08Z medan
  sessionens EF-rörande mergar landade 15:42–18:16Z. Den gamla
  `_shared/attachments.ts` returnerade inte nycklarna
  `rackvidd`/`kursfamilj`/`kursniva`; den nya fronten parsade dem med
  `.nullable()` (inte `.optional()`) via kastande `.parse()`. Varje yta som
  listade bilagor kastade i prod.
- **2026-08-22, tyst.** Fronten gick live 16:37Z medan prod-EF:en
  `get-persons` bar `UPDATED_AT` från 2026-08-20 — äldre än båda skivorna som
  lärde den registerläget. Klienten frågade efter `register=true`; EF:en kände
  inte parametern, föll igenom till sök-grenen och klampade till `pageSize`
  50. Personlistan visade 50 av 559. Ingen 500, ingen röd yta, inget larm:
  den gamla servern svarade korrekt på en fråga klienten inte hade ställt.

Den tysta varianten är den farliga. Ett kast syns; en stympad lista ser ut
som en kort lista.

## Den persisterade cachen gör glappet långlivat EFTER att det stängts

Det är den delen som gör lärdomen värd att skriva ned, inte bara
deploy-ordningen.

Stänger man glappet — deployar den saknade halvan — är felet inte
nödvändigtvis borta. Klienten kan ha SPARAT det gamla svaret. En cache som
persisteras till `localStorage` överlever omladdningen, och det enda
versionsskydd den bär är en app-versions-buster. Bustern är verkningslös här,
och det är inte en bugg i den: **appversionen var redan den nya när fel data
skrevs.** Datan föddes i glappet, under den nya fronten, och matchar därför
vid restore. Bustern kan skilja gammal app från ny app; den kan inte skilja
ny app som pratade med gammal server från ny app som pratade med ny server.

Två inställningar förlängde felet i vår instans: `maxAge` 24 timmar, och en
`staleTime` som just höjts till 30 minuter för den drabbade nyckeln. Med båda
satta var den felaktiga datan både bevarad och FÄRSK — ingen
bakgrundshämtning startade. Fixen blev en manuell radering av
lagringsnyckeln.

Och skyddet man tror finns fanns inte: `refetchOnWindowFocus` verkar bara på
en STALE fråga. Inom `staleTime`-fönstret hämtar en fokus-återkomst
ingenting. Kodens egen kommentar sa det rakt ut, korrekt, och stod där när
felet inträffade — en anteckning är ingen grind.

## Vad som faktiskt håller

1. **Rulla ut den manuella halvan FÖRST.** En ny server som svarar en gammal
   klient är bakåtkompatibel så länge tillägget är additivt. Tvärtom öppnar
   det cache-fönstret ovan. Ordningen är inte stilistisk — den är skillnaden
   mellan ett transient fel och ett som överlever sin egen fix.
2. **Mät innehållet, inte deployen.** En version som bumpas på allt vid varje
   utrullning kan inte skilja "omdeployad" från "deployad med ny kod". En
   innehålls-hash kan: i vår instans bytte `get-persons` hash medan
   `get-events` behöll sin genom SAMMA deploy. Kontrasten är beviset.
3. **Rensa klientlagringen för den som satt i glappet** — annars bär den
   felet vidare.
4. **Ge ordningen en BÄRARE, inte bara en rad.** Ordningen var redan
   dokumenterad i runbooken när den bröts andra gången. Ett steg som heter
   "front-deployen verifierad utrullad" kan bara VERIFIERA, aldrig
   SEKVENSERA, när plattformen skickar ut fronten i merge-ögonblicket. En
   regel vars mekanism inte kan hålla den är en önskan.

   **Bäraren i vårt substrat är ett KORT, och kontrasten är mätt inom samma
   dygn.** `TASK-284.6` (*"Prod-utrullning: eventlänkens vakt och åtgärdskön"*)
   skapades `2026-08-21 11:36` som en planerad skiva i sin egen familj och stod
   `Done` när familjen stängdes. `TASK-286`-familjen fick ingen motsvarighet:
   `TASK-286.8` skapades först `2026-08-22 17:34` — efter att fronten gått live
   `16:37Z` i precis det glapp kortet skulle ha förhindrat. (Backlog-CLI:ts
   tidsstämplar är UTC; mätt mot `26ec953a`, vars `updated_date 12:36` hör till
   en commit gjord `14:36:55 +0200`.) Skillnaden mellan de två spåren låg inte i
   kunskap — båda visste att EF-halvan deployas för hand. Den låg i om
   skivningen gav den halvan en egen post med eget DoD. **Rör en familj en
   manuellt utrullad halva bär den en prod-utrullningsskiva; annars är
   utrullningen ett minne, och minnen har ingen bevakare.**

Testa därför inte bara om halvorna passar ihop i repot. Fråga vad som är ute
i produktion just nu, i båda halvorna, mätt på artefakten — en driftbild
härledd ur git är en hypotes.

Relaterat: `TASK-286.8` (instansens fulla bokföring), `TASK-289`
(`staleTime`-risken, materialiserad), `TASK-296`,
`tasks/sessions/2026-08-17-session-107.md` rad ~285–325 (den första
instansen), `CLAUDE.md` § Prod-EF-deploy körs via SKRIPTET.

### L517 — Läs tillbaka det du INTE rörde — en additivt klingande flagga kan ha ersatt hela sektionen

**[UNIVERSAL] En skriv-flagga vars namn låter additivt (`--notes`, `--tag`,
`--description`) kan ERSÄTTA hela den sektion den namnger. Läs-tillbaka-passet
efter en CLI-skrivning måste därför pröva det du INTE skrev. Ser du ditt eget
värde på plats är det inget bevis för att grannarna finns kvar — det är exakt
den observation en destruktiv skrivning också producerar.**

Instans (S109 resume 3, 2026-08-22): `npm run bl -- task edit TASK-283.4
--notes '<rättelse>'` skulle rätta en felmätt mening i en överlämningsnot.
Flaggan ersatte hela `SECTION:NOTES`-blocket. Med det försvann `TASK-285.11`:s
överlämning av visual-baslinjen och dess förkrav — att *"Allow GitHub Actions
to create and approve pull requests"* är en tre-nivåers kedja som måste mätas
FÖRE dispatchen, med två empiriska run-ID:n som belägg. Commit `26ec953a`
(−9/+13 rader); återställd ur `8ebfab2c` i `54577365`.

**Förlusten fångades inte av läs-tillbaka-passet.** Den upptäcktes flera turer
senare, av en `grep` efter den citerade texten som gav noll träffar. Det är
felklassens kärna: efter skrivningen stod den nya noten där, korrekt, precis
som väntat. En läsning som frågar *"landade det jag skrev?"* får ja. Bara en
läsning som frågar *"finns det jag inte rörde kvar?"* hade fångat det.

**Andra instansen av `L239`:s klass** — samma verktyg, samma flagga, 2026-07-06,
redan `[UNIVERSAL]`-märkt: *"`--notes "keep"` → Implementation Notes TYST
ÖVERSKRIVNA"*. `L239`:s regel (läs tillbaka objektet omedelbart efter varje
CLI-skrivning) var nedskriven och otillräcklig som formulerad: den riktar
läsningen mot skrivningen, inte mot det oskrivna. Två instanser av samma flagga
på samma verktyg gör detta till en kandidat för uppgradering till Kritisk
regel, inte en ny sidopost.

**Formen som håller:** läs ut sektionen FÖRE skrivningen, skicka in den
kompletta texten med din ändring inarbetad, och diffa efteråt mot det du läste.
Behandla varje sektions-flagga som destruktiv tills verktygets egen
dokumentation säger annat — antagandet åt det hållet kostar en extra läsning,
antagandet åt andra hållet kostar en artefakt.

**Bokföringen av instansen bär själv ett mätfel värt att notera.**
`54577365`:s commit-meddelande säger att ÄVEN `TASK-283.2`:s kortkommentar
raderades. Diff-mätt höll det inte: kortets innehåll vid `8ebfab2c` och vid
`26ec953a^` (`2ad0703d`) är byte-identiskt, och sektionen bar ETT sammanhängande
block. Felräkningen färdades sedan vidare in i nästa uppdrags premisser. En
förlust som bokförs i efterhand tenderar att bokföras större än den var — mät
den mot diffen, räkna den inte ur minnet.

### L518 — En grön grind bevisar att inget fällde — inte att låset täcker det du tror

**[UNIVERSAL] Ett regressionslås kan tappa täckning utan att någonsin bli rött.
Möts en partiellt matchande assertion av en uppdaterings-flagga som bara skriver
om det som FÄLLER, blir resultatet ett lås som passerar varje körning och inte
längre beskriver ytan. Grönt är frånvaro av fällning, aldrig närvaro av
täckning.**

Instans (`TASK-283.4`, 2026-08-22): sex `toMatchAriaSnapshot`-referenser skulle
sättas om mot personlistans nya form — en bokstavsrad ovanför listan. Två
mekanismer möttes:

- `toMatchAriaSnapshot` matchar **partiellt**: extra syskonnoder tolereras så
  länge referensens egna noder står i samma inbördes ordning. Fyra av de sex
  referenserna passerade därför utan att innehålla den nya raden.
- `--update-snapshots` utan värde har preset `changed`. Playwright 1.62.1:s egen
  `--help`, verbatim: *"choices: 'all', 'changed', 'missing', 'none', preset:
  'changed'"* — den skriver alltså bara om en referens som fäller.

Mätt: `--update-snapshots` skrev om **2 av 6** filer, `--update-snapshots=all`
skrev om **6 av 6** (commit `dcb06829` bär sex ändrade `.aria.yml`). Med
standardflaggan hade sviten rapporterat 16 passerade / 0 fällda medan fyra lås
saknade raden — och en regression i just den raden hade fångats av ingenting.

**Det generella:** när ett lås sätts om efter en avsiktlig formändring, mät
ANTALET omskrivna referenser mot antalet du förväntade dig. Det talet, inte
grindens färg, är beviset på att låset täcker den nya formen. Frågan gäller
varje snapshot-verktyg med en `changed`- eller `missing`-default och varje
assertion som matchar delmängder i stället för helheter: den som bara reparerar
det röda lämnar det gröna ofullständiga kvar, och ofullständigheten är osynlig
per konstruktion.

**Tvåsidigt bevis hör till samma andetag.** Omskrivningen verifierades genom att
döpa om en nod i en av de nya referenserna — grinden föll (exit 1). Före
omskrivningen kunde samma provokation inte fälla någonting. Det är skillnaden
mellan ett lås och en fil som råkar ligga där.

Släkt: fragmentet `verifiera-mot-den-axel-andringen-ror-inte-mot-fixturernas-rakade-tomhet.md`
— samma rotklass, där i FIXTUR-ledet i stället för i uppdaterings-ledet.

### L519 — Agentens `grep` utelämnar filer tyst — och tystnaden ser ut som frånvaro

**[UNIVERSAL] `grep` i Claude Code:s skal är inte systemets `grep`. Det är en
skalfunktion som kör `ugrep` med `-I` (hoppa över binärfiler) och
`--ignore-files` (respektera ignore-listor). Båda flaggorna får en fil att
försvinna UTAN meddelande: sökningen returnerar tomt och exit 1 — samma utfall
som när strängen genuint inte finns. Ett noll-resultat ur en agents `grep` är
därför aldrig ett bevis för frånvaro.**

Differentialmätning (2026-08-22, `ugrep 7.8.4`, macOS; fixtur: en `.tsx` med en
rå `0x00` mitt i en sträng, och en `.txt` som en `.gitignore` bredvid pekar ut):

| Anrop | NUL-filen | Ignore-listad fil |
|---|---|---|
| skalets `grep -rn` | inget utdata, exit 1 | inget utdata, exit 1 |
| skalets `grep -c` | **tom rad**, exit 1 | — |
| `/usr/bin/grep -rn` | `Binary file … matches`, exit 0 | träffrad, exit 0 |

Systemets `grep` SÄGER att filen är binär. Agentens säger ingenting alls.
Skillnaden är hela felet: den ena tystnaden är en observation, den andra är en
utelämnad fil.

**Instansen som avtäckte det** (`TASK-283.2`/`283.3`, 2026-08-22):
`PersonsList.tsx` fick en rå NUL-byte som fogtecken i en filternyckel, där
kommentaren två rader ovanför föreskriver ett mellanslag. Koden fungerade — NUL
är en giltig separator i en strängnyckel — och typecheck, lint, bygg och
sviterna var gröna. Men `file` klassade filen som `data`, `grep -c 'useMemo'`
gav tomt, och varje repo-bred `grep -rn` hoppade över den. `283.2`:s agent såg
symptomet och bokförde det som verktygsartefakt; `283.3`:s agent rotorsakade det
(`dedc5b51`). Efter fixen: `Java source, Unicode text, UTF-8 text`, och samma
`grep -c` ger 7.

**Två regler ur detta:**

1. **Beter sig ett verktyg avvikande mot EN indata medan det fungerar överallt
   annars, är avvikelsen en egenskap hos indatan.** "Verktygsartefakt" är en
   klassning som kräver belägg. Utan belägg är den en omväg runt ett fynd, och
   omvägen ärvs av nästa läsare som en källmärkt premiss.
2. **Ingen testnivå fångar en byte-form-defekt.** Felet låg i filens bytes, inte
   i dess semantik. Det som kan fånga det är `file`, en `git diff --stat` som
   visar `Bin`, eller en räkning av lästa filer. En inventering som vilar på
   `grep -rn` bör kunna svara på hur många filer som faktiskt lästes — annars
   mäter den sin egen filtrering.

Släkt: `ett-tyst-verktyg-ser-likadant-ut-som-ett-verktyg-utan-fynd.md` — där ett
övervakningsverktyg vars noll var tvetydigt, här ett sökverktyg vars noll var
falskt. Samma rot: frånvaro rapporterad av ett verktyg måste kunna skiljas från
trasig rapportering.

### L520 — En rättelse som står längre ned i samma dokument har inte rättat raden

**[UNIVERSAL] Ett dokument som bokför en korrigering i ett senare avsnitt men
lämnar den felaktiga raden orörd är inte rättat — det är självmotsägande.
Läsaren, människa eller agent, landar på raden och citerar den; ingen söker
igenom resten av dokumentet efter en dementi. Rättelsen hör hemma VID raden. En
not någon annanstans är en anteckning om felet, inte en åtgärd mot det.**

Instans (S109, 2026-08-22): Del 7 utpekade `ADR-122` som personregistrets
beslut. Numret hade en parallell session redan tagit för eventlänkens vakt
(`#1684`); personregistret blev `ADR-123`. Samma dokument bokförde kollisionen
**två gånger längre ned** — Del 9 § Numrering, verbatim: *"`ADR-122` togs av
S110 under passet; registret blev 123"* — men Del 7:s rad rättades aldrig. En
agent som stängde `TASK-283.1` hämtade raden och var på väg att skriva in en ADR
om Airtable-automation A1 i ett kort som stängs för gott. Den mätte mot
git-historiken, upptäckte förväxlingen och flaggade i stället för att bygga
vidare.

**Varför formen är särskilt förrädisk:** dokumentet var inte okunnigt om felet.
Det VISSTE, och skrev ned det. Kunskapen fanns i artefakten och saknade ändå
verkan, eftersom den låg på fel rad. Ett självmotsägande dokument är farligare
än ett felaktigt, för det ser granskat ut.

**Kontexten stärker regeln:** samma pass räknade **fem** fel i bokföringen och
**noll** i koden — ett manifest som citerade en text koden ersatt, `kallor` som
pekade på boundaryn i stället för formen, copy låst på fel yta. Koden var rätt
hela tiden; kartan över koden drev. Ju mer arbete som bärs av kartor — manifest,
kort, sessionsdok — desto större andel av kvalitetsarbetet ligger i att hålla
kartorna sanna, inte i att hålla koden rätt. Det är en resursfördelning värd att
göra medvetet.

**Operativt:** upptäcker du att en tidigare rad är fel — rätta raden, i samma
commit som du noterar felet. Är raden historik som inte får skrivas om, låt den
bära rättelsen på plats (*"Rättat ÅÅÅÅ-MM-DD: raden ovan sade X; det är Y, och
här är skälet"*), aldrig bara en not i ett senare avsnitt. Det var precis den
formen som slutligen användes här, och den kostade en rad.

Släkt: `L437` (en stängning som inte bryter ALLA ytor som bär posten återuppstår
som öppen) — samma rot, där mellan ytor, här inom en enda.

### L521 — Ett kommando du lämnar över körs i MOTTAGARENS träd — synka det före överlämningen

**[UNIVERSAL] När du ger en människa ett kommando att köra i sin egen terminal
ärver kommandot hennes arbetsträds tillstånd, inte ditt. Trädets färskhet är
ett förkrav du måste mäta och åtgärda FÖRE överlämningen. Efteråt har handlingen
redan skett, och en handling som skriver en durabel artefakt kan vara
oåterkallelig.**

Instans (S109, 2026-08-22): stämplingskommandon för två facit-manifest lämnades
över mot en checkout som låg **tio commits efter** `origin/main` — utan
`referenser`-fälten som `#1751` just lagt in. Stämpeln landade på ett föråldrat
träd; hade den committats hade den rivit hela `referenser`-arbetet. Marcus
första stämpel gick förlorad. Filen återställdes, trädet synkades, och han fick
stämpla om.

**Signalen fanns i klartext och lästes ändå fel:** grinden rapporterade **24**
ytor utan `referenser` efter stämpeln. Talet skulle ha gått NED från 22. Ett tal
som rör sig åt fel håll är en starkare signal än ett tal som bara är fel — och
det passerade ändå, eftersom ingen hade skrivit ut förväntan innan kommandot
lämnades ut.

**Varför detta inte är samma lärdom som
`stampel-sha-harleds-ur-ref-som-star-stilla.md`:** där härledde ett VERKTYG ett
SHA ur en lokal ref som stod stilla, och fixen låg i verktyget. Här var trädet
självt föråldrat i det ögonblick en människa körde kommandot, och ingen
verktygsfix hade hjälpt. Ansvaret följer överlämningen: den som formulerar
kommandot äger förkravet, eftersom mottagaren inte kan se vad avsändaren antog.

**Formen:** mät eftersläpningen i mottagarens träd (`git fetch` följt av
`git rev-list --count HEAD..origin/main`), synka, och skriv ut i samma andetag
vilket tal grinden ska visa efteråt och åt vilket håll det ska röra sig. Två
instanser på tolv dagar mot samma stämpelkedja gör förkravet till ett steg i
proceduren, inte en försiktighetsåtgärd att komma ihåg.
