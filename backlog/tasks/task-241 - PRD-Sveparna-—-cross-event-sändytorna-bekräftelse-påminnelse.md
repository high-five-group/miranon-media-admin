---
id: TASK-241
title: 'PRD: Sveparna — cross-event-sändytorna (bekräftelse + påminnelse)'
status: To Do
assignee: []
created_date: '2026-08-16 09:20'
labels: []
dependencies: []
ordinal: 443000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering
Lotta ser på hemmet att anmälningar väntar på bekräftelse och betalningar förfallit över flera event samtidigt, men verkställandet är per event (Åtgärds-sidan) — sju event betyder sju separata granskningsrundor. Massutskick utan granskning är samtidigt otänkbart: fel mail till fel person skadar förtroendet för hela verktyget.

### Lösning
Hem PEKAR, svepet SKICKAR. Knapparna Bekräfta alla / Skicka påminnelse till alla öppnar en egen cross-event-sändyta med EN trygghetstriad för hela svepet: adresslista grupperad per event, bläddringsbar per-event-förhandsvisning, testmail till mig själv. Ett bekräftat svep gör ett sändanrop per event-grupp under huven. Övergången hem–sändyta–hem är en designad, mjuk transition — svepet ska kännas som en fortsättning av Morgonkollen, inte ett sidbyte.

### Användarberättelser
1. Som Lotta vill jag starta bekräftelsesvepet direkt från hemmets Bekräfta alla, så att jag slipper gå in i varje event för sig.
2. Som Lotta vill jag se hela adresslistan grupperad per event innan något skickas, så att jag vet exakt vem som får vad.
3. Som Lotta vill jag bläddra i förhandsvisningen per event, så att jag ser mailet som mottagarna ser det.
4. Som Lotta vill jag kunna skicka ett testmail till mig själv, så att jag kan kontrollera utskicket i min egen inkorg före skarp sändning.
5. Som Lotta vill jag kunna avbryta när som helst före sändning utan sidoeffekter, så att jag aldrig känner mig fastlåst.
6. Som Lotta vill jag att påminnelsesvepet respekterar en-påminnelse-modellen, så att ingen deltagare får dubbla påminnelser.
7. Som Lotta vill jag se skickat-markörer på hemmets rader efteråt, så att jag ser vad som redan är gjort.
8. Som Lotta vill jag att svepet lämnar spår i aktivitetshistoriken, så att jag i efterhand kan se vad som skickades och när.
9. Som Marcus vill jag att övergången till och från sändytan är mjuk och kontinuerlig, så att Lotta känner WOW — verktyget ska kännas förstklassigt i exakt det ögonblicket.

### Implementationsbeslut
- Hem PEKAR, svepet SKICKAR — trygghetstriaden (adresslista per event, bläddringsbar preview, testmail) tummas ALDRIG (grillad samsyn S102 Del 8).
- EN triad per svep, cross-event — per-event-granskning via Åtgärds-sidan FÄLLD som svepväg (Marcus UX-invändning: 7 event = 7 triader ohållbart). Full form: ADR-114.
- Ett sändanrop per event-grupp under huven.
- useConfirmAll-mönstret återuppstår med svepet som ny konsument (revs korrekt i 201.18 vid noll konsumenter).
- En-påminnelse-modellen med tre radlägen (S102 Del 10-grillningen) styr påminnelsesvepets urval.
- Övergången hem–sändyta: designad transition med prefers-reduced-motion-respekt; WOW-kravet (Marcus 2026-08-16) är explicit acceptansyta, inte polish.
- Sändvägarna återanvänder Åtgärds-sidans befintliga sändkontrakt; utökning till grupp-anrop prövas mot befintlig serverfunktions-yta INNAN ny byggs.
- Ordlistans termer gäller: Morgonkoll, Bevakningsrad.

### Testbeslut
Externt beteende testas, aldrig implementationsdetaljer. Primär skarv: acceptance-send-klassen — förebilder är de befintliga send-sviterna för bekräftelsemail, påminnelse och testmail i acceptance-katalogen, nu i cross-event-form (triaden: lista → preview → testmail → skarp sändning → skickat-markörer). Sekundärt: api-skarven för per-event-grupp-sändvägen; ett e2e-staging-flöde för fullt svep. Skarv-kvittens: Marcus 2026-08-16.

### Utanför omfattningen
- Hem-vyns egen form och innehåll (egen PRD).
- Per-rad-undantag inuti svepet (ogrillat — egen fråga om behovet uppstår).
- Nya mailmallar eller mallredigering.

### Estimat
5–7 skivor, medelklass: sändytans layout + triaden, bekräftelsesvepet ände-till-ände, påminnelsesvepet med en-påminnelse-urvalet, övergången/motion, QA.

### ADR-koppling
- ADR-114 (svep-formen: hem pekar/svepet skickar, EN triad cross-event) — mintad i samma landning som denna PRD.
- ADR-104 (godkännande via !-kanalen) för promoverings-stämplar i familjen.
- ADR-078 + DESIGN-SYSTEM-SPEC §15 (lugnt laddläge) för sändytans laddlägen.

### Ytterligare anteckningar
Marcus WOW-krav 2026-08-16 nära-verbatim: riktigt snygg övergång till och från granskningsvyn från hem-vyn, så Lotta känner WOW, vilken grej detta är. Hemmets facit (knapparnas placering): s102-hem-konvergens-manifestet, ägs av hem-PRD:n.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
