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
#    `git diff --quiet <effektiv bas> HEAD -- package.json package-lock.json`
#    måste vara tyst. Saknas `AUDIT_BAS_SHA` (t.ex. `push` mot main, som ci.yml
#    också kör på) finns ingenting att jämföra mot → INGEN degradering, exit 1.
#    Den EFFEKTIVA basen är merge-refens första förälder när HEAD är en
#    merge-ref vi känner igen, annars eventets bas — se § EFFEKTIV BAS längre
#    ned för mätningen som tvingade fram den skillnaden.
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
#   AUDIT_BAS_SHA        bas-commit ur EVENTET. ci.yml sätter den ur
#                        github.event.pull_request.base.sha (pull_request)
#                        respektive github.event.merge_group.base_sha
#                        (merge_group); TOM på push mot main. Kan vara STALE —
#                        se § EFFEKTIV BAS.
#   AUDIT_HEAD_SHA       head-commit ur eventet
#                        (github.event.pull_request.head.sha respektive
#                        github.event.merge_group.head_sha). Används ENBART för
#                        att känna igen merge-refen; tom värde stänger bara den
#                        första klausulen, det öppnar aldrig något.
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
HEAD_SHA="${AUDIT_HEAD_SHA:-}"
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
#
# Tom bas-SHA prövas FÖRE all härledning: push mot main degraderar aldrig.
if [[ -z "${BAS_SHA}" ]]; then
    echo "::error::audit-ci: eventet \"${EVENT}\" bär ingen bas-SHA att jämföra mot (push mot main har ingen). Degraderingen gäller inte här."
    exit 1
fi

# ── EFFEKTIV BAS (rättelse 2026-09-04, samma dag som första skarpa fyrningen)
#
# `github.event.pull_request.base.sha` är main NÄR PR-EVENTET SKAPADES, inte när
# checkouten sker. Vår checkout är merge-refen `refs/pull/N/merge`, som GitHub
# bygger om varje gång main rör sig — så snart en annan PR landar däremellan är
# eventets bas STALE mot den bas som FAKTISKT mergades mot. I en fleet är det
# normalfallet, inte undantaget.
#
# MÄTT SKARPT, run 33869798369 (job 101012813108, head 2d6f1a6e):
#   eventets base.sha  = 21a76d6b  (main när PR-eventet skapades)
#   checkoutens HEAD   = 1b3c3157  "Merge 2d6f1a6e… into 72bbeb80…"
#   p1 (main vid checkout) = 72bbeb80 · p2 (PR-head) = 2d6f1a6e
# Mellan 21a76d6b och 72bbeb80 landade c3008757 (#2306), som lade EN rad i
# package.json. Två-punkts-diffen mot eventets bas blev därför icke-tom trots
# att PR:ens EGEN diff mot sin merge-base är tom — degraderingen föll på ett
# fel som inte hade med PR:en att göra.
#
# Semantiken vi vill ha är "ändrar DENNA PR beroendeträdet mot den redan
# auditerade main den mergas mot", och den basen är merge-commitens FÖRSTA
# FÖRÄLDER.
#
# VARFÖR `git cat-file`, INTE `git rev-list --parents` — MÄTT, INTE ANTAGET:
# jobbets checkout är grund (djup 1), så merge-commiten ÄR shallow-boundary och
# git graftar bort dess föräldrar. Mätt 2026-09-04 i en `--depth=1`-fixtur:
#   `git rev-list --parents -n1 HEAD` → bara commitens egen SHA, INGA föräldrar
#   `git log -1 --format=%P`          → TOM
#   `git cat-file commit HEAD`        → BÅDA parent-raderna, som de ska
# Rå objekt-läsning går förbi graftningen; de graf-traverserande formerna gör
# det inte. Hade härledningen byggts på `rev-list --parents` vore den en no-op
# i exakt den miljö den finns för — den hade tyst fallit tillbaka på den stale
# basen varje gång. Föräldra-OBJEKTEN saknas fortfarande lokalt (samma mätning),
# därav den grunda hämtningen nedan.
#
# Huvudet klipps vid första tomraden så en commit-MEDDELANDERAD som råkar börja
# med "parent " aldrig kan läsas som en förälder.
foraldrar_rad="$(git cat-file commit HEAD | sed -e '/^$/q' | sed -n 's/^parent \([0-9a-f]\{7,40\}\)$/\1/p' | tr '\n' ' ')"
# shellcheck disable=SC2086  # AVSIKTLIG ordsplittning: raden är SHA:n separerade
# med blanksteg, producerad av sed:en ovan — set -- ger oss p1/p2 portabelt
# (macOS bash 3.2 saknar mapfile).
set -- ${foraldrar_rad}
antal_foraldrar=$#
p1="${1:-}"
p2="${2:-}"

huvud_sha="$(git rev-parse HEAD)"
effektiv_bas="${BAS_SHA}"
klausul="eventets-bas (HEAD är ingen merge-ref vi känner igen)"

if [[ "${antal_foraldrar}" -eq 2 ]]; then
    if [[ -n "${HEAD_SHA}" && "${p2}" == "${HEAD_SHA}" ]]; then
        # pull_request: HEAD är refs/pull/N/merge, p2 är PR-headen ⇒ p1 är den
        # main som faktiskt mergades mot.
        effektiv_bas="${p1}"
        klausul="merge-refens första förälder (p2 == PR-headen)"
    elif [[ "${p1}" == "${BAS_SHA}" ]]; then
        # merge_group: kö-merge-commitens första förälder ÄR eventets bas_sha.
        # Ingen förändring i sak — men klausulen görs explicit så loggen säger
        # vilken väg som gällde i stället för att låta den se ut som fallback.
        effektiv_bas="${p1}"
        klausul="kö-merge-commitens första förälder (p1 == eventets bas)"
    fi
fi

echo "bas ur eventet: ${BAS_SHA}"
echo "HEAD: ${huvud_sha} (${antal_foraldrar} förälder/föräldrar: ${p1:-inga} ${p2:-})"
echo "effektiv bas: ${effektiv_bas} — ${klausul}"
if [[ "${effektiv_bas}" != "${BAS_SHA}" ]]; then
    echo "main flyttade mellan eventet och checkouten: eventets bas (${BAS_SHA}) är STALE mot den bas som faktiskt mergades mot (${effektiv_bas}). Jämförelsen görs mot den senare."
fi

if ! git cat-file -e "${effektiv_bas}^{commit}" 2> /dev/null; then
    echo "bas-commiten ${effektiv_bas} saknas i checkouten — hämtar den grunt"
    if ! git fetch --no-tags --depth=1 origin "${effektiv_bas}"; then
        echo "::error::audit-ci: kunde inte hämta bas-commiten ${effektiv_bas}. Utan bas går beroendeträdet inte att jämföra — ingen degradering."
        exit 1
    fi
fi

if git diff --quiet "${effektiv_bas}" HEAD -- package.json package-lock.json; then
    echo "::warning::audit-ci: npm:s advisory-endpoint onåbar efter ${MAX_FORSOK} försök; beroendeträdet oförändrat mot bas (${effektiv_bas}) — släpps med varning, ${KORT}"
    exit 0
fi

echo "::error::audit-ci: beroendeträdet är ÄNDRAT mot bas (${effektiv_bas}) — package.json och/eller package-lock.json rörs av denna diff och kräver ett riktigt audit-svar. Ingen degradering."
exit 1
