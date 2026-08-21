---
id: TASK-284.5
title: 'QA: Eventlänkens vakt och åtgärdskön — manuell vandring'
status: To Do
assignee: []
created_date: '2026-08-21 11:20'
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
- [ ] #1 Samtliga steg i testplanen genomförda och utfallet noterat per steg
- [ ] #2 Avvikelser registrerade som NYA kort med exakt symptom och förväntat beteende — aldrig som retuschering av dessa kort
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
