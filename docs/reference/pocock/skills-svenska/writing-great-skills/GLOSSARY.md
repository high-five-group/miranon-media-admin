# Ordlista — att bygga fantastiska skills

Domänmodellen för vad som gör en skill fantastisk. En skill finns för att utvinna determinism ur ett stokastiskt system; varje term nedan är ett verktyg för det målet. Detta är den publicerade referensen för [`writing-great-skills`](SKILL.md).

**Fetstilta termer** i en definition definieras i sin tur i denna ordlista; hitta dem via deras rubrik.

## Språk

### Förutsägbarhet

I vilken grad en skill får agenten att bete sig på samma *sätt* vid varje körning — samma process, inte samma utdata (en brainstorming-skill bör *förutsägbart* divergera; dess token varierar, dess beteende gör det inte). Grunddygden som alla andra termer tjänar — kostnad och underhållbarhet är följder av den, inte rivaler.

_Undvik_: konsekvens, tillförlitlighet, robusthet, utdatadeterminism

### Modellanropad

En skill som behåller fältet **beskrivning**, så att agenten kan se den och starta den autonomt — och människan fortfarande kan skriva dess namn, vilket innebär att modellanrop alltid *inkluderar* mänsklig räckvidd. Det finns inget läge för enbart modellen: en beskrivning *lägger endast till* agentupptäckt, den tar aldrig bort människans. Den betalar en permanent **kontextbelastning** vid varje tur i utbyte mot denna upptäckbarhet. Den kan nås av andra skills, eftersom beskrivningen som gör den upptäckbar för agenten också gör den anropbar. En modellanropad skill vars innehåll enbart är **referens** är också ett hem för delad referens: en annan skill kan anropa den, så referens som flera skills behöver kan bo på ett ställe. Välj modellanrop endast när agenten själv måste kunna nå skillen; om den aldrig startas annat än för hand, ta bort beskrivningen och undvik kontextbelastningen.

_Undvik_: förmåga, verktyg, kapacitet

### Användaranropad

En skill vars **beskrivning** har tagits bort — osynlig för agenten och möjlig att nå endast genom att människan skriver dess namn (användar-*endast*, där **modellanropad** är användar-*och-agent*). Byter bort agentens upptäckbarhet mot noll **kontextbelastning**. Eftersom den saknar beskrivning kan inget utom människan nå den: ingen annan skill kan starta den.

_Undvik_: procedur, arbetsflöde, kommando

### Beskrivning

Skillens maskinläsbara trigger och den enda **kontextpekare** som en **modellanropad** skill tvingas ha laddad hela tiden. Dess blotta existens *är* anropsaxeln: behåll den och skillen är modellanropad (och nåbar av andra skills); ta bort den och skillen är **användaranropad**, nåbar endast för människan. Källan till en modellanropad skills **kontextbelastning**.

_Undvik_: frontmatter, sammanfattning

### Kontextpekare

En referens som hålls i agentens kontext, som namnger material utanför kontexten och kodar villkoret för att nå det. **Beskrivningen** är kontextpekaren på högsta nivån (kontextfönster → skill); pekare till publicerade filer är samma objekt en nivå ned. Dess formulering, inte dess mål, avgör *när* och *hur tillförlitligt* agenten når materialet. Ett oumbärligt mål bakom en svagt formulerad pekare är en variansbugg: rätta först formuleringen och lägg materialet inline endast om skärpningen misslyckas.

_Undvik_: länk, referens, import

### Kontextbelastning

Kostnaden en **modellanropad** skill lägger på agentens kontextfönster — dess **beskrivning**, som alltid är laddad och förbrukar både token och uppmärksamhet. Det som **användaranropade** skills slipper genom att inte ha någon beskrivning, och bromsen mot att dela upp i fler modellanropade skills.

_Undvik_: tokenkostnad, kontextsvällning

### Kognitiv belastning

Kostnaden en **användaranropad** skill lägger på människan — det som måste hållas i huvudet: vilka skills som finns och när var och en ska användas (människan är indexet). Det som **modellanrop** eliminerar genom att göra skillen upptäckbar för agenten, och bromsen mot att dela upp i fler användaranropade skills. Det är inte en kostnad som ska minimeras: den är priset för mänskligt handlingsutrymme och skälet till att vissa skills förblir användaranropade. Lägg den där mänskligt omdöme spelar roll; avlägsna den där det inte gör det.

_Undvik_: mänskligt index, börda, overhead

### Granularitet

Hur finfördelat du delar upp skills. En finare indelning förbrukar en av de två belastningarna: fler **modellanropade** skills förbrukar **kontextbelastning** (fler beskrivningar trängs i fönstret och konkurrerar om uppmärksamhet); fler **användaranropade** skills förbrukar **kognitiv belastning** (fler för människan att komma ihåg och välja). Två snitt styr uppdelningen. Efter **anrop** bryter du ut en modellanropad skill där du har ett tydligt **ledord** som triggar den — ett triggerord som du faktiskt använder i dina prompts. Efter **sekvens** delar du en följd av **steg** där ett stegs **steg efter slutförande** behöver döljas, eftersom isolering i en egen kontext rensar bort det som följer. Akta dig för motsatsen: att slå samman sekvenser exponerar varje stegs steg efter slutförande för det som följer och bjuder in till för tidigt slutförande.

_Undvik_: chunkning, modularitet

### Router-skill

En **användaranropad** skill vars uppgift är att peka på dina andra användaranropade skills — namnge var och en och när den ska användas — så att människan har en skill att komma ihåg i stället för många. Den kan bara ge en fingervisning, aldrig starta dem: användaranropade skills har ingen **beskrivning**, så inget utom människan kan nå dem. Botemedlet mot **kognitiv belastning** när användaranropade skills blir många.

_Undvik_: dispatcher, meny, register, index, routerprocedur

### Informationshierarki

En skills innehåll, rangordnat efter hur omedelbart agenten behöver det — en enda stege som skapas genom två snitt: i filen eller bakom en pekare, och steg eller referens. Nivåerna:

- **Steg** — i filen, primära
- **Referens**, i filen — sekundär
- **Referens**, publicerad — bakom en **kontextpekare**

En skill utan **steg** använder bara de två nedersta nivåerna — ofta en legitimt platt mängd jämbördiga delar (t.ex. varje regel i en granskning på samma nivå), vilket är en fin ordning, inte ett varningstecken. Hierarkin är oberoende av anrop: en skill kan vara modell- eller användaranropad oavsett om den består enbart av steg, enbart av referens eller av båda. När en skill har steg begraver referens i filen som borde publiceras dessa steg och gör uppmärksamheten på dem till en slantsingling — ett verktyg för varians, inte bara för läsbarhet. Håll stegens topp läsbar; flytta ner allt som går.

_Undvik_: struktur, organisering, layout

### Samlokalisering

Att hålla materialet en agent behöver samtidigt på ett ställe — ett begrepps definition, regler och förbehåll under en enda rubrik, inte utspridda i filen — så att läsning av en del för med sig dess grannar. Den interna motsvarigheten till **informationshierarkin**: hierarkin rangordnar *hur långt ner* en del ligger; samlokalisering avgör *vad som ligger bredvid den* när den väl är där. Det finns ingen formel för rätt format för en mängd **referens**; testet är att en skill ska läsas som dokumentation skriven för agenten, och att grupperat material gör det där utspritt material inte gör det. Skilj från **duplicering**: den upprepar en betydelse på två ställen, medan spridning fragmenterar en enda betydelse över många.

_Undvik_: gruppering, klustring, sammanhållning

### Gren

Ett distinkt sätt en skill kan anropas på — ett fall som skillen hanterar — så att olika körningar tar olika vägar genom den. En skill med många steg kan bära många grenar; en linjär har inga.

_Undvik_: väg, fall, förgrening

### Progressiv informationsdelning

Att flytta **referens** nedför stegen — ut ur `SKILL.md` och bakom en **kontextpekare** — så att toppen förblir läsbar. Det är inte främst en tokenoptimering; det är hur **informationshierarkin** skyddas. Det möjliggörs av **förgrening**: publicera det endast vissa grenar behöver, lägg inline det varje väg behöver, och om en pekare aktiveras opålitligt för oumbärligt material, skärp dess formulering och dra tillbaka materialet inline endast om det misslyckas.

_Undvik_: lat laddning, chunkning

### Steg

De ordnade åtgärder agenten utför — när en skill har dem är de den primära innehållsnivån och den del som förtjänar sin plats i `SKILL.md`. Alla skills har inte steg: en skill kan bestå enbart av steg (`tdd`), enbart av **referens** (en granskning), eller av båda, oberoende av anrop. Varje steg avslutas med ett **slutförandekriterium**, tydligt eller vagt.

_Undvik_: arbetsflöde, instruktioner, koreografi

### Slutförandekriterium

Villkoret som talar om för agenten att en arbetsenhet är klar — målet den bedömer mot. Två egenskaper gör det till ett verktyg, inte bara en kvalitet. Dess **tydlighet** (kan agenten skilja klart från inte klart?) motstår **för tidigt slutförande** — en vag gräns (”förståelse uppnådd”) låter agenten förklara arbetet klart och glida till nästa steg; denna axel behöver *steg* för att ha verkan, eftersom för tidigt slutförande är ett fel mellan steg. Dess **krav** (hur mycket det kräver) styr **grundarbete** — ”varje ändrad modell redovisad” tvingar fram noggrant arbete där ”ta fram en ändringslista” inte gör det — och denna axel är *inte* bunden till steg: den kan även binda en platt referensmängd, vilket är hur en skill utan steg ändå kan bära en uttömmandehetsribba (”varje regel tillämpad”). De starkaste kriterierna är både kontrollerbara och uttömmande.

_Undvik_: klartvillkor, exitvillkor, stoppregel

### Steg efter slutförande

De **steg** som följer det aktuella steget. När de är synliga drar de agenten framåt mot **för tidigt slutförande** — ju mer den ser, desto starkare drag; försvaret är att dölja dem genom att dela sekvensen av steg i två delar.

_Undvik_: horisont, krigsdimma, framförhållning

### Grundarbete

Arbetet en agent utför bakom kulisserna inom ett enskilt steg — läser filer, utforskar kodbasen, gör ändringar, gräver fram vad den behöver i stället för att lasta över det på användaren. Det ligger under stegstrukturen: skrivs aldrig som ett eget steg, är latent i formuleringen och styrs av agenten snarare än skillen. Motsvarigheten inom ett steg till draget mellan steg från **steg efter slutförande**. Det ökas av ett **ledord** (_comprehensive_, _thorough_) eller av ett **slutförandekriterium** som kräver att arbetet är uttömmande — inklusive krav-axeln tillämpad på platt referens, vilket driver en skill med platt referens att täcka alla nivåer. Det blir tunt antingen när kravet saknas eller när **för tidigt slutförande** avkortar steget.

_Undvik_: omfattning, ansträngning, flit, täckning

### Referens

Material som agenten hänvisar till vid behov — definitioner, fakta, parametrar, exempel, villkorliga instruktioner. När en skill har **steg** är det sekundärt till dem; när en skill saknar steg är det hela innehållet; eller så lever det helt utanför alla skills — se **extern referens**. Nåbart via **kontextpekare** och den främsta kandidaten för **progressiv informationsdelning**.

_Undvik_: stödmaterial, dokumentation, bakgrund

### Extern referens

**Referens** som lever utanför skillsystemet — en vanlig fil, utan **beskrivning**, utan **steg**, inte anropbar — som vilken skill som helst kan peka på. Hemmet för delad referens som inte behöver aktiveras på egen hand, och det enda delade hemmet två **användaranropade** skills kan använda, eftersom ingen av dem har en beskrivning och därför inte kan starta den andra.

_Undvik_: dokument, resurs, kunskapsbas

### Ledord

Ett kompakt begrepp — även kallat ett *Leitwort* — som redan finns i modellens förträning och som agenten tänker med när den kör skillen. Det kodar en beteendeprincip i så få token som möjligt genom att aktivera tidigare kunskap modellen redan har (t.ex. _lesson_, _proximal zone of development_, _fog of war_, _tracer bullets_). Upprepat som en token, aldrig som en mening, samlar det en distribuerad definition genom skillen och förankrar ett helt beteendeområde. Att mynta ett eget ord fungerar om du definierar det tydligt, men ett påhittat ord aktiverar ingen tidigare kunskap — du betalar i definitionstoken för det som ett förtränat ord ger gratis. Välj i första hand ett befintligt ord.

Ett ledord tjänar **förutsägbarheten** på två sätt. I brödtexten förankrar det **utförandet** — agenten väljer samma beteende varje gång begreppet förekommer, och inom platt referens fokuserar det uppmärksamheten på en klass av saker att leta efter och aktiverar rätt kontroller varje körning. I **beskrivningen** förankrar det **anropet** — och inte bara inom skillen: när samma ord finns i dina prompts, din dokumentation och din kodbas länkar agenten det delade språket till skillen och aktiverar den mer tillförlitligt. Formulera en beskrivning med de ledord du faktiskt använder när du vill ha skillen.

_Undvik_: nyckelord, term, motiv

### Enda sanningskälla

Det önskade tillståndet där varje betydelse finns på exakt en auktoritativ plats, så att en ändring av skillens beteende är en ändring på ett ställe. **Duplicering** bryter mot det.

_Undvik_: hem, kanonisk plats

### Relevans

Huruvida en rad fortfarande har bäring på vad skillen gör — linsen för vad som ska behållas. En rad förlorar relevans antingen genom att aldrig ha bäring på uppgiften (ren exposition eller en **gren** som bör publiceras) eller genom att bli inaktuell: glida ur datum när beteendet eller världen den beskriver förändras. Kortare skills är enklare att hålla relevanta, eftersom varje rad är billigare att kontrollera. Skilj från **no-op**: relevans frågar om en rad berör uppgiften, inte om den förändrar beteendet.

_Undvik_: bärande, inaktualitet, aktualitet

## Fellägen

### För tidigt slutförande

Att avsluta det aktuella steget innan det verkligen är klart, eftersom agentens uppmärksamhet glider till att bli klar snarare än till arbetet. Ett fel mellan steg: det kräver **steg** för att inträffa — en skill utan steg som avbryter tidigt är inte för tidigt slutförande utan tunt **grundarbete** under ett ouppfyllt krav. En dragkamp mellan två krafter: synliga **steg efter slutförande** (draget framåt) och **slutförandekriteriets** tydlighet (motståndet — en skarp, kontrollerbar ribba håller; en vag ger vika). Luddighet är det nödvändiga villkoret: en skarp gräns motstår draget oavsett hur många senare steg som syns, så ett steg som aldrig skyndas igenom behöver inget försvar. Två verktyg håller ett steg som gör det, men använd dem i ordning: **skärp först gränsen** — det är lokalt och billigt. Bara när kriteriet är oåterkalleligt luddigt *och* du faktiskt ser rusningen ska du **dölja de senare stegen** — och döljandet fungerar bara över en verklig kontextgräns (en användaranropad överlämning eller delegering till en subagent; ett inline-anrop till en modellanropad skill lämnar de senare stegen i kontexten och rensar inget). En orsak till tunt grundarbete, men skilt från det: grundarbetet kan vara tunt även när ett steg körs till fullständigt slutförande.

_Undvik_: för tidig stängning, rusningen, att skynda, genvägar

### Duplicering

Samma betydelse given fler än en **enda sanningskälla**. Det kostar underhåll (ändrar du ett ställe måste du ändra de andra), kostar token och blåser upp framträdandet — att upprepa en betydelse viktar den på stegen över dess verkliga rang. Den oavsiktliga motsatsen till ett **ledord**, som höjer uppmärksamheten med avsikt genom att upprepa en token, aldrig betydelsen.

_Undvik_: repetition, redundans

### Sediment

Lager av gammalt innehåll som samlas i en skill och aldrig rensas bort, eftersom det känns tryggt att lägga till och riskabelt att ta bort — så inaktuella och irrelevanta rader ansamlas och du måste gräva dig igenom dem för att hitta det som fortfarande är aktuellt. Standardödet för varje skill utan beskärningsdisciplin; den långsamma erosionen av **relevans**, till skillnad från **duplicerings** upprepade betydelse.

_Undvik_: pålagring, svällning, skräp, förfall

### Sprawl

En skill som helt enkelt är för lång — för många rader i `SKILL.md` — oberoende av om de är inaktuella eller upprepade. Även en skill där allt är aktuellt och unikt kan ha sprawl. Det kostar läsbarhet (agenten vadar genom mer innan den kan agera och uppmärksamheten tunnas ut över överskottet), underhållbarhet (varje extra rad är ytterligare en att hålla **relevant**) och token. Botemedlet är **informationshierarkin**: flytta **referens** ner bakom **kontextpekare** och dela efter **gren** eller sekvens så att varje väg bara bär vad den behöver. Skilj från **sediment** (längd från ansamlad inaktualitet) och **duplicering** (längd från upprepad betydelse) — sprawl är längden i sig, oavsett dess orsak.

_Undvik_: svällning, längd, storlek, ordrikedom

### No-op

En instruktion som inte förändrar något eftersom modellen redan gör det som standard — du betalar belastning för att säga något agenten ändå skulle göra. Testet: förändrar en rad beteendet jämfört med standarden? En rad kan vara helt **relevant** och ändå vara en no-op. Samma tidigare kunskap som gör ett **ledord** gratis gör en no-op värdelös.

Ett ledord är en *teknik*; No-op är ett *omdöme* om en rad — och de korsar varandra. Ett ledord som är för svagt för att slå standardbeteendet är en no-op (_be thorough_ när agenten redan är ganska thorough), och lösningen är ett starkare ord som klarar omdömet (_relentless_), inte en annan teknik. No-op-testet — förändrar det beteendet jämfört med standarden? — är alltså också hur du bedömer om ett ledord förtjänar sina upprepningar. Detta är modellrelativt, inte läsarrelativt: två personer som är oense om huruvida en rad är en no-op är oense om standardbeteendet och avgör det genom att köra skillen, inte genom debatt.

_Undvik_: redundant instruktion, att upprepa självklarheter, att överförklara
