import { useRouter } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

/**
 * Route announcer (ACCESSIBILITY-CHECKLIST § Screen reader-kontroller) —
 * visuellt dold `aria-live="polite"`-region som annonserar sidtiteln vid
 * klient-navigationer, så att route-byten inte är tysta för skärmläsare.
 *
 * - Titel hämtas från djupaste matchade route med `staticData.title`
 *   (title-konventionen, se augmentationen i src/router.ts).
 * - Initial sidladdning annonseras INTE (skärmläsaren läser redan
 *   dokumentet då) — `lastHref`-vakten släpper bara igenom byten.
 * - `document.title` uppdateras i samma steg så fönstertitel och
 *   annonsering aldrig divergerar.
 * - Landmark-fri och global: bor i __root och gäller alla grenar
 *   (Session 16 K3 STOPPA-utfall A, beslut 2).
 */
export function RouteAnnouncer() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const lastHref = useRef(router.state.location.href);

  useEffect(() => {
    return router.subscribe('onResolved', () => {
      const { href } = router.state.location;
      if (href === lastHref.current) {
        return;
      }
      lastHref.current = href;
      const title = [...router.state.matches].reverse().find((m) => m.staticData.title)
        ?.staticData.title;
      if (title) {
        setMessage(title);
        document.title = `${title} — Miranon Media Admin`;
      }
    });
  }, [router]);

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}
