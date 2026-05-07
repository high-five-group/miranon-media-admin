# Target Odoo Architecture

## Första Testarkitektur

- Odoo Online duplicate/test database.
- Apps: Events, Website, Contacts; Sales/Invoicing endast read-only tills paid flow är säkert.
- Data: fake/anonymiserade records.
- Import: UI import/export eller API read-only om Custom plan finns.

## Konceptuell Mapping

| Miranon | Odoo kandidat | Status |
|---|---|---|
| Eventplanering | `event.event` | Kodverifierat, instans ej verifierad |
| Anmälningar | `event.registration` | Kodverifierat, instans ej verifierad |
| Personer | `res.partner` + registrations | Odoo-standard behöver verifieras |
| Deltaganden | registration state/check-in/barcode eller slots + ev hybrid | Hypotes |
| Registreringsfrågor | `event.question` + answers | Kodverifierat |
| Betalningsstatus | tickets/Sales/Invoicing eller separat custom field | Hypotes |

## När Odoo Online Räcker

När standard Events + Website + import + ev. Studio kan hantera event/anmälningsflödet utan tung custom logic.

## När Odoo.sh Behövs

När verifierade gap kräver egen modul, controller, rapportmodell, avancerad relationell importlogik eller specialiserad business logic inne i Odoo.

## När Custom Webappen Bör Behållas

Om Lottas dagliga specialflöden, historik, närvarologik eller rapportering blir enklare/säkrare i den befintliga appen än i Odoo.
