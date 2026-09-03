import { createFileRoute } from '@tanstack/react-router';
import type { PrototypeDataLage, PrototypeVariant } from '@/components/dev/PrototypeSwitcher';
import { PrototypeSwitcher } from '@/components/dev/PrototypeSwitcher';
import { Intresserade } from '@/components/intresserade';

// [PROTOTYPE] Kastbar rail-konfig — INTE längre en formväxel (TASK-374.2:
// villkoret `variant === 'a'` som VALDE mellan två komponenter är riven, se
// IntresseradePage nedan). PROTO_VARIANTS lever kvar av en enda anledning:
// PrototypeSwitcher.tsx:s Dataläge-knapp är INAKTIVERAD utan en aktiv variant
// (`if (active) setDataMode(...)`, `aria-disabled={active == null}`) — utan
// minst en post här går `?data=fyll` inte att nå via railen, bara via
// handskriven URL. Samma "krympt till en post"-mönster som personlistans
// flip-precedent (3d5020be) och check-in-flippens (c198d2fb). Rivs i 374.4
// tillsammans med PROTO_DATA_LAGEN och hela switcher-monteringen.
const PROTO_VARIANTS: PrototypeVariant[] = [
  { key: 'a', label: 'Konvergens', steg: 1, stegLabel: 'K1 - personlistans anatomi' },
];
// [PROTOTYPE] Dataläget "fyll" (60 syntetiska rader, Marcus formbedömning i
// facit-bilden) lever kvar bakom DEV fram till 374.4 — 374.3 granskar den
// promoverade ytan i BÅDA dataläger. Se Intresserade.tsx § fyllnadsfabriken.
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
// [PROMOVERAD, TASK-374.2, ADR-103 B2 steg 1] Villkoret `import.meta.env.DEV
// && variant === 'a'` som valde mellan K0 (`Intresserade`, den gamla skarpa
// grenen) och B3-konvergensformen (`IntresseradeKonvergens`) är riven.
// `Intresserade` ÄR nu konvergensformen — filflytten skedde som git-rename
// (`git mv src/components/intresserade/prototype/IntresseradeKonvergens.tsx
// src/components/intresserade/Intresserade.tsx`, `git log --follow` på den
// nya sökvägen spårar in i S114-prototyppasset, se PR-beskrivningen) — och
// renderas OVILLKORLIGT här, oavsett `?variant=`. En stale
// `?variant=a`-länk (bokmärke, delad URL) renderar därför BYTE FÖR BYTE
// samma träd som ingen query alls (grind-specens stale-URL-describe,
// TASK-374.2 AC #4): PrototypeSwitcher-railen läser `?variant=` internt för
// sin egen aktiv-knapp, men den sidan/komponenten den styr existerar inte
// längre — bara railens EGEN highlight påverkas.
function IntresseradePage() {
  return (
    <>
      {import.meta.env.DEV ? (
        <PrototypeSwitcher variants={PROTO_VARIANTS} dataLagen={PROTO_DATA_LAGEN} />
      ) : null}
      <Intresserade />
    </>
  );
}
