import { DetaljGrupp } from '@/components/events/detail/DetaljGrupp';
import { MessageBox } from '@/components/primitives';
import { displayName } from '@/components/registrations/registration-display';
import type { SvepGruppUtfall } from '@/data/mutations/svepSend';
import type { SvepEventGrupp } from './types';

/**
 * [TASK-241.3 AC #2] Sändytans RESULTATLÄGE — per event-grupp (ADR-114
 * beslut 3: fel och delresultat rapporteras PER EVENT, aldrig som en global
 * siffra). PROMOVERAD ur prototypens `dev/svep-prototyp/SvepOverlay.tsx` §
 * `ResultatVy`/`EventUtfallRad`/`StatusText` (TASK-241.1 konvergensvarv 2,
 * Marcus-godkänd facit — se facit-manifestet
 * `tasks/sessions/bilagor/s102-svep-konvergens/facit.json`, lägena
 * `resultat`/`fel-resultat`) — BYTE-IDENTISK form, bara datakällan bytt:
 * `SvepGruppUtfall` (`data/mutations/svepSend.ts`, VERKLIGA
 * `Registration`-objekt) i stället för prototypens simulerade `GruppUtfall`/
 * `SimMottagare`.
 *
 * Regeln från `AtgardsSida.tsx` gäller oförändrat: noll lyckade renderas
 * ALDRIG som grön framgång (`MessageBox`s `intent`/`title`-villkor nedan).
 *
 * `utfall.status` kan (till skillnad från prototypens tre lägen) även vara
 * `'skipped'` — servern har det som en fjärde, giltig klass
 * (`SendActionEmailResultSchema`, ADR-067 D3). En helt hoppad grupp (t.ex.
 * samtliga redan bekräftade) har per definition noll lyckade, och delar
 * därför `EventUtfallRad`s varnings-gren med `'failed'` — samma "noll
 * lyckade = aldrig grönt"-regel, en fjärde färgklass hade inte tillfört
 * något Lotta behöver skilja på.
 */
export function ResultatVy({
  eventGrupper,
  resultat,
}: {
  eventGrupper: SvepEventGrupp[];
  resultat: SvepGruppUtfall[];
}) {
  const eventNamn = new Map(
    eventGrupper.map(
      (g) => [g.event.id, g.event.eventNamn ?? g.event.eventlabel ?? 'Namnlöst event'] as const,
    ),
  );
  const lyckade = resultat.reduce((sum, g) => sum + g.lyckade.length, 0);
  const fallna = resultat.reduce((sum, g) => sum + g.fallna.length, 0);
  const totalt = lyckade + fallna;

  return (
    <div className="flex flex-col gap-6">
      <MessageBox
        intent={fallna === 0 ? 'success' : lyckade === 0 ? 'warning' : 'info'}
        title={
          fallna === 0
            ? 'Utskicket lyckades'
            : lyckade === 0
              ? 'Ingen fick mailet'
              : 'Utskicket lyckades delvis'
        }
      >
        {lyckade > 0 && (
          <p>
            {lyckade} av {totalt} {lyckade === 1 ? 'person fick' : 'personer fick'} mailet.
          </p>
        )}
        {fallna > 0 && (
          <p>
            {fallna} fick det inte. Skälet står på respektive event nedan, och du kan gå tillbaka
            och köra om just de grupperna.
          </p>
        )}
      </MessageBox>

      <DetaljGrupp id="grupp-svep-resultat" rubrik="Utfall per event">
        {resultat.map((g) => (
          <EventUtfallRad
            key={g.eventId}
            utfall={g}
            eventNamn={eventNamn.get(g.eventId) ?? g.eventId}
          />
        ))}
      </DetaljGrupp>
    </div>
  );
}

/** Utfallet som en RAD i husets grupp-kort, inte som ett eget inramat kort
    (samma en-nivå-regel som `Adresslista.tsx`). */
function EventUtfallRad({ utfall, eventNamn }: { utfall: SvepGruppUtfall; eventNamn: string }) {
  const total = utfall.lyckade.length + utfall.fallna.length;
  const intent =
    utfall.status === 'sent' ? 'success' : utfall.status === 'partial' ? 'info' : 'warning';
  return (
    <div className="flex min-w-0 flex-col gap-1.5 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate font-medium text-body">{eventNamn}</span>
        <StatusText intent={intent} lyckade={utfall.lyckade.length} total={total} />
      </div>
      {utfall.fallna.length > 0 && (
        <ul className="flex flex-col gap-1">
          {utfall.fallna.map(({ reg, skal }) => (
            <li key={reg.id} className="text-caption text-text-muted">
              {displayName(reg)}: {skal}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusText({
  intent,
  lyckade,
  total,
}: {
  intent: 'success' | 'info' | 'warning';
  lyckade: number;
  total: number;
}) {
  const klass =
    intent === 'success'
      ? 'text-(--mm-success)'
      : intent === 'info'
        ? 'text-text-secondary'
        : 'text-(--mm-warning)';
  return (
    <span className={`shrink-0 text-caption tabular-nums ${klass}`}>
      {lyckade} av {total} lyckades
    </span>
  );
}
