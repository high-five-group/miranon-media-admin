---
id: TASK-149.3
title: 'Skiva: arbetsform-tillståndsfilen + push-hooken'
status: In Progress
assignee: []
created_date: '2026-08-07 10:30'
updated_date: '2026-08-07 11:44'
labels:
  - ready-for-agent
dependencies:
  - TASK-149.1
references:
  - docs/decisions/ADR-097-arbetsformens-tillstandsbarare.md
  - tasks/threads/T126-arbetsformens-leveransvag.md
  - scripts/deny-subagent-vantan.sh (F5/F6-scopningsmönstret)
  - scripts/deny-frammande-huvudkatalog.sh (cwd-mönstret
  - § ÄGARSKAP-TAGANDE)
  - scripts/deny-grind-genom-pipe.sh (kommando-position-mönstret)
  - code.claude.com/docs/en/hooks.md (cwd + tool_input.command
  - premiss-passet)
modified_files:
  - .claude/settings.json
  - .github/workflows/ci.yml
  - .gitignore
  - .arbetsform-push-policy.conf
  - scripts/arbetsform-tillstand.sh
  - scripts/deny-arbetsform-push.sh
  - scripts/test-deny-arbetsform-push.sh
parent_task_id: TASK-149
ordinal: 257000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en utförare i iterationsläge som försöker pusha stoppas i handlingsögonblicket med anvisningen lokal-commit-per-varv, oavsett vilken väg den kom in i arbetet; normalflödet utan tillståndsfil träffas aldrig. Täcker användarberättelser: 1, 2, 3, 8
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Premiss-pass mot live: PreToolUse-hook-indatans form för Bash-anrop verifierad mot aktuell harness-version; tillståndsfilens per-worktree-synlighet för hooken bevisad med minimalt test FÖRE full implementation
- [x] #2 Tillståndsfil-konventionen: otrackad per-arbetsträd-fil (gitignore-post), innehåll arbetsform + tidsstämpel + sättare; skript i scripts/ med universell logik, värden i policy-konfig
- [x] #3 PreToolUse-hook på Bash git push: nekar med anvisning när iterationsläge råder; frånvaro av fil = släpp igenom; fail-closed på korrupt fil; registrerad i .claude/settings.json
- [x] #4 Tvåsidig testsvit i deny-familjens form: fäller/släpper/fail-closed; shellcheck-strict grön
- [x] #5 Skarpbeviset bokfört som ÖPPEN SKULD i kortet och slutrapporten — aldrig rapporterat som taget
- [ ] #6 PR armerad, per-jobb-grön
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PREMISS-PASS (AC 1) — MÄTT DIVERGENS mot uppdragets ordalydelse: uppdraget
bad om en tillståndsfil "läsbar för ett hook-skript som körs via
${CLAUDE_PROJECT_DIR:-.}". Minimaltest visade motsatsen: en redan LADDAD hook
(deny-grind-genom-pipe.sh) triggades från denna worktree-isolerade
byggsession med ett harmlöst nekat kommando; dess fällnings-logg
(${CLAUDE_PROJECT_DIR:-.}/.claude/hook-fallningar.jsonl) landade i
HUVUDKATALOGENS .claude/, INTE i byggagentens egen worktree.
${CLAUDE_PROJECT_DIR:-.} resolvar alltså till huvudkatalogen oavsett anropande
arbetsträd — INTE per-arbetsträd. En kastbar test-worktree (git worktree add)
bekräftade motsatsen för hook-JSONs cwd-fält: git -C <worktree>
rev-parse --show-toplevel gav den worktreens EGEN rot, och en otrackad
markörfil där var läsbar DÄRIFRÅN men existerade INTE i huvudkatalogen
(worktreen städad efteråt). scripts/deny-frammande-huvudkatalog.sh använder
redan exakt detta cwd+git-rev-parse-mönster (rad ~452-457) — produktions-
bevisat i samma repo. Hooken byggdes därför mot cwd (hook-JSON), INTE
CLAUDE_PROJECT_DIR, för allt som rör tillståndsfilens plats — divergensen är
INTE blockerande (välprecedenterad lösning i samma repo, inget Marcus-
vägval krävs) och är fullt dokumenterad i scripts/deny-arbetsform-push.sh
eget huvud, avsnittet PREMISS-PASSET.

Bugg fångad av EGEN testsvit under bygget: hooken kontrollerade ursprungligen
policyfilens existens FÖRE tillståndsfilens existens — en trasig policy hade
kunnat neka en VANLIG push utan någon aktiv tillståndsfil alls, vilket bryter
AC 3s krav "frånvaro av fil = släpp igenom". Omordnat så frånvaro-kontrollen
alltid kommer FÖRE policy-beroende fail-closed-grenar (F9/F10 i testsviten).

SKARPBEVIS ÄR EN ÖPPEN SKULD (CLAUDE.md, avsnittet "En ny hook kan ALDRIG
skarpbevisas i sessionen som byggde den"): scripts/deny-arbetsform-push.sh
registrerades i .claude/settings.json i SAMMA session som byggde den och tas
därför INTE i bruk förrän nästa session laddar om filbevakningen. Bevisat i
BYGGSESSIONEN: (1) tvåsidig testsvit scripts/test-deny-arbetsform-push.sh,
25/25 gröna (D1-D6 fäller i sex push-FORMER, A1-A7 släpper, F1-F6 fail-open
unscoped, F7-F11 fail-closed scopat, E1 exit==2) och (2) manuell körning av
skriptet mot syntetiska hook-JSON på kommandoraden i denna worktree — push
NEKAD med iteration aktiv, SLÄPPT efter rensning, samtliga tre push-FORMER
(direkt, kedjad, inbäddad) NEKADE. INTE bevisat: att en LADDAD hook i en
LEVANDE session faktiskt fyrar och blockerar ett riktigt push-anrop. BETALAS
som en av nästa sessions första handlingar med samma differentialmätning som
TASK-148.2s skuld (ADR-087/L370-receptet): provocera denna hook OCH en redan
laddad hook (till exempel deny-grind-genom-pipe.sh) parallellt med identisk
hook-JSON — fäller den redan laddade men inte denna, är det registrerings-
fördröjningen, inte logiken.

Incidentell rättelse i samma commit: .github/workflows/ci.yml (rad ~1060)
hade en inledande "N sourced-config-filer"-kommentar som redan var stale
(stod "17" sedan före TASK-148.2, som förde totalen till 18 utan att
uppdatera DEN raden) — rättad till "19" i samma andetag som den 19:e filen
lades till, för att inte upprepa TASK-106-klassens kopierade-tal-drift.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
