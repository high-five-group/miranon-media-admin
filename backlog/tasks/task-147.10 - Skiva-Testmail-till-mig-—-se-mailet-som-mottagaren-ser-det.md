---
id: TASK-147.10
title: 'Skiva: Testmail till mig — se mailet som mottagaren ser det'
status: In Progress
assignee: []
created_date: '2026-08-10 07:40'
updated_date: '2026-08-10 14:03'
labels:
  - ready-for-agent
dependencies:
  - TASK-147.1
parent_task_id: TASK-147
priority: high
ordinal: 348000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lottas (och Marcus) trygghetsbehov, S102 2026-08-10: före ett skarpt utskick vill avsändaren se det FAKTISKA renderade mailet i sin egen inkorg — avsändare, Reply-To, ämne, platshållare ifyllda — inte bara klient-preview. Branschstandard i varje professionellt mailverktyg.

Bygget: 'Skicka test till mig'-knapp i åtgärdssidans granskningsläge → sänder det renderade utskicket (platshållare fyllda ur FÖRSTA mottagaren i urvalet, tydligt märkt TEST i ämnesraden) till den INLOGGADE användarens adress via 147.1:s singelsändningsväg. Ingen mottagare i urvalet berörs. T53-trådens options-rymd avgjord: väg C, legitimerad av ADR-067-revisionen (147.1) — revisionen ska uttryckligen rymma test-sändvägen.

OBS FORM: granskningsläget är facit-låst (s93-atgardssida-promovering). Knappen är ett form-DELTA → Marcus omgodkännande-stämpel på den utökade granskningsytan krävs (samma mönster som eventsidans omstämpling, ADR-104-kanalen).

Täcker: förlängning av användarberättelse 9; T53.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Testmail landar i inloggad användares inkorg med korrekt avsändare/Reply-To, TEST-märkt ämne och ifyllda platshållare
- [x] #2 Ingen adress ur urvalet kontaktas av testvägen — bevisat i test
- [ ] #3 Granskningsytans utökade form Marcus-omstämplad (ADR-104-kanalen)
- [x] #4 T53-tråden stängd med pekare hit
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
EF-ändring: JA. supabase/functions/_shared/send-action-email.ts fick en ny exporterad runActionTestSend (testgrenens orkestrator; dess deps bär ENDAST { sender } — ingen ActionFieldWriter, så en fält-skrivning är strukturellt omöjlig, inte bara oanvänd). supabase/functions/send-action-email/index.ts grenar på body.testSend === true: EN mottagare (första registrationId i urvalet, ENDAST platshållardata läses ur den), adressen mailet faktiskt går till är ALLTID user.email (requireUser, aldrig klientburen, aldrig registreringens egen adress). DEPLOY-SKULD (ADR-050): EF:en är deployad till STAGING sedan tidigare (147.1; S102-sessionsdoket rad ~130), men DENNA kodändring är INTE omdeployad ännu — kräver en manuell staging-redeploy innan testSend-grenen är levande där. Samtliga tester (api-pure, acceptance, e2e) mockar nätverket och är opåverkade av deploy-läget.

ARIA-DELTA (facit-låst granskningsläge, tasks/sessions/bilagor/s93-atgardssida-promovering/facit.json, redan Marcus-godkänt "godkänner" 2026-08-09 för v1): EXAKT +1 rad i VARDERA av tests/visual/__aria__/atgardssida-promoverings-grind.spec.ts/atgarder-granskning-visual-desktop.aria.yml och -mobile.aria.yml — `- button "Skicka test till mig"` införd mellan Utskicket-regionen och switchen "Bekräfta utskicket". Noll aria-diff utanför granskningsläget (git status verifierat mot hela __aria__-katalogen). Negativ kontroll körd: en injicerad felaktig rad fick grinden att FALLA (bevisat att grinden fortfarande fångar en äkta regression), reverterad innan commit. AC #3 (Marcus omgodkännande-stämpel på denna utökade granskningsyta, ADR-104-kanalen) står därför ÖPPEN — kortet lämnas In Progress, inte Done.

T53-trådstängning (AC #4): tasks/threads/T53-test-till-sig-sjalv-skicka.md Tillstånd paused → closed (väg C byggd, arkitekturfrågan besvarad — kortets EGEN Done-flipp är separat, orkestrator-ägd). tasks/threads/README.md indexraden uppdaterad till samma status + pekare.

Grindar (mätta, exitkoder separat lästa — aldrig genom pipe): npm run typecheck exit 0 · npx @biomejs/biome check . exit 0 (endast förbefintliga varningar/infos i base.css/test-bas.ts, ovidrörda av denna skiva) · npm run build exit 0 · npm run test:api 545 passed. Nya/ändrade sviter: tests/api/send-action-email.test.ts § runActionTestSend 31/31 (varav 9 nya testmail-fall) · tests/acceptance/atgarder-testmail-send.acceptance.test.ts 4/4 (ny fil, MSW-mockad) · tests/e2e/atgarder-testmail.staging.test.ts (ny fil, page.route-mockad — LOKALT EJ KÖRT: port 5173 bär en levande Marcus dev-server-process, PID 50138, lsof-verifierat; endast typecheck+biome-verifierad per 147.2-precedentet, skarp körning betalas av PR-CI) · regressionskörning: tests/acceptance/atgarder-bekraftelsemail-send.acceptance.test.ts + atgarder-paminnelse-eventinfo-fritt-send.acceptance.test.ts 6/6 · tests/visual/atgardssida-promoverings-grind.spec.ts 40/40 (visual-desktop + visual-mobile).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
