# Odoo Events Code Deep Dive

## Källstatus

- Repo: `https://github.com/odoo/odoo`
- Branch: `19.0`
- Lokal arbetskopia: `odoo-migration-workbench/external-source/odoo-19.0` (ignoreras från git)
- Status: verifierat i officiell Odoo 19.0-källkod, inte verifierat i Miranons instans.

## Verifierade Eventrelaterade Moduler

| Modul | Syfte | Dependencies enligt manifest | Miranon-relevans | Instansstatus |
|---|---|---|---|---|
| `event` | Bas: events, tickets, registrations, questions, barcode, mail schedule. | `barcodes`, `base_setup`, `mail`, `phone_validation`, `portal`, `utm` | Kritisk. | Ej verifierat. |
| `website_event` | Publicera events och registrering på Website. | `event`, `website`, `website_partner`, `website_mail`, `html_builder` | Kritisk för publik anmälan. | Ej verifierat. |
| `event_sale` | Kopplar registrations till sales orders och invoicing feature. | `event_product`, `sale_management` | Relevant för betalda biljetter, riskområde. | Ej verifierat. |
| `website_event_sale` | Online event ticketing via eCommerce. | `website_event`, `event_sale`, `website_sale` | Relevant men ska inte testas skarpt först. | Ej verifierat. |
| `event_booth` | Booth management. | `event` | Låg initial relevans. | Ej verifierat. |
| `website_event_booth` | Online booth registration på website. | `website_event`, `event_booth` | Låg initial relevans. | Ej verifierat. |
| `website_event_exhibitor` | Sponsors/exhibitors på eventwebb. | `website_event` | Låg/medium för partner/sponsor-event. | Ej verifierat. |
| `website_event_track` | Tracks, agenda, proposals, PWA-ish eventflöden. | `website_event` | Medium senare, låg i första POC. | Ej verifierat. |
| `website_event_track_live` | Live track streaming. | `website_event_track` | Låg initial relevans. | Ej verifierat. |
| `event_crm` | Leads från event registrations. | `event`, `crm` | Medium, efter grundflöde. | Ej verifierat. |
| `event_sms` | SMS i event mail schedule. | `event`, `sms` | Riskområde pga kostnad/IAP. | Ej verifierat. |
| `mass_mailing_event` | Massutskick till attendees. | `event`, `mass_mailing` | Relevant men mailrisk. | Ej verifierat. |

## Verifierade Modeller I Officiell Kod

| Modell | Modul/fil | Verifierade fält/egenskaper från kod | Import-/POC-notering |
|---|---|---|---|
| `event.event` | `addons/event/models/event_event.py` | `name`, `date_begin`, `date_end`, `date_tz`, `event_type_id`, `organizer_id`, `address_id`, `seats_max`, `seats_limited`, `event_ticket_ids`, `registration_ids`, `question_ids`, `event_url`, `stage_id`. | Fält är kodverifierade men inte instans-/importverifierade. |
| `event.registration` | `addons/event/models/event_registration.py` | `event_id`, `event_slot_id`, `event_ticket_id`, `partner_id`, `name`, `email`, `phone`, `company_name`, `state`, `barcode`, `registration_answer_ids`. | Bra match mot anmälningar/deltagare, men statusmapping måste göras. |
| `event.event.ticket` | `addons/event/models/event_ticket.py` | `event_id`, `start_sale_datetime`, `end_sale_datetime`, `limit_max_per_order`, `seats_*`, `registration_ids`, `color`. | Ticket/prisfält från Sales kan tillkomma via `event_sale`. |
| `event.question` | `addons/event/models/event_question.py` | `title`, `question_type`, `answer_ids`, `once_per_order`, `is_mandatory_answer`, `event_ids`, `event_type_ids`. | Matchar registreringsfrågor men importfält måste verifieras. |
| `event.registration.answer` | `addons/event/models/event_registration_answer.py` | `question_id`, `registration_id`, `value_answer_id`, `value_text_box`, related `event_id`. | Kräver relationell importordning och verified IDs. |
| `event.slot` | `addons/event/models/event_slot.py` | `event_id`, `date`, `start_hour`, `end_hour`, `registration_ids`, seat computations. | Kan matcha Miranons `Deltaganden.Session`, men är inte samma modell. |

## Verifierade Controllers/Routes

| Route | Fil | Vad den gör | Risk |
|---|---|---|---|
| `/event`, `/events` | `addons/website_event/controllers/main.py` | Publik eventlista med sök/filter. | Kräver Website och publiceringskonfig. |
| `/event/<event>` | samma | Publik eventsida. | SEO/layout måste jämföras mot Shopify. |
| `/event/<event>/register` | samma | Publik registreringssida. | Formulär måste testas utan riktiga mail. |
| `/event/<event>/registration/new` | samma | JSONRPC som renderar attendee-form efter tickets. | Ticket/seat-validering kan stoppa test om setup fel. |
| `/event/<event>/registration/confirm` | samma | Skapar attendee registrations från webbpost. | Extern write via publik webb; får bara testas i neutralized/test. |
| `/event/init_barcode_interface` | `addons/event/controllers/main.py` | Init för barcode/registration desk. | Kräver rättigheter och barcode setting. |

## Säkerhet Och Access

Källan innehåller `security/ir.model.access.csv` och modulvisa security XML-filer för `event`, `website_event`, `event_sale`, `event_crm`, tracks, booths och exhibitors. Detta visar att rättigheter och record rules finns i standardmodulerna, men exakt åtkomst i Miranons databas beror på användare, grupper, installerade appar och Odoo Online-konfiguration.

## Slutsats

Odoo Events har tekniskt stöd för Miranons basflöde: event, biljetter/registration types, registrations, questions, attendees, public website registration, mail schedule, barcode och rapportering. Det största osäkerhetsområdet är inte om standardmodeller finns i Odoo 19.0-kod, utan om Miranons Online-databas har rätt appar/plan, om importfält matchar, och om mail/fakturering kan neutraliseras säkert i test.
