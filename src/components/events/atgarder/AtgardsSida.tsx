/**
 * [PROTOTYPE] [S100] ÅTGÄRDS-SIDAN — konvergens-prototyp, variant `a`.
 *
 * FRÅGAN SOM BESVARAS (throwaway-kontraktet klausul i):
 *   "Hur ska åtgärds-sidan se ut — den enda platsen där något verkställs?"
 *
 * FORMEN ÄR B′ (Marcus-vald 2026-08-07): hubb med eventväljare överst,
 * PERMANENT REDIGERBAR mottagar-yta, och en åtgärdsmeny där den valda
 * åtgärden fälls ut IN-PLACE med de övriga raderna KVARSTÅENDE.
 *
 * DIVERGENS-PASSET ÄR MEDVETET RIVET. Grillad samsyn S93 beslut 8 föreskrev
 * tre varianter; Marcus rev det 2026-08-07 med motiveringen att appen redan
 * bär tillräckligt många låsta facit för att grammatiken ska vara känd — tre
 * radikalt olika varianter mot en känd grammatik hade gjort två av dem döda
 * vid ankomst. I stället visades TRE STRUKTURSKISSER i text, Marcus valde B,
 * och den byggs som EN variant. Rivningen är öppen, inte tyst: den bokförs i
 * `docs/specs/ATGARDSSIDAN-UNDERLAG.md` § 9 och i `TASK-147`.
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
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Paperclip,
  Plus,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { TextArea } from '@/components/primitives/TextArea';
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

const KORT_KLASS =
  'rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong';

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

const obetald = (r: Registration) =>
  r.anmalningsavgift === PaymentStatus.EJ_MOTTAGEN || r.slutbetalning === PaymentStatus.EJ_MOTTAGEN;
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

/* ------------------------------------------------------------------ *
 * Hjälpare
 * ------------------------------------------------------------------ */
function visningsNamn(r: Registration): string {
  return r.namn ?? [r.fornamn, r.efternamn].filter(Boolean).join(' ') ?? 'Namn saknas';
}

function mottagarOrd(n: number): string {
  return n === 1 ? 'mottagare' : 'mottagare';
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
            : visningsNamn(r).toLowerCase().includes(sok.trim().toLowerCase()) ||
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
        {valda.length === 0 && (
          <p className="py-3 text-small text-text-secondary">
            Inga mottagare valda. Lägg till från eventet nedan.
          </p>
        )}

        {visade.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 py-3">
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-body">{visningsNamn(r)}</span>
              <span className="truncate text-small text-text-muted">
                {r.email ?? 'E-post saknas'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onTaBort(r.id)}
              aria-label={`Ta bort ${visningsNamn(r)} från mottagarna`}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-bg-emphasized hover:text-text motion-safe:transition-colors"
            >
              <X aria-hidden="true" size={16} />
            </button>
          </div>
        ))}

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
          <div className="flex flex-col gap-2 py-3">
            <Input
              label="Sök deltagare"
              value={sok}
              onChange={setSok}
              placeholder="Namn eller e-post…"
            />
            <div className="scrollbar-inline max-h-64 divide-y divide-border overflow-auto rounded-lg bg-surface">
              {kandidater.length === 0 ? (
                <p className="px-3 py-3 text-small text-text-muted">
                  {alla.length === valda.length
                    ? 'Alla anmälda är redan mottagare.'
                    : 'Ingen matchar sökningen.'}
                </p>
              ) : (
                kandidater.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onLaggTill(r.id)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-bg-muted motion-safe:transition-colors"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium text-body">{visningsNamn(r)}</span>
                      <span className="truncate text-small text-text-muted">
                        {r.email ?? 'E-post saknas'}
                      </span>
                    </span>
                    <Plus aria-hidden="true" size={16} className="shrink-0 text-text-secondary" />
                  </button>
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
          Granska och skicka till {mottagare.length} {mottagarOrd(mottagare.length)}
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
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6">
        <h1 className="font-semibold text-3xl">Åtgärder</h1>
        <p className="text-body text-text-secondary">Välj vilket event du vill göra åtgärder på.</p>
        <EventValjare
          onByte={(id) => {
            window.location.href = `/event/${id}/atgarder${window.location.search}`;
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-semibold text-3xl">Åtgärder</h1>
        <EventValjare
          valtEventId={eventId}
          valtEvent={valtEvent}
          onByte={(id) => {
            window.location.href = `/event/${id}/atgarder${window.location.search}`;
          }}
        />
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
    </div>
  );
}

/** Prototyp-not synlig i ytan så Marcus ser vad som ännu inte har datakälla. */
function PrototypNot() {
  return (
    <div className={`${KORT_KLASS} py-1`}>
      <EtikettVardeRad term="Prototyp">
        <span className="text-small text-text-muted">
          Mallar och bilagor är stubbar — bilage-fundamentet (TASK-146) är inte byggt. Inget
          skickas, inget sparas.
        </span>
      </EtikettVardeRad>
    </div>
  );
}
