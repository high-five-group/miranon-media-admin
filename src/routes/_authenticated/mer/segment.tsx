import { createFileRoute } from '@tanstack/react-router';
import { useQueryState } from 'nuqs';
import { PrototypeSwitcher } from '@/components/dev/PrototypeSwitcher';
import { VariantD } from '@/components/segment/prototyp/VariantD';
import { SegmentPrototyp, type SegmentVariant } from '@/components/segment/SegmentPrototyp';

export const Route = createFileRoute('/_authenticated/mer/segment')({
  staticData: { title: 'Segment' },
  component: SegmentPage,
});

/**
 * [PROTOTYPE] S104 divergens-pass — KASTBAR WIRING (throwaway-kontraktet) FÖR
 * VARIANTERNA A/B/C. Variant D är PROMOVERAD (TASK-249.5, ADR-103 B2 steg 1):
 * dess FORM är nu den OVILLKORLIGA skarpa ytan nedan, och `?variant=d`
 * pekar därför på exakt samma komponent (`VariantD` renderad direkt i
 * stället för via `SegmentPrototyp`) — enkelriktat identisk med promoverings-
 * grindens FÖRE-halva (`tests/visual/segment-promoverings-grind.spec.ts`).
 *
 * FRÅGAN: "Vad ÄR en segment-sida — och vilken handling är dess huvudsak?"
 * Fullständig märkning + variantbeskrivningar:
 * `src/components/segment/SegmentPrototyp.tsx`.
 *
 * TRE KVARVARANDE varianter (`?variant=a|b|c`) — `label`/`stegLabel` renderas
 * ingenstans efter ADR-074 Amendering 5 men är obligatoriska i typen; de
 * skrivs som dokumentation. `steg: 1` för alla tre: divergens-passet har
 * inga konvergens-steg (steget bumpas först när en vinnare itereras).
 *
 * RIVNING (TASK-249.6, EFTER denna flipp): ta bort `PROTO_VARIANTS`s a/b/c-
 * poster + `arProtoVariant`-grenen + rail-monteringen och `git rm`
 * variant-komponenterna a/b/c. `VariantD`-importen och den ovillkorliga
 * renderingen nedan är den PROMOVERADE FORMEN — rörs aldrig av rivningen.
 */
const PROTO_VARIANTS = [
  { key: 'a', label: 'A - Regelverkstaden', steg: 1, stegLabel: 'Divergens' },
  { key: 'b', label: 'B - Publiken först', steg: 1, stegLabel: 'Divergens' },
  { key: 'c', label: 'C - Segment som entitet', steg: 1, stegLabel: 'Divergens' },
];

const PROTO_NYCKLAR: readonly string[] = ['a', 'b', 'c'];

function arProtoVariant(v: string | null): v is SegmentVariant {
  return v != null && PROTO_NYCKLAR.includes(v);
}

// Mer — Segment-byggar-yta (Fas 6g L2, promoverad TASK-249.5): /mer/segment.
// Bygger med/utan-predikat över event-domänens taxonomi + basdimensionerna
// (Kursfamilj/Kursnivå) och räknar matchande personer via compute-segment-EF:s
// DNF-stöd (ADR-115). Formen bor i VariantD; routen håller bara montering.
// <Outlet/> bärs av _authenticated via AppShell.
function SegmentPage() {
  // [PROTOTYPE] DEV-grinden är VÅR — PrototypeSwitcher har ingen egen. Gäller
  // numera bara a/b/c (jämförelsematerial); `d` och avsaknad av param ger
  // båda samma promoverade `VariantD`.
  const [variant] = useQueryState('variant');
  const proto = import.meta.env.DEV && arProtoVariant(variant);

  return (
    <>
      {/* Komponent-BYTE, inte gren inuti den skarpa komponenten: hook-antalet
          får aldrig ändras mitt i en session när railen togglas. */}
      {proto && arProtoVariant(variant) ? <SegmentPrototyp variant={variant} /> : <VariantD />}
      {/* [PROTOTYPE] Rail-monteringen. `data-proto-rail` är snapshot-hooken
          (railen är `fixed z-50` och hamnar annars i bilagebilderna) —
          dev-överlägget maskas bort via CSS i snapshot-specen, aldrig via en
          app-namnrymds-kollision (R9/L308). */}
      {import.meta.env.DEV && (
        <div data-proto-rail="">
          <PrototypeSwitcher variants={PROTO_VARIANTS} />
        </div>
      )}
    </>
  );
}
