import type { ReactNode } from 'react';

export interface NotisProps {
  /** Visar notisens innehåll. Den yttre `role="status"`-regionen är ALLTID
   *  monterad — bara detta växlar (MDN, ARIA live regions: "Start with an
   *  empty live region, then – in a separate step – change the content
   *  inside the region."). */
  synlig: boolean;
  /** Tillgängligt namn på den alltid-monterade `role="status"`-regionen. */
  ariaLabel: string;
  /** Rubrik. */
  title: string;
  /** Brödtext. */
  children: ReactNode;
  /**
   * Valfri knapprad, högerställd under texten. Utelämnad = ingen rad
   * (t.ex. ett besked utan handling, som ett offline-besked).
   */
  actions?: ReactNode;
  /** `data-testid` på den yttre, alltid monterade `role="status"`-regionen. */
  regionTestId?: string;
  /** `data-testid` på det synliga kortet (bara närvarande när `synlig`). */
  kortTestId?: string;
}

/**
 * Notis — den överlagrade, passiva notisformen i notistrappan
 * (DESIGN-SYSTEM-SPEC § 21, rad 1: "Systemnivå, ingen handling krävs nu").
 *
 * PROMOVERAD UR PROTOTYPEN (TASK-285.1, ADR-103): formen är facit-låst i
 * `tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json`
 * (yta `uppdateringsnotis`, amenderad 2026-08-21: ingen kontur). Uppdaterings-
 * notisen (`src/components/AppShell/Uppdateringsnotis.tsx`) är FÖRSTA
 * konsumenten; offline-beskedet (TASK-285.6) blir den andra. Denna primitiv
 * äger 100 % av den visuella formen — konsumenter bidrar bara innehåll
 * (`title`/`children`/`actions`) och tillstånd (`synlig`/`ariaLabel`). Ingen
 * `className`-flyktväg finns med avsikt: familjeformen (ADR-121, Notistrappan)
 * ska inte kunna glida isär per konsument.
 *
 * FORMDETALJER, alla facit-låsta:
 * - Fast bredd, aldrig full bredd (Carbon: *"Toast notifications have a
 *   fixed width and should not be expanded to fit the content area."*).
 * - Överlagrad (`fixed`), aldrig i flödet → layoutförskjutning 0 (mätt,
 *   `docs/research/uppdateringsnotisens-form-och-notisfamiljen-2026-08-20.md`
 *   § "A/B mot en överlagrad form").
 * - Placerad nere till höger, ovanför TabBar-pillen (`bottom-24` = TabBar-
 *   pillens `bottom-4` + dess egen höjd) på alla bredder.
 * - INGEN kontur — vänsterkant 4 px i info-färg + skugga bär formen
 *   (familjeregeln, Marcus konvergens 2026-08-21: "Helst vill jag inte ha
 *   någon kontur alls"); `prefers-contrast: more` tänder en full kontur i
 *   info-färg (11-golvet, ej förhandlingsbart).
 * - Ingen animation eller transition — `prefers-reduced-motion` respekteras
 *   genom FRÅNVARO, inte genom att dämpas.
 * - `print:hidden` — en passiv systemnotis hör inte hemma på papper.
 * - Ingen timer — WCAG 2.2.1: när en knapp är enda vägen till åtgärden får
 *   den inte försvinna av sig själv (Notistrappans app-breda regel).
 *
 * @example
 * ```tsx
 * <Notis
 *   synlig={visas}
 *   ariaLabel="Meddelanden om appen"
 *   title="Ny version av appen"
 *   actions={
 *     <>
 *       <Button intent="ghost" size="sm" onPress={avfarda}>Inte nu</Button>
 *       <Button intent="primary" size="sm" onPress={laddaOm}>Ladda om</Button>
 *     </>
 *   }
 * >
 *   Ladda om när du är klar med det du gör.
 * </Notis>
 * ```
 */
export function Notis({
  synlig,
  ariaLabel,
  title,
  children,
  actions,
  regionTestId,
  kortTestId,
}: NotisProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      data-testid={regionTestId}
      className="print:hidden"
    >
      {synlig && (
        <div
          data-testid={kortTestId}
          className="fixed right-4 bottom-24 z-40 w-[calc(100%-2rem)] max-w-[22rem] rounded border-info border-l-4 bg-surface-overlay p-4 shadow-xl contrast-more:border sm:right-6"
        >
          <p className="font-semibold text-text">{title}</p>
          <p className="mt-1 text-small text-text-secondary">{children}</p>
          {actions && <div className="mt-3 flex justify-end gap-2">{actions}</div>}
        </div>
      )}
    </div>
  );
}
