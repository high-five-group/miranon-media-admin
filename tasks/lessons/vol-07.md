---
owner: marcus803
updated: 2026-08-23
review_by: 2026-11-15
status: stable
---

<!-- vale Miranon.VueToReact = NO -->
<!-- DEFERRED: Session 6.6.6 — Miranon.VueToReact Vue→React-drift fix -->
<!-- vale Vale.Terms = NO -->
<!-- Per ADR-032 (Session 6.6.6 K3.5 2026-05-20): helfil-disable mot L_X.2 Vale 3.14.1-upstream-quirk, ärvd från tasks/lessons/vol-06.md vid rotationen (S111, 2026-08-23). Brand-rule-aktivering bevarad — endast Vale.Terms täcks av helfil-disable. Lift vid upstream-fix per ADR-032 § Lift-protokoll. -->

# tasks/lessons/vol-07.md — Universella lärdomar, volym 7

> **AKTIV volym** sedan rotationen 2026-08-23 · 2026-08-23 → (L522–): Alla nya
> lärdomar tillkommer SIST i denna fil som `### Lnnn`-poster. Flat
> L-nummer-form.
>
> Ingång, uppslags- och append-regler: [`tasks/lessons.md`](../lessons.md) (indexet).
>
> **Volymens födelse:** rotationen utlöstes av indexets egen regel — `vol-06.md`
> stod på **3 436 rader** när S111:s skörd skulle landa, alltså över
> rotationströskeln 3 000, och stängdes därför vid `L521`. Till skillnad från
> `vol-02`–`vol-06`, som föddes ur en ENGÅNGS-DELNING av den gamla monolitfilen
> (`TASK-161.9`, 2026-08-08), föddes denna volym tom och fylldes framåt: varje
> post nedan är konsoliderad ur ett nummerlöst fragment i `tasks/lessons.d/`
> enligt ADR-081 (numret tilldelas vid landning).

---

## Fortsättning: flat L-numrering (ingen ny H2 per session i källan)

> Redaktionell rubrik, tillagd vid rotationen (S111, 2026-08-23) av samma skäl
> som `vol-05`:s och `vol-06`:s motsvarande rubriker: att hålla giltig
> rubrik-hierarki (H1 → H2 → H3) där konventionen sedan Session 59 är platta
> `### Lnnn`-poster utan `## Session N`-omslutning — se indexets not om
> konventionsskiftet. Posterna nedan tillkommer SIST i denna volym.
>
> **Markup-normalisering vid konsolideringen, utskriven per `L157`** ("Verbatim
> skyddar INNEHÅLL, inte MARKUP; Code får markup-normalisera men ska rapportera
> det som sådant"): fragmentens H1 blir postens `### Lnnn`-rubrik, och deras
> INRE `##`-rubriker är nedgraderade till `####`. Skälet är mekaniskt — inre
> `##`-rubriker blir syskon till denna redaktionella rubrik och kolliderar då
> under `MD024`, eftersom flera poster naturligt bär samma avsnittsnamn
> ("Regeln", "Den generella formen"). Ingen brödtext är ändrad. Samma
> nedgradering som hubbens `K109.5` gjorde av samma skäl.

### L522 — En grind som körs inuti ett skript är osynlig för hooken som vaktar grindanrop — pipe-maskeringen släpps igenom

**PreToolUse-hookar matchar KOMMANDOSTRÄNGEN, inte vad kommandot i sin tur
kör. Flyttas ett grindanrop in i ett skript ser hooken bara `bash skript.sh`
— och en pipe utanför skriptet maskerar då exitkoden utan att någon vakt
fäller. Skriptets eget `set -o pipefail` skyddar INTE mot en pipe som ligger
utanför det.** `[UNIVERSAL]`

Mätt i S111 (2026-08-22, `TASK-299`:s skivpublicering). L440-hooken hade
fällt två gånger tidigare samma session — den kände igen `audit-ci` och
`check-facit` i kommandosträngen och krävde bevarad exitkod, korrekt båda
gångerna. Sedan flyttades tre `task create`-anrop in i
`skivor-1-3.sh` och kördes som:

```bash
bash skivor-1-3.sh 2>&1 | grep -E "^Created task|^File:"
```

Hooken såg `bash` och `grep`, inga grindnamn, och släppte igenom. Pipen
returnerade **`grep`s** exitkod. Skriptet bar `set -euo pipefail`, men den
raden gäller pipes INUTI skriptet — den kan inte påverka en pipe som
omsluter hela anropet. Utfallet: **ett** av tre kort skapades, jobbet
rapporterade **exit 0**, och notifikationen sade "completed (exit code 0)".

**Fångsten var inte hooken utan en räkning:** utdatan bar en enda
`Created task`-rad där tre väntades. Utan den räkningen hade två skivor
saknats i grafen och beroendena i efterföljande kort pekat på ID:n som
aldrig fanns.

**Det generella:** en mekanisk vakt som matchar på ytform skyddar exakt så
långt som ytformen är synlig. Att bunta anrop i ett skript är ofta rätt —
men det flyttar samtidigt anropen ur vaktens synfält, och då är det
anroparens ansvar att bära exitkoden. Formen som fungerar: kör skriptet
naket (`bash skript.sh`), logga per-anrops exitkod inuti det, och verifiera
utfallet mot FAKTISKT TILLSTÅND på disk — aldrig mot jobbets samlade kod.

**Besläktat:** `L440` (grindens exitkod går förlorad i pipen) — denna post är
den varianten där vakten inte kan se att den borde fälla.

**Den andra halvan, mätt i samma session:** vakten fäller också på ett
grindnamn som råkar stå i kommandosträngen utan att vara ett grindanrop.
Ett `git commit -m "… markdownlint 0 issues." 2>&1 | tail -3` avvisades
som pipe-maskerad grind — pipen fanns, men den omslöt `git commit`, inte
en grind. Formen som fungerar är `git commit -F <fil>`.

**Det gemensamma:** en vakt som läser ytform har BÅDA felriktningarna —
den missar grinden som gömts i ett skript, och den fäller på namnet som
bara nämns. Ingen av dem är ett fel i vakten; de är dess pris. Kostnaden
bärs av anroparen: bär exitkoden själv där vakten inte ser, och flytta
prosan ur kommandosträngen där den ser för mycket.

### L523 — En moträttelse måste mäta samma sak som påståendet

**En rättelse bär auktoriteten hos en kontroll — därför är en moträttelse som
mäter fel sak värre än felet den rättar. Innan du skickar en rättelse: skriv ut
vad påståendet faktiskt hävdar, och kontrollera att din mätnings ENHET är samma
enhet.** `[UNIVERSAL]`

Två instanser mätta i **en och samma session** (S111, 2026-08-22), båda gånger
av den som rättade — inte av den som blev rättad.

**Instans 1 — grillningen (Del 2 § A).** Kortet `TASK-292` påstod att
personlistan bar en inline initialcirkel på `PersonsList.tsx:582`. Jag "rättade"
det med en grep som gav *"noll `rounded-full`"* och drog slutsatsen att kortet
hade fel. Grepen var trasig. Cirkeln fanns — på rad `1060`. Kortets **radnummer**
var föråldrat; dess **sakuppgift** höll. Jag rättade rätt sak på fel grund och
hade nästan rivit en korrekt uppgift.

**Instans 2 — resumen, samma session.** Som orkestrerare mätte jag
`grep -rln "InitialAvatar" src/` → sju filer, och skickade till bygg-agenten att
`TASK-299.1` AC #2:s *"Hems två konsumenter"* var mätt ofullständig. Agenten
mätte i stället **importraderna** och fann att fyra av de sju bara matchade på
NAMNET: `dev/hem-prototyp/`-filerna importerar en egen, separat komponent ur sin
lokala `./ui` — annan signatur, egen `initialer()`-kopia, eget
throwaway-docblock. Kortet hade rätt. Det fanns två konsumenter.

#### Vad som skiljer de två mätningarna

`grep -rln "InitialAvatar" src/` besvarar *"i vilka filer förekommer den här
strängen"*. Påståendet handlade om *"vilka filer beror på den här symbolen"*.
Det är två olika frågor, och den första kan inte falsifiera ett svar på den
andra. Samma fel i instans 1: `rounded-full` som sökterm besvarar inte *"finns
en initialcirkel"* när cirkeln kan byggas av andra klasser.

#### Den operativa regeln

1. **Formulera påståendets enhet innan du mäter.** Beroende? Förekomst?
   Beteende? Radnummer? En rättelse som byter enhet på vägen är ogiltig oavsett
   hur ren dess utdata ser ut.
2. **Föredra den mätning som skulle FALLA om du hade fel.** Agenten körde
   `npm run typecheck` (`tsc -b`, äkta över project references) **efter** att
   filen redan var raderad — exit 0 bevisade frånvaron av beroenden på ett sätt
   ingen grep kan. En mätning som bara producerar en lista bekräftar; en mätning
   som kan falla prövar. Välj den senare när den finns.
3. **Skilj radnummer från sakuppgift.** Ett föråldrat radnummer i ett kort är
   drift, inte ett faktafel. Riv aldrig sakuppgiften på radnumrets grund.

#### Varför den är [UNIVERSAL]

Den gäller varje yta där en part granskar en annans faktapåstående — agent mot
kort, orkestrerare mot agent, människa mot dokument. Instans 2 är dessutom
belägg för att `ADR-086`:s riktning håller **i båda riktningarna**: mottagaren
prövade avsändarens premiss, och avsändaren var orkestreraren. Ett uppdrag från
den som styr passet är inte immunt mot mätning — det är exakt lika mycket en
hypotes som kortet det rättar.

### L524 — En ersatt PR måste avväpnas, inte bara överges

**En armerad PR som blivit ersatt är en laddad fälla: armeringen överlever att
arbetet underkänns, och en enda grön omkörning räcker för att landa det du
redan valt bort. Att sluta bry sig om en PR är inte att stänga den.**
`[UNIVERSAL]`

Mätt 2026-08-22 (S111). PR `#1831` bar anmälningssidans divergens-prototyp.
Marcus granskade den, valde variant B och beställde en ombyggnad — varpå PR:en
i praktiken var ersatt. Samtidigt fällde `Acceptance — tvåsidigt bevis
(hermetik-självtest)`, så den stod röd.

Tre egenskaper samtidigt gjorde den farlig, och ingen av dem syns om man bara
konstaterar "den där jobbar vi inte på längre":

1. **Fortfarande armerad.** `autoMergeRequest` var satt. Armeringen konsumeras
   av en `failed_checks`-dequeue, men den försvinner inte för att arbetet
   underkänts av en människa.
2. **Röd av en flake-kandidat, inte av ett trädfel.** En omkörning — av en
   annan session, av ett retry, av vem som helst — kunde gjort den grön.
3. **Grön + armerad = landar.** Kön hade tagit in den utan att fråga någon.

Nettot: den underkända formen hade landat på `main` medan ombyggnaden
fortfarande pågick, och nästa agent hade byggt vidare ovanpå den.

#### Regeln

När en PR blir ersatt — av ett omtag, ett designbeslut, en ny riktning —
avväpna och stäng den **i samma andetag som beslutet fattas**, inte "sedan":

```bash
gh pr merge <nr> --disable-auto
gh pr close <nr> --comment "Ersatt av …, grenen bevaras därför att …"
```

Grenen finns kvar efter `close`, så ingenting går förlorat. Är arbetet grunden
för ombyggnaden — säg det i stängningskommentaren och peka ut grenen, annars
letar nästa läsare efter kod som ser raderad ut.

#### Varför det inte upptäcks av sig självt

Ett heartbeat-svep larmar på RÖTT och på armerings-kandidater, men en PR som är
**både röd och armerad** ser ut som ett vanligt rött larm — precis det man
lärt sig att vänta ut. Larmet säger "något är rött", inte "något rött kan
landa". Skillnaden är hela risken, och den syns bara om man läser
armeringsfältet i samma andetag som rollup-statusen.

I det här fallet fångades den bara för att monitorn startades av ett annat skäl
(Marcus bad om vakter över natten) och dess första larm tvingade fram en
läsning av PR:ens fullständiga läge.

#### Den generella formen

**Ett beslut som upphäver ett arbete upphäver inte automatiken som bär det.**
Samma klass finns överallt där en åtgärd är armerad i förväg och beslutet
fattas någon annanstans: schemalagda jobb, köade deploys, förberedda
migreringar. Frågan att ställa vid varje "vi gör om det här" är: *vad är
fortfarande laddat att göra det gamla?*

### L525 — Kortet tillhör agenten från spawn till landning

**Ett arbetskort är en delad fil med två skribenter: orkestreraren som
förbereder det och agenten som bockar av det. Ändrar båda efter att agenten
grenat blir det en merge-konflikt varje gång. Landa kortändringen FÖRE
spawn — eller rör inte kortet förrän agenten landat.** `[UNIVERSAL]`

Mätt 2026-08-22 (S111), och det intressanta är att regeln tillämpades korrekt
en gång och glömdes tre kort senare i **samma session**.

**Rätt, tidigt i passet:** en scope-ändring skulle bokföras medan `TASK-291`:s
agent arbetade. Jag skrev den på `TASK-303` i stället och noterade uttryckligen
skälet: *"på TASK-303, inte på 291, eftersom dess agent redigerar det kortet
just nu"*.

**Fel, en timme senare:** jag redigerade `TASK-299.7`, `299.8` och `299.9`
(beroende-omsättning + notes), landade dem i en PR, och spawnade tre agenter
mot samma kort. Agenterna hade redan grenat från en tidigare `main`. Första
PR:en (`#1840`) gick `DIRTY` på exakt den filen; de två andra var på väg mot
samma sak och fick förvarning.

#### Varför det inte känns som en risk i stunden

Ändringarna rör **olika delar** av kortet — orkestreraren skriver
`Dependencies:` och en notes-post, agenten bockar av AC. Semantiskt kolliderar
de inte alls, och det är just därför konflikten känns orimlig. Men git ser en
fil, inte två sektioner, och backlog-CLI:t skriver om filen i sin helhet vid
varje `task edit`. Två skribenter i samma fil ger konflikt oavsett hur väl
avgränsade avsikterna är.

#### Regeln, i den ordning den ska tänkas

1. **Ska kortet ändras? Gör det och LANDA det innan agenten spawnas.** En
   spawn mot ett kort som håller på att ändras är en konflikt du beställt.
2. **Är agenten redan igång? Rör inte kortet.** Skriv någon annanstans — ett
   relaterat kort, en tråd, sessionsdoket — och bokför på kortet när agenten
   landat.
3. **Blev det ändå konflikt: lös den via CLI:t, inte i en texteditor.** Ta
   main-versionen av filen och sätt om AC med `task edit --check-ac`.
   Handredigering under en rebase är det enklaste sättet att förstöra metadata
   som verktyget äger.

#### Den generella formen

**Delat tillstånd behöver en ägare per tidsfönster, inte per fält.** Att två
parter skriver till olika fält i samma fil är inte "ingen konflikt" — det är
en konflikt som råkar vara lätt att lösa. Frågan vid varje spawn är: *vilka
filer kommer den här agenten att skriva i, och tänker jag röra någon av dem
under tiden?*

### L526 — En buffert som aldrig läses är ändå ett tak

**Fråga alltid HUR LÅNGT en grind kom innan du frågar vad som är fel med koden.
En grind som föll utan att producera någon utdata föll inte på innehållet — den
föll innan den började.** `[UNIVERSAL]`

Mätt 2026-08-22 (S111), fem fällningar över fyra PR:er.

#### Instansen

`scripts/hermetik-sjalvtest.mjs` körde Playwright via `spawnSync` med
`stdio: ['ignore', 'pipe', 'inherit']` och `encoding: 'utf8'`. Det pipade
stdout in i en minnesbuffert mot Nodes `maxBuffer`-default på 1 MB.

**Bufferten lästes aldrig.** Enda referensen till utfallet i hela filen var
`utfall.error`; rapporten kom från fil via `PLAYWRIGHT_JSON_OUTPUT_FILE`, och
skriptets eget docblock sade uttryckligen att stdout var oanvändbart som
JSON-kanal. Pipen fyllde alltså noll funktion — men den **behöll sitt tak**.

När acceptance-sviten växte förbi 1 MB utdata returnerade `spawnSync`
`ENOBUFS`, skriptet kastade *"kunde inte starta Playwright"*, och jobbet föll
rött **utan att ett enda test kört**.

#### Vad som gjorde det svårt att se

Det såg ut som en flake, eftersom det slog ojämnt: `#1831`, `#1841` (två
gånger), `#1845` och `#1848` föll — men `#1840` passerade. Den naturliga
läsningen var "instabil miljö" eller "något i just de här testerna".

Det var i själva verket **deterministiskt**: `#1840` lade till få nya tester
och kom under taket; de andra lade till fler och kom över. En skalningsvägg
ser ut som en flake ända tills man mäter vad som skiljer fallen åt.

#### De tre mätningarna som avgjorde

1. **Loggen innehöll noll testutdata.** Ingen `Running N tests`, inget
   passed/failed — bara installationssteget och felet. Ett innehållsfel är
   därmed uteslutet: inget test hann köra. **Detta var den enskilt viktigaste
   observationen**, och den kostade en `grep` att göra.
2. **Omkörning gav identiskt utfall.** Två fällningar på samma PR uteslöt
   transiens.
3. **`main` var grön och en PR passerade.** Det uteslöt miljön som ensam
   förklaring och pekade på diffens storlek.

#### Bekräftelsen — låt fixen vara sitt eget experiment

Fixen (`'pipe'` → `'inherit'`) landades i en egen PR. **Den PR:ens egen
körning av samma jobb prövade fixen mot hela sviten** och gick grön där de
andra var röda. Diagnosen bekräftades alltså av CI självt, inte av
resonemang. Bygg fixen så att dess egen grind är beviset när det går.

#### Den generella formen

**Död kod i en resursväg är inte harmlös — den bär sina begränsningar ändå.**
En oanvänd pipe, en oläst buffert, en kvarglömd `maxBuffer`: de kostar
ingenting i logik och allt i tak. Och när ett tak nås rapporteras det som ett
körfel någon annanstans, långt från orsaken.

### L527 — Facit-bilden är ett granskningsinstrument, inte ett kvitto — läs bilden, inte agentens beskrivning av den

**[UNIVERSAL] En bild som tas för att LÅSA en yta är samtidigt den sista
billiga chansen att GRANSKA den. Läser man bara agentens sammanfattning av
bilden byter man ut ett instrument mot ett påstående — och ett påstående
formulerat som "dokumenterat, avsiktligt beteende" är den formulering som
lättast passerar, eftersom den låter som om granskningen redan är gjord.**

Instans (S111, 2026-08-23, `TASK-299.4`-manifestet `a8af2f85`): agenten tog
sju facit-bilder ur den hermetiska fixturvärlden och skrev i manifestet att
mobilens trunkering av identiteten till **"R"** var *"dokumenterat, avsiktligt
beteende"*. Orkestrerarens egen blick på samma bild visade något
sammanfattningen inte nämnde: namnet var dessutom klippt **mitt i ordet** —
*"Disa Danielssc"*, utan ellips. Gunilla-principen faller på det, och felet
låg i åtgärdskö-läget, alltså sidan Lotta landar på från Hem. Marcus hade
granskat på desktop, där defekten inte finns.

Orsaken var mätbar ur koden och bilden tillsammans (`87438ea6`): tidskolumnen
(*"för 5 dagar sedan"*, ~104 px) plus badgen (*"Behöver kopplas"*, ~135 px)
översteg innehållskolumnen (~106 px), så identiteten fick 0 px; och
resolutions-triggern var `inline-flex`, där `text-overflow: ellipsis` aldrig
verkar — den kräver en block-container med inline-innehåll. Ingen av de två
halvorna syns i en textsammanfattning. Båda syns i bilden.

#### Varför "dokumenterat beteende" är den farliga formuleringen

En docblock som beskriver ett beteende är en beskrivning av vad koden GÖR,
inte ett beslut om att den BÖR göra det. Att citera den tillbaka som skäl
förvandlar en observation till ett mandat utan att någon fattat beslutet.
Formen är svår att fånga eftersom den bär två sanna delar — beteendet ÄR
dokumenterat, och dokumentationen ÄR läst — och en falsk slutsats mellan dem.

#### Regeln

1. **Öppna varje facit-bild innan stämpeln.** Bilden är billig att titta på
   och dyr att ångra: en stämplad yta blir referens för allt som byggs efter
   den.
2. **Granska i det läge och den vyport där ytan faktiskt används**, inte bara
   i det som råkar vara bekvämt. Här var defekten mobil-only och
   åtgardskö-only; två av sju bilder bar den.
3. **Behandla "dokumenterat/avsiktligt beteende" i en agentrapport som en
   hypotes med källkrav.** Fråga vilket beslut som dokumenterade det, inte
   vilken fil som beskriver det.

#### Den generella formen

**Ett artefakt som produceras för att bevisa något är också det bästa
tillfället att pröva det.** Skärmdumpen, den genererade rapporten,
diff-utskriften: var och en passerar en gång genom någons synfält innan den
fryses. Den passagen är gratis granskning, och den enda som fångar det som
ingen tänkt att leta efter — men bara om en människa faktiskt tittar på
artefakten och inte på texten bredvid den.

Besläktat: `L246` (visuell egenskap verifieras mot det renderade, aldrig mot
källkoden) — där var källkoden fel instrument, här var agentens prosa det.

### L528 — En shorthand skriver över longhanden i utility-CSS:ens utdata — blanda aldrig de två för samma egenskap

**[UNIVERSAL] `row-span-2` genererar `grid-row: span 2 / span 2` — en
SHORTHAND som nollställer `grid-row-start`. Står `row-start-1` på samma
element spelar det ingen roll vilken klass som står först i attributet:
kaskaden avgörs av deklarationsordningen i den genererade stilmallen, inte av
ordningen i `class`-strängen. Välj longhand ELLER shorthand per egenskap och
element — aldrig båda.**

Instans (S111, 2026-08-23, `87438ea6`): anmälningsradens `<li>` gjordes om
till ett tvåradigt grid för att ge identiteten plats vid 375 px. Första
försöket satte `row-span-2` tillsammans med `row-start-1` på avataren.
Utfallet: avataren hamnade i **kolumn 3** i stället för kolumn 1 —
`grid-row`-shorthanden hade rensat startpositionen, och auto-placeringen tog
över. Fixen var att byta till enbart longhands
(`row-start`/`row-end`, `col-start`/`col-end`).

#### Varför det inte syns i koden

I ett utility-CSS-system ser båda klasserna ut som atomära, likvärdiga
tillägg — `row-span-2` och `row-start-1` läses som "två oberoende egenskaper".
Abstraktionen döljer att den ena expanderar till en shorthand som äger den
andras egenskap. Samma fälla finns i `inset` mot `top`/`left`, `place-items`
mot `align-items`, `grid-area` mot allt fyra, `flex` mot
`flex-grow`/`shrink`/`basis`, och `background` mot varje `background-*`.

#### Regeln

1. **Bestäm per egenskap och element: longhand eller shorthand.** Blanda inte.
   Longhand är det säkrare valet när flera klasser rör samma axel, eftersom
   ingen av dem kan radera en annan.
2. **Mät placeringen, anta den inte.** Att klassen står i `class`-attributet
   betyder inte att den är i kraft; det som gäller är den beräknade stilen.
   Här räckte en blick på den renderade kolumnindelningen för att se felet —
   men bara för att någon tittade.
3. **Ett oväntat hopp i placering är en kaskad-fråga före en logik-fråga.**
   Element som "flyttar sig av sig självt" är nästan alltid auto-placering
   som tagit över efter en raderad explicit position.

#### Den generella formen

**En abstraktion som gör olika saker likformiga döljer också deras
konflikter.** Utility-klasser, konfigurationsnycklar och flaggor ser i sina
respektive listor ut som jämbördiga poster; under ytan äger vissa av dem
andra. Frågan att ställa när två inställningar rör samma sak är inte "vilken
står sist" utan "expanderar någon av dem till den andra".

### L529 — En flytt avtäcker pre-existerande fel — och de är din landnings ansvar

**[UNIVERSAL] När en layout- eller konfigurationsflytt fäller något som "inte
rör" din ändring är standardsvaret fel åt båda hållen: varken "det är inte
mitt fel" eller "då backar jag flytten" är rätt. Differentialmät (stasha
flytten, kör om), rotorsaka i KÄLLAN, och landa fixen tillsammans med flytten
— annars lämnar du en defekt som nu är nåbar men fortfarande obokförd.**

Instans (S111, 2026-08-23, `fe2e2bb1`): den delade `SidRam`-primitiven flyttade
sidans innehåll 40 px. Eventväljarens popover började då flippa **över**
triggern vid 1280×720 — mätt: popover `y=337`, `h=304`, mot trigger `y=359`.
React Arias `Select` öppnar på `pointerdown` och väljer det som ligger under
pekaren vid `pointerup`, så ett vanligt klick valde **första alternativet**
utan att användaren rörde musen. Samma väljare sitter på dokumentsidan och
eventsidan.

**Felet fanns före flytten.** `ListBox`ens `max-h-80` (320 px) fick redan
tidigare inte plats under triggern vid låg fönsterhöjd; flytten ändrade bara
hur ofta villkoret uppfylldes. Fixen låg därför i väljaren, inte i sidramen:
`shouldFlip={false}` (RAC sätter då `maxHeight` till det utrymme som finns) och
listan som `min-h-0 flex-1 overflow-auto` i en fokuserbar `<section
tabIndex={0}>` (axe `scrollable-region-focusable`, WCAG 2.1.1 — listboxen bär
virtuell fokus och kan inte själv ta `tabindex`). Mätt efter: popover `y=425`,
under triggern; `pointerup` träffar inget alternativ. Acceptance 61/61,
promoveringsgrindar 168/168.

#### Varför båda de intuitiva svaren är fel

**"Inte mitt fel"** stämmer om orsak, men inte om ansvar. En defekt som var
onåbar och nu är nåbar är en NY defekt för användaren, oavsett hur gammal
koden är. Den landar med din PR om du inte stoppar den.

**"Backa flytten"** gör felet onåbart igen utan att laga det, och tar samtidigt
bort det enda som gjorde det synligt. Nästa gång någon rör samma yta återupptäcks
det från noll — och då kanske i produktion i stället för i en testsvit.

#### Formen som fungerar

1. **Differentialmät först.** Stasha flytten och kör samma test. Faller det
   fortfarande är felet pre-existerande; faller det inte har din ändring
   infört det. Det är två helt olika utredningar och skillnaden kostar en
   `git stash`.
2. **Rotorsaka i den komponent som äger beteendet**, inte i den som råkade
   avslöja det. Här ägde väljaren sin egen placeringslogik; sidramen ägde bara
   40 px.
3. **Landa fixen med flytten.** En separat "vi tar det sen"-post är samma
   klass som en obevakad defekt: den syns bara så länge någon minns
   sammanhanget.

#### Den generella formen

**En ändring som ändrar förutsättningarna är en upptäcktsoperation, inte bara
en ändring.** Samma mönster gäller en versionsbump som väcker en latent
inkompatibilitet, en flagga som aktiverar en dittills död kodgren, och en
prestandaförbättring som gör en race nåbar. Räkna med att scopet växer när en
förutsättning byts — och att tillväxten är information, inte ett hinder.

Besläktat: `L292` (en precedens-ändring aktiverar latent DÖD konfiguration —
inventera vad som VINNER efteråt) — där aktiverades regler av en
kaskad-ändring, här av en geometri-ändring. Samma rot.

### L530 — En identitet härledd ur en POSITION i en föränderlig lista bär både ett tak och ett race — och taket har ingen bevakare

**[UNIVERSAL] Härleds en unik resurs (en port, ett slot, ett ID) ur ett
objekts PLATS i en lista, ärver den två egenskaper listan har och identiteten
inte borde ha: listan har en längd, alltså finns ett tak — och listan kan
ändras under dig, alltså finns ett race. Båda måste bokföras när formen väljs,
och taket behöver en bevakare som larmar FÖRE det nås, inte en `throw` i det
ögonblick någon råkar behöva resursen.**

Instansen är vårt eget portschema (`tests/support/dev-portar.ts`, `TASK-251`).
Formen är i övrigt bra vald och alternativen är öppet avfärdade i filens
docblock — detta är inte kritik av valet, utan en bokföring av vad valet
kostar när flottan växer.

#### Mekaniken, läst ur källan (2026-08-23)

```text
port = klassens basport + worktree-index * 1000
```

`worktree-index` är checkoutens plats i `git worktree list --porcelain`:
huvudkatalogen alltid `0`, de länkade sorterade och numrerade därefter.
Basportarna är `a11y 5199`, `visual 5299`, `acceptance 5399`,
`webblasarbeteende 5499`. Taket är `MAX_INDEX = 26`, valt så att
`5499 + 26 * 1000 = 31499` håller sig under Linux efemära portintervall
(`32768–60999`). Över taket kastar `devPort()` — fail-closed, med
anvisningen att köra `git worktree prune` eller `git worktree remove`.

#### De två egenskaperna, mätta

**Taket är närmare än det ser ut.** Mätt i detta träd 2026-08-23:
`git worktree list` ger **25 checkouts** (huvudkatalogen + 24 länkade), varav
**19** är agent-worktrees (`agent-<hash>`). Högsta index i bruk är alltså
**24** mot taket **26** — **två platser kvar**. Ingen mekanism räknar detta;
ingen larmar vid 24 av 26. Den första signalen är en `throw` i en testkörning
hos den agent som råkar få det 28:e blocket, och felmeddelandet ber DEN agenten
städa upp efter alla andra.

**Racet är känt och öppet bokfört i källan:** index är en position i en lista
som ändras när en worktree skapas eller tas bort. Tas en worktree bort medan
en körning i en sorterat senare worktree pågår, flyttar den senares index — och
en ny körning kan då landa på en port som redan används. Utfallet är högt
(`--strictPort` + `reuseExistingServer: false` ⇒ `Port NNNN is already in
use`), aldrig en tyst delning. Det är rätt avvägning, men det betyder att
STÄDNING under pågående flottdrift är en operation med sidoeffekter, inte en
neutral hygienåtgärd.

**Två portar står helt utanför schemat, med avsikt:** e2e (`5173`) och
staging-preview (`4173`) är portlåsta av staging-EF:ernas
`CORS_ALLOWED_ORIGINS`-allowlist och kan därför inte deriveras.
Fleet-kollisionen på just dem kvarstår och kan inte lösas i portschemat.
S111 träffade exakt det hålet: en bakgrundskörning föll därför att `5173` var
upptagen av orkestrerarens egen dev-server.

#### Det operativa

1. **Städa färdiga agent-worktrees som en del av flottans drift**, inte som
   efterarbete. Varje kvarlämnad worktree är en förbrukad plats i ett schema
   med 27 platser totalt.
2. **Städa när inget kör**, inte mitt i ett pass — se racet ovan.
3. **`git worktree remove` från en isolerad worktree måste ta en RELATIV
   sökväg.** En absolut sökväg bär huvudkatalogen som prefix (worktrees bor
   under `.claude/worktrees/`) och fälls därför av den textmatchande
   ägarskapsvakten. Mekanismen och dess fyra mätta instanser bor i
   `nastlade-worktree-sokvagar-faller-textmatchande-katalogvakter.md` — den
   nämns här bara för att den är förkravet för att kunna FÖLJA punkt 1.

#### Den generella formen

**Ett tak som bara märks när det nås är inget tak — det är en fälla.** Varje
härledd-ur-position-schema (portblock, färgindex, shard-nummer, slot-tilldelning
i en fast rymd) bör bära en räkning av använda platser bredvid sin gräns, och
den räkningen hör hemma där kapaciteten FÖRBRUKAS (worktree-skapandet), inte
där den konsumeras (testkörningen). Konsumenten kan bara kasta; producenten
kan välja att inte skapa.

### L531 — `!`-skalet delar arbetskatalog med orkestrerarens Bash — ge alltid absoluta sökvägar i kommandon du lämnar över

**[UNIVERSAL] Ett kommando som Marcus kör via `!`-prefixet startar inte i ett
neutralt skal: det ärver samma arbetskatalog som agentens egna Bash-anrop står
i. Varje relativ sökväg i ett överlämnat kommando är därför ett antagande om
ett tillstånd avsändaren inte har skrivit ut och mottagaren inte kan se. Skriv
absoluta sökvägar — undantagslöst — i allt du ber en människa köra.**

Instans (S111, 2026-08-23, Del 6 § Fönster 2): stämpelkommandot för
`TASK-299.4`:s facit-manifest lämnades över med ett inledande
`cd .claude/worktrees/…`. Det föll — skalet stod redan i worktreen, så den
relativa sökvägen pekade på en katalog under en katalog som inte fanns. Med
absolut sökväg gick samma kommando igenom direkt: *"godkand" stämplat
(av: marcus, sha: d3858a29)*.

#### Varför formen lurar

Ett `cd <relativ>` är osynligt fel: det ser korrekt ut för den som skrev det,
eftersom skribenten hade repo-roten i huvudet när kommandot formulerades. Och
felet är inte deterministiskt över tid — samma kommando fungerar när skalet
råkar stå på rätt plats och faller när det inte gör det. Det gör att
formuleringen kan användas många gånger utan att avslöja sig, och sedan falla
i det ögonblick arbetsformen byter katalog (t.ex. när ADR-090:s
worktree-regel gav passet två worktrees i stället för huvudkatalogen).

#### Regeln

1. **Absoluta sökvägar i varje överlämnat kommando** — i argument, i
   omdirigeringar och i `cd`. Kostnaden är teckenlängd; alternativet är ett
   fel hos någon som inte kan felsöka det.
2. **Helst inget `cd` alls.** De flesta verktyg tar en sökväg direkt
   (`git -C`, `bash /abs/skript.sh`, `npm --prefix`), och ett kommando utan
   katalogbyte har ingen katalogpremiss att bryta mot.
3. **Skriv ut det förväntade utfallet i samma andetag** — vad som ska stå i
   utdatan när det gick rätt. Mottagaren kan då se skillnad på "kördes" och
   "kördes mot rätt sak".

#### Den generella formen

**Ett kommando du lämnar över körs i mottagarens tillstånd, inte i ditt.**
Katalogen är bara en av tillståndsaxlarna; trädets färskhet är en annan
(`L521`, samma session-kluster, samma överlämningskedja). Ansvaret följer
överlämningen i båda fallen: den som formulerar kommandot äger varje premiss
det bär, eftersom mottagaren per definition inte kan se vad avsändaren antog.

#### Avgränsning mot två grannposter — de rör olika ytor

`cwd-persisterar-mellan-bash-anrop-och-driftar-tyst.md` och
`nastlade-worktree-sokvagar-faller-textmatchande-katalogvakter.md` handlar båda
om AGENTENS egna kommandon, och drar där motsatta slutsatser (explicit `-C` mot
persisterande cwd) beroende på om risken är drift eller vakt-fällning. Den
avvägningen gäller inte här: en människas `!`-kommando passerar ingen
katalogvakt, och mottagaren har ingen kommandokedja att låta cwd persistera
genom. För ÖVERLÄMNADE kommandon finns alltså ingen avvägning — absoluta
sökvägar är rätt svar utan undantag. Den nya fakta-biten som binder ihop dem är
att `!`-skalet delar cwd med agentens Bash, vilket gör agentens egen
cwd-drift till en premiss i människans kommando.

### L532 — Korsläs mot PRD:ns familjebeslut före stämpeln — inte bara mot användarens senaste ord

**[UNIVERSAL] En konvergens-stämpel prövar det som visas i ögonblicket mot det
som sades i ögonblicket. Ett FAMILJEBESLUT — "alla ytor av typ X bär Y" — sades
tidigare, gäller fortfarande, och syns inte i den yta som granskas just nu.
Stämpla aldrig utan att korsläsa mot PRD:ns/speccens familjebeslut; annars
fryser du ett undantag som ingen beslutat om, och varje senare yta ärver det
som facit.**

Instans (S111, 2026-08-22 → 23, `718e586f`): PRD `TASK-299` beslutade
**2026-08-22** (beslut 2–3+5) att husets delade `SidRam`-primitiv bärs av
ALLA Mer-sidor, anmälningssidan inräknad, och
`DESIGN-SYSTEM-SPEC.md` § 23 listade ytan uttryckligen som *"tillkommer när
TASK-299.5 landar"*. Promoveringsskivan `TASK-299.5` behöll ändå av misstag
prototypens gamla textlänk (`← Tillbaka till Mer`). Facit-bilderna togs samma
dag och **ärvde missen**; manifestet stämplades på dem.

Fångsten kom från Marcus i QA på förhandsgranskningsbygget, verbatim:
*"Ser bra ut. Men varför har inte anmälningssidan bakåtchevronen?"* — alltså
efter stämpeln, av en människa, på en yta som redan var låst. Rättelsen krävde
en omtagning av sju facit-bilder plus en amenderings-sidofil, eftersom
`facit.json` är agent-fryst så snart `godkand` är satt (ADR-104-hooken).

**Varför "Ser bra ut" inte var en granskning av just detta:** Marcus godkände
formen han såg. Familjebeslutet handlade om något han INTE såg — frånvaron av
ett element. Ett godkännande kan bekräfta det som finns; det kan aldrig av sig
självt upptäcka det som saknas.

#### Regeln

1. **Vid varje konvergens-stämpel: läs PRD:ns/speccens beslutslista, inte bara
   den senaste kvittensen.** Familjebeslut ("alla X bär Y", "ingen X får Z")
   är per konstruktion osynliga i en enskild yta.
2. **Korsläs mot systerytorna som redan bär formen.** Här bar väntelistan,
   dokumentytan och aktivitetshistoriken redan sidramen — en jämförelse mellan
   fyra ytor hade avslöjat den femte på sekunder.
3. **En promoverings-skiva är inte en kopiering.** Den ska bära PRD:ns form,
   inte prototypens rester. Det prototypen råkar ha kvar är inte ett beslut.

#### Den generella formen

**Ett beslut som gäller en KLASS av ytor har ingen bärare i någon enskild
yta.** Det är därför det driver: varje enskild granskning är lokal och
korrekt, och klassen faller ändå isär. Ytor granskas en i taget; klassbeslut
måste därför granskas som klass — en lista, en korsläsning, en räkning av hur
många ytor som faktiskt bär formen — och det arbetet hör hemma FÖRE stämpeln,
eftersom kostnaden att ångra en frusen artefakt är flerfaldigt högre än att
läsa en beslutslista.
