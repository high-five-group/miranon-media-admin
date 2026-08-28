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

### L533 — En bokföringsgren tas ur färsk `origin/main` — inte ur föregående dokgren, som bär en föråldrad kopia av just det du ska bokföra

**Kort, checklistor och sessionsdok är de filer parallella agenter skriver i
medan du arbetar. Grenar du din bokföringsgren ur din FÖRRA dokgren ärver du
en kopia från innan deras landning — och "rättar" då något som redan är rätt,
i en fil som är på väg att bli en konflikt. Varje bokföringsgren tas ur
`git fetch`-färsk `origin/main`, utan undantag.**

Instans (S108, 2026-08-23, Del 15 § C punkt 1): PR `#1872` blev DIRTY därför
att orkestrerarens gren bar kortet i sin form FÖRE `#1862` landade. Agentens
AC-bockning såg därmed ut att saknas, och orkestreraren bockade om den i den
gamla filen. Rättat med `reset --hard origin/main` plus omgjord bokföring.

**Det generella:** en dokgren känns billigare att återanvända än att skapa —
den är ju "bara text". Men bokföringsfilerna är exakt de filer som rör sig
snabbast i ett parallellt flöde, så återanvändningen maximerar konfliktrisken
i stället för att spara arbete. Felet pekar dessutom åt fel håll: det ser ut
som att ARBETET saknas (obockad AC), inte som att din kopia är gammal — vilket
lockar till att göra om arbetet i stället för att misstänka basen. Samma
familj som "ett oisolerat pass läser det träd avsändaren står i" (läs-sidan av
samma träd-ålder) och som huvudkatalogens falska kort-läsningar när den står
på ett gammalt detached HEAD. Den som konsoliderar avgör medvetet om
instanserna ska bli en post eller flera — de har olika operativa motmedel
(synka trädet du dispatchar in i · grena ur färsk `origin/main` · läs med
`git show origin/main:<fil>`).

*Konsoliderad ur `tasks/lessons.d/bokforingsgren-tas-ur-farsk-origin-main-inte-ur-foregaende-dokgren.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L534 — Deploy-enheten är funktionen, inte commiten — en delad modul når runtime bara för det som deployats EFTER den

**En ändring i en delad modul landar i EN commit men når runtime i lika många
steg som det finns konsumenter, och bara för dem som deployats efteråt.
Testbädden är alltså inte färsk för att repot är det. Mät deploy-tidsstämpeln
per funktion innan ett rött staging-utfall läses som en kodbugg — och innan
ett grönt läses som ett bevis.**
`[UNIVERSAL]`

Instans (S108, 2026-08-23, Del 16 § A, under skiva 5): **sex** staging-Edge
Functions visade sig vara stale-deployade sedan **2026-08-17** — alltså före
`Mall`/`Källhash`-kontraktet — och redeployades i samma pass.
`send-action-email` var fortfarande stale när passet stängde och bokfördes
öppet i stället för att tigas ihjäl. I samma svep föll `previewEventTemplate`
på att den saknade `mall`-fältet och hade 400:at mot den nya kontraktsformen.

**Det generella:** prod-sidan har disciplinen nedskriven — läs `UPDATED_AT`,
inte `VERSION`, och en driftkarta härledd ur git är en HYPOTES om prod, inte
en mätning (`CLAUDE.md` § Prod-EF-deploy; `[[L204]]`, `[[L216]]`, `[[L332]]`).
Staging saknar den, eftersom staging antas följa med automatiskt. Det gör den
inte: staging deployas av den som råkar behöva den, funktion för funktion.
Följden är värre i staging än i prod, för staging är där BEVISEN produceras —
en grön svit mot en stale funktion bevisar att gammal kod fungerar, och det
beviset läses som att den nya gör det. Regeln gäller varje plattform där
deploy-enheten är mindre än repot: serverless-funktioner, lambdas,
container-per-tjänst.

*Konsoliderad ur `tasks/lessons.d/deployenheten-ar-funktionen-inte-commiten.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L535 — En defekt i en VERKTYGSFORM sitter aldrig på ett anropsställe — svep hela anropsytan före fixen, och räkna träffarna

**Föll ett anrop på HUR verktyget anropas — obundet namn, ostyrd version, fel
flagga — är formen med största sannolikhet kopierad. Svep `scripts/`,
workflows, `package.json` och hookarna efter samma form INNAN du fixar, och
räkna träffarna: antalet är en mätning, inte en gissning. En rapport som säger
"ett ställe" har oftast bara läst det ställe som råkade fälla.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, Del 18 § D): fällningen låg i
`deploy-prod-functions.sh:192` (bart `supabase`). Sveppasset över `scripts/`,
`.github/workflows/`, `package.json` och `.githooks/` fann **sju**
anropsställen (A1–A7), varav **inget** var versionspinnat — CLI:t var
verifierat frånvarande ur både `package.json` och `package-lock.json`.
Dessutom lärde två kommentarer i `provision-attachments-bucket.mjs` aktivt ut
den bara formen, den ena märkt *"Exempel (Marcus, prod)"*: nästa copy-paste
hade återskapat defekten.

**Det generella:** två egenskaper gör svepet obligatoriskt snarare än
ambitiöst. (1) En verktygsform sprids genom kopiering, så förekomsterna är
KORRELERADE — hittar du en finns nästan alltid fler, och de ligger i filer
ingen läser förrän de fäller. (2) Dokumentation och kommentarer är en del av
anropsytan: en kommentar som visar den defekta formen är en framtida instans,
inte prosa, och den är osynlig för varje grind som bara läser kod. En vakt kan
dessutom göra ytan värre än den ser ut: A6 var ett `command -v npx`-test, som
prövar NÄRVARO när defekten var VERSION — alltså en vakt som svarar grönt på
exakt det fall den ser ut att skydda mot. Pröva alltid vad en befintlig guard
faktiskt mäter innan den räknas som mitigering.

*Konsoliderad ur `tasks/lessons.d/en-defekt-i-en-verktygsform-svepes-over-hela-anropsytan.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L536 — En docblock som påstår "EXAKT samma som X" är sann när den skrivs och falsk vid X:s nästa ändring — den är en kopia, inte en koppling

**Ett kommentar-påstående om att två ytor är identiska skapar ingen mekanism
som håller dem identiska. Det gör motsatsen: det får kopian att se granskad
ut, så nästa ändring i originalet landar där utan att någon letar efter
följeslagaren. Behöver två ytor samma värde ska de DELA det — en konstant, en
komponent, en token. Skriv aldrig "samma som" när du menar "kopierad från".**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, `TASK-309.14`, commit `d9d973d5`):
`GenereringsVy.tsx` § `KromKnapp` var en rå `<button>` vars docblock påstod
*"EXAKT `DokumentYta`s klasser"*. Sant när den skrevs; **falskt från
2026-08-23**, då topp-luften `mt-2 lg:mt-10` lades till i `SidRam` (commit
`2e16ded1`, på Marcus order att alla undersidor ska ha samma grund) men inte i
kopian. Marcus såg driften i granskningen 2026-08-24 — *"bakåtchevronen sitter
för högt upp, jag har varit tydlig med att alla undersidor ska ha samma
sidkrom, samma 'grund'."* — samma observation som gav topp-luften från början.
`ADR-126` hade redan samlat **sex** sidkrom-instanser till en primitiv;
`KromKnapp` var den **sjunde** och smet undan på en teknikalitet: `SidRam` är
wrappad i TanStack Routers `createLink` och renderar ett riktigt `<a href>`,
medan genereringsvyn navigerar inom sin egen route via query-parameter. Fixen
blev inte att lappa in de saknade klasserna — Marcus: *"INGET lappande"* —
utan en andra GREN i primitiven (`SidRamKnapp`) som delar en utbruten
`CHEVRON_KLASS` med länk-grenen. Kopian revs.

**Det generella:** en kopia och en delad definition ser likadana ut den dag de
skapas och skiljer sig varje dag därefter. Skillnaden är vem som betalar när
originalet ändras: den delade definitionen kostar ingenting, kopian kostar en
granskningsrunda av den som råkar se den. En docblock som påstår identitet gör
saken sämre än ingen docblock alls, eftersom den utlovar en invariant som
ingenting upprätthåller och därmed inbjuder till att lita på den. Notera också
varför kopian överlevde en samlingsinsats som fångade sex syskon: den hade ett
GILTIGT tekniskt skäl att inte kunna använda primitiven som den då såg ut. Ett
sådant skäl motiverar en ny gren i den delade formen — det motiverar aldrig en
sjunde kopia.

*Konsoliderad ur `tasks/lessons.d/en-docblock-som-pastar-exakt-samma-som-x-ar-sann-tills-x-andras.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L537 — En `fullPage`-bild ljuger om varje viewport-fäst element — väx vyporten i stället

**`fullPage: true` renderar sidan i sin fulla scrollhöjd, men element vars
position eller storlek är en funktion av vyporten (`position: fixed`,
`inset-0`, `vh`/`dvh`, `sticky`) fortsätter mätas mot den ursprungliga
vyporten. Resultatet är en bild där fästa element står på fel plats och
täcker fel yta — en rendering ingen användare kan framkalla. Ska en hel sidvy
fångas: väx VYPORTEN till sidans `scrollHeight` och ta en vanlig bild. Aldrig
`fullPage`.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, facit-tagningen för skiva 9, `TASK-309.10`, PR
`#1961`): riggens första pass tog de 22 facit-bilderna med `fullPage: true`.
Två defekter föll ut, båda fångade före commit. Bottennavigeringen
(`src/components/AppShell/TabBar.tsx` rad 77, `className="fixed inset-x-4
bottom-4 …"`) ockluderade blocket *"Sista betalningsdag"*
(`src/components/dokument/blockDefinitioner.ts` rad 90). Dialogens overlay
(`src/components/primitives/Modal.tsx` rad 34, `className="fixed inset-0
z-50 …"`) dimmade bara en del av bildytan — tagningsagenten rapporterade
**2 av 3**; den andelen är rapporterad, inte ommätt här, eftersom
defekt-bilderna aldrig committades. Mekanismen är däremot belagd i källan: en
`fixed inset-0`-overlay täcker exakt en vyporthöjd, så mot en sida renderad i
1,5× vyporthöjd blir kvoten just 2/3. Fixen står i commit `164190b6`:
*"sidvyerna tas i stället med viewporten uppväxt till sidans scrollHeight,
dialogerna i naturlig vyport"*.

**Det generella:** `fullPage` flyttar inte kameran — den byter duk. Layouten
fortsätter beräknas mot den vyport som är satt, så varje viewport-relativt
element hamnar i ett läge som inte motsvarar något verkligt tillstånd. Den
bilden är därmed oduglig som facit: den låser en rendering som aldrig
inträffar, och en framtida diff mot den mäter tagningsmetoden i stället för
ändringen. Fällan är inte begränsad till facit-riggar —
`docs/reference/prototyp-verifiering-runbook.md` rad 80 bär `fullPage: true`
i sin inklistringsbara bootstrap-mall, alltså just den form ett
engångs-diagnospass kopierar rakt av. Syskonlärdom om samma bilds TIDSaxel:
`L543`.

*Konsoliderad ur `tasks/lessons.d/en-fullpage-bild-ljuger-om-varje-viewport-fast-element.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L538 — En hemlighet som anländer i fel kanal kan bara hanteras av MOTTAGAREN — instruktionen om rätt kanal är ingen vakt

**Du kan be om en nyckel via env-fil och ändå få den klistrad i chatten. I det
ögonblicket finns ingen hook att fälla på och ingen kommandorad att maskera:
enda kvarvarande kontrollen är vad mottagaren gör härnäst. Tre led, i ordning
— eka aldrig värdet vidare, flytta det till en gitignorerad env-fil och vidare
via `--env-file` (aldrig som kommandoargument), och registrera rotationen med
en konkret UTLÖSARE, inte med ordet "senare".**
`[UNIVERSAL]`

Instans (S108, 2026-08-23, Del 14 § D): DocRaptor-nyckeln klistrades i chatten
trots env-fil-instruktionen. Hanteringen som valdes: `.env.docraptor`
(gitignorerad via `.env.*`) → `supabase secrets set --env-file` mot staging;
`DOCRAPTOR_API_KEY` uppdaterad 14:23Z och verifierad via `secrets list`-digest
i stället för genom att skriva ut värdet. Prod-secreten kunde bara Marcus
sätta, så kommandot gavs till honom. Exponeringen bokfördes med utlösare:
rotera nyckeln när promoveringen är verifierad i prod, sätt sedan om båda
secrets.

**Det generella:** `--env-file`-formen är inte kosmetik. En hemlighet som
skrivs som kommandoARGUMENT hamnar i skalhistorik, i processlistan och i
agentens transkript — tre nya kopior av precis det som skulle begränsas.
Env-fil-formen skapar noll av dem. Och rotationen behöver en utlösare snarare
än ett datum: "efter att promoveringen är verifierad i prod" är kontrollerbart
och kopplat till ett steg någon faktiskt tar, "senare" är varken. Syskonposten
— en hemlighet som passerat ett API-svar eller ett transkript är
rotationspliktig — säger att vakten måste sitta på kommandot, inte på
uppmärksamheten. Den här instansen är fallet där det inte finns något kommando
att sätta vakten på, och det gör mottagarens rutin till hela försvaret.

*Konsoliderad ur `tasks/lessons.d/en-hemlighet-i-fel-kanal-hanteras-av-mottagaren.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L539 — En preview på per-gren-subdomän kan ALDRIG granskas mot en exakt-matchad CORS-allowlist — det är strukturellt, inte ett konfigfel

**Preview-deployer får ett nytt värdnamn per gren. En CORS-allowlist som
matchar `Origin` exakt kan därför per konstruktion aldrig innehålla det.
Kombinationen "preview-URL plus exakt-matchad allowlist" är ogranskbar oavsett
hur väl listan underhålls — och symptomet (`Failed to fetch`) ser ut som en
trasig yta i stället för en trasig väg.**

Instans (S108, 2026-08-24, Del 19 § B): tre led mättes var för sig.
(a) `npm run build` körs utan `--mode`, alltså Vites production-läge, alltså
`.env.production` — Vercels förhandsvisningar pratar med prod-miljön.
(b) `supabase/functions/_shared/cors.ts` rad 37–40 gör
`allowlist.includes(origin)`, och utan träff sätts ingen
`Access-Control-Allow-Origin`-header alls. (c) Previewens värdnamn är en
per-gren-subdomän av formen `miranon-media-ad-git-<hash>-…`. Slutsats:
granskning av en yta mot den miljön är omöjlig; `ADR-103 B2`:s
gransknings-steg går via dev-servern mot staging, eller efter landning.

**Det generella:** runbooken varnade ordagrant för klassen — *"Saknas
prod-origin här ser appen HELT DÖD ut för användaren — och
deploy-verifieringens curl-test upptäcker det INTE (curl skickar ingen
Origin-header)"* — och raden lästes samma dag utan att kopplas till
granskningen, därför att den var skriven om DEPLOY-verifiering. En varning bär
bara den kontext den skrevs i; grannkontexten måste skrivas ut separat för att
finnas. Två operativa följder: en allowlist med exakt matchning gör varje
efemär värdnamnsgenerator (preview-deploy, tunnel, dynamisk sandlåda)
strukturellt utestängd, och ingen `curl`-baserad kontroll kan upptäcka det
eftersom `curl` inte skickar någon `Origin`-header — bara en webbläsare kan.

*Konsoliderad ur `tasks/lessons.d/en-preview-pa-per-gren-subdoman-kan-aldrig-granskas-mot-exakt-matchad-allowlist.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L540 — En promoverad form hämtas ur FACITET, inte ur närmaste granne — grannens form är rätt för grannens innehåll

**Vid promovering är det den GODKÄNDA formen som ska flyttas, och den bor i
prototypen. Att i stället kopiera den befintliga grannraden känns
konsekvensskapande men är en regression: grannens klasser är avvägda mot
grannens innehåll, och samma klass på ett annat innehåll ger ett annat
resultat. Diffa den promoverade ytan mot prototypen, inte mot syskonen — en
regression som ser ut som huskonvention är den svåraste att se.**

Instans (S108, 2026-08-24, `TASK-309.12`): prototypens mall- och generatorrad
bar `flex items-center gap-3 py-3`
(`1ec70a85^:src/components/dokument/prototyp/GenereringsPrototyp.tsx` rad **483**
och **511**, båda disk-verifierade). Den promoverade formen bar
`flex items-start gap-3 py-3` (`1ec70a85:src/components/dokument/DokumentYta.tsx`
rad **1141** och **1176**). Utfallet: raden har tre led i vänsterspalten men
bara EN 44 px-knapp till höger, så chevronen klistrades i överkant.
Commit-meddelandet till fixen (`d9d973d5`) namnger den troliga orsaken:
*"DokumentRadSkals form (fyra knappar, `items-start` med rätta) kopierad till
rader som har en."* `DokumentRadSkal` (samma fil, rad 878) är bilageraden —
där är `items-start` korrekt, eftersom höger-ytan bär flera ikonknappar
(`DokumentAtgardsKnappar` + `LaddaNerKnapp`) mot en flerledad vänsterspalt.
Marcus fann avvikelsen i granskningen; fixen återställde `items-center`.

**Det generella:** promoveringskontraktet gör prototypen till kravspec, vilket
betyder att varje avvikelse mellan skarp yta och facit är ett byggfel — även
när avvikelsen råkar sammanfalla med hur den närmaste befintliga koden ser ut.
Just den sammanfallningen är det som gör felmoden svår: en kopierad
grannklass passerar varje "ser detta ut som resten av huset?"-granskning, för
det gör det. Vad den inte passerar är en jämförelse mot det som godkändes.
Och den som väljer källa i promoveringsögonblicket står inför ett verkligt
val — grannen är närmare till hands och ofta rätt — så regeln måste vara
uttalad: facitet vinner, och när grannens form avviker från facitet är det en
fråga att ställa, inte ett mönster att följa.

*Konsoliderad ur `tasks/lessons.d/en-promoverad-form-hamtas-ur-facitet-inte-ur-narmaste-granne.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L541 — Ett arbetsträd N commits bakom ljuger om INNEHÅLL, inte bara om numrering — allt som läses där är hypotes

**Ett verktyg som läser sin data ur arbetsträdet rapporterar det TRÄDETS
tillstånd, inte projektets. Står trädet bakom levereras gammalt innehåll med
exakt samma auktoritativa ton som färskt — ingen varning, ingen avvikande
form. "Du kan få fel NUMMER i en gammal checkout" är en delmängd av den
verkliga regeln: VARJE fält verktyget visar är lika gammalt som trädet.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, resume 10:s lägesmätning): huvudkatalogen stod på
ett detached `f5ed41d2`, **91 commits bakom** `origin/main`. `npm run bl --
task 309.9` körd där rapporterade AC #1 som **obockad**; samma kort läst mot
`origin/main` bar den **bockad**. Bockningen hade landat i PR **#1897**
(*"chore(TASK-309.9): bocka AC #1 — prod-schemat och seeden landade och
bokförda"*, merged 2026-08-24T13:16:46Z, en enda fil i diffen: kortet självt).
Handoffen bar en varning om precis detta träd — men den gällde kort-SERIEN,
att `task create` där skulle allokera `task-311` i stället för `task-319`.
Ingenting sade att kortens INNEHÅLL var lika gammalt. Åtgärd: resumens dokgren
togs ur `origin/main` i stället för ur huvudkatalogen, och all faktainsamling
gjordes med `git show origin/main:<fil>`. Belägg:
`tasks/sessions/2026-08-20-session-108.md` § Del 20 § A–B.

**Det generella:** ett CLI som materialiserar sitt tillstånd ur filer i
arbetsträdet — backlog-kort, changelog, versionsfiler, konfiguration,
genererade register — är en VY av den checkouten, aldrig av projektet. Den
kritiska egenskapen är att felet inte har någon egen signatur: en obockad ruta
ser identisk ut oavsett om den aldrig bockats eller bockats i en commit trädet
inte hämtat. Därför räcker det inte att känna till att trädet är gammalt; man
måste behandla varje läsning därifrån som hypotes tills den prövats mot
`origin/<huvudgren>`. Och en varning som räknar upp EN konsekvens av
föråldrat träd (numret) läser lätt som en uttömmande lista — generalisera
alltid en sådan varning till dess klass innan den används som skydd.

*Konsoliderad ur `tasks/lessons.d/ett-arbetstrad-n-commits-bakom-ljuger-om-innehall-inte-bara-om-numrering.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L542 — Ett facit som täcker en av grindens två vyporter gör grinden halv — och en grind som inte grindar säger det aldrig

**Räkna facit mot antalet KÖRKONFIGURATIONER, inte mot antalet testfall. En
svit som kör i två vyporter men bara har facit för den ena är halv, och
luckan har ingen egen signal: den syns varken i PR-CI:s gröna rollup eller i
sviten som aldrig kördes. Frågan att ställa vid varje ny snapshot-svit är
"vilka konfigurationer kör detta, och finns facit för var och en?" — och
"vilken grind fäller om svaret är nej?"**

Instans (S108, 2026-08-24, `TASK-309.16`):
`tests/visual/__aria__/dokument-generering-promoverings-grind.spec.ts/` bar
**5 filer, samtliga `-desktop`**. Spec-filen har 5 `test(...)` och sviten kör
i två Playwright-projekt (`visual-desktop`, `visual-mobile`,
`playwright.config.ts` rad 691/701) — alltså 10 testfall mot 5 facit.
`npm run test:visual -- dokument-generering-promoverings-grind` gav **5
passed / 5 failed**, där varje fällning var `visual-mobile` med *"A snapshot
doesn't exist … writing actual"*. Ingenting hade fångat det: `#1889` var grön
i CI hela tiden (**12 SUCCESS + 3 SKIPPED**), eftersom visual-testerna bor i
`.github/workflows/visual-baselines.yml` vars ENDA trigger är
`workflow_dispatch` (rad 78, verifierat uttömmande) — sviten grindar
ingenting. Kontrollmätt mot de övriga: **11 av 12** promoverings-grindar bär
`-desktop` och `-mobile` i par; denna är den enda utan.

**Det generella:** en snapshot-svit har två oberoende täckningsaxlar —
scenarierna (testfallen) och konfigurationerna (vyporter, teman, lokaler,
browsrar). Facit-katalogen är kryssprodukten, och en saknad rad i den
produkten uppstår tyst eftersom verktyget bara skapar en fil när något
faktiskt kört. Att sviten dessutom är avfyrad manuellt gör luckan
oupptäckbar i normalflödet: den är inte en grind som fällde fel, utan en
grind som ingen bad om ett svar från. Skilj de två frågorna åt vid varje ny
svit — "täcker facitet allt sviten kör?" och "vad kör sviten automatiskt?" —
för en grön PR svarar på ingen av dem.

*Konsoliderad ur `tasks/lessons.d/ett-facit-som-tacker-en-av-tva-vyporter-gor-grinden-halv.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L543 — Ett facit taget med animationer påslagna fryser ett övergångstillstånd — och `page.screenshot` skyddar dig inte

**Sätt `animations: 'disabled'` på varje bild som ska bli ett facit. En bild
tagen medan en in-animation löper fångar ett läge som aldrig är det stabila —
halvgenomskinligt, halvskalat, halvvägs — och varje framtida jämförelse mot
det facit blir ojämförbar av skäl som inte har med ändringen att göra. De två
vägarna i samma bibliotek har MOTSATTA defaults: assertionen skyddar dig, den
manuella tagningen gör det inte.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, facit-tagningen för skiva 9, `TASK-309.10`, PR
`#1961`): mobil-dialogerna fångades mitt i sin in-animation och blev
halvgenomskinliga i bilden. Mekanismen är belagd i källan —
`src/components/primitives/Modal.tsx` rad 34 ger overlayn
`transition-opacity duration-200 data-[entering]:opacity-0`, och rad 38 ger
panelen `transition-transform duration-200 data-[entering]:scale-95`. Det är
alltså ett **200 ms** fönster där både opacitet och skala är på väg någonstans,
och tagningen landade i det. Fixen står i commit `164190b6`: *"allt med
`animations: 'disabled'` (mobil-dialogerna fångades annars mitt i sin
in-animation)"*.

**Det generella:** samma bibliotek bär två defaults åt motsatt håll, och den
som producerar facit för hand hamnar på fel sida. Verbatim ur typerna
(Playwright 1.62.1): `page.screenshot()` — *"Defaults to `"allow"` that leaves
animations untouched"* (`node_modules/playwright-core/types/types.d.ts` rad
25857); `toHaveScreenshot()` — *"Defaults to `"disabled"` that disables
animations"* (`node_modules/playwright/types/test.d.ts` rad 9673, 9776,
10643). Assertions-vägen bär skyddet inbyggt, medan facit-PRODUKTIONEN — som
per definition går via `page.screenshot()` — måste be om det explicit. Att
grinden sedan är grön bevisar ingenting: den jämför mot referensen, och
referensen är det som är fel. Regeln generaliserar bortom animationer till
allt icke-deterministiskt i fångstögonblicket — en bild som ska bli referens
måste tas i ett läge som är STABILT, inte bara i ett läge som råkade
renderas. Närliggande, redan skriven: `L246` (vol-03) neutraliserar
muspekaren före skärmdumps-jämförelse — samma familj, men den gäller
JÄMFÖRELSEN; denna gäller PRODUKTIONEN av referensen. Syskonlärdom om samma
bilds RUMSaxel: `L537`.

*Konsoliderad ur `tasks/lessons.d/ett-facit-taget-med-animationer-pa-fryser-ett-overgangstillstand.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L544 — Ett fail-closed lås som fäller din PROSA rättas i texten — inte genom att byta kanal

**Ett lås som matchar en förbjuden sträng var som helst i kommandot kan inte
skilja ett kommando från ett dokument. Fäller det en text du skriver är första
frågan om texten BEHÖVER innehålla strängen — inte vilken kanal som tar sig
förbi. Ett trubbigt lås som fäller rätt sträng i fel sammanhang är korrekt
fällning, och att konstruera en väg runt det är att riva skyddet för att
slippa skriva om en mening.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, sessionsdok Del 20): ett `cat > fil <<'EOF'`-heredoc
avvisades av `scripts/deny-prod-ref.sh`. Fällningen var korrekt — skriptets
eget filhuvud säger vad den prövar: *"förekomst av prod-project-refen … NÅGONSTANS
i Bash-kommandosträngen"*, och `.prod-ref-policy.conf` § Matchning motiverar
varför den bredden är MEDVETEN. Det som fälldes var inte ett kommando mot
prod, utan brödtext i ett sessionsdok som citerade refen som förklaring till
ett CORS-resonemang. Skriptet bär dessutom en DOKUMENTERAD bypass-form vars
egen kommentar säger rakt ut: *"bypass-formen ska ENDAST skrivas av Marcus, i
klartext, aldrig av en agent på eget initiativ"* — och erkänner öppet att
ingenting mekaniskt hindrar en agent från att läsa kommentaren och konstruera
formen. Åtgärden blev att utelämna refen ur texten; den tillförde ingenting
som dokumentet inte redan bar på annat sätt. Ingen bypass-form konstruerades.

**Avgränsning mot en närliggande lärdom:** fragmentet
`bang-prefixet-passerar-pretooluse-hookar-matt-tva-ganger.md` § Bifynd
beskriver samma felmod (ett lås fäller ett CITAT i prosa) men motsatt rätt
svar — där löstes det genom att byta verktyg (heredoc → `Write`) och behålla
texten, eftersom texten var själva poängen: fragmentet dokumenterade hookens
mekanik. Skillnaden är inte kanalen utan om strängen är NÖDVÄNDIG i texten.
Pröva den frågan först; kanalbytet är svaret bara när svaret är ja.

**Det generella:** en spärr som matchar på strängnärvaro har ingen modell av
avsikt, och det är designval, inte brist — den kan därför aldrig tyst släppa
igenom något farligt, bara högljutt stoppa något ofarligt. Kostnaden för den
asymmetrin ska betalas där den är billig: i texten. Och en bypass som finns
dokumenterad i skriptets källkod är ingen inbjudan — att den är läsbar för
den som fälls är precis vad som gör det till ett hedersord snarare än ett lås,
och ett hedersord bryts av den som åberopar det åt sig själv.

*Konsoliderad ur `tasks/lessons.d/ett-fail-closed-las-som-faller-prosa-rattas-i-texten-inte-i-kanalen.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L545 — Ett förbehåll som avgör om instruktionen alls går att följa hör ÖVERST — som fotnot är det detsamma som att inte ha skrivit det

**Skriver du "gör X" och sist "obs, X gäller bara om Y", har du gett en
instruktion som kommer att följas utan Y. Ett förbehåll som avgör
instruktionens GILTIGHET är ingen not — det är en förutsättning, och det hör
före handlingen. Texten mäts inte i om den är korrekt utan i om läsaren kan
handla fel efter att ha läst den.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, Del 19 § B punkt 1): Marcus skickades till
prod-appen med frågan *"ser du två rader med Skapa-knappar?"*. Knapparna satt
i en PR som inte landat, så svaret kunde bara bli nej. Förbehållet fanns i
orkestrerarens eget meddelande — men sist, som fotnot. Sessionsdokets egen
formulering: *"vilket är detsamma som att inte skriva den"*.

**Det generella:** ordningen bär betydelse som innehållet inte kan kompensera
för. En läsare som fått en konkret uppmaning börjar handla vid uppmaningen;
allt efter den läses i bästa fall efteråt och i praktiken ofta inte alls — och
en människa som redan öppnat en flik läser inte vidare. Testet före
överlämning är en fråga: finns det en mening i texten som, om den missas, får
mottagaren att göra fel? Flytta den först — eller ta bort handlingen tills
förbehållet är löst, vilket ofta är det ärligare svaret. Regeln gäller lika
för uppdrag till agenter som för instruktioner till människor: ett uppdrag
vars premiss står i sista stycket är ett uppdrag vars premiss inte prövas.

*Konsoliderad ur `tasks/lessons.d/ett-forbehall-som-avgor-instruktionens-giltighet-hor-overst.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L546 — Ett förstapartsmönster får avvisas på MÄTT kostnad — men skälet hör i filen som bär avsteget, aldrig bara i sessionsdoket

**En förstapartskällas rekommendation är en default, inte en lag. Den får
avvisas — men bara mot ett MÄTT tal med sitt mätkommando, aldrig mot tycke, och
bara med skälet nedskrivet i den fil som bär avsteget. Ett avsteg är osynligt i
sin egen form: nästa läsare ser en lucka där det rekommenderade mönstret skulle
stått, och "lagar" den. Skälet på plats är det enda som skiljer ett beslut från
ett slarv — och det ska namnge vilken garanti som VÄXLADES BORT, inte bara
vilken kostnad som sparades.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, Supabase-CLI-pinningen): förstapartskällan
(`github.com/supabase/cli` README) rekommenderar `npm install -D supabase`.
Vägen mättes och förkastades på kostnad, inte princip —
`@supabase/cli-linux-x64` (CI:s plattform) är **159 079 541 B ≈ 159 MB**
unpacked, `@supabase/cli-darwin-arm64` **113 915 186 B ≈ 114 MB**
(`npm view <paket> dist.unpackedSize`; båda talen ombekräftade mot registret
2026-08-24). CLI:t anropas aldrig i CI — verifierat om: noll träffar på
CLI-underkommandon i `.github/workflows/*.yml`, och paketet är frånvarande ur
både `dependencies` och `devDependencies` (raden `"supabase"` i `package.json`
ligger i `keywords`). Avsteget står i `.supabase-cli-policy.conf` § VARFÖR
VERSIONEN INTE PINNAS I package.json — med båda talen, deras mätkommando och
datum — inte bara i sessionsdokets Del 18 § E. Landat i PR `#1915`.

**Vaktens två riktningar, och varför paret måste läsas ihop.** [[L412]] säger
att *"gratis"* aldrig är ett skäl att BYGGA något; denna post säger att ett mätt
tal får vara skäl att AVSTÅ. Samma dubbelriktade över-engineering-vakt, motsatt
tecken — och [[L243]] håller golvet: vakten skär SPEKULATIV komplexitet, aldrig
en beprövad ribba. 159 MB i varje CI-jobb för ett verktyg inget jobb kör är
spekulativ kostnad ovanför golvet; hade CI faktiskt anropat CLI:t vore samma tal
priset för golvet och inte förhandlingsbart. Det är därför "anropas aldrig i CI"
måste MÄTAS och inte antas — det är den mätningen som avgör vilken sida av
vakten kostnaden hamnar på. Jämför fragmentet
`root-config-isolering-tar-bort-en-flaggas-kostnad-dar-den-inte-skyddar.md`:
samma resonemangsform (skyddsytan är smalare än kostnadsytan), men där löstes
det med isolering i stället för avvisning.

**Spänningen mot [[L430]] — den ska skrivas ut, inte tigas ihjäl.** L430 säger
att `npx <namn>` frågar registret efter ett PAKET som heter `<namn>`, och att
åtgärden är *strukturell, inte disciplinär*: en lokal bin från en pinnad
`devDependency` slås upp i FILSYSTEMET och kan därför inte förväxlas med ett
registerpaket. Det är en strikt starkare garanti än den valda vägen. Här är
L430:s specifika felläge ändå stängt — paketnamnet ÄR binärnamnet
(`npm view supabase` ⇒ `name = 'supabase'`, `repository.url =
github.com/supabase/cli`, verifierat 2026-08-24) och versionen är exakt pinnad,
så varken *fel version av rätt kod* eller *rätt namn på fel kod* kan uppstå
tyst. Men garantin är svagare: den vilar på att registret fortsätter mappa
namnet till samma ägare, medan filsystems-uppslaget inte vilar på något alls.
**Och just den växlingen står i skrivande stund INTE i policyfilens huvud** —
det argumenterar bara byte-determinism via immutabla npm-versioner, inte
namn-axeln. Regeln ovan tillämpad på sig själv fäller alltså sitt eget
föredöme: skälet finns på plats, men det redovisar bara halva avvägningen.

**Avgränsning mot [[L337]].** L337 säger att kodkommentarer *"uttryckligen INTE"*
är konventionsbärare — *"en konvention utan hem är en konvention som kommer att
brytas"*. Det motsäger inte denna post, och skiljelinjen är värd att hålla: en
KONVENTION gäller många filer och behöver ett hem utanför dem alla, medan ett
BESLUTS rationale är bundet till exakt den artefakt det formar. [[L226]] slog
redan fast formen — *"dokumenterad exkludering med rationale där beslutet bor …
är governance — en tyst lucka är det inte"* — och denna post flyttar den
klausulen från grind-scope till en ny axel: avvisade förstapartsmönster.

**Det generella:** en förstapartsrekommendation bär auktoritet, så den som
avviker ärver bevisbördan, och den betalas i tre delar. Talet ("för stort" är
inte ett skäl, `159 079 541 B` med sitt mätkommando är). Platsen — och det är
den som glöms, eftersom ett avsteg inte lämnar något spår i formen det avviker
från: en config-fil ser ut som vilken config som helst, och frånvaron av en
devDependency ser likadan ut oavsett om den är övervägd eller förbisedd. Och
växlingen: vilken garanti gav vi upp? [[L374]] äger kravet att utfallet
redovisas *"även när domen blir 'bygg eget'"*, men lämnar öppet både VAR och
VAD; utan den tredje delen läser nästa granskare en avvägning som ett faktum,
och kan inte pröva om priset fortfarande är rätt när förutsättningarna ändrats.

*Konsoliderad ur `tasks/lessons.d/ett-forstapartsmonster-far-avvisas-pa-matt-kostnad-skalet-hor-dar-formen-bor.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L547 — Ett kommando som förutsätter en katalog ges som EN rad — mottagarens skal startar i en katalog du inte styr

**Ger du en människa `cd <katalog>` på en rad och kommandot på nästa, körs de
som två fristående anrop, och det andra startar i sessionens arbetskatalog i
stället för i din. Varje kommando som förutsätter en plats bär därför sin `cd`
i SAMMA rad, sammanbunden med `&&`. Det gäller särskilt `!`-prefixets skal,
som kör ett kommando per anrop.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, Del 18 § H punkt 3): prod-deployens instruktion
gavs som två rader. `!`-anropet körde deploy-kommandot i sessionens
arbetskatalog — som stod kvar i dokträdet efter orkestrerarens egna commits —
och skriptets preflight fällde på fel gren. Preflighten gjorde sitt jobb;
instruktionen var fel.

**Det generella:** den som skriver instruktionen ser sin egen mentala katalog,
mottagarens skal ser sin. Två rader ser ut som en sekvens utan att vara det —
bindningen finns bara i läsarens huvud. `&&` flyttar bindningen in i
kommandot, där den blir mekanisk: faller `cd`, körs ingenting. En kant värd
att känna till: enradsformen löser BINDNINGEN men inte driften — cwd står kvar
efter anropet, så nästa instruktion måste bära sin egen `cd` på samma sätt.
Besläktat men med annan mottagare: `cwd-persisterar-mellan-bash-anrop-och-driftar-tyst.md`
handlar om agentens egna Bash-anrop, där `-C <mål>` är motmedlet. Här kan du
inte ens mäta katalogen du skickar till, vilket gör enradsformen till enda
tillgängliga försvaret.

*Konsoliderad ur `tasks/lessons.d/ett-kommando-som-forutsatter-en-katalog-ges-som-en-rad.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L548 — Ett verktyg som SKRIVER saknat facit gör grinden grön utan att någon granskat innehållet

**Snapshot-verktyg "löser" ett saknat facit genom att skapa det ur den
aktuella körningen. Nästa körning är då grön — men det som stämplades var
vad koden RÅKADE producera, inte vad någon godkänt. Ett facit som föds ur
ett träd där koden just ändrats stämplar ändringen åt granskaren, osedd.
Committa aldrig ett auto-genererat facit i samma pass som du ändrat koden
det beskriver.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, `TASK-309.16` / commit `d9d973d5`): när
promoverings-grindens fem saknade mobil-snapshots avtäcktes hade Playwright
redan **skrivit filerna** vid körningen (*"…writing actual"*). De togs
medvetet **bort igen** i stället för att committas, av två skäl som båda
bär: ett facit stämplas av Marcus (`ADR-102`/`ADR-104`), och dessa
genererades ur ett träd där koden i samma pass fått tre fixar
(`items-center`, avslutande separator, `SidRam`-sidkromet). Att checka in
dem hade gjort den ändrade mobila ytan till gällande form utan att någon
sett den. Bokfört som eget kort i stället, med generering och granskning
lagd i samma pass som den kommande visuella baslinjen.

**Det generella:** ett facit har två funktioner som drar åt olika håll —
det är en REGRESSIONSDETEKTOR (billig, mekanisk) och en GODKÄND FORM (dyr,
mänsklig). Auto-generering levererar den första gratis och förfalskar tyst
den andra. Felmoden är särskilt lömsk eftersom verktyget rapporterar den som
en åtgärd, inte som en fråga: rött blir grönt utan att någon fattat ett
beslut. Regeln som håller är att skilja de två ögonblicken i tiden — en
körning som ÄNDRAR kod får aldrig också vara den som FÖDER facitet. Kör
generering i ett eget pass, mot ett träd vars kod redan är godkänd, och låt
en människa se resultatet innan det blir sanning.

*Konsoliderad ur `tasks/lessons.d/ett-verktyg-som-skriver-saknat-facit-gor-grinden-gron-utan-granskning.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L549 — När en skarp operation faller: flytta frågan till den ofarliga tvillingen — en differential med EN varierad variabel slår varje hypotes

**Ett fel under en prod-operation drar tanken till prod. Rätt första drag är
att reproducera samma operation mot den ofarliga tvillingen (staging) med allt
annat konstant, och sedan variera EN misstänkt variabel i taget. Utfallet
flyttar frågan från "är målet trasigt?" till "är verktyget fel?" utan att röra
det skarpa målet en andra gång.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, Del 18 § A–B): prod-deployen avbröts efter **18 av
45** funktioner — CLI:t försökte öppna INNEHÅLLET i en 25 kB
enkelrads-strängmodul som om det vore en sökväg. Skript-vägen visade sig köra
två CLI-versioner: det fällande anropsstället kallade den globala binären
(2.75.0), anroparen körde genomgående `npx supabase` (2.115.0). Differentialen
kördes mot SAMMA funktion, SAMMA mål (staging) och samma träd, med
CLI-versionen som enda varierade variabel:

| CLI | Utfall |
|---|---|
| `supabase` 2.75.0 (global binär) | FAIL — identiskt fel, reproducerat |
| `npx supabase` 2.115.0 | EXIT 0 |

Alltså verktyget. Inte prod, inte filen, inte det nyss landade schemat. Att
staging fungerat hela tiden förklarades av att staging-deployerna körts via
`npx`.

**Det generella:** en skarp miljö är det dyraste stället att felsöka i — varje
körning är en riktig mutation, och varje hypotes du inte kan pröva där blir
kvar som osäkerhet i rapporten. Tvillingen är billig och obegränsad.
Giltighetsvillkoret är att allt utom EN variabel hålls konstant: håller du två
(annat mål OCH annan version) mäter du summan och kan inte tillskriva någon av
dem. Det som gjorde differentialen möjlig här var att skillnaden redan låg
nedskriven i koden — två anropsställen i samma kedja använde två olika former
av samma verktyg. Leta efter den asymmetrin först; den är oftare orsaken än
miljön.

*Konsoliderad ur `tasks/lessons.d/flytta-fragan-till-den-ofarliga-tvillingen-vid-en-skarp-fallning.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L550 — Granskningsytan har TVÅ axlar — vilket träd den serverar och vilken backend den pratar med

**En granskningsyta kan servera exakt rätt commit och ändå vara oanvändbar,
därför att den pratar med fel miljö. Verifiera båda axlarna innan en människa
skickas dit: gren och SHA för koden, och den faktiska bakänds-URL ytan
anropar. Ett fel i granskningsVÄGEN är oskiljbart från ett fel i det
granskade — recensenten rapporterar din väg som en defekt i ditt arbete.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, Del 19 § B): Marcus skickades till fel yta två
gånger i rad. (1) Till prod-appen för att leta efter knappar som satt i en PR
som inte landat — prod körde gamla klienten, så svaret kunde bara bli nej.
(2) Till Vercel-previewen, som svarade *"Kunde inte hämta gemensamma dokument
— Failed to fetch"*: rätt träd, fel bakände. Samma fel var dessutom förutsagt
ett pass tidigare (Del 18 § H punkt 2) och ändå upprepat. Rätt väg blev
dev-servern på promoveringsgrenens EGET arbetsträd, som läser
`.env.development` mot staging — verifierad med `200` innan överlämningen.

**Det generella:** träd-axeln är redan bokförd (`[[L490]]`: en granskningsyta
mot fel träd ger falsk oro; dessutom fragmentet om att dev-servern serverar
huvudkatalogens utcheckade gren). Bakänds-axeln är osynligare, eftersom den
bestäms av byggläge och miljöfiler i stället för av något du checkar ut — den
syns inte alls förrän ett anrop faktiskt går, och då som ett fel i UI:t.
Verifieringen är billig och ska ske i den ordningen: läs vilken bakänds-URL
ytan faktiskt använder, gör ett anrop som når applikationslagret, och lämna
över först därefter. Kostnaden av att hoppa över den betalas av recensenten,
som felsöker något som inte är trasigt.

*Konsoliderad ur `tasks/lessons.d/granskningsytan-har-tva-axlar-trad-och-backend.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L551 — Grundorsaken till DET SOM FÖLL löses nu — en lapp med en anteckning om den riktiga fixen är fortfarande en lapp

**När symptomet är åtgärdat men grundorsaken bakom samma fällning står kvar,
är "eget kort" inte scope-disciplin utan uppskjuten lathet med kvitto. Gränsen
som räddar regeln från att bli gränslös: det som ska lösas NU är roten till
det som just föll. Defekter som aldrig var en del av samma fel registreras —
det är en annan sak, och den är legitim.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, Del 18 § C): prod-deployen föll på en ostyrd
CLI-version. Första PR:en (`#1900`) bytte det fällande anropsstället till
`npx supabase` och bokförde den kvarstående svagheten — att `npx supabase`
inte heller är versionspinnad — som "eget kort". Marcus fällde det:
*"Varför löser vi inte svagheter och brister? Du vet ju att vi håller
branschledarstandard."* Klassen stängdes i stället i samma pass (`#1915`:
policyfil, resolver, samtliga sju anropsställen), medan defekter UTANFÖR
fällningen fick sina kort (`#1902`: `TASK-312` för `jq`, `yamllint`, GitHub
Actions och `gh`; `TASK-313` för `--dry-run`-defekten).

**Det generella:** uppskjutandet ser ut som disciplin därför att det
producerar en artefakt — ett kort, en rad i en rapport, en referens att peka
på. Testet som skiljer de två fallen åt är en enda fråga: *skulle den
registrerade posten ha förhindrat den fällning du just åtgärdade?* Är svaret
ja är det inte ett kort — det är resten av fixen. Är svaret nej är
registreringen rätt handling. Motsatt riktning finns redan bokförd i huset:
när roten ligger utanför repots rådighet ÄR bokföringen rätt svar, men då med
namngiven ägare, exakt ändring och ett datum att mäta om — inte som en
hänvisning utan mottagare.

*Konsoliderad ur `tasks/lessons.d/grundorsaken-till-det-som-foll-loses-nu.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L552 — Kastbar testdata vars fältvärden ligger inom produktens egna urval blir synlig för användaren — städbar är inte samma sak som osynlig

**En testfixturs NAMN gör den städbar; dess FÄLTVÄRDEN avgör om den syns. Ett
kastbart event med ett framtida startdatum hamnar i appens eventväljare precis
som ett riktigt, hur tydligt sentinel-prefixet än är. Välj därför värden som
faller UTANFÖR produktens normala urval, och lita aldrig på att en purge-target
räcker: en SETUP-purge städar före nästa körning, inte efter din — mellan dem
ligger skräpet framme.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, `TASK-309.15`): `tests/api/save-event-text.staging.test.ts`
§ `createThrowawayEvent` (rad 70–89) skapar event med `startdatum: '2026-09-15'`
och `ort: sentinelOrt(suffix)` = `ZZ-TASK-309.3-text-<suffix>-<uuid>`. Sviten
har ingen teardown — filens egen not konstaterar att ingen återställning av
FÄLTVÄRDEN behövs, vilket är sant, men den skapar också EVENT och de raderas
aldrig. `.purge-staging-policy.json` HAR en target för familjen
(`save-event-text-eventplanering-sentineler`, `FIND('ZZ-TASK-309.3-', {Ort}) = 1`),
men `ci-suite.yml` rad 85 och 659–661 säger uttryckligen att purge-jobbet är en
**setup**-purge som körs FÖRE staging-stegen. Följden är att mängden aldrig har
en stabil nollpunkt: **44** poster med `ZZ-TASK-309.3-text-`-prefix mättes på
kortet 2026-08-24, och en oberoende omräkning senare samma dag (Airtable
staging, samma filter) gav **54** poster i hela `ZZ-TASK-309.3-`-familjen
varav **33** med `text-`-prefix. Kostnaden var inte lagringen: Marcus valde ett
av dem vid granskningen och såg en genereringsvy där varje block stod tomt —
testeventet har varken eventinnehåll eller platslänk — vilket läste som ett
designfel i vyn i stället för som frånvarande data, och kostade en
granskningsrunda.

**Det generella:** testdata i en delad icke-produktionsmiljö har två skilda
egenskaper som lätt slås ihop. IDENTIFIERBARHET (ett sentinel-prefix) löser
städning och är det man designar för. SYNLIGHET avgörs av helt andra fält —
datum, status, flaggor — och den designas sällan alls, eftersom testet bara
bryr sig om att posten existerar. Ett värde som är bekvämt för testet
(*"lägg det i framtiden så det är giltigt"*) är exakt det som placerar posten
i produktens standardurval. Två motmedel, båda behövs: välj fältvärden som
faller utanför urvalet där det går, och äg städningen i sviten själv
(teardown) med den delade purgen kvar som andra försvarslinje — aldrig som
första.

*Konsoliderad ur `tasks/lessons.d/kastbar-testdata-vars-faltvarden-ligger-i-produktens-urval-blir-synlig.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L553 — Landning verifieras mot TILLSTÅNDSFÄLTET — en grep på ett PR-nummer träffar inuti SHA:n, datum och räkneverk

**`git log | grep -c "<nummer>"` är inget landningsbevis. Ett fyrsiffrigt
PR-nummer förekommer som delsträng i 40-teckens SHA:n, i datum och i
sifferkolumner, så sökningen ger träff utan att PR:en landat — och en träff
läses som ja. Landning verifieras mot det auktoritativa tillståndsfältet
(`gh pr view --json state,mergedAt`) PLUS commiten i `origin/main`, aldrig med
en textsökning på ett nummer.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, Del 18 § H punkt 1): orkestreraren rapporterade
`#1900` som landad medan den stod köad. Kontrollen var
`git log | grep -c "1900"`, som matchade ett SHA-fragment. Marcus fick ett
klartecken som inte höll; rättat i samma pass.

**Det generella:** felriktningen är det farliga. En textsökning på en kort
numerisk token har hög falsk-POSITIV-benägenhet, och falska positiver i en
landningskontroll är den enda riktning som inte upptäcker sig själv — ett
falskt "nej" leder till en extra kontroll, ett falskt "ja" leder vidare in i
nästa beslut. Klassen är redan bokförd en gång i huset (`[[L336]]`: en vakts
utdata är en signal, aldrig facit — verifiera mot `gh pr view --json
state,mergedAt`); den här instansen lägger till att INSTRUMENTET kan vara fel
även när ingen vakt är inblandad. Regeln generaliserar bortom PR:er: sök
aldrig efter en IDENTITET med delsträngsmatchning när ett fält bär den exakt.

*Konsoliderad ur `tasks/lessons.d/landning-verifieras-mot-tillstandsfaltet-inte-med-en-grep-pa-ett-nummer.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L554 — En variabel som bär både ett VÄRDE och svaret på "har vi laddat än?" är en söm — och utskriften som namnger källan ljuger först

**Memoisera aldrig på ett värdes eget "är den satt?". Bär en variabel två
informationer — vilket värde som gäller OCH om källan lästs — kan den som
sätter värdet utifrån stänga av inläsningen helt, inte bara påverka dess
resultat. Följdfelet är värre än sömmen: framgångsraden fortsätter namnge
policyfilen som källa när värdet kom ur miljön. Låt memo-flaggan vara egen och
privat, nollställ värdet ovillkorligt före inläsning — och pröva varje
utskrift som namnger sin källa genom att låta källorna säga OLIKA saker.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, granskningen av PR `#1915`): resolvern
`scripts/lib/supabase-cli.sh` bar
`SUPABASE_CLI_VERSION="${SUPABASE_CLI_VERSION:-}"` (rad 106 vid `a597fbaa`) och
memoiserade på variabelns eget tillstånd
(`[[ -n "${SUPABASE_CLI_VERSION}" ]] && return 0`, rad 112). En ambient
miljövariabel kortslöt därför hela policyfilen — den lästes aldrig.
Reproducerat förstahands mot `a597fbaa` med stubbad `npx` och en policyfil som
sa `2.115.0`:

```text
PRE-FIX  utan env-var         exit=0  ✓ verifierad: 2.115.0 (pinnad, <policyfil>)
PRE-FIX  env-var 2.75.0       exit=0  ✓ verifierad: 2.75.0  (pinnad, <policyfil>)
EFTER    env-var 2.75.0       exit=0  ✓ verifierad: 2.115.0 (pinnad, <policyfil>)
```

Guarden vars ENDA syfte var att göra `2.75.0` omöjlig bad `npx` om exakt den
CLI-version som fällt prod-deployen — med **exit 0** och en framgångsrad som
ändå skrev `(pinnad, <policyfil>)`. Fixen angrep roten, inte symptomet: en egen
privat `_SUPABASE_CLI_POLICY_LOADED`, versionen nollställd ovillkorligt vid
`source`, och ett värde-nivå-override övervägt och avvisat med skälet
nedskrivet i filen (testisolering täcks redan av att peka om HELA filen via
`SUPABASE_CLI_POLICY_FILE`). Tvåsidigt bevis i
`scripts/test-supabase-cli-policy.sh` T9 — ommätt här: **25/25 PASS, exit 0**.
Fångat av granskningen FÖRE landning.

**Avgränsning mot familjen — den är väl bevakad, men på andra axlar.**
[[L409]] är klassens rot: en regel som PÅSTÅR en mekanism den saknar granskas
inte. Där saknades mekanismen helt; här FANNS den, den läste bara fel källa och
skrev ut fel källnamn. [[L387]] kräver att *varje* led i ett instrument prövar
samma env-flagga — där är felet vilket villkor som grindar rapporten, här att
en variabel bär två informationer, vilket ger en annan åtgärd: dela variabeln,
inte flytta villkoret. [[L336]] riktar sin regel till den som KONSUMERAR en
vakts utsaga (behandla den som hypotes); denna riktar sig till den som SKRIVER
utsagan. [[L478]] har samma kringgång av en config-gräns via en yttre kanal
(kommandoradsargument i stället för miljövariabel) men utan den falska
källattributionen. Fragmentet
`stampel-sha-harleds-ur-ref-som-star-stilla.md` ligger närmast av alla — där
kom värdet från en FÖRÅLDRAD källa, här från en HELT ANNAN källa än den som
namnges, och det är namngivningen som är lögnen. [[L371]] bär redan satsen
*"loggraden ska spegla vad som faktiskt injicerades, inte vad som avsågs"*,
men som bisats i en post om en teckengräns, där ingen som söker detta hittar
den.

**Det generella:** tre saker gör felmoden möjlig, och alla tre är
återanvändbara. (1) **`${VAR:-}` är inte en default, det är en söm** — idiomet
läser som "tomt om osatt" men betyder "vem som helst i omgivningen får
bestämma", och gör en fail-closed policyfil överskrivbar av precis den
omgivning den finns för att stänga ute. (2) **Memoisering på ett värdes eget
tillstånd konflaterar två frågor**, och den som kan sätta värdet utifrån
avaktiverar då inläsningen. (3) **En utskrift är ett starkare sanningsanspråk
än ett dokument**, eftersom den framstår som en mätning av det som just hände i
stället för en beskrivning skriven i förväg — den tar bort granskningen precis
som `ADR-083`:s prosa gör, men i det ögonblick en oåterkallelig operation ska
godkännas. Därav prövningsformen: en grind som bara körs mot ETT tillstånd
mäter att den kan skriva ut ett grönt tecken, inte att den läser det den säger.
Och detta är den ANDRA oberoende instansen av `ADR-083`-felet inuti
`ADR-083`-arbetet — [[L420]] var den första — vilket gör mönstret till en regel
värd att koda: en fix som stänger en felklass ska prövas mot SIN EGEN klass
innan den landar, för den PR som är mest benägen att återinföra ett fel är den
som skrivs av någon som just tänkt på det.

*Konsoliderad ur `tasks/lessons.d/memoisera-aldrig-pa-ett-vardes-eget-ar-den-satt.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L555 — Ett oisolerat pass läser det träd avsändaren står i — synka trädet FÖRE passet, annars mäter passet gårdagen korrekt

**En oisolerad agent har ingen egen checkout: den läser huvudkatalogens
arbetsträd, vars gren och ålder avsändaren äger och passet inte kan se. Står
trädet på en gammal gren blir passets fynd en KORREKT mätning av fel träd — och
det färdas vidare som en premisskorrigering, med research-passets auktoritet.
Synka trädet du skickar passet IN i, i samma andetag som du startar passet.**
`[UNIVERSAL]`

Instans (S108, 2026-08-23, Del 14 § B — planen till prod): research-passet
`docs/research/mallar-server-side-docraptor-prod-2026-08-23.md` levererade en
"premisskorrigering" om att `sjalvbarande.ts` inte fanns. Passet hade läst
huvudkatalogen, som stod kvar på den gamla grenen `docs/s109-hub-lyft`. På
`origin/main` fanns filen — **233 rader**. Rättat i forskningsfilen;
huvudkatalogen flyttades till `origin/main` (detached) så att kommande
oisolerade pass läser rätt träd.

**Det generella:** isoleringsvalet i sig är rätt — `[[L453]]` (isolera efter
behov, inte som default) vilar på mätning, och ett pass som skriver EN ny fil
under `docs/research/` behöver ingen worktree. Men valet flyttar ett ansvar
till avsändaren som ingen mekanism bär: den isolerade agenten får ett färskt
träd gratis, den oisolerade ärver ditt. Passets rapport bär normalt varken
gren, SHA eller datum för det träd den läste, så divergensen syns först när
någon prövar fyndet mot `origin/main` — och en "premisskorrigering" är precis
den fyndklass som INTE prövas, eftersom den redan låter som resultatet av en
prövning. Två former stänger luckan: synka trädet före dispatch, och kräv att
passet källmärker vilken SHA det läste.

*Konsoliderad ur `tasks/lessons.d/oisolerat-pass-laser-avsandarens-trad-synka-det-fore-passet.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L556 — Parallella skivor med gemensam filyta konfliktar i KÖN, inte i bygget — uppdraget mot en olandad syskongren bär syskonets filyta och ancestor-testet

**Två agenter som rör samma filer bygger båda grönt och märker ingenting;
kollisionen dyker upp först när den andra posten ska mergas. Startas ett
uppdrag medan en syskonskiva ännu inte landat ska uppdraget bära två saker:
syskonets FILYTA namngiven, och instruktionen att utgå från syskongrenen om
`git merge-base --is-ancestor` faller. Då löser agenten kollisionen själv,
före kön.**
`[UNIVERSAL]`

Instans (S108, 2026-08-23, Del 15 § C punkt 3): skiva 3 (`#1877`) och skiva 2
(`#1874`) delade `field-allowlists`, `CONTRIBUTING.md` och purge-policyn.
Agenten löste det på egen hand med rebase och `--force-with-lease`, eftersom
uppdraget pekade ut den parallella skivans filyta. Formen användes **tre
gånger** i samma pass (skivorna 4, 5 och 6) med **noll omstarter**.

**Det generella:** merge-kön bygger varje post mot `main` plus posterna före
den, så den löser mekaniska konflikter — men den löser dem SENT, en post i
taget, och en fällning där kostar en hel köcykel plus en väckt agent som redan
rapporterat klart. Informationen som krävs för att lösa dem tidigt är gratis
att ge: orkestreraren VET vilka skivor som är i luften och vilka filer de rör,
agenten kan omöjligt veta det — den ser varken sina syskon eller deras grenar.
Ancestor-testet är det billiga beslutskriteriet, för det svarar "ligger
syskonets arbete redan under mig?" utan att agenten behöver förstå syskonets
innehåll. Regeln generaliserar till varje fan-out där posterna delar filyta:
namnge ytan i uppdraget, och ge ett mekaniskt test för när basen ska bytas.

*Konsoliderad ur `tasks/lessons.d/parallella-skivor-konfliktar-i-kon-uppdraget-bar-syskonets-filyta.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L557 — En rads renderade höjd beror MÄTT på hur många syskon den har i DOM — inte bara sitt eget innehåll

**Mät ALDRIG "höjden på de första N raderna" genom att observera en RAD i en
kontext med FLER än N rader, och sedan applicera talet i en kontext med EXAKT
N. Browserns layout-avrundning fördelas över HELA flödet, inte per element —
samma rad, samma props, kan rendera 1 px olika beroende på hur många syskon
den har.** `[UNIVERSAL]`

Mätt (TASK-309.24, dokumentlistans höjdlåsning): en identisk rad
(`getBoundingClientRect().height`) gav **99 px** när sju rader låg i samma
`<ul>`, men **98 px** när bara fyra gjorde det. Samma DOM-nod-typ, samma
textinnehåll, samma CSS-klasser — enda skillnaden var antalet SYSKON i
flödet. En diagnos-fil (`page.evaluate` som loggade `offsetTop`/
`getBoundingClientRect()` för rad 1–4 i båda kontexterna) bekräftade det
direkt, INTE en teori som stod oprövad.

Konsekvensen för mätnings-kod: en cache-strategi som mäter EN gång (i vilken
kontext som helst) och återanvänder värdet överallt håller INTE pixel-exakt
när olika kontexter har olika radantal. Rätt fix är att identifiera den ENA
kontexten där precisionen faktiskt prövas (i det här fallet: filtret som kan
visa EXAKT gränsvärdet, `antalSynliga === N`) och låta DEN vara den
auktoritativa mätkällan — övriga kontexter tolererar ±1 px eftersom de redan
är i ett "gott nog"-läge (t.ex. redan rullningsbara).

Negativ kontroll: att temporärt ta bort den auktoritativa källans särbehandling
och låta VILKEN SOM HELST kontext skriva över cachen reproducerade omedelbart
en riktig, mätbar 1 px-diff mellan de två kontexterna — bekräftar att
skillnaden är verklig layoutbeteende, inte en bugg i mätverktyget.

*Konsoliderad ur `tasks/lessons.d/en-rads-renderade-hojd-beror-pa-hur-manga-syskon-den-har.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L558 — En enda `esm.sh`-import i toppen gör HELA den delade filen otestbar i Node

TASK-309.22 (2026-08-26), miranon-media-admin · `_shared/attachments.ts`

`[UNIVERSAL]`

**Vad som antogs:** att `sanitizeFilnamn`/`buildAttachmentLeaf` — två rena
strängfunktioner utan Deno-beroenden — skulle gå att importera direkt i ett
Playwright/Node-test (`api-pure`) från `_shared/attachments.ts`, precis som
`tests/api/course-dimensions.test.ts` redan gör mot en annan `_shared`-fil.

**Vad som faktiskt hände:** `node -e "import('.../attachments.ts')"` kastade
omedelbart —

```text
Error [ERR_UNSUPPORTED_ESM_URL_SCHEME]: Only URLs with a scheme in: file and
data are supported by the default ESM loader. Received protocol 'https:'
```

INNAN någon av filens funktioner ens anropades. Orsaken: `attachments.ts` har
`import { z } from 'https://esm.sh/zod@4';` överst — för en HELT ANNAN
angelägenhet (räckviddsvalidering, `AttachmentScopeInputSchema`). ES-modulers
alla top-level-imports resolvas innan modulkroppen körs, så EN esm.sh-import
någonstans i filen gör HELA filen ett strukturellt otestbart Node-import,
oavsett vilken specifik export testet faktiskt behöver.

**Hur det upptäcktes:** ett minimalt 2-radigt repro (`node -e`) INNAN
enhetstestfilen skrevs — samma "testa nytt bibliotek/approach minimalt
innan full implementation"-disciplin som redan står i `CLAUDE.md`, tillämpad
på en import-mekanism i stället för ett bibliotek.

**Hur det löstes:** de zod-fria pura funktionerna (`sanitizeFilnamn`,
`buildAttachmentLeaf`, `buildAttachmentPath`) flyttades till en NY, helt
importfri fil (`_shared/attachment-filename.ts`), re-exporterad oförändrat
från `attachments.ts` — noll konsument-ändringar för de 13 EF-filer som redan
importerade dem. Den nya filen lades dessutom till `tsconfig.edge-shared.json`s
include-lista (en redan existerande, disciplinerad mekanism för exakt denna
klass moduler: "transitivt Deno-fri" pura `_shared`-filer får äkta
Node-tsc-täckning i stället för att bara typas av Deno vid deploy).

**Generalisering:** innan ett enhetstest planeras mot en `_shared`-fil i ett
Deno/Node-hybridrepo, grep:a filens EGNA topp-imports (inte bara den
specifika funktionens beroenden) för `https://esm.sh/` eller andra
URL-scheman. En enda sådan rad — även för en HELT ANNAN export än den som
ska testas — blockerar hela filen. Symptomet (`ERR_UNSUPPORTED_ESM_URL_SCHEME`)
är omedelbart och entydigt, men kostar en hel diagnosrunda om man inte vet
att man letar efter det.

*Konsoliderad ur `tasks/lessons.d/esm-sh-toppimport-gor-hela-delad-fil-otestbar-i-node.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L559 — Ett mätt radspann som sätts direkt som `style.height` glömmer boxens EGEN kant under `box-sizing: border-box`

**Mäter du en behållares innehåll (via barnens `getBoundingClientRect()`) och
applicerar talet rakt av som `element.style.height`, under `box-sizing:
border-box` (Tailwind preflight, gäller universellt): behållarens EGEN
`border`-bredd äts av samma tal innehållet skulle fått — resultatet klipper
för tidigt med exakt kantbredden. Kompensera genom att LÄGGA TILL
`borderTopWidth + borderBottomWidth` (`getComputedStyle`) vid mätningen,
inte efteråt.** `[UNIVERSAL]`

Mätt (TASK-309.24): `<ul>` bar `border border-transparent` (1 px, `--mm-*`
neutral tokens) + `box-sizing: border-box` (universell preflight). En höjd
satt till EXAKT radspannet (`fjarde.bottom - forsta.top`, 396 px i det mätta
fallet) gav `clientHeight = 394` — 2 px FÖR LITE innehållsyta, eftersom
border-box-modellen räknar bort kantens 2 px (1 px topp + 1 px botten) FRÅN
den satta höjden i stället för att lägga dem UTANPÅ. Fjärde radens
underkant hamnade därmed 2 px UTANFÖR den faktiskt tillgängliga ytan —
klippt, trots att mätningen var (för det innehållet) matematiskt korrekt.

Diagnosen som avslöjade det: `getComputedStyle(ul).boxSizing` +
`.borderTopWidth`/`.borderBottomWidth` lästa direkt i en Playwright-
`evaluate`, jämförda mot `ul.clientHeight` och den satta `style.height`.
Symptomet (en STÄNDIG, inte sporadisk, 1–2 px-avvikelse mellan avsedd och
faktisk klippgräns) är den signatur som skiljer detta fel från den
sibling-count-beroende avrundningen i den systerlärdomen som föddes i samma
pass (`en-rads-renderade-hojd-...md`) — de två felen samverkade och gjorde
varandra svårare att isolera tills de mättes var för sig.

En vakt som bara kontrollerar `scrollHeight > clientHeight` (rullningsbar
eller ej) fångar INTE detta — felet syns bara om man prövar den EXAKTA
klippgränsen (`scrollHeight === clientHeight` vid gränsvärdet, eller en
direkt jämförelse mot det avsedda radspannet). Två separata, redan gröna
tester i detta repo (GemensamtLage:s "5 och 6 rader"-test) missade felet
helt av just den anledningen tills ett STRIKTARE test (exakt fyra rader,
ingen slack tillåten) byggdes.

*Konsoliderad ur `tasks/lessons.d/matt-radspann-som-satts-som-style-height-glommer-boxens-egen-kant.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L560 — Att köra `npm run build` parallellt med acceptance-sviten gav ett FALSKT rött 15 s-timeout

Samma acceptance-testfil kördes två gånger i rad utan kodändring mellan
körningarna: en gång medan `npm run build` (+ ett fullt `biome check .`)
kördes SAMTIDIGT i samma worktree, en gång ensam. Den samtidiga körningen
fällde ETT test (`toBeVisible` på ett 15 s-budget-`expect`, testets
FÖRSTA assertion efter `page.goto`) — samma testfil, ORÖRD kod, gick 15/15
grönt i den ensamma körningen 90 sekunder senare, med varje enskilt tests
tid nedkortad ~3–4× (46,4 s → 6,9 s för det test som fällde).

Detta var INTE en flake i testet eller i fixen — det var CPU-kontention:
en fullständig `vite build` + `biome check .` över hela repot pressade
samma maskin som chromium-headless-shell-processerna (flera parallella
worktrees/agenter körde dessutom EGNA Playwright-svep samtidigt, synligt i
`ps aux`). Acceptance-klassens 15 s-`expect`-budget (`playwright.config.ts`,
TASK-74) är härledd mot en normalbelastad maskin, inte mot "bygg + lint +
flera andra agenters browser-instanser samtidigt".

**Regel:** kör inte tunga CPU-bundna DoD-kommandon (`npm run build`, ett
repo-brett `biome check .`) PARALLELLT med en Playwright-svit du samtidigt
vill lita på tidsbudgeten för. Antingen sekventiellt, eller acceptera att en
röd tidsbudget under uppmätt samtidig belastning kräver en ren ISOLERAD
omkörning innan den tolkas som en regression — läs alltid `ps aux` (eller
motsvarande) innan en enstaka `expect`-timeout bokförs som en kodbugg.

Instans: `TASK-309.23`, 2026-08-26.

*Konsoliderad ur `tasks/lessons.d/npm-run-build-parallellt-med-acceptance-sviten-gav-ett-falskt-rott-timeout.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L561 — Playwright-bevis för "fönstret navigerar till URL X" — servera INTE `application/pdf`

**Ska ett Playwright-test bevisa att ett fönster/en flik NAVIGERAR till en
given URL (`page.url()`/`waitForURL`), och destinationen i skarp drift är en
PDF: mocka svaret med en ofarlig content-type (`text/plain`/`text/html`),
aldrig `application/pdf` — och läs `.url()` via `expect.poll`, inte
`waitForURL`s `load`-event.** `[UNIVERSAL]`

Mätt konkret (TASK-309.26, `dokument-generering-fonster-direkt.acceptance.
test.ts`): ett test som öppnade ett fönster synkront (`window.open('',
'_blank')`) och sedan satte dess `location.href` till en MSW-mockad URL som
svarade med `content-type: application/pdf` föll deterministiskt med
`page.waitForURL: net::ERR_ABORTED; maybe frame was detached?` — och även
efter att `waitForURL` byttes mot `expect.poll(() => nyFlik.url())` stod
`.url()` fortfarande kvar på `about:blank`, aldrig destinationen.

**Orsaken är Chromes inbyggda PDF-visare, inte testkoden eller appkoden.**
En navigering till en `application/pdf`-resurs hanteras av en egen
MimeHandlerView (samma mekanism som gör att en vanlig flik "byter om" till
PDF-visarens UI) — det avbryter den normala navigationslivscykeln Playwright
följer via CDP, och varken `load`-eventet eller `Page.url()` uppdateras
tillförlitligt för den ursprungliga frame:n. Detta är samma felklass som
gör att riktiga PDF-nedladdningar ofta hanteras som `download`-events i
Playwright i stället för navigeringar — men den kopplingen syns inte förrän
man faktiskt provar, eftersom felmeddelandet ("frame was detached") pekar på
frame-livscykeln, inte på content-type.

**Fixen kostade två misslyckade körningar innan den hittades:** första
försöket bytte content-type till `application/pdf` med en fejk-PDF-kropp
(föll på `waitForURL`); andra försöket bytte `waitForURL` mot `expect.poll`
men behöll `application/pdf` (föll fortfarande, samma orsak — problemet var
aldrig eventet, det var content-typen). Tredje försöket bytte content-type
till `text/plain` och behöll `expect.poll` — grönt direkt, tre gånger i rad.

**Vad testet FAKTISKT ska bevisa avgör om detta är en genväg eller ett
fusk.** Ett UI-test som verifierar "fönstret navigerar till rätt URL" bryr
sig om navigeringen, inte om PDF-renderingen — den delen hör hemma i
EF-/API-sviten (samma dokumentklass-gräns som `acceptance-bas.ts` § VAD
KLASSEN BEVISAR redan drar). Att servera `text/plain` i stället för en riktig
PDF-kropp är alltså inte att testa fixturen — det är att undvika en
webbläsar-egenhet som inte hör till det testade beteendet.

*Konsoliderad ur `tasks/lessons.d/playwright-pdf-navigering-i-nytt-fonster-anvand-inte-application-pdf-content-type.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L562 — `--project=acceptance` utan miljöflaggan startar TYST fel webServer-gren

**`playwright.config.ts`s `webServer`-block är EN global inställning per
konfigurationsfil, avgjord av `process.env`-flaggor VID CONFIG-EVALUERING —
inte av `--project`. Ett `npx playwright test --project=acceptance`-anrop
utan `PLAYWRIGHT_ACCEPTANCE_DEV_SERVER=1` startar den FÖRSTA matchande grenen
i webServer-ternarien (i detta repo: e2e-grenen, port 5173), inte
acceptance-projektets egen (port 22399-serien) — testerna kör då mot en
server projektets URL aldrig pekade på, och `page.goto()` fäller på
`ERR_CONNECTION_REFUSED` med ett felmeddelande som ser ut som en trasig
dev-server, inte som en saknad miljövariabel.**

Mätt i TASK-309.24 (runda 2, 2026-08-26): `npx playwright test
tests/acceptance/X.test.ts --project=acceptance` (utan
`PLAYWRIGHT_ACCEPTANCE_DEV_SERVER=1`) gav 716 ms till
`ERR_CONNECTION_REFUSED` mot `localhost:22399` — `DEBUG=pw:webserver`
avslöjade att den FAKTISKT startade servern var e2e-grenen på port 5173,
som blev "tillgänglig" på ~4 s men aldrig testades mot (fel URL). Lösningen
(`package.json`s `test:acceptance`-script) sätter flaggan; samma mönster
gäller `test:visual` (`PLAYWRIGHT_VISUAL_DEV_SERVER`), `test:webblasarbeteende`,
`test:a11y`.

`[UNIVERSAL]` Kör ALLTID testklassens egna `npm run`-script (eller kopiera
dess env-prefix exakt) i stället för ett rått `npx playwright test
--project=<namn>` när `playwright.config.ts` har ett `webServer`-block som
grenar på miljövariabler — `--project` väljer VILKA TESTER som körs, inte
VILKEN SERVER som startas åt dem. Ett `ERR_CONNECTION_REFUSED` eller en
oväntat snabb/långsam serverstart är signalen att kontrollera vilken gren
som faktiskt vann, med `DEBUG=pw:webserver` om det inte är uppenbart.

*Konsoliderad ur `tasks/lessons.d/playwright-webserver-ar-global-inte-per-projekt-flaggan.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L563 — Reservera plats för INTERAKTIVA kontroller kräver `inert`, inte bara `invisible` — och byter testkontraktet från `toHaveCount(0)` till `not.toBeVisible()`

`[UNIVERSAL]`

Husets etablerade "reservera alltid plats"-teknik (`Pill`s `dold`-prop i
`PersonsList.tsx`, S103: rendera alltid, dölj med `invisible`) räcker för
rent visuella platshållare utan fokuserbara barn. Den räcker INTE ensam när
det dolda innehållet bär riktiga kontroller (en `<Select>`, en knapp): en
`invisible` (`visibility: hidden`) yta må vara osynlig, men utan ytterligare
spärr kan JS-`.focus()` fortfarande flytta fokus dit, och beroende på
komponentbibliotek kan tangentbordsnavigering av misstag hamna där.

**Motmedlet är nativa `inert`** (React 19-attribut, `boolean`,
[MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/inert)):
det gör HELA underträdet icke-fokuserbart och tar bort det ur
tillgänglighetsträdet i EN sats — ett enda attribut på behållaren i stället
för `tabIndex={-1}` + `aria-hidden` upprepat på varje kontroll för sig, en
form som lätt glöms när en tredje kontroll läggs till raden senare.
`invisible` sköter den visuella döljningen; `inert` sköter fokus-/AT-spärren.
De två är ORTOGONALA — det ena ersätter inte det andra.

**Konsekvensen för test som redan finns:** en kontroll som tidigare
monterades/avmonterades villkorligt (`{villkor && <Knapp/>}`, prövad med
`toHaveCount(0)`) blir efter fixen ALLTID monterad. `toHaveCount(0)` går då
från sann till falsk — inte för att fixen är fel, utan för att kontrollen nu
FINNS i DOM (bara dold). Rätt prövning efter en sådan omläggning är
`not.toBeVisible()` (Playwright räknar `visibility: hidden` som osynligt),
inte ett antal-påstående. Ett test som fortsätter påstå `toHaveCount(0)`
efter denna klass av fix kommer att fälla — inte som en regression i koden,
utan som ett kontrakt som inte längre stämmer med den nya, medvetna
DOM-formen.

**Skarpbevisat i båda riktningar** (negativ kontroll, TASK-309.23): samma
nya testfil kördes både mot den ofixade komponenten (föll — verklig
höjdskillnad mätt, `familjValjare(page)` existerade inte alls) och mot den
fixade (grön). Att bara köra grönt bevisar inte att grinden fäller när den
ska; en tillfällig `git checkout -- <fil>` av enbart komponentfilen (testet
orört) är en billig, mekanisk väg att bevisa båda hälfterna innan man litar
på en ny regressionsvakt.

Instans: `TASK-309.23`, 2026-08-26 (`DokumentYta.tsx`s uppladdningsdialog).

*Konsoliderad ur `tasks/lessons.d/reservera-plats-for-interaktiva-kontroller-kraver-inert-inte-bara-invisible.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L564 — Staging-preflightens bypass måste matchas mot körningens blast-radie, inte bara "behöver jag staging just nu"

TASK-309.22 review-runda 1 (2026-08-26), miranon-media-admin · `tests/support/staging-preflight.ts` (TASK-77)

`[UNIVERSAL]` **för alla spokes med samma staging-preflight-mönster.**

**Vad som gjordes:** en aktiv merge-kö landade PR efter PR under hela
verifieringspasset, och `kravStagingLedigt` fällde varje `test:api:staging`-
körning med "CI HÅLLER STAGING". Efter att ha väntat ut TVÅ på varandra
följande `post-merge.yml`-körningar (den andra köades bakom den första —
ingen naturlig lucka i sikte) gjorde jag ett medvetet, dokumenterat val:
`MM_STAGING_PREFLIGHT=off` för EN smal, självstädande staging-test-fil
(en uppladdning + en nedladdning + en radering, ~15 sekunder).

**Vad som INTE borde ha gjorts, men gjordes ändå:** samma bypass
återanvändes strax därefter för HELA `npm run test:api`-sviten (api-pure +
api-staging, ~4 minuter, dussintals fixturer, hundratals Airtable-anrop)
— av bekvämlighet, inte av ett nytt aktivt övervägande.

**Vad som hände:** 7 test föll, spridda över SEX helt orelaterade filer
(`get-registrations`, `save-place-standard`, `update-record`,
`send-registration-confirmation`, `skapa-om-event-bilaga`,
`generate-event-attachment`) — ingen av dem rörd av denna skivas diff.
`gh run list --workflow=post-merge.yml` bekräftade EFTERÅT att CI:s EGET
post-merge-jobb var `in_progress`/landade under exakt samma fönster och
rapporterade `success` när det var klart — den delade Airtable-basen togs
alltså ALDRIG till ett trasigt läge, men min LOKALA körning läste ett
ögonblick där CI:s körning och min konkurrerade om samma rader.

**Kontrollmätningen:** när merge-kön lugnat sig (`bash scripts/
staging-semaphore.sh preflight verify-check` → "PREFLIGHT OK", INGEN
bypass) gav OMKÖRD `npm run test:api` bara de TVÅ redan kända,
förklarade flaken (2 fel, 1192 av 1194 gröna) — inte de sju.

**Generalisering:** preflightens dokblock kallar bypassen "ETT AKTIVT
VAL", och det ÄR legitimt — men "aktivt" betyder ett övervägande PER
ANROP, inte en engångs-tillåtelse som sedan appliceras på nästa, mycket
BREDARE operation. En smal, self-cleaning enstaka-test-körning mot en
gemensam fixtur bär en helt annan kollisionsrisk än en fullständig svit
som rör dussintals delade fixturer samtidigt CI gör detsamma. Regel att
följa: bypassa ALDRIG en bredare operation bara för att en smalare redan
bypassades utan att omvärdera blast-radien — och verifiera ALLTID
`staging-semaphore.sh preflight` (eller vänta ut kön) INNAN en bred
körnings resultat rapporteras som pålitligt facit.

*Konsoliderad ur `tasks/lessons.d/staging-preflight-bypass-blast-radie-matchar-omfattningen.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L565 — Svensk apostrof i en `.purge-staging-policy.json`-notruta trigger listparitet-grinden

TASK-309.22 (2026-08-26), miranon-media-admin · `scripts/check-listparitet.sh`

`[UNIVERSAL]`

**Vad som antogs:** att ett fritt formulerat, förklarande `_TASK-nnn`-notfält
i en ny purge-target (samma mönster som `generate-event-attachment-sentineler`
redan bär) var fritt att skriva prosa i, så länge JSON:en var giltig.

**Vad som faktiskt hände:** `npm run check:docs` föll på paret
`sentinel-markorer` — grinden extraherar VARJE `'...'`-sekvens ur HELA
`.purge-staging-policy.json` (inte bara ur `filterByFormula`/
`exactMatchPattern`) och kräver en motsvarande backtick-kodspan i
`CONTRIBUTING.md`. Min förklarande prosa innehöll dels en possessiv-apostrof
(`upload-attachment.staging.test.ts's sentinel-formel…`), dels ett citerat
filnamn omslutet av raka enkelcitat (`EXAKT '2025-HörlurarMiranonMedia.pdf'`)
— fem apostrofer totalt, ett udda antal, vilket fick regexen att para ihop
GODTYCKLIGA textsnuttar mellan dem som om de vore markörer. Tre falska
"markörer" rapporterades, ingen av dem en verklig sentinel-sträng.

**Varför det inte syntes i den befintliga `generate-event-attachment-
sentineler`-noten:** den noten råkar ENDAST använda enkelcitat runt de TVÅ
faktiska markör-strängarna (`'Bekräftelsebilaga –'`/`'Deltagarinformation –'`)
och undviker possessiv-apostrofer helt — inte av uttalad regel, utan av
skrivvana. Grinden såg alltså aldrig detta fall förrän en fri-prosa-not med
apostrofer i BÅDA rollerna (possessiv OCH citattecken) skrevs.

**Hur det löstes:** skrev om noten till att helt sakna raka enkelcitat —
possessiv via `:s` (samma svenska tekniska konvention som `EF:ens`/`CLI:ts`
redan använder i repot) och citerade strängar utan citattecken alls (kontext
gör det tydligt). Den FAKTISKA sentinel-markören (`ZZ-attachment-filename-
test-`, i `filterByFormula`) fick sin egna backtick-motsvarighet tillagd i
`CONTRIBUTING.md`s sentinel-markörer-stycke, enligt paritetsgrindens krav.

**Generalisering [UNIVERSAL för alla spokes med samma
`check-listparitet.sh`-mönster]:** ett fritt-text-notfält i EN sida av ett
`sentinel-markorer`-liknande listparitetspar är INTE fritt från grindens
teckenklass bara för att det "bara är en kommentar" — grinden läser rå text,
inte JSON-semantik eller fältnamn. Skriv sådana noter helt utan raka
enkelcitat (`'...'`); använd backticks eller ingen quotering alls. Kör
`npm run check:docs` (eller minst `bash scripts/check-listparitet.sh`)
INNAN push så en spridd apostrof upptäcks lokalt, inte i CI.

*Konsoliderad ur `tasks/lessons.d/svensk-apostrof-i-purge-policy-prosa-later-listparitetsgrinden-falsklarma.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L566 — En brytpunkt satt mot ett elements EGEN renderade bredd är inte samma sak som viewportens bredd

**En "desktop"-viewport (1280 px) ger inte en "desktop"-bred `<ul>`. Sidolayout
(sidnav, kortpadding, max-width-kolumner) smalnar av innehållet långt under
viewportens siffra — ett breakpoint-villkor som antar `elementBredd ≈
viewportBredd` väljer fel gren utan att fela synligt förrän någon läser talet.**

Mätt i TASK-309.24 (runda 2, 2026-08-26): en fallback-konstant skulle välja
mellan ett "desktop"- och ett "mobil"-värde baserat på `<ul>`s egen
`getBoundingClientRect().width`, med en gissad brytpunkt på 640 px (husets
`sm:`-tröskel). Den föll skarpt i ett acceptance-test: vid `acceptance`-
projektets 1280×720-viewport var `<ul>`s FAKTISKA renderade bredd bara
**502 px** — under 640 — så koden valde MOBIL-konstanten (155) på ett
skrivbordsfönster (622 px i stället för väntade ~400). Vid en riktig 375 px-
viewport var `<ul>`-bredden **277 px**. Brytpunkten flyttades till 400 (mitt
emellan de två UPPMÄTTA värdena) efter att båda faktiskt lästs av — inte
efter en ny gissning på ett "rimligare" tal.

`[UNIVERSAL]` Ett CSS-breakpoint-villkor i JS/TS som läser ett ELEMENTS
egen bredd (`getBoundingClientRect().width`, `clientWidth`) ska ALDRIG
jämföras mot ett Tailwind-/media-query-tal (`sm:`, `md:` …) rakt av — de två
talen mäter olika saker (elementets innehållsyta vs. hela viewporten). Mät
elementets FAKTISKA bredd i de verkliga scenarier villkoret ska skilja åt,
innan brytpunkten sätts — en gissning som "låter rimlig" (640 för `sm:`) är
precis den typ av antagande som ser korrekt ut tills ett test kör det.

*Konsoliderad ur `tasks/lessons.d/ul-bredd-vid-viewport-ar-inte-viewportbredden.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L567 — Worktree-isoleringens "för komplex att verifiera"-avvisning nätar även kommandon som inte rör git alls

**Avvisningen `"This command is too complex to verify that it stays inside
the worktree"` triggas inte bara av git-omdirigering (`-C`, `cd && git …`) —
den triggas även av rena, git-fria kommandon som bär ETT sammansatt
skal-mönster: flera satser separerade med `;`/`&&`, eller en
kommandosubstitution `$(...)`. Ett kommando med noll git-innehåll blockeras
ändå, med SAMMA text som git-fallet.** `[UNIVERSAL]`

Instans (TASK-309.19, 2026-08-26), TVÅ separata triggerformer mätta samma
session:

1. `mkdir -p <dir> && SCRATCH=<path> && cd <worktree> && npx @biomejs/biome
   check . > "$SCRATCH/fil.txt" 2>&1; echo "EXIT:$?" | tee -a ...` —
   AVVISAD. Rimlig hypotes: `cd`-token i en sammansatt kedja.
2. Efter att `cd` togs bort helt: `npm run bl -- task edit 309.19
   --append-notes "$(cat /path/till/fil.txt)" --plain` — ETT enda
   kommando, INGEN `cd`, INGET git-anrop över huvud taget (backlog-CLI:t är
   ett Node-skript) — AVVISAD ÄNDÅ, med identisk feltext. Nyckeln kan alltså
   inte vara `cd` eller git specifikt: kommandosubstitutionen `$(...)`
   räcker ensam.

Båda löstes genom att dela upp i separata, enkla Bash-anrop: skriv till fil i
ETT anrop, läs/referera filen i ETT SEPARAT anrop utan `$(...)`, eller (för
lång textinmatning) klistra in bokstavlig flerraders-text direkt som
argumentsträng i stället för att läsa den via en subshell.

**Detta breddar, det motsäger inte, CLAUDE.md § "Worktree-isoleringens gräns
går vid EGET REPOS huvudkatalog"** — den sektionen dokumenterar korrekt att
avvisningen skiljer VAD den stoppar (git mot huvudkatalogen) från VARFÖR
(ett kommando "too complex to check" faller oavsett mål, citerat redan där ur
`code.claude.com/docs/en/sub-agents.md`). Det som inte stod där: mängden
"too complex to check" är bredare än git-relaterade kommandon — den täcker
generella skal-komplexitetsmönster (sammansatta satser, subshells) även när
kommandot aldrig rör vid git. En agent som ser avvisningen och antar "det
måste vara ett git-problem" felsöker fel lager och kan slösa flera turer på
att leta efter ett `-C`/`cd`/`GIT_DIR` den aldrig skrev.

**Praktisk regel:** stöter en worktree-isolerad agent på denna avvisning för
ett kommando UTAN synligt git-innehåll — misstänk `;`/`&&`-kedjan eller
`$(...)` FÖRST, inte en dold git-sökväg. Fixen är alltid densamma: dela upp i
fler, enklare Bash-anrop.

*Konsoliderad ur `tasks/lessons.d/worktree-git-guardens-for-komplex-avvisning-natar-icke-git-kommandon.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L568 — En tät återkopplingsslinga är fas 1 — även när "det bara är en PDF"

**Kontext:** S108, 2026-08-27, TASK-309.27.

En mall-ändring i bekräftelsebilagan kostade ~45 minuter per varv. Kedjan gick
`ändra CSS → synka till EF-lagret → supabase functions deploy → anropa →
hämta PDF → mät`. Mätt utfall av den formen: `generate-event-attachment` gick
**v37 → v49 under EN mätserie** — tolv deploys av en molnfunktion för att
titta på tolv PDF:er.

Marcus ifrågasatte hela arbetssättet: *"VARFÖR tar det sådan tid att fixa
PDF:er? Håller proffs också på så här där varje liten trivial ändring i en PDF
ska ta 30-45 min?"* Svaret var nej.

DocRaptor är ett vanligt HTTP-API. Alla bitar fanns redan i repot
(`render-bilage-mall.mjs` fyllde mallen, `docraptor-sjalvbarande.mjs` bakade in
CSS/typsnitt/bilder, nyckeln låg i `.env.docraptor`) — det som saknades var
~40 rader lim. `docraptor-sjalvbarande.mjs` hänvisade till och med i sin egen
filkommentar till en `docraptor-minimaltest.mjs` som **aldrig byggdes**.

Med loopen (`npm run mall:pdf`, ~5 s) föll fyra hypoteser på tjugo minuter och
avslöjade rotorsaken: Prince saknar `align-self: stretch` för flex-items i
row-containers, och mallen låg mitt i luckan. Bilagan hade blivit **två sidor
oavsett innehåll** — 141 ord på sida 1 med 161 mm tomt under.

**Lärdomen:** `diagnosing-bugs` § fas 1 säger "bygg en tät, röd-kapabel
återkopplingsslinga FÖRE du försöker lösa något". Det steget hoppades över för
PDF-spåret därför att problemet lät litet — "bara en marginal". Kostnaden blev
synlig först när någon räknade deployarna.

Fråga vid varje spår som känns segt: **hur lång är slingan, och vad kostar ett
varv?** Är svaret minuter i stället för sekunder är det slingan som ska byggas
först, inte nästa hypotes.

Sidofynd som gjorde tolv deploys till en mätserie i stället för en insikt: den
mätserien mätte en flexbox-bugg. "Knivseggen" (varje 0,25 mm knuffar till två
sidor) och den icke-monotona padding→sidantal-kurvan var **symptom**, inte
egenskaper hos dokumentet.

*Konsoliderad ur `tasks/lessons.d/en-tat-aterkopplingsslinga-ar-fas-1-aven-for-pdf.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L569 — Verifiera vad en PR faktiskt innehåller — mot fjärren, inte mot din avsikt

**Kontext:** S108, 2026-08-27, PR #2024.

Ett bakgrundsjobb körde `git checkout main` medan arbete pågick i
arbetsträdet. Nästa commit hamnade därför på **lokal main** i stället för på
grenen. Grenen pushades oförändrad, och PR:ens titel och kropp — som jag skrev
utifrån vad jag *hade gjort* — påstod en säkerhetsfix (`fetMarkera`, ny fil,
12 tester) som inte fanns i diffen.

Review-agenten fångade det och satte `risk: hog` med rätt motivering: en
olöst regression hade annars bokförts som åtgärdad, via titel och
commit-historik. Den verifierade via tre oberoende källor (`gh pr diff`,
`gh api pulls/files`, `gh api compare`) plus `git grep` mot både `origin/main`
och PR-huvudet.

**Två lärdomar:**

1. **Låt aldrig ett bakgrundsjobb byta gren medan arbete pågår.** Jobbet var
   välmenande — det skulle förbereda en prod-deploy genom att checka ut `main`
   när en PR landat. Men det körde mitt i en redigering. Ett väntejobb får
   observera; det får inte mutera arbetsträdets tillstånd.

2. **PR-beskrivningen ska skrivas mot diffen, inte mot minnet av arbetet.**
   Efter push: `gh api repos/.../pulls/<nr>/files --jq '.[].filename'` och
   jämför med vad du påstår. Det är två sekunder och fångar hela felklassen.
   Samma `ADR-083`-disciplin som gäller prosa i repot gäller PR-kroppar: en
   beskrivning som påstår något som inte finns är värre än ingen beskrivning.

**Formen som räddade oss** var att granskningen kördes i FÄRSK kontext av en
agent som inte litade på min beskrivning (`ADR-105` beslut 2). En granskare som
delat kontext med mig hade sannolikt läst PR-kroppen som sanning.

*Konsoliderad ur `tasks/lessons.d/verifiera-pr-innehallet-mot-forjarren-inte-mot-avsikten.md` (S108 K-sista, fragment-vägen `ADR-081`); fragmentet är borttaget.*
