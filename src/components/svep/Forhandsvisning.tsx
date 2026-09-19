import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BilageValjare } from '@/components/attachments/BilageValjare';
import { Button } from '@/components/primitives';
import { useEventAttachments } from '@/data/queries/useEventAttachments';
import type { SvepEventGrupp } from './types';

export type TestUtfall = { status: 'sent' | 'failed'; reason?: string } | null;

/** Åtgärds-sidans textyta, verbatim (`AtgardsSida.tsx` § `TEXTYTA_KLASS`).
    Den fasta höjden är avsiktlig där och kopieras hit av samma skäl: inget
    hoppar när man bläddrar mellan event-grupper. */
const TEXTYTA_KLASS = 'h-[186px] rounded border border-transparent px-3 py-2';

/** [TASK-455] Stabil tom-mängd — en grupp utan egen post i `bilagorPerGrupp`
    (SvepOverlay) har "inget valt", aldrig `undefined`. Modulnivå i stället
    för `new Set()` per render: samma identitet varje gång. Typad som
    `Set<string>` (inte `ReadonlySet`) för att matcha `BilageValjare`s
    `valda`-prop rakt av — den läser bara `.has()`, muterar aldrig sin prop. */
const TOM_MANGD: Set<string> = new Set();

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
 *
 * [TASK-455] BILAGEVÄLJAREN — ETT TILLÄGG mot prototypen, samma klass av
 * ändring som `onGruppVisas` ovan (utvidgning av den stämplade formen, inte
 * en omdesign). Den DELADE `BilageValjare` (`@/components/attachments/
 * BilageValjare`, samma komponent Åtgärds-sidan använder) renderas här, en
 * per bläddrad grupp — `attachments` HÄMTAS HÄR (`useEventAttachments(grupp.
 * event.id)`, samma hook `DokumentYta.tsx`/`GenereringsVy.tsx` delar), men
 * URVALS-STATE ÄGS EN NIVÅ UPP (`bilagorPerGrupp` i `SvepOverlay`) eftersom
 * det måste överleva bläddring bort och tillbaka OCH nå fram till
 * `skicka()`. Samma fördelning som `onGruppVisas`: data lokalt, urval hos
 * föräldern. En kort, teknikfri rad ("tar lite längre tid att skicka")
 * visas när DEN aktuella gruppen har minst en vald bilaga — kortets AC #4,
 * begriplig för Lotta utan att nämna "loopad sändning" eller liknande.
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
  bilagorPerGrupp,
  onVaxlaBilaga,
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
  /** [TASK-455] `eventId → valda Bilagor-record-ID:n` — ägs av `SvepOverlay`,
      se filens docblock. */
  bilagorPerGrupp: Map<string, Set<string>>;
  onVaxlaBilaga: (eventId: string, attachmentId: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const grupp = eventGrupper[Math.min(index, eventGrupper.length - 1)];

  useEffect(() => {
    if (grupp) onGruppVisas?.(grupp);
  }, [grupp, onGruppVisas]);

  const eventNamn = grupp
    ? (grupp.event.eventNamn ?? grupp.event.eventlabel ?? 'Namnlöst event')
    : null;

  /* [TASK-455] Hooken MÅSTE monteras ovillkorat (React-regeln) — precis som
     `SvepOverlay`s egen `useSendActionTestEmail`. `grupp?.event.id ?? null`
     håller frågan avstängd (`useEventAttachments(null)`s `enabled: false`-
     gren) i det extremt sällsynta läget `!grupp` (tomt `eventGrupper`,
     täckt av tidig-return nedan innan något av detta hinner renderas). */
  const attachments = useEventAttachments(grupp?.event.id ?? null);
  const valdaBilagor = grupp ? (bilagorPerGrupp.get(grupp.event.id) ?? TOM_MANGD) : TOM_MANGD;

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

      {/* [TASK-455 AC #1/#2] BILAGEVÄLJAREN — samma delade komponent
          Åtgärds-sidan använder, en PER bläddrad grupp (se filens docblock).
          Ingen förvalslogik: `valdaBilagor` börjar tom för varje grupp som
          inte redan har en post i `bilagorPerGrupp`. */}
      <BilageValjare
        attachments={attachments.data ?? []}
        laddar={attachments.isLoading}
        fel={attachments.isError}
        valda={valdaBilagor}
        onVaxla={(id) => onVaxlaBilaga(grupp.event.id, id)}
      />

      {/* [TASK-455 AC #4] "TAR LÄNGRE TID"-NOTEN — teknikfri (Gunilla-
          principen): ingen nämning av "loopad sändning"/"sekventiell". Syns
          bara för DEN grupp som faktiskt har en vald bilaga just nu. */}
      {valdaBilagor.size > 0 && (
        <p className="pb-1.5 text-caption text-text-muted">
          Den här gruppen har bilagor och tar lite längre tid att skicka.
        </p>
      )}

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
