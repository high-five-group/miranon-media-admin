---
id: TASK-201.15
title: >-
  Skiva: De tre komponent-lokala skrivvägarna in i mutationskatalogen —
  createEvent, segment-mail, saveSegment loggar
status: In Progress
assignee: []
created_date: '2026-08-14 18:29'
updated_date: '2026-08-14 19:14'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-201
ordinal: 399000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus GO 2026-08-14 (S105 Del 9, verbatim: 'INGA genvägar, inga luckor, ingen symptombehandling'). Explore-svepet fann tre useMutation-anrop UTANFÖR src/data/mutations/ som skriver data utan recordActivity: src/components/event/CreateEventForm.tsx:122 (dataSource.createEvent), src/components/segment/SegmentMailCompose.tsx:74 (dataSource.sendEmail), src/components/segment/SegmentBuilder.tsx:91 (dataSource.saveSegment).

ROTORSAKEN är hemvisten, inte bara den saknade loggningen: TASK-201.13:s mekaniska invariant ('varje exporterad mutationshook loggar', mätt 15/15) är mapp-scopad och kan per konstruktion inte se komponent-lokala mutationer. Fixen är EXTRAKTION till katalogen + instrumentering + en mekanisk grind som gör att klassen inte kan återuppstå.

FEATURE-doken (docs/features/FEATURE-ACTIVITY-LOG.md:43-44) kräver loggning för 'Skapa event' och 'skicka manuellt mail'; segment-spar saknas i dess kategoritabell men omfattas av PRD-berättelse 1 ('allt jag gör som ändrar något loggas') — Marcus GO täcker alla tre.

ABSOLUT MAILFÖRBUD: segment-mail-vägen utlöses ALDRIG skarpt; all verifiering mot fixturvärld (MSW).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 De tre mutationerna extraherade till src/data/mutations/*.ts som exporterade hooks enligt katalogens etablerade mönster (onSuccess-instrumentering, obligatorisk queryClient-DI per TASK-210, void recordActivity fire-and-forget); komponenterna konsumerar hookarna; beteendet i övrigt oförändrat, bevisat av befintliga sviter
- [x] #2 Verb/objekt-design motiverad i kod + kort: skapa event (objekt = eventet), segment-mail (bulk-precedenten från useSendActionEmail/TASK-201.13 AC #2: en post per faktiskt sänd mottagare, prövad mot EF-kontraktets FAKTISKA svar — läs koden, anta inte), spara segment (ny objektkategori mintas ENDAST om objektmodellen kräver det, motiveras öppet)
- [x] #3 Ingen fritext läcker: segment-mailets ämne/innehåll finns aldrig som binding i onSuccess-scopet — payload-nivå-bevis genom den RIKTIGA hooken + fällningsbevis (injicerad läcka fäller)
- [x] #4 Tvåsidigt bevis per instrumentering: post skapas vid lyckad mutation, INGEN post vid fallen — acceptance-nivå genom levande UI där UI finns
- [x] #5 Mekanisk grind: gatekeeper-test som fäller varje useMutation utanför src/data/mutations/ — allowlist config-driven per repo-konvention (.conf-fil; prototyp-filer undantagna med skäl), tvåsidigt bevisad (injicerad överträdelse fäller, återställd bit-identiskt)
- [x] #6 Mutationskatalogen mätt EFTER ändringen: noll differens exporterade hooks/recordActivity-anropsplatser (förväntat 18/18), kommandon bokförda i notes
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BYGGT (egen worktree agent-a9efbabfa9c1a0c70), gren task-201.15-extrahera-mutation-hooks från origin/docs/s105-skivor-201-15-16.

PREMISS-PASS (ADR-086): de tre citerade platserna (CreateEventForm.tsx:122, SegmentMailCompose.tsx:74, SegmentBuilder.tsx:91) STÄMDE EXAKT (grep -n mot verkligt läge). PR #1286 (basbranchen) var armerad vid start; ingen konflikt uppstod. Ingen divergens funnen på filadresser/radnummer.

EXTRAKTION (AC #1): useCreateEvent.ts (ny fil, 1 hook) + segment.ts (ny fil, 2 hooks: useSendSegmentMail + useSaveSegment, samma gruppering som actionEmail.ts/registrationPayments.ts). Komponenterna konsumerar hookarna oförändrat i övrigt; lokal UI-state (idempotencyKey-reset, namn-reset) flyttad till call-site .mutate(vars, {onSuccess}) — samma mönster PersonAnteckningar.tsx/Anteckningar.tsx redan etablerar efter sina egna hook-extraktioner.

AC #2 — VERB/OBJEKT-DESIGN, DÄR SEGMENT-MAILET AVVEK FRÅN NAIV LÄSNING AV BULK-PRECEDENTEN:
Läste supabase/functions/_shared/send-bulk.ts (runBulkSend) i sin helhet. FYND: EF:en beräknar internt acceptedPersonIds (för Utskicksloggens "Skickat till"-fält) men den listan lämnar ALDRIG BulkSendStatus/MailSendResult — klienten ser bara `accepted`-räknare + en `rejections`-lista keyad på e-post för DE FALLNA (aldrig motsvarande lista för de lyckade). useSendActionEmails bulk-precedent (en post per mottagare) läser `result.completed` — en sann server-rapporterad ID-lista som INTE FINNS i send-email-kontraktet. Att härleda mottagaridentitet via den separata, staleTime-cachade compute-segment-frågan hade krävt en klient-byggd lista — exakt det ADR-067 (SegmentMailCompose.tsx docblock) förbjuder, och riskerat en race (segment-medlemskap kan ändras mellan räkning och send).
BESLUT: EN AGGREGERAD post per lyckad sändning (accepted>0), objekt=segmentet (ny segmentObjectId-funktion), kategori=mail (delad med mailVerb/testmail). Namnet bär mottagarräkningen, inte en lista. Öppen förbättring bokförd i kod: uppgradera till per-mottagare OM/NÄR send-email-EF:en någon gång returnerar acceptedPersonIds — en backend-ändring, utanför denna skivas scope.
Spara-segment: NY objektkategori (ACTIVITY_OBJECT_TYPES.segment) mintad — inget av de nio befintliga passar en sparad segment-regel. segmentObjectId delas mellan useSaveSegment och useSendSegmentMail (samma entitet, olika verb).
Skapa-event: objekt=det NYSKAPADE eventet (eventObjectId(created.id)), kategori=event (delad med uppdatera-event, ingen ny kategori).

OVÄNTAD KONSEKVENS AV NY KATEGORI (fångad av typecheck, inte av uppdraget): src/components/aktivitetshistorik/AktivitetsHistorik.tsx sin Record<KategoriKey,string>-exhaustiveness-vakt (TASK-201.8, dokumenterad i sin egen docblock som avsiktligt fällande) vägrade kompilera förrän "segment" fick en svensk filter-etikett. Lagd till (KATEGORI_VALUES + KATEGORI_LABEL: "Segment"), sist i listan (segment-spar omfattas av PRD-berättelse 1, inte berättelse 9:s uppräkning — samma motivering som filens egen kommentar). FEATURE-ACTIVITY-LOG.md RÖRDES INTE (annan agents scope, per uppdrag).

AC #5 — GATEKEEPER (config-driven, källkodsstatisk, samma mönster som ef-metod-vakt.test.ts/.prod-functions-allowlist.conf):
tests/api/mutation-hemvist-vakt.test.ts + .mutation-hemvist-policy.conf. Regex matchar äkta useMutation-anrop, inte ordet i kommentar — negativkontroll byggd mot CheckinPrototyp.tsx sin FAKTISKA rad, se nedan. Allowlist: SegmentBuilder.tsx (computeSegment, read-only, kvarstår lokal med avsikt — uppdraget namnger den ALDRIG bland de tre) + segment/prototyp/VariantA.tsx (S90 throwaway-kontrakt).
FÄLLNINGSBEVIS (skarpt, mot en RIKTIG repo-fil, TRACKED): injicerade useMutation-anrop i src/lib/eventformat-etikett.ts → grinden föll och namngav filen exakt → git checkout återställde filen → git diff HEAD 0 rader (bit-identiskt) → grinden grön igen. Full sekvens körd och observerad, inte antagen.

AC #3 — INTEGRITETSVAKT (segment-mailets ämne/mailtext):
api-pure (tests/api/activity-log-hemvist-statements.test.ts § 2) + acceptance genom DEN RIKTIGA HOOKEN (tests/acceptance/mer-segment-send-aktivitetslogg.acceptance.test.ts, RIKTNING 1/2). FÄLLNINGSBEVIS: injicerade amne som bindning i onSuccess-destruktureringen + interpolerade den i object.name i segment.ts (NY, ännu OTRACKAD fil vid injektionstillfället — git checkout kunde alltså inte användas för återställningen). Körde acceptance-testet → föll exakt på integritets-assertionen, namngav ämnet. Återställde MANUELLT till ursprunglig kod (två riktade Edit-operationer, reverserar exakt de två injicerade raderna) → verifierade om: testerna gröna igen (2/2) + biome clean på filen. Detta är EN SVAGARE återställningsgaranti än git-checkout-varianten ovan (ingen bit-identisk diff mot en baseline att jämföra mot, eftersom filen är ny) — bokfört öppet, inte dolt.

AC #4 — TVÅSIDIGT BEVIS PÅ ACCEPTANCE-NIVÅ, tre nya filer:
tests/acceptance/skapa-event-aktivitetslogg.acceptance.test.ts (2 test, driver /event/skapa RIKTIGT formulär)
tests/acceptance/mer-segment-send-aktivitetslogg.acceptance.test.ts (2 test)
tests/acceptance/mer-segment-spara-aktivitetslogg.acceptance.test.ts (2 test)
Samtliga: RIKTNING 1 (lyckad mutation → exakt 1 post, rätt verb/objekt) + RIKTNING 2 (fallen mutation → 0 poster, negativ sensor via medvetetOanvand).

AC #6 — MUTATIONSKATALOGEN MÄTT EFTER ÄNDRINGEN:
grep-räkning av exporterade hooks i src/data/mutations/*.ts → 18
grep-räkning av recordActivity-anropsplatser i src/data/mutations/ → 18
grep efter mutationsfiler utan recordActivity (förväntat tom utdata) → tom
NOLL DIFFERENS, matchar kortets förväntade tal exakt (15 till 18, plus 3).

GRINDAR (mätta, exitkoder fångade separat, aldrig via pipe):
npm run typecheck: exit 0
npx biome check hela repot: exit 1 FÖRE min ändring bokförd (pre-existing: en CSS-fils important-regel + en test-hjälpfils void-typ — INGEN av dem i filer jag rörde; scopad check på mina 13 filer: exit 0)
npm run build: exit 0
npm run test:api:pure: exit 0, 469 av 469 (mina 14 nya ingår)
npm run test:api fullt: exit 1, MEN INTE ett kodfel — api-setup auth.setup.ts stoppades av staging-preflighten (TASK-77): CI HÅLLER STAGING (post-merge.yml run 31831150086, in_progress). 469 passade, 273 kördes inte. MM_STAGING_PREFLIGHT=off MEDVETET INTE använt (delad bas). Samma icke-kodfelklass som TASK-201.13 dokumenterade.
Berörda acceptance-sviter: 6 av 6 nya, 13 av 13 mer-segment-familjen (regression), 24 av 24 aktivitetshistorik-familjen (regression) — samtliga exit 0.

INGA MAIL SKICKADE. send-email-hooken utlöstes ALDRIG skarpt — all verifiering mot fixturvärld MSW, inga supabase-kommandon körda, prod orörd.

ÖPPET EJ VERIFIERAT AV MIG: tests/e2e/skapa-event.staging.test.ts (chromium-authenticated, kräver staging-inlogg) kördes inte — kräver en session-setup jag inte initierade i detta pass. CreateEventForm.tsx-refaktorn är behavior-preserving (typecheck, build och min egen acceptance-svit bevisar hooken), men just den e2e-filens regression är overifierad av mig och blir CI-jobb.
<!-- SECTION:NOTES:END -->
