---
id: TASK-127.1
title: 'Skiva: ADR-paret — invite-/identitetsmodellen + auth-faktor-strategin'
status: To Do
assignee: []
created_date: '2026-08-02 14:32'
labels:
  - ready-for-agent
dependencies: []
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
- [ ] #1 Båda ADR:erna följer repots ADR-form och citerar S95 Del 2 + research-underlaget
- [ ] #2 Säkerhetsspecens föråldrade passkey-avsnitt ersatt med pekare till auth-faktor-ADR:n — gamla planen öppet riven, inte tyst
- [ ] #3 ADR-nummer disk-verifierade i mintings-ögonblicket (parallell session mintar också)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Prototyp-pass (tvåfas, T66-formen) Marcus-godkänt FÖRE login- och accept-skivornas bygge
- [ ] #6 Rundturs-e2e (inbjudan → accept → inloggning) grön mot staging före kortets Done
- [ ] #7 Ingen skarp inbjudan till Roger/Lotta före login-omskrivningen är landad och DMARC-posten satt
<!-- DOD:END -->
