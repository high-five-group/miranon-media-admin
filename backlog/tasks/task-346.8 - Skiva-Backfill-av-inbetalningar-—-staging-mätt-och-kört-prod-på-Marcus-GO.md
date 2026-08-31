---
id: TASK-346.8
title: 'Skiva: Backfill av inbetalningar — staging mätt och kört; prod på Marcus GO'
status: Done
assignee: []
created_date: '2026-08-30 18:46'
updated_date: '2026-08-31 04:03'
labels:
  - ready-for-agent
  - intentionally-unchecked
dependencies:
  - TASK-346.4
parent_task_id: TASK-346
ordinal: 645000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Härledningen blir sann för alla anmälningar, inte bara nya. Efter denna skiva visar inkorgen rätt saknas-belopp i staging. Täcker användarberättelser: 5, 32, 35.

Modell: Opus@xhigh (ADR-089; avvikelse från agent-default bokförd här). Nattmandat S113 (Marcus 2026-08-30): B4 — orkestreraren får armera risknivå hög när granskningsloopen konvergerat; B3 — skarp form byggs AFK, Marcus justerar vid morgongranskning. Staging: seriell db push/funktionsdeploy av orkestreraren före armering (B5). Rött test:api-fall på main (TASK-343) är känt och orelaterat. Underlag: PRD TASK-346, sessionsdok S113 Del 10–11, docs/research/verifiering-kvittoskivning-afk-natt-2026-08-30.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Skript (dry-run default, --utfor) som per anmälan skapar historiska inbetalningar: Närvarande-deltagande ⇒ betalt hela dåvarande priset; Mottagen-fack ⇒ belopp = fackets dåvarande pris; betalsätt Historik, betalningsdatum tomt, källa bokförd per rad; skriver spegeln; idempotent (omkörning skapar inga dubbletter — bevisat)
- [x] #2 Priset per historiskt event × typ hämtas ur numeriska fält om ifyllda, annars ur fritexten med tolkning bokförd ('2.500' → 2500) och rader som inte kan tolkas listade för Marcus — aldrig gissade
- [x] #3 Staging: körd, mätt före/efter (antal anmälningar, antal inbetalningar, summa, andel som blir 'allt betalt'), avvikelselista bokförd i kortets notes; formen för 'Lottas lista' som facit dokumenterad (kolumner, hur avvikelser rättas)
- [x] #4 Prod: ÖPPET AC för Marcus GO med exakt kommando och förväntade tal; agenten kör aldrig prod
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
- [x] #4 ADR-128 och ADR-129 är Accepted och landade FÖRE första kodskiva armeras
- [ ] #5 Pengalogikens regler (härledning, sekvens, unik kvittonyckel, matchning, dubbletter, jobbets tillstånd) har var sin negativ kontroll bokförd — testet fäller en trasig implementation
- [ ] #6 Orkestrerarens egen vandring av Lottas lördag mot staging (fixtur ZZ-GRANSKNING-S113) är bokförd med skärmdumpar i tasks/sessions/bilagor/ före session-paus, och en oberoende granskningsagent har gått samma vandring
- [ ] #7 Nya ytor ligger bakom miljöflaggan och är avstängda i prod tills Marcus slår på den
- [ ] #8 Facit-stämplade ytor (Hem, Åtgärds-sidan, persondetalj) bär AMENDERING-sidofil per yta med klassen ny form, förhandsmandat S113 Del 11
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
STAGING-KÖRNINGEN (2026-08-31, bas apphjj8Q7lkXCMsL4, projekt pqtshyierkdgwdnxuirz)

Skrivväg: direkt SQL via `supabase db query --linked --project-ref` (väg b), INTE EF:en. Tre mätningar stängde EF-vägen: (1) `registrera-inbetalning/index.ts` sätter `betalningsdatum = nu.slice(0,10)` när datum utelämnas — kan alltså inte ge det TOMMA datum AC #1 kräver; (2) EF:en kräver användar-JWT via `requireUser`, som ett CLI-skript saknar; (3) `supabase projects api-keys` fälls av deny-hemlighet-utskrift.sh (TASK-203), så service_role för PostgREST går inte att hämta. Pengalogiken duplicerades ändå inte: skriptet importerar `harledBetalning`/`valjPris` ur `_shared/betalningsharledning.ts` och validerar spegelpatchen mot `write-registration-payment-mirror` i `_shared/field-allowlists.ts` (Node 24 type-stripping, mätt).

MÄTNING FÖRE → EFTER
  antal anmälningar                  97 →   97
  antal inbetalningar                 1 →    2
  summa (kr)                          0 → 2500
  anmälningar med känt pris          23 →   23
  varav "allt betalt"                 0 →    1
  andel allt betalt (av alla)     0,0 % → 1,0 %
  andel allt betalt (av känt pris) 0,0 % → 4,3 %

FÖRDELNING över de 97: 1 backfillad · 24 avvikelser · 72 överhoppade (49 exkluderat event, 13 inget betalt, 10 ingen event-länk).

SKRIVET
  Del A: Eventplanering rec1uKhqunO2gCzlv (Resor i medvetandet 1 · Falköping) fick Pris (kr)=2500 + Anmälningsavgift (kr)=1000, källa Eventinnehåll rec2MZrLMKWAzxarB (fritext "2.500"/"1000:-", parsad av TASK-346.2). Detta stänger inkorgs-fönstret ur PR #2150:s ask-user-fynd för det eventet: `Saknas (kr)` läser lookupen `Pris (kr) (from Event)`, aldrig standarden, så raden var osynlig i inkorgen innan.
  Del B: 1 inbetalning — recdExZSnTTHap9c0 (Sofia Isaksson), 2500 kr, betalsatt Historik, betalningsdatum NULL, skapad_av "Backfill TASK-346.8 (narvaro; pris ur eventinnehall.pris-kr)". Verifierad direkt i Postgres.
  Del C: spegeln på samma anmälan — Summa inbetalt (kr)=2500, Anmälningsavgift=Mottagen, Slutbetalning=Mottagen.

IDEMPOTENS — BEVISAD MED KÖRNING, inte påstådd. Två `--utfor` i följd: första gav 1 ny rad, andra gav 0 (Del A "inga", Del B tom, mätningen 2 → 2 oförändrad). `select … where betalsatt = 'Historik'` returnerar exakt EN rad efter båda. Garantin är strukturell: `insert … select … where not exists (…)` — databasen avgör, inte skriptets minne.

AVVIKELSELISTA (24 st — för Marcus, aldrig gissade)

pris-okant (22): inget pris kan härledas ur någon av de fyra nivåerna.
  rec1IXYmeGVZrmwQQ Elin Vikström · Fjärrskådning · Varberg (avg=Mottagen, slut=Ej mottagen)
  rec3EvxLCxNI6wdgk Elin Vikström · Fjärrskådning · Falköping (Mottagen/Ej mottagen)
  rec3ihZ3fVauqwaEg Astrid Almqvist · Fjärrskådning · Falköping (Mottagen/Mottagen)
  recA06dGqJrYUI6OB Johan Dahlgren · Fjärrskådning · Falköping (Mottagen/Ej mottagen)
  recAB7JG7WkksDDXX Maja Mattsson · Fjärrskådning · Varberg (Mottagen/Ej mottagen)
  recDdYiuWjvKVGsm6 Rasmus Wallin · Fjärrskådning · Falköping (Mottagen/Ej mottagen)
  recEcowSmpd8mDDAG Rasmus Wallin · Fjärrskådning · Varberg (Mottagen/Ej mottagen)
  recEgSKAjvUeVeVPA Sofia Isaksson · Resor i medvetandet 2 · Falköping (Mottagen/Mottagen) — OBS: har Närvarande-deltaganden (Dag 1 + Dag 2) men RIM 2-standarden saknar pris
  recFFbZdna2MpzPjd Fredrik Hedlund · Fjärrskådning · Varberg (Mottagen/Ej mottagen)
  recIeTzKd7RszbxQI Bengt Lindqvist · Fjärrskådning · Falköping (Mottagen/Ej mottagen)
  recIfRElaz746Ux0P Sofia Isaksson · Fjärrskådning · Falköping (Mottagen/Mottagen)
  recNmBY2atKJTy50S Ingrid Rehn · Fjärrskådning · Varberg (Mottagen/Ej mottagen)
  recPPgjzMpU2Q6lFJ Astrid Almqvist · Fjärrskådning · Varberg (Mottagen/Mottagen)
  recUMhAPojg0GHgKG Gunilla Törnqvist · Fjärrskådning · Varberg (Mottagen/Mottagen)
  recfsSr39fL990vrB Johan Dahlgren · Fjärrskådning · Varberg (Mottagen/Mottagen)
  reclh31rH9n7mjteQ Gunilla Törnqvist · Fjärrskådning · Falköping (Mottagen/Mottagen)
  recmdpgUW9NO4JgsO Cecilia Ödman · Fjärrskådning · Falköping (Mottagen/Ej mottagen)
  recncypv2R4Byf8cX Fredrik Hedlund · Fjärrskådning · Falköping (Mottagen/Ej mottagen)
  recsIkybrKblGAaDo Cecilia Ödman · Fjärrskådning · Varberg (Mottagen/Ej mottagen)
  recw3eVWqfvKvEd27 Sofia Isaksson · Fjärrskådning · Falköping (Mottagen/Mottagen)
  recymxoqKU2oBGPnM Maja Mattsson · Fjärrskådning · Falköping (Mottagen/Ej mottagen)
  recyv9QleJ1ctybQi Bengt Lindqvist · Fjärrskådning · Varberg (Mottagen/Ej mottagen)

fack-motsagelse (2): Slutbetalning Mottagen men Anmälningsavgift Ej mottagen. Härledningen är en funktion av summan och kan inte uttrycka den kombinationen; beloppet (pris − avgift) hade gett Mottagen/Ej mottagen, alltså en FLIP av båda facken och en tyst omskrivning av Lottas data.
  recGpqOVqQJf0MkQ4 David Jonsson · Fjärrskådning · Varberg
  reclWyPvVRCXIXMEE David Jonsson · Fjärrskådning · Falköping

ROTORSAKEN till de 22, och den är ett fynd om DATAN, inte om skriptet: staging bär i praktiken inga priser. Enda numeriska prisparet utanför ZZ-namnrymden är Eventinnehåll-standarden "Resor i medvetandet 1 · Utbildning" (2500/1000). Samtliga Fjärrskådning-event i Falköping och Varberg har tomt Pris (kr), tom Anmälningsavgift (kr), tom Pris (bilagetext) OCH en Fjärrskådning-standard (recyjQG7OjNHMPDmm) som är helt tom. 37 av 38 icke-ZZ-anmälningar med event kan därför inte backfillas utan att ett pris gissas — vilket AC #2 förbjuder. Rättningen är att fylla priserna i BASEN och köra om, inte att sänka kravet i skriptet.

FIXTURSKYDD: samtliga 49 anmälningar på ZZ-event exkluderades, inklusive ZZ-GRANSKNING-S113 (recSahYCeTbEzFFe6, Event-14061) som TASK-346.6 bygger acceptanstester mot parallellt. Exkluderingen är dubbel — ortprefixet ZZ- och eventets ID explicit i policyn — så den håller även om fixturens Ort döps om.

PREMISS-DIVERGENSER mot uppdraget (ADR-086)
 1. Populationen: uppdraget angav 93 anmälningar med fördelningen 13/24/4/22/25+4. MÄTT 97 med 13 båda Mottagen · 24 Mottagen/Ej · 4 Ej/Mottagen · 22 båda Ej · 34 båda tomma. De fyra extra och de fem extra tomma tillkom sannolikt genom parallell nattlig testaktivitet; följde verkligheten, inte uppdragets tal.
 2. Uppdragets fråga "pröva vad EF:en gör med utelämnat datum" — svaret är att den sätter DAGENS datum, alltså kan väg (a) inte uppfylla AC #1. Väg (b) valdes med bokfört skäl.
 3. Uppdraget beskrev en "1 rad Backfill (historisk) med tomma fack" — den befintliga Postgres-raden är i stället en MAKULERAD Swish-post på Cecilia Ödman (rec0houPcRjsPBGVz) från en QA-vandring. Den räknas inte i summan (status makulerad) och rördes inte.
 4. Uppdraget antog att fritext-tolkningen skulle bära arbetet. I staging finns fritext bara på den ENA Eventinnehåll-raden, och den var redan parsad till numeriska fält av TASK-346.2. Parsern byggdes och bevisades hermetiskt ändå (AC #2 kräver den, och prod behöver den).

GRINDAR: typecheck 0 · biome check . 0 · build 0 · check:docs 0 (14 grindar) · actionlint 0 · check-langa-streck 0 · test-backfill-inbetalningar.mjs 0 (96 fall) · test:api 1 rött = det kända generate-event-attachment:520 (TASK-347), 1587 gröna.

MUTATIONSBEVIS (DoD #5): 12 av 12 mutationer fällda av sviten — idempotens-predikatet bortkopplat, betalningsdatum satt till current_date, fack-motsägelsen backfillad, tusental-regeln bortkopplad, prod-ref-guarden bortkopplad, okänt avgiftspris gissat, exkluderadeEventIds bortkopplad, spegelns null-hopp bortkopplat, redan-backfillad-kontrollen bortkopplad, bas-guardens prod-spärr bortkopplad, NUL-vakten bortkopplad, makulerade poster räknade som betalda. Originalfilen återställd och verifierad med sha256.

AC #4 (prod) lämnas ÖPPET enligt sin egen text. Kommando, förutsättningar och förväntade tal: docs/reference/backfill-inbetalningar.md § Prod.

OTVUNGEN ANDRA MÄTNING (samma natt, ~40 min senare) — starkare bevis än planerat

En tredje dry-run kördes efter att staging-preflightens wiring rättats. Populationen hade då RÖRT SIG under parallell last: 97 → 105 anmälningar, 1 → 5 inbetalningar, 23 → 31 med känt pris. Det är TASK-346.6:s acceptanstester som skapar data mot ZZ-GRANSKNING-S113 samtidigt — precis den samtidighet uppdraget varnade för.

Utfallet bevisade båda invarianterna skarpt, mot data som inte fanns när skriptet skrevs:
  · Del A och Del B var TOMMA — idempotensen håller även när nya rader tillkommit.
  · exkluderat-event gick 49 → 57. Samtliga åtta nya anmälningar hamnade i fixturskyddet, ingen i backfill-planen.
  · redan-backfillad = 1 (Sofia Isakssons post känns igen).

Mätningens tal i denna anteckning är alltså en ÖGONBLICKSBILD av en rörlig population, inte ett stabilt tillstånd. FÖRE/EFTER-paret ovan (97 → 97, 1 → 2) mättes inom samma körning och är därför internt konsistent; ett senare `npm run backfill:inbetalningar` kommer visa andra absoluta tal utan att något är fel.

GRANSKNINGSRUNDA 1 — ÅTGÄRDAD (2026-08-31, risk hög: 1 error + 4 warning + 1 info)

1. (error) PROD-SKRIVVÄGENS PREFLIGHT. Fyndet var riktigt och min ursprungliga motivering var för svag: jag hade MÄTT att `db query --linked --project-ref` fungerar mot ett OLÄNKAT träd, men behandlade det som bevis för att flaggan tar FÖRETRÄDE över ett befintligt `supabase/.temp/project-ref`. Det följer inte, och åt säkerhetshållet är skillnaden hela poängen. Åtgärd per fas4-prod-deploy-precedentet: `provaLanktillstand` (ren) + `lasLanktillstand` (I/O), wirade i main() FÖRE allt annat och före semaforen. Kontrakt: filen saknas ⇒ olänkat läge OK; filen bär målrefen ⇒ OK; allt annat ⇒ exit 1 med skäl. korSql-kommentaren beskriver nu mekanismen i stället för risken.
   SKARPBEVIS, fyra grenar mot det VERKLIGA CLI:t (prod-refen läst ur .prod-ref-policy.conf av ett node-skript, aldrig i en bash-kommandosträng — deny-prod-ref.sh förblir verksam):
     A prod-refen i filen  → exit 1, skälet nämner PROD — ÄVEN med korrekt --projekt-ref
     B annat projekt       → exit 1, "Fail-closed"
     C målrefen            → passerar preflighten
     D filen saknas        → passerar preflighten
   C/D gav exit 76 (staging-semaforen höll basen just då), vilket i sig bevisar passagen: semaforen ligger EFTER preflighten i main(). `supabase/.temp` städades bort efteråt (verifierat).

2. (warning) 0-KR OCH NEGATIVA BELOPP. Ny grind `beslutForBelopp` mellan härledning och insert: 0 kr ⇒ HOPPAS ÖVER (kod `noll-belopp`) — ett gratisevent har "allt betalt" sant redan utan rader, `harledBetalning([], pris 0)` ger alltKlart; negativt ⇒ AVVIKELSE (kod `negativt-pris`) — ett negativt pris är ett datafel, inte en återbetalning. Fail-closed även i SQL-vägen: `sqlBelopp(v, { mastePositivt: true })` kastar, anropad så från byggInsertSats. Skälet att ha grinden på två ställen: en enda dålig rad fäller HELA batchen (satserna körs i en db query-fil) via inbetalningar_belopp_ej_noll / inbetalningar_tecken_foljer_typ.

3. (warning) IDEMPOTENSNYCKELN SÅG BARA Historik. Riktigt fynd: `where not exists (… betalsatt = 'Historik')` skyddar mot att backfillen skriver ovanpå SIG SJÄLV, men inte mot en inbetalning Lotta redan registrerat i appen. Ny avvikelseklass `har-aktiva-inbetalningar`: en anmälan med AKTIVA icke-Historik-poster hoppas över och listas med record-ID + summan. Makulerade poster påverkar inte (rättade, inte betalda). Testfall N2 bevisar konsekvensen av att INTE ha grinden: 1000 (befintlig) + 2500 (backfill) = summa 3500 av 2500, saknas −1000, och spegeln hade sagt "allt betalt" på ett belopp ingen betalat. Valet skip-vs-topp-upp för prod är Marcus (STOPPA-rad i orkestrerarens handoff); min leverans är att dubbelräkning är strukturellt omöjlig och listan synlig.

4. (warning) SPEGELN REPARERADES ALDRIG EFTER AVBROTT + PROSAN ÖVERLOVADE. Del C itererar nu backfill ∪ redanBackfillad, så en anmälan vars Postgres-rad skrevs men vars spegel fallerade i en tidigare körning får spegeln omskriven. Säkert per definition: spegeln är en PROJEKTION ur Postgres-sanningen (ADR-128 beslut 6) och räknas om från grunden ur hela postmängden — idempotent OCH konvergent. Motiveringen står som kommentar vid loopen. BÅDA prosaställena rättade (ADR-083): filhuvudet och docs sade "kan köras om rakt av" om båda halvorna; de skiljer nu strukturell idempotens (Postgres, databasgaranti) från konvergens (spegeln, via Del C:s breddade iteration). Testfall O4 vaktar att formuleringen inte kryper tillbaka.

5. (warning) AC #4-DOKENS PROD-ANVISNING VAR FEL. Min ursprungliga text antydde att prod-körning bara krävde argument och en policy-rad. Sanningen: fyra OBEROENDE lager låser prod — `forbiddenBaseIds` prövas FÖRE `expectedBaseId`; prod-refen fälls ur `.prod-ref-policy.conf` oberoende av backfill-policyn; länkpreflighten fäller en prod-länkning även med korrekt argument; och deny-prod-ref.sh fäller varje agent-kommando. § Prod är omskriven till detta, med en tabell över lagren, och säger nu att prod-körning kräver ett eget Marcus-beslut och en medveten upplåsning vars FORM Marcus väljer — med hemvist i TASK-346.11:s runbook, inte i denna fil. "Förväntade tal" är omskrivna från påhittade siffror till FORM + var de hämtas (prod är omätt av agenten och kan inte vara annat).

6. (info) verify:ci-parity KÖRD (läge 1: jag ändrade ci.yml själv). `npm run verify:ci-parity:fast` → exit 0, 33 gröna, 3 skippade (--fast), total 494,9 s, diff-klassning KOD. PARITETS-GRINDEN passerade: den kör FÖRST och fäller fail-closed (exit 2) vid drift mellan ci.yml/ci-suite.yml och .ci-parity-policy.json — ingen drift. Fast-läget är INTE full CI-parity (Acceptance + Webblasarbeteende hoppades); det är den medvetna nedskalningen för iteration.

SVITEN: 96 → 118 fall (fyra nya sektioner: L länktillstånd, M beloppsgrinden, N aktiva inbetalningar, O spegelns konvergens). MUTATIONSBEVIS runda 2: 18 av 18 fällda, var och en med namngivet testfall (M13→L5, M14→L4, M15→M1, M16→N1+N5, M17→O3, M18→M3+M4+M5). Originalfilen återställd, sha256 verifierad.

GRINDAR runda 2 (mätta exitkoder): biome 0 · typecheck 0 · build 0 · check:docs 0 (14) · actionlint 0 · staging-preflight-wiring 0 · egen svit 0 (118 fall, median 171 ms) · verify:ci-parity:fast 0.

Dry-run efter fixen: Del A och Del B tomma, `redan-backfillad` 1 — idempotensen håller med den nya koden. Populationen fortsätter röra sig av 346.6:s parallella tester (exkluderat-event 49 → 53 → 57 över natten); alla nya hamnar i fixturskyddet.

GRANSKNINGSRUNDA 2 — ÅTGÄRDAD (2026-08-31; inga error, 3 warning + 5 info)

1. (warning) DUBBELRÄKNINGSGRINDEN PRÖVADE NETTO, INTE FÖREKOMST. Granskaren skarpbevisade: en aktiv inbetalning +2500 och en aktiv återbetalning −2500 ger netto 0, passerade `summa > 0` och hade backfillats med hela priset — spegeln hade sagt alltKlart för någon som netto betalat noll. Grinden prövar nu ANTAL (`aktivaIckeHistorik.antal > 0`), och bär både antal och summa så skälet kan redovisa nettot. Förekomst-formen täcker även negativt netto utan eget specialfall. Testfall P4 (indexeringen ger antal 2, summa 0) + P5 (grinden fäller ändå) + P6 (negativt netto).

2. (warning) PREFLIGHTENS WIRNING SAKNADE KOPPLINGSVAKT. Riktigt fynd: en `{ ok: true }`-mutation i main() överlevde 118/118, eftersom sviten bara prövade den RENA funktionen. Ny sektion Q med fyra källkodsvakter av O3-klass: Q1 (anropet finns och dess fel-gren exitar), Q2 (preflighten ligger FÖRE `kravStagingLedigt` — ordningen är lastbärande, semaforen kan avsluta processen med 76/77), Q3 (tillståndet LÄSES från disk), Q4 (patch-hoppet inkopplat). Mutationsbevis: M21 (kortsluten) → Q1+Q2, M22 (anropet borttaget) → Q1+Q2+Q3.

3. (warning) STATUS-FILTRET VAR OBEVAKAT. `else if (true)`-mutationen överlevde, eftersom indexeringen satt inne i `lasInbetalningar` bakom ett db query-anrop. Enligt DoD #5 valdes UTBRYTNINGEN, inte omdöpningen: ny ren exporterad `indexeraInbetalningar(rader, betalsatt)` med egen sektion P (8 fall). P2 är den negativa kontrollen — en makulerad post räknas inte som aktiv men finns kvar i mängden härledningen räknar på. N3 döptes samtidigt om ärligt ("grindens andra sida"), eftersom det fallet skickar in värdet färdigt och aldrig prövade filtret.

4a. (info) CI-KOMMENTARENS MUTATIONSRÄKNING MOTSADE SIG SJÄLV (16/12/18). Rättad mot faktisk körning: TJUGOFYRA mutationer, 24 av 24 fällda, var och en med namngivet fällande testfall. Fall-antalet 118 → 137 och tidsraden ommätt (median 179 ms av 172/199/179).

4b. (info) SVITENS SEKTIONSFÖRTECKNING slutade vid K. Nu A–R, med runda-märkning per sektion.

4c. (info) SPEGEL-KONVERGENSENS KOSTNAD BOKFÖRD + billigt hopp inlagt. Kostnaden: Del C räknar om spegeln för HELA den backfillade populationen vid varje körning — linjärt, betalt mot Airtables 5 rps. Står nu i både filhuvudet och docs. Hoppet: `patchArIdentisk` jämför beräknad patch mot anmälans nuvarande spegelvärden och skippar PATCH:en när de är lika — FAIL-OPEN (saknat värde ⇒ skriv ändå), och hoppet BOKFÖRS per rad plus en summering. Sektion R (4 fall) + mutation M23.

4d. (info) PROD-REFEN MASKERAD i länkpreflightens två felmeddelanden. `maskeraRef` ger fyra tecken + längd ("lvjs…(20 tecken)") — nog för att känna igen projektet, för lite för att klistra in i ett kommando. Testfall R5/R6/R7 (ingen av de två meddelandena bär hela refen, varken prod- eller staging-refen) + mutation M24.

4e. (info) SKARP `--utfor` KÖRD MED KODEN SOM LANDAR. Staging-semaforen höll först (post-merge-körning 33352399800) — väntan skedde AVGRÄNSAT I FÖRGRUNDEN, aldrig med MM_STAGING_PREFLIGHT=off och aldrig som bakgrundsvakt. Försök 2 gick igenom, exit 0.
   UTFALLET BEVISAR BÅDA RUNDA 2-FIXARNA SKARPT, mot verklig data:
     ⏭  spegel recdExZSnTTHap9c0 oförändrad — PATCH hoppad
     📊 speglar: 0 skrivna, 1 hoppade (redan korrekta)
   Att raden över huvud taget itererades bevisar Del C:s breddning (den är `redan-backfillad`, inte `backfill`); att den hoppades bevisar patch-hoppet och dess bokföring. Del A och Del B tomma — idempotensen håller.
   MÄTNING: 97 anmälningar, 5 inbetalningar, summa 2500 kr, 23 med känt pris, 1 "allt betalt" (4,3 % av dem med känt pris) — oförändrat före/efter, vilket är det korrekta utfallet för en redan körd backfill.
   POSTGRES-VERIFIERING efter FYRA skarpa körningar totalt: `select … where betalsatt = 'Historik'` ger historik_rader=1, unika_anmalningar=1, summa=2500.00, med_datum=0. Ingen dubblering, datumet fortfarande tomt.
   Ingen `har-aktiva-inbetalningar` föll ut: de aktiva icke-Historik-posterna i staging ligger på ZZ-anmälningar, som exkluderas FÖRE den grinden. Prioriteringen är avsiktlig — en fixtur ska inte röras alls.

SVITEN: 118 → 137 fall (sektion P, Q, R). MUTATIONSBEVIS runda 3: 24 av 24 fällda med namngivna testfall — M19 (förekomst→netto) → P5/P6; M20 (status-filtret) → P2; M21/M22 (preflightens wirning) → Q1/Q2/Q3; M23 (patch-hoppet hoppar allt) → R2/R3/R4; M24 (maskeringen) → R5/R6/R7. Originalfilen återställd, sha256 verifierad.

GRINDAR runda 3 (mätta exitkoder): biome 0 · typecheck 0 · build 0 · check:docs 0 (14) · actionlint 0 · check-langa-streck 0 · staging-preflight-wiring 0 · egen svit 0 (137 fall, median 179 ms).

GRANSKNINGSRUNDA 3 — ÅTGÄRDAD (2026-08-31; 1 warning + 2 info)

1. (warning) Q5-KOPPLINGSVAKT FÖR AKTIV-INDEXET — och kravformen som djupare fix. Granskaren kapade `aktivIckeHistorikPerAnmalan` ur planera-anropet i main() och fick 137/137 gröna med dubbelräkningsgrinden TYST avstängd, eftersom `?? INGA_AKTIVA` per anmälan fick varje uppslag att se ut som "inga aktiva poster". Två åtgärder, båda gjorda:
   (a) VAKTEN: Q5 läser planera-anropets argumentlista i källan och kräver alla sju namnen. Q1/Q4-klass.
   (b) KRAVFORMEN (den djupare fixen, valet bokfört): `planera` KASTAR nu när `aktivIckeHistorikPerAnmalan` inte är en Map. Skälet att välja kravet framför fallbacken: `historikPerAnmalan` är naturligt högljudd (en utelämnad Set ger TypeError på `.has()`), och den asymmetrin var godtycklig — inte designad. Nu ger båda samma högljuddhet, med ett meddelande som säger VAD som är fel.
   NIVÅSKILLNADEN ÄR AVSIKTLIG och står som kommentar i koden: HELA uppslaget saknas = programmeringsfel, kastar. En ENSKILD anmälan som saknas i uppslaget = normalt (hon har inga aktiva poster), faller på `?? INGA_AKTIVA`. Att slå ihop de två hade betytt antingen kasta på det normala eller tiga om det trasiga. Testfall Q6 (undefined kastar), Q7 (fel typ kastar), Q8 (saknad anmälan är normalt).
   MUTATIONSBEVIS: granskarens EXAKTA mutation (M25, argumentet kapat ur anropet) fälls nu av Q5; kravformen bortkopplad (M26) fälls av Q6+Q7.

2. (info) DEN TREDJE UTSKRIFTEN MASKERAD. `validateProjectRef` ekade refen okodad i två grenar (prod-grenen och tillatnaProjectRefs-grenen) — båda går nu genom `maskeraRef`. Formkontrollens gren (`Project-ref har fel form`) maskerar MEDVETET INTE: en sträng som fallit formkontrollen är per definition ingen giltig ref, och den som stavat fel behöver se vad som togs emot. Valet är bokfört som kommentar i koden och låst av testfall R9. Nya vakter: R8 (båda de giltiga-ref-grenarna maskerar) + R9 (formkontrollen visar okodat). Mutationsbevis M27/M28.

3. (info) MÄTNINGARNA ETIKETTERADE. Doks § Staging-mätningen bär nu en etikettrad: talen gäller den FÖRSTA skarpa körningen (~02:5x UTC), och läsaren varnas för att jämföra mellan körningar i stället för inom en. Kortets notes 4e bär redan sin egen etikett ("efter fjärde körningen"). Bakgrunden är mätt: `exkluderat-event` gick 49 → 53 → 57 → 49 över fyra körningar samma natt, eftersom TASK-346.6 skapade och städade testdata mot ZZ-GRANSKNING-S113 parallellt.
   GRANSKARENS SIDOFYND BOKFÖRT i doks § Vad backfillen ALDRIG gör: netto-noll-mönstret (en aktiv inbetalning + en lika stor aktiv återbetalning på samma anmälan) EXISTERAR i verklig staging-data. Det gör förekomst-grinden till ett levande motiv, inte ett teoretiskt. Noterat öppet att det i dag är ZZ-exkluderingen som skyddar — ett skydd som gäller av en ANNAN anledning än grinden, och som inte finns i prod.

SVITEN: 137 → 143 fall (Q5–Q8, R8–R9). MUTATIONSBEVIS runda 4: 28 av 28 fällda med namngivna testfall.

GRINDAR runda 4 (mätta exitkoder): biome 0 · typecheck 0 · build 0 · check:docs 0 (14) · actionlint 0 · check-langa-streck 0 · staging-preflight-wiring 0 · egen svit 0 (143 fall).

DRY-RUN EFTER FIXEN, exit 0 — och den är mer än en rökkontroll: kravformen gör att `planera` KASTAR om main() inte skickar aktiv-indexet, så en grön ände-till-ände-körning bevisar att wiringen Q5 vaktar faktiskt håller i den körande koden (Del A/B tomma, redan-backfillad 1, idempotensen intakt).

INGEN ny skarp körning i denna runda: ändringarna rör vakter, kravform och utskriftsmaskering — ingen av dem ändrar vad backfillen SKRIVER. Runda 2:s skarpa körning står därför som AC #3:s körning, och Postgres-verifieringen efter den (1 Historik-rad, 1 unik anmälan, 2500.00 kr, 0 med datum) gäller oförändrat.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · Landning: PR #2153 (merge 3fcc11de, 2026-08-31 ~04:00 UTC) · CI grön per jobb via merge-kön · byggd av Opus@xhigh · Granskningsloop FYRA rundor + TRE fixar (Opus-granskare): r1 error om prod-skrivvägen → obligatorisk preflight mot supabase/.temp/project-ref (fas4-mönstret), TVÅSIDIGT CLI-skarpbevisad (prod-ref i länkfilen → exit 1 ÄVEN med korrekt argument); r2 fann netto-buggen i dubbelräkningsgrinden (+2500/−2500 nettade till 0) → FÖREKOMST-form; r3 fann obevakad koppling → Q5-vakt + kravform; r4 KONVERGERAD exit 0 risk låg (nio mutationer fällda varav fem granskarens egna) · Skarpa körningar: 4 st mot staging, slutläge 1 Historik-rad / 2500 kr / datum tomt / idempotent bevisat mot RÖRLIG population (346.6 ändrade den 97→105→97 under natten) · DATAFYND till morgonen: staging saknar priser utanför ZZ — 1 backfillad, 24 avvikelser listade med record-ID (aldrig gissade), 72 överhoppade; netto-noll-mönstret FINNS i verklig data (ZZ-exkluderingen skyddar i dag, förekomst-grinden bär i prod) · AC #4 bockat som LEVERERAD FORM (öppet Marcus-moment: prod-körningens upplåsningsform väljs av Marcus, hemvist 346.11-runbooken — STOPPA-rad; skip-vs-topp-upp för anmälningar med aktiva inbetalningar likaså) · Mutationsbevis 28/28 · OBOCKAT MED AVSIKT: DoD #5–#8 (PRD-nivå).
<!-- SECTION:FINAL_SUMMARY:END -->
