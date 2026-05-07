# Odoo Fit-Gap Analysis

| Verksamhetsbehov | Källa/status | Nuvarande lösning | Föreslagen Odoo-lösning | Fit | Komplexitet | Risk | Teståtgärd | Måste verifieras |
|---|---|---|---|---|---|---|---|---|
| Eventlista och eventdetaljer | Publik webb/verifierat | Shopify/Miranon site | Odoo Events + Website | High | Medium | Website kan vara sämre | Publicera testevent | Website app/settings |
| Anmälan till event | data-model/verifierat | Airtable forms/automations | Odoo registrations | High | Medium | Statusmapping | Fake registration | Registration fields |
| Deltagare/personregister | data-model/verifierat | Airtable Personer | Odoo Contacts + registrations | Medium/High | Medium | Dubbletter | Fake partner/attendee | Contact matching |
| Närvaro per session | data-model/verifierat | Deltaganden | Odoo check-in/barcode/slots eller hybrid | Medium | High | Sessionsmodell | Check-in POC | Slots/barcode/state |
| Betalningsstatus | data-model/verifierat | Airtable payment fields | Odoo tickets/Sales/Invoicing eller separat status | Medium | High | Faktura/payment | Läs-only först | Payment config |
| Registreringsfrågor | Registration model | Airtable fields | Odoo questions/answers | Medium/High | Medium | Relationell import | Add fake question | Answer import |
| Rapporter/rollups | data-model | Airtable formulas/rollups | Odoo reports + ev. custom/hybrid | Medium | High | Speciallogik | POC report | Report data |
| Mailbekräftelse | systemdoc | Resend/Airtable | Odoo event mail schedule | Medium | High | Skarpa mail | Neutralized test | Mail settings |
| Custom adminflöden | repo | Custom webapp | Behåll eller hybrid | Low/Medium | High | Odoo rigiditet | Efter POC | Lotta UI needs |
