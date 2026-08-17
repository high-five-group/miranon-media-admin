import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import path from 'node:path';

/**
 * DEV-SERVERPORTAR FÖR DE FIXTURBUNDNA TESTKLASSERNA (TASK-251).
 *
 * PROBLEMET, MÄTT (S102, 2026-08-17, 241.3-bygget): klassernas portar var
 * checkade in som literaler (a11y 5199, visual 5299, acceptance 5399,
 * webblasarbeteende 5499). Under fleet-drift — flera bygg-agenter i var sin
 * git-worktree på SAMMA maskin — är en fast port en delad resurs utan ägare.
 * En agents acceptance-körning kolliderade med en annan agents vite-server på
 * 5399 (PID-spårad via ps/lsof), och `--strictPort` gjorde bara att den
 * FÖRLORANDE körningen dog. Worktrees isolerar filsystemet; de isolerar inte
 * maskinens nätverksnamnrymd.
 *
 * VARFÖR INTE PORT 0 / EFEMÄR PORT (kortets andra föreslagna väg). Playwrights
 * `webServer` kräver att `url` är KÄND innan servern startas — den pollar
 * adressen tills den svarar. Det finns ingen väg att läsa tillbaka en
 * kernel-allokerad port från den startade processen: begärd i
 * microsoft/playwright#31235 ("dynamic port in webServer", stängd utan
 * implementation) och i #37920 (`webServer` som funktion, likaså stängd).
 * Port 0 skulle dessutom RIVA stale-server-vakten (task-5): en port som per
 * definition aldrig kan vara upptagen kan aldrig heller fälla högt.
 *
 * VALD FORM: WORKTREE-DERIVERAD PORT, `--strictPort` BEVARAD.
 * Porten härleds ur vilken checkout körningen sker i:
 *
 *     port = klassens basport + worktree-index * 1000
 *
 * Egenskaper som gjorde formen vald framför en hash av sökvägen:
 *
 *   1. GARANTERAT UNIK mellan samtidiga worktrees. Index är en position i
 *      repots egen worktree-lista, inte ett hash-värde — två olika checkouts
 *      kan aldrig få samma index vid en given lista. En hash över 27 platser
 *      hade kolliderat oftare än inte vid de tio worktrees som fanns när detta
 *      skrevs (födelsedagsproblemet).
 *   2. HUVUDKATALOGEN BEHÅLLER SINA PORTAR. Git listar den alltid först
 *      ("The main worktree is listed first, followed by each of the linked
 *      worktrees" — git-worktree(1) § list), så den får index 0 och därmed
 *      exakt 5199/5299/5399/5499. Marcus egen körning, CI (som inte har några
 *      linked worktrees alls) och varje befintlig portreferens i docs och
 *      kommentarer förblir sanna. CI-beteendet är bit-identiskt med före.
 *   3. LÄSBAR I FELSÖKNING. Varje port slutar på 199/299/399/499 — ändelsen
 *      säger klassen, tusentalet säger vilken checkout. Ser du 8399 vet du:
 *      acceptance, worktree-index 3. Ingen välkänd tjänst bor på det mönstret
 *      (jfr 5432 postgres, 6379 redis, 8080, 9200), så en deriverad port
 *      krockar inte med maskinens övriga processer.
 *
 * KVARSTÅENDE RACE, ÖPPET BOKFÖRD: index är en position i en lista som ändras
 * när en worktree skapas eller tas bort. Tas en worktree bort medan en körning
 * i en sorterat senare worktree pågår, flyttar den senares index — och en NY
 * körning kan då landa på porten den pågående körningen redan använder.
 * Fönstret är snävt och utfallet är HÖGT: `--strictPort` + `reuseExistingServer:
 * false` ger "Port NNNN is already in use", aldrig en tyst återanvändning.
 * Att laga även det hade krävt en ledighetsprobe, och en probe som hoppar
 * förbi en upptagen port river just den stale-server-vakt som är hela skälet
 * till `--strictPort` (task-5: upptagen port ⇒ hård vägran).
 *
 * INTE DERIVERADE, MEDVETET: e2e (5173) och staging-preview (4173). Båda är
 * PORTLÅSTA av staging-EF:ernas `CORS_ALLOWED_ORIGINS`-allowlist — en deriverad
 * port hade CORS-blockerat appens staging-anrop. Se playwright.config.ts
 * § E2E_DEV_PORT och § PREVIEW_PORT. Fleet-kollision på de två portarna
 * kvarstår därför och kan inte lösas här; den lösningen bor i allowlisten.
 */

/**
 * Klassernas basportar — värdena som gällde för alla checkouts före TASK-251
 * och som huvudkatalogen behåller efter den.
 *
 * manifest-screenshots saknas medvetet: den delar VISUAL-porten med
 * visual-klassen (samma fixturvärld, kör aldrig samtidigt — se
 * playwright.config.ts § isManifestScreenshotsRun).
 */
export const KLASS_BASPORT = {
  a11y: 5199,
  visual: 5299,
  acceptance: 5399,
  webblasarbeteende: 5499,
} as const;

export type Testklass = keyof typeof KLASS_BASPORT;

/** Avståndet mellan två checkouters portblock. */
const WORKTREE_STEG = 1000;

/**
 * Högsta tillåtna worktree-index. 5499 + 26 * 1000 = 31499, vilket håller
 * varje deriverad port under Linux' efemära intervall (32768–60999,
 * `net.ipv4.ip_local_port_range`) och därmed långt under macOS'
 * (49152–65535). Landar en port i det intervallet kan kärnan ha delat ut den
 * till en utgående anslutning, och bindningen fäller sporadiskt.
 */
const MAX_INDEX = 26;

/** Repo-roten för DENNA checkout — filen ligger i tests/support/. */
const REPO_ROT = path.resolve(import.meta.dirname, '..', '..');

/**
 * Normaliserar en sökväg så jämförelsen tål symlänkar (macOS' /tmp → /private/tmp
 * är den vanliga formen). Går realpath inte att ta — sökvägen finns inte längre
 * — faller den tillbaka på en absolut form i stället för att kasta.
 */
function normalisera(sokvag: string): string {
  try {
    return realpathSync(sokvag);
  } catch {
    return path.resolve(sokvag);
  }
}

/**
 * Plockar ut checkout-rötterna ur `git worktree list --porcelain`-utdata i
 * git:s egen ordning — huvudkatalogen först.
 *
 * Porcelain-formatet: "The first attribute of a worktree is always `worktree`"
 * (git-worktree(1) § porcelain format), en post per checkout.
 *
 * Exporterad för att den är den ena halvan av parsningen som ett test kan
 * mata med fejkad utdata; den andra halvan är `harledIndex` nedan.
 */
export function plockaRotter(porcelainUtdata: string): string[] {
  return porcelainUtdata
    .split('\n')
    .filter((rad) => rad.startsWith('worktree '))
    .map((rad) => rad.slice('worktree '.length).trim())
    .filter((rad) => rad.length > 0);
}

/**
 * Den rena kärnan: vilket portblock hör `minRot` till, givet checkout-listan?
 *
 * Ren funktion utan I/O — så att egenskapen som HELA fixen vilar på (två
 * olika checkouts får aldrig samma index) går att bevisa mot en konstruerad
 * lista i stället för mot vad maskinen råkar ha för worktrees just nu.
 *
 * Returnerar 0 för huvudkatalogen, för en tom lista och för en rot som inte
 * står i listan — samtliga lägen där basporten är rätt svar.
 */
export function harledIndex(rotter: readonly string[], minRot: string): number {
  const [huvudkatalog, ...linkade] = rotter;
  if (huvudkatalog === undefined) return 0;
  if (minRot === huvudkatalog) return 0;

  // Sorteras explicit: git:s ordning för de LINKADE checkouterna är inte
  // dokumenterad, bara att huvudkatalogen står först. En egen sortering gör
  // index reproducerbart mellan två körningar av samma lista.
  const plats = [...linkade].sort().indexOf(minRot);
  return plats === -1 ? 0 : plats + 1;
}

let cachatIndex: number | undefined;

/**
 * Denna checkouts plats i repots worktree-lista. 0 för huvudkatalogen och för
 * varje läge där listan inte går att läsa (inget git, ingen checkout, git
 * saknas i PATH) — fallbacken är alltså exakt det beteende som gällde före
 * TASK-251, aldrig ett fel som stoppar en körning som annars hade fungerat.
 */
function worktreeIndex(): number {
  if (cachatIndex !== undefined) return cachatIndex;

  let utdata: string;
  try {
    utdata = execFileSync('git', ['worktree', 'list', '--porcelain'], {
      cwd: REPO_ROT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    cachatIndex = 0;
    return cachatIndex;
  }

  cachatIndex = harledIndex(plockaRotter(utdata).map(normalisera), normalisera(REPO_ROT));
  return cachatIndex;
}

/**
 * Dev-serverporten för en testklass i DENNA checkout.
 *
 * Kastar när worktree-listan är längre än portschemat rymmer — fail-closed.
 * Alternativet vore att vika runt och dela port med en annan checkout, alltså
 * att tyst återinföra precis den kollision funktionen finns för att ta bort.
 */
export function devPort(klass: Testklass): number {
  const index = worktreeIndex();
  if (index > MAX_INDEX) {
    throw new Error(
      `TASK-251: worktree-index ${index} överstiger portschemats tak ${MAX_INDEX} ` +
        `(basport ${KLASS_BASPORT[klass]} + ${index} * ${WORKTREE_STEG} hamnar i det ` +
        'efemära portintervallet). Ta bort oanvända worktrees med `git worktree prune` ' +
        'eller `git worktree remove`, eller höj WORKTREE_STEG-schemat i ' +
        'tests/support/dev-portar.ts.',
    );
  }
  return KLASS_BASPORT[klass] + index * WORKTREE_STEG;
}
