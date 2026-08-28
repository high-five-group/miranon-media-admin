---
id: TASK-18
title: 'PRD: Eventsidan till S73-facit'
status: Done
assignee: []
created_date: '2026-07-21 07:56'
updated_date: '2026-08-24 15:46'
labels:
  - ready-for-human
  - wontfix
  - intentionally-unchecked
dependencies: []
ordinal: 40000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Eventsidan är idag en tunn infosida med tre undervyer — men Lottas verkliga eventarbete (bekräfta anmälningar, jaga betalningar, se vilka som bor över, pricka närvaro, förstå gruppens erfarenhet, minnas vad som hänt) sker utanför appen: i Airtable-interfacet och i mailen. Session 73 konvergerade sidan i 72 iterationer till ett låst facit (Marcus: "Jag är nöjd med eventdetalj-sidan nu efter 72 iterationer") där HELA eventets arbetsyta bor på en sida. Dagens sida gör inte det, och de write-operationer arbetet kräver finns inte.

### Lösning

Sidan byggs om till facitet, uppifrån och ned: topprad med eventets identitet → check-in-ingång → Åtgärder → Om eventet med sömlöst Ändra-läge → Beläggning med verklig sammansättning och Ändra → Anmälda deltagare som arbetskö (Obekräftade äldst först, bekräfta enskilt eller alla, personkort med lugn metayta, bor över-markering) → Betalningar med inline-arbetsyta (kryss, notering, påminnelse) → Närvaro-registret → Gruppdynamik (erfarenhetsmix, kurshistorik, motiveringar) → Anteckningar (tidsstämplad ström). Write-vertikalerna byggs så att Lotta UTFÖR arbetet i appen — inte bara ser det.

### Användarberättelser

1. Som administratör vill jag se eventnamnet som sidrubrik med EventKey och tid kvar, så att jag alltid vet vilket event jag arbetar i.
2. Som administratör vill jag se eventets uppgifter som lugna etikett-och-värde-rader grupperade utanför korten, så att sidan läses som en handling och inte ett formulär.
3. Som administratör vill jag trycka Ändra och få fält på exakt samma rader utan att något hoppar, så att redigering känns som samma sida och inte en ny.
4. Som administratör vill jag se nuvarande värde dämpat bredvid fältet när jag ändrar, så att jag ser vad jag ändrar från.
5. Som administratör vill jag att Spara faktiskt uppdaterar eventet (typ, ort, datum, status, platser), så att vanliga rättelser aldrig kräver Airtable.
6. Som administratör vill jag se beläggningen uppdelad i Reserverade, via formulär, Manuellt tillagda och Medföljande med en segmenterad mätare, så att jag ser VARFÖR det är fullt — inte bara att det är det.
7. Som administratör vill jag se väntelistan som egen rad utanför platstaket, så att kön aldrig blandas ihop med beläggningen.
8. Som administratör vill jag ändra max antal platser, reserverade och manuellt tillagda med samma sömlösa morf, så att kapacitetsjustering är ett handgrepp.
9. Som administratör vill jag ha eventets handlingar som vänsterställda rader överst (manuell anmälan, utskicken, skriv ut), så att det vanligaste alltid är närmast handen.
10. Som administratör vill jag se en tydlig check-in-ingång, så att dörr-arbetet har en självklar startpunkt när dess sida byggs.
11. Som administratör vill jag lägga till en manuell Anmälan på en egen sida i samma formspråk som appens övriga formulär, så att telefonanmälningar landar rätt utan Airtable.
12. Som administratör vill jag se klickbara summeringsrader (bekräftelser, påminnelser, eventinfo, bor över), så att jag kan filtrera deltagarlistan på det som kräver arbete.
13. Som administratör vill jag se Obekräftade äldst först och Bekräftade senast först i egna grupper, så att kön alltid visar den som väntat längst.
14. Som administratör vill jag skicka bekräftelsen direkt från personkortet och att anmälan då blir Bekräftad, så att kön kan tömmas därifrån.
15. Som administratör vill jag kunna bekräfta alla obekräftade i ett drag med en kontrollfråga, så att stora inflöden inte kräver kort-för-kort-arbete.
16. Som administratör vill jag se personkortets metayta lugn — anmäld dag och tid på en rad, endast utförda åtgärder, historiken hos Miranon Media — så att korten går att skanna.
17. Som administratör vill jag markera vilka som bor över i ett kryss-läge med live-räknare, så att logistiken kan prickas av i farten.
18. Som administratör vill jag se dags-att-skicka-signalen för eventinfo och kunna se och styra schemalagt auto-utskick per event, så att tvåveckors-mailet aldrig glöms.
19. Som administratör vill jag se röda saknas-deltan för anmälningsavgift och slutbetalning, så att betalläget syns utan att öppna något.
20. Som administratör vill jag öppna en arbetsyta där varje betalning är en egen rad med kryss, så att avgift och slutbetalning prickas av var för sig.
21. Som administratör vill jag skriva en notering per betalning, så att "betalar via faktura vecka 32" bor där den hör hemma.
22. Som administratör vill jag skicka en påminnelse per obetald rad via mail med betalningen i ämnesraden, och se påminnelsehistoriken under personen, så att jagandet är spårbart.
23. Som administratör vill jag se betalningsdeadline som statusmärke, så att brådskan syns direkt.
24. Som administratör vill jag se närvaro-registret som rader gånger sessioner med total närvaro i procent, så att genomförda event kan läsas som ett register.
25. Som administratör vill jag se gruppens erfarenhetsmix som mätare med nivågrupper, så att jag vet vilken grupp Roger möter.
26. Som administratör vill jag öppna en nivågrupp och se varje persons kurshistorik i kursfärgerna, så att erfarenheten blir konkret per deltagare.
27. Som administratör vill jag läsa deltagarnas motiveringar med Läs mer, så att gruppens varför finns på sidan.
28. Som administratör vill jag skriva tidsstämplade anteckningar i en ström (nyast överst) med författare, så att eventets minne bor på eventet.
29. Som administratör vill jag att anteckningar under och efter eventets dagar märks Under respektive Efter automatiskt, så att strömmen bär sin egen tidslinje.
30. Som administratör vill jag att skrivrutan växer med texten upp till ett tak, så att längre anteckningar inte direkt tvingar rull-i-ruta.
31. Som administratör vill jag nå alla flöden (morf, accordions, flikar, kryss, arbetsytor) med enbart tangentbord, så att sidan fungerar oavsett styrsätt.
32. Som skärmläsaranvändare vill jag att grupper, flikar, accordions och statusar annonseras med begripliga namn, roller och tillstånd, så att arbetskön är lika användbar utan skärm.
33. Som administratör vill jag att förhöjd kontrast, reducerad rörelse och utskrift respekteras, så att systeminställningarna gäller även här.

### Implementationsbeslut

1. S73-facitet är designfacit: bilagans skärmdumpar är bedömningsunderlaget; prototypkodens lägen kan återuppstå ur git via facit-trailen. Prod-sidan renderar EXAKT lika.
2. Alla skrivningar går genom operations-mönstret: server-side-byggd fält-shape, deny-by-default och fält-allowlist per operation (skapa-event-kontraktets form). EF-utökningar deployas per M4-principen först med sin UI-konsument — varje write-skiva bär sin egen operation.
3. Ny operation uppdatera-event: typ, ort, start- och slutdatum, status, max antal platser, extra platser, manuella platser. Skrivbarheten live-verifieras mot basen INNAN allowlist-posten låses (en referens kan inte bevisa frånvaro — L294).
4. Ändra-morfarna: geometri-paritet MÄTS (0 px-diff i DOM), likbredda fält per formulär, "ändrar från"-mönstret med dämpat nuvarande värde (L295).
5. Beläggningens innehållsmodell mappar basen 1-till-1: Reserverade = Extra platser · via formulär = Källa tom · Manuellt tillagda = Manuella platser · Medföljande = Källa "+1". Segmenterad mätare med streck-markörer; Väntelista-raden alltid med, utanför taket, aldrig ett segment.
6. Väntelisteplatsens event-koppling är additivt bas-fält (dagens koppling är hårdkodad till ett enda event) — staging först.
7. Hantera-flödet: skicka-bekräftelse-operation per Anmälan där SERVERN skickar bekräftelsemailet och flippar Status till Bekräftad i samma operation (ORDLISTA-semantiken: Bekräftad betyder att bekräftelsen är skickad). Bekräfta alla är bulk med kontrollfråga — confirm-grind på varje massmutation.
8. Bor över: additivt kryssfält per Anmälan; kryss-läget i EN kolumn (mobilbredds- och träffyte-motivet ur konvergensen); listans bor över-summering härleds alltid — aldrig ett eget lagrat räknefält.
9. Betalningar: ny operation för slutbetalning (anmälningsavgiften har sin befintliga operation) + notering per betalning. Basen har idag EN notering och EN påminnelse-tidsstämpel per Anmälan — per-betalnings-behovet löses I BASEN (additiva fält per ADR-063, aldrig lappat i klienten); påminnelsehistoriken tas ur additiva fält eller maillogg-härledning — vägvalet låses i skivan efter bas-verifiering. Betalningsdeadline-REGELN verifieras mot basen/Lotta innan facit-antagandet (start minus 14 dagar) låses.
10. Deltagar-shapen utökas: Inskickad (med klockslag), de tre skickad-tidsstämplarna, antal genomförda event, medföljande-kopplingen och motiverings-fälten (fälten FINNS i basen — K65-rättelsen; ren shape-utökning).
11. Närvaro-registret är LÄSNING: attendance-shapen utökas till person gånger session med närvaropoäng-mappning; registerformen visas för genomförda event, lugnt läge annars. Närvaro-WRITE hör till check-in-sidan (utanför detta kort).
12. Gruppdynamik: shape-utökning med Erfarenhetsbadge per deltagare + kurshistorik ur Deltaganden, renderad i kalender-legendens kursfärger (samma semantiska tokens som lista-PRD:n). Kända luckor i badge-underlaget (T16) redovisas som de är — designas inte bort.
13. Anteckningar: ADDITIV Anteckningar-tabell i basen (Marcus-kvitterat vägval 2026-07-21; Airtable record comments föll på attribueringen — API-skrivningar bokförs på token-ägaren, inte på den inloggade). Författare = inloggad användare. Läs- och skriv-operation. ÖVER-BAR-BESLUT: egen ADR mintas vid skivan och refereras härifrån — aldrig inline.
14. Eventinfo-signalen: dags-att-skicka härleds ur tvåveckorsgränsen mot skickad-tidsstämpeln; schemalagt-datum och opt-out som additiva bas-fält med UI-slotten (badge eller auto-kryss) ALLTID reserverad och placerad utanför den interaktiva raden (L303). Själva utskicks-MOTORN ingår inte (se Utanför omfattningen).
15. Chevron-regeln: den tidigare ingen-chevron-regeln RIVS ÖPPET (Marcus-kvitterad konsekvens av K25-prövningen, 2026-07-21); chevron betyder "raden leder vidare"; Mer-menyns rader får chevroner i koherens-skivan här.
16. Hover-plattans grammatik på interaktiva rader (K56/K72-formen); kontinuerligt drag- och pekartillstånd bor i ref (L300); interaktivt bor aldrig i interaktivt (L303).
17. Manuell anmälan-sidan byggs skarp i FK-formklassen mot befintlig anmälnings-operation med Källa "Manuell" och server-satt event-koppling; validering + bekräftelseläge per facit.
18. Anmäld-radens länkmål: anmälans egen sida är INTE konvergerad — länken får ett belagt mål (befintlig yta) eller renderas olänkad tills sidan finns; avgörs öppet i skivan, aldrig tyst.
19. Auto-grow-skrivrutan: innehållsstyrd höjd med tak och intern rull; fast treradig reserv där webbläsarstödet saknas; lyfts till TextArea-primitiven som variant vid bevisat delbehov.
20. Optimistiska mutationer per etablerat femkomponents-mönster där interaktionen kräver det (kryss, enskild bekräftelse); bulk är pessimistisk med kontrollfråga.
21. Tokens: treskikts-disciplinen; sage-gröna är redan skarp sedan K49.
22. Leveransen NYSKRIVS; prototypkod absorberas aldrig. Prototyp-substratets RIVNING (alla fyra prototypsidor + växlaren) är familjekedjans SISTA skiva och bor i detta kort — beroende av alla tre PRD-kortens skivor.

### Testbeslut

Två befintliga skarvar (familje-skarv-kvittensen 2026-07-21), inga nya skarv-klasser. api-skarven: varje ny operation och shape-utökning kontraktstestas i api-sviten per det etablerade write-vertikal-mönstret — deny-by-default-bevis, allowlist-avgränsning (otillåtet fält fälls), lyckad väg mot staging med restore-teardown, bulk-gränser; testa kontraktet, aldrig implementationen. e2e-/axe-skarven: flödena mot facit — morfens nollhopp bevisas renderat, arbetsköns filter/accordions/bekräfta-flöden, betalningskryssens live-härledning, anteckningsströmmen; befintliga detalj-, betalnings- och närvaro-e2e-flöden skrivs om i samma skiva som ersätter deras ytor; nya mönster får axe-0; renderad verifiering före granskning (L245/L246). Ingen unit-skarv. Förebilder i kodbasen: Hem-vyns e2e-svit, skapa-event-kontraktstesterna, axe-runnern.

### Utanför omfattningen

- Check-in-SIDAN och närvaro-write (egen konvergens → egen PRD; här byggs endast ingången).
- Anmälans egen sida (ej konvergerad; endast länkmåls-beslutet ovan).
- Eventinfo-auto-utskickets MOTOR (schemaläggnings- och utskicksmekaniken — eget framtida beslut, trolig egen ADR).
- Print-CSS (öppen facit-fråga) samt tomläges- och felformer på detaljsidan (ej konvergerade).
- T79 (publicerings-kontraktet) och bas-maximeringen (T16).
- Prod-deploy av EF:er och bas-fält (separat auktoriserad handling).

### Estimat

11 skivor + rivningsskiva + QA-kort: (1) sidstruktur + topprad + Om eventet med uppdatera-event-vertikalen (L) · (2) Beläggning: innehållsmodell + morf + vänteliste-kopplingen (L) · (3) Åtgärder + check-in-ingång + chevron-rivningen + Mer-koherensen (M) · (4) Anmälda deltagare: struktur, summeringsrader, flikar, accordions, personkort (L) · (5) hantera-flödet: bekräftelse-vertikalen + Bekräfta alla (M) · (6) bor över: bas-fältet + kryss-läget (M) · (7) Betalningar: arbetsytan + slutbetalnings- och noterings-vertikalen + påminnelseformen (L) · (8) närvaro-registret: shape + register-UI (M) · (9) Gruppdynamik: shape + mätare + historik + motiveringar (L) · (10) Anteckningar: tabellen (egen ADR) + vertikalen + strömmen (L) · (11) manuell anmälan-sidan skarp (M) · (12) familjens prototyp-rivning (S; beroende av alla tre PRD-kortens skivor). Cirka 3,5–4 sessioner. ADR-073-partitionering: write-vertikaler och rena UI-skivor är delvis disjunkta — Marcus partitionerar vid batch.

### ADR-koppling

ADR-055/057 (router-context-DI + lager-oberoende) · ADR-016 (optimistiska mutationer) · ADR-049 (betalfälts-valet; avgifts-operationen finns) · ADR-066 (write-kontraktets form: server-side shape, allowlist-SSOT, idempotens-klassen) · ADR-063 (ALLA bas-ändringar additiva; resolution i basen) · ADR-064 (kursfärgerna) · ADR-045 (axe-baseline) · ADR-058 (fitness-audit) · ADR-050/061 (staging först; miljö-isolation) · ADR-072/017 (persist/poll-arvet). Över-bar-beslut som mintas SEPARAT vid sina skivor: Anteckningar-tabellens form; eventuell auto-utskicksmotor om den väcks.

### Ytterligare anteckningar

- Beslutstrail: S73-doket Del 3–6 (konvergensen K1–K72) + S73-bilagan (skärmdumpar + trail + öppna bokföringar). PRD-kraven ligger även som kommentarer i prototypkoden vid respektive K-steg — referens vid skivning, aldrig källa.
- Design-review-grinden är L220-loopen MOT FACIT per UI-skiva; hanterad-definitionen är låst (Bekräftad betyder bekräftelsen skickad, K53).
- Cross-PRD-beroenden: lista-PRD:ns bor över-rad beror på skiva 6 här; skapa-PRD:ns kapsel-återbruk beror på lista-PRD:ns primitiv-skiva.
- Kortet fött i Session 74 ur S73-konvergensen; matar ADR-073-batch-driften.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S73-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [ ] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [ ] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Beslutat av Code på Marcus-mandat 2026-08-24 (GO i klartext), S112. Motiv: superseded av S93-facit-familjen (TASK-145/146/147), se WONTFIX-kommentaren för belägg. Divergens noterad öppet (ADR-086): mandatets premiss för TASK-18 (till skillnad från TASK-18.20) saknar en lika explicit citation — beläggkedjan för föräldra-PRD:t är indirekt (18/19 barnkort Done + S93-grillningens dokumenterade arkitekturbyte), inte en enskild rad som citerar 'ersätter task-18'. Prövad och hållande, men källmärkt svagare än 18.20:s belägg.

OBOCKAT MED AVSIKT: kortet förkastat (wontfix, Marcus-mandat 2026-08-24) — superseded av S93-facit-familjen; AC/DoD avser arbete som aldrig ska utföras.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-24 14:40
---
WONTFIX 2026-08-24 (S112, Marcus-mandat): PRD:n superseded av S93-facit-familjen TASK-145 (Eventsidans konsolidering), TASK-146 (Bilage-fundamentet) och TASK-147 (Åtgärds-sidan) — grillad samsyn S93 (tasks/sessions/archive/2026-08/2026-08-02-session-93.md rad 967, 'K27-anden faller, öppet') river den skrivvägsmodell TASK-18 byggde mot S73-facitet. 18 av 19 barnkort redan Done (grep -H "^status:" backlog/tasks/task-18.*.md, 2026-08-24); enda kvarvarande barnet TASK-18.20 förkastas i samma pass med explicit citat ur TASK-145 ('Detta kort ersätter task-18.20', rad 138). Ingen ny kod skriven; PRD:t stängs som obsolet.
---
<!-- COMMENTS:END -->
