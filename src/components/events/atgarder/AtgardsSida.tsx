/**
 * [PROTOTYPE] [S100] ÅTGÄRDS-SIDAN — konvergens-prototyp, varv 3.
 *
 * FRÅGAN SOM BESVARAS (throwaway-kontraktet klausul i):
 *   "Hur ska åtgärds-sidan se ut — den enda platsen där något verkställs?"
 *
 * FORMEN ÄR B′ (Marcus-vald 2026-08-07): hubb med eventväljare överst,
 * PERMANENT REDIGERBAR mottagar-yta, och en åtgärdsmeny där den valda
 * åtgärden fälls ut IN-PLACE med de övriga raderna KVARSTÅENDE. Strukturen
 * stod fast genom varv 2:s underleverans — det var UTFÖRANDET som revs.
 *
 * VARV 3 RÄTTAR FYRA SAKER MARCUS PEKADE UT (2026-08-07), och alla fyra är
 * KOPIERINGAR ur befintliga ytor, inte nya påfund:
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
  Clock,
  FileText,
  Paperclip,
  Plus,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { deadlineStatus } from '@/components/events/detail/Betalningar';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { TextArea } from '@/components/primitives/TextArea';
import { displayName } from '@/components/registrations/registration-display';
import { StatusBadge } from '@/components/registrations/StatusBadge';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import { PaymentStatus, RegistrationStatus } from '@/domain/types/Status';
import { queryKeys } from '@/queries/keys';
import { DetaljGrupp, EtikettVardeRad } from '../detail/DetaljGrupp';
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
 * Initialerna för cirkeln ("AA" ur "Anna Andersson") — max två, versala.
 *
 * Tredje duplikatet, med samma motiv som `Gruppdynamik` bokförde vid det
 * andra: `PersonMiniKort`s API är FÖRSEGLAT, så formen ärvs men inte koden.
 * Med tre förekomster är hjälparen nu en verklig `lib/`-kandidat — den
 * noteras för spec-ledet i stället för att lyftas i kastbar kod.
 */
function initialer(namn: string): string {
  return namn
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((d) => d[0]?.toUpperCase() ?? '')
    .join('');
}

/* ------------------------------------------------------------------ *
 * De SEX åtgärdstyperna (underlaget § 3, Marcus-bekräftade 2026-08-07).
 *
 * `utskick: false` på manuell anmälan och markera betalda — ORDLISTA glossar
 * åtgärdsval som "(utskickstyp)", vilket är för smalt; två av sex är inte
 * utskick. Glossen skärps när sidan byggs skarpt.
 *
 * `leder: true` = raden navigerar bort (chevron höger, ärlighetsprincipen);
 * övriga fäller ut in-place (chevron ned). Distinktionen är densamma som
 * `AtgarderKort` redan gör med aria-expanded.
 * ------------------------------------------------------------------ */
type AtgardsTyp = {
  nr: number;
  nyckel: string;
  namn: string;
  utskick: boolean;
  leder?: boolean;
  /** Prototyp-stubb: mallens ämnesrad. Ingen mall-datakälla finns ännu. */
  amne?: string;
  /** Prototyp-stubb: mallens brödtext. */
  mall?: string;
  /** Vilka i urvalet åtgärden är relevant för — driver räknaren på raden. */
  urvalsfilter?: (r: Registration) => boolean;
};

const saknarAnmalningsavgift = (r: Registration) =>
  r.anmalningsavgift === PaymentStatus.EJ_MOTTAGEN;
const saknarSlutbetalning = (r: Registration) => r.slutbetalning === PaymentStatus.EJ_MOTTAGEN;
const obetald = (r: Registration) => saknarAnmalningsavgift(r) || saknarSlutbetalning(r);
const obekraftad = (r: Registration) => r.status === RegistrationStatus.OBEKRAFTAD;

const ATGARDER: AtgardsTyp[] = [
  { nr: 1, nyckel: 'manuell', namn: 'Manuell anmälan', utskick: false, leder: true },
  {
    nr: 2,
    nyckel: 'bekraftelse',
    namn: 'Bekräftelse',
    utskick: true,
    amne: 'Din plats är bekräftad',
    mall: 'Hej {förnamn},\n\nDin plats på {event} är bekräftad. Vi ses {datum} i {ort}.\n\nVarmt välkommen!\nRoger och Lotta',
    urvalsfilter: obekraftad,
  },
  {
    nr: 3,
    nyckel: 'paminnelse',
    namn: 'Betalningspåminnelse',
    utskick: true,
    amne: 'Påminnelse om betalning',
    mall: 'Hej {förnamn},\n\nVi ser att betalningen för {event} inte kommit in ännu. Sista dag är {deadline}.\n\nHör gärna av dig om något krånglar.\nRoger och Lotta',
    urvalsfilter: obetald,
  },
  {
    nr: 4,
    nyckel: 'markera-betalda',
    namn: 'Markera betalda',
    utskick: false,
    urvalsfilter: obetald,
  },
  {
    nr: 5,
    nyckel: 'eventinfo',
    namn: 'Eventinfo',
    utskick: true,
    amne: 'Information inför {event}',
    mall: 'Hej {förnamn},\n\nSnart är det dags! Här kommer praktisk information inför {event}.\n\nRoger och Lotta',
  },
  { nr: 6, nyckel: 'fritt', namn: 'Fritt utskick', utskick: true, amne: '', mall: '' },
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
 * PERSONKORTET — formen är facit, inte ett val.
 *
 * `Gruppdynamik` § `PersonKort` klass för klass (som i sin tur ärvde
 * `PersonMiniKort`s form på Marcus order 2026-08-06: "de personkorten vill jag
 * ska se ut som dem på anmälan-detaljsidan"). Två skillnader, båda av samma
 * skäl som förlagan bokförde sina:
 *
 *  · HANDLINGS-KNAPP I STÄLLET FÖR CHEVRON. Kortet leder ingenstans här — det
 *    LÄGGS TILL eller TAS BORT. En chevron hade lovat navigering som inte
 *    finns ("länk utan mål ljuger", `AnmalanDetail`s regel).
 *  · UNDERRADEN BÄR BETALNINGSSTATUS i stället för kurshistorik. Samma
 *    linjering (`pl-12` = cirkelns 36 px + gap-3:s 12 px), samma
 *    streck-grammatik, annan sanning — det är den sanning åtgärds-sidan
 *    arbetar med.
 * ================================================================== */

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
          data-testid="mottagar-statusrad"
          className="flex items-center gap-1.5 text-caption"
        >
          <span aria-hidden="true" className={`h-3.5 w-1 shrink-0 rounded-full ${r.streck}`} />
          <span className={`truncate ${r.klass}`}>{r.text}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Personkortet. `handling` är kortets enda interaktiva element — ta bort (X)
 * i mottagarlistan, lägg till (+) i plockaren.
 */
function PersonKort({
  reg,
  handling,
  testid,
}: {
  reg: Registration;
  handling: ReactNode;
  testid: string;
}) {
  const namn = displayName(reg);
  return (
    <div
      data-testid={testid}
      className="flex flex-col gap-2 rounded-xl border border-transparent bg-surface px-3 py-2.5 contrast-more:border-border-strong"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-emphasized font-semibold text-small text-text-secondary"
        >
          {initialer(namn)}
        </span>
        <span data-testid="mottagar-namn" className="min-w-0 truncate font-medium text-body">
          {namn}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-2">
          {/* Statusbadgen som saknades i varv 2. Pill-skalans `sm` (T127) —
              kort-/listmiljö, inte header. Bekräftad är NORMEN och bär inget
              märke (K16/K37: normen är tyst). */}
          {obekraftad(reg) && (
            <StatusBadge ton="warning" storlek="sm">
              Obekräftad
            </StatusBadge>
          )}
          {handling}
        </span>
      </div>
      <BetalRader reg={reg} />
    </div>
  );
}

/* ================================================================== *
 * MOTTAGAR-YTAN — permanent och redigerbar (Marcus-krav 2026-08-07:
 * "hon kanske drar in 7 stycken … men sen vill skicka tillbaka 1 person
 * och hämta in 2 nya, det ska hon kunna göra utan att lämna åtgärdssidan").
 * ================================================================== */
function MottagarYta({
  valda,
  alla,
  onTaBort,
  onLaggTill,
}: {
  valda: Registration[];
  alla: Registration[];
  onTaBort: (id: string) => void;
  onLaggTill: (id: string) => void;
}) {
  const [visaAlla, setVisaAlla] = useState(false);
  const [plockareOppen, setPlockareOppen] = useState(false);
  const [sok, setSok] = useState('');

  const SYNLIGA = 3;
  const visade = visaAlla ? valda : valda.slice(0, SYNLIGA);
  const dolda = valda.length - visade.length;

  const valdaIds = useMemo(() => new Set(valda.map((r) => r.id)), [valda]);
  const kandidater = useMemo(
    () =>
      alla
        .filter((r) => !valdaIds.has(r.id))
        .filter((r) =>
          sok.trim() === ''
            ? true
            : displayName(r).toLowerCase().includes(sok.trim().toLowerCase()) ||
              (r.email ?? '').toLowerCase().includes(sok.trim().toLowerCase()),
        ),
    [alla, valdaIds, sok],
  );

  return (
    <section aria-labelledby="grupp-mottagare" className="flex min-w-0 flex-col gap-2">
      <div className="flex items-baseline justify-between px-4">
        <h2 id="grupp-mottagare" className="font-semibold text-lg">
          Mottagare
        </h2>
        <span className="text-small text-text-secondary tabular-nums">
          {valda.length} av {alla.length}
        </span>
      </div>

      <div data-testid="mottagar-kort" className={`divide-y divide-border ${KORT_KLASS}`}>
        {valda.length === 0 ? (
          <p className="py-3 text-small text-text-secondary">
            Inga mottagare valda. Lägg till från eventet nedan.
          </p>
        ) : (
          <div className="flex flex-col gap-2 py-3">
            {visade.map((r) => (
              <PersonKort
                key={r.id}
                reg={r}
                testid="mottagar-personkort"
                handling={
                  <button
                    type="button"
                    onClick={() => onTaBort(r.id)}
                    aria-label={`Ta bort ${displayName(r)} från mottagarna`}
                    className="flex size-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-emphasized hover:text-text motion-safe:transition-colors"
                  >
                    <X aria-hidden="true" size={16} />
                  </button>
                }
              />
            ))}
          </div>
        )}

        {dolda > 0 && (
          <div className="flex flex-col py-1.5">
            <button
              type="button"
              onClick={() => setVisaAlla(true)}
              aria-expanded={false}
              className={RAD_KLASS}
            >
              <span className="text-text-secondary">+{dolda} till</span>
              <ChevronDown
                aria-hidden="true"
                size={18}
                className="ml-auto shrink-0 text-text-secondary"
              />
            </button>
          </div>
        )}

        {visaAlla && valda.length > SYNLIGA && (
          <div className="flex flex-col py-1.5">
            <button type="button" onClick={() => setVisaAlla(false)} className={RAD_KLASS}>
              <span className="text-text-secondary">Visa färre</span>
            </button>
          </div>
        )}

        {/* PLOCKAREN — hämta in fler utan att lämna sidan. */}
        <div className="flex flex-col py-1.5">
          <button
            type="button"
            onClick={() => setPlockareOppen(!plockareOppen)}
            aria-expanded={plockareOppen}
            className={RAD_KLASS}
          >
            <Plus aria-hidden="true" size={16} className="shrink-0" />
            Lägg till från eventet
            <ChevronDown
              aria-hidden="true"
              size={18}
              className={`ml-auto shrink-0 text-text-secondary motion-safe:transition-transform ${
                plockareOppen ? 'rotate-180' : ''
              }`}
            />
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
            {/* Träffarna är KORT, inte rader (Marcus 2026-08-07) — samma
                personkort som listan ovan, så en person ser likadan ut före
                och efter att hon dragits in. */}
            <div className="scrollbar-inline flex max-h-96 flex-col gap-2 overflow-auto">
              {kandidater.length === 0 ? (
                <p className="py-1 text-small text-text-muted">
                  {alla.length === valda.length
                    ? 'Alla anmälda är redan mottagare.'
                    : 'Ingen matchar sökningen.'}
                </p>
              ) : (
                kandidater.map((r) => (
                  <PersonKort
                    key={r.id}
                    reg={r}
                    testid="kandidat-personkort"
                    handling={
                      <button
                        type="button"
                        onClick={() => onLaggTill(r.id)}
                        aria-label={`Lägg till ${displayName(r)} som mottagare`}
                        className="flex size-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-emphasized hover:text-text motion-safe:transition-colors"
                      >
                        <Plus aria-hidden="true" size={18} />
                      </button>
                    }
                  />
                ))
              )}
            </div>
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
function ArbetsYta({
  atgard,
  mottagare,
  antalIUrval,
}: {
  atgard: AtgardsTyp;
  mottagare: Registration[];
  antalIUrval: number;
}) {
  const [amne, setAmne] = useState(atgard.amne ?? '');
  const [text, setText] = useState(atgard.mall ?? '');
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

  /* "Markera betalda" är ingen utskickstyp — den bär varken text eller
     bilagor, och dess vakt är en annan: statusvärdet "Ej relevant" får
     ALDRIG skrivas över av ett urval (föreläsnings-semantiken). */
  if (!atgard.utskick) {
    return (
      <div className="flex flex-col gap-3 pb-3">
        <MessageBox intent="info" title="Detta skriver i basen">
          {antalIUrval} av {mottagare.length} valda saknar betalning. Bara de markeras som betalda —
          de som redan är klara eller står som &quot;Ej relevant&quot; rörs inte.
        </MessageBox>
        <div className="flex justify-end">
          <Button intent="success" isDisabled={antalIUrval === 0}>
            Granska och markera {antalIUrval} som betalda
          </Button>
        </div>
      </div>
    );
  }

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
                onClick={() => !a.leder && onVaxla(a.nyckel)}
                aria-expanded={a.leder ? undefined : arOppen}
                className={RAD_KLASS}
              >
                <NumRuta n={a.nr} />
                {a.namn}
                <span className="ml-auto flex shrink-0 items-center gap-2">
                  {!a.leder && iUrval !== mottagare.length && (
                    <span className="text-small text-text-secondary tabular-nums">
                      {iUrval} av {mottagare.length}
                    </span>
                  )}
                  {/* Chevron-semantiken skiljer radtyperna ärligt: höger =
                      leder bort (rad 1 → manuell anmälan-sidan), ned = fäller
                      ut här. Samma distinktion AtgarderKort redan gör. */}
                  {a.leder ? (
                    <ChevronRight aria-hidden="true" size={18} className="text-text-secondary" />
                  ) : (
                    <ChevronDown
                      aria-hidden="true"
                      size={18}
                      className={`text-text-secondary motion-safe:transition-transform ${
                        arOppen ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </span>
              </button>
            </div>
            {arOppen && !a.leder && (
              <ArbetsYta atgard={a} mottagare={mottagare} antalIUrval={iUrval} />
            )}
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
  const [borttagna, setBorttagna] = useState<Set<string>>(new Set());
  const [tillagda, setTillagda] = useState<Set<string>>(new Set());
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

  /* URVALET. Från registret kommer ett startvärde; i prototypen simuleras det
     med "alla obekräftade eller obetalda" så ytan har något att visa. Lotta
     redigerar sedan fritt — borttagna/tillagda är hennes ändringar ovanpå. */
  const valda = useMemo(() => {
    const start = alla.filter((r) => obekraftad(r) || obetald(r));
    const startIds = new Set(start.map((r) => r.id));
    return alla.filter((r) => (startIds.has(r.id) || tillagda.has(r.id)) && !borttagna.has(r.id));
  }, [alla, tillagda, borttagna]);

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
  // andra kopia av 14-dagars-regeln. Den saknades helt i varv 2.
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

      {/* ÖVERSTA BLOCKET — Eventet-blockets form (18.18 punkt 2–6): rubrikfritt
          kort, väljaren överst, sammanfattning som bär bara det som påverkar
          HANDLINGEN, sekundär navigering sist. */}
      <div data-testid="eventet-block" className={`divide-y divide-border ${KORT_KLASS}`}>
        <div className="py-4">
          <EventValjare
            valtEventId={eventId}
            valtEvent={valtEvent}
            onByte={(id) => {
              window.location.href = `/event/${id}/atgarder${window.location.search}`;
            }}
          />
        </div>

        {!anmalningar.isPending && (
          <dl className="divide-y divide-border">
            <EtikettVardeRad term="Anmälda">
              <span className="tabular-nums">{alla.length}</span>
            </EtikettVardeRad>
            {alla.filter(obekraftad).length > 0 && (
              <EtikettVardeRad term="Obekräftade">
                <span className="tabular-nums">{alla.filter(obekraftad).length}</span>
              </EtikettVardeRad>
            )}
            {alla.filter(obetald).length > 0 && (
              <EtikettVardeRad term="Saknar betalning">
                <span className="tabular-nums">{alla.filter(obetald).length}</span>
              </EtikettVardeRad>
            )}
          </dl>
        )}

        {/* Deadline-pillen i betalningsvyns EXAKTA form (facit-bilagan
            `facit-betalningar-arbetsytan.png`): kapsel i `bg-surface`, klocka,
            och färgen som följer läget — lugnt/imorgon/passerad. */}
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
          <Link
            to="/event/$eventId"
            params={{ eventId }}
            className="-mx-2 flex w-auto items-center gap-2 rounded-lg px-2 py-1.5 text-left text-small text-text-secondary hover:bg-bg-emphasized motion-safe:transition-colors"
          >
            Gå till eventdetaljer
            <ChevronRight aria-hidden="true" size={16} className="ml-auto shrink-0" />
          </Link>
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
            valda={valda}
            alla={alla}
            onTaBort={(id) => {
              setBorttagna((s) => new Set(s).add(id));
              setTillagda((s) => {
                const n = new Set(s);
                n.delete(id);
                return n;
              });
            }}
            onLaggTill={(id) => {
              setTillagda((s) => new Set(s).add(id));
              setBorttagna((s) => {
                const n = new Set(s);
                n.delete(id);
                return n;
              });
            }}
          />

          <AtgardsMeny
            mottagare={valda}
            oppen={oppenAtgard}
            onVaxla={(n) => setOppenAtgard((o) => (o === n ? null : n))}
          />

          {/* BETALNINGAR — egen ingång, inte en sjunde åtgärd. Hela
              skrivvertikalen som eventsidan gav upp bor här (underlaget § 5). */}
          <section aria-labelledby="grupp-betalningar" className="flex min-w-0 flex-col gap-2">
            <h2 id="grupp-betalningar" className="px-4 font-semibold text-lg">
              Betalningar
            </h2>
            <div className={KORT_KLASS}>
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
