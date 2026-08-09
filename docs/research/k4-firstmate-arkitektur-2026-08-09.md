---
owner: marcus803
updated: 2026-08-09
review_by: 2027-02-09
status: draft
---

# K4-underlag: FirstMate-arkitekturen — studie inför exekverings-hubbens grillning

> **Proveniens:** delegerat research-pass (S101, 2026-08-09), read-only
> mot `github.com/kunchenguid/firstmate` (3 069 ★ vid läsning, MIT,
> Shell, 719 öppna issues) via `gh api` + raw-läsning av README, VISION,
> AGENTS.md, docs/, skills och utvalda bin-lib. Beställning och
> kandidat-kontext: [`l8-workflow-kartlaggningen-2026-08-09.md`](l8-workflow-kartlaggningen-2026-08-09.md)
> § Fas D K4 + § Addendum AD.3. Rapporten skiljer strikt "repot säger"
> (citat med källa) från markerad tolkning; luckor är flaggade, inte
> antagna.

## 1. Vad FirstMate ÄR tekniskt

Repot säger (README): *"Not a model, harness, skill, MCP server, or
CLI. It is an agent distro for running a crew of agents"* —
*"no app to install: the cloned repo is the distro."* En generell
agent-harness (Claude Code, Pi, Codex, OpenCode, Grok) startas INNE i
repo-katalogen; bindningen är trelagrad:

1. **`AGENTS.md`** (CLAUDE.md är symlänk): *"You are the first mate.
   The user is the captain. This file is your entire job description."*
   Harnessets egen minnesfils-laddning ÄR hela bindningsytan.
2. **`.agents/skills/*/SKILL.md`** — interna skills, villkorligt laddade
   via routing-index i AGENTS.md.
3. **`bin/fm-*.sh`** (~180 skript). Designprincip (VISION.md): *"Logic
   that can be exact lives in deterministic scripts; work that requires
   understanding lives in an agent."*

Tolkning: strukturellt samma familj som vår plugin-skills +
CLAUDE.md-hierarki + skript-konvention — men orkestrerings-logiken är
skalskript i stället för harness-primitiver, för harness-agnostikens
skull.

## 2. Sessions-backends

Fem backends: tmux (referens-default), herdr, zellij, cmux, Orca
(övriga "experimental"; Orca hanterar egna worktrees, resten får dem ur
**Treehouse**-poolen). Val-ordning: `--backend`-flagga → `FM_BACKEND` →
gitignorad `config/backend` → auto-detektion → tmux.
**Flaggad lucka:** adapter-skripten (`bin/backends/*.sh`) är INTE lästa
rakt av — backend-kontraktet (endpoint, textmottag, busy/idle/dead-
verdict, stängning) är rimlig slutsats ur docs-lagret, inte källbelagd.

## 3. Crewmate-livscykeln

- **Spawn:** `fm-spawn.sh` *"refuses to launch unless the resolved task
  path is a real git worktree root that is distinct from the project
  primary checkout"* — hård regel. State-filer per uppdrag:
  `state/<id>.meta` (backend, incarnation-token, PR-refs),
  `state/<id>.status` (append-only händelselogg), `.no-mistakes/`-
  evidensmapp.
- **TVÅ skilda köer:** `state/.wake-queue` (intern övervaknings-kö;
  zero-token bash-watcher skriver actionable wakes durabelt FÖRE
  detektor-state avancerar; dräneras vid varje first-mate-turstart) ·
  `state/public-followup/{events,consumed,rejected}/` (externa
  åtaganden, idempotens via hash av identitetstupel som EXKLUDERAR
  utfallstexten: *"rewording the same landed outcome must not create a
  second event"*). Att blanda ihop dem vore designfel.
- **Kritiskt fynd (Issue #27, maintainer):** *"A shell process can
  detect events and queue them, but it cannot start a new agent
  inference turn — only the harness can."* Tre harness-vägar listas;
  Claude Code pekas ut som harness där bakgrunds-completion redan ger
  *"walk-away"*.
- **Styrning i två plan:** data-planet `fm-send.sh` (text agenten
  läser) · kontroll-planet `fm-control.sh` (allowlistat
  interrupt/exit/transaktionell relaunch mot exakt task-id). Mänsklig
  terminal-attach möjlig.
- **Teardown:** *"fail-closed for ship worktrees: dirty worktrees
  refuse, and committed work must be landed before the worktree is
  returned"* — rent träd → landat bevis → stäng endpoint → radera
  state → returnera worktree till poolen. **Flaggad lucka:** om
  teardown auto-triggas vid detekterad merge eller kräver explicit
  kommando är inte bekräftat mot `fm-teardown.sh`.

## 4. Projekt-register och lägen

`data/projects.md` + tre leveranslägen per projekt: **no-mistakes**
(full pipeline, väntar merge-authority) · **direct-PR** ·
**local-only** (aldrig routad till secondmate). `+yolo`-flagga ger
autonomi *"only within the captain's original request"* — destruktivt
kräver ändå captain. `.no-mistakes.yaml` bär gate-konfig med
`disable_project_settings: true` (komprometterad branch kan inte tampra
gate-identiteten). **Flaggad lucka:** registrerings-CLI/flöde ej läst
(`project-management`-skillen).

## 5. Tillståndspersistens (kompakterings-överlevnad)

VISION.md: *"Everything that matters survives the death of any
conversation: work in flight, promises made, decisions pending."*
Explicit taxonomi: `data/` (durabelt: projects, secondmates, captain,
learnings, charter) · `state/` (flyktigt) · `config/` (gitignorat
lokalt) · `projects/` (klonar).

## 6. Multi-projekt: träd av orkestrerare, inte flat loop

En **secondmate** kan äga en hel domän persistent med EGEN `FM_HOME`,
egen backlog, egna crewmates: *"The primary still owns routing and
supervision, while the remote home owns its own projects, backlog, and
workers."* Skalning via delegering till sub-orkestrerare — inte en
supervisor som loopar över alla projekt.

## 7. Säkerhetsmodellen

Hårda regler i prioritetsordning (AGENTS.md): aldrig skriva till
projekt utom vaktade undantag · *"Never merge a PR without explicit
captain word"* · aldrig riva olandat arbete · *"Crewmates never address
the captain"* (allt via first mate) · *"Report outcomes faithfully."*
**Riskflagga:** Issue #1426 "Dangerous Hard-Coded Permissions
Overrides" (stängd, EJ läst i detalj) — läs innan någon
yolo-/autonomiflagga övervägs i vår design.

## 8. Mappning mot våra primitiver

**Direkt översättningsbart / redan täckt:**

- Två-plans-modellen ≈ `SendMessage` (data) vs `TaskStop` (kontroll).
- Worktree-pooling ≈ vår `.claude/worktrees`-mekanik; FirstMates
  spawn-vägran utanför distinkt worktree-rot är ett designkrav värt att
  adoptera rakt av.
- Fail-closed teardown gated på landat bevis ≈ vår
  merge-kö-disciplin (ADR-076/097) — oberoende korroboration.
- Config-drivna per-projekt-lägen ≈ vår grindvakts-konfig-konvention.

**Vad vårt harness redan löser BÄTTRE (källbelagt via Issue #27):**
turn-injection. FirstMate-communityn byggde wake-daemon-simuleringar
med `tmux send-keys` för att en shell-process inte kan starta
agent-turer; Claude Codes bakgrunds-notifieringar + Monitor ÄR den
mekanism de saknade. **Designslutsats: bygg ingen egen
wake-queue-daemon — verifiera harnessets notifiering som väckare och
lägg bara en tunn mitt-i-tur-buffert ovanpå.** Likaså slipper
`SendMessage` hela FirstMates pty-injektions-skörhet
(popup-race-hantering per harness).

**Vad som MÅSTE verifieras empiriskt före designbeslut (flaggat, ej
påstått):**

1. Överlever `SendMessage`-adresserbar agent-identitet en HÅRD
   process-omstart (inte bara kompaktering)? FirstMates motsvarighet är
   markörfil + register-rad; vår motsvarighet är obekräftad.
2. Realtids-attach till levande agent-session (rå terminal-vy) — finns
   ingen verifierad motsvarighet; avvägning strukturerat-men-mindre-
   levande vs rå-pty-men-skört.
3. Public-followup-könens idempotens-mönster (hash exkluderar
   utfallstext) — värt att kopiera rakt av OM hubben ska leverera till
   externa kanaler; vi har inget byggt för exakt-en-gång dit.

## Ej läst (öppna luckor)

`bin/backends/*.sh` · `fm-spawn.sh`/`fm-teardown.sh` källkod ·
`project-management`-skillen · Issue #1426 fulltext · Issue #1012
(outcome-aware dispatch).

## Grillnings-frågorna detta underlag öppnar

1. Är vår exekverings-hubb en EGEN alltid-på-session (FirstMate-form)
   eller en återkommande väckt orkestrerare (cron/Monitor-form) — och
   vad säger persistens-verifikatet (punkt 8.1) om vad som ens går?
2. Träd av orkestrerare (secondmate-mönstret) eller flat
   multi-projekt-loop — var går vår skalningsgräns?
3. Vilka av FirstMates hårda regler adopteras verbatim (spawn-vägran,
   fail-closed teardown, crewmates-talar-aldrig-med-kaptenen) och vilka
   ersätts av våra befintliga (ägarlapp ADR-090, väntekontrakt
   ADR-096)?
4. Var går autonomigränsen — FirstMates `+yolo` kontra vår
   STOPPA-OCH-FRÅGA-konstitution?
