# Prompt till Claude Code: fullständig djupgranskning av CI- och grindvaktsarkitekturen

## Uppdrag

Du ska vara orkestrerare för en fullständig, evidensbaserad djupgranskning av vår CI-, test-, Git- och grindvaktsarkitektur.

Använd subagenter för samtliga jobb nedan: minst en subagent per jobb och fler där uppgiften behöver delas upp. Du ansvarar för att avgränsa uppgifterna, samordna agenterna, upptäcka överlapp eller motsägelser, begära kompletteringar och sammanställa ett enhetligt slutresultat.

Arbetet får ta lång tid. Prioritera korrekthet, fullständighet och verifierbara slutsatser framför snabbhet. Avsluta inte förrän samtliga jobb och leverabler är färdiga och kvalitetskontrollerade.

## Grundprinciper

- Gissa inte.
- Lita inte enbart på dokumentation. Kontrollera implementation, konfiguration och faktiskt beteende.
- Skilj tydligt mellan:
  - dokumenterad avsikt,
  - faktisk implementation,
  - tekniskt framtvingade regler,
  - frivilliga arbetssätt,
  - empiriskt observerat beteende,
  - sådant som inte kunnat verifieras.
- Hänvisa till konkreta filer, rader, workflows, jobb, scripts, GitHub-inställningar, historik, körningar eller annan evidens.
- Märk slutsatser som **verifierade**, **starkt indikerade**, **osäkra** eller **ej verifierbara**.
- Gör hela kartläggningen begriplig även för en oteknisk läsare, men utelämna inga tekniska detaljer.
- Förklara tekniska begrepp första gången de används.
- Identifiera både lokala repo-filer och relevanta inställningar eller beroenden utanför repot.
- Redovisa luckor i åtkomst och exakt vad som krävs för att fylla dem.
- Var kritisk mot både överbyggnad och alltför aggressiv förenkling.

Analysera först. Ändra inte befintligt produktionsbeteende innan nuläget, beroendena och riskerna är kartlagda. Du får skapa eller förbättra dokumentation och, om evidensen tydligt motiverar det, föreslå eller implementera workflows och andra förbättringar. Alla faktiska ändringar ska vara små, reversibla, testade och tydligt redovisade. Gör ingen total omskrivning utan mycket starka skäl.

## Genomförande och koordinering

1. Inventera repot, dess instruktioner, historik, GitHub Actions, scripts, hooks, tester och GitHub-konfiguration.
2. Skapa en arbetsfördelning med minst en subagent för vart och ett av jobb 1–8.
3. Låt agenterna arbeta parallellt där beroendena tillåter det.
4. Kräv att varje subagent levererar:
   - metod,
   - fynd,
   - evidens,
   - osäkerheter,
   - risker,
   - rekommendationer.
5. Jämför agenternas resultat och utred alla motsägelser.
6. Gör egna stickprov på kritiska påståenden innan de tas in i slutresultatet.
7. Skapa de separata dokument och den sammanställning som anges nedan.

---

# Jobb 1: Fullständig karta över CI- och grindvaktsarkitekturen

Lista **alla** filer som rör vår CI- och grindvaktsarkitektur. Målet är en komplett inventering, inte ett urval.

Inkludera bland annat:

- alla GitHub Actions-workflows,
- eventuella lokala CI-flöden,
- återanvändbara workflows och composite actions,
- scripts som anropas direkt eller indirekt,
- testkonfigurationer,
- bygg-, lint- och typkontrollskonfigurationer,
- hooks,
- regler och konfigurationer för brancher, pull requests och merge,
- filer för miljöer, staging, deployment, smoke tests och rollback,
- säkerhets-, audit-, tillgänglighets-, länk- och visuella kontroller,
- beroenden som krävs för att grindarna ska fungera,
- dokumentation och agentinstruktioner som styr flödet,
- externa GitHub-inställningar som branch protection, rulesets, required checks och merge queue.

För varje fil eller extern komponent ska du ange:

- sökväg eller plats,
- syfte,
- vem eller vad som anropar den,
- vad den i sin tur anropar,
- triggers,
- indata och utdata,
- beroenden och hemligheter,
- vilka kontroller den utför,
- vad som händer vid success, failure eller skip,
- om den blockerar merge,
- vilka andra komponenter den påverkar.

Lista även samtliga grindar och alla beroenden mellan dem. Visualisera hela flödet från lokal ändring till merge, staging, produktion och nattliga kontroller.

Analysera exakt hur arkitekturen fungerar, i detalj. Sätt gärna flera subagenter på olika flöden och låt dem korsgranska varandras resultat.

Kartläggningen ska kunna förstås in i minsta detalj av både människa och maskin.

## Ändringslogg

Identifiera alla ändringar och korrigeringar som har gjorts i CI- och grindvaktsarkitekturen under åtminstone de senaste två veckorna. Utöka tidsperioden om äldre förändringar behövs för att förstå nuläget.

Skapa en dedikerad ändringslogg som för varje förändring anger:

- datum,
- commit eller PR,
- berörda filer,
- vad som ändrades,
- varför det ändrades, om detta går att fastställa,
- vilken effekt förändringen fick,
- eventuella följdändringar eller regressioner.

Behandla CI- och grindvaktsarkitekturen som en **djup modul**: den ska ha ett litet och begripligt gränssnitt utåt, medan den interna komplexiteten kapslas, dokumenteras och förvaltas sammanhållet.

---

# Jobb 2: Branch- och commitflödet

Identifiera alla relevanta förändringar som har gjorts kring commits, brancher, worktrees och agenternas Git-arbetssätt.

Fastställ exakt hur vi i dag:

- skapar och namnger brancher,
- väljer eller byter branch,
- använder worktrees,
- isolerar parallella agenters arbete,
- gör lokala commits,
- avgränsar vad som ska ingå i en commit,
- hanterar andra agenters eller utvecklares samtidiga ändringar,
- pushar brancher,
- öppnar pull requests,
- uppdaterar eller synkroniserar brancher,
- mergar till `main`,
- återställer eller revertar felaktiga förändringar.

Skilj mellan dokumenterade regler, teknisk enforcement och faktisk historisk praxis.

Skapa ett separat dokument som förklarar det nuvarande branch- och commitflödet steg för steg, inklusive risker, undantag och rekommenderat arbetssätt för både människor, orkestrerare och subagenter.

---

# Jobb 3: Push-kadens

Ta reda på om vi har en definierad eller faktisk push-kadens:

- Vet människor och agenter när de ska pusha?
- Pushar vi tidigt till små, kortlivade brancher?
- Öppnar vi pull requests tidigt eller först när arbetet anses färdigt?
- Finns det instruktioner, automation eller etablerad praxis?
- Skiljer sig beteendet mellan människor, orkestrerare och subagenter?
- Finns risk att arbete ligger lokalt för länge?
- Finns risk att ofärdigt eller osäkert arbete delas för tidigt?
- Hur påverkar push-kadensen CI-kostnad, återkopplingstid, samarbete och återställningsbarhet?

Om kadensen är otydlig eller saknas, föreslå en konkret och proportionerlig standard.

---

# Jobb 4: Jämförelse med branschledande projekt

Bedöm hur branschledande vår samlade CI- och grindvaktsarkitektur och våra olika flöden är.

Jämför med verkliga, välrenommerade och relevanta branschledande projekt eller organisationer. Använd primärkällor där det är möjligt och skilj mellan:

- generella branschprinciper,
- arbetssätt som är rimliga på vår skala,
- lösningar som främst är motiverade på mycket stor skala,
- sådant som skulle innebära onödig överbyggnad för oss.

Jämför bland annat:

- snabbhet i återkopplingen,
- branch- och PR-storlek,
- required checks,
- testurval,
- hermetiska tester,
- realistisk E2E,
- kontroll före och efter merge,
- nattliga kontroller,
- observability och rollback,
- flakighet,
- underhållskostnad,
- återanvändbarhet mellan repon.

Ge en nyanserad bedömning. Målet är inte att kopiera stora företag, utan att förstå vad vi redan gör starkt och vad som proportionerligt bör förbättras.

---

# Jobb 5: Airtables kompromisser och begränsningar

Identifiera exakt vilka kompromisser Airtable tvingar fram i vår arkitektur.

Lita inte enbart på dokumentationen. Undersök implementationen och testa osäkra punkter empiriskt när detta kan göras säkert och utan att skada data eller produktion.

Analysera bland annat:

- autentisering och behörigheter,
- API-begränsningar och rate limits,
- datamodell,
- transaktioner och atomiskhet,
- samtidighet och race conditions,
- testisolering,
- fixtures och återställning av testdata,
- staging kontra produktion,
- schemaförändringar,
- pagination och filtrering,
- felhantering och retries,
- prestanda,
- observability,
- lokala emulatorer eller avsaknad av sådana,
- hur väl mocks och simuleringar motsvarar verkligheten.

För varje kompromiss ska du ange:

- vad Airtable begränsar,
- vilken lösning vi använder,
- vilka risker eller kostnader lösningen innebär,
- om kompromissen är nödvändig eller självvald,
- om den kan minskas,
- hur slutsatsen verifierades.

Skapa ett separat dokument enbart för Airtable-analysen.

---

# Jobb 6: CI som återanvändbar, centralt förvaltad djup modul

Analysera den nuvarande CI- och grindvaktsarkitekturen som ett sammanhängande system.

Utgångspunkten är att jag sannolikt har byggt mycket av själva CI-fabriken direkt i det enskilda produktrepot. Målet är inte bara att förenkla eller ta bort saker, utan att undersöka om det som redan finns kan omvandlas till en standardiserad, återanvändbar och centralt förvaltad lösning.

Analysera:

- vilka delar som är generella och återanvändbara mellan flera repon,
- vilka delar som är produktspecifika och bör stanna i respektive repo,
- vilka kontroller, workflows, scripts, regler och konfigurationer som kan centraliseras,
- vilka delar som dupliceras, överlappar eller skapar onödig komplexitet,
- vilka delar som bör behållas, förenklas, centraliseras, produktifieras eller tas bort.

Undersök om delar kan omvandlas till exempelvis:

- återanvändbara GitHub Actions-workflows,
- composite actions,
- gemensamma konfigurationspaket,
- installationsscript eller generator,
- template repository,
- organisationsgemensamma rulesets,
- en intern CI-produkt eller ett gemensamt CI-kit.

Beskriv:

- en möjlig framtida målarkitektur där ett nytt repo får rätt CI- och grindvaktsarkitektur med minimal konfiguration,
- hur befintliga repon stegvis kan migreras utan att allt byggs om från början,
- hur lösningen kan hållas liten, stabil, tydlig och versionshanterad.

Se det som redan är byggt som en möjlig tillgång, inte bara som teknisk skuld. Leta särskilt efter fungerande byggblock som kan lyftas ut och göras generella. Föreslå inte automatiskt en total omskrivning. Utgå i första hand från att återanvända, konsolidera och förenkla.

För varje större komponent ska du ange:

- vad den gör i dag,
- vilket problem den löser,
- om problemet är generellt eller produktspecifikt,
- om komponenten bör behållas lokalt eller centraliseras,
- om den kan göras återanvändbar,
- vilka beroenden och risker den har,
- rekommenderad framtida placering,
- konkret nästa steg.

Avsluta jobbet med:

- en karta över nuläget,
- klassificeringen **behåll lokalt / centralisera / produktifiera / förenkla / ta bort**,
- ett förslag på minimal målarkitektur,
- ett förslag på hur ett nytt repo installerar eller ansluter till lösningen,
- en prioriterad migrationsplan,
- en bedömning av vad som bör göras nu, senare eller inte alls.

Målet är inte maximal eller minimal CI, utan en liten, stabil och återanvändbar grindvaktsplattform som är proportionerlig mot mina produkter och mitt arbetssätt.

---

# Jobb 7: Fördelningen mellan hermetiska tester och realistiska E2E-flöden

Utred i detalj om vi arbetar enligt följande princip i dag:

> Testa det mesta snabbt och isolerat. Testa ett litet antal kritiska flöden genom den verkliga kedjan.

För Miranon Media Admin skulle jag inte vilja se hundratals vanliga E2E-tester mot riktiga tjänster. Jag skulle hellre se många stabila hermetiska tester och ungefär 5–15 mycket viktiga realistiska E2E-flöden som visar att den verkliga installationen hänger ihop. Antalet är en situationsberoende tumregel, inte en branschstandard.

Det är mycket viktigt att fastställa:

- om det är så vi faktiskt arbetar i dag,
- hur många tester som finns på varje nivå,
- vilka verkliga kedjor E2E-testerna täcker,
- om antalet och urvalet är motiverat av risk,
- om för många tester går mot riktiga tjänster,
- om hermetiska tester ger falsk trygghet,
- om det finns kritiska flöden som inte verifieras realistiskt,
- om samma beteende testas redundant på flera nivåer.

Besvara frågan med konkret evidens, inte enbart en principiell rekommendation.

---

# Jobb 8: Systematisk granskning av risk, testnivåer, grindlogik och kostnad

Gå igenom hela flödet och besvara samtliga frågor nedan.

## 8.1 Syfte och risk

- Vilka verkliga fel har tidigare nått produktion?
- Vilka av testerna fångar sådana fel?
- Vilka kontroller finns bara för att de ”känns bra att ha”?
- Vilka fel är så allvarliga att de måste blockera en merge?
- Vilka fel kan i stället vara varningar?

## 8.2 Testnivåerna

- Vad testar Pure + Build som inte redan testas av lint och TypeScript?
- Vad täcker de hermetiska acceptanstesterna?
- Vad täcker staging-E2E som de hermetiska testerna inte kan täcka?
- Finns samma användarflöde testat flera gånger på olika nivåer?
- Är gränsen tydlig mellan enhetstest, integrationstest, acceptanstest och E2E?
- Vilken unik information ger varje testnivå?

Om två nivåer i praktiken ger samma svar finns sannolikt en dubblering. Identifiera och bedöm den.

## 8.3 Den hermetiska miljön

- Är den verkligen isolerad från externa tjänster?
- Startar varje test med ett känt dataläge?
- Kan testerna köras i valfri ordning?
- Kan flera tester köras parallellt utan att påverka varandra?
- Används mocks, emulatorer eller tillfälliga databaser?
- Hur vet vi att simuleringen fortfarande motsvarar de riktiga tjänsterna?

Den sista frågan är särskilt viktig. En perfekt simulering kan ge falsk trygghet om verkligheten har förändrats.

## 8.4 Staging och E2E

- Kör stagingtesterna mot en miljö som delas mellan flera PR:er?
- Kan två körningar förstöra data för varandra?
- Vad gör `Staging sentinel purge` exakt?
- Varför krävs rensningen före testet?
- Vad händer om rensningen misslyckas halvvägs?
- Testas riktig autentisering, databas och externa API:er?
- Används riktiga tjänster i testläge eller ersättningar?
- Är staging tillräckligt lik produktion för att testet ska betyda något?
- Körs testet på varje PR för att det behövs eller bara för att det råkar vara möjligt?

## 8.5 Grindlogiken

- Vilka jobb är obligatoriska för merge?
- Vad innebär `CI Passed or Skipped`?
- Kan ett viktigt test markeras som `skipped` och ändå ge grönt?
- Hur avgör `Detect changed files` vilka tester som ska köras?
- Vad händer när detektionslogiken har fel?
- Finns en säker standard där osäkerhet innebär att fler tester körs?
- Kan en ändring i gemensam kod påverka fler delar än filtret förstår?

Den farligaste typen av CI-fel är ofta inte ett rött resultat när allt fungerar, utan ett grönt resultat trots att ett relevant test aldrig kördes. Undersök detta särskilt noggrant.

## 8.6 Stabilitet och felsökning

- Hur ofta fallerar tester utan att produkten faktiskt är trasig?
- Vilka tester är mest flakiga?
- Görs automatiska omkörningar, och döljer de i så fall instabilitet?
- Är felmeddelandena tillräckligt tydliga för att snabbt hitta orsaken?
- Sparas screenshots, loggar, traces och testresultat?
- Går det att köra exakt samma test lokalt?
- Hur lång tid tar det normalt från rött test till förstådd felorsak?

## 8.7 Tid och kostnad

- Hur lång är den faktiska väntetiden, inte summan av alla jobbtider?
- Vilket steg ligger på den kritiska vägen?
- Hur mycket GitHub Actions-tid förbrukas per vecka eller månad?
- Hur ofta körs hela flödet i onödan?
- Skulle snabbare kontroller kunna köras först och stoppa resten vid fel?
- Behöver länkkontroll, audit och full staging-E2E verkligen köras vid varje kodändring?

## 8.8 Underhåll

- Hur många filer, scripts och konfigurationer krävs för att hålla detta igång?
- Vem eller vad kan förstå hela flödet?
- Hur ofta behöver CI-koden ändras?
- Hur stor del av den senaste utvecklingstiden har gått till testinfrastruktur?
- Finns samma lösning kopierad i flera repon?
- Vilka delar kan lyftas ut till återanvändbara workflows eller ett centralt CI-kit?
- Hur installeras samma standard i ett nytt repo?

## De fem viktigaste frågorna

Ge dessa fem frågor särskilt tydliga och fristående svar:

1. Vilket verkligt produktionsfel skyddar varje jobb mot?
2. Vilken unik information ger de hermetiska testerna respektive staging-E2E?
3. Kan CI bli grönt trots att ett relevant test har hoppats över?
4. Hur ofta orsakar testflödet falska stopp eller kräver eget underhåll?
5. Vilka delar är en generell CI-produkt och vilka är specifika för just denna app?

Dessa frågor avgör om vi har byggt en välmotiverad kvalitetsplattform eller en mycket avancerad maskin vars komplexitet har börjat motivera sig själv.

---

# Obligatoriska leverabler

Skapa minst följande dokument:

1. **Huvudrapport och exekutiv sammanfattning**
2. **Fullständig fil- och komponentinventering**
3. **Teknisk arkitekturkarta med beroenden och dataflöden**
4. **Ändringslogg för CI- och grindvaktsarkitekturen**
5. **Branch-, worktree-, commit- och pushflöde**
6. **Branschjämförelse**
7. **Airtables kompromisser och empiriska fynd**
8. **Hermetiska tester kontra realistisk E2E**
9. **Risk-, redundans-, flakighets-, tids- och kostnadsanalys**
10. **Förslag till återanvändbar CI-djupmodul och minimal målarkitektur**
11. **Prioriterad migrations- och åtgärdsplan**
12. **Evidens- och osäkerhetsregister**

Huvudrapporten ska länka till samtliga underdokument och fungera som ingång för både tekniska och otekniska läsare.

## Rekommenderat format för komponentbedömningar

Använd en tabell med följande kolumner där det passar:

| Komponent | Funktion i dag | Problem den löser | Trigger | Beroenden | Unik signal | Merge-blockerande | Risk | Evidens | Rekommendation |
|---|---|---|---|---|---|---|---|---|---|

## Rekommenderat format för åtgärdsplanen

För varje åtgärd ska du ange:

- prioritet,
- problem,
- föreslagen förändring,
- förväntad effekt,
- risk,
- berörda filer och externa inställningar,
- beroenden,
- verifieringsmetod,
- rollback,
- rekommendation: **nu / senare / inte alls**.

# Slutlig kvalitetsgrind

Innan du avslutar ska du verifiera att:

- samtliga åtta jobb är besvarade,
- minst en subagent har arbetat med varje jobb,
- alla påståenden har evidens eller tydlig osäkerhetsmarkering,
- filinventeringen är fullständig enligt de sökmetoder som använts,
- kritiska flöden har korsgranskats,
- dokumenten inte motsäger varandra,
- rekommendationerna är proportionerliga mot produkten och arbetssättet,
- föreslagna ändringar återanvänder och konsoliderar befintliga styrkor där det är rimligt,
- både överbyggnad och för aggressiv förenkling har undvikits,
- alla faktiska ändringar är testade, dokumenterade och reversibla,
- huvudrapporten tydligt anger vad som bör göras nu, senare eller inte alls.

Var uthållig, noggrann och kritisk. Målet är ett exceptionellt bra och praktiskt användbart resultat: en liten, stabil, begriplig och återanvändbar grindvaktsplattform som ger hög säkerhet utan onödig väntan eller självförstärkande komplexitet.
