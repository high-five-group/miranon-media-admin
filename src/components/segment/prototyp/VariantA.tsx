/**
 * [PROTOTYPE] S104 divergens — VARIANT A: REGELVERKSTADEN. KASTBAR KOD.
 *
 * SVARET DENNA VARIANT GER: "segmentet är en DEFINITION; publiken är dess
 * resultat." Den primära handlingen är att FORMULERA REGELN. Allt bor på en
 * sida: bygg → räkna → agera.
 *
 * Detta är avsiktligt den KONSERVATIVA referensvarianten — dagens mentala
 * modell översatt till Generation 2-formspråket. Utan den vet vi inte om B och
 * C faktiskt är förbättringar eller bara annorlunda.
 *
 * Fullständig märkning, frågan och det bindande premissunderlaget:
 * `src/components/segment/SegmentPrototyp.tsx` +
 * `tasks/sessions/bilagor/s104-segment-divergens/DUKNING.md`.
 *
 * ------------------------------------------------------------------------
 * DESIGNRESONEMANGET — vad som är hämtat varifrån, och varför
 *
 * FORMEN ÄR ÄRVD UR EVENT-FAMILJEN (G2), INTE UR GRANNFILEN. Dagens
 * `SegmentBuilder.tsx` är Generation 1: nakna `<ul>` med `border-b`-rader,
 * `<h2 className="font-medium text-lg">`, synlig "Laddar kurser…". Ingen av
 * de formerna finns här. I stället:
 *
 * - SIDRAMEN från `EventDetail.tsx:142-153` — `flex flex-col gap-6 pt-2
 *   lg:pt-10`, 44 px rund chevron-tillbaka i `bg-bg-muted`, `<header>` med
 *   `border-border border-b px-4 pb-5`, `<h1>` med `ref` för fokusflytt.
 * - TONALA KORTGRUPPER från `events/detail/DetaljGrupp.tsx` — rubriken står
 *   UTANFÖR kortytan (px-4-indrag, FK-mönstret), kortet bär `divide-y`-rader.
 *   Taxonomibygget, mottagarna, sparandet och sändvyn bor alla i den formen.
 * - PILL-TOGGELN från `EventsList.tsx:291-302` (`ToggleButtonGroup spread`) —
 *   tre likbreda segment per kursrad ersätter G1:s `RadioGroup`.
 * - ACCORDION-HUVUDET från `AtgardsSida.tsx:884-919` — räknar-raden ÄR
 *   fällningens knapp, med `aria-live`+`aria-atomic` på siffran och en
 *   hover-platta som skjuter 8 px utanför kortets inset (`-mx-2 … px-2`).
 * - GRANSKNINGENS GRAMMATIK från `AtgardsSida.tsx:2174-2336` — konsekvensen
 *   först och störst, förhandsvisning för EN NAMNGIVEN MOTTAGARE, grinden
 *   sist, dynamisk grön-regel på sändknappen.
 * - TOMLÄGET från `EventsList.tsx:558-570` — `flex flex-col items-center
 *   gap-1 py-12 text-center`, strukturerat och lugnt.
 *
 * DET SOM ÄR VARIANTENS EGET VAL (och alltså vad Marcus faktiskt röstar om):
 *
 * 1. TAXONOMIN ÄR GRUPPERAD PÅ MODALITET, inte en enda lång lista. Två
 *    `DetaljGrupp`-block ("Utbildningar" · "Föreläsningar") gör regelns
 *    råmaterial läsbart och ger sidan G2:s grupprubrik-rytm. KOSTNADEN,
 *    öppet: samma kursnamn kan stå i BÅDA grupperna när kursen körts i båda
 *    modaliteterna — det är domänens sanning (taxonomin ÄR kurs × modalitet),
 *    men det ser ut som en dubblett tills man läser grupprubriken.
 * 2. KLARTEXT-SPEGLINGEN OCH ANTALET BOR I SAMMA BLOCK. "Det här segmentet"
 *    säger vad regeln ÄR (överst, `text-lg`) och hur många den TRÄFFAR
 *    (under, `text-3xl`) — definition och resultat i ett andetag, vilket är
 *    exakt variantens tes. Talet står därmed på EN plats; mottagar-fällningen
 *    nedanför bär ett ANNAT tal (får mailet · undertrycks), aldrig samma
 *    (`AtgardsSida` varv 20: samma tal två rader ned är ingen ny upplysning).
 * 3. SÄNDVYN ÄR INLINE, INTE EN MODAL. Dagens bekräftelse ligger i en
 *    `Modal` (`SegmentMailCompose.tsx:211-304`) eftersom G1-sidan saknade
 *    plats. I G2-anatomin får sändningen ett eget sistablock, och "allt bor
 *    på en sida" blir sant hela vägen ut. Skriv-för-att-bekräfta-grinden
 *    nollställs i stället vid varje ändring av mottagarmängden (samma
 *    läckage-skydd som modalens "färskt fält per öppning").
 *
 * GOLVET SOM BÄRS (DUKNING § 3):
 * - T50 lager (a) skriv-för-att-bekräfta låst mot mottagarantalet · (b)
 *   antalet synligt före sändning · (c) pessimistisk bulk, ingen optimistisk
 *   flip, icke-binärt utfall där noll accepterade ALDRIG renderas grönt.
 * - Grön-knapp-regeln: utskick når utomstående → `intent="success"`.
 *   Dynamisk enligt `AtgardsSida.tsx:2318-2332` — `primary` medan grinden är
 *   låst, `success` först när klicket faktiskt skickar iväg något.
 * - Trygghetstriaden: (a) förhandsvisning · (b) synlig mottagarlista ·
 *   (c) "Skicka test till mig" — knappen finns i formen, kopplad till en
 *   stub tills `task-147.1` landar.
 * - Domänfällor: #34 (0 träffar är NEUTRALT, aldrig fel) · #35 (naket "Resor
 *   i medvetandet" förblir disambiguerat, se `radEtikett`) · #39 (inget
 *   `Utskickslogg.Antal skickade` speglas — utfallet räknas ur mottagarna).
 *
 * READ-ONLY FÖRSTÄRKT: `saveSegment`, `sendEmail` och testmail är no-op-
 * stubbar i denna fil. Prototypen skriver aldrig — varken prod eller staging.
 * Läsvägarna (`fetchEvents`, `computeSegment`, `listPersons`) går via
 * `useDataSource()` (ADR-055/057) — adapter-gränsen kringgås aldrig.
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ChevronDown, ChevronLeft, CircleCheck, Plus, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { DetaljGrupp } from '@/components/events/detail/DetaljGrupp';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { TextArea } from '@/components/primitives/TextArea';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import { StatusBadge } from '@/components/registrations/StatusBadge';
import { useDataSource } from '@/data/useDataSource';
import type { Person } from '@/domain/models/Person';
import type { Modalitet, Par, SegmentRule } from '@/domain/schemas';
import { deriveTaxonomy, labelForPar, parKey } from '@/lib/segment-taxonomy';
import { queryKeys } from '@/queries/keys';

/* ------------------------------------------------------------------ *
 * Regelns tre lägen per kurs-par. Orden är MEDVETET desamma som klartext-
 * speglingens ("Med: deltog i …. Utan: deltog i ….") — pillen man trycker på
 * är bokstavligen ordet som dyker upp i meningen två block ned. G1:s
 * Inkludera/Exkludera/Ignorera bar tre andra ord än sammanfattningen, och
 * kopplingen fick läsaren göra själv.
 * ------------------------------------------------------------------ */
type Val = 'med' | 'utan' | 'ignorera';

const VAL_ETIKETT: Record<Val, string> = {
  med: 'Med',
  utan: 'Utan',
  ignorera: 'Ignorera',
};

const VAL_ORDNING: Val[] = ['med', 'utan', 'ignorera'];

/** Modalitets-grupperna i fast ordning — aldrig alfabetisk (deterministisk UI). */
const MODALITET_ORDNING: Modalitet[] = ['Utbildning', 'Föreläsning'];
const MODALITET_RUBRIK: Record<Modalitet, string> = {
  Utbildning: 'Utbildningar',
  Föreläsning: 'Föreläsningar',
};

/**
 * Radetiketten NÄR modaliteten redan bärs av grupprubriken.
 *
 * FÄLLA #35 ÖVERLEVER FLYTTEN (data-model.md § Kända fällor; `labelForPar` i
 * `segment-taxonomy.ts:52-57`): naket "Resor i medvetandet" med modalitet
 * Föreläsning är ett DISTINKT kursnamn, skilt från RIM 1/2/3-serien. Flyttar
 * man modalitets-suffixet upp till grupprubriken försvinner `labelForPar`s
 * disambiguering — och just den kursen står då bredvid sina namnägrannar utan
 * något som skiljer dem åt. Därför bär raden en egen, kortare disambiguering.
 * `labelForPar` används oförändrad där hela etiketten behövs: pill-gruppens
 * tillgängliga namn, och klartext-speglingens mening.
 */
function radEtikett(par: Par): string {
  if (par.kurs === 'Resor i medvetandet' && par.modalitet === 'Föreläsning') {
    return 'Resor i medvetandet - fristående (ej del 1/2/3)';
  }
  return par.kurs;
}

/** Deterministisk regel-signatur (sorterade par-nycklar) → inaktuell-jämförelse. */
function regelSignatur(regel: SegmentRule): string {
  const nycklar = (par: Par[]) => par.map(parKey).sort();
  return JSON.stringify({ include: nycklar(regel.include), exclude: nycklar(regel.exclude) });
}

/**
 * En mottagare i den sammanlagda publiken. `handplockad` är variantens
 * skavsår gjort till ett fält: allt som är `true` här ligger UTANFÖR
 * `SegmentRule` och kan varken sparas eller nås av serverns sändväg.
 */
type Mottagare = {
  id: string;
  namn: string | null;
  email: string | null;
  ejGodkandMail: boolean;
  handplockad: boolean;
};

function visatNamn(m: { namn: string | null }): string {
  return m.namn ?? '(namn saknas)';
}

function personform(n: number): string {
  return n === 1 ? 'person' : 'personer';
}

/**
 * Trygghetstriadens (a) i minsta ärliga form: `{{namn}}` fylls ur EN NAMNGIVEN
 * mottagare (`AtgardsSida.tsx:1981-1988` — "att visa den FÖRSTA och säga vems
 * den är, är ärligare än att visa mallen och låtsas att den är utskicket").
 * Prototyp-stub: segment-utskicket har ingen mall-datakälla, så platshållar-
 * rymden är exakt en.
 */
function fyllNamn(text: string, mottagare: Mottagare | undefined): string {
  if (!mottagare) return text;
  return text.split('{{namn}}').join(visatNamn(mottagare));
}

/* ================================================================== *
 * EN KURSRAD I REGELVERKSTADEN
 *
 * Etiketten vänster, tre likbreda pillar höger — `EventsList`s period-toggel
 * (`spread`) i list-storlek. På smal yta staplas de deterministiskt i stället
 * för att trängas: raden vet vad den gör vid 430 px, den råkar inte ut för
 * det. Pill-gruppens tillgängliga namn är `labelForPar` (hela, disambiguerade
 * etiketten) medan den synliga texten är den korta — skärmläsaren hör alltså
 * alltid vilken modalitet raden gäller, även om ögat läser grupprubriken.
 * ================================================================== */
function KursRad({ par, val, onValj }: { par: Par; val: Val; onValj: (v: Val) => void }) {
  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="min-w-0 text-body">{radEtikett(par)}</span>
      <div className="w-full shrink-0 sm:w-64">
        {/* TRACKET MÅSTE VARA `bg-surface` HÄR, inte primitivens `bg-bg-muted`.
            Kapseln står PÅ ett tonalt kort som redan är bg-muted, och
            muted-på-muted mäter 1.00 — tracket försvann helt i första
            renderingen och de tre pillarna lästes som tre lösa ord. Exakt det
            neutral-fall `ToggleButtonGroup`s egen docblock beskriver (T130):
            "där misslyckades muted-på-muted (1.00) och svaret blev
            bg-surface". `cn`/tailwind-merge låter klassen vinna över
            variantens. */}
        <ToggleButtonGroup<Val>
          label={labelForPar(par)}
          spread
          selectedKey={val}
          onSelectionChange={onValj}
          className="bg-surface"
        >
          {VAL_ORDNING.map((v) => (
            <ToggleButton key={v} id={v} size="sm">
              {VAL_ETIKETT[v]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>
    </div>
  );
}

/* ================================================================== *
 * EN MOTTAGARRAD
 *
 * Namnet + adressen bär raden; pillarna bär avvikelserna. FÄRG ÄR ALDRIG
 * ENSAM BÄRARE — `StatusBadge` har både ikon och text, och den handplockade
 * markeras med ett neutralt textpill (ingen ton alls: det är inte ett
 * fel-tillstånd, det är en annan HÄRKOMST).
 * ================================================================== */
function MottagarRad({ m }: { m: Mottagare }) {
  const skal = !m.email
    ? 'Saknar e-postadress'
    : m.ejGodkandMail
      ? 'Har tackat nej till utskick'
      : null;
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-transparent bg-surface px-3 py-2 contrast-more:border-border-strong">
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-body">{visatNamn(m)}</span>
        <span className="truncate text-small text-text-muted">
          {m.email ?? 'Ingen e-postadress i basen'}
        </span>
      </span>
      <span className="flex shrink-0 flex-wrap items-center gap-1.5">
        {m.handplockad && (
          <span className="rounded-full border border-transparent bg-bg-muted px-2 py-0.5 font-medium text-caption text-text-secondary contrast-more:border-border-strong">
            Tillagd för hand
          </span>
        )}
        {skal && (
          <StatusBadge ton="warning" storlek="sm">
            {skal}
          </StatusBadge>
        )}
      </span>
    </li>
  );
}

/* ================================================================== *
 * VARIANT A
 * ================================================================== */
export function VariantA() {
  const dataSource = useDataSource();
  const rubrikRef = useRef<HTMLHeadingElement>(null);
  const harFokuserat = useRef(false);

  const [urval, setUrval] = useState<Record<string, Val>>({});
  const [undantag, setUndantag] = useState<Person[]>([]);
  const [namn, setNamn] = useState('');
  const [sparNot, setSparNot] = useState(false);
  const [amne, setAmne] = useState('');
  const [mailtext, setMailtext] = useState('');
  const [bekraftelse, setBekraftelse] = useState('');
  const [skickar, setSkickar] = useState(false);
  const [testNot, setTestNot] = useState(false);
  const [utfall, setUtfall] = useState<{
    accepterade: number;
    utanEpost: number;
    tackatNej: number;
    totalt: number;
    /** Vilken publik utfallet gäller — se `visatUtfall`. */
    signatur: string;
  } | null>(null);
  const [listaOppen, setListaOppen] = useState(false);
  const listPanelId = useId();

  const {
    data: events,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: () => dataSource.fetchEvents(),
  });

  // Fokus → <h1> vid FÖRSTA dataanländningen (EventDetail.tsx:90-95).
  useEffect(() => {
    if (events && !harFokuserat.current) {
      harFokuserat.current = true;
      rubrikRef.current?.focus();
    }
  }, [events]);

  const taxonomi = useMemo(() => (events ? deriveTaxonomy(events) : []), [events]);

  /** Taxonomin i modalitets-grupper — sidans två (eller färre) regelblock. */
  const grupper = useMemo(() => {
    const per = new Map<Modalitet, Par[]>();
    for (const par of taxonomi) {
      const lista = per.get(par.modalitet);
      if (lista) lista.push(par);
      else per.set(par.modalitet, [par]);
    }
    return MODALITET_ORDNING.filter((m) => per.has(m)).map((m) => ({
      modalitet: m,
      par: per.get(m) ?? [],
    }));
  }, [taxonomi]);

  const regel = useMemo<SegmentRule>(() => {
    const include: Par[] = [];
    const exclude: Par[] = [];
    for (const par of taxonomi) {
      const val = urval[parKey(par)];
      if (val === 'med') include.push(par);
      else if (val === 'utan') exclude.push(par);
    }
    return { include, exclude };
  }, [taxonomi, urval]);

  const harMed = regel.include.length > 0;

  /* RÄKNINGEN ÄR EXPLICIT — aldrig per tangenttryck. `compute-segment` är en
     full-walk över hela `Deltaganden` (~1012 rader/anrop) och får inte hamras;
     en ändrad regel efter räkning markeras INAKTUELL i stället för att tyst
     räknas om. Samma kontrakt som `SegmentBuilder.tsx:112-116`, ärvt. */
  const rakna = useMutation({ mutationFn: (r: SegmentRule) => dataSource.computeSegment(r) });
  const [raknadSignatur, setRaknadSignatur] = useState<string | null>(null);
  const inaktuell = raknadSignatur !== null && raknadSignatur !== regelSignatur(regel);
  const farsktResultat = rakna.data !== undefined && !inaktuell && !rakna.isPending;

  function raknaAntal() {
    const signatur = regelSignatur(regel);
    setUtfall(null);
    rakna.mutate(regel, { onSuccess: () => setRaknadSignatur(signatur) });
  }

  /* PUBLIKEN = regelns medlemmar + undantagen som inte redan fångats av
     regeln. Att räkna bort överlappet är inte kosmetika: lägger Lotta till
     någon för hand som regeln redan träffar, är hon INTE ett undantag — och
     att visa henne som ett hade överdrivit skavsåret. */
  const regelMedlemmar = rakna.data?.members ?? [];
  const regelIds = new Set(regelMedlemmar.map((m) => m.id));
  const extraUndantag = undantag.filter((p) => !regelIds.has(p.id));

  const mottagare: Mottagare[] = farsktResultat
    ? [
        ...regelMedlemmar.map((m) => ({ ...m, handplockad: false })),
        ...extraUndantag.map((p) => ({
          id: p.id,
          namn: p.namn,
          email: p.email,
          ejGodkandMail: p.ejGodkandMail,
          handplockad: true,
        })),
      ]
    : [];

  const antalMottagare = mottagare.length;
  const farMailet = mottagare.filter((m) => m.email && !m.ejGodkandMail).length;
  const undertryckta = antalMottagare - farMailet;
  const mottagarSignatur = mottagare.map((m) => m.id).join(',');

  /* GRINDEN ÄR HÄRLEDD, INTE NOLLSTÄLLD. Modalen fick färskheten gratis
     ("färskt skriv-fält per ny öppning", SegmentMailCompose.tsx:103) eftersom
     den monterades om; en inline-grind måste lösa det själv. FÖRSTA FORMEN VAR
     EN EFFEKT som tömde fältet när antalet ändrades — Biome fällde den
     (`useExhaustiveDependencies`: `antalMottagare` stod i listan utan att läsas
     i kroppen), och det var en riktig fångst. Rätt svar var inte att tysta
     regeln utan att inse att jämförelsen redan gör jobbet: `bekraftelse` mäts
     mot det AKTUELLA antalet, så ett tal skrivet mot 14 mottagare kan aldrig
     låsa upp ett utskick till 9 — fältet står kvar med sitt felmeddelande i
     stället för att tömmas tyst, vilket dessutom SÄGER varför knappen låstes.

     Utfallet bär av samma skäl sin publiks signatur: ett resultat räknat för
     en annan mottagarmängd är inte ett resultat, och lika många personer är
     inte samma personer (därför ID-listan, inte antalet). */
  const visatUtfall = utfall && utfall.signatur === mottagarSignatur ? utfall : null;

  const upplast = bekraftelse.trim() === String(antalMottagare) && antalMottagare > 0;
  const kanSkicka = farsktResultat && amne.trim() !== '' && mailtext.trim() !== '';

  function skickaStub() {
    setSkickar(true);
    // [PROTOTYPE] Ingen EF anropas. Utfallet HÄRLEDS ur den verkliga
    // mottagarlistan, så delvis-/noll-lägena uppstår av riktig data i stället
    // för av en slump — och `Utskickslogg.Antal skickade` (fälla #39, som
    // alltid visar 1) speglas aldrig.
    window.setTimeout(() => {
      const utanEpost = mottagare.filter((m) => !m.email).length;
      const tackatNej = mottagare.filter((m) => m.email && m.ejGodkandMail).length;
      setUtfall({
        accepterade: antalMottagare - utanEpost - tackatNej,
        utanEpost,
        tackatNej,
        totalt: antalMottagare,
        signatur: mottagarSignatur,
      });
      setSkickar(false);
    }, 900);
  }

  /* PERSONSÖKET (undantagets enda väg in). Debouncat + minst två tecken —
     `listPersons` är ett server-side filter och ska inte få ett anrop per
     tangenttryck. EGEN cache-nyckel, inte `queryKeys.persons.search`: den
     nyckeln ägs av `PersonsList`s `useInfiniteQuery` och bär en `pages`-form
     som en vanlig `useQuery` inte kan dela cache-post med. */
  const [sokInput, setSokInput] = useState('');
  const [sokTerm, setSokTerm] = useState('');
  useEffect(() => {
    const handle = setTimeout(() => setSokTerm(sokInput.trim()), 300);
    return () => clearTimeout(handle);
  }, [sokInput]);

  const personsok = useQuery({
    queryKey: ['proto-a-personsok', sokTerm],
    queryFn: () => dataSource.listPersons({ search: sokTerm, pageSize: 8 }),
    enabled: sokTerm.length >= 2,
  });

  const undantagsIds = new Set(undantag.map((p) => p.id));
  const traffar = (personsok.data?.persons ?? []).filter((p) => !undantagsIds.has(p.id));

  const medText = regel.include.map(labelForPar).join(' ELLER ');
  const utanText = regel.exclude.map(labelForPar).join(' ELLER ');

  /* Sidramen: EventDetail.tsx:142-153 verbatim i form — chevron, gap-6,
     pt-2 lg:pt-10. Krommet står i slutgeometri i alla lägen. */
  const sidRam = (innehall: React.ReactNode) => (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      <Link
        to="/mer"
        aria-label="Tillbaka till Mer"
        className="mx-4 flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-muted"
      >
        <ChevronLeft aria-hidden="true" size={26} />
      </Link>
      {innehall}
    </section>
  );

  if (isPending) {
    // Lugnt laddläge: skeleton i slutgeometri, besked ENDAST för skärmläsare
    // (ingen synlig "Laddar kurser…"-rad — det är G1-formen vi lämnar).
    return sidRam(
      <div role="status" aria-busy="true" className="flex flex-col gap-6">
        <span className="sr-only">Laddar kurser…</span>
        <Skeleton variant="text" className="mx-4 w-2/5 text-3xl" />
        <Skeleton variant="listRow" className="h-48 rounded-2xl" />
        <Skeleton variant="listRow" className="h-40 rounded-2xl" />
        <Skeleton variant="listRow" className="h-32 rounded-2xl" />
      </div>,
    );
  }

  if (isError) {
    return sidRam(
      <div className="px-4">
        <MessageBox intent="error" title="Kunde inte hämta kurser">
          {error instanceof Error ? error.message : 'Okänt fel.'}
        </MessageBox>
      </div>,
    );
  }

  return sidRam(
    <>
      <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
        <h1 ref={rubrikRef} tabIndex={-1} className="font-semibold text-3xl">
          Bygg segment
        </h1>
        <p className="text-small text-text-muted">
          Ett segment är en regel. Du väljer vilka kurser som ska vara med och vilka som ska hållas
          utanför - sedan räknar du fram vilka personer regeln träffar.
        </p>
      </header>

      {/* ── 1. REGELN ────────────────────────────────────────────────
          Taxonomin i tonala kortgrupper, en per modalitet. G1:s nakna
          `<ul>` med border-b-rader finns inte kvar någonstans i vyn. */}
      {grupper.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-12 text-center">
          <p className="font-medium text-body">Inga kurser att bygga med</p>
          <p className="text-small text-text-muted">
            Kurser och föreläsningar dyker upp här när de finns i eventplaneringen.
          </p>
        </div>
      ) : (
        grupper.map((grupp) => (
          <DetaljGrupp
            key={grupp.modalitet}
            id={`grupp-regel-${grupp.modalitet}`}
            rubrik={MODALITET_RUBRIK[grupp.modalitet]}
          >
            {grupp.par.map((par) => {
              const nyckel = parKey(par);
              return (
                <KursRad
                  key={nyckel}
                  par={par}
                  val={urval[nyckel] ?? 'ignorera'}
                  onValj={(v) => setUrval((s) => ({ ...s, [nyckel]: v }))}
                />
              );
            })}
          </DetaljGrupp>
        ))
      )}

      {/* ── 1b. UNDANTAGET ──────────────────────────────────────────
          FUNKTIONSFYNDET (DUKNING § 7) GJORT SYNLIGT. Segment är strikt
          filterbaserade i fem lager — `SegmentRule` är `{include, exclude}`
          och har ingen `personIds`-gren. I REGELVERKSTADENS modell finns
          därför bara en ärlig plats för en handplockad person: som ett
          UNDANTAG bredvid regeln, inte i den.

          BLOCKET FÅR SKAVA MED FLIT. Det står som en egen grupp under
          taxonomin, det har inga pillar (det finns ingen kurs att växla),
          och varningen under säger rakt ut vad undantaget INTE klarar. Vi
          bygger inte bort friktionen — den ÄR informationen. */}
      <DetaljGrupp id="grupp-undantag" rubrik="Undantag - enskilda personer">
        <div className="flex flex-col gap-3 py-4">
          <p className="text-small text-text-muted">
            Söker du fram en person här läggs hon till <em>utanför</em> regeln. Använd det när någon
            ska med trots att ingen kurs beskriver henne.
          </p>

          <Input
            label="Sök person"
            value={sokInput}
            onChange={setSokInput}
            placeholder="Skriv minst två bokstäver i namn eller e-post"
            description="Söker i Personer."
          />

          <div aria-live="polite" aria-busy={personsok.isPending && sokTerm.length >= 2}>
            {sokTerm.length >= 2 && personsok.isPending && (
              <div className="flex flex-col gap-2">
                <span className="sr-only">Söker personer…</span>
                <Skeleton variant="text" className="h-10 rounded-xl" />
                <Skeleton variant="text" className="h-10 rounded-xl" />
              </div>
            )}
            {personsok.isError && (
              <MessageBox intent="error" title="Kunde inte söka">
                {personsok.error instanceof Error ? personsok.error.message : 'Okänt fel.'}
              </MessageBox>
            )}
            {sokTerm.length >= 2 && personsok.data && traffar.length === 0 && (
              <p className="text-small text-text-muted">Ingen person matchar sökningen.</p>
            )}
            {traffar.length > 0 && (
              <ul className="flex flex-col gap-2">
                {traffar.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-transparent bg-surface px-3 py-2 contrast-more:border-border-strong"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-body">{visatNamn(p)}</span>
                      <span className="truncate text-small text-text-muted">
                        {p.email ?? 'Ingen e-postadress i basen'}
                      </span>
                    </span>
                    <Button
                      intent="secondary"
                      size="sm"
                      onPress={() => setUndantag((u) => [...u, p])}
                    >
                      <Plus aria-hidden="true" size={16} className="shrink-0" />
                      Lägg till
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {undantag.length > 0 && (
            <>
              <ul className="flex flex-col gap-2">
                {undantag.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-transparent bg-bg-emphasized px-3 py-2 contrast-more:border-border-strong"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-body">{visatNamn(p)}</span>
                      <span className="truncate text-small text-text-muted">
                        {p.email ?? 'Ingen e-postadress i basen'}
                      </span>
                    </span>
                    <Button
                      intent="ghost"
                      size="sm"
                      aria-label={`Ta bort ${visatNamn(p)} ur undantagen`}
                      onPress={() => setUndantag((u) => u.filter((x) => x.id !== p.id))}
                    >
                      <X aria-hidden="true" size={16} className="shrink-0" />
                      Ta bort
                    </Button>
                  </li>
                ))}
              </ul>

              {/* SKAVSÅRET, UTSKRIVET. Båda påståendena är belagda: schemat
                  (`Segment.schema.ts:26-29`) har ingen persongren, och
                  `send-email` löser mottagarna ur `segmentIds` server-side,
                  aldrig ur en klientbyggd lista (DUKNING § 3.1 lager b). */}
              <MessageBox intent="warning" title="Undantag lever bara i den här vyn">
                <p>
                  Ett segments regel kan bara beskriva kurser. De {undantag.length}{' '}
                  {personform(undantag.length)} du lagt till här följer <strong>inte</strong> med
                  när segmentet sparas.
                </p>
                <p>
                  Skickar du ett utskick på ett <em>sparat</em> segment räknar servern själv fram
                  mottagarna ur regeln - då når utskicket dem inte heller.
                </p>
              </MessageBox>
            </>
          )}
        </div>
      </DetaljGrupp>

      {/* ── 2. DET HÄR SEGMENTET ────────────────────────────────────
          VARIANTENS HJÄRTA. Definitionen överst i klartext, resultatet
          under - "segmentet är en definition; publiken är dess resultat"
          uttryckt som ETT block. Vikten bärs av graden (text-lg prosa,
          text-3xl tal), inte av en påhittad yta: samma grepp som
          `AtgardsSida` varv 4c ("grad-språnget bär"). */}
      <section aria-labelledby="grupp-spegling" className="flex min-w-0 flex-col gap-2">
        <h2 id="grupp-spegling" className="px-4 font-semibold text-lg">
          Det här segmentet
        </h2>
        <div className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong">
          <div className="flex flex-col gap-2 py-4">
            {harMed ? (
              <p className="text-lg">
                Med: deltog i <strong className="font-semibold">{medText}</strong>.
                {regel.exclude.length > 0 && (
                  <>
                    {' '}
                    Utan: deltog i <strong className="font-semibold">{utanText}</strong>.
                  </>
                )}
              </p>
            ) : (
              <p className="text-lg text-text-muted">
                Sätt minst en kurs på <strong className="font-semibold text-text">Med</strong>, så
                skrivs regeln ut här i klartext.
              </p>
            )}

            {/* SÖMMEN. Undantagen får inte smyga in i regelmeningen - de är
                inte en del av regeln, och en mening som låtsas det hade dolt
                exakt det Marcus behöver se. Egen mening, egen ton. */}
            {extraUndantag.length > 0 && (
              <p className="text-body text-text-secondary">
                Dessutom {extraUndantag.length} {personform(extraUndantag.length)} som lagts till
                för hand. De står utanför regeln.
              </p>
            )}
          </div>

          {/* RÄKNINGEN */}
          <div className="flex flex-col gap-3 py-4">
            <div aria-live="polite" aria-busy={rakna.isPending} className="flex flex-col gap-1">
              {rakna.isPending ? (
                <>
                  <span className="sr-only">Räknar personer…</span>
                  <Skeleton variant="text" className="w-20 text-3xl" />
                  <Skeleton variant="text" className="w-56" />
                </>
              ) : rakna.isError ? (
                <MessageBox intent="error" title="Kunde inte räkna antal">
                  {rakna.error instanceof Error ? rakna.error.message : 'Okänt fel.'}
                </MessageBox>
              ) : rakna.data === undefined ? (
                <p className="text-body text-text-muted">
                  Antalet räknas när du ber om det - regeln söker igenom alla deltaganden.
                </p>
              ) : inaktuell ? (
                // FÄRG ALDRIG ENSAM BÄRARE: talet dämpas OCH raden under säger
                // i klartext att det inte längre gäller.
                <>
                  <p className="text-lg text-text-muted">
                    <strong className="font-semibold text-3xl tabular-nums">
                      {rakna.data.count + extraUndantag.length}
                    </strong>{' '}
                    {personform(rakna.data.count + extraUndantag.length)} - inaktuellt.
                  </p>
                  <p className="text-body text-text-muted">
                    Du har ändrat regeln sedan du räknade. Räkna om för att se rätt antal.
                  </p>
                </>
              ) : rakna.data.count === 0 && extraUndantag.length === 0 ? (
                // FÄLLA #34: noll träffar är en ÄRLIG signal (närvaron är inte
                // avstämd i basen än), aldrig ett feltillstånd — neutral ton,
                // ingen MessageBox, ingen röd färg.
                <p className="text-lg">
                  <strong className="font-semibold text-3xl tabular-nums">0</strong> personer
                  matchar - inga med genomförd närvaro ännu.
                </p>
              ) : (
                // TALET STÅR INLINE I SIN EGEN MENING (AtgardsSida.tsx:2177-2181).
                // Första formen hade siffran i ett eget block ovanför texten, och
                // den läste som ett löst fragment: "1" / "person i det här
                // segmentet." Grad-språnget bär vikten lika bra inuti meningen —
                // och meningen blir en mening.
                <>
                  <p className="text-lg">
                    <strong className="font-semibold text-3xl tabular-nums">
                      {rakna.data.count + extraUndantag.length}
                    </strong>{' '}
                    {personform(rakna.data.count + extraUndantag.length)} i det här segmentet.
                  </p>
                  {extraUndantag.length > 0 && (
                    <p className="text-small text-text-secondary">
                      {rakna.data.count} ur regeln + {extraUndantag.length} tillagd
                      {extraUndantag.length === 1 ? '' : 'a'} för hand.
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button intent="primary" onPress={raknaAntal} isDisabled={!harMed || rakna.isPending}>
                {rakna.isPending ? 'Räknar…' : inaktuell ? 'Räkna om' : 'Räkna antal'}
              </Button>
              {!harMed && (
                <span className="text-small text-text-muted">
                  Välj minst en kurs som ska vara Med.
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. MOTTAGARNA ───────────────────────────────────────────
          TRYGGHETSTRIADENS (b): listan fälls ut UR resultatet, den står
          aldrig på egen hand. Räknar-raden är accordion-huvudet
          (`AtgardsSida.tsx:884-919`) men bär ett ANNAT tal än blocket
          ovanför: får mailet kontra undertrycks. Vad servern faktiskt gör
          är dess sak - därför "undertrycks av servern", inte ett löfte. */}
      {farsktResultat && antalMottagare > 0 && (
        <DetaljGrupp id="grupp-mottagare" rubrik="Mottagare">
          <div className="flex flex-col py-2">
            <button
              type="button"
              aria-expanded={listaOppen}
              aria-controls={listPanelId}
              onClick={() => setListaOppen((v) => !v)}
              className="-mx-2 flex w-auto items-center justify-between gap-4 rounded-lg px-2 py-1.5 text-left hover:bg-bg-emphasized motion-safe:transition-colors"
            >
              <span className="flex min-w-0 items-center gap-2">
                <CircleCheck aria-hidden="true" size={20} className="shrink-0 text-success" />
                <span aria-live="polite" aria-atomic="true" className="text-body">
                  <strong className="font-semibold text-xl tabular-nums">{farMailet}</strong> får
                  mailet
                  {undertryckta > 0 && (
                    <>
                      {' · '}
                      <strong className="font-semibold text-xl tabular-nums">{undertryckta}</strong>{' '}
                      undertrycks av servern
                    </>
                  )}
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

            {/* Panelen ligger ALLTID i DOM:en (hidden i stängt läge) så
                aria-controls pekar på något som finns. */}
            <ul id={listPanelId} hidden={!listaOppen} className="flex flex-col gap-2 pt-3 pb-1">
              {mottagare.map((m) => (
                <MottagarRad key={m.id} m={m} />
              ))}
            </ul>
          </div>
        </DetaljGrupp>
      )}

      {/* ── 4. SPARA ────────────────────────────────────────────────
          Att spara är att frysa DEFINITIONEN - därför direkt efter den,
          före sändningen. */}
      <DetaljGrupp id="grupp-spara" rubrik="Spara segmentet">
        <div className="flex flex-col gap-3 py-4">
          <p className="text-small text-text-muted">
            Ett sparat segment kan användas om och om igen. Regeln sparas, inte personerna - listan
            räknas fram på nytt varje gång.
          </p>
          <Input
            label="Namn på segmentet"
            value={namn}
            onChange={setNamn}
            placeholder="t.ex. Fjärrskådning-deltagare"
            isRequired
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              intent="primary"
              onPress={() => setSparNot(true)}
              isDisabled={!harMed || namn.trim() === ''}
            >
              Spara segment
            </Button>
            {!harMed && (
              <span className="text-small text-text-muted">Bygg klart regeln först.</span>
            )}
          </div>
          {sparNot && (
            <MessageBox
              intent="info"
              title="Prototyp - ingenting sparades"
              onDismiss={() => setSparNot(false)}
            >
              I den skarpa ytan hade segmentet <strong>{namn.trim()}</strong> sparats här, med
              regeln och dess klartext-spegling.
            </MessageBox>
          )}
        </div>
      </DetaljGrupp>

      {/* ── 5. SÄNDVYN AVSLUTAR SIDAN ───────────────────────────────
          Inline, inte i modal (se filhuvudets punkt 3). Grammatiken är
          `AtgardsSida`s granskning: skriv → förhandsvisa → grind → utfall. */}
      <section aria-labelledby="grupp-skicka" className="flex min-w-0 flex-col gap-2">
        <h2 id="grupp-skicka" className="px-4 font-semibold text-lg">
          Skicka ett utskick
        </h2>
        <div className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong">
          {/* SKRIVYTAN */}
          <div className="flex flex-col gap-3 py-4">
            <Input
              label="Ämne"
              value={amne}
              onChange={setAmne}
              isRequired
              isDisabled={skickar}
              placeholder="Ämnesraden mottagaren ser"
            />
            <TextArea
              label="Meddelande"
              value={mailtext}
              onChange={setMailtext}
              rows={7}
              isRequired
              isDisabled={skickar}
              description="Skriv {{namn}} där mottagarens namn ska stå."
            />
          </div>

          {/* FÖRHANDSVISNINGEN — trygghetstriadens (a). EN NAMNGIVEN
              MOTTAGARE: var och en får sitt eget mail, så det finns ingen
              enda sann text att visa. Att visa den första och säga vems
              den är, är ärligare än att visa mallen. */}
          <div className="flex flex-col gap-2 py-4">
            {/* ETIKETTEN ÄR KORT, NAMNET STÅR PÅ EGEN RAD. Första formen la
                hela meningen ("…så här ser mailet ut för Anna Andersson") i
                samma flex-rad som knappen — den blev för lång, `flex-wrap`
                sköt ned knappen och resultatet såg ut som ett olycksfall.
                `AtgardsSida` varv 20 hade redan svaret: "Förhandsvisnings-
                exempel" är hela etiketten. Namnet är ändå kvar, för det är
                det som gör den till EN NAMNGIVEN MOTTAGARE — bara flyttat
                till sin egen rad där det får plats. */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-caption text-text-muted">Förhandsvisningsexempel</span>
              {/* TRYGGHETSTRIADENS (c): knappen finns i formen, vägen finns
                  inte. `send-email` saknar enkel-mottagar-gren tills
                  task-147.1 landar (DUKNING § 3.2). */}
              <Button intent="secondary" size="sm" onPress={() => setTestNot(true)}>
                Skicka test till mig
              </Button>
            </div>

            {mottagare[0] && (
              <p className="text-small text-text-muted">
                Så här ser mailet ut för {visatNamn(mottagare[0])}. Var och en får sitt eget.
              </p>
            )}

            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-xl border border-transparent bg-surface px-3 py-2 contrast-more:border-border-strong">
              <span className="shrink-0 text-small text-text-muted">Ämne</span>
              <span className="min-w-0 text-right text-body">
                {fyllNamn(amne, mottagare[0]) || '-'}
              </span>
            </div>

            <p
              // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable) — samma motiv som AtgardsSida.tsx:2267.
              tabIndex={0}
              className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-transparent bg-surface px-3 py-2 text-body text-text-secondary contrast-more:border-border-strong"
            >
              {fyllNamn(mailtext, mottagare[0]) || 'Meddelandet visas här när du skrivit det.'}
            </p>

            {testNot && (
              <MessageBox
                intent="info"
                title="Testmailet är inte kopplat än"
                onDismiss={() => setTestNot(false)}
              >
                Knappen finns i formen, men servern har ingen väg för ett enskilt testmail ännu.
              </MessageBox>
            )}
          </div>

          {/* GRINDEN — T50:s tre lager. */}
          <div className="flex flex-col gap-3 py-4">
            {!farsktResultat ? (
              <p className="text-body text-text-muted">
                Räkna fram segmentet först, så vet du vilka du skriver till.
              </p>
            ) : (
              <>
                {/* (b) MOTTAGARANTALET SYNLIGT FÖRE SÄNDNING — konsekvensen
                    först och störst (NN/g; AtgardsSida.tsx:2174-2181). */}
                <p className="text-lg">
                  Det här skickas till{' '}
                  <strong className="font-semibold text-xl tabular-nums">{antalMottagare}</strong>{' '}
                  {personform(antalMottagare)}.
                </p>

                {extraUndantag.length > 0 && (
                  <MessageBox intent="warning" title="Undantagen når inte hela vägen">
                    {extraUndantag.length} av mottagarna är tillagda för hand. Servern räknar fram
                    mottagarna ur segmentets regel - de kommer inte med i ett skarpt utskick.
                  </MessageBox>
                )}

                {/* (a) SKRIV-FÖR-ATT-BEKRÄFTA, låst mot ett känt värde. */}
                <Input
                  label={`Skriv antalet mottagare (${antalMottagare}) för att låsa upp utskicket.`}
                  value={bekraftelse}
                  onChange={setBekraftelse}
                  autoComplete="off"
                  inputMode="numeric"
                  isDisabled={skickar}
                  isInvalid={bekraftelse.trim() !== '' && !upplast}
                  errorMessage={`Det matchar inte. Skriv ${antalMottagare} för att låsa upp.`}
                />

                <div className="flex flex-wrap items-center gap-2">
                  {/* GRÖN-KNAPP-REGELN, dynamiskt: låst grind når ingen
                      utomstående → primary; upplåst går utskicket iväg →
                      success. Rött är reserverat för destruktiva interna
                      borttagningar och används aldrig här. */}
                  <Button
                    intent={upplast && kanSkicka ? 'success' : 'primary'}
                    isDisabled={!upplast || !kanSkicka || skickar}
                    onPress={skickaStub}
                  >
                    {skickar
                      ? 'Skickar…'
                      : `Skicka till ${antalMottagare} ${personform(antalMottagare)}`}
                  </Button>
                  {!kanSkicka && (
                    <span className="text-small text-text-muted">
                      Ämne och meddelande måste vara ifyllda.
                    </span>
                  )}
                </div>

                <p aria-live="polite" className="text-small text-text-muted">
                  {upplast && kanSkicka && !skickar
                    ? `Rätt antal angivet - knappen "Skicka till ${antalMottagare} ${personform(antalMottagare)}" är nu upplåst.`
                    : ''}
                </p>

                {/* (c) PESSIMISTISK BULK. Ingen optimistisk flip: inget
                    ändras förrän utfallet finns, och NOLL ACCEPTERADE
                    RENDERAS ALDRIG SOM GRÖN FRAMGÅNG. */}
                <div aria-live="polite" aria-busy={skickar}>
                  {skickar && <p className="text-small text-text-muted">Skickar utskicket…</p>}
                  {visatUtfall && !skickar && (
                    <MessageBox
                      intent={
                        visatUtfall.accepterade === 0
                          ? 'warning'
                          : visatUtfall.accepterade < visatUtfall.totalt
                            ? 'info'
                            : 'success'
                      }
                      title={
                        visatUtfall.accepterade === 0
                          ? 'Ingen fick mailet'
                          : visatUtfall.accepterade < visatUtfall.totalt
                            ? 'Utskicket lyckades delvis'
                            : 'Utskicket lyckades'
                      }
                    >
                      {visatUtfall.accepterade > 0 && (
                        <p>
                          <strong>
                            {visatUtfall.accepterade} av {visatUtfall.totalt}
                          </strong>{' '}
                          {personform(visatUtfall.accepterade)} fick mailet.
                        </p>
                      )}
                      {visatUtfall.tackatNej > 0 && (
                        <p>{visatUtfall.tackatNej} togs bort (har tackat nej till utskick).</p>
                      )}
                      {visatUtfall.utanEpost > 0 && (
                        <p>{visatUtfall.utanEpost} togs bort (saknar e-postadress).</p>
                      )}
                    </MessageBox>
                  )}
                </div>
              </>
            )}

            <p className="text-caption text-text-muted">
              Prototyp: ingenting skickas, sparas eller skrivs. Utfallet ovan räknas fram ur den
              hämtade mottagarlistan.
            </p>
          </div>
        </div>
      </section>
    </>,
  );
}
