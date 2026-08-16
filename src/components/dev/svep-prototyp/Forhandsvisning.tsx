import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/primitives';
import type { SimEventGrupp } from './types';

export type TestUtfall = { status: 'sent' | 'failed'; reason?: string } | null;

/**
 * [PROTOTYPE, TASK-241.1] Trygghetstriadens ANDRA och TREDJE led:
 * bläddringsbar per-event-förhandsvisning (ADR-114 beslut 2) + testmailet
 * (simulerat, ingen skarp sändning). EN triad för HELA svepet, men
 * förhandsvisningen är fortfarande per event — Lotta ser exakt det mail
 * varje grupp faktiskt går ut med, inte en sammanslagen mall.
 *
 * Förhandsvisningsexemplet är ifyllt ur den FÖRSTA mottagaren i den
 * VISADE gruppen (samma ärlighetsprincip som `AtgardsSida.tsx`s
 * `fyllPlatshallare` — se `data.ts`).
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
    <div className="flex flex-col gap-3">
      {eventGrupper.length > 1 && (
        <div className="flex items-center justify-between gap-2">
          <Button
            intent="ghost"
            size="sm"
            isDisabled={index === 0}
            onPress={() => setIndex((i) => Math.max(0, i - 1))}
            aria-label="Föregående event"
          >
            <ChevronLeft aria-hidden="true" size={16} />
          </Button>
          <span className="text-caption text-text-muted tabular-nums">
            Event {index + 1} av {eventGrupper.length}
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

      <div className="flex items-center justify-between gap-4 py-1.5">
        <span className="shrink-0 text-small text-text-muted">Ämne</span>
        <span className="truncate text-right text-body">{amne(grupp)}</span>
      </div>

      <div>
        <p className="pb-1.5 text-caption text-text-muted">
          Förhandsvisningsexempel · {grupp.eventNamn}
        </p>
        <p className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-border-light bg-surface p-3 text-body text-text-secondary contrast-more:border-border-strong">
          {mailtext(grupp)}
        </p>
      </div>

      <div className="flex items-start justify-between gap-4 py-1.5">
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
    </div>
  );
}
