#!/usr/bin/env bash
#
# scripts/audit-ci-med-degradering.sh — audit-ci med steg-loop och en SMAL
# nätverksdegradering (TASK-395, 2026-09-04).
#
# ═══ VAD SKRIPTET GÖR ═══
#
# 1. Kör `npx audit-ci --config audit-ci.jsonc` upp till ${AUDIT_MAX_FORSOK}
#    gånger (default 5) med ${AUDIT_PAUS_SEKUNDER} s paus emellan (default 30).
#    Första gröna försöket → exit 0. Utdatan per försök fångas till egen fil.
# 2. Föll ALLA försök: klassa utfallet. EXIT 0 ges ENDAST om BÅDA villkoren
#    nedan håller. I varje annat läge exit 1, med en loggrad om vilket villkor
#    som föll.
#
#    VILLKOR A — NÄTVERKSKLASS. Inget försöks utdata får bära en
#    sårbarhetsmarkör, OCH varje försöks utdata måste matcha minst ett känt
#    nätverksmönster. Ett försök som föll av ett skäl vi inte känner igen är
#    alltså fail-closed, inte "förmodligen nätverket".
#
#    VILLKOR B — OFÖRÄNDRAT BEROENDETRÄD.
#    `git diff --quiet ${AUDIT_BAS_SHA} HEAD -- package.json package-lock.json`
#    måste vara tyst. Saknas bas-SHA (t.ex. `push` mot main, som ci.yml också
#    kör på) finns ingenting att jämföra mot → INGEN degradering, exit 1.
#
# ═══ VAD DEGRADERINGEN INTE ÄR ═══
#
# Den är INTE `continue-on-error`, och den försvagar INTE allowlisten
# (audit-ci.jsonc rörs aldrig av detta skript). En PR som rör package.json
# eller package-lock.json kräver ALLTID ett riktigt audit-svar. En rapporterad
# sårbarhet fäller ALLTID, oavsett lockfilens tillstånd.
#
# ═══ MÖNSTERLISTORNAS KÄLLOR (mätt/källäst 2026-09-04, inte gissat) ═══
#
# SÅRBARHETSMARKÖRERNA är audit-ci:s EGNA strängar vid en verklig träff, lästa
# i den installerade dist-bundlen (audit-ci 7.1.0,
# node_modules/audit-ci/dist/chunk-FA3SOWIW.js):
#   throw new Error(`Failed security audit due to ${…} vulnerabilities.
#   Vulnerable advisories are: …`)          ← reportAudit
#   console.warn(yellow, `Found vulnerable advisory paths:`)
# plus advisory-URL:erna som `gitHubAdvisoryIdToUrl` bygger.
#
# NÄTVERKSMÖNSTREN, var och en med sin källa:
#   `code undefined`   — audit-ci `auditWithFullConfig`:
#                        `throw new Error(\`code ${code}: ${summary}\`)` när
#                        `npm audit --json` svarar med ett error-objekt UTAN
#                        `code`. MÄTT LOKALT 2026-09-04 10:51 UTC mot den
#                        nedgångna endpointen: audit-ci skrev exakt
#                        "code undefined: " + "Exiting..." och exit 1.
#   `ENOAUDIT` / `not support audit`
#                      — audit-ci `PARTIAL_RETRY_ERROR_MSG.npm`, som citerar
#                        npm:s tre ENOAUDIT-formuleringar och noterar att alla
#                        tre delar frasen "not support audit".
#   `network timeout at:` / `audit endpoint`
#                      — npm:s egna rader. MÄTTA LOKALT samma körning:
#                        `npm audit --json` gav
#                        {"message":"network timeout at: https://registry.npmjs.org/-/npm/v1/security/advisories/bulk",…}
#                        och stderr "npm error audit endpoint returned an error".
#   `Invocation of npm audit failed`
#                      — audit-ci `runNpmAudit`, kastas när npm skrev något
#                        till stderr.
#   ETIMEDOUT / ECONNRESET / ECONNREFUSED / ENOTFOUND / EAI_AGAIN /
#   `fetch failed` / `socket hang up`
#                      — Node/undici/make-fetch-happen-nivåns felkoder som når
#                        loggen oförändrade när felet inte hinner formateras om.
#                        Tagna ur uppdragets lista och behållna som bredd; de
#                        är INTE observerade i denna incident.
#
# Listorna är avsiktligt SUBSTRÄNG-matchade (`grep -F`), aldrig regex: ett
# mönster ska aldrig kunna bli bredare än det ser ut.
#
# ═══ VARFÖR LOGIKEN BOR HÄR OCH INTE SOM ETT INLINE run:-BLOCK ═══
#
# Två skäl, båda mekaniska: (1) `scripts/*.sh` ligger i shellcheck-strict-
# steget (--severity=style --enable=all) i lint-jobbet, ett inline-block gör
# det inte; (2) testsviten scripts/test-audit-degradering.sh prövar då EXAKT
# den kod CI kör, i stället för en andra handhållen kopia av den — samma
# disciplin som scripts/check-mallparitet.sh och scripts/fas4-prod-deploy.sh
# redan följer i detta repo.
#
# ═══ IN-MILJÖ ═══
#   AUDIT_BAS_SHA        bas-commit att jämföra mot. ci.yml sätter den ur
#                        github.event.pull_request.base.sha (pull_request)
#                        respektive github.event.merge_group.base_sha
#                        (merge_group); TOM på push mot main.
#   AUDIT_MAX_FORSOK     antal försök (default 5).
#   AUDIT_PAUS_SEKUNDER  paus mellan försök (default 30).
#   GITHUB_EVENT_NAME    sätts av GitHub Actions; används bara i loggtext.
#
# Källa: docs/decisions/ADR-028-supply-chain-incident-respons.md
#        § Updates 2026-09-04. Kort: TASK-395.

set -euo pipefail

MAX_FORSOK="${AUDIT_MAX_FORSOK:-5}"
PAUS_SEKUNDER="${AUDIT_PAUS_SEKUNDER:-30}"
BAS_SHA="${AUDIT_BAS_SHA:-}"
EVENT="${GITHUB_EVENT_NAME:-lokal-korning}"
KORT="TASK-395"

SARBARHETS_MARKORER=(
    'Failed security audit due to'
    'Vulnerable advisories are:'
    'Found vulnerable advisory paths:'
    'https://github.com/advisories/'
)

NATVERKS_MONSTER=(
    'code undefined'
    'ENOAUDIT'
    'not support audit'
    'audit endpoint'
    'network timeout at:'
    'Invocation of npm audit failed'
    'ETIMEDOUT'
    'ECONNRESET'
    'ECONNREFUSED'
    'ENOTFOUND'
    'EAI_AGAIN'
    'fetch failed'
    'socket hang up'
)

loggkatalog="$(mktemp -d "${TMPDIR:-/tmp}/audit-ci-degradering.XXXXXX")"
trap 'rm -rf "${loggkatalog}"' EXIT

# ── Steg 1: loopen ────────────────────────────────────────────────────────
forsok=1
while [[ "${forsok}" -le "${MAX_FORSOK}" ]]; do
    echo "audit-ci försök ${forsok}/${MAX_FORSOK}"
    loggfil="${loggkatalog}/forsok-${forsok}.log"
    kod=0
    npx audit-ci --config audit-ci.jsonc > "${loggfil}" 2>&1 || kod=$?
    cat "${loggfil}"
    if [[ "${kod}" -eq 0 ]]; then
        echo "audit-ci grönt på försök ${forsok}/${MAX_FORSOK}"
        exit 0
    fi
    echo "audit-ci försök ${forsok}/${MAX_FORSOK} föll (exit ${kod})"
    if [[ "${forsok}" -lt "${MAX_FORSOK}" ]]; then
        echo "väntar ${PAUS_SEKUNDER}s innan nästa försök"
        sleep "${PAUS_SEKUNDER}"
    fi
    forsok=$((forsok + 1))
done

echo "audit-ci föll alla ${MAX_FORSOK} försök — klassar utfallet"

# ── Steg 2, villkor A1: en sårbarhetsmarkör fäller ALLTID ─────────────────
for ((n = 1; n <= MAX_FORSOK; n++)); do
    for markor in "${SARBARHETS_MARKORER[@]}"; do
        if grep -qF -- "${markor}" "${loggkatalog}/forsok-${n}.log"; then
            echo "::error::audit-ci: sårbarhetsmarkören \"${markor}\" står i försök ${n}:s utdata — audit-ci rapporterade en TRÄFF, inte ett nätverksfel. Ingen degradering, oavsett beroendeträdets tillstånd."
            exit 1
        fi
    done
done

# ── Steg 2, villkor A2: varje försök måste vara nätverksklassat ───────────
for ((n = 1; n <= MAX_FORSOK; n++)); do
    traff=""
    for monster in "${NATVERKS_MONSTER[@]}"; do
        if grep -qF -- "${monster}" "${loggkatalog}/forsok-${n}.log"; then
            traff="${monster}"
            break
        fi
    done
    if [[ -z "${traff}" ]]; then
        echo "::error::audit-ci: försök ${n}:s utdata matchar inget känt nätverksmönster — okänd felklass. Fail-closed: ingen degradering."
        exit 1
    fi
    echo "audit-ci försök ${n}: nätverksklassat (\"${traff}\")"
done

# ── Steg 2, villkor B: beroendeträdet oförändrat mot bas ──────────────────
if [[ -z "${BAS_SHA}" ]]; then
    echo "::error::audit-ci: eventet \"${EVENT}\" bär ingen bas-SHA att jämföra mot (push mot main har ingen). Degraderingen gäller inte här."
    exit 1
fi

if ! git cat-file -e "${BAS_SHA}^{commit}" 2> /dev/null; then
    echo "bas-commiten ${BAS_SHA} saknas i checkouten — hämtar den grunt"
    if ! git fetch --no-tags --depth=1 origin "${BAS_SHA}"; then
        echo "::error::audit-ci: kunde inte hämta bas-commiten ${BAS_SHA}. Utan bas går beroendeträdet inte att jämföra — ingen degradering."
        exit 1
    fi
fi

if git diff --quiet "${BAS_SHA}" HEAD -- package.json package-lock.json; then
    echo "::warning::audit-ci: npm:s advisory-endpoint onåbar efter ${MAX_FORSOK} försök; beroendeträdet oförändrat mot bas (${BAS_SHA}) — släpps med varning, ${KORT}"
    exit 0
fi

echo "::error::audit-ci: beroendeträdet är ÄNDRAT mot bas (${BAS_SHA}) — package.json och/eller package-lock.json rörs av denna diff och kräver ett riktigt audit-svar. Ingen degradering."
exit 1
