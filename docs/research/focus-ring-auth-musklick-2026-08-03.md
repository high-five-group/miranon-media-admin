---
owner: marcus803
updated: 2026-08-03
review_by: 2027-02-03
status: draft
---

# Fokusring vid musklick i textfält — och vad gör branschledarna med autentiseringsfält? (2026-08-03)

> **Proveniens:** Beställt research-pass 2026-08-03. Marcus överväger ett andra
> undantag i `src/styles/base.css` utöver den befintliga
> `.mm-fokusring-vid-fokus`-klassen (mintad S86 för autofokuserade sökrutor i
> overlays): ska autentiseringsformulär (login + inbjudan/aktivering) visa
> fokusring vid MUSKLICK, inte bara vid tangentbord? Frågan om VAR undantaget
> ska implementeras är redan löst (klass på `<form>`, samma form som
> `.mm-fokusring-vid-fokus[data-rac]:focus`); detta pass svarar bara på OM.

## Kort svar

**Ja.** Text-skrivytor (`<input type="text/email/password">`, `<textarea>`,
`contenteditable`) är en uttalad, dokumenterad UNDANTAGSKLASS i webbläsarnas
`:focus-visible`-heuristik: ringen visas redan som DEFAULT vid musklick i
sådana fält, oavsett hur fältet fokuserades. Det här är inget gränsfall eller
en bugg — det är branschens etablerade, konsekvent efterlevda mönster. Mätt
live hos **9 av 9** granskade produkter (Linear, Vercel, Figma, Notion, Slack,
Stripe, GitHub, GOV.UK One Login, Atlassian) och kodifierat direkt i
källkoden hos tre av de granskade designsystemen (GOV.UK, USWDS, IBM Carbon —
alla med `:focus`, inte `:focus-visible`, på sina textfält).

**Oväntat fynd, direkt relevant för beslutet:** appens nuvarande `/login`-sida
(fortfarande vanlig HTML `<input>`, inte React Aria — se
`src/routes/login.tsx` rad 31) visar **redan** ring vid musklick idag, mätt
live mot dev-servern. Suppressionen Marcus observerade i "riktig Chrome" kommer
med mycket hög sannolikhet inte från `/login` utan från appens React
Aria-baserade `<Input>`-primitiv (`src/components/primitives/Input.tsx`), där
`base.css`:s `[data-rac]:focus-visible:not([data-focus-visible])`-regel
(byggd S73 K85 för popover-dropdowns) tystar ringen på **alla**
React-Aria-ägda skrivytor vid musklick — inte bara dropdowns. Se § Oväntat
fynd nedan. Det betyder att den verkliga frågan är bredare än auth-formulär:
den gäller varje fält byggt med `<Input>`-primitiven, inklusive den planerade
Fas 3-refaktorn av `/login` till React Aria (JSDoc-noten i `login.tsx` rad
128–129 bekräftar refaktorn är beslutad, inte hypotetisk).

## Delfråga 1 — vad säger specen och webbläsarnas faktiska heuristik?

**Spec (auktoritativ förstapartskälla):** CSS Selectors Level 4, CSSWG
editor's draft, § 9.4 "The Focus-Indicated Pseudo-class: `:focus-visible`"
(<https://drafts.csswg.org/selectors/#the-focus-visible-pseudo>, hämtad rått
via `curl` 2026-08-03 eftersom sidan är för stor för WebFetch:s
sammanfattningsmodell). Specen ger en explicit, om än **icke-normativ**,
heuristik-lista för UA:er. Två punkter är direkt avgörande, citerade
verbatim:

> "If the element which supports keyboard input (such as an input element, or
> any other element that would trigger a virtual keyboard to be shown on
> focus if a physical keyboard were not present), indicate focus."
>
> "If the user interacts with the page via a pointing device (mouse,
> touchscreen, etc.) and the focused element does **not** support keyboard
> input, don't indicate focus."

Tillsammans säger dessa två punkter: pekdon-fokus ska INTE tända ringen — UTOM
när elementet stödjer tangentbordsinmatning, då ska ringen tändas oavsett
modalitet. Textfält är alltså inte en tyst bieffekt av heuristiken, utan en
explicit, namngiven gren i den.

**MDN** (<https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible>,
sektion ":focus vs :focus-visible") säger samma sak i produktionsspråk:

> "when a button is clicked using a pointing device, the focus is generally
> not visually indicated, but when a text box needing user input has focus,
> focus is indicated."

**web.dev** (Google, <https://web.dev/articles/style-focus>) skriver det ännu
mer direkt:

> "The control should always show a focus indicator, regardless of the input
> device. For example, this is almost always true of the `<input
> type="text">` element."

**Historiken bakom regeln** (viktig för tyngden i argumentet): detta är inte
en ny uppfinning av `:focus-visible`-specen, utan en kodifiering av
**redan existerande webbläsarkonvention**. WICG:s ursprungliga explainer
(<https://github.com/WICG/focus-visible/blob/main/explainer.md>) skriver det
rakt ut när den motiverar varför specen behövde ett explicit
undantagsmekanism:

> "This is not currently part of the spec, but a mechanism is needed to
> explain the ability of native text fields to match `:focus-visible`
> regardless of how focus arrived on the element."

Alltså: webbläsare visade redan ring i textfält vid musklick INNAN specen
fanns — specen skrevs för att förklara ett beteende som redan existerade, inte
för att införa ett nytt.

**Egen mätning, Chrome 150.0.0.0** (`navigator.userAgent`, chrome-devtools
MCP, 2026-08-03) mot en helt ostylad HTML-sida
(`data:text/html,<input>...`), musklick via CDP `Input.dispatchMouseEvent`
(trusted event, motsvarar en riktig användarklick):

| Element | `el.matches(':focus-visible')` efter musklick | UA-default-ring |
|---|---|---|
| `<input>` (ostylad) | `true` | `outline: auto 1px rgb(0, 95, 204)` (Chromes blå default) |
| `<textarea>` (ostylad) | `true` | — |
| `contenteditable` div | `true` | — |
| `<button>` (ostylad, kontrollfall) | `false` | ingen ring |

Kontrollfallet (`<button>`) bekräftar att heuristiken faktiskt skiljer på
elementtyp, inte bara "alltid true efter en trusted click" — mätningen
falsifierar inte specens påstådda undantag utan bekräftar det exakt.

**Cross-browser:** samma spec-sida (CSSWG-draften) taggar `:focus-visible`
som "in all current engines" med Firefox 85+, Safari 15.4+, Chrome 86+.
Firefox bar samma heuristik under det interna namnet `:-moz-focusring` innan
standardiseringen (Mozilla Bugzilla #1445482,
<https://bugzilla.mozilla.org/show_bug.cgi?id=1445482>: "unifying them is
basically the precondition to ship this standard implementation"). Safari
fick stödet i 15.4 (WebKit-bloggen,
<https://webkit.org/blog/12179/the-focus-indicated-pseudo-class-focus-visible/>,
delvis finansierat via Igalias Open Prioritization). **Obelagt:** jag har
INTE själv mätt i faktisk Firefox eller Safari — chrome-devtools-MCP:t i den
här miljön kör bara Chromium, och Playwright-MCP:t kolliderade med en redan
öppen Chromium-instans. Cross-browser-slutsatsen ovan vilar på dokumentation
(spec + bugtracker + WebKit-blogg), inte egen mätning i de browsarna.

## Delfråga 2 — branschledarnas login-/aktiveringsfält (mätt live)

Metod: navigerade till varje produkts faktiska inloggningssida, blurrade
ev. autofokuserat fält, klickade sedan in i e-post- (och där möjligt
lösenords-) fältet med CDP-dispatchad musklick, och läste
`getComputedStyle()` på `document.activeElement` (samt föräldraelementet, då
flera produkter lägger ringen på en omslutande `<div>` snarare än på
`<input>` direkt — vanligt när fokusindikationen är en `border`/`box-shadow`-
förändring i stället för `outline`). Alla mätningar Chrome 150.0.0.0,
2026-08-03.

| Produkt | URL testad | Mekanism | Ring/indikator vid musklick? |
|---|---|---|---|
| Linear | linear.app/login | `outline: 1px solid` direkt på `<input>` | **Ja** |
| Vercel | vercel.com/login | Tailwind `has-[:focus]` på omslutande `<div>` → `box-shadow` (4px halo) | **Ja** — modalitetsblint (`:has(:focus)`, inte `:focus-visible`) |
| Figma | figma.com/login | `box-shadow: 0 0 0 2px inset` på både e-post och lösenord | **Ja** |
| Notion | app.notion.com/login | `box-shadow` (1px inset + 1px) blått på omslutande `<div>` | **Ja** |
| Slack | slack.com/signin | `box-shadow` 1px + 5px blå halo | **Ja** |
| Stripe | dashboard.stripe.com/login | `outline: solid` + `box-shadow` (1px + 4px lila) på både e-post och lösenord | **Ja** |
| GitHub | `github.com/login` | `box-shadow: 0 0 0 1px inset` blå + `border-color` på både fält | **Ja** |
| GOV.UK One Login | signin.account.gov.uk/enter-email | `outline: 3px solid #ffdd00` + `box-shadow: 0 0 0 2px inset` svart | **Ja** — exakt govuk-frontend-defaulten (se § 3) |
| Atlassian | id.atlassian.com/login | `box-shadow: 0 0 0 1px inset` blå + `border-color` på omslutande `<div>` | **Ja** |

**9 av 9.** Ingen av de granskade produkterna undertrycker fokusindikatorn i
e-post-/lösenordsfältet vid musklick. Mekanismen varierar (ren `outline`,
`box-shadow`-ring, `border-color`-byte, eller en kombination), men den
observerbara effekten — ett synligt, mätbart tillstånds-skifte vid musklick —
är konsekvent i hela urvalet.

## Delfråga 3 — vad säger designsystemen (källkod, inte bara dokumentation)

Dokumentationssidorna för flera av dessa system är antingen tunna på just
denna fråga eller kräver inloggning/betald åtkomst för fullständig text (se
§ Vad jag inte kunde belägga). Jag gick därför till den **kompilerade CSS:en
i respektive npm-paket** (hämtad via unpkg, en officiell CDN-spegel av
paketets publicerade artefakter) och sökte efter selektorn på textfältets
fokus-regel. Det här mäter det verkliga, levererade beteendet snarare än en
sidas beskrivning av det.

| Designsystem | Paket + version (unpkg-upplöst) | Selektor på textfältets fokus-regel | Modalitetsblint? |
|---|---|---|---|
| GOV.UK Design System | `govuk-frontend@5.14.0` | `.govuk-input:focus{outline:3px solid #fd0;...}` | **Ja** — `:focus`, ej `:focus-visible` |
| US Web Design System | `@uswds/uswds@3.13.0` | `input:not([disabled]):focus{outline:.25rem solid #2491ff;...}` (delad regel med `button`, `select`, `textarea`) | **Ja** — `:focus`; noll träffar på `focus-visible` i HELA stilarket |
| IBM Carbon | `@carbon/styles@1.112.0` | `.cds--text-input:focus, .cds--text-input:active{outline:2px solid var(--cds-focus,#0f62fe);...}` | **Ja** — `:focus`; enda `focus-visible`-träffen i filen gäller en orelaterad progress-steg-knapp |
| Shopify Polaris | `@shopify/polaris@13.9.5` | `.Polaris-TextField:focus-within > ... ~ .Polaris-TextField__Backdrop{border-color:var(--p-color-input-border-active);...}` | **Ja** — `:focus-within` (modalitetsblint) driver kant-/bakgrundsbytet; `:focus-visible` på `<input>` själv sätts uttryckligen till `outline:none`, så SJÄLVA ring-outlinen är avstängd men ett annat synligt tillstånd (kantfärg/bredd) visas ändå vid klick |
| Atlassian Design System | `@atlaskit/primitives` (källkodsväg ej lokaliserad) | Kunde inte verifiera via källkod | **Obelagt** via kod — men produktens EGEN inloggningssida (id.atlassian.com, § 2) visar ring-motsvarighet vid klick |
| Adobe Spectrum / React Aria | `react-aria-components` (`useFocusRing`) | `isTextInput`-flaggan styr om tangenttryckningar under skrivning omtolkas som "tangentbord" för ring-syften; API-dokumentationen ger endast raden `"Whether the element is a text input."` | **Nej som DEFAULT-hållning** — se § Delfråga 5 och § Oväntat fynd: detta är precis den mekanism som (indirekt, via appens egen `[data-rac]`-regel) redan tystar ringen i Miranons `<Input>`-primitiv idag |

Mönstret hos GOV.UK, USWDS och Carbon är identiskt och principiellt: de
använder plain `:focus` för formulärfält, INTE `:focus-visible` — ett
medvetet val att alltid visa fokustillstånd på textfält, oavsett hur
`:focus-visible`-heuristiken skulle ha svarat. USWDS går längst: samma regel
gäller även `button` och `select`, dvs. de gör inte ens undantag för knappar.

## Delfråga 4 — WCAG och APG (normativ text)

**2.4.7 Focus Visible** (WCAG 2.1, Level AA,
<https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html>):

> "Any keyboard operable user interface has a mode of operation where the
> keyboard focus indicator is visible."

Normativt gäller kriteriet uttryckligen **tangentbordsfokus**, inte
musfokus. Men "Intent"-avsnittet i samma Understanding-dokument säger
uttryckligen att musfokus-indikation är god praxis, inte ett krav:

> "There may be situations where mouse/pointer users could also benefit from
> having a visible focus indicator... As a best practice, consider still
> providing an explicit focus indicator for these cases."

**Slutsats:** att INTE visa ring vid musklick är inte ett WCAG 2.4.7-brott.
Frågan Marcus ställer ligger alltså ovanför WCAG-golvet, inte på det — det är
ett kvalitets-/konsekvens-beslut, inte ett tillgänglighetskrav i sig.

**2.4.11 Focus Not Obscured (Minimum)** (WCAG 2.2, Level AA,
<https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html>):

> "When a user interface component receives keyboard focus, the component is
> not entirely hidden due to author-created content."

Gäller synligheten av den fokuserade KOMPONENTEN (inte täckt av t.ex. en
sticky header), inte fokus-indikatorns existens eller kontrast — separat
fråga från den vi utreder.

**2.4.13 Focus Appearance** (WCAG 2.2, Level **AAA**, alltså inte del av det
vanliga AA-golvet, <https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html>):

> "When the keyboard focus indicator is visible, an area of the focus
> indicator meets all the following: is at least as large as the area of a 2
> CSS pixel thick perimeter of the unfocused component..., and has a
> contrast ratio of at least 3:1..."

Observera: frågans bakgrund nämner "2.4.11/2.4.13" tillsammans — det är två
olika kriterier (Not Obscured vs. Appearance), inte alternativa numreringar
av samma krav. Ordalydelsen "when the keyboard focus indicator is visible"
gör kriteriet villkorat på KEYBOARD-fokus, precis som 2.4.7.

**1.4.11 Non-text Contrast** (WCAG 2.1, Level AA,
<https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html>):

> "The visual presentation of the following have a contrast ratio of at
> least 3:1 against adjacent color(s): User Interface Components..."

Detta kriterium är modalitetsneutralt: OM en fokusindikator visas (oavsett
hur den utlöstes), måste den hålla 3:1-kontrast mot bakgrunden. GOV.UK
Design Systems egen dokumentation (sökträff, ej djupfetchad rå-text,
<https://design-system.service.gov.uk/get-started/focus-states>) refererar
uttryckligen till just 1.4.11 som skälet till sin gul-svarta kombinerade
fokusstil.

**APG** (ARIA Authoring Practices Guide,
<https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/>) ger ingen
specifik regel om musklick-modalitet på textfält, men den generella
hållningen pekar åt samma håll som allt ovan:

> "Authors are advised to rely on the default focus indicators provided by
> browsers."
>
> "The visual focus indicator must always be visible."

Eftersom webbläsarens DEFAULT för textfält (§ 1) redan är att visa ringen vid
musklick, blir APG:s "lita på default" indirekt ett argument MOT att
undertrycka den — undertryckandet är den aktiva avvikelsen, inte tystnaden.

## Delfråga 5 — argument MOT (källbelagda, inte gissade)

**Det starkaste källbelagda argumentet mot** kommer från `:focus-visible`-
mekanismens egen grundmotivering. WICG:s explainer
(<https://github.com/WICG/focus-visible/blob/main/explainer.md>) beskriver
varför utvecklare historiskt stängde av `outline` helt:

> "The former often seems to be a result of finding the default focus ring
> both aesthetically unpleasant and confusing to users when applied after a
> mouse or touch event."
>
> "A visual indication of what has focus is only interesting to a user who
> is using the keyboard to interact with the page. A user using any kind of
> pointing device would only be interested in what is in focus if they were
> just about to use the keyboard - otherwise, it is irrelevant and
> potentially confusing."

Detta är ett genuint argument — men observera att källan SJÄLV, i samma
dokument, gör undantag för textfält (se § 1 och § 3): argumentet gäller
knappar, länkar och andra "jag vet redan var jag klickade"-kontroller, inte
skrivytor där användaren omedelbart behöver veta VAR text kommer hamna.
Källan motsäger alltså inte punkt 1 — den förklarar bara varför
`:focus-visible` överhuvudtaget behövdes för resten av gränssnittet.

**React Aria/Adobe Spectrum är det enda konkreta motexemplet** jag hittade
bland etablerade komponentbibliotek på en explicit, DEFAULT-hållning som
avviker från webbläsarens textfälts-undantag. Dokumentationssidan för
`useFocusRing` (<https://react-aria.adobe.com/useFocusRing>) beskriver
`isTextInput`-flaggan minimalt ("Whether the element is a text input."), men
ett GitHub-ärende (adobe/react-spectrum#5658,
<https://github.com/adobe/react-spectrum/issues/5658>) om en regression i
detta beteende bekräftar indirekt att React Arias globala
modalitets-spårning (`isFocusVisible()`/`data-focus-visible`) inte
automatiskt återger webbläsarens "alltid ring på textfält"-undantag — den
kräver ett extra flagg-beslut. **Obelagt i detalj:** jag kunde inte
lokalisera källfilen (`useFocusVisible.ts`) i den omstrukturerade
`react-spectrum`-monorepon (flera gissade sökvägar gav 404 mot GitHubs raw-
och contents-API:er) för att verifiera EXAKT vad `isTextInput: true` gör vid
ett rent musklick kontra vad avsaknad av flaggan gör. Vad jag KAN belägga
utan tvekan är den empiriska EFFEKTEN i vår egen kod (§ Oväntat fynd nedan):
appens React-Aria-ägda textfält visar inte ring vid musklick, medan samma
fälts native-HTML-motsvarighet gör det.

**Ett tredje, mer spekulativt men rimligt argument** (inte direkt
källbelagt, men konsekvent med `1.4.11`- och kontrast-litteraturen): om ring
vid musklick infördes på VARJE textfält i ett tätt formulär med många fält
(t.ex. ett långt registreringsformulär), skulle varje musklick generera en
visuell "flash" som kan uppfattas som brus snarare än information, eftersom
användaren redan vet var den klickade. Det här är EXAKT den oro WICG:s
explainer beskriver ovan — men eftersom alla 9 granskade produkter ändå gör
undantaget (inklusive Stripe och GitHub, vars formulär har flera fält),
verkar branschens samlade bedömning vara att argumentet inte väger tyngre än
konsekvens-vinsten för skrivytor specifikt.

## Oväntat fynd — appens egen kod visar mekanismen, inte bara login

Detta är utanför den ursprungliga frågans scope men direkt relevant för
beslutet, så det registreras här i stället för att tystas (ADR-053-triage:
blockerar inte nuvarande forskningsfråga, men värdefullt — registreras
explicit).

Jag körde `npm run dev` lokalt (efter att symlinka `node_modules` in i
worktreen) och mätte tre faktiska ytor i appen, Chrome 150.0.0.0, 2026-08-03:

1. **`/login` (produktionsroute, `src/routes/login.tsx`):** e-post- och
   lösenordsfälten är **vanlig HTML `<input>`** — koden själv dokumenterar
   det: "**Designval:** Plain `<form>` + Tailwind, INTE React Aria. Refactor
   till React Aria Form + MmInput + MmButton sker i Fas 3" (rad 31–32).
   Musklick på `#login-email` gav `outline: solid 2px rgb(27, 73, 101)`
   (`--mm-focus-ring`) — **ringen visas redan, idag, i produktion**, eftersom
   `data-rac`-attributet saknas och det globala `*:focus-visible`-reglaget
   (base.css rad 130–134) därför får styra ostört.

2. **`/dev/primitives`, `<Input>`-primitivens textfält
   (`src/components/primitives/Input.tsx`, byggd på `react-aria-components`
   `TextField`/`Input`, ADR-044):** samma musklicks-test på ett `Input`-fält
   gav `hasDataRac: true`, `hasDataFocusVisible: false`,
   `el.matches(':focus-visible'): true`, men `outlineStyle: none` —
   **INGEN ring**, trots att webbläsarens EGNA heuristik säger "visa". Detta
   är exakt `base.css` rad 147–156:
   `[data-rac]:focus-visible:not([data-focus-visible]) { outline: none; }`
   i aktion — en regel som kommentaren i filen förklarar byggdes för
   POPOVER-DROPDOWNS (S73 K85: en Select-lista som autofokuserades vid
   musöppning fick oönskad ring). Regeln är skriven generellt mot
   `[data-rac]`, så den träffar VARJE React-Aria-ägt fokuserbart element —
   inklusive vanliga textfält, vilket sannolikt inte var den ursprungliga
   avsikten.

3. **Samma `Input`-fält, Tab i stället för klick:** `hasDataFocusVisible:
   true`, `outlineStyle: solid 2px rgb(27, 73, 101)` — ringen fungerar
   korrekt vid tangentbord. Detta bekräftar att asymmetrin är exakt
   modalitets-driven, inte ett trasigt fält.

**Tolkning:** Marcus observation ("ring vid Tab, ingen ring vid musklick —
även i textfält", 2026-08-03) beskriver med mycket hög sannolikhet
`<Input>`-primitivens beteende (som redan används i flera riktiga
formulär i appen, t.ex. events-relaterade vyer — sök `TextField` gav 20+
träffar i `src/components`), inte `/login` specifikt — `/login` visar
redan ring vid klick idag, mätt direkt ovan. Det betyder att beslutet
Marcus står inför inte bara gäller "ska auth-formulär få ett undantag" utan
egentligen "ska `[data-rac]`-släckaren begränsas så den INTE träffar vanliga
textfält" — en fråga som blir akut så snart `/login` refaktoreras till
`<Input>`-primitiven i Fas 3, enligt appens egen redan beslutade plan.

Notera också: appen har REDAN en exakt mall för hur ett sådant riktat
undantag ser ut i kaskaden — `.mm-fokusring-vid-fokus[data-rac]:focus`
(base.css rad 158–166) övertrumfar redan `[data-rac]`-släckaren för ETT
specifikt fall (S86 sökrutor). Samma mönster, applicerat brett på
`<Input>`/`TextField` snarare än en enskild klass, skulle lösa både
auth-fallet och det bredare `<Input>`-fallet i ett steg — men det är ett
designbeslut om VAR, vilket ligger utanför den här frågans avgränsning.

## Dom

Ja, textfält (inklusive auth-fält) ska visa fokusring vid musklick. Detta är:

- **Webbläsarnas egen, spec-dokumenterade default-heuristik** för
  skriv-ytor — inte en stilistisk preferens appen skulle uppfinna, utan ett
  beteende appens `.mm-fokusring-vid-fokus`-mekanism för närvarande
  KOMPENSERAR FÖR FRÅNVARON AV (eftersom `[data-rac]`-släckaren aktivt slår
  av det webbläsaren annars skulle ge gratis).
- **Branschkonsekvent utan undantag** i det granskade urvalet (9/9 produkter,
  3/3 källkods-verifierade designsystem med uttalad `:focus`-policy).
- **Inte ett WCAG-krav** (2.4.7 gäller normativt bara tangentbord) men väl i
  linje med APG:s "lita på default"-hållning och med 1.4.11:s
  kontrastkrav när ringen väl visas.
- **Bredare än auth**: det finns inget sakligt skäl att särbehandla just
  inloggning/aktivering — samma logik (skriv-yta, användaren behöver veta var
  texten hamnar) gäller varje textfält i appen. Auth är bara den yta där
  bristen först märktes.

## Vad jag inte kunde belägga

- **Firefox och Safari, egen mätning.** Endast Chrome 150.0.0.0 uppmätt live
  (chrome-devtools-MCP). Cross-browser-stödet ovan (Firefox 85+, Safari
  15.4+) vilar på spec-sidans "Baseline"-taggning + Mozilla Bugzilla + WebKit-
  bloggen — dokumentation, inte egen mätning. Ingen anledning att tro att
  heuristiken skiljer sig (`:focus-visible` är ett Interop/Baseline-
  standardiserat beteende), men det är overifierat här.
- **React Arias exakta `isTextInput`-semantik vid rent musklick.** Kunde inte
  lokalisera `useFocusVisible.ts`/`useFocusRing.ts`-källfilen i den
  omstrukturerade `react-spectrum`-monorepon (flera gissade sökvägar gav 404
  mot både raw.githubusercontent.com och GitHubs contents-API). Det jag KAN
  belägga är effekten i vår egen kod (§ Oväntat fynd), inte den exakta
  bibliotekslogiken bakom `data-focus-visible`.
- **Atlassian Design Systems källkod.** `@atlaskit/primitives`s `Focusable`-
  komponent gick inte att hämta via unpkg (404 på gissade sökvägar).
  Kompenserat med en live-mätning av Atlassians egen produktionsinloggning
  (id.atlassian.com), som visar samma mönster som övriga — men mekanismen
  (CSS-selektor `:focus` vs. `:focus-within` vs. JS-styrd) är inte verifierad.
  Sekundärkällor (sökresultat) nämner "3:1 kontrast" och en deprecation mot
  "Focusable"-primitiven men inget om `:focus-visible`-användning.
  Shopify Polaris källkods-mönster (`:focus-within`) beskriver bara det
  bekräftade fyndet — jag antar INTE att Atlassian gör likadant.
  - **Uppdatering vid granskning:** Detta stycke dubblerar delvis Delfråga
    3:s tabellrad om Atlassian. Ingen ny information tillkommer här utöver
    vad som redan står där; kvarhålls ändå explicit eftersom "vad jag inte
    kunde belägga" ska vara uttömmande och sökbar på egen hand.
- **Om `[data-rac]`-släckarens bredare träffyta i produktion redan orsakat
  andra, odokumenterade "ingen logik"-upplevelser** utöver `<Input>`-
  primitivens fält (t.ex. `TextArea.tsx`, som också bygger på
  `react-aria-components` och sannolikt bär samma `data-rac`-attribut och
  därmed samma suppression). Jag verifierade INTE `TextArea.tsx` live — bara
  läste att den importerar `TextField` från `react-aria-components`
  (samma familj som `Input.tsx`). Sannolikt samma beteende, men omätt.
- **Hur många av appens ~20 träffar på `TextField`-användning** (sökning i
  `src/components`) som faktiskt renderar synliga skrivytor kontra andra
  RAC-mönster (kombinerade sök-/filterkomponenter etc.) — jag räknade
  träffar men granskade inte var och en.

## Rekommendation

**REKOMMENDATION (inte beslut — Marcus äger riktningen):**

**Ja**, autentiseringsformulär (login + inbjudan/aktivering) bör visa
fokusring vid musklick i sina textfält. Skälet är inte primärt
"konsekvens med branschen" i sig, utan att det ÄR webbläsarens egen,
spec-dokumenterade default för skriv-ytor — appens nuvarande gap (där det
finns) är en AKTIV avvikelse (via `[data-rac]`-släckaren) från vad
plattformen annars ger gratis, inte en neutral baslinje.

**Och: nej, det bör inte vara ett auth-specifikt specialundantag.** Samma
motivering gäller varje textfält i appen som byggs på
`<Input>`/`react-aria-components`. Att lösa det smalt för auth (en klass på
`<form>`, enligt den redan beslutade implementationsformen) är en rimlig
FÖRSTA landning eftersom auth är där bristen upptäcktes och där konsekvensen
av ett förvirrande fokusläge är som störst (användaren skriver känsliga
uppgifter, kan inte se var markören är). Men den bör följas av samma fråga
för `<Input>`-primitiven generellt — annars återskapas exakt samma
"ingen logik"-upplevelse (S86:s eget begrepp) i varje annat formulär som
redan använder primitiven, och garanterat i `/login` självt så snart Fas
3-refaktorn landar och bytet till `<Input>` sker.

Konkret förslag till nästa steg (rekommendation, inte genomförande här):
avgör om `.mm-fokusring-vid-fokus`-mönstret ska breddas till att gälla
`[data-rac]`-textfält generellt (inte bara auth-formulär och inte bara S86:s
sökrutor), snarare än att lägga ett tredje, smalt specialfall ovanpå de två
som redan finns.

## Källförteckning

- CSS Selectors Level 4, CSSWG editor's draft, § 9.4
  <https://drafts.csswg.org/selectors/#the-focus-visible-pseudo> (hämtad rått
  2026-08-03, WebFetch klarade inte hela dokumentet)
- MDN, `:focus-visible`
  <https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible>
- web.dev, "Style focus" <https://web.dev/articles/style-focus>
- WICG focus-visible explainer
  <https://github.com/WICG/focus-visible/blob/main/explainer.md>
- Mozilla Bugzilla #1445482
  <https://bugzilla.mozilla.org/show_bug.cgi?id=1445482>
- WebKit-bloggen, "The Focus-Indicated Pseudo-class :focus-visible"
  <https://webkit.org/blog/12179/the-focus-indicated-pseudo-class-focus-visible/>
- WCAG 2.1 Understanding, 2.4.7 Focus Visible
  <https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html>
- WCAG 2.1 Understanding, 1.4.11 Non-text Contrast
  <https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html>
- WCAG 2.2 Understanding, 2.4.11 Focus Not Obscured (Minimum)
  <https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html>
- WCAG 2.2 Understanding, 2.4.13 Focus Appearance
  <https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html>
- ARIA Authoring Practices Guide, Developing a Keyboard Interface
  <https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/>
- GOV.UK Design System, "Understanding focus state styles"
  <https://design-system.service.gov.uk/get-started/focus-states>
- `govuk-frontend@5.14.0`, kompilerad CSS via unpkg
  <https://unpkg.com/govuk-frontend@5/dist/govuk/govuk-frontend.min.css>
- `@uswds/uswds@3.13.0`, kompilerad CSS via unpkg
  <https://unpkg.com/@uswds/uswds@latest/dist/css/uswds.min.css>
- `@carbon/styles@1.112.0`, kompilerad CSS via unpkg
  <https://unpkg.com/@carbon/styles@latest/css/styles.css>
- `@shopify/polaris@13.9.5`, kompilerad CSS via unpkg
  <https://unpkg.com/@shopify/polaris@latest/build/esm/styles.css>
- React Aria, `useFocusRing` <https://react-aria.adobe.com/useFocusRing>
- adobe/react-spectrum, GitHub-ärende #5658
  <https://github.com/adobe/react-spectrum/issues/5658>
- Live-mätningar 2026-08-03, Chrome 150.0.0.0 (chrome-devtools MCP):
  `linear.app/login`, `vercel.com/login`, `figma.com/login`,
  `app.notion.com/login`, `slack.com/signin`, `dashboard.stripe.com/login`,
  `github.com/login`, `signin.account.gov.uk/enter-email`, `id.atlassian.com/login`
- Egen kod: `src/styles/base.css` (rad 111–166),
  `src/routes/login.tsx` (rad 31–32, 128–129),
  `src/components/primitives/Input.tsx`,
  live-mätning mot `npm run dev` (`/login`, `/dev/primitives`), 2026-08-03
