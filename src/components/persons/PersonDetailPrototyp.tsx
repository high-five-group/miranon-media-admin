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
import { ChevronLeft, ChevronRight, Download, Mail, Phone } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/primitives/Button';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import type { PersonDetail as PersonDetailType, PersonHistoryEntry } from '@/domain/schemas';
import { arGenomford } from '@/lib/genomford';
import { kursfargForKurs } from '@/lib/kursfarg';
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

/**
 * Hela KALENDERDAGAR mellan två tidpunkter — inte 24-timmarsblock.
 *
 * "för 2 dagar sedan" ska betyda "i förrgår", inte "för minst 48 timmar
 * sedan": en händelse i går kväll och en i går morse är båda "i går" för
 * Lotta. Samma räkning som basens `Dagar sedan senaste interaktion` gör,
 * men här räknad mot den händelse vyn FAKTISKT visar (se `senasteHandelse`
 * i variant D) i stället för mot ett fält som kan peka på en annan.
 */
function dagarMellan(franMs: number, tillMs: number): number {
  const fran = new Date(franMs);
  const till = new Date(tillMs);
  fran.setHours(0, 0, 0, 0);
  till.setHours(0, 0, 0, 0);
  return Math.round((till.getTime() - fran.getTime()) / 86_400_000);
}

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
        ? 'border border-border-strong text-text-secondary'
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

/**
 * Etikett-värde-raden med S73:s OMVÄNDA viktning (DetaljGrupp.tsx:51-73):
 * etiketten dämpad vänster, VÄRDET primärt och högerställt. Skarpa
 * PersonDetail sätter i dag `text-small` på både `dt` och `dd` och
 * `sm:min-w-48` på etiketten — det är den grammatiken som byts här.
 */
function Rad({ term, children }: { term: string; children: React.ReactNode }) {
  if (children == null || children === '') return null;
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="shrink-0 text-small text-text-muted">{term}</dt>
      <dd className="text-right text-body">{children}</dd>
    </div>
  );
}

/**
 * [PROTOTYPE] Anteckningen — LÄSLÄGET ur `PersonNoteEditor` (rad 93-107),
 * kopierat med Redigera-knappen som NO-OP.
 *
 * Varför en stub och inte den riktiga komponenten: `useUpdatePersonNote`
 * skriver skarpt mot Airtable. Prototyp-skillens read-only-förstärkning är
 * absolut ("produktions-basen tar aldrig prototyp-writes, ej heller staging"),
 * och Marcus öppnar de här varianterna i webbläsaren mot staging. Formen är
 * identisk; bara skrivningen är bortkopplad.
 *
 * TASK-43-KLASSEN, VISAD SOM DEN ÄR: fältet är EN odelad multilineText utan
 * författare och utan tidpunkt. "Vem skrev detta, när?" går inte att besvara.
 * Det designas INTE bort här — varje variant bär konsekvensen öppet, och
 * rapporten säger vad som händer med respektive arrangemang den dag fältet
 * blir en ström av poster med författare + tidpunkt (ADR-075-mönstret).
 */
function AnteckningLas({ note, odaterad = false }: { note: string | null; odaterad?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      {odaterad && note && (
        <span className="text-caption text-text-muted">
          Odaterad - ingen författare, ingen tidpunkt
        </span>
      )}
      {note ? (
        <p className="whitespace-pre-wrap text-small">{note}</p>
      ) : (
        <p className="text-small text-text-muted">Inga anteckningar.</p>
      )}
      <div>
        <Button
          intent="secondary"
          size="sm"
          onPress={() => {
            // [PROTOTYPE] No-op. Prototyper kopplas aldrig till verkliga
            // mutationer (prototype-skillen § Miljö- och adapter-förhållandet).
          }}
        >
          Redigera
        </Button>
      </div>
    </div>
  );
}

/** Flaggorna som text — samma härledning i alla tre (bara PLACERINGEN skiljer). */
function flaggor(person: PersonDetailType): string[] {
  return [
    person.aiFlagga ? `AI-flagga: ${person.aiFlagga}` : null,
    // `manuellFlagga` renderas INTE i någon variant: fältet är en singleSelect
    // med choices=[] i basen → ALLTID null (data-model.md §Kända fällor 25).
    // Död yta ska inte ta plats i formen; att den saknas är ett medvetet val.
    person.ejGodkandMail ? 'Ej godkänd för mailutskick' : null,
    person.inbjudenCommunity ? 'Inbjuden till community' : null,
    person.skapatKontoCommunity ? 'Konto i community' : null,
  ].filter((v): v is string => v !== null);
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
  poster: PersonHistoryEntry[];
};

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

/** Kursmixen ur de GENOMFÖRDA raderna (delade `arGenomford`, aldrig egen regel). */
function kursmix(historik: PersonHistoryEntry[]): { etikett: string; bgClass: string }[] {
  const rakning = new Map<string, { etikett: string; bgClass: string; antal: number }>();
  for (const entry of historik.filter(arGenomford)) {
    const farg = kursfargForKurs(entry.kursnamn);
    const etikett = farg.klass === 'annat' ? (entry.kursnamn ?? 'Annat') : farg.etikett;
    const post = rakning.get(etikett);
    if (post) post.antal += 1;
    else rakning.set(etikett, { etikett, bgClass: farg.bgClass, antal: 1 });
  }
  return [...rakning.values()].map((p) => ({ etikett: p.etikett, bgClass: p.bgClass }));
}

// ═════════════════════════════════════════════════════════════════════════
// VARIANT A — HISTORIK-FÖRST · "vem är detta för oss?"
// ═════════════════════════════════════════════════════════════════════════

/**
 * Arrangemanget: engagemanget över tid ligger ÖVERST och tar mest plats.
 * Summeringen är sidans andra element, kurshistoriken dess huvudyta —
 * kontaktuppgifterna är stödinformation som kommer EFTER, för Lotta kommer
 * hit från ytor som redan visat kontakten (anmälnings- och betalningsvyerna).
 *
 * Vad varianten OFFRAR: den som öppnar sidan för att snabbt mejla eller ringa
 * måste scrolla förbi hela historiken. Och för en lead utan historik — som
 * fixturens tunna person — är hela huvudytan ett tomtillstånd.
 */
function VariantA({ person, nuMs }: { person: PersonDetailType; nuMs: number }) {
  const grupper = grupperaPerEvent(person.historik);
  const mix = kursmix(person.historik);
  const flag = flaggor(person);
  const kontakt = [person.email, person.telefon].filter(Boolean);

  return (
    <>
      {/* IDENTITET — namn + var personen står, inget mer. */}
      <header className="flex flex-col gap-2 px-4">
        <h1 className="font-semibold text-3xl" tabIndex={-1} data-proto-h1>
          {displayName(person)}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {person.erfarenhetsbadge && <Pill paKortyta={false}>{person.erfarenhetsbadge}</Pill>}
          {flag.map((f) => (
            <Pill key={f} paKortyta={false}>
              {f}
            </Pill>
          ))}
        </div>
      </header>

      {/* SUMMERINGEN — tre tal + kursmixen som mätarspår.
          Mätarformen är Gruppdynamiks (Gruppdynamik.tsx:317-330): segment i
          kursfärgerna (§17-tokens), `aria-hidden`, och legenden under bär
          samma information som TEXT (färg aldrig ensam, WCAG 1.4.1). */}
      <section aria-labelledby="proto-a-summering" className="flex min-w-0 flex-col gap-2">
        <h2 id="proto-a-summering" className="px-4 font-semibold text-lg">
          Engagemang
        </h2>
        <div className="flex flex-col gap-3 rounded-2xl border border-transparent bg-bg-muted px-4 py-4 contrast-more:border-border-strong">
          <div className="flex justify-between gap-3">
            {[
              { etikett: 'Genomförda event', tal: person.antalGenomfordaEvent },
              { etikett: 'Deltaganden', tal: person.antalDeltaganden },
              { etikett: 'Anmälningar', tal: person.antalAnmalningar },
            ].map((m) => (
              <div key={m.etikett} className="flex min-w-0 flex-col gap-0.5">
                <span className="font-semibold text-2xl tabular-nums">{m.tal}</span>
                <span className="text-caption text-text-muted">{m.etikett}</span>
              </div>
            ))}
          </div>
          {mix.length > 0 ? (
            <>
              <div
                aria-hidden="true"
                className="flex h-1.5 gap-px overflow-hidden rounded-full bg-surface"
              >
                {mix.map((k) => (
                  <div
                    key={k.etikett}
                    className={k.bgClass}
                    style={{ width: `${100 / mix.length}%` }}
                  />
                ))}
              </div>
              <ul className="flex flex-wrap gap-x-4 gap-y-1">
                {mix.map((k) => (
                  <li key={k.etikett} className="flex items-center gap-1.5 text-caption">
                    <span
                      aria-hidden="true"
                      className={`size-2 shrink-0 rounded-full ${k.bgClass}`}
                    />
                    <span className="text-text-secondary">{k.etikett}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-small text-text-muted">Inga genomförda event ännu.</p>
          )}
        </div>
      </section>

      {/* KURSHISTORIKEN — sidans huvudyta, grupperad PER EVENT. */}
      <section aria-labelledby="proto-a-historik" className="flex min-w-0 flex-col gap-2">
        <h2 id="proto-a-historik" className="px-4 font-semibold text-lg">
          Kurshistorik
        </h2>
        {grupper.length > 0 ? (
          <ul
            aria-label="Kurshistorik, senaste först"
            className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong"
          >
            {grupper.map((grupp) => {
              const farg = kursfargForKurs(grupp.kursnamn);
              const meta = [langtDatum(grupp.datum), grupp.ort, grupp.typ]
                .filter(Boolean)
                .join(' · ');
              return (
                <li key={grupp.nyckel} className="flex gap-3 py-3">
                  {/* Kursstrecket — kalendervyns markör-grammatik, dekorativ. */}
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
            <p className="font-medium text-body">Ingen kurshistorik ännu</p>
            <p className="text-small text-text-muted">
              Personen har inte deltagit i något event - historiken fylls när ett deltagande
              registreras.
            </p>
          </div>
        )}
      </section>

      {/* STÖDINFORMATIONEN — allt som inte är historik, i facit-grammatik. */}
      <Sektion id="proto-a-kontakt" rubrik="Kontakt">
        {kontakt.length > 0 ? (
          <dl className="divide-y divide-border">
            <Rad term="E-post">{person.email}</Rad>
            <Rad term="Telefon">{person.telefon}</Rad>
          </dl>
        ) : (
          <p className="py-3 text-small text-text-muted">Inga kontaktuppgifter registrerade.</p>
        )}
      </Sektion>

      <Sektion id="proto-a-tidslage" rubrik="Nuläge">
        <dl className="divide-y divide-border">
          <Rad term="Aktiv anmälan">{person.harAktivAnmalan}</Rad>
          {/* `nastaEvent` är i praktiken ALLTID null i drift (EF:en läser
              `Nästa event (text)`, basen bär `Nästa event (rad)`). Raden
              renderar bara när fältet faktiskt bär värde — den reserverar
              ingen plats för ett fält som inte kommer. */}
          <Rad term="Nästa event">{person.nastaEvent}</Rad>
          <Rad term="Senaste deltagande">{langtDatum(person.senasteDeltagandeDatum)}</Rad>
          <Rad term="Senaste interaktion">{person.senasteInteraktion}</Rad>
          <Rad term="Återkommande?">{person.aterkommande}</Rad>
        </dl>
      </Sektion>

      <Sektion id="proto-a-leads" rubrik="Leads &amp; erbjudanden">
        {person.antalHamtningar === 0 &&
        person.allaHamtningar.length === 0 &&
        person.motivering.length === 0 ? (
          <p className="py-3 text-small text-text-muted">
            Inga lead-magnet-hämtningar registrerade.
          </p>
        ) : (
          <>
            {person.allaHamtningar.length > 0 && (
              <ul className="flex flex-col gap-2 py-3">
                {person.allaHamtningar.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-body">
                    <Download
                      aria-hidden="true"
                      size={16}
                      className="mt-1 shrink-0 text-text-secondary"
                    />
                    <span className="min-w-0">{h}</span>
                  </li>
                ))}
              </ul>
            )}
            {person.motivering.length > 0 && (
              <div className="flex flex-col gap-1 py-3">
                <span className="text-small text-text-muted">Motivering</span>
                {/* string[] (TASK-52, fler-värt) — "\n\n" ger ett stycke per
                    motivering under whitespace-pre-line. */}
                <p className="whitespace-pre-line text-body">{person.motivering.join('\n\n')}</p>
              </div>
            )}
          </>
        )}
      </Sektion>

      <Sektion id="proto-a-anteckningar" rubrik="Anteckningar">
        <div className="py-3">
          <AnteckningLas note={person.anteckningar} />
        </div>
      </Sektion>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// VARIANT B — KONTAKT-FÖRST · "hur når jag hen och vad behöver jag veta nu?"
// ═════════════════════════════════════════════════════════════════════════

/**
 * Arrangemanget: personen som KONTAKT. Identitetszonen är tät — namn,
 * badge — och direkt under den ligger handlingarna som RADER (Mejla · Ring) i
 * eventsidans åtgärdsgrammatik (Atgarder.tsx: -mx-2-hover-platta, chevron
 * 18 px eftersom raden leder vidare, §14). Nuläget står som ett tintat kort
 * ovanför allt historiskt; historiken komprimeras till de tre senaste eventen.
 *
 * Vad varianten OFFRAR: djupet. "Vem är detta för oss" besvaras inte här —
 * bara "vad behöver jag göra nu". Och den är HÅRT beroende av fält som ofta är
 * tomma: `nastaEvent` är i praktiken alltid null i drift, och betalstatusen —
 * det som skulle göra varianten verkligt handlingsbar — bor på Anmälningar och
 * kräver en EF-utökning. Byggd som den är, så skillnaden syns.
 */
function VariantB({ person, nuMs }: { person: PersonDetailType; nuMs: number }) {
  const grupper = grupperaPerEvent(person.historik);
  const senaste = grupper.slice(0, 3);
  const flag = flaggor(person);
  const aktiv = person.harAktivAnmalan === 'Aktiv';

  const radKlass =
    '-mx-2 flex w-auto items-center gap-3 rounded-lg px-2 py-3 text-left font-medium text-body hover:bg-bg-emphasized motion-safe:transition-colors';

  return (
    <>
      {/* IDENTITETSZONEN — tät: namn, ort, badge, sedan handlingarna direkt. */}
      <header className="flex flex-col gap-2 px-4">
        <h1 className="font-semibold text-3xl" tabIndex={-1} data-proto-h1>
          {displayName(person)}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-text-muted">
          {person.erfarenhetsbadge && <span>{person.erfarenhetsbadge}</span>}
        </div>
      </header>

      {/* HANDLINGARNA — sidans primära yta. `mailto:`/`tel:` är riktiga länkar
          (ingen mutation); chevron 18 px eftersom raden leder ut ur appen. */}
      <section aria-labelledby="proto-b-kontakt" className="flex min-w-0 flex-col gap-2">
        <h2 id="proto-b-kontakt" className="px-4 font-semibold text-lg">
          Kontakt
        </h2>
        <div className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong">
          {person.email || person.telefon ? (
            <div className="flex flex-col py-1.5">
              {person.email && (
                <a href={`mailto:${person.email}`} className={radKlass}>
                  <Mail aria-hidden="true" size={18} className="shrink-0 text-text-secondary" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{person.email}</span>
                    <span className="font-normal text-small text-text-muted">Skicka mail</span>
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    size={18}
                    className="shrink-0 text-text-secondary"
                  />
                </a>
              )}
              {person.telefon && (
                <a href={telHref(person.telefon)} className={radKlass}>
                  <Phone aria-hidden="true" size={18} className="shrink-0 text-text-secondary" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{person.telefon}</span>
                    <span className="font-normal text-small text-text-muted">Ring</span>
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    size={18}
                    className="shrink-0 text-text-secondary"
                  />
                </a>
              )}
            </div>
          ) : (
            <p className="py-3 text-small text-text-muted">Inga kontaktuppgifter registrerade.</p>
          )}
          {person.ejGodkandMail && (
            <p className="py-3 text-small text-text-muted">
              Personen har tackat nej till mailutskick - mejla bara personligt.
            </p>
          )}
        </div>
      </section>

      {/* NULÄGET — tintat kort så det läses som "det här gäller just nu". */}
      <section aria-labelledby="proto-b-nulage" className="flex min-w-0 flex-col gap-2">
        <h2 id="proto-b-nulage" className="px-4 font-semibold text-lg">
          Just nu
        </h2>
        <div className="flex flex-col gap-2 rounded-2xl border border-transparent bg-primary-tint px-4 py-4 contrast-more:border-border-strong">
          <div className="flex flex-wrap items-center gap-2">
            {/* M4-defekten dödad: `harAktivAnmalan` är en formel som ger
                "Aktiv" ELLER "Ingen aktiv anmälan" och är ALDRIG falsy.
                Jämförelsen går mot STRÄNGVÄRDET. */}
            {aktiv ? (
              <Pill ton="aktiv">Aktiv anmälan</Pill>
            ) : (
              <span className="text-small text-text-muted">Ingen aktiv anmälan</span>
            )}
            {person.antalAnmalningar > 0 && (
              <span className="text-small text-text-secondary tabular-nums">
                {person.antalAnmalningar}{' '}
                {person.antalAnmalningar === 1 ? 'anmälan' : 'anmälningar'} totalt
              </span>
            )}
          </div>
          {person.nastaEvent && (
            <p className="text-body">
              <span className="text-text-muted">Nästa event: </span>
              {person.nastaEvent}
            </p>
          )}
          {person.senasteInteraktion && (
            <p className="text-small text-text-secondary">
              Senaste kontakt
              {person.dagarSedanSenaste != null
                ? person.dagarSedanSenaste === 0
                  ? ' i dag'
                  : ` för ${person.dagarSedanSenaste} ${person.dagarSedanSenaste === 1 ? 'dag' : 'dagar'} sedan`
                : ''}
              : {person.senasteInteraktion}
            </p>
          )}
        </div>
      </section>

      {flag.length > 0 && (
        <Sektion id="proto-b-flaggor" rubrik="Att känna till">
          <ul aria-label="Flaggor" className="divide-y divide-border">
            {flag.map((f) => (
              <li key={f} className="py-3 text-body">
                {f}
              </li>
            ))}
          </ul>
        </Sektion>
      )}

      {/* HISTORIKEN KOMPRIMERAD — tre senaste event, en rad var. */}
      <Sektion id="proto-b-historik" rubrik="Kurshistorik">
        {senaste.length > 0 ? (
          <>
            <ul aria-label="Senaste eventen" className="divide-y divide-border">
              {senaste.map((grupp) => {
                const lage = narvarolage(grupp.poster[0], nuMs);
                return (
                  <li key={grupp.nyckel} className="flex items-center justify-between gap-3 py-3">
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-body">{grupp.rubrik}</span>
                      <span className="text-small text-text-muted">
                        {[langtDatum(grupp.datum), grupp.ort].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <Pill ton={lage === 'kommande' ? 'kommande' : 'neutral'}>
                      {lage === 'kommande'
                        ? 'Kommande'
                        : lage === 'narvarande'
                          ? 'Närvarande'
                          : 'Ej närvaro'}
                    </Pill>
                  </li>
                );
              })}
            </ul>
            {grupper.length > senaste.length && (
              <p className="py-3 text-small text-text-muted tabular-nums">
                {grupper.length} event totalt · {person.antalGenomfordaEvent} genomförda
              </p>
            )}
          </>
        ) : (
          <p className="py-3 text-small text-text-muted">Ingen registrerad kurshistorik.</p>
        )}
      </Sektion>

      <Sektion id="proto-b-leads" rubrik="Leads &amp; erbjudanden">
        {person.allaHamtningar.length === 0 && person.motivering.length === 0 ? (
          <p className="py-3 text-small text-text-muted">
            Inga lead-magnet-hämtningar registrerade.
          </p>
        ) : (
          <>
            <dl className="divide-y divide-border">
              <Rad term="Hämtade erbjudanden">
                {person.allaHamtningar.length > 0 ? person.allaHamtningar.length : null}
              </Rad>
            </dl>
            {/* Motiveringen är en löptext på upp till ~600 tecken — den kan
                inte bo i en högerställd etikett-värde-rad. Klippt på tre rader
                i Gruppdynamiks motiverings-form; handlingsläget behöver
                intrycket, inte hela svaret. */}
            {person.motivering.length > 0 && (
              <div className="flex flex-col gap-1 py-3">
                <span className="text-small text-text-muted">Motivering</span>
                <p className="line-clamp-3 whitespace-pre-line text-body">
                  {person.motivering.join('\n\n')}
                </p>
              </div>
            )}
          </>
        )}
      </Sektion>

      <Sektion id="proto-b-anteckningar" rubrik="Anteckningar">
        <div className="py-3">
          <AnteckningLas note={person.anteckningar} />
        </div>
      </Sektion>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// VARIANT C — TIDSLINJE · "vad har hänt med den här personen?"
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
  pillar: { id: string; text: string; ton: PillTon }[];
};

/**
 * Hämtnings-strängens efterhängda datum: "Pyramidernas Vajrar (2026-06-09)".
 *
 * ⚠️ [PROTOTYPE] DETTA ÄR ANTI-MÖNSTRET, MEDVETET BEGÅNGET.
 *
 * `Alla hämtningar` är en text-rollup över Touchpoints; att plocka isär den med
 * regex är exakt den klass data-model.md varnar för, och i PROD är den dessutom
 * en ARRAYJOIN-klump i ETT array-element (fixturen ger tre separata element).
 * Parsningen finns här av ETT skäl: utan den kan tidslinjens FORM inte prövas
 * alls, och en variant som förlorar för att datat inte serverades är en variant
 * som förlorar av fel skäl. Vinner C är EF-utökningen (touchpoints som POSTER,
 * inte som text) ett byggkrav — inte den här regexen.
 */
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
      rubrik: grupp.rubrik,
      meta: [grupp.ort, grupp.typ].filter(Boolean).join(' · ') || null,
      prickKlass: farg.bgClass,
      pillar: grupp.poster.map((entry) => {
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
      const rubrik = anmalan.event ? `Anmäld till ${anmalan.event}` : 'Anmäld';
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
        // Eventets datum SKILJER TILLFÄLLEN ÅT — två anmälningar till samma
        // kurs ger annars två identiska rader. Motiveringen kopplar posten
        // till B6 utan att upprepa texten. `eventDatum` är null tills EF:ens
        // utökning är deployad; raden faller då tillbaka på enbart
        // motiverings-noten, precis som före ändringen.
        meta:
          [
            anmalan.eventDatum ? langtDatum(anmalan.eventDatum) : null,
            anmalan.motivering ? 'skrev en motivering' : null,
          ]
            .filter(Boolean)
            .join(' · ') || null,
        prickKlass: 'bg-text-secondary',
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
      const rubrik = h.erbjudande ?? h.typ ?? 'Okänd hämtning';
      if (!Number.isFinite(tid)) {
        oplacerade.push(rubrik);
        continue;
      }
      lagg({
        id: `hamtning-${h.id}`,
        tidMs: tid,
        slag: 'hamtning',
        kommande: false,
        rubrik,
        // `typ` förklarar en post vars `erbjudande` är null (alla touchpoints
        // är inte hämtningar) — visas bara när den tillför något.
        meta: h.erbjudande && h.typ ? h.typ : 'Hämtade ett erbjudande',
        prickKlass: 'bg-text-muted',
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

  // 4. Strömmens början.
  const skapadTid = person.radSkapad ? Date.parse(person.radSkapad) : Number.NaN;
  if (Number.isFinite(skapadTid)) {
    lagg({
      id: 'registrerad',
      tidMs: skapadTid,
      slag: 'registrerad',
      kommande: false,
      rubrik: 'Kom in i registret',
      meta: null,
      prickKlass: 'bg-border-strong',
      pillar: [],
    });
  }

  poster.sort((a, b) => b.tidMs - a.tidMs);
  return { poster, oplacerade };
}

/** En post i strömmen — rälsen ritas med absolut linje + prick per post. */
function StromRad({ post, sist }: { post: StromPost; sist: boolean }) {
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!sist && (
        <span aria-hidden="true" className="absolute top-4 bottom-0 left-[7px] w-px bg-border" />
      )}
      <span
        aria-hidden="true"
        className={`relative mt-1.5 size-3.5 shrink-0 rounded-full border-2 border-bg-muted ${
          post.kommande ? 'bg-bg-muted ring-2 ring-border-strong ring-inset' : post.prickKlass
        }`}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-caption text-text-muted tabular-nums">{post.datumText}</span>
        <span className="font-semibold text-body">{post.rubrik}</span>
        {post.meta && <span className="text-small text-text-muted">{post.meta}</span>}
        {post.pillar.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {post.pillar.map((p) => (
              <Pill key={p.id} ton={p.ton}>
                {p.text}
              </Pill>
            ))}
          </div>
        )}
      </div>
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
function VariantC({ person, nuMs }: { person: PersonDetailType; nuMs: number }) {
  // 'rollup' MED AVSIKT — C:s hela poäng är att visa vad EF:en INTE levererade.
  const { poster, oplacerade } = byggStrom(person, nuMs, 'rollup');
  const kommande = poster.filter((p) => p.kommande);
  const historiska = poster.filter((p) => !p.kommande);
  const flag = flaggor(person);

  // År-grupperna över de historiska posterna (strömmen är redan sorterad).
  const arGrupper: { ar: number; poster: StromPost[] }[] = [];
  for (const post of historiska) {
    const sista = arGrupper.at(-1);
    if (sista && sista.ar === post.ar) sista.poster.push(post);
    else arGrupper.push({ ar: post.ar, poster: [post] });
  }

  const kortKlass =
    'rounded-2xl border border-transparent bg-bg-muted px-4 py-4 contrast-more:border-border-strong';

  return (
    <>
      {/* IDENTITETSREMSAN — medvetet liten: strömmen är sidans huvudsak. */}
      <header className="flex flex-col gap-1 px-4">
        <h1 className="font-semibold text-3xl" tabIndex={-1} data-proto-h1>
          {displayName(person)}
        </h1>
        <p className="text-small text-text-muted">
          {[
            person.email,
            person.telefon,
            person.ort.length > 0 ? person.ort.join(' · ') : null,
            person.erfarenhetsbadge,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {flag.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {flag.map((f) => (
              <Pill key={f} paKortyta={false}>
                {f}
              </Pill>
            ))}
          </div>
        )}
      </header>

      {/* ANTECKNINGEN — fastnålad OVANFÖR strömmen, inte i den.
          Den kan inte placeras i tid: fältet är en odelad multilineText utan
          författare och utan tidpunkt (task-43-klassen). Att den ligger utanför
          rälsen ÄR designsvaret, inte en miss. */}
      {person.anteckningar && (
        <section aria-labelledby="proto-c-anteckning" className="flex min-w-0 flex-col gap-2">
          <h2 id="proto-c-anteckning" className="px-4 font-semibold text-lg">
            Anteckning
          </h2>
          <div className={kortKlass}>
            <AnteckningLas note={person.anteckningar} odaterad />
          </div>
        </section>
      )}

      <section aria-labelledby="proto-c-strom" className="flex min-w-0 flex-col gap-2">
        <h2 id="proto-c-strom" className="px-4 font-semibold text-lg">
          Historik
        </h2>
        {poster.length > 0 ? (
          <div className={`flex flex-col gap-4 ${kortKlass}`}>
            {kommande.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-small text-text-secondary">Kommande</h3>
                <ol className="flex flex-col">
                  {kommande.map((post, i) => (
                    <StromRad key={post.id} post={post} sist={i === kommande.length - 1} />
                  ))}
                </ol>
              </div>
            )}
            {arGrupper.map((grupp) => (
              <div key={grupp.ar} className="flex flex-col gap-2">
                <h3 className="font-semibold text-small text-text-secondary tabular-nums">
                  {grupp.ar}
                </h3>
                <ol className="flex flex-col">
                  {grupp.poster.map((post, i) => (
                    <StromRad key={post.id} post={post} sist={i === grupp.poster.length - 1} />
                  ))}
                </ol>
              </div>
            ))}
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

      {/* UTANFÖR TIDSLINJEN — det som inte går att datera, ärligt samlat.
          En tidslinje som tyst tappar sex anmälningar och en motivering ljuger
          om att "allt som hänt" står i strömmen. */}
      <Sektion id="proto-c-odaterat" rubrik="Utanför tidslinjen">
        <dl className="divide-y divide-border">
          <Rad term="Anmälningar">
            {person.antalAnmalningar > 0 ? person.antalAnmalningar : null}
          </Rad>
          <Rad term="Hämtningar enligt räknaren">
            {person.antalHamtningar > 0 ? person.antalHamtningar : null}
          </Rad>
          <Rad term="Aktiv anmälan">{person.harAktivAnmalan}</Rad>
          <Rad term="Återkommande?">{person.aterkommande}</Rad>
        </dl>
        {/* Ärligheten skriven i klartext, inte gömd i en kodkommentar: talen
            ovan har inga datum i persondetaljens svar, så de KAN inte stå i
            strömmen. Anmälningarnas datum bor på Anmälningar och kräver en
            EF-utökning; hämtnings-räknaren och hämtnings-listan är dessutom två
            olika rollups i basen och säger olika saker (1 mot 3). */}
        {person.antalAnmalningar > 0 && (
          <p className="py-3 text-small text-text-muted">
            De här uppgifterna saknar datum och kan därför inte placeras i tidslinjen.
          </p>
        )}
        {oplacerade.length > 0 && (
          <ul className="flex flex-col gap-1 py-3">
            {oplacerade.map((post) => (
              <li key={post} className="text-small text-text-muted">
                {post} - saknar datum
              </li>
            ))}
          </ul>
        )}
        {person.motivering.length > 0 && (
          <div className="flex flex-col gap-1 py-3">
            <span className="text-small text-text-muted">Motivering</span>
            <p className="whitespace-pre-line text-body">{person.motivering.join('\n\n')}</p>
          </div>
        )}
        {!person.anteckningar && (
          <div className="py-3">
            <AnteckningLas note={null} />
          </div>
        )}
      </Sektion>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════
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
  const { poster, oplacerade } = byggStrom(person, nuMs, 'poster');
  // KOMMANDE SORTERAS STIGANDE — närmast i tiden först. `poster` är datum-DESC,
  // vilket är rätt för historik och FEL för framtid: med tre kommande event
  // hade det som ligger längst bort hamnat överst under rubriken "Kommande".
  // Osynligt på en person med exakt ett kommande event, vilket är varför det
  // överlevde till 2026-08-12.
  const kommande = poster.filter((p) => p.kommande).sort((a, b) => a.tidMs - b.tidMs);
  const historiska = poster.filter((p) => !p.kommande);
  const grupper = grupperaPerEvent(person.historik);
  // B4 ÄR HISTORIK. Ett kommande event hör i strömmens "Kommande"-sektion —
  // under rubriken "Eventhistorik" (aria-label "senaste först") påstod det att
  // personen deltagit på något som inte hänt. Mätt på Sofia Isaksson
  // 2026-08-12: "Fjärrskådning · 18 augusti 2026 · Dag 1 · Kommande" låg
  // ÖVERST i listan. Datumlösa grupper (`tidMs` 0) behålls — de kan inte
  // klassas som framtid, och att tappa dem vore data-förlust.
  const historikGrupper = grupper.filter((g) => !g.tidMs || g.tidMs <= nuMs);
  // NÄSTA EVENT härleds ur strömmen, INTE ur `person.nastaEvent`. Det fältet
  // (`Nästa event (text)`) är null i varje mätning — även för en person som
  // bevisligen HAR ett kommande event (Sofia Isaksson 2026-08-12: EF-svaret
  // ger `nastaEvent: null` medan Fjärrskådning 2026-08-18 ligger i historiken).
  // Blocket stod därför tomt på sin viktigaste uppgift. Samma klass som
  // `Antal hämtningar`: ett fält vars namn lovar mer än fältet håller.
  const nastaEvent = kommande.find((p) => p.slag === 'event') ?? null;
  // SENASTE HÄNDELSE — strömmens färskaste historiska post. Ersätter
  // `senasteInteraktion`-strängen (§46-klumpen, se byggStrom steg 2).
  // Tidsordet räknas mot den post vyn FAKTISKT visar, inte mot basens
  // `Dagar sedan senaste interaktion`: de två kan peka på olika händelser,
  // och "för 2 dagar sedan: <något som hände i går>" är värre än inget tal.
  //
  // `registrerad` EXKLUDERAS. Raden svarar på "vad gjorde personen senast",
  // och att en rad föddes i Airtable är ingen handling personen utfört. Felet
  // var osynligt fram till EF-deployen 2026-08-12: så länge anmälningarna bar
  // `Rad skapad` låg de på samma sekund som registreringen och vann på
  // sorteringens stabilitet. Med riktiga `Inskickad`-datum flyttade de bakåt i
  // tiden och blottade posten under — "Senast för 2 dagar sedan: Kom in i
  // registret", medan personen faktiskt anmälde sig till Fjärrskådning
  // 7 augusti. En fix som avslöjar nästa fel har gjort sitt jobb.
  const senasteHandelse = historiska.find((p) => p.slag !== 'registrerad') ?? null;
  const senastDagar = senasteHandelse ? dagarMellan(senasteHandelse.tidMs, nuMs) : 0;
  const senastNar =
    senastDagar <= 0 ? 'i dag' : senastDagar === 1 ? 'i går' : `för ${senastDagar} dagar sedan`;
  // Anmälningar utan motiveringstext bär ingenting att visa — se B6-noten.
  const motiveringar = person.motiveringar.filter((m) => m.motivering);
  const flag = flaggorD(person);
  const aktiv = person.harAktivAnmalan === 'Aktiv';

  const arGrupper: { ar: number; poster: StromPost[] }[] = [];
  for (const post of historiska) {
    const sista = arGrupper.at(-1);
    if (sista && sista.ar === post.ar) sista.poster.push(post);
    else arGrupper.push({ ar: post.ar, poster: [post] });
  }

  const kortKlass =
    'rounded-2xl border border-transparent bg-bg-muted px-4 py-4 contrast-more:border-border-strong';
  const radKlass =
    '-mx-2 flex w-auto items-center gap-3 rounded-lg px-2 py-3 text-left font-medium text-body hover:bg-bg-emphasized motion-safe:transition-colors';

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
            <div className="flex flex-col py-1.5">
              {person.email && (
                <a href={`mailto:${person.email}`} className={radKlass}>
                  <Mail aria-hidden="true" size={18} className="shrink-0 text-text-secondary" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{person.email}</span>
                    <span className="font-normal text-small text-text-muted">Skicka mail</span>
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    size={18}
                    className="shrink-0 text-text-secondary"
                  />
                </a>
              )}
              {person.telefon && (
                <a href={telHref(person.telefon)} className={radKlass}>
                  <Phone aria-hidden="true" size={18} className="shrink-0 text-text-secondary" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{person.telefon}</span>
                    <span className="font-normal text-small text-text-muted">Ring</span>
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    size={18}
                    className="shrink-0 text-text-secondary"
                  />
                </a>
              )}
            </div>
          ) : (
            <p className="py-3 text-small text-text-muted">Inga kontaktuppgifter registrerade.</p>
          )}
          {person.ejGodkandMail && (
            <p className="py-3 text-small text-text-muted">
              Personen har tackat nej till mailutskick - mejla bara personligt.
            </p>
          )}
        </div>
      </section>

      {/* B8 — JUST NU, under kontakten. Marcus: "det kan se ut som det i proto-b
          fast mycket snyggare". Substansen är problemet i b, inte formen:
          basfältet `nastaEvent` är ALLTID null i drift, så b:s kort bär i
          praktiken en enda rad. D fyller det med det som FAKTISKT finns —
          erfarenhetsbadgen, flaggorna, engagemanget i tal, och nästa event
          HÄRLETT ur strömmen i stället för ur det döda fältet (se
          `nastaEvent`-härledningen ovan) — och håller tintningen som säger
          "detta gäller nu".

          ORTEN står medvetet INTE här, till skillnad från vad denna rad
          påstod fram till 2026-08-12: `Personer.Ort` är en rollup över
          personens ANMÄLNINGAR, inte en hemort ("man kan väl inte bo på mer
          än en plats?", Marcus 2026-08-10 — premissen revs i Del 4). */}
      <section aria-labelledby="proto-d-nulage" className="flex min-w-0 flex-col gap-2">
        <h2 id="proto-d-nulage" className="px-4 font-semibold text-lg">
          Just nu
        </h2>
        <div className="flex flex-col gap-3 rounded-2xl border border-transparent bg-primary-tint px-4 py-4 contrast-more:border-border-strong">
          <div className="flex flex-wrap items-center gap-2">
            {aktiv ? <Pill ton="aktiv">Aktiv anmälan</Pill> : <Pill>Ingen aktiv anmälan</Pill>}
            {person.erfarenhetsbadge && <Pill>{person.erfarenhetsbadge}</Pill>}
            {flag.map((f) => (
              <Pill key={f}>{f}</Pill>
            ))}
          </div>

          {/* ENGAGEMANGET I TAL. B6 filtrerar bort anmälningar utan motivering
              och motiverar det med att "antalet anmälningar står i Just nu" —
              vilket det inte gjorde förrän nu. Utan talet är filtret
              omotiverat och en person med sex anmälningar och en motivering
              ser ut att ha anmält sig en gång. */}
          <p className="text-small text-text-secondary tabular-nums">
            {[
              `${person.antalAnmalningar} ${person.antalAnmalningar === 1 ? 'anmälan' : 'anmälningar'}`,
              `${person.antalGenomfordaEvent} ${person.antalGenomfordaEvent === 1 ? 'genomfört event' : 'genomförda event'}`,
            ].join(' · ')}
          </p>

          {nastaEvent && (
            <p className="text-body">
              <span className="text-text-muted">Nästa: </span>
              {nastaEvent.rubrik}
              <span className="text-text-muted">
                {' · '}
                {langtDatum(new Date(nastaEvent.tidMs).toISOString())}
              </span>
            </p>
          )}

          {senasteHandelse && (
            <p className="text-small text-text-secondary">
              Senast {senastNar}: {senasteHandelse.rubrik}
            </p>
          )}

          {/* FLAGGAN — Marcus 2026-08-10: *"Manuell flagga är ju bra att kunna
              skapa här, så den sedan kan 'fästas' på personen typ i check-in
              vyn"*, förtydligat samma kväll: *"det ska vara en flagga som Lotta
              själv skriver i fritext … Choice-fältet i basen kan vi skrota."*

              ✅ SKARP SKRIVYTA (`#1151`). Vägen dit gick INTE via en fix av det
              gamla fältet: `Manuella flagga` (`fldNtwQt6tOCIdf4f`) är en
              singleSelect med `choices: []` och kunde aldrig sättas
              (data-model.md §Kända fällor 25, live-ombekräftad). Airtables
              Meta-API kan varken ändra ett fälts typ eller radera det, så
              fältet AVLÖSTES av ett nytt `Flagga` (singleLineText) i båda
              baserna. `manuellFlagga` finns kvar i shapen men läses inte här. */}
          <div className="border-border/60 border-t pt-3">
            <PersonFlagEditor personId={person.id} flagga={person.flagga} />
          </div>
        </div>
      </section>

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
        {poster.length > 0 ? (
          <div className={`flex flex-col gap-4 ${kortKlass}`}>
            {kommande.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-small text-text-secondary">Kommande</h3>
                <ol className="flex flex-col">
                  {kommande.map((post, i) => (
                    <StromRad key={post.id} post={post} sist={i === kommande.length - 1} />
                  ))}
                </ol>
              </div>
            )}
            {arGrupper.map((grupp) => (
              <div key={grupp.ar} className="flex flex-col gap-2">
                <h3 className="font-semibold text-small text-text-secondary tabular-nums">
                  {grupp.ar}
                </h3>
                <ol className="flex flex-col">
                  {grupp.poster.map((post, i) => (
                    <StromRad key={post.id} post={post} sist={i === grupp.poster.length - 1} />
                  ))}
                </ol>
              </div>
            ))}
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

          Räknaren (`antalHamtningar`) och listan är fortfarande två olika
          rollups som kan säga olika saker; båda visas hellre än att en tyst
          väljs bort. */}
      <section aria-labelledby="proto-d-hamtningar" className="flex min-w-0 flex-col gap-2">
        <h2 id="proto-d-hamtningar" className="px-4 font-semibold text-lg">
          Hämtade erbjudanden
        </h2>
        <div className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong">
          {person.hamtningar.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border">
              {person.hamtningar.map((h) => (
                <li key={h.id} className="flex items-start gap-3 py-3">
                  <Download
                    aria-hidden="true"
                    size={18}
                    className="mt-0.5 shrink-0 text-text-secondary"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    {/* `erbjudande` kan vara null — alla touchpoints är inte
                          hämtningar. Då bär `typ` raden i stället för att den
                          renderas namnlös. */}
                    <span className="text-body">{h.erbjudande ?? h.typ ?? 'Okänd hämtning'}</span>
                    <span className="text-small text-text-muted">
                      {[h.datum ? langtDatum(h.datum) : 'Datum saknas', h.erbjudande && h.typ]
                        .filter(Boolean)
                        .join(' · ')}
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
                  {/* TVÅ DATUM, BÅDA ETIKETTERADE. `m.datum` är när personen
                      ANMÄLDE sig, `m.eventDatum` när eventet GÅR — naket
                      bredvid eventnamnet lästes det förra som det senare.
                      Mätt på Sofia Isaksson 2026-08-12: raden stod "Resor i
                      medvetandet 1 · 10 augusti 2026" medan RIM 1 gick
                      10 augusti 2025. `eventDatum` är null tills EF-utökningen
                      är deployad; då visas bara anmälningsdatumet. */}
                  <span className="text-small text-text-muted">
                    {[
                      m.event ?? 'Okänt event',
                      m.eventDatum ? langtDatum(m.eventDatum) : null,
                      m.datum ? `anmäld ${langtDatum(m.datum)}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
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
        <PersonAnteckningar personId={person.id} />
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

export type PersonDetailVariant = 'a' | 'b' | 'c' | 'd';

/**
 * [PROTOTYPE] Persondetaljens divergens-pass.
 *
 * Sid-skalet (tillbaka-chevron, fokusflytt till h1, ladd-/fel-grenar) är
 * IDENTISKT i alla tre — det är appens krom, motsvarigheten till UI.md:s
 * "en delad `<Header>` är bra". Allt under headern är variantens eget: ingen
 * delad `<Layout>`, varje variant är fri att kasta arrangemanget.
 */
export function PersonDetailPrototyp({
  personId,
  variant,
}: {
  personId: string;
  variant: PersonDetailVariant;
}) {
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

  const sidRam = (innehall: React.ReactNode) => (
    <section ref={headingRef} className="flex flex-col gap-6 pt-2 lg:pt-10">
      <Link
        to="/personer"
        aria-label="Tillbaka till personer"
        className="mx-4 flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-muted"
      >
        <ChevronLeft aria-hidden="true" size={26} />
      </Link>
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
          {error instanceof Error ? error.message : 'Okänt fel.'}
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
      {variant === 'a' && <VariantA person={person} nuMs={nuMs} />}
      {variant === 'b' && <VariantB person={person} nuMs={nuMs} />}
      {variant === 'c' && <VariantC person={person} nuMs={nuMs} />}
      {variant === 'd' && <VariantD person={person} nuMs={nuMs} />}
    </>,
  );
}
