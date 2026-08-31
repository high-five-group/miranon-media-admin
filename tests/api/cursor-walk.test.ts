// samlaCursorSidor (`src/data/adapters/cursorWalk.ts`, TASK-350 AC #4) —
// api-pure: ren logik, ingen staging, inga creds, inget nätverk.
//
// TESTAR PRODUKTIONSKODEN, INTE EN KOPIA. `cursorWalk.ts` importerar
// ingenting (samma beroendefrihets-skäl som `promoveringsbeslut.test.ts`s
// filhuvud beskriver för `_shared/promoveringsbeslut.ts`) — den går därför
// att importera och köra direkt i Node, utan att fejka en Supabase-session
// (`AirtableAdapter.fetchIntresserade`s riktiga nätverksväg kräver en levande
// `supabase.auth.getSession()`, som inte går att fejka i api-pure; se
// `cursorWalk.ts`s filhuvud).
//
// FALLEN TÄCKER (TASK-350 AC #4 — "api-test täcker fler-än-en-sida-fallet"):
//   § 1 en sida (nextCursor null direkt) — inget extra anrop
//   § 2 FLER ÄN EN SIDA, >50 poster ackumulerade (den exakta klass AC #1
//       beskriver: get-leads DEFAULT_PAGE_SIZE=50-klampen ska INTE
//       återuppstå på klientsidan) — tre sidor, 55 poster totalt, ordningen
//       bevaras, cursorn trådas rätt mellan anropen
//   § 3 tom mängd (0 poster, direkt null) — giltigt, inte en bugg
//   § 4 säkerhetstaket: en EF som aldrig null-terminerar sin nextCursor ger
//       ett tydligt fel, aldrig en oändlig loop
//   § 5 indata-immutabilitet / anropsordning — hamtaSida anropas EXAKT en
//       gång per sida, inte per post

import { expect, test } from '@playwright/test';
import { samlaCursorSidor } from '../../src/data/adapters/cursorWalk';

// ─────────────────────────────────────────────────────────────────────────
// § 1 — en sida
// ─────────────────────────────────────────────────────────────────────────

test('en sida (nextCursor null direkt): returnerar sidans poster, EXAKT ett anrop', async () => {
  let anrop = 0;
  const resultat = await samlaCursorSidor<string>(async (cursor) => {
    anrop += 1;
    expect(cursor, 'första anropet har ingen cursor').toBeUndefined();
    return { poster: ['a', 'b'], nextCursor: null };
  });

  expect(resultat).toEqual(['a', 'b']);
  expect(anrop, 'ingen extra sida hämtas när första redan null-terminerar').toBe(1);
});

// ─────────────────────────────────────────────────────────────────────────
// § 2 — fler än en sida, >50 poster (AC #1:s klass, AC #4:s krav)
// ─────────────────────────────────────────────────────────────────────────

test('fler än en sida: >50 poster ackumuleras i EF-ordning över tre sidor', async () => {
  // Tre sidor: 20 + 20 + 15 = 55 poster — förbi get-leads DEFAULT_PAGE_SIZE
  // (50) som orsakade TASK-350. Namngivna 'p001'…'p055' så ordningen är
  // verifierbar (inte bara längden).
  const alla = Array.from({ length: 55 }, (_, i) => `p${String(i + 1).padStart(3, '0')}`);
  const sidor = [alla.slice(0, 20), alla.slice(20, 40), alla.slice(40, 55)];
  const cursorer = ['cursor-1', 'cursor-2', null]; // sida 3 null-terminerar

  const sedda: (string | undefined)[] = [];
  let index = 0;
  const resultat = await samlaCursorSidor<string>(async (cursor) => {
    sedda.push(cursor);
    const poster = sidor[index];
    const nextCursor = cursorer[index];
    index += 1;
    return { poster, nextCursor };
  });

  expect(resultat.length, 'alla 55 poster ackumulerade, ingen 50-klampning').toBe(55);
  expect(resultat, 'ordningen är EF-ordningen, oomsorterad').toEqual(alla);
  expect(sedda, 'cursorn trådas: sida 1 utan cursor, sida 2/3 med föregåendes nextCursor').toEqual([
    undefined,
    'cursor-1',
    'cursor-2',
  ]);
});

// ─────────────────────────────────────────────────────────────────────────
// § 3 — tom mängd
// ─────────────────────────────────────────────────────────────────────────

test('tom mängd (0 poster, null direkt): giltigt resultat, ingen krasch', async () => {
  const resultat = await samlaCursorSidor<string>(async () => ({ poster: [], nextCursor: null }));
  expect(resultat).toEqual([]);
});

// ─────────────────────────────────────────────────────────────────────────
// § 4 — säkerhetstaket
// ─────────────────────────────────────────────────────────────────────────

test('säkerhetstak: en EF som aldrig null-terminerar ger ett tydligt fel, ingen oändlig loop', async () => {
  let anrop = 0;
  await expect(
    samlaCursorSidor<string>(
      async () => {
        anrop += 1;
        return { poster: [], nextCursor: 'alltid-mer' };
      },
      5, // lågt tak för ett snabbt test
    ),
  ).rejects.toThrow(/säkerhetstaket \(5 sidor\)/);
  expect(anrop, 'taket respekteras exakt').toBe(5);
});

// ─────────────────────────────────────────────────────────────────────────
// § 5 — anropsdisciplin
// ─────────────────────────────────────────────────────────────────────────

test('hamtaSida anropas en gång per SIDA, inte en gång per post', async () => {
  let anrop = 0;
  await samlaCursorSidor<number>(async (cursor) => {
    anrop += 1;
    if (!cursor) return { poster: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], nextCursor: 'nasta' };
    return { poster: [11, 12], nextCursor: null };
  });
  expect(anrop).toBe(2);
});
