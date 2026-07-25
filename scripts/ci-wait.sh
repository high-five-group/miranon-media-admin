#!/usr/bin/env bash
# ci-wait.sh — blockerande, AVGRÄNSAD väntan på en GitHub Actions-körning,
# med per-jobb-verdikt vid terminal-state.
#
# VARFÖR SKRIPTET FINNS (S86-forensiken, 2026-07-25): fix-vågs-agenten brände
#   23 min 30 s av 71 min på DÖD väntan. Orsaken var idiomet
#       perl -e 'alarm N' sh -c 'tail -f LOGG | grep -m1 WATCH-EXIT'
#   som ALDRIG kan avsluta i tid: `tail -f` släpper aldrig pipen även när grep
#   matchat, så alarmen brinner av hela budgeten varje gång (bevis: grep-exit 142
#   i alla tre anropen TROTS att WATCH-EXIT: 0 syns i utdatan). Värst var cykel 3
#   — nio minuters väntan på en körning som varit grön i sju minuter innan vakten
#   ens startade. L340 FÖRESKREV den trasiga formen; amenderad att peka hit.
#
# KORREKT FORM (som samma agent använde felfritt i samma körning, 42 s och 132 s):
#   bounded poll mot gh:s JSON-API, med terminal-kontroll FÖRE första sömnen.
#
# ADR-071 §2(iii) kräver "CI grön PER JOBB" — därför är per-jobb-verdiktet
#   skriptets utdata, inte topp-nivåns conclusion. En skippad required check är
#   fail-open (L322): skippade jobb rapporteras explicit och räknas ALDRIG som
#   bevis, de bara blockerar inte.
#
# ANVÄNDNING
#   scripts/ci-wait.sh --run <id>
#   scripts/ci-wait.sh --commit <sha>   [--workflow <namn>]
#   scripts/ci-wait.sh --pr <nummer>    [--workflow <namn>]
#   scripts/ci-wait.sh --branch <namn>  [--workflow <namn>]
#
#   --timeout <sek>    total budget inkl. run-upplösning (default 900)
#   --interval <sek>   pollintervall (default 20)
#   --quiet            bara slutverdikt
#
# EXIT-KODER (fail-closed)
#   0  terminal + inget jobb failade         2  timeout (budgeten slut)
#   1  minst ett jobb failade/cancelled       3  användningsfel / kunde ej lösa run
#
# gh-binären kan överstyras med GH_BIN (testsvitens stub-väg).
#
# Källa: tasks/sessions/2026-07-25-session-86.md Del 4 (tidsforensiken)
#        tasks/lessons.md L340 (amenderad) · L322 (skippbar check är fail-open)
# Etablerad: Session 87 städ-vågen

set -euo pipefail

GH="${GH_BIN:-gh}"
TIMEOUT=900
INTERVAL=20
QUIET=0
MODE=""
TARGET=""
WORKFLOW=""

die() { printf 'ci-wait: %s\n' "$1" >&2; exit "${2:-3}"; }
say() { [[ "${QUIET}" -eq 1 ]] || printf '%s\n' "$1"; }

while [[ $# -gt 0 ]]; do
    case "$1" in
        --run|--commit|--pr|--branch)
            [[ -n "${MODE}" ]] && die "ange endast ETT av --run/--commit/--pr/--branch"
            MODE="${1#--}"; TARGET="${2:-}"
            [[ -n "${TARGET}" ]] || die "$1 kräver ett värde"
            shift 2 ;;
        --workflow) WORKFLOW="${2:-}"; [[ -n "${WORKFLOW}" ]] || die "--workflow kräver ett värde"; shift 2 ;;
        --timeout)  TIMEOUT="${2:-}";  shift 2 ;;
        --interval) INTERVAL="${2:-}"; shift 2 ;;
        --quiet)    QUIET=1; shift ;;
        -h|--help)  sed -n '22,38p' "$0"; exit 0 ;;
        *) die "okänt argument: $1" ;;
    esac
done

[[ -n "${MODE}" ]] || die "ange ett av --run/--commit/--pr/--branch"
[[ "${TIMEOUT}" =~ ^[0-9]+$ ]] || die "--timeout måste vara ett heltal (sekunder)"
[[ "${INTERVAL}" =~ ^[1-9][0-9]*$ ]] || die "--interval måste vara ett positivt heltal"

NOW="$(date +%s)"
DEADLINE=$(( NOW + TIMEOUT ))

# Budget-kontrollen är medvetet INLINE, inte en funktion: en funktion anropad i
# `||`-position stänger av set -e för hela uttrycket (SC2310), och en
# kommandosubstitution inuti `[[ ]]` maskerar sitt returvärde (SC2312).
# Grinden kör shellcheck --severity=style --enable=all och fäller båda.

# --- Steg 1: lös upp run-ID ------------------------------------------------
# En nypushad commit har ännu ingen run. Vi pollar tills den dyker upp ELLER
# budgeten tar slut — men vi SOVER ALDRIG före första försöket.
list_run() {
    local out rc
    set +e
    if [[ -n "${WORKFLOW}" ]]; then
        out="$("${GH}" run list "$1" "$2" --workflow "${WORKFLOW}" --limit 1 \
              --json databaseId -q '.[0].databaseId' 2>/dev/null)"
    else
        out="$("${GH}" run list "$1" "$2" --limit 1 \
              --json databaseId -q '.[0].databaseId' 2>/dev/null)"
    fi
    rc=$?
    set -e
    [[ "${rc}" -eq 0 && -n "${out}" && "${out}" != "null" ]] || return 1
    printf '%s' "${out}"
}

resolve_run() {
    local sha rc
    case "${MODE}" in
        run)
            printf '%s' "${TARGET}"
            ;;
        pr)
            set +e
            sha="$("${GH}" pr view "${TARGET}" --json headRefOid -q '.headRefOid' 2>/dev/null)"
            rc=$?
            set -e
            [[ "${rc}" -eq 0 && -n "${sha}" ]] || return 1
            list_run --commit "${sha}"
            ;;
        commit)
            list_run --commit "${TARGET}"
            ;;
        branch)
            list_run --branch "${TARGET}"
            ;;
        *)
            die "internt fel: okänd mode '${MODE}'"
            ;;
    esac
}

RUN_ID=""
while :; do
    set +e
    RUN_ID="$(resolve_run)"
    RESOLVE_RC=$?
    set -e
    [[ "${RESOLVE_RC}" -eq 0 && -n "${RUN_ID}" ]] && break

    NOW="$(date +%s)"
    if [[ "${NOW}" -ge "${DEADLINE}" ]]; then
        die "hittade ingen körning för ${MODE}=${TARGET} inom ${TIMEOUT}s" 2
    fi
    say "ci-wait: ingen körning ännu för ${MODE}=${TARGET} — nytt försök om ${INTERVAL}s"
    sleep "${INTERVAL}"
done

say "ci-wait: följer körning ${RUN_ID}"

# --- Steg 2: vänta till terminal-state -------------------------------------
# TERMINAL-KONTROLLEN SKER FÖRE FÖRSTA SÖMNEN. Det var exakt denna ordning
# cykel 3 saknade: körningen var redan klar när vakten startade, men vakten
# sov ändå bort nio minuter innan den läste av.
STATUS=""
CONCLUSION=""
while :; do
    set +e
    RUN_STATE="$("${GH}" run view "${RUN_ID}" --json status,conclusion \
        -q '.status + " " + (.conclusion // "-")' 2>/dev/null)"
    STATE_RC=$?
    set -e
    [[ "${STATE_RC}" -eq 0 && -n "${RUN_STATE}" ]] || RUN_STATE="unknown -"
    read -r STATUS CONCLUSION <<<"${RUN_STATE}"

    [[ "${STATUS}" == "completed" ]] && break

    NOW="$(date +%s)"
    if [[ "${NOW}" -ge "${DEADLINE}" ]]; then
        say "ci-wait: TIMEOUT efter ${TIMEOUT}s — körning ${RUN_ID} står i '${STATUS}'"
        exit 2
    fi
    say "ci-wait: ${STATUS} — nästa avläsning om ${INTERVAL}s"
    sleep "${INTERVAL}"
done

# --- Steg 3: per-jobb-verdikt (ADR-071 §2(iii)) ----------------------------
JOBS="$("${GH}" run view "${RUN_ID}" --json jobs \
        -q '.jobs[] | .name + "\t" + (.conclusion // "pending")' 2>/dev/null || true)"

[[ -n "${JOBS}" ]] || die "kunde inte läsa jobb-listan för körning ${RUN_ID}" 3

FAILED=0
SKIPPED=0
say "ci-wait: per jobb —"
while IFS=$'\t' read -r name conclusion; do
    [[ -n "${name}" ]] || continue
    say "  ${name}: ${conclusion}"
    case "${conclusion}" in
        success)            ;;
        skipped)            SKIPPED=$(( SKIPPED + 1 )) ;;
        # Fail-closed: allt som inte är uttryckligen grönt eller skippat fäller.
        *)                  FAILED=$(( FAILED + 1 )) ;;
    esac
done <<<"${JOBS}"

if [[ "${FAILED}" -gt 0 ]]; then
    printf 'ci-wait: RÖD — %d jobb failade i körning %s (topp-conclusion: %s)\n' \
        "${FAILED}" "${RUN_ID}" "${CONCLUSION}" >&2
    exit 1
fi

if [[ "${SKIPPED}" -gt 0 ]]; then
    say "ci-wait: ${SKIPPED} jobb SKIPPADE — de blockerar inte, men bevisar ingenting (L322)."
fi

say "ci-wait: GRÖN per jobb — körning ${RUN_ID}"
exit 0
