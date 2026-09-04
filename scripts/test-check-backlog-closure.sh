#!/usr/bin/env bash
# test-check-backlog-closure.sh — grindens egen testsvit.
#
# Kör check-backlog-closure.sh mot STUBBAT backlog-CLI (fixtur-data), aldrig mot
# repots verkliga kort. Sviten ska kunna köras utan att någonting installeras och
# utan nätverk.
#
# VARFÖR SVITEN FINNS: en grind som aldrig setts fälla är inte bevisad, den är
# hoppfull. Den lärdomen kostade repot ett halvt dygn 2026-07-29, när restlistans
# statuskontroll visade sig vara strukturellt blind för en hel radklass efter att
# ha "fungerat" i ett dygn. Varje fall nedan finns därför i PAR: ett som ska
# fälla och ett som inte ska.
#
# Portabilitet: ingen mapfile/readarray (bash 3.2 på macOS saknar dem).

set -uo pipefail
cd "$(dirname "$0")/.." || exit 2

GRIND="scripts/check-backlog-closure.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

# Etikettnamnet som fixtur-policyn deklarerar. Sviten sätter det SJÄLV och ärver
# det aldrig från repots .backlog-closure-policy.conf — annars hade ett byte av
# projektets etikettnamn tyst ändrat vad testerna påstår sig bevisa.
ETIKETT="intentionally-open"

# Karensen som fixtur-policyn deklarerar. Sviten sätter den SJÄLV av samma skäl
# som etiketten: ärvdes den från repots policy hade ett byte av projektets
# karens tyst ändrat vad testerna påstår sig bevisa.
KARENS_H=24

# Stängningsformernas värden (TASK-281). Sviten sätter dem SJÄLV av exakt samma
# skäl som etiketten och karensen ovan: ärvdes de från repots policy hade ett
# byte av projektets mönster tyst ändrat vad testerna påstår sig bevisa.
HARLEDD_MONSTER="CI grön per jobb"
PEKARE_MONSTER="Landning:\s*PR #[0-9]+"
AVSTADD_ETIKETT="intentionally-unchecked"
AVSTADD_MARKOR="OBOCKAT MED AVSIKT:"

# Tidsstämplar för karens-fallen. Kortens tidsstämplar skrivs i UTC, så FARSK
# räknas i UTC — annars hade en maskin i CEST fått en "färsk" stämpel som ligger
# två timmar i framtiden och testet blivit sant av fel skäl.
GAMMAL="2020-01-01 00:00"
FARSK="$(date -u +'%Y-%m-%d %H:%M')"

PASS=0
FAIL=0

# Bygger ett stubbat `backlog`-kommando OCH den kort-yta grinden numera läser.
# $1 = katalog med fixturer.
#
# ═══ VARFÖR STUBBEN GÖR TVÅ SAKER SEDAN TASK-238 ═══
#
# Grinden läste förut `task <id> --plain` per kort. Sedan TASK-238 (ADR-117)
# hämtas fakta i ETT svep: metadata och relationer ur `task list --json`,
# AC/DoD-kryssrutorna ur task-FILERNA, plus en korsvalidering mot
# `task view --json`. Stubben måste därför servera BÅDA ytorna.
#
# FIXTUR-FORMATET ÄR OFÖRÄNDRAT — med flit. Sviten bär 50 fall vars värde
# ligger i vad de PÅSTÅR, inte i hur de lagras; att skriva om varje fall hade
# bytt ut bevisningen samtidigt som koden ändrades, vilket är exakt hur en
# svit tyst slutar pröva det den säger. Konverteringen sker därför i
# plumbningen: fixtur-texten (en mini-`--plain`-render) översätts här till
# task-filer + JSON, och testfallen står orörda.
skapa_stub() {
    local dir="$1"
    mkdir -p "${dir}/fixturer" "${dir}/tasks" "${dir}/view"
    node - "${dir}" <<'KONV'
// Fixtur-text -> task-filer (.md med AC/DOD-markörer) + JSON-svar.
const fs = require("node:fs");
const path = require("node:path");
const dir = process.argv[2];
const fixDir = path.join(dir, "fixturer");
const filer = fs.existsSync(fixDir)
    ? fs.readdirSync(fixDir).filter((f) => f.endsWith(".txt"))
    : [];

const kort = [];
for (const f of filer) {
    const id = `TASK-${path.basename(f, ".txt")}`;
    const rader = fs.readFileSync(path.join(fixDir, f), "utf8").split("\n");
    let status = "";
    let labels = [];
    let updated = null;
    let created = null;
    const barn = [];
    const ac = [];
    const dod = [];
    // Prosa-sektionerna (TASK-281). Pekaren söks ENDAST i Final Summary och
    // markören i NOTES ∪ FINAL_SUMMARY — beskrivningen finns med just för att
    // den avgränsningen ska gå att pröva, inte bara påstås.
    const beskrivning = [];
    const notes = [];
    const slutrad = [];
    let block = "";
    for (const r of rader) {
        // ALLA rubrik-igenkänningar ligger före ALL insamling. Låg man
        // prosa-insamlingen först hade en `Acceptance Criteria:`-rubrik som
        // följde efter `Final Summary:` svalts av slutraden — och fixturen
        // hade tyst tappat sina AC utan att något test blev rött.
        if (/^Status:/.test(r)) {
            // Glyfen (✔/○/✖) är CLI:ts DISPLAY-form; JSON bär det rena värdet.
            status = r.replace(/^Status:\s*/, "").replace(/^[^\p{L}]+/u, "").trim();
            continue;
        }
        if (/^Labels:/.test(r)) {
            labels = r.replace(/^Labels:\s*/, "").split(",").map((s) => s.trim()).filter(Boolean);
            continue;
        }
        if (/^Updated:/.test(r)) { updated = r.replace(/^Updated:\s*/, "").trim(); continue; }
        if (/^Created:/.test(r)) { created = r.replace(/^Created:\s*/, "").trim(); continue; }
        if (/^Subtasks \(/.test(r)) { block = "barn"; continue; }
        if (/^Acceptance Criteria:/.test(r)) { block = "ac"; continue; }
        if (/^Definition of Done:/.test(r)) { block = "dod"; continue; }
        if (/^Description:/.test(r)) { block = "beskrivning"; continue; }
        if (/^Implementation Notes:/.test(r)) { block = "notes"; continue; }
        if (/^Final Summary:/.test(r)) { block = "slutrad"; continue; }
        if (block === "beskrivning") { beskrivning.push(r); continue; }
        if (block === "notes") { notes.push(r); continue; }
        if (block === "slutrad") { slutrad.push(r); continue; }
        if (block === "barn") {
            const m = r.match(/^- (TASK-[0-9.]+)/);
            if (m) { barn.push(m[1]); continue; }
            block = "";
        }
        const kryss = r.match(/^- \[([ x])\] (.*)$/);
        if (!kryss) continue;
        const post = { checked: kryss[1] === "x", text: kryss[2] };
        if (block === "ac") ac.push(post);
        if (block === "dod") dod.push(post);
    }
    const trim = (rader) => rader.join("\n").replace(/^\n+|\n+$/g, "");
    kort.push({
        id, status, labels, updated, created, barn, ac, dod,
        beskrivning: trim(beskrivning), notes: trim(notes), slutrad: trim(slutrad),
    });
}

// Förälder/barn deklareras i fixturen på FÖRÄLDERN (Subtasks-blocket) men bärs
// i JSON av BARNET (parentTaskId) — samma inversion som verkligheten.
const forald = new Map();
for (const k of kort) for (const b of k.barn) forald.set(b, k.id);

const iso = (s) => (s ? `${s.replace(" ", "T")}:00Z` : null);
const blk = (poster) =>
    poster.map((p, i) => `- [${p.checked ? "x" : " "}] #${i + 1} ${p.text.replace(/^#\d+\s*/, "")}`).join("\n");

for (const k of kort) {
    const fm = [
        "---",
        `id: ${k.id}`,
        `status: ${k.status}`,
        `labels: [${k.labels.join(", ")}]`,
        k.created ? `created_date: '${k.created}'` : null,
        k.updated ? `updated_date: '${k.updated}'` : null,
        forald.has(k.id) ? `parent_task_id: ${forald.get(k.id)}` : null,
        "---",
        "",
    ].filter((r) => r !== null);
    const kropp = [];
    if (k.ac.length > 0) {
        kropp.push("## Acceptance Criteria", "<!-- AC:BEGIN -->", blk(k.ac), "<!-- AC:END -->", "");
    }
    if (k.dod.length > 0) {
        kropp.push("## Definition of Done", "<!-- DOD:BEGIN -->", blk(k.dod), "<!-- DOD:END -->", "");
    }
    // Prosa-sektionerna skrivs med verktygets egna SECTION-markörer — samma
    // kontrakt grinden läser i verkligheten. En sektion utan innehåll skrivs
    // inte alls, precis som CLI:t gör.
    const sektion = (rubrik, namn, text) => {
        if (!text) return;
        kropp.push(`## ${rubrik}`, `<!-- SECTION:${namn}:BEGIN -->`, text, `<!-- SECTION:${namn}:END -->`, "");
    };
    sektion("Description", "DESCRIPTION", k.beskrivning);
    sektion("Implementation Notes", "NOTES", k.notes);
    sektion("Final Summary", "FINAL_SUMMARY", k.slutrad);
    fs.writeFileSync(path.join(dir, "tasks", `task-${k.id.replace("TASK-", "")}.md`),
        `${fm.join("\n")}${kropp.join("\n")}`);
    fs.writeFileSync(path.join(dir, "view", `${k.id.replace("TASK-", "")}.json`),
        JSON.stringify({
            schemaVersion: 1, kind: "task",
            task: {
                id: k.id, status: k.status, acceptanceCriteria: k.ac, definitionOfDone: k.dod,
                description: k.beskrivning, implementationNotes: k.notes, finalSummary: k.slutrad,
            },
        }));
}

fs.writeFileSync(path.join(dir, "lista.json"), JSON.stringify({
    schemaVersion: 1, kind: "task-list",
    tasks: kort.map((k) => ({
        id: k.id, title: "fixtur", status: k.status, labels: k.labels,
        parentTaskId: forald.get(k.id) || null,
        createdAt: iso(k.created), updatedAt: iso(k.updated),
    })),
}));
KONV
    cat > "${dir}/backlog" <<'STUB'
#!/usr/bin/env bash
ROT="$(dirname "$0")"
if [[ "${1:-}" == "task" && "${2:-}" == "list" ]]; then
    if [[ "${*}" == *--json* ]]; then cat "${ROT}/lista.json"; exit 0; fi
    for f in "${ROT}"/fixturer/*.txt; do
        [[ -e "$f" ]] || continue
        echo "  TASK-$(basename "$f" .txt) - fixtur"
    done
    exit 0
fi
if [[ "${1:-}" == "task" && "${2:-}" == "view" && -n "${3:-}" ]]; then
    cat "${ROT}/view/${3}.json" 2>/dev/null; exit 0
fi
if [[ "${1:-}" == "task" && -n "${2:-}" ]]; then
    if [[ "${*}" == *--json* ]]; then cat "${ROT}/view/${2}.json" 2>/dev/null; exit 0; fi
    cat "${ROT}/fixturer/${2}.txt" 2>/dev/null
    exit 0
fi
exit 1
STUB
    chmod +x "${dir}/backlog"
}

# Ger en fixtur en GAMMAL tidsstämpel om den inte redan bär en egen.
#
# VARFÖR DEFAULTEN ÄR GAMMAL OCH INTE FÄRSK: varje test som fanns före karensen
# prövar en invariant, inte ett tidsfönster. En färsk default hade satt dem alla
# innanför karensen och gjort dem gröna av fel skäl — sviten hade fortsatt visa
# 30 gröna medan den slutat pröva det den påstår. En gammal default håller varje
# äldre test på exakt den fråga det ställdes för, och karens-fallen nedan sätter
# sin stämpel explicit.
med_tid() {
    if grep -qE '^(Updated|Created):' <<< "$1"; then
        printf '%s\n' "$1"
    else
        printf 'Updated: %s\n%s\n' "${GAMMAL}" "$1"
    fi
}

# Bygger fixtur-katalog + stub + policy. $1 = katalog, därefter PAR av: id innehåll
bygg_fixturer() {
    local d="$1"; shift
    mkdir -p "${d}/fixturer"
    while [[ "$#" -ge 2 ]]; do
        med_tid "$2" > "${d}/fixturer/$1.txt"
        shift 2
    done
    skapa_stub "${d}"
    {
        printf 'BACKLOG_KLAR_STATUS="Done"\n'
        printf 'BACKLOG_UNDANTAGNA_STATUSAR=""\n'
        printf 'BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT="%s"\n' "${ETIKETT}"
        printf 'BACKLOG_KARENS_TIMMAR="%s"\n' "${KARENS_H}"
        printf 'BACKLOG_HARLEDD_DOD_MONSTER="%s"\n' "${HARLEDD_MONSTER}"
        printf 'BACKLOG_LANDNINGS_PEKARE_MONSTER="%s"\n' "${PEKARE_MONSTER}"
        printf 'BACKLOG_AVSTADD_KRAV_ETIKETT="%s"\n' "${AVSTADD_ETIKETT}"
        printf 'BACKLOG_AVSTADD_KRAV_MARKOR="%s"\n' "${AVSTADD_MARKOR}"
    } > "${d}/policy.conf"
}

SISTA_UT=""
SISTA_KOD=0

kor_fixtur() {
    local d="$1"
    SISTA_KOD=0
    SISTA_UT="$(BACKLOG_CMD="${d}/backlog" BACKLOG_TASKS_DIR="${d}/tasks" BACKLOG_CLOSURE_POLICY="${d}/policy.conf" \
                bash "${GRIND}" 2>&1)" || SISTA_KOD=$?
}

# ── Ancestry-riggen (TASK-319) ───────────────────────────────────────────────
#
# Pekarens sannings-prövning slår upp PR-nummer mot landningarna i git-
# historiken. Fixturen bygger därför ett EGET litet git-repo och kör grinden med
# cwd där, i stället för att luta sig mot repots egen historik. Skälet är
# determinism i båda leden: repots landningar ändras varje dag, och CI-jobbets
# checkout-djup är utanför svitens kontroll — ett test vars utfall beror på
# fetch-depth bevisar ingenting den dagen värdet ändras.
#
# Referensen är HEAD, inte ett grennamn: `git init` ger olika default-gren i
# olika git-versioner, och HEAD pekar rätt i alla.
REPO_ROT="${PWD}"

# $1 = katalog för repot, därefter de PR-nummer som ska finnas som landningar.
bygg_gitrepo() {
    local g="$1"; shift
    mkdir -p "${g}"
    git init -q "${g}"
    # -c framför varje commit: sviten får ALDRIG skriva i användarens git-config,
    # och en global commit.gpgsign hade annars fällt fixturen på en signatur
    # ingen bad om.
    git -C "${g}" -c user.email=t@t.invalid -c user.name=t -c commit.gpgsign=false \
        commit -q --allow-empty -m "init"
    local nr
    for nr in "$@"; do
        git -C "${g}" -c user.email=t@t.invalid -c user.name=t -c commit.gpgsign=false \
            commit -q --allow-empty -m "Merge pull request #${nr} from high-five-group/gren-${nr}"
    done
}

# Som kor_fixtur, men med cwd i ett fixtur-git-repo. Sökvägarna till stubben,
# korten och policyn är absoluta (mktemp -d ger absolut path), och grindens egen
# path görs absolut här — annars hade cd:n brutit dem.
kor_fixtur_i() {
    local d="$1" g="$2"
    SISTA_KOD=0
    SISTA_UT="$(cd "${g}" && BACKLOG_CMD="${d}/backlog" BACKLOG_TASKS_DIR="${d}/tasks" \
                BACKLOG_CLOSURE_POLICY="${d}/policy.conf" \
                BACKLOG_KORTFAKTA_SKRIPT="${REPO_ROT}/scripts/backlog-kortfakta.mjs" \
                bash "${REPO_ROT}/${GRIND}" 2>&1)" || SISTA_KOD=$?
}

rapportera() {
    local ok="$1" namn="$2" forklaring="$3"
    if [[ "${ok}" -eq 1 ]]; then
        echo "  ✓ ${namn}"
        PASS=$((PASS + 1))
    else
        echo "  ✗ ${namn} — ${forklaring}"
        while IFS= read -r r; do echo "      ${r}"; done <<< "${SISTA_UT}"
        FAIL=$((FAIL + 1))
    fi
}

# $1=namn  $2=förväntad exit  därefter PAR av: id innehåll
prova_flera() {
    local namn="$1" vantad="$2"; shift 2
    local d="${TMP}/flera-$$-${RANDOM}"
    bygg_fixturer "${d}" "$@"
    kor_fixtur "${d}"
    local ok=0
    [[ "${SISTA_KOD}" -eq "${vantad}" ]] && ok=1
    rapportera "${ok}" "${namn}" "väntade exit ${vantad}, fick ${SISTA_KOD}"
}

# $1=namn  $2=förväntad exit  $3=fixtur-innehåll (ett kort, id 1)
prova() {
    prova_flera "$1" "$2" 1 "$3"
}

# Policy-varianter mot en fixtur som i sig ALLTID är konsekvent (Done + allt
# bockat). Enda variabeln i experimentet är policy-filens innehåll — så en
# fällning kan bara komma från policy-hanteringen.
# $1=namn  $2=policy-innehåll  $3=förväntad exit  $4=mönster ('' = ingen kontroll)
prova_policy() {
    local namn="$1" policy="$2" vantad="$3" monster="$4"
    local d="${TMP}/policy-$$-${RANDOM}"
    mkdir -p "${d}/fixturer"
    printf 'Updated: %s\nStatus: ✔ Done\n%s\n- [x] #1 ett\n%s\n- [x] #1 dod\n' \
        "${GAMMAL}" "${AC_HDR}" "${DOD_HDR}" > "${d}/fixturer/1.txt"
    skapa_stub "${d}"
    printf '%s\n' "${policy}" > "${d}/policy.conf"
    kor_fixtur "${d}"
    local ok=0
    if [[ "${SISTA_KOD}" -eq "${vantad}" ]]; then
        if [[ -z "${monster}" ]]; then
            ok=1
        elif grep -qE "${monster}" <<< "${SISTA_UT}"; then
            ok=1
        fi
    fi
    rapportera "${ok}" "${namn}" "väntade exit ${vantad} + /${monster}/, fick exit ${SISTA_KOD}"
}

# $1=namn  $2=förväntad exit  $3=mönster som MÅSTE finnas i utskriften
#                             därefter PAR av: id innehåll
prova_utskrift() {
    local namn="$1" vantad="$2" monster="$3"; shift 3
    local d="${TMP}/utskrift-$$-${RANDOM}"
    bygg_fixturer "${d}" "$@"
    kor_fixtur "${d}"
    local ok=0
    if [[ "${SISTA_KOD}" -eq "${vantad}" ]] && grep -qE "${monster}" <<< "${SISTA_UT}"; then
        ok=1
    fi
    rapportera "${ok}" "${namn}" "väntade exit ${vantad} + /${monster}/, fick exit ${SISTA_KOD}"
}

# $1=namn  $2=förväntad exit  $3=ref policyn pekar på  $4=commit-mönster
# $5=PR-nummer som ska FINNAS som landningar i fixtur-repot (mellanslagsseparerade)
# $6=mönster som måste finnas i utskriften ('' = ingen kontroll)  $7=kortkropp
prova_ancestry() {
    local namn="$1" vantad="$2" ref="$3" cmonster="$4" landningar="$5" utmonster="$6" kropp="$7"
    local d="${TMP}/anc-$$-${RANDOM}"
    local g="${TMP}/ancrepo-$$-${RANDOM}"
    bygg_fixturer "${d}" 1 "${kropp}"
    # Appendas EFTER bygg_fixturer: de fall som inte anropar denna funktion ska
    # se en policy utan ancestry-variabler, alltså prövningen avstängd. Annars
    # hade TASK-319 tyst ändrat vad svitens 62 äldre fall påstår sig bevisa.
    printf 'BACKLOG_PEKARE_ANCESTRY_REF="%s"\n' "${ref}" >> "${d}/policy.conf"
    printf 'BACKLOG_PEKARE_LANDNINGS_COMMIT_MONSTER="%s"\n' "${cmonster}" >> "${d}/policy.conf"
    # Avsiktligt ociterad: landningarna ska ordsplittas till separata argument.
    # shellcheck disable=SC2086
    bygg_gitrepo "${g}" ${landningar}
    kor_fixtur_i "${d}" "${g}"
    local ok=0
    if [[ "${SISTA_KOD}" -eq "${vantad}" ]]; then
        if [[ -z "${utmonster}" ]]; then
            ok=1
        elif grep -qE "${utmonster}" <<< "${SISTA_UT}"; then
            ok=1
        fi
    fi
    rapportera "${ok}" "${namn}" "väntade exit ${vantad} + /${utmonster}/, fick exit ${SISTA_KOD}"
}

AC_HDR="Acceptance Criteria:"
DOD_HDR="Definition of Done:"

# Återanvända fixtur-kroppar för förälder/barn-fallen.
BARN_KLART="Status: ✔ Done
${AC_HDR}
- [x] #1 ett
${DOD_HDR}
- [x] #1 dod"

BARN_OPPET="Status: ○ To Do
${AC_HDR}
- [ ] #1 ett
${DOD_HDR}
- [ ] #1 dod"

FORALDER_UTAN_AC="Status: ○ To Do
Subtasks (2):
- TASK-1.1 - Barn ett
- TASK-1.2 - Barn två

${AC_HDR}
No acceptance criteria defined
${DOD_HDR}
- [ ] #1 dod"

echo "test-check-backlog-closure:"

# ── Invariant 1: alla AC bockade men kortet öppet ────────────────────────────
prova "T1  alla AC bockade + To Do -> FÄLLER" 1 \
"Status: ○ To Do
${AC_HDR}
- [x] #1 ett
- [x] #2 två
${DOD_HDR}
- [x] #1 dod"

prova "T2  alla AC bockade + Done -> passerar" 0 \
"Status: ✔ Done
${AC_HDR}
- [x] #1 ett
${DOD_HDR}
- [x] #1 dod"

prova "T3  NÅGOT AC obockat + To Do -> passerar (arbete pågår)" 0 \
"Status: ○ To Do
${AC_HDR}
- [x] #1 ett
- [ ] #2 två
${DOD_HDR}
- [ ] #1 dod"

# ── Invariant 2: Done men obockade krav ──────────────────────────────────────
prova "T4  Done + obockat AC -> FÄLLER" 1 \
"Status: ✔ Done
${AC_HDR}
- [ ] #1 ett
${DOD_HDR}
- [x] #1 dod"

prova "T5  Done + obockad DoD -> FÄLLER" 1 \
"Status: ✔ Done
${AC_HDR}
- [x] #1 ett
${DOD_HDR}
- [ ] #1 dod"

# ── Blockavgränsningen: AC och DoD får ALDRIG räknas ihop ────────────────────
# Utan awk-avgränsningen skulle en bockad DoD kunna maskera ett obockat AC.
prova "T6  Done + obockat AC men bockad DoD -> FÄLLER (block hålls isär)" 1 \
"Status: ✔ Done
${AC_HDR}
- [ ] #1 ett
${DOD_HDR}
- [x] #1 dod
- [x] #2 dod"

prova "T7  To Do + noll AC -> passerar (inget att sluta sig till)" 0 \
"Status: ○ To Do
${AC_HDR}
${DOD_HDR}
- [ ] #1 dod"

# ── Undantagna statusar ──────────────────────────────────────────────────────
d="${TMP}/undantag"
mkdir -p "${d}/fixturer"
printf 'Updated: %s\nStatus: ✖ Cancelled\n%s\n- [x] #1 ett\n%s\n- [x] #1 dod\n' \
    "${GAMMAL}" "${AC_HDR}" "${DOD_HDR}" > "${d}/fixturer/1.txt"
skapa_stub "${d}"
printf 'BACKLOG_KLAR_STATUS="Done"\nBACKLOG_UNDANTAGNA_STATUSAR="Cancelled"\nBACKLOG_AVSIKTLIGT_OPPEN_ETIKETT="%s"\nBACKLOG_KARENS_TIMMAR="%s"\n' \
    "${ETIKETT}" "${KARENS_H}" > "${d}/policy.conf"
if BACKLOG_CMD="${d}/backlog" BACKLOG_TASKS_DIR="${d}/tasks" BACKLOG_CLOSURE_POLICY="${d}/policy.conf" bash "${GRIND}" >/dev/null 2>&1; then
    echo "  ✓ T8  undantagen status fäller inte invariant 1"
    PASS=$((PASS + 1))
else
    echo "  ✗ T8  undantagen status fällde ändå"
    FAIL=$((FAIL + 1))
fi

# ── Fail-closed: anropsfel får ALDRIG läsas som 'allt bra' ───────────────────
# Varje fall nedan prövar BÅDE exitkoden OCH att den utlöstes av RÄTT orsak.
# Utan orsaks-kontrollen hade T9 kunnat passera på fel grund: en policy som
# saknar en obligatorisk variabel ger också exit 2.
d="${TMP}/tomt"
mkdir -p "${d}/fixturer"
skapa_stub "${d}"
printf 'BACKLOG_KLAR_STATUS="Done"\nBACKLOG_UNDANTAGNA_STATUSAR=""\nBACKLOG_AVSIKTLIGT_OPPEN_ETIKETT="%s"\nBACKLOG_KARENS_TIMMAR="%s"\n' \
    "${ETIKETT}" "${KARENS_H}" > "${d}/policy.conf"
kod=0
ut=""
ut="$(BACKLOG_CMD="${d}/backlog" BACKLOG_TASKS_DIR="${d}/tasks" BACKLOG_CLOSURE_POLICY="${d}/policy.conf" bash "${GRIND}" 2>&1)" || kod=$?
if [[ "${kod}" -eq 2 ]] && grep -q 'noll kort hittades' <<< "${ut}"; then
    echo "  ✓ T9  noll kort -> exit 2 (anropsfel), inte exit 0"
    PASS=$((PASS + 1))
else
    echo "  ✗ T9  noll kort gav inte exit 2 av rätt orsak (kod=${kod})"
    FAIL=$((FAIL + 1))
fi

d="${TMP}/ingen-policy"
mkdir -p "${d}/fixturer"
printf 'Status: ✔ Done\n' > "${d}/fixturer/1.txt"
skapa_stub "${d}"
kod=0
ut=""
ut="$(BACKLOG_CMD="${d}/backlog" BACKLOG_TASKS_DIR="${d}/tasks" BACKLOG_CLOSURE_POLICY="${d}/finns-inte.conf" bash "${GRIND}" 2>&1)" || kod=$?
if [[ "${kod}" -eq 2 ]] && grep -q 'policy-fil saknas' <<< "${ut}"; then
    echo "  ✓ T10 saknad policy-fil -> exit 2, grinden gissar aldrig"
    PASS=$((PASS + 1))
else
    echo "  ✗ T10 saknad policy-fil gav inte exit 2 av rätt orsak (kod=${kod})"
    FAIL=$((FAIL + 1))
fi

# ── Invariant 3: förälder öppen medan alla barn är Done (TASK-90) ────────────
prova_flera "T11 förälder öppen + ALLA barn Done -> FÄLLER" 1 \
    1 "${FORALDER_UTAN_AC}" \
    1.1 "${BARN_KLART}" \
    1.2 "${BARN_KLART}"

prova_flera "T12 förälder öppen + ETT barn öppet -> passerar (arbete kvar)" 0 \
    1 "${FORALDER_UTAN_AC}" \
    1.1 "${BARN_KLART}" \
    1.2 "${BARN_OPPET}"

# Fail-safe: ett kort vars tillstånd grinden INTE känner får aldrig låta en
# förälder bedömas "alla barn klara" mot en ofullständig bild.
#
# FORMEN BYTTE PLATS OCH BLEV HÖGLJUDD I TASK-238 (ADR-117). Förr nämndes ett
# barn i förälderns Subtasks-block utan att finnas i listningen, och grinden
# höll TYST om föräldern (räknade den som "obedömbar"). I bulk-formen härleds
# barnen ur samma listning som allt annat, så det tillståndet är inte längre
# representerbart — CLI:ts Subtasks-block är för övrigt självt listnings-härlett
# (verifierat 2026-08-17: TASK-17 listar 6 barn, det completed-lagda TASK-17.6
# är inte ett av dem), så den gamla grenen var redan strukturellt onåbar mot ett
# verkligt CLI.
#
# Faran den skyddade mot finns kvar och prövas nu där den ÄR nåbar: ett kort som
# ligger på disk utan att synas i listningen fäller med exit 2 i stället för att
# tyst utelämnas. En tyst fail-safe kan inte skiljas från "allt är bra" — det
# var TASK-90:s defekt, och den ska inte återuppfinnas här.
d="${TMP}/kort-utanfor-listningen"
bygg_fixturer "${d}" 1 "${FORALDER_UTAN_AC}" 1.1 "${BARN_KLART}"
# Kortet läggs till EFTER stub-bygget, så det finns på disk men aldrig i
# lista.json — exakt "tillstånd okänt för grinden".
printf -- '---\nid: TASK-1.2\nstatus: Done\nlabels: []\n---\n' > "${d}/tasks/task-1.2.md"
kod=0
ut=""
ut="$(BACKLOG_CMD="${d}/backlog" BACKLOG_TASKS_DIR="${d}/tasks" \
      BACKLOG_CLOSURE_POLICY="${d}/policy.conf" bash "${GRIND}" 2>&1)" || kod=$?
if [[ "${kod}" -eq 2 ]] && grep -q 'saknas i CLI:ts listning' <<< "${ut}"; then
    echo "  ✓ T13 kort på disk men utanför listningen -> exit 2, aldrig en gissad förälder"
    PASS=$((PASS + 1))
else
    echo "  ✗ T13 kort utanför listningen gav inte exit 2 av rätt orsak (kod=${kod})"
    while IFS= read -r r; do echo "      ${r}"; done <<< "${ut}"
    FAIL=$((FAIL + 1))
fi

# Paret till T13: samma uppsättning UTAN det okända kortet ska passera normalt,
# så exit 2 ovan bevisligen kommer från listnings-divergensen och inget annat.
prova_flera "T13b samma uppsättning utan okänt kort -> passerar" 0 \
    1 "${FORALDER_UTAN_AC}" \
    1.1 "${BARN_KLART}" \
    1.2 "${BARN_OPPET}"

# Förälderns EGNA AC vinner över barnens fullbordan: ett obockat eget kriterium
# är genuint återstående arbete (typiskt en QA-skiva som ligger på föräldern).
prova_flera "T14 förälder + alla barn Done men EGET AC obockat -> passerar" 0 \
    1 "Status: ○ To Do
Subtasks (2):
- TASK-1.1 - Barn ett
- TASK-1.2 - Barn två

${AC_HDR}
- [ ] #1 egen QA
${DOD_HDR}
- [ ] #1 dod" \
    1.1 "${BARN_KLART}" \
    1.2 "${BARN_KLART}"

prova_flera "T15 förälder + alla barn Done + EGNA AC alla bockade -> FÄLLER" 1 \
    1 "Status: ○ To Do
Subtasks (2):
- TASK-1.1 - Barn ett
- TASK-1.2 - Barn två

${AC_HDR}
- [x] #1 egen QA
${DOD_HDR}
- [ ] #1 dod" \
    1.1 "${BARN_KLART}" \
    1.2 "${BARN_KLART}"

# En skiv-titel kan nämna ett ANNAT kort-ID. Barn-utvinningen är ankrad på
# radstart, så den raden får inte kunna smuggla in ett påhittat barn.
prova_flera "T16 barn-ID i en skiv-TITEL räknas inte som barn -> FÄLLER ändå" 1 \
    1 "Status: ○ To Do
Subtasks (2):
- TASK-1.1 - Barn ett (jfr TASK-9.9 som INTE är ett barn)
- TASK-1.2 - Barn två

${AC_HDR}
No acceptance criteria defined
${DOD_HDR}
- [ ] #1 dod" \
    1.1 "${BARN_KLART}" \
    1.2 "${BARN_KLART}"

# Kort-ID:n SER UT som tal, och en awk-jämförelse `$1==x` blir då numerisk:
# `18.2 == 18.20` är sant numeriskt och falskt som ID. Barn-uppslaget läste
# därför TASK-18.20:s status ur TASK-18.2:s rad och rapporterade TASK-18 som
# färdigt fastän 18.20 stod To Do. Paret nedan låser fast strängjämförelsen.
FORALDER_GLES="Status: ○ To Do
Subtasks (2):
- TASK-1.2 - Barn två
- TASK-1.20 - Barn tjugo

${AC_HDR}
No acceptance criteria defined
${DOD_HDR}
- [ ] #1 dod"

prova_flera "T17 barn 1.20 öppet medan 1.2 är Done -> passerar (ID är sträng, ej tal)" 0 \
    1 "${FORALDER_GLES}" \
    1.2 "${BARN_KLART}" \
    1.20 "${BARN_OPPET}"

prova_flera "T18 barn 1.2 OCH 1.20 båda Done -> FÄLLER" 1 \
    1 "${FORALDER_GLES}" \
    1.2 "${BARN_KLART}" \
    1.20 "${BARN_KLART}"

# ── Avsiktligt öppna kort deklarerar sig med etikett (TASK-90 AC #3) ─────────
prova_flera "T19 förälder + alla barn Done + ETIKETTEN satt -> passerar" 0 \
    1 "Status: ○ To Do
Labels: ${ETIKETT}
Subtasks (2):
- TASK-1.1 - Barn ett
- TASK-1.2 - Barn två

${AC_HDR}
No acceptance criteria defined
${DOD_HDR}
- [ ] #1 dod" \
    1.1 "${BARN_KLART}" \
    1.2 "${BARN_KLART}"

# Delsträngs-matchning hade undantagit detta kort. Matchningen är per token.
prova_flera "T20 etikett som bara INNEHÅLLER den deklarerade -> FÄLLER" 1 \
    1 "Status: ○ To Do
Labels: ready-for-agent, ${ETIKETT}-tillfallig
Subtasks (2):
- TASK-1.1 - Barn ett
- TASK-1.2 - Barn två

${AC_HDR}
No acceptance criteria defined
${DOD_HDR}
- [ ] #1 dod" \
    1.1 "${BARN_KLART}" \
    1.2 "${BARN_KLART}"

# Etiketten säger "kortet ska inte stängas ännu" — den undantar därför BÅDA
# öppet-kort-invarianterna, inte bara förälder/barn.
prova "T21 alla AC bockade + To Do + ETIKETTEN satt -> passerar" 0 \
"Status: ○ To Do
Labels: ${ETIKETT}
${AC_HDR}
- [x] #1 ett
${DOD_HDR}
- [x] #1 dod"

prova "T22 alla AC bockade + To Do + ANNAN etikett -> FÄLLER" 1 \
"Status: ○ To Do
Labels: ready-for-agent
${AC_HDR}
- [x] #1 ett
${DOD_HDR}
- [x] #1 dod"

# ── Fail-closed på OFULLSTÄNDIG policy — exit 2, aldrig exit 1 ───────────────
# Grindens kontrakt är "exit 1 = drift funnen, exit 2 = anropsfel". En
# ofullständig policy är ett anropsfel. Formen `${VAR:?...}` gav exit 1 och
# hade alltså rapporterat en trasig konfiguration som ett inkonsistent KORT.
POLICY_FULL='BACKLOG_KLAR_STATUS="Done"
BACKLOG_UNDANTAGNA_STATUSAR=""
BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT="'"${ETIKETT}"'"
BACKLOG_KARENS_TIMMAR="24"'

# Varje ofullständig policy nedan bär ALLA ÖVRIGA variabler. Annars hade testet
# kunnat passera på fel grund: två saknade variabler ger också exit 2, och
# mönster-kontrollen är det enda som skiljer orsakerna åt.
prova_policy "T23 policy utan etikett-variabeln -> exit 2 (anropsfel)" \
    'BACKLOG_KLAR_STATUS="Done"
BACKLOG_UNDANTAGNA_STATUSAR=""
BACKLOG_KARENS_TIMMAR="24"' \
    2 'BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT'

prova_policy "T24 samma fixtur med FULLSTÄNDIG policy -> exit 0" \
    "${POLICY_FULL}" 0 ''

prova_policy "T25 policy utan BACKLOG_KLAR_STATUS -> exit 2, inte exit 1" \
    'BACKLOG_UNDANTAGNA_STATUSAR=""
BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT="x"
BACKLOG_KARENS_TIMMAR="24"' \
    2 'BACKLOG_KLAR_STATUS'

prova_policy "T26 policy med TOM etikett-variabel -> exit 2 (tomt är inte ett val)" \
    'BACKLOG_KLAR_STATUS="Done"
BACKLOG_UNDANTAGNA_STATUSAR=""
BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT=""
BACKLOG_KARENS_TIMMAR="24"' \
    2 'BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT'

# Karensen är obligatorisk av SAMMA skäl som etiketten: dess frånvaro ger falskt
# rött, inte tyst grönt. Ett tyst default på 0 hade gjort den farligaste
# konfigurationen till den som inte syns.
prova_policy "T31 policy utan BACKLOG_KARENS_TIMMAR -> exit 2 (anropsfel)" \
    'BACKLOG_KLAR_STATUS="Done"
BACKLOG_UNDANTAGNA_STATUSAR=""
BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT="'"${ETIKETT}"'"' \
    2 'BACKLOG_KARENS_TIMMAR'

prova_policy "T32 karens som inte är ett heltal -> exit 2, aldrig tyst 0" \
    'BACKLOG_KLAR_STATUS="Done"
BACKLOG_UNDANTAGNA_STATUSAR=""
BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT="'"${ETIKETT}"'"
BACKLOG_KARENS_TIMMAR="24h"' \
    2 'BACKLOG_KARENS_TIMMAR'

# ── Täcknings-redovisningen — den VALDA formen för 0-AC-utan-barn ────────────
# Kortet utan AC och utan barn fälls INTE, men får inte heller försvinna tyst:
# hela fyndet i TASK-90 var att "0 inkonsistenta" lästes som full täckning.
prova_utskrift "T27 öppet kort utan AC och utan barn -> redovisas som UTAN SIGNAL" 0 \
    '^  1 UTAN STÄNGNINGS-SIGNAL' \
    1 "Status: ○ To Do
${AC_HDR}
No acceptance criteria defined
${DOD_HDR}
- [ ] #1 dod"

prova_utskrift "T28 öppet kort MED barn -> redovisas som prövat, inte som utan signal" 0 \
    '^  0 UTAN STÄNGNINGS-SIGNAL' \
    1 "${FORALDER_UTAN_AC}" \
    1.1 "${BARN_KLART}" \
    1.2 "${BARN_OPPET}"

prova_utskrift "T29 öppet kort med egna AC -> räknas mot invariant 1 i täckningen" 0 \
    '^  1 prövade mot egna AC' \
    1 "Status: ○ To Do
${AC_HDR}
- [ ] #1 ett
${DOD_HDR}
- [ ] #1 dod"

prova_utskrift "T30 deklarerat avsiktligt öppet -> redovisas som deklarerat, ej som prövat" 0 \
    '^  1 deklarerat avsiktligt öppna' \
    1 "Status: ○ To Do
Labels: ${ETIKETT}
${AC_HDR}
- [x] #1 ett
${DOD_HDR}
- [x] #1 dod"

# ── KARENSEN — det tvåsidiga beviset (TASK-102) ──────────────────────────────
#
# Grinden fäller på "alla AC bockade + öppet status". Det är EXAKT det tillstånd
# varje bygg-agents kontrakt KRÄVER: agenten bockar AC men får inte sätta Done,
# eftersom DoD kräver "CI grön per jobb" och den signalen saknas när agenten är
# klar. Utan karens fäller grinden alltså på korrekta kort — under en niovåg på
# nio samtidigt.
#
# Paret T33/T34 är hela poängen, och det måste vara ett PAR: ett grönt utfall
# ensamt bevisar ingenting, eftersom en grind som aldrig fäller också är grön.

# $1=namn $2=policy $3=förväntad exit $4=mönster ('' = ingen kontroll)
#                                     därefter PAR av: id innehåll
prova_policy_flera() {
    local namn="$1" policy="$2" vantad="$3" monster="$4"; shift 4
    local d="${TMP}/pf-$$-${RANDOM}"
    bygg_fixturer "${d}" "$@"
    printf '%s\n' "${policy}" > "${d}/policy.conf"   # ersätter default-policyn
    kor_fixtur "${d}"
    local ok=0
    if [[ "${SISTA_KOD}" -eq "${vantad}" ]]; then
        if [[ -z "${monster}" ]] || grep -qE "${monster}" <<< "${SISTA_UT}"; then ok=1; fi
    fi
    rapportera "${ok}" "${namn}" "väntade exit ${vantad} + /${monster}/, fick exit ${SISTA_KOD}"
}

LEVERERAT="Status: ○ To Do
${AC_HDR}
- [x] #1 ett
- [x] #2 två
${DOD_HDR}
- [ ] #1 dod"

prova "T33 nyss levererat kort (alla AC bockade, INOM karens) -> passerar" 0 \
"Updated: ${FARSK}
${LEVERERAT}"

prova "T34 SAMMA kort men bortom karensen -> FÄLLER (det är glömt)" 1 \
"Updated: ${GAMMAL}
${LEVERERAT}"

# Karensen undantar BÅDA öppet-kort-invarianterna, precis som etiketten gör.
prova_flera "T35 förälder + alla barn Done men föräldern INOM karens -> passerar" 0 \
    1 "Updated: ${FARSK}
${FORALDER_UTAN_AC}" \
    1.1 "${BARN_KLART}" \
    1.2 "${BARN_KLART}"

prova_flera "T36 samma förälder bortom karensen -> FÄLLER" 1 \
    1 "Updated: ${GAMMAL}
${FORALDER_UTAN_AC}" \
    1.1 "${BARN_KLART}" \
    1.2 "${BARN_KLART}"

# Invariant 2 har MED FLIT ingen karens: "Done + obockat krav" produceras inte av
# något korrekt flöde — stängningen bockar DoD och sätter Done i SAMMA CLI-anrop.
# En karens där hade bara fördröjt upptäckten av ett äkta fel.
prova "T37 Done + obockat AC INOM karens -> FÄLLER ändå (invariant 2 har ingen karens)" 1 \
"Updated: ${FARSK}
Status: ✔ Done
${AC_HDR}
- [ ] #1 ett
${DOD_HDR}
- [x] #1 dod"

# Karens 0 är ett giltigt val — men bara utskrivet. Då ska ett färskt kort fällas.
prova_policy_flera "T38 karens=0 -> färskt kort fälls (karensen är avstängbar)" \
    'BACKLOG_KLAR_STATUS="Done"
BACKLOG_UNDANTAGNA_STATUSAR=""
BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT="'"${ETIKETT}"'"
BACKLOG_KARENS_TIMMAR="0"' \
    1 'TASK-1' \
    1 "Updated: ${FARSK}
${LEVERERAT}"

# `Created:`-fallbacken för kort som aldrig redigerats efter skapandet. Paret
# visar att fallbacken är en RIKTIG tidsstämpel, inte ett tyst undantag.
prova "T39 endast Created:, gammalt -> bedöms och FÄLLER" 1 \
"Created: ${GAMMAL}
${LEVERERAT}"

prova "T40 endast Created:, färskt -> inom karens, passerar" 0 \
"Created: ${FARSK}
${LEVERERAT}"

# Ett kort utan läsbar tidsstämpel fälls inte — men får inte försvinna tyst.
# Samma val som 0-AC-utan-barn: redovisa frånvaron av bevis.
#
# FIXTUREN BYGGS FÖR HAND. `bygg_fixturer` ger varje fixtur en gammal tidsstämpel
# om den saknar egen, vilket är rätt för alla andra test — men hade tagit bort
# precis det detta test finns för att pröva.
d="${TMP}/utan-tid-blandat"
mkdir -p "${d}/fixturer"
printf 'Updated: %s\nStatus: ✔ Done\n%s\n- [x] #1 ett\n%s\n- [x] #1 dod\n' \
    "${GAMMAL}" "${AC_HDR}" "${DOD_HDR}" > "${d}/fixturer/1.txt"
printf 'Status: ○ To Do\n%s\n- [x] #1 ett\n%s\n- [ ] #1 dod\n' \
    "${AC_HDR}" "${DOD_HDR}" > "${d}/fixturer/2.txt"
skapa_stub "${d}"
printf 'BACKLOG_KLAR_STATUS="Done"\nBACKLOG_UNDANTAGNA_STATUSAR=""\nBACKLOG_AVSIKTLIGT_OPPEN_ETIKETT="%s"\nBACKLOG_KARENS_TIMMAR="%s"\n' \
    "${ETIKETT}" "${KARENS_H}" > "${d}/policy.conf"
kor_fixtur "${d}"
if [[ "${SISTA_KOD}" -eq 0 ]] && grep -qE '^  1 utan läsbar tidsstämpel' <<< "${SISTA_UT}"; then
    echo "  ✓ T41 kort utan tidsstämpel -> fälls inte, redovisas i täckningen"
    PASS=$((PASS + 1))
else
    echo "  ✗ T41 kort utan tidsstämpel gav inte exit 0 + redovisning (kod=${SISTA_KOD})"
    while IFS= read -r r; do echo "      ${r}"; done <<< "${SISTA_UT}"
    FAIL=$((FAIL + 1))
fi

# Men om INGET kort bär en tidsstämpel har CLI:ts format troligen ändrats, och då
# hade grinden gått grön utan att pröva någonting. Fail-closed: exit 2.
d="${TMP}/ingen-tid"
mkdir -p "${d}/fixturer"
printf 'Status: ○ To Do\n%s\n- [x] #1 ett\n%s\n- [ ] #1 dod\n' "${AC_HDR}" "${DOD_HDR}" \
    > "${d}/fixturer/1.txt"
skapa_stub "${d}"
printf 'BACKLOG_KLAR_STATUS="Done"\nBACKLOG_UNDANTAGNA_STATUSAR=""\nBACKLOG_AVSIKTLIGT_OPPEN_ETIKETT="%s"\nBACKLOG_KARENS_TIMMAR="%s"\n' \
    "${ETIKETT}" "${KARENS_H}" > "${d}/policy.conf"
kod=0
ut=""
ut="$(BACKLOG_CMD="${d}/backlog" BACKLOG_TASKS_DIR="${d}/tasks" BACKLOG_CLOSURE_POLICY="${d}/policy.conf" bash "${GRIND}" 2>&1)" || kod=$?
if [[ "${kod}" -eq 2 ]] && grep -q 'läsbar tidsstämpel' <<< "${ut}"; then
    echo "  ✓ T42 inget kort med tidsstämpel -> exit 2 (format-drift), inte tyst grönt"
    PASS=$((PASS + 1))
else
    echo "  ✗ T42 inget kort med tidsstämpel gav inte exit 2 av rätt orsak (kod=${kod})"
    FAIL=$((FAIL + 1))
fi

prova_utskrift "T43 kort inom karens redovisas öppet, aldrig som 'prövat'" 0 \
    '^  1 inom karens' \
    1 "Updated: ${FARSK}
${LEVERERAT}"

# ── date-fallbacken måste hålla i BÅDA formerna (TASK-102) ──────────────────
#
# Karensens brytpunkt räknas med `date -u -d @EPOCH` (GNU) och faller tillbaka
# på `date -u -r EPOCH` (BSD/macOS). Varje maskin kör bara EN av grenarna:
# macOS tar alltid fallbacken, en ubuntu-runner alltid förstahandsformen. Utan
# stubbe prövar alltså ingen miljö den gren den inte själv använder — och ett
# fel i den andra grenen hade synts först i CI, eller aldrig.
#
# Stubben tvingar grinden ned i en bestämd gren. Den räknar inte tid själv utan
# delegerar till /bin/date i den form som råkar finnas, eftersom det som ska
# bevisas är grindens GRENVAL, inte datumaritmetiken.
# Stubbarna skrivs med CITERAD heredoc (<<'X'), samma form som skapa_stub ovan.
# Innehållet ska nå filen ORÖRT — `$1` i stubben är stubbens eget argument, inte
# sviten. En ociterad heredoc (eller printf med dubbla citattecken) hade expanderat
# dem här och skrivit en stubbe som läser sviten argument.
skapa_date_stubbe() {
    local dir="$1" stil="$2"
    mkdir -p "${dir}"
    cat > "${dir}/date" <<'HUVUD'
#!/usr/bin/env bash
stampel() { /bin/date -u -d "@$1" +%Y%m%d%H%M 2>/dev/null || /bin/date -u -r "$1" +%Y%m%d%H%M; }
if [[ "$1" == "-u" && "$2" == "+%s" ]]; then exec /bin/date -u +%s; fi
HUVUD
    if [[ "${stil}" == "gnu" ]]; then
        # GNU: -d @EPOCH fungerar; -r betyder "läs en FILS mtime" och fäller här.
        cat >> "${dir}/date" <<'GNUGREN'
if [[ "$1" == "-u" && "$2" == "-d" ]]; then e="${3#@}"; stampel "$e"; exit $?; fi
if [[ "$1" == "-u" && "$2" == "-r" ]]; then exit 1; fi
GNUGREN
    else
        # BSD: -d finns inte alls ("illegal option -- d"); -r EPOCH fungerar.
        cat >> "${dir}/date" <<'BSDGREN'
if [[ "$1" == "-u" && "$2" == "-d" ]]; then exit 1; fi
if [[ "$1" == "-u" && "$2" == "-r" ]]; then stampel "$3"; exit $?; fi
BSDGREN
    fi
    cat >> "${dir}/date" <<'SVANS'
exec /bin/date "$@"
SVANS
    chmod +x "${dir}/date"
}

# $1=stil  $2=fixtur-innehåll  $3=förväntad exit  $4=namn
prova_date_gren() {
    local stil="$1" innehall="$2" vantad="$3" namn="$4"
    local d="${TMP}/date-${stil}-$$-${RANDOM}"
    bygg_fixturer "${d}" 1 "${innehall}"
    skapa_date_stubbe "${d}/datebin" "${stil}"
    local kod=0 ut=""
    ut="$(PATH="${d}/datebin:${PATH}" BACKLOG_CMD="${d}/backlog" BACKLOG_TASKS_DIR="${d}/tasks" \
          BACKLOG_CLOSURE_POLICY="${d}/policy.conf" bash "${GRIND}" 2>&1)" || kod=$?
    SISTA_UT="${ut}"; SISTA_KOD="${kod}"
    local ok=0
    [[ "${kod}" -eq "${vantad}" ]] && ok=1
    rapportera "${ok}" "${namn}" "väntade exit ${vantad}, fick ${kod}"
}

prova_date_gren gnu "Updated: ${FARSK}
${LEVERERAT}" 0 "T44 GNU-grenen (date -d @EPOCH): färskt kort -> passerar"

prova_date_gren gnu "Updated: ${GAMMAL}
${LEVERERAT}" 1 "T45 GNU-grenen: gammalt kort -> FÄLLER"

prova_date_gren bsd "Updated: ${FARSK}
${LEVERERAT}" 0 "T46 BSD-grenen (date -r EPOCH): färskt kort -> passerar"

prova_date_gren bsd "Updated: ${GAMMAL}
${LEVERERAT}" 1 "T47 BSD-grenen: gammalt kort -> FÄLLER"

# Faller BÅDA formerna kan brytpunkten inte beräknas. Då kör grinden hellre inte
# alls än med en gissad karens.
d="${TMP}/date-trasig"
bygg_fixturer "${d}" 1 "Updated: ${GAMMAL}
${LEVERERAT}"
mkdir -p "${d}/datebin"
cat > "${d}/datebin/date" <<'TRASIG'
#!/usr/bin/env bash
if [[ "$1" == "-u" && "$2" == "+%s" ]]; then exec /bin/date -u +%s; fi
exit 1
TRASIG
chmod +x "${d}/datebin/date"
kod=0
ut=""
ut="$(PATH="${d}/datebin:${PATH}" BACKLOG_CMD="${d}/backlog" BACKLOG_TASKS_DIR="${d}/tasks" \
      BACKLOG_CLOSURE_POLICY="${d}/policy.conf" bash "${GRIND}" 2>&1)" || kod=$?
if [[ "${kod}" -eq 2 ]] && grep -q 'brytpunkt' <<< "${ut}"; then
    echo "  ✓ T48 ingen date-form fungerar -> exit 2, aldrig en gissad karens"
    PASS=$((PASS + 1))
else
    echo "  ✗ T48 trasig date gav inte exit 2 av rätt orsak (kod=${kod})"
    FAIL=$((FAIL + 1))
fi

# ── Namnkollisionen får aldrig krypa tillbaka in i defaulten (TASK-102) ──────
#
# `npx backlog` löser upp till paketet `backlog` — ett ANNAT paket av en annan
# författare — och npx auto-installerar det utan att fråga när stdin inte är en
# TTY, vilket den aldrig är i CI. Defaulten måste peka på den deklarerade lokala
# binären. Detta är en käll-assertion och inte ett beteendetest, eftersom
# felläget bara uppstår i en miljö utan global installation.
standard_cmd=""
standard_cmd="$(grep -m1 '^BACKLOG_CMD=' "${GRIND}")" || true
if [[ -n "${standard_cmd}" ]] && ! grep -q 'npx' <<< "${standard_cmd}"; then
    echo "  ✓ T49 BACKLOG_CMD-defaulten löser inte upp via npx"
    PASS=$((PASS + 1))
else
    echo "  ✗ T49 BACKLOG_CMD-defaulten är tillbaka på en npx-form: ${standard_cmd}"
    FAIL=$((FAIL + 1))
fi

if ! grep -nE '^[[:space:]]*echo .*npx ' "${GRIND}" > /dev/null; then
    echo "  ✓ T50 grinden skriver aldrig ut ett npx-kommando som åtgärd"
    PASS=$((PASS + 1))
else
    echo "  ✗ T50 grinden lär ut namnkollisionen i sin egen åtgärds-utskrift:"
    grep -nE '^[[:space:]]*echo .*npx ' "${GRIND}" | while IFS= read -r r; do echo "      ${r}"; done
    FAIL=$((FAIL + 1))
fi

# ── Bulk-formens egna skyddsräcken (TASK-238, ADR-117) ──────────────────────
#
# AC/DoD läses ur task-filerna, allt annat ur CLI:t. Den avvikelsen är bara
# försvarbar så länge den är MEKANISKT bevakad — annars är den ett löfte i
# prosa (ADR-083). Räckena nedan prövas därför i par: att de fäller när de ska,
# och att samma uppsättning utan defekten passerar.

# Korsvalideringen: filparsningen och CLI:t måste vara överens. Fixturen
# manipuleras EFTER stub-bygget så att .md-filen säger något annat än den
# JSON stubben serverar — exakt vad ett ändrat filformat skulle ge.
d="${TMP}/korsvalidering"
bygg_fixturer "${d}" 1 "Status: ✔ Done
${AC_HDR}
- [x] #1 ett
${DOD_HDR}
- [x] #1 dod"
# CLI-sidan (view/1.json) säger fortfarande bockat; filen säger obockat.
perl -pi -e 's/^- \[x\] #1 ett$/- [ ] #1 ett/' "${d}/tasks/task-1.md"
kod=0
ut=""
ut="$(BACKLOG_CMD="${d}/backlog" BACKLOG_TASKS_DIR="${d}/tasks" \
      BACKLOG_CLOSURE_POLICY="${d}/policy.conf" bash "${GRIND}" 2>&1)" || kod=$?
if [[ "${kod}" -eq 2 ]] && grep -q 'korsvalidering FÄLLDE' <<< "${ut}"; then
    echo "  ✓ T51 fil och CLI oense om AC -> exit 2 (parsningen är bevakad)"
    PASS=$((PASS + 1))
else
    echo "  ✗ T51 oenig korsvalidering gav inte exit 2 av rätt orsak (kod=${kod})"
    while IFS= read -r r; do echo "      ${r}"; done <<< "${ut}"
    FAIL=$((FAIL + 1))
fi

prova "T51b samma fixtur ORÖRD -> passerar (fällningen kom från oenigheten)" 0 \
"Status: ✔ Done
${AC_HDR}
- [x] #1 ett
${DOD_HDR}
- [x] #1 dod"

# Formatdrift: en AC-RUBRIK utan markörpar får aldrig tolkas som "noll AC".
# Utan detta räcke hade ett ändrat filformat gett tyst grönt — grinden hade
# räknat varje kort som AC-löst och slutat pröva invariant 1 helt.
d="${TMP}/markor-borta"
bygg_fixturer "${d}" 1 "Status: ○ To Do
${AC_HDR}
- [x] #1 ett
${DOD_HDR}
- [x] #1 dod"
perl -0777 -pi -e 's/<!-- AC:BEGIN -->\n|<!-- AC:END -->\n//g' "${d}/tasks/task-1.md"
kod=0
ut=""
ut="$(BACKLOG_CMD="${d}/backlog" BACKLOG_TASKS_DIR="${d}/tasks" \
      BACKLOG_CLOSURE_POLICY="${d}/policy.conf" bash "${GRIND}" 2>&1)" || kod=$?
if [[ "${kod}" -eq 2 ]] && grep -q 'saknar markörparet' <<< "${ut}"; then
    echo "  ✓ T52 AC-rubrik utan markörpar -> exit 2, aldrig tyst 'noll AC'"
    PASS=$((PASS + 1))
else
    echo "  ✗ T52 saknad markör gav inte exit 2 av rätt orsak (kod=${kod})"
    while IFS= read -r r; do echo "      ${r}"; done <<< "${ut}"
    FAIL=$((FAIL + 1))
fi

# Källassertion: bulk-formens hela poäng är att INGET CLI-anrop sker per kort.
# Kryper en per-kort-loop tillbaka in är kvadratiken tillbaka utan att någon
# testkörning blir röd — den kostar bara tid, och tid syns först i natten.
if ! grep -qE '^\s*(for|while).*\$\{BACKLOG_CMD\}' "${GRIND}"; then
    echo "  ✓ T53 grinden bär ingen per-kort-loop över BACKLOG_CMD"
    PASS=$((PASS + 1))
else
    echo "  ✗ T53 en per-kort-loop över BACKLOG_CMD är tillbaka i grinden:"
    grep -nE '^\s*(for|while).*\$\{BACKLOG_CMD\}' "${GRIND}" | while IFS= read -r r; do echo "      ${r}"; done
    FAIL=$((FAIL + 1))
fi

# ── Stängningsformerna (TASK-281) ────────────────────────────────────────────
#
# Två undantag från invariant 2, båda prövade i PAR: att undantaget bär när det
# ska, och att det INTE bär när halva formen saknas. Det är den enda formen som
# skiljer "grinden accepterar rätt sak" från "grinden accepterar allt".

HARLEDD_KLAR="Status: ✔ Done
${AC_HDR}
- [x] #1 ett
${DOD_HDR}
- [x] #1 dod
- [ ] #2 ${HARLEDD_MONSTER} på pushad commit"

prova "T54 härledd DoD-rad obockad + landnings-pekare -> passerar" 0 \
"${HARLEDD_KLAR}
Final Summary:
Levererad. Landning: PR #1910."

prova "T55 SAMMA kort utan pekare -> FÄLLER (pekaren är utbytet, inte amnesti)" 1 \
"${HARLEDD_KLAR}
Final Summary:
Levererad. Ingen adress till landningen."

prova_utskrift "T55b fällningen namnger vad som saknas (död pekare lärs ut)" 1 \
'landnings-pekare' 1 \
"${HARLEDD_KLAR}
Final Summary:
Levererad."

# Pekaren undantar EXAKT den härledda raden. Vore den ett generellt frikort hade
# vilken obockad DoD-rad som helst svalts av en PR-referens.
prova "T56 pekare + obockad ICKE-härledd DoD-rad -> FÄLLER ändå" 1 \
"Status: ✔ Done
${AC_HDR}
- [x] #1 ett
${DOD_HDR}
- [ ] #1 facit-manifestet amenderat
Final Summary:
Landning: PR #1910."

# Ett omnämnande är inte en deklaration. Detta är fallet som MÄTTES skarpt
# 2026-08-24: TASK-285:s slutrad nämnde 'PR #1811' som kontext, och den lösare
# formen kvitterade rätt kort på fel bevis.
prova "T57 blott ett PR-nummer utan etikettordet 'Landning:' -> FÄLLER" 1 \
"${HARLEDD_KLAR}
Final Summary:
Baslinjen sattes i PR #1811 och formen stämplades."

# Sökytan: pekaren gäller bara i Final Summary. En beskrivning som NÄMNER en PR
# (repot har kort vars titel gör precis det) får aldrig kvittera en landning.
prova "T58 pekare i Description i stället för Final Summary -> FÄLLER" 1 \
"${HARLEDD_KLAR}
Description:
Blockerad av Landning: PR #1910 tills den landat."

AVSTADD_KROPP="Status: ✔ Done
Labels: ${AVSTADD_ETIKETT}
${AC_HDR}
- [ ] #1 manuell vandring genomförd
${DOD_HDR}
- [ ] #1 alla acceptanskriterier avbockade"

prova "T59 avstådd-etikett + markör -> passerar (legitim stängning)" 0 \
"${AVSTADD_KROPP}
Implementation Notes:
${AVSTADD_MARKOR} Marcus avstod QA:n verbatim."

prova "T60 avstådd-etikett UTAN markör -> FÄLLER (blankocheck-spärren)" 1 \
"${AVSTADD_KROPP}
Implementation Notes:
QA:n gjordes inte."

prova_utskrift "T60b fällningen säger att motiveringen saknas, inte att AC saknas" 1 \
'ingen motivering' 1 \
"${AVSTADD_KROPP}
Implementation Notes:
QA:n gjordes inte."

# Markören ensam är ingen deklaration: etiketten är den maskinläsbara halvan,
# och ett kort som BESKRIVER mekanismen (TASK-281 självt gör det) får aldrig
# råka undanta sig.
prova "T61 markör UTAN etikett -> FÄLLER (etiketten är deklarationen)" 1 \
"Status: ✔ Done
${AC_HDR}
- [ ] #1 manuell vandring genomförd
${DOD_HDR}
- [x] #1 dod
Implementation Notes:
${AVSTADD_MARKOR} Marcus avstod QA:n verbatim."

# Markören godtas i Final Summary lika väl som i Notes — men INTE i
# beskrivningen, av samma skäl som pekaren.
prova "T62 markör i Final Summary -> passerar" 0 \
"${AVSTADD_KROPP}
Final Summary:
${AVSTADD_MARKOR} Marcus avstod QA:n verbatim."

prova "T63 markör i Description -> FÄLLER (fel sökyta)" 1 \
"${AVSTADD_KROPP}
Description:
${AVSTADD_MARKOR} står här av misstag."

# Formen gäller STÄNGDA kort. Ett öppet kort med etiketten men utan markör får
# inte fällas av blankocheck-spärren — etiketten kan ligga i förväg, och ett
# falskt rött på ett öppet kort är exakt det karensen finns för att undvika.
prova "T64 ÖPPET kort med avstådd-etikett utan markör -> fäller INTE" 0 \
"Status: ○ To Do
Labels: ${AVSTADD_ETIKETT}
${AC_HDR}
- [ ] #1 ett
${DOD_HDR}
- [ ] #1 dod"

# Redovisningen: ett undantag som inte syns är samma blinda fläck TASK-90
# lagade. Båda formerna namnger sina kort i varje körning.
prova_utskrift "T65 undantagna kort NAMNGES i täckningsblocket" 0 \
'TASK-1' 1 \
"${AVSTADD_KROPP}
Implementation Notes:
${AVSTADD_MARKOR} Marcus avstod QA:n verbatim."

# Policy-kopplingen är fail-closed: halva paret är en blankocheck, inte en
# härledning, och grinden vägrar gissa vilken halva som var avsedd.
POLICY_BAS='BACKLOG_KLAR_STATUS="Done"
BACKLOG_UNDANTAGNA_STATUSAR=""
BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT="intentionally-open"
BACKLOG_KARENS_TIMMAR="24"'

prova_policy "T66 härledd-mönster utan pekar-mönster -> exit 2" \
"${POLICY_BAS}
BACKLOG_HARLEDD_DOD_MONSTER=\"${HARLEDD_MONSTER}\"" \
2 'BACKLOG_LANDNINGS_PEKARE_MONSTER saknas'

prova_policy "T66b båda satta -> passerar (fällningen kom från kopplingen)" \
"${POLICY_BAS}
BACKLOG_HARLEDD_DOD_MONSTER=\"${HARLEDD_MONSTER}\"
BACKLOG_LANDNINGS_PEKARE_MONSTER=\"${PEKARE_MONSTER}\"" \
0 ''

prova_policy "T67 avstådd-etikett utan markör-variabel -> exit 2" \
"${POLICY_BAS}
BACKLOG_AVSTADD_KRAV_ETIKETT=\"${AVSTADD_ETIKETT}\"" \
2 'BACKLOG_AVSTADD_KRAV_MARKOR saknas'

prova_policy "T67b båda satta -> passerar (fällningen kom från kopplingen)" \
"${POLICY_BAS}
BACKLOG_AVSTADD_KRAV_ETIKETT=\"${AVSTADD_ETIKETT}\"
BACKLOG_AVSTADD_KRAV_MARKOR=\"${AVSTADD_MARKOR}\"" \
0 ''

# Avstängt läge: utan mönster ska grinden bete sig EXAKT som före TASK-281 —
# en obockad härledd rad på ett Done-kort fäller igen.
prova_policy "T68 tomma stängningsform-variabler -> formerna är avstängda" \
"${POLICY_BAS}" 0 ''

d="${TMP}/avstangt"
bygg_fixturer "${d}" 1 "${HARLEDD_KLAR}
Final Summary:
Landning: PR #1910."
printf '%s\n' "${POLICY_BAS}" > "${d}/policy.conf"
kor_fixtur "${d}"
if [[ "${SISTA_KOD}" -eq 1 ]]; then
    echo "  ✓ T68b samma kort med formerna AVSTÄNGDA -> fäller (formen gör skillnaden)"
    PASS=$((PASS + 1))
else
    echo "  ✗ T68b avstängda former borde ge exit 1, fick ${SISTA_KOD}"
    while IFS= read -r r; do echo "      ${r}"; done <<< "${SISTA_UT}"
    FAIL=$((FAIL + 1))
fi

# Korsvalideringen täcker de nya fälten också: filen och CLI:t måste vara
# överens om PEKAREN, inte bara om kryssrutorna. Fixturen manipuleras efter
# stub-bygget så att .md-filen bär en pekare som JSON:en saknar.
d="${TMP}/korsvalidering-pekare"
bygg_fixturer "${d}" 1 "${HARLEDD_KLAR}
Final Summary:
Levererad."
perl -pi -e 's/^Levererad\.$/Levererad. Landning: PR #1910./' "${d}/tasks/task-1.md"
kod=0
ut=""
ut="$(BACKLOG_CMD="${d}/backlog" BACKLOG_TASKS_DIR="${d}/tasks" \
      BACKLOG_CLOSURE_POLICY="${d}/policy.conf" bash "${GRIND}" 2>&1)" || kod=$?
if [[ "${kod}" -eq 2 ]] && grep -q 'stängningsformens fält' <<< "${ut}"; then
    echo "  ✓ T69 fil och CLI oense om landnings-pekaren -> exit 2"
    PASS=$((PASS + 1))
else
    echo "  ✗ T69 oenig pekar-korsvalidering gav inte exit 2 av rätt orsak (kod=${kod})"
    while IFS= read -r r; do echo "      ${r}"; done <<< "${ut}"
    FAIL=$((FAIL + 1))
fi

# Formatdrift i prosa-sektionerna: en Final Summary-RUBRIK utan markörpar får
# aldrig tolkas som "tom slutrad" — då hade varje pekare försvunnit tyst och
# grinden blivit rödare utan att någon förstod varför.
d="${TMP}/sektionsmarkor-borta"
bygg_fixturer "${d}" 1 "${HARLEDD_KLAR}
Final Summary:
Landning: PR #1910."
perl -0777 -pi -e 's/<!-- SECTION:FINAL_SUMMARY:BEGIN -->\n|<!-- SECTION:FINAL_SUMMARY:END -->\n//g' "${d}/tasks/task-1.md"
kod=0
ut=""
ut="$(BACKLOG_CMD="${d}/backlog" BACKLOG_TASKS_DIR="${d}/tasks" \
      BACKLOG_CLOSURE_POLICY="${d}/policy.conf" bash "${GRIND}" 2>&1)" || kod=$?
if [[ "${kod}" -eq 2 ]] && grep -q 'saknar markörparet' <<< "${ut}"; then
    echo "  ✓ T70 Final Summary-rubrik utan markörpar -> exit 2, aldrig tyst tom"
    PASS=$((PASS + 1))
else
    echo "  ✗ T70 saknad sektionsmarkör gav inte exit 2 av rätt orsak (kod=${kod})"
    while IFS= read -r r; do echo "      ${r}"; done <<< "${ut}"
    FAIL=$((FAIL + 1))
fi

# ── Pekarens SANNING (TASK-319) ──────────────────────────────────────────────
#
# TASK-281 prövade pekarens närvaro och form; ett påhittat nummer passerade.
# Fallen nedan bevisar att den gränsen är stängd — och de är formulerade i PAR
# på exakt samma sätt som resten av sviten: samma kort, samma policy, EN
# variabel skiljer. Skiljer bara landningshistoriken kan en fällning inte komma
# från något annat än sannings-prövningen.

MERGE_MONSTER="^Merge pull request #[0-9]+ from "

PEKAR_KORT="${HARLEDD_KLAR}
Final Summary:
Levererad. Landning: PR #4242."

prova_ancestry "T71 pekare som FINNS som landning -> passerar" 0 \
    "HEAD" "${MERGE_MONSTER}" "4242 1910" '' "${PEKAR_KORT}"

prova_ancestry "T72 SAMMA kort, pekaren finns INTE som landning -> FÄLLER" 1 \
    "HEAD" "${MERGE_MONSTER}" "1910 1930" '' "${PEKAR_KORT}"

prova_ancestry "T72b fällningen namnger numret och referensen" 1 \
    "HEAD" "${MERGE_MONSTER}" "1910" '#4242' "${PEKAR_KORT}"

# En falsk pekare är ett osant påstående även när den inte undantar någonting.
# Kortet nedan har ALLA rutor bockade — invariant 2 rör det inte — och ska ändå
# fällas, annars kan ett påhittat nummer stå kvar obemärkt på ett grönt kort.
prova_ancestry "T73 falsk pekare på kort med allt bockat -> FÄLLER ändå" 1 \
    "HEAD" "${MERGE_MONSTER}" "1910" 'finns inte som landning' \
"Status: ✔ Done
${AC_HDR}
- [x] #1 ett
${DOD_HDR}
- [x] #1 dod
Final Summary:
Landning: PR #4242."

# Ett sant nummer får inte skyla ett falskt. Kortet deklarerar två landningar
# och båda prövas.
prova_ancestry "T74 två pekare, en sann och en falsk -> FÄLLER på den falska" 1 \
    "HEAD" "${MERGE_MONSTER}" "1910" '#4242' \
"${HARLEDD_KLAR}
Final Summary:
Landning: PR #1910. Följdfix i Landning: PR #4242."

# AVSTÄNGT LÄGE — bakåtkompatibiliteten, prövad och inte antagen. Utan
# ancestry-variabler ska grinden bete sig EXAKT som före TASK-319: pekarens form
# räcker, och det påhittade numret passerar. Det är samma kort som T72 fäller
# på, så paret isolerar prövningen till precis den variabeln.
prova "T75 samma påhittade pekare med prövningen AVSTÄNGD -> passerar" 0 \
"${PEKAR_KORT}"

# GRACEFUL DEGRADATION. Saknas historiken kan sanningen inte prövas — och då
# ska grinden säga det, inte fälla. Ett falskt rött på varje pekare hade gjort
# nattgrinden permanent röd under fetch-depth: 1 och devalverat varje larm.
prova_ancestry "T76 referensen finns inte -> OPRÖVAD, fäller INTE" 0 \
    "finns-inte-har" "${MERGE_MONSTER}" "4242" 'OPRÖVADE' "${PEKAR_KORT}"

prova_ancestry "T76b det oprövade läget REDOVISAS, aldrig tyst" 0 \
    "finns-inte-har" "${MERGE_MONSTER}" "4242" 'SANNING är det inte' "${PEKAR_KORT}"

# FAIL-SAFE-RIKTNINGEN, det subtila fallet: mönstret matchar noll commits (t.ex.
# efter ett byte till squash-landningar). Mängden blir tom — och en tom mängd
# får ALDRIG läsas som "alla pekare är falska", vilket hade fällt hela
# backloggen på en konfigurationsändring.
prova_ancestry "T77 commit-mönstret matchar noll landningar -> OPRÖVBAR, ej allt-falskt" 0 \
    "HEAD" "^Squashed landing #[0-9]+ from " "4242" 'noll landningar matchade' \
"${PEKAR_KORT}"

# Policy-kopplingen är fail-closed på samma sätt som de två paren från TASK-281.
prova_policy "T78 ancestry-ref utan commit-mönster -> exit 2" \
"${POLICY_BAS}
BACKLOG_PEKARE_ANCESTRY_REF=\"HEAD\"" \
2 'BACKLOG_PEKARE_LANDNINGS_COMMIT_MONSTER saknas'

prova_policy "T78b båda satta -> passerar (fällningen kom från kopplingen)" \
"${POLICY_BAS}
BACKLOG_PEKARE_ANCESTRY_REF=\"HEAD\"
BACKLOG_PEKARE_LANDNINGS_COMMIT_MONSTER=\"${MERGE_MONSTER}\"" \
0 ''

# Repots RIKTIGA policy måste bära ett mönster som faktiskt matchar repots
# faktiska landningar — samma T10-form som test-jq-guard.sh använder mot den
# lokala binären. Ett mönster som är syntaktiskt giltigt men aldrig matchar
# hade gjort prövningen permanent oprövbar utan att någon märkte det.
kod=0
ut=""
ut="$(grep -oE '^BACKLOG_PEKARE_LANDNINGS_COMMIT_MONSTER=.*' .backlog-closure-policy.conf)" || kod=$?
if [[ "${kod}" -eq 0 ]] && grep -qE 'Merge pull request' <<< "${ut}"; then
    echo "  ✓ T79 repots egen policy bär landnings-mönstret för merge-köns form"
    PASS=$((PASS + 1))
else
    echo "  ✗ T79 repots .backlog-closure-policy.conf saknar ett brukbart landnings-mönster"
    FAIL=$((FAIL + 1))
fi

echo ""
echo "test-check-backlog-closure: ${PASS} passerade, ${FAIL} failade"
[[ "${FAIL}" -eq 0 ]] || exit 1
exit 0
