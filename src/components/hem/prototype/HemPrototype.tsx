import { useNavigate } from '@tanstack/react-router';
import { PrototypeSwitcher } from '@/components/prototype/PrototypeSwitcher';
import { VariantA } from './VariantA';
import { VariantB } from './VariantB';
import { VariantC } from './VariantC';

/**
 * [PROTOTYPE — kastbar kod, throwaway-kontraktet gäller (S52 Del 3)]
 *
 * FRÅGA (nedskriven per kontraktets klausul i):
 *   "Hur arrangeras Hem-innehållet inom FK-linjen?"
 *
 * Tre STRUKTURELLT olika arrangemang av Hem-innehållet på BEFINTLIGA routen
 * /hem (underform A), växlingsbara via `?variant=a|b|c` + flytande växlare.
 * Målbild: FK-appens strukturspråk i ljus Miranon-identitet — referensbilder i
 * docs/reference/fk-referens/ (S52 Del 3, grillad samsyn). Fasta beslut som
 * ALLA varianter bär: "Hej + namn" (platshållare — namnkällan är skiva 1),
 * vertikal stapling med FK-mixen (helbredd + max 2-i-rad), tokens-golvet.
 *
 * Befintlig datahämtning behålls (useDashboardData → router-context-DI,
 * ADR-055) — bara renderingen varierar. DEV-grindad via routens montering
 * (ADR-044-mekaniken på komponentnivå) — onåbar i produktion.
 *
 * Svaret — inte koden — är produkten: vinnande arrangemang fångas i
 * PRD-kortets Implementationsbeslut; därefter RADERAS denna katalog +
 * växlaren (UI-prototypkod absorberas aldrig; vinnaren skrivs OM genom
 * leverans-grindarna). En prototyp som överlever sessionsgränsen är ett
 * ADR-053-triage-fall (klausul v).
 */

export type HemPrototypeVariant = 'a' | 'b' | 'c';

export const HEM_PROTOTYPE_VARIANTS: readonly HemPrototypeVariant[] = ['a', 'b', 'c'];

const LABELS: Record<HemPrototypeVariant, string> = {
  a: 'A — FK-hemmet',
  b: 'B — Siffror först',
  c: 'C — Agenda först',
};

/** [PROTOTYPE] Platshållare — namnkällan (Supabase user-metadata) är skiva 1 på kortet. */
const NAMN = 'Marcus';

export function HemPrototype({ variant }: { variant: HemPrototypeVariant }) {
  const navigate = useNavigate();
  const byt = (v: string) => {
    void navigate({
      to: '/hem',
      search: { variant: v as HemPrototypeVariant },
      replace: true,
    });
  };

  return (
    <>
      {variant === 'a' && <VariantA namn={NAMN} />}
      {variant === 'b' && <VariantB namn={NAMN} />}
      {variant === 'c' && <VariantC namn={NAMN} />}
      <PrototypeSwitcher
        variants={HEM_PROTOTYPE_VARIANTS}
        current={variant}
        label={LABELS[variant]}
        onChange={byt}
      />
    </>
  );
}
