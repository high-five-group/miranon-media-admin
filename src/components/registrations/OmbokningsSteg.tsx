import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { EventValjare } from '@/components/events/EventValjare';
import { Button } from '@/components/primitives';
import { useInbetalningarPerAnmalan } from '@/data/betalningar/useBetalningar';
import { useBokaOmAnmalan } from '@/data/mutations/registrationRebooking';
import type { Event } from '@/domain/models/Event';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { betalningarPa } from '@/lib/funktionsflaggor';
import { queryKeys } from '@/queries/keys';
// TYP-IMPORTEN ÄR OCKSÅ AUGMENTERINGENS BÄRARE. `ombokning-kvitto.ts`
// deklarerar `HistoryState.mmOmbokningsKvitto`, och en augmentering gäller bara
// i de kompileringsenheter som faktiskt drar in modulen. `import type` räcker
// (augmenteringen är ren typ-nivå) och gör samtidigt objektet nedan
// TYPKONTROLLERAT vid konstruktionen i stället för först vid läsningen.
import type { OmbokningsKvittoData } from './ombokning-kvitto';
import { ombokningsskal, prisbesked, prisskillnadFore } from './ombokning-pris';
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
 * PRISBESKEDET FÖRE BEKRÄFTELSEN [TASK-368.7 AC #2]
 * ═══════════════════════════════════════════════════════════════════════════
 * 368.5 kunde inte säga beloppet före bekräftelsen: ingen klient-läsbar yta
 * bar eventets pris. `TASK-368.7` lade fältet — `Event.pris`, prisets nivå 2
 * med Eventinnehåll-standarden som nivå 3, löst server-side med SAMMA
 * `valjPris` som ombokningens svar (`_shared/event-map.ts` § EVENTETS PRIS).
 *
 * Beskedet byggs av `prisbesked`, EXAKT samma funktion som kvittot efteråt
 * använder (`OmbokningsKvitto`) — samma tre grenar, samma ordalydelse, noll
 * duplicerade strängar. Talet kommer ur `prisskillnadFore`, vars paritet med
 * serverns `harledBetalning(...).saknas` är tvåsidigt bevisad i
 * `tests/api/ombokning-prisparitet.test.ts`; se den funktionens docblock för
 * varför de två indataleden är parvis samma tal.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * VARFÖR SUMMAN LIGGER BAKOM `betalningarPa()` — OCH VAD DET KOSTAR
 * ───────────────────────────────────────────────────────────────────────────
 * Andra ledet i formeln är de aktiva inbetalningarna som följer med, och den
 * ENDA källa som är sant identisk med serverns tal är
 * `Inbetalningslista.spegel.summaPostgres` (`hamta-inbetalningar` räknar det
 * med samma uttryck som `harledBetalning`). Basens `Summa inbetalt (kr)` hade
 * varit oflaggad och lättare att nå, men den är en SPEGEL som kan släpa
 * (ADR-128 beslut 6) — att bygga just den axel AC #2 handlar om på ett tal som
 * får avvika hade varit att lova en garanti vi inte har.
 *
 * Betalnings-EF:erna kräver migrationerna, Vault-hemligheten och cron-posten i
 * prod (`lib/funktionsflaggor.ts`), så hämtningen villkoras av flaggan. Den är
 * DESSUTOM villkorad av att ett event faktiskt är valt: `enabled` är
 * `betalningarPa() && nyttEventId !== null`, alltså noll nätverksanrop tills
 * Lotta gjort sitt val, och inget alls med flaggan av.
 *
 * SUMMAN OKÄND ⇒ INGET TAL PÅSTÅS. Med flaggan av (eller medan hämtningen
 * pågår) står den befintliga meningen kvar — att skicka `null` in i
 * `prisbesked` hade gett *"Priset på det nya eventet är inte satt"*, vilket är
 * FALSKT när priset är känt men summan inte hämtad. Det är två skilda okändheter
 * och de får inte säga samma sak.
 *
 * KOSTNADEN, öppet: `playwright.config.ts` sätter `VITE_FEATURE_BETALNINGAR:
 * 'av'` för hela acceptance-webServern (delad med visual/webblasarbeteende/
 * manifest-screenshots), så acceptansfallen når stegets tre grenar först när
 * fixturvärlden bär betalnings-EF-mockar — det arbete raden i
 * `playwright.config.ts` redan pekar ut som `TASK-346.6/346.7`s. De tre
 * grenarna prövas därför i `tests/api/ombokning-prisparitet.test.ts` (rena
 * funktionen, alla utfall) medan acceptansfallet prövar det som ÄR observerbart
 * med flaggan av: att steget inte gissar ett tal det saknar underlag för.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * STEGET STÄNGS INTE AV `bekrafta()` — MEKANISMEN ÄR CACHE-DRIVEN, INTE ROUTERN
 * ═══════════════════════════════════════════════════════════════════════════
 * Till skillnad från `AvbokningsYta.bekraftaAvbokning()`, som anropar
 * `stangSteget()` i sin `onSuccess`, gör denna funktion ingenting med
 * `AvbokningsYta`s `oppen`/`vy` — den navigerar bara. Den asymmetrin är
 * medveten (review `#2267` runda 1 reste frågan; runda 2 rättade den
 * FÖRSTA förklaringen — se nedan för vad som faktiskt håller den ihop).
 *
 * Ett param-byte i sig remountar INTE `AnmalanDetail`: `MatchInner`s `key`
 * härleds uteslutande ur `route.options.remountDeps ??
 * router.options.defaultRemountDeps` (källäst i
 * `node_modules/@tanstack/react-router/dist/esm/Match.js` 1.170.21, rad
 * 75-95), och ingen av dem är satt (`grep -rn remountDeps src/` → noll
 * träffar). En tidigare version av detta stycke hävdade motsatsen; det
 * påståendet var fel och är rättat.
 *
 * Det som FAKTISKT håller `AvbokningsYta`s state korrekt är TVÅ mekanismer
 * tillsammans:
 *   1. `AnmalanDetail`s `isPending`-gren (cache-miss): vid en förstagångs-
 *      ombokning finns mål-anmälans detalj inte i cachen, hela grenen byts
 *      mot en skeleton, och `AvbokningsYta` avmonteras som en BIEFFEKT.
 *   2. `key={registrationId}` på `<AvbokningsYta>` (`AnmalanDetail.tsx`,
 *      review `#2267` runda 2): en explicit remount-garanti för det läge
 *      (1) INTE täcker — när mål-anmälans detalj REDAN ligger varm i
 *      cachen vid landningen, vilket persist-lagret (`ADR-072`, `staleTime`
 *      5 min) gör till normalfall snarare än kantfall. Utan `key` hade
 *      React återanvänt samma komponentinstans med gammalt
 *      `oppen`/`vy`/`nyttEventId`-state.
 *
 * Beteendet bevakas av tre acceptansfall i
 * `anmalan-ombokning.acceptance.test.ts`: steget stängt efter en
 * förstagångs-ombokning (cache-miss-vägen), steget stängt efter en andra
 * ombokning mot ett mål vars cache redan var varm i SAMMA app-instans
 * (key-vägen — det enda fall som faktiskt kan visa en läcka), och att
 * varken skältexten eller det valda eventet läcker till den nya anmälan.
 *
 * VAD DET HÄNGER PÅ, öppet deklarerat: att målet ALLTID är ett annat event.
 * Servern garanterar det (`beslutaOmbokning` avvisar samma event med 409
 * `samma_event`), men om den regeln någon gång mjukas upp OCH `key`-
 * garantin någon gång tas bort blir state-läckan möjlig igen. Vakterna
 * ovan fäller då.
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

  /**
   * PRISBESKEDETS ANDRA LED — de aktiva inbetalningar som följer med till den
   * nya anmälan. Se filens docblock § PRISBESKEDET för varför källan är
   * Postgres-summan och inte basens spegel, och varför `enabled` bär BÅDA
   * villkoren. `undefined` (flaggan av, hämtningen pågår, EF:en föll) blir
   * `null` här — ett tal vi inte har, aldrig en nolla vi hittat på.
   */
  const { data: inbetalningar } = useInbetalningarPerAnmalan(
    registrationId,
    betalningarPa() && nyttEventId !== null,
  );
  const summaSomFoljerMed = inbetalningar?.spegel.summaPostgres ?? null;

  // `valtEvent?.pris ?? null` och inte `?? undefined`: fältet är OPTIONAL i
  // schemat (bakåtkompatibilitet mot cache från före TASK-368.7), och en gammal
  // cachad rad utan nyckeln ska läsas som "priset är okänt" — samma utfall som
  // ett event vars pris faktiskt saknas.
  const nyttPris = valtEvent?.pris ?? null;
  const prisskillnad = prisskillnadFore(nyttPris, summaSomFoljerMed);
  // BESKEDET VISAS BARA NÄR BÅDA LEDEN GÅR ATT AVGÖRA. `prisbesked(x, null)`
  // säger "priset är inte satt", vilket är fel utsaga när det är SUMMAN som
  // saknas — se docblocket § SUMMAN OKÄND.
  const besked = summaSomFoljerMed === null ? null : prisbesked(nyttPris, prisskillnad);

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
          const kvitto: OmbokningsKvittoData = {
            nyAnmalanId: resultat.nyAnmalanId,
            nyttEventNamn: valtEvent?.eventNamn ?? 'det nya eventet',
            summaNyAnmalan: resultat.summaNyAnmalan,
            nyttPris: resultat.nyttPris,
            prisskillnad: resultat.prisskillnad,
            aterupptaget: resultat.aterupptaget,
          };
          // LANDNINGEN PÅ DEN NYA ANMÄLANS SIDA (AC #2) med kvittot i
          // navigeringens history-state — samma engångsfat-idiom som
          // `mmAvsloja`/`mmAtgardsUrval`, och spridningen bevarar routerns
          // interna nycklar. `nyttEventId` är serverns eko, inte vårt val:
          // svaret är facit för var den nya anmälan faktiskt hamnade.
          void navigate({
            to: '/event/$eventId/anmalan/$registrationId',
            params: { eventId: resultat.nyttEventId, registrationId: resultat.nyAnmalanId },
            state: (prev) => ({ ...prev, mmOmbokningsKvitto: kvitto }),
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

          {/* PENGARNA — se filens docblock § PRISBESKEDET. Beskedet är
              `prisbesked`s exakta text, samma funktion och samma tre grenar
              som kvittot efter bekräftelsen. Saknas underlaget står den
              gamla, sanna meningen kvar i stället för ett gissat tal. */}
          {besked === null ? (
            <p className="my-0 text-small text-text-muted">
              Inbetalningarna som sitter på den här anmälan flyttas till den nya. Prisskillnaden
              räknas ut av servern och visas på den nya anmälans sida.
            </p>
          ) : (
            <div className="flex flex-col gap-1 rounded-xl bg-bg-muted p-3">
              {/* `h3` av samma skäl som Skäl-rubriken ovan: närmast föregående
                  rubrik är `DetaljGrupp`s `h2`, och axes `heading-order` fäller
                  ett hopp över en nivå. */}
              <h3 className="my-0 font-medium text-caption text-text-secondary uppercase tracking-wide">
                Pris
              </h3>
              <p className="my-0 text-body">{besked.text}</p>
              <p className="my-0 text-caption text-text-muted">
                Inbetalningarna som sitter på den här anmälan flyttas till den nya. Servern räknar
                om beloppet vid bekräftelsen.
              </p>
            </div>
          )}
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
