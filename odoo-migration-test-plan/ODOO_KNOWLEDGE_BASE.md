# Odoo Knowledge Base

## Verifierade Generella Fakta

- Odoo Events 19.0 har stöd för events, event templates, tickets, questions, attendees/registrations, barcode/check-in, website publishing, reporting och avancerade moduler för tracks, booths, exhibitors och CRM.
- Odoo Online är privata databaser hostade/managerade av Odoo och är inte kompatibelt med custom modules.
- Studio kan anpassa fält/vyer/modeller/automation/webhooks/reports/approval/security men kan påverka plan/kostnad.
- JSON-2 API i Odoo 19.0 kräver Custom pricing plan och faktiska modeller/fält är databasunika via `/doc`.
- Odoo.sh är rätt nivå för custom modules, shell/SSH och CI.

## Miranon-Specifik Kunskap

- Nuvarande custom app är React/Vite/Supabase/Airtable ovanpå Miranon Medias event, anmälningar, betalningar, personer, leads, närvaro och mail.
- `data-model.md` är lokal sanningskälla för Airtable med 18 tabeller/358 fält per 2026-04-28.
- Kärnflödet är `Personer` -> `Anmälningar` -> `Eventplanering` -> `Deltaganden`.
- Publik webb är Shopify-baserad och visar eventplanering, utbildningar, föreläsningar, bok/meditationer och kontakt.

## Viktigaste Osäkerheter

- Faktisk Odoo-version och plan.
- Installerade appar i Miranons databas.
- Faktiska Odoo-importfält.
- Om Odoo Website räcker som publik frontend.
- Om Miranons sessions-/deltagandemodell passar standard Odoo eller kräver hybrid/custom.
