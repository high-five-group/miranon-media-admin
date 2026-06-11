# Overlay (Modal + Dialog)

Fas 3.5-mönsterbibliotek (ADR-020). Referens-implementation:
[`src/routes/dev/patterns.tsx`](../../src/routes/dev/patterns.tsx) §Overlay.
Tolerans: axe 0 violations per
[ADR-045](../decisions/ADR-045-a11y-runner-arkitektur.md) beslut 2.

## Syfte och Fas 6-konsumtion

Modaler, confirm-dialoger och slide-in-paneler (byggplan §4 Fas 3.5 rad 1).
Fas 6 konsumerar mönstret i edit-modaler och avboknings-bekräftelser.
Bygger helt på `Modal`- och `Dialog`-primitiverna (Fas 3) — ingen direkt
react-aria-components-import behövs i konsumerande vyer.

## Kodexempel

Speglar referens-implementationen:

```tsx
import { Button, Dialog, DialogTrigger, Modal } from '@/components/primitives';

<DialogTrigger>
  <Button intent="secondary">Öppna overlay-exemplet</Button>
  <Modal isDismissable>
    <Dialog
      title="Bekräfta åtgärden?"
      actions={({ close }) => (
        <>
          <Button intent="ghost" onPress={close}>Avbryt</Button>
          <Button intent="primary" onPress={() => { bekrafta(); close(); }}>
            Bekräfta
          </Button>
        </>
      )}
    >
      Brödtext i dialogen.
    </Dialog>
  </Modal>
</DialogTrigger>
```

## Test-mall

[`tests/a11y/patterns/Overlay.spec.ts`](../../tests/a11y/patterns/Overlay.spec.ts)
— vilande sektion skannas scopad; öppnat tillstånd skannas helsides
(overlayen portalas utanför sektionen). Anpassningspunkter vid Fas
6-konsumtion: `devPagePath` → vyn, include-selektorn → vyns sektion,
trigger-namnet, ev. vy-specifika assertioner.

## A11y-acceptance-criteria

- [ ] Fokus flyttas till modalen vid open
- [ ] Fokus är trap:ad inom modalen (Tab cyklar)
- [ ] Escape stänger modalen
- [ ] Klick utanför stänger (om `isDismissable`)
- [ ] Fokus återgår till trigger vid close
- [ ] Bakgrund inert (övriga element ej tab-bara)
- [ ] `title`-propen blir `aria-labelledby`-källa automatiskt (Heading slot)
- [ ] axe: 0 violations i både vilande och öppnat tillstånd (ADR-045)
