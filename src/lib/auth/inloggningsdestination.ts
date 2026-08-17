/**
 * ═══ VEM ÄGER DESTINATIONEN DIREKT EFTER EN AKTIV INLOGGNING (TASK-261) ═══
 *
 * En aktiv inloggning startar TVÅ navigeringsvägar i samma ögonblick som
 * `auth.login()` flippar `auth.isAuthenticated`:
 *
 *   VÄG A (snabb, mikrotask): `InnerApp`s effekt (`src/main.tsx`) kör
 *     `router.invalidate()` → `/login`s egen `beforeLoad` re-evalueras →
 *     ser `isAuthenticated: true` → `throw redirect({ to: search.redirect })`.
 *   VÄG B (långsam, TVÅ await): `routaEfterLyckadInloggning()`
 *     (`src/routes/login.tsx`) väntar in `getSession()` OCH
 *     `probaPasskeyTillganglighet()` — ett riktigt nätverksanrop — innan den
 *     kan veta om målet egentligen är `/passkey`.
 *
 * Väg A vinner alltid. Eftersom `search.redirect` är en `_authenticated`-yta
 * monteras dess layout, och dess app-yta-gate (`_authenticated.tsx`,
 * TASK-227) ser en KALL cache redan i sin lazy `useState`-initierare och
 * renderar Förberedelseskärmen. När väg B sedan landar rivs alltihop ned och
 * `/passkey` visas i stället. Det ÄR blinket Marcus observerade i prod
 * 2026-08-17 (deterministiskt reproducerat i `login.acceptance.test.ts`).
 *
 * Racet var HARMLÖST fram tills nyligen, och `_authenticated.tsx`s docblock
 * bokförde exakt varför: destinationen var densamma oavsett vem som vann —
 * "förutom det just nu avstängda passkey-erbjudandet". TASK-231 slog PÅ
 * passkey-erbjudandet server-side, och därmed föll den förutsättningen.
 *
 * ── VARFÖR EN EGEN MODUL OCH INTE EN VARIABEL I `login.tsx` ──
 *
 * Vite-pluginet `tanstackRouter({ autoCodeSplitting: true })`
 * (`vite.config.ts`) delar varje route-fil i separata chunkar — route-
 * konfigurationen (`beforeLoad`) och komponenten hamnar i OLIKA moduler.
 * En `let` på `login.tsx`s modul-scope blir därför TVÅ oberoende variabler:
 * komponenten sätter sin, `beforeLoad` läser sin egen och ser den aldrig.
 * Mätt skarpt i TASK-261 — den första fixen såg korrekt ut och hade noll
 * effekt. Flaggan måste bo i en modul BÅDA sidorna importerar.
 *
 * ── VARFÖR INTE EN FÖRDRÖJD FALLBACK I `_authenticated.tsx` ──
 *
 * TASK-233:s delay-mönster hade bara DOLT skärmen. Layouten hade fortfarande
 * monterats och dess gate hade startat en HEL startvärmning — sju Edge
 * Function-anrop — som kastas bort ett ögonblick senare. Det är precis den
 * straggler-klass TASK-240 dokumenterade som skadlig. Att ta bort racet
 * åtgärdar orsaken i stället för att maskera symptomet.
 */

let beslutAgerDestinationen = false;

/**
 * Öppnar fönstret. Anropas FÖRE `auth.login()` — racet startar när anropet
 * flippar auth-tillståndet, inte när det returnerar till anroparen.
 */
export function borjaAgaInloggningsdestinationen(): void {
  beslutAgerDestinationen = true;
}

/**
 * Stänger fönstret. Anropas ovillkorligt (`finally`) av den kod som äger
 * destinationen, så ett kastat fel aldrig kan lämna fönstret öppet.
 */
export function slutaAgaInloggningsdestinationen(): void {
  beslutAgerDestinationen = false;
}

/**
 * Sant medan en pågående inloggning själv bestämmer vart användaren ska.
 * `/login`s `beforeLoad` avstår då från sin egen redirect.
 */
export function inloggningsdestinationenAgs(): boolean {
  return beslutAgerDestinationen;
}
