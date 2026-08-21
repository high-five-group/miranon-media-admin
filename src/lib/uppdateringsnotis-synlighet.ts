/**
 * Delad synlighetssignal för uppdateringsnotisen (TASK-285.6) — mekanismen
 * som gör STAPLINGEN möjlig, inte notisen själv.
 *
 * `AppUpdateBanner.tsx` äger den FÄRDIGA beräkningen av om
 * `Uppdateringsnotis` visas just nu (`uppdateringFinns`, sessionsskopad
 * avfärdning, chunk-undertryckning, dev-forcering av `?variant`) — samma
 * beräkning som redan styr dess EGEN rendering (`notisSynlig` i den filen).
 * Offline-notisen (TASK-285.6, `OfflineIndicator.tsx`) behöver VETA om
 * uppdateringsnotisen delar den överlagrade regionen just nu, för att
 * stapla sig ovanför den i stället för att överlappa den.
 *
 * VARFÖR INTE `laesAppUppdatering()` (app-uppdatering.ts): den flaggan är en
 * ENGÅNGS "en uppdatering finns"-signal som stannar `true` även efter att
 * användaren valt "Inte nu" — notisen är då DOLD, men den råa flaggan säger
 * fortfarande sant. Offline-notisen hade då staplat sig ovanför en osynlig
 * kortplats, med ett tomt mellanrum som resultat. Denna modul publicerar i
 * stället det FÄRDIGA, synlighets-exakta resultatet.
 *
 * Samma mönster som `chunk-laddningsfel.ts` och `app-uppdatering.ts`:
 * modul-nivå tillstånd + prenumeranter, läst via `useSyncExternalStore`.
 */
let synlig = false;
const prenumeranter = new Set<() => void>();

/** Anropas av `AppUpdateBanner` varje gång dess `notisSynlig` ändras. */
export function skrivUppdateringsnotisSynlig(nyttVarde: boolean): void {
  if (synlig === nyttVarde) {
    return;
  }
  synlig = nyttVarde;
  for (const meddela of prenumeranter) {
    meddela();
  }
}

/** Prenumerera på tillståndsbytet. Kontraktet `useSyncExternalStore` kräver. */
export function prenumereraPaUppdateringsnotisSynlig(vidAendring: () => void): () => void {
  prenumeranter.add(vidAendring);
  return () => {
    prenumeranter.delete(vidAendring);
  };
}

/** Nuvarande tillstånd. Kontraktet `useSyncExternalStore` kräver. */
export function laesUppdateringsnotisSynlig(): boolean {
  return synlig;
}
