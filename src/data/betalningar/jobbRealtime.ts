import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../config/supabase-client';

/**
 * [TASK-346.4 AC #5, ADR-129 beslut 8] Realtime-prenumerationen på
 * `jobb_rad`.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VAD SOM MÅSTE VARA SANT FÖR ATT EN ENDA PUSH SKA KOMMA FRAM
 * ═══════════════════════════════════════════════════════════════════════════
 * Tre villkor, alla utanför denna fil, och alla värda att känna till innan
 * någon felsöker "prenumerationen fungerar inte":
 *
 *   1. TABELLEN MÅSTE LIGGA I PUBLIKATIONEN. `supabase_realtime` har
 *      `puballtables = false` (mätt 2026-08-30, ADR-129 § Kontext), så
 *      `jobb_rad` läggs till EXPLICIT av migrationen
 *      `20260830195900_jobbmotorn_ko_cron_jobbtabeller.sql` § 7. Utan den
 *      raden kommer ingen push, och felet SER UT som en trasig prenumeration
 *      i webbläsaren.
 *   2. RLS MÅSTE SLÄPPA IGENOM LÄSNINGEN. Postgres Changes levererar bara
 *      rader som prenumeranten får `SELECT`:a. `jobb_rad_las_authenticated`
 *      ger `authenticated` den rätten — det är precis den precisering
 *      ADR-128 § Updates 2026-08-30 gjorde, efter att beslut 3:s ursprungliga
 *      "deny-all" hade dödat varje push tyst.
 *   3. KLIENTEN MÅSTE VARA INLOGGAD. Kanalen ärver `supabase`-klientens
 *      session; en anon-anslutning ser ingenting (se punkt 2).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PUSH ÄR EN SNABBHET, ALDRIG EN SANNING
 * ═══════════════════════════════════════════════════════════════════════════
 * ADR-129 beslut 8 ordagrant. Prenumerationen bär därför ingen nyttolast
 * vidare — den anropar bara `vidAndring`, som INVALIDERAR frågan så att den
 * hämtas om från servern.
 *
 * Skälet är inte försiktighet utan korrekthet: en klient som byggde sin vy ur
 * push-nyttolasten hade fått ett läge som beror på vilka events den råkade
 * vara uppkopplad för. En webbläsare som var stängd mellan `pagar` och
 * `skickat` hade då fastnat i `pagar` för alltid. Invalidering + omhämtning
 * ger samma svar oavsett hur många events som missades.
 */

/** Tabellen vi lyssnar på. Samma namn som migrationen skapar. */
const JOBB_RAD_TABELL = 'jobb_rad';

/**
 * Kanalnamnet. ETT namn för hela appen: två prenumerationer på samma tabell
 * hade gett dubbla invalideringar utan att tillföra något.
 */
const KANAL = 'betalningar-jobb-rad';

/**
 * Startar prenumerationen och returnerar en avslutare.
 *
 * Avslutaren är EN funktion (inte ett objekt) därför att den ska kunna
 * returneras rakt ur en `useEffect` — det är hela dess användning, och en
 * form som inte kan glömmas bort är bättre än en som måste kommas ihåg.
 */
export function prenumereraPaJobbrader(vidAndring: () => void): () => void {
  const kanal: RealtimeChannel = supabase
    .channel(KANAL)
    .on(
      'postgres_changes',
      // `event: '*'` — INSERT (en ny rad köad), UPDATE (vantar → pagar →
      // skickat/fel, och självläkningens återställning) och DELETE (jobbet
      // raderat). Alla tre gör vyn inaktuell, så att lyssna selektivt hade
      // bara gjort det möjligt att missa ett läge.
      { event: '*', schema: 'public', table: JOBB_RAD_TABELL },
      () => {
        vidAndring();
      },
    )
    .subscribe();

  return () => {
    // `removeChannel` returnerar ett löfte som ingen väntar på: avslutaren
    // körs i en `useEffect`-cleanup, som är synkron. Ett fel här kan inte
    // åtgärdas av någon och får inte kasta i en unmount.
    void supabase.removeChannel(kanal);
  };
}
