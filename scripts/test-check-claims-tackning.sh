#!/usr/bin/env bash
#
# test-check-claims-tackning.sh — self-test för check-claims-tackning.sh
# (TASK-139).
#
# ÅTTA FALL: T1 fullständigt täckt manifest (exit 0) · T2 onämnd registerpost
# (S75-gap-klassen, exit 1) · T3 dubbel-ägd post utan fasat-markering
# (exit 2) · T4 trasig JSON (exit 3) · T5 config saknas (exit 3) · T6
# manifest saknas (exit 3) · T7 REGRESSION — "fasat" tillåter flera
# pipelines på samma post utan att räknas som konflikt (exit 0) · T8
# ogiltigt dispositionsvärde räknas som gap, inte som tyst godkänt (exit 1).
#
# T2+T3+T4 är de tre AC-krävda brist-fixturerna. T7 är den som gör grinden
# ANVÄNDBAR i stället för bara sträng: ett medvetet fasat-schema (flera
# pipelines delar en yta) ska INTE fällas som en ägarskaps-konflikt — bara
# oplanerad dubbel-ägarskap ska.
#
# Test-isolering: EGEN mini-config (3 påhittade registerposter) i en temp-
# katalog, återställd via trap — INTE repots riktiga
# .claims-tackning-policy.conf (8 poster). Samma isoleringsprincip som
# test-check-permissions-claims.sh: testsviten ska överleva att registret
# växer eller ändras utan att brytas.
#
# Användning: bash scripts/test-check-claims-tackning.sh
# Exit 0 om alla åtta fall passerar, annars 1.
#
# Källa: ADR-073 Amendering 3 punkt 1 (S75: 15/21 kort GAP) ·
# plugins/marcus-system/skills/work-batch/SKILL.md § "Parallell form"
# delta 1.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GATE="${REPO_ROOT}/scripts/check-claims-tackning.sh"
TEST_DIR="$(mktemp -d "${TMPDIR:-/tmp}/test-claims-tackning.XXXXXX")"
trap 'rm -rf "${TEST_DIR}"' EXIT

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

# Bygg en isolerad värld: mini-config + manifest.
# $1 = manifest-innehåll (skrivs som manifest.json, eller "" för att hoppa)
# $2 = skriv config? (ja/nej, default ja)
build_world() {
  rm -rf "${TEST_DIR:?}"
  mkdir -p "${TEST_DIR}"
  if [[ -n "$1" ]]; then
    printf '%s\n' "$1" > "${TEST_DIR}/manifest.json"
  fi
  if [[ "${2:-ja}" == "ja" ]]; then
    cat > "${TEST_DIR}/.claims-tackning-policy.conf" <<'CONF'
# shellcheck shell=bash
# shellcheck disable=SC2034
SHARED_SURFACE_NAMES=("domain-schemas" "shared-functions" "style-tokens")
SHARED_SURFACE_GLOBS=("src/domain/**" "supabase/functions/_shared/**" "src/styles/tokens/**")
CONF
  fi
}

run_gate() {
  (cd "${TEST_DIR}" && bash "${GATE}" manifest.json >/dev/null 2>&1; echo $?)
}

run_gate_out() {
  (cd "${TEST_DIR}" && bash "${GATE}" manifest.json 2>&1; echo "EXIT:$?")
}

printf '\ntest-check-claims-tackning — åtta fall\n'
printf '%.0s─' {1..70}; printf '\n'

# T1 — fullständigt täckt: två pipelines, varje registerpost har en giltig
# disposition hos minst en av dem.
build_world '{
  "pipelines": {
    "task-8.1": {
      "claims": ["src/domain/schemas/foo.ts"],
      "dispositions": {
        "domain-schemas": "enda-agare",
        "shared-functions": "ej-berord",
        "style-tokens": "ej-berord"
      }
    },
    "task-9.1": {
      "claims": ["src/styles/tokens/bar.css"],
      "dispositions": {
        "domain-schemas": "ej-berord",
        "shared-functions": "ej-berord",
        "style-tokens": "enda-agare"
      }
    }
  }
}'
ec="$(run_gate)"
report "T1 fullständigt täckt manifest → exit 0" 0 "${ec}"

# T2 — onämnd post: "style-tokens" saknas HELT (S75-gap-klassen).
build_world '{
  "pipelines": {
    "task-8.1": {
      "claims": ["src/domain/schemas/foo.ts"],
      "dispositions": {
        "domain-schemas": "enda-agare",
        "shared-functions": "ej-berord"
      }
    }
  }
}'
ec="$(run_gate)"
report "T2 onämnd registerpost (S75-gap) → exit 1" 1 "${ec}"

# T3 — dubbel-ägd: två pipelines hävdar BÅDA enda-agare över domain-schemas,
# ingen har fasat.
build_world '{
  "pipelines": {
    "task-8.1": {
      "claims": ["src/domain/schemas/foo.ts"],
      "dispositions": {
        "domain-schemas": "enda-agare",
        "shared-functions": "ej-berord",
        "style-tokens": "ej-berord"
      }
    },
    "task-9.1": {
      "claims": ["src/domain/schemas/bar.ts"],
      "dispositions": {
        "domain-schemas": "enda-agare",
        "shared-functions": "ej-berord",
        "style-tokens": "ej-berord"
      }
    }
  }
}'
ec="$(run_gate)"
report "T3 dubbel-ägd post utan fasat → exit 2" 2 "${ec}"

# T4 — trasig JSON.
build_world '{ "pipelines": { "task-8.1": { "claims": [] , }'
ec="$(run_gate)"
report "T4 trasig JSON → exit 3" 3 "${ec}"

# T5 — config saknas.
build_world '{
  "pipelines": {
    "task-8.1": {
      "claims": [],
      "dispositions": {
        "domain-schemas": "enda-agare",
        "shared-functions": "ej-berord",
        "style-tokens": "ej-berord"
      }
    }
  }
}' nej
ec="$(run_gate)"
report "T5 config saknas → exit 3" 3 "${ec}"

# T6 — manifest saknas (build_world utan innehåll = ingen manifest.json).
build_world ""
ec="$(run_gate)"
report "T6 manifest saknas → exit 3" 3 "${ec}"

# T7 — REGRESSION: "fasat" tillåter flera pipelines på samma post. Två
# pipelines delar domain-schemas via fasat — INTE en konflikt.
build_world '{
  "pipelines": {
    "task-8.1": {
      "claims": ["src/domain/schemas/foo.ts"],
      "dispositions": {
        "domain-schemas": "fasat",
        "shared-functions": "ej-berord",
        "style-tokens": "ej-berord"
      }
    },
    "task-9.1": {
      "claims": ["src/domain/schemas/bar.ts"],
      "dispositions": {
        "domain-schemas": "fasat",
        "shared-functions": "ej-berord",
        "style-tokens": "ej-berord"
      }
    }
  }
}'
ec="$(run_gate)"
report "T7 fasat-schema delat av flera pipelines → grönt (regression)" 0 "${ec}"

# T8 — ogiltigt dispositionsvärde ("kanske") räknas som gap, inte tyst
# godkänt. Endast EN pipeline nämner posten, med ett ogiltigt värde.
build_world '{
  "pipelines": {
    "task-8.1": {
      "claims": ["src/domain/schemas/foo.ts"],
      "dispositions": {
        "domain-schemas": "kanske",
        "shared-functions": "ej-berord",
        "style-tokens": "ej-berord"
      }
    }
  }
}'
out="$(run_gate_out)"
ec="${out##*EXIT:}"
report "T8 ogiltigt dispositionsvärde → gap, exit 1" 1 "${ec}"
ok=0
if printf '%s' "${out}" | grep -q "domain-schemas"; then ok=1; fi
if [[ ${ok} -eq 1 ]]; then
  printf '  ✅ %-58s\n' "T8b gap-meddelandet nämner den felande posten"
  pass=$((pass + 1))
else
  printf '  ❌ %-58s\n' "T8b gap-meddelandet nämner den felande posten"
  fail=$((fail + 1))
fi

printf '%.0s─' {1..70}; printf '\n'
printf '  %d godkända, %d underkända\n\n' "${pass}" "${fail}"
[[ ${fail} -eq 0 ]]
