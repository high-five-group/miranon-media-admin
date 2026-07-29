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
- [x] #1 CPU-lasten från inspelningen mätt före och efter ändringen under identisk workerlast — båda talen redovisade, loadavg angiven
- [x] #2 Reproducerar en känd klass-B-flake vid retry eller inte — mätt, inte antaget; svaret avgör om (a) är en ren vinst eller ett byte
- [x] #3 Valet motiverat mot alla tre formerna; de förkastade bär sina skäl
- [x] #4 Diagnostik-förlusten explicit redovisad: vilken artefakt som INTE längre finns vid en första fällning, och varför det är acceptabelt
- [x] #5 Fällningsraten mätt före och efter — om egenlasten bidrog till B3 ska den sjunka; om den inte gör det är det ett resultat som ska rapporteras, inte tystas
<!-- AC:END -->



## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MÄTT MED RIGGEN (npm run metrics:flake), INTE MED EN EGEN VARIANT.
Serie: 5 varv interfolierad A/B (A,B,A,B,...), --workers=8, --retries=0, 765
testresultat per arm. Arm A = retain-on-failure (nuvarande), arm B = on-first-retry.
Rådata: serie.jsonl + resultat.jsonl. Maskin: 16 kärnor, loadavg 3,05-4,4 vid start.

AC 1 — EGENLASTEN, FÖRE OCH EFTER (samplad var 2:e sekund under körningsfönstren,
jämförd endast över samplingar med ffmpeg närvarande):
  arm A: ffmpeg i 95 % av samplingarna (335/351), max 10 samtidiga processer,
         CPU-medel 127,3 %, CPU-max 415,4 % (≈4,2 av 16 kärnor),
         loadavg-medel 51,8, loadavg-max 151,9, loadavg-median vid slut 42,5
  arm B: ffmpeg i 0 % av samplingarna (0/327), CPU 0 %,
         loadavg-medel 23,6, loadavg-max 52,7, loadavg-median vid slut 22,1
  Kortets tal replikerat oberoende: ~3 kärnor av 16 (kortet) mot 4,2 som topp här.
  MÄTINSTRUMENTETS GRÄNS: macOS 'ps -o %cpu' är ett avklingande medelvärde över
  processens livstid, inte ett momentanvärde. Talet är jämförbart MELLAN armarna
  (samma instrument) men ska inte läsas som exakt momentan kärnbelastning.

AC 2 — REPRODUCERAR EN KLASS-B-FLAKE VID RETRY? MÄTT, TVÅ OBEROENDE KÄLLOR.
  (i) Framkallad mättnad: hela sviten med --workers=24 --retries=2, loadavg 99-175.
      13 tester föll i försök 0. 10 av 13 reproducerade INTE vid retry; 3 gjorde det.
      Reproduktionsandel 23 % (n=13).
  (ii) CI-historik, 90 senaste ci.yml-körningar → 32 acceptance-jobb med läsbar
      fullsvitsrapport: 31 helt gröna, 1 flaky (hem:1114 identitetsbeviset),
      0 RÖDA. Noll röda är det icke-cirkulära talet: hade en fällning överlevt
      sina två retries hade jobbet blivit rött.
  SVARET: fällningarna reproducerar övervägande INTE vid retry. Därmed är (a)
  ett BYTE, inte en ren vinst — precis den risk kortet pekade ut.

AC 3 — VALET: (c) BEHÅLL retain-on-failure, KOSTNADEN DOKUMENTERAD I CONFIGEN.
  (a) on-first-retry FÖRKASTAD. Två skäl, båda belagda:
      · Källan: shouldCaptureVideo spelar in enbart vid retry===1 och
        shouldPreserveVideo returnerar OVILLKORLIGT true för läget
        (playwright/lib/index.js:464 + 470-472). Playwrights egen lägestabell
        säger detsamma: vid 'fails, then passes on retry' behåller on-first-retry
        RETRYN, medan retain-on-failure behåller FIRST RUN.
      · Mätningen: 77 % av fällningarna passerar vid retry. Formen skulle alltså
        i tre fall av fyra spara en video av en GRÖN omkörning medan den fällda
        körningen är obevakad. Diagnostik bytt mot en artefakt som inte visar felet.
      · Dessutom: lokalt är retries=0, så on-first-retry är där ekvivalent med 'off'.
  (b) SÄNK WORKERS FÖRKASTAD. Kortet kallar den fel växel; mätningen tar bort
      även dess sakgrund — det finns ingen körtidsvinst att hämta (se AC 5), så
      den skulle offra genomströmning för en vinst som inte finns.
  (c) VALD. Enda formen som bevarar videon av den FAKTISKA fällningen för en
      flake-klass som inte reproducerar.
  OPTIONS-RYMDEN VAR STÖRRE ÄN KORTETS TRE. Playwright har sju video-lägen
  (types/test.d.ts:7025). retain-on-first-failure och retain-on-failure-and-retries
  spelar båda in vid retry 0, dvs. varje test i normalfallet → ingen lastvinst.
  Endast off / on-first-retry / on-all-retries eliminerar egenlasten, och alla tre
  offrar första fällningens video.

AC 4 — DIAGNOSTIK-FÖRLUSTEN. Valet innebär ingen förlust; redovisningen gäller
  vad (a) SKULLE ha kostat. Verifierat empiriskt på 16 fällningar: vid varje
  fällning skrivs test-failed-1.png OCH error-context.md (16 av 16), medan
  trace.zip fanns i 13 (den är redan on-first-retry). Med (a) hade video.webm
  vid en FÖRSTA fällning försvunnit och ersatts av en video av omkörningen.
  Att det ändå vore uthärdligt: error-context.md bär hela call-loggen — t.ex.
  'Expected: 2 / Received: 0 / 33 × locator resolved to 0 elements' — vilket för
  vår dominanta fällningsform ('element(s) not found') är MER informativt än en
  video av en tom lista. Videon är komplementet som visar förlopp, inte grundfallet.

AC 5 — FÄLLNINGSRATEN FÖRE OCH EFTER: INGEN EFFEKT KAN HÄVDAS. NOLL-RESULTAT.
  körtidsmedian: arm A 162 s, arm B 163 s → diff −1 s mot ett BRUSGOLV på ±72 s
    (största inom-arm-spann). Diffen ligger långt under bruset.
  fällningar: arm A 3 av 765 testresultat (0,39 %) i 3 av 5 körningar;
    arm B 1 av 765 (0,13 %) i 1 av 5.
  AVGÖRANDE: hem:437 'dagar-kvar-pillen' föll i BÅDA armarna (arm A vid loadavg
    42,5 och 18,5; arm B vid 21,3) — alltså oberoende av inspelningen. Samma
    facit-form som TASK-56 rapporterade.
  LASTKOPPLINGEN HÖLL INTE HELLER: arm A nådde loadavg 105,7 UTAN fällning,
    medan en fällning kom vid 18,5. Fällningarna fördelar sig utan mönster över
    lastspannet 18-58. Kortets premiss — att videoegenlasten driver B3 — är
    därmed INTE belagd av denna serie.

VAD MÄTNINGEN INTE KAN AVGÖRA (läs n innan resultatet tolkas):
  · KRAFTEN RÄCKER INTE FÖR EN LITEN EFFEKT. Vid en rat kring 0,4 % krävs
    storleksordningen tusentals testresultat per arm för att skilja en halvering
    från slumpen. 3 mot 1 på n=5 körningar är slumpterritorium; serien utesluter
    INTE en liten effekt, den ger bara inget stöd för någon.
  · CI ÄR OMÄTT. Allt ovan är darwin, 16 kärnor, 8 workers. CI kör ubuntu-latest
    (4 kärnor → 2 workers, default '50%', verifierat i common/index.js:595).
    Andelen kärnor ffmpeg tar är proportionellt lika, men absolut headroom är
    mindre — bilden kan skilja sig där och är inte mätt av mig.
  · ORDNINGSEFFEKT KVARSTÅR. Riggen kodar A,B,A,B och kan inte randomisera
    positionen inom varvet, så en systematisk position-inom-varv-effekt (t.ex.
    varmare OS-filcache för B) är inte utesluten. Att arm B ändå startade vid
    HÖGRE loadavg (5,57 vs 5,32) talar mot att B skulle vara gynnad.
  · EN NEGATIV KONTROLL (identiska armar, ingen patch) KÖRDES INTE. Den var
    planerad om skillnaden hållit i sig; när utfallet blev ett noll-resultat
    behövdes den inte för att bära slutsatsen.

REGISTRERAT VID SIDAN AV KORTET (ADR-053-triage, ej tyst förkastat):
  · hem:437 'dagar-kvar-pillen' är en dominant flake som föll 3 gånger i serien,
    i båda armarna, över lastspannet 18-42 — alltså varken video- eller
    tydligt lastdriven. Egen flake, värd eget kort.
  · MÄTT INDIKATION, EJ FYND: nedskalad video (640x360) gav CPU-medel 69,2 %
    mot 127,3 % och max 165,1 % mot 415,4 %. MEN n=1 och loadavg-medel 27,0 mot
    51,8 — confoundern är för stor för att tillskriva upplösningen skillnaden.
    Formen skulle behålla fällningsvideon till lägre pris och förtjänar en egen
    A/B-serie. Default är redan nedskalad (viewport → fit 800x800), så vinsten
    är mindre än generisk rådgivning antyder.
  · Kortet angav raderna 341 och 374; de var vid arbetets start 353 och 440.
<!-- SECTION:NOTES:END -->

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
