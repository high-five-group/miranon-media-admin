---
id: TASK-455
title: >-
  Svepet får bilagor — bilageväljare per eventgrupp i Hem-vyns sändyta (Bekräfta
  alla, Påminnelse till alla, Eventinfo)
status: To Do
assignee: []
created_date: '2026-09-18 10:48'
updated_date: '2026-09-19 09:16'
labels:
  - ready-for-agent
dependencies:
  - TASK-452
references:
  - docs/research/utskicksytan-karta-och-historik-2026-09-18.md
  - tasks/sessions/bilagor/s102-svep-konvergens/facit.json
priority: high
ordinal: 796000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Problemet (Marcus 2026-09-18, ordagrant)

"Jag ser ett stort problem med bulkåtgärderna på hemvyn [...] kan ju inte använda dessa funktioner i nuläget eftersom det inte går att lägga till bilagor till varje utskick. Detta är ju ett stort problem. [...] För bilagor måste ju gå att lägga till eller hur?" — och efter underlaget: "GO på bilageväljaren i svepet."

## Vad som är mätt

- Aldrig diskuterat tidigare: TASK-147.5 (bilagekontraktet) landade 2026-08-10, sveparna (task-241, ADR-114) föddes 2026-08-16; ADR-114 har 0 träffar på "bilag". Genuin lucka, inget fattat beslut.
- Brottet sitter i KLIENTENS sändyta: `SendActionEmailInput` bär `attachmentIds` och EF:en väljer bilage-grenen själv (`_shared/send-action-email.ts:483–496`); `src/data/mutations/svepSend.ts:64–138` sänder redan ETT anrop per eventgrupp men har 0 förekomster av `attachmentIds`; inget i `SvepOverlay.tsx`/`Forhandsvisning.tsx`/`Adresslista.tsx` samlar in ett bilageval.
- Väggar: Resends batch-ändpunkt tappar bilagor TYST (ADR-067 D9) → bilage-bärande utskick går loopat; ~200 mottagare innan loopen kostar på riktigt (ADR-120, kö byggs vid mätt behov — INTE här); en bilaga måste höra till det sändande eventet (`send-action-email/index.ts:304–305`) → valet är PER EVENTGRUPP, aldrig globalt för hela svepet.

## Form

Sändytan är LÅST FACIT (`s102-svep-konvergens`, stämplad 2026-08-16). Arbetet går därför som konvergens på den befintliga ytan (prototyp-skillens UI-gren: start = exakt kopia av faktiska vyn, ADR-103 promoveringskontraktet), Marcus stämplar, facit amenderas — aldrig en tyst ändring av stämplad yta (ADR-102). Återbruka åtgärdssidans `BilageValjare` (`AtgardsSida.tsx:1067–1196`) och `fetchEventAttachments(eventId)`; bryt ut till delad komponent hellre än kopia (tre utskicksytor saknar redan delad kod — gör inte en fjärde). Ingen förvalslogik (samma regel som åtgärdssidan).

## Utanför omfattningen

Köad jobbmotor för stora utskick (ADR-120-tröskeln) · "mallen bär sina bilagor" (hör till mallväljar-grillningen, S127 punkt 3) · redigerbar text i svepet · SegmentMailCompose.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Varje eventgrupp i svepet visar sin egen bilageväljare med eventets tillgängliga bilagor (inkl. gemensamma, när TASK-452 landat); inget förval
- [x] #2 svepSend skickar attachmentIds per eventgrupp; en grupp utan valda bilagor går batch-vägen som i dag (ADR-067 D9 oförändrad)
- [x] #3 Rött-först: test som visar att ett svep med vald bilaga i dag sänder utan attachmentIds; grönt efter fix. API-test mot staging: mottagaren får bilagan (mail-låset respekterat — sentinel-adress)
- [x] #4 Granskningssteget visar per grupp vilka bilagor som följer med, och att bilage-bärande grupper tar längre tid (loopad sändning) — begripligt för Lotta utan teknisk förklaring
- [x] #5 Tillgänglighet 11: tangentbord, skärmläsare, prefers-contrast, reduced-motion; aria-mönstret följer åtgärdssidans väljare
- [ ] #6 Marcus stämplar formen i dev-server/staging; facit-manifestet s102-svep-konvergens amenderas med nya bilder (ADR-102/ADR-104) — landning sker först efter stämpeln
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Status vid PR-öppning (draft, väntar Marcus stämpel)

Kod: src/components/attachments/BilageValjare.tsx (utbruten delad komponent, byte-identisk logik ur AtgardsSida.tsx). src/data/mutations/svepSendGrupper.ts (ren sändloop, ny fil, extraherad för testbarhet). src/data/mutations/svepSend.ts (hooken, re-exporterar). SvepOverlay.tsx/Forhandsvisning.tsx (bilageurval per eventgrupp, tar-langre-tid-not).

AC 3, andra halvan (staging) EJ live-kord av mig: tests/api/svep-send-attachments.staging.test.ts skriven, biome/typecheck grona, men lokal korning blockerades av repots staging-preflight (tests/support/staging-preflight.ts) - en pagaende post-merge-korning (run 35346136785) holl staging vid mitt pass. Jag korde INTE med preflight-overridet (risk for falskt rott pa en annan agents landade PR). Rott-forst-halvan (klientlagrets logik) AR kord och bevisad, se PR-beskrivningen.

Marcus stampling - sa har oppnar du formen: starta dev-servern, ga till /hem, klicka Bekrafta alla (eller Skicka paminnelse till alla - samma delade yta). Bladdra mellan event-grupperna (Utskicket-sektionen) - varje grupp har nu en egen Bilagor-rad under forhandsvisningstexten, ingen forvald. Valjer du en bilaga i en grupp visas Den har gruppen har bilagor och tar lite langre tid att skicka under listan.

KANDIDAT-skarmdumpar (mobil 390 + desktop 1280, ljus + prefers-contrast: more) ligger i tasks/sessions/bilagor/s102-svep-konvergens/KANDIDAT-svep-bilageval-*.png - inte facit, inte stamplade, prefixet skiljer dem mekaniskt fran facit-* (check-facit.sh invariant R4 bekraftat gron med dem narvarande).

Efter stampel: facit.json (s102-svep-konvergens) behover amenderas (ADR-102 paragraf Updates 2026-08-22, klass c - formen utokas faktiskt) via Marcus egen godkannandekanal (ADR-104 beslut 2). Jag har INTE rort facit.json eller dess godkand-falt.

AC 3 STANGD, live-kord mot staging (2026-09-18, efter preflight-backoff ca 13-14 min, 3 fonster, 46 preflight-forsok totalt, aldrig preflight-overridet):

tests/api/svep-send-attachments.staging.test.ts kord via npm run test:api:staging -- <fil> mot verklig deployad send-action-email pa staging (pqtshyierkdgwdnxuirz). 3 tester grona: (1) gruppen med vald bilaga gar bilage-barande vagen och far sent, (2) gruppen utan bilageval gar batch-vagen och far sent, (3) NEGATIV KONTROLL: ett pahittat attachmentId ger 404 Attachment not found INNAN Resend nas - bevisar att attachmentId genuint racker fram till en verklig Airtable-uppslag + Storage-lasning + EN atomisk resend.emails.send-request som bar bilagan, inte en overksam parameter.

Gransen for vad som bevisas, sagd oppet: SendActionEmailResultSchema (status/completed/failed) later inget Resend-meddelande-ID, EF:en lager aldrig ut data.id ur resend.emails.send-svaret, ingen mail-logg skrivs av send-action-email (den loggningen finns bara for segment-vagen), och repot har ingen Resend-webhook-mottagare. Den starkaste bevisningen som gar att fa genom den befintliga, odandrade EF:en ar darfor STRUKTURELL (positiv+negativ kontroll enligt ovan), inte ett bevis att en riktig inkorg innehaller mailet med bilagan lasbar. Att stanga den gapet kraver att EF:en borjar returnera/logga Resends meddelande-ID eller en webhook-mottagare - bada UTANFOR TASK-455s omfattning (observability-utbyggnad av send-action-email, inte av svepets klientlager).

TASK-452-frashet verifierad BADE via UPDATED_AT (supabase functions list --project-ref pqtshyierkdgwdnxuirz, send-action-email updated_at 2026-09-18T11:36:39Z, fore mergen cdd1856b 12:19:38Z - deployen skedde under TASK-452s egen PR-byggsession, fore merge, vilket ar det forvantade monstret har) OCH beteendemassigt genom att kora TASK-452s EGEN regressionssvit (send-action-email-gemensam-bilaga.staging.test.ts) live mot staging - bada dess tester grona, inklusive det som skulle ge 400 om fixen INTE var deployad. Mitt eget test i denna skiva exercerar dock INTE Gemensam-cross-event-vagen (anvander Event-scopad bilaga pa sitt eget ursprungsevent), sa det berors strikt sett inte av TASK-452s fix - detta ar en korrigering av en premiss i tillaggsordern, inte en avvikelse i mitt arbete.

## Iteration efter stämplingspasset (S127, tredje spawn-försöket, kod)

Marcus 2026-09-19 efter att ha bläddrat grupperna i dev-servern: "Ser ok ut. Men jag gillar inte att bilagorna laddar när jag växlar mellan eventgrupp." Formen i övrigt är godkänd och rörs inte — enbart laddbeteendet vid gruppväxling ändrat.

Rotorsak: Forhandsvisning.tsx frågade bara den bläddrade gruppens useEventAttachments(grupp.event.id) — varje ny grupp mötte en kall cache och visade BilageValjares skeleton.

Fix: src/data/queries/useEventAttachments.ts får en delad prefetch-kärna (forberedEventBilagor, extraherad ur den befintliga useForberedAtgardsBilagor utan att ändra dess signatur/docblock) plus en ny useForberedSvepBilagor(eventIds) som SEKVENTIELLT (for-loop + await, aldrig Promise.all) förvärmer samtliga gruppers bilagor — motiverat av Airtables delade 5 req/s/bas-tak (P4) där en 429 kostar minst 30 s lockout för ALLA klienter. queryClient.prefetchQuery sväljer fel internt (TanStack Query 5.102.2, verifierat mot installerad källkod) så ett fel i en länk stoppar aldrig resten och ger inget synligt fel — gruppen faller tillbaka på dagens beteende. Kedjan avbryts (stoppar innan nästa länk) via en cleanup-flagga när SvepOverlay unmountas (dialogen stängs helt, aktivtSvep && <SvepOverlay/> i Hem.tsx).

src/components/svep/SvepOverlay.tsx anropar hooken med en useMemo-memoiserad eventIds-lista (eventGrupper.map). SvepOverlay valdes som nivån (inte Forhandsvisning) eftersom den äger eventGrupper-listan som en HEL, stängningsbar livscykel — Forhandsvisning är en ren bläddrings-presentation.

Valen (bilagorPerGrupp) och sändvägen (svepSendGrupper.ts) är ORÖRDA — bekräftat via diff mot versionshistoriken, ingen rad rörd i någon av de två filerna.

RÖTT-FÖRST bevisat manuellt (diffen sparad separat, de två src-filerna tillfälligt återställda till 192c5287, körde testet): page.waitForRequest för grupp 2/3s get-event-attachments TIMEOUT:ar (5 s) på orörd kod — anropen avfyras aldrig förrän man bläddrar dit. Diffen återapplicerad, samtliga 3 tester i filen gröna igen (11,2 s). Inget test.fixme/test.fail/skip använt.

Grindar körda och mätta (exitkoder lästa separat, ingen pipe):
- npm run typecheck: exit 0
- npx @biomejs/biome check . (hela repot): exit 0 (18 varningar/84 infos, samtliga FÖRBEFINTLIGA i tasks/sessions/**/*.mjs, orört av denna skiva)
- npm run build: exit 0
- node scripts/check-langa-streck.mjs: exit 0 (330 filer, 0 ofångade)
- npm run test:acceptance -- tests/acceptance/svep-bilageval.acceptance.test.ts: exit 0, 3 passed (11,2 s)
- npm run test:api:pure: exit 0, 1804 passed (7,6 s)

INTE kört: npm run test:api:staging (ingen EF/server-kontrakt rörd i denna iteration — bara en ny klientsides prefetch-hook mot samma befintliga get-event-attachments-EF; staging-preflighten rördes aldrig, MM_STAGING_PREFLIGHT satt aldrig till off).

Sidofilen AMENDERING-2026-09-18-svep-bilageval.md prövad mot laddbeteendet (uppdragets punkt 5) — nämner det INTE (handlar enbart om UTSEENDET), så ingen rad tillagd där; facit.json orört.
<!-- SECTION:NOTES:END -->
