#!/usr/bin/env bash
# scripts/deny-frammande-huvudkatalog.sh — ADR-090 beslut 2 som mekanism.
#
# VARFÖR SKRIPTET FINNS: ADR-090 beslut 2 säger "Den senare startande
#   sessionen tar worktreen; den först startade behåller sin plats i
#   huvudträdet." Regeln fanns bara i prosa. Den bröts tre gånger i ETT pass
#   (S96 Del 8, 2026-08-03): två `git merge --ff-only` och en gren skapad i
#   huvudkatalogen medan S93 ägde den. Ingen skada den gången — rena träd,
#   rena fast-forwards — men fel form, och `check-lifecycle.sh` var grön hela
#   tiden eftersom den prövar KONSISTENS, inte SANNING. Samma klass som T116:
#   en grind som prövar formen, inte verkligheten.
#
# VAD DEN PRÖVAR: "får DENNA session göra en git-skrivning i huvudkatalogen
#   just nu?" — tre delfrågor, i denna ordning (billigast först):
#     1. Är kommandot en git-skrivning?      (mot policyfilens listor)
#     2. Riktas det mot huvudkatalogen?      (cwd-jämförelse ELLER textmönster)
#     3. Äger denna session huvudkatalogen?  (ägarlappen i --git-common-dir)
#
# ═══ FAIL-OPEN-VALET — läs innan du ändrar något här ═══
#
#   Detta skript failar ÖPPET: varje internt fel (jq saknas, tom stdin, ingen
#   policyfil, inte ett git-repo, oläsbar ägarlapp) slutar i `exit 0` =
#   verktygsanropet fortsätter.
#
#   Det AVVIKER medvetet från scripts/deny-resend-send.sh, som nekar vid varje
#   internt fel. Skillnaden är skadans natur, inte slarv:
#     - Mail-låset: skadan är ett SKICKAT MAIL. Irreversibelt. Rogers krav är
#       noll-tolerans, alltså måste "vet inte" neka.
#     - Detta lås: skadan är fel FORM på en git-operation. S96:s tre faktiska
#       överträdelser gav rena träd och rena fast-forwards — noll dataförlust.
#       En trasig hook som nekar allt skulle däremot låsa hela arbetet i alla
#       worktrees samtidigt, vilket är en värre skada än den den skyddar mot.
#   Marcus-kvitterat 2026-08-04. Formen följer scripts/deny-sweeping-git-add.sh
#   i pluginet (`command -v jq >/dev/null 2>&1 || exit 0`).
#
# ═══ ASK, INTE DENY — och varför ═══
#
#   Vid konstaterad ägarkonflikt returnerar skriptet
#   `permissionDecision: "ask"` på stdout med exit 0, INTE `exit 2`.
#
#   ADR-090 beslut 3 förkastar uttryckligen "detektera + agera tyst" och
#   landar på detektera + fråga, med vim/Codespaces som precedent. En hård
#   `exit 2` vore tmux-formen (blockera + kräv override) — också sanktionerad
#   i ADR:n, men inte den form beslutet faktiskt valde. `ask` låter Marcus
#   avgöra i stunden, vilket är hela poängen med ägarskaps-regeln: den har
#   legitima undantag (S97 kör själv i huvudkatalogen med kvittens).
#
#   KÄND RISK, öppet skriven: JSON-vägen har en dokumenterad
#   opålitlighets-instans (github.com/anthropics/claude-code/issues/37210)
#   som gäller Edit-verktyget. Den är INTE motbevisad för Bash. Om `ask`
#   visar sig opålitligt i drift är bytet till `exit 2` en enradsändring i
#   `fraga()` nedan — och det ska då bokföras som en Update i ADR-090, inte
#   ändras tyst.
#
#   `ask` hänger dessutom i en AFK-batch där ingen svarar. Det är ett
#   medvetet pris: en AFK-batch som rör främmande huvudkatalog SKA stanna.
#
# ═══ SCOPE-GRÄNSER, öppet skrivna ═══
#
#   1. ENDAST Bash-verktyget. En session i en worktree kan redigera en fil i
#      huvudkatalogen via Edit/Write med absolut sökväg — samma klass av fel,
#      annan väg in. Det ligger UTANFÖR T119 arbetslista (a), som säger
#      "git-skriv". Noterat som kandidat till egen punkt, inte inbakat här.
#   2. Textmönstren för `git -C <path>` och `cd <path> && git` är
#      APPROXIMATIVA. En shell-sträng går inte att tolka exakt utan att
#      implementera en shell-parser. Väg 1 (cwd-jämförelsen) är exakt; väg 2
#      och 3 är bäst-ansträngning. Samma medvetna grovhet som mail-låsets
#      endpoint-mönster, och av samma skäl.
#   3. Relativa sökvägar mot huvudkatalogen (t.ex. `git -C ../..`) fångas
#      inte. De skulle kräva path-normalisering mot en cwd som kan ha ändrats
#      tidigare i samma kommandokedja.
#
# INPUT: PreToolUse hook-JSON på stdin (`tool_name`, `tool_input.command`,
#   `cwd`, `session_id`) — bekräftat mot code.claude.com/docs/en/hooks.md
#   2026-08-04 och mot att scripts/agent-spawn-log.sh:157-162 redan läser
#   `cwd` och `session_id` i drift.
#
# Testsvit: scripts/test-deny-frammande-huvudkatalog.sh (tvåsidigt bevis).
#
# Källa: T119 arbetslista (a) · ADR-090 beslut 2/3/5 · S96 Del 8 ·
#        .katalogagarskap-policy.conf · scripts/katalogagarskap-markor.sh ·
#        code.claude.com/docs/en/hooks.md
# Etablerad: S97, 2026-08-04

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" || exit 0
KATALOG_POLICY="${KATALOG_POLICY:-${SCRIPT_DIR}/../.katalogagarskap-policy.conf}"

# fraga <skäl> — ADR-090 beslut 3:s form. Se § ASK, INTE DENY ovan.
fraga() {
    jq -nc --arg skal "$1" '{
        hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "ask",
            permissionDecisionReason: $skal
        }
    }' 2>/dev/null || exit 0
    exit 0
}

command -v jq >/dev/null 2>&1 || exit 0
command -v git >/dev/null 2>&1 || exit 0
[[ -f "${KATALOG_POLICY}" ]] || exit 0
# shellcheck source=/dev/null
source "${KATALOG_POLICY}" 2>/dev/null || exit 0

[[ "${#KATALOG_GIT_SKRIVKOMMANDON[@]:-0}" -gt 0 ]] || exit 0

INPUT=""
IFS= read -r -d '' INPUT || true
[[ -n "${INPUT}" ]] || exit 0

TOOL_NAME="$(printf '%s' "${INPUT}" | jq -r '.tool_name // empty' 2>/dev/null)"
[[ "${TOOL_NAME}" = "Bash" ]] || exit 0

COMMAND="$(printf '%s' "${INPUT}" | jq -r '.tool_input.command // empty' 2>/dev/null)"
[[ -n "${COMMAND}" ]] || exit 0

SESSION_ID="$(printf '%s' "${INPUT}" | jq -r '.session_id // empty' 2>/dev/null)"
[[ -n "${SESSION_ID}" ]] || exit 0

HOOK_CWD="$(printf '%s' "${INPUT}" | jq -r '.cwd // empty' 2>/dev/null)"
# Går katalogbytet inte igenom vet vi inte vilket repo vi står i, och varje
# slutsats härifrån vore om fel träd. Fail-open enligt § FAIL-OPEN-VALET.
if [[ -n "${HOOK_CWD}" && -d "${HOOK_CWD}" ]]; then
    cd "${HOOK_CWD}" 2>/dev/null || exit 0
fi

# ── Delfråga 1: är kommandot en git-skrivning? ────────────────────────────
#
# Ett kommando kan bära FLERA git-anrop (`git merge && git status`), så varje
# segment prövas för sig — annars hade bara det sista undersökts, och en
# skrivning följd av en läsning hade sluppit igenom.
#
# Globala flaggor som står FÖRE underkommandot och själva bär ett värde
# (`-C <path>`, `-c <k=v>`, `--git-dir <path>` …) hoppas över med sitt
# värde; annars skulle `git -C foo merge` läsas som underkommandot "-C".

_prova_segment() {
    local seg="$1" sub="" wsub=""
    # shellcheck disable=SC2086
    set -- ${seg}
    # Täcker `git`, `/usr/bin/git` och `sudo git` (sudo hoppas över nedan).
    [[ "${1:-}" = "sudo" ]] && shift
    case "${1:-}" in
        git|*/git) shift ;;
        *) return 1 ;;
    esac

    while [[ $# -gt 0 ]]; do
        case "$1" in
            -C|-c) shift 2 2>/dev/null || return 1 ;;
            --git-dir|--work-tree|--namespace|--exec-path) shift 2 2>/dev/null || return 1 ;;
            --*=*) shift ;;
            -*) shift ;;
            *) sub="$1"; break ;;
        esac
    done
    [[ -n "${sub}" ]] || return 1

    # `git worktree list` är en läsning; add/remove/… är skrivningar.
    if [[ "${sub}" = "worktree" ]]; then
        wsub="${2:-}"
        for w in "${KATALOG_WORKTREE_SKRIVKOMMANDON[@]:-}"; do
            [[ "${wsub}" = "${w}" ]] && { GIT_SUBKOMMANDO="worktree ${wsub}"; return 0; }
        done
        return 1
    fi

    for k in "${KATALOG_GIT_SKRIVKOMMANDON[@]}"; do
        if [[ "${sub}" = "${k}" ]]; then
            GIT_SUBKOMMANDO="${sub}"
            return 0
        fi
    done
    return 1
}

ar_git_skrivning() {
    local cmd="$1" segment
    # Dela på shell-separatorer (; | & och radbrytning). `&&` och `||` blir
    # två newlines med en tom rad emellan, som hoppas över.
    # `printf '%s\n'` — den avslutande radbrytningen är INTE kosmetisk: utan
    # den returnerar `read` icke-noll på sista raden och while-loopen hoppar
    # över den. Med ett endradskommando (normalfallet) betyder det att INGET
    # prövas och hooken släpper allt. Fångat av testsviten 2026-08-04.
    local segmenterade
    # `tr`:s returvärde är ointressant här och maskeras medvetet i en
    # kommandosubstitution (SC2312) — därför fångas det i en variabel först,
    # så loopen nedan matar från en här-sträng i stället.
    #
    # SC2020 varnar för duplicerade tecken i tr:s ersättningsset. Här är det
    # avsikten: tre separator-TECKEN ska var för sig bli en radbrytning. Det
    # är teckenvis ersättning, inte ordvis — precis vad tr gör.
    # shellcheck disable=SC2020
    segmenterade="$(printf '%s\n' "${cmd}" | tr ';|&' '\n\n\n')" || return 1
    while IFS= read -r segment; do
        [[ -n "${segment//[[:space:]]/}" ]] || continue
        _prova_segment "${segment}" && return 0
    done <<< "${segmenterade}"
    return 1
}

GIT_SUBKOMMANDO=""
ar_git_skrivning "${COMMAND}" || exit 0

# ── Delfråga 2: riktas den mot huvudkatalogen? ────────────────────────────
COMMON_DIR="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" || exit 0
GIT_DIR="$(git rev-parse --path-format=absolute --git-dir 2>/dev/null)" || exit 0
[[ -n "${COMMON_DIR}" && -n "${GIT_DIR}" ]] || exit 0

HUVUDKATALOG="${COMMON_DIR%/.git}"
[[ -n "${HUVUDKATALOG}" && "${HUVUDKATALOG}" != "${COMMON_DIR}" ]] || exit 0

# Alternativa skrivformer av samma katalog. macOS symlinkar /var -> /private/var
# och /tmp -> /private/tmp, så `git rev-parse` kan svara `/private/tmp/...`
# medan kommandot och `cwd` bär `/tmp/...` — en ren strängjämförelse missar då.
# Det är inte hypotetiskt: detta repo har worktrees under /private/tmp/claude-501/.
HUVUD_FORMER=("${HUVUDKATALOG}")
[[ "${HUVUDKATALOG}" == /private/* ]] && HUVUD_FORMER+=("${HUVUDKATALOG#/private}")
if command -v realpath >/dev/null 2>&1; then
    HUVUD_REAL="$(realpath "${HUVUDKATALOG}" 2>/dev/null)"
    [[ -n "${HUVUD_REAL}" && "${HUVUD_REAL}" != "${HUVUDKATALOG}" ]] && HUVUD_FORMER+=("${HUVUD_REAL}")
fi

TRAFFVAG=""
# Väg 1 (exakt): sessionens cwd ÄR huvudkatalogen.
if [[ "${GIT_DIR}" = "${COMMON_DIR}" ]]; then
    TRAFFVAG="arbetskatalogen är huvudkatalogen"
else
    # Väg 2+3 (approximativ, se § SCOPE-GRÄNSER): kommandot pekar dit explicit.
    for form in "${HUVUD_FORMER[@]}"; do
        if [[ "${COMMAND}" == *"${form}"* ]]; then
            TRAFFVAG="kommandot pekar explicit på huvudkatalogen"
            break
        fi
    done
    [[ -n "${TRAFFVAG}" ]] || exit 0
fi

# ── Delfråga 3: äger denna session huvudkatalogen? ────────────────────────
MARKOR="${COMMON_DIR}/${KATALOG_MARKOR_FILNAMN:-katalogagarskap-agare.json}"

# Ingen lapp = ingen deklarerad ägare = ingen konflikt att skydda mot.
[[ -f "${MARKOR}" ]] || exit 0

AGARE="$(jq -r '.session_id // empty' "${MARKOR}" 2>/dev/null)"
[[ -n "${AGARE}" ]] || exit 0

# Egen katalog → släpp. Detta är normalfallet för sessionen som äger den.
[[ "${AGARE}" != "${SESSION_ID}" ]] || exit 0

AGARE_ISO="$(jq -r '.satt_vid // "okänt"' "${MARKOR}" 2>/dev/null)"
AGARE_EPOCH="$(jq -r '.satt_vid_epoch // 0' "${MARKOR}" 2>/dev/null)"
NU_EPOCH="$(date +%s 2>/dev/null || echo 0)"
STALE_GRANS="${KATALOG_STALE_TIMMAR:-12}"

STALE_NOT=""
if (( AGARE_EPOCH > 0 && NU_EPOCH > 0 )); then
    ALDER_TIMMAR=$(( (NU_EPOCH - AGARE_EPOCH) / 3600 ))
    if (( ALDER_TIMMAR >= STALE_GRANS )); then
        STALE_NOT=" Lappen är ${ALDER_TIMMAR} timmar gammal, över stale-tröskeln ${STALE_GRANS} h — sannolikt en session som dog utan att städa. Är den död: rm ${MARKOR}"
    fi
fi

fraga "KATALOGÄGARSKAP (ADR-090 beslut 2): kommandot är en git-skrivning (${GIT_SUBKOMMANDO}) mot huvudkatalogen ${HUVUDKATALOG} — ${TRAFFVAG} — men huvudkatalogen ägs av en ANNAN session enligt ägarlappen (satt ${AGARE_ISO}). Regeln: den först startade sessionen behåller huvudträdet, den senare arbetar i en worktree. S96 Del 8 bröt detta tre gånger i ett pass.${STALE_NOT}"
