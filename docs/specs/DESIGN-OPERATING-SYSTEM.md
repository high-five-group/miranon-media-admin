
# DESIGN OPERATING SYSTEM

*Hur manifestet omsätts i verkligt arbete.*

## Syfte

Manifestet säger **vad vi tror**.  
Detta dokument säger **hur vi arbetar**.

Det finns för att göra kvalitet reproducerbar. Inte beroende av humör, talangtoppar eller enstaka starka dagar. Varje ny vy, komponent, feature eller förändring ska kunna gå genom samma system och bli bättre av det.

---

## I. Arbetsordningen

Varje initiativ går genom sju steg. Ordningen bryts inte utan starkt skäl.

### 1. Orsakskedja

Kartlägg varför problemet existerar.

Inte symptom. Inte önskemål. Inte lösningsidéer.  
Orsak → verkan → följdproblem → beteendekonsekvens.

Målet är att se om problemet ska lösas genom tillägg, borttagning, omstrukturering eller omdefinition.

**Leverabel:** en enkel orsakskedja i klartext.

Exempel:

- information kommer sent
- därför behöver admin kontrollera manuellt
- därför öppnas flera vyer
- därför uppstår osäkerhet
- därför ökar kognitiv belastning och felrisk

### 2. Scenario

Beskriv ett verkligt ögonblick.

Inte featurelista. Inte wireframe.  
Ett konkret läge i en konkret människas dag.

Scenariot ska svara på:

- Vem möter detta?
- I vilket tillstånd är personen?
- Vad försöker personen förstå, känna eller få bekräftat?
- Vad måste bli tydligt snabbt?

**Leverabel:** ett kort scenario i löptext.

Bra scenario:
> Hon öppnar systemet innan första mötet. Hon har begränsad tid och vill omedelbart veta om något kräver åtgärd.

Dåligt scenario:
> Användaren ska kunna se dashboard, filtrera data och navigera till detaljvy.

### 3. Eliminering

Skriv ned allt som medvetet inte ska byggas.

Detta är ett av de viktigaste stegen.  
Här skyddas projektet från överbygge.

Frågor:

- Vad kan tas bort helt?
- Vad kan slås ihop?
- Vad kan lösas uppströms?
- Vad verkar viktigt men är egentligen restinformation?
- Vad ökar yta utan att öka klarhet?

**Leverabel:** eliminationslista.

Format:

- Medvetet inte byggt
- Medvetet förenklat
- Framtida prövning

### 4. Beteendeprinciper

Formulera 3–5 testbara regler som ska gälla för lösningen.

Inte stämningar. Inte slogans.  
Regler för faktiskt beteende.

Bra exempel:

- Kritiska avvikelser ska kunna identifieras inom 4 sekunder.
- Nästa steg ska alltid vara synligt utan tolkning.
- Statusändring ska ge tydlig återkoppling direkt.
- Systemet ska premiera snabb väg till svar framför maximal informationsmängd.

Dåligt exempel:

- Det ska kännas enkelt.
- Det ska vara användarvänligt.
- Det ska vara modernt.

**Leverabel:** 3–5 beteendeprinciper.

### 5. Struktur och subtraktion

Nu får något byggas.

Men första versionen är inte svaret. Den är råmaterialet för subtraktion.

Arbetssätt:

- bygg enklaste fungerande struktur
- ta bort ett element i taget
- testa om beteendeprinciperna fortfarande uppfylls
- fortsätt tills nästa borttagning skadar funktion eller klarhet

Det som återstår är inte det minsta möjliga i abstrakt mening. Det är det minsta som fortfarande gör rätt beteende möjligt.

**Leverabel:** minimal struktur.

### 6. Sensorisk kalibrering

När strukturen håller börjar kalibreringen.

Här justeras inte ytan för att “snygga till”. Här förstärks beteende och tillståndsförändring.

Fyra arbetsfrågor:

#### Temperatur

Vilken grundkänsla ska ytan ge?  
Trygg? Skarp? Varm? Neutral? Handlingsinriktad?

#### Rytm

Hur snabbt ska ögat röra sig?  
Långsamt och lugnt? Direkt och fokuserat?

#### Volym

Vad ska tala högt? Vad ska viska?  
Visuell hierarki, kontrast, vikt, typografi.

#### Textur

Hur känns ytan?  
Stram, mjuk, teknisk, varm, klinisk, friktionsfri?

All sensorik måste stödja samma intention. Om struktur säger en sak och estetik säger en annan uppstår inre friktion.

**Leverabel:** kalibrerad helhet.

### 7. Stresstest

Det som fungerar i lugn miljö kan falla sönder i verkligheten.

Testa därför under sämre förhållanden:

- låg uppmärksamhet
- brådska
- missförstånd
- små skärmar
- avbrutet fokus
- felaktig input
- tom data
- överfull data
- dålig uppkoppling
- tangentbord och skärmläsare
- reducerad rörelse

Frågan är inte om allt känns elegant i idealfallet.

Frågan är:  
**håller rätt beteende fortfarande?**

**Leverabel:** verifierat stresstest eller lista på brister.

### [GA] 8. Golden Master-test

Innan något släpps ska det testas under **sämsta möjliga förhållanden** — samtidigt:

- 320px bredd (minsta stödda viewport)
- Offline (flygplansläge)
- VoiceOver aktiverat
- `prefers-contrast: more`
- `prefers-reduced-motion: reduce`
- Tom data (inga event, inga anmälningar)
- Överfull data (100+ event, 500+ personer)
- Expired auth-session (token utgånget)
- Simulerad 3G-uppkoppling (Chrome DevTools throttling)

**Varje avvikelse dokumenteras.** Det som inte fungerar under dessa förhållanden är inte klart.

Apple kallar detta "test on the oldest supported device with everything against you". Det som överlever Golden Master-testet är redo.

### [GA] Chaos testing (automatiserat stresstest)

Utöver manuell stresstest: automatiserade chaos-tester i Playwright:

```javascript
// Playwright chaos-test: alla API-anrop misslyckas
test('app visar felmeddelande vid total API-kollaps', async ({ page }) => {
  await page.route('**/api/**', route => route.abort());
  await page.goto('/hem');
  await expect(page.getByText('Senaste versionen')).toBeVisible();
});
```

Täcker: API-fel, timeout, offline, korrupt data, expired auth.

**Leverabel:** gröna chaos-tester i CI.

---

## II. De tre obligatoriska dokumenten

Varje fas eller större initiativ ska lämna efter sig tre saker.

### 1. Beteendespecifikation

Korta testbara påståenden om vad som ska hända.

Exempel:

- Obetalda anmälningar ska kunna identifieras inom 4 sekunder.
- Sökning ska börja ge signal om riktning inom 200 ms.
- En statusändring ska kännas avslutad utan att användaren tvekar på om den gick igenom.

### 2. Eliminationslista

Allt som medvetet inte byggdes och varför.

Detta skyddar projektet mot framtida uppluckring.

### 3. Friction log

Dokumenterad genomgång av upplevelsen där varje tvekan, väntan eller osäkerhet skrivs ned.

---

## III. Friction logs

Friction logs är det mest konkreta sättet att upptäcka verklig kvalitetsbrist.

### Protokoll

1. Öppna upplevelsen som om det vore första gången idag  
2. Gå igenom ett realistiskt scenario  
3. Markera varje ögonblick av tvekan, irritation, väntan eller feltolkning  
4. Ta screenshot eller notering  
5. Kategorisera problemet  
6. Åtgärda eller dokumentera som medveten skuld

### Fyra kategorier

- **Utility** — löser detta det faktiska problemet?
- **Usability** — går det att förstå och använda utan onödig tolkning?
- **Craft** — är detaljer, feedback, tillstånd och övergångar genomtänkta?
- **Beauty** — känns helheten professionell, sammanhängande och värd att lita på?

---

## IV. Kvalitetsbedömning

Varje komponent eller vy bedöms i fyra dimensioner. Ingen dimension får falla ihop bara för att de andra är starka.

### 1. Tillgänglighet

Kan fler faktiskt använda det här, även under andra förutsättningar än standard?

Kontrollera minst:

- kontrast
- fokus
- tangentbord
- skärmläsarlogik
- reduced motion
- tydliga tillstånd
- felmeddelanden
- mobil verklighet
- [GA] ARIA 1.3-attribut (aria-errormessage, aria-description)
- [GA] EAA-checklista (European Accessibility Act, i kraft sedan juni 2025)
- [GA] Kognitiv tillgänglighet (WCAG 2.2 §2.4.11, §2.5.7, §2.5.8)
- [GA] Manuell VoiceOver-genomgång (axe fångar bara 30-40%)

### 2. Teknisk kvalitet

Är lösningen robust, begriplig och hållbar?

Kontrollera minst:

- tydlig struktur
- konsekvent namngivning
- defensiva gränser
- tydliga states
- återanvändbara mönster
- ingen onödig komplexitet

### 3. Återanvändbarhet

Är detta byggt som ett undantag eller som en del av ett system?

Kontrollera minst:

- tokens i stället för hårdkodning
- tydliga props och gränssnitt
- portabel logik
- skalbar copy-struktur
- inga lokala speciallösningar utan god orsak

### 4. Craft

Känns det genomarbetat eller bara färdigt?

Kontrollera minst:

- alla tillstånd hanterade
- konsekvent copy
- rätt feedback på rätt ställe
- sensorisk koherens
- frånvaro av onödig friktion
- tydlig orsak/verkan i interaktioner

---

## V. Poängmodell

Om du vill använda en poängmodell, använd den som internt verktyg, inte som självändamål.

Rekommenderad skala: **1–5 per dimension**

### 1 — Otillräckligt

Brister som påverkar funktion eller förtroende tydligt.

### 2 — Svagt

Grunden finns, men lösningen kräver omtag.

### 3 — Godkänt

Fungerar, men utan tydlig excellens.

### 4 — Starkt

Genomtänkt, robust och tydligt bättre än standard.

### 5 — Exceptionellt

Nästan inget känns kvarlämnat åt slumpen.

Detta är enklare och sannare i praktiken än 11-skalan, om ni verkligen ska använda det operativt.

Om du vill behålla 11-skalan som kulturell symbol går det, men då bör den ligga i ett separat “craft rubric”-dokument.

---

## VI. Beslutsregler

När osäkerhet uppstår används dessa regler i ordning:

### Regel 1

Välj det som minskar kognitiv belastning.

### Regel 2

Välj det som gör nästa steg tydligare.

### Regel 3

Välj det som kräver minst förklaring.

### Regel 4

Välj det som fungerar under sämre förhållanden.

### Regel 5

Välj det som stärker systemet, inte bara den lokala lösningen.

### Regel 6

När två lösningar verkar likvärdiga, välj den med mindre yta.

---

## VII. AI i arbetsflödet

AI får användas i fyra lägen:

### Utforska

Generera alternativ, copy, komponentriktningar, strukturvarianter.

### Destillera

Sammanfatta, identifiera mönster, hitta överlapp, formulera eliminationsförslag.

### Implementera

Producera kod, dokumentation, states, testutkast, struktur.

### Granska

Jämföra nytt arbete mot principer, tokens, beteendespecifikation och tidigare mönster.

AI får inte:

- slutgodkänna smak
- avgöra vad som är viktigt
- introducera komplexitet utan uttryckligt skäl
- ersätta mänskligt ansvar för prioritering och subtraktion

---

## VIII. Definition av klart

Något är inte klart när det fungerar.

Det är klart när:

- orsaken till behovet är förstådd
- eliminationslistan finns
- beteendeprinciperna är skrivna
- strukturen har subtraherats
- de viktigaste tillstånden är kalibrerade
- stresstest är gjort
- friction log är genomförd
- kvarvarande skuld är känd och medveten

---

## IX. Det sista kontrolltestet

Innan något släpps ställs fyra frågor:

1. Löser detta det verkliga problemet eller bara den begärda lösningen?  
2. Är nästa steg tydligt utan att vi gömmer oss bakom förklaring?  
3. Finns det något här som ännu inte förtjänat sin plats?  
4. Blir människans tillstånd bättre när hon möter detta?

Om sista svaret är svagt är arbetet inte färdigt.

---

## Slutrad

*Manifestet ger riktning.*  
*Systemet ger disciplin.*  
*Kvalitet uppstår när båda får styra samma arbete.*
