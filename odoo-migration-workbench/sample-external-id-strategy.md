# Sample External ID Strategy

Detta är koncept och måste verifieras mot Odoo import preview.

| Entitet | Exempel External ID | Regel |
|---|---|---|
| Event | `miranon.event.<airtable_record_id>` | En per Eventplanering record. |
| Person/contact | `miranon.person.<normalized_email_hash_or_record_id>` | Använd helst record ID eller stabil hash, inte rå e-post i ID om känsligt. |
| Registration | `miranon.registration.<airtable_record_id>` | En per Anmälningar record. |
| Question | `miranon.question.<slug>` | Endast efter verifierad fråga. |

External IDs ska göra importer idempotenta: andra körningen ska uppdatera, inte duplicera.
