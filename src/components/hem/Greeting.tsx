import { useAuth } from '@/auth/useAuth';

/**
 * Hälsning på Hem. Visar "Hej {namn}!" när inloggningskontot bär ett
 * display-namn (`AuthUser.displayName` ur user_metadata, task-1.1) och den
 * neutrala hälsningen annars. E-postadressen är ALDRIG fallback — varken
 * varmt eller Gunilla-begripligt (TASK-1 beslut 5). Renderas under
 * containerns `<h1>Hem</h1>` (egen rubrik skapas inte → rubrik-hierarkin
 * förblir h1 → h2-cards).
 */
export function Greeting() {
  const { user } = useAuth();
  const name = user?.displayName;
  return (
    <p className="text-text-muted">
      {name ? `Hej ${name}! Här är din översikt.` : 'Hej! Här är din översikt.'}
    </p>
  );
}
