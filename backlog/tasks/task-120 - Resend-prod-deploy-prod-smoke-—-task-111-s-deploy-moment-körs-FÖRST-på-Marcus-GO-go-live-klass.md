---
id: TASK-120
title: >-
  Resend prod-deploy + prod-smoke — task-111:s deploy-moment, körs FÖRST på
  Marcus GO (go-live-klass)
status: To Do
assignee: []
created_date: '2026-08-02 07:51'
labels: []
dependencies: []
priority: medium
ordinal: 192000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GATE: Plockas INTE av AFK-batch — körs först på uttryckligt Marcus GO (beslutsbordet S91 punkt 1, 2026-08-02: appen är inte live, inga skarpa utskick sker; deployen väntar till go-live). Kortet bär avsiktligt INGEN ready-etikett — Marcus GO = etiketten sätts.

VAD: prod kör fortfarande pre-resend@6-deployen (senaste prod-synk T39, 2026-07-24). task-111 bytte SDK-importen till esm.sh/resend@6 i send-email + send-registration-confirmation, vilket gör permissive batch-validation GENUINT aktiv (headern x-batch-validation sätts av SDK:n). Källkoden är landad och CI-verifierad — utan denna deploy kör prod strict-semantik: en ogiltig rad fäller hela batchen.

FORM (ur task-111 § Kvarvarande):
bash scripts/deploy-prod-functions.sh --list   # verifiera deploy-set först
scoped: ALLOWLIST_FILE=temp-fil-med-endast-de-2 bash scripts/deploy-prod-functions.sh --project-ref prod-ref
ELLER kanoniska full-allowlist-formen (tillåten sedan T39 stängd 2026-07-24).
Efter deploy: prod-smoke per T39-runbook-mönstret INNAN Lotta skickar ett skarpt utskick som förlitar sig på permissive-läget.

KÄLLA: task-111 (AC 1–4 avbockade, Done 2026-08-02) — hela underbyggnaden bor där.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus GO dokumenterat på kortet INNAN deployen körs (go-live-beslutet är hans)
- [ ] #2 Deploy-set verifierat med --list före körning; deployen körd med scoped eller kanonisk form
- [ ] #3 Prod-smoke grön efter deploy för båda EF:erna (T39-runbook-mönstret), utfall bokfört
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
