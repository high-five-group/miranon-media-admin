import { X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/auth/useAuth';
import { ATGARDER, fyllPlatshallare } from '@/components/events/atgarder/atgardsmallar';
import { DetaljGrupp } from '@/components/events/detail/DetaljGrupp';
import { Button, Dialog, MessageBox, SlideToConfirm } from '@/components/primitives';
import { useSendActionTestEmail } from '@/data/mutations/actionEmail';
import { type SvepGruppUtfall, useSendSvep } from '@/data/mutations/svepSend';
import type { Registration } from '@/domain/models/Registration';
import { Adresslista } from './Adresslista';
import { Forhandsvisning, type TestUtfall } from './Forhandsvisning';
import { ResultatVy } from './ResultatVy';
import { totalMottagare } from './svep-urval';
import type { SvepEventGrupp, SvepTyp } from './types';

/** De tre lägena på samma yta — samma grammatik som `AtgardsSida.tsx`s
    `GranskningsSida` (granska → skickar → resultat), se dess docblock. */
type SvepLage = 'granska' | 'skickar' | 'resultat';

const SVEP_RUBRIK: Record<SvepTyp, string> = {
  bekraftelse: 'Bekräfta alla',
  paminnelse: 'Skicka påminnelse till alla',
  // [TASK-241.8] Ingen bulk-knapp öppnar denna — bevakningsraden gör, ETT
  // event åt gången — men rubriken följer SAMMA grammatik som de andra två
  // ("Skicka X till alla [bekräftade utan stämpel för det eventet]").
  eventinfo: 'Skicka eventinformation',
};

const ATGARD_NAMN: Record<SvepTyp, string> = {
  bekraftelse: 'Bekräftelsemail',
  paminnelse: 'Påminnelsemail',
  eventinfo: 'Eventinformation',
};

/**
 * [TASK-241.2] Sändytans overlay-DIALOG — PROMOVERAD ur prototypens
 * `dev/svep-prototyp/SvepOverlay.tsx` (TASK-241.1 konvergensvarv 2,
 * Marcus-godkänd — se facit-manifestet `tasks/sessions/bilagor/
 * s102-svep-konvergens/facit.json`). Prototypkatalogen RÖRS INTE
 * (SCOPE-GRÄNSER, rivs i TASK-241.7).
 *
 * MODAL-ANSVARET FLYTTAT UPP TILL ANROPAREN (`Hem.tsx`), INTE HIT — det är
 * en STRUKTURELL följd av att det inte längre finns en dev-route som
 * äger `<Modal>`; `Hem` tar dess plats (samma fördelning som prototypen:
 * "route äger Modal, komponent äger Dialog"). Ren dataväg/plumbing-skillnad,
 * ALDRIG en formändring — `Hem.tsx` bär SCRIM/bredd/duration-klasserna
 * verbatim ur prototyp-routens docblock.
 *
 * SÄNDNINGEN ÄR SKARP (TASK-241.3 AC #2): `skicka()` går genom
 * `useSendSvep` (`data/mutations/svepSend.ts`) — STOPP-VILLKORET (AC #1)
 * prövade Åtgärds-sidans befintliga sändkontrakt (`dataSource.
 * sendActionEmail`, eventId + bulk `registrationIds[]`) och fann att det
 * REDAN levererar "ett sändanrop per event-grupp" när det anropas en gång
 * per grupp — ingen ny serverfunktions-yta byggdes. Tre lägen på samma yta
 * (`granska → skickar → resultat`), samma grammatik som `AtgardsSida.tsx`s
 * `GranskningsSida`: ingen konstgjord fördröjning, mutationens FAKTISKA
 * väntan bär `skickar`-lägets synlighet, och resultatet renderas PER
 * event-grupp (`ResultatVy`, ADR-114 beslut 3 — fel och delresultat
 * rapporteras per grupp, aldrig som en global siffra).
 *
 * `onSkickat` (TASK-241.3 AC #3, valfri): notifierar `Hem.tsx` om VILKA
 * registreringar som faktiskt gick igenom (unionen av samtliga gruppers
 * `lyckade`) när svepet landar i `resultat`-läget — Morgonkollens
 * skickat-markörer byggs av det anropet, inte av denna komponent (samma
 * "hem PEKAR, svepet SKICKAR"-ansvarsfördelning som ADR-114 beslut 1 redan
 * bär, applicerad på utfallet också).
 *
 * TESTMAILET ÄR SKARPT (AC #4) — `useSendActionTestEmail`, samma kontrakt
 * `AtgardsSida.tsx`s `GranskningsSida` använder. Bundet till den grupp Lotta
 * FAKTISKT bläddrat till (`Forhandsvisning`s `onGruppVisas`), inte hårdkodat
 * till den första — se `Forhandsvisning.tsx`s docblock för hela motivet.
 *
 * [TASK-241.5] BODYNS STAGGER — triadens sektioner kaskadar in i tur och
 * ordning i stället för att poppa in samtidigt, se docblocket vid `<div
 * className="mt-4 max-h-[52vh] …">` nedan. `Modal`s egen övergång
 * (skalning/duration/origin) bor i `Hem.tsx`s docblock — den filen äger
 * `<Modal>`, se dess § WOW-ÖVERGÅNGEN för hela resonemanget inklusive de
 * avfärdade alternativen.
 */
export function SvepOverlay({
  svepTyp,
  eventGrupper,
  avgiftstypByRegId,
  onClose,
  onSkickat,
}: {
  svepTyp: SvepTyp;
  eventGrupper: SvepEventGrupp[];
  /** [TASK-241.4] Adresslistans avgiftstyp-suffix — endast given av `Hem.tsx`
      för `svepTyp === 'paminnelse'` (`svep-urval.ts` §
      `paminnelseAvgiftstyperByRegId`). `undefined` för bekräftelsesvepet,
      som aldrig visar avgiftstyp (`Adresslista.tsx`s docblock). */
  avgiftstypByRegId?: Map<string, string>;
  onClose: () => void;
  onSkickat?: (lyckade: Registration[]) => void;
}) {
  const { user } = useAuth();
  const atgard = ATGARDER.find((a) => a.nyckel === svepTyp);
  const [armerad, setArmerad] = useState(false);
  const [aktuellGrupp, setAktuellGrupp] = useState<SvepEventGrupp | null>(eventGrupper[0] ?? null);
  const [lage, setLage] = useState<SvepLage>('granska');
  const [resultat, setResultat] = useState<SvepGruppUtfall[] | null>(null);
  const sendSvep = useSendSvep();

  /* [TASK-147.10, T53 väg C] SAMMA kontrakt som `AtgardsSida.tsx`s
     `GranskningsSida` — se den filens docblock. `aktuellGrupp?.event.id`
     kan vara `''` när urvalet är tomt (`kanSkicka === false`); hooken måste
     ändå monteras ovillkorat (React-regeln), och i det läget renderas
     testmail-raden aldrig, så mutationen anropas aldrig med ett tomt ID. */
  const sendActionTestEmail = useSendActionTestEmail(
    aktuellGrupp?.event.id ?? '',
    aktuellGrupp?.event.eventNamn ?? null,
  );
  const [testUtfall, setTestUtfall] = useState<TestUtfall>(null);

  const total = totalMottagare(eventGrupper);
  const kanSkicka = total > 0;
  const visarResultat = lage === 'resultat' && resultat != null;

  function skickaTest() {
    if (!aktuellGrupp || !atgard) return;
    const forsta = aktuellGrupp.mottagare[0];
    if (!forsta) return;
    setTestUtfall(null);
    sendActionTestEmail.mutate(
      {
        actionType: atgard.nyckel,
        registrationIds: [forsta.id],
        amne: atgard.amne,
        mailtext: atgard.mall,
      },
      {
        onSuccess: (result) => setTestUtfall(result),
        onError: (error) =>
          setTestUtfall({
            status: 'failed',
            reason: error instanceof Error ? error.message : 'Inget felmeddelande angavs.',
          }),
      },
    );
  }

  /* [TASK-241.3 AC #2] Ingen konstgjord fördröjning — mutationens FAKTISKA
     väntan bär `skickar`-lägets synlighet (samma princip som
     `AtgardsSida.tsx`s `skicka()`). `onSuccess` kan inte fira för denna
     specifika `mutate()`-anrop UTAN att `resultat` sätts (`useSendSvep`
     fångar varje grupps eget fel internt och löser alltid), men `onError`
     står kvar som ett defensivt golv mot ett äkta oväntat kast (t.ex. en
     trasig `amne`/`mailtext`-funktion) — samma "tillbaka till granska,
     handtaget nollställt"-grammatik som Åtgärds-sidan. */
  function skicka() {
    setLage('skickar');
    sendSvep.mutate(
      { svepTyp, eventGrupper, amne, mailtext },
      {
        onSuccess: (utfallPerGrupp) => {
          setResultat(utfallPerGrupp);
          setLage('resultat');
          onSkickat?.(utfallPerGrupp.flatMap((g) => g.lyckade));
        },
        onError: () => {
          setArmerad(false);
          setLage('granska');
        },
      },
    );
  }

  if (!atgard) return null;

  const amne = (grupp: SvepEventGrupp) =>
    fyllPlatshallare(atgard.amne, grupp.mottagare[0], grupp.event).text;
  const mailtext = (grupp: SvepEventGrupp) =>
    fyllPlatshallare(atgard.mall, grupp.mottagare[0], grupp.event).text;

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
            {/* DYNAMISKA GRÖN-REGELN, verbatim ur `AtgardsSida.tsx`:
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
      {/* STÄNGNINGSKNAPPEN — Åtgärds-sidans ghost-knapp, inget nytt kontroll-
          mönster (prototypens motiv, oförändrat: ytan är hög och scrollande,
          Escape ensam är ingen synlig affordans). */}
      <Button
        intent="ghost"
        size="sm"
        onPress={onClose}
        aria-label="Stäng"
        className="absolute top-4 right-4 data-[hovered]:bg-bg-emphasized"
      >
        <X aria-hidden="true" size={18} />
      </Button>

      {/* SAMMANFATTNINGEN — en naturlig mening, normal vikt (Marcus-dömt på
          just denna yta, prototypens punkt B). Dold i resultatläget — utfallet
          har redan sin egen `MessageBox`-sammanfattning (`ResultatVy`). */}
      {!visarResultat && kanSkicka && (
        <p className="text-body text-text-secondary">
          {ATGARD_NAMN[svepTyp]} till {total} {total === 1 ? 'person' : 'personer'} i{' '}
          {eventGrupper.length} event.
        </p>
      )}

      {/* BODY — den enda scrollande zonen. [TASK-241.5] `--animate-mm-avsloj`
          flyttad NER från denna behållare till varje enskild sektion
          (nedan) — samma token, inte en ny animation — så triadens LEDER
          kaskadar in i tur och ordning (Mottagare → Utskicket) i stället för
          att poppa in som EN platta samtidigt: "fortsättning av
          Morgonkollen", inte ett uppslag som byts i ett enda hopp. Stagern
          är en `animation-delay` på husets EGEN keyframe (`tailwind.css`
          `--animate-mm-avsloj`), inget nytt myntat. `motion-safe:` bär
          samma dubbelbälte som förut: under `prefers-reduced-motion` läggs
          `animate-mm-avsloj`-klassen aldrig på, så en satt `animationDelay`
          utan matchande `animation-name` är ett no-op — stagern kan aldrig
          läcka igenom reduced-motion-golvet. */}
      <div className="mt-4 max-h-[52vh] overflow-auto">
        {visarResultat && resultat ? (
          <div className="motion-safe:animate-mm-avsloj">
            <ResultatVy eventGrupper={eventGrupper} resultat={resultat} />
          </div>
        ) : kanSkicka ? (
          <div className="flex flex-col gap-6">
            <div className="motion-safe:animate-mm-avsloj">
              <DetaljGrupp id="grupp-svep-mottagare" rubrik="Mottagare">
                <Adresslista eventGrupper={eventGrupper} avgiftstypByRegId={avgiftstypByRegId} />
              </DetaljGrupp>
            </div>

            <div className="[animation-delay:70ms] motion-safe:animate-mm-avsloj">
              <DetaljGrupp id="grupp-svep-utskicket" rubrik="Utskicket">
                <Forhandsvisning
                  eventGrupper={eventGrupper}
                  amne={amne}
                  mailtext={mailtext}
                  testUtfall={testUtfall}
                  testPending={sendActionTestEmail.isPending}
                  testAdress={user?.email ?? null}
                  onSkickaTest={skickaTest}
                  onGruppVisas={setAktuellGrupp}
                />
              </DetaljGrupp>
            </div>
          </div>
        ) : (
          <div className="motion-safe:animate-mm-avsloj">
            <MessageBox intent="info" title="Inget att skicka just nu">
              {svepTyp === 'bekraftelse'
                ? 'Ingen väntar på bekräftelse längre.'
                : svepTyp === 'paminnelse'
                  ? 'Ingen väntar på påminnelse längre.'
                  : 'Alla bekräftade deltagare har redan fått eventinformation.'}
            </MessageBox>
          </div>
        )}
      </div>

      {/* ARMERINGEN LIGGER UTANFÖR SCROLLYTAN, direkt ovanför knappraden —
          Åtgärds-sidans egen sekvens. Se prototypens docblock för det mätta
          skälet (en dold slider under scroll-kanten gjorde en korrekt
          spärrad knapp obegriplig). */}
      {!visarResultat && kanSkicka && (
        <div className="mt-4">
          <SlideToConfirm
            label={
              svepTyp === 'bekraftelse'
                ? 'Bekräfta bekräftelsesvepet'
                : svepTyp === 'paminnelse'
                  ? 'Bekräfta påminnelsesvepet'
                  : 'Bekräfta eventinfo-svepet'
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
