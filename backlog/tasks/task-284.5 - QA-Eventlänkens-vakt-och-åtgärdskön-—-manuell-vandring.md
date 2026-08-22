---
id: TASK-284.5
title: 'QA: Eventlänkens vakt och åtgärdskön — manuell vandring'
status: To Do
assignee: []
created_date: '2026-08-21 11:20'
updated_date: '2026-08-22 11:32'
labels:
  - ready-for-human
dependencies:
  - TASK-284.1
  - TASK-284.2
  - TASK-284.3
  - TASK-284.4
parent_task_id: TASK-284
ordinal: 520000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
MANUELL TESTPLAN. Körs i staging där inget annat anges; prod-steg kräver Marcus GO.

1. NORMALFLÖDET ÄR ORÖRT. Skicka en anmälan via huvudformuläret med korrekt eventnyckel. Förvänta: anmälan kopplas till rätt event, deltaganden skapas som förut, beräknat värde OK, ingen rad i åtgärdskön.

2. FEL NYCKEL, RÄTT TEXT — huvudfallet. Skicka en anmälan där eventnyckeln pekar på ett annat event än datum och ort säger. Förvänta: INGEN eventlänk sätts, inga deltaganden skapas, anmälan syns som 'Utan event' i listan, och åtgärdskön på Hem räknar upp med ett.

3. NYCKEL UTAN PREFIX. Skicka en anmälan med nyckeln skriven som bara siffran. Förvänta: samma utfall som steg 2 — normaliseringen gör den jämförbar, jämförelsen avgör.

4. EXPRESSFLÖDET ÄR OPÅVERKAT. Skicka en anmälan via expressformuläret (tom eventnyckel, ifylld datum-och-ort). Förvänta: kopplas som förut, ingen fällning.

5. TOMT ÄR INTE FEL. Ta en anmälan som saknar ortsuppgift. Förvänta: värdet är 'kan inte avgöras', inte 'Avviker' — och den hamnar INTE i kön.

6. DE MÄTTA FALSKA POSITIVA. Kontrollera Event-59:s rader, som avviker i formatering men inte i sak (upprepat årtal, mellanslag runt tankstreck, skiftläge i kursnamnet). Förvänta: OK, inte Avviker.

7. RESOLUTION HELA VÄGEN. Klicka raden på Hem, välj rätt event för en av posterna, bekräfta. Förvänta: anmälans värde blir OK, den försvinner ur kön, räknaren minskar med ett, och BÅDE eventlänken och eventnyckeln är satta.

8. TOMMA LÄGET. Lös alla poster i kön. Förvänta: raden på Hem är HELT borta — ingen rubrik, ingen wrapper, inget kvitto. Jämför mot facit i läge tom.

9. FACIT-JÄMFÖRELSEN. Ställ Hem sida vid sida med facit-bilderna i läge verklig, desktop och mobil. Förvänta: allt utom den nya raden är oförändrat.

10. TILLGÄNGLIGHET. Tabba genom Hem med kön fylld. Förvänta: raden nås med tangentbord, aktiveras med Enter och Space, och dess betydelse framgår utan färgseende.

11. PROD-VERIFIERING (Marcus GO): kontrollera att inga befintliga anmälningar felaktigt klassats som avvikande efter att fältet införts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Samtliga steg i testplanen genomförda och utfallet noterat per steg
- [x] #2 Avvikelser registrerade som NYA kort med exakt symptom och förväntat beteende — aldrig som retuschering av dessa kort
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
QA-VANDRINGEN GENOMFÖRD (S110 Del 7 + Del 9, 2026-08-22), utfall per steg: 1–5 OK via API i Del 7 (sex fall ände-till-ände mot staging med A1 påslagen, se task-284.2 notes). 6 OK — ZZ-TASK-284.1 Fixtur OK (staging-motsvarigheten till Event-59, som är prod-rader) syns INTE i kön; Marcus läste listan. 7 OK — kastbar post 'ZZ-QA-284.5 Steg 7 Kastbar' (ID 5540, reciKlPhvZMMM98aS) skapad via API med fel nyckel (Event-8756) + rätt text (Fixtur A): A1 vägrade länka (Error-log-rad med ort/kurs/datum-diff), kön 12→13, Marcus valde Fixtur A i KopplaTillEventDialog, kön 13→12; verifierat i basen efteråt: Event=recLGV8kJJk5iyvkh, EventKey=Event-8755, Eventmatchning=OK — båda fälten i samma skrivning. Posten + Error-log-raden raderade efteråt, kön = exakt de 12 permanenta fixturerna. 8 HOPPAT ÖVER med mätt skäl (Del 7 § F): köns 12 rader är 9 andra sviters permanenta fixturer + 3 av 284.1:s egna (tests/api/fixtures.ts:200-233) — tomma läget är acceptance-testat (hem.acceptance.test.ts). 9 OK — Marcus jämförde Hem mot facit-hem-v1-verklig-desktop/-mobil.png: enda skillnaden utöver raden är den DOKUMENTERADE amenderingen 2026-08-17 (genvägarnas hover + etiketten 'Gå till åtgärder', AMENDERING-2026-08-17-hover-och-etikett.md) — medveten, önskad, bilderna ej omtagna (T157-klass; rullas in i samma omstämpling som 284.4 DoD #6). 10 OK — Tab når raden, Enter och Space aktiverar, betydelsen bärs av texten. 11 DELEGERAT till task-284.6 AC #2: prod-kontrollen förutsätter att fältet finns i prod, vilket 284.6 skapar, och 284.6 beror på detta kort — samma kontroll, samma Marcus-GO; bokfört öppet här i stället för en cirkulär väntan. AVVIKELSER som NYA KORT (AC #2): TASK-291 (åtgärdskö-raden visuellt identisk med eventinfo-raden — särskiljning inom bevakningsrads-familjen; blockerar 284.4 DoD #6) och TASK-292 (anmälningssidan aldrig konvergerad — egen arbetsenhet efter 284.6). Inga retuscheringar av befintliga kort.
<!-- SECTION:NOTES:END -->
