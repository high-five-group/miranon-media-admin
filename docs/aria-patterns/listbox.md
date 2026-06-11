# Listbox

Fas 3.5-mönsterbibliotek (ADR-020). Referens-implementation:
[`src/routes/dev/patterns.tsx`](../../src/routes/dev/patterns.tsx) §Listbox.
Tolerans: axe 0 violations per
[ADR-045](../decisions/ADR-045-a11y-runner-arkitektur.md) beslut 2.

## Syfte och Fas 6-konsumtion

Dropdowns, filter och sorteringsval (byggplan §4 Fas 3.5 rad 2). Referensen
visar en alltid-renderad `ListBox` med single-selektion — rätt form för
synliga filterlistor. För dropdown-formen (trigger + popover) är
`Select`-primitiven (Fas 3) den färdiga konsumtionsvägen; bygg inte om den
per vy.

## Kodexempel

Speglar referens-implementationen:

```tsx
import { ListBox, ListBoxItem } from 'react-aria-components';

<ListBox
  aria-label="Välj status"
  selectionMode="single"
  onSelectionChange={(keys) => hanteraVal(keys)}
>
  <ListBoxItem id="anmald">Anmäld</ListBoxItem>
  <ListBoxItem id="betald">Betald</ListBoxItem>
  <ListBoxItem id="avbokad">Avbokad</ListBoxItem>
</ListBox>
```

## Test-mall

[`tests/a11y/patterns/Listbox.spec.ts`](../../tests/a11y/patterns/Listbox.spec.ts)
— båda skanningarna scopas mot sektionen (listboxen portalas inte);
selektions-assertionen bevisar `aria-selected`-synk. Anpassningspunkter:
`devPagePath`, include-selektorn, listbox-/option-namnen.

## A11y-acceptance-criteria

- [ ] `role="listbox"` med tillgängligt namn (`aria-label` eller `aria-labelledby`)
- [ ] Varje val har `role="option"`
- [ ] ArrowUp/ArrowDown navigerar options
- [ ] Enter/Space eller klick väljer
- [ ] Vald option har `aria-selected="true"`
- [ ] Selektion indikeras inte enbart med färg (jfr WCAG 1.4.1)
- [ ] axe: 0 violations i både vilande och selekterat tillstånd (ADR-045)
