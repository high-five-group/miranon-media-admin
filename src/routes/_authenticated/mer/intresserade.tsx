import { createFileRoute } from '@tanstack/react-router';
import { useQueryState } from 'nuqs';
import type { PrototypeDataLage, PrototypeVariant } from '@/components/dev/PrototypeSwitcher';
import { PrototypeSwitcher } from '@/components/dev/PrototypeSwitcher';
import { Intresserade } from '@/components/intresserade';
import { IntresseradeKonvergens } from '@/components/intresserade/prototype/IntresseradeKonvergens';

// [PROTOTYPE] Kastbar växel-konfig (ADR-074: stabil nyckel `a`, steg =
// konvergens-axeln; dataläget `fyll` = formbedömnings-fyllnaden).
const PROTO_VARIANTS: PrototypeVariant[] = [
  { key: 'a', label: 'Konvergens', steg: 1, stegLabel: 'K1 - personlistans anatomi' },
];
const PROTO_DATA_LAGEN: readonly PrototypeDataLage[] = [
  { value: null, label: 'Verklig' },
  { value: 'fyll', label: 'Fyll 60' },
];

export const Route = createFileRoute('/_authenticated/mer/intresserade')({
  staticData: { title: 'Intresserade' },
  component: IntresseradePage,
});

// Mer — Intresserade-vy (Fas 6e L1 Landning 3): /mer/intresserade. LÄS-vy via
// fetchIntresserade → get-leads-EF (global lista, strikt lead-formel, Senaste
// interaktion desc). Logiken bor i Intresserade; routen håller bara montering.
// Syskon-leafs: index.tsx (Mer-landningen) + vantelista.tsx; <Outlet/> bärs av
// _authenticated via AppShell.
//
// [PROTOTYPE] B3-konvergenspasset (S114 Del 3): ?variant=a monterar
// IntresseradeKonvergens i DEV (underform A — skarpa vyn är K0-baslinjen på
// variant=null). Växeln + varianten rivs vid promoveringen (ADR-103); det
// som promoveras är formen. Import + villkor är kastbar växel-kod.
function IntresseradePage() {
  const [variant] = useQueryState('variant');
  const konvergens = import.meta.env.DEV && variant === 'a';
  return (
    <>
      {import.meta.env.DEV ? (
        <PrototypeSwitcher variants={PROTO_VARIANTS} dataLagen={PROTO_DATA_LAGEN} />
      ) : null}
      {konvergens ? <IntresseradeKonvergens /> : <Intresserade />}
    </>
  );
}
