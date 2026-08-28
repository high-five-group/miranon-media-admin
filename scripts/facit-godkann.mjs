#!/usr/bin/env node
// scripts/facit-godkann.mjs — stämplar Marcus godkännande i ett facit-manifest.
//
// KANALSEPARATION (ADR-104 § Beslut 2): detta skript ÄR Marcus egen kanal,
// körd via Claude Codes `!`-prefix — kommandot går aldrig genom agentens
// tolkning eller verktygs-loop (code.claude.com/docs/en/interactive-mode,
// citerat i ADR-104 § Kontext: "Doesn't require Claude to interpret or
// approve the command"). Skriptet kan INTE självt skilja anroparen (samma
// binär, samma kommando oavsett vem som kör det) — spärren mot AGENT-anrop
// (direkt, eller via Edit/Write/Bash mot manifestet) är
// scripts/deny-facit-godkand-skrivning.sh, en PreToolUse-hook, inte något i
// DENNA fil. Se ADR-104 § Beslut 2 för hela resonemanget.
//
// Kör (av Marcus, via ! -prefix):
//   npm run facit:godkann -- --pass <bilage-katalognamn> --citat "..."
//   npm run facit:godkann -- --pass <namn> --citat "..." --ersatt
//   npm run facit:godkann -- --pass <namn> --citat "..." \
//     --undantag <yta> --skal "..." --undantag <yta2> --skal "..."
//
// SJÄLVDOKUMENTERANDE (Marcus-tilläggskrav 2026-08-08): körs skriptet UTAN
// argument, eller med --help/-h, skriver det ut en färdig copy/paste-
// exempelrad i !-form + de KÄNDA pass-namnen (kataloger under
// FACIT_BILAGE_ROT som redan bär ett manifest) + undantags-formens
// exempel — exit 0 (det är hjälp, inte ett fel). Skriptet är MARCUS yta,
// inte agentens: han kommer aldrig minnas kommandoformen utantill, så
// no-arg-utskriften är hans PRIMÄRA dokumentation. Ett FAKTISKT
// stämplingsförsök som saknar --pass/--citat förblir en felväg (exit 1) —
// se renderHelp() / § FELVÄGAR nedan för distinktionen.
//
// <bilage-katalognamn> är namnet på underkatalogen till FACIT_BILAGE_ROT
// (.facit-policy.conf) — t.ex. "s93-hallplats-prototyp" för manifestet
// tasks/sessions/bilagor/s93-hallplats-prototyp/facit.json.
//
// Stämplar ENDAST fältet "godkand":
//   { av: "marcus", datum: <ISO-datum, YYYY-MM-DD>, citat: <--citat>,
//     sha: <aktuell main-SHA>, undantag?: [{ yta, skal }] }
// Alla övriga fält i manifestet (prototyp, last, lasning, ytor) lämnas
// ORÖRDA — skriptet läser, ersätter EN nyckel, skriver tillbaka.
//
// GRANULARITET: per manifest/pass (ADR-104 § Beslut 1) — ETT QA-moment =
// ETT kvitto = ETT rivnings-GO. Delgodkännande uttrycks som --undantag
// (ytan namnges + skäl), ALDRIG som ett separat per-yta-fält.
//
// FELVÄGAR (exit 1, se § EXIT nedan för den fullständiga koden):
//   - okänt pass-namn (katalogen eller manifestet finns inte under
//     FACIT_BILAGE_ROT) — listar kända pass i felmeddelandet
//   - fältet "godkand" är REDAN satt (icke-null) utan --ersatt
//   - tomt eller saknat --citat
//   - --pass saknas
//   - --undantag utan en direkt efterföljande --skal (eller tvärtom),
//     eller ett tomt yta-/skäl-värde
//   - manifestet går inte att tolka som JSON, eller är inte ett objekt
//
// SHA: skriptet härleder ur FÄRSK origin/main (TASK-175, 2026-08-10) — en
// `git fetch origin main` följt av `git rev-parse origin/main` i repo-roten.
// Kvittots hela poäng är att dokumentera VAD som granskades (ADR-104 §
// Beslut 4: "SHA dokumenterar"); en lokal main-ref i en orkestrerar-
// checkout kan stå stilla i dagar utan att någon fast-forwardar den, vilket
// stämplade fel träd i S93-stängningen (2026-08-10, se [[L573]] i
// tasks/lessons/vol-07.md). Saknas ett
// origin-remote (t.ex. ett repo utan fjärr) faller härledningen tillbaka
// till lokal `main`, sedan `HEAD` — se resolveMainSha().
//
// CONFIG: .facit-policy.conf (FACIT_BILAGE_ROT, FACIT_MANIFEST_NAMN) — SAMMA
// fil scripts/check-facit.sh redan läser. Ingen ny config-fil: Lesson #6
// (logik universell, värden separerade från logik) gäller lika mycket för
// EN konsument som för flera — värdena ska ändå aldrig hardkodas i två
// skript samtidigt.
//
// BIOME-REN SERIALISERING (EFTERFIX, 2026-08-08 — PR #1024 hand-rättade
// facit.json efter att den FÖRSTA skarpa stämplingen bröt `biome check .`;
// commit 1a920a01). `JSON.stringify(x, null, 2)` expanderar VARJE array till
// flera rader oavsett längd — Biomes formatter (biome.json: `lineWidth: 100`,
// inget JSON-specifikt override, "files.includes" exkluderar inte
// facit-manifesten) kollapsar korta arrayer ("bilder": [...], "kallor":
// [...]) till EN rad. Skillnaden är strukturell, inte kosmetisk: varje
// FRAMTIDA stämpling hade snubblat på exakt samma sätt — friktion i Marcus
// egen kanal, motsatsen till vad kanalseparationen ska vara. Skriptet
// spawnar därför den LOKALA biome-binären (`node_modules/.bin/biome format
// --write`) på manifestet EFTER writeFileSync (se biomeFormatera() +
// anropet i main()), i stället för att hand-matcha Biomes array-brytnings-
// regler i JS. Motiverat: (a) garanterar BYTE-FÖR-BYTE paritet med `biome
// check .` för evigt, oavsett framtida ändringar i biome.json (lineWidth,
// trailingCommas, quoteStyle) — en handmatchad formatterare vore en
// PARALLELL, duplicerad implementation av Biomes regler som måste hållas i
// synk för hand, exakt det mönster repot annanstans river öppet
// (scripts/verify-ci-parity.mjs: "härlett ur ci.yml, inte en fjärde
// handhållen kopia"), (b) biome är redan en HÅRD devDependency (samma
// binär DoD-kvartetten kräver), så den är garanterat närvarande i varje
// miljö där detta skript rimligen körs, (c) kostnaden (en extra
// subprocess-spawn, low-frequency interaktivt Marcus-kommando, inte en
// het kodväg) är försumbar. FELVÄGEN ÄR AVSIKTLIGT ICKE-FATAL: går
// formateringen inte (binären saknas, en behörighetsfråga) skrivs en
// VARNING men skriptet avslutar ändå med exit 0 — den faktiska
// godkännande-handlingen (fältet ÄR korrekt satt på disk) får aldrig
// blockeras av att en sekundär kosmetisk efterbehandling råkar fela.
//
// Källa: docs/decisions/ADR-104-godkannande-mekaniken-kanalseparation.md
//
// Exit: 0 = OK (fältet stämplat) ELLER hjälp visad (no-arg/--help/-h),
//       1 = argument-/pass-/manifestfel vid ett FAKTISKT stämplingsförsök,
//       3 = felkonfigurerad (policyfilen saknas eller är ofullständig) —
//       samma tredelning som scripts/check-facit.sh.

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

// ---------------------------------------------------------------------------
// Policy-läsning — samma .facit-policy.conf som scripts/check-facit.sh käns
// vid. Bash-config, men vi behöver bara två citerade strängvärden: en
// minimal, tolerant rad-parser räcker (ingen bash-körning behövs från node).
// ---------------------------------------------------------------------------
export function lasPolicy(policyPath) {
  const rader = readFileSync(policyPath, 'utf8').split('\n');
  const varden = {};
  for (const rad of rader) {
    const match = rad.match(/^\s*(FACIT_[A-Z_]+)\s*=\s*"([^"]*)"\s*$/);
    if (match) varden[match[1]] = match[2];
  }
  return varden;
}

// ---------------------------------------------------------------------------
// parseArgs — manuell switch-parser, samma konvention som den exporterade
// parseArgs i scripts/seed-review-fixture.mjs (testbar utan process.argv).
// ---------------------------------------------------------------------------
export function parseArgs(argv) {
  const args = { pass: null, citat: null, ersatt: false, undantag: [] };
  let i = 0;
  while (i < argv.length) {
    const flagga = argv[i];
    switch (flagga) {
      case '--pass':
        args.pass = argv[i + 1] ?? null;
        i += 2;
        break;
      case '--citat':
        args.citat = argv[i + 1] ?? null;
        i += 2;
        break;
      case '--ersatt':
        args.ersatt = true;
        i += 1;
        break;
      case '--undantag': {
        const yta = argv[i + 1];
        if (argv[i + 2] !== '--skal') {
          throw new Error(
            `--undantag "${yta ?? ''}" måste följas direkt av --skal "<motivering>" (fick "${argv[i + 2] ?? ''}").`,
          );
        }
        const skal = argv[i + 3];
        if (!yta?.trim()) {
          throw new Error('--undantag kräver ett icke-tomt yta-namn.');
        }
        if (!skal?.trim()) {
          throw new Error(`--undantag "${yta}" --skal måste vara icke-tomt.`);
        }
        args.undantag.push({ yta, skal });
        i += 4;
        break;
      }
      default:
        throw new Error(
          `Okänd flagga: "${flagga}". Giltiga: --pass, --citat, --ersatt, --undantag <yta> --skal "<motivering>".`,
        );
    }
  }
  if (!args.pass?.trim()) {
    throw new Error('--pass <bilage-katalognamn> krävs.');
  }
  if (!args.citat?.trim()) {
    throw new Error('--citat "<Marcus egna ord>" krävs och får inte vara tomt.');
  }
  return args;
}

// ---------------------------------------------------------------------------
// tillampaGodkannande — PUR funktion: tar det inlästa manifestet + de
// tolkade argumenten, returnerar ett NYTT manifest-objekt med "godkand"
// ersatt. Rör ALDRIG disk — det gör bara main(). Testbar utan I/O.
// ---------------------------------------------------------------------------
export function tillampaGodkannande(manifest, args, { sha, nu = new Date() } = {}) {
  if (manifest === null || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('manifestet är inte ett JSON-objekt.');
  }
  const redanSatt = manifest.godkand !== null && manifest.godkand !== undefined;
  if (redanSatt && !args.ersatt) {
    throw new Error(
      'fältet "godkand" är redan satt. Använd --ersatt för att medvetet skriva över ett befintligt godkännande — annars lämnas manifestet orört.',
    );
  }
  if (!sha?.trim()) {
    throw new Error('sha saknas — kunde inte läsa aktuell main-SHA.');
  }

  const nyttGodkand = {
    av: 'marcus',
    datum: nu.toISOString().slice(0, 10),
    citat: args.citat,
    sha,
  };
  if (args.undantag.length > 0) {
    nyttGodkand.undantag = args.undantag.map(({ yta, skal }) => ({ yta, skal }));
  }

  return { ...manifest, godkand: nyttGodkand };
}

// ---------------------------------------------------------------------------
// I/O-hjälpare — samtliga tar repoRoot explicit (default REPO_ROOT) så
// main() går att köra hermetiskt mot en sandlåda i testsviten.
// ---------------------------------------------------------------------------
function resolveManifestPath(policy, pass, repoRoot) {
  const dir = join(repoRoot, policy.FACIT_BILAGE_ROT, pass);
  return join(dir, policy.FACIT_MANIFEST_NAMN);
}

function listaKandaPass(policy, repoRoot) {
  const rot = join(repoRoot, policy.FACIT_BILAGE_ROT);
  if (!existsSync(rot)) return [];
  return readdirSync(rot, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((namn) => existsSync(join(rot, namn, policy.FACIT_MANIFEST_NAMN)))
    .sort();
}

// resolveMainSha — TASK-175: härled ur FÄRSK origin/main, inte en lokal
// main-ref som kan stå stilla i dagar i en orkestrerar-checkout (se §
// SHA i filens huvud för hela bakgrunden). Ett konfigurerat origin-remote
// fetchas alltid före läsning; misslyckas fetchen fälls ett TYDLIGT fel
// (ingen tyst stale-SHA). Saknas origin helt (t.ex. ett repo utan fjärr,
// vår egna testsvits sandlådor) faller härledningen tillbaka till lokal
// `main`, sedan `HEAD` — oförändrat beteende för det läget.
export function resolveMainSha(repoRoot) {
  // stdio: 'pipe' explicit på ALLA tre kanaler — execFileSync ärver annars
  // barnprocessens stderr direkt till terminalen (t.ex. "fatal: not a git
  // repository") ÄVEN när felet fångas i try/catch här, vilket gjorde
  // FALLBACK-vägen (inget origin konfigurerat — den normala testsandlåde-
  // situationen) missvisande högljudd. Felet finns ändå kvar i err.stderr
  // för den tydliga felväg som FAKTISKT ska synas (§ misslyckad fetch nedan).
  const kor = (args) =>
    execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', stdio: 'pipe' }).trim();

  let harOrigin = true;
  try {
    kor(['remote', 'get-url', 'origin']);
  } catch {
    harOrigin = false;
  }

  if (harOrigin) {
    try {
      kor(['fetch', 'origin', 'main', '--quiet']);
    } catch (err) {
      const detalj = err.stderr ? err.stderr.toString('utf8').trim() : err.message;
      throw new Error(
        `kunde inte hämta färsk origin/main (${detalj}) — kör "git fetch" och försök igen.`,
      );
    }
    return kor(['rev-parse', 'origin/main']);
  }

  try {
    return kor(['rev-parse', 'main']);
  } catch {
    return kor(['rev-parse', 'HEAD']);
  }
}

// ---------------------------------------------------------------------------
// biomeFormatera — se § BIOME-REN SERIALISERING i filens huvud för det fulla
// resonemanget bakom att spawna biome i stället för att hand-matcha dess
// array-brytningsregler. ICKE-FATAL: returnerar { ok:false, reason } vid
// fel i stället för att kasta — en misslyckad kosmetisk efterformatering
// får aldrig blockera själva godkännande-handlingen.
// ---------------------------------------------------------------------------
export function biomeFormatera(filePath, repoRoot) {
  const biomeBin = join(repoRoot, 'node_modules', '.bin', 'biome');
  if (!existsSync(biomeBin)) {
    return {
      ok: false,
      reason: `${biomeBin} saknas (node_modules ej installerat? kör 'npm ci').`,
    };
  }
  try {
    execFileSync(biomeBin, ['format', '--write', filePath], { cwd: repoRoot, stdio: 'pipe' });
    return { ok: true };
  } catch (err) {
    const detalj = err.stderr ? err.stderr.toString('utf8').trim() : err.message;
    return { ok: false, reason: detalj };
  }
}

// ---------------------------------------------------------------------------
// renderHelp — skriptet är MARCUS yta, inte agentens (§ Kanalseparation
// ovan): no-arg-utskriften är hans PRIMÄRA dokumentation, inte en
// utvecklar-bekvämlighet. Han kommer aldrig minnas kommandoformen utantill.
// Best-effort mot policyn/bilage-roten — hjälptexten får ALDRIG krascha,
// den kan som VÄRST sakna pass-listan (t.ex. om policyn är trasig).
// ---------------------------------------------------------------------------
export function renderHelp(repoRoot) {
  let exempelPass = '<pass-namn>';
  let kandaRad = '';
  try {
    const policyPath = join(repoRoot, '.facit-policy.conf');
    if (existsSync(policyPath)) {
      const policy = lasPolicy(policyPath);
      if (policy.FACIT_BILAGE_ROT && policy.FACIT_MANIFEST_NAMN) {
        const kanda = listaKandaPass(policy, repoRoot);
        if (kanda.length > 0) {
          exempelPass = kanda[0];
          kandaRad = `Kända pass (kataloger under ${policy.FACIT_BILAGE_ROT}/ med ett ${policy.FACIT_MANIFEST_NAMN}): ${kanda.join(', ')}`;
        } else {
          kandaRad = `Inga kända pass hittades under ${policy.FACIT_BILAGE_ROT}/ ännu.`;
        }
      }
    }
  } catch {
    // Best-effort — se rubriken ovan.
  }

  return [
    'npm run facit:godkann — stämplar Marcus godkännande i ett facit-manifest (ADR-104 § Beslut 2).',
    '',
    'Körs ALLTID av Marcus själv, via !-prefixet (kanalseparation, ADR-104):',
    '',
    `  ! npm run facit:godkann -- --pass ${exempelPass} --citat "Godkänd."`,
    '',
    ...(kandaRad ? [kandaRad, ''] : []),
    'Redan godkänt och vill medvetet skriva över:',
    `  ! npm run facit:godkann -- --pass ${exempelPass} --citat "Ny motivering." --ersatt`,
    '',
    'Delgodkännande — en yta undantagen (ADR-104 § Beslut 1), upprepningsbar:',
    `  ! npm run facit:godkann -- --pass ${exempelPass} --citat "Godkänd med undantag." \\`,
    '      --undantag <yta-namn> --skal "<motivering>"',
    '',
    'Flaggor:',
    '  --pass <namn>        obligatorisk — bilage-katalognamnet under FACIT_BILAGE_ROT',
    '  --citat "..."        obligatorisk — Marcus egna ord, icke-tomt',
    '  --ersatt             valfri — krävs för att skriva över ett REDAN satt godkand-fält',
    '  --undantag <yta> --skal "..."   valfri, upprepningsbar',
    '  --help / -h          visa denna hjälp (exit 0)',
  ].join('\n');
}

export function main(argv = process.argv.slice(2), { repoRoot = REPO_ROOT } = {}) {
  // Ingen argument alls, ELLER --help/-h ANGES: detta är HJÄLP, inte ett
  // fel — exit 0. Skiljs medvetet från ett FAKTISKT stämplingsförsök som
  // råkar sakna --pass/--citat (den vägen går vidare till parseArgs nedan
  // och förblir exit 1) — Marcus-tilläggskrav 2026-08-08.
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    console.log(renderHelp(repoRoot));
    process.exitCode = 0;
    return;
  }

  let args;
  try {
    args = parseArgs(argv);
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exitCode = 1;
    return;
  }

  const policyPath = join(repoRoot, '.facit-policy.conf');
  if (!existsSync(policyPath)) {
    console.error(`❌ ${policyPath} saknas — körs skriptet från fel repo?`);
    process.exitCode = 3;
    return;
  }
  const policy = lasPolicy(policyPath);
  if (!policy.FACIT_BILAGE_ROT || !policy.FACIT_MANIFEST_NAMN) {
    console.error(
      `❌ ${policyPath} saknar FACIT_BILAGE_ROT eller FACIT_MANIFEST_NAMN — felkonfigurerad.`,
    );
    process.exitCode = 3;
    return;
  }

  const manifestPath = resolveManifestPath(policy, args.pass, repoRoot);
  if (!existsSync(manifestPath)) {
    const kanda = listaKandaPass(policy, repoRoot);
    console.error(`❌ Okänt pass "${args.pass}" — ${manifestPath} finns inte.`);
    console.error(
      kanda.length > 0
        ? `   Kända pass: ${kanda.join(', ')}`
        : '   Inga manifest hittades under bilage-roten.',
    );
    process.exitCode = 1;
    return;
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    console.error(`❌ ${manifestPath} går inte att tolka som JSON: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  let sha;
  try {
    sha = resolveMainSha(repoRoot);
  } catch (err) {
    console.error(`❌ Kunde inte läsa main-SHA via git: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  let nyttManifest;
  try {
    nyttManifest = tillampaGodkannande(manifest, args, { sha });
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exitCode = 1;
    return;
  }

  writeFileSync(manifestPath, `${JSON.stringify(nyttManifest, null, 2)}\n`, 'utf8');

  // Se § BIOME-REN SERIALISERING i filens huvud. Icke-fatal med avsikt:
  // stämplingen ÄR redan gjord och korrekt oavsett vad som händer här.
  const formatResultat = biomeFormatera(manifestPath, repoRoot);
  if (!formatResultat.ok) {
    console.warn(
      `⚠️  Kunde inte Biome-formatera ${manifestPath} automatiskt (${formatResultat.reason}). ` +
        `Fältet ÄR stämplat korrekt — men filen kan avvika från "npx @biomejs/biome check ." ` +
        `tills du kör "npx @biomejs/biome format --write '${manifestPath}'" manuellt.`,
    );
  }

  console.log(`✅ ${manifestPath}: "godkand" stämplat (av: marcus, sha: ${sha}).`);
  if (nyttManifest.godkand.undantag) {
    for (const { yta, skal } of nyttManifest.godkand.undantag) {
      console.log(`   undantag: ${yta} — ${skal}`);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
