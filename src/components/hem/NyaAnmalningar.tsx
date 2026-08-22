import { Link } from '@tanstack/react-router';
import { CircleCheck } from 'lucide-react';
import { InitialAvatar, MessageBox, Skeleton } from '@/components/primitives';
import { inskickadTid } from '@/components/registrations/registration-display';
import { BulkAtgardsknapp } from './BulkAtgardsknapp';
import type { AnmalningarVy, AnmalningRad } from './hem-derivations';
import { relativTid } from './relativ-tid';
import type { useDashboardRegistrations } from './useDashboardData';

/**
 * "Nya anmälningar" — Morgonkollens tredje block (TASK-243.1, promoverad ur
 * `dev/hem-prototyp/VariantRo.tsx`, facit "hem-vyn V1 Lugna morgonen"):
 * räknar-rubrik + initial-lista (namn / eventidentitet / relativ tid) +
 * "Bekräfta alla" som bulk-ingång (AC #4 — disabladt tills sändflödet finns).
 *
 * Inline-rullning, ALLA rader (AC #5) — ingen kapad lista, ingen extern
 * "Visa alla →"-länk: `max-h-96 overflow-y-auto` bär hela skrollansvaret.
 * `tabIndex={0}` gör ULEN till scrollytans tab-stopp (WCAG 2.1.1, axe
 * scrollable-region-focusable — rader utan `reg.eventId` har ingen egen
 * länk och nås annars aldrig med tangentbord).
 *
 * SKICKAT-MARKÖRERNA (TASK-241.3 AC #3): `nyligenSkickade` är `Hem.tsx`s
 * session-lokala minne av VAD svepet just bekräftade (se dess docblock för
 * hela motivet — status flippar bort från OBEKRAFTAD server-side, så raden
 * annars bara försvinner). Renderas som EGNA rader, sist i samma lista, med
 * en grön bock i stället för relativ tid — samma radgrammatik i övrigt
 * (avatar/namn/identitet), ingen ny visuell nivå. `synligaRader` filtrerar
 * bort ett ID som råkar finnas i BÅDA listorna (ett kort fönster innan
 * query-cachen hunnit refetcha efter svepet) — markörraden vinner alltid,
 * aldrig en dubblettrad med samma nyckel.
 */
export function NyaAnmalningar({
  anmalDataPending,
  regsError,
  registrationsQuery,
  anmalningar,
  nuMs,
  onBekraftaAlla,
  nyligenSkickade,
}: {
  anmalDataPending: boolean;
  regsError: boolean;
  registrationsQuery: ReturnType<typeof useDashboardRegistrations>;
  anmalningar: AnmalningarVy;
  nuMs: number;
  /** [TASK-241.2] Öppnar bekräftelsesvepets sändyta (`Hem.tsx`s `svepOppen`).
      Threading, ingen egen logik här — se `BulkAtgardsknapp.tsx`s docblock
      för de två lägena en `onPress` styr. */
  onBekraftaAlla: () => void;
  /** [TASK-241.3 AC #3] Registreringar svepet FAKTISKT bekräftade denna
      session — `Hem.tsx`s `nyligenSkickadeRader`. Tom array (alltid given
      av `Hem.tsx`) före första svepet. */
  nyligenSkickade: AnmalningRad[];
}) {
  const skickadeIds = new Set(nyligenSkickade.map((rad) => rad.reg.id));
  const synligaRader = anmalningar.rows.filter((rad) => !skickadeIds.has(rad.reg.id));
  const visarNagot = synligaRader.length > 0 || nyligenSkickade.length > 0;

  return (
    <section aria-labelledby="hem-nya-anmalningar" className="flex min-w-0 flex-col gap-4">
      <h2 id="hem-nya-anmalningar" className="font-semibold text-2xl">
        {anmalDataPending ? (
          <Skeleton variant="text" className="w-2/3" />
        ) : (
          `${anmalningar.total} ${anmalningar.total === 1 ? 'ny anmälan' : 'nya anmälningar'} att bekräfta`
        )}
      </h2>
      {regsError ? (
        <MessageBox intent="error" title="Kunde inte hämta anmälningar">
          {registrationsQuery.error instanceof Error
            ? registrationsQuery.error.message
            : 'Inget felmeddelande angavs.'}
        </MessageBox>
      ) : anmalDataPending ? (
        <div role="status" aria-busy="true" className="flex flex-col gap-3">
          <span className="sr-only">Laddar nya anmälningar…</span>
          <Skeleton variant="listRow" />
          <Skeleton variant="listRow" />
        </div>
      ) : !visarNagot ? (
        <p className="flex items-center gap-2 text-body text-text-secondary">
          <CircleCheck aria-hidden="true" size={20} className="shrink-0 text-success" />
          Inga nya anmälningar att bekräfta, läget är under kontroll.
        </p>
      ) : (
        <ul
          // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable) — samma motiv som NyaAnmalningarCard.tsx k112.
          tabIndex={0}
          aria-label="Nya anmälningar att bekräfta"
          className="focus-ring-inset scrollbar-inline flex max-h-96 flex-col gap-1 overflow-y-auto pr-3"
        >
          {synligaRader.map((rad, i) => {
            const inskickadMs = inskickadTid(rad.reg);
            const relTid = Number.isFinite(inskickadMs) ? relativTid(inskickadMs, nuMs) : null;
            return (
              <li
                key={rad.reg.id}
                className={
                  i > 0
                    ? 'border-border-light border-t contrast-more:border-border-strong'
                    : undefined
                }
              >
                {rad.reg.eventId ? (
                  <Link
                    to="/event/$eventId"
                    params={{ eventId: rad.reg.eventId }}
                    className="group flex items-center gap-3 py-3"
                  >
                    <InitialAvatar namn={rad.namn} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium text-body group-hover:underline">
                        {rad.namn}
                      </span>
                      <span className="truncate text-caption text-text-muted">{rad.identitet}</span>
                    </span>
                    {relTid ? (
                      <span className="shrink-0 pl-2 text-caption text-text-muted">{relTid}</span>
                    ) : null}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 py-3">
                    <InitialAvatar namn={rad.namn} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium text-body">{rad.namn}</span>
                      <span className="truncate text-caption text-text-muted">{rad.identitet}</span>
                    </span>
                    {relTid ? (
                      <span className="shrink-0 pl-2 text-caption text-text-muted">{relTid}</span>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
          {nyligenSkickade.map((rad, i) => (
            <li
              key={rad.reg.id}
              className={
                synligaRader.length + i > 0
                  ? 'border-border-light border-t contrast-more:border-border-strong'
                  : undefined
              }
            >
              <div className="flex items-center gap-3 py-3 opacity-70">
                <InitialAvatar namn={rad.namn} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium text-body">{rad.namn}</span>
                  <span className="truncate text-caption text-text-muted">{rad.identitet}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 pl-2 text-caption text-success">
                  <CircleCheck aria-hidden="true" size={14} className="shrink-0" />
                  Bekräftelse skickad
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {anmalningar.total > 0 ? (
        <div className="pt-1">
          <BulkAtgardsknapp label="Bekräfta alla" onPress={onBekraftaAlla} />
        </div>
      ) : null}
    </section>
  );
}
