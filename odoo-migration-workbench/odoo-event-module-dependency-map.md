# Odoo Event Module Dependency Map

| Modul | Direkta beroenden | Rekommendation |
|---|---|---|
| event | barcodes, base_setup, mail, phone_validation, portal, utm | Krävs för allt. |
| website_event | event, website, website_partner, website_mail, html_builder | Krävs för publik eventregistrering. |
| event_sale | event_product, sale_management | Bara för paid tickets/sales. |
| website_event_sale | website_event, event_sale, website_sale | Bara för online checkout. |
| website_event_track | website_event | För agenda/talks/proposals. |
| event_booth | event | Ej första POC. |
| website_event_booth | website_event, event_booth | Ej första POC. |
| website_event_exhibitor | website_event | Ej första POC. |
| event_crm | event, crm | Leads senare. |
| event_sms | event, sms | SMS senare och försiktigt. |
| mass_mailing_event | event, mass_mailing | Utskick senare och försiktigt. |
