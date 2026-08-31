import { Link } from '@tanstack/react-router';
import { CircleCheck } from 'lucide-react';
import { useMemo } from 'react';
import { idagIso } from '@/components/betalningar/idag';
import {
  harledRad,
  jobbDelutfall,
  sammanfattaBetalningar,
} from '@/components/betalningar/inkorg-harledningar';
import { MessageBox, Skeleton } from '@/components/primitives';
import { useOppnaBetalningar } from '@/data/betalningar/useBetalningar';
import { useJobbstatus } from '@/data/betalningar/useJobbstatus';
import { BulkAtgardsknapp } from './BulkAtgardsknapp';

/**
 * [TASK-346.7 AC #1] Hem-kortet **Betalningar** - Morgonkollens fjärde block
 * när miljöflaggan är på.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DET ERSÄTTER "FÖRFALLNA BETALNINGAR", DET LIGGER INTE OVANPÅ
 * ═══════════════════════════════════════════════════════════════════════════
 * PRD § Inkorgen och formuläret, ordagrant: "Hem-kortet Betalningar ersätter
 * dagens kort 'Förfallna betalningar' (inte ovanpå det) och visar *N öppna ·
 * M förfallna · K kvitton att skicka* med Registrera betalning och Skicka
 * påminnelse till alla."
 *
 * `Hem.tsx` väljer mellan de två på miljöflaggan: med flaggan AV renderas
 * det gamla kortet OFÖRÄNDRAT (prod-beteendet, tills Marcus slår på
 * flaggan), med flaggan PÅ detta.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VAD SOM FÖRSVINNER MED DET GAMLA KORTET - ÖPPET BOKFÖRT, INTE UTJÄMNAT
 * ═══════════════════════════════════════════════════════════════════════════
 * Det gamla kortet bar en-påminnelse-modellens TRE tillståndsgrupper (S102
 * Del 10 beslut 7-8): "Att påminna", "Väntar" och "Dags att ringa" - den
 * sista med telefonnummer och personens notering per avgiftstyp. PRD:ns nya
 * kort bär tre TAL och två knappar; grupperna har ingen motsvarighet i det.
 *
 * De öppna betalningarna finns kvar i inkorgen (`/mer/betalningar`), med
 * förfallo-märke per rad. "Dags att ringa" - alltså raden med telefonnumret
 * för den som fått sin påminnelse och ändå inte betalat - har det INTE.
 * Detta är en form-fråga för morgongranskningen (nattmandat B3), inte något
 * denna komponent avgör åt Marcus; den är bokförd i
 * `tasks/sessions/bilagor/s102-hem-konvergens/AMENDERING-2026-08-31-*.md`.
 *
 * PÅMINNELSESVEPET SJÄLVT ÄR ORÖRT. Knappen "Skicka påminnelse till alla" är
 * samma `BulkAtgardsknapp` med samma `onSkickaPaminnelseAlla` som förut, och
 * urvalet bakom den (`paminnelseRader` → "Att påminna"-läget) räknas
 * fortfarande i `Hem.tsx`. AC #1 säger uttryckligen: befintlig funktion -
 * flytta eller återanvänd, riv inte.
 */
export function BetalningarKort({
  onSkickaPaminnelseAlla,
  harPaminnelser,
}: {
  /** Öppnar påminnelsesvepets sändyta - `Hem.tsx`s `aktivtSvep`. */
  onSkickaPaminnelseAlla: () => void;
  /**
   * Finns det någon rad i "Att påminna"-läget? Räknas av `Hem.tsx` ur
   * SAMMA `paminnelseRaderList` som svepets urval, så knappen aldrig kan
   * öppna en sändyta utan mottagare (den invarianten är mekaniskt bevisad i
   * `svep-paminnelse-send.acceptance.test.ts` och får inte tappas här).
   */
  harPaminnelser: boolean;
}) {
  const { data, isPending, isError, error } = useOppnaBetalningar();
  const idag = useMemo(idagIso, []);

  const rader = useMemo(
    () => (data?.betalningar ?? []).map((b) => harledRad(b, idag)),
    [data, idag],
  );
  const sammanfattning = useMemo(() => sammanfattaBetalningar(rader), [rader]);

  /* JOBBET: `JobbLyssnare` håller redan `jobbstatus(null)` färsk för hela
     appen, så detta anrop läser samma cache-nyckel och kostar inget extra.
     PRD berättelse 11 vill att Hem säger "8 kvitton skickade" utan att Lotta
     gått till inkorgen. */
  const jobb = useJobbstatus();
  const senaste = jobbDelutfall(jobb.data);

  /* ETT FÄRDIGT JOBB FRÅN I GÅR ÄR INTE DAGENS NYHET. Samma mätta fälla som
     `BetalningsInkorg.tsx` bokför: banderollen visade "1 kvitto skickade"
     innan Lotta gjort något, därför att det SENASTE jobbet var TASK-346.4:s
     provkörning dagen innan. Hem har ingen egen session-koppling till ett
     jobb, så villkoret är det strängare av inkorgens två: visa bara ett jobb
     som fortfarande ARBETAR. Ett avslutat jobb tystas. */
  const utfall = senaste && senaste.kvar > 0 ? senaste : null;

  return (
    <section aria-labelledby="hem-betalningar" className="flex min-w-0 flex-col gap-4">
      <h2 id="hem-betalningar" className="font-semibold text-2xl">
        Betalningar
      </h2>

      {isError ? (
        <MessageBox intent="error" title="Kunde inte hämta betalningar">
          {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
        </MessageBox>
      ) : isPending ? (
        /* LADDLÄGET FÖLJER HEMMETS EGEN ANATOMI (Roselli-mönstret,
           `hem-laddlage.acceptance.test.ts` AC 2/AC 4): `role="status"` +
           `aria-busy`, EXAKT ETT `.sr-only`-besked som börjar med "Laddar",
           och skelettblock som är `aria-hidden`. Formen är densamma som
           `ForfallnaBetalningar` bär, så blockräkningen i laddläge är
           oförändrad när flaggan en gång slås på i fixturvärlden. */
        <div role="status" aria-busy="true" className="flex flex-col gap-3">
          <span className="sr-only">Laddar betalningar…</span>
          <Skeleton variant="text" aria-hidden />
          <Skeleton variant="listRow" aria-hidden />
        </div>
      ) : sammanfattning.oppna === 0 && sammanfattning.kvittonAttSkicka === 0 ? (
        <p className="flex items-center gap-2 text-body text-text-secondary">
          <CircleCheck aria-hidden="true" size={20} className="shrink-0 text-success" />
          Inga öppna betalningar.
        </p>
      ) : (
        <p className="text-body text-text-secondary">
          {`${sammanfattning.oppna} öppna · ${sammanfattning.forfallna} förfallna · ${sammanfattning.kvittonAttSkicka} kvitton att skicka`}
        </p>
      )}

      {utfall && (
        <MessageBox intent={utfall.intent} title={utfall.rubrik}>
          Kvittona skickas i bakgrunden. Du kan lämna sidan.
        </MessageBox>
      )}

      <div className="flex flex-col gap-3">
        {/* EN ÄKTA LÄNK, INTE EN KNAPP SOM NAVIGERAR. Samma val och samma
            motivering som `valkommen.tsx`s `PrimarLankKnapp`: cmd/ctrl-klick,
            "kopiera länk" och `role="link"` för skärmläsare. `buttonVariants`
            är avsiktligt privat i `Button.tsx`, så de synliga klasserna
            dubbleras - det är husets etablerade val här, inte ett hack. */}
        <Link
          to="/mer/betalningar"
          className="text-(color:--mm-button-primary-text) inline-flex min-h-11 select-none items-center justify-center gap-2 rounded bg-(--mm-button-primary-bg) px-5 text-center text-body transition-colors hover:bg-(--mm-button-primary-bg-hover)"
        >
          Registrera betalning
        </Link>

        {/* Knappen renderas BARA när det finns någon att påminna - annars
            hade den öppnat en sändyta utan mottagare. Det är exakt den
            invariant `svep-paminnelse-send.acceptance.test.ts` § "tomt urval
            strukturellt onåbart via UI" bevisar, och den överlever
            kortbytet. */}
        {harPaminnelser && (
          <BulkAtgardsknapp label="Skicka påminnelse till alla" onPress={onSkickaPaminnelseAlla} />
        )}
      </div>
    </section>
  );
}
