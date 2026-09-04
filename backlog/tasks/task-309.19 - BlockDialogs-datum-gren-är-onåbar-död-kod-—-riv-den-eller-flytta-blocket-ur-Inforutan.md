---
id: TASK-309.19
title: >-
  BlockDialogs datum-gren är onåbar död kod — riv den eller flytta blocket ur
  Inforutan
status: Done
assignee: []
created_date: '2026-08-24 17:53'
updated_date: '2026-08-28 02:58'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 585000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FALSIFIERAR PREMISSEN I TASK-309.17. Avtäckt av skiva 9-agenten 2026-08-24, verifierad oberoende av orkestreraren.

TASK-309.17 skapades på antagandet att block-dialogens datum-läge är ett fjärde nåbart läge vid sidan av text/agenda/plats, och att dess ariaSnapshot-par saknades. Antagandet var FEL: grenen går inte att nå alls.

sistaBetalningsdag är enda blocket med datum: true (blockDefinitioner.ts rad 90) och bor i bekräftelsebilagans Inforutan-grupp. Tre oberoende spärrar i GenereringsVy.tsx stänger vägen till BlockDialog:

  rad 270  dialogRader() filtrerar bort INFORUTA_IDN ur dialogens bläddring
  rad 835  varningsrutan: INFORUTA_IDN.has(id) ? oppnaMorf(id) : oppnaBlock(id)
  rad 941  lasEndast = r.def.last || arInforutan — raden blir en div, ingen knapp

Inforutans block redigeras alltså i sektionsmorfen, aldrig i BlockDialog. Datum-grenen i BlockDialog.tsx är död kod.

Spec-filens ursprungliga docblock hade detta rätt. Kortet 309.17 skrevs utan den läsningen — av orkestreraren, på en snabb kodläsning som såg datum: true och en segment-form och drog fel slutsats.

VARFÖR DET INTE BARA ÄR EN RIVNING: att flytta sistaBetalningsdag ut ur Inforutan vore en FORMÄNDRING på en yta vars form Marcus just godkänt, och ADR-103 B2 steg 4 fredar den. Rivning av den döda grenen är däremot additiv-negativ och rör ingen renderad yta. Valet är Marcus.

BESLÄKTAT: TASK-309.18 bär två andra döda kodvägar (adapter-metoder mot en riven Edge Function). Samma klass, olika ursprung — överväg att ta dem i samma pass.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Avgjort och bokfört: rivs BlockDialogs datum-gren, eller flyttas sistaBetalningsdag ut ur Inforutan (formändring, kräver Marcus)?
- [x] #2 Beslutet verkställt; blockDefinitioner.ts:s datum-flagga och dess docblock speglar utfallet (ADR-083 — prosan och koden säger samma sak)
- [x] #3 TASK-309.17:s AC #1 stängd som obsolet med falsifieringen bokförd, eller omformulerad mot det som faktiskt gäller
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
OM-MÄTNING MOT FÄRSK origin/main (Marcus mandat väg A, 2026-08-26, "Du har mandat att ta besluten. Men var noggrann och chansa inte, ta inget för givet."). Premiss-pass kört FÖRE design, per ADR-086.

Verifierade radnummer efter TASK-309.25/.28 landat (grep mot fräsch origin/main HEAD 03f3f455, ingen drift sedan kortets skrivning): blockDefinitioner.ts rad 90 (sistaBetalningsdag, datum: true, enda datum:true i hela filen), GenereringsVy.tsx rad 270 (dialogRader filter), rad 835-836 (INFORUTA_IDN.has ? oppnaMorf : oppnaBlock), rad 941 (lasEndast = r.def.last || arInforutan). Identiska med kortets uppgifter — ingen divergens.

FULLSTÄNDIG GENOMSÖKNING av alla BlockDialog-callers (kortets uppdrag krävde detta uttryckligen, utöver GenereringsVy): grep -rln "BlockDialog" src/ gav FYRA filer — GenereringsVy.tsx, EventinnehallYta.tsx (Mer/Eventinnehåll), PlatserYta.tsx (Mer/Platser), BlockDialog.tsx själv. EVENTINNEHALL_BLOCK (EventinnehallYta.tsx rad 60-95) och PLATS_BLOCK (PlatserYta.tsx rad 45-59) är EGNA, platta block-listor (uttryckligen INTE GRUPPER/blockDefinitioner — se filernas egna docblock) — grep "datum" i båda filerna gav NOLL träffar. Ingen av de två Mer-ytorna kan alltså någonsin skicka ett datum:true-block till BlockDialog. Tillsammans med GenereringsVy.tsx:s tre spärrar (bekräftade ovan) är BlockDialog.tsx:s def.datum-gren obevisligen onåbar från SAMTLIGA fyra callers, inte bara den ena kortet nämnde.

VIKTIGT MOTFYND under premiss-passet, INTE i uppdraget: blockDefinitioner.ts:s datum-flagga är INTE bara dödvikt för BlockDialog — den LÄSES av Inforutans sektionsmorf (GenereringsVy.tsx rad 464, r.def.datum ? <DatumEnkel .../> : <Input .../>), en helt annan renderingsväg än den rivna dialog-grenen. DatumEnkel (BlockDialog.tsx) importeras därför fortfarande av GenereringsVy.tsx (rad 63) och används skarpt. Detta VERIFIERADES före rivning (uppdragets egen instruktion: "behåll fältet om Inforutan-morfen använder det ... verifiera!") — flaggan och DatumEnkel-komponenten BEHÖLLS oförändrade i sitt kontrakt. Endast BlockDialog.tsx:s EGEN gren (def.datum ? <DatumEnkel .../> : …, med sin resterandeBeloppHjalp-prop och datumUtanAr-hjälpare) revs, eftersom just DEN vägen är obevisligen onåbar.

RIVET: BlockDialog.tsx — def.datum-ternären i JSX-kroppen, resterandeBeloppHjalp-propen (signatur + docblock), datumUtanAr()-funktionen + dess DAG_MANAD-konstant (endast använda av den rivna grenen, verifierat med grep över hela src/ — noll andra träffar). GenereringsVy.tsx — resterandeBeloppText-konstanten (blev orphanad när propen försvann, enda användningen) + prop-passet till <BlockDialog>.

BEHÅLLET: DatumEnkel-komponenten (BlockDialog.tsx, exporterad), blockDefinitioner.ts:s datum-flagga, sistaBetalningsdag:s datum: true. Samtliga tre docblock (BlockDialog.tsx filhuvud + DatumEnkel + blockDefinitioner.ts:s datum-fält) uppdaterade så prosan speglar exakt vad koden nu gör (ADR-083) — DatumEnkels gamla motivering ("Override-typ som texterna") var sann bara för den rivna callern och korrigerad till att beskriva kvarvarande callerns (morfens) faktiska lagring (Record<string, string>).

PROMOVERINGS-GRINDENS DOCBLOCK (tests/visual/dokument-generering-promoverings-grind.spec.ts) uppdaterat i BÅDA sina DATUM-LÄGET-avsnitt: filhuvudet (§ DATUM-LÄGET + § LÄGES-AXELN, som räknade "TRE kropps-grenar" — nu TVÅ efter rivningen) och Inforutan-morf-describe-blockets docblock (bytte "gör onåbar" (presens, grenen fanns) till "GJORDE onåbar" (grenen är riven, existerar inte längre)). Citerat verbatim ur denna fil i BlockDialog.tsx:s egen docblock, per uppdragets instruktion att citera spec-filens ursprungligen korrekta docblock.

GRINDAR, MÄTTA (samtliga kommandon körda i FÖRGRUNDEN, exitkod läst separat från utfilen — aldrig via pipe till tail):
- npm run typecheck: EXIT 0
- npx @biomejs/biome check .: EXIT 0 (11 varningar/61 infos, samtliga pre-existerande i src/styles/base.css, noll träffar i de fyra rörda filerna — verifierat med grep mot utfilen)
- npm run build: EXIT 0
- node scripts/check-langa-streck.mjs (src/ rört): EXIT 0 — "260 fil(er) skannade, 0 ofångade långa streck"
- npm run check:docs: EXIT 0 — "14 gröna" (matchar CLAUDE.md:s TASK-161.2-räkning, inte den stale "13"/"nio")
- npm run test:api:pure: EXIT 0, 756 passed (test:api:staging BLOCKERAD av repots egen TASK-77-preflight: post-merge.yml kör LIVE mot staging just nu, run 32933738164, in_progress — preflighten vägrade korrekt köra en konkurrerande lokal körning mot samma delade Airtable-bas. Ingen kod i denna PR rör API/data/Edge Functions, så api-pure — som passerade rent — täcker allt som kan påverkas.)
- Riktade acceptance-tester: tests/acceptance/mer-eventinnehall.acceptance.test.ts + mer-platser.acceptance.test.ts (6/6 passed) + dokument-event-mallad-inaktuell/dokument-genereringsvy-optimistisk-sparning/dokument-mallrad-genererings-entre/dokument-rackviddsval (23/23 passed) — samtliga ytor kortet pekade ut (GenereringsVy, mer-eventinnehall, mer-platser) plus angränsande genereringsvy-acceptance.
- Promoverings-grinden SJÄLV (tests/visual/dokument-generering-promoverings-grind.spec.ts, --project=visual-desktop --project=visual-mobile): 12/12 passed, INKLUSIVE testet "datum-läget — Sista betalningsdag" (test 6, morfen). git status --porcelain på tests/visual/__aria__/ gav NOLL ändrade filer — ariaSnapshot-paren (block-dialog-{text,agenda,plats} + inforutan-morf-datum, alla desktop+mobil) är BYTE-IDENTISKA före/efter. tasks/sessions/bilagor/s108-generering/ (facit-bilder + facit.json med "godkand"-stämpeln) likaså NOLL ändringar (git status --porcelain tomt) — rörs aldrig av denna rivning, precis som uppdraget krävde.

TASK-309.17 stängs som obsolet i samma landning (se det kortets egna notes för falsifieringen, bokförd med intentionally-unchecked-etiketten + OBOCKAT MED AVSIKT-markören per ADR-127 B2).

RÄTTELSE 2026-08-26 (orkestreraren, efter review-agentens fynd på #2005): notes ovan påstår att s108-generering/facit.json bär godkand-stämpeln — FEL. Fältet är null (ostämplat; stämplingen är Marcus egen kanal, ADR-104). Manifestet är orört av PR:en. Formuleringen 'godkand-stämplat' ska läsas som 'ostämplat facit-manifest, orört'.

Stängningssvansen (S108 resume 13): verifierad MERGED via gh pr view — PR #2005, merge-SHA 73073a6989f664508185b48dd013e0f4f044442a, mergad 2026-08-26T06:03:43Z (matchar kortets egen Final Summary-landningspekare). AC 3/3 och DoD 3/3 redan avbockade.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
BlockDialogs onåbara datum-gren riven (väg A, Marcus mandat 2026-08-26). Om-mätning mot färsk origin/main bekräftade kortets premiss ORÄNDRAD (radnummer identiska) och utvidgade den: samtliga fyra BlockDialog-callers (GenereringsVy, mer-eventinnehall, mer-platser, BlockDialog.tsx självt) saknar väg till ett datum:true-block. blockDefinitioner.ts:s datum-flagga och DatumEnkel-komponenten BEHÖLLS — de driver Inforutans sektionsmorf, en annan renderingsväg. Rivet: def.datum-grenen, resterandeBeloppHjalp-propen, datumUtanAr()+DAG_MANAD. Fyra filer ändrade (BlockDialog.tsx, GenereringsVy.tsx, blockDefinitioner.ts, tests/visual/dokument-generering-promoverings-grind.spec.ts — docblock-precision, ADR-083). Grindar: typecheck/biome/build/check-langa-streck/check:docs/test:api:pure alla EXIT 0; 6+23 acceptance-tester gröna; promoverings-grindens 12 ariaSnapshot-tester gröna med paren BYTE-IDENTISKA (git status --porcelain tomt på tests/visual/__aria__/ och tasks/sessions/bilagor/s108-generering/). TASK-309.17 stängt som obsolet i samma landning.

Landning: PR #2005 (https://github.com/high-five-group/miranon-media-admin/pull/2005).
<!-- SECTION:FINAL_SUMMARY:END -->
