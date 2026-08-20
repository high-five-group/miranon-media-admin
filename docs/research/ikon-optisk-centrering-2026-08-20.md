---
owner: marcus803
updated: 2026-08-20
review_by: 2026-11-20
status: draft
---

# Ikonernas optiska centrering — vad "optisk mitt" faktiskt betyder (2026-08-20)

> **Proveniens:** avgränsat research- och mätpass för `TASK-282`, kört i
> worktree `agent-a02721e9132d69ed5` på gren
> `docs/s107-282-ikonens-optiska-centrering`, ur `origin/main` @ `dac6602f`.
> Alla tal är MÄTTA på filerna i `public/` med
> `scripts/mat-ikon-centrering.mjs` (som landar i samma commit), inte
> härledda. Webbkällor hämtade 2026-08-20; varje påstående är märkt
> **[BELAGT]** (citat ur källa), **[MÄTT]** (egen mätning) eller
> **[SLUTSATS]** (min härledning).
> **Ingen ikon-källa är ändrad i denna commit** — se § 7.

## Kort svar

**Kortets AC #1 mandaterar fel mått.** Kriteriet kräver att den optiska
tyngdpunkten mäts "med alpha-viktad centroid — inte med bounding box". Men
alfa-viktad centroid mäter **homogen massa**, och tre oberoende
peer-reviewade studier visar att homogen massa är fel modell för hur
människan lokaliserar en **fler-delad** form — vilket vårt M är (§ 5).

Mätt på `public/pwa-512x512-120d7838.png`, avvikelse från geometriskt centrum
i x:

| Definition | Δx | Vad den mäter |
|---|---:|---|
| bbox-centrum | **0,000 px** | ytterkanter |
| kant-viktad centroid | **−0,318 px** | kontur |
| konvext höljes centroid | **−0,483 px** | ytterkontur |
| **dominerande delens centroid** | **−1,91 px** | **den tunga delen (grön, 64 %)** |
| kant-viktad centroid (luminans) | +1,847 px | kontur inkl. färggräns |
| **alfa-viktad centroid** | **+3,667 px** | homogen massa ← kortets mått |
| viktad median ("balanspunkt") | +7,615 px | massa, median |

**Fem av sju mått placerar mitten på eller till vänster om geometriskt
centrum.** Bara de två homogent massa-baserade måtten säger att ikonen är
höger-tung. Måtten spänner över **9,5 px** — nära tre gånger den avvikelse
kortet vill korrigera bort.

En korrigering som nollar alfa-centroiden **flyttar kontur-centroiden från
−0,318 px till −3,958 px** (mätt på en faktisk probe-generering) och
bbox-marginalerna från 24/24 till 20/28. Den byter ett omtvistat massa-fel
mot ett kontur-fel åt andra hållet.

**Detta är ett designbeslut som ägs av Marcus**, och passet stannade därför
före ändringen — per uppdragets egen stopp-regel. § 7 ger tre vägar.

**Marcus perception är inte falsifierad.** Han såg något, och ingen modell
slår en människa som tittar. Det som är falsifierat är att
**alfa-centroid-nollning** skulle vara det branschledarmässiga svaret. § 5
föreslår en mer sannolik orsak till det han såg — med en annan åtgärd.

---

## 1. Vad är optisk centrering, operationellt?

### 1.1 Måtten konkurrerar inte om samma sak

**[SLUTSATS]** `bbox` och `hull` bestäms av **extremvärden**; `centroid` och
`median` av **massfördelning**; `kant-centroid` av **konturens läge**. För en
symmetrisk figur sammanfaller alla — verifierat: en centrerad kvadrat ger
0,000 på samtliga, en kvadrat förskjuten +20 px ger exakt +20,000 på
samtliga. För en **asymmetrisk** figur divergerar de, och vårt M är
asymmetriskt på ett sätt som maximerar divergensen (§ 5).

**[SLUTSATS]** Skillnaden bbox↔centroid är inte marginell i allmänhet: för en
liksidig triangel är den `h/6 ≈ 16,7 %` av höjden. Det är hela
"play-knapps-problemet", och det är rätt kritik mot ren bbox-centrering. Men
den kritiken leder inte automatiskt till homogen centroid — se 1.3.

### 1.2 Vad branschen faktiskt gör: ingen mekanisk POSITIONS-regel

**[BELAGT]** Genomgång av sex stora system. **Inget av dem** har en mekanisk
regel för optisk *position*:

| System | Mekanisk positionsregel? | Vad som finns |
|---|---|---|
| **Apple HIG** | **Nej — explicit manuell** | "adjust… until it's optically centered" |
| **Material Design** | Nej (ja för *storlek*) | keyline-former, 24 dp-rutnät, 20×20 live area |
| **IBM Carbon** | **Nej** | 32×32 artboard, 2 px padding, hela pixlar |
| **Shopify Polaris** | Nej — hybrid | "Center… Adjust optically if needed", 0,25 px-steg |
| **GitHub Primer/Octicons** | Nej (ja för *storlek*) | "optical volume"-referensformer |
| **Adobe Illustrator/InDesign** | **Nej** | "optical" avser enbart kerning/marginaljustering |

**[SLUTSATS]** Alla mekaniska regler som existerar rör **storlek** (keylines,
optical volume) — **inte position**. Att mekaniskt fastställa en positions-
offset ur ett mått saknar alltså precedent i de system vi normalt tar golvet
från.

**[BELAGT]** Apple HIG, *Icons* (verbatim, hämtat ur HIG:s JSON-yta av två
oberoende pass):

> "**If necessary, add padding to a custom interface icon to achieve optical
> alignment.** Some icons — especially asymmetric ones — can look unbalanced
> when you center them geometrically instead of optically."
>
> "In such cases, you can slightly adjust the position of the icon until it's
> optically centered. **When you create an asset that includes your
> adjustments as padding around an interface icon, you can optically center
> the icon by geometrically centering the asset.**"
>
> "**Adjustments for optical centering are typically very small, but they can
> have a big impact on your app's appearance.**"

**[SLUTSATS]** Apple bekräftar **problemklassen** och pekar särskilt ut
asymmetriska ikoner — men anger **ingen metod och inget mått**. Justeringen
görs för hand. Däremot föreskriver Apple **var korrigeringen ska bo**:
inbakad i assetens egen padding. Det är precis kortets AC #4, och den delen
av kortet är i linje med förstaparten.

**[BELAGT]** Apples *App icons*-sida (ändringslogg *"June 8, 2026 — Refined
guidance for Liquid Glass"*) nämner **inte** optisk centrering alls; ordet
"optical" förekommer inte. Där står bara *"Keep primary content centered to
avoid truncation"* och *"you don't need to fill the entire icon canvas"*.
Att applicera glyf-doktrinen på en app-ikon är alltså en rimlig men **egen
extrapolering**, inte Apple-policy.

### 1.3 Den avgörande invändningen: homogen centroid är mätt fel modell

Detta är passets viktigaste fynd, och det vilar på tre oberoende
peer-reviewade studier — samtliga abstrakt verifierade verbatim mot NCBI:s
E-utilities, inte mot en sammanfattning.

**[BELAGT] Denisova K, Singh M, Kowler E (2006). "The role of part structure
in the perceptual localization of a shape." *Perception* 35(8), 1073–87. DOI
10.1068/p5518. PMID 17076067.** De jämförde en cirkel (ingen delstruktur) mot
en "bell" (två delar, en större). Verbatim ur abstraktet:

> "With the bell, the illusion was significantly weaker than with both
> circles […] Moreover, **the distance judgments for the bell were consistent
> with a (weaker) reference point being located at the COG of the larger
> part, rather than at the COG of the entire bell.** These results show that
> the part structure of a shape plays a role in the representation of its
> location, and that for complex shapes the perceived location of an embedded
> element depends more on the parts within which it is embedded, rather than
> on the whole shape."

**[BELAGT] Baud-Bovy G, Soechting J (2001). "Visual localization of the center
of mass of compact, asymmetric, two-dimensional shapes." *J Exp Psychol Hum
Percept Perform* 27(3), 692–706. PMID 11424655.** Verbatim:

> "The small observed errors were systematically influenced by the shape of
> the object. **The participants tended to locate the center of mass at the
> center of an inscribed circle instead of the true center of mass.**"

**[BELAGT] Hübner R, Fillinger MG (2019).** *i-Perception* 10(3), DOI
10.1177/2041669519856040. Verbatim:

> "The results show that 'balance' is interpreted differently, depending on
> the stimulus type. Whereas 'mechanical' balance was applied to assess
> single-element pictures, the balance of multiple-element and dynamic-pattern
> pictures was rated more in the sense of gravitational stability."

Enligt artikelns resultat korrelerade DCM (*deviation of center of "mass"*)
inte med balansomdömen för fler-element-bilder — medan samma mått i deras
tidigare arbete (2016, *Frontiers in Psychology* 7:335) presterade väl för
enkla enelementsbilder.

**[SLUTSATS]** De tre konvergerar: **homogen area-/massviktning är en bra
modell för enkla, nära-konvexa enelementsformer och en mätt dålig modell för
fler-delade former.** Vårt M är fler-delat (§ 5). Felets riktning är dessutom
förutsägbar — centroiden dras för långt mot den lättare delen; perceptionen
förankrar i den tyngre.

### 1.4 Kisa-testet — den verkliga invändningen ÅT ANDRA HÅLLET

**[MÄTT]** Designers klassiska metod är att kisa. Gaussisk suddning är
symmetrisk faltning och **bevarar första momentet**, alltså centroiden:

| σ | Δx | Δy |
|---:|---:|---:|
| 0 | 3,667 | 15,912 |
| 4 | 3,658 | 15,910 |
| 12 | 3,665 | 15,911 |
| 32 | 3,675 | 15,127 |
| 64 | 3,479 | 10,326 |

Δx är stabilt genom σ=32 (avvikelsen vid σ=64 är ramklippning, inte form).
**Detta är det starkaste argumentet FÖR massa-måttet:** kisar man tills formen
blir en fläck ligger fläckens tyngdpunkt +3,7 px till höger.

**[SLUTSATS]** De två synsätten mäter olika perceptuella regimer:
kisa-testet (låg spatial frekvens, formen som fläck) ger massa-svaret;
del-strukturmodellen (formen som gestalt av delar) ger kontur-/delsvaret.
Vilken regim som styr betraktandet av en ikon vid **normal** storlek är inte
avgjort av något vi hittat — och det är precis därför detta är ett
designbeslut, inte en mätning.

### 1.5 Verktygen — och en varning som måste med

**[BELAGT]** `javierbyte/visual-center` (≈1 450 ★) är det de facto mest
spridda verktyget för exakt vårt problem ("align logos in the center of a
container"). Källkoden gör **inte** det README påstår: den beräknar inte ett
första moment utan **hill-climbar argmax** av `Σ colorDiff · (1 − d/d_max)^0,5`
(`COLOR_DIFF_WEIGHT_EXPO = 0.333`, alltså kubikrot, inte kvadratrot som
README säger), X och Y optimerade separat.

**[SLUTSATS]** Det är matematiskt en **medoid/mod**, inte ett medelvärde — och
därför **robust mot tunna, avlägsna utskott** på ett sätt centroiden inte är.
Att det mest använda verktyget i praktiken undviker den homogena centroiden
är oberoende stöd för § 1.3.

> ### ⚠️ Falsifierad citering — `opticalcenter.dev`
>
> Sajten `opticalcenter.dev` publicerar den enda "fulla"
> perceptionspipelinen vi hittat: DoG(σ=1,0 − σ=1,6) → `w^0,7` → **0,4 ×
> kantcentroid + 0,3 × höljescentroid + 0,3 × symmetricentrum**, därefter
> `cy −= höjd × 0,035`. Den åberopar *"Proffitt, Cutting & Stier, 1983"* för
> påståendet *"You see a shape's center by its boundary, not its mass."*
>
> **Citeringen håller inte.** [BELAGT, verifierat mot NCBI E-utilities,
> PMID 528940] Papperet är **Proffitt DR, Cutting JE, Stier DM (1979),
> "Perception of wheel-generated motions", *J Exp Psychol Hum Percept
> Perform* 5(2), 289–302** — alltså **1979, inte 1983**, och det handlar om
> rullande hjul, inte om formcentrering. Dess fynd rör att observatörer
> följer centroiden, vilket om något pekar åt motsatt håll.
>
> **Vikterna 40/30/30 och konstanten 0,035 är därmed ostödda designval med
> citeringsdekor.** Vi använder sajtens *kant-centroid-steg* som ett av flera
> mått (det är en välkänd bildbehandlingsoperation som står på egna ben), men
> **inte** dess vikter och **inte** dess vertikala bias. En tidigare version
> av detta dokument lutade sig mot dem — rättat innan landning.

---

## 2. Safe zone — och omräkningen (AC #5)

### 2.1 De normativa talen

**[BELAGT]** W3C Web App Manifest, § *Icon masks and safe zone*:

> "The **safe zone** is the area within a maskable icon which is guaranteed to
> always be visible […] **It is defined as a circle with center point in the
> center of the icon and with a radius of 2/5 (40%) of the icon size.**"
>
> "**The user agent MUST NOT make any pixel within the safe zone transparent.**"

**[BELAGT]** Den ofta citerade "10 % marginal" är en **icke-normativ Note**:
*"By staying inside the safe zone, most icons will have around 10% padding on
the top, bottom, right and left with no content or non-essential content."*

**[BELAGT]** Android har **tre** tal, inte två. AOSP
`AdaptiveIconDrawable.java`: `SAFEZONE_SCALE = 66f/72f`,
`EXTRA_INSET_PERCENTAGE = 1/4`. Designguiden och API-referensen motsäger
varandra i samma mening (66 respektive 72 dp "appears within the masked
viewport"); källkoden avgör:

| Nivå | dp | Andel av 108 |
|---|---:|---:|
| Lager (canvas) | 108×108 | 100 % |
| Viewport (masköppning) | 72×72 | 66,7 % |
| **Safe zone** (ingen OEM-mask klipper) | **66×66** | **61,1 %** |

**[BELAGT]** Skillnaden mot W3C:s 80 % är avsiktlig och löst i
`w3c/manifest#555` (Matt Giuca, Chrome, 2018-07-11): webbens 80 % gäller
*ikonfilen*, Androids 61 % gäller *108 dp-lagret*, och user agenten
konverterar med ~15 % padding per sida. Kontrollräkning: `512 × 1,3 = 665,6`;
`409,6 / 665,6 = 61,5 %` ≈ Androids 61,1 %. Konsistenta by design.

### 2.2 Premissen i uppdraget och kortet är FEL — två oberoende belägg

Uppdraget och kortets AC #5 säger: *"kvoten låg på 0,912 mot kravet 0,9 vid
paddingen 0,55 — marginalen är tunn"*, plus *"Vår maskable-ikon har bara
0,012 marginal kvar"*.

**0,912 hör till padding 0,45, som FÖRKASTADES.**

**[BELAGT]** `pwa-assets.config.ts` egen kommentar, verbatim:

```text
padding 0.45 → bbox 270×258 → kvot 0,912  ✗ (kravet är ≤ 0,9)
padding 0.55 → bbox 220×212 → kvot 0,746  ✓
padding 0.62 → bbox 187×179 → kvot 0,632  ✓ men märket blir smått
```

**[MÄTT]** Oberoende mätning av `maskable-icon-512x512-120d7838.png`
reproducerar konfigurationens tal exakt: bbox **220×212**, hörnradie
`hypot(110, 106) = 152,761`, safe zone-radie `0,4 × 512 = 204,8`, **kvot
0,746**.

Kortets parentes är dessutom självmotsägande på egen hand: 0,912 > 0,9
betyder att kravet FÄLLS, samtidigt som AC:t ber om att det ska "fortfarande
klara" kravet.

**Verklig marginal: 0,154 i kvot = 61,9 px** (`204,8 − 142,921`), inte 0,012.

### 2.3 Omräkningen — en förskjutning kan inte fälla safe zone

**[MÄTT]** Probe med `dx = −0,982` källenheter, regenererad med
`npx pwa-assets-generator` (hash `55147f9b`):

| | före (`120d7838`) | efter (`55147f9b`) |
|---|---:|---:|
| ink-bbox | 146..365 (220 px) | 144..363 (220 px) |
| maxAvst från centrum | 142,921 | 142,879 |
| **kvot(hörn)/safeR** | **0,746** | **0,746** |
| kvot(maxAvst)/safeR | 0,698 | 0,698 |

Kvoten är **oförändrad** — förskjutningen ändrar formens *läge*, inte dess
*storlek*, och hörnradien beror bara på storleken.

**[SLUTSATS]** Generellt kan en förskjutning `d` enligt triangelolikheten
aldrig minska marginalen till en centrerad cirkel med mer än `d`
(`|p + Δ| ≤ |p| + |Δ|`). En diagonalt liggande kritisk punkt förlorar
**mindre** än `d` (≈0,72 d vid 45°), inte mer. Uppdragets farhåga är alltså
osann här: 61,9 px headroom mot en förskjutning på 1,74 px i maskable-ikonen.

**AC #5 är uppfyllt oavsett vilken väg som väljs** — men premissen det vilade
på var fel, och det var därför kriteriet såg riskabelt ut.

---

## 3. Faviconen vid 16 px — korrigeringen är under mediets upplösning

**[MÄTT]** Faviconen (`public/favicon/favicon.svg`) har **egen källa** men
**samma path och samma centreringskonstant** som PWA-källan
(`translate(-75.000,-59.439)`, M:et skalat 2,2138 i en 400-viewBox).
Färgneutralt mätt är formavvikelsen **identisk**: `+0,982` path-enheter i
båda. **Favicon och PWA-ikon kräver alltså INTE motsatta korrigeringar** —
det stopp-villkoret är avfört.

> **Mätfälla, värd att skriva ner:** faviconen mätt i `ink`-läge gav först
> `+1,288` path-enheter i stället för `+0,982`. `ink` väger avvikelse från
> bakgrunden, och märkets färger avviker olika mycket från vitt: röd
> `#FF0000` ger d=255, grön `#548235` ger d=202. Den gröna linjen — tyngre
> och till vänster — väger alltså bara 79 % av den röda, vilket ensamt
> förskjuter centroiden åt höger. **Jämför aldrig ett ink-tal med ett
> alpha-tal.**

**[MÄTT]** Vad korrigeringen blir i faktiska favicon-storlekar:

| storlek | förskjutning |
|---:|---:|
| 16 px | **0,087 px** |
| 32 px | 0,174 px |
| 48 px | 0,261 px |

Renderad jämförelse i 16/32/48 px, med och utan korrigering, är **visuellt
oskiljbar**.

**[BELAGT]** En sub-pixelförskjutning återges inte som förflyttning utan som
omsampling. CSS Images 3 (`image-rendering`): `auto` ⇒ *"The scaling algorithm
is UA-dependent"*; `smooth` tillåter bilinjär interpolation. `image-rendering`
är dessutom en CSS-egenskap och **når inte favicon-rasteriseringen** — det
finns ingen mekanism att välja algoritm för `<link rel="icon">`.

**[BELAGT]** Typsnitt löser detta med hinting. FreeType, *Glyph hinting*:
*"Because hinting aligns the glyph's control points to the pixel grid, this
process slightly modifies the dimensions of character images"*, och vid
översättning av hintade outlines måste man använda *"exclusively integer pixel
distances"* — annars *"you ruin the hinter's work, resulting in very low
quality bitmaps."*

**[SLUTSATS]** **Ikonformat har ingen motsvarighet till hinting.** Varken SVG,
PNG eller ICO bär grid-fitting-instruktioner. En icke-heltalig förskjutning
vid 16 px blir därför omsampling, och inget räddar den. För att en offset ska
vara heltalig vid *både* 16 och 32 px i en 512-källa krävs multiplar av 32 px
— vår korrigering är 3,7 px.

**[BELAGT]** Separat optimerad källa för små storlekar är etablerad praxis:

- Evil Martians, *How to Favicon in 2026*: *"I recommend sticking to a single
  32×32 image, unless the one you have doesn't downscale well to 16×16 (if it
  becomes blurry, for instance). In that case, you can ask your designer to
  come up with a special version of the logo that's tailored to fit small
  pixel grids."*
- Material Symbols har en **`opsz`-axel** (20–48 dp) just för detta, och
  `google/material-design-icons` README medger: *"only the 20 and 24 px
  versions are designed with perfect pixel-grid alignment."*
- Android har `android:roundIcon` — separat källa för en annan maskform.

**[SLUTSATS]** För faviconen är korrigeringen **verkningslös som
förflyttning** och kan bara påverka antialiasingen. Den är inte skadlig i vår
mätning, men löser ingenting där. Vill man förbättra faviconen vid 16 px är
den belagda vägen en **egen småstorleksritning**, inte en subpixel-nudge.

---

## 4. Vertikalled — vad konventionen faktiskt är värd

**[SLUTSATS]** Den ofta upprepade regeln "optisk mitt ligger ~5 % ovanför
geometrisk" saknar publicerad empirisk härledning. Källorna anger den som
branschfolklore eller egen erfarenhet; PrintWiki anger ingen siffra alls.

**[BELAGT]** Riktningen har visst stöd: friska observatörer delar vertikala
linjer ovanför den sanna mittpunkten ("altitudinal pseudoneglect", Drain &
Reuter-Lorenz 1996). Men det är linjedelning, inte objektplacering i en ram.

**[BELAGT]** Universaliteten är däremot falsifierad. Sammartino & Palmer
(*JEP:HPP*): *"people generally prefer objects typically located below the
observer's viewpoint […] to be **below** the center of the frame and objects
typically located above […] to be **above** the center of the frame"*, och
*"The strong lower bias was a surprise, because we expected to find a center
bias."*

**[SLUTSATS]** Den enda *kvantifierade* klassiska regeln kommer ur
fotomontering och skalar med luftmängden i stället för att vara konstant: för
ett objekt som fyller andelen `p` av ytans höjd blir uppåtskiftet
`(1 − p)²/4`. Vårt M fyller `446/512 = 0,871` av 512-ikonen, vilket ger
**0,42 % ≈ 2,1 px** — inte 5 %, och en storleksordning mindre än den uppmätta
y-avvikelsen på 15,9 px.

---

## 5. Formens struktur — varför den kan läsas som höger-tung

**[MÄTT]** M:et är inte en enkel form utan **två vågformer i lager**: en grön
(`#548235`, `cls-3`, ett stort path) och en röd (`#FF0000`, `cls-1`, sex
paths) förskjuten åt höger och nedåt som ett eko:

| lager | andel av massan | bbox (källenheter) | centroid Δx (källenh.) | Δx vid 512 |
|---|---:|---|---:|---:|
| **grön (dominerande)** | **64 %** | 3,1..125,0 | **−0,51** | **−1,91 px** |
| röd (eko) | 36 % | 7,0..126,9 | +3,91 | +14,64 px |
| sammansatt | 100 % | 3,1..126,9 | +0,98 | +3,67 px |

**[SLUTSATS]** Det förklarar hela mätbilden. Den sammansatta **bboxen** är
symmetrisk därför att den *gröna* definierar vänsterkanten och den *röda*
högerkanten — och det är den symmetrin nuvarande centrering vilar på
(dokumenterat i källfilens egen kommentar: *"M:ets bbox 123.814 x 118.882 […]
centrerad i en kvadratisk 130x130-viewBox"*). Massan lutar höger eftersom det
lättare röda lagret ligger till höger.

**[SLUTSATS]** Och detta är exakt Denisova et al.:s "bell": en tvådelad form
där delarna har olika storlek. Deras fynd — referenspunkten ligger vid **den
större delens** COG, inte helhetens — ger för vår form **−1,91 px**, alltså
strax till *vänster* om centrum. Att flytta märket ytterligare 3,7 px åt
vänster går åt fel håll enligt den modell som är mätt på just denna formklass.

**Den höger-lutning Marcus ser är sannolikt inte ett centreringsfel — det är
ekot.** Att flytta hela märket åt vänster kompenserar ekot genom att göra allt
osymmetriskt mot ramen i stället. Det botar symptomet på fel nivå.

**[SLUTSATS]** Ska lutningen bort på rätt nivå är åtgärden att ändra **ekots
offset i märket** — vilket är att ändra Roger & Lottas logotyp. Det ligger
klart utanför en ikon-fix och ägs av Marcus (och rimligen av Roger & Lotta).
Registrerat som fynd, inte föreslaget som åtgärd.

---

## 6. Y-ledet — kortets AC #6

**[MÄTT]** Till skillnad från i x-led är alla mått eniga om att formen sitter
lågt: massa-centroid **+15,912 px**, kant-centroid **+16,734 px**,
hull-centroid **+24,959 px** (512-ikonen). Nedre halvan bär 21,9 % mer massa.

**Ställningstagande: y-ledet lämnas OFÖRÄNDRAT, som avsiktligt.** Tre skäl:

1. **[MÄTT, renderat]** En korrigering flyttar bboxen 15,9 px uppåt och ger
   marginalerna **17 px över / 49 px under** — nära 3:1. Den renderade
   jämförelsen visar ett märke som tydligt tornar i överkant med ett tomrum
   under. Det ser sämre ut, inte bättre.
2. **[SLUTSATS]** Den enda kvantifierade klassiska regeln (§ 4) ger för vår
   fyllnadsgrad ett uppåtskift på **≈2,1 px**, inte 15,9. Det finns alltså
   ingen belagd grund för en korrigering av den storleksordning en
   centroid-nollning skulle innebära — och den enda källa som kodar en fast
   3,5 %-bias är den vars citering är falsifierad (§ 1.5).
3. **[MÄTT]** Referensmätning av versalt M i åtta etablerade typsnitt
   (massa-centroid mot egen bbox, andel av höjden): Helvetica +0,14 %, Times
   New Roman +0,34 %, Georgia +0,49 %, Verdana −5,39 %, Courier New −1,26 %,
   Arial Black −0,90 %, Futura **+5,35 %**, Palatino +0,24 %. Vår form ligger
   på **+3,57 %** — inom det spann professionellt ritade M:n uppvisar, och
   mindre extremt än Futura.

Marcus rapporterade dessutom specifikt **höger**-tyngd, inte att märket sitter
lågt.

---

## 7. Rekommendation — tre vägar, beslutet är Marcus

**A. Låt stå (rekommenderas).** Nuvarande bbox-centrering ligger inom ±0,5 px
på kontur-måtten och −1,9 px på den dominerande delens COG — det mått som är
mätt på just vår formklass. Kostnad: massa-måttet fortsätter visa +3,7 px, och
den som mäter med det måttet "hittar" felet igen. Motmedlet är denna fil plus
`scripts/mat-ikon-centrering.mjs`, som rapporterar alla mått och därför inte
kan ge det ensidiga svaret.

**B. Korrigera fullt (kortets AC, `dx = −0,982` källenheter).** Nollar
massa-centroiden (+3,667 → −0,008 px). Kostnad: kontur-centroiden går till
−3,958 px, hull till −4,306 px, dominerande delens COG till −5,6 px,
bbox-marginalerna till 20/28. Safe zone opåverkad (0,746). Byter ett mätfel
mot ett annat.

**C. Halv korrigering (`dx = −0,491`).** Landar mitt emellan måtten och
motsvarar grovt luminans-kantmåttet (+1,85 px). Kostnad: ingen principiell
grund — en kompromiss mellan två mått, inte ett svar på vilket mått som
gäller.

**Om A väljs bör kortets AC #1 skrivas om**, eftersom det som formulerat kräver
ett mått denna research falsifierar för formklassen. AC #3–#6 är i sak
besvarade här oavsett väg.

---

## 8. Mät om — kommandot

```bash
node scripts/mat-ikon-centrering.mjs                       # hela ikonsetet
node scripts/mat-ikon-centrering.mjs <fil.png>             # transparent ikon
node scripts/mat-ikon-centrering.mjs <fil.png> --mass ink  # opak ikon
```

Verktyget är validerat i båda riktningar: en centrerad kvadrat ger 0,000 på
samtliga mått, en kvadrat förskjuten +20 px ger exakt +20,000 på samtliga, och
en form med utstickande stapel ger avsiktligt **olika** svar per mått (massa
+25,3 · hölje +49,2 · kant +55,1 · bbox +62,0) — vilket är hela poängen med
att rapportera alla.

---

## Källor

### Peer-reviewat (abstrakt verifierade mot NCBI E-utilities)

- Denisova K, Singh M, Kowler E (2006), *Perception* 35(8) 1073–87, PMID 17076067 — <https://doi.org/10.1068/p5518>
- Baud-Bovy G, Soechting J (2001), *J Exp Psychol Hum Percept Perform* 27(3) 692–706, PMID 11424655
- Hübner R, Fillinger MG (2019), *i-Perception* 10(3) — <https://journals.sagepub.com/doi/10.1177/2041669519856040>
- Hübner R, Fillinger MG (2016), *Frontiers in Psychology* 7:335 — <https://doi.org/10.3389/fpsyg.2016.00335>
- Proffitt DR, Cutting JE, Stier DM (1979), *J Exp Psychol Hum Percept Perform* 5(2) 289–302, PMID 528940 — **felciterad av opticalcenter.dev, se § 1.5**
- Sammartino J, Palmer SE, *J Exp Psychol Hum Percept Perform* — <https://palmerlab.berkeley.edu/Sammartino&Palmer.vertical.JEPHPP.pdf>

### Specifikationer och förstapartsdokumentation

- W3C Web App Manifest — <https://www.w3.org/TR/appmanifest/>
- `w3c/manifest` issue #555 (härledningen av 40 %) — <https://github.com/w3c/manifest/issues/555#issuecomment-404097653>
- Android, *Adaptive icons* — <https://developer.android.com/develop/ui/views/launch/icon_design_adaptive>
- AOSP `AdaptiveIconDrawable.java` — <https://github.com/aosp-mirror/platform_frameworks_base/blob/master/graphics/java/android/graphics/drawable/AdaptiveIconDrawable.java>
- Apple HIG, *Icons* (optisk justering) — <https://developer.apple.com/design/human-interface-guidelines/icons>
- Apple HIG, *App icons* — <https://developer.apple.com/design/human-interface-guidelines/app-icons>
- CSS Images Module Level 3 — <https://www.w3.org/TR/css-images-3/#the-image-rendering>
- FreeType, *Glyph hinting* — <https://freetype.org/freetype2/docs/glyphs/glyphs-3.html>
- Material Design (keylines) — <https://m1.material.io/style/icons.html>
- IBM Carbon (ikon-bidrag) — <https://v10.carbondesignsystem.com/guidelines/icons/contribute/>
- GitHub Primer/Octicons — <https://primer.style/octicons/design-guidelines/>
- Material Symbols, `opsz` — <https://developers.google.com/fonts/docs/material_symbols>

### Verktyg och praktiker

- `javierbyte/visual-center` (källkod) — <https://github.com/javierbyte/visual-center/blob/main/src/visualCenter.js>
- opticalcenter.dev — <https://opticalcenter.dev/> (**se citeringsvarningen i § 1.5**)
- Bjango, *Formulas for optical adjustments* — <https://bjango.com/articles/opticaladjustments/>
- HT LetterSpacer (*"a method, not a magic button"*) — <https://letterspacer.htfonts.com/>
- Evil Martians, *How to Favicon in 2026* — <https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs>
- damato.design, *Logical Optical* — <https://blog.damato.design/posts/logical-optical/>
