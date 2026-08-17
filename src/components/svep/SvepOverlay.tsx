import { X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/auth/useAuth';
import { ATGARDER, fyllPlatshallare } from '@/components/events/atgarder/atgardsmallar';
import { DetaljGrupp } from '@/components/events/detail/DetaljGrupp';
import { Button, Dialog, MessageBox, SlideToConfirm } from '@/components/primitives';
import { useSendActionTestEmail } from '@/data/mutations/actionEmail';
import { Adresslista } from './Adresslista';
import { Forhandsvisning, type TestUtfall } from './Forhandsvisning';
import { totalMottagare } from './svep-urval';
import type { SvepEventGrupp, SvepTyp } from './types';

const SVEP_RUBRIK: Record<SvepTyp, string> = {
  bekraftelse: 'Bekräfta alla',
  paminnelse: 'Skicka påminnelse till alla',
};

const ATGARD_NAMN: Record<SvepTyp, string> = {
  bekraftelse: 'Bekräftelsemail',
  paminnelse: 'Påminnelsemail',
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
 * SÄNDNINGEN ÄR STUBBAD, ÖPPET BOKFÖRD (kortets AC #5 och SCOPE-GRÄNSER):
 * armeringsinteraktionen (`SlideToConfirm` → `armerad`) är fullt byggd och
 * identisk med facit-läget "armerat" — men `skicka()` utför INGET
 * sändanrop. Det riktiga sändanropet (ETT per event-grupp, ADR-114 beslut 3)
 * är TASK-241.3s hela AC #2. Att bygga en falsk "skickar"/"resultat"-vy här
 * hade antingen ljugit om ett utfall eller byggt en yta 241.3 ändå måste
 * riva och göra om — `skicka()` stannar därför kvar på samma granska-skärm
 * och visar en `MessageBox` som säger exakt detta, i stället för att låtsas.
 *
 * TESTMAILET ÄR SKARPT (AC #4) — `useSendActionTestEmail`, samma kontrakt
 * `AtgardsSida.tsx`s `GranskningsSida` använder. Bundet till den grupp Lotta
 * FAKTISKT bläddrat till (`Forhandsvisning`s `onGruppVisas`), inte hårdkodat
 * till den första — se `Forhandsvisning.tsx`s docblock för hela motivet.
 */
export function SvepOverlay({
  svepTyp,
  eventGrupper,
  onClose,
}: {
  svepTyp: SvepTyp;
  eventGrupper: SvepEventGrupp[];
  onClose: () => void;
}) {
  const { user } = useAuth();
  const atgard = ATGARDER.find((a) => a.nyckel === svepTyp);
  const [armerad, setArmerad] = useState(false);
  const [aktuellGrupp, setAktuellGrupp] = useState<SvepEventGrupp | null>(eventGrupper[0] ?? null);
  const [sandningEjKopplad, setSandningEjKopplad] = useState(false);

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
            reason: error instanceof Error ? error.message : 'Okänt fel.',
          }),
      },
    );
  }

  /* STUBBEN — se filens docblock § SÄNDNINGEN ÄR STUBBAD. */
  function skicka() {
    setSandningEjKopplad(true);
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
        kanSkicka ? (
          <>
            <Button intent="secondary" onPress={onClose}>
              Avbryt
            </Button>
            {/* DYNAMISKA GRÖN-REGELN, verbatim ur `AtgardsSida.tsx`:
                oarmerat når klicket ingen utomstående → primary; armerat går
                utskicket iväg → success. Grönt betyder "nu går det iväg". */}
            <Button intent={armerad ? 'success' : 'primary'} isDisabled={!armerad} onPress={skicka}>
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
          just denna yta, prototypens punkt B). */}
      {kanSkicka && (
        <p className="text-body text-text-secondary">
          {ATGARD_NAMN[svepTyp]} till {total} {total === 1 ? 'person' : 'personer'} i{' '}
          {eventGrupper.length} event.
        </p>
      )}

      {/* BODY — den enda scrollande zonen. `motion-safe:animate-mm-avsloj` är
          husets allmänna mjuka entré. */}
      <div className="mt-4 max-h-[52vh] overflow-auto motion-safe:animate-mm-avsloj">
        {kanSkicka ? (
          <div className="flex flex-col gap-6">
            <DetaljGrupp id="grupp-svep-mottagare" rubrik="Mottagare">
              <Adresslista eventGrupper={eventGrupper} />
            </DetaljGrupp>

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

            {sandningEjKopplad && (
              <MessageBox intent="info" title="Sändningen är inte kopplad ännu">
                Skarp sändning byggs i nästa skiva (TASK-241.3). Ingenting har skickats.
              </MessageBox>
            )}
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
          Åtgärds-sidans egen sekvens. Se prototypens docblock för det mätta
          skälet (en dold slider under scroll-kanten gjorde en korrekt
          spärrad knapp obegriplig). */}
      {kanSkicka && (
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
