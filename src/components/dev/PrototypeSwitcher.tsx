/**
 * [DEV-VERKTYG] PrototypeSwitcher — delad prototyp-växlare som dockad,
 * dragbar ikon-rail (ADR-074 beslut 2 REVIDERAT S76 + polervågen på
 * Marcus-granskning; T78 a-hemvisten, TASK-29). STÅENDE dev-komponent —
 * varken throwaway-kod eller 11/11/11-produktbiblioteket: monteras endast
 * bakom `import.meta.env.DEV` (ADR-044-mekaniken) och möter
 * körbarhets-golvet.
 *
 * Identitetsmodellen (S72): VARIANT = divergens-axeln · STEG =
 * konvergens-axeln. Identiteten bärs av den ALLTID synliga
 * steg-badgen på variant-knapparna (A5: tooltips utgår helt —
 * knapparna är inlärda; aria-labels är a11y-golvet). EN variant i
 * familjen → prototyp-ikon (kolv) i stället för kryptisk bokstav
 * (S76-polervågen: "vad betyder K?"); flera varianter →
 * bokstavs-knappar (särskiljbarhet kräver dem).
 *
 * URL-kontraktet (ADR-074 beslut 1): `?variant=<nyckel>` (null = skarpa
 * vyn) · `?data=verklig`. Stabila nycklar; `aliases` är ENBART
 * legacy-inmappning för historiska URL:er.
 *
 * Rail-formen: alltid kompakt, KONSTANT höjd (data-knappen har
 * reserverad plats även utan aktiv variant — höjd-hopp är förbjudna);
 * flyttbar via grip (pointer-drag ELLER piltangenter; Home/Escape
 * dockar; dubbelklick dockar).
 */
import { useQueryState } from 'nuqs';
import { useRef, useState } from 'react';

/** Dragen position {x,y} i px; saknad post = dockad default-position. */
const POS_KEY = 'mm-proto-switcher-pos';
/** Piltangenternas nudge-steg (px) på grip-handtaget. */
const NUDGE = 16;

export type PrototypeVariant = {
  /** URL-nyckeln i `?variant=` */
  key: string;
  /** Chip-etiketten ("Variant B") */
  label: string;
  /** Konvergens-axelns läge för identitets-tooltipen */
  steg: number;
  stegLabel: string;
};

type Pos = { x: number; y: number };

function lasPos(): Pos | null {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Pos;
    return Number.isFinite(p.x) && Number.isFinite(p.y) ? p : null;
  } catch {
    return null;
  }
}

export function PrototypeSwitcher({
  variants,
  aliases = {},
}: {
  variants: PrototypeVariant[];
  /** Legacy-/familje-URL-värden → variant-nyckel (se URL-kontraktet ovan). */
  aliases?: Record<string, string>;
}) {
  const [variantParam, setVariant] = useQueryState('variant');
  const [dataMode, setDataMode] = useQueryState('data');
  const [pos, setPos] = useState<Pos | null>(lasPos);
  // Positionen speglas i en ref (L300/L307) så persistensen sker SYNKRONT
  // i event-handlern — aldrig som side effect i setState-updatern.
  const posRef = useRef<Pos | null>(pos);
  const drag = useRef<{ pekareId: number; dx: number; dy: number } | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const resolved = variantParam == null ? null : (aliases[variantParam] ?? variantParam);
  const active = variants.find((v) => v.key === resolved) ?? null;
  const endaVarianten = variants.length === 1;

  const sattPos = (p: Pos | null) => {
    posRef.current = p;
    setPos(p);
  };
  const persistera = () => {
    if (posRef.current) localStorage.setItem(POS_KEY, JSON.stringify(posRef.current));
  };
  const klampad = (x: number, y: number): Pos => {
    const r = railRef.current?.getBoundingClientRect();
    const w = r?.width ?? 48;
    const h = r?.height ?? 240;
    return {
      x: Math.min(Math.max(x, 4), window.innerWidth - w - 4),
      y: Math.min(Math.max(y, 4), window.innerHeight - h - 4),
    };
  };

  const startaDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = railRef.current?.getBoundingClientRect();
    if (!r) return;
    drag.current = { pekareId: e.pointerId, dx: e.clientX - r.left, dy: e.clientY - r.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const flytta = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.pekareId !== e.pointerId) return;
    sattPos(klampad(e.clientX - d.dx, e.clientY - d.dy));
  };
  const slappDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (drag.current?.pekareId !== e.pointerId) return;
    drag.current = null;
    persistera();
  };
  const docka = () => {
    drag.current = null;
    sattPos(null);
    localStorage.removeItem(POS_KEY);
  };
  /** Tangentbords-flytt: pilar nudgar, Home/Escape dockar (a11y-paritet
      med pointer-draget). */
  const nudge = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Home' || e.key === 'Escape') {
      e.preventDefault();
      docka();
      return;
    }
    const r = railRef.current?.getBoundingClientRect();
    if (!r) return;
    const bas: Pos = posRef.current ?? { x: r.left, y: r.top };
    const steg: Record<string, Pos> = {
      ArrowLeft: { x: bas.x - NUDGE, y: bas.y },
      ArrowRight: { x: bas.x + NUDGE, y: bas.y },
      ArrowUp: { x: bas.x, y: bas.y - NUDGE },
      ArrowDown: { x: bas.x, y: bas.y + NUDGE },
    };
    const nasta = steg[e.key];
    if (!nasta) return;
    e.preventDefault();
    sattPos(klampad(nasta.x, nasta.y));
    persistera();
  };

  const fokus =
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus';
  const knapp = (isActive: boolean) =>
    `relative flex h-9 w-9 items-center justify-center rounded-full text-small transition-colors ${fokus} ${
      isActive
        ? 'border border-primary bg-primary-tint font-semibold text-text'
        : 'border border-transparent text-text-secondary hover:bg-bg-subtle'
    }`;
  const stegBadge = (steg: number) => (
    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-text px-0.5 font-semibold text-[10px] text-text-inverse">
      {steg}
    </span>
  );

  return (
    <div
      ref={railRef}
      className="fixed z-50 flex flex-col items-center gap-1 rounded-full border border-border bg-bg/95 p-1.5 shadow-lg backdrop-blur"
      style={
        pos ? { left: pos.x, top: pos.y } : { right: 8, top: '50%', transform: 'translateY(-50%)' }
      }
    >
      <button
        type="button"
        aria-label="Flytta prototyp-växlaren: dra eller piltangenter; Home eller dubbelklick dockar"
        onPointerDown={startaDrag}
        onPointerMove={flytta}
        onPointerUp={slappDrag}
        onPointerCancel={slappDrag}
        onDoubleClick={docka}
        onKeyDown={nudge}
        className={`flex h-7 w-9 cursor-grab touch-none items-center justify-center rounded-full text-text-muted hover:bg-bg-subtle active:cursor-grabbing ${fokus}`}
      >
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
          <circle cx="2.5" cy="2" r="1.3" />
          <circle cx="7.5" cy="2" r="1.3" />
          <circle cx="2.5" cy="7" r="1.3" />
          <circle cx="7.5" cy="7" r="1.3" />
          <circle cx="2.5" cy="12" r="1.3" />
          <circle cx="7.5" cy="12" r="1.3" />
        </svg>
      </button>
      <span aria-hidden="true" className="h-px w-6 bg-border" />
      <button
        type="button"
        onClick={() => setVariant(null)}
        aria-pressed={active == null}
        aria-label="Skarpa vyn"
        className={knapp(active == null)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <rect x="1.75" y="2.5" width="12.5" height="11" rx="1.6" />
          <path d="M1.75 5.5h12.5" />
          <circle cx="3.9" cy="4" r="0.5" fill="currentColor" stroke="none" />
        </svg>
      </button>
      {variants.map((v) => (
        <button
          key={v.key}
          type="button"
          onClick={() => setVariant(v.key)}
          aria-pressed={active?.key === v.key}
          aria-label={endaVarianten ? 'Prototyp' : `Variant ${v.key}`}
          className={knapp(active?.key === v.key)}
        >
          {endaVarianten ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M6 1.5h4" />
              <path d="M6.8 1.5v4.2L3 12.2a1.6 1.6 0 0 0 1.4 2.3h7.2a1.6 1.6 0 0 0 1.4-2.3L9.2 5.7V1.5" />
              <path d="M4.6 10h6.8" />
            </svg>
          ) : (
            <span className="font-mono">{v.key}</span>
          )}
          {stegBadge(v.steg)}
        </button>
      ))}
      <button
        type="button"
        onClick={() => {
          if (active) setDataMode(dataMode === 'verklig' ? null : 'verklig');
        }}
        aria-pressed={active != null && dataMode === 'verklig'}
        aria-disabled={active == null}
        aria-label={active == null ? 'Dataläge (kräver prototyp)' : 'Dataläge'}
        className={`${knapp(active != null && dataMode === 'verklig')} ${
          active == null ? 'cursor-default opacity-40 hover:bg-transparent' : ''
        }`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <ellipse cx="8" cy="3.5" rx="5.5" ry="2" />
          <path d="M2.5 3.5v9c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2v-9" />
          <path d="M2.5 8c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2" />
        </svg>
      </button>
      <span aria-hidden="true" className="h-px w-6 bg-border" />
      <button
        type="button"
        onClick={() => window.open(window.location.href, '_blank', 'noopener,noreferrer')}
        aria-label="Öppna i nytt fönster (jämför sida vid sida)"
        className={knapp(false)}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <path d="M5.5 2.5h-3v10h10v-3" />
          <path d="M8.5 2.5h4v4" />
          <path d="M12.5 2.5 7 8" />
        </svg>
      </button>
    </div>
  );
}
