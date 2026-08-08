---
owner: marcus803
updated: 2026-08-08
review_by: 2026-09-08
status: draft
---

# Mekanisk jämförelse: design-avsikt mot byggd yta — branschmönster (RP2)

> **Proveniens:** avgränsat research-pass 2026-08-08, uppdrag RP2, för att ge
> ADR-102 R8:s options-rymd (O1–O4) branschprecedent inför grillning G3. Kört
> mot `main` — ingen kod ändrad, ingen svit körd, ingen dev-server rörd.
> Underlag: [`ADR-102`](../decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md)
> och R7–R9-verifieringspasset (se § Vad jag hittade FÖRST för läsväg).

## Kort svar

Etablerade mönster finns, och de delar sig i **två familjer** beroende på vad
man jämför mot — en distinktion som är den mest belastande enskilda insikten
i hela passet:

1. **Yta-mot-sitt-eget-förflutna** (baseline-historik). Detta är det
   **dominerande** branschmönstret: Chromatic, Percy, Playwrights egna
   `toHaveScreenshot`/`toMatchAriaSnapshot`. En spara-fil är facit; nästa
   körning jämförs mot den. Molnburet (Chromatic/Percy) eller lokalt
   (Playwright), men strukturellt **fel verktygsklass** för R8:s lucka — precis
   det R7–R9-rapporten redan konstaterade om vår egen `test:visual`-svit utan
   att ha branschbelägg för det. Det beläggets nu här.
2. **Yta-mot-en-annan-SAMTIDA-yta** (referens-vs-kandidat, ingen historik
   inblandad). Mindre känt men väletablerat, med flera **oberoende**
   implementationer: BackstopJS (`referenceUrl`/`url`), BBC:s Wraith
   (domän-mot-domän), och en hel verktygsklass för Figma-mot-produktion
   design-QA (Applitools Eyes for Figma, Floto Design Diff, Pixelay, Uiprobe,
   UI Match, OverlayQA). Samtliga körbara utan molntjänst.

**R8:s behov — prototyp mot skarpa, samma commit, ingen historik inblandad —
hör till familj 2, inte familj 1.** Det är själva kärnan i varför R8:s
observation ("`test:visual` hade inte fällt en enda av A1–A6") är
branschmässigt väntad, inte ett internt missöde: verktygsklassen som redan
finns i repot (familj 1) löser strukturellt en annan uppgift.

**Delfrågornas domar, kort:**

- **(a)** Två oberoende, väletablerade verktyg (BackstopJS, Wraith) bygger sin
  HELA existens på just referens-vs-kandidat-mönstret. Precedent är STARK, inte
  tunn.
- **(b)** Branschens granskningsflöde är enhetligt: mekaniken fäller en diff,
  en människa ser sida-vid-sida/overlay och godkänner eller avvisar — exakt
  formen R7–R9-rapporten och Marcus efterfrågar.
- **(c)** Molnkravet är verktygsvalt, inte mönstervalt. Chromatic/Percy kräver
  moln; BackstopJS/Wraith/Playwrights egna primitiv kräver det inte alls.
- **(d)** Storybooks story-per-tillstånd fungerar hos ledarna som ett
  facit-liknande manifest, och Chromatic kopplar stories till Figma-varianter
  för just design-mot-kod-jämförelse — strukturellt släkt med vårt
  `facit.json` + `check-facit.sh`, men ADR-044/ADR-074 har redan avvisat
  Storybook självt två gånger med öppna re-trigger-villkor som inte utlösts
  av detta pass.

## Vad jag hittade FÖRST — och vad detta pass lägger till

| Vad jag läste | Vad det redan täckte | Ålder |
|---|---|---|
| R7–R9-verifieringspasset (`git show origin/docs/s93-processaudit-underlag:docs/research/adr-102-rotorsaksverifiering-r7-r9-2026-08-08.md`, 710 rader, läst i sin helhet) | Hela O1–O4-options-rymden för R8, redan mätt mot vår kod. Rapporten deklarerar SJÄLV öppet: *"Jag känner ingen branschprecedent... Ingen webresearch gjordes i detta pass per uppdrag... precedent-rymden är omätt, inte tunn."* | Samma dag |
| [`eventsidan-prototyp-mot-skarpa-facitkarta-2026-08-07.md`](eventsidan-prototyp-mot-skarpa-facitkarta-2026-08-07.md) | Metod 2 — en tillfällig Playwright-spec som renderar `/event/X` mot `/event/X?variant=a&data=verklig` i samma fixturvärld, `page.screenshot()` (aldrig `toHaveScreenshot`), inga baslinjer rörda. Detta ÄR O1, redan kört en gång i detta repo och sedan raderat. | 1 dag |
| [`ADR-074`](../decisions/ADR-074-prototyp-substratets-adress-struktur-och-vaxlar-standard.md) | Research gjord för en ANGRÄNSANDE men annan fråga: variant-A-mot-variant-B under DIVERGENS (innan Marcus valt vinnare), inte prototyp-mot-skarpa EFTER facit-lås. Källor redan citerade där: Storybook (stabila story-ID:n), Histoire, Vercel Toolbar, Chromatic/Applitools (snapshot-diff), Polypane (sida-vid-sida i betraktningslagret), preview-URL-delning. Beslutade: snapshot-par + "öppna i nytt fönster"; avvisade Storybook (ADR-044:s avvisande står, med re-trigger) och en `/dev/compare-iframe-route` (deferred, med EGEN re-trigger: *"konvergens-pass som empiriskt faller på två-fönster-formen"*). | 2,5 v |
| [`ADR-044`](../decisions/ADR-044-react-aria-components-demo-route.md) | Storybook avvisat en första gång, kostnadsskäl (stort `@storybook/*`-devDependency-träd → större `audit-ci`-yta). Re-trigger: *"om primitiverna paketeras som fristående Mm Component Library."* | Äldre |
| `tasks/lessons.md` (kring visual-riggens värde) | Nämner Chromatic/Percy/Playwright-skärmdumpar som EGEN testklass utan detaljer eller källor — ingen av delfrågorna (a)–(d) besvarad där. | — |

**Vad som är nytt i detta pass:** branschkällor med URL för samtliga fyra
delfrågor, och framför allt distinktionen mellan de två verktygs**familjerna**
ovan — R7–R9-rapporten hade redan sett att "vår rigg jämför fel sak" men hade
ingen namngiven motpart-verktygsklass för vad den RÄTTA sortens verktyg heter
eller vem som bygger dem. Ingen ADR eller lärdom förkastar något av det som
föreslås nedan; ADR-044/ADR-074:s Storybook-avvisanden är lästa i sin helhet
och respekteras — se § (d) och § Rekommendation punkt 4.

## Metod och källhierarki

Förstapartsdokumentation (Playwright, Chromatic, BackstopJS-README, Wraith
matm README) prioriterad framför sekundärkällor (bloggar, jämförelse-sajter).
Där en sekundärkälla är enda tillgängliga belägg är det märkt TOLKAT nedan,
aldrig tyst blandat med BELAGT. Version mätt mot: `@playwright/test ^1.62.0`
(vår `package.json:80`).

---

## (a) Referens-implementation mot kandidat — mönster

**BELAGT.** Två oberoende, öppna verktyg bygger sin existens på exakt detta:

- **BackstopJS.** README: *"By default this [reference] command calls the
  `url` property specified in your config. Optionally, you can add a
  `referenceUrl` property to your scenario configuration."* Det ger en
  scenario-konfiguration där `referenceUrl` och `url` är TVÅ olika adresser —
  facit-sidan och kandidat-sidan — och verktyget skärmdumpar båda och
  diffar dem mot varandra, utan att någon av dem behöver vara en sparad fil.
  Helt open source (MIT), körs helt lokalt, ingen molntjänst.
  ([`github.com/garris/BackstopJS`](https://github.com/garris/BackstopJS))
- **Wraith (BBC News).** Byggt specifikt för att jämföra *"Live (Stable)"* mot
  *"Dev/Staging"* genom att peka samma sökvägar mot två olika domäner i
  konfigurationen (`wraith capture`, kommando *"Comparison of 2 domains"*).
  Ruby + ImageMagick + en headless browser, Apache 2.0, helt lokalt.
  ([`github.com/bbc/wraith`](https://github.com/bbc/wraith))
- **Figma-mot-produktion design-QA, som EGEN verktygsklass.** Applitools Eyes
  for Figma (*"designers export their frames, developers compare live builds
  against those baselines"*), Floto Design Diff (*"compares a Figma design
  against a live implementation … automatically aligns your Figma frame to
  your live DOM"*), Pixelay, Uiprobe, UI Match, OverlayQA — sex oberoende
  produkter i samma nisch, vilket är starkare precedent än en enda
  implementation. ([`applitools.com/solutions/figma`](https://applitools.com/solutions/figma/),
  [`floto.ai/design-diff`](https://floto.ai/design-diff),
  [`uiprobe.io`](https://www.uiprobe.io/))

**TOLKAT/nyansering.** Playwrights egna `toHaveScreenshot`/`toMatchAriaSnapshot`
är **inte** byggda för detta mönster — förstapartsdokumentationen beskriver
uttryckligen bara jämförelse mot en sparad referensfil (*"On first execution,
Playwright test will generate reference screenshots. Subsequent runs will
compare against the reference"*), och nämner ingen väg att jämföra två
samtidiga live-renderingar direkt via den högnivå-assertion:en.
([`playwright.dev/docs/test-snapshots`](https://playwright.dev/docs/test-snapshots))

**Men byggstenarna finns redan i vår pinnade version.** Playwright använder
`pixelmatch` under huven för `toHaveScreenshot`, och `pixelmatch` är ett
fristående npm-bibliotek — vilket är precis vad man skulle behöva för att
bygga O1:s pixel-variant utan att gå via `toHaveScreenshot`s baseline-krav:
ta två `page.screenshot()`-buffrar i samma testkörning (en av prototypen, en
av skarpa) och kör `pixelmatch` på dem direkt. Detta är alltså inte en
uppfinning utan samma underliggande mekanik som redan körs i repot idag, bara
använd med två live-buffrar i stället för en fil.

**Ytterligare byggsten, förvånansvärt färsk:** `locator.ariaSnapshot()`
(inte assertion-varianten `toMatchAriaSnapshot`) returnerar YAML-strukturen
**programmatiskt som en sträng** — *"the `locator.ariaSnapshot()` method
returns the YAML string for a given subtree"* — vilket betyder att man kan
anropa den på BÅDA renderingarna i samma testkörning och diffa strängarna
direkt, utan sparad mall. Det är förstapartsbyggstenen bakom O3.
([`playwright.dev/docs/aria-snapshots`](https://playwright.dev/docs/aria-snapshots))

## (b) Granskningsflödet när diffen fäller

**BELAGT, och enhetligt över hela branschen** — mekaniken fäller, en
människa avgör:

- **Chromatic.** *"Reviewers inspect each changed component side-by-side
  (baseline vs. new) and either accept the change as intentional or reject it
  as a bug, with accepted changes becoming the new baselines."* Tre
  visningslägen: side-by-side, overlay, highlight (ändrade pixlar i grönt).
  ([`chromatic.com/docs/visual`](https://www.chromatic.com/docs/visual/))
- **Percy.** *"A baseline is an approved snapshot … all future comparisons
  depend on this reference, so it must be reviewed and intentionally
  accepted."* Godkännande kan ske per snapshot, per grupp, eller för hela
  bygget; godkännande uppdaterar PR-statusen automatiskt.
  ([`browserstack.com/docs/percy`](https://www.browserstack.com/docs/percy/overview/visual-testing-basics))
- **BackstopJS.** `backstop test` → mänsklig granskning av HTML-rapporten →
  `backstop approve` befordrar de ändrade bilderna till nya referensfiler.
  Samma mönster, ingen molntjänst.

**Mappning mot vårt behov.** Detta ÄR precis den form Marcus efterfrågar:
mekaniken avgör bara ATT ytorna skiljer sig, människan avgör VILKEN som är
rätt. Skillnaden mot branschens standardflöde: hos Chromatic/Percy/BackstopJS
är riktningen **symmetrisk** (endera sidan kan vara "rätt", och godkännande
uppdaterar facit permanent). Hos oss är riktningen **asymmetrisk** och redan
låst av `ADR-102`: prototypen ÄR facit tills Marcus säger annat, så ett
"godkännande"-steg hos oss handlar inte om att avgöra vem som har rätt utan
om att bekräfta att skillnaden är åtgärdad — närmare `check-facit.sh`s
`godkand`-fält än Chromatics tvåvägs-baseline-modell.

## (c) Molntjänst kontra lokal drift, och flake-kostnaden av egen drift

**BELAGT — molnkravet är verktygsvalt, inte mönstervalt.**

| Verktyg | Kräver molntjänst? | Belägg |
|---|---|---|
| Chromatic | **Ja, obligatoriskt.** *"Chromatic renders your UI components in a cloud-based browser"* — ingen self-hosted variant nämns i dokumentationen. | [chromatic.com/docs/visual](https://www.chromatic.com/docs/visual/) |
| Percy | **Ja** (BrowserStack-plattform) | [browserstack.com/docs/percy](https://www.browserstack.com/docs/percy/overview/visual-testing-basics) |
| BackstopJS | **Nej.** MIT, körs helt lokalt/i egen CI, ingen extern beroende. | [GitHub: garris/BackstopJS](https://github.com/garris/BackstopJS) |
| Wraith | **Nej.** Apache 2.0, Ruby + ImageMagick, körs helt lokalt. | [GitHub: bbc/wraith](https://github.com/bbc/wraith) |
| Playwright `toHaveScreenshot`/`toMatchAriaSnapshot`/`ariaSnapshot()` | **Nej** — allt körs i vår egen CI redan. | [Playwright.dev](https://playwright.dev/docs/test-snapshots) |
| Argos CI | **Nej för kärnmotorn** (MIT-licensierad, self-hostbar enligt egen dokumentation) — **men jag verifierade inte deras self-host-instruktioner i detalj.** Se § Vad jag inte kunde belägga. | [GitHub: argos-ci/argos](https://github.com/argos-ci/argos) |
| Lost Pixel | **Nej för OSS-läget** — *"There are two deployment modes: Managed (lost-pixel.com) … and open source (@lost-pixel/lost-pixel) where you run it yourself and store baselines in your repo or S3."* **Men:** repot är arkiverat 2026-04-22 (teamet gick till Figma) — se oväntat fynd nedan. | [GitHub: lost-pixel/lost-pixel](https://github.com/lost-pixel/lost-pixel) |
| reg-suit/reg-cli | **Nej** — CLI, MIT, baseline-lagring valfri (lokalt eller S3/GCS). | npm/GitHub (sekundärkälla, ej djupverifierad) |

**Flake-hanteringens kostnadsklass, förstapartskälla (Playwright):**
`maxDiffPixels` (absolut pixelantal), och enligt sekundärkälla även
`maxDiffPixelRatio` (andel av bildytan) och `threshold` (per-pixel
känslighet) — vårt eget `playwright.config.ts:254–255` bär redan
`maxDiffPixelRatio: 0.01` och `maxDiffPixels: 2000`, uttryckligen kommenterat
**OMÄTT** i koden eftersom `test:visual` inte körs i CI (`T87` pausad).
Branschpraxis för att undvika falsk-rött är att stänga av animationer
(`animations: 'disabled'`), maskera dynamiska regioner, och tolerera en liten
ratio för att absorbera anti-aliasing — detta är väl belagt i flera
sekundärkällor men jag hittade ingen förstapartskälla med en specifik
procentsats för "flake minskad X%"; se § Vad jag inte kunde belägga.

**Kostnaden av O1-klassens egen drift** är i praktiken samma som vår redan
körda `manifest-screenshots`/facitkarta-metodik: ingen extra infrastruktur,
ingen molnfaktura, men **ingen persistent baseline-lagring** heller — varje
körning renderar båda sidor från grunden, vilket är billigt (två sidladdningar)
men betyder att O1-klassens verktyg inte "minns" något mellan körningar på
samma sätt som familj 1 gör.

## (d) Story-per-tillstånd som SPEC-bärare

**BELAGT.** Storybook: *"A story captures the rendered state of a UI
component. It's an object with annotations that describe the component's
behavior and appearance given a set of arguments."*
([`storybook.js.org/docs/writing-stories`](https://storybook.js.org/docs/writing-stories))
Storybooks egen blogg beskriver stories som att fånga en sidas *"known good
states"* som teamet kan dela och återvända till vid QA och automatiserad
testning.
([`storybook.js.org/blog/building-pages-in-storybook`](https://storybook.js.org/blog/building-pages-in-storybook/))

**TOLKAT.** Frasen *"single source of truth"* för Storybook i förhållande till
design hittade jag i sekundärkällor (t.ex. Animas blogg, som ställer frågan
"Figma vs Storybook: what's the single source of truth?"), inte ordagrant i
Storybooks egen referensdokumentation jag hämtade. Praktiken den beskriver är
dock väl belagd: en story per tillstånd (inte en jätte-story med allt
inbakat) är det etablerade mönstret, eftersom det gör en visuell diff eller
ett `play`-test möjligt att peka på EN orsak.

**Synkroniseringen mot produktionsytan** sker hos ledarna INTE genom
manuell disciplin utan genom att stories är **exekverbar kod** som byggs och
körs i samma CI som produktionen — driver stories och komponent isär, går
bygget sönder eller (med Chromatic) fälls en visuell diff. Chromatic kopplar
uttryckligen story till Figma-variant på just denna axel: *"Chromatic
connects Storybook stories to Figma variants making it easier to compare
implementation with design and speeding up the handoff process."*
([`chromatic.com/docs/figma-in-chromatic`](https://www.chromatic.com/docs/figma-in-chromatic/))

**Mappning mot oss.** `tasks/sessions/bilagor/s93-hallplats-prototyp/facit.json`
och `scripts/check-facit.sh` är strukturellt en KUSIN till detta mönster: ett
manifest av godkända bild-referenser per yta, mekaniskt verifierat mot disk.
Skillnaden mot Storybook/Chromatic är att vårt manifest inte är kopplat till
en körande komponent-katalog och inte utlöser en pixel-jämförelse — bara att
manifestet stämmer och att markörer inte försvinner (R3–R6-mekaniseringen).
Det är **inte** ett skäl att införa Storybook (se nedan) — bara en observation
om att mönstret redan finns hos oss i miniatyr.

**Storybook självt: redan avvisat, ingen ny trigger.** `ADR-044` avvisade
Storybook av kostnadsskäl (devDependency-träd, `audit-ci`-yta) med re-trigger
*"om primitiverna paketeras som fristående Mm Component Library"*.
`ADR-074` avvisade det en andra gång i samma andetag som den CITERADE
Storybooks story-ID-mönster som inspiration för `?variant=`-designen. Ingen av
de två re-triggerna är berörd av detta pass — jag rekommenderar alltså INTE
att ompröva Storybook, bara att notera att branschens story-per-tillstånd-
mönster redan är approximerat i vårt `facit.json`-manifest.

---

## Mappning mot options-rymden O1–O4 (R8)

| Alt. | Precedent-styrka | Grund |
|---|---|---|
| **O1 — Playwright tvåfönster-diff** | **STARK.** Två oberoende, väletablerade verktyg (BackstopJS, Wraith) existerar SPECIFIKT för detta mönster; sex oberoende Figma-mot-kod-produkter i en angränsande nisch. Vårt eget repo har redan kört en instans (facitkartans metod 2). | Se § (a). **Egenhet vi bär som branschmönstret inte förutsätter:** BackstopJS/Wraiths "referens" är en långlivad URL som fortsätter existera; vår "referens" (prototypen) är medvetet dödsdömd vid `TASK-145.6`. Ett O1-baserat verktyg hos oss är alltså en grind MED UTGÅNGSDATUM — R8-rapporten sa redan detta, branschexemplen bekräftar att det är en avvikelse från hur mönstret normalt används (referens-sidan brukar vara produktionens EGEN långsiktiga jämförelsepunkt, t.ex. "prod" i Wraiths egen dokumentation), inte en svaghet i verktygsklassen. |
| **O2 — Visual snapshot per läge mot samma baslinje** | **STARK på mekaniken, SVAG på tillämpningen här.** `toHaveScreenshot`/Chromatic/Percy är hela familj 1 — branschens dominerande mönster. Men familj 1 är byggd för yta-mot-sitt-EGET-förflutna. Att använda den för prototyp-mot-skarpa kräver att en manuellt curated bild av PROTOTYPEN läggs in som "baseline"-fil i stället för en tidigare CI-körnings egen bild — tekniskt möjligt (`toHaveScreenshot` bryr sig inte om filens proveniens) men jag hittade INGET verktyg eller dokumenterat mönster som gör precis detta explicit. Det är en repurposing, inte ett dokumenterat användningsfall. | Se § (a)+(c). |
| **O3 — DOM-diff (strukturdump)** | **MÅTTLIGT-STARK, och förvånansvärt billig.** `locator.ariaSnapshot()` finns redan i vår pinnade `@playwright/test ^1.62.0` och returnerar YAML programmatiskt — ingen ny dependency krävs. Chromatics TurboSnap bekräftar att "jämför ARIA-snapshots mot en baseline" är etablerad branschmekanik, men även den är familj-1 (mot historik). Ingen tredjepartsprodukt gör "ARIA-snapshot A mot ARIA-snapshot B i SAMMA körning" som färdig produkt — det är en byggsten värd att sätta ihop själv, inte ett känt verktyg. | Se § (a). |
| **O4 — Marcus öga + mekaniserad checklista** | **SVAG som "verktyg" (inget SaaS-verktyg ÄR en checklista), STARK som PROCESS.** Chromatics UI Review och Percys godkännande-flöde är strukturellt samma sak: mekanik fäller en diff, människa avgör. Vårt `facit.json`+`check-facit.sh` är redan en manifest-baserad kusin till Storybooks CSF-manifest (se § (d)). | Se § (b)+(d). Svagheten R8-rapporten redan namngav (manifestet saknar registret/`Deltagare`) är opåverkad av branschforskningen — internt täckningsgap, inte ett designfel i mönstret. |

**Sammanfattat för grillningen:** O1 har den STARKASTE direkta
verktygsprecedenten av de fyra (två hela verktyg byggda för exakt detta), O3
är billigast att bygga eftersom byggstenen redan finns i vår Playwright-
version, O2 kräver en medveten repurposing av ett mönster som branschen inte
använder på det sättet, och O4 är den enda som branschen konsekvent kombinerar
med VILKEN av de andra tre — inget av verktygen ovan ersätter mänsklig
granskning, de förser den med en diff att granska.

---

## Dom

Branschprecedent för R8:s options-rymd är **inte tunn** — det var passets
öppna, omätta hypotes, och den falsifieras här. Precedensen är stark för att
mönstret "jämför två samtida renderingar mot varandra" existerar och är
väletablerat (BackstopJS, Wraith, Figma-mot-kod-QA-klassen), och den mönstret
skiljer sig strukturellt och namngivet från det dominerande
"jämför-mot-historik"-mönstret vår befintliga `test:visual`-svit tillhör.
Detta stärker R8:s ursprungliga observation snarare än att motsäga den: det
är inte förvånande att `test:visual` missade A1–A6, eftersom den tillhör fel
verktygsfamilj för uppgiften — en slutsats som tidigare stod på ren
kod-inspektion och nu står på branschbelägg också.

## Vad jag inte kunde belägga

1. **Att `maxDiffPixelRatio 0.01` minskar flake med en specifik procentsats.**
   Sekundärkällor nämner "80%" men jag hittade ingen förstapartskälla eller
   reproducerbar mätning bakom talet — behandla som marknadsförings-liknande
   blogg-siffra, inte fakta.
2. **Argos CI:s self-host-djup.** Jag verifierade MIT-licens och att
   dokumentationen nämner self-hosting, men läste inte deras
   self-host-instruktioner i detalj — om deras server-komponent (inte bara
   SDK:n) faktiskt går att köra helt utan deras hostade backend är overifierat.
3. **reg-suit/reg-cli** verifierades bara via sekundärkälla (npm/GitHub-
   sammanfattning), inte genom att jag läste källkoden eller README:n direkt.
4. **Storybooks egen dokumentation ordagrant** — jag hittade INTE frasen
   "single source of truth" i förstapartsreferensen, bara i sekundärkällor.
   Se § (d).
5. **Om ADR-074:s re-trigger-villkor** ("konvergens-pass som empiriskt faller
   på två-fönster-formen") ska räknas som utlöst av R8:s fynd. Det är en
   TOLKNINGSFRÅGA för Marcus/grillningen — R8 handlar om en GATING-mekanism
   (regressionsvakt), medan ADR-074:s villkor handlar om ett
   AUTORINGS-verktyg (jämförelse under aktiv divergens). Jag avgör inte om
   de är samma sak.
6. **Faktiska produktionströsklar hos flera branschledare** — jag hittade
   generella riktlinjer (låg ratio, maskering, avstängda animationer) men
   ingen sammanställning av flera namngivna företags faktiska
   produktionsvärden att jämföra vår egen `maxDiffPixels: 2000` mot.

## Oväntat fynd utanför frågan

**Lost Pixel — det mest citerade open source Percy/Chromatic-alternativet —
är arkiverat sedan 2026-04-22.** GitHub-repot bär arkiv-status; teamet gick
till Figma. Detta gjordes inte del av min ursprungliga sökning men dök upp
vid verifiering av self-host-läget. Praktisk konsekvens: Lost Pixel bör INTE
rekommenderas som förstahandsval för ett framtida self-hosted VRT-spår trots
att det historiskt var branschens mest omtalade fria alternativ till
Chromatic/Percy/Applitools — aktivt underhåll kan inte längre antas.
([`github.com/lost-pixel/lost-pixel`](https://github.com/lost-pixel/lost-pixel))

## Rekommendation — märkt som rekommendation, inte beslut

1. **Väg O1 med den starkaste branschtyngden** för en tidsbegränsad grind
   under prototyp-fönstret. Två oberoende, väletablerade verktyg (BackstopJS,
   Wraith) existerar för exakt detta mönster, och repot har redan kört en
   fungerande instans (facitkartans metod 2). Bokför explicit att grinden har
   ett utgångsdatum — den dör med prototypen, precis som R7–R9-rapporten redan
   sa.
2. **Håll isär "prototyp mot skarpa" (R8, familj 2) från "skarpa mot sitt eget
   godkända förflutna" (familj 1, Chromatic-klassen)** i grillningen — de är
   olika frågor med olika verktygsfamiljer, och att blanda ihop dem är
   precis vad som redan hänt en gång (`145.3`/`145.5` DoD #6 pekade mot att
   "ta om baslinjen", vilket löser familj 1:s problem men inte familj 2:s).
3. **O3 är värt en billig spik om O1 känns för tungt.** `locator.ariaSnapshot()`
   finns redan i vår pinnade Playwright-version — noll nya beroenden för ett
   första försök.
4. **Rör inte Storybook-avvisandet.** Inget i detta pass utlöser
   ADR-044:s eller ADR-074:s re-trigger-villkor.
5. **Undvik Lost Pixel** som self-hosted-kandidat om ett sådant spår någonsin
   öppnas — arkiverat projekt, se § Oväntat fynd.

## Källförteckning

**Förstahandskällor:**

- Playwright — [Visual comparisons](https://playwright.dev/docs/test-snapshots) · [ARIA snapshot testing](https://playwright.dev/docs/aria-snapshots)
- Chromatic — [Visual tests](https://www.chromatic.com/docs/visual/) · [Snapshots](https://docs.chromatic.com/docs/snapshots/) · [Figma in Chromatic](https://www.chromatic.com/docs/figma-in-chromatic/) · [TurboSnap](https://www.chromatic.com/features/turbosnap)
- Percy/BrowserStack — [Visual Testing with Percy](https://www.browserstack.com/docs/percy/overview/visual-testing-basics)
- BackstopJS — [GitHub: garris/BackstopJS](https://github.com/garris/BackstopJS)
- Wraith (BBC News) — [GitHub: bbc/wraith](https://github.com/bbc/wraith)
- Lost Pixel — [GitHub: lost-pixel/lost-pixel](https://github.com/lost-pixel/lost-pixel)
- Argos CI — [GitHub: argos-ci/argos](https://github.com/argos-ci/argos)
- Storybook — [Writing stories](https://storybook.js.org/docs/writing-stories) · [Building Pages in Storybook (blogg)](https://storybook.js.org/blog/building-pages-in-storybook/)
- Applitools — [Visual Testing in Figma](https://applitools.com/solutions/figma/)
- Floto — [Design Diff](https://floto.ai/design-diff)
- Uiprobe — [uiprobe.io](https://www.uiprobe.io/)

**Sekundärkällor (märkta TOLKAT i texten där de bär en slutsats):**

- Anima blog — [Figma vs Storybook: single source of truth?](https://www.animaapp.com/blog/industry/what-is-the-single-source-of-truth-storybook-or-figma/)
- Diverse VRT-flake-riktlinjer (bug0.com, testquality.com) — generella trösklar, ej förstapart för specifika procentsatser.

**Interna källor lästa i sin helhet:**

- R7–R9-verifieringspasset (gren `docs/s93-processaudit-underlag`, commit `b39ffa3c`)
- [`eventsidan-prototyp-mot-skarpa-facitkarta-2026-08-07.md`](eventsidan-prototyp-mot-skarpa-facitkarta-2026-08-07.md)
- [`ADR-102`](../decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md)
- [`ADR-074`](../decisions/ADR-074-prototyp-substratets-adress-struktur-och-vaxlar-standard.md)
- [`ADR-044`](../decisions/ADR-044-react-aria-components-demo-route.md)
- `playwright.config.ts:233–258` (våra egna, omätta trösklar)
- `package.json:80` (`@playwright/test ^1.62.0`, den pinnade versionen research:en mättes mot)
