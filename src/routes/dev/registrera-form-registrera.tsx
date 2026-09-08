import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import type { Betalsatt } from '@/components/betalningar/betalsatt-minne';
import { harledRad } from '@/components/betalningar/inkorg-harledningar';
import { RegistreraForm, type RegistreringsUtfall } from '@/components/betalningar/RegistreraForm';
import { Button } from '@/components/primitives';
import type { OppenBetalning } from '@/domain/schemas';

/**
 * [TASK-435] DEV-KONSUMENT för `RegistreraForm`s DEFAULT-läge (`registrera`,
 * `lage` utelämnad) — samma ADR-044-mönster som `/dev/registrera-form-
 * redigera` (TASK-402.2), men för läget DEN filen uttryckligen INTE täcker:
 * det skarpa serveranropet (`useRegistreraInbetalning` →
 * `registrera-inbetalning`).
 *
 * VARFÖR DEN BEHÖVS: formulärets ENDA produktionskonsumenter
 * (`BetalningsInkorg.tsx`, `AnmalansBetalningar.tsx`, `PersonBetalningar.tsx`)
 * är ALLA bakom `betalningarPa()` (miljöflaggan `VITE_FEATURE_BETALNINGAR`),
 * och `playwright.config.ts` hårdkodar den flaggan `'av'` för acceptance-
 * klassens fixturvärld (TASK-346.4 — WebSocket-vaktens skäl, se den radens
 * egen kommentar). Ingen produktionsroute för formulärets `registrera`-läge
 * går alltså att nå hermetiskt i dag. En `/dev/*`-route gates bara på
 * `import.meta.env.DEV`, inte på miljöflaggan, och är därmed den enda vägen
 * att bevisa formulärets NÄTVERKSKONTRAKT (vilken kropp som faktiskt lämnar
 * klienten) utan att flippa en global fixtur-rad som TASK-346.4 satte av ett
 * annat, fortfarande giltigt skäl. Samma precedent som `/dev/matyta-option-c`
 * (TASK-340.4), som en acceptance-fil redan konsumerar
 * (`tests/acceptance/dev-matyta-option-c.acceptance.test.ts`).
 *
 * Dev-only demo-yta: i produktion finns routen i bundlen men är onåbar —
 * `beforeLoad` kastar redirect före render.
 *
 * INGEN PRODUKTIONSKOD PÅVERKAS: `RegistreraForm.tsx`, `useRegistreraInbetalning`
 * och EF:en `registrera-inbetalning` är alla OFÖRÄNDRADE — denna route
 * monterar dem, inget mer.
 */

const FIXTUR: OppenBetalning = {
  anmalanRecordId: 'dev-fixtur-registrera-form-registrera',
  personNamn: 'Dev Testsson',
  personEpost: 'dev@example.test',
  personTelefon: '070-000 00 00',
  eventId: 'dev-event-registrera-form-registrera',
  eventNamn: 'Dev-eventet (demo)',
  eventStartdatum: '2099-12-01',
  eventTyp: 'Utbildning',
  anmalanStatus: 'Bekräftad (mail skickat)',
  saknas: 1500,
  gallandePris: 1500,
  anmalningsavgift: 500,
  summaInbetalt: 0,
  summaInbetaltSpegel: 0,
  spegelIFas: true,
  deadlineSlutbetalning: null,
  kvittonAttSkicka: 0,
  oskickadeKvitton: [],
};

const IDAG = '2026-09-08';

export const Route = createFileRoute('/dev/registrera-form-registrera')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: '/' });
    }
  },
  staticData: { title: 'RegistreraForm, registrera-läget (demo)' },
  component: RegistreraFormRegistreraDemo,
});

function RegistreraFormRegistreraDemo() {
  const [oppen, setOppen] = useState(true);
  const [betalsatt, setBetalsatt] = useState<Betalsatt>('Swish');
  const [senastKlar, setSenastKlar] = useState<RegistreringsUtfall | null>(null);
  const [avbrutetAntal, setAvbrutetAntal] = useState(0);
  const rad = harledRad(FIXTUR, IDAG);

  return (
    <section className="flex flex-col gap-4 p-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-3xl">RegistreraForm, registrera-läget (demo)</h1>
        <p className="text-small text-text-secondary">
          TASK-435: formulärets DEFAULT-läge, det som faktiskt anropar `useRegistreraInbetalning`
          mot en riktig (i denna sida: mockad) Edge Function. Se filens docblock för varför läget
          inte går att nå via en produktionsroute i acceptance-klassens fixturvärld.
        </p>
      </header>

      {!oppen && (
        <Button onPress={() => setOppen(true)} data-testid="oppna-formular">
          Öppna formuläret igen
        </Button>
      )}

      {oppen && (
        <RegistreraForm
          rad={rad}
          idag={IDAG}
          betalsatt={betalsatt}
          onBetalsatt={setBetalsatt}
          onKlar={(utfall) => {
            setSenastKlar(utfall);
            setOppen(false);
          }}
          onAvbryt={() => {
            setAvbrutetAntal((n) => n + 1);
            setOppen(false);
          }}
        />
      )}

      <dl className="flex flex-col gap-1 text-small">
        <div className="flex gap-2">
          <dt className="font-medium">Senast Klar:</dt>
          <dd data-testid="senast-klar">{senastKlar ? JSON.stringify(senastKlar) : 'inget än'}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium">Antal Avbryt:</dt>
          <dd data-testid="avbrutet-antal">{avbrutetAntal}</dd>
        </div>
      </dl>
    </section>
  );
}
