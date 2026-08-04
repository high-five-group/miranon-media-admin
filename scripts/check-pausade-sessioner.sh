#!/usr/bin/env bash
# scripts/check-pausade-sessioner.sh — SANNINGS-avstämning, natt-lagret.
#
# VAD DEN PRÖVAR: att ett sessionsdok som PÅSTÅR paus faktiskt är pausat.
#   Påståendet är `lifecycle: paused` i frontmatter. Verkligheten är
#   git-historiken: landade `[S<N>]`-taggade commits som rör annat än
#   sessionens egen paus-svans.
#
# VARFÖR DEN BEHÖVS — den faktiska felbilden, inte en hypotetisk:
#   S96 Del 8 (2026-08-03/04): "session-resume steg 6 (tillstånds-
#   återställningen) utfördes ALDRIG vid återupptagningen. Sessionen stod
#   lifecycle: paused medan tre PR:er landade i den." En oberoende git-räkning
#   ger FEM [S96]-taggade PR-merger i paus-fönstret. Och: "check-lifecycle.sh
#   var grön hela tiden — den prövar KONSISTENS mellan fältet och rubriken
#   ... Den kan inte se att sessionen faktiskt arbetar." Felet fångades av
#   Marcus, inte av någon mekanism.
#
#   Detta är tre-lagers-doktrinens lager 2 (research-doket
#   processregler-mekanisering-branschpraxis-2026-08-04.md): en periodisk
#   avstämning som prövar SANNING mot verkligt tillstånd, oberoende av om
#   lager 1 kringgicks eller aldrig kunde se problemet. Gatekeepers
#   admission/audit-par är samma form.
#
# ═══ SKILJELINJEN — MÄTT, INTE ANTAGEN ═══
#
#   Första utkastet fällde ALLA TRE pausade dok i repot. Samtliga tre var
#   FALSKA POSITIVA, och systematiskt så: träffen var merge-commiten för
#   själva paus-PR:en, som per konstruktion kommer efter den dok-commit den
#   innehåller. Därav --no-merges.
#
#   Andra utkastet ville använda en tidskarens. Den mätningen FÖLL också:
#     - S92:s legitima paus-svans kom +16 h efter paus-commiten.
#     - S96:s fem VERKLIGA arbets-PR:er kom 10-14 h efter paus-commiten.
#   En 24-timmarskarens hade tystat bruset OCH missat felet. Tid är fel axel.
#
#   Vad som skiljer rent är VAD commiten rör:
#     - S92:s svans rörde enbart tasks/todo.md.
#     - S96:s arbete rörde src/components/dev/PrototypeSwitcher.tsx,
#       tasks/threads/README.md, backlog/tasks/* och docs/specs/URL-STATE-SPEC.md.
#   Invarianten: en pausad session får röra sitt EGET dok och den delade
#   kadensytan (tasks/todo.md). Rör den något annat är det arbete, och arbete
#   motsäger pausen. Mängden är config-driven i .sanningsavstamning-policy.conf.
#
# ═══ EXIT-KODERNA BÄR TVÅ OLIKA BUDSKAP ═══
#
#   Samma separation som scripts/check-backlog-closure.sh, och av samma skäl:
#     exit 0 = grönt, inga motsägelser.
#     exit 1 = DRIFT. Ett dok påstår paus medan arbete landat. Åtgärda
#              DOKUMENTET (kör session-resume steg 6, eller stäng sessionen).
#     exit 2 = ANROPSFEL. Grinden kunde inte mäta (ingen policyfil, ingen
#              git-historik, oläsbart dok). Åtgärda GRINDEN — dokumenten är
#              OPRÖVADE. Får ALDRIG kollapsas ihop med exit 1: ett trasigt
#              anrop som rapporteras som drift skickar läsaren att jaga ett
#              problem ingen prövat.
#
# ═══ FAIL-CLOSED PÅ EGEN MÄTFÖRMÅGA ═══
#
#   Grinden vägrar köra på en shallow checkout. `git log <sha>..HEAD` blir tyst
#   ofullständig utan full historik, och grinden skulle rapportera GRÖNT ur en
#   mätning som aldrig kunde mäta. Det är samma fail-open-familj som fällde en
#   CI-vakt vid S97:s paus-landning ("ALLA KLARA" beräknat ur en tom lista) och
#   som check-thread-index.sh uttryckligen avstod färskhets-prövning för att
#   undvika: "En grind vars utfall beror på klon-djup är en falsk-röd-fabrik."
#   Här är svaret inte att avstå utan att KRÄVA djupet och exit 2 utan det.
#   Detta är motsatt val mot deny-frammande-huvudkatalog.sh (fail-open) — där
#   är skadan en blockerad legitim operation; här är skadan ett falskt grönt,
#   vilket är den värre av de två ("ett mätinstrument som går sönder ljudlöst
#   är värre än inget").
#
# ANVÄNDNING:
#   bash scripts/check-pausade-sessioner.sh            # prövar repots dok
#   PAUS_POLICY=<fil> bash scripts/...                 # egen policy (testrigg)
#
# Testsvit: scripts/test-check-pausade-sessioner.sh (tvåsidigt bevis, inkl. en
#   rigg som återskapar S96-felet och en som återskapar S92:s legitima svans).
#
# Källa: T119 arbetslista (b) · S96 Del 8 · ADR-051/ADR-052 (lifecycle-fältets
#        semantik) · docs/research/processregler-mekanisering-branschpraxis-2026-08-04.md
#        · scripts/check-backlog-closure.sh (exit-kod-mönstret)
# Etablerad: S97, 2026-08-04

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROT="${REPO_ROT:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
PAUS_POLICY="${PAUS_POLICY:-${REPO_ROT}/.sanningsavstamning-policy.conf}"

anropsfel() {
    printf '::error::check-pausade-sessioner: ANROPSFEL — %s\n' "$1" >&2
    printf '   Dokumenten är OPRÖVADE. Åtgärda grinden, inte dokumenten.\n' >&2
    exit 2
}

command -v git >/dev/null 2>&1 || anropsfel "git saknas i PATH."
[[ -f "${PAUS_POLICY}" ]] || anropsfel "policyfilen ${PAUS_POLICY} saknas."

PAUS_SVANS_TILLATNA=()
PAUS_KARENS_TIMMAR=""
PAUS_SESSIONSDOK_GLOB=""
PAUS_KRAV_FULL_HISTORIK=""
# shellcheck source=/dev/null
source "${PAUS_POLICY}" || anropsfel "policyfilen ${PAUS_POLICY} gick inte att läsa."

[[ "${#PAUS_SVANS_TILLATNA[@]}" -gt 0 ]] || anropsfel "policyn definierar noll tillåtna paus-svans-mönster — ett tomt regelverk är inte 'allt tillåtet', det är en trasig grind."
[[ -n "${PAUS_SESSIONSDOK_GLOB}" ]] || anropsfel "policyn saknar PAUS_SESSIONSDOK_GLOB."

cd "${REPO_ROT}" || anropsfel "kunde inte gå till repo-roten ${REPO_ROT}."

git rev-parse --git-dir >/dev/null 2>&1 || anropsfel "${REPO_ROT} är inget git-repo."

# FAIL-CLOSED på mätförmågan — se § FAIL-CLOSED i huvudet.
#
# Kravet prövas PER DOK längre ner, inte som ett globalt shallow-förbud.
# Skälet är mätt: detta repo rapporterar `is-shallow-repository: true` men
# bär 2866 commits tillbaka till init-commiten — ett globalt förbud hade
# fällt ett träd som i praktiken har all historik grinden behöver, vilket är
# samma falsk-röd-fabrik grinden finns för att undvika.
#
# Det korrekta kriteriet är NÅBARHET: är paus-commiten en förfader till HEAD
# är `git log <paus>..HEAD` komplett, eftersom shallow trunkerar från roten
# och aldrig i mitten av en kedja. Är den INTE nåbar kan det dokets mätning
# inte göras, och då är exit 2 rätt svar — inte ett grönt.

NU_EPOCH="$(date +%s 2>/dev/null)" || anropsfel "date +%s svarade inte."
KARENS_SEK=$(( ${PAUS_KARENS_TIMMAR:-0} * 3600 ))

FYND=0
PROVADE=0

# Expandera globen utan att `nullglob` läcker till anropande skal.
shopt -s nullglob
# shellcheck disable=SC2206
DOK=(${PAUS_SESSIONSDOK_GLOB})
shopt -u nullglob

[[ "${#DOK[@]}" -gt 0 ]] || anropsfel "globen ${PAUS_SESSIONSDOK_GLOB} matchade noll filer — fel arbetskatalog, eller ett tomt register som inte kan prövas."

for fil in "${DOK[@]}"; do
    [[ -f "${fil}" ]] || continue

    LIFECYCLE="$(grep -m1 '^lifecycle:' "${fil}" 2>/dev/null | awk '{print $2}')"
    [[ "${LIFECYCLE}" == "paused" ]] || continue

    # Sessionsnumret bär taggen. Filnamnet är den auktoritativa källan
    # (tasks/sessions/<datum>-session-<N>.md); rubriken kan bära andra tal.
    N="$(basename "${fil}" | grep -oE 'session-[0-9]+' | grep -oE '[0-9]+$')"
    if [[ -z "${N}" ]]; then
        anropsfel "kunde inte utläsa sessionsnummer ur filnamnet ${fil}."
    fi

    PROVADE=$(( PROVADE + 1 ))

    # Paus-punkten: senaste commit som rörde själva dokumentet.
    PAUS_SHA="$(git log -1 --format='%H' -- "${fil}" 2>/dev/null)"
    if [[ -z "${PAUS_SHA}" ]]; then
        # Ett dok som aldrig committats kan inte prövas mot historik.
        printf '::warning::%s står lifecycle: paused men har ingen commit-historik — hoppas över (oprövad).\n' "${fil}"
        continue
    fi

    # NÅBARHETS-KRAVET (fail-closed, se § FAIL-CLOSED). Är paus-commiten inte
    # en förfader till HEAD är historiken avklippt före den, och `git log
    # <paus>..HEAD` skulle svara tomt — ett grönt ur en omöjlig mätning.
    if [[ "${PAUS_KRAV_FULL_HISTORIK:-1}" == "1" ]]; then
        if ! git merge-base --is-ancestor "${PAUS_SHA}" HEAD 2>/dev/null; then
            anropsfel "paus-commiten ${PAUS_SHA:0:8} för ${fil} är inte nåbar från HEAD — historiken är avklippt före den. Kör med större fetch-depth (0 = full)."
        fi
    fi

    # --no-merges: paus-PR:ens EGEN merge-commit kommer per konstruktion efter
    # den dok-commit den innehåller, och skulle annars fälla varje korrekt
    # paus-landning. Mätt på S93 och S96, 2026-08-04.
    EFTER="$(git log "${PAUS_SHA}..HEAD" --no-merges --grep="\[S${N}\]" --format='%H %ct' 2>/dev/null)"
    [[ -n "${EFTER}" ]] || continue

    while read -r sha ct; do
        [[ -n "${sha}" ]] || continue
        # Karens mot en landning som pågår just nu.
        if (( KARENS_SEK > 0 && NU_EPOCH - ct < KARENS_SEK )); then
            continue
        fi

        ANDRADE="$(git show --stat=200 --name-only --format='' "${sha}" 2>/dev/null | grep -v '^$')"
        [[ -n "${ANDRADE}" ]] || continue

        OTILLATNA=""
        while IFS= read -r andrad_fil; do
            [[ -n "${andrad_fil}" ]] || continue
            tillaten=0
            for monster in "${PAUS_SVANS_TILLATNA[@]}"; do
                # shellcheck disable=SC2059
                utvidgat="$(printf "${monster}" "${fil}" 2>/dev/null)" || utvidgat="${monster}"
                # shellcheck disable=SC2053
                if [[ "${andrad_fil}" == ${utvidgat} ]]; then
                    tillaten=1
                    break
                fi
            done
            if [[ "${tillaten}" -eq 0 ]]; then
                OTILLATNA="${OTILLATNA}${andrad_fil}"$'\n'
            fi
        done <<< "${ANDRADE}"

        if [[ -n "${OTILLATNA}" ]]; then
            FYND=$(( FYND + 1 ))
            # Ämne och datum hämtas i egna steg — en kommandosubstitution
            # inuti printf maskerar git:s returvärde (SC2312).
            AMNE="$(git log -1 --format='%s' "${sha}" 2>/dev/null)" || AMNE="(okänt ämne)"
            LANDAD="$(git log -1 --format='%ai' "${sha}" 2>/dev/null)" || LANDAD="(okänt datum)"
            printf '::error::%s påstår lifecycle: paused, men [S%s]-taggat ARBETE har landat efter pausen.\n' "${fil}" "${N}"
            printf '   Commit:  %s  %s\n' "${sha:0:8}" "${AMNE}"
            printf '   Landad:  %s\n' "${LANDAD}"
            printf '   Rör utanför paus-svansen:\n'
            printf '%s' "${OTILLATNA}" | sed 's/^/     - /'
            printf '   Detta är S96 Del 8-klassen: dokumentet säger paus, historiken säger arbete.\n'
            printf '   Åtgärd: kör session-resume steg 6 (lifecycle: paused → active + paus-rubrik\n'
            printf '           till historik-form), eller stäng sessionen om arbetet är klart.\n'
        fi
    done <<< "${EFTER}"
done

if [[ "${FYND}" -gt 0 ]]; then
    printf '\n❌ %d motsägelse(r) mellan påstådd paus och landat arbete (av %d prövade pausade dok).\n' "${FYND}" "${PROVADE}"
    exit 1
fi

printf '✅ sannings-avstämning OK — %d pausat/pausade dok prövade mot git-historiken, inga motsägelser.\n' "${PROVADE}"
exit 0
