#!/usr/bin/env bash
# scripts/check-fetch-depth-invariant.sh — konsistens-grind (ADR-039).
#
# L50:s obyggda test-hälft. Hävdar att repots fetch-depth-värde hålls
# ENHETLIGT över de 6 LEVANDE (muterbara) bärarna:
#   1-4. .github/workflows/ci.yml — fetch-depth i changed/lint/test/docs-jobben
#   5.   .frontmatter-policy.conf — FRONTMATTER_MIN_HISTORY_DEPTH
#   6.   scripts/check-frontmatter.sh — default ${FRONTMATTER_MIN_HISTORY_DEPTH:-N}
#
# Bakgrund: när fetch-depth bumpades 50→100 (2026-05-26) följde tröskeln inte
# med i alla bärare → falsk-negativt detektionsfönster commit-djup 50–99
# (Session 7 L50). L50 föreskrev "kodkoppla ELLER invariant-not + test".
# Detta ÄR testen.
#
# IMMUTABILITETS-NYANS (kritisk): frusen ADR-text (ADR-029 § Utelämning #6,
# ADR-030 brödtext), arkiv och sessionsdok innehåller LEGITIMT "50". Grinden
# grep:ar ALDRIG blint efter "fetch-depth: 50/100" över repot — den läser
# bara de 6 namngivna levande-bärar-platserna. ci.yml-kommentarer som också
# nämner "fetch-depth: 100" exkluderas via ^whitespace-ankare (kommentarer
# börjar med '#'). För ADR-029 + ADR-030 hävdas i stället att en ERRATUM-not
# finns som pekar på aktuellt värde (ej värde-likhet med frusen brödtext).
#
# Exit 0 om alla 6 levande bärare är ömsesidigt identiska OCH båda ADR:erna
# bär erratum som nämner aktuellt värde. Exit 1 vid drift.
#
# Källa: docs/decisions/ADR-039-konsistens-grindar-kadens.md
# Etablerad: Session 8 K0b (2026-05-27)

set -euo pipefail

CI=".github/workflows/ci.yml"
CONF=".frontmatter-policy.conf"
FM_SCRIPT="scripts/check-frontmatter.sh"
ADR029="docs/decisions/ADR-029-ci-architektur-changed-files-pattern.md"
ADR030="docs/decisions/ADR-030-docs-grindvakter-frontmatter-policy.md"

# Namngiven bärar-mängd: 4 ci.yml-jobb (changed/lint/test/docs).
# CI-topologi-ändring → uppdatera detta + ADR-039 (medveten enkelvärde-policy).
EXPECTED_CI_CARRIERS=4

fail=0

# --- Levande bärare 1-4: ci.yml config-rader ---
# ^whitespace-ankare matchar YAML-nyckeln men INTE '# … fetch-depth: 100'-kommentarer.
ci_vals=$(grep -E "^[[:space:]]*fetch-depth: [0-9]+" "${CI}" | grep -oE "[0-9]+$" || true)
ci_n=$(printf '%s' "${ci_vals}" | grep -c . || true)
if [[ "${ci_n}" -ne "${EXPECTED_CI_CARRIERS}" ]]; then
    echo "❌ ${CI}: hittade ${ci_n} fetch-depth-config-rader (förväntat ${EXPECTED_CI_CARRIERS}: changed/lint/test/docs)."
    echo "   Fix: om CI-topologin avsiktligt ändrats — uppdatera EXPECTED_CI_CARRIERS + ADR-039."
    fail=1
fi

# --- Levande bärare 5: .frontmatter-policy.conf ---
conf_val=$(grep -oE "^FRONTMATTER_MIN_HISTORY_DEPTH=[0-9]+" "${CONF}" | grep -oE "[0-9]+$" || true)
if [[ -z "${conf_val}" ]]; then
    echo "❌ ${CONF}: hittade ingen 'FRONTMATTER_MIN_HISTORY_DEPTH=<N>'-rad."
    fail=1
fi

# --- Levande bärare 6: scripts/check-frontmatter.sh default ---
script_val=$(grep -oE "FRONTMATTER_MIN_HISTORY_DEPTH:-[0-9]+" "${FM_SCRIPT}" | grep -oE "[0-9]+$" || true)
if [[ -z "${script_val}" ]]; then
    echo "❌ ${FM_SCRIPT}: hittade ingen '\${FRONTMATTER_MIN_HISTORY_DEPTH:-<N>}'-default."
    fail=1
fi

# --- Ömsesidig likhet över alla levande bärare ---
all_vals=$(printf '%s\n%s\n%s\n' "${ci_vals}" "${conf_val}" "${script_val}" | grep -v '^$' || true)
uniq_vals=$(printf '%s\n' "${all_vals}" | sort -u | grep -v '^$' || true)
uniq_n=$(printf '%s\n' "${uniq_vals}" | grep -c . || true)

LIVE=""
if [[ "${uniq_n}" -eq 1 ]]; then
    LIVE="${uniq_vals}"
    if [[ "${fail}" -eq 0 ]]; then
        echo "✅ fetch-depth-invariant: alla 6 levande bärare == ${LIVE} (ci×${ci_n}, conf, script-default)."
    fi
else
    ci_joined=$(printf '%s' "${ci_vals}" | tr '\n' ' ' || true)
    echo "❌ fetch-depth-drift mellan levande bärare. Unika värden funna:"
    printf '%s\n' "${uniq_vals}" | sed 's/^/     - /'
    echo "   ci.yml-jobb: ${ci_joined}| conf: ${conf_val:-<saknas>} | script-default: ${script_val:-<saknas>}"
    echo "   Fix: sätt SAMMA värde i alla 6 bärare (ci.yml ×4, ${CONF}, ${FM_SCRIPT})."
    fail=1
fi

# --- ADR-bärare: frusen text säger legitimt "50" → kräv erratum-not, ej värde-likhet ---
# Sätter global ${fail} direkt (i st f || fail=1) så set -e ej kringgås (SC2310).
check_adr_erratum() {
    local adr=$1 val=$2 erratum
    if [[ ! -f "${adr}" ]]; then
        echo "❌ ${adr} saknas."
        fail=1; return
    fi
    # Erratum = blockquote-rad som börjar med '> **Korrigering' OCH nämner fetch-depth.
    erratum=$(grep -E "^> \*\*Korrigering" "${adr}" | grep -i "fetch-depth" || true)
    if [[ -z "${erratum}" ]]; then
        echo "❌ ${adr}: saknar fetch-depth-erratum (rad '> **Korrigering … fetch-depth …')."
        echo "   ADR-bärare är FRUSEN text (säger legitimt '50'); invarianten kräver en erratum-not som pekar på aktuellt värde."
        fail=1; return
    fi
    if [[ -n "${val}" ]] && ! printf '%s' "${erratum}" | grep -qwF "${val}"; then
        echo "❌ ${adr}: erratum nämner inte aktuellt levande värde (${val}) — uppdatera erratum vid värde-bump."
        fail=1; return
    fi
    if [[ -n "${val}" ]]; then
        echo "✅ ${adr}: fetch-depth-erratum närvarande (pekar på ${val})."
    else
        echo "✅ ${adr}: fetch-depth-erratum närvarande."
    fi
}

check_adr_erratum "${ADR029}" "${LIVE}"
check_adr_erratum "${ADR030}" "${LIVE}"

exit "${fail}"
