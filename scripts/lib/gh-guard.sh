#!/usr/bin/env bash
# scripts/lib/gh-guard.sh — delad presence+MINIMIVERSION-guard för gh.
# Sourcas av varje skript som anropar gh i grind-/landningsvägen; anropas
# ALDRIG direkt.
#
# VARFÖR FILEN FINNS: TASK-312 (samma sveparkartläggning som jq-guard.sh)
# flaggade gh som en bar systembinär, ej i package.json, använd i
# LANDNINGSVÄGEN (gh pr create/merge, gh issue create) och i flera
# check-*.sh-grindar (check-nattvakt-dedup.sh, check-obesvarade-larm.sh)
# UTAN NÅGON versionskontroll — högst en bar `command -v gh`-presence-check
# i de skript som ens hade det.
#
# ═══ ANVÄNDNING — ERSÄTTER `command -v gh` RAKT AV ═══
#
#   SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
#   # shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path;
#   # scripts/lib/gh-guard.sh lintas separat via ci.yml:s shellcheck-lista
#   source "${SCRIPT_DIR}/lib/gh-guard.sh"
#
#   gh_version_ok || <SAMMA action skriptet redan hade för `command -v gh`>
#
# `gh_version_ok` ÄNDRAR ALDRIG anroparens fail-semantik — samma kontrakt
# som scripts/lib/jq-guard.sh:s jq_version_ok (se den filens header för
# den fulla motiveringen, identisk här).
#
# ═══ VARFÖR MINIMIVERSION OCH INTE EXAKT PIN ═══
#
# Se .gh-version-policy.conf § VARFÖR MINIMIVERSION — gh är en systembinär
# vi inte äger installationsvägen för (Homebrew lokalt, ubuntu-latest-
# runnerns förinstallerade paket i CI), samma resonemang som jq-guard.sh.
#
# ═══ SCOPE — INTE VARJE gh-ANROPSSTÄLLE ÄR WIRAT ═══
#
# MEDVETET INTE wirad: `gh pr create`/`gh issue create` inbäddade i
# .github/workflows/post-merge.yml, visual-baselines.yml,
# nightly-watchdog.yml (körs på GitHub-hostade runners där `gh` är
# förinstallerat OCH versionshanterat AV GITHUB SJÄLVT — samma kategori
# som jq på samma runners, vi äger inte den installationsvägen); samt
# scripts/ci-metrics.mjs (Node, redan fångar+ytpresenterar gh:s egen
# felsträng via ApiError — se filens egen `gh()`-hjälpare, en nightly-
# rapporteringsväg, inte landningskritisk). Se TASK-312-kortets
# slutrapport för den fulla avvägningen.
#
# ═══ ENV-OVERRIDE (test-isolering) ═══
#
#   GH_GUARD_POLICY_FILE   Policyfilens sökväg. Default: lib-relativt
#                          (samma mekanism som jq-guard.sh:s
#                          JQ_GUARD_POLICY_FILE — se den filens § POLICY-
#                          FILENS SÖKVÄG för den fulla motiveringen).
#
# DENNA FIL SOURCAS, KÖRS ALDRIG DIREKT — den sätter därför INGA globala
# `set`-flaggor.

_GH_GUARD_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly _GH_GUARD_LIB_DIR
_GH_GUARD_DEFAULT_POLICY_FILE="${_GH_GUARD_LIB_DIR}/../../.gh-version-policy.conf"
readonly _GH_GUARD_DEFAULT_POLICY_FILE

# gh_version_ok — fail-closed. Returnerar 0 om gh FINNS och dess version är
# >= policyns GH_MIN_VERSION, annars 1 (skäl på stderr).
gh_version_ok() {
    local policy_file="${GH_GUARD_POLICY_FILE:-${_GH_GUARD_DEFAULT_POLICY_FILE}}"
    local GH_MIN_VERSION=""

    if ! command -v gh > /dev/null 2>&1; then
        echo "gh saknas i PATH." >&2
        return 1
    fi

    if [[ ! -f "${policy_file}" ]]; then
        echo "gh-versionspolicyn saknas: ${policy_file} (fail-closed — vägrar gissa lägsta gh-version)." >&2
        return 1
    fi

    # shellcheck disable=SC2310  # avsiktligt: eget, tydligt skäl via if/echo
    # i stället för set -e:s tysta död — se scripts/lib/jq-guard.sh:s
    # motsvarande header-stycke.
    # shellcheck source=/dev/null
    if ! source "${policy_file}"; then
        echo "Kunde inte läsa ${policy_file} (syntaxfel?)." >&2
        return 1
    fi

    if [[ -z "${GH_MIN_VERSION}" ]]; then
        echo "${policy_file} saknar GH_MIN_VERSION (fail-closed — vägrar gissa lägsta gh-version)." >&2
        return 1
    fi

    local raw actual
    raw="$(gh --version 2> /dev/null)"
    # gh --version svarar "gh version 2.96.0 (2026-07-02)\n<url>".
    actual="$(printf '%s' "${raw}" | sed -nE 's/^gh version ([0-9]+\.[0-9]+(\.[0-9]+)?).*/\1/p')"

    if [[ -z "${actual}" ]]; then
        echo "Kunde inte tolka 'gh --version'-utdata ('${raw}')." >&2
        return 1
    fi

    # shellcheck disable=SC2310  # samma avsiktliga mönster som ovan.
    if ! _gh_guard_version_ge "${actual}" "${GH_MIN_VERSION}"; then
        echo "gh ${actual} < policyns lägsta ${GH_MIN_VERSION} (${policy_file}). Uppgradera gh (macOS: brew upgrade gh)." >&2
        return 1
    fi

    return 0
}

# _gh_guard_version_ge A B — sant (exit 0) om version A >= B. Identisk
# implementation som scripts/lib/jq-guard.sh:s _jq_guard_version_ge —
# medvetet EN egen kopia per lib-fil (ingen delad tredje lib-fil bara för
# denna 15-radersfunktion; se TASK-312-kortets slutrapport för avvägningen)
# i stället för att bygga en delad version-compare-modul, en abstraktion
# utan en tredje faktisk användare (dubbelriktad över-engineering-vakt).
_gh_guard_version_ge() {
    local a="$1" b="$2"
    local -a av bv
    IFS='.' read -ra av <<< "${a}"
    IFS='.' read -ra bv <<< "${b}"
    local max=${#av[@]}
    if ((${#bv[@]} > max)); then
        max=${#bv[@]}
    fi
    local i ai bi
    for ((i = 0; i < max; i++)); do
        ai="${av[i]:-0}"
        bi="${bv[i]:-0}"
        if ((10#${ai} > 10#${bi})); then
            return 0
        elif ((10#${ai} < 10#${bi})); then
            return 1
        fi
    done
    return 0
}
