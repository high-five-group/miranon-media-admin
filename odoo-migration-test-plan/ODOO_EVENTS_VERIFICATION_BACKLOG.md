# Odoo Events Verification Backlog

| verification_item | varför_viktigt | källa_som_behövs | föreslagen_verifieringsmetod | blockerar_import | blockerar_poc | status | notes |
|---|---|---|---|---|---|---|---|
| Faktisk Odoo-version | Matcha docs/kod | Odoo UI/Database Manager/API | Läs version i Database Manager eller `/web/webclient/version_info` om tillåtet | Ja | Ja | Ej verifierat | Arbetsantagande 19.0. |
| Hostingmodell | Avgör API/custom code | Database Manager | Kontrollera Online/Odoo.sh/on-premise | Ja | Ja | Ej verifierat | User säger Odoo Online men ej verifierat. |
| Installerade appar | Avgör funktioner | Odoo Apps/UI/API | Exportera app-lista eller read-only script | Ja | Ja | Ej verifierat | Screenshot är observation. |
| Events settings | Avgör tickets/barcode/tracks | Odoo UI | Skärmdump Events > Configuration > Settings | Ja | Ja | Ej verifierat | |
| Website integration | Publik anmälan | Odoo UI | Skapa/preview testevent i duplicate | Nej | Ja | Ej verifierat | |
| Sales/Invoicing koppling | Betalda tickets | Odoo UI/API | Kontrollera event_sale/website_event_sale/payment providers | Ja för paid | Ja för paid | Ej verifierat | Undvik första POC. |
| Event fields | Import | Odoo export/API `/doc` | Export/import template | Ja | Ja | Ej verifierat | |
| Registration fields | Import/attendees | Odoo export/API `/doc` | Export/import template | Ja | Ja | Ej verifierat | |
| Question/answer fields | Formulärsvar | Odoo export/API `/doc` | Export/import template | Ja | Nej | Ej verifierat | |
| External ID stöd | Idempotens | Odoo import UI | Import preview med fake data | Ja | Nej | Ej verifierat | |
| Mail neutralization | Undvika kundmail | Duplicate/test settings | Verifiera neutralized duplicate | Nej | Ja | Ej verifierat | |
| Persondata/anonymisering | GDPR | Airtable export/schema | Skapa anonymiserad testdata | Ja | Ja | Delvis | Repo beskriver struktur, ingen export. |
