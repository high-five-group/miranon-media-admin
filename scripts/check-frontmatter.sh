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

# === Shallow-clone-detection (ADR-033 K4 — defense-in-depth lager 2 mot L8) ===
# Per Session 6.6.5 L8: Check 2 (`git log -1 --format=%cs -- <fil>`) på
# shallow clone returnerar HEAD-commit-datum istället för filens senaste
# touch-datum → false-positive Check 2-fail. Lager 1 (fetch-depth: 50 i
# ci.yml per K2.1 commit a67908d) är primärt skydd; denna detection är
# lager 2 som hard-failar om lager 1 har failat eller saknas (typ spoke-
# kopiering utan fetch-depth-config). Hard-fail-rationale per ADR-033 K4
# Marcus' design-val 2026-05-16: L_C nivå 1-disciplin (lös orsaken vs
# suffix-ignore); konsekvent med ADR-033-shellcheck-strict 0/0/0/0-paradigm.
IS_SHALLOW=$(git rev-parse --is-shallow-repository 2>/dev/null || echo "false")

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

    # Check 2: updated-match mot git log (skippas om shallow per ADR-033 K4)
    # Hard-fail-rapport sker POST-loop så alla 9 docs' Check 1+3+4+5
    # rapporteras innan shallow-error visas (debug-experience-design).
    if [[ "${IS_SHALLOW}" != "true" ]]; then
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

# === Shallow-clone-detection hard-fail (ADR-033 K4 lager 2) ===
# Placerad POST-loop så att alla 9 docs' Check 1+3+4+5-rapporter visas
# FÖRE shallow-error (debug-experience). Hard-fail per Marcus' design-val
# 2026-05-16 (L_C nivå 1 + defense-in-depth korrekt-logik: lager N
# fail:ar hårt PRECIS när lager <N har failat).
if [[ "${IS_SHALLOW}" == "true" ]]; then
    echo ""
    echo "❌ Shallow clone detected. Check 2 (updated-match against git log)"
    echo "   requires full git history."
    echo ""
    echo "   Detection: \`git rev-parse --is-shallow-repository\` returned 'true'."
    echo ""
    echo "   Per ADR-033 K4 + ADR-030 § Del 3 sub-§: defense-in-depth-lager 2"
    echo "   mot shallow-clone-bug (L8 från Session 6.6.5)."
    echo ""
    echo "   Fix beroende på kontext:"
    echo "   - CI-jobb: lägg \`fetch-depth: 50\` (eller högre) på"
    echo "     actions/checkout-step. Se ADR-030 § Del 3 \"Implementations-krav"
    echo "     på CI-miljö\"."
    echo "   - Lokal dev-clone: kör \`git fetch --unshallow\` för att hämta full"
    echo "     historik."
    echo "   - Pre-commit hook: samma som lokal dev-clone."
    exit 1
fi

if [[ "${EXIT_CODE}" -eq 0 ]]; then
    echo "✅ Frontmatter-validering: alla ${#GOVERNING_DOCS[@]} styrande docs passerar 5 checks"
fi

exit "${EXIT_CODE}"
