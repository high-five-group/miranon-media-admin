import { Link } from '@tanstack/react-router';

/**
 * Hem-CTA — A-skelettets stora helbredds-knapp sist i stapeln (task-1.3;
 * FK:s "Ansök om vab"-mönster): full bredd, generös hörnradie, chevron som
 * riktnings-antydan (aria-hidden → länknamnet är ren text). Pekar på den
 * samlade anmälningslistan (task-1.4, TASK-1 beslut 7): knappen förlänger
 * listan den står under (Nya anmälningar); eventlistan nås via tabbaren.
 *
 * En `<Link>` (navigation, inte en `onPress`-handling) stilad via
 * CTA-tokens ur semantik-lagret (DESIGN-SYSTEM §1, inga hårdkodade färger).
 * Semantiskt korrekt som länk; fokusring ärvs från den globala
 * `*:focus-visible`-regeln (`--mm-focus-ring`); `transition-colors`
 * neutraliseras globalt under `prefers-reduced-motion` (base.css).
 */
export function CTA() {
  return (
    <Link
      to="/mer/anmalningar"
      className="text-(color:--mm-btn-cta-text) flex min-h-14 items-center justify-between rounded-2xl bg-(--mm-btn-cta-bg) px-6 py-4 font-semibold text-lg transition-colors hover:bg-(--mm-btn-cta-hover)"
    >
      Visa alla anmälningar
      <span aria-hidden="true">›</span>
    </Link>
  );
}
