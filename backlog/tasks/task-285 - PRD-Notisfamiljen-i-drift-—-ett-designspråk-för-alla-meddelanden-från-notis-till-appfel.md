---
id: TASK-285
title: >-
  PRD: Notisfamiljen i drift — ett designspråk för alla meddelanden, från notis
  till appfel
status: To Do
assignee: []
created_date: '2026-08-21 10:45'
updated_date: '2026-08-22 19:35'
labels: []
dependencies: []
ordinal: 515000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Lotta får i dag fem olika slags meddelanden från appen (ny version, en del av sidan kunde inte laddas, du är offline, fel och kvitton inne på sidorna, hela appen gick sönder) och de ser ut som fem olika appar: fyra designspråk, tre knappformer, tre breddregimer. Det vanligaste — uppdateringsnotisen — trycker dessutom ner hela sidan när den dyker upp (på mobil en enda visning över hela layouthopp-budgeten), och texterna är långa, tekniska eller lovar saker appen inte kan hålla ("Försök igen" när det enda som hjälper är att ladda om). Marcus dom: *"Det ser ju skitfult ut, fruktansvärt"* och *"Vi har samma problem med alla felmeddelanden"*.

### Lösning

Hela familjen talar ETT designspråk, låst i två konvergens-pass: en färgad vänsterkant och en tonad yta bär formen, ingen kontur, rubrik i intent-färg och neutral brödtext, knappar högerställda under texten, kryss bara på det som får stängas. Uppdateringsnotisen blir en liten överlagrad ruta nere till höger som aldrig flyttar på innehållet och aldrig försvinner av sig själv. "Kunde inte laddas" stannar i flödet men flyttar in under sidans rubrik i innehållets bredd och kortas. Offline-beskedet får samma överlagrade form. Fel inne på sidorna, sektionsfel och appfel får samma ruta och samma knapprad, och varje text säger vad som hände, vad som hände med det du skrev, och vad du gör nu.

### Användarberättelser

1. Som Lotta vill jag att en ny version annonseras diskret i ett hörn, så att sidan jag står på inte hoppar eller trycks ner.
2. Som Lotta vill jag kunna välja "Inte nu" och fortsätta arbeta, så att jag själv bestämmer när jag laddar om.
3. Som Lotta vill jag att notisen inte kommer tillbaka förrän det finns en NY version, så att jag inte tjatas på.
4. Som Lotta vill jag att notisen aldrig försvinner av sig själv, så att jag hinner läsa och agera i min takt.
5. Som Lotta vill jag, när en del av sidan inte kan laddas efter en uppdatering, få ett kort besked under rubriken med en tydlig knapp, så att jag förstår att omladdning är enda vägen.
6. Som Lotta vill jag i det läget få veta att jag bör kopiera osparad text innan jag laddar om, så att jag inte förlorar något.
7. Som Lotta vill jag se "du är offline" på samma diskreta sätt som "ny version", så att appens meddelanden känns som en familj.
8. Som Lotta vill jag att fel inne på en sida (sparande, hämtning) ser likadana ut överallt, så att jag känner igen formen direkt.
9. Som Lotta vill jag att en felruta säger vad som hände med det jag skrev, så att jag vet om jag behöver göra om något.
10. Som Lotta vill jag att ett kvitto ("mail skickat") går att stänga bort, men att ett fel står kvar tills orsaken är borta, så att jag inte av misstag klickar bort något viktigt.
11. Som Lotta vill jag att en knapp aldrig lovar något den inte kan hålla ("Försök igen" på ett fel som kräver omladdning), så att jag inte klickar förgäves flera gånger.
12. Som Lotta vill jag att sidan som visas när hela appen gått sönder ser ut som appen, så att jag litar på att det är Miranon Media Admin jag fortfarande är i.
13. Som skärmläsaranvändare vill jag att en ny version annonseras artigt när jag är ledig, utan att fokus flyttas, så att jag inte avbryts mitt i en mening.
14. Som skärmläsaranvändare vill jag att ett blockerande fel annonseras direkt, så att jag inte står och väntar på något som aldrig kommer.
15. Som skärmläsaranvändare vill jag att det aldrig finns två tomma alert-regioner i en vy, så att landmärkesnavigering förblir entydig.
16. Som tangentbordsanvändare vill jag nå notisens knappar utan att tabba genom hela sidan, så att "Ladda om" är ett fåtal tryck bort.
17. Som användare med högkontrastläge vill jag att rutorna får en tydlig kontur i sin intent-färg, så att kanten inte försvinner när konturen i normalläget är borta.
18. Som användare med rörelsekänslighet vill jag att inga notiser animeras in, så att inget rör sig oväntat.
19. Som Marcus vill jag att familjen har EN styrande spec-yta och ett ordlisteförd namn, så att nästa meddelande byggs rätt utan att någon frågar.
20. Som Marcus vill jag kunna jämföra den skarpa ytan mot prototypen sida vid sida innan något prototyp-substrat rivs, så att det som byggs är det jag godkände.
21. Som utvecklare vill jag att knappraden, krysset och rollen (status/alert) bestäms av primitiven, inte av varje sida, så att familjen inte glider isär igen.
22. Som utvecklare vill jag att testerna för bannern och chunk-läget fortsätter vara fixturfria och snabba, så att klassvalet inte byter bara för att formen gjorde det.

### Implementationsbeslut

- Styrande beslut: ADR-121 (notistrappan — form per klass, beslut 1–7, § 8) och DESIGN-SYSTEM-SPEC § 21. Ingen ny ADR: formen är Marcus-låst genom två konvergens-pass och faller under ADR-103:s promoveringskontrakt.
- **Facit-manifest, auktoritativa för formen (ADR-102 B1) — båda ska namnges på varje skiva som rör en facit-yta:**
  - `tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json` — yta `uppdateringsnotis` (två bilder, AMENDERAD 2026-08-21: ingen kontur per familjeregeln) och yta `chunk-banner` (`bilder: []` — deklaration: ingen form låstes, beslut 3 är spec-materia).
  - `tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json` — ytorna `meddelanderutan` (MessageBox inkl. SectionError), `appfel-sidan` och `uppdateringsnotis` (`bilder: []`, pekar på manifestet ovan).
- Promoveringsordningen per ADR-103 B2, facit-låsningen redan gjord (HITL-förkrav uppfyllt 2026-08-21): referenser (ariaSnapshot-par FÖRE flipp) → flipp → härdning → Marcus QA/stämpling (ADR-104, `godkand` via `!`-kanalen) → rivning av växlare, `?variant`-grenar, prototyp-route och prototyp-komponenter. Rivning är en spärr efter godkännande, aldrig en vanlig beroendepost.
- Beslut 1 verkställs som delning: info-läget renderas av den promoverade överlagrade notisen och bor kvar där den globala bannern bor i dag (alla grenar: login/dev/inloggat); chunk-läget flyttar in i det inloggade skalet som första barn i innehållsytan, så det ärver innehållets bredd och hamnar omedelbart före varje sidas h1 (GOV.UK "immediately before the page h1", Carbon/Material "below the header"). Chunk-läget visas fortfarande ovanpå info-läget, aldrig staplat.
- Överlagrade notisen: fast bredd max 22 rem, nere till höger ovanför TabBar-pillen på alla bredder, z-index över innehållet men under modaler, ingen timer, ingen animation, `role="status"`-region alltid monterad och bara innehållet växlar, fokus flyttas aldrig. "Inte nu" döljer för SESSIONEN (sessionStorage med try/catch-skydd för låst/privat läge — samma form som startvärmningens flagga) och notisen återkommer vid nästa NYA version, aldrig periodiskt. Regionen får ett tillgängligt namn.
- Chunk-bannern: titel + en mening + knapp "Ladda om"; databesked-varningen ("har du skrivit något som inte är sparat, kopiera det först") bor HÄR och ingen annanstans (ADR-121 § 8 avgjort av Marcus 2026-08-21: "Kör på dina rekommendationer"). `role="alert"` och villkorad montering behålls oförändrade. Ingen kontur; familjeformen.
- Bekräftelsedialog med osparad-detektion registreras som egen tråd (mekaniken finns inte alls i koden i dag — noll träffar på dirty-state, blocker eller beforeunload) och byggs INTE i denna arbetsenhet.
- Offline-beskedet: samma promoverade notis-komponent, innehåll "Du är offline" + en mening, ingen knapp, försvinner när anslutningen är tillbaka. Formen är återanvänd, inte ny — men Marcus granskar den som egen yta i QA eftersom facit låstes för uppdateringsnotisen.
- Meddelanderutan (primitiven): form enligt facit — ingen kontur, 4 px vänsterkant i intent-färg, tonad bakgrund, rubrik semibold i intent-färg, neutral brödtext, NY `actions`-slot som renderar knappraden högerställd under texten, kryss-knappen indragen till rubrikens linje. Regel kodad i primitiven, inte per sida: `error`/`warning` accepterar inget kryss; `info`/`success` får det. Rollmappningen (`alert`/`status`) oförändrad. `prefers-contrast: more` tänder kontur i full intent-färg. Komponent-tokens för kontur-nyanserna tas bort eller märks oanvända — inga nya tokens uppfinns.
- Sektionsfel: konsumerar `actions`-slotten. Vid chunk-fel (den klass chunk-laddningsfel-modulen redan känner igen) visas "Ladda om" som hel-omladdning; "Försök igen" (reset + invalidate) visas bara för andra fel. Rubrik och text enligt copy-domarna.
- Appfel-sidan: formen enligt facit uttryckt i inline-stilar utan tokens eller primitiv-import — designvillkoret att sidan renderar utan stylesheet består. Centrerad på vit botten.
- Copy (ADR-121 beslut 7) följer formen och skrivs i skivorna, inte i förväg: varje sträng bär problem/orsak/lösning, aldrig "Något gick fel", aldrig "Okänt fel", "Ladda om" aldrig "Uppdatera", rubrik utan avslutande punkt, brödtext en till två korta meningar. Inga långa streck i användarsynlig text.
- Styrande yta: DESIGN-SYSTEM-SPEC § 21 kompletteras med den låsta formen (yttrappa för notisfamiljen, samma form som laddtrappan fick) och kryss-regeln; ORDLISTA får "Notistrappan" och familjens klassnamn. Görs i en egen skörde-skiva, som segment-passet gjorde.
- Testklass: bannern och chunk-läget har noll databeteende och stannar i webbläsarbeteende-klassen (hermetik-självtestet fäller dem i acceptance). Chunk-bannerns PLACERING (under h1 i skalet) kan inte nås oautentiserat — verifieras i acceptance-klassen på en fixtur-vy, med fallback till visual-baslinje om självtestet fäller; skivan bär båda vägarna.

### Testbeslut

- Externt beteende, aldrig implementationsdetaljer: live-regionen är tom och tar ingen plats i normalläget; notisen syns när signalen kommer; fokus stjäls inte; omladdning sker först vid val; "Inte nu" döljer och återkomst kräver ny version; chunk-läget ersätter info-läget och lämnar ingen tom alert-region; kryss finns aldrig på fel/varning.
- Befintliga skarvar återanvänds: webbläsarbeteende-sviterna för uppdateringsbannern och chunk-laddningsfel (uppdateras i samma skiva som flippen — test-konsument-svepet är eget AC), axe-sviten för primitiver (notisen och meddelanderutan läggs till på primitiv-sidan), acceptance-tester som redan läser MessageBox-rollmappningen.
- Promoverings-grinden per ADR-103 B4: ariaSnapshot-par per yta, variant-läget FÖRE flippen mot promoverad yta EFTER, fäller på varje skillnad. Facit-bilderna är regressionsstöd, inte spec; ytan med `bilder: []` har referenserna som bevisform (ADR-102 B5).
- Regressionslåset: visual-baslinje för notisen och den flyttade chunk-bannern tas EFTER Marcus godkännande, aldrig före. Ingen befintlig baslinje bär bannern.
- Bevis-loopen i varje utförar-uppdrag: skärmdump → jämför mot facit → lista skillnader → fixa; spåret bilagt i PR:en.
- Copy prövas som text i testerna (exakta strängar), så en regression i ordval fångas mekaniskt.

### Utanför omfattningen

- Bekräftelsedialog med osparad-detektion (egen tråd; ny mekanik från noll).
- Toast/snackbar-komponent: finns inte i appen och beslut 5 säger att fel aldrig blir toast; bekräftelser SOM toast är en framtida fråga, inte denna.
- Sentry-kedjans inkoppling (T151) — skarven mot chunk-felets klassning noteras, byggs inte här.
- Förberedelseskärmens och laddtrappans ytor (ADR-112/113) — annan familj.
- Hem-vyns Bevakningsrad (ORDLISTA: uttryckligen inte en notis).

### Estimat

Nio skivor: referenser+flipp av notisen · chunk-bannerns flytt och kortning · offline-beskedet · meddelanderutan + sektionsfel · appfel-sidan · copy-svepet över familjen · härdning (axe, kontrast, reduced-motion, test-konsument-svep) · Marcus QA/stämpling + rivning · spec/ORDLISTA-skörden. Plus QA-kort. Storleksklass: medel (tre till fyra dagar AFK-arbete, två HITL-grindar).

### ADR-koppling

- ADR-121 (styrande: notistrappan, beslut 1–7; § 8 avgjord här per Marcus 2026-08-21, bokförs som Update på ADR:n i spec-skörde-skivan).
- ADR-047 § Amendering 2026-08-13 (mekanismen: autoUpdate + onNeedReload, omladdningsbeslutet hos användaren, rollmappning) — orörd.
- ADR-078 beslut 4 (layouthopp förbjudet), ADR-102/103/104 (facit, promovering, godkännande-kanal), ADR-113 (förlagan för yttrappa-formen i spec).
- Ingen ny ADR minats: formvalet är under baren (Marcus-låst konvergens, reversibelt i kod, inte överraskande med ADR-121 som kontext).

### Ytterligare anteckningar

- Båda prototyp-passen ligger i PR #1682 (notisen) och #1685 (meddelandefamiljen); prototyp-routen är `/dev/notis-prototyp`, notisens växlare syns med `?variant=1` på valfri vy i DEV.
- Varv 3 i meddelandefamiljen (tonal kontur) provades och förkastades av Marcus — bilden k03 är iterationsresa, inte facit. Varje skiva läser manifestets `not`-fält, inte bildkatalogen.
- Öppna kanter som står i manifestet och tas i skivningen: notisens läge vid ≥1280 px (dockad mot vyporten i facit; dockning mot innehållskolumnen är alternativet), full bredd minus marginal på mobil.
- Dev-serverns filbevakning i huvudkatalogen kräver polling (mätt av S108 och S109 samma dag) — utföraren som verifierar i dev-server ska veta det.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-granskning gjord mot båda manifesten (s109-uppdateringsnotis-konvergens + s109-meddelandefamiljen-konvergens) med sökvägarna utskrivna i PR:en — aldrig mot minne eller bildkatalog
- [ ] #6 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter), ADR-103 B4
- [ ] #7 Test-konsument-svepets träffyta bilagd (grep-svep över testfiler som konsumerar ytan) och alla träffar uppdaterade i samma skiva som sin flip
- [ ] #8 Inga nya design-tokens uppfunna; inga hårdkodade färger utanför appfel-sidan (vars inline-form är designvillkoret)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BOKFÖRING 2026-08-22 (S109, bokföringspass). Kortet hade ingen notes-sektion; denna är den första — ingen befintlig text ersattes.

ALLT BYGGE ÄR KLART. Samtliga tolv bygg- och beslutsskivor i familjen är stängda:
- TASK-285.1 Uppdateringsnotisen promoverad · 285.2 Meddelanderutan får familjeformen · 285.3 Appfel-sidan i familjeformen
- TASK-285.4 Spec- och ORDLISTA-skörden · 285.5 Chunk-bannern under sidans rubrik · 285.6 Offline-beskedet som överlagrad notis
- TASK-285.7 Sektionsfel vid chunk-fel säger Ladda om · 285.8 Copy-svepet · 285.9 Härdning (axe, kontrast, reduced-motion, konsumentsvep)
- TASK-285.10 Marcus granskar skarpa mot facit och stämplar · 285.13 Beslut: vem äger "Ladda om" vid chunk-krasch
- TASK-285.11 — Done 2026-08-22 (rivning av prototyp-substratet + visual-baslinjen som regressionslås)

DET SISTA LÅSET ÄR SATT. TASK-285.11:s AC #4 stod öppen ända till idag därför att en baslinje-födsel hade skrivit om personlistans pixel-lås mitt under TASK-283:s pågående formändring. Den väntan är betald: workflow_dispatch-run 32591327919 födde 16 linux-baslinjer, landade som PR #1811 (merge 918b6576, 2026-08-22T19:11:16Z). Notisfamiljens ytor däri: notis-visual, offline-visual och chunk-banner-visual (två linux-bilder var). Meddelanderutan bär i stället ett aria-lås — dess spec har noll toHaveScreenshot och fyra toMatchAriaSnapshot, och de åtta referenserna är sha256-innehållslåsta i facit-manifestet (check-facit invariant d). Mekaniken står utskriven på TASK-285.11.

MARCUS HAR GRANSKAT FORMEN OCH STÄMPLAT — båda manifesten (s109-uppdateringsnotis-konvergens och s109-meddelandefamiljen-konvergens) bar godkand: marcus FÖRE rivningen, verifierat ur filerna av 285.11 och grindat av check-facit.sh.

VAD SOM ÅTERSTÅR: TASK-285.12 — QA: Notisfamiljen, manuell vandring genom alla meddelanden, mobil och desktop, skärmläsare. Den är AVSTÅDD PÅ MARCUS BESLUT 2026-08-22, verbatim: "Nej inget Q&A, skit i det. Gör klart allt de andra."

KORTET STÅR DÄRFÖR ÖPPET MED AVSIKT — INTE AV GLÖMSKA. Att sätta en PRD till Done medan dess QA-skiva är oöppnad är ett PÅSTÅENDE om att arbetet är verifierat i drift. Det påståendet är inte sant här. Arbetet är byggt, granskat av Marcus på FORMEN, och stämplat — men ingen har vandrat igenom det i ANVÄNDNING. För just denna familj är avståndet extra tydligt: axe-svep och kontrastmätningar (285.9) är mekaniska mätningar av en yta, inte en skärmläsarvandring genom ett verkligt meddelandeflöde. Prod-incidenten samma dag visade samma skillnad från andra hållet — allt grönt i repot medan Lotta såg 50 av 559 personer.

Kortet stängs när QA-skivan antingen körts eller formellt avskrivits av Marcus som en egen, bokförd handling — inte som en sidoeffekt av att bygget blev klart.
<!-- SECTION:NOTES:END -->
