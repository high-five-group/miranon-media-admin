import type { LucideIcon } from 'lucide-react';
import { Check, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { type FormEvent, type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { Checkbox } from 'react-aria-components';
import { Button, Input, MessageBox, Select, SelectItem } from '@/components/primitives';
import { useRegistreraInbetalning } from '@/data/mutations/inbetalningar';
import { VALBARA_BETALSATT } from '@/domain/schemas';
import { beloppsFel, normaliseraBeloppKlient, visaKronor } from './belopp-inmatning';
import type { Betalsatt } from './betalsatt-minne';
import { type Beloppsutfall, beloppsutfall, type InkorgsRad } from './inkorg-harledningar';

/**
 * UTFALLET ÄR EN BOX, INTE EN VIKTVÄXLANDE TEXTRAD (Marcus dom 2026-09-01):
 * *"typsnittet behöver ju inte växla i vikt, endast färg … boxa in texten och
 * så är det själva boxen som blir grön, gul eller röd, med ikon framför,
 * bock, info, och varning"*.
 *
 * Utfallets EGNA `ton` (härledd i `beloppsutfall`, se dess docblock) mappas
 * därför till husets `MessageBox`-intent i stället för till en font-vikt.
 * `tacker` → grön bock, `over` → gul varning, `delvis`/`okant` → info.
 * TEXTEN ÄR OFÖRÄNDRAD — bara bäraren är ny, och vikten är nu konstant över
 * alla fyra lägen.
 *
 * IKONEN LIGGER I `children`, INTE I PRIMITIVEN. Mätt 2026-09-01:
 * `MessageBox` bär INGEN ikon (den bär `border-l-4` i intent-färg plus tonad
 * bakgrund, S109-facit varv 4). Formen är LÅST av ADR-103 B2 steg 1, så
 * ikonen får inte adderas till primitiven i ett iterationspass — den bor i
 * konsumentens innehåll, där den inte kan läcka in i de andra ~30
 * konsumenterna.
 *
 * `Record` (inte `switch`) så TypeScript fäller om `Beloppsutfall['ton']`
 * någonsin får ett femte läge — en glömd branch här ska vara ett byggfel.
 */
const UTFALL_FORM: Record<
  Beloppsutfall['ton'],
  { intent: 'success' | 'warning' | 'info'; Ikon: LucideIcon }
> = {
  tacker: { intent: 'success', Ikon: CircleCheck },
  over: { intent: 'warning', Ikon: TriangleAlert },
  delvis: { intent: 'info', Ikon: Info },
  okant: { intent: 'info', Ikon: Info },
};

/**
 * Fördröjningen innan utfallet byts (Marcus: *"kanske 1 sekunds fördröjning"*).
 *
 * VARFÖR DEN INTE BARA ÄR KOSMETIK: utfallsregionen är en `aria-live`-yta.
 * Utan fördröjning annonserades den vid VARJE tangenttryck — "2 kr
 * registreras", "25 kr registreras", "250 kr registreras" — vilket är precis
 * den skräpannonsering WAI-ARIA APG varnar för i sitt live-region-avsnitt.
 * Fördröjningen gör alltså två saker med en ratt: boxen slutar blinka, och
 * skärmläsaren får ETT besked per belopp i stället för ett per siffra.
 */
const UTFALL_FORDROJNING_MS = 1000;

export type RegistreringsUtfall = {
  inbetalningId: string;
  namn: string;
  belopp: number;
  /** Lottas kryss: ska ett kvitto gå för den här inbetalningen? */
  medKvitto: boolean;
  /** True när ⌘/Ctrl+Enter eller "Registrera och skicka" användes. */
  skickaNu: boolean;
  /** Kvitteringstexten raden ska visa. */
  kvittens: string;
};

type Props = {
  rad: InkorgsRad;
  idag: string;
  betalsatt: Betalsatt;
  onBetalsatt: (b: Betalsatt) => void;
  onAvbryt: () => void;
  onKlar: (utfall: RegistreringsUtfall) => void;
};

/**
 * [TASK-346.6 AC #3, PRD § Inkorgen och formuläret] Registreringsformuläret,
 * PÅ PLATS I RADEN.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TVÅ HANDLINGAR, INTE SEX
 * ═══════════════════════════════════════════════════════════════════════════
 * PRD berättelse 6, ordagrant: "Som Lotta vill jag att betalsättet är förvalt
 * till det jag använde senast och datumet till i dag, så att en registrering
 * är tre handlingar." De tre VAR: öppna raden, tryck på ett belopp, tryck
 * Enter. Sedan Marcus rev beloppschipsen (2026-09-01, se `forifyllt` nedan)
 * är de TVÅ: öppna raden, tryck Enter — beloppsfältet bär redan resten-talet
 * som chipset tryckte in. PRD:ns löfte är alltså inte sänkt utan överträffat;
 * raden står här i sin ursprungliga ordalydelse för att skillnaden ska synas.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * BELOPPET SKICKAS SOM RÅ STRÄNG
 * ═══════════════════════════════════════════════════════════════════════════
 * `RegistreraInbetalningInput.belopp` är en STRÄNG med avsikt: normaliseringen
 * sker server-side, där den kan bevisas hermetiskt (se schemats docblock).
 * Klientens `normaliseraBeloppKlient` används ENBART för att visa vad beloppet
 * kommer att täcka och för att ge ett felmeddelande vid fältet. Fältets råtext
 * är det som skickas, alltid.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * NOTERINGSFÄLTET SAKNAS — MEDVETET, OCH BOKFÖRT
 * ═══════════════════════════════════════════════════════════════════════════
 * AC #3 räknar upp "notering" bland fälten. `RegistreraInbetalningInput`
 * (TASK-346.4, `Betalningar.schema.ts`) bär INGET sådant fält, och
 * `registrera-inbetalning` skriver ingen noteringskolumn. Ett fält som inte
 * kan nå servern hade varit en låtsas-kontroll: Lotta skriver, trycker Enter,
 * och texten försvinner utan ett ord. Fältet utelämnas därför, och gapet är
 * rapporterat i stället för tyst lappat — EF-ytan ägs av TASK-346.4, och en
 * ändring där ligger utanför denna skivas mandat.
 *
 * AVGJORT: fältet byggs med `avtalat_pris`-kolumnen i en uppföljningsmigration
 * på Marcus GO (S113 natt, orkestrerar-beslut). Gapet är ett SAMSYNS-gap i
 * 346.4:s schema — PRD § Inkorgen listar notering, schemat bär det inte — och
 * inte denna skivas fel. Det byggs inte i natt därför att en ny kolumn plus en
 * EF-ändring bryter B5-disciplinen (seriell staging-applicering, en olandad
 * schemaversion i taget), exakt samma klass som `avtalat_pris`. De två buntas
 * därför till samma migration.
 */
export function RegistreraForm({ rad, idag, betalsatt, onBetalsatt, onAvbryt, onKlar }: Props) {
  /* ═══════════════════════════════════════════════════════════════════════
   * INGA SNABBVAL — FÄLTET ÄR FÖRIFYLLT MED RESTEN (Marcus dom 2026-09-01)
   * ═══════════════════════════════════════════════════════════════════════
   * Ordagrant: *"Vi behöver inte ha några 'snabb-val' som '1500 - resten'
   * eller 'annat…'"*. Beloppschipsen (`harledBeloppsknappar`) är därför rivna
   * ur formuläret.
   *
   * DE TRE HANDLINGARNA BLIR TVÅ. PRD berättelse 6 räknade "öppna raden,
   * tryck på ett belopp, tryck Enter". Chipset var handling nummer två — och
   * i det vanligaste fallet av alla tryckte det in exakt det tal fältet nu
   * redan bär. Kvar är: öppna raden, tryck Enter.
   *
   * FÖRIFYLLNADEN ÄR RESTEN, aldrig avgiften: `rad.kvar` är vad som återstår
   * av HELA priset enligt Postgres (`harledRad`), alltså det chipset kallade
   * "allt"/"resten". Avgifts-chipset hade ingen motsvarighet här — delbetalar
   * Lotta skriver hon talet, precis som hon skrev det i "annat belopp".
   *
   * TOMT FÄLT NÄR PRISET ÄR OKÄNT (`rad.kvar === null`) eller redan täckt
   * (`<= 0`). Att förifylla ett belopp ur ett okänt pris vore att hitta på ett
   * tal — samma regel `harledBeloppsknappar` bar när den härledde noll chips.
   *
   * FÖRSLAGET ÄR ORKESTRERARENS, inte Marcus egna ord — han bad om att chipsen
   * skulle bort, inte uttryckligen om en förifyllnad. Bokfört som eget
   * designval så att det kan rivas utan att chipsen behöver tillbaka.
   */
  const forifyllt = rad.kvar !== null && rad.kvar > 0 ? visaKronor(rad.kvar) : '';
  const [belopp, setBelopp] = useState(forifyllt);
  /** Beloppet UTFALLSBOXEN visar — `belopp` fördröjt, se `UTFALL_FORDROJNING_MS`. */
  const [visatBelopp, setVisatBelopp] = useState(forifyllt);
  const [datum, setDatum] = useState(idag);
  const [medKvitto, setMedKvitto] = useState(true);
  const [rort, setRort] = useState(false);
  const beloppRef = useRef<HTMLInputElement>(null);
  const felId = useId();

  const registrera = useRegistreraInbetalning();

  /* ═══════════════════════════════════════════════════════════════════════
   * FOKUS IN VID ÖPPNING — BELOPPSFÄLTET, MED TEXTEN MARKERAD
   * ═══════════════════════════════════════════════════════════════════════
   * Granskningsfynd runda 1: formuläret ersätter trigger-knappen i DOM:en, så
   * utan detta faller fokus till `document.body` när raden öppnas.
   *
   * MÅLET ÄR NU ALLTID FÄLTET. Tidigare gick fokus till första belopps-chipet
   * med motiveringen att chipsen stod FÖRE fältet i DOM och annars hade legat
   * bakom användaren i tab-ordningen. Chipsen finns inte längre, så det skälet
   * är borta med dem — och fältet var redan den fallback som fanns i varje
   * läge.
   *
   * `select()` GÖR ÖVERSKRIVNINGEN TILL EN HANDLING: förifyllnaden är ett
   * FÖRSLAG, inte ett facit. Med texten markerad ersätter första siffran hela
   * talet — Lotta behöver aldrig radera först. Är förslaget rätt trycker hon
   * bara Enter.
   *
   * Effekten körs EN gång, vid montering: formuläret monteras när raden öppnas
   * och avmonteras när den stängs, så "vid montering" och "vid öppning" är
   * samma ögonblick.
   */
  useEffect(() => {
    const falt = beloppRef.current;
    if (!falt) return;
    falt.focus();
    falt.select();
  }, []);

  /* FÖRDRÖJNINGEN, ETT `setTimeout` PER TANGENTTRYCK — och det är avsikten:
     effekten städar sitt eget timeout i cleanup, så en ny tangenttryckning
     nollställer klockan i stället för att köa ännu ett byte. Utfallet byts
     alltså EN sekund efter att Lotta slutat skriva, inte en sekund efter att
     hon börjat. Vaktsatsen (`belopp === visatBelopp`) gör att monteringen med
     förifyllt värde inte kostar ett timeout alls — boxen står rätt direkt. */
  useEffect(() => {
    if (belopp === visatBelopp) return;
    const id = window.setTimeout(() => setVisatBelopp(belopp), UTFALL_FORDROJNING_MS);
    return () => window.clearTimeout(id);
  }, [belopp, visatBelopp]);

  /** Hoppar över fördröjningen. Marcus: *"vid Enter/blur visas utfallet direkt"*. */
  function visaUtfallNu() {
    setVisatBelopp(belopp);
  }

  const talet = normaliseraBeloppKlient(belopp);
  // FELET ÄR LIVE, UTFALLET ÄR FÖRDRÖJT — två olika frågor, två olika takter.
  // "abc" ska säga ifrån vid fältet medan hon skriver (felvägen är oförändrad);
  // "vad täcker beloppet" är ett besked som bara är intressant när talet är
  // färdigskrivet.
  const fel = rort ? beloppsFel(belopp) : null;
  const visatTalet = normaliseraBeloppKlient(visatBelopp);
  const utfall = visatTalet !== null && visatTalet !== 0 ? beloppsutfall(rad, visatTalet) : null;
  const kanSpara = talet !== null && talet !== 0 && !registrera.isPending;

  async function spara(skickaNu: boolean) {
    if (!kanSpara || talet === null) return;
    const resultat = await registrera.mutateAsync({
      anmalanRecordId: rad.betalning.anmalanRecordId,
      belopp,
      betalsatt,
      betalningsdatum: datum,
    });

    // KVITTENSEN LÄSER SERVERNS SVAR, ALDRIG FÄLTET. Servern normaliserar
    // beloppet och räknar om härledningen; att kvittera med det Lotta skrev
    // hade kunnat säga en annan sak än det som faktiskt sparades.
    const sparat = resultat.inbetalning.belopp;
    const saknasEfter = resultat.harledning.saknas;
    const kvittens =
      saknasEfter === null
        ? `${visaKronor(sparat)} kr registrerat.`
        : saknasEfter > 0
          ? // Löpande text ⇒ beloppet först (Marcus 2026-09-01, delad
            // domänterm "kvar att betala" över alla betalningsytor).
            `${visaKronor(sparat)} kr registrerat. ${visaKronor(saknasEfter)} kr kvar att betala.`
          : `${visaKronor(sparat)} kr registrerat. Allt betalt.`;

    onKlar({
      inbetalningId: resultat.inbetalning.id,
      namn: rad.namn,
      belopp: sparat,
      medKvitto,
      skickaNu,
      kvittens: resultat.spegel.skrivet
        ? kvittens
        : `${kvittens} Basen har inte hunnit uppdateras än.`,
    });
  }

  function vidSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    visaUtfallNu();
    void spara(false);
  }

  // ⌘/Ctrl+Enter = registrera OCH skicka (AC #3, PRD berättelse 9). Fångas på
  // formuläret och inte per fält: genvägen ska fungera var markören än står.
  //
  // ESC = AVBRYT, samma väg ut som knappen (granskningsfynd runda 1). Ett
  // formulär som öppnas på plats och tar fokus MÅSTE gå att lämna med
  // tangentbordet utan att leta upp en knapp - `Deltagare.tsx` § "alla vägar
  // ut" räknar upp Esc vid sidan av Avbryt av precis det skälet. Fokus-returen
  // till trigger-knappen sköts av `BetalningsradKort`, som äger knappen.
  //
  // `stopPropagation` därför att Esc är en delad genväg: utan den hade
  // tangenttryckningen fortsatt uppåt och kunnat stänga en omgivande yta
  // samtidigt som formuläret stängs.
  function vidTangent(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      visaUtfallNu();
      void spara(true);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onAvbryt();
    }
  }

  return (
    <form
      onSubmit={vidSubmit}
      onKeyDown={vidTangent}
      aria-label={`Registrera betalning för ${rad.namn}`}
      /* ETT RUTNÄT, INTE TRE VÄNSTERKANTER (Marcus dom 2026-09-01).
         Formuläret bar `px-3` OCH `bg-surface`, alltså en vit panel vars
         innehåll började 12 px in i raden — medan radens avatar började på
         0 och namn/metadata på 48 px (avatarens `size-9` + `gap-3`). Tre
         linjer i samma kort. Den horisontella paddingen och den vita
         panelen är därför borta: formuläret delar nu radens EGEN
         vänsterkant, och `border-t` ensam bär avgränsningen mot raden
         ovanför. Fälten är fortfarande vita (`--mm-input-bg` =
         `--mm-surface`), så kontrasten mot den tonade botten är oförändrad.

         GÄLLER BÅDA KONSUMENTERNA: formuläret monteras både av inkorgens
         `BetalningsradKort` och av `RegistreraYta` (Åtgärds-panelen,
         anmälans detaljvy, personkortet). Utan horisontell padding ärver
         det förälderns kant i båda fallen — vilket är precis vad "ett
         rutnät" betyder. */
      className="flex flex-col gap-3 border-border border-t py-3"
    >
      <Input
        ref={beloppRef}
        label="Belopp i kronor"
        value={belopp}
        onChange={(v) => {
          setBelopp(v);
          setRort(true);
        }}
        // Lämnar hon fältet är talet färdigskrivet — då ska beskedet stå där,
        // inte komma en sekund senare när blicken redan flyttat.
        onBlur={visaUtfallNu}
        // `decimal` och inte `numeric`: iPad ska ge decimaltecken, eftersom
        // banken visar "2 500,00" och det är precis den formen Lotta klistrar
        // in (PRD berättelse 4, AC #6 iPad-kravet).
        inputMode="decimal"
        autoComplete="off"
        placeholder="2 500,00"
        isInvalid={fel !== null}
        errorMessage={fel ?? undefined}
        aria-describedby={utfall ? felId : undefined}
      />

      {/* ═══ UTFALLET: EN ALLTID-MONTERAD LIVE-REGION + EN SYNLIG BOX ═══
          Vad beloppet täcker (AC #5), i två separata bärare — och separationen
          är hela poängen.

          LIVE-REGIONEN (`sr-only`) är ALLTID monterad, med `role="status"` som
          ALDRIG byter värde. Roselli-anatomin (se `primitives/FilterRad.tsx`)
          kräver att regionen finns i DOM innan texten stoppas in — en region
          som monteras samtidigt som sin text annonseras inte. Boxen nedan är
          däremot VILLKORAD (den ska inte stå tom och grön innan Lotta skrivit
          något), och `MessageBox` byter dessutom `role` mellan `status` och
          `alert` med sin intent. Båda egenskaperna är oförenliga med en
          tillförlitlig live-region, så annonseringen görs inte av boxen.

          BOXEN ÄR DÄRFÖR `aria-hidden` — texten är ordagrant densamma i
          regionen ovan, så ingenting går förlorat; utan den hade samma besked
          annonserats två gånger. `sr-only` är `position: absolute` och alltså
          inget flex-item, så den alltid-monterade regionen kostar noll höjd i
          formulärets rytm (den tomma-hålet-fällan från pass 6 kan inte
          återuppstå).

          ANNONSERINGEN SKER EFTER FÖRDRÖJNINGEN, aldrig per tangenttryck: båda
          bärarna läser `utfall`, som är härlett ur det FÖRDRÖJDA `visatBelopp`.

          LUFTEN kommer ur formulärets egen `gap-3` — boxen är ett eget
          flex-syskon (inte inklämd i ett `gap-1`-block med fältet), plus
          `MessageBox` egen `px-4 py-3`. */}
      <p id={felId} role="status" aria-live="polite" className="sr-only">
        {utfall?.text ?? ''}
      </p>
      {utfall &&
        (() => {
          const { intent, Ikon } = UTFALL_FORM[utfall.ton];
          return (
            <div aria-hidden="true">
              <MessageBox intent={intent}>
                <span className="flex items-start gap-2">
                  <Ikon aria-hidden="true" size={18} className="mt-0.5 shrink-0" />
                  <span>{utfall.text}</span>
                </span>
              </MessageBox>
            </div>
          );
        })()}

      <div className="flex flex-wrap gap-3">
        <Select
          label="Betalsätt"
          selectedKey={betalsatt}
          onSelectionChange={(nyckel) => onBetalsatt(nyckel as Betalsatt)}
          className="min-w-40 flex-1"
        >
          {VALBARA_BETALSATT.map((satt) => (
            <SelectItem key={satt} id={satt}>
              {satt}
            </SelectItem>
          ))}
        </Select>
        <Input
          label="Betalningsdatum"
          type="date"
          value={datum}
          onChange={setDatum}
          className="min-w-40 flex-1"
        />
      </div>

      {/* Rå RAC-Checkbox: huset har ingen Checkbox-primitiv, och det är en
          etablerad precedent (BorOverRad, task-18.8). Formen är kopierad ur
          `events/detail/Betalningar.tsx` § BetalKryss så att kryssen ser
          likadana ut i hela betalningsdomänen. */}
      <Checkbox
        isSelected={medKvitto}
        onChange={setMedKvitto}
        className="group flex cursor-pointer items-center gap-2 text-small"
      >
        <span className="flex size-5 shrink-0 items-center justify-center rounded border border-(--mm-input-border) bg-(--mm-input-bg) group-data-[selected]:border-text group-data-[selected]:bg-text">
          <Check
            aria-hidden="true"
            size={14}
            className="text-text-inverse opacity-0 group-data-[selected]:opacity-100"
          />
        </span>
        <span>Skicka kvitto</span>
      </Checkbox>

      {registrera.isError && (
        <p role="alert" className="text-(color:--mm-input-error-text) text-small">
          {registrera.error.message}
        </p>
      )}

      {/* EN PRIMÄR, INTE TVÅ (Marcus dom 2026-09-01). "Registrera" (submit)
          och "Registrera och skicka" bar tidigare primär- respektive
          `success`-vikt — två mättade, konkurrerande knappar sida vid sida,
          och ögat kunde inte avgöra vilken som var vägen framåt. Submit
          behåller primärvikten; syskonet går ner till samma
          `secondary`/`outline` som beloppschipsen; "Avbryt" är kvar `ghost`.

          FUNKTION, ORDNING OCH KORTKOMMANDON ÄR ORÖRDA: samma `spara(true)`,
          samma plats i raden, samma ⌘/Ctrl+Enter-genväg (den lever på
          formulärets `onKeyDown`, inte på knappen), samma `isDisabled={!kanSpara}`.
          Husets `Button` bär sitt eget disabled-uttryck via `data-[disabled]`
          — ingen egen nedtoning här.

          `pt-2` GER KRYSSRUTAN ANDRUM (Marcus punkt 6): "Skicka kvitto" hör
          ihop med fälten ovanför, inte med knapparna. Utan den låg den lika
          nära knappraden som fälten låg varandra, och lästes som en del av
          handlingszonen. */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" isDisabled={!kanSpara} isLoading={registrera.isPending}>
          Registrera
        </Button>
        <Button
          intent="secondary"
          emphasis="outline"
          isDisabled={!kanSpara}
          onPress={() => void spara(true)}
        >
          Registrera och skicka
        </Button>
        <Button intent="ghost" onPress={onAvbryt}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}
