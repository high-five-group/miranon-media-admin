import { createFileRoute } from '@tanstack/react-router';
import { Hem } from '@/components/hem';
import {
  HEM_PROTOTYPE_VARIANTS,
  HemPrototype,
  type HemPrototypeVariant,
} from '@/components/hem/prototype/HemPrototype';

// [PROTOTYPE] ?variant= bär Hem-arrangemangs-prototypen (S52 Del 3, underform A).
// Utan parametern (eller i produktion) renderas Hem exakt som före prototypen —
// befintliga e2e-baselines är opåverkade. Söktypen + grenen tas bort med prototypen.
type HemSearch = { variant?: HemPrototypeVariant };

export const Route = createFileRoute('/_authenticated/hem')({
  staticData: { title: 'Hem' },
  validateSearch: (search: Record<string, unknown>): HemSearch => {
    const v = search.variant;
    return typeof v === 'string' && (HEM_PROTOTYPE_VARIANTS as readonly string[]).includes(v)
      ? { variant: v as HemPrototypeVariant }
      : {};
  },
  component: HemPage,
});

// Hem-aggregering (Fas 6d L1): /hem. Översiktsvy via befintliga read-EF
// (get-registrations event-lösa gren + get-events), STATISK hämtning — poll-lagret
// (ADR-017) är L2. Logiken bor i Hem-komponenten; routen håller bara montering.
// <Outlet/> bärs av _authenticated via AppShell.
function HemPage() {
  const { variant } = Route.useSearch();
  // [PROTOTYPE] DEV-grind (ADR-044-mekaniken på komponentnivå): i produktion är
  // grenen död kod och tree-shakas bort tillsammans med prototyp-komponenterna.
  if (import.meta.env.DEV && variant) {
    return <HemPrototype variant={variant} />;
  }
  return <Hem />;
}
