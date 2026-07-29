#!/usr/bin/env bash
# scripts/staging-semaphore.sh — staging-/server-semaforen för parallella
# batch-pipelines (ADR-073 beslut 3; formaliserad ur S65-pilotens
# scratchpad-artefakt i S66).
#
# ETT mkdir-atomiskt fillås över ALLA pipelines runt allt som startar
# server eller rör staging-datat: Playwrights webServer är GLOBAL per
# config-fil, och staging-fixturer/sentineller delas (TASK-6-klassen).
# Låsfönster hålls korta — en svit i taget, release direkt efteråt.
#
# Port-pre-flight ingår MEDVETET inte i acquire: porten kan legitimt
# bära människans dev-server (task-5-kontraktet ger hård vägran i
# Playwright-ledet), och beslutet kör-lokalt-mot-ledig-port kontra
# bevisa-via-PR-CI fattas av anroparen EFTER acquire.
#
# ═══ CI-DIMENSIONEN (TASK-77) — subkommandot `preflight` ═══
# Fillåset ovan binder LOKALT: pipeline mot pipeline på samma maskin. Det
# binder ingenting mot CI. Concurrency-gruppen `staging-tests` binder
# spegelvänt: CI-run mot CI-run, ingenting lokalt. Mellan de två mutexarna
# fanns ett hål rakt igenom — en lokal `npm run test:api:staging` och ett
# CI-jobb kunde stå i samma Airtable-bas samtidigt utan att någon av
# mekanismerna såg den andra.
#
# `preflight` stänger hålet från den lokala sidan: den frågar GitHubs
# körnings-API om ett staging-rörande jobb är igång eller köat just nu, och
# FÄLLER om svaret är ja. Riktningen är medvetet enkelriktad — CI får inte ett
# nytt beroende, och ingen ny sanningskälla införs utanför de två system som
# redan finns. GitHub Actions ÄR auktoritet på sitt eget körningsläge; den
# lokala sidan frågar bara.
#
# Airtables P26/P27 (ingen per-run-isolering, docs/reference/airtable-
# constraints.md) är PREMISS här, inte något detta löser: staging är EN delad
# bas, och mekanismen gör arbetet robust under den väggen. Per-run-isolering
# ägs av T85 våg 3.
#
# FAIL-CLOSED, med en dokumenterad väg förbi: svarar sonden inte (gh saknas,
# utloggad, nätet nere) fäller den med exit 77 i stället för att släppa
# igenom. Att läsa "inget svar" som "fritt" vore att bygga ett faktapåstående
# på avsaknad av data — samma L322-klass som larm-jobbet i nightly.yml lärde
# sig den hårda vägen. Vägen förbi är ETT aktivt val:
#
#     MM_STAGING_PREFLIGHT=off npm run test:api:staging
#
# Bruk:  bash scripts/staging-semaphore.sh acquire <ägare> [timeout_s]
#        bash scripts/staging-semaphore.sh release <ägare>
#        bash scripts/staging-semaphore.sh status
#        bash scripts/staging-semaphore.sh preflight <ägare>
# Exit:  0 OK · 64 fel bruk/policy · 74 fel ägare vid release · 75 timeout
#        76 CI håller staging · 77 sonden kunde inte svara (fail-closed)
#
# Testsvit: scripts/test-staging-semaphore.sh
set -euo pipefail

LOCK_DIR="${MM_STAGING_LOCK_DIR:-/tmp/mm-staging-semaphore.lock}"
CMD="${1:?bruk: acquire|release|status|preflight}"
OWNER="${2:-}"

# gh-binären kan överstyras med GH_BIN (testsvitens stub-väg) — samma form
# som scripts/ci-wait.sh, av samma skäl: sonden ska kunna provas utan nät.
GH="${GH_BIN:-gh}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STAGING_SEMAPHORE_POLICY="${STAGING_SEMAPHORE_POLICY:-${SCRIPT_DIR}/../.staging-semaphore-policy.conf}"

case "${CMD}" in
    acquire)
        [[ -n "${OWNER}" ]] || { echo "acquire kräver <ägare>" >&2; exit 64; }
        TIMEOUT="${3:-1800}"
        WAITED=0
        while ! mkdir "${LOCK_DIR}" 2>/dev/null; do
            HOLDER="$(cat "${LOCK_DIR}/owner" 2>/dev/null || echo 'okänd')"
            if [[ "${WAITED}" -ge "${TIMEOUT}" ]]; then
                echo "TIMEOUT efter ${WAITED}s — låset hålls av: ${HOLDER}" >&2
                exit 75
            fi
            sleep 10
            WAITED=$((WAITED + 10))
        done
        echo "${OWNER}" > "${LOCK_DIR}/owner"
        date +%s > "${LOCK_DIR}/acquired_at"
        echo "ACQUIRED av ${OWNER} (väntade ${WAITED}s)"
        ;;
    release)
        [[ -n "${OWNER}" ]] || { echo "release kräver <ägare>" >&2; exit 64; }
        HOLDER="$(cat "${LOCK_DIR}/owner" 2>/dev/null || echo '')"
        if [[ "${HOLDER}" != "${OWNER}" ]]; then
            echo "VÄGRAR release: låset hålls av '${HOLDER}', inte '${OWNER}'" >&2
            exit 74
        fi
        rm -f "${LOCK_DIR}/owner" "${LOCK_DIR}/acquired_at"
        rmdir "${LOCK_DIR}"
        echo "RELEASED av ${OWNER}"
        ;;
    status)
        if [[ -d "${LOCK_DIR}" ]]; then
            HOLDER="$(cat "${LOCK_DIR}/owner" 2>/dev/null || echo 'okänd')"
            SINCE="$(cat "${LOCK_DIR}/acquired_at" 2>/dev/null || echo '?')"
            echo "LÅST av ${HOLDER} sedan epoch ${SINCE}"
        else
            echo "LEDIGT"
        fi
        ;;
    preflight)
        [[ -n "${OWNER}" ]] || { echo "preflight kräver <ägare>" >&2; exit 64; }

        # Vägen förbi mekanismen (TASK-77 AC#4). Den är HÖGLJUDD med flit:
        # ett medvetet val ska synas i loggen, så att en kollision i efterhand
        # går att härleda till valet i stället för till mekanismen.
        if [[ "${MM_STAGING_PREFLIGHT:-}" == "off" ]]; then
            echo "PREFLIGHT AVSTÄNGD (MM_STAGING_PREFLIGHT=off) — ${OWNER} kör mot staging utan CI-kontroll." >&2
            exit 0
        fi

        if [[ ! -f "${STAGING_SEMAPHORE_POLICY}" ]]; then
            echo "Policy-filen saknas: ${STAGING_SEMAPHORE_POLICY}" >&2
            echo "Utan den vet sonden inte vilka workflows och jobb som rör staging." >&2
            exit 64
        fi
        # shellcheck source=/dev/null
        . "${STAGING_SEMAPHORE_POLICY}"

        if [[ -z "${STAGING_CI_WORKFLOWS+x}" ]] || [[ -z "${STAGING_CI_JOBS+x}" ]]; then
            echo "Policy-filen saknar STAGING_CI_WORKFLOWS eller STAGING_CI_JOBS: ${STAGING_SEMAPHORE_POLICY}" >&2
            exit 64
        fi
        if [[ "${#STAGING_CI_WORKFLOWS[@]}" -eq 0 ]] || [[ "${#STAGING_CI_JOBS[@]}" -eq 0 ]]; then
            echo "Policy-filens listor är tomma: ${STAGING_SEMAPHORE_POLICY}" >&2
            echo "En tom lista hade gjort sonden tyst grön — det fälls i stället." >&2
            exit 64
        fi
        RUN_LIMIT="${STAGING_CI_RUN_LIMIT:-20}"

        for WF in "${STAGING_CI_WORKFLOWS[@]}"; do
            # Exit-koden fångas SEPARAT. Formen `$(gh ... || echo "")` kollapsar
            # "anropet gick fel" och "det finns inget svar" till samma tomma
            # sträng — och då blir ett faktapåstående byggt på frånvaro av data
            # (L322). Här skiljs de åt: fel ⇒ 77, tomt ⇒ ledigt.
            RC=0
            IDS="$("${GH}" run list --workflow "${WF}" --limit "${RUN_LIMIT}" \
                --json databaseId,status \
                --jq '.[] | select(.status != "completed") | .databaseId' </dev/null)" || RC=$?
            if [[ "${RC}" -ne 0 ]]; then
                echo "SONDEN KUNDE INTE SVARA: 'gh run list --workflow ${WF}' gav exit ${RC}." >&2
                echo "Preflighten fäller hellre än gissar (fail-closed). Kontrollera 'gh auth status' och nätet." >&2
                echo "Medvetet förbi: MM_STAGING_PREFLIGHT=off <ditt kommando>" >&2
                exit 77
            fi

            while IFS= read -r RUN_ID; do
                [[ -n "${RUN_ID}" ]] || continue

                RC=0
                JOBS="$("${GH}" api "repos/{owner}/{repo}/actions/runs/${RUN_ID}/jobs" \
                    --jq '.jobs[] | "\(.status)\t\(.name)"' </dev/null)" || RC=$?
                if [[ "${RC}" -ne 0 ]]; then
                    echo "SONDEN KUNDE INTE SVARA: jobb-listan för körning ${RUN_ID} gav exit ${RC}." >&2
                    echo "Preflighten fäller hellre än gissar (fail-closed)." >&2
                    echo "Medvetet förbi: MM_STAGING_PREFLIGHT=off <ditt kommando>" >&2
                    exit 77
                fi

                while IFS=$'\t' read -r JOB_STATUS JOB_NAME; do
                    [[ -n "${JOB_NAME}" ]] || continue
                    # `completed` täcker även skipped: en docs-landning där
                    # klassningen ärvde D0 ger completed/skipped på svit-raden,
                    # och den ska INTE fälla (verifierat mot run 30440662509).
                    [[ "${JOB_STATUS}" != "completed" ]] || continue

                    for PAT in "${STAGING_CI_JOBS[@]}"; do
                        # Två former: jobbet i egen workflow ("Nattlig fullsvit")
                        # och det nästlade reusable-namnet
                        # ("<anropare> / Staging (API + E2E)").
                        if [[ "${JOB_NAME}" == "${PAT}" ]] || [[ "${JOB_NAME}" == *" / ${PAT}" ]]; then
                            echo "CI HÅLLER STAGING — ${OWNER} stoppas." >&2
                            echo "  workflow : ${WF}" >&2
                            echo "  körning  : ${RUN_ID}" >&2
                            echo "  jobb     : ${JOB_NAME} (${JOB_STATUS})" >&2
                            echo "" >&2
                            echo "Staging är EN delad bas (Airtable P26/P27) — en lokal körning nu" >&2
                            echo "kan ge ett falskt rött på det landade trädet, med tilldelat" >&2
                            echo "revert-ärende som följd. Vänta ut körningen, eller välj aktivt:" >&2
                            echo "  MM_STAGING_PREFLIGHT=off <ditt kommando>" >&2
                            exit 76
                        fi
                    done
                done <<< "${JOBS}"
            done <<< "${IDS}"
        done

        echo "PREFLIGHT OK — inget staging-rörande CI-jobb igång (${OWNER})."
        ;;
    *)
        echo "okänt kommando: ${CMD} (bruk: acquire|release|status|preflight)" >&2
        exit 64
        ;;
esac
