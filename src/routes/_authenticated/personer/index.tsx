import { createFileRoute } from '@tanstack/react-router';
import { PersonsList } from '@/components/persons';

export const Route = createFileRoute('/_authenticated/personer/')({
  staticData: { title: 'Personer' },
  component: PersonerPage,
});

/**
 * Personer-listan (Fas 6a). Routen håller rubrik + montering; logiken och
 * formen bor i `PersonsList`. Syskon-leaf: `personer/$personId` (detaljvy),
 * `<Outlet/>` bärs av `_authenticated` via AppShell (jfr `event/`).
 *
 * [PROMOVERING SLUTFÖRD — ADR-103 B2 steg 4, 2026-08-10] Prototyp-maskineriet
 * är rivet: `PROTO_VARIANTS`, rail-monteringen (`PrototypeSwitcher`),
 * `useQueryState('variant')` och villkoret `import.meta.env.DEV && variant ===
 * 'a'` är borta. Marcus godkände formen 2026-08-10 (kvitto i
 * `tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json` § godkand,
 * satt via `ADR-104`:s kanalseparation) — det är vad `ADR-102` B3:s spärr
 * kräver innan något rivs.
 *
 * SID-INSETEN är formens, inte en prototyp-gren: `pt-2 lg:pt-10` + `gap-6` och
 * INGEN egen sidopadding. Den gamla skarpa grenen la `p-4` OVANPÅ AppShells
 * egna `px-4 py-4` (AppShell.tsx:38) och stod därför på 32 px inset —
 * dubbelkants-fyndet M6. Facitets inset är 16 px och dubbleras aldrig; jfr
 * `event/index.tsx` och `Hem.tsx`, som lägger noll egen sidopadding. h1 bär
 * sid-rubrikformen `font-semibold text-3xl` (Greeting.tsx:43-44,
 * rubrikpolicyn S64).
 *
 * En stale `?variant=a`-URL (bokmärke, delad länk, öppen flik) är harmlös:
 * ingen fil läser parametern längre, så sidan renderar den enda formen.
 */
function PersonerPage() {
  return (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      <h1 className="font-semibold text-3xl">Personer</h1>
      <PersonsList />
    </section>
  );
}
