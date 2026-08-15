---
id: TASK-225
title: 'PRD: Aktivitetshistorik-sidans promovering'
status: Done
assignee: []
created_date: '2026-08-15 09:16'
updated_date: '2026-08-15 10:48'
labels: []
dependencies: []
ordinal: 412000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Aktivitetshistorik-sidan talade inte husets designspråk (samma felklass som Check-in-fallets underkända varianter: textklump-rader utan identitetsmarkör, textlänk som sidkrom, ihoptryckt filterrad) och saknade dag-filtrering. Formen är nu konvergerad och låst som facit i S106-passet — men den lever bara bakom prototyp-växeln; Lotta möter fortfarande den gamla formen.

### Lösning

Den låsta facit-formen promoveras till den skarpa sidan (ADR-103: formen byggs aldrig om — villkoret flippas), följd av härdning: äkta totalsiffra i statusraden, samma händelsetext på hem-spalten som i historiken, och delade byggstenar lyfta till sina rätta hemvister.

### Användarberättelser

1. Som Lotta vill jag att aktivitetshistoriken ser ut och beter sig som appens övriga sidor (rund tillbaka-knapp, stor rubrik, luftiga filter, rader med initial-cirkel), så att jag känner igen mig direkt.
2. Som Lotta vill jag läsa naturlig svenska i händelseraderna ('skapade ett event'), så att jag förstår vad som hänt utan att tolka.
3. Som Lotta vill jag se initialerna för den som gjorde något, så att jag snabbt ser vem.
4. Som Lotta vill jag välja en specifik dag eller ett datumspann i en kalender, så att jag kan se vad som hände då.
5. Som Lotta vill jag att statusraden berättar hur många poster som finns totalt ('Visar 20 av 347'), så att jag vet om det är värt att ladda fler.
6. Som Lotta vill jag klicka på en historikpost och hamna där händelsen bor (eventet eller personen), så att jag kan agera på den.
7. Som Lotta vill jag att hem-spalten och historiksidan beskriver samma händelse med samma ord, så att jag aldrig undrar om det är olika saker.
8. Som Marcus vill jag granska den promoverade skarpa ytan mot facit-bilderna och stämpla godkännandet själv, så att kvittot är mitt (ADR-104).
9. Som utvecklare vill jag att datumväljaren blir en primitiv och fokusring-släckaren en base.css-regel, så att nästa yta återanvänder i stället för att kopiera.

### Implementationsbeslut

- Facit-manifestet är auktoritativt och slår varje prosabeskrivning (ADR-102 B1): tasks/sessions/bilagor/s106-aktivitetslogg/facit.json — EN yta, 'aktivitetshistorik-sidan', bilder facit-aktivitetshistorik-desktop.png + facit-aktivitetshistorik-mobil.png; not-fältet bär hela FACIT-specen (sidkrom, filterrad-uppdelning, statusrad, radanatomi, länkkarta, verb-copy, kända bildartefakter).
- Promoveringsordningen ADR-103 B2: (a) flip — prototypformen blir skarpa komponentens, skarpa datavägar behålls; (b) Marcus granskar den promoverade ytan (facit-bilderna är regressionsstöd, inte spec); (c) godkand-stämpeln sätts av Marcus via facit-godkännande-kommandot (kanalseparation ADR-104); (d) mekanisk rivning av växel + prototypfil + snapshot-rigg. RIVNINGEN ÄR EN SPÄRR EFTER STÄMPELN, ALDRIG EN KÖ-POST — facit-grinden håller trädet rött om substrat rivs medan godkand är null.
- Verb-copyn är ett presentationslager mappat på verbets stabila IRI (delad modul), lagrad display är fallback; hem-spaltens påkoppling kräver amendering av s55-hem-konvergens-facitets undantagslista (hem-spalten är stämplad godkänd yta; Marcus-riktningen kvitterad 2026-08-15).
- Statusradens målform 'Visar N av TOTAL' kräver total-räkning i läs-EF:en (exakt count på samma filtrerade fråga); interimsformen 'Visar de N senaste posterna · fler finns.' gäller tills den finns.
- Datumfiltret använder läs-EF:ens befintliga datumintervall mot occurred_at — ingen serverändring för filtret; datumväljar-komponenten lyfts till primitiv-biblioteket (dess eget 'bevisat delbehov'-villkor är uppfyllt).
- Rubrikens programfokus-ringsläckning flyttas från inline style till en base.css-släckare i listbox-släckarens etablerade form.
- Länkkartan behåller TASK-201.12-beslutet: event-mål vinner när båda finns, person-verben leder till personen, segment-poster olänkade.

### Testbeslut

Befintlig acceptance-skarv är primär och enda blockerande: de två hermetiska acceptance-sviterna för aktivitetshistorik-routen uppdateras mot nya formen — externt beteende (rubrik, filterflöden inklusive datumval och dess exklusivitet mot tidsperioden, statusradens copy, radernas länkmål), aldrig klassnamn eller pixlar. Staging-e2e-skarven (skriv/läs-kedjan) förblir orörd. ariaSnapshot-promoveringsgrind avstås öppet: den ligger utanför blockerande CI (mätt 2026-08-12) och har fällt noll. task-215-flaket (filter-acceptansen i full svit) beaktas vid uppdateringen — den uppdaterade sviten får inte ärva flakmönstret.

### Utanför omfattningen

- Hem-spaltens FORM (låst k10-facit) — endast händelsetexten via delade modulen, med facit-amendering.
- Segment-detaljsida (länkmål för segment-poster).
- Visual-grind i blockerande CI (S105:s öppna post).
- Aktörsnamns-datafixen (display_name på konton) — ägs av S102 parallellt.

### Estimat

4 skivor: 1 M (flippen + acceptance-uppdateringarna) + 3 S (EF-totalen · verb-copy till hem-spalten + facit-amendering · primitiv-lyftet + base.css-släckaren).

### ADR-koppling

ADR-102 (prototypen är facit), ADR-103 (promoveringsformen, B2-ordningen), ADR-104 (godkand-kanalseparationen), ADR-110/ADR-111 (loggens lagring + korrelations-ID, kontext). Inga nya över-bar-beslut identifierade.

### Ytterligare anteckningar

Skarv-valet Marcus-delegerat och avgjort 2026-08-15 ('Du vet bäst, du bestämmer'). Divergensfasen bortvald på Marcus order — konvergens direkt på befintlig yta; hela iterationsresan i bilage-katalogen s106-aktivitetslogg.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 check-facit.sh grön genom hela kedjan — rivning omöjlig medan godkand är null
- [ ] #6 Marcus godkand-stämpel via facit-godkännande FÖRE all rivning av prototyp-substrat
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Alla fem barn Done. Promoveringens båge komplett i PR #1335 (merge b924fb1b): flip → härdning (EF-total, hem-konsistens, primitiv-lyft, base.css-släckare) → Marcus granskning + godkand-stämpel → mekanisk rivning. Öppet kvar utanför PRD:n: prod-deploy av get-activity-log (Marcus runbook-moment) och inbakning av s55-amenderings-sidofilen i manifestet (Marcus !-moment).
<!-- SECTION:NOTES:END -->
