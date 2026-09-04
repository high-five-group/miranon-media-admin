---
owner: marcus803
updated: 2026-09-04
review_by: 2027-03-04
status: draft
---

# Väntar branschledarnas huvudsessioner på PR-landning, eller jobbar de vidare asynkront? (Code, 2026-09-04)

> **Proveniens.** Avgränsat research-pass, beställt av orkestreraren efter att
> Marcus 2026-09-03 observerade alla fyra parallella orkestrerar-sessioner stå
> och vänta samtidigt på att sina respektive PR:er skulle landa. Repo:
> `miranon-media-admin`, git `main`, HEAD `78de4a7d`. Kört OISOLERAT (delad
> huvudkatalog ägd av en annan levande session) — enda skrivningen är denna
> fil, skriven till scratchpad och flyttad hit av S118:s orkestrerare i egen worktree.

## Vad jag redan visste innan jag sökte något nytt

Repot bär redan tre täta, primärkälle-citerade pass i exakt detta
grannskap, och jag läste alla tre i sin helhet innan jag öppnade en enda
webbsökning:

- **[`ADR-096`](../decisions/ADR-096-subagentens-vantekontrakt.md)** —
  "en subagent GÖR, orkestreraren VÄNTAR", Temporal-mönstret (Workflow äger
  väntan, Activity gör och returnerar). Löser VEM som får vänta —
  **inte** om orkestreraren, när den väntar, samtidigt bör starta nästa
  oberoende enhet. Explicit avråder en extern köhanterare (alternativ D) på
  PROPORTIONALITET, inte på att den skulle vara fel — "vi har mätt EN
  flaskhals-kostnad ... och NOLL mätning av hur ofta orkestrerar-väntan
  faktiskt blockerar FRAMDRIFT".
- **[`ADR-097`](../decisions/ADR-097-arbetsformens-tillstandsbarare.md)** —
  "commit är gratis, push kostar". Avvisar uttryckligen **session-batchad
  push** (samla allt och pusha en gång per session) av fyra mätta skäl,
  bland dem DORA/trunk-based-golvet om små batchar. Löser DÄREMOT inte
  frågan om orkestreraren bör hålla FLERA enheter i luften samtidigt — den
  reglerar bara NÄR en färdig enhet pushas, inte om nästa enhet får
  PÅBÖRJAS före föregåendes landning.
- **`docs/research/orkestrerar-vackning-polling-vs-event-driven-2026-08-02.md`**
  — belägger att vårt 90 s heartbeat-svep är samma mönsterfamilj som GitHubs
  self-hosted-runner, Buildkite och Kubernetes' reconciliation-loop
  (level-triggered). Löser HUR väckning sker mekaniskt — **inte** vad
  orkestreraren gör MELLAN väckningarna.
- **`docs/research/sessions-parallellitet-frontier-praxis-2026-08-02.md`** —
  belägger att worktree-per-parallell-session är brett etablerat (Anthropic,
  JetBrains, GitHub Copilot-appen, Cursor), men att "detektera + tyst
  auto-isolera" saknar precedent. Om FLERA parallella orkestrerar-sessioner
  i sig är rätt form (inte om var och en bör blockera).
- **`CONTRIBUTING.md` § Landnings-ordningen** — vår kö kör `ALLGREEN`,
  `max_entries_to_merge: 3`, och egen mätt kö-genomloppstid: **median 16 s
  (p90 27 s), värsta uppmätta fall 5 min 8 s, över 30 landningar**
  (`docs/research/kohopp-bradskande-revert-2026-07-30.md`, redan i repot).
  Detta är vår egen empiri om KÖNS kostnad — vad detta pass saknade var
  branschjämförelsen mot den kostnaden och mot vad man gör MEDAN man betalar
  den.

**Ingen av de fyra fanns adresserat: frågan "bör huvudsessionen jobba vidare
på nästa enhet medan en tidigare enhets PR ligger i kön/granskningen, och hur
hanteras då beroenden" är obesvarad i repots befintliga underlag.** Det är
den luckan detta pass fyller. Inget av det ovanstående är åldrat i någon
del som är relevant här — ADR:erna är tre veckor gamla (2026-08-07) och
research-passen fyra–fem veckor, inom samma arkitektur-generation (merge
queue sedan 2026-07-29, oförändrad).

## Kort svar

**Nej — mogna verktyg och etablerad praxis bygger uttryckligen INTE in
blockerande väntan på PR-landning i huvudflödet.** Mönstret som dominerar,
brett och med primärkällor i majoritet, är: en arbetsenhet skickas iväg
(PR öppnas/köas), och utföraren **fortsätter omedelbart med nästa enhet**
medan landningen sker asynkront. Google säger det rakt ut i sin egen
`eng-practices`-guide: *"If you write a small CL and then you wait for your
reviewer to approve it before you write your next CL, then you're going to
waste a lot of time."* Kubernetes egen merge-kö (Tide) säger till
PR-författaren: *"typically your work is done!"* — gå vidare. GitHubs
merge-kö är byggd uttryckligen för att en författare INTE ska behöva vänta
på statuskontroller innan de går vidare.

**Beroenden mellan enheter hanteras huvudsakligen på tre sätt**, i fallande
vanlighet i källorna: (1) **hålla enheterna oberoende av varandra** (Googles
förstahandsråd — små, fristående CL:er är den egentliga lösningen, inte ett
verktygsproblem); (2) **stackade grenar/PR:er** när beroende är
oundvikligt (Graphite, Meta/Phabricator/Sapling — bygg nästa lager direkt
ovanpå det föregående, låt tooling omrebasa automatiskt); (3) **feature
flags / trunk-based-frikoppling** (landa ofärdigt bakom en flagga så att
nästa steg inte behöver vänta på att föregående är release-klart).

**Den verkliga flaskhalsen 2026, mätt av flera oberoende källor, är
INTE längre kö-landningen — det är GRANSKNINGEN.** DORA 2025/Faros AI:s
telemetri över 10 000+ utvecklare visar granskningstid **+91 %** och
PR-storlek **+154 %** i takt med AI-adoption, utan motsvarande förbättring
av organisationens leveransmått. Ett community-inlägg om Claude Code-agenter
som öppnade 219 PR:er på en dag sammanfattar det i en enda rad: *"Parallel
agents do not erase the merge queue. They fill it."* Detta är strukturellt
samma observation som repots EGET granskningslager (`ADR-105`,
review-grinden) redan byggt in — men det bekräftar att vår flaskhals-analys
pekar åt rätt håll: kön i sig är billig (16 s median hos oss), granskningen
är inte det.

## A — Väntar proffsens huvudsessioner, eller jobbar de vidare?

### A1. Google — förstapartskälla, explicit och kvantitativ om kostnaden av att vänta

[`google.github.io/eng-practices/review/developer/small-cls.html`](https://google.github.io/eng-practices/review/developer/small-cls.html)
(Googles egen `eng-practices`-guide, publicerad under `google/eng-practices`
på GitHub — förstapartskälla, hämtad 2026-09-04):

> "If you write a small CL and then you wait for your reviewer to approve it
> before you write your next CL, then you're going to waste a lot of time."

Rekommenderade strategier, ordagrant ur samma sida: arbeta på flera projekt
samtidigt, säkra granskare med omedelbar tillgänglighet, para-programmera —
och, som en NAMNGIVEN teknik, **"Stacking Multiple Changes on Top of Each
Other"**: skriv en liten CL, skicka den för granskning, och **"immediately
start writing another CL based on the first CL"**. Sidan konstaterar att de
flesta versionshanteringssystem stöder detta flöde.

Detta är den starkaste enskilda källan i hela passet för Marcus fråga:
Google — arkitekten bakom trunk-based development som repots egen tidigare
research (`sessions-parallellitet-frontier-praxis-2026-08-02.md` § delfråga
4) redan citerar för trunk-modellen — säger uttryckligen att väntan är
**bortkastad tid**, inte en nödvändig disciplin.

### A2. Kubernetes Tide — förstapartskälla, "ditt jobb är klart"

[`docs.prow.k8s.io/docs/components/core/tide/pr-authors/`](https://docs.prow.k8s.io/docs/components/core/tide/pr-authors/)
(Kubernetes/Prow officiell dokumentation, hämtad 2026-09-04):

> "Once your PR is in the merge pool it is queued for merge and will be
> automatically retested before merge if necessary. So **typically your work
> is done!**"

Och om ombatchning/omtestning, som sker helt utan författarens inblandning:

> "Your PR remains in the pool and will be automatically retested so this
> doesn't require any action from you."

Tide är samma mönsterfamilj som vår egen merge queue (mekanisk, batch-
medveten, kräver att kraven redan uppfyllts) — och Kubernetes-projektets
egen instruktion till sina bidragsgivare är uttryckligen att **sluta
vakta** och gå vidare.

### A3. GitHub — förstapartskälla, mekanismens uttalade syfte

[`docs.github.com/.../managing-a-merge-queue`](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue)
(hämtad 2026-09-04):

> "does not require a pull request author to update their pull request
> branch and **wait for status checks to finish** before trying to merge"

Detta är exakt mekanismen vårt repo redan kör (`ADR-076`), och GitHub
beskriver sitt eget existensskäl som att ELIMINERA just den väntan Marcus
observerade. Att fyra av våra sessioner ändå väntade är alltså inte en
egenskap hos verktyget — det är ett användningsmönster ovanpå det.

### A4. Stacked-diffs-familjen (Graphite, Meta/Phabricator/Sapling) — branschmönster, inte enstaka verktyg

[`graphite.com/blog/stacked-prs`](https://graphite.com/blog/stacked-prs)
(hämtad 2026-09-04): *"you open your first PR with a small change, submit it
for review, and **immediately start the next branch on top of it**."*
Restacking (att föra ändringar nedåt i kedjan när en tidigare länk får
feedback) är automatiserat med ett enda kommando (`gt modify -a`).

Meta byggde motsvarande i Phabricator/Differential och senare Sapling: enligt
sekundärkällor (Pragmatic Engineer-nyhetsbrevet, `jg.gg`-bloggen — citerade
brett i branschen men inte Metas egen dokumentation, flaggat som sekundärt)
är arbetsflödet **"start working on the first change, submit a Diff for
review from the command line, and then start working on the second change
while submitting another Diff for review."** Samma princip som Google och
Graphite, en annan implementation.

### A5. Devin, Codex, Copilot-appen — agent-leverantörernas egen arkitektur är asynkron per konstruktion

- **OpenAI Codex** (`openai.com/codex/`, hämtad via sökning 2026-09-04):
  *"Codex is asynchronous and cloud-based. You hand it a task, it works in
  an isolated sandbox, and it returns a finished pull request you review
  later."* Flera uppgifter körs i EGNA containrar SAMTIDIGT, och Codex
  själv rekommenderar en *"abundance mindset"* — kör flera uppgifter
  parallellt i stället för att invänta en i taget.
- **Devin** (Cognition, sekundärkällor sammanställda från flera
  produktsidor): *"Devin is for asynchronous task delegation — you assign a
  task and Devin works independently."* Devin kan tilldelas 10 oberoende
  ärenden samtidigt, var och en i egen sandlåda.
- **GitHub Copilot-appen** (redan citerad i repots egen
  `sessions-parallellitet-frontier-praxis-2026-08-02.md`): varje session får
  automatiskt en egen worktree — men själva granskningsflödet är asynkront,
  PR:erna landar när de landar, utan att appen håller något blockerat i
  väntan.

Ingen av de tre leverantörerna bygger in ett steg där agenten (eller
människan som styr den) SITTER och väntar på att en PR ska landa innan
nästa uppgift får startas. Tvärtom: konstruktionen (egen sandlåda/container
per uppgift) gör blockering strukturellt onödig.

### A6. Var flaskhalsen faktiskt ligger nu — granskningen, inte kön

- **DORA 2025 / Faros AI-telemetri** (10 000+ utvecklare, 1 255 team,
  sekundärkälla sammanställd av flera branschbloggar som citerar samma
  studie, primärstudien själv ej direktåtkommen i detta pass): hög
  AI-adoption gav **21 % fler avslutade uppgifter, 98 % fler mergade PR:er**
  — men **PR-granskningstid +91 %, PR-storlek +154 %, buggantal +9 %**, och
  **organisationens DORA-mått (leveransfrekvens, ledtid, ändringsfelfrekvens)
  visade ingen mätbar förbättring.** Slutsats i egna ord från källorna: AI
  löser inte flaskhalsar, den förstorar dem — "AI does not fix systems; it
  intensifies what already exists."
- **"When agents open 200 PRs, Devin Review is the real rate limit"**
  (`devincentral.com`, branschartikel, sekundärkälla — inte ett mätt
  forskningsresultat utan en fallstudie/anekdot): dokumenterar 219 PR:er
  öppnade på en dag av parallella Claude Code-subagenter i en verklig
  organisation (Developers Digest). Central rad: **"Parallel agents do not
  erase the merge queue. They fill it."** Ingen kvantitativ kö-/gransknings-
  data ges — flaggas som tunt, se § Vad jag inte kunde belägga.
- **`tianpan.co/blog/2026-07-02-the-merge-queue-is-the-new-bottleneck`**
  (branschblogg, sekundärkälla, hämtad 2026-09-04): ger en konkret formel
  för strikt ordnad kö: *"If your merge-group CI takes 30 minutes end to
  end, a strictly ordered queue lands at most two PRs per hour — 48 per day
  if nothing ever fails."* Och om trängsel: *"when arrivals approach
  capacity, wait times don't grow linearly, they explode."* Denna artikel
  föreslår **parallella köer som dirigerar oberoende ändringar förbi
  varandra** ("docs never wait behind schema migrations") som en av flera
  motmedel — vilket är precis vad vår egen `D0`-klassning + `ALLGREEN`
  redan delvis gör (docs-PR:er är gröna på ~1 min mot kods ~7, per
  `CONTRIBUTING.md`).

**Dom för del A:** mönstret som dominerar branschen — hos verktygs-
leverantörer (GitHub, Graphite), hos processägare (Google, Kubernetes-
projektet) och hos agent-leverantörer (OpenAI, Cognition) — är **asynkron
fortsättning, aldrig blockerande väntan i huvudflödet**. Precedent-rymden
för denna specifika del av frågan är BRED: minst sex oberoende källor,
merparten förstaparts, konvergerar på samma svar. Det Marcus observerade
2026-09-03 är alltså inte "så här gör proffsen det" — det är en avvikelse
FRÅN vad både verktygen och praxisen är byggda för att möjliggöra.

## B — Hur hanteras beroenden mellan enheter när man INTE väntar?

Fyra mönster, i den ordning källorna själva rangordnar dem:

1. **Håll enheterna oberoende (Googles förstahandsval, inte ett
   verktygsknep).** `small-cls.html` ramar in hela problemet som att en
   BEROENDE-kedja av CL:er i första hand ska undvikas genom att skära
   arbetet i genuint fristående bitar — stacking är räddningen när det INTE
   går, inte standardläget. Överfört till vårt repo: `to-issues`-skillens
   vertikala skivor med explicita beroenden i backlog-kortet är redan denna
   disciplin — frågan är om orkestreraren FAKTISKT väljer nästa PLOCKBARA
   (beroendefri) skiva i stället för att sitta overksam på en som råkar
   vänta.
2. **Stackade grenar/PR:er när beroendet är genuint** (Graphite, Meta/
   Sapling/Phabricator, § A4). Nästa enhet grenar av FÖREGÅENDE (ännu
   olandade) enhets branch, inte av `main`; verktyget omrebasar automatiskt
   nedåt i kedjan när en länk ändras. Kostnaden är verktygsstöd — vår
   nuvarande CI-klassning, `review-grinden`s `granskadSha`-friskhetskontroll
   och backlog-CLI:t förutsätter alla att en PR:s bas är `main`, inte en
   annan öppen PR.
3. **Optimistisk fortsättning** (nämnt indirekt i flera källor, inget
   enskilt namngivet "mönster" men underliggande i hela stacked-diffs-
   familjen): börja nästa enhet FRÅN antagandet att föregående landar utan
   ändring, acceptera kostnaden av en enstaka rebase om det INTE håller.
   Detta är billigt när landningen är snabb och tillförlitlig (vår egen
   kö: median 16 s) och dyrt när den inte är det.
4. **Feature flags / trunk-based-frikoppling** (Google SWE Book, redan
   citerad i `sessions-parallellitet-frontier-praxis-2026-08-02.md` § 4:
   *"keep the build green ... disable incomplete/untested features at
   runtime"*). Landar ofärdigt arbete bakom en flagga så att NÄSTA persons
   arbete inte behöver vänta på att FÖREGÅENDE är release-klart, bara på att
   den är MERGE-klar. Frikopplar merge-ordning från release-ordning helt.

**Vad detta betyder konkret för vår situation, utan att föreslå ett beslut:**
mönster 1 kräver ingen ny mekanik alls — det kräver att orkestreraren, när
en PR köas, omedelbart frågar "finns en ANNAN plockbar, beroendefri skiva?"
i stället för att gå in i väntan. Mönster 2 (äkta stacking) är en
strukturell ändring som skulle beröra `review-grinden` (`ADR-105`) och
CI-klassningen och kräver egen grillning + ADR om den övervägs.

## C — Vad kön faktiskt kostar, och hur teams sänker den kostnaden

**Vår egen mätta kostnad** (`docs/research/kohopp-bradskande-revert-2026-07-30.md`,
redan i repot, 30 landningar): **median 16 s, p90 27 s, värsta uppmätta fall
5 min 8 s.** Detta är billigt i absoluta tal — problemet 2026-09-03 var
alltså sannolikt inte kö-latensen i sig, utan att FLERA sessioners PR:er låg
i luften SAMTIDIGT och var och en valde att stå overksam snarare än att
starta nästa enhet under de sekunderna/minuterna.

**Branschens generella mönster för att sänka kö-kostnad vid hög volym**
(Aviator-dokumentationen, [`docs.aviator.co/mergequeue/concepts/batching`](https://docs.aviator.co/mergequeue/concepts/batching)
och [`aviator.co/blog/parallel-batch-ci`](https://www.aviator.co/blog/parallel-batch-ci),
hämtade via sökning 2026-09-04, leverantörskälla):

- **Batching** — gruppera flera köade PR:er och kör CI EN gång mot hela
  gruppen i stället för en gång per PR.
- **Swimlanes** — PR:er som rör icke-överlappande filer tillåts merga i
  parallella "banor" i stället för strikt seriellt.
- **Optimistisk kö** — varje ny post bygger en spekulativ batch som
  innehåller alla redan köade poster plus den nya; misslyckas batchen delas
  den upp för att isolera boven.
- **`grouping_strategy: HEADGREEN` vs `ALLGREEN`** — verifierat mot
  GitHubs egen ruleset-dokumentation (sökning + Terraform-providerns
  schemabeskrivning, hämtad 2026-09-04): **`ALLGREEN`** kräver att VARJE
  PR i gruppen (inte bara gruppens slutresultat) klarar sina kontroller;
  **`HEADGREEN`** kräver bara att gruppens SISTA sammanslagna commit klarar
  sig. `HEADGREEN` är snabbare men släpper igenom enskilda PR:er utan att
  var och en bevisligen var grön för sig — vårt repo kör `ALLGREEN` med
  avsikt, och `CONTRIBUTING.md` dokumenterar redan att `review-backstoppen`
  (`TASK-173.4`) är BEROENDE av det valet (kö-grenen namnger EN PR per
  körning bara under `ALLGREEN`).
- **`max_entries_to_merge`/`max_entries_to_build`** — vårt eget
  `max_entries_to_build: 3` är, per `CONTRIBUTING.md`, satt "efter uppmätt
  parallellitet, inte efter optimism" — samma reglage Aviator och GitHub
  själva exponerar för att avväga genomströmning mot CI-kostnad.

**Uber SubmitQueue** (redan citerad förstapartskälla i
`sessions-parallellitet-frontier-praxis-2026-08-02.md`): gick från 52 % till
99 % grön trunk genom att bygga exakt denna typ av spekulativ, batch-
medveten kö — samma princip som GitHubs merge queue, i produktion i större
skala.

**Dom för del C:** vår egen kö är, mätt, INTE flaskhalsen (16 s median).
Branschens verktyg för att sänka kö-kostnad vid VERKLIG trängsel (batching,
swimlanes, `HEADGREEN`) är kända, dokumenterade och delvis redan i bruk hos
oss (`ALLGREEN`+`max_entries_to_build`) — men de löser ett problem
(genomströmning vid hög volym) som inte är det problem Marcus observerade.
Det observerade problemet är beteendemönstret "orkestreraren gör ingenting
medan en billig kö-väntan pågår", inte kö-mekanikens kostnad.

## D — Kandidat-mönster för OSS (kandidater, inget beslut)

Marcus äger arkitektur och scope. Detta är fem alternativ, rangordnade efter
hur mycket de river/amenderar av `ADR-096`/`ADR-097`/`ADR-105`/`ADR-090`.

### D1 — Praxis-ändring: starta nästa OBEROENDE enhet i stället för att parkera (river ingenting)

Efter push + armering av en PR: fråga omedelbart "finns en annan plockbar,
beroendefri backlog-skiva?" och spawna en bygg-agent för DEN, i stället för
att gå in i väntan på den nyss armerade PR:ens landning. Heartbeat-svepet
(redan byggt) sköter avstämningen av den väntande PR:en i bakgrunden av
NÄSTA enhets arbete, inte som ensam sysselsättning.

- **För:** kräver ingen ny mekanism, inget nytt ADR — det ÄR redan vad
  `ADR-096` licensierar ("orkestreraren äger väntan", inte "orkestreraren
  gör inget annat under väntan") och vad `ADR-097` § Push-ekonomin
  förutsätter (flera färdiga enheter kan ligga i luften samtidigt). Är
  direkt understödd av Google/Kubernetes/GitHub-fynden i § A.
- **Emot:** löser ingenting när backlog:en faktiskt ÄR seriellt beroende
  (nästa plockbara skiva bygger på kod som bara finns i den olandade PR:en)
  — då återstår antingen D2 eller att faktiskt vänta, medvetet, precis som
  i dag.
- **Rör:** ingen ADR. Möjligen en rad i `CLAUDE.md` § Landning som
  namnger mönstret, analogt med hur `ADR-096` namngav Temporal-mönstret.

### D2 — Äkta stacking för genuint beroende skivor (river/utvidgar review-grinden)

För skivor inom SAMMA PRD-kort där skiva N.2 kräver kod som bara finns i
N.1:s olandade PR: gren N.2 av N.1:s branch (inte av `main`), landa i
ordning, låt varje efterföljande gren rebasas när föregående landar
(manuellt eller Graphite-liknande tooling).

- **För:** löser det enda fall D1 inte kan — genuint kod-beroende arbete.
  Starkt branschprecedent (§ A4).
- **Emot:** **river eller kräver amendering av flera mekanismer** som
  förutsätter "PR:ens bas är `main`": `review-grinden`s
  `granskadSha`-staleness-kontroll (`ADR-105`), CI:s `D0`-diff-klassning
  (jämför mot vilken bas?), och `ADR-076`s merge-kö-antagande om en PR per
  kö-grupp under `ALLGREEN`. Skulle kräva egen grillning + ADR innan den
  ens är en kandidat att bygga — INTE något att införa i förbigående.
- **Rör:** potentiellt `ADR-105` (review-grindens antaganden) och
  `ADR-076`/`CONTRIBUTING.md` § Landnings-ordningen.

### D3 — Feature-flag-frikoppling av merge från release (river ingenting akut, stor egen investering)

Landa ofärdigt arbete bakom flaggor så att beroende arbete kan merga
oavsett om FÖREGÅENDE steg är release-klart, bara om det är merge-klart.

- **För:** starkast branschgrundat (Google SWE Book, DORA), frikopplar
  helt.
- **Emot:** stor egen investering (flagg-infrastruktur finns inte i detta
  repo i dag, veterligen), och repots egen `ADR-063`
  (Airtable-som-datakälla) + `airtable-constraints.md` sätter redan kända
  strukturella väggar för hur mycket "ofärdigt bakom en flagga" som är
  görbart mot en delad, icke-branch-bar datakälla. **Overifierat i detta
  pass** om flaggmönstret ens är kompatibelt med den begränsningen — se
  § Vad jag inte kunde belägga.
- **Rör:** ingen befintlig ADR direkt, men skulle sannolikt behöva en egen.

### D4 — Utnyttja Claude Codes egna bakgrunds-/meddelande-primitiver (kompletterar D1, river ingenting)

**Nytt fynd i detta pass, inte i det tidigare (2026-08-02) forskningsläget:**
`code.claude.com/docs/en/cross-session-messaging` (förstapartskälla, hämtad
2026-09-04) beskriver en primitiv som inte existerade — eller åtminstone
inte var dokumenterad — när `ADR-096` skrevs: en session kan be en ANNAN
session om **"one notice when it next goes idle or exits"** (`notify_when_idle`)
UTAN att polla — *"Claude Code subscribes without starting a turn or
spending tokens in the watched session."* Samma dokument beskriver **Agent
view** (`claude agents`) som Anthropics egen rekommenderade skalningsform:
*"dispatch sessions that keep running in the background and watch them from
one screen"* — dvs. Anthropics EGET recept är "starta fler bakgrunds-
sessioner och kika in", inte "en session i taget, blockerande".

- **För:** billigare än polling (0 token medan man väntar på en ANNAN
  SESSION), och är precis Anthropics egen väg för att skala bortom en
  session i taget.
- **Emot:** löser en ANNAN väckning än vår — `notify_when_idle` väcker på
  att en SESSION blir idle, inte på att en GitHub-PR landar. Skulle behöva
  kombineras med D1 (orkestreraren dispatchar nästa enhets bygg-agent som en
  bakgrunds-session och ber om notis när DEN är klar) snarare än att
  ersätta heartbeat-svepet, som fortfarande är den enda mekanismen som
  känner GitHubs faktiska tillstånd. **Overifierat** om detta fungerar
  tvärs över worktree-isolerade subagenter i vår harness-version — se
  § Vad jag inte kunde belägga.
- **Rör:** ingen befintlig ADR — ett rent tillägg, om det alls byggs.

### D5 — Status quo, medvetet vald väntan (nollalternativet)

Fortsätt som i dag, men gör valet EXPLICIT snarare än förvalt: när
orkestreraren VÄLJER att vänta (t.ex. för att ingen annan plockbar enhet
finns), är det ett medvetet beslut per svep, inte overksamhet som
uppkommer i brist på ett bättre alternativ.

- **För:** rör ingenting, kostar noll att införa.
- **Emot:** löser inte det Marcus observerade — det ÄR det observerade
  beteendet, bara med en etikett på det.

**Sammanfattning D:** D1 är den enda kandidaten med bred, direkt
branschprecedent OCH noll rivning av befintliga ADR:er — den är i praktiken
redan tillåten av `ADR-096`/`ADR-097`, så gapet 2026-09-03 var ett
PRAXIS-gap, inte ett ARKITEKTUR-gap. D2 och D3 är strukturellt tyngre och
kräver egen grillning om de övervägs. D4 är ett komplement, inte en
ersättning.

## Dom

**Nej, branschledarna konfigurerar INTE sina parallella agent-/
sessionsuppsättningar så att en huvudsession blockerande väntar på att dess
PR ska landa innan den fortsätter med nästa arbetsenhet.** Detta är belagt
brett: Googles egen `eng-practices` säger uttryckligen att sådan väntan
slösar tid och namnger stacking som motmedlet; Kubernetes' Tide instruerar
PR-författare att deras jobb är klart så fort PR:en är köad; GitHubs
merge queue är uttryckligen designad för att eliminera just den väntan;
Graphite/Meta/Sapling bygger hela sin produktkategori på att hålla
utvecklare igång under granskning; och de renodlade agent-leverantörerna
(OpenAI Codex, Devin) är asynkrona per konstruktion — flera uppgifter i
egna sandlådor samtidigt, granskning sker senare.

**Den avgörande delfrågan var A** — inte C (kö-kostnaden, som redan var känd
och låg hos oss) och inte B (beroendehantering, som är väl beskrivet men
sekundärt om A:s svar redan är "vänta inte i onödan"). Svaret på A slår fast
att det Marcus observerade 2026-09-03 avviker från branschmönstret, och att
avvikelsen — givet att `ADR-096`/`ADR-097` redan licensierar flera enheter
i luften samtidigt — sannolikt är en PRAXIS-fråga (D1), inte en
arkitektur-brist som kräver att befintliga ADR:er rivs.

**Sekundärt, viktigt fynd:** flaskhalsen har flyttat. DORA 2025-data och
Devin-fallstudien pekar samstämmigt på att GRANSKNINGEN, inte
kö-LANDNINGEN, är där tiden idag faktiskt försvinner i AI-tunga
utvecklingsflöden — vilket är precis det lager repots egen `review-grinden`
(`ADR-105`) redan bygger mot, och en indikation på att den investeringen
var rätt riktad.

## Vad jag inte kunde belägga

- **Ingen källa beskriver exakt vår situationsform**: fyra parallella,
  interaktiva huvudsessioner (inte batch-jobb, inte en enda CI-pipeline),
  var och en driven av en AI-agent-orkestrerare som själv spawnar bygg-agenter i
  worktrees och själv armerar mot en merge queue. De generella mönstren
  (§ A–C) överförs med hög säkerhet, men ingen 1:1-precedent för just DENNA
  operativa form hittades. Frånvaro av fynd, inte frånvaro av mönster.
- **Devin Central-artikelns 219-PR-fallstudie** (§ A6) är en enskild
  branschbloggs anekdot om EN organisations dag, inte en mätt studie —
  ingen kvantitativ kö- eller granskningsdata följer med. Citerad som
  kvalitativt stöd, inte som statistik.
- **DORA 2025/Faros-siffrorna** (§ A6, C) är hämtade via sekundärkällor som
  citerar samma underliggande studie/telemetri; den primära DORA-2025-
  rapporten själv hämtades inte direkt i detta pass. Riktningen är
  sannolikt robust (flera oberoende sekundärkällor konvergerar), men
  exakttalen bör inte citeras som primärkälle-verifierade.
- **Om `notify_when_idle`/cross-session messaging (§ D4) fungerar för
  worktree-isolerade SUBAGENTER**, eller bara för fristående interaktiva
  huvudsessioner på samma maskin. Dokumentationen beskriver uttryckligen
  huvudsessioner och bakgrunds-("Agent view")-sessioner; subagent-fallet
  nämns bara i förbigående ("Subagents: agents running inside the current
  session" i listan över nåbara mottagare). Overifierat mot vår faktiska
  harness-version.
- **Mergifys interna arkitektur** förblev obelagd även i detta pass (samma
  lucka som `orkestrerar-vackning-polling-vs-event-driven-2026-08-02.md`
  redan bokförde 2026-08-02 — omprövad, inte omlöst).
- **Om feature-flag-frikoppling (§ D3) är görbar mot vår Airtable-
  datakälla-begränsning** (`ADR-063`, `airtable-constraints.md`) prövades
  inte i detta pass — ren research om det generella mönstret, ingen
  applicerbarhets-analys mot våra specifika 30 katalogiserade väggar.
  Explicit flaggat, inte antaget löst eller olöst.
- **Ingen mätning gjordes** av hur ofta vår egen backlog FAKTISKT har en
  oberoende, plockbar skiva tillgänglig när en session parkerar — D1:s hela
  premiss ("det fanns något annat att göra") är overifierad mot vår
  faktiska kort-historik. Skulle vara ett naturligt nästa steg innan D1
  omsätts i en praxis-regel.

## Rekommendation

Detta är en rekommendation, inte ett beslut — Marcus äger arkitektur och
scope.

1. **Praxis, inte arkitektur, är den mest sannolika förklaringen till
   2026-09-03.** D1 (§ D1) kräver ingen ADR-ändring och är redan licensierad
   av `ADR-096`/`ADR-097` — den enda ändringen är att orkestreraren, vid
   varje väntepunkt, aktivt frågar "finns en annan oberoende, plockbar
   skiva?" i stället för att parkera. Billigast att pröva, starkast
   branschstöd.
2. **Mät innan D1 kodifieras som regel**: hur ofta finns faktiskt en
   oberoende skiva tillgänglig när en session skulle ha parkerat? Om svaret
   är "sällan" (seriellt beroende backlog är normen snarare än undantaget)
   pekar det i stället mot D2 (äkta stacking) som den mer relevanta
   investeringen — men D2 kräver egen grillning givet vad den river i
   `review-grinden` och `ADR-105`.
3. **D4 (cross-session `notify_when_idle`) är värt ett litet, avgränsat
   test** — inte för att ersätta heartbeat-svepet (som känner GitHubs
   faktiska tillstånd, vilket `notify_when_idle` inte gör), utan som ett
   billigare sätt att låta en orkestrerare veta att en bakgrunds-dispatchad
   bygg-agent för NÄSTA enhet är klar, utan att polla den.
4. **Flaskhals-fokus:** om granskningslagret (`ADR-105`) är där tiden
   faktiskt läcker (§ A6, C), är fortsatt investering där sannolikt mer
   lönsam än ytterligare kö-optimering (§ C) — vår kö är redan billig.

## Källförteckning

**Förstapartskällor (primära, hämtade/verifierade 2026-09-04 om inget annat anges):**

- [Small CLs — eng-practices (Google)](https://google.github.io/eng-practices/review/developer/small-cls.html) — "väntan slösar tid" + stacking
- [Speed of Code Reviews — eng-practices (Google)](https://google.github.io/eng-practices/review/reviewer/speed.html) — granskarens svarstid, kontext-bytes kostnad
- [Tide — PR-author's guide (Kubernetes/Prow)](https://docs.prow.k8s.io/docs/components/core/tide/pr-authors/) — "typically your work is done!"
- [Tide — komponentöversikt (Kubernetes/Prow)](https://docs.prow.k8s.io/docs/components/core/tide/)
- [Managing a merge queue (GitHub Docs)](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue) — "does not require ... wait for status checks"
- [Merging a pull request with a merge queue (GitHub Docs)](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/merging-a-pull-request-with-a-merge-queue)
- [Best practices for Claude Code (code.claude.com)](https://code.claude.com/docs/en/best-practices) — "Run multiple Claude sessions", Agent view, fan-out
- [Cross-session messaging (code.claude.com)](https://code.claude.com/docs/en/cross-session-messaging) — `notify_when_idle`, Agent view-bakgrundssessioner
- [Batching — Aviator Documentation](https://docs.aviator.co/mergequeue/concepts/batching)
- [How High-Throughput Teams Merge Faster Using Parallel CI and Batch CI Runs — Aviator Blog](https://www.aviator.co/blog/parallel-batch-ci/)
- [Stacked PRs — Graphite Blog](https://graphite.com/blog/stacked-prs)
- Uber SubmitQueue: [`github.com/uber/submitqueue`](https://github.com/uber/submitqueue) + [Uber Engineering-bloggen (arkiverad)](https://web.archive.org/web/20230605070547/https://www.uber.com/blog/ios-monorepo/) — redan citerad förstapartskälla i repots research 2026-08-02
- [OpenAI Codex](https://openai.com/codex/) — asynkron, containerisolerad parallellitet

**Interna källor (detta repo, verifierade mot disk 2026-09-04):**

- [`CONTRIBUTING.md`](../../CONTRIBUTING.md) § Landnings-ordningen — kö-parametrar, egen mätt kö-latens
- [`ADR-096`](../decisions/ADR-096-subagentens-vantekontrakt.md) — subagentens väntekontrakt
- [`ADR-097`](../decisions/ADR-097-arbetsformens-tillstandsbarare.md) — push-ekonomins princip
- [`ADR-076`](../decisions/ADR-076-merge-grinden-ruleset-pr-flode.md) — merge queue-mekaniseringen
- [`ADR-105`](../decisions/ADR-105-review-grinden-fyra-deltan-byggs-inte-adopteras.md) — review-grinden (refererad, ej läst i sin helhet i detta pass — se ovan för vad som är känt om den via `CLAUDE.md`)
- [`ADR-063`](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md) — Airtable-som-datakälla, refererad för D3:s applicerbarhets-fråga
- `docs/research/kohopp-bradskande-revert-2026-07-30.md` — kö-latens, 30 landningar
- `docs/research/orkestrerar-vackning-polling-vs-event-driven-2026-08-02.md`
- `docs/research/sessions-parallellitet-frontier-praxis-2026-08-02.md`

**Sekundärkällor (branschbloggar/community, flaggade i text):**

- [The Merge Queue Is the New Bottleneck — TianPan.co](https://tianpan.co/blog/2026-07-02-the-merge-queue-is-the-new-bottleneck) (branschblogg)
- [When agents open 200 PRs, Devin Review is the real rate limit — Devin Central](https://devincentral.com/news/editorial-devin-review-bottleneck/) (branschblogg, fallstudie/anekdot)
- DORA 2025 / Faros AI-telemetrin — citerad via flera sekundära branschsammanställningar (Faros AI-blogg, Scrum.org-sammanfattning m.fl.), primärrapporten ej direkt hämtad i detta pass
- Stacked-diffs-historik hos Meta/Phabricator/Sapling — citerad via Pragmatic Engineer-nyhetsbrevet och `jg.gg`-bloggen, ej Metas egen förstapartsdokumentation

## Vad detta pass INTE besvarade (öppet deklarerat)

Se § Vad jag inte kunde belägga ovan för den fullständiga listan. Kort
sammanfattning: ingen 1:1-precedent för vår exakta operativa form (fyra
parallella AI-orkestrerar-sessioner mot en delad merge queue); DORA/Devin-
sifforna är sekundärkälle-citerade, inte primärt verifierade; `notify_when_idle`s
räckvidd mot subagenter är oprövad; feature-flag-frikopplingens
förenlighet med `ADR-063`s Airtable-väggar är oundersökt. Precedent-rymden
för del A (väntar man eller inte) är BRED och stark; precedent-rymden för
"exakt vår situationsform" är TUNN — deklarerat öppet, inte fejkat.
