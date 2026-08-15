---
id: TASK-217
title: 'PRD: Förberedelseskärmen — blockerande startvärmning vid kall appstart'
status: To Do
assignee: []
created_date: '2026-08-15 08:32'
labels: []
dependencies: []
ordinal: 413000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Vid kall appstart möter Lotta i dag 6–7 sekunder av pulserande skeleton-ytor på hem-vyn, och varje flik hon sedan öppnar laddar om från noll. Väntetiden är oförutsägbar, säger ingenting om hur långt den kommit, och strider mot forskningens egen gräns för när skeleton är rätt verktyg. Vid appstart syns dessutom en naken oformaterad "Laddar…"-textrad — formen appens egen designprincip förbjuder.

### Lösning

Efter inloggning eller kall appstart visas Förberedelseskärmen: Miranon-logotypen, en äkta förloppsindikator som fylls i takt med att hämtningarna faktiskt blir klara, och texten "Förbereder ditt administrationsverktyg" (Marcus-låst ordalydelse). När baren är full är samtliga flikars kärndata varm — flikbyten är omedelbara. Vid varm cache visas ingen skärm alls; offline öppnar appen direkt på sparad data; en hård timeout släpper tyst in med det som hann bli klart.

### Användarberättelser

1. Som Lotta vill jag se en tydlig förberedelseskärm med förlopp i stället för hoppande grå rektanglar, så att jag vet att appen arbetar och ungefär hur länge.
2. Som Lotta vill jag att alla flikar är färdigladdade när jag släpps in, så att event, personer och anmälningar öppnas omedelbart när jag byter flik.
3. Som Lotta vill jag att appen öppnar direkt utan mellanskärm när jag redan varit inne nyligen, så att vardagsöppningen förblir omedelbar.
4. Som Lotta vill jag att appen öppnar på senast kända data när jag är offline, så att jag aldrig fastnar på en laddskärm som inte kan bli klar.
5. Som Lotta vill jag att en trög dag hos datakällan bara gör baren långsammare — inte att appen låser sig — så att jag alltid kommer in inom rimlig tid.
6. Som skärmläsaranvändare vill jag att förberedelseskärmen annonserar sitt förlopp korrekt, så att jag får samma besked som den seende.
7. Som användare med rörelsekänslighet vill jag att skärmen respekterar reducerad rörelse, så att förloppet visas utan animationsobehag.
8. Som utvecklare vill jag att varje ny kärnvy tvingas ta ställning till om dess data ingår i startvärmningen, så att skärmens löfte inte eroderar tyst.

### Implementationsbeslut

- Blockerande startvärmning efter auth-resolution — medvetet avsteg från progressiv branschriktning, motiverat av Airtable-kallstartslatensen (constraints-katalogens post P31); omprövas öppet vid Fas E (ADR-112).
- Ingreppspunkt: den befintliga render-gaten för auth-resolution (ADR-037) utökas med ett andra villkor — ingen ny gate-yta, ingen router-loader.
- Warmup-motorn byggs på TanStack Querys egna primitiv (ensureQueryData-familjen) med äkta settled-räkning för baren — aldrig en fejkad animation.
- Hämta en gång, dela: en hämtning per datamängd, seedas till både hem-kortens poll-nyckelfamilj och listornas nyckelfamilj; poll-scopet (ADR-017) består. Payload-identiteten verifieras vid bygget; spricker den → öppen fallback till dubbelhämtning.
- Skyddsräcken: online-gate (offline ⇒ ingen skärm — en väntande hämtning under networkMode online resolvar aldrig offline) och hård timeout ~8–10 s med tyst släpp.
- Förberedelseskärmen ersätter appnivåns två nakna "Laddar…"-textrader (appstarts-gaten och rot-Suspense-fallbacken).
- Varm start är helt tyst — det befintliga E2E-kontraktet för varm/offline-start utan synlig laddning är regressionsgolv.
- Router-loaders för djuplänks-fallet ingår INTE (separat spår, tråd T90).
- Terminologin är ORDLISTA-låst: Förberedelseskärmen, Startvärmningen.

### Testbeslut

Externt beteende, inte implementationsdetaljer. Huvudskarv: den befintliga persist-cache-sviten i e2e-klassen (äger redan varm/offline-kontrakten) utökas med kallstartsfallet — skärm visas, bar fylls, släpper till färdigt Hem utan skeleton. Warmup-motorns logik (settled-räkning, timeout, online-gate, seed-delning) testas i den snabba hermetiska klassen utan staging-beroende. Skärmens tillgänglighet (förlopps-annonsering, reducerad rörelse) går in i befintliga a11y-svepet. Inga nya testklasser.

### Utanför omfattningen

- Router-loaders / djuplänks-readiness (tråd T90).
- Ändringar i poll-kadens eller cache-nyckelstruktur utöver seed-delningen.
- Bootstrap-endpoint server-side (Airtable saknar formen; omprövas vid Fas E).
- Fix-vågen för vyernas "Laddar…"-textrader (Laddtrappans PRD).

### Estimat

5 skivor, storleksklass medium: warmup-motorn med hermetiska tester · Förberedelseskärmens UI · integrationen i render-gaten inklusive ersättningen av appnivå-textraderna · e2e-kallstartsfallet · dokumentations-/QA-svepet.

### ADR-koppling

ADR-112 (detta besluts bärare, mintad i samma landning) · ADR-037 (render-gaten som utökas) · ADR-017 (poll-scopet som består) · ADR-072 (persist-lagret) · ADR-078 (INSTANT-regeln, orörd) · ADR-113 (Laddtrappan — skärmen är trappans steg 3 på appnivå).

### Ytterligare anteckningar

Grillad samsyn S102 Del 7 (Marcus kvittens 2026-08-15); research-underlag i app-startup-warmup-research-filen (2026-08-15). Airtable-väggen bokförd som P31 med Fas E-omprövningskrav.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
