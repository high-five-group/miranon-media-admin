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
 */
export function Greeting() {
  const { user } = useAuth();
  const name = user?.displayName;
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
