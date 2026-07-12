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
# Bruk:  bash scripts/staging-semaphore.sh acquire <ägare> [timeout_s]
#        bash scripts/staging-semaphore.sh release <ägare>
#        bash scripts/staging-semaphore.sh status
# Exit:  0 OK · 64 fel bruk · 74 fel ägare vid release · 75 timeout
set -euo pipefail

LOCK_DIR="${MM_STAGING_LOCK_DIR:-/tmp/mm-staging-semaphore.lock}"
CMD="${1:?bruk: acquire|release|status}"
OWNER="${2:-}"

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
    *)
        echo "okänt kommando: ${CMD} (bruk: acquire|release|status)" >&2
        exit 64
        ;;
esac
