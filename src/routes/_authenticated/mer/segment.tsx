import { createFileRoute } from '@tanstack/react-router';
import { useQueryState } from 'nuqs';
import { PrototypeSwitcher } from '@/components/dev/PrototypeSwitcher';
import { SegmentBuilder } from '@/components/segment';
import { SegmentPrototyp, type SegmentVariant } from '@/components/segment/SegmentPrototyp';

export const Route = createFileRoute('/_authenticated/mer/segment')({
  staticData: { title: 'Segment' },
  component: SegmentPage,
});

/**
 * [PROTOTYPE] S104 divergens-pass — KASTBAR WIRING (throwaway-kontraktet).
 *
 * FRÅGAN: "Vad ÄR en segment-sida — och vilken handling är dess huvudsak?"
 * Fullständig märkning + variantbeskrivningar:
 * `src/components/segment/SegmentPrototyp.tsx`.
 *
 * TRE varianter (`?variant=a|b|c`) — `label`/`stegLabel` renderas ingenstans
 * efter ADR-074 Amendering 5 men är obligatoriska i typen; de skrivs som
 * dokumentation. `steg: 1` för alla tre: divergens-passet har inga
 * konvergens-steg (steget bumpas först när en vinnare itereras).
 *
 * RIVNING: ta bort denna kommentar + `PROTO_VARIANTS` + `PROTO_NYCKLAR` +
 * `arProtoVariant` + `proto`-grenen + rail-monteringen, och `git rm`
 * prototyp-komponenterna. Skarpa grenen nedan är ORÖRD — prototypen läggs
 * BREDVID, aldrig i.
 */
const PROTO_VARIANTS = [
  { key: 'a', label: 'A - Regelverkstaden', steg: 1, stegLabel: 'Divergens' },
  { key: 'b', label: 'B - Publiken först', steg: 1, stegLabel: 'Divergens' },
  { key: 'c', label: 'C - Segment som entitet', steg: 1, stegLabel: 'Divergens' },
  { key: 'd', label: 'D - Syntesen', steg: 1, stegLabel: 'Divergens' },
];

const PROTO_NYCKLAR: readonly string[] = ['a', 'b', 'c', 'd'];

function arProtoVariant(v: string | null): v is SegmentVariant {
  return v != null && PROTO_NYCKLAR.includes(v);
}

// Mer — Segment-byggar-yta (Fas 6g L2): /mer/segment. Bygger include/exclude-regel
// över event-domänens taxonomi (deriveTaxonomy(get-events)) och räknar matchande
// personer on-demand via compute-segment-EF (L1). Logiken bor i SegmentBuilder;
// routen håller bara montering. <Outlet/> bärs av _authenticated via AppShell.
function SegmentPage() {
  // [PROTOTYPE] DEV-grinden är VÅR — PrototypeSwitcher har ingen egen.
  const [variant] = useQueryState('variant');
  const proto = import.meta.env.DEV && arProtoVariant(variant);

  return (
    <>
      {/* Komponent-BYTE, inte gren inuti den skarpa komponenten: hook-antalet
          får aldrig ändras mitt i en session när railen togglas. */}
      {proto && arProtoVariant(variant) ? (
        <SegmentPrototyp variant={variant} />
      ) : (
        <SegmentBuilder />
      )}
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
