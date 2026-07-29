---
id: TASK-80
title: >-
  Fynd: videoinspelningen är mätbar egenlast som förvärrar just den mättnad den
  ska diagnostisera
status: Done
assignee: []
created_date: '2026-07-29 00:56'
updated_date: '2026-07-29 14:20'
labels:
  - ready-for-agent
dependencies: []
ordinal: 160000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
playwright.config.ts sätter video: 'retain-on-failure' på två ställen (rad 341 och rad 374). Playwright startar då EN ffmpeg-process per test, oavsett om testet sedan faller eller inte — 'retain' betyder att inspelningen KASTAS vid grönt, inte att den aldrig gjordes.

Mätt av TASK-74:s agent 2026-07-29: åtta ffmpeg-processer låg på 39-47 % CPU samtidigt, alltså ungefär TRE av 16 kärnor, för artefakter som kastades i 153 av 153 gröna fall.

### DET ÄR INTE BARA SLÖSERI — DET ÄR MISSTÄNKT SOM BIDRAGANDE ORSAK

TASK-74:s mekanism B3 är 'test-budgeten vid mättnad': tester faller när maskinen är mättad, och agentens skarpaste arm-A-utfall kom vid loadavg 125. Videoinspelningen är egenlast som pågår under HELA sviten och därmed höjer just den mättnad som fäller testerna.

Vi betalar alltså CPU för diagnostik av ett fel som betalningen bidrar till att orsaka. Det gör posten till en kandidat-FIX för flakigheten, inte enbart en hygien-fråga.

### VAD SOM SKA VÄGAS — INGEN VALD

(a) video: 'on-first-retry'. Playwright spelar då in enbart vid omkörning, alltså exakt när något föll och diagnostik behövs. Noll egenlast i normalfallet. Kostnaden: den FÖRSTA fällningen har ingen video, bara omkörningen — och för en flake som inte reproducerar vid retry förlorar vi bilden av den enda gången den föll.
(b) Behåll retain-on-failure men sänk workers. Löser mättnaden men sänker genomströmningen, alltså fel växel.
(c) Behåll som är, dokumentera kostnaden. Kräver att B3 kan stängas på annat sätt.

Alternativ (a) är rekommendationen men den ska PRÖVAS mot vad vi faktiskt förlorar, inte antas. Den avgörande frågan är hur ofta en klass-B-flake reproducerar vid retry: gör den inte det, är (a) ett byte av diagnostik mot hastighet och inte en ren vinst.

Notera att self-test-grenen redan bär video: 'off' (rad 374, isHermetikSjalvtest) — precedensen för villkorad inspelning finns alltså i filen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 CPU-lasten från inspelningen mätt före och efter ändringen under identisk workerlast — båda talen redovisade, loadavg angiven
- [ ] #2 Reproducerar en känd klass-B-flake vid retry eller inte — mätt, inte antaget; svaret avgör om (a) är en ren vinst eller ett byte
- [ ] #3 Valet motiverat mot alla tre formerna; de förkastade bär sina skäl
- [ ] #4 Diagnostik-förlusten explicit redovisad: vilken artefakt som INTE längre finns vid en första fällning, och varför det är acceptabelt
- [ ] #5 Fällningsraten mätt före och efter — om egenlasten bidrog till B3 ska den sjunka; om den inte gör det är det ett resultat som ska rapporteras, inte tystas
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
DONE 2026-07-29 (S91, efter femtonde pausen). PR #446 (`04c395f`). CI grön per jobb; A11y/Staging/purge SKIPPED per `run_staging`/`run_a11y: false`.

═══ KORTETS KANDIDAT-FIX-HYPOTES ÄR FALSIFIERAD ═══

Kortet påstod att videoinspelningen är egenlast som förvärrar just den mättnad den ska diagnostisera, och därmed en KANDIDAT-FIX för flakigheten. **Egenlasten är verklig och replikerad — men den förvärrar inte flakigheten.**

EGENLASTEN, MÄTT (5 varv interfolierad A/B, `--workers=8 --retries=0`, 765 testresultat per arm, riggen från TASK-81 och aldrig en egen variant):

  arm A `retain-on-failure`   ffmpeg i 95 % av samplingarna (335/351), max 10 samtidiga,
                              CPU-medel 127,3 % / max 415,4 % (≈4,2 av 16 kärnor), loadavg-median 42,5
  arm B `on-first-retry`      ffmpeg i 0 % (0/327), max 0, CPU 0 %, loadavg-median 22,1

NOLL-RESULTATET SOM BÄR SLUTSATSEN: körtidsmedian **162 s mot 163 s = −1 s mot ett brusgolv på ±72 s**. Fällningar 3/765 mot 1/765, och `hem:437` föll i BÅDA armarna. Arm A nådde loadavg **105,7 UTAN fällning** medan en fällning kom vid **18,5** — lastkopplingen håller alltså inte i mätt spann.

FORMVALET GICK EMOT KORTETS EGEN REKOMMENDATION, på källbelägg. Vald form: **(c) behåll `retain-on-failure`, dokumentera kostnaden.**

(a) `on-first-retry` FÖRKASTAD. `shouldPreserveVideo` returnerar ovillkorligt `true` för det läget — verifierat av orkestreraren i `node_modules/playwright/lib/index.js:466-480`: `on`/`on-first-retry`/`on-all-retries` returnerar `true` utan att pröva `testFailed`, medan `retain-on-failure` returnerar just `testFailed`. En retry som PASSERAR sparar alltså video. Kombinerat med att **10 av 13 fällningar under framkallad mättnad (load 99-175) INTE reproducerade vid retry** (23 % reproduktion; CI-historiken 32 jobb ger 0 %) hade (a) sparat en GRÖN video medan fällningen förblev obevakad — alltså sämre diagnostik utan mätbar lastvinst.

OPTIONS-RYMDEN VAR STÖRRE ÄN KORTETS TRE: Playwright har sju lägen. `retain-on-first-failure` och `retain-on-failure-and-retries` ger ingen lastvinst.

BEVIS I BÅDA RIKTNINGAR före huvudserien: 28/28 gröna tester gav **0 behållna videor men ffmpeg i 17/25 samplingar** — inspelning sker, artefakten kastas, precis som kortet påstod. Arm B gav 0 % ffmpeg, vilket bevisar att patchen faktiskt bet.

═══ VAD MÄTNINGEN INTE KAN AVGÖRA — agentens egna förbehåll, bevarade ═══

Kraften räcker inte för en liten effekt: vid ~0,4 % fällningsrat krävs tusentals resultat per arm, och **3 mot 1 på n=5 är slumpterritorium**. CI är omätt (darwin/16 kärnor mot `ubuntu-latest`/4; kärnandelen är proportionellt lika enligt `common/index.js:595`, men absolut headroom mindre). Ordningseffekten kvarstår eftersom riggen kodar `A,B,A,B` — dock startade arm B vid HÖGRE load (5,57 mot 5,32), vilket talar mot att B vore gynnad. Negativ kontrollserie kördes inte; den var planerad om skillnaden hållit och behövdes inte för att bära ett noll-resultat.

═══ REGISTRERAT, EJ TYST FÖRKASTAT ═══

1. **NY FLAKE:** `hem:437 dagar-kvar-pillen`, 3 fällningar i BÅDA armarna över lastspannet 18-42. Varken video- eller tydligt lastdriven. **Förtjänar eget kort** — mintas av den session som äger nummerserien.
2. **Mätt indikation, ej fynd:** 640×360 gav CPU-medel 69,2 % mot 127,3 %, men n=1 med loadavg 27,0 mot 51,8 — confoundern är för stor. Egen A/B-serie krävs innan något påstås.
3. Kortets radnummer 341/374 var 353/440 vid start.

VÄRDET AV ETT NOLL-RESULTAT: kortet stängs med "premissen höll inte" i stället för med en ändring som inte hjälper. Agenten körde dessutom en framkallad mättnad långt förbi `TASK-74`:s 125 för att ge hypotesen dess bästa chans att vara sann.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
