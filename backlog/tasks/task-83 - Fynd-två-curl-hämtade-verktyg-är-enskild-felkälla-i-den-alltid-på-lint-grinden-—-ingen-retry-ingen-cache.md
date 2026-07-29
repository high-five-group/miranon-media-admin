---
id: TASK-83
title: >-
  Fynd: två curl-hämtade verktyg är enskild felkälla i den alltid-på
  lint-grinden — ingen retry, ingen cache
status: To Do
assignee: []
created_date: '2026-07-29 09:50'
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
- [ ] #1 Frekvensen mätt före form väljs: hur många körningar de senaste N dagarna föll på något av de två stegen — siffra och metod redovisade, inte uppskattade
- [ ] #2 Vald form motiverad mot alla fyra alternativen; de förkastade bär sina skäl
- [ ] #3 sha256sum-verifieringen ORÖRD och bevisat orörd — visa steget före och efter
- [ ] #4 Tvåsidigt bevis: ett framkallat nätverksfel fäller INTE längre jobbet, medan en framkallad checksummeavvikelse FORTFARANDE fäller det — båda redovisade med run-ID eller lokalt körutdrag
- [ ] #5 Om form (d) väljs: frekvenssiffran och beslutet skrivs in där nästa läsare hittar dem, så kortet inte återuppstår som samma fynd
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
