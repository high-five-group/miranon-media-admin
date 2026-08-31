import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button as AriaButton,
  Input as AriaInput,
  Disclosure,
  DisclosurePanel,
  Heading,
  SearchField,
} from 'react-aria-components';
import {
  Button,
  MessageBox,
  SidRam,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
} from '@/components/primitives';
import { StatusBadge } from '@/components/registrations/StatusBadge';
import { useOppnaBetalningar } from '@/data/betalningar/useBetalningar';
import { useJobbstatus, useRealtidsfel } from '@/data/betalningar/useJobbstatus';
import { useKoaKvitton } from '@/data/mutations/inbetalningar';
import { useDataSource } from '@/data/useDataSource';
import { filtreraPersonregister, personVisningsnamn } from '@/lib/person-sok';
import { queryKeys } from '@/queries/keys';
import { visaKronor } from './belopp-inmatning';
import { type Betalsatt, lasSenasteBetalsatt, sparaBetalsatt } from './betalsatt-minne';
import { idagIso } from './idag';
import {
  type EventGrupp,
  grupperaPerEvent,
  harledRad,
  type Inkorgsfilter,
  type InkorgsRad,
  jobbDelutfall,
  rankaTraffar,
  sammanfattaBetalningar,
} from './inkorg-harledningar';
import { RegistreraForm, type RegistreringsUtfall } from './RegistreraForm';
import { SwishImport } from './SwishImport';

/**
 * [TASK-346.6, PRD TASK-346 § Inkorgen och formuläret] Sidan Betalningar
 * under Mer - Lottas lördagsmorgon på ETT ställe.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VAD YTAN ERSÄTTER
 * ═══════════════════════════════════════════════════════════════════════════
 * PRD:ns problemformulering, mätt: sex klick till kvittoknappen, sju klick
 * plus ett handskrivet belopp per kvitto, cirka 143 klick och tjugo
 * handskrivna belopp för en hel kurs - därför att avprickningen börjar i
 * EVENTET (event → åtgärder → panel → person). Här är BETALNINGEN
 * arbetsenheten: alla öppna betalningar över alla event, sökbara på det Lotta
 * faktiskt ser i banken.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SÖKFÄLTET FÅR FOKUS, INTE RUBRIKEN — ETT MEDVETET AVSTEG
 * ═══════════════════════════════════════════════════════════════════════════
 * Husets vyer (Waitlist, MailLog) flyttar fokus till `<h1>` när data landat.
 * Denna vy flyttar det till SÖKFÄLTET, därför att AC #2 kräver det och PRD:n
 * motiverar det: Lotta kommer hit med ett namn eller ett belopp i huvudet och
 * ska kunna skriva det direkt. `PersonsList.tsx` avstår medvetet från
 * autofokus med motiveringen "sidladdnings-autofokus är a11y-golv, inte stil"
 * - och den bedömningen står, för en LISTA man bläddrar i. Den här ytan är en
 * inkorg man SKRIVER i.
 *
 * Rubriken förlorar därför inte sin annonsering: `document.title` sätts, och
 * en `role="status"`-region säger hur många betalningar som laddats.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * "SKICKA N KVITTON" RÄKNAR SESSIONENS EGNA REGISTRERINGAR
 * ═══════════════════════════════════════════════════════════════════════════
 * PRD berättelse 7 + 8: registrera alla åtta först, granska, tryck EN gång.
 * Listan över väntande kvitton byggs därför av de registreringar som gjorts I
 * DENNA SESSION med kryssrutan i, och nollställs när jobbet köats.
 *
 * DEN KÄNDA GRÄNSEN, öppet bokförd: stängs fliken innan Lotta tryckt på
 * knappen är listan borta, och inbetalningarna står kvar utan kvitto. Ett
 * durabelt svar kräver ett fält på `OppenBetalning` som säger "denna anmälan
 * har inbetalningar utan kvitto" - och den ytan ägs av TASK-346.4:s Edge
 * Functions, inte av denna skiva. `kvittonAttSkicka` som EF:en redan skickar
 * räknar något ANNAT: rader som redan ligger i kön (`vantar`/`pagar`), alltså
 * kvitton Lotta redan tryckt på. Det talet visas separat i sammanfattningen.
 */

/* BETALSÄTTS-MINNET OCH `idagIso` FLYTTADE UT (TASK-346.7).
 *
 * Båda låg privat i denna fil så länge inkorgen var den enda ytan med
 * formuläret. TASK-346.7 ger samma formulär fyra ingångar till, och PRD
 * berättelse 6 lovar "det jag använde senast" - inte "senast på den här
 * sidan". De bor därför i `betalsatt-minne.ts` respektive `idag.ts`, som
 * båda bär motiveringen i sina egna docblock. Beteendet här är oförändrat:
 * samma localStorage-nyckel, samma standardvärde, samma lokala datum. */

type VantandeKvitto = { inbetalningId: string; namn: string; belopp: number };

export function BetalningsInkorg() {
  const dataSource = useDataSource();
  const [sokterm, setSokterm] = useState('');
  const [filter, setFilter] = useState<Inkorgsfilter>('kommande');
  const [oppenRad, setOppenRad] = useState<string | null>(null);
  const [kvittenser, setKvittenser] = useState<Record<string, string>>({});
  const [vantande, setVantande] = useState<VantandeKvitto[]>([]);
  const [jobbId, setJobbId] = useState<string | undefined>(undefined);
  const [betalsatt, setBetalsatt] = useState<Betalsatt>(lasSenasteBetalsatt);
  // [TASK-346.10] Importytan bor HÄR, inte på en egen route - kortets egen
  // rubrik säger "samma inkorg, ingen ny yta". Två följder: miljöflaggan
  // gäller utan ny kod (routens `beforeLoad` bär `betalningarPa()`), och
  // "Skicka N kvitton" nedan är samma knapp för importerade och handskrivna
  // registreringar. Se `SwishImport.tsx` § INGEN NY YTA.
  const [visaImport, setVisaImport] = useState(false);
  const sokRef = useRef<HTMLInputElement>(null);
  const importKnappRef = useRef<HTMLButtonElement>(null);
  const annonseratRef = useRef(false);
  const idag = useMemo(idagIso, []);

  // [TASK-346.7] Läsningen bor nu i `useOppnaBetalningar`, delad med Hem,
  // Åtgärds-panelen, anmälans detaljvy och personkortet. Hooken bär
  // `refetchOnMount: 'always'` och HELA motiveringen för den (den mätta
  // eftersläpningen i acceptansvandringen 2026-08-31) i sitt eget docblock.
  // Beteendet här är oförändrat: samma cache-nyckel, samma färskhetsregel.
  const { data: oppna, isPending, isError, error } = useOppnaBetalningar();

  // Personregistret är redan förladdat av startvärmningen (ADR-123) och har
  // 5 min staleTime - att läsa det här kostar därför normalt noll anrop. Det
  // bär "personer utan öppen betalning" i sökläget (AC #2).
  const { data: register } = useQuery({
    queryKey: queryKeys.persons.register,
    queryFn: () => dataSource.fetchPersonsRegister(),
  });

  const jobb = useJobbstatus(jobbId, jobbId !== undefined);
  const realtidsfel = useRealtidsfel();
  const koa = useKoaKvitton();

  const rader = useMemo(
    () => (oppna?.betalningar ?? []).map((b) => harledRad(b, idag)),
    [oppna, idag],
  );
  const vy = useMemo(() => grupperaPerEvent(rader, idag), [rader, idag]);
  const soker = sokterm.trim() !== '';
  const traffar = useMemo(
    () => (soker ? rankaTraffar(rader, sokterm, idag) : []),
    [soker, rader, sokterm, idag],
  );

  // Personer UTAN öppen betalning, sist i sökläget med "registrera ändå"
  // (AC #2). Matchningen mot de träffade raderna sker på NAMN, eftersom
  // `OppenBetalning` inte bär något person-ID (`Betalningar.schema.ts`) - en
  // känd grovhet som gör att en namne kan filtreras bort. Alternativet, att
  // visa personen två gånger, är sämre.
  const ovrigaPersoner = useMemo(() => {
    if (!soker || !register) return [];
    const traffadeNamn = new Set(traffar.map((r) => r.namn.toLocaleLowerCase('sv')));
    return filtreraPersonregister(register, sokterm)
      .filter((p) => !traffadeNamn.has(personVisningsnamn(p).toLocaleLowerCase('sv')))
      .slice(0, 10);
  }, [soker, register, sokterm, traffar]);

  // [TASK-346.7 AC #1] De tre talen härleds nu av `sammanfattaBetalningar`,
  // som Hem-kortet läser med. Uttrycken var tidigare inline här; två
  // oberoende uttryck för samma mening kan glida isär utan att någon
  // mekanism märker det, och AC #6 kräver att ytorna säger samma sak.
  // Räkningen är oförändrad - se funktionens docblock för de två talens
  // exakta innebörd.
  const sammanfattning = useMemo(() => sammanfattaBetalningar(rader), [rader]);

  // ═══ ETT FÄRDIGT JOBB FRÅN EN TIDIGARE SESSION ÄR INTE DAGENS NYHET ═══
  //
  // Mätt i vandringen mot staging 2026-08-31: inkorgen visade "1 kvitto
  // skickade" INNAN Lotta gjort något, därför att `JobbLyssnare` håller
  // `jobbstatus(null)` (det SENASTE jobbet) färsk för hela appen och denna vy
  // läser samma cache-nyckel. Kvittot i fråga hade skickats av TASK-346.4:s
  // egen provkörning dagen innan.
  //
  // Banderollen visas därför i EXAKT två lägen: (a) jobbet är MITT jobb -
  // denna session tryckte på knappen - eller (b) det senaste jobbet arbetar
  // fortfarande, vilket är något Lotta behöver se oavsett vem som startade
  // det (PRD berättelse 31: appen kan stängas mitt i ett kvittojobb). Ett
  // AVSLUTAT jobb från i går är varken, och tystas.
  const senasteUtfall = jobbDelutfall(jobb.data);
  const utfall =
    senasteUtfall && (jobbId !== undefined || senasteUtfall.kvar > 0) ? senasteUtfall : null;

  useEffect(() => {
    if (oppna && !annonseratRef.current) {
      annonseratRef.current = true;
      document.title = 'Betalningar';
      sokRef.current?.focus();
    }
  }, [oppna]);

  function vidRegistrerad(rad: InkorgsRad, resultat: RegistreringsUtfall) {
    setKvittenser((tidigare) => ({ ...tidigare, [rad.nyckel]: resultat.kvittens }));
    setOppenRad(null);
    sparaBetalsatt(betalsatt);

    if (resultat.medKvitto && resultat.skickaNu) {
      koa.mutate(
        { inbetalningIds: [resultat.inbetalningId] },
        { onSuccess: (svar) => setJobbId(svar.jobbId ?? undefined) },
      );
    } else if (resultat.medKvitto) {
      setVantande((tidigare) => [
        ...tidigare,
        {
          inbetalningId: resultat.inbetalningId,
          namn: resultat.namn,
          belopp: resultat.belopp,
        },
      ]);
    }

    // AC #3: "fokus åter i tomt sökfält". Tömningen är lika viktig som
    // fokuset - nästa betalning är en annan person, och ett kvarstående
    // filter hade dolt henne.
    setSokterm('');
    sokRef.current?.focus();
  }

  /**
   * [TASK-346.10 AC #4] Importens registrerade rader lyfts in i SAMMA
   * väntande-lista som formulärets, så att "Skicka N kvitton" nedan blir en
   * enda knapp för hela lördagen - oavsett om raden kom ur banken eller ur
   * Lottas huvud. Fokus går till importknappen när ytan stängs; den nod
   * fokus stod på rivs annars ur DOM och fokus faller till `document.body`
   * (samma felklass som radens `skaAterfaFokus` bär).
   */
  function vidImporterade(kvitton: VantandeKvitto[]) {
    setVantande((tidigare) => [...tidigare, ...kvitton]);
  }

  function stangImport() {
    setVisaImport(false);
    importKnappRef.current?.focus();
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

  const sidRam = <SidRam to="/mer" tillbakaEtikett="Tillbaka till Mer" />;

  if (isPending) {
    return (
      <section className="flex flex-col gap-4">
        {sidRam}
        <header className="px-4">
          <h1 className="font-semibold text-3xl">Betalningar</h1>
        </header>
        <div aria-busy="true" role="status" className="flex flex-col gap-3 px-4">
          <span className="sr-only">Laddar betalningar ...</span>
          <Skeleton variant="text" aria-hidden />
          <Skeleton variant="listRow" aria-hidden />
          <Skeleton variant="listRow" aria-hidden />
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex flex-col gap-4">
        {sidRam}
        <header className="px-4">
          <h1 className="font-semibold text-3xl">Betalningar</h1>
        </header>
        <MessageBox intent="error" title="Betalningarna kunde inte hämtas">
          {error instanceof Error ? error.message : 'Okänt fel.'}
        </MessageBox>
      </section>
    );
  }

  const grupper: EventGrupp[] = filter === 'kommande' ? vy.kommande : vy.tidigare;

  return (
    <section className="flex flex-col gap-4">
      {sidRam}
      <p className="sr-only" role="status" aria-live="polite">
        {`${rader.length} öppna betalningar laddade.`}
      </p>

      <header className="flex flex-col gap-1 px-4">
        <h1 className="font-semibold text-3xl">Betalningar</h1>
        <p className="text-small text-text-muted">
          {`${sammanfattning.oppna} öppna · ${sammanfattning.forfallna} förfallna · ${sammanfattning.kvittonAttSkicka} kvitton i kö`}
        </p>
      </header>

      {/* Realtidsfelet (TASK-346.4:s namngivna TODO, betald här). Byggd på
          nedstängningsvaktens PREDIKAT, aldrig på råa status-värden - annars
          hade rutan blinkat vid varje navigering. */}
      {realtidsfel !== null && (
        <MessageBox intent="warning" title="Realtidsuppdateringen är nere">
          Kvittonas status uppdateras inte av sig själv just nu. Läget läses om varje gång du öppnar
          sidan, så inget går förlorat.
        </MessageBox>
      )}

      <div className="flex flex-col gap-3 px-4">
        <SearchField
          aria-label="Sök på namn, telefon eller belopp"
          value={sokterm}
          onChange={setSokterm}
          className="group flex flex-col"
        >
          <div className="relative">
            <AriaInput
              ref={sokRef}
              placeholder="Sök på namn, telefon eller belopp"
              className="mm-fokusring-vid-fokus text-(color:--mm-input-text) placeholder:text-(color:--mm-input-text-placeholder) min-h-10 w-full rounded border border-(--mm-input-border) bg-(--mm-input-bg) px-3 pr-10 text-body [&::-webkit-search-cancel-button]:[-webkit-appearance:none]"
            />
            <AriaButton
              aria-label="Rensa sökningen"
              className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-text-muted hover:text-text group-data-[empty]:hidden"
            >
              <X aria-hidden="true" size={16} className="shrink-0" />
            </AriaButton>
          </div>
        </SearchField>

        {!soker && (
          <ToggleButtonGroup
            label="Visa betalningar för"
            selectedKey={filter}
            onSelectionChange={(nyckel) => setFilter(nyckel as Inkorgsfilter)}
          >
            <ToggleButton id="kommande" size="sm">
              Kommande event
            </ToggleButton>
            <ToggleButton id="tidigare" size="sm">
              Tidigare event
            </ToggleButton>
          </ToggleButtonGroup>
        )}
      </div>

      {/* [TASK-346.10] Importen ligger FÖRE "Skicka N kvitton", i den ordning
          Lottas lördag faktiskt går: läs banken, bekräfta raderna, skicka
          kvittona. Knappen göms medan ytan är öppen - den skulle inte göra
          något nytt, och en knapp som inte gör något är brus. */}
      {!visaImport && (
        <div className="px-4">
          <Button
            ref={importKnappRef}
            intent="secondary"
            emphasis="outline"
            size="sm"
            onPress={() => setVisaImport(true)}
          >
            Importera bankrapport
          </Button>
        </div>
      )}

      {visaImport && (
        <SwishImport
          oppna={rader}
          idag={idag}
          betalsatt={betalsatt}
          onRegistrerade={vidImporterade}
          onStang={stangImport}
        />
      )}

      {vantande.length > 0 && (
        <div className="px-4">
          <Button intent="success" onPress={skickaKvitton} isLoading={koa.isPending}>
            {`Skicka ${vantande.length} ${vantande.length === 1 ? 'kvitto' : 'kvitton'}`}
          </Button>
        </div>
      )}

      {utfall && (
        <div className="flex flex-col gap-2">
          <MessageBox intent={utfall.intent} title={utfall.rubrik}>
            {utfall.klass === 'allt-skickat'
              ? 'Alla kvitton gick fram.'
              : 'Raderna nedan visar utfallet per kvitto.'}
          </MessageBox>
          <ul className="flex flex-col gap-1 px-4">
            {(jobb.data?.rader ?? []).map((jobbrad) => (
              <li
                key={jobbrad.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded bg-bg-muted px-3 py-2 text-small"
              >
                <span>{jobbrad.kvittonummer ?? 'Kvitto utan nummer än'}</span>
                <span className="flex flex-wrap items-center gap-2 text-text-muted">
                  {jobbrad.status === 'skickat'
                    ? 'Skickat'
                    : jobbrad.status === 'fel'
                      ? `Misslyckades: ${jobbrad.skal ?? 'okänt skäl'}`
                      : jobbrad.status === 'pagar'
                        ? 'Skickas ...'
                        : 'Väntar'}
                  {/* SKICKA IGEN, bara på en FALLERAD rad (AC #4).
                      `koaKvitton` och inte `skickaKvittoIgen`: den senare
                      skickar om ett kvitto som REDAN gått i väg (samma PDF,
                      samma nummer). En fallerad rad har per definition inget
                      utskickat kvitto - den ska köas på nytt, och servern
                      avgör om raden är köbar. Idempotensen bärs av den unika
                      nyckeln per inbetalning (ADR-128), så ett dubbeltryck kan
                      inte ge två kvitton. */}
                  {jobbrad.status === 'fel' && (
                    <Button
                      intent="secondary"
                      emphasis="outline"
                      size="sm"
                      isDisabled={koa.isPending}
                      onPress={() =>
                        koa.mutate(
                          { inbetalningIds: [jobbrad.objektId] },
                          { onSuccess: (svar) => setJobbId(svar.jobbId ?? jobbId) },
                        )
                      }
                    >
                      Skicka igen
                    </Button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {soker ? (
        <div className="flex flex-col gap-4 px-4">
          <h2 className="font-semibold text-lg">{`Träffar (${traffar.length})`}</h2>
          {traffar.length === 0 && (
            <p className="text-small text-text-muted">Ingen öppen betalning matchar sökningen.</p>
          )}
          <ul className="flex flex-col gap-2">
            {traffar.map((rad) => (
              <BetalningsradKort
                key={rad.nyckel}
                rad={rad}
                idag={idag}
                visaEvent
                oppen={oppenRad === rad.nyckel}
                kvittens={kvittenser[rad.nyckel]}
                betalsatt={betalsatt}
                onBetalsatt={setBetalsatt}
                onOppna={() => setOppenRad(rad.nyckel)}
                onAvbryt={() => setOppenRad(null)}
                onKlar={(resultat) => vidRegistrerad(rad, resultat)}
              />
            ))}
          </ul>

          {ovrigaPersoner.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="font-semibold text-lg">Utan öppen betalning</h2>
              <ul className="flex flex-col gap-2">
                {ovrigaPersoner.map((person) => (
                  <li
                    key={person.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded bg-bg-muted px-3 py-2"
                  >
                    <span>{personVisningsnamn(person)}</span>
                    <Link
                      to="/personer/$personId"
                      params={{ personId: person.id }}
                      className="text-small underline"
                    >
                      registrera ändå
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6 px-4">
          {grupper.length === 0 && (
            <p className="text-small text-text-muted">
              {filter === 'kommande'
                ? 'Inga öppna betalningar på kommande event.'
                : 'Inga öppna betalningar på tidigare event.'}
            </p>
          )}
          {grupper.map((grupp) => (
            <div key={grupp.nyckel} className="flex flex-col gap-2">
              <h2 className="font-semibold text-lg">
                {grupp.eventNamn}
                {grupp.eventStartdatum && (
                  // Avdelaren är en riktig TEXTNOD, inte bara en marginal:
                  // rubrikens tillgängliga namn är sammanslagen text, och utan
                  // den läste skärmläsaren "ZZ-GRANSKNING-S1132026-09-07" i ett
                  // svep (mätt i vandringen 2026-08-31).
                  <span className="ml-2 font-normal text-small text-text-muted">
                    {' · '}
                    {grupp.eventStartdatum}
                  </span>
                )}
              </h2>
              <ul className="flex flex-col gap-2">
                {grupp.oppna.map((rad) => (
                  <BetalningsradKort
                    key={rad.nyckel}
                    rad={rad}
                    idag={idag}
                    oppen={oppenRad === rad.nyckel}
                    kvittens={kvittenser[rad.nyckel]}
                    betalsatt={betalsatt}
                    onBetalsatt={setBetalsatt}
                    onOppna={() => setOppenRad(rad.nyckel)}
                    onAvbryt={() => setOppenRad(null)}
                    onKlar={(resultat) => vidRegistrerad(rad, resultat)}
                  />
                ))}
              </ul>

              {grupp.klara.length > 0 && (
                // KLARA HOPFÄLLDA (PRD § Inkorgen). Raderna finns kvar i
                // EF-svaret därför att basens `Saknas (kr)` läser SPEGELN och
                // spegeln kan släpa; Postgres säger att de är betalda. Att
                // dölja dem helt hade gjort eftersläpningen osynlig, att visa
                // dem öppna hade begravt lördagen.
                <Disclosure className="rounded border border-border">
                  <Heading>
                    <Button slot="trigger" intent="ghost" size="sm">
                      {`Klara (${grupp.klara.length})`}
                    </Button>
                  </Heading>
                  <DisclosurePanel>
                    <ul className="flex flex-col gap-2 px-3 pb-3">
                      {grupp.klara.map((rad) => (
                        <li
                          key={rad.nyckel}
                          className="flex flex-wrap items-center justify-between gap-2 text-small"
                        >
                          <span>{rad.namn}</span>
                          <span className="text-text-muted">
                            {`${visaKronor(rad.betalning.summaInbetalt)} kr betalt`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </DisclosurePanel>
                </Disclosure>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

type KortProps = {
  rad: InkorgsRad;
  idag: string;
  visaEvent?: boolean;
  oppen: boolean;
  kvittens: string | undefined;
  betalsatt: Betalsatt;
  onBetalsatt: (b: Betalsatt) => void;
  onOppna: () => void;
  onAvbryt: () => void;
  onKlar: (resultat: RegistreringsUtfall) => void;
};

/**
 * EN rad i inkorgen. Radhöjden hålls generös med avsikt: PRD berättelse 29
 * ("jobba på iPad ... med stora rader, så att lördagen går lika bra i
 * soffan"). `py-3` plus knappens egen `min-h` ger ett träffområde över
 * WCAG 2.2 § 2.5.8:s 24 px-golv med marginal.
 */
function BetalningsradKort({
  rad,
  idag,
  visaEvent,
  oppen,
  kvittens,
  betalsatt,
  onBetalsatt,
  onOppna,
  onAvbryt,
  onKlar,
}: KortProps) {
  const saknas = rad.kvar ?? rad.betalning.saknas;

  /* ═══════════════════════════════════════════════════════════════════════
   * FOKUS-RETUR: ALLA VÄGAR UT UTOM DEN SOM MEDVETET GÅR ÅT ANNAT HÅLL
   * ═══════════════════════════════════════════════════════════════════════
   * Granskningsfynd runda 1. Formuläret ERSÄTTER trigger-knappen i DOM:en,
   * så när raden öppnas rivs den nod fokus stod på och fokus faller till
   * `document.body`. Samma felklass som `Deltagare.tsx` § "alla vägar ut"
   * beskriver för batch-baren: "Lotta börjar om från sidans topp, och en
   * skärmläsaranvändare tappar sin plats mitt i arbetet."
   *
   * Mönstret är husets: en `buttonRef` som fokus-retur-mål
   * (`DetaljGrupp.tsx` § `AndraRad`, "tangentbordskontinuitet") plus en
   * effekt som körs EFTER commit, när knappen åter finns i DOM.
   *
   * VARFÖR EN FLAGGA OCH INTE RETUR VID VARJE STÄNGNING: registreringens väg
   * ut flyttar fokus till SÖKFÄLTET med avsikt (AC #3: "efter Enter kvitterar
   * raden, listan uppdateras, fokus åter i tomt sökfält"). En ovillkorlig
   * retur hade konkurrerat med den och gett en kapplöpning mellan två
   * fokus-anrop i samma commit. Flaggan sätts därför bara av Avbryt och Esc.
   */
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
    onAvbryt();
  }

  return (
    <li className="overflow-hidden rounded border border-border bg-bg-muted">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-medium">{rad.namn}</span>
          <span className="text-caption text-text-muted">
            {visaEvent && rad.betalning.eventNamn ? `${rad.betalning.eventNamn} · ` : ''}
            {saknas === null ? 'Pris saknas i basen' : `Saknas ${visaKronor(saknas)} kr`}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {rad.forfallen && (
              <span className="inline-flex items-center gap-1 rounded border border-transparent bg-bg px-2 py-0.5 text-caption">
                <Clock aria-hidden size={13} />
                Förfallen
              </span>
            )}
            {rad.obekraftad && (
              <StatusBadge ton="warning" storlek="sm">
                Obekräftad
              </StatusBadge>
            )}
            {rad.spegelSlapar && (
              <span
                className="inline-flex items-center gap-1 rounded border border-transparent bg-bg px-2 py-0.5 text-caption text-text-muted"
                title="Basen har inte hunnit uppdateras än"
              >
                <AlertTriangle aria-hidden size={13} />
                Basen släpar
              </span>
            )}
          </div>
        </div>
        {!oppen && (
          <Button ref={triggerRef} intent="primary" emphasis="outline" size="sm" onPress={onOppna}>
            Registrera betalning
          </Button>
        )}
      </div>

      {kvittens && (
        <p role="status" className="px-3 pb-3 text-small text-text-muted">
          {kvittens}
        </p>
      )}

      {oppen && (
        <RegistreraForm
          rad={rad}
          idag={idag}
          betalsatt={betalsatt}
          onBetalsatt={onBetalsatt}
          onAvbryt={avbryt}
          onKlar={onKlar}
        />
      )}
    </li>
  );
}
