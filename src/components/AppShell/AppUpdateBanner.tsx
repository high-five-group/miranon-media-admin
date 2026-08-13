import { useSyncExternalStore } from 'react';
import { Button } from '@/components/primitives';
import { laesAppUppdatering, prenumereraPaAppUppdatering } from '@/lib/app-uppdatering';

/**
 * Diskret uppdaterings-banner (TASK-199-uppföljning, ADR-047 § Amendering
 * 2026-08-13).
 *
 * Visas när en nyare version av appen har aktiverats i bakgrunden. Beslutet
 * att ladda om ligger hos ANVÄNDAREN (Marcus beslut, S105) — en automatisk
 * omladdning kan slänga bort Lottas inmatning mitt i ett formulär. Mekanismen
 * som producerar signalen bor i `src/lib/app-uppdatering.ts`; denna komponent
 * vet ingenting om service workers.
 *
 * A11y-formen är ÄRVD FRÅN `OfflineIndicator` och förstapartsbelagd:
 *
 * - `role="status"` har implicit `aria-live="polite"` och `aria-atomic="true"`
 *   (MDN, ARIA: status role). `polite` betyder att skärmläsaren annonserar
 *   när användaren är ledig — meddelandet avbryter alltså aldrig Lotta mitt i
 *   en mening. Samma källa är uttrycklig om fokus: *"Do not give focus to the
 *   status when its content updates."* Vi flyttar därför aldrig fokus hit.
 *   `aria-live="polite"` skrivs ändå ut explicit, exakt som `OfflineIndicator`
 *   redan gör — implicit värde plus explicit attribut är samma värde, och den
 *   explicita formen överlever en framtida ändring av elementets roll.
 * - Live-regionen är ALLTID monterad och bara INNEHÅLLET växlar. MDN
 *   (ARIA live regions) är uttrycklig: *"Start with an empty live region,
 *   then – in a separate step – change the content inside the region."* En
 *   region som skapas samtidigt som sitt innehåll annonseras inte
 *   tillförlitligt. Detta är skälet till att komponenten inte returnerar
 *   `null` när det inte finns någon uppdatering.
 *
 * Övriga ribbekrav (`CLAUDE.md` § Design-system):
 * - Inga hårdkodade färger — `bg-info-bg`/`border-info` är Tailwind-alias för
 *   `--mm-info-bg`/`--mm-info` (`src/styles/tailwind.css`). Komponenten
 *   uppfinner medvetet noll egna tokens, precis som `InstallPrompt`: ett
 *   komponent-token som bara aliasar ett semantiskt är ren skuld.
 * - `prefers-reduced-motion` respekteras genom FRÅNVARO — bannern har inga
 *   animationer eller transitions att dämpa.
 * - `prefers-contrast: more` förstärker gränsen via `contrast-more:border-b-2`.
 * - `print:hidden` — en uppdaterings-uppmaning hör inte hemma på papper.
 * - Knappen är `Button`-primitiven (react-aria-components): tangentbordsnåbar
 *   som vilken knapp som helst, med den globala fokusringen ur `base.css`
 *   (`--mm-focus-ring`).
 */
export function AppUpdateBanner() {
  const uppdateringFinns = useSyncExternalStore(
    prenumereraPaAppUppdatering,
    laesAppUppdatering,
    // Server-snapshot: appen renderas aldrig på servern, men React kräver
    // argumentet för att `useSyncExternalStore` ska vara hydrerings-säker.
    () => false,
  );

  return (
    <div role="status" aria-live="polite" data-testid="app-update-banner">
      {uppdateringFinns && (
        <div className="flex flex-wrap items-center justify-center gap-3 border-info border-b bg-info-bg px-4 py-2 text-center text-small contrast-more:border-b-2 print:hidden">
          {/* Långt bindestreck är FÖRBJUDET i användarsynlig text
              (Marcus-beslut 2026-08-09, .langa-streck-policy.json; grinden
              scripts/check-langa-streck.mjs fäller JSXText). Kommat bär
              satsfogningen i stället. */}
          <p>
            Det finns en nyare version av appen. Ladda om när du är klar med det du håller på med,
            annars kan det du har skrivit försvinna.
          </p>
          <Button
            intent="primary"
            size="sm"
            onPress={() => {
              // Den nya service workern har REDAN tagit kontroll när denna
              // banner visas (vår `src/sw.ts` anropar `skipWaiting()` +
              // `clients.claim()`), så en vanlig omladdning hämtar den nya
              // koden. Pluginets `updateServiceWorker()` används medvetet
              // INTE: i autoUpdate-läge är den en no-op — mätt i
              // `node_modules/vite-plugin-pwa/dist/client/build/register.js`,
              // där kroppen är `if (!auto) sendSkipWaitingMessage?.()`.
              window.location.reload();
            }}
            data-testid="app-update-reload"
          >
            Ladda om
          </Button>
        </div>
      )}
    </div>
  );
}
