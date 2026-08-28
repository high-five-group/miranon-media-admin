#!/usr/bin/env bash
# scripts/stada-grenar.sh — säker städning av lokala grenar mergade i main
# (TASK-152).
#
# PROBLEMET: 271–272 av ~292–294 lokala grenar i detta repo är redan mergade
# i main (mätt vid byggtillfället 2026-08-07, se scripts/test-stada-grenar.sh
# för det tvåsidiga beviset — talet RÖR SIG session för session eftersom
# agenter pushar nya grenar samtidigt som andra landar). Paus-svepets
# worktree-städning (marcus-hub-pluginets scripts/stada-worktrees.sh) tar
# visserligen bort TVÅ grenar per worktree den faktiskt tar bort (den
# uppcheckade grenen + platshållargrenen "worktree-<namn>") — men BARA de
# grenar som satt fast i EN worktree den städar i SAMMA körning. En gren som
# aldrig hade en worktree (t.ex. pushad direkt, eller vars worktree redan
# städats av ett tidigare pass) rörs aldrig. Ingen mekanism i repot gjorde en
# generell sopning av SAMTLIGA lokalt mergade grenar. Detta skript är den
# mekanismen.
#
# ═══ VERKTYGSVALS-PRÖVNING (CONTRIBUTING.md § "Verktygsval före nybygge",
#      A3b) ═══
#   Branschledarnas mönster för "radera mergade lokala grenar":
#     - Standardidiomet (mycket brett spritt, se t.ex.
#       gist.github.com/nicholashoule/ff5a00c8f02ea57f0b26889f022620f4 och
#       mathspp.com/blog/til/delete-merged-git-branches):
#       `git branch --merged main | grep -v '^\*\|main' | xargs git branch -d`.
#       Samma primitiv (`git branch --merged` + `git branch -d`) som detta
#       skript bygger på — men den råa formen är blind för worktrees,
#       aktuell gren i EN ANNAN worktree, och har ingen skyddslista.
#     - git-trim (github.com/foriequal0/git-trim, Rust-CLI): tar bort
#       mergade/borttagna/spårlösa grenar, har torrkörning. Extern binär i
#       ett nytt språk-toolchain för ETT städjobb — repot äger redan
#       hand-skrivna bash-verktyg med policy-conf-mönstret (heartbeat-svep.sh,
#       stada-worktrees.sh, ci-wait.sh, staging-semaphore.sh) och kräver
#       INGEN ny toolchain för detta.
#     - git-delete-merged-branches (PyPI, interaktiv Python-CLI): samma
#       invändning — ny toolchain, och den saknar det repo-specifika kravet
#       "skona grenar uppcheckade i NÅGON worktree" (worktrees är ett
#       ovanligt användningsfall den inte är byggd för).
#     - `gh`: inget subkommando eller vedertagen extension gör detta
#       (sökt: `gh` har ingen `branch`-yta alls — grenar är ett rent
#       git-lokalt begrepp, inte ett GitHub-API-objekt).
#   DOM: BYGG EGET, på standardidiomets primitiv (`git branch --merged` +
#   `git branch -d`) men med repots egna säkerhetslager ovanpå (worktree-
#   korsning, skyddslista, config-driven policy-fil). Samma dom och samma
#   skäl som redan gällde tre gånger för heartbeat-svep.sh/ci-wait.sh/
#   staging-semaphore.sh — fjärde instansen av samma klass.
#
# SÄKERHETEN — fyra oberoende skydd, ALLTID i denna ordning, ingen gren
# raderas om NÅGOT av dem slår till:
#   1. BAS-GRENEN   — det hårdkodade namnet "main" ELLER den lokalt
#                     härledda bas-grenen (se § BAS-REF nedan) raderas
#                     ALDRIG, oavsett vad policy-filen eller --bas anger.
#   2. AKTUELL GREN — grenen HEAD pekar på i katalogen skriptet körs
#                     ifrån raderas aldrig.
#   3. WORKTREE      — grenar uppcheckade i NÅGON lokal worktree (git
#                     worktree list-korsning) raderas aldrig. `git branch -d`
#                     vägrar dessutom redan detta på egen hand (git-native
#                     "used by worktree"-spärr) — skyddet här är en
#                     FÖRHANDS-kontroll, inte den enda linjen.
#   4. SKYDDSLISTA   — glob-mönster i STADA_GRENAR_SKYDDADE
#                     (.stada-grenar-policy.conf) raderas aldrig.
#   Utöver de fyra: en gren som INTE är förfader till bas-SHA:t (`git
#   merge-base --is-ancestor`) räknas som EJ MERGAD och rörs aldrig — det är
#   själva urvalskriteriet, inte ett skydd i sig.
#
# RADERINGEN sker ALDRIG med -D. `git branch -d` vägrar av egen kraft om
# grenen trots allt inte är fullt mergad (t.ex. en avvikande merge-strategi)
# — ett sådant avslag redovisas som SKONAS, aldrig som ett fel.
#
# ═══ KÄND BEGRÄNSNING — URVALET ÄR UNDER-UPPTÄCKANDE (TASK-323) ═══
#
#   "Mergad?" avgörs enbart på ANCESTOR-relationen (`git merge-base
#   --is-ancestor <gren> <BAS_SHA>` nedan). Repot bär en egen namngiven
#   lesson om precis det mönstret tillämpat på VÅR landningsväg:
#   tasks/lessons.d/merge-kon-gor-branch-toppar-till-icke-ancestors.md —
#   merge queue bygger om varje post mot main plus posterna före den, så den
#   commit som faktiskt landar är en ANNAN commit än grenens topp. En gren
#   vars innehåll ligger i main kan därför svara "nej" på ancestor-frågan.
#
#   RIKTNINGEN ÄR SÄKER, och det är hela skälet att begränsningen är
#   acceptabel: en kö-landad gren vars topp byggts om bedöms "ej mergad" och
#   SKONAS. Skriptet raderar aldrig något det inte bevisligen har ancestry
#   för. Felet går alltid mot att städa för LITE, aldrig för mycket.
#
#   KOSTNADEN är ett dolt tak på hur mycket automatiken kan lösa: en okänd
#   andel av de skonade grenarna kan redan vara landade. Vid skarpkörningen
#   2026-08-28 identifierades 162 av 203 grenar korrekt som mergade (20
#   skonades som "ej mergad") — taket bet alltså inte hårt då, men talet är
#   ett stickprov, inte en garanti.
#
#   VÄGEN OM TAKET BÖRJAR BITA: git-trim (github.com/foriequal0/git-trim)
#   avgör mergad-status med `git cherry` — patch-ID-ekvivalens i stället för
#   ancestry — vilket fångar både squash- och ombyggda toppar. Byt INTE
#   urvalskriterium utan att först mäta hur många grenar som faktiskt
#   skonas felaktigt; `git cherry` är dyrare per gren och skriptet körs nu
#   automatiskt (scripts/heartbeat-svep.sh § UNDERHÅLL).
#
# TORRKÖRNING ÄR DEFAULT. Utan --utfor ändras ingenting — samma kontrakt som
# `git clean -n` och scripts/stada-worktrees.sh. Exit 0 = rapporten är
# komplett, inte "allt städat".
#
# BAS-REF: samma härledningskedja som scripts/stada-worktrees.sh
# (marcus-hub-pluginet) av samma skäl — origin/HEAD → origin/main → main.
# VIKTIGT: lokal "main" kan vara EFTER origin/main (landningar sker via
# GitHubs merge queue på fjärrsidan; lokal "main" avancerar bara vid en
# explicit fetch/merge i just den checkouten). En stale lokal main är ofarlig
# här — den kan bara missa nyligen landade grenar (under-rapportera), aldrig
# felaktigt radera något — men default föredrar därför origin/main, och
# --ingen-fetch finns bara för offline/test-bruk.
#
# ANVÄNDNING
#   scripts/stada-grenar.sh [--utfor] [--bas <ref>] [--ingen-fetch]
#     --utfor        utför raderingarna (utan flaggan: bara rapport)
#     --bas <ref>    bas att mäta "mergad" mot (default: policy-filens
#                    STADA_GRENAR_BAS, annars origin/HEAD → origin/main → main)
#     --ingen-fetch  hoppa över `git fetch` av bas-refens fjärr
#
# Policy-fil: .stada-grenar-policy.conf (kan pekas om med
# STADA_GRENAR_POLICY, samma testbarhets-mönster som HEARTBEAT_SVEP_POLICY).
#
# EXIT-KODER
#   0   rapporten är komplett — oavsett hur många grenar som raderades/
#       skulle raderas/skonades
#   2   användningsfel — okänd flagga, saknad bas-ref, eller katalogen är
#       inte ett git-repo
#
# Testsvit: scripts/test-stada-grenar.sh
#
# Källa: backlog/tasks/task-152 · scripts/stada-worktrees.sh
#        (marcus-hub-pluginet, TASK-94) · CLAUDE.md § "Custom
#        CI-grindvakts-logik i spokes är alltid config-driven"
# Etablerad: TASK-152, 2026-08-07
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STADA_GRENAR_POLICY="${STADA_GRENAR_POLICY:-${SCRIPT_DIR}/../.stada-grenar-policy.conf}"

UTFOR=0
BAS=""
FETCH=1

# Fail-open default INNAN source (samma idiom som HEARTBEAT_EXEMPT_AUTHORS i
# heartbeat-svep.sh): en policy-fil utan STADA_GRENAR_SKYDDADE (äldre kopia,
# eller filen saknas helt) lämnar skyddslistan tom i stället för att krascha
# under `set -u` — mekanismen är AV, inte trasig.
STADA_GRENAR_SKYDDADE=()

if [[ -f "${STADA_GRENAR_POLICY}" ]]; then
  # shellcheck source=/dev/null
  source "${STADA_GRENAR_POLICY}"
  BAS="${STADA_GRENAR_BAS:-}"
fi

anvandning() {
  cat <<'HJALP'
Användning: stada-grenar.sh [--utfor] [--bas <ref>] [--ingen-fetch]

  --utfor        Utför raderingarna. Utan flaggan är körningen en
                 torrkörning som inte ändrar någonting.
  --bas <ref>    Bas-ref som "mergad" mäts mot. Default: policy-filens
                 STADA_GRENAR_BAS, annars origin/HEAD, annars origin/main,
                 annars main.
  --ingen-fetch  Hoppa över `git fetch` av bas-refens fjärr (offline/test).
HJALP
}

while [[ $# -gt 0 ]]; do
  case "${1}" in
    --utfor) UTFOR=1; shift ;;
    --bas)
      if [[ $# -lt 2 ]]; then
        echo "FEL: --bas kräver en ref" >&2
        exit 2
      fi
      BAS="${2}"; shift 2 ;;
    --ingen-fetch) FETCH=0; shift ;;
    -h|--help|--hjalp) anvandning; exit 0 ;;
    *) echo "FEL: okänd flagga '${1}'" >&2; anvandning >&2; exit 2 ;;
  esac
done

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "FEL: inte ett git-repo — kör från repot vars grenar ska städas" >&2
  exit 2
fi

# ── Bas-ref ────────────────────────────────────────────────────────────────────
if [[ -z "${BAS}" ]]; then
  ORIGIN_HEAD=""
  if ORIGIN_HEAD=$(git symbolic-ref --quiet refs/remotes/origin/HEAD 2>/dev/null); then
    BAS="${ORIGIN_HEAD#refs/remotes/}"
  elif git rev-parse --verify --quiet origin/main >/dev/null 2>&1; then
    BAS="origin/main"
  elif git rev-parse --verify --quiet main >/dev/null 2>&1; then
    BAS="main"
  else
    echo "FEL: kunde inte härleda bas-ref — ange den med --bas" >&2
    exit 2
  fi
fi

if [[ "${FETCH}" -eq 1 && "${BAS}" == */* ]]; then
  FJARR="${BAS%%/*}"
  if git remote get-url "${FJARR}" >/dev/null 2>&1; then
    if ! git fetch --quiet "${FJARR}"; then
      echo "VARNING: 'git fetch ${FJARR}' misslyckades — basen kan vara inaktuell." >&2
    fi
  fi
fi

if ! BAS_SHA=$(git rev-parse --verify --quiet "${BAS}^{commit}"); then
  echo "FEL: bas-refen '${BAS}' går inte att slå upp" >&2
  exit 2
fi

# Lokalt kortnamn på bas-grenen — strippar ett ev. "<fjärr>/"-prefix (t.ex.
# "origin/main" → "main"). Skyddar bas-grenen oavsett hur BAS angavs, INTE
# bara det hårdkodade "main"-fallet.
BAS_LOKAL="${BAS##*/}"

AKTUELL_GREN=""
AKTUELL_GREN=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

# ── Worktree-grenar (grind 3) ────────────────────────────────────────────────
WT_GRENAR=()
WT_LISTA=""
WT_LISTA=$(git worktree list --porcelain)
while IFS= read -r RAD; do
  case "${RAD}" in
    "branch "*) WT_GRENAR+=("${RAD#branch refs/heads/}") ;;
    *) : ;;
  esac
done <<< "${WT_LISTA}"

ar_worktree_gren() {
  local kandidat="${1}" g
  for g in "${WT_GRENAR[@]:-}"; do
    [[ -n "${g}" ]] || continue
    [[ "${kandidat}" == "${g}" ]] && return 0
  done
  return 1
}

# ── Skyddslista (grind 4) ─────────────────────────────────────────────────────
# Bash-glob (case-mönster), INTE regex — samma matchningsform som
# .gitignore-liknande allowlistor i repot (D0-globen i verify-ci-parity.mjs
# är JS, men principen "positiv lista, glob-syntax" är densamma).
ar_skyddslistad() {
  local kandidat="${1}" monster
  for monster in "${STADA_GRENAR_SKYDDADE[@]:-}"; do
    [[ -n "${monster}" ]] || continue
    # shellcheck disable=SC2254
    # AVSIKTLIGT: högerledet ska glob-expandera mot kandidaten, inte
    # jämföras som en bokstavlig sträng — därför ociterat i case-mönstret.
    case "${kandidat}" in
      ${monster}) return 0 ;;
      *) : ;;
    esac
  done
  return 1
}

echo "═══ GRENSTÄDNING ═══"
if [[ "${UTFOR}" -eq 1 ]]; then
  echo "Läge:        UTFÖR (raderingar sker)"
else
  echo "Läge:        TORRKÖRNING (inget ändras — lägg till --utfor för att utföra)"
fi
echo "Bas:         ${BAS} (${BAS_SHA})"
echo "Policy-fil:  ${STADA_GRENAR_POLICY}"
# Separat kommandosubstitution (i stället för inline i echo-strängen) så
# SC2312 inte varnar för att `||`-reservens returvärde maskeras.
SJALV_TOPPNIVA=""
SJALV_TOPPNIVA=$(git rev-parse --show-toplevel 2>/dev/null) || SJALV_TOPPNIVA="$(pwd)"
echo "Kör från:    ${SJALV_TOPPNIVA}"
echo

ANTAL_RADERAD=0
ANTAL_SKONAD=0

GRENLISTA=""
GRENLISTA=$(git for-each-ref --format='%(refname:short)' refs/heads)

while IFS= read -r GREN; do
  [[ -n "${GREN}" ]] || continue

  if [[ "${GREN}" == "main" || "${GREN}" == "${BAS_LOKAL}" ]]; then
    echo "SKONAS ${GREN} — bas-grenen"
    ANTAL_SKONAD=$((ANTAL_SKONAD + 1))
    continue
  fi

  if [[ -n "${AKTUELL_GREN}" && "${GREN}" == "${AKTUELL_GREN}" ]]; then
    echo "SKONAS ${GREN} — aktuell gren"
    ANTAL_SKONAD=$((ANTAL_SKONAD + 1))
    continue
  fi

  # shellcheck disable=SC2310
  # AVSIKTLIGT: ar_worktree_gren() innehåller inga kommandon som kan
  # misslyckas oväntat (ren bash — for-loop + strängjämförelse + return), så
  # set -e-avstängningen SC2310 varnar för är ofarlig här. Samma disciplin
  # som is_exempt_author() i heartbeat-svep.sh.
  if ar_worktree_gren "${GREN}"; then
    echo "SKONAS ${GREN} — uppcheckad i en worktree"
    ANTAL_SKONAD=$((ANTAL_SKONAD + 1))
    continue
  fi

  # shellcheck disable=SC2310
  # AVSIKTLIGT: ar_skyddslistad() innehåller inga kommandon som kan
  # misslyckas oväntat (ren bash — for-loop + case-mönstermatchning +
  # return), så set -e-avstängningen SC2310 varnar för är ofarlig här.
  # Samma disciplin som is_exempt_author() i heartbeat-svep.sh.
  if ar_skyddslistad "${GREN}"; then
    echo "SKONAS ${GREN} — skyddslistad (STADA_GRENAR_SKYDDADE)"
    ANTAL_SKONAD=$((ANTAL_SKONAD + 1))
    continue
  fi

  if ! git merge-base --is-ancestor "refs/heads/${GREN}" "${BAS_SHA}"; then
    echo "SKONAS ${GREN} — ej mergad i ${BAS}"
    ANTAL_SKONAD=$((ANTAL_SKONAD + 1))
    continue
  fi

  if [[ "${UTFOR}" -eq 0 ]]; then
    echo "SKULLE RADERAS ${GREN} — mergad i ${BAS}"
    ANTAL_RADERAD=$((ANTAL_RADERAD + 1))
    continue
  fi

  if git branch -d "${GREN}" >/dev/null 2>&1; then
    echo "RADERAD ${GREN} — mergad i ${BAS}"
    ANTAL_RADERAD=$((ANTAL_RADERAD + 1))
  else
    echo "SKONAS ${GREN} — 'git branch -d' vägrade"
    ANTAL_SKONAD=$((ANTAL_SKONAD + 1))
  fi
done <<< "${GRENLISTA}"

echo
echo "── Summering ──"
if [[ "${UTFOR}" -eq 1 ]]; then
  echo "Raderade grenar:  ${ANTAL_RADERAD}"
else
  echo "Skulle raderas:   ${ANTAL_RADERAD}"
fi
echo "Skonade grenar:    ${ANTAL_SKONAD}"
if [[ "${UTFOR}" -eq 0 && "${ANTAL_RADERAD}" -gt 0 ]]; then
  echo
  echo "Torrkörning — inget ändrades. Kör om med --utfor för att utföra."
fi
