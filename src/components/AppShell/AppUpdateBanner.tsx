import { useSearch } from '@tanstack/react-router';
import { useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/primitives';
import { laesAppUppdatering, prenumereraPaAppUppdatering } from '@/lib/app-uppdatering';
import { laesChunkLaddningsfel, prenumereraPaChunkLaddningsfel } from '@/lib/chunk-laddningsfel';
import { Uppdateringsnotis } from './Uppdateringsnotis';

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
 *
 * ═══ TVÅ LÄGEN, TVÅ LIVE-REGIONER (ADR-047 § Amendering 2026-08-13 (2)) ═══
 *
 * Komponenten bär två OLIKA budskap om samma sak, med olika brådska:
 *
 * 1. **"Det finns en nyare version"** — `role="status"` (artigt). Ingenting är
 *    trasigt; Lotta kan arbeta klart och ladda om när det passar.
 * 2. **"En del av sidan kunde inte laddas"** — `role="alert"` (assertivt).
 *    Appen har uppdaterats och den gamla koden kan inte längre hämta sina
 *    delar (`src/lib/chunk-laddningsfel.ts`). Lotta har redan klickat på något
 *    som inte gick att visa och väntar på ett svar. WCAG 2.2 SC 3.3.1 (Error
 *    Identification) kräver att felet identifieras och beskrivs i text; ett
 *    artigt meddelande som kanske annonseras om en stund duger inte när
 *    användaren står stilla och väntar. Samma mappning som `MessageBox` redan
 *    gör i hela appen: `warning`/`error` → `alert`, `info`/`success` →
 *    `status`.
 *
 * Läge 2 VINNER över läge 1 och döljer det. Att en ny version finns är
 * underförstått när en chunk saknas, och två uppmaningar att ladda om samtidigt
 * är två frågor där det bara finns en.
 *
 * Rollen sätts aldrig om på ett monterat element: en region som byter `role`
 * mitt i livet annonseras inte tillförlitligt. Det är därför två syskonregioner
 * med varsin fast roll, inte en region med växlande roll.
 *
 * ═══ VARFÖR ALERT-REGIONEN INTE ÄR ALLTID MONTERAD, TILL SKILLNAD FRÅN STATUS ═══
 *
 * `role="status"` ovan MÅSTE finnas före sitt innehåll för att annonseras.
 * `role="alert"` har motsatt egenskap och MDN (ARIA: alert role) är uttrycklig:
 * *"When the alert role is added to an element, or such an element becomes
 * visible, screen readers announce the alert."* Att montera den i förväg
 * behövs alltså inte, och den formen är dessutom aktivt skadlig här: en tom
 * `role="alert"` som ligger kvar i DOM:en under hela sessionen är en andra
 * alert-region i varje vy. Det är MÄTT, inte befarat — den alltid-monterade
 * varianten fällde tre orelaterade tester i denna klass
 * (`glomt-losenord`, `nytt-losenord`, `valkommen`) med Playwrights
 * `strict mode violation: getByRole('alert') resolved to 2 elements`, där det
 * andra elementet var formulärets egen `MessageBox`. Ett testfel är här bara
 * mätinstrumentet: samma tvetydighet möter en skärmläsaranvändare som
 * navigerar via landmärken och regioner.
 *
 * Villkorad montering är också appens ETABLERADE mönster för assertiva
 * meddelanden — `MessageBox` (`intent="error"`/`"warning"` → `role="alert"`)
 * monteras på precis samma sätt genom hela appen.
 */
export function AppUpdateBanner() {
  const uppdateringFinns = useSyncExternalStore(
    prenumereraPaAppUppdatering,
    laesAppUppdatering,
    // Server-snapshot: appen renderas aldrig på servern, men React kräver
    // argumentet för att `useSyncExternalStore` ska vara hydrerings-säker.
    () => false,
  );
  const omladdningKravs = useSyncExternalStore(
    prenumereraPaChunkLaddningsfel,
    laesChunkLaddningsfel,
    () => false,
  );

  // [PROTOTYPE — KONVERGENS, S109] `?variant=1` byter info-läget mot den
  // överlagrade notisen (ADR-121 beslut 2); `?data=ny-version` tvingar fram
  // den utan service worker, `?data=chunk` visar chunk-bannern oförändrad.
  // DEV-grindad: grenen tree-shakas bort ur prod-bundeln. Vid promovering
  // (ADR-103) flippas villkoret så notisen blir den ovillkorliga formen och
  // denna gren rivs — formen rör vi inte.
  const sok = useSearch({ strict: false }) as Record<string, unknown>;
  const prototypAktiv = import.meta.env.DEV && String(sok.variant) === '1';
  const prototypData = import.meta.env.DEV ? String(sok.data ?? '') : '';
  const [avfardad, setAvfardad] = useState(false);
  if (prototypAktiv) {
    const chunkTvingad = prototypData === 'chunk';
    const notisSynlig =
      !avfardad &&
      !chunkTvingad &&
      !omladdningKravs &&
      (prototypData === 'ny-version' || uppdateringFinns);
    return (
      <>
        {(omladdningKravs || chunkTvingad) && <ChunkBanner />}
        <Uppdateringsnotis
          synlig={notisSynlig}
          onLaddaOm={() => window.location.reload()}
          onInteNu={() => setAvfardad(true)}
        />
      </>
    );
  }

  return (
    <>
      {omladdningKravs && <ChunkBanner />}
      <div role="status" aria-live="polite" data-testid="app-update-banner">
        {uppdateringFinns && !omladdningKravs && (
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
    </>
  );
}

/**
 * Chunk-läget (`role="alert"`), oförändrat utbrutet ur `AppUpdateBanner` så
 * prototyp-grenen och den skarpa grenen delar EXAKT samma markup. Villkorad
 * montering med avsikt — se doc-blocket ovan.
 */
function ChunkBanner() {
  return (
    <div
      role="alert"
      data-testid="app-reload-required-banner"
      className="flex flex-wrap items-center justify-center gap-3 border-warning border-b bg-warning-bg px-4 py-2 text-center text-small contrast-more:border-b-2 print:hidden"
    >
      {/* Gunilla-testet: orsak, följd och åtgärd i den ordningen, utan
            ett enda tekniskt ord. Hon ska inte behöva veta vad en chunk,
            en deploy eller en service worker är för att förstå vad hon
            ska göra. Långa bindestreck är förbjudna i användarsynlig text
            (Marcus-beslut 2026-08-09, .langa-streck-policy.json). */}
      <p>
        Appen har uppdaterats medan du hade den öppen, så en del av sidan kunde inte laddas. Ladda
        om för att fortsätta. Har du skrivit något som inte är sparat, kopiera det först.
      </p>
      <Button
        intent="primary"
        size="sm"
        onPress={() => {
          // Samma omladdning som i info-läget nedan, och av samma skäl:
          // den nya service workern har redan tagit kontroll, så en
          // vanlig reload hämtar den nya koden.
          window.location.reload();
        }}
        data-testid="app-reload-required-reload"
      >
        Ladda om
      </Button>
    </div>
  );
}
