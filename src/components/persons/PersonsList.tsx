import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { useDataSource } from '@/data/useDataSource';
import type { Person } from '@/domain/models/Person';
import { queryKeys } from '@/queries/keys';

/**
 * Antal personer per sida (klient-paginering).
 */
const PAGE_SIZE = 25;

/**
 * Övre tak för antal personer som hämtas i ett anrop. `get-persons` saknar
 * server-side offset → hela det sökmatchande setet hämtas och paginering sker
 * klient-sida (se queryKeys.persons.search-noten). 1000 ger marginal över
 * dagens 568 records (02-live-state). Växer basen förbi taket trunkeras listan
 * tyst i botten av Namn-sorteringen — en offset-kapabel EF tar bort taket.
 */
const PERSONS_FETCH_LIMIT = 1000;

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
 * Personlista (Fas 6a, Landning 2) — sökbar + paginerad vy över Personer-tabellen.
 *
 * Datakällan nås via router-context (`useDataSource`, ADR-055). Server-sökning
 * via `get-persons` (filterByFormula över Namn/E-post/Telefon/Ort); paginering
 * klient-sida eftersom EF:en saknar offset. URL-state via nuqs (`?q`, `?page`)
 * så vyn överlever reload och kan delas via länk (STATE-STRATEGY §2 Personer).
 *
 * Kolumnvalet följer FAKTISK PersonSchema/get-persons-mappning, inte
 * target-Supabase-modellen: "Nästa event" och "Återkommande?" mappas inte av
 * get-persons (skulle kräva EF-ändring) och utelämnas; `antalAnmalningar` är
 * Airtables "Antal anmälningar (totalt)" och etiketteras därför "totalt".
 */
export function PersonsList() {
  const dataSource = useDataSource();

  const [q, setQ] = useQueryState('q', parseAsString.withDefault(''));
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));

  // Lokalt input-state för omedelbar tangentbordsrespons; URL/sökning uppdateras
  // debouncat så varje tangenttryck inte blir ett eget server-anrop.
  const [searchInput, setSearchInput] = useState(() => q);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput !== q) {
        setQ(searchInput || null);
        setPage(null); // ny sökterm → tillbaka till sida 1
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchInput, q, setQ, setPage]);

  const { data, isPending, isError, error } = useQuery({
    queryKey: queryKeys.persons.search({ q }),
    queryFn: () => dataSource.fetchPersons({ search: q || undefined, limit: PERSONS_FETCH_LIMIT }),
    placeholderData: keepPreviousData,
  });

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

  const total = data.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // Klampa sidnumret mot faktiskt antal sidor (URL kan bära ett för högt värde).
  const currentPage = Math.min(Math.max(page, 1), pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = data.slice(start, start + PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      {searchField}

      <p role="status" aria-live="polite" className="text-small text-text-muted">
        {total === 0
          ? q
            ? `Inga träffar för "${q}".`
            : 'Inga personer ännu.'
          : `${total} ${total === 1 ? 'person' : 'personer'}${q ? ` för "${q}"` : ''}.`}
      </p>

      {total > 0 && (
        <ul aria-label="Personer" className="flex flex-col gap-3">
          {pageItems.map((person) => {
            const contact = contactLine(person);
            return (
              <li key={person.id} className="flex flex-col gap-1 border-b pb-3">
                <span className="font-medium">{displayName(person)}</span>
                {contact && <span className="text-small">{contact}</span>}
                <span className="text-small text-text-muted">
                  {[
                    person.ort,
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

      {pageCount > 1 && (
        <nav className="flex items-center justify-between gap-3" aria-label="Sidnavigering">
          <Button
            intent="secondary"
            size="sm"
            isDisabled={currentPage <= 1}
            onPress={() => setPage(currentPage - 1)}
          >
            Föregående
          </Button>
          <span className="text-small" aria-live="polite">
            Sida {currentPage} av {pageCount}
          </span>
          <Button
            intent="secondary"
            size="sm"
            isDisabled={currentPage >= pageCount}
            onPress={() => setPage(currentPage + 1)}
          >
            Nästa
          </Button>
        </nav>
      )}
    </div>
  );
}
