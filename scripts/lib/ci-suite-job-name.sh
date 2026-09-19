#!/usr/bin/env bash
# scripts/lib/ci-suite-job-name.sh
#
# EN delad konstant: ci.yml:s `suite`-jobbs `name:`-fält, exakt som det står i
# workflow-filen. Källa till sanning för VARJE skript som läser en
# ci.yml-körnings jobblista för att avgöra om "Test suite" faktiskt kördes
# eller hoppades som reusable-anrop.
#
# Konsumenter (TASK-464.4/SE1): scripts/classify-post-merge.sh (docs_only-
# klassningen, TASK-73/78) och scripts/dedup-huvudgren.sh (dedup_hit,
# SE1) — båda sourcear DENNA fil i stället för att skriva strängen på nytt,
# så en framtida namnändring i ci.yml kräver EN redigering, inte två som kan
# glida isär utan paritetsgrind mellan dem.
#
# Kopplingen mot ci.yml:s faktiska jobbnamn vaktas mekaniskt av
# scripts/test-classify-post-merge.sh (T13a) och scripts/test-dedup-
# huvudgren.sh — inte av denna fil, som bara håller värdet.
# shellcheck disable=SC2034  # konsumeras av filer som sourcear DENNA, aldrig
# lokalt — samma mönster som scripts/lib/gh-guard.sh/jq-guard.sh:s funktioner.
CI_SUITE_JOB_NAME="Test suite"
