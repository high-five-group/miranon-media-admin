import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, MessageBox } from '@/components/primitives';
import { useJobbstatus } from '@/data/betalningar/useJobbstatus';
import { useKoaKvitton } from '@/data/mutations/inbetalningar';
import { visaKronor } from './belopp-inmatning';
import { type Betalsatt, lasSenasteBetalsatt, sparaBetalsatt } from './betalsatt-minne';
import { idagIso } from './idag';
import { type InkorgsRad, jobbDelutfall } from './inkorg-harledningar';
import { RegistreraForm, type RegistreringsUtfall } from './RegistreraForm';

type Props = {
  /** Anmälan som ska betalas, härledd ur den globala listan över öppna. */
  rad: InkorgsRad;
  /** Trigger-knappens etikett. ORDLISTA § Inbetalning: handlingen heter så. */
  etikett?: string;
};

/**
 * [TASK-346.7 AC #2/#3/#4] Registreringen som EN ÅTERANVÄNDBAR YTA - knappen,
 * formuläret på plats, och vad som händer med kvittot efteråt.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SAMMA FORMULÄR, INTE ETT LIKNANDE
 * ═══════════════════════════════════════════════════════════════════════════
 * PRD § Ytorna (beslut 10): "Samma formulär nås från Åtgärds-sidan, anmälans
 * detaljvy och personkortet." Denna komponent monterar `RegistreraForm`
 * (TASK-346.6) OFÖRÄNDRAD - samma belopps-knappar, samma normalisering, samma
 * Enter-genväg, samma felmeddelanden vid fältet. En andra implementation hade
 * varit fyra ytor som kan drifta isär, och beloppsfältet är det mest
 * felbenägna i hela domänen.
 *
 * PERSONEN ÄR FÖRVALD därför att `rad` ÄR anmälan: formuläret tar en
 * `InkorgsRad` och har därmed redan namn, pris, avgift och redan inbetalt.
 * Ingen av ytorna behöver välja mottagare.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR EN EGEN KOMPONENT OCH INTE `BetalningsradKort`
 * ═══════════════════════════════════════════════════════════════════════════
 * Inkorgens radkort bär två saker som är INKORGENS och ingen annans: radens
 * hela listlayout (`<li>` med event-etikett och märken), och regeln att
 * fokus efter en registrering går till SÖKFÄLTET (AC #3 i TASK-346.6). Den
 * regeln är en granskningsfynd-fix och får inte generaliseras hit, där det
 * inte finns något sökfält att återvända till.
 *
 * Det som ÄR gemensamt - fokus-returen till trigger-knappen när formuläret
 * stängs utan att spara - är kopierat i FORM men inte i kod, av samma skäl
 * som ovan: att refaktorera inkorgens kort mitt i denna skiva hade riskerat
 * exakt den fokus-regression 346.6:s granskning redan betalat för att laga.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * "REGISTRERA FÖRST, SKICKA SEDAN" GÄLLER HÄR OCKSÅ
 * ═══════════════════════════════════════════════════════════════════════════
 * PRD berättelse 7: Enter sparar UTAN att skicka något. Kryssrutan "Skicka
 * kvitto" lägger inbetalningen i en väntande lista, och knappen "Skicka N
 * kvitton" köar dem i ETT jobb - samma tvåstegsform som inkorgen.
 *
 * DEN KÄNDA GRÄNSEN, samma som inkorgens och lika öppet bokförd: listan är
 * session-lokal. Stängs fliken innan Lotta tryckt står inbetalningen kvar
 * utan kvitto. Ett durabelt svar kräver ett fält på `OppenBetalning` som
 * säger "denna anmälan har inbetalningar utan kvitto", och den ytan ägs av
 * TASK-346.4:s Edge Functions - inte av denna skiva.
 */
export function RegistreraYta({ rad, etikett = 'Registrera betalning' }: Props) {
  const [oppen, setOppen] = useState(false);
  const [kvittens, setKvittens] = useState<string | null>(null);
  const [betalsatt, setBetalsatt] = useState<Betalsatt>(lasSenasteBetalsatt);
  const [vantande, setVantande] = useState<{ inbetalningId: string; belopp: number }[]>([]);
  const [jobbId, setJobbId] = useState<string | undefined>(undefined);
  const idag = useMemo(idagIso, []);

  const koa = useKoaKvitton();
  const jobb = useJobbstatus(jobbId, jobbId !== undefined);

  /* FOKUS-RETUR: formuläret ERSÄTTER trigger-knappen i DOM:en, så noden som
     bar fokus rivs när ytan öppnas. Utan returen faller fokus till
     `document.body` och en tangentbords-Lotta börjar om från sidans topp.
     Samma anatomi som `BetalningsradKort` och `DetaljGrupp.tsx` § AndraRad.
     Flaggan sätts bara av Avbryt och Esc - en lyckad registrering låter
     kvittensen ta över, och en ovillkorlig retur hade tävlat med den. */
  const triggerRef = useRef<HTMLButtonElement>(null);
  const varOppen = useRef(false);
  const skaAterfaFokus = useRef(false);

  useEffect(() => {
    if (varOppen.current && !oppen && skaAterfaFokus.current) {
      skaAterfaFokus.current = false;
      triggerRef.current?.focus();
    }
    varOppen.current = oppen;
  }, [oppen]);

  function avbryt() {
    skaAterfaFokus.current = true;
    setOppen(false);
  }

  function vidKlar(resultat: RegistreringsUtfall) {
    setKvittens(resultat.kvittens);
    setOppen(false);
    sparaBetalsatt(betalsatt);

    if (resultat.medKvitto && resultat.skickaNu) {
      koa.mutate(
        { inbetalningIds: [resultat.inbetalningId] },
        { onSuccess: (svar) => setJobbId(svar.jobbId ?? undefined) },
      );
    } else if (resultat.medKvitto) {
      setVantande((tidigare) => [
        ...tidigare,
        { inbetalningId: resultat.inbetalningId, belopp: resultat.belopp },
      ]);
    }
  }

  function skickaKvitton() {
    if (vantande.length === 0) return;
    koa.mutate(
      { inbetalningIds: vantande.map((v) => v.inbetalningId) },
      {
        onSuccess: (svar) => {
          setJobbId(svar.jobbId ?? undefined);
          setVantande([]);
        },
      },
    );
  }

  /* ═══ BARA DENNA YTAS EGET JOBB, ALDRIG DET SENASTE I APPEN ═══
   *
   * MÄTT I ACCEPTANSVANDRINGEN 2026-08-31, inte befarat: personkortet visade
   * "3 kvitton skickade" innan Lotta rört någonting. Skälet är subtilt och
   * värt att skriva ut, eftersom nästa yta som monterar denna komponent
   * annars går i samma fälla:
   *
   *   `useJobbstatus(jobbId, jobbId !== undefined)` gör inget NÄTVERKSANROP
   *   när `jobbId` är `undefined` (`enabled: false`) - men React Query
   *   returnerar ändå den CACHADE datan för nyckeln, och nyckeln är då
   *   `jobbstatus(null)`, alltså DET SENASTE JOBBET. `JobbLyssnare` håller
   *   precis den nyckeln färsk för hela appen (det är dess uppgift), så
   *   `jobb.data` är fylld från första renderingen.
   *
   * `enabled: false` stänger av HÄMTNINGEN, aldrig LÄSNINGEN. Villkoret
   * nedan är därför på `jobbId`, inte på `jobb.data`: utfallet visas bara när
   * DENNA yta faktiskt köade ett jobb i denna session.
   *
   * Samma felklass som `BetalningsInkorg.tsx` § "ETT FÄRDIGT JOBB FRÅN EN
   * TIDIGARE SESSION ÄR INTE DAGENS NYHET" redan bokför för sin egen
   * banderoll - här återupptäckt på en annan yta. */
  const utfall = jobbId !== undefined ? jobbDelutfall(jobb.data) : null;

  return (
    <div className="flex flex-col gap-2">
      {!oppen && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            ref={triggerRef}
            intent="primary"
            emphasis="outline"
            size="sm"
            onPress={() => setOppen(true)}
          >
            {etikett}
          </Button>
          {vantande.length > 0 && (
            <Button intent="success" size="sm" onPress={skickaKvitton} isLoading={koa.isPending}>
              {`Skicka ${vantande.length} ${vantande.length === 1 ? 'kvitto' : 'kvitton'}`}
            </Button>
          )}
        </div>
      )}

      {kvittens && (
        <p role="status" className="text-small text-text-muted">
          {kvittens}
          {vantande.length > 0
            ? ` Kvittot på ${visaKronor(vantande[vantande.length - 1].belopp)} kr väntar på att skickas.`
            : ''}
        </p>
      )}

      {koa.isError && (
        <p role="alert" className="text-(color:--mm-input-error-text) text-small">
          {koa.error.message}
        </p>
      )}

      {/* JOBBETS UTFALL. Ett fel får en MessageBox - det kräver en handling.
          Ett lyckat eller pågående jobb får en lugn statusrad: fyra ytor som
          alla reste en ruta vid varje kvitto hade blivit brus. Noll skickade
          är ALDRIG grönt (`jobbDelutfall` § DEN LÅSTA REGELN). */}
      {utfall &&
        (utfall.intent === 'warning' ? (
          <MessageBox intent="warning" title={utfall.rubrik}>
            {(jobb.data?.rader ?? [])
              .filter((jobbrad) => jobbrad.status === 'fel')
              .map((jobbrad) => jobbrad.skal ?? 'okänt skäl')
              .join('. ') || 'Raderna nedan visar utfallet per kvitto.'}
          </MessageBox>
        ) : (
          <p role="status" className="text-small text-text-muted">
            {utfall.rubrik}
          </p>
        ))}

      {oppen && (
        <RegistreraForm
          rad={rad}
          idag={idag}
          betalsatt={betalsatt}
          onBetalsatt={setBetalsatt}
          onAvbryt={avbryt}
          onKlar={vidKlar}
        />
      )}
    </div>
  );
}
