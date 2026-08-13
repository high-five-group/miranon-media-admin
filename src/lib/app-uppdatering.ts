import { registerSW } from 'virtual:pwa-register';

/**
 * Appens uppdateringsväg (TASK-199-uppföljning, ADR-047 § Amendering
 * 2026-08-13) — mekanismlagret.
 *
 * PROBLEMET som denna modul löser, mätt i
 * `docs/research/task-199-frontend-deployvagen-och-sw-precachen-2026-08-13.md`
 * § 3: appen kunde köra GAMMAL kod obegränsat länge. `src/sw.ts` anropar
 * `skipWaiting()` i sin install-handler, vilket gör att workern aldrig
 * passerar `waiting`. Workbox-window schemalägger sitt `waiting`-event med
 * 200 ms fördröjning och AVBRYTER det när workern går till `activating`
 * (mätt i `node_modules/workbox-window/build/workbox-window.prod.umd.js`).
 * Eftersom `registerType` inte var satt låg pluginet i sitt default
 * `'prompt'`-läge, vars hela omladdningsväg hänger på just `waiting` — den
 * fyrade aldrig, så ingen prompt och ingen omladdning existerade.
 *
 * LÖSNINGEN är inte att ta bort `skipWaiting()` utan att byta klientgren.
 * Med `registerType: 'autoUpdate'` (satt i `vite.config.ts`) lyssnar
 * vite-plugin-pwa i stället på `activated` — händelsen vår `skipWaiting()`
 * GARANTERAR. Mätt i `node_modules/vite-plugin-pwa/dist/client/build/register.js`:
 *
 *     if (auto) {
 *       wb.addEventListener("activated", (event) => {
 *         if (event.isUpdate || event.isExternal) {
 *           if (onNeedReload) onNeedReload();
 *           else window.location.reload();
 *         }
 *       });
 *
 * `skipWaiting()` går alltså från att vara buggens ORSAK till att vara
 * mekanismens FÖRUTSÄTTNING. `src/sw.ts` lämnas därför orörd.
 *
 * `onNeedReload` ersätter pluginets default (`window.location.reload()`) och
 * ger oss kontrollen. Förstapartens egen typdokumentation
 * (`node_modules/vite-plugin-pwa/types/index.d.ts`) beskriver exakt vårt
 * bruk: *"Called when the service worker has taken control and the page
 * would normally reload. Useful to fully control the reload flow."*
 * Marcus beslut (S105): omladdningen ska ligga hos ANVÄNDAREN — en
 * tvångsomladdning kan slänga bort Lottas inmatning mitt i ett formulär.
 *
 * LAGERGRÄNSEN är ett window-event. Mekanismen (denna fil) vet allt om
 * service workers och ingenting om React; UI-lagret
 * (`src/components/AppShell/AppUpdateBanner.tsx`) vet att appen har en ny
 * version redo och ingenting om vite-plugin-pwa. Beroendet går EN väg. Det
 * är samma form som `beforeinstallprompt` → `useInstallPrompt`, och det gör
 * bannern testbar utan att en service worker behöver existera — vilket den
 * inte gör i dev-servern (`vite.config.ts`, `devOptions.enabled: false`).
 */

/**
 * Signalen "en ny version av appen är aktiv och redo att visas".
 *
 * Dispatchas på `window` av mekanismen nedan och konsumeras av
 * uppdaterings-bannern. Prefixet `mm:` markerar att det är appens eget
 * event, inte ett webbläsar-event.
 */
export const APP_UPPDATERING_EVENT = 'mm:app-uppdatering-tillganglig';

/**
 * Hur ofta en öppen app frågar servern om en nyare service worker.
 *
 * En timme. Talet är inte valt på känsla — det är förstapartsrekommendationen
 * i BÅDA de källor som styr här:
 *
 * - web.dev, *The service worker lifecycle*: *"If you expect the user to be
 *   using your site for a long time without reloading, you may want to call
 *   `update()` on an interval (such as hourly)."*
 * - vite-plugin-pwa, *Periodic SW updates*: `const intervalMS = 60 * 60 * 1000`.
 *
 * Avvägningen: utan intervall har en installerad app som står öppen INGEN
 * övre gräns för hur länge den kan vara omedveten om en ny version
 * (research § 3.3 — en SPA-ruttändring är `history.pushState`, inte en
 * navigation, och triggar därför ingen uppdateringskontroll). Med en timme
 * är upptäcktstiden bunden till en timme, till priset av ett villkorat
 * HEAD-liknande anrop per timme och öppen flik.
 */
export const UPPDATERINGS_INTERVALL_MS = 60 * 60 * 1000;

/** Modul-nivå tillstånd — läses av `getSnapshot` i `useSyncExternalStore`. */
let uppdateringTillganglig = false;
const prenumeranter = new Set<() => void>();

function nyVersionAerAktiv() {
  if (uppdateringTillganglig) {
    return;
  }
  uppdateringTillganglig = true;
  for (const meddela of prenumeranter) {
    meddela();
  }
}

// Modul-nivå lyssnare: eventet är den ENDA vägen in i tillståndet, så
// mekanismen och ett test går exakt samma väg. `getSnapshot` nedan kan
// därför svara korrekt även om React renderar långt efter att eventet skedde.
if (typeof window !== 'undefined') {
  window.addEventListener(APP_UPPDATERING_EVENT, nyVersionAerAktiv);
}

/** Prenumerera på tillståndsbytet. Kontraktet `useSyncExternalStore` kräver. */
export function prenumereraPaAppUppdatering(vidAendring: () => void): () => void {
  prenumeranter.add(vidAendring);
  return () => {
    prenumeranter.delete(vidAendring);
  };
}

/** Nuvarande tillstånd. Kontraktet `useSyncExternalStore` kräver. */
export function laesAppUppdatering(): boolean {
  return uppdateringTillganglig;
}

/**
 * Startar den periodiska uppdateringskontrollen.
 *
 * Formen är förstapartens egen "edge cases"-variant
 * (https://vite-pwa-org.netlify.app/guide/periodic-sw-updates), inte den
 * förenklade — de tre guarderna finns för att en `update()` som körs vid fel
 * tillfälle är värre än ingen alls:
 *
 * 1. `r.installing` — en installation pågår redan; en till skulle kapplöpa.
 * 2. `navigator.onLine` — offline svarar servern ändå inte.
 * 3. `fetch(swUrl)` med `no-store` + statuskontroll — utan den tolkas ett
 *    felsvar som ett giltigt SW-svar. Vår SPA-rewrite gör detta EXTRA
 *    viktigt: `vercel.json` svarar `200 text/html` på allt som saknas
 *    (mätt mot prod, research § 3.4), så en naken `update()` mot ett
 *    trasigt origin är inte en no-op utan ett potentiellt felläge.
 *
 * DOKUMENTERAD AVVIKELSE från uppdragets hypotes: en guard mot
 * `document.visibilityState === 'hidden'` övervägdes men byggdes INTE.
 * Ingen av förstapartskällorna ovan nämner `visibilityState` eller dolda
 * flikar över huvud taget — rekommendationen är `navigator.onLine` +
 * fetch-verifiering, vilket är vad som står här. Med ett intervall på en
 * timme är dessutom webbläsarens egen bakgrundsflik-throttling (som golvar
 * på ~1 minut) utan praktisk betydelse. Att lägga till en guard källorna
 * inte bär vore att bygga på antagande.
 */
function startaPeriodiskKontroll(swUrl: string, registration: ServiceWorkerRegistration) {
  setInterval(async () => {
    if (registration.installing || !navigator) {
      return;
    }
    if ('connection' in navigator && !navigator.onLine) {
      return;
    }
    try {
      const svar = await fetch(swUrl, {
        cache: 'no-store',
        headers: { cache: 'no-store', 'cache-control': 'no-cache' },
      });
      if (svar.status === 200) {
        await registration.update();
      }
    } catch {
      // Nätverksfel är förväntat och ointressant — nästa varv försöker igen.
      // Ett kastat fel här får aldrig bli en obehandlad rejection i konsolen.
    }
  }, UPPDATERINGS_INTERVALL_MS);
}

/**
 * Registrerar service workern och kopplar upp uppdateringsvägen.
 *
 * Ersätter det tidigare nakna `registerSW()`-anropet i `src/main.tsx`, som
 * saknade varje option och därmed varje väg från "ny deploy" till "Lotta ser
 * ny kod".
 */
export function registreraAppUppdatering(): void {
  registerSW({
    onNeedReload() {
      window.dispatchEvent(new CustomEvent(APP_UPPDATERING_EVENT));
    },
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        startaPeriodiskKontroll(swUrl, registration);
      }
    },
  });
}
