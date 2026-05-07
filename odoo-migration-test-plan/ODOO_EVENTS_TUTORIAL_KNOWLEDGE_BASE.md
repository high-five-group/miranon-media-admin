# Odoo Events Tutorial Knowledge Base

## Tutorialkällor Och Status

Källa: `/Users/marcus/Repon/marcus-system/odoo-events-transcripts-openai`.

Status: komplett på playlistnivå enligt lokal `QUALITY_REPORT.md`: 17/17 videos, 0 errors. Kunskapen nedan är sammanfattad i egna ord från summaryfilerna och används som praktisk UI-källa, inte som faktisk Miranon-instansverifiering.

## Täckta Lektioner

| # | Titel | Ämne | Relevans |
|---:|---|---|---|
| 01/15 | Live Broadcast & Gamification | YouTube live/replay, quiz, gamification | Låg initialt, senare för digitala event. |
| 02/17 | Communication & Attendance | Scheduled communications, attendee-lista, status, cancellation | Hög men mailrisk. |
| 03/13 | Online Exhibitors | Sponsors/exhibitors, virtual booths | Låg initialt. |
| 04 | Events Lead Generation | CRM leads från registrations | Medium senare. |
| 05 | Events Basics | Settings, tracks, ticketing, eventdatum, timezone, template, tags, venue, capacity, tickets, questions | Hög. |
| 06 | Edit and Publish SEO-friendly Events | Website editor, SEO, mobile preview, publish | Hög för Shopify-jämförelse. |
| 07 | Talk Proposals | Web proposal form till track backend | Låg initialt. |
| 08 | Communicate With Speakers | Email/SMS till speakers | Låg/medium, mail/SMS-risk. |
| 09 | Event Tracks | Tracks, speaker, duration, tags, quiz | Medium senare. |
| 10 | Event Templates | Template för återkommande event med tickets/questions/notes | Hög. |
| 11 | Measure Your Success | Attendee/revenue reporting, filters, measures, survey/massmail | Medium/hög. |
| 12 | Physical Events Management | Booths/sponsors/floor plan/booking/payment | Låg initialt. |
| 14 | Community Rooms | Rooms, audience, language, capacity | Låg initialt. |
| 16 | Attendance by Barcode | Barcode, badges, scanner, manual check-in | Hög för närvaro. |

## Miranon-Relevanta Slutsatser

1. Första POC bör följa tutorialens basflöde: skapa event, sätt datum/tidszon/plats, sätt capacity, lägg till gratis ticket och registreringsfrågor, publicera i Website.
2. Event templates är särskilt relevant eftersom Miranon har återkommande format som Fjärrskådning och Resor i Medvetandet.
3. Attendance/barcode bör testas efter första registreringsflödet, eftersom Miranons nuvarande modell skiljer på `Anmälningar` och `Deltaganden`.
4. Scheduled communications är funktionellt lovande men ska bara testas i neutralized duplicate eftersom riktiga mail är en produktionsrisk.
5. Reporting kan jämföras mot Airtable-rollups, men speciallogik som erfarenhetsnivå och historisk närvaro kräver sannolikt separat mapping eller custom/hybrid.

## Overifierat

- Faktiska menyval i Miranons Odoo-databas.
- Om alla tutorialfeatures finns på Miranons plan.
- Om mail/SMS/payment är neutraliserade.
- Exakta Odoo-importfält.
