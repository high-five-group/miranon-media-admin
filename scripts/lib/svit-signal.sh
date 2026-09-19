#!/usr/bin/env bash
# scripts/lib/svit-signal.sh
#
# Delad läsning av "Test suite"-jobbets närvaro/konklusion i EN namngiven
# ci.yml-körning (merge_group ELLER pull_request). Signalen är binär och
# empiriskt verifierad (scripts/classify-post-merge.sh § SIGNALEN — 20
# körningar lästa 2026-07-28): ett SKIPPAT reusable-anrop rapporteras som ETT
# jobb med anropets EGNA namn; ett KÖRT anrop expanderar i stället till sina
# inner-jobb, prefixade "<namn> / " — "Test suite" existerar då INTE som eget
# jobbnamn i listan.
#
# ═══ TVÅ KONSUMENTER, EN LÄSNING (TASK-464.4/SE1) ═══
# scripts/classify-post-merge.sh (docs_only, TASK-73/78) och
# scripts/dedup-huvudgren.sh (dedup_hit, SE1) ställer OLIKA frågor
# ("skippades sviten?" kontra "kördes sviten och blev grön?") om SAMMA
# rådata. ADR-077 § Beslut 1: läs ett redan fattat beslut, bygg aldrig en
# andra implementation av LÄSNINGEN — bara besluten ovanpå den får skilja
# sig. Denna funktion är den delade läsningen; varje anropare tolkar
# signalen enligt sin egen policy och sköter sin egen fail-closed-gren.
#
# KRÄVER, satta av anroparen innan anrop:
#   REPO               owner/namn (till `gh --repo`)
#   CI_SUITE_JOB_NAME   källa: scripts/lib/ci-suite-job-name.sh
#
# ANVÄNDNING
#   signal=$(las_svit_signal <run_id>)
#
# UTSKRIFT (stdout, EN rad) — exakt ett av:
#   RUN                  jobbet KÖRDE (namnet saknas som eget jobb i listan)
#   SKIPPED:<conclusion>  jobbet finns med det exakta namnet; konklusionen
#                         bifogad rakt av (väntat "skipped" — en annan
#                         konklusion är en oväntad form, anroparen avgör
#                         hur den tolkas, den skrivs aldrig om här)
#   API_FEL               `gh run view` svarade inte
#
# Returnerar ALLTID 0 — anroparen läser SIGNALEN på stdout, aldrig
# exitkoden (samma "läs texten, inte bara koden"-disciplin som CLAUDE.md
# § Landning redan kräver av `gh pr merge`-anrop; ett icke-0-svar hade
# krävt att varje anropare även hanterade `set -e`-avbrott mitt i en
# `$(...)`-tilldelning, vilket bara lägger en andra felväg ovanpå den
# redan explicita `API_FEL`-signalen).
las_svit_signal() {
    local run_id="$1"
    local jobs_failed="" suite_concl

    # shellcheck disable=SC2154  # REPO+CI_SUITE_JOB_NAME är ANROPARENS
    # kontrakt (se § KRÄVER ovan) — satta av toppnivå-skriptet (REPO) resp.
    # scripts/lib/ci-suite-job-name.sh (CI_SUITE_JOB_NAME), som DENNA fil
    # aldrig sourcear själv (den är den delade LÄSNINGEN, inte en
    # toppnivå-anropare). shellcheck kan korrelera cross-file när båda
    # filer ges i SAMMA invokation (verifierat: se PR-beskrivningen) men
    # bara mot filer DENNA fil självt sourcear — inte mot en tredje
    # anropares kontrakt.
    suite_concl=$(gh run view "${run_id}" --repo "${REPO}" --json jobs \
        --jq "[.jobs[] | select(.name == \"${CI_SUITE_JOB_NAME}\")][0].conclusion // \"\"") || jobs_failed="1"

    if [[ -n "${jobs_failed}" ]]; then
        echo "API_FEL"
        return 0
    fi
    if [[ -z "${suite_concl}" ]]; then
        echo "RUN"
        return 0
    fi
    echo "SKIPPED:${suite_concl}"
    return 0
}
