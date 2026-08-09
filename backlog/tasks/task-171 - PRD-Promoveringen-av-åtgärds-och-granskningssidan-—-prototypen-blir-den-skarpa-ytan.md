---
id: TASK-171
title: >-
  PRD: Promoveringen av åtgärds- och granskningssidan — prototypen blir den
  skarpa ytan
status: Done
assignee: []
created_date: '2026-08-09 08:07'
updated_date: '2026-08-09 12:59'
labels: []
dependencies: []
ordinal: 314000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Lotta kan inte nå någon åtgärdsyta i den skarpa appen — och det hon skulle nå finns redan färdigt. Åtgärds- och granskningssidan itererades genom 23 konvergensvarv (S100) till Marcus ord "Vi är nära facit nu", och hela formen ligger landad i main som prototyp-grindad kod. Men formen är obevisad (inga referenser), olåst (Marcus facit-låste aldrig — S100 stängdes utan femte resume) och onåbar som skarp yta. ADR-103 har avskaffat "skarpa bygget" som väg: formen ska PROMOVERAS, inte återbyggas. Eventsidans promoverade "Gå till åtgärder"-kort väntar dessutom på sin hopkoppling — bokad som eget arbete när S100:s yta deklarerades klar, vilket nu har skett.

### Lösning

Den etablerade promoverings-kedjan (162-familjens mönster, ADR-103 B2) tillämpas på åtgärds-/granskningssidan: Marcus facit-låser ytan vid dev-servern (HITL-förkrav — där döms också S100:s öppna formval) → ariaSnapshot-referenser tas i den hermetiska fixturvärlden och facit-manifestet utvidgas → formvillkoren flippas så prototypformen blir den ovillkorliga, med datavägarna orörda → härdning (a11y-golvet, test-konsument-svepet, städ) → Marcus granskar och godkänner via !-kanalen (ADR-104-stämplingen, i drift) → variant-koden rivs mekaniskt och visual-baslinjen omtas som regressionslås.

### Användarberättelser

1. Som Lotta vill jag nå åtgärdssidan direkt med mitt markerade urval från eventsidans deltagarregister, så att jag slipper välja om.
2. Som Lotta vill jag mötas av exakt samma personkort jag markerade, i markeringsläge, så att jag känner igen mig i det ögonblick kontinuiteten behövs mest.
3. Som Lotta vill jag se "N av M deltagare markerade" som listans huvud med korten infällda, så att åtgärderna syns direkt utan scroll.
4. Som Lotta vill jag kunna gå till åtgärdssidan utan event och börja i eventväljaren, så att sidan står på egna ben.
5. Som Lotta vill jag granska utskicket på en egen sida där urvalsfiltret biter och platshållarna är ifyllda, så att jag ser exakt det som går ut.
6. Som Lotta vill jag varnas i klartext om en platshållare står ofylld, så att ett mail med "{deadline}" i texten aldrig går ut.
7. Som Lotta vill jag se utfallet i tre ärliga lägen på samma yta som granskningen, så att jag vet hur många som lyckades, vilka som föll och varför.
8. Som Lotta vill jag att "Utskicket lyckades" bara står där när det faktiskt lyckades, så att jag kan lita på det jag ser.
9. Som Marcus vill jag facit-låsa ytan innan referenserna tas, så att grinden mäter mot det jag faktiskt godkänt.
10. Som Marcus vill jag döma de öppna formvalen (delutfallets ruta-placering, fallna kortens gröna form, avmarkeringen, hover-scopet) i låsnings-momentet, så att inget odömt fryses som facit av misstag.
11. Som Marcus vill jag att varje promoverad yta bevisas med ariaSnapshot-par, så att ett tredje läge aldrig landar obemärkt.
12. Som Marcus vill jag granska den promoverade ytan mot facit-bilderna och godkänna via !-kanalen, så att godkännandet är min handling och ingen annans.
13. Som utvecklare vill jag att datavägarna behålls orörda vid flippen, så att ett formbyte aldrig ändrar datakälla.
14. Som utvecklare vill jag att ALLA test-konsumenter av ytan sveps och uppdateras i samma skiva som flippen, så att 162.3-felet (fyra missade filer) inte upprepas.
15. Som utvecklare vill jag att rivningen fäller CI om godkännandet saknas, så att kedjan inte kan självbetjänas.

### Implementationsbeslut

- Promoveringsordningen per ADR-103 B2: facit-låsning (HITL-förkrav, ingen skiva) → referenser → flipp → härdning → QA/stämpling → rivning. Referens-skivan bär låsningen som AC-villkor: facit låst av Marcus med citat bokfört FÖRE referenstagning.
- Datavägs-invarianten: form-grenar flippas, datakälla-grenar promoveras inte. OBS-läge unikt för denna yta: S100 rev read-only-invarianten öppet — betalningsytan skriver redan skarpt mot staging. Härdningen prövar skrivvägarna explicit i stället för att anta read-only.
- Referenserna tas i den hermetiska fixturvärlden; åtgärdssidan saknar fixturer i dag — referens-skivan bygger dem (tomt läge, mottagarurval, granskningsläge, tre utfallslägen). Facit-manifestet utvidgas med åtgärds-/granskningsytan så check-facit-invarianten (godkand null ⇒ markörer kvar) täcker den.
- Test-konsument-svepet är eget AC på flipp-skivan: grep-svep över alla testfiler som konsumerar ytan/routerna, uppdaterade i samma skiva — aldrig separat.
- Stämplingen per ADR-104: Marcus kör facit:godkann via !-kanalen; skriptet, hooken och grinden finns och är skarpbevisade (167-leveransen).
- Hopkopplingen (eventsidans Gå till åtgärder-kort → sidan, hem-vyns ingång) är formens sista länk MEN villkorad: den exponeras inte i produktion förrän sidans handlingar inte ljuger — sändvägen ägs av task-147. Skivan bokförs och sekvenseras öppet mot 147, parkeras aldrig tyst.
- Bindestrecks-svepet (scope A, eget kort) sekvenseras: åtgärds-/granskningsytans filer är redan kortstreckade i synlig text (S100); sveper kortet ändå dessa filer sker det FÖRE referenstagningen eller EFTER rivningen — aldrig mitt i kedjan (referenserna fäller på textskillnad).

### Testbeslut

- Externt beteende: ariaSnapshot + skärmdump mot renderad yta, aldrig interna props eller implementationsdetaljer.
- Primär skarv (kvitterad av Marcus 2026-08-09): hermetiska fixturvärlden. Sekundär: test-konsument-svepet. API-skarven orörd — inga datavägar ändras.
- Bevis-loopen som arbetsform i varje utförar-uppdrag: skärmdump → jämför → lista skillnader → fixa; körningen lämnar spår, inte en bock.
- A11y-golvet 11 består; axe-pass i härdningen. Visual-baslinjen omtas EFTER godkännande, aldrig före.

### Utanför omfattningen

- Server-utskicken, sändvägs-greningen, betalningsvertikalens funktion och kvittoserien — task-147.
- Flaggformen för framtida prototyper (ADR-103 B3) — gäller från nästa prototyp.
- Bindestrecks-svepet — eget kort (scope A, Marcus-beslut 2026-08-09).
- Dokument-ytan — parkerad sedan S100:s andra paus.
- Godkännande-mekanikens vidareutveckling — ADR-104 styr; inget byggs här.

### Estimat

5 skivor + 1 villkorad: referenser+fixturer+manifest (M) · flipp+test-konsument-svep (M) · härdning (S) · Marcus QA + stämpling (ready-for-human) · rivning+regressionslås (S) · hopkopplingen (S, villkorad mot 147:s sändväg).

### ADR-koppling

ADR-103 (styrande promoveringsform) · ADR-104 (godkännande-mekaniken) · ADR-102 (facit-principen) · ADR-074 (växlaren; railen är byggställning tills rivningsskivan) · ADR-067 (post-send-formens D3-grund) · ADR-096/097 (arbetsformen). Inga nya över-bar-beslut väntas; uppstår ett mintas det separat och refereras.

### Ytterligare anteckningar

Facit-låsningens dagordning (S100:s öppna formval, döms vid låsningen): delutfallets ruta-placering · fallna kortens gröna markerings-form · avmarkerings-beteendet · hover-scopet · tom-markören "—" (BEHÅLLS per Marcus 2026-08-09) · task-147 AC #9 (de sex åtgärdstyperna återges av Marcus — naturligt moment vid låsningen). Underlag: S100 sessionsdok Del 4–7, S93 Del 12–14, processaudit-syntesen. Detta är promoveringsformens ANDRA tillämpning — den första med granskningsyta och skarpa skrivvägar i prototypen.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter)
- [x] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i skivans PR
- [x] #7 Datavägs-invarianten verifierad: inga datakälla-grenar flippade
- [x] #8 Test-konsument-svepets träffyta bilagd (grep-svep) och alla träffar uppdaterade i samma skiva som sin flip
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FACIT-LÅST 2026-08-09 (S93-resumen, Marcus i klartext, verbatim): "Du får göra bedömningen om granulariteten och beroendena. Och inget borde väl blockera nu, jag låser Åtgärdssidan och Granskningsidan (och granskningssidans olika ytor/lägen) som facit. Det är okej för v1, jag vill att de blir 'skarpa' sidor i appen nu." — Låsningen täcker därmed också S100:s tidigare odömda formval (delutfallets ruta-placering, fallna kortens gröna form, avmarkerings-beteendet, hover-scopet) som de står, för v1. Ändring efteråt = ny iteration per ADR-104 beslut 4. task-147 AC #9 (de sex åtgärdstyperna) förblir ÖPPEN — hör till 147:s åtgärdsvals-skiva, blockerar inte promoveringen. Referens-grinden är därmed avblockad; skivorna 171.1-171.7 publicerade samma dag.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
PRD:t fullbordat 2026-08-09, samma dag det mintades — promoveringsformens ANDRA tillämpning, första med granskningsyta: 171.1 referenserna (#1037; divergens-fyndet: ingen variant-gren, eget manifest per ADR-104 beslut 1) · 171.2 flippen = noll-diff + markör-registrering + test-konsument-svep (#1039) · 171.3 härdningen (#1041; ett äkta serious-a11y-fynd fixat utan aria-träd-ändring) · 171.4 Marcus stämpling via !-kanalen (#1044, kanalseparationen höll) · 171.5 rivningen (#1046; PrototypRigg kvar DEV-grindad som testinfrastruktur) · 171.7 QA-vandringen kvitterad 'Ser bra ut. Vi kör vidare'. Regressionslåset: referenser 40/40 utan omtagning + baslinje-run 31311560867 NOLL drift. DoD #5-#8 belagda per skiva (se respektive final summary). KVARSTÅENDE ÖPPET, medvetet: 171.6 hopkopplingen (To Do, hård dep task-147 — sidan blir prod-nåbar först när sändvägen finns; dep:en flyttas till 147:s sändvägs-skiva när den mintas). Ytan är därmed skarp i appen men onåbar för Lotta tills 147 — exakt den sekvens PRD:n speccade.
<!-- SECTION:FINAL_SUMMARY:END -->
