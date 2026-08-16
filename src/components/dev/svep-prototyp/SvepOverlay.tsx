import { useState } from 'react';
import { useAuth } from '@/auth/useAuth';
import { DetaljGrupp } from '@/components/events/detail/DetaljGrupp';
import { Button, MessageBox, SlideToConfirm } from '@/components/primitives';
import { Adresslista } from './Adresslista';
import { simuleraSand, svepInnehall, totalMottagare } from './data';
import { Forhandsvisning, type TestUtfall } from './Forhandsvisning';
import type { GruppUtfall, Scenario, SimEventGrupp, SvepLage, SvepTyp } from './types';

const ATGARD_NAMN: Record<SvepTyp, string> = {
  bekraftelse: 'Bekräftelsemail',
  paminnelse: 'Påminnelsemail',
};

/**
 * [PROTOTYPE, TASK-241.1] Sändytans overlay-innehåll — konvergensvarv 1.
 * OVERLAY OVANPÅ HEM (Del 10 beslut 1): monteras av routen inuti husets
 * dialog-primitiv (`Modal`/`Dialog`, se `routes/dev/svep-prototyp.tsx`);
 * denna komponent äger bara INNEHÅLLET, aldrig overlay-mekaniken (fokusfälla/
 * Escape/aria kommer från primitiverna).
 *
 * TRE LÄGEN PÅ SAMMA YTA (samma grammatik som `AtgardsSida.tsx`s
 * `GranskningsSida`): granska → skickar → resultat. Sändningen är SIMULERAD
 * (`window.setTimeout`, `data.ts` § `simuleraSand`) — kortets uttryckliga
 * gräns, ingen skarp sändning i prototypen.
 */
export function SvepOverlay({
  svepTyp,
  scenario,
  onClose,
}: {
  svepTyp: SvepTyp;
  scenario: Scenario;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { eventGrupper, amne, mailtext } = svepInnehall(svepTyp, scenario);
  const [lage, setLage] = useState<SvepLage>('granska');
  const [resultat, setResultat] = useState<GruppUtfall[] | null>(null);
  const [armerad, setArmerad] = useState(false);
  const [testUtfall, setTestUtfall] = useState<TestUtfall>(null);
  const [testPending, setTestPending] = useState(false);

  const total = totalMottagare(eventGrupper);
  const kanSkicka = total > 0;

  function skickaTest() {
    setTestPending(true);
    setTestUtfall(null);
    // SIMULERAT — ingen skarp sändning (kortets uttryckliga gräns). Samma
    // "servern löser adressen"-princip som `AtgardsSida.tsx`: knappen visar
    // den inloggade användarens EGEN adress, aldrig en mottagares.
    window.setTimeout(() => {
      setTestPending(false);
      setTestUtfall({ status: 'sent' });
    }, 500);
  }

  function skicka() {
    setLage('skickar');
    window.setTimeout(() => {
      setResultat(simuleraSand(eventGrupper, scenario));
      setLage('resultat');
    }, 700);
  }

  if (lage === 'resultat' && resultat) {
    return <ResultatVy eventGrupper={eventGrupper} resultat={resultat} onClose={onClose} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* INGEN egen sidrubrik här — `Dialog`s `title`-prop (satt av
          `routes/dev/svep-prototyp.tsx`) renderar redan huvudrubriken via
          `<Heading slot="title">` (aria-labelledby-källan, "husets
          dialog-primitiv"). En andra `<h2>` med samma text hade dubblerat
          rubriken visuellt — mätt och rättat under egen-verifieringen
          (skärmdump 10, TASK-241.1). Konsekvens-meningen är därför FÖRSTA
          synliga raden i innehållet. */}
      {kanSkicka && (
        <p className="text-body text-text-secondary">
          <strong className="font-semibold">{ATGARD_NAMN[svepTyp]}</strong> till{' '}
          <strong className="font-semibold text-text text-xl tabular-nums">{total}</strong>{' '}
          {total === 1 ? 'person' : 'personer'} i{' '}
          <strong className="font-semibold text-text text-xl tabular-nums">
            {eventGrupper.length}
          </strong>{' '}
          event.
        </p>
      )}

      {kanSkicka ? (
        <>
          <DetaljGrupp id="grupp-svep-mottagare" rubrik="Mottagare">
            <div className="py-3">
              <Adresslista eventGrupper={eventGrupper} />
            </div>
          </DetaljGrupp>

          <DetaljGrupp id="grupp-svep-utskicket" rubrik="Utskicket">
            <div className="py-1">
              <Forhandsvisning
                eventGrupper={eventGrupper}
                amne={amne}
                mailtext={mailtext}
                testUtfall={testUtfall}
                testPending={testPending}
                testAdress={user?.email ?? null}
                onSkickaTest={skickaTest}
              />
            </div>
          </DetaljGrupp>

          <div className="flex flex-col gap-4">
            <SlideToConfirm
              label={
                svepTyp === 'bekraftelse'
                  ? 'Bekräfta bekräftelsesvepet'
                  : 'Bekräfta påminnelsesvepet'
              }
              prompt="Dra för att bekräfta"
              confirmedLabel="Bekräftat"
              isSelected={armerad}
              onChange={setArmerad}
            />
            <div className="flex items-center gap-2">
              <Button
                intent={armerad ? 'success' : 'primary'}
                isDisabled={!armerad || lage === 'skickar'}
                isLoading={lage === 'skickar'}
                loadingText="Skickar…"
                onPress={skicka}
              >
                Skicka till {total} {total === 1 ? 'person' : 'personer'}
              </Button>
              <Button intent="secondary" onPress={onClose} isDisabled={lage === 'skickar'}>
                Avbryt
              </Button>
            </div>
          </div>
        </>
      ) : (
        <>
          <MessageBox intent="info" title="Inget att skicka just nu">
            {svepTyp === 'bekraftelse'
              ? 'Ingen väntar på bekräftelse längre.'
              : 'Ingen väntar på påminnelse längre.'}
          </MessageBox>
          <div className="flex items-center gap-2">
            <Button intent="primary" onPress={onClose}>
              Tillbaka till Hem
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * RESULTATLÄGET — per event-grupp (ADR-114 beslut 3: fel och delresultat
 * rapporteras PER EVENT, aldrig som en global siffra). Sammanfattningen
 * längst ned speglar `AtgardsSida.tsx`s regel: noll lyckade renderas ALDRIG
 * som grön framgång.
 */
function ResultatVy({
  eventGrupper,
  resultat,
  onClose,
}: {
  eventGrupper: SimEventGrupp[];
  resultat: GruppUtfall[];
  onClose: () => void;
}) {
  const eventNamn = new Map(eventGrupper.map((g) => [g.eventId, g.eventNamn] as const));
  const lyckade = resultat.reduce((sum, g) => sum + g.lyckade.length, 0);
  const fallna = resultat.reduce((sum, g) => sum + g.fallna.length, 0);
  const totalt = lyckade + fallna;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h2 className="font-semibold text-2xl">{lyckade === 0 ? 'Inget skickades' : 'Skickat'}</h2>
      </header>

      <div className="flex flex-col gap-3">
        {resultat.map((g) => (
          <EventUtfallKort
            key={g.eventId}
            utfall={g}
            eventNamn={eventNamn.get(g.eventId) ?? g.eventId}
          />
        ))}
      </div>

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
            <strong>
              {lyckade} av {totalt}
            </strong>{' '}
            {lyckade === 1 ? 'person fick' : 'personer fick'} mailet.
          </p>
        )}
        {fallna > 0 && (
          <p>
            {fallna} fick det inte. Skälet står på respektive event ovan, och du kan gå tillbaka och
            köra om just de grupperna.
          </p>
        )}
      </MessageBox>

      <div className="flex items-center gap-2">
        <Button intent="primary" onPress={onClose}>
          Tillbaka till Hem
        </Button>
      </div>
    </div>
  );
}

function EventUtfallKort({ utfall, eventNamn }: { utfall: GruppUtfall; eventNamn: string }) {
  const total = utfall.lyckade.length + utfall.fallna.length;
  const intent =
    utfall.status === 'sent' ? 'success' : utfall.status === 'partial' ? 'info' : 'warning';
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-(--mm-navcard-border) bg-surface p-3 contrast-more:border-(--mm-navcard-border-contrast)">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate font-medium text-body">{eventNamn}</span>
        <StatusText intent={intent} lyckade={utfall.lyckade.length} total={total} />
      </div>
      {utfall.fallna.length > 0 && (
        <ul className="flex flex-col gap-1">
          {utfall.fallna.map((f) => (
            <li key={f.mottagare.id} className="text-caption text-text-muted">
              {f.mottagare.namn}: {f.skal}
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
