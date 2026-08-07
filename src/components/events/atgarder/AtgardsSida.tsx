/**
 * [PROTOTYPE] [S100] ÅTGÄRDS-SIDAN — konvergens-prototyp, varv 4.
 *
 * FRÅGAN SOM BESVARAS (throwaway-kontraktet klausul i):
 *   "Hur ska åtgärds-sidan se ut — den enda platsen där något verkställs?"
 *
 * VARV 4 STÄLLER OM HELA YTAN KRING EN FRÅGA VARV 3 ALDRIG STÄLLDE:
 * **hur kom Lotta hit?** Svaret (Marcus 2026-08-07): hon markerade ett eller
 * flera personkort i Anmälda deltagare-blocket på eventdetaljen och tryckte
 * Åtgärder. Ur det följer tre ändringar som inte är kosmetik:
 *
 *  · MOTTAGARNA ÄR `Deltagare` § `MarkerbartKort`, inte gruppdynamikens
 *    kompakta kort. Marcus: "Om hon har markerat 7 personkort på
 *    eventdetalj-sidan och tryckt på 'Åtgärder' då ska hon direkt se EXAKT
 *    SAMMA KORT IGEN … i markeringsläge, alltså gröna." Varv 3 mötte henne
 *    med en annan kortform än den hon just klickat på — kontinuiteten bröts
 *    i det ögonblick den behövdes mest.
 *  · RÄKNAREN FÖRST: "7 av 19 deltagare markerade" (Marcus ordval), före
 *    listan. Den svarar på "vad tog jag med mig hit?" innan något annat — och
 *    är sedan varv 4b också listans ACCORDION-HUVUD: korten är INFÄLLDA från
 *    början, så åtgärderna syns direkt utan att hon behöver scrolla förbi fem
 *    kort à ~170 px. Marcus: "Så hon direkt kan 'Se' åtgärderna och välja en
 *    åtgärd." Hon kom hit för att GÖRA något; det hon skulle göra måste synas.
 *  · ÖVERSTA BLOCKET BÄR BARA EVENTVÄLJAREN. Sammanfattningen och
 *    deadline-pillen sköt ned mottagarlistan; hon vet redan vilket event hon
 *    står i — hon kom från dess detaljsida. Deadline flyttade till
 *    Betalningar, där den gäller.
 *
 * Den kompakta `Gruppdynamik`-formen är KVAR, men bara i plockaren: "De
 * personkort du byggde in här är rätt för 'Lägg till fler personer från
 * eventet' men INTE för alla, inte för 'Mottagarna'."
 *
 * FORMEN ÄR B′ (Marcus-vald 2026-08-07): hubb med eventväljare överst,
 * PERMANENT REDIGERBAR mottagar-yta, och en åtgärdsmeny där den valda
 * åtgärden fälls ut IN-PLACE med de övriga raderna KVARSTÅENDE. Strukturen
 * stod fast genom varv 2:s underleverans — det var UTFÖRANDET som revs.
 *
 * VARV 3 RÄTTADE FYRA SAKER MARCUS PEKADE UT (2026-08-07), och alla fyra är
 * KOPIERINGAR ur befintliga ytor, inte nya påfund. Punkt 3 gäller sedan varv 4
 * bara plockaren; mottagarna bär deltagarkortet:
 *
 *  1. SIDHUVUDET är `ManuellAnmalanForm` § `Sidhuvud`, klass för klass: rund
 *     tillbaka-chevron (`size-11 rounded-full bg-bg-muted`, `ChevronLeft 26`),
 *     sedan `<header … border-border border-b px-4 pb-5>` med `h1
 *     font-semibold text-3xl`. Marcus: "det är ju likadant på de flesta sidor
 *     och så borde du byggt direkt." Varv 2 bar en naken `h1` utan linje.
 *
 *  2. ÖVERSTA BLOCKET är samma sidas Eventet-block: rubrikfritt kort
 *     (`divide-y divide-border rounded-2xl bg-bg-muted px-4`) med väljaren
 *     överst, sammanfattning som `dl`, och sekundär navigering sist. Bara det
 *     som påverkar HANDLINGEN står i sammanfattningen (18.18 punkt 4).
 *
 *  3. MOTTAGARNA ÄR PERSONKORT, ALDRIG RADER. Marcus: "det är big NO NO, Lotta
 *     måste känna igen sig!! Personerna ska listas på sina personkort EXAKT som
 *     dem gör på eventdetaljer." Formen är `Gruppdynamik` § `PersonKort` —
 *     som i sin tur ärvde den av `PersonMiniKort` på anmälans-detaljsidan
 *     (S93 våg 19): initial-cirkel `size-9` i `bg-bg-emphasized`, namn i
 *     `font-medium text-body`, allt i en `rounded-xl bg-surface`-yta med
 *     transparent kant. Ett kort som dras hit från eventdetaljen ser identiskt
 *     ut med kortet det kom ifrån — det är hela poängen.
 *
 *  4. SÖKNINGEN BEHÅLLS men träffarna listas också som kort. Marcus: "söka på
 *     den, de va bra. Men de ska listas på kort."
 *
 * DET SOM SAKNADES I VARV 2 SITTER NU PÅ KORTET: statusbadge (`StatusBadge`,
 * pill-skalans `sm` per `T127`), betalningsstatus per person i den linjerade
 * underraden, och deadline-signalen i eventblocket (`deadlineStatus` —
 * DELAD med betalningsvyn, inte en andra kopia av 14-dagars-regeln).
 *
 * GRAMMATIKEN ÄR ÄRVD, INTE UPPFUNNEN — `DetaljGrupp`/`EtikettVardeRad` ur
 * eventsidans S93-facit, radformens hover-platta och `NumRuta` ur
 * `detail/Atgarder.tsx`, och sändvertikalens kontrakt ur
 * `segment/SegmentMailCompose.tsx` (pessimistisk bulk, skriv-för-att-bekräfta,
 * grön knapp eftersom handlingen når utomstående — aldrig danger).
 *
 * READ-ONLY FÖRSTÄRKT (prototype-skillen § Miljö- och adapter-förhållandet):
 * INGEN handling här muterar något. Mottagar-listan läses via `fetchRegistrations`
 * genom router-context-DI (adapter-gränsen kringgås aldrig); allt Lotta gör i
 * prototypen lever i minnet. Mallar och bilagor har ingen datakälla ännu —
 * bilage-fundamentet (`TASK-146`) är inte byggt — så de är prototyp-lokala
 * stubbar, tydligt märkta nedan.
 *
 * KASTBAR: koden absorberas ALDRIG (klausul iv). Vinnaren skrivs OM genom
 * leverans-grindarna via spec-ledet.
 */
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock,
  FileText,
  History,
  Inbox,
  type LucideIcon,
  MailCheck,
  Paperclip,
  Plus,
  Sparkles,
  Upload,
  UserPlus,
} from 'lucide-react';
import { type ReactNode, useId, useMemo, useState } from 'react';
import { Checkbox } from 'react-aria-components';
import { deadlineStatus } from '@/components/events/detail/Betalningar';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { TextArea } from '@/components/primitives/TextArea';
import { displayName } from '@/components/registrations/registration-display';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import { PaymentStatus, RegistrationSource, RegistrationStatus } from '@/domain/types/Status';
import { queryKeys } from '@/queries/keys';
import { DetaljGrupp } from '../detail/DetaljGrupp';
import { EventValjare } from '../EventValjare';

/* ------------------------------------------------------------------ *
 * Grammatik ärvd ur detail/Atgarder.tsx — hover-plattan skjuter 8 px
 * utanför kortets 16 px-inset utan att texten flyttas (K56).
 * ------------------------------------------------------------------ */
const RAD_KLASS =
  '-mx-2 flex w-auto items-center gap-2 rounded-lg px-2 py-1.5 text-left font-medium text-body hover:bg-bg-emphasized motion-safe:transition-colors';

/** Radnumret i VIT ruta — får aldrig dela färg med hover-plattan (18.15). */
function NumRuta({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg bg-surface font-semibold text-caption text-text-secondary"
    >
      {n}
    </span>
  );
}

/** Kortytan — Eventet-blockets/DetaljGrupps tonala kort (18.18 punkt 2). */
const KORT_KLASS =
  'rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong';

/**
 * Namn-previewns gräns. Härledd, inte vald — se previewns docblock nedan:
 * MUI `AvatarGroup` (`max = 5`), Fluent UI v8 `Facepile`
 * (`maxDisplayablePersonas: 5`) och Microsofts egen rekommendation
 * konvergerar på fem. Belägg: `docs/research/mottagar-preview-monster-2026-08-07.md` § 2.
 */
const PREVIEW_GRANS = 5;

/**
 * "Anna, Bert, Cissi, David och Erik och 9 till." — svensk uppräkning med
 * `och` före det sista namnet, och overflow som REN TEXT.
 *
 * Under gränsen: bara uppräkningen. Exakt EN över gränsen ger ingen "+1 till"
 * — då är det billigare att visa namnet än att räkna det (samma regel som
 * "frånvaron är informationen": en rest på ett är ingen rest).
 */
function namnPreview(namn: string[]): string {
  const uppraknat = (n: string[]) =>
    n.length <= 1 ? (n[0] ?? '') : `${n.slice(0, -1).join(', ')} och ${n[n.length - 1]}`;

  if (namn.length <= PREVIEW_GRANS + 1) return `${uppraknat(namn)}.`;
  const rest = namn.length - PREVIEW_GRANS;
  return `${namn.slice(0, PREVIEW_GRANS).join(', ')} och ${rest} till.`;
}

/* ------------------------------------------------------------------ *
 * De FYRA åtgärdstyperna (varv 6, Marcus 2026-08-07).
 *
 * LISTAN VAR SEX OCH ÄR NU FYRA — båda strykningarna har samma motiv:
 * en åtgärdslista ska bara innehålla saker som GÖRS MOT URVALET.
 *
 *  · "Manuell anmälan" flyttade UPP till mottagar-ytan, som en andra väg in
 *    bredvid "Lägg till fler personer från eventet". Den hörde aldrig hemma
 *    här: den bygger urvalet, den verkar inte på det. Marcus: "flytta upp
 *    'manuell anmälan' dit. Då blir 'Skicka bekräftelse' första åtgärd i
 *    åtgärdsblocket/listan vilket är väldigt rimligt."
 *  · "Markera betalda" ströks helt. Den skriver i basen om BETALNINGAR, och
 *    betalningarna har redan en egen ingång längre ned. Marcus: "Det får
 *    eventuellt bli en 'markera alla funktion' i betalningsblocket sen" —
 *    alltså en parkerad idé på rätt plats, inte en åtgärd på fel.
 *
 * FÖLJDEN: alla fyra kvarvarande ÄR utskick, och alla fyra fäller ut here.
 * Fälten `utskick` och `leder` blev därmed konstanta och är borttagna
 * tillsammans med sina grenar — ett fält som alltid har samma värde döljer
 * att valet inte längre finns. ORDLISTAs gloss "(utskickstyp)" för åtgärdsval,
 * som docblocken tidigare kallade "för smal", är nu exakt rätt.
 *
 * NAMNEN ÄR MARCUS EGNA, verbatim ur omstyrningen: varje rad inleds med
 * verbet "Skicka", vilket gör listan till fyra parallella handlingar i stället
 * för fyra substantiv av olika slag ("Bekräftelse" ~ "Fritt utskick").
 * ------------------------------------------------------------------ */
type AtgardsTyp = {
  nr: number;
  nyckel: string;
  namn: string;
  /** Prototyp-stubb: mallens ämnesrad. Ingen mall-datakälla finns ännu. */
  amne: string;
  /** Prototyp-stubb: mallens brödtext. */
  mall: string;
  /** Vilka i urvalet åtgärden är relevant för — driver räknaren på raden. */
  urvalsfilter?: (r: Registration) => boolean;
};

const saknarAnmalningsavgift = (r: Registration) =>
  r.anmalningsavgift === PaymentStatus.EJ_MOTTAGEN;
const saknarSlutbetalning = (r: Registration) => r.slutbetalning === PaymentStatus.EJ_MOTTAGEN;
const obetald = (r: Registration) => saknarAnmalningsavgift(r) || saknarSlutbetalning(r);
const obekraftad = (r: Registration) => r.status === RegistrationStatus.OBEKRAFTAD;

const ATGARDER: AtgardsTyp[] = [
  {
    nr: 1,
    nyckel: 'bekraftelse',
    namn: 'Skicka bekräftelsemail',
    amne: 'Din plats är bekräftad',
    mall: 'Hej {förnamn},\n\nDin plats på {event} är bekräftad. Vi ses {datum} i {ort}.\n\nVarmt välkommen!\nRoger och Lotta',
    urvalsfilter: obekraftad,
  },
  {
    nr: 2,
    nyckel: 'paminnelse',
    namn: 'Skicka betalningspåminnelse',
    amne: 'Påminnelse om betalning',
    mall: 'Hej {förnamn},\n\nVi ser att betalningen för {event} inte kommit in ännu. Sista dag är {deadline}.\n\nHör gärna av dig om något krånglar.\nRoger och Lotta',
    urvalsfilter: obetald,
  },
  {
    nr: 3,
    nyckel: 'eventinfo',
    namn: 'Skicka eventinformation',
    amne: 'Information inför {event}',
    mall: 'Hej {förnamn},\n\nSnart är det dags! Här kommer praktisk information inför {event}.\n\nRoger och Lotta',
  },
  { nr: 4, nyckel: 'fritt', namn: 'Skicka mail', amne: '', mall: '' },
];

/* ------------------------------------------------------------------ *
 * BILAGEVÄLJARENS STUBB — de tre dokumentklasserna (ORDLISTA § Bilaga).
 *
 * Klass C är strukturellt olik de andra två och det MÅSTE synas i väljaren:
 * en person-genererad bilaga är inte EN fil till sex mottagare, det är SEX
 * filer — en per mottagare. Det är ett andra, oberoende skäl till att den
 * bilage-bärande sändvägen måste vara loopad singelsändning (underlaget § 7
 * härledde grenen ur den tysta batch-bristen; klass C ger den samma svar).
 *
 * INGEN FÖRVALS-LOGIK (grillad samsyn beslut 5, bokstavligt): ingen bilaga är
 * förkryssad. En gissad förvald bilaga är farligare än en tom väljare.
 * ------------------------------------------------------------------ */
type BilageKlass = 'A' | 'B' | 'C';

type Bilaga = {
  id: string;
  namn: string;
  klass: BilageKlass;
  /** Klass A: filstorlek. Klass B/C: null — filen finns inte förrän den skapas. */
  storlek?: string;
};

const BILAGOR: Bilaga[] = [
  { id: 'a1', namn: 'Hörlursinformation.pdf', klass: 'A', storlek: '184 kB' },
  { id: 'a2', namn: 'Vägbeskrivning Skövde.pdf', klass: 'A', storlek: '92 kB' },
  { id: 'b1', namn: 'Deltagarinformation', klass: 'B' },
  { id: 'c1', namn: 'Betalningskvitto', klass: 'C' },
];

const KLASS_TEXT: Record<BilageKlass, (antal: number) => string> = {
  A: () => 'Samma fil till alla',
  B: () => 'Fylls med eventets uppgifter — samma till alla',
  C: (antal) => `Genereras för var och en — ${antal} st`,
};

/* ================================================================== *
 * DELTAGARKORTET — samma kort Lotta MARKERADE på eventdetaljen.
 *
 * "HUR KOM LOTTA HIT?" är frågan som styr hela den här ytan (Marcus
 * 2026-08-07). Svaret: hon markerade personkort i Anmälda deltagare-blocket
 * och tryckte Åtgärder. Alltså måste det FÖRSTA hon ser vara exakt de korten
 * igen, i markeringsläge — gröna, i en lista, precis som hon lämnade dem.
 *
 * Varv 3 hade fel kort här. `Gruppdynamik` § `PersonKort` (initial-cirkel +
 * namn) är rätt för PLOCKAREN — en kompakt sökträff — men fel för mottagarna:
 * de har redan en form, och den formen är `Deltagare` § `MarkerbartKort`.
 * Marcus: "Om hon har markerat 7 personkort på eventdetalj-sidan och tryckt på
 * 'Åtgärder' då ska hon direkt se EXAKT SAMMA KORT IGEN."
 *
 * FORMEN, klass för klass ur `Deltagare.tsx`:
 *  · Kortet ÄR kryssrutan (rå RAC `Checkbox`, BorOverRad-precedenten) — inga
 *    länkar inuti, så L303 (interaktivt bor aldrig i interaktivt) håller.
 *  · Vald: `border-(--mm-success)` + `bg-(--mm-success-bg)`. Ovald: kortets
 *    vanliga `--mm-navcard-border`/`bg-surface`. Kant-boxen finns i BÅDA lägena
 *    så geometrin aldrig hoppar.
 *  · KANTEN ÄR WCAG 1.4.1-BÄRAREN — inte den gröna plattan. Ovalt kort har
 *    transparent kontur, valt får `--mm-success`: skillnaden är att en kontur
 *    UPPSTÅR, inte att en färg byts. Plattan mäter 1,05:1 mot vitt och bär i
 *    praktiken ingenting för den färgblinde. Tona aldrig ned kanten.
 *  · Identitetszonen: namn `font-semibold text-body`, etiketten "E-post" i
 *    `text-caption text-text-muted`, adressen i `text-small`.
 *  · Pill-slotten är RESERVERAD (`w-30 sm:w-[45%]`), inte innehålls-styrd —
 *    annars ärver identitetskolumnen pillarnas breddvariation och korten
 *    sågtandar (S91-mätningen: 157,95 mot 214,33 px identitetsbredd).
 *  · Obekräftad-pillen VIKER för markeringen (byggkrav 2) — ingen 'Vald'-pill
 *    ersätter den. Kategori-pillen står kvar i båda lägena.
 *  · Metaytan: Anmäld-raden, ENDAST utförda utskick, historikraden sist med
 *    hela namnet "Miranon Media".
 *
 * Länkarna VILAR (`lankat={false}`-grenen i förlagan) — i markeringsläget är
 * hela kortet en kryssruta, och det är precis det läget den här sidan bär.
 * ================================================================== */

const DAGMANAD = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long' });
const KLOCKSLAG = new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' });

/** Bekräftad ⟺ basens Status har lämnat 'Obekräftad' (ORDLISTA; S73 K53). */
function arBekraftad(r: Registration): boolean {
  return r.status !== RegistrationStatus.OBEKRAFTAD;
}

type DeltagarKategori = 'formular' | 'manuell' | 'medfoljande' | 'vantelista';

function kategori(r: Registration): DeltagarKategori {
  switch (r.kalla) {
    case RegistrationSource.MANUELL:
      return 'manuell';
    case RegistrationSource.MEDFOLJANDE:
      return 'medfoljande';
    case RegistrationSource.VANTELISTA:
      return 'vantelista';
    default:
      return 'formular';
  }
}

/** Pill-etikett per kategori — normen (via formulär) får inget märke (K37). */
const KATEGORI_PILL: Partial<Record<DeltagarKategori, string>> = {
  manuell: 'Manuellt tillagd',
  medfoljande: 'Medföljande',
  vantelista: 'Från väntelistan',
};

/** Dag + månad ur en ISO-tidsstämpel ('26 juni'); null/ogiltigt → null. */
function dagManad(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : DAGMANAD.format(d);
}

/** "Anmäld 1 juli 09:00" på EN rad (K45); saknad tidsstämpel ⇒ raden uteblir. */
function anmaldText(reg: Registration): string | null {
  if (!reg.inskickad) return null;
  const d = new Date(reg.inskickad);
  if (Number.isNaN(d.getTime())) return null;
  return `Anmäld ${DAGMANAD.format(d)} ${KLOCKSLAG.format(d)}`;
}

/** SENASTE påminnelsen över basens tre parallella tidsstämplar (T16 enar dem). */
function senastePaminnelse(reg: Registration): string | null {
  const kandidater = [
    reg.betalningspaminnelseSkickad,
    reg.paminnelseAnmalningsavgiftSkickad,
    reg.paminnelseSlutbetalningSkickad,
  ].filter((v): v is string => v != null && !Number.isNaN(Date.parse(v)));
  if (kandidater.length === 0) return null;
  return kandidater.reduce((senast, v) => (Date.parse(v) > Date.parse(senast) ? v : senast));
}

/** En rad i metaytan — ikon + text, aldrig interaktiv (K62/L303). */
function MetaRad({ ikon: Ikon, children }: { ikon: LucideIcon; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1">
      <Ikon aria-hidden="true" size={12} className="shrink-0" />
      {children}
    </span>
  );
}

/** Kortets innehåll — förlagans `KortInnehall` i sin `lankat={false}`-gren. */
function DeltagarKortInnehall({ reg, vald }: { reg: Registration; vald: boolean }) {
  const pill = KATEGORI_PILL[kategori(reg)];
  const anmald = anmaldText(reg);
  const bekraftelse = dagManad(reg.bekraftelseSkickad);
  const paminnelse = dagManad(senastePaminnelse(reg));
  const eventinfo = dagManad(reg.deltagarinfoSkickad);
  const genomforda = reg.antalGenomfordaEvent;

  return (
    <>
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span data-testid="deltagar-namn" className="break-words font-semibold text-body">
            {displayName(reg)}
          </span>
          <span className="text-caption text-text-muted">E-post</span>
          <span className="break-words text-small">
            {reg.email ?? <span className="text-text-muted">Saknas</span>}
          </span>
        </span>
        {/* Reserverad pill-slot — se blockets docblock (sågtand-mätningen). */}
        <span className="flex w-30 shrink-0 flex-wrap items-center justify-end gap-1.5 sm:w-[45%]">
          {!arBekraftad(reg) && !vald && (
            <span className="rounded-full bg-(--mm-error-bg) px-2 py-0.5 font-medium text-caption text-error">
              Obekräftad
            </span>
          )}
          {pill && (
            <span className="rounded-full bg-bg-muted px-2 py-0.5 font-medium text-caption text-text-secondary">
              {pill}
            </span>
          )}
        </span>
      </div>
      <div className="flex flex-col gap-1 px-4 pt-2.5 pb-3 text-caption text-text-muted">
        {anmald && <MetaRad ikon={Inbox}>{anmald}</MetaRad>}
        {bekraftelse && <MetaRad ikon={MailCheck}>{`Bekräftelse ${bekraftelse}`}</MetaRad>}
        {paminnelse && <MetaRad ikon={MailCheck}>{`Påminnelse ${paminnelse}`}</MetaRad>}
        {eventinfo && <MetaRad ikon={MailCheck}>{`Eventinfo ${eventinfo}`}</MetaRad>}
        {genomforda != null && (
          <span className="mt-0.5 flex items-center gap-1.5">
            <History aria-hidden="true" size={12} className="shrink-0" />
            {genomforda === 0
              ? 'Första eventet hos Miranon Media'
              : `${genomforda} tidigare event hos Miranon Media`}
          </span>
        )}
      </div>
    </>
  );
}

/** Markerbart deltagarkort — `Deltagare` § `MarkerbartKort`, klass för klass. */
function MarkerbartDeltagarKort({
  reg,
  vald,
  onChange,
}: {
  reg: Registration;
  vald: boolean;
  onChange: (vald: boolean) => void;
}) {
  return (
    <Checkbox
      data-testid="markerbart-kort"
      isSelected={vald}
      onChange={onChange}
      // contrast-more-kanten bor i VARDERA grenen, aldrig i bas-klasserna:
      // varianten vinner annars över `border-(--mm-success)` och ger valda kort
      // den NEUTRALA kanten i förhöjd kontrast (förlagans review-fynd 6).
      className={`flex cursor-pointer flex-col rounded-xl border ${
        vald
          ? 'border-(--mm-success) bg-(--mm-success-bg) contrast-more:border-(--mm-success)'
          : 'border-(--mm-navcard-border) bg-surface contrast-more:border-(--mm-navcard-border-contrast)'
      }`}
    >
      <DeltagarKortInnehall reg={reg} vald={vald} />
    </Checkbox>
  );
}

/* ================================================================== *
 * PLOCKARENS KOMPAKTA KORT — `Gruppdynamik` § `PersonKort`.
 *
 * Marcus 2026-08-07: "De personkort du byggde in här är rätt för 'Lägg till
 * fler personer från eventet' men INTE för alla, inte för 'Mottagarna'."
 * Alltså: den kompakta formen BEHÅLLS här, där den är en sökträff — och bara
 * här. Initial-cirkel + namn + betalnings-underrad, DOM-mätt identiskt med
 * eventdetaljens gruppdynamik-kort (varv 3:s mätning står).
 * ================================================================== */

/**
 * Initialerna för cirkeln ("AA" ur "Anna Andersson") — max två, versala.
 *
 * Tredje duplikatet, med samma motiv som `Gruppdynamik` bokförde vid det
 * andra: `PersonMiniKort`s API är FÖRSEGLAT, så formen ärvs men inte koden.
 * Med tre förekomster är hjälparen en verklig `lib/`-kandidat — den noteras
 * för spec-ledet i stället för att lyftas i kastbar kod.
 */
function initialer(namn: string): string {
  return namn
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((d) => d[0]?.toUpperCase() ?? '')
    .join('');
}

/** Betalnings-underraden: ETT streck + EN utsaga, aldrig en tom uppräkning. */
function BetalRader({ reg }: { reg: Registration }) {
  const saknade: string[] = [];
  if (saknarAnmalningsavgift(reg)) saknade.push('Anmälningsavgift');
  if (saknarSlutbetalning(reg)) saknade.push('Slutbetalning');

  // Ej relevant (föreläsnings-semantiken) är INTE en brist och får aldrig
  // klassas som en — den utsagan står för sig själv.
  const ejRelevant =
    reg.anmalningsavgift === PaymentStatus.EJ_RELEVANT &&
    reg.slutbetalning === PaymentStatus.EJ_RELEVANT;

  const rader: { text: string; streck: string; klass: string }[] = ejRelevant
    ? [{ text: 'Betalning ej relevant', streck: 'bg-border-strong', klass: 'text-text-muted' }]
    : saknade.length > 0
      ? saknade.map((s) => ({
          text: `${s} saknas`,
          streck: 'bg-warning',
          klass: 'text-text-secondary',
        }))
      : [{ text: 'Betalning klar', streck: 'bg-success', klass: 'text-text-secondary' }];

  if (!reg.email) {
    rader.push({ text: 'Ingen e-postadress', streck: 'bg-error', klass: 'text-text-secondary' });
  }

  return (
    <ul className="flex flex-col gap-1 pl-12">
      {rader.map((r) => (
        <li
          key={r.text}
          data-testid="kandidat-statusrad"
          className="flex items-center gap-1.5 text-caption"
        >
          <span aria-hidden="true" className={`h-3.5 w-1 shrink-0 rounded-full ${r.streck}`} />
          <span className={`truncate ${r.klass}`}>{r.text}</span>
        </li>
      ))}
    </ul>
  );
}

/** Kompakt sökträff-kort med lägg-till-knapp. */
function KandidatKort({ reg, onLaggTill }: { reg: Registration; onLaggTill: () => void }) {
  const namn = displayName(reg);
  return (
    <div
      data-testid="kandidat-personkort"
      className="flex flex-col gap-2 rounded-xl border border-transparent bg-surface px-3 py-2.5 contrast-more:border-border-strong"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-emphasized font-semibold text-small text-text-secondary"
        >
          {initialer(namn)}
        </span>
        <span className="min-w-0 truncate font-medium text-body">{namn}</span>
        <button
          type="button"
          onClick={onLaggTill}
          aria-label={`Lägg till ${namn} som mottagare`}
          className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-emphasized hover:text-text motion-safe:transition-colors"
        >
          <Plus aria-hidden="true" size={18} />
        </button>
      </div>
      <BetalRader reg={reg} />
    </div>
  );
}

/* ================================================================== *
 * MOTTAGAR-YTAN — markeringen hon kom hit med, oförändrad.
 *
 * Räknaren först ("7 av 19 deltagare markerade" — Marcus ordval), sedan de
 * markerade korten i en lista precis som i Anmälda deltagare-blocket, sedan
 * ingången till de omarkerade.
 *
 * AVMARKERING LÄMNAR KORTET KVAR I LISTAN, vitt — den är markeringslägets egen
 * grammatik, och den är oförändrad från eventdetaljen. Ett kort som FÖRSVANN
 * under fingret hade brutit den, och Lotta hade tappat platsen i listan. Det
 * omarkerade kortet räknas inte som mottagare någonstans; räknaren och alla
 * åtgärds-räknare går över de VALDA.
 *
 * Den permanenta redigerbarheten (Marcus-krav 2026-08-07: "hon kanske drar in
 * 7 stycken … men sen vill skicka tillbaka 1 person och hämta in 2 nya") bärs
 * alltså av två rörelser: avmarkera i listan, och plocka in ur "Lägg till fler".
 * ================================================================== */
function MottagarYta({
  eventId,
  valda,
  synliga,
  alla,
  onVaxla,
  onLaggTill,
}: {
  /** Eventet urvalet gäller. Saknas det finns inget att anmäla någon TILL,
      och den manuella vägen in utelämnas — se raden nedan. */
  eventId?: string;
  /** De markerade — mottagarna. */
  valda: ReadonlySet<string>;
  /** Korten som visas i listan: markeringen hon kom med, plus inplockade. */
  synliga: Registration[];
  /** Alla anmälda på eventet — nämnaren i räknaren. */
  alla: Registration[];
  onVaxla: (id: string, vald: boolean) => void;
  onLaggTill: (id: string) => void;
}) {
  /* LISTAN ÄR INFÄLLD FRÅN BÖRJAN (Marcus 2026-08-07: "Dem 5 som man ser direkt
     i listan nu måste nog också vara infällda från början. Så hon direkt kan
     'Se' åtgärderna och välja en åtgärd").

     Fem kort à ~170 px sköt ned Åtgärd-menyn under vikningen: hon kom hit för
     att GÖRA något, och det hon skulle göra syntes inte. Infälld blir sidan en
     halv skärm — räknaren svarar "vad tog jag med mig", åtgärderna står direkt
     under, och korten är ett klick bort när hon vill kontrollera dem.

     Räknar-raden ÄR accordion-huvudet: samma grammatik som `Gruppdynamik` §
     `NivaAccordion` — knappens `py-1.5` i en förälder med `py-2`, så
     hover-plattan läser som en KNAPP i raden, inte som raden själv. */
  const [listaOppen, setListaOppen] = useState(false);
  const [plockareOppen, setPlockareOppen] = useState(false);
  const [sok, setSok] = useState('');
  const listPanelId = useId();

  /** De MARKERADES namn i listordning — previewns innehåll. */
  const mottagarNamn = useMemo(
    () => synliga.filter((r) => valda.has(r.id)).map(displayName),
    [synliga, valda],
  );

  const synligaIds = useMemo(() => new Set(synliga.map((r) => r.id)), [synliga]);
  const kandidater = useMemo(
    () =>
      alla
        .filter((r) => !synligaIds.has(r.id))
        .filter((r) =>
          sok.trim() === ''
            ? true
            : displayName(r).toLowerCase().includes(sok.trim().toLowerCase()) ||
              (r.email ?? '').toLowerCase().includes(sok.trim().toLowerCase()),
        ),
    [alla, synligaIds, sok],
  );

  return (
    <section aria-labelledby="grupp-mottagare" className="flex min-w-0 flex-col gap-2">
      <h2 id="grupp-mottagare" className="px-4 font-semibold text-lg">
        Mottagare
      </h2>

      <div data-testid="mottagar-kort" className={`divide-y divide-border ${KORT_KLASS}`}>
        {/* RÄKNAREN — det första hon ska se (Marcus: "typ '7 av 19 deltagare
            markerade'"), och tillika listans accordion-huvud. Antalet står som
            TEXT i knapp-etiketten så skärmläsaren får hela bilden; `aria-live`
            gör att ändringen annonseras när hon av-/påmarkerar inne i panelen.

            VIKTEN HÖJDES I VARV 4c (Marcus: "'14 av 16' syns inte så bra
            liksom, det fångas inte av ögat"). Raden bar `font-medium text-body`
            — samma grad som allt annat på sidan, alltså ingenting som drog
            blicken. Nu: `text-xl` på SIFFRORNA (grad-språnget bär), och en
            grön `CircleCheck` framför. Bocken är samma gröna signal som
            markerade kort bär, så räknaren och korten läser som samma sak
            — och den är `aria-hidden` dekor: texten är bäraren (WCAG 1.4.1). */}
        <div className="flex flex-col py-2">
          <button
            type="button"
            aria-expanded={listaOppen}
            aria-controls={listPanelId}
            onClick={() => setListaOppen((v) => !v)}
            className="-mx-2 flex w-auto items-center justify-between gap-4 rounded-lg px-2 py-1.5 text-left hover:bg-bg-emphasized motion-safe:transition-colors"
          >
            <span className="flex min-w-0 items-center gap-2">
              <CircleCheck aria-hidden="true" size={20} className="shrink-0 text-(--mm-success)" />
              {/* `aria-atomic="true"` (research-passet § 5, MDN:s aria-live-
                  guide): utan den annonserar en skärmläsare bara den ÄNDRADE
                  noden när siffran går 14 → 13 — alltså "13", utan "av 16
                  deltagare markerade". MDN:s eget exempel är en klocka som
                  läses upp som "34" i stället för "17:34". Systerkomponenten
                  `Deltagare` § `MarkeringsBatchBar` bär den redan; vår
                  saknade den. */}
              <span
                data-testid="markering-rakning"
                aria-live="polite"
                aria-atomic="true"
                className="text-body"
              >
                <span className="font-semibold text-xl tabular-nums">{valda.size}</span> av{' '}
                <span className="font-semibold text-xl tabular-nums">{alla.length}</span> deltagare
                markerade
              </span>
            </span>
            <ChevronDown
              aria-hidden="true"
              size={18}
              className={`shrink-0 text-text-secondary motion-safe:transition-transform ${
                listaOppen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* NAMN-PREVIEWN (Marcus 2026-08-07): "en liten preview-lista med
              namnen på dem hon tog med sig … det kanske räcker som en liten
              bekräftelse på att 'Ja, alla är med'."

              FÖRSTA FÖRSÖKET VAR EN OGRÄNSAD `join(', ')` över alla 14 namnen
              — ett textstycke på 94 px. Marcus dom: "Jävlar vilken ful preview
              … oanvändbar och måste göras om." Formen är nu omgjord mot
              research-passet `docs/research/mottagar-preview-monster-2026-08-07.md`.

              GRÄNSEN ÄR 5, OCH DEN ÄR HÄRLEDD, INTE VALD. Tre oberoende
              förstapartskällor konvergerar på fem: MUI `AvatarGroup` har
              `max = 5` i källkoden, Fluent UI v8 `Facepile` har
              `maxDisplayablePersonas: 5` i sin `defaultProps`, och Microsofts
              egen dokumentation kallar det "the default and recommended
              number". Spridningen är ärlig och står i passet: Pinterest
              Gestalt avviker till 3, GitHub Primer sätter hårt tak vid 4 och
              BYTER mönster i stället för att trunkera djupare. Det finns
              alltså inte EN branschsiffra — det finns ett kluster 3–5, och 5
              är dess starkast belagda punkt.

              "OCH N TILL" ÄR REN TEXT, INTE EN KNAPP. Sidan har redan en
              fungerande "se alla"-mekanik: räknar-raden ovanför ÄR
              accordion-huvudet för hela kortlistan. En andra klickyta hade
              byggt parallellt maskineri för samma jobb, och APG erbjuder
              inget standardkontrakt för en sådan mini-popover — varje sådan
              yta blir ett eget, otestat mönster.

              VARKEN CHIPS ELLER AVATARSTAPEL, av två skäl som sammanfaller:
              chips signalerar borttagbarhet (Salesforce: "By default, pills
              include a remove button" — hela tangentbordsmodellen är byggd
              kring borttagning) och urvalet redigeras INTE här utan i korten
              nedanför; och en avatarstapel förutsätter foton som varken
              `Registration` eller `Person` bär, så den hade degraderat till
              initial-cirklar — strikt svagare än att visa namnet.

              PASSETS EGEN RESERVATION, bokförd: vårt scenario (read-only
              namn-bekräftelse utan foton, 1–30 poster) ligger MELLAN de
              etablerade mönstren, inte på ett av dem. Gränsen 5 är därför
              lånad från avatargruppernas talkluster, inte belagd för just
              denna form. */}
          {mottagarNamn.length > 0 && (
            <p
              data-testid="mottagar-preview"
              className="mt-2 rounded-xl border border-(--mm-navcard-border) bg-surface p-2.5 text-caption text-text-secondary contrast-more:border-(--mm-navcard-border-contrast)"
            >
              {namnPreview(mottagarNamn)}
            </p>
          )}

          {/* `pt-2` skiljer panelen från knappen; föräldern bär redan `py-2`
              nedåt så ingen egen `pb` behövs. Panelen renderas alltid i DOM:en
              med `hidden` — aria-controls måste peka på ett element som finns. */}
          <div id={listPanelId} hidden={!listaOppen} className="flex flex-col gap-2 pt-2">
            {synliga.length === 0 ? (
              <p className="text-small text-text-secondary">
                Inga deltagare markerade. Lägg till från eventet nedan.
              </p>
            ) : (
              synliga.map((r) => (
                <MarkerbartDeltagarKort
                  key={r.id}
                  reg={r}
                  vald={valda.has(r.id)}
                  onChange={(v) => onVaxla(r.id, v)}
                />
              ))
            )}
          </div>
        </div>

        {/* PLOCKAREN — de som INTE är markerade, utan att lämna sidan. */}
        <div className="flex flex-col py-1.5">
          <button
            type="button"
            onClick={() => setPlockareOppen(!plockareOppen)}
            aria-expanded={plockareOppen}
            className={RAD_KLASS}
          >
            <Plus aria-hidden="true" size={16} className="shrink-0" />
            Lägg till fler personer från eventet
            <span className="ml-auto flex shrink-0 items-center gap-2">
              <span className="text-small text-text-secondary tabular-nums">
                {alla.length - synliga.length}
              </span>
              <ChevronDown
                aria-hidden="true"
                size={18}
                className={`text-text-secondary motion-safe:transition-transform ${
                  plockareOppen ? 'rotate-180' : ''
                }`}
              />
            </span>
          </button>
        </div>

        {plockareOppen && (
          <div className="flex flex-col gap-3 py-3">
            <Input
              label="Sök deltagare"
              value={sok}
              onChange={setSok}
              placeholder="Namn eller e-post…"
            />
            <div className="scrollbar-inline flex max-h-96 flex-col gap-2 overflow-auto">
              {kandidater.length === 0 ? (
                <p className="py-1 text-small text-text-muted">
                  {alla.length === synliga.length
                    ? 'Alla anmälda är redan i listan.'
                    : 'Ingen matchar sökningen.'}
                </p>
              ) : (
                kandidater.map((r) => (
                  <KandidatKort key={r.id} reg={r} onLaggTill={() => onLaggTill(r.id)} />
                ))
              )}
            </div>
          </div>
        )}

        {/* DEN ANDRA VÄGEN IN — personen som inte är anmäld till eventet alls.
            Marcus 2026-08-07: "Under 'lägg till fler personer från eventet'
            vill jag lägga '+ Lägg till en person manuellt', alltså flytta upp
            'manuell anmälan' dit."

            SYSKON TILL PLOCKAR-RADEN, INTE INUTI DEN: de två raderna svarar på
            samma fråga ("vem mer?") med varsin källa — eventets anmälda, och
            någon som inte finns där än. Hade den bott inuti plockarens utfällda
            panel vore den osynlig i det läge där Lotta faktiskt undrar, och
            hon hade fått öppna en lista med fel personer för att hitta vägen
            förbi den.

            CHEVRON HÖGER, inte ned: raden LEDER BORT. Det är samma ärlighets-
            princip åtgärdslistan bar tills den blev fyra utfällbara rader —
            semantiken flyttade hit tillsammans med funktionen.

            `fran: 'atgarder'` är hela tillbaka-vägen: manuell anmälan läser den
            och riktar sin pil hit i stället för till eventdetaljen. */}
        {eventId != null && (
          <div className="flex flex-col py-1.5">
            <Link
              to="/event/$eventId/ny-anmalan"
              params={{ eventId }}
              search={{ fran: 'atgarder' as const }}
              className={RAD_KLASS}
            >
              <UserPlus aria-hidden="true" size={16} className="shrink-0" />
              Lägg till en person manuellt
              <ChevronRight
                aria-hidden="true"
                size={18}
                className="ml-auto shrink-0 text-text-secondary"
              />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

/* ================================================================== *
 * BILAGEVÄLJAREN — utan förvals-logik, klass C synligt särskild.
 * ================================================================== */
function BilageValjare({
  valda,
  antalMottagare,
  onVaxla,
}: {
  valda: Set<string>;
  antalMottagare: number;
  onVaxla: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-small text-text-muted">
          <Paperclip aria-hidden="true" size={14} />
          Bilagor
        </span>
        <span className="text-small text-text-secondary">
          {valda.size === 0 ? 'Inga valda' : `${valda.size} valda`}
        </span>
      </div>

      <div className="divide-y divide-border rounded-lg bg-surface">
        {BILAGOR.map((b) => {
          const ar = valda.has(b.id);
          return (
            <label
              key={b.id}
              className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-bg-muted motion-safe:transition-colors"
            >
              <input
                type="checkbox"
                checked={ar}
                onChange={() => onVaxla(b.id)}
                className="mt-0.5 size-4 shrink-0 accent-[var(--mm-color-primary)]"
              />
              <span className="flex min-w-0 flex-col">
                <span className="flex items-center gap-2">
                  {b.klass === 'A' ? (
                    <FileText aria-hidden="true" size={14} className="shrink-0 text-text-muted" />
                  ) : (
                    <Sparkles aria-hidden="true" size={14} className="shrink-0 text-text-muted" />
                  )}
                  <span className="truncate font-medium text-body">{b.namn}</span>
                </span>
                <span className="text-small text-text-muted">
                  {KLASS_TEXT[b.klass](antalMottagare)}
                  {b.storlek ? ` · ${b.storlek}` : ''}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <p className="text-small text-text-muted">
        Ingenting är förvalt — du väljer aktivt vad som följer med.
      </p>
    </div>
  );
}

/* ================================================================== *
 * ÅTGÄRDENS ARBETSYTA — fälls ut in-place under sin egen rad.
 * ================================================================== */
function ArbetsYta({ atgard, mottagare }: { atgard: AtgardsTyp; mottagare: Registration[] }) {
  const [amne, setAmne] = useState(atgard.amne);
  const [text, setText] = useState(atgard.mall);
  const [bilagor, setBilagor] = useState<Set<string>>(new Set());
  const [redigerar, setRedigerar] = useState(atgard.nyckel === 'fritt');

  const vaxlaBilaga = (id: string) =>
    setBilagor((f) => {
      const n = new Set(f);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const utanEpost = mottagare.filter((r) => !r.email).length;

  /* SKRIV-GRENEN ÄR BORTA MED "Markera betalda" (varv 6). Den bar den enda
     icke-utskicks-åtgärden och därmed den enda vakt som gällde basskrivning:
     statusvärdet "Ej relevant" får ALDRIG skrivas över av ett urval
     (föreläsnings-semantiken). Den vakten är INTE avskaffad — den följer med
     dit funktionen tar vägen, om Marcus tar "markera alla" i betalningsblocket. */

  return (
    <div className="flex flex-col gap-1 pb-3">
      {/* MEDDELANDET — mallens text visas och går att ändra (beslut 5). */}
      <div className="divide-y divide-border rounded-lg bg-surface px-3">
        <div className="flex items-center justify-between gap-4 py-2.5">
          <span className="shrink-0 text-small text-text-muted">Ämne</span>
          {redigerar ? (
            <Input
              label="Ämne"
              hideLabel
              value={amne}
              onChange={setAmne}
              className="w-full max-w-80"
            />
          ) : (
            <span className="truncate text-right text-body">{amne || '—'}</span>
          )}
        </div>
        <div className="py-2.5">
          {redigerar ? (
            <TextArea label="Meddelandetext" hideLabel value={text} onChange={setText} rows={7} />
          ) : (
            <p className="whitespace-pre-wrap text-body text-text-secondary">{text}</p>
          )}
        </div>
        <div className="py-2">
          <button
            type="button"
            onClick={() => setRedigerar(!redigerar)}
            className="flex w-full items-center justify-center gap-2 font-medium text-body"
          >
            {redigerar ? 'Klar med texten' : '✎ Ändra texten'}
          </button>
        </div>
      </div>

      <BilageValjare valda={bilagor} antalMottagare={mottagare.length} onVaxla={vaxlaBilaga} />

      {utanEpost > 0 && (
        <MessageBox intent="warning" title="Några saknar e-post">
          {utanEpost} av {mottagare.length} mottagare har ingen e-postadress och kommer att
          undertryckas av servern.
        </MessageBox>
      )}

      {/* Sändknappen: GRÖN, aldrig röd — handlingen når utomstående, och
          danger är destruktionsklassens intent (SegmentMailCompose-precedenten,
          task-18.16 grön-knapp-regeln). Oåterkalleligheten skyddas av
          granska-steget, inte av färgen. */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="text-small text-text-muted">
          Varje mottagare får sitt eget mail — ingen ser vem mer som fick det.
        </span>
        <Button intent="success" isDisabled={mottagare.length === 0}>
          Granska och skicka till {mottagare.length} mottagare
        </Button>
      </div>
    </div>
  );
}

/* ================================================================== *
 * ÅTGÄRDSMENYN — kvarstående rader, en utfälld åt gången (Marcus-val).
 * ================================================================== */
function AtgardsMeny({
  mottagare,
  oppen,
  onVaxla,
}: {
  mottagare: Registration[];
  oppen: string | null;
  onVaxla: (nyckel: string) => void;
}) {
  return (
    <DetaljGrupp id="grupp-atgard" rubrik="Åtgärd">
      {ATGARDER.map((a) => {
        const arOppen = oppen === a.nyckel;
        const iUrval = a.urvalsfilter ? mottagare.filter(a.urvalsfilter).length : mottagare.length;

        return (
          <div key={a.nyckel} className="flex flex-col">
            <div className="flex flex-col py-1.5">
              <button
                type="button"
                onClick={() => onVaxla(a.nyckel)}
                aria-expanded={arOppen}
                className={RAD_KLASS}
              >
                <NumRuta n={a.nr} />
                {a.namn}
                <span className="ml-auto flex shrink-0 items-center gap-2">
                  {iUrval !== mottagare.length && (
                    <span className="text-small text-text-secondary tabular-nums">
                      {iUrval} av {mottagare.length}
                    </span>
                  )}
                  {/* ALLA FYRA RADER FÄLLER UT HÄR sedan varv 6 — chevron ned
                      utan undantag. Den bort-ledande grenen (chevron höger) föll
                      med "Manuell anmälan", och dess semantik följde med till
                      mottagar-ytan där vägen bort numera bor. */}
                  <ChevronDown
                    aria-hidden="true"
                    size={18}
                    className={`text-text-secondary motion-safe:transition-transform ${
                      arOppen ? 'rotate-180' : ''
                    }`}
                  />
                </span>
              </button>
            </div>
            {arOppen && <ArbetsYta atgard={a} mottagare={mottagare} />}
          </div>
        );
      })}
    </DetaljGrupp>
  );
}

/* ================================================================== *
 * SIDHUVUDET — `ManuellAnmalanForm` § `Sidhuvud`, klass för klass.
 * Marcus 2026-08-07: "kopiera exakt var rubriken sitter, och strecket under,
 * det är ju likadant på de flesta sidor."
 * ================================================================== */
function Sidhuvud({ tillbakaLank }: { tillbakaLank: ReactNode }) {
  return (
    <>
      {tillbakaLank}
      <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
        <h1 className="font-semibold text-3xl">Åtgärder</h1>
      </header>
    </>
  );
}

/** Tillbaka-chevronen — rund, `bg-bg-muted`, samma mått som förlagan. */
const TILLBAKA_KLASS =
  'mx-4 flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-muted';

/* ================================================================== *
 * SIDAN
 * ================================================================== */
export function AtgardsSida({ eventId }: { eventId?: string }) {
  const dataSource = useDataSource();
  /* MARKERINGEN hon kom hit med. I skarp form levereras den av registret
     (eventdetaljens markera-läge → Åtgärder); i prototypen SEEDAS den ur
     "obekräftade eller obetalda" så ytan har något att visa, och simulerar
     därmed exakt det urval Lotta oftast gör.

     `synligaIds` är LISTANS medlemskap, `valda` är MARKERINGEN — två olika
     saker sedan varv 4. Ett avmarkerat kort ligger kvar i listan (vitt) men
     räknas inte som mottagare; det är markeringslägets grammatik, oförändrad
     från eventdetaljen. */
  const [seedad, setSeedad] = useState(false);
  const [synligaIds, setSynligaIds] = useState<ReadonlySet<string>>(() => new Set());
  const [valda, setValda] = useState<ReadonlySet<string>>(() => new Set());
  const [oppenAtgard, setOppenAtgard] = useState<string | null>(null);

  const events = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: () => dataSource.fetchEvents(),
  });

  const anmalningar = useQuery({
    queryKey: queryKeys.registrations.byEvent(eventId ?? ''),
    queryFn: () => dataSource.fetchRegistrations({ eventId }),
    enabled: eventId != null,
  });

  const valtEvent: Event | undefined = events.data?.find((e) => e.id === eventId);

  const alla = useMemo(() => anmalningar.data ?? [], [anmalningar.data]);

  // Seedningen sker EN gång, när datan landat — därefter äger Lotta urvalet.
  if (!seedad && alla.length > 0) {
    const start = new Set(alla.filter((r) => obekraftad(r) || obetald(r)).map((r) => r.id));
    setSynligaIds(start);
    setValda(start);
    setSeedad(true);
  }

  /** Korten i listan, i registrets ordning. */
  const synliga = useMemo(() => alla.filter((r) => synligaIds.has(r.id)), [alla, synligaIds]);
  /** MOTTAGARNA = de markerade. Allt nedströms räknar på dessa. */
  const mottagare = useMemo(() => synliga.filter((r) => valda.has(r.id)), [synliga, valda]);

  /* TOMT LÄGE — eventväljaren fristående som sidans enda handling.
     Samma "TVÅ TILLSTÅND, INTE TVÅ SIDOR"-form som manuell anmälan
     (task-18.18, S83 pass 4-facit; Linear/Rails-precedenten). */
  if (eventId == null) {
    return (
      <section className="flex flex-col gap-6 pt-2 lg:pt-10">
        <Sidhuvud
          tillbakaLank={
            <Link to="/hem" aria-label="Tillbaka" className={TILLBAKA_KLASS}>
              <ChevronLeft aria-hidden="true" size={26} />
            </Link>
          }
        />
        <EventValjare
          onByte={(id) => {
            window.location.href = `/event/${id}/atgarder${window.location.search}`;
          }}
        />
      </section>
    );
  }

  // Deadline-signalen: DELAD med betalningsvyn (`deadlineStatus`), aldrig en
  // andra kopia av 14-dagars-regeln. Den bor sedan varv 4 i Betalningar-
  // sektionen, där den betyder något — översta blocket bär BARA väljaren
  // (Marcus 2026-08-07: "behöver bara ha eventväljaren egentligen").
  const deadline = valtEvent ? deadlineStatus(valtEvent.startdatum) : null;

  return (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      <Sidhuvud
        tillbakaLank={
          <Link
            to="/event/$eventId"
            params={{ eventId }}
            aria-label="Tillbaka till eventet"
            className={TILLBAKA_KLASS}
          >
            <ChevronLeft aria-hidden="true" size={26} />
          </Link>
        }
      />

      {/* ÖVERSTA BLOCKET — BARA väljaren (Marcus 2026-08-07). Sammanfattningen
          och deadline-pillen som stod här i varv 3 sköt ned det Lotta kom hit
          för att se; hon vet redan vilket event hon står i, hon kommer från
          dess detaljsida. Väljaren är kvar eftersom sidan står på egna ben
          (TVÅ TILLSTÅND-formen, task-18.18). */}
      <div data-testid="eventet-block" className={KORT_KLASS}>
        <div className="py-4">
          <EventValjare
            valtEventId={eventId}
            valtEvent={valtEvent}
            onByte={(id) => {
              window.location.href = `/event/${id}/atgarder${window.location.search}`;
            }}
          />
        </div>
      </div>

      {anmalningar.isError && (
        <MessageBox intent="error" title="Kunde inte hämta anmälningarna">
          {anmalningar.error instanceof Error ? anmalningar.error.message : 'Okänt fel.'}
        </MessageBox>
      )}

      {anmalningar.isPending ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton variant="text" className="w-40 text-lg" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <>
          <MottagarYta
            eventId={eventId}
            valda={valda}
            synliga={synliga}
            alla={alla}
            onVaxla={(id, vald) =>
              setValda((nu) => {
                const n = new Set(nu);
                if (vald) n.add(id);
                else n.delete(id);
                return n;
              })
            }
            onLaggTill={(id) => {
              // Inplockad ⇒ både SYNLIG i listan och MARKERAD: hon plockade in
              // den för att skicka till den, inte för att titta på den.
              setSynligaIds((s) => new Set(s).add(id));
              setValda((s) => new Set(s).add(id));
            }}
          />

          <AtgardsMeny
            mottagare={mottagare}
            oppen={oppenAtgard}
            onVaxla={(n) => setOppenAtgard((o) => (o === n ? null : n))}
          />

          {/* BETALNINGAR — egen ingång, inte en sjunde åtgärd. Hela
              skrivvertikalen som eventsidan gav upp bor här (underlaget § 5). */}
          <section aria-labelledby="grupp-betalningar" className="flex min-w-0 flex-col gap-2">
            <h2 id="grupp-betalningar" className="px-4 font-semibold text-lg">
              Betalningar
            </h2>
            <div className={`divide-y divide-border ${KORT_KLASS}`}>
              {/* Deadline-pillen i betalningsvyns EXAKTA form (facit-bilagan
                  `facit-betalningar-arbetsytan.png`): kapsel i `bg-surface`,
                  klocka, färgen följer läget. Den bor HÄR, hos betalningarna
                  den gäller — inte i sidhuvudet där den var allmän dekor. */}
              {deadline && (
                <div className="py-3">
                  <p
                    data-testid="atgarder-deadline"
                    className={`inline-flex items-center gap-1.5 self-start rounded-full bg-surface px-2.5 py-1 text-small ${deadline.cls}`}
                  >
                    <Clock aria-hidden="true" size={14} />
                    {deadline.text}
                  </p>
                </div>
              )}
              <div className="flex flex-col py-1.5">
                <button type="button" className={RAD_KLASS}>
                  <Upload aria-hidden="true" size={16} className="shrink-0" />
                  Pricka av, notera och påminn
                  <span className="ml-auto flex shrink-0 items-center gap-2">
                    <span className="text-small text-text-secondary tabular-nums">
                      {alla.filter(obetald).length} saknar
                    </span>
                    <ChevronRight aria-hidden="true" size={18} className="text-text-secondary" />
                  </span>
                </button>
              </div>
            </div>
          </section>

          <PrototypNot />
        </>
      )}
    </section>
  );
}

/** Prototyp-not synlig i ytan så Marcus ser vad som ännu inte har datakälla. */
function PrototypNot() {
  return (
    <p className="px-4 text-small text-text-muted">
      <strong className="font-medium">Prototyp.</strong> Mallar och bilagor är stubbar —
      bilage-fundamentet (TASK-146) är inte byggt. Inget skickas, inget sparas.
    </p>
  );
}
