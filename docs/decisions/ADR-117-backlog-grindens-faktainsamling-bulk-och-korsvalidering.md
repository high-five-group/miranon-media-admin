# ADR-117: Backlog-stängningsgrindens fakta-insamling — CLI i bulk, AC/DoD ur filerna, korsvaliderat varje körning

- **Status:** Accepted (TASK-238/TASK-250; mätningarna i § Kontext är gjorda
  2026-08-17 i detta träd och återges med sina kommandon)
- **Datum:** 2026-08-17
- **Rör:** `scripts/check-backlog-closure.sh` ·
  `scripts/backlog-kortfakta.mjs` · `CLAUDE.md` § ISSUE-SUBSTRAT
  (konventionens räckvidd) · `.github/workflows/nightly.yml`
  (`backlog-closure`, `timeout-minutes: 10`)
- **Numreringsnot:** ADR-116 är reserverad av S102:s numreringsrad
  (`tasks/todo.md`, commit `1a46125c`) och var vid mintningen ännu inte
  skriven. Detta kort tar därför 117 i stället för nästa lediga — en
  medveten lucka framför en kollision med en pågående sessions
  reservation.

## Kontext

Backlog-stängningsgrinden (`ADR-073` beslut 5, `TASK-102`-wiringen) gjorde
ett CLI-anrop **per kort**: `backlog task <id> --plain` i en loop över hela
registret. `TASK-238` klassade först körtidsroten som gren-skanningen
(`check_active_branches: true`, `TASK-93`) och lagade den med
ROOT_CONFIG-mekanismen (commit `d5507aac`).

**Den fixen var korrekt men inte tillräcklig, och det är mätt, inte
befarat.** Natten 2026-08-17 kördes nightly på `9f0d14c0`, som har
`d5507aac` som ancestor (`git merge-base --is-ancestor d5507aac 9f0d14c0`
→ 0). Jobbet `Backlog-stängning (natt-grind)` (run `31987759931`, jobb
`95265601312`) **cancellades ändå mot `timeout-minutes: 10`** efter
10m16s (02:22:01→02:32:17). Grindsteget startade 02:22:24 och hann till
`TASK-164` innan `The operation was canceled` — av 502 kort.

Rotorsaken låg alltså kvar under gren-skanningen. **`backlog task view`
kostar linjärt i uppgiftskatalogens storlek** — den laddar hela katalogen
vid varje anrop. Mätt 2026-08-17 (denna maskin, `check_active_branches`
AV, tre körningar per punkt, samma kort varje gång):

| kort i katalogen | `task view`-snitt |
|---|---|
| 10 | 0,471 s |
| 50 | 0,614 s |
| 150 | 0,976 s |
| 300 | 1,524 s |
| 502 | 2,654 s |

Ett svep är därmed n × O(n) = **O(n²)**: 502 × 2,654 s ≈ 1332 s ≈ 22 min,
och talet växer kvadratiskt med backloggen (~41 min vid 700 kort). Jämför
med `backlog task list --json`, som läser **alla 502 korten på 1,68 s** —
alltså mindre än ett enda `task view` (2,33 s). Bulk-vägen är inte en
optimering i marginalen; den är en annan komplexitetsklass.

**CLI:t erbjuder ingen O(n)-väg till AC/DoD.** Prövat fält för fält mot
1.49.1 samma dag: `task list --json` och `search --json` bär bara metadata
(id, status, labels, parentTaskId, tidsstämplar) — inga kryssrutor;
`task view` tar exakt ett id (`error: too many arguments for 'view'.
Expected 1 argument but got 2`); paketet levereras som kompilerad
plattformsbinär (`backlog.md-darwin-x64`) utan programmatiskt API.

Detta möter repots konvention (`CLAUDE.md` § ISSUE-SUBSTRAT): *kort
läses/ändras ENDAST via backlog-CLI:t*. Grindens eget huvud sade dessutom
ordagrant *"Kortens innehåll läses via backlog-CLI:t, aldrig genom att
parsa task-filer"*. Konventionen är mekaniserad för SKRIVNING (pluginets
`deny-backlog-direct-edit.sh` nekar Edit/Write mot `backlog/tasks/`);
läsning är uttryckligen fri och bärs av konvention.

## Beslut

1. **Fakta-insamlingen flyttas till ett bulk-svep**
   (`scripts/backlog-kortfakta.mjs`), som grinden anropar EN gång i stället
   för en gång per kort.

2. **CLI:t förblir auktoritativt för allt det exponerar i bulk** — id,
   status, etiketter, `parentTaskId` (förälder/barn-relationen) och
   tidsstämplarna — via `task list --json`. Detta är en **skärpning**, inte
   en uppluckring: grinden läste förut CLI:ts MÄNSKLIGA `--plain`-render
   med `grep`/`awk`/`tr -cd '0-9'`; nu läses versionerad JSON
   (`schemaVersion`).

3. **Endast AC/DoD-kryssrutornas ANTAL läses ur task-filerna**, avgränsat
   av verktygets egna maskin-markörer `<!-- AC:BEGIN -->…<!-- AC:END -->`
   respektive `<!-- DOD:BEGIN -->…<!-- DOD:END -->`. Detta är den
   deklarerade avvikelsen från konventionen, och den gäller EN datapunkt —
   inte kort-läsning i allmänhet.

4. **Avvikelsen bevakas mekaniskt, inte i prosa** (`ADR-083`): varje
   körning korsvaliderar ett deterministiskt urval kort (default 5,
   `BACKLOG_KORSVALIDERING_ANTAL`) mot `task view --json` och **fäller med
   exit 2 (anropsfel)** vid minsta avvikelse mellan filparsningen och
   CLI:t. CLI:t förblir därmed skiljedomare över parsningen varje natt;
   kostnaden är några sekunder i stället för 22 minuter.

5. **`task create`-vägens gren-skanning rörs ALDRIG.** Kollisionsskyddet
   (`TASK-93`, `check_active_branches: true` i `backlog/config.yml`) är
   orört; ROOT_CONFIG-overriden gäller endast grind-processen och städas
   av dess `trap`.

## Konsekvenser

**Mätt utfall.** Grinden går från cancelled-vid-10-min till en komplett
körning. Den fullständiga körningen redovisar dessutom för första gången
sin egen täckning ända ut — natten hann aldrig dit.

**Formatberoendet är verkligt och accepterat.** Ändrar backlog.md sina
markörer slutar parsningen gälla. Tre saker gör det hanterbart: markörerna
är maskin-skrivna just för att regionerna ska vara maskinåtkomliga;
korsvalideringen fäller samma natt drift uppstår; och en AC-/DoD-RUBRIK
utan motsvarande markörpar är i sig ett fail-closed-fel (exit 2), så
formatdrift kan inte ge tyst grönt.

**Disk-verifierat underlag för parsningen** (2026-08-17, 502 kort): 413
kort bär `## Acceptance Criteria` och exakt 413 bär `AC:BEGIN` (491/491 för
DoD); noll kort bär kryssrutor utanför blocken; kryssruteformerna är exakt
två (`- [x]` 3020 st, `- [ ]` 1055 st); och id-mängden i
`backlog/tasks/*.md` är identisk med `task list --json`:s (502 = 502, noll
i endera riktningen).

**Ekvivalensen är bevisad mot den gamla formen**, inte antagen — gammal och
ny grind körda mot identisk verklig kort-mängd, utdata jämförd radvis
(`TASK-238`:s Implementation Notes bär körningen och dess utfall).

## Förkastade alternativ

**Parallellisera de 502 view-anropen (`xargs -P`).** Köper en konstant
faktor mot en kvadratisk kostnad — taket nås igen vid ~650 kort. En
GitHub-runner har dessutom 4 vCPU medan mätmaskinen har 16, så en lokal
parallell-mätning överskattar vinsten i CI systematiskt. Formen prövades
och **avbröts**: varje process laddar hela katalogen, och `-P 8` drev
maskinens load average till 277 (16 kärnor) — IO- och minnestrycket
multipliceras med P.

**Höj `timeout-minutes`.** Grinden är ~22 min vid 502 kort och växer
kvadratiskt; ett tak som rymmer den idag spricker igen inom månader.
`TASK-238` AC2 tillåter takhöjning endast med öppen motivering — och
motiveringen hade här varit "vi vet att den spricker igen", vilket inte är
en motivering utan en uppskjutning.

**Läs ALLT ur task-filerna och hoppa över CLI:t.** Tappar verktygets
ägarskap över metadata och relationer — precis det konventionen skyddar —
utan att vinna något mätbart: `task list --json` kostar 1,68 s.

**Invertera `parentTaskId` över alla kort-kataloger** (inkl.
`backlog/completed`, `backlog/archive`). CLI:ts eget `Subtasks`-block gör
det inte: verifierat 2026-08-17 att `TASK-17` listar 6 barn och att det
completed-lagda `TASK-17.6` inte är ett av dem. En bredare inversion hade
ändrat grindens beteende. `backlog/archive/tasks` bär dessutom ett
DEMO-substrat med eget `TASK-1` + `TASK-1.1` — en id-kollision med de
riktiga korten.

**Vänta på uppströms-stöd** (AC/DoD i `task list --json`). Rätt på sikt och
kvarstår som öppen väg i `TASK-250`, men löser ingenting i natt.
