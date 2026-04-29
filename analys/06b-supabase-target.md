# 06b — Supabase Target (S-track)

> **Status:** Fas 4b (S-track) klar för Gate 4B.
> **Källprincip:** S-track adresserar gap som har Supabase-klass i `05-gap-vs-worldclass.md` Del C plus migration transform-klassningar i Del B. Soft multi-tenant från dag ett. Stable keys för integration sources.

## Läsnyckel

Detta är målmodellen för Supabase, inte en mekanisk port av Airtable. Airtables tabeller är källa för migrationen; de är inte norm för target-designen.

Grundregler:

- Alla domäntabeller har `tenant_id uuid not null references tenants(id)`.
- RLS-mönstret är per-tenant-isolation för användaraccess och service-role-only för ingest/audit där vanliga användare inte ska skriva.
- Composite index börjar med `tenant_id`.
- Varje tabell har `id uuid primary key`, `created_at timestamptz not null`, `updated_at timestamptz not null`, `created_by uuid null`, `updated_by uuid null` om inget annat sägs.
- Stable keys är domän- och integrationsidentifierare. UUID är databasidentitet, inte primär extern identitet.
- `integration_sources` och `lead_sources` är separata koncept. `lead_sources` beskriver hur en lead uppstod i domänen; `integration_sources` beskriver en produkt/edge/config som kan skriva eller leverera data.

## Del A — Tenancy och säkerhetsmodell

### A1 — `tenants`-tabellen och tenant-livscykel

| Fält | Innehåll |
|---|---|
| Tabellnamn | `tenants` |
| Syfte | Global katalog över kund-/workspace-enheter i soft multi-tenant-modellen. |
| Adresserar gap/DS/DQ/H | G0.3/P10, H2-beroende för target. |
| Princip-koppling | P9, P10. |
| Kolumner (kärna) | `id uuid pk`; `tenant_key text unique not null` (`miranon-media`); `display_name text not null`; `status text check in ('active','paused','archived')`; `created_at`, `updated_at`. |
| Tenant-strategi | Global tabell. Inget `tenant_id`, eftersom den definierar tenant-roten. |
| RLS-mönster | Endast service-role och systemadmin kan skriva. Medlemmar kan läsa sin egen tenant via membership-policy. |
| Stable key | `tenant_key`, format `miranon-media` eller framtida workspace-slug. |
| FK-relationer | Refereras av alla tenant-scopade tabeller. |
| Index-överväganden | Unique index på `tenant_key`; statusindex för adminlistor. |
| Skiftet från Airtable | Airtable har single-base-reality. Target får tenant-rot utan schema-prefix eller hard multi-tenant. |
| Spårbarhet | G0.3 i arbetsdokumentet §3; `04-research.md` P10. |

### A2 — RLS-policies (mönster, inte uttömmande SQL)

Standardpolicyer:

| Policy | Gäller | Mönster |
|---|---|---|
| `tenant_member_read` | Domäntabeller | `tenant_id in user_tenants(auth.uid())`. |
| `tenant_member_write` | Operativa tabeller | Skriv kräver membership med roll `admin`, `operator` eller specifik capability. |
| `service_ingest_write` | Ingest-/outbox-/audittabeller | Service role får skriva med explicit `tenant_id`; vanliga användare får bara läsa aggregerad driftvy. |
| `audit_append_only` | `audit_log`, `sensitive_change_log` | Insert via service role eller DB trigger; inga vanliga updates/deletes. |
| `public_form_no_direct_write` | Publika formulär | Publika formulär skriver inte direkt mot domäntabeller; de går via ingest edge med idempotency och request-logg. |

RLS-testet för varje ny tabell: om tabellen inte är global ska den ha `tenant_id`, policy som filtrerar på användarens memberships och minst ett composite index som börjar med `tenant_id`.

### A3 — Auth/auktorisering (Supabase Auth + tenant-membership)

| Fält | Innehåll |
|---|---|
| Tabellnamn | `tenant_memberships` |
| Syfte | Kopplar Supabase Auth-användare till tenants och roller. |
| Adresserar gap/DS/DQ/H | G0.3/P10. |
| Princip-koppling | P9, P10. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `user_id uuid not null references auth.users(id)`; `role text check in ('owner','admin','operator','viewer')`; `status text check in ('active','invited','disabled')`; `capabilities jsonb not null default '{}'`; timestamps/audit. |
| Tenant-strategi | Har `tenant_id`; unique `(tenant_id, user_id)`. |
| RLS-mönster | Medlem kan läsa sin egen membership; owner/admin kan hantera memberships i sin tenant. |
| Stable key | Ingen egen stable key; relationen är `(tenant_id, user_id)`. |
| FK-relationer | `tenant_id -> tenants`; `user_id -> auth.users`. |
| Index-överväganden | `(tenant_id, user_id) unique`; `(tenant_id, role, status)`. |
| Skiftet från Airtable | Ersätter implicit Airtable-behörighet med explicit auth boundary. |
| Spårbarhet | G0.3, P10. |

### A4 — Service-role vs user-role separation

| Fält | Innehåll |
|---|---|
| Tabellnamn | `service_clients` |
| Syfte | Registry över tekniska klienter som får skriva via service role, till exempel ingest endpoints, migration jobs och mail workers. |
| Adresserar gap/DS/DQ/H | G14/H7, G12/DQ8, G13/DQ9, DS7/G15. |
| Princip-koppling | P5, P6, P7, P10. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `client_key text not null`; `client_type text check in ('ingest','mail_worker','migration','admin_job')`; `owner text not null`; `status text check in ('active','paused','revoked')`; `last_seen_at timestamptz`; timestamps/audit. |
| Tenant-strategi | Har `tenant_id`; unique `(tenant_id, client_key)`. |
| RLS-mönster | Admin read; service-role-only write. |
| Stable key | `client_key`, format `ingest:elfsight`, `worker:resend-mail`. |
| FK-relationer | Kan refereras från `integration_requests`, `communication_attempts`, `audit_log`. |
| Index-överväganden | `(tenant_id, client_key) unique`; `(tenant_id, status, client_type)`. |
| Skiftet från Airtable | Externa skrivvägar blir identifierade klienter, inte osynliga automationer/Zaps. |
| Spårbarhet | `04-research.md` P6-P7; `05-gap-vs-worldclass.md` G14-G15. |

**M1 sanity-check Del A:** soft multi-tenant är kolumnbaserad, inte schema-prefixbaserad. Enda globala tabellen i denna del är `tenants`; även memberships och service clients är tenant-scopade.

## Del B — Domänmodell

### B1 — Identity & Persons

Målet är ett identity cluster, inte en mekanisk split av `Personer` efter antal fält. `persons` är fortsatt den mänskliga roten, men identiteter, lead-state och livscykelhistorik är separata eftersom de har andra constraints och annan förändringstakt.

#### `persons`

| Fält | Innehåll |
|---|---|
| Syfte | Canonical person/lead-rot. En rad kan vara namnlös och ändå legitim. |
| Adresserar gap/DS/DQ/H | G1, G2, H2, DQ6. |
| Princip-koppling | P1, P2, P9, P10. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `person_key text not null`; `display_name text null`; `given_name text null`; `family_name text null`; `preferred_language text`; `lifecycle_state_id uuid not null`; `identity_confidence text check in ('low','medium','high','verified')`; timestamps/audit. |
| Tenant-strategi | `tenant_id` obligatorisk; unique `(tenant_id, person_key)`. |
| RLS-mönster | Per-tenant read/write; merge kräver admin/operator capability. |
| Stable key | `person_key`, format `person:{slug-or-sequence}`; får inte vara e-post. |
| FK-relationer | `lifecycle_state_id -> person_states`; refereras av identifiers, registrations, attendances, lead profiles. |
| Index-överväganden | `(tenant_id, person_key) unique`; `(tenant_id, lifecycle_state_id)`; trigram/fts på namn om UI kräver sök. |
| Skiftet från Airtable | Namnlösa Personer blir explicit tillåtet state, inte trasig data. Person-raden bär inte all kontaktidentitet. |
| Spårbarhet | `05-gap-vs-worldclass.md` G1-G2; `06a-airtable-redesign.md` Del F. |

#### `person_identifiers`

| Fält | Innehåll |
|---|---|
| Syfte | Typed kontaktidentifierare för e-post, telefon och framtida externa identiteter. |
| Adresserar gap/DS/DQ/H | G2, DQ5, H12. |
| Princip-koppling | P2, P9. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `person_id uuid not null`; `identifier_type text check in ('email','phone','instagram','external_id')`; `raw_value text not null`; `canonical_value text not null`; `is_primary boolean not null default false`; `verification_status text check in ('unverified','verified','bounced','suppressed')`; timestamps/audit. |
| Tenant-strategi | Har `tenant_id`; unique `(tenant_id, identifier_type, canonical_value)`. |
| RLS-mönster | Per-tenant read/write; suppression/bounce updates service-role eller admin. |
| Stable key | Ingen separat stable key; identifiern är `(identifier_type, canonical_value)` inom tenant. |
| FK-relationer | `person_id -> persons`. |
| Index-överväganden | `(tenant_id, identifier_type, canonical_value) unique`; `(tenant_id, person_id, is_primary)`. |
| Skiftet från Airtable | `E-post` som multilineText ersätts av typed constraints och canonicalisering. |
| Spårbarhet | G2, DQ5/H12 i arbetsdokumentets §6. |

#### `person_states`

| Fält | Innehåll |
|---|---|
| Syfte | Explicit state-katalog för person/lead-livscykeln. |
| Adresserar gap/DS/DQ/H | G1, H2, DQ6. |
| Princip-koppling | P1, P3, P9. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `state_key text not null`; `display_name text not null`; `sort_order int not null`; `is_terminal boolean not null default false`; timestamps/audit. |
| Tenant-strategi | Har `tenant_id`; unique `(tenant_id, state_key)`. |
| RLS-mönster | Read per tenant; write admin-only. |
| Stable key | `state_key`, exempel `lead:anonymous`, `lead:identified`, `customer:registered`, `customer:active_recurring`, `customer:alumni`. |
| FK-relationer | Refereras av `persons` och `person_state_transitions`. |
| Index-överväganden | `(tenant_id, state_key) unique`. |
| Skiftet från Airtable | Livscykel blir state machine snarare än rollups/formulas i Personer. |
| Spårbarhet | R7 Plane.so explicit state-tabell; G1. |

#### `person_state_transitions`

| Fält | Innehåll |
|---|---|
| Syfte | Historik för livscykelövergångar utan full event sourcing. |
| Adresserar gap/DS/DQ/H | G1, DS7/G15. |
| Princip-koppling | P1, P3, P5. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `person_id uuid not null`; `from_state_id uuid null`; `to_state_id uuid not null`; `reason text not null`; `source_type text check in ('manual','registration','lead_magnet','migration','system')`; `source_id uuid null`; `changed_at timestamptz not null`; `changed_by uuid null`. |
| Tenant-strategi | Har `tenant_id`. |
| RLS-mönster | Read per tenant; insert via application/service; no update/delete except admin correction through audit. |
| Stable key | Ingen. |
| FK-relationer | `person_id -> persons`; state FKs till `person_states`. |
| Index-överväganden | `(tenant_id, person_id, changed_at desc)`. |
| Skiftet från Airtable | Gör lifecycle-förändringar synliga utan att införa event sourcing. |
| Spårbarhet | P5, G15. |

#### `lead_profiles`

| Fält | Innehåll |
|---|---|
| Syfte | Lead-specifika attribut som får existera innan komplett personidentitet finns. |
| Adresserar gap/DS/DQ/H | G1, DQ6, DQ4/G11. |
| Princip-koppling | P1, P2, P6. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `person_id uuid not null`; `lead_source_id uuid not null`; `first_integration_source_id uuid null`; `lead_status text check in ('new','nurturing','converted','closed','suppressed')`; `captured_at timestamptz not null`; `notes text null`; timestamps/audit. |
| Tenant-strategi | Har `tenant_id`; one active lead profile per `(tenant_id, person_id)` om inte historik behövs. |
| RLS-mönster | Per-tenant read/write. |
| Stable key | Ingen egen stable key; lead source och integration source bär stable keys. |
| FK-relationer | `person_id -> persons`; `lead_source_id -> lead_sources`; `first_integration_source_id -> integration_sources`. |
| Index-överväganden | `(tenant_id, lead_status, captured_at)`; `(tenant_id, first_integration_source_id)`. |
| Skiftet från Airtable | Namnlösa lead-magnet-personer blir designat lead-state med spårbar källa. |
| Spårbarhet | `docs/hur-systemet-funkar.md` namnlös Person-semantik; `06a` Del F. |

### B2 — Events & Eventplanering

Målet är att ersätta `EventKey`-beroende och hårdkodade edge-värden med stabil eventidentitet och explicit ingest config.

#### `programs`

| Fält | Innehåll |
|---|---|
| Syfte | Canonical kurs-/programfamilj, till exempel Medveten Kontakt eller Psionautics. |
| Adresserar gap/DS/DQ/H | G5, G9. |
| Princip-koppling | P1, P3, P9. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `program_key text not null`; `display_name text not null`; `status text check in ('active','archived')`; timestamps/audit. |
| Tenant-strategi | Har `tenant_id`; unique `(tenant_id, program_key)`. |
| RLS-mönster | Per-tenant read; admin write. |
| Stable key | `program_key`, format `program:medveten-kontakt`. |
| FK-relationer | Refereras av `event_formats`, `events`, read models. |
| Index-överväganden | `(tenant_id, program_key) unique`; `(tenant_id, status)`. |
| Skiftet från Airtable | Case-dubletter i kursavsikt normaliseras mot canonical program. |
| Spårbarhet | G5/DQ1. |

#### `event_formats`

| Fält | Innehåll |
|---|---|
| Syfte | Återanvändbar typ/format för event, motsvarar men renodlar Airtable `Eventformat`. |
| Adresserar gap/DS/DQ/H | G9, H3. |
| Princip-koppling | P3, P9. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `program_id uuid null`; `format_key text not null`; `display_name text not null`; `default_capacity int null check >= 0`; `default_session_pattern jsonb not null default '{}'`; timestamps/audit. |
| Tenant-strategi | Har `tenant_id`; unique `(tenant_id, format_key)`. |
| RLS-mönster | Per-tenant read; admin write. |
| Stable key | `format_key`, format `format:retreat-weekend` eller `format:intro-workshop`. |
| FK-relationer | `program_id -> programs`; refereras av `events`. |
| Index-överväganden | `(tenant_id, format_key) unique`; `(tenant_id, program_id)`. |
| Skiftet från Airtable | Sessionsmallar blir typed metadata, inte lookup/formelflöde. |
| Spårbarhet | G9; R7 NocoDB typed metadata. |

#### `events`

| Fält | Innehåll |
|---|---|
| Syfte | Canonical event, inte Airtable-formeln `EventKey`. |
| Adresserar gap/DS/DQ/H | G9, H3, H13. |
| Princip-koppling | P3, P6, P9. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `event_key text not null`; `program_id uuid null`; `event_format_id uuid null`; `display_name text not null`; `starts_at timestamptz null`; `ends_at timestamptz null`; `status text check in ('draft','open','full','cancelled','completed','archived')`; `capacity int null check >= 0`; timestamps/audit. |
| Tenant-strategi | Har `tenant_id`; unique `(tenant_id, event_key)`. |
| RLS-mönster | Per-tenant read/write; public form lookup via service edge, inte direkt public table access. |
| Stable key | `event_key`, format `event:psionautics-2026-summer`. |
| FK-relationer | `program_id -> programs`; `event_format_id -> event_formats`; refereras av registrations, sessions, waitlist. |
| Index-överväganden | `(tenant_id, event_key) unique`; `(tenant_id, status, starts_at)`; `(tenant_id, program_id, starts_at)`. |
| Skiftet från Airtable | Eventidentitet är stable key och FK, inte beräknad sträng med Event-nr. |
| Spårbarhet | G9/H3/H13. |

#### `event_sessions`

| Fält | Innehåll |
|---|---|
| Syfte | Dagar/sessioner inom event som attendance kopplas till. |
| Adresserar gap/DS/DQ/H | G7, G9, DS6/DQ7/H4. |
| Princip-koppling | P3, P4, P9. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `event_id uuid not null`; `session_key text not null`; `display_name text not null`; `starts_at timestamptz null`; `ends_at timestamptz null`; `sequence_no int not null`; `status text check in ('planned','cancelled','completed')`; timestamps/audit. |
| Tenant-strategi | Har `tenant_id`; unique `(tenant_id, event_id, session_key)`. |
| RLS-mönster | Per-tenant read/write. |
| Stable key | `session_key`, format `session:day-1` inom event. |
| FK-relationer | `event_id -> events`; refereras av `attendances`. |
| Index-överväganden | `(tenant_id, event_id, sequence_no)`; `(tenant_id, event_id, session_key) unique`. |
| Skiftet från Airtable | `Deltaganden` kopplar till riktig session-FK istället för RECORD_ID-formler. |
| Spårbarhet | G7, G9. |

#### `event_ingest_configs`

| Fält | Innehåll |
|---|---|
| Syfte | Kopplar event till vilka integration sources som får skapa anmälan/väntelista/lead för eventet. |
| Adresserar gap/DS/DQ/H | G9, G14, H7, H13, DQ4/G11. |
| Princip-koppling | P6, P7, P9. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `event_id uuid not null`; `integration_source_id uuid not null`; `external_event_key text null`; `accepted_payload_schema jsonb not null default '{}'`; `status text check in ('active','paused','archived')`; timestamps/audit. |
| Tenant-strategi | Har `tenant_id`; unique `(tenant_id, event_id, integration_source_id)`. |
| RLS-mönster | Admin read/write; ingest service read. |
| Stable key | Configen använder `events.event_key` och `integration_sources.source_key`; ingen egen extern key. |
| FK-relationer | `event_id -> events`; `integration_source_id -> integration_sources`. |
| Index-överväganden | `(tenant_id, integration_source_id, status)`; `(tenant_id, event_id, integration_source_id) unique`. |
| Skiftet från Airtable | Hårdkodad EventKey och Zapier-konfig blir data med ägare/status. |
| Spårbarhet | G9/G14, K6, DQ4. |

### B3 — Anmälningar & Deltaganden

Target skiljer bokning/anmälan från attendee och närvaro. Det tar in Cal.com-läxan: en booking-liknande registration kan ha en eller flera attendees, och attendance är per attendee och session.

#### `registrations`

| Fält | Innehåll |
|---|---|
| Syfte | Boknings-/anmälanstransaktion mot ett event. |
| Adresserar gap/DS/DQ/H | G3, G6, G7, G13, H1/H5, DS6/DQ7/H4. |
| Princip-koppling | P2, P3, P6, P9. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `registration_key text not null`; `event_id uuid not null`; `primary_person_id uuid null`; `status text check in ('draft','pending','confirmed','waitlisted','cancelled','rebooked','completed','no_show')`; `lead_source_id uuid null`; `integration_source_id uuid null`; `idempotency_key text null`; `submitted_at timestamptz null`; timestamps/audit. |
| Tenant-strategi | Har `tenant_id`; unique `(tenant_id, registration_key)`; unique partial `(tenant_id, integration_source_id, idempotency_key)` where idempotency key not null. |
| RLS-mönster | Per-tenant read/write; ingest create via service role. |
| Stable key | `registration_key`, format `registration:{event-key}:{sequence}` eller source-provided stable key. |
| FK-relationer | `event_id -> events`; `primary_person_id -> persons`; `lead_source_id -> lead_sources`; `integration_source_id -> integration_sources`. |
| Index-överväganden | `(tenant_id, event_id, status)`; `(tenant_id, primary_person_id, submitted_at)`; `(tenant_id, integration_source_id, idempotency_key)`. |
| Skiftet från Airtable | `Anmälningar` blir transactional registration med statusconstraint och idempotency, inte formfält + automation chain. |
| Spårbarhet | G3/G6/G7/G13; R7 Cal.com. |

#### `registration_attendees`

| Fält | Innehåll |
|---|---|
| Syfte | Personer som omfattas av en registration, inklusive primary och +1. |
| Adresserar gap/DS/DQ/H | G7, G6, DQ6. |
| Princip-koppling | P2, P9. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `registration_id uuid not null`; `person_id uuid null`; `attendee_role text check in ('primary','companion','manual')`; `display_name_snapshot text null`; `email_snapshot text null`; `status text check in ('expected','cancelled','attended','no_show')`; timestamps/audit. |
| Tenant-strategi | Har `tenant_id`; one primary attendee per registration via partial unique index. |
| RLS-mönster | Per-tenant read/write. |
| Stable key | Ingen egen stable key; relationen bärs av registration + role/person. |
| FK-relationer | `registration_id -> registrations`; `person_id -> persons` nullable för ofullständig attendee tills identity resolution är klar. |
| Index-överväganden | `(tenant_id, registration_id, attendee_role)`; `(tenant_id, person_id)`. |
| Skiftet från Airtable | Attendee är separat från booking och från attendance. |
| Spårbarhet | R7 Cal.com; G7. |

#### `attendances`

| Fält | Innehåll |
|---|---|
| Syfte | Närvarorad per attendee och session. |
| Adresserar gap/DS/DQ/H | G7, DS6, DQ7, H4, G8. |
| Princip-koppling | P3, P4, P9. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `registration_attendee_id uuid not null`; `event_id uuid not null`; `event_session_id uuid not null`; `person_id uuid null`; `status text check in ('planned','attended','absent','cancelled','excused')`; `checked_in_at timestamptz null`; `checked_in_by uuid null`; `attendance_points numeric null`; timestamps/audit. |
| Tenant-strategi | Har `tenant_id`; unique `(tenant_id, registration_attendee_id, event_session_id)`. |
| RLS-mönster | Per-tenant read/write; check-in write kan begränsas till operator. |
| Stable key | Ingen extern stable key; FK och unique constraint är sanningen. |
| FK-relationer | `registration_attendee_id -> registration_attendees`; `event_id -> events`; `event_session_id -> event_sessions`; `person_id -> persons`. |
| Index-överväganden | `(tenant_id, event_id, status)`; `(tenant_id, person_id, event_session_id)`; unique `(tenant_id, registration_attendee_id, event_session_id)`. |
| Skiftet från Airtable | RECORD_ID-formler ersätts av riktiga FK-relationer. Read models räknar historik härifrån. |
| Spårbarhet | DS6/DQ7/H4, G7. |

#### `registration_state_transitions`

| Fält | Innehåll |
|---|---|
| Syfte | Statushistorik för registration, särskilt för waitlist/cancel/rebook. |
| Adresserar gap/DS/DQ/H | G3, G13, DQ9. |
| Princip-koppling | P3, P5, P6. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `registration_id uuid not null`; `from_status text null`; `to_status text not null`; `reason text not null`; `operation_key text null`; `changed_at timestamptz not null`; `changed_by uuid null`. |
| Tenant-strategi | Har `tenant_id`; optional unique `(tenant_id, operation_key)` för idempotenta operations. |
| RLS-mönster | Read per tenant; insert via app/service; append-only. |
| Stable key | `operation_key` när transition kommer från en operation, format `waitlist-conversion:{id}`. |
| FK-relationer | `registration_id -> registrations`. |
| Index-överväganden | `(tenant_id, registration_id, changed_at desc)`; `(tenant_id, operation_key)`. |
| Skiftet från Airtable | Statusförändringar blir synliga historikposter, inte bara senaste selectvärde. |
| Spårbarhet | G3/G13. |

### B4 — Integration Sources & Lead Magnets

K6-disciplin: integration source är inte lead source. Stable key-formatet gäller alla integration sources, oavsett om dagens källa är Zapier, Elfsight, admin UI, framtida Edge Function eller lead magnet.

#### `integration_sources`

| Fält | Innehåll |
|---|---|
| Syfte | Produkt-/edge-katalog för allt som kan skapa eller leverera data till target. |
| Adresserar gap/DS/DQ/H | G11/DQ4, G14/H7, H13. |
| Princip-koppling | P6, P7, P9, P10. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `source_key text not null`; `source_type text check in ('leadmagnet','event_form','waitlist_form','admin','zapier','edge_function','mail_provider','migration')`; `display_name text not null`; `owner text not null`; `status text check in ('active','paused','deprecated','archived')`; `current_config_id uuid null`; timestamps/audit. |
| Tenant-strategi | Har `tenant_id`; unique `(tenant_id, source_key)`. |
| RLS-mönster | Admin/operator read; admin write; ingest service read. |
| Stable key | `source_key`, exempel `leadmagnet:kraftfaltet`, `event:psionautics-2026-summer`, `zapier:legacy-leadmagnet-5`. |
| FK-relationer | `current_config_id -> integration_source_configs`; refereras av registrations, offer downloads, requests, event ingest configs. |
| Index-överväganden | `(tenant_id, source_key) unique`; `(tenant_id, source_type, status)`. |
| Skiftet från Airtable | SHA256-liknande Zapier-konfig blir läsbara stable keys med ägare/status. |
| Spårbarhet | DQ4/G11; K6; G14/H7. |

#### `integration_source_configs`

| Fält | Innehåll |
|---|---|
| Syfte | Versionerad typed metadata för integration source-konfiguration. |
| Adresserar gap/DS/DQ/H | G11/DQ4, G14/H7, DS7/G15. |
| Princip-koppling | P6, P7; R7 NocoDB. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `integration_source_id uuid not null`; `version int not null`; `config_schema jsonb not null default '{}'`; `config_values jsonb not null default '{}'`; `valid_from timestamptz not null`; `valid_to timestamptz null`; `status text check in ('draft','active','retired')`; timestamps/audit. |
| Tenant-strategi | Har `tenant_id`; unique `(tenant_id, integration_source_id, version)`. |
| RLS-mönster | Admin read/write; service read. |
| Stable key | Versionen identifieras av `(source_key, version)`, inte egen displaysträng. |
| FK-relationer | `integration_source_id -> integration_sources`. |
| Index-överväganden | `(tenant_id, integration_source_id, status)`; `(tenant_id, integration_source_id, version) unique`. |
| Skiftet från Airtable | Config-as-data blir historiserad och maskinläsbar. |
| Spårbarhet | DQ4/G11; R7 NocoDB. |

#### `lead_sources`

| Fält | Innehåll |
|---|---|
| Syfte | Domäntaxonomi för hur en lead uppstod: organic, leadmagnet, referral, event, manual, waitlist. |
| Adresserar gap/DS/DQ/H | G1, G11/DQ4. |
| Princip-koppling | P1, P6, P9. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `lead_source_key text not null`; `display_name text not null`; `category text check in ('organic','leadmagnet','referral','event','manual','waitlist','unknown')`; `status text check in ('active','archived')`; timestamps/audit. |
| Tenant-strategi | Har `tenant_id`; unique `(tenant_id, lead_source_key)`. |
| RLS-mönster | Per-tenant read; admin write. |
| Stable key | `lead_source_key`, exempel `leadsource:leadmagnet`, `leadsource:referral`. |
| FK-relationer | Refereras av `lead_profiles`, `registrations`, `offer_downloads`. |
| Index-överväganden | `(tenant_id, lead_source_key) unique`; `(tenant_id, category, status)`. |
| Skiftet från Airtable | Lead source blandas inte ihop med Zapier/formulärkonfig. |
| Spårbarhet | K6; DQ4/G11. |

#### `lead_magnets`

| Fält | Innehåll |
|---|---|
| Syfte | Domänprodukt/erbjudande som kan generera lead och hämtning. |
| Adresserar gap/DS/DQ/H | G1, G11/DQ4, DQ6. |
| Princip-koppling | P1, P6, P9. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `lead_magnet_key text not null`; `integration_source_id uuid not null`; `display_name text not null`; `status text check in ('draft','active','paused','archived')`; `asset_url text null`; timestamps/audit. |
| Tenant-strategi | Har `tenant_id`; unique `(tenant_id, lead_magnet_key)`. |
| RLS-mönster | Per-tenant read/write; public delivery via edge. |
| Stable key | `lead_magnet_key`, format `leadmagnet:kraftfaltet`; ska matcha produktens integration source när produkten är edge-källan. |
| FK-relationer | `integration_source_id -> integration_sources`. |
| Index-överväganden | `(tenant_id, lead_magnet_key) unique`; `(tenant_id, status)`. |
| Skiftet från Airtable | `Erbjudanden` blir produkt med stable key och separat displaynamn. |
| Spårbarhet | DQ4/G11; `06a` Del F. |

#### `offer_downloads`

| Fält | Innehåll |
|---|---|
| Syfte | Hämtning/claim av lead magnet, inklusive namnlös eller ännu ej verifierad person. |
| Adresserar gap/DS/DQ/H | G1, G11/DQ4, DQ6, G14/H7. |
| Princip-koppling | P1, P2, P6, P7. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `download_key text not null`; `lead_magnet_id uuid not null`; `person_id uuid null`; `lead_source_id uuid not null`; `integration_source_id uuid not null`; `identifier_value_snapshot text null`; `idempotency_key text null`; `downloaded_at timestamptz not null`; timestamps/audit. |
| Tenant-strategi | Har `tenant_id`; unique `(tenant_id, download_key)`; unique partial `(tenant_id, integration_source_id, idempotency_key)`. |
| RLS-mönster | Per-tenant read; ingest service write. |
| Stable key | `download_key`, format från source eller `download:{leadmagnet-key}:{sequence}`. |
| FK-relationer | `lead_magnet_id -> lead_magnets`; `person_id -> persons`; `lead_source_id -> lead_sources`; `integration_source_id -> integration_sources`. |
| Index-överväganden | `(tenant_id, lead_magnet_id, downloaded_at)`; `(tenant_id, person_id)`; `(tenant_id, integration_source_id, idempotency_key)`. |
| Skiftet från Airtable | `Hämtade erbjudanden` behåller semantik men får idempotency och riktiga källrelationer. |
| Spårbarhet | DQ4/G11, DQ6, G14. |

**M1 sanity-check Del B1-B4:** identity, event, registration och integration source har egna stable keys och tenant-aware constraints. `lead_sources` och `integration_sources` är separata tabeller. `attendances` bygger på FK-kedjan event/session/attendee/person, inte Airtable-formler.

### B5 — Communication, Mail State & Outbox

Målet är att skilja "mail skickat" från "target uppdaterad", och göra retry/kompensation synlig.

#### `communication_templates`

| Fält | Innehåll |
|---|---|
| Syfte | Versionerade mallar för bekräftelser, väntelista och lead-magnet-mail. |
| Adresserar gap/DS/DQ/H | G12/DQ8, G9/H13. |
| Princip-koppling | P5, P6, P7. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `template_key text not null`; `channel text check in ('email','sms')`; `subject_template text null`; `body_template text not null`; `version int not null`; `status text check in ('draft','active','retired')`; timestamps/audit. |
| Tenant-strategi | Har `tenant_id`; unique `(tenant_id, template_key, version)`. |
| RLS-mönster | Per-tenant read; admin/operator write. |
| Stable key | `template_key`, exempel `mail:registration-confirmation`. |
| FK-relationer | Refereras av `communication_outbox`. |
| Index-överväganden | `(tenant_id, template_key, version) unique`; `(tenant_id, status)`. |
| Skiftet från Airtable | Mailinnehåll/versionering blir target-data, inte osynlig automationstext. |
| Spårbarhet | G12. |

#### `communication_outbox`

| Fält | Innehåll |
|---|---|
| Syfte | Intent att skicka kommunikation, med status före och efter providerförsök. |
| Adresserar gap/DS/DQ/H | G12/DQ8, G13/DQ9. |
| Princip-koppling | P5, P6, P7, P9. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `outbox_key text not null`; `template_id uuid null`; `person_id uuid null`; `registration_id uuid null`; `waitlist_entry_id uuid null`; `channel text not null`; `recipient_identifier text not null`; `status text check in ('queued','processing','sent','failed','cancelled','compensated')`; `idempotency_key text null`; `scheduled_at timestamptz null`; `sent_at timestamptz null`; `last_error text null`; timestamps/audit. |
| Tenant-strategi | Har `tenant_id`; unique `(tenant_id, outbox_key)`; partial unique for idempotency. |
| RLS-mönster | Per-tenant read; app/service write; no direct provider writes. |
| Stable key | `outbox_key`, exempel `mailout:{registration_key}:confirmation`. |
| FK-relationer | Optional FKs till `communication_templates`, `persons`, `registrations`, `waitlist_entries`. |
| Index-överväganden | `(tenant_id, status, scheduled_at)`; `(tenant_id, person_id, created_at)`; `(tenant_id, idempotency_key)`. |
| Skiftet från Airtable | Ersätter tyst PATCH-risk med outbox-status som är sanningen för side effect. |
| Spårbarhet | G12/DQ8. |

#### `communication_attempts`

| Fält | Innehåll |
|---|---|
| Syfte | Providerförsök för en outboxrad, inklusive Resend-ID, fel och payload metadata. |
| Adresserar gap/DS/DQ/H | G12/DQ8. |
| Princip-koppling | P5, P6, P7. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `outbox_id uuid not null`; `provider text not null`; `provider_message_id text null`; `attempt_no int not null`; `status text check in ('attempted','accepted','delivered','bounced','failed')`; `request_payload jsonb not null default '{}'`; `response_payload jsonb not null default '{}'`; `error_message text null`; `attempted_at timestamptz not null`. |
| Tenant-strategi | Har `tenant_id`; unique `(tenant_id, outbox_id, attempt_no)`. |
| RLS-mönster | Read per tenant; insert service-role-only. |
| Stable key | Provider-ID sparas men är inte target stable key. |
| FK-relationer | `outbox_id -> communication_outbox`. |
| Index-överväganden | `(tenant_id, outbox_id, attempt_no) unique`; `(tenant_id, provider, provider_message_id)`. |
| Skiftet från Airtable | Provider-status och target-status kan felsökas separat. |
| Spårbarhet | G12/DQ8. |

### B6 — Waitlist & Conversion

#### `waitlist_entries`

| Fält | Innehåll |
|---|---|
| Syfte | Väntelistepost för person/event med status och prioritet. |
| Adresserar gap/DS/DQ/H | G13/DQ9. |
| Princip-koppling | P3, P6, P9. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `waitlist_key text not null`; `event_id uuid not null`; `person_id uuid null`; `lead_source_id uuid null`; `integration_source_id uuid null`; `status text check in ('waiting','offered','converted','declined','expired','cancelled')`; `priority int null`; `joined_at timestamptz not null`; timestamps/audit. |
| Tenant-strategi | Har `tenant_id`; unique `(tenant_id, waitlist_key)`. |
| RLS-mönster | Per-tenant read/write; ingest create via service. |
| Stable key | `waitlist_key`, format `waitlist:{event-key}:{sequence}` eller source-provided key. |
| FK-relationer | `event_id -> events`; `person_id -> persons`; `lead_source_id -> lead_sources`; `integration_source_id -> integration_sources`. |
| Index-överväganden | `(tenant_id, event_id, status, priority)`; `(tenant_id, person_id)`. |
| Skiftet från Airtable | Väntelistan är egen state machine, inte bara stagingtabell inför Anmälningar. |
| Spårbarhet | G13/DQ9. |

#### `waitlist_conversions`

| Fält | Innehåll |
|---|---|
| Syfte | Idempotent operation som flyttar väntelista till registration och mail/outbox. |
| Adresserar gap/DS/DQ/H | G13/DQ9, G12/DQ8. |
| Princip-koppling | P5, P6, P7, P9. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `operation_key text not null`; `waitlist_entry_id uuid not null`; `registration_id uuid null`; `outbox_id uuid null`; `status text check in ('started','registration_created','mail_queued','completed','failed','compensated')`; `last_error text null`; `started_at timestamptz not null`; `completed_at timestamptz null`; timestamps/audit. |
| Tenant-strategi | Har `tenant_id`; unique `(tenant_id, operation_key)`. |
| RLS-mönster | Read per tenant; write service/app operation only. |
| Stable key | `operation_key`, format `waitlist-conversion:{waitlist_key}`. |
| FK-relationer | `waitlist_entry_id -> waitlist_entries`; `registration_id -> registrations`; `outbox_id -> communication_outbox`. |
| Index-överväganden | `(tenant_id, operation_key) unique`; `(tenant_id, status, started_at)`. |
| Skiftet från Airtable | Flytten blir transaktionsnära operation med mellanstatus och kompensation. |
| Spårbarhet | G13/DQ9. |

### B7 — Stöddomäner

Stöddomänerna ska bevara semantik men inte Airtable-strukturens formelfält och tomma selects. De kan implementeras i första Supabase-schemat med lägre detaljgrad än B1-B6, men de måste följa tenancy, stable key där det finns domain-ID och auditfält.

| Tabell | Syfte | Kärnkolumner | Tenant/RLS/index | Skiftet från Airtable |
|---|---|---|---|---|
| `interactions` | Samlar Touchpoints/Engagemang/Kontaktlogg som historiska kontakter eller signaler. | `tenant_id`; `interaction_key`; `person_id null`; `interaction_type`; `occurred_at`; `source_id null`; `payload jsonb`; audit. | Unique `(tenant_id, interaction_key)`; index `(tenant_id, person_id, occurred_at)`; per-tenant RLS. | Ersätter parallella rå-/engagemangstabeller med typed interaction-logg där råpayload kan bevaras. |
| `marketing_segments` | Segment/taxonomier för utskick och vyer. | `tenant_id`; `segment_key`; `display_name`; `definition jsonb`; `status`; audit. | Unique `(tenant_id, segment_key)`; admin write. | Tomma/oklara selects blir explicit segmentdefinition eller arkiveras. |
| `bulk_campaigns` | Bulkutskick som operativ kampanj, kopplad till segment och outbox. | `tenant_id`; `campaign_key`; `segment_id null`; `template_id null`; `status`; `scheduled_at`; audit. | Unique `(tenant_id, campaign_key)`; index `(tenant_id, status, scheduled_at)`. | `Bulkutskick` kopplas till communication outbox i stället för fristående logg. |

**M2 sanity-check Del B5-B7:** mail och väntelista har status per steg, idempotency och auditbar operation. Stöddomänerna är inte 1:1 Airtable-port, utan normaliserade runt interaction, segment och communication.

## Del C — Audit, observability och read models

### C1 — Audit-modell

Audit är inte event sourcing. Målet är spårbarhet för förändringar och side effects, inte replaybar domänlogg.

#### `audit_log`

| Fält | Innehåll |
|---|---|
| Syfte | Append-only drift- och ändringslogg för viktiga operationer. |
| Adresserar gap/DS/DQ/H | DS7/G15, G12, G13, G14. |
| Princip-koppling | P5, P6, P7. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `actor_type text check in ('user','service_client','system','migration')`; `actor_id uuid null`; `action text not null`; `target_table text not null`; `target_id uuid null`; `operation_key text null`; `summary text not null`; `metadata jsonb not null default '{}'`; `created_at timestamptz not null`. |
| Tenant-strategi | Har `tenant_id`; ingen update/delete. |
| RLS-mönster | Tenant admins/operators kan läsa; insert service/app trigger; no direct update. |
| Stable key | `operation_key` när åtgärden behöver idempotency/spårning. |
| FK-relationer | Polymorf target via `target_table/target_id`; service client kan refereras i metadata/actor. |
| Index-överväganden | `(tenant_id, created_at desc)`; `(tenant_id, target_table, target_id)`; `(tenant_id, operation_key)`. |
| Skiftet från Airtable | Automation-diff och operationer blir sökbara utan att modellera hela systemet som event stream. |
| Spårbarhet | P5, G15. |

#### `sensitive_change_log`

| Fält | Innehåll |
|---|---|
| Syfte | Fältnivålogg för känsliga tabeller och värden, särskilt identity, mail och status. |
| Adresserar gap/DS/DQ/H | G2, G3, G12, G13, DS7/G15. |
| Princip-koppling | P5, P7, P9. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `table_name text not null`; `record_id uuid not null`; `field_name text not null`; `old_value jsonb null`; `new_value jsonb null`; `changed_by uuid null`; `changed_at timestamptz not null`; `reason text null`. |
| Tenant-strategi | Har `tenant_id`; append-only. |
| RLS-mönster | Admin/operator read; insert trigger/service only; sensitive masking in UI. |
| Stable key | Ingen. |
| FK-relationer | Polymorf record reference. |
| Index-överväganden | `(tenant_id, table_name, record_id, changed_at desc)`; `(tenant_id, changed_at desc)`. |
| Skiftet från Airtable | Känslig status- och identitetsändring får ändringshistorik före event sourcing. |
| Spårbarhet | P5/G15. |

### C2 — Read models och derivat

Read models ska byggas från canonical relationer, inte manuellt dubbellagrade formulas. Första target-versionen bör definiera views/materialized views, inte egna writable tabeller, för:

| Read model | Byggs från | Ersätter/bevarar |
|---|---|---|
| `person_course_history_view` | `persons`, `registration_attendees`, `attendances`, `events`, `programs` | Historiska kurs-/deltagarräkningar och RIM3x-mönster. |
| `person_experience_summary_view` | Samma som ovan plus `registrations.status` | Erfarenhetsbadge utan dead branches. |
| `event_capacity_view` | `events`, `registrations`, `registration_attendees`, `waitlist_entries` | Aktiv/inställd/fullbokad kapacitet med korrekt statuslogik. |
| `lead_funnel_view` | `lead_profiles`, `offer_downloads`, `registrations`, `integration_sources`, `lead_sources` | Lead magnet och funnel-rapportering utan source/config-blandning. |

RIM3x bevaras som read model-pattern: canonical närvaro och event/programmetadata räknas upp till vyer. Det är inte writable truth.

#### `read_model_refreshes`

| Fält | Innehåll |
|---|---|
| Syfte | Loggar refresh/status för materialized views om de används. |
| Adresserar gap/DS/DQ/H | G8, H8, H9. |
| Princip-koppling | P4, P7. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `read_model_key text not null`; `status text check in ('started','completed','failed')`; `started_at`; `completed_at`; `last_error text null`. |
| Tenant-strategi | Har `tenant_id`; service-role write. |
| RLS-mönster | Operators/admins read; service write. |
| Stable key | `read_model_key`, exempel `readmodel:person-course-history`. |
| FK-relationer | Ingen hård FK. |
| Index-överväganden | `(tenant_id, read_model_key, started_at desc)`. |
| Skiftet från Airtable | Derived data får driftstatus om det materialiseras. |
| Spårbarhet | G8/H9. |

### C3 — Operational visibility

Operatörer ska kunna se minst:

- Ingest requests per source: senaste lyckade, senaste fel, retry count och payloadschema-version.
- Outbox: queued/failed/sent och provider attempts.
- Waitlist conversions: var operationen stoppade.
- Identity resolution: personer utan namn, personer utan verified identifier, möjliga dubletter.
- Read models: senaste refresh eller stale-status.

Detta kan byggas som adminvyer över tabellerna ovan. Det kräver inte event sourcing.

**M2 sanity-check Del C:** audit är append-only och ändringslogg, inte replaybar domain event store. RIM3x och counts är read models från canonical relationer.

## Del D — Integration edges som produkter

### D1 — Zapier-ingest-pattern (eller ersättning)

Target ska kunna ersätta Elfsight/Zapier/Airtable-kedjan utan att designen låser implementationen. Därför modelleras request, idempotency och försök generiskt.

#### `integration_requests`

| Fält | Innehåll |
|---|---|
| Syfte | Inkommande request från integration source innan eller medan den blir domänobjekt. |
| Adresserar gap/DS/DQ/H | G14/H7, G11/DQ4, G9/H13, G13/DQ9. |
| Princip-koppling | P6, P7, P9, P10. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `request_key text not null`; `integration_source_id uuid not null`; `service_client_id uuid null`; `idempotency_key text not null`; `payload jsonb not null`; `payload_schema_version int null`; `status text check in ('received','validated','rejected','processed','failed','duplicate')`; `target_table text null`; `target_id uuid null`; `received_at timestamptz not null`; `processed_at timestamptz null`; `last_error text null`. |
| Tenant-strategi | Har `tenant_id`; unique `(tenant_id, integration_source_id, idempotency_key)`. |
| RLS-mönster | Admin/operator read; insert/update service-role-only. |
| Stable key | `request_key`, format `ingest:{source_key}:{idempotency_key}`. |
| FK-relationer | `integration_source_id -> integration_sources`; `service_client_id -> service_clients`. |
| Index-överväganden | `(tenant_id, integration_source_id, idempotency_key) unique`; `(tenant_id, status, received_at)`; `(tenant_id, target_table, target_id)`. |
| Skiftet från Airtable | Zapier writes blir observerbara och idempotenta ingest requests. |
| Spårbarhet | G14/H7; R7 Cal.com/Plane.so. |

#### `integration_processing_attempts`

| Fält | Innehåll |
|---|---|
| Syfte | Försök att validera/processa en integration request. |
| Adresserar gap/DS/DQ/H | G14/H7, DS7/G15. |
| Princip-koppling | P5, P6, P7. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `integration_request_id uuid not null`; `attempt_no int not null`; `status text check in ('started','succeeded','failed','skipped_duplicate')`; `processor_key text not null`; `result jsonb not null default '{}'`; `error_message text null`; `started_at`; `completed_at`. |
| Tenant-strategi | Har `tenant_id`; unique `(tenant_id, integration_request_id, attempt_no)`. |
| RLS-mönster | Operator/admin read; service write. |
| Stable key | Ingen egen stable key. |
| FK-relationer | `integration_request_id -> integration_requests`. |
| Index-överväganden | `(tenant_id, integration_request_id, attempt_no) unique`; `(tenant_id, processor_key, started_at)`. |
| Skiftet från Airtable | Processing blir felsökbar utan att behöva läsa Zapier/Airtable automationhistorik. |
| Spårbarhet | G14/G15. |

### D2 — Edge Functions / Webhooks

Edge Functions i target delas efter ansvar:

| Funktionstyp | Skriver till | Designregel |
|---|---|---|
| Ingest endpoint | `integration_requests` först, därefter domäntabeller i transaktion där möjligt. | Tar emot payload, validerar source key + idempotency, loggar alltid request. |
| Domain operation | `registrations`, `waitlist_conversions`, `communication_outbox` | Gör ett affärsbeslut och loggar audit. |
| Worker | `communication_attempts`, `integration_processing_attempts`, `read_model_refreshes` | Får inte bli osynlig side-effect; varje försök loggas. |
| Read endpoint | Views/read models | Ingen domänskrivning. |

#### `outbound_webhook_deliveries`

| Fält | Innehåll |
|---|---|
| Syfte | Framtida utgående webhook-/integration deliveries, om Miranon behöver skicka data till externa system. |
| Adresserar gap/DS/DQ/H | G14/H7, DS7/G15. |
| Princip-koppling | P6, P7. |
| Kolumner (kärna) | `id uuid pk`; `tenant_id uuid not null`; `delivery_key text not null`; `integration_source_id uuid not null`; `target_url_key text not null`; `payload jsonb not null`; `status text check in ('queued','sent','failed','disabled')`; `attempt_count int not null default 0`; `last_error text null`; timestamps/audit. |
| Tenant-strategi | Har `tenant_id`; unique `(tenant_id, delivery_key)`. |
| RLS-mönster | Admin/operator read; service write. |
| Stable key | `delivery_key`, format `webhook:{source_key}:{operation-key}`. |
| FK-relationer | `integration_source_id -> integration_sources`. |
| Index-överväganden | `(tenant_id, status, created_at)`; `(tenant_id, integration_source_id, created_at)`. |
| Skiftet från Airtable | Om externa side effects tillkommer får de samma observability som inbound. |
| Spårbarhet | G14/G15; R7 Plane.so webhook log. |

### D3 — Resend / mail-side effects

Resend är provider bakom `communication_outbox`, inte domänsanning. Provider-ID och leveransstatus ligger i `communication_attempts`; domänbeslutet ligger i `communication_outbox`. Det löser partial-success-problemet genom att `sent_at` och provider attempt kan vara olika saker med tydlig status.

**M2 sanity-check Del D:** integration edges har stable source keys, idempotency och request-/attemptlogg. Zapier kan ersättas i Fas 5 utan att source-konceptet försvinner.

## Del E — Naming, conventions och stable keys

### E1 — Tabellnamn, kolumnnamn, snake_case-konventioner

- Tabeller: plural snake_case (`persons`, `registrations`, `integration_sources`).
- PK: alltid `id uuid`.
- Tenant FK: `tenant_id uuid not null` på alla tabeller utom uttryckligt globala/systemtabeller.
- Stable domain-ID: `{domain}_key text not null`, till exempel `event_key`, `source_key`, `program_key`.
- Statuskolumner: `status` när tabellens primära state beskrivs; `*_status` när flera state-dimensioner finns.
- Timestamps: `created_at`, `updated_at`, plus domänspecifika tider (`submitted_at`, `downloaded_at`, `joined_at`).
- Actorfält: `created_by`, `updated_by`, `changed_by`, `checked_in_by` pekar på Supabase user där det är mänsklig åtgärd; service klienter loggas via `audit_log.actor_type/actor_id`.

### E2 — Stable keys för domain entities

Stable keys är mänskligt läsbara, stabila och används i integrationer/UI-länkar. De är inte översatta displaynamn och inte databastekniska UUID.

| Entity | Kolumn | Format |
|---|---|---|
| Tenant | `tenant_key` | `miranon-media` |
| Program | `program_key` | `program:medveten-kontakt` |
| Event | `event_key` | `event:psionautics-2026-summer` |
| Event format | `format_key` | `format:retreat-weekend` |
| Integration source | `source_key` | `leadmagnet:kraftfaltet`, `event:psionautics-2026-summer`, `zapier:legacy-leadmagnet-5` |
| Lead source | `lead_source_key` | `leadsource:leadmagnet` |
| Lead magnet | `lead_magnet_key` | `leadmagnet:kraftfaltet` |
| Template | `template_key` | `mail:registration-confirmation` |
| Outbox | `outbox_key` | `mailout:{registration_key}:confirmation` |
| Waitlist conversion | `operation_key` | `waitlist-conversion:{waitlist_key}` |

Stable keys gäller alla integration sources. Zap 5/6 är bara historiska exempel, inte undantagsfall.

### E3 — Översättningslager mellan stable keys och displaynamn

Displaynamn bor i tabellernas `display_name` eller i framtida lokaliseringslager. Integrationer och migrationsmappning får aldrig bero på displaynamn, eftersom displaynamn kan bytas utan att identiteten ändras.

Exempel:

- `integration_sources.source_key = 'leadmagnet:kraftfaltet'`
- `integration_sources.display_name = 'Kraftfältet'`
- `lead_sources.lead_source_key = 'leadsource:leadmagnet'`
- `lead_sources.display_name = 'Lead magnet'`

Detta gör det möjligt att byta formulärtext, Zapier-namn eller UI-label utan att bryta historik och idempotency.

## Del F — Inter-fas-kontrakt till Fas 5 (migration)

### F1 — Vad S-track låser för migrationen

Fas 5 ska utgå från följande som låst target-kontrakt:

- `tenant_id` finns på alla domäntabeller och alla migrationer måste sätta tenant explicit.
- `tenants` är enda globala domänroten i 06b; inga schema-prefix per tenant.
- Persondata delas i `persons`, `person_identifiers`, `lead_profiles`, state och transitions.
- Eventdata delas i `programs`, `event_formats`, `events`, `event_sessions` och `event_ingest_configs`.
- `registrations` är bokning/anmälan; `registration_attendees` är deltagare i bokningen; `attendances` är sessionnärvaro.
- `integration_sources` har stable keys och ägare/status/config; `lead_sources` är separat domäntaxonomi.
- Mail går via `communication_outbox` och `communication_attempts`.
- Waitlist conversion är en operation med egen rad och status.
- Audit är append-only audit/change-log, inte event sourcing.
- RIM3x och kursräkningar är read models från canonical relationer.

### F2 — Vilka transformationer migrationen behöver göra

Detta är vad som måste transformeras. Exakt mapping, batchning, backfill-ordning och timing hör till Fas 5.

| Airtable/source-koncept | Target-koncept | Transformationskrav |
|---|---|---|
| `Personer` | `persons`, `person_identifiers`, `lead_profiles`, `person_state_transitions` | Namnlösa Personer migreras som legitima lead/person-rader. E-post multiline normaliseras till typed identifiers. |
| `Anmälningar` | `registrations`, `registration_attendees`, registration transitions | Statusar mappas till target enum/state. `Källa` mappas till `lead_sources` och/eller `integration_sources`. |
| `Deltaganden` | `attendances` | Riktiga länkar/exporter används för FK. RECORD_ID-formler ignoreras som sanning. |
| `Eventplanering` + `Eventformat` | `programs`, `event_formats`, `events`, `event_sessions` | `EventKey` ersätts av stable `event_key`; sessionsmallar blir sessions eller typed metadata. |
| `Erbjudanden` + `Hämtade erbjudanden` | `lead_magnets`, `offer_downloads`, `lead_profiles` | Hash-/Zapier-config-värden transformeras till stable integration source keys. |
| `Källa (formulärkälla)` SHA/hash-options | `integration_sources`, `integration_source_configs` | H6 återupplivas inte. Värdena behandlas som legacy config/source identifiers. |
| `Återkommande?` | `person_states`, read models eller explicit recurring flag/process | Semantiken "aktiv återkommande process" bevaras under nytt namn; historik räknas separat. |
| RIM3x/course counts | Read models | Byggs från canonical attendance/registration/eventrelationer, inte som writable fields. |
| Mail timestamps/fält | `communication_outbox`, `communication_attempts` | Skickat/providerstatus och targetuppdatering hålls isär. |
| `Väntelista` | `waitlist_entries`, `waitlist_conversions`, outbox | Conversion blir idempotent operation med status per steg. |
| Zapier/Elfsight/form edges | `integration_sources`, `integration_requests` | Varje produkt/edge får stable key, owner, status, idempotency och request-logg. |
| Touchpoints/Engagemang/Kontaktlogg | `interactions`, `marketing_segments`, ev. read models | Semantik bevaras, tomma selects och rådata isoleras som typed payload/metadata. |

### F3 — Vilka frågor lämnas till implementation

Följande är medvetet inte låst i 06b:

- Exakt SQL-DDL, triggerkod och RLS-SQL.
- Om state-kataloger blir reference tables, Postgres enum eller hybrid där 06b inte kräver dynamisk tenant-konfiguration. Rekommendationen i denna design är tabell för person state och check constraints för enkla operationstatusar.
- Exakt Edge Function-indelning och deployment.
- Exakt migration order, stagingtabeller, crosswalk-tabeller och rollbackplan.
- Exakt materialized view refresh-strategi.
- H13: vilken HTML-template/source som idag skapar EventKey-liknande värden ska verifieras i Fas 5 om den behövs för mapping.
- DS7/G15: action-level diff i gamla automationer kartläggs i Fas 5; target har auditmottagare men 06b återskapar inte gamla automationsdetaljer.

### F4 — Mappning av A-tracks Del F-lockning till S-track-design

| A-track låsning | S-track-respekt |
|---|---|
| Namnlösa leads är legitim state | `persons.display_name` nullable, `lead_profiles`, `person_states` med `lead:anonymous`; ingen placeholder-logik. |
| RIM3x är read model | `person_course_history_view` och `person_experience_summary_view` från attendances/events/programs; ingen writable RIM3x-sanning. |
| `Återkommande?`-semantik bevaras | Target skiljer historiskt deltagande från aktiv återkommande process via person state/read model. |
| DQ4 är Zapier-config, inte form-input | `integration_sources` + `integration_source_configs`; H6 förblir rejected. |
| G12/G13 kräver transactional/audit | `communication_outbox`, `communication_attempts`, `waitlist_conversions`, `audit_log`. |
| DS6/DQ7/H4 ej Airtable-fixade | `attendances` bygger FK från canonical relationer; Airtable RECORD_ID-formler migreras inte som sanning. |

**M3 sanity-check Del E-F:** targetkontraktet säger vad Fas 5 måste transformera, men inte hur migrationen körs. Stable key-format och tenantstrategi är konsekventa.

## Del G — Öppna frågor till Gate 4B

1. Ska `person_states` vara tenant-konfigurerbara från start, eller ska första implementationen seedas med en fast state-katalog per tenant? 06b modellerar tabell för explicithet, men implementation kan välja hårdare governance.
2. Ska `event:...`-stable keys för integration sources och events dela exakt string när eventformuläret är produkten, eller ska source key alltid ha en mer specifik suffixform, till exempel `event-form:psionautics-2026-summer`? 06b tillåter båda men kräver uniqueness och explicit relation.
3. Ska `registration_attendees.person_id` få vara nullable i produktion, eller bara under migration/ingest innan identity resolution? 06b tillåter nullable för att stödja ofullständig attendee-state.
4. Ska `interactions` räcka som samlad stöddomän för Touchpoints/Engagemang/Kontaktlogg, eller behöver första Supabase-schemat separata tabeller av UX-skäl? 06b låser semantiken, inte UI-layouten.
5. Ska materialized read models refreshas synkront i domain operations eller asynkront via worker? 06b kräver observability men låser inte refreshmekanism.
6. H13 kvarstår för Fas 5: exakt EventKey-/HTML-template-källa behöver bara verifieras om migrationens mapping kräver den.
