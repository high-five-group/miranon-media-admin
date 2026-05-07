**Miranon Media x Odoo**

Sammanfattning av Codex-körning, Odoo Events-discovery och testplan

Sammanställd: 7 maj 2026

| **Statuspunkt** | **Resultat** |
|----|----|
| **Branch** | odoo-autonomous-test-plan |
| **Commit** | e9cfa9e - Add Odoo migration discovery and test plan |
| **Skapade filer** | 88 Odoo-relaterade filer |
| **Externa writes** | 0 - inga writes till Odoo, Airtable eller Shopify |
| **Custom webapp** | 0 ändrade custom webapp-filer |
| **POC-write** | Ej körd - korrekt stoppad p.g.a. saknad verifierad testmiljö/fält/credentials |

**Beslutsstatus: Fortsätt Odoo som kontrollerat parallellt
event-/registreringsspår. Behåll custom webappen som huvudspår tills
Odoo bevisats i testdatabas med verifierade fält och minimal POC.**

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr>
<th><p><strong>Dokumentets syfte och avgränsning</strong></p>
<p>Det här dokumentet sammanställer den avrapportering och Q&amp;A som
Codex levererade efter den autonoma Odoo-körningen. Det ersätter inte de
88 underliggande artefakterna i repot, utan fungerar som ett lättläst
beslutsunderlag och läsordning.</p>
<p>Viktigt: sammanfattningen bygger på Codex rapporterade resultat. De
faktiska Odoo-instansfälten, Odoo-planen, live-Airtable-data och en
neutraliserad testdatabas är fortfarande inte verifierade.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# Innehåll

- 1\. Executive summary

- 2\. Vad Codex gjorde

- 3\. Källor och verifieringsstatus

- 4\. Huvudslutsats: Odoo Events är relevant men inte bevisat

- 5\. Odoo Events, anpassning och databas/hosting

- 6\. Risker, blockerare och säkerhetsbeslut

- 7\. Rekommenderad nästa arbetsordning

- 8\. Viktigaste filer att läsa i repot

- 9\. Q&A - rensad och strukturerad

- 10\. Källor som Codex använde

# 1. Executive summary

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr>
<th><p><strong>Slutsats i en mening</strong></p>
<p>Odoo Events är tillräckligt relevant för Miranon Media för att testas
skarpt som parallellt event-/registrerings-/backend-spår, men det är
ännu inte bevisat som ersättare för Shopify, Airtable och custom
webappen.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

**Codex har genomfört uppdraget som ett separat och kontrollerat
Odoo-testspår.** Arbetet gjordes på branchen
\`odoo-autonomous-test-plan\`, committades som \`e9cfa9e\`, och ändrade
inte custom webapp-koden. Inga externa writes gjordes till Odoo,
Airtable eller Shopify.

| **Punkt** | **Sammanfattning** |
|----|----|
| Övergripande bedömning | Odoo Events är starkt relevant för Miranons kärnflöde: Eventplanering -\> Anmälningar -\> Personer -\> Deltaganden. |
| Rekommenderad strategi | Fortsätt med Odoo som parallellt, kontrollerat test. Behåll custom webappen och Shopify/Airtable som huvudspår tills en POC bevisar värde. |
| Största möjlighet | Standard-Odoo verkar redan ha mycket av det som behövs för events, registreringar, biljetter, frågor, Website-publicering, attendee-listor, check-in/barcode och grundrapportering. |
| Största risk | Miranons verkliga logik kan vara mer specialiserad än Odoo-standard, särskilt historisk närvaro, sessioner, rollups, erfarenhetsnivåer, betalningsstatusar och dubbletter. |
| Nästa gate | Verifiera faktisk Odoo-databas, plan/API-access, installerade appar, Events-inställningar, importfält, testdatabas och neutralisering. |

# 2. Vad Codex gjorde

**Arbetet genomfördes sekventiellt enligt de framtagna
Codex-promptarna.** Codex säkrade först git-arbetsytan, skapade separat
branch och byggde därefter en Odoo-arbetsyta i repot.

| **Kategori** | **Resultat** |
|----|----|
| Arbetsyta | Skapade \`odoo-migration-test-plan/\` och \`odoo-migration-workbench/\`. |
| Plan och beslutsunderlag | Skapade executive summary, fit-gap, roadmap, riskregister, POC-resultat, slutrekommendation och checklistor. |
| Odoo Events deep dive | Analyserade officiell Odoo 19.0-dokumentation och Odoo 19.0-källkod för Events-relaterade modeller och flöden. |
| Tutorialintegration | Integrerade transkriptionsoutput från \`/Users/marcus/Repon/marcus-system/odoo-events-transcripts-openai\` utan att committa råtranskript. |
| Miranonanalys | Läste repo, \`docs/reference/data-model.md\`, domänmodeller och publik webb på miranon.se. |
| Verifiering | Python-scripts kompilerades med \`py_compile\`, read-only/dry-run-scripts testades och \`git status --short\` var rent. |
| Säkerhet | Inga externa writes och ingen POC-write, eftersom testmiljö/credentials/verifierade fält saknades. |

# 3. Källor och verifieringsstatus

| **Källa** | **Vad Codex använde den till** | **Status** |
|----|----|----|
| Lokalt repo | Projektstruktur, pågående custom webapp-spår, dokumentation och kodnära domänmodeller. | Läst |
| \`docs/reference/data-model.md\` | Airtable/datamodell: enligt Codex verifierades 18 tabeller, 358 fält, kärntabeller och statusar/relationer. | Läst |
| \`src/domain/models\` | Miranons domänmodeller och verkliga begrepp. | Läst |
| miranon.se | Publik verksamhetsförståelse: eventplanering, utbildningar, föreläsningar, bok/meditationer och kontaktflöden. | Läst på publik nivå |
| Officiell Odoo 19.0-dokumentation | Events, Online, Studio, API, säkerhet, SLA och import/export. | Läst |
| Officiell Odoo 19.0-källkod | Events-modeller, controllers, views, security, tester och relaterade moduler. | Läst enligt Codex |
| YT/tutorial-transkript | Praktisk UI-/flödeskunskap från Odoo Events tutorialserie. | 17/17 videos, 0 fel enligt kvalitetsrapport |
| Faktisk Odoo-instans | Plan, API-access, installerade appar, fält, import/export. | Ej verifierad |
| Live Airtable/API | Faktiska live-tabeller/exporter, rader och fält. | Ej verifierad i denna körning |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr>
<th><p><strong>Viktig tolkning</strong></p>
<p>Codex har byggt ett starkt research- och planunderlag. Däremot har
det inte bevisat att just din Odoo-databas har rätt plan, rätt
API-access, rätt fält, rätt importmöjligheter eller en säker
testdatabas. Det är nästa gate.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 4. Huvudslutsats: Odoo Events är relevant men inte bevisat

**Odoo Events matchar Miranons verifierade kärnflöde väl.** Codex
rapporterar att Odoo har standardstöd för event, mallar, registreringar,
deltagare, biljetter, registreringsfrågor, Website-publicering,
attendee-listor, check-in/barcode, grundrapportering och koppling till
Sales/CRM/Website där det behövs.

| **Miranon-behov** | **Odoo Events-relevans** | **Kommentar** |
|----|----|----|
| Eventplanering | Hög | Events och eventmallar verkar vara starkaste naturliga matchningen. |
| Anmälningar | Hög | Odoo har standardobjekt för registreringar/deltagare, men fält/import måste verifieras i faktisk instans. |
| Personer/deltagare | Hög | Kontakt-/attendee-logik kan passa, men dubbletthantering och historik kräver särskild test. |
| Deltaganden/historik | Medel | Grundflöde passar, men sessioner och historisk närvaro kan bli speciallogik. |
| Biljetter/prisnivåer | Hög | Odoo har event tickets, men försäljning/fakturering ska undvikas i första testet. |
| Formulärfrågor | Hög/Medel | Odoo har frågor/svar, men Miranons exakta frågelogik behöver verifieras. |
| Airtable-rollups/erfarenhetsnivåer | Osäker | Troligen ett av gapen som kräver mapping, Studio, hybrid eller custom logic. |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr>
<th><p><strong>Beslut nu</strong></p>
<p><strong>Fortsätt testa Odoo, men som parallellt spår.</strong></p>
<p>Det vore för tidigt att flytta strategisk tyngd från custom webappen,
Shopify eller Airtable innan Odoo har bevisats i en neutraliserad
testdatabas med verifierade fält och minimal POC.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 5. Odoo Events, anpassning och databas/hosting

## 5.1 Vad Codex fann i Odoo Events

**Codex rapporterar att officiell Odoo 19.0-källkod verifierar centrala
Events-modeller som:** \`event.event\`, \`event.registration\`,
\`event.event.ticket\`, \`event.question\`,
\`event.registration.answer\` och \`event.slot\`. Detta gör Odoo Events
till en verklig domänapp, inte bara en enkel kalender-/sidestruktur.

| **Odoo-område** | **Betydelse för Miranon** |
|----|----|
| Event och eventmallar | Bra kandidater för återkommande eventtyper, standardiserade upplägg och snabb eventpublicering. |
| Registreringar/deltagare | Central match mot Anmälningar och Deltaganden, men faktisk Odoo-importstruktur måste verifieras. |
| Biljetter/prisnivåer | Möjlig match mot prissättning och eventplatser; betalning/faktura bör hållas utanför första POC. |
| Registreringsfrågor/svar | Möjlig match mot formulärfrågor och deltagardata. |
| Website-publicering | Möjlig väg att bygga Odoo-native eventsidor i stället för att kopiera Shopify pixelperfekt. |
| Barcode/check-in | Relevant om Miranon vill testa närvaroregistrering eller deltagarhantering på plats. |

## 5.2 Hur Odoo Events kan anpassas

**Den viktigaste slutsatsen är att man normalt inte skriver om hela Odoo
Events-källkoden.** Odoo anpassas i lager, från konfiguration och
Website till Studio, API/middleware och eventuellt custom modules på
Odoo.sh/on-premise.

| **Lager** | **Vad det betyder** | **Rekommendation för Miranon** |
|----|----|----|
| 1\. Standardkonfiguration | Events, templates, tickets, questions, communication, reporting. | Första testnivån. |
| 2\. Website builder | Eventsidor, SEO, copy, layout och publik presentation. | Testa Odoo-native i stället för pixelperfekt Shopify-kopia. |
| 3\. Studio/no-code | Fält, vyer, automationer, webhooks, PDF, approval/security. | Använd försiktigt om standardflödet nästan räcker. |
| 4\. Import/API/middleware | Koppla Airtable, Shopify eller custom webapp utan att ändra Odoo-kärna. | Bra nästa steg efter fältverifiering. |
| 5\. Custom modules | Egen Python/Odoo-logik på Odoo.sh/on-premise. | Vänta tills ett konkret gap är bevisat. |
| 6\. Core fork | Skriva om/patcha Odoo-källkod direkt. | Undvik nästan alltid. |

## 5.3 Odoo-databas, hosting och åtkomst

**Codex slutsats är att Odoo-databasen inte ska behandlas som en enkel
Airtable-base.** Den är en komplett Odoo-instans med appar, modeller,
records, users, settings, affärslogik, access rights och attachments.
Därför ska migration ske via Odoo UI, import/export, API eller ORM -
inte genom att tänka i råa SQL-tabeller.

| **Fråga** | **Preliminärt svar** | **Verifieringsstatus** |
|----|----|----|
| Var hostas data? | Beror på hostingmodell: Odoo Online, Odoo.sh, on-premise eller tredjepartsmanaged. | Miranons faktiska modell ej verifierad |
| Direkt PostgreSQL-access? | Normalt inte i Odoo Online; mer relevant i Odoo.sh/on-premise-scenarier. | Måste verifieras |
| API-access? | Odoo 19 JSON-2 API kräver enligt Codex/Odoo-dokumentation Custom-plan. | Måste verifieras mot faktisk plan |
| Import/export? | Viktig förstahandsväg för testmigration och External IDs. | Importfält måste verifieras |
| Backup/restore/testdatabas? | Database Manager, duplicate/test database och neutralisering är centrala nästa kontroller. | Måste göras manuellt |
| Säkerhet | Officiella källor beskriver kryptering, datacenterkontroller, hardening, backup/SLA och begränsad staff access. | Faktisk region/avtal/backup ej verifierade |

# 6. Risker, blockerare och säkerhetsbeslut

## 6.1 Största riskerna

| **Risk** | **Varför den spelar roll** | **Motåtgärd** |
|----|----|----|
| Specialiserad Miranon-logik | Sessioner, historisk närvaro, rollups, erfarenhetsnivåer och betalstatusar kan ligga utanför standard-Odoo. | Testa standardflöde först; dokumentera varje konkret gap innan Studio/Odoo.sh. |
| Relationell import | Airtable-relationer, dubbletter och historik kan bli svårare än radantalet. | External IDs, verifierad importordning och anonymiserad sample. |
| Fakturering/betalning | Fel här kan skapa skarp ekonomisk eller kundpåverkande data. | Undvik i POC 1. Neutraliserad testdatabas krävs. |
| Odoo-plan/API | API-access kan saknas beroende på plan. | Verifiera plan/API innan scripts eller writes. |
| Persondata/GDPR | Nästan 500 personer/deltagare och historik innebär persondataansvar. | Anonymisera sample; verifiera region/avtal/access/backups innan skarp migration. |
| Överoptimism | Odoo kan se starkt ut i docs/tutorials men falla på faktiska fält eller Miranon-flöden. | POC med verifierade fält och tydliga acceptance criteria. |

## 6.2 Blockerare för POC-write

**Codex stoppade korrekt all Odoo-write.** Följande saknades och måste
finnas/verifieras innan minimal POC-write får köras:

- \`ODOO_URL\`

- \`ODOO_USERNAME\`

- \`ODOO_API_KEY\`

- \`ODOO_TARGET_MODE=test\`

- \`ODOO_ALLOW_WRITES=true\`

- \`ODOO_POC_LABEL\`

- verifierade Odoo-modeller och fält

- verifierad neutraliserad testdatabas

## 6.3 Säkerhetsbeslut som var korrekta

| **Beslut** | **Varför det var rätt** |
|----|----|
| Inga writes till Odoo/Airtable/Shopify | Testmiljö, credentials och fält var inte verifierade. |
| Råtranskript committades inte | Minskar risk med tredjepartsmaterial och onödig repo-bloat. |
| Custom webapp-kod ändrades inte | Skyddar huvudspåret och gör Odoo-testet reversibelt. |
| POC-write stoppades | Saknade testmiljö, explicit write-flagga och verifierad mapping. |
| Branch och commit användes | Ger spårbarhet och enkel rollback. |

# 7. Rekommenderad nästa arbetsordning

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr>
<th><p><strong>Nästa praktiska mål</strong></p>
<p>Bevisa ett minimalt, riskfritt Odoo Events-flöde i en neutraliserad
testdatabas med fake/anonymiserad data och verifierade importfält - utan
fakturor, betalningar, SMS eller massmail.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

| **Steg** | **Åtgärd** | **Klart när** |
|----|----|----|
| 1 | Öppna Odoo Database Manager och verifiera version, hostingmodell, plan/API-access, backup/download och duplicate/test database. | Version, plan och testdatabasstatus är dokumenterade. |
| 2 | Skapa eller verifiera duplicate/test database och kontrollera neutralisering av mail/payment providers. | Testmiljön kan inte skicka riktiga mail, betalningar eller fakturor. |
| 3 | Kontrollera installerade appar och Events settings i Odoo UI. | Events, Website, Sales/Invoicing-status och inställningar är dokumenterade. |
| 4 | Exportera faktiska Odoo-fält/importmallar för relevanta modeller. | Odoo-modeller/fält är verifierade mot faktisk instans. |
| 5 | Kör nästa Codex-uppdrag: read-only Odoo-instansverifiering och model/field inventory. | Codex har skapat faktisk Odoo inventory utan writes. |
| 6 | Ta fram anonymiserad Airtable-sample eller read-only-export. | Relationer mellan personer, event och anmälningar finns i testdata. |
| 7 | Skapa importpaket/POC-script med dry-run som standard. | Importpaketet bygger på verifierade fält och fake/anonymiserad data. |
| 8 | Kör minimal Odoo Events-POC. | 1 testevent, ett fåtal testkontakter och testanmälningar kan skapas, läsas tillbaka och raderas. |
| 9 | Jämför Odoo mot custom webapp/Shopify/Airtable. | Beslut kan tas: fortsätt, hybrid, pausa eller avbryt Odoo-spåret. |

# 8. Viktigaste filer att läsa i repot

| **Fil** | **Varför börja här** |
|----|----|
| \`odoo-migration-test-plan/00-executive-summary.md\` | Snabb överblick över hela testspåret. |
| \`odoo-migration-test-plan/17-final-recommendation.md\` | Codex slutrekommendation och beslutsstatus. |
| \`odoo-migration-test-plan/10-manual-odoo-setup-checklist.md\` | Nästa manuella steg i Odoo UI/Database Manager. |
| \`odoo-migration-test-plan/02-odoo-fit-gap-analysis.md\` | Passar/Passar inte: Odoo vs Miranon-behov. |
| \`odoo-migration-test-plan/ODOO_EVENTS_CUSTOMIZATION_DECISION.md\` | Hur mycket Events kan anpassas och med vilka metoder. |
| \`odoo-migration-test-plan/ODOO_DATABASE_HOSTING_DECISION.md\` | Databas, hosting, åtkomst och beslutsfrågor. |
| \`odoo-migration-test-plan/12-poc-result.md\` | Varför POC-write stoppades och vad som krävs för att köra den. |
| \`odoo-migration-test-plan/RUNLOG.md\` | Spårbar körlogg över vad Codex gjorde. |

# 9. Q&A - rensad och strukturerad

**1. Kan Odoo vara relevant för Miranon Media?**

> Ja, särskilt Odoo Evenemang. Det matchar kärnflödet Eventplanering -\>
> Anmälningar -\> Personer -\> Deltaganden. Det är dock inte bevisat som
> ersättare förrän faktisk Odoo-instans, fält, plan och POC har
> verifierats.

**2. Kan Odoo ersätta Shopify + Airtable + custom webapp?**

> Inte bevisat. Rekommendationen är att testa Odoo parallellt men
> behålla custom webappen som huvudspår tills vidare.

**3. Hur stark verkar Odoo Evenemang vara?**

> Starkt. Codex rapporterar verifierade standardmodeller för event,
> registreringar/deltagare, biljetter, frågor, svar och slots. Det tyder
> på en riktig domänapp.

**4. Vad är största Odoo-risken?**

> Inte brist på eventfunktioner, utan att Miranons faktiska logik är mer
> specialiserad än Odoo-standard: historik, sessioner, rollups,
> erfarenhetsnivåer, betalstatusar och dubbletter.

**5. Kan Codex hjälpa till med Odoo?**

> Ja, som researchagent, kodläsare, verifieringsagent,
> migreringsarkitekt, scriptförfattare och POC-agent. Men writes ska
> vara gateade och aldrig gå mot produktion.

**6. Kan Codex läsa miranon.se och förstå verksamheten?**

> Ja på publik nivå. Det räcker för erbjudanden och första fit-gap, men
> Codex ska inte skicka formulär, logga in eller anta privata
> Shopify-data.

**7. Kan Codex läsa Airtable?**

> Ja om exporter eller read-only credentials finns. I denna körning
> saknades AIRTABLE\_ variabler/live-exporter, så Codex använde
> repo-verifierad data.

**8. Klarar Odoo Miranons Airtable-volym?**

> Troligen ja. Cirka 20 tabeller, tusentals rader och runt 500 personer
> är inte stort för Odoo. Svårigheten ligger i relationer, historik,
> dubbletter och idempotent import.

**9. Kan Codex skapa events, deltagare och anmälningar i Odoo?**

> Tekniskt ja när API/importfält och testmiljö är verifierade. I denna
> körning stoppades det korrekt.

**10. API-writes eller importfiler först?**

> Import/export och read-only API först. API-writes först när testmiljö,
> fält, mapping, fake/anonymiserad data och explicit write-flagga finns.

**11. Hur ska Odoo-testet köras praktiskt?**

> Verifiera Database Manager, skapa/validera neutraliserad testdatabas,
> exportera Odoo-fält, kör read-only inventory, skapa anonymiserad
> sample och kör minimal event-POC.

**12. Hur anpassningsbar är Odoo Evenemang?**

> Ganska mycket i lager: standardkonfiguration, Website builder, Studio,
> import/API/middleware, custom modules på Odoo.sh/on-premise och core
> fork som sista utväg.

**13. Räcker Odoo Online?**

> För första testet: troligen ja. Det passar standard Events + Website +
> import + eventuellt Studio. Custom modules kräver normalt
> Odoo.sh/on-premise.

**14. Vad kräver Odoo.sh?**

> Custom modules, egen Python-logik, controller-ändringar, avancerade
> rapportmodeller, shell/SSH och mer kodnära drift.

**15. Hur fungerar Odoos databas?**

> Som en komplett Odoo-instans med appar, modeller, records, users,
> settings, affärslogik, access rights och attachments - inte som en
> enkel Airtable-base.

**16. Var hostas Odoo-data?**

> Beror på modell: Odoo Online, Odoo.sh, on-premise eller
> tredjepartsmanaged. Miranons faktiska hostingmodell är ännu inte
> verifierad.

**17. Hur kommer man åt Odoo-data?**

> Via UI, export/import, Database Manager backup, JSON-2 API, /doc
> metadata, Studio, Odoo.sh shell/SSH eller i vissa modeller direkt
> PostgreSQL. API-access kan bero på plan.

**18. Hur säkert är Odoo Cloud?**

> Officiella källor beskriver kryptering, datacenterkontroller,
> hardening, backup/SLA och begränsad staff access. Faktisk region,
> plan, avtal och backup måste verifieras.

**19. Vad är viktigast att kontrollera manuellt nu?**

> Odoo-version, plan/API-access, hostingmodell, installerade appar,
> Events settings, duplicate/test database, neutralisering,
> backupdownload samt mail/payment providers.

**20. Vad gav YouTube/tutorial-spåret?**

> Praktisk UI-kunskap: skapa events och mallar, publicera SEO-vänliga
> eventsidor, tickets, registration questions, attendees, scheduled
> communication, barcode/check-in och reporting.

**21. Slutligt svar på masterfrågan?**

> Ja, Codex kan göra en verifierad och säker utvärdering av om Odoo
> Events kan bli kärnan i Miranons flöde. Men om Odoo faktiskt ska bli
> kärnan är ännu inte bevisat.

# 10. Källor som Codex använde

*Källorna nedan är de som Codex själv uppgav i avrapporteringen. Detta
dokument har inte gjort en ny oberoende webbresearch, utan sammanställer
körningens resultat.*

- Odoo Events docs:
  [<u>https://www.odoo.com/documentation/19.0/applications/marketing/events.html</u>](https://www.odoo.com/documentation/19.0/applications/marketing/events.html)

- Odoo Online docs:
  [<u>https://www.odoo.com/documentation/19.0/administration/odoo_online.html</u>](https://www.odoo.com/documentation/19.0/administration/odoo_online.html)

- Odoo Studio docs:
  [<u>https://www.odoo.com/documentation/19.0/applications/studio.html</u>](https://www.odoo.com/documentation/19.0/applications/studio.html)

- Odoo API docs:
  [<u>https://www.odoo.com/documentation/19.0/developer/reference/external_api.html</u>](https://www.odoo.com/documentation/19.0/developer/reference/external_api.html)

- Odoo Security:
  [<u>https://www.odoo.com/security</u>](https://www.odoo.com/security)

- Odoo Cloud SLA:
  [<u>https://www.odoo.com/cloud-sla</u>](https://www.odoo.com/cloud-sla)

- Miranon publik startsida:
  [<u>https://miranon.se/</u>](https://miranon.se/)

- Miranon eventplanering:
  [<u>https://miranon.se/pages/eventplanering</u>](https://miranon.se/pages/eventplanering)

- Transkriptionsoutput:
  /Users/marcus/Repon/marcus-system/odoo-events-transcripts-openai
