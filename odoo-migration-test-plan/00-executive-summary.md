# Executive Summary

## Rekommendation

Fortsätt med Odoo som kontrollerat parallelltest för eventflödet, men behåll custom webappen som huvudspår tills Odoo har bevisat faktisk instans, importfält, neutraliserad testmiljö och minimal POC.

## Vad Testet Ska Bevisa

1. Kan Odoo Events ersätta eller komplettera Miranons eventplanering och anmälningar?
2. Kan Odoo Website presentera events tillräckligt bra jämfört med Shopify?
3. Kan Odoo hantera registrations, questions, attendees och attendance/check-in?
4. Kan historisk Airtable-data migreras utan dubbletter och utan att förstöra persondata?
5. Kan detta göras i Odoo Online utan custom modules?

## Starkaste Bevis Hittills

- Officiell Odoo 19.0-kod visar tydliga eventmodeller för event, registrations, tickets, questions och answers.
- Odoo docs/tutorials visar standardflöden för event, Website, tickets, attendee management, barcode och reporting.
- Miranons repo visar en tydlig event/person/anmälnings/närvarodomän som passar bra att testa mot Events.

## Största Risker

- Faktisk Odoo-instans är inte verifierad.
- API kan saknas om planen inte är Custom.
- Paid tickets/fakturering/mail kan påverka produktion om testmiljö inte är neutraliserad.
- Miranons `Deltaganden` och historiska sessionslogik kan vara mer specialiserad än Odoo-standard.

## Minsta Nästa Test

Skapa en Odoo duplicate/test database, verifiera neutralisering och kör en gratis fake event-loop: template -> event -> website page -> registration question -> fake attendee -> manual check-in -> report.
