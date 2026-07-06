import { useNavigate } from '@tanstack/react-router';
import { PrototypeSwitcher } from '@/components/prototype/PrototypeSwitcher';
import { K1 } from './K1';
import { K2 } from './K2';
import { K3 } from './K3';
import { K4 } from './K4';
import { K5 } from './K5';

/**
 * [PROTOTYPE — kastbar kod, throwaway-kontraktet gäller (T65, S55 Del 1)]
 *
 * FRÅGA (nedskriven per kontraktets klausul i):
 *   "Hur ska Hem-vyn se ut för att Marcus är HELT nöjd med designen?"
 *
 * KONVERGENS-passet (tvåfas-arbetsformens fas 2, T66; T65 = första
 * instansen): startar som EXAKT kopia (K1) av den FAKTISKA Hem-vyn
 * (task-1.3/1.4-leveransen) — inte av divergens-vinnaren `bf705f2`, eftersom
 * skarp vy och byggkrav divergerat sedan valet. Iterationssteg adderas som
 * K2, K3 … så steg kan jämföras via växlaren; iteration med Marcus i
 * webbläsaren är POÄNGEN här, till skillnad från valfasen (L237).
 *
 * Befintlig datahämtning behålls (useDashboardData → router-context-DI,
 * ADR-055) — read-only, inga mutationer. DEV-grindad via routens montering
 * (ADR-044-mekaniken på komponentnivå) — onåbar i produktion.
 *
 * Svaret — inte koden — är produkten: slutläget svar-fångas (skärmdump per
 * iterationssteg + beslutstext i sessionsdok S55) och kort föds ur T65; det
 * skarpa bygget sker NYSKRIVET genom leverans-grindarna. Därefter RADERAS
 * denna katalog + växlaren (klausul iv — UI-prototypkod absorberas aldrig).
 * En prototyp som överlever sessionsgränsen är ett ADR-053-triage-fall
 * (klausul v).
 */

export type HemKonvergensVariant = 'k1' | 'k2' | 'k3' | 'k4' | 'k5';

export const HEM_KONVERGENS_VARIANTS: readonly HemKonvergensVariant[] = [
  'k1',
  'k2',
  'k3',
  'k4',
  'k5',
];

const LABELS: Record<HemKonvergensVariant, string> = {
  k1: 'K1 — Exakt kopia (baslinje)',
  k2: 'K2 — Designdumpen applicerad',
  k3: 'K3 — K2-feedbacken åtgärdad',
  k4: 'K4 — K3-feedbacken åtgärdad',
  k5: 'K5 — K4-feedbacken åtgärdad (FK-linjen)',
};

export function HemKonvergens({ variant }: { variant: HemKonvergensVariant }) {
  const navigate = useNavigate();
  const byt = (v: string) => {
    void navigate({
      to: '/hem',
      search: { variant: v as HemKonvergensVariant },
      replace: true,
    });
  };

  return (
    <>
      {variant === 'k1' && <K1 />}
      {variant === 'k2' && <K2 />}
      {variant === 'k3' && <K3 />}
      {variant === 'k4' && <K4 />}
      {variant === 'k5' && <K5 />}
      <PrototypeSwitcher
        variants={HEM_KONVERGENS_VARIANTS}
        current={variant}
        label={LABELS[variant]}
        onChange={byt}
      />
    </>
  );
}
