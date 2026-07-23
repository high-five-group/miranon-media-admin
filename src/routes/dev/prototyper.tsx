import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQueryState } from 'nuqs';
import { PrototypeSwitcher, type PrototypeVariant } from '@/components/dev/PrototypeSwitcher';

export const Route = createFileRoute('/dev/prototyper')({
  // Dev-only referens-yta (ADR-044-mönstret, jfr /dev/primitives + /dev/patterns):
  // i produktion finns routen i bundlen men är onåbar — beforeLoad kastar
  // redirect före render.
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: '/' });
    }
  },
  staticData: { title: 'Prototyp-växlaren — referens' },
  component: PrototyperPage,
});

/**
 * PROTOTYP-VÄXLARENS HEMVIST (task-18.13, Marcus-beslut B 2026-07-23).
 *
 * Bakgrund: ADR-074 beslut 4 gör `PrototypeSwitcher` till en STÅENDE delad
 * dev-komponent — den revs alltså INTE med event-familjens prototyp-substrat.
 * Men efter rivningen hade den noll konsumenter, och dess enda verifiering
 * red på just de `?variant=`-grenar som revs (TASK-29 byggde om den genom sex
 * granskningsvågor utan egen testfil). A/B-frågan på kortet var: låta den stå
 * oanvänd (A) eller ge den ett hem nu (B). Marcus valde B — ett verktyg som
 * är beslutat permanent ska vara levande och testbart mellan prototyp-passen,
 * inte ett arkiv-fynd som nästa pass får återupptäcka.
 *
 * Ytan är medvetet minimal: två attrapp-varianter + ett ensam-variant-fall,
 * eftersom växlaren byter FORM vid den gränsen (en variant → prototyp-ikon,
 * flera → bokstavsknappar). Attrapperna bär inga vyer — själva växlaren ÄR
 * studieobjektet; URL-kontraktet (`?variant=` + `?data=`) syns i utskriften
 * så att en regression i persistens eller alias-inmappning är läsbar direkt.
 */
const DEMO_VARIANTS: PrototypeVariant[] = [
  { key: 'A', label: 'Variant A', steg: 1, stegLabel: 'Steg 1 — divergens' },
  { key: 'B', label: 'Variant B', steg: 3, stegLabel: 'Steg 3 — konvergens låst' },
];

const ENDA_VARIANTEN: PrototypeVariant[] = [
  { key: 'K', label: 'Konvergensen', steg: 2, stegLabel: 'Steg 2 — enda varianten' },
];

function PrototyperPage() {
  const [variant] = useQueryState('variant');
  const [data] = useQueryState('data');
  const [form, setForm] = useQueryState('form');
  const enda = form === 'enda';

  return (
    <section className="flex flex-col gap-6 p-4">
      <h1 className="font-semibold text-3xl">Prototyp-växlaren</h1>
      <p className="max-w-prose text-body text-text-secondary">
        Stående dev-verktyg (ADR-074). Railen monteras nedan — dra i greppet, stega mellan
        varianterna och växla datakälla; URL-kontraktet speglas i rutan under.
      </p>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setForm(enda ? null : 'enda')}
          className="self-start rounded-full bg-bg-muted px-4 py-2 font-medium text-small hover:bg-bg-emphasized"
        >
          {enda ? 'Visa två varianter' : 'Visa ensam-variant-formen'}
        </button>
        <p className="text-caption text-text-muted">
          Formskiftet är avsiktligt: EN variant ger prototyp-ikon, FLERA ger bokstavsknappar.
        </p>
      </div>

      <dl
        data-testid="vaxlar-url-kontrakt"
        className="grid max-w-md grid-cols-2 gap-x-4 gap-y-1 rounded-xl bg-bg-muted p-4 text-small"
      >
        <dt className="text-text-secondary">?variant=</dt>
        <dd className="tabular-nums">{variant ?? '(skarpa vyn)'}</dd>
        <dt className="text-text-secondary">?data=</dt>
        <dd className="tabular-nums">{data ?? '(demo)'}</dd>
      </dl>

      <PrototypeSwitcher variants={enda ? ENDA_VARIANTEN : DEMO_VARIANTS} />
    </section>
  );
}
