import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useQueryState } from 'nuqs';
import { VariantBento } from '@/components/dev/hem-prototyp/VariantBento';
import { VariantKontroll } from '@/components/dev/hem-prototyp/VariantKontroll';
import { VariantRo } from '@/components/dev/hem-prototyp/VariantRo';
import { PrototypeSwitcher, type PrototypeVariant } from '@/components/dev/PrototypeSwitcher';
import { useDashboardEvents, useDashboardRegistrations } from '@/components/hem/useDashboardData';

export const Route = createFileRoute('/dev/hem-prototyp')({
  // Dev-only prototyp-yta (ADR-044-mönstret, jfr /dev/prototyper +
  // /dev/auth-prototyp): i produktion finns routen i bundlen men är onåbar —
  // beforeLoad kastar redirect före render.
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: '/' });
    }
  },
  staticData: { title: 'Hem-vyns divergens - prototyp' },
  component: HemPrototypPage,
});

/**
 * TASK-226 DIVERGENSFASEN — hem-vyns tre estetiska riktningar (ADR-102/103,
 * grillad samsyn S102 Del 8, Marcus kvittens 2026-08-15). EN nedskriven
 * fråga: vilken riktning ska hem-vyns morgonkoll bära — ro (V1), kontroll
 * (V2) eller skönhet (V3)? Alla tre bär SAMMA kvitterade blockordning (fri
 * hälsning · Nästa event fullbredd · Nya anmälningar · Förfallna
 * betalningar · Genvägar · Senaste aktivitet) mot RIKTIG staging-data —
 * bara den visuella identiteten skiljer. Marcus väljer EN i browsern;
 * throwaway-kontraktet gäller (förlorarna rivs, vinnaren konvergeras separat
 * enligt `marcus-system:prototype`-skillens UI-gren).
 *
 * TVÅ AXLAR, BÅDA I RAILEN (samma S96-konvention som auth-prototyp): bara
 * VARIANT (`?variant=`) här — ingen VY-axel, hem-vyn har ingen familj av
 * skärmar att växla mellan.
 *
 * DATA HÄMTAS EN GÅNG HÄR, delas till alla tre varianter via props: samma
 * `queryKey` (hem/useDashboardData.ts) gör att React Query ändå bara skulle
 * dedupa till EN nätverksfetch om varje variant hämtade själv, men att
 * hämta i routen och skicka ner gör beroendet synligt i EN punkt i stället
 * för tre. `nuMs` läses EN gång per montering (inte per render) så
 * "förfallen" inte flippar mellan en switch och nästa.
 */
const VARIANTER: PrototypeVariant[] = [
  { key: '1', label: 'V1 Lugna morgonen (ro)', steg: 1, stegLabel: 'Steg 1 - divergens' },
  { key: '2', label: 'V2 Kommandocentralen (kontroll)', steg: 1, stegLabel: 'Steg 1 - divergens' },
  { key: '3', label: 'V3 Bento (skönhet)', steg: 1, stegLabel: 'Steg 1 - divergens' },
];

function IngenSkarpVy() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg-subtle p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-border-light bg-surface p-10 text-center shadow-sm">
        <p className="font-semibold text-lg text-text">Ingen skarp vy här</p>
        <p className="text-body text-text-secondary">
          Den här dev-routen bär bara divergens-prototypen. Den skarpa hem-vyn ligger på{' '}
          <Link to="/hem" className="underline underline-offset-2">
            /hem
          </Link>
          .
        </p>
        <p className="text-caption text-text-muted">Välj en variant i railen till höger →</p>
      </div>
    </div>
  );
}

function HemPrototypPage() {
  const [variant] = useQueryState('variant');
  const eventsQuery = useDashboardEvents();
  const registrationsQuery = useDashboardRegistrations();
  // Läst en gång per montering (inte inne i varje variant) — samma "nu" i
  // alla tre, annars kunde "förfallen betalning" flippa mellan en switch och
  // nästa utan att datan faktiskt ändrats.
  const nuMs = Date.now();

  const props = { eventsQuery, registrationsQuery, nuMs };

  return (
    <>
      {variant === '1' ? (
        <VariantRo {...props} />
      ) : variant === '2' ? (
        <VariantKontroll {...props} />
      ) : variant === '3' ? (
        <VariantBento {...props} />
      ) : (
        <IngenSkarpVy />
      )}

      <PrototypeSwitcher variants={VARIANTER} />
    </>
  );
}
