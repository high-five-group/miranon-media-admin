#!/usr/bin/env bash
# atkomst-diagnos.sh — mekaniserad självdiagnos för åtkomst och nycklar
# (TASK-202).
#
# VARFÖR SKRIPTET FINNS: Marcus blev två gånger ombedd att skapa åtkomster
# han redan hade. Båda gångerna mättes OMGIVNINGEN (miljövariabler,
# konfigkataloger) i stället för ÅTKOMSTEN (kan verktyget faktiskt använda
# nyckeln/filen just nu?) — se docs/reference/atkomst-och-nycklar.md § Bakgrund
# för den fulla, källmärkta historien. Det här skriptet KÖR bevis-kommandona
# i stället för att någon ska minnas eller gissa dem.
#
# VAD SKRIPTET INTE ÄR: en CI-grind. Det fäller aldrig — exit-koden är
# ALLTID 0 (se slutet av filen). Varje rad bär sitt eget verdikt i texten;
# läsaren avgör om något behöver åtgärdas. Samma ärlighets-krav som
# check-docs.sh (L351): ett verktyg som saknas rapporteras SKIPPAT, aldrig
# tyst och aldrig som "OK".
#
# Config: .atkomst-diagnos-policy.conf (projekt-specifika värden — vilka
# nyckelringsposter just detta projekts verktygskedja förväntar sig, samt
# timeout-budgetarna för de skarpa bevis-proven). Skriptets LOGIK nedan är
# universell (Lesson #6, UNIVERSAL) — se .atkomst-diagnos-policy.conf för
# duplicerings-stegen till ett nytt spoke.
#
# Körs via: npm run atkomst:diagnos

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
POLICY_FILE="${ATKOMST_DIAGNOS_POLICY:-${REPO_ROOT}/.atkomst-diagnos-policy.conf}"

# Fail-open defaults: tom lista / rimliga fallback-timeouts. En policy-fil
# som saknas (nytt spoke som ännu inte duplicerat den) ska inte krascha
# skriptet — bara hoppa över nyckelrings-avsnittet.
ATKOMST_DIAGNOS_KEYCHAIN_SERVICES=()
ATKOMST_DIAGNOS_GH_TIMEOUT_SEC=15
ATKOMST_DIAGNOS_SUPABASE_TIMEOUT_SEC=20

if [[ -f "${POLICY_FILE}" ]]; then
    # shellcheck source=/dev/null
    source "${POLICY_FILE}"
fi

say() { printf '%s\n' "$1"; }
section() {
    printf '\n=== %s ===\n' "$1"
}

# --- run_bounded <timeout_sek> <outfile> -- <kommando...> ------------------
# macOS saknar `timeout`/`gtimeout` som default. Kör kommandot i bakgrunden,
# poll:ar var sekund, och dödar HELA processgruppen (kommandot + ev. barn,
# t.ex. npx som förgrenar en node-process) vid överskriden budget. Retur 124
# signalerar timeout, i övrigt kommandots egen exitkod.
run_bounded() {
    local budget_sec="$1" outfile="$2"
    shift 2
    : >"${outfile}"
    "$@" >"${outfile}" 2>&1 &
    local cmd_pid=$!
    local waited=0
    while kill -0 "${cmd_pid}" 2>/dev/null && ((waited < budget_sec)); do
        sleep 1
        waited=$((waited + 1))
    done
    if kill -0 "${cmd_pid}" 2>/dev/null; then
        pkill -TERM -P "${cmd_pid}" 2>/dev/null || true
        kill -TERM "${cmd_pid}" 2>/dev/null || true
        sleep 1
        pkill -KILL -P "${cmd_pid}" 2>/dev/null || true
        kill -KILL "${cmd_pid}" 2>/dev/null || true
        wait "${cmd_pid}" 2>/dev/null || true
        return 124
    fi
    local rc=0
    wait "${cmd_pid}" || rc=$?
    return "${rc}"
}

# --- Värdapp-identifiering ---------------------------------------------------
# TCC-behörighet sätts per app-BUNDLE (com.microsoft.VSCode), inte per
# processnamn ("bash", "node"). Vi går uppåt i processkedjan från detta
# skripts egen PID tills vi hittar en process vars körbara sökväg pekar in i
# ett .app-bundle, och läser bundlens Info.plist för det maskinläsbara
# bundle-ID:t (samma ID som TCC.db använder som `client`).
HOST_APP_BUNDLE_ID=""
HOST_APP_BUNDLE_NAME=""
HOST_APP_CHAIN=()

find_host_app() {
    local pid="${1}"
    local depth=0
    local comm bundle_root bundle_id bundle_name
    while [[ -n "${pid}" ]] && ((depth < 30)); do
        comm="$(ps -o comm= -p "${pid}" 2>/dev/null || true)"
        [[ -z "${comm}" ]] && break
        HOST_APP_CHAIN+=("${comm##*/}")
        if [[ "${comm}" == *.app/Contents/* ]]; then
            bundle_root="${comm%%.app/*}.app"
            bundle_id="$(defaults read "${bundle_root}/Contents/Info" CFBundleIdentifier 2>/dev/null || true)"
            if [[ -n "${bundle_id}" ]]; then
                bundle_name="$(defaults read "${bundle_root}/Contents/Info" CFBundleName 2>/dev/null || true)"
                HOST_APP_BUNDLE_ID="${bundle_id}"
                HOST_APP_BUNDLE_NAME="${bundle_name:-${bundle_id}}"
                return 0
            fi
        fi
        pid="$(ps -o ppid= -p "${pid}" 2>/dev/null | tr -d '[:space:]' || true)"
        [[ "${pid}" == "1" || -z "${pid}" ]] && break
        depth=$((depth + 1))
    done
    return 1
}

# --- TCC-uppslag -------------------------------------------------------------
# Ordagrann läsning av auth_value ur användarens TCC.db. 2 = tillåten,
# 0 = nekad. Frånvarande rad = aldrig frågad (varken tillåten eller nekad).
# TCC-VÄRDET ÄR INTE SAMMA SAK SOM FAKTISK LÄSBARHET (se
# docs/reference/atkomst-och-nycklar.md § Fil-åtkomstmatris, öppna frågorna
# 1 och 2) — det här uppslaget är en DIAGNOS-hjälp när den faktiska
# lästesten redan sagt NEKAD, aldrig ett substitut för lästesten själv.
tcc_lookup() {
    local bundle_id="${1}" service="${2}"
    local db="${HOME}/Library/Application Support/com.apple.TCC/TCC.db"
    if ! command -v sqlite3 >/dev/null 2>&1; then
        printf 'sqlite3 saknas'
        return
    fi
    if [[ ! -r "${db}" ]]; then
        printf 'TCC.db oläsbar'
        return
    fi
    if [[ "${bundle_id}" == *"'"* ]]; then
        printf 'ogiltigt bundle-id'
        return
    fi
    local val
    val="$(sqlite3 "${db}" "SELECT auth_value FROM access WHERE client='${bundle_id}' AND service='${service}';" 2>/dev/null | head -1 || true)"
    case "${val}" in
        2) printf 'tillåten (2)' ;;
        0) printf 'nekad (0)' ;;
        "") printf 'ingen post (aldrig frågad)' ;;
        *) printf 'värde %s (okänt)' "${val}" ;;
    esac
}

# --- Faktisk läsbarhet --------------------------------------------------------
# KRITISK FÄLLA (dokumenterad i uppdraget som gav upphov till detta skript):
# formen `ls DIR >/dev/null 2>&1 && echo OK || echo NEKAD` kan ge FALSKT
# NEKAD. Fånga exitkod och stderr separat i stället.
check_dir() {
    local label="${1}" dir="${2}" tcc_service="${3}"
    local out rc
    out="$(ls "${dir}" 2>&1 >/dev/null)"
    rc=$?
    if ((rc == 0)); then
        say "  ${label}: OK"
        return
    fi
    say "  ${label}: NEKAD — ${out}"
    if [[ -n "${HOST_APP_BUNDLE_ID}" ]]; then
        local tcc_val
        tcc_val="$(tcc_lookup "${HOST_APP_BUNDLE_ID}" "${tcc_service}")"
        say "    TCC-värde för ${HOST_APP_BUNDLE_ID} / ${tcc_service}: ${tcc_val}"
        say "    (Datapunkt, INTE en bekräftad förklaring — TCC-hypotesen"
        say "    falsifierades 2026-08-12, se registret § Aktuellt öppet läge.)"
    fi
    say "    MÖJLIG ÅTGÄRD (OPRÖVAD, ingen bekräftad fix): Systeminställningar →"
    say "    Integritet och säkerhet → Filer och mappar → ${HOST_APP_BUNDLE_NAME:-<värdappen>}"
    say "    → slå på behörigheten → starta om ${HOST_APP_BUNDLE_NAME:-appen}."
    say "    Starkaste kända ledtråd är i stället Claude Code-versionen (korrelation,"
    say "    inte bevisad orsak) — se § Aktuellt öppet läge + § Nästa mätning i"
    say "    docs/reference/atkomst-och-nycklar.md innan du antar att TCC-toggeln hjälper."
}

# ============================================================================
# 1. Värdapp
# ============================================================================
section "Värdapp (processkedja)"
if find_host_app "$$"; then
    say "  Kedja: $(
        IFS=' → '
        printf '%s' "${HOST_APP_CHAIN[*]}"
    )"
    say "  Bundle-ID: ${HOST_APP_BUNDLE_ID} (${HOST_APP_BUNDLE_NAME})"
else
    say "  Kunde inte identifiera ett .app-bundle i processkedjan."
    if ((${#HOST_APP_CHAIN[@]} > 0)); then
        say "  Kedja (utan bundle-träff): $(
            IFS=' → '
            printf '%s' "${HOST_APP_CHAIN[*]}"
        )"
    fi
    say "  TCC-uppslag hoppas över nedan — inget bundle-ID att slå upp mot."
fi
if command -v claude >/dev/null 2>&1; then
    claude_version="$(claude --version 2>/dev/null || true)"
    say "  Claude Code-version (installerad på disk, ej nödvändigtvis vad DEN"
    say "  HÄR sessionen kör — en pågående session byter inte version"
    say "  retroaktivt, se registret § Nästa mätning): ${claude_version:-okänt}"
fi

# ============================================================================
# 2. Fil-åtkomst
# ============================================================================
section "Fil-åtkomst (faktisk läsbarhet, inte TCC-tabellen ensam)"
check_dir "Downloads" "${HOME}/Downloads" "kTCCServiceSystemPolicyDownloadsFolder"
check_dir "Desktop  " "${HOME}/Desktop" "kTCCServiceSystemPolicyDesktopFolder"
check_dir "Documents" "${HOME}/Documents" "kTCCServiceSystemPolicyDocumentsFolder"
say "  OBS: utfallet kan variera mellan sessioner OCH inom en och samma"
say "  session utan känd utlösande händelse (mätt intermittens, TASK-202) —"
say "  lita alltid på RADERNA OVAN, aldrig på ett resultat från en tidigare körning."

# ============================================================================
# 3. Nyckelringsposter (namn, ALDRIG värden)
# ============================================================================
section "Nyckelringsposter (existens, aldrig värden)"
if ((${#ATKOMST_DIAGNOS_KEYCHAIN_SERVICES[@]} == 0)); then
    say "  Ingen lista konfigurerad (.atkomst-diagnos-policy.conf saknas eller tom) — hoppar över."
else
    for svc in "${ATKOMST_DIAGNOS_KEYCHAIN_SERVICES[@]}"; do
        if security find-generic-password -s "${svc}" >/dev/null 2>&1; then
            say "  ${svc}: FINNS"
        else
            say "  ${svc}: SAKNAS"
        fi
    done
fi

# ============================================================================
# 4. gh auth status — skarpt bevis-prov, bounded
# ============================================================================
section "gh auth status (bounded, ${ATKOMST_DIAGNOS_GH_TIMEOUT_SEC}s)"
if ! command -v gh >/dev/null 2>&1; then
    say "  SKIPPAT — gh-binären saknas lokalt."
else
    gh_out_file="$(mktemp)"
    if run_bounded "${ATKOMST_DIAGNOS_GH_TIMEOUT_SEC}" "${gh_out_file}" gh auth status; then
        say "  OK — inloggad:"
    else
        gh_rc=$?
        if ((gh_rc == 124)); then
            say "  TIMEOUT efter ${ATKOMST_DIAGNOS_GH_TIMEOUT_SEC}s — avbruten, inget svar hunnet."
        else
            say "  Utfall: ej inloggad eller fel (exitkod ${gh_rc}):"
        fi
    fi
    while IFS= read -r line; do
        say "    ${line}"
    done <"${gh_out_file}"
    rm -f "${gh_out_file}"
fi

# ============================================================================
# 5. Supabase CLI — skarpt bevis-prov, bounded
# ============================================================================
# Använder `projects list`, INTE `link` — `link` ställer en
# databas-lösenordsprompt och väntar på stdin, vilket i en headless-miljö
# ser ut som en hängning (den faktiska rotorsaken bakom detta skript, se
# docs/reference/atkomst-och-nycklar.md § Rotorsak 1). `projects list`
# svarar direkt om inloggningen är giltig.
section "npx supabase projects list (bounded, ${ATKOMST_DIAGNOS_SUPABASE_TIMEOUT_SEC}s)"
if ! command -v npx >/dev/null 2>&1; then
    say "  SKIPPAT — npx saknas lokalt."
else
    sb_out_file="$(mktemp)"
    if run_bounded "${ATKOMST_DIAGNOS_SUPABASE_TIMEOUT_SEC}" "${sb_out_file}" npx supabase projects list; then
        say "  OK — svarade inom tidsbudgeten:"
    else
        sb_rc=$?
        if ((sb_rc == 124)); then
            say "  TIMEOUT efter ${ATKOMST_DIAGNOS_SUPABASE_TIMEOUT_SEC}s — avbruten, inget svar hunnet."
            say "  (Detta är INTE samma sak som 'ingen inloggning' — se § Rotorsak 1"
            say "  i registret. Kör om manuellt med styrd stdin för att skilja dem åt:"
            say "  echo \"\" | npx supabase link --project-ref <ref>)"
        else
            say "  Utfall: ej inloggad eller fel (exitkod ${sb_rc}):"
        fi
    fi
    while IFS= read -r line; do
        say "    ${line}"
    done <"${sb_out_file}"
    rm -f "${sb_out_file}"
fi

# ============================================================================
say ""
say "Diagnos klar. Det här är ett DIAGNOSVERKTYG, inte en grind — exit 0 alltid."
say "Fullständigt register: docs/reference/atkomst-och-nycklar.md"
exit 0
