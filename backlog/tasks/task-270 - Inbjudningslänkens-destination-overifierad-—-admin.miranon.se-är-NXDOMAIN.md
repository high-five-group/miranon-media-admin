---
id: TASK-270
title: Inbjudningslänkens destination overifierad — admin.miranon.se är NXDOMAIN
status: To Do
assignee: []
created_date: '2026-08-17 11:53'
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
- [ ] #1 INVITE_REDIRECT_URL:s faktiska värde avläst ur prod och bokfört i repot (docs/reference/atkomst-och-nycklar.md eller go-live-planen)
- [ ] #2 Destinationen bevisad nåbar — HTTP 200 mot den URL en inbjuden faktiskt landar på
- [ ] #3 Vid trasig destination: DNS/redirect åtgärdad och ommätt före inbjudan skickas
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
