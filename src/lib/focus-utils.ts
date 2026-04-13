/**
 * focusUtils — Utilities för att hitta fokuserbara element i en container.
 *
 * Portat och förbättrat från FK Designsystems `findTabbableElements`.
 * Används av `useFocusScope` för fokus-fälla.
 *
 * @example
 * ```ts
 * const tabbable = findTabbableElements(dialogEl)
 * const first = tabbable[0]
 * const last = tabbable[tabbable.length - 1]
 * ```
 *
 * @module
 */

// ---------------------------------------------------------------------------
// Konstanter
// ---------------------------------------------------------------------------

/**
 * CSS-selektor som matchar potentiellt fokuserbara element.
 * Baserad på WHATWG:s definition + praktiska tillägg.
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]',
  '[contenteditable]:not([contenteditable="false"])',
  'details > summary',
  'audio[controls]',
  'video[controls]',
].join(', ');

// ---------------------------------------------------------------------------
// Intern hjälpfunktion
// ---------------------------------------------------------------------------

/**
 * Kontrollerar om ett element är synligt och tabbable.
 * Filtrerar bort dolda, inerta och negativ-tabindex-element.
 */
function isTabbable(el: HTMLElement): boolean {
  // Negativ tabindex → fokuserbar via script men inte via Tab
  if (el.tabIndex < 0) return false;

  // inert-attribut (nativt eller fallback)
  if (el.closest('[inert]')) return false;

  // Dold via display/visibility
  const style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }

  // Kontrollera ancestors för display:none (inte bara elementet)
  if (el.offsetParent === null && style.position !== 'fixed') {
    return false;
  }

  // Barn av disabled fieldset
  if (el.closest('fieldset[disabled]') && el.matches('input, select, textarea, button')) {
    // Undantag: legend > element är undantagna
    const fieldset = el.closest('fieldset[disabled]');
    const legend = fieldset?.querySelector('legend');
    if (!legend?.contains(el)) {
      return false;
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Publikt API
// ---------------------------------------------------------------------------

/**
 * Hittar alla tabbable element i en container, i DOM-ordning.
 *
 * @param container - Rotelement att söka i.
 * @returns Array av tabbable `HTMLElement`, i DOM-ordning. Tom om inga hittas.
 */
export function findTabbableElements(container: HTMLElement): HTMLElement[] {
  const candidates = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  return Array.from(candidates).filter(isTabbable);
}
