import { Button } from '@/components/primitives';

/**
 * [PROTOTYPE — KONVERGENS, S109] Den överlagrade uppdateringsnotisen.
 *
 * FRÅGAN DENNA PROTOTYP BESVARAR: *Hur ska den överlagrade, passiva notisen
 * "ny version finns" se ut — placering, bredd, typografi, knappar — så att
 * Marcus är helt nöjd?* Arkitekturen är redan avgjord av evidens och ändras
 * inte här (ADR-121 beslut 2 + DESIGN-SYSTEM-SPEC § 21 Notistrappan):
 *
 * - ÖVERLAGRAD, aldrig i flödet → layoutförskjutning 0,0000 (mätt), mot
 *   0,1469 för dagens banner vid 390 px.
 * - FAST BREDD, aldrig full bredd (Carbon).
 * - INGEN TIMER — knappen är enda vägen till åtgärden (WCAG 2.2.1).
 * - Live-regionen `role="status"` `aria-live="polite"` är ALLTID monterad,
 *   bara innehållet växlar (MDN, sonner-mönstret). Fokus flyttas aldrig.
 * - "Inte nu" stänger för sessionen; notisen återkommer vid nästa NYA
 *   version, aldrig periodiskt.
 *
 * Konvergens per ADR-103: EN variant, itererad i dev-servern, lokal commit per
 * varv. Den godkända slutformen PROMOVERAS (villkoret i `AppUpdateBanner`
 * flippas) — formen byggs aldrig om. Det som rivs efter Marcus godkännande är
 * växlaren och `?variant=`-grenen, aldrig denna komponent.
 *
 * Copy följer § 21:s copy-golv och research-passets förslag (titel utan punkt
 * per Carbon; "Ladda om", aldrig "Uppdatera"; 39 tecken body mot dagens 118).
 * Databesked-varningen är medvetet BORTA ur notisen — var den landar är
 * ADR-121 § 8, öppet och inte prototypens fråga.
 */
export interface UppdateringsnotisProps {
  /** Visas innehållet? Regionen själv är alltid monterad. */
  synlig: boolean;
  onLaddaOm: () => void;
  onInteNu: () => void;
}

export function Uppdateringsnotis({ synlig, onLaddaOm, onInteNu }: UppdateringsnotisProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Meddelanden om appen"
      data-testid="app-update-banner"
      className="print:hidden"
    >
      {synlig && (
        <div
          data-testid="app-update-notis"
          // bottom-24: ovanför TabBar-pillen (bottom-4 + ~52 px), som äger
          // botten-bandet på ALLA bredder (max-w-568 centrerad). z-40: över
          // innehållet, under Modal (z-50).
          className="fixed right-4 bottom-24 z-40 w-[calc(100%-2rem)] max-w-[22rem] rounded border border-border border-l-4 border-l-info bg-surface-overlay p-4 shadow-xl contrast-more:border-2 contrast-more:border-border-strong contrast-more:border-l-4 contrast-more:border-l-info sm:right-6"
        >
          <p className="font-semibold text-text">Ny version av appen</p>
          <p className="mt-1 text-small text-text-secondary">
            Ladda om när du är klar med det du gör.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button intent="ghost" size="sm" onPress={onInteNu} data-testid="app-update-inte-nu">
              Inte nu
            </Button>
            <Button intent="primary" size="sm" onPress={onLaddaOm} data-testid="app-update-reload">
              Ladda om
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
