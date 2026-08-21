---
id: TASK-284.4
title: 'Skiva: Åtgärdskön på Hem — ny bevakningsradstyp med räknare'
status: To Do
assignee: []
created_date: '2026-08-21 11:18'
updated_date: '2026-08-21 13:22'
labels:
  - ready-for-agent
dependencies:
  - TASK-284.1
parent_task_id: TASK-284
ordinal: 519000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
BETEENDE ÄNDE TILL ÄNDE: Lotta öppnar Hem på morgonen. Finns anmälningar som behöver hennes uppmärksamhet står en rad där som säger hur många — klickar hon kommer hon direkt till dem. Finns inga är raden inte där alls: ingen rubrik, inget positivt kvitto, ingenting. En tom vy betyder att allt är i ordning.

FORMEN FINNS REDAN OCH SKA INTE UPPFINNAS. Bevakningsraden bär exakt denna semantik sedan S102 och är Marcus-godkänd: osynlig vid noll, klickbar uppgiftsrad vid träff, klicket öppnar en förfiltrerad åtgärdsyta. Detta är en NY RADTYP i den befintliga komponenten, inte en ny yta.

FACIT-LÄGET: hem-vyns facit är stämplat (2026-08-17) och dess bilder visar Hem utan denna radtyp. Promoveringsgrinden ankrar på aktivitetsspalten, inte på huvudkolumnen där bevakningsraden bor — tillägget fäller den alltså INTE (mätt, ej antaget). Kvar är en koherensfråga, som följer väg A: bygg mot orörd befintlig form, Marcus godkänner visuellt, och FÖRST därefter amenderas facit.

Täcker användarberättelser: 2, 3, 4, 18.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Allt utom den nya bevakningsradstypen är IDENTISKT med facit tasks/sessions/bilagor/s102-hem-konvergens/facit.json ytan 'hem-vyn V1 Lugna morgonen' i läge verklig, desktop och mobil — den befintliga formen är orörd, tillägget ligger i bevakningsradens befintliga zon
- [x] #2 Vid noll träffar är Hem IDENTISK med samma facit i läge tom: den nya radtypen är HELT frånvarande ur DOM:en — ingen wrapper, ingen rubrik, inget kvitto (asymmetrin mot block är Marcus-låst sedan S102)
- [x] #3 Räknaren härleds ur det beräknade fältet på anmälan, aldrig ur en klientberäkning — annars kan två ytor säga olika saker om samma rad
- [x] #4 Klick på raden öppnar åtgärdsytan förfiltrerad på exakt de anmälningar som behöver hanteras
- [x] #5 axe ger 0 violations på Hem i både fyllt och tomt läge; raden bär aldrig betydelse enbart genom färg
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-granskning gjord mot manifestet tasks/sessions/bilagor/s102-hem-konvergens/facit.json, ytan 'hem-vyn V1 Lugna morgonen' — sökvägen utskriven i PR:en, aldrig granskad mot minne eller mot en bildkatalog
- [ ] #6 Facit-amenderingen görs FÖRST efter Marcus visuella godkännande, i EGEN commit, med hans citat inskrivet som daterad amendering — ordningen är enkelriktad (T157 väg A, precedent satt för personlistans bokstavsrad 2026-08-21)
<!-- DOD:END -->
