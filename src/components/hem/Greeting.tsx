/**
 * Hälsning på Hem (Fas 6d L1).
 *
 * STATISK "Hej!" — auth-context (`AuthUser`) bär bara `id` + `email`, INGET
 * namnfält (verifierat mot `src/auth/AuthProvider.tsx`). Att hälsa med e-post
 * vore varken varmt eller Gunilla-begripligt → neutral, vänlig hälsning tills
 * ett namnfält finns. Renderas under containerns `<h1>Hem</h1>` (egen rubrik
 * skapas inte → rubrik-hierarkin förblir h1 → h2-cards).
 */
export function Greeting() {
  return <p className="text-text-muted">Hej! Här är din översikt.</p>;
}
