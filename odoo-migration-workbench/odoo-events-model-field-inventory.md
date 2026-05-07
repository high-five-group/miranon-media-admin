# Odoo Events Model Field Inventory

| Modell | Kodverifierade fält | Instansstatus | Importstatus |
|---|---|---|---|
| `event.event` | `name`, `date_begin`, `date_end`, `date_tz`, `event_type_id`, `organizer_id`, `address_id`, `seats_max`, `seats_limited`, `event_ticket_ids`, `registration_ids`, `question_ids` | Ej verifierat | Ej verifierat |
| `event.registration` | `event_id`, `event_slot_id`, `event_ticket_id`, `partner_id`, `name`, `email`, `phone`, `company_name`, `state`, `barcode`, `registration_answer_ids` | Ej verifierat | Ej verifierat |
| `event.event.ticket` | `event_id`, `start_sale_datetime`, `end_sale_datetime`, `limit_max_per_order`, `seats_reserved`, `seats_available`, `seats_used`, `seats_taken` | Ej verifierat | Ej verifierat |
| `event.question` | `title`, `question_type`, `answer_ids`, `once_per_order`, `is_mandatory_answer` | Ej verifierat | Ej verifierat |
| `event.registration.answer` | `question_id`, `registration_id`, `value_answer_id`, `value_text_box` | Ej verifierat | Ej verifierat |
