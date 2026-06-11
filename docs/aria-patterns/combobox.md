# ComboBox (sökfält med autocomplete)

Fas 3.5-mönsterbibliotek (ADR-020). Referens-implementation:
[`src/routes/dev/patterns.tsx`](../../src/routes/dev/patterns.tsx) §ComboBox.
Tolerans: axe 0 violations per
[ADR-045](../decisions/ADR-045-a11y-runner-arkitektur.md) beslut 2.

## Syfte och Fas 6-konsumtion

Sökfält med autocomplete (byggplan §4 Fas 3.5 rad 5): personsök, event-sök,
lägg-till-tagg-fält. Fas 6 konsumerar mönstret i anmälnings-flödets
personsök. Filtreringen är inbyggd i react-aria-components vid
`defaultItems`.

## Kodexempel

Speglar referens-implementationen (`Input` är react-aria-components-import —
fältet wiras av ComboBox-kontexten; toggle-knappen är `Button`-primitiven):

```tsx
import { ComboBox, Input, Label, ListBox, ListBoxItem, Popover } from 'react-aria-components';
import { Button } from '@/components/primitives';

<ComboBox defaultItems={personer} onSelectionChange={(key) => valjPerson(key)}>
  <Label>Sök person</Label>
  <div>
    <Input placeholder="Skriv namn" />
    <Button intent="ghost" aria-label="Visa förslag">Visa</Button>
  </div>
  <Popover>
    <ListBox>
      {(person) => (
        <ListBoxItem id={person.id} textValue={person.namn}>
          {person.namn}
        </ListBoxItem>
      )}
    </ListBox>
  </Popover>
</ComboBox>
```

## Test-mall

[`tests/a11y/patterns/ComboBox.spec.ts`](../../tests/a11y/patterns/ComboBox.spec.ts)
— vilande sektion skannas scopad; expanderat tillstånd skannas scopat mot
sektion + listbox, INTE helsides (avviker från Overlay/MenuTrigger-mallarna):
react-aria-components `ariaHideOutside` sätter `aria-hidden` på bakgrunden
utan inert för den icke-modala listbox-popovern, vilket ger en
axe-`aria-hidden-focus`-flagga på bakgrundens fokuserbara element.
Tillståndet är onåbart i praktiken — tab-ut stänger popovern och
`aria-hidden` lyfts. Anpassningspunkter: `devPagePath`, include-selektorerna,
fält-labeln, förslags-namnen, filtrerings-assertionen mot vyns datakälla.

## A11y-acceptance-criteria

- [ ] Fältet har `role="combobox"` + `aria-expanded` + `aria-controls`
- [ ] Förslagslistan har `role="listbox"`, valen `role="option"`
- [ ] Skrivning filtrerar listan (inbyggt vid `defaultItems`)
- [ ] ArrowDown från fältet flyttar fokus till första förslaget
- [ ] Escape stänger listboxen (eller rensar fältet, beroende på state)
- [ ] Selektion via Enter eller klick
- [ ] axe: 0 violations i vilande tillstånd och i expanderat tillstånd
      (scopat per scope-noten ovan; ADR-045)
