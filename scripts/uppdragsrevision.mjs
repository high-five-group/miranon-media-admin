#!/usr/bin/env node
/**
 * scripts/uppdragsrevision.mjs — drar samtliga subagent-uppdrag (Agent-spawns
 * med full prompt) ur en Claude Code-sessions transcript-JSONL, som underlag
 * för retrospektiv uppdragsrevision (`T110`, ADR-086).
 *
 * VARFÖR EXTRAKTION, INTE NY LOGG-MEKANISM: T110-prövningens dom var att
 * klass I:s nämnare (antalet verifierbara referenser i uppdragstexterna) är
 * OLOGGAD, inte omätbar — transcript-JSONL bär redan varje uppdragstext.
 * Spawn-loggen (`.claude/agent-spawn-log.jsonl`, scripts/agent-spawn-log.sh)
 * bär medvetet bara metadata (typ, isolering), ALDRIG prompten. Detta skript
 * är därför läsaren som saknades: det gör en sessions samtliga uppdrag
 * revisionsbara utan att någon ny skrivväg byggs.
 *
 * VAD SKRIPTET INTE GÖR — MEDVETET: det räknar inte referenser och dömer
 * inga uppdrag. En regex som "hittar referenser" vore exakt den
 * instrumentblindhet klass A/II beskriver (ett instrument som ser EN form men
 * inte alla — jfr `[UNIVERSAL]` 59 mot 72). Nämnare och täljare räknas av den
 * som utför revisionen, med hela uppdragstexten i hand.
 *
 * READ-ONLY: skriptet läser filer och skriver ENDAST till stdout/stderr.
 *
 * KONFIG-DRIVEN, INTE HÅRDKODAD: ingen `.conf` behövs — skriptet bär inga
 * projekt-specifika värden. Transcript-katalogen härleds ur Claude
 * Code-konventionen `~/.claude/projects/<sökväg med / och . ersatta av ->`
 * (verifierad mot faktiska katalognamn 2026-08-01, inkl. worktree-formen
 * `...--claude-worktrees-...`), med `CLAUDE_PROJECT_DIR`/cwd som rot och
 * `--katalog` som explicit override. Samma resonemang som
 * scripts/agent-spawn-log.sh: datakällan ÄR konfigurationen.
 *
 * SIDECHAIN-RADER EXKLUDERAS OCH RÄKNAS: rader med `isSidechain: true` är
 * subagenters egna trådar — deras eventuella Agent-anrop är inte
 * ORKESTRERARENS uppdrag och hör inte till revisionens nämnare. De räknas i
 * sammanfattningen så exkluderingen är synlig, aldrig tyst.
 *
 * FAIL LOUD, ALDRIG FAIL-OPEN: en fil som inte finns, en tvetydig prefix
 * eller en fil utan en enda giltig JSON-rad ger exit 1 med besked — T110
 * instans #1 var en vakt som matchade noll objekt och rapporterade "klart".
 * Noll uppdrag i en GILTIG transcript är däremot ett sant resultat: exit 0
 * med explicit "0 uppdrag" i sammanfattningen.
 *
 * Användning:
 *   npm run revision:uppdrag -- --session <id-prefix|sökväg> [--katalog <dir>]
 *   npm run revision:uppdrag -- --lista [--katalog <dir>]
 *
 * Output: en JSON-rad per uppdrag till stdout (jq-vänlig); sammanfattning
 * till stderr. Exit 0 = extraktion utförd; exit 1 = källan gick inte att
 * läsa entydigt.
 *
 * Etablerad: 2026-08-01 (`T110` § Extern prövning, dom "JA NU" för
 * mätåtgärden; ADR-086). Testerna: scripts/test-uppdragsrevision.mjs.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Härleder transcript-katalogen ur projektroten per Claude Code-konventionen:
 * `/` och `.` ersätts med `-`. Verifierad mot faktiska katalognamn
 * 2026-08-01: `/Users/…/miranon-media-admin` → `-Users-…-miranon-media-admin`
 * och `…/.claude/worktrees/x` → `…--claude-worktrees-x`.
 */
export function harledTranscriptKatalog(projektRot) {
  const namn = projektRot.replaceAll('/', '-').replaceAll('.', '-');
  return join(homedir(), '.claude', 'projects', namn);
}

/**
 * Tolkar transcript-text till rader. Trasiga rader räknas och fäller aldrig
 * tolkningen — men noll giltiga rader är anroparens signal att källan inte är
 * en transcript-JSONL alls.
 */
export function tolkaTranscriptRader(text) {
  const rader = [];
  let trasiga = 0;
  for (const rad of text.split('\n')) {
    if (!rad.trim()) continue;
    try {
      rader.push(JSON.parse(rad));
    } catch {
      trasiga += 1;
    }
  }
  return { rader, trasiga };
}

/**
 * Extraherar orkestrerarens Agent-spawns ur tolkade rader. Sidechain-rader
 * (subagenters egna trådar) exkluderas och räknas.
 */
export function extraheraUppdrag(rader) {
  const uppdrag = [];
  let sidechainExkluderade = 0;
  for (const rad of rader) {
    if (rad?.type !== 'assistant') continue;
    const innehall = rad.message?.content;
    if (!Array.isArray(innehall)) continue;
    for (const block of innehall) {
      if (block?.type !== 'tool_use' || block?.name !== 'Agent') continue;
      if (rad.isSidechain === true) {
        sidechainExkluderade += 1;
        continue;
      }
      const input = block.input ?? {};
      uppdrag.push({
        i: uppdrag.length + 1,
        ts: rad.timestamp ?? null,
        sessionId: rad.sessionId ?? null,
        verktygsanropId: block.id ?? null,
        agenttyp: input.subagent_type ?? null,
        beskrivning: input.description ?? null,
        bakgrund: input.run_in_background ?? null,
        modell: input.model ?? null,
        promptlangd: (input.prompt ?? '').length,
        prompt: input.prompt ?? '',
      });
    }
  }
  return { uppdrag, sidechainExkluderade };
}

/**
 * Slår upp sessionsfilen: en explicit sökväg används som den är; annars
 * prefix-matchas mot `<katalog>/<prefix>*.jsonl`. Noll eller flera träffar
 * kastar — tyst gissning är exakt felklassen instrumentet finns för.
 */
export function hittaSessionsfil(katalog, sessionArg) {
  if (sessionArg.includes('/') || sessionArg.endsWith('.jsonl')) {
    if (!existsSync(sessionArg)) {
      throw new Error(`sessionsfilen finns inte: ${sessionArg}`);
    }
    return sessionArg;
  }
  if (!existsSync(katalog)) {
    throw new Error(
      `transcript-katalogen finns inte: ${katalog} (fel projektrot? använd --katalog)`,
    );
  }
  const traffar = readdirSync(katalog)
    .filter((f) => f.endsWith('.jsonl') && f.startsWith(sessionArg))
    .sort();
  if (traffar.length === 0) {
    throw new Error(
      `ingen sessionsfil matchar prefixet '${sessionArg}' i ${katalog} (kör --lista)`,
    );
  }
  if (traffar.length > 1) {
    throw new Error(`prefixet '${sessionArg}' är tvetydigt i ${katalog}: ${traffar.join(', ')}`);
  }
  return join(katalog, traffar[0]);
}

function listaSessioner(katalog) {
  if (!existsSync(katalog)) {
    process.stderr.write(`❌ transcript-katalogen finns inte: ${katalog}\n`);
    return 1;
  }
  const filer = readdirSync(katalog)
    .filter((f) => f.endsWith('.jsonl'))
    .map((f) => {
      const st = statSync(join(katalog, f));
      return { f, mtime: st.mtime, bytes: st.size };
    })
    .sort((a, b) => a.mtime - b.mtime);
  for (const { f, mtime, bytes } of filer) {
    process.stdout.write(`${mtime.toISOString()}  ${String(bytes).padStart(9)} B  ${f}\n`);
  }
  process.stderr.write(`${filer.length} sessionsfil(er) i ${katalog}\n`);
  return 0;
}

function tolkaArgv(argv) {
  const val = { session: null, katalog: null, lista: false, hjalp: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--session') {
      i += 1;
      val.session = argv[i];
    } else if (a === '--katalog') {
      i += 1;
      val.katalog = argv[i];
    } else if (a === '--lista') val.lista = true;
    else if (a === '--hjalp' || a === '--help') val.hjalp = true;
    else {
      throw new Error(`okänd flagga: ${a} (se --hjalp)`);
    }
  }
  return val;
}

const HJALP = `uppdragsrevision — drar Agent-spawn-uppdrag ur en sessions transcript (T110/ADR-086)

  --session <id-prefix|sökväg>  sessionen att extrahera ur (prefix mot katalogens *.jsonl)
  --katalog <dir>               transcript-katalog (default: härledd ur CLAUDE_PROJECT_DIR/cwd)
  --lista                       lista katalogens sessionsfiler i stället
  --hjalp                       denna text

Output: en JSON-rad per uppdrag till stdout; sammanfattning till stderr.
`;

export function kor(argv, { rot = process.env.CLAUDE_PROJECT_DIR ?? process.cwd() } = {}) {
  const val = tolkaArgv(argv);
  if (val.hjalp) {
    process.stderr.write(HJALP);
    return 0;
  }
  const katalog = val.katalog ?? harledTranscriptKatalog(rot);
  if (val.lista) return listaSessioner(katalog);
  if (!val.session) {
    process.stderr.write('❌ --session krävs (eller --lista). Se --hjalp.\n');
    return 1;
  }
  const fil = hittaSessionsfil(katalog, val.session);
  const { rader, trasiga } = tolkaTranscriptRader(readFileSync(fil, 'utf8'));
  if (rader.length === 0) {
    process.stderr.write(
      `❌ ${fil}: inte en enda giltig JSON-rad (${trasiga} trasiga) — är detta en transcript-JSONL?\n`,
    );
    return 1;
  }
  const { uppdrag, sidechainExkluderade } = extraheraUppdrag(rader);
  for (const u of uppdrag) {
    process.stdout.write(`${JSON.stringify(u)}\n`);
  }
  const perTyp = new Map();
  for (const u of uppdrag) {
    const typ = u.agenttyp ?? '(otypad)';
    perTyp.set(typ, (perTyp.get(typ) ?? 0) + 1);
  }
  const typRad = [...perTyp.entries()].map(([typ, n]) => `${typ}=${n}`).join(' · ');
  process.stderr.write(`källa: ${fil}\n`);
  process.stderr.write(
    `${uppdrag.length} uppdrag (${typRad || 'inga'}) · ${sidechainExkluderade} sidechain-exkluderade · ${rader.length} rader (${trasiga} trasiga)\n`,
  );
  if (uppdrag.length === 0) {
    process.stderr.write(
      '⚠️  0 uppdrag är ett sant resultat för en session utan spawns — men fel session ger också 0. Verifiera sessionsvalet.\n',
    );
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exit(kor(process.argv.slice(2)));
  } catch (err) {
    process.stderr.write(`❌ ${err.message}\n`);
    process.exit(1);
  }
}
