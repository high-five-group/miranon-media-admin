# Odoo Database/Hosting Doc Sources

| Källa | URL | Vad som verifierades | Relevans | Osäkerheter | Konsekvens |
|---|---|---|---|---|---|
| Odoo Online | https://www.odoo.com/documentation/19.0/administration/odoo_online.html | Private databases hosted/managed by Odoo; browser access; no local install; incompatible with custom modules; duplicate and backup options. | High | Miranon deployment/plan ej verifierad. | Första test bör vara Online utan custom modules. |
| Odoo.sh | https://www.odoo.com/documentation/19.0/administration/odoo_sh.html | Official cloud platform with web shell, dependencies, CI and SSH. | Medium | Odoo.sh-projekt finns ej verifierat. | Endast om custom module behövs. |
| Hosting | https://www.odoo.com/documentation/19.0/administration/hosting.html | Flyttvägar mellan Online, Odoo.sh och on-premise; backupdownload för Online. | High | Exakt backupstorlek/region okänd. | Exit ska testas tidigt. |
| Cloud SLA | https://www.odoo.com/cloud-sla | 99.9% monthly target; regions; RPO/RTO objectives. | High | Kundspecifika SLA-villkor okända. | Tillräckligt för test, kontrollera avtal. |
| Security | https://www.odoo.com/security | Kryptering in transit/at rest, server hardening, begränsad staff access, datacenterkontroller. | High | Kundspecifika logs/access okända. | GDPR-check krävs före persondata. |
| External JSON-2 API | https://www.odoo.com/documentation/19.0/developer/reference/external_api.html | `/json/2`, `/doc`; API only on Custom pricing plan. | High | Miranon plan ej verifierad. | Om API saknas: UI export/import. |
| Studio | https://www.odoo.com/documentation/19.0/applications/studio.html | Studio plan/upsell och customization. | Medium | Studio-access okänd. | Studio bör inte antas gratis. |
