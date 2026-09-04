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

## Updates

### 2026-08-04 (S97) — beslut 2 mekaniserat, `ask` framför `deny`

Beslut 2 (ägarskaps-regeln) stod i ren prosa i tre månader och **bröts tre
gånger i ett enda pass**: S96 Del 8 bokför två `git merge --ff-only` och en
gren skapad i huvudkatalogen medan S93 ägde den. Ingen skada — rena träd,
rena fast-forwards — men fel form, och `check-lifecycle.sh` var grön hela
tiden eftersom den prövar konsistens mellan fält och rubrik, inte om
sessionen faktiskt arbetar. Instansen är en av de starkaste i `T119`:s
empiriska grund (regler med mekanism efterlevs; regler i prosa bryts).

Mekanismen, byggd i S97 som `T119` arbetslista (a), Marcus-GO 2026-08-04:

- `scripts/katalogagarskap-markor.sh` (`SessionStart`) skriver en **ägarlapp**
  i `--git-common-dir` — den katalog git per definition delar mellan
  huvudträdet och alla worktrees. En session som kör i en worktree gör inget
  anspråk; en session som möter en främmande färsk lapp **stjäl den aldrig**
  utan rapporterar ägarskapet som fakta, vilket gör beslut 1:s detektion
  synlig även mitt i en session.
- `scripts/deny-frammande-huvudkatalog.sh` (`PreToolUse`, `Bash`) prövar tre
  delfrågor i tur och ordning: är kommandot en git-skrivning · riktas det mot
  huvudkatalogen · äger denna session den.
- Värdena är config-drivna i `.katalogagarskap-policy.conf` per Lesson #6.

**Formvalet `permissionDecision: "ask"` framför `exit 2`** följer beslut 3:
detektera **och fråga**, vim/Codespaces-familjen — inte tmux-formens hårda
blockering. Ägarskaps-regeln har legitima undantag (S97 kör själv i
huvudkatalogen med kvittens), och en människa ska avgöra dem. Visar sig
`ask` opålitligt i drift är bytet till `exit 2` en enradsändring, och den
ska då bokföras som en ny Update här — inte ändras tyst.

**Medveten avvikelse från mail-låsets kontrakt:** hooken failar **öppet**
(internt fel ⇒ släpp), medan `scripts/deny-resend-send.sh` failar slutet.
Skillnaden är skadans natur: ett skickat mail är irreversibelt, medan fel
form på en git-operation är återställbar — S96:s tre överträdelser gav noll
dataförlust. En trasig hook som nekar allt vore en värre skada än det
problem hooken finns för att lösa.

**Bevisläge, ärligt redovisat:**

- Logiken är bevisad — tvåsidig testsvit 23/23 mot ett äkta temporärt repo
  med en äkta worktree (`scripts/test-deny-frammande-huvudkatalog.sh`), plus
  manuell körning mot detta repo med en planterad främmande ägarlapp, som gav
  korrekt `ask` med korrekt skäl.
- **Aktiveringen i harnesset är INTE bevisad i byggsessionen.** Tre
  mätpunkter: den nya hooken fäller manuellt · den fäller inte via harnesset
  (två provokationer) · den *befintliga* mail-lås-hooken fäller samtidigt via
  harnesset. Hook-systemet kör alltså, men en hook registrerad mitt i en
  session togs inte i bruk i den sessionen — trots att förstapartsdokumentationen
  säger att ändringar *"normally [are] picked up automatically by the file
  watcher"*. Orsaken är **inte** fastställd och påstås därför inte. Samma
  mönster som MCP-verktygsytan i S97 Del 2. Det skarpa tvåsidiga beviset i
  laddad session är därmed en **öppen skuld** som betalas vid nästa
  sessionsstart, på samma sätt som mail-låsets MCP-väg.

Denna Update rör **enbart beslut 2**. Beslut 1:s detektionssteg och beslut 4:s
öppna framtida väg (ovillkorad worktree per session) är oförändrade, och
§ Verkställandes hub-halva är fortfarande ogjord.

### 2026-08-04 (S97, T120) — livstid, ägarskap vid skrivning, `deny`, smutsig-träd-varning

Ovanstående Update mekaniserade beslut 2 med IDENTITET men ingen LIVSTID.
Samma dag, innan mekanismen nådde skarp drift, avtäckte T120 att just den
luckan var rotorsaken till ett skarpt fall: en lapp blockerade nästa session
TRE MINUTER efter att den skrevs, från en session som redan var död (noll
processer, ingen transcript-fil, tom scratchpad). `KATALOG_STALE_TIMMAR`
ändrade bara TEXTEN i skälet — aldrig beslutet. Denna Update bokför fyra
lager, byggda och REVIDERADE i sekvens SAMMA DAG (ordningen är läsvärd — den
visar hur varje lager avtäckte nästa lucka):

**Lager 1 — PID-liveness.** Lappen bär sedan T120 `agare_pid` +
`agare_pid_starttid`, härlett genom processens förfaderkedja (ingen PID
exponeras i hook-input, bekräftat mot code.claude.com/docs/en/hooks).
`deny-frammande-huvudkatalog.sh` kör `kill -0` + jämför starttiden
(PID-återanvändningsgard, samma teknik som systemd `PIDFile`) innan den
nekar. En bevisligen död ägare släpps utan att fråga — precis Vims
precedent (`.swp`-filens PID-baserade dödsdetektion, redan sanktionerad i
§ Precedent).

**Lager 2 — ägarskap TAS vid SKRIVNING, inte vid ANKOMST (RIVNING av den
första formen).** Den ursprungliga T120-formen lät `katalogagarskap-
markor.sh` (SessionStart) fortsätta SÄTTA lappen, bara med PID-fälten
tillagda. Den formen reviderades INNAN den landade: Marcus håller MEDVETET
gamla sessionsfönster öppna som referens (mätt levande exempel samma dag:
PID 56246, öppet sedan 2026-08-02, över två dygn) — ett sådant fönster LÄSER
men ARBETAR inte. Med lappen satt vid ankomst hade VARJE sparat
referensfönster ockuperat huvudkatalogen PERMANENT. Lösningen: `katalog-
agarskap-markor.sh` skriver ALDRIG längre — den behåller bara sin
RAPPORTERANDE roll (en främmande lapp syns fortfarande i sessionsstartens
kontext). `deny-frammande-huvudkatalog.sh` tar lappen atomärt (`set -C`/
noclobber för en ny lapp; temp+`mv` för ett övertagande) i SAMMA anrop som
den ändå prövar en git-skrivning — bara sessioner som faktiskt kör I
huvudkatalogen får ta eller ta över; en worktree-session som pekar dit via
`-C` gör inget hemvist-anspråk.

**FÖRKASTAT — tidsbaserat övertagande av en LEVANDE men TYST ägare.** Ett
tredje tillägg samma dag prövade `KATALOG_TYSTNAD_MINUTER`: en levande ägare
som inte skrivit på ett tag skulle ge vika för en session som ville skriva.
Marcus fällde förslaget innan det landade, med ett konkret scenario
(verbatim): *"det kan ju bara vara så att jag behöver gå och bajsa, och när
jag kommer tillbaka så har vi ingen katalog att stå på då?"* Rotorsaken i
det förkastade tänkandet: TID användes som proxy för "ingen arbetar här",
men ett arbetsträd med OCOMMITTADE ändringar är upptaget oavsett ägarens
tystnad — en session som "tog över" en tyst-men-levande ägare hade kunnat
skriva (checkout/commit/merge) rätt ovanpå det ocommittade arbetet medan
ägaren bara var borta från tangentbordet. Bokfört öppet, inte tyst rivet,
per husets regel om falsifierat innehåll. En levande ägare nekar därför
ALLTID, oavsett tystnadslängd — det enda giltiga övertagande-villkoret
förblir BEVISAD DÖD process.

**Lager 3 — varning vid smutsigt arbetsträd (andra Marcus-fångsten).**
Byggd som svar på ett fel i det egna resonemanget som fällde tidsövertagandet:
"en död process kan inte ha ocommittat arbete som går förlorat — den är
borta" var självt fel. Processen är borta; ARBETET på disk är det INTE.
Marcus föreslog då att lappen ALDRIG skulle övertas — förkastat i sin tur,
eftersom det ger permanent låsning vid en enda felkryssning (samma
spöklapp-incident, fast som en hård vägg i stället för en klickbar prompt).
Rätt form: övertagande vid död process sker fortfarande automatiskt, men om
huvudkatalogens arbetsträd samtidigt bär SPÅRADE ändringar (modifierade
eller staged — otrackade filer räknas medvetet inte, se
`package-lock.json.pre-t118`) eller en PÅGÅENDE git-operation (`MERGE_HEAD`,
`CHERRY_PICK_HEAD`, `rebase-merge`/`rebase-apply`), levererar hooken en
VARNING till den övertagande AGENTEN — aldrig en prompt till Marcus — via
`hookSpecificOutput.additionalContext` på ett `permissionDecision: "allow"`-
svar. Verifierat mot förstapartsdokumentationen, inte gissat:
`permissionDecisionReason` är dokumenterat "shown to Claude when denying, or
to the user when asking" (ingetdera gäller `allow`) och `systemMessage` är
uttryckligen "shown to the user" — `additionalContext` är fältet som når
Claude UTAN att nå Marcus, samma fält `katalogagarskap-markor.sh` redan
använder för sin SessionStart-rapportering.

**Lager 4 — explicit släpp.** `SessionEnd` (harnessets hook-event, `scripts/
katalogagarskap-slapp.sh`) släpper lappen när dess `session_id` matchar
exakt. Ett nytt CLI-läge, `katalogagarskap-markor.sh --slapp`, exponerar
samma släpp som ett anropbart kommando avsett för disciplin-skillsen
`session-paus`/`session-end` (marcus-system-pluginet) att köra som ETT EGET
STEG vid stängning — snabbare än att vänta ut död-process-detektionen.
Skill-sidans faktiska anrop är UTANFÖR denna spoke-landning (cross-repo).

**Sammanfattat, de FYRA verben:** lappen **TAS** vid första git-skrivningen
(aldrig vid SessionStart) · **BEHÅLLS** så länge processen lever, oavsett
tystnad · **ÖVERTAS** endast vid BEVISAD död process (aldrig tidsbaserat) ·
**SLÄPPS** explicit vid `SessionEnd` eller `--slapp`.

**Namnkrocken, dokumenterad i koden:** `session-end` (pluginets
disciplin-skill, skriver `lifecycle: closed` i ett sessionsdok) och
`SessionEnd` (harnessets hook-event) lät nästan identiska och gav en
FELAKTIG slutsats (Marcus, 2026-08-04): att en pausad session äger
huvudkatalogen tills disciplin-skillen körs på den. Fel — lappen är knuten
till PROCESSEN, inte till `lifecycle`-fältet. Förklaringen står nu i
`scripts/katalogagarskap-markor.sh` och `scripts/deny-frammande-
huvudkatalog.sh`:s filhuvuden, inte bara här, eftersom nästa läsare möter
skriptet, inte denna ADR.

**`ask` → `deny` (korrigerar föregående Updates formval).** Föregående
Update i detta avsnitt valde `permissionDecision: "ask"` med motiveringen
att legitima undantag finns. Samma dags forskningspass
(`docs/research/hook-beslut-ask-vs-deny-och-begriplighet-2026-08-04.md`,
skrivet FÖRE T120) landade oberoende på samma slutsats: "Behåll `ask`" för
just detta skript. T120 river bägge — INTE för att de hade fel GIVET
förutsättningarna då, utan för att PID-liveness ändrar förutsättningen:
`ask` fanns för att skriptet inte kunde skilja en äkta konflikt från en
falsk. Nu kan det. En bevisligen levande ägare nekar hårt (`deny`); en
bevisligen död släpps tyst (med varning vid smutsigt träd). Kvarstående
kostnad, öppet noterad: det legitima undantaget (Marcus medvetet låter en
session arbeta trots en annan levande ägare) har ingen in-hook-PROMPT
längre — bara `rm <lappen>` manuellt. Den tidigare "KÄND RISK"-noteringen om
`#37210` var, enligt samma forskningspass, en felanvänd exit-kod hos
rapportören, inte en plattformsbugg — repots mönster (`jq -nc {...}; exit
0`, aldrig blandat med `exit 2`) undvek den redan strukturellt.

**Fällnings-logg (observerbarhet).** Både `deny-frammande-huvudkatalog.sh`
och `deny-grind-genom-pipe.sh` (syskon-hooken från föregående Update i S97)
appenderar nu en JSONL-rad per NEKANDE till `.claude/hook-fallningar.jsonl`
(lokal, `.gitignore`:ad) — tidsstämpel, vilken hook, kommando (förkortat),
skäl-nyckel. Skälet: fällningsfrekvensen var okänd, och den avgör om
spärrarna sinkar arbetet mer än de skyddar mot fel.

**Bevisläge, ärligt redovisat.** Logiken är bevisad tvåsidigt: `scripts/
test-deny-frammande-huvudkatalog.sh` (55/55, tre skript — markör-, prövnings-
och släpp-hooken) och `scripts/test-deny-grind-genom-pipe.sh` (25/25, med
fällnings-loggens nya rader). Bägge nya mekanismer (fällnings-loggen,
smutsig-träd-varningen) har körts genom en NEGATIV kontrollprövning — den
avsedda koden togs bort/bröts temporärt och testerna föll rött exakt på de
förväntade raderna, återställdes sedan — inte bara ett grönt facit. CI-
portabilitet är medvetet byggd in: PID-derivationens tester styr
`KATALOG_CLI_PROCESSNAMN` via en temporär policy-override i stället för att
lita på att en "Claude"-process råkar finnas i testmiljöns egen
processkedja (den gör det lokalt i detta projekts VS Code-terminal, men
inte i GitHub Actions). **Aktiveringen i harnesset är, liksom föregående
Updates PID-lösa form, INTE bevisad i DENNA byggsession** — samma
strukturella klass som `CLAUDE.md` § "En ny hook kan ALDRIG skarpbevisas
i sessionen som byggde den": hookar registrerade/ändrade mitt i en session
laddas inte om förrän nästa sessionsstart. Öppen skuld, betalas vid nästa
sessions första handlingar.

Denna Update rör beslut 2:s MEKANISM (liveness, ägarskap-tagande,
`deny`-form, varning). Beslut 1, 4 och 6 är fortfarande oförändrade.

## Relaterat

`T67` (parallella aktiva sessioner — tråden denna ADR stänger designsteget
för) · `T119` (mekaniserings-programmet, som Updaten ovan hör till) ·
`T120` (ägarlappens livstid — rotorsaken 2026-08-04-Updaten bokför) ·
`ADR-089` (syskon-ADR:n från samma grillning, modell-/effort-policy) ·
`ADR-076` (merge-kön, trunk-based-arkitekturen denna ADR bygger vidare på) ·
[`sessions-parallellitet-frontier-praxis-2026-08-02.md`](../research/sessions-parallellitet-frontier-praxis-2026-08-02.md)
(fullt underlag) · `tasks/sessions/archive/2026-08/2026-08-02-session-94.md` Del 3 punkt 6.

## Verkställande

Denna landning: `T67`-kortet bokför beslutet + denna ADR-pekare och sätter
sin lifecycle till det läge § Beslut 5/6 + trådregistrets regler föreskriver
(se kortet självt för motiveringen). Hub-halvan (den faktiska mekaniseringen
av detektionssteget i `session-start`/`session-resume`) ägs av orkestreraren
i en SEPARAT hub-landning — inte del av denna ADR:s spoke-verkställande.
