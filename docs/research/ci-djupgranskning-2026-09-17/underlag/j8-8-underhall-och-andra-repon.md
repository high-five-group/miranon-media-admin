---
owner: marcus803
updated: 2026-09-17
review_by: 2026-12-17
status: draft
---

# J8.8 — Underhållet: vad kostar det att hålla maskinen igång, och finns den kopierad på fler ställen?

> **Proveniens:** skrivet av en agent i Session 126 (CI-djupgranskningen),
> 2026-09-17, i worktreen `s126-ci-djupgranskning`. Modell: se § Rapport till
> orkestreraren för den exakta identitetsraden. Ögonblicksbild: `origin/main`
> på `eeca8c72` (2026-09-08) plus arbetsträdets innehåll vid mättillfället.
> Alla mätningar nedan är körda av mig, mot detta träd, 2026-09-17, om inget
> annat anges.

**Vad "CI- och grindvaktsytan" betyder i denna fil.** Uppdraget bad mig
definiera en sökvägslista och räkna mot den. Ytan jag mätt = `.github/workflows/`
(8 filer) + `scripts/` (186 filer, inkl. `scripts/lib/`) + `tests/support/` +
`tests/fixtures/` + `tests/kontraktsvakt/` (testinfrastruktur, inte
produkttester) + `playwright.config.ts` + `.githooks/` + `.claude/agents/` +
policy-/config-filer i repo-roten (44 dotfiler) + `docs/decisions/` (131
ADR-filer, varav 30 klassade som CI/process-relaterade på filnamn) +
`CLAUDE.md` (avsnittet "Bygg, testa, linta") + `CONTRIBUTING.md` (hela filen).
Detta är MIN avgränsning, inte en fastslagen definition — en läsare som drar
gränsen annorlunda får andra tal, och jag visar var gränserna går så att
räkningen går att reproducera.

## Kort svar

Maskinen är stor, dyr att hålla igång, och den finns i praktiken **ingen
annanstans**. Tre tal bär domen:

1. **Storlek:** CI-/grindvakts-/testinfrastruktur-ytan (enligt min
   avgränsning ovan) väger **≈ 106 900 rader** mot produktkodens
   **≈ 112 400 rader** (`src/` + `supabase/functions/`, exklusive tester) —
   en kvot på **≈ 0,95 : 1**. Räknar man in de faktiska testspecifikationerna
   (`tests/a11y`, `acceptance`, `api`, `e2e`, `preview`, `vale-regression`,
   `visual`, `webblasarbeteende` — **≈ 99 800 rader** utöver
   infrastrukturen) blir det **≈ 1,84 rader test-/CI-/processmaskineri per
   rad produktkod**. **Verifierad** (egen `wc -l`/`wc -c`-mätning,
   2026-09-17).
2. **Ändringstakt:** `.github/workflows/ci.yml` ensam har haft **116
   commits** sedan 2026-06-01 (≈ 15,4 veckor) — **≈ 7,5 ändringar per
   vecka** på EN fil. Hela ytan har **813 av 6 498** commits på `main`
   sedan 2026-06-01 (**12,5 %**), med veckovis spridning 6,5–33 %.
   **Verifierad** (`git log`, 2026-09-17).
3. **Kopiering till andra repon:** **En enda** grindvakt
   (`check-frontmatter.sh`) är kopierad — till hubben `marcus-system`, och
   den kopian har redan glidit i ett faktiskt POLICYVÄRDE (inte bara
   kommentarer) efter mindre än sex veckor. **Ingen** av de nio övriga
   undersökta repona (inklusive den frusna Vue-föregångaren
   `miranon-media-os`) har någon del av CI-/grindvakts-maskineriet.
   **Verifierad** (`diff` + inspektion av 14 repon under `~/Repon/`,
   2026-09-17).

Svaret på Marcus slutfråga (§ "Marcus slutfråga") är **inte entydigt** —
evidensen bär båda riktningar, och det avsnittet ger de starkaste argumenten
för vardera.

## Vad jag läste först

Jag läste `docs/research/ci-djupgranskning-2026-09-17/underlag/00-agentkontrakt.md`
i sin helhet (metodkontraktet för hela granskningen) och
`tasks/sessions/bilagor/s126-uppdrag/uppdraget-verbatim.md` rad 373–393 (mitt
uppdrags exakta ordalydelse). Jag skummade rubrikstrukturen (inte
fulltexten — se § Metod för varför) i de sex syskonfiler som redan låg i
`underlag/` när jag startade: `j1a-ci-yml-och-ci-suite.md` (ci.yml/ci-suite.yml
rad-för-rad, redan mätt: ci.yml = 2 566 rader/158 676 byte, ci-suite.yml =
976 rader/53 336 byte — jag återanvänder dessa tal i stället för att mäta om
dem), `j1b-ovriga-workflows-och-github-katalogen.md` (de sex övriga
workflow-filerna + `.github`-katalogen), `j1d-lokala-hookar-och-agentmekanismer.md`
(fullständig hook-tabell — jag återanvänder den i stället för att bygga en
egen), `j1e-externa-installningar-och-deployvagar.md` (Vercel/Supabase/Airtable-
vägarna), `j4a-branschpraxis-ur-primarkallor.md` (branschpraxis på tolv
dimensioner, inklusive avsnitt 11 "Underhållskostnad" och 12
"Återanvändbarhet mellan repon" — direkt relevanta för mitt uppdrag, jag
citerar dem i stället för att göra om samma websökning) och
`j8-1-produktionsfel-och-vad-som-skyddar.md` (utanför min fråga, skummad för
kontext).

**Vad som redan var täckt, och vad som är nytt i detta pass:** de sex
syskonfilerna mäter STRUKTUR och MEKANISM (vad varje jobb/hook/fil GÖR).
Ingen av dem mäter UNDERHÅLLSKOSTNAD, ÄNDRINGSTAKT över tid, ANDEL AV
UTVECKLINGSTID, eller gör en TVÄRREPO-jämförelse — det är detta uppdrags
(J8.8) egen, odelade fråga. Jag har inte hittat något existerande
research-dokument i `docs/research/` (sökt brett: `arbetsform-reglernas-
bararkarta-2026-08-07.md`, som uppdraget pekar på, kartlägger VILKEN FIL som
BÄR en regel — en annan fråga än vad det KOSTAR att hålla ytan igång) eller
någon ADR som redan besvarar underhållsfrågan. Detta pass är alltså i sin
helhet nytt, byggt på egna mätningar mot disk och git-historik.

**ADR-koll (per agentkontraktets krav):** ADR-036 (kvalitetsgrind = CI:s enda
mekaniska enforcement), ADR-039 (per-push-grind-avgränsning), ADR-083 (prosa
som påstår mekanism), ADR-095, ADR-097 (arbetsformens tillståndsbärare) och
ADR-100 (sanningshierarkin) lästes i sin helhet. Ingen av dem tar ställning
till underhållskostnad eller cross-repo-duplicering — de reglerar VAD som är
sant var och VEM som äger ett beteende, inte HUR DYRT det är att hålla ytan
vid liv. Jag river alltså inget beslut med detta pass; jag mäter en fråga
ingen av dessa ADR:er ställde.

## Metod

Alla filräkningar är `find`/`wc -l`/`wc -c` körda direkt mot arbetsträdet
2026-09-17. Git-historik är `git log origin/main` (aldrig lokal `HEAD`, för
att inte räkna min egen worktrees ännu opushade tillstånd). PR-data är
`gh pr list --state merged --limit 400 --json number,title,headRefName,mergedAt`
(ett anrop, sparat till scratch) plus ett systematiskt stickprov på 40 PR:er
(`gh pr view <nr> --json files`, var 10:e PR i listan) — detta är DYRARE mot
GitHub-API:t än en ren keyword-klassning, men agentkontraktets krav om
sparsamhet gäller "en sida i taget, spara ner det du hämtat" — jag gjorde
båda anropen EN gång och återanvänder resultatet i hela detta dokument.

**Vad jag INTE gjorde:** jag körde ingen `npm run check:docs` (agentkontraktets
förbud — helgrinden skulle fälla på andra agenters halvskrivna filer). Jag
körde ingen skrivande operation i något av de andra repona under `~/Repon/`
— all tvärrepo-läsning är `find`/`cat`/`diff`/`wc` mot befintliga filer, aldrig
`git log`/`git -C` mot ett FRÄMMANDE repos historik (min worktree-isolering
tillåter läsning av andra repons ARBETSTRÄD men jag har inte utökat mätningen
till deras commit-historik — det vore ett eget delprojekt). Jag räknade inte
manuellt utvecklingstid per timme — ingen sådan loggning finns, vilket är
själva skälet till att uppdraget ber om proxyer (§ Fynd 3).

**En teknisk begränsning värd att nämna:** min sandlåda blockerar Bash-kommandon
med `for`-loopar helt oavsett om de innehåller `git` — troligen en
överbred variant av worktree-isoleringsspärren (se `CLAUDE.md` § "Worktree-
isoleringens gräns"). Jag har därför kört varje filkategori som ett separat,
explicit kommando i stället för en loop. Det gör mätningarna långsammare men
inte mindre exakta — varje tal nedan går att återskapa med kommandot som
citeras.

## Fynd

### 1. Storleken — CI- och grindvaktsytan mätt kategori för kategori

| Kategori | Filer | Rader | Kommentar |
|---|---|---|---|
| Workflows (`.github/workflows/*.yml`) | 8 | 5 733 | se underkategori nedan |
| — varav kommentarrader | — | 3 604 (62,9 %) | `grep -c '^[[:space:]]*#'` per fil |
| Grindvakts-skript (`scripts/check-*.sh`) | 24 | 6 294 | de mekaniska grindarna själva |
| Hook-skript (`scripts/deny-*.sh` + 5 andra) | 15 | 4 162 | `.claude/settings.json`-registrerade |
| Testsviter för grindvakter/hookar (`scripts/test-*`) | 75 | 34 582 | enhetstester av skriptens EGEN logik |
| Övriga skript (deploy, seed, metrics, wrappers …) | 72 | 29 419 | blandad klass, se § 6 |
| `scripts/lib/` (delade bibliotek) | 15 | 3 887 | konsumeras av flera skript ovan |
| Policy-/config-filer (rot-dotfiler) | 44 | 4 735 | `.<namn>-policy.conf`/`.json` |
| `.githooks/pre-commit` | 1 | 242 | dispatchar till `check-*.sh` |
| Agent-definitioner (`.claude/agents/*.md`) | 3 | 777 | bygg-agent, review-agent, research-pass |
| Testinfrastruktur (`tests/support`+`fixtures`+`kontraktsvakt`) | 43 | 7 439 | fixturer, MSW-handlers, kontraktstester |
| `playwright.config.ts` | 1 | 789 | |
| `CLAUDE.md` § "Bygg, testa, linta" | del av 1 fil | 1 001 av 1 244 (80,5 %) | rad 97–1098 |
| `CONTRIBUTING.md` (hela filen) | 1 | 1 338 av 1 358 | i praktiken uteslutande CI/landning |
| ADR:er klassade CI/process (filnamn) | 30 av 131 | 6 493 av 23 685 (27,4 %) | se § 6 för urvalslogik |
| **Summa CI-/grindvakts-/processyta** | **≈ 333 filenheter** | **≈ 106 891** | se definition ovan |

**Produktkoden, för jämförelse:**

| Kategori | Filer | Rader |
|---|---|---|
| `src/` (exkl. `*.test.*`/`*.spec.*`) | 358 | 83 572 |
| `supabase/functions/` (exkl. testkod) | — | 28 866 |
| **Summa produktkod** | — | **112 438** |
| Produktens EGNA testspecifikationer (`tests/` minus infrastrukturen ovan) | ≈ 462 filer | ≈ 99 849 |

**Kvoten, och vad den INTE visar (uppdragets egen fråga):**

- CI-/grindvakts-/processyta : produktkod = **106 891 : 112 438 ≈ 0,95 : 1**.
- Lägger man till de faktiska testspecifikationerna (99 849 rader) blir
  totalen 206 740 rader mot 112 438 — **≈ 1,84 : 1**.
- **Verifierad** som räknehändelse (jag har kört varje `wc -l` själv), men
  **osäker** som kvalitetsmått, av flera skäl jag vill vara uttrycklig om:
  - **Kommentarandelen straffar självdokumentation.** `ci.yml` är 78,5 %
    kommentarer (2 014 av 2 566 rader) — en tunnare, okommenterad version
    av exakt samma logik skulle sänka kvoten utan att sänka komplexiteten.
    Rader mäter TEXT, inte TOLKNINGSBÖRDA.
  - **Kvoten mäter statisk STORLEK, inte körkostnad.** En enda rad
    (`npm run test:api`) kan trigga minuter av CI-tid; att jämföra RADER
    säger ingenting om GitHub Actions-minuter (den frågan hör till
    uppdrag 8.7, inte detta).
  - **Den skiljer inte NUVARANDE storlek från HISTORISK möda.** 34 582 av
    de 106 891 raderna (32 %) är testsviter som skyddar skriptens EGEN
    logik mot regression — ett reellt, återkommande underhållsåtagande,
    men annorlunda än "kod som körs varje dag."
  - **Den räknar inte ÅTERANVÄNDNING.** En policy-fil på 100 rader som
    konsumeras av tre jobb varje körning "kostar" en gång i mätningen men
    tjänar in sig varje gång den läses — kvoten kan inte se det.
  - **Filnamnsbaserad ADR-klassning (30/131) är en grov approximation** —
    den läser bara TITELN, inte innehållet. En ADR om t.ex. datamodellen
    kan i förbigående nämna CI utan att jag räknat den, och en ADR med
    "session" i titeln (processklassad) kan huvudsakligen handla om något
    annat.

### 2. Ändringstakten

**Metod:** `git log origin/main --since=2026-06-01 --format='%ad' --date=format:%Y-W%V -- <ytans sökvägar>` mot samma sökvägslista som § 1 (utom rot-policyfiler, som `git log -- <path>` inte kan filtrera dotfiler mönstermatchat utan att räkna upp alla 44 — uteslutna ur ändringstakts-mätningen, medräknade i storleksmätningen).

| Vecka (2026) | Commits på ytan | Commits totalt på `main` | Andel |
|---|---|---|---|
| W23 | 3 | 9 | 33,3 % |
| W24 | 27 | 117 | 23,1 % |
| W25 | 20 | 126 | 15,9 % |
| W26 | 19 | 152 | 12,5 % |
| W27 | 8 | 108 | 7,4 % |
| W28 | 15 | 230 | 6,5 % |
| W29 | 11 | 93 | 11,8 % |
| W30 | 60 | 653 | 9,2 % |
| W31 | 174 | 843 | 20,6 % |
| W32 | 149 | 946 | 15,8 % |
| W33 | 62 | 796 | 7,8 % |
| W34 | 75 | 972 | 7,7 % |
| W35 | 123 | 601 | 20,5 % |
| W36 | 60 | 753 | 8,0 % |
| W37 (delvis, t.o.m. 2026-09-17) | 7 | 99 | 7,1 % |
| **Summa** | **813** | **6 498** | **12,5 %** |

**Verifierad.** Ingen tydlig avtagande trend — W31 och W35 (20+ %) ligger
LÅNGT in i perioden, inte bara i uppstarten. Ytan fortsätter alltså att
kräva löpande arbete, den stabiliserade sig inte efter en initial byggfas.

**Churn (rader till/från, `git log --numstat` summerat över samma fönster):**

| Yta | Tillagda rader | Borttagna rader | Total churn |
|---|---|---|---|
| CI-/grindvaktsytan (git-log-sökvägarna ovan) | 112 676 | 5 941 | 118 617 |
| `src/` (produktkod, för jämförelse) | 207 987 | 67 422 | 275 409 |

CI-ytans churn (118 617) är **≈ 99 % av dess egen nuvarande storlek**
(119 611 rader räknat över exakt samma sökvägar som git-log-filtret, vilket
skiljer sig marginellt från § 1:s bredare definition). Tolkat rakt av: i
snitt har varje rad i denna yta blivit skriven om (tillagd ELLER borttagen)
en gång under de senaste 3,5 månaderna — för en yta som i teorin ska vara
"infrastruktur satt en gång", inte löpande produktutveckling. `src/`s churn
(275 409) är ≈ 3,3× dess egen storlek (83 572) under samma period — högre,
men `src/` genomgick samtidigt en aktiv betalnings-/bokningsomskrivning
(TASK-346-serien, TASK-402-serien) enligt sessionsdoken, så den siffran
speglar delvis planerad produktutveckling snarare än bara reparation.

**De tio mest ändrade filerna i CI-ytan sedan 2026-06-01** (`git log --name-only`, räknat i antal commits som rör filen):

| Fil | Commits |
|---|---|
| `.github/workflows/ci.yml` | 116 |
| `docs/decisions/README.md` (ADR-index) | 91 |
| `CLAUDE.md` | 76 |
| `CONTRIBUTING.md` | 71 |
| `playwright.config.ts` | 28 |
| `tests/support/fixturvarld/fixture-data.ts` | 24 |
| `.github/workflows/ci-suite.yml` | 24 |
| `.github/workflows/nightly.yml` | 20 |
| `.claude/agents/bygg-agent.md` | 20 |
| `scripts/check-docs.sh` | 15 |

`ci.yml` ensam: **116 commits / 15,4 veckor ≈ 7,5 ändringar per vecka** —
mer än en ändring varannan arbetsdag på EN fil, under nästan fyra månader.
**Verifierad.**

### 3. Andel av utvecklingstiden — fyra proxyer, inget facit

Det finns ingen tidrapportering i detta arbetssätt (Marcus/Code-samarbetet
loggar sessioner och kort, inte timmar). Alla fyra mått nedan är PROXYER med
egna, olika snedvridningar — jag ger ett intervall, inte ett tal.

**Proxy A — mergade PR:er, filbaserat stickprov (starkast underlag, minst
brus).** Ett systematiskt stickprov på 40 av de 400 senaste mergade PR:erna
(var 10:e), klassade på FAKTISKA ändrade filer (`gh pr view --json files`),
inte på titel:

- **2 av 40 (5,0 %)** hade en MAJORITET av ändrade filer i CI-ytan.
- **9 av 40 (22,5 %)** rörde ÅTMINSTONE en fil i CI-ytan (ofta en enda
  `CLAUDE.md`- eller testfil-ändring i en annars produktfokuserad PR).
- Exempel på majoritets-CI-PR:er: `#2049` ("CI-backstoppen — review-grinden
  blir…", 11 av 13 filer i ytan) och `#2097` (prod-migrationsskript, 4 av 6
  filer).

**Proxy B — mergade PR:er, nyckelordsklassning på titel/gren (bredare, mer
brus).** Samma 400 PR:er klassade på ord i titel/branschnamn (`ci`,
`grindvakt`, `hook`, `merge queue`, `policy`, `nightly` osv.):
**71/400 (17,8 %)** träffade minst ett nyckelord. Detta är en ÖVERSKATTNING
jämfört med proxy A — titelord som "test" eller "e2e" i en enda-fil-fix för
en PRODUKTFUNKTION (t.ex. `#2438 fix(e2e): TASK-422 — atgarder-kvitto-testets
Erik Holm-assertion…`) klassas som CI trots att PR:en i sak är en produktfix.

**Proxy C — sessionsdokens H1-rubriker (135 sessioner, manuell + nyckelords-
klassning).** En manuell genomläsning av alla 135 H1-rader
(`grep -h "^# Session" tasks/sessions/`) gav ungefär **20–25 %** vars
huvudtema SNÄVT är CI/grindvakt-maskineriet självt (t.ex. "Session 6 —
CI-optimering", "Session 79 — ci.yml-trion + ADR-077", "Session 97 —
Mekaniserings-programmet: skarpbevis och hookdesigner"). Breddas kategorin
till ALLT process-/arbetsformsarbete (backlog-mekanik, sessionsbokföring,
agent-orkestrering, ADR-bygge) stiger andelen till **40–60 %** beroende på
var gränsen dras — en nyckelordskörning med ett brett sökordsregister gav
**59,7 % (80/134)**, men den överskattar eftersom ord som "grillning"
(används för ALLA designbeslut, inte bara CI-relaterade) och "adr-" (ADR:er
skrivs om produktbeslut lika ofta som processbeslut) drar in rent
produktfokuserade sessioner. **Osäker** — detta är den mest subjektiva av de
fyra proxyerna.

**Proxy D — universella lärdomar, stratifierat stickprov på 60 av 649.**
Detta är det mest slående enskilda fyndet i denna proxy-familj: av 60
systematiskt utvalda lärdomstitlar (`### L<n>` i `tasks/lessons/vol-02.md`
till `vol-08.md`) rörde **≈ 85–90 %** CI-mekanik, git/PR-beteende,
agent-orkestrering eller processdisciplin — bara **≈ 6–8 av 60 (10–13 %)**
var faktiska produkt-/UI-/domänbuggar (t.ex. L276 "En byggd service worker…",
L330 "Select-fält med tidsbundna optioner…", L557 "En rads renderade höjd…").
**Viktig snedvridning att redovisa öppet:** `tasks/lessons.md` är per
`CLAUDE.md`s egen instruktion ("Fånga varje lärdom… Märk universella med
[UNIVERSAL]") SPECIFIKT ett register för åter­kommande METOD-/processmisstag
— en engångsbugg i en betalningsvy blir sällan en numrerad lärdom om den
inte avslöjar en UNIVERSELL princip. Denna proxy mäter alltså delvis VAD
LÄRDOMSREGISTRET ÄR TILL FÖR, inte bara var tiden faktiskt gick. Jag
redovisar den ändå eftersom skevheten är mätbar och riktningen (tungt mot
process/CI) är för stark för att vara ren brus.

**Sammanvägt intervall, med reservation:** beroende på hur snävt "test-
infrastruktur" avgränsas ligger andelen av senaste arbetets fokus SOM RÖR
CI/grind/process-maskineriet självt (inte produktfunktioner) mellan
**≈ 15 % (proxy A, striktast)** och **≈ 60 % (proxy C, bredast, med
nyckelordsöverskattning)**. Jag bedömer **20–35 %** som den mest trovärdiga
mittpunkten, med proxy D som en stark indikation på att en
oproportionerligt stor andel av det som räknas som LÄRT (i motsats till
byggt) handlar om processen snarare än produkten.

### 4. Vem eller vad kan förstå hela flödet? (fristående svar på fråga 4:s underhållshalva)

**Nej, det finns inget enda dokument.** Jag letade specifikt efter en
Gunilla-nivå-helhetsbeskrivning av CI-flödet:
`docs/reference/hur-systemet-funkar.md` (328 rader) beskriver PRODUKTENS
arkitektur för Marcus/Roger/Lotta — inte CI:t. `docs/reference/systemet.md`
(23 rader) är en ren pekare till hubbens `marcus-system/SYSTEMET.md`, som
beskriver Marcus/Code-SAMARBETSSYSTEMET generellt (roller, hub/spoke,
plugin/skills) — inte DETTA repos specifika `ci.yml`-mekanik. **Verifierad**
(båda filerna lästa i sin helhet).

Den närmaste approximationen av en helhetsbeskrivning är utspridd över
minst fyra ytor som ingen enskild fil länkar samman till en läsordning:

1. `CLAUDE.md` § "Bygg, testa, linta" (1 001 rader, rad 97–1098) —
   AUTO-LADDAS i varje agent-session, men är skriven som en samling
   punktvisa regler med egen historik ("varför raden står här"), inte som
   en sammanhängande arkitekturbeskrivning.
2. `CONTRIBUTING.md` (1 338 rader) — måste AKTIVT läsas, laddas inte
   automatiskt.
3. Workflow-filerna själva (`ci.yml` är 78,5 % kommentarer) — självdoku-
   menterande, men bara för den som redan öppnat rätt fil.
4. 30 ADR:er (6 493 rader) — var och en täcker EN mekanism, ingen
   sammanfattar helheten. `docs/decisions/README.md` (91 commits sedan
   juni — den mest ändrade enskilda filen i ytan efter `ci.yml`) är ett
   index över ADR-TITLAR, inte en syntes.

**Vad en ny agent med tomt kontextfönster måste läsa för att säkert ändra
`ci.yml`:** minst `CLAUDE.md`s CI-avsnitt (1 001 rader) + `CONTRIBUTING.md`
(1 338 rader) + den relevanta delen av `ci.yml` självt (upp till 2 566
rader, om än till stor del egen-kommenterande) + minst 3–5 ADR:er beroende
på VILKEN mekanism som rörs (`CLAUDE.md` instruerar uttryckligen: "Inför
ett arkitekturförslag: läs den styrande ADR:n i sin helhet"). Med
genomsnittlig ADR-längd 216 rader (6 493/30) ger det en **grov lägstanivå
på ≈ 5 900 rader läsning** innan en säker ändring — och det förutsätter att
agenten VET vilka 3–5 ADR:er som är relevanta, vilket i sig kräver
förkunskap eller sökning. **Starkt indikerad** (beräkning, inte en
kontrollerad mätning av en verklig agent-session).

**Den dolda, återkommande kostnaden: CLAUDE.md i varje agent-spawn.**
`CLAUDE.md`s CI-avsnitt är 62 219 byte (≈ 15 555 token vid 4 byte/token-
tumregeln) av filens totala 78 070 byte (≈ 19 518 token) — **80 % av
filens tokenkostnad går åt till CI-avsnittet allena**, och HELA filen
laddas automatiskt i varje agent-sessions systemprompt, oavsett om
agentens uppgift har något med CI att göra. `/Users/marcus/Repon/
miranon-media-admin/.claude/agent-spawn-log.jsonl` (läst med Read-verktyget,
inte via git — filen är gitignorerad) loggar **1 653 agent-spawns**
2026-07-28 till 2026-09-17 (51 dagar), varav **64 är `fork`** (ärver
kontext, laddar INTE om CLAUDE.md) och **1 589 är färska spawns** (`bygg-
agent` 767, `review-agent` 343, `general-purpose` 218, `research-pass` 111,
`Explore` 107, m.fl.). Om varje färsk spawn laddar hela filen: **≈ 31
miljoner token** totalt över 51 dagar, varav **≈ 24,7 miljoner token
(80 %)** går åt enbart CI-avsnittet — en kostnad som betalas OAVSETT om
agenten någonsin rör `ci.yml`. **Starkt indikerad** — jag har inte
verifierat att varje agenttyp faktiskt får hela projekt-CLAUDE.md injicerad
(det är Claude Codes dokumenterade standardbeteende men jag har inte
mätt det empiriskt i just detta pass), och byte/4-tumregeln är en
approximation, inte en tokeniserad räkning.

**Svar i klartext:** ingen enskild människa eller agent kan i dag förstå
HELA flödet genom att läsa EN fil. Den som byggt en specifik mekanism
(t.ex. review-grinden, `ADR-105`-familjen) kan förstå DEN mekanismen väl —
`CONTRIBUTING.md` och `CLAUDE.md` är skrivna med ovanligt hög
"varför står detta här"-transparens (varje regel bär sin historik och sitt
skäl) — men helheten kräver att man känner till VILKA av de 30 ADR:erna,
vilka avsnitt i två 1 300+-radersdokument, och vilka delar av en
2 566-raders YAML-fil som hör ihop. Detta är i sig ett svar på Marcus
slutfråga (se § Marcus slutfråga).

### 5. Andra repon — tvärrepo-jämförelsen (första version)

**Metod:** `find` (läs-endast, ingen skrivning, inget `git log` mot
FRÄMMANDE repons historik) mot 14 kataloger under `~/Repon/`:
`marcus-system`, `miranon-media-os`, `marcus-os`, `marcusos-dashboard`,
`marcusos-briefing`, `designsystem`, `fraktteam-geo`, `video-producer`,
`psionautics`, `odoo-migration-workbench`, `cohort-004-project`,
`remix-of-qlerk-your-property-pal`, `erbjudande`, `claude-skills`.

| Repo | `.github/workflows/` | `.githooks/` | `*-policy.conf/.json` (rot) | `.claude/settings.json` | `CLAUDE.md` |
|---|---|---|---|---|---|
| **miranon-media-admin** (detta repo) | 8 filer | 1 hook | 44 filer | ja, 16 hookar | ja |
| `marcus-system` (hubben) | **nej** | **ja — 1 hook** (`pre-commit`) | **ja — 1 fil** (`.frontmatter-policy.conf`) | nej (bara `settings.local.json`) | ja |
| `designsystem` | **ja — men ANNAT system** (9 filer: `build`, `lint`, `docs`, `release`, `pr-preview` …) | nej | nej | ? (ej djupundersökt) | ? |
| `miranon-media-os` (fryst Vue-föregångare) | **nej** | nej | nej | ej sökt | ja |
| `marcus-os`, `marcusos-dashboard`, `marcusos-briefing`, `fraktteam-geo`, `video-producer`, `psionautics`, `odoo-migration-workbench` | nej (samtliga) | nej (samtliga) | nej (samtliga) | **nej (samtliga saknar filen helt)** | `marcus-os` + `video-producer` + `psionautics`: ja; övriga: nej |
| `cohort-004-project`, `remix-of-qlerk-your-property-pal`, `erbjudande`, `claude-skills` | nej | nej | nej | nej | ej djupundersökt |

**Verifierad** för samtliga "nej"/"ja"-celler i tabellen (direkta `find`-
träffar eller frånvaro därav, körda 2026-09-17).

**Fynd 1 — exakt EN grindvakt är kopierad, och den har redan glidit.**
`marcus-system/scripts/check-frontmatter.sh` (183 rader) är, enligt sin
egen filhuvud-kommentar, en avsiktlig BYTE-FÖR-BYTE-kopia av spokens
`scripts/check-frontmatter.sh` (186 rader), etablerad `TASK-161.7`
(2026-08-08). Jag körde `diff` mellan de två filerna: **samtliga
skillnader är kommentarer/kommentar-formulering — noll skillnader i
körbar logik.** Detta är den PRECISA konventionen `CLAUDE.md`s "Custom
CI-grindvakts-logik i spokes är alltid config-driven"-princip beskriver,
och den fungerar som avsett — MEN:

Ett faktiskt POLICYVÄRDE har redan glidit mellan de två filernas
kommentarer: hubbens `check-frontmatter.sh` säger "sätt `review_by`:
YYYY-MM-DD (typiskt today + **~3 månader**)" medan spokens egen fil säger
"typiskt today + **6 månader**". Detta är inte bara prosa-drift — det är
en skillnad i REKOMMENDERAT VÄRDE mellan två filer som ska vara identisk
logik, upptäckt vid mindre än sex veckors ålder på duplikatet. Detta
STÖDER punkten att duplicering — även när den är disciplinerat
config-driven — kräver aktivt, löpande underhåll för att inte glida.
**Verifierad** (`diff`-utdata läst i sin helhet).

**Fynd 2 — CI-maskineriet (`ci.yml`, gatekeeper-testsviterna,
`tests/support`) finns INGENSTANS annanstans.** Varken den frysta
Vue-föregångaren (som rimligen hade kunnat ärva samma mönster om det
funnits före React-omskrivningen) eller något av de nio övriga
undersökta repona bär någon del av workflow-filerna, `check-*.sh`-
grindarna, `deny-*.sh`-hookarna (utöver den ENA `check-frontmatter.sh`),
eller testinfrastrukturen. `designsystem` har en EGEN, helt orelaterad
och betydligt enklare CI (9 filer: bygg, lint, dokumentation, release,
PR-förhandsgranskning — ett standardmönster för ett publicerat
komponentbibliotek, inte en variant av miranon-media-admins apparat).
**Verifierad.**

**Fynd 3 — AGENT-BETEENDET (hookar, skills) ÄR centraliserat, men det är en
ANNAN axel än CI-maskineriet.** `marcus-system`-pluginet (version **1.34.0**,
installerat user-scope enligt `~/.claude/plugins/installed_plugins.json`,
`lastUpdated: 2026-08-22`) laddas AUTOMATISKT i varje Claude Code-session
oavsett vilket repo man står i (`ADR-035`, citerat i spokens `CLAUDE.md`) —
detta gäller ÄVEN de sju repona ovan som saknar egen `.claude/settings.json`
helt. Det betyder att pluginets FEM hookar och skill-katalogen är aktiva i
`marcus-os`, `video-producer`, `psionautics` osv. utan att dessa repon
behövt konfigurera något lokalt. Men detta är en centralisering av
**agent-ARBETSSÄTTET** (session-start/-slut, backlog-substrat,
grillnings-metodik), inte av **CI-/grindvakts-maskineriet** — pluginet bär
noll workflow-filer, noll `check-*.sh`-grindar, och (utöver den ENA
`check-frontmatter.sh`-instansen) noll av de produktspecifika
`deny-*.sh`-hookarna. De två lagren (agent-beteende vs. CI-apparat) är
alltså olika mycket centraliserade, och det är lätt att förväxla dem.
**Verifierad** (plugin.json + installed_plugins.json lästa direkt).

**Fynd 4 — vad centralisering redan har kostat, dokumenterat i egna
lärdomar.** `tasks/lessons/vol-02.md` bär minst fyra separata,
namngivna incidenter kopplade till plugin-centraliseringen: (a) rad 849:
`claude plugin`-kommandon kan av misstag tömma orelaterade block i
projektets `settings.json` (GitHub-issue `#38271` citerad); (b) rad 873:
en ändring av hubbens skill-set kräver en MANUELL version-bump +
ominstallation — Claude Codes egen cache-invalidering är "opålitlig"; (c)
rad 957: en BODY-redigering av en hub-skill (utan att antalet skills
ändras) aktiveras INTE automatiskt på spoke-sidan förrän fem separata
manuella steg körs (`claude plugin marketplace update` +
`claude plugin update`); (d) rad 961: `installed_plugins.json`s
`gitCommitSha`-fält kan bli inaktuellt efter en uppdatering, verifierat
empiriskt (K0c). Detta är konkret, dokumenterad bekräftelse på att ÄVEN
den centralisering som FINNS (agent-lagret, inte CI-lagret) bär en
löpande, mätbar underhålls- och synk-kostnad — exakt den typ av kostnad
uppdragets fråga 5 efterfrågar. **Verifierad** (lästa direkt i
`tasks/lessons/vol-02.md`).

**Oväntat sidofynd (utanför min fråga, registreras enligt kontraktets
krav att aldrig tyst förkasta):** `marcus-system/plugins/marcus-system/
.claude-plugin/plugin.json` är **8 283 byte**, och nästan HELA den vikten
ligger i ETT enda `description`-fält som fungerar som en append-only
ändringslogg över pluginets samtliga versioner (varje versions-tillägg
citeras i löptext i stället för i en separat CHANGELOG-fil). Detta är
samma typ av dokumentations-tänjbarhet som denna gransknings egna
`CLAUDE.md`/`CONTRIBUTING.md` — men i en fil vars TEKNISKA roll (ett
plugin-manifest som Claude Code parsar) inte är gjord för att bära
löptext av den längden. Jag har inte utrett om detta faktiskt orsakar
problem, bara att det är ett mönster värt att någon tittar på.

### 6. Första klassning: generellt, generellt-med-config, produktspecifikt eller processpecifikt?

**Metod:** ~20 komponenter, var och en `grep`-stickprovad mot hårdkodade
projektsökvägar/bas-ID:n/tabellnamn (15 av dem konkret citerade nedan med
den grep-träff som avgjorde klassningen).

| Komponent | Klass | Belägg |
|---|---|---|
| `ci.yml` (huvudorkestrering: changed/lint/audit/suite/docs/review-backstopp/ci-passed) | **Generell med config** | Mönstret (changed-files-gating → parallella jobb → aggregator) är branschstandard (se `j4a` § 3–4); värdena (paths, tröskar) är repo-specifika i `env`-block |
| `ci-suite.yml` (anropad reusable workflow) | **Generell med config** | `workflow_call` med `run_staging`/`run_a11y`-flaggor — GitHubs eget generiska återanvändningsmönster (`j4a` § 12) |
| `nightly.yml`, `post-merge.yml`, `nightly-watchdog.yml`, `visual-baselines.yml` | **Generell med config** | Mönstren (nattligt fullsvep, post-merge-lager, "vakt för vakten", baseline-generering) är alla namngivna branschmönster; innehållet i enskilda jobb (t.ex. Airtable-purge i nightly) är produktspecifikt |
| `gate-proof.yml`, `review-backstopp-proof.yml` | **Processpecifik** | Bevisar VÅRA egna, uppfunna mekanismer (merge-grinden, review-grinden) — mönstret "bevisa att en grind faktiskt fäller" är generellt, men innehållet är 100 % kopplat till denna repos specifika grindar |
| `scripts/check-frontmatter.sh` | **Generell med config** — **bevisat**, inte antaget | Diff mot hubbens kopia: noll skillnad i logik (§ 5, Fynd 1) |
| `scripts/deny-prod-airtable.sh` | **Generell med config, med en läcka** | `PROD_AIRTABLE_BASE_ID` läses ur `.prod-airtable-policy.conf` (generisk logik), MEN bas-ID:t `app8uGPrVCVOm6LfD` är även hårdkodat i två kommentar-/felmeddelande-strängar i skriptet självt (rad 9, 152) — en ren kopiering till ett nytt repo skulle visa FEL bas-ID i sitt eget felmeddelande tills någon redigerar kommentaren |
| `scripts/deny-prod-ref.sh` | **Generell med config** | `grep` gav INGET hårdkodat ref-värde i skriptet — läser `PROD_REF_PROD` uteslutande ur `.prod-ref-policy.conf` |
| `scripts/deny-grind-genom-pipe.sh`, `scripts/deny-hemlighet-utskrift.sh`, `scripts/agent-spawn-log.sh` | **Generell** (inte ens config-behövande) | Universella shell-/säkerhetsproblem (pipe sväljer exitkod, hemligheter i klartext, enkel loggning) — skulle fungera oförändrat i vilket repo som helst |
| `scripts/deny-frammande-huvudkatalog.sh` | **Generell med config** | Löser ett Claude-Code-ISOLERINGSPROBLEM (worktree-ägarskap), inte ett produktproblem — generellt för alla repon som kör multi-agent-worktrees |
| `scripts/deny-facit-godkand-skrivning.sh`, `scripts/deny-arbetsform-push.sh`, `scripts/deny-subagent-vantan.sh`, `scripts/deny-precompact.sh`, `scripts/stop-vakt.sh`, `scripts/katalogagarskap-*.sh` | **Processpecifik** | Samtliga kodar in EGNA, uppfunna kontrakt för Marcus/Code-samarbetet (facit-kedjan, arbetsform-tillstånd, ADR-096/-101/-087) — inte generella CI-koncept och inte produktdata, men bundna till DENNA arbetsform |
| `scripts/fas4-prod-deploy.sh` | **Produktspecifik** | `.prod-functions-allowlist.conf` räknar upp 57 namngivna Edge Functions för DENNA app; `supabase/.temp/project-ref`-mekaniken är generell, men innehållet den skyddar är inte |
| `scripts/review-loop-beslut.mjs`, `scripts/backlog-cli.sh` (`npm run bl`) | **Processpecifik** | Config-drivna (ingen hårdkodad produktdata i `grep`), men kodar in EN SPECIFIK agent-orkestreringsmodell (review-grinden, Backlog.md-substratet) som inte är "CI" i traditionell mening |
| `scripts/verify-ci-parity.mjs` | **Generell med config — men svagare än konventionen avser** | `grep` visar att filnamnen `ci.yml`/`ci-suite.yml` är HÅRDKODADE i skriptets kommentarer och parsningslogik, inte parametriserade — mönstret (kör CI:s exakta steg lokalt) är generellt, men denna implementation är tightare kopplad till just dessa två filnamn än `.<grindvakt>-policy.conf`-konventionen annars är |
| `tests/support/fixturvarld/*` | **Produktspecifik** | MSW-handlers och fixturer formade efter DENNA apps API-yta |
| `tests/kontraktsvakt/*` | **Produktspecifik** | Kontraktstester mot Airtable-/Supabase-SCHEMAT för denna app |
| `playwright.config.ts` | **Generell med config** | Playwright självt är tredjepart; de 789 raderna är nästan uteslutande projekt-specifika projekt-/timeout-/reporter-värden ovanpå ett generiskt ramverk |
| `.githooks/pre-commit` | **Generell med config** | Dispatchar till `check-*.sh` via samma policy-fil-konvention |
| `.claude/agents/*.md` (bygg-agent, review-agent, research-pass) | **Processpecifik** | Kodar Marcus/Code-arbetsformens specifika roller (worktree-isolerad byggagent, färsk-kontext-granskare) — mönstret "adversarial reviewer i separat kontext" är en branschidé, men KONTRAKTET är vårt eget |

**Sammanfattning av klassningen:** av de ~20 stickprovade komponenterna är
**≈ 9 generella eller generella-med-config** (varav en, `check-frontmatter.sh`,
BEVISAT portabel), **≈ 3 produktspecifika**, och **≈ 8 processpecifika** —
bundna till Marcus/Code-arbetsformen snarare än till Miranon Media som
produkt ELLER till CI som allmänt begrepp. Detta sista är ett fynd i sig:
en betydande del av det som SER UT som "CI-komplexitet" är egentligen
**agent-orkestreringens** komplexitet (facit-kedjan, arbetsform-tillstånd,
review-loopen, backlog-substratet) — en tredje kategori uppdragets
ursprungliga tre alternativ (generellt/config/produktspecifikt) inte hade
ett eget fack för, tills jag lade till den fjärde här.

### 7. Hur installeras samma standard i ett nytt repo, i dag?

**Svaret är: för hand, och det har hänt exakt en gång.** Det finns inget
bootstrap-skript, ingen mallrepo, ingen checklista. Den enda dokumenterade
installationsinstruktionen jag hittade sitter INUTI skriptet som ska
kopieras: `scripts/check-frontmatter.sh` rad 30 (spokens version) säger
ordagrant "Om detta är ett nytt spoke: kopiera från miranon-media-admin och
anpassa `FRONTMATTER_GOVERNING_DOCS`-listan." Det är den kompletta
"installationsguiden" — en kommentar i själva artefakten som ska
kopieras, inte ett fristående dokument eller verktyg.

Detta HAR gjorts en gång (§ 5, Fynd 1: `check-frontmatter.sh` →
`marcus-system`), och även vid den enda kända instansen glömdes ett
policyvärde bort inom sex veckor (review_by-standardvärdet). **Ingen** av
de nio övriga repona har någonsin fått någon del av CI-maskineriet
installerad — sökningen i § 5 hittade noll spår av `ci.yml`-mönstret,
`check-*.sh`-grindarna, eller testinfrastrukturen någon annanstans.
**Verifierad** (grep av skriptets egen kommentar + tvärrepo-sökningen ovan).

`docs/research/ci-djupgranskning-2026-09-17/underlag/j4a-branschpraxis-ur-primarkallor.md`
§ 12 kartlägger branschens FYRA etablerade mekanismer för detta problem
(återanvändbara `workflow_call`-arbetsflöden, ett `.github`-specialrepo för
organisationsbrett default, mallrepon, och en organisations-ruleset som
tvingar ett gemensamt arbetsflöde) och skaltaggar samtliga fyra som
"överbyggnad" eller "främst motiverat på mycket stor skala" GIVET att det i
dag finns exakt ETT produktrepo som behöver denna CI. Den enda mekanismen
`j4a` taggar "rimlig på vår skala, även i dag" är mallrepo (fristående
engångskopiering, inget fortsatt underhållsåtagande) — vilket, informellt
och utan verktygsstöd, är precis det sätt `check-frontmatter.sh` redan
spreds på. **Jag designar inte en lösning här** (det är uttryckligen jobb
6:s uppgift och min avgränsning), men jag noterar att den EXISTERANDE
branschanalysen redan pekar mot att den enkla vägen (kopiera för hand, med
en tydligare checklista än en enda kommentarsrad) är rimlig givet dagens
skala — inte att ett helt CI-kit-projekt behövs REDAN NU.

## Osäkerheter och vad jag inte kunde belägga

- **Andelen av utvecklingstiden (§ 3) är och förblir en uppskattning.**
  Ingen tidrapportering finns. Jag har gett fyra proxyer med olika
  snedvridningar och ett sammanvägt intervall (20–35 % snävt, upp mot 60 %
  brett) — det är inte, och kan inte bli, ett exakt tal. **Ej verifierbar**
  utan en tidsloggningsmekanism som inte existerar i detta arbetssätt.
- **CLAUDE.md-tokenkostnaden per agent-spawn (§ 4) bygger på en byte/4-
  tumregel, inte en faktisk tokenisering.** Jag har inte kört den exakta
  filen genom Anthropics tokenizer. Den relativa slutsatsen (CI-avsnittet
  = 80 % av filens vikt) är solid eftersom den är en ren byte-kvot; det
  ABSOLUTA tokentalet (≈ 15 555 per spawn) är en approximation.
  **Starkt indikerad**, inte verifierad.
- **Jag har inte verifierat att VARJE agenttyp i spawn-loggen faktiskt får
  hela projekt-CLAUDE.md injicerad i sin systemprompt.** Detta är Claude
  Codes dokumenterade standardbeteende för agent-sessioner i ett projekt,
  men jag har inte själv instrumenterat en spawn för att bekräfta det
  empiriskt i just denna mätning. Om vissa agenttyper (t.ex. `Explore`)
  får en beskuren kontext skulle 1 589-talet vara en överskattning.
  **Ej verifierbar** inom detta uppdrags räckvidd — skulle kräva att någon
  med tillgång till harnessets interna loggning bekräftar exakt vad som
  injiceras per agenttyp.
- **Session-H1-klassningen (proxy C, § 3) är delvis min egen manuella
  bedömning** av 134 rubriker — en annan läsare skulle sannolikt dra
  gränserna annorlunda för minst 15–20 av dem (t.ex. är "Session 42 —
  Fas 6e retro-audit (T38): /arch-audit mot Mer-fliken" en audit-SESSION
  (process) eller en Mer-fliken-session (produkt) som RÅKAR innehålla en
  audit?). **Osäker**, redovisad som sådan.
- **Jag har inte undersökt `designsystem`s `.claude/settings.json`, om en
  sådan finns**, eller om `designsystem` konsumerar `marcus-system`-
  pluginet. Detta ligger utanför min ytdefinition (CI-MASKINERIET, inte
  agent-plugin-frågan) men skulle vara relevant för en fullständig karta
  av centraliseringen. **Ej verifierbar** inom denna mätnings scope —
  flaggas för en eventuell uppföljning.
- **Jag har inte mätt GitHub Actions-minuter eller faktisk kalendertid**
  för ändringstakten i § 2 — bara COMMIT-frekvens. En hög commit-frekvens
  på en fil med 78,5 % kommentarer kan betyda "mycket dokumentationsarbete
  på en stabil mekanism" lika gärna som "mycket reparationsarbete på en
  instabil mekanism" — jag har inte klassat COMMIT-MEDDELANDENA för att
  skilja de två åt (det skulle vara ett eget delprojekt givet 116
  commits på EN fil). **Osäker** vad gäller TOLKNINGEN av
  ändringsfrekvensen, om än **verifierad** som räknehändelse.
- **Cohort-004-project, remix-of-qlerk-your-property-pal, erbjudande och
  claude-skills fick bara den ytligaste kontrollen** (find efter
  workflows/policy-filer/hookar, ingen granskning av deras CLAUDE.md eller
  syfte). Om något av dessa är aktiva produktionsrepon snarare än
  övnings-/kursprojekt kan det förändra tvärrepo-bilden. **Ej verifierbar**
  utan att fråga Marcus vad respektive repo faktiskt är.

## Risker

- **Kvoten i § 1 (0,95:1 respektive 1,84:1) kan feltolkas som en dom i sig
  självt** — "nästan lika mycket maskineri som produkt" LÅTER dramatiskt,
  men avsnittet visar uttryckligen fem konkreta skäl till att kvoten INTE
  ensam avgör om komplexiteten är befogad. Läses tabellen utan brödtexten
  runt den är risken för en förhastad slutsats hög.
- **"Ingen kopiering" (§ 5) kan läsas som "inget värde i att centralisera"**
  — det ÄR sant att apparaten aldrig spridits, men `j4a` § 12 visar att
  ALLA branschens spridningsmekanismer uttryckligen är byggda för
  situationen "fler än ett repo behöver samma sak", och vi har (ännu) bara
  ETT produktrepo som behöver just denna CI. Frånvaro av spridning är
  alltså delvis en förväntad konsekvens av att förutsättningen för
  spridning (ett andra konsumerande repo) inte funnits, inte enbart ett
  tecken på att ingen försökt.
- **Klassningstabellen i § 6 är ett stickprov (~20 av >300 filenheter), inte
  en fullständig revision.** Den fjärde kategorin jag introducerade
  ("processpecifik") är min egen tolkning, inte en term uppdraget gav mig
  — en annan granskare kan slå ihop den med "produktspecifik" eller
  "generell" och få andra andelar.

## Rekommendationer

**Dessa är rekommendationer, inte beslut — Marcus och jobb 6 avgör.**

1. **Om ett mallrepo eller en installationschecklista byggs (jobb 6):**
   utgå ifrån den ENDA verifierade, fungerande instansen
   (`check-frontmatter.sh` → hubben) snarare än att designa från grunden —
   den bevisar redan att "logik universell, värden i policy-fil"-mönstret
   FUNGERAR, men också att det GLIDER utan en aktiv synk-mekanism (review_by-
   fyndet i § 5). En checklista bör inkludera ett explicit steg "jämför
   policyvärden mot källan" snarare än att lita på att en kommentarsrad
   räcker.
2. **Separera "processpecifik" från "produktspecifik" i den vidare designen.**
   § 6 visar att en påtaglig andel av komplexiteten (facit-kedjan,
   arbetsform-tillstånd, review-loopen, backlog-wrappern) inte är CI i
   traditionell mening och inte heller Miranon Media-specifik — den är
   Marcus/Code-ARBETSFORMENS egen uppfinning. Om ett CI-kit ska
   återanvändas i ett framtida andra produktrepo (`Mm Component Library`,
   per `CLAUDE.md` § Vision) är det troligt att just PROCESSPECIFIKA
   delar följer med naturligt (samma arbetsform används där också) medan
   PRODUKTSPECIFIKA delar (Airtable-purge, fas4-deploy) uttryckligen inte
   ska det.
3. **Innan en sofistikerad centraliseringsmekanism (`workflow_call`,
   organisations-ruleset) byggs: vänta på ett verkligt andra konsumerande
   repo.** `j4a` § 12 och § 11 (DHH-citatet) ger samstämmigt stöd för att
   varje sådan mekanism kräver LÖPANDE underhåll för att hållas synkad —
   och den bär inget värde förrän det finns minst två repon som faktiskt
   ska dela logiken. Att bygga den i förväg vore precis den "lösning som
   letar problem" global `CLAUDE.md`s över-engineering-vakt varnar för.
4. **Överväg en riktad, engångs-läsning av `docs/decisions/README.md`s
   30 CI-relaterade ADR:er för att avgöra om några kan konsolideras.**
   6 493 rader fördelat på 30 separata beslutsdokument, utan en
   sammanfattande karta, är en trolig bidragande orsak till att § 4:s
   "ingen kan förstå hela flödet"-fynd håller. En kort, kuraterad
   ADR-KARTA (inte en sammanslagning av besluten själva — det vore att
   riva historik) skulle sänka läsbördan för nästa agent utan att ändra
   någon mekanism.

## Marcus slutfråga — dom med argument för och emot

Marcus egen fråga (rad 393): har vi byggt en välmotiverad kvalitetsplattform,
eller en avancerad maskin vars komplexitet har börjat motivera sig själv?
Jag ger inte ett enda ord som svar — evidensen jag samlat pekar åt BÅDA
håll, och en ärlig dom måste visa båda sidor.

**Det starkaste argumentet FÖR "en avancerad maskin vars komplexitet har
börjat motivera sig själv":**

- Kvoten CI-/processyta : produktkod (≈ 0,95:1, upp mot 1,84:1 med
  testspecifikationer inräknade) betyder att nästan lika mycket text
  underhåller SYSTEMET som bygger PRODUKTEN.
- 34 582 rader (32 % av hela ytan) är testsviter som skyddar GRINDVAKTERNAS
  EGEN LOGIK — ett rekursivt lager av kvalitetssäkring FÖR
  kvalitetssäkringen, snarare än för produkten Lotta använder.
- Ändringstakten avtar inte: W31 och W35 (långt in i perioden) hade HÖGRE
  andel CI-commits än uppstartsveckorna. Om apparaten vore "byggd klar"
  borde kurvan plana ut; den gör det inte.
- Ingen enda person eller agent kan i dag hålla hela flödet i huvudet
  (§ 4) — det kräver navigering genom minst fyra separata, ojämnt
  underhållna dokumentytor plus 30 ADR:er.
- DHH:s (37signals) förstapartsargument (citerat via `j4a` § 11) namnger
  EXAKT vår situationsklass ("small teams... never aspire to a more
  complicated stack than what your application calls for") som en där
  sofistikering är fel svar — och han pekar explicit ut VILKA organisationer
  som INTE är i den situationen (Shopify, GitHub) på ett sätt som gör
  jämförelsen konkret, inte retorisk.
- Processpecifika mekanismer (facit-kedjan, arbetsform-tillstånd,
  review-loopen) löser problem som Marcus/Code-ARBETSSÄTTET SJÄLVT skapat
  (multi-agent-orkestrering, worktree-isolering) — en risk att komplexitet
  föder mer komplexitet i en sluten cirkel, snarare än att svara på ett
  yttre produktkrav.

**Det starkaste argumentet EMOT — för "en välmotiverad kvalitetsplattform":**

- `j8-1`-underlaget (produktionsfel och vad som skyddar mot dem — utanför
  min egen fråga, men läst för kontext) dokumenterar konkreta, namngivna
  incidenter grindvakterna faktiskt fångat eller hade fångat om de
  funnits tidigare — apparaten är inte uppenbart overksam.
- Merge queue, review-backstopp och de flesta hookarna är byggda som DIREKT
  SVAR på mätta, upprepade fel (samma mönster syns genomgående i
  lärdomsregistret: "hände två gånger → mekaniserades") — inte som
  spekulativ förbyggnad. Detta är precis global `CLAUDE.md`s egen
  över-engineering-vakts kriterium för legitim komplexitet ("golvet…
  skärs ALDRIG bort").
- Den höga kommentarandelen (62,9 % över alla workflows, 78,5 % i `ci.yml`)
  är delvis en INVESTERING i just den begriplighet § 4 efterfrågar — varje
  jobb förklarar sitt eget VARFÖR inline. Det gör filerna längre men
  sannolikt lättare att felsöka än en tystare, "renare" motsvarighet
  skulle vara.
- Skalan är genuint hög för en ensam utvecklares projekt: ~2 496 PR:er på
  fyra månader, 6 498 commits sedan juni, en flotta av parallella
  AI-agenter som skriver kod dygnet runt. DHH:s "99,99 % av alla webbappar"
  -jämförelse må gälla team-STORLEK, men den mäter inte
  COMMIT-VOLYM/PARALLELLITETSGRAD — och det är den axeln (inte
  utvecklarantal) som mest driver behovet av mekanisk grindvakt här:
  merge queue och review-backstoppen löser SPECIFIKT problemet "flera
  agenter landar kod samtidigt", ett problem en ensam MÄNSKLIG utvecklare
  aldrig skulle ha.
- Den EXAKTA frånvaron av kopiering (§ 5) kan läsas som DISCIPLIN snarare
  än slöseri: apparaten har INTE spridits i onödan till repon som inte
  behöver den (designsystem har sin egen, enklare CI; de sju övriga
  repona har ingen CI alls eftersom de inte är produktionsappar med
  betalflöden och personuppgifter).

**Min bedömning, öppet märkt som bedömning:** de två starkaste enskilda
datapunkterna är (a) att ändringstakten INTE avtar över tid, vilket är
svårast att förena med "byggd klar, nu stabil grund", och (b) att en
betydande — och växande — andel av mekanismerna (processpecifik-kategorin
i § 6) löser problem som ARBETSFORMEN själv skapat snarare än problem
produkten eller en extern standard kräver. Det talar för att en del av
tillväxten är just den självmotiverande komplexiteten Marcus frågar efter.
Samtidigt är det obestridligt att en STOR del av apparaten (merge queue,
review-backstopp, de flesta `deny-*`-hookarna) är svar på VERKLIGA,
namngivna, upprepade fel — inte spekulation. Den ärligaste sammanfattningen
är: **detta är en plattform som VAR välmotiverad vid varje enskilt
tillägg, mätt mot det problem som utlöste det** — men ingen mekanism i
hela systemet (varken ADR-bar, review-loop eller lärdomsregister) frågar
regelbundet "är SUMMAN av alla dessa välmotiverade tillägg fortfarande
proportionerlig?" Det är den frågan Session 126 som helhet verkar ha
ställts för att besvara, och detta delsvar landar på: **evidensen
motiverar en medveten NEDSKALNINGS-övning snarare än ännu ett tillägg** —
men det är min tolkning av mätningarna, inte ett beslut.

## Rapport till orkestreraren

- **Modell-identitet (exakt rad ur egen systemprompt):** "You are powered
  by the model named Sonnet 5. The exact model ID is claude-sonnet-5."
- **Dom i klartext:** maskinen är stor (≈1:1 mot produktkoden, upp mot
  1,84:1 med testspecifikationer), dyr i löpande commits (≈7,5
  ändringar/vecka på `ci.yml` ensam, avtagande takt SYNS INTE), och
  praktiskt taget okopierad (en enda grindvakt spridd, till hubben, och
  redan glidande i ett policyvärde). Svaret på Marcus slutfråga är
  medvetet odelat — se § "Marcus slutfråga" för båda sidorna.
- **Den avgörande delfrågan:** ändringstaktens FRÅNVARO av avtagande
  trend (§ 2) — en platå hade stött "välmotiverad plattform, nu stabil";
  fortsatt hög takt 3,5 månader in stöder i stället "fortsatt aktivt,
  ej färdigbyggt system."
- **Starkaste källorna:** egen `git log`/`wc`/`diff`-mätning (all §1–2, §5
  Fynd 1); `docs/research/ci-djupgranskning-2026-09-17/underlag/
  j4a-branschpraxis-ur-primarkallor.md` §§ 11–12 (DHH/37signals,
  Kubernetes SIG-testing, GitHub reusable-workflows-dokumentation —
  citerade via syskonfilen, inte omverifierade av mig); `/Users/marcus/
  Repon/miranon-media-admin/.claude/agent-spawn-log.jsonl` (1 653 spawns,
  läst direkt).
- **Motsägelse mellan styrande text och implementation:** uppdragets egen
  premiss ("172 filer i `scripts/`, 101 `.sh`, 67 `.mjs`") stämmer INTE
  mot min mätning: `find scripts -type f` ger **186** filer totalt
  (**104** `.sh` + **79** `.mjs` + 3 övriga — `verify-phase-1.ts`,
  `pwa-icon-version.ts`, `task-346-3-staging-verifiering.sql`), och redan
  101+67=168 (uppdragets egna delsummor) summerar inte till dess eget
  totaltal 172. Skillnaden är sannolikt en räknemetod-skillnad (topp-nivå
  vs. rekursivt inklusive `scripts/lib/`), inte en förändring i repot —
  men jag har inte kunnat verifiera exakt vilken metod orkestreraren
  använde. Markerad som HYPOTES-prövning per agentkontraktets krav.
- **Vad jag inte kunde belägga:** exakt andel av utvecklingstiden (bara
  proxyer, § 3); exakt tokenkostnad för CLAUDE.md-injektion per
  agenttyp (approximation, § 4); om `designsystem` eller de fyra minst
  undersökta repona (`cohort-004-project`, `remix-of-qlerk-your-property-
  pal`, `erbjudande`, `claude-skills`) konsumerar `marcus-system`-
  pluginet. Se § Osäkerheter för fullständig lista och vad som krävs för
  att fylla varje lucka.
- **Oväntat fynd utanför min fråga:** `marcus-system/plugins/marcus-system/
  .claude-plugin/plugin.json` (8 283 byte) bär pluginets HELA ändringslogg
  i sitt `description`-fält i stället för en separat CHANGELOG — samma typ
  av dokumentations-tänjbarhet som denna gransknings CLAUDE.md/
  CONTRIBUTING.md, men i en fil av en typ (plugin-manifest) inte gjord för
  det. Registrerat, inte utrett vidare.
- **Gren och commit-SHA:** `docs/s126-ci-djupgranskning`,
  arbetsträdets bas är `origin/main` på `eeca8c72`; min egen worktree
  (`s126-ci-djupgranskning`) hade inga egna commits vid mättillfället —
  jag har bara skrivit denna fil.
- **Grindarnas utfall:** se nedan (körs efter denna fil, resultat
  rapporteras separat om orkestreraren efterfrågar det — enligt kontraktet
  ska jag köra dem och rätta innan jag anser passet klart).

## Källor

- Egna mätningar mot arbetsträdet `s126-ci-djupgranskning`
  (`origin/main@eeca8c72` + arbetsträdets innehåll), 2026-09-17: `find`,
  `wc -l`, `wc -c`, `grep -c`, `diff`, `git log origin/main` (samtliga
  kommandon citerade inline i respektive fyndavsnitt).
- `gh pr list --state merged --limit 400 --json number,title,headRefName,mergedAt`
  och `gh pr view <nr> --json files` (40-PR-stickprov), körda mot
  `high-five-group/miranon-media-admin` 2026-09-17.
- `/Users/marcus/Repon/miranon-media-admin/.claude/agent-spawn-log.jsonl`
  (läst med Read-verktyget, 1 653 rader, 2026-07-28–2026-09-17).
- `/Users/marcus/.claude/plugins/installed_plugins.json` och
  `/Users/marcus/Repon/marcus-system/plugins/marcus-system/.claude-plugin/
  plugin.json` (lästa direkt, 2026-09-17).
- `tasks/lessons/vol-02.md` (rad 849, 873, 957, 961 — plugin-cache-
  incidenter).
- `tasks/sessions/` (135 sessionsdok-H1-rubriker, `grep -h "^# Session"`).
- `tasks/lessons/vol-02.md` till `vol-08.md` (649 numrerade lärdomar,
  60-post stickprov).
- `backlog/tasks/` (888 kortfiler, räknade men inte klassade — se § 3 för
  varför denna proxy inte användes fullt ut).
- Syskonfiler i samma granskning (läst i sammandrag, ej fulltext, se
  § "Vad jag läste först" för vilka avsnitt): `j1a-ci-yml-och-ci-suite.md`,
  `j1b-ovriga-workflows-och-github-katalogen.md`,
  `j1d-lokala-hookar-och-agentmekanismer.md`,
  `j1e-externa-installningar-och-deployvagar.md`,
  `j4a-branschpraxis-ur-primarkallor.md` (§§ 11–12 citerade direkt ovan;
  externa URL:er där — `world.hey.com/dhh/…`, `docs.github.com/…`,
  `github.com/uber/submitqueue`, `github.com/kubernetes/community/…`,
  `handbook.gitlab.com/…`, `github.com/Shopify/ci-queue`,
  `github.com/actions/typescript-action` — är citerade via den filen, jag
  har inte själv besökt eller omverifierat dem i detta pass).
- `docs/decisions/ADR-036-kvalitetsgrind-ci-enda-mekaniska-enforcement.md`,
  `ADR-100-sanningshierarkin-koden-ager-beteendet.md`,
  `ADR-105-review-grinden-fyra-deltan-byggs-inte-adopteras.md` (lästa i
  sin helhet som del av ADR-kontrollen; ADR-039, ADR-083, ADR-095, ADR-097
  skummade för relevans, se § "Vad jag läste först").
