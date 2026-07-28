#!/usr/bin/env bash
# scripts/classify-post-merge.sh — ÄRVD klassning för post-merge-lagret (TASK-73).
#
# Besvarar EN fråga om det träd som just landat i main:
#
#     Skippade PR-grinden HELA testsviten för det här trädet?
#
# Ja  ⇒ docs_only=true   ⇒ post-merge.yml hoppar sitt svit-anrop.
# Nej ⇒ docs_only=false  ⇒ full svit, inklusive `Staging (API + E2E)`.
#
# ═══ VARFÖR SKRIPTET FINNS — MÄTT, INTE ANTAGET ═══
# post-merge.yml anropade ci-suite.yml utan `run_staging`-input och fick dess
# default `true`. Lagret körde därför HELA sviten på VARJE main-push — även på
# en ren docs-landning som PR-grinden med rätta hade skippat. Skarpt utfall
# 2026-07-28: merge `ed51b95` landade ÅTTA rader i en enda `.md`-fil;
# post-merge-körning 30393323548 körde full staging på den och tog den globala
# `staging-tests`-mutexen. Revert-PR #375 (körning 30393415005) låg `pending` på
# samma mutex, `ci-wait.sh` timade ut efter 900 s, och revert-vägen — som finns
# till för att vara SNABB — blockerades av en åtta raders markdown-landning.
# Mätt led: revert-commit → landad merge 25 min 16 s, mot en CI-kostnad under en
# minut för en docs-revert (CONTRIBUTING.md § Revert-vägen).
#
# ═══ ÄRVER — RÄKNAR ALDRIG OM ═══
# Skriptet klassar INTE diffen. Det LÄSER vad `ci.yml` redan beslutade om exakt
# samma träd, och det är hela poängen.
#
# En andra klassnings-implementation hade krävt en andra kopia av `ci.yml`:s
# glob-listor — en ny hemvist utan paritetsgrind, alltså restlistans A3-skuld en
# gång till. ADR-077 § Beslut 1 avvisar dessutom formen rakt ut: klassningen
# "förblir deklarativ i changed-files-steget", och ett eget skript hade "tvingat
# fram en omimplementation av glob-semantik som actionen redan äger, med
# divergens-risk mot D0". Att observera beslutet i stället för att återskapa det
# har ingen kopia som kan drifta.
#
# Mekaniken är ADR-077 § Beslut 2:s, med en annan fråga: läs andra föräldern
# (PR-headen), verifiera träd-identitet, fråga körnings-API:t. Ingen ny
# mekanism-klass mintas.
#
# ═══ SIGNALEN, VERIFIERAD I API:T ═══
# Ett SKIPPAT reusable-anrop rapporteras som ETT jobb med anropets egna namn.
# Ett KÖRT anrop expanderas i stället till sina inner-jobb, prefixade
# "<anropets namn> / ". Ett jobb med EXAKT namnet `Test suite` finns alltså
# ENDAST när ci.yml hoppade hela svit-anropet.
# Empiri: 20 på varandra följande `pull_request`-körningar av ci.yml lästes
# 2026-07-28. Utfallet var binärt utan undantag — 13 körningar hade exakt ETT
# jobb `Test suite` (conclusion `skipped`) och NOLL inner-jobb; 7 hade NOLL
# `Test suite` och FEM inner-jobb. Aldrig blandat, aldrig `Test suite` med
# annan conclusion än `skipped`.
#
# `--event pull_request` är INTE kosmetik. På en PR-körning är `dedup_hit`
# alltid false (dedup-steget kräver `EVENT_NAME = push`), så där gäller
# ekvivalensen `Test suite skipped` ⇔ `should_skip_tests` ⇔ D0 EXAKT. Läses en
# push-körning i stället kan dedupen ha skippat jobbet, och då hade skriptet
# tolkat "trädet är redan bevisat" som "diffen kan inte påverka sviten" — två
# helt olika påståenden.
#
# ═══ VAD SOM MEDVETET INTE ÄRVS: D1 OCH acceptance_local ═══
# `ui_low_risk` (D1) och `acceptance_local` släckte staging i PR-grinden som
# RISKREDUKTION. Ett sådant träd landar därmed i main med NOLL staging-täckning
# — och det är, ordagrant, punkt 2 i post-merge.yml:s eget filhuvud och halva
# skälet att lagret byggdes. Att ärva dem hade tagit bort just den kontroll
# lagret finns till för att ge.
#
# D0 är en annan sorts påstående: diffen kan STRUKTURELLT inte påverka sviten.
# Det finns ingen täckning som saknas, alltså inget att skydda. Litar vi inte på
# D0 här får vi inte lita på den i PR-grinden heller — där den är farligare,
# eftersom den inte blockerar något.
#
# SEDAN A7:5 (TASK-70.3) ÄR SKILLNADEN ÄNNU SKARPARE, och skriptet behövde inte
# röras för det: ci.yml skickar `run_staging: false` villkorslöst, så INGEN
# PR-körning kör staging — inte bara D1- och acceptance_local-träden. Varje
# icke-D0-träd landar utan staging-täckning, och det är här den ges. Att skriptet
# ärver EN klassbit och inte tre är precis vad som gjorde formen stabil över
# flytten: hade D1 eller acceptance_local ärvts hade lagret nu hoppat staging på
# exakt de träd som ingen annan yta täcker.
#
# ═══ FAIL-CLOSED, UTAN UNDANTAG ═══
# Varje avvikelse ger `docs_only=false`, alltså full svit: fel event, ingen
# andra förälder, träd-avvikelse, API-fel, ingen grön PR-körning, saknat
# `Test suite`-jobb, oväntad conclusion. En besparing får aldrig bli ett hål
# (ADR-077 § Beslut 2). Varje `gh`-anrops exitkod fångas SEPARAT från sitt
# resultat — formen `$(gh … || echo "")` kollapsar "anropet gick fel" och "det
# finns inget svar" till samma tomma sträng, och då byggs ett beslut på frånvaro
# av data (TASK-51, L322-klassen).
#
# ANVÄNDNING
#   REPO=<owner/namn> EVENT_NAME=push scripts/classify-post-merge.sh <full-sha>
#
#   Skriver `docs_only=<true|false>` till ${GITHUB_OUTPUT} när den är satt, och
#   alltid en människoläsbar motivering till stdout.
#
# EXIT-KODER
#   0  klassning genomförd (utfallet står i docs_only, inte i exitkoden)
#   2  användningsfel (saknat argument eller saknad REPO) — fail-loud: ett
#      konfigfel ska fälla jobbet och fyra larmet, inte tyst bli "full svit"
#
# Källa: backlog TASK-73 · ADR-077 §§ 1-2 · CONTRIBUTING.md § Revert-vägen
# Etablerad: Session 91 (2026-07-28)

set -uo pipefail

# ci.yml:s `suite`-jobbs `name:`. Detta är skriptets ENDA koppling till ci.yml,
# och den är mekaniskt grindad — scripts/test-classify-post-merge.sh T9 hävdar
# att strängen fortfarande är ci.yml:s faktiska jobbnamn. Byts namnet utan att
# grinden uppdateras fäller testsviten i lint-jobbet; skulle den ändå passera är
# utfallet fail-closed (jobbet hittas inte ⇒ full svit).
CI_SUITE_JOB_NAME="Test suite"
CI_WORKFLOW="ci.yml"

usage() {
    echo "Användning: REPO=<owner/namn> [EVENT_NAME=push] $0 <full-merge-sha>" >&2
}

MERGE_SHA="${1:-}"
REPO="${REPO:-}"
EVENT_NAME="${EVENT_NAME:-push}"

if [[ -z "${MERGE_SHA}" ]]; then
    echo "❌ Saknat argument: merge-commitens fulla SHA." >&2
    usage
    exit 2
fi
if [[ -z "${REPO}" ]]; then
    echo "❌ REPO är osatt (förväntas som owner/namn)." >&2
    usage
    exit 2
fi

docs_only=false
skal=""

emit() {
    echo "docs_only=${docs_only} — ${skal}"
    if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
        echo "docs_only=${docs_only}" >> "${GITHUB_OUTPUT}"
    fi
    if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
        {
            echo "## Post-merge — ärvd klassning"
            echo ""
            echo "| Vad | Värde |"
            echo "|---|---|"
            echo "| Mergat träd | \`${MERGE_SHA:0:12}\` |"
            echo "| \`docs_only\` | \`${docs_only}\` |"
            echo "| Skäl | ${skal} |"
        } >> "${GITHUB_STEP_SUMMARY}"
    fi
    exit 0
}

# --- (1) Endast push-event klassas -------------------------------------------
# En workflow_dispatch har ingen landning att ärva klassning från.
if [[ "${EVENT_NAME}" != "push" ]]; then
    skal="event=${EVENT_NAME}, ej push — ingen landning att ärva klassning från (full svit)."
    emit
fi

# --- (2) Merge-commitens föräldrar och träd ----------------------------------
api_failed=""
commit_json=$(gh api "repos/${REPO}/commits/${MERGE_SHA}" \
    --jq '{tree: .commit.tree.sha, parents: [.parents[].sha]}') || api_failed="1"

if [[ -n "${api_failed}" ]]; then
    skal="commits-API:t svarade inte för ${MERGE_SHA:0:12} — INTE ett påstående om trädet (full svit, fail-closed)."
    emit
fi

parent_count=$(jq -r '.parents | length' <<<"${commit_json}")
if [[ "${parent_count}" -lt 2 ]]; then
    skal="ingen andra förälder (${parent_count} förälder/föräldrar) — ej en merge-commit, ingen PR-körning att ärva (full svit)."
    emit
fi

merge_tree=$(jq -r '.tree' <<<"${commit_json}")
pr_head=$(jq -r '.parents[1]' <<<"${commit_json}")

# --- (3) Träd-identitet mot PR-headen ----------------------------------------
# Sunt TACK VARE merge-grindens strict up-to-date-krav (ADR-076): en up-to-date
# gren ger merge-commit vars träd är identiskt med PR-headens, och då är den
# landade diffen exakt PR:ens diff — alltså den diff ci.yml klassade.
head_failed=""
head_tree=$(gh api "repos/${REPO}/commits/${pr_head}" --jq '.commit.tree.sha') || head_failed="1"

if [[ -n "${head_failed}" ]]; then
    skal="commits-API:t svarade inte för PR-headen ${pr_head:0:12} (full svit, fail-closed)."
    emit
fi
if [[ "${merge_tree}" != "${head_tree}" ]]; then
    skal="träd-avvikelse (${merge_tree:0:12} != ${head_tree:0:12}) — landad diff är inte PR:ens diff (full svit, fail-closed)."
    emit
fi

# --- (4) PR-grindens körning på det trädet -----------------------------------
# Kravet `conclusion == success` är strikt med avsikt: en avbruten eller röd
# körning är ingen klassning att luta sig mot. En landad PR har per ADR-076 en
# grön `CI Passed or Skipped`, så den gröna körningen finns när den ska.
list_failed=""
run_id=$(gh run list --repo "${REPO}" --commit "${pr_head}" \
    --workflow "${CI_WORKFLOW}" --event pull_request --limit 10 \
    --json databaseId,status,conclusion \
    --jq '[.[] | select(.status == "completed" and .conclusion == "success")][0].databaseId // ""') || list_failed="1"

if [[ -n "${list_failed}" ]]; then
    skal="körnings-API:t svarade inte för PR-headen ${pr_head:0:12} — kontrollera att jobbet har actions: read (full svit, fail-closed)."
    emit
fi
if [[ -z "${run_id}" ]]; then
    skal="ingen grön ${CI_WORKFLOW}-körning (event=pull_request) på ${pr_head:0:12} — inget klassningsbeslut att ärva (full svit, fail-closed)."
    emit
fi

# --- (5) Ärv beslutet ur jobblistan ------------------------------------------
jobs_failed=""
suite_concl=$(gh run view "${run_id}" --repo "${REPO}" --json jobs \
    --jq "[.jobs[] | select(.name == \"${CI_SUITE_JOB_NAME}\")][0].conclusion // \"\"") || jobs_failed="1"

if [[ -n "${jobs_failed}" ]]; then
    skal="jobblistan för körning ${run_id} kunde inte läsas (full svit, fail-closed)."
    emit
fi

if [[ -z "${suite_concl}" ]]; then
    skal="'${CI_SUITE_JOB_NAME}' saknas som eget jobb i körning ${run_id} ⇒ PR-grinden KÖRDE sviten på detta träd (full svit)."
    emit
fi
if [[ "${suite_concl}" != "skipped" ]]; then
    skal="'${CI_SUITE_JOB_NAME}' har conclusion '${suite_concl}', väntat 'skipped' — oväntad form (full svit, fail-closed)."
    emit
fi

docs_only=true
skal="'${CI_SUITE_JOB_NAME}' skippades i körning ${run_id} ⇒ PR-grinden klassade trädet D0 (docs-only) — inget att skydda, sviten hoppas."
emit
