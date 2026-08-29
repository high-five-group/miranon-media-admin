---
id: TASK-338
title: >-
  PRD: Platsbundna delade bilagor — räckvidden byggs ut till tre kombinerbara
  axlar (Familj · Event · Plats) enligt ADR-125 § 1
status: To Do
assignee: []
created_date: '2026-08-29 08:00'
labels: []
dependencies: []
ordinal: 610000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Lotta har dokument som hör till en PLATS, inte till ett event eller en familj: parkeringsbilagan och sushimenyn för Rönninge (Rogers förlagor i exempeldokument-mappen, bokförda i tråd T153). I dag kan en delad bilaga bara gälla "en familj" eller "alla event", så platsdokumenten går inte att dela — Lotta måste ladda upp samma PDF för hand på varje Rönninge-event, och glömmer hon ett event saknas parkeringsinformationen i utskicket. Grillningen S108 Del 2 § D (frågorna 4 och 9) beslutade redan att räckvidden är ett filter över tre kombinerbara axlar — Familj · Event · Plats — och det står i ORDLISTA § Räckvidd och ADR-125 § Beslut 1. Beslutet blev aldrig kod: appen, Edge Functions och basen implementerar fortfarande ADR-118:s "exakt EN räckvidd" (Event / Kurstyp / Alla event), och ADR-118 saknar en Updates-rad som bokför att den är ersatt. Marcus mandat 2026-08-29: "Gör som du föreslår … riktigt bra för Lotta … branschledande … inga genvägar."

### Lösning

Lotta laddar upp parkeringsbilagan EN gång, väljer "Delat dokument" och sätter Plats = Rönninge. Därefter finns den automatiskt på varje event som hålls i Rönninge — i eventets dokumentlista, i Åtgärds-sidans bilageväljare och därmed i utskicken — men inte på Falköping- eller Gotland-eventen. Sushimenyn kan smalnas ytterligare: Familj RIM + Plats Rönninge betyder "RIM-event i Rönninge". Axlarna är valfria och kombineras med OCH; inga axlar satta = alla event. Dialogen visar i klartext vad valet betyder innan hon bekräftar ("Gäller: alla event i Rönninge"), listan visar det som en badge, och en felklassad bilaga kan hon rätta med "Ändra räckvidd" i räckviddsläget utan att ladda upp om filen. Formen följer branschmönstret för regelbaserad tilldelning (filter med valfria villkor, förhandsvisad effekt), inte en lista av specialfall.

### Användarberättelser

1. Som Lotta vill jag ladda upp parkeringsbilagan en gång och ange att den gäller platsen Rönninge, så att jag slipper ladda upp den på varje Rönninge-event.
2. Som Lotta vill jag att ett nytt event i Rönninge automatiskt får platsens dokument i sin dokumentlista, så att inget event saknar parkeringsinformation.
3. Som Lotta vill jag att ett event i Falköping INTE visar Rönninge-dokumenten, så att fel information aldrig går ut.
4. Som Lotta vill jag kunna kombinera familj och plats (RIM-event i Rönninge), så att sushimenyn bara följer med de event där den gäller.
5. Som Lotta vill jag att "alla event" fortfarande finns som val (inga axlar satta), så att husets generella dokument fungerar som i dag.
6. Som Lotta vill jag se i klartext vad mitt räckviddsval betyder innan jag sparar ("Gäller: RIM-event i Rönninge"), så att jag inte behöver förstå begreppet "filter".
7. Som Lotta vill jag se på varje delad bilaga i listan vilken räckvidd den har (badge: "Rönninge", "RIM · Rönninge", "Alla event"), så att jag förstår varför den ligger på just detta event.
8. Som Lotta vill jag kunna ändra räckvidden på en redan uppladdad delad bilaga, så att en felklassning inte tvingar mig att radera och ladda upp igen.
9. Som Lotta vill jag att Åtgärds-sidans bilageväljare automatiskt listar platsens dokument för eventet, så att bekräftelsemailet får rätt bilagor utan handpåläggning.
10. Som Lotta vill jag att de två delade dokument jag redan laddat upp fortsätter fungera efter ombyggnaden, så att inget försvinner ur utskicken.
11. Som Lotta vill jag att platslistan i dialogen är samma som under Mer → Platser, så att en ny plats bara behöver läggas till en gång.
12. Som Lotta vill jag kunna göra allt detta med tangentbord och skärmläsare, så att ytan är lika tillgänglig som resten av appen (11/11/11).
13. Som Marcus vill jag att basen förblir läsbar: en rad i Bilagor ska visa "Gemensam · Familj RIM · Plats Rönninge" i vanliga kolumner, så att räckvidden går att granska i Airtable utan appen (ADR-063).
14. Som Marcus vill jag att befintliga rader migreras med räkneverifiering och att prod-schemat bara rörs efter mitt GO per tabell (ADR-125 § 8), så att inget bryts i drift.
15. Som Marcus vill jag att ADR-118 öppet bokför att den ersatts, så att nästa läsare inte bygger vidare på en riven modell (ADR-083).
16. Som framtida produkt (Passionslyftet) vill jag att räckviddsfiltret är generellt (valfria axlar, OCH-kombination), så att nya axlar kan läggas till utan omdesign.

### Implementationsbeslut

Alla beslut nedan är orkestrerarens, på Marcus mandat 2026-08-29, och bokförs här för granskning vid QA.

**Datamodellen (Airtable, additivt — ADR-063):** Bilagor.Räckvidd får en ny option "Gemensam" som betyder "filter-räckvidd: axlarna gäller, tomma axlar begränsar inte". Axlarna bärs av befintliga Kursfamilj/Kursnivå (oförändrade) plus en ny länk Bilagor.Plats → Platser (högst en plats; adaptern och EF:en validerar, Airtable kan inte tvinga det) och ett lookup-fält Platsnamn (Platser.Namn) så både appen och Lotta läser namnet utan extra uppslag. Befintliga rader med Räckvidd "Kurstyp" respektive "Alla event" migreras till "Gemensam" (Kursfamilj/Kursnivå behålls som de står; "Alla event" får inga axlar). Options "Kurstyp"/"Alla event" lämnas kvar oanvända tills slutgenomlysningen (ADR-063 § Updates) — borttagning är ett Marcus-beslut, bokförs i defektregistret. Dokumentklass förblir ortogonal (ADR-118 beslut 4 gäller vidare). Ingen ny tabell.

**Matchningen (EF, en hämtning, OCH i kod):** get-event-attachments hämtar (a) eventets egna rader och (b) ALLA rader med Räckvidd = Gemensam i en enda hämtning, och matchar (b) i kod mot eventets Kursfamilj, Kursnivå (tom-nivå-regeln: tom nivå på bilagan = hela familjen, oförändrad) och Plats (länkens record-ID, aldrig namnet — samma skäl som ADR-125 § 8 om Ort-drift). Matcharen är en ren funktion i _shared med egen enhetstestsvit; dagens tre filterByFormula-mängder rivs. Skälet: mängden gemensamma rader är liten och bunden (tiotals), Airtables formelspråk kan inte jämföra länk-ID:n utan hjälpfält, och en ren funktion är den enda formen som går att bevisa deterministiskt utan staging. Räckviddsläget (Delade dokument) listar Räckvidd = Gemensam.

**Skrivvägen:** upload-attachment/finalize-attachment-upload tar rackvidd ∈ {Event, Gemensam}; vid Gemensam är kursfamilj, kursniva (bara med kursfamilj) och plats (Platser-record-ID, existenskontrollerat mot Platser-tabellen — samma vaktklass som generate-event-attachments ersatt-guard) alla valfria; noll axlar är giltigt. Legacy-värdena "Kurstyp"/"Alla event" accepteras under en övergångsperiod och mappas till Gemensam (installerade PWA-klienter kan skicka dem tills de uppdaterats) — bokfört som rivningsskuld. Ny EF update-attachment-scope ändrar räckvidden på en befintlig gemensam bilaga (ägar-/klass-vakt: endast Räckvidd ≠ Event, endast uppladdade filer); registreras i field-allowlists med deny/allow-test enligt sub-fas-mönstret.

**Domän och klient:** AttachmentScope blir EVENT | GEMENSAM (läsvägen mappar legacy-värden defensivt till GEMENSAM). Attachment-modellen får plats: { id, namn } | null. RackviddBadge komponerar texten ur axlarna, Gunilla-läsbar: "Alla event" · "RIM · Nivå 1" · "Rönninge" · "RIM · Rönninge" · "RIM · Nivå 1 · Rönninge" ("Steg"-etiketten via befintlig stegEtikett). RackviddsDialog: två radioval — "Bara detta event" / "Delat dokument — gäller flera event"; under det senare tre valfria Select: Familj (default "Alla familjer"), Steg (bara för nivåbärande familj, default "Alla steg"), Plats (default "Alla platser", listan ur samma läsväg som Mer → Platser). En sammanfattningsrad uppdateras live: "Gäller: alla event" / "Gäller: RIM-event i Rönninge" / "Gäller: alla event i Rönninge". Husets primitiver (RadioGroup/Select), hideLabel-mönstret och fokusordningen behålls. "Ändra räckvidd" läggs som åtgärd på gemensamma rader i räckviddsläget (samma dialog, förifylld); ur ett events kontext förblir gemensamma bilagor oredigerbara (ADR-118 beslut 3 gäller vidare).

**Facit:** manifestet tasks/sessions/bilagor/s108-dokumentytan/facit.json (ostämplat, godkand null) beskriver ytan "Dokument-ytan /mer/dokument — räckviddsläget (Delade dokument) och eventväljaren" med fyra bilder — det är den yta dialogen och badgarna bor i. Ombyggnaden ändrar ytan; ny baslinje tas EFTER Marcus godkännande (ADR-074), aldrig före.

**Migrationen:** staging först (schema + rader, räkneverifierat med filterByFormula före/efter, samma form som TASK-275:s migrering), sedan prod som eget HITL-steg: skript med --kontrollera/--utfor, Marcus GO i klartext för tabellen Bilagor (ADR-125 § 8). De två dokument Marcus laddade upp 2026-08-29 som "Alla event" omklassas till Plats Rönninge via "Ändra räckvidd" i appen — inte via basen.

**Dokumentation:** ADR-118 får § Updates som bokför ersättningen (S108 Del 2 § D → ADR-125 § Beslut 1 → detta PRD); ADR-125 får § Updates med lagringsformen (Gemensam + axlar, matchning i kod); ORDLISTA § Räckvidd/Gemensam bilaga uppdateras med värdet "Gemensam" och badge-formerna; data-model.md § Bilagor med fält-ID:n; tråd T153 pekar hit.

### Testbeslut

Testa externt beteende: "ett Rönninge-event ser platsens dokument, ett Falköping-event gör det inte, RIM+Rönninge smalnar rätt, inga axlar = alla event" — aldrig hur filtret är byggt. Tre skarvar, alla befintliga: (1) EF-conformance mot staging i get-event-attachments.staging.test.ts (utökas med Plats-fall och kombinationer, deduplicering, rackvidd/plats i svaret) plus write-vägen i upload-attachment.staging.test.ts; (2) en ny ren enhetstestsvit för matcharen i tests/api (deterministisk, ingen staging — tom-nivå-regeln, tom plats, ID-matchning, legacy-mappning); (3) acceptance med MSW-fixturvärld i dokument-rackviddsval.acceptance.test.ts (dialogens tre axlar, sammanfattningsraden, badge-texterna, "Ändra räckvidd") och atgarder-bilageval-send.acceptance.test.ts (platsbilaga i väljaren), med axe-svep och tangentbordsvandring per befintligt mönster. Deny/allow-testet för den nya EF:en enligt sub-fas-mönstret. Förebilder: TASK-275.2/275.3:s sviter.

### Utanför omfattningen

Räckvidd för event-mallade dokument (klass B — de fylls ur Platser-texten, ADR-125 § 4) · hörlursinfo/ögonmask/kursbeskrivning ur T153 (andra dokumentklasser, egna kort) · borttagning av options "Kurstyp"/"Alla event" ur basen (slutgenomlysningen) · rivning av legacy-mappningen i skrivvägen (egen skuldpost när PWA-klienterna bevisligen uppdaterats) · filter/sök i räckviddsläget · skapa-flödets ombyggnad (eget PRD ur research-passet 2026-08-29).

### Estimat

7 skivor: 1 staging-schema+migrering (S) · 2 EF read/write + matchare (M) · 3 klient: domän, badge, dialog med tre axlar (M) · 4 Ändra räckvidd — EF + UI (M) · 5 dokumentation ADR-118/125, ORDLISTA, data-model, T153 (S) · 6 prod-migration HITL (S, Marcus GO) · 7 QA-vandring (Marcus). Klassning per skiva sätts i /to-issues.

### ADR-koppling

ADR-125 § Beslut 1 (modellen — styrande), ADR-118 (ersatt i beslut 1/4/5, gäller vidare i beslut 2/3), ADR-063 (basen som leverabel), ADR-057 (lagervakten: EF äger matchningen), ADR-115 (Kursfamilj/Kursnivå), ADR-083 (prosa som påstår mekanism), ADR-086 (premisser prövas), ADR-074 (baslinje efter godkännande). ADR-bar prövad: lagringsformen är en implementationsdetalj under ADR-125:s redan fattade modellbeslut — bokförs som ADR-125 § Updates, ingen ny ADR.

### Ytterligare anteckningar

Forensiken 2026-08-29 (S113, Sonnet-agent, verifierad av orkestreraren) visade att ADR-125 § 1 aldrig nådde koden: enum, EF-schema, hämtning, dialog och bas implementerar ADR-118 rakt av. Beslutet är alltså inte nytt — PRD:n bygger det som redan kvitterats. Marcus röktest-observation 2026-08-29 verbatim: "Just nu har Lotta ingen möjlighet att ladda upp dessa dokument som delade dokument, för de går inte att platsbinda liksom. Jag vill att hon ska slippa ladda upp dessa manuellt för alla event de kör hemma i rönninge."
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #5 Deny/allow-test grönt för varje ny eller ändrad EF-operation (sub-fas-mönstret, field-allowlists)
- [ ] #6 Lagervakten grön — matchning och validering bor i EF/_shared, aldrig i klienten (ADR-057)
<!-- DOD:END -->
