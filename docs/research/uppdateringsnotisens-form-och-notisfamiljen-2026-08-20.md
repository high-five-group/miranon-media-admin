---
owner: marcus803
updated: 2026-08-20
review_by: 2026-11-20
status: draft
---

# Uppdateringsnotisens form, och notis-familjen den tillhör (2026-08-20)

> **Proveniens:** avgränsat research-pass 2026-08-20, kört oisolerat i
> huvudkatalogen. Ingen produktionskod ändrad, ingen commit gjord. Passet
> startades av Marcus dom över `AppUpdateBanner`, verbatim: *"Det ser ju
> skitfult ut, fruktansvärt. trycker ner innehållet, en långtextsträng och en
> centrerad knapp... Detta kan vi ju inte acceptera som 'Proffsigt'."* En
> scope-utvidgning togs emot under passets gång: samma fråga ställd över hela
> felmeddelande-familjen (`MessageBox`, `SectionError`, `AppError`,
> `OfflineIndicator`).
>
> Passet innehåller **egna mätningar mot vår installerade kod** (Playwright mot
> `localhost:5173`, Vite 8.2.0, react-aria-components 1.20.0) utöver
> källciteringen. Där en mätning finns är den märkt MÄTT och slår varje citat.

## Vad vi redan hade: inventering FÖRE första sökningen

`docs/research/` rymmer 125 poster. Fyra överlappar, tre ADR:er styr, och ett
av dem hade kunnat rivas av misstag om jag inte läst det först.

**Det som redan är beslutat, och som detta pass INTE rör.**
[`ADR-047`](../decisions/ADR-047-pwa-arkitektur-fas-5.md) § Amendering
2026-08-13 (1) och (2) avgjorde tre saker om uppdateringsvägen:
`autoUpdate` + `onNeedReload` + periodisk `registration.update()` varje timme;
att **omladdningsbeslutet ligger hos användaren** (Marcus S105, skälet är
Lottas osparade inmatning); och att chunk-felet får `role="alert"` medan
"ny version" behåller `role="status"`. Allt detta står orört efter detta pass.

**Det som ALDRIG beslutats, och som därför är passets öppna fråga.**
Läser man båda `ADR-047`-posterna i sin helhet nämns den visuella formen
aldrig. Ordet "banner" förekommer i dem endast som filnamn
(`AppUpdateBanner.tsx`) och som syftande substantiv, aldrig som ett vägt val
mot ett alternativ. `docs/specs/DESIGN-SYSTEM-SPEC.md` har noll träffar på
banner, notis, toast eller `MessageBox`. **Formen är obeslutad, inte låst.**
Det betyder att en formändring inte river något beslut, och att fem ytor
i appen idag bär en form ingen någonsin argumenterade för.

**Den interna regeln som redan finns, i ett angränsande scope.**
[`ADR-078`](../decisions/ADR-078-instant-regeln.md) beslut 4 bär Marcus
verbatim: *"hopp i layouten är absolut förbjudet i denna app"*. Regeln är
skriven om skeleton-geometri vid laddning. Uppdateringsbannern orsakar samma
skada utanför den formuleringens räckvidd.
`docs/specs/PERFORMANCE-BUDGET.md` sätter dessutom CLS-mål `<0.1` och
stretch `<0.05`, med motiveringen *"Inget far hoppa runt nar data laddar"*.

**Åldersbedömning.**
[`task-199-frontend-deployvagen-och-sw-precachen-2026-08-13.md`](task-199-frontend-deployvagen-och-sw-precachen-2026-08-13.md)
(7 dagar) och
[`loading-indikator-branschpraxis-2026-08-15.md`](loading-indikator-branschpraxis-2026-08-15.md)
(5 dagar) är färska; deras premisser håller och återupprepas inte här.
[`react-headless-ui-research.md`](react-headless-ui-research.md) är från maj
och åldrad i fråga om vad React Aria erbjuder idag. Den delen sökte jag om,
riktat, genom att mäta i vår installerade `node_modules`.

**Vad som därför är nytt i detta pass:** formfrågan (i flödet kontra
överlagrad), layoutskadan mätt i vår egen app, designsystemens notis-taxonomi,
och domen över våra faktiska felsträngar. Det som redan står i
`loading-indikator`-passets yttabell (Carbon: aldrig skeleton i toast/meny/
modal) upprepas inte.

> **Systerdokument — läs båda.** Detta pass mäter vad BRANSCHEN gör.
> Vad VI har, mätt och fotograferat, ligger i
> [`tasks/sessions/bilagor/s107-felmeddelande-inventering/`](../../tasks/sessions/bilagor/s107-felmeddelande-inventering/README.md)
> — fem ytor, fyra designspråk, sju skärmbilder. Ingen av filerna är
> självbärande utan den andra.

## Kort svar

**Marcus har rätt, och det går att mäta.** Vår banner orsakar en
layoutförskjutning på **0,0376 vid 1280 px och 0,1469 vid 390 px**, varje gång
den visas, med `hadRecentInput: false` i samtliga fall. Den passerar alltså
inte som "användarinitierad" enligt Web Vitals egen definition, och vid 390 px
spränger en enda visning hela repots CLS-mål på egen hand. Samma budskap i en
överlagrad form mätte **0,0000 vid båda bredderna, noll skiften**.

**Men "toast" är inte det raka svaret, och den hypotesen faller delvis.**
Carbons taxonomi placerar uttryckligen "en ny version av produkten finns" i
klassen **banner** (system- och produktnivå, inte knuten till en uppgift), inte
i klassen toast. Både Carbon och Material föreskriver samtidigt att en sådan
banner ska sitta **under appens huvud/navigering**, inte överst i viewporten,
och Carbon säger rakt ut *"Do not cover other content with a banner
notification."* Regeln är alltså inte "aldrig förskjut layout" — den är
**"förskjut aldrig layout för något som inte kräver handling nu"**, och
uppdateringsnotisen kräver inte handling nu.

**Branschen mätt i källkod avgör frågan tydligare än designsystemen gör.**
Av tolv undersökta produktioner visar åtta någonting; **sju av åtta lägger det
utanför normalflödet** (`position: fixed`/`absolute`). Den enda uppmätta
in-flow-bannern är Mattermost, som samtidigt saknar stängknapp och saknar
a11y-roll helt. Tre av de största (Grafana, Sentry, PostHog) visar **ingenting
alls** och laddar i stället om tyst vid nästa säkra navigering.

**A11y-formen överlever flytten. Inget går förlorat.** Både sonner och React
Aria demonstrerar en alltid-monterad `aria-live`-region i en överlagrad
container. Vår `role="status"`-invariant kan bevaras exakt.

**Copyn bör bytas, och ordvalet är mätt.** "Ladda om" är rätt ord: både
Försäkringskassans och Arbetsförmedlingens designsystem skriver "ladda om
sidan", WordPress svenska gör det i 17 av 17 strängar. "Uppdatera" bär en
mätt kollision (Chromium mappar både `Refresh` och `Update` dit) som i en
admin-app med "uppdatera en anmälan" i domänspråket är en verklig felrisk.
Det som ska bort är **längden**: 118 tecken mot branschens 30 till 60.

**Om utvidgningen:** taxonomin och formregeln ryms väl och levereras nedan.
Den fullständiga omskrivningen av fem ytors copy gör det inte, och det säger
jag rakt ut under § Vad jag inte kunde belägga.

## 1. Vad branschledarna gör, mätt i källkod

Metoden var medvetet **mätning framför citat**: i stället för att beskriva vad
Linear eller Figma "verkar göra" (ingen av dem har öppen kod, och en
skärmdumpsbeskrivning är inte ett belägg) undersöktes tolv produktionsdrivna
appar vars kod går att läsa. Allt i tabellen är läst i källkod.

| Produkt | Form | Position | Rör layouten? | Copy verbatim | Avfärdande | A11y-roll |
|---|---|---|---|---|---|---|
| Supabase Studio | Toast (sonner) | `bottom-right` | **Nej** | "A new version of this page is available" + "Refresh to see the latest changes." | "Not now"; `duration: Infinity`; max 1 ggr/session | `aria-live="polite"` via sonner |
| Element Web | Toast | `absolute; top:12px; left:62px` | **Nej** | "Update Element" / "New version of Element is available" | "Dismiss" → `deferUpdate(newVersion)` | `role="alert"` |
| Mattermost | **Banner i flödet** | Toppen, `grid-area: announcement`, låst 40 px | **JA** | "A new version of Mattermost is available." + "Refresh the app now" | **Ingen stängknapp** | **Ingen** |
| `vite-plugin-pwa`, React-exemplet | Toast | `fixed; right:0; bottom:0` | Nej | "New content available, click on reload button to update." | "Reload" + "Close" | **Ingen** |
| `vite-plugin-pwa`, Vue/Svelte | Toast | samma | Nej | samma sträng | samma | `role="alert"` |
| `vite-plugin-pwa`, dokssajten | Toast i portal | `fixed right-0 bottom-0` | Nej | "New content available, click the reload button to update." | "Reload" + "Close" | `role="alertdialog"` |
| Outline | Knapp i dokumenthuvudet | I huvudet | Nej | "New version available" / "Please reload the page to update to the latest version" | Försvinner med tillståndet | Ingen explicit |
| Grafana | **Ingen UI** | — | — | — | tyst omladdning vid säker navigering | — |
| Sentry | **Ingen UI** | — | — | — | nästa navigering blir full sidladdning | — |
| PostHog (webb) | **Ingen UI** | — | — | — | chunk-fel fångas, tyst omladdning en gång | — |
| Excalidraw | **Ingen UI** | — | — | — | ren `autoUpdate` | — |

Fyra saker är värda att lyfta ur tabellen.

**Sju av åtta överlagrar.** Den enda som förskjuter layouten är Mattermost, och
den kombinerar det med de två svagaste egenskaperna i hela materialet: den går
inte att stänga, och den bär ingen a11y-roll alls. Den är alltså inte en
förebild att luta sig mot; den är samma val vi gjort, gjort sämre.

**De största visar ingenting.** Sentrys kodkommentar är den enskilt mest
lärorika raden i materialet, verbatim ur
`static/app/components/frontendVersionContext.tsx`:

> *"Delay before starting to check for new versions. This prevents users from
> being prompted to reload immediately after opening the app."*

Sentry väntar **en timme** innan den ens börjar fråga, och visar sedan
fortfarande ingen notis; i stället sätts `reloadDocument` på sidomenyns länkar
så att nästa navigering blir en full sidladdning. Grafana gör samma sak
mekaniskt annorlunda: pollar var femte minut och laddar om tyst vid nästa
säkra brytpunkt, aldrig mitt i en playlist. **Mönstret är att ju bättre
utgivaren kan avgöra när en omladdning är ofarlig, desto mindre UI behövs.**

**Ingen av de tolv använder en modal.** Noll.

**Ingen av dem säger varför.** Ingen visar versionsnummer, ingen skriver
"kritisk" eller "krävs", och ingen förklarar konsekvensen av att avstå. Vår
sträng gör alla tre.

Supabase är den närmaste analogin till vår situation, eftersom Studio också har
en editor där osparat arbete kan gå förlorat. Deras svar: toast nere till
höger, `duration: Infinity`, en "Not now"-knapp, visad högst en gång per
session, och först när den körande deployen är **mer än 24 timmar gammal**.

## 2. Designsystemens taxonomi, och regeln om att förskjuta layout

Hypotesen som skulle prövas var *"aldrig förskjuta layout för
icke-blockerande information"*. Den **faller som absolut regel** och håller
som villkorad. Här är vad förstaparten faktiskt skriver.

### Carbon (IBM) har den mest kompletta taxonomin: sju typer

Carbons `patterns/notification-pattern` listar sju, ordnade efter hur
störande de får vara. Verbatim ur "Deciding what to use":

| Typ | Användning (verbatim) | Varaktighet |
|---|---|---|
| Inline | *"Provide users with nondisruptive feedback or the status of an action"* | tills löst eller stängd |
| Toast | *"Short, time-based messages that slide in and out of a page and provide nondisruptive information."* | utan åtgärd: kan auto-döljas · **med åtgärd: kvar tills stängd** |
| Actionable | interaktiva element i en inline- eller toast-form | *"Persist until action is taken or dismissed by user"* |
| Callout | laddas med sidan, kontextuell | kan inte stängas |
| **Banner** | ***"System or product level notifications that are not specific to a task"*** | *"Persist until dismissed by user"* |
| Notification panel | notiscenter | öppnas och stängs av användaren |
| Modal | *"Highly disruptive notifications that provide users with critical information"* | blockerar tills stängd |

Carbon delar dessutom notiser i **task-generated** och **system-generated**,
och placerar vårt fall entydigt i den andra: *"These notifications are
initiated by the application or system, independent of user action."* Exemplen
Carbon ger är nästan våra: *"A user loses network connection"*, *"Planned
system maintenance is coming soon"*.

Carbons banner-regler, verbatim:

> *"Banners take over the top of an interface to show general notifications for
> the product or system, not a specific task."*
> *"Banners should be placed at the top of the content area they relate to."*
> ***"Do not cover other content with a banner notification."***
> ***"Place system-wide messages directly below the main header or navigation
> bar."***
> *"Banners are not sticky and should scroll with the other content on the
> page."*

Detta är den viktigaste enskilda passagen i hela passet, och den skär åt två
håll samtidigt. Carbon **sanktionerar** en banner i flödet för exakt vår
klass av budskap. Carbon **förbjuder** samtidigt att den överlagrar innehåll,
och kräver att den sitter under appens navigering, inte överst i viewporten.
Vår nuvarande banner bryter mot placeringsregeln (den ligger allra överst,
ovanför allt) men följer icke-överlagringsregeln.

Carbon avslutar sitt eget banner-avsnitt med en reservation som är ärlig och
värd att återge: *"More design iteration and user testing is needed before
Carbon solidifies our guidance for banners and creates a banner component."*
Banner-raden är alltså Carbons svagaste, inte starkaste, vägledning.

Två Carbon-regler till, båda direkt tillämpliga:

> *"Actionable notifications, since they require user interaction, **take focus
> when triggered** and can be highly disruptive to screen readers and keyboard
> users."*
> *"If the toast includes an action button, then the notification should remain
> on screen until the user dismisses it."*

Den första är en varning vi kan gå runt (se § 4). Den andra avgör
persistensfrågan: **en notis med knapp får inte auto-döljas.**

### Material (Google) skiljer snackbar från banner på exakt vår axel

Material 3:s egna sajter är helt JS-renderade och gav bara sidtitlar. Jag
hämtade i stället förstapartens komponentdokumentation ur källkoden, vilket
också gör timing-värdena mätta i stället för citerade.

Snackbar, verbatim ur `material-components-android/docs/components/Snackbar.md`:

> *"Snackbars inform users of a process that an app has performed or will
> perform. They appear temporarily, towards the bottom of the screen. **They
> shouldn't interrupt the user experience, and they don't require user input to
> disappear.**"*
> *"Snackbars can also offer the ability to perform an action, such as undoing
> an action that was just taken, or retrying an action that had failed."*

Banner, verbatim ur `material-components-web/packages/mdc-banner/README.md`:

> *"A banner displays an important, succinct message, and provides actions for
> users to address (or dismiss the banner). **It requires a user action to be
> dismissed.**"*
> ***"Banners should be displayed at the top of the screen, below a top app
> bar. They're persistent and nonmodal, allowing the user to either ignore them
> or interact with them at any time. Only one banner should be shown at a
> time."***

Material och Carbon säger alltså **samma sak, oberoende av varandra**: en
system-banner sitter under app-huvudet, är kvar tills den stängs, och det får
bara finnas en.

MÄTT i `mdc-snackbar/constants.ts`: `DEFAULT_AUTO_DISMISS_TIMEOUT_MS: 5000`,
`MIN: 4000`, `MAX: 10000`, `ARIA_LIVE_DELAY_MS: 1000`.

### Shopify Polaris, mätt i källkod

Polaris dokumentationssajt har flyttat och gav bara en index-sida, men
komponenterna finns kvar i repot. MÄTT:

- `Frame/components/Toast/Toast.tsx`: `DEFAULT_TOAST_DURATION = 5000`,
  **`DEFAULT_TOAST_DURATION_WITH_ACTION = 10000`**, `aria-live="assertive"`.
- `ToastManager.module.css`: `position: fixed; z-index: …; right: 0; left: 0;
  bottom: …` — alltså överlagrad nertill, rör inte flödet.
- `Banner/Banner.tsx`: `role={tone === 'warning' || tone === 'critical' ?
  'alert' : 'status'}`, `aria-live="polite"`, `tabIndex={0}`.
- `Banner/Banner.module.css`: `position: relative` — i normalflödet.

Två saker faller ut. Polaris ger **dubbel tid åt en toast med knapp** (10 s mot
5 s), vilket är samma bekymmer som Carbons regel men löst mildare. Och Polaris
Banner har **exakt samma roll-mappning som vår `MessageBox`** redan har:
warning/critical till `alert`, resten till `status`. Vår primitiv är
branschkorrekt, oberoende bekräftad.

### GOV.UK: notification banner i flödet, men med en varning

GOV.UK Design System, verbatim:

> *"A notification banner lets you tell the user about something that's not
> directly relevant to the thing they're trying to do on that page of the
> service."*
> *"**Position a notification banner immediately before the page `h1`.** The
> notification banner should be the same width as the page's other content."*
> ***"Use notification banners sparingly. There's evidence that people often
> miss them, and using them too often is likely to make this problem worse."***

GOV.UK placerar alltså bannern **inne i innehållskolumnen**, före rubriken, i
sidans egen bredd. Det är inte samma sak som en remsa tvärs över hela
viewporten ovanför app-skalet. Och varningen är riktad åt motsatt håll mot vår
intuition: en banner missas ofta, den är inte automatiskt "mer synlig".

### Nielsen Norman Group: passiv kontra åtgärdskrävande notis

NN/g:s taxonomi (Kim Flaherty, *Indicators, Validations, and Notifications*)
delar notiser i två, verbatim:

> *"**Action-required notifications** alert the user of an event that requires
> a user action... are often urgent and should be intrusive; for instance, they
> could be implemented as modal popups."*
> *"**Passive notifications** are informational; they report a system
> occurrence that does not require any user action... are typically not urgent
> and should be less intrusive. A typical implementation of a passive
> notification may be a badge icon or **a small nonmodal popover in a corner of
> a screen.**"*

Och exemplet NN/g själv väljer för den passiva klassen är bokstavligen vårt
fall:

> *"Adobe Creative Cloud used a nonintrusive passive notification to inform the
> user of an available application update."*

En uppdateringsnotis är alltså i NN/g:s taxonomi **passiv**, och den formen är
"a small nonmodal popover in a corner of a screen".

### Domen på hypotesen

Hypotesen *"aldrig förskjuta layout för icke-blockerande information"*
**falsifieras som ordagrann regel**: Carbon, Material och GOV.UK sanktionerar
alla tre en banner i flödet för system-nivå-budskap. Den **överlever i
skärpt form**, och den skärpta formen är den regel alla tre faktiskt skriver:

> En notis får förskjuta layout endast när den (a) gäller hela produkten eller
> systemet snarare än en pågående uppgift, (b) är kvar tills användaren stänger
> den, (c) sitter under appens huvud och i innehållets bredd, och (d) är den
> enda i sitt slag på skärmen. Allt annat överlagrar.

Vår banner uppfyller (a), (b) och (d), men bryter mot (c). Och den bryter mot
en fjärde sak som ingen av dem skriver men som vi själva har beslutat: Marcus
regel i `ADR-078` att layouthopp är absolut förbjudet.

## 3. Layoutförskjutningen som skada, mätt hos oss

CLS-frågan var *"gäller det här, eller bara vid sidladdning?"*. Svaret är
entydigt och det är förstapartens egen text (web.dev, *Cumulative Layout
Shift*), verbatim:

> *"CLS is a measure of the largest burst of layout shift scores for every
> **unexpected** layout shift that occurs during the **entire lifecycle of a
> page**."*
> *"Layout shifts that occur in response to user interactions... are generally
> fine, as long as the shift occurs close enough to the interaction that the
> relationship is clear to the user."*
> *"Layout shifts that occur within **500 milliseconds** of user input will
> have the `hadRecentInput` flag set, so they can be excluded from
> calculations."*
> *"Unexpected layout shifts can disrupt the user experience in many ways, from
> causing them to lose their place while reading if the text moves suddenly, to
> **making them click the wrong link or button**."*

Gäller alltså hela sidans livstid, inte bara laddning. Och undantaget för
användarinitierade förskjutningar kräver att förskjutningen sker inom 500 ms
efter en inmatning. Vår banner utlöses av en service worker som aktiveras i
bakgrunden, inte av något Lotta gjorde.

### Mätningen

Metod: Playwright mot dev-servern på `localhost:5173`, en
`PerformanceObserver` för `layout-shift` startad **efter** att sidan lugnat
sig så att bara bannerns egen förskjutning fångas, därefter
`window.dispatchEvent(new Event('mm:app-uppdatering-tillganglig'))` som är
mekanismens enda väg in i tillståndet. Mätt på inloggningsvyn, den route som
går att nå utan autentisering i dev; bannern är monterad i `__root.tsx` och
förskjuter `<main>` likadant på varje gren.

| Vy | Bredd | Bannerns höjd | CLS av EN visning | `hadRecentInput` |
|---|---|---|---|---|
| Laptop | 1440 px | 49 px | **0,0335** | `false` |
| Laptop | 1280 px | 49 px | **0,0376** | `false` |
| Liten laptop | 1024 px | 49 px | **0,0468** | `false` |
| Surfplatta | 768 px | **103 px** | **0,0977** | `false` |
| Mobil | 390 px | **124 px** | **0,1469** | `false` |

Fyra slutsatser ur talen.

**Förskjutningen räknas.** `hadRecentInput: false` i samtliga fem fall. Den är
"unexpected" enligt metrikens egen definition, inte enligt min tolkning.

**Den spränger vår egen budget vid smal vy.** `PERFORMANCE-BUDGET.md` sätter
mål `<0.1` och stretch `<0.05`. Vid 390 px kostar en enda visning 0,1469, alltså
mer än hela målbudgeten, innan något annat på sidan har hunnit hända. Vid
768 px ligger den på 0,0977, praktiskt taget på gränsen. Vid 1280 px äter den
75 % av stretch-budgeten.

**Långtextsträngen är mätbart orsaken till hälften.** Vid 1024 px och uppåt är
bannern 49 px, en rad. Vid 768 px blir den 103 px och vid 390 px 124 px,
eftersom meningen på 118 tecken bryts till tre rader och knappen hamnar på egen
rad. Marcus två invändningar, "trycker ner innehållet" och "en
långtextsträng", är alltså inte två invändningar utan en: **längden är det som
gör förskjutningen dubbelt så dyr.**

### A/B mot en överlagrad form

Samma budskap, samma sida, samma mätuppställning, men renderat som en
`position: fixed`-yta i stället för i flödet:

| Variant | 1280 px | 390 px | Antal skiften |
|---|---|---|---|
| A: nuvarande banner i flödet | 0,0376 | 0,1469 | 1 |
| B: överlagrad toast nere till höger | **0,0000** | **0,0000** | **0** |
| C: överlagrad remsa överst | **0,0000** | **0,0000** | **0** |

Det är inte "mindre". Det är **noll skiften registrerade**, vilket är den enda
utfallsklassen som är förenlig med *"hopp i layouten är absolut förbjudet i
denna app"*.

Skärmdumpen vid 390 px visar dessutom en detalj mätningen inte fångar:
bannerns tre centrerade rader kolliderar visuellt med inloggningsvyns
dekorativa logotyp i övre vänstra hörnet. Det är den delen av Marcus dom som
handlar om "skitfult", och den är reproducerbar.

## 4. A11y-invarianten: överlever den flytten?

Frågan var den mest berättigade i hela uppdraget, eftersom
`AppUpdateBanner`-docblocket är utförligt och dess resonemang är korrekt.
**Svaret är ja, hela formen kan bevaras, och två oberoende implementationer
bevisar det.** Men det finns en fälla som måste undvikas medvetet.

### Vad invarianten faktiskt kräver

MDN (ARIA: status role), verbatim, hämtad 2026-08-20:

> *"Elements with the role `status` have an implicit `aria-live` value of
> `polite` and an implicit `aria-atomic` value of `true`."*
> *"**Do not give focus to the status when its content updates.**"*
> *"Live regions are meant to inform users of dynamic updates that have
> occurred in other areas of the current web page, but which do not necessitate
> interrupting the user's current activity with a change in context."*

Docblockets båda påståenden håller alltså. Och kravet att regionen ska vara
monterad före sitt innehåll är skälet till att komponenten inte returnerar
`null`.

### Fällan: den naiva toasten bryter invarianten

MÄTT i vår installerade `react-aria-components@1.20.0`,
`dist/private/Toast.mjs`:

```js
return state.visibleToasts.length > 0 && portalContainer ? createPortal(region, portalContainer) : null;
```

React Arias `ToastRegion` **monteras alltså inte förrän det finns en toast**.
Den kompenserar genom att ge toastens innehåll `role="alert"` i stället
(MÄTT i `react-aria/dist/private/toast/useToast.mjs`: `toastProps` får
`role: 'alertdialog'`, `'aria-modal': 'false'`, `tabIndex: 0`; `contentProps`
får `role: 'alert'`, `'aria-atomic': 'true'`). Det fungerar, men det byter vår
**artiga** annonsering mot en **assertiv** — precis den skillnad `ADR-047` §
Amendering (2) medvetet etablerade mellan de två lägena. En rak övergång till
RAC:s Toast hade alltså tyst gjort "ny version" lika brådskande som "kunde inte
ladda".

### Vägen runt, mätt i en produktionsimplementation

sonner löser det. MÄTT i `sonner/src/index.tsx`:

```jsx
<section ref={ref} aria-label={…} tabIndex={-1}
         aria-live="polite" aria-relevant="additions text" aria-atomic="false" …>
  {possiblePositions.map((position, index) => {
    …
    if (!filteredToasts.length) return null;
```

Villkoret som returnerar `null` ligger **inuti** positions-loopen, inte runt
`<section>`. Live-regionen är alltså **alltid monterad och tom**, exakt vår
invariant, medan `[data-sonner-toaster]` i CSS är `position: fixed` och därför
aldrig rör flödet. Sonner lägger dessutom till en tangentbordsgenväg
(`hotkey = ['altKey', 'KeyT']`, `containerAriaLabel = 'Notifications'`,
`tabIndex={-1}`) så att regionen går att nå på begäran, och
`TOAST_LIFETIME = 4000`.

React Aria erbjuder en tredje väg till samma sak: `useToastRegion` gör
containern till ett **landmärke** (MÄTT: `useLandmark({ role: 'region',
'aria-label': … })`), nåbart med F6-navigering. Svenska strängar finns
inbyggda (MÄTT i `react-aria/dist/private/intl/toast/sv-SE.mjs`:
`"close": "Stäng"`, plus pluralformen `"N meddelanden"`).

### Vad som faktiskt går förlorat, och vad som inte gör det

| Egenskap i dagens banner | Överlever i överlagrad form? | Hur |
|---|---|---|
| `role="status"` + `aria-live="polite"` | **Ja** | container är alltid monterad, bara innehållet växlar (sonner-mönstret) |
| Alltid monterad live-region | **Ja** | samma |
| Fokus flyttas aldrig | **Ja**, men kräver ett aktivt val | RAC ger toasten `tabIndex: 0` men **auto-fokuserar inte** (MÄTT: noll träffar på `focus()`/`autoFocus`/`FocusScope` i `dist/private/Toast.mjs`). Carbons varning om att actionable notifications tar fokus gäller Carbons egen implementation, inte RAC:s |
| Två lägen med olika brådska | **Ja** | två regioner med fasta roller, som idag |
| `prefers-contrast: more` | **Ja** | ren CSS |
| `print:hidden` | **Ja** | ren CSS |
| Knappen är `Button`-primitiven | **Ja** | oförändrat |
| Tangentbordsnåbarhet utan att stjäla fokus | **Förbättras** | landmärke (RAC) eller hotkey (sonner) ger en väg dit som dagens banner saknar |

**Inget går förlorat.** En sak kräver medvetenhet: containern måste renderas
även när den är tom, vilket varken RAC:s `ToastRegion` eller de flesta
toast-bibliotek gör som default. Det är en egenskap att specificera, inte ett
hinder.

En ny egenskap tillkommer som är värd att notera: en överlagrad yta **täcker**
innehåll. Carbon säger om toast rakt ut: *"Toast notifications cover content on
the screen so they should always be easily dismissed."* En stängväg blir alltså
obligatorisk i den formen, medan dagens banner klarar sig utan.

## 5. Copyn

### Ordvalet: "Ladda om" vinner, mätt

Frågan var om "Uppdatera" ligger närmare vardagsspråk. **Nej**, och det finns
tre skäl, alla mätta.

**Svenska offentliga designsystem skriver "ladda om".**
Försäkringskassans designsystem, vår egen refererade förlaga, har exakt en
användarvänd reload-instruktion och den lyder verbatim:

> *"Något gick fel. Testa att ladda om sidan."*
> (`docs/components/table-and-list/table.md:79` och
> `FDataTableErrorExample.vue:18`)

Arbetsförmedlingens designsystem Digi, i sin skarpa 404-komponent:

> *"Du kan prova att ladda om sidan, söka på webbplatsen eller använda länkarna
> för att komma vidare."*

Noll träffar på "läs in" eller "hämta igen" i användarvänd text i någotdera.

**Den svenska webb-korpusen skriver "ladda om".** WordPress sv_SE: 17 av 17
strängar, noll "läs in", noll "uppdatera sidan". Mastodon sv: knappetiketten
är "Ladda om".

**"Uppdatera" bär en mätt kollision.** Chromium mappar **både `Refresh` och
`Update`** till svenska "Uppdatera". I en admin-app vars domänspråk redan har
"uppdatera en anmälan" betyder en knapp märkt "Uppdatera" två saker samtidigt,
och den ena är "spara mina ändringar". För Lotta är det en konkret felrisk.

Webbläsarkromet är inte vägledande: Chrome använder **"Hämta igen"** för sin
reload-knapp och **"Läs in igen"** i innehållskontextmenyn, Firefox använder
"Uppdatera" i äldre nycklar men har reviderat till **"Ladda om"** i nyare
(`reload-tab2`, `reduced-protection-infobar-reload-button`). De två är alltså
oense med varandra, och Chromes val är isolerat.

**Rekommenderat ordval: "Ladda om"** som knapptext, och **"ladda om sidan"** i
löptext där frasen behöver bära sig själv. Detta är ett **konventionsargument
grundat i mätt bruk**, inte ett begriplighetsbevis. Någon empirisk studie som
jämför de svenska alternativen för en icke-teknisk användare hittades inte, och
det är underlagets svagaste punkt.

### Längden: vår sträng är dubbelt så lång som branschens

| Källa | Sträng | Tecken |
|---|---|---|
| **Vår** | "Det finns en nyare version av appen. Ladda om när du är klar med det du håller på med, annars kan det du har skrivit försvinna." | **118** |
| Outline | "New version available" + "Please reload the page to update to the latest version" | 21 + 55 |
| Supabase | "A new version of this page is available" + "Refresh to see the latest changes." | 38 + 33 |
| Mattermost | "A new version of Mattermost is available." | 41 |
| `vite-plugin-pwa` | "New content available, click on reload button to update." | 56 |

Carbon sätter en hård gräns som vår sträng redan bryter mot:

> *"Be concise; limit the content to one or two short sentences."*
> *"If a toast or inline notification requires a message that is longer than
> two lines, use an actionable notification and include a short message with a
> 'View more' link."*
> *"Don't use a period to end a title."*
> *"Limit action labels to one or two words."*

Och Carbons anatomi ger formen: **titel** (kort, beskrivande) plus **body**
(en till två meningar) plus **en** åtgärdsknapp. Vår sträng har ingen titel och
klumpar tre budskap i en mening: att det finns en ny version, när man bör ladda
om, och vad som händer om man inte gör det.

Notera samtidigt att **ingen** av de fem branschsträngarna varnar för
dataförlust. Vår varning är alltså ett medvetet mervärde, inte ett fel — den
kommer ur `ADR-047`:s beslut att omladdningen ska ligga hos användaren, och det
beslutet står. Frågan är bara om varningen ska stå i notisen eller i
bekräftelsen. Se rekommendationen.

## 6. Persistens och återkomst

Tre normativa svar, i stigande styrka.

**Carbon, om notiser med knapp:** *"If the toast includes an action button,
then the notification should remain on screen until the user dismisses it.
With the notification remaining open, the user has enough time to interact with
the button without the toast closing too soon."*

**Carbon, om a11y:** *"Don't use notifications that dismiss on a timer for
critical or emergency messages. Some users with disabilities need more time to
read or interact with messages and timed actionable toasts may not provide
sufficient time."*

**WCAG 2.2 SC 2.2.1 Timing Adjustable, nivå A** (alltså det bindande golvet,
inte AAA-rekommendationen Carbon citerar): *"For each time limit that is set by
the content, at least one of the following is true: Turn off... Adjust...
Extend... Real-time Exception... Essential Exception... 20 Hour Exception."*

WCAG:s Understanding-dokument är uttryckligt om att auto-döljning räknas som
en tidsgräns, och ger samtidigt den exakta carve-out som gör en
auto-döljande toast tillåten, verbatim:

> *"a web application such as an email client provides notification of new
> email arriving with a temporary message (such as a 'toast' message) in the
> lower right-hand side of the interface, and the message disappears after 5
> seconds. **Users are able to identify the arrival of email through other
> means, such as viewing the Inbox**"*

**Regeln som faller ut:** en notis får auto-döljas endast om samma information
går att nå på ett annat sätt. Har den en knapp som är enda vägen till åtgärden
får den inte auto-döljas.

**Branschen följer detta.** Ingen av de uppmätta uppdaterings-toastarna
auto-döljs. Supabase sätter `duration: Infinity` **explicit**. Element Web har
ingen timer. `vite-plugin-pwa`:s exempel har ingen timer.

**Vad branschen gör vid ignorering** är däremot inte "kommer tillbaka
periodiskt". Tre distinkta strategier är mätta:

1. **Supabase**: visa **en gång per session** (`isToastShown`), och först när
   deployen är över 24 timmar gammal. Ignorerar Lotta den kommer den inte
   tillbaka förrän hon laddar om av annan anledning.
2. **Element Web**: "Dismiss" anropar `deferUpdate(newVersion)` — **just den
   versionen** skjuts upp, men nästa version triggar notisen igen.
3. **Sentry / Grafana**: ingen notis alls; omladdningen sker tyst vid nästa
   säkra navigering.

**Eskalering hittades inte i något av materialet.** Ingen produkt gör notisen
mer påträngande över tid. Det är i sig ett svar: branschen eskalerar inte, den
väntar på en säker brytpunkt eller på nästa version.

Vår nuvarande mekanism kollar var 60:e minut (`UPPDATERINGS_INTERVALL_MS`), men
tillståndet är en `boolean` som aldrig går tillbaka till `false` — bannern
visas alltså **en gång och ligger kvar för alltid**, utan stängväg. Det är
Element Webs strategi utan dess "Dismiss". Kombinationen persistent plus
ostängbar plus layoutförskjutande är samma kombination som Mattermost, den
svagaste i materialet.

## 7. Utvidgningen: notis-familjen som system

Marcus utvidgning, verbatim: *"Vi har samma problem med alla felmeddelanden,
alltså de här 'Något gick fel - ladda om' typ dem meddelandena. De kanske ska
vara just banners men det är så rigoröst fula."*

### 7.1 Finns ett gemensamt designspråk, och är fem ytor för många?

**Ja, det finns ett, och nej, fem är inte för många — men de är fel indelade.**

Alla undersökta designsystem indelar efter **två axlar**, inte efter yta:
*orsakades detta av något användaren just gjorde?* och *kräver det handling
nu?* Carbon kallar axlarna task-generated/system-generated respektive
optional action/required action. NN/g kallar dem validation/notification
respektive passive/action-required.

Våra fem ytor är däremot indelade efter **var i kodbasen felet uppstod**
(AppShell, primitiv, ErrorBoundary), vilket är en implementationsaxel. Därför
bär `MessageBox` idag både lugn information och kraschbesked, medan
`AppUpdateBanner` bär både ett artigt och ett assertivt budskap.

Mängden är inte problemet. Carbon har sju typer och Material har två plus
dialoger. **Det som saknas är att ingen styrande yta i repot definierar
familjen alls**: `DESIGN-SYSTEM-SPEC.md` har noll träffar på banner, notis,
toast eller `MessageBox`. Det är den verkliga luckan, inte antalet.

### 7.2 Vilken form för vilken klass

Härlett ur Carbons pattern-tabell, Materials två komponentdokument, GOV.UK:s
placeringsregel och NN/g:s två klasser. Kolumnen "förskjuter layout" är den
Marcus frågade om.

| Klass | Exempel hos oss | Form enligt förstaparten | Förskjuter layout? |
|---|---|---|---|
| Systemnivå, ingen handling krävs nu | "en ny version finns" · "du är offline" | Banner under app-huvudet **eller** överlagrad passiv notis | **Bör inte** — inget kräver handling nu |
| Systemnivå, handling krävs för att fortsätta | "en del av sidan kunde inte laddas" | Banner i flödet, under app-huvudet, ej stängbar | **Ja, får** — den blockerar redan användarens väg |
| Uppgiftsgenererat fel, knutet till en yta | "Bilagorna kunde inte hämtas" | Inline, **intill det som gick fel** | **Ja** — den är en del av ytan |
| Uppgiftsgenererat fel, knutet till ett fält | valideringsfel i formulär | Fältfel plus felsammanfattning överst med fokus dit | Ja |
| Uppgiftsgenererad bekräftelse | "Anmälan sparad" | Toast, överlagrad, får auto-döljas | **Nej** |
| Delyta kraschade | `SectionError` | Inline i den yta som kraschade | Ja, lokalt |
| Hela appen kraschade | `AppError` | Helsida | Ej tillämpligt |
| Kritiskt, kräver beslut nu | ingen instans hos oss idag | Modal | Blockerar |

**Regeln, i en mening:** förskjut layout när meddelandet redan står i vägen för
det användaren försökte göra; överlagra när det inte gör det. Vår
uppdateringsnotis står inte i vägen för någonting, och därför förskjuter den
felaktigt. Vår chunk-fel-banner står däremot i vägen (Lotta har redan klickat
på något som inte gick att visa), och den får förskjuta.

Det ger ett annat svar än "gör allt till toast": **de två lägena i
`AppUpdateBanner` hör inte till samma klass och ska inte ha samma form.**

En regel till, som gäller hela familjen och som är den enda källa som säger
något om toast och fel i samma andetag. NN/g, verbatim:

> *"Alternatively, a toast (a small nonmodal popup that disappears after a few
> seconds...), while appropriate for passive notifications, **would be a bad
> way to implement an error message**, be it validation or otherwise."*
> *"In fact, one of our mobile users spent 5 minutes waiting for some content
> to load only because she hadn't notice the little error message presented at
> the bottom of the screen that quickly faded away after 5 seconds."*

**Fel blir aldrig toast.** Bekräftelser får bli det.

### 7.3 Är "Något gick fel. Försök igen." acceptabelt?

**Nej.** GOV.UK förbjuder formen i klartext, verbatim ur Error message-sidan:

> *"**Be specific.** General errors are not helpful to everyone. They do not
> make sense out of context. Avoid messages like: **'An error occurred'**..."*
> *"Do not use: technical jargon like 'form post error', **'unspecified
> error'**... 'sorry' because it does not help fix the problem..."*

NN/g säger samma sak: *"Concisely and precisely describe the issue. Generic
messages such as 'An error occurred' lack context."* och *"Merely stating the
problem is also not enough; offer some potential remedies."*

Microsofts Windows UX Guide ger den mest användbara checklistan:
*"good error messages have: **A problem.** ... **A cause.** ... **A
solution.**"*

Dom per sträng, mot problem/orsak/lösning:

| Sträng | Dom | Skäl |
|---|---|---|
| "Något gick fel. Försök igen." | **Faller** | Svensk motsvarighet till GOV.UK:s förbjudna "An error occurred". Har problem, saknar orsak, och upprepning är ingen lösning |
| "Okänt fel. Försök igen." | **Faller hårdast** | "Okänt fel" är GOV.UK:s uttryckligen förbjudna "unspecified error". Ordet "okänt" flyttar systemets diagnosproblem till Lotta |
| "Något gick fel när lösenordet skulle sparas. Försök igen." | **Faller, minst** | Har lokalisering. "Något gick fel" står kvar som huvudsats, orsak saknas |
| "Bilagorna kunde inte hämtas" | **Faller på lösningen** | Klarspråk, ingen jargong, matchar ytans språk. Men ingen väg vidare alls |
| "Incheckningen kunde inte sparas" | **Faller två gånger** | Samma lösningslucka, plus att den inte säger vad som hänt med datan |
| "En del av sidan kunde inte laddas. Ladda om för att fortsätta. Har du skrivit något som inte är sparat, kopiera det först." | **Håller på copyn, faller på ansvaret** | Bär problem, lösning och databesked. Men NN/g *"Preserve the user's input"* och GOV.UK *"Do not clear any form fields"* lägger bevarandet på systemet, inte på Lotta. Rätt text, fel ansvarsfördelning |

**Två noteringar som skyddar mot överkorrigering.** GOV.UK förbjuder "sorry" i
fältvalidering men **föreskriver** det i H1 på sin systemfels-sida (*"Sorry,
there is a problem with the service"*). Klassen avgör, inte ordet. Och
Microsoft är uttrycklig om att uppriktighet om okunskap ibland är rätt: *"it is
better to be up front about the lack of information than to present problems,
causes, or solutions that might not be right"* — men i samma stycke: *"do
provide specific, actionable information if it is likely to be helpful most of
the time"*. Ett nätverksfel är just ett sådant fall. Vi kan alltså inte gömma
oss bakom "Okänt fel".

**Den viktigaste enskilda referensen för utvidgningen** är GOV.UK:s mönster
*"There is a problem with the service"*, som styr precis vår klass (systemfel,
inte validering). Det kräver, verbatim:

> *"'Try again later.' as a normal paragraph"*
> *"information about what has happened to their answers if they are in the
> middle of a transaction"*
> *"contact information, if it exists and helps meet a user need"*
> *"a link to another service, if they can use it to do what they came to do"*
> *"Have clear and concise content and do not use: ... jargon like 500 or bad
> request; 'We are experiencing technical difficulties'"*

Ingen av våra fem strängar bär punkt två (vad hände med det jag skrev), och
ingen bär punkt tre eller fyra.

### 7.4 Återhämtningsvägen

**Var knappen sitter** har ingen förstapartskälla en explicit regel för. Det
närmaste som är belagt: NN/g heuristik 9, *"Offer users a solution, like a
shortcut that can solve the error immediately"*, och NN/g *"Display the error
message close to the error's source"*, och Microsofts *"placing them directly
next to the problem whenever possible"*. Slutsatsen "knappen bor i
meddelandet" är därmed **tolkat**, inte citerat — men den är den enda
läsningen som är förenlig med alla tre.

**Vad man gör vid andra misslyckandet** står ingenstans som en försöks-räknare.
Ingen källa nämner ett N. Det närmaste belagda är att GOV.UK:s systemfels-sida
**alltid** kräver kontaktväg eller alternativ väg, oberoende av antal försök,
och Microsofts *"For error messages that you can't make specific and
actionable, consider providing links to online Help content."*

Det gör en av våra ytor mätbart trasig, och det är ett fynd bortom uppdraget:
`SectionError` renderar en "Försök igen"-knapp som anropar `reset()` +
`router.invalidate()`. När `SectionError` visas därför att en **chunk saknas**
(vilket är precis vad `ADR-047` § Amendering (2) beskriver) kan den knappen
strukturellt aldrig lyckas — den kör om samma import mot samma saknade fil.
ADR:n bokför detta och lägger ansvaret på uppdaterings-bannern. Men strängen
"Försök igen" utlovar fortfarande något den inte kan hålla, och Lotta kommer
att trycka på den flera gånger.

## Dom

**På huvudfrågan.** Vår banner är fel form för sin klass, och det är mätt, inte
tyckt: 0,0376 till 0,1469 CLS per visning med `hadRecentInput: false`, mot
0,0000 för samma budskap överlagrat. Sju av åtta uppmätta produktioner
överlagrar. Den enda som inte gör det är också den enda utan a11y-roll och utan
stängknapp.

**Men den enkla slutsatsen "gör det till en toast" är för trubbig, och delvis
falsifierad.** Carbon placerar uttryckligen "en ny version av produkten finns"
i klassen banner, och både Carbon och Material föreskriver banner i flödet för
system-nivå-budskap. Skillnaden mot vår banner ligger i **placeringen**: båda
kräver att den sitter under app-huvudet, i innehållets bredd, inte som en remsa
tvärs över viewportens topp. Och Carbon reserverar sig öppet för att just
banner-vägledningen är dess minst mogna.

**Det avgörande argumentet är därför inte designsystemens, utan vårt eget.**
`ADR-078` bär Marcus regel *"hopp i layouten är absolut förbjudet i denna
app"*, och `PERFORMANCE-BUDGET.md` sätter CLS `<0.1`. En banner i flödet som
dyker upp utan användarinmatning kan inte uppfylla någon av dem. Där
designsystemen tillåter två former väljer vår egen, hårdare regel bort den ena.
Det är ett medvetet val ovanför branschgolvet, precis som `ADR-078` redan är.

**På utvidgningen.** De fem ytorna är inte för många, men de är indelade efter
var i koden felet uppstod i stället för efter om användaren orsakade det och om
det kräver handling nu. Ingen styrande yta i repot definierar familjen alls.
`MessageBox`-primitivens roll-mappning är däremot branschkorrekt och oberoende
bekräftad av Polaris identiska mappning; den ska inte röras. Fyra av sex
undersökta felsträngar faller mot GOV.UK och NN/g, och den enda som håller på
copyn (chunk-strängen) faller på att den lägger databevarandet på Lotta.

**Två av de fem lägena hör inte ihop.** "Ny version" och "kunde inte ladda" har
olika brådska, olika klass och ska ha olika form. Att de idag bor i samma
komponent är en artefakt av att de delar mekanism, inte ett designval.

## Vad jag inte kunde belägga

- **Apple Human Interface Guidelines.** Sidorna är helt JS-renderade;
  både `developer.apple.com/design/human-interface-guidelines/alerts` och
  `tutorials/data/...alerts.json` returnerade HTML-skalet. **Jag återger
  medvetet inget Apple-citat.** Apples vägledning saknas därför helt i
  taxonomin ovan, vilket är en verklig lucka i frågeställningens
  källbredd.
- **Microsoft Fluent 2.** `fluent2.microsoft.design/components/web/react/toast/usage`
  gav 404. `@fluentui/react-toast`-paketets README säger själv *"These are not
  production-ready components and should never be used in product."* Den
  Microsoft-vägledning som citeras ovan är den äldre Windows UX Guide, som är
  publicerad men inte Fluent 2.
- **Material Design 3:s egna sajter.** `m3.material.io` och `m2.material.io`
  returnerar *"This website requires JavaScript."* Materials vägledning ovan är
  hämtad ur förstapartens komponentdokumentation och källkod, vilket är starkare
  för timing-värdena men **kan avvika från spec-sajtens nuvarande formulering**.
  M3 har dessutom ingen banner-komponent; banner-citatet är M2-eran.
- **Shopify Polaris prosa.** Dokumentationssajten har flyttat och gav en
  generisk index-sida; markdown-filerna finns inte kvar i repot. Allt om Polaris
  ovan är läst i `.tsx`/`.css`, alltså vad koden gör, inte vad Shopify skriver
  att den bör göra.
- **Linear, Notion, Figma, Slack, Gmail, Discord, GitHub.** Uppdraget bad om
  minst fem, och dessa var namngivna. **Ingen av dem har öppen kod, och jag har
  inte kört dem.** Jag har därför medvetet **inte** beskrivit vad de gör.
  Materialet ersätter dem med tolv appar vars kod går att läsa, vilket är ett
  starkare belägg men en annan urvalsgrupp: den lutar mot utvecklarverktyg,
  inte mot konsumentprodukter. Om Marcus vill ha just de namngivna produkterna
  krävs skärmdumpar eller observation, inte research.
- **Empiriskt stöd för "Ladda om" mot "Uppdatera" hos icke-tekniska
  användare.** Ingen studie hittades som jämför de svenska alternativen.
  Rekommendationen vilar på **mätt bruk**, inte på begriplighetsdata. Detta är
  underlagets svagaste punkt.
- **Svenska konsumenttjänster** (1177, BankID, Skatteverket, SVT, SJ). Sidorna
  är JS-renderade; endast parafraserade sökutdrag gick att få, inga
  verbatim-strängar. Ingen slutsats dras av dem.
- **Datatermgruppen.** Nedlagd 2016, webbplatsen stängd 2025-12-31. Jag hittade
  ingen post om reload/refresh, men kan inte heller belägga att den saknades.
- **GitLab, Cal.com, Bitwarden, Metabase.** Genomsökta men utan träff i den
  yta som söktes. Det är **belagd frånvaro i en delmängd**, inte belagd frånvaro.
- **Renderad drift.** Ingen av de tolv apparna kördes. Allt om hur de faktiskt
  ser ut i en webbläsare är tolkat ur CSS.
- **CLS-mätningen är gjord på inloggningsvyn** i dev-servern, den enda route
  som nås utan autentisering. Bannern är monterad i `__root.tsx` och förskjuter
  `<main>` på varje gren, men **talen för en datatät, autentiserad vy är inte
  mätta**. De bör rimligen ligga i samma härad eller högre, men det är tolkat.
- **Dev-server, inte produktionsbygge.** Mätningen är gjord mot Vite dev.
  Layoutgeometrin är densamma, men jag har inte verifierat det mot ett
  produktionsbygge.

## Rekommendation

Detta är en **rekommendation, inte ett beslut**. Formen är obeslutad (se
inventeringen) och Marcus äger valet.

### Huvudförslag: dela de två lägena, olika form för olika klass

**A. "Ny version finns" blir en överlagrad, passiv notis.**

- **Var:** nere till höger, `position: fixed`, `z-index` över innehållet men
  under modaler. Motiv: NN/g:s form för passiva notiser (*"a small nonmodal
  popover in a corner of a screen"*), och den position sju av åtta uppmätta
  produktioner använder. Mätt CLS-effekt: 0,0000.
- **Bredd:** fast, max ~22 rem. Aldrig full bredd. Carbon: *"Toast
  notifications have a fixed width and should not be expanded to fit the
  content area."*
- **Innehåll:** titel plus en mening plus en åtgärd, aldrig mer. Förslag,
  med korta bindestreck per `.langa-streck-policy.json`:
  - Titel: **"Ny version av appen"** (ingen punkt, per Carbon)
  - Body: **"Ladda om när du är klar med det du gör."** (39 tecken mot 118)
  - Primär åtgärd: **"Ladda om"**
  - Sekundär åtgärd: **"Inte nu"** (Supabases ord, översatt)
- **Varningen om dataförlust flyttas.** Den är för viktig för att gömmas i en
  notis Lotta kanske aldrig läser, och för lång för att stå kvar där. Lägg den
  där den faktiskt behövs: i en bekräftelse när "Ladda om" trycks **medan ett
  formulär har osparade ändringar**. Då blir den en `Dialog` med
  "Ladda om ändå" / "Avbryt", vilket är NN/g:s och Carbons form för ett
  beslut som kan förstöra arbete. Har Lotta ingenting osparat laddar den bara
  om, utan fråga.
- **Persistens:** ingen timer. Carbon och WCAG 2.2.1 är samstämmiga: en notis
  vars knapp är enda vägen till åtgärden får inte auto-döljas. "Inte nu"
  stänger den för sessionen (Supabase-mönstret), och den återkommer vid nästa
  **nya** version (Element Web-mönstret), inte periodiskt.
- **A11y:** containern renderas alltid, även tom, med `role="status"`
  `aria-live="polite"` — sonner-mönstret, MÄTT ovan. Fokus flyttas aldrig.
  Ge regionen ett `aria-label` och en väg dit som inte kräver att man tabbar
  genom hela sidan.

**B. "En del av sidan kunde inte laddas" blir kvar som banner i flödet, men
flyttas.**

Detta läge blockerar redan Lotta. Den får förskjuta layout, och den ska
det, eftersom en överlagrad remsa i det läget är lättare att missa. Två
ändringar:

- **Flytta den under app-huvudet**, i innehållets bredd, per både Carbon
  (*"Place system-wide messages directly below the main header or navigation
  bar"*), Material (*"below a top app bar"*) och GOV.UK (*"immediately before
  the page `h1`"*). Idag ligger den överst i viewporten.
- **Korta den.** Titel "Sidan behöver laddas om" plus en mening plus knappen.
  Databesked-meningen hör till bekräftelsedialogen i A, inte till bannern.
- `role="alert"` behålls oförändrat (`ADR-047` § Amendering (2) står orörd).

**C. Familjen får en styrande yta.** Tabellen i § 7.2 skrivs in i
`DESIGN-SYSTEM-SPEC.md` som en notistrappa, i exakt samma form som `ADR-113`
gav laddindikatorerna. Det är repots egen etablerade lösning på samma
problemklass, och den formen är redan kvitterad en gång.

### Alternativ 1: behåll banner-formen, flytta och strama den

**Vad:** ingen toast alls. Bannern stannar i flödet men flyttas ned under
app-huvudet, får en fast maxbredd i innehållskolumnen, kortas till titel plus
en mening, och får en stängknapp.

**För:** Carbon och Material sanktionerar uttryckligen exakt denna form för
system-nivå-budskap. Det är en betydligt mindre ändring, den kräver ingen ny
primitiv, och den rör inte a11y-formen alls. Den bevarar också att notisen är
svår att missa, vilket GOV.UK:s varning (*"people often miss them"*) antyder
att en hörn-notis kan vara.

**Emot:** den löser inte det Marcus faktiskt klagade på. Layoutförskjutningen
finns kvar — mätt 0,0335 till 0,1469 beroende på bredd — och den bryter mot
`ADR-078`:s *"hopp i layouten är absolut förbjudet"* oavsett var på sidan den
sitter. En kortare sträng minskar hoppet vid smala vyer men eliminerar det
inte. Och den enda uppmätta produktionen som gör precis detta är Mattermost.

### Alternativ 2: visa ingenting, ladda om vid nästa säkra brytpunkt

**Vad:** Sentrys och Grafanas väg. Ingen notis. När en ny version upptäcks
markeras nästa navigering som en full sidladdning i stället för client-side
routing. Lotta ser aldrig ett meddelande; appen är bara ny nästa gång hon byter
vy.

**För:** noll layoutförskjutning, noll copy att skriva, noll a11y-yta, noll
avbrott. Det är formen tre av de största produktionerna i materialet valt, och
den enda som helt undviker att be en icke-teknisk användare fatta ett tekniskt
beslut. Gunilla-principen talar starkt för den: Lotta behöver inte förstå vad
en version är.

**Emot:** den strider mot `ADR-047`:s uttryckliga beslut att omladdningen ska
ligga hos användaren, och det beslutet har ett gott skäl (osparad inmatning).
Att avgöra vilken navigering som är "säker" kräver att vi vet var formulär har
osparade ändringar, vilket är verklig ny mekanik. Och den lämnar kvar
chunk-fel-fönstret: en Lotta som står stilla länge på samma vy får fortfarande
`vite:preloadError` innan någon navigering hunnit ske. **Denna väg kräver ett
öppet rivande av `ADR-047`:s S105-beslut och bör inte tas utan det.**

### Vad jag skulle mäta innan bygget börjar

Två saker, båda billiga:

1. **Mät CLS på en datatät autentiserad vy**, inte bara inloggningsvyn.
   Metoden ligger i `scratchpad` och tar under en minut.
2. **Pröva om en hörn-notis faktiskt ses.** GOV.UK:s varning gäller banners,
   och NN/g varnar för motsatsen om hörn-notiser (*"Passive notifications can
   easily be missed"*). Ingen av dem gäller specifikt Lotta. En kort
   observation medan hon arbetar avgör frågan bättre än vilken källa som helst.

## Källor

### Egna mätningar (starkast, gjorda 2026-08-20)

- Layoutförskjutning: Playwright mot `localhost:5173`, fem vyer, plus A/B mot
  två överlagrade varianter. Skript och skärmdumpar i sessionens scratchpad.
- `react-aria-components` 1.20.0: `dist/types/exports/Toast.d.ts`,
  `dist/private/Toast.mjs`, `react-aria/dist/private/toast/useToast.mjs`,
  `useToastRegion.mjs`, `intl/toast/sv-SE.mjs`.
- Repots egna ytor: `src/components/AppShell/AppUpdateBanner.tsx`,
  `OfflineIndicator.tsx`, `src/components/primitives/MessageBox.tsx`,
  `src/components/ErrorBoundary/SectionError.tsx`, `AppError.tsx`,
  `src/lib/app-uppdatering.ts`, `src/routes/__root.tsx`.

### Designsystem, förstapart

- Carbon, Notification usage: <https://carbondesignsystem.com/components/notification/usage/>
- Carbon, Notification pattern: <https://carbondesignsystem.com/patterns/notification-pattern/>
- Material, Snackbar: <https://raw.githubusercontent.com/material-components/material-components-android/master/docs/components/Snackbar.md>
- Material, Banner: <https://raw.githubusercontent.com/material-components/material-components-web/master/packages/mdc-banner/README.md>
- Material, snackbar-konstanter: <https://raw.githubusercontent.com/material-components/material-components-web/master/packages/mdc-snackbar/constants.ts>
- GOV.UK, Notification banner: <https://design-system.service.gov.uk/components/notification-banner/>
- GOV.UK, Error message: <https://design-system.service.gov.uk/components/error-message/>
- GOV.UK, Problem with the service: <https://design-system.service.gov.uk/patterns/problem-with-the-service-pages/>
- Polaris (källkod): <https://github.com/Shopify/polaris/tree/main/polaris-react/src/components>

### Standarder och mätning

- web.dev, Cumulative Layout Shift: <https://web.dev/articles/cls>
- WCAG 2.2, SC 2.2.1 / 2.2.3 / 2.2.4 / 4.1.3: <https://www.w3.org/TR/WCAG22/>
- WCAG 2.2 Understanding, Timing Adjustable: <https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html>
- MDN, ARIA status role: <https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role>

### Forskning och praxis

- NN/g, Indicators, Validations, and Notifications: <https://www.nngroup.com/articles/indicators-validations-notifications/>
- NN/g, Error Message Guidelines: <https://www.nngroup.com/articles/error-message-guidelines/>
- NN/g, 10 Usability Heuristics: <https://www.nngroup.com/articles/ten-usability-heuristics/>
- Microsoft, Windows UX Guide, Error Messages: <https://learn.microsoft.com/en-us/windows/win32/uxguide/mess-error>

### Produktionskällkod (mätt)

- Supabase Studio, Element Web, Mattermost, Outline, Grafana
  (`NewFrontendAssetsChecker.ts`), Sentry (`frontendVersionContext.tsx`),
  PostHog (`ChunkLoadErrorBoundary.tsx`), Excalidraw, `vite-plugin-pwa`
  (`examples/`), sonner (`src/index.tsx`, `src/styles.css`).

### Svenskt ordval (mätt)

- Chromium sv: <https://raw.githubusercontent.com/chromium/chromium/main/chrome/app/resources/generated_resources_sv.xtb>
- Firefox sv-SE: <https://github.com/mozilla-l10n/firefox-l10n/tree/main/sv-SE>
- Försäkringskassans designsystem: <https://github.com/Forsakringskassan/designsystem>
- Arbetsförmedlingens designsystem Digi: <https://gitlab.com/arbetsformedlingen/designsystem/digi>
- WordPress sv_SE: <https://translate.wordpress.org/projects/wp/dev/sv/default/>

### Repots egna styrande ytor

- [`ADR-047`](../decisions/ADR-047-pwa-arkitektur-fas-5.md) § Amendering 2026-08-13 (1) och (2)
- [`ADR-078`](../decisions/ADR-078-instant-regeln.md) beslut 4
- [`ADR-113`](../decisions/ADR-113-laddtrappan-yttrappa-for-laddindikatorer.md)
- [`PERFORMANCE-BUDGET.md`](../specs/PERFORMANCE-BUDGET.md)
- [`task-199-frontend-deployvagen-och-sw-precachen-2026-08-13.md`](task-199-frontend-deployvagen-och-sw-precachen-2026-08-13.md)
- [`loading-indikator-branschpraxis-2026-08-15.md`](loading-indikator-branschpraxis-2026-08-15.md)
