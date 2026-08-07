---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T74 — Consent får två sanningskällor när utskick går via Resends egna kontakter/segment — `Ej godkänd för mailutskick` (`fldbQB9BGJgB1HCg7`, checkbox på Per

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
Consent får två sanningskällor när utskick går via Resends egna kontakter/segment — `Ej godkänd för mailutskick` (`fldbQB9BGJgB1HCg7`, checkbox på Personer) är consent-golvet per [ADR-067](../../docs/decisions/ADR-067-bulk-mail-segment-send-kontrakt.md) D5 (skicka **endast** där `ejGodkandMail === false`). Skool-förvarningen skickas som en Resend-**broadcast** mot uppladdade kontakter, och då gäller tre saker som drar isär basen och Resend: (a) en broadcast bär en unsubscribe-länk, och avprenumerationen sätter kontaktens `unsubscribed`-egenskap **i Resend** — signalen når aldrig basen; (b) [ADR-062](../../docs/decisions/ADR-062-segment-yta-berakn-medlemskap-fran-kalla.md) beslut 1/2/6 slår fast att medlemskap **beräknas ur källan, aldrig lagras** — ett Resend-segment ÄR en lagrad lista, alltså en frysning (ADR-062 beslut 4), och Resends import kan lägga till men aldrig ta bort medlemmar, så en re-import efter att en namnlös person fått namn placerar hen i BÅDA listorna → dubbel-inbjudan (samma klass som Skool-fällan, fälla 44:s grannskap); (c) `send-email`-EF:en (Fas 6h) resolverar mottagare direkt ur basen och rör inte Resends segment — de två vägarna divergerar. **Empiriskt tillstånd 2026-07-09:** `{Ej godkänd för mailutskick}=TRUE()` ger **0 records** i prod-basen (formeln verifierad discriminant-duglig via `NOT(...)`-motprov) → filtret är vakuöst idag, inget utskick har gått fel, inget brådskar (Marcus 2026-07-09: "vi kommer inte skicka något mer än Skool-inbjudan nu"). **Lösningsrymd (öppen, EJ beslut):** (1) bär consent in vid import via `column_map.unsubscribed` så Resend upprätthåller golvet vid broadcast; (2) synka tillbaka Resends `unsubscribed` till basen (webhook eller periodisk avstämning) så basen förblir sanningen; (3) sluta använda Resend-broadcasts när 6h:s `send-email` är live och skicka allt genom EF:en. Beslut krävs **före nästa bulkutskick**, inte före Skool-inbjudan.

**Ursprunglig Ingång-cell:**
_(ingen kort än — endast registrerad); uppstod Session 60 vid Resend-segment-designen. Besläktad `T16` (bas-maximering), `T73`._
