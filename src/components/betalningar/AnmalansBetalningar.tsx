import { CircleCheck } from 'lucide-react';
import { useMemo } from 'react';
import { useOppnaBetalningar } from '@/data/betalningar/useBetalningar';
import { ATERBETALNINGS_TRIGGER_ID, AterbetalningsYta } from './AterbetalningsYta';
import { visaKronor } from './belopp-inmatning';
import { InbetalningsLista } from './InbetalningsLista';
import { idagIso } from './idag';
import { harledRad } from './inkorg-harledningar';
import { REGISTRERA_TRIGGER_ID, RegistreraYta } from './RegistreraYta';

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
 * "KVAR ATT BETALA" SOM VIKTAD RAD (TASK-346.14, designfynd 3a/3b)
 * ═══════════════════════════════════════════════════════════════════════════
 * `DetaljGrupp`s dt/dd-rader ovanför (Anmälningsavgift/Slutbetalning/
 * deadline/noteringar) håller `EtikettVardeRad`s form (etikett dämpad
 * vänster, VÄRDET primärt höger, py-3). Den öppna sladden här — nyckeltalet
 * — var en naken vänsterställd mening utan den vikten. Formen nedan LÅNAR
 * `EtikettVardeRad`s klasser rakt av (samma `text-small text-text-muted`
 * etikett, samma högerställda `font-semibold text-body`-värde) men renderas
 * ALDRIG i en `<dl>`: en dt/dd-rad kan bara bära EN ordagrann term, och de
 * tre lägena här (öppet belopp / "Allt betalt" / okänt pris) är tre OLIKA
 * meningar, inte tre värden på samma fråga — att tvinga in dem i dt/dd hade
 * krävt att antingen hitta på en konstlad gemensam etikett eller byta etikett
 * per läge (`axe` `definition-list` kräver dessutom att VARJE `<dl>`-barn är
 * ett dt/dd-par, inte fri text). De två "lugna" lägena (null/allt betalt)
 * förblir därför enkel text utan radstruktur — bara det FAKTISKT öppna
 * beloppet, det Marcus kallade "NYCKELTALET", får radens vikt.
 *
 * ORDVALET BYTTES 2026-09-01 (Marcus): etiketten "Saknas" är nu "Kvar att
 * betala", och nolläget "Inget öppet belopp enligt basen." blev "Inget kvar
 * att betala." Termen var KONSEKVENT över alla betalningsytor — panelen,
 * denna vy, personkortet, inkorgens rader och registreringens kvittens — så
 * samma sak hette samma sak var Lotta än stod. Kompositionen är oförändrad.
 *
 * REVISION 2026-09-04 (S120, TASK-391): nolläget är nu "Inget att betala."
 * — "kvar" förutsätter att något funnits att betala, medan `saknas === null`
 * inte vet det (aldrig haft pris eller helt betald, ovisst vilket). "Inget
 * att betala" är neutralt och täcker båda fallen. Gäller bara detta
 * nolläge — inkorgens heltäckningsgren (`inkorg-harledningar.ts`, en
 * registrerad inbetalning som täcker hela priset) behåller "Inget kvar att
 * betala.", där "kvar" fortfarande är exakt.
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
    <div className="flex flex-col gap-4 pt-4">
      {/* ═══ STATUSKORTET (pass 8) — se `PersonBetalningar.tsx`s motsvarande
          block för Marcus dom och hela resonemanget. Samma fyra fragment låg
          löst här: "Kvar att betala"-raden på gruppens vänsterkant, knapparna
          under den, ingen yta som höll ihop dem.

          GROUNDEN BÄR VALET: `AnmalanDetail`s Betalningar-grupp är en
          `DetaljGrupp`, alltså `bg-bg-muted` (`DetaljGrupp.tsx`) — en vit
          kortyta syns mot den, precis som på personkortet. Samma kortform som
          inbetalningsraderna längre ned, så vyn läser som en familj. */}
      <div className="flex flex-col gap-3 rounded-2xl border border-transparent bg-surface p-3 contrast-more:border-border-strong">
        {/* "enligt basen" när ingen rad finns - se `PanelBetalningar` §
          `rad === null` för varför frånvaron är tvetydig och inte får
          påstås vara "allt betalt". Se filens docblock § "SAKNAS X KR" för
          varför bara det öppna beloppet får radstrukturens vikt. */}
        {saknas === null ? (
          <p className="text-small text-text-muted">Inget att betala.</p>
        ) : saknas > 0 ? (
          <div className="flex items-center justify-between gap-4 py-1">
            <span className="text-small text-text-muted">Kvar att betala</span>
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
          {/* [TASK-368.5] `triggerId` sätts BARA här, spegelbilden av
              `AterbetalningsYta`s rad nedan: ombokningskvittot högst upp på
              anmälans sida skickar Lotta hit i ett tryck när det nya eventet
              är dyrare. Se `RegistreraYta` § `REGISTRERA_TRIGGER_ID` för
              kontraktet och för varför inkorgens/panelens instanser lämnar
              propen utelämnad. */}
          {rad !== null && <RegistreraYta rad={rad} triggerId={REGISTRERA_TRIGGER_ID} />}
          {/* [TASK-368.3] `triggerId` sätts BARA här: avbokningssteget längre
              ned på anmälans sida skickar Lotta hit i ett tryck när det finns
              inbetalningar att betala tillbaka. Se `AterbetalningsYta` §
              `ATERBETALNINGS_TRIGGER_ID` för kontraktet och för varför
              personkortets/panelens instanser lämnar propen utelämnad. */}
          <AterbetalningsYta
            anmalanRecordId={anmalanRecordId}
            triggerId={ATERBETALNINGS_TRIGGER_ID}
          />
        </div>
      </div>

      {/* ═══ INGEN EGEN BAKGRUNDSYTA, RUBRIKEN ÄR EN EYEBROW (pass 12) ═══
          Samma ändring, samma skäl och samma roll-distinktion mot Hem-domen
          som `PersonBetalningar.tsx` § "INGEN EGEN BAKGRUNDSYTA" — läs den
          innan du rättar tillbaka något här. De två ytorna visar SAMMA lista
          och måste se likadana ut. */}
      <div className="flex flex-col gap-2">
        <h3 className="font-medium text-caption text-text-secondary uppercase tracking-wide">
          Inbetalningar
        </h3>
        <InbetalningsLista kalla={{ anmalanRecordId }} aktiv listEtikett="Inbetalningar" />
      </div>
    </div>
  );
}
