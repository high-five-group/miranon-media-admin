// PERSONREGISTRETS INVALIDERING (TASK-286.4 AC #2, ADR-123 beslut 6) —
// api-pure (ren logik, ingen staging, inga creds, ingen browser).
//
// VAD SOM BEVISAS HÄR, OCH VAD SOM BEVISAS I SYSTERFILEN
//
// AC #2 kräver "test per skrivväg ... att registerfrågan invalideras och
// refetchas". Repot har ingen React-renderare i test-stacken (varken
// @testing-library/react eller jsdom finns i package.json), så en
// `useMutation`-hook kan inte monteras här. Beviset är därför delat i två
// mekaniska halvor som TILLSAMMANS täcker varje skrivväg:
//
//   1. DENNA FIL — BETEENDET, mot en RIKTIG `QueryClient` (inte en spion):
//      att `invalideraPersonregistret()` markerar registerfrågan stale OCH
//      att en monterad (aktiv) fråga faktiskt hämtas om. Plus båda
//      riktningarna: främmande grenar rörs aldrig.
//   2. `personregister-skrivvagar.test.ts` — TÄCKNINGEN: att var och en av
//      de fem svepta skrivvägarna anropar funktionen, och att anropet ligger
//      i `onSuccess` (inte bara någonstans i filen).
//
// Kompositionen är avsiktlig och står här öppet i stället för att antydas:
// ingendera halvan ensam bevisar AC #2.
//
// `QueryObserver` är det som gör en fråga AKTIV utan React — samma roll
// `useQuery` fyller i appen. Utan en observer refetchar `invalidateQueries`
// inte (bara markerar stale), vilket är precis den skillnad testet mäter.

import { expect, test } from '@playwright/test';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { invalideraPersonregistret } from '../../src/data/mutations/personregister-invalidering';
import { queryKeys } from '../../src/queries/keys';

/** Test-klient utan retry/gc-brus — samma isoleringsdisciplin som syskonfilerna. */
function testKlient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        // Lång staleTime så "stale" i testet ALLTID är invalideringens
        // förtjänst och aldrig tidens — annars hade testet kunnat bli grönt
        // av en utgången timer i stället för av koden det prövar.
        staleTime: 60 * 60 * 1000,
        networkMode: 'always',
      },
    },
  });
}

/** Räknande queryFn — antalet anrop ÄR refetch-beviset. */
function raknandeQueryFn(): { fn: () => Promise<string>; antal: () => number } {
  let antal = 0;
  return {
    fn: async () => {
      antal += 1;
      return `svar-${antal}`;
    },
    antal: () => antal,
  };
}

test('registerfrågan markeras stale av invalideringen — och var det inte innan', async () => {
  const queryClient = testKlient();
  const { fn } = raknandeQueryFn();

  await queryClient.fetchQuery({ queryKey: queryKeys.persons.register, queryFn: fn });

  const fore = queryClient.getQueryState(queryKeys.persons.register);
  expect(fore?.isInvalidated, 'registret ska vara färskt före invalideringen').toBe(false);

  invalideraPersonregistret(queryClient);

  const efter = queryClient.getQueryState(queryKeys.persons.register);
  expect(efter?.isInvalidated, 'registret ska vara markerat stale efter invalideringen').toBe(true);

  queryClient.clear();
});

test('en AKTIV registerfråga hämtas faktiskt om — inte bara markeras stale', async () => {
  const queryClient = testKlient();
  const { fn, antal } = raknandeQueryFn();

  // Observern gör frågan AKTIV — motsvarigheten till att `PersonsList` är
  // monterad. Det är detta som skiljer "markeras stale" från "refetchas".
  const observer = new QueryObserver(queryClient, {
    queryKey: queryKeys.persons.register,
    queryFn: fn,
  });
  const avsluta = observer.subscribe(() => {});

  await test.step('första hämtningen', async () => {
    await expect.poll(() => antal(), { timeout: 5000 }).toBe(1);
  });

  invalideraPersonregistret(queryClient);

  await test.step('invalideringen utlöser en andra hämtning', async () => {
    await expect.poll(() => antal(), { timeout: 5000 }).toBe(2);
  });

  avsluta();
  queryClient.clear();
});

test('en OMONTERAD registerfråga markeras stale UTAN nätverksanrop', async () => {
  // Kostnadsargumentet i modulens docblock, mätt i stället för påstått:
  // samtliga fem skrivvägar bor på ytor där personlistan är omonterad, och
  // då kostar invalideringen noll hämtningar.
  const queryClient = testKlient();
  const { fn, antal } = raknandeQueryFn();

  await queryClient.fetchQuery({ queryKey: queryKeys.persons.register, queryFn: fn });
  expect(antal()).toBe(1);

  invalideraPersonregistret(queryClient);

  // Ge en eventuell (felaktig) refetch tid att hinna ske innan vi friskriver.
  await new Promise((r) => setTimeout(r, 250));

  expect(antal(), 'ingen omhämtning utan monterad konsument').toBe(1);
  expect(queryClient.getQueryState(queryKeys.persons.register)?.isInvalidated).toBe(true);

  queryClient.clear();
});

test('rot-nyckeln träffar HELA persons-grenen — register, detalj och anteckningar', async () => {
  // Bredden är MEDVETEN (modulens docblock § Varför rot-nyckeln). Testet
  // låser den så att en framtida smalning blir ett synligt beslut, inte en
  // tyst regression.
  const queryClient = testKlient();
  const personId = 'recPERSON00000001';

  await queryClient.fetchQuery({
    queryKey: queryKeys.persons.register,
    queryFn: async () => 'register',
  });
  await queryClient.fetchQuery({
    queryKey: queryKeys.persons.detail(personId),
    queryFn: async () => 'detalj',
  });
  await queryClient.fetchQuery({
    queryKey: queryKeys.persons.notes(personId),
    queryFn: async () => 'anteckningar',
  });

  invalideraPersonregistret(queryClient);

  expect(queryClient.getQueryState(queryKeys.persons.register)?.isInvalidated).toBe(true);
  expect(queryClient.getQueryState(queryKeys.persons.detail(personId))?.isInvalidated).toBe(true);
  expect(queryClient.getQueryState(queryKeys.persons.notes(personId))?.isInvalidated).toBe(true);

  queryClient.clear();
});

test('främmande grenar rörs ALDRIG — andra riktningen', async () => {
  const queryClient = testKlient();

  await queryClient.fetchQuery({ queryKey: queryKeys.events.list, queryFn: async () => 'event' });
  await queryClient.fetchQuery({
    queryKey: queryKeys.registrations.all,
    queryFn: async () => 'anmälningar',
  });
  await queryClient.fetchQuery({
    queryKey: queryKeys.waitlist.all,
    queryFn: async () => 'väntelista',
  });
  await queryClient.fetchQuery({
    queryKey: queryKeys.activityLog.all,
    queryFn: async () => 'aktivitetslogg',
  });

  invalideraPersonregistret(queryClient);

  expect(queryClient.getQueryState(queryKeys.events.list)?.isInvalidated).toBe(false);
  expect(queryClient.getQueryState(queryKeys.registrations.all)?.isInvalidated).toBe(false);
  expect(queryClient.getQueryState(queryKeys.waitlist.all)?.isInvalidated).toBe(false);
  expect(queryClient.getQueryState(queryKeys.activityLog.all)?.isInvalidated).toBe(false);

  queryClient.clear();
});
