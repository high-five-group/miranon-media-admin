---
id: TASK-144
title: Synka Supabase mail-mallar och ämnesrader staging → prod
status: To Do
assignee: []
created_date: '2026-08-05 15:27'
updated_date: '2026-08-05 16:23'
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
- [x] #1 Prods mailer_subjects_* och mailer_templates_* motsvarar stagings svenska uppsättning, utom invite-mallen som TASK-143 äger
- [x] #2 Varje skrivning är en riktad PATCH med maskinell före/efter-diff av samtliga 242 fält — inga oavsiktliga ändringar
- [x] #3 Det är utrett och bokfört om mallarna kan låsas i supabase/config.toml; kan de det är de låsta, kan de inte det står skälet i filen
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

LEVERANS 2026-08-05 (bygg-agent). Mätt om mot Management API före design (premiss-pass, ADR-086) — divergens mot kortets '~20 fält' bokförd här:

FAKTISK DIFF (242 fält, båda miljöer, mätt via GET /v1/projects/<ref>/config/auth): 28 mailer_*-fält skiljer, inte ~20. Av 13 mailer-malltyper (confirmation, email_change, email_changed_notification, identity_linked/unlinked_notification, invite, magic_link, mfa_factor_enrolled/unenrolled_notification, password_changed_notification, phone_changed_notification, reauthentication, recovery) är det ENDAST invite+recovery som är genuint varumärkta/svenska på staging (`mailer_*_custom_contents`-flaggan = True bara för dessa två på staging). De övriga 11 är engelska på BÅDA miljöerna — skillnaden där är bara VILKEN default-text-ögonblicksbild som frusit (prod har alla 13 flaggade `custom`=True, dvs frusna vid projektskapandet; staging har bara invite+recovery frusna, resten följer plattformens nuvarande default). Att synka de 11 hade bytt en engelsk formulering mot en annan utan Roger/Lotta-värde — gjordes INTE. Scope: invite+recovery, i linje med vad TASK-127.x faktiskt byggde.

AC#1-avgränsningen är den KORRIGERADE (Implementation Notes ovan) — invite ingår. Extra fynd: stagings invite-mall var själv INAKTUELL (levde kvar i FÖRE-TASK-143-läge utan {{ .Data.display_name }}/{{ .Data.inviter_name }}) — uppdaterad i samma svep.

PATCH:ar (riktade, aldrig `config push` för skrivning):
- staging (pqtshyierkdgwdnxuirz): 1/242 fält — mailer_templates_invite_content → nuvarande git-fil. Verifierat byte-för-byte likhet mot supabase/templates/invite.html efteråt.
- prod (lvjsfnphlauldxqlncpl): 4/242 fält — mailer_subjects_invite, mailer_templates_invite_content, mailer_subjects_recovery, mailer_templates_recovery_content. Verifierat byte-för-byte likhet mot git-filerna efteråt.
Noll oavsiktliga fältändringar i någotdera fallet (fullständig 242-fälts-diff kört, inte stickprov). TASK-127.9:s beroenden (uri_allow_list, SMTP-fälten, mailer_otp_exp) verifierat oförändrade.

AC#3 — LÅSBART, redan låst: [auth.email.template.invite]/[recovery] fanns redan i config.toml (från TASK-127.4/127.7) och matchar nu levande läge exakt. Bevisat, inte antaget: `supabase config push` kört mot staging (indata "n" pipead — aldrig bekräftad, ingen skrivning skedde) svarade 'Remote Auth config is up to date'; en efterkontroll av samtliga 242 fält mot Management API bekräftade att push-anropet inte ändrat något. De 11 ovarumärkta malltyperna är MEDVETET olåsta (se ny kommentar i config.toml) — de bär inget svenskt/varumärkt innehåll att låsa.

Lokala grindar: typecheck/biome/build gröna (ingen appkod ändrad). test:api MEDVETET hoppat — api-staging-projektet slår mot samma levande staging-Supabase som TASK-127.9:s parallella e2e-körning använder just nu; en kollision där ger falska signaler i båda riktningarna utan att verifiera något jag ändrat (noll kodändringar). CI:s api-staging-jobb kör bakom den globala staging-tests-mutexen och är rätt plats för det.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
