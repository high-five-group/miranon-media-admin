---
id: TASK-250
title: 'Backlog-CLI:ts gren-skanningslast under fleet-drift — permanent väg väljs'
status: Done
assignee: []
created_date: '2026-08-17 01:20'
updated_date: '2026-08-17 08:16'
labels:
  - ready-for-agent
dependencies: []
ordinal: 456000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
S102 punkt 5 (pausens resume-sekvens). Två sessioner har nu betalat lasten live: task-238 (grindens 164 s) och S102-resumen (orkestrator-edit dog på 2-minuterstaket medan parallell agents CLI-anrop malde — två processer × ~25 grenar). ROOT_CONFIG-mönstret (scripts/check-backlog-closure.sh §3) är beprövad interimsväg; detta kort väljer och mekaniserar den PERMANENTA formen. Källor: task-238-kortets notes, docs (S102 sessionsdok Del 14), CLAUDE.md § Kortnummer.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Mätserien konsoliderad i kortet: task-238:s A/B (view 28,5→1,96 s) + S102-liveinstansen 2026-08-17 (task edit >120 s timeout under fleet-last → 3,4 s via ROOT_CONFIG) + antal aktiva grenar vid mätning
- [x] #2 Lösningsrymden prövad mot mätning och EN väg vald med belägg: (a) check_active_branches av permanent + annan kollisionsvakt, (b) ROOT_CONFIG-mönstret breddas till standard-wrapper för ALLA icke-create-anrop, (c) wrapper-skript i scripts/, (d) uppströms-issue till backlog.md — vald väg mekaniserad, inte prosa
- [x] #3 task create-vägen behåller gren-skanningen (nummer-allokeringen) oavsett vald väg — kollisionsskyddet TASK-93 får aldrig försvagas
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MÄTSERIEN (AC1) — konsoliderad, samtliga tal med sitt kommando.

Kontext vid mätning 2026-08-17 (denna maskin, 16 kärnor): 43 git-refs totalt (24 remote + 19 lokala), och SAMTLIGA 43 ligger inom active_branch_days=30 — CLI:t skannar alltså hela mängden. Lugn last (load avg 4,68 fallande till 3,05).

A/B, gren-skanning PÅ mot AV (tre körningar per punkt):
  task list --json   7,83 s / 6,61 s  ->  2,11 s / 1,59 s   (~3,7-4,2x)
  task view          8,94 s / 7,63 s  ->  2,76 s / 2,10 s   (~3,2-3,6x)
  task edit          16,00 s uppmätt med skanning PÅ under lugn last

Ärvda tal, källmärkta: task-238:s A/B (view 28,5 -> 1,96 s) mättes 2026-08-16 vid ett annat grenantal och en annan last — den är INTE jämförbar med serien ovan och återges som historik, inte som mätpunkt. S102-liveinstansen (task edit >120 s timeout under fleet-last -> 3,4 s via ROOT_CONFIG) kom obelagd i uppdraget och har INTE kunnat reproduceras av mig; den står kvar som orkestrerarens observation, inte som mitt mätvärde. Mitt eget belägg för samma klass: ett npx backlog task 250 --plain i denna session översteg 180 s och konverterades till bakgrund.

TASK-238:s O(n^2)-fynd hör till samma subsystem men är en ANNAN axel och löstes där: task view kostar linjärt i katalogens storlek (0,471 s vid 10 kort -> 2,654 s vid 502), vilket gjorde grindsvepet kvadratiskt. Gren-skanningen kostar i VARJE anrop oavsett katalogstorlek.

LÖSNINGSRYMDEN PRÖVAD (AC2):
(a) check_active_branches av permanent + annan kollisionsvakt — FÖRKASTAD. Stänger av skyddet även för create, vilket AC3 förbjuder.
(b) ROOT_CONFIG breddat till standard för alla icke-create-anrop — FÖRKASTAD I DEN FORMEN. backlog.config.yml i projektroten är en FAST, DELAD sökväg; två samtidiga anrop i samma träd trampar på varandra. Grinden löser det genom att vägra köra om filen finns (fail-closed) — rätt för en grind, oanvändbart för ett vardagskommando i en fleet.
(c) wrapper-skript i scripts/ — VALD, men implementerad med BACKLOG_CWD-isolering i stället för rot-fil-mutation.
(d) uppströms-issue till backlog.md — kvarstår öppen, löser inget idag.

VALD VÄG, MEKANISERAD: scripts/backlog-cli.sh, exponerad som `npm run bl`. Allokerande anrop (create någonstans i argumenten) går igenom ORÖRDA med full gren-skanning; allt annat körs mot en isolerad projektrot — temporär katalog med egen backlog.config.yml och symlänk till repots riktiga backlog/, utpekad via CLI:ts BACKLOG_CWD.

VERIFIERAT LIVE 2026-08-17: config get checkActiveBranches läser false; task list --json ger alla 502 riktiga kort BYTE-IDENTISKT med ett rakt anrop (diff -q rent); task <id> --plain likaså byte-identiskt; en task edit SKRIVER igenom symlänken till den riktiga kortfilen (prövat mot kastbart substrat, aldrig mot repots kort). Projektroten lämnas ren och backlog/config.yml är byte-identisk efteråt — ingen delad muterbar fil, alltså fleet-säkert där ROOT_CONFIG inte är det. backlog config set används aldrig (mätt förlustfull vid round-trip).

CREATE-VÄGEN BEVARAD (AC3): create passerar orört och behåller full gren-skanning. Fail-safe-riktningen är utskriven och testad: träffas ordet create som ett VÄRDE (task edit 5 --title create) går anropet också igenom orört — ett långsammare anrop, aldrig ett oskyddat. backlog/config.yml (TASK-93-flaggan) rörs aldrig av wrappern.

EN FÄLLA HITTAD OCH LAGAD UNDER BYGGET: CLI:t skriver ut den sökväg det löste igenom (File: ...), vilket blev isolerings-katalogens — en katalog som är RADERAD när anropet returnerat. En läsare som kopierade den hade fått en död sökväg. Utdatan pekas nu tillbaka på det riktiga trädet, men bara när stdout inte är en terminal (CLI:ts interaktiva lägen måste äga terminalen själva); exitkoden fångas separat och returneras oförvanskad (L440).

BEVIS I BÅDA RIKTNINGAR: scripts/test-backlog-cli.sh, 16 fall i par — W1-W4 att create BEHÅLLER skanningen (inkl. fail-safe-fallet), W5-W8 att övriga anrop isoleras och ser de riktiga korten, W9 att backlog/config.yml är byte-identisk efteråt, W10 att projektroten lämnas ren, W11 att isolerings-katalogen städas, W12-W13 att exitkoder går igenom oförvanskade i BÅDA vägarna, W14 fail-closed vid saknad binär, W15-W16 sökvägsomskrivningen och att den inte rör rader den inte ska. CI-wirad i ci.yml bredvid de övriga grind-sviterna.

VAD SOM INTE ÄR MEKANISERAT, MED AVSIKT: adoptionen är en KONVENTION, inte en spärr. Wrappern finns och är testad, men inget hindrar ett direktanrop till binären. En PreToolUse-hook som avvisar eller skriver om direktanrop vore möjlig — den berör varje agents verktygsyta i repot och är ett Marcus-beslut, inte något en bygg-agent inför på eget bevåg. Bokförd öppet i ADR-117 § Vad som INTE är mekaniserat i stället för att smygas in eller utelämnas.

GRINDAR: shellcheck --severity=style --enable=all exit 0 · actionlint -color -ignore (CI:s exakta form) exit 0 · npm run verify:ci-parity --list exit 0 (paritets-preflight grön, ci.yml-raden plockas upp automatiskt) · scripts/test-backlog-cli.sh 16 passerade 0 failade · npm run check:docs exit 0.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
STÄNGNING (orkestreraren, 2026-08-17): PR #1505 MERGED 08:15:42Z via merge-kön, per-jobb-checks gröna — DoD betald. Permanent väg vald med belägg: variant (c), wrapper-skript scripts/backlog-cli.sh (npm run bl) med BACKLOG_CWD-isolering (7,63 → 2,10 s, byte-identisk utdata); (b):s rot-fil förkastad som ej fleet-säker (fast delad sökväg). task create-vägen passerar orörd — TASK-93-skanningen intakt (AC3, testad W1–W4). Öppet kvarstående beslut åt Marcus: mekanisering av wrapper-adoption via PreToolUse-hook (rör varje agents verktygsyta) — bokfört i ADR-117 § Vad som INTE är mekaniserat.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
