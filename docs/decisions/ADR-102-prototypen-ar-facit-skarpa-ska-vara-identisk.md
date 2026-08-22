# ADR-102: Prototypen ÄR facit — skarpa bygget ska vara identiskt, och prototypen rivs först efter Marcus godkännande

- Status: Accepted (Marcus-order 2026-08-07, S93 Del 11)
- Datum: 2026-08-07
- Fas: Session 93, PRD `TASK-145`/`TASK-146`

> **Amendering (2026-08-08, S93 sjunde resumen — grillad samsyn Del 12,
> `ADR-103`):** **B4:s sekvens är ERSATT av promoveringsordningen** i
> `ADR-103` B2 — steg 1 ("skarpa görs identisk") var ett återbygge, och
> återbygget är avskaffat: prototypens form PROMOVERAS (villkoret flippas,
> skarpas datavägar behålls), Marcus granskar, godkänner, och FÖRST DÅ rivs
> flaggan/variant-koden — aldrig formen. B1 står orörd och FULLBORDAS av
> promoveringsformen; B2:s identitetskrav uppfylls numera strukturellt
> (en artefakt kan inte divergera från sig själv); B3:s spärr står orörd
> och vaktar promoveringsordningens steg 4; B5:s AC-form ersätts i
> praktiken av promoverings-AC med bevis-loop (`ADR-103` B4).
> Facit-bilderna byter roll från spec till REGRESSIONSSTÖD. Beslutstexten
> nedan bevaras oförändrad (immutabilitet). Bakgrund: fyra-axlars-auditen
> fann att rotorsakerna R1–R6 i allt väsentligt är symptom på
> översättningskedjan prototyp→bilder→AC→agent, och att formen
> "konvergens till slutform + samlokalisering + återbygge + PNG-spec"
> saknar branschprecedent — se
> `docs/research/processaudit-syntes-och-grillningsunderlag-2026-08-08.md`
> Del 5.

## Kontext

Marcus ord som utlöste beslutet, verbatim:

> *"INGEN prototyp raderas förens jag godkänt att det skarpa bygget är EXAKT
> som prototypen."*

och

> *"Prototypen ÄR facit, finns ju inget annat som skulle kunna vara facit.
> Prototypen och skarpa version ska vara IDENTISKA det är ju för tusan hela
> poängen med att bygga en prototyp."*

Bakgrunden är att eventsidans ombyggnad (`TASK-145`, sex skivor) landade en
skarp yta som **inte** är identisk med den prototyp Marcus låste som facit
2026-08-06 (*"Jag är nöjd. Lås som facit."*). Divergensen upptäcktes först när
Marcus ifrågasatte varför ett designval ens var en fråga.

**Den mätta divergensen**, `src/components/events/EventDetail.tsx` rad 284–290:

```tsx
{isHallplatsVariant(variantParam) ? (
  <AtgarderKort />            // prototypen: EN knapp, "Gå till åtgärder"
) : (
  <Atgarder eventId={eventId} />   // skarpa: den gamla listan
)}
```

Prototypen bär Marcus order från 2026-08-05 (*"Åtgärdsgruppen högst upp måste
in på åtgärdssidan… en likadan 'knapp' som 'Gå till check-in' som heter 'Gå
till åtgärder'"*), citerad ordagrant i `Atgarder.tsx` § `AtgarderKort`. Den
skarpa vyn bär den inte. En agent landade dessutom ett **tredje** läge — fyra
rader rivna och omnumrerade — som varken är prototypen eller det passerade
utgångsläget.

### Rotorsakerna — samtliga mätta 2026-08-07

**R1. Facit försvinner i skill-kedjan.** Facit-bilderna föds i
prototyp-passet. Räknat i plugin `marcus-system@1.29.0`:

| Skill | Riktiga omnämnanden av facit/bild/screenshot |
|---|---|
| `/to-prd` | **0** (enda grep-träffen är ordet *"förebilder"*) |
| `/to-issues` | **0** |
| `/do-work` | **0** |

Kedjan `prototyp → /to-prd → /to-issues → agent` tappar facit i första
översättningen och återfår det aldrig. Skillen som SKRIVER acceptanskriterierna
vet inte att bilderna existerar och kan därför inte peka på dem.

**R2. Acceptanskriterierna beskriver problem i stället för mål.** Följden av
R1. `TASK-145.5` AC #4 lyder *"Åtgärds-radernas grå löften är hanterade"* — en
problembeskrivning. Den säger vad som är fel, aldrig hur ytan ska bli. En
mottagare som löser den beskrivna defekten kan landa godtycklig form och ändå
uppfylla kriteriet bokstavligt.

**R3. Facit-granskningen är en bock utan spärr.** DoD-posten *"Design-review
mot S93:s FACIT-bilder (ej S73-facit); avvikelser bokförda öppet"* stod
**okryssad** på BÅDA de landade skivorna (`TASK-145.3` `#929`, `TASK-145.5`
`#933`) — och båda landade gröna. Ingen mekanism i huset fäller en skiva vars
facit-granskning uteblivit. Samma `ADR-083`-klass som resten av repot bekämpar:
en text som utlovar en täckning ingen mekanism håller.

**R4. Facit går att förväxla med icke-facit.** `tasks/sessions/bilagor/s93-hallplats-prototyp/`
innehåller tretton `.png` i EN katalog, utan åtskillnad annat än ett prefix:

| Mönster | Datum | Status |
|---|---|---|
| `konvergens-a-*.png` | 2026-08-05 | passerat mellansteg, **före** låsningen |
| `facit-*.png` | 2026-08-06 | **låst facit** |

Elva iterationsvågor (10–20) ligger mellan dem. Förväxlingen är belagd skarpt:
orkestreraren öppnade `konvergens-a-markera-atgarder.png`, kallade den facit
inför Marcus, och byggde en slutsats på den — tjugo minuter efter att ha
beskrivit exakt den felklassen för honom, och en dag efter att själv ha skrivit
lärdomen `tasks/lessons.d/uppdragets-kallmarkning-maste-avse-gallande-text.md`
(*"Föråldrat citat som gällande facit"*). **Att lärdomen fanns nedskriven
räckte inte** — vilket är hela argumentet för att facit måste bäras av en
mekanism, inte av minne.

**R5. Facit-täckningen är ofullständig och det syns inte.** Det finns
`facit-*.png` för anteckningar, betalningar (×2) och gruppdynamik — **ingen för
åtgärds-ytan**. Ingenting deklarerar vilka ytor som HAR låst facit, så en
frånvaro är omöjlig att skilja från ett förbiseende.

**R6. "Frågan är besvarad" är odefinierat.** `/prototype` föreskriver *"radera
eller absorbera när frågan är besvarad"* (SKILL.md rad 138, throwaway-kontraktets
klausul iv) utan att definiera villkoret som *"Marcus har jämfört skarpa mot
prototypen och godkänt"*. Följden: rivningen schemalades som en vanlig skiva
(`TASK-145.6`) i beroendekön i stället för som en spärr efter godkännande.

**R7. Prototyp och skarpa delar kod i samma filer.** Mätt över
`src/components/events/`: **sju filer**, ~106 grenar på
`isHallplatsVariant`/`protoAktiv`/`protoDataMode`/`variantParam`.

| Fil | Träffar |
|---|---|
| `detail/Betalningar.tsx` | 44 |
| `detail/Deltagare.tsx` | 21 |
| `detail/Anteckningar.tsx` | 14 |
| `detail/Gruppdynamik.tsx` | 10 |
| `detail/Belaggning.tsx` | 10 |
| `EventDetail.tsx` | 4 |
| `atgarder/AtgardsSida.tsx` | 2 |

Formen valdes medvetet (`ADR-074`, växlar-standarden) för att Marcus ska kunna
växla live och jämföra. Priset är att rivning är riskabel: `protoAktiv`
defaultar till `false` (`Betalningar.tsx:424`, `:555`), så att enbart ta bort
propen flippar betalningsytan tillbaka till skrivbar form — och tre block
(`Belaggning`, `Anteckningar`, `Gruppdynamik`) läser `?variant` oberoende, så
en halv rivning ger blandläge. Priset är också att "identisk" inte kan
verifieras genom att jämföra två filer; det kräver jämförelse av två
renderingar.

**R8. Ingen mekanisk jämförelse mellan prototyp och skarpa existerar.** Ingen
grind renderar båda och fäller på skillnad. Den visuella regressionsvakten
(`npm run test:visual`) jämför mot en baslinje som är stale sedan FÖRE `145.1`
— `eventsida-visual-desktop-linux.png` visar `Obekräftade anmälningar`,
accordion-paret och ett eget Betalningar-block, alltså en sida som inte längre
finns. `*-darwin.png` är gitignorad (`.gitignore:97`), så posten kan bara
betalas ur en CI-artefakt.

**R9. Skivsnittet följde funktionsytan, inte facit.** `145.1` och `145.3` såg
ut som två skivor men var en gren i koden (`Deltagare.tsx:1652` + `:2103`).
Åtgärds-ytan fick ingen egen skiva alls — den hamnade som en delmening i
`145.5` AC #4. En yta som skiljer sig från facit måste ha en skiva som ÄGER
den, annars finns ingen post där avvikelsen kan upptäckas. Besläktat fragment:
`tasks/lessons.d/skivning-provas-mot-kodens-kopplingar-inte-mot-funktionsytan.md`.

## Beslut

**B1. Prototypen ÄR facit.** När ett konvergens-pass avslutats med Marcus
låsning är den låsta prototypen den auktoritativa beskrivningen av ytan —
överordnad varje AC-text, skärmbild eller prosabeskrivning som säger något
annat. Vid motsägelse mellan prototyp och kravtext vinner prototypen, och
kravtexten är buggen.

**B2. Skarpa bygget ska vara IDENTISKT med prototypen.** Inte "likvärdigt",
inte "i samma anda". Avsteg är tillåtna endast som ett uttryckligt, bokfört
Marcus-beslut — aldrig som en agents eller orkestrerares tolkning.

**B3. Prototyp-kod rivs ALDRIG före Marcus godkännande.** Villkoret för
rivning är att Marcus sett skarpa och prototypen bredvid varandra och sagt att
de är identiska. Detta ersätter `/prototype`-skillens odefinierade *"när frågan
är besvarad"* för UI-grenen. En rivnings-skiva får inte schemaläggas som en
vanlig beroendepost i kön.

**B4. Ordningen är omvänd mot vad som skedde.** Rätt sekvens:

1. Skarpa görs identisk med prototypen
2. Marcus jämför sida vid sida
3. Marcus godkänner
4. **Först då** rivs prototyp-substratet

**B5. En yta med låst facit ska ha AC som PEKAR på facit**, inte beskriva en
delförändring. Formen är *"ytan är identisk med prototypen i läge X"*, inte
*"defekt Y är hanterad"*.

## Konsekvenser

- `TASK-145.6` (prototyp-substratets rivning) är **blockerad** tills B3:s
  villkor är uppfyllt. Kortet får inte plockas som en vanlig ready-for-agent-post.
- Eventsidans skarpa yta är i känt avvikande läge mot facit. Avvikelserna måste
  kartläggas och åtgärdas innan godkännande kan ges; åtgärds-ytan är den enda
  hittills BELAGDA, men frånvaron av en fullständig jämförelse (R8) betyder att
  listan inte kan antas vara komplett.
- R1–R6 kräver ändringar i hub-pluginets skills (`/to-prd`, `/to-issues`,
  `/prototype`) och i spokens DoD-mall. De är **inte** utförda av denna ADR —
  den slår fast principen; mekaniseringen bokförs separat och ska inte
  förväxlas med att problemet är löst.
- R7 rivs inte retroaktivt. Den delade formen är `ADR-074`:s medvetna val och
  bär ett verkligt värde (live-jämförelse). Beslutet här ändrar bara NÄR
  rivningen får ske, inte HUR prototypen byggs.

## Vad som INTE beslutas här

- **Om variant-formen ska överges för framtida prototyper.** R7 beskriver dess
  pris, men alternativet (separata filer/routes) har en egen kostnad —
  jämförelsen blir svårare, inte lättare — och kräver en egen avvägning mot
  `ADR-074`.
- **Hur den mekaniska prototyp-mot-skarp-jämförelsen (R8) ska byggas.** Att den
  BEHÖVS följer av B2; formen är ospecificerad.
- **Vad facit är för ytor som saknar `facit-*.png` (R5).** För åtgärds-ytan har
  Marcus svarat att prototypen gäller. Generellt förblir frågan öppen.

## Updates

### 2026-08-22 — Amenderings-mekaniken för ett STÄMPLAT facit (`T157`)

Beslutstexten B1–B5 ovan står orörd. Denna post BEGRÄNSAR den: den säger när
ett redan stämplat facit får ändras, av vem, var bokföringen bor och hur den
ändringen fångas mekaniskt. Kanonisk tråd:
[`T157`](../../tasks/threads/T157-adr-102-saknar-amenderings-mekanik-for-stamplat-facit.md).

**Varför en amendering och inte en ny ADR.** ADR-baren (`~/.claude/CLAUDE.md`
§ ADR-BAR) håller för själva beslutet — svårt att återställa i koherens,
överraskande utan kontext, resultat av en verklig avvägning — men baren avgör
om ett BESLUT ska bokföras, inte var det ska bo. Hemvisten avgörs av
sanningshierarkin (`ADR-100` §1): exakt en auktoritativ källa per
kunskapsklass. Regeln nedan LÄSER `ADR-102` B1 och B5 och kan inte förstås
skild från dem — en egen ADR hade delat en och samma kunskapsklass ("vad
facit är och när det får ändras") på två dokument, vilket är precis den
splittring `ADR-100` finns för att förhindra. Grannbesluten är redan skivade
så: `ADR-103` äger vägen IN (promoveringen), `ADR-104` äger STÄMPELN
(kanalseparationen), `ADR-102` äger facit-principen. Vad som händer med ett
stämplat facit efteråt hör till den tredje, inte till en fjärde. `ADR-124` är
därmed inte mintad — nästa lediga nummer är oförbrukat.

**Vad som var oskrivet.** `ADR-102` reglerar hur man BYGGER mot ett facit och
när prototypen får rivas; `ADR-103` reglerar vägen in. Mellan dem fanns ett
hål: en godkänd yta kunde inte utvecklas vidare utan att någon bröt ett lås,
och ingen text sade vem som fick göra det eller hur. Kostnaden är mätt, inte
befarad — S109 fick **två instanser på ett dygn** av samma handling (en agent
uppdaterade `ariaSnapshot`-referenser i samma commit som en formändring) och
avgjorde dem åt olika håll, korrekt, men enbart på orkestrerarens omdöme:

| | `#1715` (`TASK-286.2`) | `#1730` (`TASK-285.8`) |
|---|---|---|
| Facit-läge | `godkand: {av: marcus, 2026-08-10}` | `godkand: null` |
| Utfall | STOPPAD — en agent skriver om ett **stämplat** facit | armerad — en **ogodkänd** form ändras av sin egen skiva |

Ingen grind fällde i något av fallen. Källa:
`tasks/sessions/2026-08-20-session-109.md` § Del 12 avsnitt B (landad i
`2ce6c36c`) samt kommentaren på `#1715`.

#### A1. Tre klasser av facit-ändring

| Klass | Läge | Vad som krävs |
|---|---|---|
| **(a)** | `godkand: null` — ett ogodkänt facit ändras av sin egen skiva | **Fri ändring.** Referenserna MÅSTE få uppdateras: annars går promoverings-grinden (`ADR-103` B4) röd på en legitim ändring och kortet kan inte landa alls. Ingen bokföring. |
| **(b)** | `godkand` satt, **formen oförändrad**, ändringen är en artefakt (fixtur, rendering, miljö) | En **amenderings-SIDOFIL** bredvid manifestet (A3). Stämpeln behålls. **Ingen ny granskning, ingen omstämpling.** |
| **(c)** | `godkand` satt och **formen ändras faktiskt** | Samma sidofil, men den lämnar **omstämplingen till Marcus** egen kanal (`ADR-104` § Beslut 2). **En agent avgör detta ALDRIG själv.** |

Klass (b) är formen Marcus valde för `#1715` 2026-08-22 (väg B: referenserna
uppdateras, stämpeln behålls, ändringen bokförs öppet). Klass (c) är formen
han valde för `TASK-283`-instansen 2026-08-21 (väg A, additiv amendering).
Regeln rymmer båda — skillnaden mellan dem är inte procedur utan klass.

#### A2. Klassningens bar — mekanisk där den kan vara det, uppåt där den inte kan

**Steg 1, (a) mot (b)/(c): MEKANISKT, inget omdöme.** Frågan är enbart om
manifestets `godkand` är null, och den avgörs på två oberoende ställen:
`ADR-104`-hooken (som fryser ett stämplat manifest, se A6) och
`scripts/check-facit.sh` invariant (d) (som hoppar över hash-jämförelsen för
ett ogodkänt manifest och fäller för ett stämplat). Det var exakt den gräns
S109 fick dra för hand två gånger.

**Steg 2, (b) mot (c): INTE mekaniserat — testet är skrivet, domen är
mänsklig.** Testet:

> **Påverkar ändringen vad en användare ser i prod?**

- **Nej, och du kan säga varför med en MÄTNING** ⇒ klass (b).
- **Ja** ⇒ klass (c).
- **Osäkert** ⇒ klass (c). **Osäkerhet eskalerar uppåt, aldrig nedåt.**

Två skärpningar, båda ur `#1715`:s egen analys:

1. Skiljer sig referensen från prod endast för att **testfixturen** skiljer sig
   från prod, är det klass (b). Mätt exempel: `button "Ladda fler"` föll bort
   ur referensen därför att fixturvärlden bär 17 personer och `PAGE_SIZE` är
   50; i prod (559 personer) finns knappen kvar.
2. **Tar ändringen bort eller döper om en nod som finns i prod, är det klass
   (c)** — även när borttagningen ser harmlös ut. En stämpel som intygar en
   form referensen inte längre innehåller är inte ett mindre problem för att
   skillnaden är liten.

**Baren för klass (b) är att motiveringen SKRIVS NED med sin mätning**, i
sidofilens avvikelse-avsnitt (A3). Kan den inte formuleras i en mening med ett
mätt stöd, är klassningen inte gjord — och då gäller klass (c). Det är
skillnaden mellan ett omdöme som kan granskas och ett omdöme som bara ägde rum.

**Vem bär klassningen.** En agent FÖRESLÅR klass och skriver motiveringen; den
bärs sedan av granskningen (orkestrerarens diff-granskning, och Marcus för
klass (c)). En agent stämplar aldrig om på egen hand — samma spärr `ADR-104`
redan bär för stämpeln själv, nu uttryckligen även för det stämpeln attesterar.

**Regeln prövad retroaktivt mot båda S109-instanserna:** `#1730`
(`godkand: null`) ⇒ klass (a) ⇒ armera, korrekt. `#1715` (stämplat, ingen
prod-synlig skillnad, mätt) ⇒ klass (b) ⇒ sidofil, stämpeln behålls — vilket
är det Marcus faktiskt beslutade dagen efter. Regeln reproducerar alltså båda
utfallen: utan omdöme i det första fallet, med ett SKRIVET omdöme i det andra.

#### A3. Bokföringen bor i en SIDOFIL — och det är inte ett val

**Ett stämplat manifest är agent-fruset i sin helhet.**
`scripts/deny-facit-godkand-skrivning.sh` prövar det simulerade RESULTATET av
en Edit/Write, och varje stämplat manifest har per definition ett satt
`godkand` — alltså nekas även en ändring som inte rör fältet. Bredden är
hookens egen, medvetna design (dess § HELLRE FÖR BRETT ÄN FÖR SMALT) och rivs
inte här. Följden är att en `amendering`-NYCKEL i manifestets JSON inte är en
möjlig form: den kan aldrig skrivas av den som behöver skriva den.

Bokföringen bor därför i en fil bredvid manifestet:

```text
tasks/sessions/bilagor/<pass>/AMENDERING-<ISO-datum>-<slug>.md
```

**Formen är inte uppfunnen här utan MÄTT.** Fem sådana filer fanns redan i
repot när denna regel skrevs — `s55-hem-konvergens` (2026-08-15),
`s93-atgardssida-promovering`, `s102-hem-konvergens` och
`s102-dokument-konvergens` (två stycken, samtliga 2026-08-17) — alla med samma
namnform och samma H1. Mönstret var etablerat i praktiken men **oskrivet**, och
därför gick en agent 2026-08-22 rakt in i hooken i stället för att skriva
sidofilen direkt. Det är den luckan denna post stänger.

**Kanonisk form, destillerad ur de fem** (`✔` = finns i samtliga fem):

| Del | Krav |
|---|---|
| Filnamn | `AMENDERING-<ISO-datum>-<slug>.md`, i samma katalog som `facit.json`. **Mekaniskt prövad.** |
| Rubrik | `# Amendering <ISO-datum> — <vad> (<TASK-id>)`. **Mekaniskt prövad** (utom `TASK-id`, som fyra av fem bär i rubriken och den femte i ett eget `**Pass:**`-fält). |
| Skäl för sidofilen `✔` | Att `facit.json` är agent-fryst, med pekare till `ADR-104` och till denna post. Utan raden ser filen ut som ett godtyckligt anteckningsblad. |
| Yta / berört manifest `✔` | Vilket manifest och vilken `ytor`-post som berörs, med stämpelns datum och citat. |
| Avvikelse `✔` | Vad som ändrades, med Marcus-grunden citerad eller källhänvisad. |
| Klassning | **`(b)` eller `(c)`, utskriven**, med A2:s mätning som motivering. Nytt krav; de fem prejudikaten saknar det, och det är just den saknaden `T157` beskriver. |
| Vad som INTE är amenderat `✔` | Scope-gränsen — "formen i övrigt orörd", eller vilka bilder/lås som nu är en generation bakom. |
| Omstämplings-läge `✔` | Klass (b): stämpeln behålls, ingen omstämpling behövs. Klass (c): "väntar Marcus omstämpling"; `godkand` rörs aldrig av en agent. |
| Referens + hash | När ytan deklarerar `referenser` (A5): sökvägen OCH filens nya `sha256`, i klartext. **Mekaniskt prövad** — det är den raden som gör bokföringen maskinläsbar. |

**Divergens mot uppdraget, bokförd.** Uppdraget till denna post beskrev
amenderingen som en `amendering`-post med fälten `datum`, `beslut`, `skiva`,
`vad`, `varfor`, `ej_omstamplat` INUTI `facit.json`, och bad om kanonisering
mot Marcus första instans i `s90-personlistan-konvergens/facit.json`. Den
formen är strukturellt omöjlig (hooken ovan), instansen landade aldrig i
JSON:en, och prejudikatet var ett annat än uppdraget antog. Formen ovan är
därför kanoniserad mot de fem faktiska sidofilerna. Uppdragets fältuppräkning
överlever som INNEHÅLLSKRAV — `beslut`, `skiva`, `vad`, `varfor` och
`ej_omstamplat` är tabellens rader, uttryckta som prosa-avsnitt i stället för
JSON-nycklar, vilket är vad prejudikaten redan gör.

#### A4. Hur B1 och B5 ska läsas för en yta som växer

**B1 ("vid motsägelse vinner prototypen, och kravtexten är buggen") gäller inom
den låsta formen, aldrig mot en avsiktlig utvidgning av den.** Bokstavligt läst
gjorde B1 varje ny funktion på en låst yta till "buggen" — vilket uppenbart
inte var avsikten, men texten sade det, och en agent som läste den i god tro
landade fel. Gränsen: B1 avgör konflikter mellan prototypen och en kravtext som
beskriver SAMMA form. En utvidgning AV formen är klass (c) och avgörs av
Marcus, inte av B1.

**B5:s AC-form behöver ett X, och för en utvidgning finns det inte förrän facit
amenderats.** Regeln: för klass (a) och (b) är X oförändrat — AC:t pekar på
facit som vanligt. För klass (c) pekar AC:t på facit PLUS den bokförda
amenderingen (*"ytan är identisk med prototypen i läge X, plus amendering
`<datum>`"*), och sidofilen måste finnas innan kortet kan skrivas. Det är samma
enkelriktning som promoverings-grindens egen historik bär: FÖRE-halvan låstes i
egen commit före flippen, just för att den annars inte gick att konstruera i
efterhand.

#### A5. Vad som MEKANISERADES, och hur det bevisades

Hooken skyddar manifestet. Den ser däremot **inte** de filer manifestet
attesterar — och det var precis där båda S109-instanserna gick: en agent skrev
om `.aria.yml` under `tests/visual/__aria__/`, och ingenting fällde.

`scripts/check-facit.sh` har därför fått en **fjärde invariant (d)**: ett
stämplat manifests deklarerade referenser är innehållslåsta. En yta får
deklarera sitt MEKANISKA facit — `ariaSnapshot`-referenserna (`ADR-103` B4),
det som faktiskt låser formen; bilderna är regressionsstöd — som
`referenser: [{ fil, sha256 }]`. Grinden jämför varje deklarerad referens mot
sitt bokförda `sha256`, och accepterar en avvikelse ENDAST om en sidofil i
samma katalog namnger både filen och dess FAKTISKA hash.

Tre egenskaper är värda att namnge, eftersom de följer av varandra:

1. **Hash-jämförelsen gäller bara stämplade manifest** — klass (a) kodad.
2. **Baslinjen kan inte manipuleras bort.** Att ändra `referenser[].sha256`
   kräver en skrivning i manifestet, och den nekas av hooken så snart
   manifestet är stämplat. Hookens "för breda" design är alltså exakt det som
   gör innehållslåset manipulationssäkert — därför måste `referenser`
   deklareras MEDAN manifestet ännu är ogodkänt.
3. **Låset står kvar efter en amendering.** Sidofilen måste bära den faktiska
   hashen, inte bara sökvägen; nästa tysta omskrivning ger en ny hash som ingen
   sidofil bär, och grinden fäller igen.

Tvåsidigt bevis, `scripts/test-check-facit.sh` (28 fall, 46 assertions, exit 0
mätt 2026-08-22; CI-wirad via `ci.yml`s lint-jobb):

| Fall | Läge | Förväntat | Mätt |
|---|---|---|---|
| **T18** | stämplat facit, referensen ändrad, ingen bokföring | **fäller** | exit 1, rätt skäl |
| **T19** | **ogodkänt** facit, SAMMA ändring av SAMMA fil | **släpper** | exit 0 |
| T17 | stämplat facit, referensen oförändrad | släpper | exit 0 |
| T23 | sidofil namnger referensen OCH dess nya hash | släpper | exit 0 |
| **T24** | sidofil namnger referensen men INTE hashen | **fäller** | exit 1 |
| T25 | `amendering` som JSON-nyckel i manifestet | fäller | exit 1, pekar på sidofilen |
| T26 / T27 | sidofil med fel namnform / utan kanonisk rubrik | fäller | exit 1 / 1 |
| T28 | prosa-sidofil utan hashar (de fem prejudikatens form) | släpper | exit 0 |
| T20 / T21 / T22 | referens saknas på disk / fel `sha256`-format / tom `referenser[]` | fäller / fäller / släpper | exit 1 / 1 / 0 |

**T18/T19 är paret som bär hela invarianten**; utan båda bevisar sviten bara
att grinden kan säga nej, inte att den säger nej på rätt sida av gränsen.
**T24 är paret som bär bokföringens värde**; utan det hade en enda sidofil som
nämner en sökväg låst upp filen för all framtid. **T28 bevisar att de fem
befintliga prejudikaten förblir gröna** — regeln är bakåtkompatibel, mätt mot
de fyra som ligger under grindens rot.

**Hookens neka-skäl var missvisande och är skärpt i samma landning.** Fram till
nu sade den alltid *"skulle sätta 'godkand' till ett icke-null-värde"*, också
när skrivningen inte rörde `godkand` alls — vilket skickar den som blir nekad
att leta efter ett fel i sin egen diff som inte finns. Skälet väljs nu utifrån
manifestets NUVARANDE innehåll: är det redan stämplat namnger texten
frysningen och pekar ut sidofilen; sätter skrivningen faktiskt fältet står den
gamla texten kvar. **Verdiktet är oförändrat i båda fallen (exit 2).**
Tvåsidigt bevis i `scripts/test-deny-facit-godkand-skrivning.sh` (40 fall,
exit 0 mätt 2026-08-22): `ED4`/`ED4b`/`WD3` kräver den nya texten OCH att den
gamla INTE förekommer; `ED1`–`ED3`/`WD1`–`WD2` kräver att den gamla står kvar
där den är sann.

#### A6. Vad som INTE mekaniseras här — mätt, inte antaget

`ADR-083` förbjuder prosa som påstår en mekanism som inte finns. Två luckor
står därför utskrivna, och grinden skriver ut den andra vid varje körning.

1. **Klass (b) mot (c) är KONVENTION UTAN SPÄRR.** Ingen grind kan avgöra om en
   formskillnad är prod-synlig, och därmed inte heller om en sidofils klassning
   är sann. Grinden hävdar att bokföringen finns, går att datera och matchar
   filens faktiska innehåll — aldrig att skälet håller. Den domen är Marcus
   öga, precis som `check-facit.sh` redan säger om facit-granskningen i stort.
   A2:s test och eskaleringsregel är den bar som finns.
2. **Täckningen är noll i dag, och det syns.** Nyckeln `referenser` är valfri;
   **22 av 22 stämplade ytor saknar den** (mätt 2026-08-22 med grinden själv).
   `check-facit.sh` skriver ut både antalet låsta referenser och antalet
   odeklarerade stämplade ytor på VARJE körning, så frånvaron aldrig blir tyst
   — samma R5-lärdom som `bilder`-nyckeln bär.

**Varför backfillen inte gjordes här, mätt:** en retroaktiv
`referenser`-deklaration är en skrivning i ett stämplat manifest, och nekas av
hooken. Mätt 2026-08-22, båda riktningarna:

| Prov | Utfall |
|---|---|
| `Edit` mot `s90-personlistan-konvergens/facit.json` (stämplat) som ENBART lägger till en nyckel | **exit 2 — NEKAD** |
| `Edit` mot `s109-meddelandefamiljen-konvergens/facit.json` (ostämplat) som lägger till `referenser` | exit 0 — släppt |

Dessutom namnger bara 4 av 12 manifest sina `__aria__`-sökvägar; för resten
kräver backfillen mätning per yta. Backfillen är alltså ett **Marcus-moment**
(hans kanal skriver manifestet) och bokförs som eget kort.

**Täckningen växer ändå framåt utan att någon fråga behöver besvaras först:**
nya facit-låsningar skapas med `godkand: null`, där hooken släpper igenom, och
`referenser` deklareras då i samma landning som manifestet — se A7.

#### A7. Konsekvenser

- `scripts/check-facit.sh` bär fyra invarianter i stället för tre;
  `scripts/lib/facit-validera.mjs` bär schemat för `referenser`, sidofilernas
  form och hash-upplösningen; `scripts/test-check-facit.sh` bär 28 fall.
- `scripts/deny-facit-godkand-skrivning.sh` ger ett sant neka-skäl och pekar ut
  sidofilen; dess testsvit bär 40 fall.
- `.facit-policy.conf` § REGEL får en syskon-regel: **`referenser` deklareras
  vid facit-LÅSNINGEN**, i samma landning som manifestet skapas — samma
  ändpunkts-disciplin som prototyp-markörerna redan har (`TASK-287`), och nu
  med ett hårdare skäl än deras: efter stämplingen är fönstret stängt av
  hooken, inte bara försuttet.
- `T157` stängs av denna post. Grannfallet i `TASK-247`:s slutrapport (ett
  låst-men-EJ-stämplat facit som amenderas mitt i granskningsfönstret) är klass
  (a) och därmed också besvarat: fri ändring, ingen sidofil.
