/**
 * [DEV-VERKTYG] PrototypeSwitcher — delad flytande variant-växlare för
 * UI-prototyp-passen (prototype-skillens steg 4; T78a: S72-formen
 * standardiserad). STÅENDE dev-komponent — varken throwaway-kod eller
 * 11/11/11-produktbiblioteket: monteras endast bakom `import.meta.env.DEV`
 * (ADR-044-mekaniken på komponentnivå) och möter körbarhets-golvet.
 *
 * Identitetsmodellen (S72 K4, Marcus-modellen):
 * - VARIANT = divergens-axeln (strukturellt olika alternativ; fler föds
 *   endast på Marcus-beslut).
 * - STEG = konvergens-axeln (Marcus-låsta förfiningar av EN variant;
 *   frysta steg får snapshot-jämförelsepar via git + bilagor).
 * Identitets-raden (variant + steg) visas alltid i prototyp-läget.
 *
 * URL-kontraktet: `?variant=<nyckel>` väljer variant (null = skarpa vyn);
 * `?data=verklig` växlar demo→verklig (demo är konvergens-default, S72 K2).
 * `aliases` mappar legacy-/familje-värden till en lokal variant-nyckel —
 * t.ex. listans K→A (K1–K3-URL:erna) eller detaljsidans A/B→K
 * (familje-flödet lista→detalj bär listans variant-värde i URL:en).
 */
import { useQueryState } from 'nuqs';

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
  const resolved = variantParam == null ? null : (aliases[variantParam] ?? variantParam);
  const active = variants.find((v) => v.key === resolved) ?? null;
  const chip = (isActive: boolean) =>
    isActive
      ? 'rounded-full bg-bg px-3 py-1.5 font-semibold text-small text-text'
      : 'rounded-full border border-border-strong px-3 py-1.5 text-small text-text-inverse';
  return (
    <div className="fixed bottom-24 left-1/2 z-50 flex w-max max-w-[92vw] -translate-x-1/2 flex-col items-center gap-2 rounded-2xl bg-text px-4 py-3 text-text-inverse shadow-lg">
      <span className="font-mono text-caption tracking-wide">PROTOTYP-VÄXLAREN · dev-verktyg</span>
      {active && (
        <span className="font-semibold text-small">
          Variant {active.key} · Steg {active.steg} — {active.stegLabel}
        </span>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2">
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
        <div className="flex flex-wrap items-center justify-center gap-2">
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
    </div>
  );
}
