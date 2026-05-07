# Odoo-Version Och Källstrategi

## Slutsats

Faktisk Odoo-version i Miranons databas är **ej verifierad**. Denna körning använder Odoo 19.0 som arbetsantagande eftersom dokumentet pekar på Odoo 19.0-källor och aktuell officiell dokumentation finns för 19.0.

## Verifieringsstatus

| Punkt | Status | Källa | Nästa verifiering |
|---|---|---|---|
| Faktisk Odoo-version | Ej verifierat | Inga Odoo credentials i miljön. | Kontrollera Database Manager eller Odoo UI. |
| Deploymentmodell | Ej verifierat | Användaren nämner Odoo Online, men ingen instansinspektion finns. | Kontrollera Database Manager. |
| Dokumentationsversion | Verifierat som arbetskälla | Odoo 19.0 docs. | Matcha mot faktisk version. |
| Källkodsversion | Verifierat som arbetskälla | Official `odoo/odoo` branch `19.0`. | Matcha mot faktisk version och edition. |
| Enterprise-appar | Ej verifierat | Ingen Enterprise-kodaccess. | Verifiera via faktisk Odoo-app-lista. |

## Källprioritet

1. Faktisk Odoo-instans/API/export/UI.
2. Officiell Odoo 19.0-dokumentation.
3. Officiell Odoo 19.0-källkod.
4. Miranon-repot och `docs/reference/data-model.md`.
5. Publik webb på `miranon.se`.
6. Tutorial/transkript som praktisk UI-källa, sekundär till dokumentation/kod/instans.

## Konsekvens

Alla Odoo-modeller och fält från källkoden är märkta som `Verifierat i officiell Odoo 19.0-källkod`, inte som verifierade i Miranons Odoo Online-databas. De får inte användas för skarpa importer eller writes förrän de har verifierats mot Miranons instans.
