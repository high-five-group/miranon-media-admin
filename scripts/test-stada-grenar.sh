#!/usr/bin/env bash
# test-stada-grenar.sh — tvåsidigt bevis för stada-grenar.sh (TASK-152 AC #3).
#
# Ett grönt utfall som bara visar att städningen TAR BORT bevisar ingenting:
# den farliga riktningen är att den tar bort för mycket. Testet ställer
# därför båda riktningarna mot varandra i ett engångsrepo under mktemp:
#
#   fynd/mergad             mergad, ingen worktree     → SKA RADERAS
#   fynd/omergad             ej mergad                  → SKA SKONAS
#   fynd/worktree-bunden      mergad MEN uppcheckad i
#                            en worktree                → SKA SKONAS
#   fynd/skyddad-viktig      mergad MEN skyddslistad
#                            (STADA_GRENAR_SKYDDADE)     → SKA SKONAS
#
# Samma mönster (mktemp-repo, bekrafta()-helper, dry-run-fas följt av
# utförande-fas) som marcus-hub-pluginets scripts/test-stada-worktrees.sh
# (TASK-94), anpassat för grenar i stället för worktrees.
#
# Körning:  bash scripts/test-stada-grenar.sh
# Exit 0 = alla påståenden höll. Exit 1 = minst ett föll (antalet skrivs ut).

set -euo pipefail

SKRIPT_KAT=""
SKRIPT_KAT=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
SKRIPT="${SKRIPT_KAT}/stada-grenar.sh"

if [[ ! -f "${SKRIPT}" ]]; then
  echo "FEL: hittar inte ${SKRIPT}" >&2
  exit 2
fi

TMP=""
TMP=$(mktemp -d "${TMPDIR:-/tmp}/task-152-stada-grenar.XXXXXX")
trap 'rm -rf "${TMP}"' EXIT

UPPSTROMS="${TMP}/uppstroms.git"
HUVUD="${TMP}/huvud"
WT_BUNDEN="${TMP}/wt-bunden"
POLICY="${TMP}/policy.conf"

FEL=0
bekrafta() {
  BESKRIVNING="${1}"
  OBSERVERAT="${2}"
  FORVANTAT="${3}"
  if [[ "${OBSERVERAT}" == "${FORVANTAT}" ]]; then
    echo "  OK   ${BESKRIVNING}"
  else
    echo "  FEL  ${BESKRIVNING} (förväntat '${FORVANTAT}', fick '${OBSERVERAT}')"
    FEL=$((FEL + 1))
  fi
}

# ── Rigg ──────────────────────────────────────────────────────────────────────
git init --quiet --bare -b main "${UPPSTROMS}"
git init --quiet -b main "${HUVUD}"
git -C "${HUVUD}" config user.email "test@example.invalid"
git -C "${HUVUD}" config user.name "TASK-152 test"
git -C "${HUVUD}" commit --quiet --allow-empty -m "start"
git -C "${HUVUD}" remote add origin "${UPPSTROMS}"
git -C "${HUVUD}" push --quiet -u origin main

# fynd/mergad — commit + merge in i main, sedan tillbaka till main. Ingen
# worktree håller den uppcheckad efteråt → kandidat för radering.
git -C "${HUVUD}" checkout --quiet -b fynd/mergad
echo "arbete i fynd/mergad" > "${HUVUD}/mergad.txt"
git -C "${HUVUD}" add mergad.txt
git -C "${HUVUD}" commit --quiet -m "arbete i fynd/mergad"
git -C "${HUVUD}" checkout --quiet main
git -C "${HUVUD}" merge --quiet --no-ff -m "merge fynd/mergad" fynd/mergad
git -C "${HUVUD}" push --quiet origin main

# fynd/omergad — commit, ALDRIG mergad in i main.
git -C "${HUVUD}" checkout --quiet -b fynd/omergad
echo "arbete i fynd/omergad" > "${HUVUD}/omergad.txt"
git -C "${HUVUD}" add omergad.txt
git -C "${HUVUD}" commit --quiet -m "arbete i fynd/omergad"
git -C "${HUVUD}" checkout --quiet main

# fynd/skyddad-viktig — mergad, men namnet matchar en skyddslista-glob i
# testets policy-fil (se nedan).
git -C "${HUVUD}" checkout --quiet -b fynd/skyddad-viktig
echo "arbete i fynd/skyddad-viktig" > "${HUVUD}/skyddad.txt"
git -C "${HUVUD}" add skyddad.txt
git -C "${HUVUD}" commit --quiet -m "arbete i fynd/skyddad-viktig"
git -C "${HUVUD}" checkout --quiet main
git -C "${HUVUD}" merge --quiet --no-ff -m "merge fynd/skyddad-viktig" fynd/skyddad-viktig
git -C "${HUVUD}" push --quiet origin main

# fynd/worktree-bunden — mergad, men LÄMNAS uppcheckad i en separat
# worktree (aldrig `git worktree remove`:ad) — precis så en aktiv
# agent-gren ser ut mitt i arbete, även om innehållet råkar vara mergat.
git -C "${HUVUD}" worktree add --quiet -b fynd/worktree-bunden "${WT_BUNDEN}" main
echo "arbete i fynd/worktree-bunden" > "${WT_BUNDEN}/wt.txt"
git -C "${WT_BUNDEN}" add wt.txt
git -C "${WT_BUNDEN}" commit --quiet -m "arbete i fynd/worktree-bunden"
git -C "${HUVUD}" merge --quiet --no-ff -m "merge fynd/worktree-bunden" fynd/worktree-bunden
git -C "${HUVUD}" push --quiet origin main

cat > "${POLICY}" <<'CONF'
STADA_GRENAR_BAS=""
STADA_GRENAR_SKYDDADE=(
    "fynd/skyddad-*"
)
CONF

echo
echo "═══ FAS 1 — torrkörning ska rapportera rätt, och ändra ingenting ═══"
UT_TORR="${TMP}/ut-torrkorning.txt"
KOD_TORR=0
( cd "${HUVUD}" && STADA_GRENAR_POLICY="${POLICY}" bash "${SKRIPT}" --ingen-fetch ) > "${UT_TORR}" 2>&1 || KOD_TORR=$?
bekrafta "torrkörningen avslutas med exit 0" "${KOD_TORR}" "0"

OBS=""
if grep -qF "SKULLE RADERAS fynd/mergad — mergad i" "${UT_TORR}"; then OBS=ja; else OBS=nej; fi
bekrafta "fynd/mergad pekas ut som raderings-kandidat" "${OBS}" "ja"

if grep -qF "SKONAS fynd/omergad — ej mergad i" "${UT_TORR}"; then OBS=ja; else OBS=nej; fi
bekrafta "fynd/omergad stoppas av mergad-grinden" "${OBS}" "ja"

if grep -qF "SKONAS fynd/worktree-bunden — uppcheckad i en worktree" "${UT_TORR}"; then OBS=ja; else OBS=nej; fi
bekrafta "fynd/worktree-bunden stoppas av worktree-grinden trots att den är mergad" "${OBS}" "ja"

if grep -qF "SKONAS fynd/skyddad-viktig — skyddslistad (STADA_GRENAR_SKYDDADE)" "${UT_TORR}"; then OBS=ja; else OBS=nej; fi
bekrafta "fynd/skyddad-viktig stoppas av skyddslistan trots att den är mergad" "${OBS}" "ja"

if grep -qF "SKONAS main — bas-grenen" "${UT_TORR}"; then OBS=ja; else OBS=nej; fi
bekrafta "main pekas ut och skonas som bas-grenen" "${OBS}" "ja"

if git -C "${HUVUD}" show-ref --verify --quiet refs/heads/fynd/mergad; then OBS=ja; else OBS=nej; fi
bekrafta "torrkörningen tog INTE bort fynd/mergad" "${OBS}" "ja"

echo
echo "═══ FAS 2 — utförande ska radera EN och lämna alla andra ═══"
UT_UTFOR="${TMP}/ut-utforande.txt"
KOD_UTFOR=0
( cd "${HUVUD}" && STADA_GRENAR_POLICY="${POLICY}" bash "${SKRIPT}" --utfor --ingen-fetch ) > "${UT_UTFOR}" 2>&1 || KOD_UTFOR=$?
bekrafta "utförandet avslutas med exit 0" "${KOD_UTFOR}" "0"

if grep -qF "RADERAD fynd/mergad — mergad i" "${UT_UTFOR}"; then OBS=ja; else OBS=nej; fi
bekrafta "fynd/mergad redovisas som RADERAD" "${OBS}" "ja"

if git -C "${HUVUD}" show-ref --verify --quiet refs/heads/fynd/mergad; then OBS=ja; else OBS=nej; fi
bekrafta "fynd/mergad ÄR raderad" "${OBS}" "nej"

if git -C "${HUVUD}" show-ref --verify --quiet refs/heads/fynd/omergad; then OBS=ja; else OBS=nej; fi
bekrafta "fynd/omergad är kvar (ej mergad)" "${OBS}" "ja"

if [[ -d "${WT_BUNDEN}" ]] && git -C "${HUVUD}" show-ref --verify --quiet refs/heads/fynd/worktree-bunden; then OBS=ja; else OBS=nej; fi
bekrafta "fynd/worktree-bunden OCH dess worktree är kvar" "${OBS}" "ja"

if git -C "${HUVUD}" show-ref --verify --quiet refs/heads/fynd/skyddad-viktig; then OBS=ja; else OBS=nej; fi
bekrafta "fynd/skyddad-viktig är kvar (skyddslistad)" "${OBS}" "ja"

if git -C "${HUVUD}" show-ref --verify --quiet refs/heads/main; then OBS=ja; else OBS=nej; fi
bekrafta "main är orörd" "${OBS}" "ja"

echo
echo "═══ FAS 3 — okänd flagga fäller med exit 2, ändrar ingenting ═══"
UT_FLAGGA="${TMP}/ut-okand-flagga.txt"
KOD_FLAGGA=0
( cd "${HUVUD}" && STADA_GRENAR_POLICY="${POLICY}" bash "${SKRIPT}" --okand-flagga ) > "${UT_FLAGGA}" 2>&1 || KOD_FLAGGA=$?
bekrafta "okänd flagga ger exit 2" "${KOD_FLAGGA}" "2"

if git -C "${HUVUD}" show-ref --verify --quiet refs/heads/fynd/omergad; then OBS=ja; else OBS=nej; fi
bekrafta "fynd/omergad är fortfarande kvar efter användningsfelet" "${OBS}" "ja"

echo
echo "── Resultat ──"
if [[ "${FEL}" -eq 0 ]]; then
  echo "ALLA PÅSTÅENDEN HÖLL"
  exit 0
fi
echo "${FEL} PÅSTÅENDEN FÖLL"
exit 1
