# Kvalitetsdefinitioner — 11/10

> **ARKIVERAD 2026-05-11** — denna fil är Vue-projektets kvalitetsdefinitioner-spec från 2026-04-03. React-projektet använder `docs/specs/KVALITETSDEFINITIONER-11-REACT.md` som styrande spec sedan K0åf 2026-05-11. Per ADR-027 (KVALITETSDEFINITIONER-11.md stack-skifte Vue→React). Bevarad som arkivvärd referens — mönsterprinciperna (12 mönster från 5 bibliotek) är direkt input till React-versionen när Fas 3+ komponenter byggs. Använd inte denna fil som styrande för React-arbete.

*Skapad: 2026-04-03 | Baserad på källkodsanalys av Radix UI, Headless UI, Ark UI, Melt UI och FK Designsystem*

---

## Sammanfattning

| Kategori | 10/10 | 11/10 |
|----------|-------|-------|
| **Tillgänglighet** | WCAG 2.2 AA komplett | + prefers-contrast, prefers-reduced-motion, print, type-ahead, aria-live announcer |
| **Teknisk kvalitet** | Ren kod, typat, inga !important, BEM, tokens | + beteendeprimitiver, fokusstack, data-attribut för state, defensiva gränser |
| **Återanvändbarhet** | Props/emits, CSS custom properties, dokumentation | + controlled/uncontrolled, render delegation via slots, state interception, i18n-ready |

---

## 1. Teknisk kvalitet — 11/10

### Vad 10/10 redan innebär (vår baseline)

- Alla props och emits typade
- 0 !important
- CSS via custom properties (tokens)
- BEM-namespace, inga nakna selektorer
- Inga onödiga computed/watchers
- Timer/listener cleanup i onUnmounted
- Inga externa beroenden utöver Vue 3

### Vad 11/10 lägger till

#### A. Beteendeprimitiver som komponeras (Radix-mönstret)

Komplexa komponenter byggs inte som monoliter. De byggs av
återanvändbara beteendeblock:

| Primitiv | Vad den gör | Används av |
|----------|-------------|------------|
| useDismissable() | Escape + click-outside med nestlad lager-hantering | Dialog, Menu, Popover |
| useFocusScope() | Focus trap med sentinel-element, automatisk fokusåterställning | Dialog, Menu |
| useCollection() | Dynamisk registrering/avregistrering av items i DOM-ordning | Menu, Select, Tabs |
| usePresence() | Mount/unmount-livscykel för animationer (inte bara v-if) | Alla med transitions |

**Krav:** Komponenter med overlay/modal/lista SKA använda delade
composables — inte implementera focus trap, dismiss eller collection
från scratch varje gång.

**Checklista:**
- [ ] Focus trap: Implementerad via delad composable, inte inline i komponenten
- [ ] Dismiss: Escape + click-outside hanterat via delad composable med lager-stöd
- [ ] Fokusåterställning: Vid unmount återställs fokus till trigger-elementet
- [ ] Animerad mount/unmount: Hanterat via Presence-mönster (inte bara v-if/v-show)

#### B. Fokusstack (FK-mönstret)

En explicit push/pop-stack för fokushantering:

```typescript
const handle = pushFocus(targetElement)
// ... komponentens livstid ...
popFocus(handle)  // återställer tidigare fokus
```

**Varför:** `element.focus()` vid stängning fungerar för EN modal.
Med nestlade modaler (dialog → confirm → tooltip) behövs en stack
som håller ordning.

**Checklista:**
- [ ] pushFocus() vid öppning — sparar aktivt element
- [ ] popFocus() vid stängning — återställer exakt
- [ ] Fungerar med nestlade lager (modal inuti modal)

#### C. data-attribut för state-baserad styling (Ark-mönstret)

Exponera komponentens tillstånd som data-attribut på DOM-element:

```html
<button data-state="open" data-disabled>
```

```css
[data-state="open"] { background: var(--active-bg); }
```

**Varför:** Konsumenter kan styla baserat på tillstånd utan att
känna till interna klasser. Fungerar med valfritt CSS-ramverk.

**Checklista:**
- [ ] Alla tillståndsändringar reflekteras i data-attribut (data-state, data-expanded, data-active, data-disabled)
- [ ] CSS-klasser kompletterar data-attribut — inte ersätter

#### D. Defensiva gränser

**Checklista:**
- [ ] Props med ogiltiga värden ger console.warn i dev, inte krasch
- [ ] Saknade required props ger tydligt felmeddelande (inte "undefined is not a function")
- [ ] Composables som kräver provide-kontext kastar begripligt fel om inject misslyckas
- [ ] Inga oväntade DOM-mutationer vid snabba state-ändringar (race conditions)

#### E. alertScreenReader()-utility (FK-mönstret)

En global funktion för skärmläsarmeddelanden:

```typescript
alertScreenReader("3 resultat hittades")
```

Skapar temporärt aria-live-element, väntar 100ms, tar bort det.
Vilken kod som helst kan trigga meddelanden utan att en komponent
behöver finnas i DOM-trädet.

**Checklista:**
- [ ] Global utility finns och används vid dynamiska uppdateringar
- [ ] Delay (100ms) respekterar skärmläsarens timing

---

## 2. Återanvändbarhet — 11/10

### Vad 10/10 redan innebär (vår baseline)

- Alla konfigurerbara värden via props
- Alla händelser via emits
- CSS-temabar via custom properties
- Dokumentation (README med props, emits, tangentbord, ARIA)
- 0 externa beroenden utöver Vue 3
- Exporterade TypeScript-interfaces

### Vad 11/10 lägger till

#### A. Controlled/uncontrolled dual-mode (Headless UI-mönstret)

Komponenten fungerar BÅDE med och utan extern state-hantering:

```vue
<!-- Uncontrolled: komponenten hanterar sitt eget tillstånd -->
<MmAccordion default-value="section-1">

<!-- Controlled: föräldern styr tillståndet -->
<MmAccordion v-model:value="activeSection">
```

**Implementering:** Om `modelValue` skickas → kontrollerad.
Om inte → intern ref med `defaultValue` som startvärde.

**Checklista:**
- [ ] Fungerar utan v-model (uncontrolled med default-värde)
- [ ] Fungerar med v-model (controlled — emit update:modelValue)
- [ ] Konsumenten behöver inte veta vilken mode den är i

#### B. Render delegation via scoped slots (Radix/Headless-mönstret)

Exponera internt tillstånd via slot props:

```vue
<MmMenu>
  <template #item="{ active, disabled, selected }">
    <div :class="{ highlighted: active }">
      {{ item.label }}
    </div>
  </template>
</MmMenu>
```

**Varför:** Konsumenten bestämmer rendering, komponenten bestämmer
beteende. Separation of concerns på rätt nivå.

**Checklista:**
- [ ] Default slot renderar "rimligt" utan konfiguration
- [ ] Scoped slots exponerar relevant state (active, open, disabled, selected)
- [ ] Konsumenten kan byta ut HELA renderingen utan att förlora beteende

#### C. State interception (Melt-mönstret)

Låt konsumenten intercepta state-ändringar:

```vue
<MmDialog :on-open-change="({ curr, next }) => {
  if (hasUnsavedChanges) return curr  // blockera stängning
  return next
}" />
```

**Varför:** "Vill du verkligen stänga?" kräver att konsumenten
kan förhindra en tillståndsändring. Utan interception måste
konsumenten bygga sin egen state-hantering ovanpå.

**Checklista:**
- [ ] Kritiska state-ändringar (open/close, select, navigate) kan interceptas
- [ ] Interception-funktionen får { current, next } och returnerar önskat värde
- [ ] Utan interception-prop: standardbeteende (identitetsfunktion)

#### D. Noll hårdkodat innehåll / i18n-ready

**Checklista:**
- [ ] Alla synliga texter (labels, aria-labels, skärmläsartexter) via props med svenska defaults
- [ ] Inga hårdkodade strängar i template — allt konfigurerbart
- [ ] Datum/tid-formatering via Intl.DateTimeFormat (locale-medveten)

#### E. Anatomy-dokumentation (Ark-mönstret)

Varje komponent deklarerar formellt vilka delar den består av:

```
MmDialog
├── trigger     — knappen som öppnar
├── backdrop    — dimmat overlay
├── positioner  — positioneringswrapper
├── content     — dialog-contentet
├── title       — rubrik (aria-labelledby)
├── description — beskrivning (aria-describedby)
└── closeTrigger — stäng-knapp
```

**Checklista:**
- [ ] README innehåller anatomy-diagram
- [ ] Varje del har ett dokumenterat CSS-scope (klass eller data-attribut)
- [ ] Varje del har dokumenterade slot props

#### F. Shared composables för återkommande mönster

Extrahera gemensam logik till composables:

| Composable | Vad | Används av |
|------------|-----|------------|
| useControllable() | Controlled/uncontrolled dual-mode | Alla med v-model |
| useDismissable() | Escape + click-outside | Dialog, Menu, Popover |
| useFocusScope() | Focus trap + sentinel | Dialog, Menu |
| useCollection() | Item-registrering i DOM-ordning | Menu, Select, Tabs |
| useTypeAhead() | Tangentbordssökning med buffert | Menu, Select, Combobox |
| useRovingFocus() | Piltangsnavigering i grupp | Menu, Tabs, RadioGroup |

**Checklista:**
- [ ] Composables lever i src/composables/ — inte inuti komponenter
- [ ] Varje composable har eget test
- [ ] Minst 2 komponenter använder varje composable (annars: prematur abstraktion)

---

## 3. Komplett 11/10-checklista

### Teknisk kvalitet (allt från 10/10 plus:)

- [ ] Beteendeprimitiver: focus trap, dismiss, collection via delade composables
- [ ] Fokusstack: pushFocus/popFocus för nestlade lager
- [ ] data-attribut: alla tillstånd exponeras (data-state, data-expanded, etc.)
- [ ] Defensiva gränser: ogiltiga props → console.warn, inte krasch
- [ ] alertScreenReader(): global utility för skärmläsarmeddelanden
- [ ] Inga race conditions vid snabba state-ändringar

### Återanvändbarhet (allt från 10/10 plus:)

- [ ] Controlled/uncontrolled: fungerar med och utan v-model
- [ ] Scoped slots: exponerar internt tillstånd till konsument
- [ ] State interception: kritiska ändringar kan blockeras
- [ ] i18n-ready: alla texter via props med svenska defaults
- [ ] Anatomy: README dokumenterar alla delar med slots och CSS-scope
- [ ] Shared composables: gemensam logik extraherad och testad

---

## 4. Källor

| Mönster | Bibliotek | Vad vi lärde oss |
|---------|-----------|------------------|
| Beteendeprimitiver (DismissableLayer, FocusScope, Collection, Presence, Popper) | Radix UI | Komplexitet hanteras genom komposition av små, testbara block — inte monolitiska komponenter |
| State machines som sanningskälla | Ark UI / Zag.js | Framework-agnostic core med connect-funktioner — en buggfix fixar alla ramverk. För ambitiöst för oss, men principen (explicit state) är värdefull |
| Focus stack (pushFocus/popFocus) | FK Designsystem | Nestlade modaler kräver en stack, inte bara element.focus() |
| Controlled/uncontrolled dual-mode | Headless UI | useControllable() — avgörs vid runtime baserat på om modelValue-prop finns |
| Builder pattern (createX → element stores) | Melt UI | Total separation av beteende och rendering — konsumenten väljer HTML, biblioteket väljer attribut |
| State interception | Melt UI | onOpenChange({curr, next}) → return next eller curr — låter konsumenten blockera ändringar |
| data-attribut för styling | Ark UI | data-state="open" ger CSS-hooks utan klassnamnsberoende |
| Provide/inject-protokoll | FK Designsystem | Wizard: 7 provide-funktioner, tabell: 5 — barn registrerar sig via inject |
| alertScreenReader() | FK Designsystem | Global utility utanför komponentträdet — vilken kod som helst kan meddela skärmläsaren |
| Anatomy-definitioner | Ark UI | Formell deklaration av komponentens delar — ger konsumenten en karta |
| DOM-ordnad Collection | Radix UI | Items registreras/avregistreras vid mount/unmount, sorteras automatiskt i DOM-ordning |
| Render delegation (as prop, render props) | Headless UI | Konsumenten bestämmer VILKEN tagg — biblioteket bestämmer VILKA attribut |

---

## 5. Vad vi INTE tar med (och varför)

| Mönster | Bibliotek | Varför inte |
|---------|-----------|-------------|
| Fullständiga state machines (XState/Zag) | Ark UI | Kräver eget ramverk. Overhead för 2 utvecklare. Vi använder explicit state via refs istället. |
| Framework-agnostic core | Ark UI | Vi bygger bara för Vue 3. Adapter-lagret ger noll värde. |
| Builder pattern | Melt UI | Svelte-specifikt. Vår Vue-approach med slots+composables ger samma separation. |
| as-prop (polymorfisk rendering) | Headless UI | Vue:s named slots löser samma problem idiomatiskt. as-prop adderar typcomplexitet. |

---

*Denna definition gäller alla nya komponenter. Befintliga komponenter
(AppMenu 11/10/10, AdminShell 10/10/10) uppgraderas progressivt
när de rörs — inte i ett svep.*
