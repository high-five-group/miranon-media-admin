---
id: TASK-162
title: 'PRD: Promoveringen av eventsidan — A1–A6 till godkänd identitet'
status: To Do
assignee: []
created_date: '2026-08-08 07:34'
labels: []
dependencies: []
ordinal: 301000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Eventsidans skarpa yta avviker från den facit-låsta prototypen på sex mätta punkter (facitkartans A1–A6): åtgärds-ytan bär fel form (beställningen 2026-08-05 saknas helt i skarpa), registrets navigering är tre flikar i stället för filterpanelen som itererades fram i vågorna 5/6/8/9, avbokade kan aldrig stå i skarpas register, en avdelare står kvar som revs på order, Bor över-läget bär fel ram, och batch-baren försvinner vid noll träffar. Marcus ser alltså inte den yta han godkände — och ADR-103 har avskaffat "skarpa bygget" som väg att rätta det: formen ska PROMOVERAS, inte återbyggas.

### Lösning

Prototypens form promoveras per ADR-103 B2: variant-formen blir den ovillkorliga, skarpas datavägar behålls, och varje promoverad yta bevisas identisk med variant-läget via ariaSnapshot-par i den hermetiska fixturvärlden. Efter Marcus sida-vid-sida-granskning och godkännande rivs flaggan (bor i TASK-145.6, omdefinierad — utanför detta PRD). Facit-bilderna tjänar som regressionsstöd vid granskningen; visual-baslinjen tas om efter godkännande som regressionslås.

### Användarberättelser

1. Som Lotta vill jag nå åtgärderna via ett "Gå till åtgärder"-kort i check-in-kortets form, så att vägen till utskicken är lika tydlig som vägen till check-in.
2. Som Lotta vill jag skriva ut detaljsidan via en fristående Skriv ut-knapp, så att utskriften inte blandas ihop med åtgärdslistan.
3. Som Lotta vill jag filtrera registret på steg-axeln via en synlig Visa-dropdown med åtta val, så att jag ser vilket filter som är aktivt.
4. Som Lotta vill jag filtrera på väg in-axeln (formulär, manuell, medföljande, väntelista), så att jag hittar till exempel medföljande som saknar slutbetalning.
5. Som Lotta vill jag kombinera de två filteraxlarna, så att jag kan svara på sammansatta frågor utan att exportera.
6. Som Lotta vill jag se "Visar N av M i registret" med avbokade-tillägget, så att jag alltid vet vad listan visar.
7. Som Lotta vill jag se avbokade i registret självt (grå-märkta, sist i ordningen), så att helheten syns utan lägesbyte.
8. Som Lotta vill jag rensa alla filterval med en knapp som bär räknebadge, så att jag snabbt kommer tillbaka till helheten.
9. Som Lotta vill jag ha registrets egen Skriv ut-ingång i panelens fot, så att utskriften finns där jag arbetar.
10. Som Lotta vill jag att Markera-knappen står kvar även vid noll träffar, så att batchläget inte hoppar när filtret ändras.
11. Som Lotta vill jag slippa avdelarlinjen under registret, så att ytan ser ut som den godkända designen.
12. Som Marcus vill jag granska varje promoverad yta sida vid sida mot prototypen och godkänna innan flaggan rivs, så att identiteten är bevisad före städning.
13. Som Marcus vill jag att varje promovering bevisas med ariaSnapshot-par, så att ett tredje läge aldrig kan landa obemärkt.
14. Som utvecklare vill jag att skarpas datavägar behålls vid promoveringen, så att ett formbyte aldrig ändrar datakälla.

### Implementationsbeslut

- Promoveringsordningen per ADR-103 B2: flip → Marcus-granskning → godkännande → rivning. Rivningen ligger utanför detta PRD (TASK-145.6, omdefinierad, fortsatt blockerad av facit-grinden).
- Datavägs-invarianten: protoDataMode-grenar är datakälla och promoveras INTE; endast form-grenar flippas. Blocken Beläggning, Gruppdynamik och Anteckningar rörs inte alls (endast datakälla, ingen formskillnad).
- Åtgärds-ytan (A1): AtgarderKort + SkrivUtKort blir ovillkorlig form; den gamla rubricerade Åtgärder-gruppen utgår. Kortets utfällnings-beteende består tills åtgärds-sidans hopkoppling (eget kort när S100 deklarerar sin yta klar). Den produktions-nåbara variant-grenen på eventsidan försvinner i och med denna flip.
- Registret (A2+A3+A4+A5+A6) promoveras som EN skiva — avvikelserna delar kod och tillstånd; att dela dem vore att upprepa R9-felet (skivsnitt följer kodens kopplingar, inte funktionsytan).
- Promoverings-grinden: ariaSnapshot-par per yta och läge (default, aktivt filter, Bor över-kryss, noll träffar) — variant-läget fångas FÖRE flippen, promoverad yta EFTER, i den hermetiska fixturvärlden.
- Facit-manifestet utvidgas med registrets yta, så rivningsspärren täcker ytan där fyra av sex avvikelser sitter.
- Befintliga staging-e2e-tester som asserterar den gamla skarpa-formen uppdateras i samma skiva som sin flip, aldrig separat.
- Varje utförar-uppdrag bär bevis-loopen som arbetsform: skärmdump → jämför mot variant-läget → lista skillnader → fixa. Körningen lämnar spår, inte en bock.

### Testbeslut

- Testa externt beteende: bevisen läser renderad yta (ariaSnapshot, skärmdump), aldrig interna props eller implementationsdetaljer.
- Primär skarv: den hermetiska fixturvärlden (deterministisk; samma metod som facitkartans egen mätning — query-param-växling i identisk fixturdata). Sekundär skarv: befintlig staging-e2e uppdateras till promoverad form. API-skarven orörd — datavägarna ändras inte.
- Förebilder i kodbasen: facitkartans mätmetod och den visuella riggens hermetik.
- A11y-golvet består: promoverade ytor behåller nivå 11; axe-pass ingår i härdningen.

### Utanför omfattningen

- Flagg-rivningen (TASK-145.6, omdefinierad; blockerad till Marcus godkännande).
- Åtgärds-sidans hopkoppling (väntar S100:s klart-deklaration; eget kort då).
- Framtida prototypers flaggform (ADR-103 B3 — gäller från nästa prototyp-pass, refaktorerar inte detta).
- Godkännande-mekaniken i facit-manifestet (G2-grillningen).
- Mottagen-datumets riktiga fält (TASK-147).

### Estimat

4 skivor + befintligt rivningskort utanför PRD:n. Storleksklass: grind+manifest (S) · åtgärds-ytan (S) · registret (M) · e2e-synk+härdning+bokföring (S).

### ADR-koppling

ADR-103 (promoveringsformen — styrande) · ADR-102 (facit-principen; B4 ersatt av promoveringsordningen) · ADR-074 (växlar-standarden; prototyp-railen är byggställning och rörs ej före rivningskortet) · ADR-096/097 (arbetsformen). Inga nya över-bar-beslut väntas; uppstår ett mintas det separat och refereras.

### Ytterligare anteckningar

Underlag: facitkartan (A1–A6), processaudit-syntesen Del 5 och sessionsdokets Del 12 bär hela trailen. Detta är promoveringsformens FÖRSTA skarpa tillämpning — utfallet är samtidigt processbeviset för ADR-103.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter)
- [ ] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i skivans PR
- [ ] #7 Datavägs-invarianten verifierad: inga protoDataMode-grenar flippade
<!-- DOD:END -->
