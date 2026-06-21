---
owner: marcus803
updated: 2026-06-21
review_by: 2026-09-21
status: stable
---

# Systemet — så funkar och sitter Chat/Code/Marcus-samarbetet ihop

> **Vad detta dok är:** en navigerbar karta över det körande **samarbets-systemet** —
> meta-systemet som Miranon Media Admin byggs *med*, inte appen själv. Tre aktörer
> (Claude Chat, Claude Code, Marcus), två git-träd (hub + spoke), disciplin-skills,
> governing- och distributions-mekanik. Läs uppifrån och ner och du ska förstå exakt
> hur delarna hänger ihop — och kunna gå till källan (`fil:rad`) och verifiera varje
> påstående själv.
>
> **Vem det är för:** vem som helst. Främlingstestet gäller — en läsare utan
> förkunskap ska kunna följa kedjan och kontrollera den mot disk.
>
> **Vad detta dok INTE är:** det är inte [`hur-systemet-funkar.md`](hur-systemet-funkar.md)
> (som beskriver Miranon-appens DOMÄN/affärslogik — event, anmälningar, personer), och
> det är inte identitets-/aspirations-registret (IDENTITET.md/profile.md — VARFÖR/för vem;
> se §2). Detta dok beskriver det OPERATIVA systemet: HUR arbetet körs.
>
> **Färskhets-kontrakt (läs detta först — det gäller hela doket).**
>
> Varje påstående bär en av två inline-markörer, så du vet vad du kan lita på och vad
> du måste verifiera live:
>
> - **[STABIL MEKANIK]** — dokumenterbart sann; strukturen/mekaniken ändras sällan.
>   *Exempel:* "governing-listan är config-driven." Lita på den.
> - **[AKTUELLT TILLSTÅND → via Code]** — HEAD, CI-utfall, exakta listinnehåll, exakta
>   radnummer. ALDRIG fryst som evig sanning. *Exempel:* "listan innehåller 11 docs"
>   var sant vid kartläggning **2026-06-21** — verifiera via Code innan du litar på siffran.
>
> **Radnummer i detta dok är korrekta vid 2026-06-21.** De är tillstånd, inte mekanik:
> verifiera via Code om de rört sig. Att fil X bär mekanism Y är stabilt; att Y står på
> rad N är inte. Ett orkestrerings-dok utan självmedvetenhet om sin färskhetsgräns blir
> självt en stale-fälla — därför bär detta dok kontraktet från frontmatter och ner.

---

## §1 — Översikt: ett system, tre aktörer

Systemet finns för att lösa ett enda problem: **låta EN person bygga det som annars
kräver ett helt team — utan att tappa kontext, kvalitet eller riktning**
(`IDENTITET.md:17` §1, definitionen). Lösningen är
en arbetsdelning mellan tre aktörer med var sin styrka:

- **Claude Chat** — designar och dirigerar: arkitektur, prompt-design, lessons-skörd.
- **Claude Code** — utför mot disk: läser, kör, committar, rapporterar.
- **Marcus** — beslutar, pushback:ar, prioriterar; äger riktning.

**Det finns ingen direktkanal mellan Chat och Code.** All kommunikation går via Marcus
(klient-arkitektur — Chat och Code "ser" aldrig varandra direkt; Marcus förmedlar).
[STABIL MEKANIK — `hub-CLAUDE.md:45` `## Roll-arkitektur`,
etablerad Session 9.]

Den till synes godtyckliga rollfördelningen är i själva verket en **upptäckt om var fel
fångas**. Empiriskt (mätt över systemets sessioner) fångas designfel så här: Chat-self-review
**~9 %**, Code:s transparens-rapport **~64 %**, Marcus pushback **~27 %**
[STABIL MEKANIK — `hub-CLAUDE.md:49`]. Det är dokets
poäng, så den sätts tidigt: **varje aktör gör det den mätbart är bäst på.** Chat är svag
på att granska sig själv, så systemet förlitar sig inte på det — det bygger i stället
synliga verifikationssteg som Code och Marcus *kan* fånga fel genom. "Sömlöst flöde" betyder
inte friktionsfritt; det betyder att ingen aktör låtsas vara en annan.

Principen bor i konstitutionen (`hub-CLAUDE.md:45`);
Code-rollens konkreta HUR bor i
`templates/code-role-discipline.md`.

---

## §2 — De två registren

Kartläggningens centrala insikt: systemet har **två register**, och det här doket
dokumenterar bara det ena.

**(a) Operativt register — HUR systemet körs.** Hub-konstitutionen (`hub-CLAUDE.md`),
de fem plugin-disciplin-skillsen (§5), de fyra in-drift-templatesen (§4) och
governing-mekaniken (§8). **Detta dok dokumenterar (a).**

**(b) Identitets-/aspirations-register — VARFÖR och för vem.** Två hub-dok:

- `IDENTITET.md` — *"MarcusOS — Identitet"*, self-märkt
  **v0.2** (`IDENTITET.md:5`). Bär North Star
  ("Passionslyftet"), tre motorer (bygg/kunskap/produkt), Fem Kvaliteter, och avslutas med
  **fyra öppna frågor till Marcus** (`IDENTITET.md:298`)
  — alltså delvis **aspirerat**, inte färdigt.
- `profile.md` — Marcus personliga profilkarta
  (drivkrafter, kompetensmatris, projektportfölj), en **feb-2026-ögonblicksbild**.

[AKTUELLT TILLSTÅND → via Code: vid 2026-06-21 är (b) delvis aspirerat/under uppbyggnad — t.ex.
beskriver IDENTITET.md §3.2 "Kunskapsmotorn" som *"under uppbyggnad"*. Verifiera mot disk.]
Register (b) **styr inte** den operativa mekaniken — det är systemets VARFÖR, inte dess HUR.
Detta dok pekar dit men fryser eller duplicerar det inte.

---

## §3 — Hur hub och spoke sitter ihop

Systemet lever i **två git-träd**: hubben (`~/Repon/marcus-system/`, universella principer +
mallar + skills) och spoken (`~/Repon/miranon-media-admin/`, detta projekt). Hubben
instantieras i en Code-session via **tre kanaler**, var och en disk-belagd:

1. **Code-sidans konstitution = symlänk.** `~/.claude/CLAUDE.md → ~/Repon/marcus-system/CLAUDE.md`
   (`ls -la ~/.claude/CLAUDE.md`). Hub-konstitutionen läses därför globalt vid varje
   Code-session; spokens egen [`CLAUDE.md`](../../CLAUDE.md) läses som projektlager ovanpå.
   [STABIL MEKANIK.]
2. **Code-sidans disciplin-skills = user-scope plugin.** Pluginet `marcus-system@marcus-hub`
   aktiveras via user-scope install-record, inte via spoke-config
   ([`spoke-CLAUDE.md:165-175`](../../CLAUDE.md) `## Operativ procedur`;
   [ADR-035](../decisions/ADR-035-plugin-aktivering-user-scope.md)). [STABIL MEKANIK; detaljer §9.]
3. **Chat-sidans Project Instructions = bas + delta.** Den slutliga claude.ai-PI:n monteras som
   hub-basen (`templates/project-instructions-base.md`)
   klistrad FÖRST, följt av spokens egen delta-fil
   ([`project-instructions/miranon-media-admin.md:3`](../../project-instructions/miranon-media-admin.md)).
   [STABIL MEKANIK.]

**Slutsats: det är EN konstitution i TVÅ lager (hub-bas + spoke-delta), inte två parallella.**
Spoken deklarerar själv att den är ett delta: *"Konstitutionen ovan slår fast PROJEKT-SPECIFIKA
regler; generella sessions-HUR-steg bor i pluginet"*
([`spoke-CLAUDE.md:174-175`](../../CLAUDE.md)). **Repot är enda sanningskällan** — ändra i
källfilen och klistra om, aldrig bara i claude.ai-rutan. Länken mellan Code och Chat är
GitHub-repot: Code pushar → Marcus klickar "Update" i claude.ai → båda ytor delar kontext.
[STABIL MEKANIK — principen lever; käll-formulering `ARKITEKTUR.md:27`.]

---

## §4 — Rollerna i detalj

**Claude Code — utför mot disk.** Code följer en fast operativ loop:
**LÄS → RAPPORTERA → PLANERA → IMPLEMENTERA → VERIFIERA**, fem checkpunkter
[STABIL MEKANIK — `code-role-discipline.md` §1]:
läs mot disk ej minne (§1.1); RAPPORTERA är en egen fas före plan (§1.2); **planera mot rapporten,
inte mot prompten** — vid divergens styr rationale, inte bokstaven (§1.3); IMPLEMENTERA atomiskt
med path-scopad `git add`, aldrig `-A`, hub och spoke i skilda commits (§1.4); VERIFIERA mot
faktiskt CI-utfall, inte antaget grönt (§1.5). Vid tvetydighet är defaulten **STOPPA-OCH-FRÅGA**
— vid arkitektur/scope-beslut, onåbart grind-mål, divergens prompt-vs-disk, oväntat disk-tillstånd
eller irreversibla steg eskalerar Code, utför inte (§3). Code:s transparens-rapport (numrerade block,
faktiska värden, `AVVIKELSE:`-flaggor) är ~64 %-fångstmekanismen (§2). Code tar **aldrig**
arkitektur- eller scope-beslut själv (§5).

**Claude Chat — designar och dirigerar.** Chat strukturerar sina svar i en **4-zoners disciplin**:
`FÖR DIG (Marcus)` / `TILL CODE (ett kodblock)` / `ARTEFAKT` / `VÄNTELÄGE`
[STABIL MEKANIK — `project-instructions-base.md`
`## CHAT-OUTPUT`]. Chat utför **ingen** fil-operation, git eller repo-skrivning — det hör Code till.
Kontraktet för riktningen Chat→Code har åtta obligatoriska delar (huvud/scope, LÄS-grind, nåbart mål,
käll-vägledning, gränser, verifiering, STOPPA-villkor, rapport-krav)
[`chat-code-handoff-contract.md`].

**Marcus — beslut, pushback, prioritering.** Marcus kvitterar STOPPA-grindar, fångar Chat-glidning
(~27 %), prioriterar mellan vägar och äger riktning. Marcus är **klient-kanalen** mellan Chat och Code
(de har ingen direktkanal) — men inte en transparent kanal: han läser och kan stoppa när som helst.
Marcus är **inte** review-loop för triviala detaljer — en fråga vars svar data kunde avgjort är
själva defekten. [STABIL MEKANIK — `hub-CLAUDE.md:45`.]

---

## §5 — Disciplin-skillsen (de fem)

Operativa rutiner levereras som **plugin-skills** som triggas automatiskt via sin `description`
[STABIL MEKANIK — `hub-CLAUDE.md:125` `## Operativ procedur`].
De fem (`plugins/marcus-system/skills/`):

| Skill | Gör | Nyckel-mekanik | Chat-halva? |
|---|---|---|---|
| **session-start** | Orientera + RAPPORTERA repo-state före arbete | Läs-ordning hub→spoke→lessons; skapande-gren → `create-session-doc` (13 steg) | **Ja** |
| **session-end** | Do-confirm av Chat-dirigerat avslut (ADR-041, Lager 3) | 11-posters do-confirm, killers #4 BUILD-LOG + #11 Marcus-Update; rapport TÄCKT/EJ TILLÄMPLIGT/SAKNAS | **Ja** |
| **phase-end-verify** | Stäng en BYGGFAS (ej en session) | Kör `phase-end-verify.sh <N> <datum>` → cross-doc-grep 5 styrande + 3 publika docs | **Nej (Code-only)** |
| **lessons-hub-sync** | Skörda lessons + lyfta `[UNIVERSAL]` till hub | Spegla UNIVERSAL-poster till hub `tasks/lessons.md` + cross-repo-commit | **Nej (Code-only)** |
| **arch-audit** | Arkitektur-fitness-betyg mot fast kontrakt (ADR-058) | Mekaniska checkar i–iii via script + omdömes-områden iv–v; **fixar aldrig kod** | **Ja** |

Källa: respektive `SKILL.md` i katalogen ovan. [AKTUELLT TILLSTÅND → via Code: att det är exakt
dessa fem verifieras med `ls` av skills-katalogen; vid 2026-06-21 var de fem.]

**Code↔Chat-halv-asymmetrin** (en lucka detta dok fyller — ingen yta korsade detta tidigare).
Varje skill kan ha en Code-halva (plugin) och/eller en Chat-halva
(`claude-app-skills/`, uppladdad till claude.ai):
[STABIL MEKANIK — verifierat mot båda kataloger.]

- **Delade** (båda ytor): `session-start`, `session-end`, `arch-audit`.
- **Code-only** (ingen Chat-halva): `lessons-hub-sync`, `phase-end-verify` — rent
  disk-/git-arbete Chat inte utför.
- **Chat-only** (ingen Code-plugin-motpart): `session-paus` + `session-resume` —
  skriv/läs-kontinuitetsparet ([ADR-051](../decisions/ADR-051-session-paus-lifecycle-verb.md));
  Code behöver dem inte (resume *lokaliserar* befintligt sessionsdok, skapar inget).

---

## §6 — Kapabilitets-skillsen (den andra familjen)

Det finns en **andra skill-familj**, och att hålla isär den från §5 är en distinktion ingen
yta gjorde tidigare:

- **Disciplin-skills (§5)** — *processen*: hur sessioner körs. Bor i plugin.
- **Kapabilitets-skills (§6)** — *förmågor*: vad Chat/Code kan göra. Bor i
  `~/.claude/skills/` (symlänkade), inventerade i
  `SKILLS-INVENTORY.md`.

[AKTUELLT TILLSTÅND → via Code: vid 2026-06-21 listar inventariet bl.a. `web-research`,
`yt-research`, `notebooklm`, `guide-builder`, `ui-ux-pro-max`, `motion`, `grill-me`,
`write-a-prd`, `prd-to-issues`, `tdd`, `improve-codebase-architecture`, `prompt-patterns`
m.fl. Verifiera live — `SKILLS-INVENTORY.md` är dessutom stale på granularitet: det korsar
INTE de fem disciplin-skillsen (§5), så de två familjerna måste hållas isär av läsaren, inte
av inventariet.]

---

## §7 — Session-lifecyclen

En **session** är en logisk arbetsenhet; den styrs av fyra verb [STABIL MEKANIK]:

- **`/session-start`** + **`/session-end`** = ny-session-paret (öppna / stänga).
- **`/session-paus`** + **`/session-resume`** = kontinuitetsparet (skriv / läs) — parkera en
  oavslutad session durabelt, och rekonstruera mitt-i-läget senare
  ([ADR-051](../decisions/ADR-051-session-paus-lifecycle-verb.md)).

De fyra verben sätter sessionsdokets **`lifecycle:`-fält** (`active` vid start/resume, `paused`
vid paus, `closed` vid end) — en O(1)-läsbar tillstånds-axel, ortogonal mot `status:`
(dokumentkvalitet) [STABIL MEKANIK — [ADR-052](../decisions/ADR-052-lifecycle-frontmatter-falt.md)].

Tvärs sessioner löper **trådar**: en tråd är en kausal arbetsenhet (en feature, en utredning, ett
oväntat fynd) som spänner en eller flera sessioner. Sessionen är behållaren; tråden är tidslinjen
tvärs behållare. Trådar registreras i [`tasks/threads/README.md`](../../tasks/threads/README.md)
och commits taggas `[T<NN>]` så historiken blir git-härledbar
[STABIL MEKANIK — [ADR-053](../decisions/ADR-053-trad-arkitektur-forensisk-lasbarhet-triage.md)].

---

## §8 — Governing-mekaniken

Hur kvalitet enforce:as mot disk, i tre lager:

**Frontmatter-policy.** [`.frontmatter-policy.conf`](../../.frontmatter-policy.conf) är en
**bash-config** som `source`:as av `scripts/check-frontmatter.sh` och av pre-commit-hooken.
Den bär listan `FRONTMATTER_GOVERNING_DOCS`, owner/status-enum och `FRONTMATTER_MIN_HISTORY_DEPTH=0`
(full clone sedan [ADR-054](../decisions/ADR-054-fetch-depth-full-historik.md)). Logiken är universell
(kan dupliceras till andra spokes), värdena är per-projekt. [STABIL MEKANIK — config-driven.]
[AKTUELLT TILLSTÅND → via Code: vid 2026-06-21 innehöll listan **11 exakt-path docs** (bl.a. de tre
reference-doken + denna kandidat ännu EJ inlagd — wiring sker senare). Verifiera listan live.]

**Pre-commit-hook.** [`.githooks/pre-commit`](../../.githooks/pre-commit) auto-bumpar `updated:`
till dagens datum för staged docs som **exakt-path-matchar** governing-listan: `set -euo pipefail`,
`source` av config:en, GNU/BSD-sed-detection, NUL-terminerad UTF-8-safe iteration över staged
ACM-filer, idempotent skip om värdet redan är dagens, in-place bump + re-stage. Aktiveras via
`git config core.hooksPath .githooks`; kan kringgås med `git commit --no-verify`.
[STABIL MEKANIK — [ADR-030](../decisions/ADR-030-docs-grindvakter-frontmatter-policy.md).]
**Konsekvens:** sessionsdok och `tasks/threads/README.md` står INTE i listan → deras `updated:`
auto-bumpas aldrig av hooken (de sätts manuellt; spårat av tråd T20).

**CI** ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), tre jobb)
[STABIL MEKANIK — struktur; AKTUELLT TILLSTÅND → via Code för exakt jobb-/steg-lista]:
`changed` (detektera ändrade filer) → `lint` (Lint + Audit + TypeCheck — bär grind-suiterna:
audit-ci, Biome, `tsc`, actionlint, yamllint, frontmatter-validering, lifecycle-fält
([ADR-052](../decisions/ADR-052-lifecycle-frontmatter-falt.md)), ADR-count + fetch-depth-invariant
([ADR-039](../decisions/ADR-039-konsistens-grindar-kadens.md)), consistency-truth-table, gatekeeper-suiter,
prod-deploy-allowlist, shellcheck-strict) → `test` (Test + Build; docs-only-ändring → skippas
by-design) + en composite "CI Passed or Skipped".

**Governing vs ej:** governing = de exakt-path docs i `.conf` (auto-stämplade + CI-validerade).
Ej governing = sessionsdok, `tasks/threads/`, BUILD-LOG, todo.

---

## §9 — Distributions-mekaniken

Hur en ändring i hubben NÅR de två ytorna:

- **Code-ytan: via plugin-cache.** Marketplace = hub-repot självt
  (`.claude-plugin/marketplace.json` →
  GitHub `marcus803/marcus-system`). Plugin-versionen står i
  `plugins/marcus-system/.claude-plugin/plugin.json`;
  den installerade kopian lever i cache (`~/.claude/plugins/cache/marcus-hub/marcus-system/<version>/`).
  Aktivering: user-scope install-record (`~/.claude/plugins/installed_plugins.json`, primär,
  [ADR-035](../decisions/ADR-035-plugin-aktivering-user-scope.md)) + spoke
  [`.claude/settings.json`](../../.claude/settings.json) (`enabledPlugins`, sekundär). [STABIL MEKANIK.]
  [AKTUELLT TILLSTÅND → via Code: vid 2026-06-21 var plugin-versionen **1.4.0**.]
- **Chat-ytan: via separat uppladdning.** Chat-halvorna i
  `claude-app-skills/` laddas upp manuellt till claude.ai
  — de distribueras INTE av plugin-cachen. [STABIL MEKANIK.]
- **Version-bump → ominstallation:** mekaniken är att bumpa `plugin.json`-versionen, varpå plugin-CLI:t
  re-fetchar från marketplace-repot [HÄRLEDD MEKANIK — ej disk-dokumenterad].
  ⚠️ **Ärlig lucka [AKTUELLT TILLSTÅND]:** det EXAKTA reinstall-kommandot är **inte** dokumenterat på
  disk (`grep` i ADR-035 ger noll träff); [`spoke-CLAUDE.md:174`](../../CLAUDE.md) noterar bara att
  scope-migrering inte går via plugin-CLI:t (Anthropic-issue #38271). En källedit i hubben propagerar
  alltså INTE förrän version-bump + ominstallation körs. **Denna lucka bärs av tråd T18 — gå dit, gissa
  inte kommandot som om det vore verifierat.**

---

## §10 — Appendix: slå-upp-karta + kända inkonsekvenser

### (a) Var bor vad (snabbslagning — evidensen själv lever inline i §1–§9)

| System-del | Bor i (fil) | Markör |
|---|---|---|
| Roll-arkitektur (princip) | `marcus-system/CLAUDE.md` `## Roll-arkitektur` | [STABIL MEKANIK] |
| Code-rollens HUR (loop, STOPPA, rapport) | `templates/code-role-discipline.md` | [STABIL MEKANIK] |
| Chat-rollens HUR (4-zoner, grundregler) | `templates/project-instructions-base.md` | [STABIL MEKANIK] |
| Kontraktet Chat→Code (8 delar) | `templates/chat-code-handoff-contract.md` | [STABIL MEKANIK] |
| Chat-prompt-design-checklist | `templates/chat-prompt-design-checklist.md` | [STABIL MEKANIK] |
| Disciplin-skills (5) | `plugins/marcus-system/skills/*/SKILL.md` | [STABIL MEKANIK] / antal: [TILLSTÅND] |
| Chat-halvorna | `marcus-system/claude-app-skills/` | [STABIL MEKANIK] |
| Kapabilitets-skills (inventarium) | `marcus-system/SKILLS-INVENTORY.md` | [AKTUELLT TILLSTÅND] |
| Lifecycle + trådar | ADR-051/052/053 + `tasks/threads/README.md` | [STABIL MEKANIK] |
| Governing-lista | `.frontmatter-policy.conf` | mekanik [STABIL] / innehåll [TILLSTÅND] |
| Auto-bump-hook | `.githooks/pre-commit` | [STABIL MEKANIK] |
| CI | `ci.yml` (i `.github/workflows/`) | struktur [STABIL] / jobb-detalj [TILLSTÅND] |
| Plugin-distribution | `.claude-plugin/marketplace.json` + `plugin.json` + ADR-035 | mekanik [STABIL] / version [TILLSTÅND] |
| Identitets-/aspirations-registret | `IDENTITET.md` + `profile.md` | [AKTUELLT TILLSTÅND — delvis aspirerat] |

### (b) Kända inkonsekvenser (det doket ärligt INTE löser)

Detta dok beskriver det körande systemet; några hub-ytor har drift som inte hör hit att laga:

- Hub-konstitutionens pekare till `ARKITEKTUR.md` och
  `SKILLS-INVENTORY.md` pekar på **stale granularitet**
  (ARKITEKTUR.md:s fil-träd nämner inte plugin-lagret; SKILLS-INVENTORY korsar inte disciplin-skillsen).
- `chat-prompt-design-checklist.md`
  bär intern terminologi-drift (header self-märkt *"draft-stub"* men versionerad v1.0; refererar det
  gamla `L_AAA`-lesson-schemat, inte dagens L-nummer).
- Möjlig supersession av hub-dok utanför kärnan (t.ex. `WORKFLOW.md`) — drift-grep 2026-06-21 fann dem
  EJ refererade av någon kärnyta.

**Alla dessa hör till hub-dokumentations-reconciliationstråden (T22) — inte till detta dok.** Att doket
namnger sina egna gränser är vad som gör det ärligt.

---

*Slut. Detta dok är självverifierande: gå till varje `fil:rad` och kontrollera påståendet. Mekanik är
stabil; tillstånd och radnummer verifieras via Code. Faller ett påstående — riv det öppet med kvittens.*
