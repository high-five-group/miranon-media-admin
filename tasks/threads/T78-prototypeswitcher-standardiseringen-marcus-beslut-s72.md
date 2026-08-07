---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: closed
---

# T78 — PrototypeSwitcher-standardiseringen — Marcus-beslut S72: växlaren ska vara delad komponent + skill-refererad så varje konvergens-pass får samma form utan o

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
PrototypeSwitcher-standardiseringen — Marcus-beslut S72: växlaren ska vara delad komponent + skill-refererad så varje konvergens-pass får samma form utan omuppfinnande (S72:s K3–K4-fram-och-tillbaka är motivet; UI.md:s steg 4 KRÄVER redan "delad komponent" — S72:s inline-placering var avvikelsen). Två delar: (a) SPOKE — lyft `EventsPrototypeSwitcher` till delad dev-komponent (DEV-grindad hemvist granne med /dev-familjen, INTE 11/11/11-produktbiblioteket; generaliserad props-yta: varianter, steg-par, data-lägen, identitets-raden) vid nästa prototyp-pass eller när event-list-skivan landar; (b) HUB — prototype-skillen uppdateras med standard-formen + S72:s variant/steg-identitetsmodell (variant = divergens-axeln, steg = Marcus-låsta konvergens-förfiningar med snapshot-jämförelsepar) + hemvist-referensen; plugin-bump + omstart = EGEN landning (T66-precedentet), buntas med hub-lyftet L284–L289

**Ursprunglig Ingång-cell:**
_(ingen kort än — endast registrerad); född S72 (2026-07-19, konvergens-passet på event-listan; ADR-053-triage: blockerar ej + värdefullt → defer). **Del (a) SPOKE LEVERERAD S73 K1** (T78a-lyftet: delade PrototypeSwitcher + familje-search-genomslag) — kvar är (b) HUB (prototype-skillens standard-form; buntas med hub-lyftet L284–L304). **Del (b) HUB LEVERERAD S76** (hub-bunten `1f9ca16`, plugin 1.18.0: Standard-formen på UI-grenen — identitetsmodellen + ADR-074-nyckellivscykeln + komponent-hemvisten + snapshot-par-standarden; lessons-buntningen löstes upp ÖPPET — hub-lyftet L284–L306 kvarstår i S75:s end-pass, skill-formen gick i S76:s hub-bunt). **STÄNGD S76**; aktivering vid T18-reinstallen. Besläktad `T66` (levererad tvåfas-generaliseringen — T78 är dess verktygs-standardisering)_
