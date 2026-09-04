---
id: TASK-346
title: >-
  PRD: Lottas betalningsflöde — inbetalningar, global inkorg, kvitton som jobb,
  Swish-import
status: To Do
assignee: []
created_date: '2026-08-30 18:41'
labels: []
dependencies: []
ordinal: 637000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Lotta tar emot betalningar för kurser via Swish, Bankgiro och Plusgiro. En lördagsmorgon ser hon i banken att sex personer swishat och två betalat via giro — för kanske åtta olika event. I dag går hon till sina papper, letar upp varje person, avgör vilket event och vilken betalning (anmälningsavgift 1 000, slutbetalning 1 500 eller hela 2 500) och skriver "bet". Appen hjälper inte: avprickningen börjar i eventet (event → åtgärder → panel → person), beloppet och betalsättet skrivs för hand i en dialog utan felmeddelanden, ett skickat kvitto syns bara som en textrad i aktivitetshistoriken, PDF:en sparas aldrig, och åtta betalningar för åtta event är åtta navigeringar. Mätt: sex klick till kvittoknappen, sju klick plus ett handskrivet belopp per kvitto, cirka 143 klick och tjugo handskrivna belopp för en hel kurs. Basen vet inte vad någon ska betala (priser är fritext) och kan inte säga vem som har betalat vad.

### Lösning

Betalningen blir arbetsenheten. En global yta **Betalningar** (Hem-kort + sida under Mer) visar alla öppna betalningar över alla event; Lotta söker på namn, telefon eller belopp, trycker på det belopp banken visar (härledda knappar: `1 000 · anmälningsavgift`, `2 500 · allt`, `annat…`), väljer betalsätt och datum och trycker Enter — inbetalningen sparas utan mail. När hon registrerat lördagens åtta trycker hon en gång på **Skicka 8 kvitton**: klicket kvitteras direkt, kvittona genereras och skickas i bakgrunden av en jobbmotor, raderna tickar *skickat*, Hem säger "8 kvitton skickade". Facken Anmälningsavgift/Slutbetalning härleds ur summan inbetalt mot eventets numeriska pris (eller ett avtalat pris per anmälan) — Lotta väljer aldrig fack. Kvittot avser exakt en inbetalning, sparas som PDF (Miranon Medias verifikation), syns på inbetalningens rad med Visa och Skicka igen, och har ett kreditkvitto som spegel vid återbetalning. Swish-rapporten kan importeras: raderna matchas mot öppna betalningar på telefon, namn och belopp, dubbletter känns igen på bankens referens, och listan bekräftas som en batch. Samma formulär nås från Åtgärds-sidan, anmälans detaljvy och personkortet. Betalningsdata bor i Supabase Postgres; basen bär en app-skriven spegel så att Lottas Airtable-vyer, automationer och rollups fungerar orörda. Alla utskick får så småningom samma jobbmotor.

### Användarberättelser

1. Som Lotta vill jag se alla öppna betalningar över alla event på ett ställe, så att jag slipper leta i papper och gå in i varje event.
2. Som Lotta vill jag söka på namn, telefonnummer eller belopp, så att jag hittar rätt person på det jag ser i banken.
3. Som Lotta vill jag trycka på det belopp banken visar (1 000, 2 500 eller annat) i stället för att skriva det, så att jag inte skriver fel.
4. Som Lotta vill jag kunna skriva "2 500,00" precis som banken visar det, så att appen inte tyst vägrar.
5. Som Lotta vill jag att appen räknar ut om det är anmälningsavgiften, slutbetalningen eller allt som betalats, så att jag aldrig behöver välja fack.
6. Som Lotta vill jag att betalsättet är förvalt till det jag använde senast och datumet till i dag, så att en registrering är tre handlingar.
7. Som Lotta vill jag att Enter sparar utan att skicka något, så att jag kan registrera alla åtta först och granska innan kvittona går.
8. Som Lotta vill jag trycka en gång på "Skicka 8 kvitton" och gå vidare, så att jag inte behöver vänta på att åtta PDF:er genereras.
9. Som Lotta vill jag kunna registrera och skicka kvitto i ett tryck när det bara är en betalning, så att tisdags-Swishen inte kostar två steg.
10. Som Lotta vill jag se per rad om kvittot är skickat, väntar eller misslyckades och varför, så att ett halvt utfall aldrig ser helt ut.
11. Som Lotta vill jag att Hem visar hur många betalningar som är öppna, förfallna och hur många kvitton som väntar på att skickas, så att inget glöms.
12. Som Lotta vill jag kunna se och skicka om ett kvitto från raden, så att jag kan svara "vad skickade vi till Bengt?" utan att be Bengt vidarebefordra.
13. Som Lotta vill jag kunna skicka om ett kvitto till en annan adress (Roger, en arbetsgivare), så att kopian når den som behöver den.
14. Som Lotta vill jag sätta ett avtalat pris på en anmälan när jag gett rabatt, så att "allt betalt" stämmer och kvittot blir rätt.
15. Som Lotta vill jag se "saknas 500 kr" när någon betalat ett udda belopp, så att jag vet vad som återstår.
16. Som Lotta vill jag radera en felregistrerad inbetalning innan kvittot gått, så att ett slarvfel inte kostar något.
17. Som Lotta vill jag makulera en inbetalning med skäl efter att kvittot gått, så att sanningen rättas utan att kvittot försvinner ur bokföringen.
18. Som Lotta vill jag registrera en återbetalning och skicka ett kreditkvitto, så att avbokningar sköts i appen och inte i Rogers fakturasystem.
19. Som Lotta vill jag importera min Swish-rapport och få förslag på vilka rader som hör till vilka anmälningar, så att en hel helgs betalningar blir några bekräftelser.
20. Som Lotta vill jag att en rad som redan importerats hoppas över synligt, så att jag kan importera samma rapport två gånger utan dubbletter.
21. Som Lotta vill jag att osäkra matchningar visar kandidaterna och omatchade rader får sökfältet, så att importen aldrig gissar åt mig.
22. Som Lotta vill jag göra kolumnmappningen för min bank en gång och få den sparad, så att nästa import är ett klick.
23. Som Lotta vill jag registrera en betalning från Åtgärds-sidan, anmälans detaljvy och personkortet också, så att jag kan utgå från eventet eller personen när det passar.
24. Som Lotta vill jag se personens betalningar på personkortet, så att "Cecilia swishade — vad har hon öppet?" har ett svar.
25. Som Lotta vill jag att betalningspåminnelsen fortsätter fungera som i dag, så att de som inte betalat får sin påminnelse ur samma sanning.
26. Som Lotta vill jag att gamla skulder på tidigare event finns under ett eget filter, så att de inte skymmer lördagen.
27. Som Lotta vill jag kunna registrera en betalning på en obekräftad anmälan och få frågan om jag vill bekräfta också, så att den som swishar direkt efter formuläret inte fastnar.
28. Som Lotta vill jag se allt jag gjort i aktivitetshistoriken (registrerade, makulerade, skickade), så att jag kan följa upp.
29. Som Lotta vill jag jobba på iPad med numeriskt tangentbord och stora rader, så att lördagen går lika bra i soffan.
30. Som Lotta vill jag få fel förklarade i text vid fältet, så att jag aldrig står med en grå knapp och undrar.
31. Som Lotta vill jag att appen kan stängas mitt i ett kvittojobb utan att något tappas eller dubbleras, så att jag kan lägga ifrån mig iPaden.
32. Som Roger vill jag att varje inbetalning finns som en post med belopp, datum, betalsätt och kvittonummer, så att bokföringen har sina verifikationer.
33. Som Roger vill jag att kvittot bär betalningsdatumet och att kreditkvittot hänvisar till originalet, så att verifikationskedjan håller.
34. Som deltagare vill jag få ett kvitto för det jag faktiskt betalade, med rätt datum och belopp, så att jag kan visa det för min arbetsgivare.
35. Som Marcus vill jag att Lottas Airtable-vyer, automationer och rollups fungerar orörda, så att basen förblir en förstklassig leverabel.
36. Som Marcus vill jag att nya ytor är avstängda i prod tills jag slår på dem, så att Lotta aldrig möter en halvfärdig yta.
37. Som Marcus vill jag att alla utskick kan flytta till samma jobbmotor senare, så att vi bygger motorn en gång.

### Implementationsbeslut

Alla beslut är grillade i S113 Del 11 (tretton beslut) och verifierade adversarialt (sju blockerare B1–B7, vågordning). ADR-128 och ADR-129 mintas som egna skivor och refereras; besluten nedan är kortets sammanfattning.

**Datamodell (beslut 1, 7, 12).** Ny domänpost *Inbetalning*: anmälan (record-ID + ögonblicksbild av namn, event, belopp), belopp (positivt eller negativt för återbetalning), betalsätt (Swish/Bankgiro/Plusgiro/Historik), betalningsdatum, typ (inbetalning/återbetalning), status (aktiv/makulerad + skäl), bankreferens (dubblettnyckel vid import), kvittolänk, skapad av/när. Facken Anmälningsavgift/Slutbetalning härleds: avgift klar när summan når anmälningsavgiftens pris, allt klart när summan når hela priset, oavsett ordning och antal poster; föreläsning har ett pris utan fack. Pris per event × typ som numeriska fält i basen (bredvid fritexten som bilagemallarna läser — fritexten byter aldrig typ); frivilligt *Avtalat pris* per anmälan (förvalt = eventets pris). Härledningen är universell från dag ett efter full betalnings-backfill (Närvarande ⇒ betalt, Mottagen ⇒ betalt, belopp = dåvarande pris, betalsätt Historik, datum okänt); "Lottas lista" är facit för avvikelser när den kommer.

**Lagring (beslut 11 i grillningen; ADR-128).** Inbetalningar, kvittoledger och jobbtabeller bor i Supabase Postgres (nya tabeller, RLS, skrivning via Edge Functions med service_role — samma väg som aktivitetsloggen). Kvittonumret `MM-<år>-<löpnummer>` från 1001 allokeras med en databassekvens per år (prod-ledgern är tom, mätt 2026-08-30; staging-ledgern bär 1001–1002 — sekvensen startar efter högsta). Unik nyckel per inbetalning på kvittot gör dubbelskick strukturellt omöjligt. Basen (Airtable) förblir sanning för anmälan, event och priser och bär en **app-skriven spegel**: de två valfälten, `Summa inbetalt (kr)` (talfält, skrivet av appen — inte rollup) och kvittonummer på anmälan; `Saknas (kr)` som Airtable-formel (pris − summa). Spegeln skrivs i samma operation som inbetalningen, med omförsök; eftersläpning syns i appen. En konsistensvakt larmar på inbetalningar vars anmälan försvunnit. Lotta rör aldrig valfälten för hand.

**Inkorgen och formuläret (beslut 2, 6, 7).** Sidan Betalningar under Mer; Hem-kortet Betalningar ersätter dagens kort "Förfallna betalningar" (inte ovanpå det) och visar *N öppna · M förfallna · K kvitton att skicka* med Registrera betalning och Skicka påminnelse till alla. Listan grupperas per kommande event, närmast först; Klara hopfällda; Tidigare event med saknat belopp under eget filter. Sökfältet har fokus vid öppning och filtrerar på namn, telefon och belopp; personer med öppna betalningar rankas först, personer utan visas sist med "registrera ändå". Formuläret öppnas på plats i raden: belopps-knappar härledda ur pris och tidigare inbetalningar, fritt fält som normaliserar "2 500,00", betalsätt (senast använda), datum (i dag), ruta Skicka kvitto (förbockad = ta med), notering. Enter = registrera; ⌘/Ctrl+Enter eller knappen = registrera och skicka. Efter Enter: raden kvitterar, listan uppdateras, fokus åter i tomt sökfält. Fel visas som text vid fältet och annonseras. Öppen betalning = Saknas (kr) > 0 och status inte Avbokad/Ombokad; obekräftade räknas och märks; förfallen = slutbetalningens deadline passerad.

**Kvittot (beslut 3, 4, 5, 9).** Ett kvitto per inbetalning. Registrera först, skicka sedan: väntande kvitton skickas som ett jobb via knappen Skicka N kvitton. Mallen: en rad med inbetalningens belopp, "Betalningsdatum" ur inbetalningen på raden där Förfallodatum stod, "Datum" = utfärdande; betalsätt i mailtexten; kursnamn och etikett orörda (TASK-306 rättelsevarv). PDF:en sparas i en privat bucket och nyckeln i ledgern; raden visar Kvitto MM-… med Visa (signerad länk) och Skicka igen (samma PDF, samma nummer, valfri adress). Ingen mailkopia till Lotta. Radera före kvitto; makulera efter (skäl; kvittot består, märkt makulerat); återbetalning = negativ inbetalning; kreditkvitto med nästa nummer i samma serie och hänvisning till originalet, trigger som kvittot.

**Jobbmotorn (beslut 11; ADR-129).** Kö i Postgres (pgmq) + schemalagd konsument (pg_cron, cirka tio sekunder) + omedelbar kick (Edge Functions bakgrundsjobb) så att första kvittot går inom sekunder; jobbstatus per rad i Postgres; klienten får push via Realtime Postgres Changes (med historik) och läser läget vid appöppning. Självläkning: rader i "pågår" äldre än några minuter återställs till "väntar" av cron; en fallerad rad bär skälet och kan skickas om. Kö-meddelandet är jobbtyp + rad-ID — motorn är generisk; kvittot är första konsumenten, utskicken migreras i en egen PRD. Konsumentvägen får inte kräva ett dashboard-steg (ingen exponerad kö-schema); cron→funktion autentiseras med delad hemlighet i Vault, seedad av agent i staging och av Marcus i prod; nya tabeller läggs i Realtime-publikationen. Sekventiell allokering av nummer, begränsad parallellism mot PDF-tjänsten (under dess samtidighetstak) och throttlad mailsändning (ett anrop per kvitto — batch-API:t stödjer inte bilagor).

**Swish-import (beslut 8).** Intern typ *transaktion* (datum, belopp, namn, telefon, meddelande, bankreferens) som Swish-rapport, girofil och framtida bank-API alla fyller — en typ, inget ramverk. Parser med kolumnmappning som sparas per bank; Handelsbankens öppna specifikation och exempelfiler som första fixtur; rapporten kommer från banken och formatet varierar per bank. Matchning: telefon → anmälan; annars namn + belopp mot öppna betalningar; annars omatchad. Rader märks säker/osäker/omatchad i samma inkorg; säkra förbockade, osäkra visar kandidater, omatchade får sökfältet; bekräftelsen skapar inbetalningarna (kvittorutan per rad) och sedan Skicka N kvitton. Dubbletter på bankreferens hoppas över synligt. Matchning mot Lottas verkliga fil är HITL (bank okänd — plusgirot antyder Nordea).

**Ytorna (beslut 10).** Åtgärds-sidans panel: saknas-belopp, Registrera betalning (samma formulär, förvald person), inbetalningsrader med kvittostatus; kryssen flippas inte längre för hand. Eventsidan läsande. Anmälans detaljvy: Betalningar-sektion med saknas, inbetalningar, kvitton. Personkortet: ny Betalningar-sektion (öppna över alla event + senaste inbetalningar + Registrera). Hem, Åtgärds-sidan och persondetalj är facit-stämplade: varje ändring bär en AMENDERING-sidofil per yta med klassen *ny form, förhandsmandat S113 Del 11 (B3)*; stämplarna uppdateras av Marcus vid morgongranskningen.

**Miljöflagga (B2).** Alla nya ytor bakom en miljöflagga (på i dev/staging, frånvarande i prod) tills Marcus slår på den efter prod-migrationerna; flaggan rivs efter promovering.

**Modell per skiva (ADR-089-avvikelser bokförda i uppdragstexterna).** Opus: ADR:er, Postgres/jobbmotor, EF:er + adapter, inkorg/ytor, backfill, Swish-matchning, granskning av pengaskivor. Sonnet: kvittomall, basfält, kreditkvitto/makulera, övrig granskning. Haiku: sök. Fable orkestrerar (fallback Opus@xhigh). Effort xhigh.

**Nattmandat (B4, Marcus 2026-08-30).** Orkestreraren får armera en PR med risknivå hög när granskningsloopen konvergerat (alla fynd åtgärdade, inget ask-user, ingen kvarstående error); nivån bokförs per PR; avsteget skrivs i ADR-105 § Updates som ett nattmandat för denna natt, inte ny norm.

**Staging (B5, B6).** Parallellt bygge i worktrees, seriell staging-applicering: orkestreraren äger db push och funktionsdeploy före varje armering; staging bär aldrig mer än en olandad schema-/funktionsversion. Postgres-testrader städas (purge-policy får Postgres-targets); staging-mail går bara till testadresser; nya funktioner döps inte send-* (mail-låset). Rött test:api-fall på main (TASK-343) är känt och orelaterat. Prod-Postgres-runbook skrivs som egen skiva (migrationer, extensions, Vault, cron, funktions-allowlist).

### Testbeslut

Testa externt beteende, aldrig implementationsdetaljer. Tre befintliga skarvar, ingen ny:

1. **Hermetiska API-tester** (samma form som kvittonumreringens samtidighetsbevis): härledningen (alla fyra fallen i grillningens tabell, avtalat pris, återbetalning, föreläsning), sekvensen (tät, unik, startar efter högsta), unik nyckel per kvitto (dubbelskick fäller), matchningen (telefon, namn+belopp, osäker, omatchad), dubbletter på bankreferens, jobbets tillståndsmaskin (väntar → pågår → skickat/fel, självläkning), beloppsnormalisering ("2 500,00", "2500,50", "abc", "1e3"). Varje regel bevisas med en negativ kontroll som visar att testet fäller en trasig implementation.
2. **Staging-tester för Postgres-kontraktet** (som aktivitetsloggen): RLS, kontrakt-mot-tom, service_role-skrivning mätt och städad; serialiserade via staging-semaforen.
3. **Acceptanstest i browsern** för Lottas lördag ände-till-ände mot fixturen ZZ-GRANSKNING-S113 i staging: Hem → inkorg → sök → tre registreringar (1 000 / 2 500 / annat) → Skicka 3 kvitton → utfall per rad → Visa kvitto → Skicka igen → makulera → Swish-import med Handelsbankens exempelfil → Åtgärds-panel, anmälan, personkort; desktop och iPad-bredd; axe-scan 0 överträdelser; fokusordning och felannonsering.

Facit-grindarna för Hem, Åtgärds-sidan och persondetalj hålls gröna via AMENDERING-sidofiler. Kvittomallen mäts med mall-loopen (Prince ≡ Chrome inom 0,5 mm) och paritetsgrinden. Slutverifieringen är orkestrerarens egen vandring i browsern, bokförd med skärmdumpar, plus en oberoende granskningsagents vandring.

### Utanför omfattningen

Bank-API (öppen bankdata) — förberett genom transaktionstypen, ingen kod. Migrering av bekräftelse-, påminnelse- och deltagarinfo-utskicken till jobbmotorn (egen PRD). Bokföringsexport till Roger (Roger-feedback). Mailkopia av kvitton till Lotta. Matchning mot Lottas verkliga bankfil (HITL när banken är känd). Prod-steg (fält, migrationer, funktionsdeploy, Vault, cron, flagga, backfill, facit-stämplar, rivning av Airtable-ledgern) — Marcus moment med checklista i handoffen. Rättning av formelfällan 52 i basen (prod-schemaändring, Marcus GO).

### Estimat

Cirka 16 skivor: docs/ADR (2), bas (1), Postgres (1), domän/adapter/EF (2), ytor (2), kvittomall/lagring (1), backfill (1), Swish-import (1), kreditkvitto/makulera (1), prod-runbook (1), städning/flagga-rivning (1), QA (1), plus fix-skivor ur orkestrerarens slutvandring. Storleksklass: stor arbetsenhet — en AFK-natt för staging-halvan, en morgon för prod.

### ADR-koppling

Styrande: ADR-109 (kvittoserien — beslut 1, 3, 4, 6 står; (a) omformas, 2, 5, 7 rivs, (d) kreditkvitto in, öppna punkten belopp stängs), ADR-063 (basen förstklassig — öppen rivning av beslut 2/6 för betalningsdomänen i § Updates, inte undantag), ADR-110 (aktivitetsloggen i Supabase — prejudikatet), ADR-057 (lager-oberoende — port-paritet i båda adaptrarna), ADR-102/103/104 (facit, prototyp — B5-avsteget bokförs i ADR-103 § Updates), ADR-105 (granskningsgrinden — nattmandatet i § Updates), ADR-089 (modell per roll), ADR-125 (bilagornas modell — mallar). Mintas: ADR-128 (inbetalningen som sanning, Postgres, spegel), ADR-129 (jobbmotorn — måste bemöta research-passets B-rekommendation öppet).

### Ytterligare anteckningar

Underlag: kvitto-beslutsunderlag-2026-08-30 (ingång), kvitto-flodet-kartlaggning, kvitto-branschpraxis-och-svensk-ratt (SFL 39 kap. 5 § — kvittot till kunden är en servicehandling; Miranon Medias egen verifikation kräver sparad PDF), asynkront-kvittojobb-byggstenar, swish-rapport-exportformat + exempelfiler, verifiering-kvittoskivning-afk-natt (B1–B7, vågordning), vandringen i tasks/sessions/bilagor/s113-kvittovandring. Sessionsdok S113 Del 10–11. Ordlista: Inbetalning (Undvik: avstämning = närvaro).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 ADR-128 och ADR-129 är Accepted och landade FÖRE första kodskiva armeras
- [ ] #5 Pengalogikens regler (härledning, sekvens, unik kvittonyckel, matchning, dubbletter, jobbets tillstånd) har var sin negativ kontroll bokförd — testet fäller en trasig implementation
- [ ] #6 Orkestrerarens egen vandring av Lottas lördag mot staging (fixtur ZZ-GRANSKNING-S113) är bokförd med skärmdumpar i tasks/sessions/bilagor/ före session-paus, och en oberoende granskningsagent har gått samma vandring
- [ ] #7 Nya ytor ligger bakom miljöflaggan och är avstängda i prod tills Marcus slår på den
- [ ] #8 Facit-stämplade ytor (Hem, Åtgärds-sidan, persondetalj) bär AMENDERING-sidofil per yta med klassen ny form, förhandsmandat S113 Del 11
<!-- DOD:END -->
