---
id: TASK-1
title: 'PRD: UI-uppgradering Hem-vyn'
status: Done
assignee: []
created_date: '2026-07-05 18:58'
updated_date: '2026-07-06 14:57'
labels: []
dependencies: []
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Hem är det första Lotta möter varje gång hon öppnar appen, men vyn är funktionellt korrekt utan att vara presentabel: tre horisontella kolumner där innehållet inte får plats, rubriken säger "Hem" i stället för att hälsa på henne, ingenting i översikten går att klicka sig vidare från, och appens visuella identitet syns knappt. Översikten svarar inte på hennes naturliga följdfrågor — "vilket event gäller anmälan?", "var ser jag alla anmälningar?" — utan tvingar henne att navigera om från noll via menyn.

### Lösning

Hem arrangeras om enligt FK-linjen (strukturspråket från Försäkringskassans app, valt genom prototyp-pass): ett personligt hälsningskort ("Hej Lotta!") överst, därunder två kort i rad — Nästa event i appens gula signaturton och Obetalda avgifter med antalet stort — sedan ett helbredds-kort med de senaste anmälningarna, och sist en stor knapp "Visa alla anmälningar". Allt som ser klickbart ut ÄR klickbart och leder dit man förväntar sig: event-kortet till eventets sida, en anmälningsrad till eventets anmälda-lista, knappen till en NY samlad anmälningslista under Mer. Menyn längst ned uppgraderas till FK-mönstret med ikoner, etiketter och tydlig markering av aktiv flik — det lyfter hela appen, inte bara Hem.

### Användarberättelser

1. Som administratör vill jag hälsas med mitt namn när jag öppnar appen, så att den känns som min.
2. Som administratör vill jag se nästa kommande event direkt på Hem med datum, ort och beläggning, så att jag vet vad som händer härnäst utan att leta.
3. Som administratör vill jag kunna klicka var som helst på Nästa event-kortet och landa på eventets sida, så att jag når handläggningen i ett klick.
4. Som administratör vill jag se antalet obetalda avgifter stort och tydligt med de första namnen under, så att jag omedelbart ser om något kräver åtgärd.
5. Som administratör vill jag se de senaste anmälningarna med namn, event och datum, så att jag ser vad som kommit in utan att öppna varje event.
6. Som administratör vill jag kunna klicka på en anmälan och landa på det eventets anmälda-lista, så att jag kan handlägga anmälan i sitt sammanhang.
7. Som administratör vill jag att en anmälan som saknar event visas med texten "Utan event" i stället för en tom lucka, så att jag ser att uppgiften saknas i stället för att undra.
8. Som administratör vill jag ha en stor tydlig knapp "Visa alla anmälningar" på Hem, så att jag når hela inflödet därifrån listan redan börjat.
9. Som administratör vill jag ha en samlad lista över alla anmälningar med de senaste först, så att jag kan gå igenom inflödet på ett ställe.
10. Som administratör vill jag kunna klicka på en rad i den samlade listan och landa på eventets anmälda-lista, så att vägen till handläggning är densamma överallt.
11. Som administratör vill jag att tomma lägen säger något vänligt och begripligt ("Inga anmälningar än"), så att tomt aldrig ser trasigt ut.
12. Som administratör vill jag att menyn har ikoner och etiketter med tydligt markerad aktiv flik, så att jag alltid ser var jag är.
13. Som administratör vill jag kunna nå allt på Hem och i anmälningslistan med enbart tangentbord, så att appen fungerar oavsett hur jag styr den.
14. Som skärmläsaranvändare vill jag att kort, listor och knappar annonseras med begripliga namn och roller, så att översikten är lika användbar utan skärm.
15. Som administratör vill jag att sidorna fungerar i förhöjt kontrastläge och med reducerad rörelse, så att mina systeminställningar respekteras.
16. Som administratör vill jag kunna skriva ut Hem läsbart, så att översikten går att ta med på papper.
17. Som administratör vill jag kunna uppdatera översikten manuellt och lita på att den håller sig färsk själv, så att siffrorna alltid speglar läget.

### Implementationsbeslut

1. A-skelettet (prototypvinnaren, sessionsdok Session 52 Del 4): hälsningskort med stort "Hej {namn}" + uppdatera-kontroll → två kort i rad (Nästa event | Obetalda avgifter med antalet stort) → helbredds-listkort Nya anmälningar med etikett-över-värde och tunna avdelare → stor helbredds-CTA med chevron sist. Vertikal stapling; aldrig tre kolumner; max två kort i rad (FK-mixen); tonala kortytor utan kantlinjer; generös hörnradie.
2. Allt inom det befintliga 3-lagers-tokensystemet: nya tokens läggs endast i semantik-/komponentlagret; primitivlagret och designfilosofin röres inte (grund-låset, Del 3 beslut 5). Ljus bas i Miranon-identiteten — FK:s struktur, inte dess mörka färgvärld.
3. Nästa event-kortet bär primär-tinten (mixen från variant C) och är klickbart i sin HELHET till eventets detaljsida — en länk-yta med korrekt semantik, inga nästlade länkar.
4. Anmälningsrader (Hem och den nya listan) är klickbara till eventets anmälda-vy via anmälans event-koppling, som läs-modellen redan bär. Rad utan event-länk renderas olänkad med fallback-texten "Utan event".
5. Namnkällan: display-namn läggs i inloggningskontots metadata (Supabase); auth-lagret utökas med namnfältet; hälsningen läser namnet och faller aldrig tillbaka på e-postadressen (Gunilla-principen).
6. Ny vy: samlad anmälningslista under Mer-familjen, FK-listmönstret (ett kort per rad, senaste först, namn + event + datum per rad). Samma befintliga läs-EF som Hem (den event-lösa grenen) via router-context-DI; read-only — ingen ny EF, ingen ändring i write-allowlisten.
7. Hem-CTA:n byter till "Visa alla anmälningar" och pekar på den nya listan (eventlistan nås via tabbaren — knappen förlänger listan den står under).
8. Tabbaren (delat app-skal, alla vyer ärver): FK-mönstret med ikoner + etiketter + tydlig aktiv-markering; ikonval följer flikarnas domänbegrepp.
9. Polling- och refresh-lagret återanvänds oförändrat (styrande beslut med erratum finns); den manuella uppdatera-kontrollen behålls i hälsningskortet.
10. Leveransen skrivs NYSKRIVEN genom leverans-grindarna; prototypkoden är raderad och absorberas aldrig — vinnarskelettets referens är sessionsdok Session 52 Del 4 + prototyp-commiten i git-historiken.

### Testbeslut

EN skarv (skarv-kvittensen, Marcus 2026-07-05): den befintliga e2e-/axe-sviten. Testa externt beteende, aldrig implementationsdetaljer: hälsningen visar namnet, korten visar sina data, klick på event-kortet landar på eventsidan, klick på anmälningsrad landar på eventets anmälda-vy, CTA:n landar på anmälningslistan, "Utan event"-fallbacken renderas, tomma lägen visar vänlig text. Axe-0-baseline på Hem och nya anmälningslistan via den befintliga baseline-runnern; tabbar-uppgraderingen får inte fälla någon annan vys baseline, och berörda befintliga assertions (skalets navigation) uppdateras i SAMMA skiva som ändringen. Miljö-oberoende via route-mock där data-beroende assertions annars blir sköra. Förebilder i kodbasen: hem-e2e:n, event-anmälda-e2e:n, mer-väntelista-e2e:n och shell-e2e:n. Ingen api-skarv (ingen ny EF) och ingen unit-skarv (ingen ny ren logik som motiverar den).

### Utanför omfattningen

- Övriga vyer (egna kommande kort per vy-kluster; detta kort etablerar mönstret).
- Mörkt tema — registrerad senare-utforskning (Marcus vill utforska mörkt; app-vid semantik-utbyggnad, eget kort).
- Brödsmulor — mönstret etableras på djupa vyer i eget/senare kort.
- Anmälnings-detaljvy (klickmålet är eventets anmälda-vy; en detaljvy är en egen framtida arbetsenhet).
- Markering av den specifika anmälan i anmälda-vyn vid inklick (möjlig senare förfining).
- Write-operationer och nya EF:er (kortet är read-only mot befintliga läs-EF:er).
- Sök/filter i anmälningslistan (enkel lista i denna version).

### Estimat

4 skivor, S/M/M/M: (1) namnkällan (S), (2) tabbaren (M), (3) Hem-omskrivningen (M), (4) anmälningslistan + CTA-kopplingen (M). Cirka 1,5–2 sessioner.

### ADR-koppling

Styrande i området: ADR-055 (data via router-context-DI), ADR-057 (lager-oberoende, adapter-gränsen), ADR-061 (miljö-isolation, dev mot staging), ADR-045 (axe-baseline-grinden), ADR-017 med erratum (polling/refresh), ADR-058 (arkitektur-fitness-audit vid leverans). Inga nya ADR:er påkallade — ADR-baren prövades i grillningen och alla beslut föll under baren (sessionsdok Session 52 Del 3).

### Ytterligare anteckningar

- Beslutstrail: sessionsdok Session 52 Del 3 (grillad samsyn) + Del 4 (prototyp-svaret). Målbild: FK-referensbilderna i repots referensmaterial.
- Design-review-grinden (extra DoD-posten) är L220-loopen operationaliserad: ingen UI-skiva stängs på enbart gröna tekniska grindar — Marcus granskar i webbläsaren, och granskningen får loopa.
- Detta är repots första skarpa PRD-kort: hel-kedje-körningen (/to-prd → /to-issues → /do-work) matar två-aktörs-ADR:ns drift-metrik.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review: Marcus-granskning i webbläsaren godkänd (per skiva med UI-yta)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · repots FÖRSTA skarpa PRD-kort stängt komplett: 5/5 barn Done (task-1.1 namnkällan · 1.2 tabbaren FK-mönstret · 1.3 Hem A-skelettet · 1.4 samlade anmälningslistan + CTA · 1.5 QA-planen 11/11 av Marcus, 0 fynd). Kod-commits 6ef4ea8/a8afcf9/7f629f2/32776d2/c0016a4 — samtliga CI-gröna per jobb. Design-reviews godkända per UI-skiva (L220-loopen; 1.2 första flervarvs-granskningen, 3 varv). Drift-metrik-matningar 1–5 avgivna. Efterspel: T65 (Hem-designiterationen) + T66 (prototyp-tvåfas-generaliseringen) registrerade; fynd-kort TASK-2 (Done) + TASK-3 (öppet).
<!-- SECTION:FINAL_SUMMARY:END -->
