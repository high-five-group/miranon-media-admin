import { Pencil } from 'lucide-react';
import type { ReactNode, Ref } from 'react';

/**
 * Eventsidans grupp-grammatik (task-18.1; S73-facit K3/K6): grupprubriken står
 * UTANFÖR den tonala kortytan (FK/IMG_1542-formen: "Adress"/"Kontakt" ovanför
 * sina kort); kortet bär radlistan med divide-y-avdelare. Rubriken är indragen
 * till kortens inner-inset (px-4 — "där rundningen slutar").
 *
 * Nyskriven mot facit-bilagan (throwaway-kontraktet — prototypkod absorberas
 * aldrig); delas av eventsidans samtliga grupper (18.2–18.11 bygger sina
 * sektioner i samma skal).
 */
export function DetaljGrupp({
  id,
  rubrik,
  children,
}: {
  /** aria-labelledby-id för sektionen (konvention: `grupp-<slug>`). */
  id: string;
  rubrik: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-2">
      <h2 id={id} className="px-4 font-semibold text-lg">
        {rubrik}
      </h2>
      <div
        data-testid="grupp-kort"
        className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong"
      >
        {children}
      </div>
    </section>
  );
}

/**
 * Etikett-värde-rad (S73-facit K6-viktningen: etiketten dämpad, VÄRDET primärt —
 * data-display-konventionen för läsytor). Hoppar tomma värden (renderar inte null).
 * Geometrin är morf-paritetens visningssida: py-3 + 24 px textrad = 48 px,
 * exakt lika med RedigeringsRad (py-2 + 32 px fält). Ändra ALDRIG ena sidan utan
 * den andra — Δ=0 px är DOM-mätt i e2e (AC #3).
 *
 * `streck` (task-18.2; K16/K61): vertikal kategorimarkör vänster om etiketten —
 * kalendervyns streck-form (en markör-grammatik i familjen). Dekorativ
 * (aria-hidden): siffran i raden är bäraren, färg aldrig ensam. Strecket är
 * self-stretch inom radens oförändrade py — geometrin (48 px) rörs inte.
 */
export function EtikettVardeRad({
  term,
  streck,
  children,
}: {
  term: string;
  /** Kategorimarkörens bg-klass (t.ex. beläggningens KATEGORI-färger). */
  streck?: string;
  children: ReactNode;
}) {
  if (children == null || children === '') return null;
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="flex items-center gap-2 text-small text-text-muted">
        {streck && (
          <span aria-hidden="true" className={`w-1 shrink-0 self-stretch rounded-full ${streck}`} />
        )}
        {term}
      </dt>
      <dd className="text-right text-body">{children}</dd>
    </div>
  );
}

/**
 * Redigeringsrad med EXAKT visningsradens geometri (S73-facit K12): py-2 +
 * 32 px fält (min-h-8) = py-3 + 24 px textrad = 48 px. Etiketten står kvar på
 * samma plats (samma klasser som EtikettVardeRad:s dt); värde-slotten byter
 * text → fält i samma låda (den geometri-bevarade inline-morfen).
 *
 * "Ändrar från"-mönstret (K13): nuvarande värdet synligt DÄMPAT vänster om
 * fältet genom hela ändringen. Likbredds-regeln (K13): alla fält i samma
 * formulär delar exakt slot-bredd — regeln är per-FORMULÄR (K15): Om eventets
 * fyra fält delar w-60 (default), Beläggningens antal-fält delar w-32
 * (fältbredd speglar förväntat svar, GOV.UK-formregeln) via `slotKlass`.
 * `streck` (task-18.2): samma kategorimarkör som visningsradens (morf-pariteten).
 */
export function RedigeringsRad({
  term,
  streck,
  nuvarande,
  slotKlass = 'w-60',
  children,
}: {
  term: string;
  /** Kategorimarkörens bg-klass — samma som visningsradens (morf-paritet). */
  streck?: string;
  /** Nuvarande värde, visas dämpat ("ändrar från"); null/tomt → "–". */
  nuvarande?: string | null;
  /** Slot-breddklass — likbredd per FORMULÄR (K15); default Om eventets w-60. */
  slotKlass?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <dt className="flex shrink-0 items-center gap-2 text-small text-text-muted">
        {streck && (
          <span aria-hidden="true" className={`w-1 shrink-0 self-stretch rounded-full ${streck}`} />
        )}
        {term}
      </dt>
      <dd className="flex min-w-0 flex-1 items-center justify-end gap-3">
        <span data-testid="nuvarande-varde" className="truncate text-small text-text-secondary">
          {nuvarande || '–'}
        </span>
        <div data-testid="falt-slot" className={`${slotKlass} shrink-0`}>
          {children}
        </div>
      </dd>
    </div>
  );
}

/**
 * Ändra-raden i kortbotten (S73-facit K6; FK:s "Ändra"-rad): penn-ikon + Ändra
 * centrerad. Per-sektion-redigering är branschmönstret på detaljsidor.
 * Geometri: py-3 + 24 px innehåll = 48 px — ersätts av Spara/Avbryt-raden
 * (py-2 + 32 px-knappar) på SAMMA plats och höjd i morfen.
 */
export function AndraRad({
  onPress,
  buttonRef,
}: {
  onPress: () => void;
  /** Fokus-retur-mål när morfen stängs (Avbryt/Spara) — tangentbordskontinuitet. */
  buttonRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <div className="py-3">
      <button
        ref={buttonRef}
        type="button"
        onClick={onPress}
        className="flex w-full items-center justify-center gap-2 font-medium text-body"
      >
        <Pencil aria-hidden="true" size={16} />
        Ändra
      </button>
    </div>
  );
}
