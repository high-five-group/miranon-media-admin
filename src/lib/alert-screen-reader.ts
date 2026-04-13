/**
 * alertScreenReader — Global utility för skärmläsarmeddelanden.
 *
 * Skapar (eller återanvänder) en visuellt dold `<div aria-live>`
 * utanför komponentträdet. Vilken kod som helst kan trigga
 * meddelanden utan att en komponent behöver finnas i DOM.
 *
 * Portat från FK Designsystems alertScreenReader med minimal
 * anpassning (timer-hantering för snabba anrop).
 *
 * @example
 * ```ts
 * alertScreenReader("3 resultat hittades")
 * alertScreenReader("Fel vid sparande", { assertive: true })
 * ```
 *
 * @module
 */

// ---------------------------------------------------------------------------
// Typer
// ---------------------------------------------------------------------------

/** Options för `alertScreenReader`. */
export interface AlertScreenReaderOptions {
  /**
   * Om `true`, använder `aria-live="assertive"` (avbryter pågående tal).
   * Om `false` (default), använder `aria-live="polite"`.
   */
  assertive?: boolean;
}

// ---------------------------------------------------------------------------
// Konstanter
// ---------------------------------------------------------------------------

/** Tid (ms) innan meddelandet appendas — ger skärmläsaren tid att registrera regionen. */
const APPEND_DELAY = 100;

/** Tid (ms) innan meddelandet tas bort efter append. */
const REMOVE_DELAY = 1000;

/** Data-attribut för att identifiera vår globala wrapper. */
const WRAPPER_ATTR = 'data-mm-announcer';

// ---------------------------------------------------------------------------
// Intern state
// ---------------------------------------------------------------------------

let wrapper: HTMLDivElement | null = null;
let appendTimer: ReturnType<typeof setTimeout> | null = null;
let removeTimer: ReturnType<typeof setTimeout> | null = null;

// ---------------------------------------------------------------------------
// Intern logik
// ---------------------------------------------------------------------------

/**
 * Hämtar eller skapar den globala aria-live-wrappern.
 * Visuellt dold men tillgänglig för AT.
 */
function getWrapper(): HTMLDivElement {
  if (wrapper && document.documentElement.contains(wrapper)) {
    return wrapper;
  }

  wrapper = document.createElement('div');
  wrapper.setAttribute(WRAPPER_ATTR, '');
  wrapper.setAttribute('aria-live', 'polite');
  wrapper.setAttribute('aria-atomic', 'true');

  // Visuellt dold — SR-only
  Object.assign(wrapper.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  });

  document.body.appendChild(wrapper);
  return wrapper;
}

/** Rensar alla barn från wrappern. */
function clearWrapper(target: HTMLDivElement): void {
  while (target.firstChild) {
    target.firstChild.remove();
  }
}

/** Rensar alla aktiva timers. */
function clearTimers(): void {
  if (appendTimer !== null) {
    clearTimeout(appendTimer);
    appendTimer = null;
  }
  if (removeTimer !== null) {
    clearTimeout(removeTimer);
    removeTimer = null;
  }
}

// ---------------------------------------------------------------------------
// Publikt API
// ---------------------------------------------------------------------------

/**
 * Meddelar skärmläsaren med en text.
 *
 * @param text - Texten att läsa upp. Tom sträng ignoreras.
 * @param options - `assertive` (default: `false`).
 */
export function alertScreenReader(text: string, options: AlertScreenReaderOptions = {}): void {
  if (typeof document === 'undefined') return;

  if (!text || typeof text !== 'string' || text.trim() === '') {
    if (import.meta.env.DEV) {
      console.warn('[alertScreenReader] Anropades med tom eller ogiltig text. Ignorerar.');
    }
    return;
  }

  const { assertive = false } = options;
  const target = getWrapper();

  // Uppdatera aria-live baserat på options
  target.setAttribute('aria-live', assertive ? 'assertive' : 'polite');

  // Rensa föregående meddelanden och timers vid snabba anrop
  clearTimers();
  clearWrapper(target);

  const msg = document.createElement('p');
  msg.textContent = text;

  // Fördröj append — skärmläsaren behöver tid att registrera regionen
  appendTimer = setTimeout(() => {
    clearWrapper(target);
    target.appendChild(msg);

    removeTimer = setTimeout(() => {
      if (msg.parentElement === target) {
        msg.remove();
      }
    }, REMOVE_DELAY);
  }, APPEND_DELAY);
}

/**
 * Tar bort den globala announcer-noden från DOM.
 * **Enbart för test/cleanup.**
 *
 * @internal
 */
export function destroyAnnouncer(): void {
  clearTimers();

  if (wrapper?.parentElement) {
    wrapper.parentElement.removeChild(wrapper);
  }
  wrapper = null;
}
