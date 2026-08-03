// [PROTOTYPE] [S93] hållplats-pass review-fix-våg 2 (uppdraget § FYND 1,
// defekt 1) — kastbar wiring, samma mönster som Deltagare.tsx/Betalningar.tsx:
import { useQueryState } from 'nuqs';
import { useEffect, useRef, useState } from 'react';
import { I18nProvider } from 'react-aria-components';
import { Button } from '@/components/primitives/Button';
import { MessageBox } from '@/components/primitives/MessageBox';
import { useUpdateEvent } from '@/data/mutations/useUpdateEvent';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import { RegistrationSource, RegistrationStatus } from '@/domain/types/Status';
import { AntalFalt } from './AntalFalt';
import { AndraRad, DetaljGrupp, EtikettVardeRad, RedigeringsRad } from './DetaljGrupp';
import { HALLPLATS_PROTO_FIXTURES, isHallplatsVariant } from './hallplats-steg-prototyp';

/**
 * Kategorifärgerna för beläggnings-kompositionen (task-18.2; S73-facit K16 —
 * GitHub-storage-klassen: streck på raderna == segment i stapeln). Färg aldrig
 * ensam bärare — varje kategori har sin siffra i raden; stapeln är dekorativ.
 * Grön/röd undviks (upptagna av Fullt/Inställt-semantiken i familje-grammatiken);
 * reserverade = neutral grå ("hålls", inte deltagare).
 *
 * TOKEN-VAL (öppet bokfört): semantisk beläggnings-roll saknas i semantic.css
 * och token-ytan är consumption-only i denna skiva → PRIMITIV-konsumtion, samma
 * klass som rå-RAC-vägen (saknad token = rå primitiv, komponent-token-lyft är
 * en tokens-ägar-fråga). MEDVETEN FACIT-AVVIKELSE: deltagar-blå är
 * --p-blue-500 (#4a6b8a), INTE facit-renderingens #1b4965 — --p-blue-700 är
 * konstitutionellt EXKLUSIV för fokusringen ("aldrig använd till annat",
 * primitives.css/semantic.css) och prototypens brott mot den absorberas inte
 * (throwaway-kontraktet). Flaggad till design-review (DoD #5).
 */
const KATEGORI = {
  formular: 'bg-(--p-blue-500)',
  manuell: 'bg-(--p-copper-500)',
  medfoljande: 'bg-(--p-gold-500)',
  reserverad: 'bg-(--p-neutral-400)',
} as const;

/**
 * Beläggnings-kompositionen i K16-modellen (mappar basen 1-till-1) — delarna
 * som fyller taket, i den ordning de fyller det (deltagare först, reserverade
 * sist; segmentordningen == mätarens). Saknade fält (stale cache/osatt) → 0.
 *   formular    = viaFormular  (länkade Anmälningar, Källa TOM)
 *   manuell     = manuelltTillagda (basens 'Manuella platser')
 *   medfoljande = medfoljande  (länkade Anmälningar, Källa '+1')
 *   reserverad  = reserverade  (basens 'Extra platser')
 * Väntelista är ALDRIG en del — utanför taket (K22).
 */
function belaggningsDelar(e: Event) {
  return [
    { nyckel: 'formular', klass: KATEGORI.formular, antal: e.viaFormular ?? 0 },
    { nyckel: 'manuell', klass: KATEGORI.manuell, antal: e.manuelltTillagda ?? 0 },
    { nyckel: 'medfoljande', klass: KATEGORI.medfoljande, antal: e.medfoljande ?? 0 },
    { nyckel: 'reserverad', klass: KATEGORI.reserverad, antal: e.reserverade ?? 0 },
  ];
}

/**
 * [PROTOTYPE] [S93] review-fix-våg 2 (uppdraget § FYND 1, defekt 1) —
 * Beläggningens fixtur-härledda tal. Granskningsfynd: sidan visade
 * "Anmälda deltagare 0 · 0 av 20 · 0 %" i `?data=proto` medan Deltagare
 * samtidigt visade fixturernas 12 personer — Beläggning läste ALLTID de
 * riktiga event-aggregaten, oavsett `?data`.
 *
 * K16-kategorierna (delade med Deltagare.tsx:s lokala `kategori()`, samma
 * `Källa`-fält) räknas om ur fixturerna i stället: `formular` = TOM Källa,
 * `manuell` = Källa='Manuell', `medfoljande` = Källa='+1'.
 *
 * ÖPPET BOKFÖRT SNITT: fixtur 14 (Gustav Wik, Källa='Väntelista' — en
 * uppflyttad, redan vanlig anmälan) faller i `formular`-bucketen. Beläggningens
 * komposition har INGEN egen "från väntelistan"-del (bara
 * formulär/manuell/medfoljande/reserverad), och utan denna hade summan
 * landat på 11 i stället för de 12 Deltagare visar — en NY självmotsägelse.
 * `reserverade` ("Extra platser") och `event.vantelista` (en HELT ANNAN
 * tabell, `tbl2VxMx7JMkIxD4Q` — data-model.md) saknar båda en
 * anmälnings-motsvarighet och kan därför INTE härledas ur fixturerna;
 * dimmas i stället med en explicit proto-not i `Belaggning` nedan, i stället
 * för att antingen visa en osann fixtur-noll eller läcka in eventets RIKTIGA
 * värden (vilket instruktionen bara gör undantag för på Max antal platser).
 */
function protoBelaggningsDelar(fixtures: Registration[]) {
  const aktiva = fixtures.filter((r) => r.status !== RegistrationStatus.AVBOKAD);
  const manuell = aktiva.filter((r) => r.kalla === RegistrationSource.MANUELL).length;
  const medfoljande = aktiva.filter((r) => r.kalla === RegistrationSource.MEDFOLJANDE).length;
  const formular = aktiva.length - manuell - medfoljande;
  return { formular, manuell, medfoljande, total: aktiva.length };
}

/**
 * Beläggnings-MÄTAREN (S73-facit K15/K16): caption vänster ("X av Y platser
 * upptagna"), procent höger, segmenterad stapel under (GitHub-storage-klassen)
 * — segmenten == radernas streck, samma ordning som delarna fyller taket.
 * Summan inkluderar reserverade → "upptagna", inte "bokade". TEXTEN är bäraren
 * (a11y — färg/stapel aldrig ensam); stapeln dekorativ (aria-hidden), spill
 * klipps av spåret (överbokning). Utan satt tak står spåret tomt.
 * Delad mellan visnings- och Ändra-läget (morf-pariteten).
 */
function BelaggningsMatare({
  event,
  protoDelar,
}: {
  event: Event;
  /** [PROTOTYPE] [S93] review-fix-våg 2 — mätarens delar härledda ur
      fixturerna (se `protoBelaggningsDelar`); `max` (Max antal platser)
      förblir eventets RIKTIGA värde, instruktionens enda uttryckliga
      undantag. `reserverad` sätts till 0 här (dimmas i radvisningen). */
  protoDelar?: ReturnType<typeof protoBelaggningsDelar>;
}) {
  const max = event.maxPlatser;
  const delar = protoDelar
    ? [
        { nyckel: 'formular', klass: KATEGORI.formular, antal: protoDelar.formular },
        { nyckel: 'manuell', klass: KATEGORI.manuell, antal: protoDelar.manuell },
        { nyckel: 'medfoljande', klass: KATEGORI.medfoljande, antal: protoDelar.medfoljande },
        { nyckel: 'reserverad', klass: KATEGORI.reserverad, antal: 0 },
      ]
    : belaggningsDelar(event);
  const upptagna = delar.reduce((summa, del) => summa + del.antal, 0);
  const full = max != null && max > 0 && upptagna >= max;
  const procent = max != null && max > 0 ? Math.round((upptagna / max) * 100) : null;
  return (
    <div data-testid="belaggning-matare" className="flex flex-col gap-1.5 py-3">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-small text-text-muted">
          {max != null
            ? `${upptagna} av ${max} platser upptagna`
            : `${upptagna} upptagna (platser ej satt)`}
          {full ? ' · Fullt' : ''}
        </span>
        {procent != null && (
          <span className="font-medium text-small text-text-secondary tabular-nums">
            {procent} %
          </span>
        )}
      </div>
      <div aria-hidden="true" className="flex h-1.5 gap-px overflow-hidden rounded-full bg-surface">
        {max != null && max > 0
          ? delar
              .filter((del) => del.antal > 0)
              .map((del) => (
                <div
                  key={del.nyckel}
                  data-testid={`belaggning-segment-${del.nyckel}`}
                  className={`h-full ${del.klass}`}
                  style={{ width: `${Math.min(100, (del.antal / max) * 100)}%` }}
                />
              ))
          : null}
      </div>
    </div>
  );
}

/**
 * Ändra-läget (task-18.2; S73-facit K14–K16): samma sömlösa morf som Om eventet
 * (Δ=0 px DOM-mätt) på basens TRE skrivbara number-fält — Max antal platser ·
 * Extra platser · Manuellt tillagda ('Manuella platser'). Etiketten "Extra
 * platser" är basens eget fältnamn (Marcus-beslut 2026-07-22, review-våg 1)
 * — löser termkollisionen mot kortens "platser reserverade" (ORDLISTA
 * "Reserverad plats"); läs-shapens fältnamn `reserverade` består.
 * Via formulär/Medföljande/Väntelista är HÄRLEDDA räkningar och står kvar som
 * läsrader (kontext, inte fält). Likbredds-regeln per-FORMULÄR (K15): w-32 —
 * antal-fält behöver inte textfältens 240 px. Spara skriver via
 * uppdatera-event-vertikalen (pessimistisk mutation; useUpdateEvent) —
 * icke-null-fält som absoluta värden; tömda fält utelämnas ("ändra inte").
 */
function BelaggningForm({ event, onStang }: { event: Event; onStang: () => void }) {
  const [maxPlatser, setMaxPlatser] = useState<number | null>(event.maxPlatser);
  const [reserverade, setReserverade] = useState<number | null>(event.reserverade ?? null);
  const [manuellt, setManuellt] = useState<number | null>(event.manuelltTillagda ?? null);
  const mutation = useUpdateEvent(event.id);

  const spara = () => {
    const payload = {
      ...(maxPlatser != null ? { maxPlatser } : {}),
      ...(reserverade != null ? { reserverade } : {}),
      ...(manuellt != null ? { manuelltTillagda: manuellt } : {}),
    };
    // Alla tre tömda → inget att skriva (EF kräver minst ett fält): stäng tyst.
    if (Object.keys(payload).length === 0) {
      onStang();
      return;
    }
    mutation.mutate(payload, { onSuccess: onStang });
  };

  return (
    <I18nProvider locale="sv-SE">
      <dl className="divide-y divide-border">
        <RedigeringsRad
          term="Max antal platser"
          nuvarande={event.maxPlatser != null ? String(event.maxPlatser) : null}
          slotKlass="w-32"
        >
          <AntalFalt
            label="Max antal platser"
            value={maxPlatser}
            onChange={setMaxPlatser}
            autoFocus
          />
        </RedigeringsRad>
        <RedigeringsRad
          term="Extra platser"
          streck={KATEGORI.reserverad}
          nuvarande={event.reserverade != null ? String(event.reserverade) : null}
          slotKlass="w-32"
        >
          <AntalFalt label="Extra platser" value={reserverade} onChange={setReserverade} />
        </RedigeringsRad>
        <EtikettVardeRad term="Anmälda deltagare" streck={KATEGORI.formular}>
          {String(event.viaFormular ?? 0)}
        </EtikettVardeRad>
        <RedigeringsRad
          term="Manuellt tillagda"
          streck={KATEGORI.manuell}
          nuvarande={event.manuelltTillagda != null ? String(event.manuelltTillagda) : null}
          slotKlass="w-32"
        >
          <AntalFalt label="Manuellt tillagda" value={manuellt} onChange={setManuellt} />
        </RedigeringsRad>
        <EtikettVardeRad term="Medföljande" streck={KATEGORI.medfoljande}>
          {event.medfoljande != null ? String(event.medfoljande) : null}
        </EtikettVardeRad>
        {/* K22: läsrad även i Ändra-läget (extern räkning, aldrig fält; utan streck). */}
        <EtikettVardeRad term="Väntelista">{String(event.vantelista ?? 0)}</EtikettVardeRad>
      </dl>
      <BelaggningsMatare event={event} />
      {/* Fel-ytan under mätaren (geometri-mätningen sker i felfri väg); morfen
          förblir öppen — inga ändringar tappas tyst (Om eventet-mönstret). */}
      {mutation.isError && (
        <div className="py-3">
          <MessageBox intent="error" title="Kunde inte spara ändringarna">
            {mutation.error instanceof Error ? mutation.error.message : 'Okänt fel.'}
          </MessageBox>
        </div>
      )}
      {/* Spara/Avbryt ersätter Ändra-raden PÅ SAMMA plats och höjd
          (py-2 + 32 px-knappar == Ändra-radens py-3 + 24 px = 48 px). */}
      <div className="flex items-center justify-center gap-2 py-2">
        <Button size="sm" intent="primary" onPress={spara} isDisabled={mutation.isPending}>
          {mutation.isPending ? 'Sparar…' : 'Spara'}
        </Button>
        <Button size="sm" intent="secondary" onPress={onStang} isDisabled={mutation.isPending}>
          Avbryt
        </Button>
      </div>
    </I18nProvider>
  );
}

/**
 * Beläggnings-gruppen (task-18.2; S73-facit K14–K22, PRD task-18 beslut 5):
 * innehållsmodellen som mappar basen 1-till-1 — Marcus-radordningen (taket
 * först, sedan kategorierna som fyller det; K16), streck-markörer == mätarens
 * segment, Väntelista-raden ALLTID med utanför taket (K22, utan streck) — och
 * Ändra-morfen på de tre skrivbara fälten. Fokus-kontinuitet som Om eventet:
 * morfen öppnas → första fältet (autoFocus); stängs → tillbaka till
 * Ändra-knappen.
 */
export function Belaggning({ event }: { event: Event }) {
  const [redigerar, setRedigerar] = useState(false);
  const andraKnappRef = useRef<HTMLButtonElement>(null);
  const varRedigerad = useRef(false);

  // [PROTOTYPE] [S93] hållplats-pass review-fix-våg 2 (uppdraget § FYND 1,
  // defekt 1) — samma DEV-grindade, oberoende `useQueryState`-läsning som
  // Deltagare.tsx/Betalningar.tsx/Gruppdynamik.tsx (nuqs synkar). Utan
  // ?variant renderas EXAKT dagens träd.
  const [variantParam] = useQueryState('variant');
  const [dataParam] = useQueryState('data');
  // [PROTOTYPE] [S93] fix-våg (uppdraget § D, Marcus punkt 3 — knappen gjorde
  // inget): PrototypeSwitcher togglar `?data=` mellan null och 'verklig'
  // (S90-kontraktet) — i variant-läge är FIXTURERNA default, `?data=verklig`
  // ger riktig data. Den inverterade `=== 'proto'`-kontrollen läste ett
  // värde växlaren aldrig satte.
  const protoDataMode =
    import.meta.env.DEV && isHallplatsVariant(variantParam) && dataParam !== 'verklig';
  const protoDelar = protoDataMode ? protoBelaggningsDelar(HALLPLATS_PROTO_FIXTURES) : null;

  // Fokus-retur: när morfen just stängts (redigerar true → false) fokuseras
  // Ändra-knappen — utan detta tappas tangentbordsfokus till <body>.
  useEffect(() => {
    if (!redigerar && varRedigerad.current) {
      andraKnappRef.current?.focus();
    }
    varRedigerad.current = redigerar;
  }, [redigerar]);

  return (
    <DetaljGrupp id="grupp-belaggning" rubrik="Beläggning">
      {redigerar && !protoDataMode ? (
        <BelaggningForm event={event} onStang={() => setRedigerar(false)} />
      ) : (
        <>
          {protoDataMode && (
            <p className="pt-3 text-caption text-text-muted">
              Förhandsvisning (proto) — talen nedan (utom Max antal platser, eventets riktiga värde)
              är härledda ur fixturunderlaget; Ändra är inaktiverad, inget sparas.
            </p>
          )}
          <dl className="divide-y divide-border">
            <EtikettVardeRad term="Max antal platser">
              {event.maxPlatser != null ? String(event.maxPlatser) : null}
            </EtikettVardeRad>
            {/* [PROTOTYPE] [S93] "Extra platser" är ett rent admin-satt tal
                (basens 'Reserverade av Roger och Lotta') utan anmälnings-
                motsvarighet — se `protoBelaggningsDelar`s docblock för varför
                det INTE går att härleda ur fixturerna. Dimmas i stället för
                att antingen visa en osann fixtur-noll eller läcka in eventets
                riktiga värde (instruktionens enda uttryckliga undantag är
                Max antal platser). */}
            <EtikettVardeRad term="Extra platser" streck={KATEGORI.reserverad}>
              {protoDataMode ? (
                <span className="text-text-muted">Ej i fixturunderlaget (proto)</span>
              ) : event.reserverade != null ? (
                String(event.reserverade)
              ) : null}
            </EtikettVardeRad>
            <EtikettVardeRad term="Anmälda deltagare" streck={KATEGORI.formular}>
              {String(protoDelar ? protoDelar.formular : (event.viaFormular ?? 0))}
            </EtikettVardeRad>
            <EtikettVardeRad term="Manuellt tillagda" streck={KATEGORI.manuell}>
              {protoDelar
                ? String(protoDelar.manuell)
                : event.manuelltTillagda != null
                  ? String(event.manuelltTillagda)
                  : null}
            </EtikettVardeRad>
            <EtikettVardeRad term="Medföljande" streck={KATEGORI.medfoljande}>
              {protoDelar
                ? String(protoDelar.medfoljande)
                : event.medfoljande != null
                  ? String(event.medfoljande)
                  : null}
            </EtikettVardeRad>
            {/* K22: Väntelistan ALLTID med — det är alternativet när taket är
                nått. UTAN streck: väntande upptar inga platser (aldrig segment
                i mätaren) — streck-grammatiken bär innanför/utanför-taket.
                [PROTOTYPE] [S93]: basens 'Väntelista' är en HELT ANNAN tabell
                (tbl2VxMx7JMkIxD4Q) utan motsvarighet i Anmälnings-fixturerna
                — samma "genuint orimlig"-dimning som Extra platser ovan. */}
            <EtikettVardeRad term="Väntelista">
              {protoDataMode ? (
                <span className="text-text-muted">Ej i fixturunderlaget (proto)</span>
              ) : (
                String(event.vantelista ?? 0)
              )}
            </EtikettVardeRad>
          </dl>
          <BelaggningsMatare event={event} protoDelar={protoDelar ?? undefined} />
          <AndraRad
            buttonRef={andraKnappRef}
            onPress={() => setRedigerar(true)}
            disabled={protoDataMode}
          />
        </>
      )}
    </DetaljGrupp>
  );
}
