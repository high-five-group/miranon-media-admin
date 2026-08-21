---
id: TASK-286
title: >-
  PRD: Förladdat personregister — sök som svarar på varje tecken, bokstavsindex
  och sortering ur samma array
status: To Do
assignee: []
created_date: '2026-08-21 11:43'
labels: []
dependencies: []
ordinal: 515000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

När Lotta skriver i personlistans sökruta laddas listan om vid varje tecken: skelettet ersätter raderna, en rundtur går till Airtable, och resultatet kommer tillbaka en halv till en och en halv sekund senare — för att sedan göra om allt vid nästa tecken. Marcus: *"Det är ju sjukt störigt att listan 'Laddas om' vid varje teckeninmatning i sökfältet. Den måste ju vara 'förladdad' eller något. Detta är ju inte proffsigt."* Registret är 559 personer — en storlek där varje jämförbar produkt (och appens egen eventväljare) laddar allt en gång och söker lokalt.

### Lösning

Hela registret laddas en gång via datalagrets adapter (en breddning av den genomgång EF:en redan gör för att räkna totalen), hålls i cachen, och varje tecken filtrerar arrayen i minnet — inga rundturer, inget skelett, ingen fördröjning. Sökträffarna är exakt desamma som i dag (byte-för-byte paritet med Airtables sökformel, bevisat med test); om sökningen ska bli mer tolerant (att "asa" hittar Åsa) är det ett separat beslut Marcus tar. Listan sorteras i svensk ordning (A–Z, Å, Ä, Ö) så att bokstavsindexet och bläddringen äntligen säger samma sak. Renderingen förblir paginerad ("Ladda fler") eftersom det är antalet DOM-noder, inte datamängden, som sätter gränsen. Nya personer syns direkt eftersom varje skrivväg som skapar eller ändrar en person invaliderar registret — först när det är bevisat får cachen leva längre än i dag. Registret värms när Lotta visar avsikt (pekar på Personer-fliken) och laddas annars vid första besöket, inte i den blockerande starten.

### Användarberättelser

1. Som Lotta vill jag att listan smalnar av medan jag skriver, tecken för tecken, utan att blinka eller vänta, så att jag hittar en person lika snabbt som i telefonens kontakter.
2. Som Lotta vill jag att ett raderat tecken omedelbart visar det bredare urvalet igen, så att jag kan prova mig fram.
3. Som Lotta vill jag att sökningen hittar samma personer som förut (namn, e-post, telefon, ort), så att inget jag är van vid försvinner.
4. Som Lotta vill jag att listan är i svensk bokstavsordning med Å, Ä och Ö sist, så att jag kan bläddra som i en telefonbok.
5. Som Lotta vill jag att en person jag just anmält syns i listan direkt, så att jag litar på den.
6. Som Lotta vill jag kunna söka även när nätet är borta, så att registret är användbart på en kurs med dålig täckning.
7. Som Lotta vill jag att räknarraden säger hur många som matchar min sökning, så att jag vet om jag behöver skriva mer.
8. Som Lotta vill jag att "Ladda fler" fortfarande finns när en bred sökning ger många träffar, så att listan inte blir oändligt lång och seg.
9. Som Lotta vill jag att första gången jag öppnar Personer går snabbt, och att den går ännu snabbare om jag redan pekat på fliken, så att registret känns redo.
10. Som Lotta vill jag att sökningen går att dela via adressfältet, så att en kollega kan öppna samma urval.
11. Som skärmläsaranvändare vill jag att antalet träffar annonseras lugnt när jag slutat skriva, inte vid varje tecken, så att jag inte överröstas.
12. Som Marcus vill jag att sökträffarna bevisas identiska med dagens innan de nya tar över, så att bytet aldrig är en tyst regression.
13. Som Marcus vill jag själv avgöra om sökningen ska bli diakritik-tolerant, så att en produktförändring aldrig smygs in via en omskrivning.
14. Som Marcus vill jag veta hur lång första laddningen är på en långsam uppkoppling, så att jag kan bedöma om värmningen räcker.
15. Som utvecklare vill jag att bokstavsindexet, räknarraden och sorteringen är härledningar ur samma array, så att de aldrig kan glida isär.
16. Som utvecklare vill jag att komponenten bara känner adaptern, så att ett datakällebyte inte når listan.

### Implementationsbeslut

- Styrande: ADR-123 (förladdat personregister, sju beslut) — detta kort verkställer den; ingen ny ADR. Respekterar ADR-055/ADR-057 (adaptern är enda vägen), ADR-078 (instant + prefetch på avsikt), ADR-112 (värmningsramen), ADR-072 (persist-lagret ger offline-sök).
- Adapterkontraktet breddas med en parameterlös registerfråga som returnerar samtliga personer som uppfyller basfiltret med de fält listan visar; Airtable-implementationen breddar EF:ens befintliga fullwalk (alla fält i stället för bara namn, posterna i stället för antalet); Supabase-stubben bär samma kontrakt. Dagens sök-/cursor-fråga lever tills sista konsumenten är borta och rivs i en egen skiva.
- Klientfiltret är ren skiftlägesokänslig delsträngsmatch per term över namn, e-post, telefon och ort (arrayfält: något element) — ingen tokenisering, ingen diakritik-normalisering. Paritet bevisas av ett test som kör samma termer (inkl. å/ä/ö, versaler, telefonnummer med mellanslag, ort) mot EF:ens filter och klientfiltret på samma fixtur. Diakritik-tolerans är ett eget beslutskort (HITL).
- Sortering: svensk kollation i klienten på den laddade arrayen; sentinelen för namnlösa sist. Bokstavsindexets fördelning och räknarraden är härledningar ur samma array (TASK-283:s skivor 2–4 bygger ovanpå skiva 3 här).
- Rendering: hela arrayen filtreras per tecken (deferred value håller fältet responsivt, ingen debounce på filtreringen); 50 rader renderas, "Ladda fler" utökar ur den filtrerade arrayen med samma knapp och annonsering; URL-parametern för sökningen behålls men skrivs debounced; träffantalet annonseras artigt efter skrivpaus.
- Färskhet: registerfrågan behåller det globala 5-minutersvärdet tills varje person-skapande/-ändrande skrivväg (ny anmälan, manuell anmälan, personredigering, flaggor som syns i listan) invaliderar registernyckeln och det är bevisat med test; därefter höjs staleTime till 30 minuter (refetch vid fönsterfokus och återanslutning kvar).
- Värmning: inte i Förberedelseskärmens blockerande mängd; prefetch vid hover/fokus på Personer-fliken (dedupas av React Query) och annars lat vid första besök med skelett i slutgeometri bara då; startvärmningens kommentar om "ingen naturlig kärnfråga" uppdateras.
- Skalgräns uttalad: omprövas vid ~2 000 personer eller om första laddningen mäts över en sekund på 3G — då virtualisering, inte server-sök.
- Facit-invarianten: listans rad- och listform är låst i tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json ytan personlistan och rörs inte av detta kort — bara datakällan bakom raderna byter.

### Testbeslut

- Externt beteende: skriv tecken → listan smalnar utan nätverksanrop (mätt i testet: noll EF-anrop efter första laddningen); räknarraden speglar arrayen; sorteringen är svensk; ny person efter mutation syns utan omladdning.
- Befintliga skarvar: acceptance-sviten för personlistan (hermetisk fixturvärld; uppdateras i samma skiva som källbytet), EF:ens staging-svit för den nya registerfrågan. Ny skarv: paritetstestet (EF-filter mot klientfilter på samma fixtur).
- Laddtid mäts, inte uppskattas: kall och varm första laddning i EF och i klienten, bokförd i skivans PR med metod; 3G-emulering i testmiljön.
- axe på listan efter bytet; facit-referenserna för personlistan gröna (formen är orörd).

### Utanför omfattningen

- Diakritik-tolerant sök (eget beslutskort här, HITL).
- Händelsedriven färskhet (Airtable-webhook) — airtable-constraints P26/P27.
- Virtualisering — först vid skalgränsen.
- Bokstavsradens UI (TASK-283.2–283.4) — bygger ovanpå skiva 3, äger sin egen form.

### Estimat

Fyra byggskivor + ett beslutskort + QA. Storleksklass: medel (två till tre dagar AFK), en HITL-grind (beslutet) som inte blockerar bygget.

### ADR-koppling

- ADR-123 (styrande, verkställs här) · ADR-078 · ADR-055/057 · ADR-112 · ADR-072 · fälla 43/51 (data-model.md).

### Ytterligare anteckningar

- Research: docs/research/forladdat-personregister-klientsok-branschmonster-2026-08-21.md — Airtables SEARCH() är diakritik-känslig (mätt i staging), precedenten är intern (eventväljaren), laddningen är en omfördelning av en befintlig walk, ingen invalidering av persons-nycklarna finns i dag.
- TASK-283.1 (EF-bokstavsfiltret) är wontfix per ADR-123; dess okommittade diff ligger kvar i en agent-worktree och kan läsas som referens för filter-builder-formen men ska inte återanvändas.
- Staging har bara 60 poster som uppfyller basfiltret — skalmätningar görs mot prods dokumenterade 559, aldrig mot staging.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Paritetstestet (EF-filter mot klientfilter, samma fixtur) grönt för varje skiva som rör sök eller filtrering
- [ ] #6 Facit-referenserna för personlistan (tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json ytan personlistan) gröna — formen är orörd
- [ ] #7 Inga nätverksanrop vid skrivning efter första laddningen — mätt i testet, inte antaget
<!-- DOD:END -->
