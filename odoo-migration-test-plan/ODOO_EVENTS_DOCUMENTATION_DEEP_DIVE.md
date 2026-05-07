# Odoo Events Documentation Deep Dive

## Lästa Officiella Källor

| Område | URL | Verifierade slutsatser | Miranon-relevans | Status |
|---|---|---|---|---|
| Events overview/settings | `https://www.odoo.com/documentation/19.0/applications/marketing/events.html` | Events har inställningar för schedule/tracks, live broadcast, gamification, community rooms, booth management, tickets och online ticketing. | Hög, eftersom Miranon driver utbildningar/föreläsningar med publicering, anmälningar och närvaro. | Verifierat via dokumentation. |
| Events + Website/Sales/CRM | samma | Odoo dokumenterar att Events integrerar med Website för publik presentation/registrering, Sales för betalda biljetter och CRM via lead generation rules. | Hög för eventflöde; betalning/fakturering måste testas försiktigt. | Verifierat via dokumentation. |
| Studio | `https://www.odoo.com/documentation/19.0/applications/studio.html` | Studio kan anpassa fält, vyer, modeller, automations, webhooks, PDF reports, approval rules och security rules. | Hög för Odoo Online-anpassningar utan kod. | Verifierat via dokumentation. |
| Odoo Online | `https://www.odoo.com/documentation/19.0/administration/odoo_online.html` | Odoo Online har privata databaser hostade/managerade av Odoo, nås via webbläsare och är inkompatibelt med custom modules. | Avgörande för första testet. | Verifierat via dokumentation. |
| External JSON-2 API | `https://www.odoo.com/documentation/19.0/developer/reference/external_api.html` | JSON-2 API är nytt i 19.0; modeller/fält är databasspecifika och kan konsulteras på `/doc`; external API kräver Custom pricing plan. | Avgör om Codex kan läsa Odoo metadata automatiskt. | Verifierat via dokumentation; Miranon-plan ej verifierad. |

## Events-Funktioner Som Påverkar Miranon

| Funktion | Dokumentationsbaserad innebörd | Miranon-effekt | Måste testas |
|---|---|---|---|
| Event creation | Event kan skapas från scratch eller template. | Matchar `Eventplanering` och återkommande utbildningsformat. | UI: skapa testevent i duplicerad/testdatabas. |
| Tickets | Tickets kan användas för tiers/priser; online ticketing kopplar till eCommerce/Website. | Kan ersätta eller komplettera anmälningsavgift/slutbetalning, men ekonomiflödet är riskigt. | Testa först gratis eller zero-price ticket. |
| Registration questions | Frågor kan ställas vid anmälan. | Matchar motivering/tidigare erfarenhet och annan anmälningsinfo. | Exportera faktiska Odoo-frågefält innan import. |
| Attendees/registrations | Odoo har attendee-lista och statusflöde. | Kärnmatch mot `Anmälningar`. | Verifiera Odoo statusar mot Miranons statusar. |
| Barcode/check-in | Attendance/barcode kan aktiveras. | Matchar `Deltaganden` och närvaroflöde. | Testa registration desk utan riktiga deltagare. |
| Website event page | Event kan publiceras och SEO-redigeras. | Kan ersätta delar av Shopify eventpresentation. | Jämför med nuvarande Shopify-sidor. |
| Reporting | Attendee/revenue reports finns. | Kan ersätta vissa Airtable-rollups/rapporter. | Testa mot POC-data. |
| Tracks/talks | Avancerade event kan ha agenda/talks/proposals. | Troligen överkurs för första Miranon-test. | Vänta tills basflödet fungerar. |
| Booths/exhibitors/community | Events har avancerade konferensfunktioner. | Låg initial relevans för utbildningar. | Undvik i första POC om inte konkret behov uppstår. |

## Risker

- Odoo-dokumentation visar generella funktioner, inte vilka appar/fält som är installerade i Miranons databas.
- Betalda biljetter kan trigga Sales/Website Sale/Payments/Invoicing och måste isoleras från skarp ekonomi.
- Mailkommunikation kan skicka riktiga mail om testmiljö inte är neutraliserad.
- Odoo-statusar och Miranon-statusar matchar inte 1:1 utan mapping.

## Verifieringskrav Innan Import/POC

1. Faktisk Odoo-version.
2. Installerade eventrelaterade appar.
3. Om Website, Sales och Invoicing är aktiva.
4. Om duplicate/test database är neutraliserad.
5. Export/importfält för event, registrations, tickets, questions och answers.
6. Om API `/doc` är tillgängligt på nuvarande plan.
