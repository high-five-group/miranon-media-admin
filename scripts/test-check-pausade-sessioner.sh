#!/usr/bin/env bash
# scripts/test-check-pausade-sessioner.sh — tvåsidigt bevis för
# sannings-avstämningen (T119 arbetslista (b), S97).
#
# TVÅSIDIGT: planterade motsägelser ska FÄLLA, legitima paus-svansar ska
# SLÄPPAS. En grind som bara bevisar att den kan fälla har inte bevisat att
# den är användbar — den har bevisat att den är en svepande blockering.
#
# KÄRNAN I BEVISET är fall 1: en rigg som återskapar S96 Del 8-felet
# (sessionsdok står paused medan taggat arbete landar). Grinden är byggd för
# exakt det felet, och om testet inte kan framkalla det är grinden obevisad.
#
# Riggen bygger ÄKTA git-repon, inte mockade katalogstrukturer — hela
# mekanismen vilar på git-historik (nåbarhet, merge-commits, --grep mot
# commit-meddelanden), och en mock hade prövat mocken.
#
# Körs: bash scripts/test-check-pausade-sessioner.sh
# Exit 0 = alla fall gröna. Exit 1 = minst ett fall rött.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GRIND="${SCRIPT_DIR}/check-pausade-sessioner.sh"
POLICY_KALLA="${SCRIPT_DIR}/../.sanningsavstamning-policy.conf"

ANTAL=0
FEL=0

TMPROT="$(mktemp -d)"
trap 'rm -rf "${TMPROT}"' EXIT

# bygg_rigg <namn> → skriver repo-sökvägen på stdout
bygg_rigg() {
    local repo="${TMPROT}/$1"
    mkdir -p "${repo}/tasks/sessions" "${repo}/src" "${repo}/docs"
    git -C "${repo}" init -q -b main
    git -C "${repo}" config user.email "test@example.invalid"
    git -C "${repo}" config user.name "Testrigg"
    cp "${POLICY_KALLA}" "${repo}/.sanningsavstamning-policy.conf"
    # Karensen sätts till 0 i riggen. Skälet är att riggens commits är
    # sekunder gamla och produktionsvärdet (2 h) annars filtrerar bort exakt
    # det testet ska pröva. Karensen får ett EGET fall längst ner i stället —
    # den ska bevisas, inte kringgås tyst.
    printf '\nPAUS_KARENS_TIMMAR=0\n' >> "${repo}/.sanningsavstamning-policy.conf"
    printf '# todo\n' > "${repo}/tasks/todo.md"
    printf 'x\n' > "${repo}/src/app.ts"
    git -C "${repo}" add -A
    git -C "${repo}" commit -q -m "init"
    printf '%s' "${repo}"
}

# skriv_pausat_dok <repo> <N>
skriv_pausat_dok() {
    local repo="$1" n="$2"
    cat > "${repo}/tasks/sessions/2026-08-04-session-${n}.md" <<EOF
---
lifecycle: paused
---

# Session ${n}

## PAUSLÄGE — Session ${n} pausad (2026-08-04)
EOF
    git -C "${repo}" add -A
    git -C "${repo}" commit -q -m "docs(session): [S${n}] PAUSLÄGE — pausad"
}

# kor <repo> → skriver utfallet (GRON|DRIFT|ANROPSFEL) på stdout
kor() {
    local repo="$1" kod=0
    ( cd "${repo}" && REPO_ROT="${repo}" PAUS_POLICY="${repo}/.sanningsavstamning-policy.conf" \
        bash "${GRIND}" >/dev/null 2>&1 ) || kod=$?
    case "${kod}" in
        0) printf 'GRON' ;;
        1) printf 'DRIFT' ;;
        2) printf 'ANROPSFEL' ;;
        *) printf 'OKAND-%s' "${kod}" ;;
    esac
}

forvanta() {
    local vantat="$1" desc="$2" repo="$3"
    ANTAL=$((ANTAL + 1))
    local faktiskt
    faktiskt="$(kor "${repo}")"
    if [[ "${faktiskt}" == "${vantat}" ]]; then
        printf '  ✅ %-56s [%s]\n' "${desc}" "${faktiskt}"
    else
        printf '  ❌ %-56s [fick %s, väntade %s]\n' "${desc}" "${faktiskt}" "${vantat}"
        FEL=$((FEL + 1))
    fi
}

echo "═══ Sannings-avstämningen — tvåsidigt bevis ═══"
echo

# ── SIDA 1: motsägelser ska FÄLLA ────────────────────────────────────────
echo "SIDA 1 — planterade motsägelser (dok påstår paus, arbete landar)"

# Fall 1 — KÄRNBEVISET: S96 Del 8-felet återskapat.
R="$(bygg_rigg s96-felet)"
skriv_pausat_dok "${R}" 96
printf 'ny kod\n' >> "${R}/src/app.ts"
git -C "${R}" add -A
git -C "${R}" commit -q -m "feat(dev): [S96] PrototypeSwitcher far en tredje axel — VY"
forvanta DRIFT "S96 Del 8-felet: kodarbete landar under påstådd paus" "${R}"

R="$(bygg_rigg arbete-i-threads)"
skriv_pausat_dok "${R}" 96
mkdir -p "${R}/tasks/threads"
printf 'rad\n' > "${R}/tasks/threads/README.md"
git -C "${R}" add -A
git -C "${R}" commit -q -m "docs(threads): [S96][T118] Vale-rättelse"
forvanta DRIFT "arbete i tråd-registret under påstådd paus" "${R}"

R="$(bygg_rigg arbete-i-backlog)"
skriv_pausat_dok "${R}" 96
mkdir -p "${R}/backlog/tasks"
printf 'kort\n' > "${R}/backlog/tasks/task-999.md"
git -C "${R}" add -A
git -C "${R}" commit -q -m "docs(backlog): [S96] tre kort ur T118-svansen"
forvanta DRIFT "kort-mint under påstådd paus" "${R}"

R="$(bygg_rigg blandad-commit)"
skriv_pausat_dok "${R}" 96
printf 'mer\n' >> "${R}/tasks/todo.md"
printf 'kod\n' >> "${R}/src/app.ts"
git -C "${R}" add -A
git -C "${R}" commit -q -m "docs(session+todo): [S96] blandat"
forvanta DRIFT "blandad commit — todo tillåtet, kod ej: fäller på koden" "${R}"

# ── SIDA 2: legitima paus-svansar ska SLÄPPAS ────────────────────────────
echo
echo "SIDA 2 — legitima paus-svansar"

# Fall: S92:s verkliga svans — kadensraden, +16 h, rörde ENBART todo.md.
R="$(bygg_rigg s92-svansen)"
skriv_pausat_dok "${R}" 92
printf 'kadensrad\n' >> "${R}/tasks/todo.md"
git -C "${R}" add -A
git -C "${R}" commit -q -m "docs(todo): [S92] kadensraden skriven"
forvanta GRON "S92:s verkliga svans: kadensrad i todo.md" "${R}"

R="$(bygg_rigg eget-dok)"
skriv_pausat_dok "${R}" 96
printf 'mer text\n' >> "${R}/tasks/sessions/2026-08-04-session-96.md"
git -C "${R}" add -A
git -C "${R}" commit -q -m "docs(session): [S96] Vale-rättelse i eget dok"
forvanta GRON "pausad session får röra sitt EGET dok" "${R}"

R="$(bygg_rigg merge-commit)"
skriv_pausat_dok "${R}" 96
git -C "${R}" switch -q -c sidogren
printf 'kod\n' >> "${R}/src/app.ts"
git -C "${R}" add -A
git -C "${R}" commit -q -m "feat: [S96] arbete pa sidogren"
git -C "${R}" switch -q main
git -C "${R}" revert -q --no-edit HEAD 2>/dev/null || true
git -C "${R}" reset -q --hard HEAD
git -C "${R}" merge -q --no-ff sidogren -m "Merge pull request #699 from high-five-group/docs/s96-paus-4" 2>/dev/null
# Merge-commiten själv ska ignoreras; men sidogrenens icke-merge-commit är
# äkta arbete och SKA fälla — det är rätt utfall, inte ett fel i testet.
forvanta DRIFT "merge ignoreras, men arbetet den bär fäller ändå" "${R}"

R="$(bygg_rigg annan-session)"
skriv_pausat_dok "${R}" 96
printf 'kod\n' >> "${R}/src/app.ts"
git -C "${R}" add -A
git -C "${R}" commit -q -m "feat(dev): [S97] en ANNAN sessions arbete"
forvanta GRON "en annan sessions taggade arbete rör inte S96:s paus" "${R}"

# REGRESSIONSFALLET för den falska positiv grinden fällde på under sin FÖRSTA
# skarpa natt (run 30974653786, 2026-08-05). Fallet ovan prövar taggen i
# subject; detta prövar taggen i BODYN — luckan som fanns emellan dem.
#
# Riggen återskapar e1e7407d bokstavligt: en [S97]-commit vars body citerar
# "[S96]-taggade PR:er" när den beskriver felbilden. Med `--grep` (hela
# meddelandet) fäller detta fall; med subject-matchning gör det inte det.
# Grinden fällde alltså på sin egen skapelse-commit.
#
# Generaliseringen är poängen: varje commit som RESONERAR om en pausad
# session — ADR, lesson, post-mortem — bär taggen i sin body utan att vara
# arbete i den sessionen. Prosa om ett fel är inte felet.
R="$(bygg_rigg tagg-endast-i-body)"
skriv_pausat_dok "${R}" 96
printf 'kod\n' >> "${R}/src/app.ts"
git -C "${R}" add -A
git -C "${R}" commit -q \
    -m "feat(ci): [S97] sannings-avstamningar som natt-lager — T119 (b)" \
    -m "S96 Del 8: sessionen stod paused medan fem [S96]-taggade PR:er landade i den."
forvanta GRON "[S96] ENBART i bodyn av en [S97]-commit fäller inte" "${R}"

# Motsidan av samma gräns: taggen i subject SKA fortfarande fälla även när
# bodyn nämner en helt annan session. Utan detta fall kan matchningen
# regressera till "leta aldrig efter taggen alls" och ändå se grön ut.
R="$(bygg_rigg tagg-i-subject-annan-i-body)"
skriv_pausat_dok "${R}" 96
printf 'kod\n' >> "${R}/src/app.ts"
git -C "${R}" add -A
git -C "${R}" commit -q \
    -m "feat(dev): [S96] akta arbete under pausen" \
    -m "Bygger vidare på det [S94] lamnade efter sig."
forvanta DRIFT "tagg i SUBJECT fäller, oavsett vad bodyn nämner" "${R}"

R="$(bygg_rigg aktiv-session)"
R2="${R}"
mkdir -p "${R2}/tasks/sessions"
cat > "${R2}/tasks/sessions/2026-08-04-session-96.md" <<'EOF'
---
lifecycle: active
---

# Session 96
EOF
printf 'kod\n' >> "${R2}/src/app.ts"
git -C "${R2}" add -A
git -C "${R2}" commit -q -m "feat(dev): [S96] arbete i en AKTIV session"
forvanta GRON "aktiv session prövas inte alls" "${R2}"

# ── SIDA 3: anropsfel ska skiljas från drift ─────────────────────────────
echo
echo "SIDA 3 — anropsfel (exit 2) skiljs från drift (exit 1)"

R="$(bygg_rigg ingen-policy)"
skriv_pausat_dok "${R}" 96
rm -f "${R}/.sanningsavstamning-policy.conf"
forvanta ANROPSFEL "saknad policyfil ⇒ anropsfel, aldrig grönt" "${R}"

R="$(bygg_rigg tom-regellista)"
skriv_pausat_dok "${R}" 96
printf 'PAUS_SVANS_TILLATNA=()\nPAUS_SESSIONSDOK_GLOB="tasks/sessions/*.md"\n' \
    > "${R}/.sanningsavstamning-policy.conf"
forvanta ANROPSFEL "tom regellista ⇒ anropsfel, inte 'allt tillåtet'" "${R}"

R="$(bygg_rigg tom-glob)"
skriv_pausat_dok "${R}" 96
sed -i.bak 's|^PAUS_SESSIONSDOK_GLOB=.*|PAUS_SESSIONSDOK_GLOB="tasks/finns-inte/*.md"|' \
    "${R}/.sanningsavstamning-policy.conf"
forvanta ANROPSFEL "glob som matchar noll filer ⇒ anropsfel, inte grönt" "${R}"

# ── SIDA 4: karensen bevisas, inte antas ─────────────────────────────────
echo
echo "SIDA 4 — karensen (anti-brus mot pågående landningar)"

# Samma motsägelse som fall 1, men med produktionskarensen påslagen. Commiten
# är sekunder gammal, alltså inne i karensen, och ska INTE fälla ännu.
R="$(bygg_rigg karens-skyddar)"
skriv_pausat_dok "${R}" 96
printf 'ny kod\n' >> "${R}/src/app.ts"
git -C "${R}" add -A
git -C "${R}" commit -q -m "feat(dev): [S96] arbete som just landat"
printf '\nPAUS_KARENS_TIMMAR=2\n' >> "${R}/.sanningsavstamning-policy.conf"
forvanta GRON "färsk landning inom karensen fäller INTE" "${R}"

# Samma rigg, men commiten backdateras förbi karensen ⇒ ska fälla.
R="$(bygg_rigg karens-slapper-igenom)"
skriv_pausat_dok "${R}" 96
printf 'ny kod\n' >> "${R}/src/app.ts"
git -C "${R}" add -A
NU_S="$(date +%s)"
GAMMALT="$(date -u -r "$(( NU_S - 6 * 3600 ))" +%Y-%m-%dT%H:%M:%S 2>/dev/null)" \
    || GAMMALT="$(date -u -d '6 hours ago' +%Y-%m-%dT%H:%M:%S)"
GIT_AUTHOR_DATE="${GAMMALT}" GIT_COMMITTER_DATE="${GAMMALT}" \
    git -C "${R}" commit -q -m "feat(dev): [S96] arbete for sex timmar sedan"
printf '\nPAUS_KARENS_TIMMAR=2\n' >> "${R}/.sanningsavstamning-policy.conf"
forvanta DRIFT "landning ÄLDRE än karensen fäller" "${R}"

echo
if [[ "${FEL}" -eq 0 ]]; then
    echo "✅ ${ANTAL}/${ANTAL} gröna."
    exit 0
fi
echo "❌ ${FEL} av ${ANTAL} röda."
exit 1
