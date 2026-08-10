#!/usr/bin/env bash
# scripts/check-sessionsdok-fonster.sh — natt-grinden för ADR-099s rullande
# fönster (TASK-158.4).
#
# VAD DEN PRÖVAR: att tasks/sessions/-roten ryms inom det rullande fönstret
#   (ADR-099 Beslut 1–2, TASK-158.1) — dvs att scripts/arkivera-sessionsdok.sh
#   (TASK-158.2) i TORRKÖRNING inte pekar ut några arkiv-kandidater. Gör den
#   det betyder det att roten VUXIT FÖRBI fönstret utan att någon kört
#   skriptet med --utfor — precis den drift PRD `task-158` § användarberättelse
#   5 beskriver ("larmar när roten överskrider fönstret, så att drift upptäcks
#   utan mänsklig bevakning").
#
# VARFÖR DEN INTE DUPLICERAR KLASSIFICERINGEN: de fyra skydden, sorteringen
#   och fönstertalet N lever redan i arkivera-sessionsdok.sh, som redan läser
#   N ur .arkivera-sessionsdok-policy.conf — SAMMA fil denna grind source:ar
#   för att redovisa N i sin egen rapport (AC #1: "ingen duplicerad konstant").
#   En andra implementation av klassificeringen hade varit precis den sortens
#   spekulativa duplicering dubbelriktad-över-engineering-vakten (hub-CLAUDE.md
#   § Instruktioner) avvisar: skriptet finns redan, är redan tvåsidigt testat
#   (TASK-158.2: 30/30 i scripts/test-arkivera-sessionsdok.sh) och kör redan
#   torrkörning som default-säkring. Denna grind anropar det och läser dess
#   rapport — den lägger till BESLUTET (grönt/drift/anropsfel), inte en ny
#   klassificering.
#
# BESLUTET (delegerat till arkivera-sessionsdok.shs torrkörning):
#   0 arkiv-kandidater   → GRÖNT.  Roten ryms inom fönstret.
#   >0 arkiv-kandidater  → DRIFT.  Roten har vuxit förbi fönstret — någon
#                           behöver köra `arkivera-sessionsdok.sh --utfor`.
#   underliggande skript svarar inte exit 0, eller dess rapport går inte att
#   tolka (varken "inga arkiv-kandidater" eller en tolkbar "Skulle arkiveras:
#   N"-rad hittas) → ANROPSFEL. Fail-closed: roten är OPRÖVAD, aldrig "grön av
#   brist på bevis" — samma hållning som check-backlog-closure.sh,
#   check-pausade-sessioner.sh och check-nattvakt-dedup.sh.
#
# ═══ EXIT-KODERNA — samma tvåkoders-disciplin som repots övriga natt-grindar ═══
#   exit 0 = GRÖNT. Roten ryms inom fönstret.
#   exit 1 = DRIFT. Roten har vuxit förbi fönstret — arkiv-kandidater finns.
#            Åtgärd: kör `scripts/arkivera-sessionsdok.sh --utfor`.
#   exit 2 = ANROPSFEL. Det underliggande skriptet svarade inte exit 0, eller
#            dess rapport gick inte att tolka, eller policy-/skript-filen
#            saknas. Roten är OPRÖVAD — åtgärda grinden/skriptet/policyn,
#            aldrig roten på grund av denna kod ensam.
#
# ANVÄNDNING:
#   bash scripts/check-sessionsdok-fonster.sh
#   ARKIVERA_SESSIONSDOK_SKRIPT=<path>   åsidosätt vilket arkiverings-skript
#                                        som anropas (testriggen pekar på en
#                                        fejkad variant för anropsfels-fallen)
#   ARKIVERA_SESSIONSDOK_POLICY=<path>   åsidosätt policy-filen — VIDAREBE-
#                                        FORDRAS till det underliggande
#                                        skriptet OCH source:as här för N-
#                                        redovisningen (samma env-var
#                                        arkivera-sessionsdok.sh själv läser,
#                                        ingen ny variabel — AC #1).
#
# Testsvit: scripts/test-check-sessionsdok-fonster.sh (tvåsidigt bevis: rött
#   mot fixtur som överskrider fönstret, grönt mot fixtur inom fönstret, plus
#   fail-closed-grenar: saknat skript, saknad/tom policy, otolkbar rapport).
#
# Källa: backlog/tasks/task-158.4 · docs/decisions/ADR-099-…md ·
#        scripts/arkivera-sessionsdok.sh (den prövade klassificeringen) ·
#        .github/workflows/nightly.yml (larmkedjans befintliga form) ·
#        scripts/check-pausade-sessioner.sh / check-backlog-closure.sh /
#        check-nattvakt-dedup.sh (förebild: exit-kods-disciplin, KOD=$?-
#        fångst separat från utdata)
# Etablerad: TASK-158.4, 2026-08-10
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARKIVERA_SESSIONSDOK_SKRIPT="${ARKIVERA_SESSIONSDOK_SKRIPT:-${SCRIPT_DIR}/arkivera-sessionsdok.sh}"
ARKIVERA_SESSIONSDOK_POLICY="${ARKIVERA_SESSIONSDOK_POLICY:-${SCRIPT_DIR}/../.arkivera-sessionsdok-policy.conf}"

anropsfel() {
  printf '::error::check-sessionsdok-fonster: ANROPSFEL — %s\n' "$1" >&2
  printf '   Roten är OPRÖVAD. Åtgärda grinden/skriptet/policyn — inte roten.\n' >&2
  exit 2
}

[[ -f "${ARKIVERA_SESSIONSDOK_SKRIPT}" ]] || anropsfel "hittar inte arkiverings-skriptet ${ARKIVERA_SESSIONSDOK_SKRIPT}."
[[ -f "${ARKIVERA_SESSIONSDOK_POLICY}" ]] || anropsfel "policyfilen ${ARKIVERA_SESSIONSDOK_POLICY} saknas."

# Läs SAMMA policy-konfig som skriptet, bara för N-redovisningen i denna
# grinds egen rapport (AC #1). Beslutet nedan delegeras helt till
# arkivera-sessionsdok.sh, som läser filen SJÄLVSTÄNDIGT (env-varen
# vidarebefordras oförändrad) — det här är samma fil, samma variabelnamn,
# läst en gång till för att redovisas, inte en ny konstant.
ARKIVERA_SESSIONSDOK_FONSTER=""
# shellcheck source=/dev/null
source "${ARKIVERA_SESSIONSDOK_POLICY}" || anropsfel "policyfilen ${ARKIVERA_SESSIONSDOK_POLICY} gick inte att läsa."

echo "═══ SESSIONSDOK-FÖNSTER — DRIFT-GRIND (ADR-099) ═══"
echo "Policy-fil: ${ARKIVERA_SESSIONSDOK_POLICY}"
echo "Fönster (N): ${ARKIVERA_SESSIONSDOK_FONSTER:-<osatt>}"
echo "Skript:      ${ARKIVERA_SESSIONSDOK_SKRIPT}"
echo

# KOD fångas SEPARAT från utdata (samma idiom som nightly-watchdog.yml:s
# dedup-anrop: `dedup_ut=$(...) || dedup_kod=$?`) — en pipe till tail/head
# hade läst FEL kommandos exitkod (L440-klassen).
KOD=0
UT="$(ARKIVERA_SESSIONSDOK_POLICY="${ARKIVERA_SESSIONSDOK_POLICY}" bash "${ARKIVERA_SESSIONSDOK_SKRIPT}" 2>&1)" || KOD=$?

echo "${UT}"
echo

if [[ "${KOD}" -ne 0 ]]; then
  anropsfel "arkivera-sessionsdok.sh (torrkörning) avslutade med exit ${KOD} i stället för 0 — se rapporten ovan."
fi

if grep -qF "Roten ryms redan inom fönstret — inga arkiv-kandidater." <<< "${UT}"; then
  echo "GRÖNT — roten ryms inom fönstret (N=${ARKIVERA_SESSIONSDOK_FONSTER})."
  exit 0
fi

# Extraktion via bash-regex på EN funnen rad, inte en grep|grep-kedja — undviker
# pipe-maskering (SC2312) och GNU-only "-oP" (BSD grep på macOS saknar det;
# skriptet ska vara körbart identiskt lokalt och i CI:s ubuntu-runner).
RAD=""
RAD="$(grep -E '^Skulle arkiveras:[[:space:]]+[0-9]+$' <<< "${UT}" || true)"

if [[ -z "${RAD}" ]]; then
  anropsfel "rapporten innehöll varken \"inga arkiv-kandidater\" eller en tolkbar \"Skulle arkiveras:\"-rad — formatet har drivit isär från vad grinden förstår."
fi

ANTAL=""
if [[ "${RAD}" =~ ([0-9]+)$ ]]; then
  ANTAL="${BASH_REMATCH[1]}"
fi

if [[ -z "${ANTAL}" ]]; then
  anropsfel "kunde inte extrahera ett tal ur raden \"${RAD}\"."
fi

if [[ "${ANTAL}" -eq 0 ]]; then
  anropsfel "\"Skulle arkiveras:\"-raden angav 0 men \"inga arkiv-kandidater\"-meningen saknades — motsägelsefull rapport, inte en giltig grön."
fi

echo "::error::DRIFT (exit 1): roten bär ${ANTAL} arkiv-kandidat(er) — fönstret (N=${ARKIVERA_SESSIONSDOK_FONSTER}) är överskridet."
echo "Åtgärd: kör 'scripts/arkivera-sessionsdok.sh --utfor' och landa flytten + länkomskrivningen."
exit 1
