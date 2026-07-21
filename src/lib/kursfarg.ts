// Kursfärgs-mappningen (task-17.3, prefaktorering) — skarp mappning kurs →
// semantisk token som ersätter prototypens namn-matchning (throwaway-
// kontraktet: nyskriven, absorberar ingen prototypkod).
//
// Taxonomin är ADR-064:s: kurs-axelns värden är basens `Event (source)`-
// singleSelect (teckenexakt — samma JOIN-nyckel-klass som segment-taxonomins
// Kursnamn-lookup; data-model §eventkey-formlerna). Färgerna är S72-facitets
// legend (K11/K12, solida 500-kulörer): Fjärrskådning=blå · RIM 1=grön ·
// RIM 2=koppar · RIM 3=röd · Annat=grå. Riktvärdet ≤5–7 färger med Annat som
// uppsamling — Psionautics, nakna "Resor i medvetandet" (fälla 35), null och
// FRAMTIDA kurser landar i Annat utan kod-ändring; en ny kurs får egen färg
// först genom ett nytt designbeslut (post + token), aldrig implicit.
//
// Tokensen bor i semantiska lagret (src/styles/tokens/semantic.css);
// Tailwind-literalerna bor HÄR (kompletta klass-strängar — JIT:s statiska
// scanning kräver literaler i källan). Vyer konsumerar via ETT uppslag
// (`kursfargForKurs`) — ingen namn-matchning i vyer. Spec: DESIGN-SYSTEM-SPEC
// §17. Belagda konsumenter: kalendervyn (task-17.4) + Gruppdynamik
// (task-18.10).

/** Kursfärgs-klasserna — de fem legend-posterna (S72-facit). */
export type KursfargKlass = 'fjarrskadning' | 'rim1' | 'rim2' | 'rim3' | 'annat';

export interface Kursfarg {
  klass: KursfargKlass;
  /** Legendens korta etikett (K13-copyn: "RIM 1", inte basens långnamn). */
  etikett: string;
  /** Den semantiska tokenen (custom property-namn) — för var()-/mätbruk. */
  token: string;
  /** Solid fyllnad (dag-plattor, legend-prickar, historik-streck). */
  bgClass: string;
}

/** Kursfärgerna i legendens ordning (S72-facit: Fjärrskådning → RIM 1 →
    RIM 2 → RIM 3 → Annat). */
export const KURSFARGER: readonly Kursfarg[] = [
  {
    klass: 'fjarrskadning',
    etikett: 'Fjärrskådning',
    token: '--mm-kurs-fjarrskadning',
    bgClass: 'bg-(--mm-kurs-fjarrskadning)',
  },
  { klass: 'rim1', etikett: 'RIM 1', token: '--mm-kurs-rim1', bgClass: 'bg-(--mm-kurs-rim1)' },
  { klass: 'rim2', etikett: 'RIM 2', token: '--mm-kurs-rim2', bgClass: 'bg-(--mm-kurs-rim2)' },
  { klass: 'rim3', etikett: 'RIM 3', token: '--mm-kurs-rim3', bgClass: 'bg-(--mm-kurs-rim3)' },
  { klass: 'annat', etikett: 'Annat', token: '--mm-kurs-annat', bgClass: 'bg-(--mm-kurs-annat)' },
];

const PER_KLASS: Record<KursfargKlass, Kursfarg> = Object.fromEntries(
  KURSFARGER.map((f) => [f.klass, f]),
) as Record<KursfargKlass, Kursfarg>;

/** Basens exakta kursnamn → klass. Nycklarna är `Event (source)`-värdena
    tecken för tecken (disk-verifierade mot data-model.md §insiktskedjan:
    `Kursnamn="Resor i medvetandet 1"` osv.) — ALDRIG visningsnamn eller
    regex. Allt omappat är Annat (uppsamlingen). */
const KURS_TILL_KLASS: Readonly<Record<string, KursfargKlass>> = {
  Fjärrskådning: 'fjarrskadning',
  'Resor i medvetandet 1': 'rim1',
  'Resor i medvetandet 2': 'rim2',
  'Resor i medvetandet 3': 'rim3',
};

/**
 * ETT uppslag: kurs (basens kursnamn, t.ex. `Event.eventNamn` eller
 * Deltagandens Kursnamn-lookup) → kursfärg. Okänd/saknad kurs → Annat.
 */
export function kursfargForKurs(kurs: string | null | undefined): Kursfarg {
  return PER_KLASS[(kurs != null && KURS_TILL_KLASS[kurs]) || 'annat'];
}
