---
id: TASK-18.8
title: 'Skiva: Betalningar (arbetsytan + slutbetalnings-vertikalen)'
status: In Progress
assignee: []
created_date: '2026-07-21 08:20'
updated_date: '2026-07-22 07:58'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.1
parent_task_id: TASK-18
ordinal: 54000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Betalningskortet visar röda saknas-deltan (minustecknet bär) och Öppna detaljer öppnar inline-arbetsytan: flikar i kapselform, deadline som status-badge, EN linje per betalning med eget kryss, notering per betalning, Påminn-mailikon per obetald linje med betalningen i ämnesraden och tyst påminnelsehistorik under personen; kortets deltan och grupper härleds live ur kryssen. NY operation för slutbetalning (anmälningsavgiften har sin befintliga). Per-betalnings-notering och påminnelselogg löses I BASEN additivt — vägvalet additiva fält kontra maillogg-härledning låses i skivan efter bas-verifiering, öppet bokfört. DEADLINE-REGELN LÅST (Marcus 2026-07-21): slutbetalningen förfaller 14 dagar före eventets startdatum — härleds ur startdatum, inget nytt bas-fält. Täcker användarberättelser: 19-23 (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Slutbetalnings- och noterings-operationerna kontraktstestade: deny-by-default, otillåtet fält fälls, teardown
- [x] #2 Deadline-badgen visar start-minus-14-dagar-regeln; deltan och grupperna härleds live bevisat i e2e
- [x] #3 Påminnelse-vägvalet (additiva fält kontra maillogg-härledning) bokfört öppet i skivan före implementation
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC #3 — PÅMINNELSE-VÄGVALET LÅST (öppet bokfört FÖRE implementation, efter bas-verifiering 2026-07-22): ADDITIVA FÄLT, inte maillogg-härledning. Bas-verifiering live (staging apphjj8Q7lkXCMsL4, describe_table tbloOcrppVoyrHbrq + get-mail-log-källan Utskickslogg tblIesjbuSWNp6oxK): (1) Utskickslogg bär BULK-segment-utskick med Personer-länkar ('Skickat till') — ingen anmälnings- eller betalnings-attribution finns, och en per-betalnings-påminnelse via Lottas mailklient (basens befintliga mailto-formelfält 'Skicka betalningspåminnelse' fldbQ7L6gXslLckG1 — dagens verkliga väg) landar ALDRIG i Utskickslogg → härledningen kan inte ens observera händelsen; vägen är strukturellt omöjlig, inte bara obekväm. (2) Basens etablerade grammatik för utskicks-spårning är per-händelse-'senaste'-tidsstämplar på Anmälningar (Bekräftelse skickad fld0jnbkIbuFAumgG · Betalningspåminnelse skickad fldE0cR4r9vI0rKiL · Deltagarinfo skickad fld3WBS0QQrqLpYtK) — additiva per-betalnings-fält följer basens egen form (ADR-063: resolution I BASEN). BESLUT: fyra additiva fält på Anmälningar, ENDAST staging (DoD #7): 'Notering anmälningsavgift' + 'Notering slutbetalning' (multilineText) · 'Påminnelse anmälningsavgift skickad' + 'Påminnelse slutbetalning skickad' (dateTime, local/24h/client — samma options som fldE0cR4r9vI0rKiL). Befintliga 'Notering' och 'Betalningspåminnelse skickad' RÖRS INTE (odelad historik kvarstår läsbar; ev. migrering = bas-maximeringen T16, inte denna skiva). Historikens semantik: SENASTE påminnelse per betalning (basens tidsstämpel-grammatik), inte obegränsad logg — facit visar max en rad per betalning. DEADLINE-REGELN: härleds i klienten ur startdatum (start − 14 d, Marcus-låst) — basen bär redan samma regel i formeln 'Deadline slutbetalning' fldGlznON7xqR3IE1 (DATEADD(Startdatum, -14, 'days')), vilket BEKRÄFTAR regeln; inget nytt bas-fält. (Bifynd: formelns Ej relevant-gren jämför mot 'Ej relevant' men optionen heter 'Ej relevant (för föreläsningar)' — grenen matchar aldrig; T16-klass, rapporteras som fynd, fixas inte här.)

väntar design-review (S75-batchen v2). LEVERANS (task/18.8): Betalningar-gruppen med inline-ARBETSYTAN (K27–K34) ersätter interim-raderna OCH den gamla betalnings-vyn — route /event/$eventId/betalning + RegistrationsList/MarkPaidButton/useMarkRegistrationPaid RIVNA (K27: Marcus 'stanna på samma sida'; PRD-testbeslutet: e2e-flödet omskrivet i samma skiva som ersätter ytan — mark-paid-filen är nu arbetsytans svit). Kortet: räknerader med röda saknas-deltan (minustecknet bär, −N endast vid avvikelse) LIVE-härledda ur anmälnings-cachen (ej event-aggregaten); disclosure med aria-expanded/controls. Arbetsytan: flikar i familje-kapseln (ToggleButtonGroup sm/spread, räknarna följer kryssen live) · deadline-STATUS-BADGEN (start − 14-regeln LÅST — basens formel fldGlznON7xqR3IE1 bär samma regel, bekräftad) · EN linje per betalning (kryss rå-RAC Checkbox [primitiv saknas = prototypens precedent], obetald etikett röd fetstil, notering per betalning med blur-commit, Påminn-mailikon ENDAST obetalda linjer med betalningen i ämnesraden [mailto — basens egen påminnelse-väg fldbQ7L6gXslLckG1; klicket antecknar tidsstämpeln i betalningens additiva fält]) · tyst påminnelsehistorik per person (senaste per betalning, DAGMANAD). TRE nya operationer i allowlist-SSOT: mark-final-payment-paid ['Slutbetalning'] · update-registration-payment-note [de två additiva noteringsfälten] · log-payment-reminder [de två additiva tidsstämpelfälten] — gamla odelade Notering/Betalningspåminnelse skickad MEDVETET utanför listorna (deny-bevisat). BAS (ENDAST staging apphjj8Q7lkXCMsL4, additivt, DoD #7): Anmälningar +4 fält — 'Notering anmälningsavgift' fldy4fFMx0iOjZVpi · 'Notering slutbetalning' fldQIV1mOyjTtJWDn (multilineText) · 'Påminnelse anmälningsavgift skickad' fldohZk9EAp59XbMf · 'Påminnelse slutbetalning skickad' fld49lOLga7U0WWYR (dateTime local/24h/client); prod ORÖRD. Läs-shapen: get-registrations +4 fält; RegistrationSchema/Registration ADDITIVT-optional (18.2:s Event-form — äldre mockar parsar oförändrat). ÖPPET BOKFÖRDA SKIV-BESLUT: (1) 'Ej relevant (för föreläsningar)'-slutbetalning renderas som stilla textrad UTAN kryss/notering/påminn och räknas som klar — ett kryss vore en lögn (av-bock hade rivit basens semantik); facit-demon saknade fallet. (2) Aktiv-filtret speglar basens 'Är aktiv' (endast Avbokad/Ombokad bort). (3) Påminnelse-tidsstämpelns semantik = när påminnelsen initierades från appen (mailto-klicket; klientens sändning kan inte observeras) — framtida server-send (18.6:s EF-mönster) kan ersätta mailto utan fält-ändring. (4) Åtgärds-gruppens rader 'Skicka betalningspåminnelse till obetalda' + 'Markera alla obetalda som betalda' STÅR KVAR aria-disabled: 18.3-notens 'kopplas i 18.8' täcks INTE av detta korts spec/AC (bulk-vertikaler med kontrollfråga per PRD beslut 7/20) — rapporterat som fynd till orkestratorn, inte tyst scope-utvidgning. DESIGN-DEFEKT FÅNGAD AV E2E UNDER KÖRNING (1): per-rad-felytan försvann vid optimistisk flik-flytt (raden avmonteras) → mutations-instanserna lyfta till arbetsyte-nivån, felytan (MessageBox role=alert + Fel-ID) överlever rollback — fel-vägs-testet bevisar. Grindar: biome 0 · typecheck 0 · test:api 313/313 (+6 nya, rött→grönt över EF-deployen: 6 röda före → gröna efter) · build grön · e2e mark-paid 13/13 (omskriven svit) + angränsande (event-detail/anmalda/narvaro/add-registration/shell) 57/57. EF:er deployade ENDAST staging (pqtshyierkdgwdnxuirz): update-record + get-registrations; EJ i .prod-functions-allowlist.conf-ändring (prod-tillägg = separat Marcus-handling). AVVIKELSE (TDD): api-skarven rött-först bevisad; e2e-skarven skrevs test-först mot färdig komponentdesign men rött utfall observerades inte före UI-bygget (18.1/18.2-klassens kostnadsavvägning) — dock fällde e2e-sviten 3 tester i första körningen varav 1 avslöjade den verkliga felyte-defekten ovan (skarven bevisade sitt värde). Facit-avprickningen (DoD #6): renderade skärmdumpar 390×844 (kortet stängt · arbetsytan öppen · helsida) mot FACIT-betalningar-arbetsytan.png — deltan/flikar/badge/linjer/notering/påminn/historik prickade av (badge-texten 'Deadline passerad · 17 juli' identisk med facit-läget); computed-style-assertions i e2e (delta- och badge-färg mot --mm-error-token, U+2212-minustecknet). Dumparna i batch-scratchpaden 18.8-*.png.

AFK-halt (S75 v2): PR-CI rött (run 29875779970, PR #76): (1) audit-ci — GHSA-f88m-g3jw-g9cj (sharp inherited vulnerabilities in libvips: CVE-2026-33327/33328/35590/35591) via vite-plugin-pwa>@vite-pwa/assets-generator>sharp, ej i allowlist — ny advisory, orelaterad till branchens diff; (2) E2E staging 3 failed i tests/e2e/mark-paid.staging.test.ts (deadline-badgen start-minus-14 AC #2 toHaveText; Saknar-återflytt toBeVisible element not found; delta-avgifter −3-mismatch), 200 passed. Kod-/config-fix utanför merge-agentens mandat — halt-first. Branch task/18.8 + PR #76 kvarstår för åtgärd.

Studs-åtgärden (S75): tre testdesign-fixar per diagnosen (TZ-förankringen Europe/Stockholm ×2 + gate-mönstret för av-bock-racet); TZ-bevis + race-bevis 10/10 i retur

Studs-åtgärd 2 (S75): scenario-isoleringen läkt med distinkta eventId per scenario (persist-hydrerings-mekanismen, diagnos-runda 2 trippelbevisad; även grann-testets latenta instans); determinism-bevis 3/3 + 20/20
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S73-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [x] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [x] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
