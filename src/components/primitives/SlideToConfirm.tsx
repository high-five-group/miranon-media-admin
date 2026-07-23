import { Check } from 'lucide-react';
import {
  type KeyboardEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type Ref,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/cn';

// Cirkelns diameter = rännans höjd (h-12/size-12) — cirkeln täcker EXAKT
// hela rännan, ingen inset (K78-formen).
const HANDTAG_PX = 48;

// Släpp-trösklarna (K77-konvergensen): ≥90 % armerar, ≤10 % avarmerar,
// däremellan fjädrar cirkeln tillbaka till nuvarande läge.
const ARMERA_VID = 0.9;
const AVARMERA_VID = 0.1;

/**
 * Diskret pling vid armering (K78: "ett pling och grön bock") — kort
 * tvåtons-chime via Web Audio, ingen ljud-asset. Preferens-respekt
 * (11-ribban, PRD TASK-19 användarberättelse 11): under
 * `prefers-reduced-motion: reduce` spelas inget — det är OS-nivåns enda
 * exponerade lugn-signal, och plinget är feedback-förstärkning av samma
 * klass som fjäder-animationen. Ljud är förstärkning, aldrig bärare —
 * tystnad är ok (autoplay-policy m.m. sväljs av try/catch).
 */
function pling() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.4);
    oscillator.onended = () => ctx.close();
  } catch {
    // Tystnad är ok — plinget får aldrig fälla interaktionen.
  }
}

export interface SlideToConfirmProps {
  /** Switchens tillgängliga namn — visas aldrig visuellt (instruktions-texten är aria-hidden). */
  label: string;
  /** Instruktionstext i oarmerat läge (tonar ut under draget). */
  prompt: ReactNode;
  /** Text i armerat läge (renderas bredvid bocken). */
  confirmedLabel: ReactNode;
  /** Armerat läge (controlled). */
  isSelected?: boolean;
  /** Först armerat läge (uncontrolled). */
  defaultSelected?: boolean;
  /** Anropas ENDAST när värdet faktiskt ändras. */
  onChange?: (isSelected: boolean) => void;
  /**
   * Diskret pling vid armering (default på). Konsument-preferensens säte:
   * en framtida app-bred ljudinställning stänger av här;
   * `prefers-reduced-motion` respekteras alltid oavsett värde.
   */
  sound?: boolean;
  /** Extra klasser som merge:as in efter formklasserna (tailwind-merge). */
  className?: string;
  /** Ref till switchens <div role="switch"> (React 19-stil). */
  ref?: Ref<HTMLDivElement>;
}

/**
 * SlideToConfirm — dra-till-bekräfta-primitiv för tunga, avsiktliga
 * handlingar (S73-facit-utökningen K77–K84; DESIGN-SYSTEM-SPEC §18;
 * Resend Broadcasts-klassen: DRAGET är bekräftelsen — ett råkat klick
 * kan aldrig armera). Facit-källa: bilagan
 * `tasks/sessions/bilagor/s73-eventsida-konvergens/`
 * (FACIT-skapa-sidan.png + FACIT-skapa-handtag-armad.png). Belagd
 * konsument: skapa-sidans publicerings-handtag (task-19.3/19.4).
 *
 * Draget är FÖRSTÄRKNING, aldrig enda vägen (11-ribban): switchen är
 * fokuserbar med `role="switch"` + `aria-checked`, och Space/Enter
 * togglar samma val — tillståndet oarmerat/armerat annonseras som
 * av/på av skärmläsare. Fokusring via base.css-globalen.
 *
 * Drag-vakterna (K79): draget startar ENDAST med primärknappen nedtryckt
 * OCH greppet PÅ cirkeln — klick på rännan teleporterar inte; grepp-
 * offseten bevaras så kant-grepp ger kant-följ (cirkeln hoppar aldrig
 * till pekaren); släpps knappen utan att pointerup nådde oss (fångst
 * misslyckad) avslutas draget i stället för att följa ren hovring.
 * Släpp-trösklarna 90/10: nå målet armerar, dra tillbaka avarmerar,
 * mitt emellan fjädrar (`motion-safe`-transition; reduced-motion
 * neutraliseras dessutom globalt). Drag-tillståndet är REF-buret —
 * pointermove hinner leverera flera events mellan renders och closure-
 * state vore förra renderns värde (L300).
 *
 * Armerat läge = bock i cirkeln + `confirmedLabel` — INGEN fyllnad:
 * rännan förblir tonad i alla lägen (K82-rivningen; armad-signalen bärs
 * av bocken och texten, aldrig av grön yta).
 *
 * **Förseglade beslut** (inte utelämnanden): byggd som APG-switch för
 * hand, INTE på react-aria-components `Switch` — RAC/Radix låter klick
 * på ytan toggla, vilket river avsikts-mekaniken (K79: "jag måste ju
 * klicka och hålla inne"); `@react-aria/interactions` `useMove` är inte
 * en beroende-yta i repot. Inget `isDisabled` (ingen belagd konsument —
 * över-engineering-vakten; växer additivt vid verkligt behov).
 *
 * Tokens: inga egna komponent-tokens — semantisk token-konsumtion via
 * Tailwind-mappningen (§16-precedenten). `prefers-contrast: more` och
 * print får synlig kontur via outline (layout-neutral — en border hade
 * flyttat cirkelns positioneringsbox och brutit ingen-inset-formen).
 *
 * @example
 * ```tsx
 * <SlideToConfirm
 *   label="Publicera på miranon.se"
 *   prompt="Dra för att publicera"
 *   confirmedLabel="Publiceras"
 *   isSelected={publicera}
 *   onChange={setPublicera}
 * />
 * ```
 */
export function SlideToConfirm({
  label,
  prompt,
  confirmedLabel,
  isSelected,
  defaultSelected,
  onChange,
  sound = true,
  className,
  ref,
}: SlideToConfirmProps) {
  const [internSelected, setInternSelected] = useState(defaultSelected ?? false);
  const selected = isSelected ?? internSelected;

  const handtagRef = useRef<HTMLSpanElement>(null);
  // Levande drag-tillstånd i refs (L300) — dragPos-state speglar enbart
  // för rendern.
  const dragRef = useRef<number | null>(null);
  const greppOffsetRef = useRef(0);
  const [dragPos, setDragPos] = useState<number | null>(null);
  const pos = dragPos ?? (selected ? 1 : 0);

  /** Pekarens läge → cirkelns position 0–1 längs rännan (grepp-offset-kompenserad). */
  const ratio = (clientX: number, ranna: HTMLDivElement): number => {
    const r = ranna.getBoundingClientRect();
    const banbredd = r.width - HANDTAG_PX;
    if (banbredd <= 0) return 0;
    return Math.min(
      1,
      Math.max(0, (clientX - greppOffsetRef.current - r.left - HANDTAG_PX / 2) / banbredd),
    );
  };

  const commit = (next: boolean) => {
    if (next === selected) return;
    if (next && sound) pling();
    if (isSelected === undefined) setInternSelected(next);
    onChange?.(next);
  };

  const slappDrag = (p: number | null) => {
    if (p != null) commit(p >= ARMERA_VID ? true : p <= AVARMERA_VID ? false : selected);
    dragRef.current = null;
    setDragPos(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      commit(!selected);
    }
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // K79-vakten: endast primärknapp, och greppet måste ligga PÅ cirkeln.
    if (!e.isPrimary || e.button !== 0) return;
    const h = handtagRef.current?.getBoundingClientRect();
    if (
      !h ||
      e.clientX < h.left ||
      e.clientX > h.right ||
      e.clientY < h.top ||
      e.clientY > h.bottom
    )
      return;
    greppOffsetRef.current = e.clientX - (h.left + h.width / 2);
    // Capture kan kasta NotFoundError om pekaren redan släppts (snabb
    // tap) — draget funkar ändå via move/up på elementet.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Avsiktligt tomt — se ovan.
    }
    dragRef.current = ratio(e.clientX, e.currentTarget);
    setDragPos(dragRef.current);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current == null) return;
    // K79-vakten: släpptes knappen utan att up nådde oss avslutas draget
    // — annars följer cirkeln ren hovring.
    if (e.buttons === 0) {
      slappDrag(dragRef.current);
      return;
    }
    dragRef.current = ratio(e.clientX, e.currentTarget);
    setDragPos(dragRef.current);
  };

  const avbrytDrag = () => {
    dragRef.current = null;
    setDragPos(null);
  };

  return (
    <div
      ref={ref}
      role="switch"
      aria-checked={selected}
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => slappDrag(dragRef.current)}
      onPointerCancel={avbrytDrag}
      className={cn(
        'relative h-12 w-full touch-none select-none rounded-full bg-bg-emphasized outline-border-strong contrast-more:outline print:outline',
        className,
      )}
    >
      {/* Instruktionstexten tonar ut med draget (K78); i armerat läge bär
          texten armad-signalen tillsammans med bocken (K82). */}
      <span
        aria-hidden="true"
        data-slot="text"
        style={selected ? undefined : { opacity: 1 - pos }}
        className={cn(
          // Samma typografi i båda lägena (rev. 2026-07-23, Marcus p15:
          // "samma vikt och allting") — bocken i cirkeln ÄR armad-markören,
          // texten byter bara innehåll. K82:s font-medium-lyft rivet öppet.
          'absolute inset-0 flex items-center justify-center gap-[0.4em] text-small text-text-muted',
        )}
      >
        {selected ? confirmedLabel : prompt}
      </span>
      {/* Cirkeln: definierad av skugga mot den tonade rännan (K79-slipet);
          tom i vila — bocken är målets belöning (K78). */}
      <span
        ref={handtagRef}
        aria-hidden="true"
        data-slot="handle"
        style={{ left: `calc(${pos * 100}% - ${pos * HANDTAG_PX}px)` }}
        className={cn(
          'absolute top-0 flex size-12 items-center justify-center rounded-full bg-surface shadow-md outline-border-strong contrast-more:outline print:outline',
          dragPos == null ? 'cursor-grab motion-safe:transition-[left]' : 'cursor-grabbing',
        )}
      >
        {selected && (
          <Check aria-hidden="true" size={22} strokeWidth={3} className="text-success" />
        )}
      </span>
    </div>
  );
}
