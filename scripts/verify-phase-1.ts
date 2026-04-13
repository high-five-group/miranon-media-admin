/**
 * Fas 1 runtime-verifiering.
 *
 * Körs med: node --experimental-strip-types scripts/verify-phase-1.ts
 *
 * Tre bevis:
 *  1. EventSchema.parse({}) kastar ZodError (Zod-validering aktiv).
 *  2. fetchWithRetry gör 3 retries med exponentiell backoff vid nätverksfel.
 *  3. alertScreenReader skapar ett aria-live-element i DOM (verifierat med stub).
 *
 * Lämnar noll sidoeffekter. Används som regressionssanity innan commit.
 */

import { fetchWithRetry } from '../src/data/utils.ts';
import { EventSchema } from '../src/domain/schemas/Event.schema.ts';

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, details?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}${details ? ` — ${details}` : ''}`);
    failed++;
  }
}

// ─── 1. Zod-schema kraschar på tomt objekt ───────────────────────────────────
console.log('\n[1] EventSchema.parse({}) → ZodError');
try {
  EventSchema.parse({});
  assert('parse({}) kastade ZodError', false, 'ingen error kastades');
} catch (err) {
  const errName = (err as { name?: string }).name ?? 'unknown';
  assert('parse({}) kastade ZodError', errName === 'ZodError', `fick: ${errName}`);
}

// ─── 2. fetchWithRetry retryar 3 gånger på nätverksfel ───────────────────────
console.log('\n[2] fetchWithRetry — 3 retries på nätverksfel');
{
  const attemptLog: number[] = [];
  const sleepLog: number[] = [];

  const fakeFetch: typeof fetch = async () => {
    attemptLog.push(Date.now());
    throw new TypeError('network error');
  };
  const fakeSleep = async (ms: number): Promise<void> => {
    sleepLog.push(ms);
  };

  try {
    await fetchWithRetry('http://nowhere.invalid', undefined, {
      fetchImpl: fakeFetch,
      sleep: fakeSleep,
    });
    assert('kastade fel efter retries', false, 'returnerade utan fel');
  } catch (err) {
    assert('kastade fel efter retries', err instanceof TypeError);
  }

  assert(
    'gjorde 4 försök (1 initialt + 3 retries)',
    attemptLog.length === 4,
    `fick ${attemptLog.length}`,
  );
  assert('sov 3 gånger mellan försöken', sleepLog.length === 3, `fick ${sleepLog.length}`);

  // Backoff: 200 ± jitter, 400 ± jitter, 800 ± jitter.
  // Jitter är 0..100ms (baseDelay/2). Så intervall:
  //   försök 0→1:  200..300
  //   försök 1→2:  400..500
  //   försök 2→3:  800..900
  assert('backoff 1: 200–300 ms', sleepLog[0] >= 200 && sleepLog[0] < 300, `fick ${sleepLog[0]}`);
  assert('backoff 2: 400–500 ms', sleepLog[1] >= 400 && sleepLog[1] < 500, `fick ${sleepLog[1]}`);
  assert('backoff 3: 800–900 ms', sleepLog[2] >= 800 && sleepLog[2] < 900, `fick ${sleepLog[2]}`);
}

// ─── 3. alertScreenReader skapar <div> i document.body (DOM-stub) ────────────
console.log('\n[3] alertScreenReader — skapar aria-live-element i DOM');
{
  type Node = {
    tagName?: string;
    attrs: Record<string, string>;
    children: Node[];
    parent: Node | null;
    textContent: string;
    style: Record<string, string>;
    setAttribute(name: string, value: string): void;
    appendChild(child: Node): Node;
    removeChild(child: Node): Node;
    remove(): void;
    contains(child: Node): boolean;
    get firstChild(): Node | null;
    get parentElement(): Node | null;
  };

  const makeNode = (tagName?: string): Node => {
    const node: Node = {
      tagName,
      attrs: {},
      children: [],
      parent: null,
      textContent: '',
      style: {},
      setAttribute(name, value) {
        this.attrs[name] = value;
      },
      appendChild(child) {
        child.parent = this;
        this.children.push(child);
        return child;
      },
      removeChild(child) {
        this.children = this.children.filter((c) => c !== child);
        child.parent = null;
        return child;
      },
      remove() {
        if (this.parent) {
          this.parent.removeChild(this);
        }
      },
      contains(child) {
        if (child === this) return true;
        return this.children.some((c) => c === child || c.contains(child));
      },
      get firstChild() {
        return this.children[0] ?? null;
      },
      get parentElement() {
        return this.parent;
      },
    };
    return node;
  };

  const documentElement = makeNode('html');
  const body = makeNode('body');
  documentElement.appendChild(body);

  const stubDocument = {
    documentElement,
    body,
    createElement: (tag: string) => makeNode(tag),
  };

  (globalThis as unknown as { document: typeof stubDocument }).document = stubDocument;

  const mod = await import('../src/lib/alert-screen-reader.ts');
  mod.alertScreenReader('test');

  // Vänta på APPEND_DELAY (100ms) + lite extra för att meddelandet ska appendas.
  await new Promise((r) => setTimeout(r, 150));

  const wrapper = body.children[0];
  assert('wrapper finns i document.body', wrapper !== undefined);
  assert(
    'wrapper har data-mm-announcer',
    wrapper !== undefined && 'data-mm-announcer' in wrapper.attrs,
  );
  assert('wrapper har aria-live', wrapper !== undefined && 'aria-live' in wrapper.attrs);
  assert(
    'wrapper har minst ett <p>-barn med text',
    wrapper?.children.some((c) => c.tagName === 'p' && c.textContent === 'test') ?? false,
  );
}

// ─── Resultat ─────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
