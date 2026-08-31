/**
 * [TASK-349] Minnet av att Segment-startvyns info-`MessageBox` (ingressen
 * under `<h1>Segment</h1>`) är avfärdad — PER ENHET (`localStorage`, inte
 * `sessionStorage`): kortets AC #2 kräver att krysset "minns per enhet",
 * alltså över flikbyten och nya sidladdningar, inte bara resten av fliken
 * (skillnaden mot `AppUpdateBanner.tsx`s "Inte nu", som medvetet ÄR
 * sessionsskopad — den notisen ska visas igen efter en ny sidladdning,
 * denna ska inte).
 *
 * Samma form som `betalningar/betalsatt-minne.ts`: en liten, delad modul med
 * läs/skriv-par i stället för inline-`localStorage`-anrop i komponenten, så
 * nyckeln har EN källa.
 *
 * KASTAR ALDRIG. `localStorage` kan kasta redan vid ÅTKOMST i privat läge
 * och i webbläsare som blockerar lagring. Detta är en bekvämlighet, aldrig
 * data: faller läsningen renderas MessageBoxen (odismissad är det korrekta,
 * säkra utgångsläget — se `betalsatt-minne.ts`s samma disciplin); faller
 * skrivningen tappas bara minnet av avfärdningen, aldrig något segment.
 */

const SEGMENT_STARTINFO_NYCKEL = 'mm.segment.startinfoDold';

/** Läser om startvyns info-ruta är avfärdad. Kastar aldrig — privat läge blockerar. */
export function lasSegmentStartinfoDold(): boolean {
  try {
    return window.localStorage.getItem(SEGMENT_STARTINFO_NYCKEL) === '1';
  } catch {
    // Privat läge, blockerade cookies, eller en webbläsare som kastar på
    // access. Ett odismissat utgångsläge duger — rutan visas, vilket är
    // det säkra felet (aldrig tvärtom: en ruta som aldrig går att se).
    return false;
  }
}

/** Sparar att startvyns info-ruta är avfärdad. Kastar aldrig — se ovan. */
export function sparaSegmentStartinfoDold(): void {
  try {
    window.localStorage.setItem(SEGMENT_STARTINFO_NYCKEL, '1');
  } catch {
    // Se ovan — avfärdningen lever då bara i denna sidladdningens React-state.
  }
}
