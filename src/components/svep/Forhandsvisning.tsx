import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/primitives';
import type { SvepEventGrupp } from './types';

export type TestUtfall = { status: 'sent' | 'failed'; reason?: string } | null;

/** Åtgärds-sidans textyta, verbatim (`AtgardsSida.tsx` § `TEXTYTA_KLASS`).
    Den fasta höjden är avsiktlig där och kopieras hit av samma skäl: inget
    hoppar när man bläddrar mellan event-grupper. */
const TEXTYTA_KLASS = 'h-[186px] rounded border border-transparent px-3 py-2';

/**
 * [TASK-241.2] Trygghetstriadens ANDRA och TREDJE led: bläddringsbar
 * per-event-förhandsvisning (ADR-114 beslut 2) + testmailet (SKARPT, AC #4).
 * EN triad för HELA svepet, men förhandsvisningen är fortfarande per event.
 *
 * PROMOVERAD ur prototypens `dev/svep-prototyp/Forhandsvisning.tsx`
 * (TASK-241.1 konvergensvarv 2, Marcus-godkänd) — BYTE-IDENTISK form (samma
 * klasser, samma "Förhandsvisningsexempel"-etikett, samma ämnesrads-
 * grammatik). Innehållet (`amne`/`mailtext`) kommer nu från `atgardsmallar.ts`s
 * `fyllPlatshallare` mot RIKTIG `Registration`/`Event`-data i stället för
 * prototypens simulerade mallar.
 *
 * `onGruppVisas` är ETT TILLÄGG mot prototypen (dataväg, inte form): sändytan
 * äger `useSendActionTestEmail(eventId, eventNamn)` en nivå upp
 * (`SvepOverlay`), och testmailet ska gälla den grupp Lotta FAKTISKT ser just
 * nu (samma princip som `AtgardsSida.tsx` redan bär: "alltid `forsta.id`,
 * samma person förhandsvisningen ovan redan visar" — generaliserad till
 * "samma person OCH event" i cross-event-formen). Bläddrings-`index`-state
 * stannar LOKALT här (prototypens exakta plats), och `onGruppVisas`
 * notifierar bara föräldern om VILKEN grupp som visas — SvepOverlay styr
 * ingenting av bläddringen.
 */
export function Forhandsvisning({
  eventGrupper,
  amne,
  mailtext,
  testUtfall,
  testPending,
  testAdress,
  onSkickaTest,
  onGruppVisas,
}: {
  eventGrupper: SvepEventGrupp[];
  amne: (grupp: SvepEventGrupp) => string;
  mailtext: (grupp: SvepEventGrupp) => string;
  testUtfall: TestUtfall;
  testPending: boolean;
  /** Avsändarens egen e-post (inloggad användare) — visningstext, samma
      "servern löser adressen"-princip som `AtgardsSida.tsx`. */
  testAdress: string | null;
  onSkickaTest: () => void;
  onGruppVisas?: (grupp: SvepEventGrupp) => void;
}) {
  const [index, setIndex] = useState(0);
  const grupp = eventGrupper[Math.min(index, eventGrupper.length - 1)];

  useEffect(() => {
    if (grupp) onGruppVisas?.(grupp);
  }, [grupp, onGruppVisas]);

  const eventNamn = grupp
    ? (grupp.event.eventNamn ?? grupp.event.eventlabel ?? 'Namnlöst event')
    : null;

  if (!grupp) return null;

  return (
    <>
      {/* BLÄDDRINGEN — eventnamnet är innehållet, positionen bara dess
          ordningstal. Ghost-knappar i husets storlek, samma som testmailets. */}
      {eventGrupper.length > 1 && (
        <div className="flex items-center justify-between gap-2 py-2">
          <Button
            intent="ghost"
            size="sm"
            isDisabled={index === 0}
            onPress={() => setIndex((i) => Math.max(0, i - 1))}
            aria-label="Föregående event"
          >
            <ChevronLeft aria-hidden="true" size={16} />
          </Button>
          <span className="min-w-0 truncate text-center text-caption text-text-muted">
            {eventNamn} ·{' '}
            <span className="tabular-nums">
              {index + 1} av {eventGrupper.length}
            </span>
          </span>
          <Button
            intent="ghost"
            size="sm"
            isDisabled={index === eventGrupper.length - 1}
            onPress={() => setIndex((i) => Math.min(eventGrupper.length - 1, i + 1))}
            aria-label="Nästa event"
          >
            <ChevronRight aria-hidden="true" size={16} />
          </Button>
        </div>
      )}

      {/* ÄMNET — `AtgardsSida.tsx`, klass för klass. */}
      <div className="flex items-center justify-between gap-4 py-3">
        <span className="shrink-0 text-small text-text-muted">Ämne</span>
        <span className="truncate text-right text-body">{amne(grupp) || '—'}</span>
      </div>

      {/* UTSKICKET SOM MOTTAGAREN SER DET — `AtgardsSida.tsx`.
          `tabIndex={0}` är WCAG 2.1.1-golvet för en scrollbar region (axe
          scrollable-region-focusable), samma motiv som förlagan. */}
      <div className="py-2.5">
        <p className="pb-1.5 text-caption text-text-muted">Förhandsvisningsexempel</p>
        <p
          // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable) — samma motiv som AtgardsSida.tsx.
          tabIndex={0}
          className={`${TEXTYTA_KLASS} scrollbar-inline overflow-auto whitespace-pre-wrap bg-surface text-body text-text-secondary`}
        >
          {mailtext(grupp)}
        </p>
      </div>

      {/* TESTMAILET — `AtgardsSida.tsx`. Ligger medvetet UTANFÖR
          armerings-grinden: det är ett granskningsverktyg, inte en del av
          sändningen. */}
      <div className="flex items-start justify-between gap-4 py-3">
        <span className="shrink-0 text-small text-text-muted">Testmail</span>
        <div aria-live="polite" className="flex flex-col items-end gap-1">
          {testUtfall?.status === 'sent' ? (
            <p className="text-small text-text-muted">Skickat till {testAdress ?? 'din adress'}</p>
          ) : (
            <>
              <Button
                intent="ghost"
                size="sm"
                className="data-[hovered]:bg-bg-emphasized"
                isDisabled={testPending}
                onPress={onSkickaTest}
              >
                <Send aria-hidden="true" size={12} className="shrink-0" />
                {testPending ? 'Skickar test…' : 'Skicka till min inkorg'}
              </Button>
              {testUtfall?.status === 'failed' && (
                <p className="text-error text-small">
                  Kunde inte skicka testmailet{testUtfall.reason ? `: ${testUtfall.reason}` : '.'}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
