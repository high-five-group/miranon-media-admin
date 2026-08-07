#!/usr/bin/env bash
# scripts/arkivera-sessionsdok.sh — rullande fönster för tasks/sessions/-roten
# (TASK-158.2, ADR-099).
#
# PROBLEMET: ADR-099 ersätter fas-avslut-bindningen (ADR-041 beslut 6, riven
# öppet) med ett rullande fönster — roten behåller de N SENAST STÄNGDA
# sessionsdoken plus SAMTLIGA active/paused, oavsett ålder; äldre stängda dok
# hör hemma i arkivet (ADR-023: tasks/sessions/archive/<år>-<månad>/,
# FORM ORÖRD av denna ADR). Utan mekanik utlöses regeln aldrig — detta
# skript ÄR mekaniken.
#
# SÄKERHETEN — fyra oberoende skydd, ALLTID i denna ordning, inget dokument
# flyttas om NÅGOT av dem slår till:
#   1. LIFECYCLE active/paused — hårdkodat, ALDRIG konfigurerbart bort. Ett
#      pausat eller aktivt dok är per definition pågående arbete (ADR-099
#      Beslut 1).
#   2. OPARSBAR LIFECYCLE — frontmatter saknas, lifecycle-fältet saknas,
#      eller värdet är varken active/paused/closed. FAIL-CLOSED: flaggas,
#      rörs ALDRIG automatiskt. Detta är den hanteringsform TASK-158.2
#      efterfrågar för rotens tre lifecycle-lösa dok (pre-ADR-052).
#   3. OPARSBART FILNAMN — ett closed-dok vars filnamn inte matchar
#      `<ÅÅÅÅ-MM-DD>-session-<N>.md` går inte att placera i fönster-ordning
#      eller ge en arkiv-månad. FAIL-CLOSED av samma skäl som (2).
#   4. SKYDDSLISTA — glob-mönster i ARKIVERA_SESSIONSDOK_SKYDDADE
#      (.arkivera-sessionsdok-policy.conf), en extra escape-hatch utöver
#      golvet, samma mönster som STADA_GRENAR_SKYDDADE.
#
# FÖNSTRET: bland återstående closed+parsbara dok, sorterade fallande på
# SESSIONSNUMMER (extraherat ur filnamnet — robust mot 2- vs 3-siffriga
# nummer, se sessionsnummer_fran_filnamn nedan; ren strängsortering av
# filnamn FALLERAR vid t.ex. "…session-100.md" vs "…session-99.md"), behålls
# de N FÖRSTA (mest nyligen stängda) i roten. N är ett KONFIG-VÄRDE
# (ADR-099 Beslut 2) — .arkivera-sessionsdok-policy.conf, INTE hårdkodat här.
#
# LÄNKOMSKRIVNINGEN — TVÅ pass, körda EFTER samtliga flyttar i samma
# körning (AC #3: atomiskt, ingen transient bruten länk):
#   PASS A — blanket path-citat. Var och en av de citerade formerna
#     "tasks/sessions/<filnamn>" som förekommer i NÅGON git-spårad fil
#     UTANFÖR arkivet skrivs om till "tasks/sessions/archive/<månad>/
#     <filnamn>". Detta är repots etablerade konvention för prosa-citat
#     (läses som en repo-rot-relativ sökväg av läsare/agenter, oavsett
#     citerande fils egen plats — samma konvention som CLAUDE.md självt
#     använder för ADR-citat).
#   PASS B — bara relativa systerlänkar. Markdown-länksyntax
#     "](<filnamn>" UTAN sökvägsprefix förekommer ENDAST mellan syskon-dok
#     direkt i tasks/sessions/-roten (verifierat via grep 2026-08-07 — tre
#     HANDOFF-block-länkar, session-79/80/81). Sådana länkar i dok som
#     STANNAR i roten skrivs om till "](archive/<månad>/<filnamn>" (relativt
#     roten, dit den refererande filen fortfarande hör).
#
# VAD SOM MEDVETET INTE RÖRS: ett arkiverat dokuments EGET innehåll skrivs
# ALDRIG om — varken av Pass A eller Pass B, inte ens FÖR de dok som
# arkiveras i SAMMA körning. Flytten är en `git mv`, aldrig en redigering
# (ADR-023). Detta matchar arkivets egen README.md ORDAGRANT: "Arkiverade
# sessionsdok är immutabla (ADR-023) — de redigeras inte, även när paths de
# citerar flyttas; pathcitat läses som historisk relation." Om två dok som
# citerar varandra arkiveras i samma körning och hamnar i OLIKA månadsmappar
# lämnas den inbördes länken alltså AVSIKTLIGT stale — det är den
# dokumenterade, accepterade kompromissen, inte en bugg. Konsekvensen är en
# enklare och mer trogen implementation: Pass A/B behöver aldrig räkna ut
# arkiv→arkiv-relativa sökvägar, bara rot→arkiv (se ovan).
#
# TORRKÖRNING ÄR DEFAULT. Utan --utfor ändras ingenting — samma kontrakt som
# scripts/stada-grenar.sh och `git clean -n`. Torrkörningens länk-förhandsvisning
# exkluderar de arkiv-kandiderande filernas EGNA rot-sökvägar ur sökningen
# (samma pathspec som utförande-läget efter flytten skulle se), så
# förhandsvisningen matchar exakt vad --utfor faktiskt gör.
#
# IDEMPOTENT: en rot som redan ryms inom fönstret ger noll arkiv-kandidater
# → ingen flytt, ingen omskrivning, exit 0. En andra körning direkt efter en
# --utfor-körning är därför alltid ett no-op tills fler dok stänger.
#
# ANVÄNDNING
#   scripts/arkivera-sessionsdok.sh [--utfor] [--fonster <N>]
#     --utfor        utför flytt + länkomskrivning (utan flaggan: bara rapport)
#     --fonster <N>  åsidosätt policy-filens ARKIVERA_SESSIONSDOK_FONSTER
#
# Policy-fil: .arkivera-sessionsdok-policy.conf (kan pekas om med
# ARKIVERA_SESSIONSDOK_POLICY, samma testbarhets-mönster som
# STADA_GRENAR_POLICY/HEARTBEAT_SVEP_POLICY).
#
# EXIT-KODER
#   0   rapporten är komplett — oavsett hur många dok som arkiverades/
#       skulle arkiveras/flaggades/skonades
#   2   användningsfel — okänd flagga, saknat/oparsbart fönstertal, eller
#       katalogen är inte ett git-repo
#
# Testsvit: scripts/test-arkivera-sessionsdok.sh
#
# Källa: backlog/tasks/task-158.2 · docs/decisions/ADR-099-…md ·
#        scripts/stada-grenar.sh (förebild för form + policy-mönster) ·
#        tasks/sessions/archive/README.md (immutabilitets-kontraktet)
# Etablerad: TASK-158.2, 2026-08-07
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARKIVERA_SESSIONSDOK_POLICY="${ARKIVERA_SESSIONSDOK_POLICY:-${SCRIPT_DIR}/../.arkivera-sessionsdok-policy.conf}"

UTFOR=0
FONSTER_FLAGGA=""

# Fail-open default för skyddslistan INNAN source (samma idiom som
# STADA_GRENAR_SKYDDADE i stada-grenar.sh): en policy-fil utan
# ARKIVERA_SESSIONSDOK_SKYDDADE lämnar skyddslistan tom i stället för att
# krascha under `set -u`.
ARKIVERA_SESSIONSDOK_SKYDDADE=()
ARKIVERA_SESSIONSDOK_FONSTER=""

if [[ -f "${ARKIVERA_SESSIONSDOK_POLICY}" ]]; then
  # shellcheck source=/dev/null
  source "${ARKIVERA_SESSIONSDOK_POLICY}"
fi

anvandning() {
  cat <<'HJALP'
Användning: arkivera-sessionsdok.sh [--utfor] [--fonster <N>]

  --utfor        Utför flytten + länkomskrivningen. Utan flaggan är
                 körningen en torrkörning som inte ändrar någonting.
  --fonster <N>  Åsidosätt policy-filens ARKIVERA_SESSIONSDOK_FONSTER.
HJALP
}

while [[ $# -gt 0 ]]; do
  case "${1}" in
    --utfor) UTFOR=1; shift ;;
    --fonster)
      if [[ $# -lt 2 ]]; then
        echo "FEL: --fonster kräver ett tal" >&2
        exit 2
      fi
      FONSTER_FLAGGA="${2}"; shift 2 ;;
    -h|--help|--hjalp) anvandning; exit 0 ;;
    *) echo "FEL: okänd flagga '${1}'" >&2; anvandning >&2; exit 2 ;;
  esac
done

if [[ -n "${FONSTER_FLAGGA}" ]]; then
  ARKIVERA_SESSIONSDOK_FONSTER="${FONSTER_FLAGGA}"
fi

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "FEL: inte ett git-repo — kör från repot vars sessionsdok ska arkiveras" >&2
  exit 2
fi

if [[ -z "${ARKIVERA_SESSIONSDOK_FONSTER}" ]]; then
  echo "FEL: fönstertalet är osatt — sätt ARKIVERA_SESSIONSDOK_FONSTER i" >&2
  echo "     ${ARKIVERA_SESSIONSDOK_POLICY} eller ange --fonster <N>" >&2
  exit 2
fi

if ! [[ "${ARKIVERA_SESSIONSDOK_FONSTER}" =~ ^[0-9]+$ ]]; then
  echo "FEL: fönstertalet måste vara ett icke-negativt heltal, fick '${ARKIVERA_SESSIONSDOK_FONSTER}'" >&2
  exit 2
fi
FONSTER="${ARKIVERA_SESSIONSDOK_FONSTER}"

TOPPNIVA="$(git rev-parse --show-toplevel)"
SESSIONS_ROT="${TOPPNIVA}/tasks/sessions"
ARKIV_ROT="${SESSIONS_ROT}/archive"

if [[ ! -d "${SESSIONS_ROT}" ]]; then
  echo "FEL: hittar inte ${SESSIONS_ROT}" >&2
  exit 2
fi

# ── Skyddslista (golv 4) ─────────────────────────────────────────────────────
ar_skyddslistad() {
  local kandidat="${1}" monster
  for monster in "${ARKIVERA_SESSIONSDOK_SKYDDADE[@]:-}"; do
    [[ -n "${monster}" ]] || continue
    # shellcheck disable=SC2254
    # AVSIKTLIGT: högerledet ska glob-expandera mot kandidaten, samma
    # disciplin som stada-grenar.shs ar_skyddslistad().
    case "${kandidat}" in
      ${monster}) return 0 ;;
      *) : ;;
    esac
  done
  return 1
}

# ── Frontmatter-lifecycle ────────────────────────────────────────────────────
# Läser ENDAST det första YAML-frontmatter-blocket (mellan rad 1 "---" och
# nästa "---"). En fil som inte INLEDS med "---" ger tomt (fail-closed) —
# samma princip som L91/L97-felklassen (frontmatter-fält bevisas ur
# STRUKTUR, inte ur prosa som råkar innehålla ordet "lifecycle:", vilket
# premiss-passet (2026-08-07) visade förekommer i minst fyra rotdoks BRÖD-
# text).
lifecycle_for() {
  local fil="${1}"
  awk '
    NR==1 && $0=="---" { in_fm=1; next }
    in_fm && $0=="---" { exit }
    in_fm && /^lifecycle:[[:space:]]*/ {
      sub(/^lifecycle:[[:space:]]*/, "")
      gsub(/\r$/, "")
      print
      exit
    }
  ' "${fil}"
}

# ── Filnamn → (datum, sessionsnummer) ────────────────────────────────────────
# Sätter FN_DATUM/FN_SESSIONSNUMMER vid träff, returnerar 1 (ingen exit,
# ingen krasch under set -e hos anroparen — anroparen kollar returvärdet)
# om filnamnet inte matchar den förväntade formen. Extraherar
# SESSIONSNUMMER separat från datumet så sorteringen är NUMERISK — ren
# strängsortering av hela filnamnet fallerar vid tresiffriga nummer (t.ex.
# "…session-100.md" sorterar FÖRE "…session-99.md" lexikografiskt: '1' <
# '9') vilket denna repo redan producerat (session 99 och 100, båda
# 2026-08-07).
FN_DATUM=""
FN_SESSIONSNUMMER=""
sessionsnummer_fran_filnamn() {
  local filnamn="${1}"
  FN_DATUM=""
  FN_SESSIONSNUMMER=""
  if [[ "${filnamn}" =~ ^([0-9]{4}-[0-9]{2}-[0-9]{2})-session-([0-9]+)\.md$ ]]; then
    FN_DATUM="${BASH_REMATCH[1]}"
    FN_SESSIONSNUMMER="${BASH_REMATCH[2]}"
    return 0
  fi
  return 1
}

# ── Klassificering ────────────────────────────────────────────────────────────
KVAR_RADER=()       # rapportrader för dok som stannar (active/paused/inom fönstret/skyddslistat)
FLAGGAD_RADER=()    # rapportrader för fail-closed-dok
ARKIV_SESSIONSNR=() # sessionsnummer, parallellt index med ARKIV_FILNAMN/ARKIV_DATUM
ARKIV_FILNAMN=()
ARKIV_DATUM=()

# Temp-array för closed+parsbara kandidater, "sessionsnummer|filnamn|datum".
STANGD_KANDIDAT=()

for fil in "${SESSIONS_ROT}"/*.md; do
  [[ -e "${fil}" ]] || continue
  filnamn="$(basename "${fil}")"

  lc="$(lifecycle_for "${fil}")"
  case "${lc}" in
    active|paused)
      KVAR_RADER+=("KVAR ${filnamn} — lifecycle: ${lc}")
      continue
      ;;
    closed)
      : # fortsätt nedan
      ;;
    *)
      FLAGGAD_RADER+=("FLAGGAD ${filnamn} — oparsbar lifecycle (fail-closed, rörs aldrig automatiskt)")
      continue
      ;;
  esac

  # shellcheck disable=SC2310
  # AVSIKTLIGT: ar_skyddslistad() innehåller inga kommandon som kan
  # misslyckas oväntat, samma disciplin som stada-grenar.sh.
  if ar_skyddslistad "${filnamn}"; then
    KVAR_RADER+=("KVAR ${filnamn} — skyddslistad (ARKIVERA_SESSIONSDOK_SKYDDADE)")
    continue
  fi

  # shellcheck disable=SC2310
  # AVSIKTLIGT: sessionsnummer_fran_filnamn() innehåller inga kommandon som
  # kan misslyckas oväntat (ren bash — regex-match + tilldelning + return),
  # så set -e-avstängningen SC2310 varnar för är ofarlig här. Samma
  # disciplin som ar_worktree_gren()/ar_skyddslistad() i stada-grenar.sh.
  if sessionsnummer_fran_filnamn "${filnamn}"; then
    STANGD_KANDIDAT+=("${FN_SESSIONSNUMMER}|${filnamn}|${FN_DATUM}")
  else
    FLAGGAD_RADER+=("FLAGGAD ${filnamn} — closed men filnamnet går inte att parsa till datum+sessionsnummer (fail-closed)")
  fi
done

# ── Fönster-sortering (fallande på sessionsnummer, numeriskt) ───────────────
SORTERAD=()
if [[ "${#STANGD_KANDIDAT[@]}" -gt 0 ]]; then
  # shellcheck disable=SC2312
  # AVSIKTLIGT: printf/sort itererar fixerad in-memory-data (arrayen
  # klassificerad ovan) — det finns inget yttre tillstånd som kan få
  # kommandokedjan att fela oväntat, så den maskerade returkoden SC2312
  # varnar för är ofarlig här.
  while IFS= read -r rad; do
    SORTERAD+=("${rad}")
  done < <(printf '%s\n' "${STANGD_KANDIDAT[@]}" | sort -t'|' -k1,1nr)
fi

ANTAL_STANGDA="${#SORTERAD[@]}"
for ((I = 0; I < ANTAL_STANGDA; I++)); do
  IFS='|' read -r SNR SFN SDATUM <<< "${SORTERAD[${I}]}"
  if (( I < FONSTER )); then
    KVAR_RADER+=("KVAR ${SFN} — closed, inom fönstret (${FONSTER} senast stängda)")
  else
    ARKIV_SESSIONSNR+=("${SNR}")
    ARKIV_FILNAMN+=("${SFN}")
    ARKIV_DATUM+=("${SDATUM}")
  fi
done

ANTAL_ARKIV="${#ARKIV_FILNAMN[@]}"

echo "═══ SESSIONSDOK-ARKIVERING (ADR-099 rullande fönster) ═══"
if [[ "${UTFOR}" -eq 1 ]]; then
  echo "Läge:        UTFÖR (flytt + länkomskrivning sker)"
else
  echo "Läge:        TORRKÖRNING (inget ändras — lägg till --utfor för att utföra)"
fi
echo "Rot:         ${SESSIONS_ROT}"
echo "Fönster (N): ${FONSTER}"
echo "Policy-fil:  ${ARKIVERA_SESSIONSDOK_POLICY}"
echo

for rad in "${KVAR_RADER[@]:-}"; do
  [[ -n "${rad}" ]] || continue
  echo "${rad}"
done
for rad in "${FLAGGAD_RADER[@]:-}"; do
  [[ -n "${rad}" ]] || continue
  echo "${rad}"
done

if [[ "${ANTAL_ARKIV}" -eq 0 ]]; then
  echo
  echo "Roten ryms redan inom fönstret — inga arkiv-kandidater."
  echo
  echo "── Summering ──"
  echo "Kvar:              ${#KVAR_RADER[@]}"
  echo "Flaggade:          ${#FLAGGAD_RADER[@]}"
  echo "Arkiverade:        0"
  exit 0
fi

# ── Pathspec-exkludering delad av Pass A (torrkörning OCH utförande) ────────
# Arkivet självt (befintligt + nytt) UTESLUTS ALLTID — arkiverade dok är
# immutabla (README.md). Under torrkörning utesluts VARJE arkiv-kandidats
# EGEN rot-sökväg explicit, så förhandsvisningen matchar exakt vad --utfor
# skulle se efter flytten (kandidaten finns då inte längre kvar på sin
# gamla rot-sökväg).
PATHSPEC_EXKLUDERING=(':!tasks/sessions/archive/**')
for ((I = 0; I < ANTAL_ARKIV; I++)); do
  PATHSPEC_EXKLUDERING+=(":!tasks/sessions/${ARKIV_FILNAMN[${I}]}")
done

# ── Fas 1: flytt (endast --utfor) ────────────────────────────────────────────
echo
echo "── Arkiv-kandidater ──"
NY_SOKVAG=()  # parallellt index med ARKIV_FILNAMN — repo-rot-relativ ny sökväg
for ((I = 0; I < ANTAL_ARKIV; I++)); do
  FILNAMN="${ARKIV_FILNAMN[${I}]}"
  DATUM="${ARKIV_DATUM[${I}]}"
  MANAD="${DATUM:0:7}"
  NY_REL="tasks/sessions/archive/${MANAD}/${FILNAMN}"
  NY_SOKVAG+=("${NY_REL}")

  if [[ "${UTFOR}" -eq 0 ]]; then
    echo "SKULLE ARKIVERAS ${FILNAMN} → ${NY_REL} — closed, äldre än fönstrets ${FONSTER} senaste"
    continue
  fi

  mkdir -p "${ARKIV_ROT}/${MANAD}"
  git -C "${TOPPNIVA}" mv -- "tasks/sessions/${FILNAMN}" "${NY_REL}"
  echo "ARKIVERAD ${FILNAMN} → ${NY_REL} — closed, äldre än fönstrets ${FONSTER} senaste"
done

# ── Fas 2: Pass A — blanket path-citat, alla git-spårade filer utom arkivet ──
echo
echo "── Pass A: path-citat (\"tasks/sessions/<filnamn>\") ──"
LANK_A_ANTAL=0
for ((I = 0; I < ANTAL_ARKIV; I++)); do
  FILNAMN="${ARKIV_FILNAMN[${I}]}"
  NY_REL="${NY_SOKVAG[${I}]}"
  GAMMAL_REF="tasks/sessions/${FILNAMN}"
  NY_REF="${NY_REL}"

  TRAFFAR=()
  while IFS= read -r -d '' f; do
    TRAFFAR+=("${f}")
  done < <(git -C "${TOPPNIVA}" grep -z -I -l -F -e "${GAMMAL_REF}" -- "${PATHSPEC_EXKLUDERING[@]}" 2>/dev/null || true)

  for f in "${TRAFFAR[@]:-}"; do
    [[ -n "${f}" ]] || continue
    LANK_A_ANTAL=$((LANK_A_ANTAL + 1))
    if [[ "${UTFOR}" -eq 0 ]]; then
      echo "SKULLE SKRIVAS OM ${f} — \"${GAMMAL_REF}\" → \"${NY_REF}\""
      continue
    fi
    OLD="${GAMMAL_REF}" NEW="${NY_REF}" perl -0777 -pi -e '
      my $old = $ENV{OLD};
      my $new = $ENV{NEW};
      s/\Q$old\E/$new/g;
    ' -- "${TOPPNIVA}/${f}"
    echo "OMSKRIVEN ${f} — \"${GAMMAL_REF}\" → \"${NY_REF}\""
  done
done

# ── Fas 3: Pass B — bara relativa systerlänkar i kvarvarande rotdok ─────────
# Scope: *.md direkt i tasks/sessions/-roten (post-flytt state — det ÄR de
# dok som stannar, eftersom arkiverade dok redan är flyttade härifrån).
echo
echo "── Pass B: bara relativa systerlänkar (\"](<filnamn>\") i kvarvarande rotdok ──"
LANK_B_ANTAL=0
for kvarfil in "${SESSIONS_ROT}"/*.md; do
  [[ -e "${kvarfil}" ]] || continue
  KVARFILNAMN="$(basename "${kvarfil}")"
  for ((I = 0; I < ANTAL_ARKIV; I++)); do
    FILNAMN="${ARKIV_FILNAMN[${I}]}"
    NY_REL="${NY_SOKVAG[${I}]}"
    MANAD="${ARKIV_DATUM[${I}]:0:7}"
    GAMMAL_LANK="](${FILNAMN}"
    NY_LANK="](archive/${MANAD}/${FILNAMN}"

    if ! grep -qF -- "${GAMMAL_LANK}" "${kvarfil}" 2>/dev/null; then
      continue
    fi
    LANK_B_ANTAL=$((LANK_B_ANTAL + 1))
    REL_KVARFIL="tasks/sessions/${KVARFILNAMN}"
    if [[ "${UTFOR}" -eq 0 ]]; then
      echo "SKULLE SKRIVAS OM ${REL_KVARFIL} — \"${GAMMAL_LANK}\" → \"${NY_LANK}\""
      continue
    fi
    OLD="${GAMMAL_LANK}" NEW="${NY_LANK}" perl -0777 -pi -e '
      my $old = $ENV{OLD};
      my $new = $ENV{NEW};
      s/\Q$old\E/$new/g;
    ' -- "${kvarfil}"
    echo "OMSKRIVEN ${REL_KVARFIL} — \"${GAMMAL_LANK}\" → \"${NY_LANK}\" (mål: ${NY_REL})"
  done
done

echo
echo "── Summering ──"
echo "Kvar:                          ${#KVAR_RADER[@]}"
echo "Flaggade (fail-closed):        ${#FLAGGAD_RADER[@]}"
if [[ "${UTFOR}" -eq 1 ]]; then
  echo "Arkiverade:                    ${ANTAL_ARKIV}"
  echo "Länkreferenser omskrivna:      $((LANK_A_ANTAL + LANK_B_ANTAL)) (Pass A: ${LANK_A_ANTAL}, Pass B: ${LANK_B_ANTAL})"
else
  echo "Skulle arkiveras:              ${ANTAL_ARKIV}"
  echo "Länkreferenser som skulle omskrivas: $((LANK_A_ANTAL + LANK_B_ANTAL)) (Pass A: ${LANK_A_ANTAL}, Pass B: ${LANK_B_ANTAL})"
  echo
  echo "Torrkörning — inget ändrades. Kör om med --utfor för att utföra."
fi
