---
id: TASK-218
title: 'PRD: Laddtrappan — yttrappa för laddindikatorer och fix-våg över textraderna'
status: To Do
assignee: []
created_date: '2026-08-15 08:33'
labels: []
dependencies: []
ordinal: 414000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Appens spec förbjöd alla spinners och "Laddar…"-textrader app-brett — men förbudet visade sig vara en agent-generalisering utan Marcus-beslut, koden motsäger det redan (sex branschkorrekta knapp-spinners på auth-ytorna), och 32 produktionsfiler bär fortfarande den förbjudna textrads-formen. Regeln och verkligheten pekar åt olika håll, och den som bygger en ny vy har inget sant facit att följa.

### Lösning

Spec-regeln nyanseras till Laddtrappan (ADR-113): skeleton för vyer och moduler med känd form · spinner enbart inne i arbetande knappar · determinate bar för längre kända förlopp · aldrig naken "Laddar…"-textrad som enda besked (S62-golvet orört). Button-primitiven får en isLoading-prop som bär knapp-spinnern med spärrat klickläge och skärmläsarbesked på biblioteksnivå, och en mekanisk fix-våg migrerar de 32 filerna till trappans rätta steg.

### Användarberättelser

1. Som Lotta vill jag att laddning ser likadan ut i hela appen, så att jag känner igen mig oavsett vilken flik jag står i.
2. Som Lotta vill jag att en knapp jag tryckt på visar att den arbetar och inte går att trycka på igen, så att jag aldrig råkar skicka något två gånger.
3. Som Lotta vill jag slippa nakna "Laddar…"-textrader som får sidan att hoppa när innehållet landar, så att skärmen känns stilla och färdig.
4. Som skärmläsaranvändare vill jag få laddbesked i korrekt artighetsnivå, så att rutinladdning inte avbryter mig som ett larm.
5. Som utvecklare vill jag ha en fyrstegs-regel med tydliga villkor per yttyp, så att jag väljer rätt indikator utan att gissa.
6. Som utvecklare vill jag att knapp-spinnern kommer gratis ur Button-primitiven, så att varje ny mutations-knapp får rätt beteende utan handbygge.
7. Som granskare vill jag att regelns ursprung och branschgrund är spårbara, så att nästa omprövning sker mot källor och inte mot minne.

### Implementationsbeslut

- Spec §15 skrivs om till Laddtrappans fyra steg; Lugnt laddläge kvarstår som överordnad princip (slutlig geometri från första bildrutan). ORDLISTA-posterna Laddtrappan + uppdaterade Lugnt laddläge är redan landade och är vokabulär-facit.
- Button-primitiven får isLoading: spinner + spärrat klickläge + skärmläsarbesked inbyggt; de sex handkodade auth-ställena migreras till propen. Laddbeskedets artighetsnivå följer status-formen (polite), inte alert — den FK-avvikelse research-passet fann bokförs i spec-texten.
- Fix-vågen är mekanisk och AFK-bar: varje av de 32 filerna migreras till trappans rätta steg (skeleton där geometrin är känd; sr-only-besked parat med synlig indikator). Vågen ändrar laddform, aldrig beteende eller datahämtning.
- Appnivåns två textrader ingår INTE i vågen — de ersätts av Förberedelseskärmen (ADR-112-PRD:n) och räknas bort ur vågens mängd om den PRD:n landar först; överlappet stäms av vid skivning.
- Kodkommentarernas stale spec-radreferens (off-by-14) rättas i vågen där filer ändå rörs.

### Testbeslut

Externt beteende. Button isLoading verifieras i den hermetiska visual-sviten (primitivens lägen) och i befintliga a11y-svepet (besked + spärrat läge). Fix-vågens ytor bärs av sina befintliga acceptance-/e2e-tester — vågen är beteendeneutral, så gröna befintliga sviter är kravet; visual-sviten fångar formskiften på de facit-låsta vyerna. Inga nya testklasser.

### Utanför omfattningen

- Förberedelseskärmen och startvärmningen (egen PRD).
- Nya skeleton-varianter utöver befintliga (byggs först vid faktiskt behov).
- Retroaktiv omdesign av redan skeleton-migrerade ytor.

### Estimat

4 skivor, storleksklass medium: spec §15-omskrivningen · Button isLoading + auth-migreringen · fix-vågen över textrads-filerna (kan delas i två våghalvor vid skivning om mängden kräver) · QA-svepet.

### ADR-koppling

ADR-113 (detta besluts bärare, mintad i samma landning) · ADR-112 (Förberedelseskärmen — trappans steg 3, överlappet vid appnivå-textraderna) · ADR-078 (INSTANT-regeln, orörd).

### Ytterligare anteckningar

Grillad samsyn S102 Del 7 (Marcus kvittens 2026-08-15). Forensiken om förbudets ursprung: sessionsdok S102 Del 7. Research-underlag i loading-indikator-research-filen (2026-08-15) med beslutsmatrisen.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
