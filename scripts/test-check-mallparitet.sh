#!/usr/bin/env bash
# test-check-mallparitet.sh — TASK-309.4. Prövar scripts/synka-bilagemallar.mjs
# (den EGNA grinden, se scripts/check-mallparitet.sh) i BÅDA riktningar mot
# en SANDBOXAD fixtur-katalogträd i mktemp — rör ALDRIG repots riktiga
# docs/mallar/bilagor/ eller supabase/functions/_shared/mallar/. Ingen
# nätverkstrafik.
#
# De fyra MALLPARITET_*_DIR-miljövariablerna (synka-bilagemallar.mjs § filhuvud)
# är ENDA syftet de finns för — denna svit.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYNK_SKRIPT="${SCRIPT_DIR}/synka-bilagemallar.mjs"

TMPDIR_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/test-check-mallparitet.XXXXXX")"
trap 'rm -rf "${TMPDIR_ROOT}"' EXIT

PASS=0
FAIL=0

assert_exit() {
  local desc="$1"
  local expected="$2"
  local actual="$3"
  if [[ "${actual}" -eq "${expected}" ]]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: ${desc} (förväntade exit ${expected}, fick ${actual})"
  fi
}

assert_file_exists() {
  local path="$1"
  local desc="$2"
  if [[ -f "${path}" ]]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: ${desc}"
  fi
}

setup_fixture() {
  local dir="$1"
  mkdir -p "${dir}/mallkalla" "${dir}/fonts" "${dir}/public/bilder" "${dir}/malkopia"
  cat > "${dir}/mallkalla/test.html" <<'EOF'
<html><body><p>hej</p><img src="../../../public/bilder/logo.svg" /></body></html>
EOF
  cat > "${dir}/mallkalla/test.css" <<'EOF'
body { color: red; }
EOF
  printf 'FAKE-FONT-BYTES' > "${dir}/fonts/Test-Regular.ttf"
  # Blandad Versal/gemen-del ("BoldItalic") — TASK-309.4 mätte SKARPT att
  # utan versalgräns-splittringen i tillCamelCase gav detta exportnamnet
  # `testBolditalicFontBase64` (gement "i"), medan `_shared/mall-render.ts`s
  # handskrivna import förväntade `testBoldItalicFontBase64` — en mismatch
  # som orsakade ett skarpt `BOOT_ERROR` vid deploy. Se Fall 7 nedan.
  printf 'FAKE-FONT-BYTES-2' > "${dir}/fonts/Test-BoldItalic.ttf"
  cat > "${dir}/public/bilder/logo.svg" <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg"></svg>
EOF
}

run_synk() {
  local dir="$1"
  shift
  MALLPARITET_MALLKALLA_DIR="${dir}/mallkalla" \
    MALLPARITET_FONT_DIR="${dir}/fonts" \
    MALLPARITET_PUBLIC_DIR="${dir}/public" \
    MALLPARITET_MALKOPIA_DIR="${dir}/malkopia" \
    node "${SYNK_SKRIPT}" "$@"
}

# --- Fall 1: sync skapar filerna, --check är grönt direkt efter -----------
DIR1="${TMPDIR_ROOT}/fall1"
setup_fixture "${DIR1}"
run_synk "${DIR1}" > /dev/null
set +e
run_synk "${DIR1}" --check > /dev/null 2>&1
KOD=$?
set -e
assert_exit "Fall 1: --check grönt direkt efter sync" 0 "${KOD}"
assert_file_exists "${DIR1}/malkopia/test.html.ts" "test.html.ts skapades inte"
assert_file_exists "${DIR1}/malkopia/test.css.ts" "test.css.ts skapades inte"
assert_file_exists "${DIR1}/malkopia/Test-Regular.font.ts" "Test-Regular.font.ts skapades inte"
assert_file_exists "${DIR1}/malkopia/logo.image.ts" "logo.image.ts (auto-upptäckt bild) skapades inte"

# --- Fall 1b: exportnamnet splittrar KORREKT på Versal/gemen-gränser -----
# ("BoldItalic" → "BoldItalic", INTE "Bolditalic") — se setup_fixture § notan
# om det skarpa BOOT_ERROR-fyndet. Läser den FAKTISKA modulfilen, inte bara
# att den existerar.
BOLDITALIC_MODUL="${DIR1}/malkopia/Test-BoldItalic.font.ts"
if grep -q "export const testBoldItalicFontBase64" "${BOLDITALIC_MODUL}" 2>/dev/null; then
  PASS=$((PASS + 1))
else
  FAIL=$((FAIL + 1))
  FAKTISKT_EXPORT=$(grep -o 'export const [a-zA-Z0-9_]*' "${BOLDITALIC_MODUL}" 2>/dev/null || true)
  echo "FAIL: Fall 1b — förväntade exportnamnet 'testBoldItalicFontBase64' (Versal/gemen-gränsen bevarad), fick: ${FAKTISKT_EXPORT:-FILEN SAKNAS}"
fi

# --- Fall 2: RIKTNING 1 — mutera den GENERERADE filen → --check FÄLLER ----
DIR2="${TMPDIR_ROOT}/fall2"
setup_fixture "${DIR2}"
run_synk "${DIR2}" > /dev/null
echo '// tampered' >> "${DIR2}/malkopia/test.html.ts"
set +e
run_synk "${DIR2}" --check > /dev/null 2>&1
KOD=$?
set -e
assert_exit "Fall 2: manipulerad genererad fil fälls" 1 "${KOD}"

# --- Fall 3: RIKTNING 2 — mutera KÄLLAN utan att synka om → --check FÄLLER -
DIR3="${TMPDIR_ROOT}/fall3"
setup_fixture "${DIR3}"
run_synk "${DIR3}" > /dev/null
echo '<!-- drift -->' >> "${DIR3}/mallkalla/test.html"
set +e
run_synk "${DIR3}" --check > /dev/null 2>&1
KOD=$?
set -e
assert_exit "Fall 3: källdrift utan omsynk fälls" 1 "${KOD}"

# --- Fall 4: FÖRÄLDRALÖS genererad fil (källan borttagen) → --check FÄLLER -
DIR4="${TMPDIR_ROOT}/fall4"
setup_fixture "${DIR4}"
run_synk "${DIR4}" > /dev/null
rm "${DIR4}/mallkalla/test.css"
set +e
run_synk "${DIR4}" --check > /dev/null 2>&1
KOD=$?
set -e
assert_exit "Fall 4: föräldralös genererad fil (borttagen källa) fälls" 1 "${KOD}"

# --- Fall 5: omsynk efter källdrift läker paritet-brottet -----------------
DIR5="${TMPDIR_ROOT}/fall5"
setup_fixture "${DIR5}"
run_synk "${DIR5}" > /dev/null
echo '<!-- ny kommentar -->' >> "${DIR5}/mallkalla/test.html"
run_synk "${DIR5}" > /dev/null
set +e
run_synk "${DIR5}" --check > /dev/null 2>&1
KOD=$?
set -e
assert_exit "Fall 5: omsynk efter källändring återställer paritet" 0 "${KOD}"

# --- Fall 6: byte-fidelity — avkodat innehåll är EXAKT källan -------------
DIR6="${TMPDIR_ROOT}/fall6"
setup_fixture "${DIR6}"
run_synk "${DIR6}" > /dev/null
DECODED_HTML=$(node -e "
const fs = require('node:fs');
const mod = fs.readFileSync('${DIR6}/malkopia/test.html.ts', 'utf8');
const m = mod.match(/= (\"[\\s\\S]*\");\\n\$/);
process.stdout.write(JSON.parse(m[1]));
")
SOURCE_HTML=$(cat "${DIR6}/mallkalla/test.html")
if [[ "${DECODED_HTML}" == "${SOURCE_HTML}" ]]; then
  PASS=$((PASS + 1))
else
  FAIL=$((FAIL + 1))
  echo "FAIL: avkodat HTML-innehåll matchar inte källan byte för byte"
fi

echo ""
echo "test-check-mallparitet.sh: ${PASS} passed, ${FAIL} failed"
if [[ "${FAIL}" -gt 0 ]]; then
  exit 1
fi
