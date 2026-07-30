---
id: TASK-92
title: >-
  Fynd: Install Vale är tredje curl-hämtade verktyget utan retry — docs-jobbet
  körde på alla sex PR:er i dag
status: Done
assignee: []
created_date: '2026-07-29 17:53'
updated_date: '2026-07-30 19:49'
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
- [x] #1 Vale-hämtningen bär samma form som TASK-83 valde, inte en egen variant
- [x] #2 sha256sum-verifieringen orörd och bevisad köra i lyckad väg — inte kringgången av retryn
- [x] #3 Tvåsidigt bevis: fäller vid korrupt nyttolast, passerar vid transient nätfel — mätt, inte antaget
- [x] #4 actionlint och yamllint rena på ändrad ci.yml
- [x] #5 Sökt igenom ci.yml efter en FJÄRDE instans av mönstret — utfallet redovisat även om det är noll
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ÄNDRINGEN: en funktionell rad (ci.yml Install Vale) + kommentar-rationale.

  - curl -sL "${VALE_URL}" -o /tmp/vale.tar.gz
  + curl -fsSL --retry 5 --retry-all-errors --retry-max-time 60 "${VALE_URL}" -o /tmp/vale.tar.gz

AC#1 — SAMMA FORM, MEKANISKT BEVISAD. De tre curl-anropen i ci.yml ger
`uniq -c` = "3  curl -fsSL --retry 5 --retry-all-errors --retry-max-time 60",
alltså EN unik flaggsträng över alla tre platserna. Ingen egen variant.

AC#2 — sha256sum ORÖRD. `sha256sum -c` och den pinnade konstanten står som
OFÖRÄNDRADE kontextrader i diffen (inga +/- på dem). Bevisad köra i lyckad
väg skarpt mot den riktiga assetet: nya formen mot
github.com/errata-ai/vale/releases/.../v3.14.1 gav curl exit 0, sha256sum
exit 0 ("OK") mot ci.yml:s pinnade summa, tar -xzf exit 0 (39 658 848 byte
binär). Redirect-kedjan: 2 redirects, http 200 — `-f` bryter alltså INTE
org-rename-redirecten errata-ai -> vale-cli, och `-L` finns kvar i `-fsSL`.

AC#3 — TVÅSIDIGT BEVIS mot lokal TLS-server som bryter handskakningen för de
två första anslutningarna => ÄKTA curl exit 35, samma kod som fällde #430:

  arm 1  -sL (formen före denna PR)          nätfel  -> curl 35  FÄLLER
  arm 2  -sL --retry 5 --retry-connrefused   nätfel  -> curl 35  FÄLLER
  arm 3  vald form                           nätfel  -> curl 0, sha256sum 0 "OK"  PASSERAR
  arm 4  vald form                           nätfel + KORRUPT nyttolast
                                                     -> curl 0, sha256sum 1 "FAILED"  FÄLLER

Arm 3-4 är de tvåsidiga. Arm 1-2 visar att FLAGGVALET avgjorde, inte tur.
Arm 4 är den skarpaste: retryn lyckas (curl 0) och checksumman fäller ändå —
verifieringen är alltså inte kringgången av retryn. Serverloggarna redovisar
2 framkallade brott + leverans på tredje anslutningen i båda.

`-o`-PREMISSEN VERIFIERAD, INTE ANTAGEN. Sond: fel MITT I överföringen (halv
kropp mot deklarerad Content-Length => exit 18), så byte hinner skrivas före
retryn — ett connect-fel duger inte som sond, då har inget skrivits än.
Nyttolast 382 byte, 2 avbrott, hel kropp på tredje:

  -o FIL  (produktionsformen)  -> 382 byte, sha256sum 0 "OK"
  > FIL   (shell-omdirigering) -> 764 byte (191+191+382), sha256sum 1 "FAILED"

Shell-omdirigeringen ackumulerar de partiella försöken eftersom skalet öppnar
fd:n EN gång; curl kan nollställa sin egen `-o`-destination men inte den.
Not: i `>`-fallet blir curl-exit 0 och felet visar sig som checksummeavvikelse
— alltså en nätstörning förklädd till supply-chain-signal.

AC#4 — actionlint exit 0, yamllint exit 0 med CI:s exakta kommandon
(`actionlint -color -ignore 'unexpected key "queue" for "concurrency" section'`
respektive `yamllint .github/`). Baslinje före ändring var också 0/0, så
utfallet är hänförbart. Övriga CI-grindar som läser workflow-filer kördes
också: check-fetch-depth-invariant 0, test-classify-post-merge 0,
test-acceptance-urval 0.

GRINDARNA FALSIFIERADE ÅT ANDRA HÅLLET mot mitt EGET block:
  - okänd stegnyckel `retry-count: 5` -> actionlint exit 1, pekar på rad 1064
  - trailing whitespace på min kommentarrad -> yamllint exit 1, rad 1063
Båda återställda; ci.yml byte-identisk med föregående tillstånd (SHA-verifierat).
FÖRSTA falsifieringsförsöket (avquotning av ${VALE_URL} för SC2086) gav exit 0.
Det lästes INTE som ett grönt kvitto — diagnosen visade att shellcheck korrekt
är tyst där, eftersom VALE_URL bevisligen saknar ord-delande tecken. Sonden var
fel, inte grinden; sonden byttes.

AC#5 — FJÄRDE INSTANS: NOLL. Utfallet redovisat, inte utelämnat.
Sökt bredare än kortets ordalydelse, eftersom en grep på "curl" i ci.yml inte
kan se en hämtning som sker inne i ett anropat skript:
  1. curl i ci.yml               -> 3 träffar (rad 511 actionlint, 774
                                    shellcheck, 1068 Vale). Efter denna PR bär
                                    alla tre samma form. Ingen fjärde.
  2. curl/wget i SAMTLIGA sju workflow-filer -> samma 3, inga andra.
  3. wget i ci.yml               -> 0
  4. gh release download / gh api -o -> 0
  5. curl/wget INUTI de 16 skript ci.yml anropar (scripts/, .githooks/) -> 0
NÄRA MEN EJ MÖNSTRET, klassat i stället för ignorerat:
  - `pip install --quiet yamllint` (rad 523): nätverkshämtat verktyg, men pip
    har inbyggd retry — verifierat `--retries` default 5, inte antaget.
  - `npm ci` / `npx`: npm fetch-retries default 2, verifierat via
    `npm config get fetch-retries`.
Båda bär alltså redan retry och saknar den egenskap som gör mönstret farligt.

EXPONERINGEN MÄTT (bakgrund till att formen inte försvagades). Metod = TASK-83:s
`jobs?filter=all`, så alla attempts räknas och talen är jämförbara.
Fönster 2026-07-28T19:23:29Z -> 2026-07-30T19:15:23Z, n = 300 ci.yml-runs:
  Install Vale                  289 exekveringar, 287 success, 0 failure
  Install shellcheck (pinned)   305 exekveringar, 298 success, 1 failure
  Check workflow files          305 exekveringar, 304 success, 0 failure
Vale kör alltså på 95 % av det alltid-på lint-jobbets takt trots
docs_changed-villkoret — kortets tes bekräftad med siffra.
Den enda fällningen lokaliserades till run 30440730493 (2026-07-29T09:42:36Z),
alltså den redan kända #430-fällningen FÖRE TASK-83:s fix landade
(2026-07-29T18:03:51Z) — ingen ny fällning efter fixen. Fönstret efter fixen är
bara ~25 h och bastakten ~0,1 %, så det bekräftar fixen men bevisar den inte.

MÄTNINGARNA ÄR LOKALA där inget annat sägs. Exponeringstalen ovan kommer från
CI:s API; bevisriggens exitkoder är körda lokalt (curl 8.7.1 mot runnerns
8.5.0 — båda >= 7.71.0 som --retry-all-errors kräver).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Install Vale bär nu samma curl-form som husets två andra pinnade verktyg — uniq -c över ci.yml:s tre curl-anrop ger EN grupp om 3, alltså mekaniskt bevisad paritet. sha256sum-verifieringen orörd. -o-premissen MÄTT och inte antagen: en sond som bryter överföringen mitt i kroppen ger -o FIL = 382 byte OK mot > FIL = 764 byte FAILED med curl-exit 0 — shell-omdirigering förkläder alltså en nätstörning till supply-chain-signal. Exit 35 bevisad skarpt mot TLS-server som bryter handskakningen: --retry 5 --retry-connrefused fäller fortfarande, --retry-all-errors passerar, och korrupt nedladdning fäller ändå på checksumman. Fjärde instans av mönstret: NOLL, sökt över fem axlar. Exponeringen mätt till 95 % av lint-jobbets takt. Ingen Vale-fällning har observerats — ändringen vilar på mönstret och kostnadsasymmetrin, utskrivet så ingen läser in motsatsen. PR #479, CI grön per jobb.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
