import { AlertTriangle } from 'lucide-react';
import { type FormEvent, type KeyboardEvent, useId, useRef, useState } from 'react';
import { Button, Input, MessageBox, Skeleton } from '@/components/primitives';
import {
  useInbetalningarPerAnmalan,
  useInbetalningarPerPerson,
} from '@/data/betalningar/useBetalningar';
import { useMakuleraInbetalning, useRaderaInbetalning } from '@/data/mutations/inbetalningar';
import { useKvittolank, useSkickaKvittoIgen } from '@/data/mutations/kvitton';
import type { Inbetalning, Kvitto } from '@/domain/schemas';
import { skrivLaddningssida } from '@/lib/skriv-laddningssida';
import { visaKronor } from './belopp-inmatning';
import {
  inbetalningsText,
  kanMakulera,
  kanRadera,
  kvittolage,
  sorteraInbetalningar,
} from './panel-harledningar';

/** Skälets längdgräns — speglar `hantera-inbetalning/index.ts`s `SKAL_MIN_LANGD`/`SKAL_MAX_LANGD`. */
const SKAL_MIN_LANGD = 3;

export type Inbetalningskalla = { anmalanRecordId: string } | { personId: string };

type Props = {
  /** EN anmälan eller EN person. Hämtningen väljs efter formen. */
  kalla: Inbetalningskalla;
  /** Hämta först när ytan faktiskt visas - se hookarnas docblock. */
  aktiv: boolean;
  /** Högst så här många rader. Utelämnad = alla. */
  max?: number;
  /** Vad som står när det inte finns någon inbetalning alls. */
  tomText?: string;
};

/**
 * [TASK-346.7 AC #2/#3/#4] Inbetalningsraderna med KVITTOSTATUS, plus Visa
 * och Skicka igen.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VAD RADEN SVARAR PÅ
 * ═══════════════════════════════════════════════════════════════════════════
 * PRD berättelse 12, ordagrant: "Som Lotta vill jag kunna se och skicka om
 * ett kvitto från raden, så att jag kan svara 'vad skickade vi till Bengt?'
 * utan att be Bengt vidarebefordra." Raden bär därför beloppet, betalsättet,
 * datumet OCH kvittots läge - inte bara en summa.
 *
 * VILKEN KNAPP SOM ERBJUDS ÄR EN HÄRLEDNING, INTE EN BEDÖMNING I JSX.
 * `kvittolage` (`panel-harledningar.ts`) avgör `kanVisa`/`kanSkickaIgen` och
 * har egna tester med negativa kontroller. Ett kvitto som ännu bara är
 * UTFÄRDAT får ingen "Skicka igen" - det väntar på jobbmotorn, och en knapp
 * där hade bett Lotta åtgärda något som redan är på väg.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * "VISA" FÖLJER HUSETS POPUP-SÄKRA MÖNSTER, INTE SITT EGET
 * ═══════════════════════════════════════════════════════════════════════════
 * Länken är SIGNERAD och hämtas asynkront, så adressen finns inte när Lotta
 * klickar. `DokumentYta.tsx` och `GenereringsVy.tsx` löste redan exakt det:
 * öppna fönstret SYNKRONT i klickets egen tick (annars stoppar
 * popup-blockeraren det), skriv en laddningssida i det, och sätt adressen
 * när svaret kommer. Mönstret och dess mätningar bor i
 * `src/lib/skriv-laddningssida.ts` - denna yta återanvänder det i stället
 * för att uppfinna ett tredje.
 *
 * `fonster.closed`-VAKTEN är obligatorisk vid den SENARE, asynkrona
 * href-sättningen: Lotta kan hinna stänga fliken medan EF:en signerar, och
 * att skriva `location.href` på ett stängt fönster kan kasta.
 */
export function InbetalningsLista({ kalla, aktiv, max, tomText }: Props) {
  const anmalanId = 'anmalanRecordId' in kalla ? kalla.anmalanRecordId : '';
  const personId = 'personId' in kalla ? kalla.personId : '';

  // BÅDA hookarna anropas ALLTID (hooks-reglerna), men bara den som hör till
  // källan är `enabled`. Den andra gör inget nätverksanrop alls.
  const perAnmalan = useInbetalningarPerAnmalan(anmalanId, aktiv && anmalanId !== '');
  const perPerson = useInbetalningarPerPerson(personId, aktiv && personId !== '');
  const query = anmalanId !== '' ? perAnmalan : perPerson;

  if (!aktiv) return null;

  if (query.isPending) {
    return (
      <div aria-busy="true" role="status" className="flex flex-col gap-2">
        <span className="sr-only">Laddar inbetalningar ...</span>
        <Skeleton variant="listRow" aria-hidden />
      </div>
    );
  }

  if (query.isError) {
    return (
      <MessageBox intent="error" title="Inbetalningarna kunde inte hämtas">
        {query.error instanceof Error ? query.error.message : 'Okänt fel.'}
      </MessageBox>
    );
  }

  const alla = sorteraInbetalningar(query.data.inbetalningar);
  const rader = max === undefined ? alla : alla.slice(0, max);
  const spegel = query.data.spegel;

  if (rader.length === 0) {
    return (
      <p className="text-small text-text-muted">{tomText ?? 'Ingen inbetalning registrerad än.'}</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* SPEGELNS EFTERSLÄPNING SÄGS RAKT UT (ADR-128 beslut 5: den "SYNS I
          APPEN i stället för att tystas"). Talen kommer ur samma svar, så
          detta kostar inget extra anrop. */}
      {!spegel.iFas && (
        <p className="flex items-center gap-1.5 text-caption text-text-muted">
          <AlertTriangle aria-hidden size={13} className="shrink-0" />
          {`Basen har inte hunnit uppdateras än. Appen har ${visaKronor(spegel.summaPostgres)} kr, basen ${spegel.summaBasen === null ? 'saknar värde' : `${visaKronor(spegel.summaBasen)} kr`}.`}
        </p>
      )}

      <ul className="flex flex-col gap-1">
        {rader.map((inbetalning) => (
          <InbetalningsRad
            key={inbetalning.id}
            inbetalning={inbetalning}
            kvitton={query.data.kvitton}
          />
        ))}
      </ul>

      {max !== undefined && alla.length > rader.length && (
        <p className="text-caption text-text-muted">
          {`Visar ${rader.length} av ${alla.length} inbetalningar.`}
        </p>
      )}
    </div>
  );
}

/** Vilket inline-underläge raden befinner sig i. Bara ETT åt gången (AC #1/#2). */
type Radatgard = 'vy' | 'radera-bekrafta' | 'makulera-skal';

function InbetalningsRad({
  inbetalning,
  kvitton,
}: {
  inbetalning: Inbetalning;
  kvitton: readonly Kvitto[];
}) {
  const lage = kvittolage(inbetalning, kvitton);
  const lank = useKvittolank();
  const skickaIgen = useSkickaKvittoIgen();
  const radera = useRaderaInbetalning();
  const makulera = useMakuleraInbetalning();
  const [skickatTill, setSkickatTill] = useState<string | null>(null);
  const [atgard, setAtgard] = useState<Radatgard>('vy');
  const [skal, setSkal] = useState('');
  const [skalRort, setSkalRort] = useState(false);
  const skalId = useId();

  const makulerad = inbetalning.status === 'makulerad';
  const visaRadera = kanRadera(inbetalning);
  const visaMakulera = kanMakulera(inbetalning);

  // FOKUS-RETUR TILL TRIGGER-KNAPPEN — bara vid AVBRYT/ESC (samma anatomi som
  // `RegistreraYta`/`AterbetalningsYta`). En LYCKAD radering tar bort raden
  // helt (ur listan efter invalidering) och en lyckad makulering tar bort
  // knappen som öppnade panelen (`kanMakulera` blir falsk) — i BÅDA de fallen
  // finns inget meningsfullt fokusmål kvar att återgå till, och det är
  // BOKFÖRT här, inte förbisett: statusraden nedan (`role="status"`) bär då
  // annonseringen i stället för fokus.
  const raderaTriggerRef = useRef<HTMLButtonElement>(null);
  const makuleraTriggerRef = useRef<HTMLButtonElement>(null);

  function avbrytAtgard(returTill?: 'radera' | 'makulera') {
    setAtgard('vy');
    setSkal('');
    setSkalRort(false);
    if (returTill === 'radera') raderaTriggerRef.current?.focus();
    else if (returTill === 'makulera') makuleraTriggerRef.current?.focus();
  }

  function vidRaderaTangent(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      avbrytAtgard('radera');
    }
  }

  function vidMakuleraTangent(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      avbrytAtgard('makulera');
    }
  }

  const skalFel =
    skalRort && skal.trim().length < SKAL_MIN_LANGD
      ? `Skriv ett skäl (minst ${SKAL_MIN_LANGD} tecken).`
      : null;

  function vidMakuleraSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (skal.trim().length < SKAL_MIN_LANGD) {
      setSkalRort(true);
      return;
    }
    makulera.mutate(
      { inbetalningId: inbetalning.id, skal: skal.trim() },
      { onSuccess: () => setAtgard('vy') },
    );
  }

  function visaKvitto() {
    if (lage.kvitto === null) return;
    // SYNKRONT i klickets tick - se komponentens docblock.
    const fonster = window.open('', '_blank');
    skrivLaddningssida(fonster, {
      titel: 'Öppnar kvittot ...',
      text: 'Ett ögonblick, kvittot öppnas här om några sekunder.',
    });
    lank.mutate(lage.kvitto.id, {
      onSuccess: (svar) => {
        if (fonster && !fonster.closed) fonster.location.href = svar.url;
      },
      onError: () => {
        if (fonster && !fonster.closed) fonster.close();
      },
    });
  }

  return (
    /* INGEN `opacity` PÅ EN MAKULERAD RAD - MÄTT, INTE RESONERAT.
       Raden bar `opacity-70` fram till acceptansvandringen 2026-08-31. Axe
       fällde den då med FYRA `color-contrast`-överträdelser (serious): den
       nedtonade texten (`text-text-muted`, #949494 mot #f5f5f3) föll till
       2,77:1, långt under WCAG 2 AA:s 4,5:1 - opaciteten multiplicerar mot en
       färg som redan är dämpad, och just de raderna bär den viktigaste texten
       på ytan ("Makulerad: <skäl>").
       Makuleringen sägs i stället med genomstruken text OCH i klartext på egen
       rad. Båda överlever nedsatt syn; en opacitet gör det inte. */
    <li className="flex flex-col gap-1 rounded bg-bg-muted px-3 py-2 text-small">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={makulerad ? 'line-through' : undefined}>
          {inbetalningsText(inbetalning)}
        </span>
        <span className="flex flex-wrap items-center gap-2 text-text-muted">
          <span>{lage.text}</span>
          {lage.kanVisa && (
            <Button
              intent="secondary"
              emphasis="outline"
              size="sm"
              isLoading={lank.isPending}
              onPress={visaKvitto}
            >
              Visa
            </Button>
          )}
          {lage.kanSkickaIgen && lage.kvitto && (
            <Button
              intent="secondary"
              emphasis="outline"
              size="sm"
              isDisabled={skickaIgen.isPending}
              onPress={() => {
                const kvittoId = lage.kvitto?.id;
                if (kvittoId === undefined) return;
                skickaIgen.mutate(
                  { kvittoId },
                  { onSuccess: (svar) => setSkickatTill(svar.mottagare) },
                );
              }}
            >
              Skicka igen
            </Button>
          )}
          {/* [TASK-346.9 AC #1/#2] Radera/Makulera — bara EN av knapparna kan
              någonsin vara sann samtidigt (`kanRadera`/`kanMakulera` är
              varandras motsatser via `kvittoId`), men villkoren skrivs var
              för sig i stället för `else if`: härledningarna bor i
              `panel-harledningar.ts`, inte i denna JSX. */}
          {atgard === 'vy' && visaRadera && (
            <Button
              ref={raderaTriggerRef}
              intent="ghost"
              size="sm"
              onPress={() => setAtgard('radera-bekrafta')}
            >
              Radera
            </Button>
          )}
          {atgard === 'vy' && visaMakulera && (
            <Button
              ref={makuleraTriggerRef}
              intent="ghost"
              size="sm"
              onPress={() => setAtgard('makulera-skal')}
            >
              Makulera
            </Button>
          )}
        </span>
      </div>

      {makulerad && inbetalning.makuleradSkal && (
        <span className="text-caption text-text-muted">
          {`Makulerad: ${inbetalning.makuleradSkal}`}
        </span>
      )}

      {skickatTill !== null && (
        <span role="status" className="text-caption text-text-muted">
          {`Kvittot skickades till ${skickatTill}.`}
        </span>
      )}

      {/* AC #1: "kan raderas från raden (bekräftelse)". Inline, samma
          "öppnas på plats"-mönster som `RegistreraForm`/`AterbetalningsForm`
          — ingen modal för en engångsfråga. */}
      {atgard === 'radera-bekrafta' && (
        <fieldset
          onKeyDown={vidRaderaTangent}
          className="flex flex-wrap items-center gap-2 rounded border border-border bg-surface px-2 py-2"
        >
          <legend className="sr-only">{`Radera inbetalningen: ${inbetalningsText(inbetalning)}?`}</legend>
          <span className="text-caption">Radera denna inbetalning? Det går inte att ångra.</span>
          <Button
            intent="danger"
            size="sm"
            isLoading={radera.isPending}
            onPress={() => radera.mutate(inbetalning.id, { onSuccess: () => setAtgard('vy') })}
          >
            Radera
          </Button>
          <Button intent="ghost" size="sm" onPress={() => avbrytAtgard('radera')}>
            Avbryt
          </Button>
        </fieldset>
      )}

      {/* AC #2: "får 'Makulera' med skäl (obligatoriskt)". */}
      {atgard === 'makulera-skal' && (
        <form
          onSubmit={vidMakuleraSubmit}
          onKeyDown={vidMakuleraTangent}
          aria-label={`Makulera inbetalningen: ${inbetalningsText(inbetalning)}`}
          className="flex flex-col gap-2 rounded border border-border bg-surface px-2 py-2"
        >
          <Input
            label="Skäl till makuleringen"
            value={skal}
            onChange={(v) => {
              setSkal(v);
              setSkalRort(true);
            }}
            isInvalid={skalFel !== null}
            errorMessage={skalFel ?? undefined}
            aria-describedby={skalId}
          />
          <p id={skalId} className="sr-only">
            Skälet läses av Roger i efterhand och syns på raden.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" intent="danger" size="sm" isLoading={makulera.isPending}>
              Makulera
            </Button>
            <Button intent="ghost" size="sm" onPress={() => avbrytAtgard('makulera')}>
              Avbryt
            </Button>
          </div>
        </form>
      )}

      {lank.isError && (
        <span role="alert" className="text-(color:--mm-input-error-text) text-caption">
          {lank.error.message}
        </span>
      )}
      {skickaIgen.isError && (
        <span role="alert" className="text-(color:--mm-input-error-text) text-caption">
          {skickaIgen.error.message}
        </span>
      )}
      {radera.isError && (
        <span role="alert" className="text-(color:--mm-input-error-text) text-caption">
          {radera.error.message}
        </span>
      )}
      {makulera.isError && (
        <span role="alert" className="text-(color:--mm-input-error-text) text-caption">
          {makulera.error.message}
        </span>
      )}
    </li>
  );
}
