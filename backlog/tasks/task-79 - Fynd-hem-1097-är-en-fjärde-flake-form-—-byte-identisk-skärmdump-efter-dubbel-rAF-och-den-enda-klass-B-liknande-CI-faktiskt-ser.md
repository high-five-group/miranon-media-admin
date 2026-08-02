---
id: TASK-79
title: >-
  Fynd: hem:1097 är en fjärde flake-form — byte-identisk skärmdump efter
  dubbel-rAF, och den enda klass-B-liknande CI faktiskt ser
status: Done
assignee: []
created_date: '2026-07-29 00:56'
updated_date: '2026-08-02 07:52'
labels:
  - ready-for-agent
dependencies: []
ordinal: 159000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Funnen av TASK-74:s diagnos 2026-07-29. Efter att klass A stängdes är detta den ENDA klass-B-liknande flaken som CI faktiskt fäller på: 1 av 14 jobb efter, mot 6 av 14 före.

Formen är ny och matchar ingen av TASK-74:s tre mekanismer (B1 kall route-chunk, B2 vaktens två observatörer, B3 test-budget vid mättnad). Testet tar en skärmdump efter dubbel-rAF och får en BYTE-IDENTISK bild — alltså inte en timing-miss i vanlig mening, utan att den andra bilden är exakt densamma som den första.

### VARFÖR DEN ÄR VÄRD ETT EGET KORT

TASK-74:s agent föreslog egen tråd men tog inte scope-beslutet. Beslutet blev KORT, inte tråd: en tråd är för en öppen fråga utan form. Denna har form (byte-identisk bild), belägg (1/14 mot 6/14) och en avgränsad yta (ett test). Det är plockbart arbete, inte en fråga att fundera på.

Den är dessutom den enda kvarvarande klass-B-liknande signalen i CI. Så länge den lever kan ingen säga att acceptance-sviten är ren, vilket är hela steg 1:s mål ('signalen går att lita på').

### VAD SOM INTE FÅR ANTAS

Att dubbel-rAF är rätt väntemekanism. Byte-identiska bilder kan betyda att rAF-paret returnerar innan den avsedda målningen skett, ELLER att det som väntas på inte påverkar pixlarna alls. De två kräver olika fixar och skiljs bara av mätning.

Angränsar TASK-74:s B1 (kall route-chunk) — pröva om orsaken är gemensam innan formerna slås ihop, men slå INTE ihop dem utan det beviset.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Prövat mot TASK-74:s B1 om orsaken är gemensam — svaret redovisat oavsett riktning, formerna slås inte ihop utan belägg
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MÄTRIGGEN FINNS NU — och en baslinje är redan tagen. Uppdaterat 2026-07-29 (femtonde resumen) av orkestreraren; kortet är i övrigt orört.

VERKTYGET: `scripts/flake-matserie.mjs`, körs som `npm run metrics:flake`. Landad i `TASK-81` (PR `#420`, `cc953b1`). Bygg INTE en egen variant — hela riggens syfte är att fyra kort (`77` `78` `79` `80`) ska producera JÄMFÖRBARA tal.

BASLINJE REDAN TAGEN på detta korts scenario, av `TASK-81`:s agent:

  Serie: 3 varv, hela acceptance-sviten, --workers=8 --retries=0, armarna
         IDENTISKA (ren baslinje, ingen A/B-jämförelse)
  Utfall: 6 körningar, 918 testresultat, 0 fällda
  Detta test specifikt: 0 av 6, varaktighet 1520-2426 ms
  Körtid 130-167 s per körning, loadavg vid slut 26,06-54,54 (medel 34,9)

VAD BASLINJEN INTE SÄGER — agentens egen reservation, som ska bäras vidare:

n = 6 har LÅG UPPLÖSNING. `TASK-74` mätte 1 fällning av 14 CI-JOBB; noll fällningar på sex lokala körningar är fullt förenligt med den raten och är alltså INGET bevis för att flaken är borta. Att läsa 0/6 som "problemet är löst" vore precis den övertolkning riggen finns för att förhindra.

STARKARE ÄN SÅ: `TASK-74`:s AC 6 punkt 1 säger att klass B är övervägande LOKAL, medan detta test är den flake CI faktiskt ser. En lokal serie är därför sannolikt FEL INSTRUMENT för just detta kort. Agenten avstod uttryckligen från att avgöra vägvalet och lämnade det hit.

Konsekvens för den som tar kortet: väg en CI-buren mätning (upprepade dispatcher) mot den lokala serien INNAN mätformen väljs. Väljs den lokala, säg ut vad n behöver vara för att ett noll-resultat ska betyda något.

RADNUMMER-DRIFT: kortets titel säger `hem:1097`. Testet ligger 2026-07-29 på rad 1114 i `tests/acceptance/hem.acceptance.test.ts`. Titeln skrivs INTE om — den är kortets identitet. Den stabila identifieraren är testets TITEL: "AC 1 — identitetsbeviset: FÖRE == UNDER == EFTER byte-identiska under bevisat aktiv omhämtning". Använd den, inte radnumret.

DIREKTIV UNDER ARBETET (orkestreraren, 2026-08-02): "tyst maskin, ensam"-kravet
gäller för TASK-79 — en lokal flake-mätserie (`npm run metrics:flake`) får INTE
köras nu (5+ parallella agenter belastade maskinen). Ingen `metrics:flake`-serie
kördes. AC 2 kvarstår därför öppen med en färdig mätplan (nedan), schemalagd av
orkestreraren som eget moment på tyst maskin.

VAD SOM GJORDES I STÄLLET (allt antingen CI-artefakt-analys — opåverkad av
lokal last — eller korta, brus-okänsliga deterministiska mätningar med stor
marginal, inte tids-/frekvensserier):

1. CI-LOGGEN FÖR DEN FAKTISKA FÄLLNINGEN HÄMTAD (körning 30400586455, commit
   c832e60, PR #386, jobb 90414190222 "Test suite / Acceptance (hermetisk)",
   2026-07-28T21:29:05Z). Ordagrant:
     Error: EFTER == FÖRE (byte-identisk skärmdump)
     expect(received).toBe(expected) // Object.is equality
     Expected: true
     Received: false
     > 1179 | expect(efter.equals(fore), '...').toBe(true);
   "1 flaky" + "152 passed" — retry (CI retries:2) räddade körningen. INGA
   artefakter kvar (`gh api .../artifacts` → `{"total_count":0}`), så
   diff-bilden går inte att inspektera i efterhand.

2. AC 1 — HYPOTES 1 ("rAF-paret returnerar innan målningen skett") PRÖVAD MED
   MÄTNING, FALSIFIERAD. Testet installerar en fejkad klocka
   (`page.clock.install()`), som per Playwrights EGEN dokumentation (context7,
   /microsoft/playwright v1.61.0, class-clock.md) fejkar ÄVEN
   `requestAnimationFrame`. Byggde en isolerad mätning (fristående
   `chromium.launch()`, ingen app/dev-server) som mäter NODE-sidans (opåverkad
   av page.clock) väggklocka-tid för en dubbel-rAF-Promise att lösa ut, i fyra
   armar × 2 oberoende körningar (n=15/arm/körning):
     A  real rAF, idle sida                     median 31ms / 23ms
     B  real rAF, DYR målning + CPU 20x throttle median 1760ms / 1729ms
     C  fake rAF (install()), idle               median 32ms / 32ms
     D  fake rAF (install()), DYR + throttle     median 1573ms / 1613ms
  Om fake-rAF vore frikopplad från verklig paint (hypotesen) hade D legat kvar
  nära C (~32ms) oavsett målningskostnad. I stället skalar D upp ~50x, i
  samma härad som B (real rAF). MÄTT SLUTSATS: fake rAF under
  `page.clock.install()` väntar likväl in verklig paint/kompositor i detta
  test — hypotes 1 håller INTE som generell mekanism.

3. KLOCK-ORDNINGEN ÄR EN DOKUMENTERAD KONTRAKTSBRYTNING, MEN INTE BEVISAD
  ORSAK. Playwrights docs (samma källa): "If the install method is called in
  a test, it must occur before any other clock-related calls to prevent
  undefined behavior." Den delade `page`-fixturen (`hermetic.ts:428`) kör
  `page.clock.setFixedTime(FROZEN_NOW)` för VARJE test FÖRE testkroppen —
  AC1 (rad 1119) och AC2 (rad 1203) i SAMMA fil kör sedan `page.clock.install()`
  UTAN tidsargument mitt i testet, dvs precis i den ordning docs varnar för.
  Repeterade rAF-mätningen (punkt 2) med EXAKT samma ordning (setFixedTime →
  install → dyr målning + throttle): median 1584ms — statistiskt oskiljbart
  från D (1613ms). SLUTSATS: ordningsbrottet är verkligt och värt att städa
  som egen hygienfråga (påverkar tre ställen i denna fil + ett i
  `persist-cache.staging.test.ts`), men det bevisligen INTE bryter
  rAF-mot-paint-kopplingen på det sätt hypotes 1 föreslog. INGEN FIX
  applicerad här — att ändra ordningen utan bevisad effekt hade varit en
  ogrundad "kanske hjälper det"-ändring, exakt det kortet varnar mot.

4. KLOCKAN ÄR INTE PAUSAD EFTER install()/fastForward() (mätt, binär
  brus-okänslig kontroll, marginal 2000ms mot 0ms): `Date.now()` i sidan
  avancerade 2004ms under en verklig 2000ms-väntan, både direkt efter
  `install()` och efter `fastForward(61000)`. Klockan följer alltså REAL tid
  ovanpå det virtuella hoppet — vilket öppnade en ANNAN hypotes (nedan).

5. NY HYPOTES PRÖVAD OCH FALSIFIERAD: `NyaAnmalningarCard.tsx:103` läser
  `Date.now()` FÄRSKT PER RENDER (odokumenterat i kortet, men medvetet
  designat — se filens egen kommentar rad 83-84: "nuMs läses per render").
  Given punkt 4 (klockan glider med real tid) fanns en teoretisk risk att
  UNDER/EFTER-renderingen beräknar `nuMs` mot ett SENARE ögonblick än FÖRE,
  vilket i sin tur kunde flippa `relativTid()`s dagsgräns (Europe/Stockholm-
  midnatt). MÄTT (render-räknare instrumenterade temporärt i alla tre korten,
  [DEBUG-task79]-taggat, körning via riktig `--project=acceptance -g
  identitetsbeviset`, städat efteråt — `git status`/`git diff` verifierat
  rent): render-antal VID FÖRE / VID UNDER / VID EFTER var IDENTISKA
  (NastaEventCard: 4/4/4, ObetaldaCard: 4/4/4, NyaAnmalningarCard: 4/4/4).
  SLUTSATS: i en LYCKAD körning re-renderar INGET av de tre korten under
  poll-cykeln alls — React Querys structural sharing (byte-identiskt JSON →
  samma referens) + v5:s tracked-properties (inget kort läser `isFetching`)
  hoppar över notifieringen helt. `nuMs`-hypotesen kräver alltså ETT extra,
  ännu opåvisat steg (ett scenario där en re-render FAKTISKT triggas) för att
  ens vara i spel — den är inte utesluten i alla lägen, men den ÄR utesluten
  som förklaring till den normala (icke-flakiga) körvägen.

  TIDSFÖNSTER-KONTROLL mot den EN bekräftade CI-fällningen: körningen
  30400586455 startade 21:26:03Z och skrev sin slutrapport 21:29:05Z
  (2026-07-28) = 23:26–23:29 CEST (Europe/Stockholm, playwright.config.ts
  `timezoneId`) — 31+ minuter före midnatt i BÅDA ändar av fönstret. En
  dagsgräns-korsning inom detta enskilda tests egna (sekund-skala) körfönster
  är därför osannolik för just DEN observerade fällningen, även om
  mekanismen i sig är verklig och odokumenterad kod-fragilitet.

6. AC 3 — JÄMFÖRT MOT B1, SVARET ÄR NEJ, MED BELÄGG. B1 (kall route-chunk mot
  5000ms expect-budgeten) manifesterar ALLTID som
  `Timeout: 5000ms/15000ms · Error: element(s) not found` på en
  web-first-assertion direkt efter `page.goto()`. Den bekräftade fällningen
  här är en HELT ANNAN felklass: `Buffer.equals()` → `false` på en
  screenshot-jämförelse, INGEN timeout inblandad, och den inträffar vid EFTER
  (efter en redan lyckad `goto` + flera lyckade assertions, inte direkt efter
  goto). Felsignaturerna delar ingenting. Orsakerna är INTE gemensamma.

7. CI-ARTEFAKT-SVEP: 145 senaste `ci.yml`-körningar listade (2026-07-31T10:41
  till 2026-08-01T22:08Z, `gh run list --workflow=ci.yml --limit 150`). 111
  av 145 hade "Test suite"-jobbet SKIPPAT (bekräftat via
  `gh api .../jobs/<id>` → `{"conclusion":"skipped"}` — path-filtrerad
  Detect-changed-files-gate, väntat för dok-/backlog-tunga commits). 34
  körningar EXEKVERADE faktiskt Acceptance-jobbet. Alla 34 loggar genomsökta
  för "identitetsbeviset" och för " flaky$"-rader: NOLL ytterligare
  förekomster av DENNA flake, och NOLL flaky av NÅGOT slag i den perioden.
  Sammantaget känt facit: 1 fällning på (14 TASK-74-jobb + 34 nya jobb) = 48
  observerade Acceptance-CI-jobb sedan klass A:s fix, ingen ytterligare
  observation på över tre dygns fortsatt CI-aktivitet.

ÄRLIG STATUS: rotorsaken är INTE nådd. Två namngivna hypoteser (rAF-paret för
tidigt; klockordningen som mekanism) är PRÖVADE MED MÄTNING och FALSIFIERADE
för det generella fallet. En tredje, kod-läsningsledd hypotes (nuMs-drift på
dagsgräns) är falsifierad för DEN NORMALA körvägen (inga re-renders sker) och
dessutom tidsmässigt osannolik för den enda bekräftade fällningen. Det som
återstår, i avsaknad av en bättre förklaring och i linje med SAMMA fils egen
redan dokumenterade precedent (uppvärmningsskottets ±1-kanals
antialiasing-avvikelse på en rundad kant, se kommentaren ovanför FÖRE-skottet):
skärmdumps-/kompositor-nivå-nondeterminism i Chromium under CI:s specifika
last-/renderingsförhållanden — INTE app-, klock- eller väntemekanism-fel. Detta
är INTE bevisat (ingen diff-bild finns kvar att inspektera), bara det mest
sannolika kvarstående alternativet efter elimination.

MÄTPLAN FÖR AC 2 (körs av orkestreraren som eget moment på tyst maskin):
  npm run metrics:flake  (scripts/flake-matserie.mjs)
  Scenario: hela acceptance-sviten, --workers=8 --retries=0, interfolierad
  serie enligt riggens standardform (ingen egen variant).
  Antal körningar: MINST 10 per arm (TASK-74:s egen lärdom: n=6 lokalt har
  låg upplösning mot en rat CI mätte till 1/14 jobb ≈ enstaka promille per
  testresultat — se AC 6 punkt 1 nedan för räkningen). Eftersom INGEN fix
  finns att jämföra mot (se ovan): kör en REN baslinjeserie (identiska armar,
  ingen A/B) för att etablera en FÄRSK lokal nollmätning, och komplettera med
  ANNAN AC 2-form: fortsatt CI-artefakt-räkning (steg 7 ovan, upprepningsbar
  utan lokal last) som den huvudsakliga rat-källan för DENNA specifika flake,
  eftersom TASK-74 redan visade att klass B till övervägande del är
  lokal-osynlig och att detta test är undantaget CI FAKTISKT ser.
  Loadavg-krav: `uptime` under 2 (ensam maskin) före FÖRSTA körningen i
  serien, precis som direktivet.

NÄSTA STEG, ORKESTRERAREN VÄLJER:
  (a) Kör mätplanen ovan på tyst maskin → om fortsatt 0/n lokalt: bekräftar
      "CI-only"-karaktären ytterligare, ingen ny lokal signal att agera på.
  (b) Städa klock-ordningen (setFixedTime→install) som EGEN, oberoende
      hygien-fix (dokumentationskonform, riskfri, men INTE bevisad lösa
      flaken) — separat litet kort om det prioriteras.
  (c) Acceptera residualrisken som en känd, extremt sällsynt (≤1/48
      CI-jobb, ingen ytterligare observation på 3+ dygn) kostnad av
      byte-identitets-formen, och stäng TASK-79 med denna karaktärisering
      som facit — konsekvent med att testets EGEN header redan medvetet
      avvisar pixel-tolerans som lösning (se kommentaren om
      uppvärmningsskottet: "att i stället tillåta N avvikande pixlar hade
      gjort provet trubbigt för äkta regressioner").

KÄLLOR: context7 /microsoft/playwright v1.61.0 (class-clock.md, clock.md) för
Clock-semantiken; `gh run view --job=90414190222 --log` för den bekräftade
fällningen; `gh api repos/.../actions/runs/<id>/artifacts` för
artefakt-status; `gh run list --workflow=ci.yml --limit 150` +
`gh api .../jobs/<id>` för CI-svepet (145 körningar, 34 exekverade). Alla
lokala mätningar ovan är ISOLERADE, deterministiska engångskontroller med
stor marginal (>1000ms-effekter, eller binära 0-vs-2000ms-utfall) — INGEN av
dem är en flake-rate-/tidsserie av den typ direktivet förbjöd, och samtliga
körningar skedde 2026-08-02 med loadavg 6-8 (måttlig, ej "tyst maskin", noterat
som brus-marginal — effektstorlekarna (40-60x, respektive 0ms mot 2000ms) är
för stora för att rimligen vara en artefakt av den lasten, men absoluta
millisekundtal ovan ska INTE tolkas som CI-representativa).

---
NATTKÖRNING 2026-08-02 (T112-läge, orkestrerar-svep) — AC 2-mätplanen exekverad, VÄGVAL EJ TAGET.

Rigg: npm run metrics:flake (scripts/flake-matserie.mjs), hela acceptance-sviten, --workers=8 --retries=0, ren baslinjeserie (armarna identiska, ingen fix att jämföra mot). 10 varv/20 körningar planerade i EN invokering; harnesset avslutade processen efter 16/20 (körning 1-16, 01:37-02:35, ingen synlig systemorsak — caffeinate aktiv, inga sleep/wake-händelser) utan slutsummering. Toppades upp med en andra invokering (--varv 2, 4 körningar, EXIT=0) för att nå mätplanens "minst 10 per arm". Kombinerat: 20 körningar, 10 A + 10 B.

RESULTAT — "identitetsbeviset"-testet (hem.acceptance.test.ts:1114, TASK-79:s mål): 20/20 PASSED, 0 fällningar. Varaktighet 1379-1592ms (del 1) / 1400-1471ms (del 2), stabilt.

n-läsning INNAN noll-resultat tolkas: n=20 lokalt (upp från n=6 i TASK-81:s baslinje) + n=65 CI-jobb sedan klass A:s fix (48 tidigare + 17 nya, kompletterande CI-artefakt-svep 2026-08-01T22:08-23:32Z, samma steg-7-metod som tidigare) — fortsatt EXAKT 1 fällning totalt (2026-07-28), nu 4+ dygn utan ny observation. Ingendera nämnare räcker för att skilja "borta" från "kvar på ursprunglig, mycket låg rat" — kortets Chromium-kompositor-hypotes varken falsifieras eller bekräftas av detta.

LOADAVG-DIVERGENS: mätplanens "uptime under 2 före första körningen" uppfylldes INTE (uppmätt 7,11 fallande till ~4,0 vid start, pga Backblaze completesync + normal skrivbordslast — INGA konkurrerande agent/testprocesser verifierade). Dokumenterad öppet, inte tyst ignorerad — se analysfilen.

OVÄNTAT FYND (registrerat, EJ diagnostiserat — utanför denna mätplans scope): 2 fällningar i del 1 (av 3060 testresultat totalt), BÅDA arm B, BÅDA i hem.acceptance.test.ts men på ANDRA rader än 1114 — hem:437 ("dagar-kvar-pillen", toBeVisible-timeout) och hem:398 ("refetchInterval falsk klocka", polling-assertion). Delar INTE identitetsbeviset-testets felsignatur och är inte TASK-74:s B1/B2/B3. Vidrör möjligen samma dagsgräns/nuMs-mekanismer TASK-79:s eget karaktäriserings-avsnitt (punkt 5) redan diskuterade för ANDRA tester i samma fil — sammanslagning ej bevisad, ej gjord här.

Full analys, premiss-pass och rådata: docs/research/task-79-flake-baslinje-2026-08-02.md + docs/research/task-79-flake-baslinje-2026-08-02-data(-del2)/ (serie.jsonl + resultat.jsonl; riggens råa run-NN-X.json uteslöts — bröt biome check, se analysfilens § Källor).

VÄGVAL (a)/(b)/(c) ur "NÄSTA STEG" INTE TAGET HÄR — beslutsbordets punkt 2, Marcus.

VÄGVAL TAGET 2026-08-02 (beslutsbordet S91 punkt 2 — Marcus GO på Codes rekommendation): (c) residualrisken accepteras och kortet stängs med karaktäriseringen som facit. Läget per vägval: (a) exekverades som natt-serien 2026-08-02 — 20/20 PASSED lokalt (n=20, upp från n=6), CI-basen n=65 med fortsatt exakt 1 fällning (ca 1,5 procent), 4+ dygn utan ny observation; förenligt med kompositor-karaktäriseringen, ingen ny lokal signal att agera på. (b) klock-ordningsstädningen FÖRKASTAD öppet: dokumentationskonform men bevisat INTE flakens mekanism (kortets egen falsifiering av klockordnings-hypotesen); utan ny signal är den bygga-ifall och över-engineering-vakten skär den — återuppstår flaken finns mätplanen + karaktäriseringen kvar i detta kort. AC 1/2/4 (fix-vägens kontrakt: lokalisera orsak, mät före/efter fix, negativt self-test) BORTTAGNA med denna öppna bokföring — vägval (c) är beslutet att INTE gå fix-vägen; S81-precedentens form, Done med öppen bokföring. Nattens två NYA fällningar (hem:437/hem:398) är INTE detta korts form → task-121.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängd mot karaktäriseringen (vägval c, Marcus 2026-08-02): byte-identisk-skärmdumps-flaken är efter eliminering mest sannolikt Chromium-kompositor-nivå-nondeterminism under CI:s last-/renderingsförhållanden — rotorsaken ej nådd, tre namngivna hypoteser prövade med mätning och falsifierade. Bevisläge vid stängning: 1 fällning på 65 observerade Acceptance-CI-jobb sedan klass A:s fix (2026-07-28, ingen ny på 4+ dygn) + färsk lokal nollmätning 20/20 (natt-serien 2026-08-02, docs/research/task-79-flake-baslinje-2026-08-02.md). Residualrisken accepterad som känd, extremt sällsynt kostnad av byte-identitets-formen — konsekvent med testets egen avvisning av pixel-tolerans. Nya observationer i samma fil → task-121.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
