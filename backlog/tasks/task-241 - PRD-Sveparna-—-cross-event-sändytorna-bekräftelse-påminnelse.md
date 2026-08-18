---
id: TASK-241
title: 'PRD: Sveparna — cross-event-sändytorna (bekräftelse + påminnelse + eventinfo)'
status: To Do
assignee: []
created_date: '2026-08-16 09:20'
updated_date: '2026-08-18 10:57'
labels: []
dependencies: []
ordinal: 443000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
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

### Amendering 2026-08-18 — eventinfo blir en TREDJE sveptyp (S107, Marcus GO)

PRD:n hette fram till nu *"(bekräftelse + påminnelse)"* och avgränsade sig
till två sveptyper. Den avgränsningen växer öppet här — den revs inte tyst.

**Vad som utlöste det.** Marcus prio 3 i S107: *"Bevakningsraderna på hemvyn
leder ingenstans … bör väl vara knappar och funka som 'bekräfta alla' och
'skicka påminnelse till alla' gör, eller hur?"* Utredningen (S107 Del 13 § C)
fällde fyra premisser som fanns i registret och visade att arbetet är
väsentligt mindre än det såg ut:

- **Sändmotorn finns och är skarp.** `send-action-email` bär redan
  `eventinfo` som åtgärdstyp, och `_shared/send-action-email.ts:366-367`
  stämplar exakt det fält bevakningsraden läser
  (`FALT_DELTAGARINFO_SKICKAD`). Mall + ämne finns i
  `atgardsmallar.ts:66-71`. Ytan är live på `/atgarder` sedan `TASK-147.3`.
- **Designbeslutet är redan fattat och grillat.** S102-grillningen beslut 4
  (`2026-08-10-session-102.md:726-727`) verbatim: *"klicket öppnar
  sändflödet förifiltrerat på exakt de ostämplade."* Det är det enda av
  grillningens åtta beslut som aldrig implementerades.
- **Vad som saknas är klient-plumbing, inte en EF.**

**Varför HÄR och inte i ett eget PRD** (Marcus scope-beslut 2026-08-18,
alternativ (a) av tre framlagda): samma sändmotor, samma yta
(`SvepOverlay`), samma trygghetstriad. Grillningens beslut 5 kräver *"EN
delad sändmotor per åtgärdstyp under båda ytorna — aldrig två
implementationer"*, vilket talar för att hålla typerna i samma familj. Ett
eget PRD för en tredje variant av samma sak vore ceremoni utan innehåll.

**Ny användarberättelse (10).** Som Lotta vill jag kunna skicka eventinfo
till exakt de bekräftade deltagare som saknar den, direkt från
bevakningsraden på hemmet, så att eftersläntrare efter utskicket inte
kräver att jag går in i eventet och plockar mottagare för hand.

**Nya implementationsbeslut.**
- `SvepTyp` utökas med `'eventinfo'`; urvalet är `utanEventinfo` för det
  klickade eventet — samma predikat som `hem-derivations.ts:302` redan
  härleder för bevakningsradens två lägen.
- Bevakningsraden bär handling DIREKT (svep), den navigerar inte till
  Åtgärds-sidan. Navigerings-vägen (`mmAtgardsUrval` →
  `/event/$eventId/atgarder`) prövades och avråddes: den flyttar Lotta bort
  från hemvyn mitt i morgonrutinen.
- Ingen ny EF byggs — samma stoppvillkor som `TASK-241.3` AC #1 tillämpade.
- `UTSKICK_SPARR` gäller mekaniskt för `runActionSend`, alltså även denna
  väg. Prod-flippen är ett öppet Marcus-moment.

**Utanför omfattningen växer INTE:** hem-vyns egen form, per-rad-undantag
inuti svepet och nya mailmallar ligger kvar utanför.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
