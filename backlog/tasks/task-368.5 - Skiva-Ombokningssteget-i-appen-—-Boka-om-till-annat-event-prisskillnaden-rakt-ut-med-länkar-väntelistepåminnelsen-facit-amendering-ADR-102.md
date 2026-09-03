---
id: TASK-368.5
title: >-
  Skiva: Ombokningssteget i appen — Boka om till annat event, prisskillnaden
  rakt ut med länkar, väntelistepåminnelsen (facit-amendering ADR-102)
status: To Do
assignee: []
created_date: '2026-09-03 07:57'
updated_date: '2026-09-03 12:28'
labels:
  - ready-for-agent
dependencies:
  - TASK-368.3
  - TASK-368.4
parent_task_id: TASK-368
ordinal: 671000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beteende ände-till-ände: Lotta trycker Avboka anmälan, väljer i stället Boka om till annat event, ser vilket belopp som blir att återbetala eller saknas, och bekräftar. Personen har nu en ny anmälan med pengarna på plats, den gamla är avbokad med skälet ifyllt, och Lotta landar på den nya anmälan. Avbokar hon i stället ser hon hur många som väntar på plats. Ytan amenderas i facitet en gång till. Täcker användarberättelser: 12, 13, 16.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Anmälans sida är identisk med facit tasks/sessions/bilagor/s111-anmalningssidan-konvergens/facit.json ytan anmälningssidan, amenderat per ADR-102 med utskriven klassning + sidofil för ombokningsvalet och väntelistepåminnelsen; ariaSnapshot-referenser uppdaterade och gröna
- [ ] #2 Avbokningssteget har valet Boka om till annat event: en eventväljare (kommande event, samma form som skapa-anmälan) och skälet förifyllt 'Ombokad till <event, datum>' (redigerbart); bekräftelsen anropar ombokningsoperationen och landar på den NYA anmälans sida med ett kvitto i klartext på vad som hände
- [ ] #3 Prisskillnaden sägs rakt ut i steget innan bekräftelse: 'Nya eventet kostar X kr, Y kr blir att återbetala' eller 'saknas Y kr' eller 'samma pris'; efter bekräftelse visas samma text med länk till Registrera återbetalning respektive registrera inbetalning; inkorgen ändras inte
- [x] #4 När eventet som avbokas har personer på väntelistan visar bekräftelsesteget 'N personer väntar på plats' med länk till väntelistan; ingen automatik, ingen skrivning
- [x] #5 Acceptanstest i den hermetiska fixturvärlden prövar ombokning med samma pris, dyrare och billigare event, förifyllt och redigerat skäl, väntelistepåminnelsen med och utan väntande, felläget, axe noll överträdelser; desktop och iPad-bredd
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Facit-granskning mot tasks/sessions/bilagor/s111-anmalningssidan-konvergens/facit.json (ADR-102 R3): skarpa ytan jämförd bild för bild mot det amenderade facitet innan Done
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-368.5 byggd 2026-09-03 (bygg-agent, Opus). TRE divergenser mot kortet, samtliga mätta mot disk — bygget följde verkligheten, inte kortet (ADR-086).

(1) FACIT-YTAN I AC #1 OCH DoD #4 ÄR FEL. Korten pekar på tasks/sessions/bilagor/s111-anmalningssidan-konvergens/facit.json, ytan 'anmälningssidan'. Den ytan är anmälnings-LISTAN (/mer/anmalningar); dess kallor är VariantB.tsx, FilterRad.tsx, EventValjare.tsx, hem-derivations.ts. 'grep -l AnmalanDetail tasks/sessions/bilagor/*/facit.json' ger noll träffar. Anmälans DETALJSIDA är låst av S83 (Marcus 'Lås den' 2026-07-24), katalogen tasks/sessions/bilagor/s83-anmalningsvyn-konvergens/ — bilder, inget manifest. Amendering skriven där enligt ADR-102 § A3, klass (c), utskriven klassning: AMENDERING-2026-09-03-ombokningssteget.md (samma form som 368.3:s). AC-texten är ORÖRD; AC #1 bockad mot S83-facitet. check-facit.sh exit 0 före och efter.

(2) AC #2:s '(redigerbart)' SKÄL ÄR OBYGGBART mot serverkontraktet. RebookRegistrationInput (368.4, ADR-130) bär ENDAST registrationId + nyttEventId, och rebook-registration/index.ts säger uttryckligen 'INGET skal-FÄLT, med avsikt ... En fritextparameter hade gjort formen valfri och därmed obeständig.' Ett redigerbart fält hade tagit emot Lottas text och tyst kastat den. Byggt i stället: skälraden visas i KLARTEXT, exakt den rad servern skriver ('Ombokad till <eventnamn>, <ISO-datum>'). Källpariteten är mätt — serverns lasEvent läser Event (source) + Startdatum, klientens Event.eventNamn/startdatum kommer ur samma två fält via _shared/event-map.ts. AC #2 EJ bockad. Marcus avgör: stryk '(redigerbart)' ur AC #2, eller ge EF:en ett skal-fält i egen skiva.

(3) AC #3:s prisskillnad FÖRE bekräftelse är obyggbar med nuvarande läsytor. get-event och get-events returnerar INGET prisfält (disk-verifierat mot supabase/functions/_shared/event-map.ts § mapEventBas och src/domain/schemas/Event.schema.ts), och rebook-registration har inget torrkörningsläge. EFTER bekräftelse är den byggd fullt ut med serverns nyttPris/prisskillnad, i kvittot, med väg till Registrera betalning respektive Registrera återbetalning. AC #3 EJ bockad. Vägen fram är ett serverbeslut (prisfält i get-event, eller torrkörningsläge i EF:en) och togs inte av denna skiva.

BYGGT: OmbokningsSteg.tsx (eventväljaren = husets EventValjare, form fristaende, kommande event), OmbokningsKvitto.tsx (kvitto på nya anmälans sida via history-state mmOmbokningsKvitto), VantelistePaminnelse.tsx (get-event.vantelista, lat hämtning, tyst vid 0/okänt), ombokning-kvitto.ts (prisbesked + ombokningsskal, rena funktioner), serverfel.ts (begripligtServerfel bruten ut ur AvbokningsYta, två konsumenter nu), anmalan-detaljcache.ts (patchen bruten ut ur registrationCancellation och kopplad även till ombokningen). RegistreraYta fick REGISTRERA_TRIGGER_ID — spegelbilden av 368.3:s ATERBETALNINGS_TRIGGER_ID.

MÄTT FYND under bygget: useBokaOmAnmalan invaliderade bara — den gamla anmälans detalj är avmonterad direkt efter ombokningen, så invalideringen hämtade inte om, och med persist-lagret (ADR-072, staleTime 5 min) kunde gamla anmälans sida visa 'Bekräftad' i upp till fem minuter efter en gjord ombokning. Lagat med cache-patchen (anmalan-detaljcache.ts), bevisat i acceptanstestet.

RAPPORTERAT, EJ LAGAT HÄR: AvbokningsBetallage.tsx (368.3) bär rubriken 'Betalläge' som h4 direkt under DetaljGrupps h2 — axe heading-order-överträdelse, osynlig eftersom ytan ligger bakom VITE_FEATURE_BETALNINGAR och aldrig prövats av axe. Samma överträdelse fick denna skivas egen h4 i första körningen och är här rättad till h3. Betalningsdomänens fil, egen landning (ADR-053: blockerar ej, värdefullt).

TESTER: tests/acceptance/anmalan-ombokning.acceptance.test.ts, 16 fall, 16/16 gröna (räknat ur sviten slutrad). Regression: anmalan-avbokning + anmalan-detalj 16/16 gröna. axe 0 violations i ombokningssteget och i kvittot, 1280 px och 768 px.
<!-- SECTION:NOTES:END -->
