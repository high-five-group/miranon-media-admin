# ADR-090: Sessions-parallellitet — detektera + fråga, worktree-isolering

- Status: Accepted (Marcus GO 2026-08-02, grillad samsyn 7/7 punkt 6)
- Datum: 2026-08-02
- Fas: Meta (sessions-/parallellitetsarkitektur)

> **Om beslutsvägen — bokförd öppet.** `T67` bokförde 2026-07-07 att
> design-steget (räknar-allokering, ev. worktree-isolation, end-pass-
> protokoll) krävde web-research med 3+ precedent innan mekanisering. Marcus
> villkorade grillningen (S94 Del 3 punkt 6) på just det branschbelägget — ett
> dedikerat research-pass spawnades MITT I grillningen
> ([`sessions-parallellitet-frontier-praxis-2026-08-02.md`](../research/sessions-parallellitet-frontier-praxis-2026-08-02.md),
> PR #593) och **fällde halva det ursprungliga förslaget**: mekanismen höll,
> triggerformen höll inte. Marcus kvitterade den reviderade formen samma dag.
> Noteras av samma skäl som i
> [ADR-086](ADR-086-uppdragets-premisser-provas-av-mottagaren.md)–
> [ADR-089](ADR-089-modell-effort-policy-per-processteg.md): en läsare ska
> kunna se vem som vägde, inte bara vad som beslutades.

## Kontext

`T67` föddes i Session 57 (2026-07-07) när Marcus körde S57 parallellt med
aktiv S56 — systemets första samtidigt-aktiva parallellkörning. Behovet i
Marcus ord: *"Vi måste kunna jobba parallellt med fler aktiva sessioner,
annars kapar vi produktiviteten ordentligt"* — men utan att kollidera på
seriella räknare, delad checkout, delade append-ytor, end-pass-samtidighet
eller levande regel-ytor (fem kollisionsklasser, `T67` § Vad tråden löser).
Pilotens guardrails 1–6 (S57 Del 1) löste piloten för hand; tråden pekade
själv mot grillning → design → sannolik ADR som nästa steg, och stod `active`
med det steget ogjort fram till denna landning.

**Vad research-passet fann** (fullt underlag i research-filen; sammanfattat
här):

- **Mekanismen — worktree per parallell session — är stenhårt etablerad.**
  Anthropics egen dokumentation ([code.claude.com/docs/en/worktrees](https://code.claude.com/docs/en/worktrees)):
  *"Running each Claude Code session in its own worktree means edits in one
  session never touch files in another"*; desktop-appen ger **varje** ny
  session sin egen worktree automatiskt ("every new session gets its own
  worktree automatically"). Detta repo kör redan exakt samma mekanism för
  subagenter (`isolation: worktree` i `.claude/agents/bygg-agent.md` +
  `research-pass.md`). Minst fyra ytterligare namngivna frontier-leverantörer
  2026 bekräftar mönstret: JetBrains (IntelliJ 2026.1, native worktree-stöd),
  GitHub Copilot-appen (*"Every session runs in its own git worktree… no
  manual setup, no cleanup"*), Cursor (VM-nivå-isolering per cloud-agent),
  OpenAI Codex CLI (konvergerar mot samma sandbox-mönster).
- **Triggerformen T67 föreslog — detektera en aktiv rival och SJÄLV, tyst,
  utan att fråga, flytta sig till en isolerad kopia — har tunt-till-inget
  direkt precedent.** Anthropics egen "automatik" är OVILLKORAD (varje
  session, oavsett om något annat körs parallellt), inte en reaktion på en
  detekterad kollision. De etablerade mönstren i vår problemklass
  (applikationsnivå-heuristik, icke-atomär detektion) landar alla på
  **detektera + fråga/blockera**, aldrig detektera + agera tyst:
  - **Vim swap-filer:** upptäcker en annan process med filen öppen →
    varnar (*"another program may be editing the same file"*) och ber
    användaren välja — aldrig en tyst automatisk kopia.
  - **tmux:** nästlad körning detekteras via `$TMUX` → BLOCKERAR, kräver
    explicit override.
  - **GitHub Codespaces:** upptäcker en existerande codespace för samma
    branch → frågar ("Resume this codespace" / "Create a new one"),
    default är att GÅ SAMMAN, inte isolera.
  - Den enda strukturellt lika formen (Vite: provar automatiskt nästa
    lediga port om standardporten är upptagen, utan att fråga) vilar på en
    **atomär OS-primitiv** (`bind()` lyckas eller misslyckas odelbart) —
    T67:s föreslagna signaler (ett annat sessionsdoks `lifecycle`-fält,
    `git worktree list`, ett smutsigt huvudträd) är tre separata,
    icke-atomära läsningar utan den garantin.
- **Trunk-based development stödjer resten av arkitekturen entydigt.**
  Google (*Software Engineering at Google*, kapitel 16): *"a version control
  policy that makes extensive use of dev branches as a means toward product
  stability is inherently misguided"* — receptet är *"trunk-based
  development, rely heavily on testing and CI, keep the build green"*.
  Uber byggde SubmitQueue efter att mäta att deras iOS-monorepos trunk bara
  var grön 52 % av tiden; med kön i drift steg det till 99 %. Detta repos
  merge-kö (`ADR-076`) är samma mekanism.
- **Räknar-/ID-allokeringen behöver ingen ny mekanik.** Repots nuvarande
  form (derivera mot disk omedelbart före skrivning, committa direkt,
  reparera manuellt vid kollision — `CLAUDE.md` § Kortnummer) matchar en
  etablerad, namngiven mönsterfamilj: Rails migrationstidsstämplar (bytte
  FRÅN sekventiella heltal 2008, uttryckligen för att lösa exakt detta
  race), Djangos `makemigrations --merge`, gits `--force-with-lease`
  (compare-and-swap/lease-semantik).

### ADR-bar-prövningen — alla tre villkor håller

1. **Svårt att återställa i koherens:** beslutet rör session-startens
   LÄS-fas (mekaniseras i hub-skillen) och kan lätt glömmas bort som
   "för sällan-förekommande för att formalisera" — exakt drift-risken
   `L328`/`ADR-081` redan visat för regler utan bokförd grund.
2. **Överraskande utan kontext:** att FÄLLA det ursprungliga förslaget
   (tyst auto-isolering) mitt i en pågående grillning, på ett research-pass
   spawnat under grillningen själv, är kontraintuitivt utan att veta att
   Marcus uttryckligen villkorade beslutet på just det branschbelägget.
3. **Verklig avvägning:** options-rymden delades i FEM delfrågor och en
   uttalad dom per delfråga (research-filen); den framtida vägen
   (ovillkorad worktree) hölls medvetet öppen i stället för att stängas.

## Beslut

### 1. Detektionssteg i session-starts LÄS-fas

Session-start får ett nytt detektionssteg som läser tre signaler:

- ett annat sessionsdoks `lifecycle: active` som INTE är den startande
  sessionens eget,
- `git worktree list` (finns redan andra aktiva worktrees),
- ett smutsigt huvudträd eller en främmande gren uppcheckad.

En träff rapporteras som ett **FYND** i RAPPORTERA-steget med förslaget "tar
egen worktree" → **Marcus kvitterar**. Frågan åker i sessionsstartens
BEFINTLIGA kvittens-utbyte (numrering + scope), noll extra rundor.

### 2. Ägarskaps-regeln

Den senare startande sessionen tar worktreen; den först startade behåller sin
plats i huvudträdet. Vid tvetydigt huvudträds-ägarskap (t.ex. oklart vilken
session som faktiskt är "först") avgör Marcus.

### 3. FÖRKASTAT — tyst auto-isolering (decline-rationale)

Det ursprungliga förslaget (session A detekterar session B och isolerar sig
SJÄLV, utan att fråga) förkastas med belägg:

- **Tunn precedent** för den EXAKTA formen (detektera icke-atomärt →
  autonomt agera tyst) — ingen granskad källa, hos Anthropic eller
  utanför, beskriver exakt detta flöde för utvecklarverktyg.
- **De etablerade mönstren i vår problemklass gör detektera + fråga**
  (vim, tmux, Codespaces) — aldrig detektera + agera tyst.
- **Den enda auto-analogen (Vite) vilar på en atomär OS-primitiv** våra
  föreslagna signaler saknar. Ett textmeddelande vid sessionsstart är
  billigare att bygga och säkrare mot false positive/negative än tyst
  auto-relokering, och matchar för övrigt repots egen STOPPA-OCH-FRÅGA-
  disciplin (text i chatt, aldrig en tyst mekanism).

### 4. ÖPPET BOKFÖRD framtida väg — ovillkorad worktree per session

Anthropics desktop-mönster (VARJE session får automatiskt sin egen worktree,
oavsett detekterad kollision) är ett belagt, alternativt slutläge. Det kan
väljas SENARE, "när formen bevisat sig" (Marcus 2026-08-02) — ingen ny
grillning krävs för det bytet, men beslutet bokförs då som en **Update** i
denna ADR, inte tyst.

### 5. Stale-hantering

`lifecycle: active` kan vara stale efter en krasch (sessionen dog utan att
sätta `closed`/`paused`). Detektionen behöver INTE vara perfekt — en människa
skiljer sant från stale vid Marcus-kvittensen. Färskheten (t.ex. datumet på
det andra sessionsdoket) noteras i FYND:et så beslutsunderlaget är fullt.

### 6. Oförändrat

- **Räknar-/ID-allokeringens nuvarande form** (derivera mot disk + committa
  direkt + manuell CLI-reparation vid kollision) — redan branschmässigt
  grundad (Rails/Django/git-mönsterfamiljen), ingen ändring krävs.
- **Merge-kön** (`ADR-076`) — trunk-based-belägget (Google, Uber) stödjer
  den arkitekturen oberoende av hur triggerfrågan avgjorts.
- **Agenternas egen worktree-isolation** (`isolation: worktree` i
  bygg-agent/research-pass-frontmatter) — redan i drift, orörd.

HUR-texten (den exakta formuleringen av detektionssteget, var i
LÄS-/RAPPORTERA-flödet det sitter) bor i hub-skillen `session-start`
(+ `session-resume` för återupptagningsfallet) — denna ADR bär beslutet och
varför, inte implementations-prosan.

## Alternativ som övervägdes

- **(A) Detektera + varna/blockera, aldrig auto-isolera** — vald form, se
  beslut 1–3. Matchar vim/tmux/Terraform-familjen.
- **(B) Detektera + fråga, konvergens som default** (Codespaces-formen: gå
  samman i den befintliga sessionen om inte annat väljs) — övervägd men
  INTE vald som default, eftersom vårt problem (kollision på seriella
  räknare, delad checkout) är allvarligare löst genom att som DEFAULT
  föreslå isolering, med Marcus som den som väljer annorlunda om han vill
  gå samman.
- **(C) Detektera + tyst auto-isolera** (T67:s ursprungsförslag; Vite-formen)
  — FÖRKASTAD, se beslut 3.
- **(D) Ovillkorad worktree per session** (Anthropics desktop-mönster) —
  ÖPPET BOKFÖRD framtida väg, se beslut 4. Inte vald NU: kostar en worktree
  per session även när ingen kollision finns, och "bevisa formen först" är
  en rimlig sekvensering snarare än att hoppa direkt till den mest
  aggressiva isoleringen.

## Precedent

- **Anthropic** — [code.claude.com/docs/en/worktrees](https://code.claude.com/docs/en/worktrees),
  [code.claude.com/docs/en/best-practices](https://code.claude.com/docs/en/best-practices)
  ("Run multiple Claude sessions" under "Automate and scale"),
  [code.claude.com/docs/en/agents](https://code.claude.com/docs/en/agents).
- **JetBrains** — IntelliJ IDEA 2026.1, native git worktree-stöd
  ([blog.jetbrains.com/idea/2026/03/intellij-idea-2026-1](https://blog.jetbrains.com/idea/2026/03/intellij-idea-2026-1/)).
- **GitHub** — Copilot-appen, *"Every session runs in its own git
  worktree… no manual setup, no cleanup, no branch juggling"*
  ([`github.blog`](https://github.blog/news-insights/product-news/github-copilot-app-the-agent-native-desktop-experience/)).
- **Vim** (`.swp`-detektion + E325-varning), **tmux** (`$TMUX`-blockering),
  **GitHub Codespaces** (resume-eller-ny-prompt) — samma familj: detektera
  OCH mänskligt val, aldrig tyst.
- **Vite** — port-fallback utan att fråga, men på en atomär `bind()`-garanti
  ([`vite.dev/config/server-options`](https://vite.dev/config/server-options)).
- **Google, *Software Engineering at Google*, kapitel 16** — trunk-based
  development som recept
  ([abseil.io/resources/swe-book/html/ch16.html](https://abseil.io/resources/swe-book/html/ch16.html)).
- **Uber SubmitQueue** — 52 % → 99 % trunk-grönhet
  ([eng.uber.com/ios-monorepo](https://web.archive.org/web/20230605070547/https://www.uber.com/blog/ios-monorepo/)).
- **Rails migrationstidsstämplar, Django `--merge`, git
  `--force-with-lease`** — optimistisk konkurrens + sen mekanisk reparation,
  samma mönsterfamilj som repots räknar-/ID-form.

## Vad som INTE belagts (öppet, ur research-passet)

- Ingen precedent hittades för mönstret "läs icke-atomära signaler → besluta
  SJÄLV, utan att fråga en människa" — hos Anthropic eller någon annan
  granskad källa. Frånvaro av bevis, inte bevis på frånvaro: interna
  frontier-labbverktyg som inte publicerar sin sessionsmekanik kan
  teoretiskt göra detta utan att det är dokumenterat.
- JetBrains "redan öppen i ett annat fönster"-varningen kunde INTE
  verifieras mot en primär- eller stark tredjepartskälla och ingår därför
  inte i den bevisade listan ovan.
- Airbnb/Twitter-X/Shopify/Robinhood-mergeköerna är citerade via en
  kommersiell sekundärkälla (Trunk.io), inte verifierade mot företagens
  egna förstapartskällor — till skillnad från Uber-siffrorna som ÄR
  förstapartsverifierade.
- Ingen mätning gjordes av T67:s föreslagna detektionssignaler mot detta
  repos EGEN historik (t.ex. hur ofta de faktiskt hade racat under S57/S91).
  Passet är precedentresearch, inte empirisk mätning — ett naturligt
  uppföljningssteg om detektionsvägen visar sig otillräcklig i praktiken.

## Konsekvenser

- Session-start får ett nytt, litet LÄS-fas-steg (detektion) och en ny
  möjlig FYND-rad i RAPPORTERA — implementeras i en SEPARAT hub-landning,
  inte av denna ADR.
- `T67` går från "design-steg ogjort" till "beslut fattat, mekanisering
  utanför denna landning" — lifecycle-övergången och motiveringen står i
  tråd-kortet, inte här (se `tasks/threads/T67-parallella-aktiva-sessioner.md`
  § Pausad).
- Räknar-/ID-disciplinen, merge-kön och agenternas egen worktree-isolation
  kräver noll ändring — samtliga redan branschmässigt grundade.
- Den öppna framtida vägen (ovillkorad worktree) är en medveten skuld: ingen
  kod byggs för den nu, men den är inte glömd — nästa gång frågan är aktuell
  läses denna ADR:s beslut 4 innan en ny utredning startas om.

## Relaterat

`T67` (parallella aktiva sessioner — tråden denna ADR stänger designsteget
för) · `ADR-089` (syskon-ADR:n från samma grillning, modell-/effort-policy) ·
`ADR-076` (merge-kön, trunk-based-arkitekturen denna ADR bygger vidare på) ·
[`sessions-parallellitet-frontier-praxis-2026-08-02.md`](../research/sessions-parallellitet-frontier-praxis-2026-08-02.md)
(fullt underlag) · `tasks/sessions/2026-08-02-session-94.md` Del 3 punkt 6.

## Verkställande

Denna landning: `T67`-kortet bokför beslutet + denna ADR-pekare och sätter
sin lifecycle till det läge § Beslut 5/6 + trådregistrets regler föreskriver
(se kortet självt för motiveringen). Hub-halvan (den faktiska mekaniseringen
av detektionssteget i `session-start`/`session-resume`) ägs av orkestreraren
i en SEPARAT hub-landning — inte del av denna ADR:s spoke-verkställande.
