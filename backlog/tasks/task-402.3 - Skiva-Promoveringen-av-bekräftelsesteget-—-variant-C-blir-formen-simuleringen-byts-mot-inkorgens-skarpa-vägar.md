---
id: TASK-402.3
title: >-
  Skiva: Promoveringen av bekräftelsesteget — variant C blir formen,
  simuleringen byts mot inkorgens skarpa vägar
status: Done
assignee: []
created_date: '2026-09-05 19:02'
updated_date: '2026-09-07 15:52'
labels:
  - ready-for-agent
  - intentionally-unchecked
dependencies:
  - TASK-402.2
parent_task_id: TASK-402
ordinal: 699000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bekräftelsesteget på /mer/betalningar/registrera renderar variant C:s form ovillkorligt (ADR-103 B2 steg 1) och registrerar på riktigt: steget tar anmälnings-ID:n ur sök-parametern ids, hämtar de öppna betalningarna via inkorgens läsväg och bygger raderna; 'Registrera N inbetalningar' registrerar raderna en i taget via inkorgens registreringsväg (en post per rad, samma kontrakt och idempotensregler som enradsregistreringen, inget batch-kontrakt), med sidan stilla under körningen (ögonblicksbild bär listan, dimmad och upptagen, knappen bär spinnern med skärmläsarbesked, tipsraden bär räkningen 'k av N registrerade …' som förloppsindikator som kan frågas men inte annonseras per steg, summan ur ögonblicksbilden) och resultatet ritat en gång när alla svarat: det delade 'Registrerat nu'-blocket på listans plats, statusraden 'N inbetalningar registrerade, M kunde inte registreras', fallerade rader kvar i listan med felet och knappen 'Försök igen' som kör bara dem. 'Registrera och skicka N kvitton' (även Ctrl/⌘+Enter) köar kvittona direkt via inkorgens köväg; 'Skicka N kvitton' och 'Förhandsgranska' under blocket och Ångra-dialogen använder inkorgens befintliga vägar. Statusraden annonserar start och slut. Varianterna A och B, växlaren och simuleringslagret finns kvar bakom DEV tills Marcus stämpel (rivs i egen skiva). Skivan avslutas med ariaSnapshot-paret (variant-läget före flippen mot den promoverade ytan efter), iPad 820-granskning av Marcus, och ett staging-skarpbevis med tio rader. Täcker användarberättelser: 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 24, 25, 26, 28, 29, 30, 33.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Bekräftelsesteget är identiskt med facit tasks/sessions/bilagor/s121-bekraftelsesteget-konvergens/facit.json ytan bekraftelsesteget i läge 'utgångsläget' (rubrik, statusrad, listan grupperad per event med kortet som kryssruta, beloppet platt med chevron, 'Behöver din hand', avstämning, summaraden 'N inbetalningar', tipsraden, de två knapparna)
- [x] #2 Under körningen är sidan identisk med facit tasks/sessions/bilagor/s121-bekraftelsesteget-konvergens/facit.json ytan bekraftelsesteget i läge 'körningen pågår': sidhöjden är konstant från knapptryck till resultat (mätt), listan dimmad och aria-busy, korten tar inga tryck, spinnern i den tryckta knappen, räkningen 'k av N registrerade …' som role=progressbar, statusraden 'Registrerar N inbetalningar …'
- [x] #3 Efter registreringen är sidan identisk med facit tasks/sessions/bilagor/s121-bekraftelsesteget-konvergens/facit.json ytan bekraftelsesteget i läge 'efter Registrera' respektive 'efter Registrera och skicka', inklusive statusradens utfallstext, fallerad rad kvar i listan med felet och knappen 'Försök igen'
- [x] #4 Ångra öppnar dialogen identisk med facit tasks/sessions/bilagor/s121-bekraftelsesteget-konvergens/facit.json ytan bekraftelsesteget i läge 'Ångra-dialogen'; raden går tillbaka till listan efter 'Ångra registreringen'
- [x] #5 Varje rad registreras via inkorgens befintliga registreringsväg med samma kontrakt som enradsregistreringen; kvittona köas via inkorgens befintliga köväg; ingen ny Edge Function och inget batch-kontrakt
- [x] #6 En rad vars anrop fallerar stannar i listan med felet, de övriga registreras ändå, och 'Försök igen' kör enbart de fallerade raderna
- [x] #7 Kortets formulär är det delade registreringsformuläret i Klar/Avbryt-läge; Avbryt återställer radens värden
- [x] #8 Tillgänglighet: statusraden är polite och annonserar start och slut (aldrig per rad); räkningen är role=progressbar med aria-valuenow/-valuemax/-valuetext; kortet bär 'Markerad'/'Inte markerad' för skärmläsare; Ångra-knapparna bär personens namn; axe-svep utan fel
- [x] #9 ariaSnapshot-paret per yta (variant-läget FÖRE flippen mot den promoverade ytan EFTER) är taget och identiskt; paret deklareras som 'referenser' i facit.json via en AMENDERING-fil (manifestet är agent-fruset)
- [x] #10 Marcus har granskat den promoverade ytan mot facit-bilderna på desktop 1440 och iPad 820 (iPad-formen bokförs som amendering-bilder i facit-katalogen)
- [x] #11 Staging-skarpbevis: tio rader registrerade via steget, kvitton köade, inbetalningarna verifierade i Postgres och basens spegel; staging-e2e (samma skarv som inkorgens utskicksflödes-test) täcker körningen, resultatet, fallerad rad, omkörning, Ångra-dialogen och kvittokön; api-pure täcker avstämning, summering, gruppering, 'vad kan registreras nu' och omkörnings-urvalet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
- [x] #4 Facit-granskning: ytan bekraftelsesteget jämförd mot facit tasks/sessions/bilagor/s121-bekraftelsesteget-konvergens/facit.json (bilderna i samma katalog) i varje läge skivan rör — avvikelse bokförs som AMENDERING-fil i facit-katalogen, aldrig som tyst ändring (ADR-102 B5/R3)
- [ ] #5 Promoveringsgrinden grön: ariaSnapshot-par (variant-läget FÖRE flippen mot den promoverade ytan EFTER) utan skillnad, och visual-baslinjen omtagen på den godkända ytan efter Marcus stämpel (ADR-103 B4)
- [x] #6 Staging-skarpbevis: tio rader registrerade via steget mot staging med kvitton köade, inbetalningarna verifierade i Postgres och basens spegel
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FÖRKRAV (S121 paus 3, 2026-09-05): samma som 402.2 — prototypgrenen proto/s121-bekraftelsesteget (draft-PR #2325) måste vara landad på main (eller vara skivans bas). AC #10 (Marcus granskning desktop + iPad) är ett Marcus-moment: i AFK byggs allt annat och skivan lämnas med AC #10 öppet och en granskningsvy (dev-server-adress + facit-bilder) i kortets notes.

GRANSKNINGSVY FÖR MARCUS (AC #10 — det enda som är öppet i skivan)

Starta dev-servern i denna gren:

    npm run dev

TVÅ YTOR ATT JÄMFÖRA, i den ordningen:

1. FACIT-DATAN, bakom DEV — samma tio rader som facit-bilderna togs ur
   ("Lottas morgon": Anna/Björn/Cecilia/David 1 500 kr, Erik/Fatima/Gunnar/
   Hanna/Ida/Johan 1 000 kr, Gunnar fallerar första gången):

       http://localhost:5173/mer/betalningar/registrera?data=fixtur

   Detta är prototypens simuleringslager, kvar bakom import.meta.env.DEV tills
   stämpeln (ADR-102 B3). Ingen staging-skrivning sker — tryck på knapparna
   fritt. Ladda om sidan för att börja om.

2. DEN SKARPA YTAN, mot staging — en ORÖRD granskningsfixtur ligger klar
   (event recRuwcAh9YC6NUG1, ort ZZ-GRANSKNING-S121-MARCUS, tio öppna
   betalningar à 2 500 kr med 1 000 kr i anmälningsavgift, utgår 2026-09-20):

       http://localhost:5173/mer/betalningar/registrera?ids=rec747Ae6teafKRCh,recIpm8NrHPRK8YHn,recJ0hxMLcWYocAma,recLf8qE80gx758U8,recSfWRwKAE7P1tQN,recYWOoKGI6r648zC,recckd7kPLMuInJBN,recgyPBWPBWxH6vFA,reclovxoZyC1aBzLA,rectHOCLgcI85Q8Mv

   HÄR SKRIVS DET PÅ RIKTIGT (staging). Ett tryck på "Registrera 10
   inbetalningar" bokför tio inbetalningar i Postgres och spegeln.

VAD SOM SKA JÄMFÖRAS — de fem låsta bilderna i
tasks/sessions/bilagor/s121-bekraftelsesteget-konvergens/:

  facit-bekraftelsesteget.png              utgångsläget, 10 av 10 markerade
  facit-bekraftelsesteget-pagar.png        körningen pågår, räkningen på tipsradens plats
  facit-bekraftelsesteget-efter.png        efter Registrera, guldtonat block + Gunnar kvar
  facit-bekraftelsesteget-angra.png        Ångra-dialogen
  facit-bekraftelsesteget-efter-skicka.png efter Registrera och skicka, kvittonumren

KÄND BILDARTEFAKT i facit-bilderna: PrototypeSwitcher-railen (a/b/c) och
TanStack Router-devtools syns i dem. De hör inte till formen och finns inte i
den promoverade ytan.

TRE AVVIKELSER ÄR REDAN BOKFÖRDA (AMENDERING-2026-09-06-ariasnapshot-paret.md,
samma katalog) — de är väntade, inte fynd:
  A. "Förhandsgranska" är inte längre inert (ingen [disabled], ingen tooltip)
  B. prototypens sr-only-hjälpvärde "N kvitton hör till registreringen" är borta
  C. den fallerade radens feltext är SERVERNS, inte prototypens påhitt

IPAD 820 — det steg facit medvetet saknar bild för. I webbläsarens
enhetsverktyg: 820 × 1180. ariaSnapshot-referenser är tagna vid den bredden
och står IDENTISKA med desktop i tre av fem lägen.

═══════════════════════════════════════════════════════════════════════════
FACIT-GRANSKNINGEN SOM ÄR GJORD (DoD #4) — RGB-MÄTT, INTE ÖGONMÄTT
═══════════════════════════════════════════════════════════════════════════
Egna skärmdumpar av den promoverade ytan (desktop 1440×900 @2x,
produktionsbygge på preview 4173, mockade EF-svar med facit-fixturens tio
rader) jämförda mot de fem låsta bilderna. Dominant färg i samma utsnitt:

  utgångsläget, markerat kort      rgb(240,253,244)  IDENTISK — och
                                   pixelräkningen med (98458/19856/9479)
  efter Registrera, blockets fond  rgb(251,243,224) = --p-gold-100  IDENTISK
  efter Registrera, konturen       rgb(196,168,64)  = --p-gold-400  IDENTISK
  efter skicka, blockets fond      rgb(245,245,243) = --p-neutral-50 IDENTISK

Blockets ton växlar alltså guld → vila precis som TASK-362 kräver.

═══════════════════════════════════════════════════════════════════════════
STAGING-SKARPBEVIS (AC #11, DoD #6) — KÖRT 2026-09-06 kl 00:14 UTC
═══════════════════════════════════════════════════════════════════════════
Fixtur: event recHAbtzS7JdoPsfH (ZZ-GRANSKNING-S121-4023B), tio öppna
betalningar. Kört mot preview-bundeln på 4173 (den enda CORS-allowlistade
porten som var ledig — 5173 hölls av huvudkatalogens dev-server, och en
deriverad port som 5273 får inget access-control-allow-origin alls, mätt).

  Tryckte "Registrera och skicka 10 kvitton"  00:14:26 UTC
  "Alla inbetalningar registrerade"           00:14:42 UTC  (16,0 s för tio rader)

EF-anrop under körningen (räknade i browsern):
  registrera-inbetalning  10   EN per rad — inget batch-kontrakt
  koa-kvitton              1   ETT jobb för alla tio
  hamta-oppna-betalningar 11   1 initial + 10 invalideringar (samma kontrakt
                               som enradsregistreringen; bokfört i hookens
                               docblock)

POSTGRES (hamta-inbetalningar per anmälan):
  10 inbetalningar à 1 000 kr = 10 000 kr, betalsätt Swish, datum 2026-09-06,
  status aktiv. Kvitton utfärdade: MM-2026-1028 … MM-2026-1037, alla
  status "utfardat".

BASENS SPEGEL (Airtable Anmälningar):
  Summa inbetalt (kr) = 1 000 på varje rad, Saknas (kr) = 1 500.
  Spegelsumma 10 000 kr = Postgres 10 000 kr — I FAS.

KVITTOKÖN (jobb 730d04d4-d2d5-4320-adb5-53afce52296f, skapat 00:14:42,
avslutat 00:15:05): totalt 10, kvar 0, fel 10 — samtliga med skälet
"Adressen <adress> är inte en Resend-testadress — inget mail skickas i denna
miljö." Det är en STAGING-MILJÖEGENSKAP, inte ett fel i steget:
seed-fixturens adresser är RFC 2606-reserverade (example.com/.org/.net).
Kvittona ÄR utfärdade och ledgern bär numren; det som uteblir är
mailleveransen.

En första körning gjordes mot ZZ-GRANSKNING-S121-4023 (event
rec62qCKvBFihIvl4) kl 00:10 med samma utfall i Postgres och spegel; dess
kvittokö mättes för tidigt och verifierades i efterhand via ett direkt
koa-kvitton-anrop (MM-2026-1018 … 1027). Båda fixturerna har livstid 3 dagar
(utgår 2026-09-09) och städas av förfallo-svepet.

═══════════════════════════════════════════════════════════════════════════
FYND ATT BÄRA VIDARE (inte fixade i denna skiva)
═══════════════════════════════════════════════════════════════════════════
1. AVBRYT MISSAR EFTER EN BELOPPSINMATNING. Ett klick på "Avbryt" direkt
   efter att ett belopp skrivits fyrar inte: klicket utlöser blurren självt,
   utfallsrutan byter till en högre text och knappen glider undan pekaren
   mellan mousedown och mouseup. MÄTT: Avbryt-knappens y-position 612,75 px
   före inmatningen, 612,75 px efter fill (rutan är fördröjd) och 641,75 px
   efter blur — 29 px. react-arias usePress avfyrar då aldrig onPress.
   Beteendet ligger i den DELADE RegistreraForm och gäller INKORGEN lika
   mycket som steget; det är inte infört av denna skiva. Kandidat: reserverad
   höjd på utfallsrutan (en formändring som behöver facit-prövning).

2. RETRY-LAGRET DÖLJER ETT ÖVERGÅENDE 5xx. fetchWithRetry retryar 5xx tre
   gånger, så facit-bildens "en rad fallerade" kräver i verkligheten ett
   ihållande fel. Korrekt beteende — men värt att veta när fel-radens form
   ska provas.

3. hamta-jobbstatus UTAN jobbId returnerar det SENASTE jobbet i basen, inte
   sessionens eget. JobbLyssnare i skalet anropar den så; en verifiering som
   läser den frågan mäter fel jobb. Använd alltid ?jobbId=.

RUNDA 2 2026-09-06 01:06 UTC (SHA efter denna commit: se PR #2362s senaste push) — review-agentens fem fynd (granskad SHA 081a2e95) rättade/utredda:

1. [warning/ask-user] Grindens hemvist (staging-e2e, inte tests/visual/) — Marcus vägval, INGEN kod ändrad. Skälet bokfört i PR-kroppen under "Öppet för Marcus: grindens hemvist" med exakt konfigrad (playwright.config.ts:384) och en kostnadsbedömd hermetisk väg (ny egen webServer-gren + MSW-handlers + ett nytt WebSocket-mock för JobbLyssnare — den sistnämnda delen redan tilldelad TASK-346.6/346.7 i configens egen kommentar; TASK-346.7 är Done men rörde andra ytor och flippade aldrig raden). Ingen egen bedömning fattad — Marcus väljer.

2. [warning/ask-user] AC #9 felställd premiss — RÄTTAT. facit.json:s "referenser" var tomt trots att AC #9 var bockad. Verifierat mot scripts/lib/facit-godkand-skrivning.mjs: hooken fryser bara ett manifest med satt (icke-null) "godkand" — vårt är null, skrivning tillåten. Per ADR-102 § Updates A5 (enda tidpunkten hash-låset kan sättas) skrev jag "referenser": [{fil, sha256}] för alla tio ariaSnapshot-filer direkt i facit.json. "godkand" orört (null). bash scripts/check-facit.sh exit 0. Promoverings-grinden omkörd lokalt mot samma HEAD: 10/10 gröna, git status på tests/e2e/__aria__/ helt ren (bevisar hasharna matchar). AMENDERING-filens felaktiga "manifestet är agent-fruset"-premiss rättad med källa. AC #9 förblir bockad (ingen ombockning behövdes, bara premissen).

3. [warning/ask-user] DoD #4 saknade bilder — RÄTTAT. Fem skärmdumpar av den promoverade ytan (mockade EF-svar, samma fixtur som facit, egen lokal dev-server port 5180 under staging-semaforen, samma metod som PR #2360) committade i tasks/sessions/bilagor/task-402.3-facit-jamforelse/skarp-{utgangslage,pagar,efter,angra,efter-skicka}.png. Jämförelsetabell (dimensioner, RGB vid samma token-punkter, pixelräkning) i PR-kroppen. Tre av fem bilder byte-lika dimension med facit; två ("efter"/"efter-skicka") 42 px högre — sannolikt Avvikelse C:s längre serverfeltext, bokfört öppet, inte som säker slutsats.

4. [info/auto-fix] "11/11" → 10 (5 lägen × 2 bredder). Rättat i PR-kroppen och denna not. Commit-meddelandena (d95b8e1a, f4ab8cec) skrivs INTE om (historik).

5. [info/auto-fix] "7 fall" → 6 för tests/e2e/bekraftelsesteget.staging.test.ts. Rättat i PR-kroppen och denna not. Commit-meddelande (f4ab8cec) skrivs INTE om.

Grindar (förgrund, exitkod separat): check-facit.sh 0, check:docs 0 (14 gröna), typecheck 0, biome 0 (18 varn/83 info, oförändrat), check-langa-streck.mjs 0 (321 filer). Promoverings-grinden omkörd: 11/11 (10 + setup) gröna.

Modell: Sonnet 5 (claude-sonnet-5).

RESUME 4 (2026-09-06): Marcus granskar i PROD (flaggan är på via Vercel sedan S113 steg 14 — bundeln på admin.miranon.dev bär VITE_FEATURE_BETALNINGAR=pa och registrera-chunken; granskningsvyn ovan gäller lika i prod, men Registrera-trycket bokför på riktigt där). Hans fynd gav TASK-402.8 (pillsen bort, namnet klipps, beloppsknapparna under listan) som ändrar formen FÖRE stämpeln — AC #10 görs om på 402.8:s form (402.8 AC #6). 402.6 beror nu på 402.8.

AC #10 BOCKAD (S121 resume 4, 2026-09-06): Marcus granskade den promoverade ytan på granskningsservern 4173 (desktop 1440 + iPad 820) genom TASK-402.8:s tio formvarv — den formen ersätter 402.3:s ursprungliga (402.8 AC #6, Marcus kvittens 'Nu är vi klara med bulkregistrerings-sidan också, vi kör på detta.'). Kortet sätts Done; DoD #5:s visual-baslinje efter stämpel bärs av TASK-402.6 (stämpel + rivning), som planerat i PRD TASK-402. Landad via #2362 → main b6a598c1 (2026-09-06 natt, Marcus GO på hög risk); staging-skarpbevis tio rader (notes ovan).

TASK-425: DoD #1 bockad mot belägg (samtliga AC #1-#11 redan avbockade). OBOCKAT MED AVSIKT: DoD #5 (promoveringsgrindens visual-baslinje omtagen på den godkända ytan efter Marcus stämpel, ADR-103 B4) ägs av TASK-402.6 (status To Do, dependencies TASK-402.3+TASK-402.8) — det kortet stämplar facit.json godkand via stämplingsskriptet och tar om baslinjen i sin egen landning (ADR-103 B2 steg 4). 402.3s eget AC #9 (ariaSnapshot-par FÖRE/EFTER) är redan avbockat och landat via PR #2362 → main; DoD #5 kräver DESSUTOM händelsen 'efter Marcus stämpel' som ännu inte inträffat. Verifierat mot TASK-402.6:s faktiska kort 2026-09-07, inte antaget.
<!-- SECTION:NOTES:END -->
