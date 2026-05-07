# Odoo Events Source Code Review

Se även:

- `ODOO_EVENTS_CODE_DEEP_DIVE.md`
- `odoo-migration-workbench/odoo-event-source-code-map.md`
- `odoo-migration-workbench/odoo-events-source-inventory.md`

## Sammanfattning

Officiell Odoo 19.0-kod visar att Events-flödet är modulärt:

1. `event` ger grundobjekten.
2. `website_event` publicerar och tar emot registreringar via webb.
3. `event_sale` och `website_event_sale` lägger till paid ticket/sales/eCommerce-flöde.
4. `website_event_track`, `event_booth`, `website_event_exhibitor`, `event_crm`, `event_sms` och `mass_mailing_event` bygger vidare med konferens-, lead- och kommunikationsfunktioner.

## Viktiga Extension Points

| Nivå | Verifierad extension point | Kommentar |
|---|---|---|
| Model inheritance | `event.event`, `event.registration`, `event.event.ticket`, `event.question`, `event.registration.answer` | Kan ärvas i custom module på Odoo.sh/on-premise. |
| View inheritance | XML-vyer i `addons/event/views` och `addons/website_event/views` | Kan ärvas/ändras via Studio eller custom module beroende på nivå. |
| Controllers/routes | `website_event.controllers.main.WebsiteEventController` | Publikt webbanmälningsflöde kan vara känsligt att överstyra. |
| Templates | `website_event` event page/registration templates | Website builder/Studio bör testas före kodändring. |
| Security | `security/*.xml`, `ir.model.access.csv` | Måste verifieras mot faktisk användare/grupper. |
| Tests/demo | `addons/event/tests`, `addons/website_event/tests`, `addons/event_sale/tests` | Bra som förståelse, men inte Miranon-instansbevis. |

## Inte Anta

- Att alla källkodsmoduler är installerade.
- Att Odoo Online ger custom module-möjlighet.
- Att Enterprise-funktioner eller planberoenden ingår.
- Att importer kan göras med samma fältnamn som i Python-modellen utan import/export-verifiering.
