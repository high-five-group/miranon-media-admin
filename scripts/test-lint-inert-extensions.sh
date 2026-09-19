#!/usr/bin/env bash
# scripts/test-lint-inert-extensions.sh
#
# Beläggsvit för .lint-inert-policy.conf:s LINT_INERT_GLOBAR (TASK-464.1
# runda 3, review runda 2 risk hög fynd 1, 2026-09-19). Kör INTE bara "grönt
# ⇒ i listan" — den prövar exakt de tre villkor policy-filens filhuvud
# kräver, per ändelse:
#
#   (a) Biome — `biome check <provfil-med-avsiktligt-trasigt-innehåll>`
#       svarar "No files were processed" (Biome känner INTE IGEN ändelsen
#       — starkare belägg än "0 fel på just detta innehåll").
#   (b) Typkontrollens `include` — ingen tsconfig*.json pekar på docs/**,
#       tasks/** eller ett glob för ändelsen.
#   (c) shellcheck-strict-uppräkningen (ci.yml) — en FAST fillista som
#       aldrig kan bära ändelsen (ingen glob, bara .sh + namngivna .conf).
#
# En ändelse som faller på NÅGON av de tre är INTE bevisat inert — testet
# fäller före den kan bli en tyst regression (samma regressionsklass som
# motiverade hela omskrivningen: en NEKANDE lista missade att Biome lintar
# JSON/CSS, se .lint-inert-policy.conf:s filhuvud).
#
# PROVFILERNAS INNEHÅLL är konstruerat för att GARANTERAT trigga ett fel OM
# verktyget faktiskt parsar filen (obalanserade hakparenteser, dubblerade
# JSON-nycklar, ett brutet PDF-magic-nummer) — annars vore "0 fel" tvetydigt
# mellan "verktyget ignorerar filtypen" och "verktyget råkade acceptera just
# detta skräp".
#
# Provfilerna skapas i en `mktemp -d`-sandlåda UTANFÖR repot (rör aldrig
# git-tracked yta) och städas av en EXIT-trap.
#
# Källa: .lint-inert-policy.conf · .github/workflows/ci.yml (steget
# `changed-lint-inert-ext` + "Validate bash scripts with shellcheck-strict")
# Etablerad: TASK-464.1 (2026-09-19)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}" || exit 2

POLICY_FIL="${LINT_INERT_POLICY:-.lint-inert-policy.conf}"
if [[ ! -f "${POLICY_FIL}" ]]; then
    echo "❌ policy-fil saknas: ${POLICY_FIL}" >&2
    echo "   Grinden vägrar gissa vilka ändelser som ska beläggas." >&2
    exit 2
fi
# shellcheck source=/dev/null
. "${POLICY_FIL}"

# shellcheck disable=SC2154  # LINT_INERT_GLOBAR sätts av det sourcade
# .lint-inert-policy.conf — samma cross-file-begränsning som andra sourcade
# policy-variabler i repot (t.ex. SUPABASE_CLI_VERSION i deploy-prod-
# functions.sh).
if [[ "${#LINT_INERT_GLOBAR[@]}" -eq 0 ]]; then
    echo "❌ LINT_INERT_GLOBAR saknas eller är tom i ${POLICY_FIL}" >&2
    exit 2
fi

if ! command -v node >/dev/null 2>&1 || [[ ! -x "node_modules/.bin/biome" ]]; then
    echo "❌ node/biome saknas — kör \`npm ci\` (eller symlänka node_modules) först." >&2
    exit 2
fi

PASS=0
FAIL=0

PROBE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/test-lint-inert-extensions.XXXXXX")"
# shellcheck disable=SC2329  # invoked via trap
stada() {
    rm -rf "${PROBE_DIR}"
}
trap stada EXIT

report() {
    local beskrivning="$1" ok="$2"
    if [[ "${ok}" -eq 0 ]]; then
        echo "  ✅ ${beskrivning}"
        PASS=$((PASS + 1))
    else
        echo "  ❌ ${beskrivning}"
        FAIL=$((FAIL + 1))
    fi
}

# Avsiktligt trasigt innehåll per ändelse — se filhuvudets resonemang.
trasigt_innehall() {
    case "$1" in
        md) printf '# broken [link](\n\n<<<<< not-really-markdown ???\n' ;;
        jsonl) printf '{"a": 1, "a": 2}\n{"b":,}\n' ;;
        txt) printf 'not valid { js code +++ ;;; \n' ;;
        csv) printf 'a,b,c\n1,2\n"unterminated\n' ;;
        pdf) printf '%%PDF-1.4 not really a pdf {{{ broken\n' ;;
        png | jpg | jpeg | gif | webp) printf '\x89NOTAVALIDBINARY\x00\x01\x02broken' ;;
        *) printf 'broken-content-for-dot-%s\n' "$1" ;;
    esac
}

echo "▶ (a) Biome — biome check <provfil> ska svara \"No files were processed\""
for glob in "${LINT_INERT_GLOBAR[@]}"; do
    ext="${glob##*.}"
    probe="${PROBE_DIR}/broken.${ext}"
    trasigt_innehall "${ext}" > "${probe}"
    ut="$(node_modules/.bin/biome check "${probe}" 2>&1)"
    if grep -q "No files were processed" <<< "${ut}"; then
        report ".${ext}: Biome processar aldrig filen (okänd typ, ignoreras strukturellt)" 0
    else
        report ".${ext}: Biome PARSADE filen (eller svarade oväntat) — INTE bevisat inert" 1
    fi
done

echo "▶ (b) Typkontrollens include — ingen tsconfig*.json pekar på docs/**, tasks/** eller *.<ändelse>"
TSCONFIGS=(tsconfig*.json)
if [[ "${#TSCONFIGS[@]}" -eq 0 || ! -f "${TSCONFIGS[0]}" ]]; then
    report "hittade ingen tsconfig*.json i repo-roten" 1
else
    for tsc in "${TSCONFIGS[@]}"; do
        if grep -Eq '"[^"]*\bdocs\b' "${tsc}" || grep -Eq '"[^"]*\btasks\b' "${tsc}"; then
            report "${tsc}: include nämner docs/tasks — RISK, ej bevisat inert" 1
        else
            report "${tsc}: include nämner inte docs/tasks" 0
        fi
    done
    for glob in "${LINT_INERT_GLOBAR[@]}"; do
        ext="${glob##*.}"
        traff=0
        for tsc in "${TSCONFIGS[@]}"; do
            if grep -Eq "\*\.${ext}([\"'\`]|\$)" "${tsc}"; then
                traff=1
            fi
        done
        if [[ "${traff}" -eq 0 ]]; then
            report ".${ext}: finns i ingen tsconfig*.json include-lista" 0
        else
            report ".${ext}: finns i en tsconfig*.json include-lista — RISK" 1
        fi
    done
fi

echo "▶ (c) shellcheck-strict-uppräkningen (ci.yml) — fast .sh + namngivna .conf, aldrig ett glob för våra ändelser"
CI_YML=".github/workflows/ci.yml"
if [[ ! -f "${CI_YML}" ]]; then
    report "${CI_YML} saknas" 1
else
    SHELLCHECK_STEG="$(awk '
        /name: Validate bash scripts with shellcheck-strict/ { f = 1 }
        f && /run: \|/ { g = 1; next }
        g && (/^      - name:/ || /^  [a-zA-Z_-]+:/) { exit }
        g { print }
    ' "${CI_YML}" | grep -Ev '^[[:space:]]*#')"
    if [[ -z "${SHELLCHECK_STEG}" ]]; then
        report "kunde inte hitta shellcheck-strict-stegets run:-block i ${CI_YML}" 1
    else
        report "shellcheck-strict-stegets run:-block hittat och läst" 0
        for glob in "${LINT_INERT_GLOBAR[@]}"; do
            ext="${glob##*.}"
            if grep -Eq "\.${ext}([\"'\`[:space:]]|\$)" <<< "${SHELLCHECK_STEG}"; then
                report ".${ext}: förekommer i shellcheck-strict-listan — RISK" 1
            else
                report ".${ext}: förekommer inte i shellcheck-strict-listan" 0
            fi
        done
    fi
fi

echo
echo "RESULT: ${PASS}/$((PASS + FAIL)) PASS, ${FAIL} FAIL"
[[ "${FAIL}" -eq 0 ]]
