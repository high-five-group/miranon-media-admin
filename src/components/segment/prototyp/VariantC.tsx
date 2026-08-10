/**
 * [PROTOTYPE] S104 divergens — VARIANT C: SEGMENT SOM ENTITET. KASTBAR KOD.
 *
 * SVARET DENNA VARIANT GER: "segment är SAKER du äger och återanvänder, som
 * event." Den primära handlingen är att VÄLJA ETT SEGMENT OCH AGERA PÅ DET.
 * Sparade segment är sidan; att bygga nytt och att skicka är egna flöden.
 *
 * Detta är den variant som prövar det snitt Marcus redan satt precedens för:
 * `TASK-145.3` rev batch-bekräftelsen ur eventsidan med motiveringen "allt som
 * VERKSTÄLLER något bor på Åtgärds-sidan", och `TASK-145.4` konsoliderade
 * betalningar in i registret. Bygga ≠ verkställa.
 *
 * Fullständig märkning, frågan och det bindande premissunderlaget:
 * `src/components/segment/SegmentPrototyp.tsx` +
 * `tasks/sessions/bilagor/s104-segment-divergens/DUKNING.md`.
 *
 * ── FYRA VYER I EN KOMPONENT, INGA NYA ROUTES ────────────────────────────
 *
 * Passets regel är att routing-filerna ligger utanför varianternas ägo, så
 * stegen lever som ett internt `vy`-tillstånd. I skarp form vore `lista` och
 * `detalj` egna routes (`/mer/segment` respektive `/mer/segment/$segmentId`)
 * — entiteter som går att länka till är halva poängen med att kalla dem
 * entiteter. Det som prövas här är formen, inte URL-kontraktet.
 *
 *   lista   — sparade segment som EventCard-kort. SIDAN.
 *   detalj  — EventDetail-anatomin: header + primär åtgärd i eget kort +
 *             DetaljGrupp för regeln + mottagarlistan.
 *   utskick — eget steg, AtgardsSidans grammatik (granska → skickar →
 *             resultat på samma yta).
 *   nytt    — byggflödet, medvetet SEKUNDÄRT och minimalt.
 *
 * ── FORMSPRÅKET ÄR ÄRVT, INTE UPPFUNNET ──────────────────────────────────
 *
 *  · Listkortet + kapsel-ingången + tomlägena  → `events/EventsList.tsx`,
 *    `events/EventCard.tsx` (rubrik med `after:inset-0`, meta-rader med
 *    14 px `aria-hidden`-ikoner, `rounded-2xl bg-bg-muted p-4`).
 *  · Detaljsidans ram (44 px chevron, `border-b`-header, fokus till `<h1>`,
 *    primär åtgärd i eget ovillkorligt kort under headern)
 *                                              → `events/EventDetail.tsx`
 *                                                 + `detail/Atgarder.tsx`.
 *  · Tonala kortgrupper med rubrik UTANFÖR kortytan
 *                                              → `detail/DetaljGrupp.tsx`.
 *  · Markera-läget (kort som RAC-`Checkbox`, grön KANT som WCAG-bärare,
 *    batch-bar med konstant geometri, Esc stänger)
 *                                              → `detail/Deltagare.tsx`.
 *  · Utskicksvyn (mottagarlista, "en namngiven mottagare"-förhandsvisning,
 *    ofyllda platshållare som FYND, tre utfallslägen, prototyp-rigg)
 *                                              → `atgarder/AtgardsSida.tsx`.
 *
 * Dagens `SegmentBuilder.tsx` (Generation 1) är medvetet INTE förlaga.
 *
 * ── ANTALS-PROBLEMET, OCH VAD DET AVSLÖJAR ───────────────────────────────
 *
 * `listSegments()` bär INTE medlemsantal. Enda vägen till ett antal är
 * `computeSegment(rule)` — en full-walk över hela `Deltaganden`. En lista med
 * nio kort som visar antal hade alltså kostat nio full-walks vid varje
 * sidladdning. Det görs inte här.
 *
 * LÖSNINGEN ÄR LAT OCH DELAD: antalet räknas bara när någon ber om det (per
 * kort, eller automatiskt när ett segment ÖPPNAS — då är klicket redan
 * Lottas), och resultatet cachas under `queryKeys.segment.sendRecipients(id)`
 * med fem minuters `staleTime`. Detalj-, lista- och utskicksvyn läser SAMMA
 * nyckel, så vägen lista → detalj → tillbaka → utskick kostar EN walk per
 * segment, inte tre. Ett oräknat kort säger "Antal ej räknat" — neutralt, ett
 * okänt tal är inte ett fel.
 *
 * DET SOM INTE GÅR ATT LÖSA I KLIENTEN, öppet bokfört: en lista kan aldrig
 * visa antal "gratis" så länge `get-segments` inte bär ett cachat antal per
 * rad. Det är ett EF-krav, inte ett UI-problem, och det är variantens
 * tydligaste fynd om segment ska bli entiteter man överblickar.
 *
 * ── READ-ONLY FÖRSTÄRKT ──────────────────────────────────────────────────
 *
 * `saveSegment`, `sendEmail` och testmail-vägen är NO-OP-STUBBAR. Filen har
 * noll skrivvägar: `saveSegment`/`sendEmail` förekommer bara i denna mening.
 * Läsvägarna (`fetchEvents`, `listSegments`, `computeSegment`) går via
 * `useDataSource()` (ADR-055/057) — adapter-gränsen kringgås aldrig.
 */
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Hand,
  ListPlus,
  MailCheck,
  Send,
  UserPlus,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Checkbox } from 'react-aria-components';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { TextArea } from '@/components/primitives/TextArea';
import { useDataSource } from '@/data/useDataSource';
import type { Par, SegmentMember, SegmentRule } from '@/domain/schemas';
import { deriveTaxonomy, labelForPar, parKey } from '@/lib/segment-taxonomy';
import { queryKeys } from '@/queries/keys';

/* ================================================================== *
 * GRAMMATIK — klassrader ärvda ordagrant ur Event-familjen (G2).
 * ================================================================== */

/** Tonal kortyta. `DetaljGrupp.tsx` + `detail/Atgarder.tsx`, teckenexakt. */
const KORT_KLASS =
  'rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong';

/** Radform med hover-platta som skjuter 8 px utanför insetet. `Atgarder.tsx` K56. */
const RAD_KLASS =
  '-mx-2 flex w-auto items-center gap-2 rounded-lg px-2 py-1.5 text-left font-medium text-body hover:bg-bg-emphasized motion-safe:transition-colors';

/** Tillbaka-chevronens 44 px runda knapp. `EventDetail.tsx` rad 147. */
const TILLBAKA_KLASS =
  'mx-4 flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-muted';

/** Sekundär ingång som mjuk kapsel. `EventsList.tsx` § vyRad ("Skapa nytt event"). */
const KAPSEL_KLASS =
  'inline-flex shrink-0 items-center gap-1.5 rounded-full bg-bg-muted px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized motion-safe:transition-colors';

/** Kryssrutans ruta — `AtgardsSida.tsx` § KRYSSRUTA_KLASS, 16 px-formen. */
const KRYSSRUTA_KLASS =
  'flex size-4 shrink-0 items-center justify-center rounded border border-(--mm-input-border) bg-(--mm-input-bg) group-data-[selected]:border-(--mm-checkbox-selected-border) group-data-[selected]:bg-(--mm-checkbox-selected-bg)';

/** Låst textyta i `TextArea rows={7}`-höjd. `AtgardsSida.tsx` § TEXTYTA_KLASS. */
const TEXTYTA_KLASS = 'h-[186px] rounded border border-transparent px-3 py-2';

/* ================================================================== *
 * ENTITETEN
 * ================================================================== */

/**
 * Ett segment som ENTITET. Överlagrar `SavedSegment` med två saker ytan
 * behöver men datamodellen inte bär:
 *
 *  · `handplockade` — DUKNING § 7 belägger i fem lager att en handplockad
 *    individ inte går att lägga till: schemat har ingen `personIds`-gren, och
 *    att öppna för det är en `ADR-064`-revision, inte en UI-ändring. Fältet
 *    finns här som SKISS, för att visa hur formen skulle te sig.
 *  · `skiss` — posten kommer inte ur `get-segments`.
 */
type SegmentEntitet = {
  id: string;
  namn: string;
  definition: string;
  /** Regel-segment: den typade regeln. Handplockad lista: `null`. */
  rule: SegmentRule | null;
  /** [SKISS, ADR-064-revision krävs] Handplockade medlemmar. */
  handplockade: SegmentMember[] | null;
  skiss: boolean;
};

type Vy =
  | { namn: 'lista' }
  | { namn: 'detalj'; id: string }
  | { namn: 'utskick'; ids: string[] }
  | { namn: 'nytt' };

/**
 * SKISS-SEGMENTEN — härledda ur LEVANDE taxonomi, inte påhittade.
 *
 * Staging bär i skrivande stund tre sparade segment, alla med namnet
 * `app-segment-test+<uuid>` och identisk regel (CI-fixturer, se `TASK-87`).
 * De renderas först och orörda — det är den ärliga bilden av datat. Men tre
 * identiska UUID-rader svarar inte på om ett BIBLIOTEK av segment läser bra,
 * vilket är precis vad denna variant ska prövas på.
 *
 * Skisserna byggs därför ur `deriveTaxonomy(fetchEvents())`: riktiga kursnamn,
 * riktiga regler — och därmed RIKTIGA antal när de räknas, via samma
 * `computeSegment` som de sparade. De beter sig identiskt med verkliga poster;
 * det enda som skiljer är att de inte finns i basen.
 *
 * `labelForPar` används i stället för egen etikettlogik — den bär fälla #35:s
 * disambiguering av nakna "Resor i medvetandet" mot RIM 1/2/3.
 */
function byggSkisser(taxonomi: Par[]): SegmentEntitet[] {
  const skisser: SegmentEntitet[] = taxonomi.slice(0, 3).map((par) => ({
    id: `skiss-${parKey(par)}`,
    namn: labelForPar(par),
    definition: `Med: deltog i ${labelForPar(par)}.`,
    rule: { include: [par], exclude: [] },
    handplockade: null,
    skiss: true,
  }));

  // Ett kombinations-segment (två inkluderade, ett uteslutet) så listan bär
  // minst en post vars klartext inte får plats på en rad — radbrytningen är
  // en formfråga som en lista av enkelregler aldrig hade avslöjat.
  const [a, b, c] = taxonomi;
  if (a && b && c) {
    skisser.push({
      id: 'skiss-kombination',
      namn: 'Erfarna deltagare - utan nybörjarkursen',
      definition: `Med: deltog i ${labelForPar(a)} ELLER ${labelForPar(b)}. Utan: deltog i ${labelForPar(c)}.`,
      rule: { include: [a, b], exclude: [c] },
      handplockade: null,
      skiss: true,
    });
  }

  /* DEN HANDPLOCKADE LISTAN — variantens ställningstagande i formen.
     Som ENTITET är skillnaden liten: samma kort, samma detaljsida, samma
     utskicksväg. Det som byts ut är EN grupp på detaljsidan (regeln →
     medlemslistan). Det är det starkaste argumentet för entitets-modellen
     som passet kan visa: en lista och en regel är två sätt att SVARA på
     frågan "vilka?", och entiteten döljer skillnaden för allt nedströms.
     Men den kräver `ADR-064`-revisionen — den är inte byggbar i UI:t. */
  skisser.push({
    id: 'skiss-handplockad',
    namn: 'VIP - inbjudna till helgretreaten',
    definition: '6 personer valda för hand.',
    rule: null,
    handplockade: [
      { id: 'p1', namn: 'Anna Andersson', email: 'anna@example.com', ejGodkandMail: false },
      { id: 'p2', namn: 'Bertil Nilsson', email: 'bertil@example.com', ejGodkandMail: false },
      { id: 'p3', namn: 'Cissi Ek', email: 'cissi@example.com', ejGodkandMail: true },
      { id: 'p4', namn: 'David Ohlsson', email: null, ejGodkandMail: false },
      { id: 'p5', namn: 'Elin Ljung', email: 'elin@example.com', ejGodkandMail: false },
      { id: 'p6', namn: 'Fredrik Sjö', email: 'fredrik@example.com', ejGodkandMail: false },
    ],
    skiss: true,
  });

  return skisser;
}

/* ================================================================== *
 * ANTALET — lat, delad, aldrig hamrad
 * ================================================================== */

type Medlemssvar = { members: SegmentMember[]; count: number };

/**
 * Medlemmarna för EN entitet. `enabled` styrs utifrån: listan räknar bara på
 * begäran, detaljvyn räknar automatiskt (klicket är då redan Lottas).
 * Nyckeln delas med utskicksvyns `useQueries` → ingen andra walk.
 */
function useMedlemmar(entitet: SegmentEntitet, aktiv: boolean) {
  const dataSource = useDataSource();
  return useQuery<Medlemssvar>({
    queryKey: queryKeys.segment.sendRecipients(entitet.id),
    queryFn: () => {
      if (entitet.rule) return dataSource.computeSegment(entitet.rule);
      const members = entitet.handplockade ?? [];
      return Promise.resolve({ members, count: members.length });
    },
    enabled: aktiv,
    staleTime: 5 * 60_000,
  });
}

/* ================================================================== *
 * PLATSHÅLLARE — "en namngiven mottagare"-mönstret, i segment-form
 * ================================================================== */

/**
 * Fyller `{förnamn}` för EN namngiven mottagare och rapporterar det som inte
 * gick att fylla. Ofyllda lämnas KVAR i klartext — `AtgardsSida.tsx`
 * § PLATSHÅLLARNA: de ofyllda är fyndet, inte ett fel i visningen. Ett mail
 * som gick ut med `Hej {förnamn},` är ett mail Lotta hade stoppat.
 *
 * Segment-utskick har ingen event-kontext, så rymden är EN platshållare —
 * `{event}`/`{datum}`/`{ort}`/`{deadline}` finns inte att fylla ur ett
 * segment och lämnas därför medvetet oimplementerade i stället för att
 * fyllas med gissningar.
 */
function fyllPlatshallare(mall: string, mottagare: SegmentMember | undefined) {
  const fornamn = mottagare?.namn?.trim().split(/\s+/)[0] ?? null;
  const ofyllda: string[] = [];
  const text = mall.replace(/\{([a-zåäöA-ZÅÄÖ]+)\}/g, (traff, nyckel: string) => {
    const varde = nyckel === 'förnamn' ? fornamn : null;
    if (varde == null || varde === '') {
      if (!ofyllda.includes(traff)) ofyllda.push(traff);
      return traff;
    }
    return varde;
  });
  return { text, ofyllda };
}

/** Visningsnamn med neutral reserv — `Personer.Namn` är nullbart i kontraktet. */
function visningsNamn(m: SegmentMember): string {
  return m.namn?.trim() || '(namn saknas)';
}

/* ================================================================== *
 * FOKUS + RULLNING — golvet, ärvt ur EventDetail/GranskningsSida
 * ================================================================== */

/**
 * Fokus till `<h1>` vid VYBYTE (komponentens mount) OCH när data anlänt, och
 * rullning till toppen vid vybyte. `EventDetail.tsx` gör det första,
 * `AtgardsSida.tsx § GranskningsSida` det andra — vyväxlingen här sker genom
 * att komponenten byts ut, inte via routern, så ingen återställer rullningen
 * åt oss.
 *
 * Nyckel-vakten gör att data-anländningen fokuserar EN gång, inte per render.
 */
function useVyFokus(rubrikRef: React.RefObject<HTMLHeadingElement | null>, dataKlart: boolean) {
  const senaste = useRef('');
  useEffect(() => {
    const nyckel = dataKlart ? 'data' : 'mount';
    if (senaste.current === nyckel) return;
    senaste.current = nyckel;
    rubrikRef.current?.focus();
  }, [dataKlart, rubrikRef]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
}

/* ================================================================== *
 * SIDRAM — EventDetail.tsx rad 142–153, klass för klass
 * ================================================================== */

function SidRam({
  onTillbaka,
  tillbakaEtikett,
  children,
}: {
  onTillbaka?: () => void;
  tillbakaEtikett?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      {onTillbaka && (
        <button
          type="button"
          onClick={onTillbaka}
          aria-label={tillbakaEtikett ?? 'Tillbaka'}
          className={`${TILLBAKA_KLASS} print:hidden`}
        >
          <ChevronLeft aria-hidden="true" size={26} />
        </button>
      )}
      {children}
    </section>
  );
}

/* ================================================================== *
 * LISTAN — SIDAN
 * ================================================================== */

/**
 * Listkortet, `EventCard`-anatomin: rubriken bär hela kortets klickyta via
 * `after:absolute after:inset-0` (aldrig på `<li>`), meta-rader med 14 px
 * `aria-hidden`-ikoner, `rounded-2xl border bg-bg-muted p-4` +
 * `hover:bg-bg-emphasized motion-safe:transition-colors`.
 *
 * TVÅ LÄGEN, SAMMA GEOMETRI: i markera-läget ÄR kortet en rå RAC `Checkbox`
 * (`Deltagare.tsx § MarkerbartKort`) med grön KANT som urvals-bärare —
 * kanten, inte plattan, eftersom plattan mäter 1,05:1 mot vitt och därmed
 * inte kan bära WCAG 1.4.1 ensam.
 *
 * Statusslotten uppe till höger bär AVVIKELSEN, aldrig normalfallet
 * (`EventCard`s egen regel): bara den handplockade listan får en pill, för
 * bara den är något annat än en regel.
 */
function SegmentKort({
  entitet,
  markeraLage,
  vald,
  antal,
  raknar,
  onOppna,
  onVaxla,
  onRakna,
}: {
  entitet: SegmentEntitet;
  markeraLage: boolean;
  vald: boolean;
  antal: number | undefined;
  raknar: boolean;
  onOppna: () => void;
  onVaxla: (vald: boolean) => void;
  onRakna: () => void;
}) {
  const handplockad = entitet.rule === null;

  const innehall = (
    <>
      <div className="flex flex-col gap-1 text-small">
        {/* HÖGERMARGINALEN BETALAS BARA AV DE KORT SOM HAR EN PILL. `EventCard`
            bär `pr-24` ovillkorligt eftersom dess statusslot är närmast
            allmän; här har exakt ETT kort en pill, och att reservera 128 px av
            varje rubriks bredd för en pill som inte finns kostade mest på
            430 px-bredden där titlarna redan bryter. */}
        {markeraLage ? (
          <span
            className={`line-clamp-2 min-h-[2lh] font-semibold text-body ${handplockad ? 'pr-32' : ''}`}
          >
            {entitet.namn}
          </span>
        ) : (
          <button
            type="button"
            onClick={onOppna}
            className={`line-clamp-2 min-h-[2lh] text-left font-semibold text-body after:absolute after:inset-0 ${handplockad ? 'pr-32' : ''}`}
          >
            {entitet.namn}
          </button>
        )}
        <span className="flex items-start gap-1.5">
          <Filter
            aria-hidden="true"
            size={14}
            className="mt-1 shrink-0 text-text-secondary print:hidden"
          />
          <span className="line-clamp-2 text-text-secondary">{entitet.definition}</span>
        </span>
      </div>

      {/* ANTALS-SLOTTEN — ALLTID renderad (slot-modellen, `EventCard`s
          bor över-rad): ett oräknat kort och ett räknat är likhöga, så
          listan inte hoppar när ett tal landar. Texten bär tillståndet;
          ikonen är dekor. */}
      <div className="flex min-h-8 flex-wrap items-center gap-1.5">
        <span className="flex items-center gap-1.5 text-caption text-text-secondary">
          <Users aria-hidden="true" size={14} className="shrink-0" />
          <span aria-live="polite">
            {raknar
              ? 'Räknar…'
              : antal === undefined
                ? 'Antal ej räknat'
                : antal === 0
                  ? '0 personer - inga med genomförd närvaro ännu'
                  : `${antal} ${antal === 1 ? 'person' : 'personer'}`}
          </span>
        </span>
        {/* RÄKNA-KNAPPEN STÅR BREDVID TALET, INTE HÖGERSTÄLLD. Första formen
            sköt den till kortets högerkant, och i en lista av tio kort blev
            det en kolumn av lösryckta knappar som inte hörde ihop med något
            i sin egen rad. Tillstånd och åtgärd är EN tanke ("antalet är inte
            räknat - räkna det") och får därför stå som en. */}
        {antal === undefined && !raknar && !markeraLage && (
          // `relative` lyfter knappen över rubrikens `after:inset-0`-överlägg
          // — utan den hade länkytan svalt klicket.
          <span className="relative shrink-0 print:hidden">
            <Button intent="ghost" size="sm" onPress={onRakna}>
              Räkna
            </Button>
          </span>
        )}
      </div>

      {/* STATUS-SLOTTEN — `EventCard`s absolut placerade pill uppe till höger,
          och samma regel om VAD som får stå där: AVVIKELSEN, aldrig
          normalfallet. Bara den handplockade listan får en pill; att skriva
          "Regel" på åtta kort hade varit brus.

          DEN STÅR SIST I DOM:EN, inte först som i `EventCard`. Skälet är att
          hela kortet ÄR en `Checkbox` i markera-läget, så DOM-ordningen blir
          dess accessible name: med pillen först läste skärmläsaren upp
          "Handplockad lista VIP - inbjudna…" — kategorin före identiteten.
          Placeringen är `absolute`, så flytten kostar ingenting visuellt. */}
      {handplockad && (
        <span
          data-slot="status"
          className="absolute top-4 right-4 flex items-center gap-1 rounded-full border border-transparent bg-surface px-2.5 py-0.5 font-medium text-caption text-text-secondary contrast-more:border-border-strong"
        >
          <Hand aria-hidden="true" size={12} className="shrink-0" />
          Handplockad lista
        </span>
      )}
    </>
  );

  if (markeraLage) {
    return (
      <li className="flex">
        <Checkbox
          isSelected={vald}
          onChange={onVaxla}
          className={`relative flex w-full cursor-pointer flex-col gap-2 rounded-2xl border p-4 motion-safe:transition-colors ${
            vald
              ? 'border-(--mm-success) bg-(--mm-success-bg) contrast-more:border-(--mm-success)'
              : 'border-transparent bg-bg-muted hover:bg-bg-emphasized contrast-more:border-border-strong'
          }`}
        >
          {innehall}
        </Checkbox>
      </li>
    );
  }

  return (
    <li className="relative flex flex-col gap-2 rounded-2xl border border-transparent bg-bg-muted p-4 hover:bg-bg-emphasized motion-safe:transition-colors contrast-more:border-border-strong">
      {innehall}
    </li>
  );
}

function SegmentKortMedAntal(props: {
  entitet: SegmentEntitet;
  markeraLage: boolean;
  vald: boolean;
  begard: boolean;
  onOppna: () => void;
  onVaxla: (vald: boolean) => void;
  onRakna: () => void;
}) {
  const { data, isFetching } = useMedlemmar(props.entitet, props.begard);
  return (
    <SegmentKort
      entitet={props.entitet}
      markeraLage={props.markeraLage}
      vald={props.vald}
      antal={data?.count}
      raknar={props.begard && isFetching && data === undefined}
      onOppna={props.onOppna}
      onVaxla={props.onVaxla}
      onRakna={props.onRakna}
    />
  );
}

/**
 * LANDNINGSVYN. Sparade segment ÄR sidan.
 *
 * Anatomin ur `EventsList.tsx`: vy-rad med sekundär ingång vänster
 * (kapsel-mönstret) och markera-ingången höger, batch-bar med KONSTANT
 * GEOMETRI (`Deltagare.tsx § MarkeringsBatchBar` — knapparna växer ut åt
 * höger, listan under hoppar aldrig), likformiga slot-kort, och två SKILDA
 * tomlägen.
 *
 * BATCH-BARENS PRIMÄRKNAPP VERKSTÄLLER ALDRIG. "Skicka utskick" tar urvalet
 * VIDARE till utskicksvyn — samma snitt `TASK-145.3` gjorde när
 * batch-bekräftelsen revs ur eventsidan.
 */
function SegmentLista({
  entiteter,
  laddar,
  fel,
  markeraLage,
  valda,
  begarda,
  onOppnaMarkering,
  onStangMarkering,
  onVaxla,
  onMarkeraAlla,
  onRensa,
  onOppna,
  onNytt,
  onSkicka,
  onRakna,
}: {
  entiteter: SegmentEntitet[];
  laddar: boolean;
  fel: Error | null;
  markeraLage: boolean;
  valda: ReadonlySet<string>;
  begarda: ReadonlySet<string>;
  onOppnaMarkering: () => void;
  onStangMarkering: () => void;
  onVaxla: (id: string, vald: boolean) => void;
  onMarkeraAlla: () => void;
  onRensa: () => void;
  onOppna: (id: string) => void;
  onNytt: () => void;
  onSkicka: () => void;
  onRakna: (id: string) => void;
}) {
  const rubrikRef = useRef<HTMLHeadingElement>(null);
  useVyFokus(rubrikRef, !laddar);

  const allaValda = entiteter.length > 0 && valda.size === entiteter.length;

  return (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
        <h1 ref={rubrikRef} tabIndex={-1} className="font-semibold text-3xl">
          Segment
        </h1>
        <p className="text-small text-text-muted">
          Grupper av personer du sparar och återanvänder. Välj ett segment för att se det, eller
          markera flera och gör ett utskick.
        </p>
      </header>

      <div className="flex flex-col gap-4 px-4">
        {/* EN RAD, ALLTID NÄRVARANDE — `Deltagare.tsx § MarkeringsBatchBar`s
            regel om KONSTANT GEOMETRI (`TASK-145.3` AC #1): läget växlas genom
            en horisontell utvidgning, aldrig en vertikal förskjutning.

            FÖRSTA FORMEN DELADE PÅ DEM och det syntes direkt i skärmdumpen:
            Markera bodde i en egen vy-rad OVANFÖR en batch-bar som stod TOM i
            av-läget — 32 px död yta mellan raden och första kortet, reserverad
            av en `min-h` vars enda uppgift var att bevara en geometri ingen
            såg. Förlagan har läges-knappen INUTI baren av precis det skälet.

            LÄGES-KNAPPEN ÄR FÖRANKRAD HÖGER I BÅDA LÄGENA och flyttar sig
            aldrig — den är ankaret Lotta backar ur läget med. Handlingarna
            växer i stället ut från vänster och tar "Nytt segment"s plats:
            mitt i ett urval är att skapa något nytt inte det hon gör. */}
        <div className="flex min-h-10 flex-wrap items-center gap-2 print:hidden">
          {markeraLage ? (
            <>
              {/* VERKSTÄLLER ALDRIG (`TASK-145.3`): tar urvalet VIDARE. */}
              <Button intent="primary" size="sm" isDisabled={valda.size === 0} onPress={onSkicka}>
                Skicka utskick
              </Button>
              <Button intent="secondary" size="sm" isDisabled={allaValda} onPress={onMarkeraAlla}>
                Markera alla
              </Button>
              {valda.size > 0 && (
                <Button intent="ghost" size="sm" onPress={onRensa}>
                  Rensa
                </Button>
              )}
              {/* RÄKNAREN ÄR KORT AV MÄTT SKÄL. Full mening ("3 av 11
                  markerade") mätte raden till ~534 px i en spalt på ~537 —
                  den WRAPADE till två rader i första skärmdumpen, och därmed
                  hoppade hela listan nedåt när läget slogs på, vilket är
                  exakt det baren finns för att förhindra. Kortformen ger
                  ~60 px marginal. Skärmläsaren får ändå hela meningen:
                  `aria-atomic` + `sr-only`-tillägget, `Deltagare.tsx`s form
                  (utan atomic annonseras bara den ändrade siffran). */}
              <span
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="text-small text-text-secondary tabular-nums"
              >
                {valda.size} av {entiteter.length}
                <span className="sr-only"> segment markerade</span>
              </span>
            </>
          ) : (
            // Ingången till att BYGGA är avsiktligt en mjuk kapsel och inte en
            // primärknapp (`EventsList.tsx § vyRad`s "Skapa nytt event"):
            // bygga är inte sidans huvudsak.
            <button type="button" onClick={onNytt} className={KAPSEL_KLASS}>
              <ListPlus aria-hidden="true" size={18} className="shrink-0" />
              Nytt segment
            </button>
          )}
          <button
            type="button"
            onClick={markeraLage ? onStangMarkering : onOppnaMarkering}
            className={`${KAPSEL_KLASS} ml-auto`}
          >
            <Check aria-hidden="true" size={18} className="shrink-0" />
            {markeraLage ? 'Avbryt' : 'Markera'}
          </button>
        </div>

        {fel && (
          <MessageBox intent="error" title="Kunde inte hämta sparade segment">
            {fel.message}
          </MessageBox>
        )}

        {laddar ? (
          // Lugnt laddläge: skeleton i listans SLUTGEOMETRI — samma padding,
          // samma radantal som kortet, så datalandningen flyttar ingenting.
          <div role="status" aria-busy="true" className="flex flex-col gap-3">
            <span className="sr-only">Laddar segment…</span>
            {['a', 'b', 'c'].map((k) => (
              <div
                key={k}
                className="flex flex-col gap-2 rounded-2xl border border-transparent bg-bg-muted p-4"
              >
                <div className="min-h-[2lh]">
                  <Skeleton variant="text" className="w-1/2 text-body" />
                </div>
                <Skeleton variant="text" className="w-3/4 text-small" />
                <div className="flex min-h-8 items-center">
                  <Skeleton variant="text" className="w-24 text-caption" />
                </div>
              </div>
            ))}
          </div>
        ) : entiteter.length === 0 ? (
          // TOMLÄGE 1 — inga segment alls. Strukturerat och centrerat,
          // `EventsList.tsx § body` (story 13).
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="font-medium text-body">Inga sparade segment än</p>
            <p className="text-small text-text-muted">
              Ett segment är en grupp personer du kan skicka till om och om igen.
            </p>
            <button type="button" onClick={onNytt} className={KAPSEL_KLASS}>
              <ListPlus aria-hidden="true" size={18} className="shrink-0" />
              Skapa ditt första segment
            </button>
          </div>
        ) : (
          <ul aria-label="Sparade segment" className="flex flex-col gap-3">
            {entiteter.map((e) => (
              <SegmentKortMedAntal
                key={e.id}
                entitet={e}
                markeraLage={markeraLage}
                vald={valda.has(e.id)}
                begard={begarda.has(e.id)}
                onOppna={() => onOppna(e.id)}
                onVaxla={(v) => onVaxla(e.id, v)}
                onRakna={() => onRakna(e.id)}
              />
            ))}
          </ul>
        )}

        <PrototypNot lang />
      </div>
    </section>
  );
}

/* ================================================================== *
 * DETALJVYN — EventDetail-anatomin
 * ================================================================== */

/** Etikett-värde-rad, `DetaljGrupp.tsx § EtikettVardeRad` (py-3 = 48 px). */
function EtikettRad({ term, children }: { term: string; children: React.ReactNode }) {
  if (children == null || children === '') return null;
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="shrink-0 text-small text-text-muted">{term}</dt>
      <dd className="text-right text-body">{children}</dd>
    </div>
  );
}

/** Tonal kortgrupp med rubriken UTANFÖR kortytan — `DetaljGrupp.tsx`. */
function Grupp({
  id,
  rubrik,
  children,
}: {
  id: string;
  rubrik: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-2">
      <h2 id={id} className="px-4 font-semibold text-lg">
        {rubrik}
      </h2>
      <div className={`divide-y divide-border ${KORT_KLASS}`}>{children}</div>
    </section>
  );
}

/**
 * En mottagare i listan. Skiljer VISUELLT + i TEXT på "får mailet" och
 * "undertrycks av serverns consent-grind" (trygghetstriaden b) — färgen är
 * aldrig ensam bärare, skälet står utskrivet.
 *
 * KLIENTEN FILTRERAR ALDRIG SJÄLV (`ADR-067` D5): raden är en FÖRUTSÄGELSE ur
 * data vi redan läst (`ejGodkandMail`, tom `email`), inte ett utfall. Servern
 * äger sanningen om vilka som faktiskt kontaktas.
 */
function MottagarRad({ medlem }: { medlem: SegmentMember }) {
  const utanEpost = !medlem.email;
  const nekat = medlem.ejGodkandMail;
  const undertrycks = utanEpost || nekat;
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-body">{visningsNamn(medlem)}</span>
        <span className="truncate text-caption text-text-muted">
          {medlem.email ?? 'Ingen e-postadress'}
        </span>
      </span>
      {undertrycks && (
        <span className="shrink-0 rounded-full border border-transparent bg-surface px-2.5 py-0.5 font-medium text-caption text-text-secondary contrast-more:border-border-strong">
          {utanEpost ? 'Saknar e-post' : 'Har tackat nej'}
        </span>
      )}
    </div>
  );
}

/**
 * MOTTAGARLISTAN — höjdbegränsad och RULLBAR över tio poster.
 *
 * Första formen skrev ut hela listan rakt ned. Med sju mottagare såg det
 * utmärkt ut; med tvåhundra (vilket är precis vad ett segment ska kunna vara)
 * hade allt nedanför — ämnesfältet, texten, grinden — legat bortom flera
 * skärmars rullning. Ett utskicksflöde vars kontroller ligger utom räckhåll
 * vid normal datamängd är brutet, inte "långt".
 *
 * VALET STOD MELLAN ACCORDION OCH RULLNING, och rullningen vann på förlagans
 * egen distinktion: `AtgardsSida § MottagarYta` fäller IN listan på hubben
 * ("hon kom hit för att GÖRA något"), men gransknings-sidan — den yta där
 * sändningen faktiskt sker — visar mottagarna UTSKRIVNA. Den här vyn är
 * gransknings-sidan, och trygghetstriaden (b) kräver en SYNLIG mottagarlista.
 * Ett klick bort är inte synlig. `max-h-96` + `scrollbar-inline` är samma
 * lösning plockaren i samma fil redan bär.
 *
 * `tabIndex={0}` när den rullar: en rullbar yta utan fokuserbart innehåll är
 * otillgänglig för tangentbord (axe `scrollable-region-focusable`, WCAG 2.1.1).
 */
function MottagarLista({ medlemmar }: { medlemmar: SegmentMember[] }) {
  const rader = medlemmar.map((m) => <MottagarRad key={m.id} medlem={m} />);
  if (medlemmar.length <= 10) return <div className="divide-y divide-border">{rader}</div>;
  return (
    <div
      // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable) — samma motiv som AtgardsSida.tsx:2267.
      tabIndex={0}
      className="scrollbar-inline max-h-96 divide-y divide-border overflow-auto"
    >
      {rader}
    </div>
  );
}

/**
 * SEGMENTETS EGEN SIDA. `EventDetail.tsx` rad 142–322, punkt för punkt:
 * chevron-tillbaka, `<header>` med `border-b` och `<h1>` = entitetsnamnet
 * (fokusmål), och PRIMÄR ÅTGÄRD I EGET OVILLKORLIGT KORT DIREKT UNDER
 * HEADERN — inte i headern, inte som flytande FAB (`AtgarderKort`-formen).
 *
 * Antalet räknas AUTOMATISKT här, till skillnad från i listan: att öppna ett
 * segment ÄR begäran om att veta vilka som är i det, och en walk på ett
 * medvetet klick är inte hamring.
 */
function SegmentDetalj({
  entitet,
  onTillbaka,
  onSkicka,
}: {
  entitet: SegmentEntitet;
  onTillbaka: () => void;
  onSkicka: () => void;
}) {
  const rubrikRef = useRef<HTMLHeadingElement>(null);
  const { data, isPending, isError, error } = useMedlemmar(entitet, true);
  useVyFokus(rubrikRef, !isPending);

  const handplockad = entitet.rule === null;
  const medlemmar = data?.members ?? [];
  const undertryckta = medlemmar.filter((m) => !m.email || m.ejGodkandMail).length;

  return (
    <SidRam onTillbaka={onTillbaka} tillbakaEtikett="Tillbaka till segmenten">
      <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          <h1
            ref={rubrikRef}
            tabIndex={-1}
            className="min-w-0 font-semibold text-3xl"
            title={entitet.namn}
          >
            {entitet.namn}
          </h1>
          {/* Typ-pillen speglar `EventDetail`s EventKey-pill: metadata till
              höger om rubriken, viker under på smal yta via `basis-full`. */}
          <span className="flex basis-full sm:basis-auto">
            <span className="shrink-0 rounded-full border border-transparent bg-bg-muted px-3 py-1 font-medium text-small text-text-secondary contrast-more:border-border-strong">
              {handplockad ? 'Handplockad lista' : 'Regel'}
            </span>
          </span>
        </div>
        <p className="text-small text-text-muted" aria-live="polite">
          {isPending
            ? 'Räknar personer…'
            : isError
              ? 'Antalet kunde inte räknas'
              : data && data.count === 0
                ? '0 personer matchar - inga med genomförd närvaro ännu'
                : `${data?.count ?? 0} ${data?.count === 1 ? 'person' : 'personer'} i segmentet`}
        </p>
      </header>

      {/* PRIMÄR ÅTGÄRD, EGET OVILLKORLIGT KORT DIREKT UNDER HEADERN —
          `AtgarderKort`s form (`RAD_KLASS` + chevron höger: raden LEDER
          VIDARE, DUKNING § 6 punkt 6). Kortet är ovillkorligt: det står kvar
          även när segmentet är tomt, och knappen blir i stället overksam —
          en yta som försvinner lär man sig aldrig var den fanns. */}
      <div className={`${KORT_KLASS} print:hidden`}>
        <div className="flex flex-col py-1.5">
          <button
            type="button"
            onClick={onSkicka}
            disabled={isPending || (data?.count ?? 0) === 0}
            className={`${RAD_KLASS} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <Send aria-hidden="true" size={16} className="shrink-0" />
            Skicka utskick till det här segmentet
            <ChevronRight
              aria-hidden="true"
              size={18}
              className="ml-auto shrink-0 text-text-secondary"
            />
          </button>
        </div>
      </div>

      {isError && (
        <div className="px-4">
          <MessageBox intent="error" title="Kunde inte räkna segmentet">
            {error instanceof Error ? error.message : 'Okänt fel.'}
          </MessageBox>
        </div>
      )}

      {handplockad ? (
        /* HANDPLOCKAD LISTA — regeln byts mot medlemskapet, allt annat på
           sidan är oförändrat. Det ÄR ställningstagandet: entiteten döljer
           skillnaden för allt nedströms (utskick, mottagarlista, antal).
           Ingången "Lägg till en person" bär `AtgardsSida § MottagarYta`s
           manuella väg in — chevron höger, för raden skulle leda bort. */
        <Grupp id="grupp-medlemskap" rubrik="Medlemskap">
          <EtikettRad term="Typ">Handplockad lista</EtikettRad>
          <EtikettRad term="Källa">Personer valda för hand</EtikettRad>
          <div className="flex flex-col py-1.5">
            <button type="button" disabled className={`${RAD_KLASS} opacity-60`}>
              <UserPlus aria-hidden="true" size={16} className="shrink-0" />
              Lägg till en person
              <ChevronRight
                aria-hidden="true"
                size={18}
                className="ml-auto shrink-0 text-text-secondary"
              />
            </button>
          </div>
          <div className="py-3">
            <p className="text-small text-text-muted">
              Handplockade medlemmar finns inte i datamodellen (DUKNING § 7). Att öppna för det är
              en ADR-064-revision, inte en UI-ändring - den här sidan visar bara hur formen skulle
              te sig.
            </p>
          </div>
        </Grupp>
      ) : (
        <Grupp id="grupp-regel" rubrik="Regeln">
          <EtikettRad term="Inkluderar">
            {entitet.rule && entitet.rule.include.length > 0
              ? entitet.rule.include.map(labelForPar).join(' ELLER ')
              : '-'}
          </EtikettRad>
          <EtikettRad term="Utesluter">
            {entitet.rule && entitet.rule.exclude.length > 0
              ? entitet.rule.exclude.map(labelForPar).join(' ELLER ')
              : 'Inget'}
          </EtikettRad>
          <EtikettRad term="Räknas ur">
            Genomförd närvaro (Närvarande eller Deltog online)
          </EtikettRad>
          <div className="py-3">
            <p className="text-small text-text-secondary">{entitet.definition}</p>
          </div>
        </Grupp>
      )}

      {/* MOTTAGARLISTAN — trygghetstriaden (b). Nästan gratis: compute-svaret
          bär redan `{id, namn, email, ejGodkandMail}` per medlem. */}
      <Grupp id="grupp-personer" rubrik="Personer i segmentet">
        {isPending ? (
          <div role="status" aria-busy="true" className="flex flex-col gap-2 py-3">
            <span className="sr-only">Räknar personer…</span>
            {['a', 'b', 'c', 'd'].map((k) => (
              <Skeleton key={k} variant="text" className="w-2/3 text-body" />
            ))}
          </div>
        ) : medlemmar.length === 0 ? (
          // Domänfälla #34: 0 träffar visas NEUTRALT, aldrig som fel.
          <div className="py-4">
            <p className="text-body">0 personer matchar - inga med genomförd närvaro ännu.</p>
            <p className="pt-1 text-small text-text-muted">
              Det betyder oftast att närvaron inte är avstämd i basen än, inte att segmentet är
              felbyggt.
            </p>
          </div>
        ) : (
          <>
            {undertryckta > 0 && (
              <div className="py-3">
                <p className="text-small text-text-secondary">
                  {undertryckta} av {medlemmar.length} kommer att undertryckas av servern (saknar
                  e-post eller har tackat nej till utskick).
                </p>
              </div>
            )}
            <MottagarLista medlemmar={medlemmar} />
          </>
        )}
      </Grupp>

      <div className="px-4">
        <PrototypNot />
      </div>
    </SidRam>
  );
}

/* ================================================================== *
 * UTSKICKSVYN — eget steg, AtgardsSidans grammatik
 * ================================================================== */

type UtfallsLage = 'allt' | 'delvis' | 'inget';

const SKAL_INGEN_EPOST = 'Saknar e-postadress';
const SKAL_TACKAT_NEJ = 'Har tackat nej till utskick';
const SKAL_EJ_LEVERERAD = 'Kunde inte levereras';

type Utfall = {
  status: 'sent' | 'partial' | 'failed' | 'skipped';
  lyckade: SegmentMember[];
  fallna: { medlem: SegmentMember; skal: string }[];
};

/**
 * [PROTOTYPE] Simulerat utfall — INGET SKICKAS. Klassen HÄRLEDS ur samma
 * regler som `ADR-067` D3, ordagrant efter `AtgardsSida.tsx § simuleraUtfall`:
 * `skipped` skiljs från `failed` på om något ens försöktes.
 *
 * Saknad e-post OCH nekad consent faller ALLTID, i alla tre lägena — det är
 * det enda utfallet klienten faktiskt VET före skick, ur data vi redan läst.
 */
function simuleraUtfall(mottagare: SegmentMember[], lage: UtfallsLage): Utfall {
  const fallna: { medlem: SegmentMember; skal: string }[] = [];
  const kvar: SegmentMember[] = [];
  for (const m of mottagare) {
    if (!m.email) fallna.push({ medlem: m, skal: SKAL_INGEN_EPOST });
    else if (m.ejGodkandMail) fallna.push({ medlem: m, skal: SKAL_TACKAT_NEJ });
    else kvar.push(m);
  }

  let lyckade: SegmentMember[] = [];
  if (lage === 'allt') {
    lyckade = kvar;
  } else if (lage === 'inget') {
    for (const m of kvar) fallna.push({ medlem: m, skal: SKAL_EJ_LEVERERAD });
  } else {
    const gransen = Math.ceil(kvar.length * (2 / 3));
    lyckade = kvar.slice(0, gransen);
    for (const m of kvar.slice(gransen)) fallna.push({ medlem: m, skal: SKAL_EJ_LEVERERAD });
  }

  const forsoktes = fallna.some((f) => f.skal === SKAL_EJ_LEVERERAD);
  const status: Utfall['status'] =
    lyckade.length > 0 && fallna.length === 0
      ? 'sent'
      : lyckade.length > 0
        ? 'partial'
        : forsoktes
          ? 'failed'
          : 'skipped';
  return { status, lyckade, fallna };
}

/** Utfallskortet — `AtgardsSida.tsx § UtfallsKort`: färgen på RADEN säger
    utfallet, texten bär det (färg aldrig ensam bärare). */
function UtfallsKort({ medlem, skal }: { medlem: SegmentMember; skal: string | null }) {
  const lyckades = skal === null;
  return (
    <div className="flex flex-col rounded-xl border border-(--mm-navcard-border) bg-surface contrast-more:border-(--mm-navcard-border-contrast)">
      <div className="flex flex-col px-4 pt-3 pb-2">
        <span className="truncate font-medium text-body">{visningsNamn(medlem)}</span>
        <span className="truncate text-caption text-text-muted">
          {medlem.email ?? 'Ingen e-postadress'}
        </span>
      </div>
      <div
        className={`flex items-center gap-1.5 border-t px-4 py-2 text-caption ${
          lyckades ? 'border-border text-text-muted' : 'border-border text-error'
        }`}
      >
        {lyckades && <Check aria-hidden="true" size={12} strokeWidth={3} className="shrink-0" />}
        {lyckades ? 'Skickat' : skal}
      </div>
    </div>
  );
}

/**
 * UTSKICKET — EGET STEG, aldrig ett block längst ned på byggsidan.
 *
 * Grammatiken är `AtgardsSida.tsx § GranskningsSida`s: konsekvensen först och
 * störst, fynden (ofyllda platshållare, saknad e-post) FÖRE innehållet,
 * mottagarna i sin fulla form, utskicket som mottagaren ser det, grinden
 * sist, och tre lägen på SAMMA yta (granska → skickar → resultat) i stället
 * för en egen bekräftelse-sida.
 *
 * ── MULTI-SEGMENT ────────────────────────────────────────────────────────
 *
 * Edge-funktionens `resolveSegmentMembers` unionerar redan över flera segment
 * och dedupar på person-ID; dagens UI begränsar till ett (DUKNING § 6 punkt 4
 * — obelagt om det är i scope, Marcus har godkänt att just denna variant
 * prövar det). Ytan speglar EF:ens beteende exakt: en `useQueries` per valt
 * segment, union på `member.id`, och ÖVERLAPPET redovisat explicit.
 *
 * Överlappsraden är multi-segmentets hela existensberättigande i formen: utan
 * den är "24 personer" ur två segment om 15 och 12 ett tal Lotta inte kan
 * kontrollräkna, och skillnaden mot 27 är exakt det slags tysta fel ett
 * utskick inte får bära.
 *
 * ── GRINDEN ──────────────────────────────────────────────────────────────
 *
 * SKRIV-FÖR-ATT-BEKRÄFTA mot mottagarantalet (T50 lager a), inte
 * `SlideToConfirm`. Åtgärds-sidan valde draget med motiveringen att läsningen
 * av antalet redan var framtvingad av layouten — varje mottagare stod
 * utskriven, och kvar att skydda mot var det oavsiktliga klicket. Här håller
 * inte det argumentet: unionen över flera segment är ett tal Lotta INTE kan
 * räkna i huvudet, och det är då talet måste läsas aktivt. Formen är alltså
 * vald mot vad som återstår att skydda, precis som där — men svaret blir ett
 * annat eftersom förutsättningen är en annan.
 */
function UtskicksVy({
  entiteter,
  onTillbaka,
}: {
  entiteter: SegmentEntitet[];
  onTillbaka: () => void;
}) {
  const dataSource = useDataSource();
  const rubrikRef = useRef<HTMLHeadingElement>(null);

  const [amne, setAmne] = useState('');
  const [text, setText] = useState('Hej {förnamn},\n\n\n\nVarmt hälsat\nRoger och Lotta');
  const [bekraftText, setBekraftText] = useState('');
  const [lage, setLage] = useState<'granska' | 'skickar' | 'resultat'>('granska');
  const [utfall, setUtfall] = useState<Utfall | null>(null);
  const [protoLage, setProtoLage] = useState<UtfallsLage>('delvis');
  const [testKvitto, setTestKvitto] = useState(false);

  // EN query per valt segment, SAMMA nycklar som listan/detaljen använder →
  // redan räknade segment kostar noll extra walks här.
  const svar = useQueries({
    queries: entiteter.map((e) => ({
      queryKey: queryKeys.segment.sendRecipients(e.id),
      queryFn: () => {
        if (e.rule) return dataSource.computeSegment(e.rule);
        const members = e.handplockade ?? [];
        return Promise.resolve({ members, count: members.length });
      },
      staleTime: 5 * 60_000,
    })),
  });

  const laddar = svar.some((s) => s.isPending);
  useVyFokus(rubrikRef, !laddar);

  /* ETT FALLERAT SEGMENT FÅR ALDRIG KRYMPA UNIONEN TYST.
     Detta var ett verkligt hål i första formen och det är multi-segmentets
     egen risk: unionen byggs ur N oberoende walks, och en av dem som svarar
     med fel bidrar med noll medlemmar utan att synas. Talet i "Utskick till
     N personer" hade då varit FALSKT — på exakt den yta som finns för att
     inte ljuga — och skriv-för-att-bekräfta-grinden hade låst upp mot det
     falska talet, alltså bekräftat fel sak.

     Med ETT segment är felet självrapporterande (noll mottagare, inget att
     skicka). Med flera är det tyst, och det är därför vakten finns här och
     inte i detaljvyn. Sändningen blockeras helt tills alla walks svarat: en
     delmängd som ser komplett ut är farligare än ett stopp. */
  const misslyckade = svar.filter((s) => s.isError).length;

  // UNIONEN, som EF:en gör den: dedup på person-ID. Antalet förekomster bär
  // överlappet — samma person i två segment får ETT mail.
  const forekomster = new Map<string, number>();
  const unionKarta = new Map<string, SegmentMember>();
  for (const s of svar) {
    for (const m of s.data?.members ?? []) {
      unionKarta.set(m.id, m);
      forekomster.set(m.id, (forekomster.get(m.id) ?? 0) + 1);
    }
  }
  const mottagare = [...unionKarta.values()];
  const overlapp = [...forekomster.values()].filter((n) => n > 1).length;
  const summaPerSegment = svar.reduce((n, s) => n + (s.data?.count ?? 0), 0);

  const forsta = mottagare[0];
  const brodtext = fyllPlatshallare(text, forsta);
  const amneVisning = fyllPlatshallare(amne, forsta);
  const ofyllda = [...new Set([...brodtext.ofyllda, ...amneVisning.ofyllda])];
  const utanEpost = mottagare.filter((m) => !m.email).length;
  const nekade = mottagare.filter((m) => m.email && m.ejGodkandMail).length;

  const amneValid = amne.trim() !== '';
  const textValid = text.trim() !== '';
  // T50 lager (a): grinden är låst mot ett KÄNT värde — mottagarantalet.
  // `misslyckade === 0` är en del av "känt": ett tal byggt ur en ofullständig
  // union är inte ett känt värde, det är en gissning som ser exakt ut.
  const bekraftMatch =
    !laddar && misslyckade === 0 && bekraftText.trim() === String(mottagare.length);
  const kanSkicka = amneValid && textValid && mottagare.length > 0 && bekraftMatch;

  function skicka() {
    // T50 lager (c): PESSIMISTISK — ingen optimistisk flip. Läget går
    // granska → skickar → resultat, och resultatet är serverns (här riggens).
    setLage('skickar');
    window.setTimeout(() => {
      setUtfall(simuleraUtfall(mottagare, protoLage));
      setLage('resultat');
    }, 1200);
  }

  const rubrik =
    entiteter.length === 1 ? (entiteter[0]?.namn ?? 'Utskick') : `${entiteter.length} segment`;

  if (lage === 'resultat' && utfall) {
    const antalLyckade = utfall.lyckade.length;
    const antalFallna = utfall.fallna.length;
    const totalt = antalLyckade + antalFallna;
    return (
      <SidRam onTillbaka={onTillbaka} tillbakaEtikett="Tillbaka till segmenten">
        <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
          <h1 ref={rubrikRef} tabIndex={-1} className="font-semibold text-3xl">
            {antalLyckade === 0 ? 'Inget skickades' : 'Skickat'}
          </h1>
        </header>

        <Grupp id="grupp-utfall" rubrik="Mottagare">
          <div className="flex flex-col gap-2 py-4">
            {/* Fallna FÖRST — de är det som återstår att göra något åt. */}
            {utfall.fallna.map(({ medlem, skal }) => (
              <UtfallsKort key={medlem.id} medlem={medlem} skal={skal} />
            ))}
            {utfall.lyckade.map((m) => (
              <UtfallsKort key={m.id} medlem={m} skal={null} />
            ))}
          </div>
        </Grupp>

        <div className="flex flex-col gap-4 px-4">
          {/* T50 lager (c), icke-binärt utfall: noll accepterade renderas
              ALDRIG som grön framgång — neutral varning med uppdelning som
              visar VARFÖR. Intent-/titel-logiken ordagrant ur
              `SegmentMailCompose.tsx` rad 317–346. */}
          <MessageBox
            intent={
              antalLyckade === 0 ? 'warning' : utfall.status === 'partial' ? 'info' : 'success'
            }
            title={
              antalLyckade === 0
                ? 'Ingen fick mailet'
                : utfall.status === 'partial'
                  ? 'Utskicket lyckades delvis'
                  : 'Utskicket lyckades'
            }
          >
            {antalLyckade > 0 && (
              <p>
                <strong>
                  {antalLyckade} av {totalt}
                </strong>{' '}
                {antalLyckade === 1 ? 'person fick' : 'personer fick'} mailet.
              </p>
            )}
            {antalFallna > 0 && (
              <p>
                {antalFallna} fick det inte - skälet står på{' '}
                {antalFallna === 1 ? 'kortet' : 'korten'} ovanför.
              </p>
            )}
          </MessageBox>

          <div className="flex items-center gap-2">
            <Button intent="primary" onPress={onTillbaka}>
              Tillbaka till segmenten
            </Button>
          </div>
        </div>

        {import.meta.env.DEV && (
          <PrototypRigg
            lage={protoLage}
            onValj={setProtoLage}
            onAterstall={() => {
              setUtfall(null);
              setBekraftText('');
              setLage('granska');
            }}
          />
        )}
      </SidRam>
    );
  }

  return (
    <SidRam onTillbaka={onTillbaka} tillbakaEtikett="Tillbaka">
      <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
        <h1 ref={rubrikRef} tabIndex={-1} className="font-semibold text-3xl">
          Utskick
        </h1>
        <p className="text-small text-text-muted">{rubrik}</p>
      </header>

      {/* KONSEKVENSEN FÖRST OCH STÖRST (NN/g) — och T50 lager (b): antalet är
          synligt före sändning, med serverns ägarskap sagt rakt ut. */}
      <p className="px-4 text-lg">
        Utskick till{' '}
        <strong className="font-semibold text-xl tabular-nums" aria-live="polite">
          {laddar || misslyckade > 0 ? '…' : mottagare.length}
        </strong>{' '}
        {mottagare.length === 1 ? 'person' : 'personer'}.
      </p>

      {/* SE VAKTEN vid `misslyckade` ovan: talet döljs och sändningen låses,
          eftersom en ofullständig union ser komplett ut. Felet står FÖRE allt
          annat — det gör resten av sidan otillförlitlig. */}
      {misslyckade > 0 && (
        <div className="px-4">
          <MessageBox intent="error" title="Alla segment kunde inte räknas">
            {misslyckade === 1
              ? 'Ett av segmenten svarade inte, så mottagarlistan är ofullständig.'
              : `${misslyckade} av segmenten svarade inte, så mottagarlistan är ofullständig.`}{' '}
            Utskicket är låst tills alla segment är räknade - annars hade du bekräftat ett antal som
            inte stämmer. Gå tillbaka och försök igen.
          </MessageBox>
        </div>
      )}

      {ofyllda.length > 0 && (
        <div className="px-4">
          <MessageBox intent="warning" title="Något i texten kunde inte fyllas i">
            {ofyllda.join(', ')} står kvar som det är och går ut ordagrant så. Fyll i det för hand i
            texten.
          </MessageBox>
        </div>
      )}

      {(utanEpost > 0 || nekade > 0) && (
        <div className="px-4">
          <MessageBox intent="warning" title="Några kommer inte fram">
            {utanEpost > 0 && <p>{utanEpost} saknar e-postadress.</p>}
            {nekade > 0 && <p>{nekade} har tackat nej till utskick.</p>}
            <p>Servern tar bort dem - de räknas inte som skickade.</p>
          </MessageBox>
        </div>
      )}

      {/* SEGMENTEN — multi-segmentets egen grupp. Med ETT valt segment är den
          en enda rad och nästan gratis; med flera är den den enda platsen där
          unionen går att kontrollräkna. */}
      <Grupp id="grupp-segment" rubrik={entiteter.length === 1 ? 'Segment' : 'Segment i utskicket'}>
        {entiteter.map((e, i) => (
          <div key={e.id} className="flex items-center justify-between gap-4 py-3">
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-body">{e.namn}</span>
              <span className="truncate text-caption text-text-muted">{e.definition}</span>
            </span>
            <span className="shrink-0 text-small text-text-secondary tabular-nums">
              {svar[i]?.isPending ? '…' : (svar[i]?.data?.count ?? 0)}
            </span>
          </div>
        ))}
        {entiteter.length > 1 && (
          <div className="py-3">
            <p className="text-small text-text-secondary">
              {summaPerSegment} platser i segmenten, {mottagare.length} unika personer.{' '}
              {overlapp === 0
                ? 'Ingen finns i mer än ett segment.'
                : `${overlapp} ${overlapp === 1 ? 'person finns' : 'personer finns'} i flera segment och får ETT mail.`}
            </p>
          </div>
        )}
      </Grupp>

      {/* MOTTAGARNA I SIN FULLA FORM — trygghetstriaden (b). */}
      <Grupp id="grupp-mottagare" rubrik="Mottagare">
        {laddar ? (
          <div role="status" aria-busy="true" className="flex flex-col gap-2 py-3">
            <span className="sr-only">Räknar mottagare…</span>
            {['a', 'b', 'c', 'd'].map((k) => (
              <Skeleton key={k} variant="text" className="w-2/3 text-body" />
            ))}
          </div>
        ) : mottagare.length === 0 ? (
          <div className="py-4">
            <p className="text-body">0 personer matchar - inga med genomförd närvaro ännu.</p>
          </div>
        ) : (
          <MottagarLista medlemmar={mottagare} />
        )}
      </Grupp>

      {/* UTSKICKET — ämne + text + förhandsvisning i `DetaljGrupp`-grammatik.
          Ämnesfältet bär `size="sm"` (min-h-8) i en `py-2`-rad = 48 px, exakt
          `EtikettVardeRad`s geometri. */}
      <Grupp id="grupp-utskicket" rubrik="Utskicket">
        <div className="flex items-center justify-between gap-4 py-2">
          <span className="shrink-0 text-small text-text-muted">Ämne</span>
          <Input
            label="Ämne"
            hideLabel
            size="sm"
            value={amne}
            onChange={setAmne}
            className="w-full max-w-80"
            placeholder="Vad handlar mailet om?"
          />
        </div>

        <div className="py-2.5">
          <TextArea label="Meddelande" hideLabel value={text} onChange={setText} rows={7} />
        </div>

        {/* TRYGGHETSTRIADEN (a): förhandsvisning som mottagaren ser den — EN
            NAMNGIVEN mottagare, inte "en mottagare". Var och en får sitt eget
            mail, så det finns ingen enda sann text att visa; att visa den
            FÖRSTA och säga vems den är är ärligare än att visa mallen.
            Plain text, aldrig HTML-render. */}
        <div className="py-3">
          <p className="pb-1.5 text-caption text-text-muted">
            {forsta
              ? `Förhandsvisningsexempel - som ${visningsNamn(forsta)} får det`
              : 'Förhandsvisningsexempel'}
          </p>
          <p className="pb-1.5 text-small text-text-secondary">
            <span className="text-text-muted">Ämne: </span>
            {amneVisning.text || '-'}
          </p>
          <p
            // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable) — samma motiv som AtgardsSida.tsx:2267.
            tabIndex={0}
            className={`${TEXTYTA_KLASS} overflow-auto whitespace-pre-wrap bg-surface text-body text-text-secondary`}
          >
            {brodtext.text}
          </p>
        </div>

        {/* TRYGGHETSTRIADEN (c): "Skicka test till mig". Serverväg SAKNAS tills
            `task-147.1` landar (ny enkel-mottagar-gren i `send-email`, AC #5) —
            knappen finns i FORMEN och är kopplad till en stub, så beroendet
            följer med in i facit + PRD i stället för att glömmas bort.
            Domänfälla #44: en testmail-väg får ALDRIG filtrera på
            adressmönster — Marcus egna adresser är riktiga deltagares. */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3">
          <span className="text-small text-text-muted">
            Skicka ett provmail till dig själv innan du skickar skarpt.
          </span>
          <Button intent="secondary" size="sm" onPress={() => setTestKvitto(true)}>
            <MailCheck aria-hidden="true" size={16} className="shrink-0" />
            Skicka test till mig
          </Button>
        </div>
        {testKvitto && (
          <div className="py-3">
            <MessageBox
              intent="info"
              title="Testmail-vägen finns inte än"
              onDismiss={() => setTestKvitto(false)}
            >
              Knappen är byggd i formen men saknar serverväg tills task-147.1 landar. Ingenting
              skickades.
            </MessageBox>
          </div>
        )}
      </Grupp>

      {/* GRINDEN — T50 lager (a). Fältet nollställs vid varje återgång till
          granska-läget (riggens "Nollställ"), aldrig läckage mellan försök.
          Grön-knapp-regeln (`task-18.16`): utskicket når UTOMSTÅENDE →
          `intent="success"` när det faktiskt går iväg, `primary` innan.
          Grönt betyder "nu går det iväg" och spenderas aldrig på ett
          mellansteg. `danger` är reserverat för destruktiva borttagningar och
          används aldrig här. */}
      <div className="flex flex-col gap-4 px-4">
        <Input
          label={`Skriv antalet mottagare (${laddar || misslyckade > 0 ? '…' : mottagare.length}) för att låsa upp utskicket.`}
          value={bekraftText}
          onChange={setBekraftText}
          autoComplete="off"
          inputMode="numeric"
          isDisabled={laddar || misslyckade > 0 || mottagare.length === 0 || lage === 'skickar'}
          isInvalid={bekraftText.trim() !== '' && !bekraftMatch}
          errorMessage={`Det matchar inte. Skriv ${mottagare.length} för att låsa upp.`}
        />

        <p aria-live="polite" className="min-h-5 text-small text-text-muted">
          {bekraftMatch
            ? `Rätt antal angivet - knappen "Skicka till ${mottagare.length} ${mottagare.length === 1 ? 'person' : 'personer'}" är nu upplåst.`
            : ''}
        </p>

        <div className="flex items-center gap-2">
          <Button
            intent={kanSkicka ? 'success' : 'primary'}
            isDisabled={!kanSkicka || lage === 'skickar'}
            onPress={skicka}
          >
            {lage === 'skickar'
              ? 'Skickar…'
              : `Skicka till ${mottagare.length} ${mottagare.length === 1 ? 'person' : 'personer'}`}
          </Button>
          <Button intent="secondary" onPress={onTillbaka} isDisabled={lage === 'skickar'}>
            Tillbaka
          </Button>
        </div>

        {/* IN-FLIGHT: live-region, ingen fokusflytt (Cloudscape-regeln för
            progress-klassen). Regionen ligger ALLTID i DOM:en. */}
        <div aria-live="polite" aria-busy={lage === 'skickar'} className="min-h-6">
          {lage === 'skickar' && <p className="text-small text-text-muted">Skickar utskicket…</p>}
        </div>

        <PrototypNot />
      </div>

      {import.meta.env.DEV && (
        <PrototypRigg lage={protoLage} onValj={setProtoLage} onAterstall={undefined} />
      )}
    </SidRam>
  );
}

/* ================================================================== *
 * BYGGFLÖDET — medvetet SEKUNDÄRT
 * ================================================================== */

/**
 * NYTT SEGMENT. Formen är avsiktligt minimal: regelverkstaden är variant A:s
 * fråga, inte C:s. Här ska bygget bara vara BILLIGT nog att inte straffa
 * entitets-modellen, och sluta i entiteten — inte i ett utskick.
 *
 * NAMNET FÖRESLÅS AUTOMATISKT ur klartext-speglingen så länge Lotta inte
 * skrivit ett eget. Det är variantens enda mildring av engångs-kostnaden, och
 * den bevarar tesen i stället för att undergräva den: att namnge är
 * fortfarande ett krav, det kostar bara inte längre ett skrivmoment.
 * Alternativet — en "skicka utan att spara"-utgång — hade rivit hela
 * entitets-modellen och byggs medvetet INTE.
 */
function NyttSegment({
  taxonomi,
  laddar,
  onTillbaka,
  onSparat,
}: {
  taxonomi: Par[];
  laddar: boolean;
  onTillbaka: () => void;
  onSparat: (entitet: SegmentEntitet) => void;
}) {
  const rubrikRef = useRef<HTMLHeadingElement>(null);
  const [inkluderade, setInkluderade] = useState<ReadonlySet<string>>(() => new Set());
  const [uteslutna, setUteslutna] = useState<ReadonlySet<string>>(() => new Set());
  const [uteslutOppen, setUteslutOppen] = useState(false);
  const [egetNamn, setEgetNamn] = useState('');
  const uteslutPanelId = useId();
  useVyFokus(rubrikRef, !laddar);

  const rule: SegmentRule = {
    include: taxonomi.filter((p) => inkluderade.has(parKey(p))),
    exclude: taxonomi.filter((p) => uteslutna.has(parKey(p))),
  };
  const harInclude = rule.include.length > 0;

  const definition = harInclude
    ? rule.exclude.length > 0
      ? `Med: deltog i ${rule.include.map(labelForPar).join(' ELLER ')}. Utan: deltog i ${rule.exclude.map(labelForPar).join(' ELLER ')}.`
      : `Med: deltog i ${rule.include.map(labelForPar).join(' ELLER ')}.`
    : '';
  const foreslagetNamn = harInclude ? rule.include.map(labelForPar).join(' + ') : '';
  const namn = egetNamn.trim() || foreslagetNamn;

  const vaxla = (
    set: ReadonlySet<string>,
    satt: (s: ReadonlySet<string>) => void,
    nyckel: string,
    pa: boolean,
  ) => {
    const n = new Set(set);
    if (pa) n.add(nyckel);
    else n.delete(nyckel);
    satt(n);
  };

  const kursRad = (par: Par, vald: boolean, onChange: (v: boolean) => void) => (
    <Checkbox
      key={parKey(par)}
      isSelected={vald}
      onChange={onChange}
      className="group flex cursor-pointer items-center gap-2 py-3 text-body"
    >
      <span className={KRYSSRUTA_KLASS}>
        <Check
          aria-hidden="true"
          size={12}
          className="text-(--mm-checkbox-check) opacity-0 group-data-[selected]:opacity-100"
        />
      </span>
      {labelForPar(par)}
    </Checkbox>
  );

  return (
    <SidRam onTillbaka={onTillbaka} tillbakaEtikett="Tillbaka till segmenten">
      <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
        <h1 ref={rubrikRef} tabIndex={-1} className="font-semibold text-3xl">
          Nytt segment
        </h1>
        <p className="text-small text-text-muted">
          Välj vilka kurser som ska ingå. Antalet räknar personer med genomförd närvaro.
        </p>
      </header>

      <Grupp id="grupp-kurser" rubrik="Kurser som ingår">
        {laddar ? (
          <div role="status" aria-busy="true" className="flex flex-col gap-2 py-3">
            <span className="sr-only">Laddar kurser…</span>
            {['a', 'b', 'c'].map((k) => (
              <Skeleton key={k} variant="text" className="w-1/2 text-body" />
            ))}
          </div>
        ) : taxonomi.length === 0 ? (
          <div className="py-4">
            <p className="text-body text-text-muted">Inga kurser i taxonomin än.</p>
          </div>
        ) : (
          taxonomi.map((par) =>
            kursRad(par, inkluderade.has(parKey(par)), (v) =>
              vaxla(inkluderade, setInkluderade, parKey(par), v),
            ),
          )
        )}
      </Grupp>

      {/* UTESLUTNINGEN ÄR FÄLLD — den är undantaget, inte normalfallet, och
          en dubbelt så lång lista i öppet läge hade gjort bygget dyrare än
          det är. Chevron NED: raden fäller ut här, den leder inte bort. */}
      <div className={`${KORT_KLASS} print:hidden`}>
        <div className="flex flex-col py-1.5">
          <button
            type="button"
            onClick={() => setUteslutOppen(!uteslutOppen)}
            aria-expanded={uteslutOppen}
            aria-controls={uteslutPanelId}
            className={RAD_KLASS}
          >
            <Filter aria-hidden="true" size={16} className="shrink-0" />
            Uteslut kurser
            <span className="ml-auto flex shrink-0 items-center gap-2">
              <span className="text-small text-text-secondary tabular-nums">{uteslutna.size}</span>
              <ChevronDown
                aria-hidden="true"
                size={18}
                className={`text-text-secondary motion-safe:transition-transform ${
                  uteslutOppen ? 'rotate-180' : ''
                }`}
              />
            </span>
          </button>
        </div>
        <div
          id={uteslutPanelId}
          hidden={!uteslutOppen}
          className="flex flex-col divide-y divide-border"
        >
          {taxonomi.map((par) =>
            kursRad(par, uteslutna.has(parKey(par)), (v) =>
              vaxla(uteslutna, setUteslutna, parKey(par), v),
            ),
          )}
        </div>
      </div>

      <Grupp id="grupp-nytt-namn" rubrik="Namn och sammanfattning">
        <div className="py-2">
          {/* PLACEHOLDERN VISAR DET FÖRESLAGNA NAMNET, beskrivningen förklarar
              MEKANIKEN. Första formen sade samma sträng två gånger — en gång
              som placeholder och en gång som "Föreslaget namn: …" under
              fältet — vilket gjorde upprepningen till den enda upplysningen
              och lämnade det Lotta faktiskt behöver veta osagt: att fältet
              får lämnas tomt. */}
          <Input
            label="Namn på segmentet"
            value={egetNamn}
            onChange={setEgetNamn}
            placeholder={foreslagetNamn || 'Välj minst en kurs först'}
            isDisabled={!harInclude}
            description={
              harInclude ? 'Lämnas fältet tomt används det föreslagna namnet.' : undefined
            }
          />
        </div>
        <div className="py-3">
          {harInclude ? (
            <p className="text-body">{definition}</p>
          ) : (
            <p className="text-small text-text-muted">Välj minst en kurs att inkludera.</p>
          )}
        </div>
      </Grupp>

      <div className="flex flex-col gap-3 px-4">
        {/* SPARA ÄR EN NO-OP-STUBB (READ-ONLY FÖRSTÄRKT): entiteten läggs i
            minnet och sidan går till dess detaljvy. Ingenting skrivs till
            basen, varken prod eller staging. Utgången är detaljvyn och inte
            ett utskick — bygga ≠ verkställa, ända in i navigationen. */}
        <Button
          intent="primary"
          isDisabled={!harInclude || namn === ''}
          onPress={() =>
            onSparat({
              id: `nytt-${Date.now()}`,
              namn,
              definition,
              rule,
              handplockade: null,
              skiss: true,
            })
          }
        >
          Spara segment
        </Button>
        <p className="text-small text-text-muted">
          <strong className="font-medium">Prototyp.</strong> Ingenting sparas i basen - segmentet
          läggs i listan så länge sidan är öppen.
        </p>
      </div>
    </SidRam>
  );
}

/* ================================================================== *
 * RIGG + NOT — synligt en rigg, aldrig ytan
 * ================================================================== */

/** `AtgardsSida.tsx § PrototypRigg`, samma streckade form och samma avsikt. */
function PrototypRigg({
  lage,
  onValj,
  onAterstall,
}: {
  lage: UtfallsLage;
  onValj: (l: UtfallsLage) => void;
  onAterstall?: () => void;
}) {
  const val: { nyckel: UtfallsLage; etikett: string }[] = [
    { nyckel: 'allt', etikett: 'Allt gick fram' },
    { nyckel: 'delvis', etikett: 'Delutfall' },
    { nyckel: 'inget', etikett: 'Inget gick fram' },
  ];
  return (
    <div className="mx-4 flex flex-col gap-2 rounded-lg border border-border border-dashed p-3 print:hidden">
      <p className="text-caption text-text-muted">
        <strong className="font-medium">Prototyp-rigg.</strong> Välj vilket utfall som ska
        simuleras. Inget skickas - svaret byggs i webbläsaren.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {val.map((v) => (
          <button
            key={v.nyckel}
            type="button"
            onClick={() => onValj(v.nyckel)}
            aria-pressed={lage === v.nyckel}
            className={`rounded-full px-3 py-1 text-small ${
              lage === v.nyckel
                ? 'bg-bg-emphasized font-medium'
                : 'text-text-secondary hover:bg-bg-muted'
            }`}
          >
            {v.etikett}
          </button>
        ))}
        {onAterstall && (
          <button
            type="button"
            onClick={onAterstall}
            className="ml-auto text-small text-text-secondary underline"
          >
            Granska igen
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Prototyp-not i ytan så Marcus ser vad som inte har datakälla.
 *
 * TVÅ FORMER, för listan bär en upplysning de andra vyerna inte behöver:
 * vilka kort som är basens och vilka som är skisser. Att upprepa den på varje
 * vy hade gjort noten till brus, och två noter under varandra (vilket
 * byggflödet först hade) läser som att något gått sönder.
 */
function PrototypNot({ lang = false }: { lang?: boolean }) {
  return (
    <p className="text-small text-text-muted">
      <strong className="font-medium">Prototyp.</strong>{' '}
      {lang
        ? 'Segmenten med UUID-namn är basens verkliga (CI-fixturer, TASK-87); de med kursnamn är skisser byggda ur riktig taxonomi - men deras antal räknas på riktigt, med samma compute-segment. '
        : ''}
      Inget sparas, inget skickas.
    </p>
  );
}

/* ================================================================== *
 * VARIANTEN
 * ================================================================== */

export function VariantC() {
  const dataSource = useDataSource();
  const [vy, setVy] = useState<Vy>({ namn: 'lista' });
  const [markeraLage, setMarkeraLage] = useState(false);
  const [valda, setValda] = useState<ReadonlySet<string>>(() => new Set());
  /** Segment vars antal någon FAKTISKT bett om — annars räknas ingenting. */
  const [begarda, setBegarda] = useState<ReadonlySet<string>>(() => new Set());
  /** Segment skapade i byggflödet (no-op-stubb: lever bara i minnet). */
  const [nya, setNya] = useState<SegmentEntitet[]>([]);

  const segments = useQuery({
    queryKey: queryKeys.segment.saved,
    queryFn: () => dataSource.listSegments(),
  });

  const events = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: () => dataSource.fetchEvents(),
  });

  const taxonomi = useMemo(() => (events.data ? deriveTaxonomy(events.data) : []), [events.data]);

  const entiteter = useMemo<SegmentEntitet[]>(() => {
    const sparade: SegmentEntitet[] = (segments.data ?? []).map((s) => ({
      id: s.id,
      namn: s.namn ?? '(namnlöst segment)',
      definition: s.definition ?? 'Ingen klartext-definition sparad.',
      rule: s.rule,
      handplockade: null,
      skiss: false,
    }));
    return [...sparade, ...byggSkisser(taxonomi), ...nya];
  }, [segments.data, taxonomi, nya]);

  const begar = useCallback((id: string) => {
    setBegarda((s) => (s.has(id) ? s : new Set(s).add(id)));
  }, []);

  // Esc lämnar markera-läget — `Deltagare.tsx § useMarkeringsLage`s
  // dokument-nivå-lyssnare: läget äger hela listan och fokus kan stå var som
  // helst när Lotta vill backa ur.
  useEffect(() => {
    if (!markeraLage) return;
    const vidTangent = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMarkeraLage(false);
        setValda(new Set());
      }
    };
    document.addEventListener('keydown', vidTangent);
    return () => document.removeEventListener('keydown', vidTangent);
  }, [markeraLage]);

  const oppna = (id: string) => {
    begar(id); // detaljvyn räknar automatiskt — klicket ÄR begäran
    setVy({ namn: 'detalj', id });
  };

  const laddar = segments.isPending || events.isPending;
  const fel = segments.error instanceof Error ? segments.error : null;

  if (vy.namn === 'detalj') {
    const entitet = entiteter.find((e) => e.id === vy.id);
    if (entitet) {
      return (
        <SegmentDetalj
          entitet={entitet}
          onTillbaka={() => setVy({ namn: 'lista' })}
          onSkicka={() => setVy({ namn: 'utskick', ids: [entitet.id] })}
        />
      );
    }
  }

  if (vy.namn === 'utskick') {
    const valdaEntiteter = vy.ids
      .map((id) => entiteter.find((e) => e.id === id))
      .filter((e): e is SegmentEntitet => e !== undefined);
    if (valdaEntiteter.length > 0) {
      return <UtskicksVy entiteter={valdaEntiteter} onTillbaka={() => setVy({ namn: 'lista' })} />;
    }
  }

  if (vy.namn === 'nytt') {
    return (
      <NyttSegment
        taxonomi={taxonomi}
        laddar={events.isPending}
        onTillbaka={() => setVy({ namn: 'lista' })}
        onSparat={(entitet) => {
          setNya((n) => [...n, entitet]);
          begar(entitet.id);
          setVy({ namn: 'detalj', id: entitet.id });
        }}
      />
    );
  }

  return (
    <SegmentLista
      entiteter={entiteter}
      laddar={laddar}
      fel={fel}
      markeraLage={markeraLage}
      valda={valda}
      begarda={begarda}
      onOppnaMarkering={() => setMarkeraLage(true)}
      onStangMarkering={() => {
        setMarkeraLage(false);
        setValda(new Set());
      }}
      onVaxla={(id, vald) =>
        setValda((nu) => {
          const n = new Set(nu);
          if (vald) n.add(id);
          else n.delete(id);
          return n;
        })
      }
      onMarkeraAlla={() => setValda(new Set(entiteter.map((e) => e.id)))}
      onRensa={() => setValda(new Set())}
      onOppna={oppna}
      onNytt={() => setVy({ namn: 'nytt' })}
      onSkicka={() => {
        // Batch-baren VERKSTÄLLER ALDRIG (TASK-145.3): den tar urvalet
        // vidare till utskicksvyn, som är den yta där sändningen bor.
        for (const id of valda) begar(id);
        setVy({ namn: 'utskick', ids: [...valda] });
      }}
      onRakna={begar}
    />
  );
}
