import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/primitives';

export const Route = createFileRoute('/_authenticated/dev-fel')({
  // Dev-only feltrigger (ADR-044-guardmönstret, jfr /dev/primitives):
  // i produktion finns routen i bundlen men är onåbar — beforeLoad kastar
  // redirect före render. Ligger under _authenticated (till skillnad från
  // /dev/*) eftersom sektions-felet ska bevisas INUTI skalet (DoD 6:
  // fallback i Outlet-positionen, header + tab bar överlever).
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: '/hem' });
    }
  },
  staticData: { title: 'Feltrigger (dev)' },
  component: DevFelPage,
});

function DevFelPage() {
  const [skaKasta, setSkaKasta] = useState(false);
  if (skaKasta) {
    throw new Error('Medvetet sektions-fel — DEV-feltrigger (Session 16 K4, DoD 6-verifiering)');
  }
  return (
    <>
      <h1>Feltrigger (dev)</h1>
      <p className="mt-2 text-small text-text-secondary">
        Kastar ett renderingsfel i denna route så att sektions-fallbacken (SectionError via
        defaultErrorComponent) kan verifieras inuti skalet.
      </p>
      <Button intent="danger" size="md" className="mt-4" onPress={() => setSkaKasta(true)}>
        Kasta sektions-fel
      </Button>
    </>
  );
}
