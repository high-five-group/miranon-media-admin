import { Link } from '@tanstack/react-router';
import { Banknote, CircleCheck, Clock, Mail } from 'lucide-react';
import { useMemo } from 'react';
import { idagIso } from '@/components/betalningar/idag';
import {
  harledRad,
  jobbDelutfall,
  sammanfattaBetalningar,
} from '@/components/betalningar/inkorg-harledningar';
import { MessageBox, Skeleton } from '@/components/primitives';
import {
  HANDLINGSRAD_KLASS,
  HANDLINGSRAD_OMSLAG_KLASS,
  HandlingsRadInnehall,
} from '@/components/primitives/HandlingsRad';
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
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * FORMEN (TASK-346.14, designfynd 1a–1d) — KOPIERAD UR HUSETS EGNA GRANNAR
 * ═══════════════════════════════════════════════════════════════════════════
 * Marcus dom (S113-slutvandringen, `designfynd-2026-08-31.md`): sektionen var
 * NAKEN mellan två grannar som bär sina egna kortytor (Nästa event,
 * Genvägar), bar TVÅ fullbreddsknappar i identisk vikt trots att den ena
 * ("Registrera betalning") är NAVIGATION, och räknarraden var platt text utan
 * hierarki. De fyra fynden (1a–1d) löses i EN komposition, inte fyra separata
 * lappar:
 *
 *   1a) Kortytan är `NastaEvent`s NEUTRALA syskon — samma `rounded-2xl
 *       border-transparent bg-bg-muted px-4`-skal som `Genvagar.tsx`s
 *       `HandlingsRadKort` och `DetaljGrupp`s kort bär, INTE hero-kortets
 *       cream `bg-primary-tint` (den tonen är reserverad för "Nästa event",
 *       ADR-motiverat av att den är Morgonkollens ENDA hero-block).
 *   1b) "Registrera betalning" var en mörk knapp som i sak NAVIGERAR till
 *       inkorgen — huset navigerar med `HandlingsRad`-formen (samma primitiv
 *       `Genvagar.tsx` delar med eventsidan), inte med en knappkostym. Den
 *       ENDA kvarvarande fullbreddsknappen är "Skicka påminnelse till alla" —
 *       den faktiska handlingen, och EN primär CTA per sektion.
 *   1c) De tre räknarna får en NYCKELTALSHIERARKI: "N öppna" som
 *       display-storlek (samma `font-semibold text-3xl` som `NastaEvent`s
 *       eventnamn), förfallna/kvitton som en ikon-metadata-rad under (samma
 *       `flex flex-wrap gap-x-6 gap-y-1`-grammatik `NastaEvent` bär för
 *       ort/datum) — inte tre tal i en och samma platta mening.
 *   1d) Overline-etiketten "BETALNINGAR" ersätter den forna `text-2xl`-h2:n
 *       (samma `font-medium text-caption text-text-secondary uppercase
 *       tracking-wide` som `NastaEvent`s "NÄSTA EVENT") — rubriken bär nu
 *       samma tvånivå-vikt (etikett → display) som grannkortet.
 *
 * Ikonerna är LÅNADE, inte uppfunna: `Clock` är samma ikon `ForfallnaBetalningar.tsx`/
 * `PanelBetalningar.tsx` redan använder för "Förfallen", `Mail` är samma ikon
 * `events/detail/Betalningar.tsx`s utskickslogg använder för utskickade
 * kvitton/bekräftelser, och `Banknote` är Mer-navigeringens egen ikon för
 * `/mer/betalningar` (`routes/_authenticated/mer/index.tsx`) — samma
 * destination, samma ikon.
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
  const tomt = sammanfattning.oppna === 0 && sammanfattning.kvittonAttSkicka === 0;

  return (
    <section
      aria-labelledby="hem-betalningar"
      className="flex min-w-0 flex-col gap-4 rounded-2xl border border-transparent bg-bg-muted px-4 py-4 contrast-more:border-border-strong"
    >
      <h2
        id="hem-betalningar"
        className="font-medium text-caption text-text-secondary uppercase tracking-wide"
      >
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
          <Skeleton variant="text" className="w-1/2" aria-hidden />
          <Skeleton variant="listRow" aria-hidden />
        </div>
      ) : tomt ? (
        <p className="flex items-center gap-2 text-body text-text-secondary">
          <CircleCheck aria-hidden="true" size={20} className="shrink-0 text-success" />
          Inga öppna betalningar.
        </p>
      ) : (
        // NYCKELTALSHIERARKIN (designfynd 1c/1d) — "N öppna" bär displayvikt
        // (samma text-3xl som NastaEvent:s eventnamn), förfallna/kvitton är
        // en ikon-metadatarad under, samma grammatik som NastaEvent:s
        // ort/datum-rad. Se filens docblock § FORMEN.
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-3xl">
            {`${sammanfattning.oppna} ${sammanfattning.oppna === 1 ? 'öppen' : 'öppna'}`}
          </span>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-body text-text-secondary">
            <span className="flex items-center gap-1.5">
              <Clock aria-hidden="true" size={16} className="shrink-0" />
              {`${sammanfattning.forfallna} ${sammanfattning.forfallna === 1 ? 'förfallen' : 'förfallna'}`}
            </span>
            <span className="flex items-center gap-1.5">
              <Mail aria-hidden="true" size={16} className="shrink-0" />
              {`${sammanfattning.kvittonAttSkicka} kvitton att skicka`}
            </span>
          </div>
        </div>
      )}

      {utfall && (
        <MessageBox intent={utfall.intent} title={utfall.rubrik}>
          Kvittona skickas i bakgrunden. Du kan lämna sidan.
        </MessageBox>
      )}

      {/* EN PRIMÄR CTA (designfynd 1b): knappen renderas BARA när det finns
          någon att påminna - annars hade den öppnat en sändyta utan
          mottagare. Det är exakt den invariant
          `svep-paminnelse-send.acceptance.test.ts` § "tomt urval strukturellt
          onåbart via UI" bevisar, och den överlever kortbytet. */}
      {harPaminnelser && (
        <BulkAtgardsknapp label="Skicka påminnelse till alla" onPress={onSkickaPaminnelseAlla} />
      )}

      {/* NAVIGATION, INTE EN KNAPP (designfynd 1b) — samma `HandlingsRad`-form
          `Genvagar.tsx` bär för sina egna rader, delad primitiv, ingen egen
          uppfinning. Kortskalet är redan ritat av sektionens egen `<section>`
          ovan (px-4/rounded-2xl), så raden monteras direkt utan en andra,
          inbäddad `HandlingsRadKort`. */}
      <nav aria-label="Betalningar">
        <ul className="flex flex-col">
          <li className={HANDLINGSRAD_OMSLAG_KLASS}>
            <Link to="/mer/betalningar" className={HANDLINGSRAD_KLASS}>
              <HandlingsRadInnehall
                ledande={<Banknote aria-hidden="true" size={16} className="shrink-0" />}
              >
                Registrera betalning
              </HandlingsRadInnehall>
            </Link>
          </li>
        </ul>
      </nav>
    </section>
  );
}
