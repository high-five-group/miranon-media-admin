import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/queries/keys';

/**
 * Personregistrets FÄRSKHET (TASK-286.4 AC #3/#4, ADR-123 beslut 6).
 *
 * 30 minuter. Registret är en global, sällan-ändrad lista som `PersonsList`
 * läser EN gång och sedan söker, sorterar och paginerar i minnet på — det
 * globala 5-minutersvärdet (`src/router.ts`) tvingade en ny sex-anrops-
 * hämtning (~336 KiB, ADR-123 § Konsekvenser) var femte minut utan att någon
 * data hunnit ändras.
 *
 * ORDNINGEN VAR TVINGANDE, och den syns i git-historiken: höjningen ligger i
 * en SENARE commit än invalideringen den vilar på
 * (`src/data/mutations/personregister-invalidering.ts` + dess två testfiler).
 * ADR-123 beslut 6, ordagrant: höjs cachen först byts dagens irritation mot
 * ett tystare och värre fel — *"listan visar aldrig nya personer"*. Med
 * invalideringen på plats kostar en längre livstid ingen färskhet: varje
 * skrivväg som rör registret markerar det stale i samma andetag.
 */
export const PERSONREGISTER_STALE_TIME_MS = 30 * 60 * 1000;

/**
 * Registrerar färskhets-defaulten för registernyckeln på klienten.
 *
 * ── VARFÖR `setQueryDefaults` OCH INTE EN `staleTime` VID ANROPSSTÄLLET ──
 *
 * Nyckeln har TVÅ konsumenter: `PersonsList.tsx`s `useQuery` och
 * `TabBar.tsx`s prefetch på hover/fokus (ADR-078 beslut 3). En `staleTime`
 * skriven vid det ena anropsstället hade gällt bara där, och prefetchen hade
 * fortsatt räkna 5 minuter — två olika svar på samma fråga om samma cache-post.
 * `setQueryDefaults` binder värdet till NYCKELN, så båda konsumenterna ärver
 * det, och färskhets-policyn bor hos de övriga query-defaultsen i stället för
 * utspridd i vy-komponenter.
 *
 * ── VARFÖR `refetchOnWindowFocus`/`refetchOnReconnect` INTE NÄMNS (AC #4) ──
 *
 * De är UTELÄMNADE med avsikt, inte glömda. Källäst i den installerade
 * `@tanstack/query-core` (`queryClient.js` § `defaultQueryOptions`) är
 * merge-ordningen `{...defaultOptions.queries, ...getQueryDefaults(key),
 * ...anropsställets options}`. Ett fält som inte finns i detta objekt kan
 * därför per konstruktion inte skugga `router.ts`s globala värden
 * (`refetchOnWindowFocus: true`, `refetchOnReconnect: 'always'`) — de faller
 * igenom orörda. `personregister-farskhet.test.ts` mäter det i stället för
 * att lita på resonemanget.
 *
 * `getQueryDefaults` prefix-matchar (`partialMatchKey`), så defaulten sätts
 * på `persons.register` — ALDRIG på `persons.all`, som hade dragit med sig
 * persondetaljen och antecknings-strömmen i samma färskhets-fönster.
 *
 * ÖPPET, värt att veta: `refetchOnWindowFocus` verkar bara på en STALE fråga.
 * Med 30 minuters livstid hämtar en fokus-återkomst inom fönstret alltså inte
 * om. Det är den avsedda innebörden av att höja `staleTime`, och det är
 * ofarligt just för att skrivvägarna invaliderar — inställningen i sig är
 * oförändrad, vilket är vad AC #4 kräver.
 */
export function registreraPersonregistretsFarskhet(queryClient: QueryClient): void {
  queryClient.setQueryDefaults(queryKeys.persons.register, {
    staleTime: PERSONREGISTER_STALE_TIME_MS,
  });
}
