import { createFileRoute } from '@tanstack/react-router';
import { useQueryState } from 'nuqs';
import { PrototypeSwitcher } from '@/components/dev/PrototypeSwitcher';
import { PersonsList } from '@/components/persons';
import { PersonsListPrototyp } from '@/components/persons/PersonsListPrototyp';

export const Route = createFileRoute('/_authenticated/personer/')({
  staticData: { title: 'Personer' },
  component: PersonerPage,
});

/**
 * [PROTOTYPE] S90 konvergens-pass — KASTBAR WIRING (throwaway-kontraktet).
 *
 * FRÅGAN: "Hur ska Personer-listan se ut när den talar samma visuella språk
 * som resten av appen efter facit-vågen?" Fullständig märkning + steg-logg:
 * `src/components/persons/PersonsListPrototyp.tsx`.
 *
 * EN variant (`?variant=a`) — kortyte-forken är AVGJORD (Marcus, S103
 * 2026-08-10: tonal vann, zebra skrotad). Vinnaren behöll sin nyckel enligt
 * ADR-074 beslut 1, så adressen är oförändrad genom hela konvergensen.
 * `label`/`stegLabel` renderas ingenstans efter ADR-074 Amendering 5 men är
 * obligatoriska i typen; de skrivs som dokumentation. `steg` är enda stället
 * steget syns i UI:t (rail-badgen) och bumpas per fryst steg.
 *
 * RIVNING: ta bort denna kommentar + `PROTO_VARIANTS` + `proto`-grenarna +
 * rail-monteringen, och `git rm` prototyp-komponenten. Skarpa grenen nedan är
 * ORÖRD (`PersonsList` + `p-4`-skalet) — prototypen läggs BREDVID, aldrig i.
 */
const PROTO_VARIANTS = [
  { key: 'a', label: 'Personlistan - konvergens', steg: 11, stegLabel: 'k11' },
];

// Personer-listan (Fas 6a) — sökbar, cursor-paginerad vy (ADR-056) via
// listPersons + router-context-DI (ADR-055). Logiken bor i PersonsList;
// routen håller bara rubrik + montering. Syskon-leaf: personer/$personId
// (detaljvy), <Outlet/> bärs av _authenticated via AppShell (jfr event/).
function PersonerPage() {
  // [PROTOTYPE] DEV-grinden är VÅR — PrototypeSwitcher har ingen egen.
  const [variant] = useQueryState('variant');
  const proto = import.meta.env.DEV && variant === 'a';

  return (
    <>
      {proto ? (
        // [PROTOTYPE] Prototyp-skalet. STEG 2 (k02) — SID-INSETEN.
        // Skarpa skalet står på 32 px inset: AppShells `main` bär redan
        // `px-4 py-4` (AppShell.tsx:38) och routen la `p-4` OVANPÅ
        // (dubbelkants-fyndet M6). Facitets inset är 16 px och dubbleras
        // aldrig — jfr `event/index.tsx` och `Hem.tsx` som lägger NOLL egen
        // sidopadding. Topp-luften `pt-2 lg:pt-10` + radavstånd `gap-6` är
        // samma facit. h1 får sid-rubrikformen `font-semibold text-3xl`
        // (Greeting.tsx:43-44, rubrikpolicyn S64) i stället för klasslös.
        // MÅSTE ligga före k03: varje kortmått mäts annars mot fel bredd.
        <section className="flex flex-col gap-6 pt-2 lg:pt-10">
          <h1 className="font-semibold text-3xl">Personer</h1>
          <PersonsListPrototyp />
        </section>
      ) : (
        <section className="flex flex-col gap-4 p-4">
          <h1>Personer</h1>
          <PersonsList />
        </section>
      )}
      {/* [PROTOTYPE] Rail-monteringen. `data-proto-rail` är snapshot-hooken
          (byggunderlagets R6: railen är `fixed z-50` och hamnar annars i
          bilagebilderna) — dev-överlägget maskas bort via CSS i snapshot-
          specen, aldrig via en app-namnrymds-kollision (R9/L308). */}
      {import.meta.env.DEV && (
        <div data-proto-rail="">
          <PrototypeSwitcher variants={PROTO_VARIANTS} />
        </div>
      )}
    </>
  );
}
