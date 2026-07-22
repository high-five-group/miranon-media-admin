/**
 * [DEV-VERKTYG] PrototypeSwitcher — delad prototyp-växlare som dockad,
 * dragbar ikon-rail (ADR-074 beslut 2 REVIDERAT S76 på Marcus-direktiv;
 * T78 a-hemvisten, TASK-29). STÅENDE dev-komponent — varken throwaway-kod
 * eller 11/11/11-produktbiblioteket: monteras endast bakom
 * `import.meta.env.DEV` (ADR-044-mekaniken) och möter körbarhets-golvet.
 *
 * Identitetsmodellen (S72): VARIANT = divergens-axeln · STEG =
 * konvergens-axeln. Identiteten bärs i rail-formen av aktiv knapps
 * steg-badge + tooltip (full rad: "Variant A · Steg 1 — label").
 *
 * URL-kontraktet (ADR-074 beslut 1): `?variant=<nyckel>` (null = skarpa
 * vyn) · `?data=verklig`. Stabila nycklar; `aliases` är ENBART
 * legacy-inmappning för historiska URL:er.
 *
 * Rail-formen (beslut 2-revideringen): alltid kompakt — endast
 * ikon-knappar med tooltips (Figma/Stripe-klassens verktygsrail).
 * Default DOCKAD vid höger kant, vertikalt centrerad; flyttbar via
 * grip-handtaget (position persisteras i POS_KEY; dubbelklick på grippen
 * dockar tillbaka). Live-jämförelse i fönster-lagret via ⧉ (beslut 3).
 */
import { useQueryState } from 'nuqs';
import { useRef, useState } from 'react';

/** Dragen position {x,y} i px; saknad post = dockad default-position. */
const POS_KEY = 'mm-proto-switcher-pos';

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

/** Mörk mikro-tooltip till vänster om railen (CSS-only, group-hover). */
function Tooltip({ text }: { text: string }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-full mr-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-text px-2 py-1 text-caption text-text-inverse shadow-lg group-hover:block group-focus-visible:block"
    >
      {text}
    </span>
  );
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
  // Senaste positionen speglas i en ref (L300-mönstret) så persistensen kan
  // ske SYNKRONT i pointerup-handlern — en side effect i setState-updatern
  // körs efter dubbelklickets docka() och skulle återskriva nyckeln.
  const posRef = useRef<Pos | null>(pos);
  const drag = useRef<{ pekareId: number; dx: number; dy: number } | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const resolved = variantParam == null ? null : (aliases[variantParam] ?? variantParam);
  const active = variants.find((v) => v.key === resolved) ?? null;

  const startaDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rail = railRef.current;
    if (!rail) return;
    const r = rail.getBoundingClientRect();
    drag.current = { pekareId: e.pointerId, dx: e.clientX - r.left, dy: e.clientY - r.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const flytta = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    const rail = railRef.current;
    if (!d || d.pekareId !== e.pointerId || !rail) return;
    const r = rail.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - d.dx, 4), window.innerWidth - r.width - 4);
    const y = Math.min(Math.max(e.clientY - d.dy, 4), window.innerHeight - r.height - 4);
    posRef.current = { x, y };
    setPos(posRef.current);
  };
  const slappDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (drag.current?.pekareId !== e.pointerId) return;
    drag.current = null;
    if (posRef.current) localStorage.setItem(POS_KEY, JSON.stringify(posRef.current));
  };
  const docka = () => {
    drag.current = null;
    posRef.current = null;
    setPos(null);
    localStorage.removeItem(POS_KEY);
  };

  const knapp = (isActive: boolean) =>
    `group relative flex h-9 w-9 items-center justify-center rounded-full text-small transition-colors ${
      isActive
        ? 'border border-primary bg-primary-tint font-semibold text-text'
        : 'text-text-secondary hover:bg-bg-subtle'
    }`;

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
        aria-label="Flytta prototyp-växlaren (dra; dubbelklick dockar tillbaka)"
        onPointerDown={startaDrag}
        onPointerMove={flytta}
        onPointerUp={slappDrag}
        onPointerCancel={slappDrag}
        onDoubleClick={docka}
        className="group relative flex h-7 w-9 cursor-grab touch-none items-center justify-center rounded-full text-text-muted hover:bg-bg-subtle active:cursor-grabbing"
      >
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
          <circle cx="2.5" cy="2" r="1.3" />
          <circle cx="7.5" cy="2" r="1.3" />
          <circle cx="2.5" cy="7" r="1.3" />
          <circle cx="7.5" cy="7" r="1.3" />
          <circle cx="2.5" cy="12" r="1.3" />
          <circle cx="7.5" cy="12" r="1.3" />
        </svg>
        <Tooltip text="Dra för att flytta · dubbelklick dockar" />
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
          <path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8s-2.4 4.5-6.5 4.5S1.5 8 1.5 8Z" />
          <circle cx="8" cy="8" r="2" />
        </svg>
        <Tooltip text="Skarpa vyn" />
      </button>
      {variants.map((v) => (
        <button
          key={v.key}
          type="button"
          onClick={() => setVariant(v.key)}
          aria-pressed={active?.key === v.key}
          aria-label={`Variant ${v.key} · Steg ${v.steg} — ${v.stegLabel}`}
          className={knapp(active?.key === v.key)}
        >
          <span className="font-mono">{v.key}</span>
          {active?.key === v.key && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-text px-0.5 font-semibold text-[10px] text-text-inverse">
              {v.steg}
            </span>
          )}
          <Tooltip text={`Variant ${v.key} · Steg ${v.steg} — ${v.stegLabel}`} />
        </button>
      ))}
      {active && (
        <button
          type="button"
          onClick={() => setDataMode(dataMode === 'verklig' ? null : 'verklig')}
          aria-pressed={dataMode === 'verklig'}
          aria-label={
            dataMode === 'verklig'
              ? 'Verklig data — växla till demo'
              : 'Demo-data — växla till verklig'
          }
          className={knapp(dataMode === 'verklig')}
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
          <Tooltip
            text={dataMode === 'verklig' ? 'Data: verklig → demo' : 'Data: demo → verklig'}
          />
        </button>
      )}
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
        <Tooltip text="Öppna i nytt fönster" />
      </button>
    </div>
  );
}
