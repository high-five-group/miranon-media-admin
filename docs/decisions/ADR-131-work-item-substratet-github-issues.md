# ADR-131: Work-item-substratet flyttar till GitHub Issues — forgen är arbetslappen, git är historieboken

- **Status:** Accepted (grillad samsyn S118 Del 2, 2026-09-04, nio beslut
  kvitterade var för sig och i block: *"Okej. Kvitterar."*)
  **ADR-baren** (`~/.claude/CLAUDE.md` § ADR-BAR) klaras på alla tre villkor:
  **svårt att återställa** — i koherens: fyra hub-skills, en nattgrind, en
  hook, en CLI-wrapper, två CLAUDE.md-avsnitt och 786 kortidentiteter bygger
  på att kortet är en fil i git; efter flytten bygger allt nytt på att det
  är ett issue. **Överraskande utan kontext** — repot valde bort GitHub
  Issues uttryckligen den 4 juli (S48 Del 2) med fem namngivna offer, och
  den som läser `backlog/tasks/` fryst bredvid levande issues undrar varför.
  **Resultat av en verklig avvägning** — fem alternativ och en
  stängningsform vägdes mot mätningar, och den valda bär ett pris som
  redovisas i § Konsekvenser.
- **Datum:** 2026-09-04
- **Fas:** apparaten, inte produkten. Grillningen av `TASK-328` (S118
  scope-punkt 5) efter apparatkartan
  [`S118-apparatkartan-2026-09-04.md`](../../tasks/threads/S118-apparatkartan-2026-09-04.md)
  § 9.5.
- **Rör:** `backlog/` (fryses) · `scripts/check-backlog-closure.sh`,
  `scripts/backlog-kortfakta.mjs`, `scripts/backlog-cli.sh` med testsviter
  (rivs) · `backlog.md` som devDependency (rivs) · `.github/workflows/`
  nightly-jobbet Backlog-stängning (ersätts) · hub-pluginets skills
  `to-prd`, `to-issues`, `do-work`, `work-batch` och hooken
  `deny-backlog-direct-edit` (tracker-neutrala) · `CLAUDE.md` § Kortnummer
  och § ISSUE-SUBSTRAT (pekare) · GitHub-repots labels och issue-typer.
- **Relation till tidigare beslut:** **river öppet** S48 Del 2 beslut A
  (Backlog.md som substrat, `tasks/sessions/archive/2026-07/2026-07-04-session-48.md`
  rad 60–200; ingen ADR mintades då) med dess DECLINE av
  "GitHub Issues-molnspåret" · **superseder vid rivningen**
  [`ADR-117`](ADR-117-backlog-grindens-faktainsamling-bulk-och-korsvalidering.md)
  och [`ADR-127`](ADR-127-backlog-stangningsformerna-harledd-dod-och-avstadda-krav.md),
  vars mekanik bara finns för att kortet är en fil · **behåller**
  [`ADR-081`](ADR-081-nummer-tilldelas-vid-landning.md) för lesson- och
  ADR-nummer, medan kort-halvan blir moot · **tillämpar**
  [`ADR-106`](ADR-106-agnostik-snittet-harness-neutral-karna-harness-djup-drivning.md)
  på trackern och [`ADR-096`](ADR-096-subagentens-vantekontrakt.md) på vem
  som stänger · **vilar på** [`ADR-076`](ADR-076-merge-grinden-ruleset-pr-flode.md)
  och post-merge-lagret (`TASK-70`) för Done-semantiken.
  **Not om en felcitering:** S48 tillskrev kriteriet "governade filer i git"
  till `ADR-068` punkt 7. Den punkten handlar om målytorna där
  övnings-ramen syns, inte om filer i git. Kriteriet var S48:s eget, och
  det är det kriteriet som rivs här — `ADR-068` rörs inte.

## Kontext

### Problemet, mätt

Backlog.md:s `task create` tar ett globalt exklusivt lås i git-common-dir,
håller det under hela gren-skanningen och har en budget på 30 sekunder
utan backoff. Kvoten *agenter ≈ 30 / T_create + 1* gör kön kastande, inte
långsam: vid åtta samtidiga skapanden lyckades två och sex föll
(`docs/research/backlog-kortskapandets-flaskhals-2026-08-26.md`). Ett kort
tog 513 sekunder att skapa under S112:s fleet (`TASK-322`). Uppströms
avvisade kollisionsfria ID:n i issue 711, stängd 2026-07-10. Sju åtgärder
landade mellan 2026-07-30 och 2026-08-28 (`TASK-93`, `102`, `238`/`ADR-117`,
`250`, `118`, `310`, `327`, `323`) och sänkte läskostnaden dramatiskt —
`task list` mättes 2026-09-04 till 1,7–1,9 s mot 39 s i augusti — men
`create` är oförändrad av 1.50.1 och kollisionsklassen består. Marcus
2026-08-26: *"Kortskapandet tar en jävla tid, blir kö. Så kan inte
proffsen jobba."* Marcus 2026-09-04: *"Den punkten bör vi väl behandla som
lite prio eller fundamental liksom."*

### Det ursprungliga beslutet, och vad som ändrats

S48 (2026-07-04) valde Backlog.md som enda kandidat med ✓ på alla åtta
kriterier, varav K1 var "filer i git", och avvisade GitHub Issues med fem
offer: spec-trailen blir muterbar molnstate utan commit-historik, den
atomiska kopplingen kort↔kod försvinner, CI får ett nätverks- och
secret-beroende, do-work skulle kräva nätverk per varv, och state utanför
disk var vad Chat-pensioneringen rev. Nyckelmeningen: *"Matt löser inte
offren — han HAR dem inte: hans specar är operativt förbrukningsmaterial
(han grindar kod, inte specar); vår konstitution gör arbets-specen till
governad trail-artefakt."* Återväckningsvillkoret sattes till "externa
utvecklare i repot". Fleet-drift och parallella sessioner fanns inte då.

Fem mätta fakta som beslutet inte såg:

1. Sekventiella fil-ID:n från flera allokatorer ger en kastande kö
   (ovan).
2. Stängningsbatch-PR:er är en mätt del av processens overhead: 6 av 36
   PR:er i S113 (2026-08-29) var stängningsbatchar, och 16 av 36 var
   processens egen bokföring. Med Issues är en Done-flipp ett CLI-anrop.
3. Closure-grinden hänger över en timme under fleet-last (`TASK-206`).
4. Läsningar blev lokala i 1.50.1, så ett kort på en annan gren är
   osynligt för systersessionen — en ny klass av blindhet mellan
   parallella sessioner.
5. Offer tre är redan betalt: review-backstoppen kör `gh` i CI sedan
   `TASK-173.4`. Offer fyra är svagt: agenterna pushar ändå.

### Proffsens modell

Hos Google, i Kubernetes och hos GitHub själva är ärendet en arbetslapp.
Historieboken är koden, testerna och commit-meddelandet, som skriver
"Fixes #N" och länkar åt båda håll. Beslut som ska överleva bor i
designdokument och ADR:er i git. Pococks skills kör GitHub Issues via
`gh` med exakt den formen (`docs/reference/pocock/skills-svenska/setup-matt-pocock-skills/issue-tracker-github.md`).
Ingen av dem lagrar ärenden i git; git-bug och beads är nischverktyg, och
beads mättes till tyst dataförlust i vårt exakta körmönster. Vår
konstitutions trail bor kvar i git som sessionsdok, trådar, lessons och
ADR:er — det som flyttar är bara arbetslappen. Forskningen:
[`parallella-sessioner-och-merge-van-2026-09-04.md`](../research/parallella-sessioner-och-merge-van-2026-09-04.md)
och
[`issue-stangning-vem-och-nar-branschpraxis-2026-09-04.md`](../research/issue-stangning-vem-och-nar-branschpraxis-2026-09-04.md).

## Beslut

### 1. Sanningen flyttar till GitHub Issues

Ett kort är ett GitHub-issue i repot `high-five-group/miranon-media-admin`.
Koden, commit-meddelandet och ADR:erna är historieboken; kortet är en
arbetslapp på forgen. Ordet **kort** behålls som vårt namn på en
arbetslapp oavsett substrat; **issue** är GitHubs instans av ett kort.
Termen hör till hubbens `SYSTEMET.md` §0 och lyfts dit i hub-lyftet.

### 2. Bara öppna kort migreras, Done-korten fryses på plats

Kort med status To Do eller In Progress vid brytdagen migreras med gamla
TASK-numret i titeln, `[TASK-368.5] Ombokningssteget`. Done-korten
förblir filer i `backlog/tasks/`, som fryses som skrivskyddat arkiv med
README och behålls för alltid, så att varje historisk TASK-referens i
ADR:er, sessionsdok och commit-meddelanden fortsätter peka på en fil.

### 3. Stegvis övergång med hårt brytdatum

Ordning: minimalt test (§ 8) → denna ADR och PRD:n → hub-skillsen
(§ 6) → brytdagen, då skapa-hooken vänds, öppna kort migreras i ett svep
och skillsen pekas om. Två substrat lever bara mellan att skillsen är
klara och brytdagen. Andra sessioner mintar och stänger i Backlog.md till
brytdagen, meddelade via sessionsmeddelande (S119 kvitterade 2026-09-04).
Migrations-PRD:n är det första issuet.

### 4. Done sätts explicit av orkestreraren efter grön post-merge

PR-kroppen skriver `Refs #N`, aldrig `Closes #N`. Orkestrerarens svep
stänger issuet med `gh issue close N --comment "<post-merge run-id>"`
efter att post-merge-lagret på `main` är grönt. Stängningskommentaren är
verifieringssignalen — proffsens "Verified" i ett steg — och Done
betyder fortsatt *verifierat på main*, aldrig satt av en bygg-agent
(`ADR-096`). AC och DoD är kryssrutor i issue-kroppen, bockade med
`gh issue edit`; review-agenten läser AC ur issuet med
`gh issue view --json body`. Closure-grinden ersätts av ett nattligt
skript som listar stängda issues med obockade rutor. `wontfix` blir
stängningsskälet *not planned*; `intentionally-unchecked` följer med som
label.

### 5. Kurerad label-taxonomi i policy-fil, GitHubs typer som de är

Tre familjer, deklarerade i en policy-fil som migrationsskriptet läser:
**tillstånd** (`ready-for-agent`, `ready-for-human`,
`intentionally-unchecked`, `intentionally-open`, `deferred`), **klass**
(`prd`, `fynd`, `beslut`, `grillning`, `restsamling`), **område**
(`grind`, `hook`, `hub`, `sakerhet`, `airtable`, `docs`, `deps`, `a11y`,
`prod`, `stad`, `datakvalitet` och övriga i bruk). Alla 30 labels i bruk
får ett hem; bara dubbletter faller. Organisationens issue-typer Feature,
Bug och Task används med GitHubs mening: Feature för PRD-föräldrar, Bug
för defekt-fynd, Task för resten; inga egna typer i första varvet.
Hierarkin PRD → skiva bärs av sub-issues (`--parent`), beroenden av
`--blocked-by`. De fyra befintliga larm-labels rörs inte.

### 6. Hub-skillsen blir tracker-neutrala efter Pococks referensfil-mönster

`to-prd`, `to-issues`, `do-work` och `work-batch` skrivs tracker-neutrala
och pekar på en referensfil per tracker, `issue-tracker-github.md`
respektive `issue-tracker-backlog-md.md`. Spoken deklarerar sin tracker i
en config-rad. Backlog.md-referensen behålls tills sista spoken bytt och
rivs sedan. Hooken `deny-backlog-direct-edit` blir tracker-medveten eller
rivs. Detta är `ADR-106`:s agnostik-snitt tillämpat på trackern.

### 7. Rivning i två steg

Brytdagen byter beteende. Rivningen av `check-backlog-closure.sh`,
`backlog-kortfakta.mjs`, `backlog-cli.sh`, deras testsviter, `backlog.md`
som devDependency, `backlog/config.yml`, nightly-jobbet Backlog-stängning
och CLAUDE.md-avsnitten Kortnummer och ISSUE-SUBSTRAT kommer som egen PR
efter en veckas verifierad drift. `ADR-117` och `ADR-127` markeras
*Superseded by ADR-131* i samma PR.

### 8. Migrationsskript och minimalt test

Skriptet: torrkörning som default, `--utfor` för skarp körning,
idempotent på titel, föräldrar före barn, `--parent` och `--blocked-by`
ur kortens frontmatter, en sekund mellan skrivningar, beskrivning, AC och
DoD som tre sektioner med kryssrutor, labels via policy-filen, ursprungsfil
i första kommentaren, en karta TASK-nummer → issue-nummer i
`docs/reference/`, och en sista frontmatter-rad `migrated_to` i varje
migrerad kortfil. Byggs av en bygg-agent med testsvit mot fixtur-kort.

Minimalt test, i denna ordning och före migrationen: (1) PRD:n skapas för
hand med `gh` som förälder med sub-issues och ett beroende, (2) ett
do-work-varv mot ett sub-issue med gh-instruktioner i uppdraget, PR med
`Refs #N`, (3) en review-agent läser AC ur issuet, (4) orkestreraren
stänger efter grön post-merge med körnings-id. Faller ett steg stannar
migrationen där.

### 9. Ägarskap

Orkestreraren skriver ADR och PRD och driver brytdagen i en egen session,
samordnad med varje levande session via meddelande. Bygg-agenter bygger
skript, nattskript och dokumentation i egna worktrees. Hub-lyftet görs
oisolerat i hubben. `TASK-328` stängs i Backlog.md med båda AC bockade,
eftersom det är substratet tills brytdagen.

## Alternativ som övervägdes

### (0) Oförändrat

2 av 8 skapanden lyckas vid samtidighet. Trasigt, mätt.

### (1) 1.50.1 plus städning plus sänkt `active_branch_days`

Redan landat (`TASK-327`, `TASK-323`). Flyttar kvoten från två till kanske
fem agenter. Kollisionsklassen består, och en nedskruvad
`active_branch_days` gör kort på äldre grenar osynliga för skanningen.

### (2) Skanning av plus kollisionsgrind vid landning

`ADR-081`:s princip tillämpad på kort, labbmätt 8/8 på 6,5 s, reversibel
med en config-rad. Research-dokets starkaste kandidat *före* ett byte.
Förkastad som huvudväg därför att den hanterar kollisionen i stället för
att eliminera den, lämnar stängningsbatch-PR:erna, closure-grinden och
cross-branch-blindheten orörda, och delar arkitektur med den redan
hängande nattgrinden. Ett byte löser fyra mätta problem; grinden löser
ett.

### (3) GitHub Issues — valt

Se § Beslut. Priset står i § Konsekvenser.

### (4) beads

Sanningen i en gitignorad Dolt-databas som river do-work-disciplinen,
server mode obligatoriskt, och två öppna uppströms-issues i vårt exakta
körmönster varav en beskriver tyst förlust av 7 av 8 `bd close`. Hålls
under observation, väljs inte.

### (5) Orkestrator-allokerade ID-block

Bryter CLI-regeln eller kräver att kortfiler skrivs förbi hooken, och
hittades i noll av sju flöden i tidigare pass. Löser bara allokeringen.

### Hybrid stängning: `Closes #N` plus verifierings-label

Proffsens vanligaste form (Google Fixed → Verified, GitLab merge som steg
ett). Förkastad för oss därför att den återinför `ADR-127`:s hål ett lager
upp — stängt före verifierat — kräver en etikettvokabulär och
återöppningslogik, och ändrar Done-definitionen. Explicit stängning ger
ett tillstånd med samma verifieringssignal i kommentaren. GitHubs egen
modell, deploy före merge, går inte att kopiera: vi verifierar efter merge.

### Allt flyttar, eller ingenting flyttar

786 skrivningar med sekundsintervall och brutna historiska referenser,
respektive två substrat i veckor. Förkastade i § Beslut 2.

## Konsekvenser

**Vinster, mätbara:** kollisionsklassen försvinner (servern allokerar);
stängningsbatch-PR:erna försvinner (en Done-flipp är ett anrop);
closure-grinden och dess nattjobb rivs; alla sessioner ser samma kort
direkt; kort kan läsas och kommenteras från vilken enhet som helst; `gh`
är CLI-ergonomiskt enligt Kun Chens AXI-mätning, och review-agenten
föredrar det redan.

**Pris, öppet redovisat:** kortets ändringshistoria ligger på GitHub, inte
i git — `git log --grep` och Pre-K-passet ser commit-meddelandenas `#N`,
inte kortets kropp; den atomiska kopplingen kort↔kod i samma commit
ersätts av `Refs #N` och stängningskommentaren; issue- och PR-nummer
delar sekvens, så kort-ID:n blir glesa; GitHubs sekundära gränser kräver
seriella skrivningar med en sekunds mellanrum; migrationens tid är
oräknad i timmar men bunden i klasser (≈ 110 kort, 3 skript, 1 workflow,
4 hub-skills, 1 hook, 2 CLAUDE.md-avsnitt).

**Åtaganden:** PRD:n med nio sub-issues bär arbetet; kartan TASK → issue
landar i `docs/reference/`; hubbens `SYSTEMET.md` §0 får termerna kort och
issue; `CLAUDE.md` § ISSUE-SUBSTRAT i hubben pekar på referensfilen;
apparatkartans § 5 rättas när korten flyttat.

**Återväckningsvillkor, nedskrivna i förväg:** (a) GitHub ändrar eller
avvecklar sub-issues eller `gh`:s `--parent`/`--blocked-by`; (b) en spoke
måste arbeta utan forge; (c) sekundära rate-limits mäts blockera
framdrift vid vår faktiska fleet-storlek; (d) Backlog.md uppströms
levererar kollisionsfria ID:n och server-lös samtidighet. Inträffar något
av dem väcks frågan som medvetet beslut, inte som tyst återgång.

## Relaterat

- [`S118-apparatkartan-2026-09-04.md`](../../tasks/threads/S118-apparatkartan-2026-09-04.md) § 1, § 9.5
- [`backlog-kortskapandets-flaskhals-2026-08-26.md`](../research/backlog-kortskapandets-flaskhals-2026-08-26.md)
- [`parallella-sessioner-och-merge-van-2026-09-04.md`](../research/parallella-sessioner-och-merge-van-2026-09-04.md)
- [`issue-stangning-vem-och-nar-branschpraxis-2026-09-04.md`](../research/issue-stangning-vem-och-nar-branschpraxis-2026-09-04.md)
- S48 Del 2 (arkiverat sessionsdok), `T57`, `TASK-328`, `TASK-206`,
  `TASK-323`, `TASK-335`

## Updates

Inga än.
