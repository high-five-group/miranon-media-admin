---
id: TASK-243
title: 'PRD: Hem-vyns omdesign — Morgonkollen'
status: To Do
assignee: []
created_date: '2026-08-16 10:07'
labels: []
dependencies: []
ordinal: 445000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering
Dagens hem visar läge snarare än arbete: Lotta öppnar appen på morgonen och måste själv leta reda på vad som kräver handling — nya anmälningar, förfallna betalningar, sällsynta tidskritiska undantag — och gamla Obetalda-kortet pekade dessutom på fel sak.

### Lösning
Hem blir Morgonkollen — arbetsplatsen där dagens läge läses uppifrån och ner med värme: fri hälsning, Nästa event i fullbredd, Nya anmälningar med bekräftelsesvep-knappen, Förfallna betalningar, Genvägar, Senaste aktivitet. Bevakningsraden bär sällsynta men tidskritiska härledda lägen och syns bara när den har något. Estetiken är LÅST i facit (V1 Lugna morgonen, fyra konvergensvarv). Hem PEKAR, svepet SKICKAR — verkställandet bor i svep-PRD:n.

### Användarberättelser
1. Som Lotta vill jag mötas av en fri hälsning utan platta, så att morgonen börjar lugnt.
2. Som Lotta vill jag se nästa event i fullbredd med dagar-kvar-form, så att jag direkt vet vad som är närmast.
3. Som Lotta vill jag se hur många nya anmälningar som väntar och kunna starta bekräftelsesvepet därifrån, så att bekräftandet blir ett svep i stället för ett letande.
4. Som Lotta vill jag se varje ny anmälans ålder (för 5 dagar sedan), så att jag prioriterar de äldsta först.
5. Som Lotta vill jag se förfallna betalningar med avgiftstyp per rad och skickat-markör, så att jag vet vem som ska påminnas och vem som redan fått.
6. Som Lotta vill jag att listorna visar ALLA rader i inline-rullning, så att inget göms bakom en kapad lista.
7. Som Lotta vill jag se bevakningsrader med fullständig text utan klippning, så att jag aldrig missar ett tidskritiskt undantag för att texten inte fick plats.
8. Som Lotta vill jag i tomt läge se en grön bock och läget är under kontroll, så att tomt känns tryggt och inte trasigt.
9. Som Lotta vill jag nå genvägarna (manuell anmälan, Åtgärds-sidan med eventväljaren först), så att nästa handling alltid är ett klick bort.
10. Som Lotta vill jag se senaste aktivitet kompakt längst ner med länk till historiken, så att jag kan följa vad som hänt utan att lämna morgonkollen.

### Implementationsbeslut
- Blockordningen (grillad samsyn S102 Del 8): hälsning FRI utan platta, Nästa event FULLBREDD, Nya anmälningar (räknar-rubrik + personlistans initial-form + bekräftelsesvep-knapp), Förfallna betalningar (definition: betalning saknas OCH deadline start minus 14 dagar passerad; avgiftstyp per rad; skickat-markör; ersätter Obetalda-kortet), Genvägar (eventväljaren först, 147.8-språket), Senaste aktivitet (alla bredder, kompakt + länk, delade verb-copy-modulen).
- FACIT-MANIFESTET: tasks/sessions/bilagor/s102-hem-konvergens/facit.json — EN yta deklarerad: hem-vyn V1 Lugna morgonen (dev-route /dev/hem-prototyp?variant=1), 6 bilder (verklig/tom/demo gånger desktop/mobil), godkand: null tills Marcus stämpel via utropstecken-kanalen efter promoveringsgranskning. Manifestet slår varje prosabeskrivning inklusive denna (ADR-102 B1).
- Promoveringskontraktet (ADR-102/103): formen promoveras EXAKT; det som rivs efter godkännande är flaggor och växlar, aldrig formen; B3-markören i facit-policyn skyddar prototyp-substratet tills stämpeln.
- Varv 4-leveranserna följer med i promoveringen: bevakningsradernas delade copy-modul, line-clamp-2-skyddsnätet (aldrig ellips på meningsbärande text), räknar-pillen, hover-mönstren, relativ tid via prod-hemmets formatterare.
- Hem PEKAR, svepet SKICKAR (ADR-114) — hemmets bulk-knappar öppnar sändytorna, verkställer aldrig själva.
- Kanban avvisad (Del 10); en-påminnelse-modellen bor i svep-PRD:n (task-241).
- Ordlistans termer gäller: Morgonkoll, Bevakningsrad.

### Testbeslut
Externt beteende, aldrig implementationsdetaljer. Primär skarv: acceptance-klassen — befintliga hem-acceptance-sviten skrivs om mot nya formen (blockordning, tomma läget, bevakningsradernas visas-bara-med-innehåll, copy-formerna). Sekundärt: e2e-staging för datakedjan (förfallna-definitionen, bevakningsradernas härledda data). Tillgänglighet i acceptance-vanan. Skarv-kvittens: Marcus 2026-08-16.

### Utanför omfattningen
- Sveparnas sändytor och övergången dit (PRD task-241 + ADR-114).
- AppShell-förändringar.
- Prototyp-rivning före Marcus stämpel (B3-spärren).

### Estimat
4 till 6 skivor, medelklass: form-promoveringen till skarp route, datakopplingarna, tomma läget + copy-modulen, acceptance-omskrivningen, QA.

### ADR-koppling
- ADR-114 (svep-formen: hem pekar, svepet skickar).
- ADR-102/103/104 (promoveringskontraktet + godkännandekanalen).
- ADR-078 + DESIGN-SYSTEM-SPEC paragraf 15 (laddlägen).

### Ytterligare anteckningar
Facit-trail: grillning Del 8 (åtta beslut) + Del 10 (fyra beslut), konvergensvarv 1 till 4 (PR 1355, 1357, 1366 dataläge-knappen, 1379, 1388), Marcus godkännande av varv 4 + facit-lås-ordern 2026-08-16. Kort task-226 (prototypen) förblir In Progress tills promoveringen landat och stämpeln satt; relationen avgörs vid skivningen.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
