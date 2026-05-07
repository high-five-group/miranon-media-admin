# Odoo Events Customization Guide

## Nivå 1 - Standardkonfiguration I Events

Använd först standardinställningar: event, templates, tags, tickets/registration types, capacity, registration questions, mail schedule, attendee-lista, stages och reporting. Detta är verifierat via Odoo docs och officiell kod, men måste verifieras i Miranons instans.

## Nivå 2 - Website/Event-Webbsidor

Website/Event kan ändra eventlistning, eventpage, copy, bilder, SEO och mobilvy. För Miranon är detta relevant eftersom nuvarande publik eventpresentation finns på Shopify och `miranon.se/pages/eventplanering` leder till anmälningsformulär.

## Nivå 3 - Studio/No-Code

Studio kan enligt Odoo-dokumentationen ändra fields, views, models, automation rules, webhooks, PDF reports, approval rules och security rules. Studio bör användas för små Miranon-specifika fält och vyer före custom module. Planpåverkan måste verifieras eftersom Odoo dokumenterar upsell från Standard till Custom när Studio installeras.

## Nivå 4 - Import/Export, External IDs Och API/Middleware

CSV/XLSX-import och External IDs bör användas för historisk import och idempotens. JSON-2 API kan användas för read-only/verifiering och senare integration om Miranons plan tillåter det. Odoo dokumenterar att API-access kräver Custom pricing plan och att faktiska modeller/fält kan läsas via `/doc`.

## Nivå 5 - Custom Modules På Odoo.sh/On-Premise

Om standard/Studio/import inte räcker, bygg en liten separat modul som ärver standardmodeller/vyer/templates/controllers. Skriv inte om `event`-kärnan. Detta kräver normalt Odoo.sh/on-premise eftersom Odoo Online är inkompatibelt med custom modules.

## Nivå 6 - Fork/Core Patch

Undvik. Core patch gör upgrades, support och säkerhet dyrare. Det är bara rimligt vid strategiskt ägd Odoo-distribution med stark teknisk förvaltning.

## Miranon-Rekommendation

Starta med Odoo Online standard + Website + event templates + gratis registrations + frågor + manual attendance. Lägg till Studio först efter att basflödet bevisats. Gå inte till Odoo.sh/custom modules förrän ett konkret gap är verifierat.
