import { createFileRoute } from '@tanstack/react-router';
import { useQueryState } from 'nuqs';
import type {
  PrototypeDataLage,
  PrototypeVariant,
  PrototypeVy,
} from '@/components/dev/PrototypeSwitcher';
import { PrototypeSwitcher } from '@/components/dev/PrototypeSwitcher';
import { SegmentListaKonvergens } from '@/components/segment/prototyp/SegmentListaKonvergens';
import { VariantD } from '@/components/segment/prototyp/VariantD';

// [PROTOTYPE] B2-konvergenspasset (S114 Del 3): kastbar växel-konfig.
// Nytt pass-namespace (s114-segmentlistan-konvergens) — nyckeln `a` är
// passets egen, inte 249-divergensens rivna a/b/c (ADR-074-noten i Del 4).
const PROTO_VARIANTS: PrototypeVariant[] = [
  { key: 'a', label: 'Konvergens', steg: 2, stegLabel: 'K2 - facitets hantverk + sektioner' },
];
const PROTO_DATA_LAGEN: readonly PrototypeDataLage[] = [
  { value: null, label: 'Demo' },
  { value: 'tom', label: 'Tomläge' },
];
// [PROTOTYPE] K2: korthöjden växlas i rälsen (`?kort=`) så värdet omstämplas
// i browsern (S114 Del 3 beslut 3: öppen omstämpling). `kompakt` är
// riktningens default (null); `facit` är skarpa vyns 166 px för jämförelse.
const PROTO_KORT_HOJDER: PrototypeVy[] = [
  { key: 'kompakt', label: 'Kompakt kort' },
  { key: 'facit', label: 'Facithöjd' },
];

export const Route = createFileRoute('/_authenticated/mer/segment')({
  staticData: { title: 'Segment' },
  component: SegmentPage,
});

/**
 * Mer — Segment-byggar-yta (Fas 6g L2, promoverad TASK-249.5): /mer/segment.
 * Bygger med/utan-predikat över event-domänens taxonomi + basdimensionerna
 * (Kursfamilj/Kursnivå) och räknar matchande personer via compute-segment-EF:s
 * DNF-stöd (ADR-115). Formen bor i VariantD; routen håller bara montering.
 * <Outlet/> bärs av _authenticated via AppShell.
 *
 * DIVERGENS-PASSETS STÄLLNING ÄR RIVEN (TASK-249.6, ADR-103): varianterna
 * a/b/c, `SegmentPrototyp`-växeln och dess `?variant=`-nyckel samt
 * rail-monteringen togs bort när den godkända formen väl var den skarpa
 * ytan. Det som revs var FLAGGOR OCH VÄXLAR — aldrig formen: `VariantD`
 * renderas här ovillkorligt, exakt som flippen lämnade den, och
 * promoverings-grindens ariaSnapshot-referenser
 * (`tests/visual/segment-promoverings-grind.spec.ts`) är beviset för att
 * ytan står oförändrad genom rivningen.
 */
// [PROTOTYPE] ?variant=a monterar B2-konvergensytan i DEV (S114 Del 3;
// skarpa vyn är K0-baslinjen på variant=null). Import + villkor är kastbar
// växel-kod och rivs vid promoveringen — formen promoveras (ADR-103).
function SegmentPage() {
  const [variant] = useQueryState('variant');
  const konvergens = import.meta.env.DEV && variant === 'a';
  return (
    <>
      {import.meta.env.DEV ? (
        <PrototypeSwitcher
          variants={PROTO_VARIANTS}
          dataLagen={PROTO_DATA_LAGEN}
          vyer={PROTO_KORT_HOJDER}
          vyParam="kort"
        />
      ) : null}
      {konvergens ? <SegmentListaKonvergens /> : <VariantD />}
    </>
  );
}
