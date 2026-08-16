---
id: TASK-246
title: >-
  Riktigt genererad PDF i Visa-overlayen för mallar (klass B) och generatorer
  (klass C)
status: To Do
assignee: []
created_date: '2026-08-16 15:26'
updated_date: '2026-08-16 17:05'
labels:
  - ready-for-agent
dependencies:
  - TASK-245
ordinal: 454000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus-order 2026-08-16, nära-verbatim: 'det proffsigaste och mest branschledande är väl att man ser en riktigt genererad PDF på alla mallar ... och även generatorn'. Ersätter varv 3:s producerat-exempel (statiskt) med äkta generering vid Visa-klick. Dokumentklasserna per ORDLISTA (grillad samsyn S93): B event-mallad = systemmall där eventfälten fylls i (t.ex. deltagarinformations-brevet) · C person-genererad = skapas ur person- + betalningsdata (t.ex. betalningskvittot). Beroende: task-245 bygger overlay-mekaniken för PDF-visning (signerad URL + dialog) — denna skiva återanvänder den för genererat innehåll. Förhandsvisningens sidoeffektsfrihet är hård gräns (kvitto-vägen angränsar mail-sändning — får inte triggas).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Visa på en event-mallad rad (klass B) öppnar overlayen med en RIKTIGT genererad PDF ur eventets verkliga data — befintlig generator-yta (generate-event-attachment, 146.5) återanvänds; ny EF byggs endast om befintlig yta bevisat inte räcker
- [x] #2 Visa på en person-genererad rad (klass C) visar riktigt genererad PDF; formvalet för persondata (verklig person ur eventet vs typexempel) verifieras mot befintlig generator-yta och bokförs i kortets notes
- [x] #3 En förhandsvisning får ALDRIG ha sidoeffekter: ingen mail-sändning, ingen bas-skrivning, ingen kvarliggande Storage-artefakt — genereringen är transient eller städas bevisat
- [x] #4 Varv 3:s producerat-exempel-dialog ersätts för klass B/C; ladda ner-fallback kvarstår; prod-klicklistan uppdaterad om EF-ytan ändras
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
KLASS B (event-mallad, "Deltagarinformation"): generate-event-attachment (146.5) UTÖKAD med body-flaggan `preview: true` (AC #1 — befintlig yta räckte, ingen ny EF). Vid preview: SAMMA lasEventUppgifter+byggPdf-anrop som den persisterande vägen (identisk PDF ur eventets verkliga data), men grenen returnerar `{pdfBase64, requestId}` DIREKT (200, inte 201) INNAN Storage-uppladdningen/Bilagor-radskapelsen någonsin nås — transient per konstruktion.

KLASS C (person-genererad, "Betalningskvitto"): NY, dedikerad EF preview-receipt (AC #1/#2 — send-receipt-email/_shared/send-receipt.ts KAN INTE återanvändas: sendReceipt allokerar ALLTID ett riktigt kvittonummer, en Airtable-skrivning FÖRE sändningsförsöket [_shared/receipt-numbering.ts § allocateReceiptNumber], och skickar ett riktigt mail vid lyckad körning — ingen dryRun-gren går att lägga inuti den orkestratorn utan att röra sidoeffekt-anropen). preview-receipt återanvänder i stället de rena funktionerna kvittoRader (_shared/receipt-content.ts) + den NYUTBRUTNA renderKvittoPdf (_shared/receipt-pdf.ts, bruten ur send-receipt-email/index.ts § DRY — send-receipt-email refaktorerad att återanvända SAMMA renderare, ingen beteendeändring). preview-receipt importerar varken Resend, _shared/send-receipt.ts eller _shared/receipt-numbering.ts direkt (en indirekt type-only-import via receipt-content.ts eraderas vid transpilering, se EF filhuvud).

FORMVAL KLASS C-PERSONDATA (AC #2, bokfört beslut): TYPEXEMPEL (kundnamn="Exempelperson", belopp=500, betalsatt="Swish", betalning="avgift"), INTE en verklig anmälan/betalning. Motivering: Dokument-ytans GeneratorRad är en generisk katalograd UTAN vald anmälan/betalning (ingen sådan väljare finns eller bör byggas för en katalog-förhandsvisning) — belopp/betalsätt kan strukturellt aldrig vara "verkliga" här oavsett (basen saknar ett prisfält, ADR-109 § Öppna punkter; de är ALLTID Lotta-inmatade vid en riktig sändning). Att visa en verklig persons namn utan en faktisk betalning under behandling vore dataexponering utan syfte. Eventets namn ÄR verkligt (samma valda eventId Dokument-ytan bär) — live-verifierat mot staging (Airtable MCP, apphjj8Q7lkXCMsL4, recIFrxHZw165ycXk): "Event (source)" = "Fjärrskådning" (INTE Eventlabel-formelns "ZZ-belaggning-fixtur…" — en felaktig premiss jag hade innan verifiering, korrigerad i testet). Kvittonumret är ALDRIG ett allokerat nummer — "FÖRHANDSVISNING", en ärlig platshållare.

SIDOEFFEKTSFRIHET (AC #3), BEVISAD BÅDA RIKTNINGAR:
- Klass B: staging-test räknar Bilagor-rader med generate-event-attachment egen namn-signatur ("Deltagarinformation – ") FÖRE/EFTER ett preview:true-anrop — oförändrat. NEGATIVT KONTROLLPROV körd skarpt: en temporär `if (false && preview)` (guard urkopplad) deployad till staging gav en RIKTIG ny Bilagor-rad och testet gick RÖTT (förväntat status 200, fick 201 + en riktig persisterad rad) — beviset att grinden fäller när den bryts. Reverterad + omdeployad, GRÖN igen (dubbelverifierad, två körningar av npm run test:api).
- Klass C: två anrop i rad ger BYTE-FÖR-BYTE identisk sida-CONTENT-STREAM (isolerad från PDF-lib tidsstämplade metadata, som annars hade gett falska röda — se testfilens docblock). NEGATIVT KONTROLLPROV körd skarpt: kvittonumret suffixat med crypto.randomUUID() i EF:en, deployad — ETT första substring-baserat testförsök förblev FELAKTIGT GRÖNT (äkta blind fläck, dokumenterad i testet); den nuvarande content-stream-exakt-likhets-formen FÅNGADE regressionen korrekt. Reverterad + omdeployad, GRÖN igen.
- Ingen bas-skrivning: strukturellt bevisat — preview-receipt importerar aldrig Airtable-skrivfunktioner (bara fetchAirtableRecord, en LÄSNING). Ingen mail: strukturellt bevisat — importerar aldrig Resend.

DIALOGBETEENDE PER KLASS: identisk med bilage-visningen (task-245) — samma Dialog/Modal-primitiv, samma lazy-fetch-på-öppning (isOpen-styrd useQuery, enabled: isOpen), samma iframe-förhandsvisning + "Ladda ner"-fallback. Skillnad: base64→Blob→createObjectURL (transient, ingen lagrad fil att peka en signerad URL mot), URL.revokeObjectURL i useEffect-cleanup (ingen minnesläcka). Varv 3s VisaKnapp/ProduceratExempel RIVNA (ersatta av GenereradPdfVisaKnapp, delad av båda klasserna).

DENY-TRIPLE: preview-receipt full svit (9 tester: allow×2, deny×3, anon 401, CORS 200, metod 405) — alla skarpt gröna mot staging. Fångade dessutom att generate-event-attachment.staging.test.ts SAKNADE metod-405-testet sedan tidigare (146.5) — lagt till (ny/ändrad EF-väg kräver fullständig deny-triple).

RACE-FYND UNDER BYGGET: den ursprungliga sidoeffekts-räkningen (TOTALT antal Bilagor-rader på BELAGGNING_EVENT_ID) fällde en gång falskt (40→41) under full npm run test:api — BELAGGNING_EVENT_ID är en delad fixtur som upload-attachment/delete-attachment/get-attachment-download-url egna sviter också skriver mot, PARALLELLT (olika testfiler = olika Playwright-workers). Fixat: räkningen filtrerar nu på generate-event-attachment egen namn-signatur, immun mot orelaterad samtidig churn. Verifierat grönt två körningar i rad efter fixen.

PROD-KLICKLISTAN (AC #4): preview-receipt (NY EF) tillagd i .prod-functions-allowlist.conf. generate-event-attachment (ÄNDRAD, ny preview-gren) behöver INGEN ny allowlist-rad (stod redan där sedan 146.5) men KRÄVER en prod-redeploy för att bära den nya koden. Båda BOKFÖRDA som HITL — den faktiska prod-deployen (scripts/deploy-prod-functions.sh) är INTE utförd av denna agent.

STAGING-DEPLOY (manuellt, ADR-050): generate-event-attachment, send-receipt-email, preview-receipt deployade till pqtshyierkdgwdnxuirz via `supabase functions deploy <namn> --project-ref pqtshyierkdgwdnxuirz` (tre gånger vardera: skarp version → negativt kontrollprov → reverterad skarp version igen).
<!-- SECTION:NOTES:END -->
