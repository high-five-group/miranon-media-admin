import { useSearch } from '@tanstack/react-router';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/primitives';
import { laesAppUppdatering, prenumereraPaAppUppdatering } from '@/lib/app-uppdatering';
import { laesChunkLaddningsfel, prenumereraPaChunkLaddningsfel } from '@/lib/chunk-laddningsfel';
import { Uppdateringsnotis } from './Uppdateringsnotis';

/**
 * `sessionStorage`-nyckeln "Inte nu"-avfärdningen skrivs under (TASK-285.1).
 * Egen konstant — inte inline-strängad flera ställen — så läsare och
 * skrivare inte kan glida isär. Samma form som `startvarmningen.ts`s
 * `E2E_TIMEOUT_OVERRIDE_NYCKEL`.
 */
const AVFARDAD_NYCKEL = 'mmUppdateringsnotisAvfardad';

/**
 * `try/catch`: `sessionStorage` kan kasta i låst/privat browserläge — en
 * dölj-preferens ska ALDRIG krascha appen (samma disciplin som
 * `startvarmningen.ts`s `lasVarmningTimeoutOverride`).
 */
function laesAvfardad(): boolean {
  try {
    return sessionStorage.getItem(AVFARDAD_NYCKEL) === '1';
  } catch {
    return false;
  }
}

function skrivAvfardad(varde: boolean): void {
  try {
    if (varde) {
      sessionStorage.setItem(AVFARDAD_NYCKEL, '1');
    } else {
      sessionStorage.removeItem(AVFARDAD_NYCKEL);
    }
  } catch {
    // Låst/privat läge: avfärdningen lever bara i React-state för denna
    // rendering — appen får aldrig krascha för en bekvämlighets-skrivning.
  }
}

/**
 * Diskret uppdaterings-notis (TASK-199-uppföljning, ADR-047 § Amendering
 * 2026-08-13; ÖVERLAGRAD FORM promoverad TASK-285.1, ADR-103).
 *
 * Visas när en nyare version av appen har aktiverats i bakgrunden. Beslutet
 * att ladda om ligger hos ANVÄNDAREN (Marcus beslut, S105) — en automatisk
 * omladdning kan slänga bort Lottas inmatning mitt i ett formulär. Mekanismen
 * som producerar signalen bor i `src/lib/app-uppdatering.ts`; denna komponent
 * vet ingenting om service workers. Den VISUELLA formen (facit-låst,
 * `tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json`) ägs
 * av `Uppdateringsnotis` + `Notis`-primitiven — denna fil äger bara SIGNALEN,
 * dölj-tillståndet och de två livesregionernas samspel.
 *
 * ═══ PROMOVERINGEN (ADR-103 B2 steg 1) ═══
 *
 * Den överlagrade notisen (`Uppdateringsnotis`) var tidigare bara synlig
 * bakom `?variant=1` (DEV-only prototyp-läge). Villkoret är nu FLIPPAT: den
 * är den OVILLKORLIGA formen för info-läget — `uppdateringFinns` (det
 * verkliga signalen) räcker, oavsett `?variant`. Den gamla banner-formen (i
 * flödet, `border-info border-b`) FINNS INTE LÄNGRE i skarp kod.
 *
 * `?variant`-GRENEN RIVS INTE HÄR — `sok`/`prototypAktiv`/`prototypData`
 * nedan lever kvar oförändrade tills Marcus godkänt promoveringen
 * (ADR-102 B3, `check-facit.sh`). Skälet de INTE bara är dött: `?data=`
 * -forceringen (`ny-version`/`chunk`) är en DEV-bekvämlighet som låter
 * Marcus/QA framkalla ett läge utan att vänta på en riktig service worker-
 * aktivering — en DATAVÄG, inte FORMEN (ADR-103 B2 steg 1: "skarpas
 * DATAVÄGAR behålls"). `NotisPrototypVaxlare`s rail (monterad i
 * `__root.tsx`) sätter alltid BÅDA `variant`+`data` tillsammans, så
 * forceringen är även fortsatt bara nåbar via samma URL-form som förut.
 *
 * ═══ "INTE NU" — SESSIONSSKOPAD AVFÄRDNING ═══
 *
 * "Inte nu" döljer notisen för RESTEN AV FLIKENS SESSION (`sessionStorage`,
 * inte `localStorage`) — överlever klient-sides navigation (komponenten
 * monteras aldrig om vid ruttbyte, se `__root.tsx`) och en manuell
 * sidladdning (F5), men INTE en ny flik (sessionStorage är per flik). Ingen
 * timer döljer notisen någonsin (WCAG 2.2.1) — "Inte nu" är enda vägen.
 *
 * En NY version ska visa notisen igen, ALDRIG periodiskt (Notistrappans
 * app-breda regel, DESIGN-SYSTEM-SPEC § 21). Mekanismlagret
 * (`app-uppdatering.ts`) ger ingen versions-identifierare att jämföra mot —
 * `uppdateringTillganglig` är en modul-nivå ENGÅNGS-flagga per sidladdning
 * (kan bara gå `false`→`true`, aldrig tillbaka, inom samma sidladdning).
 * Lösningen utnyttjar den egenskapen i stället för att uppfinna en egen
 * version-tagg: SÅ LÄNGE ingen uppdatering väntar (`!uppdateringFinns`)
 * nollställs en eventuell kvarliggande avfärdning proaktivt. Praktiskt:
 *
 * - Samma sidladdning, ingen uppdatering ännu: `uppdateringFinns` är
 *   `false` → effekten nollställer — en STALE flagga från en TIDIGARE
 *   sidladdning (som överlevde via `sessionStorage`) hinner alltså aldrig
 *   påverka den NÄSTA uppdaterings-signalen.
 * - Uppdateringen blir tillgänglig: `uppdateringFinns` blir `true` →
 *   effekten slutar nollställa (villkoret är då falskt) → en "Inte nu" från
 *   ANVÄNDAREN sätter flaggan på nytt och den STÅR KVAR för resten av denna
 *   uppdaterings livstid, eftersom `uppdateringTillganglig` inte kan gå
 *   tillbaka till `false` förrän en helt ny sidladdning sker.
 * - En NY sidladdning (t.ex. "Ladda om"-knappen) startar om från noll:
 *   `uppdateringFinns` är åter `false` tills en (eventuellt NY) uppdatering
 *   upptäcks — vid den tidpunkten körs samma nollställning igen INNAN den
 *   nya signalen hinner komma, så den nya uppdateringen visas garanterat.
 *
 * A11y-formen är ÄRVD FRÅN `OfflineIndicator` och förstapartsbelagd:
 *
 * - `role="status"` har implicit `aria-live="polite"` och `aria-atomic="true"`
 *   (MDN, ARIA: status role). `polite` betyder att skärmläsaren annonserar
 *   när användaren är ledig — meddelandet avbryter alltså aldrig Lotta mitt i
 *   en mening. Samma källa är uttrycklig om fokus: *"Do not give focus to the
 *   status when its content updates."* Vi flyttar därför aldrig fokus hit.
 * - Live-regionen är ALLTID monterad och bara INNEHÅLLET växlar. MDN
 *   (ARIA live regions) är uttrycklig: *"Start with an empty live region,
 *   then – in a separate step – change the content inside the region."* En
 *   region som skapas samtidigt som sitt innehåll annonseras inte
 *   tillförlitligt.
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

  // [PROTOTYPE — KONVERGENS, S109] `?variant=1&data=…` är en DEV-only
  // DATAVÄG (ADR-103 B2 steg 1) som forcerar info-/chunk-läget utan en
  // riktig service worker-signal — se filhuvudets "?variant-GRENEN RIVS
  // INTE HÄR". DEV-grindad: grenen tree-shakas bort ur prod-bundeln.
  const sok = useSearch({ strict: false }) as Record<string, unknown>;
  const prototypAktiv = import.meta.env.DEV && String(sok.variant) === '1';
  const prototypData = import.meta.env.DEV ? String(sok.data ?? '') : '';
  const chunkTvingad = prototypAktiv && prototypData === 'chunk';
  const dataTvingadNyVersion = prototypAktiv && prototypData === 'ny-version';

  const [avfardad, setAvfardad] = useState(laesAvfardad);

  // Se filhuvudets "INTE NU — SESSIONSSKOPAD AVFÄRDNING" för hela
  // resonemanget: så länge ingen uppdatering väntar hör en kvarliggande
  // avfärdning inte hemma längre, och nollställs proaktivt.
  useEffect(() => {
    if (!uppdateringFinns) {
      setAvfardad(false);
      skrivAvfardad(false);
    }
  }, [uppdateringFinns]);

  const notisSynlig =
    !avfardad && !chunkTvingad && !omladdningKravs && (dataTvingadNyVersion || uppdateringFinns);

  return (
    <>
      {(omladdningKravs || chunkTvingad) && <ChunkBanner />}
      <Uppdateringsnotis
        synlig={notisSynlig}
        onLaddaOm={() => {
          // Den nya service workern har REDAN tagit kontroll när denna notis
          // visas (vår `src/sw.ts` anropar `skipWaiting()` + `clients.claim()`),
          // så en vanlig omladdning hämtar den nya koden. Pluginets
          // `updateServiceWorker()` används medvetet INTE: i autoUpdate-läge
          // är den en no-op — mätt i
          // `node_modules/vite-plugin-pwa/dist/client/build/register.js`, där
          // kroppen är `if (!auto) sendSkipWaitingMessage?.()`.
          window.location.reload();
        }}
        onInteNu={() => {
          setAvfardad(true);
          skrivAvfardad(true);
        }}
      />
    </>
  );
}

/**
 * Chunk-läget (`role="alert"`), oförändrat utbrutet ur `AppUpdateBanner` så
 * prototyp-grenen och den skarpa grenen delar EXAKT samma markup. Villkorad
 * montering med avsikt — se doc-blocket ovan. Rörs INTE av TASK-285.1
 * (chunk-bannerns flytt + kortning är TASK-285.5).
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
