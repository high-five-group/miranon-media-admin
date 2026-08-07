---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T72 — Testdisciplin mot prod-basen: dubbelroll-adresser, `Testdata`-markör och staging-först — Marcus adresser (`highfive.epost@gmail.com`, `inbox@marcusemails.co`

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
Testdisciplin mot prod-basen: dubbelroll-adresser, `Testdata`-markör och staging-först — Marcus adresser (`highfive.epost@gmail.com`, `inbox@marcusemails.com`) är BÅDE riktiga deltagar-identiteter OCH testadresser (fälla 44). Testartefakter i prod kräver därför en handunderhållen roll-lista (`docs/reference/testkonton.md`) i stället för en strukturell markör. Rekommenderad ordning: (1) testa i staging-basen `apphjj8Q7lkXCMsL4` — prod-tester är grundorsaken; (2) `Testdata`-checkbox på Anmälningar som segment/utskick/exporter filtrerar på (ADR-063: resolution I BASEN, ej skript-lapp); (3) plus-adressering (`inbox+test@…`) som operativ vana — OBS pröva att formuläret inte validerar bort `+` först.

**Ursprunglig Ingång-cell:**
_(ingen kort än — endast registrerad); uppstod Session 60 (segment-exporten). Blockerar inget; Marcus: "jag vill inte jobba med det just nu"._
