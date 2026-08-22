// PERSONREGISTRETS FÄRSKHET (TASK-286.4 AC #3 + #4, ADR-123 beslut 6) —
// api-pure (ren logik, ingen staging, inga creds, ingen browser).
//
// AC #4 säger att `refetchOnWindowFocus` och `refetchOnReconnect` ska vara
// OFÖRÄNDRADE för registerfrågan. Det påståendet MÄTS här i stället för att
// vila på att modulen utelämnar fälten: `setQueryDefaults` skulle ha skuggat
// dem om de fanns med, och en framtida rad som lägger till dem ska fälla
// denna fil — inte upptäckas i produktion.
//
// Testet importerar INTE `src/router.ts`. Den modulen drar in routeTree,
// React-komponenter och CSS, vilket api-pure inte kan ladda. I stället
// tillämpas SAMMA registreringsfunktion som router.ts anropar på en klient
// byggd med router.ts:s EGNA globala värden — reproducerade som konstanter
// nedan och låsta mot filen av § 3, så att en drift i router.ts inte kan
// göra detta test grönt på fel grund.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../src/queries/keys';
import {
  PERSONREGISTER_STALE_TIME_MS,
  registreraPersonregistretsFarskhet,
} from '../../src/queries/personregister-farskhet';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ROUTER_FIL = path.join(REPO_ROOT, 'src', 'router.ts');

/** router.ts:s globala query-defaults, reproducerade. Låsta mot filen i § 3. */
const GLOBAL_STALE_TIME_MS = 5 * 60 * 1000;
const GLOBAL_REFETCH_ON_WINDOW_FOCUS = true;
const GLOBAL_REFETCH_ON_RECONNECT = 'always';

function klientMedGlobalaDefaults(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: GLOBAL_STALE_TIME_MS,
        refetchOnWindowFocus: GLOBAL_REFETCH_ON_WINDOW_FOCUS,
        refetchOnReconnect: GLOBAL_REFETCH_ON_RECONNECT,
      },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────
// § 1 — AC #3: staleTime är 30 minuter för REGISTERNYCKELN
// ─────────────────────────────────────────────────────────────────────────

test('registernyckelns staleTime är 30 minuter', () => {
  expect(PERSONREGISTER_STALE_TIME_MS).toBe(30 * 60 * 1000);

  const queryClient = klientMedGlobalaDefaults();
  registreraPersonregistretsFarskhet(queryClient);

  const merged = queryClient.defaultQueryOptions({ queryKey: queryKeys.persons.register });
  expect(merged.staleTime, 'registret ska leva 30 min, inte globalens 5').toBe(30 * 60 * 1000);
});

test('höjningen gäller ENBART registret — övriga grenar behåller globalens 5 min', () => {
  const queryClient = klientMedGlobalaDefaults();
  registreraPersonregistretsFarskhet(queryClient);

  const personId = 'recPERSON00000001';
  for (const nyckel of [
    queryKeys.persons.detail(personId),
    queryKeys.persons.notes(personId),
    queryKeys.events.list,
    queryKeys.registrations.all,
  ]) {
    expect(
      queryClient.defaultQueryOptions({ queryKey: nyckel }).staleTime,
      `${JSON.stringify(nyckel)} ska vara oförändrad`,
    ).toBe(GLOBAL_STALE_TIME_MS);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// § 2 — AC #4: refetchOnWindowFocus / refetchOnReconnect OFÖRÄNDRADE
// ─────────────────────────────────────────────────────────────────────────

test('refetchOnWindowFocus och refetchOnReconnect är OFÖRÄNDRADE för registret', () => {
  const queryClient = klientMedGlobalaDefaults();

  const fore = queryClient.defaultQueryOptions({ queryKey: queryKeys.persons.register });
  registreraPersonregistretsFarskhet(queryClient);
  const efter = queryClient.defaultQueryOptions({ queryKey: queryKeys.persons.register });

  expect(efter.refetchOnWindowFocus, 'AC #4 — fönsterfokus').toBe(GLOBAL_REFETCH_ON_WINDOW_FOCUS);
  expect(efter.refetchOnReconnect, 'AC #4 — återanslutning').toBe(GLOBAL_REFETCH_ON_RECONNECT);

  // Och samma värden som FÖRE registreringen — "oförändrad" i ordets
  // egentliga mening, inte bara "råkar ha rätt värde".
  expect(efter.refetchOnWindowFocus).toBe(fore.refetchOnWindowFocus);
  expect(efter.refetchOnReconnect).toBe(fore.refetchOnReconnect);
});

test('färskhets-defaulten sätter INGET annat än staleTime', () => {
  // Andra riktningen mot testet ovan: i stället för att räkna upp de två
  // fälten AC #4 nämner, mäts att defaulten inte rör NÅGOT annat fält alls.
  // En framtida rad som lägger till en refetch-inställning fälls här även om
  // någon glömmer utöka listan ovan.
  const queryClient = new QueryClient();
  registreraPersonregistretsFarskhet(queryClient);

  const satta = queryClient.getQueryDefaults(queryKeys.persons.register);
  expect(Object.keys(satta ?? {}).sort()).toEqual(['staleTime']);
});

// ─────────────────────────────────────────────────────────────────────────
// § 3 — Låset: testets reproducerade globaler måste matcha router.ts
// ─────────────────────────────────────────────────────────────────────────

test('de reproducerade globalerna matchar router.ts på disk', () => {
  // Utan detta lås kunde router.ts ändra sina globala värden medan denna fil
  // fortsatte mäta mot gamla konstanter — grön på fel grund, exakt den
  // kopierings-drift repot bokfört på annat håll.
  const kalla = readFileSync(ROUTER_FIL, 'utf8');

  expect(kalla, 'router.ts global staleTime').toContain('staleTime: 5 * 60 * 1000');
  expect(kalla, 'router.ts refetchOnWindowFocus').toContain('refetchOnWindowFocus: true');
  expect(kalla, 'router.ts refetchOnReconnect').toContain("refetchOnReconnect: 'always'");

  // Och att router.ts faktiskt WIRAR registreringen — en modul som aldrig
  // anropas hade gjort hela höjningen verkningslös i appen.
  expect(kalla, 'router.ts ska anropa registreringen').toContain(
    'registreraPersonregistretsFarskhet(queryClient)',
  );
});

test('PersonsList sätter INGEN egen staleTime på registerfrågan', () => {
  // Färskhets-policyn bor på nyckeln (setQueryDefaults), inte vid
  // anropsstället. En `staleTime` i vy-komponenten hade skuggat defaulten
  // (merge-ordningen i query-core: anropsställets options vinner) och gjort
  // TabBar:s prefetch och listan oense om samma cache-post.
  const kalla = readFileSync(
    path.join(REPO_ROOT, 'src', 'components', 'persons', 'PersonsList.tsx'),
    'utf8',
  );

  const registerFraga = kalla.slice(kalla.indexOf('queryKey: queryKeys.persons.register'));
  const blockSlut = registerFraga.indexOf('});');
  expect(blockSlut, 'registerfrågans block ska gå att avgränsa').toBeGreaterThan(0);

  expect(
    registerFraga.slice(0, blockSlut),
    'registerfrågan ska ärva färskheten från nyckeln, inte sätta en egen',
  ).not.toContain('staleTime');
});
