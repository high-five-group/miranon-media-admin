import { useId, useState } from 'react';

/**
 * Klipp-tröskeln (tecken). Deterministisk teckengräns i stället för mätt
 * radhöjd: klippet ska vara stabilt över viewport-bredder (samma text ger
 * alltid samma affordans) och line-clamp-3 bär den visuella formen.
 */
const LANG_TEXT = 180;

/**
 * [BIBLIOTEKS-KANDIDAT] FritextRad — fullbredds-fritextblock för långa svar
 * (task-18.17 byggkrav 8; motiveringar/frågor): mikro-etikett + VÄNSTERSTÄLLD
 * läsbar text med läs mer-klipp — fritext hör INTE hemma i högerställda
 * key-value-rader (EtikettVardeRad är fel form för löptext). Nyskriven mot
 * facit (throwaway-kontraktet); promoveras till primitives/ vid andra
 * konsumenten.
 *
 * A11y (11): klipp-knappen bär aria-expanded + aria-controls mot text-
 * stycket (AT-golvet, byggkrav 13) och ett KONTEXT-bärande tillgängligt namn
 * ("Läs mer: Motivering" — review-fynd F3: två identiska "Läs mer" på samma
 * sida är odistingerbara för skärmläsare; Gruppdynamik-precedenten). Kort
 * text får INGEN knapp (en affordans utan effekt vore brus). Klippet är
 * line-clamp (visuellt) — texten finns alltid i DOM:en, så skärmläsare läser
 * hela oavsett läge.
 */
export function FritextRad({ etikett, text }: { etikett: string; text: string }) {
  const [oppen, setOppen] = useState(false);
  const textId = useId();
  const lang = text.length > LANG_TEXT;
  return (
    <div className="flex flex-col gap-1.5 py-3">
      <span className="text-caption text-text-muted">{etikett}</span>
      <p
        id={textId}
        className={`my-0 text-body leading-relaxed ${oppen || !lang ? '' : 'line-clamp-3'}`}
      >
        {text}
      </p>
      {lang ? (
        <button
          type="button"
          aria-expanded={oppen}
          aria-controls={textId}
          aria-label={`${oppen ? 'Visa mindre' : 'Läs mer'}: ${etikett}`}
          onClick={() => setOppen((o) => !o)}
          className="self-start font-medium text-small text-text-secondary underline underline-offset-2 hover:text-text"
        >
          {oppen ? 'Visa mindre' : 'Läs mer'}
        </button>
      ) : null}
    </div>
  );
}
