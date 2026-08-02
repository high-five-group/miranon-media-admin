---
id: TASK-127.1
title: 'Skiva: ADR-paret — invite-/identitetsmodellen + auth-faktor-strategin'
status: To Do
assignee: []
created_date: '2026-08-02 14:32'
updated_date: '2026-08-02 16:20'
labels:
  - ready-for-agent
dependencies: []
modified_files:
  - docs/decisions/ADR-092-invite-identitetsmodellen-anvandarinbjudan.md
  - docs/decisions/ADR-093-auth-faktor-strategin-losenord-passkey.md
  - docs/decisions/README.md
  - docs/specs/SECURITY-SPEC.md
  - README.md
parent_task_id: TASK-127
ordinal: 205000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Två ADR:er mintas ur S95 Del 2-samsynen: invite-/identitetsmodellen (användarinbjudan via egen admin-grindad EF, roll och e-post låsta av inbjudan, icke-breaking mot framtida medlemsmodell, 24-timmars engångslänk med omskicks-väg) samt auth-faktor-strategin (lösenord enligt ASVS-golvet vid accept, passkey som frivilligt erbjudande efter första inloggningen, TOTP öppet skjuten med trigger). Säkerhetsspecens föråldrade passkey-plan rättas i samma landning. Allt annat i spåret refererar dessa ADR:er — därför först.

Täcker användarberättelser: 10, 14.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Båda ADR:erna följer repots ADR-form och citerar S95 Del 2 + research-underlaget
- [x] #2 Säkerhetsspecens föråldrade passkey-avsnitt ersatt med pekare till auth-faktor-ADR:n — gamla planen öppet riven, inte tyst
- [x] #3 ADR-nummer disk-verifierade i mintings-ögonblicket (parallell session mintar också)
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
ADR-092 (invite-/identitetsmodellen) + ADR-093 (auth-faktor-strategin) mintade, disk-verifierade mot origin/main (0a5984aa, 91 ADR-filer) omedelbart före namngivning — inga kollisioner. Källor citerade: S95 Del 2 (beslut 5/6/7 + § Öppna declines) + S87-spaningen (tasks/sessions/bilagor/s87-spaning/a4-riktig-webbapp-inbjudan.md, ASVS 5.0 V6-citat + Supabase-passkey-beta-verifiering + branschmönster). SECURITY-SPEC.md:s stale 'Passkey-roadmap (Fas 8)' (fel mekanism/domän/gating) öppet riven och ersatt med pekare till ADR-093. Alla tre räkne-ytor synkade: docs/decisions/ADR-*.md (93 filer) + docs/decisions/README.md katalograder + rot-README.md rad 145 ('93 arkitekturbeslut'). npm run check:docs: 13/13 gröna (Vale.Terms-fynd på 'supabase-js' i båda nya filerna självfångat och fixat med backticks, L158-mönstret). typecheck/biome/build gröna (docs-only, ingen kodpåverkan). DoD #3/#5/#6/#7 lämnade obockade: ägs av CI-svansen respektive senare skivor (127.2/127.6/127.8) — inte denna kort.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Prototyp-pass (tvåfas, T66-formen) Marcus-godkänt FÖRE login- och accept-skivornas bygge
- [ ] #6 Rundturs-e2e (inbjudan → accept → inloggning) grön mot staging före kortets Done
- [ ] #7 Ingen skarp inbjudan till Roger/Lotta före login-omskrivningen är landad och DMARC-posten satt
<!-- DOD:END -->
