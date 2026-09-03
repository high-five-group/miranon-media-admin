---
id: TASK-374
title: >-
  PRD: Promovering av B3 — Intresserade-listan från konvergensyta till skarp vy
  (ADR-103 B2)
status: To Do
assignee: []
created_date: '2026-09-03 09:18'
labels: []
dependencies: []
ordinal: 675000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Lotta ser i dag en Intresserade-lista som är K0-baslinjen: rader där namnlösa intresserade visas som "Namnlös person" med initialer byggda ur en platshållare, "Nappat på"-listor som dubbleras, ingen sökning, ingen sortering, och rader som varierar i höjd beroende på vad som råkar finnas på personen. Mer än hälften av de intresserade i prod saknar namn (mätt 2026-09-03: 112 intresserade, 63 utan namn, 0 utan e-post), så listan är svårläst just där den används mest. Den form Marcus itererat till klar och stämplat som facit finns bara bakom en DEV-växel och når aldrig Lotta förrän den promoveras.

### Lösning

Den stämplade konvergensformen blir den enda Intresserade-vyn i appen, i prod. Lotta får en lista där varje intresserad visas med bästa tillgängliga identifierare som primär rad (namnet när det finns, annars e-posten), e-post eller en dämpad "Namnlös intresserad" som sekundär rad, en aktivitetsrad med "N dagar sedan · Hämtade <erbjudande>", och antalet hämtningar som en jämnbred pill i högerkolumnen. Alla rader är exakt lika höga oavsett innehåll. Ovanför listan finns sökning på namn eller e-post och en sorteringskontroll i husets form (senaste interaktion som default, namn A till Ö som växel). Prototypens växel, variant-URL och fyllnadsdata försvinner; den skarpa datavägen (alla intresserade via cursorloopen) behålls oförändrad.

### Användarberättelser

1. Som Lotta vill jag att Intresserade-listan i prod ser ut exakt som den form Marcus godkände, så att det jag granskar i staging är det jag använder.
2. Som Lotta vill jag söka på namn eller e-post i listan, så att jag hittar en intresserad utan att rulla.
3. Som Lotta vill jag sortera på senaste interaktion eller namn A till Ö, så att listan följer det jag letar efter.
4. Som Lotta vill jag se e-posten som identitet när namnet saknas, så att 63 rader inte säger samma platshållare.
5. Som Lotta vill jag att sekundärraden markerar namnlösa dämpat, så att jag ser att namnet saknas utan att det tar över raden.
6. Som Lotta vill jag se antalet hämtningar som en pill med samma bredd på alla rader, så att kolumnen ligger rakt.
7. Som Lotta vill jag att alla rader är exakt lika höga, så att listan går att skumma.
8. Som Lotta vill jag se hur länge sedan senaste interaktion var och vad den gällde, så att jag vet hur varm kontakten är.
9. Som Lotta vill jag se hur många träffar en sökning gav, så att jag vet om listan är filtrerad.
10. Som skärmläsaranvändare vill jag att antalet träffar annonseras när jag söker, så att jag inte behöver leta efter räknaren.
11. Som tangentbordsanvändare vill jag nå sökfältet, sorteringen och varje rad i ordning med synligt fokus, så att vyn fungerar utan mus.
12. Som skärmläsaranvändare vill jag att sorteringen är en riktig listbox med tillgängligt namn, så att jag hör alternativen.
13. Som Lotta vill jag att en tom lista, ett fel och ett laddläge visas begripligt, så att jag vet vad som händer.
14. Som Lotta vill jag att en sparad gammal länk med variant-parametern visar samma vy som utan, så att inget beror på en URL som inte längre betyder något.
15. Som Lotta vill jag att listan visar alla intresserade i prod, inte bara första sidan, så att ingen försvinner.
16. Som Lotta vill jag att vyn fungerar i utskrift, med hög kontrast och med reducerad rörelse, så att den håller husets golv.
17. Som Marcus vill jag granska den promoverade ytan mot facit-bilden innan växeln rivs, så att det som rivs är växlar, aldrig formen.
18. Som Marcus vill jag att formen bevisas identisk före och efter rivningen, så att godkännandet inte urholkas av städningen.
19. Som Marcus vill jag att den visuella baslinjen tas om efter godkännandet och aldrig före, så att regressionslåset bär den godkända formen.
20. Som Code vill jag att facit-grinden förblir grön genom rivningen, så att promoveringen inte fäller andra ogodkända manifest.
21. Som utvecklare vill jag att git bär filflytten som rename, så att formens historik följer med.
22. Som Marcus vill jag ett QA-pass i staging och prod med riktig data efter landningen, så att prod-effekten är sedd, inte antagen.

### Implementationsbeslut

- **Facit är auktoritativt (ADR-102 B1):** manifestet `tasks/sessions/bilagor/s114-intresserade-konvergens/facit.json`, stämplat av Marcus 2026-09-03 (sha b391dffe, citat "Det blir bra, vi stämplar denna som klar"). En yta: `intresserade-lista`, med bilden `facit-intresserade-lista.png` (desktop 1440×907, fyllnadsdata). Källor: prototypkomponenten och routen. Bilden slår varje prosabeskrivning, inklusive denna.
- **Promoveringsordning enligt ADR-103 B2:** (1) referenser och härdning i variant-läge, (2) flippen: konvergensformen blir ovillkorlig och tar den skarpa komponentens namn och plats via rename så git bär historiken; datavägen är oförändrad (samma query-nyckel, cursorloopen, retry-predikatet som inte retryar 4xx, startvärmningens prefetch), (3) Marcus granskar den promoverade ytan mot facit-bilden och kvitterar i chatten (manifestet är redan stämplat; ADR-104 beslut 4 gäller: en medveten formändring efter stämpeln är en ny iteration med ny stämpel), (4) rivning: variant-växeln, variant-posten i prototyp-railen, dataläget "fyll" och fyllnadsfabriken, prototypmappen töms; markören `IntresseradeKonvergens` avregistreras ur facit-policyn i SAMMA commit eftersom facit-grindens markörkontroll är global och två andra manifest är ogodkända. Prototyp-railen som sådan rivs inte, den är en stående dev-komponent som B2 använder.
- **Härdning som INTE ändrar formen (ADR-103 B5):** ett testid-ankare på ytans alla tre render-grenar (laddar, fel, lista) för grinden; en artig live-region som annonserar träffantalet vid sökning; fyllnadsradernas typomvandling försvinner med fyllnadsläget. Sökfältet behålls som det stämplades (nativt sökfält med synlig etikett); ett byte till husets SearchField ändrar formen och är en ny iteration. Sök- och sorteringstillstånd förblir lokalt komponenttillstånd.
- **Vad som utgår ur vyn per facit:** "Nappat på"-listan över alla hämtade erbjudanden visas inte; aktivitetsraden bär senaste interaktion. Rullup-fältet finns kvar i datan.
- **Namnlösa:** primär rad e-post, sekundär rad "Namnlös intresserad" i dämpad stil; neutral ikon i samma storlek som initialavataren (36 px); aldrig initialer ur en platshållare. Sortering på namn sorterar på primärraden.
- **Radhöjd:** innehållsoberoende genom tre höjdreserverade, trunkerade rader och en avatarstorlek; DOM-mätt 80 px per rad i både smal och bred vyport.
- **Pill:** fast bredd via osynlig storleksgivare "00 hämtningar" i samma cell, texten centrerad; tresiffriga tal växer cellen i stället för att klippas.
- **Manifestets referenser:** innehållslås via sha256 läggs inte till; ett stämplat manifest är agentfruset i sin helhet och en amendering vore en sidofil. Bokfört som medvetet utelämnat, samma som 21 av 22 tidigare stämplade ytor.

### Testbeslut

- **Primär skarv, befintlig:** acceptance-sviten för Intresserade (hermetisk fixturvärld, mockad get-leads, blockerande i CI). Skrivs om till den nya anatomin: rader med primär och sekundär rad, aktivitetsrad, pill; sökning och sortering; namnlös med e-post ger e-posten som primär rad; tom lista; 4xx ger alert utan retry; laddläge med aria-busy; axe noll fynd på tom, fylld och fel-läge. Testa externt beteende (synlig text, roller, tillgängliga namn), aldrig klassnamn eller pixlar.
- **B4-paret, ny grind-spec efter anmälningssidans mall:** ariaSnapshot per läge (fylld, tom) i desktop och mobil, referensen tagen FÖRE flippen ur variant-läget i en egen commit, EFTER mot den promoverade adressen med samma namn; tvåsidigt bevisad (grön på identisk yta, röd på avsiktligt muterad); stale variant-URL renderar identiskt med ingen parameter; axe på samma ytor plus felläget. Referenserna kräver båda vyporterna.
- **Visuell baslinje, befintlig:** de fyra baslinjebilderna för Intresserade om-baselinjeras via CI-workflowen efter Marcus godkännande, bokfört i commit-meddelandet som avsiktligt.
- **API-tester orörda:** get-leads och cursorloopen ändras inte.
- Förebilder i kodbasen: promoveringsskivorna för anmälningssidan (enskiva-formen) och dokumentytan (renodlad B2-skiva) samt check-in-familjens referens- och rivningsskivor.

### Utanför omfattningen

- Utskicks-ingången och publiktypen "Alla intresserade" (6h, det smalnade sändningskortet).
- Radklick till persondetalj: finns varken i skarpa vyn eller i facit; en ny iteration med ny stämpel.
- Byte till husets SearchField och URL-buret sök- och sorteringstillstånd: ny iteration.
- B2, segmentlistan: eget PRD efter egen stämpel, körs av S117.
- Dubblettfyndet i prod-basen (en e-post på två Personer-rader): basfråga av task-260-klassen.
- Sidofyndet att listan renderade utan synlig inloggning i en devtools-webbläsare: prövas i QA-skivan, åtgärdas inte här.

### Estimat

5 skivor: referenser och härdning (S, AFK), flippen med acceptance-omskrivning (M, AFK), Marcus granskning av den promoverade ytan (XS, HITL), rivning med baslinje (S, AFK), QA-vandring (S, HITL).

### ADR-koppling

ADR-102 (prototypen är facit), ADR-103 (promoveringsformen; B2 ordningen, B4 bevisen, B5 HITL/AFK-gränsen), ADR-104 (stämpeln är Marcus handling; beslut 4 om ändring efter stämpel), ADR-105 (review-grinden per kod-PR), ADR-115 § Updates (intresserade blir aldrig segment), ADR-097 (push-ekonomi, en push per färdig enhet), ADR-074 (växlar och snapshot-par). Inget beslut i denna arbetsenhet passerar ADR-baren.

### Ytterligare anteckningar

- Prod-mätning 2026-09-03 med EF:ens lead-filter, read-only: 112 intresserade, 63 utan namn (namnet finns bara i Förnamn där det finns), 0 utan e-post. QA:n granskar mot riktig data.
- Skarv-bedömningen gjord på Marcus mandat 2026-09-03 ("Du har mandat att bedöma skarvarna och gå vidare").
- Narrativ: sessionsdok S114 Del 3 (våg B-besluten), Del 4 (K1-scaffold), Del 5 (K2 och K3, prod-mätningen, facit-landningen och stämpeln).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 check-facit.sh exit 0 efter skivan — markör-invarianten (c) är global, avregistrering i samma commit som rivning (ADR-102 B3)
- [ ] #5 ariaSnapshot-paret grönt i BÅDA vyporterna där skivan rör ytan (ADR-103 B4)
<!-- DOD:END -->
