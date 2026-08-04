#!/usr/bin/env bash
#
# test-check-merge-tree.sh — self-test för check-merge-tree.sh (TASK-139).
#
# SEX FALL: T1 konfliktfri divergens (exit 0) · T2 äkta textkonflikt i en
# icke-mandat-fil (exit 1 + HALT-klassning) · T3 konflikt ENBART i en
# mandat-berättigad fil (exit 1 + mandat-berättigad-klassning) · T4 scratch-
# repots working tree/HEAD är OFÖRÄNDRAT efter samtliga körningar · T5 inga
# argument (exit 3) · T6 config saknas (exit 3).
#
# T2 och T3 är de som gör grinden meningsfull i stället för att bara vara
# ett `git merge-tree`-eko: en konflikt i vanlig kod ska HALTa, en konflikt
# begränsad till det bundna mandatets ytor (ADR-073 Amendering 3 punkt 3)
# ska klassificeras som mekaniskt lösningsbar — utan att skriptet löser den
# själv (det är orkestratorns/agentens jobb, inte grindens).
#
# Test-isolering: en BARE "origin" + en klon i en temp-katalog, återställd
# via trap. INGEN ändring av real-repo eller riktiga fjärrar — grinden
# fetchar bara mot den lokala bara-katalogen, inget nätverk krävs.
#
# Användning: bash scripts/test-check-merge-tree.sh
# Exit 0 om alla fall passerar, annars 1.
#
# Källa: ADR-073 Amendering 3 punkt 3 · plugins/marcus-system/skills/
# work-batch/SKILL.md § "Parallell form" delta 4 · git-scm.com/docs/
# git-merge-tree.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GATE="${REPO_ROOT}/scripts/check-merge-tree.sh"
CONFIG_SRC="${REPO_ROOT}/.merge-tree-mandat-policy.conf"

TEST_DIR="$(mktemp -d "${TMPDIR:-/tmp}/test-merge-tree.XXXXXX")"
trap 'rm -rf "${TEST_DIR}"' EXIT

export GIT_AUTHOR_NAME=test GIT_AUTHOR_EMAIL=test@example.invalid
export GIT_COMMITTER_NAME=test GIT_COMMITTER_EMAIL=test@example.invalid

pass=0
fail=0

report() {
  local name="$1" expected="$2" actual="$3"
  if [[ "${expected}" == "${actual}" ]]; then
    printf '  ✅ %-58s exit=%s\n' "${name}" "${actual}"
    pass=$((pass + 1))
  else
    printf '  ❌ %-58s exit=%s (väntat %s)\n' "${name}" "${actual}" "${expected}"
    fail=$((fail + 1))
  fi
}

report_bool() {
  local name="$1" ok="$2"
  if [[ "${ok}" -eq 1 ]]; then
    printf '  ✅ %-58s\n' "${name}"
    pass=$((pass + 1))
  else
    printf '  ❌ %-58s\n' "${name}"
    fail=$((fail + 1))
  fi
}

# --- Bygg en isolerad värld: bare "origin" + klon + tre divergerande grenar
BARE="${TEST_DIR}/origin.git"
git init -q --bare -b main "${BARE}" >/dev/null

REPO="${TEST_DIR}/repo"
git clone -q "${BARE}" "${REPO}" >/dev/null 2>&1
cp "${CONFIG_SRC}" "${REPO}/.merge-tree-mandat-policy.conf"

printf 'a1\na2\n' > "${REPO}/a.txt"
mkdir -p "${REPO}/docs/specs"
printf 'spec1\n' > "${REPO}/docs/specs/x.md"
git -C "${REPO}" add . >/dev/null
git -C "${REPO}" commit -qm base >/dev/null
git -C "${REPO}" push -q origin main >/dev/null 2>&1

# T1-grenen: konfliktfritt tillägg.
git -C "${REPO}" switch -qc feature-clean main >/dev/null
printf 'newfile\n' > "${REPO}/newfile.txt"
git -C "${REPO}" add newfile.txt >/dev/null
git -C "${REPO}" commit -qm clean-add >/dev/null

# T2-grenen: ändrar a.txt — INTE en mandat-berättigad yta.
git -C "${REPO}" switch -qc feature-conflict main >/dev/null
printf 'a1\nFEAT-A\n' > "${REPO}/a.txt"
git -C "${REPO}" commit -qam feature-change >/dev/null

# T3-grenen: ändrar ENDAST docs/specs/x.md — mandat-berättigad
# (.merge-tree-mandat-policy.conf: "^docs/specs/").
git -C "${REPO}" switch -qc feature-mandate main >/dev/null
printf 'spec1\nFEATURE-SPEC\n' > "${REPO}/docs/specs/x.md"
git -C "${REPO}" commit -qam feature-spec-change >/dev/null

# main går vidare OCH pushas — det är DENNA push grinden måste se via sin
# egen `git fetch` (färskhets-kravet), inte en cachad remote-tracking-ref.
git -C "${REPO}" switch -q main >/dev/null
printf 'a1\nMAIN-A\n' > "${REPO}/a.txt"
printf 'spec1\nMAIN-SPEC\n' > "${REPO}/docs/specs/x.md"
git -C "${REPO}" commit -qam main-change >/dev/null
git -C "${REPO}" push -q origin main >/dev/null 2>&1

baseline_head="$(git -C "${REPO}" rev-parse HEAD)"
baseline_branch="$(git -C "${REPO}" branch --show-current)"

run_gate() {
  # $1 = gren. Utdata landar i TEST_DIR/out.txt för efterhands-grep.
  (cd "${REPO}" && bash "${GATE}" "$1" >"${TEST_DIR}/out.txt" 2>&1; echo $?)
}

printf '\ntest-check-merge-tree — sex fall\n'
printf '%.0s─' {1..70}; printf '\n'

# T1 — konfliktfri divergens.
ec="$(run_gate feature-clean)"
report "T1 konfliktfri divergens → exit 0" 0 "${ec}"

# T2 — äkta textkonflikt i a.txt (icke-mandat) → exit 1 + HALT.
ec="$(run_gate feature-conflict)"
report "T2 konflikt i icke-mandat-fil → exit 1" 1 "${ec}"
out="$(cat "${TEST_DIR}/out.txt")"
ok=0
if printf '%s\n' "${out}" | grep -qE 'HALT[[:space:]]+a\.txt'; then ok=1; fi
report_bool "T2b utdata klassificerar a.txt som HALT" "${ok}"

# T3 — konflikt ENBART i docs/specs/x.md (mandat-berättigad) → exit 1 +
# mandat-berättigad, och INGEN HALT-rad (annars vore mandatet meningslöst).
ec="$(run_gate feature-mandate)"
report "T3 konflikt ENBART i mandat-fil → exit 1" 1 "${ec}"
out="$(cat "${TEST_DIR}/out.txt")"
ok=0
if printf '%s\n' "${out}" | grep -qE 'mandat-berättigad[[:space:]]+docs/specs/x\.md'; then ok=1; fi
report_bool "T3b utdata klassificerar docs/specs/x.md som mandat-berättigad" "${ok}"
ok=0
if ! printf '%s\n' "${out}" | grep -q 'HALT'; then ok=1; fi
report_bool "T3c ingen HALT-rad när ALLA konfliktfiler är mandat-berättigade" "${ok}"

# T4 — working tree/HEAD OFÖRÄNDRAT efter T1–T3. --write-tree ska ALDRIG
# röra arbetsträd, index eller HEAD (per definition — se skriptets header).
current_head="$(git -C "${REPO}" rev-parse HEAD)"
current_branch="$(git -C "${REPO}" branch --show-current)"
porcelain="$(git -C "${REPO}" status --porcelain)"
ok=0
if [[ "${current_head}" == "${baseline_head}" \
  && "${current_branch}" == "${baseline_branch}" \
  && -z "${porcelain}" ]]; then
  ok=1
fi
report_bool "T4 scratch-repots working tree/HEAD oförändrat efter körning" "${ok}"

# T5 — inga argument → exit 3 (användningsfel, inte en tyst noll).
ec="$(cd "${REPO}" && bash "${GATE}" >/dev/null 2>&1; echo $?)"
report "T5 inga argument → exit 3" 3 "${ec}"

# T6 — config saknas → exit 3 (konfigurationsfel, inte falskt grönt).
rm -f "${REPO}/.merge-tree-mandat-policy.conf"
ec="$(cd "${REPO}" && bash "${GATE}" feature-clean >/dev/null 2>&1; echo $?)"
report "T6 config saknas → exit 3" 3 "${ec}"

printf '%.0s─' {1..70}; printf '\n'
printf '  %d godkända, %d underkända\n\n' "${pass}" "${fail}"
[[ ${fail} -eq 0 ]]
