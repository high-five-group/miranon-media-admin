import { cn } from '@/lib/cn';

export interface RaknarChipProps {
  /** Antalet som visas i chippet — ett icke-negativt heltal. */
  antal: number;
  /**
   * Extra klasser, merge:as in efter grundformen (tailwind-merge).
   * Positionering och siffer-reserverad bredd är konsumentens val — se
   * komponentens docblock för de två etablerade formerna.
   */
  className?: string;
}

/**
 * RaknarChip — den delade räknar-chip-formen (TASK-393, ADR-126 B1/B3).
 *
 * KÄRNAN, INTE HELA FORMEN (ADR-126 B3): denna primitiv bär bara den
 * VISUELLA identiteten — rund pill, accentfärg, mikrotypografi. Positionering
 * äger varje konsument själv via `className`, eftersom de två etablerade
 * konsumenterna vill helt olika saker med den:
 *
 * - **`FilterRad`** (ursprunget — flytt UTAN ombyggnad, ADR-126 B4, samma
 *   klasser byte för byte): badgen sitter `absolute -top-1 -right-1`,
 *   perchad på tratt-knappens hörn, och räknar aktiva filterval (sällan mer
 *   än en handfull — alltid en siffra i praktiken).
 * - **Förhandsgranska-knappen** (`BetalningsInkorg.tsx`, TASK-393 — den
 *   ANDRA konsumenten `FilterRad`s tidigare docblock förutspådde): chippet
 *   sitter INLINE bredvid knappens text, `relative -top-1` för samma
 *   "upphöjda" känsla som hörn-badgen (Marcus fynd: *"vi har redan en form
 *   för det på exempelvis filterknappen"*), och `min-w-6` reserverar plats
 *   för TVÅ siffror (kön har ett tak på 30, `TASK-370.1`) så knappens bredd
 *   inte hoppar mellan N = 1 och N = 12/30. `min-width` i stället för ett
 *   fast `width` är avsiktligt: understiger innehållet golvet (alltid sant
 *   för 1–2 siffror vid denna storlek) blir bredden IDENTISK oavsett
 *   siffervalet, medan en sällsynt takoverskridande 3-siffra (kön KAN
 *   spänna över fler än 30 utan att registreringen hindrats, se
 *   `!enSamKo`-knappens docblock i `BetalningsInkorg.tsx`) växer graciöst i
 *   stället för att klippas.
 *
 * `text-[10px]`: ÖPPET BOKFÖRD avvikelse från typografiskalan (spec-regeln
 * no-hardcoded-font-size), ärvd från `FilterRad`s ursprungliga chip — skalan
 * saknar ett steg under `text-caption`. Avvikelsen är INTE stängd av denna
 * flytt (inget nytt skalsteg mintades) — den är nu DELAD mellan två
 * konsumenter i stället för att leva dolt i en enda fil.
 *
 * Alltid `aria-hidden` — det tillgängliga namnet bärs av konsumentens egen
 * `aria-label`/sr-only-text, aldrig av chippets siffra själv (samma delning
 * `FilterRad` redan hade före lyftet).
 */
export function RaknarChip({ antal, className }: RaknarChipProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-medium text-[10px] text-text-inverse',
        className,
      )}
    >
      {antal}
    </span>
  );
}
