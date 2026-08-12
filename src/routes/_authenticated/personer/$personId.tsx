import { createFileRoute } from '@tanstack/react-router';
import { PrototypeSwitcher } from '@/components/dev/PrototypeSwitcher';
import { PersonDetailPrototyp } from '@/components/persons/PersonDetailPrototyp';

export const Route = createFileRoute('/_authenticated/personer/$personId')({
  staticData: { title: 'Persondetalj' },
  component: PersonDetailPage,
});

/**
 * [PROTOTYPE] Persondetalj-passets kvarvarande wiring — D ÄR PROMOVERAD.
 *
 * VILLKORET ÄR FLIPPAT (ADR-103 B2 steg 1, 2026-08-12): `PersonDetailPrototyp`
 * med `variant="d"` renderas OVILLKORLIGT. Den gamla skarpa grenen
 * (`PersonDetail`) renderas inte längre härifrån. Datavägarna behövde inget
 * bevarande — prototypen kör redan samma `useDataSource`/`fetchPerson` som den
 * gjorde, så B2 steg 1:s `protoDataMode`-varning är en no-op för denna yta
 * (verifierat i komponentens egen `useQuery`, inte antaget).
 *
 * A/B/C ÄR RIVNA i samma landning på Marcus order (*"ABC kan du riva om du
 * vill, de är ej relevanta för mig i alla fall"*) — de var jämförelseytor för
 * ett formval som redan är gjort, aldrig kandidater. D:s form är facit.
 *
 * RAILEN STÅR KVAR med avsikt, och det är inte en glömska: ADR-102 B3 förbjuder
 * rivning av prototyp-substratet före Marcus godkännande av den PROMOVERADE
 * ytan, och `check-facit.sh` (c) fäller mekaniskt så länge manifestets
 * `godkand` är null. Den rivs i B2 steg 4, tillsammans med markören i
 * `.facit-policy.conf` — i SAMMA landning, aldrig "sen" (TASK-192:s lärdom om
 * döda markörer).
 *
 * `variant`-PROPEN ÄR OCKSÅ BORTA. Den blev bevisligen död när A/B/C revs —
 * kompilatorn fällde den som oläst — och en prop vars enda möjliga värde är
 * `'d'` bär ingen information. Rail-substratet hänger inte på den utan på
 * `PROTO_VARIANTS` + monteringen nedan, som är vad B3-spärren faktiskt läser.
 *
 * RIVNING (steg 4): ta bort denna kommentar + `PROTO_VARIANTS` +
 * rail-monteringen, och `git mv` `PersonDetailPrototyp.tsx` →
 * `PersonDetail.tsx` så historiken följer FORMEN och inte filnamnet
 * (personlistans precedent, commit 4aad0111).
 */
const PROTO_VARIANTS = [
  // ENDA kvarvarande posten. D är promoverad, inte längre ett val — railen
  // renderas fortfarande enbart för att B3-spärren kräver att substratet lever
  // till godkännandet. Etiketten bär det tillståndet i klartext så railen inte
  // ljuger om att det finns något att växla mellan.
  { key: 'd', label: 'Persondetaljen - promoverad', steg: 2, stegLabel: 'Konvergens' },
];

// Persondetalj (Fas 6a L5a) — aggregerande full-historik-vy via get-person
// (fetchPerson + router-context-DI, ADR-055). Syskon-leaf till personer/index;
// logiken bor i komponenten, routen plockar bara ut param:t.
function PersonDetailPage() {
  const { personId } = Route.useParams();

  return (
    <>
      {/* PROMOVERAD FORM — ovillkorlig. En stale `?variant=`-URL (bokmärke,
          delad länk, öppen flik) är harmlös: ingen kod läser parametern
          längre, så adressen renderar exakt samma träd som ingen query alls.
          Promoverings-grinden bevisar det mekaniskt, inte bara "kraschar
          inte". */}
      <PersonDetailPrototyp personId={personId} />
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
