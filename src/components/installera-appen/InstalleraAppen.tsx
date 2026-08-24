import { CheckCircle2, Share, SquarePlus } from 'lucide-react';
import {
  Button,
  InstallPrompt,
  type InstallPromptState,
  MessageBox,
} from '@/components/primitives';
import { SidRam } from '@/components/primitives/SidRam';

/**
 * "Installera appen" — Mer-flikens install-yta (task-126.3; PRD task-126,
 * användarberättelser 1–4 + 8). Aktiverar tråd T47:s parkerade
 * Inställnings-hemvist (`tasks/threads/T47-installningar-yta-mer-flik.md`;
 * byggplan.md §4 6e: "Inställningar de-scopad → T47").
 *
 * PRODUKTSPECIFIK VY (kvalitetsribba 11/10/10) — inte bibliotekskod. Skiljer
 * sig därmed medvetet från `InstallPrompt`/`useInstallPrompt` (task-126.2),
 * som ÄR bibliotekskod och bär 11/11/11: den här filen får hårdkodad svensk
 * pedagogisk text (Gunilla-principen, AC 2), medan InstallPrompt.tsx håller
 * sig till en enda override-bar default-etikett.
 *
 * Byggd DIREKT ovanpå task-126.2:s render-prop-läge — InstallPrompt.tsx:s
 * egen kommentar pekar hit: "den väg task-126.3 använder för att bygga sin
 * pedagogiska Mer-flik-yta ovanpå samma hook-tillstånd". EN hook-instans
 * (inte ett separat `useInstallPrompt()`-anrop vid sidan av `<InstallPrompt>`)
 * håller plattformsdetekteringen och den fångade engångshändelsen i samma
 * tillstånd som knappen som faktiskt konsumerar den — task-126.2:s
 * review-fynd om syskoninstanser som race:ar om samma engångshändelse gäller
 * flera MONTERADE instanser, och den här ytan monterar bara en.
 *
 * AC-täckning:
 * - AC 1 (plattformens väg dominerar, övriga nås men dominerar inte): den
 *   detekterade vägen renderas expanderad överst (egen `<h2>`); de två andra
 *   vägarna nås via native `<details>/<summary>` — webbläsaren äger hela
 *   disclosure-semantiken, inget ARIA att bygga fel.
 * - AC 2 (Gunilla-principen): varje steg förklarar VAD ikonen/menyn/knappen
 *   ÄR (t.ex. "Dela-knappen... ser ut som en fyrkant med en pil som pekar
 *   uppåt"), aldrig bara "tryck här".
 * - AC 3 (Chromium-knappen installerar på riktigt): återanvänder
 *   `state.promptToInstall()` direkt — samma kontrakt `InstallPrompt.tsx`s
 *   default-läge bär. Efter ett accepterat val sätter hooken `installed` →
 *   `state.path` blir `redan-installerad` → ytan växlar till
 *   bekräftelse-läget utan eget mellanliggande state.
 * - AC 4 (redan installerad → bekräftelse, ej instruktion): tidigt return,
 *   inga instruktionssektioner alls när `path === 'redan-installerad'`.
 *
 * SIDKROM (TASK-299.9, PRD `TASK-299` § OMFATTNINGEN LÅST): husets delade
 * `SidRam`-primitiv (kant-i-kant-dialekten) ersätter den äldre textlänken
 * ("← Tillbaka till Mer", `text-small underline`) som satt i en `p-4`-sektion
 * med DUBBLERAD sidmarginal (main:s egen `px-4 py-4` plus sektionens egen
 * `p-4`). Ingen egen sidopadding kvar på sektionen — `<header>` tar `px-4`
 * för att matcha chevronens `mx-4`-indrag; innehållet under (install-flödet)
 * har ingen egen horisontell padding och sitter flush mot main. Bara
 * sidkromet (chevron), aldrig rubrikblocket (ägandeskapsaxeln avgjord till
 * den smalare omfattningen).
 */
export function InstalleraAppen() {
  return (
    <section className="flex flex-col gap-6">
      <SidRam to="/mer" tillbakaEtikett="Tillbaka till Mer" />

      <header className="flex flex-col gap-1 px-4">
        <h1 className="font-semibold text-2xl">Installera appen</h1>
        <p className="text-small text-text-muted">
          När appen är installerad öppnas den som en egen app på din hemskärm eller i Dock - precis
          som dina andra appar. Du slipper leta i webbläsaren varje gång, och adressfältet är borta.
        </p>
      </header>

      <InstallPrompt>{(state) => <InstalleraAppenInnehall state={state} />}</InstallPrompt>
    </section>
  );
}

function InstalleraAppenInnehall({ state }: { state: InstallPromptState }) {
  // AC 4: redan installerad → bekräftelse-läge. Inga instruktionssektioner
  // renderas alls (varken primär eller sekundär) — det finns inget kvar att
  // installera.
  if (state.path === 'redan-installerad') {
    return (
      <MessageBox intent="success" title="Appen är redan installerad">
        <p className="flex items-start gap-2">
          <CheckCircle2 size={18} aria-hidden className="mt-0.5 shrink-0" />
          <span>Du använder redan appen i installerat läge. Du behöver inte göra något mer.</span>
        </p>
      </MessageBox>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {state.path === 'ios-manuell' && (
        <section aria-labelledby="installera-primar-rubrik">
          <h2 id="installera-primar-rubrik" className="font-semibold text-lg">
            Så installerar du på din iPhone eller iPad
          </h2>
          <div className="mt-3">
            <IosSteg />
          </div>
        </section>
      )}
      {state.path === 'macos-safari-dock' && (
        <section aria-labelledby="installera-primar-rubrik">
          <h2 id="installera-primar-rubrik" className="font-semibold text-lg">
            Så installerar du på din Mac
          </h2>
          <div className="mt-3">
            <MacSteg />
          </div>
        </section>
      )}
      {state.path === 'chromium-prompt' && (
        <section aria-labelledby="installera-primar-rubrik">
          <h2 id="installera-primar-rubrik" className="font-semibold text-lg">
            Så installerar du i den här webbläsaren
          </h2>
          <div className="mt-3">
            <ChromiumSteg state={state} />
          </div>
        </section>
      )}

      {/* AC 1: övriga vägar NÅS men DOMINERAR INTE — native <details>/
          <summary> (kollapsat i vila), ingen egen ARIA-implementation att få
          fel; webbläsaren äger hela disclosure-semantiken och tangentbords-
          hanteringen. */}
      <div className="flex flex-col gap-3 border-border-light border-t pt-4">
        <p className="text-small text-text-muted">Andra enheter</p>

        {state.path !== 'ios-manuell' && (
          <details className="rounded-2xl border border-border p-4 contrast-more:border-border-strong">
            <summary className="cursor-pointer font-semibold text-body">
              Har du en iPhone eller iPad?
            </summary>
            <div className="mt-3">
              <IosSteg />
            </div>
          </details>
        )}

        {state.path !== 'macos-safari-dock' && (
          <details className="rounded-2xl border border-border p-4 contrast-more:border-border-strong">
            <summary className="cursor-pointer font-semibold text-body">Har du en Mac?</summary>
            <div className="mt-3">
              <MacSteg />
            </div>
          </details>
        )}

        {state.path !== 'chromium-prompt' && (
          <details className="rounded-2xl border border-border p-4 contrast-more:border-border-strong">
            <summary className="cursor-pointer font-semibold text-body">
              På en dator med Chrome eller Edge?
            </summary>
            <div className="mt-3">
              <ChromiumSteg state={state} />
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * iOS/iPadOS — huvudpersonen (PRD task-126: enhetsprofilen S95 Del 2 pekar
 * ut iPad/iPhone som hushållets huvudplattform). Varje steg förklarar VAD
 * ikonen/knappen/menyn ÄR innan den säger vad man ska göra med den
 * (Gunilla-principen, AC 2) — ingen oförklarad teknisk term.
 */
function IosSteg() {
  return (
    <ol className="flex flex-col gap-3 text-body">
      <li>
        <strong>1. Öppna Safari.</strong> Det här sättet att installera fungerar bara i webbläsaren
        Safari (ikonen med den blå kompassen) - inte i Chrome eller andra webbläsare på din iPhone
        eller iPad.
      </li>
      <li className="flex items-start gap-2">
        <Share size={18} aria-hidden className="mt-0.5 shrink-0 text-text-muted" />
        <span>
          <strong>2. Tryck på Dela-knappen.</strong> Det är symbolen som ser ut som en fyrkant med
          en pil som pekar uppåt. På iPhone sitter den längst ner mitt på skärmen; på iPad sitter
          den uppe till höger, bredvid adressfältet.
        </span>
      </li>
      <li className="flex items-start gap-2">
        <SquarePlus size={18} aria-hidden className="mt-0.5 shrink-0 text-text-muted" />
        <span>
          <strong>3. Bläddra ner i listan</strong> som dyker upp och tryck på "Lägg till på
          hemskärmen".
        </span>
      </li>
      <li>
        <strong>4. Tryck på "Lägg till"</strong> uppe i högra hörnet.
      </li>
      <li>
        <strong>5. Klart!</strong> Appen finns nu som en egen ikon på din hemskärm, precis som dina
        andra appar. Tryck på ikonen nästa gång du vill öppna appen.
      </li>
    </ol>
  );
}

/**
 * macOS Safari — "Lägg till i Dock" (Rogers dagliga arbetsflöde, PRD task-126
 * användarberättelse 4). Safari implementerar aldrig `beforeinstallprompt`
 * (Apple Developer-forumet, tråd 807603, bekräftad i task-126.2:s research)
 * — vägen är därför alltid manuell, av samma plattformsskäl som iOS.
 */
function MacSteg() {
  return (
    <ol className="flex flex-col gap-3 text-body">
      <li>
        <strong>1. Öppna menyn "Arkiv".</strong> Den ligger längst upp på skärmen, i raden med
        menyer (inte i webbläsarfönstret) - bredvid menyn som heter "Safari".
      </li>
      <li>
        <strong>2. Välj "Lägg till i Dock…"</strong> i menyn som visas.
      </li>
      <li>
        <strong>3. Tryck på "Lägg till"</strong> i rutan som dyker upp.
      </li>
      <li>
        <strong>4. Klart!</strong> Appen finns nu i Dock - raden med programikoner längst ner på
        skärmen. Öppna den därifrån, precis som vilket annat program på datorn som helst.
      </li>
    </ol>
  );
}

/**
 * Chromium (Chrome/Edge/Brave/Opera m.fl.) — riktig installations-dialog
 * gated bakom `promptAvailable` (AC 3, task-126.2:s strukturella garanti:
 * `promptAvailable` är den ENDA vägen till en renderad knapp — ingen död
 * knapp kan uppstå). Innan webbläsaren fångat sin egen händelse visas i
 * stället den väg webbläsaren själv redan erbjuder via adressfältet/menyn,
 * så besökaren aldrig möts av en tom yta.
 */
function ChromiumSteg({ state }: { state: InstallPromptState }) {
  if (state.promptAvailable) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-body">
          Den här webbläsaren kan installera appen direkt. Tryck på knappen så visas
          installationsrutan.
        </p>
        <Button onPress={() => void state.promptToInstall()}>Installera appen</Button>
      </div>
    );
  }
  return (
    <p className="text-body">
      Leta efter en installationsikon i adressfältet högst upp - den ser ut som en liten skärm med
      en pil nedåt. Hittar du ingen ikon: öppna menyn med de tre punkterna uppe i högra hörnet och
      välj "Installera appen".
    </p>
  );
}
