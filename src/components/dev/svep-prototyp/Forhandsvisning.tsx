import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/primitives';
import type { SimEventGrupp } from './types';

export type TestUtfall = { status: 'sent' | 'failed'; reason?: string } | null;

/** Åtgärds-sidans textyta, verbatim (`AtgardsSida.tsx:309` § `TEXTYTA_KLASS`).
    Den fasta höjden är avsiktlig där och kopieras hit av samma skäl: inget
    hoppar när man bläddrar mellan event-grupper. */
const TEXTYTA_KLASS = 'h-[186px] rounded border border-transparent px-3 py-2';

/**
 * [PROTOTYPE, TASK-241.1] Trygghetstriadens ANDRA och TREDJE led:
 * bläddringsbar per-event-förhandsvisning (ADR-114 beslut 2) + testmailet
 * (simulerat). EN triad för HELA svepet, men förhandsvisningen är
 * fortfarande per event.
 *
 * VARV 2 — HÄRMAR ÅTGÄRDS-SIDANS GRANSKNINGSVY RAD FÖR RAD (Marcus-fynd 4 +
 * förstärkningens samma-app-kriterium). Raderna returneras som ett FRAGMENT
 * och monteras som DIREKTA barn till `DetaljGrupp`, exakt som Åtgärds-sidans
 * "Utskicket"-grupp (`AtgardsSida.tsx:2602-2741`) — då bär husets
 * `divide-y divide-border` avdelarna mellan Ämne, texten och Testmail av sig
 * själv, i stället för prototypens egna `gap-3`-luft.
 *
 * TVÅ MEDVETNA AVVIKELSER MOT UPPDRAGETS ORDALYDELSE, båda bokförda i
 * slutrapporten eftersom de följer av att FÖREBILDEN mättes:
 *
 * 1. Ämnesraden förblir etikett-vänster/värde-höger. Uppdraget bad om en
 *    "integrerad mailram" med avsändarkänsla — men Åtgärds-sidan, som samma
 *    uppdrag utpekar som förebild, har varken mailram eller avsändarrad
 *    (grep-verifierat: ingen "Från"/"Avsändare" finns i filen). Den har
 *    exakt denna radgrammatik (`AtgardsSida.tsx:2603-2606`). Det Marcus såg
 *    som "värde i extremhögerkanten" var varv 1:s DIALOGBREDD (52 rem), inte
 *    grammatiken; bredden är åtgärdad i routen i stället.
 * 2. Etiketten "Förhandsvisningsexempel" står kvar — men ENSAM. Uppdragets
 *    punkt 5 ville ha den bort; Åtgärds-sidan bär den ordagrant som HELA
 *    etiketten efter Marcus eget varv 20 (`AtgardsSida.tsx:2617` med
 *    kommentaren "FÖRHANDSVISNINGSEXEMPEL ÄR HELA ETIKETTEN"). Det som
 *    faktiskt bröt 147.6-förbudet var varv 1:s TILLÄGG (" · {eventNamn}") —
 *    det är borta.
 */
export function Forhandsvisning({
  eventGrupper,
  amne,
  mailtext,
  testUtfall,
  testPending,
  testAdress,
  onSkickaTest,
}: {
  eventGrupper: SimEventGrupp[];
  amne: (grupp: SimEventGrupp) => string;
  mailtext: (grupp: SimEventGrupp) => string;
  testUtfall: TestUtfall;
  testPending: boolean;
  /** Avsändarens egen e-post (inloggad användare) — visningstext, samma
      "servern löser adressen"-princip som `AtgardsSida.tsx`. */
  testAdress: string | null;
  onSkickaTest: () => void;
}) {
  const [index, setIndex] = useState(0);
  const grupp = eventGrupper[Math.min(index, eventGrupper.length - 1)];
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
            {grupp.eventNamn} ·{' '}
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

      {/* ÄMNET — `AtgardsSida.tsx:2603-2606`, klass för klass. */}
      <div className="flex items-center justify-between gap-4 py-3">
        <span className="shrink-0 text-small text-text-muted">Ämne</span>
        <span className="truncate text-right text-body">{amne(grupp) || '—'}</span>
      </div>

      {/* UTSKICKET SOM MOTTAGAREN SER DET — `AtgardsSida.tsx:2608-2637`.
          `tabIndex={0}` är WCAG 2.1.1-golvet för en scrollbar region (axe
          scrollable-region-focusable), samma motiv som förlagan. */}
      <div className="py-2.5">
        <p className="pb-1.5 text-caption text-text-muted">Förhandsvisningsexempel</p>
        <p
          // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable) — samma motiv som AtgardsSida.tsx:2624.
          tabIndex={0}
          className={`${TEXTYTA_KLASS} scrollbar-inline overflow-auto whitespace-pre-wrap bg-surface text-body text-text-secondary`}
        >
          {mailtext(grupp)}
        </p>
      </div>

      {/* TESTMAILET — `AtgardsSida.tsx:2708-2741`, klass för klass. Ligger
          medvetet UTANFÖR armerings-grinden: det är ett granskningsverktyg,
          inte en del av sändningen. */}
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
