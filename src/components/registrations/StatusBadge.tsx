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
/**
 * Pill-skalans TVÅ steg (S93 våg 16; Marcus 2026-08-06: "alla pills [ska] hålla
 * en konsekvent utseendemönster i de olika miljöerna").
 *
 * Stegen är INTE uppfunna här — de är HÄRLEDDA ur en inventering av appens
 * samtliga pillar (23 status-/metadata-förekomster, `rounded-full` + padding,
 * grep över src/ 2026-08-06). Skalan fanns redan de facto; den saknade bara
 * namn, och därför drev den:
 *
 *   `sm`  px-2   py-0.5  text-caption  — 13 förekomster. LIST- och KORT-miljö:
 *         metadata bredvid ett namn i en lista. (Deltagare 1017/1040/1259,
 *         Gruppdynamik 112, PersonsList 144, PersonDetail 113, hållplats-
 *         märket 71, Betalningars egna två …)
 *   `md`  px-2.5 py-1    text-small    — 7 förekomster. DETALJSIDA/HEADER:
 *         sidans status-utsaga. (AnmalanDetail 329/343, EventDetail 255,
 *         Deltagare 1779/1880, deadline-pillen …)
 *
 * `md` är default — det var StatusBadges enda form före denna prop, och
 * anmälnings-detaljsidan (facit-låst 2026-07-24 "Lås den") får därmed exakt
 * samma rendering som förut.
 *
 * TREDJE REGELN, lika viktig som padding och textgrad: varje pill bär
 * `border border-transparent`. Kanten ritas aldrig i normalläge, men den
 * reserverar sin px så att `contrast-more:border-*` kan tändas UTAN att
 * layouten hoppar — och så att en pill med kant och en utan får IDENTISK
 * ytterhöjd. Utan regeln mättes StatusBadge till 24 px bredvid två
 * kantlösa pillar på 22 (S93 våg 16, samma kort). Två pixel, och de syns.
 *
 * VARFÖR PROPPEN BEHÖVDES: badgen skrevs för detaljsidans header och användes
 * sedan i betalningsvyns LISTA, bredvid pillar i `sm`. Marcus såg det direkt —
 * "Obekräftad är störst och har fetstilt … den passar inte lika bra i denna
 * miljö". Rätt svar är inte att krympa badgen överallt, utan att låta miljön
 * välja steg.
 */
const PILL_STORLEK = {
  sm: { kapsel: 'px-2 py-0.5 text-caption', ikon: 13 },
  md: { kapsel: 'px-2.5 py-1 text-small', ikon: 15 },
} as const;

export function StatusBadge({
  ton,
  storlek = 'md',
  children,
}: {
  ton: 'success' | 'warning';
  /** Pill-skalans steg — se PILL_STORLEK. `md` (default) = detaljsida/header;
      `sm` = list-/kortmiljö. */
  storlek?: keyof typeof PILL_STORLEK;
  children: string;
}) {
  const Ikon = ton === 'success' ? CircleCheck : TriangleAlert;
  const skala = PILL_STORLEK[storlek];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-transparent font-medium ${skala.kapsel} ${
        ton === 'success'
          ? 'bg-success-bg contrast-more:border-success'
          : 'bg-warning-bg contrast-more:border-warning'
      }`}
    >
      <Ikon
        aria-hidden="true"
        size={skala.ikon}
        className={`shrink-0 ${ton === 'success' ? 'text-success' : 'text-warning'}`}
      />
      {children}
    </span>
  );
}
