---
owner: marcus803
updated: 2026-09-17
review_by: 2026-12-17
status: draft
---

# J2 — Branch-, worktree- och commitflödet: regler, spärrar och praxis

> **Proveniens:** avgränsat research-pass, Jobb 2 av CI-djupgranskningen
> (Session 126, 2026-09-17), beställt av orkestreraren enligt
> `tasks/sessions/bilagor/s126-uppdrag/uppdraget-verbatim.md` rad 108–129.
> Kört av modellen `claude-sonnet-5` ("Sonnet 5") i worktreen
> `/Users/marcus/Repon/miranon-media-admin/.claude/worktrees/s126-ci-djupgranskning`,
> gren `docs/s126-ci-djupgranskning`, ovanpå huvudkatalogens ögonblicksbild
> `origin/main` = `eeca8c72` (2026-09-08). Allt som beskrivs som "i dag"
> gäller den ögonblicksbilden plus vad som verifierats live mot GitHub
> 2026-09-17 (märkt med datum genomgående). Öppna PR:er beskrivs som
> pågående, aldrig som nuläge.

## Kort svar

Repot har **en enda mekanisk grind** för hela landningsvägen — GitHubs
ruleset `main-skydd` (id `19627609`) plus dess `merge_queue`-regel — och
**två git-specifika lokala spärrar** (hookar som körs på Marcus/orkestrerarens
dator innan ett kommando får köras): en som hindrar en session från att
skriva git i "fel" arbetskatalog, och en som hindrar `git push` under en
pågående ändringsomgång. **Allt annat i flödet — hur en gren namnges, hur en
commit avgränsas, om `git fetch` körs före ett arbete — är dokumenterad regel
eller ren praxis, inte teknik som stoppar ett misstag.** Det är inte en
brist: det är en medveten arkitektur där maskinen håller den enda invarianten
som MÅSTE hålla (inget obevakat kommer in i `main`) och lämnar resten åt
disciplin, granskning och en repererbar väg tillbaka (revert).

Den starkaste enskilda upptäckten i detta pass är att **arkitekturen redan
lever upp till sitt eget löfte oftare än den dokumenterande texten hinner
uppdateras**: en mekanism CLAUDE.md 2026-08-24 kallade "obetald skuld"
(automatisk städning av gamla lokala grenar) visade sig redan vara byggd och
körande sedan 2026-08-07 och automatiskt trådad in i det periodiska
underhållssvepet — dokumentationen hade bara inte hunnit ikapp. Se
§ "Motsägelse: den 'obetalda skulden' är redan betald".

Grennamngivningen är samtidigt det tydligaste exemplet på "ren praxis utan
regel": av 500 landade grenar (2026-08-22–2026-09-08) användes **15 olika
prefix** plus "inget prefix alls" — ingen fil i repot föreskriver ett schema.
Det kostar ingenting mekaniskt (inget läser prefixet för att fatta beslut),
men det är den punkt där en läsare snabbast ser att disciplinen bärs av
människor och agenter, inte av ett verktyg.

## Vad jag läste först

Jag inventerade `docs/research/` (167 filer) och `docs/decisions/` (132
ADR:er) innan jag sökte något nytt, och läste följande i sin helhet eller i
relevanta delar innan jag skrev en rad:

- **`CONTRIBUTING.md`** §§ "Pull Request-flöde", "Push-kadensen",
  "Landnings-ordningen" och "Revert-vägen" (rad 350–827) — repots mest
  auktoritativa, mest uppdaterade primärkälla för hela flödet. Den bär redan
  två skarpa reverter med mätt tidsåtgång, den fulla merge queue-historiken
  och den exakta `git revert -m 1`-mekaniken. Nästan inget i detta dokument
  motsäger den — merparten av mitt jobb var att FYLLA I regel/spärr/praxis-
  distinktionen den redan pekar mot, inte att hitta nya sanningar.
- **`.claude/agents/bygg-agent.md`** (318 rader, helt) — det enda dokument
  som faktiskt styr en subagents git-beteende i produktion.
- Sju ADR:er i sin helhet: `ADR-076` (merge-grinden), `ADR-090`
  (katalogägarskap), `ADR-096` (subagentens väntekontrakt), `ADR-097`
  (arbetsformens tillståndsbärare/push-ekonomi), `ADR-073` (parallella
  batch-pipelines), `ADR-086` (uppdragets premisser), `ADR-100` § 1
  (sanningshierarkin).
- Tre PreToolUse-hookar i sin helhet, som körande kod, inte som beskrivning:
  `scripts/deny-frammande-huvudkatalog.sh` (353 rader läst, ~1200 rader
  totalt), `scripts/deny-arbetsform-push.sh` (325 rader, helt), samt
  `scripts/check-merge-tree.sh` och `scripts/stada-grenar.sh` (delvis).
- Elva befintliga research-pass om isolering, T121-buggen, revert och
  parallellitet (se § Källor) — flera av dem gamla nog (2026-07-28 till
  2026-08-04) att jag omprövade deras giltighet i stället för att bara citera
  dem (se nedan).
- `tasks/lessons/vol-04.md`, `vol-05.md`, `vol-06.md` för konkreta
  isoleringsläckage-instanser.
- Syskonfilen `docs/research/ci-djupgranskning-2026-09-17/underlag/
  j1e-externa-installningar-och-deployvagar.md` (samma granskning, Jobb 1e),
  som samma dag live-verifierade GitHub-rulesetets sakinnehåll mot ADR-076
  och fann noll drift — jag återanvänder den mätningen i stället för att göra
  om den (se § Metod).

**Vad som var åldrat och omprövades riktat:** T121-forskningspasset
(2026-08-04) mätte buggen mot Claude Code **2.1.221**. Den här sessionen kör
**2.1.274** (sex veckor senare). Jag körde om den avgörande verifieringen
— `strings` mot den nu installerade binären — i stället för att anta att
fyndet höll (se § Fynd 4). Push-kadens-siffran "7–11 PR:er per dag"
(`docs/research/push-kadens-agent-arbetstrad-2026-07-26.md`, citerad i
`CONTRIBUTING.md`) visade sig vid egen mätning vara kraftigt föråldrad —
dagens takt är ungefär tre gånger högre. Jag lämnar den siffrans TOLKNING
till J3 (push-kadens är dennes delfråga) men rapporterar rätalet här eftersom
det påverkades av samma mätning som resten av detta dokument.

**Vad som redan var 80 % täckt och därför bara kompletterades:** hela
merge queue-mekaniken, revert-mekaniken och push-ekonomins princip står redan
utförligt i `CONTRIBUTING.md` och `CLAUDE.md`. Detta dokument destillerar dem
till en läsbar helhet, korsreferererar dem mot faktisk kod och mäter det som
inte redan var mätt (grennamn-fördelning, PR-storlek, gren-livslängd,
merge-metod, force-push-frekvens) — det duplicerar dem inte.

## Metod

Käll-hierarkin följdes strikt: körande kod och live-mätning mot GitHub före
prosa, prosa (ADR/CONTRIBUTING) före forskningspass, forskningspass daterade
efter ålder. Varje bärande påstående nedan är märkt med exakt en av:
**verifierad** (jag har själv sett koden eller mätt beteendet),
**starkt indikerad** (flera oberoende spår, men jag har inte sett själva
mekanismen), **osäker**, eller **ej verifierbar**.

Jag återanvände Jobb 1e:s live-läsning av GitHub-rulesetet (`gh api
repos/high-five-group/miranon-media-admin/rulesets/19627609`, 2026-09-17) i
stället för att göra om samma API-anrop — agentkontraktet ber uttryckligen om
sparsamhet mot GitHubs API när flera sessioner delar den. Allt annat
empiriskt tal i detta dokument (PR-korpus, gren-livslängd, merge-metod,
force-push-stickprov, hook-testsviter) mätte jag själv, 2026-09-17, med
kommandona citerade inline.

## Grundbegrepp, för den som inte kodar

Referenspersonen för detta avsnitt är någon som aldrig skrivit ett
git-kommando. Termerna förklaras här en gång och används sedan rakt av.

- **Gren (branch):** en egen, namngiven kopia av kodens historik som någon
  kan ändra utan att röra huvudversionen. Som ett separat kladdblock bredvid
  originalet — ändringarna syns bara i kladdblocket tills någon för över dem.
- **Commit:** en sparad ögonblicksbild av en ändring, med ett meddelande som
  förklarar vad och varför. Motsvarar att spara en ny version av ett
  dokument med en kommentar om vad som ändrades.
- **Worktree (arbetsträd):** en egen mapp på disken där en gren ligger
  uppcheckad och redigerbar, samtidigt som andra worktrees för SAMMA repo
  finns i andra mappar. Flera personer kan då jobba i samma bok utan att
  sitta på samma sida.
- **Huvudkatalog:** den ursprungliga mappen där repot först klonades ner —
  den "riktiga" boken, som alla worktrees är utdrag ur.
- **`main`:** grenen som räknas som "den skarpa, aktuella versionen". Allt
  som ska bli en del av produkten måste till slut hamna här.
- **Pull request (PR):** en formell begäran om att föra över en grens
  ändringar till `main`, öppen för granskning innan den går igenom.
- **Merge (sammanfogning):** själva handlingen att föra över en grens
  ändringar till en annan gren, oftast till `main`.
- **Merge queue (sammanfogningskö):** ett system på GitHub som tar emot
  flera PR:er som väntar på att landa och bygger och testar dem i tur och
  ordning, en efter en, mot den senaste versionen av `main` — så att två
  personers ändringar aldrig råkar krocka osynligt.
- **Ruleset:** GitHubs regelverk för en gren — vilka krav som måste vara
  uppfyllda innan något får landa där (t.ex. "testerna måste vara gröna").
- **Hook:** ett litet program som körs automatiskt precis före eller efter
  en handling (t.ex. innan ett kommando får köras) och som kan stoppa den.
- **Rebase:** att skriva om en grens historik som om den hade börjat från en
  senare punkt i `main` — nämns här för att förklara varför repot MEDVETET
  undviker det (se § Undantagen).
- **Revert:** att skapa en NY ändring som river tillbaka en tidigare
  ändring, i stället för att radera historiken. Historiken visar då både
  misstaget och rättelsen.
- **Force-push:** att skriva över en grens historik på GitHub med en ny
  version, i stället för att lägga till ovanpå den gamla. Kan förstöra
  andras arbete om det görs fel, därför ovanligt i detta repo (se § Fynd).

## Flödet steg för steg

Var och en av uppdragets tolv steg, med källa. Se § "Diagram" för
helheten i bild och § "Trekolumnstabellen" för en samlad regel/spärr/praxis-
översikt.

### 1. Skapar och namnger grenar

En bygg-agent skapar aldrig en gren "för hand" — dess `isolation: worktree`
i frontmatteln (`.claude/agents/bygg-agent.md` rad 4) gör att harnesset
(Claude Codes egen körmiljö) skapar worktreen och grenen åt den när
agenten spawnas. Filen instruerar bara: **"Egen gren, beskrivande namn."**
(`bygg-agent.md` rad 179) — inget prefix-schema, ingen längdgräns, inget
krav på att koppla grennamnet till ett kort-ID. **Verifierad.**

`ADR-073` § beslut 2 föreskriver ETT eget schema, `task/<kort-id>`, men
uttryckligen bara för sin egen kontext (parallella batch-pipelines där
orkestreraren spawnar flera `do-work`-agenter samtidigt) — inte som en
repo-generell regel. **Verifierad**, via direkt läsning.

Jag sökte uttryckligen efter en dold, mer generell regel
(`grep -rn "prefix\|grennamn\|branch.*namn" docs/decisions/*.md
.claude/agents/*.md CONTRIBUTING.md CLAUDE.md`) och hittade ingen. **Frånvaro
av bevis här är i sig ett resultat**, inte en lucka i min sökning: den
mätta spridningen i praktiken (nedan) är precis vad avsaknaden av regel
förutsäger.

**Praxis, mätt** (500 senast landade PR:er, `gh pr list --state merged
--limit 500 --json headRefName …`, 2026-09-17, spann 2026-08-22–2026-09-08):

| Prefix | Antal | Andel |
|---|---|---|
| `docs/` | 253 | 50,6 % |
| `fix/` | 72 | 14,4 % |
| `feat/` | 67 | 13,4 % |
| `chore/` | 40 | 8,0 % |
| `task/` | 30 | 6,0 % |
| (inget prefix, t.ex. `task-442-…`) | 22 | 4,4 % |
| `ci/` | 4 | 0,8 % |
| `dependabot/` | 3 | 0,6 % |
| `visual-baselines/`, `fynd/` | 2 vardera | 0,4 % vardera |
| `wip/`, `test/`, `proto/`, `lessons/`, `design/` | 1 vardera | 0,2 % vardera |

**Femton distinkta prefix plus en "inget prefix"-kategori** — betydligt fler
än de "minst fem" orkestreraren observerade via `git worktree list`.
**Verifierad.**

### 2. Väljer eller byter gren

En bygg-agent byter aldrig gren i huvudkatalogen — dess kontrakt förbjuder
`git checkout` mot en sökväg utanför den egna worktreen (`bygg-agent.md` rad
14–15). En människa eller orkestreraren i huvudkatalogen väljer gren fritt,
men äger då huvudkatalogens "plats" — se § Parallella sessioner nedan för
vad det ägandet betyder.

### 3–4. Använder worktrees / isolerar parallella agenters arbete

Se eget avsnitt nedan (§ Parallella sessioner och agenter) — frågan är
central nog för hela uppdraget att den förtjänar sin egen genomgång i
stället för en rad här.

### 5. Gör lokala commits

**Ingen mekanisk spärr finns på VAD som får committas lokalt** — commit är,
enligt `ADR-097`s princip, "gratis": det kostar ingen CI, ingen kö-plats,
och kan göras hur ofta som helst. `bygg-agent.md` instruerar path-scopad
`git add` (nästa steg), men själva commit-kommandot är obevakat.

**Ett undantag, tekniskt bevisat:** `.githooks/pre-commit` körs vid VARJE
lokal commit i detta repo (aktiverat via `git config core.hooksPath
.githooks`, satt av `package.json`s `postinstall`). Den auto-bumpar
`updated:`-fältet i styrande dokuments YAML-frontmatter, självläker en
skadad `core.hooksPath` (se § Fynd 4, T121), och kör vid behov en
staging-preflight-vakt. Detta är alltså en teknisk spärr — men den styr
FILINNEHÅLL, inte grenval eller commit-avgränsning. **Verifierad**, läst i
sin helhet.

### 6. Avgränsar vad som ingår i en commit

**Dokumenterad regel, ingen mekanisk spärr:** `bygg-agent.md` rad 182–183:
"`git add` är **path-scopad**, alltid. `git commit` committar hela indexet,
och DoD kräver noll orelaterade filer i diffen." Ingenting i repot hindrar
ett `git add -A`; disciplinen bärs av instruktionen plus (för PR:er som
hamnar i kön) `review-agent`s granskning i efterhand, och av Marcus egen
läsning av diffen. **Verifierad** som prosa; **ej verifierbar** som teknisk
spärr — ingen sådan hittades.

Global `CLAUDE.md` skärper samma regel ("Prefer adding specific files by
name rather than `git add -A`") — samma dokumenterade regel, två nivåer
(hub + spoke), noll mekanik i något av lagren.

### 7. Hanterar andra agenters eller utvecklares samtidiga ändringar

Tre olika mekanismer täcker tre olika delar av denna fråga, och det är lätt
att blanda ihop dem:

1. **Merge queue** löser ordningen mellan REDAN ÖPPNA, klara PR:er — den
   ser aldrig två agenter som fortfarande skriver kod.
2. **Katalogägarskaps-hooken** (`deny-frammande-huvudkatalog.sh`, se
   § Parallella sessioner) löser konflikten om VEM som får skriva git i
   HUVUDKATALOGEN just nu.
3. **`check-merge-tree.sh`** (ADR-073 § beslut 4) löser konflikten mellan
   filer i en PARALLELL BATCH innan PR:n ens öppnas — men bara i den
   orkestrerar-styrda batch-kontexten, inte generellt. Jag verifierade
   direkt i skriptet (`scripts/check-merge-tree.sh` rad 1–60) att det körs
   av orkestreraren manuellt efter en batch-agents push, aldrig av CI.
   **Verifierad.**

**Ett forskningspass** (`docs/research/kodfils-partitionering-parallella-
agenter-2026-08-04.md` § Dom) konstaterar att den bredare frågan — vad
händer om två AD HOC-parallella agenter (inte en Marcus-beordrad batch) rör
samma fil — saknar ett anspråksregister helt: mekanismen finns bara när
Marcus explicit beordrat en partitionerad batch. Utanför den kontexten är
det enda skyddsnätet merge queue (upptäcker konflikten VID landning, för
sent för att förebygga dubbelarbete) och `review-agent` (upptäcker den
FÖRE armering, men efter att båda agenterna redan lagt ner arbetet).
**Starkt indikerad** — passet är sex veckor gammalt, men jag hittade ingen
nyare mekanism som motsäger slutsatsen.

### 8. Pushar grenar

Se § Push-kadens nedan (J3:s delfråga) för RYTMEN. Här: MEKANIKEN.

**Teknisk spärr, verifierad genom läsning av körande kod:**
`scripts/deny-arbetsform-push.sh` nekar `git push` (alla former: direkt,
kedjad med `&&`/`;`/`|`, eller gömd i en kommandosubstitution) om en
per-arbetsträd tillståndsfil (`.claude/arbetsform-tillstand.json`) bär en
arbetsform som står i `.arbetsform-push-policy.conf`s förbjuden-lista.
I dag innehåller den listan **exakt en post: `"iteration"`** — dvs. push
under ett pågående iterationsvarv (`prototype`-skillens § 5) är mekaniskt
blockerad; push i alla andra lägen släpps igenom. Jag körde skriptets
testsvit live: **25 passerade, 0 fallerade, exit 0** (`bash
scripts/test-deny-arbetsform-push.sh`, 2026-09-17). **Verifierad.**

Push till `main` direkt är dessutom omöjlig oavsett arbetsform — GitHubs
ruleset avvisar den innan hooken ens hinner spela roll (se § 11).

### 9. Öppnar pull requests

`gh pr create`, alltid — direktpush till `main` är avvisad, så en PR är den
enda vägen in. `bygg-agent.md` rad 185–199 lägger en regel ovanpå: en PR
som INTE ska armeras omedelbart (medveten parkering, väntar på ett beslut)
ska skapas som `--draft` DIREKT, aldrig lämnas öppen och oarmerad — en
"clean", oarmerad, icke-draft PR är, för varje bevakningsmekanism i repot,
omöjlig att skilja från en glömd PR. **Verifierad**, prosa utan mekanisk
enforcement (ingenting hindrar att skapa en icke-draft PR ändå), men med
en dokumenterad, namngiven lärdom bakom sig
(`tasks/lessons.d/parkerad-pr-utan-draft-ar-oskiljbar-fran-glomd.md`).

### 10. Uppdaterar eller synkroniserar grenar

**Dokumenterad regel, ingen kvarvarande mekanisk anledning:** `gh pr
update-branch` (att hämta in `main`s senaste ändringar i en öppen PR) ska
köras av orkestreraren, aldrig av en agent, och aldrig mot en gren vars
bygg-agent fortfarande arbetar (`CONTRIBUTING.md` rad 457–459). Skälet är
inte längre "annars blir PR:n BEHIND" (merge queue har gjort BEHIND
strukturellt omöjligt sedan 2026-07-29) utan att en push till PR-grenen
avbryter dess pågående CI-körning — mätt live: samma incident inträffade
två gånger i en session (S91) innan regeln skärptes, en gång **12 minuter
in i en grön körning**. **Verifierad** via `CONTRIBUTING.md`, som citerar
den incidenten med källa.

En kö-satt gren KAN inte uppdateras alls via `gh` — push avvisas med
felkoden `GH006` (git-native, inte en repo-specifik spärr) så länge PR:n
ligger i kön. Vägen ut är en GraphQL-mutation (`dequeuePullRequest`) utanför
`gh`s vanliga yta — skarpt prövad en gång, dokumenterad i
`docs/research/task-99-dequeue-enqueue-live-test-2026-08-01.md`.
**Verifierad**, indirekt via det tidigare passets citerade mätning.

### 11. Mergar till `main`

**Den enda punkten i hela flödet med en riktig, obestridlig teknisk spärr.**
GitHubs ruleset `main-skydd` (id `19627609`) — live-verifierat 2026-09-17 av
Jobb 1e i samma granskning, jag återanvänder den mätningen i stället för att
duplicera API-anropet:

| Egenskap | Värde (mätt 2026-09-17) |
|---|---|
| `enforcement` | `active` |
| `bypass_actors` | `[]` — tom, ingen gräddfil för någon |
| `current_user_can_bypass` | `never` — även repo-admin |
| `allowed_merge_methods` | `["merge"]` — squash och rebase avstängda på RULESET-nivå |
| `required_status_checks` | `"CI Passed or Skipped"`, låst till `integration_id 15368` (GitHub Actions-appen) |
| `strict_required_status_checks_policy` | `false` (ändrad från `true` 2026-08-05, oförändrad sedan dess) |
| `merge_queue.grouping_strategy` | `ALLGREEN` |
| `merge_queue.max_entries_to_merge` | `3` |
| `merge_queue.check_response_timeout_minutes` | `60` |
| Klassisk branch protection på `main` | Finns INTE (`404`) — rulesetet är den enda mekanismen |

**Noll drift funnen** mellan detta live-läge och `ADR-076`s dokumenterade
beslut — ruleset-historiken visar ingen ändring sedan 2026-08-05, 42 dagar
före mätningen. Ett litet, **kosmetiskt** fynd (Jobb 1e, ej centralt för
denna fråga men värt att nämna): repo-nivåns `allow_squash_merge` och
`allow_rebase_merge` står fortfarande `true`, trots att rulesetet
faktiskt filtrerar bort dem vid en verklig merge — en framtida borttagning
av rulesetet skulle alltså tyst återaktivera dem som valbara, utan att
någon rört repo-inställningen.

Jag mätte merge-metoden själv i den faktiska historiken:
`git log origin/main --first-parent --format=%s -80` gav **80 av 80** rader
i formen `Merge pull request #N from …`. **Noll** avvikande
`Merge branch 'main' into …`-poster och **noll** direkta,
icke-merge-commits i detta fönster. **Verifierad**, egen mätning
2026-09-17.

Armering: `gh pr merge --auto`, **utan strategiflagga** — kön äger
strategin, och `gh` avvisar formen med `! The merge strategy for main is
set by the merge queue` om en flagga anges. Exitkoden avslöjar INTE om det
gick bra: samma avvisningstext ger `exit 1` för en oarmerad PR och `exit 0`
för en redan armerad — `CONTRIBUTING.md` dokumenterar båda mätta fallen med
PR-nummer. **Dokumenterad regel plus tekniskt bevisat kvirk**, inte en ren
spärr i sig.

**Vem armerar:** en bygg-agent armerar bara om uppdraget UTTRYCKLIGEN ber
den göra det. Normalfallet är att den öppnar PR:n och rapporterar —
orkestreraren granskar diffen (kön ser inte "två diffar som mergar rent och
ändå är fel tillsammans", bara mekaniska konflikter) och armerar i sitt
eget svep. Sedan `ADR-105` kan orkestreraren dessutom spawna en oberoende
`review-agent` i FÄRSK kontext mellan push och armering — `HÖG` risknivå
blockerar armering formellt tills Marcus sett utlåtandet.

### 12. Återställer eller revertar felaktiga förändringar

Se eget avsnitt nedan (§ Återställning) — samma skäl som steg 3–4.

## Trekolumnstabellen — regel, spärr, praxis, per steg

| Steg | Dokumenterad regel | Teknisk spärr | Faktisk praxis |
|---|---|---|---|
| 1. Skapa/namnge gren | "Egen gren, beskrivande namn" (`bygg-agent.md`); `task/<kort-id>` bara för ADR-073:s batchar | Ingen | 15 prefix + "inget prefix", `docs/` dominerar (50,6 %) |
| 2. Välja/byta gren | Agenten får aldrig lämna sin worktree | `git checkout`/`switch` mot huvudkatalogen nekas för fel ägare (se steg 3–4) | Hålls |
| 3–4. Worktrees/isolering | `ADR-090` beslut 2 (senare session tar worktree) | `deny-frammande-huvudkatalog.sh` + `katalogagarskap-markor.sh` (se eget avsnitt) | Läckt tre gånger dokumenterat (S96, S91) innan mekanism byggdes |
| 5. Lokal commit | Fri, "gratis" (`ADR-097`) | `.githooks/pre-commit` styr filinnehåll, inte grenval | Commit ofta, per litet steg |
| 6. Avgränsa commit | Path-scopad `add`, noll orelaterade filer | Ingen | Beror på disciplin + granskning i efterhand |
| 7. Samtidiga ändringar | `ADR-073` claims-check (bara i batch-kontext) | `check-merge-tree.sh` (bara i batch-kontext) | Utanför batch: inget skydd förutom kön och `review-agent` |
| 8. Push | Push vid färdig enhet, ej per varv (`ADR-097`) | `deny-arbetsform-push.sh`, nekar under `"iteration"` | Se § Push-kadens (J3) |
| 9. Öppna PR | Draft om ej redo att armeras | Ingen | Hålls, med en namngiven lärdom om undantag |
| 10. Uppdatera gren | Bara orkestreraren, aldrig mot en aktiv gren | `GH006` hindrar push mot en kö-satt gren (git-nativ, ospecifik) | Hålls sedan skärpning efter S91-incidenten |
| 11. Merge till `main` | `ADR-076` | GitHubs ruleset + merge queue — **den enda obestridliga spärren i hela flödet** | 80/80 mätta landningar via kö, noll avvikelse |
| 12. Revert | `CONTRIBUTING.md` § Revert-vägen | PR-krav gäller även reverten (ingen gräddfil) | Övad två gånger, en gång skarpt mot `main` |

## Diagram — en ändrings väg från agentens första rad till landad commit

```mermaid
flowchart TD
    A["Orkestreraren spawnar en bygg-agent<br/>(isolation: worktree i agentens frontmatter)"] --> B["Harnesset skapar en ny worktree<br/>+ en ny gren, checkad ut åt agenten"]
    B --> B2{{"Sidoeffekt: Claude Codes egen kod\nskriver om delad core.hooksPath (T121-buggen)"}}
    B --> C["Agenten arbetar i sin egen mapp:\nläser kortet, kodar, path-scopad git add"]
    C --> D["Lokal commit\n(.githooks/pre-commit körs: självläker hooksPath,\nbumpar frontmatter-datum)"]
    D -->|"fler steg i samma arbetsenhet"| C
    D --> E["git push\n(deny-arbetsform-push.sh kollar:\npågår ett push-förbjudet iterationsvarv?)"]
    E -->|"ja, nekad"| C
    E -->|"nej, släpps igenom"| F["gh pr create\n(direktpush till main är omöjligt — ruleset)"]
    F --> G{{"Uppdraget sa åt agenten\natt armera själv?"}}
    G -->|"nej (normalfall)"| H["Agenten rapporterar till orkestreraren\noch avslutar sin tur"]
    G -->|"ja, uttryckligt"| K["Agenten armerar: gh pr merge --auto"]
    H --> I["Orkestreraren granskar diffen\n(kön ser inte 'rent men fel ihop')"]
    I --> J["Ev. review-agent i FÄRSK kontext\n(ADR-105) — HÖG risk blockerar armering"]
    J --> K
    K --> L["PR:n går in i GitHubs merge queue\n(bygger mot main + posterna före den)"]
    L -->|"röd i kön"| M["Posten sparkas ut,\narmeringen KONSUMERAS — måste armeras om"]
    L -->|"grön i kön"| N["Merge-commit landar i main\n(alltid formen: Merge pull request #N)"]
    N --> O{{"Fel upptäcks i efterhand"}}
    O --> P["Revert-väg: ny gren, git revert -m 1,\nny PR, samma köregler — ingen gräddfil"]
    P --> L
```

## Parallella sessioner och agenter — isoleringsmodellen

Detta är kärnfrågan i uppdraget, och den har flest lager. Här beskrivs
modellen i sin helhet, inte bara den mekanism som råkar synas först.

### Vad som delas, och vad som inte gör det

Alla worktrees under `.claude/worktrees/` i ett repo delar **samma
`.git`-katalog** (den "delade checkouten") i huvudkatalogen. Det betyder att
följande resurser är **globalt delade**, inte per-worktree:

- **git-config** (`.git/config`) — inklusive `core.hooksPath` (roten till
  T121-buggen, § Fynd 4).
- **Stash-stacken.** `bygg-agent.md` förbjuder uttryckligen `git stash`:
  "stash-listan delas av ALLA worktrees under samma `.git`" — mätt
  2026-08-28: en agents `stash pop` tog en ANNAN sessions post. Parkering
  sker i stället med `git diff > fil` eller en WIP-commit. **Verifierad**,
  citerad med datum i källfilen.
- **`FETCH_HEAD`** och alla remote-tracking-refs (`origin/main` m.fl.) —
  ett `git fetch` i en worktree uppdaterar bilden av fjärren för ALLA
  worktrees.
- **Backlog-kortens skapande-lås.** Ett globalt fillås
  (`<git-common-dir>/backlog.md/locks/create`, 30 sekunders timeout) gör att
  flera samtidiga `task create`-anrop konkurrerar om samma lås — mätt 2/8
  lyckade anrop vid åtta samtidiga agenter, ett kort tog **513 sekunder**
  att skapa under en tät fleet-körning (`docs/research/backlog-
  kortskapandets-flaskhals-2026-08-26.md`). Detta är inte ett git-lås i sig,
  men det är en direkt konsekvens av samma "en delad checkout, många
  worktrees"-topologi.

**Vad som INTE delas:** varje worktrees arbetsträd (filerna på disk) och
index (det som är "staged" för nästa commit) är helt egna.

### Katalogägarskapet — ägarlappen

En session som vill köra en git-SKRIVNING i **huvudkatalogen** (aldrig i en
worktree — där gäller inget av detta) prövas av
`scripts/deny-frammande-huvudkatalog.sh`, en hook som körs FÖRE varje
Bash-kommando. Jag läste skriptets fulla logik (rad 1–835 av totalt
~1200):

1. Är kommandot en git-SKRIVNING? Policyn (`.katalogagarskap-policy.conf`
   rad 124–147) räknar upp **22 underkommandon** som skrivande (`merge`,
   `switch`, `checkout`, `commit`, `rebase`, `reset`, `push`, `pull`,
   `cherry-pick`, `revert`, `stash`, `am`, `apply`, `restore`, `branch`,
   `tag`, `clean`, `gc`, `prune`, `add`, `rm`, `mv`) och undantar `fetch`
   uttryckligen ("additiv på refs … två sessioner kan fetcha samtidigt utan
   att störa varandra"). **Verifierad**, exakt antal räknat i filen.
2. Riktas skrivningen mot HUVUDKATALOGEN specifikt (inte en worktree)? Sedan
   `TASK-322` (2026-08-28) upplöses målkatalogen med gits egen
   `rev-parse --git-dir`/`--git-common-dir`, inte en textjämförelse — en
   tidigare textbaserad variant hade flera dokumenterade falska-positiv-
   klasser (t.ex. att en agents EGEN worktree-sökväg råkar innehålla
   huvudkatalogens sökväg som delsträng, eftersom worktrees ligger UNDER
   huvudkatalogen: `<huvudkatalog>/.claude/worktrees/<namn>`).
3. Äger DENNA session huvudkatalogen just nu? En "ägarlapp"
   (`<git-common-dir>/katalogagarskap-agare.json`) bär session-ID, PID och
   PID-starttid. Jag läste den LIVE i denna session (2026-09-17): den
   pekar på en ANNAN, pågående session (`session_id: f6108480-…`, `pid:
   2258`, satt `08:49:07Z` samma dag) — precis det uppdragets "KÄLLMÄRKTA
   FAKTA" påstod, och jag verifierade det direkt i stället för att ta det
   på tro. **Verifierad**, live disk-läsning.
4. Lever den ägande processen fortfarande? (`kill -0` + jämförelse av
   processens starttid, ett skydd mot att en PID hinner återanvändas av en
   helt annan process innan lappen prövas nästa gång.)

**Beslutet:** en bevisligen levande ägare NEKAR ALLTID, oavsett hur länge
den varit tyst — ett tidsbaserat övertagande av en "tyst men levande" ägare
övervägdes och FÖRKASTADES uttryckligen av Marcus (citerat i skriptets eget
källhuvud: *"det kan ju bara vara så att jag behöver gå och bajsa, och när
jag kommer tillbaka så har vi ingen katalog att stå på då?"*). En bevisligen
DÖD ägare släpps tyst igenom, med en varning (inte en blockering) om
huvudträdet bär ocommittat arbete. Formen är **`deny`**, inte `ask` — ändrad
från `ask` 2026-08-04 när liveness-kontrollen gjorde skillnaden mätbar i
stället för gissad. **Verifierad**, läst direkt i skriptets logik och
källhuvud.

### Var isoleringen har läckt historiskt

Modellen är yngre än repot, och den byggdes som svar på konkreta läckage —
inte i förväg. Fyra mätta instanser, i kronologisk ordning:

1. **2026-07-28 (S91), två fel på två timmar, av orkestreraren själv.**
   Ett backlog-kort skapades medan en subagent arbetade i huvudkatalogen —
   på DERAS gren. Hade agenten kört ett svepande `git add` för sitt eget
   kort hade det främmande kortet följt med in i deras PR. Samma session,
   samma timme: en docs-PR landades medan en tyngre PR låg i luften och
   armerad — den senare hamnade i `BEHIND` (detta var FÖRE merge queue
   fanns) trots att lärdomen redan stod skriven sedan en tidigare session.
   Åtgärd: landa alltid ur egen worktree när huvudkatalogen är upptagen; en
   `git status --short`-kontroll före varje `git add`
   (`tasks/lessons/vol-05.md` rad 773–799).
2. **2026-07-30/31 (S91), en bygg-agent commitade i huvudkatalogen trots
   förbud, i en fail-open-lucka i just den isoleringsspärr som skulle
   hindrat det.** Agentens egen worktree hade INGEN spårad ändring (bara
   en gitignorerad `node_modules`-symlänk) och kvalificerade därför för
   harnessets automatiska borttagning av "oförändrade" worktrees. När
   sessionen bröts av en API-gräns och återupptogs föll `cwd` tillbaka till
   huvudträdet — och isoleringsspärren, som tidigare vägrat kommandon i
   samma session, slutade fälla i samma ögonblick worktreen försvann.
   Exponeringsfönstret var **4 minuter 13 sekunder** (mätt ur reflogen).
   Detta är, med lärdomens egen rubrik, "en isolerings-spärr som upphör med
   det den skyddar är fail-open" (`tasks/lessons/vol-05.md`, L418).
   **Verifierad**, läst i sin helhet.
3. **2026-08-02/2026-08-28 (S94), lokala grenar åldras tyst i långlivade
   worktrees.** En granskning jämförde lokalt `git diff main..gren` (4
   filer, 1 618 rader) mot GitHubs egen fillista för samma PR (exakt 1
   fil) — den lokala `main` stod kvar på worktreens FÖDELSE-SHA medan
   `origin/main` hunnit fem landningar längre. Ingen mekanisk spärr fångar
   detta; lärdomen (`L442`) föreskriver att alltid diffa mot `origin/<bas>`
   efter en färsk `fetch`, aldrig mot den lokala grenen rakt av.
4. **2026-08-04 (T121), en extern orsak som förstärks av just detta
   arbetssätt.** Se § Fynd 4 nedan — detta är inte ett läckage MELLAN
   agenter, utan en bieffekt av HUR OFTA worktrees skapas i denna miljö.

### Vad som INTE är byggt än

`ADR-073`s claims-check (att en orkestrerad batch deklarerar vilka filer
varje agent FÅR röra, innan spawn) och `check-merge-tree.sh`-grinden gäller
bara när Marcus explicit beordrat en partitionerad batch. **Ad hoc-
parallellitet — flera agenter som råkar köra samtidigt utan en sådan
beordrad partition — har inget anspråksregister att pröva mot.** Ett
forskningspass konstaterade detta explicit 2026-08-04 och rekommenderade
att mekanisera den redan beslutade ADR-formen snarare än att bygga något
nytt (`docs/research/kodfils-partitionering-parallella-agenter-2026-08-04.md`
§ Dom). **Starkt indikerad** att gapet fortfarande finns: jag hittade ingen
nyare ADR eller skript som stänger det.

## Motsägelse: den "obetalda skulden" är redan betald

`CLAUDE.md` § "Kortnummer" (dagens repo-kopia, ej ändrad av mig) skriver,
med källa `TASK-310` (2026-08-24): *"ingen mekanism raderar en lokal gren
efter att en worktree-isolerad agent landat sin PR … Ett återkommande
lokalt gren-svep … är flaggat men INTE byggt i detta pass."*

Jag verifierade detta mot körande kod och fann att påståendet är
**föråldrat, inte fel för sin egen tid**: `scripts/stada-grenar.sh`
(`git log --follow` visar commit `b7ee51e3`, **2026-08-07** — TASK-152,
alltså SEXTON dagar FÖRE TASK-310s notering) städar redan lokala grenar
som är mergade i bas-grenen, bakom fyra oberoende skydd (bas-grenen
raderas aldrig · aktuell gren raderas aldrig · en gren uppcheckad i NÅGON
worktree raderas aldrig · en config-driven skyddslista). Och sedan en
senare ändring (`scripts/heartbeat-svep.sh` rad 259, 436–472,
`HEARTBEAT_STADA_GRENAR_INTERVALL=1800` i `.heartbeat-svep-policy.conf`)
körs skriptet **automatiskt högst en gång per 1 800 sekunder (30 minuter)**
som en del av det periodiska underhållssvepet — inte bara manuellt på
begäran. Skriptets eget källhuvud citerar en skarp körning **2026-08-28**
där 162 av 203 grenar korrekt identifierades som mergade.

**Detta är alltså ett FYND, inte en gissning:** en styrande text påstår
att något saknas, samtidigt som koden redan gör det, automatiskt, sedan
tre veckor innan påståendet skrevs. Den troliga förklaringen är att
`TASK-310`s notering skrevs mellan `stada-grenar.sh`s tillkomst (manuellt
verktyg, 2026-08-07) och dess senare intrådning i det automatiska svepet —
och att `CLAUDE.md` aldrig uppdaterades när den automatiska koppling
byggdes. **Verifierad**, både via `git log --follow` på skriptfilen och
via läsning av `heartbeat-svep.sh`s körande logik.

## Fynd 4 — T121-buggen, omprövad mot dagens verktygsversion

Detta fynd förtjänar en egen kort sektion eftersom det är det tydligaste
exemplet i hela passet på principen "mät hellre än citera": en sex veckor
gammal, mycket detaljerad källa fanns redan, men i stället för att bara
återge den körde jag om dess mest centrala verifieringssteg.

**Bakgrund (från källan, `t121-…2026-08-04.md`):** Claude Codes egen
worktree-skapande kod läser huvudrepots `core.hooksPath`, gör värdet
ABSOLUT om det var relativt, och skriver tillbaka det med fel `cwd` (den
NYA worktreen, utan `--worktree`-flaggan) — vilket, eftersom linkade
worktrees delar konfigurationsfil, landar i den DELADE `.git/config`.
Källan verifierade detta mot tre publika, öppna buggrapporter i
`anthropics/claude-code` (`#27474`, `#66993`, `#72714`) OCH mot den då
installerade binären (`v2.1.221`) via `strings`, och fångade två spontana
"flip" (relativ→absolut) live under ett sex minuter långt mätfönster utan
att själv köra ett enda git-kommando.

**Min ompröving (2026-09-17):** jag körde `claude --version` och fick
**`2.1.274`** — en annan, senare version än källans `2.1.221`. Jag körde
`strings -a <claude.exe> | grep -c "Configured worktree to use hooks from
main repository"` mot den nu installerade binären och fick **2 träffar** —
exakt samma loggsträng som källan citerade. Buggen finns alltså KVAR,
oförändrad i sitt yttre beteende, sex veckor och minst en versionsuppgradering
senare. **Verifierad**, egen mätning, inte en upprepning av källans.

Mitigeringen på repots sida (`.githooks/pre-commit`s självläkande vakt,
landad som PR #723 samma dag buggen identifierades) är oförändrad och
fungerar enligt sitt eget kontrakt: jag läste den i sin helhet och den
läker värdet vid varje lokal commit, med ett känt kvarstående fönster
(exakt en commit per worktree-skapelse kan köra huvudkatalogens hook-kopia
i stället för sin egen, innan läkningen hinner ikapp).

**Konsekvens för detta dokuments risklista:** eftersom mekanismen inte går
att patcha från repots sida (`claude` är sluten, kompilerad kod), och
eftersom den skalar med ANTALET worktree-skapelser (19 samtidiga worktrees
mätt av orkestreraren denna session, mot 24 i källans mätning sex veckor
tidigare — samma storleksordning), kvarstår risken som strukturell och
oberoende av vad detta repo gör. Den enda handlingsbara slutsatsen är att
INTE isolera i onödan — vilket är exakt vad `research-pass`-agentens egen
kontrakt (i denna sessions systemprompt) redan instruerar: "Isolera efter
behov, inte som default."

## Återställning — revert-vägen

**Ja, det finns en beprövad rutin — och den har körts skarpt, inte bara
övats.** Detta är inte en möjlighet på papper.

### Mekaniken

Varje landning i `main` är en merge-commit med två föräldrar. En revert
måste peka ut FÖRÄLDER 1 (`main`-linjen) med flaggan `-m 1` — git vägrar
annars gissa (`exit 128`). Att av misstag använda `-m 2` är TYST FARLIGT:
kommandot lyckas (`exit 0`) men ändrar noll rader, och felet ligger kvar.
Detta beror på att rulesetet bara tillåter merge-metoden `["merge"]`
(aldrig squash/rebase) — ett revert-recept skrivet för squash-landningar
är fel recept för detta repo. **Verifierad**, citerat med exakta
kommandon och exitkoder ur `CONTRIBUTING.md` § Revert-vägen.

En revert går via **exakt samma PR-flöde och samma kö** som varje annan
landning — ingen gräddfil, inte ens vid brådska. `ADR-076` beslut 2 gör
detta obestridligt (`bypass_actors: []`, `current_user_can_bypass: never`).
Den enda nödvägen är att synligt inaktivera hela rulesetet, vilket är ett
beslut för Marcus, aldrig för en agent, och som lämnar spår i rulesetets
egen historik.

### Att det faktiskt gjorts, och hur lång tid det tog

**Övning (2026-07-28, PR #370, gren i luften, aldrig landad i `main`):** en
avsiktlig no-op (en HTML-kommentar) skapades, mergades in i en övningsgren
och reverterades. Tre kontrollerade delförsök: utan `-m`-flagga
(`exit 128`, kommandot vägrar), med `-m 2` (`exit 0`, **noll rader
ändrade** — den tysta fällan), och med `-m 1 --no-edit` (korrekt revert,
träd-identitet mot utgångsläget bekräftad via `git diff --stat`).

**Skarp körning (samma dag, mot RIKTIG `main`):** samma no-op landades i
`main` via PR #374 (merge-commit `ed51b95`) och backades via PR #375
(revert-commit `745ec55`, merge-commit `894a3bd`). Jag återfann båda
merge-commitsen i den faktiska historiken (`git log --grep="revert" -i`)
och bekräftade att `894a3bda` är en riktig `Merge pull request #375`-post.
Mätt tidsåtgång:

| Led | Tid |
|---|---|
| No-op påbörjad → revert-commit skapad | 118 sekunder |
| Revert-commit → landad merge-commit i `main` | 25 minuter 16 sekunder |

**Det andra talet är INTE revert-vägens naturliga kostnad** — nästan hela
tiden var kö-väntan på en global staging-mutex som post-merge-lagret då
höll, en brist som senare (`TASK-73`) åtgärdades genom att post-merge-
körningen ärver samma docs/kod-klassning som PR-grinden. `CONTRIBUTING.md`
mäter dagens förväntade tid via en separat, senare 45-PR-mätning:
**≈ 3 minuter** för en docs-klassad revert, **≈ 15 minuter** för en
kod-klassad, som summan av PR-grindens CI-lopp plus kö-byggets eget CI-lopp
plus mätt overhead. **Verifierad**, med öppet bokförd rättelse av ett
tidigare, för lågt tal i samma dokument (repot river alltså sina egna
felaktiga mätningar öppet i stället för att tyst korrigera dem).

**Vad en revert INTE tar tillbaka**, dokumenterat och värt att upprepa här
eftersom det är den vanligaste missuppfattningen om vad "revert" betyder:
redan skickad e-post, redan gjorda skrivningar i Airtable-basen, redan
deployade Edge Functions (deploy är manuellt, ingen CI-pipeline rör en
körande funktion vid en git-revert) och GitHub-inställningar (ruleset,
secrets — de bor inte i git alls).

**Utöver de två dokumenterade övningarna hittade jag, via en bredare
grepp-sökning, tre ÄLDRE revert-commits** (`2be52f13` 2026-06-23,
`fba2624d` 2026-05-29, `8bbb8c15` 2026-05-14) — samtliga från INNAN
ruleset (2026-07-23) och merge queue (2026-07-29) existerade. De visar att
revert som MÖNSTER har använts genom hela projektets historia, men säger
ingenting om DAGENS mekaniserade väg och är därför INTE en del av min
huvudbedömning. **Verifierad** som historiska commits; **osäker** vad
gäller deras exakta driftsprocess, eftersom den föregick allt jag i övrigt
beskriver i detta dokument.

## Roller: Marcus, orkestreraren, subagenten

| Fråga | Marcus | Orkestreraren | Subagent (bygg-agent) |
|---|---|---|---|
| Får skriva git direkt i huvudkatalogen | Ja, alltid hans kanal | Ja, om han äger katalogen just nu (ägarlappen) | Aldrig — kör alltid i egen worktree |
| Får armera en PR (`gh pr merge --auto`) | Ja | Ja, normalfallet | Bara om uppdraget uttryckligen säger det |
| Får besluta ATT backa (revert) | Ja, ensam | Nej — väntar på Marcus beslut | Nej |
| Förbereder revert-gren och PR | — | Nej | Ja, men armerar aldrig mergen själv |
| Får inaktivera rulesetet (nödväg) | Ja, hans beslut, synligt | Nej | Nej |
| Vad hindrar den som inte får | — | `deny-frammande-huvudkatalog.sh` om katalogen är upptagen; kontraktet i `bygg-agent.md` | Samma hook plus `disallowedTools`; ruleset hindrar direktpush oavsett aktör |

Det är värt att notera **vad som INTE skiljer rollerna åt**: GitHubs
ruleset gör ingen skillnad på Marcus, orkestreraren eller en agent — en
PR från VEM SOM HELST går igenom exakt samma kö, samma krav, samma
`bypass_actors: []`. Den enda rollbaserade grinden i hela flödet är
katalogägarskapets ägarlapp, och den skiljer inte på roll utan på
**vem som kom först** till huvudkatalogen.

## Push-kadens

*(Detta kapitel fogas in av orkestreraren från J3:s underlag om
push-rytmen — när ska man pusha, hur ofta, tidigt eller sent. Detta
dokument beskriver bara push-MEKANIKEN, se steg 8 ovan.)*

Ett tal jag mätte i förbifarten och lämnar vidare till J3 utan egen
tolkning: den ofta citerade "7–11 PR:er per dag"
(`docs/research/push-kadens-agent-arbetstrad-2026-07-26.md`) höll INTE
mot min egen mätning — 500 PR:er landade på 17 dagar
(2026-08-22–2026-09-08), ett snitt på **≈ 29 PR:er per dag**, ungefär
tre gånger den tidigare siffran. Jag har inte utrett VARFÖR (fler
parallella agenter? annan arbetsform?) — det är J3:s fråga.

## Riskerna, rangordnade

1. **Ad hoc-parallellitet utanför ADR-073:s claims-check saknar
   förebyggande skydd** (§ "Vad som INTE är byggt än"). Detta är den
   enda risken i detta dokument utan NÅGON mekanisk motvikt före
   landning — bara merge queue och `review-agent` FÅNGAR problemet, ingen
   mekanism FÖREBYGGER det.
2. **Fail-open-isoleringsspärren vid worktree-borttagning** (L418,
   § "Var isoleringen har läckt"). Skyddet försvinner exakt när felet blir
   möjligt, och exponeringsfönstret (4 min 13 s i den mätta instansen) är
   tillräckligt kort för att missas av en människa men tillräckligt långt
   för att en samtidig landning ska kunna gå fel.
3. **T121-buggen i själva verktyget** (§ Fynd 4) — en extern, opatchbar
   källa som förstärks av just det arbetssätt (täta, parallella
   worktree-skapelser) uppdraget vill mekanisera MER av, inte mindre.
4. **Grennamngivningens totala avsaknad av regel** — låg skada i sig
   (inget läser prefixet mekaniskt), men den tydligaste indikatorn på att
   disciplinen bärs av människor, inte av verktyg, och därför den punkt
   där ny personal/en ny agenttyp lättast avviker utan att någon märker
   det.
5. **Dokumentationsdrift** (§ "Motsägelse …") — låg skada per instans (den
   hittade drift beskriver något BÄTTRE än dokumenterat, inte sämre), men
   ett mönster värt att bevaka: en styrande fil som är fel åt det
   optimistiska hållet upptäcks sällan, eftersom ingen letar efter fel som
   säger "det är bättre än du tror."

## Undantagen

- **Rebase är helt avstängt** på ruleset-nivå (`allowed_merge_methods:
  ["merge"]`) — ett medvetet undantag från det bredare branschmönstret
  "rebase för en ren historik", eftersom repots merge-dedup-mekanism
  (`task-36.4`) hittar en PR:s träd via merge-commitens andra förälder
  (`HEAD^2`), vilket kräver riktiga merge-commits.
- **Force-push är strukturellt ovanligt, inte förbjudet.** Jag stickprovade
  4 PR:er utspridda över korpusen (`gh api …/issues/<nr>/timeline -q
  'select(.event=="head_ref_force_pushed")'`, 2026-09-17) och fann **noll**
  force-pushar i alla fyra. Litet stickprov (`n=4`), men konsekvent med att
  agenter arbetar i FÄRSKA worktrees per uppgift snarare än att skriva om
  en existerande grens historik.
- **`git pull` är tillåtet av repots egna permissions** (`.claude/
  settings.json` `permissions.allow`: `"Bash(git pull)"`,
  `"Bash(git pull:*)"`), trots att GLOBAL `CLAUDE.md` uttryckligen säger
  "Kör ALDRIG blint `git pull`". Detta är INGEN motsägelse i sak — en
  permission är en TILLÅTELSE att köra kommandot när det behövs (t.ex. i
  huvudkatalogen, av Marcus), inte en rekommendation om NÄR. Men det är
  värt att notera som en risk för feltolkning: en agent som bara läser
  permissions-listan utan att läsa den globala principen kan dra fel
  slutsats om vad som är gott bruk.
- **Dependabot-PR:er** följer samma ruleset som allt annat (3 av 500
  mätta PR:er, 0,6 %) — inget separat spår, ingen auto-merge-genväg utöver
  vad varje annan PR har.

## Rekommenderat arbetssätt per roll

**Människa (Marcus):** inget i detta pass motiverar en ändring av hur
Marcus själv arbetar — hans kanal är redan den enda som får fatta
revert-/nödväg-beslut, och det är rätt plats för det beslutet.

**Orkestreraren:** fortsätt äga branch-uppdatering, armering och
diff-granskning centralt (kön ser inte "rent men fel ihop"-fallet) —
detta pass hittade inget som talar för att flytta det ansvaret. Överväg
att **täta uppdateringen av `CLAUDE.md`s "obetald skuld"-noteringar** när
ett kort som löser dem landar (se § Motsägelse) — en lätt, billig vana
(en rad i samma commit som stänger kortet) som hade förhindrat just detta
fynd.

**Subagent (bygg-agent):** kontraktet i `bygg-agent.md` är redan
tillräckligt strikt för de risker detta pass hittade (path-scopad add,
aldrig `git stash`, aldrig armera utan uttrycklig order, alltid draft om
parkerad). Den enda konkreta luckan är att **kontraktet inte instruerar
agenten att mäta `git rev-parse --show-toplevel` före VARJE git-skrivning**
— L418s egen slutsats efter att ha fallit i just den fällan. Det är en
billig, redan formulerad regel som saknar sin plats i den styrande filen.

**Vad som kan FÖRENKLAS eller tas bort:** grennamn-prefixen är den tydligaste
kandidaten. Femton olika prefix utan mekanisk konsekvens är komplexitet utan
motsvarande nytta — antingen bör ett litet, dokumenterat schema införas
(vilket kostar disciplin men ingen kod), eller så bör den nuvarande
friheten uttryckligen ERKÄNNAS som avsiktlig i `bygg-agent.md` i stället för
att bara vara frånvaro av en regel ingen skrivit. Det andra: `ADR-073`s
`check-merge-tree.sh`-grind och claims-check används i dag bara inom en
smal, Marcus-beordrad batch-kontext — antingen bör den utökas till att
gälla all parallell agent-spawning (rekommenderat i ett tidigare
forskningspass, aldrig genomfört), eller så bör dess smala scope
dokumenteras tydligare som ett MEDVETET vald gräns, inte en ofullständig
implementation.

## Osäkerheter och vad jag inte kunde belägga

- **Hook-fällningsfrekvens.** `.claude/hook-fallningar.jsonl` (loggen
  `deny-frammande-huvudkatalog.sh` och `deny-grind-genom-pipe.sh` skriver
  till) är gitignorerad och lokal per checkout — jag bekräftade dess
  frånvaro i DENNA worktree men kan inte veta hur ofta den fyller på i
  andra, längre levande sessioner. **Ej verifierbart** utan tillgång till
  en session som kört länge nog att ackumulera fällningar, eller en
  framtida mekanism som aggregerar loggen centralt.
- **Om `ADR-073`s claims-check NÅGONSIN utökats till ad hoc-parallellitet
  sedan 2026-08-04.** Jag hittade ingen nyare källa som säger det, men jag
  har inte läst samtliga 132 ADR:er i sin helhet — bara sökt riktat. **Osäker,
  inte "verifierat frånvarande."**
- **Exakt varför push-takten tredubblats** sedan 2026-07-26-mätningen
  (§ Push-kadens). Jag mätte SKILLNADEN, inte ORSAKEN — det är uttryckligen
  J3:s delfråga, inte min.
- **De tre äldre revert-commit-instanserna** (2026-05-14 till 2026-06-23)
  — jag vet ATT de finns men inte HUR de drevs, eftersom de föregår hela
  det mekaniserade flöde jag i övrigt beskriver.
- **Om `allow_squash_merge`/`allow_rebase_merge`-drift på repo-nivå
  (§ steg 11) någonsin orsakat ett verkligt fel** — Jobb 1e flaggar den som
  latent, jag har inte funnit en instans där den bitit.
- **Om `bygg-agent.md`s `disallowedTools`-lista faktiskt hindrar varje
  scenario den avser** — jag läste kontraktet men körde ingen egen
  skarp provokation av det (utanför mitt uppdrags scope; det hör snarare
  till en granskning av agent-verktygsytan än av git-flödet).

## Källor

**Kod, läst direkt (denna session, 2026-09-17):**

- `CONTRIBUTING.md` rad 1–52, 350–827 (Aktörer, Pull Request-flöde,
  Push-kadensen, Landnings-ordningen, Revert-vägen)
- `.claude/agents/bygg-agent.md` (helt, 318 rader)
- `.claude/settings.json` (helt, hook-registret)
- `scripts/deny-frammande-huvudkatalog.sh` (rad 1–835 av ~1200)
- `scripts/deny-arbetsform-push.sh` (helt, 325 rader)
- `.arbetsform-push-policy.conf`, `.katalogagarskap-policy.conf` (utdrag,
  rad 124–147 samt `KATALOG_GIT_SKRIVKOMMANDON`)
- `scripts/check-merge-tree.sh` (rad 1–60)
- `scripts/stada-grenar.sh` (rad 1–160) + `git log --follow` mot filen
- `scripts/heartbeat-svep.sh` (rad 100–135, 420–475)
- `.githooks/pre-commit` (helt, 243 rader)
- `<git-common-dir>/katalogagarskap-agare.json` (live läst, 2026-09-17)
- `bash scripts/test-deny-frammande-huvudkatalog.sh` → 133/133 gröna,
  exit 0, 2026-09-17
- `bash scripts/test-deny-arbetsform-push.sh` → 25 passerade, 0 fallerade,
  exit 0, 2026-09-17

**ADR:er, lästa i sin helhet:**

- `docs/decisions/ADR-076-merge-grinden-ruleset-pr-flode.md`
- `docs/decisions/ADR-090-sessions-parallellitet-detektera-och-fraga.md`
- `docs/decisions/ADR-096-subagentens-vantekontrakt.md`
- `docs/decisions/ADR-097-arbetsformens-tillstandsbarare.md`
- `docs/decisions/ADR-073-parallella-batch-pipelines.md`
- `docs/decisions/ADR-086-uppdragets-premisser-provas-av-mottagaren.md`
- `docs/decisions/ADR-100-sanningshierarkin-koden-ager-beteendet.md` § 1
- `docs/decisions/ADR-081-nummer-tilldelas-vid-landning.md` (skummad för
  branch-namngivning specifikt — inget funnet)

**Egna empiriska mätningar, 2026-09-17:**

- `gh pr list --state merged --limit 500 --json number,headRefName,
  createdAt,mergedAt,additions,deletions,changedFiles,author --repo
  high-five-group/miranon-media-admin` (500 PR:er, 2026-08-22–2026-09-08) —
  prefix-fördelning, PR-storlek, gren-livslängd, bot-andel
- `git log origin/main --first-parent --format=%s -80` — merge-metod,
  80/80 korrekt formade
- `git log origin/main --grep="revert" -i --oneline -50` — revert-instanser
- `gh api repos/high-five-group/miranon-media-admin/issues/{1900,2100,
  2300,2470}/timeline` — force-push-stickprov, 0/4
- `strings -a` mot den installerade `claude.exe` (2.1.274) — T121-buggens
  fortsatta närvaro (se § Fynd 4 ovan)

**Forskningspass i detta repo, med ålder bedömd:**

- `docs/research/t121-skribenten-claude-code-worktree-hookspath-2026-08-04.md`
  (6 veckor gammalt vid läsning — omprövat mot 2.1.274, se § Fynd 4 ovan;
  slutsatsen höll)
- `docs/research/kodfils-partitionering-parallella-agenter-2026-08-04.md`
- `docs/research/task-99-dequeue-enqueue-live-test-2026-08-01.md`
- `docs/research/push-kadens-agent-arbetstrad-2026-07-26.md` (siffran
  föråldrad, se § Push-kadens)
- `docs/research/hook-mekanisering-worktree-isolering-2026-07-28.md`
- `docs/research/backlog-kortskapandets-flaskhals-2026-08-26.md`
- `docs/research/reversibilitet-som-delegeringsaxel-2026-07-29.md` (kort
  svar läst — generell filosofi bakom revert-som-axel, ej repo-specifik
  mekanik)
- `docs/research/ci-djupgranskning-2026-09-17/underlag/
  j1e-externa-installningar-och-deployvagar.md` (samma granskning, Jobb 1e
  — rulesetets live-verifiering återanvänd)

**`tasks/lessons/`, konkreta instanser:**

- `tasks/lessons/vol-05.md` rad 773–799 (S91, dubbla fel samma session)
- `tasks/lessons/vol-05.md` rad 2011–2058, L418 (fail-open worktree-
  borttagning)
- `tasks/lessons/vol-06.md` rad 634–645, L442 (åldrad lokal ref i
  långlivad worktree)
- `tasks/lessons/vol-04.md` rad 443–525 (delad `.git`, gemensamma
  remote-refs)
