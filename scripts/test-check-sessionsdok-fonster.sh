#!/usr/bin/env bash
# test-check-sessionsdok-fonster.sh — tvåsidigt bevis för
# check-sessionsdok-fonster.sh (TASK-158.4 AC #2).
#
# Ett grönt utfall som bara visar att grinden PASSERAR en tom/redan-inom-
# fönstret-rot bevisar ingenting: den farliga riktningen är att grinden
# tystnar när fönstret VERKLIGEN är överskridet (en tyst permanent, exakt
# vad PRD task-158 § användarberättelse 5 ska förhindra). Testet bygger
# därför:
#
#   RIGG A (engångsrepo under mktemp, tre stängda dok):
#     FAS 1  N=2  → session-1 (äldst) är UTANFÖR fönstret → DRIFT, exit 1
#     FAS 2  N=3  → SAMMA tre dok ryms → GRÖNT, exit 0
#   Samma repo, bara policy-filens N ändrat mellan faserna — bevisar AC #1
#   (grinden läser N ur SAMMA policy-konfig som skriptet, ingen egen
#   duplicerad konstant: skulle N vara hårdkodat i grinden hade FAS 2 inte
#   kunnat flippa utfallet).
#
#   FAS 3–6: fail-closed-grenar, alla mot ett FEJKAT arkiverings-skript (för
#   att styra exakt vad "skriptet" svarar utan att röra den skarpa logiken):
#     FAS 3  ARKIVERA_SESSIONSDOK_SKRIPT pekar på en fil som inte finns → exit 2
#     FAS 4  ARKIVERA_SESSIONSDOK_POLICY pekar på en fil som inte finns → exit 2
#     FAS 5  policy-filen finns men saknar fönstertal (tom) → det underliggande
#            skriptet svarar exit 2 → grinden ÄRVER exit 2 (KOD-passthrough)
#     FAS 6  det underliggande skriptet svarar exit 0 men med en rapport
#            grinden inte kan tolka (varken "inga arkiv-kandidater" eller en
#            "Skulle arkiveras: N"-rad) → exit 2, fail-closed på format-drift
#     FAS 7  det underliggande skriptet svarar exit 0 med en MOTSÄGELSEFULL
#            rapport ("Skulle arkiveras: 0" utan "inga arkiv-kandidater") →
#            exit 2 — grinden litar aldrig på en enskild rad utan konsistens
#
# Samma mönster (mktemp-repo, bekrafta()-helper, policy-fil via env-override)
# som scripts/test-arkivera-sessionsdok.sh (TASK-158.2) och
# scripts/test-check-nattvakt-dedup.sh (TASK-180, fejkat-skript-riggen).
#
# Körning:  bash scripts/test-check-sessionsdok-fonster.sh
# Exit 0 = alla påståenden höll. Exit 1 = minst ett föll (antalet skrivs ut).

set -euo pipefail

SKRIPT_KAT=""
SKRIPT_KAT=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
GRIND="${SKRIPT_KAT}/check-sessionsdok-fonster.sh"
ARKIVSKRIPT="${SKRIPT_KAT}/arkivera-sessionsdok.sh"

if [[ ! -f "${GRIND}" ]]; then
  echo "FEL: hittar inte ${GRIND}" >&2
  exit 2
fi
if [[ ! -f "${ARKIVSKRIPT}" ]]; then
  echo "FEL: hittar inte ${ARKIVSKRIPT}" >&2
  exit 2
fi

TMP=""
TMP=$(mktemp -d "${TMPDIR:-/tmp}/task-158-4-check-sessionsdok-fonster.XXXXXX")
trap 'rm -rf "${TMP}"' EXIT

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

skriv_dok() {
  # skriv_dok <sokvag> <lifecycle> <kropp>
  local sokvag="${1}" lifecycle="${2}" kropp="${3}"
  mkdir -p "$(dirname "${sokvag}")"
  cat > "${sokvag}" <<EOF
---
owner: test
updated: 2026-01-01
lifecycle: ${lifecycle}
---

${kropp}
EOF
}

# ── Rigg A: ett engångsrepo, tre stängda dok, ingen active/paused ──────────
HUVUD="${TMP}/huvud"
git init --quiet -b main "${HUVUD}"
git -C "${HUVUD}" config user.email "test@example.invalid"
git -C "${HUVUD}" config user.name "TASK-158.4 test"

skriv_dok "${HUVUD}/tasks/sessions/2026-06-01-session-1.md" closed "Session 1 — äldst."
skriv_dok "${HUVUD}/tasks/sessions/2026-06-02-session-2.md" closed "Session 2."
skriv_dok "${HUVUD}/tasks/sessions/2026-06-03-session-3.md" closed "Session 3 — senast stängd."
git -C "${HUVUD}" add -A
git -C "${HUVUD}" commit --quiet -m "fixture A"

POLICY_N2="${TMP}/policy-n2.conf"
cat > "${POLICY_N2}" <<'EOF'
ARKIVERA_SESSIONSDOK_FONSTER=2
ARKIVERA_SESSIONSDOK_SKYDDADE=()
EOF

POLICY_N3="${TMP}/policy-n3.conf"
cat > "${POLICY_N3}" <<'EOF'
ARKIVERA_SESSIONSDOK_FONSTER=3
ARKIVERA_SESSIONSDOK_SKYDDADE=()
EOF

echo
echo "═══ FAS 1 — N=2, tre stängda dok: roten har vuxit förbi fönstret → DRIFT ═══"
UT1="${TMP}/ut-fas1.txt"
KOD1=0
( cd "${HUVUD}" && ARKIVERA_SESSIONSDOK_POLICY="${POLICY_N2}" bash "${GRIND}" ) > "${UT1}" 2>&1 || KOD1=$?
bekrafta "N=2 (drift) ger exit 1" "${KOD1}" "1"

OBS=""
if grep -qF "DRIFT (exit 1): roten bär 1 arkiv-kandidat(er) — fönstret (N=2) är överskridet." "${UT1}"; then OBS=ja; else OBS=nej; fi
bekrafta "drift-meddelandet anger rätt kandidat-antal (1) och rätt N (2)" "${OBS}" "ja"

if grep -qF "Fönster (N): 2" "${UT1}"; then OBS=ja; else OBS=nej; fi
bekrafta "grindens egen rapport-header redovisar N ur policy-filen" "${OBS}" "ja"

if grep -qF "SKULLE ARKIVERAS 2026-06-01-session-1.md" "${UT1}"; then OBS=ja; else OBS=nej; fi
bekrafta "underliggande skripts rapport (session-1 som kandidat) syns i grindens utdata" "${OBS}" "ja"

echo
echo "═══ FAS 2 — SAMMA repo, N=3: roten ryms → GRÖNT (bevisar AC #1: N läses ur policyn, inte hårdkodat) ═══"
UT2="${TMP}/ut-fas2.txt"
KOD2=0
( cd "${HUVUD}" && ARKIVERA_SESSIONSDOK_POLICY="${POLICY_N3}" bash "${GRIND}" ) > "${UT2}" 2>&1 || KOD2=$?
bekrafta "N=3 (inom fönstret) ger exit 0" "${KOD2}" "0"

if grep -qF "GRÖNT — roten ryms inom fönstret (N=3)." "${UT2}"; then OBS=ja; else OBS=nej; fi
bekrafta "grönt-meddelandet redovisar rätt N (3)" "${OBS}" "ja"

echo
echo "═══ FAS 3 — ARKIVERA_SESSIONSDOK_SKRIPT pekar på en fil som inte finns → ANROPSFEL ═══"
UT3="${TMP}/ut-fas3.txt"
KOD3=0
( cd "${HUVUD}" && ARKIVERA_SESSIONSDOK_POLICY="${POLICY_N3}" ARKIVERA_SESSIONSDOK_SKRIPT="${TMP}/finns-inte.sh" bash "${GRIND}" ) > "${UT3}" 2>&1 || KOD3=$?
bekrafta "saknat arkiverings-skript ger exit 2" "${KOD3}" "2"

if grep -qF "hittar inte arkiverings-skriptet" "${UT3}"; then OBS=ja; else OBS=nej; fi
bekrafta "felmeddelandet pekar ut SKRIPTET som orsak (inte roten)" "${OBS}" "ja"

echo
echo "═══ FAS 4 — ARKIVERA_SESSIONSDOK_POLICY pekar på en fil som inte finns → ANROPSFEL ═══"
UT4="${TMP}/ut-fas4.txt"
KOD4=0
( cd "${HUVUD}" && ARKIVERA_SESSIONSDOK_POLICY="${TMP}/finns-inte.conf" bash "${GRIND}" ) > "${UT4}" 2>&1 || KOD4=$?
bekrafta "saknad policy-fil ger exit 2" "${KOD4}" "2"

if grep -qF "policyfilen" "${UT4}" && grep -qF "saknas" "${UT4}"; then OBS=ja; else OBS=nej; fi
bekrafta "felmeddelandet pekar ut POLICYN som orsak" "${OBS}" "ja"

echo
echo "═══ FAS 5 — policy-fil finns men saknar fönstertal: skriptet svarar exit 2, grinden ÄRVER koden ═══"
TOM_POLICY="${TMP}/tom-policy.conf"
: > "${TOM_POLICY}"
UT5="${TMP}/ut-fas5.txt"
KOD5=0
( cd "${HUVUD}" && ARKIVERA_SESSIONSDOK_POLICY="${TOM_POLICY}" bash "${GRIND}" ) > "${UT5}" 2>&1 || KOD5=$?
bekrafta "tomt fönstertal (underliggande skript fäller) ger exit 2" "${KOD5}" "2"

if grep -qF "avslutade med exit 2 i stället för 0" "${UT5}"; then OBS=ja; else OBS=nej; fi
bekrafta "felmeddelandet redovisar att det var SKRIPTETS exitkod som avvek" "${OBS}" "ja"

echo
echo "═══ FAS 6 — underliggande skript svarar exit 0 med OTOLKBAR rapport → ANROPSFEL, fail-closed på formatdrift ═══"
FEJK_OTOLKBAR="${TMP}/fejk-otolkbar.sh"
cat > "${FEJK_OTOLKBAR}" <<'EOF'
#!/usr/bin/env bash
echo "Något helt annat än det förväntade rapportformatet."
exit 0
EOF
chmod +x "${FEJK_OTOLKBAR}"
UT6="${TMP}/ut-fas6.txt"
KOD6=0
( cd "${HUVUD}" && ARKIVERA_SESSIONSDOK_POLICY="${POLICY_N3}" ARKIVERA_SESSIONSDOK_SKRIPT="${FEJK_OTOLKBAR}" bash "${GRIND}" ) > "${UT6}" 2>&1 || KOD6=$?
bekrafta "otolkbar rapport (exit 0, okänt format) ger exit 2" "${KOD6}" "2"

if grep -qF "formatet har drivit isär" "${UT6}"; then OBS=ja; else OBS=nej; fi
bekrafta "felmeddelandet namnger formatdrift som orsak" "${OBS}" "ja"

echo
echo "═══ FAS 7 — underliggande skript svarar MOTSÄGELSEFULLT (\"Skulle arkiveras: 0\" utan \"inga arkiv-kandidater\") → ANROPSFEL ═══"
FEJK_MOTSAGELSE="${TMP}/fejk-motsagelse.sh"
cat > "${FEJK_MOTSAGELSE}" <<'EOF'
#!/usr/bin/env bash
echo "── Summering ──"
echo "Skulle arkiveras:              0"
exit 0
EOF
chmod +x "${FEJK_MOTSAGELSE}"
UT7="${TMP}/ut-fas7.txt"
KOD7=0
( cd "${HUVUD}" && ARKIVERA_SESSIONSDOK_POLICY="${POLICY_N3}" ARKIVERA_SESSIONSDOK_SKRIPT="${FEJK_MOTSAGELSE}" bash "${GRIND}" ) > "${UT7}" 2>&1 || KOD7=$?
bekrafta "motsägelsefull \"0 kandidater men inget grönt-omdöme\"-rapport ger exit 2" "${KOD7}" "2"

if grep -qF "motsägelsefull rapport" "${UT7}"; then OBS=ja; else OBS=nej; fi
bekrafta "felmeddelandet namnger motsägelsen som orsak" "${OBS}" "ja"

echo
echo "── Resultat ──"
if [[ "${FEL}" -eq 0 ]]; then
  echo "ALLA PÅSTÅENDEN HÖLL"
  exit 0
fi
echo "${FEL} PÅSTÅENDEN FÖLL"
exit 1
