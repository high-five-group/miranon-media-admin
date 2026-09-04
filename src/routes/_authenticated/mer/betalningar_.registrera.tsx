import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { BekraftelsestegPrototype } from '@/components/betalningar/prototype/BekraftelsestegPrototype';
import { betalningarPa } from '@/lib/funktionsflaggor';

/**
 * [PROTOTYPE] Bekräftelsesteget för inbetalningar — DIVERGENS-passet (S121
 * beslut 8; prototype-skillens UI-gren, ADR-103/ADR-074).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * FRÅGAN PROTOTYPEN BESVARAR (verbatim, prototype-skillens krav)
 * ═══════════════════════════════════════════════════════════════════════════
 * "Vilken form gör tio rader med bulkval överst, belopp och betalsätt per rad,
 * och utfall per rad efter registrering, läsbara och snabba för Lotta på iPad
 * 820 px och desktop, utan att bli en tabell?"
 *
 * Tre STRUKTURELLT olika varianter på EN route, växlingsbara via
 * `?variant=a|b|c` med husets `PrototypeSwitcher`:
 *   a  Radlistan       — täthet och tempo (inkorgens grammatik)
 *   b  Sammanställningen — kontroll och trygghet (överblick leder)
 *   c  Avvikelse-först  — minsta antal handlingar (appen förvalar)
 *
 * INGEN RIKTIG MUTATION: allt tillstånd lever i minnet, ingen post i
 * write-allowlisten, aldrig staging-/prod-writes (`bekraftelseSimulering.ts`).
 * Route-koden är additiv: ny route + nya filer under `betalningar/prototype/`.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * UN-NESTAD FRÅN INKORGEN
 * ═══════════════════════════════════════════════════════════════════════════
 * Filnamnet bär trailing underscore (`betalningar_.registrera`) så routen
 * ligger på `/mer/betalningar/registrera` men INTE nästlas under
 * `betalningar.tsx` (som renderar inkorgen utan `<Outlet/>`). Steget är en
 * egen fokuserad yta med full bredd (beslut 1), inte en panel i inkorgen.
 *
 * SAMMA MILJÖGRIND SOM INKORGEN (beslut 1: "miljöflaggan ärvs via
 * route-grenen"): `betalningarPa()` gatar routen; av i prod ⇒ redirect till
 * `/mer`, exakt som `betalningar.tsx`. Växlaren är dessutom villkorad med
 * `import.meta.env.DEV`.
 */
const searchSchema = z.object({
  variant: z.enum(['a', 'b', 'c']).default('a').catch('a'),
  data: z.enum(['fixtur', 'staging']).default('fixtur').catch('fixtur'),
  ids: z.string().optional().catch(undefined),
});

export const Route = createFileRoute('/_authenticated/mer/betalningar_/registrera')({
  staticData: { title: 'Registrera betalningar (prototyp)' },
  validateSearch: searchSchema,
  beforeLoad: () => {
    if (!betalningarPa()) throw redirect({ to: '/mer' });
  },
  component: RegistreraPrototypPage,
});

function RegistreraPrototypPage() {
  const { variant, data, ids } = Route.useSearch();
  return <BekraftelsestegPrototype variant={variant} data={data} ids={ids} />;
}
