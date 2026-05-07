# Odoo Security And GDPR Review

## Verifierat Via Officiella Källor

- Odoo Security beskriver kryptering i transit och at rest.
- Odoo Security beskriver server hardening och begränsad remote server access för betrodda engineers.
- Odoo Cloud SLA beskriver lösenordsskydd med PBKDF2+SHA512 och säkerhetsprinciper.
- Odoo Online docs beskriver admin activity logs för database manager.

## Miranon Persondata: Nästan 500 Personer/Deltagare

`data-model.md` verifierar tabellen `Personer` och personrelaterade fält såsom namn, e-post, telefon, ort, anmälningar och deltaganden. Detta är persondata. Vissa fält kan vara känsligare, t.ex. anteckningar, motivering, tidigare erfarenhet, deltagandehistorik och mailpreferenser.

## Risker

| Risk | Påverkan | Mitigation |
|---|---|---|
| Riktig persondata i AI/importtest | GDPR och sekretess | Anonymisera innan Codex/import. |
| Fel access rights | Persondata exponeras | Minsta behörighet, record rules, portal/public check. |
| Riktiga mail från test | Kundpåverkan | Neutralized duplicate, mail disabled. |
| API key med för bred behörighet | Dataskada | Dedikerad bot-user, read-only först, least privilege. |
| Backup/region okänd | GDPR/exit-risk | Kontrollera Database Manager/avtal. |

## Frågor Före Skarp Migration

1. Vilka persondatafält ska migreras?
2. Vilka historiska anteckningar ska inte migreras?
3. Vilken laglig grund gäller för Odoo som ny processor/subprocessor?
4. Hur hanteras radering/export/ändring på begäran?
5. Vilka användare ska ha åtkomst till deltagarhistorik?
