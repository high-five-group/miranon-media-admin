import { useAuth } from '@/auth/useAuth';

/**
 * Hälsningen på Hem — SIDANS `<h1>` (task-1.3 AC #6): A-skelettet har ingen
 * separat "Hem"-rubrik, "Hej {namn}!" ÄR sidrubriken (prototyp A, `bf705f2`).
 * Vy-namnet "Hem" bärs vidare av RouteAnnouncer + `staticData.title` för
 * skärmläsar-annonsering och fliktitel — rubrik-hierarkin h1 → h2-cards
 * bevaras med hälsningen som topp.
 *
 * Namnet kommer ur inloggningskontots display-namn (`AuthUser.displayName`
 * ur user_metadata, task-1.1); utan namn hälsar vi neutralt. E-postadressen
 * är ALDRIG fallback — varken varmt eller Gunilla-begripligt (TASK-1 beslut 5).
 */
export function Greeting() {
  const { user } = useAuth();
  const name = user?.displayName;
  return <h1 className="font-semibold text-3xl">{name ? `Hej ${name}!` : 'Hej!'}</h1>;
}
