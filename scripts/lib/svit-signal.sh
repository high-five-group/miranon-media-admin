#!/usr/bin/env bash
# scripts/lib/svit-signal.sh
#
# Delad läsning av "Test suite"-jobbets närvaro/konklusion i EN namngiven
# ci.yml-körning (merge_group ELLER pull_request). Signalen är empiriskt
# verifierad (scripts/classify-post-merge.sh § SIGNALEN — 20 körningar lästa
# 2026-07-28): ett SKIPPAT reusable-anrop rapporteras som ETT jobb med
# anropets EGNA namn; ett KÖRT anrop expanderar i stället till sina
# inner-jobb, prefixade "<namn> / " — "Test suite" existerar då INTE som
# eget jobbnamn i listan.
#
# ═══ TVÅ KONSUMENTER, EN LÄSNING (TASK-464.4/SE1) ═══
# scripts/classify-post-merge.sh (docs_only, TASK-73/78) och
# scripts/dedup-huvudgren.sh (dedup_hit, SE1) ställer OLIKA frågor
# ("skippades sviten?" kontra "kördes sviten och blev grön?") om SAMMA
# rådata. ADR-077 § Beslut 1: läs ett redan fattat beslut, bygg aldrig en
# andra implementation av LÄSNINGEN — bara besluten ovanpå den får skilja
# sig. Denna funktion är den delade läsningen; varje anropare tolkar
# signalen enligt sin egen policy och sköter sin egen fail-closed-gren.
#
# ═══ POSITIVT BELÄGG, INTE FRÅNVARO (TASK-464.4 runda 2, review-fynd) ═══
# Fram till denna rättelse tolkades "paraplyjobbet saknas som eget namn" som
# RUN rakt av — sant när anropet expanderat till sina inner-jobb, men EXAKT
# samma tomma träff uppstår om `CI_SUITE_JOB_NAME` döps om i ci.yml UTAN att
# scripts/lib/ci-suite-job-name.sh följer med: ett SKIPPAT jobb under det NYA
# namnet syns då inte under det GAMLA namnet skriptet fortfarande söker efter
# ⇒ tom träff ⇒ RUN ⇒ en OTESTAD landning ser grön ut. Enda processkyddet
# mot den drivet var de statiska kopplingstesterna (T14/T13a), som bara
# vaktar att konstanten MATCHAR ci.yml — inte att en körnings FAKTISKA svar
# tolkas rätt om den ändå glidit isär.
#
# RUN kräver nu POSITIVT belägg: minst ETT inre svit-jobb (namn med prefixet
# "<CI_SUITE_JOB_NAME> / ") med conclusion == success, OCH inget inre
# svit-jobb med en annan slutsats än success eller skipped. `skipped` är
# TILLÅTET bland inre jobb (verifierat mot verkliga körningar, se nedan) —
# `run_staging`/`run_a11y` är villkorslöst false på PR/merge_group-ytan
# (TASK-70.3/70.4), så "Test suite / Staging …" och "Test suite / A11y …"
# är ALLTID skipped där, i EVERY grön full-svit-körning, utan att det säger
# något om huruvida sviten "bevisade" trädet. Samma resonemang gäller ett
# urval-reducerat matrisläge (TASK-75, `acceptance_selection`): formeln i
# ci-suite.yml är `shard: fromJson(inputs.acceptance_selection == '' &&
# '[1,2,3]' || '[1]')` — vid urval EXISTERAR shard (2)/(3) helt enkelt
# INTE i jobblistan (inte "skipped", frånvarande), så regeln ovan ger
# fortfarande RUN så länge shard (1) finns med success.
#
# Verifierat mot verkliga körningar (2026-09-19):
#   35448948271 (full svit, grön)     → 8 inre jobb success, 4 st Staging/
#                                        A11y-jobb skipped → RUN
#   35444926324 (paraplyjobbet, grön) → "Test suite" med conclusion=skipped,
#                                        inga inre jobb alls → SKIPPED:skipped
#   Sökning efter ett urval-reducerat (`acceptance_selection` icke-tom) fall
#   gav INGEN träff i ett stickprov på >20 färska merge_group/pull_request-
#   körningar 2026-09-19 — urvalet tycks sällan slå till i praktiken just nu.
#   Regeln ovan är ändå KORREKT för det fallet: härledd direkt ur
#   ci-suite.yml:s egen shard-formel (källkod, inte gissning), och den
#   FAKTISKA anropsformen (matris-item som helt enkelt inte finns) är samma
#   struktur som redan är verifierad för Staging/A11y-fallet.
#
# ═══ TREDJE UTFALLET: OKAND (varken paraplyjobb eller giltigt inre belägg) ═══
# Kortets regel: "osäkerhet ⇒ sviten KÖR". Varken paraplyjobbet ELLER något
# inre svit-jobb hittat, ELLER inre jobb hittade men INGET har success,
# ELLER ett inre jobb med en konklusion utanför {success, skipped} ⇒ OKAND,
# ALDRIG RUN. Anroparen avgör hur OKAND tolkas (se resp. skripts fail-closed-
# gren) — denna funktion gissar aldrig åt något håll.
#
# KRÄVER, satta av anroparen innan anrop:
#   REPO               owner/namn (till `gh --repo`)
#   CI_SUITE_JOB_NAME   källa: scripts/lib/ci-suite-job-name.sh
#
# ANVÄNDNING
#   signal=$(las_svit_signal <run_id>)
#
# UTSKRIFT (stdout, EN rad) — exakt ett av:
#   RUN                        minst ett inre svit-jobb success, inget
#                              utanför {success, skipped}
#   SKIPPED:<conclusion>       paraplyjobbet finns med det exakta namnet;
#                              konklusionen bifogad rakt av (väntat
#                              "skipped" — en annan konklusion är en
#                              oväntad form, anroparen avgör hur den tolkas)
#   OKAND:tomt                 varken paraplyjobb eller inre svit-jobb i listan
#   OKAND:inga-lyckade         inre svit-jobb finns, men inget har success
#   OKAND:ovantad-konklusion   ett inre svit-jobb har en konklusion utanför
#                              {success, skipped}
#   API_FEL                    `gh run view` svarade inte
#
# Returnerar ALLTID 0 — anroparen läser SIGNALEN på stdout, aldrig
# exitkoden (samma "läs texten, inte bara koden"-disciplin som CLAUDE.md
# § Landning redan kräver av `gh pr merge`-anrop; ett icke-0-svar hade
# krävt att varje anropare även hanterade `set -e`-avbrott mitt i en
# `$(...)`-tilldelning, vilket bara lägger en andra felväg ovanpå den
# redan explicita `API_FEL`-signalen).
las_svit_signal() {
    local run_id="$1"
    local jobs_failed="" jobs_json paraply_concl prefix
    local inre_antal inre_success inre_ovantad

    # EN gh-anrop, hela jobblistan (namn + konklusion) — resten av
    # funktionen är lokal jq-bearbetning av samma svar, inga fler
    # nätverksanrop per körning.
    # shellcheck disable=SC2154  # REPO är ANROPARENS kontrakt (se § KRÄVER
    # ovan) — satt av toppnivå-skriptet, som DENNA fil aldrig sourcear
    # själv (den är den delade LÄSNINGEN, inte en toppnivå-anropare).
    jobs_json=$(gh run view "${run_id}" --repo "${REPO}" --json jobs \
        --jq '[.jobs[] | {name, conclusion}]') || jobs_failed="1"

    if [[ -n "${jobs_failed}" ]]; then
        echo "API_FEL"
        return 0
    fi

    # shellcheck disable=SC2154  # CI_SUITE_JOB_NAME — se § KRÄVER ovan.
    paraply_concl=$(jq -r --arg n "${CI_SUITE_JOB_NAME}" \
        '[.[] | select(.name == $n)][0].conclusion // ""' <<<"${jobs_json}")
    if [[ -n "${paraply_concl}" ]]; then
        echo "SKIPPED:${paraply_concl}"
        return 0
    fi

    # shellcheck disable=SC2154  # CI_SUITE_JOB_NAME — se § KRÄVER ovan.
    prefix="${CI_SUITE_JOB_NAME} / "
    inre_antal=$(jq -r --arg p "${prefix}" \
        '[.[] | select(.name | startswith($p))] | length' <<<"${jobs_json}")
    if [[ "${inre_antal}" -eq 0 ]]; then
        echo "OKAND:tomt"
        return 0
    fi

    inre_success=$(jq -r --arg p "${prefix}" \
        '[.[] | select(.name | startswith($p)) | select(.conclusion == "success")] | length' <<<"${jobs_json}")
    if [[ "${inre_success}" -eq 0 ]]; then
        echo "OKAND:inga-lyckade"
        return 0
    fi

    inre_ovantad=$(jq -r --arg p "${prefix}" \
        '[.[] | select(.name | startswith($p)) | select(.conclusion != "success" and .conclusion != "skipped")] | length' <<<"${jobs_json}")
    if [[ "${inre_ovantad}" -gt 0 ]]; then
        echo "OKAND:ovantad-konklusion"
        return 0
    fi

    echo "RUN"
    return 0
}
