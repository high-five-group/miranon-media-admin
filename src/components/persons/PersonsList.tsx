import { useInfiniteQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { parseAsString, useQueryState } from 'nuqs';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { useDataSource } from '@/data/useDataSource';
import type { Person } from '@/domain/models/Person';
import { queryKeys } from '@/queries/keys';

/** Sidstorlek per cursor-sida (ADR-056). EF:n klampar mot Airtables tak (≤100). */
const PAGE_SIZE = 50;

/** Fördröjning innan en sökterm skrivs till URL:en + utlöser server-sökning. */
const SEARCH_DEBOUNCE_MS = 250;

/** Sammansatt visningsnamn ur de namnfält Airtable kan leverera. */
function displayName(person: Person): string {
  if (person.namn) return person.namn;
  const composed = [person.fornamn, person.efternamn].filter(Boolean).join(' ');
  return composed || 'Okänt namn';
}

/** Kontaktrad — e-post och/eller telefon, det som finns. */
function contactLine(person: Person): string | null {
  const parts = [person.email, person.telefon].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

/**
 * Personlista (Fas 6a) — cursor-paginerad (ADR-056) sökbar vy över
 * Personer-tabellen.
 *
 * Datakällan nås via router-context (`useDataSource`, ADR-055) och är
 * källa-agnostisk: `listPersons({ search, cursor, pageSize })` har identisk shape
 * för Airtable (nu) och Supabase (Fas E). Paginering via `useInfiniteQuery` med
 * opak cursor — `cursor` skickas som `pageParam`, ALDRIG i `queryKey`
 * (`queryKeys.persons.search({ q })`). Sök-term i URL (nuqs `?q`); `?page` finns
 * inte längre (numeriska sidor passar inte cursor-modellen — ADR-056).
 *
 * Kolumnvalet följer FAKTISK PersonSchema/get-persons-mappning, inte
 * target-Supabase-modellen: "Nästa event"/"Återkommande?" mappas inte och
 * utelämnas; `antalAnmalningar` är Airtables "Antal anmälningar (totalt)".
 *
 * A11y (11/10): "Ladda fler" är en riktig knapp; fokus BEHÅLLS på den efter
 * laddning (eller flyttas till status-raden när sista sidan nåtts), och antalet
 * nya rader annonseras via en aria-live-region. Ingen scroll-only-mekanism.
 */
export function PersonsList() {
  const dataSource = useDataSource();
  const [q, setQ] = useQueryState('q', parseAsString.withDefault(''));

  // Lokalt input-state för omedelbar tangentbordsrespons; URL/sökning uppdateras
  // debouncat så varje tangenttryck inte blir ett eget server-anrop.
  const [searchInput, setSearchInput] = useState(() => q);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput !== q) setQ(searchInput || null);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchInput, q, setQ]);

  const { data, isPending, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: queryKeys.persons.search({ q }),
      queryFn: ({ pageParam }) =>
        dataSource.listPersons({
          search: q || undefined,
          cursor: pageParam ?? undefined,
          pageSize: PAGE_SIZE,
        }),
      initialPageParam: null as string | null,
      getNextPageParam: (last) => last.nextCursor,
    });

  const persons = data?.pages.flatMap((page) => page.persons) ?? [];

  // A11y: fokus-behållning + annonsering av antal nya rader vid "Ladda fler".
  const loadMoreRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const loadMoreTriggered = useRef(false);
  const prevCountRef = useRef(0);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (isFetchingNextPage) return;
    if (!loadMoreTriggered.current) {
      // Initial laddning eller sök-reset → ingen annons/fokusflytt.
      prevCountRef.current = persons.length;
      return;
    }
    const added = persons.length - prevCountRef.current;
    prevCountRef.current = persons.length;
    loadMoreTriggered.current = false;
    if (added > 0) {
      setAnnouncement(
        `${added} fler ${added === 1 ? 'person' : 'personer'} laddade, ${persons.length} totalt.`,
      );
      // Behåll fokus på "Ladda fler" om den finns kvar; annars (sista sidan
      // nådd → knappen borta) flytta fokus till status-raden så det aldrig tappas.
      if (loadMoreRef.current) loadMoreRef.current.focus();
      else statusRef.current?.focus();
    }
  }, [isFetchingNextPage, persons.length]);

  const searchField = (
    <Input
      label="Sök person"
      hideLabel
      size="lg"
      type="search"
      placeholder="Sök på namn, e-post, telefon eller ort"
      value={searchInput}
      onChange={setSearchInput}
    />
  );

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        {searchField}
        <p role="status" aria-live="polite">
          Laddar personer…
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        {searchField}
        <MessageBox intent="error" title="Kunde inte hämta personer">
          {error instanceof Error ? error.message : 'Okänt fel.'}
        </MessageBox>
      </div>
    );
  }

  const total = persons.length;

  return (
    <div className="flex flex-col gap-4">
      {searchField}

      {/* Dold aria-live-region som annonserar antal nya rader vid "Ladda fler". */}
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <p
        ref={statusRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="text-small text-text-muted"
      >
        {total === 0
          ? q
            ? `Inga träffar för "${q}".`
            : 'Inga personer ännu.'
          : `${total} ${total === 1 ? 'person' : 'personer'} laddade${q ? ` för "${q}"` : ''}${
              hasNextPage ? ' (fler finns)' : ''
            }.`}
      </p>

      {total > 0 && (
        <ul aria-label="Personer" className="flex flex-col gap-3">
          {persons.map((person) => {
            const contact = contactLine(person);
            return (
              <li key={person.id} className="flex flex-col gap-1 border-b pb-3">
                <Link
                  to="/personer/$personId"
                  params={{ personId: person.id }}
                  className="font-medium underline"
                >
                  {displayName(person)}
                </Link>
                {contact && <span className="text-small">{contact}</span>}
                <span className="text-small text-text-muted">
                  {/* Ort visas INTE i scan-listan (hör till detaljvyn); `person.ort`
                      finns korrekt i domän-objektet (string[]) men renderas ej här. */}
                  {[
                    `Anmälningar (totalt): ${person.antalAnmalningar}`,
                    person.erfarenhetsbadge,
                    person.harAktivAnmalan ? `Aktiv anmälan: ${person.harAktivAnmalan}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {hasNextPage && (
        <Button
          ref={loadMoreRef}
          intent="secondary"
          size="md"
          isDisabled={isFetchingNextPage}
          onPress={() => {
            loadMoreTriggered.current = true;
            fetchNextPage();
          }}
        >
          {isFetchingNextPage ? 'Laddar…' : 'Ladda fler'}
        </Button>
      )}
    </div>
  );
}
