#!/usr/bin/env node
/**
 * scripts/agent-spawn-metrics.mjs — mäter efterlevnaden av worktree-isolering
 * vid subagent-spawn.
 *
 * Steg 2 av research-passets fyra (docs/research/hook-mekanisering-worktree-
 * isolering-2026-07-28.md). Steg 1 var typade agenter med `isolation: worktree`
 * i frontmatter; detta skript svarar på om steg 1 RÄCKER, så att beslutet om
 * steg 3 (`permissions.deny`) och steg 4 (korrigerande hook) vilar på siffror
 * i stället för åsikter.
 *
 * Källa: `.claude/agent-spawn-log.jsonl`, skriven av den icke-blockerande
 * `PreToolUse`-hooken i `.claude/settings.json`.
 *
 * KONFIG-DRIVEN, INTE HÅRDKODAD: vilka agenttyper som är självisolerande läses
 * ur `.claude/agents/*.md`-frontmatter. Läggs en ny typ till behöver detta
 * skript inte röras — samma princip som repots övriga grindvakter.
 *
 * En rad i loggen bär `isolation: null` även för en typad agent, eftersom
 * fältet speglar ANROPETS parameter och isoleringen kommer från frontmatter.
 * Att blanda ihop de två skulle göra varje typad spawn till ett falskt läckage.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROT = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const LOGG = join(ROT, '.claude', 'agent-spawn-log.jsonl');
const AGENTKATALOG = join(ROT, '.claude', 'agents');

/** Agenttyper vars frontmatter bär `isolation: worktree` — de isolerar sig själva. */
function sjalvisolerandeTyper() {
  if (!existsSync(AGENTKATALOG)) return new Set();
  const typer = new Set();
  for (const fil of readdirSync(AGENTKATALOG).filter((f) => f.endsWith('.md'))) {
    const text = readFileSync(join(AGENTKATALOG, fil), 'utf8');
    const fm = text.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) continue;
    const namn = fm[1].match(/^name:\s*(\S+)/m)?.[1];
    const iso = fm[1].match(/^isolation:\s*(\S+)/m)?.[1];
    if (namn && iso === 'worktree') typer.add(namn);
  }
  return typer;
}

function lasLogg() {
  if (!existsSync(LOGG)) return [];
  return readFileSync(LOGG, 'utf8')
    .split('\n')
    .filter(Boolean)
    .flatMap((rad) => {
      try {
        return [JSON.parse(rad)];
      } catch {
        return []; // en trasig rad får aldrig fälla mätningen
      }
    });
}

const sjalvisolerande = sjalvisolerandeTyper();
const rader = lasLogg();

if (rader.length === 0) {
  console.log('Ingen spawn-logg ännu — hooken har inte fyrat.');
  console.log(`Förväntad sökväg: ${LOGG}`);
  process.exit(0);
}

const isolerad = (r) => r.isolation != null || sjalvisolerande.has(r.type);

const perTyp = new Map();
for (const r of rader) {
  const t = perTyp.get(r.type) ?? { totalt: 0, isolerade: 0, franWorktree: 0 };
  t.totalt += 1;
  if (isolerad(r)) t.isolerade += 1;
  if (r.fran_worktree) t.franWorktree += 1;
  perTyp.set(r.type, t);
}

const totalt = rader.length;
const totaltIsolerade = rader.filter(isolerad).length;
const lackage = rader.filter((r) => !isolerad(r));
const kvot = ((totaltIsolerade / totalt) * 100).toFixed(1);

console.log('\nAGENT-SPAWN — ISOLERINGENS EFTERLEVNAD');
console.log('═'.repeat(64));
console.log(`Spawns totalt        ${totalt}`);
console.log(`Isolerade            ${totaltIsolerade}  (${kvot} %)`);
console.log(`Ej isolerade         ${lackage.length}`);
console.log(
  `Självisolerande typer: ${sjalvisolerande.size ? [...sjalvisolerande].join(', ') : '(inga)'}`,
);

console.log('\nPER TYP');
console.log('─'.repeat(64));
for (const [typ, t] of [...perTyp.entries()].sort((a, b) => b[1].totalt - a[1].totalt)) {
  const flagga = sjalvisolerande.has(typ) ? ' [självisolerande]' : '';
  console.log(
    `  ${typ.padEnd(24)} ${String(t.totalt).padStart(3)} spawns · ` +
      `${String(t.isolerade).padStart(3)} isolerade${flagga}`,
  );
}

if (lackage.length > 0) {
  console.log('\nEJ ISOLERADE — kandidater för steg 3');
  console.log('─'.repeat(64));
  const franHuvudkatalog = lackage.filter((r) => !r.fran_worktree).length;
  console.log(
    `  ${franHuvudkatalog} av ${lackage.length} spawnades från huvudkatalogen ` +
      '(där kollisionsrisken finns).',
  );
  console.log('  Senaste fem:');
  for (const r of lackage.slice(-5)) {
    console.log(`    ${r.ts}  ${r.type}  bg=${r.bg}  från_worktree=${r.fran_worktree}`);
  }
  console.log(
    '\n  OBS: en ej isolerad spawn är INTE automatiskt ett fel. En rent\n' +
      '  läsande agent behöver ingen worktree. Siffran är underlag för\n' +
      '  bedömning, inte en domslut — läs typ och sammanhang innan steg 3\n' +
      '  övervägs.',
  );
} else {
  console.log('\nInga oisolerade spawns i loggen.');
}
console.log('');
