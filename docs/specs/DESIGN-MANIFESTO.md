# DESIGN MANIFESTO

*En konstitution för hur vi tänker om design.*

## Vad detta är

Detta är inte en stilguide.  
Inte en processbeskrivning.  
Inte en samling preferenser.

Detta är grunden.

Allt vi bygger filtreras genom detta dokument innan vi rör en pixel, skriver en rad kod eller väljer ett ord. Det finns för att skydda arbetet från slump, mode, överbygge och bekväma antaganden.

Det vilar på tre krafter:

- **Kirurgen** — skär bort det som inte behöver finnas
- **Poeten** — känner vad människan faktiskt möter
- **Systemet** — bevarar kvalitet när arbetet skalas

Kirurgen utan poeten blir kall.  
Poeten utan kirurgen blir diffus.  
Systemet utan båda blir byråkrati.

När alla tre verkar tillsammans uppstår det vi eftersträvar:

**design som förändrar människans tillstånd med minsta möjliga medel.**

---

## I. Först: obduktionen

Innan vi designar något obducerar vi antagandena.

Varje feature, vy, komponent, flöde och idé börjar med en fråga:

> Är detta en grundsanning eller en vana?

Vi antar ofta:

- att en ny funktion behövs
- att mer data ger mer klarhet
- att en ny sida löser ett nytt problem
- att fler val ger mer frihet
- att konventioner är säkra därför att de är vanliga

Oftast är inget av detta sant.

Det människor kallar designproblem är ofta rester av äldre beslut, dåliga överlämningar, rädsla för att ta bort, eller lydnad inför normer som inte längre tjänar situationen.

Därför ställs alltid en fråga först:

> Vad händer i människans liv som gör att detta problem uppstår?

Inte vad beställaren efterfrågar.  
Inte vad konkurrenten har byggt.  
Inte vad systemet redan råkar stödja.

Vi letar efter problemet bakom problemet.

---

## II. De oreducerbara sanningarna

När antaganden är borta finns några få sanningar kvar. Allt vi bygger måste vila på dem.

### 1. Människan reagerar på kontrast, mönster och avvikelse

Detta är inte trend. Det är perception. Blicken söker skillnad. Hjärnan söker ordning. Design som går emot detta kräver onödig ansträngning.

### 2. Uppmärksamhet är den knappaste resursen

Tid, energi, motivation och tålamod är begränsade. Varje element kostar. Varje val tömmer en reserv. Att lägga till är att belasta.

### 3. Det tydliga slår det förklarade

När något kräver förklaring ska första misstanken riktas mot designen, inte mot människan. Pedagogik kan ibland behövas, men den får aldrig användas för att dölja onödig komplexitet.

### 4. Varje designproblem är ett resursproblem

Verkliga människor möter inte produkter i neutrala tillstånd. De möter dem under tidspress, trötthet, stress, splittrad uppmärksamhet och låg tolerans för friktion. Det som byggs måste fungera där.

### 5. Form är billigare än någonsin. Omdöme är inte det

AI kan generera layout, variation, copy och kod. Det gör inte mänskligt omdöme mindre viktigt. Det gör det mer centralt. När exekvering blir billig stiger värdet på val, subtraktion och riktning.

### 6. Verktyg byts ut. Tänkesätt består

Inga beslut får vila på Figma, React, shadcn, Framer, Lovable eller något annat verktyg. Verktyg är tillfälliga. Perception, beteende och mänskliga begränsningar består.

---

## III. Intentionen

Före struktur, före copy, före layout, före färg finns en fråga:

> Vad ska förändras i människan som möter detta?

Detta är designens verkliga centrum.

Vi designar inte primärt för att visa information.  
Vi designar inte primärt för att möjliggöra handling.  
Vi designar för att åstadkomma en tillståndsförändring.

Från oro till kontroll.  
Från tvekan till beslut.  
Från brus till klarhet.  
Från motstånd till rörelse.

Om det vi byggt fungerar tekniskt men lämnar människan i samma tillstånd som innan, då har vi inte designat färdigt.

---

## IV. Nio principer

### 1. Eliminera, sedan designa

Det bästa gränssnittet är ofta borttagandet av orsaken till behovet. Vi bygger inte först och förenklar sen. Vi tar bort först och bygger bara det som överlever.

### 2. En människa, ett ögonblick

Vi designar inte för “användare”. Vi designar för en konkret människa i ett konkret läge. Abstrakta målgrupper gör tänkandet slappt. Verkliga ögonblick gör det skarpt.

### 3. Intentionen styr allt

Varje beslut måste kunna spåras tillbaka till önskad tillståndsförändring. Om kopplingen saknas är beslutet svagt.

### 4. Beteende är målet, form är medlet

Vi designar inte för att något ska se rätt ut. Vi designar för att rätt handling ska kännas självklar, möjlig och trygg.

### 5. Varje element har ett jobb

Ingen pixel, inget ord, ingen färg, ingen animation får existera av vana. Om ett element inte aktivt tjänar intentionen ska det bort.

### 6. Det osynliga räknas

Fokus, hover, laddning, felmeddelanden, tomma lägen, tangentbord, skärmläsare, print, mobilkanter, övergångar, språk, timing. Människor känner omsorg även när de inte kan namnge den.

### 7. Starka val slår neutral flexibilitet

Bra produkter försöker inte vara allt samtidigt. De väljer väg. De guidar. De tar ansvar. För många öppna möjligheter är ofta designens sätt att undvika att tänka klart.

### 8. System bär kvalitet över tid

Utan system blir kvalitet personberoende. Tokens, komponenter, regler och mönster gör att omsorg kan upprepas konsekvent.

### 9. Weniger, aber besser

Inte minimalism som estetik.  
Subtraktion som disciplin.  
Det som återstår efter att allt oviktigt tagits bort ska inte kännas tomt. Det ska kännas koncentrerat.

---

## V. AI:s roll

AI har tre legitima roller i designarbetet:

### Materialutforskning

Det genererar variationer snabbt och gör sökningen bredare.

### Konsekvensvakt

Det hjälper till att hålla system, copy, mönster och komponenter sammanhängande.

### Exekveringsarm

Det producerar utkast, kod, struktur och implementering i hög hastighet.

Men det finns en gräns:

**AI får accelerera form. Det får inte ersätta omdöme.**

AI känner mönster.  
Det känner inte ansvar.  
Det känner inte timing.  
Det känner inte när något måste dö för att helheten ska leva.

Därför är AI råmaterial, förstärkare och verktyg. Inte smakdomare.

---

## VI. Det slutgiltiga testet

I slutänden reduceras allt till en fråga:

> När människan öppnar detta mitt i sitt verkliga liv — blir hennes nästa rätta steg tydligare eller tyngre?

Eller ännu enklare:

> Andas hon ut?

Om ja, är vi nära sanningen.  
Om nej, finns det fortfarande något kvar som inte förtjänat sin plats.

---

## Slutrad

*Nio principer. En avsikt. En disciplin.*

*Design är inte att lägga till form.*  
*Design är att ta ansvar för människans nästa tillstånd.*
