import { CircleCheck, TriangleAlert } from 'lucide-react';

/**
 * [BIBLIOTEKS-KANDIDAT] StatusBadge — tonal tillstånds-pill (task-18.17
 * byggkrav 3/5; Polaris-idiomet): ikon + ord i en tonal kapsel. EN form för
 * alla tillstånds-utsagor på anmälningssidan (statusraden i headern +
 * behörigheten i Avser) — texten bär ALLTID, tonen förstärker (WCAG 1.4.1:
 * färg/ikon aldrig ensam bärare). Nyskriven mot facit (throwaway-kontraktet
 * — prototypkod absorberas aldrig); promoveras till primitives/ vid andra
 * konsumenten (rule of three-disciplinen, registration-display-precedent).
 *
 * A11y (11): ikonen är aria-hidden (dekorativ förstärkning — bock=klart,
 * triangel=uppmärksamhet); det tillgängliga namnet är exakt badge-texten.
 * Tonala bakgrunder via semantiska tokens (bg-success-bg/bg-warning-bg);
 * texten står i default-textfärgen (AA mot 100-tonerna). prefers-contrast:
 * more får en synlig kant i ikonens ton (tonal platta ensam tunnas annars ut).
 */
export function StatusBadge({ ton, children }: { ton: 'success' | 'warning'; children: string }) {
  const Ikon = ton === 'success' ? CircleCheck : TriangleAlert;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1 font-medium text-small ${
        ton === 'success'
          ? 'bg-success-bg contrast-more:border-success'
          : 'bg-warning-bg contrast-more:border-warning'
      }`}
    >
      <Ikon
        aria-hidden="true"
        size={15}
        className={`shrink-0 ${ton === 'success' ? 'text-success' : 'text-warning'}`}
      />
      {children}
    </span>
  );
}
