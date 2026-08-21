import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { Notis } from '@/components/primitives';
import {
  laesUppdateringsnotisSynlig,
  prenumereraPaUppdateringsnotisSynlig,
} from '@/lib/uppdateringsnotis-synlighet';

/**
 * Offline-beskedet (Fas 5, ADR-047 B5; ÖVERLAGRAD FORM promoverad TASK-285.6,
 * ADR-103/ADR-121) — samma överlagrade `Notis`-form som uppdateringsnotisen
 * (facit-låst, `tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json`),
 * inte längre en orange helbreddsrad som trycker ner sidan.
 *
 * MEKANISMEN ÄR OFÖRÄNDRAD: prenumererar på TanStacks `onlineManager` (samma
 * källa som pausar queries vid networkMode 'online', ADR-047 B5) så notis
 * och query-beteende aldrig divergerar. Bara RENDERINGEN byter — samma
 * online/offline-lyssnare, samma alltid-monterade `role="status"`-region
 * (nu `Notis`-primitivens egen, i stället för en handskriven `<p>`).
 *
 * INGEN KNAPP: till skillnad från uppdateringsnotisen har detta besked ingen
 * `actions`-slot. Orsaken (nätet är borta) försvinner av sig själv när
 * anslutningen är tillbaka — detta är den ENDA notisen i familjen som får
 * stängas UTAN användarens val (Notistrappan §21: "systemnivå, ingen handling
 * krävs nu" — jämför uppdateringsnotisen, vars enda väg ut är en knapp,
 * WCAG 2.2.1).
 *
 * STAPLING (AC #4): finns uppdateringsnotisen SAMTIDIGT synlig, skjuts detta
 * kort uppåt (`staplad`) så de inte överlappar — offline överst, uppdaterings-
 * notisens egen plats (`bottom-24`) rörs aldrig. Signalen kommer från
 * `uppdateringsnotis-synlighet.ts`, som bär den FÄRDIGA (avfärdnings- och
 * chunk-medvetna) synligheten — se den modulens doc-block för varför den
 * råa "en uppdatering finns"-flaggan i `app-uppdatering.ts` INTE duger här.
 */
export function OfflineIndicator() {
  const isOnline = useSyncExternalStore(
    (onStoreChange) => onlineManager.subscribe(onStoreChange),
    () => onlineManager.isOnline(),
  );
  const uppdateringsnotisSynlig = useSyncExternalStore(
    prenumereraPaUppdateringsnotisSynlig,
    laesUppdateringsnotisSynlig,
    // Server-snapshot: appen renderas aldrig på servern, men React kräver
    // argumentet för att `useSyncExternalStore` ska vara hydrerings-säker.
    () => false,
  );

  return (
    <Notis
      synlig={!isOnline}
      staplad={uppdateringsnotisSynlig}
      ariaLabel="Anslutningsstatus"
      title="Du är offline"
      regionTestId="offline-banner"
      kortTestId="offline-notis"
    >
      Visar senast hämtade data tills anslutningen är tillbaka.
    </Notis>
  );
}
