#!/usr/bin/env bash
# check-docs.sh — kör ALLA dokumentations-grindar CI kör, i ett kommando.
#
# VARFÖR: grindarna bor på två ställen i ci.yml (docs-jobbet + det alltid-på
# lint-jobbet) och måste idag minnas var för sig. S91 mätte kostnaden: två av
# tre kördes vid två separata tillfällen samma dag, av två olika aktörer, och
# de missade grindarna föll först i CI — ~9 minuter per träff bakom
# staging-låset. Ett kommando som kör allt är billigare än ett minne som ska
# hålla nio poster.
#
# ÄRLIGHETS-KRAVET (L351-klassen: en guard som är fel i halva sitt område får
# läsaren att sluta leta). Skriptet får ALDRIG rapportera grönt på ett sätt som
# antyder mer täckning än det har. Därför:
#   - varje grind rapporteras med eget namn och eget utfall,
#   - en grind vars verktyg saknas lokalt rapporteras SKIPPAD (aldrig tyst,
#     aldrig grön), och den avslutande sammanfattningen räknar upp dem,
#   - avslutningsraden säger uttryckligen om täckningen var fullständig.
#
# SCOPE — de nio CI-grindar som kan gå fel för att dokumentation rörts:
#   ci.yml docs-jobbet (villkorat på docs_changed):
#     1. lychee link check          — kräver lychee-binär, SKIPPAS om den saknas
#     2. markdownlint-cli2
#     3. Vale (npm run lint:prose)  — kräver vale-binär, SKIPPAS om den saknas
#     4. scripts/test-vale-regression.sh
#   ci.yml lint-jobbet (kör alltid, även på kod-PR:er):
#     5. scripts/check-frontmatter.sh
#     6. scripts/check-lifecycle.sh
#     7. scripts/check-public-checklists.sh
#     8. scripts/check-adr-count.sh
#     9. scripts/check-lesson-numbers.sh
#
# Grindar som medvetet INTE ingår: Biome, typecheck, audit, actionlint,
# yamllint, shellcheck, testsviten. De är kod-grindar — `npm run lint` +
# `npm run typecheck` är deras väg. Skriptet lovar dokumentation, inget annat.
#
# Som check-skripten i detta repo förlitar sig grinden på cwd=repo-root
# (ingen cd) — CI och lokala anrop kör från repo-roten.
#
# Exit 0 om alla KÖRDA grindar passerar. Exit 1 om någon faller. En skippad
# grind ändrar inte exit-koden men syns alltid i sammanfattningen.
#
# Etablerad: Session 91 (mekaniserings-punkt 2 ur sessionsdokets Del 4).

set -uo pipefail

FAILED=()
SKIPPED=()
PASSED=()

# Kör en grind, fånga utfallet, låt aldrig ett fel avbryta resten. Poängen med
# ett samlat kommando är att se ALLA fel på en gång — `set -e` hade gett ett
# fel i taget och därmed en runda per grind, alltså exakt det skriptet finns
# för att slippa.
run_gate() {
    local name="$1"
    shift
    printf '\n\033[1m▶ %s\033[0m\n' "${name}"
    if "$@"; then
        PASSED+=("${name}")
        return 0
    fi
    FAILED+=("${name}")
    return 0
}

skip_gate() {
    local name="$1"
    local why="$2"
    printf '\n\033[1m▶ %s\033[0m\n' "${name}"
    printf '\033[33m⏭  SKIPPAD — %s\033[0m\n' "${why}"
    SKIPPED+=("${name} (${why})")
}

# --- 1. lychee link check (INTERN yta) ------------------------------------
# CI kör lychee via lycheeverse/lychee-action med ett arg-block. Argumenten
# nedan speglar det blocket i sak.
#
# --offline SEDAN ADR-082 (2026-07-28): ci.yml:s docs-jobb kontrollerar bara
# INTERN yta, och den lokala grinden måste spegla samma snitt. Gör den inte det
# uppstår exakt den divergens beslutet ville ta bort — en död extern länk skulle
# blockera commit lokalt medan CI släpper igenom den, alltså ett stopp i arbetet
# orsakat av någon annans server, vilket är hela problemet ADR-082 löste.
# Extern yta kontrolleras kallt varje natt (nightly.yml → nightly-links) med
# egen ärende-kanal. Behöver du köra extern kontroll för hand: kör lychee utan
# --offline mot samma scope.
#
# Cache-flaggorna utelämnas — de finns inte längre i CI heller (ADR-082 beslut 3:
# en körning utan nätverk har inget att cacha).
#
# Saknas binären är det SKIPPAD, inte grönt: att låtsas ha kört den vore precis
# den lögn skriptets ärlighets-krav förbjuder.
#
# .claude/**/*.md TILLAGT S91 (TASK-71) i samma ändring som ci.yml:s arg-block —
# spegling i sak är hela poängen med detta skript och får inte glida isär.
# --exclude-path .claude/worktrees är no-op i CI (worktrees är gitignorerade och
# checkas aldrig ut där) men bärande lokalt: katalogen innehåller kompletta
# checkouts av repot på andra grenar, och utan raden länk-kontrolleras de.
if command -v lychee >/dev/null 2>&1; then
    run_gate "lychee link check" \
        lychee --offline --no-progress --exclude-path docs/archive \
        --exclude-path docs/reference/pocock \
        --exclude-path .claude/worktrees \
        './docs/**/*.md' './tasks/*.md' './tasks/sessions/*.md' \
        './tasks/threads/*.md' './tasks/lessons.d/*.md' \
        './.claude/**/*.md' './*.md'
else
    skip_gate "lychee link check" "lychee-binären saknas lokalt — CI kör den"
fi

# --- 2. markdownlint ------------------------------------------------------
# npx-villkoret är inte teoretiskt pedanteri: utan det rapporteras ett SAKNAT
# verktyg som ett dokumentations-FEL, och läsaren skickas att leta efter en
# markdownlint-överträdelse som inte finns. Samma klassnings-krav som gäller
# lychee och Vale ovan (L351) — ett verktyg som saknas är skippat, aldrig rött.
if command -v npx >/dev/null 2>&1; then
    run_gate "markdownlint-cli2" npx markdownlint-cli2
else
    skip_gate "markdownlint-cli2" "npx saknas lokalt — CI kör den"
fi

# --- 3. Vale (prosa) ------------------------------------------------------
if command -v vale >/dev/null 2>&1; then
    run_gate "Vale (npm run lint:prose)" npm run --silent lint:prose
else
    skip_gate "Vale (npm run lint:prose)" "vale-binären saknas lokalt — CI kör den"
fi

# --- 4. Vale-regressionssviten -------------------------------------------
if command -v vale >/dev/null 2>&1; then
    run_gate "Vale L_X.2-regressionssvit" bash scripts/test-vale-regression.sh
else
    skip_gate "Vale L_X.2-regressionssvit" "vale-binären saknas lokalt — CI kör den"
fi

# --- 5-9. De alltid-på grindarna i lint-jobbet ---------------------------
run_gate "Frontmatter på styrande docs" bash scripts/check-frontmatter.sh
run_gate "Lifecycle på sessionsdok + trådkort" bash scripts/check-lifecycle.sh
run_gate "Publika docs — oavklarade checklist-poster" bash scripts/check-public-checklists.sh
run_gate "ADR-räkningens konsistens" bash scripts/check-adr-count.sh
run_gate "Lesson-numrering (nummer vid landning)" bash scripts/check-lesson-numbers.sh

# --- Sammanfattning -------------------------------------------------------
printf '\n\033[1m─────────── check:docs ───────────\033[0m\n'
printf '\033[32m✅ %d gröna\033[0m' "${#PASSED[@]}"
if [[ ${#SKIPPED[@]} -gt 0 ]]; then
    printf '  ·  \033[33m⏭  %d skippade\033[0m' "${#SKIPPED[@]}"
fi
if [[ ${#FAILED[@]} -gt 0 ]]; then
    printf '  ·  \033[31m❌ %d röda\033[0m' "${#FAILED[@]}"
fi
printf '\n'

if [[ ${#FAILED[@]} -gt 0 ]]; then
    printf '\n\033[31mFöll:\033[0m\n'
    for g in "${FAILED[@]}"; do printf '  ❌ %s\n' "${g}"; done
fi

if [[ ${#SKIPPED[@]} -gt 0 ]]; then
    printf '\n\033[33mEj körda lokalt (CI kör dem — lokal grönt är alltså DELVIS):\033[0m\n'
    for g in "${SKIPPED[@]}"; do printf '  ⏭  %s\n' "${g}"; done
fi

if [[ ${#FAILED[@]} -gt 0 ]]; then
    printf '\n\033[31mcheck:docs RÖTT — fixa ovanstående före commit.\033[0m\n'
    exit 1
fi

if [[ ${#SKIPPED[@]} -gt 0 ]]; then
    printf '\n\033[33mcheck:docs grönt på det som kördes — täckningen är INTE fullständig.\033[0m\n'
    exit 0
fi

printf '\n\033[32mcheck:docs grönt — samtliga nio dokumentations-grindar körda.\033[0m\n'
exit 0
