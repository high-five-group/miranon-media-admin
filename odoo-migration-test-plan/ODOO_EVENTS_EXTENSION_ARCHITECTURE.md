# Odoo Events Extension Architecture

## Grundprincip

Om Miranon behöver custom code ska den ligga i en separat modul som ärver Odoo-standard. Modulen ska ha liten scope, tester, tydliga dependencies och ingen core patch.

## Konceptuell Modulstruktur

```text
miranon_event/
  __manifest__.py
  models/
  views/
  controllers/
  security/
  data/
  tests/
  static/
```

Detta är en konceptstruktur, inte en färdig modul.

## Möjliga Extension Points

| Behov | Verifierad Odoo-källa | Möjlig extension |
|---|---|---|
| Extra eventfält | `event.event` | Model inheritance + view inheritance. |
| Extra registration data | `event.registration`, `event.registration.answer` | Studio fields först, module senare. |
| Särskild public registration logic | `WebsiteEventController` | Controller extension, hög risk. |
| Custom report/score | Event reports eller egen model | Module/report view. |
| Airtable migration helpers | API/import layer | Extern middleware hellre än core patch. |

## Upgrade-Strategi

- Håll custom code minimal.
- Testa mot Odoo major version innan upgrade.
- Undvik att override:a controllers/templates om Website builder räcker.
- Dokumentera varje inherited model/view med källa och affärsbehov.

## Beslutsregel

Odoo.sh/custom module är motiverat först när ett verifierat Miranon-krav inte kan lösas med standard Events, Website, Studio, import/export eller API/middleware.
