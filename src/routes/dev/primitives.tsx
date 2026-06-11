import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { Button, Input, Select, SelectItem } from '@/components/primitives';

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
    </main>
  );
}
