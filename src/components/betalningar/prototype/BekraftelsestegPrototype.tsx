import { useMemo } from 'react';
import type { PrototypeDataLage, PrototypeVariant } from '@/components/dev/PrototypeSwitcher';
import { PrototypeSwitcher } from '@/components/dev/PrototypeSwitcher';
import { SidRam } from '@/components/primitives';
import { useOppnaBetalningar } from '@/data/betalningar/useBetalningar';
import type { OppenBetalning } from '@/domain/schemas';
import { idagIso } from '../idag';
import { useBekraftelsesteg } from './bekraftelseSimulering';
import { bekraftelseFixtur, FIXTUR_IDAG } from './fixtur';
import { VariantA } from './VariantA';
import { VariantB } from './VariantB';
import { VariantC } from './VariantC';

/**
 * [PROTOTYPE] Bekräftelsesteget för inbetalningar — DIVERGENS-passet (S121
 * beslut 8). Route-komponenten: det tunna datalagret plus växlaren. De tre
 * varianterna delar denna modell och INGET annat (uppdragets krav).
 *
 * Frågan prototypen besvarar står VERBATIM högst upp i route-filen
 * (`betalningar_.registrera.tsx`).
 */

export type PrototypData = 'fixtur' | 'staging';
export type PrototypVariant = 'a' | 'b' | 'c';

const PROTO_VARIANTS: PrototypeVariant[] = [
  { key: 'a', label: 'Radlistan', steg: 1, stegLabel: 'divergens' },
  { key: 'b', label: 'Sammanställningen', steg: 1, stegLabel: 'divergens' },
  { key: 'c', label: 'Avvikelse-först', steg: 1, stegLabel: 'divergens' },
];

// Datalägets URL-värden är EXPLICITA ('fixtur'/'staging'), inte `null`, så
// den skrivna URL:en matchar det PR-kroppen visar (`?data=fixtur`). Badgen
// syns bara när `dataLagen.length > 2` (PrototypeSwitcher-kontraktet); med två
// lägen står valet i sidans egen underrubrik i stället.
const PROTO_DATA_LAGEN: readonly PrototypeDataLage[] = [
  { value: 'fixtur', label: 'Fixtur' },
  { value: 'staging', label: 'Staging' },
];

export function BekraftelsestegPrototype({
  variant,
  data,
  ids,
}: {
  variant: PrototypVariant;
  data: PrototypData;
  ids?: string;
}) {
  // Hooks körs ovillkorligt (hooks-reglerna). Staging-hämtningen gatas via
  // `enabled` — fixtur-läget rör aldrig nätverket.
  const stagingFraga = useOppnaBetalningar(data === 'staging');

  const idag = data === 'fixtur' ? FIXTUR_IDAG : idagIso();

  const oppna = useMemo<OppenBetalning[]>(() => {
    if (data === 'fixtur') return bekraftelseFixtur();
    const alla = stagingFraga.data?.betalningar ?? [];
    const valdaIds = ids
      ? ids
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : null;
    const urval = valdaIds
      ? alla.filter((b) => valdaIds.includes(b.anmalanRecordId))
      : bredaUrval(alla);
    return urval.slice(0, 10);
  }, [data, ids, stagingFraga.data]);

  const modell = useBekraftelsesteg(oppna, idag);

  const stagingLaddar = data === 'staging' && stagingFraga.isLoading;
  const stagingFel = data === 'staging' && stagingFraga.isError;

  return (
    <div className="mx-[calc(50%-46vw)] flex w-[92vw] flex-col">
      {import.meta.env.DEV && (
        <PrototypeSwitcher variants={PROTO_VARIANTS} dataLagen={PROTO_DATA_LAGEN} />
      )}
      <div className="mx-auto flex w-full max-w-[1100px] flex-col">
        <SidRam to="/mer/betalningar" tillbakaEtikett="Tillbaka till inkorgen" />
        <div className="px-4 lg:px-6">
          {stagingLaddar ? (
            <p className="py-8 text-body text-text-secondary">Hämtar öppna betalningar …</p>
          ) : stagingFel ? (
            <p className="py-8 text-body text-text-secondary">
              Kunde inte hämta staging-data. Växla till Fixtur i växlaren.
            </p>
          ) : oppna.length === 0 ? (
            <p className="py-8 text-body text-text-secondary">Inga öppna betalningar att visa.</p>
          ) : variant === 'b' ? (
            <VariantB modell={modell} />
          ) : variant === 'c' ? (
            <VariantC modell={modell} />
          ) : (
            <VariantA modell={modell} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Upp till tio rader spridda över SÅ MÅNGA event som möjligt (staging utan
 * `ids`): plocka runt-robin en rad per event tills tio är valda, så
 * prototypen inte fylls av ett enda events rader.
 */
function bredaUrval(alla: readonly OppenBetalning[]): OppenBetalning[] {
  const perEvent = new Map<string, OppenBetalning[]>();
  for (const b of alla) {
    const nyckel = b.eventId ?? b.eventNamn ?? 'utan-event';
    const lista = perEvent.get(nyckel) ?? [];
    lista.push(b);
    perEvent.set(nyckel, lista);
  }
  const koer = [...perEvent.values()];
  const valda: OppenBetalning[] = [];
  let rord = true;
  while (valda.length < 10 && rord) {
    rord = false;
    for (const ko of koer) {
      const nasta = ko.shift();
      if (nasta) {
        valda.push(nasta);
        rord = true;
        if (valda.length >= 10) break;
      }
    }
  }
  return valda;
}
