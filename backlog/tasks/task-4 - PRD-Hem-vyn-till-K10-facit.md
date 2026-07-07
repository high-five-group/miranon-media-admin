---
id: TASK-4
title: 'PRD: Hem-vyn till K10-facit'
status: To Do
assignee: []
created_date: '2026-07-07 08:30'
labels: []
dependencies: []
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Hem fick sin FK-struktur i TASK-1, men när Lotta och Marcus lever med vyn svarar den inte mot hur de vill att hemskärmen ska kännas: en topprubrik tar plats utan att säga något, hälsningen ropar med utropstecken och en teknisk uppdatera-knapp, anmälningslistan visar bara fem rader med skiljelinjer och säger inte vilket event en anmälan gäller utan klick, radklicket landar i en undervy i stället för på eventets sida, och varje bakgrundsuppdatering syns som blink och hopp i innehållet. Session 55 itererade designen i tio steg tillsammans med Marcus tills varje detalj satt — det låsta facitet (K10) är kvitterat med orden att prod-vyn ska se EXAKT likadan ut. Dagens Hem gör inte det.

### Lösning

Hem byggs om till det låsta facitet: en lugn skärm-centrerad innehållskolumn utan topprubrik, hälsning med namnet utan utropstecken och en Mina sidor-knapp, Nästa event med dagar-kvar-märke, ort, långdatum och en tunn beläggningsstapel, Obetalda avgifter som bara det stora antalet, och en rullbar zebra-lista med ~25 senaste anmälningar där varje rad bär namn, eventets identitet (kursnamn · ort · datum) och hur länge sedan anmälan kom in — och där radklicket landar på eventets sida. Appens versionsnummer står diskret nere till vänster på datorn. Alla bakgrundsuppdateringar är helt osynliga: siffror och rader ändras bara när något faktiskt hänt, utan blink, hopp eller snurror.

### Användarberättelser

1. Som administratör vill jag att Hem öppnar som en lugn centrerad kolumn utan topprubrik, så att innehållet får plats och blicken landar direkt på det viktiga.
2. Som administratör vill jag hälsas med "Hej {namn}" utan utropstecken första gången per arbetspass och därefter bara "{namn}", så att appen känns personlig utan att tjata.
3. Som administratör vill jag ha en Mina sidor-knapp i hälsningskortet, så att min personliga yta har en självklar ingång när den byggs ut.
4. Som administratör vill jag se nästa event med kursnamn, ort och långdatum, så att jag omedelbart vet vad som händer härnäst.
5. Som administratör vill jag se hur många dagar som är kvar till nästa event som ett tydligt märke, så att tidshorisonten syns på en sekund.
6. Som administratör vill jag se "X av Y platser bokade" med en tunn stapel, så att beläggningen går att läsa utan att räkna.
7. Som administratör vill jag kunna klicka var som helst på Nästa event-kortet och landa på eventets sida, så att jag når handläggningen i ett klick.
8. Som administratör vill jag se antalet obetalda anmälningsavgifter stort och ensamt, så att jag direkt ser om något kräver åtgärd.
9. Som administratör vill jag se de senaste ~25 anmälningarna i en rullbar lista direkt på Hem, så att jag ser inflödet utan att lämna översikten.
10. Som administratör vill jag att varje anmälningsrad visar namn, vilket event anmälan gäller (kursnamn · ort · datum) och hur länge sedan den kom in, så att jag ser sammanhanget utan att klicka.
11. Som administratör vill jag kunna klicka på en anmälningsrad och landa på eventets sida, så att jag ser eventets helhet där anmälan hör hemma.
12. Som administratör vill jag att en anmälan utan event visas med "Utan event", så att en saknad uppgift syns i stället för att gömmas.
13. Som administratör vill jag att listan tonar varannan rad utan skiljelinjer, så att raderna är lätta att följa utan att kännas som ett rutnät.
14. Som administratör vill jag att kortet med nya anmälningar markeras med konturfärg och en varningsikon, så att det som väntar på hantering sticker ut ur översikten.
15. Som administratör vill jag att översikten uppdaterar sig själv helt osynligt — inga blinkningar, hopp eller snurror — så att innehållet bara ändras när något faktiskt hänt.
16. Som administratör vill jag se ett lugnt laddläge enbart vid kall start, så att jag ser att appen arbetar första gången — och aldrig därefter.
17. Som administratör vill jag se appens versionsnummer diskret nere i hörnet på datorn, så att jag kan ange version vid support.
18. Som administratör vill jag nå hela listan och alla klickytor med enbart tangentbord, inklusive rullningsområdet, så att appen fungerar oavsett styrsätt.
19. Som skärmläsaranvändare vill jag att kort, lista och knappar annonseras med begripliga namn och roller, så att översikten är lika användbar utan skärm.
20. Som administratör vill jag att förhöjt kontrastläge, reducerad rörelse och utskrift respekteras, så att mina systeminställningar gäller även på Hem.

### Implementationsbeslut

1. K10-facitet är designfacit (sessionsdok Session 55 Del 12 + skärmdumps-bilagorna): prod-Hem ska rendera EXAKT lika. Referens vid design-review: facit-skärmdumparna (desktop + mobil) och K10-koden i git-historiken via worktree på återupplivnings-commiten (Del 12 bär hashen).
2. Layout: EN skärm-centrerad innehållskolumn (600 px desktop); INGEN topprubrik på Hem — skalet får per-vy-avstängning av header-raden; headerns öde app-övergripande är shell-spårets beslut (klass C) och röres inte här. Innehållet nedflyttat; mobil behåller dagens form med samma kolumn. Botten-tabbaren ORÖRD på alla breakpoints.
3. Versionsmärkning "Miranon Media Admin v{version}" fast nere till vänster, endast desktop; versionen injiceras vid bygge ur paketmanifestet (B-NYTT2) — aldrig hårdkodad.
4. Hälsningen: "Hej {namn}" vid första renderingen per session, därefter "{namn}" (sessions-state; B2). Uppdatera-knappen utgår (B5): poll-lagret bär färskheten (ADR-017 med erratum; borttagningen bokförs öppet mot dess §2-not). Mina sidor-knapp (secondary) tar platsen som visuell platshållare — ytan är klass D och byggs inte här.
5. Kortrubriker INNE i korten, text-xl semibold, sentence case, mörka. Den olagrade globala h1–h6-basregeln flyttas till @layer base (B-NYTT) så komponent- och utility-färger vinner kaskaden framåt.
6. Nästa event (temporalt nästa, primär-tint): dagar-kvar som VIT pill topp-höger med formerna "71 dagar kvar" / "1 dag kvar" / "Idag", härledd ur eventets startdatum; metagrupp med eventnamnet (helkorts-klickyta via stretched link till eventets sida — korrekt länksemantik, inga nästlade länkar), ort med kartnålsikon, långdatum med kalenderikon; "X av Y platser bokade" (caption) + tunn beläggningsstapel inom tokensystemet.
7. Obetalda anmälningsavgifter: BARA antalet, text-3xl semibold.
8. Nya anmälningar att hantera: koppar-kontur runt kortet + koppar-varningsikon vid rubriken; inline-rullbar lista (~25 rader, maxhöjd, centrerad rundad scrollmarkör, luft mot innehållet); ZEBRA varannan rad utan avdelarlinjer; rad = namn (semibold) / kursnamn · ort · kortdatum / relativ tid ("för 2 tim sedan"); radklick → EVENTETS sida (B1 — ÖPPEN REVIDERING av TASK-1 beslut 4/G1a där målet var anmälda-vyn); rad utan event-koppling renderas olänkad med "Utan event".
9. B4-datavägen: eventets identitet på raden (kursnamn/ort/startdatum) hämtas via klient-side-join på anmälans event-koppling mot den redan hämtade eventlistan — samma poll-lager, INGEN ny EF, ingen bas-ändring, read-only-kontraktet orört. ÖPPEN REVIDERING av Session 55 Del 12-notens "läsmodell-/EF-utökning" (disk-verifierad: datat når redan klienten via de två befintliga läs-hämtningarna). Eventnummer-pillen (klass B 4) FÖLL — klartext vann i facitet.
10. B3 osynlig uppdatering: stale-while-revalidate — tidigare data renderas orörd under tyst bakgrundshämtning (placeholderData-mekaniken), ALL visuell hämtnings-indikation bort; ärligt undantag: kall första-laddning visar laddläge. Persist-cache (t.ex. persistQueryClient) är bokförd SENARE förfining och ingår inte.
11. B6: rullningsområdets tillgänglighet — fokuserbar scrollregion med tangentbordsåtkomst och begripligt tillgängligt namn.
12. Tokensystemets tre lager respekteras: inga hårdkodade färger; eventuella nya tokens endast i semantik-/komponentlagret; primitivlagret röres inte.
13. Leveransen skrivs NYSKRIVEN genom leverans-grindarna; prototypkod absorberas aldrig (throwaway-kontraktet) — K10 är enbart facit och referens.

### Testbeslut

EN skarv (skarv-kvittensen, Marcus 2026-07-07): den befintliga e2e-/axe-sviten. Testa externt beteende, aldrig implementationsdetaljer: hälsningens sessions-beteende (Hej {namn} → {namn}), Nästa event-kortets innehåll och klickmål, Obetalda-antalet, anmälningsradernas event-identitet + relativa tid + klickmål (eventets sida), "Utan event"-fallbacken, zebra-listans tangentbordsnåbarhet, versionsraden matchar manifest-versionen, osynlig uppdatering (ingen synlig indikation vid omhämtning; kallstartens laddläge undantaget — akta lastkänsliga laddläges-fönster, TASK-3-fyndet). Axe-0-baseline på Hem via den befintliga baseline-runnern; berörda befintliga assertions uppdateras i SAMMA skiva som ändringen; route-mock där data-beroende assertions annars blir sköra. Ingen api-skarv (ingen EF-ändring) och ingen unit-skarv (joinens resultat bevisas i browsertestet). Vid visuella krav gäller renderad verifiering — computed-style/skärmdump, aldrig enbart källkoden (L246). Förebilder i kodbasen: hem-e2e:n, shell-e2e:n och axe-runnern.

### Utanför omfattningen

- Senaste aktivitet-ytan: klass D — xAPI-innehållet hör till befintliga Fas 6.5; facit-designen (bottenlinjerad kantlös logg, aktör + händelse, historik-länk), positionsbeslutet och B7 (Mer-vägen på mobil/platta) matas in när den fasen byggs. Öppet deklarerad konsekvens: bred desktop visar inte loggen förrän Fas 6.5.
- Mina sidor-YTAN (klass D; knappen i hälsningskortet är platshållare).
- Shell-spåren (klass C): headerns öde app-övergripande, scrollbar-gutter-kortkandidaten, devtools-gaten — egna kort/landningar.
- Persist-cache-förfiningen av kallstarten (Del 11-optionen).
- Samlade anmälningslistan under Mer behåller sitt nuvarande mönster; om B1-radklicket (eventets sida) ska linjeras även där är ett eget senare beslut.
- Mörkt tema och brödsmulor (sedan tidigare registrerade utforskningar).
- Write-operationer, nya EF:er och bas-ändringar (kortet är read-only mot befintliga läs-EF:er).

### Estimat

5 skivor, S/M/M/M/S (+ QA-kort per substrat-mönstret): (1) infra-paret @layer base-flytten + versionskällan (S), (2) Hem-strukturen — header-bort på Hem, kolumnen, hälsningskortet med Mina sidor + B2 + B5 (M), (3) Nästa event + Obetalda till facit (M), (4) anmälningslistan till facit — B4-joinen, B1-radklicket, zebran, B6-tillgängligheten (M), (5) B3 osynliga uppdateringen (S). Cirka 1,5 sessioner.

### ADR-koppling

Styrande i området: ADR-055 (data via router-context-DI), ADR-057 (lager-oberoende; joinen bor ovanpå adaptern, aldrig förbi den), ADR-017 med erratum (poll-lagret; B5-borttagningen bokförs mot §2-noten), ADR-045 (axe-baseline-grinden), ADR-061 (miljö-isolation, dev mot staging), ADR-058 (arkitektur-fitness-audit vid leverans). Inga nya ADR:er påkallade — allt föll under baren vid Session 55-prövningen (designbeslut bor i facitet/kortet).

### Ytterligare anteckningar

- Beslutstrail: sessionsdok Session 55 Del 12 (facit-specen + byggkravs-slutlistan B1–B7 + 2 nya), Del 3 (klassningen A–D), Del 11 (osynlighets-beviset); skärmdumps-bilagorna i sessionsmaterialet (facit desktop + mobil samt resan k1–k10).
- Design-review-grinden är L220-loopen MOT FACIT: granskningen jämför renderad prod-vy mot facit-skärmdumparna sida vid sida; ingen UI-skiva stängs på enbart gröna tekniska grindar.
- Arbetsdisciplin ur Session 55-skörden: facit-specen och byggkravs-slutlistan avprickas rad för rad före varje granskning (L245); visuella egenskaper verifieras renderat (L246); beteende-kravet osynlig uppdatering är granskningsbar design, inte bara teknik (L247).
- Kortet är fött ur tråd T65 (Hem-designiterationen) — andra hel-kedje-körningen (/to-prd → /to-issues → /do-work) och matar två-aktörs-ADR:ns drift-metrik.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT K10-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [ ] #6 Facit-avprickningen: varje berörd facit-/byggkravspunkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
<!-- DOD:END -->
