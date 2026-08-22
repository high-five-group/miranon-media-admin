import { CircleCheck } from 'lucide-react';
import { useMemo } from 'react';
import { InitialAvatar, MessageBox, Skeleton } from '@/components/primitives';
import { BulkAtgardsknapp } from './BulkAtgardsknapp';
import {
  type ForfallenRad,
  type ForfallnaVy,
  forfallenGrupp,
  kortDatum,
  paminnelsedatumText,
} from './hem-derivations';
import type { useDashboardRegistrations } from './useDashboardData';

/**
 * "Förfallna betalningar" — Morgonkollens fjärde block (TASK-243.1,
 * promoverad ur `dev/hem-prototyp/VariantRo.tsx`, facit "hem-vyn V1 Lugna
 * morgonen"): en-påminnelse-modellens TRE tillståndsgrupper (S102 Del 10
 * beslut 7–8), var och en sin egen inline-scroll. "Bekräfta"-svepets
 * syskonknapp ("Skicka påminnelse till alla") lever ENSAM i Att
 * påminna-sektionen (Marcus-låst: svep opererar aldrig på väntar/ring-rader)
 * — och är sedan [TASK-241.4] en RIKTIG, klickbar knapp (`onSkickaPaminnelseAlla`,
 * `BulkAtgardsknapp.tsx`s `onPress`-gren), inte längre den aria-disabled
 * no-op-formen TASK-243.1 lämnade den i.
 *
 * SKICKAT-MARKÖRERNA (TASK-241.4 AC #3): `nyligenPaminda` är `Hem.tsx`s
 * session-lokala minne av VILKA (registrering, avgiftstyp)-rader svepet just
 * påminde — SAMMA mönster som `NyaAnmalningar.tsx`s `nyligenSkickade` (se
 * dess docblock för hela motivet). Live-grupperingen nedan filtrerar bort
 * dessa rader via `paminndaNycklar` (samma `${regId}-${avgiftstyp}`-nyckel
 * som `ForfallenRadInnehall`s React-`key`) så en rad aldrig visas BÅDE som
 * en vanlig "Att påminna"-rad OCH som en markörrad samtidigt under fönstret
 * innan refetchen landar.
 */
export function ForfallnaBetalningar({
  anmalDataPending,
  regsError,
  registrationsQuery,
  forfallna,
  nuMs,
  onSkickaPaminnelseAlla,
  nyligenPaminda,
}: {
  anmalDataPending: boolean;
  regsError: boolean;
  registrationsQuery: ReturnType<typeof useDashboardRegistrations>;
  forfallna: ForfallnaVy;
  nuMs: number;
  /** [TASK-241.4] Öppnar påminnelsesvepets sändyta (`Hem.tsx`s `aktivtSvep`).
      Threading, ingen egen logik här — se `BulkAtgardsknapp.tsx`s docblock
      för de två lägena en `onPress` styr. */
  onSkickaPaminnelseAlla: () => void;
  /** [TASK-241.4 AC #3] Rader svepet FAKTISKT påminde denna session —
      `Hem.tsx`s `nyligenPaminda`. Tom array (alltid given av `Hem.tsx`) före
      första svepet. */
  nyligenPaminda: ForfallenRad[];
}) {
  const paminndaNycklar = useMemo(
    () => new Set(nyligenPaminda.map((rad) => `${rad.reg.id}-${rad.avgiftstyp}`)),
    [nyligenPaminda],
  );
  const grupper = useMemo(() => {
    const attPaminna: ForfallenRad[] = [];
    const vantar: ForfallenRad[] = [];
    const dagsAttRinga: ForfallenRad[] = [];
    for (const rad of forfallna.rows) {
      if (paminndaNycklar.has(`${rad.reg.id}-${rad.avgiftstyp}`)) continue;
      const grupp = forfallenGrupp(rad, nuMs);
      if (grupp === 'att-paminna') attPaminna.push(rad);
      else if (grupp === 'vantar') vantar.push(rad);
      else dagsAttRinga.push(rad);
    }
    return { attPaminna, vantar, dagsAttRinga };
  }, [forfallna.rows, nuMs, paminndaNycklar]);

  return (
    <section aria-labelledby="hem-forfallna" className="flex min-w-0 flex-col gap-4">
      <h2 id="hem-forfallna" className="font-semibold text-2xl">
        {anmalDataPending ? (
          <Skeleton variant="text" className="w-2/3" />
        ) : (
          `${forfallna.total} ${forfallna.total === 1 ? 'förfallen betalning' : 'förfallna betalningar'}`
        )}
      </h2>
      {regsError ? (
        <MessageBox intent="error" title="Kunde inte hämta betalningar">
          {registrationsQuery.error instanceof Error
            ? registrationsQuery.error.message
            : 'Inget felmeddelande angavs.'}
        </MessageBox>
      ) : anmalDataPending ? (
        <div role="status" aria-busy="true" className="flex flex-col gap-3">
          <span className="sr-only">Laddar förfallna betalningar…</span>
          <Skeleton variant="listRow" />
          <Skeleton variant="listRow" />
        </div>
      ) : forfallna.rows.length === 0 ? (
        <p className="flex items-center gap-2 text-body text-text-secondary">
          <CircleCheck aria-hidden="true" size={20} className="shrink-0 text-success" />
          Inga förfallna betalningar.
        </p>
      ) : (
        <div className="flex min-w-0 flex-col gap-6">
          {grupper.attPaminna.length > 0 || nyligenPaminda.length > 0 ? (
            <div className="flex min-w-0 flex-col gap-3">
              <h3
                id="hem-forfallna-paminna"
                className="flex items-center gap-2 font-medium text-caption text-text-secondary uppercase tracking-wide"
              >
                Att påminna
                <span className="rounded-md bg-bg-emphasized px-1.5 py-0.5 font-semibold text-text tabular-nums">
                  {grupper.attPaminna.length}
                </span>
              </h3>
              <ul
                // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable).
                tabIndex={0}
                aria-labelledby="hem-forfallna-paminna"
                className="focus-ring-inset scrollbar-inline flex max-h-96 flex-col gap-1 overflow-y-auto pr-3"
              >
                {grupper.attPaminna.map((rad, i) => (
                  <li
                    key={`${rad.reg.id}-${rad.avgiftstyp}`}
                    className={
                      i > 0
                        ? 'border-border-light border-t contrast-more:border-border-strong'
                        : undefined
                    }
                  >
                    <ForfallenRadInnehall rad={rad} />
                  </li>
                ))}
                {/* [TASK-241.4 AC #3] Nyss påminda — samma markörgrammatik som
                    `NyaAnmalningar.tsx`s "Bekräftelse skickad"-rader, sist i
                    samma lista, ingen ny visuell nivå. */}
                {nyligenPaminda.map((rad, i) => (
                  <li
                    key={`${rad.reg.id}-${rad.avgiftstyp}-skickad`}
                    className={
                      grupper.attPaminna.length + i > 0
                        ? 'border-border-light border-t contrast-more:border-border-strong'
                        : undefined
                    }
                  >
                    <PamindRadInnehall rad={rad} />
                  </li>
                ))}
              </ul>
              <div className="pt-1">
                <BulkAtgardsknapp
                  label="Skicka påminnelse till alla"
                  onPress={onSkickaPaminnelseAlla}
                />
              </div>
            </div>
          ) : null}

          {grupper.vantar.length > 0 ? (
            <div className="flex min-w-0 flex-col gap-3">
              <h3
                id="hem-forfallna-vantar"
                className="font-medium text-caption text-text-secondary uppercase tracking-wide"
              >
                Väntar · {grupper.vantar.length}
              </h3>
              <ul
                // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable).
                tabIndex={0}
                aria-labelledby="hem-forfallna-vantar"
                className="focus-ring-inset scrollbar-inline flex max-h-96 flex-col gap-1 overflow-y-auto pr-3"
              >
                {grupper.vantar.map((rad, i) => (
                  <li
                    key={`${rad.reg.id}-${rad.avgiftstyp}`}
                    className={
                      i > 0
                        ? 'border-border-light border-t contrast-more:border-border-strong'
                        : undefined
                    }
                  >
                    <ForfallenRadInnehall rad={rad} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {grupper.dagsAttRinga.length > 0 ? (
            <div className="flex min-w-0 flex-col gap-3">
              <h3
                id="hem-forfallna-ringa"
                className="flex items-center gap-2 font-medium text-caption text-text-secondary uppercase tracking-wide"
              >
                Dags att ringa
                <span className="rounded-md bg-bg-emphasized px-1.5 py-0.5 font-semibold text-text tabular-nums">
                  {grupper.dagsAttRinga.length}
                </span>
              </h3>
              <ul
                // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable).
                tabIndex={0}
                aria-labelledby="hem-forfallna-ringa"
                className="focus-ring-inset scrollbar-inline flex max-h-96 flex-col gap-1 overflow-y-auto pr-3"
              >
                {grupper.dagsAttRinga.map((rad, i) => (
                  <li
                    key={`${rad.reg.id}-${rad.avgiftstyp}`}
                    className={
                      i > 0
                        ? 'border-border-light border-t contrast-more:border-border-strong'
                        : undefined
                    }
                  >
                    <RingRadInnehall rad={rad} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

/**
 * Rad-innehållet delat av "Att påminna"- och "Väntar"-grupperna.
 *
 * KÄND FACIT-DEFEKT, ÖPPET BOKFÖRD (TASK-243.1 slutrapport) — INTE fixad
 * här: markupen nedan är byte-identisk med den låsta prototypen
 * (`dev/hem-prototyp/VariantRo.tsx` `ForfallenRadInnehall`). Mätt (Playwright
 * `getBoundingClientRect`, 375 px viewport, badge "Påminnelse skickad
 * 2026-09-13"): namn-kolumnen (`min-w-0 flex-1`) klämmer till ~1,7 px bredd
 * — namnet blir praktiskt osynligt — eftersom `shrink-0`-badgen aldrig
 * krymper eller radbryter. INGEN av facitets sex låsta bilder (`facit.json`)
 * visar denna kombination (badge NÄRVARANDE + mobil bredd) — bilderna bevisar
 * alltså inte att formen är avsedd. ADR-102 B2 kräver ett uttryckligt,
 * bokfört Marcus-beslut för varje avsteg från facit — den här filen tar
 * inte det beslutet åt honom. Fix hör hemma i task-243.4 (QA:
 * promoveringsgranskning) eller en uttrycklig Marcus-order.
 */
function ForfallenRadInnehall({ rad }: { rad: ForfallenRad }) {
  const paminnelsedatum = paminnelsedatumText(rad.paminnelseSkickadIso);
  return (
    <div className="flex items-center gap-3 py-3">
      <InitialAvatar namn={rad.namn} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium text-body">{rad.namn}</span>
        <span className="truncate text-caption text-text-muted">
          {rad.avgiftstyp} · {rad.eventNamn}
        </span>
      </span>
      {paminnelsedatum ? (
        <span className="shrink-0 rounded-full bg-surface px-2.5 py-0.5 text-caption text-text-secondary">
          Påminnelse skickad {paminnelsedatum}
        </span>
      ) : null}
    </div>
  );
}

/**
 * [TASK-241.4 AC #3] Nyss påminda-radens innehåll — SAMMA markörgrammatik
 * som `NyaAnmalningar.tsx`s motsvarande rad (`opacity-70` + grön
 * `CircleCheck` + konstaterande copy i stället för den vanliga
 * datum-badgen). Se `Hem.tsx`s docblock för hela minnes-mekaniken.
 */
function PamindRadInnehall({ rad }: { rad: ForfallenRad }) {
  return (
    <div className="flex items-center gap-3 py-3 opacity-70">
      <InitialAvatar namn={rad.namn} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium text-body">{rad.namn}</span>
        <span className="truncate text-caption text-text-muted">
          {rad.avgiftstyp} · {rad.eventNamn}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5 pl-2 text-caption text-success">
        <CircleCheck aria-hidden="true" size={14} className="shrink-0" />
        Påminnelse skickad
      </span>
    </div>
  );
}

/**
 * "Dags att ringa"-radens innehåll (S102 Del 10 beslut 8, Marcus ordagrant):
 * KONSTATERANDE copy, aldrig kommenderande — "Påmind {kortdatum} · obetald"
 * + telefonnummer + personens notering FÖR AVGIFTSTYPEN om satt.
 */
function RingRadInnehall({ rad }: { rad: ForfallenRad }) {
  const datum = kortDatum(rad.paminnelseSkickadIso);
  const notering =
    rad.avgiftstyp === 'Anmälningsavgift'
      ? rad.reg.noteringAnmalningsavgift
      : rad.reg.noteringSlutbetalning;
  return (
    <div className="flex items-start gap-3 py-3">
      <InitialAvatar namn={rad.namn} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-medium text-body">{rad.namn}</span>
        <span className="truncate text-caption text-text-muted">
          {rad.avgiftstyp} · {rad.eventNamn}
        </span>
        <span className="text-caption text-text-secondary">
          {datum ? `Påmind ${datum} · obetald` : 'Obetald'}
          {rad.reg.telefon ? ` · ${rad.reg.telefon}` : ''}
        </span>
        {notering ? (
          <span className="truncate text-caption text-text-muted italic">{notering}</span>
        ) : null}
      </span>
    </div>
  );
}
