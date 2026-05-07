# Odoo Events POC Design

## Syfte

Bevisa minsta möjliga eventloop utan skarpa kunddata: testevent -> publik sida -> testanmälan -> attendee-lista -> valfri check-in/report.

## Scope

- 1 testevent med tydlig `ODOO_POC_LABEL`.
- 1 gratis ticket/registration type om fält verifieras.
- 1-3 fake attendees med `example.com`-mail.
- 1-2 registreringsfrågor om fält verifieras.
- Ingen faktura, betalning, skarp mail, SMS eller webhook.

## Acceptance Criteria

| Fråga | Godkänt när |
|---|---|
| Kan Miranon skapa event? | Testevent finns i Odoo och kan läsas tillbaka. |
| Kan event publiceras? | Testevent är synligt på Odoo Website i test/duplicate. |
| Kan besökare anmäla sig? | Fake attendee skapas via website eller API/import. |
| Kan frågor hanteras? | Frågesvar syns på attendee/registration. |
| Kan kontakt/deltagare kopplas? | `res.partner`/registration relation verifieras utan dubblett. |
| Kan check-in hanteras? | Registration kan markeras attended utan produktionspåverkan. |
| Kan data importeras idempotent? | External ID/import preview visar update path. |

## Stopplinjer

- Ingen verifierad testdatabas.
- Mail/payments/webhooks kan inte neutraliseras.
- Odoo-modeller/fält kan inte verifieras.
- Plan/API/import begränsar testet så att det inte bevisar något relevant.

## Rollback/Cleanup

Alla poster måste märkas med `ODOO_POC_LABEL`. Cleanup ska först köras dry-run och bara radera poster med exakt label.
