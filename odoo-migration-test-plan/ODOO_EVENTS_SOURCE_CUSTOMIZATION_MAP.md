# Odoo Events Source Customization Map

| Objekt | Källa | Anpassningsmöjlighet | Rekommenderad nivå | Risk |
|---|---|---|---|---|
| `event.event` | `addons/event/models/event_event.py` | Fält/vyer/settings kan ändras med Studio; affärslogik via custom module på Odoo.sh. | Standard/Studio först. | Fel custom logic kan bryta seats/registration. |
| `event.registration` | `addons/event/models/event_registration.py` | Extra fält/properties, vyer, import/API, custom validation. | Studio/import först. | Statusar och mailflöde känsligt. |
| `event.event.ticket` | `addons/event/models/event_ticket.py` | Ticket tiers/capacity, sales integration. | Standard config först. | Paid flow kan trigga Sales/Accounting. |
| `event.question` | `addons/event/models/event_question.py` | Registration questions och mandatory fields. | Standard config. | Ändra inte fråga med befintliga svar utan test. |
| `website_event` templates | `addons/website_event/views/*` | Website editor/SEO/template inheritance. | Website builder först. | Core template override blir upgrade-risk. |
| Registration routes | `addons/website_event/controllers/main.py` | Kan teoretiskt extendas i custom module. | Undvik i första fas. | Publik registration är affärskritiskt. |
| Security/access | `security/*.xml`, `ir.model.access.csv` | Access rules/record rules via Studio eller module. | Minsta möjliga behörighet. | Fel regler kan exponera persondata. |
