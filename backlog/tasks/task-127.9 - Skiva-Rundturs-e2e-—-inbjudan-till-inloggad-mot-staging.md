---
id: TASK-127.9
title: 'Skiva: Rundturs-e2e — inbjudan till inloggad, mot staging'
status: To Do
assignee: []
created_date: '2026-08-02 14:33'
updated_date: '2026-08-05 19:13'
labels:
  - ready-for-agent
dependencies:
  - TASK-127.3
  - TASK-127.5
  - TASK-127.6
parent_task_id: TASK-127
ordinal: 213000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ETT staging-e2e-flöde bevisar hela kedjan ände till ände: inbjudan utlöses via EF:en, mail-länken konsumeras, accept-sidan sätter lösenord, inloggning sker på nya login-vyn och en autentiserad vy nås. En rundtur — inte många. Testanvändaren skapas och rivs av flödet självt.

Täcker användarberättelser: 2, 13.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rundturen grön i den autentiserade staging-e2e-skarven
- [ ] #2 Flödet skapar och river sin egen testanvändare — inga rester i staging
- [ ] #3 Marcus-förkraven (OTP-livslängd 24 h, SMTP kopplad, redirect-mål registrerade) dokumenterade och avbockade före körning
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Fas 7-beroendet — bokfört 2026-08-05 (S96), Marcus-kvitterat

**AC #1 kan inte bli grön förrän Fas 7 landar.** Det är INTE enbart
service-role-luckan som blockerar, vilket kortet tidigare antog.

Research-passet `docs/research/auth-invite-e2e-service-role-branschprecedent-2026-08-05.md`
§8 hittade att repot redan bär ett daterat, Marcus-beslutat svar på
redirect-domän-mismatchen (`admin.miranon.dev` mot CI:s `localhost:5173`) —
`tests/e2e/auth-flow.staging.test.ts` rad 24–31, skrivet vid K4.2 (Session 5):

> "När Fas 7 etablerar Vercel-deployment-pipeline ska samma test-suite
> kompletteras att köra mot Vercel preview-URL via `PLAYWRIGHT_TEST_BASE_URL`-
> env i CI-steget ... Per Marcus' beslut (Session 5, post-K4.2) flyttas
> Vercel-aktivering INTE hit; den är Fas 7-arbete per fas-disciplin-policy."

`ci-suite.yml` rad 277–279 och 493–495 bekräftar att `PLAYWRIGHT_TEST_BASE_URL`
medvetet lämnas osatt idag. Frontend-reachability har alltså varit en separat,
redan schemalagd förutsättning i tolv sessioner — den är ingen ny eftersläpning
och inget som ska lösas inom detta kort.

## Vad som byggs nu i stället

Marcus kvitterade 2026-08-05 research-passets rekommendation (Väg A):
en staging-only Edge Function `test-invite-completion` bakom `ADMIN_EMAILS`,
medvetet utelämnad ur `.prod-functions-allowlist.conf` (`test-auth`-
precedenten), som exponerar `generateLink` + `deleteUser` för en admin-JWT-
anropare. Noll nya CI-hemligheter — service-role är redan EF-runtime-intern.

Precedenten är läst i mergad kod, inte i blogginlägg: Ghost (PR #21637,
DB-token-läsning), cal.com (Prisma-läsning i `forgot-password.e2e.ts`, explicit
kallad "workaround"; `getInviteLink` ur API-svarskroppen) och twenty (PR #9332,
clipboard). Samtliga kortar mail-hoppet och kör resten av UI-kedjan skarpt.
Ingen av 6+ granskade projekt läser en riktig mailbox i CI.

Det gör mekanismen redo att koppla in samma dag Vercel-pipen landar — men det
gör inte AC #1 grön.

## Ärlig status tills dess

AC #1 och #2 vilar på Väg B: manuell verifiering, redan utförd en gång med
städning (se `docs/research/task-127-9-rundtur-e2e-service-role-blocker-2026-08-05.md`).
Kortet stängs INTE av EF-bygget.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
