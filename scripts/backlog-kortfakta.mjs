#!/usr/bin/env node
// backlog-kortfakta.mjs — samlar de kort-fakta backlog-stängningsgrinden behöver
// i ETT svep, i stället för ett CLI-anrop per kort.
//
// ═══ VARFÖR FILEN FINNS — ROTORSAKEN ÄR KVADRATISK, INTE GREN-SKANNINGEN ═══
//
// check-backlog-closure.sh gjorde ett `backlog task <id> --plain` PER KORT.
// TASK-238 lagade först gren-skanningen (check_active_branches via ROOT_CONFIG,
// se grindens §3) — och natten 2026-08-17 korsade grinden ÄNDÅ sitt tak:
// jobbet `Backlog-stängning (natt-grind)` i run 31987759931 CANCELLADES mot
// timeout-minutes: 10 efter 10m16s, med fix-commiten d5507aac bevisat i trädet
// (`git merge-base --is-ancestor d5507aac 9f0d14c0`). Grinden hade då hunnit
// till TASK-164 av 502 kort.
//
// MÄTT 2026-08-17 (denna maskin, load avg ~7, check_active_branches AV):
// `task view` kostar LINJÄRT i KATALOGENS storlek — den laddar hela
// uppgiftskatalogen vid varje anrop:
//
//     10 kort i katalogen → 0,471 s per view
//     50 kort            → 0,614 s
//    150 kort            → 0,976 s
//    300 kort            → 1,524 s
//    502 kort            → 2,654 s
//
// Ett svep är därmed n × O(n) = O(n²): 502 × 2,654 s ≈ 1332 s ≈ 22 min. Talet
// växer kvadratiskt med backloggen — vid 700 kort ≈ 41 min. VARJE form som
// behåller ett anrop per kort är strukturellt dömd; parallellisering köper en
// konstant faktor mot kvadratisk tillväxt, inte en lösning.
//
// Jämförelsetal, samma mätning: `backlog task list --json` läser ALLA 502
// korten på 1,68 s — alltså MINDRE än ett enda `task view` (2,33 s). Bulk-
// vägen är inte en optimering i marginalen; den är en annan komplexitetsklass.
//
// ═══ VAD SOM LÄSES VAR, OCH VARFÖR DET ÄR EN AVVIKELSE VÄRD ATT SKRIVA UT ═══
//
// Repots konvention (CLAUDE.md § ISSUE-SUBSTRAT) är att kort läses och ändras
// ENDAST via backlog-CLI:t. Grindens eget huvud sade dessutom ordagrant
// "Kortens innehåll läses via backlog-CLI:t, aldrig genom att parsa
// task-filer". Denna fil BRYTER den raden för EN enda datapunkt, med öppna ögon:
//
//   * CLI:t (`task list --json`, ETT anrop) är fortsatt AUKTORITATIVT för allt
//     det faktiskt exponerar i bulk: id, status, etiketter, parentTaskId
//     (förälder/barn-relationen) och tidsstämplarna. Det är en SKÄRPNING mot
//     tidigare, inte en uppluckring: grinden läste förut CLI:ts MÄNSKLIGA
//     `--plain`-render med grep/awk; nu läses versionerad JSON (schemaVersion).
//   * Endast AC/DoD-kryssrutornas ANTAL läses ur task-filerna, eftersom CLI:t
//     inte exponerar dem i någon bulk-form alls. Prövat 2026-08-17 mot 1.49.1:
//     `task list --json` och `search --json` bär bara metadata (verifierat
//     fält för fält); `task view` tar EXAKT ETT id ("error: too many arguments
//     for 'view'. Expected 1 argument but got 2"); paketet levereras som
//     kompilerad plattformsbinär utan programmatiskt API. Det finns alltså
//     ingen O(n)-väg till AC/DoD genom verktyget.
//   * AVVIKELSEN ÄR MEKANISKT BEVAKAD, inte lovad i prosa (ADR-083): varje
//     körning korsvaliderar ett deterministiskt urval kort mot `task view
//     --json` och FÄLLER (exit 2 = anropsfel) vid minsta avvikelse. CLI:t
//     förblir därmed skiljedomare över parsningen varje natt — kostnaden är
//     några sekunder, inte 22 minuter.
//
// Blocken är avgränsade av verktygets EGNA maskin-markörer
// (`<!-- AC:BEGIN -->…<!-- AC:END -->`), som backlog.md skriver just för att
// regionerna ska vara maskinåtkomliga — ett stabilare kontrakt än den
// människo-render grinden parsade förut. Disk-verifierat 2026-08-17: 413 kort
// bär `## Acceptance Criteria` och exakt 413 bär `AC:BEGIN` (491/491 för DoD),
// noll kort bär kryssrutor UTANFÖR blocken, och kryssruteformerna är exakt två
// (`- [x]` 3020 st, `- [ ]` 1055 st).
//
// ═══ FÖRKASTADE ALTERNATIV ═══
//
// FÖRKASTAT — parallellisera de 502 view-anropen (xargs -P). Köper en konstant
// faktor mot en kvadratisk kostnad: taket nås igen vid ~650 kort, och en
// GitHub-runner har 4 vCPU (denna maskin har 16 — en lokal parallell-mätning
// överskattar därför vinsten i CI systematiskt). Dessutom laddar VARJE process
// hela katalogen, så minnes- och IO-trycket multipliceras med P.
//
// FÖRKASTAT — höj timeout-minutes. Grinden är ~22 min vid 502 kort och växer
// kvadratiskt; ett tak som rymmer den idag spricker igen inom månader. AC2 på
// TASK-238 tillåter takhöjning endast med öppen motivering — och motiveringen
// hade här varit "vi vet att den spricker igen", vilket inte är en motivering.
//
// FÖRKASTAT — läsa ALLT ur task-filerna och hoppa över CLI:t helt. Då tappas
// verktygets ägarskap över metadata och relationer — precis det konventionen
// skyddar — utan att vinna något: `task list --json` kostar 1,68 s.
//
// FÖRKASTAT — invertera parentTaskId över ALLA kataloger (inkl.
// backlog/completed + backlog/archive). CLI:ts eget `Subtasks`-block gör det
// INTE: verifierat 2026-08-17 att TASK-17 listar 6 barn och att det
// completed-lagda TASK-17.6 inte är ett av dem. En bredare inversion hade
// alltså ändrat grindens beteende. Dessutom bär backlog/archive/tasks ett
// DEMO-substrat med ett eget TASK-1 + TASK-1.1 — en kollision med de riktiga
// id:na. Inversionen görs därför över exakt den mängd `task list` returnerar.
//
// Utdata: en rad per kort, pipe-separerad, status SIST (fältet får svälja
// resten av raden på bash-sidan):
//
//     id|tid12|ac_totalt|ac_obockat|dod_obockat|barn_ids|labels|status
//
// Exit 0 = fakta på stdout. Exit 2 = anropsfel (samma kontrakt som grinden).

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CLI = process.env.BACKLOG_CMD || 'node_modules/.bin/backlog';
const TASKS_DIR = process.env.BACKLOG_TASKS_DIR || 'backlog/tasks';
// Antal kort som korsvalideras mot CLI:t per körning. 0 stänger AV
// korsvalideringen — tillåtet, men då är parsningen obevakad, så defaulten är
// aldrig 0.
const STICKPROV = Number.parseInt(process.env.BACKLOG_KORSVALIDERING_ANTAL ?? '5', 10);

function fel(...rader) {
  for (const r of rader) console.error(r);
  process.exit(2);
}

function kliAnrop(args) {
  const r = spawnSync(CLI, args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (r.error) fel(`❌ kunde inte köra ${CLI}: ${r.error.message}`);
  if (r.status !== 0) fel(`❌ ${CLI} ${args.join(' ')} gav exitkod ${r.status}`, r.stderr || '');
  try {
    return JSON.parse(r.stdout);
  } catch (e) {
    fel(`❌ ${CLI} ${args.join(' ')} gav inte giltig JSON: ${e.message}`);
  }
}

// ── 1. CLI:t, ETT anrop — auktoritativt för metadata och relationer ──────────
const lista = kliAnrop(['task', 'list', '--json']);
const kort = lista?.tasks;
if (!Array.isArray(kort) || kort.length === 0) {
  fel(
    '❌ noll kort hittades — CLI:t svarade inte som väntat',
    "   Fail-closed: en tom lista är ett anropsfel, aldrig 'allt är bra'.",
  );
}

// Förälder→barn genom INVERSION av parentTaskId, över exakt den mängd CLI:t
// returnerade (se FÖRKASTAT-blocket om varför inte bredare).
const barnTill = new Map();
for (const t of kort) {
  if (!t.parentTaskId) continue;
  if (!barnTill.has(t.parentTaskId)) barnTill.set(t.parentTaskId, []);
  barnTill.get(t.parentTaskId).push(t.id);
}

// ── 2. Task-filerna, ETT svep — AC/DoD-kryssrutornas antal ───────────────────
//
// Fail-closed i tre riktningar: filen saknas, katalogen saknas, eller ett kort
// bär en AC-/DoD-RUBRIK utan motsvarande maskin-markör (= formatdrift, exakt
// den klass som annars gör grinden tyst grön).
if (!fs.existsSync(TASKS_DIR)) fel(`❌ uppgiftskatalogen ${TASKS_DIR} hittas inte`);

function raknaBlock(text, startMarkor, slutMarkor, rubrik, id) {
  const s = text.indexOf(startMarkor);
  const e = text.indexOf(slutMarkor);
  if (s === -1 || e === -1 || e < s) {
    if (new RegExp(`^${rubrik}\\s*$`, 'm').test(text)) {
      fel(
        `❌ ${id} bär rubriken '${rubrik}' men saknar markörparet ${startMarkor}…${slutMarkor}`,
        '   Fail-closed: verktygets filformat har troligen ändrats. Grinden vägrar',
        '   räkna kryssrutor den inte kan avgränsa — en gissning här ger tyst grönt.',
      );
    }
    return { totalt: 0, obockat: 0 };
  }
  const rader = text.slice(s + startMarkor.length, e).split('\n');
  let totalt = 0;
  let obockat = 0;
  for (const r of rader) {
    if (/^- \[[ x]\] /.test(r)) totalt++;
    if (/^- \[ \] /.test(r)) obockat++;
  }
  return { totalt, obockat };
}

const faktaPerId = new Map();
for (const f of fs.readdirSync(TASKS_DIR)) {
  if (!f.endsWith('.md')) continue;
  const text = fs.readFileSync(path.join(TASKS_DIR, f), 'utf8');
  const m = text.match(/^id:\s*(\S+)\s*$/m);
  if (!m) fel(`❌ ${f} saknar 'id:' i frontmatter — filformatet är inte det väntade`);
  const id = m[1];
  const ac = raknaBlock(text, '<!-- AC:BEGIN -->', '<!-- AC:END -->', '## Acceptance Criteria', id);
  const dod = raknaBlock(
    text,
    '<!-- DOD:BEGIN -->',
    '<!-- DOD:END -->',
    '## Definition of Done',
    id,
  );
  faktaPerId.set(id, { ac, dod });
}

// Mängderna MÅSTE vara identiska, i BÅDA riktningar. Divergerar de läser de två
// källorna olika kort, och varje rad grinden sedan skriver är osann.
const saknasIFil = kort.filter((t) => !faktaPerId.has(t.id)).map((t) => t.id);
if (saknasIFil.length > 0) {
  fel(
    `❌ ${saknasIFil.length} kort ur CLI:ts listning saknar fil i ${TASKS_DIR}: ${saknasIFil.slice(0, 5).join(', ')}`,
    '   Fail-closed: AC/DoD kan inte läsas för dem, och ett oläst kort får',
    '   aldrig tyst räknas som prövat.',
  );
}

// Den OMVÄNDA riktningen bär den fail-safe som förr låg i "barn i Subtasks
// saknas i listningen". Under den gamla per-kort-formen kunde ett barn nämnas i
// förälderns Subtasks-block utan att finnas i listningen, och grinden höll då
// TYST om föräldern. I bulk-formen härleds barnen ur samma listning, så det
// tillståndet är inte representerbart — men den underliggande FARAN finns kvar:
// ett kort som ligger på disk utan att synas i listningen är ett kort vars
// tillstånd grinden inte känner, och en förälder får aldrig bedömas "alla barn
// klara" mot en ofullständig bild.
//
// Formen är avsiktligt HÖGLJUDD där den förra var tyst: exit 2 (anropsfel)
// i stället för att bara utelämna föräldern ur bedömningen. En tyst fail-safe
// kan inte skiljas från att allt är bra, och det var precis TASK-90:s defekt.
const iListan = new Set(kort.map((t) => t.id));
const saknasIListan = [...faktaPerId.keys()].filter((id) => !iListan.has(id));
if (saknasIListan.length > 0) {
  fel(
    `❌ ${saknasIListan.length} kort finns i ${TASKS_DIR} men saknas i CLI:ts listning: ${saknasIListan.slice(0, 5).join(', ')}`,
    '   Fail-closed: deras tillstånd är okänt för grinden, och en förälder får',
    "   aldrig bedömas 'alla barn klara' mot en ofullständig bild.",
  );
}

// ── 3. Korsvalidering mot CLI:t — mekanisk bevakning av filparsningen ────────
//
// Deterministiskt urval (jämnt spritt över den ID-sorterade listan), aldrig
// slumpat: en grind ska ge samma svar på samma träd. Spridningen gör att
// urvalet över tid täcker olika kort-former utan att kosta mer än N anrop.
if (STICKPROV > 0) {
  const sorterade = [...kort].map((t) => t.id).sort();
  const n = Math.min(STICKPROV, sorterade.length);
  const urval = [];
  for (let i = 0; i < n; i++) {
    urval.push(sorterade[Math.floor((i * sorterade.length) / n)]);
  }
  for (const id of urval) {
    const svar = kliAnrop(['task', id.replace(/^TASK-/, ''), '--json']);
    const t = svar?.task;
    if (!t) fel(`❌ korsvalidering: CLI:t gav inget task-objekt för ${id}`);
    const kliAc = Array.isArray(t.acceptanceCriteria) ? t.acceptanceCriteria : [];
    const kliDod = Array.isArray(t.definitionOfDone) ? t.definitionOfDone : [];
    const kliAcObockat = kliAc.filter((x) => x && x.checked === false).length;
    const kliDodObockat = kliDod.filter((x) => x && x.checked === false).length;
    const min = faktaPerId.get(id);
    if (
      kliAc.length !== min.ac.totalt ||
      kliAcObockat !== min.ac.obockat ||
      kliDod.length !== min.dod.totalt ||
      kliDodObockat !== min.dod.obockat
    ) {
      fel(
        `❌ korsvalidering FÄLLDE för ${id} — filparsningen och CLI:t är oense`,
        `   CLI:  AC ${kliAc.length} varav ${kliAcObockat} obockade · DoD ${kliDod.length} varav ${kliDodObockat} obockade`,
        `   fil:  AC ${min.ac.totalt} varav ${min.ac.obockat} obockade · DoD ${min.dod.totalt} varav ${min.dod.obockat} obockade`,
        '   Fail-closed: verktygets filformat har ändrats. Laga parsningen i',
        '   scripts/backlog-kortfakta.mjs — grinden får inte gissa AC/DoD.',
      );
    }
  }
}

// ── 4. Utdata ────────────────────────────────────────────────────────────────
//
// `|` är fältseparator. Dyker den upp i ett värde blir varje efterföljande fält
// felläst, så det är ett anropsfel — aldrig något att tyst städa bort.
function rent(varde, id, falt) {
  const s = String(varde ?? '');
  if (s.includes('|')) fel(`❌ ${id}: fältet ${falt} innehåller '|' som är fältseparator: ${s}`);
  return s;
}

const ut = [];
for (const t of kort) {
  const min = faktaPerId.get(t.id);
  // `Updated:` är kortets senaste ändring; saknas den har kortet aldrig
  // redigerats efter skapandet och `Created:` ÄR den tidpunkten (samma
  // härledning som grindens egen karens-kommentar).
  const tid = (t.updatedAt || t.createdAt || '').replace(/\D/g, '').slice(0, 12);
  const barn = (barnTill.get(t.id) || []).map((b) => b.replace(/^TASK-/, '')).join(',');
  ut.push(
    [
      rent(t.id.replace(/^TASK-/, ''), t.id, 'id'),
      tid,
      min.ac.totalt,
      min.ac.obockat,
      min.dod.obockat,
      barn,
      rent((t.labels || []).join(','), t.id, 'labels'),
      rent(t.status, t.id, 'status'),
    ].join('|'),
  );
}
process.stdout.write(`${ut.join('\n')}\n`);
