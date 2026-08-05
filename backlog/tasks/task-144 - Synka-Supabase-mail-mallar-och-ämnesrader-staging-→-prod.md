---
id: TASK-144
title: Synka Supabase mail-mallar och ämnesrader staging → prod
status: Done
assignee: []
created_date: '2026-08-05 15:27'
updated_date: '2026-08-05 16:44'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AVGRÄNSNINGEN RÄTTAD 2026-08-05 (orkestreraren, efter fångst av TASK-143:s bygg-agent).

Beskrivningens stycke 'AVGRÄNSNING MOT TASK-143' är FELAKTIGT som det står och ersätts av detta. Felet var mitt: jag skrev att invite-mallen 'följer med TASK-143', men instruerade samtidigt TASK-143:s agent att INTE röra prod-mallarna. Ingen ägde därmed invite-mallens väg till miljöerna.

MÄTT EFTER ATT TASK-143 LEVERERADE (PR #800):
- supabase/templates/invite.html ÄR uppdaterad i repot (bär nu namn + inbjudare)
- prods mailer_subjects_invite är fortfarande 'You have been invited' — agenten pushade medvetet ingenting, vilket var rätt beslut av den

RÄTT AVGRÄNSNING, som den ska läsas:
- TASK-143 äger mallens INNEHÅLL (filen i git). Levererad.
- TASK-144 (detta kort) äger mallarnas DEPLOYMENT till staging och prod — INKLUSIVE invite-mallen, inte bara recovery och övriga mailer_*-fält.

Dependencyn på TASK-143 står kvar och är fortfarande rätt: innehållet måste finnas i git före det deployas. Men skälet är inte längre 'annars skrivs invite-mallen över två gånger' — det är 'annars deployas en mall som inte bär namnet än'.

KÄLLÄGE, bokfört öppet: agenten sökte igenom samtliga tasks/sessions/*.md efter belägg för citatet 'Marcus beslut 2026-08-05 (väg 2)' och hittade inget — korrekt, eftersom beslutet fattades i chatten EFTER att sessionsdokets Del 12 skrevs. Beslutet är nu bokfört i Del 13. Att agenten behandlade det obelagda citatet som HYPOTES och inte byggde vidare på det är ADR-086 i praktiken.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
STÄNGD 2026-08-05 (S96 femte resumen) efter CI-verifiering av PR #805 (merge-commit a2aa4762).

LEVERERAT: prods mailer_subjects_invite/recovery och motsvarande templates_content matchar nu stagings svenska innehåll byte-för-byte. En inbjudan eller lösenordsåterställning från prod kommer inte längre på engelska med Supabase-standardtext.

KORTETS EGEN PREMISS RÄTTAD AV BYGGET: kortet (jag skrev det) angav '~20 fält skiljer'. Faktisk mätning: 28. Viktigare är den kvalitativa rättelsen — av 13 malltyper är endast invite och recovery genuint svenska på staging. De övriga 11 är engelska på BÅDA miljöerna; skillnaden är bara vilken default-ögonblicksbild som frusit vid projektskapandet. Agenten synkade dem därför INTE, eftersom det hade bytt en engelsk formulering mot en annan och låst fast dem utan värde. Rätt bedömning.

EXTRA FYND, ÅTGÄRDAT I SAMMA SVEP: stagings LIVE invite-mall låg kvar i före-TASK-143-läget, utan display_name/inviter_name. TASK-127.9:s rundtur hade alltså kunnat gå grön mot en mall som saknade det TASK-143 just byggt.

AC #3 BESVARAT: mallarna ÄR redan låsta via [auth.email.template.invite]/[recovery] i config.toml. Bevisat med en config push mot staging med 'n' på prompten ('Remote Auth config is up to date') plus en 242-fälts omkontroll som visade noll ändringar.

VERIFIERINGENS GRÄNS, öppet bokförd: CI kan inte se miljötillstånd. 'Test suite / Staging (API + E2E)' stod SKIPPED på #805 och test:api kördes varken lokalt (agenten avstod medvetet — samma levande staging som TASK-127.9:s parallella e2e, ingen lokal mutex) eller i CI. Diffen bar ingen appkod, så testet hade inget att bevisa. Miljöändringen verifierades i stället av orkestreraren direkt mot Management API efter landningen: prods invite/recovery svenska, och stagings uri_allow_list, SMTP-fält och mailer_otp_exp bekräftat OFÖRÄNDRADE — det senare kritiskt eftersom TASK-127.9 beror på dem.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
