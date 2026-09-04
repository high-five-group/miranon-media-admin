/**
 * [TASK-346.6] Realtime-kanalens nedstängningsvakt - ordningsinvarianten
 * gjord TESTBAR.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VAD DEN FINNS FÖR
 * ═══════════════════════════════════════════════════════════════════════════
 * `jobbRealtime.ts` bar sedan TASK-346.4:s granskningsrunda 2 en lokal
 * `let avsiktligNedstangning = false` plus kommentaren "ORDNINGEN ÄR
 * LASTBÄRANDE: flaggan FÖRE nedrivningen. Sätts den efteråt hinner
 * close-eventet fram först, och varningen fyrar ändå."
 *
 * Kommentaren var korrekt och helt oskyddad. Granskningen av PR #2150
 * bokförde det som ett eget fynd: invarianten är lastbärande UTAN testskydd.
 * Den kunde inte testas där den låg, eftersom modulen importerar
 * supabase-klienten vid inläsning och därmed kräver en webbläsarmiljö och
 * riktiga env-värden.
 *
 * Vakten flyttar tillståndet till en modul UTAN EN ENDA IMPORT. Därmed kan
 * `tests/api/nedstangningsvakt.test.ts` köra den rakt i Node - samma klass som
 * `_shared/betalningsbelopp.ts` redan tillhör.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ORDNINGEN ÄR INBYGGD, INTE IHÅGKOMMEN
 * ═══════════════════════════════════════════════════════════════════════════
 * `stangNer()` nedan tar vakten OCH nedrivningen och utför dem i rätt
 * ordning. Det är hela poängen: en anropare kan inte längre skriva dem i fel
 * ordning av misstag, eftersom det bara finns ett anrop att skriva. Den
 * gamla formen krävde att varje framtida läsare mindes kommentaren.
 */

/**
 * Status-värdena som BETYDER att prenumerationen inte är aktiv.
 *
 * `CLOSED` ingår, och det är avsiktligt: en kanal som stängs UTAN att någon
 * bett om det (servern kopplar ner, tokenet går ut) är ett verkligt fel Lotta
 * bör kunna få veta om. Vakten skiljer det fallet från den avsiktliga
 * nedstängningen; status-värdet ensamt kan inte göra det, och ett villkor som
 * bara läser `status` fyrar vid VARJE avmontering - alltså vid varje
 * navigering, och i dev redan vid appstart eftersom StrictMode monterar
 * effekten en extra gång.
 */
export const REALTIME_FELSTATUS: readonly string[] = ['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'];

export type Nedstangningsvakt = {
  /**
   * Markerar nedstängningen som AVSIKTLIG. Anropas av `stangNer` FÖRE
   * nedrivningen - aldrig direkt av en anropare.
   */
  stang(): void;
  /**
   * Är detta status-värde ett fel någon kan åtgärda? Falskt för allt som
   * kommer efter `stang()`, och det är avsiktligt bredare än enbart
   * `CLOSED`: också ett `CHANNEL_ERROR` som råkar landa mitt i nedrivningen
   * är ett eko av nedstängningen, inte ett fel någon kan göra något åt.
   */
  arFel(status: string): boolean;
};

export function skapaNedstangningsvakt(): Nedstangningsvakt {
  let avsiktlig = false;
  return {
    stang() {
      avsiktlig = true;
    },
    arFel(status: string) {
      if (avsiktlig) return false;
      return REALTIME_FELSTATUS.includes(status);
    },
  };
}

/**
 * Stänger ner i RÄTT ORDNING: flaggan först, nedrivningen sedan.
 *
 * Vänds ordningen hinner phoenix `leave()`-ekot fram till status-callbacken
 * innan flaggan är satt, och varningen fyrar trots att nedstängningen var
 * avsiktlig. `tests/api/nedstangningsvakt.test.ts` bevisar båda riktningarna:
 * denna ordning tystar ekot, och den omvända gör det inte.
 */
export function stangNer(vakt: Nedstangningsvakt, riv: () => void): void {
  vakt.stang();
  riv();
}
