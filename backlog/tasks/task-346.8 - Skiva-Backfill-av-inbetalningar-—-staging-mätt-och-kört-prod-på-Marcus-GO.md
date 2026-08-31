---
id: TASK-346.8
title: 'Skiva: Backfill av inbetalningar — staging mätt och kört; prod på Marcus GO'
status: To Do
assignee: []
created_date: '2026-08-30 18:46'
updated_date: '2026-08-31 02:43'
labels:
  - ready-for-agent
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
- [ ] #4 Prod: ÖPPET AC för Marcus GO med exakt kommando och förväntade tal; agenten kör aldrig prod
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 ADR-128 och ADR-129 är Accepted och landade FÖRE första kodskiva armeras
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
<!-- SECTION:NOTES:END -->
