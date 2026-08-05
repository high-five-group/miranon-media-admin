#!/usr/bin/env bash
# check-docs.sh — kör ALLA dokumentations-grindar CI kör, i ett kommando.
#
# VARFÖR: grindarna bor på två ställen i ci.yml (docs-jobbet + det alltid-på
# lint-jobbet) och måste idag minnas var för sig. S91 mätte kostnaden: två av
# tre kördes vid två separata tillfällen samma dag, av två olika aktörer, och
# de missade grindarna föll först i CI — ~9 minuter per träff bakom
# staging-låset. Ett kommando som kör allt är billigare än ett minne som ska
# hålla hela listan nedan.
#
# ÄRLIGHETS-KRAVET (L351-klassen: en guard som är fel i halva sitt område får
# läsaren att sluta leta). Skriptet får ALDRIG rapportera grönt på ett sätt som
# antyder mer täckning än det har. Därför:
#   - varje grind rapporteras med eget namn och eget utfall,
#   - en grind vars verktyg saknas lokalt rapporteras SKIPPAD (aldrig tyst,
#     aldrig grön), och den avslutande sammanfattningen räknar upp dem,
#   - avslutningsraden säger uttryckligen om täckningen var fullständig.
#
# VARFÖR BASH OCH INTE EN TASK-RUNNER (verktygspassets dom BEHÅLL, 2026-07-27 —
# docs/research/verktygsval-fyra-egenbyggen-2026-07-27.md § 2). Sju kandidater
# prövades: npm-run-all2, concurrently, Wireit, just, Task, GNU Make, npm självt.
# INGEN kan uttrycka ärlighets-kravets TRI-STATE — grön, röd, SKIPPAD — och det
# är hela poängen ovan. Samtliga är exit-kod-maskiner: 0 eller icke-0.
#
# Wireit var den seriösa kandidaten (`WIREIT_FAILURES=continue` kör vidare och
# ger en samlad bild) men saknar också skippad-tillståndet. `command -v lychee`
# måste bo någonstans; flyttas den till ett wrapper-script per grind har man
# bara flyttat bash — och förlorat den samlade skippad-listan i slutet, som är
# just det som gör rapporten ärlig.
#
# Detaljerna, inklusive att `npm --if-present` gäller ett saknat SCRIPT och
# aldrig en saknad BINÄR, står i passets § "Varför tri-state-kravet fäller alla".
#
# SCOPE-KRITERIET, UTSKRIVET (TASK-106, 2026-07-31). En CI-grind hör hit om en
# REN dokumentations-ändring kan fälla den. Kriteriet är KAUSALT, inte
# natur-baserat: frågan är vad som kan gå sönder av att någon redigerat en
# .md-fil — aldrig om grinden "känns som" dokumentations-lint.
#
# Varför kriteriet står skrivet i stället för underförstått: fram till TASK-106
# saknade uppräkningen två grindar som CI kör och som en docs-ändring fäller
# (11 och 12 nedan). INOM filen var allt konsekvent — tio poster, tio uppräknade,
# tio körda, och slutraden sade tio — så den felklass
# `en-rakning-utan-utskrivna-poster-granskas-aldrig` beskriver fångade den inte.
# En LISTA kan bara granskas för fullständighet mot ett kriterium, och ett
# kriterium som ingen skrivit ned kan ingen pröva mot. (Talet var däremot fel
# MELLAN filer: `.claude/agents/bygg-agent.md` sade "nio". Den halvan är löst
# genom att slutradens tal nu är härlett och kopian borttagen.)
#
# DE TRETTON:
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
#    10. scripts/check-permissions-claims.sh
#    11. scripts/check-fetch-depth-invariant.sh — läser ADR-029 + ADR-030 och
#        kräver att erratum-noten finns. Mätt 2026-07-31 mot fixtur: struken
#        erratum-rad i ADR-029 ⇒ exit 1. Ingenting utom en .md-ändring behövdes.
#    12. scripts/check-listparitet.sh — paret `sentinel-markorer` läser
#        CONTRIBUTING.md, paret `lychee-scope` läser DENNA fil. Mätt samma dag:
#        en struken sentinel-backtick i CONTRIBUTING.md ⇒ exit 1.
#    13. scripts/check-thread-index.sh — trådregistrets index (radform, enum i
#        rätt kolumn, numrering, index↔fil, besläktad↔registret,
#        barn-manifest↔registret). Wirad i lint-jobbet i TASK-108-wiringen;
#        rubriken ovan blev sann i SAMMA commit som denna rad skrevs —
#        ADR-083 förbjuder ordningen "lista först, mekanism sen". Femte
#        invarianten (besläktad, ADR-095 beslut 2–3) tillagd i TASK-140.
#        Sjätte invarianten (barn-manifest, ADR-095 beslut 4) tillagd i
#        TASK-141.
#
# POST 10 VAR ETT FALSKT PÅSTÅENDE FRÅN ADR-083:s LANDNING TILL TASK-98
# (2026-07-30 → 2026-07-31). Grinden var inkopplad här och dess self-test kördes
# i ci.yml, men grinden själv kördes där noll gånger medan de fem syskonen kördes
# en var. Denna fil påstod alltså en mekanism som inte fanns — vilket är exakt
# den felklass ADR-083 mintades för. TASK-98 wirade grinden i lint-jobbet i
# stället för att skriva om rubriken: en grind som ingen kör är inte en grind.
#
# RÄKNINGEN VERIFIERAS MEKANISKT, INTE GENOM LÄSNING — men formen spelar roll:
#   grep -cE '^[[:space:]]+run: bash scripts/<grind>\.sh$' .github/workflows/ci.yml
# Den okvalificerade formen `grep -c 'bash scripts/<grind>.sh'` räcker INTE.
# Den råkade ge 1 för posterna 5-10, men mätt 2026-07-31 ger den 2 för post 12:
# ci.yml rad 612 är en KOMMENTAR som nämner `bash scripts/check-listparitet.sh`
# bredvid körningen på rad 615. En räkning som inte skiljer körning från
# omnämnande är fail-open i exakt den riktning TASK-98 lagade.
#
# INTE INGÅR — bokfört per post, aldrig underförstått:
#   · Biome · typecheck · audit · actionlint · yamllint · shellcheck ·
#     testsviten — kod-grindar. Ingen av dem läser en .md-fil, alltså kan ingen
#     ren dokumentations-ändring fälla dem. `npm run lint` + `npm run typecheck`
#     är deras väg. Skriptet lovar dokumentation, inget annat.
#   · scripts/check-staging-preflight-wiring.mjs — kör i SAMMA alltid-på
#     lint-jobb som 5-12 och är därför den enda kandidat kriteriet måste prövas
#     mot uttryckligen i stället för att avfärdas som "kod-grind". Dess indata är
#     playwright.config.ts och scripts/*.mjs; ingen .md-fil ingår. Utanför, med
#     skäl.
#
# LISTAN HÅLLS MOT ci.yml AV PARET `docs-grindar` SEDAN TASK-109 (2026-08-01).
# Markör-paren (paritet-start/-slut med namnen `docs-grindar-lokal` nedan
# respektive `docs-grindar-ci` i ci.yml:s lint-jobb) avgränsar de två
# regionerna — markör-literalen skrivs MEDVETET inte ut här: grinden tar
# FÖRSTA raden som bär strängen, så ett omnämnande före den riktiga markören
# flyttar regionsgränsen (fångat av mig själv 2026-08-01, fail-closed exit 2
# på B-sidan och tyst fel regionstart på A-sidan).
# scripts/check-listparitet.sh kräver mängd-LIKHET (riktning bada)
# på uttrycket `bash scripts/check-[a-z0-9-]+\.sh`. Hela-filen-varianten var
# bevisat fail-open (kommentarer donerade fantom-poster — mätt 2026-07-31 och
# re-mätt 2026-08-01), därför markörer: regionen mellan dem läses som DATA,
# och en kommentar där inne får aldrig bära frasen "bash scripts/check-…".
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
#
# SPEGLINGEN ÄR GRINDAD SEDAN TASK-85. Raden ovan — "får inte glida isär" — var
# fram till dess ett löfte utan mekanism, och ADR-081:s landning bevisade att
# löftet inte räcker: den lade `./tasks/lessons.d/*.md` i BÅDA listorna och
# ökade därmed duplikationen med en rad utan att någon grind såg det. Markörerna
# nedan avgränsar blocket för scripts/check-listparitet.sh, som jämför det mot
# ci.yml:s `paritet:start lychee-ci`-block. Kommentarer måste stå OVANFÖR
# start-markören — regionen mellan markörerna läses som data.
if command -v lychee >/dev/null 2>&1; then
    # paritet:start lychee-lokal
    run_gate "lychee link check" \
        lychee --offline --no-progress --exclude-path docs/archive \
        --exclude-path docs/reference/pocock \
        --exclude-path .claude/worktrees \
        './docs/**/*.md' './tasks/*.md' './tasks/sessions/*.md' \
        './tasks/threads/*.md' './tasks/lessons.d/*.md' \
        './.claude/**/*.md' './*.md'
    # paritet:slut lychee-lokal
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

# --- 5-13. De alltid-på grindarna i lint-jobbet --------------------------
# Blocket är A-SIDAN i paret `docs-grindar` (.listparitet-policy.conf, TASK-109)
# och hålls mängd-likt med ci.yml:s lint-jobb av scripts/check-listparitet.sh.
# Regionen mellan markörerna läses som data — inga kommentarer med frasen
# "bash scripts/check-…" här inne.
# paritet:start docs-grindar-lokal
run_gate "Frontmatter på styrande docs" bash scripts/check-frontmatter.sh
run_gate "Lifecycle på sessionsdok + trådkort" bash scripts/check-lifecycle.sh
run_gate "Tråd-registrets index (radform + enum + numrering + index↔fil)" bash scripts/check-thread-index.sh
run_gate "Publika docs — oavklarade checklist-poster" bash scripts/check-public-checklists.sh
run_gate "ADR-räkningens konsistens" bash scripts/check-adr-count.sh
run_gate "Lesson-numrering (nummer vid landning)" bash scripts/check-lesson-numbers.sh
run_gate "Permissions-påståenden (prosa som påstår mekanism)" bash scripts/check-permissions-claims.sh
# 11-12 tillagda TASK-106. Båda är INVARIANT-vakter till sin natur, och det var
# skälet de stod utanför — men scope-kriteriet ovan är kausalt, inte
# natur-baserat, och båda fäller på en ren .md-ändring. Kostnaden är mätt lokalt
# (macOS 2026-07-31, loadavg 3,4-4,8, tre körningar var): 0,052-0,066 s
# respektive 0,847-0,874 s, mot 19,27 s för hela skriptet före tillägget —
# alltså ~+4,8 %. CI-TIDEN ÄR INTE MÄTT AV MIG.
run_gate "fetch-depth-invarianten (ADR-029/030 erratum)" bash scripts/check-fetch-depth-invariant.sh
run_gate "Listparitet (CONTRIBUTING ↔ purge-policy, lychee-scopen)" bash scripts/check-listparitet.sh
# paritet:slut docs-grindar-lokal

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

# TALET ÄR HÄRLETT, INTE SKRIVET (TASK-106). Raden sade tidigare "samtliga tio"
# som en literal, och literalen är ADR-083:s felklass i miniatyr: den påstår en
# täckning ingen kontrollerar. Den divergerade också skarpt —
# `.claude/agents/bygg-agent.md` sade "nio" mot skriptets "tio", och TRE
# oberoende agenter rapporterade avvikelsen samma dag utan att någon kunde
# åtgärda den. Räknar raden i stället ${#PASSED[@]} kan den aldrig ljuga om
# antalet: grenen nås bara när SKIPPED är tom, alltså är PASSED hela mängden.
# Kvar att bevaka är LISTANS fullständighet — det är vad scope-kriteriet överst
# i filen finns för.
printf '\n\033[32mcheck:docs grönt — samtliga %d dokumentations-grindar körda.\033[0m\n' "${#PASSED[@]}"
exit 0
