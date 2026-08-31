/**
 * [PROTOTYPE] S90 — DIVERGENS-PASS på persondetalj-sidan. KASTBAR KOD.
 *
 * FRÅGAN (throwaway-kontraktets klausul i):
 *
 *   "Hur ska persondetalj-sidan arrangeras — vad är sidans huvudsak?"
 *
 * TRE STRUKTURELLT OLIKA ARRANGEMANG, nycklar `a`/`b`/`c` (ADR-074 beslut 1),
 * växlingsbara via `?variant=` på den RIKTIGA routen (UI-underform A — riktig
 * auth, riktig datahämtning, riktig täthet; ett vakuum hade fått varje variant
 * att se bra ut):
 *
 *   a — HISTORIK-FÖRST  "vem är detta för oss?"      Engagemanget över tid är
 *                                                     huvudsaken; kontakten är
 *                                                     stöd längre ned.
 *   b — KONTAKT-FÖRST   "hur når jag hen, och vad     Tät identitetszon med
 *                        behöver jag veta nu?"        handlingar överst.
 *   c — TIDSLINJE       "vad har hänt med personen?"  EN kronologisk ström,
 *                                                     nyast överst.
 *
 * Varianterna är oense om STRUKTUR — inte om färg. Grammatiken (§14 chevron,
 * §19 knappvikt, L303 inget interaktivt i interaktivt, tokens-only färg) är
 * DELAD: alla tre ska se ut som samma app. Det är arrangemanget som prövas.
 *
 * Marcus väljer EN. Justeringar vid valet blir BYGGKRAV på kortet — prototypen
 * itereras aldrig i valfasen (L237); helhets-missnöje med det VALDA skelettet
 * öppnar i stället ett konvergens-pass.
 *
 * KASTBAR FRÅN FÖRSTA DAGEN: prototypkod befordras ALDRIG till skarp
 * implementation (klausul iv). Rivning = `git rm` på denna fil + återställ
 * prototyp-grenen i `src/routes/_authenticated/personer/$personId.tsx`. Ingen
 * annan fil bär prototyp-kod.
 *
 * DEV-grindad via routens `import.meta.env.DEV`-gren (ADR-044-mekaniken).
 * Datavägen ÄRVS oförändrad (`useDataSource`, ADR-055/057). READ-ONLY
 * FÖRSTÄRKT: anteckningens Redigera-knapp är en no-op-stub — en prototyp
 * skriver aldrig, varken mot prod eller staging (prototype-skillen §Miljö).
 */
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { CalendarCheck, ChevronRight, Download, UserPlus } from 'lucide-react';
import { type ComponentType, useEffect, useRef } from 'react';
import { PersonBetalningar } from '@/components/betalningar/PersonBetalningar';
import { MessageBox } from '@/components/primitives/MessageBox';
import { SidRam } from '@/components/primitives/SidRam';
import { Skeleton } from '@/components/primitives/Skeleton';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import type { PersonDetail as PersonDetailType, PersonHistoryEntry } from '@/domain/schemas';
import { betalningarPa } from '@/lib/funktionsflaggor';
import { type KursfargKlass, kursfargForKurs } from '@/lib/kursfarg';
import { queryKeys } from '@/queries/keys';
// D-variantens SKARPA ytor (`#1151`). a/b/c rör dem aldrig — de behåller sina
// no-op-stubbar, eftersom en prototyp aldrig skriver. D är undantaget med
// avsikt: den är konvergens-vinnaren och ska prövas som den kommer att bli.
import { PersonAnteckningar } from './PersonAnteckningar';
import { PersonFlagEditor } from './PersonFlagEditor';

// ═════════════════════════════════════════════════════════════════════════
// DELAD GRAMMATIK — det som INTE får skilja varianterna åt
// ═════════════════════════════════════════════════════════════════════════

const DATUM_LANG = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const DATUM_KORT = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' });

/** ISO-datum/datetime → svensk långform; oparsbart värde visas RÅTT (aldrig tyst bort). */
function langtDatum(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : DATUM_LANG.format(d);
}

/**
 * Telefonnummer → `tel:`-href.
 *
 * RFC 3966 tillåter bara siffror och ett ledande `+` i number-delen; allt
 * annat är "visual separators" som ska bort. Den tidigare formen strippade
 * ENBART blanksteg (`replace(/\s/g, '')`), så basens svenska skrivsätt
 * "070-233 14 56" blev `tel:070-2331456` — bindestrecket kvar mitt i numret.
 * De flesta uppringare tolererar det, men inte alla, och en `tel:`-länk som
 * tyst ringer fel nummer är dyrare än en som inte fungerar alls.
 */
function telHref(nummer: string): string {
  const ledandePlus = nummer.trimStart().startsWith('+');
  return `tel:${ledandePlus ? '+' : ''}${nummer.replace(/\D/g, '')}`;
}

const DATUM_DAG_MANAD = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long' });

/**
 * Kursens KORTNAMN i tidslinjen — "FS", "RIM 2".
 *
 * Nyckeln är KLASSEN, inte kursnamnet: kurs→klass-mappningen bor kvar på sitt
 * enda ställe (`kursfargForKurs`, ADR-064) och det här är en andra VY på samma
 * klassificering, inte en andra tabell som kan glida isär.
 *
 * VARFÖR INTE `farg.etikett` RAKT AV (Marcus 2026-08-12: *"Fjärrskådning kan
 * vi förkorta också till FS så vi är konsekventa där"*): `etikett` renderas i
 * TVÅ skarpa vyer utanför persondetaljen — kalenderns dagplattor och legend
 * (`EventsCalendar.tsx:237,352`) och gruppdynamikens kursmix
 * (`Gruppdynamik.tsx:175`). Att byta `Fjärrskådning` → `FS` där hade ändrat
 * båda utan att någon bett om det, och i en LEGEND som förklarar färgkoder är
 * "FS" kryptiskt på ett sätt "RIM 1" inte är (den förkortningen är etablerad
 * i basens egen formel, ADR-108 § Kontext; "FS" är ny i dag).
 *
 * Vill vi ha FS överallt är det ETT ord i `kursfarg.ts` — men det är ett eget
 * beslut om två andra vyer, inte en bieffekt av persondetaljen.
 *
 * `annat`-klassen är uppsamlingen: där finns inget kortnamn, så kursens EGET
 * namn används. Samma idiom som `kursmix()`.
 */
const KURS_KORTNAMN: Readonly<Partial<Record<KursfargKlass, string>>> = {
  fjarrskadning: 'FS',
  rim1: 'RIM 1',
  rim2: 'RIM 2',
  rim3: 'RIM 3',
};

function kursEtikett(kursnamn: string | null): string | null {
  if (!kursnamn) return null;
  return KURS_KORTNAMN[kursfargForKurs(kursnamn).klass] ?? kursnamn;
}

/**
 * TIDSLINJENS MENINGAR — en per radtyp, komponerade i APPEN.
 *
 * Marcus 2026-08-12, de tre exakta formerna:
 *
 *   Anmälde sig till Fjärrskådning i Varberg 6 september
 *   Deltog på RIM 2 i Kalmar
 *   Hämtade Pyramidernas vajrar
 *
 * REGELN BAKOM ATT BARA ANMÄLAN BÄR DATUM (*"Nu är det datum och text som
 * skrivs ut olika huller om buller"*): radens VÄNSTERKOLUMN säger redan när
 * raden hände. Deltagandet ÄR eventdagen och hämtningen ÄR hämtningsdagen —
 * ett datum i meningen hade upprepat kolumnen. Anmälan är det enda undantaget:
 * den hände en dag och pekar på ett event en ANNAN dag, och utan det datumet
 * går två anmälningar till samma kurs inte att skilja åt.
 *
 * INGEN AV DEM BÄR UNDERRUBRIK. Ort, typ, "skrev en motivering" och
 * hämtningens förklaringsrad är borta — allt som ska sägas ryms i meningen.
 *
 * VARFÖR APPEN OCH INTE BASEN, trots ADR-108: beslut 2:s undantag gäller tre
 * NAMNGIVNA fält (`Senaste interaktion (text)` / `Senaste anmälan
 * (sammanfattning)` / `Deltog sammanfattning`) och motiveras av att Airtables
 * Interface-sida läser dem. Tidslinjens per-rad-mening är inget av dem och
 * har ingen Interface-konsument, så beslut 1 gäller: ordval och ordföljd på
 * en redan avgjord fakta-mängd hör i appen. Dessutom KAN basens mening inte
 * återanvändas här — `Senaste anmälan (sammanfattning)` fylls med avsikt
 * ENDAST på personens senaste anmälan (data-model.md § Grinden), så tre av
 * Sofia Isakssons fyra anmälningar har fältet tomt.
 */
function anmalningsRubrik(kurs: string | null): string {
  const kursnamn = kursEtikett(kurs);
  return kursnamn ? `Anmälde sig till ${kursnamn}` : 'Anmälde sig';
}

function deltagandeRubrik(kurs: string | null): string {
  const kursnamn = kursEtikett(kurs);
  return kursnamn ? `Deltog på ${kursnamn}` : 'Deltog';
}

/**
 * Underraden: "i Falköping 18 augusti" — VAR och VILKET TILLFÄLLE, aldrig
 * radens eget datum (det bor i högerkolumnen).
 */
function platsOchTillfalle(ort: string | null, eventDatum: string | null): string | null {
  const tid = eventDatum ? new Date(eventDatum) : null;
  const datum = tid && !Number.isNaN(tid.getTime()) ? DATUM_DAG_MANAD.format(tid) : null;
  return [ort ? `i ${ort}` : null, datum].filter(Boolean).join(' ') || null;
}

/**
 * Motiveringsblockets metarubrik: "● Fjärrskådning · 18 augusti 2026 ·
 * Varberg" (Marcus 2026-08-12 — *"det är just vad det är en motivering FÖR"*,
 * förkortat i två steg samma dag: *"det räcker nog med att skriva 'Anmälan
 * till' istället för 'För anmälan till'"*, och därefter *"om vi tar bort
 * 'Anmälan till' så blir det nog jättebra, då börjar rubriken med
 * färgpricken"*).
 *
 * Ledtexten bar ingen information blockets egen rubrik ("Motiveringar") inte
 * redan gav — raden under den kan bara vara vad motiveringen avser. Kvar står
 * referensen själv, och färgpricken blir radens ingång.
 *
 * FULLT kursnamn och FULLT datum med årtal, till skillnad från tidslinjens
 * "FS · 18 augusti". Det är avsiktligt: tidslinjen är en ström man skannar
 * där utrymmet är trångt och året framgår av år-rubriken; den här raden är en
 * REFERENS som ska gå att läsa lösryckt ur sitt sammanhang. Ordningen är
 * Marcus egen (kurs → datum → ort), inte tidslinjens (kurs → ort → datum).
 *
 * VARFÖR DEN INTE LÄNGRE ÄR EN REN STRÄNG (Marcus 2026-08-12: *"vi kan inte
 * bara skriva ut den så rakt av … nu krockar siffrorna i textraden när datum
 * kommer direkt efter Resor i medvetandet 2 till exempel"*). Mellanslag-
 * sammanfogningen gav "Resor i medvetandet 2 11 februari 2026" — två siffror
 * i rad utan gräns, där kursens stegsiffra läses ihop med datumets dag.
 *
 * FORMEN ÄR APPENS, INGEN NY MINTAD. Marcus föreslog en pill runt kursnamnet;
 * repot har ingen sådan (sökt igenom `kursfargForKurs`-konsumenterna), och de
 * TVÅ mönster som FINNS för exakt den här särskiljningen räcker och används
 * båda här:
 *
 *  · **Kursfärgs-prick + namn** — `AnmalanDetail.tsx:397` (Avser-blockets
 *    kontextrad, `size-2.5 rounded-full`) och `Gruppdynamik.tsx:183`
 *    (`h-3.5 w-1`). Pricken är gränsen som saknades, och bär dessutom kursens
 *    identitet utan ett ord.
 *  · **` · `-separator** — den rivna `AnmalningarList.tsx`s
 *    `[eventNamn, datum].join(' · ')` (numera `AnmalningarSida.tsx`,
 *    `TASK-299.5`), samt D:s egna Eventhistorik- och Just nu-rader. Samma
 *    vy använde alltså redan separatorn på två andra ställen;
 *    motiveringsraden var undantaget.
 *
 * Separatorerna är `aria-hidden` — de är en visuell gräns, inte innehåll, och
 * en skärmläsare som läser "punkt" mellan varje led vinner ingenting.
 */
function MotiveringsReferens({
  kurs,
  eventDatum,
  ort,
}: {
  kurs: string | null;
  eventDatum: string | null;
  ort: string | null;
}) {
  if (!kurs && !eventDatum && !ort) {
    return <span className="text-small text-text-muted">Anmälan utan känt event</span>;
  }
  const farg = kursfargForKurs(kurs);
  // Leden efter kursnamnet, i Marcus ordning (datum → ort).
  const efterled = [eventDatum ? langtDatum(eventDatum) : null, ort].filter(Boolean) as string[];
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-small text-text-muted">
      {kurs && (
        <>
          <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${farg.bgClass}`} />
          <span className="font-medium text-text-secondary">{kurs}</span>
        </>
      )}
      {efterled.map((led) => (
        <span key={led} className="flex items-center gap-x-1.5">
          <span aria-hidden="true">·</span>
          {led}
        </span>
      ))}
    </span>
  );
}

/**
 * Erbjudandets NAMN, eller null när det inte finns något.
 *
 * `Touchpoints.Erbjudande` är en singleSelect vars tredje val är den generiska
 * catch-allen `"Annat"` (live-verifierat mot schemat 2026-08-12: choices är
 * `Meditationen Kraftfältet`, `Pyramidernas Vajrar`, `Annat`). Marcus
 * 2026-08-12: *"Ta bort 'Annat' - vi har inget som heter Annat."* Värdet är
 * inte ett erbjudandes namn utan frånvaron av ett, och behandlas därför som
 * saknat — precis som `null`.
 *
 * Basens egen `TP sammanfattning`-formel gör samma sak fel ("Hämtade Annat")
 * och är en T16-maximeringskandidat; den lappas INTE härifrån.
 */
function erbjudandeNamn(erbjudande: string | null): string | null {
  return erbjudande && erbjudande !== 'Annat' ? erbjudande : null;
}

/*
 * `dagarMellan` RIVEN 2026-08-12. Den räknade kalenderdagar BAKÅT för raden
 * "Senast för N dagar sedan: …" i "Just nu" — en rad som försvann samma dag
 * när blocket byggdes om till att bära bara aktiva anmälningar (Marcus:
 * *"Du blandar historik och aktuellt"*). Ingen annan konsument fanns; en
 * hjälpare utan anrop är död kod, inte en tillgång i beredskap.
 */

/**
 * Sammansatt visningsnamn — IDENTISK med skarpa vyns (PersonDetail.tsx:16-23).
 *
 * ÄRLIG NOT som gäller ALLA TRE varianterna: basens `Namn` är en formel som
 * skriver STRÄNGEN "Ej tillgängligt" när båda namnfälten är tomma (fälla 43).
 * Fallbacken nedan når därför aldrig fram i drift för en namnlös lead —
 * rubriken blir bokstavligen "Ej tillgängligt". Det syns i den tunna personens
 * bilder i alla tre varianterna och är ett DELAT problem, inte en
 * variant-skillnad.
 */
function displayName(person: PersonDetailType): string {
  if (person.namn) return person.namn;
  const composed = [person.fornamn, person.efternamn].filter(Boolean).join(' ');
  if (composed) return composed;
  return person.email ? `Namnlös person - ${person.email}` : 'Namnlös person';
}

type PillTon = 'neutral' | 'aktiv' | 'kommande';

/**
 * Pill-formen ur `Gruppdynamik.tsx:106-112`. `bg-surface` när pillen sitter
 * INUTI en tonal kortyta (en pill i kortets egen ton vore osynlig);
 * `bg-bg-muted` på ren bakgrund.
 *
 * `kommande`-tonens KONTUR FÖLJER TEXTEN (Marcus 2026-08-12: *"pillens kontur
 * är inte samma som pill-texten"*). Den bar `border-border-strong` mot
 * `text-text-secondary` — två skilda gråtoner, mätt i browsern till kontur
 * `rgb(196,196,194)` (`--p-neutral-300`) mot text `rgb(82,81,81)`
 * (`--p-neutral-600`). Kombinationen var inte ett designval utan två
 * oberoende token-val som aldrig jämfördes.
 *
 * `border-current` binder konturen till `color` i stället för att upprepa
 * tokenet, så de kan aldrig glida isär igen — byts textfärgen följer konturen
 * med.
 */
function Pill({
  ton = 'neutral',
  paKortyta = true,
  children,
}: {
  ton?: PillTon;
  paKortyta?: boolean;
  children: React.ReactNode;
}) {
  const tonKlass =
    ton === 'aktiv'
      ? 'bg-primary-tint text-text'
      : ton === 'kommande'
        ? 'border border-current text-text-secondary'
        : paKortyta
          ? 'bg-surface text-text-secondary'
          : 'bg-bg-muted text-text-secondary';
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 font-medium text-caption ${tonKlass}`}>
      {children}
    </span>
  );
}

/**
 * Sektionskortet — eventsidans grupp-grammatik (DetaljGrupp.tsx:24-37):
 * rubriken står UTANFÖR den tonala kortytan, indragen till kortets inner-inset
 * ("där rundningen slutar"). Delad av alla tre varianterna: kortformen är
 * grammatik, inte arrangemang.
 */
function Sektion({
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
      <div className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong">
        {children}
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// HÄRLEDNINGAR ur historiken — delade av a och c, komprimerade i b
// ═════════════════════════════════════════════════════════════════════════

type EventGrupp = {
  nyckel: string;
  rubrik: string;
  kursnamn: string | null;
  datum: string | null;
  tidMs: number;
  ort: string | null;
  typ: string | null;
  /**
   * Länkmålets två halvor, lyfta ur gruppens FÖRSTA post. Ett tvådagars-event
   * ger två Deltagande-rader som delar både Event- och Anmälnings-länk
   * (live-verifierat på Sofia Isakssons RIM 2 2026-08-12: `recEH7NvNcpmMDv3R`
   * och `recDDWmkD39PYvlYs` bär båda anmälan `recEgSKAjvUeVeVPA`) — den
   * första posten är därför representativ för hela gruppen.
   */
  eventId: string | null;
  registrationId: string | null;
  poster: PersonHistoryEntry[];
};

/**
 * Länkmål till anmälningsdetaljen — bara när BÅDA halvorna finns.
 *
 * Routen `/event/$eventId/anmalan/$registrationId` kan inte lösas av en halv
 * uppsättning, så en grupp som saknar endera renderas oklickbar i stället för
 * att länka fel. Samma regel som anmälnings-posterna redan följer för sitt
 * `eventId` (byggStrom steg 2).
 */
function anmalanHref(
  eventId: string | null,
  registrationId: string | null,
): { to: string; params: Record<string, string> } | undefined {
  if (!eventId || !registrationId) return undefined;
  return {
    to: '/event/$eventId/anmalan/$registrationId',
    params: { eventId, registrationId },
  };
}

/**
 * Grupperar historikens SESSIONS-rader per EVENT.
 *
 * Nödvändigt, inte kosmetiskt: ett tvådagars-event ger TVÅ deltagande-rader
 * (Dag 1 + Dag 2). Dagens vy listar dem som två likvärdiga poster, så en
 * person med fem event ser ut att ha tio.
 *
 * BÅDA ORDNINGARNA SÄTTS HÄR, ingen ärvs implicit ur EF-svaret:
 *
 * - **Sessionerna inom ett event: STIGANDE** ("Dag 1" före "Dag 2").
 *   `get-person` sorterar Deltaganden på `Event startdatum`, som är IDENTISKT
 *   för alla sessioner i samma event — den sorteringen kan alltså inte skilja
 *   dem åt, och ordningen föll tillbaka på Airtables radordning. Skarpt mätt
 *   på Sofia Isaksson 2026-08-12: `Resor i medvetandet 2` kom ur EF:en med
 *   Dag 2 FÖRE Dag 1, och renderades så i både strömmen och eventhistoriken.
 * - **Grupperna: DATUM-DESC**, explicit. EF:en levererar redan den ordningen,
 *   men `aria-label="Eventhistorik, senaste först"` är ett LÖFTE — att låta
 *   det vila på insättningsordningen i en Map gör löftet beroende av att en
 *   EF i ett annat lager aldrig ändrar sin sort. Datumlösa grupper (`tidMs`
 *   0) hamnar sist, samma regel som EF:ens `sortDatumDescNullsLast`.
 */
function grupperaPerEvent(historik: PersonHistoryEntry[]): EventGrupp[] {
  const grupper = new Map<string, EventGrupp>();
  for (const entry of historik) {
    const nyckel = entry.eventLabel ?? entry.kursnamn ?? entry.id;
    const befintlig = grupper.get(nyckel);
    if (befintlig) {
      befintlig.poster.push(entry);
      continue;
    }
    const tid = entry.datum ? Date.parse(entry.datum) : Number.NaN;
    grupper.set(nyckel, {
      nyckel,
      rubrik: entry.kursnamn ?? entry.eventLabel ?? 'Okänt event',
      kursnamn: entry.kursnamn,
      datum: entry.datum,
      tidMs: Number.isFinite(tid) ? tid : 0,
      ort: entry.ort,
      typ: entry.typ,
      eventId: entry.eventId,
      registrationId: entry.registrationId,
      poster: [entry],
    });
  }
  const ut = [...grupper.values()];
  for (const grupp of ut) {
    // `numeric` så "Dag 2" < "Dag 10"; sessionslösa rader sist.
    grupp.poster.sort((a, b) => {
      if (a.session === b.session) return 0;
      if (a.session == null) return 1;
      if (b.session == null) return -1;
      return a.session.localeCompare(b.session, 'sv', { numeric: true });
    });
  }
  ut.sort((a, b) => b.tidMs - a.tidMs);
  return ut;
}

type Narvarolage = 'kommande' | 'narvarande' | 'franvarande';

/**
 * TREDJE TILLSTÅNDET — den defekt som dagens vy bär.
 *
 * `PersonDetail.tsx:44` skriver `entry.narvaro ? 'Närvarande' : 'Ej närvaro'`.
 * `narvaro` är `Närvaropoäng === 1` och är därför `false` för varje FRAMTIDA
 * event — vyn påstår alltså "Ej närvaro" om en kurs som inte hänt än. Alla tre
 * varianterna härleder i stället ett tredje läge ur datumet mot nu.
 */
function narvarolage(entry: PersonHistoryEntry, nuMs: number): Narvarolage {
  const tid = entry.datum ? Date.parse(entry.datum) : Number.NaN;
  if (Number.isFinite(tid) && tid > nuMs) return 'kommande';
  return entry.narvaro ? 'narvarande' : 'franvarande';
}

/** Sessionsradens pill-text: "Dag 1 · Närvarande" / "Dag 1 · Kommande". */
function sessionsEtikett(entry: PersonHistoryEntry, lage: Narvarolage): string {
  const status =
    lage === 'kommande'
      ? 'Kommande'
      : lage === 'narvarande'
        ? (entry.status ?? 'Närvarande')
        : (entry.status ?? 'Ej närvaro');
  return entry.session ? `${entry.session} · ${status}` : status;
}

// ═════════════════════════════════════════════════════════════════════════
// INTERAKTIONSSTRÖMMEN — D:s tidslinje
// ═════════════════════════════════════════════════════════════════════════

type StromSlag = 'event' | 'touchpoint' | 'hamtning' | 'registrerad' | 'anmalan';

type StromPost = {
  id: string;
  tidMs: number;
  ar: number;
  datumText: string;
  slag: StromSlag;
  kommande: boolean;
  rubrik: string;
  meta: string | null;
  prickKlass: string;
  /** Ikonen i nodcirkeln. */
  ikon?: ComponentType<{ size?: number; 'aria-hidden'?: boolean; className?: string }>;
  /** Länkmål när raden leder någonstans — anmälningar → AnmalanDetail. */
  href?: { to: string; params: Record<string, string> };
  pillar: { id: string; text: string; ton: PillTon }[];
};

const HAMTNING_DATUM = /\((\d{4}-\d{2}-\d{2})\)\s*$/;

/**
 * Varifrån strömmens ANMÄLNINGAR och HÄMTNINGAR kommer. Ett val, två block —
 * de delar källa eftersom de delar EF-utökning (`#1149`).
 *
 * `rollup` — den GAMLA vägen: `allaHamtningar`-strängarna med regex-plockat
 *   datum, och `senasteInteraktion`-formeln som EN klumpad post. Variant C
 *   använder den och SKA fortsätta göra det: C finns för att visa sin ärliga
 *   svaghet, och en tyst uppgradering hade raderat just det varianten bevisar.
 * `poster` — `person.hamtningar` + `person.motiveringar`, riktiga Touchpoint-
 *   och Anmälnings-poster med riktiga datum. Variant D använder den.
 *
 * Explicit parameter, aldrig en fallback av typen "ta poster om de finns" —
 * en sådan hade gjort C:s svaghet osynlig så fort datat blev bättre.
 *
 * NAMNET var `Hamtningskalla` fram till 2026-08-12; parametern styr sedan dess
 * två block, inte ett.
 */
type Datakalla = 'rollup' | 'poster';

function byggStrom(
  person: PersonDetailType,
  nuMs: number,
  hamtningskalla: Datakalla,
): {
  poster: StromPost[];
  oplacerade: string[];
  registrerad: StromPost | null;
} {
  const poster: StromPost[] = [];
  const oplacerade: string[] = [];

  const lagg = (post: Omit<StromPost, 'ar' | 'datumText'>) => {
    const d = new Date(post.tidMs);
    poster.push({
      ...post,
      ar: d.getFullYear(),
      datumText: DATUM_KORT.format(d),
    });
  };

  // 1. Eventen — en post per EVENT (sessionerna blir pillar i posten).
  for (const grupp of grupperaPerEvent(person.historik)) {
    if (!grupp.tidMs) {
      oplacerade.push(grupp.rubrik);
      continue;
    }
    const farg = kursfargForKurs(grupp.kursnamn);
    const kommande = grupp.tidMs > nuMs;
    lagg({
      id: `event-${grupp.nyckel}`,
      tidMs: grupp.tidMs,
      slag: 'event',
      kommande,
      // RUBRIK bär handlingen, UNDERRAD bär platsen. Ett KOMMANDE event är
      // inget personen deltagit på — där står kursen ensam, inte "Deltog på".
      rubrik: kommande
        ? (kursEtikett(grupp.kursnamn) ?? grupp.rubrik)
        : deltagandeRubrik(grupp.kursnamn),
      // Deltagandet ÄR eventdagen → inget eventdatum i underraden, bara orten.
      // Radens datum står i högerkolumnen.
      meta: grupp.ort ? `i ${grupp.ort}` : null,
      prickKlass: farg.bgClass,
      ikon: CalendarCheck,
      // KLICKBAR ENDAST NÄR POSTEN ÄR KOMMANDE (Marcus 2026-08-12: *"Kommande
      // händelsen borde ju också vara en knapp med länk till anmälan som de
      // andra"*). Snittet är avsiktligt och inte en halvmesyr:
      //
      // Anmälnings-posterna (steg 2) bär ALLTID `kommande: false` och hamnar
      // därför på sitt ANMÄLNINGSDATUM i historiken. Under rubriken "Kommande"
      // finns alltså BARA event-posten — utan denna href vore anmälan
      // onåbar därifrån. En HISTORISK event-post har däremot redan sin egen
      // klickbara anmälnings-post i samma ström; att länka båda hade gett två
      // rader till samma anmälan.
      href: kommande ? anmalanHref(grupp.eventId, grupp.registrationId) : undefined,
      // KOMMANDE POSTER BÄR INGA SESSIONS-PILLAR. "Dag 1 · Kommande" på ett
      // event som inte hänt säger ingenting utöver vad rubriken "Kommande"
      // och datumet redan sagt — närvaron är inte ett utfall än, den är en
      // tom platshållare (Marcus 2026-08-12: *"Ingen 'Dag 1 - kommande' pill
      // på kommande-händelsen, så ologiskt och fult"*). Historiska poster
      // behåller sina pillar: där ÄR närvaron ett utfall.
      pillar: kommande
        ? []
        : grupp.poster.map((entry) => {
            const lage = narvarolage(entry, nuMs);
            return {
              id: entry.id,
              text: sessionsEtikett(entry, lage),
              ton: (lage === 'kommande' ? 'kommande' : 'neutral') as PillTon,
            };
          }),
    });
  }

  // 2. Anmälningarna — TVÅ KÄLLOR, samma axel som hämtningarna nedan.
  //
  //   `poster` — RIKTIGA Anmälnings-poster (`person.motiveringar`, samma batch
  //     B6 läser): en post per anmälan, med eget event och eget datum.
  //   `rollup` — den GAMLA vägen: EN syntetisk post vars rubrik är
  //     basformeln `Senaste interaktion (text)` rå.
  //
  // BYTET ÄR INTE KOSMETISKT. Den formeln väljer mellan tre källrollups och
  // returnerar den valda ORÖRD; är källan fler-värd konkatenerar Airtable
  // elementen UTAN avgränsare (data-model.md §46). Skarpt mätt på Sofia
  // Isaksson 2026-08-12, verbatim ur EF-svaret:
  //
  //   "Anmälde sig till RIM 1 i FalköpingAnmälde sig till RIM 2 i Falköping\
  //    Anmälde sig till Fjärrskådning i Falköping"
  //
  // Tre meningar i en klump, renderade rått både här i strömmen och i "Just
  // nu". Anmälningarna finns redan som riktiga poster i samma svar — strängen
  // behövs inte för att veta vad som hänt, och en post per anmälan placerar
  // dessutom var och en på SITT datum i stället för att klumpa ihop dem på
  // det senaste. Bas-defekten är kvar och är Marcus/ADR-063-mark; det som
  // åtgärdas här är att vyn LÄSER ett fält den inte behöver.
  //
  // C behåller rollup-vägen, av exakt samma skäl C behåller regex-hämtningarna
  // (se Hamtningskalla-noten): en variant som finns för att visa sin ärliga
  // svaghet får inte tyst uppgraderas.
  if (hamtningskalla === 'poster') {
    for (const anmalan of person.motiveringar) {
      const tid = anmalan.datum ? Date.parse(anmalan.datum) : Number.NaN;
      const rubrik = anmalningsRubrik(anmalan.event);
      if (!Number.isFinite(tid)) {
        oplacerade.push(rubrik);
        continue;
      }
      lagg({
        id: `anmalan-${anmalan.id}`,
        tidMs: tid,
        slag: 'anmalan',
        kommande: false,
        rubrik,
        // UNDERRADEN bär eventets plats OCH datum — anmälan är enda radtypen
        // som pekar på ett annat tillfälle än sitt eget. "skrev en motivering"
        // är borta (Marcus 2026-08-12: *"En motivering är valfritt … det är
        // alltså INTE en händelse, anmälan är händelsen"*); motiveringarna har
        // sitt eget block (B6).
        meta: platsOchTillfalle(anmalan.ort, anmalan.eventDatum),
        prickKlass: 'bg-text-secondary',
        ikon: UserPlus,
        // KLICKBAR till anmälningsdetaljen (Marcus: *"Man måste också kunna
        // trycka på ALLA aktiva och historiska anmälningar och KOMMA TILL den
        // specifika anmälan"*). Routen kräver BÅDA ID:na; saknas event-länken
        // (backfill) renderas raden oklickbar i stället för att länka fel.
        href: anmalan.eventId
          ? {
              to: '/event/$eventId/anmalan/$registrationId',
              params: { eventId: anmalan.eventId, registrationId: anmalan.id },
            }
          : undefined,
        pillar: [],
      });
    }
  } else {
    // Fram till 2026-08-10 bar strängen sitt EGET datum inbakat ("2026-09-12
    // 18:04 – Inskickad anmälan"), vilket dubblerade mot rälsens etikett —
    // därför togs det bort ur basformeln samma dag (samma ändring som
    // PersonsList.tsx dokumenterar — filen hette PersonsListPrototyp.tsx
    // innan promoveringen, ADR-103 B2 steg 4). `senasteInteraktionDatum` är
    // sedan dess ENDA datumkällan; `tidMs` läser den, aldrig strängen.
    const tpTid = person.senasteInteraktionDatum
      ? Date.parse(person.senasteInteraktionDatum)
      : Number.NaN;
    if (person.senasteInteraktion && Number.isFinite(tpTid)) {
      lagg({
        id: 'touchpoint-senaste',
        tidMs: tpTid,
        slag: 'touchpoint',
        kommande: false,
        rubrik: person.senasteInteraktion,
        meta: 'Senaste registrerade interaktionen',
        prickKlass: 'bg-text-secondary',
        pillar: [],
      });
    }
  }

  // 3. Hämtningarna — två källor, se Hamtningskalla-noten ovan.
  if (hamtningskalla === 'poster') {
    // RIKTIGA poster: `datum` är ett eget fält, inget regex. En post utan datum
    // hamnar bland de oplacerade i stället för att tappas.
    for (const h of person.hamtningar) {
      const tid = h.datum ? Date.parse(h.datum) : Number.NaN;
      // MENINGEN: "Hämtade Pyramidernas Vajrar" — och INGEN annan form.
      //
      // En touchpoint utan erbjudandenamn (`null`, eller catch-allen "Annat",
      // se `erbjudandeNamn`) RENDERAS INTE ALLS. Marcus 2026-08-12: *"Nu har
      // du fortfarande en händelse som heter 'Hämtade ett erbjudande' bara,
      // BORT med den. INGET sånt, det ska ju stå 'Hämtade (namnet på
      // erbjudandet)'."*
      //
      // Konsekvensen är medveten och värd att skriva ut: posten FINNS i basen
      // men syns inte i vyn. En rad som bara säger att något hämtades, utan
      // vad, bär ingen information Lotta kan handla på — och den generiska
      // formen var det brus som gjorde tidslinjen ojämn. Den dag `Erbjudande`
      // katalogiserar det som i dag hamnar under "Annat" (T16-kandidat) dyker
      // raden upp av sig själv, utan kodändring.
      const namn = erbjudandeNamn(h.erbjudande);
      if (!namn) continue;
      if (!Number.isFinite(tid)) {
        oplacerade.push(`Hämtade ${namn}`);
        continue;
      }
      lagg({
        id: `hamtning-${h.id}`,
        tidMs: tid,
        slag: 'hamtning',
        kommande: false,
        // HANDLINGEN på rad 1, ERBJUDANDET på rad 2 (Marcus 2026-08-12:
        // *"Blir ju tomt under alla erbjudande-händelser nu eftersom de inte
        // har en rad 2, så skriv 'Hämtade ett erbjudande' på rad 1, 'Namnet på
        // erbjudandet' på rad 2"*). Formen var "Hämtade <namn>" på en rad,
        // vilket lämnade underrads-slotten tom — och slot-modellen reserverar
        // den ändå, så posten fick ett hål i sig.
        //
        // Bonus: alla tre posttyperna blir nu strukturellt lika — rad 1 är
        // HANDLINGEN, rad 2 är dess detalj, rad 3 är datumet.
        rubrik: 'Hämtade ett erbjudande',
        meta: namn,
        prickKlass: 'bg-text-muted',
        ikon: Download,
        pillar: [],
      });
    }
  } else {
    for (const hamtning of person.allaHamtningar) {
      const traff = HAMTNING_DATUM.exec(hamtning);
      const tid = traff ? Date.parse(traff[1]) : Number.NaN;
      if (!Number.isFinite(tid)) {
        oplacerade.push(hamtning);
        continue;
      }
      lagg({
        id: `hamtning-${hamtning}`,
        tidMs: tid,
        slag: 'hamtning',
        kommande: false,
        rubrik: hamtning.replace(HAMTNING_DATUM, '').trim(),
        meta: 'Hämtade ett erbjudande',
        prickKlass: 'bg-text-muted',
        pillar: [],
      });
    }
  }

  // 4. STRÖMMENS BÖRJAN — returneras SEPARAT, inte som en post bland andra.
  //
  // "Kom in i registret" är per definition det FÖRSTA som hänt personen, och
  // ska stå längst ned i en nyast-överst-ström (Marcus 2026-08-12: *"'Kom in
  // i registret' måste ju för guds skull vara den absolut första
  // händelsen!!"*). Sorterad på sitt eget datum hamnade den mitt i strömmen:
  // `Personer.Rad skapad` är radens födelse i AIRTABLE, inte personens första
  // kontakt, och på backfillad/seedad data är det ofta senare än händelserna
  // raden beskriver. Mätt på Sofia Isaksson 2026-08-12: `radSkapad`
  // 2026-08-10 medan hennes första anmälan är från 2025-07-20 — registret
  // hamnade näst överst, före allt hon faktiskt gjort.
  //
  // Att i stället FLYTTA tidsstämpeln till den äldsta händelsen vore att
  // hitta på ett datum. Posten behåller därför sitt riktiga datum men lämnar
  // den kronologiska sorteringen och år-grupperingen helt: den renderas som
  // strömmens avslutande rad, vilket är sant både när `radSkapad` är korrekt
  // och när den är en artefakt.
  const skapadTid = person.radSkapad ? Date.parse(person.radSkapad) : Number.NaN;
  let registrerad: StromPost | null = null;
  if (Number.isFinite(skapadTid)) {
    const d = new Date(skapadTid);
    registrerad = {
      id: 'registrerad',
      tidMs: skapadTid,
      ar: d.getFullYear(),
      datumText: DATUM_KORT.format(d),
      slag: 'registrerad',
      kommande: false,
      rubrik: 'Kom in i registret',
      meta: null,
      prickKlass: 'bg-border-strong',
      pillar: [],
    };
  }

  poster.sort((a, b) => b.tidMs - a.tidMs);
  return { poster, oplacerade, registrerad };
}

/** En post i strömmen — rälsen ritas med absolut linje + prick per post. */
function StromRadD({ post, sist }: { post: StromPost; sist: boolean }) {
  const Ikon = post.ikon;

  // SLOT-MODELLEN (Marcus 2026-08-12: *"Se till att det är exakt samma avstånd
  // mellan varje händelse!!! Varje händelse i linjen ska låsa en fast höjd
  // efter den med högst höjd."*). Samma disciplin som `EventCard.tsx` redan
  // bär: *"korten är alltid likformiga … alla metarader renderas ALLTID med
  // platshållare"*. Före ändringen mättes FYRA olika posthöjder i 390 px —
  // 64 / 84 / 112 / 140 — beroende på om posten hade underrad och pillar.
  //
  // Alla tre textraderna renderas därför alltid: saknas underrad eller pillar
  // står slotten TOM men tar sin plats. Höjden blir därmed konstant utan en
  // hårdkodad `min-h` som spricker vid längre innehåll — reservationen är
  // strukturell, inte ett magiskt tal.
  const innehall = (
    <>
      <span
        aria-hidden="true"
        className={`z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-surface ${
          post.kommande ? 'border-border-strong' : 'border-border'
        }`}
      >
        {Ikon ? (
          <Ikon aria-hidden size={14} className="text-text-secondary" />
        ) : (
          <span className={`size-2 rounded-full ${post.prickKlass}`} />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
        <span className="truncate font-semibold text-body">{post.rubrik}</span>
        {/* Underrads-slotten — alltid renderad, `&nbsp;` håller höjden när
            posten saknar plats/tillfälle (hämtningar, registret). */}
        <span className="truncate text-caption text-text-secondary">{post.meta ?? ' '}</span>
        <span className="text-caption text-text-muted tabular-nums">{post.datumText}</span>
        {/* Pill-slotten — samma princip, men med EXAKT pillens höjd, inte en
            ungefärlig. `h-[22px]` är härlett, inte magiskt: `Pill` är
            `text-caption` (12 px/18 px line-height) + `py-0.5` (2 px × 2) =
            22 px, uppmätt i renderad DOM. Ett första försök med `min-h-5`
            (20 px) gav 110 px för tomma poster och 112 för fyllda — två
            pixlar, men Marcus krav är EXAKT samma höjd, och en slot som är
            lägre än sitt innehåll är inte en slot.
            `flex-nowrap`: två sessions-pillar ryms på raden i 390 px (mätt),
            och en wrap hade återinfört just den höjdvariation slotten tar
            bort. */}
        <span className="mt-1 flex h-[22px] flex-nowrap items-center gap-1.5 overflow-hidden">
          {post.pillar.map((p) => (
            <Pill key={p.id} ton={p.ton}>
              {p.text}
            </Pill>
          ))}
        </span>
      </span>
    </>
  );

  // SAMMA HORISONTELLA INSET PÅ BÅDA GRENARNA. Fram till 2026-08-12 bar bara
  // `<Link>`-grenen `-mx-2 px-2`, så ikonens mittpunkt låg på x=16 i länkade
  // rader och x=24 i olänkade — medan linjen stod fast på `left-[15px]`.
  // Mätt: strecket satt 9 px fel på varannan post ("strecken sitter helt snett
  // och helt fel mot ikonerna"). Insetet hör till RADEN, inte till om den råkar
  // vara klickbar.
  const radKlasser = '-mx-2 flex items-start gap-3 rounded-lg px-2 py-2';

  return (
    <li className="relative flex flex-col">
      {!sist && (
        <span aria-hidden="true" className="absolute top-10 bottom-0 left-[15px] w-px bg-border" />
      )}
      {post.href ? (
        <Link
          to={post.href.to}
          params={post.href.params}
          className={`${radKlasser} hover:bg-bg-emphasized motion-safe:transition-colors`}
        >
          {innehall}
        </Link>
      ) : (
        <span className={radKlasser}>{innehall}</span>
      )}
    </li>
  );
}

/**
 * Arrangemanget: ALLT som går att datera i EN ström, nyast överst, grupperad
 * per år. Identiteten krymper till en remsa högst upp — sidan handlar inte om
 * vem personen är utan om vad som HÄNT. Det som inte kan dateras samlas ärligt
 * i ett eget kort under strömmen i stället för att smygas in på fel plats.
 *
 * Vad varianten OFFRAR — och detta är dess ärliga svaghet: EF:en levererar bara
 * EN av de fyra strömtyperna som riktiga poster (deltagandena). Touchpointen är
 * en enda färdigformaterad textrad, hämtningarna är en text-rollup vars datum
 * måste plockas isär med regex, och anmälningarna (sex stycken på den rika
 * personen) har INGA datum alls i persondetaljens shape — de kan inte vara med.
 * Anteckningen kan inte heller placeras: fältet saknar tidpunkt (task-43).
 */
// VARIANT D — SYNTESEN · Marcus blockordning (S103, konvergens-steg 1)
// ═════════════════════════════════════════════════════════════════════════

/**
 * [PROTOTYPE] D är INTE ett fjärde divergens-förslag — det är Marcus egen
 * blockordning, dikterad vid S103:s resume: *"blanda och mixa lite av
 * varianterna och skapa en ny variant, en d-variant"*. Inget formval på a/b/c
 * gjordes; D ÄR valet, och a/b/c står kvar enbart som jämförelseytor.
 *
 * ORDNINGEN, som den gavs (åtta punkter, här B1–B8):
 *
 *   B1  tomt under namnet            B5  hämtade erbjudanden, med datum
 *   B2  kontakt (b:s form) + telefon B6  motiveringar, alla, per event
 *   B3  interaktioner (c:s tidslinje) B7  anteckningar som eventdetaljens
 *   B4  eventhistorik, senast överst  B8  "just nu", under kontakt
 *
 * DUBBLERINGEN ÄR VALD, INTE MISSAD (Marcus svar (a) på beslut 1, 2026-08-10):
 * tidslinjen behåller HELA sin ström — event OCH hämtningar — och B4/B5 ligger
 * under den som fördjupningar. Det är CRM-mönstret (aktivitetsström överst,
 * strukturerade objektlistor under), inte en oavsiktlig upprepning.
 *
 * TRE BLOCK STÅR MEDVETET TUNNA I DETTA STEG, och är märkta i koden nedan:
 * B5:s datum plockas ur strängen (anti-mönstret, se HAMTNING_DATUM), B6 saknar
 * både ordning och event-koppling, B7 har ingen författare och ingen tidpunkt.
 * Alla tre stängs av SAMMA EF-utökning (Touchpoints + Anmälningar som batch-
 * hämtade poster, spegel av Deltaganden-batchen i get-person) plus — för B7 —
 * en Person-länk på Anteckningar-tabellen. Formen byggs först så dataarbetet
 * får ett krav att fylla, i stället för tvärtom.
 */

/**
 * D:s flaggor — DELAD härledning kan inte användas: `flaggor()` drar in
 * AI-flaggan, som Marcus explicit lyfte UT ur persondetaljen 2026-08-10
 * (*"AI flagga avvaktar vi med, den borde egentligen in i anmälningsdetalj-
 * sidan, inte här"*). Manuella flaggan hanteras separat nedan — den är en
 * skrivyta i D, inte en läsrad.
 */
function flaggorD(person: PersonDetailType): string[] {
  return [
    person.ejGodkandMail ? 'Ej godkänd för mailutskick' : null,
    person.inbjudenCommunity ? 'Inbjuden till community' : null,
    person.skapatKontoCommunity ? 'Konto i community' : null,
  ].filter((v): v is string => v !== null);
}

/*
 * `AnteckningComposerStub` RIVEN 2026-08-10 (`#1151` landad). Den härmade
 * eventsidans composer med skrivningen bortkopplad, eftersom personens
 * anteckning då var ETT fält utan skrivväg för en ström. Nu finns strömmen på
 * riktigt (`PersonAnteckningar` + `create-person-note`), så stubben är
 * ersatt av den skarpa komponenten. D är därmed den enda varianten som
 * SKRIVER — a/b/c behåller `AnteckningLas` med sin no-op-knapp.
 */

/*
 * `delaHamtningar` RIVEN 2026-08-10 (`#1149` landad). Den plockade isär
 * `allaHamtningar`-strängarna med regex för att få fram ett datum — ett
 * anti-mönster som bars medvetet så länge EF:en inte levererade något bättre.
 * Nu gör den det: `person.hamtningar` är riktiga Touchpoint-poster med ett
 * eget `datum`-fält, sorterade datum-desc server-side. D läser dem direkt.
 *
 * `HAMTNING_DATUM` står kvar — variant C använder den fortfarande, med avsikt
 * (se Hamtningskalla-noten vid byggStrom).
 */

function VariantD({ person, nuMs }: { person: PersonDetailType; nuMs: number }) {
  // 'poster' — D konsumerar EF-utökningens riktiga Touchpoint- och
  // Anmälnings-poster (`#1149`), aldrig rollup-strängarna.
  const { poster, oplacerade, registrerad } = byggStrom(person, nuMs, 'poster');
  // KOMMANDE SORTERAS STIGANDE — närmast i tiden först. `poster` är datum-DESC,
  // vilket är rätt för historik och FEL för framtid: med tre kommande event
  // hade det som ligger längst bort hamnat överst under rubriken "Kommande".
  // Osynligt på en person med exakt ett kommande event, vilket är varför det
  // överlevde till 2026-08-12.
  const kommande = poster.filter((p) => p.kommande).sort((a, b) => a.tidMs - b.tidMs);
  const historiska = poster.filter((p) => !p.kommande);
  const grupper = grupperaPerEvent(person.historik);
  // AKTIVA ANMÄLNINGAR — "Just nu"-blockets hela innehåll (Marcus 2026-08-12).
  // Aktiv = anmäld till ett event som INTE hänt än. Basens `Antal anmälningar
  // (aktiva)` duger inte: den räknar allt som inte avbokats, inklusive
  // genomförda event (4 för Sofia Isaksson, varav tre är historik) — och att
  // lista dem under "Just nu" vore precis den historik/nu-blandning blocket
  // byggdes om för att bli av med. Stigande: närmast först.
  const aktivaAnmalningar = grupper
    .filter((g) => g.tidMs && g.tidMs > nuMs)
    .sort((a, b) => a.tidMs - b.tidMs);
  // B4 ÄR HISTORIK. Ett kommande event hör i strömmens "Kommande"-sektion —
  // under rubriken "Eventhistorik" (aria-label "senaste först") påstod det att
  // personen deltagit på något som inte hänt. Mätt på Sofia Isaksson
  // 2026-08-12: "Fjärrskådning · 18 augusti 2026 · Dag 1 · Kommande" låg
  // ÖVERST i listan. Datumlösa grupper (`tidMs` 0) behålls — de kan inte
  // klassas som framtid, och att tappa dem vore data-förlust.
  const historikGrupper = grupper.filter((g) => !g.tidMs || g.tidMs <= nuMs);
  // Anmälningar utan motiveringstext bär ingenting att visa — se B6-noten.
  const motiveringar = person.motiveringar.filter((m) => m.motivering);
  // Hämtningar UTAN erbjudandenamn visas inte — se B5-noten. Namnet härleds
  // en gång här i stället för två gånger i renderingen.
  const namngivnaHamtningar = person.hamtningar
    .map((post) => ({ post, namn: erbjudandeNamn(post.erbjudande) }))
    .filter(
      (h): h is { post: (typeof person.hamtningar)[number]; namn: string } => h.namn !== null,
    );
  const flag = flaggorD(person);

  const arGrupper: { ar: number; poster: StromPost[] }[] = [];
  for (const post of historiska) {
    const sista = arGrupper.at(-1);
    if (sista && sista.ar === post.ar) sista.poster.push(post);
    else arGrupper.push({ ar: post.ar, poster: [post] });
  }

  const kortKlass =
    'rounded-2xl border border-transparent bg-bg-muted px-4 py-4 contrast-more:border-border-strong';
  // HOVER-PLATTANS FORM ÄR APPENS, INTE EGEN (Marcus 2026-08-12: *"Hover på
  // kontakt-blocket och just nu-blocket ser ju skitfult ut, tar ju hela ytan
  // typ, bygg exakt som på andra block i appen, typ som på eventdetalj-
  // sidan"*).
  //
  // Formen är eventdetalj-familjens, oförändrad: `-mx-2 … rounded-lg px-2
  // py-1.5` — samma sträng som `Atgarder.tsx` (48), `Gruppdynamik.tsx` (232),
  // `Deltagare.tsx` (292) och `DeltagareHallplatsPrototyp.tsx` (167). Ingen ny
  // form mintas.
  //
  // VAD SOM VAR FEL, mätt före ändringen: `-mx-4 px-4` gav en hover-platta på
  // 566 px i ett 568 px brett kort — kant-i-kant — med `border-radius: 0` i
  // ett kort som självt är `rounded-2xl`. `Betalningar.tsx` (100) hade redan
  // diagnosen nedskriven: *"hade den suttit på wrappern med py-3 blivit en
  // kant-till-kant-platta utan rundning, vilket är fel form i ett kort med
  // rundade hörn."* Den noten gällde en knapp i eventfamiljen; persondetaljen
  // gjorde exakt samma fel utan att ha läst den.
  //
  // GEOMETRIN BEVARAS via samma delning som `Betalningar.tsx` gjorde:
  // radens 14 px (`py-3.5`) flyttas till 8 px på `<li>` + 6 px (`py-1.5`) på
  // länken = 14 px, så radhöjden 52 px är oförändrad. `divide-y` sitter kvar
  // på `<ul>` och rörs inte.
  const kontaktRadKlass =
    '-mx-2 flex w-auto items-center gap-3 rounded-lg px-2 py-1.5 text-left font-medium text-body hover:bg-bg-emphasized motion-safe:transition-colors';

  return (
    <>
      {/* B1 — IDENTITETEN: namnet ensamt. Marcus: "Direkt under namnet så
          behöver vi inte ha någonting, kan vara tomt." Badge, ort och
          kontaktremsa ligger i sina egna block längre ned. */}
      <header className="flex flex-col gap-2 px-4">
        <h1 className="font-semibold text-3xl" tabIndex={-1} data-proto-h1>
          {displayName(person)}
        </h1>
      </header>

      {/* B2 — KONTAKTEN: b:s radform oförändrad. `mailto:`/`tel:` är riktiga
          länkar (ingen mutation); chevron 18 px eftersom raden leder ut ur
          appen. ⚠️ PROMOVERINGSKRAV: `mailto:` fälls av check-mailto.mjs och
          undantaget i `.mailto-policy.json` är fil-scopat till DENNA fil — en
          promovering till PersonDetail.tsx kräver ett nytt, källmärkt undantag
          där, annars blir landningen röd. */}
      <section aria-labelledby="proto-d-kontakt" className="flex min-w-0 flex-col gap-2">
        <h2 id="proto-d-kontakt" className="px-4 font-semibold text-lg">
          Kontakt
        </h2>
        <div className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong">
          {person.email || person.telefon ? (
            // AVDELARE MELLAN RADERNA, som alla andra block i appen (Marcus
            // 2026-08-12). `divide-y` sitter på LISTAN, så linjen får samma
            // indrag som eventhistorikens och motiveringarnas — medan
            // hover-ytan tar `-mx-4 px-4` och går kant-i-kant med kortet.
            // Underrubrikerna "Skicka mail"/"Ring" är borta: ikonen och
            // värdet säger redan vad raden gör.
            // IKONERNA BORTTAGNA 2026-08-12 (Marcus: *"Ta bort eventikonen
            // och telefonikonen, ser oproffsigt ut"*). En e-postadress och ett
            // telefonnummer är självförklarande av sin egen form; ikonen
            // tillförde bara grafiskt brus. Chevronen står kvar — den är
            // ingen dekoration utan radens affordance (den säger att raden
            // leder ut ur appen).
            <ul className="flex flex-col divide-y divide-border">
              {person.email && (
                <li className="py-2">
                  <a href={`mailto:${person.email}`} className={kontaktRadKlass}>
                    <span className="min-w-0 flex-1 truncate">{person.email}</span>
                    <ChevronRight
                      aria-hidden="true"
                      size={18}
                      className="shrink-0 text-text-secondary"
                    />
                  </a>
                </li>
              )}
              {person.telefon && (
                <li className="py-2">
                  <a href={telHref(person.telefon)} className={kontaktRadKlass}>
                    <span className="min-w-0 flex-1 truncate">{person.telefon}</span>
                    <ChevronRight
                      aria-hidden="true"
                      size={18}
                      className="shrink-0 text-text-secondary"
                    />
                  </a>
                </li>
              )}
            </ul>
          ) : (
            <p className="py-3 text-small text-text-muted">Inga kontaktuppgifter registrerade.</p>
          )}
          {person.ejGodkandMail && (
            <p className="py-3 text-small text-text-muted">
              Personen har tackat nej till mailutskick - mejla bara personligt.
            </p>
          )}
          {/* COMMUNITY-STATUSARNA bodde i "Just nu" fram till ombyggnaden
              2026-08-12. De är varken historik eller nuläge utan en KANAL —
              samma klass som mail och telefon — och hör därför hemma här.
              Utan flytten hade de tappats tyst när blocket rensades, vilket
              är en sämre sorts förenkling än den Marcus bad om. */}
          {flag.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 py-3">
              {flag.map((f) => (
                <Pill key={f} paKortyta={false}>
                  {f}
                </Pill>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* B8 — JUST NU. OMBYGGT FRÅN GRUNDEN 2026-08-12 på Marcus dom: *"Just
          nu blocket fattar man ingenting av… ologiskt på så många sätt… Du
          blandar historik och aktuellt."* Han hade rätt — blocket bar
          erfarenhetsbadge, totalt antal anmälningar, antal genomförda event
          och "senast för N dagar sedan". Fyra av fem rader var HISTORIK, i
          ett block vars rubrik lovar nuläge.

          KVAR STÅR EXAKT DET HAN BAD OM: antalet aktiva anmälningar, och de
          eventen listade med dagar-kvar-pill per rad.

          "Aktiv" = anmäld till ett event som INTE hänt än (se
          `aktivaAnmalningar`). Basens `Antal anmälningar (aktiva)` räknar allt
          som inte avbokats, genomförda event inkluderade — att lista dem här
          vore samma blandning om igen.

          FLYTTAT, INTE BORTTAGET: flaggan bor i eget block nedanför (den är
          en anteckning om personen, varken historik eller nuläge), och
          erfarenhetsbadgen står nu vid Eventhistoriken — den SAMMANFATTAR
          just den historiken ("Resenär steg 1–2" = genomförda RIM-steg). */}
      <section aria-labelledby="proto-d-nulage" className="flex min-w-0 flex-col gap-2">
        <h2 id="proto-d-nulage" className="px-4 font-semibold text-lg">
          Just nu
        </h2>
        <div className="flex flex-col gap-3 rounded-2xl border border-transparent bg-primary-tint px-4 py-4 contrast-more:border-border-strong">
          {aktivaAnmalningar.length > 0 ? (
            <>
              <p className="font-semibold text-body">
                {aktivaAnmalningar.length === 1
                  ? '1 aktiv anmälan'
                  : `${aktivaAnmalningar.length} aktiva anmälningar`}
              </p>
              <ul className="flex flex-col divide-y divide-border/60">
                {aktivaAnmalningar.map((grupp) => {
                  const farg = kursfargForKurs(grupp.kursnamn);
                  const href = anmalanHref(grupp.eventId, grupp.registrationId);
                  const innehall = (
                    <>
                      <span
                        aria-hidden="true"
                        className={`w-1 shrink-0 self-stretch rounded-full ${farg.bgClass}`}
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate font-semibold text-body">{grupp.rubrik}</span>
                        <span className="text-small text-text-muted">
                          {[langtDatum(grupp.datum), grupp.ort].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                      {/* INGEN DAGAR-KVAR-PILL. Den fanns här från 2026-08-12
                          ("hur många dagar det är kvar-pillen ska vara på
                          eventraden också") och togs bort samma dag på Marcus
                          egen omprövning: *"Jag vill ta bort pillen helt
                          istället. Blir mer clean utan och den hjälper inte
                          Lotta kom jag på."*

                          Skälet är ett ANVÄNDNINGS-skäl, inte ett formskäl:
                          raden bär redan eventets datum, och nedräkningen
                          besvarade ingen fråga Lotta faktiskt ställer i
                          persondetaljen. `dagarKvarText` är därmed oanvänd i
                          denna fil och riven med pillen — `EventCard.tsx:102`
                          och `NastaEventCard.tsx:34` bär sina egna kopior och
                          är ORÖRDA (där ÄR nedräkningen kortets poäng). */}
                    </>
                  );
                  // KLICKBAR till anmälningsdetaljen (Marcus 2026-08-12: *"även
                  // den aktiva anmälan i just nu-blocket borde också vara en
                  // knapp"*), i eventdetalj-familjens hover-form — se
                  // `kontaktRadKlass` ovan för varför kant-i-kant-plattan var
                  // fel och var formen kommer ifrån.
                  //
                  // Radens 12 px (`py-3`) delas 6+6 mellan `<li>` och länken,
                  // så radhöjden är oförändrad mot den oklickbara formen.
                  // `first:pt-0` sitter på `<li>` — den hörde alltid dit;
                  // `first:` läser elementets egen syskonposition, och på
                  // länken (enda barnet i sin `<li>`) hade den träffat VARJE
                  // rad i stället för den första.
                  // RADEN ÄR FYLLD I VILA (Marcus 2026-08-12: *"jag skulle nog
                  // vilja att aktiva anmälan raden/knappen ser ut som den gör
                  // vid Hover i normalt tillstånd"*). Den är sidans viktigaste
                  // rad — nästa event personen ska gå på — och bär nu den
                  // vikten utan att man måste peka på den.
                  //
                  // HOVERN MÅSTE DÅ FLYTTA SIG, annars slutar knappen svara:
                  // är vilan `bg-bg-emphasized` finns ingen förändring kvar att
                  // göra med samma token.
                  //
                  // FÖRSTA FÖRSÖKET LJUSNADE till `bg-surface` och MÄTTES: raden
                  // blev `rgb(255,255,255)` — exakt pillens vita — så pillen
                  // FÖRSVANN vid hover. Det är samma fälla `Pill`s docblock
                  // redan beskriver ("en pill i kortets egen ton vore
                  // osynlig"), bara med hover-tillståndet som yta.
                  //
                  // Nu MÖRKAS den i stället, med appens eget 6 %-steg:
                  // `--mm-state-hover` är `color-mix(in srgb, var(--mm-text) 6%,
                  // transparent)` (semantic.css 46) och används som skrim av
                  // `ToggleButtonGroup.tsx:73`. Den token kan inte användas rakt
                  // av här — den ERSÄTTER bakgrunden, så skrimmet hade lagt sig
                  // mot kortets guld-tint i stället för mot den grå raden och
                  // ljusnat igen. Samma 6 % blandas därför direkt in i
                  // `bg-emphasized`. Steget är appens, ytan är radens.
                  const radKlass = 'flex items-center gap-3';
                  return (
                    <li key={grupp.nyckel} className="flex flex-col py-1.5 first:pt-0">
                      {href ? (
                        <Link
                          to={href.to}
                          params={href.params}
                          className={`${radKlass} -mx-2 w-auto rounded-lg bg-bg-emphasized px-2 py-1.5 hover:bg-[color-mix(in_srgb,var(--mm-text)_6%,var(--mm-bg-emphasized))] motion-safe:transition-colors`}
                        >
                          {innehall}
                        </Link>
                      ) : (
                        <span
                          className={`${radKlass} -mx-2 w-auto rounded-lg bg-bg-emphasized px-2 py-1.5`}
                        >
                          {innehall}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="text-body">Inga aktiva anmälningar.</p>
          )}
        </div>
      </section>

      {/* BETALNINGAR — NY SEKTION (TASK-346.7 AC #4), bakom miljöflaggan.

          PLACERINGEN ÄR ETT FORMBESLUT FÖR MORGONGRANSKNINGEN, inte ett
          fastställt facit: sektionen står EFTER "Just nu" och FÖRE "Flagga",
          därför att en öppen betalning hör till personens NULÄGE — det är
          samma fråga som "Just nu" svarar på ("vad pågår med den här
          personen"), bara i pengar i stället för i anmälningar. Facitet
          (S103, variant D) låser sju block i Marcus egen ordning och känner
          inte detta; avsteget är bokfört i
          `tasks/sessions/bilagor/s103-persondetalj-konvergens/AMENDERING-2026-08-31-*.md`
          med klassen "ny form, förhandsmandat S113 Del 11 (B3)".

          MED FLAGGAN AV RENDERAS INGENTING — persondetaljen är då byte för
          byte den promoverade formen. */}
      {betalningarPa() && (
        <Sektion id="proto-d-betalningar" rubrik="Betalningar">
          <PersonBetalningar person={person} />
        </Sektion>
      )}

      {/* FLAGGAN — eget block sedan 2026-08-12. Marcus 2026-08-10: *"Manuell
          flagga är ju bra att kunna skapa här, så den sedan kan 'fästas' på
          personen typ i check-in vyn"*, förtydligat samma kväll: *"det ska
          vara en flagga som Lotta själv skriver i fritext … Choice-fältet i
          basen kan vi skrota."*

          Den låg i "Just nu" fram till ombyggnaden. Den flyttade INTE för att
          den var fel — den är varken historik eller nuläge utan en anteckning
          om personen, och "Just nu" bär nu bara de aktiva anmälningarna.

          ✅ SKARP SKRIVYTA (`#1151`). Vägen dit gick INTE via en fix av det
          gamla fältet: `Manuella flagga` (`fldNtwQt6tOCIdf4f`) är en
          singleSelect med `choices: []` och kunde aldrig sättas
          (data-model.md §Kända fällor 25, live-ombekräftad). Airtables
          Meta-API kan varken ändra ett fälts typ eller radera det, så fältet
          AVLÖSTES av ett nytt `Flagga` (singleLineText) i båda baserna.
          `manuellFlagga` finns kvar i shapen men läses inte här. */}
      <Sektion id="proto-d-flagga" rubrik="Flagga">
        <div className="py-3">
          {/* `personNamn` bärs in av S105:s aktivitetslogg-instrumentering
              (TASK-201.4, `d1f893fc`) — klient-lokalt underlag för
              `recordActivity`s objekt-namn, aldrig skickat till servern.
              Propen kom in i prototypfilen medan denna promovering pågick i en
              annan gren; den följde med hit vid konfliktlösningen i stället för
              att svälјas av renamet. */}
          <PersonFlagEditor
            personId={person.id}
            flagga={person.flagga}
            personNamn={displayName(person)}
          />
        </div>
      </Sektion>

      {/* B3 — INTERAKTIONER: c:s tidslinje, formen oförändrad (Marcus: "exakt
          som proto-c, det var jättesnyggt och tydligt"). Rubriken är hans ord.
          Strömmen behåller HELA sitt innehåll per beslut (a) — event,
          hämtningar och anmälningar finns alltså både här och i sina egna
          block nedan (B4 / B5 / B6). Anmälningarna kom in som egna poster
          2026-08-12; dessförinnan bar strömmen en enda klumpad
          "senaste interaktion"-post (se byggStrom steg 2). */}
      <section aria-labelledby="proto-d-strom" className="flex min-w-0 flex-col gap-2">
        <h2 id="proto-d-strom" className="px-4 font-semibold text-lg">
          Interaktioner
        </h2>
        {/* `|| registrerad` — en person utan en enda interaktion har ändå
            kommit in i registret; tomtillståndet nedan gäller bara den som
            saknar BÅDA. */}
        {poster.length > 0 || registrerad ? (
          <div className={`flex flex-col gap-4 ${kortKlass}`}>
            {kommande.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-small text-text-secondary">Kommande</h3>
                <ol className="flex flex-col">
                  {kommande.map((post, i) => (
                    <StromRadD key={post.id} post={post} sist={i === kommande.length - 1} />
                  ))}
                </ol>
              </div>
            )}
            {arGrupper.map((grupp, gi) => {
              // `sist` styr om posten ritar linjen NEDÅT. Sista posten i sista
              // år-gruppen ska ändå göra det när registret följer under —
              // annars bröts rälsen och "Kom in i registret" hängde löst
              // (mätt 2026-08-12: 128 px utan linje mellan dem).
              const sistaGruppen = gi === arGrupper.length - 1;
              return (
                <div key={grupp.ar} className="flex flex-col gap-2">
                  <h3 className="font-semibold text-small text-text-secondary tabular-nums">
                    {grupp.ar}
                  </h3>
                  <ol className="flex flex-col">
                    {grupp.poster.map((post, i) => (
                      <StromRadD
                        key={post.id}
                        post={post}
                        sist={
                          i === grupp.poster.length - 1 && !(sistaGruppen && registrerad !== null)
                        }
                      />
                    ))}
                  </ol>
                </div>
              );
            })}
            {/* STRÖMMENS SISTA RAD — alltid, oavsett datum. Se byggStrom
                steg 4 för varför posten står utanför år-grupperingen:
                `Rad skapad` är radens födelse i Airtable, inte personens
                första kontakt, och sorterad på sitt eget datum hamnade
                "Kom in i registret" mitt i strömmen.

                `-mt-4` NEUTRALISERAR containerns `gap-4`. Posten är ett
                syskon till år-grupperna och fick därför gruppernas mellanrum
                ovanpå sitt eget radavstånd — mätt 2026-08-12: 128 px till
                posten över, mot 112 överallt annars (Marcus: *"'kom in i
                registret' har ett större mellanrum till händelsen över än
                övriga mellanrum"*). Gapet hör till GRUPPER; den här raden är
                ingen grupp, den är strömmens sista post. Att i stället lägga
                den inuti sista år-gruppens `<ol>` hade tagit bort gapet lika
                bra men ställt en 2026-post under rubriken "2025". */}
            {registrerad && (
              <ol className="-mt-4 flex flex-col">
                <StromRadD post={registrerad} sist />
              </ol>
            )}
            {oplacerade.length > 0 && (
              <ul className="flex flex-col gap-1 border-border border-t pt-3">
                {oplacerade.map((post) => (
                  <li key={post} className="text-small text-text-muted">
                    {post} - saknar datum, kan inte placeras
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className={`flex flex-col items-center gap-1 py-12 text-center ${kortKlass}`}>
            <p className="font-medium text-body">Inget har hänt ännu</p>
            <p className="text-small text-text-muted">
              Strömmen fylls när personen anmäler sig, deltar eller hämtar ett erbjudande.
            </p>
          </div>
        )}
      </section>

      {/* B4 — EVENTHISTORIKEN: a:s kurshistorik-form, grupperad per event (ett
          tvådagars-event är EN post, inte två). Marcus: "listar alla event
          personen DELTAGIT PÅ med senast högst upp" — båda leden är kodade:
          `historikGrupper` filtrerar bort framtiden, och `grupperaPerEvent`
          sätter ordningen explicit (raden sade tidigare att sorteringen
          "kostar ingenting, den finns redan i svaret" — den finns i svaret,
          men en aria-label som lovar "senaste först" ska inte vila på en
          annan tjänsts sorteringsval). */}
      {/* ERFARENHETSBADGEN ("Resenär steg 1–2") ÄR BORTA HELT sedan
          2026-08-12 (Marcus: *"Ta bort badgen 'Resenär steg 1-2'"*). Den bodde
          i "Just nu", flyttades hit vid ombyggnaden samma dag som en
          sammanfattning av listan under, och ströks i nästa granskningsvarv:
          listan säger redan vilka steg personen gått, badgen upprepade det i
          kortform. `person.erfarenhetsbadge` läses inte längre i variant D —
          fältet finns kvar i shapen och i a/b/c. */}
      <section aria-labelledby="proto-d-eventhistorik" className="flex min-w-0 flex-col gap-2">
        <h2 id="proto-d-eventhistorik" className="px-4 font-semibold text-lg">
          Eventhistorik
        </h2>
        {historikGrupper.length > 0 ? (
          <ul
            aria-label="Eventhistorik, senaste först"
            className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong"
          >
            {historikGrupper.map((grupp) => {
              const farg = kursfargForKurs(grupp.kursnamn);
              const meta = [langtDatum(grupp.datum), grupp.ort, grupp.typ]
                .filter(Boolean)
                .join(' · ');
              return (
                <li key={grupp.nyckel} className="flex gap-3 py-3">
                  <span
                    aria-hidden="true"
                    className={`w-1 shrink-0 self-stretch rounded-full ${farg.bgClass}`}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="font-semibold text-body">{grupp.rubrik}</span>
                    {meta && <span className="text-small text-text-muted">{meta}</span>}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {grupp.poster.map((entry) => {
                        const lage = narvarolage(entry, nuMs);
                        return (
                          <Pill key={entry.id} ton={lage === 'kommande' ? 'kommande' : 'neutral'}>
                            {sessionsEtikett(entry, lage)}
                          </Pill>
                        );
                      })}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-1 rounded-2xl border border-transparent bg-bg-muted px-4 py-12 text-center contrast-more:border-border-strong">
            <p className="font-medium text-body">Ingen eventhistorik ännu</p>
            <p className="text-small text-text-muted">
              Historiken fylls när ett deltagande registreras.
            </p>
          </div>
        )}
      </section>

      {/* B5 — HÄMTADE ERBJUDANDEN, med datum. Marcus: "med alla hämtade
          erbjudanden med datum och sånt så klart".

          ✅ INTE LÄNGRE TUNN (`#1149`): `person.hamtningar` är riktiga
          Touchpoint-poster med ett eget `datum`-fält, batch-hämtade och
          sorterade datum-desc server-side. Regex-plockningen ur strängen är
          riven — och därmed också ARRAYJOIN-klumpen som hade gjort listan till
          EN rad i prod.

          NAMNLÖSA HÄMTNINGAR VISAS INTE, samma regel som strömmen (Marcus
          2026-08-12, se byggStroms hämtnings-gren). Blocket heter "Hämtade
          erbjudanden" — en rad utan erbjudandenamn hör per definition inte
          hit. Posten finns kvar i basen; den syns bara inte. */}
      <section aria-labelledby="proto-d-hamtningar" className="flex min-w-0 flex-col gap-2">
        <h2 id="proto-d-hamtningar" className="px-4 font-semibold text-lg">
          Hämtade erbjudanden
        </h2>
        <div className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong">
          {namngivnaHamtningar.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border">
              {namngivnaHamtningar.map(({ post: h, namn }) => (
                <li key={h.id} className="flex items-start gap-3 py-3">
                  <Download
                    aria-hidden="true"
                    size={18}
                    className="mt-0.5 shrink-0 text-text-secondary"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-body">{namn}</span>
                    <span className="text-small text-text-muted">
                      {h.datum ? langtDatum(h.datum) : 'Datum saknas'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-3 text-small text-text-muted">
              Inga hämtade erbjudanden registrerade.
            </p>
          )}
          {/* RÄKNAR-JÄMFÖRELSEN RIVEN 2026-08-10, efter mätning.
              Blocket visade tidigare "Räknaren i basen säger N - listan M" när
              de två gick isär, med motiveringen att en tyst nedtystad räknare
              vore en osanning. Mätningen visade att JÄMFÖRELSEN var osanningen:
              `Personer.Antal hämtningar` (fld4UQOdKTvWixZ9F) är
              `COUNTA({Engagemang})` — den räknar rader i en HELT ANNAN tabell
              (`Engagemang`, flddG1tVJyaKBxBYv), inte touchpoints. Skarpt
              belagt på Sofia Isaksson: räknaren 0, tre faktiska hämtningar.
              Att ställa dem bredvid varandra antyder att de mäter samma sak
              och sår tvivel om en lista som är korrekt. Räknaren hör hemma där
              Engagemang hör hemma — inte här. */}
        </div>
      </section>

      {/* B6 — MOTIVERINGARNA. Marcus: "listar ALLA personens motiveringar i
          fallande ordning också, och till vilket event motiveringen hör".

          ✅ BÅDA KRAVEN UPPFYLLDA (`#1149`): `person.motiveringar` är
          Anmälnings-poster med `event` och `datum`, sorterade fallande
          server-side. Den gamla platta `motivering: string[]` ligger kvar i
          shapen men konsumeras inte här — a/b/c använder den fortfarande.

          Anmälningar utan motiveringstext filtreras bort: en person kan ha sex
          anmälningar och en enda motivering, och fem rader med tom kropp hade
          varit brus, inte ärlighet (antalet anmälningar står i "Just nu"). */}
      <section aria-labelledby="proto-d-motiveringar" className="flex min-w-0 flex-col gap-2">
        <h2 id="proto-d-motiveringar" className="px-4 font-semibold text-lg">
          Motiveringar
        </h2>
        <div className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong">
          {motiveringar.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border">
              {motiveringar.map((m) => (
                <li key={m.id} className="flex flex-col gap-1 py-3">
                  {/* METARUBRIKEN SÄGER VAD MOTIVERINGEN ÄR FÖR (Marcus
                      2026-08-12: *"Det ska stå i metarubriken 'För anmälan
                      till Fjärrskådning 18 augusti 2026 i Varberg', för det är
                      just vad det är en motivering FÖR"*).

                      FULLT kursnamn och FULLT datum med årtal — till skillnad
                      från tidslinjens "FS" och "18 augusti". Avsiktligt: den
                      här raden är en REFERENS som ska gå att läsa lösryckt,
                      tidslinjen är en ström där året framgår av år-rubriken
                      och utrymmet är mätt i pixlar.

                      Anmälningsdatumet står INTE här längre. Det besvarade en
                      fråga ingen ställer i det här blocket ("när skrevs
                      motiveringen") och konkurrerade med eventdatumet om
                      samma rad — vilket var precis den huller-om-buller-känsla
                      Marcus pekade på i tidslinjen. */}
                  <MotiveringsReferens kurs={m.event} eventDatum={m.eventDatum} ort={m.ort} />
                  <p className="whitespace-pre-line text-body">{m.motivering}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-3 text-small text-text-muted">Inga motiveringar registrerade.</p>
          )}
        </div>
      </section>

      {/* B7 — ANTECKNINGARNA. Marcus: "exakt samma liksom som vi har på
          eventdetalj-sidan. samma utseende och funktion med författar-attribut
          och de".

          ✅ RIKTIG STRÖM (`#1151`): egna rader i `Anteckningar`-tabellen med
          Person-länk, författare satt SERVER-SIDE ur inloggad identitet
          (`ADR-075`, samma kontrakt som event-strömmen) och tidpunkt ur
          `createdTime`. Composern är skarp, inte en stub.

          DET GAMLA FÄLTET LEVER KVAR NEDANFÖR. `Personer.Anteckningar`
          (`fldWGlNr3ujRHo85w`) är ETT odelat multilineText utan författare och
          utan tidpunkt (task-43-klassen), och det bär verklig text i drift —
          bl.a. spårbarhet för Avvikelse-fall sedan 2026-04-26. Att bara sluta
          rendera det hade DOLT data Lotta skrivit. Det visas därför som en
          egen, märkt yta tills någon medvetet migrerar innehållet in i
          strömmen; den migreringen är INTE gjord här. */}
      <Sektion id="proto-d-anteckningar" rubrik="Anteckningar">
        <PersonAnteckningar personId={person.id} personNamn={displayName(person)} />
        {person.anteckningar && (
          <div className="flex flex-col gap-1.5 py-3">
            <span className="text-caption text-text-muted">
              Äldre anteckning - odaterad, ingen författare
            </span>
            <p className="whitespace-pre-wrap text-body">{person.anteckningar}</p>
          </div>
        )}
      </Sektion>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// VÄRDEN — datahämtning + sid-skal (delat: det är app-krom, inte arrangemang)
// ═════════════════════════════════════════════════════════════════════════

/**
 * [PROTOTYPE] Persondetaljens divergens-pass.
 *
 * Sid-skalet (tillbaka-chevron, fokusflytt till h1, ladd-/fel-grenar) är
 * IDENTISKT i alla tre — det är appens krom, motsvarigheten till UI.md:s
 * "en delad `<Header>` är bra". Allt under headern är variantens eget: ingen
 * delad `<Layout>`, varje variant är fri att kasta arrangemanget.
 */
export function PersonDetail({ personId }: { personId: string }) {
  const dataSource = useDataSource();
  const headingRef = useRef<HTMLElement>(null);
  const announceRef = useRef(false);

  const {
    data: person,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.persons.detail(personId),
    queryFn: () => dataSource.fetchPerson(personId),
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  // Fokus → h1 när data anlänt (en gång per laddning) — skarpa vyns beteende.
  // Prototypen sätter INTE document.title: den skarpa vyn äger fliktiteln.
  useEffect(() => {
    if (person && !announceRef.current) {
      announceRef.current = true;
      headingRef.current?.querySelector<HTMLElement>('[data-proto-h1]')?.focus();
    }
  }, [person]);

  const notFound = error instanceof EdgeFunctionError && error.status === 404;

  // `data-testid` sitter på sidramen och därmed på ALLA render-grenar
  // (pending / error / innehåll) — samma placering som `personer-yta` i
  // `PersonsList.tsx`, och av samma skäl: promoverings-grinden (ADR-103 B4)
  // behöver ETT ankare som överlever både flippen och rivningen. Rent
  // attribut, ingen layout-effekt: fragmentet varianterna returnerar har
  // inget eget rot-element att hänga det på.
  //
  // TASK-299.6 — PROMOVERAD: husets delade `SidRam`-primitiv (kant-i-kant-
  // dialekten, endast sidkromet — rubriken lever kvar i sidan, PRD TASK-299
  // § OMFATTNINGEN LÅST) är nu den ENDA formen. Den inline-byggda chevronen
  // och dev-växeln `?sidram=ny` (TASK-299.1) är rivna (ADR-103 B2 steg 4).
  // Ytan var redan kant-i-kant, så bytet är RENT: TASK-299.2-mätningen
  // 2026-08-23 fann ytan byte-identisk med och utan växeln (MD5 lika,
  // boundingBox lika) — därav facit-amenderingens klass (b), se
  // s103-persondetalj-konvergens/AMENDERING-2026-08-23-sidram-promovering.md.
  const sidRam = (innehall: React.ReactNode) => (
    <section ref={headingRef} data-testid="persondetalj-yta" className="flex flex-col gap-6">
      <SidRam to="/personer" tillbakaEtikett="Tillbaka till personer" />
      {innehall}
    </section>
  );

  if (isPending) {
    // Lugnt laddläge (§15): slutgeometri, inga "Laddar…"-textrader.
    return sidRam(
      <div role="status" aria-busy="true" className="flex flex-col gap-6">
        <span className="sr-only">Laddar persondetaljer…</span>
        <Skeleton variant="text" className="mx-4 w-3/5 text-3xl" />
        <Skeleton variant="listRow" className="h-32 rounded-2xl" />
        <Skeleton variant="listRow" className="h-52 rounded-2xl" />
        <Skeleton variant="listRow" className="h-40 rounded-2xl" />
      </div>,
    );
  }

  if (isError) {
    return sidRam(
      notFound ? (
        <MessageBox intent="error" title="Personen hittades inte">
          Ingen person med det ID:t finns. Den kan ha tagits bort, eller så är länken felaktig.
        </MessageBox>
      ) : (
        <MessageBox intent="error" title="Kunde inte hämta persondetaljer">
          {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
        </MessageBox>
      ),
    );
  }

  // Nu-tiden läses EN gång per rendering och skickas ned — varje variant ska
  // klassa "kommande" mot samma ögonblick (annars kan två sektioner på samma
  // sida vara oense om huruvida ett event redan hänt).
  const nuMs = Date.now();

  return sidRam(
    <>
      {/* aria-live: bekräftar för skärmläsare att detaljerna anlänt. */}
      <p className="sr-only" role="status" aria-live="polite">
        {`Persondetaljer för ${displayName(person)} laddade.`}
      </p>
      <VariantD person={person} nuMs={nuMs} />
      {/* Villkoret är BORTA, inte kvarglömt: `variant` kan bara vara `'d'`
          sedan A/B/C revs (ADR-103 B2 steg 1, 2026-08-12), och en gren som
          alltid är sann är en lögn om att det finns ett val. Propen står kvar
          till rivningen i steg 4 — den är rail-substratets sista tråd. */}
    </>,
  );
}
