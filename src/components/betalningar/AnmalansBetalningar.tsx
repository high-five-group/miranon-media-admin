import { useMemo } from 'react';
import { useOppnaBetalningar } from '@/data/betalningar/useBetalningar';
import { visaKronor } from './belopp-inmatning';
import { InbetalningsLista } from './InbetalningsLista';
import { idagIso } from './idag';
import { harledRad } from './inkorg-harledningar';
import { RegistreraYta } from './RegistreraYta';

/**
 * [TASK-346.7 AC #3] Anmälans egen betalningsyta: vad som saknas, vilka
 * inbetalningar som gjorts, deras kvitton, och Registrera betalning.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DEN LIGGER UNDER DE BEFINTLIGA RADERNA, INTE I STÄLLET FÖR DEM
 * ═══════════════════════════════════════════════════════════════════════════
 * `AnmalanDetail`s Betalningar-grupp visar sedan tidigare Anmälningsavgift,
 * Slutbetalning, deadline och de två noteringarna. De raderna är kvar och
 * orörda: sedan ADR-128 är de två valfälten en APP-SKRIVEN SPEGEL av
 * härledningen, alltså exakt "härlett läge, läsande" - de säger vad som är
 * KLART. Detta block säger vad som ÅTERSTÅR och vad som faktiskt betalats in.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INBETALNINGARNA HÄMTAS DIREKT HÄR, TILL SKILLNAD FRÅN I PANELEN
 * ═══════════════════════════════════════════════════════════════════════════
 * Åtgärds-panelen visar tjugo personer och hämtar därför lat, bakom en
 * fällning. Anmälans detaljvy visar EN anmälan som Lotta uttryckligen
 * navigerat till - ett anrop, för det hon kom hit för att se. En fällning
 * här hade varit ett extra klick utan att spara något.
 */
export function AnmalansBetalningar({
  anmalanRecordId,
}: {
  /** Anmälans record-ID (`Registration.id`). */
  anmalanRecordId: string;
}) {
  const { data } = useOppnaBetalningar();
  const idag = useMemo(idagIso, []);

  const rad = useMemo(() => {
    const betalning = (data?.betalningar ?? []).find((b) => b.anmalanRecordId === anmalanRecordId);
    return betalning ? harledRad(betalning, idag) : null;
  }, [data, anmalanRecordId, idag]);

  const saknas = rad === null ? null : (rad.kvar ?? rad.betalning.saknas);

  return (
    <div className="flex flex-col gap-3 pt-4">
      <p className="text-small">
        {/* "enligt basen" när ingen rad finns - se `PanelBetalningar` §
            `rad === null` för varför frånvaron är tvetydig och inte får
            påstås vara "allt betalt". */}
        {saknas === null
          ? 'Inget öppet belopp enligt basen.'
          : saknas > 0
            ? `Saknas ${visaKronor(saknas)} kr.`
            : 'Allt betalt.'}
      </p>

      {rad !== null && <RegistreraYta rad={rad} />}

      <div className="flex flex-col gap-2">
        <h3 className="font-medium text-caption text-text-secondary uppercase tracking-wide">
          Inbetalningar
        </h3>
        <InbetalningsLista kalla={{ anmalanRecordId }} aktiv />
      </div>
    </div>
  );
}
