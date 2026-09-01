import { Check } from 'lucide-react';
import { type FormEvent, type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { Checkbox } from 'react-aria-components';
import { Button, Input, Select, SelectItem } from '@/components/primitives';
import { useRegistreraInbetalning } from '@/data/mutations/inbetalningar';
import { VALBARA_BETALSATT } from '@/domain/schemas';
import { beloppsFel, normaliseraBeloppKlient, visaKronor } from './belopp-inmatning';
import type { Betalsatt } from './betalsatt-minne';
import {
  type Beloppsutfall,
  beloppsutfall,
  harledBeloppsknappar,
  type InkorgsRad,
} from './inkorg-harledningar';

/**
 * [TASK-346.14, designfynd 5] Status-radens visuella vikt — utfallets EGNA
 * `ton` (redan härlett i `beloppsutfall`, se dess docblock) styr nu FÄRG/VIKT
 * i stället för att varje utfall (täcker hela priset, för mycket, för lite,
 * okänt pris) rendera identiskt dämpat. `tacker`/`over` väger tyngst — de är
 * de två lägen Lotta faktiskt behöver reagera på (spara som är, eller ändra
 * beloppet); `delvis`/`okant` förblir informativa utan att skrika. Inga NYA
 * ord eller meningar — bara vikten på den TEXT `beloppsutfall` redan skriver.
 * `Record` (inte `switch`) så TypeScript fäller om `Beloppsutfall['ton']`
 * någonsin får ett femte läge — en glömd branch här ska vara ett byggfel.
 */
const BELOPPSUTFALL_KLASS: Record<Beloppsutfall['ton'], string> = {
  tacker: 'font-medium text-success',
  over: 'font-medium text-warning',
  delvis: 'text-text-secondary',
  okant: 'text-text-muted',
};

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
 * TRE HANDLINGAR, INTE SEX
 * ═══════════════════════════════════════════════════════════════════════════
 * PRD berättelse 6, ordagrant: "Som Lotta vill jag att betalsättet är förvalt
 * till det jag använde senast och datumet till i dag, så att en registrering
 * är tre handlingar." De tre är: öppna raden, tryck på ett belopp, tryck
 * Enter. Allt annat i formuläret är redan ifyllt.
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
  const [belopp, setBelopp] = useState('');
  const [datum, setDatum] = useState(idag);
  const [medKvitto, setMedKvitto] = useState(true);
  const [rort, setRort] = useState(false);
  const beloppRef = useRef<HTMLInputElement>(null);
  const forstaKnappRef = useRef<HTMLButtonElement>(null);
  const felId = useId();

  const registrera = useRegistreraInbetalning();
  const knappar = harledBeloppsknappar(rad);

  /* ═══════════════════════════════════════════════════════════════════════
   * FOKUS IN VID ÖPPNING - FÖRSTA BELOPPS-KNAPPEN, ANNARS FÄLTET
   * ═══════════════════════════════════════════════════════════════════════
   * Granskningsfynd runda 1: formuläret ersätter trigger-knappen i DOM:en, så
   * utan detta faller fokus till `document.body` när raden öppnas.
   *
   * VALET, OCH VARFÖR (granskningen bad om att det bokförs): fokus går till
   * FÖRSTA BELOPPS-KNAPPEN när det finns någon, annars till beloppsfältet.
   *
   *   - Knappen är PRD:ns primära handling: "tryck på det belopp banken visar
   *     (1 000, 2 500 eller annat) i stället för att skriva det" (berättelse
   *     3). De tre handlingarna i berättelse 6 är öppna raden, tryck på ett
   *     belopp, tryck Enter - och den andra av dem är just denna knapp.
   *   - TAB-ORDNINGEN AVGÖR RESTEN. Knapparna står FÖRE fältet i DOM, så ett
   *     fokus i fältet hade lagt dem BAKOM användaren: en tangentbords-Lotta
   *     som tabbar framåt hade aldrig mött dem, bara Shift+Tab hade nått dem.
   *     Fokus på första knappen gör hela formuläret nåbart framåt.
   *   - Fältet är fallbacken därför att det är den enda kontroll som finns i
   *     VARJE läge: är priset okänt härleds noll knappar, och då hade en
   *     regel som bara pekade på knappen lämnat fokus i tomma intet.
   *
   * Effekten körs EN gång, vid montering: formuläret monteras när raden
   * öppnas och avmonteras när den stängs, så "vid montering" och "vid
   * öppning" är samma ögonblick. `knappar.length` läses inne i effekten och
   * inte som beroende - antalet kan ändras när Lotta registrerar, och en
   * omfokusering då hade ryckt markören ur fältet hon skriver i.
   */
  useEffect(() => {
    if (forstaKnappRef.current) forstaKnappRef.current.focus();
    else beloppRef.current?.focus();
  }, []);
  const talet = normaliseraBeloppKlient(belopp);
  const fel = rort ? beloppsFel(belopp) : null;
  const utfall = talet !== null && talet !== 0 ? beloppsutfall(rad, talet) : null;
  const kanSpara = talet !== null && talet !== 0 && !registrera.isPending;

  function valjBelopp(varde: number) {
    setBelopp(visaKronor(varde));
    setRort(true);
    beloppRef.current?.focus();
  }

  function annatBelopp() {
    setBelopp('');
    setRort(false);
    beloppRef.current?.focus();
  }

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
      {knappar.length > 0 && (
        /* BELOPPSVALEN ÄR SYSKON I SAMMA VIKT (Marcus dom 2026-09-01).
           "annat ..." var `intent="ghost"` — naken text bredvid två
           outlined-knappar, alltså ett tredje val som såg ut som en
           bortglömd länk. Alla tre är nu samma `secondary`/`outline`-chip.
           Etiketten är dessutom en riktig etikett: "Annat belopp", versal
           och utan hängande punkter. */
        <div className="flex flex-wrap gap-2">
          {knappar.map((knapp, index) => (
            <Button
              key={knapp.nyckel}
              // Fokus-in-målet vid öppning — se docblocket vid `useEffect`.
              ref={index === 0 ? forstaKnappRef : undefined}
              intent="secondary"
              emphasis="outline"
              size="sm"
              onPress={() => valjBelopp(knapp.belopp)}
            >
              {visaKronor(knapp.belopp)} · {knapp.etikett}
            </Button>
          ))}
          <Button intent="secondary" emphasis="outline" size="sm" onPress={annatBelopp}>
            Annat belopp
          </Button>
        </div>
      )}

      {/* BELOPPSFÄLTET OCH DESS UTFALLSRAD ÄR ETT BLOCK — och det är fixen
          för det tomma hålet (Marcus dom 2026-09-01).

          ROTORSAK, mätt i koden: utfallsraden är ALLTID monterad (a11y-krav,
          se nedan) och bar `min-h-5`. Tom blev den alltså ett 20 px högt
          osynligt block som dessutom låg som EGET flex-syskon i formulärets
          `gap-3` — 12 px före + 20 px block + 12 px efter = 44 px död yta
          mellan beloppsfältet och Betalsätt-raden, i det vanligaste läget
          av alla (innan Lotta valt ett belopp).

          Fältet och raden bor nu i ett eget `gap-1`-block, och `min-h-5` är
          borta: tom kollapsar raden till noll och kostar 4 px i stället för
          44. Att texten sedan skjuter Betalsätt-raden 20 px nedåt när den
          dyker upp är ett medvetet byte — det sker EN gång, vid det första
          beloppsvalet, alltså innan Lotta tittar på Betalsätt. */}
      <div className="flex flex-col gap-1">
        <Input
          ref={beloppRef}
          label="Belopp i kronor"
          value={belopp}
          onChange={(v) => {
            setBelopp(v);
            setRort(true);
          }}
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

        {/* Vad beloppet täcker (AC #5). `role="status"` och inte `alert`: det är
            en upplysning som uppdateras medan Lotta skriver, inte ett fel.
            Regionen är ALLTID monterad så att skärmläsaren har något att
            annonsera IN i - en region som monteras samtidigt som sin text
            annonseras inte (Roselli-anatomin, se primitives/FilterRad.tsx).
            Den MONTERINGEN är oförändrad; bara den reserverade höjden är
            borta. */}
        <p
          id={felId}
          role="status"
          aria-live="polite"
          className={`text-small ${utfall ? BELOPPSUTFALL_KLASS[utfall.ton] : 'text-text-muted'}`}
        >
          {utfall?.text ?? ''}
        </p>
      </div>

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
