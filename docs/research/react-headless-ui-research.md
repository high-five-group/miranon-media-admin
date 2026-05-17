<!-- vale Vale.Terms = NO -->
<!-- DEFERRED: Session 6.6.6 — Vale.Terms canonical-cap fix -->

# Research: React Headless UI-bibliotek for Admin Dashboard

<!-- markdownlint-disable-next-line MD036 -->
*Datum: 2026-04-05 | Kontext: Miranon Media Admin (Vue 3 composable-arkitektur, potentiell React-migration)*

---

## 1. Oversiktstabellen

| Dimension | Radix UI | React Aria (Adobe) | Base UI (MUI) | Ariakit | Headless UI (Tailwind) |
|---|---|---|---|---|---|
| **GitHub stars** | 18 692 | 14 961 (react-spectrum) | 9 105 | 8 538 | 28 491 |
| **npm veckonedladdningar** | 4,0M (unified) / 36,6M (@radix-ui/react-dialog) | 2,1M (react-aria) / 1,6M (react-aria-components) | 274K (@base-ui-components/react) | 652K | 4,8M |
| **Antal komponenter** | ~28 UI-komponenter + ~26 utilities/hooks (54 paket totalt) | 40+ hooks + 50+ komponenter (react-aria-components) | 38 komponenter | ~25 komponenter (17 standard + 8 abstrakta) | 16 komponenter |
| **Bundle-storlek (gzip)** | ~6-9 KB per komponent (tree-shakeable, individuella paket) | ~166 KB totalt (react-aria, ej tree-shakat); per-komponent via individuella paket | ~6 KB per komponent (single package, subdirectory splitting) | Ej verifierat exakt; latt footprint rapporteras | Ej verifierat exakt; relativt litet |
| **TypeScript** | Fullstandigt, val-typat | Fullstandigt, extremt val-typat (generics, strikta typer) | Fullstandigt, val-typat | Fullstandigt | Fullstandigt |
| **ARIA-kompatibilitet** | WAI-ARIA Authoring Practices | WAI-ARIA + WCAG 2.2 (branschledande) | WAI-ARIA APG + WCAG 2.2 | WAI-ARIA standards | WAI-ARIA (grundlaggande) |
| **Tangentbordsnavigation** | Komplett for alla komponenter | Branschledande: arrow keys, typeahead, multi-selection, landmarks | Komplett, APG-monster | Automatisk arrow keys + fokushantering | Grundlaggande, tillfredsstallande |
| **Fokushantering** | Focus scope, focus guards, dismissable layers | Automatisk focus trapping, restore on close, overlay containment | Focus management integrerad | data-active-item, data-focus-visible (automatiskt) | Grundlaggande focus trapping |
| **Senaste release** | Senaste commit: 2026-02-13, senaste npm: 2025-12-17 | react-aria-components@1.16.0 (2026-03-04), commits dagligen | v1.3.0 (2026-03-12), commits dagligen | @ariakit/react@0.4.24 (2026-03-21), commits dagligen | @headlessui/react@v2.2.9 (2025-09-25), senaste commit: 2025-12-12 |
| **Underhallskadens** | **SAKTAT** (veckor/manader mellan commits) | Dagliga commits, manatliga releases | Dagliga commits, manatliga releases | Dagliga commits, frekventa releases | **SAKTAT** (senaste release sep 2025) |
| **Team** | WorkOS (efter forvary av Modulz). Chance Strickland ar huvudunderhallare. Flera ursprungliga skapare har lamnat. | Adobe (stort team, dedikerat) | MUI (7 heltidsanstallda). Inkluderar skapare fran Radix, Floating UI och Material UI | Diego Haz (solo-maintainer, men aktiv) | Tailwind Labs (fokus pa Tailwind CSS, Headless UI ar sekundart) |
| **Licensmodell** | MIT | Apache 2.0 | MIT | MIT | MIT |

---

## 2. Detaljerad analys per bibliotek

### 2.1 Radix UI (radix-ui/primitives)

**Bakgrund:** Skapades av Modulz, som forvarrades av WorkOS 2022. Radix var lange den dominerande headless-losningen i React-ekosystemet och ar grunden som shadcn/ui byggdes pa.

**Styrkor:**

- Extremt brett ekosystem: 54 paket totalt, ~28 UI-komponenter
- Battle-tested: 36,6M veckonedladdningar for enbart `@radix-ui/react-dialog`
- Beprovat `asChild`-monster for render delegation
- Valtypat TypeScript
- Valkand composition-modell (Root, Trigger, Content, etc.)
- shadcn/ui byggt pa Radix = enorm community

**Svagheter:**

- **KRITISKT: Underhallsavmattning.** Senaste commit: 2026-02-13. Fore det: 2025-12-17. Fore det: 2025-11-04. Manadslanga gap.
- Senaste npm-release: 2025-12-17.
- Flera ursprungliga underhallare har lamnat efter WorkOS-forvarvet.
- Rapporterade buggar stangda utan fix (setState depth exceeded).
- React 19-kompatibilitet forsenad jamfort med konkurrenter.
- Ingen Combobox-komponent (medvetet begransad scope).
- Original-skaparen Colm Tuite kallade Radix "a liability" och "last option".

**Underhallsbedomning:** HoG RISK. Aktiv utveckling har avtagit avsevart. WorkOS investerar i underhall via Chance Strickland, men takten ar inte jamforbar med 2023-2024. tldraw (stort open source-projekt) har oppnat issue om migration fran Radix till Base UI.

---

### 2.2 React Aria (Adobe)

**Bakgrund:** Adobes headless-bibliotek, del av react-spectrum-monorepon. Tva lager: `react-aria` (hooks) och `react-aria-components` (sammansatta komponenter). Spectrum 2 (Adobes designsystem) ar byggt ovanpa React Aria Components.

**Styrkor:**

- **Branschledande tillganglighet.** Testat med manga skarmlasare och enheter.
- Mest kompletta biblioteket: 40+ hooks, 50+ komponenter inklusive Calendar, DatePicker, DnD, Color picker, Tree, Tag group
- Internationalisering inbyggd: 30+ sprak, 13 kalendersystem, 5 nummersystem, RTL
- Tva abstraktionslager: hooks (lagsta niva) och komponenter (hogsta)
- Dagliga commits, manatliga releases
- Stort team pa Adobe, langsiktig investering
- React 19-stod tidigt

**Svagheter:**

- Hogre inlarningskurva an Radix (mer verbose API)
- Storre total bundle om man importerar allt (~166 KB gzip for `react-aria`); men tree-shakeable via individuella paket
- API:t ar mer "opiniated" an Radix/Base UI i hur man komponerar
- Apache 2.0-licens (kompatibel men inte MIT)
- Mindre community an Radix (inga shadcn-liknande meta-ramverk ovanpa)

**Underhallsbedomning:** UTMARKT. Dagliga commits. Adobe har eget intresse (Spectrum 2). Stabilt sedan 2020.

---

### 2.3 Base UI (@base-ui-components/react)

**Bakgrund:** Skapad av MUI-teamet, men inkluderar nyckelmedlemmar fran Radix (Colm Tuite som Director of Design Engineering), Floating UI och Material UI. v1.0.0 slapptes 2025-12-11. Positioneras som "nasta generations" headless-bibliotek.

**Styrkor:**

- **Teamet:** 7 heltidsanstallda. Inkluderar skapare fran Radix, Floating UI OCH Material UI -- den mest erfarna kombinationen i ekosystemet.
- Modern API: `render` prop istallet for `asChild` (renare, mer flexibelt)
- 38 komponenter inklusive Combobox, Autocomplete, Menubar, Toast, Drawer -- saker Radix saknar
- Single package med subdirectory splitting (battre tree-shaking)
- WCAG 2.2-kompatibilitet dokumenterad
- shadcn/ui stoder Base UI sedan januari 2026
- Snabb utvecklingstakt: dagliga commits, manatliga releases (v1.0 dec, v1.1 jan, v1.2 feb, v1.3 mar)
- MUI:s affarsmodell (Material UI) ger langsiktig finansiering

**Svagheter:**

- Nytt: v1.0 slapptes december 2025, bara 4 manader sedan
- Laga npm-nedladdningar (274K/vecka) -- ekosystemet ar ungt
- Mindre community och farre resurser/tutorials
- tldraw-teamet rekommenderade "vanta 6-12 manader till dust settles"
- Ingen Vue-variant (bara React)

**Underhallsbedomning:** UTMARKT, men **UNREPROVED**. Teamet ar branschens basta, men biblioteket ar nytt. Risken ar inte underhall (den ar garanterad) utan oforutsedda API-anderingar i tidiga versioner.

---

### 2.4 Ariakit (@ariakit/react)

**Bakgrund:** Skapat av Diego Haz (solo-maintainer). Borjade som Reakit, omskrevs till Ariakit. Anvands av WordPress Gutenberg och WooCommerce.

**Styrkor:**

- Aktiv utveckling: dagliga commits (senast 2026-04-04)
- Elegant API med data-attribut for state-baserad styling (data-active-item, data-focus-visible)
- React 17+ kompatibelt (inte last till senaste React)
- WAI-ARIA standards
- Latt fotavtryck
- WordPress-adoption ger tyngd (Gutenberg ar enormt)
- MIT-licens
- 59+ exempelimplementationer

**Svagheter:**

- Solo-maintainer (Diego Haz) -- bus factor = 1
- Fortfarande pa v0.4.x (inte v1.0) -- API kan andra sig
- 25 komponenter -- mindre an Radix, React Aria och Base UI
- Saknar: Calendar, DatePicker, DnD, Color picker, Tree
- Begransad dokumentation jamfort med Adobe och MUI
- 652K nedladdningar/vecka -- lagre adoption an Radix/Headless UI

**Underhallsbedomning:** AKTIV men RISKABEL. Solo-maintainer ar en sarbarhetsvektor. Om Diego slutar finns ingen backup.

---

### 2.5 Headless UI (Tailwind Labs)

**Bakgrund:** Skapat av Tailwind Labs, designat for saker Tailwind-integration. Enklaste API:t av alla fem.

**Styrkor:**

- Flest GitHub-stjarnor (28 491) -- stark varumarveskannedom
- 4,8M veckonedladdningar
- Enklast att komma igang med
- Perfekt Tailwind-integration
- Fullt tillgangligt for de komponenter som finns
- Stoder bade React och Vue

**Svagheter:**

- **KRITISKT: Underhall har avstannat.** Senaste release: 2025-09-25. Senaste commit: 2025-12-12. Inget pa 4+ manader.
- Bara 16 komponenter -- langt efter konkurrenterna
- Saknar: Calendar, DatePicker, DnD, Table, Toast, Toolbar, Menubar, Tree, m.fl.
- Tailwind Labs fokus ar pa Tailwind CSS v4, inte Headless UI
- Inga planer pa expansion kommunicerade
- For begransat for ett komplett admin-system

**Underhallsbedomning:** LAG PRIORITET for Tailwind Labs. Inte dott, men inte heller aktivt. Otillrackligt for ett komplett designsystem.

---

## 3. shadcn/ui-analys

### Vad ar shadcn/ui?

shadcn/ui ar INTE ett komponentbibliotek i traditionell mening. Det ar ett **koddistributionssystem** -- du kopierar komponentkod direkt in i ditt projekt och ager den. Komponenten ar din att modifiera utan begransningar.

### Nyckeldata

- **GitHub stars:** 111 527 (enormt)
- **Modell:** `npx shadcn@latest add dialog` kopierar komponentkod till ditt projekt
- **Primitiver:** Byggda pa Radix UI ELLER Base UI (sedan januari 2026)
- **Styling:** Tailwind CSS
- **Antal komponenter:** 80+ (inklusive formularkontroller, datatabeller, karuseller, sidebar, etc.)

### Base UI-stod (januari 2026)

I januari 2026 lade shadcn/ui till officielt stod for Base UI som alternativ till Radix. Det innebar:

- `npx shadcn create` later utvecklare valja mellan Radix och Base UI
- Samma komponent-API oavsett underliggande primitiv
- Migration mellan Radix och Base UI kraver inga kodandringar i konsumerande kod
- Fullstandigt komponentbibliotek med Base UI-implementationer

### "Copy code, own it"-modellen for eget designsystem

**Fordelar:**

- Full kontroll over komponentkod -- inga begransningar fran biblioteksabstraktioner
- Inga versionskonflikter -- din kod gar aldrig sonder vid biblioteksuppdateringar
- Utmarkt startpunkt for eget designsystem (anpassa allt)
- AI-vanligt: hela koden ar synlig for AI-verktyg

**Nackdelar:**

- Du maste underhalla kopierad kod manuellt
- Sakerhetsfixar i primitiver maste aktivt hamtas
- Kan driva mot "not invented here"-mentalitet
- Tailwind-kopplat per default (men inte tvingande)

### Implikationer for Miranon-kontexten

shadcn/ui ar relevant som **startpunkt**, inte som slutlosning. For en 11/11/11-kvalitetsstandard behover man ga djupare an vad shadcn ger out of the box. Men konceptet "kopiera och ag" ar direkt jamforbart med hur Miranon Media redan bygger (egna komponenter som studerar FK-kallkod).

---

## 4. Vue Composables -> React Hooks: Mappning

### Grundlaggande skillnader

| Aspect | Vue 3 Composable | React Hook |
|---|---|---|
| **Reaktivitet** | `ref()`, `reactive()`, `computed()` -- explicit, finkornig | `useState`, `useMemo`, `useCallback` -- implicit via re-rendering |
| **Livscykel** | `onMounted`, `onUnmounted` -- explicit cleanup | `useEffect` med cleanup-return -- risk for stale closures |
| **Anrop** | Kan anropas var som helst, inklusive utanfor komponenter | MASTE anropas inuti komponent eller annan hook (Rules of Hooks) |
| **Reaktivt system** | Proxy-baserat, automatisk dependency tracking | Manuell dependency array i useEffect/useMemo/useCallback |
| **Refs** | `ref()` = reaktivt varde, `template ref` = DOM-ref | `useRef` = mutabel container (inte reaktivt), `useState` for reaktivt |
| **Watch** | `watch()`, `watchEffect()` for side effects | `useEffect` (kombinerar mount, update, watch) |

### Specifika composable-mappningar (Miranon Media Mm Library -> React)

| Vue Composable (Miranon Media) | React Hook-ekvivalent | Kommentar |
|---|---|---|
| `useControllable(props, key)` | `useControllableState` (Radix/Base UI har liknande) | Kontrollerat/okontrollerat dual-mode. React har inget inbyggt; biblioteken erbjuder detta. |
| `usePresence(show)` | `useTransitionStatus` (Base UI), animeringsbibliotek | Vue har `<Transition>`, React behover extern losning. |
| `useFocusScope(containerRef)` | `FocusScope` (React Aria), `useFocusTrap` | React Aria har den mest kompletta losningen. |
| `useDismissable(ref, handler)` | `useDismiss` (Floating UI), `onInteractOutside` (Radix) | Radix hanterar detta internt. Base UI ocksa. |
| `useScrollLock()` | `usePreventScroll` (React Aria) | React Aria har detta. |
| `alertScreenReader(msg)` | `useLiveRegion`, `announce()` | Inget standardbibliotek; maste byggas eller anvandas fran React Aria. |
| `useCollection(items)` | `useListState` (React Aria), inbyggt i Base UI | React Aria har starkast stod. |
| `useRovingFocus()` | `useRovingFocusGroup` (Radix), hooks i React Aria | Finns i flera bibliotek. |
| `useTypeAhead()` | Inbyggt i React Aria, delvis i Ariakit | React Aria har branschbast type-ahead. |
| `useResizable()` | Maste byggas eller anvanda react-resizable-panels | Inget headless-bibliotek har detta. |
| `useId()` | `useId()` (React 18+, inbyggt) | React har detta inbyggt sedan v18. |
| `useFocusStack()` | `FocusScope` med nesting (React Aria) | React Aria hanterar focus stacking automatiskt. |

### Nyckelinsikt

Vue composables och React hooks ar **konceptuellt lika** men **mekaniskt olika**. Vues explicita reaktivitetssystem (ref/reactive) ger mer kontroll; Reacts re-render-modell ar enklare men kraver mer manuell dependency-hantering.

**For Miranons 12 composables:** React Aria tacker ~9 av 12 med inbyggda hooks. Base UI tacker ~7 av 12. Radix tacker ~6 av 12. Det innebar att React Aria kraver minst custom-kod for att na samma funktionalitet.

---

## 5. Rekommendation

### Rangordning

| Rang | Bibliotek | Betyg | Motivering |
|---|---|---|---|
| **1** | **React Aria** | 9/10 | Branschledande a11y, flest komponenter, bast hooks, aktivt underhall. Hogre inlarningskurva men bast for 11/11/11-mal. |
| **2** | **Base UI** | 8.5/10 | Modernaste API:t, basta teamet, snabbast vaxande. Nyt men med den starkaste framtidsutsikten. |
| **3** | **Ariakit** | 7/10 | Elegant API, aktiv utveckling. Solo-maintainer och v0.x ar risker. |
| **4** | **Radix UI** | 6.5/10 | Beprovat men **underhallet ar ett reellt problem**. Vaxande migrationstrender bort fran Radix. |
| **5** | **Headless UI** | 4/10 | For begransat, underhall avtar. Inte lampligt for komplett admin-system. |

### Primarekommendation: React Aria

**For ett admin-system med WCAG 2.2 AA+-krav, eget komponentbibliotek och ambition att bara framtida produkter ar React Aria det sakraste valet.**

Motivering:

1. **Tillganglighet:** Ingen annan nar Adobes niva. Testat med riktiga skarmlasare, 30+ sprak, 13 kalendersystem. For ett projekt som har 11/11/11 som kvalitetsmal ar detta ovardepat.
2. **Komplethet:** 40+ hooks + 50+ komponenter tacker allt Miranon Media behover: Dialog, Table, Calendar, DatePicker, DnD, Menu, Select, Combobox, Toast, etc.
3. **Hook-lager:** Mojligheten att anvanda lagsta-niva-hooks ger samma kontroll som Vue composables -- man kan bygga exakt den komponent man vill utan att vara last vid ett komponent-API.
4. **Langsiktighet:** Adobe ar en av varldens storsta mjukvaruforetag. React Aria ar grunden for deras eget designsystem (Spectrum 2). Det gar ingenstans.
5. **Composable-mappning:** 9 av 12 Miranon-composables har direkta ekvivalenter i React Aria.

### Sekundar: Base UI (framtidsval)

Om 6-12 manader, nar Base UI har mognat, kan det bli det basta alternativet. Teamet ar unikt (skapare fran Radix + Floating UI + Material UI), API:t ar modernare an React Aria, och shadcn/ui-integrationen ger ekosystemfordelar. Men idag ar det for nytt for ett projekt som ska bara produktionslast.

### Strategi: React Aria + shadcn/ui

Den optimala strategin for ett Miranon-liknande projekt:

1. **Anvand React Aria hooks som primitiver** (samma roll som Vue composables idag)
2. **Bygg egna komponenter ovanpa** (samma "studera-och-bygg"-approach som med FK)
3. **Anvand shadcn/ui som referens** for visuella monster och Tailwind-integration
4. **Haller ogat pa Base UI** for eventuell migration om 12-18 manader

---

## 6. Kallor

### Jamforelser och analyser

- PkgPulse: "shadcn/ui vs Base UI vs Radix: Components in 2026" (pkgpulse.com)
- LogRocket: "Headless UI alternatives: Radix vs React Aria vs Ark UI vs Base UI" (blog.logrocket.com)
- BestskyTools: "Base UI vs Radix UI: A Detailed Comparison in 2026" (bestsky.tools)
- Certificates.dev: "Starting a React Project? shadcn/ui, Radix, and Base UI Explained" (certificates.dev)
- Builder.io: "15 Best React UI Libraries for 2026" (builder.io)

### Radix-oro

- Medium/dev.to: "Is Your Shadcn UI Project at Risk? A Deep Dive into Radix's Future" (mashuktamim.medium.com)
- GitHub: tldraw issue #7584 "Investigate migrating from Radix UI to Base UI" (github.com/tldraw)
- Reddit r/reactjs: "Radix UI vs Base UI - detailed comparison" (reddit.com)

### Biblioteksdokumentation

- React Aria: react-aria.adobe.com
- Base UI: base-ui.com
- Ariakit: ariakit.com
- Radix UI: radix-ui.com
- Headless UI: headlessui.com
- shadcn/ui: ui.shadcn.com (changelog: 2026-01-base-ui)

### Datakallor

- npm registry API (api.npmjs.org) -- veckonedladdningar hamtade 2026-04-05
- GitHub API (api.github.com) -- stjarnor, issues, commits hamtade 2026-04-05
- Bundlephobia API (bundlephobia.com) -- bundle-storlekar
- InfoQ: "Accessibility with Interactive Components at React Advanced" (infoq.com) -- Ariakit

---

*Research genomford 2026-04-05 av Claude Code for projekt miranon-media-os.*
