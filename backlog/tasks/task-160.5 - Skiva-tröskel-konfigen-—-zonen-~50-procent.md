---
id: TASK-160.5
title: 'Skiva: tröskel-konfigen — zonen ~50 procent'
status: To Do
assignee: []
created_date: '2026-08-07 17:00'
updated_date: '2026-08-07 18:29'
labels:
  - ready-for-agent
dependencies:
  - TASK-160.2
parent_task_id: TASK-160
ordinal: 287000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en session som når zonen får sitt maskinella zonlarm (nekat auto-compact-försök med anvisning) vid ~50 procent i stället för vid klippan. Täcker användarberättelse: 1
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Auto-compact-tröskeln satt till ~50 procent via harnessets dokumenterade tröskel-miljövariabel i settings-miljöblocket — EFTER att PreCompact-grinden står (beroendet är säkerhetsordning: sänkt tröskel utan grind tidigarelägger okontrollerad kompaktering)
- [x] #2 Sessionsstart-kravet bokfört: miljövärdet biter först i session född efter ändringen — samma klass som hook-registrering; verifikatsvägen dokumenterad i kortet
- [ ] #3 Docs-grindarna gröna; PR armerad, per-jobb-grön
<!-- AC:END -->



## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PREMISS-PASS (AC1, variabelnamn): uppdragets kandidat CLAUDE_AUTOCOMPACT_PCT_OVERRIDE
finns INTE i förstapartsdok (verifierat via WebFetch mot code.claude.com/docs/en/settings.md
+ env-vars.md, 2026-08-07) — ingen procentbaserad override-variabel dokumenteras alls.
Den korrekta, redan i ADR-101 § Källmärkning citerade variabeln CLAUDE_CODE_AUTO_COMPACT_WINDOW
återverifierades oberoende samma pass: dokumenterad i env-vars.md som "Set the auto-compact
window in tokens, from 100000 to 1000000 ... Takes precedence over the /autocompact command,
the --autocompact flag, and the autoCompactWindow setting", settbar via settings.json "env"-
objektet (exempel i settings.md: "env": {"CLAUDE_CODE_AUTO_COMPACT_WINDOW": "500000"}).
Detta är TOKEN-baserat, inte procent-baserat — "~50 procent" uppnås genom att sätta värdet
till hälften av sessionens uppmätta totala kontextfönster (T111: 532 411/1 000 000 mätt via
transcript-JSONL:s usage.cache_read_input_tokens, dvs 1 000 000 tokens totalt på denna
Max-plan) => 500000. Ingen "STOPPA"-situation: belägg finns, bara för en annan (den redan
ADR-101-citerade) variabel än uppdragets kandidat-namn. Satt: .claude/settings.json
"env"."CLAUDE_CODE_AUTO_COMPACT_WINDOW" = "500000" (sträng, per dokumentationens krav på
rena heltalssiffror).

SESSIONSSTART-KRAVET (AC2, samma klass som hook-registrering — CLAUDE.md §
"En ny hook kan ALDRIG skarpbevisas i sessionen som byggde den"): env-blocket läses vid
processstart och biter INTE i byggsessionen som satte det. Första sessionen som kan bevisa
tröskeln skarpt är den som startar EFTER denna PR:s merge till main.

VERIFIKATSVÄG för nästa session (i den ordningen):
1. Snabb/indirekt: i en ny sessions Bash-verktyg, `echo "$CLAUDE_CODE_AUTO_COMPACT_WINDOW"`
   ska visa 500000 (env-blocket injiceras i alla subprocesser per settings.md).
2. Avgörande/naturligt: när den nya sessionens kontext växer till ~500 000 tokens (~50 %)
   försöker harnessen auto-kompaktera vid den sänkta tröskeln i stället för standardfönstret
   (grillningens observation: ~85-90 %, obelagd förstaparts per ADR-101). PreCompact-hooken
   (TASK-160.2, redan landad på main, PR #943/30661d28) ska då neka med trigger="auto" och
   visa anvisningstexten "COMPACT-FORMEN (ADR-101) — okontrollerad kompaktering nekas". Denna
   nekning ÄR zonlarmet (ADR-101 § Beslut 2) — det skarpa beviset att tröskel och grind
   samverkar, utan att någon läser statusraden.
3. Bieffekt att notera, INTE ett fel: enligt env-vars.md slutar statusradens used_percentage
   indikera exakt när kompaktering triggas efter att denna variabel satts ("The status line's
   used_percentage always measures against the model's full context window, so once this
   variable is set, that percentage no longer indicates when compaction will run") — så
   statusraden ensam kan INTE användas för att verifiera tröskeln. Punkt 2 (den faktiska
   nekningen) är den enda tillförlitliga signalen — vilket för övrigt är precis ADR-101 §
   Beslut 2s poäng (ingen läsning av statusraden krävs).

BEROENDE-VERIFIKAT (premiss-pass, dep-check): scripts/deny-precompact.sh + PreCompact-
registreringen i .claude/settings.json bekräftade på origin/main (git cat-file -e +
grep mot origin/main:.claude/settings.json, 2026-08-07) — PR #943, merge-commit 30661d28,
feat-commit cd8dbf34. Säkerhetsordningen (grind före sänkt tröskel) håller.

VÄRLDSSTATE-DIVERGENS (ADR-086): byggagentens ursprungliga worktree-gren
(worktree-agent-ae79cf5b445ed74ea) var 7 commits bakom origin/main OCH stod ovanpå
kommittat men OÖPPNAT-mot-main innehåll (två docs-commits som redan fanns på öppen,
ej mergad PR #947 "docs(backlog): [S99] 160.2 + 160.3 Done efter verifikat"). Denna
skivas kod byggdes därför på en NY gren grenad direkt ur origin/main (efter git fetch),
inte ovanpå den ursprungliga worktree-branchen, för att undvika att blanda in PR #947:s
orelaterade kortstängningar i denna PR:s diff.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
