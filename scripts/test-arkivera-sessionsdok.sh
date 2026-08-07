#!/usr/bin/env bash
# test-arkivera-sessionsdok.sh — tvåsidigt bevis för arkivera-sessionsdok.sh
# (TASK-158.2 AC #5).
#
# Ett grönt utfall som bara visar att arkiveringen FLYTTAR bevisar ingenting:
# den farliga riktningen är att den flyttar/skriver om för mycket, eller för
# lite (en flyttad fil vars inkommande länkar INTE skrevs om — en transient
# bruten länk, exakt vad AC #3 förbjuder). Testet bygger därför ett
# engångsrepo under mktemp med sju dokument som tillsammans täcker samtliga
# fyra skydd + fönsterlogiken + båda länk-omskrivningspassen:
#
#   session-1   closed, session-1     äldst, UTANFÖR fönstret (N=3) → SKA ARKIVERAS
#   session-2   closed, session-2     inom fönstret                → SKA STANNA
#   session-3   closed, session-3     inom fönstret, citerar session-1
#                                     i prosa OCH via tasks/sessions/-
#                                     prefixad form                → Pass A-mål
#   session-4   closed, session-4     inom fönstret, bara-relativ
#                                     länk "](2026-06-01-session-1.md)"
#                                     till session-1                → Pass B-mål
#   session-5   active                oavsett ålder                → SKA STANNA
#   session-6   paused                oavsett ålder                → SKA STANNA
#   session-20-scope-seed.md-analog   closed, OPARSBART FILNAMN     → FLAGGAD (fail-closed)
#   no-lifecycle-legacy.md            INGEN lifecycle alls          → FLAGGAD (fail-closed)
#   session-99  closed, skyddslistad  → SKA STANNA trots att den är äldre än fönstret
#
# Plus två fristående citerande filer UTANFÖR tasks/sessions/ som täcker de
# KORTARE relativa formerna Pass A missade fram till TASK-158.3 (2026-08-07,
# skriptets första skarpa körning — lychee fångade 22 brutna länkar i 11
# filer som den smalare "tasks/sessions/<filnamn>"-matchningen aldrig såg):
#   tasks/shallow-citing.md           länk "](sessions/<filnamn>)"   → Pass A-mål
#                                      (samma relativa djup som tasks/todo.md)
#   tasks/threads/nested-citing.md    länk "](../sessions/<filnamn>)" → Pass A-mål
#                                      (samma relativa djup som tasks/threads/*.md)
#
# Plus en separat rigg för sessionsnummer-sorteringens numeriska korrekthet
# (…-session-99.md vs …-session-100.md — ren strängsortering ger FEL
# ordning här, se arkivera-sessionsdok.shs egen kommentar).
#
# Samma mönster (mktemp-repo, bekrafta()-helper, torrkörnings-fas följt av
# utförande-fas, policy-fil via env-override) som scripts/test-stada-grenar.sh
# (TASK-152).
#
# Körning:  bash scripts/test-arkivera-sessionsdok.sh
# Exit 0 = alla påståenden höll. Exit 1 = minst ett föll (antalet skrivs ut).

set -euo pipefail

SKRIPT_KAT=""
SKRIPT_KAT=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
SKRIPT="${SKRIPT_KAT}/arkivera-sessionsdok.sh"

if [[ ! -f "${SKRIPT}" ]]; then
  echo "FEL: hittar inte ${SKRIPT}" >&2
  exit 2
fi

TMP=""
TMP=$(mktemp -d "${TMPDIR:-/tmp}/task-158-2-arkivera-sessionsdok.XXXXXX")
trap 'rm -rf "${TMP}"' EXIT

HUVUD="${TMP}/huvud"
POLICY="${TMP}/policy.conf"

FEL=0
bekrafta() {
  BESKRIVNING="${1}"
  OBSERVERAT="${2}"
  FORVANTAT="${3}"
  if [[ "${OBSERVERAT}" == "${FORVANTAT}" ]]; then
    echo "  OK   ${BESKRIVNING}"
  else
    echo "  FEL  ${BESKRIVNING} (förväntat '${FORVANTAT}', fick '${OBSERVERAT}')"
    FEL=$((FEL + 1))
  fi
}

skriv_dok() {
  # skriv_dok <sokvag> <lifecycle-eller-tom> <kropp>
  local sokvag="${1}" lifecycle="${2}" kropp="${3}"
  mkdir -p "$(dirname "${sokvag}")"
  if [[ -n "${lifecycle}" ]]; then
    cat > "${sokvag}" <<EOF
---
owner: test
updated: 2026-01-01
lifecycle: ${lifecycle}
---

${kropp}
EOF
  else
    cat > "${sokvag}" <<EOF
# dok utan frontmatter (pre-ADR-052-analog)

${kropp}
EOF
  fi
}

# ── Rigg ──────────────────────────────────────────────────────────────────────
git init --quiet -b main "${HUVUD}"
git -C "${HUVUD}" config user.email "test@example.invalid"
git -C "${HUVUD}" config user.name "TASK-158.2 test"

skriv_dok "${HUVUD}/tasks/sessions/2026-06-01-session-1.md" closed \
  "Session 1 — inget speciellt."

skriv_dok "${HUVUD}/tasks/sessions/2026-06-02-session-2.md" closed \
  "Session 2 — inom fönstret."

skriv_dok "${HUVUD}/tasks/sessions/2026-06-03-session-3.md" closed \
  "Session 3 — citerar session 1 i prosa: se \`tasks/sessions/2026-06-01-session-1.md\` för bakgrund."

skriv_dok "${HUVUD}/tasks/sessions/2026-07-01-session-4.md" closed \
  "Session 4 — citerar föregångaren via bara relativ länk: [föregångare](2026-06-01-session-1.md)."

skriv_dok "${HUVUD}/tasks/sessions/2026-07-02-session-5.md" active \
  "Session 5 — pågående."

skriv_dok "${HUVUD}/tasks/sessions/2026-07-03-session-6.md" paused \
  "Session 6 — pausad."

skriv_dok "${HUVUD}/tasks/sessions/session-scope-seed.md" closed \
  "Closed men filnamnet saknar datum+sessionsnummer-formen — ska flaggas, inte arkiveras, hur gammal den än är."

skriv_dok "${HUVUD}/tasks/sessions/no-lifecycle-legacy.md" "" \
  "Inget lifecycle-fält alls (pre-ADR-052) — ska flaggas, aldrig rörd automatiskt."

skriv_dok "${HUVUD}/tasks/sessions/2026-05-01-session-0.md" closed \
  "Session 0 — skyddslistad trots att den är äldst av alla."

mkdir -p "${HUVUD}/docs"
cat > "${HUVUD}/docs/citing.md" <<'EOF'
Extern referens: tasks/sessions/2026-06-01-session-1.md är källan.
EOF

# De två kortare relativa formerna (TASK-158.3-regressionen, se filhuvudet).
mkdir -p "${HUVUD}/tasks/threads"
cat > "${HUVUD}/tasks/shallow-citing.md" <<'EOF'
Se [session-1](sessions/2026-06-01-session-1.md) för bakgrund.
EOF
cat > "${HUVUD}/tasks/threads/nested-citing.md" <<'EOF'
Se [session-1](../sessions/2026-06-01-session-1.md) för bakgrund.
EOF

cat > "${POLICY}" <<'EOF'
ARKIVERA_SESSIONSDOK_FONSTER=3
ARKIVERA_SESSIONSDOK_SKYDDADE=(
    "2026-05-01-session-0.md"
)
EOF

git -C "${HUVUD}" add -A
git -C "${HUVUD}" commit --quiet -m "fixture"

echo
echo "═══ FAS 1 — torrkörning ska klassificera rätt, och ändra ingenting ═══"
UT_TORR="${TMP}/ut-torrkorning.txt"
KOD_TORR=0
( cd "${HUVUD}" && ARKIVERA_SESSIONSDOK_POLICY="${POLICY}" bash "${SKRIPT}" ) > "${UT_TORR}" 2>&1 || KOD_TORR=$?
bekrafta "torrkörningen avslutas med exit 0" "${KOD_TORR}" "0"

OBS=""
if grep -qF "SKULLE ARKIVERAS 2026-06-01-session-1.md → tasks/sessions/archive/2026-06/2026-06-01-session-1.md" "${UT_TORR}"; then OBS=ja; else OBS=nej; fi
bekrafta "session-1 pekas ut som arkiv-kandidat (äldst, utanför fönstret)" "${OBS}" "ja"

if grep -qF "KVAR 2026-06-02-session-2.md — closed, inom fönstret" "${UT_TORR}"; then OBS=ja; else OBS=nej; fi
bekrafta "session-2 stannar — inom fönstret" "${OBS}" "ja"

if grep -qF "KVAR 2026-07-02-session-5.md — lifecycle: active" "${UT_TORR}"; then OBS=ja; else OBS=nej; fi
bekrafta "session-5 (active) stannar oavsett fönster" "${OBS}" "ja"

if grep -qF "KVAR 2026-07-03-session-6.md — lifecycle: paused" "${UT_TORR}"; then OBS=ja; else OBS=nej; fi
bekrafta "session-6 (paused) stannar oavsett fönster" "${OBS}" "ja"

if grep -qF "FLAGGAD session-scope-seed.md — closed men filnamnet går inte att parsa" "${UT_TORR}"; then OBS=ja; else OBS=nej; fi
bekrafta "session-scope-seed.md (oparsbart filnamn) flaggas fail-closed, arkiveras INTE" "${OBS}" "ja"

if grep -qF "FLAGGAD no-lifecycle-legacy.md — oparsbar lifecycle" "${UT_TORR}"; then OBS=ja; else OBS=nej; fi
bekrafta "no-lifecycle-legacy.md (inget lifecycle-fält) flaggas fail-closed" "${OBS}" "ja"

if grep -qF "KVAR 2026-05-01-session-0.md — skyddslistad" "${UT_TORR}"; then OBS=ja; else OBS=nej; fi
bekrafta "session-0 (skyddslistad) stannar trots att den är äldst" "${OBS}" "ja"

if grep -qF 'SKULLE SKRIVAS OM docs/citing.md — "tasks/sessions/2026-06-01-session-1.md" → "tasks/sessions/archive/2026-06/2026-06-01-session-1.md"' "${UT_TORR}"; then OBS=ja; else OBS=nej; fi
bekrafta "Pass A förhandsvisar omskrivning av docs/citing.md" "${OBS}" "ja"

if grep -qF 'SKULLE SKRIVAS OM tasks/sessions/2026-06-03-session-3.md — "tasks/sessions/2026-06-01-session-1.md"' "${UT_TORR}"; then OBS=ja; else OBS=nej; fi
bekrafta "Pass A förhandsvisar omskrivning av session-3s prosa-citat" "${OBS}" "ja"

if grep -qF 'SKULLE SKRIVAS OM tasks/sessions/2026-07-01-session-4.md — "](2026-06-01-session-1.md" → "](archive/2026-06/2026-06-01-session-1.md"' "${UT_TORR}"; then OBS=ja; else OBS=nej; fi
bekrafta "Pass B förhandsvisar omskrivning av session-4s bara-relativa länk" "${OBS}" "ja"

# TASK-158.3-regressionstäckning: de två kortare relativa formerna som Pass A
# missade fram till fixen (se filhuvudet).
if grep -qF 'SKULLE SKRIVAS OM tasks/shallow-citing.md — "tasks/sessions/2026-06-01-session-1.md" → "tasks/sessions/archive/2026-06/2026-06-01-session-1.md"' "${UT_TORR}"; then OBS=ja; else OBS=nej; fi
bekrafta "Pass A förhandsvisar omskrivning av tasks/shallow-citing.mds \"sessions/<filnamn>\"-länk" "${OBS}" "ja"

if grep -qF 'SKULLE SKRIVAS OM tasks/threads/nested-citing.md — "tasks/sessions/2026-06-01-session-1.md" → "tasks/sessions/archive/2026-06/2026-06-01-session-1.md"' "${UT_TORR}"; then OBS=ja; else OBS=nej; fi
bekrafta "Pass A förhandsvisar omskrivning av tasks/threads/nested-citing.mds \"../sessions/<filnamn>\"-länk" "${OBS}" "ja"

# Torrkörningen ska INTE ha ändrat något på disk.
if [[ -f "${HUVUD}/tasks/sessions/2026-06-01-session-1.md" ]]; then OBS=ja; else OBS=nej; fi
bekrafta "torrkörningen lämnade session-1 kvar på sin gamla plats" "${OBS}" "ja"

if grep -qF "tasks/sessions/archive/2026-06" "${HUVUD}/docs/citing.md" 2>/dev/null; then OBS=ja; else OBS=nej; fi
bekrafta "torrkörningen ändrade INTE docs/citing.md" "${OBS}" "nej"

echo
echo "═══ FAS 2 — utförande ska flytta EN, skriva om ALLA inkommande länkar, och lämna resten ═══"
UT_UTFOR="${TMP}/ut-utforande.txt"
KOD_UTFOR=0
( cd "${HUVUD}" && ARKIVERA_SESSIONSDOK_POLICY="${POLICY}" bash "${SKRIPT}" --utfor ) > "${UT_UTFOR}" 2>&1 || KOD_UTFOR=$?
bekrafta "utförandet avslutas med exit 0" "${KOD_UTFOR}" "0"

if grep -qF "ARKIVERAD 2026-06-01-session-1.md → tasks/sessions/archive/2026-06/2026-06-01-session-1.md" "${UT_UTFOR}"; then OBS=ja; else OBS=nej; fi
bekrafta "session-1 redovisas som ARKIVERAD" "${OBS}" "ja"

if [[ -f "${HUVUD}/tasks/sessions/archive/2026-06/2026-06-01-session-1.md" ]]; then OBS=ja; else OBS=nej; fi
bekrafta "session-1 finns FYSISKT på sin nya arkiv-sökväg" "${OBS}" "ja"

if [[ -f "${HUVUD}/tasks/sessions/2026-06-01-session-1.md" ]]; then OBS=ja; else OBS=nej; fi
bekrafta "session-1 finns INTE kvar på sin gamla rot-sökväg" "${OBS}" "nej"

if git -C "${HUVUD}" status --short | grep -qF "R  tasks/sessions/2026-06-01-session-1.md -> tasks/sessions/archive/2026-06/2026-06-01-session-1.md"; then OBS=ja; else OBS=nej; fi
bekrafta "git ser flytten som en RENAME (staged), inte delete+add" "${OBS}" "ja"

# Pass A: prosa-citat i docs/citing.md OCH i session-3s egen kropp omskrivna.
if grep -qF "tasks/sessions/archive/2026-06/2026-06-01-session-1.md" "${HUVUD}/docs/citing.md"; then OBS=ja; else OBS=nej; fi
bekrafta "docs/citing.md pekar nu på arkiv-sökvägen" "${OBS}" "ja"

if grep -qF "tasks/sessions/archive/2026-06/2026-06-01-session-1.md" "${HUVUD}/tasks/sessions/2026-06-03-session-3.md"; then OBS=ja; else OBS=nej; fi
bekrafta "session-3s prosa-citat pekar nu på arkiv-sökvägen" "${OBS}" "ja"

# session-3s enda citat av session-1 SKA nu innehålla "archive/2026-06" —
# om den gamla, oarkiverade formen fortfarande finns kvar ORÖRD vid sidan
# av (skulle indikera att Pass A la till i stället för att ersätta, eller
# matchade fel ställe) är omskrivningen ofullständig.
ANTAL_GAMMAL_FORM=0
# OBS: grep -c skriver redan "0" på egen hand vid noll träffar (och avslutar
# då med exit 1, "no match found") — en extra "|| echo 0"-reserv skulle
# DUBBLERA utskriften. "|| true" neutraliserar bara exitkoden.
ANTAL_GAMMAL_FORM=$(grep -cF "tasks/sessions/2026-06-01-session-1.md" "${HUVUD}/tasks/sessions/2026-06-03-session-3.md" || true)
bekrafta "session-3 har noll kvarvarande träffar på den gamla, oarkiverade sökvägsformen" "${ANTAL_GAMMAL_FORM}" "0"

# Pass B: session-4s bara-relativa länk omskriven till archive/<månad>/<filnamn>.
if grep -qF "](archive/2026-06/2026-06-01-session-1.md)" "${HUVUD}/tasks/sessions/2026-07-01-session-4.md"; then OBS=ja; else OBS=nej; fi
bekrafta "session-4s bara-relativa länk pekar nu på archive/2026-06/…" "${OBS}" "ja"

# TASK-158.3-regressionstäckning: de två kortare relativa formerna skrivs
# om till KORREKT UPPLÖSTA (fortsatt fungerande) länkar — inte bara till
# NÅGON ny sträng. "sessions/<filnamn>" (tasks/-djup) blir
# "sessions/archive/<månad>/<filnamn>"; "../sessions/<filnamn>"
# (tasks/threads/-djup) blir "../sessions/archive/<månad>/<filnamn>" — i
# båda fallen olöst av att prefixet ("tasks/" saknas resp. "../" finns)
# lämnas EXAKT som det stod, bara segmentet efter "sessions/" ändras.
if grep -qF "](sessions/archive/2026-06/2026-06-01-session-1.md)" "${HUVUD}/tasks/shallow-citing.md"; then OBS=ja; else OBS=nej; fi
bekrafta "tasks/shallow-citing.mds \"sessions/<filnamn>\"-länk pekar nu på sessions/archive/2026-06/…" "${OBS}" "ja"

if grep -qF "](../sessions/archive/2026-06/2026-06-01-session-1.md)" "${HUVUD}/tasks/threads/nested-citing.md"; then OBS=ja; else OBS=nej; fi
bekrafta "tasks/threads/nested-citing.mds \"../sessions/<filnamn>\"-länk pekar nu på ../sessions/archive/2026-06/…" "${OBS}" "ja"

# Orörda dok: active/paused/skyddslistad/flaggade ska stå exakt som innan.
if [[ -f "${HUVUD}/tasks/sessions/2026-07-02-session-5.md" ]]; then OBS=ja; else OBS=nej; fi
bekrafta "session-5 (active) är kvar i roten" "${OBS}" "ja"

if [[ -f "${HUVUD}/tasks/sessions/2026-07-03-session-6.md" ]]; then OBS=ja; else OBS=nej; fi
bekrafta "session-6 (paused) är kvar i roten" "${OBS}" "ja"

if [[ -f "${HUVUD}/tasks/sessions/2026-05-01-session-0.md" ]]; then OBS=ja; else OBS=nej; fi
bekrafta "session-0 (skyddslistad) är kvar i roten trots ålder" "${OBS}" "ja"

if [[ -f "${HUVUD}/tasks/sessions/session-scope-seed.md" ]]; then OBS=ja; else OBS=nej; fi
bekrafta "session-scope-seed.md (oparsbart filnamn) är kvar i roten" "${OBS}" "ja"

if [[ -f "${HUVUD}/tasks/sessions/no-lifecycle-legacy.md" ]]; then OBS=ja; else OBS=nej; fi
bekrafta "no-lifecycle-legacy.md är kvar i roten" "${OBS}" "ja"

echo
echo "═══ FAS 3 — idempotens: samma körning igen ska vara ett no-op ═══"
UT_ANDRA="${TMP}/ut-andra-korning.txt"
KOD_ANDRA=0
( cd "${HUVUD}" && ARKIVERA_SESSIONSDOK_POLICY="${POLICY}" bash "${SKRIPT}" --utfor ) > "${UT_ANDRA}" 2>&1 || KOD_ANDRA=$?
bekrafta "andra körningen avslutas med exit 0" "${KOD_ANDRA}" "0"

if grep -qF "Roten ryms redan inom fönstret — inga arkiv-kandidater." "${UT_ANDRA}"; then OBS=ja; else OBS=nej; fi
bekrafta "andra körningen rapporterar noll arkiv-kandidater (idempotent)" "${OBS}" "ja"

if grep -qF "ARKIVERAD" "${UT_ANDRA}"; then OBS=ja; else OBS=nej; fi
bekrafta "andra körningen arkiverar INGENTING ytterligare" "${OBS}" "nej"

echo
echo "═══ FAS 4 — okänd flagga fäller med exit 2, ändrar ingenting ═══"
UT_FLAGGA="${TMP}/ut-okand-flagga.txt"
KOD_FLAGGA=0
( cd "${HUVUD}" && ARKIVERA_SESSIONSDOK_POLICY="${POLICY}" bash "${SKRIPT}" --okand-flagga ) > "${UT_FLAGGA}" 2>&1 || KOD_FLAGGA=$?
bekrafta "okänd flagga ger exit 2" "${KOD_FLAGGA}" "2"

echo
echo "═══ FAS 5 — saknat fönstertal (varken policy eller --fonster) fäller med exit 2 ═══"
TOM_POLICY="${TMP}/tom-policy.conf"
: > "${TOM_POLICY}"
UT_TOMPOLICY="${TMP}/ut-tom-policy.txt"
KOD_TOMPOLICY=0
( cd "${HUVUD}" && ARKIVERA_SESSIONSDOK_POLICY="${TOM_POLICY}" bash "${SKRIPT}" ) > "${UT_TOMPOLICY}" 2>&1 || KOD_TOMPOLICY=$?
bekrafta "saknat fönstertal ger exit 2" "${KOD_TOMPOLICY}" "2"

echo
echo "═══ FAS 6 — sessionsnummer-sortering är NUMERISK, inte lexikografisk ═══"
# Rigg B: två stängda dok samma dag, session-99 och session-100. Ren
# strängsortering av filnamn ger FEL ordning ("…-100.md" < "…-99.md"
# lexikografiskt eftersom '1' < '9'). Fönster N=1 ska behålla session-100
# (högst sessionsnummer = senast stängd) och arkivera session-99 — inte
# tvärtom.
HUVUD_B="${TMP}/huvud-b"
POLICY_B="${TMP}/policy-b.conf"
git init --quiet -b main "${HUVUD_B}"
git -C "${HUVUD_B}" config user.email "test@example.invalid"
git -C "${HUVUD_B}" config user.name "TASK-158.2 test B"
skriv_dok "${HUVUD_B}/tasks/sessions/2026-08-07-session-99.md" closed "Session 99."
skriv_dok "${HUVUD_B}/tasks/sessions/2026-08-07-session-100.md" closed "Session 100."
cat > "${POLICY_B}" <<'EOF'
ARKIVERA_SESSIONSDOK_FONSTER=1
ARKIVERA_SESSIONSDOK_SKYDDADE=()
EOF
git -C "${HUVUD_B}" add -A
git -C "${HUVUD_B}" commit --quiet -m "fixture B"

UT_SORT="${TMP}/ut-sortering.txt"
KOD_SORT=0
( cd "${HUVUD_B}" && ARKIVERA_SESSIONSDOK_POLICY="${POLICY_B}" bash "${SKRIPT}" ) > "${UT_SORT}" 2>&1 || KOD_SORT=$?
bekrafta "sorteringstestets torrkörning avslutas med exit 0" "${KOD_SORT}" "0"

if grep -qF "KVAR 2026-08-07-session-100.md — closed, inom fönstret" "${UT_SORT}"; then OBS=ja; else OBS=nej; fi
bekrafta "session-100 (numeriskt högst) behålls som senast stängd" "${OBS}" "ja"

if grep -qF "SKULLE ARKIVERAS 2026-08-07-session-99.md" "${UT_SORT}"; then OBS=ja; else OBS=nej; fi
bekrafta "session-99 (numeriskt lägst) pekas ut som arkiv-kandidat, INTE session-100" "${OBS}" "ja"

echo
echo "── Resultat ──"
if [[ "${FEL}" -eq 0 ]]; then
  echo "ALLA PÅSTÅENDEN HÖLL"
  exit 0
fi
echo "${FEL} PÅSTÅENDEN FÖLL"
exit 1
