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
# ═══ TVÅ KÄLLOR ATT ÄRVA UR, I RANGORDNING (TASK-78) ═══
# Merge queue (TASK-70.1) bröt den ursprungliga formen samma dag den landade.
# Kön bygger varje post mot `main`s AKTUELLA spets, så merge-commitens träd bär
# mer än PR:ens egen diff så snart `main` rört sig sedan PR-headen skrevs — och
# då fäller träd-identiteten i VÄG B till full svit.
#
# VILLKORET ÄR INTE "inte först i kön". Mätt 2026-07-29 på `#423`, som låg ENSAM
# i kön: merge-träd `c89df4bc` != head-träd `efc0154a`, alltså full svit inklusive
# Staging på en landning av TRE markdown-filer. PR-grinden hade klassat rätt
# (körning 30437803614, `Test suite: skipped`). Rätt villkor är "`main` har rört
# sig sedan PR-headen skrevs" — normalfallet i ett aktivt repo, inte ett
# specialfall. Kostnaden var alltså nästan varje landning, inte en delmängd.
#
# VÄG A (kö-körningen) LÄSES DÄRFÖR FÖRST, och den är en STRIKT BÄTTRE källa än
# VÄG B — inte en genväg förbi den:
#
#   Kön kör ci.yml med `event=merge_group` på EXAKT den commit som sedan landar.
#   Mätt: körning 30438569547 har `headSha` = `58a1a10498106de5…`, vilket ÄR
#   merge-commiten för `#423` på main. Kön skapar merge-commiten i förväg i
#   `gh-readonly-queue/…` och flyttar `main` dit vid grönt; ingen ny commit
#   mintas. VÄG B måste BEVISA med en träd-jämförelse att den ärvda klassningen
#   gäller det landade trädet — VÄG A har det gratis, av SHA-identitet.
#
# KÖ-BASEN VERIFIERAS, ANTAS INTE. Klassningen gäller diffen mot kö-basen, så
# den är bara sund om kö-basen ÄR merge-commitens första förälder. Basen står
# kodad sist i grennamnet (`gh-readonly-queue/main/pr-<nr>-<bas-sha>`) och
# jämförs mekaniskt nedan. Detta är VÄG A:s motsvarighet till VÄG B:s
# träd-identitet — samma invariant, uttryckt på den yta den gäller.
# Empiri, båda leden 2026-07-29:
#   `pr-423-dbe1c0dbb2bfa…` ↔ första föräldern `dbe1c0dbb2bfa…`  ✅
#   `pr-424-58a1a10498106…` ↔ första föräldern `58a1a10498106…`  ✅
#
# VÄG B ÄR INTE BORTTAGEN. Hittas ingen kö-körning gick landningen inte via kön
# (kön avstängd, admin-merge) — då gäller den gamla vägen oförändrat. Ändringen
# är additiv: den lägger en bättre källa framför, den river ingen.
#
# KÄND BEGRÄNSNING, ÖPPET SKRIVEN: tvåförälder-kravet i steg (2) gäller BÅDA
# vägarna, men VÄG A behöver egentligen bara första föräldern. Byter repot
# merge-metod i kön till squash eller rebase får merge-commiten EN förälder, och
# klassningen faller ut före VÄG A — fail-closed, alltså full svit på varje
# landning. Kravet står kvar oförändrat eftersom repot landar med merge-commit
# (ADR-076, `gh pr merge --merge`), och att bygga för en metod repot inte använder
# vore spekulativ komplexitet. Byts metoden är detta raden att lyfta.
#
# FÖRKASTADE FORMER (TASK-78 § Vägval):
#  (b) Klassa om från grunden mot merge-commitens diff mot första föräldern.
#      Avvisad av ADR-077 § Beslut 1 rakt ut: det kräver en andra kopia av
#      ci.yml:s glob-listor, alltså en ny hemvist utan paritetsgrind —
#      restlistans A3-skuld en gång till, med divergens-risk mot D0.
#  (c) Acceptera kostnaden och dokumentera den. Förkastad av storleken: `#423`
#      visade att kostnaden bärs av nästan varje landning, och varje extra
#      staging-körning är ett nytt tillfälle för TASK-76:s purge-race.
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
# EVENT-FILTRET ÄR INTE KOSMETIK — OCH DET GÄLLER BÅDA VÄGARNA. Ekvivalensen
# `Test suite skipped` ⇔ `should_skip_tests` ⇔ D0 håller EXAKT bara när
# merge-dedupen inte kan ha släckt jobbet av ett annat skäl. Dedup-steget
# (ci.yml, jobbet `changed`) är grindat av `if [ "${EVENT_NAME}" = "push" ]`
# (ci.yml rad 419) och skriver annars ut "Dedup ej tillämplig … → full svit"
# (rad 441). `dedup_hit` är därför strukturellt false på BÅDE `pull_request` och
# `merge_group` — läst i källan, inte antaget.
#
# Det stänger den enda invändning TASK-78 reste mot VÄG A ("kö-körningen kan ha
# skippats av dedup"): den kan den inte. Kö-ytan bär samma exakta ekvivalens som
# PR-ytan, vilket är just varför den går att ärva ur.
#
# Läses en PUSH-körning i stället kan dedupen ha skippat jobbet, och då hade
# skriptet tolkat "trädet är redan bevisat" som "diffen kan inte påverka sviten"
# — två helt olika påståenden. Därför filtreras alltid på event, aldrig utan.
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
# `Test suite`-jobb, oväntad conclusion — och, sedan TASK-78, en kö-körning vars
# bas inte är merge-commitens första förälder. VÄG A gör klassningen BILLIGARE,
# aldrig mer tillåtande: den ärver samma binära signal ur en körning på samma
# SHA, och varje oväntad form faller till full svit precis som förut. Ingen gren
# som förut gav `false` ger `true` efter ändringen utan att kö-körningen
# uttryckligen sagt `skipped` på det landade trädet.
# En besparing får aldrig bli ett hål
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
# ═══ gh — MEDVETET OPINNAD HÄR (TASK-312, 2026-08-24) ═══
#
# Skriptets `gh api`-anrop nedan har INGEN version-guard (till skillnad
# från scripts/check-nattvakt-dedup.sh + scripts/check-obesvarade-larm.sh,
# som BÅDA wirades till scripts/lib/gh-guard.sh i samma kort). Öppet skäl,
# inte en glömd rad: varje `gh api`-anrop nedan är REDAN kopplat till
# `|| api_failed="1"` (se § ANROPS-KONTRAKTET ovan), och VARJE gren där
# api_failed sätts landar i "full svit, fail-closed" — den SÄKRA defaulten,
# aldrig ett tyst felaktigt docs_only=true. En för gammal/trasig gh
# producerar alltså i VÄRSTA FALL en onödig full testsvit, aldrig ett
# felaktigt hoppat test. Risken en version-guard annars stänger (tyst fel
# beslut) finns strukturellt inte här — skriptets egna fail-closed-kontrakt
# äger redan den ytan. Körs dessutom uteslutande på GitHub-hostade runners
# (post-merge.yml) där `gh` är förinstallerat och versionshanterat av
# GitHub självt, samma kategori som jq där (se scripts/lib/jq-guard.sh §
# DEN ENA UNDANTAGNA ANROPSPUNKTEN för samma resonemang).
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
    skal="ingen andra förälder (${parent_count} förälder/föräldrar) — ej en merge-commit, ingen körning att ärva (full svit)."
    emit
fi

merge_tree=$(jq -r '.tree' <<<"${commit_json}")
ko_bas=$(jq -r '.parents[0]' <<<"${commit_json}")
pr_head=$(jq -r '.parents[1]' <<<"${commit_json}")

# --- Delad ärvning: läs `Test suite` ur en körning och avgör -----------------
# Identisk för båda vägarna — signalen är densamma, bara källan skiljer.
# Returnerar aldrig: varje gren slutar i `emit`, som gör exit 0.
arv_ur_korning() {
    local run_id="$1" kalla="$2"
    local jobs_failed="" suite_concl

    suite_concl=$(gh run view "${run_id}" --repo "${REPO}" --json jobs \
        --jq "[.jobs[] | select(.name == \"${CI_SUITE_JOB_NAME}\")][0].conclusion // \"\"") || jobs_failed="1"

    if [[ -n "${jobs_failed}" ]]; then
        skal="jobblistan för ${kalla}-körning ${run_id} kunde inte läsas (full svit, fail-closed)."
        emit
    fi
    if [[ -z "${suite_concl}" ]]; then
        skal="'${CI_SUITE_JOB_NAME}' saknas som eget jobb i ${kalla}-körning ${run_id} ⇒ ci.yml KÖRDE sviten på detta träd (full svit)."
        emit
    fi
    if [[ "${suite_concl}" != "skipped" ]]; then
        skal="'${CI_SUITE_JOB_NAME}' har conclusion '${suite_concl}' i ${kalla}-körning ${run_id}, väntat 'skipped' — oväntad form (full svit, fail-closed)."
        emit
    fi

    docs_only=true
    skal="'${CI_SUITE_JOB_NAME}' skippades i ${kalla}-körning ${run_id} ⇒ ci.yml klassade det landade trädet D0 (docs-only) — inget att skydda, sviten hoppas."
    emit
}

# --- (3) VÄG A: kö-körningen på merge-commitens EGEN sha ---------------------
# Kön kör ci.yml på exakt den commit som landar, så ingen träd-jämförelse
# behövs — identiteten är SHA:t självt. Se § TVÅ KÄLLOR i huvudet.
mg_failed=""
mg_json=$(gh run list --repo "${REPO}" --commit "${MERGE_SHA}" \
    --workflow "${CI_WORKFLOW}" --event merge_group --limit 10 \
    --json databaseId,status,conclusion,headBranch \
    --jq '[.[] | select(.status == "completed" and .conclusion == "success")][0] // {}') || mg_failed="1"

if [[ -n "${mg_failed}" ]]; then
    skal="körnings-API:t svarade inte för kö-ytan på ${MERGE_SHA:0:12} — INTE ett påstående om trädet (full svit, fail-closed)."
    emit
fi

mg_run_id=$(jq -r '.databaseId // ""' <<<"${mg_json}")
mg_branch=$(jq -r '.headBranch // ""' <<<"${mg_json}")

if [[ -n "${mg_run_id}" ]]; then
    # Kö-basen står sist i grennamnet: gh-readonly-queue/<bas>/pr-<nr>-<bas-sha>.
    # Klassningen gäller diffen mot den basen, alltså är den sund ENDAST om basen
    # är merge-commitens första förälder. Verifieras, antas inte.
    if [[ "${mg_branch}" != *"-${ko_bas}" ]]; then
        skal="kö-körning ${mg_run_id} har basen '${mg_branch##*/}', som inte slutar på merge-commitens första förälder ${ko_bas:0:12} — klassningen gäller en annan diff (full svit, fail-closed)."
        emit
    fi
    arv_ur_korning "${mg_run_id}" "merge_group"
fi

# Ingen grön kö-körning på detta SHA ⇒ landningen gick inte via kön (kön
# avstängd, admin-merge). Då gäller VÄG B oförändrat.

# --- (4) VÄG B: träd-identitet mot PR-headen ---------------------------------
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
arv_ur_korning "${run_id}" "pull_request"
