---
id: TASK-309
title: >-
  PRD: Bilagespårets promovering till prod — eventinnehåll, platser, en
  renderare, skapandet av bilagorna
status: To Do
assignee: []
created_date: '2026-08-23 13:53'
labels: []
dependencies: []
ordinal: 561000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Lotta kan i dag förhandsgranska bekräftelsebilagan och deltagarinformationen i en prototyp som bara finns i utvecklingsläge, mot ett påhittat event. Knappen "Skapa" ger en tillfällig fil som försvinner — inget hamnar i eventets dokumentlista, inget kan bifogas från Åtgärds-sidan, och ändrar hon en text efteråt vet ingen att den genererade filen är föråldrad. Texterna hon redigerar sparas ingenstans: de lever i webbläsarens minne tills sidan laddas om. Kvittot som skickas vid betalning är fortfarande det gamla (pdf-lib-ritade) trots att den nya mallen är granskad och godkänd. Roger och Lotta har ingen yta där standardtexterna per Event × Eventtyp eller platsernas uppgifter kan underhållas.

### Lösning

Den godkända genereringsvyn promoveras till skarp yta på Dokument-sidan, kopplad till riktiga event. Standardtexter bor i basen som Eventinnehåll (en rad per Event × Eventtyp) och Platser (Rönninge seedad); varje event bär sin egen kopia när Lotta ändrar något, med "spara som platsens standard". "Skapa" renderar bilagan server-side via DocRaptor från de Marcus-granskade HTML-mallarna, lägger filen i eventets lagring och en rad i Bilagor — den syns direkt i dokumentlistan och i Åtgärds-sidans bilageväljare. Ändras en text bilagan läste visas den som INAKTUELL med ett val att skapa om; ingenting regenereras tyst. Kvittot byter till samma renderare och samma mall-disciplin. Mer-sidan får två rader, Eventinnehåll och Platser, där standardtexterna underhålls. Allt deployas till prod och verifieras av Marcus i den skarpa appen.

### Användarberättelser

1. Som Lotta vill jag öppna genereringsvyn för ett riktigt event ur eventväljaren, så att bilagan fylls med eventets faktiska datum, plats och texter.
2. Som Lotta vill jag se varje block som hamnar i bilagan, med standardtexten förifylld, så att jag vet exakt vad deltagaren kommer att läsa.
3. Som Lotta vill jag ändra ett block för just detta event utan att standarden för nästa event påverkas, så att ett undantag förblir ett undantag.
4. Som Lotta vill jag kunna spara platsens adress, parkering, transport eller kläder som platsens standard när jag fyllt i dem, så att nästa event på samma plats får dem automatiskt.
5. Som Lotta vill jag redigera agendan rad för rad — punkt, valfri tid, kryss för meditation — så att agendan aldrig tolkas ur fritext.
6. Som Lotta vill jag se vilka block som är tomma och utelämnas ur bilagan, så att en tom sektion aldrig försvinner tyst.
7. Som Lotta vill jag förhandsgranska bilagan som riktig PDF innan jag skapar den, så att jag kan kontrollera formen.
8. Som Lotta vill jag trycka "Skapa bekräftelsebilaga" och få filen sparad på eventet, så att den finns i dokumentlistan och kan bifogas.
9. Som Lotta vill jag att ett andra tryck under pågående skapande ignoreras, så att jag inte får dubbla filer.
10. Som Lotta vill jag att den skapade bilagan öppnas i ny flik när den är klar, så att jag slipper leta efter den.
11. Som Lotta vill jag se bilagan i eventets dokumentlista med namn, storlek, datum och vilken mall den kommer från, så att jag känner igen den.
12. Som Lotta vill jag att en bilaga markeras INAKTUELL när någon text den bygger på har ändrats, så att jag aldrig skickar en fil som säger något annat än basen.
13. Som Lotta vill jag kunna skapa om en inaktuell bilaga med ett tryck och få samma post ersatt, så att Åtgärds-sidans bilageval inte bryts.
14. Som Lotta vill jag att en bilaga aldrig regenereras automatiskt, så att filen deltagaren fick i sin inkorg förblir den jag ser.
15. Som Lotta vill jag välja den skapade bilagan i Åtgärds-sidans bilageväljare, så att bekräftelsemailet bär rätt fil.
16. Som Lotta vill jag att kvittot som skickas vid betalning ser ut som den granskade kvittomallen, så att kunden får ett professionellt kvitto.
17. Som Lotta vill jag att förhandsgranskningen av kvittot visar exakt det som skickas, så att det inte finns två kvitton.
18. Som Roger vill jag underhålla standardtexterna per Event × Eventtyp på Mer-sidan, så att en textändring slår igenom på kommande event utan att röra redan skapade bilagor.
19. Som Roger vill jag underhålla platsernas uppgifter på Mer-sidan, så att Rönninge och hyrda lokaler har rätt adress, parkering och transport.
20. Som Lotta vill jag att sista betalningsdag förifylls fjorton dagar före start men kan ändras per event, så att bilagan följer samma regel som anmälningarna.
21. Som Lotta vill jag att genereringsvyn ser ut exakt som den prototyp jag godkände, så att inget jag lärt mig under granskningen går förlorat.
22. Som Marcus vill jag att prototypens växlar och flaggor rivs helt efter promoveringen, så att det inte finns två versioner av ytan.
23. Som Marcus vill jag att den promoverade ytan bevisas identisk med prototypens form före flippen, så att promoveringen är mätt och inte antagen.
24. Som Marcus vill jag att ett facit låses efter mitt godkännande, så att framtida ändringar mäts mot den godkända formen.
25. Som Marcus vill jag att mallarna i repot aldrig kan glida isär från det som deployas, så att det jag granskat är det som renderas.
26. Som Marcus vill jag att DocRaptor-nyckeln aldrig passerar chatten eller klienten, så att den förblir hemlig.
27. Som Marcus vill jag att staging renderar gratis vattenstämplade testdokument och prod skarpa, med samma nyckel, så att kostnaden bara uppstår i prod.
28. Som Marcus vill jag att prod-deployen går via deploy-skriptet med bucket-kontroll, så att ingen Storage-beroende funktion deployas mot tomhet.
29. Som Marcus vill jag att basens nya tabeller och fält är läsbara i Airtable utan app, så att basen förblir en förstklassig leverabel.
30. Som Marcus vill jag att prod-schemat ändras först efter mitt GO per tabell, så att ingen agent skapar prod-struktur på eget bevåg.
31. Som framtida utvecklare vill jag att klienten aldrig bygger HTML eller når renderaren direkt, så att lagergränsen håller.
32. Som framtida utvecklare vill jag att alla tre dokumentklasserna går genom en och samma renderare, så att en mall-ändring har ett ställe att landa.

### Implementationsbeslut

Styrande ADR: ADR-125 (modell, datamodell, renderare, topologi, promovering) — besluten återges inte här, kortet pekar.

- Datamodellen per ADR-125 § 2: tabellerna Eventinnehåll, Agendapunkter, Platser; arton "(bilagetext)"-fält och Plats-länk på Eventplanering; Mall + Källhash på Bilagor. Staging först via Meta-API-skript (staging-låst); prod efter Marcus GO per tabell. Fält-ID:n bokförs i datamodell-referensen för båda baser i samma skiva.
- Uppslag event → eventinnehåll via Event (source) × Typ, ingen länk. Sista betalningsdag = Startdatum − 14 dagar när eventets fält är tomt.
- Inaktualitet härleds: Källhash = SHA-256 över kanoniskt serialiserad ifyllnadsdata skrivs vid generering; adaptern beräknar dagens hash vid listning och markerar avvikelse. Regenerering ersätter filen och uppdaterar samma Bilagor-rad.
- Renderaren: en delad modul i EF-lagret, Eta med explicit autoEscape, Deno-inlining av CSS/typsnitt/bilder utan DOM, synkront DocRaptor-anrop med test-flagga ur ENVIRONMENT, en retry på 5xx/timeout. Samma produktionsnyckel i båda miljöernas secrets (Marcus sätter dem via sin egen terminal).
- Mallarnas hemvist: förlagan orörd under docs; byte-identisk committad kopia i EF-lagret skriven av ett synk-skript och vakad av en CI-paritetsgrind. Bundling primärt via static_files i config.toml; fallback-stegen avgörs av skiva 0:s minimaltest i staging (API-bundling, maskinen saknar Docker) och bokförs i ADR-125 § Updates innan byggskivorna startar.
- EF-topologi: generate-event-attachment bär båda mallarna (parameter mall) med preview-gren (utkast, ADR-124) och persisterande gren (Storage + Bilagor-rad + Mall + Källhash + rensaUtkast) samt ersätt-läge; preview-receipt och send-receipt-email byter till renderaren; receipt-pdf och test-docraptor-render rivs. Klienten skickar eventId + mall + ev. ersatt-id, aldrig HTML.
- Klienten: genereringsvyn promoveras per ADR-103 B2 — ariaSnapshot-par före flipp, DEV-gaten och variant-parametern rivs, prototypmappen töms, listvyns handkopierade klasser ersätts av DokumentYta:s komponenter, inaktuell-badge och "skapa om" i listan, riktigt event via eventväljaren, platser/innehåll/kopior via adaptern och datakällan. Plattformens dubbelklicksskydd (aria-disabled + vakt) behålls.
- Mer-sidan: två rader, Eventinnehåll (standardtexter inkl. agenda per Event × Eventtyp) och Platser, i verktygsgruppen bredvid Dokument.
- Seed: Platser med Rönninge; Eventinnehåll med sju rader varav Resor i medvetandet 1 × Utbildning fylls verbatim ur förlagorna.
- Prod-deploy via fas4-prod-deploy.sh (Marcus), med TASK-308:s bucket-kontroll; Vercel bygger klienten vid landning. Röktest i prod av Marcus.
- Facit låses efter Marcus godkännande av den promoverade ytan (ADR-074/ADR-102): manifest + bilder i sessionens bilage-katalog.
- Prototyp-utdrag som bär beslut (typform för agendan, verbatim ur prototypen): `{ text: string; tid: string; meditation: boolean }` per rad, Dag 1/Dag 2 som separata listor — Agendapunkter-tabellen speglar exakt detta (Text, Tid, Meditation, Dag, Ordning).

### Testbeslut

Två befintliga skarvar, inga nya:

1. Staging-API-skarven (Playwright-projektet api-staging) för allt server-side: en POST som ska ge en PDF i Storage, en Bilagor-rad med Mall och Källhash, och rensat utkast; en andra POST med ersätt-id som ska ge samma rad uppdaterad; listning som ska markera inaktuell efter en fältändring och inte före; kvitto-EF:erna som ska returnera en DocRaptor-renderad PDF (text sökbar, inbäddat typsnitt) i stället för pdf-lib. Förebilder: de befintliga staging-testerna för generate-event-attachment, preview-receipt och utkast-vägen. Purge-policyn bär redan utkast-targeten; nya staging-rader i Eventinnehåll/Platser/Agendapunkter får egen target.
2. Acceptance-skarven (browser mot dev-server) för klientflödet: välj event → ändra ett block → skapa → raden syns i listan → ändra block igen → INAKTUELL → skapa om → samma rad. Plus ADR-103 B4:s ariaSnapshot-par (variant-läge före flipp mot promoverad yta efter) som fäller på varje skillnad.

Lagervakten (api-pure, ADR-057) uppdateras så att den fortsatt bevisar att klienten aldrig når Storage eller renderaren direkt. Paritetsgrinden för mallkopian får egen testsvit i båda riktningar (identisk → grönt, en byte skiljer → rött). Testa externt beteende: vad som finns i Storage och i basen efteråt, vad listan visar — aldrig hashens interna serialisering.

### Utanför omfattningen

- Gemensamma bilagor (räckviddsfilter, ADR-118) — oförändrade.
- Kvittots innehåll och form — redan landade (TASK-304, TASK-306); här byts bara renderaren.
- Cavolini-typsnittet (licens) — ersatt per fontstrategin, bundlas aldrig.
- Supabase-migration av datalagret (separat spår, ADR-063).
- T171:s pseudonymiseringsregler för repot — egen tråd.
- Automatisk regenerering — avvisad per beslut (ADR-125 § 3).
- Persongenererade dokument utöver kvittot (Dokumentklass C i övrigt).

### Estimat

Tio skivor plus QA-kort: en minimaltest-skiva (XS), en datamodell-skiva (M), en renderare-skiva (L), två EF-bytesskivor (M, S), en klient-skiva för skapandet och inaktualiteten (L), en Mer-skiva (M), en promoveringsskiva (M, HITL-granskning), en prod-deploy-skiva (S, HITL), en facit-skiva (S, HITL) och QA (HITL).

### ADR-koppling

- ADR-125 — styrande: modell, datamodell, renderare, topologi, promoveringsväg.
- ADR-119 — extern HTML/CSS-motor, generering en gång per event; beslut 6 löses in här.
- ADR-124 — utkast-vägen för förhandsgranskning, oförändrad.
- ADR-103 — promoveringsformen (B2–B4) som skiva 8 följer ordagrant.
- ADR-074 / ADR-102 — facit-låsning efter godkännande.
- ADR-057 — lagergränsen: klienten når datalagret bara via adaptern.
- ADR-063 — basen som förstklassig leverabel (datamodellens läsbarhet).
- ADR-118 — räckvidd; beslut 1 ersatt av ADR-125 (beslut 4).

### Ytterligare anteckningar

- Förkrav utanför repot, i ordning: DocRaptor-nyckel i staging-secret (innan skiva 3 mäts skarpt), prod-tabeller efter GO (innan skiva 9), DocRaptor-nyckel i prod-secret (innan skiva 9), prod-bucketens kontroll (TASK-308, AC #1).
- Skarv-kvittens: togs av orkestreraren på Marcus mandat 2026-08-23 ("Du har mandat att bestämma tekniska saker") — redovisad i resume-rapporten; Marcus kan styra om.
- Kostnad: varje skarp rendering i prod kostar ett DocRaptor-dokument; testdokument i staging är gratis.
- S108:s sessionsdok Del 2 § D bär grillningens fulltext; Del 3–13 konvergensvarven.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #6 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön
<!-- DOD:END -->
