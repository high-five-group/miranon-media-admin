---
id: TASK-249
title: >-
  PRD: Segment-promoveringen — variant d till skarp yta med server-ägt
  regelspråk
status: Done
assignee: []
created_date: '2026-08-17 00:19'
updated_date: '2026-08-24 13:07'
labels: []
dependencies: []
ordinal: 462000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Lotta behöver kunna välja ut RÄTT personer ur deltagarhistoriken och nå dem tryggt — "alla som gått både RIM 1 och RIM 2 men inget mer", "alla som bara varit på en föreläsning", de fjorton Skool-grupperna — utan att kunna råka skicka utbildningsmaterial till föreläsningsbesökare. Dagens skarpa segment-yta är förra formspråksgenerationen, kan bara uttrycka ELLER-regler (10 av de 14 verkliga Skool-målen är outtryckbara, 127 av 416 personer onåbara), talar regeldump i stället för svenska, och saknar både gruppgeneratorn och täckningskvittensen.

### Lösning

Den Marcus-godkända prototypformen (variant d, facit stämplat) promoveras till skarp yta enligt promoveringskontraktet: mallvyn "Nytt segment" i tre steg som primär ingång, verkstaden som avancerat läge med OCH-kombinationer uttryckta som människomeningar, "Dela upp i grupper" som genererar disjunkta segmentuppsättningar med täckningskvittens, publiklista och utskicksvy som ärver åtgärdssidans trygghetsgrammatik. Serversidan lär sig det nya regelspråket så att mottagarkontrollen aldrig vilar på klientberäkningar, och basens nya fält Kursfamilj/Kursnivå blir dimensionskällan så att en ny kurs automatiskt omfattas.

### Användarberättelser

1. Som Lotta vill jag skapa ett segment genom tre enkla steg (vilka räknas med → vilka ska ingå → det här blir segmentet), så att jag inte behöver förstå regellogik för vanliga urval.
2. Som Lotta vill jag välja en av tre vägar i mallvyn (minst en av / vissa men inte andra / exakt kombinationen), så att de vanligaste urvalsformerna är ett klick i stället för regelbygge.
3. Som Lotta vill jag se en levande människomening och ett levande antal medan jag bygger ("Har gått både RIM 1 och RIM 2 - men ingen av de andra två utbildningarna." · N personer), så att jag vet vad segmentet betyder INNAN jag sparar.
4. Som Lotta vill jag kunna uttrycka "har gått BÅDE X och Y" (och-kombinationer), så att Skool-gruppernas verkliga urval går att bygga.
5. Som Lotta vill jag kunna undanta personer med ett platt utan-villkor, så att "men inte de som gått Z" är enkelt.
6. Som Lotta MÅSTE jag aktivt välja modalitet (utbildning/föreläsning/båda) i varje villkor, så att material aldrig av misstag når personer som enbart gått en föreläsning.
7. Som Lotta vill jag varnas när ett segment blandar modaliteter, så att en avsiktlig blandning aldrig passerar osedd.
8. Som Lotta vill jag dela upp en publik i grupper med en handling som genererar hela uppsättningen, så att jag slipper handbygga fjorton segment och ändå vet att varje person hamnar i exakt en grupp.
9. Som Lotta vill jag se en täckningskvittens ("100 % - Full täckning...") med golvad procent och avvikelser, så att jag vet att uppsättningen täcker alla — eller exakt vilka som står utanför.
10. Som Lotta vill jag se publiklistan direkt i segmentets detaljvy, med tydlig märkning "Får inte mailet" för consent-grindade, så att jag ser vilka som faktiskt nås före ett utskick.
11. Som Lotta vill jag kunna skicka ett testmail till mig själv från utskicksvyn, så att jag ser mailet som mottagaren ser det innan det går ut.
12. Som Lotta vill jag att utskick kräver skriv-för-att-bekräfta mot synligt mottagarantal, så att en oåterkallelig sändning aldrig sker på slentrian.
13. Som Lotta vill jag kunna avgränsa ett villkor till en tidsperiod med en riktig datumkontroll, så att "deltog under 2025" är valbart — och räkningen ärlig om vad servern faktiskt filtrerar.
14. Som Roger vill jag att ytan talar mitt språk ("utbildning", inte "kurs"), så att segmentnamn och meningar går att läsa högt för teamet.
15. Som Marcus vill jag att en ny kurs (t.ex. RIM 4) automatiskt omfattas av familjevillkor när eventet skapas med Kursfamilj/Kursnivå satta, så att taxonomin växer utan kodändring.
16. Som Marcus vill jag att servern äger både regelexpansionen och och-logiken, så att mottagarkontrollen aldrig kan luras av en klient.
17. Som Lotta vill jag att 0-träffssegment visas neutralt ("0 personer ännu - inga med genomförd närvaro"), så att basens oavstämda närvaro syns som signal, inte som fel.

### Implementationsbeslut

- **Facit-manifestet är den auktoritativa ytbeskrivningen** (ADR-102 B1): `tasks/sessions/bilagor/s104-segment-divergens/facit.json`, godkänt av Marcus (sha a40f3543, inga undantag). Sju ytor, SAMTLIGA med `bilder: []` — bevisformen är ariaSnapshot-referenser som promoverings-grinden fångar, per manifestets egen deklaration: **segment-listan** (tre kapslar, människomeningar, låst korthöjd 2lh/168px — app-global regel, träff-ordet följer valet) · **tackningsvyn** (kvittens, inte arbetsläge; golvad procent) · **nytt-segment-mallvyn** (tre steg, tre vägar, återanvänd regelmotor) · **verkstaden** (tre stegkort, namn sist, villkorskortets fråga först, och/eller-par i identisk geometri, verbet bär formen) · **segment-detaljvyn** (publiklista i personlistans anatomi, inline-scroll, U+00A0-höjdlås, "Får inte mailet", testmail-rad) · **generatorn** (tre synliga stegkort, partition-som-generator, de fjorton med uppmätta mål) · **utskicksvyn** (ärver åtgärdssidans låsta grammatik; T50-lagren behållna; riggarna utanför facit-scope).
- **Regelspråket per ADR-115:** med = konjunkt-grupper (DNF), utan platt, modalitet obligatoriskt led. Promoveringsgräns: prototypens klient-snitt får ALDRIG promoveras.
- **FEM EF-krav (facitets pass-nivå):** (1) compute-segment-svaret bär `via: Par[]` per medlem · (2) år/tidsfilter kräver deltagandedatum i källfrågan · (3) expansionen predikat→par-lista sker server-side · (4) AND-stödet in i membership-motorn och därmed i BÅDE compute-segment och send-email (T50 lager b: servern äger sanningen om vilka som nås) · (5) tidsperioden verkställs server-side (regeln bär tidsfönstret).
- **Skapelseväg-kanten (instansbevisad):** create-event-EF:en sätter Kursfamilj/Kursnivå vid radskapelse; appen läser dimensionerna ur basens fält (adresseras per NAMN, ADR-050) och prototypens hårdkodade kurskarta dör.
- **Medlemskapsgolvet ORÖRT:** Närvaropoäng=1 (ADR-064 beslut 1) — inget i detta arbete lättar det.
- **Rivningslistan (ADR-103 — flaggor och växlar, aldrig formen):** variant a/b/c, gamla SegmentBuilder, PrototypRigg (utfallslägena), SkalprovsVaxel, variantväxelns d-nyckel. Rivning är redan tillåten av grinden (godkand satt) men sker EFTER att referenserna låsts och flippen landat.
- **ORDLISTA uppdateras vid skörden:** Grupp (uppdelnings-betydelsen) · Uppsättning · villkorsgrupp→"alternativ" · ingressens "Urval av personer" (Marcus-kvitterade i chatten, ej skrivna).

### Testbeslut

- Testa EXTERNT beteende: regelns semantik prövas genom motorns svar (vilka personer kvalificerar), aldrig genom interna datastrukturer.
- **api-skarven:** EF-kraven utökar BEFINTLIGA sviter — membership-motorns testfil (DNF-fall: gått både X och Y, de fjortons delade villkorsfrågor, utan-subtraktion sist) och compute-segments stagingtest (via-fältet, server-expansionen, periodfiltret). send-email-pariteten prövas mot samma motor.
- **ariaSnapshot-promoverings-grinden:** ny spec-fil i befintlig klass, sjätte i raden efter åtgärdssidans/dörrlistans/eventsidans/hem-spaltens/persondetaljens mönster. Referenserna låses ur variant d FÖRE flippen — ordningen är enkelriktad. Referenserna ska stå ORÖRDA genom flipp och rivning och vara gröna efteråt (beviset att rivningen tog växlar, aldrig form).
- **acceptance + a11y/axe** i befintliga klasser mot skarpa ytan efter flipp; tillgänglighetsribban 11 utan undantag.
- Rött-först där en grind är leveransen (ADR-071-formen).

### Utanför omfattningen

- PersonsList-höjdlåsbuggen i skarp yta (latent, samma U+00A0-klass) — eget fynd-kort vid skörden.
- Bulkutskick-utkastens öde och Maillogg/Intresserade-ytorna (egna trådar).
- Handplockade individer i segment (kräver ADR-064-revision — passet tog ställning, bygger inte).
- Skool-modulmappningens config-tabell (ADR-062 beslut 5, senare).
- Basstruktur utöver Eventplanering (familj/nivå på andra tabeller).
- Supabase-migrationen (separat spår).

### Estimat

7 byggskivor + 1 QA-kort. Storleksklass M–L; EF-motorskivan är störst (motorn + två EF-konsumenter + testfall), flippen och rivningen är mekaniska när grinden står.

### ADR-koppling

- **ADR-115** (styrande — regelspråket: AND-primitiven, partitionen som generator, täckningen som kvittens; andra förfiningen av ADR-062 beslut 3).
- **ADR-102/103/104** (promoveringskontraktet: facit → identisk skarp yta → mekanisk rivning; godkännandet stämplat via kanalseparation).
- **ADR-062/064** (segmentets grundmodell + medlemskapsgolvet — orörda).
- **ADR-050** (fält adresseras per namn — Kursfamilj/Kursnivå).
- ADR-067 (utskickskontraktet) och ADR-086 (agentuppdrags premisser) gäller i bygget.

### Ytterligare anteckningar

- Skivorna är avsedda för agent-exekvering i nästa resume (autonom natt-orkestrering, Marcus-order 2026-08-17); uppdragen ska källmärka varje faktapåstående (ADR-086).
- Basfälten Kursfamilj/Kursnivå är redan skapade och backfyllda i BÅDA baserna med verifikat (prod 51/51, blank=0) — skiva 4 kopplar bara på skrivning-vid-skapelse och läsning.
- Lessons-kandidater 1–12 och UNIVERSAL-flaggor hanteras vid sessionens skörd, inte i skivorna.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 ariaSnapshot-referenserna låsta ur variant d FÖRE flippen (enkelriktad ordning, ADR-103 B4)
- [x] #6 check-facit grön genom flipp OCH rivning — referenserna orörda och gröna efteråt
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
SEGMENT-PROMOVERINGEN FULLBORDAD (S104, 2026-08-17): alla åtta skivor + följdskivan 249.9 byggda och landade i natt-orkestreringen (PR 1475/1477/1478/1480/1492/1494/1501/1510); EF:erna prod-deployade 38/38 (Marcus egen körning, prod-ref-låset); fronten bundle-bevisad; Marcus prod-QA → fynden åtgärdade (259, 264) och utredda (260); slutkvittens 'Ser bra ut'. MEDVETET UTANFÖR SCOPE, durabelt hem: sparande/sändning är fortfarande klient-simulerade — spec-frö task-271 (grillning först). Kvarvarande syskon: task-257 (fynd), task-258 (städ), task-265 (B1, bas), task-213.4-varningen. Full narrativ: sessionsdok S104 Del 1–10 + BUILD-LOG.

S112 bokföringspass (2026-08-24): samtliga 9 barn (249.1-249.9) Done, 8 landnings-PR:er verifierade MERGED+CI SUCCESS (1475,1477,1478,1480,1492,1494,1501,1510). check-facit.sh kört om: exit 0, 0 ogodkända manifest. ariaSnapshot-referenserna låsta ur variant d (249.1) FÖRE flippen (249.5) — enkelriktad ordning hållen. Samtliga 6 DoD bockade mot detta.
<!-- SECTION:FINAL_SUMMARY:END -->
