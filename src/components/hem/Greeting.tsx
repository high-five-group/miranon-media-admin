import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/useAuth';

/** Sessions-flaggan för B2 — sessionStorage dör med fliken (rätt livslängd). */
const GREETED_KEY = 'mm-hem-greeted';

/** Läser B2-flaggan tolerant — privat läge kan neka storage-åtkomst. */
function readGreeted(): boolean {
  try {
    return sessionStorage.getItem(GREETED_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Extraherar förnamnet ur ett fullt visningsnamn (TASK-220): registret bär
 * HELA namnet ("Marcus Johansson") — hälsningen visar bara det första
 * ordet. Extraktionen bor HÄR, i hälsningens egna visningslogik —
 * AuthProviderns `displayName` förblir orört och bär hela namnet vidare
 * till sina andra konsumenter (t.ex. inbjudarnamnet och aktivitetsloggens
 * vem-fält). Robust mot omgivande/inre extra whitespace; ett enords-namn
 * passerar oförändrat.
 */
function fornamn(helaNamnet: string): string {
  return helaNamnet.trim().split(/\s+/)[0];
}

/**
 * Hälsningen på Hem — SIDANS `<h1>` (task-1.3 AC #6): A-skelettet har ingen
 * separat "Hem"-rubrik, hälsningen ÄR sidrubriken. Vy-namnet "Hem" bärs
 * vidare av RouteAnnouncer + `staticData.title` för skärmläsar-annonsering
 * och fliktitel — rubrik-hierarkin h1 → h2-cards bevaras med hälsningen
 * som topp.
 *
 * K10-facitet (task-4.2): "Hej {namn}" UTAN utropstecken vid FÖRSTA
 * renderingen per session; återbesök i sessionen visar bara "{namn}" (B2 —
 * personligt utan att tjata). Utan display-namn hälsar vi neutralt "Hej"
 * hela sessionen. E-postadressen är ALDRIG fallback — varken varmt eller
 * Gunilla-begripligt (TASK-1 beslut 5).
 *
 * TASK-220: `user.displayName` bär hela namnet — hälsningen visar bara
 * förnamnet (`fornamn` ovan).
 */
export function Greeting() {
  const { user } = useAuth();
  const helaNamnet = user?.displayName;
  const name = helaNamnet ? fornamn(helaNamnet) : null;
  // Lazy init: värdet läses EN gång per montering — flaggan som sätts i
  // effekten nedan får inte flippa rubriken mitt i den första visningen.
  const [greeted] = useState(readGreeted);
  useEffect(() => {
    try {
      sessionStorage.setItem(GREETED_KEY, '1');
    } catch {
      // Privat läge utan storage → hälsningen förblir "Hej {namn}" varje
      // besök — ofarlig degradering.
    }
  }, []);
  if (!name) return <h1 className="font-semibold text-3xl">Hej</h1>;
  return <h1 className="font-semibold text-3xl">{greeted ? name : `Hej ${name}`}</h1>;
}
