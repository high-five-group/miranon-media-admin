/**
 * [PROTOTYPE] S104 divergens — VARIANT B: PUBLIKEN FÖRST. KASTBAR KOD.
 *
 * SVARET DENNA VARIANT GER: "du tittar på MÄNNISKOR hela tiden; filtret formar
 * vilka." Den primära handlingen är att SE OCH BESKÄRA PUBLIKEN. Listan av
 * personer ÄR sidan; regeln är ett filter över den.
 *
 * Detta är den variant som prövar funktionsfyndet STRUKTURELLT: handplockning
 * blir inte ett undantag utan formens naturliga konsekvens. Den är därmed den
 * starkaste prövningen av om en ADR-064-revision är värd att göra.
 *
 * Fullständig märkning, frågan och det bindande premissunderlaget:
 * `src/components/segment/SegmentPrototyp.tsx` +
 * `tasks/sessions/bilagor/s104-segment-divergens/DUKNING.md`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * VARIANTENS TRE DESIGNSVAR (det Marcus ska döma)
 *
 * 1. FULL-WALKEN FÅR INTE HAMRAS — OCH PUBLIKEN FÅR ÄNDÅ ALDRIG FÖRSVINNA.
 *    `compute-segment` går igenom hela `Deltaganden` (~1012 rader). Den kan
 *    därför inte anropas per tangenttryck. Fyra mekanismer förenar det med
 *    "publiken syns alltid":
 *      (a) SETTLE-FÖNSTER (900 ms): filterpanelen redigerar ett UTKAST; den
 *          aktiva regeln följer efter när handen stannat. Att dra igenom fyra
 *          pillar kostar EN walk, inte fyra.
 *      (b) SIGNATUR-CACHE: query-nyckeln ÄR regelns signatur och `staleTime`
 *          är oändlig i prototypen. Att ångra ett val och gå tillbaka kostar
 *          NOLL anrop — svaret ligger kvar.
 *      (c) `keepPreviousData`: listan TÖMS ALDRIG under en omräkning. Den
 *          gamla publiken står kvar, dämpad, med "Uppdaterar publiken…" —
 *          en spinner mitt på sidan hade rivit hela variantens premiss.
 *      (d) VISNINGSFILTER OCH SÖK ÄR GRATIS: "Får mailet / Undertrycks" och
 *          sökfältet arbetar på datan som redan ligger i klienten. Noll walk.
 *    Mätvärdet visas öppet i panelfoten (serveranrop den här sessionen) — en
 *    prototyp som gör anspråk på kostnadskontroll ska kunna granskas på det.
 *
 * 2. SKALAN (85+ personer). Formen bär det INTE genom att man scrollar:
 *      · sammanfattningsraden svarar på "hur ser publiken ut" utan att man
 *        läser en enda rad (antal · får mailet · undertrycks),
 *      · sök inuti publiken är den primära vägen till EN person,
 *      · visningsfiltret isolerar avvikelserna (de undertryckta) direkt,
 *      · listan är chunkad (25 åt gången) så DOM:en är liten — men HELA
 *        publiken skrivs ut på papper (dolda rader är `hidden print:flex`),
 *      · initialgrupper med riktiga `<h2>` ger listan rytm och hoppunkter.
 *    ÄRLIG SVAGHET, ej bortdesignad: att handplocka ~40 av 85 är tråkigt i
 *    VILKEN form som helst. Formen är byggd för att beskära i marginalen
 *    (ta bort några, lägga till några), inte för att bygga en publik för hand.
 *
 * 3. HANDPLOCKNINGEN ÄR FORMENS NATURLIGA KONSEKVENS — OCH GÅR INTE ATT SPARA.
 *    När listan ÄR sidan blir "ta bort den här" och "lägg till henne" de mest
 *    självklara handlingarna på skärmen. Prototypen bygger dem fullt ut mot
 *    verklig data (`listPersons` för plockaren) — och redovisar samtidigt,
 *    öppet i UI:t, att de inte går att persistera i dag (`ADR-064`, DUKNING § 7).
 *    Det är variantens tes, inte dess buggrapport.
 *
 * READ-ONLY FÖRSTÄRKT: `saveSegment`, `sendEmail` och testmail är no-op-stubbar.
 * Ingen kod nedan når en mutation — varken mot prod eller staging.
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Check, ChevronLeft, Filter, Printer, UserPlus } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Button as AriaButton, Checkbox, Disclosure, DisclosurePanel } from 'react-aria-components';
import { DetaljGrupp } from '@/components/events/detail/DetaljGrupp';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { TextArea } from '@/components/primitives/TextArea';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import { StatusBadge } from '@/components/registrations/StatusBadge';
import { useDataSource } from '@/data/useDataSource';
import type { Par, SegmentMember, SegmentRule } from '@/domain/schemas';
import { deriveTaxonomy, labelForPar, parKey } from '@/lib/segment-taxonomy';

/* ═══════════════════════════════════════════════════════════════════════════
   MODELL — regel, publik, mail-läge
   ═══════════════════════════════════════════════════════════════════════════ */

/** Ett taxonomi-pars tre lägen i filtret. `ingen` = paret rör inte regeln. */
type Val = 'med' | 'utan' | 'ingen';

/** Visningsfiltret ÖVER den hämtade publiken — helt klient-lokalt, noll walk. */
type Vy = 'alla' | 'far' | 'undertryckt';

const TOM_REGEL: SegmentRule = { include: [], exclude: [] };

/** Settle-fönstret: handen måste stanna så här länge innan en walk beställs. */
const SETTLE_MS = 900;

/** Chunk-steget i listan (DOM:en hålls liten; papperet får allt ändå). */
const CHUNK = 25;

/** Deterministisk regel-signatur → query-nyckel OCH utkast/aktiv-jämförelse. */
function regelSignatur(rule: SegmentRule): string {
  const nycklar = (pars: Par[]) => pars.map(parKey).sort();
  return JSON.stringify({ include: nycklar(rule.include), exclude: nycklar(rule.exclude) });
}

/**
 * Mottagar-läget per person. SERVERN ÄGER SANNINGEN vid faktiskt utskick
 * (`send-email` löser mottagare ur segmentet och kör sitt eget consent-filter,
 * T50-lager b) — det här är listans ÄRLIGA FÖRHANDSBESKED, inte ett facit.
 * Ordningen "saknar e-post före tackat nej" är prototypens val: utan adress
 * finns ingen leverans att ge eller neka.
 */
type MailLage = 'far' | 'ingen-epost' | 'tackat-nej';

function mailLage(m: SegmentMember): MailLage {
  if (!m.email) return 'ingen-epost';
  if (m.ejGodkandMail) return 'tackat-nej';
  return 'far';
}

/** Visningsnamn — Personer.Namn är ett formelfält och kan vara tomt. */
function visatNamn(m: SegmentMember): string {
  return m.namn?.trim() || '(namn saknas)';
}

/** Förnamnet ur det visade namnet — platshållar-ifyllningen i förhandsvisningen. */
function fornamn(m: SegmentMember): string {
  return visatNamn(m).split(' ')[0] ?? '';
}

/** Initialgruppens bokstav; namnlösa och siffror hamnar under "#". */
function initial(m: SegmentMember): string {
  const n = m.namn?.trim();
  if (!n) return '#';
  const b = n[0]?.toLocaleUpperCase('sv-SE') ?? '#';
  return /[A-ZÅÄÖ]/.test(b) ? b : '#';
}

/**
 * Fyller `{förnamn}`/`{namn}` ur EN NAMNGIVEN MOTTAGARE och rapporterar det som
 * INTE kunde fyllas. Ärvt mönster från `AtgardsSida.tsx` (`fyllPlatshallare`,
 * forskningsgrundat i `docs/research/mottagar-preview-monster-2026-08-07.md`):
 * en förhandsvisning som visar `Hej {förnamn},` visar inte det mottagaren ser.
 * Ofyllda platshållare är granskningens skarpaste fynd — de går ut ordagrant.
 */
function fyllPlatshallare(
  text: string,
  mottagare?: SegmentMember,
): {
  text: string;
  ofyllda: string[];
} {
  const fyllt = mottagare
    ? text.replaceAll('{förnamn}', fornamn(mottagare)).replaceAll('{namn}', visatNamn(mottagare))
    : text;
  const kvar = [...new Set(fyllt.match(/\{[^}]+\}/g) ?? [])];
  return { text: fyllt, ofyllda: kvar };
}

const LANGDATUM = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/* ── SKALPROVET ────────────────────────────────────────────────────────────
   Uppdragets svåra fråga är om formen bär 85+ personer. Staging-basen kan inte
   svara på den: den aktiva närvaron ger tvåsiffriga publiker i bästa fall
   (mätt 2026-08-10: 2 personer på tre valda par). Att PÅSTÅ att formen skalar
   utan att kunna visa det vore precis den sortens obelagda anspråk uppdraget
   säger att man inte får göra.

   Därför finns skalprovet: en AVSTÄNGD-SOM-DEFAULT växel som fyller publiken
   med tydligt påhittade personer upp till 85, så att listans rytm, chunkningen,
   initialgrupperna, söket och beskär-läget kan bedömas i den storlek de är
   byggda för. Det är ett INSTRUMENT, inte data — och det säger det själv, i en
   varningsrad som inte går att missa. Rivs med prototypen. */
const SKALPROV_MAL = 85;
const SKALPROV_FORNAMN = [
  'Anna',
  'Bengt',
  'Cecilia',
  'David',
  'Elin',
  'Fredrik',
  'Gunilla',
  'Håkan',
  'Ingrid',
  'Johan',
  'Karin',
  'Lars',
  'Maria',
  'Niklas',
  'Olga',
  'Per',
  'Quintus',
  'Rebecka',
  'Sven',
  'Tova',
  'Ulf',
  'Vera',
  'Wilma',
  'Yvonne',
  'Zara',
  'Åsa',
  'Ärling',
  'Örjan',
];
const SKALPROV_EFTERNAMN = [
  'Andersson',
  'Bergström',
  'Carlsson',
  'Dahl',
  'Ek',
  'Forsberg',
  'Gustafsson',
  'Hedlund',
  'Isaksson',
  'Jonsson',
  'Karlsson',
  'Lind',
];

/**
 * Deterministiskt utfyllda exempelpersoner. Var sjunde saknar e-post och var
 * elfte har tackat nej — så att de undertryckta faktiskt finns att titta på i
 * listan, i visningsfiltret och i granskningens varningar.
 */
function byggSkalprov(befintliga: number): SegmentMember[] {
  const ut: SegmentMember[] = [];
  for (let i = befintliga; i < SKALPROV_MAL; i += 1) {
    const f = SKALPROV_FORNAMN[i % SKALPROV_FORNAMN.length] ?? 'Exempel';
    const e = SKALPROV_EFTERNAMN[(i * 5) % SKALPROV_EFTERNAMN.length] ?? 'Person';
    const utanEpost = i % 7 === 3;
    ut.push({
      id: `skalprov-${i}`,
      namn: `${f} ${e}`,
      email: utanEpost ? null : `${`${f}.${e}`.toLowerCase()}@exempel.invalid`,
      ejGodkandMail: i % 11 === 5,
    });
  }
  return ut;
}

/* Ytklasser — en form, återanvänd. Kortytan speglar `DetaljGrupp`s tonala kort
   och personraden `MarkerbartKort`s (Deltagare.tsx) yta/radie. */
const RAD_BAS = 'flex items-center gap-3 rounded-xl border px-4 py-3 text-body';
const KAPSEL =
  'inline-flex shrink-0 items-center gap-1.5 rounded-full bg-bg-muted px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized motion-safe:transition-colors';

/* ═══════════════════════════════════════════════════════════════════════════
   VARIANT B — tillstånd och data för BÅDA vyerna (publik · utskick)
   ═══════════════════════════════════════════════════════════════════════════ */

export function VariantB() {
  const dataSource = useDataSource();

  /* ── Regeln som UTKAST (panelen) och som AKTIV (det som får kosta en walk) ── */
  const [urval, setUrval] = useState<Record<string, Val>>({});
  const [aktivRegel, setAktivRegel] = useState<SegmentRule>(TOM_REGEL);

  const events = useQuery({
    queryKey: ['proto-b', 'events'],
    queryFn: () => dataSource.fetchEvents(),
  });

  const taxonomi = useMemo(() => (events.data ? deriveTaxonomy(events.data) : []), [events.data]);

  const utkastRegel = useMemo<SegmentRule>(() => {
    const include: Par[] = [];
    const exclude: Par[] = [];
    for (const par of taxonomi) {
      const val = urval[parKey(par)];
      if (val === 'med') include.push(par);
      else if (val === 'utan') exclude.push(par);
    }
    return { include, exclude };
  }, [taxonomi, urval]);

  const utkastSig = regelSignatur(utkastRegel);
  const aktivSig = regelSignatur(aktivRegel);

  // SETTLE-FÖNSTRET (designsvar 1a). Varje ändring startar om timern; bara den
  // regel handen LANDAT på beställer en walk. Effekten är hela skälet till att
  // filtret kan vara live utan Apply-knapp trots att datan bor på servern —
  // EventsLists live-filter har sin data i klienten och har inte det problemet.
  useEffect(() => {
    if (utkastSig === aktivSig) return;
    const t = setTimeout(() => setAktivRegel(utkastRegel), SETTLE_MS);
    return () => clearTimeout(t);
  }, [utkastSig, aktivSig, utkastRegel]);

  /* ── Walken ──────────────────────────────────────────────────────────────
     Nyckeln ÄR signaturen (designsvar 1b): ett återbesök i regelrymden är
     gratis. `keepPreviousData` (1c) gör att publiken står kvar under bytet. */
  const walkar = useRef(0);
  const [walkAntal, setWalkAntal] = useState(0);
  const publik = useQuery({
    queryKey: ['proto-b', 'compute-segment', aktivSig],
    queryFn: () => {
      walkar.current += 1;
      setWalkAntal(walkar.current);
      return dataSource.computeSegment(aktivRegel);
    },
    enabled: aktivRegel.include.length > 0,
    staleTime: Number.POSITIVE_INFINITY,
    placeholderData: keepPreviousData,
    retry: false,
  });

  /* ── Handplockningen (designsvar 3) ───────────────────────────────────── */
  const [bortplockade, setBortplockade] = useState<ReadonlySet<string>>(() => new Set());
  const [tillagda, setTillagda] = useState<SegmentMember[]>([]);

  const raMedlemmar = useMemo(() => publik.data?.members ?? [], [publik.data]);

  // SANERINGEN (samma skäl som `useMarkeringsLage` i Deltagare.tsx): regeln
  // byts under arbetet och kandidatmängden krymper. Ett borttagnings-urval som
  // pekar på personer utanför den nya publiken räknar fel i sammanfattningen.
  const medlemsNyckel = raMedlemmar.map((m) => m.id).join('|');
  useEffect(() => {
    const kvar = new Set(medlemsNyckel === '' ? [] : medlemsNyckel.split('|'));
    setBortplockade((nu) => {
      if (nu.size === 0) return nu;
      const sanerat = new Set([...nu].filter((id) => kvar.has(id)));
      return sanerat.size === nu.size ? nu : sanerat;
    });
  }, [medlemsNyckel]);

  /** [PROTOTYP-INSTRUMENT] Skalprovet — se `byggSkalprov`. Av som default. */
  const [skalprov, setSkalprov] = useState(false);

  /** Publiken i sin helhet — regelns medlemmar plus de handplockade. */
  const helaPubliken = useMemo(() => {
    const basIds = new Set(raMedlemmar.map((m) => m.id));
    const extra = tillagda.filter((t) => !basIds.has(t.id));
    const fyllnad =
      skalprov && raMedlemmar.length > 0 ? byggSkalprov(raMedlemmar.length + extra.length) : [];
    return [...raMedlemmar, ...extra, ...fyllnad].sort((a, b) =>
      visatNamn(a).localeCompare(visatNamn(b), 'sv'),
    );
  }, [raMedlemmar, tillagda, skalprov]);

  /** Den FAKTISKA publiken — det som räknas, skickas och skrivs ut. */
  const slutligPublik = useMemo(
    () => helaPubliken.filter((m) => !bortplockade.has(m.id)),
    [helaPubliken, bortplockade],
  );

  const antalFar = slutligPublik.filter((m) => mailLage(m) === 'far').length;
  const antalUndertryckta = slutligPublik.length - antalFar;
  const harHandplock = bortplockade.size > 0 || tillagda.length > 0;

  /* ── Utskicks-utkastet (bor här så vägen fram och tillbaka inte tappar det) ── */
  const [lage, setLage] = useState<'publik' | 'utskick'>('publik');
  const [amne, setAmne] = useState('Ny kursomgång i höst');
  const [mailtext, setMailtext] = useState(
    'Hej {förnamn},\n\nVi öppnar anmälan till höstens omgång nu på fredag. Du som gått med oss tidigare får den här första.\n\nVarmt välkommen,\nLotta',
  );

  const gemensamt = {
    slutligPublik,
    helaPubliken,
    bortplockade,
    setBortplockade,
    antalFar,
    antalUndertryckta,
    harHandplock,
  };

  if (lage === 'utskick') {
    return (
      <UtskicksVy
        {...gemensamt}
        amne={amne}
        setAmne={setAmne}
        mailtext={mailtext}
        setMailtext={setMailtext}
        onTillbaka={() => setLage('publik')}
      />
    );
  }

  return (
    <PublikVy
      {...gemensamt}
      taxonomi={taxonomi}
      urval={urval}
      setUrval={setUrval}
      aktivRegel={aktivRegel}
      raknarOm={utkastSig !== aktivSig || publik.isFetching}
      laddarForsta={events.isPending || (publik.isPending && aktivRegel.include.length > 0)}
      fel={events.isError ? events.error : publik.isError ? publik.error : null}
      walkAntal={walkAntal}
      tillagda={tillagda}
      setTillagda={setTillagda}
      skalprov={skalprov}
      setSkalprov={setSkalprov}
      onAtgarder={() => setLage('utskick')}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PUBLIK-VYN — sidan ÄR listan
   ═══════════════════════════════════════════════════════════════════════════ */

type PublikVyProps = {
  slutligPublik: SegmentMember[];
  helaPubliken: SegmentMember[];
  bortplockade: ReadonlySet<string>;
  setBortplockade: React.Dispatch<React.SetStateAction<ReadonlySet<string>>>;
  antalFar: number;
  antalUndertryckta: number;
  harHandplock: boolean;
  taxonomi: Par[];
  urval: Record<string, Val>;
  setUrval: React.Dispatch<React.SetStateAction<Record<string, Val>>>;
  aktivRegel: SegmentRule;
  raknarOm: boolean;
  laddarForsta: boolean;
  fel: unknown;
  walkAntal: number;
  tillagda: SegmentMember[];
  setTillagda: React.Dispatch<React.SetStateAction<SegmentMember[]>>;
  skalprov: boolean;
  setSkalprov: React.Dispatch<React.SetStateAction<boolean>>;
  onAtgarder: () => void;
};

function PublikVy({
  slutligPublik,
  helaPubliken,
  bortplockade,
  setBortplockade,
  antalFar,
  antalUndertryckta,
  harHandplock,
  taxonomi,
  urval,
  setUrval,
  aktivRegel,
  raknarOm,
  laddarForsta,
  fel,
  walkAntal,
  tillagda,
  setTillagda,
  skalprov,
  setSkalprov,
  onAtgarder,
}: PublikVyProps) {
  const rubrikRef = useRef<HTMLHeadingElement>(null);
  const filterKnappRef = useRef<HTMLButtonElement>(null);
  const annonserad = useRef(false);
  const [filterOppen, setFilterOppen] = useState(false);
  const [vy, setVy] = useState<Vy>('alla');
  const [sok, setSok] = useState('');
  const [visade, setVisade] = useState(CHUNK);
  const [beskarLage, setBeskarLage] = useState(false);
  const [plockareOppen, setPlockareOppen] = useState(false);
  const plockarId = useId();

  // Fokusflytt till <h1> när taxonomin landat (identiskt mönster i minst fem vyer).
  useEffect(() => {
    if (taxonomi.length > 0 && !annonserad.current) {
      annonserad.current = true;
      rubrikRef.current?.focus();
    }
  }, [taxonomi.length]);

  const aktivaVal = taxonomi.filter((p) => {
    const v = urval[parKey(p)];
    return v === 'med' || v === 'utan';
  }).length;

  const regelValdes = aktivRegel.include.length > 0;

  /* I BESKÄR-LÄGET står de borttagna kvar i listan (dämpade, med kryssruta i
     av-läge) så att ångra är ETT klick bort. Utanför läget är de borta —
     publiken är det den är. */
  const grund = beskarLage ? helaPubliken : slutligPublik;

  const sokTerm = sok.trim().toLocaleLowerCase('sv-SE');
  const synliga = useMemo(
    () =>
      grund
        .filter((m) => {
          if (vy === 'far') return mailLage(m) === 'far';
          if (vy === 'undertryckt') return mailLage(m) !== 'far';
          return true;
        })
        .filter((m) =>
          sokTerm === ''
            ? true
            : visatNamn(m).toLocaleLowerCase('sv-SE').includes(sokTerm) ||
              (m.email ?? '').toLocaleLowerCase('sv-SE').includes(sokTerm),
        ),
    [grund, vy, sokTerm],
  );

  // Chunken nollställs när underlaget byter karaktär — annars sitter "Visa 25
  // till" och pekar på en lista som inte finns längre.
  const underlagsNyckel = `${regelSignatur(aktivRegel)}|${vy}|${sokTerm}`;
  const forraUnderlaget = useRef(underlagsNyckel);
  useEffect(() => {
    if (forraUnderlaget.current === underlagsNyckel) return;
    forraUnderlaget.current = underlagsNyckel;
    setVisade(CHUNK);
  }, [underlagsNyckel]);

  /** Initialgrupper över HELA `synliga`; chunken döljer rader, papperet visar dem. */
  const grupper = useMemo(() => {
    const ut: { bokstav: string; rader: { m: SegmentMember; index: number }[] }[] = [];
    synliga.forEach((m, index) => {
      const b = initial(m);
      const sist = ut.at(-1);
      if (sist && sist.bokstav === b) sist.rader.push({ m, index });
      else ut.push({ bokstav: b, rader: [{ m, index }] });
    });
    return ut;
  }, [synliga]);

  const rensaFilter = () => {
    setUrval({});
    filterKnappRef.current?.focus();
  };

  const regelKlartext =
    aktivRegel.include.length === 0
      ? null
      : `Med: deltog i ${aktivRegel.include.map(labelForPar).join(' ELLER ')}.${
          aktivRegel.exclude.length > 0
            ? ` Utan: deltog i ${aktivRegel.exclude.map(labelForPar).join(' ELLER ')}.`
            : ''
        }`;

  /* ── Sammanfattningen: sidans grundinformation, ALLTID synlig ───────────── */
  const sammanfattning = (
    <div className="flex flex-col gap-1 px-4">
      <div
        aria-live="polite"
        aria-atomic="true"
        aria-busy={raknarOm}
        className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 ${
          raknarOm ? 'text-text-muted' : ''
        }`}
      >
        {laddarForsta ? (
          <Skeleton variant="number" className="text-3xl" />
        ) : !regelValdes ? (
          <span className="font-semibold text-2xl">Ingen publik vald ännu</span>
        ) : (
          <>
            <span className="font-semibold text-3xl tabular-nums">{slutligPublik.length}</span>
            {/* Explicit mellanslag: flex-gapet skiljer dem visuellt, men utan
                tecknet läser skärmläsaren "85personer" (mätt i DOM-utdraget). */}{' '}
            <span className="text-lg">
              {slutligPublik.length === 1 ? 'person' : 'personer'} i publiken
            </span>
          </>
        )}
        {raknarOm && regelValdes && <span className="text-small">· Uppdaterar publiken…</span>}
      </div>

      {regelValdes && !laddarForsta && slutligPublik.length > 0 && (
        <p className="text-small text-text-secondary">
          <strong className="font-semibold tabular-nums">{antalFar}</strong> får mailet ·{' '}
          <strong className="font-semibold tabular-nums">{antalUndertryckta}</strong> undertrycks
          (saknar e-post eller har tackat nej)
        </p>
      )}

      {/* Klartext-speglingen (Gunilla): regeln som läsbar svenska, direkt under
          talet den formade. Den står HÄR och inte i filterpanelen, eftersom
          panelen är stängd för det mesta — och man ska aldrig behöva öppna ett
          filter för att veta vad man tittar på. */}
      {regelKlartext && <p className="text-small text-text-muted">{regelKlartext}</p>}
    </div>
  );

  /* ── Filterraden: visningsfilter (gratis) + tratt mot regeln (kostar walk) ── */
  const filterRad = (
    <Disclosure
      isExpanded={filterOppen}
      onExpandedChange={setFilterOppen}
      className="flex flex-col px-4 print:hidden"
    >
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <ToggleButtonGroup<Vy>
            label="Visa i publiken"
            spread
            selectedKey={vy}
            onSelectionChange={setVy}
          >
            <ToggleButton id="alla">Alla</ToggleButton>
            <ToggleButton id="far">Får mailet</ToggleButton>
            <ToggleButton id="undertryckt">Undertrycks</ToggleButton>
          </ToggleButtonGroup>
        </div>
        {/* Tratt-ingången i EventsLists exakta grammatik: öppen/aktiv bär
            bg-text-svärtan, badgen är dekor (aria-hidden) och sr-only-namnet
            bär antalet — ett aktivt filter måste synas med STÄNGD panel. */}
        <AriaButton
          ref={filterKnappRef}
          slot="trigger"
          className={`relative inline-flex shrink-0 items-center justify-center rounded-full p-2.5 motion-safe:transition-colors ${
            filterOppen || aktivaVal > 0
              ? 'bg-text text-text-inverse'
              : 'bg-bg-muted hover:bg-bg-emphasized'
          }`}
        >
          <Filter aria-hidden="true" size={18} className="shrink-0" />
          {aktivaVal > 0 ? (
            <span
              aria-hidden="true"
              className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-medium text-[10px] text-text-inverse"
            >
              {aktivaVal}
            </span>
          ) : null}
          <span className="sr-only">
            {filterOppen ? 'Dölj filter' : 'Visa filter'}
            {aktivaVal > 0 ? `, ${aktivaVal} ${aktivaVal === 1 ? 'aktivt' : 'aktiva'} val` : ''}
          </span>
        </AriaButton>
      </div>

      <DisclosurePanel>
        {/* Visuella stilar på en INRE wrapper — stängd panel döljs med
            hidden="until-found" och panelelementets egen bakgrund hade annars
            renderat som en tom grå rand (EventsLists mätta fix). */}
        <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-bg-muted p-4">
          <Input
            label="Sök i publiken"
            hideLabel
            placeholder="Sök namn eller e-post i publiken…"
            value={sok}
            onChange={setSok}
            size="sm"
            description="Söker i den redan hämtade publiken - kostar inget serveranrop."
          />

          <div className="flex flex-col gap-2">
            <span className="font-medium text-small text-text-secondary">
              Vilka kurser formar publiken
            </span>
            {taxonomi.length === 0 ? (
              <p className="text-small text-text-muted">Inga kurser i taxonomin än.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {taxonomi.map((par) => {
                  const key = parKey(par);
                  return (
                    <li
                      key={key}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5"
                    >
                      {/* labelForPar bär fälla-35-disambigueringen (naket
                          "Resor i medvetandet" ≠ RIM 1/2/3) — taxonomin
                          kopieras aldrig, den återanvänds. */}
                      <span className="min-w-0 flex-1 text-small">{labelForPar(par)}</span>
                      {/* `bg-surface` LYFTER kapseln mot panelens tonala botten
                          — utan den försvinner pill-gruppens egen bg-bg-muted
                          rakt in i panelen och tre valbara lägen läser som tre
                          textord (fångat i renderingspasset). Samma lyft som
                          Skriv ut-kapseln i panelfoten. */}
                      <ToggleButtonGroup<Val>
                        label={`Hur ${labelForPar(par)} påverkar publiken`}
                        className="bg-surface"
                        selectedKey={urval[key] ?? 'ingen'}
                        onSelectionChange={(v) => setUrval((s) => ({ ...s, [key]: v }))}
                      >
                        <ToggleButton id="med" size="sm">
                          Med
                        </ToggleButton>
                        <ToggleButton id="utan" size="sm">
                          Utan
                        </ToggleButton>
                        {/* Tankstrecket är ett SYNLIGT tecken utan uttalbart
                            namn — aria-label bär semantiken, glyfen är dekor
                            (primitivens ikon-pill-mönster, spec §16). */}
                        <ToggleButton id="ingen" size="sm" aria-label="Påverkar inte publiken">
                          <span aria-hidden="true">-</span>
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-border-light border-t pt-3">
            <span className="text-small text-text-secondary">
              Visar {synliga.length} av {slutligPublik.length} personer
            </span>
            <div className="flex items-center gap-2">
              {aktivaVal > 0 ? (
                <AriaButton
                  onPress={rensaFilter}
                  className="rounded-full px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized motion-safe:transition-colors"
                >
                  Rensa filter
                </AriaButton>
              ) : null}
              <AriaButton onPress={() => window.print()} className={`${KAPSEL} bg-surface`}>
                <Printer aria-hidden="true" size={18} className="shrink-0" />
                Skriv ut
              </AriaButton>
            </div>
          </div>

          {/* [PROTOTYP-MÄTNING] Variantens centrala anspråk är att publiken kan
              vara ständigt synlig UTAN att full-walken hamras. Anspråket ska gå
              att granska, inte bara tros på. */}
          <p className="text-caption text-text-muted">
            Publiken hämtas när du slutat ändra ({SETTLE_MS} ms). Ett redan hämtat urval visas
            direkt utan nytt anrop. Serveranrop den här sessionen:{' '}
            <strong className="tabular-nums">{walkAntal}</strong>.
          </p>

          {/* [PROTOTYP-INSTRUMENT] Skalprovet — se `byggSkalprov`. */}
          <div className="flex flex-col gap-1 border-border-light border-t pt-3">
            <Checkbox
              isSelected={skalprov}
              onChange={setSkalprov}
              className="group flex cursor-pointer items-center gap-3 text-small"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded border border-(--mm-input-border) bg-(--mm-input-bg) group-data-[selected]:border-text group-data-[selected]:bg-text">
                <Check
                  aria-hidden="true"
                  size={14}
                  className="text-text-inverse opacity-0 group-data-[selected]:opacity-100"
                />
              </span>
              Skalprov: fyll publiken till {SKALPROV_MAL} personer
            </Checkbox>
            <span className="text-caption text-text-muted">
              Bara i prototypen. Staging har för lite avstämd närvaro för att visa hur listan beter
              sig i den storlek den är byggd för.
            </span>
          </div>
        </div>
      </DisclosurePanel>
    </Disclosure>
  );

  /* ── Batch-baren: ALLTID renderad, konstant geometri ────────────────────── */
  const batchBar = (
    <div className="flex flex-col gap-2 px-4 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          intent="secondary"
          size="sm"
          isDisabled={slutligPublik.length === 0 && !beskarLage}
          onPress={() => {
            setBeskarLage((v) => !v);
            setPlockareOppen(false);
          }}
        >
          {beskarLage ? 'Klar' : 'Beskär publiken'}
        </Button>
        {/* Åtgärder är ALLTID nåbar — publiken finns oberoende av beskär-läget.
            Riktningsbeslutet (DUKNING § 1.3) hålls: knappen TAR URVALET VIDARE,
            den verkställer aldrig själv. */}
        <Button
          intent="primary"
          size="sm"
          isDisabled={slutligPublik.length === 0}
          onPress={onAtgarder}
        >
          Åtgärder
        </Button>
        {beskarLage && (
          <Button
            intent="secondary"
            size="sm"
            aria-expanded={plockareOppen}
            aria-controls={plockarId}
            onPress={() => setPlockareOppen((v) => !v)}
          >
            <UserPlus aria-hidden="true" size={16} />
            Lägg till person
          </Button>
        )}
        {beskarLage && bortplockade.size > 0 && (
          <Button intent="ghost" size="sm" onPress={() => setBortplockade(new Set())}>
            Återställ {bortplockade.size} borttagna
          </Button>
        )}
        {beskarLage && (
          <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
            {`${slutligPublik.length} kvar i publiken, ${bortplockade.size} borttagna, ${tillagda.length} tillagda för hand`}
          </span>
        )}
      </div>

      {beskarLage && plockareOppen && (
        <Personplockare
          id={plockarId}
          redanIPubliken={new Set(helaPubliken.map((m) => m.id))}
          onLaggTill={(m) => setTillagda((t) => (t.some((x) => x.id === m.id) ? t : [...t, m]))}
        />
      )}

      {/* VARIANTENS TES, SAGD RAKT UT. Handplockningen känns självklar i den här
          formen — och går inte att spara. Att dölja det hade gjort prototypen
          till en lögn om vad ett val av variant B faktiskt beställer. */}
      {harHandplock && (
        <MessageBox intent="info" title="Så här går det inte att spara i dag">
          <p>
            Segment är strikt filterbaserade: regeln är en lista kurser, inte en lista personer
            (ADR-064). Det du plockar här kan alltså varken sparas i segmentet eller följa med till
            utskicket - servern räknar fram mottagarna ur regeln när mailet går.
          </p>
          <p>
            Just nu: {tillagda.length} tillagda för hand, {bortplockade.size} borttagna. Frågan den
            här ytan ställer är om det är värt att ändra.
          </p>
        </MessageBox>
      )}
    </div>
  );

  /* ── Listkroppen ────────────────────────────────────────────────────────── */
  const kropp = (() => {
    if (fel) {
      return (
        <div className="px-4">
          <MessageBox intent="error" title="Kunde inte hämta publiken">
            {fel instanceof Error ? fel.message : 'Okänt fel.'}
          </MessageBox>
        </div>
      );
    }

    if (laddarForsta) {
      // Lugnt laddläge i listans SLUTGEOMETRI (samma radhöjd som personraden)
      // — Skeleton är alltid aria-hidden, status-rollen bor på containern.
      return (
        <div role="status" aria-busy="true" className="flex flex-col gap-2 px-4">
          <span className="sr-only">Laddar publiken…</span>
          <Skeleton variant="text" className="w-8 text-small" />
          {['a', 'b', 'c', 'd', 'e'].map((k) => (
            <div
              key={k}
              className="flex flex-col gap-1 rounded-xl border border-(--mm-navcard-border) bg-surface px-4 py-3"
            >
              <Skeleton variant="text" className="w-2/5 text-body" />
              <Skeleton variant="text" className="w-3/5 text-small" />
            </div>
          ))}
        </div>
      );
    }

    // TOMLÄGE 1 — ingen regel vald. Neutralt: ingenting har gått fel.
    // RUBRIKEN BOR I SAMMANFATTNINGEN, INTE HÄR. Första utkastet sade "Ingen
    // publik vald ännu" på båda ställena, två skärmrader isär — samma mening,
    // samma skärmbild, ingen ny upplysning (AtgardsSidas varv 20-läxa). Här
    // står bara vägen ut.
    if (!regelValdes) {
      return (
        <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
          <p className="max-w-prose text-small text-text-muted">
            Publiken är den här sidan. Välj minst en kurs i filtret, så fylls den.
          </p>
          <AriaButton onPress={() => setFilterOppen(true)} className={KAPSEL}>
            <Filter aria-hidden="true" size={18} className="shrink-0" />
            Öppna filtret
          </AriaButton>
        </div>
      );
    }

    // TOMLÄGE 2 — regeln finns, men källan har inga avstämda deltaganden ännu.
    // Fälla #34: NEUTRALT, aldrig som fel. Golvet (Närvaropoäng=1) lättas inte.
    if (slutligPublik.length === 0) {
      return (
        <div className="flex flex-col items-center gap-1 px-4 py-12 text-center">
          <p className="font-medium text-body">0 personer matchar</p>
          <p className="max-w-prose text-small text-text-muted">
            Inga med genomförd närvaro ännu. Närvaron för de valda kurserna är inte avstämd i basen
            - publiken fylls av sig själv när den blir det.
          </p>
        </div>
      );
    }

    // TOMLÄGE 3 — publiken finns, men sök/visningsfilter matchar ingen. Egen
    // form med tydlig återväg (EventsLists filter-tomläge).
    if (synliga.length === 0) {
      return (
        <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
          <p className="font-medium text-body">Ingen i publiken matchar</p>
          <p className="text-small text-text-muted">
            {sokTerm !== ''
              ? `Ingen av de ${slutligPublik.length} personerna matchar "${sok.trim()}".`
              : 'Ingen i publiken har det läget just nu.'}
          </p>
          <AriaButton
            onPress={() => {
              setSok('');
              setVy('alla');
            }}
            className={KAPSEL}
          >
            Visa hela publiken
          </AriaButton>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4 px-4">
        {grupper.map((grupp) => {
          const synligPaSkarm = grupp.rader.some((r) => r.index < visade);
          return (
            <section
              key={grupp.bokstav}
              className={`flex flex-col gap-2 ${synligPaSkarm ? '' : 'hidden print:flex'}`}
            >
              <h2 className="font-semibold text-small text-text-secondary">{grupp.bokstav}</h2>
              <ul aria-label={`Personer på ${grupp.bokstav}`} className="flex flex-col gap-2">
                {grupp.rader.map(({ m, index }) => (
                  <li
                    key={m.id}
                    className={`break-inside-avoid ${index < visade ? '' : 'hidden print:block'}`}
                  >
                    <PersonRad
                      medlem={m}
                      beskarLage={beskarLage}
                      yta="sida"
                      kvar={!bortplockade.has(m.id)}
                      handplockad={tillagda.some((t) => t.id === m.id)}
                      onKvarChange={(kvarNu) =>
                        setBortplockade((nu) => {
                          const next = new Set(nu);
                          if (kvarNu) next.delete(m.id);
                          else next.add(m.id);
                          return next;
                        })
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {synliga.length > visade && (
          <div className="flex flex-col items-center gap-1 py-2 print:hidden">
            <AriaButton onPress={() => setVisade((n) => n + CHUNK)} className={KAPSEL}>
              Visa {Math.min(CHUNK, synliga.length - visade)} till
            </AriaButton>
            <span className="text-caption text-text-muted">
              {visade} av {synliga.length} visade ·{' '}
              <AriaButton
                onPress={() => setVisade(synliga.length)}
                className="underline hover:no-underline"
              >
                visa alla {synliga.length}
              </AriaButton>
            </span>
          </div>
        )}
      </div>
    );
  })();

  return (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      {/* Utskriftshuvudet: papperet bär den kontext skärmen bär implicit. */}
      <div className="hidden px-4 text-small text-text-secondary print:block">
        Publiken · {slutligPublik.length} personer · {antalFar} får mailet
        {regelKlartext ? ` · ${regelKlartext}` : ''} · Utskrivet {LANGDATUM.format(new Date())}
      </div>

      <div className="flex items-center justify-between gap-3 px-4 print:hidden">
        <Link
          to="/mer"
          aria-label="Tillbaka till Mer"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-bg-muted hover:bg-bg-emphasized motion-safe:transition-colors"
        >
          <ChevronLeft aria-hidden="true" size={26} />
        </Link>
        {/* Spara är en STUB (read-only förstärkt) — den finns i formen för att
            variantens handlings-inventarium ska gå att bedöma. */}
        <SparaKapsel antal={slutligPublik.length} harHandplock={harHandplock} />
      </div>

      <header className="flex flex-col gap-1 border-border border-b px-4 pb-5">
        <h1 ref={rubrikRef} tabIndex={-1} className="font-semibold text-2xl">
          Publiken
        </h1>
        <p className="text-small text-text-muted">
          Personer med genomförd närvaro på de kurser du valt. Filtret formar vilka.
        </p>
      </header>

      {/* Skalprovet får ALDRIG gå obemärkt förbi — en påhittad publik som ser
          äkta ut är värre än ingen publik alls. */}
      {skalprov && (
        <div className="px-4">
          <MessageBox intent="warning" title="Skalprov påslaget - publiken är delvis påhittad">
            Personerna med adress <code>@exempel.invalid</code> finns inte. Växeln sitter i
            filterpanelen och är bara till för att bedöma hur listan beter sig vid {SKALPROV_MAL}{' '}
            personer.
          </MessageBox>
        </div>
      )}

      {sammanfattning}
      {filterRad}
      {batchBar}
      {kropp}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PERSONRADEN — publikens atom
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * NORMEN ÄR TYST (K37): den som får mailet bär inget märke. Bara avvikelsen
 * märks — saknar e-post, tackat nej, tillagd för hand.
 *
 * I BESKÄR-LÄGET är hela raden en rå RAC `Checkbox` (BorOverRad-precedenten,
 * ingen ny primitiv). Semantiken är INVERTERAD mot `MarkerbartKort`: bockad =
 * "med i publiken" är NORMALLÄGET, obockad = borttagen. Därför bär den
 * BORTTAGNA raden avvikelse-formen, inte den valda — en grön platta på 85 av
 * 85 rader hade varit brus. Den borttagna raden får STRECKAD kant (en FORM-
 * skillnad, inte en färgskillnad) plus en pill som säger det i klartext:
 * färg är aldrig ensam bärare (WCAG 1.4.1). Den TAPPAR dessutom sin fyllnad —
 * raden töms visuellt på samma sätt som den töms ur publiken.
 *
 * `yta` finns för att raden lever i TVÅ underlag och app-grammatiken har olika
 * svar för dem: på sidans egen yta är listkortet `bg-bg-muted` (EventCards
 * form), inuti en tonal `DetaljGrupp` är det `bg-surface` (Deltagares form).
 * Första utkastet bar bara det senare — på publikvyn blev då 85 rader helt
 * osynliga kort och listan läste som en rå textdump (fångat i renderingspasset).
 */
function PersonRad({
  medlem,
  beskarLage,
  kvar,
  handplockad,
  yta,
  onKvarChange,
}: {
  medlem: SegmentMember;
  beskarLage: boolean;
  kvar: boolean;
  handplockad: boolean;
  /** `sida` = direkt på sidytan · `kort` = inuti en tonal DetaljGrupp. */
  yta: 'sida' | 'kort';
  onKvarChange: (kvar: boolean) => void;
}) {
  const lage = mailLage(medlem);
  const kvarKlass =
    yta === 'sida'
      ? 'border-transparent bg-bg-muted contrast-more:border-border-strong'
      : 'border-(--mm-navcard-border) bg-surface contrast-more:border-(--mm-navcard-border-contrast)';
  const ytKlass = kvar ? kvarKlass : 'border-border-strong border-dashed bg-transparent';

  const innehall = (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="flex flex-wrap items-center gap-2">
        <span className={`truncate font-medium ${kvar ? '' : 'text-text-muted'}`}>
          {visatNamn(medlem)}
        </span>
        {handplockad && (
          <span className="shrink-0 rounded-full border border-transparent bg-bg-emphasized px-2 py-0.5 font-medium text-caption text-text-secondary contrast-more:border-border-strong">
            Tillagd för hand
          </span>
        )}
        {!kvar && (
          <span className="shrink-0 rounded-full border border-transparent bg-bg-emphasized px-2 py-0.5 font-medium text-caption text-text-secondary contrast-more:border-border-strong">
            Borttagen
          </span>
        )}
        {lage === 'ingen-epost' && (
          <StatusBadge ton="warning" storlek="sm">
            Saknar e-post
          </StatusBadge>
        )}
        {lage === 'tackat-nej' && (
          <StatusBadge ton="warning" storlek="sm">
            Tackat nej till utskick
          </StatusBadge>
        )}
      </span>
      {/* SLOT-MODELLEN (EventCard, PRD-beslut 6): raden renderas ALLTID, annars
          blir korten olika höga och listans vertikala raster hackar vid 85
          rader — mätt i renderingspasset. Men platshållaren är ett TANKSTRECK,
          inte texten "Ingen e-post": badgen ovanför har redan sagt det, och
          samma upplysning två gånger på samma rad är brus. */}
      <span className="truncate text-small text-text-muted">{medlem.email ?? '—'}</span>
    </span>
  );

  if (!beskarLage) {
    return <div className={`${RAD_BAS} ${ytKlass}`}>{innehall}</div>;
  }

  return (
    <Checkbox
      isSelected={kvar}
      onChange={onKvarChange}
      className={`group ${RAD_BAS} cursor-pointer ${ytKlass}`}
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded border border-(--mm-input-border) bg-(--mm-input-bg) group-data-[selected]:border-text group-data-[selected]:bg-text">
        <Check
          aria-hidden="true"
          size={14}
          className="text-text-inverse opacity-0 group-data-[selected]:opacity-100"
        />
      </span>
      {innehall}
    </Checkbox>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PERSONPLOCKAREN — handplockningens tillägg-sida
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Söker mot `listPersons` (adaptergränsen, ADR-055/057 — aldrig kringgången)
 * och lägger till en person i publiken som INTE har någon kvalificerande
 * närvarorad. Detta är den skarpaste delen av variantens tes: en sådan person
 * finns inte i `compute-segment`s utdata över huvud taget, så handplockning är
 * inte en UI-fråga utan en fråga om var publiken bor.
 *
 * Sökningen är debouncad (400 ms) och kräver två tecken — samma disciplin som
 * full-walken, av samma skäl.
 */
function Personplockare({
  id,
  redanIPubliken,
  onLaggTill,
}: {
  id: string;
  redanIPubliken: ReadonlySet<string>;
  onLaggTill: (m: SegmentMember) => void;
}) {
  const dataSource = useDataSource();
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 400);
    return () => clearTimeout(t);
  }, [term]);

  const traffar = useQuery({
    queryKey: ['proto-b', 'personer', debounced],
    queryFn: () => dataSource.listPersons({ search: debounced, pageSize: 8 }),
    enabled: debounced.length >= 2,
    staleTime: 60_000,
    retry: false,
  });

  const kandidater = (traffar.data?.persons ?? []).filter((p) => !redanIPubliken.has(p.id));

  return (
    <div id={id} className="flex flex-col gap-2 rounded-2xl bg-bg-muted p-4">
      <Input
        label="Sök person att lägga till"
        value={term}
        onChange={setTerm}
        size="sm"
        placeholder="Namn eller e-post…"
        description="Söker i alla personer - även de utan närvaro på de valda kurserna."
      />
      <div aria-live="polite" aria-busy={traffar.isFetching} className="flex flex-col gap-2">
        {debounced.length < 2 && (
          <p className="text-small text-text-muted">Skriv minst två tecken.</p>
        )}
        {traffar.isFetching && <p className="text-small text-text-muted">Söker…</p>}
        {traffar.isError && (
          <MessageBox intent="error" title="Kunde inte söka">
            {traffar.error instanceof Error ? traffar.error.message : 'Okänt fel.'}
          </MessageBox>
        )}
        {!traffar.isFetching && debounced.length >= 2 && kandidater.length === 0 && (
          <p className="text-small text-text-muted">Ingen träff utanför publiken.</p>
        )}
        {kandidater.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-xl border border-(--mm-navcard-border) bg-surface px-4 py-2.5 contrast-more:border-(--mm-navcard-border-contrast)"
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium text-body">{p.namn ?? '(namn saknas)'}</span>
              <span className="truncate text-small text-text-muted">
                {p.email ?? 'Ingen e-post'}
              </span>
            </span>
            <Button
              intent="secondary"
              size="sm"
              onPress={() =>
                onLaggTill({
                  id: p.id,
                  namn: p.namn,
                  email: p.email,
                  ejGodkandMail: p.ejGodkandMail,
                })
              }
            >
              Lägg till
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SPARA-KAPSELN — stub
   ═══════════════════════════════════════════════════════════════════════════ */

function SparaKapsel({ antal, harHandplock }: { antal: number; harHandplock: boolean }) {
  const [visat, setVisat] = useState(false);
  return (
    <div className="flex flex-col items-end gap-2">
      <AriaButton onPress={() => setVisat(true)} className={KAPSEL} isDisabled={antal === 0}>
        Spara som segment
      </AriaButton>
      {visat && (
        <MessageBox
          intent="info"
          title="Prototyp - ingenting sparades"
          onDismiss={() => setVisat(false)}
        >
          {harHandplock
            ? 'Regeln hade gått att spara. Dina handplockade ändringar hade INTE följt med - segmentet är regeln, inte listan.'
            : 'Regeln hade sparats som ett namngivet segment. Prototypen skriver aldrig.'}
        </MessageBox>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   UTSKICKS-VYN — granska och skicka
   ═══════════════════════════════════════════════════════════════════════════ */

/** Det simulerade utfallet. `sendEmail` anropas ALDRIG (read-only förstärkt). */
type Utfall = {
  accepted: number;
  suppressedConsent: number;
  suppressedNoEmail: number;
};

function UtskicksVy({
  slutligPublik,
  bortplockade,
  setBortplockade,
  antalFar,
  antalUndertryckta,
  harHandplock,
  amne,
  setAmne,
  mailtext,
  setMailtext,
  onTillbaka,
}: {
  slutligPublik: SegmentMember[];
  helaPubliken: SegmentMember[];
  bortplockade: ReadonlySet<string>;
  setBortplockade: React.Dispatch<React.SetStateAction<ReadonlySet<string>>>;
  antalFar: number;
  antalUndertryckta: number;
  harHandplock: boolean;
  amne: string;
  setAmne: (v: string) => void;
  mailtext: string;
  setMailtext: (v: string) => void;
  onTillbaka: () => void;
}) {
  const rubrikRef = useRef<HTMLHeadingElement>(null);
  const [bekraftText, setBekraftText] = useState('');
  const [utfall, setUtfall] = useState<Utfall | null>(null);
  const [testmailVisat, setTestmailVisat] = useState(false);
  const [visadeMottagare, setVisadeMottagare] = useState(CHUNK);

  useEffect(() => {
    rubrikRef.current?.focus();
  }, []);

  const antal = slutligPublik.length;
  const forsta = slutligPublik[0];
  const preview = fyllPlatshallare(mailtext, forsta);
  const amneVisning = fyllPlatshallare(amne, forsta);
  const ofyllda = [...new Set([...preview.ofyllda, ...amneVisning.ofyllda])];

  const utanEpost = slutligPublik.filter((m) => mailLage(m) === 'ingen-epost').length;
  const tackatNej = slutligPublik.filter((m) => mailLage(m) === 'tackat-nej').length;

  const kanSkicka = antal > 0 && amne.trim() !== '' && mailtext.trim() !== '' && antalFar > 0;
  // T50-lager (a): knappen låses tills mottagarantalet är SKRIVET — beviset att
  // konsekvensens storlek faktiskt lästs. Låst mot ett KÄNT värde, inte mot ett
  // ord man kan skriva utan att titta.
  //
  // TALET ÄR `antalFar`, INTE `antal`. Första utkastet jämförde mot publikens
  // storlek medan etiketten, felmeddelandet och knappen alla sade antalet som
  // FAKTISKT får mailet — grinden gick därför aldrig att låsa upp (fångat i
  // renderingspasset 2026-08-10: 83 i publiken, 63 mottagare, knappen låst för
  // alltid). Ett skriv-för-att-bekräfta som jämför mot ett annat tal än det som
  // står på skärmen är värre än inget: det lär användaren att grinden är trasig.
  const upplast = bekraftText.trim() === String(antalFar);

  function skicka() {
    // READ-ONLY FÖRSTÄRKT: ingen mutation. Utfallet HÄRLEDS ur den verkliga
    // publiken så att den icke-binära redovisningen kan bedömas på riktiga tal.
    setUtfall({
      accepted: antalFar,
      suppressedConsent: tackatNej,
      suppressedNoEmail: utanEpost,
    });
  }

  const mottagare = slutligPublik.slice(0, visadeMottagare);

  return (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      <div className="flex items-center gap-3 px-4">
        <button
          type="button"
          onClick={onTillbaka}
          aria-label="Tillbaka till publiken"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-bg-muted hover:bg-bg-emphasized motion-safe:transition-colors"
        >
          <ChevronLeft aria-hidden="true" size={26} />
        </button>
      </div>

      <header className="flex flex-col gap-1 border-border border-b px-4 pb-5">
        <h1 ref={rubrikRef} tabIndex={-1} className="font-semibold text-2xl">
          Granska och skicka
        </h1>
      </header>

      {/* KONSEKVENSEN FÖRST OCH STÖRST (NN/g) — vad som händer, i en mening. */}
      <p className="px-4 text-lg">
        Utskicket går till{' '}
        <strong className="font-semibold text-xl tabular-nums">{antalFar}</strong>{' '}
        {antalFar === 1 ? 'person' : 'personer'} av {antal} i publiken.
      </p>

      {/* FYNDEN FÖRE INNEHÅLLET — en varning under en textyta scrollas förbi. */}
      {ofyllda.length > 0 && (
        <div className="px-4">
          <MessageBox intent="warning" title="Något i texten kunde inte fyllas i">
            {ofyllda.join(', ')} står kvar som det är och går ut ordagrant så.
          </MessageBox>
        </div>
      )}
      {antalUndertryckta > 0 && (
        <div className="px-4">
          <MessageBox intent="warning" title="Alla får inte mailet">
            {utanEpost > 0 && <p>{utanEpost} saknar e-postadress.</p>}
            {tackatNej > 0 && <p>{tackatNej} har tackat nej till utskick.</p>}
            <p>Servern tar bort dem - de räknas aldrig som skickade.</p>
          </MessageBox>
        </div>
      )}
      {harHandplock && (
        <div className="px-4">
          <MessageBox intent="info" title="Handplockningen följer inte med">
            Servern räknar fram mottagarna ur segmentets regel när mailet går (T50-lager b) - en
            lista som byggts här i klienten används aldrig. Det är därför handplockning kräver att
            regeln kan bära personer, inte bara kurser.
          </MessageBox>
        </div>
      )}

      {/* MOTTAGARNA I SIN FULLA FORM — trygghetstriadens (b). I variant B är den
          nästan gratis: listan ÄR sidan man kom ifrån. Beskärningen fortsätter
          HÄR, där handlingen sker (AtgardsSida-precedenten: ETT urval, två vyer). */}
      <DetaljGrupp id="grupp-b-mottagare" rubrik="Mottagare">
        <div className="flex flex-col gap-2 py-4">
          {antal === 0 ? (
            <p className="text-body text-text-muted">
              Publiken är tom. Gå tillbaka och välj minst en kurs.
            </p>
          ) : (
            <>
              {mottagare.map((m) => (
                <PersonRad
                  key={m.id}
                  medlem={m}
                  beskarLage={true}
                  yta="kort"
                  kvar={!bortplockade.has(m.id)}
                  handplockad={false}
                  onKvarChange={(kvarNu) =>
                    setBortplockade((nu) => {
                      const next = new Set(nu);
                      if (kvarNu) next.delete(m.id);
                      else next.add(m.id);
                      return next;
                    })
                  }
                />
              ))}
              {antal > visadeMottagare && (
                <AriaButton
                  onPress={() => setVisadeMottagare(antal)}
                  className={`${KAPSEL} self-center`}
                >
                  Visa alla {antal} mottagare
                </AriaButton>
              )}
            </>
          )}
        </div>
      </DetaljGrupp>

      <DetaljGrupp id="grupp-b-utskicket" rubrik="Utskicket">
        <div className="flex flex-col gap-3 py-4">
          <Input label="Ämne" value={amne} onChange={setAmne} isRequired />
          <TextArea
            label="Meddelande"
            value={mailtext}
            onChange={setMailtext}
            rows={8}
            isRequired
            description="Skriv {förnamn} eller {namn} där mottagarens uppgifter ska in."
          />
        </div>
        {/* Ämnesraden bär EtikettVardeRads geometri (py-3 + 24 px textrad =
            48 px) — samma mått som resten av familjens läsrader. */}
        <div className="flex items-center justify-between gap-4 py-3">
          <span className="shrink-0 text-small text-text-muted">Ämnet mottagaren ser</span>
          <span className="truncate text-right text-body">{amneVisning.text || '—'}</span>
        </div>

        <div className="py-2.5">
          {forsta && <p className="pb-1.5 text-caption text-text-muted">Förhandsvisningsexempel</p>}
          {/* Trygghetstriadens (a): förhandsvisningen gäller EN NAMNGIVEN
              MOTTAGARE — platshållarna är fyllda ur första mottagaren, så det
              som står här är ett verkligt utfall. Plain text, aldrig
              HTML-renderad. `tabIndex` gör scrollregionen tangentbordsnåbar
              (axe scrollable-region-focusable). */}
          <p
            // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable) — samma motiv som AtgardsSida.tsx:2267.
            tabIndex={0}
            className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl border border-(--mm-navcard-border) bg-surface p-3 text-body text-text-secondary contrast-more:border-(--mm-navcard-border-contrast)"
          >
            {preview.text}
          </p>
        </div>
      </DetaljGrupp>

      {/* GRINDEN. Trygghetstriadens (c) står FÖRE den — testet är det man gör
          i stället för att gissa, inte efter att man bestämt sig. */}
      <div className="flex flex-col gap-4 px-4">
        <div className="flex flex-col gap-2">
          <Button
            intent="secondary"
            onPress={() => setTestmailVisat(true)}
            isDisabled={!kanSkicka}
            className="self-start"
          >
            Skicka test till mig
          </Button>
          {testmailVisat && (
            <MessageBox
              intent="info"
              title="Testmail-vägen finns inte ännu"
              onDismiss={() => setTestmailVisat(false)}
            >
              Ingenting skickades. Servern kan i dag bara skicka till ett helt segment - en
              enkel-mottagar-gren byggs i task-147.1. Knappen står här för att formen ska gå att
              bedöma.
            </MessageBox>
          )}
        </div>

        <Input
          label={`Skriv antalet mottagare (${antalFar}) för att låsa upp utskicket.`}
          value={bekraftText}
          onChange={setBekraftText}
          autoComplete="off"
          inputMode="numeric"
          isDisabled={!kanSkicka}
          isInvalid={bekraftText.trim() !== '' && bekraftText.trim() !== String(antalFar)}
          errorMessage={`Det matchar inte. Skriv ${antalFar} för att låsa upp.`}
        />

        {/* GRÖN-KNAPP-REGELN: utskicket når UTOMSTÅENDE → success, aldrig
            danger. Grönt tänds först när det är sant att nästa klick skickar
            (AtgardsSidas dynamiska form) — oåterkalleligheten bärs av grinden,
            inte av färgen. */}
        <div className="flex items-center gap-2">
          <Button
            intent={upplast ? 'success' : 'primary'}
            isDisabled={!kanSkicka || !upplast || utfall !== null}
            onPress={skicka}
          >
            Skicka till {antalFar} {antalFar === 1 ? 'person' : 'personer'}
          </Button>
          <Button intent="secondary" onPress={onTillbaka}>
            Tillbaka
          </Button>
        </div>
        <p className="text-caption text-text-muted">
          Bekräftelsen är låst mot {antalFar} - antalet som FAKTISKT får mailet, inte publikens
          storlek. Talen skiljer sig när någon saknar e-post eller tackat nej.
        </p>

        {/* UTFALLET ÄR ICKE-BINÄRT. Noll accepterade renderas ALDRIG som grön
            framgång — det är en varning med en förklaring, inte ett kvitto. */}
        <div aria-live="polite">
          {utfall && (
            <MessageBox
              intent={
                utfall.accepted === 0
                  ? 'warning'
                  : utfall.suppressedConsent + utfall.suppressedNoEmail > 0
                    ? 'info'
                    : 'success'
              }
              title={
                utfall.accepted === 0
                  ? 'Inga mottagare fick mailet'
                  : utfall.suppressedConsent + utfall.suppressedNoEmail > 0
                    ? 'Utskicket skickades delvis'
                    : 'Utskicket skickades'
              }
            >
              <p className="font-medium">
                [PROTOTYP] Ingenting skickades. Så här hade utfallet redovisats:
              </p>
              {utfall.accepted > 0 && (
                <p>
                  <strong>{utfall.accepted}</strong> mottagare fick mailet.
                </p>
              )}
              {utfall.suppressedConsent > 0 && (
                <p>{utfall.suppressedConsent} togs bort (har tackat nej till utskick).</p>
              )}
              {utfall.suppressedNoEmail > 0 && (
                <p>{utfall.suppressedNoEmail} togs bort (saknar e-post).</p>
              )}
            </MessageBox>
          )}
        </div>
      </div>
    </section>
  );
}
