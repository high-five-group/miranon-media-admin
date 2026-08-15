---
owner: marcus803
updated: 2026-08-15
review_by: 2026-11-15
status: draft
---

# Laddningsindikatorer 2026: skeleton, spinner, progress-bar — och prövningen av appens förbud (2026-08-15)

> **Proveniens:** avgränsat research-pass 2026-08-15, kört som subagent i
> worktreen `s102-resume` (delad huvudkatalog ägd av annan levande session,
> se ägarlapp). Ingen kod ändrad, ingen svit körd. Matar Marcus fråga om
> huruvida spec-regeln *"'Laddar…'-textrader och spinners används inte"*
> (`docs/specs/DESIGN-SYSTEM-SPEC.md` §15) håller mot faktisk 2026-praxis.

## Vad jag redan hade — inventering FÖRE sökning

Regeln har redan en fullständig, dokumenterad proveniens i repot — den är
inte ogrundad, men den ÄR obelagd mot externa primärkällor med exakta URL:er.
Läst i sin helhet innan någon websökning gjordes:

- **`docs/specs/DESIGN-SYSTEM-SPEC.md` §15** ("Lugnt laddläge"): den
  gällande regeln, ordagrant citerad i uppdraget.
- **`backlog/tasks/task-7`** (designkortet) och **`task-8`** (PRD:n som
  byggde regeln): visar att regeln föddes ur en Marcus-granskning S62
  (kollapsade Hem-kort med växande "Laddar…"-text = layout-skift) och en
  grillad samsyn S63 Del 2 med **namngivna men INTE URL-belagda** källor:
  "NN/g, Chung, Viget, TanStack-dok+maintainers, OWASP, Roselli, FK".
  Task-8:s "Utanför omfattningen" utesluter uttryckligen
  **"Spinner-/progressbar-komponenter"** ur PRD:ns byggomfattning — det
  säger inte att spinners är förbjudna för evigt i hela appen, bara att de
  inte byggdes i detta kort.
- **`docs/decisions/ADR-078-instant-regeln.md`** (eventsidan, S83, en ANNAN
  yta än Hem): utvidgar principen och skärper den — beslut 4–5 säger
  uttryckligen att där skeleton i slutgeometri är **omöjlig** (listor av
  okänd längd) är prefetch enda vägen och gapet **bokförs öppet i stället
  för att maskeras med spinners**. Detta är den hårdaste formuleringen mot
  spinners i hela repot, och den är en ADR (Accepted), inte bara spec-prosa.
- **Ingen post i `tasks/lessons.md`** nämner skeleton/spinner (verifierat
  via grep) — inget tidigare korrigerat lärdoms-spår att bryta mot.
- **Åldersbedömning:** S63/task-8 är fem veckor gammal (2026-07-11/12),
  ADR-078 är tre veckor (2026-07-24). Design-mönster åldras långsamt (år,
  inte veckor) — ingen premiss bedöms förlegad av tidsförlopp. Det som
  DÄREMOT aldrig gjordes: käll-URL:er verifierade mot originalen. Det är
  exakt vad detta pass tillför.

**Nytt i detta pass:** exakta URL:er + citat för varje namngiven källa,
fem stora designsystems faktiska text (varav flera krävde omvägar då
sajterna är JS-renderade SPA:er), en levande motsägelse i appens EGEN kod
(spinnrar existerar redan, odokumenterat) och en precisering av att
"Chung-empirin" är en informell n=20-blogpost, inte peer-reviewad forskning.

## Kort svar

**Delad dom.** "Aldrig bar 'Laddar…'-textrad utan indikator" håller —
faktiskt bortom branschgolvet, ingen undersökt källa rekommenderar ren text
utan spinner/skeleton/bar som enda laddbesked. Men **"aldrig spinner,
skeleton överallt" är en övergeneralisering** när den läses som en
ovillkorad, app-bred regel. Alla fem stora designsystem som undersöktes
(Material Design 3, Shopify Polaris, IBM Carbon, Apple HIG, FK
Designsystemet) och NN/g:s egen forskning behandlar skeleton och spinner
som **komplementära verktyg för olika yttyper** — inte en hierarki där
skeleton alltid vinner. Spinner är den korrekta, branschledarmässiga formen
för: (a) knapp-intern mutation/submit-feedback, (b) enskilda fristående
moduler (diagram, video, widget) där helskärms-skeleton inte passar, (c)
toaster/menyer/modaler (Carbon utesluter explicit skeleton där), och (d)
innehåll vars slutgeometri genuint är okänd — precis det fall ADR-078 redan
identifierat som "omöjligt" för skeleton men ändå valt att lösa med
prefetch + öppen bokföring snarare än med spinner (en branschmässigt
ovanlig ståndpunkt, se Dom).

**Den avgörande delfrågan** var punkt 5: appen har REDAN en levande
spinner-instans (Loader2, `motion-safe:animate-spin`) i sex auth-route-filer
(`login.tsx`, `glomt-losenord.tsx`, `nytt-losenord.tsx`, `passkey.tsx`,
`valkommen.tsx`, dev-prototypen `VariantB.tsx`) — knapp-intern
submit-feedback. Detta mönster är **exakt** den användning Shopify Polaris
explicit sanktionerar ("spinners should be used for content that can't be
represented with skeleton... white can only be used with small spinners on
actionable components like buttons") och som IBM Carbons "Inline loading"-
komponent bygger på. Mönstret är alltså redan branschkorrekt i praktiken —
men **odokumenterat**: det nämns inte i §15, har ingen ADR, och står i
direkt bokstavlig motsägelse mot spec-radens ordalydelse "spinners används
inte" utan undantag.

## 1. Nielsen Norman Group — response-time-klasser, skeleton, progress

**Response-tidsklasserna** (Miller/NN/g, ["Response Times: The 3 Important
Limits"](https://www.nngroup.com/articles/response-times-3-important-limits/),
hämtad 2026-08-15):

- **0,1 s** — "the limit for having the user feel that the system is
  reacting instantaneously... no special feedback is necessary."
- **1,0 s** — "the limit for the user's flow of thought to stay
  uninterrupted"; "normally, no special feedback is necessary during
  delays of more than 0.1 but less than 1.0 second."
- **10 s** — "the limit for keeping the user's attention"; "percent-done
  progress indicators should be used for operations taking more than about
  10 seconds."

**Skeleton screens** (["Skeleton Screens 101"](https://www.nngroup.com/articles/skeleton-screens/),
hämtad 2026-08-15): "If a page takes less than 1 second to load, skeleton
screens or spinners aren't necessary." Optimalt fönster **2–10 sekunder**.
Kritiskt för matrisen: **"Skeleton screens... are better when the full
screen is loading... Spinners work better on a single module, like a video
or a card which is on a dashboard."** Skeleton avrådes helt för "other
process (e.g., download, upload, convert a file)". NN/g varnar också att
animerade skeletons "can potentially be distracting, annoying, or even
create accessibility problems for some users."

**Progress-indikatorer** (Katie Sherwin,
["Progress Indicators Make a Slow System Less Insufferable"](https://www.nngroup.com/articles/progress-indicators/),
hämtad 2026-08-15): "use a looped indicator [spinner] for delays of 2–9
seconds and a percent-done indicator for delays of 10 seconds or more."
Artikeln nämner INTE skeleton screens alls — den behandlar bara
spinner/progressbar som par, vilket bekräftar att NN/g ser dem som en egen
axel (modul-nivå vs helsides-nivå), inte som konkurrenter till skeleton.
NN/g:s egen jämförande video, ["Skeleton Screens vs. Progress Bars vs.
Spinners"](https://www.nngroup.com/videos/skeleton-screens-vs-progress-bars-vs-spinners/)
(hämtad 2026-08-15), sammanfattar: *"these three loading indicators are
situational tools rather than interchangeable options"* — skeleton för
helsidesladdningar som förhandsvisar layouten, spinner/bar för annat.

**Slutsats mot appens regel:** NN/g:s eget golv för Hem (helskärms-
dashboard, känd layout, 1–10 s-fönster) pekar EXAKT på skeleton — regeln är
korrekt DÄR den föddes. Men NN/g:s egen text pekar lika tydligt på spinner
för "single module... on a dashboard" och avråder skeleton för
download/upload/convert-flöden — inget appen idag hanterar med skeleton,
men som är precis den typ av yta en framtida "exportera lista"-funktion
skulle träffa.

## 2. Stora designsystem

### Material Design 3

Sajten (`m3.material.io`) är en klientrenderad SPA; WebFetch kunde bara
hämta sid-titeln, så nedanstående vilar på WebSearch-syntes av sidans
innehåll (`m3.material.io/components/loading-indicator/guidelines`,
`m3.material.io/components/progress-indicators/guidelines`, hämtat
2026-08-15) — **markerat overifierat ordagrant**, se § Vad jag inte kunde
belägga. Kärnan: M3 har en NY komponent ("Loading indicator", Material 3
Expressive) som **"shows progress that loads in under five seconds and
should replace most uses of the indeterminate circular progress
indicator"** — dvs. en spinner-variant för korta väntetider, separat från
skeleton-mönster (M3 saknar ett namngivet "skeleton"-komponentnamn men
`m1`/community-implementationer använder "placeholder"-mönster). Linjära
indikatorer rekommenderas när "progress can be measured" (fil-uppladdning,
formulär), cirkulära när duration är okänd. Detta är samma axel som NN/g:
determinate när mätbart, annars indeterminate — och en uttalad
komponentklass för KORTA väntetider som explicit ÄR en spinner, inte ett
skeleton.

### Shopify Polaris

`polaris.shopify.com` redirectar (301) till `shopify.dev/docs/api/polaris`,
också en SPA. Innehållet nedan är WebSearch-syntes av
`polaris-react.shopify.com/components/feedback-indicators/spinner` och
`.../skeleton-page`, hämtat 2026-08-15 — **overifierat ordagrant**. Kärnan
är entydig och matchar appens EGNA button-spinners: **"spinners should be
used for content that can't be represented with skeleton loading
components, like for data charts"** och **"the spinner component should
notify merchants that their request has been received and the action will
soon complete, but not be used to give feedback for an entire page
load."** Skeleton (`SkeletonPage` + `SkeletonBodyText` +
`SkeletonDisplayText`) är uttryckligen för **helsides**-innehåll före
laddning — samma "helskärm vs modul"-delning som NN/g.

### IBM Carbon Design System

Enda systemet jag fick **verbatim, servrad HTML** för
(`v10.carbondesignsystem.com/patterns/loading-pattern/`, hämtad
2026-08-15 — v10 är en äldre, server-renderad spegling av den nuvarande
`carbondesignsystem.com/patterns/loading-pattern/`, som är JS-renderad):

> "Skeleton states are simplified versions of components used on an
> initial page load to indicate that the information on the page has not
> fully loaded yet." Begränsat till "container-based components like tiles
> and structured lists or data-based components like data tables and
> cards." **"Never use skeleton states for toast notifications, overflow
> menus, dropdown items, modals, and loaders."**
>
> "Loading indicators signal a user action is processing." Helskärms-
> loading-indikator "when the entire page is processing... often applied
> after data is submitted or saved by the user."

Detta är den enda källan som EXPLICIT förbjuder skeleton för en hel klass
ytor (toast/meny/dropdown/modal) — en gräns appens spec inte drar alls.

### Apple Human Interface Guidelines

`developer.apple.com/design/human-interface-guidelines/progress-indicators`
är också JS-renderad; WebFetch fick bara titeln. WebSearch-syntes (hämtad
2026-08-15, **overifierat ordagrant**): två typer, "Determinate, for a task
with a well-defined duration" och "Indeterminate... for unquantifiable
tasks, such as loading or synchronizing complex data" — rekommendationen är
"when possible, use a determinate progress indicator." Apple har inget
namngivet skeleton-mönster i HIG:s progress-indicators-sida; iOS-appar som
använder skeleton (Facebook, LinkedIn) gör det som eget mönster utanför
HIG:s formella vokabulär.

### FK Designsystemet — appens uttalade golv, verifierat mot källkod

Appens spec citerar "FK saknar skeleton; spinner efter 1 s är deras
mönster" som motivering för att gå "över FK-golvet". Detta verifierades
**mot FK:s egen öppna källkod** (inte bara deras dokumentationssajt), via
`gh api` mot `github.com/Forsakringskassan/designsystem`, hämtat
2026-08-15:

- **`docs/components/load/FLoader.md`** (rådata hämtad direkt): *"En
  laddningsindikator bör visas när det tar mer än en sekund att ladda
  innehållet."* Standardtext: **"Vänligen vänta"**. Fokushantering:
  `role="alert"` på laddtexten som default (mer assertiv än den vanliga
  `role="status"`-konventionen — se § 4).
- **Kodsökning på "skeleton" i samma repo gav 2 träffar, ingen av dem en
  skeleton-komponent** (`scripts/version`, en oralaterad selector-fil) —
  FK har alltså verifierat INGEN skeleton-primitiv. Claimet "FK saknar
  skeleton" är alltså korrekt, mätt mot källkoden, inte bara mot prosa.

Detta stärker regelns proveniens rejält: appen går uttryckligen förbi ett
myndighets-golv den själv är inspirerad av, och det är öppet bokfört (inte
en dold avvikelse). Värt att notera: FK:s EGET mönster är "spinner efter
1 s + text" — dvs. FK parar ALDRIG bar text utan spinner. Det stärker
appens "aldrig bar text"-del ytterligare.

### GOV.UK (jämförelse-DS, samma myndighetsklass som FK)

GOV.UK Design System har **inget formellt loading-mönster i huvudsystemet**
— en "loading spinner"-komponent ligger fortfarande som öppen
community-backlog-post,
[`alphagov/govuk-design-system-backlog#28`](https://github.com/alphagov/govuk-design-system-backlog/issues/28)
(öppnad 2018-01-12, **fortfarande Open** vid hämtning 2026-08-15). Enda
precedentet är GOV.UK Verify, där en spinner + förklarande text visades vid
data-matchning som kunde ta lång tid. Detta är en svag precedent
(oformaliserad, ett enskilt historiskt system, inte längre i drift) — jag
bokför den öppet som tunn, inte som stöd åt någondera sidan.

## 3. Empirisk forskning — inklusive de som INTE stödjer skeleton

### "Chung-empirin" — vad den faktiskt är

Spec-texten citerar "Chung-empirin om shimmer-tempo" med tyngden av
forskning. Källan är **Bill Chungs artikel på UX Collective**,
["Everything you need to know about skeleton screens"](https://uxdesign.cc/what-you-should-know-about-skeleton-screens-a820c45a571a)
(hämtad 2026-08-15) — en bloggpost, inte en peer-reviewad studie. Chungs
egna siffror: **"68% of test participants guessed that the left to right
wave animation represented a shorter duration"**, **"60%... guessed that
the slow wave animation represented a shorter duration"**, **"65%... guessed
that the wave animation [vs. pulse] represented a shorter duration."**
Chung anger själv **n=20 testare per jämförelse** och skriver att
resultaten är **"indicative but not conclusive."** Chung citerar i sin tur
en extern källa för "ribbing"-animation på progressbars: en 2010-studie
(Chris Harrison et al., CHI). Appens val — långsam shimmer V→H, 2,5 s per
svep — är alltså riktningsmässigt konsekvent med Chungs (svaga) fynd, men
"källverifierad forskning" är en överdrift av vad materialet bär. Detta
BÖR inte ändra beslutet (svag evidens som pekar åt rätt håll är fortfarande
bättre än ingen evidens) men bör ändra HUR det citeras i spec-texten.

### Viget (2017) — skeleton kan förlora

["A Bone to Pick with Skeleton Screens"](https://www.viget.com/articles/a-bone-to-pick-with-skeleton-screens)
(hämtad 2026-08-15), det tydligaste motargumentet mot "skeleton alltid
vinner": mobiltest av identisk väntetid, tre varianter (skeleton, spinner,
blank skärm). **"The skeleton screen performed the worst by all
metrics"** — genomsnittlig upplevd väntetid: skeleton 2,82 s, spinner
2,41 s, blank 2,29 s. Efterföljande uppgiftstid (indirekt mått på
kognitiv belastning): skeleton 10,54 s vs spinner 9,49 s. Viget-teamets
egna hypoteser för varför: skeleton var **relativt nytt/ovant** för
testgruppen 2017 (novelty-attention-effekt, sannolikt mindre relevant 2026
när skeleton är väletablerat), fungerar bättre i **redan bekanta**
gränssnitt, och fungerar bäst vid **mycket korta** väntetider. Slutsats:
**"Skeleton screens aren't a silver bullet... and should be used
thoughtfully."** Detta är exakt den empiriska motvikt uppdraget efterfrågade
— skeleton är inte kategoriskt bättre, det är kontext-beroende, vilket
stärker argumentet för en beslutsMATRIS snarare än ett kategoriskt påbud.

### Persson (2019), kandidatuppsats, Linnéuniversitetet

["Improving perceived performance of loading screens through animation"](https://www.diva-portal.org/smash/get/diva2:1333185/FULLTEXT01.pdf)
(hämtad och `pdftotext`-extraherad 2026-08-15, verifierat mot rå PDF-text,
inte bara sammanfattning). Två användbarhetstest, **n=15 + n=45=60 totalt**
— inte den stora studien WebSearch:s auto-sammanfattning först påstod (se
§ Vad jag inte kunde belägga). Testade fem laddanimationer (spinner,
loading bar, "detaljerad" animation, citat-skärm, skeleton). Fynd:
skeleton fick näst flest röster för "snabbast" men även flest röster för
"långsammast" bland de tre "mindre vanliga" alternativen — en blandad,
inte entydig, seger. Slutsats i uppsatsen: *"a skeleton loading screen
could be a fully viable option... [men] due to being added in the second
set... it could not be improved in the same way."* Svag men neutral källa;
bekräftar varken kategoriskt förbud eller kategoriskt påbud.

## 4. Tillgänglighet

### aria-busy / role=status — Roselli-mönstret, verifierat

Sökning bekräftade **exakt det mönster appens Skeleton.tsx redan
implementerar**. MDN/community-konsensus (hämtad via WebSearch 2026-08-15,
Adrian Roselli ["More Accessible Skeletons"](http://adrianroselli.com/2020/11/more-accessible-skeletons.html)
— appens spec länkar till en 404:ad `/skeleton-loading-pattern.html`-URL;
rätt URL är denna): **`aria-busy` stöds dåligt tvärs skärmläsare/webbläsare
— de flesta (utom JAWS) läser upp innehållet i den "upptagna" regionen
ändå INNAN det är klart.** Roscellis rekommenderade mönster: två
syskon-noder (skeleton + riktigt innehåll), skeleton `aria-hidden`, det
laddande innehållet får `aria-busy` OCH är visuellt/AT-dolt tills klart —
precis Skeleton.tsx:s docstring-mönster (`aria-hidden` på blocket,
konsumenten sätter `aria-busy` + `sr-only`-text på containern). **Detta är
korrekt implementerat, redan branschledarmässigt, oavsett skeleton/spinner-
frågan.**

`role="status"` (implicit `aria-live="polite"`) är standardmönstret för
laddbesked som inte ska avbryta ("ARIA22: Using role=status to present
status messages", W3C WAI, refererad via WebSearch 2026-08-15) — detta är
VAD sr-only-textbeskedet bör bäras av, snarare än `role="alert"`
(assertive, avbrytande) som FK:s FLoader faktiskt använder. Ett värt-att-
notera-fynd: FK:s EGET mönster (`role="alert"`) är mer aggressivt än vad
WAI-ARIA-praxis rekommenderar för rutinmässig laddning — ett tecken på att
"följ FK" inte är en garanterad a11y-genväg, ens på det golv appen medvetet
går förbi.

### Reduced motion — WCAG 2.2.2, inte 2.3.3 (verifierat, spec-texten stämmer)

Spec-texten (`Skeleton.tsx`-kommentaren) citerar "WCAG 2.2.2-noten" för
shimmer-animationens `motion-safe:`-gating. Verifierat via WCAG
Understanding-dokumenten (hämtat via WebSearch 2026-08-15): **2.2.2 (Pause,
Stop, Hide) gäller AUTO-spelande rörelse utan användarinteraktion** — exakt
skeleton-shimmerns fall. **2.3.3 (Animation from Interactions) gäller bara
rörelse UTLÖST av en användarhandling** (hover, klick) — inte tillämplig
här. En "laddningsanimation" kan räknas som *essentiell* om den är
skärmens enda innehåll under förladdningsfasen — vilket är precis
undantaget appens `motion-safe:`-gating ändå väljer att INTE luta sig mot:
appen kör strängare än vad 2.2.2:s essentiell-undantag skulle kräva
(animation stängs av helt vid `prefers-reduced-motion: reduce`, oavsett
undantag). **Spec-textens ADR-hänvisning till 2.2.2 (inte 2.3.3) är
korrekt** — ovanligt att se fel citerad SC i praktiken, men här stämmer den.

MDN (`prefers-reduced-motion`, hämtad 2026-08-15) bekräftar mediefrågans
syfte ("minimize... non-essential motion", vestibulära triggers) och att
stödet är "widely available... since January 2020" — ingen bärighetsrisk
i att luta sig på den.

## 5. Syntes — beslutsmatris

| Väntetid | Yttyp | Slutgeometri | Rekommenderat mönster | Källa |
|---|---|---|---|---|
| < 1 s | Alla | — | **Ingen indikation** | NN/g (3 limits + Skeleton 101) |
| 1–10 s | Helsida/hel vy, känd layout | Känd | **Skeleton i slutgeometri** | NN/g Skeleton 101 · M3 · Polaris SkeletonPage · Carbon |
| 2–9 s | Enskild fristående modul (kort, diagram, widget på en dashboard) | — | **Spinner** på modulen, inte helsides-skeleton | NN/g Skeleton 101 (explicit) · NN/g Progress Indicators |
| 1–10 s | Lista av **okänd** längd | Okänd | Skeleton **omöjlig** i slutgeometri → prefetch eller spinner + öppet bokfört gap (aldrig bara tystnad) | ADR-078 (repo, prefetch-vägen) · NN/g avråder skeleton här |
| ≥ 10 s | Mätbar delprocess (export, uppladdning) | Känd % | **Determinate percent-done-bar** | NN/g (10 s-regeln) · Apple HIG · M3 linjär |
| ≥ 10 s | Icke-mätbar process | Okänd % | **Indeterminate spinner/loader + text** | FK FLoader ("Vänligen vänta") · NN/g fallback |
| Knapp-intern mutation (submit, spara, betala, radera) | — | — | **Liten, kontained spinner INUTI knappen** | Polaris Spinner (explicit) · Carbon Inline loading · appens EGEN auth-kod (redan i bruk) |
| Toast / dropdown / meny / modal | — | — | **Aldrig skeleton** — spinner eller inline-laddning | Carbon (explicit uteslutning) |
| Infinite scroll / "ladda fler" | Listbotten | Okänd (växer) | Liten spinner vid listbotten | Branschkonvention (härlett ur modul-regeln, ingen enskild primärkälla hittad specifikt för infinite scroll) |
| Bar text utan spinner/skeleton/bar | Alla | — | **Aldrig** — ingen källa rekommenderar text som ENDA laddbesked | NN/g · FK (text alltid PARAD med spinner) · Carbon |

## Dom: håller det kategoriska förbudet mot branschpraxis?

**Delad dom, inte ett enkelt ja/nej.**

**Håller, och bortom golvet:** "aldrig bar 'Laddar…'-textrad" är
branschledarmässigt — starkare än golvet. Ingen av de fem designsystemen
eller NN/g rekommenderar text UTAN ledsagande indikator som fullständigt
laddbesked; FK:s eget FLoader-mönster (spinner + "Vänligen vänta") bekräftar
att till och med appens uttalade golv aldrig serverar bar text.

**Håller för den yta regeln föddes i:** Hem är en helskärms-dashboard med
känd layout och ett mätt kallstartsfönster > 1 s — det är precis fallet
NN/g pekar på skeleton för ("full screen... gives users a sense of what the
page will look like"), och task-8:s mät-först-disciplin (kallstartsfönstret
låste formbeslutet) är metodmässigt starkare än de flesta av källorna som
undersöktes här.

**Övergeneraliserar som ovillkorad app-bred regel:** varje primärkälla som
diskuterar frågan **delar upp** loading-mönster efter yttyp — helsida
(skeleton) vs modul (spinner) vs knapp-mutation (spinner) vs
toast/modal/dropdown (varken-eller, aldrig skeleton) vs okänd-längd-lista
(varken är helt rätt). "Skeleton överallt, aldrig spinner" utan denna
uppdelning är en regel ingen av de fem undersökta designsystemen skriver
under på. Appens **egen** ADR-078 illustrerar spänningen internt: där
skeleton är "omöjlig" (okänd listlängd) väljer repot ändå INTE spinner —
det är en medveten, dyrare väg (prefetch, öppen bokföring av CLS-gapet)
snarare än branschens vanligaste lösning för just det fallet. Det kan vara
rätt (CLS-nolltoleransen är Marcus egen, dokumenterad hårdare regel — se
ADR-078 § Kontext), men det är då ett SEPARAT, redan fattat beslut om
layout-stabilitet — inte ett bevis för att spinner generellt är fel.

**Levande motsägelse redan i koden:** button-interna Loader2-spinners finns
i sex route-filer, ett mönster som Polaris explicit sanktionerar och Carbon
har en egen komponentklass för ("Inline loading"). Detta är INTE ett fel i
appen — det är branschkorrekt. Felet, om det är ett, ligger i att §15:s
ordalydelse ("spinners används inte", utan kvalificering) inte matchar vad
appen redan gör, och ingen ADR eller spec-rad sanktionerar undantaget.
Antingen döljer prosan en redan existerande, korrekt praxis, eller så är
button-spinnern en oupptäckt avvikelse — triage-kandidat, inte mitt att
avgöra.

## Vad jag inte kunde belägga

- **M3, Polaris (originalsajt), Apple HIG, Carbon (nuvarande version):**
  samtliga är JS-renderade SPA:er där WebFetch bara returnerade
  sid-titeln. Innehållet ovan för dessa fyra vilar på WebSearch:s
  syntetiserade sammanfattningar av sidorna, INTE på verbatim-citat jag
  själv läst i primärtexten. Riktningen bedöms trovärdig (koherent med
  varandra och med NN/g/Carbon-v10:s verifierade text) men är formellt
  overifierad ordagrant.
- **WebSearch producerade minst ett direkt felaktigt syntes-påstående**,
  värt att bokföra som eget fynd: en sökning om skeleton-shimmer-hastighet
  påstod en studie med **"more than 1,400 participants"** och exakta
  animationshastigheter (400–500 ms / 2000–2500 ms / 10 000 ms). Efter att
  ha hämtat och `pdftotext`-extraherat den faktiska PDF:en (Persson 2019)
  visade sig detta vara **fabricerat eller sammanblandat med en annan
  källa** — den verkliga uppsatsen har n=60 och testar fem HELA
  animationstyper, inte tre shimmer-hastigheter. Detta är en konkret
  instans av "mät hellre än citera": WebSearch:s egen sammanfattning var
  inte pålitlig utan efterverifiering mot primärkällan.
- **GOV.UK/Försäkringskassan-klassens myndighets-DS:** FK verifierades mot
  källkod (starkt belägg). GOV.UK saknar ett skarpt, aktivt mönster — precedent
  är tunn (en stängd-av-drift-tjänst, en fortfarande öppen backlog-issue
  sedan 2018). Bokfört öppet, inte gissat som stöd åt någondera sidan.
  Inget svenskt/nordiskt myndighets-DS utöver FK undersöktes (t.ex.
  Skatteverket, Digg) — utanför uppdragets scope, men värt att notera som
  outforskad yta.
  Ordlista: "GOV.UK/Försäkringskassan-klassens" avser i uppdraget
  jämförbara myndighets-designsystem, inte att GOV.UK och FK delar
  organisation.
- **Infinite scroll-specifik primärkälla:** matrisens rad för "ladda
  fler"-mönstret är härledd analogt ur modul-regeln (NN/g), inte styrkt av
  en källa som uttryckligen diskuterar infinite scroll.
- **Adrian Rosellis exakta artikel-URL** i appens Skeleton.tsx-kommentar
  pekar mot ett mönster men ingen exakt URL fanns i koden att verifiera;
  jag har istället verifierat mot `adrianroselli.com/2020/11/more-accessible-skeletons.html`,
  som matchar innehållet task-7/spec beskriver. Om spec-texten internt
  refererar en annan Roselli-artikel har jag inte kunnat kontrollera det.
- **Räckvidden av "12 ytor"** (uppdragets premiss) mättes till **32
  produktionsfiler** (exkl. dev-/prototyp-mappar) som fortfarande innehåller
  "Laddar"-text — inte 12. Siffran kan syfta på route-nivå-ytor snarare än
  komponentfiler (flera filer per route), vilket jag inte har underlag att
  räkna om till; bokfört som en mätt avvikelse, inte en korrigering av
  uppdraget.

## Rekommendation (ej beslut)

1. **Skärp §15:s ordalydelse** från ett ovillkorat "spinners används inte"
   till en explicit yttrappa (matrisen ovan): skeleton för helskärms-/hel-
   vy-laddning med känd layout (nuvarande scope, håll den), spinner
   sanktionerat för knapp-intern mutation och fristående moduler.
2. **Dokumentera button-spinner-mönstret som avsett undantag** i §15 (eller
   en egen kort sektion) snarare än att lämna det som en tyst, odokumenterad
   motsägelse mot spec-texten — antingen som en primitiv (`Button
   isLoading`-prop) eller som en uttryckligt sanktionerad, upprepad kod-idiom.
3. **Precisera käll-citeringen** för "Chung-empirin" i Skeleton.tsx/spec
   till vad den faktiskt är (en bloggpost, n=20, författaren själv kallar
   fynden "indicative but not conclusive") — beslutet (långsam shimmer V→H)
   behöver inte ändras, bara hur säkert det framställs.
4. **Ta upp ADR-078:s "aldrig spinner ens vid omöjlig skeleton-geometri"**
   som en explicit grillnings-fråga: är det en genomtänkt, dyrare
   CLS-prioritering (rimligt, redan bokfört i ADR-078), eller ett oavsiktligt
   utsträckt "aldrig spinner" som smugit in sig från §15:s ordalydelse in i
   en annan ADR utan egen prövning?
5. **Migrera de 32 kvarvarande "Laddar…"-filerna** enligt task-8:s egen
   "Migrerings-kandidater"-lista — oavsett hur §15 nyanseras, är bar text
   utan skeleton/spinner under branschgolvet överallt, inte bara på Hem.

## Öppna frågor för grillning

- Ska §15 formellt nyanseras till en yttrappa, eller är den avsiktligt
  strikt som en enkel, lätt-att-följa regel för en ensam icke-teknisk
  underhållare (Gunilla-principen: enkelhet kan vara ett medvetet val även
  när det är strängare än branschsnittet)?
- Kvalificerar §15/ADR-078:s spinner-förbud för ADR-baren (svårt att
  återställa + överraskande + verklig avvägning) givet att det nu är
  app-brett och redan motsagt av levande kod — eller är nuvarande
  spec-+PRD-nivå tillräcklig?
- Ska button-spinnern formaliseras som Button-primitivens `isLoading`-prop
  (bibliotekskvalitet, 11/11/11) eller kvarstå som per-route-idiom?

## Källförteckning

- NN/g, ["Response Times: The 3 Important Limits"](https://www.nngroup.com/articles/response-times-3-important-limits/) — hämtad 2026-08-15
- NN/g, ["Skeleton Screens 101"](https://www.nngroup.com/articles/skeleton-screens/) — hämtad 2026-08-15
- NN/g (Katie Sherwin), ["Progress Indicators Make a Slow System Less Insufferable"](https://www.nngroup.com/articles/progress-indicators/) — hämtad 2026-08-15
- NN/g, ["Skeleton Screens vs. Progress Bars vs. Spinners" (video)](https://www.nngroup.com/videos/skeleton-screens-vs-progress-bars-vs-spinners/) — hämtad 2026-08-15
- Material Design 3, [Loading indicator guidelines](https://m3.material.io/components/loading-indicator/guidelines) — hämtad 2026-08-15 (WebSearch-syntes, ej verbatim, se § Vad jag inte kunde belägga)
- Material Design 3, [Progress indicators guidelines](https://m3.material.io/components/progress-indicators/guidelines) — hämtad 2026-08-15 (WebSearch-syntes)
- Shopify Polaris, [Spinner](https://polaris-react.shopify.com/components/feedback-indicators/spinner) — hämtad 2026-08-15 (WebSearch-syntes)
- Shopify Polaris, [Skeleton page](https://polaris-react.shopify.com/components/feedback-indicators/skeleton-page) — hämtad 2026-08-15 (WebSearch-syntes)
- IBM Carbon Design System, [Loading pattern (v10, servrad HTML, verbatim)](https://v10.carbondesignsystem.com/patterns/loading-pattern/) — hämtad 2026-08-15
- Apple Human Interface Guidelines, [Progress indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators) — hämtad 2026-08-15 (WebSearch-syntes)
- Försäkringskassans Designsystem, [`FLoader.md` (källkod, verbatim)](https://github.com/Forsakringskassan/designsystem/blob/main/docs/components/load/FLoader.md) — hämtad 2026-08-15 via `gh api`
- GOV.UK Design System Community Backlog, [Loading spinner, issue #28](https://github.com/alphagov/govuk-design-system-backlog/issues/28) — hämtad 2026-08-15 (Open)
- Bill Chung, ["Everything you need to know about skeleton screens"](https://uxdesign.cc/what-you-should-know-about-skeleton-screens-a820c45a571a), UX Collective — hämtad 2026-08-15
- Viget, ["A Bone to Pick with Skeleton Screens"](https://www.viget.com/articles/a-bone-to-pick-with-skeleton-screens) (2017) — hämtad 2026-08-15
- Samantha Persson, ["Improving perceived performance of loading screens through animation"](https://www.diva-portal.org/smash/get/diva2:1333185/FULLTEXT01.pdf), kandidatuppsats Linnéuniversitetet (2019) — hämtad och textextraherad 2026-08-15
- Adrian Roselli, ["More Accessible Skeletons"](http://adrianroselli.com/2020/11/more-accessible-skeletons.html) (2020) — refererad via WebSearch 2026-08-15
- W3C WAI, ["ARIA22: Using role=status to present status messages"](https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA22) — refererad via WebSearch 2026-08-15
- MDN, [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — hämtad 2026-08-15
- W3C WAI, [Understanding SC 2.2.2: Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) — refererad via WebSearch 2026-08-15

**Repo-interna källor lästa i sin helhet:** `docs/specs/DESIGN-SYSTEM-SPEC.md`
§15 · `backlog/tasks/task-7` · `backlog/tasks/task-8` ·
`docs/decisions/ADR-078-instant-regeln.md` ·
`tasks/sessions/archive/2026-07/2026-07-11-session-62.md` Del 4 ·
`src/components/primitives/Skeleton.tsx`.
