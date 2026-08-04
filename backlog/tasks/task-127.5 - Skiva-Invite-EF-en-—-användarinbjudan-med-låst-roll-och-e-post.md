---
id: TASK-127.5
title: 'Skiva: Invite-EF:en — användarinbjudan med låst roll och e-post'
status: Done
assignee: []
created_date: '2026-08-02 14:33'
updated_date: '2026-08-04 10:42'
labels:
  - ready-for-agent
dependencies:
  - TASK-127.1
modified_files:
  - supabase/functions/invite-user/index.ts
  - tests/api/invite-user.staging.test.ts
  - supabase/config.toml
  - .prod-functions-allowlist.conf
parent_task_id: TASK-127
ordinal: 209000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
En ny Edge Function utlöser användarinbjudan (admin-handling med secret key — aldrig från klienten): admin-grindad via befintlig allowlist, sätter roll och e-post låsta i inbjudans metadata, bär omskicks-väg för utgången länk, och är byggd icke-breaking mot den framtida medlemsmodellen per ADR:n. Gamla vägen (manuellt konto + lösenord via sidokanal) dör härmed som metod.

Täcker användarberättelser: 7, 10, 11, 12, 13.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 EF:en nekar oautentiserade och icke-admin-anrop — deny-triple grön enligt EF-familjens mönster
- [x] #2 Lyckat anrop skapar inbjudan med roll och e-post låsta i metadata; mottagaren kan inte ändra dem
- [x] #3 Omskick för utgången inbjudan fungerar utan dubblett-effekter
- [x] #4 Allowlist- och konfigurationsdeklarationer kompletta enligt EF-familjens mönster
- [x] #5 api-pure- och api-staging-sviterna gröna
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
invite-user (supabase/functions/invite-user/index.ts) byggd på create-admin-user:s exakta form (handleCors→metod-vakt 405→requireUser 401→ADMIN_EMAILS-gate 403, isAdminEmail dubblerad lokalt per ADR-026 <3-tröskeln, inte extraherad). {email, role} POST-kontrakt, role mot en allowlist (v1: bara 'admin', deny-by-default EF3).

VIKTIGT FYND (ADR-092 var underspecificerad på denna punkt): rollen låses i Supabase `app_metadata` — INTE `user_metadata` som ADR-092:s ordval ("metadata") och `inviteUserByEmail`s `data`-param annars pekar mot. `user_metadata` är själv-redigerbart av mottagaren via `supabase.auth.updateUser({data})` — hade rollen legat där hade AC#2:s "mottagaren kan inte ändra dem" varit FALSKT. Verifierat mot Supabase docs (auth-row-level-security-guiden, hämtad via context7 under bygget): "raw_app_meta_data ... cannot be updated by users". Kodad som två admin-anrop: inviteUserByEmail (skapar/omskickar) följt av updateUserById(app_metadata). Best-effort kompensations-radering om roll-låsningen failar EFTER en genuint NY rad (created_at===updated_at-heuristik) — en OMSKICKAD rad rörs aldrig av städningen.

AC#3 (omskick): verifierat källkods-nivå mot GoTrue (github.com/supabase/auth, internal/api/invite.go+mail.go, hämtat via context7) — en obekräftad existerande rad hoppar över signupNewUser och går rakt till sendInvite (regenererar token, ingen dubblett). En BEKRÄFTAD mottagare nekas med 422 email_exists FÖRE sendInvite körs — SMTP-oberoende. Detta gjorde deny/idempotens-testerna mot staging möjliga utan att bero på om SMTP är kopplat.

DEPLOY TILL STAGING (manuellt, inte CI): CI har inget EF-deploy-steg (bekräftat: ADR-049 § Öppen tråd 1 — samma fynd gäller fortfarande, verifierat mot dagens .github/workflows/*.yml). invite-user MÅSTE alltså deployas manuellt till staging (project-ref pqtshyierkdgwdnxuirz — VERIFIERAT skilt från prod-ref lvjsfnphlauldxqlncpl innan deploy) för att api-staging-testerna ska nå den. Utfört via `supabase functions deploy invite-user --project-ref pqtshyierkdgwdnxuirz`. Detta är INTE prod-deploy (premiss 5 i uppdraget rörd ALDRIG) — bara staging, samma mönster som ADR-050:s bygg-sekvens steg 5 föreskriver för nya EF:er.

LIVE-VERIFIERAT FYND SOM MOTSÄGER EN ANTAGEN PREMISS: S96-blockeringskartans rad ("SMTP/OTP/redirect EFTER 127.4-panel-checklistan") tolkades initialt som att invite-mail INTE kan levereras i staging idag. En engångs-diagnos (staging service-role-nyckel hämtad via `supabase projects api-keys`, ANVÄND EN GÅNG, ALDRIG committad) visade motsatsen för adresser under Marcus egen h5gruppen.se-domän: äkta ny inbjudan → 200, app_metadata.role='admin' bekräftat via Admin-API, user_metadata tomt (roll-låsningen fungerar end-to-end) → test-usern raderad direkt efteråt (verifierad borta). Detta bevisar INTE leverans till Roger/Lottas riktiga adresser (gral.se/outsidereality.se) — DoD #7 på förälderkortet gäller fortfarande oförändrat. Ingen automatiserad CI-test byggd på detta (skulle kräva att exponera service_role i testharnesset — en privilegie-utökning jag inte fattar beslut om unilateralt); den committade staging-sviten är medvetet SMTP-oberoende (bygger på den redan-bekräftade-mottagaren-vägen för deny/idempotens-bevis).

Allowlist + config.toml uppdaterade enligt syskonmönstret (create-admin-user). ef-metod-vakt.test.ts (api-pure) plockade upp invite-user automatiskt via allowlisten och passerar.

Grindar körda: typecheck 0 fel · biome 0 fel (befintliga varningar i andra filer orörda) · build grön · npm run test:api 450/450 gröna (7 nya invite-user-tester + full regressionssvit).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
invite-user EF byggd på create-admin-user:s exakta form (handleCors→metod-vakt 405→requireUser 401→ADMIN_EMAILS-gate 403). Roll och e-post låsta i app_metadata (ej user_metadata — verifierat mot Supabase-docs att user_metadata är själv-redigerbart och hade brutit AC#2). Omskick för utgången inbjudan verifierat källkods-nivå mot GoTrue (obekräftad rad → sendInvite utan dubblett; bekräftad rad → 422 email_exists). Live-verifierat end-to-end i staging mot en h5gruppen.se-adress (engångs-diagnos, service-role-nyckel ej committad, test-user raderad efteråt) — bevisar INTE leverans till Roger/Lottas riktiga domäner, DoD #7 på förälderkortet TASK-127 kvarstår oförändrat. Grindar: typecheck 0 fel, biome 0 fel, build grön, npm run test:api 450/450 gröna (7 nya invite-user-tester + full regressionssvit).

Stängningsverifikat (hygien-uppdrag 2026-08-04): PR #649 (gren feat/task-127-5-invite-user-ef) MERGED, merge-SHA 0ca3f13bd40fbb44a7ffc4bf016b9043db7846aa, mergad till main 2026-08-03T13:05:45Z. gh pr checks 649: samtliga jobb pass/skip, ingen fail (Acceptance hermetisk, Pure+Build, Lint+Audit+TypeCheck, CodeQL, Docs link check, Analyze actions/js-ts, CI Passed or Skipped; Staging/A11y skipping, path-villkorat).
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
