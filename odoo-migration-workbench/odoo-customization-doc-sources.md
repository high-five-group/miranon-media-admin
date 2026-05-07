# Odoo Customization Doc Sources

| Titel | URL | Område | Verifierat | Begränsning | Miranon-påverkan | Gäller |
|---|---|---|---|---|---|---|
| Odoo Studio 19.0 | https://www.odoo.com/documentation/19.0/applications/studio.html | No-code customization | Studio kan ändra fields, views, models, automation rules, webhooks, PDF reports, approval rules och security rules. | Standard-plan kan trigga upsell till Custom plan. | Studio är relevant men plan/access måste verifieras. | Online/Odoo.sh/on-premise |
| Odoo Online 19.0 | https://www.odoo.com/documentation/19.0/administration/odoo_online.html | Hosting/custom code | Online är privata Odoo-hostade databaser och är inkompatibelt med custom modules. | Faktisk Miranon-plan okänd. | Första test bör hålla sig till standard/Studio/import. | Online |
| Odoo.sh 19.0 | https://www.odoo.com/documentation/19.0/administration/odoo_sh.html | Custom code | Odoo.sh ger web shell, module dependencies, CI och SSH access. | Kostnad/komplexitet ej analyserad avtalsmässigt. | Endast om standard/Studio/API inte räcker. | Odoo.sh |
| External JSON-2 API | https://www.odoo.com/documentation/19.0/developer/reference/external_api.html | Integration | `/json/2`; `/doc` visar databasens modeller/fält; API kräver Custom plan. | Access okänd. | Avgör Codex-automation. | Custom plan |
| Official Odoo 19.0 source | https://github.com/odoo/odoo/tree/19.0 | Custom modules | Eventmodeller/controllers/views kan ärvas i moduler. | Inte bevis på Miranon-installation. | Underlag för Odoo.sh-arkitektur. | Odoo.sh/on-premise |
