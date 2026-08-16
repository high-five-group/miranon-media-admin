---
owner: marcus803
updated: 2026-08-16
review_by: 2026-11-16
status: draft
---

# Förberedelseskärmen: hur branschledare komponerar en app-prep-skärm — och övergången in i appen (2026-08-16)

> **Proveniens:** avgränsat research-pass 2026-08-16, kört OISOLERAT i
> huvudkatalogen (gren `main`, commit `0fa3e58a`, rent arbetsträd).
> Matar Marcus fyra designfrågor ur granskningen av den redan byggda
> Förberedelseskärmen (`src/components/AppShell/Forberedelseskarm.tsx`,
> TASK-218/TASK-219, ADR-112, ADR-113). Ingen kod ändrad, inget test kört.

## Vad jag redan hade — inventering FÖRE sökning

Tre repofiler bar redan merparten av underlaget, lästa i sin helhet innan
någon websökning gjordes:

- **[`loading-indikator-branschpraxis-2026-08-15.md`](loading-indikator-branschpraxis-2026-08-15.md)**
  (2026-08-15, dagen före): käll-verifierad genomgång av NN/g, Material 3,
  Polaris, Carbon, Apple HIG och FK för INDIKATOR-VALET (skeleton vs
  spinner vs determinate bar) och tillgänglighet (`role="status"`,
  reducerad rörelse). Detta pass DUPLICERAR inte den frågan — den är
  redan besvarad och citeras här bara där den är direkt relevant
  (färg-avsnittet, artighetsnivån). Åldern är en dag; inget i den bedöms
  förlegat.
- **[`app-startup-warmup-splash-2026-08-15.md`](app-startup-warmup-splash-2026-08-15.md)**
  (samma dag): käll-verifierad genomgång av VARFÖR/NÄR en blockerande
  startvärmning är motiverad (Airtable-latensen), och av Linear/Figma/
  Notions ARKITEKTUR (progressiv, icke-blockerande uppstart som den
  dominerande branschriktningen — vårt val är ett medvetet avsteg). Den
  passet uttryckligen INTE besvarade: hur splashens YTA komponeras
  visuellt (logo-placering, färg, övergångsanimation). Det är precis vad
  detta pass tillför — komplement, inte upprepning.
- **`docs/specs/DESIGN-SYSTEM-SPEC.md` §15** (Laddtrappan) + **ADR-112**
  (Förberedelseskärmen) + **ADR-113** (Laddtrappan): den låsta texten
  ("Förbereder ditt administrationsverktyg"), determinate "X av Y"-formen
  (inte en rå procentsiffra), gold-11-fyllnaden med dokumenterat
  kontrast-skäl, och `role="status"`/polite-artigheten är redan BESLUTADE
  — detta pass prövar dem mot extern praxis, det river dem inte i förväg.
- **`src/components/AppShell/Forberedelseskarm.tsx`** (läst i sin helhet):
  nuvarande komposition är centrerad logotyp (ordmärke) → progress-bar →
  låst textrad, allt i en `flex-col items-center justify-center`-kolumn.
  Ingen övergångsanimation finns i koden mellan skärmen och appen — se
  nästa punkt.
- **`src/main.tsx` (`InnerApp`)** (läst i sin helhet): övergången är i dag
  en HÅRD SWAP — `if (gate.typ !== 'redo') return <Forberedelseskarm ... />`
  annars `return <RouterProvider ... />`. Ingen crossfade, ingen
  stagger, ingen opacity-övergång. Detta är den konkreta koden fråga 4
  ska ge ett källbelagt svar mot.
- **In-house motion-precedent, hittat vid grep, INTE tidigare kopplat till
  denna fråga:** `--animate-mm-avsloj` (`src/styles/tailwind.css` rad
  137–147) — en redan etablerad "reveal"-animation (`opacity 0→1` +
  `translateY(8px)→0`, `0.2s ease-out`) som används i FEM av de sex
  auth-route-filerna (`login.tsx`, `glomt-losenord.tsx`,
  `nytt-losenord.tsx`, `passkey.tsx`, `valkommen.tsx`). Plus
  `--p-ease-default: cubic-bezier(0.4, 0, 0.2, 1)` i
  `src/styles/tokens/primitives.css` — samma kurva-familj som Material
  Designs klassiska "standard"-easing. Detta är ett NYTT fynd i detta
  pass: appen har redan en färdig, konsekvent reveal-idiom den kan
  återanvända i stället för att uppfinna en ny för splash→app-övergången.

**Nytt i detta pass:** primärkälle-verifiering av splash-KOMPOSITION
(logo/indikator/text-placering) hos OS-nivå-launch-screens (Android,
Apple, Meta Horizon OS — de enda tre med formella, skrivna
designriktlinjer för just detta), progress-bar-FÄRG hos tre designsystem,
och övergångs-mönster (duration/easing/reduced-motion) — samt en ärlig
bokföring av att desktop/webb-produktivitetsappar (Linear, Slack, Notion,
Figma, Arc) **saknar publicerad, förstaparts design-dokumentation för sina
egna prep-skärmar**. Det är inte en lucka i sökningen — det är precis den
tunna precedent-rymd uppdraget bad mig deklarera öppet.

## Kort svar

1. **Komposition:** centrerad logo/ikon över en indikator är etablerat —
   men bara i EN annan produktklass (OS-nivå launch screens och
   mobilapp-splashar), inte hos desktop-/webb-produktivitetsappar, som i
   stället nästan aldrig visar en distinkt prep-skärm alls. Precedensen
   för EXAKT vår komposition (logo → determinate bar → statustext,
   staplat, centrerat) är starkast hos **installerare** (macOS/Windows/
   JetBrains-familjen), en angränsande men inte identisk produktklass;
   ingen av de fem namngivna branschledarna (Linear, Slack, Notion,
   Figma, Arc) har en verifierad, dokumenterad splash-komposition att
   jämföra mot.
2. **Procent-räknare:** ingen undersökt källa visar en rå %-siffra på en
   prep-skärm. NN/g sanktionerar determinate percent-done för ≥10 s och
   FLERSTEGS-förlopp specifikt (vårt fall: 7 kända anrop) — vår "X av Y
   hämtningar klara"-form är en konkretare, mer begriplig variant av
   exakt det NN/g beskriver, inte en avvikelse från det.
3. **Färg:** tre av tre undersökta designsystem med explicit vägledning
   (Carbon, Polaris, Apple HIG) låter progress-FYLLNADEN bära
   varumärkes-/interaktionsfärg, medan SPÅRET är neutralt/dämpat — ingen
   källa förespråkar en helt gråskalig fyllnad. Vårt gold-11-mot-neutralt-
   spår-val ligger i linje med samtliga tre, inte mot dem.
4. **Övergången:** den STARKASTE, mest konkreta källan (Meta Horizon OS
   splash-riktlinjer, verbatim) säger uttryckligen "implementera en
   fade-in-animation ... i stället för att abrupt visa appens gränssnitt"
   — vår nuvarande kod gör exakt den avrådda hårda swappen. Reduced-
   motion-konsensus (flera samstämmiga tredjepartskällor + Apples egen
   dokumenterade praxis) är att BYTA en skala/glid-övergång mot en enkel
   crossfade under `prefers-reduced-motion`, inte att ta bort övergången
   helt.

## 1. Komposition — logo, indikator, stegtext

### OS-nivå launch screens (de enda med formell, skriven spec)

**Android** (Android Developers, [Splash screens](https://developer.android.com/develop/ui/views/launch/splash-screen),
hämtad 2026-08-16, verbatim WebFetch): appikonen är **centrerad**
("App icon: must be a vector drawable", positionerad centralt över en
"window background" av en enda opak färg). Ett brandnings-bildstöd finns
(`windowSplashScreenBrandingImage`, botten av skärmen) men källan citeras
verbatim: **"the design guidelines recommend against using a branding
image."** Om progressindikator: **"The splash screen must only be
dismissed with onResume() when the app is stable from a visual
standpoint, so no additional spinners are needed. Introducing an
incomplete interface can be jarring."** Ikon-animationen (om någon)
begränsas till max 1000 ms, med en icke-animerad loop-variant om
uppstarten drar ut på tiden.

**Apple** (Human Interface Guidelines — Progress Indicators, hämtad
2026-08-16 via community-spegling
[`codershigh.github.io`](https://codershigh.github.io/guidelines/ios/human-interface-guidelines/ui-controls/progress-indicators/index.html);
`developer.apple.com`s egen sida är en JS-renderad SPA som bara gav
sidtiteln vid direkt WebFetch, **markerat overifierat mot originalet**):
**"If activity is quantifiable, use a progress bar instead of an
activity indicator so people can better gauge what's happening and how
long it will take."** Ingen egen "launch screen"-sida med
komposition-regler kunde hämtas (404 på `/launch-screens` och
`/launching`); Apples LAUNCH SCREEN-koncept (statisk storyboard som ser
ut som appens första skärm) är ett annat mönster än ett dedikerat
prep-UI med logo+bar — se § Vad jag inte kunde belägga.

**Meta Horizon OS** (Meta for Developers,
[Splash screen best practices](https://developers.meta.com/horizon/design/mr-splash-screen-bp/),
hämtad 2026-08-16, verbatim WebFetch — VR/MR-plattform, men det ENDA
tredje OS-leverantörsdokumentet med skriven splash-vägledning som hittades):
tillåter en loading-indikator för längre initiering ("it can be plain
passthrough with a loading indicator, such as three dots") men ger ingen
regel om logo-centrering specifikt för prep-fasen.

**Slutsats för OS-nivå-källorna:** samtliga tre beskriver en **kort,
system-ägd app-ikon-flash** (delar av en sekund till några sekunder),
inte en flerstegs data-laddningsskärm. Android avråder UTTRYCKLIGEN från
både brandning och progressindikator på just DEN ytan — men av ett skäl
som inte gäller oss: deras splash existerar bara för att maskera
processstart/window-inflation, inte för att kommunicera ett verkligt,
flersekunders nätverksförlopp. Att läsa Androids "inga spinners"-regel
som ett argument mot VÅR determinate bar vore att blanda ihop två olika
produktklasser — vår skärm har genuint mätbart innehåll att visa progress
för (7 kända anrop), Androids har inget sådant innehåll alls.

### Mobilapp-splash (sekundärkälla, ej primärkälla)

UXPin, [Splash Screen Design: Best Practices, Examples, and Guidelines
(2026)](https://www.uxpin.com/studio/blog/splash-screen/) (hämtad
2026-08-16, marknadsförings-/designblogg, **inte en primärkälla** —
bokfört som sekundär): namnger Slack ("hashtag logo on a brand-colored
background with a subtle animation"), Instagram, Spotify, Duolingo — alla
med **centrerad logo/ikon på en enfärgad eller varumärkesfärgad bakgrund**,
utan nämnd progressbar. Mönstret är konsekvent (centrerad logo, minimal
chrome) men artikeln ger ingen teknisk detalj om indikator-typ eller
övergång, och är inte verifierad mot förstapartskällan för någon av de
fyra apparna.

### Desktop-/webb-produktivitetsappar — precedensen är TUNN, deklarerat öppet

Ingen av de fem namngivna branschledarna (Linear, Slack, Notion, Figma,
Arc) har en verifierad förstaparts-beskrivning av sin egen visuella
prep-skärms komposition:

- **Linear** — den enda med en teknisk tredjepartsgenomgång
  ([performance.dev, "How's Linear so fast?"](https://performance.dev/how-is-linear-so-fast-a-technical-breakdown),
  redan citerad i går-passet, återhämtad idag med fokus på KOMPOSITION):
  verbatim-citerad CSS: `@keyframes logoBackgroundPulse { 0% { opacity:
  0; transform: scale(0.8); } 70% { opacity: 1; } 100% { opacity: 0;
  transform: scale(1.0); } }` — en pulserande logotyp, INGEN bekräftad
  progressbar eller procentsiffra. Artikeln bekräftar uttryckligen att
  den INTE beskriver om en progressbar/spinner förekommer. Linears
  mönster är dessutom arkitektoniskt en helt annan sak än vårt (se
  gårdagens pass): boot-skärmen är en OMEDELBAR, redan-themad
  CSS/JS-shell utan nätverksanrop, inte en väntan på 7 riktiga hämtningar.
- **Figma** — förstapartsbloggen om filladdning
  ([Speeding up file load times](https://www.figma.com/blog/speeding-up-file-load-times-one-page-at-a-time/),
  refererad i går-passet) beskriver INTE den visuella laddskärmens form.
- **Notion** — förstapartsbloggen om offline-läge (refererad i går-passet)
  beskriver INTE en online-uppstartsskärm.
- **Slack, Arc** — ingen förstaparts- eller trovärdig tredjepartskälla
  med kompositionsdetaljer hittades trots riktad sökning
  (`"loading screen" OR "splash screen" ... Notion Slack Figma Arc
  comparison`, `Arc browser splash screen`). Sökningarna gav generiska
  SEO-designbloggar utan appspecifikt innehåll.

**Detta är en genuin lucka, inte en sökbrist.** Skälet är sannolikt
strukturellt: branschledarna i denna klass undviker medvetet en
blockerande prep-skärm (gårdagens pass), så det finns helt enkelt inget
namngivet UI-objekt för dem att dokumentera. En observationsbaserad
verifiering (öppna respektive app och skärmdumpa uppstarten) gjordes
INTE i detta pass — utanför den research-metod (primärkällor + web) detta
pass är avgränsat till; bokfört som öppen punkt, inte gissat.

### Slutsats för fråga 1

Vår komposition — centrerad logotyp, sedan determinate bar, sedan
statustext, staplat vertikalt i mitten av skärmen — matchar
**installerar-/mobilapp-splash-konventionen** (logo som varumärkes-ankare
överst, förloppsbesked därunder), inte något dokumenterat
desktop-webbapp-mönster (för sådant finns det ingen dokumenterad
komposition att matcha). Det är en rimlig, angränsande precedent — men
den ska beskrivas som just det: lånad från en näraliggande produktklass
(installerare/mobilapp-splash), inte kopierad från de fem namngivna
konkurrenternas egna, odokumenterade lösningar.

## 2. Procent-räknare kontra stegtext kontra ren indikator

Gårdagens pass etablerade redan NN/g:s regel (Sherwin, ["Progress
Indicators Make a Slow System Less Insufferable"](https://www.nngroup.com/articles/progress-indicators/)):
looped indikator för 2–9 s, **percent-done för ≥10 s**, och att
percent-done UNDER 10 s ändå är motiverat vid "several documents or
records ... processed in sequence" — precis vårt fall (7 frikopplade
hämtningar). Detta pass upprepar inte den analysen men lade till en
korroborerande tredje källa:

**Pencil & Paper**, [UX Design Patterns for Loading](https://www.pencilandpaper.io/articles/ux-pattern-analysis-loading-feedback)
(hämtad 2026-08-16, verbatim WebFetch, designbyrå-artikel med namngivna
produktexempel — sekundärkälla men med konkret produktförankring):
bekräftar samma tröskel-logik ("Progress bars ... work well ... for
2-10 second waits"; "Percent-done indicators ... for 10+ second tasks,
giving users a sense of scale") och namnger **WeTransfer** som exempel på
"upload percent-done loader" för filöverföring — en process med kända
diskreta steg, samma struktur som vår 7-hämtningars-warmup. Ingen av de
namngivna produkterna (Google Drive, Gmail, Jira, Webflow, Unsplash,
WeTransfer) visar en rå %-siffra på en APP-PREP-skärm specifikt — bara på
enskilda, avgränsade processer (filöverföring) inuti en redan laddad app.

**Slutsats:** ingen källa (varken idag eller igår) visar exempel på en
naken procentsiffra som ENDA laddbesked på en app-prep-skärm. Mönstret
som återkommer är antingen (a) en bar utan synlig siffra, eller (b) en
bar + en KONKRET beskrivning av vad som händer ("X av Y", "laddar
dokument 3 av 5"), aldrig en abstrakt "47 %" utan sammanhang. Vår "X av Y
hämtningar klara"-text är alltså MER informativ än en ren
procentsiffra skulle vara, och ligger fortfarande inom det
NN/g-fönster gårdagens pass redan låste fast. Determinate är rätt val
här specifikt EFTERSOM vi har äkta, kända delsteg (7 anrop) — indeterminate
hade varit rätt om delstegen vore okända eller ett enda odelbart anrop,
vilket redan var gårdagens pass slutsats och inte omprövas här.

## 3. Färg — varumärkes-accent kontra neutral/grå

**IBM Carbon Design System** (v10, servrad HTML, verbatim WebFetch,
hämtad 2026-08-16,
[`v10.carbondesignsystem.com/components/progress-bar/style/`](https://v10.carbondesignsystem.com/components/progress-bar/style/)):
fyllnaden (aktiv bar) bär token **`$border-interactive`** (en
varumärkes-/interaktionsfärg), spåret bär **`$border-subtle`** (neutral,
dämpad). Status-varianter (success/error) byter till semantiska
stödfärger, men DEFAULT-fyllnaden är alltså INTE neutral/grå — den är
uttryckligen den interaktiva/varumärkesbärande tonen.

**Shopify Polaris** (WebSearch-syntes av
[`polaris-react.shopify.com/.../progress-bar`](https://polaris-react.shopify.com/components/feedback-indicators/progress-bar?example=progress-bar-colored)
samt [GitHub-diskussion #10049](https://github.com/Shopify/polaris/issues/10049),
hämtad 2026-08-16, **ej verbatim** — se § Vad jag inte kunde belägga):
komponenten har en `tone`-prop (`highlight` som default, plus `primary`,
`success`, `critical`) — dvs. ALLTID en semantiskt vald färg, aldrig ett
neutralt grått default. Polaris tvingar med andra ord ett medvetet
färgval snarare än att erbjuda "ingen färg" som ett förstahandsalternativ.

**Apple HIG** (community-spegling, samma källa som § 1): **"A progress
bar's appearance can be adjusted to match your app's design. You can
specify, for example, a custom tint or image for both the track and
fill."** Ingen uttrycklig regel om varumärkesfärg KONTRA neutral, men
customiseringen är uttryckligen TILLÅTEN och namngiven ("tint") snarare
än avrådd.

**Material Design 3** var redan (gårdagens pass) overifierat verbatim för
sin "Loading indicator"/"Progress indicators"-sidor (JS-renderad SPA);
detta pass gjorde inget nytt försök att verifiera M3:s färgregel
specifikt och räknar den fortsatt som obelagd för just denna delfråga.

**Slutsats:** tre av tre källor med en verifierbar regel (Carbon
verbatim, Polaris syntes, Apple verbatim-mirror) pekar åt SAMMA håll:
progress-FYLLNADEN bär en avsiktlig, färgad (ofta varumärkes-/
interaktionsanknuten) ton, spåret/tracket är det neutrala elementet.
Ingen källa förespråkar en helt gråskalig fyllnad som "lugnare" eller
"renare" — "lugn stil" uppnås i samtliga tre system genom ett DÄMPAT
spår, inte genom en avfärgad fyllnad. Vårt val (gold-11-fyllnad mot ett
neutralt `--mm-bg-muted`-spår, redan kontrastmätt i komponentens
docstring) matchar mönstret exakt: färgad signal, neutral bakgrund.

## 4. Övergången splash → app

### Vad den starkaste källan säger, verbatim

**Meta Horizon OS** (samma sida som § 1, verbatim WebFetch, hämtad
2026-08-16): **"Implement a fade-in animation during the app load
instead of abruptly displaying the app's interface. This not only looks
more polished but also eases the transition."** Detta är den enda
källan i hela passet (idag + igår) som ger en EXPLICIT regel för just
övergångs-STEGET (inte bara indikator-valet), och den pekar rakt mot en
brist i nuvarande kod: `src/main.tsx`s `InnerApp` gör i dag en villkorlig
`return`-växling mellan `<Forberedelseskarm />` och
`<RouterProvider />` utan någon mellanliggande opacity- eller
fade-övergång — precis det mönstret källan avråder ifrån.

Samma källa ger ingen exakt duration/easing för fade-in:et — det förblir
en kvalitativ rekommendation, inte en mätbar specifikation.

### Duration/easing — Material 3, delvis obelagt

Material 3s egna duration-/easing-token-sidor
(`m3.material.io/styles/motion/easing-and-duration/tokens-specs`,
`.../motion/overview/specs`) är JS-renderade SPA:er som gav enbart
sidtiteln vid WebFetch — **samma begränsning gårdagens pass redan
dokumenterade för M3:s sajt i stort.** Nedanstående vilar på
WebSearch-syntes, **overifierat ordagrant mot originalet**:

- Duration-skala: short (~50–100 ms), medium (~250–300 ms), long
  (~450–500 ms).
- Easing: "standard" (`cubic-bezier(0.2, 0, 0, 1)`) för
  mikrointeraktioner (ripple, ikon-toggles); "emphasized"
  (`cubic-bezier(0.2, 0, 0, 1.5)` i syntesen — notera: detta avviker från
  standard cubic-bezier-formen där sista värdet normalt håller sig
  inom 0–1, vilket antyder en overshoot-kurva; **inte verifierat mot
  originalkällan**, bokfört som osäkert) för innehåll som kommer in i
  vyn: "container transforms and page transitions."
- **Container transform** (Material Motion, WebSearch-syntes av bl.a.
  [`m3.material.io/blog/android-material-motion`](https://m3.material.io/blog/android-material-motion),
  hämtad 2026-08-16): det närmaste Material har ett namngivet mönster
  för "logo-morph"-idén — en beständig behållare (logotyp, kort, FAB)
  vars GRÄNSER animeras till målytans gränser, med inkommande/utgående
  skärm crossfadeade INUTI den animerade behållaren. Mönstret är
  dokumenterat för list→detalj- och FAB→verktygsfält-övergångar, INTE
  namngivet för splash→app specifikt — en analog, inte en direkt
  precedent. Att bygga ett bokstavligt "logotyp morfar till app-chrome"
  vore en TOLKNING av mönstret, inte en dokumenterad tillämpning av det.

### Reduced motion — konsensus, inte en enskild formell spec

Flera samstämmiga tredjepartskällor (CSS-Tricks
[`prefers-reduced-motion`-almanacka](https://css-tricks.com/almanac/rules/m/media/prefers-reduced-motion/),
Smashing Magazine, a11y-with-Lindsey, hämtade via WebSearch 2026-08-16,
**syntes, ej verbatim** för samtliga tre) konvergerar mot samma regel:
byt en skal-/glid-baserad övergång mot en **enkel crossfade** under
`prefers-reduced-motion: reduce` — ta INTE bort besked/feedback helt.
Ett konkret, namngivet precedens som citeras återkommande i sökningarna:
**iOS självt byter sin app-öppnings-zoom mot en fade** när
reducerad rörelse är på. Detta är samma familj av regel som gårdagens
pass redan verifierade mot WCAG 2.2.2 (auto-spelande rörelse ska kunna
stängas av) — ny information här är specifikt att CROSSFADE (inte total
frånvaro av övergång) är den rekommenderade FALLBACK-formen, inte bara
att shimmer/spin ska stängas av.

### Vad vår egen kod redan bär — ett återanvändbart svar

`--animate-mm-avsloj` (`src/styles/tailwind.css`, 0.2 s ease-out,
opacity 0→1 + `translateY(8px)→0`) är redan appens etablerade
"reveal"-idiom för innehåll som kommer in i vyn, i produktion på fem av
sex auth-route-filer. `--p-ease-default: cubic-bezier(0.4, 0, 0.2, 1)`
(`src/styles/tokens/primitives.css`) ligger för övrigt i samma
kurva-familj som Material 3s "standard"-easing (`cubic-bezier(0.2, 0, 0,
1)` per den overifierade synteser ovan — närbesläktad, inte identisk).
En crossfade av `Forberedelseskarm` UT och appens första vy IN, byggd på
`--animate-mm-avsloj` (eller en symmetrisk opacity-only-variant av
samma duration/easing), skulle vara en **konsekvent förlängning av ett
mönster appen redan äger** — inte en ny animationsvokabulär.

### Slutsats för fråga 4

Den enda källan med en explicit regel (Meta Horizon OS) säger rakt ut:
fade in, inte abrupt swap. Vår nuvarande `InnerApp`-kod gör den abrupta
swappen källan avråder ifrån. "Staggered reveal" och "skeleton-handoff"
(uttryckligen efterfrågade i uppdraget) hittade INGEN primärkälla som
namngiven splash→app-teknik — staggered reveal är en generell,
väldokumenterad dashboard-INTRÄDES-teknik (flera sekundärkällor, ingen
splash-specifik), skeleton-handoff är begreppsmässigt redan avgjort av
Laddtrappan (skeleton är ett SEPARAT trappsteg för känd geometri, inte en
splash-övergångsteknik) och prövas inte vidare här. "Logo-morph" har en
analog (container transform) men ingen direkt, namngiven precedent för
just detta användningsfall.

## Dom

**Delad, men mindre delad än frågorna i går.** Tre av fyra delfrågor
(2, 3, och halva 4) har raka, samstämmiga svar över flera oberoende
källor. Fråga 1 (komposition) är den enda där precedensen är genuint
tunn för DEN produktklass frågan efterfrågade (desktop-/webb-appar) —
det starkaste svaret måste lånas från en näraliggande klass
(installerare/mobilapp-splash) snarare än hämtas direkt från Linear,
Slack, Notion, Figma eller Arc.

1. **Komposition** — centrerad logo → indikator → text är etablerat hos
   OS-launch-screens och mobilapp-splash, INTE verifierat hos de fem
   namngivna desktop-/webbledarna (ingen av dem dokumenterar sin
   prep-skärm). Vårt val är en rimlig, angränsande-precedensbaserad
   komposition — inte en kopia av en konkurrents dokumenterade lösning,
   för ingen sådan dokumentation existerar.
2. **Procent-räknare** — håller. Ingen källa visar en naken %-siffra på
   en prep-skärm; vår "X av Y"-form är MER konkret än vad NN/g:s egen
   percent-done-regel kräver, inte mindre.
3. **Färg** — håller, och är källbelagt starkast av de fyra frågorna:
   tre oberoende designsystem pekar samstämmigt mot färgad fyllnad +
   neutralt spår, ingen mot en helt neutral fyllnad.
4. **Övergången** — håller INTE i nuvarande kod. Den enda källan med en
   explicit regel säger fade in; koden gör en hård swap. Detta är den
   mest konkreta, handlingsbara luckan detta pass hittade.

## Vad jag inte kunde belägga

- **Linear, Slack, Notion, Figma, Arcs egen splash-KOMPOSITION**
  (logo-placering, indikator-typ, färg) — ingen förstapartskälla
  dokumenterar detta för någon av de fem. Linear har en tredjeparts
  teknisk genomgång (komposition delvis: pulserande logo bekräftad,
  progressbar/frånvaro av densamma INTE bekräftad). En
  observationsbaserad verifiering (öppna apparna och skärmdumpa) gjordes
  INTE i detta pass — utanför primärkälle-/web-research-metoden detta
  pass är avgränsat till. Bokfört som öppen punkt.
- **Apple HIGs egna sidor för "Launch Screens" och "Loading"-mönstret**
  (`developer.apple.com/design/human-interface-guidelines/launching`,
  `.../patterns/loading`) — båda 404:ade eller gav bara sidtitel vid
  direkt WebFetch (JS-renderad SPA, samma begränsning som gårdagens pass
  dokumenterade för M3/Polaris/Carbon-nu). Progress-indicators-innehållet
  ovan vilar på en COMMUNITY-SPEGLING (`codershigh.github.io`), inte
  `developer.apple.com` direkt — bedömt trovärdigt (koherent med kända
  HIG-principer) men INTE verifierat ordagrant mot originalet.
- **Material 3s exakta duration-/easing-tokenvärden** och
  container-transform-detaljer — WebSearch-syntes, inte verbatim-läst;
  ett av synteserade cubic-bezier-värdena
  (`cubic-bezier(0.2, 0, 0, 1.5)`) har en sista koordinat utanför
  0–1-intervallet vilket är ovanligt för en publicerad easing-token och
  bör betraktas med extra skepsis tills det verifierats mot
  `m3.material.io` direkt (kräver en JS-kapabel hämtning detta pass
  inte hade tillgång till).
- **Polaris progress-bar-färg** — WebSearch-syntes av
  `polaris-react.shopify.com`, inte verbatim (sajten är också en SPA).
  Riktningen (semantisk `tone`-prop, aldrig neutralt default) bedöms
  trovärdig men är inte ett direkt citat.
- **En exakt, mätbar duration/easing-rekommendation för SPLASH→APP-
  crossfaden specifikt.** Meta Horizon OS-källan ger den kvalitativa
  regeln ("fade in, inte abrupt") men ingen siffra. Ingen annan källa
  (varken idag eller igår) namnger en specifik duration för just detta
  övergångssteg — rekommendationen nedan att återanvända
  `--animate-mm-avsloj`s 0,2 s är en ANALOGI mot appens egen etablerade
  praxis, inte en branschsiffra.
- **"Staggered reveal" och "skeleton-handoff" som namngivna
  splash-till-app-tekniker** — hittade inga primärkällor som beskriver
  någotdera specifikt för denna övergång (staggered reveal är en
  generell dashboard-inträdesteknik, skeleton-handoff är i vårt eget
  regelverk redan ett SEPARAT trappsteg, inte en övergångsteknik).

## Rekommendation (ej beslut)

Mappad mot de fyra frågorna + vår kontext (FK-inspirerat lugnt
formspråk, tillgänglighet 11, reduced-motion-krav):

1. **Komposition — behåll nuvarande stapling.** Centrerad logo → bar →
   text är källbelagt (installerar-/mobilapp-splash-konventionen) även
   om ingen av de fem namngivna desktop-ledarna kan citeras som direkt
   precedent. Beskriv i eventuell framtida ADR-uppdatering att
   precedensen är LÅNAD från en näraliggande produktklass, inte kopierad
   från en konkurrents dokumenterade lösning — ärligare än att
   framställa det som "vad alla gör".
2. **Procent — behåll "X av Y hämtningar klara", lägg INTE till en
   rå %-siffra.** Ingen källa efterfrågar det, och den nuvarande formen
   är redan mer konkret än vad branschgolvet kräver.
3. **Färg — behåll gold-11-fyllnaden mot det neutrala spåret.** Tre
   oberoende designsystem stödjer mönstret (färgad signal, neutral
   bakgrund); en helt gråskalig fyllnad hade varit UNDER vad
   branschledarna faktiskt gör, inte en "renare" variant av det.
4. **Övergången — den enda handlingsbara luckan.** Bygg en crossfade
   mellan `Forberedelseskarm` och `RouterProvider`-monteringen i
   `InnerApp` i stället för dagens hårda `return`-swap, grundat i den
   enda källa som gav en explicit regel (Meta Horizon OS: "fade in,
   inte abrupt"). Konkret: återanvänd `--animate-mm-avsloj` (0,2 s
   ease-out, redan i produktion på fem auth-ytor) för in-övergången av
   appens första vy, och lägg motsvarande `motion-safe:`-gating så att
   `prefers-reduced-motion: reduce` fäller tillbaka på en ren,
   omedelbar swap utan opacity-animation (i linje med reduced-motion-
   konsensusens "crossfade som fallback, inte total frånvaro av
   övergång" — vårt fall har redan INGEN övergång att falla tillbaka
   till, så no-motion-läget kräver ingen ändring, bara att den NYA
   fade-in-effekten `motion-safe:`-gatas). Skriv detta som en explicit,
   liten skiva (t.ex. under TASK-219 eller ett nytt kort) snarare än en
   tyst kodändring, eftersom det rör den redan Marcus-granskade
   gate-mekaniken i `InnerApp`.
5. **Öppen, inte tyst:** om Marcus vill ha ett stronger evidensläge för
   fråga 1 specifikt, är nästa steg en riktad OBSERVATION (öppna Slack/
   Notion/Figma/Linear/Arc-desktopapparna kallt och skärmdumpa
   uppstarten) snarare än ytterligare websökning — websökningen är
   uttömd för denna delfråga inom detta pass metod.

## Källförteckning

**Repo-interna källor lästa i sin helhet (disk-verifierat 2026-08-16,
gren `main`, commit `0fa3e58a`):**

- [`loading-indikator-branschpraxis-2026-08-15.md`](loading-indikator-branschpraxis-2026-08-15.md)
- [`app-startup-warmup-splash-2026-08-15.md`](app-startup-warmup-splash-2026-08-15.md)
- [ADR-112 — Förberedelseskärmen](../decisions/ADR-112-forberedelseskarmen-blockerande-startvarmning.md)
- [ADR-113 — Laddtrappan](../decisions/ADR-113-laddtrappan-yttrappa-for-laddindikatorer.md)
- `docs/specs/DESIGN-SYSTEM-SPEC.md` §15
- `src/components/AppShell/Forberedelseskarm.tsx`
- `src/main.tsx` (`InnerApp`)
- `src/styles/tailwind.css` (`--animate-mm-avsloj`, rad 137–147)
- `src/styles/tokens/primitives.css` (`--p-ease-default/in/out`, rad 263–265)

**Externt (hämtat 2026-08-16):**

- Android Developers, [Splash screens](https://developer.android.com/develop/ui/views/launch/splash-screen) — verbatim
- Apple Human Interface Guidelines — Progress Indicators, via community-spegling [`codershigh.github.io`](https://codershigh.github.io/guidelines/ios/human-interface-guidelines/ui-controls/progress-indicators/index.html) — ej officiellt verbatim
- Meta for Developers, [Splash screen best practices (Horizon OS)](https://developers.meta.com/horizon/design/mr-splash-screen-bp/) — verbatim
- IBM Carbon Design System, [Progress bar — style (v10)](https://v10.carbondesignsystem.com/components/progress-bar/style/) — verbatim
- Shopify Polaris, [Progress bar](https://polaris-react.shopify.com/components/feedback-indicators/progress-bar?example=progress-bar-colored) + [GitHub issue #10049](https://github.com/Shopify/polaris/issues/10049) — WebSearch-syntes, ej verbatim
- Material Design 3, [Easing and duration — tokens & specs](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs), [Motion overview](https://m3.material.io/styles/motion/overview/specs), [Building Beautiful Transitions with Material Motion for Android](https://m3.material.io/blog/android-material-motion) — WebSearch-syntes, ej verbatim
- performance.dev, [How's Linear so fast? A technical breakdown](https://performance.dev/how-is-linear-so-fast-a-technical-breakdown) — verbatim (kompositionsfokuserad omläsning)
- Pencil & Paper, [UX Design Patterns for Loading](https://www.pencilandpaper.io/articles/ux-pattern-analysis-loading-feedback) — verbatim, sekundärkälla med namngivna produkter
- UXPin, [Splash Screen Design: Best Practices, Examples, and Guidelines (2026)](https://www.uxpin.com/studio/blog/splash-screen/) — verbatim, sekundär marknadsföringsblogg
- CSS-Tricks, [`prefers-reduced-motion` almanacka](https://css-tricks.com/almanac/rules/m/media/prefers-reduced-motion/) — WebSearch-syntes, ej verbatim
- Nielsen Norman Group — [Progress Indicators Make a Slow System Less Insufferable](https://www.nngroup.com/articles/progress-indicators/) (redan citerad, gårdagens pass; återanvänd, ej duplicerad)
