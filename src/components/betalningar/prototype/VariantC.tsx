import { ChevronDown, TriangleAlert } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import {
  Button as AriaButton,
  Input as AriaInput,
  Checkbox,
  SearchField,
} from 'react-aria-components';
import { Button, ToggleButton, ToggleButtonGroup } from '@/components/primitives';
import { InitialAvatar } from '@/components/primitives/InitialAvatar';
import { StatusBadge } from '@/components/registrations/StatusBadge';
import {
  aktivtBeloppslage,
  antalAndradeILage,
  antalILage,
  baraOmkorning as arBaraOmkorning,
  arRegistrerbar,
  avstamning,
  type BekraftelseRad,
  type Beloppsklass,
  type Beloppslage,
  beloppForNyMarkerad,
  blockrader,
  grupperaRader,
  type ObestamdImportrad,
  radbelopp,
  saknarBelopp,
  summera,
  vantandeKvitton,
} from '../bekraftelsesteg-harledningar';
import type { BekraftelsestegModell } from '../bekraftelsesteg-modell';
import { visaKronor } from '../belopp-inmatning';
import type { InkorgsRad } from '../inkorg-harledningar';
import { RegistreraForm } from '../RegistreraForm';
import { RegistreratNuBlock } from '../RegistreratNuBlock';

/**
 * BEKRÄFTELSESTEGETS FORM — variant C, "Avvikelse-först" (S121, Marcus val
 * 2026-09-05: *"Jag vill gå vidare med C"*), FACIT-LÅST efter nitton
 * konvergensvarv (*"Lås som facit."*) och PROMOVERAD i `TASK-402.3`.
 *
 * Sidan ÄR inkorgens lista med raderna markerade, plus en avstämning och två
 * knappar. Efter registreringen ÄR sidan inkorgens "Registrerat nu"-block.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PROMOVERINGEN (TASK-402.3): FORMEN ÄR ORÖRD, VÄGARNA ÄR SKARPA
 * ═══════════════════════════════════════════════════════════════════════════
 * `ADR-103` B2 steg 1: "prototypens form promoveras — villkoret flippas så
 * variant-formen blir den ovillkorliga; skarpas DATAVÄGAR behålls". Tre
 * konkreta byten gjordes här, alla i den riktningen:
 *
 *   1. EFTERLÄGET är nu det DELADE `RegistreratNuBlock` (`TASK-402.2`) i
 *      stället för en kopia i denna fil. Formen är densamma — 402.2 skrev om
 *      prod-inkorgens block TILL facit-formen, det var hela dess uppdrag —
 *      men knapparna leder någonstans: "Förhandsgranska" öppnar en riktig
 *      PDF, "Skicka igen" köar om, Ångra raderar. Prototypens
 *      `InertForhandsgranska` (med sitt "Inte byggt i prototypen"-tooltip)
 *      och dess `sr-only`-hjälpvärde är därmed borta. Det är den enda
 *      skillnaden promoverings-grinden mäter i efterläget, och den är
 *      bokförd som amendering i facit-katalogen.
 *   2. RADFORMULÄRET är nu det DELADE `RegistreraForm` i `redigera`-läget
 *      (`TASK-402.2` AC #3) i stället för en kopia. Samma fält i samma
 *      ordning, samma utfallsruta, samma fördröjning och autofokus — en
 *      komponent, två konsumenter (PRD berättelse 31).
 *   3. HÄRLEDNINGARNA läses ur `../bekraftelsesteg-harledningar.ts`, som
 *      överlever rivningen av simuleringslagret.
 *
 * Filen ligger kvar under `prototype/` till `TASK-402.6` — namnet flyttar
 * med rivningen, inte med promoveringen (uppdragets claim-gräns: ingen rename
 * nu).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARV 15 — REGISTRERINGEN ÄR ETT STEG, INTE TIO (Marcus efter varv 13:
 * *"fullständigt kaos på sidan"*, och *"kör på förslaget, alla tre
 * punkterna"*)
 * ═══════════════════════════════════════════════════════════════════════════
 * Varv 13 lät varje registrerad rad vandra från listan till blocket medan
 * körningen pågick: sidan växte, grupper försvann, knapparna räknade ner —
 * tio omritningar på 3,5 sekunder, och i skicka-flödet en andra våg för
 * kvittona. Inkorgens block är byggt för EN rad i taget; bulken behöver ett
 * eget förlopp. Tre punkter:
 *   1. Under körningen står listan STILLA (ögonblicksbild från knapptrycket,
 *      dimmad, `aria-busy`); knappen bär spinnern och tipsraden räkningen
 *      "3 av 10 registrerade …" (NN/g: beskrivande text med räkning). Inget
 *      på sidan byter plats förrän allt är klart.
 *   2. Resultatet ritas EN gång: blocket "Registrerat nu" på listans plats,
 *      statusraden i huvudet säger utfallet ("9 inbetalningar registrerade,
 *      1 kunde inte registreras"), och raden som fallerade står kvar under
 *      med felet; knappen heter då "Försök igen".
 *   3. Makuleringstexten per rad är borta i bulkläget — kvittoläget är en
 *      kort rad per person, jobbets framsteg står i blockets statusrad
 *      (inkorgens `jobbDelutfall`), och raderna håller samma höjd genom
 *      hela utskicket så inget hoppar.
 *
 * VARV 12: bulkvalen rivna. VARV 5–11: kortet är kryssrutan (grönt = valt),
 * inkorgens kort och formulär i kortet, beloppet platt med chevron.
 * VARV 2–4: förslaget per rad (`forslagsbelopp`), avstämningen i Lottas
 * klumpar, listan klass för klass ur `BetalningsInkorg`.
 */

const KLASS_ORD: Record<Beloppsklass, { ett: string; flera: string }> = {
  avgift: { ett: 'anmälningsavgift', flera: 'anmälningsavgifter' },
  resten: { ett: 'slutbetalning', flera: 'slutbetalningar' },
  allt: { ett: 'hela beloppet', flera: 'hela beloppet' },
  annat: { ett: 'eget belopp', flera: 'egna belopp' },
  saknas: { ett: 'rad utan belopp', flera: 'rader utan belopp' },
};

/**
 * [TASK-402.8 varv 5] KAPSELNS TRE LÄGEN — ord, besked och utseende.
 *
 * ORDEN BÄR INGA TAL, med avsikt. "1 000 kr" och "2 500 kr" hade varit en
 * LÖGN på den här sidan: priset är per event OCH per person, så en rad vars
 * deltagare redan betalat 2 000 av 2 500 får 500 av samma tryck som ger en
 * annan rad 2 500. Segmentet namnger VAD beloppet är, aldrig hur mycket —
 * talet står kvar per rad, där det är sant.
 *
 * `Förslag` FÖRST OCH FÖRVALT (varv 5): det är appens eget förval per rad och
 * därmed både utgångsläget och vägen tillbaka. Varv 3:s separata
 * "Återställ förslagen"-knapp är riven — ett läge som alltid är valbart gör
 * en egen ångra-knapp överflödig, och kapseln slipper det tomma tillstånd
 * Marcus såg ("bara en textsträng på grå bakgrund").
 */
const LAGEN: { lage: Beloppslage; etikett: string; besked: string }[] = [
  { lage: 'forslag', etikett: 'Förslag', besked: 'förslaget' },
  { lage: 'avgift', etikett: 'Anmälningsavgift', besked: 'anmälningsavgiften' },
  { lage: 'allt', etikett: 'Hela beloppet', besked: 'hela beloppet' },
];

/* ═══ SEGMENTENS UTSEENDE — HUSETS SEKUNDÄRA KNAPP, INTE KAPSELNS PILL ══════
   Marcus: *"Men samtidigt ska det liksom se ut som 'sekundär' knappar ju.
   Måste liksom matcha och passa in i Sätt alla belopp-rutan."*

   VÄGEN ÄR `className`, INTE EN NY VARIANT I PRIMITIVEN. Prövat först, och
   det räckte: `ToggleButtonGroup`/`ToggleButton` slår ihop sina cva-klasser
   med konsumentens via `cn` (tailwind-merge), så varje utility jag skriver
   här vinner över primitivens i samma grupp — inklusive `data-[selected]:`-
   och `not-data-[selected]:data-[hovered]:`-varianterna, så länge samma
   modifierkedja används. Primitiven är därmed ORÖRD och dess fyra andra
   konsumenter kan inte påverkas (verifierat med grep).

   FÄRGERNA ÄR SEKUNDÄRKNAPPENS EGNA KOMPONENT-TOKENS, inte en avskrift av
   dess klasser: `--mm-button-secondary-*`. En avskrift hade varit en andra
   definition av samma knapp och kunnat glida isär från originalet; tokens kan
   det inte. Det är också husets regel (CLAUDE.md § Design-system: inga
   hårdkodade färger, allt via custom properties).

   DET VALDA SEGMENTETS KONTUR ÄR `--mm-text`, och steget dit tog fem varv med
   Marcus öga som instrument. Landningen är samma svärta som Registrera-
   knappen, och det är ett MEDVETET val efter att tre dämpningar prövats:
   *"om vi går tillbaka till mörkgrå då, samma som registrera knappen, de går
   färgerna ihop i alla fall."*

     varv 5–6  `--mm-text`           14,22:1 / 13,31:1  *"för mörk grå färg …
                                     nu har den ju samma färg som registrera
                                     knappen"*
     varv 7    `--mm-text-muted`      4,88:1 /  4,57:1  *"blev nog sämre än
                                     innan"*
     varv 8    guld (`--mm-primary-hover` på `--mm-primary-tint`)
                                      3,14:1 /  3,10:1  *"Blev sämre"*
     varv 9    `--mm-text-secondary`  7,25:1 /  6,78:1  *"Blev sämre"* i sak —
                                     varv 10 valde bort dämpningen helt
     varv 10   `--mm-text`           14,22:1 / 13,31:1  ← här, tillbaka till
                                     varv 6:s värde

   VARFÖR SVÄRTAN ÄR RÄTT TROTS ATT DEN DELAS MED PRIMÄRKNAPPEN: invändningen
   i varv 7 var att konturen såg ut som Registrera-knappen. Tre dämpningar
   senare är domen den motsatta — färgerna GÅR IHOP, och en kontur är inte en
   fyllning: den mörka kanten läser som "vald", inte som "primär handling",
   eftersom segmentet fortfarande är en outline-knapp med ljus fyllning.
   Guldet från varv 8 är rivet, kontur och fond.

   Golvet är oförändrat: WCAG 1.4.11 kräver 3:1 för tillståndsmarkören mot
   BÅDA angränsande färgerna (panelen och segmentets egen fyllning), och
   14,22:1 / 13,31:1 klarar det med bred marginal. Texten (`--mm-text`) mot
   fyllningen ger 13,31:1 mot 4,5-golvet.

   INGENTING I BOXMODELLEN ÄNDRAS MELLAN VALT OCH OVALT (varv 6). Marcus:
   *"när man klickar runt på knapparna så ser de ut att röra sig, eller det
   gör dem, inte okej."* Och de gjorde det: varv 5 gav det valda segmentet
   `font-semibold`, vilket är BREDARE text. Med `auto-cols-fr` + `w-fit`
   sätts kolumnbredden av det bredaste segmentets max-content — så fort
   vikten flyttade sig flyttade hela radens bredd med den, och alla tre
   segmenten bytte mått vid varje klick.

   Regeln som ersätter den: valet får ENDAST ändra färg. Samma `font-medium` i
   båda lägena, samma `border`-BREDD (bara `border-color` byter), samma
   padding. Ska kanten se tjockare ut är vägen en INSET `box-shadow` — den
   ritas innanför kanten och ingår inte i boxmodellen, till skillnad från
   `border-2`. Mätt efteråt: identiska `x/y/width/height` på alla tre
   segmenten genom alla tre valen.

   BREDDEN: `inline-grid` + `auto-cols-fr` + `w-fit` ger alla tre segmenten
   exakt det bredaste ordets bredd ("Anmälningsavgift") utan att raden sträcks
   över hela panelen. Marcus: *"anmälningsavgift och Hela beloppet knapparna
   måste vara exakt lika breda, annars blir det ingen snygg toggle."* Under
   `sm` faller raden till en kolumn — fortfarande likbreda, eftersom
   kolumnbredden är samma fit-content. */
const KAPSEL_KLASS =
  'inline-grid w-fit auto-cols-fr grid-flow-row gap-2 rounded-none bg-transparent p-0 sm:grid-flow-col';

const SEGMENT_KLASS = [
  // Ovalt: husets sekundära knapp, size sm.
  'min-h-8 rounded-lg border px-3 py-1.5 text-small',
  'border-(--mm-button-secondary-border) bg-(--mm-button-secondary-bg)',
  'text-(color:--mm-button-secondary-text)',
  'not-data-[selected]:data-[hovered]:bg-(--mm-button-secondary-bg-hover)',
  'contrast-more:border-border-strong',
  // Valt: intryckt sekundär — tonad platta, mörk kant, dubblerad via en INSET
  // ring. Ingen viktändring, ingen kantbredd-ändring, ingen padding-ändring.
  'data-[selected]:border-text data-[selected]:bg-bg-emphasized',
  'data-[selected]:font-medium data-[selected]:text-text',
  'data-[selected]:shadow-[inset_0_0_0_1px_var(--mm-text)]',
].join(' ');

function plural(antal: number, ett: string, flera: string): string {
  return `${antal} ${antal === 1 ? ett : flera}`;
}

/** Förslagsknappens ord — domänens korta former utskrivna. */
function forslagsEtikett(etikett: string): string {
  switch (etikett) {
    case 'anmälningsavgift':
      return 'Anmälningsavgift';
    case 'resten av anmälningsavgiften':
      return 'Resten av avgiften';
    case 'allt':
      return 'Allt som saknas';
    case 'resten':
      return 'Resten';
    default:
      return etikett.charAt(0).toUpperCase() + etikett.slice(1);
  }
}

/** Varför raden saknar belopp, i en mening Lotta kan handla på. */
function handSkal(rad: BekraftelseRad): string {
  const { anmalningsavgift, gallandePris, summaInbetalt } = rad.inkorg.betalning;
  if (rad.ejGenomforbar === 'avgift') {
    if (anmalningsavgift !== null && gallandePris !== null && anmalningsavgift >= gallandePris) {
      return 'Det här eventet har ett pris utan anmälningsavgift.';
    }
    if (anmalningsavgift !== null && summaInbetalt >= anmalningsavgift) {
      return 'Anmälningsavgiften är redan betald.';
    }
  }
  if (gallandePris === null) return 'Priset saknas i databasen.';
  return 'Beloppet är tomt.';
}

/** Rubrik med räknarchip — segmentvyns "Färdiga grupper 14"-form. */
function SektionsRubrik({ id, antal, children }: { id: string; antal: number; children: string }) {
  return (
    <h2 id={id} className="flex items-center gap-2 font-semibold text-lg">
      {children}
      <span className="rounded-md bg-bg-emphasized px-1.5 py-0.5 font-medium text-caption text-text-secondary tabular-nums">
        {antal}
      </span>
    </h2>
  );
}

/**
 * Eventgruppens rubrik — KLASS FÖR KLASS inkorgens (`BetalningsInkorg.tsx`
 * § grupper.map): `h2 font-semibold text-lg`, datumet som rått ISO efter
 * " · " i en `ml-2 font-normal text-small text-text-muted`-span.
 */
function GruppRubrik({ namn, datum }: { namn: string; datum: string | null }) {
  return (
    <h2 className="font-semibold text-lg">
      {namn}
      {datum && (
        <span className="ml-2 font-normal text-small text-text-muted">
          {' · '}
          {datum}
        </span>
      )}
    </h2>
  );
}

/** Inkorgens listbehållare — `-mx-4` mot sektionens `px-4`, korten kant i kant. */
const LISTA_KLASS =
  '-mx-4 flex flex-col gap-2 rounded-2xl border border-transparent bg-bg-muted p-2 contrast-more:border-border-strong';

/** Inkorgens kortyta: grönt när markerat, vitt annars. */
function kortKlass(vald: boolean): string {
  return `rounded-2xl border p-3 ${
    vald
      ? 'border-(--mm-success) bg-(--mm-success-bg) contrast-more:border-(--mm-success)'
      : 'border-transparent bg-surface contrast-more:border-border-strong'
  }`;
}

export function VariantC({ modell }: { modell: BekraftelsestegModell }) {
  return <BulkC modell={modell} />;
}

function BulkC({ modell }: { modell: BekraftelsestegModell }) {
  const handId = useId();
  const dubblettId = useId();
  /* BESKEDET EFTER ETT SÄTT-ALLA-TRYCK. Ingen synlig pixel ändras av det —
     raderna och avstämningen SÄGER redan vad som hände för den som ser dem.
     Den som inte ser dem hör i stället "6 belopp satta till
     anmälningsavgiften" ur regionen nedanför knapparna.

     EGEN REGION OCH INTE HUVUDETS STATUSRAD, öppet bokfört som avvikelse mot
     kortets AC #4-ordalydelse: huvudets rad bär räkningen "N av N
     inbetalningar markerade", som ett tryck INTE ändrar. Skrev vi beskedet
     dit hade markeringsräkningen försvunnit — och den är facit-låst form
     (facit.json § FORMEN). Två regioner annonserar var sin sak; en hade
     tystat den ena. */
  const [sattAllaBesked, setSattAllaBesked] = useState('');
  const { rader } = modell;
  const registrerar = modell.fas === 'registrerar';
  const [tryckt, setTryckt] = useState<'registrera' | 'skicka' | null>(null);
  // ÖGONBLICKSBILDEN (varv 15): raderna som de såg ut när knappen trycktes
  // bär listan genom hela körningen, så inget flyttar sig förrän resultatet
  // ritas i ett svep när `fas` blir `klart`.
  const [frusna, setFrusna] = useState<BekraftelseRad[] | null>(null);
  useEffect(() => {
    if (!registrerar) {
      setTryckt(null);
      setFrusna(null);
    }
  }, [registrerar]);
  const starta = (skickaNu: boolean) => {
    setFrusna(rader);
    setTryckt(skickaNu ? 'skicka' : 'registrera');
    modell.registrera(skickaNu);
  };
  const bas = registrerar && frusna ? frusna : rader;

  // Registrerade rader lämnar listan och bor i "Registrerat nu"; resten
  // (inklusive en rad vars registrering fallerade) står kvar i listan.
  const registrerade = bas.filter((r) => r.utfall?.klass === 'registrerad');
  const kvar = bas.filter((r) => r.utfall?.klass !== 'registrerad');
  const fallerade = kvar.filter((r) => r.utfall?.klass === 'fel');
  const markerade = kvar.filter((r) => r.markerad);
  const handhogen = markerade.filter(saknarBelopp);
  const klarhogen = kvar.filter((r) => !r.markerad || !saknarBelopp(r));

  /* ═══ KONTOUTDRAGETS RADER (TASK-402.4) ═══════════════════════════════════
     TVÅ HÖGAR, OCH DE HAR OLIKA HEMVIST I FORMEN.

     Osäkra och omatchade rader hör till "Behöver din hand" — de VÄNTAR på ett
     beslut, precis som en rad utan belopp gör, och skälet ("vilken anmälan?"
     kontra "vilket belopp?") ändrar inte att sektionen är samma. Kortets
     AC #2 säger det ordagrant: båda ligger under "Behöver din hand".

     Dubbletter hör INTE dit. De behöver ingenting — de är redan bokförda, och
     att lägga dem i hand-högen hade räknat upp ett tal som betyder "det här
     väntar på dig" med rader som inte gör det. De får en egen sektion,
     låsta.

     `?? []` OCH INTE ETT KRAV PÅ FÄLTET: modellen delas med prototypens
     simulering, som aldrig sätter det (se `bekraftelsesteg-modell.ts`). Den
     manuella mataren renderar därmed exakt samma DOM som före denna skiva. */
  const importrader = modell.importrader ?? [];
  const handImport = importrader.filter((rad) => rad.klass !== 'dubblett');
  const dubbletter = importrader.filter((rad) => rad.klass === 'dubblett');
  const handTotal = handhogen.length + handImport.length;
  const importkalla = modell.importkalla ?? null;
  const klaraGrupper = useMemo(() => grupperaRader(klarhogen), [klarhogen]);
  const registrerbara = bas.filter(arRegistrerbar);
  const kvitton = registrerbara.filter((r) => r.medKvitto).length;
  const avstamda = useMemo(() => avstamning(markerade), [markerade]);
  /* Hur många rader varje läge KAN röra. Noll ⇒ segmentet är avstängt: ett
     läge som inte gör något ska inte gå att välja. `forslag` stängs aldrig av
     — det är kapselns förval och måste alltid gå att återvända till. */
  const lagesTraffar = useMemo(
    () => new Map(LAGEN.map((v) => [v.lage, antalILage(kvar, v.lage)])),
    [kvar],
  );
  const aktivtLage = aktivtBeloppslage(modell.aktivGenvag);
  const valjLage = (lage: Beloppslage) => {
    /* BESKEDET RÄKNAR DE RADER SOM FAKTISKT ÄNDRAS, inte de läget rör.
       Väljer hon `Förslag` när varje rad redan bär sitt förslag flyttar sig
       ingenting, och "0 belopp satta" hade varit ett sämre svar än att säga
       det rakt ut. */
    const antal = antalAndradeILage(kvar, lage);
    const besked = LAGEN.find((v) => v.lage === lage)?.besked ?? '';
    modell.sattBeloppslage(lage);
    setSattAllaBesked(
      antal === 0
        ? `Alla belopp stod redan på ${besked}.`
        : `${plural(antal, 'belopp satt', 'belopp satta')} till ${besked}.`,
    );
  };
  /* EN MARKERING UNDER ETT ÖVERSKRIVANDE LÄGE ÄNDRAR ETT BELOPP, OCH DET SKA
     HÖRAS. Läget är en levande regel (varv 5): markerar Lotta en rad mitt i
     "Hela beloppet" kommer raden in med hela beloppet i stället för sitt
     förslag. Den seende ser talet byta i kortet och i avstämningen; en
     skärmläsare hörde ingenting alls — bocken annonseras som "markerad" och
     beloppsändringen var tyst. Beskedet skrivs i blockets EGNA
     `role="status"`-region (samma som sätt-alla-trycken använder), inte i
     huvudets statusrad, av samma skäl som där: huvudets rad bär den
     facit-låsta räkningen "N av N inbetalningar markerade".

     TRE VILLKOR, alla nödvändiga. Bara `avgift`/`allt` — `forslag` ÄR radens
     eget förval, så ett besked där hade beskrivit en ändring som normalt inte
     sker (orkestrerarens avgränsning; kanten där en rad avmarkerats under
     `allt` och markeras om under `forslag` annonseras därmed inte). Bara en
     MARKERING, aldrig en avmarkering, som inte rör beloppet. Och bara när
     talet FAKTISKT skiljer sig från radens nuvarande — `beloppForNyMarkerad`
     returnerar radens kandidat även när den redan står där, och "satt till
     1 000 kr" om en rad som redan visar 1 000 kr är brus, inte information. */
  const markeraRad = (rad: BekraftelseRad, markerad: boolean) => {
    const nytt = markerad && aktivtLage !== 'forslag' ? beloppForNyMarkerad(rad, aktivtLage) : null;
    if (nytt !== null && nytt !== rad.belopp) {
      const etikett = LAGEN.find((v) => v.lage === aktivtLage)?.etikett ?? '';
      setSattAllaBesked(
        `${rad.inkorg.namn} markerad, beloppet satt till ${nytt} kr enligt ${etikett}.`,
      );
    }
    modell.sattRadMarkerad(rad.nyckel, markerad);
  };
  // Summan ur ögonblicksbilden, inte ur modellens levande rader — annars
  // sjönk "10 inbetalningar 12 000 kr" rad för rad under körningen (mätt).
  const summering = useMemo(() => summera(bas), [bas]);
  // Bara omkörning kvar: allt som går att registrera har redan fallerat en gång.
  const baraOmkorning = arBaraOmkorning(bas);
  const totalt = modell.korning?.totalt ?? registrerbara.length;
  // Statusraden annonserar START och SLUT (polite) — aldrig varje rad.
  const status = registrerar
    ? `Registrerar ${plural(totalt, 'inbetalning', 'inbetalningar')} …`
    : registrerade.length > 0
      ? fallerade.length > 0
        ? `${plural(registrerade.length, 'inbetalning registrerad', 'inbetalningar registrerade')}, ${fallerade.length} kunde inte registreras`
        : kvar.length > 0
          ? plural(registrerade.length, 'inbetalning registrerad', 'inbetalningar registrerade')
          : 'Alla inbetalningar registrerade'
      : `${markerade.length} av ${kvar.length} inbetalningar markerade`;
  const dimmad = registrerar
    ? ' pointer-events-none opacity-60 motion-safe:transition-opacity'
    : '';

  /* ═══ CTRL/⌘+ENTER = "REGISTRERA OCH SKICKA" (grillningens beslut 4) ══════
     PÅ `window`, INTE PÅ ETT ELEMENT — och det är två beslut i ett.

     1. STRUKTURELLT. Prototypen hängde hanteraren på sitt yttre `<form>` med
        motiveringen att formuläret var "ett element som får ha en (a11y-lint)".
        Det yttre formuläret är rivet (se `<section>` nedan: det delade
        radformuläret ÄR ett `<form>`, och nästling är ogiltig HTML), och
        Biomes `a11y/noStaticElementInteractions` fäller — korrekt — en
        `onKeyDown` på en `<section>` utan roll. En sidgenväg hör hemma på
        sidan, inte på en godtycklig behållare.

     2. BETEENDEMÄSSIGT ÄR DET EN FÖRBÄTTRING, inte en kompromiss. Genvägen
        fungerar nu var fokus än står på sidan — vilket är vad Lotta faktiskt
        gör: hon trycker ⌘+Enter efter att ha läst avstämningen, inte med
        markören i ett fält.

     `defaultPrevented` ÄR VAKTEN mot dubbelavfyrning. Radformulärets EGEN
     ⌘+Enter (`RegistreraForm` § `vidTangent`, en synonym till "Klar" i
     `redigera`-läget) kallar `preventDefault()` på det syntetiska eventet,
     vilket sätter flaggan på det NATIVA event som därefter bubblar hit. Utan
     kontrollen hade ett ⌘+Enter i ett öppet kort registrerat HELA sidan. */
  useEffect(() => {
    function vidTangent(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return;
      if (registrerar || registrerbara.length === 0) return;
      event.preventDefault();
      starta(true);
    }
    window.addEventListener('keydown', vidTangent);
    return () => window.removeEventListener('keydown', vidTangent);
  });

  return (
    /* ═══ EN `<section>`, INTE ETT `<form>` — RÄTTAT I PROMOVERINGEN ═════════
       Prototypen bar ett `<form>` här, och dess radformulär var en `<div>`
       just för att undvika nästling ("ett nästlat `<form>` vore ogiltig
       HTML", `RadFormular`s gamla kommentar). Promoveringen byter radens
       `<div>` mot det DELADE `RegistreraForm`, som ÄR ett `<form>` — och
       därmed hade det yttre `<form>`et blivit dess förälder.

       MÄTT, INTE BEFARAT: med nästlingen på plats stängde inte "Avbryt"
       kortet (`bekraftelsesteget.staging.test.ts` § radformuläret, första
       körningen — formuläret stod kvar öppet med det ändrade beloppet).
       `<section>` bär ingen formulärsemantik alls, så det inre formuläret är
       sidans enda — och radens Enter/Escape går dit de ska.

       ARIASNAPSHOT-PARET RÖRS INTE av bytet: `toMatchAriaSnapshot` på en
       lokator beskriver nodens BARN, aldrig noden själv, och referenserna
       börjar följaktligen på `- heading "Bulkregistrering"`. Specens lokator
       byter från `main form` till `data-testid` i samma landning.

       `data-testid` OCH INTE en `aria-label`: ett tillgängligt namn hade
       gjort sektionen till en `region`-landmark, alltså en NY nod i
       tillgänglighetsträdet på en sida som redan har `main`. Testkroken ska
       inte kosta a11y-brus. */
    <section data-testid="bekraftelsesteget" className="flex flex-col gap-6">
      <header className="flex flex-col gap-1 px-4">
        <h1 className="font-semibold text-3xl">Bulkregistrering</h1>
        {/* RÄKNAREN FÖRST — Åtgärds-sidans ordval, live så skärmläsaren hör
            när ett kort avmarkeras. */}
        <p role="status" aria-live="polite" className="text-small text-text-secondary">
          {status}
        </p>
        {/* [TASK-402.4] KÄLLRADEN — bara i importläget. Inkorgens importpanel
            är stängd när Lotta står här, så utan denna rad finns ingenting på
            sidan som säger VILKEN fil raderna kom ur. Parserns två räknade
            högar (rader som inte var inbetalningar, rader som inte gick att
            läsa) följer med i samma andetag: "åtta rader i banken måste bli
            åtta rader i appen" är importens egen invariant
            (`bankimport-rader.ts` § FYRA HÖGAR), och den överlever bara om de
            bortsorterade raderna räknas där Lotta ser dem.

            AMENDERING mot facit: raden finns inte i någon låst bild, eftersom
            facit-fixturen aldrig hade en import. Bokförd i
            AMENDERING-2026-09-06-importens-radtillstand.md. */}
        {importkalla !== null && <Kallrad kalla={importkalla} />}
      </header>

      <EfterlagetsBlock modell={modell} registrerade={registrerade} />

      {/* ═══ LISTAN — inkorgens form, klass för klass (varv 4) ═══ */}
      {klarhogen.length > 0 && (
        <section
          aria-label="Markerade inbetalningar"
          aria-busy={registrerar || undefined}
          className={`flex flex-col gap-4 px-4${dimmad}`}
        >
          {klaraGrupper.map((grupp) => (
            <div key={grupp.eventId} className="flex flex-col gap-2">
              <GruppRubrik namn={grupp.eventNamn} datum={grupp.eventStartdatum} />
              <ul className={LISTA_KLASS}>
                {grupp.rader.map((rad) => (
                  <MarkerbartKort
                    key={rad.nyckel}
                    rad={rad}
                    modell={modell}
                    vidMarkering={markeraRad}
                    frusen={registrerar}
                  />
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* ═══ BEHÖVER DIN HAND — bara när något faktiskt behöver henne ═══ */}
      {handTotal > 0 && (
        <section
          aria-labelledby={handId}
          aria-busy={registrerar || undefined}
          className={`flex flex-col gap-3 px-4${dimmad}`}
        >
          <SektionsRubrik id={handId} antal={handTotal}>
            Behöver din hand
          </SektionsRubrik>
          <ul className={LISTA_KLASS}>
            {handhogen.map((rad) => (
              <HandKort key={rad.nyckel} rad={rad} modell={modell} />
            ))}
            {/* Importens rader SIST i högen, efter de belopplösa. Ordningen är
                inte estetisk: en rad utan belopp har redan sin anmälan och är
                ett tangenttryck från klar, medan en omatchad bankrad kräver en
                sökning. Det billiga först. */}
            {handImport.map((rad) => (
              <ImportHandKort key={rad.nyckel} rad={rad} modell={modell} frusen={registrerar} />
            ))}
          </ul>
        </section>
      )}

      {/* ═══ REDAN REGISTRERADE (TASK-402.4 AC #2) ═══════════════════════════
          Dubbletterna, LÅSTA UTAN KRYSS. Egen sektion och inte hand-högen: de
          väntar inte på Lotta, de är färdiga. Att dölja dem helt vore värre än
          att visa dem — importens invariant är att varje bankrad syns
          någonstans, och en rad som tyst försvann är det enda utfall Lotta inte
          kan upptäcka (`bankimport-rader.ts` § FYRA HÖGAR).

          AMENDERING mot facit: sektionen finns i ingen låst bild. */}
      {dubbletter.length > 0 && (
        <section
          aria-labelledby={dubblettId}
          aria-busy={registrerar || undefined}
          className={`flex flex-col gap-3 px-4${dimmad}`}
        >
          <SektionsRubrik id={dubblettId} antal={dubbletter.length}>
            Redan registrerade
          </SektionsRubrik>
          <ul className={LISTA_KLASS}>
            {dubbletter.map((rad) => (
              <DubblettKort key={rad.nyckel} rad={rad} />
            ))}
          </ul>
        </section>
      )}

      {/* ═══ AVSTÄMNINGEN OCH HANDLINGEN — Hem-vyns helbreddsknapp under listan ═══ */}
      {kvar.length > 0 && (
        <div className="flex flex-col gap-3">
          {/* ═══ SÄTT ALLA BELOPP — ETT BLOCK UNDER LISTAN (TASK-402.8) ═════
              PLATSEN (varv 1, Marcus 2026-09-06): *"jag vill ha dem under
              listan, inte över … Listan ska vara i fokus direkt när hon
              kommer till bulkregistreringen."* Blocket står sist av det som
              rör raderna, precis före avstämningen det påverkar.

              FORMEN (varv 2, Marcus på granskningsservern samma dag): *"Jag
              tror 'sätt alla belopp' måste få ett eget block/ruta och passa
              snyggare in i sidans design. Det ser inte snyggt ut nu."* Varv 1
              lade en naken rad — etikett plus två knappar — mellan sista
              gruppkortet och avstämningen. Den bar ingen av sidans former och
              hörde därför visuellt ingenstans.

              HUSETS PANELFORM, INTE EN NY: `rounded-2xl bg-bg-muted p-4` är
              `FilterRad`s utfällda panel (`primitives/FilterRad.tsx`, den
              enda andra panelen i appen som bär kontroller och inte
              innehåll), och `bg-bg-muted` + `rounded-2xl` +
              `contrast-more:border-border-strong` är dessutom exakt
              `LISTA_KLASS` ovan. Blocket ligger i en behållare UTAN
              horisontell padding, alltså kant i kant med gruppernas
              `-mx-4`-omslag — samma vänster- och högerkant, samma radie,
              samma botten.

              LUFTEN ÄR MÄTT, INTE ÖGONMÄTT (och prövas exakt i
              `bekraftelsesteget-formen-fore-stampeln.staging.test.ts`
              § "blocket ligger under listan …", som fäller på annat än
              `{ over: 16, under: 24 }`): 16 px OVANFÖR, alltså gruppernas
              inbördes rytm (listsektionens `gap-4`) — `-mt-2` är det som gör
              det talet, eftersom rot-sektionens `gap-6` annars ger 24 px och
              blocket ska ligga TÄTARE än så; det hör ihop med listan ovanför.
              Och 24 px NEDÅT till avstämningen (behållarens `gap-3` plus
              blockets `mb-3`), varv 3 — Marcus: *"Skapa påtagligt mer luft
              mellan sätt alla belopp-rutan och summeringsraderna nedanför."*
              Varv 2:s 12 px var avstämningens INTERNA rytm och band ihop
              blocket med summeringen; 24 px säger att de är två skilda saker.
              (Denna rad påstod fram till slutvarvet fortfarande "12 px ned"
              — varv 2:s tal, som testet ovan motbevisade i varv 3 utan att
              kommentaren följde med.)

              RUBRIKEN ÄR INGEN `<h2>`, med avsikt. Sidans h2:er är
              INNEHÅLLS-avdelningar ("Behöver din hand", eventgrupperna) i
              `text-lg font-semibold`; detta är en KONTROLL-panel, som
              `FilterRad` (som inte heller bär någon rubrik). En h2 i
              `text-body font-medium` hade dessutom sett ut som brödtext i en
              rubriknivå och gjort dokumentöversikten sämre, inte bättre — på
              en yta som är facit-låst och ligger hos Marcus för granskning. */}
          <div
            /* MÄTPUNKTEN för blockets luft och bredd. `data-testid` och inte
               ett tillgängligt namn, av samma skäl som sektionens egen krok
               ovan: ett namn hade gjort behållaren till en landmark i
               tillgänglighetsträdet. En testid kostar ingenting där. */
            data-testid="satt-alla-block"
            className="-mt-2 mb-3 flex flex-col gap-3 rounded-2xl border border-transparent bg-bg-muted p-4 contrast-more:border-border-strong"
          >
            <div className="flex flex-col gap-1">
              <p className="font-medium text-body">Sätt alla belopp</p>
              {/* HJÄLPTEXTEN SÄGER BÅDA HALVORNA av regeln — vad knappen gör
                  OCH vad den inte rör. Den andra halvan är den som annars
                  kostar: en rad i hand-högen ser markerad ut och står kvar
                  när Lotta trycker, och utan raden läses det som en bugg. */}
              <p className="text-caption text-text-muted">
                Skriver över föreslaget belopp på alla markerade rader. Rader som behöver din hand
                rörs inte.
              </p>
            </div>
            {/* `flex-wrap`: på iPad 820 ryms alla tre segmenten på en rad,
                men formen får inte bero på det. Vänsterställda i båda
                fallen. */}
            <div className="flex flex-wrap items-center gap-2">
              {/* KAPSELN (varv 4 + 5). Marcus varv 4: *"när man trycker på
                  'Anmälningsavgift' eller 'Hela beloppet' behöver vi inte
                  visa att knappen är aktiv? Hur gör vi detta i appen idag?"*
                  Husets svar är `ToggleButtonGroup` — periodtoggeln,
                  vy-växlaren i `EventsList`/`PersonsList`,
                  Förberedelseskärmen. Varv 5 lade till det tredje läget och
                  bytte kapselns UTSEENDE mot husets sekundära knapp; SEMANTIKEN
                  är primitivens (se `SEGMENT_KLASS` ovan för hela
                  resonemanget och kontrastmätningen).

                  GRUPPNAMNET ÄR "Belopp för markerade rader", inte panelens
                  synliga rubrik. Med tre poster där en heter `Förslag` hade
                  "Sätt alla belopp, Förslag" läst som en motsägelse — man
                  SÄTTER inte ett förslag, man återvänder till det. Namnet
                  beskriver i stället vad gruppen STYR, och skärmläsaren säger
                  "Belopp för markerade rader, Förslag, 1 av 3". Den synliga
                  rubriken står kvar oförändrad; den är inte gruppens
                  programmatiska etikett, så ingen namn-i-etikett-konflikt
                  uppstår (WCAG 2.5.3 gäller kontroller vars synliga text ÄR
                  deras namn). */}
              <ToggleButtonGroup<Beloppslage>
                label="Belopp för markerade rader"
                className={KAPSEL_KLASS}
                selectedKey={aktivtLage}
                onSelectionChange={valjLage}
              >
                {LAGEN.map((v) => (
                  <ToggleButton
                    key={v.lage}
                    id={v.lage}
                    size="sm"
                    className={SEGMENT_KLASS}
                    /* `forslag` stängs ALDRIG av — det är förvalet och den
                       enda vägen tillbaka. De två överskrivande lägena stängs
                       av när ingen markerad rad kan ta dem. */
                    isDisabled={
                      registrerar || (v.lage !== 'forslag' && (lagesTraffar.get(v.lage) ?? 0) === 0)
                    }
                  >
                    {v.etikett}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </div>
            {/* Regionen finns FÖRE sitt innehåll och är tom tills något trycks
                — en live-region som monteras samtidigt som texten annonseras
                inte tillförlitligt (WAI-ARIA APG § Live Regions). */}
            <p role="status" className="sr-only">
              {sattAllaBesked}
            </p>
          </div>
          <dl className="flex flex-col gap-1 px-4">
            {avstamda.map((post) => (
              <div key={post.klass} className="flex items-baseline justify-between gap-3">
                <dt className="text-body text-text-secondary">
                  {plural(post.antal, KLASS_ORD[post.klass].ett, KLASS_ORD[post.klass].flera)}
                </dt>
                <dd className="m-0 text-body text-text-secondary tabular-nums">
                  {post.klass === 'saknas' ? '' : `${visaKronor(post.summa)} kr`}
                </dd>
              </div>
            ))}
            <div className="mt-1 flex items-baseline justify-between gap-3 border-border border-t pt-2">
              <dt className="font-medium text-body">
                {plural(registrerbara.length, 'inbetalning', 'inbetalningar')}
              </dt>
              <dd className="m-0 font-semibold text-lg tabular-nums">
                {visaKronor(summering.summa)} kr
              </dd>
            </div>
          </dl>
          {registrerar && modell.korning ? (
            /* RÄKNINGEN på tipsradens plats — samma rad, samma höjd, så inget
               flyttar sig. `role="progressbar"` annonseras inte automatiskt
               (ingen live-region), skärmläsaren frågar värdet när hon vill;
               start och slut hörs via statusraden i huvudet. Samma två
               kanaler som Förberedelseskärmen (ADR-112). */
            <div
              role="progressbar"
              aria-label="Registrerar inbetalningar"
              aria-valuemin={0}
              aria-valuemax={modell.korning.totalt}
              aria-valuenow={modell.korning.klara}
              aria-valuetext={`${modell.korning.klara} av ${modell.korning.totalt} registrerade`}
              className="px-4 text-caption text-text-secondary tabular-nums"
            >
              {`${modell.korning.klara} av ${modell.korning.totalt} registrerade …`}
            </div>
          ) : (
            <p className="px-4 text-caption text-text-secondary">
              {/* TRE TEXTER, EN PLATS. Ordningen är den mest konkreta först:
                  saknat belopp är en siffra hon skriver, ett obestämt val är
                  en anmälan hon väljer, och när ingetdera väntar är raden
                  facits egen tipsrad. Ett `handTotal`-villkor med EN
                  gemensam text hade tappat VAD hon ska göra. */}
              {handhogen.length > 0
                ? `${plural(handhogen.length, 'rad saknar', 'rader saknar')} belopp och registreras inte förrän du fyllt i det.`
                : handImport.length > 0
                  ? `${plural(handImport.length, 'bankrad väntar', 'bankrader väntar')} på att du väljer anmälan.`
                  : 'Jämför med kontoutdraget innan du registrerar.'}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <Button
                isDisabled={registrerbara.length === 0 || registrerar}
                isLoading={registrerar && tryckt === 'registrera'}
                loadingText={`Registrerar ${plural(totalt, 'inbetalning', 'inbetalningar')}`}
                onPress={() => starta(false)}
              >
                {registrerbara.length === 0
                  ? 'Registrera'
                  : baraOmkorning
                    ? registrerbara.length === 1
                      ? 'Försök igen'
                      : `Försök igen med ${plural(registrerbara.length, 'inbetalning', 'inbetalningar')}`
                    : `Registrera ${plural(registrerbara.length, 'inbetalning', 'inbetalningar')}`}
              </Button>
            </div>
            <div className="flex flex-col">
              <Button
                intent="secondary"
                emphasis="outline"
                isDisabled={kvitton === 0 || registrerar}
                isLoading={registrerar && tryckt === 'skicka'}
                loadingText={`Registrerar ${plural(totalt, 'inbetalning', 'inbetalningar')} och skickar kvitton`}
                onPress={() => starta(true)}
              >
                {kvitton === 0
                  ? 'Registrera och skicka kvitton'
                  : `Registrera och skicka ${plural(kvitton, 'kvitto', 'kvitton')}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   EFTERLÄGET — INKORGENS DELADE "REGISTRERAT NU"-BLOCK (TASK-402.2/402.3)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Bron mellan stegets rader och blockets egen radmodell.
 *
 * ALLT SOM GÅR ATT HÄRLEDA HÄRLEDS (`blockrader`, `vantandeKvitton`), och
 * resten kommer ur `modell.block` — som är det ENDA stället där den skarpa
 * ytan och DEV-prototypen skiljer sig åt. Formen ser aldrig vilken värld den
 * står i.
 */
function EfterlagetsBlock({
  modell,
  registrerade,
}: {
  modell: BekraftelsestegModell;
  registrerade: BekraftelseRad[];
}) {
  const poster = useMemo(() => blockrader(registrerade), [registrerade]);
  const vantande = useMemo(() => vantandeKvitton(registrerade), [registrerade]);
  const vantandeIds = vantande.map((v) => v.inbetalningId);
  const enSamKo = vantande.length === 1;
  /* Ett-kvitto-fallets rad, slagen upp i BLOCKRADERNA och inte i kön: kön bär
     bara id/namn/belopp, medan `kanForhandsgranska` behöver `medKvitto`. Samma
     uppslag `BetalningsInkorg.tsx` gör för sin `ensamKandidat`. */
  const ensamKandidat = enSamKo
    ? (poster.find((p) => p.inbetalningId === vantande[0].inbetalningId) ?? null)
    : null;
  /* Jobbrader som blocket INTE redan visar. I steget är kvittojobbet vårt
     eget, så mängden är normalt tom — men den räknas ut i stället för att
     antas: en rad som ångrats efter att kvittot köats lämnar en jobbrad utan
     motsvarande post, och blocket har en egen, korrekt hantering för det. */
  const ovrigaJobbrader = modell.block.jobbrader.filter(
    (jobbrad) => !poster.some((post) => post.inbetalningId === jobbrad.objektId),
  );

  return (
    <RegistreratNuBlock
      {...modell.block}
      registrerade={poster}
      vantande={vantande}
      vantandeIds={vantandeIds}
      enSamKo={enSamKo}
      ensamKandidat={ensamKandidat}
      ovrigaJobbrader={ovrigaJobbrader}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   KORTEN I LISTAN — inkorgens kort, kryssrutan, formuläret
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Kortets huvud — avatar · namn, inkorgens `BetalningsradKort` med EN rad.
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * [TASK-402.8] PILLSEN ÄR BORTA (Marcus 2026-09-06: *"Pillsen bort, det blir
 * bra."*)
 * ═════════════════════════════════════════════════════════════════════════════
 * "Förfallen" och "Obekräftad" satt här via `RadMarken` (`radfalt.tsx`), i
 * både ihopfällt och öppet läge och i båda högarna. De hörde aldrig hemma på
 * DEN HÄR sidan: obekräftad registreras som vanligt och bekräftelsen sköts på
 * Åtgärds-sidan (grillningens beslut 5), och en passerad deadline ändrar
 * ingenting i handlingen "registrera det som kommit in". Signalerna bor i
 * INKORGEN, där Lotta prioriterar — dess markup är egen
 * (`BetalningsInkorg.tsx` § RadInnehall) och orörd av denna skiva.
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * [TASK-402.8] NAMNET KLIPPS — KORTET FÅR ALDRIG BYTA HÖJD
 * ═════════════════════════════════════════════════════════════════════════════
 * Marcus: *"Då måste namnet 'klippas' för INGET får hända med kortet."* Utan
 * `truncate` radbryter ett långt namn, kortet växer, och listans rytm bryts
 * mitt i en avstämning mot kontoutdraget.
 *
 * `truncate` VID ALLA BREDDER, till skillnad från inkorgens `sm:truncate`:
 * regeln "kortet byter aldrig höjd" har ingen brytpunkt. `min-w-0` på både
 * behållaren och namnet är det som gör klippet möjligt — utan den kan en
 * flex-item inte krympa under sitt innehåll.
 *
 * HELA NAMNET FINNS KVAR. Texten är oavkortad i DOM:en, så skärmläsaren läser
 * den i sin helhet (klippet är rent visuellt); `title` ger den seende samma
 * text vid hovring. `flex-wrap` är borta med märkena — det fanns bara för att
 * pillsen skulle kunna falla ned på en egen rad.
 */
function KortHuvud({ rad, vald }: { rad: BekraftelseRad; vald: boolean }) {
  return (
    <>
      <InitialAvatar namn={rad.inkorg.namn} />
      <span className="flex min-w-0 flex-1 items-center gap-x-2">
        <span className="min-w-0 truncate font-medium text-body" title={rad.inkorg.namn}>
          {rad.inkorg.namn}
        </span>
        <span className="sr-only">{vald ? 'Markerad' : 'Inte markerad'}</span>
      </span>
    </>
  );
}

/**
 * [TASK-402.3 AC #7] RADENS FORMULÄR ÄR INKORGENS `RegistreraForm` I
 * `redigera`-LÄGET — en komponent, två konsumenter (PRD berättelse 31).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * "AVBRYT ÅTERSTÄLLER RADENS VÄRDEN" ÄR NU STRUKTURELLT, INTE EN KOPIA
 * ═══════════════════════════════════════════════════════════════════════════
 * Prototypen skrev varje tangenttryckning rakt in i modellen och tog en
 * ÖGONBLICKSBILD av radens fem fält vid öppningen (`innan`), som Avbryt
 * skrev tillbaka. Det delade formuläret håller i stället sin EGEN fältstate
 * och lämnar den samlat vid "Klar" (`onRedigeringKlar`). Konsumenten monterar
 * det villkorat (`{oppen && …}`), så en stängning avmonterar all lokal state:
 * Avbryt behöver inte återställa något, eftersom ingenting skrevs. En
 * återställning som inte kan glömmas slår en som måste kodas rätt.
 *
 * BETALSÄTTET FÖLJER SAMMA REGEL. `RegistreraForm` lyfter `betalsatt` till
 * anroparen (inkorgen delar det mellan rader), men i steget är det ett
 * RADFÄLT — skrevs det direkt till modellen hade Avbryt lämnat kvar det. Det
 * bor därför i kortets egen state medan formuläret är öppet och skrivs till
 * raden först vid Klar, tillsammans med de andra fyra.
 *
 * `startvarden` bär radens NUVARANDE värden. Utan den hade formuläret
 * förifyllt `rad.kvar` (hela resten) i stället för radens förval — se propens
 * docblock i `RegistreraForm.tsx` för det mätta fallet (Erik Holm: 1 000 mot
 * 2 500).
 */
function RadFormular({
  rad,
  modell,
  onKlar,
  onAvbryt,
}: {
  rad: BekraftelseRad;
  modell: BekraftelsestegModell;
  onKlar: () => void;
  onAvbryt: () => void;
}) {
  const [betalsatt, setBetalsatt] = useState(rad.betalsatt);
  return (
    <RegistreraForm
      rad={rad.inkorg}
      idag={rad.datum}
      betalsatt={betalsatt}
      onBetalsatt={setBetalsatt}
      // Kortets gröna ram ÄR grupperingen — samma val inkorgen gör, och av
      // samma skäl (Marcus 2026-09-01: "Inga fält som ser frikopplade ut
      // under en separatorlinje").
      visaAvdelare={false}
      // [TASK-411, RUNDA 3 — BEHÅLL DENNA RAD VID MERGE FRÅN main/402.8]
      // `RadFormular` monteras ALLTID inuti ett grönt markerat kort
      // (`kortKlass(true)`, båda anropsställena ovan — `HandKort` och det
      // öppna `vald`-kortet). Utan denna prop faller `RegistreraForm` till
      // `notisBakgrund="standard"` (grön) och success-notisen blir osynlig
      // mot kortets egen `--mm-success-bg` — exakt kollisionen kedjan
      // `RegistreraForm.tsx` § `notisBakgrund` finns för att förhindra. Se
      // den propens docblock för hela resonemanget.
      notisBakgrund="vit"
      lage="redigera"
      startvarden={{
        belopp: rad.belopp,
        betalsatt: rad.betalsatt,
        datum: rad.datum,
        medKvitto: rad.medKvitto,
        notering: rad.notering,
      }}
      onRedigeringKlar={(varden) => {
        modell.sattRadVarden(rad.nyckel, varden);
        onKlar();
      }}
      onAvbryt={onAvbryt}
    />
  );
}

/**
 * Inkorgens kort, och KORTET ÄR KRYSSRUTAN (eventdetaljens `MarkerbartKort`,
 * Åtgärds-sidans `MarkerbartDeltagarKort`). Beloppet är ett SYSKON till
 * kryssrutan (en knapp i en `<label>` är ogiltig HTML). En rad vars
 * registrering fallerat visar felet under huvudet (inkorgens
 * `registrera.isError`-rad) och står kvar markerad för omkörning.
 */
function MarkerbartKort({
  rad,
  modell,
  vidMarkering,
  frusen = false,
}: {
  rad: BekraftelseRad;
  modell: BekraftelsestegModell;
  /**
   * Markeringen går via sidan, inte rakt in i modellen, så beskedet om ett
   * ändrat belopp kan skrivas i blockets `role="status"`-region — den bor i
   * sidkomponenten och kortet når den inte. Anropet till
   * `modell.sattRadMarkerad` sker fortfarande, i samma vända.
   */
  vidMarkering: (rad: BekraftelseRad, markerad: boolean) => void;
  /** Körningen pågår: kortet står stilla och tar inga tryck (varv 15). */
  frusen?: boolean;
}) {
  const [oppen, setOppen] = useState(false);
  const panelId = useId();
  const belopp = radbelopp(rad);
  const vald = rad.markerad;
  const fel = rad.utfall?.klass === 'fel' ? rad.utfall.text : null;

  return (
    <li className={kortKlass(vald)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Checkbox
          isSelected={vald}
          isDisabled={frusen}
          onChange={(v) => {
            vidMarkering(rad, v);
            // Avmarkeras ett ÖPPET kort stängs formuläret (Marcus fynd:
            // beloppet försvann annars). Ändringarna behålls.
            if (!v) setOppen(false);
          }}
          className="flex min-w-0 cursor-pointer items-center gap-3 sm:flex-1"
        >
          <KortHuvud rad={rad} vald={vald} />
        </Checkbox>
        {!oppen && (
          /* BELOPPET PLATT PÅ YTAN, chevronen med rund hover-platta i
             markeringens gröna (varv 9–10). */
          <AriaButton
            className="group inline-flex items-center gap-3 self-start data-[disabled]:cursor-not-allowed sm:self-auto"
            isDisabled={!vald || frusen}
            aria-expanded={false}
            aria-label={`Ändra belopp för ${rad.inkorg.namn}`}
            onPress={() => setOppen(true)}
          >
            <span
              className={`font-medium text-body tabular-nums ${
                vald ? 'text-text' : 'text-text-muted'
              }`}
            >
              {belopp === null ? 'Saknar belopp' : `${visaKronor(belopp)} kr`}
            </span>
            <span
              className={`mr-1 flex size-9 shrink-0 items-center justify-center rounded-full motion-safe:transition-colors ${
                vald
                  ? 'text-text-secondary group-data-[hovered]:bg-(--mm-success)/15 group-data-[hovered]:text-text'
                  : 'text-text-muted'
              }`}
            >
              <ChevronDown aria-hidden="true" size={20} />
            </span>
          </AriaButton>
        )}
      </div>
      {fel && (
        <p role="alert" className="text-(color:--mm-input-error-text) pt-2 text-small">
          {fel}
        </p>
      )}
      {oppen && vald && (
        <div id={panelId}>
          <RadFormular
            rad={rad}
            modell={modell}
            onKlar={() => setOppen(false)}
            onAvbryt={() => setOppen(false)}
          />
        </div>
      )}
    </li>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   KONTOUTDRAGETS RADER (TASK-402.4) — fyra tillstånd inom C:s form
   ═══════════════════════════════════════════════════════════════════════════

   FORMEN ÄR C:S, INTE EN NY. Tre byggstenar återanvänds rakt av: kortytan
   (`kortKlass`), hand-högens sektion och `ForslagsKnappar`s knappform. Det
   enda som tillkommer är ett MÄRKE per rad och bankradens egen kontextrad
   (belopp · datum · telefon · meddelande) — och båda är bokförda som
   amendering, eftersom facit-fixturen aldrig hade en importrad att avbilda.

   SÄKRA RADER FÅR INGET MÄRKE, och det är kortets AC #1 som avgör: "identisk
   med facit ... i läge utgångsläget FÖR SÄKRA RADER". En säker importrad ÄR
   ett vanligt markerat kort — dess tillstånd syns i att den är förbockad med
   bankens belopp, precis som AC #2 beskriver det. Ett "Säker"-märke hade
   brutit identiteten mot facit för att säga något kortet redan säger. */

/**
 * Vilken fil raderna kom ur, plus parserns två räknade högar.
 *
 * `export` LAGD TILL I `TASK-416.6` FIX-RUNDA 2 (fynd 1), enda ändringen i
 * denna facit-låsta fil: `Bekraftelsesteget.tsx`s laddläges-skelett behöver
 * rendera EXAKT denna komponent (inte en kopia) i importflödets header, så
 * DOM:en är byte-identisk ladd-/laddat läge när `kalla`/`minne` redan är
 * kända synkront (`importoversiktFranMinne`, `importminne.ts`). Renderingen
 * här — vad `Kallrad` ritar och när `BulkC` monterar den — är OFÖRÄNDRAD;
 * promoverings-grindens ariaSnapshot mäter det rederade trädet, inte
 * modulens exportyta, så facit-låset berörs inte.
 */
export function Kallrad({ kalla }: { kalla: NonNullable<BekraftelsestegModell['importkalla']> }) {
  const kalltext = kalla.bank === '' ? kalla.filnamn : `${kalla.filnamn}, läst som ${kalla.bank}`;
  return (
    <div className="flex flex-col gap-0.5 text-caption text-text-muted">
      <span>{`${kalltext} · ${plural(kalla.lasta, 'rad', 'rader')}`}</span>
      {kalla.bortfiltrerade > 0 && (
        <span>
          {`${plural(kalla.bortfiltrerade, 'rad', 'rader')} i filen var inte inbetalningar och togs inte med.`}
        </span>
      )}
      {kalla.fel.map((post) => (
        <span key={post.radnummer} className="flex items-center gap-1">
          <TriangleAlert aria-hidden="true" size={13} className="shrink-0 text-warning" />
          {`Rad ${post.radnummer}: ${post.skal}`}
        </span>
      ))}
    </div>
  );
}

/** Märket som säger vilket av de fyra tillstånden bankraden bär. */
function ImportMarke({ klass }: { klass: ObestamdImportrad['klass'] }) {
  if (klass === 'dubblett') {
    return (
      <StatusBadge ton="neutral" storlek="sm">
        Redan registrerad
      </StatusBadge>
    );
  }
  return (
    <StatusBadge ton="warning" storlek="sm">
      {klass === 'osaker' ? 'Osäker' : 'Omatchad'}
    </StatusBadge>
  );
}

/**
 * Bankradens huvud — samma anatomi som `KortHuvud`, men namnet är BANKENS.
 *
 * Att skriva ut avsändarens namn och inte deltagarens är hela poängen med en
 * osäker rad: bankens namn är den registrerade Swish-ägarens, inte
 * nödvändigtvis deltagarens (`bankimport-matchning.ts` § NAMN + BELOPP ÄR
 * INDICIER). Beloppet står på samma rad som i ett `MarkerbartKort`, platt och
 * i tabellsiffror, så högarna läses med samma öga.
 */
function BankradsHuvud({ rad }: { rad: ObestamdImportrad }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <InitialAvatar namn={rad.namn} />
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium text-body">{rad.namn}</span>
          <ImportMarke klass={rad.klass} />
        </span>
      </span>
      <span className="font-medium text-body text-text tabular-nums">
        {`${visaKronor(rad.belopp)} kr`}
      </span>
    </div>
  );
}

/** Bankradens egen kontext: datum, telefon och meddelande, i filens ordning. */
function bankradsKontext(rad: ObestamdImportrad): string {
  const delar = [rad.datum ?? 'Datum saknas i filen'];
  if (rad.telefon !== null && rad.telefon !== '') delar.push(rad.telefon);
  if (rad.meddelande !== null && rad.meddelande !== '') delar.push(rad.meddelande);
  return delar.join(' · ');
}

/** Kandidatens knapptext: vem, vilket event, vad som saknas. */
function kandidatEtikett(kandidat: InkorgsRad): string {
  const saknas = kandidat.kvar;
  const belopp = saknas === null ? 'pris saknas' : `${visaKronor(saknas)} kr kvar att betala`;
  return `${kandidat.namn} · ${kandidat.betalning.eventNamn ?? 'Utan event'} · ${belopp}`;
}

/**
 * EN OSÄKER ELLER OMATCHAD BANKRAD i "Behöver din hand" (AC #2).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * KANDIDATERNA ÄR FÖRSLAGSKNAPPAR, INTE EN `Select`
 * ═══════════════════════════════════════════════════════════════════════════
 * Den rivna bekräftelselistan bar en `Select` ("Registrera på anmälan ..."),
 * och kortet säger uttryckligen förslagsKNAPPAR. Skillnaden är inte kosmetisk:
 * C:s hand-hög har redan en förslagsrad (`ForslagsKnappar`, radens
 * beloppskandidater), och ett tryck där sätter värdet direkt. Att lägga en
 * rullgardin bredvid den hade gett två grammatiker för samma handling i samma
 * kort. Knappformen är därför lånad ord för ord — `size="sm"`, sekundär,
 * outline, med ledtexten "Förslag" framför.
 *
 * SÖKFÄLTET ÄR OMATCHADE RADERS UTVÄG, i inkorgens rankning
 * (`modell.sokImportanmalan`). Träffarna renderas som samma knappar som
 * kandidaterna: en yta, en grammatik, oavsett hur raden hittade sin anmälan.
 */
function ImportHandKort({
  rad,
  modell,
  frusen = false,
}: {
  rad: ObestamdImportrad;
  modell: BekraftelsestegModell;
  frusen?: boolean;
}) {
  const [sokterm, setSokterm] = useState('');
  const traffar = rad.klass === 'omatchad' ? (modell.sokImportanmalan?.(sokterm) ?? []) : [];
  const valbara = rad.klass === 'omatchad' ? traffar : rad.kandidater;
  const valj = (anmalanRecordId: string) => modell.valjImportanmalan?.(rad.nyckel, anmalanRecordId);

  return (
    <li className={kortKlass(false)}>
      <BankradsHuvud rad={rad} />
      <p className="pt-1 text-caption text-text-muted">{bankradsKontext(rad)}</p>
      <p className="pt-2 text-small text-text-secondary">{rad.grund}</p>

      {rad.klass === 'omatchad' && (
        <div className="pt-3">
          <SearchField
            aria-label={`Sök anmälan för ${rad.namn}`}
            value={sokterm}
            onChange={setSokterm}
            isDisabled={frusen}
          >
            <AriaInput
              placeholder="Sök på namn, telefon eller belopp"
              className="mm-fokusring-vid-fokus text-(color:--mm-input-text) placeholder:text-(color:--mm-input-text-placeholder) min-h-10 w-full rounded border border-(--mm-input-border) bg-(--mm-input-bg) px-3 text-body"
            />
          </SearchField>
        </div>
      )}

      {valbara.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-3">
          <span className="text-caption text-text-muted">Förslag</span>
          {valbara.map((kandidat) => (
            <Button
              key={kandidat.nyckel}
              size="sm"
              intent="secondary"
              emphasis="outline"
              isDisabled={frusen}
              onPress={() => valj(kandidat.betalning.anmalanRecordId)}
            >
              {kandidatEtikett(kandidat)}
            </Button>
          ))}
        </div>
      )}

      {rad.klass === 'omatchad' && sokterm.trim() !== '' && traffar.length === 0 && (
        <p className="pt-3 text-caption text-text-muted">
          Ingen kvarvarande betalning matchar sökningen.
        </p>
      )}
    </li>
  );
}

/**
 * EN DUBBLETT — låst, utan kryss, aldrig registrerbar (AC #2 och #4).
 *
 * INGEN KRYSSRUTA OCH INGEN KNAPP, med avsikt: kortet är en UTSAGA, inte ett
 * val. En avstängd kryssruta hade sagt "det här kan du göra, fast inte nu",
 * och det är fel — raden kan aldrig bockas i, i denna session eller någon
 * annan. Dubblettskyddet självt ligger i databasen
 * (`inbetalningar_bankreferens_unik_idx`); detta kort gör det synligt INNAN
 * hon trycker, vilket är precis vad den lokala importloggen finns för
 * (`bankmappning-minne.ts` § IMPORTLOGGEN).
 */
function DubblettKort({ rad }: { rad: ObestamdImportrad }) {
  return (
    <li className={kortKlass(false)}>
      <BankradsHuvud rad={rad} />
      <p className="pt-1 text-caption text-text-muted">{bankradsKontext(rad)}</p>
      <p className="pt-2 text-small text-text-secondary">
        {rad.tidigareImporterad === null
          ? rad.grund
          : `Importerad ${rad.tidigareImporterad}. Ingen ny inbetalning skapas.`}
      </p>
    </li>
  );
}

/** Radens egna beloppskandidater som knappar — ett tryck sätter beloppet. */
function ForslagsKnappar({ rad, modell }: { rad: BekraftelseRad; modell: BekraftelsestegModell }) {
  if (rad.beloppsknappar.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-caption text-text-muted">Förslag</span>
      {rad.beloppsknappar.map((k) => (
        <Button
          key={k.nyckel}
          size="sm"
          intent="secondary"
          emphasis="outline"
          onPress={() => modell.sattRadBelopp(rad.nyckel, visaKronor(k.belopp))}
        >
          {`${forslagsEtikett(k.etikett)} · ${visaKronor(k.belopp)} kr`}
        </Button>
      ))}
    </div>
  );
}

/**
 * En rad i "Behöver din hand": samma kort, formuläret öppet från början
 * (beloppet saknas), skälet och radens egna förslag ovanför.
 *
 * [TASK-402.3, BOKFÖRD FORMÄNDRING] Formuläret bär nu Klar/Avbryt även här.
 * Prototypens `RadFormular` kunde renderas UTAN knappar (den var en kopia och
 * ägde sin egen prop-yta); det delade `RegistreraForm` i `redigera`-läget
 * kräver båda callbacks — vilket är rätt kontrakt för en komponent som ska
 * kunna stängas. "Avbryt" fäller ihop kortet till dess belopps-rad, exakt som
 * ett `MarkerbartKort` som aldrig öppnats. INGEN FACIT-BILD VISAR DETTA LÄGE:
 * facit-fixturens tio rader bär alla ett belopp, så "Behöver din hand" är tom
 * i samtliga fem låsta bilder. Ändringen är därför en amendering utan
 * motbild, bokförd i facit-katalogen i stället för att göras tyst.
 */
function HandKort({ rad, modell }: { rad: BekraftelseRad; modell: BekraftelsestegModell }) {
  const [oppen, setOppen] = useState(true);
  return (
    <li className={kortKlass(true)}>
      <div className="flex items-center gap-3">
        <KortHuvud rad={rad} vald />
      </div>
      <p className="pt-3 text-small text-text-secondary">
        {handSkal(rad)} Skriv beloppet, eller välj ett förslag.
      </p>
      <div className="pt-2">
        <ForslagsKnappar rad={rad} modell={modell} />
      </div>
      {oppen ? (
        <RadFormular
          rad={rad}
          modell={modell}
          onKlar={() => setOppen(false)}
          onAvbryt={() => setOppen(false)}
        />
      ) : (
        <div className="pt-3">
          <Button intent="secondary" emphasis="outline" onPress={() => setOppen(true)}>
            {`Fyll i beloppet för ${rad.inkorg.namn}`}
          </Button>
        </div>
      )}
    </li>
  );
}
