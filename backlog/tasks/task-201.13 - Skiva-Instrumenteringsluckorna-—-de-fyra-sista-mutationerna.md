---
id: TASK-201.13
title: 'Skiva: Instrumenteringsluckorna — de fyra sista mutationerna'
status: Done
assignee: []
created_date: '2026-08-13 18:54'
updated_date: '2026-08-14 18:38'
labels: []
dependencies: []
parent_task_id: TASK-201
ordinal: 383000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus-order 2026-08-13 ("Jag vill inte ha en enda lucka, varför skulle vi tillåta det????") upphäver TASK-201.4s bokförda avgränsning. Den vilade på ett RÄKNINGS-argument (PRD:ns "~11" räknade inte in de fyra); PRD TASK-201s användarberättelse 9 — Lotta ska aldrig behöva tvivla på att appen minns — är ett FÖRTROENDE-argument och slår räkningen.

Fyra hooks: useUpdatePaymentNote, useLogPaymentReminder (registrationPayments.ts), useConfirmAll (registrationConfirmation.ts), useSendActionTestEmail (actionEmail.ts).

ABSOLUT MAILFÖRBUD: tre av fyra är mail-relaterade. Koden instrumenteras; hooksen utlöses ALDRIG skarpt. All verifiering mot fixturvärld/enhetsnivå.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Samtliga fyra instrumenterade via onSuccess enligt etablerat mönster — mutationskatalogen VERIFIERAD (mät, anta inte): noll differens mellan exporterade mutationshooks och instrumenterade
- [x] #2 Bulk-designvalet för useConfirmAll avgjort och MOTIVERAT i kod + kort (en post per anmälan kontra en samlad)
- [x] #3 useUpdatePaymentNote: loggen bär ATT en notering ändrades, ALDRIG innehållet — bevisat på den FAKTISKA utgående payloaden, tvåriktat (injicerad läcka fäller)
- [x] #4 Tvåriktat bevis per ny instrumentering: posten skapas vid lyckad mutation, skapas INTE vid misslyckad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BYGGT (egen worktree, agent-a8d1a631c292466d9), gren feat/task-201-13-instrumenteringsluckor.

MUTATIONSKATALOGEN — MÄTT EFTER ÄNDRINGEN (AC #1, ADR-086):
  exporterade mutationshooks i src/data/mutations/*.ts : 15
  recordActivity-anropsplatser                          : 15
  mutationsfiler UTAN recordActivity                    : 0
NOLL DIFFERENS. Kommandon: grep -rn '^export function use|^export const use' src/data/mutations/*.ts | wc -l · grep -rn 'recordActivity({' src/data/mutations/ | wc -l · grep -rLn 'recordActivity' src/data/mutations/*.ts (tom utdata). Före ändringen: 15 / 11 / 4.

PREMISS-PASS (ADR-086) — EN DIVERGENS, uppdragets tabell rättad mot disk: uppdraget angav useLogPaymentReminder och useUpdatePaymentNote i registrationConfirmation.ts (rad 250 resp. 187). RADNUMREN STÄMMER men FILEN ÄR FEL — båda bor i registrationPayments.ts. Bekräftat med grep mot src/data/mutations/*.ts; TASK-201.4s egna notes säger samma sak. Ej blockerande, byggt mot verkligheten. Uppdragets tal '15 exporterade, 11 med recordActivity' prövades och HÖLL exakt.

FYND SOM ÄNDRAR UPPDRAGETS BILD — TVÅ AV FYRA HOOKS ÄR DÖD KOD: useConfirmAll och useLogPaymentReminder har NOLL anropsplatser i src/. Verifierat repo-brett (exkl. node_modules/.git/dist): endast definitionen, kommentarer och backlog/docs-omnämnanden — ingen konsument. Orsakerna är bokförda i koden själv:
  · useConfirmAll — enda konsumenten (Deltagare.tsx 'Hantera-flödet') RIVEN i TASK-145.3 (Deltagare.tsx rad ~1421). Bulk-bekräftelsen bor på Åtgärds-sidan och går genom useSendActionEmail, som redan är instrumenterad.
  · useLogPaymentReminder — mailto-eran är över (AtgardsSida.tsx rad ~2474); Betalningar.tsx rad ~355-369 bokför att konsumenten revs i TASK-145.6.
BESLUT: instrumenterade dem ÄNDÅ. Marcus order är noll luckor, och en mekanisk invariant ('varje exporterad mutationshook loggar') är värd mer än en undantagslista — den kan grindas. RIVNING AV DE TVÅ DÖDA HOOKSEN ÄR INTE TAGEN: det är ett scope-beslut som tillhör Marcus, och det föreslås öppet i stället för att utföras.

BULK-DESIGNVALET (AC #2) — EN POST PER BEKRÄFTAD ANMÄLAN, inte en samlad. Tre skäl, det första avgörande:
 1. PERSON-TIDSLINJEN. PERSON_ID_EXTENSION_IRI (TASK-201.12) är det som gör att ett statement syns under RÄTT person. En samlad post kan bära exakt ETT personId — bekräftar Lotta åtta personer saknar sju av dem varje spår av sin egen bekräftelse. Precis det tvivel användarberättelse 9 finns för att ta bort.
 2. SYSKON-PRECEDENTEN. useSendActionEmail är den andra äkta bulken och loggar redan en post per faktiskt sänd mottagare.
 3. OBJEKT-MODELLEN. object är den SPECIFIKA anmälan; en samlad post har inget koherent objekt utan att en pseudo-entitet uppfinns.
Priset (en bulk ger många rader) är medvetet taget — gruppering är läsvyns jobb, inte skrivvägens att slänga sanning. Verb och objekttyp ÅTERANVÄNDA från useSendConfirmationFromDetail: historiken ska inte kunna se skillnad på om Lotta bekräftade en person från detaljvyn eller åtta från bulken.
AVVIKELSE FRÅN SYSKONET, medveten: useSendActionEmail gör 'if (!reg) continue' när cachen saknar raden — det SLÄPPER en post. useConfirmAll loggar i stället med namn-fallback 'Okänd anmälan': servern HAR bekräftat anmälan, och ett tomt klient-cacheläge får aldrig radera en sann händelse. REKOMMENDATION till Marcus: samma fallback hör troligen hemma i useSendActionEmail också — ej ändrad här (redan landad, instrumenterad kod; scope).

NYA VERB (activityTypes.ts) — INGEN NY OBJEKT-KATEGORI mintad; betalning och mail fanns redan i katalogen: betalningsnoteringVerb(betalning) och betalningspaminnelseVerb(betalning) (två varianter var, suffixad IRI), SKICKADE_TESTMAIL_VERB (konstant). Påminnelseverbet säger 'antecknade', ALDRIG 'skickade': mailto-sändningen kan inte observeras av appen, och ett 'skickade' hade återinfört exakt den stämplingslögn AtgardsSida/Betalningar rev. Skilt från mailVerb('paminnelse'), som gäller den server-sida vägen där sändningen FAKTISKT är observerad.

TESTMAILET — SERVERN ÄR FACIT: EF:en svarar HTTP 200 även när sändningen FÖLL (status 'sent' | 'failed'), så onSuccess grindar på result.status !== 'sent'. Utan grinden hade en naiv instrumentering loggat ett utskick som aldrig skedde. Objektet är EVENTET, inte platshållar-mottagarens anmälan. eventNamn hook-bundet, samma form som useCreateEventNote; propen valtEvent fanns redan i GranskningsSida — ingen ny trådning.
BEDÖMNING (uppdraget bad om den): posten är INTE brus. Loggen svarar på vad LOTTA GJORDE, inte vilka fält som ändrades — ett mail lämnade systemet på hennes kommando. Testgrenen skriver medvetet ingen Maillogg-rad heller, så activity_log är ENDA stället det syns; utan posten är frågan 'skickade jag ett testmail innan jag skickade skarpt?' obesvarbar. Volymen är låg (ett klick per granskning) och verbet är entydigt skilt från skarpa utskick.

INTEGRITETEN (AC #3) — TVÅRIKTAT BEVIS, mätt:
 · Strukturellt: onSuccess destrukturerar MEDVETET inte notering — fritexten finns inte ens som binding i scopet.
 · Payload-nivå, api-pure: activity-log-luckor-statements.test.ts § 2 kör den FAKTISKA composern och läser den FAKTISKA utgående kroppen.
 · Payload-nivå genom den RIKTIGA hooken, acceptance: atgarder-betalningsnotering-logg.acceptance.test.ts driver Åtgärds-sidans verkliga noteringsfält och läser kroppen där den lämnar klienten.
 · FÄLLNINGSBEVIS: injicerade ': notering' i hookens object.name → acceptance-testet FÖLL och namngav fritexten ('HELA noteringen läckte in i aktivitetsposten') med hela payloaden dumpad. Läckan återställd BIT-IDENTISKT (git checkout --; filen står oförändrad mot commit 46b92459). Sviten åter grön 2/2. Första fällningen skedde på NAMN-assertionen, som skuggade integritets-assertionen — assertionerna omordnades så integriteten prövas först (commit 91e2c717), annars hade en äkta läcka sett ut som en formuleringsavvikelse.

TVÅRIKTAT PER INSTRUMENTERING (AC #4):
 · betalningsnotering: skrivning OK → exakt 1 post + fritextfri kropp; skrivning 422 → 0 poster (felytan 'Kunde inte spara' bekräftar att mutationen faktiskt föll).
 · testmail: status 'sent' → 1 post, objektet är eventet; status 'failed' → 0 poster. Den andra är skarpast: HTTP 200 vid fallen sändning.
 · useConfirmAll / useLogPaymentReminder: KAN INTE bevisas på acceptance-nivå — de har ingen UI att driva (död kod, se ovan). Beviset är statement-/composer-nivå i api-pure-sviten. ÖPPET REDOVISAT, inte påstått starkare än det är.
Båda negativa sensorerna är märkta med medvetetOanvand() + nedskrivet skäl; överskuggnings-vakten fällde dem först som döda registreringar, vilket är dess egen dokumenterade falska positiv för denna testklass.

GRINDAR (mätta, exitkoder fångade separat):
 · npm run typecheck              exit 0
 · npx @biomejs/biome check .     exit 0 (efter --write på rörda filer)
 · npm run build                  exit 0
 · npm run test:api:pure          exit 0 — 449/449, inkl. 10 nya
 · acceptance (två rörda filer)   exit 0 — 2/2 respektive 6/6
 · npm run test:api (fullt)       exit 1 — MEN INTE ett kodfel: staging-preflighten (TASK-77) stoppade api-staging-benet eftersom CI höll staging (post-merge.yml run 31732359688 in_progress). 449 passed / 271 did not run. MM_STAGING_PREFLIGHT=off användes MEDVETET INTE — staging är en delad bas och en lokal körning kunde ha gett falskt rött på det landade trädet. Öppen punkt för orkestreraren: api-staging-benet är CI:s jobb här.

INGA MAIL SKICKADE. Ingen hook utlöstes skarpt; all verifiering mot fixturvärld (MSW) och injicerade adapter-stubs. Inga supabase-kommandon kördes. Prod orörd.

DOD-VERIFIERING (orkestrerar-agent, ADR-086, 2026-08-14): PR #1261 MERGED 2026-08-13T19:32:55Z, merge-commit f727f921675dbacb1cd03c94087a4895767d2849 — bekräftat ancestor av origin/main (git merge-base --is-ancestor). Merge-queue-körningen (event merge_group, run 31735456957, gren gh-readonly-queue/main/pr-1261-...) är GRÖN PER JOBB: Lint+Audit+TypeCheck success, Docs link check success, Acceptance (hermetisk) success, Webblasarbeteende success, Pure+Build success, A11y/Staging(API+E2E)/Staging sentinel purge skipped (förväntat — samma mönster som kortets egna notes om staging-preflighten lokalt), gate 'CI Passed or Skipped' success. DoD #3 uppfyllt av merge-queue-körningen, inte den lokala (som redan var öppet redovisad som staging-blockerad, ej kodfel). DoD #4: gh pr diff 1261 --name-only — nio filer, samtliga inom scope (två backlog-kort, fyra mutations-/komponentfiler, tre test-filer). Noll orelaterade filer. DoD #2 vilar på kortets egna mätta grindutfall (typecheck/biome/build/test:api:pure/acceptance, alla exit 0, se ovan).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fyra instrumenteringsluckor stängda (useUpdatePaymentNote, useLogPaymentReminder, useConfirmAll, useSendActionTestEmail) — mutationskatalogen visar 15/15, noll differens. Två av fyra hooks (useConfirmAll, useLogPaymentReminder) visade sig vara död kod (konsumenter rivna i TASK-145.3/145.6); instrumenterade ändå för invariantens skull, rivning ej tagen (Marcus scope-beslut, ej utfört). Bulk-designvalet: en post per bekräftad anmälan (person-tidslinjen kräver det). Integriteten (ingen fritext i loggen) bevisad tvåriktat med injicerad-läcka-fällningstest. Landat via PR #1261, MERGED 2026-08-13T19:32:55Z. Merge-queue-körningen (run 31735456957) grön per jobb, inga orelaterade filer i diffen.
<!-- SECTION:FINAL_SUMMARY:END -->
