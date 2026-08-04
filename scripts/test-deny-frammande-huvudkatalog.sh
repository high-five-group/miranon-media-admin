#!/usr/bin/env bash
# scripts/test-deny-frammande-huvudkatalog.sh — tvåsidigt bevis för
# katalogägarskaps-hooken (T119 arbetslista (a), S97).
#
# TVÅSIDIGT betyder att BÅDA riktningarna prövas: planterade överträdelser
# ska FRÅGA, och legitima kommandon ska SLÄPPAS. Ett test som bara visar att
# spärren fäller bevisar inte att den är användbar — det bevisar bara att den
# är en svepande blockering. Samma form som scripts/test-deny-resend-send.sh.
#
# Riggen bygger ett ÄKTA temporärt git-repo med en ÄKTA worktree, eftersom
# hela mekanismen vilar på hur git delar .git/ mellan huvudträd och worktrees
# (se .katalogagarskap-policy.conf § VARFÖR LAPPEN BOR I --git-common-dir).
# En mockad katalogstruktur hade prövat mocken, inte mekanismen.
#
# Körs: bash scripts/test-deny-frammande-huvudkatalog.sh
# Exit 0 = alla fall gröna. Exit 1 = minst ett fall rött.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="${SCRIPT_DIR}/deny-frammande-huvudkatalog.sh"
MARKOR_HOOK="${SCRIPT_DIR}/katalogagarskap-markor.sh"
POLICY="${SCRIPT_DIR}/../.katalogagarskap-policy.conf"

ANTAL=0
FEL=0

TMPROT="$(mktemp -d)"
trap 'rm -rf "${TMPROT}"' EXIT

HUVUD="${TMPROT}/huvudrepo"
WT="${TMPROT}/worktree-b"

mkdir -p "${HUVUD}"
git -C "${HUVUD}" init -q -b main
git -C "${HUVUD}" config user.email "test@example.invalid"
git -C "${HUVUD}" config user.name "Testrigg"
echo "start" > "${HUVUD}/fil.txt"
git -C "${HUVUD}" add fil.txt
git -C "${HUVUD}" commit -q -m "init"
git -C "${HUVUD}" worktree add -q -b gren-b "${WT}"

COMMON_DIR="$(git -C "${HUVUD}" rev-parse --path-format=absolute --git-common-dir)"
# shellcheck source=/dev/null
source "${POLICY}"
MARKOR="${COMMON_DIR}/${KATALOG_MARKOR_FILNAMN}"

AGARE_SID="session-agaren-1111"
FRAMLING_SID="session-framlingen-2222"

satt_markor() {
    local sid="$1" epoch="${2:-$(date +%s)}"
    jq -n --arg sid "${sid}" --arg huvud "${HUVUD}" \
        --arg iso "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --argjson epoch "${epoch}" \
        '{session_id: $sid, huvudkatalog: $huvud, satt_vid: $iso, satt_vid_epoch: $epoch}' \
        > "${MARKOR}"
}

# kor <cwd> <session_id> <kommando> → skriver hookens stdout
kor() {
    local cwd="$1" sid="$2" cmd="$3"
    jq -nc --arg cwd "${cwd}" --arg sid "${sid}" --arg cmd "${cmd}" \
        '{tool_name: "Bash", session_id: $sid, cwd: $cwd, tool_input: {command: $cmd}}' \
        | KATALOG_POLICY="${POLICY}" bash "${HOOK}" 2>/dev/null
}

# forvanta <FRAGA|SLAPP> <beskrivning> <cwd> <sid> <kommando>
forvanta() {
    local vantat="$1" desc="$2" cwd="$3" sid="$4" cmd="$5"
    ANTAL=$((ANTAL + 1))
    local ut faktiskt
    ut="$(kor "${cwd}" "${sid}" "${cmd}")"
    if printf '%s' "${ut}" | jq -e '.hookSpecificOutput.permissionDecision == "ask"' >/dev/null 2>&1; then
        faktiskt="FRAGA"
    else
        faktiskt="SLAPP"
    fi
    if [[ "${faktiskt}" = "${vantat}" ]]; then
        printf '  ✅ %-58s [%s]\n' "${desc}" "${faktiskt}"
    else
        printf '  ❌ %-58s [fick %s, väntade %s]\n' "${desc}" "${faktiskt}" "${vantat}"
        FEL=$((FEL + 1))
    fi
}

echo "═══ Katalogägarskaps-hooken — tvåsidigt bevis ═══"
echo
echo "Rigg: huvudrepo ${HUVUD}"
echo "      worktree  ${WT}"
echo "      lapp      ${MARKOR}"
echo

# ── SIDA 1: överträdelser ska FRÅGA ───────────────────────────────────────
echo "SIDA 1 — planterade överträdelser (ägarlapp: ${AGARE_SID})"
satt_markor "${AGARE_SID}"

forvanta FRAGA "S96:s faktiska fel 1: ff-merge i huvudkatalogen" \
    "${HUVUD}" "${FRAMLING_SID}" "git merge --ff-only origin/main"
forvanta FRAGA "S96:s faktiska fel 2: gren skapad i huvudkatalogen" \
    "${HUVUD}" "${FRAMLING_SID}" "git switch -c docs/t116-konvergens-kadens"
forvanta FRAGA "commit i huvudkatalogen" \
    "${HUVUD}" "${FRAMLING_SID}" "git commit -m 'test'"
forvanta FRAGA "git -C <huvudkatalog> från en worktree" \
    "${WT}" "${FRAMLING_SID}" "git -C ${HUVUD} merge --ff-only origin/main"
forvanta FRAGA "cd <huvudkatalog> && git från en worktree" \
    "${WT}" "${FRAMLING_SID}" "cd ${HUVUD} && git reset --hard origin/main"
forvanta FRAGA "skrivning gömd som andra led i en kedja" \
    "${HUVUD}" "${FRAMLING_SID}" "git status && git rebase origin/main"
forvanta FRAGA "git -c före underkommandot maskerar inte skrivningen" \
    "${HUVUD}" "${FRAMLING_SID}" "git -c core.editor=true commit --amend"
forvanta FRAGA "worktree add är en skrivning" \
    "${HUVUD}" "${FRAMLING_SID}" "git worktree add ../nytt"

# ── SIDA 2: legitima kommandon ska SLÄPPAS ────────────────────────────────
echo
echo "SIDA 2 — legitima kommandon"

forvanta SLAPP "ÄGAREN får skriva i sin egen huvudkatalog" \
    "${HUVUD}" "${AGARE_SID}" "git merge --ff-only origin/main"
forvanta SLAPP "främling arbetar i SIN EGEN worktree" \
    "${WT}" "${FRAMLING_SID}" "git commit -m 'arbete i egen worktree'"
forvanta SLAPP "ren läsning i huvudkatalogen" \
    "${HUVUD}" "${FRAMLING_SID}" "git status --short"
forvanta SLAPP "git log är ingen skrivning" \
    "${HUVUD}" "${FRAMLING_SID}" "git log --oneline -5"
forvanta SLAPP "git fetch är medvetet undantagen (additiv på refs)" \
    "${HUVUD}" "${FRAMLING_SID}" "git fetch origin"
forvanta SLAPP "git worktree list är en läsning" \
    "${HUVUD}" "${FRAMLING_SID}" "git worktree list"
forvanta SLAPP "icke-git-kommando i huvudkatalogen" \
    "${HUVUD}" "${FRAMLING_SID}" "npm run build"
forvanta SLAPP "ordet 'git' i ett annat sammanhang" \
    "${HUVUD}" "${FRAMLING_SID}" "echo 'legitimate merge of two datasets'"

# ── SIDA 3: fail-open och gränsfall ───────────────────────────────────────
echo
echo "SIDA 3 — fail-open och gränsfall"

rm -f "${MARKOR}"
forvanta SLAPP "ingen lapp = ingen deklarerad ägare = ingen konflikt" \
    "${HUVUD}" "${FRAMLING_SID}" "git merge --ff-only origin/main"

echo "{ trasig json" > "${MARKOR}"
forvanta SLAPP "oläsbar lapp failar ÖPPET (medvetet, se skripthuvudet)" \
    "${HUVUD}" "${FRAMLING_SID}" "git merge --ff-only origin/main"

satt_markor "${AGARE_SID}"
ANTAL=$((ANTAL + 1))
UT_STALE="$(kor "${HUVUD}" "${FRAMLING_SID}" "git merge --ff-only origin/main")"
if printf '%s' "${UT_STALE}" | jq -e '.hookSpecificOutput.permissionDecisionReason | contains("stale") | not' >/dev/null 2>&1; then
    printf '  ✅ %-58s [%s]\n' "färsk lapp nämner INTE stale" "FRAGA"
else
    printf '  ❌ %-58s\n' "färsk lapp nämner INTE stale"
    FEL=$((FEL + 1))
fi

satt_markor "${AGARE_SID}" "$(( $(date +%s) - KATALOG_STALE_TIMMAR * 3600 - 60 ))"
ANTAL=$((ANTAL + 1))
UT_GAMMAL="$(kor "${HUVUD}" "${FRAMLING_SID}" "git merge --ff-only origin/main")"
if printf '%s' "${UT_GAMMAL}" | jq -e '.hookSpecificOutput.permissionDecisionReason | contains("stale-tröskeln")' >/dev/null 2>&1; then
    printf '  ✅ %-58s [%s]\n' "gammal lapp fäller MEN flaggar stale + rensning" "FRAGA"
else
    printf '  ❌ %-58s\n' "gammal lapp fäller MEN flaggar stale + rensning"
    FEL=$((FEL + 1))
fi

# ── SIDA 4: markör-hooken sätter och stjäl inte ───────────────────────────
echo
echo "SIDA 4 — markör-hooken (SessionStart)"

satt_markor "${AGARE_SID}"
ANTAL=$((ANTAL + 1))
jq -nc --arg cwd "${HUVUD}" --arg sid "${FRAMLING_SID}" \
    '{session_id: $sid, cwd: $cwd, hook_event_name: "SessionStart"}' \
    | KATALOG_POLICY="${POLICY}" bash "${MARKOR_HOOK}" >/dev/null 2>&1
EFTER="$(jq -r '.session_id' "${MARKOR}" 2>/dev/null)"
if [[ "${EFTER}" = "${AGARE_SID}" ]]; then
    printf '  ✅ %-58s [%s]\n' "främling STJÄL INTE ett färskt ägarskap" "ORÖRD"
else
    printf '  ❌ %-58s [lappen blev %s]\n' "främling STJÄL INTE ett färskt ägarskap" "${EFTER}"
    FEL=$((FEL + 1))
fi

rm -f "${MARKOR}"
ANTAL=$((ANTAL + 1))
jq -nc --arg cwd "${HUVUD}" --arg sid "${AGARE_SID}" \
    '{session_id: $sid, cwd: $cwd, hook_event_name: "SessionStart"}' \
    | KATALOG_POLICY="${POLICY}" bash "${MARKOR_HOOK}" >/dev/null 2>&1
if [[ "$(jq -r '.session_id' "${MARKOR}" 2>/dev/null)" = "${AGARE_SID}" ]]; then
    printf '  ✅ %-58s [%s]\n' "session i huvudkatalogen tar ledigt ägarskap" "SATT"
else
    printf '  ❌ %-58s\n' "session i huvudkatalogen tar ledigt ägarskap"
    FEL=$((FEL + 1))
fi

rm -f "${MARKOR}"
ANTAL=$((ANTAL + 1))
jq -nc --arg cwd "${WT}" --arg sid "${FRAMLING_SID}" \
    '{session_id: $sid, cwd: $cwd, hook_event_name: "SessionStart"}' \
    | KATALOG_POLICY="${POLICY}" bash "${MARKOR_HOOK}" >/dev/null 2>&1
if [[ ! -f "${MARKOR}" ]]; then
    printf '  ✅ %-58s [%s]\n' "session i en worktree gör INGET anspråk" "INGEN LAPP"
else
    printf '  ❌ %-58s\n' "session i en worktree gör INGET anspråk"
    FEL=$((FEL + 1))
fi

echo
if [[ "${FEL}" -eq 0 ]]; then
    echo "✅ ${ANTAL}/${ANTAL} gröna."
    exit 0
fi
echo "❌ ${FEL} av ${ANTAL} röda."
exit 1
