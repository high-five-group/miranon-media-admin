/**
 * ═══ EN AVSIKTLIG UTLOGGNING SKA INTE BÄRA MED SIG SIN URSPRUNGS-URL
 * (S107 fynd-fix, Marcus-fångst 2026-08-17: "borde jag inte hamna på Hem?") ═══
 *
 * `_authenticated.tsx`s `beforeLoad` sparar `redirect: location.href` när
 * auth-gaten bommar en obehörig — så användaren återvänder dit hen var när
 * sessionen tog slut. Det är rätt beteende för en session som LÖPER UT.
 *
 * Men utloggningsknappen finns bara på Mer-vyn
 * (`_authenticated/mer/index.tsx`), och därmed blev vägen en sluten loop:
 * den enda plats du KAN logga ut från blev också den enda plats du KAN
 * återvända till. Varje utloggning → inloggning landade på `/mer`, varje
 * gång, och `/login`s `/hem`-default (`login.tsx`, `search.redirect`) blev i
 * praktiken oåtkomlig för den vägen. Varje del fungerade som den var byggd;
 * det var SAMMANSÄTTNINGEN som gav fel beteende.
 *
 * Skillnaden mekanismen kodar: en session som tar slut AV SIG SJÄLV bevarar
 * ursprungs-URL:en; en användare som TRYCKER "Logga ut" gör det inte —
 * hen är klar med det hen höll på med, och nästa inloggning börjar om från
 * början (`/hem`).
 *
 * ── VARFÖR EN MODUL OCH INTE ETT ARGUMENT TILL `logout()` ──
 *
 * Redirecten fångas inte av utloggningsanropet utan av `_authenticated`s
 * `beforeLoad`, som körs LÅNGT senare i kedjan (logout → onAuthStateChange →
 * router.invalidate() → beforeLoad) och inte har någon parameterväg tillbaka
 * till knappen. Samma strukturella skäl som
 * `inloggningsdestination.ts` (TASK-261) — flaggan måste bo i en modul BÅDA
 * sidorna importerar. Att i stället navigera till `/hem` före `logout()`
 * hade gett en synlig blink av hem-vyn på väg ut.
 *
 * ── VARFÖR ETT ENGÅNGSFÖNSTER SOM KONSUMERAS VID LÄSNING ──
 *
 * `beforeLoad` för `_authenticated` kan köras flera gånger under samma
 * nedrivning. Läsningen nollställer därför flaggan: FÖRSTA gaten efter
 * knapptrycket vet att det var en avsiktlig utloggning, och ett senare,
 * orelaterat sessionsutlopp ärver aldrig avsikten. Fail-safe åt rätt håll —
 * missas fönstret får användaren dagens beteende (återvänd dit du var),
 * aldrig en felaktig destination.
 */

let avsiktligUtloggning = false;

/**
 * Markerar att nästa auth-gate-bom kommer av ett medvetet knapptryck.
 * Anropas FÖRE `logout()` — kedjan startar när auth-tillståndet flippar,
 * inte när anropet returnerar.
 */
export function markeraAvsiktligUtloggning(): void {
  avsiktligUtloggning = true;
}

/**
 * Sant EN gång om utloggningen var avsiktlig; konsumerar fönstret.
 * `_authenticated.tsx`s `beforeLoad` avstår då från att spara ursprungs-URL:en,
 * och `/login`s `/hem`-default tar över.
 */
export function konsumeraAvsiktligUtloggning(): boolean {
  const varAvsiktlig = avsiktligUtloggning;
  avsiktligUtloggning = false;
  return varAvsiktlig;
}
