import { createFileRoute } from '@tanstack/react-router';
import { useQueryState } from 'nuqs';
import { AktivitetsHistorik } from '@/components/aktivitetshistorik';
import { AktivitetsHistorikPrototyp } from '@/components/aktivitetshistorik/AktivitetsHistorikPrototyp';
import { PrototypeSwitcher } from '@/components/dev/PrototypeSwitcher';

export const Route = createFileRoute('/_authenticated/mer/aktivitetshistorik')({
  staticData: { title: 'Aktivitetshistorik' },
  component: AktivitetsHistorikPage,
});

/**
 * [PROTOTYPE] S106 konvergens-pass — KASTBAR WIRING (rivs vid promovering,
 * ADR-103; fullständig märkning + frågan i
 * `src/components/aktivitetshistorik/AktivitetsHistorikPrototyp.tsx`).
 *
 * EN konvergens-post (`?variant=a`, precedent: åtgärds-passets enda post) —
 * steget bumpas i `stegLabel` vid varje Marcus-fryst iterationssteg.
 *
 * RIVNING: denna kommentar + `PROTO_VARIANTS` + `arProtoVariant` +
 * `proto`-grenen + rail-monteringen, och `git rm` prototyp-komponenten.
 * Skarpa grenen nedan är ORÖRD — prototypen ligger BREDVID, aldrig i.
 */
const PROTO_VARIANTS = [{ key: 'a', label: 'Konvergens', steg: 1, stegLabel: 'Exakt kopia' }];

function arProtoVariant(v: string | null): v is 'a' {
  return v === 'a';
}

// Mer — Aktivitetshistoriken, kärnvyn (TASK-201.6): /mer/aktivitetshistorik.
// A-formen — HEL yta utan filterrad (filterraden är TASK-201.8, additiv skiva).
// LÄS-vy via useActivityLogHistory() (TASK-201.5) → get-activity-log-EF.
// Logiken bor i AktivitetsHistorik; routen håller bara montering. Syskon-leaf:
// index.tsx (Mer-landningen, AC #2:s nav-post); <Outlet/> bärs av
// _authenticated via AppShell. Reachable även på desktop via direkt URL/länk
// (hem-spaltens "Se all aktivitetshistorik", TASK-201.7, OBYGGD) — samma
// mönster som maillogg.tsx/anmalningar.tsx: en `/mer/*`-hemvist begränsar inte
// vem som länkar hit.
function AktivitetsHistorikPage() {
  // [PROTOTYPE] DEV-grinden är VÅR — PrototypeSwitcher har ingen egen.
  const [variant] = useQueryState('variant');
  const proto = import.meta.env.DEV && arProtoVariant(variant);

  return (
    <>
      {/* Komponent-BYTE, inte gren inuti den skarpa komponenten: hook-antalet
          får aldrig ändras mitt i en session när railen togglas. */}
      {proto ? <AktivitetsHistorikPrototyp /> : <AktivitetsHistorik />}
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
