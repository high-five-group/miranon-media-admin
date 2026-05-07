# Odoo Verification Log

| Påstående | Status | Bevis | Begränsning |
|---|---|---|---|
| Odoo Events har basmodeller för event/registration/ticket/question | Verifierat i officiell kod | `addons/event/models/*.py` branch 19.0 | Inte verifierat i Miranon-instans. |
| Website registration routes finns i Odoo 19.0 | Verifierat i officiell kod | `addons/website_event/controllers/main.py` | Inte verifierat installerat. |
| Odoo Online stöder inte custom modules | Verifierat i officiell docs | Odoo Online docs | Deployment ej verifierad. |
| JSON-2 API kräver Custom plan | Verifierat i officiell docs | External API docs | Plan ej verifierad. |
| Miranon har 18 Airtable-tabeller/358 fält | Verifierat i repo | `docs/reference/data-model.md` | Aktuellt live-radantal ej verifierat. |
| Miranon publicerar event/utbildningar på webben | Verifierat publikt | `miranon.se/pages/eventplanering` | Formuläret skickades inte. |
| Tutorialoutputen är komplett | Verifierat lokalt | `QUALITY_REPORT.md` 17/17 | Transkript inte committade. |
| Faktisk Odoo-instans | Ej verifierat | Saknar env/credentials | Kräver manuell/API-verifiering. |
| POC-write | Ej körd | Gatecheck misslyckad | Kräver testmiljö och verified fields. |
