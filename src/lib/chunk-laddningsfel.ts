/**
 * Kraschfönstrets sista lucka (TASK-199-uppföljning, ADR-047 § Amendering
 * 2026-08-13 (2)) — mekanismlagret.
 *
 * PROBLEMET denna modul löser är det som uppdateringsbannern INTE stänger.
 * Bannern (`src/lib/app-uppdatering.ts`) gör kraschfönstret ändligt: den
 * signalerar att en ny version är aktiv och låter Lotta välja när sidan ska
 * laddas om. Men MELLAN deployen och klicket kör fliken fortfarande gammal
 * kod, och den koden refererar chunk-namn som inte längre finns på servern.
 *
 * Mätt mot prod 2026-08-13
 * (`docs/research/task-199-frontend-deployvagen-och-sw-precachen-2026-08-13.md`
 * § 3.4): en saknad asset svarar `200 text/html` med 4410 byte, byte för byte
 * identiskt med `index.html`, eftersom `vercel.json`s SPA-rewrite
 * (`"source": "/(.*)", "destination": "/index.html"`) fångar den. Webbläsaren
 * vägrar exekvera HTML som ES-modul och avvisar importen med
 * `Failed to fetch dynamically imported module`.
 *
 * ═══ VAD `vite:preloadError` FAKTISKT FÅNGAR ═══
 *
 * Mätt i vår installerade Vite 8.2.0,
 * `node_modules/vite/dist/node/chunks/node.js` (preload-helpern som
 * `buildImportAnalysisPlugin` injicerar runt varje dynamisk import i bygget),
 * verbatim:
 *
 *     function handlePreloadError(err) {
 *       const e = new Event("vite:preloadError", { cancelable: true });
 *       e.payload = err;
 *       window.dispatchEvent(e);
 *       if (!e.defaultPrevented) throw err;
 *     }
 *     return promise.then((res) => {
 *       for (const item of res || []) {
 *         if (item.status !== "rejected") continue;
 *         handlePreloadError(item.reason);
 *       }
 *       return baseModule().catch(handlePreloadError);
 *     });
 *
 * FÅNGAR: (1) själva den dynamiska importen när den avvisas, vilket är
 * MIME-felet ovan, och (2) en CSS-dep vars `<link rel="stylesheet">` fyrar
 * `error`.
 *
 * FÅNGAR INTE: statiska importer i entry-chunken (de laddas ur den färska
 * `index.html`, inte lazy), egna `fetch()`-anrop, bilder, web workers, och
 * misslyckade `modulepreload`-länkar för JS-deps (koden skapar bara en Promise
 * när `isCss` är sant, så en trasig JS-preload syns aldrig i `allSettled`).
 * Den sista är utan praktisk betydelse hos oss: när dep:en saknas avvisas
 * `baseModule()` ändå, vilket gren (1) fångar.
 *
 * FÅNGAR INTE I DEV: helpern injiceras av `buildImportAnalysisPlugin`, som
 * dess egen källkommentar märker `"Build only"`. Dev-servern serverar varje
 * modul separat via native ESM utan preload-helper. Det är skälet till att
 * `tests/webblasarbeteende/app-chunk-laddningsfel.test.ts` dispatchar eventet
 * syntetiskt i stället för att blockera en chunk.
 *
 * ═══ VARFÖR VI INTE ANROPAR `preventDefault()` ═══
 *
 * Vites egen dokumentation
 * (https://vite.dev/guide/build.html, § Load Error Handling) visar exemplet
 * `window.addEventListener('vite:preloadError', () => window.location.reload())`
 * och konstaterar att *"If you call `event.preventDefault()`, the error will
 * not be thrown."* Läst mot källan ovan betyder det något mer specifikt än det
 * låter: `handlePreloadError` är `.catch()`-handlern för `baseModule()`. Sväljs
 * felet returnerar den `undefined`, och `__vitePreload` RESOLVAR då med
 * `undefined` i stället för modulen. Anroparen (TanStack Routers
 * kod-splittring) får en modul som inte finns och kraschar en rad senare med
 * ett meddelande som inte har med saken att göra.
 *
 * `preventDefault()` är alltså bara säkert i kombination med en OMEDELBAR
 * omladdning, som i Vites exempel. Och en omedelbar omladdning är precis vad
 * Marcus beslut (S105, `ADR-047` § Amendering 2026-08-13) förbjuder: den kan
 * slänga bort det Lotta har skrivit i ett formulär.
 *
 * Vi låter därför felet kastas vidare. Det landar i routerns
 * `defaultErrorComponent` (`SectionError`, `src/router.ts`), som renderar i
 * Outlet-positionen med skalet kvar — ingen vit skärm — och Sentry får
 * rapporten via `createRoot`s `onCaughtError` (`src/main.tsx`). Vad
 * `SectionError` ensam INTE kan göra är att förklara felet eller läka det:
 * dess "Försök igen" kör om samma import mot samma saknade chunk och kan
 * strukturellt aldrig lyckas. Denna modul bär den delen.
 *
 * ═══ VARFÖR EN SYNLIG UPPMANING ÄR RÄTT SVAR HÄR ═══
 *
 * Hos oss kan eventet bara fyra vid en navigering Lotta själv har utlöst,
 * aldrig spontant medan hon skriver. `src/router.ts` sätter inte
 * `defaultPreload`, och `@tanstack/router-core` sätter ingen default för det
 * fältet (mätt: `dist/esm/router.js` sätter `defaultPreloadDelay: 50` men
 * aldrig `defaultPreload`). I `@tanstack/react-router`s `link.js` gäller
 * `const preload = ... userPreload ?? router.options.defaultPreload`, och varje
 * gren därefter jämför mot `"intent"` / `"render"` / `"viewport"` — med
 * `undefined` är alla falska. Ingen route hämtas alltså på hover.
 *
 * LAGERGRÄNSEN är window-eventet, exakt som i `app-uppdatering.ts`: denna fil
 * vet allt om Vites preload-helper och ingenting om React; UI-lagret vet att
 * appen inte kan hämta mer kod och ingenting om Vite.
 */

/**
 * Vites eget event för en misslyckad dynamisk import.
 *
 * Namnet är Vites, inte vårt, och skrivs därför utan `mm:`-prefix.
 */
export const VITE_PRELOAD_ERROR_EVENT = 'vite:preloadError';

/** Modul-nivå tillstånd — läses av `getSnapshot` i `useSyncExternalStore`. */
let omladdningKravs = false;
const prenumeranter = new Set<() => void>();

function chunkKundeInteHaemtas() {
  if (omladdningKravs) {
    return;
  }
  omladdningKravs = true;
  for (const meddela of prenumeranter) {
    meddela();
  }
}

// Modul-nivå lyssnare. Modulen dras in i entry-chunken via
// `AppUpdateBanner` → `src/routes/__root.tsx`, som är statiskt importerad.
// Lyssnaren finns därmed på plats innan den första lazy-laddade routen ens
// kan börja hämtas, vilket är den tidigaste punkt då eventet kan fyra.
if (typeof window !== 'undefined') {
  window.addEventListener(VITE_PRELOAD_ERROR_EVENT, chunkKundeInteHaemtas);
}

/** Prenumerera på tillståndsbytet. Kontraktet `useSyncExternalStore` kräver. */
export function prenumereraPaChunkLaddningsfel(vidAendring: () => void): () => void {
  prenumeranter.add(vidAendring);
  return () => {
    prenumeranter.delete(vidAendring);
  };
}

/** Nuvarande tillstånd. Kontraktet `useSyncExternalStore` kräver. */
export function laesChunkLaddningsfel(): boolean {
  return omladdningKravs;
}
