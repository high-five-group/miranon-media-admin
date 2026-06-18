// Kanonisk ADR-056-kontrakts-harness för cursor-baserade list-portar.
//
// Detta är den ÅTERANVÄNDBARA conformance-assertionen som ALLA Fas 6-list-
// endpoints (get-persons nu; 6b/6c ärver den) skarpt testas mot. Den vet
// INGENTING om en specifik domän (Personer/Events/…) — callern injicerar en
// `callPage`-funktion som anropar sin EF och reducerar sidan till jämförbara
// identiteter (`items: string[]`, t.ex. namn i EF-ordning). Harnessen
// asserterar enbart ADR-056-kontraktet:
//
//   - Vandra från cursor=undefined via nextCursor tills null; ackumulera items.
//   - Sista sidan: nextCursor === null. ALLA tidigare sidor: nextCursor !== null.
//   - Varje icke-sista sida returnerar EXAKT pageSize items; sista sidan resten.
//   - Ackumulerat antal === expectedNames.length, i EXAKT expectedNames-ordning.
//   - Opacitet: nextCursor är en ogenomskinlig sträng (black-box) eller null —
//     aldrig ett offset-läckage. Sida 1 returnerar INTE alla items när
//     total > pageSize (bevisar äkta paginering, ej full-walk-then-slice).
//
// Källa-agnostisk by design → 6b/6c importerar och invokerar med sin egen
// callPage + fixtur. Rätt bevis på rätt nivå (EF/cursor-mekaniken skarpt;
// klient-a11y täcks separat av mock-baserade e2e).

import { expect } from '@playwright/test';

export interface CursorPage {
  /** Sidans poster reducerade till jämförbara identiteter, i EF-ordning. */
  items: string[];
  /** Opak fortsättnings-token; sträng tills sista sidan, då null. */
  nextCursor: string | null;
}

export interface CursorConformanceConfig {
  /** Anropar list-EF:en skarpt och reducerar svaret till { items, nextCursor }. */
  callPage: (args: { search: string; cursor?: string; pageSize: number }) => Promise<CursorPage>;
  /** Search-term som isolerar fixturen (substring-matchas av EF:en). */
  fixturePrefix: string;
  /** Hela den förväntade sekvensen, i EF:ens sorteringsordning. */
  expectedNames: string[];
  /** Sidstorlek att begära per anrop. */
  pageSize: number;
}

/**
 * Asserterar ADR-056 cursor-port-kontraktet end-to-end mot en skarp list-EF.
 * Kastar (via expect) vid första kontraktsbrott.
 */
export async function assertCursorPortConformance(cfg: CursorConformanceConfig): Promise<void> {
  const { callPage, fixturePrefix, expectedNames, pageSize } = cfg;
  const total = expectedNames.length;

  // Säkerhetstak mot en icke-terminerande cursor (bug → annars oändlig loop).
  const maxPages = Math.ceil(total / pageSize) + 2;

  const accumulated: string[] = [];
  let cursor: string | undefined;
  let pageIndex = 0;
  let firstPageItemCount = -1;

  for (;;) {
    const page = await callPage({ search: fixturePrefix, cursor, pageSize });
    pageIndex += 1;

    expect(
      pageIndex,
      'paginering vandrade fler sidor än väntat (möjlig icke-terminerande cursor)',
    ).toBeLessThanOrEqual(maxPages);

    if (pageIndex === 1) firstPageItemCount = page.items.length;

    // Opacitet: icke-sista sidor bär en icke-tom sträng; sista sidan null.
    if (page.nextCursor !== null) {
      expect(
        typeof page.nextCursor,
        `sida ${pageIndex}: nextCursor måste vara en opak sträng (eller null på sista sidan)`,
      ).toBe('string');
      expect(
        page.nextCursor.length,
        `sida ${pageIndex}: opak cursor får inte vara tom sträng`,
      ).toBeGreaterThan(0);
    }

    accumulated.push(...page.items);

    if (page.nextCursor === null) {
      // Sista sidan: får inte överstiga pageSize, måste bära ≥1 post.
      expect(
        page.items.length,
        `sista sidan (${pageIndex}) ska bära resten (1..pageSize) items`,
      ).toBeGreaterThan(0);
      expect(
        page.items.length,
        `sista sidan (${pageIndex}) får inte överstiga pageSize`,
      ).toBeLessThanOrEqual(pageSize);
      break;
    }

    // Icke-sista sida → exakt pageSize items.
    expect(
      page.items.length,
      `icke-sista sida ${pageIndex} ska returnera exakt pageSize=${pageSize} items`,
    ).toBe(pageSize);

    cursor = page.nextCursor;
  }

  // Ackumulerat: exakt rätt antal, i exakt rätt ordning.
  expect(accumulated.length, 'ackumulerat antal ska === expectedNames.length').toBe(total);
  expect(accumulated, 'ackumulerade items i exakt expectedNames-ordning').toEqual(expectedNames);

  // Bevis på äkta paginering (ej full-walk-then-slice): sida 1 bär inte allt.
  if (total > pageSize) {
    expect(
      firstPageItemCount,
      'sida 1 får inte returnera alla items (bevisar paginering, ej full-walk-then-slice)',
    ).toBe(pageSize);
  }
}
