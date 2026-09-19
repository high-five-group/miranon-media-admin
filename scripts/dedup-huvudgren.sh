#!/usr/bin/env bash
# scripts/dedup-huvudgren.sh — TASK-464.4 (SE1): SHA-IDENTITET i stället för
# trädjämförelse. Besvarar EN fråga om det SHA som just landade som
# `github.sha` på en `push`-körning av ci.yml mot `main`:
#
#     Har DETTA SHA en GRÖN merge_group-körning av ci.yml, DÄR "Test suite"
#     FAKTISKT KÖRDE (inte hoppades)?
#
# Ja  ⇒ dedup_hit=true   ⇒ ci.yml:s `suite`-jobb hoppas på push-ytan (trädet
#                           är redan bevisat — huvudgrenen behöver inte köra
#                           om exakt det kön just körde).
# Nej ⇒ dedup_hit=false  ⇒ full svit på push-ytan, som i dag.
#
# ═══ VARFÖR MEKANIKEN BYTTE, MÄTT INTE ANTAGET ═══
# Den GAMLA dedupen (ADR-077 § Beslut 2, task-36.4) jämförde träd: merge-
# commitens träd mot PR-headens träd. `docs/research/actions-minutbudget-
# 2026-09-18.md` § S1 mätte att den ALDRIG träffade i praktiken — samtliga
# kodklassade huvudgrenskörningar körde hela sviten, eftersom villkoret
# kräver att huvudgrenen stått still sedan PR-headen skrevs, och med >40
# landningar/dygn gör den aldrig det. En byggd, korrekt, fail-closed — och
# verkningslös — mekanism.
#
# DEN NYA FRÅGAN ÄR IDENTITET, INTE LIKHET. Kön kör ci.yml på EXAKT den
# commit som sedan landar (samma insikt som scripts/classify-post-merge.sh:s
# VÄG A redan bär för en ANNAN fråga, TASK-78, 2026-07-29): "kön skapar
# merge-commiten i förväg i gh-readonly-queue/… och flyttar main dit vid
# grönt; ingen ny commit mintas." Frågan blir därför "har DETTA SHA en grön
# merge_group-run där sviten faktiskt kördes?" — inget att jämföra, bara att
# slå upp. Mätt skarpt 2026-09-19 (S126): tio på varandra följande
# merge_group→push-par gav EXAKT SHA-identitet (merge_group.head_sha ==
# efterföljande push.github_sha) utan undantag, inklusive tre sekventiella
# landningar 42 s isär (PR #2587→#2591→#2590, `e845dfab`→`0c6abac0`→
# `6eef96de`).
#
# ═══ FÄLLAN SOM MÅSTE HÅLLAS ═══
# Villkoret är ALDRIG "kö-körningen är grön". `actions-minutbudget-2026-09-
# 18.md` § S1/S1b mätte att 68 % av kö-körningarna ÄR gröna MED sviten
# hoppad (D0/dedup/etc på kö-ytan självt). Signalen måste vara "sviten
# KÖRDE och var grön" — samma binära signal scripts/classify-post-merge.sh
# redan läser (se scripts/lib/svit-signal.sh, delad läsning). Läs ALDRIG
# bara `conclusion`.
#
# ═══ GRUPPLANDNINGAR — BELAGT, INTE ANTAGET (den svåra delen) ═══
# `grouping_strategy: ALLGREEN` (verifierat 2026-09-19: `gh api
# repos/high-five-group/miranon-media-admin/rulesets/19627609`) bygger varje
# köad post KUMULATIVT: GitHubs egen dokumentation ("managing a merge
# queue") beskriver den temporära grenen för post N som basgrenen PLUS varje
# tidigare post i kön PLUS post N:s egna ändringar. Post N:s merge_group-
# körning testar alltså redan HELA det kumulativa trädet — inklusive alla
# poster som landar FÖRE den i samma "batch".
#
# Det historiska batch-exemplet (`tasks/threads/T166-…`, `#1711`+`#1713` i
# EN push, `aefe87f6→fb1c7fa4`) omprövat 2026-09-19: `8b361ff0` (#1711, kod)
# och `fb1c7fa4` (#1713, docs) är TVÅ separata merge-commits, sekventiellt
# kedjade (`fb1c7fa4`s FÖRSTA förälder = `8b361ff0`) — inte en sammanslagen
# commit. Push-WEBHOOKEN kan slås ihop (ETT push-event för båda), men VARJE
# post i kön har fortfarande SIN EGEN merge_group-körning, och post #1713:s
# egen körning testade redan `main + #1711 + #1713` (kumulativt). Att slå upp
# `github.sha` (toppen av pushen, `fb1c7fa4`) på DESS EGEN merge_group-
# körning täcker alltså HELA batchen — ingen separat BEFORE-spannvandring
# behövs för DENNA mekanism, till skillnad från scripts/classify-post-
# merge.sh:s docs_only-klassning (en ANNAN, äldre bugklass: den skriptets
# VÄG B jämförde mot en ICKE-kumulativ PR-head-diff, inte mot kön; N3/T166
# vägval 2 löste DEN bugen med en BEFORE-spannvandring — se den filens huvud).
#
# ANDRA, SKARPARE FALLET (#2588+#2596, ORKESTRERARENS fynd, 2026-09-19
# ~14:40Z): två PR:er köade SAMTIDIGT och mergade i samma ögonblick
# (`mergedAt` identisk). `6a3a78c3` (#2588) fick ALDRIG en egen push-körning
# — webhooken slog ihop pushen till EN körning på `811cece3` (#2596:s
# merge-commit, byggd OVANPÅ #2588 — grennamnet `gh-readonly-queue/main/
# pr-2596-6a3a78c3…` bekräftar basen). Skarpt kört mot BÅDA SHA:n: `811cece3`
# → `dedup_hit=true` (kö-körning `35448948271`, Test suite kördes, grönt).
# `6a3a78c3` → OCKSÅ `true` (egen kö-körning `35448947699`) men den SHA:n
# anropar aldrig detta skript i verkligheten (ingen push-körning för den) —
# ett konsistensbevis, inte en skarp väg. Skillnaden mot T166-fallet ovan:
# HÄR körde BÅDA entries "Test suite" faktiskt (ingen var D0-hoppad), så
# båda SHA:n råkar ge samma svar — men principen som bär säkerheten är
# densamma: github.sha:s EGEN merge_group-körning, aldrig en granne.
#
# Är identiteten INTE belagd för ett givet fall (ingen kö-körning hittas,
# API-fel, flera träffar) är svaret FAIL-CLOSED nedan — sviten kör, exakt
# som uppdraget kräver. Detta skript river ALDRIG den regeln till förmån för
# ett antagande om gruppering.
#
# KÄND KANT, ÖPPET SKRIVEN: hela argumentet ovan vilar på `ALLGREEN`. Byts
# `grouping_strategy` till `HEADGREEN` (CLAUDE.md § Review-grinden, "Kö-
# antagandet som bär grinden") bygger senare poster INTE längre kumulativt,
# och SHA-identitet ensam räcker inte längre för att garantera att en batch
# är fullständigt täckt. Detta skript har ingen egen ruleset-kontroll (ett
# jobb per push är dyrt nog utan en extra API-fråga för ett värde som ändras
# på Marcus initiativ, inte av sig självt) — kanten bärs i prosa, samma
# ADR-083-disciplin som resten av repot.
#
# ═══ VÄG A ENSAM — INGEN VÄG B ═══
# Till skillnad från classify-post-merge.sh finns ingen reservväg mot PR-
# headens träd här. Landade landningen INTE via kön (kön avstängd, admin-
# merge, `merge_group`-eventet aldrig triggat för detta SHA) hittas helt
# enkelt ingen matchande körning ⇒ fail-closed ⇒ full svit. Det är rätt
# beteende: utan kön finns ingen "redan bevisat"-källa att luta sig mot.
#
# ANVÄNDNING
#   REPO=<owner/namn> EVENT_NAME=push GH_TOKEN=<token> \
#       scripts/dedup-huvudgren.sh <full-sha>
#
#   Skriver `dedup_hit=<true|false>` till ${GITHUB_OUTPUT} när den är satt,
#   och alltid en människoläsbar motivering till stdout.
#
# EXIT-KODER
#   0  klassning genomförd (utfallet står i dedup_hit, inte i exitkoden)
#   2  användningsfel (saknat argument eller saknad REPO) — fail-loud: ett
#      konfigfel ska fälla jobbet, inte tyst bli "full svit"
#
# ═══ gh — MEDVETET OPINNAD HÄR ═══
# Samma resonemang som scripts/classify-post-merge.sh § gh (TASK-312):
# varje `gh`-anrop nedan är kopplat till en explicit fail-closed-gren, så en
# för gammal/trasig `gh` ger i VÄRSTA FALL en onödig full svit, aldrig ett
# felaktigt hoppat test. Körs uteslutande på GitHub-hostade runners där `gh`
# är förinstallerat och versionshanterat av GitHub självt.
#
# Källa: backlog TASK-464.4 · ADR-133 § Kostnad i två mått (S1/S1b) ·
#        ADR-077 § Beslut 2 (mekaniken denna fråga byter) ·
#        docs/research/actions-minutbudget-2026-09-18.md § S1
# Etablerad: Session 126 (2026-09-19)

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/ci-suite-job-name.sh
source "${SCRIPT_DIR}/lib/ci-suite-job-name.sh"
# shellcheck source=scripts/lib/svit-signal.sh
source "${SCRIPT_DIR}/lib/svit-signal.sh"

CI_WORKFLOW="ci.yml"

usage() {
    echo "Användning: REPO=<owner/namn> [EVENT_NAME=push] $0 <full-sha>" >&2
}

MERGE_SHA="${1:-}"
REPO="${REPO:-}"
EVENT_NAME="${EVENT_NAME:-push}"

if [[ -z "${MERGE_SHA}" ]]; then
    echo "❌ Saknat argument: det landade SHA:ts fulla form." >&2
    usage
    exit 2
fi
if [[ -z "${REPO}" ]]; then
    echo "❌ REPO är osatt (förväntas som owner/namn)." >&2
    usage
    exit 2
fi

dedup_hit=false
skal=""

emit() {
    echo "dedup_hit=${dedup_hit} — ${skal}"
    if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
        echo "dedup_hit=${dedup_hit}" >> "${GITHUB_OUTPUT}"
    fi
    if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
        {
            echo "## Merge-dedup — SHA-identitet mot kön (SE1)"
            echo ""
            echo "| Vad | Värde |"
            echo "|---|---|"
            echo "| Landat SHA | \`${MERGE_SHA:0:12}\` |"
            echo "| \`dedup_hit\` | \`${dedup_hit}\` |"
            echo "| Skäl | ${skal} |"
        } >> "${GITHUB_STEP_SUMMARY}"
    fi
    exit 0
}

# --- (1) Endast push-event tillämpar dedupen ---------------------------------
# Samma villkor som den gamla inline-koden bar (ci.yml, `if [ "${EVENT_NAME}"
# = "push" ]`) — bara flyttat hit. pull_request och merge_group ska ALDRIG
# hoppa sin egen svit på grund av en dedup mot sig själva.
if [[ "${EVENT_NAME}" != "push" ]]; then
    skal="event=${EVENT_NAME}, ej push — dedup ej tillämplig (full svit)."
    emit
fi

# --- (2) Finn EN grön merge_group-körning på exakt detta SHA -----------------
mg_failed=""
mg_json=$(gh run list --repo "${REPO}" --commit "${MERGE_SHA}" \
    --workflow "${CI_WORKFLOW}" --event merge_group --limit 10 \
    --json databaseId,status,conclusion,headBranch \
    --jq '[.[] | select(.status == "completed" and .conclusion == "success")]') || mg_failed="1"

if [[ -n "${mg_failed}" ]]; then
    skal="körnings-API:t svarade inte för kö-ytan på ${MERGE_SHA:0:12} — INTE ett påstående om trädet (full svit, fail-closed)."
    emit
fi

mg_antal=$(jq -r 'length' <<<"${mg_json}")

if [[ "${mg_antal}" -eq 0 ]]; then
    skal="ingen grön merge_group-körning hittad på ${MERGE_SHA:0:12} — landade inte via kön, eller kön inte klar (full svit, fail-closed)."
    emit
fi
if [[ "${mg_antal}" -gt 1 ]]; then
    skal="${mg_antal} gröna merge_group-körningar hittade på SAMMA SHA (${MERGE_SHA:0:12}) — tvetydigt, kan inte avgöra vilken som gäller (full svit, fail-closed)."
    emit
fi

mg_run_id=$(jq -r '.[0].databaseId' <<<"${mg_json}")
mg_branch=$(jq -r '.[0].headBranch' <<<"${mg_json}")

# --- (3) Verifiera kö-basen (defense-in-depth, samma mönster som VÄG A i ----
#         scripts/classify-post-merge.sh) ------------------------------------
# SHA-identiteten i steg (2) räcker logiskt (samma exakta commit-objekt kan
# bara ha testats mot SIN egen förälder — parent-pekaren är en del av SHA:t),
# men grennamnets bas-suffix verifieras ändå, mekaniskt, i stället för att
# antas — samma disciplin classify-post-merge.sh redan tillämpar för VÄG A.
parent_failed=""
forsta_foralder=$(gh api "repos/${REPO}/commits/${MERGE_SHA}" \
    --jq '.parents[0].sha // ""') || parent_failed="1"

if [[ -n "${parent_failed}" ]]; then
    skal="commits-API:t svarade inte för ${MERGE_SHA:0:12} — INTE ett påstående om kö-basen (full svit, fail-closed)."
    emit
fi
if [[ -z "${forsta_foralder}" ]]; then
    skal="${MERGE_SHA:0:12} har ingen förälder — kan inte verifiera kö-basen (full svit, fail-closed)."
    emit
fi
if [[ "${mg_branch}" != *"-${forsta_foralder}" ]]; then
    skal="kö-körning ${mg_run_id} har basen '${mg_branch##*/}', som inte slutar på ${MERGE_SHA:0:12}s första förälder ${forsta_foralder:0:12} — klassningen gäller en annan diff (full svit, fail-closed)."
    emit
fi

# --- (4) Läs signalen: kördes "Test suite" faktiskt, och var den grön? ------
signal=$(las_svit_signal "${mg_run_id}")

case "${signal}" in
    API_FEL)
        skal="jobblistan för kö-körning ${mg_run_id} kunde inte läsas (full svit, fail-closed)."
        emit
        ;;
    RUN)
        dedup_hit=true
        skal="'${CI_SUITE_JOB_NAME}' saknas som eget jobb i kö-körning ${mg_run_id} ⇒ sviten KÖRDE på detta träd och kö-körningen var grön ⇒ redan bevisat, tunga jobb hoppas på push-ytan."
        emit
        ;;
    SKIPPED:skipped)
        skal="'${CI_SUITE_JOB_NAME}' skippades i kö-körning ${mg_run_id} — grön MEN inget bevisat (exakt fällan SE1 vaktar mot: full svit)."
        emit
        ;;
    SKIPPED:*)
        skal="'${CI_SUITE_JOB_NAME}' har oväntad conclusion '${signal#SKIPPED:}' i kö-körning ${mg_run_id}, väntat 'skipped' (full svit, fail-closed)."
        emit
        ;;
    *)
        skal="oväntat svar '${signal}' från svit-signalen för kö-körning ${mg_run_id} (full svit, fail-closed)."
        emit
        ;;
esac
