import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { MallId } from '@/components/dokument/blockDefinitioner';
import { EventValjare } from '@/components/events/EventValjare';
import { Button } from '@/components/primitives/Button';
import { MessageBox } from '@/components/primitives/MessageBox';
import { useForhandsgranskaBilaga } from '@/data/mutations/useForhandsgranskaBilaga';
import { useDataSource } from '@/data/useDataSource';
import { queryKeys } from '@/queries/keys';

export const Route = createFileRoute('/dev/matyta-option-c')({
  // Dev-only engångs-mätyta (ADR-044-mönstret, jfr /dev/sektionsfel och
  // /dev/prototyper): i produktion finns routen i bundlen men är onåbar —
  // beforeLoad kastar redirect före render.
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: '/' });
    }
  },
  staticData: { title: 'Matyta - option C (TASK-340.4)' },
  component: MatytaOptionC,
});

/**
 * ENGÅNGS-MÄTYTA FÖR TASK-340.4 (PRD TASK-340, ADR-124 beslut 5).
 *
 * Frågan denna yta besvarar: scrollar en signerad Storage-URL jämnt när den
 * visas i en cross-origin `<iframe>`, på dator och på telefon? Det är den
 * ENDA fråga ADR-124 beslut 5 låter avgöra option C (inbäddad
 * förhandsgranskning) - forskningspasset
 * (`docs/research/forhandsgranska-spara-atervand-bilageflodet-2026-08-29.md`
 * § 6) fann att den premiss som fällde C 2026-08-22 (WKPDFView, "bara första
 * sidan" på iPhone) är falsifierad sedan iOS 26 (UnifiedPDFPlugin), men att
 * bara Marcus hand kan avgöra om scrollen faktiskt håller.
 *
 * INGEN PRODUKTKOD RÖRS HÄRIFRÅN. `GenereringsVy.tsx`, `DokumentYta.tsx`,
 * `useForhandsgranskaBilaga.ts`, `src/sw.ts` och EF:erna är alla oförändrade
 * - denna fil konsumerar dem, inget mer. Ytan är KASTBAR: den rivs i
 * TASK-340.5 oavsett Marcus dom (håller scrollen öppnas flödets form på nytt
 * i en egen grillning; faller den bokförs en andra bekräftelse i ADR-124).
 *
 * MALL_META nedan är en AVSIKTLIG duplicering av `GenereringsVy.tsx`s
 * privata (oexporterade) `MALL_META`-konst - denna yta får inte röra den
 * filen, och en engångsyta som rivs inom kort motiverar inte en export bara
 * för att undvika två rader duplicering.
 *
 * MÄTFÄLTET under iframen loggar tre saker (research § 6, rekommendation 6):
 *
 *   1. Om Service Workern rör laddningen. `src/sw.ts` loggar INGA
 *      fetch-events (mätt, verifierat mot filen 2026-08-29) - det enda
 *      mätbara härifrån är `navigator.serviceWorker.controller`s närvaro.
 *      Resten (fångar SW:n själva iframe-navigeringen?) kräver DevTools →
 *      Application → Service Workers, instruerat i klartext.
 *   2. Svarshuvudena på ett `200`-svar från Storage, via ett `Range:
 *      bytes=0-0`-anrop (samma teknik forskningspasset använde manuellt).
 *      Ett CORS-fel ÄR ett mätvärde här - det visas i klartext, inte
 *      tystas.
 *   3. `navigator.userAgent` + `navigator.platform`, för att bokföra vilken
 *      iOS-version Marcus telefon kör (research § 6: hela fyndet är
 *      versionsberoende, "≤ iOS 25" mot "iOS 26+").
 */

// Dupliceras avsiktligt ur `GenereringsVy.tsx`s privata `MALL_META` (samma
// två mallar, samma bestämda former, TASK-309.38). Se filhuvudet ovan för
// varför en export inte byggdes för detta.
const MALLAR: { id: MallId; namn: string; namnBestamd: string }[] = [
  { id: 'bekraftelse', namn: 'Bekräftelsebilaga', namnBestamd: 'bekräftelsebilagan' },
  { id: 'deltagarinfo', namn: 'Deltagarinformation', namnBestamd: 'deltagarinformationen' },
];

type HeaderResultat =
  | { status: 'ovald' }
  | { status: 'laddar' }
  | {
      status: 'klart';
      httpStatus: number;
      acceptRanges: string | null;
      contentType: string | null;
      contentDisposition: string | null;
      contentLength: string | null;
    }
  | { status: 'fel'; melding: string };

function useServiceWorkerControllad(): boolean {
  const [controllad, setControllad] = useState(
    () => typeof navigator !== 'undefined' && navigator.serviceWorker?.controller != null,
  );

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const uppdatera = () => setControllad(navigator.serviceWorker.controller != null);
    navigator.serviceWorker.addEventListener('controllerchange', uppdatera);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', uppdatera);
  }, []);

  return controllad;
}

function useHuvudMatning(url: string | null): HeaderResultat {
  const [resultat, setResultat] = useState<HeaderResultat>({ status: 'ovald' });

  useEffect(() => {
    if (url == null) {
      setResultat({ status: 'ovald' });
      return;
    }
    let avbruten = false;
    setResultat({ status: 'laddar' });
    fetch(url, { headers: { Range: 'bytes=0-0' } })
      .then((res) => {
        if (avbruten) return;
        setResultat({
          status: 'klart',
          httpStatus: res.status,
          acceptRanges: res.headers.get('Accept-Ranges'),
          contentType: res.headers.get('Content-Type'),
          contentDisposition: res.headers.get('Content-Disposition'),
          contentLength: res.headers.get('Content-Length'),
        });
      })
      .catch((error: unknown) => {
        if (avbruten) return;
        setResultat({
          status: 'fel',
          melding: error instanceof Error ? error.message : String(error),
        });
      });
    return () => {
      avbruten = true;
    };
  }, [url]);

  return resultat;
}

function MatytaOptionC() {
  const dataSource = useDataSource();
  const { data: events } = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: () => dataSource.fetchEvents(),
  });
  const [eventId, setEventId] = useState<string | null>(null);
  const [mallId, setMallId] = useState<MallId>('bekraftelse');
  const valtEvent = events?.find((e) => e.id === eventId);
  const mall = MALLAR.find((m) => m.id === mallId) ?? MALLAR[0];

  const forhandsgranskning = useForhandsgranskaBilaga();
  const url = forhandsgranskning.data?.url ?? null;

  const swControllad = useServiceWorkerControllad();
  const headerResultat = useHuvudMatning(url);

  return (
    <section className="flex flex-col gap-6 p-4" data-testid="matyta-option-c">
      <div className="flex flex-col gap-2">
        <h1 className="font-semibold text-3xl">Matyta - inbäddad förhandsgranskning (option C)</h1>
        <p className="max-w-prose text-body text-text-secondary">
          Scrolla i PDF:en nedan på dator och telefon. Jämför med när samma PDF öppnas i egen flik.
        </p>
      </div>

      <MessageBox intent="warning" title="Kastbar dev-yta">
        Denna sida rivs i TASK-340.5, oavsett vad du kommer fram till. Ingen produktkod rörs
        härifrån, bara mätning.
      </MessageBox>

      <div className="flex flex-col gap-4">
        <EventValjare
          form="fristaende"
          valtEventId={eventId ?? undefined}
          valtEvent={valtEvent}
          onByte={(id) => setEventId(id)}
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="font-medium text-small text-text-secondary">Mall</legend>
          <div className="flex flex-wrap gap-4">
            {MALLAR.map((m) => (
              <label key={m.id} className="flex items-center gap-2 text-body">
                <input
                  type="radio"
                  name="mall"
                  value={m.id}
                  checked={mallId === m.id}
                  onChange={() => setMallId(m.id)}
                />
                {m.namn}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <Button
            onPress={() => {
              if (eventId == null) return;
              forhandsgranskning.mutate({ eventId, mall: mallId });
            }}
            isLoading={forhandsgranskning.isPending}
            loadingText="Hämtar förhandsgranskningen …"
            isDisabled={eventId == null}
          >
            Hämta förhandsgranskning
          </Button>
        </div>

        {forhandsgranskning.isError ? (
          <MessageBox intent="error" title="Kunde inte hämta förhandsgranskningen">
            {forhandsgranskning.error instanceof Error
              ? forhandsgranskning.error.message
              : 'Inget felmeddelande angavs.'}
          </MessageBox>
        ) : null}
      </div>

      {url != null ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-body text-text-secondary">
              Signerad utkast-URL, giltig till {forhandsgranskning.data?.utgar}.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-small hover:bg-bg-muted motion-safe:transition-colors"
            >
              Öppna i egen flik
              <ExternalLink aria-hidden="true" size={16} />
            </a>
          </div>

          <iframe
            title={`Förhandsgranskning av ${mall.namnBestamd}`}
            src={url}
            data-testid="matyta-option-c-iframe"
            className="min-h-[80vh] w-full rounded-xl border border-border"
          />
        </div>
      ) : null}

      <MatFalt swControllad={swControllad} headerResultat={headerResultat} />
    </section>
  );
}

function MatFalt({
  swControllad,
  headerResultat,
}: {
  swControllad: boolean;
  headerResultat: HeaderResultat;
}) {
  return (
    <dl
      data-testid="matyta-option-c-matfalt"
      className="flex max-w-2xl flex-col gap-4 rounded-xl bg-bg-muted p-4 text-small"
    >
      <div>
        <dt className="font-medium text-text-secondary">1. Rör Service Workern laddningen?</dt>
        <dd className="mt-1">
          {swControllad
            ? 'Sidan kontrolleras just nu av en Service Worker (navigator.serviceWorker.controller finns).'
            : 'Ingen Service Worker kontrollerar sidan just nu (navigator.serviceWorker.controller är tom).'}{' '}
          src/sw.ts loggar inga fetch-events (mätt 2026-08-29, se filens innehåll) - kontrollera i
          stället DevTools, fliken Application, Service Workers, och Network-fliken, för att se om
          SW:n fångar iframens PDF-laddning.
        </dd>
      </div>

      <div>
        <dt className="font-medium text-text-secondary">2. Svarshuvuden (Range 0-0)</dt>
        <dd className="mt-1">
          {headerResultat.status === 'ovald' ? 'Hämta en förhandsgranskning först.' : null}
          {headerResultat.status === 'laddar' ? 'Hämtar …' : null}
          {headerResultat.status === 'fel' ? (
            <>Kunde inte läsa svarshuvudena (troligen CORS): {headerResultat.melding}</>
          ) : null}
          {headerResultat.status === 'klart' ? (
            <dl className="mt-1 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 tabular-nums">
              <dt>HTTP-status</dt>
              <dd>{headerResultat.httpStatus}</dd>
              <dt>Accept-Ranges</dt>
              <dd className="font-mono">{headerResultat.acceptRanges ?? '(saknas)'}</dd>
              <dt>Content-Type</dt>
              <dd className="font-mono">{headerResultat.contentType ?? '(saknas)'}</dd>
              <dt>Content-Disposition</dt>
              <dd className="font-mono">{headerResultat.contentDisposition ?? '(saknas)'}</dd>
              <dt>Content-Length</dt>
              <dd className="font-mono">{headerResultat.contentLength ?? '(saknas)'}</dd>
            </dl>
          ) : null}
        </dd>
      </div>

      <div>
        <dt className="font-medium text-text-secondary">3. Webbläsare och enhet</dt>
        <dd className="mt-1 flex flex-col gap-1 break-words">
          <span>navigator.userAgent: {navigator.userAgent}</span>
          <span>navigator.platform: {navigator.platform}</span>
        </dd>
      </div>
    </dl>
  );
}
