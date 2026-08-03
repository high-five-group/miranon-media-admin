---
owner: marcus803
updated: 2026-08-02
review_by: 2027-02-02
status: stable
---

# Är git-worktree-per-parallell-session etablerad praxis, och finns precedent för auto-detektion? (Code, 2026-08-02)

> **Proveniens:** avgränsat research-pass för tråd
> [`T67`](../../tasks/threads/T67-parallella-aktiva-sessioner.md), beställt
> 2026-08-02. T67 bokförde 2026-07-07 att design-steget (räknar-allokering,
> ev. worktree-isolation, end-pass-protokoll) kräver web-research med 3+
> precedent innan mekanisering. Detta pass löser just det kravet, för det
> specifika beslutet: **detektionssteg i sessionsstart (annat aktivt
> sessionsdok · `git worktree list` · smutsigt huvudträd) → senare startande
> session tar automatiskt egen worktree; först startad behåller sin plats.**
> Passet beslutar ingenting — kartläggning och dom är research-stoff;
> mekaniseringen är ett separat, senare steg som T67 redan pekar mot
> (grillning → design → ADR).

## Kort svar

**Delad — dela upp beslutet i sina två halvor, för de får olika dom.**

**Mekanismen (worktree per parallell session) är stenhårt etablerad**, med
Anthropics egen dokumentation som starkaste källa: Claude Code rekommenderar
uttryckligen worktrees för parallella sessioner, desktop-appen ger **varje**
ny session sin egen worktree automatiskt, och detta repo redan kör exakt
samma mekanism för subagenter (`isolation: worktree`, `.claude/agents/
bygg-agent.md` + `research-pass.md`). Extern precedent (JetBrains 2026.1,
GitHub Copilot-appen, Cursor cloud agents, OpenAI Codex) bekräftar mönstret
brett hos frontier-verktyg 2026.

**Triggerformen (detektera en redan aktiv session → senare startaren
isolerar sig SJÄLV, automatiskt, utan att fråga) har DÄREMOT tunt-till-inget
direkt precedent.** Anthropics egen "automatik" (desktop-appen) är
**ovillkorad** — varje session får en worktree, oavsett om något annat körs
parallellt eller inte — inte en reaktion på en detekterad kollision. Den
närmaste strukturella analogin som hittades (Vites dev-server, som
automatiskt växlar till nästa lediga port när den första är upptagen) vilar
på en **atomär OS-primitiv** (`bind()` misslyckas eller lyckas, inget
mellanläge) som T67:s föreslagna detektionssignaler (sessionsdok-`lifecycle`,
`git worktree list`, smutsig arbetskatalog) INTE har — de är
applikations-nivå-heuristik, läsbara och skrivbara ur synk med varandra, och
kan därför race:a på ett sätt portbindning strukturellt inte kan.

## Delfråga 1 — Anthropics egen linje

**Auktoritativ förstapartskälla:** [code.claude.com/docs/en/worktrees](https://code.claude.com/docs/en/worktrees)
(hämtad 2026-08-02; sidans inline versionsmarkörer sträcker sig till
v2.1.212, så innehållet nedan gäller Claude Code ≥ v2.1.212).

Citat, ordagrant:

> "Running each Claude Code session in its own worktree means edits in one
> session never touch files in another, so one session can build a feature
> while a second fixes a bug."

Och, i samma dokuments notisruta:

> "In the desktop app, every new session gets its own worktree automatically."

Detta är den bärande skillnaden för hela frågan: **"automatiskt" här betyder
ovillkorat per-session, inte "detekterar en rival och isolerar sig därför".**
Ingenstans i sidan beskrivs ett flöde där Claude Code läser av att en annan
session redan är aktiv i katalogen och SVARAR på den upptäckten genom att
själv flytta in i en worktree. De tre faktiska mekanismerna som dokumenteras
är:

1. **CLI, manuellt:** `claude --worktree <namn>` — användaren begär
   isolering explicit, ingen detektion inblandad.
2. **Subagent, deklarativt:** `isolation: worktree` i agent-frontmatter —
   samma mekanism som redan är i drift i detta repo (verifierat i denna
   worktree: `.claude/agents/bygg-agent.md` och `.claude/agents/
   research-pass.md` bär båda `isolation: worktree` i sin frontmatter).
3. **Desktop-app / Agent view, blankt:** "every new session gets its own
   worktree automatically" — en ovillkorad policy, inte ett svar på en
   detekterad kollision. Bekräftat i sidan
   [code.claude.com/docs/en/agents](https://code.claude.com/docs/en/agents):
   *"Agent view moves each dispatched session into its own worktree
   automatically, and subagents you spawn can each get one too."*

Best-practices-sidan (`anthropic.com/engineering/claude-code-best-practices`
redirectar permanent, 308, till
[code.claude.com/docs/en/best-practices](https://code.claude.com/docs/en/best-practices),
hämtad 2026-08-02) har ett eget avsnitt **"Run multiple Claude sessions"**
under rubriken "Automate and scale", som uttryckligen listar worktrees som
förstahandsval:

> "Pick the parallel approach that fits how much coordination you want to do
> yourself: Worktrees: run separate CLI sessions in isolated git checkouts so
> edits don't collide."

Sidan säger också explicit att detta är ett dokumenterat internt Anthropic-
mönster, inte bara en spekulativ rekommendation: *"This guide covers patterns
that have proven effective across Anthropic's internal teams and for
engineers using Claude Code across various codebases."*

**Anthropics multi-agent-forskningssystem** (blogginlägget "How we built our
multi-agent research system", juni 2025 — inte primärkälla för Claude Code
specifikt, men Anthropics egen arkitekturbeskrivning av parallella
subagenter med isolerade kontextfönster) bekräftar mönstret orkestrerare +
isolerade parallella arbetare på ett annat lager (kontext, inte
filsystem) — men konstaterar samtidigt att arkitekturen är **mindre lämpad
för hårt sammanflätade uppgifter som kodning**, vilket är precis den
begränsning som gör att Claude Code för KOD löser isoleringen på
filsystemsnivå (worktrees) i stället för att försöka få flera agenter att
dela en kontext.

## Delfråga 2 — Extern precedent (3+ namngivna)

Fyra oberoende, namngivna verktygsleverantörer bekräftar samma mönster under
2026, utöver Anthropic själva:

1. **JetBrains** (IntelliJ IDEA, PhpStorm, GoLand, CLion, RubyMine, WebStorm,
   PyCharm) — native git worktree-stöd i **2026.1**-releasen (mars 2026),
   officiellt bloggat: *"IntelliJ IDEA now provides first-class support for
   Git worktrees. With the evolution of AI agents, running multiple tasks in
   parallel has become a major time-saver, and this is precisely where Git
   worktrees are extremely handy."* Källa:
   [blog.jetbrains.com/idea/2026/03/intellij-idea-2026-1](https://blog.jetbrains.com/idea/2026/03/intellij-idea-2026-1/).
2. **GitHub** (Copilot app, allmänt tillgänglig 17 juni 2026) — *"Every
   session runs in its own git worktree, a real, isolated copy of your
   branch. […] The app handles every worktree for you: no manual setup, no
   cleanup, no branch juggling."* Källa:
   [`github.blog/news-insights/product-news/github-copilot-app-the-agent-native-desktop-experience`](https://github.blog/news-insights/product-news/github-copilot-app-the-agent-native-desktop-experience/).
   Samma mönster som Anthropics desktop-app: ovillkorad, inte
   detektionsutlöst.
3. **Cursor** — cloud-agenter kör var och en i en egen isolerad VM med sin
   egen klonade repo-kopia (containernivå snarare än worktree-nivå, men
   samma isoleringsprincip: en arbetsyta per samtidig agent).
4. **OpenAI Codex CLI** — konvergerar enligt tredjepartskällor mot samma
   OS-nivå-sandboxmönster som Claude Code och Cursor (Seatbelt/Landlock/
   seccomp, plus devcontainer-stöd), och stöds explicit i minst ett publikt
   devcontainer-projekt som buntar fyra agenter (Claude Code, Copilot CLI,
   OpenCode, Codex) i samma isolerings-lager.

Detta är **fler än tre oberoende leverantörer**, alla 2026, alla pekande på
samma form: en isolerad arbetsyta per samtidig agent-session, antingen som
git-worktree (JetBrains, GitHub, Anthropic) eller som en tyngre
container/VM-isolering (Cursor, delvis Codex). Precedent-rymden för
"isolera parallella agentsessioner" är alltså **bred, inte tunn**.

**Notera skillnaden mot delfråga 3:** samtliga fyra är formen "blankt
ovillkorat" eller "manuellt/deklarativt begärt" — ingen av dem beskrivs som
att detektera en redan körande session och reaktivt isolera sig.

## Delfråga 3 — Detektions-/auto-isolerings-precedent

**Rymden är tunn för den EXAKTA formen T67 föreslår** (en process som vid
start läser signaler om att en annan process redan är aktiv på samma resurs,
och autonomt — utan att fråga — flyttar sig själv till en isolerad kopia).
Ingen av de granskade källorna (Anthropic-dokumentationen ovan, eller
sökningarna nedan) beskriver exakt detta flöde för kod-/utvecklarverktyg.
Det som FINNS är tre närliggande men distinkt olika familjer:

**A. Detektera + varna/blockera, aldrig auto-isolera (vanligast).**

- **Vim swap-filer** (decennier gammal, väl etablerad praxis): Vim skapar en
  `.swp`-fil vid öppning; upptäcker en annan process redan hålla filen öppen
  ger varningen "E325: ATTENTION — Found a swap file… another program may be
  editing the same file", med process-ID, värdnamn och tidsstämpel, och ber
  användaren välja (öppna read-only, redigera ändå, återställ, avbryt).
  Detektion + explicit mänskligt val — aldrig en tyst automatisk kopia.
- **tmux**: en nästlad `tmux`-körning detekterar (via miljövariabeln `$TMUX`)
  att den redan körs inuti en tmux-session och **blockerar** med "sessions
  should be nested with care, unset $TMUX to force" — kräver explicit
  override, isolerar sig aldrig automatiskt i en ny kontext.
- **Terraform + DynamoDB state-lock**: ett `conditional PutItem` fungerar
  som distribuerat lås; ett samtidigt `apply` upptäcker låset och **väntar**
  tills det släpps (pessimistisk låsning), i stället för att arbeta vidare
  mot en egen kopia.

**B. Detektera + fråga, med konvergens som defaultval (motsatt riktning mot
T67:s förslag).**

- **GitHub Codespaces**: upptäcker en existerande codespace för samma
  branch och visar en "Resume codespace"-sida där användaren väljer
  "Resume this codespace" eller "Create a new one" — detektion finns, men
  standardvägen är att GÅ SAMMAN i den befintliga sessionen, inte att
  isolera sig ifrån den, och valet är alltid mänskligt, aldrig tyst
  automatiskt.

**C. Den enda hittade formen som är strukturellt lik T67:s förslag —
detektera + tyst auto-relokera, utan att fråga — kommer från ett annat
resursslag med en helt annan detektionsgaranti.**

- **Vite dev-server**: om standardporten (t.ex. 5173) redan är upptagen
  provar Vite automatiskt nästa lediga port (5174, 5175, …) **utan att
  fråga**, om inte `strictPort: true` är satt. Källa:
  [`vite.dev/config/server-options`](https://vite.dev/config/server-options).
  Detta är den närmaste analogin till "senare startaren isolerar sig
  själv automatiskt" som hittades — men den bygger på en **atomär
  OS-primitiv**: ett `bind()`-anrop på en port lyckas eller misslyckas
  odelbart, det finns inget race-fönster mellan "kolla om porten är ledig"
  och "ta porten". T67:s föreslagna signaler (läsa ett annat sessionsdoks
  `lifecycle`-fält, köra `git worktree list`, kolla om huvudträdet är
  smutsigt) har INTE den garantin — de är tre separata, icke-atomära
  läsningar som kan bli inaktuella mellan läsning och beslut, och en session
  kan hinna starta i fönstret mellan att en annan sessions "jag är aktiv"-
  markering skrivs och att den blir läsbar.

**Dom för delfråga 3:** precedent-rymden för "detektera parallellitet →
autonomt själv-isolera utan att fråga" är **tunn** för verktyg som delar
Claude Code-repots problemklass (heuristisk, icke-atomär detektion). Den
enda substantiella analogen (Vite) löser ett problem med en starkare
detektionsgaranti än den vi skulle bygga på. De mönster som FAKTISKT är
etablerade och väl beprövade i vår problemklass — vim, tmux, Codespaces —
landar alla i "detektera + fråga/blockera", aldrig "detektera + agera
tyst". Detta talar för att om T67:s mekanik byggs, bör den följa den
etablerade formen (varna/fråga) snarare än Vite-formen (tyst auto-flytt),
just eftersom vår detektionsgrund saknar Vites atomicitet.

## Delfråga 4 — Trunk-based development

**Auktoritativ förstapartskälla:** *Software Engineering at Google*, kapitel
16 ("Version Control and Branch Management"), publicerat av Google på
[abseil.io/resources/swe-book/html/ch16.html](https://abseil.io/resources/swe-book/html/ch16.html)
(Googles egna öppna källkods-/ingenjörsresurs-sajt).

Citat, ordagrant:

> "We believe that a version control policy that makes extensive use of dev
> branches as a means toward product stability is inherently misguided."

Vidare, om kostnaden som skalar med antalet parallella grenar:

> "When there are multiple branches being developed in isolation for long
> periods, coordinating merge operations becomes significantly more
> expensive (and possibly riskier) than they would be with trunk-based
> development."

Och receptet kapitlet landar i:

> "The alternative requires a different paradigm: trunk-based development,
> rely heavily on testing and CI, keep the build green, and disable
> incomplete/untested features at runtime."

Kapitlet citerar också DORA: *"DORA points out that there is a predictive
relationship between trunk-based development and high-performing software
organizations."*

Google driver detta i en monorepo med (enligt boken och tredjepartskällor)
tiotusentals ingenjörer och tiotusentals commits/dag — men **den bärande
principen (kort livslängd, snabb integrering till en gemensam trunk, CI som
grind) är oberoende av monorepo-skalan** och gäller lika mycket för ett
litet repo med en handfull parallella aktörer.

**Tre+ ytterligare namngivna precedent, alla på samma form men med
mekanisk kö som det extra lagret vår situation faktiskt matchar
("gemensam main, isolerade arbetsytor, mekanisk kö"):**

- **Uber** byggde **SubmitQueue**, en spekulativ merge-kö, sedan mätningar
  visade att iOS-monorepots trunk bara var grön 52 % av tiden under en
  uppmätt vecka. Med SubmitQueue i drift steg success-raten till 99 %.
  Källa: [eng.uber.com](https://web.archive.org/web/20230605070547/https://www.uber.com/blog/ios-monorepo/) +
  [`github.com/uber/submitqueue`](https://github.com/uber/submitqueue)
  ("SubmitQueue speculatively rebases and validates multiple changes in
  parallel against predicted future states of HEAD. When validations pass,
  changes land automatically. When they fail, SubmitQueue isolates the
  offending change and retries the rest — all without human intervention.").
- **GitHub**, via sin egen `merge_queue`-ruleset-funktion — den
  mekanism detta repo redan använder sedan 2026-07-29
  ([`ADR-076`](../decisions/ADR-076-merge-grinden-ruleset-pr-flode.md)).
- **Airbnb, Twitter/X, Shopify, Robinhood** — enligt branschöversikter
  (Trunk.io, sekundärkälla) har alla byggt eller adopterat merge-kösystem
  som del av trunk-based-infrastruktur i takt med att antalet samtidiga
  bidragsgivare växer.

**Dom för delfråga 4:** trunk-based development stödjer formen "gemensam
main, isolerade arbetsytor, mekanisk kö" **entydigt och starkt** — det ÄR
receptet, ordagrant, hos den mest citerade förstapartskällan (Google) och
bekräftat av namngiven precedent (Uber) som byggde exakt den mekaniska kön
för att lösa exakt det skalningsproblem många samtidiga aktörer skapar.
Denna del av T67:s arkitektur (isolerade worktrees som landar via en
seriell, mekanisk kö) har alltså starkt stöd — helt oberoende av dom för
delfråga 3 (detektionstriggern).

## Delfråga 5 — Distribuerad ID-/räknar-allokering

Repots nuvarande mekanism (kortnummer-allokering,
[`CLAUDE.md` § Kortnummer](../../CLAUDE.md)) läser andra aktiva grenar
(`check_active_branches: true`, `TASK-93`) omedelbart före varje `task
create`, deriverar nästa lediga nummer, och förlitar sig på att kortet
committas i samma andetag — med manuell CLI-reparation som fallback vid
krock. T67:s guardrails för lessons-/tråd-/ADR-nummer följer samma form:
"pull-och-omderivera i varje skriv-ögonblick".

Tre etablerade, namngivna precedent för samma problemklass — delad
sekventiell numrering mellan parallella arbetare utan central
låstjänst — och var vår form landar i förhållande till dem:

1. **Ruby on Rails migrationsversionering.** Rails bytte (från 2.1, 2008)
   från sekventiella heltal (`001_`, `002_`, …) till
   **skapelsetidsstämpel** som versionsnyckel, uttryckligen för att lösa
   exakt detta race: *"with multiple developers it was easy for these to
   clash requiring you to rollback migrations and renumber them."* Den nya
   formen löser det genom att **deriveras lokalt vid skapandet** (klockan,
   inte en delad räknare) och låter grenar med olika migrationer smälta
   samman naturligt: *"disconnected branches can each add their own
   migration rules… When the two branches are merged, they fit together
   naturally. This doesn't work at all when you have ordered 'version
   numbers'."* Källa: [Rails Guides — Active Record
   Migrations](https://guides.rubyonrails.org/active_record_migrations.html).
2. **Django `makemigrations --merge`.** Django upptäcker konflikten (två
   commits hävdar samma "nästa" migrationssteg i samma app) **vid
   integrationstillfället**, inte vid skrivtillfället, och löser den genom
   ett explicit merge-migrationskommando som skapar en ny leaf-nod med
   båda de konfliktande migrationerna som beroenden. Mönstret är alltså:
   derivera optimistiskt, upptäck kollisionen sent, **reparera mekaniskt
   med ett verktygskommando** — inte lås, inte central allokering.
3. **Gits eget `--force-with-lease`** är enligt git-scm.com:s egen
   dokumentation ordagrant beskrivet som en **compare-and-swap/lease-
   mekanism**: *"It is like taking a 'lease' on the ref without explicitly
   locking it, and the remote ref is updated only if the 'lease' is still
   valid."* Detta är samma algoritmklass som databasers optimistiska
   låsning (läs version → beräkna lokalt → skriv bara om versionen
   fortfarande stämmer, annars gör om) — och git själv (icke-fast-forward-
   avvisning vid `push`) fungerar redan som en inbyggd CAS-spärr mot att av
   misstag skriva över någon annans redan pushade commit.

**Fjärde jämförelsepunkten, för kontrast — den centraliserade formen vi INTE
använder:** GitHub tilldelar issue-/PR-/discussion-nummer ur en **enda delad
server-sidig räknare per repo** (atomär allokering hos en central
auktoritet). Det är en helt annan lösning på samma problemklass — den
kräver en central skrivare, vilket vårt git-baserade, decentraliserade
kort-/lessons-/ADR-register inte har.

**Dom för delfråga 5:** vår faktiska form — derivera mot disk omedelbart
före skrivning, committa direkt, och reparera manuellt via CLI vid
sällsynt kollision — matchar **"optimistisk konkurrens + sen mekanisk
reparation"**-mönstret (Rails tidsstämpel-migrationer + Djangos
`--merge`-kommando + gits `--force-with-lease`-lease-semantik), inte
pessimistisk distribuerad låsning (Terraform+DynamoDB) och inte
centraliserad atomär allokering (GitHub issue-nummer). Det är en genuint
etablerad, namngiven mönsterfamilj (3 oberoende källor) — inget gap här.

## Dom

**Bygg vidare på isoleringsmekanismen (worktree per parallell session) —
den har det starkaste tänkbara stödet: Anthropics egen dokumentation,
repots egen redan aktiva subagent-praxis, och minst fyra namngivna
frontier-leverantörer 2026.** Detta gäller oavsett hur triggerfrågan
avgörs.

**Var mer försiktig med den specifika triggerformen "detektera automatiskt,
isolera dig själv utan att fråga".** Den har inget direkt precedent i
Claude Code-ekosystemet (Anthropics egen "automatik" är ovillkorad, inte
detektionsstyrd), och det enda strukturellt lika mönstret utanför
ekosystemet (Vite) vilar på en atomär detektionsgaranti T67:s föreslagna
signaler saknar. De etablerade mönstren i vår problemklass (vim, tmux,
Codespaces) stannar alla vid "detektera + fråga/blockera". Trunk-based
development (Google, Uber) stödjer resten av arkitekturen — gemensam main,
isolerade arbetsytor, mekanisk kö — entydigt. Räknar-/ID-delen av T67:s
design (derivera mot disk + committa direkt + manuell reparation vid
krock) är redan en etablerad, namngiven mönsterfamilj och kräver ingen
ändring för att vara branschmässigt grundad.

## Vad jag inte kunde belägga

- **Ingen direkt precedent hittades** — hos Anthropic eller någon annan
  granskad källa — för mönstret "en process läser vid start ett antal
  icke-atomära signaler om att en annan process redan är aktiv på samma
  delade resurs, och beslutar SJÄLV, utan att fråga en människa, att flytta
  sig till en isolerad kopia". Detta är en frånvaro av bevis, inte ett bevis
  på frånvaro — sökningen var bred (Anthropic-dokumentation, JetBrains,
  GitHub, vim, tmux, Terraform, Codespaces, Vite) men kan inte uttömma
  utrymmet av interna verktyg hos frontier-labb som inte publicerar sin
  sessionshanteringsmekanik.
  Möjligt att t.ex. Cursor eller andra AI-kodningsverktyg har byggt exakt
  detta internt utan att det är dokumenterat publikt — overifierat.
  Möjligt att det finns till exempel i cluster-schemaläggare
  (Kubernetes-liknande "leader election" är närbesläktat men löser ett
  annat problem — att VÄLJA en enda aktiv ledare, inte att låta en
  sekundär aktör automatiskt flytta sig till en helt egen kopia av
  resursen) — denna vinkel undersöktes inte djupare inom passets tidsram.
- **JetBrains "redan öppen i ett annat fönster"-varning** kunde INTE
  verifieras mot en primär- eller stark tredjepartskälla inom passets
  tidsram (sökningen gav communityforum-trådar om att öppna samma projekt i
  flera fönster, men ingen tydlig, citerbar beskrivning av en
  detektions-varning). Denna punkt är därför medvetet utelämnad ur
  delfråga 3:s bevisade lista och ur "Dom"-resonemanget — inte förkastad,
  bara obelagd, och nämns här enbart som ett öppet spår.
- **Airbnb/Twitter-X/Shopify/Robinhood-mergeköerna** (delfråga 4) är citerade
  via en sekundärkälla (Trunk.io, en kommersiell leverantör av
  utvecklarverktyg med eget intresse i att beskriva mergeköer som
  branschstandard) — inte verifierade mot respektive företags egen
  förstapartskälla inom passets tidsram. Uber-siffrorna (52 % → 99 %) är
  däremot verifierade mot Ubers egen `eng.uber.com`-blogg och det
  öppen-källkods-repo de publicerade (`github.com/uber/submitqueue`),
  vilket är förstapartskälla.
- **Ingen mätning gjordes** av T67:s föreslagna detektionssignaler i
  praktiken (t.ex. hur ofta `git worktree list` eller läsning av ett annat
  sessionsdoks `lifecycle`-fält faktiskt hade racat i verkliga historiska
  parallellkörningar i detta repo, t.ex. S57/S91). Passet är
  dokumentation-/precedentresearch, inte en empirisk mätning mot repots
  egen historik — det vore ett naturligt nästa steg om detektionsvägen
  väljs.

## Rekommendation

Detta är en rekommendation, inte ett beslut — Marcus/design-grillningen äger
valet.

1. Mekanisera worktree-isolering för parallella interaktiva sessioner —
   den delen av T67:s förslag har starkt, brett precedent och bör gå
   vidare till grillning/ADR utan tvekan om själva mekanismen.
2. Bygg triggersteget som **detektera + fråga/varna**, inte **detektera +
   tyst auto-isolera**. Det matchar den enda välbeprövade formen i vår
   problemklass (vim-swap-filens "another program may be editing… choose
   an action", Codespaces "Resume or create new") och är ärligt om att
   T67:s tre föreslagna signaler saknar en atomär detektionsgaranti. Ett
   textmeddelande vid sessionsstart ("En annan session verkar redan aktiv
   i denna katalog — vill du fortsätta här eller ta en egen worktree?") är
   billigare att bygga och säkrare mot false positive/negative än tyst
   auto-relokering, och passar för övrigt repots egen
   STOPPA-OCH-FRÅGA-disciplin (text i chatt, aldrig en tyst mekanism).
3. Om tyst auto-isolering ändå önskas: designa den så en **falsk
   negativ** (missad kollision) aldrig blir värre än dagens läge (delad
   arbetskatalog, redan känt och guardrail-hanterat av T67 punkt 1–6) och
   en **falsk positiv** (onödig worktree) kostar nästan noll — samma
   idempotens-princip som Vite-portvalet vilar på, fast utan Vites
   atomicitet.
4. Räknar-/ID-allokeringen (lessons, trådar, ADR:er, kortnummer) behöver
   ingen ny mekanik för att vara branschmässigt grundad — nuvarande form
   (derivera mot disk + committa direkt + manuell CLI-reparation vid
   krock) är redan samma mönsterfamilj som Rails/Django/git.

## Källförteckning

**Förstapartskällor (leverantör/organisation, primär):**

- [code.claude.com/docs/en/worktrees](https://code.claude.com/docs/en/worktrees) — Claude Code-dokumentation, "Run parallel sessions with worktrees" (hämtad 2026-08-02)
- [code.claude.com/docs/en/best-practices](https://code.claude.com/docs/en/best-practices) — Claude Code-dokumentation, "Best practices for agentic coding" (redirect-mål från `anthropic.com/engineering/claude-code-best-practices`, hämtad 2026-08-02)
- [code.claude.com/docs/en/agents](https://code.claude.com/docs/en/agents) — Claude Code-dokumentation, "Run agents in parallel" (hämtad 2026-08-02)
- [abseil.io/resources/swe-book/html/ch16.html](https://abseil.io/resources/swe-book/html/ch16.html) — *Software Engineering at Google*, kapitel 16, Googles egen open-source-sajt
- [eng.uber.com/ios-monorepo/](https://web.archive.org/web/20230605070547/https://www.uber.com/blog/ios-monorepo/) — Uber Engineering, iOS-monorepo + SubmitQueue
- [`github.com/uber/submitqueue`](https://github.com/uber/submitqueue) — Ubers öppen källkods-repo för SubmitQueue
- [`github.blog/news-insights/product-news/github-copilot-app-the-agent-native-desktop-experience`](https://github.blog/news-insights/product-news/github-copilot-app-the-agent-native-desktop-experience/) — GitHub Blog, Copilot app-lanseringen (juni 2026)
- [blog.jetbrains.com/idea/2026/03/intellij-idea-2026-1](https://blog.jetbrains.com/idea/2026/03/intellij-idea-2026-1/) — JetBrains officiella blogg, IntelliJ IDEA 2026.1
- [`vite.dev/config/server-options`](https://vite.dev/config/server-options) — Vite officiell dokumentation, port-fallback-beteende
- [git-scm.com/docs/git-push](https://git-scm.com/docs/git-push) — git officiell dokumentation, `--force-with-lease`
- [guides.rubyonrails.org/active_record_migrations.html](https://guides.rubyonrails.org/active_record_migrations.html) — Rails Guides, migrationsversionering

**Tredjepartskällor (community/branschöversikt, sekundär):**

- Django-dokumentation/community-källor om `makemigrations --merge` (riptutorial.com, fixdevs.com — konsulterade för mekanikbeskrivning, ej Djangos egen förstapartsdokumentation direkt citerad)
- Trunk.io-blogginlägg om merge-köer hos Airbnb/Twitter-X/Shopify/Robinhood (kommersiell leverantör, sekundär — se § Vad jag inte kunde belägga)
- Vim-dokumentation via Baeldung/Purdue ECE264-kursmaterial om `.swp`-filens E325-varning
- tmux GitHub-issue #3124 + community-trådar om nästlad session-detektion
- Terraform-communitykällor (Medium, OneUptime) om DynamoDB state-locking

**Internt (detta repo, verifierat mot disk 2026-08-02):**

- [`.claude/agents/bygg-agent.md`](../../.claude/agents/bygg-agent.md) — `isolation: worktree` i frontmatter
- [`.claude/agents/research-pass.md`](../../.claude/agents/research-pass.md) — `isolation: worktree` i frontmatter
- [`CLAUDE.md`](../../CLAUDE.md) § Landning + § Kortnummer
- [`tasks/threads/T67-parallella-aktiva-sessioner.md`](../../tasks/threads/T67-parallella-aktiva-sessioner.md)
- [`docs/decisions/ADR-076-merge-grinden-ruleset-pr-flode.md`](../decisions/ADR-076-merge-grinden-ruleset-pr-flode.md)
