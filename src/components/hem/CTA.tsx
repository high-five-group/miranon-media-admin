import { Link } from '@tanstack/react-router';

/**
 * Hem-CTA (Fas 6d L1) — primär åtgärd från översikten till eventlistan, där Lotta
 * gör merparten av sitt operativa arbete (öppna event → anmälda/närvaro/betalning).
 *
 * En `<Link>` (navigation, inte en `onPress`-handling) stilad som primär knapp via
 * komponent-tokens — speglar Button-primitivens `primary`-variant (DESIGN-SYSTEM §1,
 * inga hårdkodade färger). Semantiskt korrekt som länk; fokusring ärvs från den
 * globala `*:focus-visible`-regeln (`--mm-focus-ring`). Ingen ny mekanik.
 */
export function CTA() {
  return (
    <Link
      to="/event"
      className="text-(color:--mm-button-primary-text) inline-flex min-h-10 w-fit items-center gap-2 rounded bg-(--mm-button-primary-bg) px-4 font-medium transition-colors hover:bg-(--mm-button-primary-bg-hover)"
    >
      Visa alla event →
    </Link>
  );
}
