---
name: writing-great-skills
description: Referens för att skriva och redigera skills väl — ordförrådet och principerna som gör en skill förutsägbar.
disable-model-invocation: true
---

En skill finns för att utvinna determinism ur ett stokastiskt system. **Förutsägbarhet** — att agenten följer samma _process_ vid varje körning, inte att den producerar samma utdata — är grunddygden; varje verktyg nedan tjänar den.

**Fetstilta termer** definieras i [`GLOSSARY.md`](GLOSSARY.md); slå upp dem där för den fullständiga innebörden.

## Anrop

Två val, som byter mellan olika kostnader:

- En **modellanropad** skill behåller en **beskrivning**, så att agenten kan starta den autonomt _och_ andra skills kan nå den (du kan fortfarande skriva dess namn). Den bidrar till **kontextbelastning** — beskrivningen ligger i fönstret varje tur. Praktiskt: utelämna `disable-model-invocation` och skriv en modellriktad beskrivning med tydliga triggerfraser (”Använd när användaren vill…, nämner…”).
- En **användaranropad** skill tar bort beskrivningen från agentens räckvidd: bara du, genom att skriva dess namn, kan anropa den — och ingen annan skill kan. Noll kontextbelastning, men den förbrukar **kognitiv belastning**: _du_ är indexet som måste komma ihåg att den finns. Praktiskt: sätt `disable-model-invocation: true`; `description` blir människoorienterad — en sammanfattning på en rad, utan triggerlistor.

Välj modellanrop endast när agenten själv måste kunna nå skillen, eller när en annan skill måste kunna göra det. Om den enbart startas för hand, gör den användaranropad och undvik kontextbelastning.

När användaranropade skills blir fler än du kan komma ihåg, botar en **router-skill** den ackumulerade kognitiva belastningen: en användaranropad skill som namnger de andra och anger när var och en ska användas.

## Att skriva beskrivningen

En modellanropad **beskrivning** har två uppgifter — att säga vad skillen är och att lista de **grenar** som ska trigga den. Varje ord ökar **kontextbelastningen**, så en beskrivning förtjänar ännu hårdare beskärning än brödtexten:

- **Lägg skillens ledord först** — beskrivningen är där ordet gör sitt anropsarbete.
- **En trigger per gren.** Synonymer som döper om samma gren är **duplicering** — ”bygg funktioner med TDD … ber om test-first-utveckling” är en gren skriven två gånger. Slå ihop dem; behåll endast verkligt separata grenar.
- **Skär bort identitet som redan finns i brödtexten.** Låt beskrivningen innehålla triggers, plus en eventuell räckviddsklausul av typen ”när en annan skill behöver…”.

## Informationshierarki

En skill byggs av två innehållstyper — **steg** och **referens** — som kan blandas fritt: en skill kan bestå enbart av steg, enbart av referens, eller av båda. Kärnbeslutet är vilken typ som ska användas och var varje del placeras i **informationshierarkin**, en stege rangordnad efter hur omedelbart agenten behöver materialet:

1. **Steg i skillen** — en ordnad åtgärd i `SKILL.md`, den primära nivån: vad agenten gör, i ordning. Varje steg avslutas med ett **slutförandekriterium**, villkoret som talar om för agenten att arbetet är färdigt. Gör det _kontrollerbart_ (kan agenten skilja klart från inte klart?) och, när det spelar roll, _uttömmande_ (”varje ändrad modell redovisad”, inte ”ta fram en ändringslista”) — ett vagt kriterium bjuder in till **för tidigt slutförande**.
2. **Referens i skillen** — en definition, regel eller fakta i `SKILL.md`, som konsulteras vid behov. Ofta en legitimt platt mängd jämbördiga delar (varje regel i en granskning på samma nivå) — en fin ordning, inte ett varningstecken. _Denna skill är helt referensmaterial._
3. **Extern referens** — referens som flyttas ut från `SKILL.md` till en separat fil, nås genom en **kontextpekare** och laddas bara när pekaren aktiveras. (Det sträcker sig från _publicerad_ referens — en syskonfil som `GLOSSARY.md`, fortfarande del av skillen — till helt **extern referens** som lever utanför skillsystemet och som alla skills kan peka på.)

Ett krävande slutförandekriterium driver gediget **grundarbete** — det utforskande agenten gör inom arbetet — oavsett om skillen har steg eller inte, eftersom ”varje regel tillämpad” binder platt referens på samma sätt som ”varje steg klart” binder en sekvens.

Flytta ner för lite och toppen sväller; flytta ner för mycket och du döljer material agenten faktiskt behöver. Den spänningen är hela beslutet.

**Progressiv informationsdelning** är rörelsen nedför stegen — ut ur `SKILL.md` till en länkad fil — så att toppen förblir läsbar. Praktiskt: en länkad `.md`-fil i skillmappen, namngiven efter sitt innehåll (denna skill publicerar sina fullständiga definitioner till `GLOSSARY.md`). Vissa skills används på fler än ett sätt, och varje distinkt sätt är en **gren** — olika körningar som tar olika vägar genom skillen. Förgrening är det renaste testet för informationsdelning: lägg inline det varje gren behöver, och lägg bakom en pekare det bara vissa grenar når. Formuleringen i en **kontextpekare**, inte dess mål, avgör när och hur tillförlitligt agenten når materialet.

Medan stegen avgör _hur långt ner_ en del ligger, avgör **samlokalisering** _vad som ligger bredvid den_ när den väl är där: håll ett begrepps definition, regler och förbehåll under en rubrik i stället för utspridda, så att läsning av en del för med sig dess grannar.

## När du ska dela upp

**Granularitet** är hur finfördelat du delar upp skills, och varje snitt förbrukar en av de två belastningarna; dela därför endast när snittet förtjänar det. Två snitt:

- **Efter anrop** — bryt ut en **modellanropad** skill när du har ett tydligt **ledord** som bör trigga den på egen hand, eller när en annan skill måste kunna nå den. Du betalar **kontextbelastning** för den nya, alltid laddade **beskrivningen**, så den självständiga räckvidden måste vara värd det.
- **Efter sekvens** — dela en följd av **steg** när stegen som återstår (ett stegs **steg efter slutförande**) frestar agenten att skynda igenom det aktuella steget (**för tidigt slutförande**). Att hålla dem utom synhåll uppmuntrar agenten att göra mer **grundarbete** på den aktuella uppgiften.

## Beskärning

Behåll varje betydelse i en **enda sanningskälla**: en auktoritativ plats, så att en ändring av beteendet kräver en redigering på ett ställe.

Kontrollera varje rad för **relevans**: har den fortfarande betydelse för vad skillen gör?

Jaga sedan **no-ops** mening för mening, inte bara rad för rad: kör no-op-testet på varje mening för sig, och när en mening misslyckas, ta bort hela meningen i stället för att trimma ord i den. Var aggressiv — det mesta av den prosa som misslyckas ska bort, inte skrivas om.

## Ledord

Ett **ledord** är ett kompakt begrepp som redan finns i modellens förträning och som agenten tänker med när den kör skillen (t.ex. _lesson_, _fog of war_, _tracer bullets_). När det upprepas genom texten (men inte nödvändigtvis — ett starkt ledord kan behövas endast en gång) samlar det en distribuerad definition och förankrar ett helt beteendeområde i så få token som möjligt, genom att aktivera tidigare kunskap modellen redan har.

Det tjänar förutsägbarheten på två sätt. I brödtexten förankrar det _utförandet_: agenten väljer samma beteende varje gång ordet förekommer. I beskrivningen förankrar det _anropet_: när samma ord finns i dina prompts, dokument och din kod länkar agenten det gemensamma språket till skillen och aktiverar den mer tillförlitligt.

Leta efter möjligheter att refaktorera skills så att de använder ledord. En triad utskriven på tre ställen (**duplicering**), en beskrivning som använder en mening för att peka mot en idé — varje sådan passage ber om att **kollapsa** till en enda token. Exempel:

- ”snabb, deterministisk, låg overhead” -> _tight_ — en kvalitet som uttrycks om och om igen genom en fas — till ett enda förtränat ord (en _tight_ loop).
- ”en loop du litar på” -> _red_ — omvandlar en luddig tröskel till ett binärt observerbart tillstånd (loopen blir _red_ för buggen, eller så blir den inte det).

Du vinner dubbelt: färre token _och_ en skarpare krok för agentens tänkande. Utgå från att varje skill bär på omformuleringar som ledord kan pensionera — hitta dem.

## Fellägen

Använd dessa för att diagnostisera problem användaren kan ha med skillen.

- **För tidigt slutförande** — att avsluta ett steg innan det verkligen är klart, när uppmärksamheten glider till _att bli klar_. Försvar, i ordning: skärp först slutförandekriteriet (billigt, lokalt); bara om det är oåterkalleligt luddigt _och_ du observerar rusningen, dölj stegen efter slutförandet genom att dela upp (sekvenssnittet).
- **Duplicering** — samma betydelse på fler än ett ställe. Det kostar underhåll och token och blåser upp en betydelses framträdande plats i stegen bortom dess verkliga rang.
- **Sediment** — inaktuella lager som lägger sig eftersom det känns tryggt att lägga till och riskabelt att ta bort. Standardödet för varje skill utan beskärningsdisciplin.
- **Sprawl** — en skill som helt enkelt är för lång, även när varje rad är aktuell och unik. Det försämrar läsbarhet och underhållbarhet och slösar token. Botemedlet är stegen: publicera **referens** bakom pekare och dela efter **gren** eller sekvens så att varje väg bara bär vad den behöver.
- **No-op** — en rad som modellen redan följer som standard, så att du betalar belastning för att inte säga något. Testet: förändrar den beteendet jämfört med standarden? Ett svagt ledord (_be thorough_ när agenten redan är ganska thorough) är en no-op; lösningen är ett starkare ord (_relentless_), inte en annan teknik.
