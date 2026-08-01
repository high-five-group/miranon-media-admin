#!/usr/bin/env node
// scripts/test-uppdragsrevision.mjs — tester för uppdragsrevisionens
// extraktion (samma konvention som scripts/test-ci-metrics.mjs: skript bär
// eget test-skript med samma namnstam; fixtur-data, aldrig levande
// transcript). Prövar de publika ytorna, aldrig interna hjälpfunktioner.
//
// Kör: node scripts/test-uppdragsrevision.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.
//
// Bevis i BÅDA riktningar (T110 instans #1 var en vakt som fail-open:ade på
// noll träffar): sviten prövar både att instrumentet extraherar rätt och att
// det FÄLLER — saknad session, tvetydig prefix, fil utan giltig JSON.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extraheraUppdrag,
  harledTranscriptKatalog,
  hittaSessionsfil,
  tolkaTranscriptRader,
} from './uppdragsrevision.mjs';

const SKRIPT = join(dirname(fileURLToPath(import.meta.url)), 'uppdragsrevision.mjs');

let failed = 0;
function t(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`❌ ${name}: ${err.message}`);
  }
}

// --- Fixtur: en transcript med kända rader (handräknat facit) ---

const spawnRad = (over = {}) =>
  JSON.stringify({
    type: 'assistant',
    timestamp: '2026-08-01T10:00:00.000Z',
    sessionId: 'fixtur-session',
    isSidechain: false,
    message: {
      content: [
        { type: 'text', text: 'spawnar nu' },
        {
          type: 'tool_use',
          id: 'toolu_01',
          name: 'Agent',
          input: {
            subagent_type: 'bygg-agent',
            description: 'Fixtur-uppdraget',
            prompt: 'Bygg X. Filen a/b.ts rad 42 bär Y.',
            run_in_background: true,
          },
        },
      ],
    },
    ...over,
  });

const FIXTUR = [
  // summary-rad utan message (transcriptens första rad har formen)
  JSON.stringify({ type: 'summary', leafUuid: 'x', sessionId: 'fixtur-session' }),
  JSON.stringify({ type: 'user', message: { content: 'gör saken' } }),
  // assistant utan tool_use
  JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'ok' }] } }),
  // assistant med ANNAN tool_use — inte ett uppdrag
  JSON.stringify({
    type: 'assistant',
    message: { content: [{ type: 'tool_use', id: 't2', name: 'Bash', input: { command: 'ls' } }] },
  }),
  spawnRad(),
  // sidechain-spawn — subagentens eget anrop, INTE orkestrerarens uppdrag
  spawnRad({ isSidechain: true }),
].join('\n');

// --- tolkaTranscriptRader ---

t('tolkning: trasiga rader räknas och fäller inte', () => {
  const { rader, trasiga } = tolkaTranscriptRader(`${FIXTUR}\ninte json alls\n{trasig`);
  assert.equal(rader.length, 6);
  assert.equal(trasiga, 2);
});

t('tolkning: fil utan en enda giltig rad ger noll rader (CLI fäller på det)', () => {
  const { rader, trasiga } = tolkaTranscriptRader('alfa\nbeta\n');
  assert.equal(rader.length, 0);
  assert.equal(trasiga, 2);
});

// --- extraheraUppdrag ---

t('extraktion: exakt uppdraget ur blandade rader, med full prompt och fält', () => {
  const { rader } = tolkaTranscriptRader(FIXTUR);
  const { uppdrag, sidechainExkluderade } = extraheraUppdrag(rader);
  assert.equal(uppdrag.length, 1);
  assert.equal(sidechainExkluderade, 1);
  const [u] = uppdrag;
  assert.equal(u.agenttyp, 'bygg-agent');
  assert.equal(u.beskrivning, 'Fixtur-uppdraget');
  assert.equal(u.prompt, 'Bygg X. Filen a/b.ts rad 42 bär Y.');
  assert.equal(u.promptlangd, u.prompt.length);
  assert.equal(u.bakgrund, true);
  assert.equal(u.verktygsanropId, 'toolu_01');
  assert.equal(u.ts, '2026-08-01T10:00:00.000Z');
});

// --- harledTranscriptKatalog (munging verifierad mot faktiska katalognamn) ---

t('katalog-härledning: / och . blir -, worktree-formen får dubbelt streck', () => {
  const k = harledTranscriptKatalog('/Users/x/Repon/repo/.claude/worktrees/a');
  assert.ok(k.endsWith('/.claude/projects/-Users-x-Repon-repo--claude-worktrees-a'));
});

// --- hittaSessionsfil + CLI (filsystem-fixtur i unik temp-katalog) ---

const TMP = mkdtempSync(join(tmpdir(), 'uppdragsrevision-test-'));
try {
  const KATALOG = join(TMP, 'projects-fixtur');
  mkdirSync(KATALOG);
  writeFileSync(join(KATALOG, 'aa11-session.jsonl'), FIXTUR);
  writeFileSync(join(KATALOG, 'aa22-session.jsonl'), FIXTUR);
  writeFileSync(join(KATALOG, 'bb33-ej-json.jsonl'), 'inte json\n');

  t('uppslag: unik prefix träffar, tvetydig och saknad kastar', () => {
    assert.ok(hittaSessionsfil(KATALOG, 'aa11').endsWith('aa11-session.jsonl'));
    assert.throws(() => hittaSessionsfil(KATALOG, 'aa'), /tvetydigt/);
    assert.throws(() => hittaSessionsfil(KATALOG, 'cc'), /ingen sessionsfil/);
    assert.throws(() => hittaSessionsfil(join(TMP, 'finns-ej'), 'aa11'), /katalogen finns inte/);
  });

  const kliKor = (args) => {
    try {
      const stdout = execFileSync(process.execPath, [SKRIPT, ...args], { encoding: 'utf8' });
      return { status: 0, stdout };
    } catch (err) {
      return { status: err.status, stdout: err.stdout ?? '' };
    }
  };

  t('CLI grönt: extraherar fixtur-uppdraget som en JSON-rad på stdout', () => {
    const { status, stdout } = kliKor(['--session', 'aa11', '--katalog', KATALOG]);
    assert.equal(status, 0);
    const rader = stdout.trim().split('\n');
    assert.equal(rader.length, 1);
    assert.equal(JSON.parse(rader[0]).prompt, 'Bygg X. Filen a/b.ts rad 42 bär Y.');
  });

  t('CLI fäller: saknad session exit 1', () => {
    assert.equal(kliKor(['--session', 'cc99', '--katalog', KATALOG]).status, 1);
  });

  t('CLI fäller: tvetydig prefix exit 1', () => {
    assert.equal(kliKor(['--session', 'aa', '--katalog', KATALOG]).status, 1);
  });

  t('CLI fäller: fil utan giltig JSON exit 1', () => {
    assert.equal(kliKor(['--session', 'bb33', '--katalog', KATALOG]).status, 1);
  });

  t('CLI fäller: okänd flagga exit 1', () => {
    assert.equal(kliKor(['--sessoin', 'aa11']).status, 1);
  });

  t('CLI --lista: radar katalogens sessionsfiler', () => {
    const { status, stdout } = kliKor(['--lista', '--katalog', KATALOG]);
    assert.equal(status, 0);
    assert.equal(stdout.trim().split('\n').length, 3);
    assert.match(stdout, /aa11-session\.jsonl/);
  });
} finally {
  rmSync(TMP, { recursive: true, force: true });
}

process.exit(failed === 0 ? 0 : 1);
