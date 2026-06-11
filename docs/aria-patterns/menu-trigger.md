# MenuTrigger (kontext- och åtgärdsmeny)

Fas 3.5-mönsterbibliotek (ADR-020). Referens-implementation:
[`src/routes/dev/patterns.tsx`](../../src/routes/dev/patterns.tsx) §MenuTrigger.
Tolerans: axe 0 violations per
[ADR-045](../decisions/ADR-045-a11y-runner-arkitektur.md) beslut 2.

## Syfte och Fas 6-konsumtion

Kontextmeny och åtgärdsmeny (byggplan §4 Fas 3.5 rad 4): radåtgärder i
tabeller, kontextmeny på person-kort, header-meny. Fas 6 konsumerar
mönstret i anmälningslistans per-rad-åtgärder.

## Kodexempel

Speglar referens-implementationen (triggern är `Button`-primitiven —
react-aria-components-kontexten wirar den automatiskt):

```tsx
import { Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components';
import { Button } from '@/components/primitives';

<MenuTrigger>
  <Button intent="secondary" aria-label="Åtgärder för Anna Andersson">
    Åtgärder
  </Button>
  <Popover>
    <Menu onAction={(key) => hanteraAtgard(key)}>
      <MenuItem id="markera-betald">Markera som betald</MenuItem>
      <MenuItem id="skicka-paminnelse">Skicka påminnelse</MenuItem>
      <MenuItem id="avboka">Avboka</MenuItem>
    </Menu>
  </Popover>
</MenuTrigger>
```

## Test-mall

[`tests/a11y/patterns/MenuTrigger.spec.ts`](../../tests/a11y/patterns/MenuTrigger.spec.ts)
— vilande sektion skannas scopad; öppnad meny skannas helsides (popovern
portalas). Anpassningspunkter: `devPagePath`, include-selektorn,
trigger-`aria-label` (descriptive per checklist §6.4 — per rad/objekt,
inte bara en glyf), menyval-namnen.

## A11y-acceptance-criteria

- [ ] Trigger har `aria-haspopup="menu"` + `aria-expanded`
- [ ] Trigger har descriptive `aria-label` (objekt-specifik, inte bara "⋯")
- [ ] ArrowDown / Space / Enter öppnar menyn
- [ ] ArrowUp/ArrowDown navigerar items
- [ ] Escape stänger; klick utanför stänger
- [ ] Type-ahead fungerar
- [ ] Disabled items har `aria-disabled="true"` och skippas i navigering
- [ ] axe: 0 violations i både vilande och öppnat tillstånd (ADR-045)
