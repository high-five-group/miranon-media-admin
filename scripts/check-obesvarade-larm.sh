#!/usr/bin/env bash
# scripts/check-obesvarade-larm.sh — SANNINGS-avstämning, natt-lagret.
#
# VAD DEN PRÖVAR: att larm-ärenden som en automatisk kedja SKAPAT faktiskt
#   blir besvarade. Påståendet som prövas är implicit och står i post-merge.yml
#   själv: att ett tilldelat ärende med revert-förslag ÄR åtgärdsvägen.
#   Verkligheten är hur länge de ärendena faktiskt ligger öppna.
#
# VARFÖR DEN BEHÖVS — hålet är mätt, inte befarat:
#   post-merge.yml skapar vid rött ett tilldelat ärende (etikett
#   `ci-post-merge`) med revert-förslag, och är MEDVETET aldrig en required
#   check — "hela poängen med det här lagret är att stå utanför den". Det är
#   rätt design. Men INGENTING pollar de ärendena: heartbeat-svepet bevakar
#   main-SHA, röda check-rollups, DIRTY-mängd och armerings-kandidater, alltså
#   PR-landningsläge — inte skapade ärenden på redan mergade träd.
#
#   Mätt mot GitHub 2026-08-04 över samtliga sex ci-post-merge-ärenden som
#   någonsin skapats: #616/#619 öppnades 2026-08-02 för en äkta regression;
#   fixen landade ~18 h senare; ärendena stod öppna ytterligare ~23,5 h EFTER
#   fixen och stängdes först tillsammans med det orelaterade #656 — tre
#   ärenden, olika orsaker, olika skapelsetider, stängda INOM 18 SEKUNDER av
#   varandra. Det är retrospektiv batch-sanering, inte en reaktion på larmet.
#
#   T108-klassen: en signal som skapas men saknar bevakare. Samma familj som
#   det obevakade tillstånd ADR-087 löste för agenters avslutspåståenden.
#
# ═══ VARFÖR I NATTEN OCH INTE I HEARTBEAT-SVEPET ═══
#
#   Svepet är en process en agent startar INUTI sin session. Forskningsdoket
#   kallar den formen (b1) och förkastar den för just denna felklass: "En
#   /loop-variant bor inuti aktören. När aktören slutar arbeta slutar loopen
#   också — och felet vi vill fånga är exakt 'aktören slutade'. Detektorn dör i
#   samma ögonblick den behövs." Lager 2 måste vara oberoende av den övervakade
#   aktören. Att ÄVEN ge svepet en femte väg är rimligt senare — det
#   kompletterar natt-lagret, ersätter det inte.
#
# ═══ EXIT-KODERNA ═══
#   exit 0 = grönt. Inga larm-ärenden bortom sin tröskel.
#   exit 1 = DRIFT. Ett larm har stått obesvarat. Åtgärda ÄRENDET.
#   exit 2 = ANROPSFEL. Grinden kunde inte fråga GitHub. Åtgärda GRINDEN —
#            ärendena är OPRÖVADE. Får aldrig kollapsas ihop med exit 1.
#
# ═══ FAIL-CLOSED PÅ TOM MÄNGD ═══
#   Ett `gh`-anrop som misslyckas ger tom utdata, och en naiv räkning hade läst
#   tomheten som "inga öppna ärenden" = grönt. Det är EXAKT den fail-open som
#   fällde en CI-vakt vid S97:s paus-landning ("ALLA KLARA" ur en tom lista)
#   och som check-backlog-closure.sh en gång hade i sitt 0-AC-fall. Grinden
#   skiljer därför "svarade tomt" (giltigt) från "svarade inte" (exit 2) på
#   anropets EGEN exitkod, aldrig på utdatans längd. Branschen gör likadant:
#   pytest exit 5 på noll insamlade tester, Jest och Playwright faller default
#   på tom mängd.
#
# ANVÄNDNING:
#   bash scripts/check-obesvarade-larm.sh
#   LARM_POLICY=<fil> bash scripts/...        # egen policy (testrigg)
#   LARM_FAKE_JSON=<fil> bash scripts/...     # testrigg: läs ärenden ur fil
#                                              # i stället för att fråga GitHub
#
# Testsvit: scripts/test-check-obesvarade-larm.sh (tvåsidigt bevis).
#
# Källa: T119 arbetslista (b) · .github/workflows/post-merge.yml § larm ·
#        docs/research/obevakade-tillstand-vaktens-form-2026-07-30.md (T108) ·
#        docs/research/processregler-mekanisering-branschpraxis-2026-08-04.md
# Etablerad: S97, 2026-08-04

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROT="${REPO_ROT:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
LARM_POLICY="${LARM_POLICY:-${REPO_ROT}/.sanningsavstamning-policy.conf}"
# shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/jq-guard.sh lintas separat via ci.yml:s shellcheck-lista
source "${SCRIPT_DIR}/lib/jq-guard.sh"
# shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/gh-guard.sh lintas separat via ci.yml:s shellcheck-lista
source "${SCRIPT_DIR}/lib/gh-guard.sh"

anropsfel() {
    printf '::error::check-obesvarade-larm: ANROPSFEL — %s\n' "$1" >&2
    printf '   Ärendena är OPRÖVADE. Åtgärda grinden, inte ärendena.\n' >&2
    exit 2
}

jq_version_ok || anropsfel "jq saknas eller är för gammal i PATH (TASK-312, .jq-version-policy.conf)."
[[ -f "${LARM_POLICY}" ]] || anropsfel "policyfilen ${LARM_POLICY} saknas."

LARM_ARENDE_TROSKLAR=()
LARM_ARENDE_REPO=""
# shellcheck source=/dev/null
source "${LARM_POLICY}" || anropsfel "policyfilen ${LARM_POLICY} gick inte att läsa."

[[ "${#LARM_ARENDE_TROSKLAR[@]}" -gt 0 ]] || anropsfel "policyn definierar noll etikett-trösklar — ett tomt regelverk är inte 'inget att bevaka', det är en trasig grind."

NU_EPOCH="$(date +%s 2>/dev/null)" || anropsfel "date +%s svarade inte."

# hamta_arenden <etikett> — skriver JSON-array på stdout, returnerar icke-noll
# om ANROPET failade. Tom array är ett GILTIGT svar; ett misslyckat anrop är
# det inte. Skillnaden bärs av exitkoden, aldrig av utdatans längd.
hamta_arenden() {
    local etikett="$1"
    if [[ -n "${LARM_FAKE_JSON:-}" ]]; then
        [[ -f "${LARM_FAKE_JSON}" ]] || return 1
        jq -c --arg e "${etikett}" '[.[] | select(.labels // [] | index($e))]' \
            "${LARM_FAKE_JSON}" 2>/dev/null || return 1
        return 0
    fi
    gh_version_ok >/dev/null 2>&1 || return 1
    # Ingen tom array här: under `set -u` är "${arr[@]}" på en TOM array en
    # unbound variable i bash 3.2 (macOS systembash), vilket fällde den skarpa
    # körningen 2026-08-04. Fail-closed-designen höll — felet gav ANROPSFEL,
    # aldrig grönt — men grenarna skrivs ut i sin helhet i stället, så
    # konstruktionen inte kan gå sönder på samma sätt igen.
    if [[ -n "${LARM_ARENDE_REPO}" ]]; then
        gh issue list --repo "${LARM_ARENDE_REPO}" --label "${etikett}" --state open \
            --limit 100 --json number,title,createdAt 2>/dev/null || return 1
    else
        gh issue list --label "${etikett}" --state open \
            --limit 100 --json number,title,createdAt 2>/dev/null || return 1
    fi
}

FYND=0
PROVADE_ETIKETTER=0

for post in "${LARM_ARENDE_TROSKLAR[@]}"; do
    ETIKETT="${post%%:*}"
    TROSKEL="${post##*:}"
    if [[ -z "${ETIKETT}" || -z "${TROSKEL}" || ! "${TROSKEL}" =~ ^[0-9]+$ ]]; then
        anropsfel "ogiltig tröskel-post '${post}' — förväntat format <etikett>:<timmar>."
    fi

    JSON=""
    if ! JSON="$(hamta_arenden "${ETIKETT}")"; then
        anropsfel "kunde inte hämta ärenden för etiketten '${ETIKETT}'. Ett obesvarat instrument är farligare tystnat än fällt (L322) — detta rapporteras som anropsfel, aldrig som grönt."
    fi
    # Ett svar som inte är giltig JSON är också ett anropsfel, inte tomhet.
    printf '%s' "${JSON}" | jq -e 'type == "array"' >/dev/null 2>&1 \
        || anropsfel "svaret för etiketten '${ETIKETT}' var inte en JSON-array."

    PROVADE_ETIKETTER=$(( PROVADE_ETIKETTER + 1 ))

    # jq-utfallet fångas i en variabel först — en kommandosubstitution i en
    # process-substitution maskerar jq:s returvärde (SC2312), och ett tyst
    # jq-fel hade blivit noll rader = grönt, vilket är precis fail-open.
    RADER="$(printf '%s' "${JSON}" | jq -r '.[] | [(.number|tostring), .createdAt, .title] | @tsv')" \
        || anropsfel "jq kunde inte tolka ärendelistan för etiketten '${ETIKETT}'."
    while IFS=$'\t' read -r nummer skapad titel; do
        [[ -n "${nummer}" ]] || continue
        SKAPAD_EPOCH="$(date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "${skapad}" +%s 2>/dev/null \
            || date -u -d "${skapad}" +%s 2>/dev/null)"
        if [[ -z "${SKAPAD_EPOCH}" ]]; then
            anropsfel "kunde inte tolka tidsstämpeln '${skapad}' för ärende #${nummer}."
        fi
        ALDER_H=$(( (NU_EPOCH - SKAPAD_EPOCH) / 3600 ))
        if (( ALDER_H >= TROSKEL )); then
            FYND=$(( FYND + 1 ))
            printf '::error::Larm-ärendet #%s (etikett %s) har stått öppet i %d h — tröskeln är %d h.\n' \
                "${nummer}" "${ETIKETT}" "${ALDER_H}" "${TROSKEL}"
            printf '   Skapat: %s\n' "${skapad}"
            printf '   Titel:  %s\n' "${titel}"
            printf '   Detta är T108-klassen: en signal som skapades men saknar bevakare.\n'
            printf '   Åtgärd: åtgärda eller stäng ärendet med motivering — larm som ligger\n'
            printf '           kvar devalverar kanalen för nästa verkliga fynd.\n'
        fi
    done <<< "${RADER}"
done

if [[ "${FYND}" -gt 0 ]]; then
    printf '\n❌ %d obesvarat/obesvarade larm-ärende(n) bortom sin tröskel (%d etikett(er) prövade).\n' \
        "${FYND}" "${PROVADE_ETIKETTER}"
    exit 1
fi

printf '✅ obesvarade larm OK — %d etikett(er) prövade, inga ärenden bortom sin tröskel.\n' "${PROVADE_ETIKETTER}"
exit 0
