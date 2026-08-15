import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Skeleton } from '@/components/primitives/Skeleton';
import { verbCopy } from '@/data/activityLog/verbCopy';
import { useLatestActivity } from '@/data/queries/useActivityLog';
import type { ActivityStatement } from '@/domain/schemas';
import { relativTid } from './relativ-tid';

/**
 * Hem-spalten "Senaste aktivitet" — K10-FACITETS högerspalt (TASK-201.7).
 *
 * PROMOVERAD FORM, INTE ÅTERBYGGD (ADR-103 B1/B2): klasserna, elementen och
 * ordningen är hämtade VERBATIM ur facit-prototypens `AktivitetK10`
 * (`src/components/hem/prototype/K10.tsx` i commit `bb31a12`, manifestets
 * ÅTERUPPLIVNINGSVÄG). Det som bytts är DATAKÄLLAN — prototypens fyra
 * hårdkodade exempelrader mot `useLatestActivity()` (TASK-201.5) →
 * `fetchActivityLog` (adaptern) → `get-activity-log`-EF:en. Formen är
 * oförändrad; ADR-102 B5:s facit-identitet gäller mot
 * `tasks/sessions/bilagor/s55-hem-konvergens/k10-facit-desktop.png`.
 *
 * FACIT-SPECEN (manifestets yta "hem-historikspalten (Senaste aktivitet)",
 * S55 Del 12): bottenlinjerad EXAKT med anmälningskortet, långt till höger;
 * `bg-subtle` KANTLÖS (svag brytning); INGEN visuell rubrik — `aria-label`
 * bär namnet; rader: relativ tid (12 muted) → aktör i medium + händelse (12);
 * avslutas med "Se all aktivitetshistorik ›"-länk; INGA IKONER (FEATURE-
 * dokens kategori-ikonidé viker för facit, ADR-102 B1).
 *
 * ── TRE MEDVETNA AVVIKELSER FRÅN FACIT-BILDEN, var och en bokförd ──────────
 *
 * 1. SEPARATORN ÄR MITTPUNKT `·`, INTE LÅNGT TANKSTRECK — Marcus-order
 *    2026-08-12 (kortets Implementation Notes, verbatim: "Inga långa
 *    bindestreck får användas, larmar det bara på det så är det ok").
 *    Facit-bilden visar `—` i alla fyra rader; grinden `check-langa-streck`
 *    förbjuder det i användarsynlig text och policyns undantagslista tömdes
 *    2026-08-09 på Marcus egen order. Att facit-grinden larmar på just denna
 *    skillnad är ACCEPTERAT I FÖRVÄG — undantagsvägen i policyn är utesluten.
 *    Samma val, samma skäl som kärnvyns rad (`AktivitetsHistorik.tsx`).
 *
 * 2. `›` BÄRS AV ETT `aria-hidden`-SPAN, inte av länkens text. Visuellt
 *    identiskt; det tillgängliga namnet blir "Se all aktivitetshistorik" i
 *    stället för att skärmläsaren läsa upp ett skiljetecken. Samma form som
 *    `CTA.tsx` redan bär i samma vy (Tillgänglighet 11, inga undantag).
 *
 * 3. `border border-transparent` + `contrast-more:`/`print:`-varianterna är
 *    TILLAGDA. Prototypen bar dem inte; app-regeln kräver dem av varje tonal
 *    yta utan kantlinje (Hem.tsx § A11y, DashboardCard-idiomet). Den
 *    transparenta kanten är layoutstabil och osynlig i normalläget —
 *    facit-identiteten är orörd, tillgänglighets-golvet hålls.
 *
 * ── SYNLIGHET: ENDAST ≥xl (AC #2) ─────────────────────────────────────────
 *
 * `hidden … xl:flex` är facit-prototypens EGET villkor (`bb31a12`), inte ett
 * val gjort här. BRYTPUNKTSGAPET lg↔xl var ODEFINIERAT i S55-prosan
 * (manifestet bokförde det öppet: byggkrav B7 säger "< lg", facit säger
 * "≥xl", och 1024–1279 px låg däremellan). AVGJORT HÄR, mot facit-bilden och
 * mot faktiskt tillstånd: spalten visas INTE i gapet — facitets `xl:` är den
 * enda brytpunkt som finns nedskriven i låst form, och en spalt som ryms i
 * gapet är inte en spalt facit visar. Gapet är ändå INGEN lucka: `TabBar`
 * (`src/components/AppShell/TabBar.tsx`) bär inga brytpunktsvillkor alls
 * (endast `print:hidden`), så "Mer" — och därmed
 * `/mer/aktivitetshistorik` via `/mer/`-indexets NavCard — är nåbart på
 * VARJE skärmbredd. B7:s "< lg"-formulering beskriver alltså en väg som i
 * praktiken täcker hela gapet.
 *
 * ── ANTALET RADER: FYRA ───────────────────────────────────────────────────
 *
 * Facit-bilden visar exakt fyra rader. `useLatestActivity`s default är 5, och
 * TASK-201.5 delegerade uttryckligen talet hit ("TASK-201.7 kan ändra det
 * utan att röra denna hooks form eftersom `limit` redan är ett argument").
 * Spalten är BOTTENLINJERAD, så radantalet styr hur högt upp den når —
 * talet är en formfråga, inte en smakfråga.
 *
 * ── DATATILLSTÅND (facit visar bara det laddade) ──────────────────────────
 *
 * Laddläget är Lugnt laddläge (DESIGN-SYSTEM-SPEC §15): skeleton-block i
 * radernas slutgeometri, inget "Laddar…", ingen spinner. Fel och tomt läge
 * bär en stillsam caption-rad UTAN `role="alert"` — spalten är en
 * kompletterande yta, och hem-vyns alert-semantik ägs av kort-kolumnen
 * (`DashboardCard`). Länken står kvar i ALLA tillstånd: vägen till hela
 * historiken får aldrig försvinna för att en hämtning gick fel.
 *
 * ANTECKNINGAR: spalten visar aldrig anteckningsinnehåll. Den strukturella
 * garantin ligger i skrivvägen (TASK-201.4 loggar ATT något antecknades,
 * aldrig innehållet) — spalten renderar `object.definition.name` som den kom,
 * och kan därför inte läcka något skrivvägen inte skickat.
 */

/** Antal rader spalten visar — K10-facitet visar exakt fyra. */
const ANTAL_RADER = 4;

/**
 * xAPI Language Map → sv-SE-strängen (vi emitterar alltid endast den), med
 * defensiv fallback till första närvarande nyckel. Samma form som kärnvyns
 * `sprakText` (`AktivitetsHistorik.tsx`) — medvetet EJ delad: en fyra-raders
 * ren funktion utan eget beteende är billigare att ha i två filer än att
 * binda ihop två vyer via en gemensam modul (över-engineering-vakten). Den
 * DELADE ytan mellan vyerna är datalagret (`useActivityLog.ts`), inte
 * presentationen.
 */
function sprakText(map: Record<string, string>): string {
  return map['sv-SE'] ?? Object.values(map)[0] ?? '';
}

/** Spaltens skal — facitets geometri och yta, identisk i alla datatillstånd. */
function Spalt({ children }: { children: ReactNode }) {
  return (
    <aside
      aria-label="Senaste aktivitet"
      data-testid="senaste-aktivitet"
      className="absolute bottom-0 left-full ml-5 hidden w-72 flex-col gap-1 rounded-xl border border-transparent bg-bg-subtle p-3 contrast-more:border-border-strong xl:flex print:border-border-strong"
    >
      {children}
      <Link
        to="/mer/aktivitetshistorik"
        className="mt-1 font-medium text-caption underline-offset-2 hover:underline"
      >
        Se all aktivitetshistorik <span aria-hidden="true">›</span>
      </Link>
    </aside>
  );
}

/** Radens klasser — avdelare mellan raderna, aldrig ovanför den första. */
function radKlass(index: number): string {
  return index > 0
    ? 'flex flex-col gap-0.5 border-border-light border-t py-2 contrast-more:border-border-strong'
    : 'flex flex-col gap-0.5 py-2';
}

export function SenasteAktivitet() {
  const { data, isPending, isError } = useLatestActivity(ANTAL_RADER);

  if (isPending) {
    return (
      <Spalt>
        <div aria-busy="true" className="flex flex-col">
          <span className="sr-only">Laddar senaste aktivitet…</span>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={radKlass(i)}>
              <Skeleton variant="text" className="w-20 text-caption" />
              <Skeleton variant="text" className="text-caption" />
            </div>
          ))}
        </div>
      </Spalt>
    );
  }

  if (isError) {
    return (
      <Spalt>
        <p className="py-2 text-caption text-text-muted">Kunde inte hämta senaste aktiviteten.</p>
      </Spalt>
    );
  }

  const poster: ActivityStatement[] = data.statements;

  if (poster.length === 0) {
    return (
      <Spalt>
        <p className="py-2 text-caption text-text-muted">Ingen aktivitet ännu.</p>
      </Spalt>
    );
  }

  // Läses per render — de relativa tiderna följer klockan när vyn ritas om,
  // utan egen timer (samma val som NyaAnmalningarCard).
  const nuMs = Date.now();

  return (
    <Spalt>
      <ol className="my-0 flex list-none flex-col p-0">
        {poster.map((post, i) => {
          const t = Date.parse(post.timestamp);
          return (
            <li key={post.id} className={radKlass(i)}>
              <span className="text-caption text-text-muted">
                {Number.isNaN(t) ? '' : relativTid(t, nuMs)}
              </span>
              <span className="text-caption">
                <span className="font-medium">{post.actor.name}</span>{' '}
                {/* TASK-225.3: händelsetexten via den DELADE verb-copy-
                    modulen — samma statement ger samma text som historik-
                    sidan (S106-konsistensfyndet). Facit-avvikelsen mot
                    k10-bilden är AMENDERAD i s55-hem-konvergens-manifestet,
                    aldrig tyst (hem-spalten är stämplad godkänd yta). */}
                {verbCopy(post.verb)}
                {' · '}
                {sprakText(post.object.definition.name)}
              </span>
            </li>
          );
        })}
      </ol>
    </Spalt>
  );
}
