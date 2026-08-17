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

## Del 2 — gren-skanningens permanenta form (`TASK-250`)

`TASK-238` löste grindens kvadratik. Gren-skanningen (`check_active_branches`,
`TASK-93`) är en ANNAN axel: den kostar i VARJE CLI-anrop, av varje agent, hela
dygnet. Flaggan skyddar exakt en sak — ID-allokeringen i `task create` — och
allt annat betalar ändå.

**Mätt 2026-08-17** (lugn last, avg 4,68 → 3,23; 43 git-refs varav 24 remote;
tre körningar per punkt):

| anrop | skanning PÅ | skanning AV | faktor |
|---|---|---|---|
| `task list --json` | 7,83 s / 6,61 s | 2,11 s / 1,59 s | ~3,7–4,2× |
| `task view` | 8,94 s / 7,63 s | 2,76 s / 2,10 s | ~3,2–3,6× |

Under fleet-drift är utfallet värre än en multiplikator: `TASK-238`:s grind
betalade 164,60 s i EN körning, och S102:s orkestrator-`task edit` dog mot ett
2-minuterstak medan en parallell agents anrop malde. En `task edit` mättes till
16,00 s även under lugn last.

### Lösningsrymden prövad mot mätning

- **(a) `check_active_branches` av permanent + annan kollisionsvakt** —
  FÖRKASTAD. Stänger av skyddet även för `create`, vilket `TASK-250` AC3
  uttryckligen förbjuder, och kräver att en ny vakt byggs för ett problem som
  redan har en fungerande lösning.
- **(b) ROOT_CONFIG-mönstret breddat till standard för alla icke-create-anrop**
  — FÖRKASTAD I DEN FORMEN. `backlog.config.yml` i projektroten är en **fast,
  delad** sökväg; två samtidiga anrop i samma träd trampar på varandra.
  Grinden hanterar det genom att vägra köra om filen finns (fail-closed) —
  rätt för en grind, oanvändbart för ett vardagskommando i en fleet.
- **(c) wrapper-skript i `scripts/`** — **VALD**, men implementerad med
  `BACKLOG_CWD`-isolering i stället för rot-fil-mutation.
- **(d) uppströms-issue till backlog.md** — kvarstår öppen, löser inget idag.

### Beslut (del 2)

Numreringen fortsätter § Beslut ovan (beslut 6–8).

1. **Beslut 6 — `scripts/backlog-cli.sh` är den permanenta formen**, exponerad som
   `npm run bl`. Allokerande anrop (`create` någonstans i argumenten) går
   igenom ORÖRDA med full gren-skanning; allt annat körs mot en isolerad
   projektrot — en temporär katalog med egen `backlog.config.yml` och en
   symlänk till repots riktiga `backlog/`, utpekad via CLI:ts `BACKLOG_CWD`.

   Verifierat live 2026-08-17: `config get checkActiveBranches` läser `false`,
   `task list --json` ger alla 502 riktiga kort **byte-identiskt** med ett rakt
   anrop, och en `task edit` skriver igenom symlänken till den riktiga
   kortfilen (prövat mot ett kastbart substrat).

   Formen har **ingen delad muterbar fil**: `backlog/config.yml` rörs aldrig,
   projektroten lämnas ren, och två samtidiga agenter kan inte kollidera.
   `backlog config set` används inte — den är mätt förlustfull vid round-trip.

2. **Beslut 7 — fail-safe-riktningen är utskriven:** träffas `create` som ett VÄRDE
   (`task edit 5 --title create`) går anropet igenom orört. Följden är ett
   långsammare anrop, aldrig ett oskyddat.

3. **Beslut 8 — sökvägarna i utdatan pekas tillbaka på det riktiga trädet.** CLI:t skriver
   ut den sökväg det löste igenom, och isolerings-katalogen är borta när
   anropet returnerat — en läsare som kopierar den får en död sökväg.
   Omskrivningen sker bara när stdout inte är en terminal, så CLI:ts
   interaktiva lägen är orörda; exitkoden fångas separat och returneras
   oförvanskad (`L440`).

### Vad som INTE är mekaniserat, med avsikt

**Adoptionen är en konvention, inte en spärr.** Wrappern finns och är testad,
men inget hindrar ett direktanrop till binären. En `PreToolUse`-hook som
avvisar eller skriver om direktanrop vore möjlig — den berör varje agents
verktygsyta i repot och är därför ett Marcus-beslut, inte något en bygg-agent
inför på eget bevåg. Bokförd öppet här i stället för att smygas in eller
utelämnas.

**Bevakningen som FINNS** är wrapperns egen testsvit
(`scripts/test-backlog-cli.sh`, 16 fall, CI-wirad i `ci.yml`), som prövar i par
att `create` behåller skanningen (`W1`–`W4`), att övriga anrop isoleras
(`W5`–`W8`), att `backlog/config.yml` är byte-identisk efteråt (`W9`), att
projektroten lämnas ren (`W10`), och att exitkoder går igenom oförvanskade
(`W12`–`W13`).
