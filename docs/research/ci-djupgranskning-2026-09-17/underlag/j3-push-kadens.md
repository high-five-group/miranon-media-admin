---
owner: marcus803
updated: 2026-09-17
review_by: 2026-12-17
status: draft
---

# Push-kadens — vet vi när vi ska lämna över arbete till GitHub?

> **Proveniens:** Jobb 3 i CI-djupgranskningen (Session 126), 2026-09-17.
> Skrivet av en agent (Sonnet 5, modell-ID `claude-sonnet-5`) i worktreen
> `s126-ci-djupgranskning`, mot ögonblicksbilden `origin/main` `eeca8c72`
> (2026-09-08). Två läsordsbegrepp för den som inte kodar: en **push** är
> handlingen att skicka lokalt sparat arbete (en "commit") till GitHub, så
> att andra — inklusive datorn som kör CI-testerna — kan se det. En **pull
> request (PR)** är en ansökan om att få det pushade arbetet inlemmat i
> huvudgrenen (`main`), den version av koden som faktiskt driver appen för
> Miranon Media.

## Kort svar

**Reglerna finns, de är ovanligt väl underbyggda för ett så här litet
projekt — och de mäts som efterlevda i vardagen, med ett tydligt undantag
som ligger 16+ dagar och räknar.**

Den bärande principen är **"commit är gratis, push kostar"**
(`docs/decisions/ADR-097-arbetsformens-tillstandsbarare.md`): spara lokalt
så ofta du vill, men skicka (pusha) bara när en avgränsad
arbetsenhet är klar att visas upp. Den principen är INTE bara skriven i
prosa — sedan 2026-08-07 finns en teknisk spärr (en så kallad *hook*, ett
litet vaktprogram som körs automatiskt före varje kommando) som fysiskt
blockerar `git push` medan ett uttryckligt "under arbete, rör inte"-läge
(kallat **iteration**) är aktivt. Det är en sällsynt kombination i det här
repot: en regel som inte bara står skriven någonstans, utan som en dator
faktiskt vaktar. Jag har hittat två fristående sessionsdokument (S121,
S122) där den vakten mätbart höll tillbaka en push tills arbetet var
uttryckligt klart.

Mätningen mot verkligheten (300 av repots 2 116 sammanslagna PR:er, 18
fullständiga PR-tidslinjer, 400 CI-körningar) bekräftar bilden från förra
research-passet
(`docs/research/push-kadens-agent-arbetstrad-2026-07-26.md`)
men med en KRAFTIGT höjd volym: förra passet observerade "7–11 PR:er per
dag"; mitt stickprov (2026-08-29–09-08) visar **~29 sammanslagna PR:er per
dag**, med en majoritet på under 25 minuter från öppning till landning.
Grenarna är korta och små (medianändring: 5 filer, 214 rader) — exakt det
mönster trunk-based development och Googles kodgranskningspraxis
förespråkar.

**Det jag hittade som INTE fanns i förra passet: draft-PR (ett utkastläge
för en pull request som gör den osynlig för sammanslagning tills den
markeras klar) används nu aktivt — men av ett annat skäl än det förra
passet förutspådde.** Förra passet trodde draft skulle bli relevant om vi
bytte till "pusha tidigt, iterera länge på grenen". Det är inte det som
hänt. I stället används draft för att signalera "under pågående
granskning" medan en oberoende granskar-agent (`review-agent`) prövar
PR:en — annars kan en larmande bevakningsrutin (`heartbeat-svep.sh`) inte
skilja en PR som väntar på sitt granskningsutlåtande från en PR någon
glömt.

**Den tydligaste kvarvarande risken är inte förlust — det är
oupptäckbarhet som får stå obesvarad för länge.** En gren med 40 lokala
commits (`fix/hem-betalningskort-marcus-iteration`, senast ändrad
2026-09-01) har passerat minst fem sessioners avslut utan att någon
bestämt om den ska landas eller kastas — arbetet finns kvar, i git, men
frågan "vad gör vi med detta?" har inte fått ett svar på över två veckor.

**Jag hittade också en motsägelse i den egna styrande texten:**
`CONTRIBUTING.md` påstår på en rad att en push "kostar en full CI-körning
plus en plats i staging-mutexen" (rad 380) — men samma dokument beskriver
40 rader senare, korrekt, att den kostnaden togs bort ur push-vägen redan
2026-07-29 (`TASK-70.3`). Meningen på rad 380 var alltså fel redan samma
dag den skrevs (2026-08-02).

---

## Vad jag läste först

Jag följde agentkontraktets krav att inventera innan jag sökte. Fyra källor
bar redan huvuddelen av svaret, och jag har byggt vidare på dem i stället
för att upprepa dem:

1. **`docs/research/push-kadens-agent-arbetstrad-2026-07-26.md`**
   (2026-07-26) — det tidigare passet på exakt denna fråga. Det slog fast
   principen "commit är gratis, push kostar" och dömde vår dåvarande kadens
   (7–11 PR:er/dag, en commit per PR) mot trunk-based development och
   DORA:s golv. Det var SKRIVET FÖRE merge queue (2026-07-29), ADR-097
   (2026-08-07) och review-grinden (2026-08-24→08-28) fanns. Jag har alltså
   inte upprepat dess litteraturgenomgång (trunk-based/DORA/Google
   Engineering Practices) utan verifierat att slutsatserna fortfarande
   håller och mätt vad som hänt SEDAN dess.
2. **`docs/decisions/ADR-097-arbetsformens-tillstandsbarare.md`**
   (2026-08-07, Accepted) — beslutet som byggde på förra passets forskning
   och gjorde push-ekonomin till en TEKNISK regel i stället för bara en
   skriven en. Läst i sin helhet, inklusive de tre avvisade alternativen.
3. **`CONTRIBUTING.md` § "Push-kadensen" och § "Landnings-ordningen"** — de
   två sektioner som ska bära den skrivna regeln i dag. De motsäger
   varandra på en punkt (se § Fynd 4 nedan) — ett fynd, inte ett
   antagande, eftersom jag verifierade båda mot `.github/workflows/`.
4. **`.claude/agents/bygg-agent.md` § "Landning"** — den enda källan som
   direkt föreskriver EN specifik agent-rolls (bygg-agenten, den agent som
   bygger en enskild arbetsenhet) push-beteende.

Jag bedömer förra passets litteraturdel (trunk-based development, DORA,
Google Engineering Practices, Rigby & Bird) som fortfarande giltig — inget
i den forskningen har ett bäst-före-datum på sju veckor. Det som ÅLDRATS är
repots EGEN arkitektur runt push: merge queue, ADR-097:s mekanik och
review-grinden fanns inte när passet skrevs. Det är den delen jag har
mätt om.

---

## Metod

- **Skriven regel:** läste ADR-097 i sin helhet, `CONTRIBUTING.md` §
  Push-kadensen + § Landnings-ordningen + § Post-merge-lagret,
  `.arbetsform-push-policy.conf`, `scripts/deny-arbetsform-push.sh`,
  `scripts/arbetsform-tillstand.sh`, `.claude/agents/bygg-agent.md`, och
  plugin-skillsen `do-work`, `work-batch`, `session-paus`, `session-end`
  (läs-endast, `~/.claude/plugins/cache/marcus-hub/marcus-system/1.34.0/`).
- **Mekanisk enforcement:** verifierade att `deny-arbetsform-push.sh` faktiskt
  är registrerad som en `PreToolUse`-hook i `.claude/settings.json` (rad 86,
  träffad på `Bash(git push:*)`), och att `TASK-149.1`–`.6` (ADR:n, hooken,
  hub-integrationen, push-ekonomins undantagslista, inventeringen) alla står
  `Done` i backlog-substratet. Enda kvarstående delen (`TASK-149.7`,
  ände-till-ände-QA) står `To Do`.
- **Faktisk praxis:** `gh pr list` (300 sammanslagna PR:er),
  `gh api .../timeline` för 18 utvalda PR:er (spridda över korta/långa
  liggtider och docs/feat/fix), `gh run list --workflow ci.yml` (400
  körningar), `git for-each-ref` över alla lokala grenar, `git worktree
  list`, och `git merge-base --is-ancestor` för att verifiera en specifik
  gren mot `main`. Alla svar sparades till scratch-filer först — inga
  upprepade API-anrop.
- **Historiska belägg:** sökte `tasks/lessons/`, `tasks/lessons.d/` och
  sessionsdokument för ord som "opusha", "ospårad", "gick förlorad",
  "worktree remove", "dog med".

---

## Fynd

### 1. Vet människor och agenter när de ska pusha?

**Ja för agenter, ja för orkestreraren, och frågan är delvis fel ställd för
Marcus.** Global `CLAUDE.md` (huvudkonstitutionen, gäller alla repon) säger
rakt ut: *"Code är default-utförare... Allt som ska in i Marcus filer eller
repon går via Claude Code."* Jag prövade detta mot data: av 300 sammanslagna
PR:er var **296 författade av GitHub-kontot `marcus803`** (de fyra andra var
GitHubs egna botar: Dependabot, GitHub Actions). Det kontot används av
BÅDE Marcus egen interaktiva session och varje agent som kör åt honom — git
skiljer alltså inte på "Marcus skrev `git push` själv" och "en agent
pushade på hans instruktion". Även den mest handgripliga, live-styrda
sessionen jag hittade (§ Fynd 6, iterationsgrenen med 40 commits, där Marcus
bedömde varje ändring direkt på skärmen) utfördes tekniskt av agenter, inte
av Marcus tangentbord. **Svaret på "vet Marcus när han ska pusha" är därför:
frågan gäller nästan aldrig honom rent mekaniskt — han avgör NÄR något är
klart, Code utför handlingen.**

För agenter är svaret entydigt: se tabellen i § Fynd 5.

**Regeln är dessutom bärare på TVÅ nivåer**, vilket är ovanligt starkt för
ett projekt av den här storleken:

1. **Skriven regel** (`CONTRIBUTING.md`, `bygg-agent.md`, plugin-skillsen) —
   läses av den som startar en arbetsform.
2. **Teknisk spärr** (ADR-097): en liten fil
   (`.claude/arbetsform-tillstand.json`) sätts när ett "under arbete"-läge
   (`iteration`) inleds, och en hook nekar varje `git push`-försök så länge
   den filen finns och pekar på ett förbjudet läge. Skälet att denna andra
   nivå byggdes: samma skrivna regel visade sig **inte hålla** när en
   session återupptogs via en annan väg än den som ursprungligen
   introducerade den (dokumenterat i `T126`, två separata mätta incidenter,
   `T116` och `T126`) — en teknisk spärr bryr sig inte om VILKEN väg
   sessionen kom in genom.

Jag hittade **två oberoende sessionsdokument som bekräftar att spärren
faktiskt löser ut i skarpt läge**, inte bara i tester: S121
(`tasks/sessions/2026-09-04-session-121.md` rad 1815, "kod-commits opushade
MED AVSIKT") och S122 (`tasks/sessions/2026-09-05-session-122.md` rad 22,
"iterations-träd med 13 opushade varv-commits och push-spärr"). Det är
ovanligt att kunna visa att en styrregel både är skriven OCH mätbart
efterlevs av en mekanism — de flesta reglerna i ett repo av den här
storleken är bara det förra.

### 2. Pushar vi tidigt till små, kortlivade brancher?

**Ja, konsekvent.** Mätt över 300 sammanslagna PR:er (2026-08-29 till
2026-09-08):

| Mått | p50 (median) | p90 | Max | n |
|---|---|---|---|---|
| Tid öppen → sammanslagen | 22 min 27 s | 3 t 21 min | 4 dygn 5 t | 300 |
| Ändrade filer | 5 | 18 | 52 | 300 |
| Rader ändrade (+/-) | 214 | 1 616 | 9 762 | 300 |

Det här är i linje med — faktiskt strängare än — Googles riktmärke
(~100 rader "rimligt", ~1 000 rader "vanligen för mycket": Google
Engineering Practices, se förra passets källförteckning). Svansen (max 4
dygn 5 timmar) är INTE en gren som "läckt" — det var ett dokumentationspass
(`docs/s114-paus-1`) som spände över en sessionspaus, samt en av GitHubs
egna Dependabot-uppdateringar som väntade på manuellt beslut. Ingen
kod-PR i mitt urval låg öppen längre än ~1,3 dygn.

**Grennamnen bekräftar en avsiktlig, källmärkt namngivningskonvention** —
inte bara korta liv, utan spårbara liv: `docs/`, `feat/`, `fix/`, `task/`,
`ci/` som prefix (164, 47, 36, 30 respektive 4 av 300 PR:er). Docs-PR:er är
majoriteten (55 %) — rimligt givet hur mycket av arbetet i det här projektet
är sessionsdokumentation, kort och lärdomar, inte bara kod.

### 3. Öppnar vi pull requests tidigt eller först när arbetet anses färdigt?

**Först när arbetet ANSES färdigt — men "färdigt" omprövas ofta EFTER att
PR:en redan är öppnad, och då används draft-läget reaktivt, inte
proaktivt.** Det här är den mest överraskande skillnaden mot förra passets
förutsägelse, och den byggde jag ut med en detaljerad tidslinje-analys av 18
PR:er (`gh api .../timeline`, GitHubs händelselogg per PR).

Av de 18 granskade PR:erna gick **9 (50 %) igenom minst en draft-växling**
efter att de redan var öppna — de öppnades som VANLIGA (icke-draft) PR:er,
konverterades till draft (GitHub-händelsen `convert_to_draft`) någon
gång under sin livstid, och markerades sedan `ready_for_review` strax före
sammanslagning. Exempel, PR `#2416` (`fix/task-367-...`):

| Tidpunkt | Händelse |
|---|---|
| 16:22:59 | PR öppnad |
| 16:24:15 (+76 s) | → draft |
| 18:01–19:05 | tre force-push, fem commits (aktivt arbete) |
| 19:05 → nästa dag 15:44 | **sitter overnight, ingen aktivitet** |
| 15:44:54 | → klar för granskning igen |
| 15:57:57 | sammanslagen (13 min senare) |

**Varför draft används — och det är INTE det förra passet förutspådde.**
Förra passets slutsats var att draft skulle bli relevant "om vi byter till
att pusha tidigt och iterera på grenen för att spara CI-kostnad". Det har
INTE hänt — draft stoppar inte CI (GitHub kör full CI även på en draft-PR,
vilket förra passet redan konstaterade och jag inte har motbevisat). I
stället hittade jag en konkret, namngiven lärdom
(`tasks/lessons.d/armeringskandidat-larm-under-granskning-svaras-med-draft-inte-vantan.md`,
mätt på just PR `#2319`/`#2312` — två av mina 18 stickprov, vilket är en
skarp träff):

> "En PR under aktiv granskning ska stå i draft, inte CLEAN-och-väntande —
> annars läser [den automatiska bevakningsrutinen] den som en glömd
> armerings-kandidat och larmar i onödan, eller värre, någon armerar den
> innan granskningen är klar."

Skälet är alltså **signalering till en bevakningsrobot**, inte
CI-besparing: en färdig, ren PR som väntar på ett granskningsutlåtande ser
ur en dators perspektiv identisk ut med en PR någon glömt bort. Draft är
det enda tillståndsfältet som skiljer dem åt.

**Slutsats:** PR öppnas fortfarande vid "tros vara klart", exakt som
`bygg-agent.md` föreskriver. Draft är en RETROAKTIV signal ("visade sig
inte vara klart ändå", eller "väntar på extern granskning"), inte en
PROAKTIV arbetsform ("jag vet redan att detta tar dagar, så jag öppnar
tidigt"). Det är en finare distinktion än förra passets fråga fångade, och
den är värd att skriva ned explicit eftersom den annars lätt läses som
motsatsen.

### 4. Finns det instruktioner, automation eller etablerad praxis?

**Alla tre, och de pekar i samma riktning — med ett dokumenterat undantag.**
Tabellen nedan håller isär de sex sanningsslagen agentkontraktet efterfrågar.

| Nivå | Var | Vad den säger | Typ av sanning |
|---|---|---|---|
| Princip | ADR-097 | Commit gratis, push kostar | Dokumenterad avsikt + **teknisk regel** |
| Skriven regel (agent) | `bygg-agent.md` § Landning | Push EN gång, öppna PR, armera bara om uppdraget säger det | Frivilligt arbetssätt, men mätt efterlevt (se § 5) |
| Skriven regel (batch) | `do-work`-skillen | "Kod-leveransen = normalt EN commit. Pusha... ALDRIG en ny push" [före CI förstådd] | Frivilligt arbetssätt |
| Teknisk spärr | `scripts/deny-arbetsform-push.sh` + `.arbetsform-push-policy.conf` | Nekar `git push` medan `iteration`-läget är satt | **Teknisk framtvingad regel** — testad (40 fall, `scripts/test-deny-arbetsform-push.sh`) och mätt skarpt (S121, S122) |
| Undantagslista | `CONTRIBUTING.md` § Landnings-ordningen (rad 484–511) | Vad som pushas OMEDELBART (nummerartefakter, lifecycle-flippar, säkerhetsfixar, hub-bumps) kontra vad som VÄNTAR till en färdig enhet (iterationsvarv, WIP, utkast) | Dokumenterad avsikt, delvis mekaniserad (nummerkollisioner har ett eget skydd, `check_active_branches`) |
| Motsägelse | `CONTRIBUTING.md` rad 380 vs. rad 405/844 | Se § Fynd nedan | **Faktisk implementation stämmer INTE med en av dokumentets egna rader** |

**Motsägelsen, exakt:** `CONTRIBUTING.md` rad 380 (sektionen "Push-kadensen",
skriven 2026-08-02, `TASK-122`, commit `6b679d85`) säger att push "kostar en
full CI-körning **plus en plats i staging-mutexen**". Men `TASK-70.3` (commit
`5137ecaf`, 2026-07-29 — **fyra dagar FÖRE** den meningen skrevs) flyttade
staging-testerna ut ur PR-vägen till efter sammanslagning. Samma dokuments
egen § "Post-merge-lagret" (rad 844–860) och § "Landnings-ordningen" (rad
401–407) beskriver detta korrekt: *"`ci.yml` skickar `run_staging: false`
villkorslöst, och de två jobben instansieras aldrig av en PR-körning."*
Meningen på rad 380 var alltså fel redan samma dag den skrevs, och är det
fortfarande — verifierat mot dagens `.github/workflows/ci-suite.yml`, som
har `run_staging`/`run_a11y` båda `false` från `ci.yml`:s anrop. Detta är
ett FYND i sig: en styrande text som motsäger sig själv inom samma fil,
inte bara mot verkligheten.

### 5. Skiljer sig beteendet mellan människor, orkestrerare och subagenter?

**Ja, tydligt — men skillnaden ligger i VEM som beslutar, inte i VEM som
kör kommandot (git-identiteten är densamma för alla, se § Fynd 1).**

| Roll | När pushar den | Öppnar PR | Armerar (godkänner för sammanslagning) | Källa |
|---|---|---|---|---|
| **Marcus (människa)** | Avgör NÄR arbete är klart att visas — kör aldrig `git push` själv (Code är utföraren) | Aldrig direkt — via Code | Beslutar VILKA PR:er som ska granskas manuellt (`hog`-risk, ADR-105) | `~/.claude/CLAUDE.md` § Instruktioner |
| **Orkestreraren** (sessionens huvudtråd) | Vid varje sessionspaus (`session-paus` kräver rent + PUSHAT träd som DEFAULT), vid varje "nummerbärande" artefakt omedelbart (ADR-, lesson-, kortnummer), efter granskning innan armering | Sällan själv — normalt bygg-agenten | **Ja** — `gh pr merge --auto`, aldrig bygg-agenten | `CONTRIBUTING.md` § Landnings-ordningen; `session-paus`-skillen |
| **Subagent, standardflöde (`do-work`)** | EN gång, när skivan är klar och lokala grindar är gröna | Ja, `gh pr create` | Bara om uppdraget uttryckligen säger det | `bygg-agent.md` § Landning |
| **Subagent, parallell batch (ADR-073)** | EN gång, men pushar BARA en gren — **öppnar ingen PR** | **Nej** — orkestreraren öppnar PR:en efter en egen konflikt- och omfångskontroll (`merge-tree`, "claims-kvitto") | Nej, aldrig | `work-batch`-skillen, "Parallell form" |
| **Iterationsläge** (vilken aktör som helst) | Push är TEKNISKT BLOCKERAT tills Marcus säger "klart" | — | — | ADR-097 + hooken |

**Den intressanta skillnaden är rad 4 mot rad 3.** I normalflödet litar
systemet på att EN agent både pushar och öppnar PR:en. I den parallella
batch-formen (flera agenter i egna arbetsträd samtidigt) höjs
tillitsribban: agenten får bara pusha en gren, och det är ORKESTRERAREN
som — efter att ha kört en mekanisk kontroll av att grenen faktiskt bygger
rent mot färsk `main` och håller sig inom sin tilldelade yta — öppnar
PR:en. Skälet, skrivet i skillen: risken för att två parallella agenters
diffar var för sig ser rena ut men krockar i sak är högre när flera
arbetar samtidigt, och den risken syns bara för den som kan se ALLA
agenternas arbete — orkestreraren, inte den enskilda agenten.

### 6. Finns risk att arbete ligger lokalt för länge?

**Ja — inte som dataförlust, utan som en obesvarad fråga som får åldras.**
Jag mätte detta konkret snarare än att anta det.

**Läget vid Marcus hemkomst efter en veckas semester (S125,
2026-09-17 ~08:30, källa: `tasks/sessions/2026-09-17-session-125.md`,
mätt av den sessionens egen orkestrerare mot disk):**

- **57 lokala grenar**, **13 arbetsträd** utanför huvudkatalogen.
- 7 av dessa 13 stod på grenar som redan var sammanslagna (kvarglömda,
  inte längre riskbärande — bara städbehövande).
- **4 stod på ej sammanslagna grenar:** `task-442`, `task/415.1`,
  `fix/task-309-24`, och `fix/hem-betalningskort-marcus-iteration` med
  **40 commits**.
- **Ett arbetsträd bar 2 opushade commits** (`docs/s124-stangning-4`).

Jag verifierade den mest anmärkningsvärda grenen själv, oberoende av S125:s
egen bokföring:

```text
$ git merge-base --is-ancestor fix/hem-betalningskort-marcus-iteration origin/main
→ NOT merged into main
$ git log --oneline main..fix/hem-betalningskort-marcus-iteration | wc -l
→ 40
$ git log -1 --format="%H %ad %s" fix/hem-betalningskort-marcus-iteration
→ 6d5e46c3 2026-09-01T13:08:55+02:00 "fix(mer): Coins-ikonen ..."
```

**Detta är INTE glömt arbete i meningen "ingen vet om det".** Jag hittade
det omnämnt, med namn, i FYRA separata sessionsdokument efter att det
skapades: S113 (som byggde det, 2026-09-01: *"Grenen: 48 commits, pushad"*
— åtta commits mer än idag, vilket antyder att grenen städats eller
skrivits om sedan dess utan att landas), S121, S122 och S124 — var och en
med samma formulering: *"...står kvar — orörda, städning är eget beslut."*
Grenen har alltså passerat **minst fem sessioners avslut** med samma
observation upprepad, utan att frågan "landa eller kasta?" någonsin
besvarats.

**Vad grenen är, för sammanhanget:** den föddes ur en explicit,
Marcus-ledd "snabb lokal iterationsloop" (S113 Del 14, 2026-09-01) — fyra
agenter i serie, körda OISOLERAT i huvudkatalogen, som byggde och rev
förslag på hemskärmens betalningskort medan Marcus bedömde varje steg live
på skärmen. Det är alltså precis den arbetsformen ADR-097:s `iteration`-läge
är byggt för att skydda (lokala commits, ingen push förrän Marcus säger
klart) — och skyddet höll: ingenting gick förlorat, allt ligger kvar,
läsbart, i git. **Det som INTE hände är steget EFTER iterationen:** ett
beslut om grenens öde. Risken materialiserade sig alltså exakt som förra
passets forskning förutspådde — *"restrisken efter commit-utan-push är
oupptäckbarhet, inte förlust"* — bara mycket längre (16+ dagar, mot den
timmar-till-dagar-skalan förra passet diskuterade) och mer offentligt
dokumenterad än förutspått.

**En sekundär, strukturell bidragande orsak:** `git worktree remove` (som
städar en agents arbetskatalog) tar aldrig bort den underliggande GRENEN —
det dokumenterar redan `CLAUDE.md` § Kortnummer om en angränsande situation
("ingen mekanism raderar en lokal gren efter att en worktree-isolerad agent
landat sin PR"). 57 lokala grenar samtidigt är alltså delvis en
ackumulationseffekt av just detta, inte enbart obeslutade PR:er — men
`fix/hem-betalningskort-marcus-iteration` är specifikt inte städbar av den
mekanismen, eftersom den bär riktigt, osammanslaget arbete.

### 7. Finns risk att ofärdigt eller osäkert arbete delas för tidigt?

**Mätbart LÅG, och det tydligaste beviset är negativt: jag hittade INGEN
instans i lessons eller sessionsdokument av att en för tidigt öppnad eller
för tidigt armerad PR orsakat en verklig incident** (utöver den ordning
som redan är stängd via merge queue, se nedan). Det jag hittade var i
stället flera lager som AKTIVT förhindrar det:

- **Merge queue** (`CONTRIBUTING.md` § Landnings-ordningen) bygger varje PR
  mot `main` PLUS de PR:er som ligger före den i kön, innan den faktiskt
  slås samman — en PR kan alltså inte oavsiktligt landa på ett trasigt
  underlag bara för att den pushades tidigt.
- **`bygg-agent.md`** förbjuder en subagent att armera sin egen PR som
  standard: *"orkestreraren granskar din diff och armerar i sitt svep"* —
  en människa (eller åtminstone en oberoende session) ser diffen innan den
  blir permanent.
- **Review-grinden** (ADR-105, byggd 2026-08-24→08-28): efter push spawnas
  en OBEROENDE granskar-agent i färsk kontext, som ALDRIG är samma agent
  som byggde PR:en. En `hog`-riskbedömning blockerar formellt armering tills
  Marcus själv sett den.
- **En känd, EXPLICIT undvikt regel:** *"armera aldrig en PR vars bygg-agent
  fortfarande arbetar"* (`CONTRIBUTING.md`). Jag sökte efter en instans där
  detta brutits och hittade ingen i lessons/sessionsdok — bara den
  förebyggande regeln.

**Den enda RISKKLASSEN jag faktiskt hittade belägg för är den motsatta av
"delat för tidigt": en PR som ser klar och delad ut MEN i sak väntar på
något** — täckt i § Fynd 3 (draft-mekanismen) och lösningen på just det
problemet (`gh pr ready --undo` i stället för att låta den stå CLEAN och
vänta).

**Ett näraliggande men skilt fynd, värt att registrera även om det ligger
utanför frågans kärna:** flera Dependabot-PR:er (automatiska
beroendeuppdateringar, `#2480`–`#2484`, öppnade 2026-09-14) stod vid S125:s
mätning **blockerade i tre dagar** av en känd säkerhetsvarning (`audit-ci`,
två "high"-nivåer) utan att någon agerat — inte för att arbetet delades
för tidigt, utan för att en extern automatik (GitHub) öppnade PR:er som
väntade på ett mänskligt/agent-beslut som inte kom förrän Marcus var
tillbaka. Det är en annan risk-klass (bevaknings-täckning över en
frånvaroperiod) än push-kadensen själv, men den delar familjeträd med §
Fynd 6.

### 8. Hur påverkar push-kadensen CI-kostnad, återkopplingstid, samarbete och återställningsbarhet?

**CI-kostnad, mätt (400 körningar av `ci.yml`, 2026-09-05–09-17, sannolikt
avkortat i den äldre änden av den 400-gränsen jag satte — läs talen som en
undre gräns, inte en exakt daglig takt):**

| Händelsetyp | Antal | Andel |
|---|---|---|
| `pull_request` (en push till en öppen PR) | 203 | 51 % |
| `merge_group` (kön bygger en landningskandidat) | 104 | 26 % |
| `push` (direkt på `main`, t.ex. efter sammanslagning) | 93 | 23 % |

Av de 203 PR-körningarna fördelade sig på **121 distinkta grenar**: **80 av
dem (66 %) fick EXAKT EN körning** — bekräftar att "en push per färdig
enhet" är normen, inte undantaget. En svans av 41 grenar (34 %) fick 2–5
körningar, och EN enda avvikande gren (`task/402.8-formen-fore-stampeln`,
ett designiterations-spår under aktiv Marcus-granskning) fick **14**
körningar — designarbete som granskas live med upprepad återkoppling är den
enda observerade kategorin som bryter mot engångs-push-normen, och det är
ett rimligt, avsiktligt undantag: designgranskning KRÄVER att varje
justering syns.

**Återkopplingstid:** eftersom PR:er är korta (median 22 minuter öppen)
och review-grinden triggar direkt vid push, är avståndet mellan "arbete
görs" och "en oberoende part ser det" kort för normalfallet. Den siffra som
drar upp medianen är EXAKT den grenklass § Fynd 6 beskriver: sessionspauser
och obeslutade grenar, inte push-frekvensen i sig.

**Samarbete:** merge queue har (enligt `CONTRIBUTING.md`, siffror jag inte
själv omprövat i detta pass men som är mätta i ett tidigare, daterat
research-pass) en medianväntetid på landning efter grönt bygge på 16
sekunder — det gör frekventa, små landningar praktiskt taget kostnadsfria
för andra agenter/sessioner att bygga vidare på.

**Återställningsbarhet:** samma källa dokumenterar att en revert (att backa
ut en redan landad ändring) är billig och väl övad, vilket är den
egentliga anledningen till att frekventa små landningar är säkra —
kostnaden för att en av dem visar sig fel är låg, jämfört med att låta fel
ligga kvar bakom en stor, sällan pushad batch.

---

## Jämförelse med trunk-based development och "push early, draft PR"-skolan

Förra passet gjorde redan den grundläggande jämförelsen (trunk-based
development, DORA, Fowler) och jag har inte skäl att upprepa den — den
håller fortfarande. Det som är NYTT att säga, med dagens data:

- **Vår faktiska kadens (~29 landade PR:er/dag, median 22 minuters livstid)
  ligger VÄL innanför trunk-based developments golv** ("minst en integration
  per dygn") och nära DORA-elitens "högst tre aktiva grenar åt gången" —
  fast uppskalat till flera parallella agenter i stället för flera
  utvecklare.
- **"Push early, draft PR"-skolan** (känd från GitHubs egna
  bakgrundsagenter och andra molnagenter, dokumenterat i förra passet) —
  öppna en draft-PR nästan direkt och iterera synligt på den i dagar — är
  INTE vad vi gör. Vi gör motsatsen: vi öppnar PR:er sent (vid tros-klart)
  och använder draft REAKTIVT, som en broms snarare än en startpunkt. Det
  är en medveten skillnad från branschmönstret, inte en ouppmärksammad
  avvikelse — och den är motiverad av vår skala: EN människa som ska hinna
  granska, inte ett team där ett tidigt öppnat utkast hjälper andra
  utvecklare planera sitt eget arbete runt det.
- **Vår ovanliga skala är den rimliga förklaringen till varför vi avviker
  där vi gör:** en privat GitHub Actions-kvot (varje CI-körning kostar
  riktiga pengar/minuter oavsett om PR:en är draft), en enda beslutsfattare
  (Marcus, inte ett granskarteam som skulle dra nytta av tidig synlighet),
  och MÅNGA parallella agenter snarare än flera människor — vilket är
  exakt skälet till att den parallella batch-formens extra
  orkestrerar-kontroll (§ Fynd 5, rad 4) finns: fler samtidiga skribenter
  ökar risken för att två rena diffar krockar i sak, en risk klassiska
  trunk-based-team med människor sällan möter i samma skala.

---

## Vad jag inte kunde belägga

- **Exakt daglig CI-kostnad i kronor eller minuter.** Jag har körningsantal
  (400 över ett fönster jag inte kan garantera är okapat i sin äldre ände,
  eftersom jag satte en `--limit` på 400) men ingen körtidssumma per
  körning i det här passet — det kräver att hämta `durationMs` per run,
  vilket jag avstod från för att hålla mina API-anrop få (agentkontraktets
  krav, delad kvot med andra samtidiga pass).
- **Om `fix/hem-betalningskort-marcus-iteration` innehåller arbete som
  redan landat separat, cherry-plockat.** Jag ser att en efterföljande,
  sammanslagen PR bar en snarlik commit-rubrik ("Coins-ikonen"), men jag
  har inte diffat innehållet mot `main` för att avgöra om grenen är
  helt/delvis redundant eller fortfarande unik. Det kräver en riktad
  `git diff`/`git log --all --grep`-genomgång som låg utanför den här
  frågans scope.
- **Varför grenens fjärrspårande gren visar `[gone]`** (dvs. en gång
  pushad, sedan borttagen på GitHub) trots att den aldrig landade i `main`.
  Möjliga förklaringar (manuell radering, ett misslyckat försök som
  stängdes utan sammanslagning) är inte verifierade mot GitHubs
  händelselogg för den specifika grenen.
- **Exakt hur många av de 57 lokala grenarna (S125:s mätning) som är rena
  kvarlevor av redan städade worktrees kontra genuint obeslutat arbete.**
  Jag har verifierat EN gren i detalj (`fix/hem-betalningskort-...`); en
  fullständig genomlysning av alla 57 ligger närmare J1/J2:s territorium
  (arbetsträdenas livscykel) än push-kadensens rytm.
- **Om draft-växlingsmönstret (§ Fynd 3) alltid initieras av orkestreraren
  som svar på review-grinden, eller om det ibland görs av bygg-agenten
  själv.** Jag har ett bekräftat exempel (S120 Del 4) där orkestreraren gör
  det explicit efter ett svep-larm; jag har inte granskat samtliga 9
  draft-växlande PR:er i mitt stickprov för att fastställa vem som utförde
  varje enskild växling.

---

## Risker (sammanfattat)

| Risk | Riktning | Belagd instans | Nuvarande skydd |
|---|---|---|---|
| Arbete ligger lokalt för länge, obeslutat | För sent | `fix/hem-betalningskort-marcus-iteration`, 40 commits, 16+ dagar, 5 sessioner | Git förlorar inget (commit är durabelt) — men INGET tvingar ett beslut om ödet |
| Ofärdigt arbete armeras/landas för tidigt | För tidigt | Ingen belagd instans hittad | Merge queue, review-grinden, "armera aldrig en PR vars bygg-agent arbetar" |
| Klar-men-väntande PR misstas för glömd | Båda | `#2319`/`#2312`, löst med draft-växling | Lärdomen `armeringskandidat-larm-...md` + `gh pr ready --undo` |
| Lokala grenar ackumuleras (disk-/verktygskostnad, inte förlust) | För sent | 57 lokala grenar vid S125 | Inget systematiskt svep — flaggat men obyggt (`TASK-310`) |
| Styrande text motsäger sig själv om push-kostnad | — | `CONTRIBUTING.md` rad 380 vs. 405/844 | Inget — upptäckt i detta pass |

---

## Rekommendation

**Detta är en rekommendation, inte ett beslut.** Tre konkreta, proportionerliga
förslag, med det som redan finns och fungerar tydligt märkt "behåll":

1. **Behåll:** principen "commit gratis, push kostar", ADR-097:s tekniska
   spärr för iterationsläget, engångs-push-normen i `bygg-agent.md`/`do-work`,
   och draft-som-granskningssignal. Alla fyra mäts som efterlevda.
2. **Rätta omedelbart:** `CONTRIBUTING.md` rad 380 ("...plus en plats i
   staging-mutexen") — ta bort eller uppdatera meningen så den stämmer med
   samma dokuments § Post-merge-lagret. Detta är en enrads-fix utan
   avvägning, inte ett designbeslut.
3. **Inför ett förfallodatum för obeslutade grenar.** ADR-097 löser "push
   under iteration" men inget löser "vad händer när iterationen är över och
   ingen bestämmer grenens öde". Förslag: när en sessionsavslutning
   (`session-end`/`session-paus`) upptäcker ett arbetsträd på en osammanslagen
   gren som inte rörts på N dagar (förslagsvis 7 — halva den tid
   `fix/hem-betalningskort-...` redan legat), ska den STOPPA-OCH-FRÅGA
   explicit: "landa, kasta, eller medvetet parkera med ett uttalat skäl?" i
   stället för att tyst notera "orörd, städning är eget beslut" ännu en
   gång. Detta byggs naturligt in i det redan existerande worktree-svepet
   (`stada-worktrees.sh`, körs redan vid `session-paus`) snarare än som ett
   nytt separat verktyg.
4. **Överväg INTE** att sänka push-frekvensen eller batcha pushar per
   session — ADR-097 § Decline-rationale avvisade redan detta med fyra
   namngivna, mätta skäl (parallell nummerallokering, agent-synlighet,
   write-ahead-principen, DORA:s stor-batch-risk), och mina mätningar ger
   inget nytt skäl att ompröva det beslutet.

---

## Källor

### Repo-filer (kod, som `kod`)

- `docs/decisions/ADR-097-arbetsformens-tillstandsbarare.md` — principen och den tekniska spärren
- `docs/research/push-kadens-agent-arbetstrad-2026-07-26.md` — förra passet, byggt vidare på här
- `CONTRIBUTING.md:368-546` (§ Push-kadensen, § Landnings-ordningen), `CONTRIBUTING.md:844-895` (§ Post-merge-lagret)
- `.claude/agents/bygg-agent.md` (§ Landning)
- `.arbetsform-push-policy.conf`, `scripts/deny-arbetsform-push.sh`, `scripts/arbetsform-tillstand.sh`
- `.claude/settings.json:86-88` (hook-registreringen)
- `backlog/tasks/task-149*` (ADR-097:s implementationsskivor, status verifierad `Done` × 6, `To Do` × 1)
- `tasks/lessons.d/armeringskandidat-larm-under-granskning-svaras-med-draft-inte-vantan.md`
- `tasks/sessions/2026-09-04-session-120.md:427-438` (draft-växlingens ursprungsinstans)
- `tasks/sessions/2026-09-04-session-121.md:1815`, `tasks/sessions/2026-09-05-session-122.md:22` (push-spärren mätt skarpt)
- `tasks/sessions/2026-08-29-session-113.md:1516-1538` (iterationsgrenens födelse)
- `tasks/sessions/2026-09-17-session-125.md:105-110` (57 grenar, 40-commits-grenen, opushad `docs/s124-stangning-4`)
- `tasks/lessons/vol-06.md:2776` (L494 — research-pass ser inte opushat arbete i huvudkatalogen)
- `~/.claude/plugins/cache/marcus-hub/marcus-system/1.34.0/skills/do-work/SKILL.md`,
  `.../work-batch/SKILL.md`, `.../session-paus/SKILL.md` (läs-endast, hub-plugin)

### Egna mätningar (denna session, 2026-09-17)

- `gh pr list --state merged --limit 300 --json ...` (300 PR:er, 2026-08-29–09-08)
- `gh api search/issues -f q="repo:high-five-group/miranon-media-admin is:pr is:merged"` → 2 116 totalt
- `gh api repos/.../issues/<nr>/timeline --paginate` för PR `2416, 2319, 2269, 2325, 2312, 2180, 2418, 2223, 2091, 2403, 2183, 2323, 2177, 2318, 2159, 2445, 2078, 2236`
- `gh run list --workflow ci.yml --limit 400 --json ...` (400 körningar, 2026-09-05–09-17)
- `git for-each-ref refs/heads`, `git worktree list`, `git merge-base --is-ancestor fix/hem-betalningskort-marcus-iteration origin/main`
