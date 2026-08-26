---
id: TASK-296
title: >-
  Fynd: supabase functions deploy varnar för preview-receipt/send-receipt.ts —
  en fil som aldrig funnits där
status: To Do
assignee: []
created_date: '2026-08-22 17:41'
updated_date: '2026-08-26 02:59'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 539000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur prod-EF-deployen 2026-08-22 (samma deploy som stängde registerglappet, TASK-286.8). Tillhör S108:s kvittospår. KORTET SKAPAS, LÖSES INTE HÄR.

## Signalen, verbatim ur deployens utskrift

  WARN: failed to read file: open supabase/functions/preview-receipt/send-receipt.ts: no such file or directory
  Deployed Functions on project PROD-REF: preview-receipt

(Prod-refen maskerad med avsikt: deny-prod-ref.sh matchar dess närvaro i varje Bash-kommandosträng, så en verbatim-kopia hade gjort kortets egen text ohanterbar för agenter.)

DEPLOYEN LYCKADES ÄNDÅ. Raden är en WARN, inte ett fel — funktionen rullades ut och svarar. Det är därför fyndet är lågprioriterat men inte harmlöst: en stående varning i varje deploy-utskrift är brus som gör en ÄKTA varning svårare att se.

## Mätt mot disk (2026-08-22, origin/main 3849ac5a)

1. VAD preview-receipt FAKTISKT IMPORTERAR. supabase/functions/preview-receipt/index.ts har åtta importer, samtliga mot ../_shared/: airtable-client.ts, attachments.ts, auth.ts, coerce.ts, cors.ts, errors.ts, receipt-content.ts, receipt-pdf.ts. INGEN import av send-receipt.ts, varken värde eller typ.

2. FILEN preview-receipt/send-receipt.ts FINNS INTE. Katalogen innehåller exakt en fil: index.ts (7897 byte).

3. FILEN FINNS PÅ ETT ANNAT STÄLLE. supabase/functions/_shared/send-receipt.ts, 225 rader, exporterar de två typer varningen handlar om: Betalning (rad 43) och Betalsatt (rad 50). Två andra träffar på namnet finns också: supabase/functions/send-receipt-email/ (en EF) och tests/api/send-receipt.test.ts.

4. VEM SOM REFERERAR DEN. Exakt två ställen i supabase/functions/ nämner specifikatorn ./send-receipt.ts:
   - _shared/receipt-content.ts rad 44: en RIKTIG import type av Betalning och Betalsatt.
   - preview-receipt/index.ts rad 34: en KOMMENTAR som citerar samma rad i förklarande syfte.
   Den riktiga importen står i _shared/, där ./send-receipt.ts löser till _shared/send-receipt.ts — som finns.

5. KODEN ÄR KORREKT. npm run typecheck ger exit 0 (mätt i förgrunden, exitkod fångad separat). En felaktig modulreferens hade fällt tsc.

## Rotorsaken — en scanner som löser relativt fel katalog

Supabase CLI:s deploy-scanner löser specifikatorn ./send-receipt.ts mot ENTRYPOINT-katalogen (preview-receipt/) i stället för mot den IMPORTERANDE filens katalog (_shared/). Därav den påhittade sökvägen i varningen: preview-receipt/send-receipt.ts har aldrig funnits och ska aldrig finnas.

KODEN FÖRUTSADE DETTA. preview-receipt/index.ts rad 34-42 bär redan en kommentar som beskriver mekanismen exakt, skriven under TASK-246-arbetet, långt innan varningen observerades: importen är TYPE-ONLY, raderas av TypeScript vid transpilering, och Deno laddar aldrig det modulträdet — men supabase functions deploy laddar ändå upp send-receipt.ts, receipt-numbering.ts och send-bulk.ts som ASSETS, eftersom "dess statiska grafscanner särskiljer inte import type från import när den paketerar källfiler för uppladdning". Det är en deploy-tids-artefakt, inte ett runtime-beroende. Resend importeras aldrig i denna kedja.

Kommentaren förklarar alltså varningen fullständigt. Vad den INTE gör är att tysta den, eller att säga om vi accepterar den.

## KLASSEN ÄR BREDARE ÄN EN FIL — mätt, delvis oprövat

Fem type-only-importer med relativ ./-specifikator finns inom _shared/:
  segment-resolution.ts rad 16  -> ./prepare-bulk-send.ts
  send-receipt.ts rad 40        -> ./receipt-numbering.ts
  confirm-registrations.ts r 16 -> ./resend-batch.ts
  receipt-content.ts rad 44     -> ./send-receipt.ts
  resend-batch.ts rad 28        -> ./send-bulk.ts

Fem Edge Functions importerar direkt någon av de filer som bär dessa rader: compute-segment, preview-receipt, send-email, send-receipt-email, send-registration-confirmation. Transitivt kan mängden vara större.

VIKTIGT OM BEVISETS STYRKA: bara EN varning är faktiskt observerad (preview-receipt/send-receipt.ts). De övriga fyra är strukturellt exponerade för samma mekanism men OPRÖVADE — ingen har mätt en deploy-utskrift för dem. Utskriften i uppdraget kan dessutom ha varit klippt. Att generalisera från en observation till fem vore exakt den felklass som lessons-fragmentet en-matning-svarar-bara-pa-den-fraga-den-stallde beskriver.

## Vad kortet ska avgöra (ej beslutat här)

(a) ACCEPTERA OCH DOKUMENTERA. Varningen är kosmetisk och redan förklarad i kod. Kostnaden är brus i varje deploy-utskrift plus risken att en äkta WARN drunknar.
(b) UNDANRÖJ SPECIFIKATORN. Flytta Betalning och Betalsatt till en egen typmodul som importeras via en väg scannern löser lika i båda passeringarna. Billig, men rör en fil i kvittokedjan och kräver att man kontrollerar att samma sak inte bara flyttar problemet.
(c) RAPPORTERA UPPSTRÖMS till supabase/cli. Rätt hemvist för en scanner-bugg, men löser inget för oss på kort sikt.

Vägvalet kräver först ett svar på om klassen faktiskt är fem funktioner eller en — dvs punkt ett i acceptanskriterierna.

Referenser: supabase/functions/preview-receipt/index.ts rad 34-42 (mekanismen, redan beskriven), supabase/functions/_shared/receipt-content.ts rad 44, supabase/functions/_shared/send-receipt.ts rad 43 och 50, TASK-246 (byggde preview-receipt och renderKvittoPdf-utbrytningen), TASK-268 (klass B-förhandsvisningen), TASK-286.8 (deployen fyndet kom ur).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Klassens verkliga omfång är MÄTT, inte härlett: en deploy-utskrift lästes för var och en av de fem exponerade funktionerna (compute-segment, preview-receipt, send-email, send-receipt-email, send-registration-confirmation) och det står svart på vitt hur många som faktiskt varnar
- [ ] #2 Vägvalet (a acceptera-och-dokumentera, b undanröj specifikatorn, c rapportera uppströms) är fattat och motiverat mot det mätta omfånget — inte mot antagandet att det är en enda funktion
- [ ] #3 Om (b) väljs: typecheck och EF-testsviten är gröna efter flytten, och en ny deploy-utskrift visar att varningen är borta — inte bara att koden kompilerar
- [ ] #4 Kommentaren i preview-receipt/index.ts rad 34-42 är uppdaterad till att spegla utfallet: den beskriver i dag mekanismen korrekt men säger inget om att vi tagit ställning till varningen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BLOCKERAT 2026-08-26 (S112 fix-våg 4, bunt A) — kräver Marcus-beslut/scope utanför en enskild bygg-agents mandat. Premiss-passet bekräftar att koden fortfarande är korrekt (npm run typecheck exit 0) och att kortets mätta läge (preview-receipt/index.ts åtta importer, ingen mot send-receipt.ts; supabase/functions/_shared/send-receipt.ts finns med Betalning/Betalsatt) stämmer oförändrat mot origin/main.

Varför blockerat, inte fixat:
1. AC #1 kräver en FAKTISK deploy-utskrift för alla fem exponerade EF:er (compute-segment, preview-receipt, send-email, send-receipt-email, send-registration-confirmation). En sådan mätning kräver `supabase functions deploy --project-ref <ref>` — scannern som producerar WARN-raden kör som en del av CLI:ts lokala bundling-steg, oavsett mål. Prod-refen är strukturellt otillgänglig för en agent: CLAUDE.md § Prod-EF-deploy + scripts/deny-prod-ref.sh matchar refens NÄRVARO i hela Bash-kommandosträngen och nekar agent-anrop (dokumenterat skarpt prövat i CLAUDE.md: "ett agent-anrop med prod-refen avvisades av låset"). Stagingrefen (pqtshyierkdgwdnxuirz) är tekniskt tillåten för agenter (scripts/test-deny-prod-ref.sh fall A1), men en investigativ deploy av fem EF:er till en DELAD, aktivt använd stagingmiljö — enbart för att läsa en varningsrad — ligger utanför vad denna CI/workflow-fynd-bunt är mandaterad att mutera, och riskerar att kollidera med parallella sessioners staging-beroende testkörningar (jfr. den omfattande staging-semaphore/purge-staging-maskinen som finns just för att koordinera sådana mutationer).
2. AC #2 kräver ett VÄGVAL mellan (a) acceptera-och-dokumentera, (b) undanröj specifikatorn (flytta typer, rör kvittokedjan), (c) rapportera uppströms till supabase/cli — och kortets egen text markerar uttryckligen "KORTET SKAPAS, LÖSES INTE HÄR" samt "Vägvalet kräver först ett svar [på det mätta omfånget]". Detta är ett designbeslut som kräver mätningen i AC #1 FÖRE det kan fattas, inte något en enskild agent ska besluta unilateralt i en bunt märkt "CI/workflow-fynd".

Ingen kod, inget AC rört. Rekommenderad väg framåt: Marcus/orkestreraren kör de fem prod-mätningarna (via fas4-prod-deploy.sh --kontrollera, som ändrar inget) ELLER godkänner explicit ett dedikerat staging-deploy-fönster; därefter kan ett fristående kort ta vägvalet och ev. (b)-implementationen.
<!-- SECTION:NOTES:END -->
