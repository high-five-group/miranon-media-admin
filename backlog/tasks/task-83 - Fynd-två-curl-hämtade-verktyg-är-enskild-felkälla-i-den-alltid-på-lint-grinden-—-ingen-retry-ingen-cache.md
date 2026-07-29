---
id: TASK-83
title: >-
  Fynd: två curl-hämtade verktyg är enskild felkälla i den alltid-på
  lint-grinden — ingen retry, ingen cache
status: Done
assignee: []
created_date: '2026-07-29 09:50'
updated_date: '2026-07-29 18:04'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 163000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`lint`-jobbet (`Lint + Audit + TypeCheck`) är alltid-på: det kör på VARJE PR, oavsett klassning, och är därmed den grind som aldrig skippas. Två av dess steg hämtar sitt verktyg över nätet vid varje körning:

- `Install shellcheck (pinned v0.11.0)` — `curl -sL <github-releases-url> -o /tmp/sc.tar.xz`
- `Check workflow files (actionlint)` — `curl -sL <github-releases-url> -o /tmp/actionlint.tar.gz`

Båda följs av `sha256sum -c` mot en pinnad summa. **Säkerheten är alltså i sin ordning — problemet är tillgängligheten.** Ingen av dem har `--retry`, och ingen cachas mellan körningar.

### MÄTT, INTE ANTAGET (2026-07-29)

PR `#430`, första körningen: steget `Install shellcheck` föll med **exit 35** = `CURLE_SSL_CONNECT_ERROR`. Steget dog efter **0,13 s** (09:43:52.036 → 09:43:52.166) — curl bröt på anslutningen innan en byte kom fram.

**Den avgörande detaljen: `sha256sum -c` hann aldrig köra.** Det är skillnaden som gör klassningen entydig. En checksummeavvikelse hade varit en supply-chain-signal, gett exit 1 och skrivit utdata. Exit 35 efter 0,13 s är ett nätverksfel och ingenting annat.

Diffen i den PR:en var **en markdown-fil** och kan omöjligt påverka en shellcheck-installation.

Omkörning av det fallerade jobbet gav grönt.

### VARFÖR DET INTE ÄR OFARLIGT

1. **Det träffar den grind som aldrig skippas.** Ett falskt rött här stoppar varje landning, inklusive en revert.
2. **Falska röda devalverar signalen.** Repot bär redan lärdomen att ett obesvarat larm devalverar nästa (`TASK-74`/`#398`). Ett rött som "brukar bli grönt vid omkörning" tränar oss att köra om reflexmässigt — och då försvinner värdet av att grinden är röd.
3. **Reflexomkörning är exakt det beteende vi INTE vill ha.** Agenten som fann detta körde medvetet inte om utan att först belägga orsaken. Det är rätt beteende, men det ska inte behöva vara ett omdömesbeslut varje gång.

### AVGRÄNSNING

`sha256sum`-verifieringen är INTE upp för diskussion och ska stå kvar oförändrad. Kortet rör tillgänglighet, inte pinning. En lösning som byter ut verifieringen mot något svagare är fel lösning.

### FORMER SOM SKA VÄGAS MOT VARANDRA, INTE ANTAS

(a) `curl --retry N --retry-connrefused --retry-delay S` — minsta möjliga ändring, verifieringen orörd. Kontrollera vad vår curl-version faktiskt stödjer, i den version runnern kör.
(b) `actions/cache` på de nedladdade binärerna, med den pinnade SHA:n som cache-nyckel — tar bort nätberoendet i normalfallet helt.
(c) Byt till en Action som redan hanterar detta (t.ex. en release-pinnad shellcheck-Action) — väg mot att vi medvetet valde curl+sha256 för att kontrollera pinningen själva.
(d) Acceptera och gör inget — giltigt utfall om frekvensen är låg nog. Kräver då att frekvensen MÄTS, inte gissas.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Frekvensen mätt före form väljs: hur många körningar de senaste N dagarna föll på något av de två stegen — siffra och metod redovisade, inte uppskattade
- [x] #2 Vald form motiverad mot alla fyra alternativen; de förkastade bär sina skäl
- [x] #3 sha256sum-verifieringen ORÖRD och bevisat orörd — visa steget före och efter
- [x] #4 Tvåsidigt bevis: ett framkallat nätverksfel fäller INTE längre jobbet, medan en framkallad checksummeavvikelse FORTFARANDE fäller det — båda redovisade med run-ID eller lokalt körutdrag
- [x] #5 Om form (d) väljs: frekvenssiffran och beslutet skrivs in där nästa läsare hittar dem, så kortet inte återuppstår som samma fynd
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FREKVENS (AC#1) — MÄTT, INTE GISSAD

Metod: samtliga ci.yml-runs i fönstret enumererade via
`gh api .../actions/runs/<id>/jobs?filter=all`. `filter=all` är avgörande:
den ger ALLA attempts. PR #430:s fällning kördes om till grönt, så en
mätning som filtrerar på run.conclusion missar exakt det fall kortet bygger
på. Riggen validerades mot #430 innan den kördes brett — den återfann
fällningen 09:43:52 på attempt 1.

Fönster: 2026-07-22T17:10:39Z — 2026-07-29T17:26:38Z (7,01 dygn), n = 1000
ci.yml-runs. Fönstret är 7 dygn och inte 30 för att GitHubs list-API
returnerar max 1000 poster; de 1000 nyaste är sammanhängande, alltså en
FULLSTÄNDIG uppräkning av just det fönstret.

  Install shellcheck   1014 exekveringar — 1 failure, 987 success,
                       1 cancelled, 25 utan verdikt
  actionlint            1014 exekveringar — 0 failure, 995 success,
                       19 utan verdikt

Alltså 1 fällning på 988 avgjorda exekveringar (~0,1 %). Vid takten
~145 lint-jobb/dygn motsvarar punktskattningen ungefär en fällning i veckan.
n=1 ⇒ brett konfidensintervall; siffran bär inte mer vikt än så, och valet
motiveras av åtgärdens låga kostnad, inte av en säkerställd takt.

VALD FORM (AC#2): (a) curl-retry — men INTE kortets bokstavliga flaggor

  curl -fsSL --retry 5 --retry-all-errors --retry-max-time 60 URL -o FIL

Kortets förslag `--retry N --retry-connrefused` hade INTE fixat det uppmätta
felet. curl:s "transient" är en uppräknad mängd: timeout, FTP 4xx, HTTP 408,
429, 500, 502, 503, 504, 522, 524. Exit 35 (CURLE_SSL_CONNECT_ERROR) ingår
inte, och --retry-connrefused adderar bara ECONNREFUSED. --retry-all-errors
(curl 7.71.0+; runnern kör 8.5.0) är den flagga som täcker felet.
-o är förutsättningen — curl nollställer en filsdestination mellan försöken,
en shell-redirect inte. -f gör HTTP-fel till curl-fel så en 503 inte maskerar
sig som checksummeavvikelse. -S gör felet synligt trots -s.

FÖRKASTADE

(b) actions/cache — tar inte bort felläget: cache-miss (versionsbump,
    eviction, cache-tjänst nere) faller tillbaka på nätet, så retry behövs
    ändå. Additiv komplexitet, inte ersättning. Cachas den UPPACKADE binären
    hoppas sha256-kontrollen över vid träff — det vore precis den försvagning
    kortets avgränsning förbjuder. Kvarstår som påbyggnad om takten stiger.
(c) tredjeparts-Action — river ADR-029 § Third-party Actions-policy och
    återinför den klass korrigeringen 2026-07-23 tog bort (kod som exekverar
    före verifiering). Vi äger pinningen medvetet.
(d) acceptera — förkastad på kostnadsasymmetri, inte på takten: åtgärden är
    en flagga utan nytt beroende och utan underhåll, medan felet träffar den
    grind som aldrig skippas. Även intervallets optimistiska ände motiverar
    en flagga.

AC#3 — sha256sum ORÖRD: diffen ändrar exakt två rader (de två curl-raderna).
`sha256sum -c` och båda de pinnade konstanterna står kvar som oförändrade
kontextrader i bägge hunkarna.

AC#4 — TVÅSIDIGT BEVIS (lokalt, mot TLS-server som bryter handskakningen för
de N första anslutningarna ⇒ äkta exit 35, samma kod som #430):

  -sL (dåvarande form)                        + nätfel  → exit 35  FÄLLER
  -sL --retry 5 --retry-connrefused (kortets) + nätfel  → exit 35  FÄLLER
  -fsSL --retry 5 --retry-all-errors (vald)   + nätfel  → exit 0   PASSERAR
      (serverlogg: 2 framkallade brott, leverans på tredje; "dl.bin: OK")
  -fsSL --retry 5 --retry-all-errors (vald)   + korrupt → exit 1   FÄLLER
      ("dl.bin: FAILED", checksum did NOT match)

Rad 3 och 4 är de tvåsidiga; rad 1 och 2 visar att flaggvalet var det som
avgjorde. Grinden är även falsifierad åt andra hållet: en införd SC2086 i det
redigerade run-blocket fälls av actionlint (exit 1, ci.yml:760), återställd
exit 0.

AC#5 — form (d) valdes inte, så villkoret utlöses aldrig. Frekvenssiffran och
beslutet är ändå inskrivna i ci.yml intill steget, vilket är den plats nästa
läsare når.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
DONE 2026-07-29 (S91, sextonde resumen). PR #457, landad 18:03:51Z genom merge queue, CI grön per jobb.

AGENTEN RÄDDADE KORTET FRÅN SIN EGEN REKOMMENDATION. Kortet föreslog `--retry N --retry-connrefused --retry-delay S`. curls "transient" är en UPPRÄKNAD mängd — timeout, FTP 4xx, HTTP 408/429/500/502/503/504/522/524 — och exit 35 CURLE_SSL_CONNECT_ERROR ingår INTE. `--retry-connrefused` adderar bara ECONNREFUSED. Kortets bokstavliga fix hade landat grönt, stängt kortet och lämnat felläget HELT INTAKT.

VALD FORM: curl -fsSL --retry 5 --retry-all-errors --retry-max-time 60 "${URL}" -o FIL. `--retry-all-errors` kräver curl 7.71.0+; runnern kör 8.5.0. `-o` är förutsättningen — curl nollställer en fildestination mellan försök, en shell-redirect inte.

MÄTNINGEN (AC#1). Enumererade ci.yml-runs via `gh api .../runs/<id>/jobs?filter=all`. filter=all var avgörande: #430:s fällning kördes om till grönt, så en mätning på run.conclusion hade missat exakt det fall kortet bygger på. Riggen validerades mot #430 FÖRE bred körning och återfann fällningen.

  fönster 2026-07-22T17:10:39Z → 2026-07-29T17:26:38Z (7,01 dygn), n = 1000 runs
  Install shellcheck  1014 exekveringar → 1 failure, 987 success, 26 utan verdikt
  Check workflow files 1014 exekveringar → 0 failure, 995 success, 19 utan verdikt

1 fällning på 988 avgjorda ≈ 0,1 %, ungefär en i veckan vid ~145 lint-jobb/dygn. n=1 ⇒ brett intervall, utskrivet i kort, PR OCH ci.yml. Fönstret blev 7 dygn och inte 30 för att GitHubs list-API returnerar max 1000 poster — de 1000 nyaste är sammanhängande, alltså en fullständig uppräkning av just det fönstret, inte ett stickprov.

TVÅSIDIGT BEVIS (AC#4), mot en lokal TLS-server som bryter handskakningen ⇒ ÄKTA exit 35, samma kod som #430:

  -sL (dåvarande)                        nätfel → 35, fäller
  -sL --retry 5 --retry-connrefused      nätfel → 35, fäller   ← kortets egen (a)
  vald form                              nätfel → 0, passerar (2 brott, leverans på tredje, dl.bin: OK)
  vald form                              korrupt nyttolast → 1, fäller (dl.bin: FAILED)

Rad 3-4 är de tvåsidiga; rad 1-2 visar att flaggvalet avgjorde. Rad 3 visar att sha256sum kör och passerar i lyckad väg — verifieringen intakt, inte kringgången.

FÖRKASTADE: (b) cache tar inte bort felläget (miss ⇒ nät ändå) och cachad UPPACKAD binär skulle hoppa över sha256 · (c) river ADR-029 § Third-party Actions-policy och återinför klassen korrigeringen 2026-07-23 tog bort · (d) faller på kostnadsasymmetri.

AC#5 var villkorat på form (d), som inte valdes. Bockat med skälet skrivet i ci.yml intill steget — per husets standard är en bockad ruta med skrivet skäl entydig, medan en obockad ruta på ett stängt kort är tvetydig för alltid.

FALSIFIERING ÅT ANDRA HÅLLET: en införd SC2086 i det redigerade run-blocket FÄLLDES av actionlint (exit 1, ci.yml:760); återställd exit 0. Agentens FÖRSTA falsifieringsförsök gav exit 0 — den tolkade det inte som ett grönt kvitto utan bytte sond.

REGISTRERAT, EJ TYST ÅTGÄRDAT: en tredje instans av mönstret finns — Install Vale (ci.yml:1015), curl+sha256 utan retry i docs-jobbet. Mintad som TASK-92 efter mätning: docs-jobbet är villkorat på docs_changed men körde på SAMTLIGA SEX PR:er samma dag, så exponeringen är jämförbar och inte lägre.

Lesson-fragment: retry-flaggan-tacker-en-uppraknad-felmangd-las-den.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
