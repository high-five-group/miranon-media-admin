---
id: TASK-92
title: >-
  Fynd: Install Vale är tredje curl-hämtade verktyget utan retry — docs-jobbet
  körde på alla sex PR:er i dag
status: To Do
assignee: []
created_date: '2026-07-29 17:53'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 172000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`TASK-83` gav `shellcheck` och `actionlint` retry i lint-jobbet. **En tredje instans av samma mönster står kvar:**

    .github/workflows/ci.yml:1015
    curl -sL "${VALE_URL}" -o /tmp/vale.tar.gz
    echo "${VALE_SHA256}  /tmp/vale.tar.gz" | sha256sum -c

Ingen `--retry`, ingen cache. Hittad och **rapporterad, inte tyst åtgärdad**, av `TASK-83`:s agent — den låg utanför det kortets scope.

### EXPONERINGEN ÄR JÄMFÖRBAR, INTE LÄGRE

Orkestreraren avfärdade först posten med att den *"ligger utanför den alltid-på grinden"*. **Det var fel i praktiken.** `docs:`-jobbet är villkorat på `docs_changed == 'true'` — men det körde på **samtliga sex PR:er 2026-07-29**, eftersom nästan allt arbete rör docs. Ett curl-fel här fäller alltså i praktiken lika brett som i lint-jobbet.

### FORMEN ÄR REDAN VALD OCH BEVISAD

`TASK-83` avgjorde den, med tvåsidigt bevis mot en lokal TLS-server som bryter handskakningen:

    curl -fsSL --retry 5 --retry-all-errors --retry-max-time 60 "${URL}" -o FIL

**Det avgörande skälet, som gäller även här:** curls `--retry` täcker en UPPRÄKNAD felmängd (timeout, FTP 4xx, HTTP 408/429/500/502/503/504/522/524). **Exit 35 `CURLE_SSL_CONNECT_ERROR` ingår INTE**, och `--retry-connrefused` adderar bara `ECONNREFUSED`. En fix med bara `--retry` hade landat grönt och lämnat felläget intakt. `--retry-all-errors` kräver curl 7.71.0+; runnern kör 8.5.0.

`-o` är förutsättningen — curl nollställer en fildestination mellan försök, en shell-redirect inte.

**SHA256-verifieringen ska bevaras orörd.** Säkerheten är i sin ordning; det är tillgängligheten som är problemet.

Källa: `TASK-83`:s agent-rapport 2026-07-29 § Avvikelser och oväntat.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Vale-hämtningen bär samma form som TASK-83 valde, inte en egen variant
- [ ] #2 sha256sum-verifieringen orörd och bevisad köra i lyckad väg — inte kringgången av retryn
- [ ] #3 Tvåsidigt bevis: fäller vid korrupt nyttolast, passerar vid transient nätfel — mätt, inte antaget
- [ ] #4 actionlint och yamllint rena på ändrad ci.yml
- [ ] #5 Sökt igenom ci.yml efter en FJÄRDE instans av mönstret — utfallet redovisat även om det är noll
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
