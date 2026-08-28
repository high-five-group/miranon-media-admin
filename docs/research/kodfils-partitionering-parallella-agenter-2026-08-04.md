---
owner: marcus803
updated: 2026-08-04
review_by: 2027-02-04
status: draft
---

# Hur förhindrar branschledare kollisioner mellan parallella agenter i samma kodfiler — och vilken form ska vår mekanism ha? (Code, 2026-08-04)

> **Proveniens:** avgränsat research-pass beställt av orkestreraren 2026-08-04
> för tråden `T119` (d) item 3, registrerad `tasks/threads/README.md` rad 162
> som **åtgärdsriktning, ej beslutad design**. Sessionsdokets handoff
> (`tasks/sessions/archive/2026-08/2026-08-04-session-97.md`, "Paushistorik — Session 97,
> tredje pausen" § CARRY) formulerar frågan ordagrant: *"Kräver att
> `/work-batch`s claims-check + `git merge-tree`-grind generaliseras till all
> ad hoc-parallellitet. Worktree-isolering löser det INTE; kollisionen sker
> vid merge."* Ingen kod, kort eller ADR rört av detta pass — enda leveransen
> är denna fil. Ingen ADR mintas här; passet levererar underlag, inte beslut.

## Kort svar

**Formen som redan finns i [ADR-073](../decisions/ADR-073-parallella-batch-pipelines.md)
(claims-check FÖRE spawn + `git merge-tree`-grind FÖRE PR + ett smalt, bundet
upplösningsmandat) är branschens faktiska mönster — inte en lokal improvisation.**
Nio+ granskade system delar upp problemet i exakt de tre mekanismklasser
uppdraget bad mig skilja åt, och ingen av dem löser mer än en av dem åt
gången. Det uppdraget efterfrågar är alltså inte en NY mekanismklass — det är
(1) **mekanisering** av det som idag är en manuell orkestrator-procedur (det
finns i det här repot inget skript som faktiskt kör `git merge-tree
--write-tree`; grinden är ett steg en människa/agent utför för hand varje
batch — verifierat, se § "Vad vi redan har") och (2) en **scope-utvidgning**
av vem som får deklarera ett anspråk, från "Marcus i en explicit batch-order"
till "vilken orkestrerad parallell aktör som helst".

**Den starkaste enskilda datapunkten i hela passet är negativ, och den
kommer från en branschledare som byggde precis det uppdraget föreslår och
sedan rev det:** Cursor testade peer-to-peer-lås mellan autonoma
kodningsagenter och fann att *"Agents would hold locks for too long, or
forget to release them entirely. Even when locking worked correctly, it
became a bottleneck... Twenty agents would slow down to the effective
throughput of two or three"* ([cursor.com/blog/scaling-agents](https://cursor.com/blog/scaling-agents),
tidigare verifierad ordagrant i [nummerallokering-passet](nummerallokering-parallella-aktorer-2026-07-29.md)
§ Delfråga 4). Deras lösning var inte att avskaffa anspråk — den var att
flytta anspråket **uppströms, till en människa/planerare FÖRE spawn**,
exakt vad ADR-073:s claims-check redan gör. Slutsatsen är alltså:
**mekanismens FORM är redan rätt (deklarerat anspråk uppströms + billig
detektion vid merge); det som saknas är att den gäller överallt, inte bara
när Marcus explicit beordrar en batch.**

## Metod

Primärkälla (leverantörens egen dokumentation eller källkod) prioriterad
genomgående; verbatim citat där ett påstående bär vikt. Tre pass i detta
repo har redan avverkat delar av precedent-rymden och återanvänds här i
stället för att göras om: [`merge-queue-mot-staging-mutex-2026-07-26.md`](merge-queue-mot-staging-mutex-2026-07-26.md)
(GitHub Merge Queue i primärkälla, mot vårt eget repo), [`nummerallokering-parallella-aktorer-2026-07-29.md`](nummerallokering-parallella-aktorer-2026-07-29.md)
§ Delfråga 4 (agentiska kodningssystems hantering av samtidiga filändringar
— Claude Code, Cursor, Copilot, Codex, Devin, fyra akademiska mätningar) och
[`processregler-mekanisering-branschpraxis-2026-08-04.md`](processregler-mekanisering-branschpraxis-2026-08-04.md)
(tre-lagers-doktrinen: exekveringspunkt / reconciliation / deklarerad gräns
för det omekaniserbara). Nytt i DETTA pass: Perforce, Git LFS lock, GitHub
CODEOWNERS, Chromium OWNERS, Googles monorepo-paper, Zuul, Mergify, Meta
Sapling, Kubernetes Leases/optimistisk concurrency/admission control, samt
en färsk direktläsning av Claude Codes egen `agent-teams`- och
`worktrees`-dokumentation (hämtad 2026-08-04, samma dag — detta ÄR verktyget
vi kör i, så det är den mest relevanta enskilda källan för frågan).

## Vad vi redan har — verifierat mot disk, inte antaget

[ADR-073](../decisions/ADR-073-parallella-batch-pipelines.md) (Accepted,
Session 65, amenderad tre gånger senast 2026-07-21) plus
`plugins/marcus-system/skills/work-batch/SKILL.md` § "Parallell form"
beskriver redan, i god detalj:

1. **Claims-check FÖRE spawn** — orkestratorn pekar ut kortet per
   pipeline-steg och intersekterar kortens förutsedda fil-ytor mekaniskt
   före batch-designen; overlap löses med fasat schema, aldrig i stunden.
2. **Täcknings-passet** — separat kontroll: claims måste omfatta den
   faktiska ytan spec-texten kräver (S75-empiri: 15/21 kort hade gap vid
   premiären).
3. **`git merge-tree`-grinden FÖRE PR** — orkestratorn kör
   `git merge-tree --write-tree` mot färsk `main`; exit 1 = konflikt.
4. **Claims-kvittot** — faktisk diff mot förgrenings-SHA ∩ deklarerad yta;
   fil utanför ⇒ eskalering.
5. **Ett BUNDET konfliktupplösningsmandat** (Amendering 3) — endast
   genererade filer (mekanisk regenerering) och bokförings-md (union-
   upplösning) får auto-lösas; allt annat = HALT.

**Verifierat denna session, och inte tidigare uttryckt så explicit:** ingen
av dessa fyra mekaniska steg (2–5) finns som ett körbart skript i detta
repo. `grep` efter `merge-tree`/`merge_tree` i `scripts/` gav en enda
träff — en variabel med samma namn i `scripts/classify-post-merge.sh` som
läser en REDAN LANDAD commits träd-SHA för en helt annan kontroll (att
landad diff matchar PR:ens diff), inte ett `git merge-tree`-anrop. Det finns
inget `claims.json`, ingen `check-claims.sh`, inget "delade-ytor-register"
som en fristående fil — ADR-073 Amendering 3 punkt 2 beskriver registret
som en lista, men listan bor i ADR-texten själv, inte i en config-fil av
samma klass som `.staging-semaphore-policy.conf` (som DÄREMOT existerar som
verklig kod: `scripts/staging-semaphore.sh`, 9,8 KB, mkdir-atomiskt lås).

Detta är den konkreta, mätta versionen av tråd `T121`s tes tillämpad på ett
nytt fall: **staging-mutexen är mekaniserad (kod + config), claims-checken
och merge-tree-grinden är PROSA i en skill som en orkestrator-session utför
för hand.** Samma klass regler som `T119` redan kartlagt — den håller när
en människa/färsk kontext faktiskt läser skillen ordagrant varje gång, och
det är exakt den svaghetsklass hela mekaniserings-programmet finns till för
att stänga.

## Mekanismklass A — förebyggande anspråk FÖRE arbete (pessimistisk låsning)

### Perforce — den klassiska VCS-precedenten för "detta kan inte mergas"

Perforce (Helix Core) bär två distinkta lås-primitiv. Filtypsmodifieraren
`+l` (exclusive-open): *"Environments in which only one person is expected
to have a file open for edit at a time can implement site-wide exclusive
locking by using the +l (exclusive open) modifier as a partial filetype"*
([typemap_locking.html](https://help.perforce.com/helix-core/server-apps/p4sag/2024.2/Content/P4SAG/superuser.basic.typemap_locking.html)).
Kommandot `p4 lock` gör motsvarande punktvis: *"Lock an opened file against
other users submitting changes to the file"* och *"Locking files prevents
other users from submitting changes to those files"*
([p4_lock.html](https://help.perforce.com/helix-core/server-apps/cmdref/current/Content/CmdRef/p4_lock.html)).
Skillnaden mellan dem: `+l` är permanent per filtyp (typiskt binärer, 3D-
modeller, Word-dokument — filer som **inte kan tre-vägs-mergas**),
`p4 lock` är en tillfällig, agent-tagen exklusivitet under en aktiv edit.

**Vad detta faktiskt löser:** innehåll som strukturellt inte kan mergas.
Det löser INTE textkonflikt mellan två parallella textredigeringar — det
förhindrar dem genom att göra parallell redigering omöjlig, vilket bara är
rätt pris när merge-verktyget inte kan göra jobbet.

### Git LFS lock — samma princip, git-native

Git LFS (används av spel- och medieprojekt för stora binärfiler) har en
egen Locking API: *"The File Locking API is used to create, list, and
delete locks, as well as verify that locks are respected in Git pushes"*
([locking.md](https://github.com/git-lfs/git-lfs/blob/main/docs/api/locking.md)).
Push-tidsverifieringen delar in lås i "ours"/"theirs" och *"any updated
files matching one of 'their' locks will halt the push"* (samma källa).
Samma logik som Perforce, flyttad till push-tid i stället för edit-tid —
men samma domän: **filer som inte kan mergas**, inte källkod i allmänhet.

### Vår egen claims-check (ADR-073) — samma klass, men annan skala

Claims-checken i ADR-073 är en variant av mekanismklass A, men med en
avgörande skillnad mot Perforce/LFS: den låser inte INNEHÅLL, den
partitionerar en NAMNRYMD (fil-sökvägar) mellan agenter INNAN de börjar
skriva, som en ren disciplinär överenskommelse verifierad efteråt
(claims-kvittot), inte som ett serverägt lås som blockerar en `git push`
mekaniskt. Detta är en viktig distinktion för § Syntes.

## Mekanismklass B — upptäckt VID merge (optimistisk)

### `git merge-tree` — git:s egen "prova innan du committar"

Git:s officiella dokumentation för `git merge-tree --write-tree`:
*"Performs a merge, but does not make any new commits and does not read
from or write to either the working tree or index"*
([git-scm.com/docs/git-merge-tree](https://git-scm.com/docs/git-merge-tree)).
Exit-koder: `0` = konfliktfri merge, `1` = konflikt, annat = fel att
slutföra. Dokumentationen är rak om avsikten: *"This command is intended
as low-level plumbing... it can be used as a part of a series of
steps"* — alltså byggblock för verktyg som vårt, inte en färdig
end-to-end-lösning. Detta ÄR den grind ADR-073 beskriver — men beskriven
här som ett byggblock git själv erbjuder, verifierat oberoende av vårt
eget bruk av den.

### Merge queues och spekulativ exekvering — GitHub, Zuul, Mergify

**Zuul (OpenStack, 2012)** myntade mönstret i CI-sammanhang. Det egna
dokumentets kärnmening: *"It does this by performing speculative execution
of test jobs; it assumes that all jobs will succeed and tests them in
parallel accordingly"* — och vid fel: *"If one fails, then changes that
were expecting it to succeed are re-tested without the failed change"*
([zuul-ci.org/docs/zuul/discussion/gating.html](https://zuul-ci.org/docs/zuul/discussion/gating.html)).
Ursprungsåret (2012, James Blair) är belagt i sekundärkälla, inte i Zuuls
egen dokumentation: [opensource.com/article/20/2/zuul](https://opensource.com/article/20/2/zuul).

**GitHub Merge Queue** implementerar samma modell, redan grundligt
genomlyst i vårt eget repos [merge-queue-mot-staging-mutex-2026-07-26.md](merge-queue-mot-staging-mutex-2026-07-26.md):
kumulativ spekulation (varje kö-post byggs mot bas + alla poster före den),
`ALLGREEN`/`HEADGREEN`-tolerans, och en explicit gräns — *"Merge limits do
not combine `merge_group` builds"* — som redan passet konstaterade inte
löser vår FYSISKA resursmutex (staging), bara den LOGISKA integriteten
mellan PR:er. Det är samma distinktion detta pass gör mellan mekanismklass
A/B/C: merge queue är renodlad klass B, och löser bara vad klass B kan lösa.

**Mergify** lägger till en teknik Zuul/GitHub inte har: `batch_size`-grupperad
spekulation plus **bisektion** vid fel. Egen dokumentation: *"Mergify
creates temporary batch PRs that represent cumulative merges (PR #1),
(PR #1 + PR #2), (PR #1 + PR #2 + PR #3), runs CI on them in parallel"* och
vid fel *"Mergify binary-searches for the culprit, removes it, and
continues processing"*
([docs.mergify.com/merge-queue/speculative-checks/](https://docs.mergify.com/merge-queue/speculative-checks/),
[docs.mergify.com/merge-queue/](https://docs.mergify.com/merge-queue/)).
Bisektionen är intressant som IDÉ för vårt framtida "vilket av N kort orsakade
den röda main-CI:n" men adresserar inte fil-nivå-partitionering — den
adresserar VILKEN PR i en redan textuellt konfliktfri kö som bröt en TEST,
inte om två PR:er rört samma rader.

### Kubernetes — optimistisk concurrency som default, inte lås

Kubernetes API-server löser exakt samma klassproblem för sina egna resurser
(inte kodfiler, men samma struktur: flera skrivare mot samma objekt) med
optimistisk concurrency: *"Kubernetes uses that resourceVersion information
so that the API server can detect lost updates and reject requests made by
a client that is out of date with the cluster. In the event that the
resource has changed... the API server returns a 409 Conflict error
response"*
([kubernetes.io/docs/reference/using-api/api-concepts/](https://kubernetes.io/docs/reference/using-api/api-concepts/)).
Ingen förhandslåsning krävs; detektion sker vid skrivförsöket, precis som
`git merge-tree`/merge queue detekterar vid merge-försöket. Kubernetes är
alltså ett självständigt, icke-VCS-precedent för att **klass B (optimistisk
detektion) är standardvalet över klass A (pessimistiskt lås) när skrivare
är många och kortlivade** — vilket är precis vår agent-situation.

## Mekanismklass C — upplösning EFTER konflikt (reaktiv)

### Meta Sapling — bail-and-wait, inte auto-lösning

Metas källkontrollsystem Sapling löser INTE konflikter automatiskt vid
rebase/restack. Egen dokumentation (Meta Engineering-bloggen): *"If you
choose not to fix the conflicts now, you can continue working on that
commit, and later run sl restack to bring your stack back together once
again"* ([engineering.fb.com/2022/11/15/.../sapling-source-control-scalable](https://engineering.fb.com/2022/11/15/open-source/sapling-source-control-scalable/)).
Bloggposten beskriver inte servr-sidans faktiska `land`-konfliktbeteende
(flaggat i § Vad jag inte kunde belägga). En praktikers (Meta-ingenjören
Edward Z. Yang, PyTorch/Meta) egen färska blogg om att köra parallella
AI-kodningsagenter MED Sapling ger en mer direkt bild: *"If there's a merge
conflict, Sapling will bail out and leave the commits at the old spot. You
can explicitly run `sl restack` to do the restack and address the merge
conflicts at your convenience."*
([blog.ezyang.com/2026/03/parallel-agents-heart-sapling/](https://blog.ezyang.com/2026/03/parallel-agents-heart-sapling/)).
Ingen låsning, ingen auto-lösning för riktiga textkonflikter — bara
isolerade arbetsträd (samma sak vi redan har) plus ett **halt-first-beteende
vid konflikt**, identiskt i form med ADR-073 Amendering 3:s "VARJE konflikt
som rör annan kod = HALT".

**Detta är den starkaste enskilda precedenten för vårt EGET bundna
upplösningsmandat.** Vi auto-löser bara två smala, mekaniskt säkra klasser
(genererade filer, bokförings-md); Sapling auto-löser noll klasser och
stannar alltid. Vår form är alltså STRIKTARE än Metas egen praxis där
Meta faktiskt gör MINDRE automatik än vi redan gör — värt att notera
explicit, eftersom det motsäger en möjlig intuition att "Meta måste ju ha
löst detta bättre, dom är större."

## Ägarskaps-/granskningsgrindar är INTE claims — en viktig distinktion uppdraget bad om

Uppdraget pekade ut `OWNERS`/`CODEOWNERS`-klassen som ett spår att pröva.
**Resultatet av att pröva det är negativt, och det är ett värdefullt fynd i
sig:** ingen av de granskade formerna förhindrar konkurrerande redigering.
De är en annan mekanism för ett annat problem (auktoritet över GRANSKNING,
inte över SKRIVNING).

**GitHub CODEOWNERS:** *"Code owners are automatically requested for
review when someone opens a pull request that modifies code that they
own"* och kan konfigureras så att *"require approval from a code owner
before the author can merge"*
([about-code-owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)).
Ingenting i dokumentationen nämner att förhindra att två personer redigerar
samma fil samtidigt — det är en review-gate, inte en skrivspärr.

**Chromium OWNERS:** samma mönster i ett stort, verkligt monorepo. Egen
dokumentation: en OWNERS-fil *"describes whose review is required to
commit changes to it"*, och ägarskap är *"a responsibility"*, inte en
teknisk spärr
([code_review_owners.md](https://chromium.googlesource.com/chromium/src/+/main/docs/code_review_owners.md)).
Chromium förbjuder till och med att kringgå kravet — *"committers@ of
Chromium are no longer able to circumvent code review and OWNERS
approval on CLs"* — men det förbudet gäller MERGE-tidpunkten, inte
redigerings-tidpunkten. Två utvecklare kan fortfarande skriva i samma fil
samtidigt; OWNERS avgör bara vem som måste godkänna innan enderaändringen
LANDAR.

**Google/Piper — det starkaste enskilda avvisandet av lås som mekanism.**
Potvin & Levenberg (Google Engineering, CACM 2016) beskriver ett
monorepo med miljarder kodrader och tiotusentals utvecklare som **inte
använder filnivå-lås över huvud taget**. Modellen är i stället trunk-based
(*"there are (virtually) no branches... all new code is merged into the
trunk"*), buren av Critique-kodgranskning och tung automatiserad testning
([Alastair Reids akademiska spegling](https://alastairreid.github.io/RelatedWork/papers/potvin:cacm:2016/)
av [den kanoniska CACM-artikeln](https://cacm.acm.org/research/why-google-stores-billions-of-lines-of-code-in-a-single-repository/),
åtkomstbegränsning noterad i § Vad jag inte kunde belägga). Google löser
konkurrerande ändringar med **granskning + test**, inte med anspråk över
filer — konsistent med att skalan (tiotusentals samtidiga skribenter) gör
varje form av förhandsbokning opraktisk. **OWNERS-filens ursprung är
Chromium/Android, INTE Googles interna google3/Piper-monorepo** — jag
hittade ingen primärkälla som kopplar de två, och behandlar dem som
separata precedent, inte som samma mönster i olika skala.

## Kubernetes leases + admission control som anspråksmönster — en analogi, tydligt flaggad

Uppdraget pekade ut detta spår explicit. Efter granskning: **det är en
analogi jag konstruerar, inte ett dokumenterat isomorft mönster.** Ingen
primärkälla kopplar Kubernetes Lease-objekt eller admission-kontroller till
"vilka filer får en skrivare röra." Vad de faktiskt är:

- **Lease** (`coordination.k8s.io`): *"Distributed systems often have a
  need for leases, which provide a mechanism to lock shared resources and
  coordinate activity between members of a set... used for system-critical
  capabilities such as node heartbeats and component-level leader
  election"*
  ([kubernetes.io/docs/concepts/architecture/leases/](https://kubernetes.io/docs/concepts/architecture/leases/)).
  En Lease har `holderIdentity` + `leaseDurationSeconds` — en TIDSBEGRÄNSAD,
  förnybar exklusivitet över EN roll (leader), inte över en mängd
  filsökvägar.
- **Admission controllers:** *"intercepts requests to the Kubernetes API
  server prior to persistence of the resource, but after the request is
  authenticated and authorized"*, och kan vara *"validating, mutating, or
  both"*
  ([admission-controllers](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/)).
  Detta är en icke-kringgåbar exekveringspunkt VID handlingen — samma
  struktur som vårt repos egen "lager 1" i tre-lagers-doktrinen
  ([processregler-mekanisering-branschpraxis-2026-08-04.md](processregler-mekanisering-branschpraxis-2026-08-04.md)
  § Kort svar) — men den prövar en request mot en POLICY (är detta objekt
  giltigt?), inte mot ett anspråksregister (äger jag rätten att skriva
  HÄR?).

**Analogin som ÄR användbar, men som min egen slutledning, inte ett citat:**
en Lease-liknande form (holder-identitet + TTL, förnyad medan aktören
lever, automatiskt frigjord annars) är en bättre modell för ett
anspråksregister än ett hårt lås, av precis det skäl Cursor mätte —
*forgot to release* är den dominerande felklassen för agent-lås, och en TTL
löser exakt det utan att kräva perfekt disciplin. En PreToolUse-hook som
kontrollerar Edit/Write mot ett sådant register vore strukturellt identisk
med en admission-webhook: billig, icke-kringgåbar, prövar FORM (är denna
path inom mitt deklarerade anspråk?) — inte SANNING (är detta
semantiskt korrekt?). Se § Rekommendation.

## Hur hanterar nyare multi-agent-kodningssystem detta konkret?

### Vårt eget verktyg — Claude Code (hämtat 2026-08-04, samma dag)

Den mest relevanta primärkällan av alla, eftersom det är verktyget denna
session själv körs i. Worktrees: *"Isolate parallel Claude Code sessions in
separate git worktrees so changes don't collide"*
([code.claude.com/docs/en/worktrees](https://code.claude.com/docs/en/worktrees)) —
men isolering av EDITERING är inte samma sak som isolering av MERGE, och
dokumentationen säger ingenstans att den löser efterföljande
merge-kollisioner; hela sidan beskriver skapande/städning/delning av
worktrees, aldrig ett steg som testar om två worktrees senare kan slås ihop.

Agent Teams-dokumentationen är mer explicit, och bekräftar tesen rakt av:
*"Avoid file conflicts: Two teammates editing the same file leads to
overwrites. Break the work so each teammate owns a different set of
files"* ([code.claude.com/docs/en/agent-teams](https://code.claude.com/docs/en/agent-teams)).
**Detta är rådgivning till människan, inte en mekanism verktyget bär.** Det
enda LÅS som faktiskt finns i Claude Codes egen arkitektur är: (a)
`git worktree lock`, som skyddar en worktree mot städnings-borttagning
medan en agent kör — inte mot filkollision, och (b) *"Task claiming uses
file locking to prevent race conditions when multiple teammates try to
claim the same task simultaneously"* — ett lås över VILKEN UPPGIFT en
teammate tar (i `~/.claude/tasks/{team-name}/`), inte över vilka KÄLLFILER
den sedan rör. **Anthropics eget förstapartsverktyg har alltså, per denna
dags dokumentation, exakt noll mekaniserat skydd mot att två parallella
agenter (subagents, teammates, eller separata worktree-sessioner) skriver i
samma källfil** — det enda skyddet är ett textråd till användaren att
partitionera manuellt. Detta är den mest direkta, mest aktuella bekräftelsen
av T119/T121:s tes: **worktree-isolering löser inte problemet**, och den
kommer från verktygets egen leverantör, inte från vårt eget resonemang.

### Cursor — byggde peer-to-peer-lås, rev det, byggde rollhierarki i stället

Redan citerat i § Kort svar. Vad som ERSATTE låset är minst lika viktigt
som att det revs: *"planners create tasks, workers pick them up"*, och en
dedikerad konfliktlösar-roll prövades och togs bort: *"We initially built
an integrator role for quality control and conflict resolution, but found
it created more bottlenecks than it solved"*
([cursor.com/blog/scaling-agents](https://cursor.com/blog/scaling-agents),
citerat och verifierat i [nummerallokering-passet](nummerallokering-parallella-aktorer-2026-07-29.md)).
Cursors svar är alltså strukturellt samma sak vi redan har: en människa/
planerare deklarerar icke-överlappande ägarskap FÖRE arbete, agenter
förhandlar aldrig om filer sinsemellan.

### GitHub Copilot, OpenAI Codex, Devin — namnrymd och för-analys, inte lås

Kort återgivet från samma passets § Delfråga 4 (redan primärkälle-verifierat
där): Copilot coding agent begränsar sig till en namnrymd (`copilot/`-
grenprefix) utan att adressera kollision mellan två samtidiga sådana grenar
([coding-agent](https://docs.github.com/en/copilot/concepts/coding-agent/coding-agent)).
OpenAI Codex resonerar om gits EGEN invariant (en gren kan bara vara
utcheckad i ett arbetsträd åt gången) men löser inte parallella SKRIVNINGAR
i olika filer — bara varnar: *"Be more careful with parallel write-heavy
workflows"* ([learn.chatgpt.com/docs/environments/git-worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees)).
Devin isolerar i egna VM:ar och löser kollision via FÖRHANDSGRUPPERING i
*"independent work packages that won't conflict"*, med en coordinator som
löser rester ([advanced-capabilities](https://docs.devin.ai/work-with-devin/advanced-capabilities))
— samma mönster som Cursor och som ADR-073: partitionera uppströms.

### Den akademiska litteraturen — problemet är MÄTT, inte löst av någon

Fyra oberoende mätningar (samtliga redan verifierade och citerade i
[nummerallokering-passet](nummerallokering-parallella-aktorer-2026-07-29.md)
§ Delfråga 4, återges destillerat här):

| Källa | Fynd |
|---|---|
| [arXiv:2607.04697](https://arxiv.org/html/2607.04697v2) | 19,8 % textkonfliktrat mellan två PR:er från **samma** agent — kollisionen kräver inte ens olika aktörer |
| [arXiv:2604.03551 (AgenticFlict)](https://arxiv.org/html/2604.03551v1) | 27,67 % konfliktrat över 142 000+ agentiska PR:er; per agent 15,24–31,85 % |
| [arXiv:2606.15376 (CoAgent)](https://arxiv.org/abs/2606.15376) | designar en serialiseringsordning VID launch + notifiera-och-reparera i stället för klassiska lås, med explicit motivering: *"classical mechanisms fit LLM agents poorly"* |
| [arXiv:2510.18893 (CodeCRDT)](https://arxiv.org/abs/2510.18893) | löser konflikten helt lås-fritt (CRDT, 100 % konvergens) men kostar upp till 39,4 % väggklocka-slowdown |

**Slutsatsen dessa fyra tillsammans licensierar:** ingen branschledare eller
forskningsgrupp har ett gratis svar. Isolering (worktrees/VM:ar) reducerar
INTE konfliktraten till noll — 19,8–31,85 % är mätt EFTER isolering, inte
före. Det bekräftar T119/T121:s premiss oberoende: worktree-isolering är
nödvändig men uttryckligen inte tillräcklig, och ingen granskad aktör har
ett motexempel.

## Syntes — vilken mekanismklass löser vilket fel, och vad kostar den

| Klass | Exempel | Löser | Löser INTE | Pris |
|---|---|---|---|---|
| **A — förebyggande anspråk** | Perforce `+l`/`p4 lock`, git-lfs lock, vår claims-check | Omöjligt-att-mergas-innehåll (binärer); slöseri FÖRE det uppstår, om disciplinen håller | Semantiska konflikter; skalar dåligt med agent-ANTAL (Cursor: 20→2–3) | Koordinations-overhead under HELA arbetet; kräver pålitlig release (glömda lås = flaskhals) |
| **B — upptäckt vid merge** | `git merge-tree`, GitHub/Zuul/Mergify-köer, Kubernetes `resourceVersion` | Textuell/strukturell konflikt, billigt och tidigt, UTAN att kosta något medan arbetet pågår | Semantiska konflikter (två ändringar som var för sig mergar rent men samverkar fel); redan investerat arbete kan visa sig bortkastat sent | Kö-mekanik (bisektion, full ombyggnad vid köhopp — redan mätt i [merge-queue-mot-staging-mutex-passet](merge-queue-mot-staging-mutex-2026-07-26.md)); rework-kostnaden faller SENT |
| **C — upplösning efter konflikt** | Sapling `restack`-och-vänta, vårt bundna mandat | Den SMALA klassen mekaniskt säkra konflikter (genererade filer, additiv bokföring) billigt och automatiskt | Allt annat — och det är MEDVETET: halt-first är en kretsbrytare, ingen fix | Hela kollisionens kostnad är redan betald när denna klass triggas; SRE:s egen varning (`sre.google/sre-book/eliminating-toil/`, citerad i [nummerallokering-passet](nummerallokering-parallella-aktorer-2026-07-29.md)) pekar ut sällan-fyrande reparations-automatik som den SVAGASTE klassen — sällan körd, sällan skarpt testad |

**Ingen klass ersätter en annan — de granskade systemen kombinerar dem, aldrig
väljer en.** GitHub kör B (kö) OVANPÅ krav på granskning (CODEOWNERS, en
helt annan axel). Cursor kör A (uppströms-partition, deklarerad av en
planerare, inte av agenterna) plus reaktiv triage när partitioneringen
missar. Vårt eget ADR-073 kör A (claims) + B (merge-tree) + smalt C
(bundet mandat) — redan alla tre, redan i rätt kombination enligt denna
genomgång.

## Den negativa frågan — finns precedent för att INTE bygga en claims-mekanism, och låta kön fånga kollisionerna?

**Ja, och den starkaste formen av argumentet är Anthropics eget verktyg:**
Claude Code bygger, per dagens dokumentation, medvetet INGEN
fil-claims-mekanism för worktrees eller agent teams — bara ett textråd
("partitionera manuellt"). Det är en genuin, levande, förstaparts-precedent
för att avstå.

**Men det är viktigt att läsa VAD den precedenten faktiskt argumenterar
för.** Ingen av de granskade källorna hävdar att "merge-kön ensam räcker"
som en PRINCIP — Anthropics dokumentation är TYST om mekanismen, inte
ARGUMENTERANDE mot den. Och den empiriska litteraturen (§ akademisk
mätning ovan) visar att just den kombinationen — isolering + inget
uppströms-anspråk — ger 19,8–31,85 % konfliktrat i praktiken hos de
faktiska produkter som kör den kombinationen. Det är svagt stöd för att
avstå, inte starkt.

**Det principiellt starkaste avstå-argumentet som FINNS i materialet är
SRE-litteraturens rangordning**, redan primärkälle-belagd i vårt eget
[nummerallokering-pass](nummerallokering-parallella-aktorer-2026-07-29.md)
§ Delfråga 5: *"Toil is work you do over and over"* — en händelse som
aldrig inträffat är per definition inte toil, och en reparations-automatik
som fyrar sällan är den SVAGASTE klassen att bygga (samma SRE-källa). Om
kollisioner i praktiken är sällsynta i vårt repo (vilket vi inte har mätt
för filkollisioner specifikt — se § Vad jag inte kunde belägga), talar SRE:s
egen rangordning FÖR att hålla mekanismen på den billigaste, kontinuerligt
exercerade nivån (klass B, en validator som körs vid VARJE parallell
avfyrning) snarare än att bygga ett tungt förhandsanspråksregister för
scenarier som ännu inte inträffat i vårt repo. Det argumentet gäller
`ii` (block-reservation/tungt register) — det gäller INTE mot att
mekanisera det klass A/B vi redan har.

**Slutsats på den negativa frågan:** det finns precedent för att INTE bygga
NÅGOT NYTT och TUNGT (SRE:s toil-argument, tillämpat rätt) — men det finns
INGEN precedent, vare sig vendor-argumenterad eller empirisk, för att
merge-kö-detektion ENSAM (utan uppströms-partitionering) är tillräcklig för
autonoma agenter specifikt. Precedensen pekar mot att BEHÅLLA
uppströms-anspråket (redan byggt, redan bevisat i S65-piloten: 0
merge-konflikter, 5/5 first-pass) och mekanisera det som redan är
designat, snarare än att lägga till en ny klass ELLER ta bort den
befintliga.

## Dom

**Bygg ingen ny mekanismklass.** ADR-073:s kombination (A: claims-check
uppströms + B: merge-tree-grind + smalt bundet C) är redan branschmönstret,
inte en avvikelse från det — bekräftat av nio+ oberoende granskade system
över fem produktkategorier (VCS, monorepo-styrning, CI/merge-kö,
orkestrerings-plattform, agentiska kodningsverktyg). Det uppdraget faktiskt
identifierar som gap är två saker, båda mindre än "ny mekanism":

1. **Mekanisering.** Claims-checken och merge-tree-grinden är idag prosa i
   en skill som en orkestrator-session utför för hand, inte kod. Det är
   exakt den svaghetsklass `T119`s egen inventering redan bevisat bryts av
   färska kontexter (samma mönster som `ADR-090`s katalogägarskap, samma
   familj som `L440`/`L441`). Att skriva ett faktiskt skript som kör
   `git merge-tree --write-tree` och rapporterar exit-koden är en betydligt
   mindre uppgift än att designa en ny mekanism, och den enda handling som
   faktiskt stänger gapet mellan "det finns i en ADR" och "det kan inte
   glömmas".
2. **Scope.** Mekanismen aktiveras idag ENDAST när Marcus explicit beordrar
   en partitionerad batch. Ad hoc-parallellitet (en forskningsagent + en
   bygg-agent + en till forskningsagent, utan en Marcus-beordrad partition)
   har inget anspråksregister att konsultera. Generaliseringen `T119` (d)
   efterfrågar är en scope-fråga (vem deklarerar, och när), inte en
   design-fråga (vilken mekanism).

## Vad jag inte kunde belägga

- **Google/Piper — åtkomst via tredjepartsspegel, inte direkt.**
  `cacm.acm.org` gav HTTP 403 vid direkthämtning. Citaten ovan är hämtade
  via [Alastair Reids akademiska spegling](https://alastairreid.github.io/RelatedWork/papers/potvin:cacm:2016/),
  en tredjepartsspegel av samma artikeltext, inte ACM:s egen sida.
  Innehållet bör vara korrekt återgivet (spegeln citerar, den omskriver
  inte), men det är inte en direkt primärkälle-hämtning i sig.
- **Meta Saplings server-sida `land`-konfliktbeteende.** Meta Engineering-
  bloggposten (2022) beskriver bara LOKALT `restack`-beteende. Servr-sidans
  faktiska hantering vid landning i det delade repot är odokumenterad i
  den källa jag nådde — bloggen själv noterar att *"many of our scale
  features... are therefore unavailable in our initial client release"*.
  ezyang-blogginlägget (2026, praktiker, INTE Metas officiella
  dokumentation) är den bästa källan jag hittade och är flaggad som sådan
  genomgående.
- **Vårt eget repos faktiska kollisionsfrekvens för FILNIVÅ-anspråk.** Till
  skillnad från nummerallokerings-passet (som mätte ADR/lesson/kort-
  kollisioner direkt) har detta pass INTE mätt hur ofta två parallella
  agenter i detta repo faktiskt rört samma fil utan att det fångats av
  ADR-073:s existerande claims-check. S65-pilotens 0/5 är den enda kända
  datapunkten, och den var en Marcus-partitionerad batch — inte ad
  hoc-parallellitet, vilket är precis den kategori frågan gäller.
- **Om Kubernetes Lease-mönstret (holder-identitet + TTL) faktiskt är bättre
  än ADR-073:s nuvarande statiska claims-deklaration för VÅRT specifika
  fall.** Detta är min egen analog slutledning (§ Kubernetes leases +
  admission control), inte ett testat eller källbelagt resultat. Ingen
  primärkälla applicerar Lease-mönstret på kodfils-partitionering.
- **Mergifys exakta bisektionsalgoritm** (hur många CI-körningar en
  N-stor batch kostar i värsta fall) — dokumentationssammanfattningen gav
  principen, inte en formel.
- **Zuuls ursprungsår (2012)** är belagt i sekundärkälla
  (opensource.com/Superuser, OpenStack Foundation-anknutna publikationer),
  inte i Zuuls egen primärdokumentation, som inte daterar sig själv.

## Rekommendation (inte ett beslut)

1. **Skriv claims-checken och merge-tree-grinden som verkliga skript**,
   samma klass artefakt som `scripts/staging-semaphore.sh` — inte för att
   logiken i ADR-073 är fel, utan för att den idag delar exakt den
   svaghetsklass `T119` redan bevisat: prosa i en skill efterlevs bara om
   en färsk kontext läser den ordagrant varje gång. Källa för PRINCIPEN:
   Claude Codes egen dokumentation, *"hooks are deterministic and
   guarantee the action happens"* mot CLAUDE.md/skills som är
   *"advisory"* ([processregler-mekanisering-passet](processregler-mekanisering-branschpraxis-2026-08-04.md)
   § Delfråga 1, redan primärkälle-citerat där).
2. **Generalisera VEM som får deklarera ett anspråk, inte VAD mekanismen
   gör.** Cursors mätning ([cursor.com/blog/scaling-agents](https://cursor.com/blog/scaling-agents))
   pekar entydigt mot att anspråk ska deklareras uppströms av en
   planerare/orkestrator FÖRE spawn — aldrig förhandlas mellan agenter i
   realtid. Utvidga alltså orkestratorns egen ansvarsyta (varje
   `Agent`-anrop som kan skriva kod bär en deklarerad fil-yta, oavsett om
   det sker inom en Marcus-beordrad batch eller ad hoc), snarare än att
   bygga en ny förhandlingsprotokoll-mekanism agenter kör sinsemellan.
3. **Håll klass A billig — en TTL-buren deklaration, inte ett hårt lås.**
   Källa: Kubernetes Lease-mönstrets egen motivering (förnyelse medan
   innehavaren lever, automatiskt frigjort annars) adresserar precis
   Cursors dominerande felklass (*"forget to release"*). Detta är min egen
   slutledning (flaggad ovan), inte ett direkt citerat mönster för just
   detta ändamål.
4. **Rör inte det bundna upplösningsmandatet (klass C).** Sapling — en
   branschledare med långt större skala än oss — auto-löser NOLL
   konfliktklasser och stannar alltid; vi auto-löser redan två smala,
   mekaniskt säkra klasser, vilket redan är mer generöst än Metas egen
   praxis. Att utöka klass C vore att gå i motsatt riktning mot vad den
   starkaste precedenten visar är säkert.
5. **Bygg inget block-reservation-liknande, tungt förhandsregister.**
   SRE-litteraturens toil-rangordning (redan belagd i
   [nummerallokering-passet](nummerallokering-parallella-aktorer-2026-07-29.md))
   talar mot det så länge kollisionsfrekvensen i VÅRT repo är omätt/låg —
   se § Vad jag inte kunde belägga, punkt 3. Mät den frekvensen FÖRE ett
   sådant beslut, inte i stället för det.

## Källförteckning

**Primärkälla — leverantörens egen dokumentation eller källkod:**

- [git-scm.com/docs/git-merge-tree](https://git-scm.com/docs/git-merge-tree)
- [GitHub — About code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [GitHub — Coding agent](https://docs.github.com/en/copilot/concepts/coding-agent/coding-agent)
- [Kubernetes — Leases](https://kubernetes.io/docs/concepts/architecture/leases/)
- [Kubernetes — API concepts (resourceVersion, concurrency)](https://kubernetes.io/docs/reference/using-api/api-concepts/)
- [Kubernetes — Admission controllers](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/)
- [Zuul — Project gating / speculative execution](https://zuul-ci.org/docs/zuul/discussion/gating.html)
- [Perforce — p4 lock](https://help.perforce.com/helix-core/server-apps/cmdref/current/Content/CmdRef/p4_lock.html)
- [Perforce — exclusive-open (+l) typemap locking](https://help.perforce.com/helix-core/server-apps/p4sag/2024.2/Content/P4SAG/superuser.basic.typemap_locking.html)
- [Git LFS — File Locking API](https://github.com/git-lfs/git-lfs/blob/main/docs/api/locking.md)
- [Mergify — Merge Queue overview](https://docs.mergify.com/merge-queue/)
- [Mergify — Speculative (parallel) checks](https://docs.mergify.com/merge-queue/speculative-checks/)
- [Chromium — Mandatory Code Review and Native OWNERS](https://chromium.googlesource.com/chromium/src/+/main/docs/code_review_owners.md)
- [Meta Engineering — Sapling: source control that's user-friendly and scalable](https://engineering.fb.com/2022/11/15/open-source/sapling-source-control-scalable/)
- [Claude Code — Agent teams](https://code.claude.com/docs/en/agent-teams)
- [Claude Code — Worktrees](https://code.claude.com/docs/en/worktrees)
- [OpenAI Codex — Git worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees)
- [Devin — Advanced capabilities](https://docs.devin.ai/work-with-devin/advanced-capabilities)
- [Cursor — Scaling agents](https://cursor.com/blog/scaling-agents)
- [arXiv:2607.04697](https://arxiv.org/html/2607.04697v2)
- [arXiv:2604.03551 — AgenticFlict](https://arxiv.org/html/2604.03551v1)
- [arXiv:2606.15376 — CoAgent](https://arxiv.org/abs/2606.15376)
- [arXiv:2510.18893 — CodeCRDT](https://arxiv.org/abs/2510.18893)
- [GitHub Engineering — How GitHub uses merge queue to ship hundreds of changes every day](https://github.blog/engineering/engineering-principles/how-github-uses-merge-queue-to-ship-hundreds-of-changes-every-day/)

**Sekundärkälla (flaggad i text där använd):**

- [Alastair Reids akademiska spegling av Potvin & Levenberg, CACM 2016](https://alastairreid.github.io/RelatedWork/papers/potvin:cacm:2016/)
  (kanonisk källa: [cacm.acm.org](https://cacm.acm.org/research/why-google-stores-billions-of-lines-of-code-in-a-single-repository/),
  gav HTTP 403 vid direkthämtning)
- [ezyang's blog — Parallel Agents ❤️ Sapling (2026-03)](https://blog.ezyang.com/2026/03/parallel-agents-heart-sapling/)
  — praktiker-blogg, inte Metas officiella dokumentation
- [opensource.com — Introducing Zuul for improved CI/CD](https://opensource.com/article/20/2/zuul)
  — Zuuls ursprungsår 2012, ej daterat i Zuuls egen dokumentation

**Internt underlag (detta repo, återanvänt utan omkörning):**

- [ADR-073 — Parallella batch-pipelines](../decisions/ADR-073-parallella-batch-pipelines.md)
- [merge-queue-mot-staging-mutex-2026-07-26.md](merge-queue-mot-staging-mutex-2026-07-26.md)
- [nummerallokering-parallella-aktorer-2026-07-29.md](nummerallokering-parallella-aktorer-2026-07-29.md)
  (§ Delfråga 4 — agentiska kodningssystem, redan primärkälle-verifierad där)
- [processregler-mekanisering-branschpraxis-2026-08-04.md](processregler-mekanisering-branschpraxis-2026-08-04.md)
  (tre-lagers-doktrinen)
- `tasks/threads/README.md` (rad 162, `T119`; rad 164, `T121`)
- `tasks/sessions/archive/2026-08/2026-08-04-session-97.md` ("Paushistorik — Session 97,
  tredje pausen" § CARRY)
- `CLAUDE.md` § "Agenter kan INTE arbeta cross-repo — och varje worktree
  kostar"
- `plugins/marcus-system/skills/work-batch/SKILL.md` § "Parallell form"
  (plugin-cache, ej repo-relativ sökväg — citerad som text, ej länkad)
- `scripts/classify-post-merge.sh` (verifierat: enda träffen på
  "merge-tree" i `scripts/`, avser en annan kontroll)
- `scripts/staging-semaphore.sh` (kontrasterande exempel: mekaniserad kod,
  till skillnad från claims-checken)
