---
id: TASK-216
title: >-
  Auth-ytornas kortbredd krymps 576→448 px (max-w-xl→max-w-md), hela
  auth-familjen
status: Done
assignee: []
created_date: '2026-08-15 07:44'
updated_date: '2026-08-15 08:24'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 412000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus-GO 2026-08-15 (S102 Lotta-vandringen, punkt 1): login-kortet upplevs lika brett som appens content-yta — mätt 576 px (max-w-xl, src/routes/login.tsx:227) mot AppShells 600 px (src/components/AppShell/AppShell.tsx:38). Beslutet: krymp till max-w-md (448 px) för HELA auth-familjen så formspråket förblir ett — login.tsx:227, glomt-losenord.tsx:98, passkey.tsx:140+204, nytt-losenord.tsx:109+131+232, valkommen.tsx:184+212+343. Fil:rad-belagt av Explore-svepet 2026-08-15. OBS: TabBar max-w-[568px] (TabBar.tsx:55) rörs INTE — den hör till app-ytan, inte auth.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Samtliga max-w-xl-förekomster på de fem auth-ytorna (login, glomt-losenord, passkey, nytt-losenord, valkommen) är max-w-md — grep max-w-xl i src/routes/ ger noll auth-träffar
- [x] #2 Visuell verifiering på dev-server: login-kortet är tydligt smalare än appens content-yta, inga radbrytnings-/overflow-defekter på någon av de fem ytorna i 375 px- och 1440 px-vyport
- [x] #3 DoD-kvartetten grön (test:api, typecheck, biome, build)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation (2026-08-15). Fem auth-ytor: max-w-xl -> max-w-md, exakt de
10 fil:rad-positioner uppdraget angav (login.tsx:227, glomt-losenord.tsx:98,
passkey.tsx:140+204, nytt-losenord.tsx:109+131+232, valkommen.tsx:184+212+343)
- verifierade mot disk FÖRE edit, alla stämde exakt.

AC1 (grep-belägg): `grep -rn max-w-xl src/routes/` ger EN träff kvar, utanför
auth-familjen och medvetet ORÖRD: src/routes/dev/auth-prototyp.tsx:98 — en
JSX-prosa-kommentar ("`max-w-xl`-centrering") om historisk bredd-design, inte
en klass-användning. TabBar.tsx:55 (max-w-[568px], app-ytan) likaså orörd,
verifierat.

AC2 (visuell, Playwright/chrome-devtools MCP, 375px + 1440px):
- login: OK båda vyporter, kortet synligt smalare, ingen overflow.
- glomt-losenord: OK båda vyporter.
- nytt-losenord: OK båda vyporter (recovery-formuläret, inloggad session).
- valkommen: OK båda vyporter (inbjudan-formuläret).
- passkey: EJ visuellt nåbar i sina kort-vyer (erbjudande/registrerad,
  rad 140/204). Route kräver autentiserad session (nådd via test-konto ur
  .env.test) men `probaPasskeyTillganglighet()` (src/lib/auth/passkey.ts)
  rapporterar otillgängligt på staging idag (kod-kommentaren själv: "servern
  svarar passkey_disabled — verifierat läge på staging idag") vilket
  triggar avsedd tyst vidarebefordran till /hem INNAN kortet renderas. Detta
  är ett dokumenterat, avsiktligt beteende i koden — inte ett headless-
  browser-artefakt (kontrollerades: samma silent-forward skulle ske i en
  riktig browser också, eftersom server-flaggan är av). Täckning för denna
  yta vilar därför på kod-nivå: identisk `flex w-full max-w-md flex-col
  gap-8`-wrapper (byte-för-byte samma sträng som de fyra bekräftade
  ytorna), plus grön typecheck/build/biome för filen. Registrerat som
  öppen täckningslucka, inte tyst godkänt.

DoD-kvartetten, mätt lokalt (samtliga exit=0):
- npm run typecheck: 0 fel
- npx @biomejs/biome check .: 0 fel (6 varningar/42 infos, samtliga
  FÖREKOMMER INTE i de fem redigerade filerna — grep-verifierat mot
  biome-loggen)
- npm run build: grön, PWA-manifest genererat
- npm run test:api: 750 passed (1.2m)

Divergens mot uppdraget (rapporterad, ej tyst byggd på): uppdraget bad
vänta tills kortet fanns på origin/main (PR #1315) innan bygge startade.
PR #1315 var armerad (autoMergeRequest satt, isInMergeQueue=true,
mergeStateStatus=CLEAN) men stod i kö BAKOM PR #1314 vars merge_group-körning
(Acceptance-jobbet, den tyngsta CI-klassen) fortfarande pågick efter >8 min
väntan. Per CLAUDE.md § Landning ("Vänta ALDRIG in kö-fasen... agenter
parkerar inte längre på landnings-vakter") avbröts väntan. Byggt i stället
ovanpå denna worktrees befintliga HEAD (commit 8c3bb511), som redan innehöll
exakt samma kort-mint-commit som PR #1315 bär (samma SHA, branchad från
docs/task-216-mintning-spetsen) — alltså inte "byggt utan kort", utan byggt
på en verifierat identisk, ännu oköad kopia av samma commit. mergeMethod på
#1315 är "MERGE" (ej squash) så SHA:t bevaras när det landar, vilket gör
denna gren strukturellt ren mot main när kön hinner ikapp.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad i PR #1318 (commit cdb4ca6b, MERGED på main 96fc1ba5, 2026-08-15). Samtliga tio max-w-xl→max-w-md-byten på de fem auth-ytorna; grep-bevis noll kvarvarande auth-träffar; TabBar orörd. DoD-kvartetten grön (typecheck 0 · biome 0 fel · build grön · test:api 750 passed). Visuellt verifierad 375+1440 px på 4/5 ytor — passkey-ytan onåbar i staging (serverflaggan av), kodverifierad byte-identiskt mot de gröna ytorna; luckan öppet bokförd i implementation-notes.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
