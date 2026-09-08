---
id: TASK-435
title: >-
  Riv betalningsblocket från åtgärdssidan — sektionen grupp-betalningar,
  BetalningsSkrivYta-familjen, fyra testfiler och bokföringen
status: To Do
assignee: []
created_date: '2026-09-08 02:20'
labels:
  - ready-for-agent
dependencies: []
ordinal: 762000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus beslut 2026-09-08 (S124): "Jag är helt säker på att jag vill riva betalningsblocket helt från åtgärdssidan." Betalningar hanteras på betalningssidan (inkorg + bekräftelsesteg, PRD TASK-402); noteringar skrivs i registreringsformuläret till `inbetalningar.notering` (Marcus dom 2026-09-01, `src/components/betalningar/RegistreraForm.tsx` docblock § NOTERINGSFÄLTET). Basens två noteringsfält (`Notering anmälningsavgift` fldf60miCtMuP45WO / `Notering slutbetalning` fldJyDlJWudYwBdxi) har NOLL innehåll i prod — mätt 2026-09-08 read-only via claude.ai-connectorn, filter isNotEmpty → 0 poster. Matarknappen "Registrera inbetalning för N markerade" (TASK-402.5) försvinner med blocket; Marcus accepterade förlusten 2026-09-08 (inkorgen har markeringsläge grupperat per event). Flaggan `VITE_FEATURE_BETALNINGAR` är PÅ i prod via Vercel (verifierat `vercel env ls production` 2026-09-08) — båda grenarna rivs.

KARTA (kartläggnings-agent S124, varje symbol grep:ad över hela filen/repot; radnummer mot `a0320b33`, verifiera mot din checkout):
- `src/components/events/atgarder/AtgardsSida.tsx`: skrivytan rad 1069–1676 (SkrivKryss, SkickaKvittoKnapp, SkrivRad, NoteringsFalt, BetalningsSkrivYta + docblock), sektionen `aria-labelledby="grupp-betalningar"` rad 3205–3346 (inkl. TASK-402.5-knappen 3274–3289 och TASK-432-wrappern), döda hjälpare `anmalningsIdsCsv` 2934–2949, `useNavigate` 2957, `betalningarOppna` 2985, `betalningsPanelId` 2991; döda imports: idagIso, harledRad/InkorgsRad, PanelBetalningar, Dialog/DialogTrigger, Modal, Select/SelectItem, useOppnaBetalningar, useSendReceipt, useSetPaymentStatus/useUpdatePaymentNote/BETALNING_LABEL/Betalning, BETALSATT_VARDEN/Betalsatt, arAktivAnmalan, alertScreenReader, betalningarPa, Upload-ikonen.
- STÅR KVAR (används utanför zonen): `obetald`/`obekraftad` (mottagar-seedning rad 3034), `saknarAnmalningsavgift`/`saknarSlutbetalning` (BetalRader rad 650–651 i plockaren), `KORT_KLASS`, Checkbox, Check, MessageBox, Input, TextArea, PaymentStatus, CircleCheck, MailCheck, History, Inbox, ChevronDown, SlideToConfirm, formatMB.
- Utanför filen utan konsument efter rivningen: `src/components/betalningar/PanelBetalningar.tsx` (noll andra importörer), `useSetPaymentStatus`/`useUpdatePaymentNote` i `src/data/mutations/registrationPayments.ts` (BETALNING_LABEL/`Betalning` KVAR — används av `detail/Betalningar.tsx`), `useSendReceipt`-kedjan (`receipts.ts` → `AirtableAdapter.sendReceipt` → `SendReceipt.schema.ts`). EF:er rörs INTE (serverspår).
- Tester: RADERAS `tests/e2e/atgarder-betalningar.staging.test.ts`, `tests/e2e/atgarder-kvitto.staging.test.ts`, `tests/acceptance/atgarder-kvitto-send.acceptance.test.ts`. FLYTTAS `tests/acceptance/atgarder-betalningsnotering-logg.acceptance.test.ts` — integritetsgarantin (fritext läcker aldrig in i aktivitetsloggens payload, S105 Del 2 beslut 2) gäller registreringsformulärets notering lika mycket; skriv om testet mot `RegistreraForm`, stryk det inte. UPPDATERAS `tests/visual/atgardssida-promoverings-grind.spec.ts`: bara testet "betalningspanelen öppen" (rad ~383–394) tas bort; de committade ariaSnapshot-referenserna i `tests/visual/__aria__/` nämner inte betalningar — ingen `--update-snapshots`. FALSKA POSITIVER som INTE rörs: `tests/acceptance/anmalan-detalj.acceptance.test.ts:405` (annan `grupp-betalningar` på AnmalanDetail), `tests/api/update-record.staging.test.ts` (EF-kontraktet), `tests/e2e/betalningar-inkorg-*`, `tests/e2e/mark-paid.staging.test.ts`, `tests/e2e/event-deltagare.staging.test.ts`.
- Bokföring: filhuvudets prosa (rad ~86–90, 125–141, 185–192) trimmas till sanning; `docs/specs/ATGARDSSIDAN-UNDERLAG.md` § 5 får en "SUPERSEDED 2026-09-08"-not; `docs/decisions/ADR-128-*.md` § Updates får post (åtgärdssidans betalningsvertikal riven: betalningssidan äger skrivandet, eventdetaljen läsningen — TASK-436/437/438); ADR-109:s 2026-08-30-uppdatering täcker redan kvitto-delen; korten via backlog-CLI: task-147 (PRD) description får Updates-not om reverseringen av "Betalningarnas skrivvertikal bor här", task-147.9 steg 6–7 skrivs om mot betalningssidan, task-402.5 och task-403 får not "superseded 2026-09-08" (403: AC #1 uppfyllt av beslutet, AC #2 obsolet, AC #3 EF-utökning kvar som eget scope).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Sektionen grupp-betalningar och BetalningsSkrivYta-familjen med döda hjälpare, state och imports är borta ur AtgardsSida.tsx; obetald/obekraftad-seedningen, BetalRader-predikaten och KORT_KLASS står kvar; typecheck och biome 0 fel
- [ ] #2 Klientkod utan konsument efter rivningen (PanelBetalningar.tsx, useSetPaymentStatus/useUpdatePaymentNote, useSendReceipt-kedjan) är borttagen eller bokförd som medvetet kvar med skäl i PR-kroppen; BETALNING_LABEL/Betalning kvar; inga EF:er rörda
- [ ] #3 De tre testfilerna raderade; atgarder-betalningsnotering-logg-testet omskrivet mot RegistreraForm med integritetsgarantin bevarad (rött-först mot en avsiktligt läckande payload bevisat i PR-kroppen); promoverings-grindens betalningspanel-test borttaget, ariaSnapshot-referenserna orörda och gröna
- [ ] #4 Bokföringen gjord: AtgardsSida-filhuvudet trimmat, ATGARDSSIDAN-UNDERLAG § 5 SUPERSEDED-not, ADR-128 § Updates-post, task-147 Updates-not, task-147.9 steg 6–7 omskrivna, task-402.5 och task-403 superseded-noter — korten via backlog-CLI, aldrig direktredigering
- [ ] #5 DoD-kommandona, npm run test:api, visual-grinden och check-langa-streck gröna med faktiska exitkoder i slutrapporten
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
