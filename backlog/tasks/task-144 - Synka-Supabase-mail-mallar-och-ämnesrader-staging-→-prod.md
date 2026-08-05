---
id: TASK-144
title: Synka Supabase mail-mallar och ämnesrader staging → prod
status: To Do
assignee: []
created_date: '2026-08-05 15:27'
labels:
  - ready-for-agent
dependencies:
  - TASK-143
priority: high
ordinal: 229000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
MÄTT 2026-08-05 (S96, femte resumen) vid staging/prod-jämförelse ur Supabase Management API: prods samtliga mail-mallar och ämnesrader är Supabase-defaults på ENGELSKA, medan staging bär de svenska som byggdes i TASK-127.x.

EXEMPEL ur mätningen (staging | prod):
- invite: 'Ditt konto hos Miranon Media' | 'You have been invited'
- recovery: 'Återställ ditt lösenord — Miranon Media' | 'Reset Your Password'
- mall-innehåll: brandad/versionerad i supabase/templates/ | Supabase-default '<h2>You have been invited</h2>'

Skillnaden gäller ~20 fält: mailer_subjects_* och mailer_templates_* i båda riktningarna, plus mailer_subjects_custom_contents och mailer_templates_custom_contents.

KONSEKVENS: en inbjudan eller lösenordsåterställning skickad från prod kommer i dag på engelska med Supabase-standardtext. Prod är miljön admin.miranon.dev pekar på (.env.production → lvjsfnphlauldxqlncpl), så detta är det Roger och Lotta faktiskt får.

AVGRÄNSNING MOT TASK-143: Marcus beslut 2026-08-05 (väg 2) är att INVITE-mallen följer med TASK-143, som ändå rör supabase/templates/invite.html för att bära namn + inbjudare. Detta kort tar RESTEN — recovery-mallen och övriga mailer_*-fält som inget annat kort äger. Därav dependency på TASK-143: ta detta EFTER, annars skrivs invite-mallen över två gånger.

METOD som är mätt och fungerar (S96 Del 12): riktad PATCH mot Management API /v1/projects/{ref}/config/auth, ALDRIG supabase config push. Pushen är deklarativ och varnade i detta pass att AUTH_SMTP_PASS är unset — den hade kunnat riva stagings custom SMTP. Ta förebild ur API:t före varje skrivning och maskin-diffa 242 fält före/efter; ögonjämförelse räcker inte.

KÄND KANT att bedöma i kortet: mail-mallarna kan möjligen låsas i supabase/config.toml (sektionerna [auth.email.template.*] finns i CLI-scaffolden) — till skillnad från password_hibp_enabled som saknas helt i CLI 2.75.0. Är låsning möjlig är den att föredra framför en ren API-skrivning, eftersom en framtida config push annars återställer dem.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Prods mailer_subjects_* och mailer_templates_* motsvarar stagings svenska uppsättning, utom invite-mallen som TASK-143 äger
- [ ] #2 Varje skrivning är en riktad PATCH med maskinell före/efter-diff av samtliga 242 fält — inga oavsiktliga ändringar
- [ ] #3 Det är utrett och bokfört om mallarna kan låsas i supabase/config.toml; kan de det är de låsta, kan de inte det står skälet i filen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
