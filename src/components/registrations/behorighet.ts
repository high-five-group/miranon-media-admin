import type { PersonHistoryEntry } from '@/domain/schemas';
import { arGenomford } from '@/lib/genomford';

/**
 * RIM-behörigheten (task-18.17 byggkrav 5; S83-facit, Marcus-låst):
 * HÄRLEDD ur verifierat deltagande — självrapporten ("har du gått steg 1?")
 * renderas ALDRIG och deltar inte i härledningen. Visas ENDAST för RIM-event
 * med förkunskapskrav (steg 2+); RIM 1/Fjärrskådning/övriga har inget krav
 * och får ingen behörighetsrad.
 *
 * Kursnamns-nycklarna är TECKENEXAKTA mot basens `Event (source)`-värden —
 * kursfärgs-mappningens disciplin (src/lib/kursfarg.ts): aldrig regex eller
 * visningsnamn. Basens kända case-dubletter ("Resor i Medvetandet 2", fälla
 * 24/T16) är MEDVETET omappade — en anmälan mot dublett-namnet får ingen
 * behörighetsrad i stället för en gissad; luckan visas som den är, designas
 * aldrig bort (kortets RÅ-disciplin).
 */

/** Event-kursnamn → RIM-steget som KRÄVER föregående steg verifierat. */
const RIM_STEG: Readonly<Record<string, 2 | 3>> = {
  'Resor i medvetandet 2': 2,
  'Resor i medvetandet 3': 3,
};

/** Föregående stegs teckenexakta kursnamn (verifierings-målet). */
const KRAV_KURS: Readonly<Record<2 | 3, string>> = {
  2: 'Resor i medvetandet 1',
  3: 'Resor i medvetandet 2',
};

const MANAD_AR = new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric' });

export type Behorighet = {
  lage: 'godkand' | 'ej-verifierad';
  /** Badge-texten ("Godkänd för RIM 2" / "Ej verifierad för RIM 2"). */
  krav: string;
  /** Grund-raden — alltid länkad till personkortet (byggkrav 5). */
  grund: string;
} | null;

/**
 * Härled behörigheten ur eventets kursnamn + personens kurshistorik
 * (PersonHistoryEntry-raderna ur läs-shapen). Verifierat = GENOMFÖRD kurs
 * via det DELADE predikatet `arGenomford` (src/lib/genomford.ts — basens
 * `Genomfört event`-formel; samma definition som Gruppdynamik, aldrig en
 * kopia). `kurshistorik` null (ingen person-koppling) ⇒ inget deltagande
 * registrerat — ej-verifierad är den ärliga utsagan.
 */
export function harledBehorighet(
  eventNamn: string | null,
  kurshistorik: readonly PersonHistoryEntry[] | null | undefined,
): Behorighet {
  const steg = eventNamn != null ? RIM_STEG[eventNamn] : undefined;
  if (steg === undefined) return null;

  const kravKurs = KRAV_KURS[steg];
  const verifierad = (kurshistorik ?? []).find((h) => h.kursnamn === kravKurs && arGenomford(h));

  if (verifierad) {
    const nar = verifierad.datum != null ? new Date(verifierad.datum) : null;
    const manadAr = nar != null && !Number.isNaN(nar.getTime()) ? MANAD_AR.format(nar) : null;
    return {
      lage: 'godkand',
      krav: `Godkänd för RIM ${steg}`,
      grund: `RIM ${steg - 1} verifierad via deltagande${manadAr ? ` (${manadAr})` : ''}`,
    };
  }
  return {
    lage: 'ej-verifierad',
    krav: `Ej verifierad för RIM ${steg}`,
    grund: `Inget deltagande för RIM ${steg - 1} registrerat`,
  };
}
