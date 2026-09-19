---
id: TASK-452
title: >-
  Fynd: gemensam bilaga visas på matchande event men sändkontrollen kräver
  strikt Event-länk — koden tillåter 400 vid utskick
status: Done
assignee: []
created_date: '2026-09-18 10:41'
updated_date: '2026-09-19 12:40'
labels:
  - fynd
  - ready-for-agent
dependencies: []
references:
  - docs/research/utskicksytan-karta-och-historik-2026-09-18.md
priority: high
ordinal: 793000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`get-event-attachments` visar gemensamma bilagor (Räckvidd = Gemensam, ADR-125) på varje event de matchar via `matcharEvent`. `resolveAttachments` i `supabase/functions/send-action-email/index.ts:304–305` har ingen Gemensam-gren: `linkedIds(record.fields['Event']).includes(eventId)` annars 400 "does not belong to event". En gemensam bilaga vald på ett annat event än ursprungseventet — eller en genuint event-lös gemensam bilaga (som `delete-attachment/index.ts:202` räknar med) — fälls därför vid sändning. Inget test täcker skarven (enda träffen i send-action-email.test.ts:1209 gäller en annan regression). Om det HÄNDER i prod är en hypotes: det beror på datan.

Hittat av S127 (P2 + orkestrerarens stickprov). Bär direkt på bilagor i svepet: en gemensam bilaga är den naturliga bulk-bilagan.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Staging-prov: gemensam bilaga bifogad på icke-ursprungsevent via åtgärdssidan — utfallet (200 eller 400) dokumenterat med request-id
- [x] #2 Om 400: rött-först-test, sedan sändkontrollen använder samma räckviddsmatchning som get-event-attachments (_shared/rackvidd-matchning.ts) — fail-closed behålls för bilagor som INTE matchar
- [x] #3 Om 200: kortet stängs med förklaringen varför koden ändå släpper, och ett test som låser beteendet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC #1 (staging-prov, 2026-09-18): riktig round-trip via Åtgärdssidan (npm run dev mot .env.development, som redan pekar på staging pqtshyierkdgwdnxuirz), sentinel-mottagare delivered@resend.dev. Fixtur: Bilagor-rad Gemensam/Kursfamilj Fjärrskådning uppladdad mot event rec1VuPVUPH7a3bq7 (Falköping), skickad från Åtgärdssidan för event recDUMxyXI8hFHOg3 (annan Falköping-Fjärrskådning-instans). Utfall: HTTP 400 {"error":"Attachment recXGGchXXsckJtWT does not belong to event recDUMxyXI8hFHOg3"}, sb-request-id 01a0b434-854c-74c7-9f86-04b76a4b2149. Fixturerna raderade direkt efter provet.

AC #2 (400-grenen): rött-först via tests/api/rackvidd-matchning.test.ts — 9 nya tester för farBilaganSkickasForEvent/lasBilagansRackvidd/lasEventetsAxlar; en temporär nedgradering av implementationen (bara bilagansEventIds.includes(eventId)) fällde exakt de två TASK-452-fixande testerna, övriga fail-closed-tester förblev gröna — reverterat, alla 44 gröna igen. Fixen: send-action-email prövar nu farBilaganSkickasForEvent (delad, _shared/rackvidd-matchning.ts), SAMMA matcharEvent som get-event-attachments använder. get-event-attachments/index.ts refaktorerad till samma delade helpers (lasBilagansRackvidd/lasEventetsAxlar) i stället för sina lokala kopior — motivet är fyndet självt: två oberoende kopior av samma läsning hade redan hunnit divergera en gång.

Andra fyndet UNDER bygget (utanför kortets ordalydelse men blockerande + tätt kopplat, hanterat i samma skiva per ADR-053-triage): med bara ägarskaps-checken fixad gav send-action-email 500 Internal error i stället för 200 — makeRealAttachmentReader byggde Storage-läsvägen ur det SÄNDANDE eventets ID, inte bilagans EGET lagringsankare (buildStorageAnchor). Fixat genom att ResolvedAttachment nu bär anchor (beräknat i resolveAttachments, samma formel delete-attachment redan använder för samma rad); readern läser ${a.anchor}/${lagringsnyckel} i stället för ${eventId}/${lagringsnyckel}.

Ny staging-regressionssvit: tests/api/send-action-email-gemensam-bilaga.staging.test.ts (2 fall — positiv cross-event-sändning 200 sent, fail-closed 400 för en icke-Gemensam bilaga). Körd mot deployad EF FÖRE fixen (400, sedan efter ägarskaps-fixen 500) och EFTER båda fixarna (200/400 enligt förväntan).

Staging-deploy: send-action-email OCH get-event-attachments deployade till pqtshyierkdgwdnxuirz (supabase functions deploy --project-ref pqtshyierkdgwdnxuirz --use-api). get-event-attachments.staging.test.ts 13/13 grönt mot den redeployade EF:en (ren refaktor, ingen beteendeändring). PROD-deploy (fas4, scripts/fas4-prod-deploy.sh) är EJ gjord — Marcus-moment efter landning, per uppdraget. AC #3 (Om 200) är INTE TILLÄMPLIG — utfallet var 400, AC #2:s gren gäller.

Staging-fixturer städade: de två manuellt skapade posterna (Bilagor + Anmälan) för AC #1-provet raderade direkt efter mätningen. De kastbara create-event/create-registration-posterna som testkörningarna skapade är svepta via npm run purge:staging:efter (26 raderade, 9 länk-guardade kvar — de bär en Anmälan-länk och kräver att den också städas, samma accepterade norm som create-registration.staging.test.ts redan bär, ADR-060). Observerad, orelaterad flake i test:api under detta arbete: cancel-registration.staging.test.ts och send-registration-confirmation.staging.test.ts föll båda på samma get-registrations-anrop (Request context disposed) — rör inte attachments/send-action-email, ej reproducerat av min diff.

## Stangningsbeslut AC3 (S127 stangningsbatch, 2026-09-19)

AC3 ('Om 200: ...') galler en gren som aldrig intraffade - staging-provet (AC1) gav 400, inte 200, sa AC2:s gren ar den som tillampas (redan bockad och bevisad: rott-forst 9 nya tester, 44/44 grona efter fix). AC3 bockas har som ICKE TILLAMPLIG - villkoret for grenen (svaret 200) uppstod aldrig. Detta star redan explicit i kortets Implementation Notes sedan bygget (2026-09-18).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landat: PR #2538, merge cdd1856b (2026-09-18T12:26:06Z, main). Staging-provet (AC1) gav HTTP 400 (request-id 01a0b434-854c-74c7-9f86-04b76a4b2149) for en gemensam bilaga bifogad pa icke-ursprungsevent. Fix (AC2): send-action-emails resolveAttachments anvander nu farBilaganSkickasForEvent (delad, _shared/rackvidd-matchning.ts), samma matcharEvent som get-event-attachments - rott-forst 9 nya tester i tests/api/rackvidd-matchning.test.ts, 44/44 grona efter fix. Andra fyndet under bygget (samma skiva, ADR-053-triage): makeRealAttachmentReader byggde Storage-vagen ur SANDANDE eventets ID i stallet for bilagans eget lagringsanker - fixat via ResolvedAttachment.anchor. AC3 (Om 200) bockas som ICKE TILLAMPLIG - utfallet var 400, ej 200. Staging-deploy (send-action-email + get-event-attachments) gjord under bygget. PROD-deploy (fas4) bekraftad genomford av Marcus 2026-09-19 08:57-09:02Z (send-action-email UPDATED_AT 08:59:43, get-event-attachments UPDATED_AT 08:59:14 - kalla: sessionsdok S127 Del 8, alla 57 EF barande farsk UPDATED_AT, katalogen aterlankad till staging). Grindar (matt): typecheck exit 0; biome exit 0; build exit 0; test:api 2326 passed/2 failed (tva orelaterade, forbefintliga staging-timeouts, ej denna diff); rackvidd-matchning.test.ts 44/44 och send-action-email.test.ts 59/59 (api-pure); tva nya staging-regressionssviter grona (2/2 och 13/13). CI-rott ratt under bygget (biome print-width-fel, atgardat, 4adadc8d). Granskning: risk HOG (auth-andring pa skarp mail-sandvag), runda 1, Marcus GO efter granskning.
<!-- SECTION:FINAL_SUMMARY:END -->
