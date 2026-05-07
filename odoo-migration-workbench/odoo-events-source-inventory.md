# Odoo Events Source Inventory

Branch: official `odoo/odoo` `19.0`.

## Viktigaste Filer

| Fil | Typ | Relevans |
|---|---|---|
| `addons/event/__manifest__.py` | manifest | Basberoenden och datafiler för Events. |
| `addons/event/models/event_event.py` | model | Huvudmodell för event. |
| `addons/event/models/event_registration.py` | model | Attendee/registration-modell. |
| `addons/event/models/event_ticket.py` | model | Ticketmodell per event. |
| `addons/event/models/event_question.py` | model | Registreringsfrågor. |
| `addons/event/models/event_registration_answer.py` | model | Svar på registreringsfrågor. |
| `addons/website_event/controllers/main.py` | controller | Publik eventlista, event page och webbanmälan. |
| `addons/event/security/ir.model.access.csv` | security | Accessrättigheter för eventmodeller. |
| `addons/event/tests/test_event_internals.py` | tests | Standardflöden för eventdata. |
| `addons/event_sale/models/*.py` | models | Koppling mellan event och sales orders/products. |
| `addons/website_event_sale/controllers/*.py` | controllers | Online ticketing/checkout. |

## Begränsning

Denna inventory bevisar bara att moduler/filer finns i officiell Odoo 19.0-kod. Den bevisar inte att modulerna är installerade i Miranons Odoo Online-databas.
