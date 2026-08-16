import { X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/auth/useAuth';
import { DetaljGrupp } from '@/components/events/detail/DetaljGrupp';
import { Button, Dialog, MessageBox, SlideToConfirm } from '@/components/primitives';
import { Adresslista } from './Adresslista';
import { SVEP_RUBRIK, simuleraSand, svepInnehall, totalMottagare } from './data';
import { Forhandsvisning, type TestUtfall } from './Forhandsvisning';
import type { GruppUtfall, Scenario, SimEventGrupp, SvepLage, SvepTyp } from './types';

const ATGARD_NAMN: Record<SvepTyp, string> = {
  bekraftelse: 'Bekräftelsemail',
  paminnelse: 'Påminnelsemail',
};

/**
 * [PROTOTYPE, TASK-241.1] Sändytans overlay — KONVERGENSVARV 2.
 *
 * OVERLAY OVANPÅ HEM (Del 10 beslut 1). Komponenten äger sedan varv 2 HELA
 * dialogen (`Dialog`-anropet inkluderat), inte bara innehållet: footerns
 * knappar behöver armerings-tillståndet, och att lyfta det till routen hade
 * spridit sändlogiken över två filer.
 *
 * DIALOG-ANATOMI (Marcus-fynd 2, varv 1 saknade den helt). Tre zoner, med
 * husets `Dialog`-primitiv som bärare:
 *   1. HEADER  — `Dialog`s egen `<Heading slot="title">` (aria-labelledby-
 *      källan) + stängningsknapp + sammanfattningsraden.
 *   2. BODY    — egen `overflow-auto`-yta med Mottagare, Utskicket och
 *      armeringen.
 *   3. FOOTER  — `Dialog`s `actions`-prop, som ger husets egna
 *      `mt-6 flex justify-end gap-3` (`Dialog.tsx:70`): HÖGERSTÄLLD knapprad.
 *
 * HÖJDEN BÄRS AV BODYNS `max-h`, INTE av flexbox — och det är en MÄTT
 * rättelse, inte ett förstahandsval. Första försöket gav bodyn
 * `min-h-0 flex-1` inuti en `flex flex-col`-dialog; det såg riktigt ut men
 * FUNGERADE INTE, vilket skärmdumparna visade: i granska-läget klipptes hela
 * knappraden bort, och efter armering hade rubriken scrollat ur bild.
 * Orsaken är att `Dialog` lägger sina `children` i en EGEN mellanliggande
 * `<div className="mt-3 text-body">` (`Dialog.tsx:68`) — det är DEN som är
 * dialogens flex-barn, inte bodyn, så `flex-1` gällde fel element och
 * mellandiven växte fritt tills `actions` trycktes utanför `max-h`.
 * Med en `max-h` direkt på bodyn blir summan av zonerna alltid mindre än
 * dialogens egen `max-h`, och då står header och footer still utan att en
 * enda `position: sticky` behövs. `overflow-hidden` på dialogen är kvar som
 * säkerhetsnät.
 *
 * TALEN ÄR MÄTTA, inte uppskattade (DOM-mätning i båda viewporterna, se
 * slutrapporten): body `52vh` ger dialoghöjd 722 px mot taket 765 px på
 * desktop (1440x900) och 717 px mot 760 px på mobil (390x844) — cirka 43 px
 * marginal i BÅDA, med `90vh`-taket på mobil och `85vh` från `sm:` och uppåt.
 * Mobilen behöver det högre taket eftersom rubrik, sammanfattning och
 * knapprad alla radbryter där.
 *
 * TVÅ AVVIKELSER MOT UPPDRAGETS ORDALYDELSE, båda följer av att förebilden
 * MÄTTES och båda bokförda i slutrapporten:
 *
 * A. ARMERINGEN ÄR KVAR SOM `SlideToConfirm`. Uppdraget kallade den ett
 *    "främmande mönster som inte finns i huset" och bad mig ersätta den med
 *    "husets armeringsform, samma som Åtgärds-sidans skarpa sändning". De två
 *    halvorna pekar åt motsatt håll: Åtgärds-sidans skarpa sändning armeras
 *    med EXAKT denna primitiv och EXAKT denna prompt-sträng
 *    (`AtgardsSida.tsx:2762-2768`), och `SlideToConfirm` är en av husets egna
 *    primitiver (`src/components/primitives/SlideToConfirm.tsx`). Att riva
 *    den hade brutit samma-app-kriteriet, som väger tyngst.
 * B. SIFFRORNA I SAMMANFATTNINGEN ÄR I NORMAL VIKT. Här går jag i stället
 *    EMOT Åtgärds-sidan, som sätter `font-semibold text-xl tabular-nums` på
 *    sitt antal (`AtgardsSida.tsx:2540-2542`). Skälet är att Marcus dömde
 *    just den formen på DENNA yta ("utan jättesiffror ... i normal vikt") —
 *    och sändytan bär TVÅ tal (personer och event), där förlagan bär ett.
 */
export function SvepOverlay({
  svepTyp,
  scenario,
  onClose,
}: {
  svepTyp: SvepTyp;
  scenario: Scenario;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { eventGrupper, amne, mailtext } = svepInnehall(svepTyp, scenario);
  const [lage, setLage] = useState<SvepLage>('granska');
  const [resultat, setResultat] = useState<GruppUtfall[] | null>(null);
  const [armerad, setArmerad] = useState(false);
  const [testUtfall, setTestUtfall] = useState<TestUtfall>(null);
  const [testPending, setTestPending] = useState(false);

  const total = totalMottagare(eventGrupper);
  const kanSkicka = total > 0;
  const visarResultat = lage === 'resultat' && resultat != null;

  function skickaTest() {
    setTestPending(true);
    setTestUtfall(null);
    // SIMULERAT — ingen skarp sändning (kortets uttryckliga gräns). Samma
    // "servern löser adressen"-princip som `AtgardsSida.tsx`: knappen visar
    // den inloggade användarens EGEN adress, aldrig en mottagares.
    window.setTimeout(() => {
      setTestPending(false);
      setTestUtfall({ status: 'sent' });
    }, 500);
  }

  function skicka() {
    setLage('skickar');
    window.setTimeout(() => {
      setResultat(simuleraSand(eventGrupper, scenario));
      setLage('resultat');
    }, 700);
  }

  return (
    <Dialog
      title={SVEP_RUBRIK[svepTyp]}
      // `relative` bär stängningsknappen; `flex flex-col` gör header/body/
      // footer till tre zoner. Padding-höger lämnar plats åt stängningsknappen
      // så rubriken aldrig hamnar under den.
      className="relative max-h-[90vh] w-full overflow-hidden p-5 pr-14 sm:max-h-[85vh] sm:p-6 sm:pr-16"
      actions={
        visarResultat ? (
          <Button intent="primary" onPress={onClose}>
            Tillbaka till Hem
          </Button>
        ) : kanSkicka ? (
          <>
            <Button intent="secondary" onPress={onClose} isDisabled={lage === 'skickar'}>
              Avbryt
            </Button>
            {/* DYNAMISKA GRÖN-REGELN, verbatim ur `AtgardsSida.tsx:2771-2781`:
                oarmerat når klicket ingen utomstående → primary; armerat går
                utskicket iväg → success. Grönt betyder "nu går det iväg". */}
            <Button
              intent={armerad ? 'success' : 'primary'}
              isDisabled={!armerad || lage === 'skickar'}
              isLoading={lage === 'skickar'}
              loadingText="Skickar…"
              onPress={skicka}
            >
              Skicka till {total} {total === 1 ? 'person' : 'personer'}
            </Button>
          </>
        ) : (
          <Button intent="primary" onPress={onClose}>
            Tillbaka till Hem
          </Button>
        )
      }
    >
      {/* STÄNGNINGSKNAPPEN — MEDVETET TILLÄGG MOT HUSET (Marcus-fynd 2).
          Ingen av husets fyra befintliga dialoger har en synlig sådan
          (grep-verifierat: AddRegistrationModal, DokumentYta,
          SegmentMailCompose, DatumFalt). Motivet att avvika: de fyra är små
          formulärdialoger där Avbryt-knappen syns utan att scrolla — den här
          ytan är hög och scrollande, och Escape ensam är inte en synlig
          affordans. Formen är husets egen ghost-knapp, inte en ny kontroll. */}
      <Button
        intent="ghost"
        size="sm"
        onPress={onClose}
        aria-label="Stäng"
        className="absolute top-4 right-4 data-[hovered]:bg-bg-emphasized"
      >
        <X aria-hidden="true" size={18} />
      </Button>

      {/* SAMMANFATTNINGEN — en naturlig mening, normal vikt (se punkt B i
          docblocket). Står i headern, utanför scrollytan. */}
      {!visarResultat && kanSkicka && (
        <p className="text-body text-text-secondary">
          {ATGARD_NAMN[svepTyp]} till {total} {total === 1 ? 'person' : 'personer'} i{' '}
          {eventGrupper.length} event.
        </p>
      )}

      {/* BODY — den enda scrollande zonen. `motion-safe:animate-mm-avsloj` är
          husets allmänna mjuka entré (`tailwind.css:137`, opacity + 8 px
          uppåt, fem befintliga konsumenter). Uppdraget pekade i stället på
          `--animate-mm-tona-in`, men den animationens EGEN källa förbjuder
          bruket: "ENDAST för app-mount-crossfaden, inte en allmän ersättning
          för mm-avsloj" (`tailwind.css:169-171`). */}
      <div className="mt-4 max-h-[52vh] overflow-auto motion-safe:animate-mm-avsloj">
        {visarResultat && resultat ? (
          <ResultatVy eventGrupper={eventGrupper} resultat={resultat} />
        ) : kanSkicka ? (
          <div className="flex flex-col gap-6">
            {/* Adresslistans grupper monteras som DIREKTA barn till
                `DetaljGrupp` (den returnerar ett fragment) — husets
                `divide-y divide-border` bär då avdelarna mellan dem. Samma
                sak för förhandsvisningens rader. */}
            <DetaljGrupp id="grupp-svep-mottagare" rubrik="Mottagare">
              <Adresslista eventGrupper={eventGrupper} />
            </DetaljGrupp>

            <DetaljGrupp id="grupp-svep-utskicket" rubrik="Utskicket">
              <Forhandsvisning
                eventGrupper={eventGrupper}
                amne={amne}
                mailtext={mailtext}
                testUtfall={testUtfall}
                testPending={testPending}
                testAdress={user?.email ?? null}
                onSkickaTest={skickaTest}
              />
            </DetaljGrupp>
          </div>
        ) : (
          <MessageBox intent="info" title="Inget att skicka just nu">
            {svepTyp === 'bekraftelse'
              ? 'Ingen väntar på bekräftelse längre.'
              : 'Ingen väntar på påminnelse längre.'}
          </MessageBox>
        )}
      </div>

      {/* ARMERINGEN LIGGER UTANFÖR SCROLLYTAN, direkt ovanför knappraden —
          Åtgärds-sidans egen sekvens (`AtgardsSida.tsx:2762-2789`: slidern och
          knapparna i samma `flex flex-col gap-4`).
          MÄTT SKÄL att den inte får ligga i bodyn: första försöket gjorde det,
          och skärmdumpen visade då en grå, till synes död sändknapp UTAN att
          orsaken syntes — slidern låg nedanför scroll-kanten. Det är precis
          Marcus fynd 6 ("primärknappen får aldrig se disabled ut när den är
          aktiv"): knappen VAR korrekt spärrad, men spärrens förklaring var
          osynlig. Nu ser man alltid båda samtidigt, och armeringen är EN
          mekanism med en synlig konsekvens. */}
      {!visarResultat && kanSkicka && (
        <div className="mt-4">
          <SlideToConfirm
            label={
              svepTyp === 'bekraftelse' ? 'Bekräfta bekräftelsesvepet' : 'Bekräfta påminnelsesvepet'
            }
            prompt="Dra för att bekräfta"
            confirmedLabel="Bekräftat"
            isSelected={armerad}
            onChange={setArmerad}
          />
        </div>
      )}
    </Dialog>
  );
}

/**
 * RESULTATLÄGET — per event-grupp (ADR-114 beslut 3: fel och delresultat
 * rapporteras PER EVENT, aldrig som en global siffra).
 *
 * VARV 2: ingen egen `<h2>` längre. Varv 1 satte en ("Skickat" / "Inget
 * skickades") ovanpå dialogens `Heading` och fick två konkurrerande rubriker
 * i samma vy. Utfallets rubrik bärs nu av `MessageBox`ens `title`, som redan
 * hade den — och dialogens rubrik står kvar och beskriver YTAN, inte läget.
 * Regeln från `AtgardsSida.tsx` gäller oförändrat: noll lyckade renderas
 * ALDRIG som grön framgång.
 */
function ResultatVy({
  eventGrupper,
  resultat,
}: {
  eventGrupper: SimEventGrupp[];
  resultat: GruppUtfall[];
}) {
  const eventNamn = new Map(eventGrupper.map((g) => [g.eventId, g.eventNamn] as const));
  const lyckade = resultat.reduce((sum, g) => sum + g.lyckade.length, 0);
  const fallna = resultat.reduce((sum, g) => sum + g.fallna.length, 0);
  const totalt = lyckade + fallna;

  return (
    <div className="flex flex-col gap-6">
      <MessageBox
        intent={fallna === 0 ? 'success' : lyckade === 0 ? 'warning' : 'info'}
        title={
          fallna === 0
            ? 'Utskicket lyckades'
            : lyckade === 0
              ? 'Ingen fick mailet'
              : 'Utskicket lyckades delvis'
        }
      >
        {lyckade > 0 && (
          <p>
            {lyckade} av {totalt} {lyckade === 1 ? 'person fick' : 'personer fick'} mailet.
          </p>
        )}
        {fallna > 0 && (
          <p>
            {fallna} fick det inte. Skälet står på respektive event nedan, och du kan gå tillbaka
            och köra om just de grupperna.
          </p>
        )}
      </MessageBox>

      <DetaljGrupp id="grupp-svep-resultat" rubrik="Utfall per event">
        {resultat.map((g) => (
          <EventUtfallRad
            key={g.eventId}
            utfall={g}
            eventNamn={eventNamn.get(g.eventId) ?? g.eventId}
          />
        ))}
      </DetaljGrupp>
    </div>
  );
}

/** Utfallet som en RAD i husets grupp-kort, inte som ett eget inramat kort
    (samma en-nivå-regel som `Adresslista.tsx` — Marcus-fynd 3). */
function EventUtfallRad({ utfall, eventNamn }: { utfall: GruppUtfall; eventNamn: string }) {
  const total = utfall.lyckade.length + utfall.fallna.length;
  const intent =
    utfall.status === 'sent' ? 'success' : utfall.status === 'partial' ? 'info' : 'warning';
  return (
    <div className="flex min-w-0 flex-col gap-1.5 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate font-medium text-body">{eventNamn}</span>
        <StatusText intent={intent} lyckade={utfall.lyckade.length} total={total} />
      </div>
      {utfall.fallna.length > 0 && (
        <ul className="flex flex-col gap-1">
          {utfall.fallna.map((f) => (
            <li key={f.mottagare.id} className="text-caption text-text-muted">
              {f.mottagare.namn}: {f.skal}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusText({
  intent,
  lyckade,
  total,
}: {
  intent: 'success' | 'info' | 'warning';
  lyckade: number;
  total: number;
}) {
  const klass =
    intent === 'success'
      ? 'text-(--mm-success)'
      : intent === 'info'
        ? 'text-text-secondary'
        : 'text-(--mm-warning)';
  return (
    <span className={`shrink-0 text-caption tabular-nums ${klass}`}>
      {lyckade} av {total} lyckades
    </span>
  );
}
