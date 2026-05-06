# 08 — Odoo-validering av S-track

> **Status:** Sidospår till Fas 5 (tvåstegs-migrationsplan). Påverkar inte 06b — Gate 4B är passerad.
> **Output:** kandidater att lyfta i `07-migration-plan.md`. Inga 06b-tabeller, fält, constraints eller principer ändras av detta dokument.
> **Källprincip:** 06b är sanning, Odoo är referens. Påståenden om Odoo som inte kan verifieras mot kod eller officiell 19.0-dokumentation tas inte med.

## Källpinning

| Källa | Version | SHA / branch | Hämtad |
|---|---|---|---|
| `odoo/odoo` core (event-domän, res.partner, crm.lead) | 19.0 | `2154e11ef5c7860adee88013ad80422d2b4f5816` (commit 2026-05-03) | 2026-05-03 |
| `OCA/event` (community-tillägg) | 18.0 | branch `18.0` | 2026-05-03 |

Notering om OCA-version: `OCA/event` 19.0-grenen existerar men innehåller per 2026-05-03 inga moduler (Odoo 19.0 är så nyligen släppt att community-portarna inte påbörjats). Som närmaste pålitliga referens används OCA 18.0. Vid varje OCA-citat anges modulnamn och 18.0-manifest-version. Om en princip från OCA 18.0 senare ändras i 19.0-portningen ska detta dokument omvärderas — jämförelsen är dock på arkitekturnivå (tabell, fältset, semantik), inte på rad-för-rad-implementation.

## Del A — Odoos event-domän i sammanfattning

### A1. `event.event` — eventkärna

Modell: `event.event` ([odoo/addons/event/models/event_event.py:33](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_event.py#L33)).

Centrala fält: `name` (Char, required), `date_begin` + `date_end` (Datetime, required, tracking), `seats_max` (Integer, compute), `seats_limited` (Boolean), `stage_id` (Many2one → `event.stage`), `kanban_state` (Selection: normal/done/blocked/cancel), `event_type_id` (Many2one → `event.type`, mall), `is_multi_slots` (Boolean), `event_slot_ids` (One2many → `event.slot`), `event_ticket_ids` (One2many → `event.event.ticket`), `company_id` (Many2one → `res.company`).

Inheritance: `mail.thread` + `mail.activity.mixin` ger automatisk audit-tracking (kommunikation, write-historik, activity-aktiviteter).

Constraints: `_check_closing_date` (date_end ≥ date_begin) och `_check_slots_dates` (slots inom event-tidsfönstret) i [event_event.py:583-611](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_event.py#L583-L611).

Multi-tenancy: via `company_id` och `ir.rule` `event_event_company_rule` med domain `[('company_id', 'in', company_ids + [False])]` ([odoo/addons/event/security/event_security.xml:35-39](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/security/event_security.xml#L35-L39)). NULL company_id är tillåtet och innebär "global/delad".

### A2. `event.registration` — anmälan

Modell: `event.registration` ([event_registration.py:14](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_registration.py#L14)).

State machine ([event_registration.py:69-79](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_registration.py#L69-L79)):
- `draft` ("Unconfirmed") → `open` ("Registered") → `done` ("Attended")
- `cancel` ("Cancelled") som terminal sidoväg
- 4 states totalt. Default: `open`.

Centrala fält: `event_id` + `event_slot_id` + `event_ticket_id` (tre Many2one), `partner_id` (Many2one → `res.partner`, tracking, **kan vara None**), `name`/`email`/`phone`/`company_name` (Char med compute-synk från partner men store=True så de kan ha eget värde — snapshot-mönster), `barcode` (random default, unique constraint), `active` (Boolean), `state`, `mail_registration_ids` (One2many → `event.mail.registration`), `registration_answer_ids` (One2many → `event.registration.answer`), UTM-fält (`utm_campaign_id`, `utm_source_id`, `utm_medium_id`).

Constraints:
- `_barcode_event_uniq = models.Constraint('unique(barcode)', ...)` ([event_registration.py:92-95](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_registration.py#L92-L95)) — global unik barcode.
- `_check_seats_availability` ([event_registration.py:97-107](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_registration.py#L97-L107)) — Python-constraint som validerar capacity vid write/create.
- `_check_event_slot` + `_check_event_ticket` ([event_registration.py:200-210](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_registration.py#L200-L210)) — säkerställer att slot/ticket tillhör samma event.

State-historik: implicit via `mail.thread`-inheritance ([event_registration.py:16](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_registration.py#L16)) — varje statusändring loggas i `mail.message` med `tracking=6` på `state`-fältet ([event_registration.py:75](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_registration.py#L75)). Det finns ingen separat transition-tabell.

### A3. `event.event.ticket` — ticket/biljett

Modell: `event.event.ticket` ([event_ticket.py:8-16](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_ticket.py#L8-L16)). Inherit: `event.type.ticket` (mall).

Centrala fält: `event_id` (required, ondelete='cascade'), `name`, `seats_max`, `seats_reserved`/`seats_available`/`seats_used`/`seats_taken` (compute via SQL-aggregat över `event_registration` med `state IN ('open','done')` — [event_ticket.py:80-108](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_ticket.py#L80-L108)), `start_sale_datetime`/`end_sale_datetime`, `limit_max_per_order`.

Constraints: `_constrains_dates_coherency` (sale-end ≥ sale-start) och `_constrains_limit_max_per_order` ([event_ticket.py:118-136](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_ticket.py#L118-L136)). Skydd mot delete vid existerande registrations: `_unlink_except_if_registrations` ([event_ticket.py:190-195](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_ticket.py#L190-L195)).

### A4. `event.mail` + `event.mail.registration` + `event.mail.slot` — kommunikationsschemaläggning

Modeller: `event.mail` ([event_mail.py:25](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_mail.py#L25)), `event.mail.registration` ([event_mail_registration.py:11](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_mail_registration.py#L11)), `event.mail.slot` ([event_mail_slot.py:5](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_mail_slot.py#L5)).

`event.mail` är schemaläggar-config: `interval_nbr` + `interval_unit` (now/hours/days/weeks/months) + `interval_type` (after_sub/before_event/after_event_start/after_event/before_event_end). Triggas av cron `event.event_mail_scheduler`. State-fält: `mail_done` (Boolean), `mail_state` (Selection: running/scheduled/sent/error/cancelled — **compute, inte stored**), `error_datetime` (Datetime), `mail_count_done` (Integer).

`event.mail.registration` är per-attendee-rad: `scheduler_id` + `registration_id` + `scheduled_date` + `mail_sent` (Boolean). Ingen attempt_no, ingen provider_message_id, ingen per-försök-status.

Retry-modell: vid fel sätts `error_datetime` på scheduler-nivå. Ingen automatisk retry-logik finns i kärnmodellen — det är operativt cron-batch via `auto_commit` per chunk ([event_mail.py:269-287](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_mail.py#L269-L287)).

### A5. `event.slot` — multi-slot-stöd

Modell: `event.slot` ([event_slot.py:15](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_slot.py#L15)). Centrala fält: `event_id` (required, ondelete='cascade'), `date` (Date, required), `start_hour` + `end_hour` (Float 0–23.99, required), `start_datetime` + `end_datetime` (compute, store=True). Constraints: `_check_hours` och `_check_time_range` ([event_slot.py:47-68](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_slot.py#L47-L68)). Ingen `slot_key`/stable key, ingen status-kolumn, ingen sequence_no — `_order = "event_id, date, start_hour, end_hour, id"`.

### A6. `event.stage` + `event.type` — pipeline och mall

`event.stage` ([event_stage.py:7-19](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_stage.py#L7-L19)) är en simpel mini-tabell: `name`, `description`, `sequence`, `fold`, `pipe_end` (Boolean — slut-stage). Ingen tenant_id, inga transitions. Refereras från `event.event.stage_id`.

`event.type` ([event_type.py:5](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_type.py#L5)) är eventmall med `name`, `seats_max`, `default_timezone`, `event_type_ticket_ids`, `event_type_mail_ids`, `question_ids`. Används vid `event.event`-create för att seed:a config.

### A7. `event.question` + `event.registration.answer` — dynamiska formulärfrågor

`event.question` ([event_question.py:8](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_question.py#L8)) definierar frågor med `question_type` Selection (text_box/simple_choice/name/email/phone/company_name) som kan kopplas till events eller event_types. `event.registration.answer` ([event_registration_answer.py:9](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_registration_answer.py#L9)) lagrar svaret per registration: `question_id`, `registration_id` (required, ondelete='cascade'), `value_answer_id` (för simple_choice), `value_text_box`. Constraint `_value_check` ([event_registration_answer.py:23-28](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_registration_answer.py#L23-L28)) säkerställer att rätt värdefält är ifyllt för rätt question_type.

### A8. OCA-tilläggsmoduler (18.0)

Sex moduler valda för relevans mot Miranons gap:

| Modul | Adresserar | Källa (manifest) |
|---|---|---|
| `event_session` | Multi-day sessioner inom event (snarlikt 06b `event_sessions`) | [OCA/event/event_session/__manifest__.py @ 18.0](https://github.com/OCA/event/blob/18.0/event_session/__manifest__.py) |
| `event_registration_partner_unique` | Idempotens: 1 registration per partner per event | [OCA/event/event_registration_partner_unique/__manifest__.py @ 18.0](https://github.com/OCA/event/blob/18.0/event_registration_partner_unique/__manifest__.py) |
| `event_min_seat` | Minimum capacity (motsvarar Manuella/Extra/Arrangörsplatser) | [OCA/event/event_min_seat/__manifest__.py @ 18.0](https://github.com/OCA/event/blob/18.0/event_min_seat/__manifest__.py) |
| `event_stage_cancelled` | Explicit cancel-state i event-pipelinen | [OCA/event/event_stage_cancelled/__manifest__.py @ 18.0](https://github.com/OCA/event/blob/18.0/event_stage_cancelled/__manifest__.py) |
| `event_registration_cancel_reason` | Reason-kolumn vid avbokning (parallell till `registration_state_transitions.reason`) | [OCA/event/event_registration_cancel_reason/__manifest__.py @ 18.0](https://github.com/OCA/event/blob/18.0/event_registration_cancel_reason/__manifest__.py) |
| `event_registration_multi_qty` | Antal platser per registration (parallell till `registration_attendees`-koncept) | [OCA/event/event_registration_multi_qty/__manifest__.py @ 18.0](https://github.com/OCA/event/blob/18.0/event_registration_multi_qty/__manifest__.py) |

OCA-mönstret bekräftar att Odoos kärnmodell saknar fyra koncept som 06b bygger in från start: explicit session-tabell, idempotens per partner, cancel-reason, och multi-qty per anmälan. Communityn löser dessa via separata addons.

## Del B — Validering: 06b-tabeller med Odoo-motsvarighet

Format per jämförelsepunkt: 06b-anchor → Odoo-anchor → bedömning → konsekvens.

### B1. `events` ↔ `event.event`

| Aspekt | 06b-anchor | Odoo-anchor | Bedömning |
|---|---|---|---|
| Identitet | `events.event_key text` stable, unique `(tenant_id, event_key)` ([06b:217-218](docs/research/datamodell-research/06b-supabase-target.md#L217-L218)) | `event.event` använder bara DB-id som identitet; `name` är inte unik | **06b strängare** — Odoo har inget stable key-koncept |
| Tenant | `tenant_id uuid not null` | `company_id` Many2one + `ir.rule` med `[('company_id', 'in', company_ids + [False])]`; **NULL tillåtet** | **06b strängare** — NOT NULL kontra Odoos NULL-som-global |
| Status | `status check in ('draft','open','full','cancelled','completed','archived')` | `stage_id` Many2one → `event.stage` (data-driven) + `kanban_state` Selection (normal/done/blocked/cancel) | **Odoo flexiblare** men inte strängare — 06b har enum, Odoo har konfigurerbar tabell |
| Capacity | `capacity int null check >= 0` | `seats_max` Integer + `seats_limited` Boolean + computed `seats_available/_reserved/_used/_taken` | **Match** med utvidgning — Odoo har computed-fält som 06b kan addera som read model |
| Audit | Generell `audit_log` polymorf | Inbyggd via `mail.thread`-inherit ([event_event.py:35](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_event.py#L35)) | **Olika modeller** — Odoo loggar i `mail.message` per record, 06b har central audit_log + sensitive_change_log |

### B2. `event_sessions` ↔ `event.slot` (core) + OCA `event_session`

| Aspekt | 06b-anchor | Odoo-anchor | Bedömning |
|---|---|---|---|
| Identitet | `session_key text` stable, unique `(tenant_id, event_id, session_key)` ([06b:234](docs/research/datamodell-research/06b-supabase-target.md#L234)) | `event.slot` har bara DB-id; `_order` på date+hour ([event_slot.py:18](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_slot.py#L18)) | **06b strängare** — stable key för export/idempotens |
| Tidsmodell | `starts_at`/`ends_at` Datetime null | `date` Date + `start_hour`/`end_hour` Float 0–23.99 ([event_slot.py:22-25](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_slot.py#L22-L25)), datetime computeas med tz ([event_slot.py:70-77](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_slot.py#L70-L77)) | **Skiljer sig** — Odoos float-hour är optimering för UX (slot-pickern), 06b:s plain Datetime är enklare för servern |
| Bounds-validering | (saknas i 06b) | `_check_time_range`: slot måste ligga inom `event.date_begin..date_end` ([event_slot.py:55-68](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_slot.py#L55-L68)) | **Lucka i 06b** — bör adderas som DB-trigger eller app-constraint |
| Sequence | `sequence_no int not null` ([06b:233](docs/research/datamodell-research/06b-supabase-target.md#L233)) | Implicit via `_order`; ingen explicit seq | **06b strängare** — explicit ordningskolumn skyddar mot subtila datum-bugs |
| Status | `status check in ('planned','cancelled','completed')` | (saknas — slot är inte cancelable separat) | **06b strängare** — relevant för Miranon eftersom enskilda dagar kan ställas in |
| Cascade-skydd | (06b: `event_id -> events`) | `_unlink_except_if_registrations` ([event_slot.py:139-144](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_slot.py#L139-L144)) | **Match-mönster** — bör replikeras som DB-trigger eller domain-regel i Supabase |

OCA `event_session` (18.0) bekräftar att session-koncept är förväntad utvidgning, inte överdesign.

### B3. `registrations` ↔ `event.registration`

| Aspekt | 06b-anchor | Odoo-anchor | Bedömning |
|---|---|---|---|
| State machine | `status check in ('draft','pending','confirmed','waitlisted','cancelled','rebooked','completed','no_show')` — 8 states ([06b:269](docs/research/datamodell-research/06b-supabase-target.md#L269)) | `state` Selection 4 states: draft/open/done/cancel ([event_registration.py:69-79](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_registration.py#L69-L79)) | **06b utvidgar** — `waitlisted`, `rebooked`, `no_show`, `pending` är affärslogik som Odoo inte har (waitlist hanteras i andra moduler) |
| Idempotens | `idempotency_key text null` + unique partial `(tenant_id, integration_source_id, idempotency_key)` ([06b:270](docs/research/datamodell-research/06b-supabase-target.md#L270)) | `barcode` random default + `_barcode_event_uniq` global unique ([event_registration.py:92-95](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_registration.py#L92-L95)); **inget integration-source-baserat idempotency** | **06b strängare** — barcode skyddar mot dubbel-checkin, inte mot dubbel-create från samma webhook |
| Partner/person | `primary_person_id uuid null` | `partner_id` Many2one nullable ([event_registration.py:49](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_registration.py#L49)) | **Match** — båda tillåter ofullständig identitet vid skapande |
| Snapshot | `registration_attendees.display_name_snapshot` + `email_snapshot` ([06b:285](docs/research/datamodell-research/06b-supabase-target.md#L285)) | `name`/`email`/`phone`/`company_name` på `event.registration` med compute+inverse-mönster ([event_registration.py:50-56](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_registration.py#L50-L56)) | **Likvärdiga mönster** — Odoo lagrar snapshot på samma rad som registration; 06b separerar attendee-snapshot till egen tabell |
| Capacity-check | (delegerat till app-lager + read model) | `_check_seats_availability` Python constrains ([event_registration.py:97-107](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_registration.py#L97-L107)) | **Lucka i 06b** — capacity-validering bör finnas som DB-trigger eller dokumenterat app-kontrakt |
| Cancel-reason | `registration_state_transitions.reason text not null` ([06b:317](docs/research/datamodell-research/06b-supabase-target.md#L317)) | (saknas i core; OCA `event_registration_cancel_reason` lägger till) | **06b strängare** — cancel-reason är required från start |

OCA `event_registration_partner_unique` (18.0) adresserar idempotens på partner-nivå men inte på integration-source-nivå. 06b:s lösning är mer generell.

### B4. `registration_attendees` ↔ (saknas i Odoo core) + OCA `event_registration_multi_qty`

| Aspekt | 06b-anchor | Odoo-anchor | Bedömning |
|---|---|---|---|
| Konceptuell separation | Egen tabell, attendee skild från registration ([06b:278-292](docs/research/datamodell-research/06b-supabase-target.md#L278-L292)) | `event.registration` ÄR både booking och attendee — en rad per anmäld person | **06b strängare** — separation tillåter +1, primary/companion-roller |
| Multi-qty | `attendee_role check in ('primary','companion','manual')` | Core: en registration per person. OCA `event_registration_multi_qty` lägger till `qty` Integer på registration | **06b mer explicit** — companions blir egna rader istället för Integer-räknare |
| Primary unique | "one primary attendee per registration via partial unique index" ([06b:286](docs/research/datamodell-research/06b-supabase-target.md#L286)) | (saknas eftersom relationen är 1:1) | **06b lägger till constraint** — relevant när +1 modelleras |

### B5. `attendances` ↔ `event.registration.state='done'` + barcode-checkin

| Aspekt | 06b-anchor | Odoo-anchor | Bedömning |
|---|---|---|---|
| Granularitet | Per attendee × session: unique `(tenant_id, registration_attendee_id, event_session_id)` ([06b:302](docs/research/datamodell-research/06b-supabase-target.md#L302)) | Per registration: `state='done'` + `date_closed` ([event_registration.py:58-60](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_registration.py#L58-L60)). Inget per-session-spår i core | **06b strängare** — multi-day events kräver per-session-närvaro |
| Check-in | `checked_in_at` + `checked_in_by` ([06b:301](docs/research/datamodell-research/06b-supabase-target.md#L301)) | `register_attendee(barcode, event_id)` ([event_registration.py:235-256](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_registration.py#L235-L256)) sätter `state='done'`; ingen separat checked_in_by | **06b mer audit-vänligt** — explicit actor + timestamp |
| Status | `('planned','attended','absent','cancelled','excused')` | (Odoo har bara done/cancel; absent/excused finns inte) | **06b utvidgar** — viktigt för partial attendance i flerdagars-event |

### B6. `registration_state_transitions` ↔ `mail.message`-tracking

| Aspekt | 06b-anchor | Odoo-anchor | Bedömning |
|---|---|---|---|
| Modell | Egen tabell med from_status/to_status/reason/operation_key ([06b:310-324](docs/research/datamodell-research/06b-supabase-target.md#L310-L324)) | Implicit via `mail.thread`-tracking på `state`-fältet (`tracking=6` på [event_registration.py:75](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_registration.py#L75)). Loggas i `mail.message`-tabellen | **Olika modeller** — Odoo har generisk audit, 06b har domänspecifik state-historik |
| Idempotens | `operation_key text null` med unique constraint för att skydda mot dubblett-transitions ([06b:318](docs/research/datamodell-research/06b-supabase-target.md#L318)) | (saknas) | **06b strängare** — operation_key är gjort för väntelista-konvertering och liknande side-effects |
| Reason | `reason text not null` | (lagras som mail.message body, inte typed) | **06b strängare** — typed reason för rapport-/debug |

### B7. `event_ingest_configs` ↔ `event.type` + `event.type.mail`/`event.type.ticket`

| Aspekt | 06b-anchor | Odoo-anchor | Bedömning |
|---|---|---|---|
| Konceptuell roll | Kopplar event ↔ integration_source med `accepted_payload_schema jsonb` ([06b:242-256](docs/research/datamodell-research/06b-supabase-target.md#L242-L256)) | `event.type` är mall för seats/tickets/mail/questions, inte ingest-config per source | **Olika domäner** — Odoo har inte en motsvarande ingest-relation eftersom Odoo är monolith där website_event är inbyggt |
| Source-koppling | `integration_source_id uuid not null` | `utm_source_id`/`utm_campaign_id`/`utm_medium_id` på `event.registration` ([event_registration.py:45-47](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_registration.py#L45-L47)) | **Odoo har spårning, inte config** — UTM är registration-attribut, inte ägandeskap |

### B8. `communication_outbox` + `communication_attempts` ↔ `event.mail` + `event.mail.registration`

| Aspekt | 06b-anchor | Odoo-anchor | Bedömning |
|---|---|---|---|
| Status per intent | `status check in ('queued','processing','sent','failed','cancelled','compensated')` ([06b:439](docs/research/datamodell-research/06b-supabase-target.md#L439)) | `mail_done` Boolean + `mail_state` Selection (running/scheduled/sent/error/cancelled, **compute, ej stored**) ([event_mail.py:63-66](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_mail.py#L63-L66)) | **06b strängare** — stored status, inkl. compensated; `processing` finns inte i Odoo |
| Per-attempt-spår | Egen tabell `communication_attempts` med `attempt_no`, `provider_message_id`, `request_payload`, `response_payload`, `status` ([06b:448-462](docs/research/datamodell-research/06b-supabase-target.md#L448-L462)) | (saknas — `event.mail.registration` har bara `mail_sent` Boolean + scheduler-nivå `error_datetime`) | **06b strängare** — detta är G12/DQ8-lösningen som Odoo själv inte har på event-mail-nivå |
| Idempotens | `idempotency_key text null` + partial unique ([06b:440](docs/research/datamodell-research/06b-supabase-target.md#L440)) | (saknas) | **06b strängare** — Odoo förlitar sig på cron-batchning och `mail_sent`-flagga |
| Provider-separation | "Provider-status och target-status kan felsökas separat" ([06b:461](docs/research/datamodell-research/06b-supabase-target.md#L461)) | Provider-status loggas i `mail.message`/`mail.tracking.value`, men inte separat från target-state | **06b mer explicit** — designad runt G12/DQ8 |

### B9. DQ6-jämförelse: `persons` + `person_identifiers` + `lead_profiles` ↔ `res.partner` + `crm.lead`

Denna jämförelsepunkt är utanför strikt event-domän men hör hemma här eftersom DQ6 (namnlösa Personer som lead-state) är central för hur Miranons event-flöde tolkar identitet.

| Aspekt | 06b-anchor | Odoo-anchor | Bedömning |
|---|---|---|---|
| Tenant | `persons.tenant_id uuid not null` ([06b:101](docs/research/datamodell-research/06b-supabase-target.md#L101)) | `res.partner` är **global tabell** — ingen company_id NOT NULL; partner kan vara delad mellan companies | **06b strängare** — Odoo:s flat partner-tabell är inte multi-tenant från start |
| Lead vs person | Separata tabeller: `persons` + `lead_profiles` ([06b:158-172](docs/research/datamodell-research/06b-supabase-target.md#L158-L172)) | Separata modeller: `res.partner` (kontakt) + `crm.lead` (lead/opportunity), kopplade via `crm.lead.partner_id` Many2one nullable ([crm_lead.py:171-173](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/crm/models/crm_lead.py#L171-L173)) | **Match-mönster** — båda separerar lead-state från full kontakt; båda tillåter lead utan partner |
| Lead-lifecycle | `person_states` tabell + `lead_profiles.lead_status check in ('new','nurturing','converted','closed','suppressed')` ([06b:165](docs/research/datamodell-research/06b-supabase-target.md#L165)) | `crm.lead.type` Selection lead/opportunity ([crm_lead.py:123-125](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/crm/models/crm_lead.py#L123-L125)) + `stage_id` Many2one → `crm.stage` (konfigurerbar pipeline) | **Olika granularitet** — Odoo binär lead/opportunity + konfigurerbar stage; 06b explicit 5-state enum + person_states tabell |
| Email-typing | `person_identifiers.identifier_type check in ('email','phone','instagram','external_id')` + unique `(tenant_id, identifier_type, canonical_value)` ([06b:117-118](docs/research/datamodell-research/06b-supabase-target.md#L117-L118)) | `res.partner.email` Char (utan unique constraint!); `crm.lead.email_normalized` Char + `email_domain_criterion` ([crm_lead.py:183-192](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/crm/models/crm_lead.py#L183-L192)). Matchning via `=ilike` ([res_partner.py:1098](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/odoo/addons/base/models/res_partner.py#L1098)) | **06b avsevärt strängare** — DB-unique på canonical email; Odoo tillåter dubbletter och förlitar sig på app-logik |
| Namnlöshet | `persons.display_name nullable` + `lead_profiles` är legitim state ([06b:101, 158-172](docs/research/datamodell-research/06b-supabase-target.md#L101)) | `res.partner` har CHECK `(type='contact' AND name IS NOT NULL) or (type!='contact')` ([res_partner.py:326-329](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/odoo/addons/base/models/res_partner.py#L326-L329)) — **kontakt KRÄVER namn**. `crm.lead` kan vara namnlös. | **Olika modell** — Odoo:s lösning är att namnlösa leads bor i `crm.lead` tills de konverteras. 06b kombinerar i `persons` + `lead_profiles`. |
| Phone-typing | (06b nämner ej phone-canonicalisering) | `crm.lead.phone_sanitized` + `phone_state check ('correct','incorrect')` ([crm_lead.py:196-199](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/crm/models/crm_lead.py#L196-L199)); registration har `_phone_format` ([event_registration.py:229-233](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_registration.py#L229-L233)) | **Lucka i 06b** — phone_sanitized + valideringsstate är värt att lyfta |

## Del C — Strängare i 06b än i Odoo

Punkter där S-track är striktare. Detta är 06b:s styrkor och bör bevaras.

| # | Område | Vad 06b gör strängare |
|---|---|---|
| C1 | **Tenancy** | NOT NULL `tenant_id` på alla domäntabeller. Odoo tillåter `company_id IS NULL` som "global". |
| C2 | **Stable keys** | Varje domain entity har explicit text-key (`event_key`, `session_key`, `registration_key`, `source_key`). Odoo har bara DB-id + komponent-namn (ej unik). |
| C3 | **Email-canonicalisering** | DB-unique på `(tenant_id, identifier_type, canonical_value)`. Odoo har Char-fält med ilike-matchning, inga DB-constraints. |
| C4 | **Idempotens på integration-nivå** | `(tenant_id, integration_source_id, idempotency_key)` partial unique på registrations, offer_downloads, integration_requests. Odoo har bara `barcode` global unique. |
| C5 | **Per-attempt audit** | `communication_attempts` med attempt_no, provider_message_id, request_payload, response_payload. Odoo har bara `mail_sent` Boolean + `error_datetime` på scheduler. |
| C6 | **Registration state-historik** | `registration_state_transitions` med typed reason + operation_key. Odoo förlitar sig på generisk `mail.thread`-tracking. |
| C7 | **Per-attendee × session-närvaro** | `attendances` med unique `(registration_attendee_id, event_session_id)`. Odoo har en flagga per registration. |
| C8 | **Cancel-reason required** | `registration_state_transitions.reason text not null` finns från start. OCA `event_registration_cancel_reason` är 18.0-tillägg. |
| C9 | **Operations-tabeller** | `waitlist_conversions`, `read_model_refreshes`, `integration_requests` är förstaklass-resurser med egen status. Odoo gör mycket via cron utan synlig operation-rad. |
| C10 | **Source/config-separation** | `integration_sources` ≠ `lead_sources`. Odoo blandar via UTM-fält. |

## Del D — Luckor i 06b som Odoo täcker

Tabell-för-tabell. Klassad som **Lyfta** (skicka till Fas 5), **Defer** (post-MK eller post-första-Supabase-version), eller **Avvisa** (matchar inte Miranons domän).

| ID | Lucka | Odoo-källa | Klass | Motivering |
|---|---|---|---|---|
| D1 | `event_sessions` saknar bounds-validering: session ska ligga inom event date_begin..date_end | `event.event._check_slots_dates` ([event_event.py:583-605](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_event.py#L583-L605)) + `event.slot._check_time_range` | **Lyfta** | Driftkritisk — utan bounds-check kan en session ligga utanför sitt event och bryta capacity/närvarologik |
| D2 | `event_sessions` saknar cascade-skydd: kan deleta session med existerande `attendances` | `event.slot._unlink_except_if_registrations` ([event_slot.py:139-144](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_slot.py#L139-L144)) | **Lyfta** | DB-trigger eller domain-regel — radering av session med deltaganden är dataförlust |
| D3 | `events` capacity-validering vid registration write — Odoo har `_check_seats_availability` | `event.registration._check_seats_availability` ([event_registration.py:97-107](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_registration.py#L97-L107)) | **Lyfta** | Antingen DB-trigger eller dokumenterat app-lager-kontrakt; nödvändigt för G3-semantik |
| D4 | `events` saknar event-stage-tabell (06b har enum-status, Odoo har konfigurerbar `event.stage`-pipeline) | `event.stage` ([event_stage.py](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_stage.py)) | **Defer** | 06b:s enum är medvetet enklare; Lyfta endast om Lotta/Roger behöver konfigurera egna stages |
| D5 | `event.type`-mall-koncept (default ticket/mail/questions per eventtyp) | `event.type` + `event.type.ticket` + `event.type.mail` | **Defer** | 06b har `event_formats` med `default_session_pattern jsonb`; täcker mallar men inte separata mall-tabeller. Räcker tills Lotta vill ha återanvändbar mailkedja per format. |
| D6 | `phone_sanitized` + `phone_state` typed phone | `crm.lead.phone_sanitized` + `phone_state` ([crm_lead.py:196-199](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/crm/models/crm_lead.py#L196-L199)) + `_phone_format` på registration ([event_registration.py:229-233](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_registration.py#L229-L233)) | **Lyfta** | Adressar DQ5/H12 — telefon-canonicalisering är parallell till email-canonicalisering och bör finnas i `person_identifiers` |
| D7 | `email_domain_criterion` för domain-matchning av leads | `crm.lead.email_domain_criterion` ([crm_lead.py:187-192](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/crm/models/crm_lead.py#L187-L192)) | **Defer** | Användbart för CRM-segmentering men inte kritiskt i Miranons MK-flöde |
| D8 | `mail.thread`-baserad audit per record (alla fält-ändringar loggas) | `mail.thread`-inheritance ([event_event.py:35](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_event.py#L35)) + tracking på `state`/`partner_id` etc | **Avvisa som default; Lyfta som spec-fråga** | Miranon vill inte event sourcing (P5: "audit before event sourcing"). 06b:s `audit_log` + `sensitive_change_log` är medvetet smalare. Men: överväg om Miranon behöver Odoo-liknande `tracking=N`-deklaration för specifika fält i `sensitive_change_log` — det är en spec-utveckling, inte ny tabell |
| D9 | UTM-tracking per registration (utm_campaign_id, utm_source_id, utm_medium_id) | `event.registration` ([event_registration.py:45-47](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_registration.py#L45-L47)) | **Defer** | 06b separerar `lead_sources` ≠ `integration_sources`, vilket täcker UTM-konceptet. Lyfta endast om Marcus vill ha UTM som typed kolumn snarare än integration_source-relation. |
| D10 | `event.question` + `event.registration.answer` — dynamiska formulärfrågor med svar per anmälan | [event_question.py](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_question.py) + [event_registration_answer.py](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_registration_answer.py) | **Defer** | Miranon använder Elfsight-formulär utanför Airtable; om formulär flyttas in i target blir detta relevant. Designspår, inte Fas 5-leverans. |
| D11 | OCA `event_registration_partner_unique`: 1 registration per partner per event | [OCA/event/event_registration_partner_unique @ 18.0](https://github.com/OCA/event/blob/18.0/event_registration_partner_unique) | **Avvisa** | Miranon tillåter +1/companion. 06b:s `registration_attendees` + `attendee_role check ('primary','companion','manual')` löser problemet bättre. |
| D12 | OCA `event_min_seat`: minimum seats för event | [OCA/event/event_min_seat @ 18.0](https://github.com/OCA/event/blob/18.0/event_min_seat) | **Defer** | Adresserar Manuella/Extra/Arrangörsplatser-konceptet i Miranon. Utvidgning till `events.capacity` med `min_capacity int null` är trivial post-första-version. |
| D13 | `event.event.copy_data` med "(copy)"-suffix för kloning | [event_event.py:661-663](https://github.com/odoo/odoo/blob/2154e11ef5c7860adee88013ad80422d2b4f5816/addons/event/models/event_event.py#L661-L663) | **Avvisa** | UX-funktion, inte data-modell. Hanteras i app-lager. |

## Del E — Inter-fas-kontrakt till Fas 5

Kandidater att skicka in i `07-migration-plan.md`. Inga reformer av 06b — bara additioner i Fas 5:s spec/SQL-DDL-runda.

| # | Kandidat | Källa-rad i Del D |
|---|---|---|
| E1 | DB-trigger eller dokumenterat app-kontrakt för session-bounds: `event_sessions.starts_at >= events.starts_at AND event_sessions.ends_at <= events.ends_at` | D1 |
| E2 | DB-trigger eller domain-regel som blockerar `DELETE FROM event_sessions` om existerande `attendances` finns | D2 |
| E3 | DB-trigger eller dokumenterat app-kontrakt: capacity-check vid `INSERT INTO registrations` om `events.capacity IS NOT NULL` (motsvarar Odoo:s `_check_seats_availability`) | D3 |
| E4 | Lägg `phone_sanitized text null` + `phone_validation_state text check in ('valid','invalid','unverified')` på `person_identifiers` när `identifier_type='phone'` (eller motsvarande tabellutvidgning som Fas 5 väljer) | D6 |
| E5 | Bevaka `event.stage`-mönster: om Miranon i framtiden vill ha konfigurerbara event-stages istället för 06b:s enum, skapa `event_stages`-tabell. Lyfts i 07 som öppen fråga, inte i första migrationen | D4 |
| E6 | Bevaka `event.type`-mall-mönster för Lottas mailkedja per format. Räcker idag med `event_formats.default_session_pattern jsonb`, men ny tabell `event_format_mail_templates` kan behövas senare | D5 |
| E7 | Specificera vilka fält i `sensitive_change_log` som ska loggas per tabell (parallellt med Odoo:s `tracking=N`-mönster). Förslag: `registrations.status`, `persons.display_name`, `person_identifiers.canonical_value`, `event_sessions.status`, `events.status`, `events.capacity` | D8 (spec-utveckling) |
| E8 | OCA `event_min_seat` som referens vid framtida `min_capacity`-utvidgning av `events` (defer post-MK1) | D12 |

Total: 8 kandidater. Inom stop-villkorets gräns (max 12).

## Del F — Spårbarhetsmatris

Per Odoo-fynd: vilken princip P1–P10 + vilket gap G/DS/DQ det träffar i 04/05.

| Fynd | Princip-träff | Gap-/skuld-träff i 04/05 |
|---|---|---|
| C1 NOT NULL tenant_id | P10 | G14 (multi-tenant readiness) |
| C2 Stable keys | P6, P9 | G9 (EventKey-config-skuld), G14 |
| C3 Email-canonicalisering DB-unique | P2, P9 | G2, DQ5, H12 |
| C4 Idempotency-key per integration_source | P6, P7 | G14, DQ8, DQ9 |
| C5 Per-attempt audit (communication_attempts) | P5, P6, P7 | G12, DQ8 |
| C6 Registration state-transitions med operation_key | P3, P5, P6 | G3, G13, DQ9 |
| C7 Per-attendee × session attendance | P3, P4, P9 | G7, DS6, DQ7, H4 |
| C8 Cancel-reason required | P3, P5 | G3 |
| C9 Operations-tabeller (waitlist_conversions etc) | P5, P6, P7 | G13, DQ9 |
| C10 Source/config-separation | P6 | G11, DQ4 |
| D1 Session-bounds-validering (lucka) | P3, P9 | G7, G9 |
| D2 Cascade-skydd `event_sessions` (lucka) | P9 | G7, DS6 |
| D3 Capacity-check vid registration write (lucka) | P3, P9 | G3, C7 (drift-constraint) |
| D6 phone_sanitized typed phone (lucka) | P2, P9 | DQ5, H12 |
| D8 mail.thread tracking-mönster | P5 | DS7, G15 |
| D11 Partner-unique avvisas | P1 (lifecycle: companions tillåts) | G6 (avvisas eftersom +1-modell skiljer sig) |

## M-sanity-check

- **M1.** Alla 6 event-domän-tabeller från 06b har minst en jämförelsepunkt mot Odoo (B1–B6). Plus `event_ingest_configs` (B7) och `communication_outbox`/`communication_attempts` (B8) som hör till event-domänens kontrakt. Plus DQ6 (B9) per Marcus tillägg.
- **M2.** Alla luckor i Del D är klassade: 4 Lyfta (D1, D2, D3, D6), 6 Defer (D4, D5, D7, D9, D10, D12), 3 Avvisa (D8 default, D11, D13).
- **M3.** Del E innehåller 8 kandidater till `07-migration-plan.md`. Inga av dem ändrar 06b — alla är additioner.
- **M4.** Varje Odoo-citat har källsökväg + radnummer eller commit-hash. Inga modellnamn eller fältnamn som inte verifierats mot kod.
- **M5.** Inget i 06b ändrats. Detta dokument är ren validering/komplettering.

## Lärdomar för senare lyft till hub

[UNIVERSAL] **Mogen open source som referens, inte som mall.** Odoo har 20 års utveckling och har stött på exakt de problem (capacity-validering, slot-bounds, cascade-skydd, audit-tracking) som 06b nu designar runt. Att läsa Odoo-koden kostade ~30 min och avslöjade 4 konkreta luckor (D1, D2, D3, D6) som annars hade upptäckts först under implementation. Mönstret: när en domän har en mogen open source-implementation (Odoo, Plane.so, Cal.com), läs källkoden för konstraints och _check-metoder — de är listan över "vad som faktiskt går fel i drift". Det är inte motivering att kopiera deras modell, men det är effektivt skydd mot blinda fläckar.

[UNIVERSAL] **Communityns tillägg är en signal om kärnans luckor.** OCA `event_session`, `event_min_seat`, `event_stage_cancelled`, `event_registration_cancel_reason` finns alla för att Odoo-kärnan saknar dem. När en mogen plattform har ett aktivt community som lägger till samma 4–6 koncept om och om igen, är de koncepten värda första-klass-status i en ny design. 06b har redan event_sessions, attendances, cancel-reason från start — det är validerad design, inte överdesign.

[UNIVERSAL] **Versionsmismatch mellan core och community är normalt.** OCA/event 19.0 var tom 2026-05-03 trots att Odoo 19.0 är släppt. Använd närmaste föregående stabila community-version (18.0 i detta fall) för arkitekturreferens, inte rad-för-rad-implementation. Markera versionsskillnaden explicit i analysen så framtida läsare vet vad som verifierats var.
