#!/usr/bin/env bash
# stop-vakt.sh — Stop/SubagentStop-hook som stämmer av aktörens AVSLUTSPÅSTÅENDE
# mot OBSERVERAT tillstånd, och vägrar avslutet (en gång) när ett väntepåstående
# inte bärs av någon observerbar mekanism.
#
# VARFÖR SKRIPTET FINNS (T108, flaggad MÅSTE LÖSAS av Marcus 2026-07-29):
#   aktörer avslutar sin tur med ett påstående om framtiden som ingen mekanism
#   bär — "väntar på att #439 landar" utan att någon notifierare existerar.
#   Åtta kort-stängningar fördröjdes en enda dag, och båda upptäckterna gjordes
#   av Marcus — husets dyraste fångst-mekanism. Formvalet (trådens form (d),
#   omvänd default, mekaniserad som Stop-hook) är avgjort i research-passet
#   docs/research/obevakade-tillstand-vaktens-form-2026-07-30.md; beslutet är
#   ADR-087. Registrerad i .claude/settings.json för BÅDA hook-eventen —
#   mätning 5–6 i passet visade att SubagentStop fyrar för både synkrona och
#   bakgrundsspawnade subagenter, så samma skript täcker båda aktörsklasserna.
#
# VAD DEN PRÖVAR (mekaniskt, aldrig semantiskt):
#   1. `stop_hook_active` == true  → exit 0 DIREKT. Mätning 2: fältet är false
#      vid första avslutsförsöket och true efter en blockering. Vakten
#      blockerar därmed HÖGST EN GÅNG per avslutssekvens — harnessets tak på
#      8 (mätning 3) är andra försvarslinje, inte design.
#   2. `last_assistant_message` matchar inget väntepåstående → exit 0. Detta
#      är normalvägen och den är billig: en jq-körning på liten indata.
#   3. Väntepåstående matchat: bärs det av (a) ett KÖRANDE bakgrundsjobb i
#      `background_tasks`, eller (b) en explicit VÄNTLÄGE:-deklaration
#      (passiv väntan som uttalat, motiverat val)? → exit 0.
#   4. Annars: blockera med AVSTÄMNINGENS RESULTAT — tillstånd, inte
#      tillsägelse (mätning 5b: `reason` som instruktion kan ignoreras; det
#      som levereras är underlaget, inte en förmaning).
#
# FAIL-CLOSED (förebild scripts/ci-wait.sh): kan tillståndet inte avgöras —
#   jq saknas, indata oparsbar, policyfil saknas/ogiltig — blockeras avslutet
#   med felet som reason. Ett mätinstrument som går sönder ljudlöst är värre
#   än inget. Degraderat läge: kan `stop_hook_active` inte läsas via jq läses
#   det med grep ur råtexten, så frisläppnings-kontraktet (punkt 1) håller
#   även när parsern är trasig och taket på 8 aldrig nås av vaktens eget fel.
#
# KÄNDA BLINDA FLÄCKAR (mätta, bokförda i ADR-087 — detta är en heuristik):
#   · `background_tasks` listar INTE spawnade agenter (passet § Vad jag inte
#     kunde belägga: [] i båda subagent-mätningarna, även med bakgrundsagent
#     igång). En äkta väntan på en subagent ser därför obevakad ut → falskt
#     larm, kostar en blockering, släpps av punkt 1 eller VÄNTLÄGE-raden.
#   · Task-notifikationskedjan mot en idle huvudsession kan tystna (T112,
#     Mätt 1: en fullbordad vakt väckte ingen förrän nästa dag). Ett körande
#     bakgrundsjobb BÄR påståendet i denna avstämning, men garanterar INTE
#     väckning. Det hålet täcks inte av detektorn och döljs inte.
#   · Prosa-matchningen har falska negativ: mönsterlistan är ändlig, och en
#     omskrivning som inte matchar passerar. Strikt bättre än nuläget (där
#     detektorn är Marcus) — aldrig ett täckningsanspråk.
#
# KONFIG-DRIVEN (Lesson #6): logiken här är universell; mönstren bor i
#   .stop-vakt-policy.json (JSON, inte sourcad .conf — en sourcad conf måste
#   stå i ci.yml:s shellcheck-scope, en jq-läst JSON exekveras aldrig).
#   Sökordning: STOP_VAKT_POLICY > <skriptkatalog>/../.stop-vakt-policy.json.
#
# OUTPUT-KONTRAKT: stdout bär ENBART hook-beslutet — antingen ingenting
#   (tillåt) eller `{"decision":"block","reason":"…"}` (mätning 1:s form).
#   All diagnostik går till stderr. Exit är ALLTID 0: en Stop-hook som dör
#   med annan exitkod är fail-open (turen avslutas med enbart en varning).
#
# LOGG (frivillig): sätt STOP_VAKT_LOGG till en filsökväg så appendas en
#   JSONL-rad per anrop {ts, event, stop_hook_active, beslut, skal}. Används
#   av fyrningsbeviset (scripts/test-stop-vakt.sh + livlab) och vid felsökning.
#   Loggfel fäller aldrig hooken.
#
# Användning: bash scripts/stop-vakt.sh < hook-payload.json
# Självtest:  bash scripts/test-stop-vakt.sh  (tvåsidigt bevis: fäller mot
#   planterat väntepåstående-fel OCH är grön mot korrekt avslut)
#
# Källa: docs/decisions/ADR-087-stop-vakten-avslutspastaende-mot-observerat-tillstand.md
#        docs/research/obevakade-tillstand-vaktens-form-2026-07-30.md
#        tasks/threads/T112-vackningskedjan-over-turgransen.md
# Etablerad: TASK-113 (2026-08-01, Marcus GO klass A)

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
POLICY="${STOP_VAKT_POLICY:-${SCRIPT_DIR}/../.stop-vakt-policy.json}"
# shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/jq-guard.sh lintas separat via ci.yml:s shellcheck-lista
source "${SCRIPT_DIR}/lib/jq-guard.sh"

INDATA="$(cat || true)"

# --- Loggning (frivillig, får aldrig fälla hooken) --------------------------
logga() {
    # $1 = beslut, $2 = skäl, $3 = stop_hook_active (som text)
    [[ -n "${STOP_VAKT_LOGG:-}" ]] || return 0
    printf '{"ts":"%s","beslut":"%s","skal":"%s","stop_hook_active":%s}\n' \
        "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" "$2" "${3:-null}" \
        >> "${STOP_VAKT_LOGG}" 2> /dev/null || true
    return 0
}

# --- Degraderad stop_hook_active-läsning (jq-fri) ---------------------------
# Frisläppnings-kontraktet (punkt 1 i huvudet) måste hålla ÄVEN när jq saknas
# eller indata inte är parsbar JSON — annars blockerar en trasig vakt varje
# avslutsförsök upp till harnessets tak. Fältet skrivs av harnesset, inte av
# modellen, så den textuella formen är stabil nog för grep i degraderat läge.
aktiv_degraderat() {
    grep -Eq '"stop_hook_active"[[:space:]]*:[[:space:]]*true' <<< "${INDATA}"
}

# --- Fail-closed-blockering med STATISK reason (jq-fri väg) -----------------
# Endast fasta strängar utan citattecken får passera hit — ingen dynamisk
# text, ingen escaping-yta. Dynamiska reasons byggs alltid via jq nedan.
blockera_statiskt() {
    # $1 = reason (statisk, JSON-säker), $2 = skäl-etikett för loggen
    logga "blockera" "$2" "false"
    printf '{"decision":"block","reason":"%s"}\n' "$1"
    exit 0
}

if ! jq_version_ok 2> /dev/null; then
    if aktiv_degraderat; then
        logga "tillat" "stop_hook_active_degraderat" "true"
        exit 0
    fi
    blockera_statiskt "STOP-VAKTEN (T108/ADR-087): jq saknas eller är för gammal (TASK-312, .jq-version-policy.conf) — avslutspåståendet kan inte stämmas av mot observerat tillstånd (fail-closed, förebild ci-wait.sh). Detta är vaktens eget fel, inte ditt. Nästa avslutsförsök släpps igenom (stop_hook_active)." "jq_saknas"
fi

if [[ -z "${INDATA}" ]]; then
    blockera_statiskt "STOP-VAKTEN (T108/ADR-087): tom hook-indata — tillståndet kan inte avgöras (fail-closed). Detta är vaktens eget fel, inte ditt. Nästa avslutsförsök släpps igenom (stop_hook_active)." "tom_indata"
fi

if [[ ! -f "${POLICY}" ]]; then
    AKTIV="$(jq -r '.stop_hook_active // false' <<< "${INDATA}" 2> /dev/null || echo "oparsbar")"
    if [[ "${AKTIV}" == "true" ]]; then
        logga "tillat" "stop_hook_active" "true"
        exit 0
    fi
    blockera_statiskt "STOP-VAKTEN (T108/ADR-087): policyfilen saknas (sökte STOP_VAKT_POLICY, annars .stop-vakt-policy.json i repo-roten) — väntepåstående-mängden kan inte avgöras (fail-closed). Detta är vaktens eget fel, inte ditt. Nästa avslutsförsök släpps igenom (stop_hook_active)." "policy_saknas"
fi

# --- Avstämningen: EN jq-körning avgör beslutet -----------------------------
# Ordningen inuti programmet speglar huvudets punkt 1–4. Policy-valideringen
# ligger EFTER stop_hook_active-grenen: en trasig policy ska larma högljutt,
# men aldrig kunna hålla en tur fången förbi första blockeringen.
RESULTAT="$(jq -c --slurpfile pol "${POLICY}" '
    ($pol[0] // {}) as $cfg
    | (.stop_hook_active // false) as $aktiv
    | (.last_assistant_message // "") as $msg
    | (.hook_event_name // "okänt") as $event
    | (.background_tasks // []) as $bg
    | ($bg | length) as $bg_alla
    | ($bg | map(select((.status // "") == "running")) | length) as $bg_korande
    | if $aktiv then {beslut: "tillat", skal: "stop_hook_active"}
      elif ($cfg.vantepastaende_monster? | type) != "array"
        or ($cfg.undantag_monster? | type) != "array"
        or ($cfg.vantval_marker? | type) != "array"
      then {beslut: "blockera", skal: "policy_ogiltig"}
      elif $msg == "" then {beslut: "tillat", skal: "tomt_meddelande"}
      elif any($cfg.vantval_marker[]; . as $re | $msg | test($re))
      then {beslut: "tillat", skal: "vantlage_deklarerat"}
      else (reduce $cfg.undantag_monster[] as $re ($msg; gsub($re; " "))) as $rest
        | [ $cfg.vantepastaende_monster[] | select(. as $re | $rest | test($re)) ] as $traffar
        | if ($traffar | length) == 0
          then {beslut: "tillat", skal: "inget_vantepastaende"}
          elif $bg_korande > 0
          then {beslut: "tillat", skal: "buret_av_bakgrundsjobb"}
          else {beslut: "blockera", skal: "obevakad_vantan",
                event: $event, monster: $traffar[0],
                utdrag: ([$rest | match($traffar[0]).string] | first // ""),
                bg_alla: $bg_alla, bg_korande: $bg_korande}
          end
      end
    | . + {aktiv: $aktiv}
' <<< "${INDATA}" 2> /dev/null || true)"

if [[ -z "${RESULTAT}" ]]; then
    if aktiv_degraderat; then
        logga "tillat" "stop_hook_active_degraderat" "true"
        exit 0
    fi
    blockera_statiskt "STOP-VAKTEN (T108/ADR-087): hook-indata eller policyfil oparsbar/ogiltig (även en trasig regex hamnar här) — tillståndet kan inte avgöras (fail-closed). Detta är vaktens eget fel, inte ditt. Nästa avslutsförsök släpps igenom (stop_hook_active)." "oparsbar"
fi

BESLUT="$(jq -r '.beslut' <<< "${RESULTAT}" 2> /dev/null || echo "")"
SKAL="$(jq -r '.skal' <<< "${RESULTAT}" 2> /dev/null || echo "")"
AKTIV="$(jq -r '.aktiv' <<< "${RESULTAT}" 2> /dev/null || echo "false")"

if [[ "${BESLUT}" == "tillat" ]]; then
    logga "tillat" "${SKAL}" "${AKTIV}"
    exit 0
fi

if [[ "${SKAL}" == "policy_ogiltig" ]]; then
    blockera_statiskt "STOP-VAKTEN (T108/ADR-087): policyfilen är ogiltig — fälten vantepastaende_monster/undantag_monster/vantval_marker måste alla vara arrayer (fail-closed). Detta är vaktens eget fel, inte ditt. Nästa avslutsförsök släpps igenom (stop_hook_active)." "policy_ogiltig"
fi

# --- Blockering med AVSTÄMNINGENS RESULTAT ----------------------------------
# Tillstånd, inte tillsägelse (mätning 5b): det som levereras är vad som
# påstods, vad som observerades, avstämningens kända blinda fläckar, och de
# tre vägar som bär en väntan. Mottagaren äger valet.
logga "blockera" "${SKAL}" "${AKTIV}"
jq -c --arg policy "${POLICY}" '
    "STOP-VAKTEN (T108 · ADR-087) — avstämning av avslutspåståendet mot observerat tillstånd:\n"
    + "· Påstående: turen avslutas med ett väntepåstående — mönstret «" + (.monster // "?")
    + "» matchade texten \"" + (.utdrag // "") + "\" (" + (.event // "okänt") + ").\n"
    + "· Observerat i hook-indatan: background_tasks bär " + (.bg_alla | tostring)
    + " post(er), varav " + (.bg_korande | tostring)
    + " körande — ingen observerbar mekanism bär påståendet.\n"
    + "· Avstämningens kända blinda fläckar (mätta): spawnade agenter syns INTE i background_tasks, och en bakgrundsvakts fullbordan kan tystna mot en idle huvudsession (T112) — en väntan kan vara äkta utan att synas här, och ett körande jobb garanterar inte väckning.\n"
    + "· Vägar som bär en väntan: (1) en verklig vakt som bakgrundsjobb (run_in_background), (2) explicit deklaration på egen rad «VÄNTLÄGE: <vad som väcker, och hur det verifieras>», (3) rätta påståendet om ingen väntan föreligger.\n"
    + "Detta är avstämningens resultat, inte en instruktion. Nästa avslutsförsök släpps igenom (stop_hook_active). Mönstren: " + $policy
    | {decision: "block", reason: .}
' <<< "${RESULTAT}" 2> /dev/null || printf '{"decision":"block","reason":"STOP-VAKTEN (T108/ADR-087): väntepåstående utan buren mekanism — och reason-byggaren fallerade (fail-closed). Nästa avslutsförsök släpps igenom (stop_hook_active)."}\n'

exit 0
