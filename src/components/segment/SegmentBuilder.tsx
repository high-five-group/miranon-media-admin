import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Radio, RadioGroup } from '@/components/primitives/RadioGroup';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import type { Par, SaveSegmentInput, SegmentRule } from '@/domain/schemas';
import { buildSkoolExport, downloadCsv, skoolExportFilename } from '@/lib/segment-export';
import { deriveTaxonomy, labelForPar, parKey } from '@/lib/segment-taxonomy';
import { queryKeys } from '@/queries/keys';
import { SavedSegmentsList } from './SavedSegmentsList';
import { SegmentMailCompose } from './SegmentMailCompose';

type Choice = 'include' | 'exclude' | 'ignorera';

/** Deterministisk regel-signatur (sorterade par-nycklar) → stale-jämförelse. */
function ruleSignature(rule: SegmentRule): string {
  const keys = (pars: Par[]) => pars.map(parKey).sort();
  return JSON.stringify({ include: keys(rule.include), exclude: keys(rule.exclude) });
}

/**
 * Segment-byggar-yta (Fas 6g L2, ADR-064) — Lotta väljer include/exclude-par
 * över EVENT-DOMÄNENS taxonomi (deriveTaxonomy(get-events), självväxande) och
 * får antalet matchande personer ON-DEMAND via compute-segment (strikt
 * Närvaropoäng=1 från KÄLLAN). LÄS-konsumtion — ingen write-affordans (spara =
 * L3, export = L4). Consent visas EJ som filter här (export-tids-fråga, L4).
 *
 * Klartext-spegling gör regeln Gunilla-läsbar. Tomt segment (definierad regel,
 * 0 matchande) visas NEUTRALT — en ärlig signal (basens närvaro ej avstämd än),
 * inte ett feltillstånd. Live-antalet är EXPLICIT ("Räkna antal"), aldrig per
 * tangenttryck — compute-segment är en full-walk (~1012 rader/anrop) som inte
 * får hamras; en ändrad regel markeras "inaktuell" tills man räknar igen.
 *
 * A11y (speglar Intresserade): fokus→<h1> + document.title när data anlänt,
 * aria-live="polite" för antals-resultatet, aria-busy under räkning, RadioGroup
 * tangentbords-navigerbar.
 */
export function SegmentBuilder() {
  const dataSource = useDataSource();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announceRef = useRef(false);
  const [selection, setSelection] = useState<Record<string, Choice>>({});

  const {
    data: events,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: () => dataSource.fetchEvents(),
    // 4xx är klient-fel → meningslöst att retrya (speglar Intresserade).
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  const taxonomy = useMemo(() => (events ? deriveTaxonomy(events) : []), [events]);

  // Bygg regeln ur urvalet (par i taxonomi-ordning → deterministisk).
  const rule = useMemo<SegmentRule>(() => {
    const include: Par[] = [];
    const exclude: Par[] = [];
    for (const par of taxonomy) {
      const choice = selection[parKey(par)];
      if (choice === 'include') include.push(par);
      else if (choice === 'exclude') exclude.push(par);
    }
    return { include, exclude };
  }, [taxonomy, selection]);

  const mutation = useMutation({
    mutationFn: (r: SegmentRule) => dataSource.computeSegment(r),
  });
  const [countedSig, setCountedSig] = useState<string | null>(null);
  // Export-utfall (L4) — null tills man exporterat; rensas vid ny räkning så
  // bekräftelsen aldrig speglar ett gammalt urval.
  const [exportResult, setExportResult] = useState<{
    exported: number;
    excluded: number;
  } | null>(null);

  // Spara segment (L3): namn-input + mutation mot save-segment. onSuccess invaliderar
  // den sparade-listans query (SavedSegmentsList) → listan refetchar, och namnet rensas.
  const queryClient = useQueryClient();
  const [namn, setNamn] = useState('');
  const saveMutation = useMutation({
    mutationFn: (input: SaveSegmentInput) => dataSource.saveSegment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.segment.saved });
      setNamn('');
    },
  });

  const hasInclude = rule.include.length > 0;
  const isStale = countedSig !== null && countedSig !== ruleSignature(rule);
  const canSave = hasInclude && namn.trim().length > 0;

  // Fokus → <h1> + document.title när events anlänt (en gång per laddning).
  useEffect(() => {
    if (events && !announceRef.current) {
      announceRef.current = true;
      headingRef.current?.focus();
      document.title = 'Segment';
    }
  }, [events]);

  function handleCount() {
    const sig = ruleSignature(rule);
    setExportResult(null); // nytt antal → gammal export-bekräftelse är inaktuell
    mutation.mutate(rule, { onSuccess: () => setCountedSig(sig) });
  }

  // Exportera segmentets NUVARANDE medlemmar (det redan beräknade compute-
  // resultatet — ingen parallell compute-väg) till en SKOOL-import-CSV. Filen
  // ÄR frysningen (ingen lagrad lista, b6). Knappen är aktiv först när ett
  // FÄRSKT (ej inaktuellt) antal > 0 finns, så members matchar visad regel.
  const canExport =
    mutation.data !== undefined && !isStale && mutation.data.count > 0 && !mutation.isPending;

  function handleExport() {
    const members = mutation.data?.members ?? [];
    const { csv, exportedCount, excludedCount } = buildSkoolExport(members);
    setExportResult({ exported: exportedCount, excluded: excludedCount });
    if (exportedCount === 0) return; // ladda inte ner en tom fil — meddelande i UI
    downloadCsv(csv, skoolExportFilename(namn.trim() || null, new Date()));
  }

  // Klartext-spegling (svenska) av regeln — samma form som visas i "Det här segmentet".
  // Sparas i Segmentdefinition så både app-listan och Make-vyn är Gunilla-läsbara.
  function buildDefinition(): string {
    const inc = rule.include.map(labelForPar).join(' ELLER ');
    const exc = rule.exclude.map(labelForPar).join(' ELLER ');
    return rule.exclude.length > 0
      ? `Med: deltog i ${inc}. Utan: deltog i ${exc}.`
      : `Med: deltog i ${inc}.`;
  }

  function handleSave() {
    if (!canSave) return;
    saveMutation.mutate({ namn: namn.trim(), rule, definition: buildDefinition() });
  }

  const backLink = (
    <Link to="/mer" className="text-small underline">
      ← Tillbaka till Mer
    </Link>
  );

  if (isPending) {
    return (
      <section className="flex flex-col gap-4 p-4" aria-busy="true">
        {backLink}
        <p role="status" aria-live="polite">
          Laddar kurser…
        </p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex flex-col gap-4 p-4">
        {backLink}
        <MessageBox intent="error" title="Kunde inte hämta kurser">
          {error instanceof Error ? error.message : 'Okänt fel.'}
        </MessageBox>
      </section>
    );
  }

  const includeText = rule.include.map(labelForPar).join(' ELLER ');
  const excludeText = rule.exclude.map(labelForPar).join(' ELLER ');

  return (
    <section className="flex flex-col gap-6 p-4">
      {backLink}

      <header className="flex flex-col gap-1">
        <h1 ref={headingRef} tabIndex={-1} className="font-semibold text-2xl">
          Bygg segment
        </h1>
        <p className="text-small text-text-muted">
          Välj vilka kurser som ska ingå (Inkludera) eller uteslutas (Exkludera). Antalet räknar
          personer med genomförd närvaro (Närvarande eller Deltog online).
        </p>
      </header>

      {taxonomy.length === 0 ? (
        <p className="text-small text-text-muted">Inga kurser i taxonomin än.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {taxonomy.map((par) => {
            const key = parKey(par);
            return (
              <li key={key} className="border-text-muted/20 border-b pb-3">
                <RadioGroup
                  label={labelForPar(par)}
                  orientation="horizontal"
                  value={selection[key] ?? 'ignorera'}
                  onChange={(v) => setSelection((s) => ({ ...s, [key]: v as Choice }))}
                >
                  <Radio value="include">Inkludera</Radio>
                  <Radio value="exclude">Exkludera</Radio>
                  <Radio value="ignorera">Ignorera</Radio>
                </RadioGroup>
              </li>
            );
          })}
        </ul>
      )}

      {/* Klartext-spegling (Gunilla): regeln som läsbar svenska. */}
      <section className="flex flex-col gap-1" aria-label="Sammanfattning av regeln">
        <h2 className="font-medium text-lg">Det här segmentet</h2>
        {hasInclude ? (
          <p className="text-body">
            Med: deltog i <strong>{includeText}</strong>.
            {rule.exclude.length > 0 && (
              <>
                {' '}
                Utan: deltog i <strong>{excludeText}</strong>.
              </>
            )}
          </p>
        ) : (
          <p className="text-small text-text-muted">Välj minst en kurs att inkludera.</p>
        )}
      </section>

      <div className="flex flex-col gap-2">
        <Button
          intent="primary"
          onPress={handleCount}
          isDisabled={!hasInclude || mutation.isPending}
        >
          Räkna antal
        </Button>

        {/* Antals-resultat — annonseras för skärmläsare. */}
        <div aria-live="polite" aria-busy={mutation.isPending}>
          {mutation.isPending && <p className="text-small text-text-muted">Räknar…</p>}

          {mutation.isError && !mutation.isPending && (
            <MessageBox intent="error" title="Kunde inte räkna antal">
              {mutation.error instanceof Error ? mutation.error.message : 'Okänt fel.'}
            </MessageBox>
          )}

          {mutation.data && !mutation.isPending && !mutation.isError && (
            <p className="text-body">
              {isStale ? (
                <span className="text-text-muted">Antalet är inaktuellt — räkna igen.</span>
              ) : mutation.data.count === 0 ? (
                <span>0 personer matchar — inga med genomförd närvaro ännu.</span>
              ) : (
                <span>
                  <strong>{mutation.data.count}</strong>{' '}
                  {mutation.data.count === 1 ? 'person matchar' : 'personer matchar'} den här
                  regeln.
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Exportera till SKOOL-lista (L4, ADR-062 b4/6) — fryser segmentets
          NUVARANDE medlemmar (det redan beräknade compute-resultatet) till en
          nedladdningsbar e-post-CSV. Filen ÄR frysningen (ingen lagrad lista).
          SKOOL = access-ström → consent filtreras EJ (låst i segment-arkitektur.md). */}
      <div className="flex flex-col gap-2 border-text-muted/20 border-t pt-4">
        <h2 className="font-medium text-lg">Exportera till SKOOL-lista</h2>
        <p className="text-small text-text-muted">
          Laddar ner personerna i det här segmentet som en fil du kan importera i SKOOL. Räkna
          antalet först, så ser du vilka som kommer med.
        </p>
        <Button intent="primary" onPress={handleExport} isDisabled={!canExport}>
          Exportera till SKOOL-lista
        </Button>

        {!mutation.data && <p className="text-small text-text-muted">Räkna antalet först.</p>}
        {isStale && (
          <p className="text-small text-text-muted">Räkna antalet igen innan du exporterar.</p>
        )}
        {mutation.data && !isStale && mutation.data.count === 0 && (
          <p className="text-small text-text-muted">Det här segmentet har inga personer än.</p>
        )}

        {/* Export-bekräftelse (Gunilla-läsbar). MessageBox bär role="status" → annonseras artigt. */}
        {exportResult && exportResult.exported > 0 && (
          <MessageBox intent="success" title="Listan laddades ner">
            <p>
              En fil med <strong>{exportResult.exported}</strong>{' '}
              {exportResult.exported === 1 ? 'person' : 'personer'} med e-post laddades ner.
            </p>
            {exportResult.excluded > 0 && (
              <p>
                {exportResult.excluded}{' '}
                {exportResult.excluded === 1
                  ? 'person saknar e-post och kom inte med'
                  : 'personer saknar e-post och kom inte med'}
                .
              </p>
            )}
            <p>Bjud in i grupper om max 500 åt gången i SKOOL.</p>
            <p className="text-small text-text-muted">
              Kontrollera vid första importen att kolumnerna stämmer med SKOOL:s format.
            </p>
          </MessageBox>
        )}
        {exportResult && exportResult.exported === 0 && (
          <MessageBox intent="info" title="Ingen lista att ladda ner">
            Alla i det här segmentet saknar e-post, så det finns ingen lista att importera i SKOOL.
          </MessageBox>
        )}
      </div>

      {/* Spara segment (L3, ADR-065) — namn + spara-knapp; bygger ovanpå den
          härledda regeln. Skriver via save-segment-EF (allowlist-grindad). */}
      <div className="flex flex-col gap-2 border-text-muted/20 border-t pt-4">
        <h2 className="font-medium text-lg">Spara det här segmentet</h2>
        <Input
          label="Namn på segmentet"
          value={namn}
          onChange={setNamn}
          placeholder="t.ex. Fjärrskådning-deltagare"
          isRequired
          isDisabled={saveMutation.isPending}
        />
        <Button
          intent="primary"
          onPress={handleSave}
          isDisabled={!canSave || saveMutation.isPending}
        >
          Spara segment
        </Button>
        {!hasInclude && (
          <p className="text-small text-text-muted">Välj minst en kurs att inkludera först.</p>
        )}

        {/* Spara-utfall — annonseras för skärmläsare. */}
        <div aria-live="polite" aria-busy={saveMutation.isPending}>
          {saveMutation.isPending && <p className="text-small text-text-muted">Sparar…</p>}

          {saveMutation.isError && !saveMutation.isPending && (
            <MessageBox intent="error" title="Kunde inte spara segmentet">
              {saveMutation.error instanceof Error ? saveMutation.error.message : 'Okänt fel.'}
            </MessageBox>
          )}

          {saveMutation.isSuccess && !saveMutation.isPending && (
            <MessageBox intent="success" title="Sparat">
              Segmentet sparades.
            </MessageBox>
          )}
        </div>
      </div>

      <SavedSegmentsList />

      {/* Skicka mail på ett sparat segment (Fas 6h L3, ADR-067) — oåterkallelig
          bulk-handling, pessimistisk + bekräftad + idempotent. */}
      <SegmentMailCompose />
    </section>
  );
}
