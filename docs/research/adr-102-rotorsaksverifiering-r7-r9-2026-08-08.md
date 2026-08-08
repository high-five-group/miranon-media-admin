---
owner: marcus803
updated: 2026-08-08
review_by: 2026-09-08
status: draft
---

# ADR-102 R7–R9 under falsifiering — vad som håller mot koden 2026-08-08

> **Proveniens:** adversarialt verifierings-pass 2026-08-08, uppdrag A2b. Kört
> **oisolerat i huvudkatalogen** mot `main` vid `b39ffa3c`. Hållningen var
> falsifiering: målet med varje mätning var att FÄLLA rotorsaken, inte att
> bekräfta den. **Ingen kod, inget kort och ingen ADR är ändrad av detta pass**
> — enda skrivna filen är denna. Inga sviter kördes (statisk mätning per
> uppdrag); allt nedan är källkod, git och konfiguration.
>
> Styrande beslut: [`ADR-102`](../decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md).
> ADR:ns tal behandlades som HYPOTES tills omräknade ([`ADR-086`](../decisions/ADR-086-uppdragets-premisser-provas-av-mottagaren.md)).

## Vad jag hittade FÖRST — och varför detta pass ändå inte är en dubblett

Inventeringen före första mätningen gav tre överlappande ytor:

| Vad jag läste | Vad det redan täckte | Ålder / skick |
|---|---|---|
| [`eventsidan-prototyp-mot-skarpa-facitkarta-2026-08-07.md`](eventsidan-prototyp-mot-skarpa-facitkarta-2026-08-07.md) | R7:s grenräkning **omklassad** (form vs data), `Betalningar()` som död kod, sex avvikelser A1–A6, prototypens egen drift D1/D2 | 1 dag. **Premisserna håller: `src/` är byte-identiskt sedan dess** (mätt nedan) |
| `ADR-102` självt | R1–R9 som påståenden | 1 dag |
| `tasks/lessons.d/skivning-provas-mot-kodens-kopplingar-inte-mot-funktionsytan.md` | R9:s substans, med de två felen namngivna | 1 dag |

**Vad som därför är NYTT här och inte i facitkartan.** Facitkartan svarade på
*"var skiljer sig de två ytorna?"*. Den prövade aldrig **om ADR-102:s egen text
om sin egen mätning stämmer** — och det är där de flesta fynden nedan sitter:
tre räknefel i R7:s formuleringar, en bärande stödmening i R8 som inte gör det
den citeras för, radreferenser i R9 som var döda redan när ADR:n skrevs, och en
prototypgren som **inte** är DEV-grindad och därmed når produktionsbygget.
Facitkartan noterade ingen av dem. Options-rymderna (uppdragets andra halva)
finns inte i något befintligt dokument.

Ingen ADR förkastar något av det som föreslås nedan; `ADR-074` (växlar-standarden)
och `ADR-076`/`ADR-036` (grindarnas ägarskap) lästes och är förankrade i texten
där de rör en väg.

## Kort svar — domen i klartext

**Alla tre rotorsakernas KÄRNOR håller. Ingen är falsifierad. Men samtliga tre
bär belägg som inte tål prövning, och i två fall pekar den korrigerade
mätningen åt att problemet är STÖRRE än ADR:n säger.**

- **R7 — HÅLLER DELVIS.** Delningen är verklig och tabellen reproducerar exakt
  siffra för siffra. Men *"sju filer"* är åtta, *"~106 grenar"* är 106 **rader**
  (127 förekomster, **6 faktiska form-grenar**), och *"tre block läser `?variant`
  oberoende"* är **fem**. Rivningsrisken håller — och en gren ADR:n inte nämner
  (`EventDetail.tsx:284`) saknar DEV-grind och når därmed produktionsbygget.
- **R8 — HÅLLER i huvudsaken, med en FALSIFIERAD stödmening.** Ingen mekanisk
  jämförelse finns: verifierat. Men den visuella baslinjens föråldring är
  **irrelevant för den slutsatsen** — `toHaveScreenshot` jämför en yta mot sitt
  eget förflutna, aldrig prototyp mot skarpa, så en färsk baslinje hade inte
  fällt en enda av A1–A6. Dessutom är `npm run test:visual` **ingen körande
  vakt**: den instansieras inte i CI alls (`T87` pausad).
- **R9 — HÅLLER.** Substansen är belagd två gånger om, oberoende av ADR:ns egna
  radreferenser (som var döda redan i ADR:ns egen commit). Och luckan är
  **inte historisk**: åtgärds-ytan saknar ägande kort **även idag**.

**Den avgörande delfrågan** är R8:s. Om den visuella baslinjen läses som "vakten
finns men behöver uppdateras" följer en helt annan åtgärd — ta om baslinjen —
än den R8 faktiskt kräver. Ingen baslinje-uppdatering i världen fäller på att
prototypen och skarpa ser olika ut, eftersom baslinjen bara känner till ETT av
de två lägena. `TASK-145.3` DoD #6 och `TASK-145.5` DoD #6 (*"test:visual
omtagen med granskade baslinjer"*) står okryssade och pekar mot just den
felläsningen.

## Metod och dess gränser

Allt nedan är **statiskt**: `git`, `grep`, filläsning och en läst PNG. Uppdraget
förbjöd att köra sviter, och dev-servern på 5173 rördes inte.

**Kalibrering som gör resten trovärdig** — hela `src/` är oförändrad sedan både
ADR:n och facitkartan skrevs:

```console
$ git rev-parse HEAD
b39ffa3c8a6ad0c1fb3580401733679e859a857a
$ git diff --stat e325bfbb..HEAD -- src/     # e325bfbb = ADR-102:s egen commit
                                             # (tomt)
$ git diff --stat 48ce05da..HEAD -- src/     # 48ce05da = facitkartans commit
                                             # (tomt)
```

Varje kodavvikelse nedan är alltså en avvikelse mellan ADR:ns **text** och det
träd ADR:n skrevs mot — inte drift som uppstått efteråt. Skivorna `145.x` hade
redan landat när ADR-102 författades.

**Vad metoden strukturellt inte kan se:** allt som kräver rendering (pixlar,
hover, fokus, utskrift, faktiskt produktionsbygge), och all runtime-verkan. Där
jag drar en slutsats om körning ur källkod är den märkt som **inferens** och
listad under § Vad jag inte kunde belägga.

---

## R7 — "Prototyp och skarpa delar kod i samma filer"

### Påstående (ADR-102 rad 98–119)

Sju filer, ~106 grenar på `isHallplatsVariant`/`protoAktiv`/`protoDataMode`/
`variantParam` i `src/components/events/`, med per-fil-tabell. Rivning riskabel
eftersom `protoAktiv` defaultar `false` (`Betalningar.tsx:424`, `:555`) och tre
block läser `?variant` oberoende.

### Mätning

**(a) Tabellen reproducerar exakt.**

```console
$ grep -rcE 'isHallplatsVariant|protoAktiv|protoDataMode|variantParam' \
    src/components/events/ | grep -v ':0$' | sort -t: -k2 -rn
src/components/events/detail/Betalningar.tsx:44
src/components/events/detail/Deltagare.tsx:21
src/components/events/detail/Anteckningar.tsx:14
src/components/events/detail/Gruppdynamik.tsx:10
src/components/events/detail/Belaggning.tsx:10
src/components/events/EventDetail.tsx:4
src/components/events/atgarder/AtgardsSida.tsx:2
src/components/events/detail/hallplats-steg-prototyp.ts:1
```

Sju av åtta rader är ADR:ns tabell, siffra för siffra. **Den åttonde saknas i
ADR:n** — och den behövs för att summan ska gå ihop: tabellens egna sju rader
summerar till **105**, inte 106. Talet *"~106"* förutsätter alltså den fil
tabellen utelämnar. *"Sju filer"* är **åtta**.

**(b) "Grenar" är fel ord för det som räknats.** `grep -c` räknar **rader med
minst en träff**, inte grenar och inte förekomster:

```console
$ grep -rhoE 'isHallplatsVariant|protoAktiv|protoDataMode|variantParam' \
    src/components/events/ | sort | uniq -c
  15 isHallplatsVariant
  31 protoAktiv
  67 protoDataMode
  14 variantParam        →  127 förekomster på 106 rader
```

Antalet grenar där **ytan faktiskt skiljer sig** är enligt facitkartans
klassning **sex**, och jag spot-verifierade var och en:

| Form-gren | Vad den gör |
|---|---|
| `EventDetail.tsx:284` | `AtgarderKort`+`SkrivUtKort` mot `Atgarder` — **avvikelse A1** |
| `Deltagare.tsx:1271` | `hallplatsMarkeFn` — steg-märket monteras bara i prototypen |
| `Deltagare.tsx:1503` | `markeringKandidatIds` — kandidatmängden (A5/A6) |
| `Deltagare.tsx:1692` | `border-b-0` — avdelaren, **A4** |
| `Deltagare.tsx:1699` | flikarna renderas bara i skarpa — **A2** |
| `Deltagare.tsx:1720` | registrets två former — **A2/A3** |

**106 mot 6 är en faktor ~18.** Kopplings-påståendet håller; magnitud-framing:en
gör det inte. `Betalningar.tsx` bidrar med 44 av "grenarna" och **noll**
avvikelser.

**(c) `Betalningar()` är död kod — bekräftat, och mekaniskt osynligt.**

```console
$ grep -rn "from '.*Betalningar'" src/ tests/
src/components/events/detail/Deltagare.tsx:31:import { BetalningsDetaljer, DetaljRad } from './Betalningar';
```

Modulen exporterar fyra symboler; två importeras. `Betalningar` (`:1193`) och
`BetalningsInnehall` (`:1121`) har noll anropsplatser — `EventDetail.tsx:323–331`
bokför rivningen av toppnivå-blocket (`TASK-145.4`). **Ingen grind ser det:** en
sökning efter `knip` eller motsvarande unused-export-regel i `package.json` och
`biome.json` ger noll träffar. Död kod är alltså inte en mätbar egenskap i detta
repo idag.

**(d) Rivningsrisken håller — spårad hela vägen.** Raderna stämmer:
`Betalningar.tsx:424` (`BetalningsLinje`) och `:555` (`BetalningsPersonRad`) bär
båda `protoAktiv = false`. Kedjan som gör rivningen farlig:

```text
Deltagare.tsx:1923-1926   <BetalningsDetaljer … protoAktiv … />   ← bar prop = true
Betalningar.tsx:996       protoAktiv = false                      ← default om propen tas bort
Betalningar.tsx:671       if (protoAktiv) { return <li>…facit-formen…</li> }
Betalningar.tsx:911, 924  ← fall-through renderar BetalningsLinje
Betalningar.tsx:460-467   <BetalKryss disabled={protoDataMode}    ← false i skarpa
                            onChange={… mutationer.status.mutate({…}) }
```

Att ta bort propen ger alltså ett **aktivt kryss som avfyrar en mutation**.
Nyansering ADR:n inte gör: defaulterna är **fyra**, inte två (`424`, `555`,
`996`, `1124`), och den som bär risken är `:996` tillsammans med monteringen på
`Deltagare.tsx:1926` — inte de två ADR:n namnger.

**(e) Försök till falsifiering av (d): finns en vakt?** Ja — och den räknas
inte. `tests/e2e/mark-paid.staging.test.ts:349` (*"kryssen är ALLTID
inaktiverade — DoD #7"*) hade fällt exakt denna flip. Men:

```console
$ grep -n 'test:e2e:staging' package.json
25:    "test:e2e:staging": "playwright test --project=chromium-authenticated",
$ sed -n '1277,1279p' .github/workflows/ci.yml
    with:
      run_staging: false
```

`test-staging`-jobbet gatas av `inputs.run_staging` (`ci-suite.yml:515`), och
`ci.yml` skickar `false` **villkorslöst**. Vakten finns, körs inte i CI, och
falsifierar därför inte R7.

**(f) "Tre block läser `?variant` oberoende" — det är fem.**

| Fil:rad | DEV-grindad? |
|---|---|
| `Belaggning.tsx:269` | ja (`:276-277`) |
| `Anteckningar.tsx:238` | ja (`:245-246`) |
| `Gruppdynamik.tsx:331` | ja (`:338-339`) |
| `Deltagare.tsx:1948` | ja (`:1950-1951`) |
| `EventDetail.tsx:83` | **nej vid konsumtionsstället `:284`** |

Blandlägesrisken vid halv rivning är alltså 5/3 av vad ADR:n beskriver.

**(g) Fynd ADR:n inte bär: den enda produktions-nåbara prototypgrenen.**
`EventDetail.tsx:284` saknar `import.meta.env.DEV`, till skillnad från
växlar-railen tio rader ned:

```tsx
// :284 — ingen DEV-grind
{isHallplatsVariant(variantParam) ? (<><AtgarderKort /><SkrivUtKort /></>) : (<Atgarder eventId={eventId} />)}

// :356 — DEV-grindad
{import.meta.env.DEV && isHallplatsVariant(variantParam) && (<PrototypeSwitcher … />)}
```

`isHallplatsVariant` (`hallplats-steg-prototyp.ts:38`) är en ren `v === 'a'` utan
egen miljökoll, och `AtgarderKort`/`SkrivUtKort` importeras ovillkorligt
(`EventDetail.tsx:15`). Källkoden bär alltså ingen grind mot att `?variant=a`
byter åtgärds-ytan i ett produktionsbygge. **Detta är en inferens om runtime**
— jag byggde inte och serverade inte bundlen (se § Vad jag inte kunde belägga).

### Verdikt R7: **HÅLLER DELVIS**

Kärnan — delad kod, riskabel rivning, "identisk" kan inte avgöras genom
filjämförelse — håller och är reproducerbar. Tre av beläggen är fel:
filantalet (7→8), ordet "grenar" (106 rader ≠ 106 grenar; 6 form-grenar), och
oberoende-läsarna (3→5). Ett fjärde belägg saknas helt: den enda gren som inte
är DEV-grindad.

### Täcks / återstår (R7)

- **Täcks:** delningen är kartlagd per fil och per form-gren (facitkartan +
  denna omräkning). `ADR-102` § Konsekvenser slår redan fast att R7 inte rivs
  retroaktivt.
- **Återstår:** (1) `EventDetail.tsx:284`:s saknade DEV-grind är oadresserad i
  varje styrande yta jag läste; (2) död kod (`Betalningar`,
  `BetalningsInnehall`) står kvar utan mekanisk synlighet; (3) `ADR-102`:s tal
  är fortfarande de citerade i varje nedströms läsning.

---

## R7 — options-rymd (INGA beslut; grillnings-underlag)

Fyra realistiska vägar. `ADR-074` (växlar-standarden) äger nuvarande form och
måste vägas i varje.

**Vad live-växlingen faktiskt är värd, mätt.** Facitkartans metod 2 renderade
båda lägena mot **samma** fixturvärld genom att bara byta query-parameter —
`/event/X` mot `/event/X?variant=a&data=verklig` — i två vyportar och fem
interaktiva lägen, med en tillfällig spec och **noll ny infrastruktur**.
`?data=verklig` är det som gjorde jämförelsen till en ren *form*-jämförelse i
stället för en jämförelse av två datamängder. Det är den konkreta vinst varje
alternativ måste betala för att ge upp.

### O1 — Behåll variant-formen oförändrad (nollalternativet)

- **Vinst:** live-växling på samma URL/session/data; jämförelse kostar en
  tillfällig spec; noll arbete nu; `ADR-074` orörd.
- **Pris:** rivning kräver samordnad ändring i **fem** oberoende läsare; halv
  rivning ger blandläge; en gren når produktionsbygget; död kod osynlig; talen
  i R7 fortsätter citeras.

### O2 — Separata filer/routes för prototypen

- **Vinst:** rivning = radera en katalog; blandläge strukturellt omöjligt; noll
  prototypkod i skarpa filers hot path.
- **Pris:** `ADR-102` säger själv att jämförelsen blir **svårare**, inte
  lättare — och facitkartans mätning visar varför: `?data=verklig`-tricket har
  ingen självklar motsvarighet när de två ytorna monteras från olika ställen,
  så man riskerar att jämföra två datamängder igen. Dubblerad yta driftar
  (D1/D2 i facitkartan är exempel på ändringar som idag automatiskt gäller
  BÅDA). En glömd route lämnar en död sida i bundlen.
- Delvis redan gjord: `DeltagareHallplatsPrototyp.tsx` **är** en egen fil (noll
  träffar på R7:s uttryck) — och `Deltagare.tsx` bär ändå fem form-grenar. Det
  antyder att filseparation ensam inte löser kopplingen.

### O3 — Hybrid: egen route som återanvänder skarpa komponenter via props

En läspunkt för `?variant` som propagerar nedåt, i stället för fem oberoende
`useQueryState`.

- **Vinst:** rivningen blir **atomär** (en läspunkt att ta bort); blandläge
  strukturellt omöjligt; live-växlingen behålls eftersom routen kan bära
  parametern; DEV-grinden hamnar på ett ställe i stället för fyra av fem.
- **Pris:** fem form-grenar måste uttryckas som props; rör skarpa filer under
  pågående facit-granskning; propgenomföringen ökar `Deltagare.tsx`:s yta innan
  den minskar.

### O4 — Minimal härdning utan arkitekturändring

(a) DEV-grinda `EventDetail.tsx:284` som de fyra andra · (b) riv
`Betalningar`/`BetalningsInnehall` · (c) centralisera de fem läsningarna till en
hook.

- **Vinst:** tar bort den enda produktions-nåbara grenen och största delen av
  blandlägesrisken utan att röra `ADR-074`.
- **Pris:** (b) är en rivning av prototyp-adjacent kod och ligger nära
  `ADR-102` B3:s spärr — `scripts/check-facit.sh`s tredje invariant fäller om
  en deklarerad prototyp-markör försvinner medan `godkand` är `null`. Måste
  prövas mot conf:en innan den planeras.

**Research-behov, öppet deklarerat.** Jag känner ingen branschprecedent **med
källa** för mönstret "prototyp och skarpa i samma komponentfil bakom en
URL-flagga". Näraliggande litteratur finns (feature-flaggors livslängd och
flag-debt i trunk-based development), men jag har ingen källa framme och gjorde
ingen webresearch i detta pass per uppdrag. **Ett eget research-pass krävs
innan O1–O4 vägs mot branschpraxis.** Räkningen fejkas inte: precedent-rymden är
för mig **omätt**, inte tunn.

---

## R8 — "Ingen mekanisk jämförelse mellan prototyp och skarpa existerar"

### Påstående (ADR-102 rad 121–127)

Ingen grind renderar båda och fäller på skillnad. Den visuella
regressionsvakten (`npm run test:visual`) jämför mot en baslinje stale sedan före
`145.1`; `eventsida-visual-desktop-linux.png` visar `Obekräftade anmälningar`,
accordion-paret och ett eget Betalningar-block. `*-darwin.png` gitignorad
(`.gitignore:97`).

### Mätning

**(a) Huvudpåståendet: bekräftat.** `scripts/check-facit.sh` (164 rader) — den
grind som mekaniserade R3–R6 (`9a30a31a`) — gör **ingen** rendering:

```console
$ grep -nE 'playwright|screenshot|render|toHaveScreenshot|pixel|diff' scripts/check-facit.sh
                                             # (tomt)
```

Den håller tre invarianter: facit-bilder måste vara manifest-deklarerade,
manifestet måste stämma med disken, och prototyp-markörer får inte försvinna
medan `godkand` är `null`. Dess egen commit säger det rakt ut: *"Grinden avgör
INTE om ytan SER UT som facit."* Utanför den finns ingenting: enda träffarna på
`variant=` under `tests/` är två prosakommentarer
(`event-deltagare.staging.test.ts:394`, `event-detail.staging.test.ts:1287`).

**(b) Baslinjen ÄR stale — och visar mer än ADR:n säger.** Jag läste PNG:n.

```console
$ git log --format='%h %ad %s' --date=short -- \
    tests/visual/__screenshots__/eventsida.spec.ts/eventsida-visual-desktop-linux.png
37e638df 2026-07-27 test(visual): baseline-uppdatering ur CI (run 30295150783)
```

Senast rörd **2026-07-27**, elva dagar före `145.1` (2026-08-07). Bilden visar,
verifierat visuellt: `Åtgärder`-gruppen med **sex** numrerade rader (inkl. de
fyra grå löftena), summeringsraden `Obekräftade anmälningar`, gruppen
`Obekräftade (2)` med Markera-knappen, accordionen `Bekräftade (3)`, och
`Betalningar` som eget toppnivå-block. ADR:n räknar tre av dessa. **Den fjärde —
den sexradiga Åtgärds-gruppen — är exakt A1:s yta.**

**(c) Men stödmeningen bär inte slutsatsen. Detta är passets falsifiering.**
Två oberoende skäl:

1. **`toHaveScreenshot` jämför en yta mot sitt eget förflutna.**
   `tests/visual/eventsida.spec.ts` går till `/event/${VISUAL_EVENT_ID}` — ett
   enda läge, ingen `?variant`. En perfekt färsk baslinje hade fällt på att
   skarpa ändrats sedan igår, aldrig på att skarpa ≠ prototypen. **Ingen av
   A1–A6 kan fällas av den mekanismen, oavsett baslinjens ålder.**
2. **`npm run test:visual` är ingen körande vakt.** Enda workflow-referensen är
   baslinje-*födsel*:

   ```console
   $ grep -n "test:visual" .github/workflows/*.yml
   .github/workflows/visual-baselines.yml:97:  run: npm run test:visual -- --update-snapshots
   ```

   Det blockerande CI-jobbet aktiverades aldrig: `T87` står `paused` i
   `tasks/threads/README.md:130`, med triggern uttryckligen hos Marcus.
   `playwright.config.ts:252` bokför konsekvensen i klartext — trösklarna är
   *"OMÄTT — visual-sviten körs inte i CI förrän T87 aktiverar grinden."*

   Att kalla den *"den visuella regressionsvakten"* i presens överstiger alltså
   vad som finns.

**(d) `.gitignore:97` — korrekt när det skrevs, dött idag.**

```console
$ git show e325bfbb:.gitignore | grep -n 'darwin.png'
97:tests/visual/__screenshots__/**/*-darwin.png
$ grep -n 'darwin.png' .gitignore
105:tests/visual/__screenshots__/**/*-darwin.png
```

Raden flyttades av `cd8dbf34` (`TASK-160.2`). Sakinnehållet — darwin-bilder
gitignorade, posten betalbar bara ur CI-artefakt — håller.

### Verdikt R8: **HÅLLER** (huvudpåståendet), med **FALSIFIERAD stödmening**

Att ingen mekanisk prototyp-mot-skarp-jämförelse finns är verifierat och
starkare belagt än ADR:n gör det. Men den visuella baslinjen citeras för något
den strukturellt inte kan bära, och beskrivs som en körande vakt den inte är.
Risken är operativ, inte akademisk: `TASK-145.3`/`145.5` DoD #6 (*"test:visual
omtagen med granskade baslinjer"*) står okryssad och pekar mot åtgärden
"uppdatera baslinjen" — som inte adresserar R8 alls.

### Täcks / återstår (R8)

- **Täcks:** att facit har en adress och att rivning är spärrad
  (`check-facit.sh`, R3–R6). Att avvikelserna A1–A6 är kända — men av en
  **manuell** kartläggning, inte av en grind.
- **Återstår:** hela den mekaniska jämförelsen. Dessutom: `facit.json` bär fyra
  ytor (`anteckningar`, `betalningar`, `gruppdynamik`, `atgarder`) och **ingen
  för registret/`Deltagare`** — där fyra av sex avvikelser sitter (A2, A3, A5,
  A6). En checklista härledd ur manifestet idag hade missat dem.

---

## R8 — options-rymd (INGA beslut; grillnings-underlag)

### O1 — Playwright tvåfönster-diff (två URL:er, samma fixturvärld)

**Precedent finns i repot och är körd en gång.** Facitkartans metod 2:
tillfällig spec ovanpå `tests/support/fixturvarld/hermetic.ts`, `/event/X` mot
`/event/X?variant=a&data=verklig`, två vyportar, fem interaktiva lägen, noll
sidfel, inga baslinjer rörda (`page.screenshot`, aldrig `toHaveScreenshot`).

- **Vinst:** billigast tänkbara — infrastrukturen finns och är bevisad. Fäller
  på FORM (text, roller, struktur), vilket är precis vad A1–A6 är. Oberoende av
  `T87` och av baslinje-födseln.
- **Pris:** kräver att prototypen finns kvar — grinden dör med `TASK-145.6`,
  vilket gör den till en granskningsgrind med utgångsdatum, inte en
  regressionsvakt. `PrototypeSwitcher`-railen monteras bara i prototypläget och
  måste undantas explicit. `?data=verklig` är en förutsättning som måste
  bevakas, annars jämförs två datamängder.

### O2 — Visual snapshot per läge mot samma baslinje

Samma `toHaveScreenshot`-namn för båda URL:erna, så en skillnad blir en diff.

- **Vinst:** enda vägen som fångar pixlar, som O1 och O3 strukturellt inte kan.
- **Pris:** blockerad av `T87` i praktiken. Baslinjer föds bara via
  `visual-baselines.yml` (workflow_dispatch, linux); darwin gitignorad.
  Trösklarna (`maxDiffPixelRatio: 0.01`, `maxDiffPixels: 2000`,
  `threshold: 0.2`) är enligt configens egen kommentar **omätta** — och 2000
  tillåtna pixlar är sannolikt mer än A4 (1 px avdelare) kostar, alltså en
  grind som kan vara grön på en känd avvikelse. Railen ger garanterad diff.

### O3 — DOM-diff (normaliserad strukturdump per läge)

- **Vinst:** oberoende av `T87` och av baslinje-födsel. Läsbar diff i
  CI-loggen. Fäller på struktur och tillgänglighetsträd — vilket täcker A1, A2,
  A3, A5 och A6. Repot bär redan mönstret "rendera och skriv, jämför inte" i
  `manifest-screenshots`-projektet.
- **Pris:** kräver en normaliserare (genererade id:n, ARIA-suffix, nyckel-brus)
  som annars ger falskt rött. Ser inte A4 (en CSS-egenskap, inte en
  strukturskillnad) om inte utvalda beräknade stilar tas med. Samma
  utgångsdatum som O1.

### O4 — Marcus öga med mekaniserad checklista

- **Vinst:** enda vägen som avgör *vilken* av två former som är RÄTT. `ADR-102`:s
  egen mekaniserings-commit säger uttryckligen att en grind som påstod sig göra
  den jämförelsen vore `ADR-083`-klassen som `ADR-102` finns för att ersätta.
  Halva mekaniken finns redan (`facit.json` + `check-facit.sh`); det som saknas
  är ytlistan och en kvittens per yta.
- **Pris:** skalar inte, ger inget regressionsskydd efteråt, och **manifestet
  saknar registret** — checklistan hade idag haft fyra ytor och missat fyra av
  sex avvikelser.

**De är komplement, inte alternativ.** O1/O3 kan fälla ATT de skiljer sig; bara
O4 avgör VILKEN som är rätt. En rimlig läsning av `ADR-102` B2 är att båda
behövs — men det är ett beslut, inte ett fynd, och det fattas inte här.

**Research-behov.** Branschprecedent för en *prototyp-mot-skarp*-grind (till
skillnad från visuell regression mot egen baslinje — Chromatic/Percy/Applitools
löser det senare, inte det förra) är **omätt av mig**. Ingen webresearch gjordes
per uppdrag. Egen research krävs innan O1–O4 kallas branschförankrade.

---

## R9 — "Skivsnittet följde funktionsytan, inte facit"

### Påstående (ADR-102 rad 129–134)

`145.1` och `145.3` såg ut som två skivor men var en gren i koden
(`Deltagare.tsx:1652` + `:2103`). Åtgärds-ytan fick ingen egen skiva — den blev
en delmening i `145.5` AC #4.

### Mätning

**(a) Kodpåståendet håller — men radreferenserna var döda redan i ADR:ns egen
commit.**

```console
$ git show e325bfbb:src/components/events/detail/Deltagare.tsx | wc -l
1993                                    # rad 2103 existerar inte
$ git show e325bfbb:src/components/events/detail/Deltagare.tsx | sed -n '1652p'
            >                           # meningslös
```

De löser upp sig **exakt** ett tillstånd tidigare — vid `18299040`
(*"revert(deltagare): [S93] [TASK-145.1] STOP — återställ kod, dokumentera
markera-läge-kopplingen"*, 2026-08-07 13:36), där filen var 2251 rader:

```console
$ git show 18299040:src/components/events/detail/Deltagare.tsx | sed -n '1651,1653p'
  const obekraftadeIds = useMemo(() => obekraftade.map((r) => r.id), [obekraftade]);
  const markeringKandidatIds =
    protoVariant === 'a' ? registerListaA.map((r) => r.id) : obekraftadeIds;
$ git show 18299040:src/components/events/detail/Deltagare.tsx | sed -n '2102,2104p'
                <GruppRubrik
                  varning
                  handling={
```

Beläggen är alltså **äkta**, hämtade ur lärdomsfragmentet, men överförda till
ADR:n utan att märkas som historiska koordinater. Detta är samma klass som
`tasks/lessons.d/uppdragets-kallmarkning-maste-avse-gallande-text.md` bokför —
ironiskt nog den lärdom `ADR-102` R4 självt citerar.

**(b) Substansen är oberoende belagd, två gånger, av backlog-historiken.**
Skivgränsen skars om **efter publicering**, i två separata rättelse-commits:

```console
$ git log --oneline --format='%h %ad %s' --date=short -- "backlog/tasks/task-145.3 …"
8941281f 2026-08-07 docs(backlog): [S93] DoD #3 verifierad på 145.3 + 145.5, falsk bock rättad
3eeb0e78 2026-08-07 feat(events): [TASK-145.3] markera-läget över visad lista; …
002e42d2 2026-08-07 fix(backlog): [S93] markera-lägets strukturella halva flyttas till 145.1
730d3cb0 2026-08-07 fix(backlog): [S93] summeringsblocket får en ägare — Bor över och Avbokade var oägda
ed8d1fca 2026-08-07 docs(backlog+threads): [S93] [T131] skivor för TASK-145 och TASK-146 …
```

`002e42d2` är fel 2 i lärdomsfragmentet; `730d3cb0` är fel 1. Båda är
gräns-omskärningar mot koden efter att korten publicerats. Det är starkare
belägg än radnumren och överlever att koden ändras.

**(c) "Åtgärds-ytan blev en delmening i 145.5 AC #4" — verbatim bekräftat.**

```text
- [x] #4 Åtgärds-radernas grå löften är hanterade: varje rivning eller ändring
        öppet bokförd, och numreringens referentbarhet uttryckligen adresserad
```

Kryssad. Den beskriver en **delförändring** (grå löften), aldrig ytans form —
precis R2:s mönster.

**(d) Fyndet ADR:n inte gör: luckan är LIVE, inte historisk.** Inget kort äger
uppgiften att göra skarpas åtgärds-yta identisk med prototypen:

```console
$ grep -rln 'Gå till åtgärder\|AtgarderKort' backlog/tasks/
backlog/tasks/task-145.6 - Skiva-Prototyp-substratets-rivning.md
```

Ett enda kort nämner ytan — och det är **rivnings**-skivan, som listar
`AtgarderKort/SkrivUtKort-grenen` bland det som ska **tas bort**, och som är
`blocked` per `ADR-102` B3. Det enda kortet som känner till facit-formen
planerar alltså att radera den. Det är exakt R9:s egen tes (*"en yta som skiljer
sig från facit måste ha en skiva som ÄGER den"*), i nutid.

**Kontext, ej motsägelse:** `145.3` och `145.5` står `To Do` trots landad kod.
`8941281f` bokför det avsiktligt — `145.3` väntar DoD #5 (design-review) och #6
(baslinjen), `145.5` väntar AC #1. R3:s formulering *"de landade skivorna"*
avser koden, inte korten, och håller.

### Verdikt R9: **HÅLLER**

Substansen är belagd tre gånger oberoende: koden vid `18299040`,
lärdomsfragmentet, och två backlog-rättelser. Enda defekten är att
radreferenserna citeras i presens fast de var döda i ADR:ns eget träd.

### Täcks / återstår (R9)

- **Täcks:** lärdomen är nedskriven och `[UNIVERSAL]`-märkt. `ADR-102` B5
  slår fast AC-formen framåt.
- **Återstår:** **åtgärds-ytan har fortfarande ingen ägande skiva.** `ADR-102`
  § Konsekvenser konstaterar att avvikelserna måste kartläggas och åtgärdas —
  kartläggningen är gjord (facitkartan), men ingen post i registret bär
  åtgärdandet. Samma gäller A2–A6. Och `B5` är prosa: ingen grind prövar att en
  AC pekar på facit i stället för att beskriva en defekt.

---

## Oväntade fynd utanför frågan — registrerade, ej förkastade

1. **`EventDetail.tsx:284` saknar DEV-grind** (R7 (g)). Källkoden bär inget
   hinder mot att `?variant=a` byter åtgärds-ytan i ett produktionsbygge. Enda
   prototypgrenen i mängden utan grind. Blockerar inte detta pass; värd ett
   eget kort.
2. **`facit.json` saknar registret/`Deltagare` som yta.** Manifestet — R5:s
   mekanisering — deklarerar fyra ytor. Fyra av sex mätta avvikelser (A2, A3,
   A5, A6) sitter i en yta manifestet inte känner till, så
   *"deklarerad frånvaro"* skiljer sig här inte från förbiseende.
3. **De mekaniska skrivvägs-bevisen körs inte i CI.** `145.5` AC #2 och `145.4`
   DoD #7 är kryssade mot tester i `--project=chromium-authenticated`, som
   gatas av `run_staging: false` (villkorslöst, `ci.yml:1278`). Samma
   `ADR-083`-klass som `ADR-102` R3 beskriver — en bock vars mekanism inte
   körs där bocken påstås gälla. **Notera:** att gatingen är medveten och
   ADR-förankrad (`ADR-077`, riskanpassad presubmit med post-submit-nät) gör
   den inte fel; det som är obelagt är om post-submit-nätet täcker just dessa
   två tester. Jag mätte inte det.
4. **Ingen unused-export-grind finns.** Död kod (`Betalningar`,
   `BetalningsInnehall`) är mekaniskt osynlig i detta repo.

## Vad jag inte kunde belägga

Öppet, i fallande ordning efter hur mycket det kan dölja.

1. **Att `?variant=a` faktiskt byter åtgärds-ytan i ett produktionsbygge.** Jag
   mätte källkoden (ingen `import.meta.env.DEV` på `:284`, ingen miljökoll i
   `isHallplatsVariant`, ovillkorlig import). Jag byggde inte och serverade
   inte bundlen. **Detta är en inferens.** Mätningen som avgör:
   `npm run build && npx vite preview`, öppna `?variant=a`, se efter
   `Gå till åtgärder`. Vite ersätter `import.meta.env.DEV` statiskt, så
   frånvaron av grind är stark indikation — men indikation är inte mätning.
2. **Allt renderat.** Uppdraget förbjöd att köra sviter. Ingen av A1–A6
   omverifierades i browser; jag ärver facitkartans rendering från 2026-08-07
   och kan bara intyga att `src/` är byte-identisk sedan dess.
3. **Om `T87` är tekniskt aktiverbar idag.** Trådkartan namnger tre kända
   falsk-röd-källor (`T101` m.fl.) som blockerare. Jag mätte inte om de kvarstår.
   O2:s pris kan därför vara högre eller lägre än jag anger.
4. **Om post-submit-nätet kör de staging-tester CI:s PR-yta hoppar över.**
   Fynd 3 ovan vilar på att `run_staging: false` gäller `suite`-anropet i
   `ci.yml`; jag spårade inte hela post-merge-lagret.
5. **Branschprecedent för båda options-rymderna.** Ingen webresearch gjordes
   (uppdrag). Jag känner ingen källa jag kan citera för vare sig
   prototyp-i-samma-fil-mönstret eller prototyp-mot-skarp-grinden. Precedent-
   rymden är **omätt**, inte tunn — och räkningen fejkas inte.
6. **Om `check-facit.sh`s tredje invariant faktiskt fäller på O4-alternativ
   (b).** Jag läste skriptet men körde det inte mot ett hypotetiskt tillstånd.
7. **Grenräkningens klassning form/data.** Jag reproducerade rådata exakt och
   spot-verifierade sex form-grenar mot koden. Jag läste inte om alla 127
   förekomster; klassningen är facitkartans och jag ärver dess räckviddsgränser.

## Rekommendation — MÄRKT SOM REKOMMENDATION, INTE BESLUT

Inget nedan är beslutat. Allt kräver Marcus.

1. **Amendera `ADR-102` R7–R9 hellre än att lämna talen.** Fyra rättelser:
   åtta filer (inte sju), *"106 rader / 127 förekomster / 6 form-grenar"* (inte
   *"~106 grenar"*), fem oberoende `?variant`-läsare (inte tre), och
   `EventDetail.tsx:284` som odokumenterad produktions-nåbar gren. R9:s
   radreferenser bör märkas som gällande vid `18299040`. Skälet är `ADR-102`:s
   eget: talen citeras nedströms som fakta.
2. **Riv R8:s stödmening om den visuella baslinjen ur R8 och ge den egen
   plats.** Den är sann men bär inte slutsatsen, och den styr `145.3`/`145.5`
   DoD #6 mot fel åtgärd.
3. **Ge åtgärds-ytan ett ägande kort innan `145.6` någonsin plockas.** R9:s
   lucka är live. `145.6` är idag det enda kort som känner ytan — och det river
   den.
4. **Väg O1 (R8) först** om något ska byggas: infrastrukturen finns, den är
   körd, och den fäller på precis den klass avvikelser som mättes. Men bokför
   dess utgångsdatum öppet — den dör med prototypen.
5. **Kör ett eget research-pass mot branschprecedent** innan någon av
   options-rymderna kallas branschförankrad.

## Verdikt-tabell

| R# | Verdikt | Återstår |
|---|---|---|
| **R7** | **HÅLLER DELVIS** — kärnan reproducerbar; tre räknefel (7→8 filer, "106 grenar"→106 rader/127 förekomster/6 form-grenar, 3→5 oberoende läsare); ett belägg saknas helt | `EventDetail.tsx:284` saknar DEV-grind (produktions-nåbar) · död kod mekaniskt osynlig · talen citeras vidare oförändrade · options-rymden obeslutad och branschprecedenten omätt |
| **R8** | **HÅLLER** (huvudpåståendet, starkare belagt än i ADR:n) — med **FALSIFIERAD stödmening**: baslinjens föråldring kan inte bära slutsatsen, och `test:visual` är ingen körande vakt (`T87` pausad) | Hela den mekaniska jämförelsen · `facit.json` saknar registret där 4 av 6 avvikelser sitter · `145.3`/`145.5` DoD #6 pekar mot fel åtgärd · options-rymden obeslutad, O2 blockerad av `T87` |
| **R9** | **HÅLLER** — substansen belagd tre gånger oberoende; enda defekten är radreferenser som var döda i ADR:ns eget träd | **Åtgärds-ytan saknar ägande kort ÄVEN IDAG** — enda kortet som nämner den (`145.6`) river den · A2–A6 saknar likaså ägare · B5 är prosa utan grind |

## Källförteckning

**Förstahandskällor i repot** (auktoritativa per
[`ADR-100`](../decisions/ADR-100-sanningshierarkin-koden-ager-beteendet.md):
koden äger beteendet):

- `src/components/events/EventDetail.tsx` — `:15`, `:83`, `:284–291`, `:323–331`, `:356`
- `src/components/events/detail/Betalningar.tsx` — `:186–231`, `:416`, `:424`, `:460–467`, `:551`, `:555`, `:671`, `:911`, `:924`, `:993`, `:996`, `:1121`, `:1124`, `:1193`
- `src/components/events/detail/Deltagare.tsx` — `:31`, `:1271`, `:1503`, `:1692`, `:1699`, `:1720`, `:1923–1927`, `:1948–1951`
- `src/components/events/detail/{Belaggning,Anteckningar,Gruppdynamik}.tsx` — `:269/:276`, `:238/:245`, `:331/:338`
- `src/components/events/detail/hallplats-steg-prototyp.ts` — `:38`
- `scripts/check-facit.sh` · `.facit-policy.conf` · `tasks/sessions/bilagor/s93-hallplats-prototyp/facit.json`
- `.github/workflows/ci.yml:1277–1279` · `.github/workflows/ci-suite.yml:508–515` · `.github/workflows/visual-baselines.yml:97`
- `playwright.config.ts:233–258`, `:581–600` · `package.json:22–34` · `.gitignore:105`
- `tests/visual/eventsida.spec.ts` · `tests/visual/__screenshots__/eventsida.spec.ts/eventsida-visual-desktop-linux.png` (läst som bild)
- `tests/e2e/mark-paid.staging.test.ts:349` · `tests/e2e/event-deltagare.staging.test.ts:648`
- `backlog/tasks/task-145.1/.3/.5/.6` · `tasks/threads/README.md:130` · `tasks/threads/S91-tradkarta-2026-07-31.md:237–245`

**Git-referenser:**

- `b39ffa3c` — HEAD vid mätning
- `e325bfbb` — `ADR-102`:s introducerande commit (2026-08-07)
- `48ce05da` — facitkartans commit · `9a30a31a` + `06d0723b` — R3–R6-mekaniseringen
- `18299040` — `TASK-145.1` STOP/revert; enda tillståndet där R9:s radreferenser löser upp sig
- `d1b57c22`, `3eeb0e78`, `92a3d564` — `145.1`/`145.3`/`145.5`-landningarna
- `002e42d2`, `730d3cb0`, `8941281f` — backlog-rättelserna som belägger R9
- `37e638df` (2026-07-27) — senaste baslinje-uppdateringen · `cd8dbf34` — `.gitignore`-förskjutningen

**Repo-interna dokument:**

- [`ADR-102`](../decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md) — det prövade beslutet
- [`eventsidan-prototyp-mot-skarpa-facitkarta-2026-08-07.md`](eventsidan-prototyp-mot-skarpa-facitkarta-2026-08-07.md) — avvikelsekartan A1–A6 (klassningen form/data ärvd härifrån)
- [`ADR-074`](../decisions/ADR-074-prototyp-substratets-adress-struktur-och-vaxlar-standard.md) — växlar-standarden som äger variant-formen
- [`ADR-086`](../decisions/ADR-086-uppdragets-premisser-provas-av-mottagaren.md) · [`ADR-100`](../decisions/ADR-100-sanningshierarkin-koden-ager-beteendet.md)
- `tasks/lessons.d/skivning-provas-mot-kodens-kopplingar-inte-mot-funktionsytan.md`

**Externa källor:** inga. Ingen webresearch gjordes i detta pass, per uppdrag.
Varje branschprecedent-fråga är märkt som research-behov ovan.
