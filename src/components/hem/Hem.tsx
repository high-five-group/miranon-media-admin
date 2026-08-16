import { useMemo, useState } from 'react';
import { useAuth } from '@/auth/useAuth';
import { Bevakningsrad } from './Bevakningsrad';
import { ForfallnaBetalningar } from './ForfallnaBetalningar';
import { Genvagar } from './Genvagar';
import {
  bevakningar,
  dagsStart,
  eventsById,
  forfallnaBetalningar,
  fornamn,
  obekraftadeAnmalningar,
  velNastaEvent,
} from './hem-derivations';
import { NastaEvent } from './NastaEvent';
import { NyaAnmalningar } from './NyaAnmalningar';
import { SenasteAktivitetKompakt } from './SenasteAktivitetKompakt';
import { useDashboardEvents, useDashboardRegistrations } from './useDashboardData';

/**
 * Hem — Morgonkollen, V1 "Lugna morgonen" (TASK-243.1, promoverad ur
 * `dev/hem-prototyp/VariantRo.tsx` till skarp yta med VERKLIG data via
 * husets hooks/adapter — ADR-102/103). Formen är promoverad EXAKT ur facitet
 * `tasks/sessions/bilagor/s102-hem-konvergens/facit.json` (ytan "hem-vyn V1
 * 'Lugna morgonen'"): denna komponent designar ingenting nytt, den bär
 * facit-formen till den skarpa routen.
 *
 * Blockordningen (Marcus-låst, S102 Del 8 + Del 10, AC #2): fri hälsning utan
 * platta → Nästa event (fullbredd, primär-tint) → Bevakningsrad (osynlig vid
 * noll träffar) → Nya anmälningar (räknar-rubrik + bekräftelsesvep) →
 * Förfallna betalningar (tre tillståndsgrupper) → Genvägar → Senaste
 * aktivitet (kompakt, alla bredder).
 *
 * Härledningslogiken (förfallen-definitionen, tillståndsgrupperna,
 * bevakningsradens trigger) bor i det SKARPA datalagret
 * (`hem-derivations.ts`, AC #3) — aldrig inline här.
 *
 * EN läskolumn (`max-w-2xl`), oförändrad mobil→desktop — ingen bredare grid
 * tar över när skärmen växer (facitets "ro"-identitet).
 *
 * AVVIKELSE mot den retirerade K10-formens `Hem.tsx`, ÖPPET bokförd: den
 * gamla versionsraden ("Miranon Media Admin v…", nere till vänster på
 * desktop) fanns INTE i facit-prototypen och promoveras därför inte —
 * ADR-102 B1 ("prototypen ÄR facit … vid motsägelse mellan prototyp och
 * kravtext vinner prototypen") väger tyngre än att tyst återuppfinna en yta
 * facit inte visar. Ingen ersättare byggs; se slutrapporten för TASK-243.1.
 */
export function Hem() {
  const { user } = useAuth();
  const namn = user?.displayName ? fornamn(user.displayName) : null;

  const eventsQuery = useDashboardEvents();
  const registrationsQuery = useDashboardRegistrations();

  // "Nu" läst EN gång per montering (inte per render) — samma referenspunkt
  // genom hela vyn, annars kunde "förfallen"/bevakningsraden flippa mellan
  // en switch och nästa utan att datat faktiskt ändrats.
  const [nuMs] = useState(() => Date.now());

  const idagStart = useMemo(() => dagsStart(nuMs), [nuMs]);
  const evMap = useMemo(() => eventsById(eventsQuery.data), [eventsQuery.data]);
  const nasta = useMemo(
    () => velNastaEvent(eventsQuery.data, idagStart),
    [eventsQuery.data, idagStart],
  );

  const anmalDataPending = registrationsQuery.isPending || eventsQuery.isPending;
  const regsError = registrationsQuery.isError;

  const anmalningar = useMemo(
    () => obekraftadeAnmalningar(registrationsQuery.data, evMap),
    [registrationsQuery.data, evMap],
  );
  const forfallna = useMemo(
    () => forfallnaBetalningar(registrationsQuery.data, evMap, nuMs),
    [registrationsQuery.data, evMap, nuMs],
  );
  const bevakningRader = useMemo(
    () => bevakningar(eventsQuery.data, registrationsQuery.data, idagStart),
    [eventsQuery.data, registrationsQuery.data, idagStart],
  );

  const idagLangt = useMemo(
    () =>
      kapitalisera(
        new Intl.DateTimeFormat('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' }).format(
          nuMs,
        ),
      ),
    [nuMs],
  );

  return (
    <section className="mx-auto flex min-w-0 max-w-2xl flex-col gap-12 p-6 pt-10 pb-24 sm:p-8 lg:pt-16">
      {/* 1. FRI HÄLSNING — ingen platta, stor redaktionell rubrik + en varm
          dagsrad. h1 = sidans rubrik (ingen separat "Hem"-rubrik). */}
      <div className="flex flex-col gap-2">
        <p className="text-body text-text-secondary">{idagLangt}</p>
        <h1 className="font-semibold text-4xl tracking-tight lg:text-5xl">
          {namn ? `Hej ${namn}` : 'Hej'}
        </h1>
      </div>

      {/* 2. NÄSTA EVENT — fullbredd, hero-ton. */}
      <NastaEvent eventsQuery={eventsQuery} nasta={nasta} idagStart={idagStart} />

      {/* BEVAKNINGSRAD — mellan "Nästa event" och "Nya anmälningar"
          (Marcus-låst blockordning); helt osynlig vid noll träffar. */}
      <Bevakningsrad rader={bevakningRader} />

      {/* 3. NYA ANMÄLNINGAR */}
      <NyaAnmalningar
        anmalDataPending={anmalDataPending}
        regsError={regsError}
        registrationsQuery={registrationsQuery}
        anmalningar={anmalningar}
        nuMs={nuMs}
      />

      {/* 4. FÖRFALLNA BETALNINGAR */}
      <ForfallnaBetalningar
        anmalDataPending={anmalDataPending}
        regsError={regsError}
        registrationsQuery={registrationsQuery}
        forfallna={forfallna}
        nuMs={nuMs}
      />

      {/* 5. GENVÄGAR */}
      <Genvagar />

      {/* 6. SENASTE AKTIVITET — kompakt, alla bredder. */}
      <SenasteAktivitetKompakt />
    </section>
  );
}

function kapitalisera(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}
