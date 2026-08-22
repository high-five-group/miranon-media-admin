import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import { type ComponentType, useMemo } from 'react';
import type { AnmalningarLage, VariantProps } from '@/components/dev/anmalningar-prototyp/types';
import { VariantA } from '@/components/dev/anmalningar-prototyp/VariantA';
import { VariantB } from '@/components/dev/anmalningar-prototyp/VariantB';
import { VariantC } from '@/components/dev/anmalningar-prototyp/VariantC';
import {
  PrototypeSwitcher,
  type PrototypeVariant,
  type PrototypeVy,
} from '@/components/dev/PrototypeSwitcher';
import { behoverAtgard, inskickadTid } from '@/components/registrations/registration-display';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import { queryKeys } from '@/queries/keys';

export const Route = createFileRoute('/dev/anmalningar-prototyp')({
  // Dev-only prototyp-yta (ADR-044/ADR-074-mönstret, jfr /dev/hem-prototyp,
  // /dev/auth-prototyp): i produktion finns routen i bundlen men är
  // onåbar — beforeLoad kastar redirect före render. (Se slutrapportens
  // premiss-avsnitt: `import.meta.env.DEV` är FALSE även i ett
  // staging-bygge — `vite build --mode staging` sätter fortfarande
  // DEV=false/PROD=true, mätt empiriskt. Granskning sker alltså mot
  // `npm run dev`, inte staging-preview, precis som alla befintliga
  // /dev/*-prototyper redan kräver.)
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: '/' });
    }
  },
  staticData: { title: 'Anmälningssidan - divergens-prototyp' },
  component: AnmalningarPrototypPage,
});

/**
 * TASK-299.3 DIVERGENSFASEN — anmälningssidans tre radikalt olika varianter
 * (PRD `TASK-299`, ADR-102/103, grillad samsyn — se PRD § Testbeslut).
 *
 * FRÅGAN: "Hur ska `/mer/anmalningar` se ut?" — sidan är aldrig facit-
 * stämplad (Marcus dom: "skitful") och är samtidigt åtgärdsköns
 * landningsyta. Tre varianter, samtliga mot RIKTIG data (samma
 * `queryKeys.registrations.all`-nyckel som produktionssidan — dedupar via
 * React Query, ingen extra EF-rundtur):
 *
 *   A — "Idag": EXAKT KOPIA av nuvarande sida (AC #1), aldrig ett tomt blad.
 *   B — "Scanlista": personlistans radanatomi (AC #3) — initialcirkel,
 *       namn som länk, "N dagar sedan · Eventnamn", status som reserverad
 *       kolumn.
 *   C — "Grupperad efter event": annan INFORMATIONSHIERARKI (sektioner per
 *       kurs i stället för en platt tidslinje).
 *
 * TVÅ AXLAR, BÅDA I RAILEN (samma S96-konvention som auth-/hem-prototypen):
 * VARIANT (`?variant=`, ADR-074 beslut 1) OCH sidans TRE LÄGEN (`?lage=`,
 * ADR-074:s valfria vy-axel — "vilken SKÄRM i familjen" generaliserad hit
 * till "vilket LÄGE av SAMMA vy", PRD AC #2: det filtrerade läget är ett
 * läge av samma sida, aldrig en egen sida).
 *
 * DATA HÄMTAS EN GÅNG HÄR (hem-prototyp-precedentet) och lage-filtreras
 * INNAN den delas till varianterna — varje variant äger bara
 * PRESENTATIONEN, aldrig urvalet, exakt som produktionens `AnmalningarList`
 * delar upp `visaAtgardskon`-filtreringen och rad-renderingen.
 */
const VARIANTER: PrototypeVariant[] = [
  { key: 'a', label: 'A - Idag', steg: 1, stegLabel: 'Steg 1 - divergens' },
  { key: 'b', label: 'B - Scanlista', steg: 1, stegLabel: 'Steg 1 - divergens' },
  { key: 'c', label: 'C - Grupperad', steg: 1, stegLabel: 'Steg 1 - divergens' },
];

const LAGEN: PrototypeVy[] = [
  { key: 'lista', label: 'Ofiltrerad lista' },
  { key: 'atgardskon', label: 'Åtgärdskö-läget' },
  { key: 'tomt', label: 'Tomt läge' },
];

const VARIANT_KOMPONENTER: Record<'a' | 'b' | 'c', ComponentType<VariantProps>> = {
  a: VariantA,
  b: VariantB,
  c: VariantC,
};

function IngenSkarpVy() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg-subtle p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-border-light bg-surface p-10 text-center shadow-sm">
        <p className="font-semibold text-lg text-text">Ingen skarp vy här</p>
        <p className="text-body text-text-secondary">
          Den här dev-routen bär bara divergens-prototypen. Den skarpa anmälningssidan ligger på{' '}
          <Link to="/mer/anmalningar" className="underline underline-offset-2">
            /mer/anmalningar
          </Link>
          .
        </p>
        <p className="text-caption text-text-muted">Välj en variant i railen till höger →</p>
      </div>
    </div>
  );
}

function AnmalningarPrototypPage() {
  const [variant] = useQueryState('variant');
  const [lage] = useQueryState(
    'lage',
    parseAsStringEnum<AnmalningarLage>(['lista', 'atgardskon', 'tomt']).withDefault('lista'),
  );
  const dataSource = useDataSource();

  const {
    data: registrations,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.registrations.all,
    queryFn: () => dataSource.fetchRegistrations(),
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  // Läst en gång per montering (hem-prototyp-precedentet) — samma "nu" i
  // alla tre varianter oavsett variantväxling.
  const nuMs = useMemo(() => Date.now(), []);

  const rader = useMemo(() => {
    if (!registrations) return [];
    const bas =
      lage === 'atgardskon'
        ? registrations.filter(behoverAtgard)
        : lage === 'tomt'
          ? []
          : registrations;
    return [...bas].sort((a, b) => inskickadTid(b) - inskickadTid(a));
  }, [registrations, lage]);

  const variantProps: VariantProps = { rader, lage, isPending, isError, error, nuMs };
  const Variant =
    variant === 'a' || variant === 'b' || variant === 'c' ? VARIANT_KOMPONENTER[variant] : null;

  return (
    <>
      {Variant ? (
        <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
          <div className="p-4 pb-0">
            <Link to="/mer" className="text-small underline">
              ← Tillbaka till Mer
            </Link>
          </div>
          <Variant {...variantProps} />
        </div>
      ) : (
        <IngenSkarpVy />
      )}

      <PrototypeSwitcher variants={VARIANTER} vyer={LAGEN} vyParam="lage" />
    </>
  );
}
