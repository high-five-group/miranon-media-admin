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

# epoch_iso <epoch-sekunder> → ISO8601 UTC på stdout, för GIT_*_DATE.
# BSD (macOS, `date -r`) och GNU (`date -d @epoch`) i fallback-ordning —
# samma mönster som SIDA 4:s GAMMALT-uträkning nedan, faktoriserat ut för
# TASK-197:s två nya riggar.
epoch_iso() {
    date -u -r "$1" +%Y-%m-%dT%H:%M:%S 2>/dev/null \
        || date -u -d "@$1" +%Y-%m-%dT%H:%M:%S
}

# skriv_pausat_dok_vid <repo> <N> <iso-datum>
# Som skriv_pausat_dok, men paus-commitens committer-tid sätts EXPLICIT i
# stället för "nu" — TASK-197:s riggar behöver kontrollera ordningen mellan
# paus-tiden och en parallell grens arbets-tid oberoende av verklig klocka.
skriv_pausat_dok_vid() {
    local repo="$1" n="$2" datum="$3"
    cat > "${repo}/tasks/sessions/2026-08-04-session-${n}.md" <<EOF
---
lifecycle: paused
---

# Session ${n}

## PAUSLÄGE — Session ${n} pausad (2026-08-04)
EOF
    git -C "${repo}" add -A
    GIT_AUTHOR_DATE="${datum}" GIT_COMMITTER_DATE="${datum}" \
        git -C "${repo}" commit -q -m "docs(session): [S${n}] PAUSLÄGE — pausad"
}

# bygg_parallell_topologi <namn> <N> <arbete_offset_sek> <paus_offset_sek>
#
# Planterar S103:s EXAKTA topologi hermetiskt (TASK-197): en gren
# "gren-arbete" och en gren "gren-paus" förgrenas från SAMMA bas-commit —
# ingen av dem har någonsin sett den andra — och mergas sedan in i main med
# ÄKTA merge-commits (--no-ff, "Merge pull request #…"-subject, matchar
# repots faktiska landningsform) i ordningen arbete FÖRST, paus SEDAN. Det är
# bokstavligen PR #1155 (feat/s103-rik-granskningsperson, mergad först) och
# PR #1157 (docs/s103-del7-och-basfynd, bär paus-commiten, mergad sedan).
#
# Offsets är sekunder FÖRE "nu" (större offset = längre bak i tiden). Genom
# att ge arbete- och paus-offset olika värden kan anroparen välja om arbetet
# hände FÖRE eller EFTER pausen i VERKLIG tid — oberoende av DAG-ordningen
# ovan, som alltid är "arbete mergas in före paus" och alltså alltid gör
# arbets-commiten icke-nåbar från paus-SHA:n.
#
# Skriver "repo arbets-SHA paus-SHA" på EN rad, blankstegs-separerat, på
# stdout — läs med `read -r repo asha psha <<< "$(...)"`. MEDVETET en enda
# rad, inte tre: `read` konsumerar bara EN newline-terminerad rad per anrop
# oavsett hur många variabelnamn den ges — IFS avgör hur DEN raden delas i
# ord, den får inte `read` att fortsätta läsa över radbrytningar. Tre rader
# hade gett R hela första raden och lämnat resten tomma (mätt: TASK-197:s
# första utkast gjorde precis det misstaget).
bygg_parallell_topologi() {
    local namn="$1" n="$2" arbete_offset="$3" paus_offset="$4"
    local repo nu arbete_dat paus_dat bas arbete_sha paus_sha
    repo="$(bygg_rigg "${namn}")"
    nu="$(date +%s)"
    arbete_dat="$(epoch_iso "$(( nu - arbete_offset ))")"
    paus_dat="$(epoch_iso "$(( nu - paus_offset ))")"
    bas="$(git -C "${repo}" rev-parse HEAD)"

    git -C "${repo}" switch -q -c gren-arbete "${bas}"
    printf 'ny kod pa parallell gren\n' >> "${repo}/src/app.ts"
    git -C "${repo}" add -A
    GIT_AUTHOR_DATE="${arbete_dat}" GIT_COMMITTER_DATE="${arbete_dat}" \
        git -C "${repo}" commit -q -m "feat(dev): [S${n}] arbete pa parallell gren"
    arbete_sha="$(git -C "${repo}" rev-parse HEAD)"

    git -C "${repo}" switch -q -c gren-paus "${bas}"
    skriv_pausat_dok_vid "${repo}" "${n}" "${paus_dat}"
    paus_sha="$(git -C "${repo}" rev-parse HEAD)"

    git -C "${repo}" switch -q main
    git -C "${repo}" merge -q --no-ff gren-arbete \
        -m "Merge pull request #501 from high-five-group/feat/s${n}-parallell-arbete" 2>/dev/null
    git -C "${repo}" merge -q --no-ff gren-paus \
        -m "Merge pull request #502 from high-five-group/docs/s${n}-paus" 2>/dev/null

    printf '%s %s %s' "${repo}" "${arbete_sha}" "${paus_sha}"
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

# ── SIDA 5: nåbarhet ≠ kronologi (TASK-197) ──────────────────────────────
echo
echo "SIDA 5 — nåbarhet ≠ kronologi: S103:s parallell-PR-topologi"

# Fall A — FALSKLARMET. Arbetet mergas in FÖRE pausen (DAG-ordning, som
# alltid i denna rigg) OCH hände FÖRE pausen i VERKLIG tid (arbete_offset
# 10000s > paus_offset 6000s ⇒ arbetet är ~1,1 h äldre). Nåbarhetstestet
# (`PAUS_SHA..HEAD`) ser fortfarande icke-nåbarhet — grenarna delar bas men
# har aldrig sett varandra — och skulle utan TASK-197-fixen ha flaggat detta
# som "arbete efter pausen". Detta är bokstavligen S103: fa41a1be (22:21) och
# 0507c77c (22:34) FÖRE paus-commiten 9af3c004 (23:02), ändå icke-nåbara från
# den.
# shellcheck disable=SC2312
# AVSIKTLIGT: bygg_parallell_topologi() opererar på fixerad, precis skapad
# lokal riggdata (inget yttre tillstånd som kan fela oväntat mitt i), och dess
# stdout konsumeras direkt av forvanta()/de manuella nåbarhets-kontrollerna
# nedan — ett tomt/trasigt värde upptäcks där, inte via den maskerade koden.
read -r R ARBETE_SHA PAUS_SHA_A <<< "$(bygg_parallell_topologi falsklarm-parallell-pr 197 10000 6000)"

# Bevisa att riggen VERKLIGEN reproducerar nåbarhets-mekanismen innan den
# räknas som bevis för fixen — annars är den inte representativ för felet.
ANTAL=$((ANTAL + 1))
if git -C "${R}" merge-base --is-ancestor "${ARBETE_SHA}" "${PAUS_SHA_A}" 2>/dev/null; then
    printf '  ❌ %-56s [riggen fel: grenarna ÄR nåbara från varandra]\n' \
        "riggen konstruerar S103:s icke-nåbarhet"
    FEL=$((FEL + 1))
else
    RAA_NABARHETSTRAFF="$(git -C "${R}" log "${PAUS_SHA_A}..HEAD" --no-merges --format='%H %s' \
        | grep -F -- "[S197]" || true)"
    if [[ -n "${RAA_NABARHETSTRAFF}" ]]; then
        printf '  ✅ %-56s [RAA-NABARHET]\n' \
            "riggen konstruerar S103:s icke-nåbarhet (gamla logiken skulle fälla)"
    else
        printf '  ❌ %-56s [den rå nåbarhetsträffen uteblev — riggen bevisar ingenting]\n' \
            "riggen konstruerar S103:s icke-nåbarhet"
        FEL=$((FEL + 1))
    fi
fi

forvanta GRON "TASK-197: parallell-PR-arbete FÖRE pausen flaggas INTE" "${R}"

# Fall B — SANNA POSITIVEN BEVARAS. Identisk topologi (arbetet är fortfarande
# DAG-icke-nåbart från paus-SHA:n — samma grenkonstruktion), men tiderna är
# vända: arbetet hände EFTER pausen i verklig tid (arbete_offset 3000s <
# paus_offset 9000s ⇒ arbetet är ~1,7 h YNGRE). Detta SKA fortfarande fälla —
# annars har TASK-197-fixen överkorrigerat och gjort grinden blind för äkta
# paus-drift så fort den råkar ha den här grenformen, vilket vore ett värre
# fel än det den lagar.
# SHA:erna behövs inte i detta fall (bara utfallet prövas) — men
# read-formen måste matcha bygg_parallell_topologis tre stdout-rader.
# shellcheck disable=SC2034
# Samma SC2312-skäl som fall A ovan.
# shellcheck disable=SC2312
read -r R2 ARBETE_SHA2 PAUS_SHA_B <<< "$(bygg_parallell_topologi sann-positiv-parallell-pr 198 3000 9000)"
forvanta DRIFT "TASK-197: parallell-PR-arbete EFTER pausen fäller fortfarande" "${R2}"

echo
if [[ "${FEL}" -eq 0 ]]; then
    echo "✅ ${ANTAL}/${ANTAL} gröna."
    exit 0
fi
echo "❌ ${FEL} av ${ANTAL} röda."
exit 1
