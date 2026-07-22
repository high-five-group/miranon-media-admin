/**
 * [DEV-VERKTYG] PrototypeSwitcher — delad minimal-först prototyp-växlare för
 * UI-prototyp-passen (prototype-skillens standard-form; T78 a-hemvisten,
 * ombyggd till ADR-074 beslut 2–3 i TASK-29). STÅENDE dev-komponent — varken
 * throwaway-kod eller 11/11/11-produktbiblioteket: monteras endast bakom
 * `import.meta.env.DEV` (ADR-044-mekaniken på komponentnivå) och möter
 * körbarhets-golvet.
 *
 * Identitetsmodellen (S72, Marcus-modellen):
 * - VARIANT = divergens-axeln (strukturellt olika alternativ; fler föds
 *   endast på Marcus-beslut).
 * - STEG = konvergens-axeln (Marcus-låsta förfiningar av EN variant; frysta
 *   steg får snapshot-jämförelsepar via bilagorna, ADR-074 beslut 3).
 * Identitets-raden (variant + steg) visas alltid i prototyp-läget.
 *
 * URL-kontraktet (ADR-074 beslut 1): `?variant=<nyckel>` väljer variant
 * (null = skarpa vyn); `?data=verklig` växlar demo→verklig. Stabila nycklar
 * per familj — vinnaren behåller sin nyckel genom konvergensen. `aliases`
 * är ENBART legacy-inmappning för historiska URL:er (t.ex. listans K→A),
 * aldrig för nya pass.
 *
 * UI-formen (ADR-074 beslut 2, Vercel-Toolbar-mönstret): minimal-först —
 * default är hörn-pillen med ‹ ›-pilstegning; expansion är opt-in och
 * persisteras. Live-jämförelse görs i fönster-lagret via "Öppna i nytt
 * fönster" (beslut 3) — aldrig in-app-compare-yta.
 */
import { useQueryState } from 'nuqs';
import { useState } from 'react';

/** Persistens-nyckeln behålls från S73 K59; ADR-074 inverterar defaulten —
    endast lagrat '0' (uttryckligt utfälld) öppnar panelen vid load. */
const MIN_KEY = 'mm-proto-switcher-minimerad';

export type PrototypeVariant = {
  /** URL-nyckeln i `?variant=` */
  key: string;
  /** Chip-etiketten ("Variant B") */
  label: string;
  /** Konvergens-axelns läge för identitets-raden */
  steg: number;
  stegLabel: string;
};

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
  const [minimerad, setMinimerad] = useState(() => localStorage.getItem(MIN_KEY) !== '0');
  const vaxlaMinimerad = (v: boolean) => {
    setMinimerad(v);
    localStorage.setItem(MIN_KEY, v ? '1' : '0');
  };
  const resolved = variantParam == null ? null : (aliases[variantParam] ?? variantParam);
  const active = variants.find((v) => v.key === resolved) ?? null;
  // Pilstegningens cykel: skarpa vyn → varianterna i kort-ordning → wrap.
  const cykel: (string | null)[] = [null, ...variants.map((v) => v.key)];
  const lage = active == null ? 0 : cykel.indexOf(active.key);
  const stega = (riktning: 1 | -1) =>
    setVariant(cykel[(lage + riktning + cykel.length) % cykel.length]);
  const identitet = active ? `${active.key} · steg ${active.steg}` : 'skarp';
  const chip = (isActive: boolean) =>
    isActive
      ? 'rounded-full border border-primary bg-primary-tint px-3 py-1.5 font-semibold text-small text-text'
      : 'rounded-full border border-border px-3 py-1.5 text-small text-text-secondary';
  const pil = 'rounded-full px-2.5 py-1 font-semibold text-small text-text hover:bg-bg-subtle';
  if (minimerad) {
    return (
      <div className="fixed right-3 bottom-24 z-50 flex items-center gap-0.5 rounded-full border border-border-strong bg-bg px-1.5 py-1 shadow-lg">
        <button
          type="button"
          onClick={() => stega(-1)}
          aria-label="Föregående variant"
          className={pil}
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => vaxlaMinimerad(false)}
          aria-label="Visa prototyp-växlaren"
          className="rounded-full px-2 py-1 font-mono text-caption text-text tracking-wide"
        >
          {identitet}
        </button>
        <button type="button" onClick={() => stega(1)} aria-label="Nästa variant" className={pil}>
          ›
        </button>
      </div>
    );
  }
  return (
    <div className="fixed right-3 bottom-24 z-50 flex w-max max-w-[92vw] flex-col gap-2 rounded-2xl border border-border-strong bg-bg p-3 text-text shadow-lg">
      <span className="flex w-full items-center justify-between gap-3">
        <span className="font-mono text-caption text-text-secondary tracking-wide">
          PROTOTYP-VÄXLAREN · dev-verktyg
        </span>
        <button
          type="button"
          onClick={() => vaxlaMinimerad(true)}
          aria-label="Göm prototyp-växlaren"
          className="rounded-full border border-border px-2 py-0.5 text-caption text-text-secondary"
        >
          Göm
        </button>
      </span>
      {active && (
        <span className="font-semibold text-small">
          Variant {active.key} · Steg {active.steg} — {active.stegLabel}
        </span>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setVariant(null)}
          aria-pressed={active == null}
          className={chip(active == null)}
        >
          Skarpa vyn
        </button>
        {variants.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => setVariant(v.key)}
            aria-pressed={active?.key === v.key}
            className={chip(active?.key === v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>
      {active && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDataMode(null)}
            aria-pressed={dataMode !== 'verklig'}
            className={chip(dataMode !== 'verklig')}
          >
            Demo-data
          </button>
          <button
            type="button"
            onClick={() => setDataMode('verklig')}
            aria-pressed={dataMode === 'verklig'}
            className={chip(dataMode === 'verklig')}
          >
            Verklig data
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => window.open(window.location.href, '_blank', 'noopener,noreferrer')}
        className="rounded-full border border-border px-3 py-1.5 text-small text-text-secondary"
      >
        Öppna i nytt fönster
      </button>
    </div>
  );
}
