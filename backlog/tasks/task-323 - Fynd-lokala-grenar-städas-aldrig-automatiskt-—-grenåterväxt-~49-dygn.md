---
id: TASK-323
title: 'Fynd: lokala grenar städas aldrig automatiskt — grenåterväxt ~49/dygn'
status: To Do
assignee: []
created_date: '2026-08-26 04:47'
updated_date: '2026-08-28 03:39'
labels:
  - fynd
  - ready-for-agent
dependencies: []
ordinal: 596000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-310 (Done 2026-08-24) städade 289 -> 54 lokala grenar. Källmärkt (S112 resume 1, 2026-08-26): mätt i denna session, git branch --list mot huvudkatalogen (huvudkatalogens delade grenlista) gav 178 lokala grenar just nu — högre än forskningspassets 156 (docs/research/backlog-kortskapandets-flaskhals-2026-08-26.md paragraf Återväxten, rad 249-255), konsistent med samma dokuments uppmätta nettotillväxt ~49 grenar/dygn (156 var 152 vid passets start, fyra nya under passets gång). git worktree remove rör aldrig grenen själv (bara worktree-kopplingen), så borttagna worktrees lämnar grenarna kvar. scripts/stada-grenar.sh VERIFIERAT existerande på disk (13533 bytes, körbar) men är INTE wirad till någon trigger — bekräftat av forskningsdokets egen rekommendation (paragraf Rekommendation, steg 1.3): 'Wira stada-grenar.sh till en automatik (post-merge eller nattlig). Skriptet finns och är testat; det saknar bara en trigger.' Grenpopulationens tillväxt äter kostnaden av check_active_branches-flaggan (TASK-93) inom två dygn per samma dokument.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 mekaniserad trigger vald med motiv (post-merge-hook, worktree-remove-städsteg i orkestrerar-svepet, eller heartbeat) — bara MERGADE grenar städas, aldrig -D på ej mergade
- [ ] #2 mätserie före/efter bokförd i kortet (grenantal vid start, grenantal efter aktivering, mätt över minst ett dygn)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## TRIGGER-VALET (AC #1): heartbeat-svepets femte väg

VALD: scripts/heartbeat-svep.sh anropar scripts/stada-grenar.sh --utfor på ett
eget, glest intervall (HEARTBEAT_STADA_GRENAR_INTERVALL=1800 i
.heartbeat-svep-policy.conf; 0/osatt = AV, fail-closed i skriptet).

De fyra kandidaterna, prövade mot mätning i stället för smak:

- post-merge-hook — AVFÄRDAD, två oberoende skäl. (1) `post-merge` fyrar bara
  när ett LOKALT `git merge`/`git pull` faktiskt kör (git-scm.com/docs/githooks,
  verbatim: "invoked by git-merge, which happens when a git pull is done on a
  local repository"). Våra merges sker på GitHubs servrar via merge queue —
  ingen lokal merge inträffar, så hooken fyrar aldrig av landningen. (2) Repot
  har EN hook (.githooks/pre-commit, disk-verifierat 2026-08-28) och
  `core.hooksPath` skrivs om av Claude Code vid VARJE worktree-skapelse (T121)
  — hook-vägen är strukturellt opålitlig just här.
- nightly.yml (CI) — AVFÄRDAD, fysiskt omöjlig. Lokala grenar finns bara i
  Marcus klon; en GitHub-runner klonar färskt och ser dem aldrig.
- worktree-remove-städsteg — AVFÄRDAD för denna landning. stada-worktrees.sh bor
  i marcus-hub-pluginet (annat repo, utanför denna diff), fyrar bara vid
  paus-svep (sällan), och städar bara de grenar en worktree den tar bort råkar
  hålla — aldrig grenar som aldrig hade en worktree.
- heartbeat — VALD. Den enda mekanism som redan är PERSISTENT igång exakt när
  grenarna växer. Återväxten (~49/dygn) produceras av fleeten, och en fleet
  förutsätter en orkestrerare — som kör detta svep. Korrelationen ÄR argumentet:
  städningen är aktiv precis under de timmar skulden byggs, och sover när ingen
  bygger den. Svepets main-SHA-väg gör den dessutom till den funktionella
  motsvarigheten till en post-merge-hook i ett flöde där merges sker på servern.

Tidsbaserad glesning, inte knuten till main-avancemang: avancemanget vore
semantiskt precisare men vinsten marginell (grenar mergas löpande), kostnaden en
extra tillståndskoppling mellan två oberoende vägar. Över-engineering-vakten.

## BRANSCHRESEARCH (designkrav e) — primärkällor

- `git maintenance` KAN INTE ta bort grenar. Dess uppgiftslista (git-scm.com/
  docs/git-maintenance) är commit-graph, prefetch, gc, loose-objects,
  incremental-repack, pack-refs, reflog-expire, rerere-gc, worktree-prune —
  ingen rör refs/heads/*. Schemaläggare: launchctl (macOS), systemd user timers
  (Linux), schtasks (Windows). Det är ett LOAD-BEARING negativt fynd: den enda
  OS-schemalagda git-mekanismen utesluter medvetet gren-radering.
- git-trim (github.com/foriequal0/git-trim) hanterar merge/rebase/SQUASH via
  commit-tree + `git cherry` (patch-ID-ekvivalens, inte ancestry). Manuellt CLI,
  ingen shippad automatik; READMEn föreslår en post-merge-hook användaren
  själv monterar.
- GitHubs "Automatically delete head branches" rör bara REMOTE (github.blog/
  changelog/2019-07-30). GitHub Desktop 2.1 prunar lokala grenar först EFTER att
  fjärrgrenen försvunnit (github.blog/changelog/2019-07-02) — automatik ovanpå
  serverinställningen, Desktop-specifik, otillgänglig för ett CLI-flöde.
- Graphite `gt sync` PROMPTAR som default (graphite.com/docs/command-reference);
  -d/--delete-all krävs för tyst radering. Alltid manuell invokation.
- Ingen `post-fetch`-hook existerar (git-scm.com/docs/githooks).
  `git fetch --prune`/`git remote prune` tar bort remote-tracking refs
  (refs/remotes/*), ALDRIG lokala grenar (refs/heads/*) — den distinktionen är
  precis varför TASK-310:s fjärr-pruning gav ~0 effekt.

SYNTES: branschens dominerande trigger-klass är MANUELL CLI-invokation. Ingen av
de undersökta shippar en daemon för gren-radering. Vår heartbeat-koppling går
alltså längre än branschstandard — motiverat av att vår återväxt (~49/dygn) är
maskingenererad, vilket ingen av förlagorna har.

## DESIGNKRAV (c) — DOMEN: inget lås, och skälet är strukturellt

Frågan var om städningen måste undvika pågående gren-skanning. Mekanismen är nu
exakt känd (extraherad ur node_modules/backlog.md-darwin-x64/backlog):
Backlog.md tar ett fingeravtryck av aktiva gren-refs FÖRE varje laddning,
jämför efter, och RETRYAR vid ändring — först på tredje störda försöket kastas
"Active branch refs or configuration kept changing while tasks were loading".
(Uppdraget citerade strängen utan "or configuration" — verbatim ovan.)

Risken är alltså VERKLIG men kräver att alla tre försöken störs. Inget lås
byggs, av tre skäl:
1. En ID-KOLLISION är strukturellt omöjlig oavsett timing. Skriptet rör bara
   grenar MERGADE i bas-grenen, och ett mergat korts fil ligger redan i
   backlog/tasks/ på main — alltså i filsystemet. Gren-skanningen finns för att
   hitta kort på ICKE-landade grenar; de rörs aldrig.
2. Fönstret är glest (default var 30:e minut) och krymper med grenantalet.
3. Ett lås mot ett CLI som inte känner till vårt lås är inte byggbart utan att
   wrappa varje backlog-anrop i repot — en långt större yta än problemet.

## MÄTSERIE (AC #2 — STARTPUNKT, ej dygnsmätningen)

Skarpkörning från bygg-worktreen 2026-08-28 05:34 (Marcus GO via orkestrerare):

| Mått | Värde |
|---|---|
| Lokala grenar FÖRE | 203 |
| Totalt (git branch -a) FÖRE | 232 |
| Lokala grenar EFTER | 41 |
| Totalt EFTER | 71 |
| Raderade | 162 |
| Skonade | 41 |
| Körtid | 39,16 s |
| loadavg (1 min) före/efter | 54,85 / 38,91 |

Skonade-orsakerna bevisar alla fyra skydd skarpt: 20 ej mergade, 19 uppcheckade
i en worktree, 1 bas-gren, 1 aktuell gren. Noll `-D`.

Återväxten bekräftad i realtid under passet: 192 lokala kl 05:16 → 193 kl 05:24
→ 203 kl 05:34. Elva grenar på ~18 minuter med aktiv fleet.

Torrkörnings-kostnaden som motiverar glesningen: 23,4 s över 193 grenar
(exit 0, 157 kandidater). Vid svepets eget 90 s-intervall hade det ätit ~26 %
av varje cykel och fördröjt larm.

EJ TOLKBAR MÄTNING, bokförd ärligt: `task list --plain` rakt mot binären gav
45,7 s vid 41 grenar — HÖGRE än TASK-310:s 18,57 s vid 54 grenar. Men loadavg
var 42–70 här mot 5–15 då. Lasten dominerar; talet kan INTE läsas som en
grenantals-funktion och används därför inte som belägg åt någotdera hållet.

AC #2 lämnas OBOCKAD: dygnsmätningen ("minst ett dygn") kan en bygg-agent inte
utföra. Orkestreraren tar slutmätningen efter att triggern gått ett dygn.

## BEVIS I BÅDA RIKTNINGAR

scripts/test-heartbeat-svep.sh: 52 passerade, 0 failade (exit 0). Nio nya fall
(T28–T36 + T24c). Fyra mutationer bevisar att sviten FÄLLER:
- `--utfor` borttaget → T36b fäller (51/1)
- `--ingen-fetch` tillagt → T36c fäller (51/1)
- städningen ges en exit-bit → T32 (exit 8 ≠ 0) OCH T33 (exit 9 ≠ 1) fäller (50/2)
- glesningsspärren borttagen → T29 + T29b fäller (50/2)
Skriptet återställt byte-identiskt efter varje mutation (diff -q, exit 0).

shellcheck 0.11.0 (samma version CI pinnar) --severity=style --enable=all mot
scripts/heartbeat-svep.sh, scripts/test-heartbeat-svep.sh och
.heartbeat-svep-policy.conf: exit 0.
<!-- SECTION:NOTES:END -->
