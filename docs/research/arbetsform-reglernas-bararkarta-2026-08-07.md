---
owner: marcus803
updated: 2026-08-07
review_by: 2027-02-07
status: stable
---

# Arbetsform-reglernas bärarkarta (Code, 2026-08-07)

> **Proveniens:** `TASK-149.6` ("Skiva: inventeringen — arbetsform-reglernas
> bärarkarta"), barn-kort till `TASK-149` (PRD: Arbetsformens leveransväg —
> kadens och regler som når varje utförare). Uppdraget: inventera SAMTLIGA
> arbetsform-regler i spoke + hubbens disciplin-skills, klassa varje regels
> bärare, och minta ett fynd-kort per startdörrs-bunden regel med drift-risk.
>
> **Vad passet gjorde:** läste `CLAUDE.md` (654 rader), `CONTRIBUTING.md`
> (1153 rader), `.claude/agents/bygg-agent.md` (224 rader),
> `.claude/agents/research-pass.md` (156 rader), samtliga tio namngivna
> hub-skills i AKTIV pluginversion `1.29.0`
> (`session-start`/`session-paus`/`session-resume`/`session-end`,
> `do-work`, `work-batch`, `prototype`, `grilling`, `to-prd`, `to-issues`)
> och `output-styles/code-rollen.md` i samma plugin — i sin helhet, rad för
> rad, inte genom sökning. 129 distinkta arbetsform-regler identifierade och
> klassade.
>
> **Vad passet INTE gjorde:** fixade ingenting. Tre nya fynd-kort mintade
> för regler med bevisad drift-risk (§ 4); prototype-skillens redan kända
> § 5-fall (T126) bokförs som referenspunkt, inget dubblettkort.

---

## Kort svar

132 arbetsform-regler identifierade över 15 källfiler (129 vid första
läsningen + 3 nya som landade i `bygg-agent.md`/`CLAUDE.md` UNDER passet,
se § 0). Fördelning per bärarklass (§ 3 för metod): **alltid-laddad 24** ·
**agent-fil-buren 26** (utökning av de fyra namngivna klasserna, se § 1) ·
**mekanisk 5** · **startdörrs-bunden 76** · **saknar bärare 1** (känt,
hemvist redan `TASK-149.5`). Tre NYA drift-risker mintade som fynd-kort
(§ 4):
modell/effort-routing-tabellen och parallellitets-detektionens signal 2–4 är
pointer-refererade i stället för inlinade i `session-resume` — exakt det
mönster som orsakade T126, fast ännu ofixat på två andra ställen i samma
skill-par — och rött-först/TDD-bevisformen saknar helt bärare i
`bygg-agent.md`, den dominerande exekveringsvägen för backlog-kort.

---

## § 0 — Premiss-pass (ADR-086): vad restes och vad höll

| Premiss (uppdrag eller egen arbetshypotes) | Prövad hur | Utfall |
|---|---|---|
| PRD `task-149` är landad på `main` sedan `1026fd12` | `git fetch origin` + `git log --oneline -1 1026fd12` mot `origin/main` | **Bekräftad.** `1026fd12` = merge av PR #859 ("TASK-149 + 7 skivor"), HEAD på `origin/main` vid passets start. Ingen divergens. |
| Aktiv pluginversion är den högsta semver-katalogen under `~/.claude/plugins/cache/marcus-hub/marcus-system/skills/` | `ls -d .../marcus-system/*/ \| sort -V` + `installed_plugins.json` | **Bekräftad.** `1.29.0` är både högst i semver-ordning och matchar `installPath` i install-recordet. |
| Samtliga sju syskon-skivor (`task-149.1`–`.5`, `.7`) är fortfarande `To Do` (ingen har landat ADR-097 eller annat som skulle ändra källäget under detta pass) | `npx backlog task task-149.N --plain \| grep Status` för N=1,2,3,4,5,7 | **Bekräftad.** Samtliga `○ To Do`. `ADR-096` existerar redan i `docs/decisions/` men hör till syskon-PRD:n `TASK-148` ("Subagentens väntekontrakt"), inte till `149.1`s `ADR-097` — ingen namnkollision, ingen förväxling. |
| Prototype-skillens § 5-fall (T126) är redan känt och hanteras av `task-149.3`/`.4` — inget dubblettkort ska mintas för det | Läste PRD `task-149` § Implementationsbeslut + `tasks/threads/T126-arbetsformens-leveransvag.md` | **Bekräftad.** PRD:n pekar explicit ut skiva 3+4 som fixet; T126-tråden finns på disk. Bokförd som referenspunkt i § 4, inget nytt kort. |
| Uppdragets bärarklass-lista i AC (3 klasser: mekanisk/kort-buren/startdörrs-bunden) och uppdragstextens lista (4 klasser, + alltid-laddad) är samma modell, bara olika detaljnivå | Läste kortets AC #1 ordagrant mot uppdragstextens fulla klassbeskrivning | **Divergens, dokumenterad.** Kortets AC-rad nämner bara 3 av 4 klasser (saknar "alltid-laddad" explicit). Uppdragstextens 4-klassmodell är rikare specificerad (med definitioner) och används som facit — se § 1 för hela resonemanget. |
| "Grindklassens dubbla bärare (kort-DoD 'L147' + bygg-agent.md rad 90–96)" är en existerande, verifierbar facit-instans | `grep -n "^### L147" tasks/lessons.md` + läste `bygg-agent.md` rad 83–96 | **Bekräftad.** `L147` (`tasks/lessons.md:2298`) och `bygg-agent.md` § "Verifiera med CI:s exakta kommandon" (rad 83–96) uttrycker samma regel oberoende av varandra — men den faktiska DUBBLA bäraren är kort-DoD-punkten "Rörd fil-klass lokala grindar gröna (L147)" (synlig på varje bygg-agent-kört korts DoD, t.ex. detta korts egen DoD #2) + bygg-agent.md:s agentfils-text. Facit-modellen håller. |
| Marcus personliga `~/.claude/CLAUDE.md` injiceras automatiskt även i en worktree-isolerad subagent-kontext (inte bara i huvudsessionen) | Direkt observation: hela filens innehåll levererades som `<system-reminder>` i denna sessions FÖRSTA tur, innan något verktyg anropades | **Bekräftad, empiriskt.** Detta är den starkaste enskilda datapunkten i passet — den bevisar att "alltid-laddad" verkligen är oberoende av exekveringsväg (fresh spawn, subagent, worktree-isolering spelar ingen roll), vilket i sin tur är precis vad som skiljer den klassen från startdörrs-bunden. |
| Källfilerna (`CLAUDE.md`, `.claude/agents/bygg-agent.md`) står stilla under hela passet — ingen parallell landning ändrar dem medan inventeringen pågår | `git fetch origin` inför kort-mintning (§ 4/6) | **Falsk.** Under passets gång landade FYRA PR:er på `origin/main` (#860 → #863), inklusive `TASK-149.1`s `ADR-097` och `TASK-148.2`/`.3`s nya innehåll i BÅDA mina primärkällor. Upptäckt via rutinmässig `git fetch` före kortskapelse, inte genom att leta efter det. Konsekvens: `git merge --ff-only origin/main` kördes (0 lokala commits att tappa), och tabellerna A/C nedan är korrigerade mot det NYA innehållet — se C11/C16/C17. De tre planerade kortnumren `TASK-150`–`152` var DESSUTOM redan tagna av en helt orelaterad triage ("uppdrag 3-triagen") — bekräftat via `git show` att innehållet inte överlappar denna karta. Numren i § 6 var redan explicit hedgade mot precis detta ("bekräftas i slutrapporten") innan kollisionen inträffade. |

**"Inga divergenser" gäller inte här** — en premiss (AC:s 3-mot-4-klassmodell) höll inte exakt och är bokförd öppet i stället för tyst löst.

---

## § 1 — Metod: käll-läsning, bärarklasser och en femte, tillagd klass

### Källor lästa i sin helhet

| # | Fil | Rader | Typ |
|---|---|---|---|
| 1 | `CLAUDE.md` (spoke) | 655 → 661 (efter ombläsning, § 0) | Alltid-laddad konstitution |
| 2 | `CONTRIBUTING.md` | 1153 (oförändrad, verifierat) | Ej auto-laddad referens |
| 3 | `.claude/agents/bygg-agent.md` | 224 → 244 (efter ombläsning, § 0) | Agent-definition |
| 4 | `.claude/agents/research-pass.md` | 156 | Agent-definition |
| 5 | hub-skill `session-start/SKILL.md` (v1.29.0) | 247 | Hub-skill |
| 6 | hub-skill `session-paus/SKILL.md` | 145 | Hub-skill |
| 7 | hub-skill `session-resume/SKILL.md` | 153 | Hub-skill |
| 8 | hub-skill `session-end/SKILL.md` | 211 | Hub-skill |
| 9 | hub-skill `do-work/SKILL.md` | 108 | Hub-skill |
| 10 | hub-skill `work-batch/SKILL.md` | 201 | Hub-skill |
| 11 | hub-skill `prototype/SKILL.md` | 211 | Hub-skill |
| 12 | hub-skill `grilling/SKILL.md` | 61 | Hub-skill |
| 13 | hub-skill `to-prd/SKILL.md` | 49 | Hub-skill |
| 14 | hub-skill `to-issues/SKILL.md` | 45 | Hub-skill |
| 15 | `output-styles/code-rollen.md` (v1.29.0) | 78 | Output-style |

Radnummer i tabellerna nedan är 1-indexerade filrader vid läsningstillfället.
Spoke-filerna lästes ursprungligen mot commit `1026fd12`; under passet
landade fyra PR:er på `origin/main` (§ 0, sista raden) som ändrade BÅDA
`CLAUDE.md` och `.claude/agents/bygg-agent.md` — tabellerna A och C nedan är
omlästa och radnumren korrigerade mot det fast-forwardade läget, commit
`f3ee43d1` (`git merge --ff-only origin/main`, 0 lokala commits förlorade).
Övriga spoke-källor (`CONTRIBUTING.md`, `research-pass.md`) var oförändrade
i samma diff, verifierat (`git diff 835b509f f3ee43d1 -- CONTRIBUTING.md`
gav tom diff). Pluginversion `1.29.0`, `gitCommitSha 15ddcecf` för
hub-filerna, opåverkad av spoke-landningarna (annat repo).

### De fyra namngivna bärarklasserna

Uppdragstexten (ur S99 Del 3) definierar fyra klasser:

- **Mekanisk bärare** — hook/grind/ruleset som tvingar regeln mekaniskt,
  oberoende av om någon läst prosan.
- **Kort-buren** — regeln lever som ett DoD- eller AC-fält som ärvs av
  varje backlog-kort via `backlog/config.yml`s defaults eller `to-issues`s
  arv-steg.
- **Alltid-laddad** — regeln bor i `CLAUDE.md` eller output-stylen, som
  injiceras i systemprompten VARJE session oavsett väg. Empiriskt
  verifierat i detta pass (§ 0, sista raden): gäller ÄVEN en
  worktree-isolerad subagent som aldrig explicit läst filen.
- **Startdörrs-bunden** — regeln bor i en hub-skills `SKILL.md` som bara
  laddas när skillens `description` matchar eller ett explicit
  `/kommando` avfyrar den. En resume:ad eller handoff-driven utförare som
  aldrig traverserar den dörren ser aldrig regeln — detta är exakt T126:s
  mekanism.

### Femte, tillagd klass: agent-fil-buren

`.claude/agents/bygg-agent.md` och `.claude/agents/research-pass.md`
passar inte rent i någon av de fyra. De är inte "alltid-laddade" per
definitionen (den är uttryckligen avgränsad till CLAUDE.md/output-style),
men de är heller inte "startdörrs-bundna" i skill-filers mening: det finns
ingen `description`-matchning som kan MISSLYCKAS att avfyra dem — en
`Agent`-anrop med `subagent_type: "bygg-agent"` laddar hela filen
DETERMINISTISKT, varje gång, utan tolkningsutrymme.

Skillnaden är operativt viktig och håller isär två distinkta riskformer:

- En **hub-skills startdörr** kan tystna av sig själv (fuzzy
  `description`-matchning som inte triggar vid resume — T126).
- En **agent-fils "dörr"** är binär och pålitlig NÄR den öppnas (explicit
  `subagent_type`-dispatch missar aldrig), men filen är osynlig för VARJE
  annan exekveringsväg — huvudsessionen som jobbar direkt utan att
  spawna en subagent, eller en annan agenttyp.

Denna rapport klassar `.claude/agents/*.md`-innehåll som
**agent-fil-buren** och håller det isär från startdörrs-bunden i räkningen
(§ 3), eftersom att slå ihop dem hade dolt just den skillnaden — vilket är
precis vad Fynd 3 (§ 4) handlar om.

### CONTRIBUTING.md: startdörrs-bunden i vidgad mening

`CONTRIBUTING.md` är varken mekaniskt, kort-buret eller alltid-laddat —
`CLAUDE.md` säger det själv rakt ut (rad 508–510): *"CONTRIBUTING.md
auto-laddas inte i en Code-session — bara denna fil gör det."* Men det är
inte heller en hub-skill. Läsordningen för `bygg-agent.md` (§ "Läs innan
du designar", rad 30–38) listar INTE `CONTRIBUTING.md` som obligatorisk
läsning, och `session-start`-skillens läs-ordning (hub- och
spoke-rutinerna) gör det inte heller. `CONTRIBUTING.md` nås alltså bara
via frivillig cross-referens (en länk från `CLAUDE.md` eller en agents
eget initiativ) — funktionellt samma riskform som en startdörr, fast utan
ens en `description`-matchning som kan trigga den. Denna rapport klassar
`CONTRIBUTING.md`-innehåll som **startdörrs-bunden (svag dörr)** och
flaggar explicit när ingen annan bärare täcker samma regel.

---

## § 2 — Inventeringstabellen

Kolumner: **Regel** (kort), **Källa** (fil:rad), **Bärarklass**, **Belägg**
(varför klassningen håller, inkl. ev. dubbel bärare).

### A — `CLAUDE.md` (spoke, alltid-laddad grundton)

| # | Regel | Källa | Bärarklass | Belägg |
|---|---|---|---|---|
| A1 | Läs `docs/byggplan.md` innan varje fas; avvik aldrig utan att uppdatera byggplanen först | CLAUDE.md:26 | Alltid-laddad | Rad i "Instruktioner — Alltid gäller", injiceras varje session |
| A2 | Research etablerade bibliotek INNAN lösning designas | CLAUDE.md:27 | Alltid-laddad | Samma sektion |
| A3 | Airtable-schema läses INNAN fält-operation designas | CLAUDE.md:28 | Alltid-laddad | Samma sektion; dubblett i bygg-agent.md:34–37 (agent-fil-buren) |
| A4 | Uppdrag till agenter källmärker varje faktapåstående; obelagt = HYPOTES (ADR-086) | CLAUDE.md:35 | Alltid-laddad | Dubbel bärare: bygg-agent.md § Premiss-pass (agent-fil-buren) upprepar regeln operativt |
| A5 | Triage av det oväntade — 4-vägs klassning (blockerar × scope) | CLAUDE.md:39–54 | Alltid-laddad | Egen § i CLAUDE.md, ADR-053 |
| A6 | `verify:ci-parity` är diagnosverktyg — körs ENDAST i 3 namngivna lägen, aldrig som rutin | CLAUDE.md:88–113 | Alltid-laddad | Uttrycklig rad: "Kör det INTE före varje push" |
| A7 | Full CI-paritetskörning defaultar alltid — inget snabbläge blir smygande standard | CLAUDE.md:148–150 | Alltid-laddad | Prosa; ingen egen mekanisk spärr utöver skriptets egen `--fast`-flagga (opt-in) |
| A8 | Osäkerhet i CI-diff-klassning eskalerar alltid uppåt, aldrig till gissad delmängd | CLAUDE.md:174–177 | Mekanisk | Skriptets egen fail-safe-logik (`verify-ci-parity.mjs`), prosan beskriver koden |
| A9 | Granskningsdata i staging byggs ALDRIG för hand — `seed:review` obligatoriskt | CLAUDE.md:203–236 | Alltid-laddad | Egen § med kommandon |
| A10 | Flakighet mäts ALDRIG med egen mätserie — `metrics:flake`-riggen obligatorisk | CLAUDE.md:238–261 | Alltid-laddad | Egen § |
| A11 | Ny hook kan ALDRIG skarpbevisas i sessionen som byggde den — bokförs som öppen skuld | CLAUDE.md:263–288 | Alltid-laddad | Egen §, förstapartskälla citerad |
| A12 | Worktree-isolerings-gränsen: git via Bash mot eget repos huvudkatalog avvisas | CLAUDE.md:290–360 | Mekanisk | Harness-spärr, verifierad ordagrant i detta pass (två `for`-loop-kommandon avvisades under körning) |
| A13 | All landning via PR; direktpush avvisas mekaniskt | CLAUDE.md:362–366 | Mekanisk | Ruleset `main-skydd` (ADR-076) |
| A14 | Armera aldrig en PR vars bygg-agent fortfarande arbetar; kör aldrig update-branch mot en sådan gren | CLAUDE.md:415–416 | Alltid-laddad | Ingen mekanisk spärr — ren orkestrerings-disciplin; dubblett i CONTRIBUTING.md:345–347 (B8) |
| A15 | Svep vid varje väckning — agenter parkerar aldrig på landningsvakter | CLAUDE.md:418–437 | Alltid-laddad | Dubbel bärare: bygg-agent.md § "Specialfallet: landnings-vakten" (agent-fil-buren) upprepar identiskt |
| A18 | Namnet på mönstret: subagent = Activity, orkestrerare = Workflow (ADR-096) — subagent äger aldrig väntan | CLAUDE.md:439–445 | Alltid-laddad | **NY, landade under passet** (§ 0 sista raden). Mekanisk tvillingbärare: `scripts/deny-subagent-vantan.sh` (PreToolUse-hook, `TASK-148.2`) nekar `Monitor` ovillkorligt och `Bash{run_in_background:true}` i subagent-kontext |
| A16 | `autoMergeRequest: null` ≠ "ej armerad" — disambiguera med `isInMergeQueue` eller andra `gh pr merge --auto` | CLAUDE.md:446–473 | Alltid-laddad | Egen tabell i CLAUDE.md |
| A17 | Kortnummer: `git fetch` + fast-forwarda FÖRE `task create`; committa direkt | CLAUDE.md:541–548 | Alltid-laddad | Prosa; delvis mekanisk (`check_active_branches: true` i `backlog/config.yml`) men skyddet är ofullständigt per samma §. **Detta pass följde regeln skarpt** — se § 0 sista raden |

### B — `CONTRIBUTING.md` (svag dörr, ej auto-laddad)

| # | Regel | Källa | Bärarklass | Belägg |
|---|---|---|---|---|
| B1 | Sessioner körs LÄS→RAPPORTERA→PLANERA→IMPLEMENTERA→VERIFIERA→DOKUMENTERA+COMMITTA→EFTER | CONTRIBUTING.md:19 | Startdörrs-bunden (svag) | Ingen läs-ordning pekar hit; kortformen (utan EFTER-steget) finns i output-style O2 |
| B2 | Mellan-klungor använder inline-källor, aldrig "se sessionsdok Del N" under körning | CONTRIBUTING.md:26 | Startdörrs-bunden (svag) | Enda hemvist |
| B3 | Plain `npx playwright test` är icke-stödd — kör kanoniska kommandon separat | CONTRIBUTING.md:38–45 | Startdörrs-bunden (svag) | Enda hemvist för listan, men CLAUDE.md:75 nämner en delmängd (test:api) |
| B4 | Staging-preflighten frågar CI FÖRST; `MM_STAGING_PREFLIGHT=off` är aktivt val, aldrig default | CONTRIBUTING.md:111–221 | Mekanisk | `staging-semaphore.sh` + villkorad pre-commit-hook |
| B5 | Definition of Done — per session, 11 punkter (BUILD-LOG, ADR, lessons, trådar, m.fl.) | CONTRIBUTING.md:223–239 | Startdörrs-bunden (svag) | Endast de 4 DoD-kommandona (test/typecheck/Biome/build) är dubblerade alltid-laddat i CLAUDE.md:74–79; resten (BUILD-LOG-entry, ADR, trådsynk m.fl.) finns BARA här |
| B6 | Push-kadensen — commit är gratis, push kostar; pusha vid landningsklar enhet, inte per commit | CONTRIBUTING.md:272–286 | **Saknar bärare** | Ingen mekanism, inget DoD-fält, ingen alltid-laddad kortform. Känt gap — se § 4 "Övervägt men ej mintat" |
| B7 | Landnings-ordningen — armera med `gh pr merge --auto`, kön väljer ordning | CONTRIBUTING.md:288–398 | Mekanisk | `merge_queue`-regel i rulesetet; kärnan dubblerad alltid-laddat i CLAUDE.md § Landning (A13/A16) |
| B8 | Armera aldrig en PR vars bygg-agent fortfarande arbetar | CONTRIBUTING.md:345–347 | Alltid-laddad | Dubblett av A14 |
| B9 | Agenterna armerar inte — orkestreraren granskar diffen och armerar | CONTRIBUTING.md:364–370 | Agent-fil-buren | Dubblett av bygg-agent.md:130–135 (C10) |
| B10 | Revert-vägen — Marcus beslutar ATT backa, bygg-agent förbereder men armerar aldrig | CONTRIBUTING.md:400–425 | Startdörrs-bunden (svag) | Rollfördelningen dubblerad i A14/B9, men den fullständiga proceduren (steg 1–5) finns BARA här |
| B11 | `git revert -m 1` obligatoriskt vid merge-commit-revert, aldrig `-m 2` | CONTRIBUTING.md:481–497 | Startdörrs-bunden (svag) | Enda hemvist, inklusive varför `-m 2` är "tyst farlig" |
| B12 | Rött-först — testet skrivs och körs RÖTT lokalt FÖRE grön kod; bevis = lokalt körutdrag | CONTRIBUTING.md:679–686 | Startdörrs-bunden (svag) | **RISK — se Fynd 3, § 4.** Sekundär bärare: `do-work/SKILL.md` steg 4 (I4) — men INGEN bärare i `bygg-agent.md` |
| B13 | Avsiktligt röda körningar i delad kö förbjudna — rött i CI ska betyda EN sak | CONTRIBUTING.md:690–691 | Startdörrs-bunden (svag) | Samma regel-familj som B12 |
| B14 | Verktygsval före nybygge — redovisa "hur löser branschledarna" skriftligt, även vid "bygg eget" | CONTRIBUTING.md:1122–1136 | Startdörrs-bunden (svag) | CLAUDE.md:27 (A2) ekar principen löst men saknar skriftlighetskravet |
| B15 | Agent-spawn-mätningen läses INNAN `permissions.deny` eller tvingande hook övervägs | CONTRIBUTING.md:1112–1116 | Startdörrs-bunden (svag) | Enda hemvist |

### C — `.claude/agents/bygg-agent.md` (agent-fil-buren)

| # | Regel | Källa | Bärarklass | Belägg |
|---|---|---|---|---|
| C1 | Symlinka `node_modules`, kopiera aldrig | bygg-agent.md:16–23 | Agent-fil-buren | Laddas fullt vid varje `subagent_type: bygg-agent`-spawn |
| C2 | Läs kortet + CLAUDE.md + data-model.md (Airtable) + ADR (styrd fil) FÖRE design | bygg-agent.md:30–38 | Agent-fil-buren | Samma |
| C3 | Premiss-pass — pröva varje verifierbar premiss FÖRE design (ADR-086) | bygg-agent.md:40–71 | Agent-fil-buren | Dubbel bärare: CLAUDE.md:35 (A4, alltid-laddad) ger kortformen |
| C4 | Kortet ägs av verktyget — läs/ändra ENDAST via backlog-CLI; sätt ALDRIG Done | bygg-agent.md:73–81 | Agent-fil-buren | Dubbel bärare: PreToolUse-hook (`deny-backlog-direct-edit.sh`, T100) nekar direktredigering mekaniskt |
| C5 | Verifiera med CI:s exakta kommandon (actionlint `-ignore`, check:docs-talet aldrig kopierat) | bygg-agent.md:83–96 | Agent-fil-buren | **Facit-modellen** — dubbel bärare: kort-DoD #2 "Rörd fil-klass lokala grindar gröna (L147)" (kort-buren) |
| C6 | Fånga exitkoden separat — aldrig pipa till tail/head | bygg-agent.md:98–104 | Agent-fil-buren | Samma agentfil |
| C7 | Namnge varje temporärfil med kort-ID — scratchpad delas, skalomdirigering saknar spärr | bygg-agent.md:106–117 | Agent-fil-buren | Uttryckligen "konvention, inte mekanism" i egen text |
| C8 | En lokal mätning projicerad till CI är inte en mätning | bygg-agent.md:119–120 | Agent-fil-buren | Samma |
| C9 | `git add` path-scopad alltid; DoD kräver noll orelaterade filer | bygg-agent.md:127–128 | Agent-fil-buren | Dubbel bärare: kort-DoD #4 (kort-buren) |
| C10 | Armeringen ägs av uppdraget — default: armera INTE | bygg-agent.md:130–135 | Agent-fil-buren | Dubblett av CONTRIBUTING.md:364–370 (B9) |
| C11 | Ingen asynkron signal når dig — kör allt att invänta i FÖRGRUNDEN | bygg-agent.md:143–172 | Agent-fil-buren | **Ny mekanisk tvillingbärare landad UNDER detta pass** (§ 0): `scripts/deny-subagent-vantan.sh` (PreToolUse-hook, `TASK-148.2`, ADR-096) nekar `Monitor` + `Bash{run_in_background:true}` mekaniskt i subagent-kontext. Dubblett i research-pass.md:29–46 (D3) |
| C16 | Persistens före väntan — committa/pusha färdigt arbete INNAN varje anrop som kan konverteras till bakgrund | bygg-agent.md:174–184 | Agent-fil-buren | **NY, landade under passet** (`TASK-148.3`). Refererar `ADR-096` (Activity/Workflow) och `docs/research/subagent-parkering-handoff-kontrakt-2026-08-05.md` § 4 |
| C17 | Explicit `timeout` på potentiellt långa `Bash`-anrop — grundinställningen konverterar tyst till bakgrund vid gränsen | bygg-agent.md:185–192 | Agent-fil-buren | **NY, landade under passet** (`TASK-148.3`). Enda försvaret mot den TYSTA bakgrundskonverteringen (C11:s mekaniska spärr täcker bara de EXPLICITA vägarna) |
| C12 | Vänta ALDRIG in kö-fasen — slutrapport vid armerad/öppnad PR | bygg-agent.md:195–204 | Agent-fil-buren | Samma agentfil, sektion "Specialfallet: landnings-vakten" (radnummer skiftade +21 pga C16/C17-tillägget) |
| C13 | Vakt-event är väckarklocka, aldrig fakta — förgrundsverifiera mot git/REST | bygg-agent.md:206–213 | Agent-fil-buren | Dubbel bärare: CLAUDE.md:435–437 (alltid-laddad) |
| C14 | Registrera oväntat i slutrapporten, förkasta aldrig tyst; inga arkitektur-/scope-beslut på eget bevåg | bygg-agent.md:215–223 | Agent-fil-buren | Samma agentfil |
| C15 | Rapportformatet — modell-identitet, gren/SHA/PR, premiss-utfall, AC-status med mätt värde | bygg-agent.md:225–244 | Agent-fil-buren | Samma agentfil |

### D — `.claude/agents/research-pass.md` (agent-fil-buren)

| # | Regel | Källa | Bärarklass | Belägg |
|---|---|---|---|---|
| D1 | Kör oisolerat i huvudkatalogen, skapa ingen worktree | research-pass.md:12–24 | Agent-fil-buren | Laddas fullt vid `subagent_type: research-pass`-spawn |
| D2 | Rör inte andra filer än den du skapar; committa/staga/byt gren aldrig | research-pass.md:26–27 | Agent-fil-buren | Samma |
| D3 | Ingen asynkron signal når dig — samma FÖRGRUND-regel som bygg-agent | research-pass.md:29–46 | Agent-fil-buren | Dubblett av C11, egen separat agentfil (inte en delad referens) |
| D4 | Inventera vad vi redan vet (docs/research, ADR:er, lessons) FÖRE första sökningen | research-pass.md:53–86 | Agent-fil-buren | Samma agentfil |
| D5 | Käll-hierarkin — förstapartskälla först, varje bärande påstående citerar källa | research-pass.md:88–98 | Agent-fil-buren | Samma |
| D6 | Mät hellre än citera | research-pass.md:100–107 | Agent-fil-buren | Samma |
| D7 | Frånvaro av bevis är inte bevis — egen sektion obligatorisk | research-pass.md:109–114 | Agent-fil-buren | Samma |
| D8 | Committa inte — lämna filen ospårad, rapportera full sökväg | research-pass.md:133–138 | Agent-fil-buren | Samma |

### E — hub-skill `session-start`

| # | Regel | Källa | Bärarklass | Belägg |
|---|---|---|---|---|
| E1 | Läs-ordning hub→spoke→lessons→BUILD-LOG→`git pull` | session-start/SKILL.md:17–26 | Startdörrs-bunden | Laddas endast vid skillens `description`-match eller explicit avfyrning |
| E2 | Läs stora statusfiler ALDRIG oguardat — alltid med `limit` | session-start/SKILL.md:78–96 | Startdörrs-bunden | Egen sub-disciplin, empiriskt underlag citerat (350,9 KB-fallet) |
| E3 | Modell/effort-routing-tabellen per agent-spawn | session-start/SKILL.md:40–60 | Startdörrs-bunden | **RISK — Fynd 1, § 4.** Pointer-refererad, ej inlinad, i `session-resume` |
| E4 | Parallellitets-detektion — detektera + fråga, aldrig tyst auto-isolering | session-start/SKILL.md:62–76 | Startdörrs-bunden | **RISK — Fynd 2, § 4** (signal 2–4 av 4) |
| E5 | Autofix FÖRE grind, inte efter (`--write` innan `check`) | session-start/SKILL.md:98–110 | Startdörrs-bunden | Egen sub-disciplin |
| E6 | Audit-status — `audit-ci` ska vara grön; critical → STOPPA-OCH-FRÅGA | session-start/SKILL.md:112–118 | Startdörrs-bunden | Egen sub-disciplin |
| E7 | Pre-commit Biome — `check --write .`, inte bara `format --write` | session-start/SKILL.md:130–139 | Startdörrs-bunden | Egen sub-disciplin |
| E8 | Sessionsnummer — sekventiella heltal, en session = en logisk arbetsenhet | session-start/SKILL.md:141–158 | Startdörrs-bunden | Egen sub-disciplin |
| E9 | Sessionens körtids-monitor — starta heartbeat-svep efter RAPPORTERA kvitterats | session-start/SKILL.md:174–199 | Startdörrs-bunden | Dubbel bärare: inlinad identiskt i `session-resume` (G-familjen); stoppas i `session-paus`/`session-end` |
| E10 | Ägarlappens bedömningsregel — levande ägare ⇒ egen worktree; ålder avgör ingenting | session-start/SKILL.md:201–222 | Startdörrs-bunden | **Facit-exempel:** samma regel INLINAD explicit i `session-resume` (G5) efter en mätt S93-incident — se § 4 "Redan fixad instans" |
| E11 | RAPPORTERA avslutas med KONKRET föreslagen ingång, aldrig "vad vill du göra?" | session-start/SKILL.md:230–232 | Startdörrs-bunden | Egen sub-disciplin |

### F — hub-skill `session-paus`

| # | Regel | Källa | Bärarklass | Belägg |
|---|---|---|---|---|
| F1 | Intentions-grind N vs N+1 — bekräfta med Marcus FÖRE skrivning | session-paus/SKILL.md:16–26 | Startdörrs-bunden | STOPPA-grind, egen § |
| F2 | Förankrad `## PAUSLÄGE`-rubrik teckenexakt (em-dash, versalform) | session-paus/SKILL.md:34–43 | Startdörrs-bunden | Dubbel bärare: `scripts/check-lifecycle.sh` läser exakt denna sträng mekaniskt |
| F3 | Todo-kadens-synk vid paus — paus-skrivningen ÄR en landning | session-paus/SKILL.md:51–53 | Startdörrs-bunden | Egen procedursteg |
| F4 | Verifiera rent + pushat träd — opipad exit, CI per jobb | session-paus/SKILL.md:54–56 | Startdörrs-bunden | Egen procedursteg |
| F5 | Städa avställda agent-worktrees — torrkörning FÖRE `--utfor` | session-paus/SKILL.md:57–71 | Startdörrs-bunden | Dubblett av `session-end` (H2) |
| F6 | Släpp körtids-resurser — stdin-kontraktet obligatoriskt | session-paus/SKILL.md:75–97 | Startdörrs-bunden | Mätt skarpt fel en gång (S97): tomt stdin ⇒ tyst `exit 0` utan att släppa lappen |
| F7 | Stoppa heartbeat-monitorn med `TaskStop` | session-paus/SKILL.md:94–97 | Startdörrs-bunden | Egen procedursteg |
| F8 | FINALISERA INTE vid paus — ingen lessons-hub-sync, arkivering, nummer-increment | session-paus/SKILL.md:98–99 | Startdörrs-bunden | Egen procedursteg |
| F9 | Worktree-städning UTANFÖR `agent-*`-scope → STOPPA, aldrig `--force` | session-paus/SKILL.md:115–119 | Startdörrs-bunden | STOPPA-grind |

### G — hub-skill `session-resume`

| # | Regel | Källa | Bärarklass | Belägg |
|---|---|---|---|---|
| G1 | Vägvals-grind — pausat dok är FYND, inte order; auto-resume förbjudet | session-resume/SKILL.md:16–24 | Startdörrs-bunden | STOPPA-grind, S52→S53-precedent citerat |
| G2 | Re-verifiera numrering mot disk — handoffens paus-tida värden är hypotes | session-resume/SKILL.md:37–40 | Startdörrs-bunden | Egen procedursteg |
| G3 | Divergens mellan dok och disk flaggas öppet — disk vinner | session-resume/SKILL.md:42–45 | Startdörrs-bunden | Egen procedursteg |
| G4 | Paus-rubrik bryts till historik-form — ren APPEND räcker inte (prefix-förankrad regex) | session-resume/SKILL.md:49–58 | Startdörrs-bunden | Dubbel bärare: `check-lifecycle.sh` (T6-fallet citerat explicit) |
| G5 | Ägarlappens bedömningsregel — INLINAD med avsikt (S93-lärdom) | session-resume/SKILL.md:103–131 | Startdörrs-bunden | **Facit-exempel** — se § 4 |
| G6 | Rapportera ≠ be om lov — worktree-valet genomförs direkt, syns bara i rapporten | session-resume/SKILL.md:127–131 | Startdörrs-bunden | Egen procedursteg |

### H — hub-skill `session-end`

| # | Regel | Källa | Bärarklass | Belägg |
|---|---|---|---|---|
| H1 | Do-confirm-pass — 12 killer items, TÄCKT/EJ TILLÄMPLIGT/SAKNAS per post | session-end/SKILL.md:30–56 | Startdörrs-bunden | Kärnprocedur |
| H2 | Worktree-städning (post 12) — 5 grindar, UTAN `--force` | session-end/SKILL.md:62–91 | Startdörrs-bunden | Dubblett av F5 |
| H3 | Stängnings-grindar FÖRE `lifecycle: closed` — N vs N+1 + coverage-kvittens (Marcus) | session-end/SKILL.md:125–141 | Startdörrs-bunden | STOPPA-grind |
| H4 | Transcript-disciplin — sanningskälla är JSONL, inte minne | session-end/SKILL.md:143–166 | Startdörrs-bunden | Delvis dubblett av CONTRIBUTING.md § Transcript-disciplin (B-familjen, rad 28–34) |
| H5 | P3a — mellan-K rör inte sessionsdoket för full retrospektiv, bara korta statusrader | session-end/SKILL.md:168–187 | Startdörrs-bunden | Dubblett av CONTRIBUTING.md:23–27 |
| H6 | Full-text-expandering bär sökväg/identifierare till VARJE producerad artefakt | session-end/SKILL.md:177–187 | Startdörrs-bunden | Mätt fel citerat (S98: 15 PR-nummer men noll sökvägar till research-filer) |

### I — hub-skill `do-work`

| # | Regel | Källa | Bärarklass | Belägg |
|---|---|---|---|---|
| I1 | Kvitto-sömmen — `ready-for-agent`-etikett + explicit `/do-work`-avfyrning = förhandskvitto | do-work/SKILL.md:14–20 | Startdörrs-bunden | Governance-kärna för do-work-vägen specifikt |
| I2 | Divergens mot kortets spec/scope/arkitektur → avbryt, återställ till To Do, committa ingen kod | do-work/SKILL.md:17–20 | Startdörrs-bunden | STOPPA-grind |
| I3 | Plocka — ETT kort per invokering, nästa kort tas i frisk session | do-work/SKILL.md:24–32 | Startdörrs-bunden | Egen procedursteg |
| I4 | Test-först i vertikala snitt — beteende → rött test → minsta gröna kod → nästa | do-work/SKILL.md:39–44 | Startdörrs-bunden | Samma regel-familj som B12/B13. **Sekundär bärare i Fynd 3** — se § 4 |
| I5 | Full svit efter SISTA materiella ändringen, minst en gång i slutskedet | do-work/SKILL.md:43–46 | Startdörrs-bunden | Egen procedursteg |
| I6 | PILOT review-passet — EN oberoende review-subagent, aldrig implementerns eget resonemang | do-work/SKILL.md:52–71 | Startdörrs-bunden | Mätperiod-markerad (T86) |
| I7 | Tvåstegs-stängning — stängnings-commit ENDAST på CI-vaktens exit 0 | do-work/SKILL.md:72–96 | Startdörrs-bunden | Egen procedursteg, hård bindning till exitkod citerad |
| I8 | Fynd under körning → NYTT kort UTAN triage-etikett, oplockbart tills människan klassar | do-work/SKILL.md:102–104 | Startdörrs-bunden | Konventionen denna rapports egna fynd-kort (§ 4) delvis avviker från — se motivering där |

### J — hub-skill `work-batch`

| # | Regel | Källa | Bärarklass | Belägg |
|---|---|---|---|---|
| J1 | Halt-first — batchen stannar vid FÖRSTA STOPPA/abort, ingen skip-and-continue | work-batch/SKILL.md:20–23 | Startdörrs-bunden | `disable-model-invocation: true` i frontmatter — skillen avfyras ALDRIG av auto-matchning, bara explicit Marcus-order |
| J2 | Aldrig samma kort två gånger i samma batch | work-batch/SKILL.md:25–27 | Startdörrs-bunden | Hård gräns i kontraktet |
| J3 | Granskningsfärdigt läge — mänsklig DoD-grind lämnas ÖPPEN, Done-flippen är Marcus | work-batch/SKILL.md:30–33 | Startdörrs-bunden | Egen procedursteg |
| J4 | Oberoende disk-verifiering per kort — orkestratorn litar aldrig på agentens ord ensamt | work-batch/SKILL.md:61–65 | Startdörrs-bunden | Egen procedursteg |
| J5 | Parallell form — claims-check FÖRE spawn, täcknings-pass obligatoriskt försteg | work-batch/SKILL.md:88–112 | Startdörrs-bunden | Empiri citerad (S75: 15/21 kort med gap) |

### K — hub-skill `prototype`

| # | Regel | Källa | Bärarklass | Belägg |
|---|---|---|---|---|
| K1 | Prototypa INTE reproducerade buggar eller rutinutbyggnad | prototype/SKILL.md:21–24 | Startdörrs-bunden | "Negativ-regeln" |
| K2 | Tvetydigt grenval är en grillningsfråga — välj aldrig tyst | prototype/SKILL.md:41–42 | Startdörrs-bunden | Egen regel |
| K3 | Divergens-passet — tre varianter, prototypen itereras aldrig i valfasen | prototype/SKILL.md:55–57 | Startdörrs-bunden | Del av tvåfas-formen |
| K4 | **Iterations-kadensen § 5** — lokal commit per varv, push EN gång när Marcus säger klart | prototype/SKILL.md:106–121 | Startdörrs-bunden | **KÄND RISK (T126)** — referenspunkt, inget nytt kort (§ 4) |
| K5 | Kastbar från första dagen, tydligt märkt | prototype/SKILL.md:125–127 | Startdörrs-bunden | Throwaway-kontraktets klausul (i)+(ii) |
| K6 | Radera eller absorbera när frågan är besvarad — låt den aldrig ligga och ruttna | prototype/SKILL.md:138–139 | Startdörrs-bunden | Klausul (iv) |
| K7 | Grind-principen — prototyper möter körbarhets-golvet men INTE leverans-grindarna | prototype/SKILL.md:154–158 | Startdörrs-bunden | Egen regel |

### L — hub-skill `grilling`

| # | Regel | Källa | Bärarklass | Belägg |
|---|---|---|---|---|
| L1 | Ställ frågorna en i taget, invänta svar | grilling/SKILL.md:10–11 | Startdörrs-bunden | Kärnregel |
| L2 | Skilj fakta (utforska själv) från beslut (grilla Marcus) — grilla aldrig fram fakta | grilling/SKILL.md:13–17 | Startdörrs-bunden | Kärnregel |
| L3 | Samsyn nådd först vid explicit Marcus-kvittens — implementation börjar aldrig innan | grilling/SKILL.md:22–24 | Startdörrs-bunden | Kärnregel |
| L4 | ADR-baren — tre villkor samtidigt (svårt återställa, överraskande, verklig avvägning) | grilling/SKILL.md:32–45 | Startdörrs-bunden | **Facit-exempel:** kortformen bekräftat närvarande i Marcus personliga `~/.claude/CLAUDE.md` (rad "ADR-BAR"), empiriskt injicerad i denna sessions systemprompt — dubbel bärare (startdörrs-bunden fulltext + alltid-laddad kortform) |

### M — hub-skill `to-prd`

| # | Regel | Källa | Bärarklass | Belägg |
|---|---|---|---|---|
| M1 | Ingen ny intervju — kortet syntetiseras ur redan befintlig samsyn | to-prd/SKILL.md:8–9, 44 | Startdörrs-bunden | Kärnregel |
| M2 | Skarv-kvittensen — presentera skarv-val för Marcus, skillens enda avstämning | to-prd/SKILL.md:17–19 | Startdörrs-bunden | Kärnregel |
| M3 | Mallens exakta rubrik-ordning i Description | to-prd/SKILL.md:27–42 | Startdörrs-bunden | Mall-specifikation |
| M4 | Inga filsökvägar/kodavsnitt i PRD (blir inaktuella), utom beslutsbärande prototyp-utdrag | to-prd/SKILL.md:44–46 | Startdörrs-bunden | Tvärregel |

### N — hub-skill `to-issues`

| # | Regel | Källa | Bärarklass | Belägg |
|---|---|---|---|---|
| N1 | Kort läses/ändras ENDAST via backlog-CLI:t | to-issues/SKILL.md:8–9 | Startdörrs-bunden | Dubbel bärare: PreToolUse-hook (T100) nekar direktredigering mekaniskt |
| N2 | Skiv-godkännande — iterera tills Marcus godkänner uppdelningen | to-issues/SKILL.md:22–25 | Startdörrs-bunden | Kärnregel |
| N3 | Publicera i beroendeordning — blockerare först | to-issues/SKILL.md:27 | Startdörrs-bunden | Kärnregel |
| N4 | AFK-klassning obligatorisk per skiva (`ready-for-agent`/`ready-for-human`) | to-issues/SKILL.md:31–32 | Startdörrs-bunden | Dubbel bärare: etiketten själv blir kort-buren EFTER skapelsen — men SKAPANDET av klassningen är startdörrs-bundet till denna skill |
| N5 | QA-kortet alltid `ready-for-human`, dep på samtliga skivor | to-issues/SKILL.md:35–36 | Startdörrs-bunden | Kärnregel |
| N6 | Stäng eller ändra INTE något överordnat kort | to-issues/SKILL.md:37 | Startdörrs-bunden | Kärnregel |

### O — `output-styles/code-rollen.md` (alltid-laddad, huvudorkestrerar-sessionen)

| # | Regel | Källa | Bärarklass | Belägg |
|---|---|---|---|---|
| O1 | Läs själv för att BESLUTA/GRANSKA; delegera för att PRODUCERA | code-rollen.md:14–17 | Alltid-laddad | `force-for-plugin: true` i frontmatter |
| O2 | Operativ loop LÄS→RAPPORTERA→PLANERA→IMPLEMENTERA→VERIFIERA | code-rollen.md:25 | Alltid-laddad | Kärnrad |
| O3 | Avviker faktiskt tillstånd från uppdraget: stoppa och flagga, planera inte vidare | code-rollen.md:31–32 | Alltid-laddad | Kärnrad |
| O4 | Verifiera med CI:s exakta kommandon, inte approximationer | code-rollen.md:36–37 | Alltid-laddad | Kärnrad |
| O5 | Transparens-rapport — ett block per verifierat område, faktiskt värde per punkt | code-rollen.md:39–49 | Alltid-laddad | Egen § |
| O6 | Stopp-grind — STOPPA vid tvetydighet/scope-beslut/omöjligt mål/divergens/irreversibelt | code-rollen.md:53–60 | Alltid-laddad | Egen § |
| O7 | STOPPA skrivs som markeringsbar text, ALDRIG popup | code-rollen.md:62 | Alltid-laddad | Dubbel bärare: identisk rad i Marcus personliga `~/.claude/CLAUDE.md` (bekräftat injicerad i denna session) |
| O8 | Stage aldrig svepande — path-scopad `git add`, hub/spoke separata commits | code-rollen.md:75 | Alltid-laddad | Egen rad |

---

## § 3 — Sammanfattning: regler per bärarklass

| Bärarklass | Antal (primär klassning) | Andel |
|---|---|---|
| Startdörrs-bunden (inkl. CONTRIBUTING.md "svag dörr") | 76 | 58 % |
| Agent-fil-buren | 26 | 20 % |
| Alltid-laddad | 24 | 18 % |
| Mekanisk | 5 | 4 % |
| Saknar bärare | 1 | < 1 % |
| **Totalt** | **132** | 100 % |

Räknat separat: **13 rader har en dokumenterad DUBBEL bärare** (två
oberoende mekanismer som uttrycker samma regel — facit-modellen: A4/C3,
A13–A16/B7–B9, A14/B8, A18/deny-subagent-vantan.sh (ny), C5+kort-DoD,
C9+kort-DoD, C10/B9, C11/deny-subagent-vantan.sh (ny), C13, E9/G-familjen,
E10/G5, F2, G4, L4, N1, O7). Ingen rad i denna inventering har
**kort-buren** som PRIMÄR (enda) bärare — kort-buren förekommer bara som
SEKUNDÄR bärare bredvid en agentfil eller CLAUDE.md-rad (C5, C9, N4). Det
är ett strukturellt observandum värt att bokföra öppet: task-kortens DoD
bär i praktiken bara det MINSTA gemensamma golvet (fyra kommandon + fyra
generiska punkter), inte de rikare arbetsform-reglerna som i stället
sprids ut över agent-filer och skills.

**58 % av alla identifierade regler är startdörrs-bundna** (inklusive den
vidgade CONTRIBUTING.md-kategorin). Det är den dominerande bärarklassen
totalt sett — vilket är exakt den yta T126 visade vara läckande, och
exakt den yta detta pass letade drift-risk i.

**Två av tre nya rader (A18, C11:s tvillingbärare) landade som en
mekanisk grind medan detta pass pågick** — ett skarpt, oavsiktligt
facit-exempel på precis den princip PRD `task-149` bygger på: en regel
flyttad från prosa till mekanism (här: `TASK-148.2`s
`deny-subagent-vantan.sh`) slutar vara beroende av att någon läser rätt
fil vid rätt tillfälle.

---

## § 4 — Startdörrs-bundna regler med DRIFT-RISK

En regel har drift-risk när den (a) är avsedd att gälla BREDARE än det
smala ögonblick dess bärande skill körs i, och (b) saknar en oberoende väg
in till en utförare som inte traverserar just den skillens dörr — särskilt
en resumead eller handoff-driven session, per T126:s mönster.

### Referenspunkt: prototype § 5 (T126) — redan känt, inget nytt kort

`prototype/SKILL.md` § "Iterations-kadensen" (K4 i tabellen ovan, rad
106–121) föreskriver: lokal commit per konvergens-varv, push EN gång när
Marcus säger klart. `S93`s resume-väg laddade den aldrig, och en PR
pushades + armerades per varv (#664: 15 min i kön, #666: 20 min — för
sekunders arbete). PRD `task-149` § Implementationsbeslut pekar redan ut
`task-149.3` (tillståndsfil + push-hook) och `task-149.4` (hub-integration
— skillen sätter tillståndet, handoffen bär det) som fixet. Detta pass
mintar INGET dubblettkort för detta — uppdragets explicita instruktion.

### Fynd 1 — Modell/effort-routing-tabellen (E3) är pointer-refererad, inte inlinad, i `session-resume`

`session-start/SKILL.md` § "Sub-disciplin — orkestrar-rollen vid start"
(rad 40–60) bär tier-policyns fullständiga routing-tabell (vilken
agent/modell för vilken uppgiftsklass, med eskaleringsregler). Regeln
gäller uttryckligen "Vid varje agent-spawn" — alltså under HELA sessionen,
inte bara vid dess start.

`session-resume/SKILL.md` § "Orkestrerar-roll + parallellitet (samma
discipliner som session-start)" (rad 84–91) skriver: *"modell/effort-
routingen per agent-spawn ... gäller från första väckning — fulltext i
session-startens sub-discipliner (orkestrerar-rollen +
parallellitets-detektion)."* Detta är en POINTER, inte en kopia av
tabellen. Att invokera `session-resume`-skillen laddar INTE automatiskt
`session-start/SKILL.md`s innehåll i samma steg — de är två separata
filer, och ingenting i harnessets skill-mekanik kedjar dem ihop
automatiskt (verifierat mot hur denna sessions egna Skill-anrop fungerar:
varje `Skill`-anrop returnerar bara DEN skillens egen instruktionstext).

**Detta är exakt samma riskform som T126,** fast på en annan regel i samma
skill-par. Skillnaden mot ägarlappen (E10/G5, se "Redan fixad instans"
nedan) är att ägarlappen FICK sin inline-fix efter en mätt incident (S93)
— routing-tabellen fick det inte, trots att den citeras i SAMMA mening som
ägarlappens rubrik ("Orkestrerar-roll + parallellitet — samma discipliner
som session-start").

### Fynd 2 — Parallellitets-detektionens signal 2–4 (E4) är pointer-refererad, inte inlinad, i `session-resume`

`session-start/SKILL.md` § "Sub-disciplin — parallellitets-detektion" (rad
62–76) definierar FYRA signaler för att upptäcka en parallell session
(ägarlapp, `git worktree list`, annat aktivt dok, smutsigt huvudträd) och
det FULLA svarsprotokollet: *"Träff → rapporteras som FYND i RAPPORTERA
med förslaget att denna session tar egen worktree ... frågan åker i
sessionsstartens befintliga kvittens-utbyte."*

`session-resume/SKILL.md` inlinar BARA signal 1 (ägarlappen, G5) i sin
helhet — uttryckligen och medvetet, med en förklarande kommentar om VARFÖR
(S93-incidenten). Signal 2–4 (worktree-listan, annat aktivt dok, smutsigt
träd) och framför allt det GEMENSAMMA svarsprotokollet ("detektera +
fråga, aldrig tyst auto-isolering") finns BARA som samma pointer-mening
som Fynd 1 delar. En resumead session som stöter på signal 2, 3 eller 4
(men inte signal 1) har alltså ingen inlinad vägledning för hur den ska
reagera — bara en hänvisning till en fil den kanske aldrig läser.

Detta är samma rotorsak som Fynd 1 och sitter i samma mening i
källfilen, men är en DISTINKT regel (vilken signal som helst utom
ägarlappen kan trigga utan att protokollet finns tillgängligt) — därför
eget kort, per uppdragets "ett kort per riskregel".

### Fynd 3 — Rött-först/TDD-bevisformen saknar bärare i `bygg-agent.md`

`CONTRIBUTING.md` § "Rött-först — bevisformen" (B12, rad 679–686) slår
fast: *"Rött-först är obligatoriskt för produktkod: testet skrivs och körs
RÖTT lokalt FÖRE den gröna koden."* Regeln är ovillkorlig — den gäller
"produktkod", inte bara en specifik exekveringsväg.

Regeln har TVÅ existerande bärare: `CONTRIBUTING.md` självt (svag dörr,
ingen läs-ordning pekar dit) och `do-work/SKILL.md` steg 4 (I4, rad
39–44): *"bygg test-först i vertikala snitt (ett beteende → rött test →
minsta gröna kod → nästa ...)."* Men `bygg-agent.md` —
enligt sin egen `description` agenten för **"ALLT arbete som skriver till
repot och landar i en commit — skivor, fynd-kort, refaktoreringar,
CI-ändringar"** — nämner INGENTING om rött-först, TDD, eller
test-innan-kod. Verifierat med `grep -ni "rött\|TDD\|test-först" CLAUDE.md
.claude/agents/bygg-agent.md`: enda träffen i CLAUDE.md är ordet "RÖTT"
i en CI-status-kontext (checkarnas färg), obesläktad med TDD-regeln;
bygg-agent.md gav noll träffar.

**Sekvensen förstärker fyndet:** `task-36.6` (Done, 2026-07-23/24)
etablerade rött-först-bevisformens NUVARANDE hemvist i `CONTRIBUTING.md`
och hade som AC #6 uttryckligen: *"Bidragsguiden speglar den nya
bärarformen så att regeln är läsbar där arbetet faktiskt görs."*
`bygg-agent.md` skapades FYRA DAGAR SENARE (2026-07-28, commit `b8ef2f55`)
som en ny, separat exekveringsväg för backlog-kort — och ärvde aldrig
regeln. `bygg-agent.md`s "Läs innan du designar" (rad 30–38) listar inte
ens `CONTRIBUTING.md` som obligatorisk läsning.

Detta korts EGEN DoD (kort-buren) har heller ingen TDD-punkt: de fyra
generiska DoD-posterna (AC bockade, rörd fil-klass grindar gröna, CI grön
per jobb, inga orelaterade filer) säger inget om rött-först. Regeln
saknar alltså bärare på ALLA fyra axlar för en bygg-agent-exekverad
produktkod-skiva: inte mekanisk, inte kort-buren, inte alltid-laddad, och
startdörrs-bunden bara till en skill (`do-work`) som `bygg-agent`-vägen
aldrig anropar.

### Redan fixad instans (facit-exempel, ingen risk, ingen ny åtgärd)

`session-start/SKILL.md`s ägarlappsregel (E10) hade EXAKT samma
riskstruktur som Fynd 1/2 tills S93-incidenten (2026-08-05) exponerade
den: en resume-session laddade aldrig `session-start.md` och stoppade allt
arbete för att fråga Marcus om något den redan hade fullt mandat att
avgöra. Fixen var att INLINA regeln fullt ut i `session-resume/SKILL.md`
(G5), med en explicit kommentar om varför ("regeln bodde en gång bara
här ... läs inte vidare någon annanstans"). Detta är bevis på att
mönstret bakom Fynd 1–2 är KÄNT och har en etablerad fix-form redan
— den har bara inte applicerats konsekvent på routing-tabellen och
signal 2–4.

---

## § 5 — Övervägt men INTE mintat som kort

Registreras öppet per ADR-053/triage-disciplinen — förkastat, inte tyst.

**Push-kadensen (B6) saknar bärare, men hemvistet är redan bokat.**
`CONTRIBUTING.md` § "Push-kadensen" har ingen mekanisk, kort-buren eller
alltid-laddad motsvarighet — precis den typ av gap denna inventering
letar efter. Men `task-149.5` ("Skiva: push-ekonomins kodifiering") är
PRD `task-149`s egen sjunde skiva och existerar uttryckligen för att lösa
detta ("Hemvist: CONTRIBUTING § Landnings-ordningen + kort pekare i
CLAUDE.md"). Att minta ett nytt fynd-kort här hade varit en nästan exakt
dubblett av en redan planerad, godkänd skiva. Bokförs i tabellen (B6) med
klassningen "saknar bärare", men genererar inget nytt kort — samma
undantagslogik som prototype § 5/T126.

**Divergensen mellan `do-work`s CI-vakt-som-bakgrundstask (I7) och
`bygg-agent.md`s förbud mot bakgrundsvakt+väntan (C11–C12) övervägdes som
en fjärde risk-kandidat, men avfärdas.** `do-work` kör i HUVUDSESSIONEN
(samma harness-kontext som kan ta emot Monitor-callbacks och
bakgrunds-notifikationer), medan `bygg-agent` är en SPAWNAD SUBAGENT där
`bygg-agent.md` självt citerar ett empiriskt bevisat harness-faktum
(`L340`): "Monitor-verktygets callback levereras ALDRIG till en
subagent." De två reglerna är alltså inte motsägande — de är korrekt
anpassade till olika harness-kapabiliteter för sina respektive
exekveringsvägar. Detta är en skillnad grundad i verifierad
plattformsbegränsning, inte en tyst regressions-risk. Registrerat här
enligt "förkasta aldrig tyst", men inget kort mintas eftersom ingen
verklig divergens föreligger vid närmare granskning.

---

## § 6 — Mintade fynd-kort

Tre kort skapade via `npx backlog task create`, UTAN triage-etikett
(oplockbara tills Marcus klassar dem — dessa är designöppna frågor, inte
färdigspecade fixar; se § 3.3-resonemanget i `do-work/SKILL.md`, I8).
Numren `TASK-150`–`153` visade sig under passet redan vara tagna av en
helt orelaterad triage ("uppdrag 3-triagen": larmtext, backlog-städ,
grenstädning — se § 0) som landade på `origin/main` medan detta pass
pågick; backlog-CLI:t hoppade automatiskt vidare till nästa lediga:

| Kort | Titel | Regel i denna karta |
|---|---|---|
| `TASK-154` | Fynd: modell/effort-routing-tabellen är pointer-refererad, inte inlinad, i session-resume | Fynd 1 (E3) |
| `TASK-155` | Fynd: parallellitets-detektionens signal 2–4-protokoll saknar inline-täckning i session-resume | Fynd 2 (E4) |
| `TASK-156` | Fynd: rött-först/TDD-bevisformen saknar bärare i bygg-agent.md | Fynd 3 (B12/I4) |

---

## Källförteckning

- `CLAUDE.md` (spoke, commit `1026fd12`)
- `CONTRIBUTING.md` (spoke, commit `1026fd12`)
- `.claude/agents/bygg-agent.md`, `.claude/agents/research-pass.md`
- `~/.claude/plugins/cache/marcus-hub/marcus-system/1.29.0/skills/{session-start,session-paus,session-resume,session-end,do-work,work-batch,prototype,grilling,to-prd,to-issues}/SKILL.md`
- `~/.claude/plugins/cache/marcus-hub/marcus-system/1.29.0/output-styles/code-rollen.md`
- `~/.claude/plugins/installed_plugins.json` (versionsbekräftelse)
- `tasks/lessons.md` L147 (`tasks/lessons.md:2298`)
- `tasks/threads/T126-arbetsformens-leveransvag.md`
- `backlog/tasks/task-149*` (PRD + syskon-skivor, statuskontroll)
- `backlog/tasks/task-36.6` (rött-först-bevisformens ursprung, Done)
- `.frontmatter-policy.conf`, `.markdownlint-cli2.jsonc` (dokumentkonventioner)
- Marcus personliga `~/.claude/CLAUDE.md` (empirisk källa för
  alltid-laddad-klassningens verifiering, denna sessions egen systemprompt)
