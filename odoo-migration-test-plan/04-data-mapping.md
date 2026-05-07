# Data Mapping

## Verifierade Källentiteter

Från `docs/reference/data-model.md`:

- `Eventplanering`
- `Anmälningar`
- `Personer`
- `Deltaganden`
- `Väntelista`
- `Hämtade erbjudanden`
- `Engagemang`
- `Erbjudanden`
- `Touchpoints`
- Mail/segment/loggtabeller

## Konceptuell Odoo-Mapping

| Source entity | Source status | Odoo app | Odoo candidate | Odoo status | Kommentar |
|---|---|---|---|---|---|
| Eventplanering | Verifierad i repo | Events | `event.event` | Kodverifierad | Importfält ej verifierade. |
| Anmälningar | Verifierad i repo | Events | `event.registration` | Kodverifierad | Statusmapping krävs. |
| Personer | Verifierad i repo | Contacts | `res.partner` | Standardmodell, ej instansverifierad | Dedupe på e-post. |
| Deltaganden | Verifierad i repo | Events | registration state/check-in/slots | Hypotes | Kan kräva hybrid/custom. |
| Registreringsfrågor | Delvis via fält | Events | `event.question`/answers | Kodverifierad | Relationell import. |
| Väntelista | Verifierad i repo | Events/CRM | waitlist custom eller registration state | Hypotes | Odoo-standard ej verifierad. |

## External ID-Strategi

Använd deterministiska External IDs för testimport, t.ex. `miranon_event_<source_record_id>` och `miranon_registration_<source_record_id>`. Detta är koncept, inte skarp importmall.

## Airtable-Tabeller Ej Fullt Exportverifierade

Repo-dokumentationen verifierar schema, men denna körning läste inte live Airtable API eller CSV-exporter. Exakta aktuella radantal, relationsvärden och datakvalitet måste verifieras i Körning 3.
