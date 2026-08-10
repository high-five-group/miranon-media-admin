import { createFileRoute } from '@tanstack/react-router';
import { PrototypeSwitcher } from '@/components/dev/PrototypeSwitcher';
import { PersonsListPrototyp } from '@/components/persons/PersonsListPrototyp';

export const Route = createFileRoute('/_authenticated/personer/')({
  staticData: { title: 'Personer' },
  component: PersonerPage,
});

/**
 * [PROMOVERAD, ADR-103 B2 steg 1 — 2026-08-10] Personlistans form är
 * PROMOVERAD: prototyp-formen är den OVILLKORLIGA, och villkoret
 * (`import.meta.env.DEV && variant === 'a'`) är borta. Den gamla skarpa
 * grenen (`PersonsList` + `p-4`-skalet) renderas inte längre härifrån.
 *
 * Formen som promoverades (Marcus, S103 2026-08-10): tonal kortyta · låst
 * radhöjd · status som egen kolumn med reserverad plats · e-post ensam på
 * kontaktraden · interaktionen avskild med 4 px, utan ikon. Marcus dom på
 * k16: *"Klockan kan tas bort, avståndet räcker."*
 *
 * VAD SOM ÅTERSTÅR (och varför flaggan står kvar): `ADR-102` B3:s spärr —
 * ingen rivning före Marcus godkännande av den PROMOVERADE ytan. Rivningen
 * (B2 steg 4) tar `PROTO_VARIANTS`, rail-monteringen och prototyp-filen, och
 * flyttar formens substans in i `PersonsList`. Det som rivs är villkor och
 * växlar — ALDRIG formen.
 *
 * BEVISET för att flippen tog formen och inget annat:
 * `tests/visual/personer-promoverings-grind.spec.ts` — sex ariaSnapshot-
 * referenser fångade ur variant-läget FÖRE denna flip, nu riktade mot den
 * ovillkorliga ytan. Skiljer trädet sig på en byte fäller grinden.
 *
 * `PROTO_VARIANTS` bär numera `steg: 15` — den stod på 11 medan formen landat
 * till och med k15, en tyst drift genom fyra steg trots docblockets egen
 * bumpnings-kadens. Rättad här eftersom railen fortfarande renderas fram till
 * rivningen; `label`/`stegLabel` renderas ingenstans (ADR-074 Amendering 5)
 * men är obligatoriska i typen och skrivs som dokumentation.
 */
const PROTO_VARIANTS = [
  { key: 'a', label: 'Personlistan - promoverad', steg: 15, stegLabel: 'k15' },
];

// Personer-listan (Fas 6a) — sökbar, cursor-paginerad vy (ADR-056) via
// listPersons + router-context-DI (ADR-055). Logiken bor i PersonsList;
// routen håller bara rubrik + montering. Syskon-leaf: personer/$personId
// (detaljvy), <Outlet/> bärs av _authenticated via AppShell (jfr event/).
function PersonerPage() {
  return (
    <>
      {/* [PROMOVERAD] Skalet är formens, inte en prototyp-gren längre. STEG 2
          (k02) — SID-INSETEN: den gamla skarpa grenen stod på 32 px inset
          eftersom AppShells `main` redan bär `px-4 py-4` (AppShell.tsx:38) och
          routen la `p-4` OVANPÅ (dubbelkants-fyndet M6). Facitets inset är
          16 px och dubbleras aldrig — jfr `event/index.tsx` och `Hem.tsx` som
          lägger NOLL egen sidopadding. Topp-luften `pt-2 lg:pt-10` +
          radavstånd `gap-6` är samma facit. h1 bär sid-rubrikformen
          `font-semibold text-3xl` (Greeting.tsx:43-44, rubrikpolicyn S64). */}
      <section className="flex flex-col gap-6 pt-2 lg:pt-10">
        <h1 className="font-semibold text-3xl">Personer</h1>
        <PersonsListPrototyp />
      </section>
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
