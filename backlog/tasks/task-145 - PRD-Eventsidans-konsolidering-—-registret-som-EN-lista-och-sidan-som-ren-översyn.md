---
id: TASK-145
title: >-
  PRD: Eventsidans konsolidering — registret som EN lista och sidan som ren
  översyn
status: To Do
assignee: []
created_date: '2026-08-07 07:44'
updated_date: '2026-08-07 08:56'
labels: []
dependencies: []
ordinal: 230000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Eventsidan säger idag samma sak på tre ställen och blandar två uppgifter som inte hör ihop.

**Tre ställen:** Betalningar är ett eget toppblock med egen arbetsyta, medan deltagarna står i två sektioner med var sin rubrik — Obekräftade som kö, Bekräftade som fällbart arkiv. För att veta vad som återstår för EN person måste Lotta läsa i alla tre. I fliken "Saknar betalning" sa ytan dessutom samma sak tre gånger om samma person: fliknamnet, det obockade krysset och ordet "Saknas".

**Två uppgifter:** sidan är samtidigt en översyn (vad är läget?) och en redigeringsyta (gör något åt det). Gränsen mellan dem var inte begriplig — några fält gick att skriva i, andra inte, och 18 tomma inmatningsfält stod och väntade på text som sällan skrevs. Marcus dom över personblocken: *"innehållet som det behöver ha, men designmässigt är det skit."*

Konsekvensen för Lotta är att arbetsordningen inte syns. Registret sorterar inte efter vad som återstår, utan efter vilken sektion personen råkar tillhöra.

### Lösning

Eventsidan blir en **ren översyn**. Allt som VERKSTÄLLER något flyttar till Åtgärds-sidan.

**Registret blir EN lista.** Obekräftade/Bekräftade-rubrikerna rivs. I deras ställe en enda deltagarlista sorterad på fyra steg-hinkar i Lottas arbetsordning — väntar på bekräftelse, anmälningsavgift saknas, slutbetalning saknas, klara — och inom varje hink i anmälningsordning. **Steg-märket ÄR grupperingen**; inga textrubriker behövs när märket redan säger var personen står.

**Steg-räknarna i toppen är att-göra-listan.** Fyra klickbara räknar-rader som filtrerar registret. Lottas arbetsdag börjar i den rad som har flest kvar.

**Betalnings-toppblocket försvinner.** Dess arbetsyta flyttar in under registret som **läsyta**, i anmälnings-detaljsidans grammatik: rubrik utanför, kort under, etikett dämpad till vänster, värde primärt till höger. Personen får en kortyta; noteringen egen rad i full bredd; utskickshistoriken en tidslinje med klockslag i stället för en klump i en värde-slot.

**Markera-läget verkar över visad lista** och drar med urvalet till Åtgärds-sidan. Det är eventsidans enda utgång mot en handling.

### Användarberättelser

1. Som Lotta vill jag se ALLA anmälda i en enda lista, så att jag slipper leta samma person i två sektioner.
2. Som Lotta vill jag att listan sorteras efter vad som återstår, så att det ogjorda alltid ligger överst.
3. Som Lotta vill jag se personer i anmälningsordning inom varje steg, så att den som väntat längst kommer först.
4. Som Lotta vill jag se ett steg-märke per person, så att jag förstår var hon står utan att läsa en rubrik.
5. Som Lotta vill jag se exakt ETT märke per person även när flera saker saknas, så att jag inte behöver tolka ett nät av statusar.
6. Som Lotta vill jag att undantagen (avbokad, inställt, på väg till väntelistan) bär egna ärliga märken, så att de inte göms i en vanlig hink.
7. Som Lotta vill jag se fyra steg-räknare i toppen, så att jag ser dagens arbetsmängd innan jag scrollar.
8. Som Lotta vill jag klicka en steg-räknare och få registret filtrerat, så att jag kan beta av ett steg i taget.
9. Som Lotta vill jag rensa alla filter med en knapp som faktiskt rensar allihop, så att jag inte står kvar i ett filtrerat läge jag trodde var borta.
10. Som Lotta vill jag att registret behåller sitt scroll-beteende, så att en lång lista inte trycker ned resten av sidan.
11. Som Lotta vill jag markera flera personer, så att jag kan agera på ett urval i stället för på alla eller ingen.
12. Som Lotta vill jag markera inom ett filtrerat läge, så att jag kan välja "alla som saknar slutbetalning" utan att bocka tjugo kort.
13. Som Lotta vill jag att markera-läget inte förskjuter sidan när jag slår på det, så att korten står kvar där jag såg dem.
14. Som Lotta vill jag ta mitt urval vidare till Åtgärds-sidan, så att utskicket sker där mottagarna syns.
15. Som Lotta vill jag se betalningsläget per person utan att lämna eventsidan, så att jag får överblicken på ett ställe.
16. Som Lotta vill jag se en persons notering i full bredd, så att långa noteringar går att läsa i sin helhet.
17. Som Lotta vill jag se utskickshistoriken som en tidslinje med klockslag, så att jag ser vad som skickats och när.
18. Som Lotta vill jag INTE se tomma inmatningsfält på en översyn, så att sidan inte ser ut att vänta på något av mig.
19. Som Lotta vill jag att en betalning berättas EN gång per person, så att jag slutar läsa samma sak tre gånger.
20. Som Lotta vill jag se när en betalning togs emot, så att jag kan svara på frågor om datum utan att gå till basen.
21. Som Lotta vill jag att rader som går att klicka ser klickbara ut, så att jag hittar det som går att öppna.
22. Som Lotta vill jag se gruppdynamiken med samma slags personkort som på anmälnings-sidan, så att appen känns som ett system.
23. Som Lotta vill jag att en bucket inte upprepar sitt eget namn i varje rad, så att skärmen bär information i stället för fyllnad.
24. Som Roger vill jag att eventsidan aldrig ändrar data av misstag, så att den kan visas och läsas utan risk.
25. Som skärmläsaranvändare vill jag att listans tabbstopp och etiketter beskriver den sektion jag faktiskt står i, så att navigationen inte ljuger.

### Implementationsbeslut

**Eventsidan är en LÄSYTA. Detta är beslutets kärna.** Marcus 2026-08-07: *"eventsidan är bara för översyn nu ju, så alla åtgärder flyttar till åtgärdssidan. Är ju dessutom inte rimligt att kunna kryssa i på eventsidan men inte skriva noteringar, bättre att ha allt på åtgärdssidan."* Följden: **båda betalnings-kryssen** (anmälningsavgift och slutbetalning), noterings-redigeringen och påminn-knappen lämnar eventsidan. Ingen skrivväg återstår.

**RIVNING, öppet bokförd:** grillad samsyn S93 beslut 1 slog fast att K27-anden — *"Lotta lämnar inte sidan för avprickning"* — skulle överleva konsolideringen. Den gör den inte längre. Beslutet ovan river den medvetet, med motiveringen att en halv redigerbarhet (kryssa ja, skriva nej) är en sämre gräns än ingen alls. Beslut 1:s formulering "avpricknings-arbetsytan integreras i Anmälda deltagare" amenderas därmed: arbetsytan flyttar in som **läsyta**.

**Registret:** en lista, fyra steg-hinkar i ordningen väntar på bekräftelse → anmälningsavgift saknas → slutbetalning saknas → klara, med inställt/på-väg-till-väntelista sist. FIFO inom hink (äldst registrerad först) — samma semantik som gamla kön hade, nu tillämpad enhetligt. Steg-märket är grupperingen; inga sektionsrubriker.

**Inline-scrollen återanvänds oförändrad** på den enade listan — samma klipphöjd som kön hade, inte en ny. Tabbstoppets etikett måste följa sektionen, inte ärva köns hårdkodade namn.

**Markera-läget** verkar över visad lista: den filtrerade vyn när ett filter är valt, annars hela den sorterade listan. Läget kräver inte ett filter. Batch-barens primärknapp bär texten **Åtgärder** och tar urvalet vidare; bekräfta-flödet med sin kontrollfråga rivs ur eventsidan helt — det är ett utskick och hör till Åtgärds-sidan.

**Namnkollision att väga in vid Åtgärds-sidans design:** sidan bär sedan tidigare en Åtgärds-rubricerad grupp med statiska länkar. Batch-barens knapp bär samma ord i en annan betydelse. Ordet är specat i grillad samsyn beslut 5 och följs, men två Åtgärds-ytor på samma sida är en känd skavning.

**Auto-kryssen rivs** ur eventinfo-radens signal-slot; slotten visar bara "Dags att skicka"-badgen när den är tänd, annars tomt med bevarad höjd.

**Betalningsytan, form:** kortyta per person med namn och status utanför kortet · tomma inmatningsfält rivna · rött lämnar fältetiketten (fliknamnet bär redan informationen) · noteringen egen rad i full bredd med symmetrisk luft · utskicken som tidslinje · höger-slotten ("Saknas"/"Mottagen") riven som redundant · mottagen-pill med datum · synlig hover på det som går att öppna.

**DATAGRÄNS — beslut ej taget, får INTE byggas runt.** Mottagen-datum finns inte i basen: båda betalningsfälten är enkelval utan tidsstämpel. Prototypen visar datumet mot ett prototyp-lokalt värde. **Det värdet får inte landa skarpt.** Antingen tas Marcus beslut om två additiva datumfält (med konsekvenserna: av-bocken måste nolla datumet, och gamla betalningar får aldrig ett datum retroaktivt), eller så byggs pillen utan datum. Att lägga fältet i domänmodellen i förväg vore att föregripa beslutet i kod.

**Gruppdynamiken:** knappformen härmar deltagarlistans (platta i sin förälder, inte kant-till-kant över hela radhöjden) · personkorten får mini-kortformen från anmälnings-sidan · "Inga tidigare event"-raden rivs som dubbelinformation.

**Tvärs över:** samtliga prototyp-förklarande texter rivna. Anteckningscomposern går till primitivens nästa storlekssteg i stället för ett handrullat minimimått.

**Fälla som kostat två iterationsvågor:** vertikala marginal-utilities på styckeelement är TYSTA no-ops i denna kodbas — en global oskiktad nollställning slår Tailwinds utilities eftersom skiktad CSS förlorar mot oskiktad. Använd padding, och DOM-mät resultatet i stället för att anta det.

**Räckvidd att veta innan bygget:** i prototypen är betalningsvågorna variant-grenade medan gruppdynamikens form och proto-text-rivningen redan ligger i delad, skarp kod. Skivningen måste skilja på vad som ska byggas och vad som redan är byggt.

### Testbeslut

**EN skarv, befintlig: den hermetiska acceptance-skarven för Anmälda-vyn.** Konsolideringen är till övervägande del struktur och interaktion över data som skarven redan mockar — enad lista, steg-hinkarnas ordning, steg-märkena, räknarnas filtrering, markera-läget, den inflyttade läsytan, gruppdynamikens form. Ingenting av det kräver staging. Skarven är hermetisk och ligger därmed i den billiga CI-klassen utan staging-mutex, och tillgänglighetskontrollen bor redan där.

Testa **externt beteende**: att listan visar personerna i rätt ordning, att ett räknar-klick filtrerar, att ett märke syns per person, att markera-läget ger rätt antal, att urvalet når utgången. Aldrig sorteringsfunktionens interna form.

**Tillgänglighet mäts i BÅDA lägena** — vilande och markera-läge — med noll överträdelser som krav.

**Skrivvägs-frånvaron ska bevisas, inte påstås.** Ytan får inte bära någon skrivkontroll: inga kryssrutor som muterar, inget redigerbart noteringsfält, ingen påminn-avfyrning. Ett mekaniskt bevis (frånvaro av skriv-affordanser i den renderade ytan) väger tyngre än en genomläsning.

**Befintliga staging-skarvar:** deltagar-skarven uppdateras där ytan flyttat. **Avprickningens skarv följer med sitt subjekt till Åtgärds-sidans kort — den ärvs inte hit och skrivs inte om här.**

**Visuella baslinjer driftar med avsikt.** Gruppdynamikens form och proto-text-rivningen ligger i skarp kod, så baslinjerna FÖRVÄNTAS skilja. Omtagning med granskade bilder är en del av leveransen, inte en överraskning i CI.

### Utanför omfattningen

- **Åtgärds-sidan själv** — eget PRD-kort (kort 3 i sekvensen), med eget divergens-pass.
- **Bilage-fundamentet** — eget PRD-kort (kort 2).
- **Additiva datumfält i basen för mottagen betalning** — Marcus beslut, ej taget.
- **Pill-skalans standardisering** — registrerad tråd, egen leverans.
- **Knapp-standardiseringen i appens övriga vyer** — registrerad tråd; eventlistans pillerspråk är research-grundat och att migrera det är ett designbeslut, inte en uppstädning.
- **Auto-utskickets motor** — låg utanför eventsidans PRD redan innan och gör det fortfarande.
- **Kvitto-designen och kvittonummer-serien** — hör till kort 3, efter Roger-avstämningen.
- **De fyra facit-lösa ytorna** (Hem, Mer-ytorna, Segment, Mail-handling) och valen på personytorna.
- **Skarpa betalningsvyns kvarvarande kod** utanför det som flyttar — städning av vestigiala grenar tas inte här.

### Estimat

**Fem till sju skivor, medelstor arbetsenhet.** Grovt snitt: (1) registret som EN lista med steg-hinkar och märken · (2) steg-räknarna och filtreringen · (3) markera-läget över visad lista plus utgången mot Åtgärds-sidan · (4) betalningsblockets rivning och arbetsytans inflytt som läsyta · (5) betalningsytans form · (6) gruppdynamiken plus tvärs-över-rivningarna · (7) QA-vandring. Skiva 4 och 5 kan slås ihop om läsyte-formen visar sig vara en enda ombyggnad.

Skiva 1–3 kan börja parallellt med 4–6; QA sist och beroende av alla.

### ADR-koppling

- **ADR KRÄVS för läsyte-gränsen** — mintas separat vid bygget som nästa lediga nummer. Beslutet "eventsidan skriver aldrig; all verkställighet bor på Åtgärds-sidan" klarar ADR-baren på alla tre villkoren: det är dyrt att återställa i koherens (varje framtida yta måste veta vilken sida som äger skrivningen), det är överraskande utan kontext (grillad samsyn beslut 1 bokförde uttryckligen motsatsen om K27-anden), och det är resultatet av en verklig avvägning (halv redigerbarhet mot ingen). Kortet refererar ADR:n — beslutet skrivs aldrig inline i en skiva.
- **ADR-063** (Airtable-basen som förstklassig leverabel) — styr mottagen-datum-frågan: resolutionen sker i basen, inte genom att designa bort gränsen.
- **ADR-067** (utskicksarkitekturen) — revideras vid Åtgärds-sidans kort, inte här. Eventsidan slutar skicka; den definierar inte hur det skickas.
- **ADR-074** (prototyp-växlarens stabila nycklar) — vinnaren behåller sin nyckel; gäller när prototyp-grenarna rivs vid skarp landning.

### Ytterligare anteckningar

**Detta kort ersätter task-18.20.** Det kortet stod låst på fyra Marcus-frågor — inline-scroll, batch-handlingarnas uppsättning, Åtgärds-radernas form och batch-barens intents. Alla fyra är besvarade av facit och av läsyte-beslutet: scrollen återanvänds oförändrad, handlingsuppsättningen krymper till EN utgång mot Åtgärds-sidan, och intent-frågan faller bort när baren bara bär en handling. Det gamla kortets tekniska inventering är fortfarande giltig som bakgrund; dess acceptanskriterier är det inte.

**Facit är låst av Marcus 2026-08-06** (*"Jag är nöjd. Lås som facit."*) efter tjugo iterationsvågor. Bilagan till S93 bär den fullständiga spec-tabellen våg för våg **med rivningens skäl per rad**, plus fyra facitbilder. Den tabellen ÄR spec-underlaget för skivorna — läs den innan en skiva skrivs, inte efter.

**Design-review sker mot facitbilderna**, inte mot det äldre S73-facit. Avvikelser bokförs öppet.

**Talens källa är verifierad mot basen**, inte bara internt: prototypens räknerader stämde mot Eventplanerings egna fält vid mätning. Den koherensen ska hålla efter ombyggnaden.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Skrivvägs-frånvaron mekaniskt bevisad: noll skriv-affordanser i den renderade eventsidan (kryss, noteringsfält, påminn)
- [ ] #6 Design-review mot S93:s FACIT-bilder (ej S73-facit); avvikelser bokförda öppet
- [ ] #7 test:visual omtagen med granskade baslinjer — drift i gruppdynamik/proto-rivning är väntad, inte accepterad osedd
- [ ] #8 Mottagen-datum: prototyp-lokalt datum får INTE finnas i landad kod utan Marcus bas-beslut
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MOTTAGEN-DATUM — MARCUS BESLUT 2026-08-07, VÄG C. Datumet SKA finnas: 'vi måste ha in datum, det har alltid proffs. Vi ska göra det proffsigt. […] Det gör inget att gamla betalningar inte har datum.'

ARBETSFÖRDELNINGEN, som följer av att avprickningen flyttat till åtgärds-sidan:
- DETTA kort RENDERAR datumet när domänmodellens fält bär ett värde, annars bara 'Mottagen'. Ingen basändring här.
- TASK-147 äger de två additiva dateTime-fälten, allowlist-utökningen och skrivvägen som stämplar datumet vid avprickning.
- Den prototyp-lokala uppslagstabellen PROTO_MOTTAGEN_DATUM RIVS i detta kort. Den är påhittad data och bryter mot RÅ-disciplinen som anmälnings-detaljsidan redan följer ('Betalning-mottagen saknar tidsstämpel i basen ⇒ ingen betalningsnod fabriceras').

ACCEPTERAD KONSEKVENS, öppet bokförd: appen bär permanent TVÅ KLASSER i samma lista — nya betalningar visar datum, gamla visar bara 'Mottagen'. Marcus har vägt och accepterat det. Retroaktiva datum får aldrig fabriceras.

Att pillen står datumlös tills TASK-147 landat är inte ett fel — det är exakt vad basen kan belägga i det läget.
<!-- SECTION:NOTES:END -->
