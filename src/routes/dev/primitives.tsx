import { createFileRoute, redirect } from '@tanstack/react-router';
import { ClipboardList, Hourglass, Star } from 'lucide-react';
import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTrigger,
  Input,
  MessageBox,
  Modal,
  NavCard,
  Select,
  SelectItem,
  Skeleton,
  TextArea,
} from '@/components/primitives';

const MESSAGE_INTENTS = ['info', 'success', 'warning', 'error'] as const;

const INTENTS = ['primary', 'secondary', 'danger', 'ghost'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

export const Route = createFileRoute('/dev/primitives')({
  // Dev-only demo-yta (ADR-044): i produktion finns routen i bundlen men
  // är onåbar — beforeLoad kastar redirect före render.
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: '/' });
    }
  },
  staticData: { title: 'Primitiver — demo' },
  component: PrimitivesPage,
});

function PrimitivesPage() {
  // Press-status gör onPress-pipelinen observerbar vid manuell verifiering
  // (mus, Enter, Space) — aria-live annonserar även till skärmläsare.
  const [senastTryckt, setSenastTryckt] = useState('—');
  return (
    <main className="p-8">
      <h1 className="text-2xl">Primitiver — demo (endast dev-läge)</h1>
      <p className="mt-2 text-small text-text-secondary">
        Visuell verifiering av alla size × intent-kombinationer per Fas 3 DoD 3.
      </p>
      <p aria-live="polite" className="mt-2 text-small">
        Senast tryckt: <span data-testid="senast-tryckt">{senastTryckt}</span>
      </p>
      {INTENTS.map((intent) => (
        <section key={intent} aria-labelledby={`rubrik-${intent}`} className="mt-8">
          <h2 id={`rubrik-${intent}`} className="text-xl">
            Button — {intent}
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {SIZES.map((size) => (
              <Button
                key={size}
                intent={intent}
                size={size}
                onPress={() => setSenastTryckt(`${intent} ${size}`)}
              >
                {intent} {size}
              </Button>
            ))}
            <Button
              intent={intent}
              isDisabled
              onPress={() => setSenastTryckt(`${intent} DISABLED`)}
            >
              Inaktiverad
            </Button>
          </div>
        </section>
      ))}
      <section aria-labelledby="rubrik-input" className="mt-8 max-w-md">
        <h2 id="rubrik-input" className="text-xl">
          Input
        </h2>
        <div className="mt-4 flex flex-col gap-4">
          {SIZES.map((size) => (
            <Input key={size} size={size} label={`Namn (${size})`} placeholder="Anna Andersson" />
          ))}
          <Input
            label="E-post"
            description="Används för bekräftelsemail"
            placeholder="anna@exempel.se"
          />
          <Input
            label="Namn (obligatorisk)"
            errorMessage="Namn får inte vara tomt"
            isInvalid
            isRequired
          />
          <Input label="Låst fält" isDisabled placeholder="Kan inte redigeras" />
        </div>
      </section>
      <section aria-labelledby="rubrik-textarea" className="mt-8 max-w-md">
        <h2 id="rubrik-textarea" className="text-xl">
          TextArea
        </h2>
        <div className="mt-4 flex flex-col gap-4">
          {SIZES.map((size) => (
            <TextArea key={size} size={size} label={`Meddelande (${size})`} placeholder="Skriv…" />
          ))}
          <TextArea
            label="Meddelande"
            description="Texten som skickas till mottagarna"
            placeholder="Hej!"
            rows={6}
          />
          <TextArea
            label="Meddelande (obligatorisk)"
            errorMessage="Meddelande får inte vara tomt"
            isInvalid
            isRequired
          />
          <TextArea label="Låst fält" isDisabled placeholder="Kan inte redigeras" />
        </div>
      </section>
      <section aria-labelledby="rubrik-select" className="mt-8 max-w-md">
        <h2 id="rubrik-select" className="text-xl">
          Select
        </h2>
        <div className="mt-4 flex flex-col gap-4">
          <Select
            label="Status"
            placeholder="Välj status"
            onSelectionChange={(key) => setSenastTryckt(`select: ${String(key)}`)}
          >
            <SelectItem id="anmald">Anmäld</SelectItem>
            <SelectItem id="betald">Betald</SelectItem>
            <SelectItem id="avbokad">Avbokad</SelectItem>
            <SelectItem id="vantelista">Väntelista</SelectItem>
          </Select>
          <Select
            label="Status (fel)"
            placeholder="Välj status"
            isInvalid
            errorMessage="Välj en status"
          >
            <SelectItem id="anmald">Anmäld</SelectItem>
            <SelectItem id="betald">Betald</SelectItem>
          </Select>
          <Select label="Status (låst)" placeholder="Kan inte väljas" isDisabled>
            <SelectItem id="anmald">Anmäld</SelectItem>
            <SelectItem id="betald">Betald</SelectItem>
          </Select>
        </div>
      </section>
      <section aria-labelledby="rubrik-messagebox" className="mt-8 max-w-md">
        <h2 id="rubrik-messagebox" className="text-xl">
          MessageBox
        </h2>
        <div className="mt-4 flex flex-col gap-4">
          {MESSAGE_INTENTS.map((intent) => (
            <MessageBox key={intent} intent={intent} title={`Rubrik (${intent})`}>
              Brödtext för {intent}-meddelandet — alltid i neutral textfärg.
            </MessageBox>
          ))}
          <MessageBox
            intent="info"
            title="Avvisningsbar"
            onDismiss={() => setSenastTryckt('messagebox: avvisad')}
          >
            Stäng-knappen wirar till statusraden ovan.
          </MessageBox>
        </div>
      </section>
      <section aria-labelledby="rubrik-dialog" className="mt-8 max-w-md">
        <h2 id="rubrik-dialog" className="text-xl">
          Modal + Dialog
        </h2>
        <div className="mt-4">
          <DialogTrigger>
            <Button intent="secondary">Öppna bekräftelse-dialog</Button>
            <Modal isDismissable>
              <Dialog
                title="Ta bort anmälan?"
                actions={({ close }) => (
                  <>
                    <Button intent="ghost" onPress={close}>
                      Avbryt
                    </Button>
                    <Button
                      intent="danger"
                      onPress={() => {
                        setSenastTryckt('dialog: bekräftad');
                        close();
                      }}
                    >
                      Ta bort
                    </Button>
                  </>
                )}
              >
                Åtgärden kan inte ångras. Anmälan tas bort permanent.
              </Dialog>
            </Modal>
          </DialogTrigger>
        </div>
      </section>
      <section aria-labelledby="rubrik-navcard" className="mt-8 max-w-md">
        <h2 id="rubrik-navcard" className="text-xl">
          NavCard
        </h2>
        {/* Anatomin ägs av konsumenten: nav > ul > li > NavCard
            (M6-facitet: 10 px radgap inom grupp = gap-2.5). */}
        <nav aria-label="NavCard-demo" className="mt-4">
          <ul className="flex flex-col gap-2.5">
            <li>
              <NavCard to="/mer/anmalningar" icon={ClipboardList} label="Anmälningar" />
            </li>
            <li>
              <NavCard to="/mer/vantelista" icon={Hourglass} label="Väntelista" />
            </li>
            <li>
              <NavCard to="/mer/intresserade" icon={Star} label="Intresserade" />
            </li>
          </ul>
        </nav>
      </section>
      <section aria-labelledby="rubrik-skeleton" className="mt-8 max-w-md">
        <h2 id="rubrik-skeleton" className="text-xl">
          Skeleton
        </h2>
        <p className="mt-2 text-small text-text-secondary">
          Lugnt laddläge (spec §15): statiskt demo-kort i permanent laddläge. Roselli-anatomin ägs
          av konsumenten — aria-busy på innehålls-containern + sr-only-besked; blocken är
          aria-hidden.
        </p>
        <div
          aria-busy="true"
          className="mt-4 flex flex-col gap-4 rounded-2xl border border-transparent bg-bg-muted p-4 contrast-more:border-border-strong print:border-border-strong"
        >
          <span className="sr-only">Laddar demo-innehållet…</span>
          {/* Textrader — 1lh i brödtext-kontext; avtrappade bredder antyder löptext. */}
          <div data-demo="skeleton-text" className="flex flex-col gap-2">
            <Skeleton variant="text" />
            <Skeleton variant="text" className="w-4/5" />
            <Skeleton variant="text" className="w-3/5" />
          </div>
          {/* Talet — ärver talets slutna typografi (Obetalda-kortets 3xl-form). */}
          <p data-demo="skeleton-number" className="font-semibold text-3xl">
            <Skeleton variant="number" />
          </p>
          {/* Listrader — dimensionsreserverad list-yta (anmälningslistans klass). */}
          <div data-demo="skeleton-list" className="flex flex-col gap-2">
            <Skeleton variant="listRow" />
            <Skeleton variant="listRow" />
          </div>
        </div>
      </section>
    </main>
  );
}
