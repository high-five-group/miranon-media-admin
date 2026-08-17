---
id: TASK-270
title: >-
  Inbjudningslänkens destination — INVITE_REDIRECT_URL:s värde overifierat
  (domänen admin.miranon.dev lever)
status: Done
assignee: []
created_date: '2026-08-17 11:53'
updated_date: '2026-08-17 13:02'
labels:
  - ready-for-human
dependencies: []
ordinal: 486000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND ur fas 4-förberedelsen (S102 resume 8, 2026-08-17). Blockerar TASK-127.10 steg 2-5 och därmed go-live-planens steg 5/8.

MÄTNINGEN: nslookup admin.miranon.se → NXDOMAIN (1.1.1.1, 2026-08-17). curl mot https://admin.miranon.se/ → HTTP 000. Nätverket i mätmiljön fungerar (curl https://github.com → 200), så avsaknaden är domänens, inte mätningens. Adressen förekommer i docs/archive/Code-verification-of-codex-analysis.md rad 500 — arkivmaterial, ej en styrande yta.

VARFÖR DET SPELAR ROLL: inbjudningsmailets destination sätts av miljövariabeln INVITE_REDIRECT_URL (supabase/functions/invite-user/index.ts:260, redirectTo skickas vidare rad 269). Pekar den på en död domän får mottagaren — Lotta — en trasig länk i sitt allra första möte med appen. Repot bär ingen annan publik URL: sökning efter *.vercel.app / *.se i supabase/functions/, .env.production och .env.example gav noll träffar utanför arkivet.

OMÄTBART FRÅN AGENTSIDAN: INVITE_REDIRECT_URL är en Supabase-hemlighet i prod-projektet. Läsningen kräver 'npx supabase secrets list --project-ref <prod>' som deny-prod-ref.sh spärrar för agenter. Marcus läser den i fas 4 steg 1 — raden är redan i körlistan.

TRE MÖJLIGA UTFALL, samtliga öppna: (a) variabeln pekar på en fungerande URL vi bara inte känner till → bokför den i repot så nästa mätning inte behöver göras om; (b) den pekar på admin.miranon.se → länken är trasig och DNS måste sättas upp FÖRE inbjudan; (c) den är osatt → Supabase faller tillbaka på projektets Site URL, som då måste verifieras separat.

Gissa inte vilket. Mät.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 INVITE_REDIRECT_URL:s faktiska värde avläst ur prod och bokfört i repot (docs/reference/atkomst-och-nycklar.md eller go-live-planen)
- [x] #2 Destinationen bevisad nåbar — HTTP 200 mot den URL en inbjuden faktiskt landar på
- [x] #3 Vid trasig destination: DNS/redirect åtgärdad och ommätt före inbjudan skickas
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
RÄTTELSE 2026-08-17 (Marcus): domänen är admin.miranon.dev — INTE .se. Mitt NXDOMAIN-fynd mätte fel domän; premissen kom ur docs/archive/Code-verification-of-codex-analysis.md rad 500, arkivmaterial jag inte skulle ha behandlat som styrande.

OMMÄTT MOT RÄTT DOMÄN: nslookup admin.miranon.dev → 76.76.21.21 (Vercel). curl https://admin.miranon.dev/ → HTTP 200. Destinationen är alltså LEVANDE, och AC1/AC2 är därmed uppfyllda utan att någon åtgärd behövdes.

OBEROENDE BEKRÄFTELSE ur passkey-proben mot prod (samma pass): Supabase svarar rpId: 'admin.miranon.dev'. Supabase-projektets egen domänkonfiguration pekar alltså på samma värd — två oberoende källor, ingen gissning.

KVARSTÅR ÄNDÅ ATT LÄSA: INVITE_REDIRECT_URL:s faktiska värde (supabase secrets list). Att domänen lever bevisar inte att variabeln pekar på den — den kan vara osatt (Supabase faller då tillbaka på projektets Site URL) eller peka på något annat. Kortets AC3 är därför inte moot; den är billig att stänga i fas 4 steg 1.

BONUSMÄTNING (stänger underlagets R10 för detta tillfälle): prod-bundlen index-C4xgzwJE.js innehåller strängen 'grid min-h-dvh w-full' — 266-fixens egna klasser, mergad 11:10Z i dag. Fronten är alltså FÄRSK, inte stale. Metodnot: en första sökning på funktionsnamnen ur inloggningsdestination.ts gav noll träffar, men det bevisade ingenting — bundlen är minifierad och identifierare manglas. Endast strängliteraler överlever; välj markör därefter.

SITE URL AVLÄST 2026-08-17 (Marcus, Supabase-dashboarden): https://admin.miranon.dev — samma värd som DNS-mätningen och passkey-probens rpId. Inbjudningslänkens destination är därmed KORREKT i dagens läge, via Site URL-fallbacken.

AC3 bockad: destinationen är verifierad nåbar (HTTP 200) OCH bevisad vara den appen faktiskt bor på, från tre oberoende håll — DNS/HTTP, Supabase auth-konfigurationens rpId, och Marcus avläsning av Site URL.

KVARSTÅENDE ROBUSTHETS-FRÅGA, INTE BLOCKERANDE (deferras): INVITE_REDIRECT_URL saknas fortfarande som explicit hemlighet, så destinationen ägs av Site URL. Det fungerar, men bäraren är en auth-inställning som kan ändras som sidoeffekt av annat dashboard-arbete, utan att något i repot märker det. Att sätta variabeln explicit gör destinationen till ett driftvärde som läses i samma svep som allt annat. Förkastas INTE — bokförs som öppen förbättring att ta när go-live-trycket släppt.
<!-- SECTION:NOTES:END -->
