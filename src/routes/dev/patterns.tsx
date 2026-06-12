import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import {
  Input as AriaInput,
  ComboBox,
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  Heading,
  Label,
  ListBox,
  ListBoxItem,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
} from 'react-aria-components';
import { Button, Dialog, DialogTrigger, Modal } from '@/components/primitives';

const STATUSAR = [
  { id: 'anmald', namn: 'Anmäld' },
  { id: 'betald', namn: 'Betald' },
  { id: 'avbokad', namn: 'Avbokad' },
  { id: 'vantelista', namn: 'Väntelista' },
] as const;

const PERSONER = [
  { id: 'p1', namn: 'Anna Andersson' },
  { id: 'p2', namn: 'Bo Bergström' },
  { id: 'p3', namn: 'Cecilia Carlsson' },
  { id: 'p4', namn: 'David Dahl' },
] as const;

const POPOVER_KLASS = 'rounded border border-border bg-surface p-1 shadow-xl';
const OPTION_KLASS =
  'cursor-default rounded px-3 py-2 text-body data-[focused]:bg-bg-muted data-[selected]:bg-primary-tint';

export const Route = createFileRoute('/dev/patterns')({
  // Dev-only referens-yta (ADR-044-mönstret, jfr /dev/primitives): i
  // produktion finns routen i bundlen men är onåbar — beforeLoad kastar
  // redirect före render.
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: '/' });
    }
  },
  staticData: { title: 'Mönsterbibliotek — referens' },
  component: PatternsPage,
});

/**
 * Fas 3.5-mönsterbibliotekets referens-implementationer (ADR-020 + ADR-045).
 * Fem React Aria-mönster i minimal, ARIA-korrekt form — kodexemplen som
 * docs/aria-patterns/*.md speglar och som tests/a11y/patterns/ skannar.
 * Referenskvalitet, inte produktions-features (Fas 6 konsumerar mönstren).
 */
function PatternsPage() {
  const [senasteHandelse, setSenasteHandelse] = useState('—');
  return (
    <main className="p-8">
      <h1 className="text-2xl">Mönsterbibliotek — referens (endast dev-läge)</h1>
      <p className="mt-2 text-small text-text-secondary">
        Fem React Aria-mönster per byggplan §4 Fas 3.5 — Fas 6 konsumerar dessa.
      </p>
      <p aria-live="polite" className="mt-2 text-small">
        Senaste händelse: <span data-testid="senaste-handelse">{senasteHandelse}</span>
      </p>

      <section aria-labelledby="rubrik-overlay" className="mt-8 max-w-md">
        <h2 id="rubrik-overlay" className="text-xl">
          Overlay
        </h2>
        <div className="mt-4">
          <DialogTrigger>
            <Button intent="secondary">Öppna overlay-exemplet</Button>
            <Modal isDismissable>
              <Dialog
                title="Bekräfta åtgärden?"
                actions={({ close }) => (
                  <>
                    <Button intent="ghost" onPress={close}>
                      Avbryt
                    </Button>
                    <Button
                      intent="primary"
                      onPress={() => {
                        setSenasteHandelse('overlay: bekräftad');
                        close();
                      }}
                    >
                      Bekräfta
                    </Button>
                  </>
                )}
              >
                Overlay-mönstret: fokus-trap, Escape, fokus-retur och inert bakgrund bärs av Modal +
                Dialog.
              </Dialog>
            </Modal>
          </DialogTrigger>
        </div>
      </section>

      <section aria-labelledby="rubrik-listbox" className="mt-8 max-w-md">
        <h2 id="rubrik-listbox" className="text-xl">
          Listbox
        </h2>
        <ListBox
          aria-label="Välj status"
          selectionMode="single"
          className="mt-4 rounded border border-border p-1"
          onSelectionChange={(keys) =>
            setSenasteHandelse(`listbox: ${String([...keys].join(', ')) || 'tomt'}`)
          }
        >
          {STATUSAR.map((status) => (
            <ListBoxItem key={status.id} id={status.id} className={OPTION_KLASS}>
              {status.namn}
            </ListBoxItem>
          ))}
        </ListBox>
      </section>

      <section aria-labelledby="rubrik-disclosure" className="mt-8 max-w-md">
        <h2 id="rubrik-disclosure" className="text-xl">
          Disclosure
        </h2>
        <DisclosureGroup className="mt-4 flex flex-col gap-2">
          <Disclosure id="anmalningar" className="rounded border border-border p-2">
            <Heading>
              <Button slot="trigger" intent="ghost" size="sm">
                Anmälningar
              </Button>
            </Heading>
            <DisclosurePanel className="px-3 pb-2 text-body">
              Expanderbart innehåll om anmälningar — panelen är dold för skärmläsare när den är
              stängd.
            </DisclosurePanel>
          </Disclosure>
          <Disclosure id="betalningar" className="rounded border border-border p-2">
            <Heading>
              <Button slot="trigger" intent="ghost" size="sm">
                Betalningar
              </Button>
            </Heading>
            <DisclosurePanel className="px-3 pb-2 text-body">
              Expanderbart innehåll om betalningar.
            </DisclosurePanel>
          </Disclosure>
        </DisclosureGroup>
      </section>

      <section aria-labelledby="rubrik-menutrigger" className="mt-8 max-w-md">
        <h2 id="rubrik-menutrigger" className="text-xl">
          MenuTrigger
        </h2>
        <div className="mt-4">
          <MenuTrigger>
            <Button intent="secondary" aria-label="Åtgärder för Anna Andersson">
              Åtgärder
            </Button>
            <Popover className={POPOVER_KLASS}>
              <Menu
                onAction={(key) => setSenasteHandelse(`meny: ${String(key)}`)}
                className="outline-none"
              >
                <MenuItem id="markera-betald" className={OPTION_KLASS}>
                  Markera som betald
                </MenuItem>
                <MenuItem id="skicka-paminnelse" className={OPTION_KLASS}>
                  Skicka påminnelse
                </MenuItem>
                <MenuItem id="avboka" className={OPTION_KLASS}>
                  Avboka
                </MenuItem>
              </Menu>
            </Popover>
          </MenuTrigger>
        </div>
      </section>

      <section aria-labelledby="rubrik-combobox" className="mt-8 max-w-md">
        <h2 id="rubrik-combobox" className="text-xl">
          ComboBox
        </h2>
        <ComboBox
          defaultItems={PERSONER}
          onSelectionChange={(key) => setSenasteHandelse(`combobox: ${String(key)}`)}
          className="mt-4 flex flex-col gap-1"
        >
          <Label className="text-small">Sök person</Label>
          <div className="flex gap-1">
            <AriaInput
              placeholder="Skriv namn"
              className="min-h-10 rounded border border-(--mm-border-field) bg-surface px-3 text-body"
            />
            <Button intent="ghost" aria-label="Visa förslag">
              Visa
            </Button>
          </div>
          <Popover className={POPOVER_KLASS}>
            <ListBox>
              {(person: (typeof PERSONER)[number]) => (
                <ListBoxItem id={person.id} textValue={person.namn} className={OPTION_KLASS}>
                  {person.namn}
                </ListBoxItem>
              )}
            </ListBox>
          </Popover>
        </ComboBox>
      </section>
    </main>
  );
}
