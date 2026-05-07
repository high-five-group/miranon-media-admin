# Odoo Event Source Map

Se `odoo-event-source-code-map.md` för tabellformat. Denna fil behålls för Körning 0B:s filnamnskrav.

## Kort Mapping

- Basflöde: `event` -> `event.event`, `event.registration`, `event.event.ticket`, `event.question`, `event.registration.answer`.
- Website-flöde: `website_event` -> publika routes/templates och eventmenyer.
- Paid flow: `event_sale` + `website_event_sale` -> sales/eCommerce/order/payment-risk.
- Advanced: `website_event_track`, `website_event_exhibitor`, `event_booth`, `event_crm`, `event_sms`, `mass_mailing_event`.
