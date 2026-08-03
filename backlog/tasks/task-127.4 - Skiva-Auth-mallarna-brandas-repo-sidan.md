---
id: TASK-127.4
title: 'Skiva: Auth-mallarna brandas (repo-sidan)'
status: To Do
assignee: []
created_date: '2026-08-02 14:33'
updated_date: '2026-08-03 12:17'
labels:
  - ready-for-agent
dependencies:
  - TASK-127.1
modified_files:
  - supabase/config.toml
  - supabase/templates/invite.html
  - supabase/templates/recovery.html
  - biome.json
  - tasks/threads/T46-go-live-karta.md
parent_task_id: TASK-127
ordinal: 208000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Auth-mailen (inbjudan, återställning) får brandad svensk copy i Miranon-ton med avsändare från den sändande subdomänen. Skivan gör repo-sidan komplett och producerar den exakta panel-checklistan för Marcus-momenten (SMTP-koppling, subdomänverifiering, DMARC) — själva panelhandlingarna är Grind 0-paketet i T46, inte denna skiva.

Täcker användarberättelser: 1, 6.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Invite- och återställningsmallarna bär svensk brandad copy och korrekt avsändarform från sändande subdomänen
- [x] #2 Konfigurationen ligger versionerad på repo-sidan där plattformen tillåter det
- [x] #3 Marcus-momenten (SMTP-värden, subdomänverifiering, DMARC-post) dokumenterade som exakt checklista i T46-kartan
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Repo-sidan: [auth.email.smtp] (host/port/user/avsändare — ej lösenord, refereras env(AUTH_SMTP_PASS)) + [auth.email.template.invite|recovery] (subject+content_path) + otp_expiry=86400 + additional_redirect_urls i supabase/config.toml. Mallarna supabase/templates/{invite,recovery}.html: svensk brandad copy, hårdkodade brand-hex (mailklienter saknar CSS-variabel-stöd), kontrast räknad (vit-på-koppar 5,96:1). biome.json: supabase/templates undantaget (samma klass som supabase/functions — Go-template-syntax {{ .X }} som Biomes HTML-parser inte stödjer). T46-go-live-karta.md punkt 4-7 förfinade till exakt checklista med DNS-postformer (verifierat context7 /websites/resend) + en ny säkerhetsnot: 'supabase config push' saknar 'config pull', push-semantik overifierad mot skarp körning.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Repo-sidan komplett: auth-mallarna (invite+recovery) versionerade i supabase/config.toml + supabase/templates/*.html med svensk brandad Miranon-copy och SMTP-avsändarform från send.miranon.dev. SMTP-lösenordet, DNS-posterna och push-exekveringen kvarstår som Marcus/Code-panelmoment (T46-kartan, nu med exakt checklista). Premiss-avvikelse: uppdragets ADR-091-hänvisning för DMARC-beslutet var fel — ADR-091 är hosting/Vercel; DMARC-beslutet (p=reject, S95 beslut 4) bor i sessionsdok S95 Del 2 + T44/T46, inte i en ADR. Byggd på korrekt källa, avvikelsen bokförd.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
