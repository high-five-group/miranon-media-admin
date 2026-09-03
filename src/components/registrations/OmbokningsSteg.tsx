import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { EventValjare } from '@/components/events/EventValjare';
import { Button } from '@/components/primitives';
import { useBokaOmAnmalan } from '@/data/mutations/registrationRebooking';
import type { Event } from '@/domain/models/Event';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';
import { ombokningsskal } from './ombokning-kvitto';
import { begripligtServerfel } from './serverfel';
import { VantelistePaminnelse } from './VantelistePaminnelse';

/**
 * [TASK-368.5 AC #2/#3/#4] "Boka om till annat event" — steget inuti
 * avbokningsytan på anmälans egen sida.
 *
 * PRD `TASK-368` beslut 7 (grillad samsyn, S115 Del 3): *"genvägen 'Boka om
 * till annat event' i avbokningssteget skapar den nya anmälan direkt
 * (skapa-anmälan finns) och fyller i skälet."* Marcus: *"Jag tror Lotta
 * verkligen skulle behöva B, för det händer att folk vill 'byta' event."*
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * EVENTVÄLJAREN ÄR HUSETS, INTE EN NY
 * ═══════════════════════════════════════════════════════════════════════════
 * `EventValjare` med default-omfattningen (`'kommande'`) är EXAKT den väljare
 * manuell anmälan använder (`ManuellAnmalanForm.tsx`, task-18.18) — samma
 * popover, samma sök, samma månadssektioner, samma "Välj event"-namn. Dess
 * egen rationale för kommande-bara passar denna yta ordagrant: *"de två ytor
 * propen mintades för väljer ett event man ska GÖRA något med"* — en
 * ombokning till ett passerat event är inget Lotta ska kunna välja av misstag.
 *
 * SKILLNADEN MOT MANUELL ANMÄLAN är att valet INTE navigerar. Där ÄR eventet
 * routens parameter; här är det ett val inuti ett bekräftelsesteg på en annan
 * sidas route, och en navigering hade rivit steget. Väljaren äger inget state
 * själv (`onByte` är dess enda utväg), så lokalt state är formen.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SKÄLET VISAS — DET REDIGERAS INTE. EN MÄTT AVVIKELSE MOT KORTETS AC #2
 * ═══════════════════════════════════════════════════════════════════════════
 * Kortets AC #2 säger *"skälet förifyllt 'Ombokad till <event, datum>'
 * (redigerbart)"*. Serverkontraktet som `TASK-368.4` landade tillåter det
 * inte, och det är ett MEDVETET beslut där, inte en lucka:
 * `RebookRegistrationInput` bär ENDAST `registrationId` + `nyttEventId`, och
 * `rebook-registration/index.ts` säger rakt ut varför — *"INGET `skal`-FÄLT,
 * med avsikt … skälet ÄR ombokningen, och det härleds server-side ur
 * mål-eventet … En fritextparameter hade gjort formen valfri och därmed
 * obeständig."* Ett redigerbart fält här hade alltså tagit emot Lottas text
 * och tyst kastat den.
 *
 * Steget visar därför den EXAKTA rad servern kommer att skriva, som läsbar
 * text. Att den kan vara sann och inte ungefärlig är mätt: `ombokningsskal`
 * bygger den ur samma två Airtable-fält som serverns `byggOmbokningsmal`
 * läser (`ombokning-kvitto.ts` § KÄLLPARITETEN). Divergensen mot AC #2 är
 * rapporterad till orkestreraren; den avgörs av Marcus, inte här.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PRISSKILLNADEN KAN INTE SÄGAS I SIFFROR FÖRE BEKRÄFTELSEN
 * ═══════════════════════════════════════════════════════════════════════════
 * AC #3 vill ha beloppet både före och efter. EFTER går utmärkt — servern
 * svarar med `nyttPris` och `prisskillnad`, och kvittot visar dem
 * (`OmbokningsKvitto`). FÖRE saknas underlaget helt: eventets pris finns i
 * basen (`Eventplanering.Pris (kr)`, `Eventinnehåll.Pris (kr)`) men INGEN
 * klient-läsbar yta bär det — `get-event` och `get-events` returnerar inget
 * prisfält (disk-verifierat 2026-09-03 mot `_shared/event-map.ts` och
 * `Event.schema.ts`), och `rebook-registration` har inget torrkörningsläge.
 *
 * Steget säger därför vad som HÄNDER med pengarna, vilket är sant och känt,
 * och lovar inte ett tal det inte har. Att i stället gissa priset ur någon
 * annans öppna betalning på samma event hade varit ett tal utan täckning
 * (avtalat pris vinner per anmälan). Vägen fram — ett prisfält i `get-event`
 * eller ett torrkörningsläge i EF:en — är ett serverbeslut och rapporterat
 * som sådant.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * STEGET STÄNGS INTE AV `bekrafta()` — DET AVMONTERAS AV NAVIGERINGEN
 * ═══════════════════════════════════════════════════════════════════════════
 * Till skillnad från `AvbokningsYta.bekraftaAvbokning()`, som anropar
 * `stangSteget()` i sin `onSuccess`, gör denna funktion ingenting med
 * `AvbokningsYta`s `oppen`/`vy` — den navigerar bara. Den asymmetrin är
 * medveten och MÄTT, inte förbisedd (review `#2267` runda 1 reste exakt denna
 * fråga, härledd ur koden):
 *
 * En ombokning byter BÅDE `$eventId` och `$registrationId` i routen, och
 * `AnmalanDetail` med hela sitt underträd remountas då — `AvbokningsYta`s
 * state nollställs alltså av React, inte av ett anrop. Mätt 2026-09-03 med ett
 * tillfälligt mount-instrument (slumpat id på gruppens rot, avläst före och
 * efter navigeringen) i BÅDA cache-lägena: en förstagångs-ombokning
 * (`remount=true`) och en andra ombokning till en mål-anmälan vars detalj
 * redan låg färsk i cachen (`remount=true`). Instrumentet är borttaget;
 * beteendet bevakas i stället av tre acceptansfall i
 * `anmalan-ombokning.acceptance.test.ts` — steget stängt efter landning, samma
 * sak när målsidan är cachad, och att varken skältexten eller det valda
 * eventet läcker till den nya anmälan.
 *
 * VAD DET HÄNGER PÅ, öppet deklarerat: att målet ALLTID är ett annat event.
 * Servern garanterar det (`beslutaOmbokning` avvisar samma event med 409
 * `samma_event`), men om den regeln någon gång mjukas upp faller remounten och
 * steget skulle stå kvar öppet. Vakterna ovan fäller då — de finns just för
 * att korrektheten här vilar på en mekanism denna fil inte äger.
 */
export function OmbokningsSteg({
  registrationId,
  gammaltEventId,
  namn,
  onAvbryt,
}: {
  registrationId: string;
  /** Eventet anmälan bokas om FRÅN — invalideringen och väntelistan gäller det. */
  gammaltEventId: string;
  /** Personens namn — bär stegets tillgängliga namn. */
  namn: string;
  onAvbryt: () => void;
}) {
  const [nyttEventId, setNyttEventId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const bokaOm = useBokaOmAnmalan();

  const valjarRef = useRef<HTMLDivElement>(null);

  // Fokus in i steget när det öppnas: väljaren är stegets enda kontroll och
  // det första Lotta ska göra. Keyad på mount — steget är villkorad JSX i
  // förälderns render, så komponenten monteras om vid varje öppning
  // (`AvbokningsYta` § fokuseffekten för samma fälla åt andra hållet).
  useEffect(() => {
    valjarRef.current?.querySelector('button')?.focus();
  }, []);

  /**
   * EVENTET LÄSES UR LISTCACHEN, inte ur en egen hämtning. `EventValjare`
   * fyller `queryKeys.events.list` vid mount (dess egen `useQuery`), så raden
   * finns redan när `onByte` fyrat — samma cache, samma post, noll extra
   * anrop. Saknas den (kall cache, ett event som fallit ur listan) blir namnet
   * `null` och skältexten säger "okänt event" precis som serverns egen
   * fallback gör.
   */
  const valtEvent =
    nyttEventId === null
      ? undefined
      : queryClient.getQueryData<Event[]>(queryKeys.events.list)?.find((e) => e.id === nyttEventId);

  const skalrad = ombokningsskal(valtEvent?.eventNamn ?? null, valtEvent?.startdatum ?? null);

  function vidTangent(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Escape') return;
    // Escape stängs INTE när väljarens popover står öppen: React Arias
    // `Popover` konsumerar tangenten själv och stänger sig, och eventet
    // bubblar inte hit. Att ändå stoppa spridningen här är samma kontrakt som
    // `AvbokningsYta` § `vidTangent` — steget äger tangenten, inte sidan.
    event.preventDefault();
    event.stopPropagation();
    onAvbryt();
  }

  function bekrafta() {
    if (nyttEventId === null) return;
    bokaOm.mutate(
      { registrationId, nyttEventId, gammaltEventId },
      {
        onSuccess: (resultat) => {
          alertScreenReader(
            `Anmälan är ombokad till ${valtEvent?.eventNamn ?? 'det nya eventet'}.`,
          );
          // LANDNINGEN PÅ DEN NYA ANMÄLANS SIDA (AC #2) med kvittot i
          // navigeringens history-state — samma engångsfat-idiom som
          // `mmAvsloja`/`mmAtgardsUrval`, och spridningen bevarar routerns
          // interna nycklar. `nyttEventId` är serverns eko, inte vårt val:
          // svaret är facit för var den nya anmälan faktiskt hamnade.
          void navigate({
            to: '/event/$eventId/anmalan/$registrationId',
            params: { eventId: resultat.nyttEventId, registrationId: resultat.nyAnmalanId },
            state: (prev) => ({
              ...prev,
              mmOmbokningsKvitto: {
                nyAnmalanId: resultat.nyAnmalanId,
                nyttEventNamn: valtEvent?.eventNamn ?? 'det nya eventet',
                summaNyAnmalan: resultat.summaNyAnmalan,
                nyttPris: resultat.nyttPris,
                prisskillnad: resultat.prisskillnad,
                aterupptaget: resultat.aterupptaget,
              },
            }),
          });
        },
      },
    );
  }

  return (
    <fieldset
      onKeyDown={vidTangent}
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3"
    >
      <legend className="sr-only">{`Boka om anmälan för ${namn} till ett annat event`}</legend>
      <p className="my-0 text-small text-text-secondary">
        Personen får en ny anmälan på det event du väljer, och inbetalningarna följer med dit. Den
        här anmälan får statusen Avbokad/Ombokad med skälet ifyllt. Inget mail skickas.
      </p>

      {/* `form="fristaende"` är väljarens stora, luftiga ruta — formen Marcus
          valde för ytor där väljaren är det PRIMÄRA valet och aldrig står tom
          (`EventValjare.tsx` § form). Steget har inget annat val att göra. */}
      <div ref={valjarRef}>
        <EventValjare
          form="fristaende"
          valtEventId={nyttEventId ?? undefined}
          valtEvent={valtEvent}
          isDisabled={bokaOm.isPending}
          onByte={setNyttEventId}
        />
      </div>

      {nyttEventId !== null && (
        <>
          <div className="flex flex-col gap-1 rounded-xl bg-bg-muted p-3">
            {/* `h3`, INTE `h4` — närmast föregående rubrik på sidan är
                `DetaljGrupp`s `h2` ("Avbokning"), och axes `heading-order`
                fäller ett hopp över en nivå. MÄTT, inte gissat: första
                körningen av denna fils axe-test rapporterade exakt
                "Heading order invalid" på en `h4` här. `AvbokningsBetallage`
                bär samma `h4`-form i samma steg och har därmed samma
                överträdelse — den ligger bakom `VITE_FEATURE_BETALNINGAR`
                och har därför aldrig prövats av axe; fyndet är rapporterat,
                inte tyst lagat här (det är en annan skivas yta). */}
            <h3 className="my-0 font-medium text-caption text-text-secondary uppercase tracking-wide">
              Skäl
            </h3>
            {/* Skälet SKRIVS AV SERVERN — se filens docblock § SKÄLET VISAS.
                Texten är den exakta rad Noteringen kommer att bära, minus
                dess datum- och aktörsstämpel. */}
            <p className="my-0 text-body">{skalrad}</p>
            <p className="my-0 text-caption text-text-muted">
              Skälet fylls i automatiskt och sparas i anmälans notering.
            </p>
          </div>

          {/* PENGARNA, UTAN ETT TAL VI INTE HAR — se filens docblock
              § PRISSKILLNADEN. */}
          <p className="my-0 text-small text-text-muted">
            Inbetalningarna som sitter på den här anmälan flyttas till den nya. Prisskillnaden
            räknas ut av servern och visas på den nya anmälans sida.
          </p>
        </>
      )}

      <VantelistePaminnelse eventId={gammaltEventId} />

      {bokaOm.isError && (
        <p role="alert" className="text-(color:--mm-input-error-text) my-0 text-small">
          {`Ombokningen gick inte igenom: ${begripligtServerfel(bokaOm.error)} Anmälan är oförändrad.`}
        </p>
      )}

      {/* Avbryt FÖRST och i neutral standardform — samma APG-kontrakt som
          `AvbokningsYta` § "AVBRYT SOM STANDARDKNAPP". Bekräftelsen är
          `primary`, inte `danger`: ombokningen ger personen en plats, den tar
          inte bort en. */}
      <div className="flex flex-wrap gap-2">
        <Button intent="secondary" size="sm" onPress={onAvbryt}>
          Avbryt
        </Button>
        <Button
          intent="primary"
          size="sm"
          isDisabled={nyttEventId === null}
          isLoading={bokaOm.isPending}
          loadingText="Bokar om anmälan …"
          onPress={bekrafta}
        >
          Boka om anmälan
        </Button>
      </div>
    </fieldset>
  );
}
