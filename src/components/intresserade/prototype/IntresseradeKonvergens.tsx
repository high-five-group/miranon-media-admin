/**
 * [PROTOTYPE] IntresseradeKonvergens — B3-konvergenspasset (S114 Del 3
 * beslut 5-6, Marcus-kvitterad riktning 2026-08-31).
 *
 * FRÅGAN SOM BESVARAS: exakt vilken form av Intresserade-sidan är Marcus
 * helt nöjd med?
 *
 * Konvergens-only (divergensen överhoppad öppet — riktningen är redan
 * kvitterad): filen föddes som EXAKT kopia av ../Intresserade.tsx
 * (K0-baslinjen är skarpa vyn på ?variant=null i växlaren), och K-stegen
 * itererar mot riktningen:
 *   (a) personlistans rad-anatomi (namn + e-post som identitetsblock,
 *       4 px-gap, "N dagar sedan · handling" som aktivitetsrad,
 *       hämtnings-badge som egen högerkolumn)
 *   (b) sök + sorteringskontroll (senaste interaktion desc default,
 *       namn A-Ö som växel; INGEN bokstavsrad)
 *   (c) "Namnlös intresserad" — aldrig initialer ur platshållarsträngen
 *   (d) ingen utskicks-affordans (6h-kroken byggs inte här)
 *
 * Kastbar VÄXEL-kod (throwaway-kontraktet ii): formen promoveras vid
 * Marcus stämpel (ADR-102/103/104); det som rivs efteråt är denna
 * variant-gren och fyllnadsläget, aldrig formen.
 *
 * Datavägen ärvs (underform A): fetchIntresserade() via useDataSource —
 * ingen egen adapter, inga mutationer. Fyllnadsläget (?data=fyll) är
 * DEV-lokal minnesdata för FORMBEDÖMNING (staging bär endast 2 leads,
 * mätt i TASK-350) — skalprovs-precedentets form: syntetiska rader med
 * @exempel.invalid + varningsruta som inte går att missa.
 */
import { useQuery } from '@tanstack/react-query';
import { UserRound } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { InitialAvatar } from '@/components/primitives/InitialAvatar';
import { MessageBox } from '@/components/primitives/MessageBox';
import { SidRam } from '@/components/primitives/SidRam';
import { Skeleton } from '@/components/primitives/Skeleton';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import type { Intresserad } from '@/domain/schemas';
import { queryKeys } from '@/queries/keys';

/** Sorteringslägen — konvergensens (b): interaktion (serverns ordning) | namn. */
type Sortering = 'interaktion' | 'namn';

/** Som skarpa vyns displayName, men riktning (c): ordlistans term, aldrig
 * "person" och aldrig initialer ur platshållaren (avatarn särbehandlas). */
function displayName(person: Intresserad): string {
  if (person.namn) return person.namn;
  const composed = [person.fornamn, person.efternamn].filter(Boolean).join(' ');
  if (composed) return composed;
  return 'Namnlös intresserad';
}

function arNamnlos(person: Intresserad): boolean {
  return !person.namn && !person.fornamn && !person.efternamn;
}

/** "N dagar sedan"-texten — medvetet enkel (prototyp; personlistans exakta
 * form ärvs vid promoveringen). */
function dagarText(dagar: number): string {
  if (dagar === 0) return 'i dag';
  if (dagar === 1) return 'i går';
  return `${dagar} dagar sedan`;
}

/** En intresserad i personlistans anatomi (riktning a): identitetsblock +
 * aktivitetsrad + hämtnings-badge som fast högerkolumn. */
function KonvergensRad({ person }: { person: Intresserad }) {
  const namn = displayName(person);
  const namnlos = arNamnlos(person);
  return (
    <li className="flex break-inside-avoid items-center gap-3 border-text-muted/20 border-b pb-3 contrast-more:border-border-strong">
      {namnlos ? (
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg-muted text-text-muted"
        >
          <UserRound className="size-5" />
        </span>
      ) : (
        <InitialAvatar namn={namn} />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{namn}</span>
        {person.email ? (
          <span className="truncate text-small text-text-muted">{person.email}</span>
        ) : null}
        <span className="mt-1 truncate text-caption">
          {person.senasteInteraktion ? (
            <>
              {person.dagarSedanSenaste != null && (
                <span className="font-medium text-text-secondary tabular-nums">
                  {dagarText(person.dagarSedanSenaste)}
                  {' · '}
                </span>
              )}
              <span className="text-text-muted">{person.senasteInteraktion}</span>
            </>
          ) : (
            ' '
          )}
        </span>
      </div>
      <span className="shrink-0 rounded-full bg-bg-muted px-2.5 py-0.5 text-caption text-text-secondary tabular-nums">
        {person.antalHamtningar === 1 ? '1 hämtning' : `${person.antalHamtningar} hämtningar`}
      </span>
    </li>
  );
}

/** DEV-fyllnadsdata för formbedömning (skalprovs-precedentet): 60 syntetiska
 * intresserade, varav var femte namnlös; deterministisk, ren minnesdata. */
const FYLL_NAMN = [
  'Eva Lindqvist',
  'Johan Bergström',
  'Maria Sandell',
  'Per Åkesson',
  'Karin Holm',
  'Lars Öberg',
  'Sofia Ek',
  'Anders Nyström',
  'Helena Falk',
  'Mats Ljung',
  'Åsa Vinter',
  'Erik Sundin',
];
const FYLL_ERBJUDANDEN = [
  'Pyramidernas Vajrar',
  'Meditation för nybörjare',
  'Fjärrskådningsguiden',
  'Introduktion till RIM',
];

function byggFyllnadsdata(): Intresserad[] {
  return Array.from({ length: 60 }, (_, i) => {
    const namnlos = i % 5 === 4;
    const namn = namnlos ? null : `${FYLL_NAMN[i % FYLL_NAMN.length]}`;
    const erbjudande = FYLL_ERBJUDANDEN[i % FYLL_ERBJUDANDEN.length];
    const antal = (i % 6) + 1;
    const dagar = Math.floor(i * 5.2);
    return {
      id: `fyll-${i}`,
      namn,
      fornamn: null,
      efternamn: null,
      email: namnlos && i % 2 === 0 ? null : `fyll-${i}@exempel.invalid`,
      senasteInteraktion: `Hämtade ${erbjudande}`,
      senasteInteraktionDatum: null,
      dagarSedanSenaste: dagar,
      antalHamtningar: antal,
      allaHamtningar: [erbjudande],
    } as unknown as Intresserad;
  });
}

export function IntresseradeKonvergens() {
  const dataSource = useDataSource();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announceRef = useRef(false);
  const [dataMode] = useQueryState('data');
  const [sok, setSok] = useState('');
  const [sortering, setSortering] = useState<Sortering>('interaktion');

  const fyllnad = import.meta.env.DEV && dataMode === 'fyll';

  const {
    data: hamtade,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.intresserade.all,
    queryFn: () => dataSource.fetchIntresserade(),
    enabled: !fyllnad,
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  const intresserade = useMemo(
    () => (fyllnad ? byggFyllnadsdata() : (hamtade ?? [])),
    [fyllnad, hamtade],
  );

  const laddat = fyllnad || !isPending;

  const synliga = useMemo(() => {
    const term = sok.trim().toLocaleLowerCase('sv');
    const traffar = term
      ? intresserade.filter((p) =>
          `${displayName(p)} ${p.email ?? ''}`.toLocaleLowerCase('sv').includes(term),
        )
      : intresserade;
    if (sortering === 'namn') {
      const collator = new Intl.Collator('sv');
      return [...traffar].sort((a, b) => collator.compare(displayName(a), displayName(b)));
    }
    return traffar;
  }, [intresserade, sok, sortering]);

  useEffect(() => {
    if (laddat && !announceRef.current) {
      announceRef.current = true;
      headingRef.current?.focus();
      document.title = 'Intresserade';
    }
  }, [laddat]);

  const sidRam = <SidRam to="/mer" tillbakaEtikett="Tillbaka till Mer" />;

  if (!laddat) {
    return (
      <section className="flex flex-col gap-6">
        {sidRam}
        <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col gap-4 px-4">
          <span className="sr-only">Laddar intresserade…</span>
          <div className="flex flex-col gap-1">
            <Skeleton variant="text" className="w-40 text-3xl" />
            <Skeleton variant="text" className="w-32 text-small" />
          </div>
          <div className="flex flex-col gap-3">
            <Skeleton variant="listRow" />
            <Skeleton variant="listRow" />
            <Skeleton variant="listRow" />
          </div>
        </div>
      </section>
    );
  }

  if (!fyllnad && isError) {
    return (
      <section className="flex flex-col gap-4">
        {sidRam}
        <div className="px-4">
          <MessageBox intent="error" title="Kunde inte hämta intresserade">
            {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
          </MessageBox>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      {sidRam}

      <p className="sr-only" role="status" aria-live="polite">
        Intresserade laddade.
      </p>

      {fyllnad ? (
        <div className="px-4">
          <MessageBox intent="warning" title="Fyllnadsdata för formbedömning">
            60 syntetiska intresserade (@exempel.invalid) visas i stället för verklig data. Växla
            dataläget i prototyp-växlaren för verkliga rader.
          </MessageBox>
        </div>
      ) : null}

      <header className="flex flex-col gap-1 px-4">
        <h1 ref={headingRef} tabIndex={-1} className="font-semibold text-3xl">
          Intresserade
        </h1>
        <p className="text-small text-text-muted">
          {sok.trim()
            ? `${synliga.length} träffar av ${intresserade.length} intresserade`
            : `${intresserade.length} intresserade`}
        </p>
      </header>

      <div className="flex flex-col gap-3 px-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex w-full max-w-xs flex-col gap-1">
          <span className="text-small text-text-muted">Sök intresserad</span>
          <input
            type="search"
            value={sok}
            onChange={(e) => setSok(e.target.value)}
            placeholder="Namn eller e-post"
            className="rounded-lg border border-border-strong/40 bg-bg px-3 py-2 text-body focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
          />
        </label>
        <label className="flex shrink-0 flex-col gap-1">
          <span className="text-small text-text-muted">Sortera efter</span>
          <select
            value={sortering}
            onChange={(e) => setSortering(e.target.value as Sortering)}
            className="rounded-lg border border-border-strong/40 bg-bg px-3 py-2 text-body focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
          >
            <option value="interaktion">Senaste interaktion</option>
            <option value="namn">Namn A till Ö</option>
          </select>
        </label>
      </div>

      {synliga.length === 0 ? (
        <p className="px-4 text-small text-text-muted">
          {sok.trim() ? 'Inga träffar på sökningen.' : 'Inga intresserade än.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-3 px-4">
          {synliga.map((person) => (
            <KonvergensRad key={person.id} person={person} />
          ))}
        </ul>
      )}
    </section>
  );
}
