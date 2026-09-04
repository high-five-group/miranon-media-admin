# En dom om "redan löst" måste pröva HELA påståendet, inte bara den del som råkade mätas

**[UNIVERSAL] En fråga stängdes med domen "redan utrett och stängt" trots att
registret redan bar felet i klartext, eftersom domen bara prövade EN av två
nödvändiga delar av påståendet.** Mätt 2026-09-02 (S113 Del 16,
`tasks/sessions/2026-08-29-session-113.md` rad 1697 till 1714): en tidigare
dom vilade på `TASK-270`s HOST-mätning (Site URL korrekt), men accept-sidan
är `/valkommen` och utan `INVITE_REDIRECT_URL` skickar `invite-user` ingen
`redirectTo` alls, så länken hoppade över lösenordssteget trots att HOST var
rätt. Åtkomstregistret hade redan dokumenterat exakt detta 2026-08-23, och
`TASK-270` självt bokförde frågan som en kvarstående, deferrad
robusthetsfråga i stället för löst. Regel: när ett påstående har flera
nödvändiga delar (host OCH path, orsak OCH mekanism), pröva varje del var
för sig innan frågan stängs. En dom byggd på den del som råkade mätas är
inte en dom över helheten.
