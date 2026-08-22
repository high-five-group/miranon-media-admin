import { Button, Notis } from '@/components/primitives';

/**
 * Uppdateringsnotisen — den överlagrade notisen som säger att en ny version
 * av appen är redo. FÖRSTA konsumenten av `Notis`-primitiven
 * (`src/components/primitives/Notis.tsx`), promoverad ur prototypen
 * (TASK-285.1, ADR-103 B2 steg 1): formen låg tidigare bakom `?variant=1` i
 * `AppUpdateBanner.tsx` och är nu den ovillkorliga formen för info-läget.
 *
 * FACIT: `tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json`
 * (yta `uppdateringsnotis`, amenderad 2026-08-21: ingen kontur). Se
 * `Notis`-primitivens eget doc-block för formdetaljerna (bredd, placering,
 * kontur, timer, animation, print) — de äger primitiven, inte denna fil.
 *
 * "Inte nu" döljer notisen för RESTEN AV SESSIONEN (sessionStorage,
 * `AppUpdateBanner.tsx`); en NY version visar den igen. Ingen timer döljer
 * den någonsin (WCAG 2.2.1) — knappen är enda vägen till åtgärden.
 *
 * Copy följer § 21:s copy-golv och research-passets förslag (titel utan
 * punkt per Carbon; "Ladda om", aldrig "Uppdatera"; kort body mot dagens
 * långa bannertext). Databesked-varningen ("kopiera det du skrivit") hör
 * INTE hemma här — den bor i chunk-bannern (ADR-121 § 8), som rörs i en
 * egen skiva (TASK-285.5).
 *
 * RIVNINGEN ÄR GJORD (TASK-285.11, 2026-08-22, efter Marcus stämpling):
 * `?variant`-grenen i `AppUpdateBanner.tsx`, `NotisPrototypVaxlare` och
 * prototyp-routen `/dev/notis-prototyp` finns inte längre. DENNA komponent
 * rördes INTE av rivningen — den ÄR den promoverade formen, inte
 * prototyp-substrat.
 */
export interface UppdateringsnotisProps {
  /** Visas innehållet? Regionen själv är alltid monterad. */
  synlig: boolean;
  onLaddaOm: () => void;
  onInteNu: () => void;
}

export function Uppdateringsnotis({ synlig, onLaddaOm, onInteNu }: UppdateringsnotisProps) {
  return (
    <Notis
      synlig={synlig}
      ariaLabel="Meddelanden om appen"
      title="Ny version av appen"
      regionTestId="app-update-banner"
      kortTestId="app-update-notis"
      actions={
        <>
          <Button intent="ghost" size="sm" onPress={onInteNu} data-testid="app-update-inte-nu">
            Inte nu
          </Button>
          <Button intent="primary" size="sm" onPress={onLaddaOm} data-testid="app-update-reload">
            Ladda om
          </Button>
        </>
      }
    >
      Ladda om när du är klar med det du gör.
    </Notis>
  );
}
