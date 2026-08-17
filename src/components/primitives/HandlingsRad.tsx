import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * ═══ HANDLINGSRADEN — EN KÄLLA FÖR EVENTSIDANS OCH HEM-VYNS GENVÄGAR ═══
 *
 * Formen bodde tidigare som en lokal `RAD_KLASS`-konstant i
 * `events/detail/Atgarder.tsx`, medan hem-vyns Genvägar byggdes av
 * `NavCard`-primitiven. De två SÅG snarlika ut och beskrevs i prosa som
 * "samma visuella konstruktion" — men de var det inte, och skillnaden var
 * inte kosmetisk:
 *
 *   eventsidan:  yttre kort (bg-muted, rounded-2xl, px-4)
 *                + TRANSPARENT rad inuti som hovrar till en INDRAGEN
 *                  rounded-lg-platta  →  "den här raden är markerad"
 *   NavCard:     kortet ÄR länken; hela den rounded-2xl-stora ytan byter ton
 *                                   →  "hela kortet mörknade lite"
 *
 * Samma hover-klass, samma färgsteg (#f5f5f3 → #edeee9), helt olika
 * avläsning. Marcus bad om IDENTISKT; skivan levererade "samma konstruktion"
 * och skrev in avvikelsen i sin amenderings-fil som avsiktlig i stället för
 * att fråga (S107 QA-vandringen steg 2, 2026-08-17).
 *
 * DÄRFÖR EN DELAD MODUL OCH INTE EN DELAD BESKRIVNING: så länge formen bor
 * på två ställen kan de glida isär igen, och nästa gång upptäcks det av
 * samma dyra mekanism — Marcus öga. Nu är klassen och innehållsgrammatiken
 * EN sträng respektive EN komponent; ändras de, ändras båda ytorna.
 *
 * ── VARFÖR INTE EN FÄRDIG `<Link>`-KOMPONENT HÄR ──
 *
 * TanStack Routers `<Link>` är typad mot route-trädet: eventsidans rader
 * bär `/event/$eventId/…` med `params`, Genvägarna bär parameterlösa
 * toppnivå-routes. En gemensam wrapper hade behövt generiska
 * router-typparametrar för att inte tappa den typningen — och den typade
 * länken är hela poängen med `Link` (död ingång fångas vid kompilering).
 * Modulen delar därför FORMEN (klasser + innehåll) och låter varje
 * anropare behålla sin egen typade `<Link>`. Renderad utdata blir identisk;
 * typsäkerheten bevaras på båda sidor.
 *
 * `NavCard` är MEDVETET orörd: den bär Mer-vyns åtta rader, vars form är
 * facit-låst till M6-facitet. Genvägarna byter grammatik, inte Mer.
 */

/**
 * Radens egen klass — den TRANSPARENTA raden som hovrar till en indragen
 * platta. `-mx-2` + `px-2` är det negativa-marginal-trick som låter plattan
 * nå ut till det yttre kortets `px-4`-kant utan att raden själv bryter
 * kortets padding; `rounded-lg` är radens radie-språk (kortets YTTERradie är
 * en annan skala, 16 px — K56).
 */
export const HANDLINGSRAD_KLASS =
  '-mx-2 flex w-auto items-center gap-2 rounded-lg px-2 py-1.5 text-left font-medium text-body hover:bg-bg-emphasized motion-safe:transition-colors';

/** Radens yttre omslag — bär den vertikala luften mellan rader i samma kort. */
export const HANDLINGSRAD_OMSLAG_KLASS = 'flex flex-col py-1.5';

/**
 * Kort-skalet som handlingsrader bor i. Utan det blir raden en naken
 * hover-platta på sidans egen bakgrund, och det INDRAGNA plattbeteendet —
 * hela skillnaden mot NavCard — går förlorat.
 */
export function HandlingsRadKort({
  children,
  ...rest
}: {
  children: ReactNode;
  'data-testid'?: string;
}) {
  return (
    <div
      className="rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong"
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * Radens innehållsgrammatik: ledande slot (ikon ELLER numrerad ruta) →
 * etikett → chevron höger. Chevronen är semantisk, inte dekoration i
 * betydelsen "utbytbar": den säger att raden LEDER VIDARE (K26-formen), och
 * finns därför på båda ytorna eller ingen.
 */
export function HandlingsRadInnehall({
  ledande,
  children,
}: {
  ledande: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      {ledande}
      {children}
      <ChevronRight aria-hidden="true" size={18} className="ml-auto shrink-0 text-text-secondary" />
    </>
  );
}
