# Disclosure (expand/collapse)

Fas 3.5-mönsterbibliotek (ADR-020). Referens-implementation:
[`src/routes/dev/patterns.tsx`](../../src/routes/dev/patterns.tsx) §Disclosure.
Tolerans: axe 0 violations per
[ADR-045](../decisions/ADR-045-a11y-runner-arkitektur.md) beslut 2.

## Syfte och Fas 6-konsumtion

Accordion-sektioner i menyn, expanderbara rader och "läs mer"-block
(byggplan §4 Fas 3.5 rad 3). Fas 6 konsumerar mönstret i slide-in-menyns
kategorisektioner och expanderbara tabellrader.

## Kodexempel

Speglar referens-implementationen (trigger-knappen är `Button`-primitiven
med `slot="trigger"`):

```tsx
import { Disclosure, DisclosureGroup, DisclosurePanel, Heading } from 'react-aria-components';
import { Button } from '@/components/primitives';

<DisclosureGroup>
  <Disclosure id="anmalningar">
    <Heading>
      <Button slot="trigger" intent="ghost" size="sm">Anmälningar</Button>
    </Heading>
    <DisclosurePanel>Expanderbart innehåll.</DisclosurePanel>
  </Disclosure>
</DisclosureGroup>
```

## Test-mall

[`tests/a11y/patterns/Disclosure.spec.ts`](../../tests/a11y/patterns/Disclosure.spec.ts)
— kollapsat + expanderat tillstånd, båda scopade mot sektionen (panelen
portalas inte); `aria-expanded`-assertionerna bevisar state-synk.
Anpassningspunkter: `devPagePath`, include-selektorn, trigger-namnen.

## A11y-acceptance-criteria

- [ ] Trigger har `aria-expanded` synkad med open/closed-state
- [ ] Trigger har `aria-controls` pekande på panelen
- [ ] Enter/Space togglar
- [ ] Panelen är dold även för skärmläsare när den är stängd
- [ ] `Heading` runt triggern ger korrekt rubrikstruktur (h3 under sektionens h2)
- [ ] axe: 0 violations i både kollapsat och expanderat tillstånd (ADR-045)
