import { CircleCheck } from 'lucide-react';
import { useMemo } from 'react';
import { useOppnaBetalningar } from '@/data/betalningar/useBetalningar';
import { AterbetalningsYta } from './AterbetalningsYta';
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
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * "SAKNAS X KR" SOM VIKTAD RAD (TASK-346.14, designfynd 3a/3b)
 * ═══════════════════════════════════════════════════════════════════════════
 * `DetaljGrupp`s dt/dd-rader ovanför (Anmälningsavgift/Slutbetalning/
 * deadline/noteringar) håller `EtikettVardeRad`s form (etikett dämpad
 * vänster, VÄRDET primärt höger, py-3). Den öppna sladden här — nyckeltalet
 * "Saknas 500 kr." — var en naken vänsterställd mening utan den vikten.
 * Formen nedan LÅNAR `EtikettVardeRad`s klasser rakt av (samma
 * `text-small text-text-muted` etikett, samma högerställda `font-semibold
 * text-body`-värde) men renderas ALDRIG i en `<dl>`: en dt/dd-rad kan bara
 * bära EN ordagrann term ("Saknas"), och de tre lägena här ("Saknas X kr" /
 * "Allt betalt" / "enligt basen: okänt") är tre OLIKA meningar, inte tre
 * värden på samma fråga — att tvinga in dem i dt/dd hade krävt att antingen
 * hitta på en konstlad gemensam etikett eller byta etikett per läge (`axe`
 * `definition-list` kräver dessutom att VARJE `<dl>`-barn är ett dt/dd-par,
 * inte fri text). De två "lugna" lägena (null/allt betalt) förblir därför
 * enkel text utan radstruktur — bara det FAKTISKT öppna beloppet, det Marcus
 * kallade "NYCKELTALET", får radens vikt. Ordvalet (svenska meningarna) är
 * OFÖRÄNDRAT — bara kompositionen är ny.
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
      {/* "enligt basen" när ingen rad finns - se `PanelBetalningar` §
          `rad === null` för varför frånvaron är tvetydig och inte får
          påstås vara "allt betalt". Se filens docblock § "SAKNAS X KR" för
          varför bara det öppna beloppet får radstrukturens vikt. */}
      {saknas === null ? (
        <p className="text-small text-text-muted">Inget öppet belopp enligt basen.</p>
      ) : saknas > 0 ? (
        <div className="flex items-center justify-between gap-4 py-1">
          <span className="text-small text-text-muted">Saknas</span>
          <span className="text-right font-semibold text-body">{`${visaKronor(saknas)} kr`}</span>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-small text-text-secondary">
          <CircleCheck aria-hidden="true" size={16} className="shrink-0 text-success" />
          Allt betalt.
        </p>
      )}

      {/* [TASK-346.14 fix-runda D, D1] HORISONTELL KNAPPGRUPP PÅ ≥sm —
          orkestrerarens dom (1440×900) mätte "Registrera betalning" och
          "Registrera återbetalning" staplade vänsterställda med olika
          naturlig bredd (varje `*Yta` är en egen `flex-col`-behållare, så de
          blev vertikala syskon i denna sidas EGEN `flex-col`). Husets
          etablerade mönster för en knappgrupp som ska bli sida-vid-sida på
          desktop men stapla på mobil är `flex-col … sm:flex-row`
          (`DokumentYta.tsx` § "STAPLADE I FULL BREDD UNDER sm, SIDA VID SIDA
          FRÅN sm") — här UTAN `w-full`/`sm:w-auto`, eftersom mobilformen ska
          förbli OFÖRÄNDRAD (knapparnas egen intrinsic bredd, precis som
          idag). `gap-3` är samma värde containerns egen `flex-col gap-3`
          redan gav mellan raderna, så mobilens vertikala avstånd är
          opåverkat — bara riktningen växlar vid `sm`. `sm:items-start`
          förhindrar att en kvittens-rad under den ena triggern (annan höjd
          än den andra) sträcker kolumnerna till samma höjd.

          [TASK-346.9 AC #3] `AterbetalningsYta` är fristående av `rad` (och
          alltså av "öppet belopp") — se `AterbetalningsForm`s docblock för
          varför: en återbetalning gäller ofta en anmälan som redan är
          fullbetald och nu avbokas, alltså precis det läge `RegistreraYta`
          inte visas i. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
        {rad !== null && <RegistreraYta rad={rad} />}
        <AterbetalningsYta anmalanRecordId={anmalanRecordId} />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-medium text-caption text-text-secondary uppercase tracking-wide">
          Inbetalningar
        </h3>
        <InbetalningsLista kalla={{ anmalanRecordId }} aktiv />
      </div>
    </div>
  );
}
