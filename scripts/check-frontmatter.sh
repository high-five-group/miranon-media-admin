#!/usr/bin/env bash
# scripts/check-frontmatter.sh
#
# Validerar YAML-frontmatter på styrande docs per ADR-030 § Del 3.
# 5 checks: existens, updated-match, review_by > today, status-enum,
# owner-enum.
#
# Config: .frontmatter-policy.conf (repo-root). Skriptet failar
# explicit om config saknas (K7 Lesson #6 portabilitet: skriptet är
# universellt, värden är per-projekt).
#
# Exit 0 om alla checks passerar för alla filer.
# Exit 1 om någon check failar för någon fil (eller config saknas).
#
# Output (K11.5 11/10-disciplin):
#   ❌ <fil>:<rad> — <check-id>: <faktiskt värde> (förväntat: <regel>)
#      Fix: <actionable rekommendation>
#
# Källa: docs/decisions/ADR-030-docs-grindvakter-frontmatter-policy.md
# Etablerad: Session 6.6 K7 (2026-05-14)

set -euo pipefail

# === Ladda projekt-config ===
CONFIG_FILE=".frontmatter-policy.conf"
CURRENT_DIR=$(pwd)
if [[ ! -f "${CONFIG_FILE}" ]]; then
    echo "❌ Config saknas: ${CONFIG_FILE} (sök i: ${CURRENT_DIR})"
    echo "   Fix: skapa .frontmatter-policy.conf i repo-root."
    echo "        Se ADR-030 § Del 2 + Del 3 för spec."
    echo "        Om detta är ett nytt spoke: kopiera från miranon-media-admin"
    echo "        och anpassa FRONTMATTER_GOVERNING_DOCS-listan."
    exit 1
fi
# shellcheck source=/dev/null
source "${CONFIG_FILE}"

# Verifiera att config har nödvändiga variabler
: "${FRONTMATTER_GOVERNING_DOCS?Config saknar FRONTMATTER_GOVERNING_DOCS}"
: "${FRONTMATTER_VALID_OWNER?Config saknar FRONTMATTER_VALID_OWNER}"
: "${FRONTMATTER_VALID_STATUS?Config saknar FRONTMATTER_VALID_STATUS}"

GOVERNING_DOCS=("${FRONTMATTER_GOVERNING_DOCS[@]}")
VALID_OWNER="${FRONTMATTER_VALID_OWNER}"
VALID_STATUS=("${FRONTMATTER_VALID_STATUS[@]}")
TODAY="$(date +%F)"

EXIT_CODE=0

# === Detection: shallow clone med unsafe-historik-djup ===
# Per ADR-033 K4 + ADR-030 § Del 3: defense-in-depth-lager 2 mot
# shallow-clone-bug (L8 från Session 6.6.5). Hybrid-check fångar
# unsafe-shallow (fetch-depth < threshold) men inte safe-shallow
# (fetch-depth ≥ threshold) eller nya repos med <threshold commits
# men full clone. Per L_I + L_J: empirisk truth-table verifierad
# innan implementation.
#
# K4.1.1 (2026-05-16) fix av K4.1-bug: --is-shallow-repository ensamt
# returnerar true för ALLA fetch-depth-värden (1, 50, 100) — false-
# positive på safe-shallow per ADR-030 § Del 3. Hybrid-check kräver
# ÄVEN att commit-count < threshold för att klassa unsafe.
#
# Truth-table (verifierad K4.1.1):
#   depth=1   shallow=true,  count=1:   TRIGGAS (unsafe per L8)
#   depth=50  shallow=true,  count=50:  IGNORERAS (safe-shallow)
#   full      shallow=false, count>50:  IGNORERAS (full clone)
#   nytt-repo shallow=false, count<50:  IGNORERAS (full clone, ny repo)
IS_SHALLOW=$(git rev-parse --is-shallow-repository 2>/dev/null || echo "false")
COMMIT_DEPTH=$(git rev-list --count HEAD 2>/dev/null || echo "0")
MIN_DEPTH="${FRONTMATTER_MIN_HISTORY_DEPTH:-50}"

if [[ "${IS_SHALLOW}" == "true" ]] && [[ "${COMMIT_DEPTH}" -lt "${MIN_DEPTH}" ]]; then
    UNSAFE_SHALLOW=1
else
    UNSAFE_SHALLOW=0
fi

for file in "${GOVERNING_DOCS[@]}"; do
    # Check 1: existens — fil + frontmatter-block
    if [[ ! -f "${file}" ]]; then
        echo "❌ ${file} — Check 1 (existens): fil saknas i repo"
        echo "   Fix: verifiera att FRONTMATTER_GOVERNING_DOCS i .frontmatter-policy.conf matchar HEAD"
        EXIT_CODE=1
        continue
    fi

    if ! head -1 "${file}" | grep -qE "^---$"; then
        echo "❌ ${file}:1 — Check 1 (existens): frontmatter saknas"
        echo "   Fix: lägg till YAML-frontmatter top-of-file per ADR-030 § Del 2"
        EXIT_CODE=1
        continue
    fi

    # Extrahera frontmatter-block (rader mellan första två ---)
    FRONTMATTER=$(awk '/^---$/{c++; if(c==1)next; if(c==2)exit} c==1' "${file}")

    # Extrahera fält
    OWNER=$(echo "${FRONTMATTER}" | grep -E "^owner:" | sed -E 's/^owner:[[:space:]]*//' || echo "")
    UPDATED=$(echo "${FRONTMATTER}" | grep -E "^updated:" | sed -E 's/^updated:[[:space:]]*//' || echo "")
    REVIEW_BY=$(echo "${FRONTMATTER}" | grep -E "^review_by:" | sed -E 's/^review_by:[[:space:]]*//' || echo "")
    STATUS=$(echo "${FRONTMATTER}" | grep -E "^status:" | sed -E 's/^status:[[:space:]]*([a-z]+).*/\1/' || echo "")

    # Check 5: owner-enum
    if [[ "${OWNER}" != "${VALID_OWNER}" ]]; then
        echo "❌ ${file} — Check 5 (owner): '${OWNER}' (förväntat: '${VALID_OWNER}')"
        echo "   Fix: sätt owner: ${VALID_OWNER} i frontmatter"
        EXIT_CODE=1
    fi

    # Check 4: status-enum
    STATUS_OK=0
    for valid in "${VALID_STATUS[@]}"; do
        if [[ "${STATUS}" = "${valid}" ]]; then STATUS_OK=1; break; fi
    done
    if [[ "${STATUS_OK}" -eq 0 ]]; then
        VALID_LIST=$(IFS='|'; echo "${VALID_STATUS[*]}")
        echo "❌ ${file} — Check 4 (status): '${STATUS}' (förväntat: ${VALID_LIST})"
        echo "   Fix: sätt status: stable (eller annat giltigt enum-värde) i frontmatter"
        EXIT_CODE=1
    fi

    # Check 3: review_by > today
    if [[ -z "${REVIEW_BY}" ]]; then
        echo "❌ ${file} — Check 3 (review_by): fält saknas eller tomt"
        echo "   Fix: sätt review_by: YYYY-MM-DD (typiskt today + 6 månader)"
        EXIT_CODE=1
    elif [[ "${REVIEW_BY}" < "${TODAY}" ]] || [[ "${REVIEW_BY}" = "${TODAY}" ]]; then
        echo "❌ ${file} — Check 3 (review_by): '${REVIEW_BY}' har passerat (today: ${TODAY})"
        echo "   Fix: granska dokumentet och bumpa review_by till framtida datum"
        EXIT_CODE=1
    fi

    # Check 2: updated-match mot git log (skippas om unsafe-shallow per ADR-033 K4)
    # Hard-fail-rapport sker POST-loop så alla 9 docs' Check 1+3+4+5
    # rapporteras innan shallow-error visas (debug-experience-design).
    if [[ "${UNSAFE_SHALLOW}" -eq 0 ]]; then
        GIT_UPDATED=$(git log -1 --format=%cs -- "${file}" 2>/dev/null || echo "")
        if [[ -z "${UPDATED}" ]]; then
            echo "❌ ${file} — Check 2 (updated): fält saknas"
            echo "   Fix: sätt updated: ${TODAY} (auto-bumpas av pre-commit hook)"
            EXIT_CODE=1
        elif [[ -n "${GIT_UPDATED}" ]] && [[ "${UPDATED}" != "${GIT_UPDATED}" ]] && [[ "${UPDATED}" != "${TODAY}" ]]; then
            echo "❌ ${file} — Check 2 (updated): '${UPDATED}' driftar från git log '${GIT_UPDATED}'"
            echo "   Fix: bumpa updated: ${GIT_UPDATED} eller commita ändring (pre-commit auto-bumpar)"
            EXIT_CODE=1
        fi
    fi
done

# === Unsafe-shallow hard-fail (ADR-033 K4 lager 2) ===
# Placerad POST-loop så att alla 9 docs' Check 1+3+4+5-rapporter visas
# FÖRE shallow-error (debug-experience). Hard-fail per Marcus' design-val
# 2026-05-16 (L_C nivå 1 + defense-in-depth korrekt-logik: lager N
# fail:ar hårt PRECIS när lager <N har failat).
if [[ "${UNSAFE_SHALLOW}" -eq 1 ]]; then
    echo ""
    echo "❌ Unsafe-shallow clone detected (depth=${COMMIT_DEPTH} < ${MIN_DEPTH})."
    echo "   Check 2 (updated-match against git log) requires full git history."
    echo ""
    echo "   Detection: \`git rev-parse --is-shallow-repository\`=true AND"
    echo "              \`git rev-list --count HEAD\`=${COMMIT_DEPTH} < ${MIN_DEPTH}."
    echo ""
    echo "   Per ADR-033 K4 + ADR-030 § Del 3 sub-§: defense-in-depth-lager 2"
    echo "   mot shallow-clone-bug (L8 från Session 6.6.5)."
    echo ""
    echo "   Fix beroende på kontext:"
    echo "   - CI-jobb: lägg \`fetch-depth: ${MIN_DEPTH}\` (eller högre) på"
    echo "     actions/checkout-step. Se ADR-030 § Del 3 'Implementations-"
    echo "     krav på CI-miljö'."
    echo "   - Lokal dev-clone: kör \`git fetch --unshallow\` för full historik."
    echo "   - Pre-commit hook: samma som lokal dev-clone."
    echo "   - Per-spoke justering: ändra FRONTMATTER_MIN_HISTORY_DEPTH i"
    echo "     .frontmatter-policy.conf."
    exit 1
fi

if [[ "${EXIT_CODE}" -eq 0 ]]; then
    echo "✅ Frontmatter-validering: alla ${#GOVERNING_DOCS[@]} styrande docs passerar 5 checks"
fi

exit "${EXIT_CODE}"
