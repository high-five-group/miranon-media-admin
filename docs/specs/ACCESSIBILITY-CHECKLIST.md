
# Tillgänglighetschecklista — Miranon Media Admin

> **Skapad:** 2026-04-01 (Vue/FKUI-version)
> **Omskriven:** 2026-05-04 (P2 stödspec-synk → React Aria + WCAG 2.2 AA)
> **Gäller:** miranon-media-admin (React 19 SPA)
> **Korsreferens:** `ARIA-UPGRADE.md` äger ARIA 1.3-attribut per komponent + EAA-checklista. Denna fil äger fas-checklistor + React Aria-mönsterbibliotek + test-infrastruktur.

Denna checklista säkerställer att projektet följer **WCAG 2.2 AA** och svensk Tillgänglighetsdirektiv (DOS) / EAA. Admin är en intern React 19 SPA — inte en publik sajt — men tillgänglighet är lika viktig: Lotta ska kunna använda appen effektivt oavsett enhet, situation eller eventuella funktionsvariationer.

Använd checklistan vid varje ny vy, komponent eller leveranssteg.

---

## Stack-karta — vad löser vad

| Behov | Verktyg | Var detaljer finns |
|---|---|---|
| Headless interaktiva primitiver | `react-aria-components` + React Aria-hooks | `ARIA-UPGRADE.md` per komponent |
| Komponent-styling | Tailwind v4 + 3-lagers CSS-tokens | `DESIGN-SYSTEM-SPEC.md` |
| Formulär | React Aria Form + Zod | §3 nedan |
| Tabeller | React Aria + TanStack Table | §3 nedan |
| Disclosure/Accordion | React Aria `useDisclosure` | §6 mönsterbibliotek |
| Modaler | React Aria `useDialog` + `useOverlay` + `useModalOverlay` | §6 mönsterbibliotek |
| Menyer | React Aria `useMenuTrigger` + `useMenu` | §6 mönsterbibliotek |
| Sökfält med autocomplete | React Aria `useComboBox` | §6 mönsterbibliotek |
| Listrutor | React Aria `useListBox` | §6 mönsterbibliotek |
| Auto-test | axe-core + @axe-core/playwright | §5 test-infrastruktur |
| Manuell test | VoiceOver (macOS), NVDA (Windows), TalkBack (Android) | §4 manuella tester |
| Färgkontrast | Tailwind tokens + manuell verifiering via Lighthouse/Stark | §4 |
| Browser-zoom & textförstoring | CSS rem-baserad sizing + flexlayout | §4 |

**Referenser:**

- WCAG 2.2 snabbguide: <https://www.w3.org/WAI/WCAG22/quickref/?levels=aa>
- ARIA Authoring Practices Guide: <https://www.w3.org/WAI/ARIA/apg/>
- React Aria docs: <https://react-spectrum.adobe.com/react-aria/>
- React Aria Components: <https://react-spectrum.adobe.com/react-aria/components.html>
- DIGG (svensk myndighet för digital förvaltning): <https://www.digg.se/webbriktlinjer>
- autocomplete-värden för formulärfält (WCAG 1.3.5): <https://www.w3.org/TR/WCAG22/#input-purposes>

---

## §1 — Innan du bygger

<!-- vale Vale.Terms = NO -->
- [ ] **React Aria först.** Finns en React Aria-komponent eller -hook för detta? Kolla `react-aria-components` + Aria-hooks innan du skriver eget. Branschledarens mönster är golvet (CLAUDE.md).
<!-- vale Vale.Terms = YES -->
- [ ] **TanStack Table för tabeller.** Inte egen sortering/paginering — TanStack Tables headless-modell + React Aria-keyboard-handling.
- [ ] **Sidans struktur är skissad** med rätt rubriknivåer (h1 > h2 > h3, aldrig hoppa). En h1 per vy.
- [ ] **Fokushantering är planerad** för dynamiska element (modaler, menyer, accordion). Vad händer vid open? Vid close? Vid Escape?
- [ ] **Kontextuell info via `aria-description`** — när label inte räcker. Se `ARIA-UPGRADE.md §1`.
- [ ] **Felmeddelanden** — har varje fält en plan för (a) synligt felmeddelande, (b) `aria-errormessage` + `aria-invalid` när fel uppstår?
- [ ] **Loading/empty/error-tillstånd** — har vyn alla tre dokumenterade?

---

## §2 — Under byggandet — kod och struktur

### Markup och struktur

- [ ] `<html lang="sv">` satt i `index.html`
- [ ] En `<h1>` per vy, hierarki aldrig bruten (h1 → h2 → h3, aldrig h1 → h3)
- [ ] Landmarker definierade: `<main>`, `<nav>`, `<header>`, `<footer>`
- [ ] Skip-link först i DOM, synlig vid Tab-fokus
- [ ] Alla interaktiva element är `<button>`, `<a>` eller har `role` + tab-index korrekt — aldrig `<div onClick>` utan ARIA-stöd
- [ ] React Aria-komponenter används för Button, Dialog, MenuTrigger, ComboBox, ListBox, Disclosure (se §6)

### Tangentbord

- [ ] Tab/Shift+Tab fungerar genom hela vyn i logisk ordning (uppifrån-ner, vänster-höger)
- [ ] Enter aktiverar buttons + länkar
- [ ] Escape stänger modaler, menyer och popover
- [ ] Fokus syns alltid (global fokusregel: `*:focus-visible { outline: 2px solid var(--mm-focus-ring); outline-offset: 2px; }`)
- [ ] Fokusring-färg är `--p-blue-700` (#1B4965) — exklusiv färg, används inte till något annat
- [ ] React Aria's `FocusScope` används i alla overlay-komponenter (modaler, menyer) för automatisk fokus-trap + return-on-close
- [ ] Inga tangentbordsfällor utanför avsiktliga modaler

### Formulär (React Aria + Zod)

- [ ] React Aria-komponenter: `TextField`, `NumberField`, `Select`, `Checkbox`, `RadioGroup` används istället för rå HTML
- [ ] Varje fält har `<Label>` (synlig, inte bara placeholder)
- [ ] Required fält markeras med text "(obligatorisk)" — aldrig bara asterisk
- [ ] Fält för persondata har korrekt `autocomplete`-attribut (WCAG 1.3.5):
  - Namn: `autocomplete="name"`
  - E-post: `autocomplete="email"`
  - Telefon: `autocomplete="tel"`
  - Adress: `autocomplete="street-address"`, `postal-code`, `address-level2` (ort)
- [ ] Validering: Zod-schema vid submit. Felmeddelanden kopplas via `aria-errormessage` (se ARIA-UPGRADE.md §1)
- [ ] Felmeddelandet beskriver *vad som är fel* OCH *hur man fixar det* (Gunilla-principen)
- [ ] Fokus flyttas till första felet vid submit-fel
- [ ] Meddelanden vid lyckad submit annonseras via `aria-live="polite"` eller via screen reader announcer (`alertScreenReader('Sparat')` från `src/lib/alert-screen-reader.ts`)

### Datatabeller (React Aria + TanStack Table)

- [ ] Tabellen använder semantiska element: `<table>`, `<thead>`, `<tbody>`, `<th scope="col">`, `<td>`
- [ ] Tabellen har `<caption>` eller `aria-label` som beskriver innehållet ("Anmälningar för Rongne Retreat")
- [ ] Sorteringskontroller har `aria-sort="ascending|descending|none"` på `<th>`
- [ ] Paginering har `aria-label` (t.ex. "Sidnavigering anmälningar") och `aria-current="page"` på aktiv sida
- [ ] Filtrerings-/sökresultat annonseras via `aria-live="polite"` på resultat-container ("23 av 156 anmälningar matchar filter")
- [ ] Radåtgärder är tangentbord-tillgängliga (Enter/Space på radens primärknapp)

### Navigation (slide-in-meny via React Aria Disclosure/MenuTrigger)

- [ ] Menyn använder React Aria `MenuTrigger` + `Menu` om det är en åtgärdsmeny, eller `Disclosure` om det är en innehållssektion som expanderar
- [ ] Menyknappen har `aria-expanded="true|false"` (React Aria sätter detta automatiskt)
- [ ] Menyn har `role="navigation"` på containern + `aria-label="Huvudmeny"` (om primär nav)
- [ ] Sektionsheaders i en accordion-meny har `aria-expanded` för accordion-state (React Aria Disclosure hanterar)
- [ ] Aktiv sida markeras med `aria-current="page"` (inte bara visuell färg)
- [ ] Stängs med Escape (React Aria Menu hanterar)
- [ ] Stängs med klick utanför (React Aria `useOverlay` hanterar)
- [ ] Fokus återgår till menyknappen vid stängning (React Aria `FocusScope` hanterar)
- [ ] Touch targets minst 44×44 px på mobil (rekommenderat) — minst 24×24 px alltid (WCAG 2.2 AA krav)

### Statushantering och feedback

- [ ] Loading-tillstånd: `aria-busy="true"` på containern som uppdateras
- [ ] Skeleton-loading: synlig + `aria-label="Laddar..."` på containern
- [ ] StatusBadge: text alltid synlig, färg är aldrig ensam informationsbärare
- [ ] Toast/notification: `role="status"` + `aria-live="polite"` (för icke-kritisk info) eller `role="alert"` + `aria-live="assertive"` (för fel)
- [ ] Modaler/dialoger har `aria-labelledby` på rubriken + ev. `aria-describedby` på beskrivningen (React Aria Dialog hanterar)

### Felsidor och undantagstillstånd

- [ ] Tomma tillstånd ("Inga obetalda just nu") har förklarande text + ev. CTA — aldrig tom skärm
- [ ] Error-state har retry-knapp + beskrivande meddelande (Gunilla-test: förstår hon vad hon kan göra?)
- [ ] Nätverksfel (Edge Function timeout, offline) hanteras med tydligt meddelande, inte bara generisk "Något gick fel"
- [ ] Stale data-indikator när cachad data visas pga offline (se DESIGN-SYSTEM-SPEC §10)

### Session och autentisering

- [ ] Login fungerar med tangentbord + Enter på lösenordsfält → submit
- [ ] Session timeout-varning visas senast 60s före automatisk utloggning (EAA E7) — med möjlighet att förlänga
- [ ] Vid utloggning: tydligt meddelande + redirect till `/login`
- [ ] Felaktig inloggning: meddelande som inte avslöjar om e-posten finns ("Felaktiga uppgifter") — säkerhetskrav

---

## §3 — Verifiering efter bygge

### Automatiserade tester (kräver §5 test-infrastruktur)

- [ ] axe-core: 0 critical, 0 serious violations på vyn
- [ ] Lighthouse Accessibility score ≥ 95
- [ ] Playwright a11y-test passerar för vyns happy path

### Manuella tester

- [ ] **Tangentbord:** Tabba igenom hela vyn med stängd musen — alla flöden möjliga? Fokusring synlig? Logisk ordning?
- [ ] **Skärmläsare** (välj minst en):
  - macOS: VoiceOver — testa enligt `ARIA-UPGRADE.md` testmatris (1 Nav, 2 Rubrik, 3 Element, 4 Live, 5 Fel, 6 Tom, 7 Dialog)
  - Windows: NVDA (gratis) eller JAWS — samma matris
- [ ] **Zoom 200%:** Inget försvinner, överlappar eller kräver horisontell scroll
- [ ] **Textförstoring 200%** (browser font size): Layout intakt, inga overflow-bugs
- [ ] **320 px bredd:** Ingen horisontell scroll, alla CTA:er nåbara
- [ ] **Färgkontrast:** All text minst 4.5:1 (normal storlek) eller 3:1 (stor text ≥18px / 14px bold). Verifiera med Stark, Lighthouse eller manuell pipett.
- [ ] **Touch targets:** Alla interaktiva element minst 24×24 px (WCAG 2.2 AA), 44×44 px på primärflöden (Apple HIG)
- [ ] **`prefers-reduced-motion: reduce`:** Animationer ersatta med direkt uppdatering eller mycket kort fade
- [ ] **`prefers-contrast: more`:** Förstärkt kontrast på borders, focus-indikatorer, statusbadges

### Screen reader-specifika kontroller

- [ ] Route-byten annonseras via Route Announcer (Fas 5-leverabel) — inte tyst sidbyte
- [ ] Dynamiska listor (filtrerade resultat, nya anmälningar) har `aria-live="polite"` på container
- [ ] Modaler annonseras vid open (React Aria Dialog hanterar via `aria-labelledby`)
- [ ] Förändringar i `<button>`-text (t.ex. "Sparar..." → "Sparat") annonseras lämpligt

---

## §4 — Responsivitet och kontextkrav

- [ ] Sidan fungerar på 320 px bredd utan horisontell scroll
- [ ] Sidan fungerar med textförstoring (browser font size) upp till 200%
- [ ] `prefers-reduced-motion` respekteras för alla animationer (View Transitions inkluderat — se DESIGN-SYSTEM-SPEC §9)
- [ ] `prefers-contrast: more` ger förstärkt visuell kontrast (StatusBadge, focus-ring, borders)
- [ ] Print-stylesheet finns för utskrivbara vyer (anmälningslista, kvitton) — minst readable layout
- [ ] Tab bar nedersta är minst 44 px hög på mobil (touch target)

---

## §5 — Test-infrastruktur (Fas 3.5-leverabel)

> **Status:** Detta är en av Fas 3.5:s tre leveranser. Inte aktiverad i produktion förrän Fas 3.5 implementerats. P2-trigger-rapporten i `tasks/sessions/archive/2026-05/2026-05-04-stodspec-synk-p2.md` Del 5 markerade behovet som JA.

### Installation

```bash
npm install --save-dev @axe-core/playwright
# axe-core dras in som transitive dependency
```

### Playwright-config-tillägg

```typescript
// playwright.config.ts — befintlig config + a11y-projekt
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  projects: [
    {
      name: 'visual',
      testDir: './tests/visual',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'a11y',
      testDir: './tests/a11y',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

### Fixture-mönster

```typescript
// tests/a11y/fixtures.ts
import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type A11yFixtures = {
  checkA11y: (options?: { include?: string[]; exclude?: string[] }) => Promise<void>;
};

export const test = base.extend<A11yFixtures>({
  checkA11y: async ({ page }, use) => {
    await use(async (options) => {
      const builder = new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']);

      if (options?.include) options.include.forEach((s) => builder.include(s));
      if (options?.exclude) options.exclude.forEach((s) => builder.exclude(s));

      const results = await builder.analyze();

      // Atomär verifiering: 0 critical OCH 0 serious. Övriga loggas som warning.
      const blocking = results.violations.filter((v) =>
        v.impact === 'critical' || v.impact === 'serious'
      );

      if (blocking.length > 0) {
        const summary = blocking.map((v) => `${v.impact}: ${v.id} (${v.help})`).join('\n');
        throw new Error(`${blocking.length} accessibility violation(s):\n${summary}`);
      }
    });
  },
});

export { expect };
```

### Test-mall per vy

```typescript
// tests/a11y/event-list.spec.ts
import { test, expect } from './fixtures';

test.describe('EventList — a11y', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/event');
  });

  test('initial render — no critical/serious violations', async ({ checkA11y }) => {
    await checkA11y();
  });

  test('filter applied — listan annonseras + 0 violations', async ({ page, checkA11y }) => {
    await page.getByRole('button', { name: 'Status' }).click();
    await page.getByRole('option', { name: 'Kommande' }).click();

    // Live-region har annonserat ändringen
    await expect(page.getByRole('status')).toContainText(/visar \d+ av/i);

    await checkA11y();
  });

  test('keyboard-only navigation från start till första radens åtgärdsknapp', async ({ page }) => {
    await page.keyboard.press('Tab'); // Skip-link
    await page.keyboard.press('Tab'); // ...till nav
    // ...etc — bevisar att tab-ordningen är logisk
  });
});
```

### CI-integration

```yaml
# .github/workflows/test.yml — utdrag
- name: Playwright a11y tests
  run: npx playwright test --project=a11y
  # failar bygget om någon test kastar (= a11y violation hittad)
```

### Output i `tasks/todo.md`

Varje a11y-violation som inte fixas direkt → todo-post med:

- Vy + komponent
- axe-rule-ID (t.ex. `color-contrast`)
- Impact-nivå
- Hur den ska fixas
- Datum upptäckt

---

## §6 — React Aria-mönsterbibliotek (Fas 3.5-leverabel)

> **Status:** Detta är en av Fas 3.5:s tre leveranser. Inte aktiverad i produktion förrän Fas 3.5 implementerats. P2-trigger-rapporten markerade behovet som JA.

Fem mönster täcker admin-appens interaktiva komponenter. Varje mönster har: kodexempel + a11y-acceptance-criteria + test-mall.

### §6.1 — Overlay (Dialog/Modal)

**Användning:** Confirm-dialoger, edit-modaler, slide-in-paneler.

**React Aria-bygg:**

```tsx
import { Modal, Dialog, Heading, Button } from 'react-aria-components';

function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  return (
    <Modal isOpen={isOpen} onOpenChange={(o) => !o && onClose()} isDismissable>
      <Dialog>
        <Heading slot="title">{title}</Heading>
        <p>{message}</p>
        <div className="actions">
          <Button onPress={onClose}>Avbryt</Button>
          <Button onPress={onConfirm} variant="cta">Bekräfta</Button>
        </div>
      </Dialog>
    </Modal>
  );
}
```

**A11y-acceptance:**

- [ ] Fokus flyttas till modalen vid open
- [ ] Fokus är trap:ad inom modalen (Tab cyklar)
- [ ] Escape stänger modalen
- [ ] Klick utanför stänger modalen (om `isDismissable`)
- [ ] Fokus återgår till trigger vid close
- [ ] Bakgrund inert (övriga element ej tab-bara)
- [ ] `<Heading slot="title">` blir `aria-labelledby`-källa automatiskt

**Test-mall:**

```typescript
test('ConfirmDialog — fokus, Escape, fokus-retur', async ({ page, checkA11y }) => {
  const trigger = page.getByRole('button', { name: 'Avboka anmälan' });
  await trigger.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-labelledby');

  // Fokus är inom dialogen
  await expect(page.locator(':focus')).toBeAttached();
  // ...

  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();

  await checkA11y();
});
```

### §6.2 — Listbox (dropdown med val)

**Användning:** Status-filter, sorteringsval, kategori-val.

**React Aria-bygg:**

```tsx
import { Select, SelectValue, Popover, ListBox, ListBoxItem, Label, Button } from 'react-aria-components';

function StatusFilter({ value, onChange }) {
  return (
    <Select selectedKey={value} onSelectionChange={onChange}>
      <Label>Status</Label>
      <Button>
        <SelectValue />
      </Button>
      <Popover>
        <ListBox>
          <ListBoxItem id="all">Alla</ListBoxItem>
          <ListBoxItem id="upcoming">Kommande</ListBoxItem>
          <ListBoxItem id="past">Tidigare</ListBoxItem>
        </ListBox>
      </Popover>
    </Select>
  );
}
```

**A11y-acceptance:**

- [ ] Roll: `combobox` på trigger-button
- [ ] `aria-expanded` togglas vid open/close
- [ ] `aria-controls` pekar på listbox
- [ ] Pil-ner öppnar listbox + flyttar fokus till första option
- [ ] ArrowUp/Down navigerar options
- [ ] Enter/Space väljer
- [ ] Escape stänger utan val
- [ ] Type-ahead: bokstäver hoppar till matchande option
- [ ] Vald option har `aria-selected="true"`

**Test-mall:**

```typescript
test('StatusFilter — type-ahead och selection annonseras', async ({ page, checkA11y }) => {
  const trigger = page.getByRole('button', { name: /status/i });
  await trigger.click();

  const listbox = page.getByRole('listbox');
  await expect(listbox).toBeVisible();

  await page.keyboard.press('K'); // type-ahead → Kommande
  await expect(page.getByRole('option', { name: 'Kommande' })).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(trigger).toHaveText(/kommande/i);

  await checkA11y();
});
```

### §6.3 — Disclosure (expand/collapse)

**Användning:** Accordion-sektioner i menyn, expanderbara rader, "läs mer"-block.

**React Aria-bygg:**

```tsx
import { Disclosure, DisclosureGroup, DisclosurePanel, Heading, Button } from 'react-aria-components';

function MenuSection({ id, title, children }) {
  return (
    <Disclosure id={id}>
      <Heading>
        <Button slot="trigger">{title}</Button>
      </Heading>
      <DisclosurePanel>{children}</DisclosurePanel>
    </Disclosure>
  );
}
```

**A11y-acceptance:**

- [ ] Trigger har `aria-expanded` synkad med open/closed-state
- [ ] Trigger har `aria-controls` pekande på panel
- [ ] Enter/Space togglar
- [ ] Pannel är `hidden` när stängd (inte bara `display: none` — även för screen reader)
- [ ] `<Heading>` runt trigger ger korrekt rubrikstruktur

**Test-mall:**

```typescript
test('Disclosure — keyboard toggle + aria-expanded sync', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Anmälningar' });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');

  // Pannelen är åtkomlig
  await expect(page.getByRole('region', { name: /anmälningar/i })).toBeVisible();
});
```

### §6.4 — MenuTrigger (kontext- och åtgärdsmeny)

**Användning:** Radåtgärder i tabell, kontextmeny på person-kort, header-meny.

**React Aria-bygg:**

```tsx
import { MenuTrigger, Menu, MenuItem, Button, Popover } from 'react-aria-components';

function RegistrationActions({ registration, onAction }) {
  return (
    <MenuTrigger>
      <Button aria-label={`Åtgärder för ${registration.personName}`}>⋯</Button>
      <Popover>
        <Menu onAction={(key) => onAction(key, registration)}>
          <MenuItem id="mark-paid">Markera som betald</MenuItem>
          <MenuItem id="send-reminder">Skicka påminnelse</MenuItem>
          <MenuItem id="cancel">Avboka</MenuItem>
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}
```

**A11y-acceptance:**

- [ ] Trigger har `aria-haspopup="menu"` + `aria-expanded`
- [ ] Trigger har descriptive `aria-label` (inte bara "⋯")
- [ ] Pil-ner / Space / Enter öppnar menyn
- [ ] ArrowUp/Down navigerar items
- [ ] Escape stänger
- [ ] Klick utanför stänger
- [ ] Type-ahead fungerar
- [ ] Disabled items har `aria-disabled="true"` + skip:as i tab-ordning

### §6.5 — ComboBox (sökfält med autocomplete)

**Användning:** Personsök, event-sök, lägg-till-tagg-fält.

**React Aria-bygg:**

```tsx
import { ComboBox, Label, Input, Button, Popover, ListBox, ListBoxItem } from 'react-aria-components';
import { useFilter } from 'react-aria';

function PersonSearch({ persons, onSelect }) {
  const { contains } = useFilter({ sensitivity: 'base' });

  return (
    <ComboBox
      defaultItems={persons}
      onSelectionChange={onSelect}
    >
      <Label>Sök person</Label>
      <div className="combobox-shell">
        <Input placeholder="Skriv namn..." />
        <Button>▼</Button>
      </div>
      <Popover>
        <ListBox>
          {(person) => (
            <ListBoxItem id={person.id} textValue={person.name}>
              {person.name} <span className="muted">{person.email}</span>
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </ComboBox>
  );
}
```

**A11y-acceptance:**

- [ ] Input har `role="combobox"` + `aria-expanded` + `aria-controls`
- [ ] Listbox har `role="listbox"`
- [ ] Resultat-räkning annonseras via `aria-live` ("23 träffar")
- [ ] ArrowDown från input → fokus till första option
- [ ] Type-ahead filtrerar listan, debounced internt av React Aria
- [ ] Escape rensar input eller stänger listbox (beroende på state)
- [ ] Selection: Enter eller klick

---

## §7 — Implementation per fas

| Fas | Vad implementeras (a11y-perspektiv) |
|---|---|
| Fas 0 | Fokusregel global, `<html lang="sv">`, scroll-margin för sticky headers, CSS `prefers-reduced-motion` + `prefers-contrast: more`-grundregler |
| Fas 3 | UI-primitiver byggs med React Aria. Per komponent: `aria-errormessage` på fält, `aria-description` på Button/Dialog, target-size 24×24 minst, fokus-states, kontrast 4.5:1 |
| **Fas 3.5** | **A11y-baseline (egen fas per P2-utfall):** axe-core + Playwright a11y-runner + fixture-mönster (§5). React Aria-mönsterbibliotek per §6 fullt implementerat. "A11y-baseline godkänd"-gate innan Fas 6 startar. |
| Fas 5 | App-shell-leveranser: Skip-link, Route Announcer, landmarker (`<main>`, `<nav>`), rubrikhierarki h1 per route, session-timeout-varning (EAA E7), tab bar 44×44 px |
| Fas 6 | Per-vy: `aria-live` på dynamiska listor, `aria-description` på ListItem, debounced sök i ComboBox, status-annonsering vid mutation-rollback, optimistic-mutation a11y-feedback |
| Fas 7 | EAA-checklista (22 punkter, se `ARIA-UPGRADE.md §2`), VoiceOver-audit (7 steg × 7 vyer), kognitiva tillgänglighetskriterier, slut-audit |

---

## §8 — Underhåll av React Aria

| Aktivitet | Frekvens |
|---|---|
| Kolla React Aria changelog för nya releaser | Varannan vecka |
| Granska om release innehåller a11y-fixar eller nya patterns | Vid varje release |
| Uppdatera `react-aria-components` + relaterade paket | Vid relevanta releaser, alltid via PR med smoke-test |
| Dokumentera React Aria-version i package.json | Alltid |

<!-- vale Vale.Terms = NO -->
Changelog: <https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/CHANGELOG.md>
<!-- vale Vale.Terms = YES -->

---

## §9 — Prompt-tillägg för Claude Code

Kopiera och använd vid kodgenerering:

```text
VIKTIGT: Läs ACCESSIBILITY-CHECKLIST.md innan du genererar nya komponenter eller vyer.
Följ §6 (React Aria-mönsterbibliotek) för Overlay, Listbox, Disclosure, MenuTrigger
och ComboBox. Följ ARIA-UPGRADE.md för ARIA 1.3-attribut per komponent.

Stack:
- Headless UI: react-aria-components (inte Radix, inte Headless UI, inte FKUI)
- Styling: Tailwind v4 + DESIGN-SYSTEM-SPEC tokens
- Validation: Zod + React Aria Form
- Tabeller: TanStack Table + React Aria-keyboard

Krav på varje komponent:
- Fokusring synlig (--mm-focus-ring)
- Tangentbord fungerar fullständigt (Tab, Enter, Escape, ArrowKeys)
- aria-label, aria-description där relevant
- aria-errormessage + aria-invalid på formulärfält
- Touch target ≥ 24×24 px (44×44 på primärflöden)
- Loading: aria-busy. Empty: förklarande text. Error: retry-knapp.
- 0 critical/serious axe-violations
- Test-mall enligt §6 för aktuellt pattern
```

---

## §10 — Bevarat från Vue-versionen (oförändrade krav)

Följande krav är stack-agnostiska och bevarades exakt från 2026-04-01-versionen:

- `<html lang="sv">` i index.html
- Touch targets ≥ 24×24 px (WCAG 2.5.8)
- Färgkontrast 4.5:1 normal / 3:1 stor
- Kontrast aldrig ensam informationsbärare
- Fokusring synlig på alla interaktiva element
- Browser-zoom 200% utan funktionsförlust
- Textförstoring 200% utan layout-bryt
- 320 px bredd utan horisontell scroll
- `prefers-reduced-motion` respekterat
- Lighthouse Accessibility ≥ 95
- axe DevTools 0 critical / 0 serious

---

## Ändringslogg

| Datum | Förändring |
|---|---|
| 2026-04-01 | Initial Vue/FKUI-version |
| 2026-05-04 | **P2 omskrivning:** React Aria + WCAG 2.2 AA. Ny stack-karta (toppen), nya §1–§4 (innan/under/efter byggandet anpassade för React-stack), ny §5 test-infrastruktur (axe + Playwright + fixture-mönster), ny §6 React Aria-mönsterbibliotek (5 patterns med kodexempel + test-mall), uppdaterad §7 implementation per fas (Fas 3.5 markerad som egen fas per P2-utfall), uppdaterad §8 underhåll (React Aria istället för FKUI-fork), uppdaterad §9 prompt-tillägg, ny §10 bevarade krav. Korsreferens till ARIA-UPGRADE.md för ARIA 1.3-attribut + EAA-checklista. |

---

*Dokument: ACCESSIBILITY-CHECKLIST.md (P2-version)*
*Korsreferenser: ARIA-UPGRADE.md (ARIA 1.3 + EAA), DESIGN-SYSTEM-SPEC.md (tokens + Fem Kvaliteter §13), STATE-STRATEGY.md (loading/empty/error-state), KVALITETSDEFINITIONER-11-REACT.md (kvalitetsdimensioner), tasks/sessions/archive/2026-05/2026-05-04-stodspec-synk-p2.md (P2-leverans + A1-utfall)*
*Underlag: WCAG 2.2 AA, ARIA Authoring Practices Guide, React Aria docs, gap-analysis.md (Fas 3 + Del 2 punkt 7)*
*Nästa review: efter Fas 3.5 (a11y-baseline-gate)*
