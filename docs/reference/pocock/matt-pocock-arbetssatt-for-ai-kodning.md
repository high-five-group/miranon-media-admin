# Matt Pococks arbetssätt för AI-kodning

## Nollkontext-briefing för en kodagent

Detta är en operativ sammanfattning av Matt Pococks arbetssätt i *AI Coding for Real Engineers*. Den är skriven för att en agent som inte känner projektet eller kursen ska kunna tillämpa metoden direkt.

**Börja här:** behandla inte en ny uppgift som en kodprompt. Utforska först repot, grilla fram ett delat designkoncept, fånga osäkerhet med research/prototyp, gör målet till en PRD, dela upp det i vertikala issues och implementera sedan en verifierbar skiva i en ren session. Om något är oklart: gå uppströms i stället för att gissa nedströms.

## Agentens första minut: Matts standardrutin

Följ denna ordning. Gå inte vidare bara för att agenten har en rimlig gissning.

1. **Utforska** den relevanta koden, ordlistan och ADR:erna.
2. **Grilla** idén med människan — en fråga i taget — tills ett delat designkoncept finns. I kod: använd `/grill-with-docs`; utanför kod: `/grill-me`.
3. **Pausa för research eller prototyp** när fakta, teknikval, logik eller UX inte är säkra. Återvänd sedan till grillningen med det ni lärt er.
4. **Syntetisera till PRD**; börja inte en ny intervju. PRD:n är målet och de bestående besluten.
5. **Bryt ned till Kanban-issues** som tracer-bullet-skivor. Människan godkänner granularitet, beroenden och vilka som kräver HITL.
6. **Implementera en skiva i taget** i en ny/ren session: förstå → planera vid behov → bygg → kör riktiga feedback-loopar → committa.
7. **Låt människan QA:a** mot PRD:n. Allt som saknas blir ett tydligt nytt issue, inte ett bortglömt muntligt önskemål.

### Tre stoppregler

- Behövs smak, produktbeslut eller manuell bedömning? **Stanna och gör det HITL.**
- Saknas en snabb signal som kan bli röd för felet? **Bygg återkopplingsslingan före fixen.**
- Börjar en arbetsenhet bli kontexttung? **Committa, rensa och starta en ny session eller gör handoff.**

### Kärnan på en minut

Målet är **inte** att få AI:n att skriva mest möjligt kod. Målet är att skapa en ingenjörsprocess där AI:n får:

- ett tydligt, gemensamt beslut om vad som ska byggas,
- en kodbas som är lätt att förstå och testa,
- smala, självständiga arbetsenheter,
- konkreta återkopplingssignaler från typer, tester och QA,
- ren och relevant kontext vid varje uppgift.

Människan äger **smak, prioriteringar, produktbeslut, arkitektur och slutlig QA**. Agenten gör **utforskning, grovarbete, implementation och maskinell validering**. När dessa förutsättningar finns kan implementationen köras AFK (*away from keyboard*). När de saknas ska människan vara i loopen.

Den normala kedjan är:

```text
Grill → Research → Prototype → PRD → Issues → Implement → Review
```

Faserna är inte en ritual. Hoppa över research eller prototyp när frågan redan är besvarad. Hoppa däremot **inte** över grillning, återkoppling eller mänsklig bedömning bara för att agenten verkar självsäker.

---

## Matts skills: exakt karta från fas till körbar rutin

Länkarna nedan är relativa till detta dokument när det ligger i utbildningsmappen på skrivbordet. De går till de svenska versionerna av skillsen som följer med materialet. Läs skillen när du ska utföra fasen; sammanfattningen här förklarar varför och när.

| Situation | Skill | Vad den faktiskt gör |
| --- | --- | --- |
| En idé eller design behöver bli skarp | [`/grill-me`](./mattpocock-skills-svenska/grill-me/SKILL.md) → [`/grilling`](./mattpocock-skills-svenska/grilling/SKILL.md) | Intervjuar enträget, en fråga i taget, rekommenderar svar och utforskar repot i stället för att fråga om sådant koden kan besvara. |
| Kodidé med nya begrepp eller arkitekturval | [`/grill-with-docs`](./mattpocock-skills-svenska/grill-with-docs/SKILL.md) → [`/domain-modeling`](./mattpocock-skills-svenska/domain-modeling/SKILL.md) | Samma grillning plus löpande ordlista och sparsamma ADR:er. Detta är Matts normala kodflöde. |
| Samsyn ska bli måldokument | [`/to-prd`](./mattpocock-skills-svenska/to-prd/SKILL.md) | Syntetiserar den redan förda dialogen till PRD; den ska inte intervjua igen. |
| PRD/plan ska bli autonomt arbete | [`/to-issues`](./mattpocock-skills-svenska/to-issues/SKILL.md) | Skapar vertikala tracer-bullet-skivor, låter människan godkänna granularitet/beroenden och publicerar issues. |
| En osäker idé behöver provas | [`/prototype`](./mattpocock-skills-svenska/prototype/SKILL.md) | Väljer logikprototyp eller flera radikala UI-varianter utifrån den exakta fråga som ska besvaras. |
| Implementera med test-först | [`/tdd`](./mattpocock-skills-svenska/tdd/SKILL.md) | Driver Red–Green–Refactor vertikalt: ett beteende/test i taget via publika skarvar. |
| Svår bugg eller regression | [`/diagnosing-bugs`](./mattpocock-skills-svenska/diagnosing-bugs/SKILL.md) | Kräver en tight, röd-kapabel reproduktionsloop före hypotes och fix. |
| En session ska delas eller fortsätta senare | [`/handoff`](./mattpocock-skills-svenska/handoff/SKILL.md) | Skapar en temporär överlämning med mål, referenser och föreslagna nästa skills — utan att duplicera artefakter. |
| Arkitektur behöver förbättras | [`/improve-codebase-architecture`](./mattpocock-skills-svenska/improve-codebase-architecture/SKILL.md) + [`/codebase-design`](./mattpocock-skills-svenska/codebase-design/SKILL.md) | Hittar möjligheter att fördjupa moduler, visar kandidater och grillar den valda designen. |
| Projektet saknar spårning/konventioner | [`/setup-matt-pocock-skills`](./mattpocock-skills-svenska/setup-matt-pocock-skills/SKILL.md) | Konfigurerar issue-tracker, triageetiketter och domändokument innan engineering-skills används. |

`/do-work` är medvetet inte länkad: i kursen bygger man den som en **egen, kort, projektspecifik skill**. Dess jobb är endast: förstå → planera vid behov → implementera → validera med repots verkliga kommandon → committa.

### Vad som är specifikt för Matt — och vad som är en översättning

Detta dokument använder ibland generiska ord som “agent”, `AGENTS.md` och “issue-tracker” för att metoden ska fungera utanför ett enskilt verktyg. Matts konkreta kursupplägg är dock:

- **Claude Code** som interaktiv agent; `CLAUDE.md` är dess projektinstruktionsfil.
- **`/grill-with-docs` i kodprojekt** och **`/grill-me` utanför kod** som standardstart.
- **`/to-prd` utan ny intervju** och därefter **`/to-issues`** för att skapa en Kanban-graf av tracer bullets. I kursen kallades den tidigare kursvarianten `/prd-to-issues`.
- En egen projektspecifik **`/do-work`**-skill som driver implementation, återkopplingsslingor och commit.
- **Sandcastle/Ralph-liknande AFK-loopar** som hämtar `ready-for-agent`-arbete från GitHub Issues; agenten ska hoppa över HITL-issues.
- **Git-commits, `CONTEXT.md` och ADR:er** som beständiga artefakter mellan rena sessionsfönster.

Översättningen till andra agentverktyg är avsiktlig, men den får inte sudda ut dessa val. Om frågan är “hur jobbar Matt i praktiken?” ska punkterna ovan väga tyngre än generella AI-råd.

---

## Den praktiska huvudloopen

| Fas | Ägaren | Leverans | Frågan som fasen besvarar |
| --- | --- | --- | --- |
| 1. Grill | Människa + agent | Gemensam designförståelse; eventuellt ordlista/ADR | Vad menar vi egentligen? |
| 2. Research | Agent undersöker, människa väljer | Kort researchunderlag | Vilket angreppssätt är klokt? |
| 3. Prototype | Människa + agent | Tillfällig, körbar undersökning | Fungerar/känns idén rätt? |
| 4. PRD | Agent syntetiserar, människa godkänner | Produktkrav och bestående beslut | Vad är målet och vad ingår inte? |
| 5. Issues | Agent föreslår, människa granskar | Små vertikala skivor med beroenden | Vilket arbete kan göras självständigt? |
| 6. Implement | Ofta agent/AFK | Kod, tester, validering och commit per issue | Är en avgränsad skiva klar? |
| 7. Review | Människa, med agentstöd | QA-resultat och uppföljningsissues | Nådde vi rätt resultat och blev systemet bättre? |

Det centrala skiftet är att kvalitet flyttas **uppströms**. En dåligt specificerad idé blir inte bra av en längre implementationsprompt. Gör i stället idén testbar, besluten tydliga och arbetet litet nog att agenten kan få bra återkoppling.

---

## Varför processen ser ut så här

Detta är inte sju administrativa steg. Varje fas tar bort ett särskilt felsätt **innan** nästa, billigare fas får börja. Matts grundtes är att AI inte gör gammal ingenjörskonst överflödig; den gör den mer värdefull, eftersom en agent kan producera dålig kod och programvaruentropi mycket snabbare än en människa.

### 1. Grillning före plan och implementation: en plan är inte samsyn

Planering är värdefull eftersom samtalet tvingar fram utforskning och hjälper både människa och agent att förstå vad som ska byggas. Men Matt invänder mot hur vanligt planläge ofta går till: agenten utforskar, ställer en eller två frågor och producerar sedan en lång plan. Människan förväntas upptäcka eventuell missriktning genom att läsa väggen av text.

Det missar det som Frederick P. Brooks kallar ett **delat designkoncept**: den gemensamma, flyktiga förståelsen av designen — inte själva plandokumentet. Små missförstånd om beteende kan få stora följder i implementationen. Därför är `/grill-me` inte “mindre planering”; det är mer av den del som planläget ofta kortsluter: en lång intervju som går igenom beslutsträdet, löser beroenden och blottlägger okända okända innan kod skrivs.

Det är också därför agenten först ska utforska sådant repot kan besvara. Mänsklig uppmärksamhet ska användas till avsikt och avvägningar, inte till fakta som redan finns i koden. [Verifierat mot kursens **Lektion 23**](./ai-coding-for-real-engineers-svenska.md#lektion-23-varför-planläge-suger).

### 2. Research och prototyper före PRD: flytta osäkerhet till en billigare plats

Research finns inte för att göra processen dokumenttung. Den **cachar en dyr utforskningsfas**. Om en AFK-loop gång på gång måste läsa extern dokumentation, jämföra tjänster eller leta efter integrationsdetaljer, förbrukar varje körning kontext och token innan den ens börjar implementera. Ett granskat `research.md` låter senare körningar börja med relevant underlag och stanna längre i smartzonen.

Men research är HITL eftersom alternativ sällan väljs enbart på fakta. Valet mellan exempelvis två integrationssätt styrs av mänsklig smak, riskaptit och produktprioritering. Underlaget är en hjälp för beslutet, inte en ersättare för det. Det måste också tas bort eller uppdateras när förutsättningarna ändras; gammal Markdown förgiftar agentens kontext på samma sätt som gamla instruktioner gör. [Verifierat mot **Lektion 73: Research**](./ai-coding-for-real-engineers-svenska.md#lektion-73-research).

En prototyp löser en annan sorts osäkerhet: den gör en idé konkret. Där textbaserad planering försöker resonera fram rätt form kan en människa se, använda och reagera på en tillfällig UI-variant, tillståndsmodell eller tjänsteintegration. Matt använder den för att fånga okända okända och sätta sin smak **före** AFK-loopen. Den är därför särskilt värdefull för ny UX, nya verktyg och nya tjänster — men vanligen inte för en bugg där önskat beteende redan är känt, eller för en vanlig utbyggnad som följer etablerade mönster. [Verifierat mot **Lektion 76: Prototyping**](./ai-coding-for-real-engineers-svenska.md#lektion-76-prototyping).

### 3. PRD före issues: agenten behöver ett beständigt mål, inte bara nästa prompt

Stora uppgifter passar inte i ett enda kontextfönster. Matt använder därför PRD:n som platsen för målet: vad som ska byggas, vilken användarupplevelse som eftersträvas och vilka beslut människan har satt sin prägel på. Den kan följa med mellan sessioner och skalas till större byggen på ett sätt som en enskild konversation inte kan.

PRD:n följer efter grillning, research och prototyp därför att den ska vara en **syntes av etablerad förståelse**. Om den skrivs först blir den lätt agentens gissning om målet; om den skrivs efteråt blir den ett hållbart kontrakt för den fortsatta processen. [Verifierat mot **Lektion 36: Massiva uppgifter**](./ai-coding-for-real-engineers-svenska.md#lektion-36-så-hanterar-du-massiva-uppgifter) och [**Lektion 84: Det slutliga arbetsflödet**](./ai-coding-for-real-engineers-svenska.md#lektion-84-det-slutliga-arbetsflödet).

### 4. Issues och tracer bullets: hindra agenten från att springa längre än strålkastarljuset

Matt beskriver AI:s naturliga benägenhet som att den vill vara till lags genom att bygga en komplett lösning i ett stort språng. Den bygger då lager var för sig, validerar sent och kan investera enormt i fel antaganden. Resultatet är *slop*: mycket kod och en stor mänsklig granskningsbörda.

En tracer bullet är motmedlet: en liten, användbar väg från början till slut genom berörda lager. Den testas direkt, ger återkoppling på den kritiska vägen och validerar arkitekturen innan mer arbete investeras. Att därefter gå vidare till nästa vertikala skiva i en ny session gör att agenten arbetar inom strålkastarljuset i stället för i mörkret. [Verifierat mot **Lektion 41: Tracer bullets**](./ai-coding-for-real-engineers-svenska.md#lektion-41-vad-är-tracer-bullets).

Kanban ersätter sedan den stela flerfasplanen eftersom en beroendegraf går att ändra lokalt, tillåter oberoende arbete parallellt och låter QA skapa nya issues naturligt. I Matts slutliga modell visar ett issue både vad som ska byggas och vad som blockerar det; AFK-agenten tar endast de skivor som är redo. [Verifierat mot **Lektion 70: Planera inte — använd Kanban**](./ai-coding-for-real-engineers-svenska.md#lektion-70-planera-inte--använd-kanban).

### 5. Feedback-loopar och Red–Green–Refactor: ge agenten verkligheten, inte bara instruktioner

“Kod är billig” är, enligt Matt, fel slutsats. AI ökar takten på commits men är inte särskilt bra på de svåra ändringar som minskar programvaruentropi. Den kopierar dessutom kodbasens befintliga mönster mer än den följer en instruktion. En dålig kodbas med svaga tester lär därför agenten att göra mer av det som redan är svårt att ändra.

Återkopplingsslingor förvandlar kvalitet från en uppmaning till en observerbar signal. Typkontroll, tester, lintning, formattering, CI och manuell QA låter agenten jämföra sin kod med verkligt beteende och rätta sig. Ju bättre signal, desto bättre kan agenten arbeta iterativt i stället för att leverera en engångsgenerering. [Verifierat mot **Lektion 47: Är kod billig?**](./ai-coding-for-real-engineers-svenska.md#lektion-47-är-kod-billig) och [**Lektion 48: Återkopplingsslingor**](./ai-coding-for-real-engineers-svenska.md#lektion-48-styr-agenter-att-använda-återkopplingsslingor-med-skills).

Red–Green–Refactor gör den återkopplingen tät: ett test ska först falla för att bevisa att det är kopplat till verkligt beteende; den minsta implementationen får det sedan att passera; först därefter refaktoreras koden säkert. I kombination med tracer bullets undviker agenten både breda, horisontella testsviter och kod som driver iväg utan signal. [Verifierat mot **Lektion 54: Red–Green–Refactor**](./ai-coding-for-real-engineers-svenska.md#lektion-54-vad-är-redgreenrefactor).

### 6. AFK efter förarbete — och människa där smak krävs

När mål, väg, små skivor och feedback-loopar redan är definierade är “gör fas N” i praktiken en `for`-loop. Det är varför AFK är möjligt: människan behöver inte se varje implementationssteg när agenten redan har en tydlig riktning och kan kontrollera sitt arbete. Människan kan då parallellt planera framtida arbete eller QA:a andra resultat.

Men AFK är inte målet i sig och inte tillämpligt överallt. AI saknar en sanningskälla för vad som *bör* byggas och kan inte ersätta mänsklig smak. Planering, researchval, arkitektur, UX och slutlig QA kräver mänskligt omdöme: känns det rätt, är det tillräckligt snabbt, tjänar det användarens verkliga syfte? Att delegera även dessa beslut leder enligt Matt till en smaklös applikation som ofta inte fungerar. [Verifierat mot **Lektion 57: AFK-agenter**](./ai-coding-for-real-engineers-svenska.md#lektion-57-vad-är-en-afk-agent) och [**Lektion 69: HITL- och AFK-uppgifter**](./ai-coding-for-real-engineers-svenska.md#lektion-69-hitl--och-afk-uppgifter).

### 7. Ren kontext, dokumentation och djupa moduler: bygg ett externt minne som agenten kan lita på

Agenten är statslös. Den måste på nytt återskapa sin karta över repot, och när kontexten växer lämnar den Matts “smartzon”. Upprepad komprimering kan bevara nyttig information, men lämnar enligt hans erfarenhet sediment av gamla sammanfattningar som gör nästa beteende mindre förutsägbart. Därför föredrar han tydliga artefakter, commits, handoffs och nya sessionsfönster framför att bära allt i en växande konversation. [Verifierat mot **Lektion 26: Komprimering**](./ai-coding-for-real-engineers-svenska.md#lektion-26-komprimering).

Styrningen måste följa samma ekonomi. Innehållet i en stor `CLAUDE.md` laddas i varje session, även när det är irrelevant, och konkurrerar då med uppgiften om agentens begränsade uppmärksamhet. Skills fungerar som progressiv informationsdelning: agenten ser först ett litet namn och en beskrivning och laddar instruktioner, referenser eller skript först när just den förmågan behövs. Därför är en kort karta plus upptäckbara skills bättre än en växande “boll av lera” med alla regler på en gång. [Verifierat mot **Lektion 28: AGENTS.md**, **Lektion 31: Progressiv informationsdelning** och **Lektion 32: Agent-skills**](./ai-coding-for-real-engineers-svenska.md#lektion-28-vad-är-en-agentsmd-fil).

Koden, Git-historiken, issues och användarmeddelanden räcker ändå inte säkert till för att svara på “varför gjorde ni så?” eller “vad betyder detta domänord?”. ADR:er ger motiv och övervägda alternativ; `CONTEXT.md` ger det gemensamma språket. De skapas redan under grillningen så att PRD och issues byggs ovanpå rätt begrepp. [Verifierat mot [appendixet **`/grill-with-docs`**](./ai-coding-for-real-engineers-svenska.md#appendix-grill-with-docs)].

Samma logik gäller arkitekturen. Små, fragmenterade moduler gör det svårt att förstå hur delar fungerar ihop och förstör högvärdiga integrationstester. Människan kan kompensera med minne och instinkter; den statslösa agenten kan inte. Djupa moduler med små gränssnitt låter agenten se vad en del gör, testa hela flöden genom gränssnittet och lämna implementationsdetaljer lokala. Därför blir människans särskilda uppgift att forma moduler och skarvar, medan agenten kan bära mer av implementationsarbetet. [Verifierat mot **Lektion 80: Designa kodbaser som AI älskar**](./ai-coding-for-real-engineers-svenska.md#lektion-80-designa-kodbaser-som-ai-älskar).

---

## Grundprinciper

1. **Äg processen själv.** Använd skills, modeller och verktyg som utbytbara delar. Metoden ska bygga på beprövad ingenjörskonst, inte på ett magiskt ramverk.
2. **Skapa ett delat designkoncept före implementation.** En planfil är inte samma sak som samsyn. Agenten och människan måste förstå samma produkt och samma avvägningar.
3. **Kodbasen är den starkaste styrsignalen.** Agenten kopierar lätt befintliga mönster, även när de är dåliga. Instruktioner kan hjälpa, men ersätter inte en testbar och välstrukturerad kodbas.
4. **Återkoppling slår uppmaningar.** “Skriv bra kod” är svagt. En snabb typkontroll, beteendetest, formattering och manuell QA ger agenten signaler som den kan reagera på.
5. **Arbeta i vertikala, verifierbara skivor.** En liten väg genom data, domänlogik, API/UI och test är bättre än “bygg först backend, sedan frontend”.
6. **Använd ren kontext som normalläge.** En ny, välförsedd session för en smal uppgift är mer förutsägbar än en lång session med många komprimerade lager.
7. **Dokumentera beslut och begrepp, inte allt.** Bevara varför svåråterkalleliga val gjordes och vad domänord betyder. Ta bort dokumentation som blivit falsk eller inaktuell.
8. **AI ökar annars programvaruentropin.** Snabbare kodproduktion gör dåliga mönster och otestade antaganden farligare, inte billigare.

---

## 0. Gör repot till en bra arbetsyta för agenter

Detta görs en gång per repo och förbättras löpande. AFK-arbete är först rimligt när grunden finns.

### Bygg starka återkopplingsslingor

Agenten ska kunna köra konkreta kommandon för:

- format/lint,
- typkontroll,
- relevanta automatiserade tester,
- vid behov build, e2e och CI-liknande kontroller.

Kontrollerna ska vara så **täta** som möjligt: snabba, deterministiska, specifika och körbara utan mänsklig handpåläggning. En pre-commit-hook är värdefull som sista lokala skydd: formatera stage:ade filer och kör de rimliga typerna/testerna innan commit.

### Håll globala agentinstruktioner små

En `AGENTS.md`/`CLAUDE.md` ska bara innehålla stabil, universell orientering, exempelvis:

- enradig projektbeskrivning,
- korrekt pakethanterare och viktiga kommandon,
- pekare till domändokument, arkitekturbeslut och projektskills.

Lägg inte in en katalog med regler, all projekthistoria eller specialfall. Varje permanent instruktion konkurrerar om agentens uppmärksamhet. Föråldrade instruktioner skadar aktivt.

Använd i stället **progressiv informationsdelning**: den korta rotfilen pekar till material som bara laddas när det berör uppgiften, till exempel en testguide, en ADR-katalog eller en skill.

### Räkna med statslöshet och utforska med avsikt

Varje agentkörning ska betraktas som en ny utvecklare som just har kommit till repot. Utforskning är därför en återkommande del av arbetet, inte en engångsinsats vid uppsättning. Be om en enkel orientering först, och använd explicit språk som **“utforska hur X fungerar i detta repo”** när uppgiften kräver en djup kartläggning.

Delegera avgränsad utforskning till delagenter när verktyget stödjer det. Delagenter får förbruka sin egen kontext och återlämna fynden som en koncentrerad sammanfattning till den agent som ska fatta beslut och implementera. Kör oberoende researchspår parallellt, men låt inte flera agenter samtidigt ändra samma arbetsyta utan tydligt uppdelade gränser.

Agenter är dessutom icke-deterministiska: samma prompt kan ge olika svar. Försök inte få perfekta upprepningar; skapa i stället en process som begränsar utfallet med tydlig kontext, små arbetsenheter och konkreta återkopplingsslingor.

### Etablera domänminne i repot

En agent kan läsa kod, Git-historik, issue-trackern och dina meddelanden, men har svårt att säkert härleda två saker:

- *Varför* ett märkligt val gjordes.
- *Vad* interna affärstermer betyder.

Lös det med två små artefakttyper:

- `CONTEXT.md`: en ordlista med kanoniska domänbegrepp. Ingen implementationsplan, bara betydelser och relationer.
- ADR:er: korta arkitekturbeslut med kontext, alternativ och skäl.

Skapa en ADR sparsamt: bara när beslutet är **svårt att ändra**, **överraskande utan förklaring** och resultatet av en **verklig avvägning**. Skapa eller uppdatera ordlistan redan under grillningen, före PRD och issues, så att alla efterföljande artefakter använder samma språk.

### Gör issue-trackern till sanningskälla

Bestäm var arbetet bor (ofta GitHub Issues) och ha tydliga tillstånd, till exempel:

- `needs-triage`
- `needs-info`
- `ready-for-agent`
- `ready-for-human`
- `wontfix`

Detta är inte administration för sin egen skull. Agenten måste kunna se vilka uppgifter som får tas autonomt, vilka som väntar på mänsklig bedömning och vad som blockerar vad.

---

## 1. Grill: bygg samsyn före kod

### Standardbeteende

Börja nästan varje ny produkt- eller kodidé med en grillningssession. I en kodbas används helst en variant som samtidigt underhåller ordlista och ADR:er; utanför kod räcker en vanlig grillning.

Agentens uppgift är att:

1. utforska repot när svaret går att finna där,
2. gå igenom designträdets grenar och beroenden,
3. ställa **en fråga i taget**,
4. ge ett rekommenderat svar till varje verklig produktfråga,
5. fortsätta tills ni uttryckligen delar samma förståelse.

Fråga inte användaren om sådant koden redan kan besvara. Fråga däremot om produktens gränser, synlighet, roller, felbeteenden, prioriteringar, kompatibilitet, prestanda och vad som medvetet ska lämnas utanför.

### Varför inte bara använda agentens planläge?

Planläge är bra för utforskning, men agenten ställer ofta för få frågor och producerar sedan en lång plan som människan förväntas upptäcka fel i. Matt föredrar:

```text
utforska → intervjua ordentligt → implementera
```

Intervjun är arbetet som skapar det delade designkonceptet. En plan eller PRD kan komma efteråt, men ska vara en syntes av en redan genomtänkt dialog — inte en ersättning för den.

### När fasen är klar

Avsluta grillningen när följande är klart:

- problem, användare och önskat beteende är tydliga,
- de viktigaste designbesluten och deras beroenden är avgjorda,
- oklara externa fakta har markerats som research,
- osäkra produkt- eller logikfrågor har markerats som prototyper,
- nya domänord och bestående arkitekturval är dokumenterade.

Gå direkt till implementation bara för en verkligt liten och välförstådd ändring. Annars fortsätter flödet nedan.

---

## 2. Research: undersök innan ni låser en riktning

Research behövs när lösningen beror på sådant som inte bör gissas: tredjeparts-API:er, bibliotek, driftmodell, pris, teknikval, skalning eller befintliga integrationspunkter.

Låt agenten utforska alternativ och sammanställa ett Markdown-underlag i repot med:

- krav och begränsningar,
- alternativ som undersökts,
- rekommenderat angreppssätt med avvägningar,
- relevanta integrationspunkter,
- frågor som fortfarande kräver mänskligt beslut.

Människan använder sin smak och sin domänkunskap för att välja och, vid viktiga beslut, kontrollera påståendena. Agenten kan kartlägga alternativen, men den saknar en oberoende sanningskälla för vilken kompromiss verksamheten faktiskt vill göra.

Researchunderlag kan refereras från PRD och issues medan det är relevant. Rensa bort det när det blir inaktuellt; en gammal integrationsanalys är sämre än ingen eftersom den lär framtida agenter fel sak.

---

## 3. Prototype: gör en osäker idé konkret

En prototyp är **kastbar kod som besvarar en specifik fråga**. Den är inte en snabb produktionsimplementation.

Prototypa när ni behöver fånga okända okända, exempelvis:

- hur en ny UI-yta ska kännas,
- om en tillståndsmodell kan representera svåra fall,
- hur ett nytt bibliotek eller en extern tjänst beter sig,
- vilken arkitektur som passar ett nytt problem.

Prototypa normalt inte en tydligt reproducerad bugg eller en vanlig utbyggnad av etablerad funktionalitet. Där är frågan redan känd; bygg och testa i den riktiga strukturen i stället.

### Två prototypformer

| Fråga | Form | Praktik |
| --- | --- | --- |
| “Fungerar den här logiken/tillståndsmodellen?” | Logikprototyp | En liten interaktiv terminalapp över en ren reducer, tillståndsmaskin eller liten modul. Visa hela tillståndet efter varje handling. Håll data i minnet. |
| “Hur ska detta se ut?” | UI-prototyp | Tre ungefärligt radikalt olika varianter på samma befintliga route, växlingsbara med `?variant=` och en tydligt tillfällig växlare. |

Regler:

- Skriv först ned exakt vilken fråga prototypen besvarar.
- Håll den tillfällig, körbar med ett kommando och tydligt märkt.
- Undvik tester, polering, onödig felhantering och riktig persistens om det inte är frågan.
- För UI: varianter ska skilja sig i struktur och informationshierarki, inte bara färger.
- Fånga **svaret** — i ADR, issue, anteckning eller PRD — och radera eller absorbera sedan prototypen. Låt inte prototypkod förväxlas med produktionskod.

---

## 4. PRD: dokumentera målet, inte filändringarna

När grillning, research och eventuell prototyp har gjort riktningen tydlig, syntetiserar agenten samtalet till en PRD. Agenten ska inte starta en ny intervju här; den använder den gemensamma förståelse som redan finns och utforskar repot vid behov.

En bra PRD innehåller:

1. **Problemformulering** ur användarens perspektiv.
2. **Lösning** ur användarens perspektiv.
3. En lång, täckande lista med **användarberättelser**.
4. **Implementationsbeslut**: moduler, gränssnitt, schema/API-kontrakt, arkitektur och tekniska förtydliganden som faktiskt är beslut.
5. **Testbeslut**: beteenden som ska verifieras, rätt testskarvar och befintliga testförebilder.
6. **Utanför omfattningen**.
7. Övriga viktiga anteckningar och relevanta referenser till research/prototyp.

### Regler för en bra PRD

- Använd ordlistans språk och respektera ADR:er.
- Leta efter befintliga testskarvar. Föredra den **högsta** skarven som testar den verkliga vägen; skapa nya bara när det behövs och så högt som möjligt.
- Stäm av den föreslagna testytan med människan.
- Skriv inte en katalog av konkreta filsökvägar eller kodavsnitt — det ruttnar. Undantaget är ett litet, beslutsbärande utdrag ur en prototyp, exempelvis en reducer eller tillståndsmaskin.

PRD:n är måldokumentet. Den säger inte nödvändigtvis i vilken ordning varenda rad kod ska skrivas.

---

## 5. Issues: Kanban och tracer bullets i stället för en stor plan

För större arbete är en beroendegraf av issues bättre än en storslagen, linjär flerfasplan. Den går att ändra, den tillåter parallellism och QA kan skapa nya noder utan att hela planen skrivs om.

### Skär upp arbetet vertikalt

Varje issue ska vara en **tracer bullet**: en tunn men komplett, demonstrerbar väg genom alla berörda lager.

```text
Fel:     databas → API → UI → tester
Rätt:    en smal användarförmåga genom databas + API + UI + tester
```

En bra skiva:

- kan visas eller verifieras på egen hand,
- täcker en liten, verklig användarförmåga från början till slut,
- använder acceptanskriterier som beskriver beteende,
- har explicita blockerare,
- gör eventuell nödvändig prefaktorering först: “gör ändringen enkel, gör sedan den enkla ändringen”.

Låt agenten föreslå skivor, men låt människan kontrollera:

- Är granulariteten för grov eller för fin?
- Är beroendegrafen korrekt?
- Behöver skivor slås ihop eller delas?
- Är de faktiskt vertikala eller bara tekniska lager maskerade som issues?

### Markera mänskligt arbete och AFK-arbete

Varje skiva ska klassas som antingen:

- **HITL**: kräver smak, beslut, researchurval, designgranskning eller manuell bedömning.
- **AFK-redo**: specifikationen är tillräcklig och uppgiften kan implementeras, testas och committas utan att någon svarar mitt i.

Skapa alltid ett avslutande QA-issue med en konkret manuell testplan. Det gör att den som kommer tillbaka efter en autonom körning vet exakt vad som ska prövas.

### Prioritering för en autonom kö

När agenten själv väljer från en mindre backlog kan den vanligen prioritera:

1. kritiska fel och trasig CI,
2. utvecklingsinfrastruktur och återkopplingsslingor,
3. tracer bullets för nya funktioner,
4. små förbättringar med tydligt värde,
5. refaktoreringar.

Blockerade eller HITL-märkta issues ska agenten lämna åt människan.

---

## 6. Implementation: en ny session, en tydlig arbetsenhet

### Den normala “do work”-rutinen

En projektspecifik implementationsskill kan vara mycket kort. Matt föredrar en koncis rutin med fem steg:

1. **Förstå uppgiften** och läs issue, PRD, ADR:er, ordlista och relevanta research/prototyper.
2. **Planera vid behov.** Är skivan redan planerad behöver agenten inte skapa en ny stor plan.
3. **Implementera** den avgränsade skivan.
4. **Validera** via projektets riktiga återkopplingsslingor och rätta det de visar.
5. **Committa** det färdiga arbetet med ett meningsfullt meddelande.

Skriv konkreta projektkommandon i skillen, exempelvis typkontroll och testkommando. Undvik däremot regler som bara beskriver normalt sunt agentbeteende, filkataloger som förändras ofta eller samma instruktion i flera formuleringar.

Committen är en kontrollpunkt och en viktig informationskälla för framtida agenter: den kopplar ändrad kod till skälet för ändringen. Gör den när en verifierad skiva eller fas är klar.

### TDD som vertikal Red–Green–Refactor

Testerna ska bevisa observerbart beteende via modulens publika gränssnitt, helst i integrationstest-liknande form. Testet ska överleva att intern implementation skrivs om.

Kör inte detta:

```text
Röd: skriv alla tester
Grön: skriv all implementation
```

Kör i stället en tracer bullet i taget:

```text
Röd:  skriv ett test för ett beteende → se att det fallerar
Grön: skriv minsta möjliga kod → se att det passerar
Upprepa för nästa beteende
Refaktorera först när allt är grönt
```

Mocka inte interna samarbetspartner bara för att de råkar vara separata filer. Testa genom den skarv där verkliga anropare möter modulen. Om ett test går sönder av intern refaktorering utan beteendeförändring, testade det troligen implementationen i stället för beteendet.

### När kan implementation bli AFK?

AFK är en belöning för välformat arbete, inte ett standardläge. En skiva är lämplig när den har:

- tydligt mål, acceptanskriterier och blockerare,
- relevant kontext i artefakter som agenten kan läsa,
- etablerade testskarvar och automatiska kontroller,
- inga väntande produkt- eller designval,
- inga externa åtgärder som kräver ny behörighet eller mänskligt omdöme.

Den autonoma loopen är enkel: hämta nästa AFK-issue, läs kontexten, implementera, kör återkopplingsslingor, committa, uppdatera/stäng issuet, ta nästa. Människan använder tiden parallellt till att planera, granska och göra QA — inte till att titta på agentens varje tangenttryckning.

Sandboxning är ett skydd för en autonom agent när den får köra kommandon i längre tid. Den ersätter inte specifikation, tester eller review.

---

## 7. Review: gör mänsklig smak till en återkopplingsslinga

Efter implementation granskar människan resultatet mot:

- PRD:n och användarberättelserna,
- issuets acceptanskriterier,
- den manuella QA-planen,
- hur lösningen känns, fungerar och presterar i verkligheten,
- projektets arkitektur och kodkvalitet.

Detta är platsen för frågor som automatiska tester inte kan avgöra: “är detta begripligt?”, “känns flödet rätt?”, “är det snabbt nog?”, “blev den interna strukturen bättre eller bara större?”.

Om något saknas, skapa ett nytt issue med exakt symptom och förväntat beteende. Låt backloggen växa som en graf. Försök inte dölja lärdomarna genom att i efterhand låtsas att den gamla planen var perfekt.

Granska också processen: saknades testskarv, dokumentation, återkopplingssignal eller en tydlig issue-gräns? Förbättra systemet som ska hjälpa nästa agent, inte bara den aktuella koden.

---

## Kontextdisciplin: Grill → Execute → Clear

Matt optimerar för att agenten börjar viktiga arbetsenheter med **ren kontext**.

### Normal rytm

1. **Grill** tills avsikten är tydlig.
2. **Execute** en avgränsad uppgift med rätt artefakter och återkopplingsslingor.
3. **Clear**: börja nästa tydliga uppgift i en ny session.

Det håller agenten i sin “smartzon”, gör beteendet mer reproducerbart och förhindrar att gamla antaganden smittar nya uppgifter.

Före en ny större skiva eller fas: committa den verifierade föregående delen, rensa kontexten och ge den nya sessionen PRD/issue samt endast de referenser den behöver. Kursens exempel rensar redan kring en tredjedel av kontextfönstret; den exakta procentsatsen beror på verktyg och modell, men vanan är viktigare än talet.

### Komprimering och handoff

Automatisk eller upprepad komprimering är inte det önskade standardflödet. Varje sammanfattningslager lämnar “sediment”: mindre exakt, äldre kontext som kan påverka agenten.

Komprimera möjligen en gång när du har hårt vunnen kontext i en svår felsökning eller direkt efter en stor implementation och behöver göra fokuserad QA. Ange då uttryckligen nästa mål, så att sammanfattningen bevarar rätt sak.

Om en sidouppgift upptäcks mitt i en annan uppgift: skapa en **handoff** i en temporär fil och kör den i en separat, ny session. En bra handoff:

- beskriver nästa sessions specifika mål,
- länkar till PRD, issues, ADR:er, commits och diffar i stället för att duplicera dem,
- anger osäkerheter och nästa steg,
- föreslår relevanta skills,
- maskerar hemligheter.

---

## Arkitektur som gör AI effektivare

### Bygg djupa moduler

En **djup modul** ger mycket beteende bakom ett litet gränssnitt. En **grund modul** exponerar nästan lika mycket komplexitet som den kapslar in.

AI gynnas av djupa moduler eftersom den snabbare kan se var funktionaliteten bor och hur den ska användas. Människan gynnas av mindre kognitiv belastning och bättre lokalitet: ändringar och buggar samlas på ett ställe i stället för att spridas över anropare.

Använd detta språk exakt:

- **Modul**: något med gränssnitt och implementation, oavsett storlek.
- **Gränssnitt**: allt anroparen måste förstå — inte bara typsignaturen.
- **Skarv**: platsen där ett beteende kan bytas utan att redigera där; testytan mellan anropare och modul.
- **Adapter**: en konkret implementation vid en skarv.
- **Djup**: hävstången en anropare får per bit gränssnitt den behöver lära sig.

Praktiska frågor:

- Kan gränssnittet få färre metoder eller enklare parametrar?
- Kan mer komplexitet döljas inuti modulen?
- Klarar testet sig genom samma skarv som verkliga anropare använder?
- Om modulen raderas, samlas då komplexiteten i många anropare? I så fall gjorde modulen nyttig inkapsling.

Skapa inte abstrakta skarvar bara för att “kunna mocka”. En adapter är en hypotetisk skarv; först när två verkliga adaptrar behövs är skarven bevisad.

### Arkitektur är mänskligt arbete

Agenten kan utforska var friktionen finns och föreslå kandidater, men människan väljer vilka delar som är värda att fördjupa. Vid större ändringar: låt agenten visa flera arkitekturalternativ, grilla den valda kandidaten och använd sedan samma PRD → issues → implementation-loop.

---

## Felsökning enligt samma metod

Vid svåra buggar: börja inte med en teori och skriv inte en fix på känsla. Börja med en **tight, red loop**.

1. Bygg ett snabbt, deterministiskt, agentkörbart kommando som kan bli rött för användarens exakta symptom. Test, curl-skript, headless-browser-test, replay, tillfällig harness, fuzzing eller bisect kan fungera.
2. Reproducera och minimera scenariot tills varje återstående del bär felet.
3. Formulera 3–5 rangordnade, falsifierbara hypoteser med förutsägelser. Låt gärna användaren korrigera rangordningen med sin domänkunskap.
4. Instrumentera riktat för en hypotes i taget. Mät prestanda i stället för att logga slumpmässigt vid prestandafel.
5. Skriv regressionstestet **före** fixen, vid rätt skarv. Fixa sedan och kör både testet och den ursprungliga loopen.
6. Ta bort debugkod och tillfälliga artefakter. Dokumentera vilken hypotes som stämde. Saknas rätt testskarv är det ett arkitekturfynd som bör bli ett separat förbättringsissue.

Ingen röd-kapabel återkopplingsslinga innebär ingen pålitlig felsökning. Be då om reproduktion, logg/trace eller rätt miljö i stället för att spekulera.

---

## Skills: hur metoden görs repeterbar

En skill ska ge **förutsägbar process**, inte försöka göra en stokastisk modell deterministisk i varje detalj. Den bör vara kort, unik och kopplad till tydliga slutförandekriterier.

### Bra indelning

- **Alltid relevanta, stabila fakta** → liten `AGENTS.md`/`CLAUDE.md`.
- **Ett återkommande arbetsflöde** → projektskill, exempelvis `grill`, `to-prd`, `to-issues`, `do-work`, `tdd` eller `diagnose-bug`.
- **Detaljer som bara behövs i en viss gren** → separat referensfil, länkad från skillen.

En skill kan vara:

- **modellanropad** när agenten själv måste kunna känna igen och välja den; beskrivningen ska innehålla få, tydliga triggerord,
- **användaranropad** när människan explicit startar den; detta minskar permanent kontextbelastning.

Skriv inte samma regel i flera skills. Ta bort no-op-instruktioner som agenten redan följer som standard. Beskär aktivt gammalt “sediment”. Använd starka, gemensamma ledord som *grill*, *tracer bullet*, *tight loop* och *red* när de verkligen bär ett helt beteende.

---

## Körbar miniplaybook

Använd följande som standardprompt- och beslutsmönster.

### Ny idé eller funktion

```text
1. Utforska relevant kod.
2. Grilla mig en fråga i taget tills vi har ett delat designkoncept.
   Besvara själv frågor som repot kan besvara och rekommendera ett svar
   när du ställer en produktfråga.
3. Uppdatera ordlista och föreslå ADR endast för verkligt bestående avvägningar.
4. Flagga allt som behöver research eller prototyp innan vi skriver PRD.
```

### När samsyn finns

```text
Syntetisera vår befintliga diskussion till en PRD. Intervjua inte igen.
Använd repots domänspråk och ADR:er. Beskriv problem, lösning,
omfattande användarberättelser, bestående implementations- och
testbeslut, utanför omfattningen samt relevanta research/prototyper.
Undvik sköra filsökvägar.
```

### När PRD:n är klar

```text
Dela upp PRD:n i små, demonstrerbara tracer-bullet-issues. Varje issue
ska vara en vertikal skiva med acceptanskriterier och blockerare.
Visa först granularitet, beroenden och HITL/AFK-klassning för godkännande.
Skapa därefter issues i beroendeordning och ett avslutande QA-issue.
```

### För ett AFK-redo issue

```text
Läs issuet, PRD:n och dess refererade domändokument. Planera bara om
uppgiften inte redan är planerad. Implementera skivan med ett beteendetest
i taget, kör projektets konkreta återkopplingsslingor, rätta fynden,
committa och uppdatera issuet. Stanna om ett mänskligt beslut krävs.
```

### Vid review

```text
Kontrollera lösningen mot användarberättelser, acceptanskriterier och
manuell QA. Bedöm också smak, användbarhet, prestanda och arkitektonisk
friktion. Skapa tydliga uppföljningsissues för allt som återstår.
```

---

## Antimönster att aktivt undvika

- En vag prompt → en enorm implementation → mänsklig granskning först på slutet.
- Att låta planläget ersätta en verklig intervju.
- Horisontell uppdelning efter tekniklager.
- En jättelik `AGENTS.md` som försöker minnas allt.
- Upprepade kontextkomprimeringar som standardarbetsflöde.
- Att skriva en lång skill med duplicerade regler och sköra filreferenser.
- Att be agenten “skriva kvalitetskod” utan testbar återkoppling.
- Tester av privata detaljer, bred mocking och tester som går sönder vid intern refaktorering.
- Att göra varje task AFK bara för att det är möjligt.
- Att behålla prototyper eller researchdokument efter att deras beslut blivit inaktuella.
- Att betrakta en passerande testsvit som ersättning för mänsklig smak och QA.

---

## Nollkontext-test: har du förstått processen?

En agent som har förstått Matt ska välja följande utan att behöva fråga om metod:

| Situation | Rätt nästa drag |
| --- | --- |
| Idén är “lägg till realtidsnärvaro”, men skala, tjänsteval och UX är oklara. | Utforska → grilla → research/prototyp vid behov → åter till grillningen → PRD. Börja inte implementera. |
| PRD:n är klar men förslaget är “databas-issue, API-issue, UI-issue”. | Gör om till små vertikala tracer bullets med riktiga blockerare och ett QA-issue. |
| En AFK-agent når ett val om produktbeteende eller designsmak. | Stanna, skapa/markera ett HITL-issue och låt människan fatta beslutet. |
| En bugg är rapporterad men ingen snabb reproduktion finns. | Bygg först en tight, röd-kapabel återkopplingsslinga; gissa inte fixen. |
| En implementation är grön, committad och nästa skiva är separat. | Rensa kontexten och starta en ny session med rätt artefakter. |
| Ett nytt domänord eller ett svåråterkalleligt arkitekturval uppstår under grillning. | Uppdatera `CONTEXT.md`; skapa ADR endast när valet uppfyller de tre ADR-villkoren. |

Om svaret på någon rad är “ge agenten en längre prompt”, har du missat kärnan i metoden: förbättra i stället samsynen, artefakterna, skivans form eller återkopplingssignalen.

---

## Slutregel

Om du är osäker på vad du ska göra härnäst, gå uppströms:

1. Saknas samsyn? **Grilla.**
2. Saknas fakta? **Researcha.**
3. Saknas konkret känsla för idé/logik? **Prototypa.**
4. Saknas målbild? **Skriv PRD.**
5. Är arbetet för stort eller oklart? **Skär i tracer-bullet-issues.**
6. Saknas signal om att koden fungerar? **Bygg en tight återkopplingsslinga.**
7. Saknas mänsklig bedömning? **Granska och QA:a.**

Det är Matts grundsyn: AI blir som mest användbar när mänsklig ingenjörskonst formar miljön, besluten och återkopplingen — och sedan låter agenten springa fort inom dessa räcken.
