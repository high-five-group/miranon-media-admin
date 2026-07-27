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
# EFTER EN PUSH: använd `--commit "$(git rev-parse HEAD)"`, inte `--pr`.
#   GitHubs PR-API kan returnera FÖREGÅENDE head-SHA i sekunderna efter en push
#   (empiriskt fångat 2026-07-25: --pr latchade på den gamla, röda körningen och
#   rapporterade dess utfall som om det vore den nya pushens). Det lokala SHA:t
#   är auktoritativt för "commiten jag just pushade" — API:t är det inte.
#   Skriptet skriver alltid ut vilket SHA det följer så drift syns direkt.
#
# SUPERSEDDAD ≠ RÖD (S91, mekaniserings-punkt 3)
#   `cancel-in-progress: true` avbryter föregående körning vid varje ny push, och
#   en orkestrerare som kör update-branch på en agents gren gör exakt samma sak
#   (S91 Del 3: en grön körning dödades 12 minuter in). Utfallet blev "RÖD" och
#   skickade läsaren att felsöka en körning som aldrig hade något fel — den var
#   bara inaktuell.
#   GitHubs API bär INGET fält för avbrottsorsaken: verifierat mot körning
#   30201494270 (2026-07-26), där conclusion är enbart "cancelled" och varken
#   run_attempt, event eller tidsstämplarna skiljer concurrency-avbrott från
#   manuellt. Nyckeln är därför den enda som spelar roll för beslutet: FINNS en
#   nyare körning för samma branch och workflow? Då är den här körningens utfall
#   irrelevant oavsett varför det dog.
#   Fail-closed är oförändrat i båda riktningarna: cancelled UTAN nyare körning
#   fäller fortfarande (exit 1), och ett äkta `failure` vinner alltid över
#   superseddad-statusen — en körning som hann falla innan den avbröts bär
#   verklig information och får aldrig tystas.
#
# EXIT-KODER (fail-closed)
#   0  terminal + inget jobb failade         2  timeout (budgeten slut)
#   1  minst ett jobb failade, eller          3  användningsfel / kunde ej lösa run
#      avbröts utan nyare körning             4  superseddad av en nyare körning
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

# --commit KRÄVER full 40-teckens SHA (S91, 2026-07-27).
#
# `gh run list --commit` matchar inte förkortade SHA:n. Den returnerar TOM
# lista med exit 0 — inget fel, inget varsel. Vakten läser tomheten som "ingen
# körning ännu", pollar hela budgeten och rapporterar sedan timeout, vilket
# läses som ett CI-problem. Fällan kostade en hel vaktcykel innan orsaken var
# hittad, och körningen fanns hela tiden.
#
# `--pr`-grenen är immun: den slår upp `headRefOid`, som alltid är full SHA.
# Bara denna gren bär fällan, och därför fäller vi HÄR i stället för att låta
# instrumentet tystna. Ett mätinstrument som går sönder ljudlöst är värre än
# inget — samma princip som bär hermetik-rapportens en-källa-konstant.
if [[ "${MODE}" == "commit" && ! "${TARGET}" =~ ^[0-9a-fA-F]{40}$ ]]; then
    die "--commit kräver FULL 40-teckens SHA — fick '${TARGET}' (${#TARGET} tecken).
   gh run list --commit matchar inte förkortade SHA:n: den ger TOM lista utan
   felkod, så vakten hade pollat till timeout och rapporterat ett CI-problem
   som inte finns.
   Använd:  --commit \"\$(git rev-parse HEAD)\"   eller   --pr <nummer>"
fi

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

# Visa vilket SHA körningen tillhör — gör API-drift (stale headRefOid) synlig
# i stället för tyst. Se § EFTER EN PUSH i huvudet.
set +e
RUN_SHA="$("${GH}" run view "${RUN_ID}" --json headSha -q '.headSha' 2>/dev/null)"
SHA_RC=$?
set -e
if [[ "${SHA_RC}" -eq 0 && -n "${RUN_SHA}" ]]; then
    say "ci-wait: följer körning ${RUN_ID} (commit ${RUN_SHA:0:8})"
else
    say "ci-wait: följer körning ${RUN_ID} (commit okänd)"
fi

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

# --- Steg 4: superseddad-prövning ------------------------------------------
# Se § SUPERSEDDAD ≠ RÖD i huvudet. Prövningen hänger på TOPP-NIVÅNS conclusion
# och sker FÖRE per-jobb-fällningen. Båda delarna är empiriskt tvingade:
#
#   (a) Jobb-mönstret duger inte som nyckel. Aggregatorn "CI Passed or Skipped"
#       failar BY DESIGN när jobb avbryts (S77:s fail-closed-form), så en
#       avbruten körning bär nästan alltid ett failure-jobb. Kartläggning av
#       fyra verkliga avbrutna körningar 2026-07-26 (30202493540, 30201694815,
#       30201501825, 30201387903) visade att jobb-mönstren varierar helt medan
#       topp-conclusion är "cancelled" i samtliga.
#   (b) Prövningen måste ske före failure-grenen, just för att aggregatorns
#       failure är en FÖLJD av avbrottet och inte oberoende information.
#
# Endast AVBRUTNA körningar kan supersederas: en körning som genuint failade
# behåller sitt röda utfall även om en nyare finns (T12d).
if [[ "${CONCLUSION}" == "cancelled" ]]; then
    set +e
    RUN_META="$("${GH}" run view "${RUN_ID}" --json headBranch,createdAt,workflowName \
        -q '.headBranch + "\t" + .createdAt + "\t" + .workflowName' 2>/dev/null)"
    META_RC=$?
    set -e

    NEWER=""
    if [[ "${META_RC}" -eq 0 && -n "${RUN_META}" ]]; then
        IFS=$'\t' read -r RUN_BRANCH RUN_CREATED RUN_WF <<<"${RUN_META}"
        if [[ -n "${RUN_BRANCH}" && -n "${RUN_CREATED}" ]]; then
            # ISO-8601 med Z jämförs korrekt lexikografiskt, så strikt > räcker
            # för "startade senare". Workflow-namnet filtreras med så att en
            # annan workflow på samma gren inte räknas som efterträdare.
            set +e
            NEWER="$("${GH}" run list --branch "${RUN_BRANCH}" --limit 30 \
                --json databaseId,createdAt,workflowName \
                -q "[.[] | select(.workflowName == \"${RUN_WF}\") \
                    | select(.createdAt > \"${RUN_CREATED}\")] \
                    | .[0].databaseId // empty" 2>/dev/null)"
            set -e
        fi
    fi

    if [[ -n "${NEWER}" ]]; then
        printf 'ci-wait: SUPERSEDDAD — körning %s avbröts och har efterträtts av %s på samma gren.\n' \
            "${RUN_ID}" "${NEWER}" >&2
        printf 'ci-wait: utfallet är INAKTUELLT, inte rött — men det är inte heller ett\n' >&2
        printf '  grönt bevis. Exit 4 får ALDRIG behandlas som klart-att-landa.\n' >&2
        printf '  Följ efterträdaren:  bash scripts/ci-wait.sh --run %s\n' "${NEWER}" >&2
        exit 4
    fi

    # Ingen efterträdare (eller metadata gick inte att läsa) ⇒ fail-closed som förr.
    printf 'ci-wait: RÖD — körning %s avbröts och ingen nyare körning hittades.\n' \
        "${RUN_ID}" >&2
    exit 1
fi

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
