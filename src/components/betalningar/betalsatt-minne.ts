import type { VALBARA_BETALSATT } from '@/domain/schemas';

export type Betalsatt = (typeof VALBARA_BETALSATT)[number];

/**
 * [TASK-346.7, PRD berättelse 6] Minnet av SENAST ANVÄNDA betalsätt - delat
 * av varje yta som bär registreringsformuläret.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR MODULEN FLYTTADES HIT UR `BetalningsInkorg.tsx`
 * ═══════════════════════════════════════════════════════════════════════════
 * TASK-346.6 lade nyckeln och de två funktionerna privat i inkorgen, vilket
 * var rätt när inkorgen var den enda ytan. TASK-346.7 ger samma formulär FYRA
 * ingångar till (Hem, Åtgärds-panelen, anmälans detaljvy, personkortet), och
 * PRD berättelse 6 lovar Lotta att betalsättet är "förvalt till det jag
 * använde senast" - inte "senast PÅ DEN HÄR SIDAN".
 *
 * Hade varje yta burit sin egen kopia av nyckeln hade löftet gått sönder på
 * det tystaste sättet som finns: Lotta väljer Bankgiro i inkorgen, går till
 * personkortet, och möter Swish igen utan ett ord om varför.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * KASTAR ALDRIG
 * ═══════════════════════════════════════════════════════════════════════════
 * `localStorage` kan kasta redan vid ÅTKOMST i privat läge och i webbläsare
 * som blockerar lagring. Detta är en bekvämlighet, aldrig data: faller
 * läsningen används standardvärdet, och faller skrivningen tappas bara
 * minnet - aldrig en inbetalning.
 */

const BETALSATT_NYCKEL = 'mm.betalningar.senasteBetalsatt';

/** Läser senast använda betalsätt. Kastar aldrig - privat läge blockerar. */
export function lasSenasteBetalsatt(): Betalsatt {
  try {
    const sparat = window.localStorage.getItem(BETALSATT_NYCKEL);
    if (sparat === 'Swish' || sparat === 'Bankgiro' || sparat === 'Plusgiro') return sparat;
  } catch {
    // Privat läge, blockerade cookies, eller en webbläsare som kastar på
    // access. Standardvärdet duger; detta är en bekvämlighet, inte data.
  }
  return 'Swish';
}

export function sparaBetalsatt(varde: Betalsatt): void {
  try {
    window.localStorage.setItem(BETALSATT_NYCKEL, varde);
  } catch {
    // Se ovan.
  }
}
