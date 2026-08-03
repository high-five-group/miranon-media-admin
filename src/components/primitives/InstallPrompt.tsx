import type { ReactNode } from 'react';
import { Button, type ButtonProps } from './Button';
import { type InstallPromptState, useInstallPrompt } from './useInstallPrompt';

export interface InstallPromptProps extends Omit<ButtonProps, 'onPress' | 'children'> {
  /**
   * Anropas efter att `promptToInstall()` löst med `'accepted'`.
   * No-op i render-prop-läget (konsumenten äger `promptToInstall()` själv där).
   */
  onInstalled?: () => void;
  /** Anropas efter att `promptToInstall()` löst med `'dismissed'`. */
  onDismissed?: () => void;
  /**
   * DEFAULT (utelämnad, eller en `ReactNode`-etikett): renderar en `Button`
   * som anropar `promptToInstall()` — men ENDAST när `promptAvailable` är
   * `true` (AC 2: annars `null`, aldrig en död knapp). Etiketten är en
   * neutral svensk default, override-bar via denna prop (i18n-ready per
   * KVALITETSDEFINITIONER §2).
   *
   * RENDER-PROP (en funktion): full kontroll över UI:t för VARJE
   * plattformstillstånd (`chromium-prompt`/`ios-manuell`/`macos-safari-dock`/
   * `redan-installerad`) — den väg task-126.3 använder för att bygga sin
   * pedagogiska Mer-flik-yta ovanpå samma hook-tillstånd. Samma konvention
   * som react-aria-components (KVALITETSDEFINITIONER §2: "children som
   * funktion med render-states").
   */
  children?: ReactNode | ((state: InstallPromptState) => ReactNode);
}

/**
 * Install-prompt-primitiv (task-126.2; PRD task-126 användarberättelse 8+10):
 * tunn wrapper kring {@link useInstallPrompt} + `Button` — ingen egen
 * visuell identitet, inga nya design-tokens (komponerar ett redan
 * a11y-bevisat byggblock i stället för att uppfinna ett nytt).
 *
 * Ren bibliotekskod: ingen produktspecifik text hårdkodad bortom en
 * override-bar svensk default-etikett. Nästa produkt konsumerar antingen
 * default-knappen rakt av, eller `useInstallPrompt()`/render-prop-läget för
 * en helt egen yta per plattform.
 *
 * @example
 * ```tsx
 * // Default: en knapp, synlig endast när Chromium fångat händelsen.
 * <InstallPrompt onInstalled={() => setInstallerad(true)} />
 *
 * // Render-prop: konsumenten bygger själv per plattformsväg.
 * <InstallPrompt>
 *   {({ path, promptAvailable, promptToInstall }) =>
 *     path === 'ios-manuell' ? (
 *       <p>Dela → Lägg till på hemskärmen</p>
 *     ) : promptAvailable ? (
 *       <Button onPress={() => void promptToInstall()}>Installera appen</Button>
 *     ) : null
 *   }
 * </InstallPrompt>
 * ```
 */
export function InstallPrompt({
  children,
  onInstalled,
  onDismissed,
  ...buttonProps
}: InstallPromptProps) {
  const state = useInstallPrompt();

  // Render-prop-läget lämnar ALLA rendering-beslut till konsumenten —
  // garantin nedan omfattar INTE denna gren (review-fynd, task-126.2): en
  // konsument som renderar en knapp här utan att själv kolla
  // `state.promptAvailable` kan skapa en synligt "död" knapp precis som
  // vilken egen kod som helst kan. Det är ett medvetet, konventionsenligt
  // tradeoff (samma mönster som `Select.tsx`s render-prop) — DEFAULT-läget
  // nedan är den enda gren som bär den strukturella garantin.
  if (typeof children === 'function') {
    return <>{children(state)}</>;
  }

  // AC 2 — den strukturella garantin (gäller ENDAST detta default-läge):
  // promptAvailable är den ENDA vägen till en renderad knapp. Innan
  // händelsen fångats, eller när appen redan är installerad, renderas
  // ingenting.
  if (!state.promptAvailable) return null;

  const handlePress = async () => {
    const outcome = await state.promptToInstall();
    if (outcome === 'accepted') {
      onInstalled?.();
    } else {
      onDismissed?.();
    }
  };

  return (
    <Button {...buttonProps} onPress={() => void handlePress()}>
      {children ?? 'Installera appen'}
    </Button>
  );
}
