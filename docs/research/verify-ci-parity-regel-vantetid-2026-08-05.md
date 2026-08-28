---
owner: marcus803
updated: 2026-08-05
review_by: 2027-02-05
status: draft
---

# Väntetid per snitt-session under den föreslagna paritets-regeln — en mätning, inte en princip-diskussion

> **Proveniens:** avgränsat mätpass 2026-08-05, beställt av orkestreraren för
> att svara på Marcus egen fråga verbatim: *"OM vi skriver in dessa regler,
> vad skulle det innebära för en snitt session för mig i 'väntetid'?"* Kört i
> egen worktree (`.claude/worktrees/agent-a7b2059457c23bd3f`), byggd ovanpå
> `origin/main` vid `031124a9` (Session 98, samma dag som `TASK-142` —
> diff-klassningen i `scripts/verify-ci-parity.mjs` — landade, PR `#752`).
> Detta pass tillför ingen ny mekanism och rör ingen kod — det är en mätning
> plus ett beslutsunderlag.

## Svaret, i minuter

**Regeln kostar ungefär 96–110 minuter lokal verifiering per snitt-session,
sekventiellt tillämpad** (median 10 landade PR:er/session, ~34 % docs-only /
~66 % kod). Det är **mer** än vad som faktiskt gjordes i dagens session för
en jämförbar uppsättning PR:er (45–57 min uppmätt) och **klart mer** än
alternativet att inte köra något lokalt (0 min, se § Vad väntetiden köper för
vad det kostar i utebliven skyddseffekt).

| Scenario | Minuter/snitt-session (median 10 PR:er) |
|---|---|
| **Golv** — ingen lokal verifiering | **0 min** lokalt (kostnaden flyttas till röda PR:er, se nedan) |
| **Föreslagen regel** (docs→`check:docs`, kod→`verify:ci-parity`) | **96–110 min**, beroende på vilken docs/kod-fördelning som läggs till grund (se § Sessionsprofilen) |
| **Tak** — full paritet på varje landning, även docs | **108–119 min** |
| **Dagens session (S98), faktiskt** | **45–57 min** uppmätt (45,2 min bekräftat golv + ouppskattat antal `check:docs`-körningar) |
| **Dagens session, om regeln hade följts mekaniskt** | **≈133 min** — beräknat på samma 12 PR:er S98 faktiskt landade |

**Den skarpaste enskilda siffran i passet:** för dagens faktiska
PR-uppsättning hade regeln kostat **~2,3–2,9× mer** än vad som faktiskt
gjordes. Se § Dagens session.

**Detta gäller SEKVENTIELL tillämpning** — en session där PR:er verifieras
och landas en i taget, vilket är den vanliga formen för en solo-session (och
för hela mätfönstret S79–S91 nedan). I en **parallell batch-session** (flera
bygg-agenter i egna worktrees samtidigt, t.ex. S86:s 17-agents-natt) är
väggklockan till Marcus bunden av den **långsammaste samtidiga agenten**, inte
av summan — regelns marginalkostnad per PARALLELL session kan därför ligga
närmare en enda extra körning (~5,5–15 min) snarare än det additiva talet
ovan. Detta är en strukturell skillnad, inte en gissning — se
§ Sekventiellt vs. parallellt.

## Metod — sammanfattning

1. **Sessionsprofil:** mekanisk klassning (docs-only vs. kod) av varje
   merge-PR i ett urval av 11 BUILD-LOG-sessioner, med EXAKT samma D0-glob-
   logik som `scripts/verify-ci-parity.mjs` använder för sin egen
   diff-klassning (`TASK-142`) — importerad direkt ur skriptet, aldrig
   återimplementerad.
2. **Tidsdata:** verktygens egna uppmätta väggklocka-tider, källmärkta mot
   primärkälla (`tasks/sessions/archive/2026-08/2026-08-05-session-98.md`), inte mot
   uppdragstexten allena.
3. **Röd-PR-kostnad:** `scripts/ci-metrics.mjs` (redan i repot, redan byggt
   för detta) återanvänd, inte omätt för hand.

## Premiss-pass (ADR-086) — utfört före mätningen

| Premiss i uppdraget | Prövad mot | Utfall |
|---|---|---|
| `main` vid `031124a9` | `git log -1 --oneline` i worktreen, `git fetch` + jämförelse mot `origin/main` | **BEKRÄFTAD**, ingen divergens — worktreen skapades ur exakt denna commit, `main`/`origin/main` identiska |
| `check:docs` 172 s · `verify:ci-parity` docs-only 332,7 s · kod-diff 910,7 s · CI parallell 401 s | `tasks/sessions/archive/2026-08/2026-08-05-session-98.md:190–195` (skriven vid Del 2:s stängning, samma dag) + `docs/research/ci-parity-lokal-trigger-branschmonster-2026-08-05.md` (oberoende research-pass samma dag, citerar samma 401 s-CI-mätning via `gh run view 30983879673`) | **BEKRÄFTAD mot skriftlig primärkälla** för 332,7/910,7/401 s (ordagrant identiska tal på två oberoende ställen). `check:docs`-talet 172 s saknade en skriftlig primärkälla i repot — **jag körde om det själv** (se nedan): 180 s, samma maskin, samma dag. Skillnaden (4,7 %) ligger inom normal last-variation (samma princip som `metrics:flake`-riggens loadavg-disciplin) och räknas som korroborerande, inte motsägande. |
| "Jag körde `verify:ci-parity` fyra gånger (641,0 + 824,8 + 910,7 + 332,7 s)" | Samma primärkälla, tabellen på rad 190–195 | **BEKRÄFTAD** — exakt samma fyra tal står i sessionsdoket, i samma ordning (två "Före klassningen"-körningar, en docs-only-efter, en kod-diff-efter). |
| "`check:docs` flera gånger" (utan exakt antal) | Sökt i `tasks/sessions/archive/2026-08/2026-08-05-session-98.md` (204 rader, hela filen läst) | **INTE BELAGD** — ingen körlogg med exakt antal hittades. Behandlas som HYPOTES och redovisas som ett spann, inte ett tal, i § Dagens session. |
| `scripts/verify-ci-parity.mjs` bär D0-glob-logiken CI:s `changed`-jobb använder (`should_skip_tests`) | Läst filen i sin helhet (906 rader) — `parseraD0Glob` + `klassificeraDiff`, exporterade, härleder mönstret ur `ci.yml`:s `changed-files`-steg vid varje körning | **BEKRÄFTAD** — importerade funktionerna direkt (ingen omimplementering) för den historiska klassningen nedan |
| `scripts/ci-metrics.mjs` har PR-ledtid, röd-orsak, flaky-data redan byggt | Körde `npm run metrics:ci -- --limit 100 --json` | **BEKRÄFTAD** — se § Vad väntetiden köper |
| `docs/BUILD-LOG.md` bär commit-range per session | Läst samtliga 15 senaste sessions-poster (rad 2868–3166) | **BEKRÄFTAD, men med en viktig nyans** — se § Sessionsprofilen, "En delad upptäckt" |

**Divergens funnen och öppet bokförd (inte i uppdragets tal, utan i en
outtalad förutsättning):** uppdraget bad om "de 10–15 senaste sessionerna"
och antog implicit att en BUILD-LOG-session är en väl avgränsad enhet en PR
entydigt kan tillskrivas. Det höll för S79–S91. Det höll **inte** för S92 och
framåt — se nedan.

## Sessionsprofilen — empiriskt, mekaniskt klassat

### Urval och metod

**Urval:** de elva mest nyligen skrivna BUILD-LOG-sessionsposterna som är
**mekaniskt rent attribuerbara** — S79, S80, S81, S83+S84 (kombinerad, se
nedan), S85, S86, S87, S88, S89, S90, S91. Alla ligger inom den PR-flödes-
mekaniserade eran (`ADR-076` landade vid S77) och representerar därmed
**dagens landningsdisciplin**, inte det äldre direktpush-mönstret.

**S83 och S84 kombinerade till en post:** båda dokumenterar sig själva som
**parallella sessioner samma dag** (S84: *"parallell session ... i egen
worktree bredvid aktiva S83"*), med intilliggande födelse-PR:er (`#149` och
`#150`). Att särskilja deras PR:er skulle kräva att läsa varje enskild PR:s
innehåll — proportionerligt fel för en minutnivå-skattning. Kombinerat blir
attributionen korrekt (ingen PR faller mellan stolarna), bara den interna
fördelningen mellan de två är oupplöst.

**Metod för att hitta varje session-instans gräns:** för varje sessions
"dok-födelse"-commit (citerad i BUILD-LOG) härledde jag den omslutande
merge-PR:en mekaniskt (`git log --merges --first-parent main
--ancestry-path <hash>..main --oneline --reverse`, första träffen). Detta gav
ett PR-nummer per sessionsstart, verifierat mot BUILD-LOG:s egna citerade
PR-nummer där de fanns (de matchade i samtliga fall jag kunde kontrollera).
Session-bucketen är sedan **gapless**: `[födelse-PR för session N,
födelse-PR för session N+1)`.

**Klassning per PR:** för varje merge-PR i intervallet hämtades den
faktiska filändringslistan (`git diff --name-only <bas-förälder>
<PR-huvud-förälder>`) och klassades med `klassificeraDiff(filer,
d0Monster)` — importerad direkt ur `scripts/verify-ci-parity.mjs`, samma
funktion CI:s egen paritetsgrind litar på. D0-globen härleddes ur **dagens**
`ci.yml` (29 mönster), inte ur ci.yml:s historiska version vid varje PR:s
landningstillfälle — se § Vad jag inte kunde belägga för vad det betyder.

### En delad upptäckt — varför sessionsprofilen stannar vid S91

Samma mekaniska metod applicerad på S94, S95 och S97 gav uppenbart FEL svar
vid en stickprovskontroll: S95:s egen text redovisar explicit **tio** PR:er
(`#601`–`#610`, *"Alla tio PR:er ... MERGED git-verifierade"*), men
gapless-bucketen `[601, 700)` innehöll **91** merge-PR:er. Grävde jag i
branch-namnen framgick varför: `#600` är `docs/s93-fodelse`, `#612` är
`docs/s96-fodelse`, och därefter växlar branch-taggarna mellan `s93-`,
`s95-`, `s96-` PR efter PR ända fram till `#699`. **S92, S93 och S96 körde
som egna, parallella sessioner i samma fönster** — en driftsform som inte
fanns i S79–S91-eran (där S83/S84 är det enda kända undantaget, och det är
hanterat ovan).

Konsekvensen: mekanisk PR→session-attribution för S92 och framåt kräver att
läsa varje enskild PR:s branch-namn eller innehåll för att avgöra ägande —
disproportionerligt för en minutnivå-skattning. **S94/S95/S97 är därför
UTESLUTNA ur sessionsprofil-tabellen**, inte för att de är mindre relevanta,
utan för att en gapless PR-nummer-bucket där skulle ge falsk precision (ett
konkret, uppmätt 9×-fel på S95 bevisar det, inte bara en gissning).

**Robusthetskontroll som räddar analysen ändå:** trots att jag inte kan dela
upp S92–S97-fönstret per namngiven session, KAN jag räkna hela fönstret
(PR `#111`–`#767`, 617 merge-PR:er, hela perioden S79–idag) i aggregat. Den
aggregerade docs/kod-kvoten där är **34,2 % docs-only / 65,8 % kod** —
praktiskt taget identisk med den rena S79–S91-delmängdens kvot inklusive S91
(**33,9 % / 66,1 %**). Kvoten är alltså stabil oavsett vilket fönster den
mäts på, vilket ger förtroende för den siffran specifikt, även om
per-session-fördelningen för den senare eran förblir oupplöst.

### Tabellen (S79–S91, mekaniskt klassad)

| Session | PR:er totalt | Docs-only | Kod | % docs |
|---|---|---|---|---|
| S79 | 10 | 2 | 8 | 20 % |
| S80 | 6 | 2 | 4 | 33 % |
| S81 | 16 | 11 | 5 | 69 % |
| S83+S84 (parallella, samma dag) | 19 | 11 | 8 | 58 % |
| S85 | 4 | 3 | 1 | 75 % |
| S86 | 19 | 2 | 17 | 11 % |
| S87 | 6 | 4 | 2 | 67 % |
| S88 | 10 | 6 | 4 | 60 % |
| S89 | 9 | 4 | 5 | 44 % |
| S90 | 11 | 5 | 6 | 45 % |
| **S91** (utstickare — se nedan) | **335** | **101** | **234** | 30 % |

**S91 är sessionsmodellens längsta** (BUILD-LOGs egen formulering): 22
pauser/23 resumer över en vecka (2026-07-26 → 2026-08-02), task-53→124 (71+
kort), ADR-079–088 (10 ADR:er). Den bär **3× fler PR:er än de andra tio
sessionerna tillsammans**. Stickprovskontroll av branch-namnen i S91:s
fönster (`#237`–`#586`) gav 2 av 335 PR:er med annan sessions-tagg
(`#285 docs/farg-atlas`, `#322 docs/s92-todo-kadensrad`) — under 1 %,
konsekvent med att S92 (S91:s enda kända samtida) var **pausad** under
merparten av fönstret, precis som BUILD-LOG själv säger.

**Statistik:**

- **Exklusive S91** (n=10, "normal" session): summa 110 PR:er, medel **11,0
  PR:er/session**, docs **45,5 %** / kod **54,5 %**.
- **Inklusive S91** (n=11): medel **40,5 PR:er/session** — kraftigt skevt av
  en enda utstickare, missvisande som "typisk".
- **Median (n=11, robust mot utstickaren):** **10 PR:er/session**, oförändrad
  med eller utan S91 i urvalet — det är skälet till att medianen, inte
  medelvärdet, används som ankare nedan.
- **Docs/kod-kvot, stort n (hela fönstret, 617 PR:er):** 34,2 % / 65,8 % —
  används som primärt scenario (mer konservativt: fler kod-PR:er, dyrare
  scenario) med den mindre normal-session-delmängdens 45,5 %/54,5 % som
  sekundärt spann.

## Tre scenarier (per snitt-session, median 10 PR:er)

Beräkning: `docs-PR:er × docs-kostnad + kod-PR:er × kod-kostnad`, med
10 PR:er fördelade enligt två docs/kod-kvoter (stort n / normal-session-n)
för att visa känsligheten.

### 1 — Föreslagen regel (`check:docs` för docs-only, `verify:ci-parity` full för kod)

| Kvot | Docs-PR:er | Kod-PR:er | Räkning | Minuter |
|---|---|---|---|---|
| 34 % / 66 % (stort n) | 3,4 | 6,6 | 3,4×172 s + 6,6×910,7 s = 6595,4 s | **109,9 min** |
| 45,5 % / 54,5 % (normal-session-n) | 4,55 | 5,45 | 4,55×172 s + 5,45×910,7 s = 5745,9 s | **95,8 min** |

**Spann: ~96–110 minuter/session.**

### 2 — Golv (ingen lokal verifiering alls)

**0 minuter lokalt.** Kostnaden flyttas helt till CI + eventuella
fix-cykler — kvantifierat i § Vad väntetiden köper.

### 3 — Tak (full paritet på varje landning, docs inräknat)

`verify:ci-parity` själv (med sin egen `TASK-142`-scope-logik) för VARJE
PR, även docs-only (332,7 s, inte 172 s — check:docs används aldrig):

| Kvot | Räkning | Minuter |
|---|---|---|
| 34 % / 66 % | 3,4×332,7 s + 6,6×910,7 s = 7141,8 s | **119,0 min** |
| 45,5 % / 54,5 % | 4,55×332,7 s + 5,45×910,7 s = 6477,1 s | **108,0 min** |

**Iakttagelse:** skillnaden mellan regel och tak är liten (~9–12 min) —
den stora kostnaden i BÅDA scenarierna sitter i kod-grenen (910,7 s/PR),
inte i hur docs-grenen hanteras. Se § Rekommendation för vad det betyder.

## Sekventiellt vs. parallellt — en nödvändig kvalificering

Alla tre scenarier ovan antar **sekventiell** tillämpning: varje PR
verifieras och landas i tur och ordning, vilket är den form S79–S91-urvalet
faktiskt uppvisar (i huvudsak solo-drivna eller små sessioner). Repot har
dock en dokumenterad **parallell batch-form** (`/work-batch`,
BYGG/SVANS-splitten) där flera bygg-agenter arbetar i egna worktrees
samtidigt — S86 är precedensen: 17 agenter, ~6,7 h väggklocka för 6 kort.

I den formen bär **varje agent sin egen lokala verifiering inuti sin egen
tur**, parallellt med de andra. Väggklockan Marcus faktiskt väntar (om han
väntar alls — arbetsformens uttalade princip är att han inte ska behöva)
bestäms av den **långsammaste** samtidiga agentens totala turtid, inte av
summan över alla agenter. En regel som lägger ~15 min extra
verifieringstid i VARJE agents tur lägger därför ~15 min på batchens
kritiska väg — inte 15 min × antal agenter. Detta är strukturellt, inte
gissat: det följer direkt av hur `/work-batch` och BYGG/SVANS-splitten redan
är byggda (se `CLAUDE.md` § Landning, § BYGG/SVANS).

**Konsekvens:** scenariernas 96–119 min är en rimlig, konservativ skattning
för en SOLO-driven session (vilket hela S79–S91-mätunderlaget faktiskt
representerar). För en parallell batch-session är den sanna marginalkostnaden
sannolikt lägre än det additiva talet — men **hur mycket** lägre är inte mätt
i detta pass (se § Vad jag inte kunde belägga).

## Dagens session (S98) — skarp jämförelse

### Vad som faktiskt gjordes

Källa: `tasks/sessions/archive/2026-08/2026-08-05-session-98.md` rad 190–195 (skriven av
sessionens eget arbete, samma dag).

| Post | Värde | Källa |
|---|---|---|
| `verify:ci-parity`, 4 körningar | 641,0 + 824,8 + 910,7 + 332,7 s = **2709,2 s = 45,2 min** | bekräftad, primärkälla |
| `check:docs`, "flera" körningar | **ej kvantifierat** i sessionsdoket | HYPOTES — se nedan |

Ingen körlogg med exakt `check:docs`-antal hittades. Ett rimligt spann,
givet en enda körning kostar ~172–180 s (bekräftat ovan): **2–4 körningar ≈
5,7–12,0 min**. Adderat till det bekräftade `verify:ci-parity`-talet:

**Dagens faktiska lokala verifieringskostnad: ~51–57 minuter (45,2 min
bekräftat golv + 5,7–12,0 min uppskattat tillägg).**

### Vad regeln hade kostat för samma PR:er

S98:s egna landade PR:er (`#756`–`#767`, 12 stycken — `#753`/`#754` är
S97:s egen stängningsbatch, branch-taggade `docs/s97-stangning` och
`docs/s97-lessons-skord-...`, inte S98:s; korrigerat bort ur bucketen),
mekaniskt klassade med samma D0-glob:

| Typ | Antal | Kostnad/st | Summa |
|---|---|---|---|
| Docs-only (`#756`,`#759`,`#763`,`#767`) | 4 | 172 s | 688 s |
| Kod (`#757`,`#758`,`#760`,`#761`,`#762`,`#764`,`#765`,`#766`) | 8 | 910,7 s | 7285,6 s |
| **Totalt** | 12 | — | **7973,6 s = 132,9 min** |

### Jämförelsen

**Regeln hade kostat ~133 minuter mot de faktiska ~51–57 minuterna — ett
2,3–2,9× högre pris för samma arbete.** Detta är inte en projektion eller ett
antagande: det är samma 12 PR:er, klassade mekaniskt, prissatta med samma
verktygstider som resten av passet. Skälet till gapet är enkelt och synligt
i tabellen ovan: dagens faktiska praxis körde `verify:ci-parity` **fyra**
gånger totalt (delvis som avsiktliga MÄT-körningar av `TASK-142` självt, inte
en gång per landad PR) — inte en gång per kod-PR, vilket regeln bokstavligen
kräver.

## Vad väntetiden köper

Källa: `npm run metrics:ci -- --limit 100 --json` (`scripts/ci-metrics.mjs`),
kört idag mot detta repos senaste 100 CI-körningar (99 slutförda).

| Mått | Värde |
|---|---|
| Röda körningar | **3 av 99 (3,0 %)** |
| Röd-orsak, per jobb | `Lint + Audit + TypeCheck`: 2 · `Docs link check`: 1 · **`Acceptance`/`Webblasarbeteende`: 0** |
| Bevisat flaky | 0,0 % (0 av 99) |
| Merge-dedup-träffkvot | 100 % (30/30) |
| PR-ledtid push→grönt | median 2,1 min · p95 7,9 min (n=31) |

**Detta fönster är INTE samma fönster som sessionsprofilen ovan** — det är
de 100 senaste CI-arbetsflödeskörningarna (i praktiken ungefär S97–S98:s
volym), inte S79–S91. Det ger en FÄRSK, oberoende skattning av röd-frekvens,
men n=99/3 röda är ett litet underlag — ett enda ytterligare rött utfall
hade dubblerat kvoten.

**Förväntad röd-kostnad per snitt-session:** median 10 PR:er × 3,0 % ≈ **0,3
röda PR:er/session**. Kostnaden per rött utfall, räknat i ren
CI-väggklocka (en misslyckad körning + en ny, lyckad körning, båda parallella
á ~401 s): **~802 s ≈ 13,4 min**, **plus** omätt diagnos-/fixtid (agentens
eller Marcus egen tid att hitta och laga felet — se § Vad jag inte kunde
belägga). Förväntat CI-väggklocka-tillskott av golv-scenariot: **~0,3 ×
13,4 min ≈ 4 min/session** (golv), exklusive fixtid.

**Den viktigaste enskilda iakttagelsen i denna sektion:** samtliga 3
observerade röda utfall i stickprovet föll i de **billiga** jobben
(`Lint + Audit + TypeCheck`, `Docs link check`) — INGET i `Acceptance` eller
`Webblasarbeteende`, de jobb som gör `verify:ci-parity`:s kod-gren dyr
(910,7 s, ~91 % av regel-scenariots totala tid). `Lint + Audit + TypeCheck`
körs redan **obligatoriskt** för varje PR per `CONTRIBUTING.md`:s
fyra-kommando-golv (`npm run typecheck` + `npx @biomejs/biome check .`,
sekunder, redan branschstandard oavsett denna regel) — och `Docs link check`
täcks redan av `check:docs`. **I detta stickprov skulle den redan
obligatoriska, billiga baslinjen plus `check:docs` ha fångat samtliga tre
röda utfall, utan att den dyra Acceptance/Webblasarbeteende-svansen
någonsin behövts.**

## Vad du inte kunde belägga

- **Exakt antal `check:docs`-körningar idag.** Uppdraget säger "flera
  gånger" utan tal; jag hittade ingen körlogg. Redovisat som ett spann
  (2–4 körningar), inte ett enskilt tal — påverkar "dagens faktiska"-summan
  med ±6 minuter.
- **`check:docs` 172 s vs. min egen 180 s-mätning.** Inte en motsägelse (4,7
  % skillnad, samma storleksordning som lastberoende variation
  `metrics:flake`-doktrinen redan förutsäger) — men jag har inte kört en
  interfolierad serie för att fastställa "det sanna" talet. Använde
  uppdragets 172 s för scenarieberäkningarna (konsekvent med de övriga tre
  källmärkta talen), min 180 s som korroborering.
- **Fördelningen mellan S83 och S84 internt.** Kombinerad bucket (19 PR:er,
  11 docs / 8 kod) är korrekt i SUMMA, men vilken av de två parallella
  sessionerna som bidrog vad är oupplöst.
- **S92–S97:s per-session-fördelning.** Fastställt att gapless
  PR-nummer-bucketing FELAR grovt där (9× överräkning på S95, uppmätt, inte
  gissat) — men den korrekta uppdelningen kräver läsning av varje enskild
  PR:s bransch/innehåll, vilket jag inte gjort. Aggregatet (34,2 % docs över
  hela fönstret) är väl underbyggt; per-session-styckningen i den eran är
  det inte.
- **D0-globen applicerad retroaktivt.** Klassningen använder DAGENS `ci.yml`
  mot historiska diffar, inte ci.yml:s version vid varje enskild PR:s
  landningstillfälle. Om D0-globen har ändrats materiellt sedan 2026-07-23
  (t.ex. nya docs-verktygs-configrader) skulle en historisk PR kunna klassas
  annorlunda idag än den hade klassats då. Jag har inte kört `git blame` på
  D0-glob-blocket för att utesluta detta — troligt LITEN effekt (globen är
  redan bred: `**/*.md`, `docs/**`, `tasks/**` plus ett fåtal configfiler)
  men inte verifierat.
- **Diagnos-/fixtiden för en röd PR.** `ci-metrics.mjs` mäter CI:ts egen
  väggklocka, inte hur lång tid en agent eller Marcus faktiskt lägger på att
  hitta och laga orsaken. Detta är sannolikt den STÖRSTA enskilda
  kostnadskomponenten för en röd PR och är helt omätt här — jag har
  medvetet INTE gissat ett tal för den, bara flaggat att den saknas.
  § Vad väntetiden köper:s "golv"-kostnad (~4 min/session) är därför en
  GOLV-skattning i sig, inte en fullständig kostnad.
- **Parallell-batch-formens exakta marginalkostnad.** Strukturargumentet
  (§ Sekventiellt vs. parallellt) är sunt — det följer av hur
  BYGG/SVANS-splitten redan är byggd — men jag har inte mätt en verklig
  batch-sessions faktiska väggklocka-tillägg med och utan regeln. Det är en
  välgrundad kvalitativ slutsats, inte en mätt siffra.
- **Om `Acceptance`/`Webblasarbeteende` verkligen aldrig fångar något.**
  n=99/0 röda i just de jobben är ett litet stickprov över ett kort,
  färskt fönster (grovt S97–S98). Det är INTE bevis att de jobben aldrig
  fångar något över en längre horisont — bara att de inte gjorde det i det
  senaste, mätta fönstret.

## Rekommendation

**Regelns grundstruktur bör behållas, men dess dyra gren bör skalas ner —
inte skrotas.** Tre skäl, i den ordning belägget bär dem:

1. **Golv är inte gratis, men det är billigt jämfört med regeln** i det
   uppmätta fönstret: ~4 min/session förväntad CI-kostnad (exklusive
   omätt fixtid) mot regelns 96–110 min garanterade kostnad. Om fixtiden
   för de 3 observerade röda fallen (alla i billiga jobb, snabbt
   diagnostiserbara) är under ~90 minuter TOTALT för hela S79–S91-fönstret
   — vilket är högst sannolikt givet att ingen av dem var i Acceptance/
   Webblasarbeteende — vinner golv ändå på ren tid.
   Men golv köper NOLL skydd mot framtida röda fall i de dyra jobben, och
   stickprovet är för litet (n=3) för att friskriva den risken helt.

2. **Regelns kod-gren bär ~91 % av dess egen kostnad, och den delen köpte
   noll dokumenterad nytta i mätfönstret.** Samtliga 3 röda utfall låg i
   jobb som REDAN körs obligatoriskt (`typecheck`/`biome`) eller redan täcks av
   `check:docs` (docs link check). Att köra HELA `verify:ci-parity` — med
   Acceptance/Webblasarbeteende, dess dyraste del — för varje kod-PR är att
   betala för en försäkring mot en skadeklass som inte inträffat i det
   senast mätta fönstret.

3. **Dagens skarpa jämförelse (§ Dagens session) visar att ingen — varken
   regeln eller "tak" — faktiskt praktiserades idag.** Det som praktiserades
   var något mitt emellan golv och regel: fyra riktade körningar, inte en
   per landning. Det gav både lägre kostnad (45–57 min mot regelns 133 min
   för samma PR:er) OCH inga kända incidenter denna session.

**Konkret justering, inte avslag:** behåll regelns första axel (docs-only →
`check:docs`, alltid billigt och redan väl motiverat av dokumentationsgrindar
som INTE täcks av `typecheck`/`biome`). Skala ner dess andra axel: kör den
REDAN OBLIGATORISKA baslinjen (`npm run typecheck`, `npx @biomejs/biome
check .`, `npm run build`, sekunder till låg minutnivå) för varje kod-PR som
det egentliga golvet — och reservera FULL `verify:ci-parity` (med
Acceptance/Webblasarbeteende-svansen) för landningar som faktiskt rör de
ytor de jobben testar, en scope-baserad triage i linje med `ci.yml`:s egen
D0/D1-klassningsfilosofi, snarare än en blank "alla kod-diffar"-regel. Detta
är EN rekommendation grundad på ett stickprov om 99 CI-körningar och 3 röda
utfall — inte en stark statistisk grund. Växer röd-frekvensen i en större
mätning, eller flyttar den sig in i Acceptance/Webblasarbeteende, bör
slutsatsen omprövas direkt.

**Vad som INTE talar för att bara skrota regeln helt (golv som permanent
läge):** § Vad väntetiden köper visar att skyddet inte är noll värt — 3
röda utfall på 99 körningar är en verklig, om än billig, kostnad, och
stickprovet är för litet för att friskriva de dyra jobben permanent. Regeln
i sin nuvarande, obeskurna form är dock mätt dyrare än vad den bevisligen
köper i detta fönster.
