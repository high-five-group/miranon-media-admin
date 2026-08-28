# Git-läsning vs git-skrivning i ett policy-/hook-lager, och hur målkatalogen avgörs

**Datum:** 2026-08-28
**Frågeställare:** Marcus, via orkestrerande session
**Metod:** primärkällor (code.claude.com, git-scm.com) + verifierad källkod
(openai/codex, gitolite.com) + egen mätning i detta repo (git 2.50.1, Apple
Git-155) + korsläsning mot repots egen redan byggda mekanism.

**Not om landningsplats:** detta pass kördes i en worktree-isolerad agent.
Harnesset avvisade en Write mot huvudkatalogens `docs/research/` (`"Edit the
worktree copy of this file instead of the shared-checkout path"`) — därför
ligger filen i MIN worktree-kopia av repot, inte i huvudkatalogen. Full
sökväg i slutrapporten till orkestreraren, som äger flytten dit.

## Vad jag hittade redan i repot (inventering, före sökning)

Detta ämne är **redan skarpt byggt lokalt**, inte bara diskuterat. Innan jag
sökte externt läste jag:

- **`scripts/deny-frammande-huvudkatalog.sh`** (697 rader) — en PreToolUse-hook
  som gör EXAKT det frågan handlar om: klassar git-kommandon som
  skrivande/läsande (delfråga 1 nedan) och avgör målkatalogen via
  `cwd`-jämförelse + textmönster (delfråga 2). Detta är den STARKASTE lokala
  källan för delfråga 3 och används som ett femte konkret exempel utöver de
  tre begärda.
- **`.katalogagarskap-policy.conf`** — den faktiska allow/deny-listan:
  `KATALOG_GIT_SKRIVKOMMANDON` (merge, switch, checkout, commit, rebase,
  reset, push, pull, cherry-pick, revert, stash, am, apply, restore, **branch**,
  tag, clean, gc, prune, add, rm, mv) och `KATALOG_WORKTREE_SKRIVKOMMANDON`
  (add, remove, prune, move, lock, unlock — `git worktree list` är medvetet
  UTELÄMNAD, dvs. klassad som läsning).
- **`ADR-090`** (sessions-parallellitet) — beslutet mekanismen implementerar.
- **`docs/research/hook-beslut-ask-vs-deny-och-begriplighet-2026-08-04.md`** och
  **`t121-skribenten-claude-code-worktree-hookspath-2026-08-04.md`** — närliggande
  men om ett ANNAT problem (ask/deny-semantik respektive hooksPath-bieffekten
  av `git worktree add`), inte om läs/skriv-klassning i sig.

**Ingen ADR eller lesson förkastar det här mönstret** — det är tvärtom levande,
testat (`scripts/test-deny-frammande-huvudkatalog.sh`, 55/55) och aktivt i
produktion i detta repo. Detta pass tillför alltså: (a) förstapartsbelägg för
`cwd`-semantiken som repots egen kod bygger på men aldrig själv citerar
verbatim, (b) tre-plus externa branschexempel för jämförelse, och (c) en
observation om en KÄND LUCKA i repots egen implementation (§ Sidofynd nedan).

**AVGÖRANDE UPPTÄCKT, gjord EFTER att texten ovan redan var skriven:** den
worktree detta pass kördes i (`agent-a7b3313f50b38e32c`) bar redan, OKOMMITTAT,
ett pågående fix-arbete för exakt den lucka jag identifierade oberoende
(se § Rekommendation nedan) — `backlog/tasks/task-322 - Fynd-katalogägarskaps-
hooken-fäller-falskt-på-textmönster.md` (status "To Do", AC #1–#2 redan
avbockade, `.katalogagarskap-policy.conf` + `scripts/deny-frammande-
huvudkatalog.sh` + dess testsvit ändrade, +444/-51 rader enligt `git diff
--stat`). Kortets egen beskrivning (källmärkt S112 resume 1, 2026-08-26)
dokumenterar LIVE-REPRODUKTION av PRECIS samma symptom jag härledde teoretiskt
ur Codex CLI-jämförelsen: *"'git branch --list' mot huvudkatalogen nekades av
hooken med skälet 'kommandot pekar explicit på huvudkatalogen' trots att
--list är en läsning."* Jag har INTE läst eller rört dessa filers innehåll
utöver `git diff --stat` (ren läsning, ingen ändring) — det är en annan
agents/sessions okommitterade arbete i samma delade worktree, och rörs inte
härifrån. Se § Rekommendation för hur detta ändrar denna rapports status från
"föreslå" till "bekräfta en redan pågående fix mot extern branschprecedent".

**Viktig avvikelse att notera direkt:** repots egen policy klassar `branch`
som **skrivande på underkommando-nivå, utan flagg-medvetenhet** — till
skillnad från `worktree` (som ÄR flagg/subkommando-medveten: `list` är läsning,
`add`/`remove`/... är skrivning). Det innebär att `git branch --list` eller
`git branch --merged` i huvudkatalogen i dag fälls av hooken som om det vore en
skrivning, trots att det är en ren läsning. Se § Sidofynd.

---

## Kort svar

Fyra primärkälle-verifierade slutsatser:

1. **`cwd` i Claude Code-hookar är skalets FAKTISKA, DYNAMISKA arbetskatalog
   vid anropstillfället** — inte sessionens/projektets rot. Den ändras när
   Claude kör `cd`, och det finns ett eget `CwdChanged`-event just för detta.
   Alternativ (b) i frågan är alltså FEL; (a) är rätt.
2. **Git löser målkatalog i en tydlig, dokumenterad ordning**: `-C <path>` är
   kumulativ och relativ till föregående `-C`; `--git-dir`/`--work-tree`
   tolkas relativt den `-C`-justerade katalogen; kommandoradsflaggor slår
   motsvarande miljövariabler. `git rev-parse --show-toplevel/--git-dir/
   --absolute-git-dir/--git-common-dir` är de dokumenterade frågekommandona.
   `--git-dir` och `--git-common-dir` **skiljer sig i en worktree** — mätt
   live i detta repo (se delfråga 2).
3. **Läs/skriv-klassning i verkliga verktyg görs på PARSAD ARGV, per
   underkommando OCH per flagga när det spelar roll** — inte på hela
   kommandosträngen med regex. OpenAI Codex CLI:s Rust-källkod (verifierad
   live, huvudgren 2026-08-28) är det tydligaste beviset: `git branch` är
   säkert, `git branch -d/-D/--delete` (även hopstaplat som `-vd`, även bakom
   `-C`/`-c`) är farligt.
4. **Att INTE bygga en full shell-parser i ett säkerhetslager är etablerad
   praxis** — OWASP rekommenderar att helt undvika OS-kommandon, och där det
   inte går: allowlist av kommandon + allowlist-validering av argument, aldrig
   blockliste/regex på fri text. Codex CLI:s egen kod bekräftar samma
   grundhållning indirekt: de har byggt en ÄKTA (om än begränsad,
   djup-begränsad) shell-parser för `bash -lc "..."`-fallet, men ramar in hela
   mekanismen som en HEURISTISK varningsnivå ovanpå en sandlåda — inte den
   enda säkerhetsgränsen.

---

## Delfråga 1 — Claude Code hooks: fältet `cwd`

**Källor:** <https://code.claude.com/docs/en/hooks.md>,
<https://code.claude.com/docs/en/hooks-guide.md> (hämtade 2026-08-28)

- **URL:** code.claude.com/docs/en/hooks.md, avsnitt "Hook input" / "Common
  input fields".
  **Citat:** *"Every event includes common fields like `session_id`, a unique
  ID for the session, and `cwd`, the working directory when the event fired,
  but each event type adds different data."*
  **Slutsats:** `cwd` är knuten till HÄNDELSEN (anropstillfället), inte till
  sessionen som helhet — exakt alternativ (a) i frågan.

- **URL:** code.claude.com/docs/en/hooks.md, tabellraden för `cwd` i
  fält-referensen.
  **Citat:** *"`cwd` | Current working directory when the hook is invoked"*
  **Slutsats:** Samma sak i tabellform — invocation-tidpunkten, inte
  projektroten.

- **URL:** code.claude.com/docs/en/hooks.md, avsnittet om worktrees
  (avgörande citat för hela frågan).
  **Citat:** *"Worktrees are different. If Claude enters a worktree during the
  session, Claude Code keeps `${CLAUDE_PROJECT_DIR}` where it was and passes
  the worktree path to your hooks a different way: **cwd follows Claude**: the
  `cwd` field in the hook's input JSON is the worktree root after Claude
  enters a worktree, and the new directory after Claude runs `cd`. Read it
  when a hook needs to know which directory Claude is working in."*
  **Slutsats:** Detta är den definitiva bekräftelsen. `${CLAUDE_PROJECT_DIR}`
  är den STABILA projekt-/sessionsroten (alternativ b) — och dokumentationen
  ställer den UTTRYCKLIGEN i kontrast mot `cwd`, som är alternativ (a): den
  FAKTISKA, RÖRLIGA arbetskatalogen. De är olika fält med olika syften, och
  dokumentationen säger rakt ut att man ska läsa `cwd` när man vill veta var
  Claude faktiskt jobbar just nu.

- **URL:** code.claude.com/docs/en/hooks-guide.md, händelsetabellen.
  **Citat:** *"`CwdChanged` | When the working directory changes, for example
  when Claude executes a `cd` command. Useful for reactive environment
  management with tools like direnv"*
  **Slutsats:** Existensen av ett EGET event för katalogbyte är i sig ett
  bevis: om `cwd` vore en statisk projektrot skulle detta event vara
  meningslöst. `CwdChanged` saknar dessutom matcher-stöd ("always fires on
  every directory change") — ytterligare bekräftelse på att det är en
  frekvent, dynamisk signal.

- **Bash-verktygets `tool_input` — bär det något annat fält som avslöjar
  målkatalog?**
  **URL:** code.claude.com/docs/en/hooks.md, exempel-JSON för PreToolUse.
  **Citat (exempel-JSON):**

  ```json
  "tool_input": {
    "command": "npm test",
    "description": "Run test suite",
    "timeout": 120000,
    "run_in_background": false
  }
  ```

  och: *"The `tool_name`, `tool_input`, and `tool_use_id` fields are
  event-specific. Each hook event section documents the additional fields for
  that event."*
  **Slutsats:** Dokumentationen ger INGEN fält-för-fält-beskrivning av Bash:s
  `tool_input`-schema utöver detta exempel. De fyra synliga fälten är
  `command`, `description`, `timeout`, `run_in_background` — INGET av dem är
  en dedikerad katalogangivelse. Den enda katalogsignalen är alltså det
  toppnivå-`cwd`-fältet plus vad som går att UTLÄSA ur `command`-strängen
  (t.ex. `-C`, `cd`) genom egen textanalys — precis det
  `deny-frammande-huvudkatalog.sh` gör, och precis den begränsning skriptets
  eget § SCOPE-GRÄNSER redan skriver ut ("En shell-sträng går inte att tolka
  exakt utan att implementera en shell-parser").

**Vad jag INTE kunde belägga:** en formell, fältvis JSON-schema-specifikation
för `tool_input` per verktygstyp (Bash, Read, Edit, …) publicerades inte i de
avsnitt jag hämtade — bara exempel-JSON. Om ett sådant schema finns någon
annanstans i dokumentationen (t.ex. en OpenAPI-liknande referens) har jag inte
hittat den.

---

## Delfråga 2 — Gits egen upplösning av målkatalog

**Källor:** <https://git-scm.com/docs/git> (OPTIONS, ENVIRONMENT VARIABLES),
<https://git-scm.com/docs/git-rev-parse>, egen mätning (`git --version` =
`git version 2.50.1 (Apple Git-155)`, körd i detta repos worktree
2026-08-28).

### `-C <path>` — kumulativ och relativ

**URL:** git-scm.com/docs/git, OPTIONS.
**Citat:** *"Run as if git was started in `<path>` instead of the current
working directory. When multiple `-C` options are given, each subsequent
non-absolute `-C` `<path>` is interpreted relative to the preceding `-C`
`<path>`. If `<path>` is present but empty, e.g. `-C` `""`, then the current
working directory is left unchanged."*
**Slutsats:** JA, kumulativt/relativt — precis som frågan misstänkte. Flera
`-C`-flaggor kedjas.

**Samspel med `--git-dir`/`--work-tree`, citerat:**
> *"This option affects options that expect path name like `--git-dir` and
> `--work-tree` in that their interpretations of the path names would be made
> relative to the working directory caused by the `-C` option. For example
> the following invocations are equivalent: `git --git-dir=a.git
> --work-tree=b -C c status` ≡ `git --git-dir=c/a.git --work-tree=c/b
> status`"*
**Slutsats:** `-C` sätter en ny "bas" som senare path-flaggor tolkas relativt
till — ordningen i kommandoraden spelar roll för TOLKNINGEN, inte bara för
exekveringsordning.

### `--git-dir=<path>`

**Citat:** *"Set the path to the repository (\".git\" directory). This can
also be controlled by setting the `GIT_DIR` environment variable. […]
Specifying the location of the \".git\" directory using this option (or
`GIT_DIR` environment variable) turns off the repository discovery that
tries to find a directory with \".git\" subdirectory […] If you just want to
run git as if it was started in `<path>` then use `git -C <path>`."*
**Slutsats:** kommandoradsflaggan och miljövariabeln styr SAMMA värde;
flaggan vinner eftersom den "also sets this value" (samma mekanism, flaggan
är den mer direkta vägen in).

### `--work-tree=<path>` och miljövariablerna

**Citat (`--work-tree`):** *"Set the path to the working tree. […] This can
also be controlled by setting the GIT_WORK_TREE environment variable and the
core.worktree configuration variable."*
**Citat (`GIT_DIR`):** *"If the `GIT_DIR` environment variable is set then it
specifies a path to use instead of the default `.git` for the base of the
repository. The `--git-dir` command-line option also sets this value."*
**Citat (`GIT_WORK_TREE`):** *"Set the path to the root of the working tree.
This can also be controlled by the `--work-tree` command-line option and the
core.worktree configuration variable."*
**Slutsats om ORDNING:** git-scm.com/docs/git ger INGEN samlad,
sida-vid-sida-precedens-tabell. Det som GÅR att belägga verbatim är: (1)
kommandoradsflagga och miljövariabel styr samma interna värde ("also sets
this value" / "can also be controlled by"), vilket i praktiken betyder att en
explicit flagga på kommandoraden är den senaste/mest specifika skrivningen
och därmed vinner; (2) `core.worktree` (config-fil) nämns som ytterligare en
väg, lägre i specificitet än kommandorad/miljövariabel. En fullständig,
EXPLICIT precedens-mening ("kommandorad > miljövariabel > config > discovery")
kunde jag INTE hitta ordagrant i denna sida — det är en rimlig SLUTSATS av
formuleringarna ovan, inte ett direkt citat, och jag markerar det som sådant.

### Frågekommandon: `rev-parse`

**Källa:** git-scm.com/docs/git-rev-parse.
**Citat (`--show-toplevel`):** *"Show the (by default, absolute) path of the
top-level directory of the working tree. If there is no working tree, report
an error."*
**Citat (`--git-dir`):** *"Show `$GIT_DIR` if defined. Otherwise show the
path to the .git directory. […] If `$GIT_DIR` is not defined and the current
directory is not detected to lie in a Git repository or work tree print a
message to stderr and exit with nonzero status."*
**Citat (`--absolute-git-dir`):** *"Like `--git-dir`, but its output is
always the canonicalized absolute path."*
**Citat (`--git-common-dir`):** *"Show `$GIT_COMMON_DIR` if defined, else
`$GIT_DIR`."*
**Citat (`--is-inside-work-tree`):** *"When the current working directory is
inside the work tree of the repository print \"true\", otherwise
\"false\"."*

**Skillnaden `--git-dir` vs `--git-common-dir` i en worktree — MÄTT, inte
bara citerat** (git 2.50.1, detta repo, 2026-08-28, körd i worktreen
`/Users/marcus/Repon/miranon-media-admin/.claude/worktrees/agent-a7b3313f50b38e32c`):

```text
--git-dir            → /Users/marcus/Repon/miranon-media-admin/.git/worktrees/agent-a7b3313f50b38e32c
--git-common-dir     → /Users/marcus/Repon/miranon-media-admin/.git
--show-toplevel      → /Users/marcus/Repon/miranon-media-admin/.claude/worktrees/agent-a7b3313f50b38e32c
```

**Slutsats:** i en worktree pekar `--git-dir` på worktreens EGEN privata
undermapp (`<huvud>/.git/worktrees/<namn>`, där HEAD/index för just den
worktreen lever), medan `--git-common-dir` alltid pekar på den DELADE
`.git`-katalogen i huvudkatalogen — oavsett vilken worktree man frågar från.
Detta är exakt vad repots egen `deny-frammande-huvudkatalog.sh` bygger sin
"är jag i huvudkatalogen?"-detektion på: `GIT_DIR == COMMON_DIR` är sant
ENDAST när man kör i huvudträdet, eftersom de bara sammanfaller där. Denna
mätning bekräftar oberoende det påstående skriptets eget filhuvud redan gjorde
2026-08-04 — samma resultat, ny mätning, annan dag.

Git-rev-parse-dokumentationens EGEN formulering ("Show $GIT_COMMON_DIR if
defined, else $GIT_DIR") beskriver INTE explicit worktree-fallet i prosa —
det är den körbara skillnaden (mätningen ovan) som visar det, inte en
dokumenterad mening. Markerat som "mätt, ej ordagrant dokumenterat" per
skillens instruktion att mäta hellre än citera när det går.

---

## Delfråga 3 — Läs/skriv-klassning av git-underkommandon i verktyg (5 exempel)

### 1. OpenAI Codex CLI (`openai/codex`) — flagg-medveten klassning, ARGV, inte sträng

**Källa:** <https://github.com/openai/codex/pull/10258> ("fix: unsafe
auto-approval of git commands") + fil
`codex-rs/core/src/command_safety/is_dangerous_command.rs` (hämtad
live via GitHub API mot commit `18b9e7fd9e3f6670cc4f300338e44050b2c301e4`,
huvudgrenen `main`, 2026-08-28T02:39:47Z).

> **RÄTTAD 2026-08-28** (granskningen av PR #2044, fynd 3): sökvägen angavs
> ursprungligen som `codex-rs/shell-command/src/command_safety/…`, vilket är
> fel crate. Verifierat med `gh api repos/openai/codex/pulls/10258/files`:
> PR:en rör `codex-rs/core/src/command_safety/is_dangerous_command.rs`,
> `codex-rs/core/src/command_safety/is_safe_command.rs` och
> `codex-rs/core/src/exec_policy.rs`. Citaten och slutsatsen nedan är
> oförändrade och korrekta — funktionerna `git_branch_is_delete` och
> `short_flag_group_contains` finns i `core`-crate:n med exakt den semantik
> som beskrivs. Endast crate-namnet i sökvägen var fel.

**PR-beskrivning, citat:** *"Hardens Git command safety to prevent approval
bypasses for destructive or write-capable invocations (branch delete, risky
push forms, output/config-override flags), so these commands no longer
auto-run as 'safe.' - `git branch -d` variants (especially in worktrees / with
global options like -C / -c) - `git show|diff|log --output` ... style
file-write flags - risky Git config override flags (-c, --config-env) that
can trigger external execution - dangerous push forms that weren't fully
caught (`--force*`, `--delete`, `+refspec`, `:refspec`) - grouped short-flag
delete forms (e.g. stacked branch flags containing `d/D`)"*

**Källkod, citat (verifierat på huvudgrenen i dag, inte bara i PR-diffen):**

```rust
/// Returns the dangerous-command rule matched by an already-tokenized command.
pub fn dangerous_command_match(command: &[String]) -> Option<DangerousCommandMatch> {
```

```rust
match cmd0 {
    Some(cmd) if cmd.ends_with("git") => {
        let Some((subcommand_idx, subcommand)) =
            find_git_subcommand(command, &["reset", "rm", "branch", "push", "clean"])
        else {
            return false;
        };
        match subcommand {
            "reset" | "rm" => true,
            "branch" => git_branch_is_delete(&command[subcommand_idx + 1..]),
            "push" => git_push_is_dangerous(&command[subcommand_idx + 1..]),
            "clean" => git_clean_is_force(&command[subcommand_idx + 1..]),
            ...
```

```rust
fn git_branch_is_delete(branch_args: &[String]) -> bool {
    // Git allows stacking short flags (for example, `-dv` or `-vd`). Treat any
    // short-flag group containing `d`/`D` as a delete flag.
    branch_args.iter().map(String::as_str).any(|arg| {
        matches!(arg, "-d" | "-D" | "--delete")
            || arg.starts_with("--delete=")
            || short_flag_group_contains(arg, 'd')
            || short_flag_group_contains(arg, 'D')
    })
}
```

**Slutsats:** Codex CLI klassar EXAKT enligt frågans alternativ (b) —
per underkommando OCH per flagga. `git branch` (utan destruktiva flaggor) är
inte farligt; `git branch -d`/`-D`/`--delete`, ÄVEN hopstaplat (`-dv`, `-vd`,
`-Dvv`) och ÄVEN bakom globala flaggor (`-C .`, `-c color.ui=false`), räknas
som farligt. Avgörande arkitekturdetalj: funktionen tar `command: &[String]`
— en REDAN TOKENISERAD argv-array (från exec-anropet), inte en rå
shell-sträng. Att undvika en shell-parser är alltså delvis en icke-fråga för
exec-fallet: de äger redan de separata argumenten. Skillnaden gäller bara det
sekundära fallet `bash -lc "…"`, där de MÅSTE parsa en inbäddad
skript-sträng — se delfråga 4.

### 2. Gitolite — ACL:er med explicit R/W-alfabet

**Källa:** <https://gitolite.com/gitolite/conf.html>,
<https://gitolite.com/gitolite/conf-2.html> (via websökning, sammanfattat av
sökmotorn med citat-fragment — jag har INTE själv öppnat den fulla sidan
ordagrant, se markering nedan).

**Citat (fragment, återgivet av sökresultatet, inte självverifierat rad för
rad):** *"permissions can be specified as: \"R\" for read only, \"RW\" for
read and commit allowed with rewind not allowed (push --force), \"RW+\" for
full access, \"RWC\" for allowed to create a branch, and \"-\" for write
access denied."* Och: *"The full set of permissions, in regex syntax, is
`-|R|RW+?C?D?M?`."*

**Slutsats:** Gitolite klassar på PROTOKOLL-NIVÅ (push vs. fetch), inte genom
att parsa en godtycklig kommandorad — `R` styr om `git-upload-pack`
(fetch/clone) tillåts för en given ref-pattern, `RW`/`RW+` styr om
`git-receive-pack` (push) tillåts, med finkorniga tillägg för
create/delete/move (C/D/M). Det är en helt annan LAGER-nivå än
Codex/vår-egen-hook: Gitolite behöver aldrig fråga "vilket git-underkommando
körde klienten lokalt?" eftersom SSH-transportens egna serverkommandon
(`git-upload-pack`/`git-receive-pack`) redan ÄR den read/write-gränsen.

**Vad jag inte kunde belägga fullt ut:** jag har inte själv öppnat
gitolite.com/gitolite/conf.html med WebFetch (den gav inget resultat i mitt
sökflöde) — ovanstående citat kommer via sökmotorns egen sammanfattning av
sidan, inte en direkt sidhämtning jag kontrollerat rad för rad. Jag markerar
detta explicit som SVAGARE käll-tillit än de andra i denna lista.

### 3. Gits egen server-sida: `git-shell` + `receive.denyNonFastForwards`

**Källa:** <https://git-scm.com/docs/git-shell>,
<https://git-scm.com/docs/git-receive-pack> (hämtade 2026-08-28).

**Citat (git-shell, COMMANDS):** *"git shell accepts the following commands
after the -c option: git receive-pack `<argument>`, git upload-pack
`<argument>`, git upload-archive `<argument>`. Call the corresponding server-side
command to support the client's git push, git fetch, or git archive --remote
request."*
**Slutsats:** Detta ÄR den kanoniska läs/skriv-gränsen i git självt:
`upload-pack`/`upload-archive` = läsning (fetch/clone/archive),
`receive-pack` = skrivning (push). `git-shell` är den restriktiva inloggnings-
skalet som ENDAST tillåter dessa tre kommandon — grunden som Gitolite och
Gerrit bygger sina finare ACL:er ovanpå.

**Citat (git-receive-pack, om server-side policy):** *"git-receive-pack
honours the receive.denyNonFastForwards config option, which tells it if
updates to a ref should be denied if they are not fast-forwards."*
**Slutsats:** en ytterligare policy-nivå OVANPÅ read/write-gränsen — inte
"är detta en skrivning" utan "vilken SORTS skrivning tillåts" (bara
fast-forward, t.ex.). Jag kunde INTE hämta motsvarande verbatim-text för
`receive.denyDeletes` eller `receive.denyCurrentBranch` (sidan pekade vidare
till git-config-dokumentationen som inte gav ut det avsnittet vid hämtning)
— jag nämner deras EXISTENS (välkänd från git-config-manualsidan) men citerar
dem INTE ordagrant, och markerar det som obelagt i detalj.

### 4. Vårt eget repo — `scripts/deny-frammande-huvudkatalog.sh` (redan byggt, ej externt men verifierat live)

Se § "Vad jag hittade redan i repot" ovan för fullständig beskrivning. Detta
räknas som ett femte, LOKALT konkret exempel: klassning sker per
underkommando via en explicit lista (`KATALOG_GIT_SKRIVKOMMANDON`), med ETT
flagg-medvetet undantag (`git worktree <sub>`, där bara vissa
underkommandon till `worktree` räknas som skrivande) men UTAN flagg-medvetenhet
för `branch` (se § Sidofynd — en skillnad mot Codex CLI:s mer finkorniga
hantering av exakt samma kommando).

### Sidoexempel: `honnibal.dev` — undviker klassning helt via token-scoping

**Källa:** <https://honnibal.dev/blog/locking-down-gh> (hämtad 2026-08-28,
via WebFetch-sammanfattning).
**Sammanfattat innehåll (ej fullt verbatim-citerat av mig, se markering):**
författaren löser samma problem för `gh`/`git` genom att INTE klassificera
kommandon alls — agenten kör med ett finkornigt scopat PAT (`Contents: Read`,
`Metadata: Read`) som teknisk OMÖJLIGGÖR skrivning, plus wrapper-skript
(`ghw`, `gitw`) som kräver ett lösenords-baserat privilegie-lyft för
skrivoperationer. **Slutsats:** ett alternativ till kommandoklassning som är
värt att registrera som sidofynd (se längst ner) — begränsa VAD som är
MÖJLIGT (rättigheter/scope), inte VAD som SKRIVS (textmönster).

**Svar på frågans (a)/(b)/(c):** Sammantaget är svaret **(b) per underkommando
OCH per flagga, där flaggan spelar roll** — men bara i de verktyg som
konkurrerar på PRECISION i klassningsskiktet (Codex CLI). System som i stället
flyttar gränsen till PROTOKOLL-nivå (Gitolite, git-shell) eller
RÄTTIGHETS-nivå (honnibal.dev:s PAT-scoping) slipper flagg-frågan helt genom
att aldrig behöva parsa en lokal kommandorad över huvud taget. Vårt eget repo
ligger i mitten: underkommando-nivå med ETT flagg-undantag (`worktree`), och
en KÄND, ej ännu åtgärdad lucka för `branch` (se Sidofynd).

---

## Delfråga 4 — Är det etablerad praxis att inte parsa godtycklig shell i ett säkerhetslager?

**Källa:** OWASP Cheat Sheet Series,
<https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html>
(hämtad 2026-08-28).

**Citat:** *"The primary defense is to avoid calling OS commands directly.
Built-in library functions are a very good alternative to OS Commands, as
they cannot be manipulated to perform tasks other than those it is intended
to do."*
**Citat (om kommandon specifikt):** *"When it comes to the commands used,
these must be validated against a list of allowed commands."*
**Citat (om argument):** *"Positive or allowlist input validation: Where are
the arguments allowed explicitly defined."*
**Slutsats:** OWASP:s rekommenderade ordning är (1) undvik OS-kommandon helt,
(2) om omöjligt: allowlist av TILLÅTNA KOMMANDON + allowlist-validering av
ARGUMENT — aldrig en blocklista eller ett regex-filter mot fri text. Detta är
PRECIS det mönster `deny-frammande-huvudkatalog.sh` § SCOPE-GRÄNSER redan
själv deklarerar öppet: *"En shell-sträng går inte att tolka exakt utan att
implementera en shell-parser. […] Samma medvetna grovhet som mail-låsets
endpoint-mönster."* — dvs. skriptet vet och skriver ut att dess egen
text-matchning är approximativ, exakt den ärlighet OWASP-mönstret kräver
(fail-closed på det man inte kan avgöra, snarare än att låtsas vara exakt).

**Kompletterande belägg — Codex CLI:s egen ramning av sin shell-parsing:**
källkoden (`dangerous_command_match`, se delfråga 3) parsar visserligen
`bash -lc "…"`-strängar (via `parse_shell_lc_literal_commands`), men gör det
med en ÄKTA parser (inte regex) OCH en hård rekursionsgräns
(`MAX_DANGEROUS_COMMAND_WRAPPER_DEPTH: usize = 8`, sett i källkoden), och
dokumenterar mekanismen som en HEURISTISK varningsnivå: den primära
säkerhetsgränsen i Codex är sandlådan (`sandbox_mode`: read-only /
workspace-write / danger-full-access), inte kommandoklassificeraren.
Källkodskommentar (citat): *"Returns the dangerous-command rule matched by an
already-tokenized command."* — ordet "rule" (inte "guarantee" eller
"boundary") signalerar samma sak som OWASP: detta är ett filter, inte en
garanti. Denna tolkning (att sandlådan är den EGENTLIGA gränsen) bygger jag
själv på källkodens namngivning och Codex-dokumentationens sandbox-modeller
enligt websökningen — jag har INTE hittat en explicit mening i Codex
förstapartsdokumentation som säger "kommandoklassificeraren är bara en
heuristik, sandlådan är den riktiga gränsen" ordagrant. Markerat som
SLUTSATS AV DESIGNEN, inte ett citat.

**Vad jag INTE kunde belägga:** en explicit mening i shellcheck-dokumentationen
som säger "bygg inte en shell-parser med regex" ordagrant. Jag hittade
indirekt stöd (shellcheck är SJÄLVT skrivet som en riktig parser i Haskell,
inte regex — men det är en observation om shellchecks EGEN implementation,
inte ett normativt uttalande i deras dokumentation om VARFÖR andra bör göra
likadant). Jag citerar det INTE som ett verbatim-belägg för principen, bara
som en indirekt, svag indikation.

**Rekommenderat alternativ, sammanfattat ur beläggen ovan:** allowlist av
ENKLA, exakta kommandoformer (t.ex. "detta exakta underkommando + dessa exakt
kända flaggor") plus fail-closed (neka/eskalera) på allt som inte entydigt
matchar — aldrig ett försök att "förstå" en godtycklig shell-sträng fullt ut.
Det är samma princip vår egen hook redan deklarerar öppet, och samma princip
Codex CLI:s designval (djup-begränsad parser + sandlåda som verklig gräns)
uttrycker i kod om än inte i en enda sammanfattande mening.

---

## Dom

Frågans mest avgörande delfråga var **delfråga 1**: om `cwd` i Claude Code-
hookar hade varit en statisk sessions-/projektrot (alternativ b) hade HELA
vårt repos `deny-frammande-huvudkatalog.sh`-mekanism vilat på fel grund — den
förutsätter uttryckligen att `cwd` FÖLJER Claude genom `cd`-kommandon och
worktree-byten. Förstapartsdokumentationen bekräftar detta ORDAGRANT och
UTAN tvetydighet ("cwd follows Claude … the new directory after Claude runs
cd"), vilket betyder att repots befintliga design vilar på en KORREKT läsning
av mekanismen, inte en gissning.

Den näst mest värdefulla slutsatsen är att **läs/skriv-klassning i
branschledande verktyg sker på REDAN TOKENISERAD ARGV och är flagg-medveten
när flaggan ändrar semantiken** (Codex CLI:s `git branch`-exempel är i det
närmaste identiskt med frågans eget exempel) — och att vårt eget repos
`branch`-hantering i dag INTE är flagg-medveten, vilket är en verklig,
disk-verifierad skillnad mot branschens mest precisa exempel (se Sidofynd).

## Vad jag inte kunde belägga

- En sammanhållen, ordagrant citerad precedens-mening i git-scm.com/docs/git
  som rangordnar kommandorad > miljövariabel > config > discovery i EN enda
  sats (slutsatsen är rimlig utifrån flera separata citat, men inte ett eget
  direkt citat).
- Verbatim-text för `receive.denyDeletes` och `receive.denyCurrentBranch`
  (bara deras existens/namn, inte fulltext).
- Gitolite-citaten är återgivna via sökmotorns sammanfattning, inte en egen
  direkt sidhämtning jag kontrollerat rad för rad — svagare källtillit än
  övriga citat i detta dokument.
- GitLens/VS Code källkod: sökningen gav inget användbart konkret fynd. Jag
  drar INGEN slutsats om hur GitLens klassar git-kommandon — frånvaro av
  träff registreras som "ej belagt", inte som "GitLens saknar sådan logik".
  pre-commit-ramverket (pre-commit.com) visade sig vara en ANNAN sorts
  mekanism (kör linters mot stagade filer vid `git commit`) snarare än ett
  exempel på läs/skriv-klassning av godtyckliga git-kommandon — jag har
  därför inte tvingat in det som ett av de tre exemplen.
- GitHub CLI (`gh`) har, såvitt min sökning visar, INGEN inbyggd
  läs/skriv-klassningsmekanism för lokala git-kommandon (den är ett
  API-omslag, inte en git-kommandoklassificerare) — jag hittade ingen
  motsägande källa, men "ingen träff" är inte samma sak som "finns garanterat
  inte".
- En explicit, normativ mening i shellcheck-dokumentationen mot
  regex-baserad shell-parsing (indirekt indikation genom deras egen
  parser-arkitektur, inte ett citat).

## Rekommendation (ej beslut)

**Uppdaterad efter fyndet ovan (§ "AVGÖRANDE UPPTÄCKT"): detta är inte längre
en ny idé att väga — det är en redan öppnad, redan påbörjad fix (`TASK-322`),
och detta forskningspass fungerar som EXTERN, OBEROENDE VALIDERING av samma
riktning.** Innan jag såg kortet härledde jag, enbart ur Codex CLI:s
källkod, att `branch` borde få samma sub-parsing-behandling som `worktree`
redan har (flagg-medveten `-d`/`-D`/`--delete`-detektion, inklusive
hopstaplade korta flaggor, efter underkommandot) i stället för att klassas
som skrivning oavsett flaggor. `TASK-322`:s AC #1–#2 pekar i exakt samma
riktning ("hookens klassning läser MÅLET... inte strängförekomst",
"läskommandon (branch --merged, worktree list, status, log) fälls aldrig").

Kvarstående REKOMMENDATION för Marcus/nästa agent att väga, inte ett beslut
härifrån: när `TASK-322`s fix granskas, jämför den mot Codex CLI:s konkreta
mönster (`git_branch_is_delete`, `short_flag_group_contains`,
`find_git_subcommand` som hoppar över globala flaggor med värde INNAN den
letar efter underkommandot) — det är en produktionsanvänd, testad referens
för exakt samma delproblem, inklusive edge-caset "flaggor hopstaplade som
`-vd`" som är lätt att missa i en första implementation. Kostnaden (ökad
kodkomplexitet i ett redan stort skript, § SCOPE-GRÄNSER-disciplinen om
medveten grovhet) är redan vägd av den agent som öppnade `TASK-322` — det är
inte längre en öppen avvägning för detta pass att introducera.

---

## Källförteckning

- Claude Code hooks-referens: <https://code.claude.com/docs/en/hooks.md>
- Claude Code hooks-guide: <https://code.claude.com/docs/en/hooks-guide.md>
- Git, huvud-manualsidan (OPTIONS, ENVIRONMENT VARIABLES): <https://git-scm.com/docs/git>
- Git rev-parse: <https://git-scm.com/docs/git-rev-parse>
- Git shell: <https://git-scm.com/docs/git-shell>
- Git receive-pack: <https://git-scm.com/docs/git-receive-pack>
- Gitolite conf (del 1): <https://gitolite.com/gitolite/conf.html>
- Gitolite conf (del 2): <https://gitolite.com/gitolite/conf-2.html>
- OpenAI Codex CLI, PR #10258: <https://github.com/openai/codex/pull/10258>
- OpenAI Codex CLI, källkod (huvudgren, commit `18b9e7fd9e3f6670cc4f300338e44050b2c301e4`):
  `codex-rs/core/src/command_safety/is_dangerous_command.rs`,
  `codex-rs/core/src/exec_policy.rs`
- OWASP OS Command Injection Defense Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html>
- honnibal.dev, "Restricting Coding Agents' CLI GitHub Write Access": <https://honnibal.dev/blog/locking-down-gh>
- Lokalt: `scripts/deny-frammande-huvudkatalog.sh`, `.katalogagarskap-policy.conf`,
  `docs/decisions/ADR-090-sessions-parallellitet-detektera-och-fraga.md`
