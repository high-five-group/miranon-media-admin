import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { AvbokningsBetallage } from '@/components/betalningar/AvbokningsBetallage';
import { DetaljGrupp } from '@/components/events/detail/DetaljGrupp';
import { Button, TextArea } from '@/components/primitives';
import { useAtertaAvbokning, useAvbokaAnmalan } from '@/data/mutations/registrationCancellation';
import { RegistrationStatus, type RegistrationStatusValue } from '@/domain/types/Status';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { betalningarPa } from '@/lib/funktionsflaggor';
import { OmbokningsSteg } from './OmbokningsSteg';
import { begripligtServerfel } from './serverfel';
import { VantelistePaminnelse } from './VantelistePaminnelse';

/**
 * [TASK-368.3] Avbokningen på anmälans egen sida: knappen, bekräftelsesteget
 * med frivilligt skäl och betalläge, och återtagandet.
 *
 * [TASK-368.5] Samma steg bär nu TVÅ vägar och en påminnelse: en tredje knapp
 * "Boka om till annat event" som växlar in `OmbokningsSteg` i stället för
 * avbokningsformen (`vy`-state nedan), och väntelistepåminnelsen
 * (`VantelistePaminnelse`) mellan betalläget och felraden. `begripligtServerfel`
 * bodde tidigare i denna fil och är flyttad till `serverfel.ts` — samma kod,
 * nu två konsumenter; se den filens huvud för varför.
 *
 * PRD `TASK-368` beslut 2 (grillad samsyn, sessionsdok S115 Del 3):
 * *"'Avboka anmälan' på anmälans egen sida, sekundär destruktiv ton,
 * bekräftelsesteg. Inte på Åtgärds-sidan (den är byggd för mail till många)."*
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ETT INLINE-STEG, INTE EN MODAL — HUSETS FORM FÖR EN ENGÅNGSFRÅGA
 * ═══════════════════════════════════════════════════════════════════════════
 * `InbetalningsLista`s makulerings- och raderingsbekräftelser säger det rakt
 * ut i sin egen kommentar: *"'ÖPPNAS PÅ PLATS'-MÖNSTRET … samma inline-form
 * som `RegistreraForm`/`AterbetalningsForm`, ingen modal för en
 * engångsfråga."* Samma form här, och den betalar sig en gång till i just
 * detta steg: den direkta vägen till "Registrera återbetalning" (AC #2) kan
 * skicka Lotta till betalningsytan högre upp på sidan UTAN att steget rivs
 * ned — ett halvskrivet skäl står kvar. En modal hade tvingat fram antingen
 * en stängning (skälet förlorat) eller en andra återbetalningsyta inuti
 * dialogen.
 *
 * TILLGÄNGLIGHETEN BÄRS AV `<fieldset>` + `<legend class="sr-only">`, exakt
 * raderingsbekräftelsens form: steget är en namngiven grupp av kontroller,
 * och namnet innehåller vems anmälan det gäller.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * "AVBRYT SOM STANDARDKNAPP" (WAI-ARIA APG) — VAD DET BETYDER HÄR
 * ═══════════════════════════════════════════════════════════════════════════
 * APG:s dialog-vägledning: när en handling är svår att ångra ska den minst
 * destruktiva vägen vara den som ligger närmast till hands. Tre konkreta
 * saker gör det sant i detta steg:
 *
 *   1. Steget är INGET `<form>`, och båda knapparna är `type="button"`
 *      (React Arias default). Det finns alltså ingen implicit
 *      submit-knapp som ett Enter-tryck kan råka lösa ut — det destruktiva
 *      klicket kräver ett medvetet tryck på just den knappen.
 *   2. Avbryt står FÖRST i knappraden och bär den neutrala standardformen
 *      (`intent="secondary"`); avbokningen bär `intent="danger"`.
 *   3. Escape stänger steget, samma tangentkontrakt som husets övriga
 *      inline-bekräftelser (`InbetalningsLista` § `vidRaderaTangent`).
 *
 * FOKUS LANDAR ÄNDÅ I SKÄLFÄLTET (kortets AC #2), inte på Avbryt: fältet är
 * det enda Lotta faktiskt ska skriva i, och ett Enter där ger en radbrytning,
 * aldrig en avbokning. De två kraven krockar alltså inte.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VILKA STATUSAR SOM BÄR EN KNAPP — OCH VARFÖR RESTEN INTE GÖR DET
 * ═══════════════════════════════════════════════════════════════════════════
 * `AnmalanDetail` döljer sedan S83 ALLA åtgärder för avvikande anmälningar
 * (se dess `statusLage`-docblock, review-fynd F1). Denna yta bevarar den
 * regeln med EXAKT ett tillägg: "Avbokad/Ombokad" får återtagandet.
 * "Inställt" och "Flytta till väntelista" bär fortfarande ingen knapp alls
 * — och det är inte en förbiseende utan serverns kontrakt: `cancel-
 * registration` tillåter bara två övergångar (aktiv → avbokad, avbokad →
 * härledd status), så en knapp för de statusarna hade kunnat leda till
 * exakt ett utfall: ett 409.
 *
 * Källa för de tre aktiva statusarna:
 * `supabase/functions/_shared/cancel-registration.ts`
 * § ÖVERGÅNGSTABELLEN — inte gissat härifrån.
 */

/** De tre statusar servern tillåter en avbokning FRÅN (EF:ens övergångstabell). */
const AKTIVA_STATUSAR: readonly RegistrationStatusValue[] = [
  RegistrationStatus.OBEKRAFTAD,
  RegistrationStatus.BEKRAFTAD,
  RegistrationStatus.BETALNINGSPAMINNELSE,
];

type Lage = 'aktiv' | 'avbokad' | 'ingen';

export function harledAvbokningslage(status: RegistrationStatusValue | null): Lage {
  if (status === RegistrationStatus.AVBOKAD) return 'avbokad';
  if (status !== null && AKTIVA_STATUSAR.includes(status)) return 'aktiv';
  return 'ingen';
}

export function AvbokningsYta({
  eventId,
  registrationId,
  namn,
  status,
}: {
  eventId: string;
  registrationId: string;
  /** Personens namn — bär stegets tillgängliga namn ("Avboka anmälan för X"). */
  namn: string;
  status: RegistrationStatusValue | null;
}) {
  const lage = harledAvbokningslage(status);

  const [oppen, setOppen] = useState(false);
  /**
   * [TASK-368.5] Vilken av stegets TVÅ vägar som står framme. Boka om är ett
   * ALTERNATIV till avbokningen, inte ett tillägg till den (PRD beslut 7:
   * *"genvägen … i avbokningssteget"*), så vyerna ersätter varandra i stället
   * för att staplas: avbokningens fritextskäl är meningslöst i ombokningen
   * (servern skriver sitt eget skäl, `OmbokningsSteg` § SKÄLET VISAS), och två
   * bekräftelseknappar i samma fieldset hade gjort det otydligt vilken
   * handling Escape avbryter.
   */
  const [vy, setVy] = useState<'avboka' | 'bokaom'>('avboka');
  const [skal, setSkal] = useState('');

  const avboka = useAvbokaAnmalan();
  const aterta = useAtertaAvbokning();

  const avbokaTriggerRef = useRef<HTMLButtonElement>(null);
  const atertaTriggerRef = useRef<HTMLButtonElement>(null);
  const skalRef = useRef<HTMLTextAreaElement>(null);
  // Vilken knapp fokus ska landa på när nästa läge monterat. Fokusflytten kan
  // inte ske i mutationens callback: knappen som ska ta emot fokus finns inte
  // förrän statusen bytt och komponenten renderat om.
  const fokusEfter = useRef<Lage | null>(null);

  // Fokus-retur till triggern när steget stängs med Avbryt/Escape — samma
  // anatomi som `AterbetalningsYta`s `skaAterfaFokus`. Flaggan behövs för att
  // skilja "Lotta avbröt" (fokus tillbaka) från "avbokningen gick igenom"
  // (fokus vidare till Återta-knappen, `fokusEfter` nedan).
  const aterfaFokus = useRef(false);

  // Fokus in i skälfältet när steget öppnas (AC #2), och tillbaka till
  // triggern när det stängs. Keyad på `oppen`, inte en mount-effekt: steget
  // är villkorad JSX i SAMMA komponentinstans, så en tom dependency-lista
  // hade bara träffat första renderingen (`InbetalningsLista` § panelernas
  // fokuseffekt, samma fälla). Och fokusflytten kan inte ske i `avbryt()`
  // självt: triggern renderas först i nästa pass, så refen är null just då.
  useEffect(() => {
    if (oppen) {
      skalRef.current?.focus();
      return;
    }
    if (aterfaFokus.current) {
      aterfaFokus.current = false;
      avbokaTriggerRef.current?.focus();
    }
  }, [oppen]);

  useEffect(() => {
    if (fokusEfter.current === null || fokusEfter.current !== lage) return;
    fokusEfter.current = null;
    if (lage === 'avbokad') atertaTriggerRef.current?.focus();
    if (lage === 'aktiv') avbokaTriggerRef.current?.focus();
  }, [lage]);

  if (lage === 'ingen') return null;

  function stangSteget() {
    setOppen(false);
    setSkal('');
    // Nästa öppning börjar ALLTID i avbokningsvyn: knappen som öppnar steget
    // heter "Avboka anmälan", och att den ibland hade landat i ombokningen
    // (för att Lotta råkade titta på den förra gången) vore en handling som
    // inte matchar sin trigger.
    setVy('avboka');
  }

  function avbryt() {
    aterfaFokus.current = true;
    stangSteget();
    avboka.reset();
  }

  function vidTangent(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      avbryt();
    }
  }

  /**
   * SKÄLET SKICKAS BARA NÄR DET FINNS. Servern trimmar och tak-kontrollerar
   * själv (`CancelRegistration.schema.ts`), men en tom sträng hade blivit en
   * `skal`-nyckel i kroppen och därmed sett ut som ett medvetet tomt skäl.
   * Nyckeln utelämnas i stället — samma form som adaptern redan använder.
   *
   * UTFALLET ANNONSERAS VIA HUSETS `alertScreenReader`, inte via en egen
   * `role="status"`-rad. Skälet är mekaniskt: en live-region måste finnas i
   * DOM:en INNAN texten byts för att läsas upp, och en rad som monteras
   * samtidigt som sin text gör den inte det. `alertScreenReader` äger en
   * global, redan monterad region och en 100 ms fördröjning just för detta
   * (`src/lib/alert-screen-reader.ts` § APPEND_DELAY). Det SYNLIGA beskedet
   * bärs av att ytan byter form: texten och knappen blir återtagandets, och
   * headerns statusbadge byter till Avbokad/Ombokad i samma render.
   */
  function bekraftaAvbokning() {
    const trimmat = skal.trim();
    avboka.mutate(
      { registrationId, eventId, ...(trimmat === '' ? {} : { skal: trimmat }) },
      {
        onSuccess: () => {
          stangSteget();
          alertScreenReader('Anmälan är avbokad.');
          fokusEfter.current = 'avbokad';
        },
      },
    );
  }

  function atertaAvbokningen() {
    aterta.mutate(
      { registrationId, eventId },
      {
        onSuccess: (resultat) => {
          alertScreenReader(`Avbokningen är återtagen. Statusen är nu ${resultat.status}.`);
          fokusEfter.current = 'aktiv';
        },
      },
    );
  }

  return (
    // GRUPPSKALET BOR HÄR, inte hos `AnmalanDetail`: ytan kan rendera null
    // (Inställt/Flytta till väntelista), och en `DetaljGrupp` runt en
    // null-renderande komponent hade gett en tom rubrik ovanför ett tomt
    // kort. Att äga skalet är det enda sättet att kunna utebli helt.
    <DetaljGrupp id="grupp-avbokning" rubrik="Avbokning">
      <div className="flex flex-col gap-2 py-3">
        {lage === 'aktiv' && !oppen && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-small text-text-muted">
              Avbokningen ändrar bara statusen. Inget mail skickas.
            </span>
            {/* SEKUNDÄR DESTRUKTIV TON (AC #2): `danger` + `outline` är husets
              tvådimensionella variantmodell för exakt det — färgen bär
              semantiken, vikten hålls nere eftersom knappen står inne i ett
              kort och inte är sidans primära handling (`Button.tsx` § §19
              emphasis-regeln). */}
            <Button
              ref={avbokaTriggerRef}
              intent="danger"
              emphasis="outline"
              size="sm"
              onPress={() => setOppen(true)}
            >
              Avboka anmälan
            </Button>
          </div>
        )}

        {lage === 'aktiv' && oppen && vy === 'bokaom' && (
          <OmbokningsSteg
            registrationId={registrationId}
            gammaltEventId={eventId}
            namn={namn}
            onAvbryt={avbryt}
          />
        )}

        {lage === 'aktiv' && oppen && vy === 'avboka' && (
          <fieldset
            onKeyDown={vidTangent}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3"
          >
            <legend className="sr-only">{`Avboka anmälan för ${namn}`}</legend>
            <p className="my-0 text-small text-text-secondary">
              Anmälan får statusen Avbokad/Ombokad. Personen försvinner ur betalningsinkorgen och
              dörrlistan, och platsen blir ledig igen. Inget mail skickas.
            </p>

            <TextArea
              ref={skalRef}
              label="Skäl (frivilligt)"
              description="Skälet sparas i anmälans notering och syns i Senaste aktivitet."
              value={skal}
              onChange={setSkal}
              rows={3}
            />

            {/* Betalläget är det ENDA i steget som miljöflaggan gatar. Se
              `AvbokningsBetallage` för varför monteringen, och inte
              hook-anropet, är det som villkoras. */}
            {betalningarPa() && <AvbokningsBetallage anmalanRecordId={registrationId} />}

            {/* [TASK-368.5 AC #4] Väntelistepåminnelsen står MELLAN betalläget
              och felraden: den svarar på Lottas nästa fråga ("kan jag erbjuda
              platsen?") efter att hon sett pengarna, och före allt som kan gå
              fel. Ordningen är uppdragets, inte vald här. Raden uteblir helt
              när ingen väntar eller talet är okänt — se komponenten. */}
            <VantelistePaminnelse eventId={eventId} />

            {avboka.isError && (
              <p role="alert" className="text-(color:--mm-input-error-text) my-0 text-small">
                {`Avbokningen gick inte igenom: ${begripligtServerfel(avboka.error)} Anmälan är oförändrad.`}
              </p>
            )}

            {/* Avbryt FÖRST och i neutral standardform — se docblocket
              § "AVBRYT SOM STANDARDKNAPP". */}
            <div className="flex flex-wrap gap-2">
              <Button intent="secondary" size="sm" onPress={avbryt}>
                Avbryt
              </Button>
              <Button
                intent="danger"
                size="sm"
                isLoading={avboka.isPending}
                loadingText="Avbokar anmälan …"
                onPress={bekraftaAvbokning}
              >
                Avboka anmälan
              </Button>
              {/* [TASK-368.5] TREDJE knappen, sist i raden — inte andra.
                Placeringen är uppdragets ("Boka om-valet = tredje knapp") och
                den bevarar APG-formen ovan orörd: Avbryt först och närmast
                till hands, den destruktiva handlingen näst, alternativet
                sist. Att skjuta in ett val MELLAN Avbryt och Avboka hade
                flyttat den destruktiva knappen längre bort från sin egen
                etikett i tabbordningen utan att någon bett om det.

                `secondary` och inte `danger`: ombokningen ger personen en
                plats på ett annat event — den tar inte bort en. */}
              <Button intent="secondary" size="sm" onPress={() => setVy('bokaom')}>
                Boka om till annat event
              </Button>
            </div>
          </fieldset>
        )}

        {lage === 'avbokad' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-small text-text-muted">
                Anmälan är avbokad. Återtagandet ger tillbaka den status den hade.
              </span>
              <Button
                ref={atertaTriggerRef}
                intent="secondary"
                emphasis="outline"
                size="sm"
                isLoading={aterta.isPending}
                loadingText="Återtar avbokningen …"
                onPress={atertaAvbokningen}
              >
                Återta avbokning
              </Button>
            </div>
            {aterta.isError && (
              <p role="alert" className="text-(color:--mm-input-error-text) my-0 text-small">
                {`Återtagandet gick inte igenom: ${begripligtServerfel(aterta.error)} Anmälan är oförändrad.`}
              </p>
            )}
          </>
        )}
      </div>
    </DetaljGrupp>
  );
}
