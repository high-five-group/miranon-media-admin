---
id: TASK-214
title: 'PRD: Promoveringen av check-in-D — dörrlistan blir den skarpa närvaro-ytan'
status: To Do
assignee: []
created_date: '2026-08-14 18:56'
labels: []
dependencies: []
ordinal: 401000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Lotta har ingen fungerande incheckningsyta: dagens skarpa närvaro-vy är en ren läslista utan interaktion, och den stämplade dörrlistan (variant D, godkänd av Marcus 2026-08-14) lever bakom en DEV-grind. Ingen skrivväg för närvaro finns i appen — noll operationer rör Deltaganden, så incheckning sker i Airtable direkt. Dessutom prod-mätt 2026-08-14: fyra aktiva anmälningar på kommande event saknar Deltaganden-rader (tre på oktober-eventet, alla utan Person-länk), så även en flippad yta skulle sakna write-mål för dem i dörr-ögonblicket.

### Lösning

Promoverings-kedjan (ADR-103 B2, 171-familjens mönster) tillämpas på dörrlistan, med en enabling-fas för närvaro-WRITE först: allowlist-posten och den nya create-attendance-EF:en byggs och bevisas i API-skarven → dörrlistans mutations-koppling (skrivning när kvittensfönstret löpt ut; ångra inom fönstret = ingen skrivning) → referenser + fixturer → flippen (A/B/C rivs; D blir den ovillkorliga formen) → härdning → Marcus granskar den promoverade ytan mot facit-bilderna och stämplar via !-kanalen → rivning + rename + regressionslås. Rotorsaken till saknade rader läks i basen (bas-vågens skiva 213.12, egen mintning) — CREATE-vägen är dörr-ögonblickets backup, aldrig lösningen.

### Användarberättelser

1. Som Lotta vill jag se dörrlistan för dagens session med bara dem som återstår att checka in, så att jag ser exakt vem jag väntar på.
2. Som Lotta vill jag checka in en deltagare med ett tryck och se raden kvittera grönt ("Incheckad HH:MM") innan den flyttar till klargruppen, så att jag vet att trycket tog.
3. Som Lotta vill jag kunna ångra inom kvittensfönstret utan att något skrivs till basen, så att ett feltryck aldrig lämnar spår.
4. Som Lotta vill jag kunna bocka ur en redan incheckad person i klargruppen, så att ett upptäckt misstag går att rätta i efterhand.
5. Som Lotta vill jag att incheckningen sparas i basen direkt, så att listan stämmer även om plattan laddas om mitt i insläppet.
6. Som Lotta vill jag välja session endast när eventet har flera, så att en föreläsning aldrig ber mig välja i onödan.
7. Som Lotta vill jag söka i dörrlistan, så att jag snabbt hittar en person när kön växer.
8. Som Lotta vill jag kunna checka in en person som står i listan även om basens deltaganderad saknas, så att dörren aldrig säger nej — systemet skapar då raden åt mig.
9. Som Lotta vill jag se ett tydligt fel och personen tillbaka i arbetslistan om skrivningen misslyckas, så att ingen incheckning tyst försvinner.
10. Som Roger och Lotta vill jag att närvaropoäng och kurshistorik fylls automatiskt av incheckningen via Insiktskedjan, så att inget manuellt efterarbete behövs.
11. Som Marcus vill jag att flippen bevisas med ariaSnapshot-par, så att promoveringen inte ändrar den stämplade formen.
12. Som Marcus vill jag granska den promoverade ytan mot facit-bilderna och godkänna via !-kanalen, så att godkännandet är min handling och ingen annans.
13. Som utvecklare vill jag att skrivningen endast kan röra det speccade fältet via allowlisten, så att en app-bugg aldrig kan skriva andra fält i basen.
14. Som utvecklare vill jag att varje create-attendance-användning syns i loggen, så att backup-vägen aldrig blir tyst normalväg.
15. Som utvecklare vill jag att A8 äger tidsstämpeln och att appen aldrig skriver Avstämt, så att basens automationer förblir sanningskälla.

### Implementationsbeslut

- Facit-manifestet: `tasks/sessions/bilagor/s103-checkin-konvergens/facit.json` — stämplat av Marcus 2026-08-14 (sha c7db8b16). EN yta deklarerad: "check-in (dörrlistan, variant D)" med två låsta bilder (mobil + desktop). Manifestets not-fält bär formens fullständiga låsning och slår varje prosabeskrivning, inklusive denna.
- WRITE-vägen per S90-förarbetet (redan speccad, live-underbyggd): generisk update-record-EF med ny allowlist-post set-attendance-status (tabellen Deltaganden per namn, ENDAST fältet Status). Inga nya bas-fält. Avstämt ägs av automationen A8 (watchFields enbart Status, live-verifierad) — appen skriver aldrig tidsstämpeln. Ingen ny idempotens-mekanism: incheckning är idempotent av konstruktion.
- CREATE-backupen: ny dedikerad create-attendance-EF enligt husets EF-mönster (auth via requireUser, server-side-byggda fält: Anmälan-länk, Event-länk, Session, Status satt till Närvarande — atomärt; Person-länken sätts av A11). Backup för dörr-ögonblicket; rotorsaken (anmälningar utan Person-länk, fälla 16/21-klassen) läks i basen via 213.12. Varje användning loggas synligt — symptomvägen får inte bli tyst normalväg.
- Skriv-ögonblicket: skrivningen går när kvittensfönstret (1,2 s) löpt ut; ångra inom fönstret = ingen skrivning alls; ångra efter fönstret (bocka ur i klargruppen) = vanlig statusskrivning tillbaka till Ej avstämt. Felväg: misslyckad skrivning återför raden till arbetslistan med synligt fel.
- V1-skrivytan är formens uttryck: Närvarande ⇄ Ej avstämt via kryssrutan. Övriga statusvärden utanför omfattningen.
- Flippen: variant-villkoret bort, D blir den ovillkorliga formen; varianterna A/B/C rivs redan i flippen (persondetalj-precedenten — stämpeln skyddar D, inte de förkastade alternativen). Läs-datavägarna orörda: samma query-nycklar, samma DI.
- Rivningslandningen (efter Marcus stämpel av den promoverade ytan): växlare och flagga rivs, komponenten döps om till EventCheckin (git-rename), gamla läsvyn EventAttendance rivs i samma landning, facit-manifestets kallor uppdateras i samma commit.
- Attribuering väg (a): Registrerad av bokför teknisk skribent (lastModifiedBy = token-ägaren); dokumenteras i data-model-referensen. Människo-attribueringen bärs av aktivitetsloggen (Fas 6.5) när den landar.
- Exekvering parallellt med bas-vågen: promoverings-skivorna är AFK; 213.12 (rot-orsaks-fixen) körs HITL först eftersom oktober-eventet är närmast berört.

### Testbeslut

- Två kvitterade skarvar (Marcus 2026-08-14, delegerad kvittens), inga nya byggs: hermetiska fixturvärlden (formen: fixturer för dörrlistans lägen — flera sessioner, sök, klargrupp, tomläge — ariaSnapshot-paret FÖRE/EFTER flippen, samt kvittensfönstrets bevis som nätverks-observation: inget skrivanrop före fönstrets utgång, ångra ger noll anrop) och API-skarven (S90-förarbetets testpar för allowlist-posten: deny på Avstämt, allow-toggle verifierad via läsvägen; create-attendance-tester som skapar och städar egna staging-rader).
- Räcken: tester asserterar ALDRIG på Avstämt (A8:s latens gör det flakigt per konstruktion), rör aldrig historik-fixturerna och aldrig Marcus granskningsfixtur.
- Externt beteende: renderad yta och observerbara nätverksanrop — aldrig interna props eller implementationsdetaljer.
- Bevis-loopen som arbetsform i varje form-uppdrag: skärmdump → jämför → lista skillnader → fixa; körningen lämnar spår.
- Visual-baslinjen omtas EFTER Marcus godkännande, aldrig före.

### Utanför omfattningen

- Övriga statusvärden (Frånvarande, Försenad, Deltog online, Avbröt) i dörrlistan — behovet mäts innan formen utökas.
- Rot-orsaks-fixen i basen (Person-länkning av de fyra anmälningarna + fälla-registrering i defekt-registret) — bas-vågens skiva 213.12, egen mintning och HITL-exekvering.
- Offline-kö eller PWA-synk för incheckning — inget bygge här.
- Aktivitetsloggens människo-attribuering — Fas 6.5 (S105-spåret).
- Carry 11 (Kommande event saknar sessions-dedup) — task-213-familjen.

### Estimat

6 skivor + QA: WRITE-enabling (EF + allowlist + API-testpar) (M) · mutations-kopplingen + kvittensfönstrets bevis (M) · referenser + fixturer + manifest-koll (M) · flippen + A/B/C-rivning + test-konsument-svep (M) · härdning (S) · rivning + rename + regressionslås (S). Därtill Marcus QA/stämpling (ready-for-human) och avslutande QA-kort.

### ADR-koppling

ADR-103 (styrande promoveringsform, B2-ordningen) · ADR-102 (facit-principen) · ADR-104 (godkännande-mekaniken, i drift) · ADR-074 (växlaren; rail är byggställning tills rivningsskivan) · ADR-063 § Updates (kontinuerlig bas-maxning — rotorsaken läks i basen) · ADR-050 (bas-portabilitet: tabell per namn i allowlisten) · ADR-055/056/057 (DI, dubbel-källa, lager-oberoende) · ADR-066 (kontrast: ingen ny idempotens-mekanism behövs) · ADR-096/097 (arbetsformen). Under-bar-besluten bor i S103 Del 15; inga nya över-bar-beslut väntas — uppstår ett mintas det separat och refereras.

### Ytterligare anteckningar

Promoveringsformens TREDJE tillämpning — den FÖRSTA där datavägar tillkommer (närvaro-WRITE är ny; 171 hade skarpa skrivvägar redan i prototypen, här byggs de som enabling). Grillad samsyn med Marcus kvittenser verbatim och prod-mättabellen: sessionsdok S103 Del 15. Skarpt underlag för WRITE-vägen: S90-förarbetets bilaga (beslutstabell, färdig allowlist-rad, testpar med räcken, attribuerings-analys). Prod-mätningen 2026-08-14: Event-55 tre aktiva anmälningar utan Deltaganden-rader (record-ID:n bokförda i Del 15), Event-25 en. B2 steg 2–3 gäller: Marcus granskar den promoverade ytan mot facit-bilderna INNAN rivningsskivan får köra — kvittensfönstret syns inte i stillbild, det upplevs live mot dev-servern.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 ariaSnapshot-paret grönt för dörrlistan (variant-läget före == promoverad yta efter)
- [ ] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i varje form-skivas PR
- [ ] #7 Datavägs-invarianten verifierad: läsvägen oförändrad vid flippen; skrivning sker ENDAST via de två speccade operationerna
- [ ] #8 Test-konsument-svepets träffyta bilagd och alla träffar uppdaterade i samma skiva som sin flip
- [ ] #9 Kvittensfönstrets kontrakt bevisat via nätverks-observation: inget skrivanrop före fönstrets utgång, ångra ger noll anrop
<!-- DOD:END -->
