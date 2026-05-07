# Tutorial Feature To Miranon Map

| Tutorial-feature | Källa/video/fil | Vad tutorialen visar | Miranon-behov det kan stödja | Relevans | Kan testas i första POC | Kräver Odoo-instansverifiering | Kräver Airtable-data | Kräver Website/Sales/Invoicing | Risk | Rekommenderad teståtgärd |
|---|---|---|---|---|---|---|---|---|---|---|
| Events Basics | `summaries/05-events-basics.md` | Eventform, settings, tracks, ticketing, datum, timezone, venue, capacity, questions | Eventplanering/anmälan | High | Ja | Ja | Nej, fake data räcker | Website; Sales om paid | Medel | Skapa fake event i duplicate. |
| SEO-friendly publish | `summaries/06-edit-and-publish-seo-friendly-events.md` | Website edit, SEO, mobile preview, publish | Ersätta Shopify eventpage | High | Ja | Ja | Nej | Website | Låg/medel | Jämför testpage mot Shopify. |
| Event templates | `summaries/10-event-templates.md` | Återanvänd settings/tickets/questions/notes | Återkommande utbildningar/föreläsningar | High | Ja | Ja | Nej | Events/Website | Låg | Skapa template för fake format. |
| Communication & Attendance | `summaries/02...`, `17...` | Scheduled confirmation, attendee management, cancel/attend | Bekräftelsemail/status | High | Kanske | Ja | Nej | Mail | Hög | Testa utan mail eller i neutralized duplicate. |
| Attendance by Barcode | `summaries/16-attendance-by-barcode.md` | Badge, scanner/manual check-in | Deltaganden/närvaro | High | Efter bas | Ja | Nej | Events | Medel | Testa fake attendee check-in. |
| Measure Success | `summaries/11-measure-your-success.md` | Attendee/revenue reports | Rapportering | Medium | Ja efter POC | Ja | Nej | Reports/Sales | Medel | Skärmdumpa POC reports. |
| Lead Generation | `summaries/04-events-lead-generation.md` | Leads från registrations | CRM/lead-magnet | Medium | Nej | Ja | Ja senare | CRM | Medel | Vänta. |
| Tracks/Proposals | `summaries/07...`, `09...` | Agenda/talks/proposals | Möjliga föreläsningsprogram | Low/Medium | Nej | Ja | Nej | Website Event Track | Låg | Vänta. |
| Exhibitors/Booths/Rooms | `summaries/03...`, `12...`, `14...` | Sponsors, booths, community rooms | Ej kärnbehov nu | Low | Nej | Ja | Nej | Website/Sales | Medel | Undvik första POC. |
