import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Hourglass } from 'lucide-react';
import { useDataSource } from '@/data/useDataSource';
import { queryKeys } from '@/queries/keys';

/**
 * [TASK-368.5 AC #4] "N personer väntar på plats" med länk till väntelistan,
 * inuti bekräftelsestegen på anmälans sida.
 *
 * PRD `TASK-368` berättelse 12, ordagrant: *"Som Lotta vill jag se hur många
 * som står på väntelistan när jag avbokar, så att jag kan erbjuda platsen
 * direkt."* Grillad samsyn, beslut 9 (S115 Del 3): *"Väntelistan får en
 * påminnelse med antal och länk i bekräftelsesteget, ingen automatik."*
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TALET FINNS REDAN — INGEN NY LÄSNING UPPFANNS
 * ═══════════════════════════════════════════════════════════════════════════
 * `get-event` returnerar sedan tidigare `vantelista`: antalet AKTIVA
 * event-kopplade Väntelisteplatser via länkfältet `Väntelista (länkat fält)`,
 * med `get-waitlist`s egen aktiv-semantik (NOT `Flyttad till anmälan`) — se
 * `supabase/functions/get-event/index.ts` § beläggningsblocket och
 * `Event.schema.ts`s `vantelista`. Den globala `get-waitlist` bär INGEN
 * event-filtrering (`Waitlist.tsx`: *"Global lista (inget eventId)"*), så
 * eventdetaljen är den enda yta som kan svara på frågan "hur många väntar på
 * DETTA event".
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * HÄMTNINGEN ÄR LAT — ANMÄLANS SIDA LÄSER INTE `get-event` ANNARS
 * ═══════════════════════════════════════════════════════════════════════════
 * `AnmalanDetail` anropar aldrig `get-event`; den EF:en hör till eventsidan
 * (`anmalan-avbokning.acceptance.test.ts` § mocka: registreringen fälldes en
 * gång som död). Komponenten monteras därför BARA när ett bekräftelsesteg är
 * öppet, vilket är det enda läge där svaret används. Anmälans normalladdning
 * är alltså oförändrad — samma disciplin som `AvbokningsBetallage`s
 * flagg-villkorade montering: villkora MONTERINGEN, inte hook-anropet.
 *
 * Nyckeln är eventsidans egen (`queryKeys.events.detail`), så en Lotta som
 * kommer från eventsidan har svaret varmt och ser talet direkt.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TYST VID NOLL, VID OKÄNT OCH VID FEL — ALDRIG ETT PÅSTÅENDE
 * ═══════════════════════════════════════════════════════════════════════════
 * Raden visas ENDAST när talet är känt och större än noll. `vantelista` är
 * `optional` i schemat (ett äldre EF-svar bär det inte), och ett misslyckat
 * anrop ger `undefined` — i båda fallen är "0 personer väntar" en utsaga vi
 * inte kan belägga. Frånvaro av en påminnelse betyder alltså "ingen känd
 * väntelista", aldrig "ingen väntelista". Samma disciplin som
 * `AnmalansBetalningar` § `rad === null`.
 *
 * INGEN AUTOMATIK, INGEN SKRIVNING (AC #4): raden är en länk och ett tal.
 * Väntelisteerbjudandet ligger uttryckligen utanför PRD:ns omfattning.
 */
export function VantelistePaminnelse({ eventId }: { eventId: string }) {
  const dataSource = useDataSource();

  const { data: event } = useQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: () => dataSource.fetchEvent(eventId),
  });

  const antal = event?.vantelista;
  if (antal === undefined || antal <= 0) return null;

  return (
    <p className="my-0 flex flex-wrap items-center gap-2 text-small text-text-secondary">
      <Hourglass aria-hidden="true" size={16} className="shrink-0 text-text-muted" />
      {antal === 1 ? '1 person väntar på plats.' : `${antal} personer väntar på plats.`}
      {/* Fokusringen kommer ur den globala `*:focus-visible`-regeln
          (`src/styles/base.css`), inte ur en egen klass — samma form som
          `FritextRad`s och `AnmalanDetail`s övriga inline-länkar. */}
      <Link to="/mer/vantelista" className="underline underline-offset-2 hover:text-text">
        Öppna väntelistan
      </Link>
    </p>
  );
}
