import { expect, test } from '@playwright/test';
import {
  devPort,
  harledIndex,
  KLASS_BASPORT,
  plockaRotter,
  type Testklass,
} from '../support/dev-portar';

/**
 * TASK-251 — dev-serverportarnas worktree-derivering.
 *
 * Vad sviten bevisar: att två samtidiga checkouts på samma maskin aldrig kan
 * få samma dev-serverport, och att huvudkatalogens portar är oförändrade.
 * Fixens hela värde ligger i den första egenskapen, så den prövas mot
 * KONSTRUERADE checkout-listor — inte mot vad maskinen råkar ha för worktrees
 * när sviten körs. Ett test som bara läser den faktiska listan hade varit
 * grönt även om logiken gav alla checkouts samma index.
 *
 * Hemvist: api-pure-projektet, som är repots projekt för creds-fria
 * enhetstester utan staging-koppling (jfr env-coherence.test.ts,
 * ef-metod-vakt.test.ts — samma klass av strukturell invariant, ingen av dem
 * rör ett API).
 */

const HUVUD = '/repo';
const KLASSER = Object.keys(KLASS_BASPORT) as Testklass[];

/** Portlåsta portar som en deriverad port aldrig får landa på. */
const E2E_DEV_PORT = 5173;
const PREVIEW_PORT = 4173;

test.describe('harledIndex — den rena kärnan', () => {
  test('huvudkatalogen får alltid index 0', () => {
    expect(harledIndex([HUVUD], HUVUD)).toBe(0);
    expect(harledIndex([HUVUD, '/repo/wt-a', '/repo/wt-b'], HUVUD)).toBe(0);
  });

  test('varje checkout i listan får ett EGET index — ingen delad port', () => {
    // Kärnegenskapen. Fäller om två checkouts någonsin mappas till samma
    // block, vilket är exakt den kollision kortet beskriver.
    const rotter = [
      HUVUD,
      '/repo/.claude/worktrees/agent-a855c261f2a4757a0',
      '/repo/.claude/worktrees/agent-a022227ea72815d13',
      '/repo/.claude/worktrees/s104-segment-passet',
      '/repo/.claude/worktrees/s96-work-batch',
    ];

    const index = rotter.map((rot) => harledIndex(rotter, rot));

    expect(new Set(index).size).toBe(rotter.length);
    expect(index).toContain(0); // huvudkatalogen behåller basporten
  });

  test('samma lista ger samma index oavsett git:s egen ordning på de linkade', () => {
    // Determinismen: git dokumenterar bara att huvudkatalogen står först.
    // Kastas de linkade om ska index vara oförändrat, annars kan två
    // körningar i SAMMA worktree hamna på olika portar.
    const min = '/repo/wt-b';
    const framat = [HUVUD, '/repo/wt-a', '/repo/wt-b', '/repo/wt-c'];
    const bakat = [HUVUD, '/repo/wt-c', '/repo/wt-b', '/repo/wt-a'];

    expect(harledIndex(framat, min)).toBe(harledIndex(bakat, min));
  });

  test('okänd rot och tom lista faller till 0 — basporten, aldrig ett kast', () => {
    // Fallbacken är dagens beteende. En körning utanför en listad checkout
    // ska fungera precis som före TASK-251, inte stoppas.
    expect(harledIndex([HUVUD, '/repo/wt-a'], '/nagon/annanstans')).toBe(0);
    expect(harledIndex([], '/repo/wt-a')).toBe(0);
  });
});

test.describe('plockaRotter — porcelain-parsningen', () => {
  test('plockar rötterna i git:s ordning och ignorerar övriga attribut', () => {
    // Verklig utdataform, inklusive `locked`-raden som Claude Codes
    // agent-worktrees bär och som tidigare kunde förväxlas med en post.
    const utdata = [
      'worktree /repo',
      'HEAD 2d10f72abd7216c39510e495a7cddaef2d6098be',
      'branch refs/heads/main',
      '',
      'worktree /repo/.claude/worktrees/agent-a855c261f2a4757a0',
      'HEAD ebc2dbe8cb2e140548b63f15e76461458f59c6d4',
      'branch refs/heads/worktree-agent-a855c261f2a4757a0',
      'locked claude agent agent-a855c261f2a4757a0 (pid 47391)',
      '',
    ].join('\n');

    expect(plockaRotter(utdata)).toEqual([
      '/repo',
      '/repo/.claude/worktrees/agent-a855c261f2a4757a0',
    ]);
  });

  test('tom utdata ger tom lista', () => {
    expect(plockaRotter('')).toEqual([]);
  });
});

test.describe('devPort — porten i DENNA checkout', () => {
  test('de fyra klasserna får fyra olika portar', () => {
    const portar = KLASSER.map(devPort);
    expect(new Set(portar).size).toBe(KLASSER.length);
  });

  test('varje port bär sin klass-ändelse — blocket ligger i tusentalet', () => {
    // Läsbarhetskontraktet: ändelsen säger klassen, tusentalet säger
    // checkouten. Bryts det blir en port i en felsökningslogg otydbar.
    for (const klass of KLASSER) {
      const port = devPort(klass);
      expect(port % 1000).toBe(KLASS_BASPORT[klass] % 1000);
      expect(port).toBeGreaterThanOrEqual(KLASS_BASPORT[klass]);
    }
  });

  test('ingen port kolliderar med de CORS-portlåsta portarna', () => {
    // e2e (5173) och staging-preview (4173) deriveras medvetet INTE — de är
    // låsta av staging-EF:ernas allowlist. En deriverad port som landade på
    // dem hade stulit porten från den klass som inte kan flytta.
    for (const klass of KLASSER) {
      expect(devPort(klass)).not.toBe(E2E_DEV_PORT);
      expect(devPort(klass)).not.toBe(PREVIEW_PORT);
    }
  });

  test('varje port ligger under det efemära intervallets golv', () => {
    // Linux' net.ipv4.ip_local_port_range börjar på 32768. En port däröver kan
    // kärnan redan ha delat ut till en utgående anslutning → sporadisk
    // bindningsfällning.
    for (const klass of KLASSER) {
      expect(devPort(klass)).toBeLessThan(32768);
      expect(devPort(klass)).toBeGreaterThan(1023);
    }
  });

  test('är stabil inom processen — två anrop ger samma port', () => {
    for (const klass of KLASSER) {
      expect(devPort(klass)).toBe(devPort(klass));
    }
  });
});
