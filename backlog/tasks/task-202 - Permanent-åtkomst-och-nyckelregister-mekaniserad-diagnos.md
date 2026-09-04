---
id: TASK-202
title: Permanent åtkomst- och nyckelregister + mekaniserad diagnos
status: Done
assignee: []
created_date: '2026-08-12 14:27'
updated_date: '2026-08-14 15:45'
labels:
  - docs
  - tooling
dependencies: []
ordinal: 377000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rotorsakat av orkestreraren (S105, 2026-08-12, källa: uppdragstext denna session): Marcus har två gånger blivit ombedd att skapa åtkomster han redan har, plus en återkommande 'ibland läsbara ibland inte'-upplevelse med ~/Downloads. Rotorsak 1: en token-utredning (tasks/sessions/archive/2026-08/2026-08-11-session-105.md Del 4, rad ~325-331) mätte OMGIVNINGEN (printenv, ~/.supabase/, CI-workflows) i stället för ÅTKOMSTEN och drog en falsk slutsats om SUPABASE_ACCESS_TOKEN — Supabase CLI hade en giltig keyring-inloggning (konto 'supabase', skapad 2026-03-30, verifierat i denna session via security dump-keychain) hela tiden; https://supabase.com/docs/reference/cli/introduction bekräftar att native credentials storage är primärvägen och ~/.supabase/access-token bara reservplatsen. Rotorsak 2: macOS TCC-behörighet ges per VÄRDAPP, inte per verktyg — samma agentprocess kan läsa Desktop men nekas Downloads beroende på vilken app som startade kedjan.

Bygger fyra artefakter: (1) docs/reference/atkomst-och-nycklar.md — registret, med bevis-kommando per åtkomst och klass-distinktion PAT/projektnyckel, (2) scripts/atkomst-diagnos.sh + npm run atkomst:diagnos — mekaniserad självdiagnos, shellcheck-strict, exit 0 alltid, (3) lesson-fragment i tasks/lessons.d/ märkt [UNIVERSAL], (4) pekare i CLAUDE.md § Verktygsfakta som lätt gissas fel.

Se kortets Implementation Notes vid stängning för fullständigt premiss-pass-utfall (bygg-agentens egna mätningar mot uppdragets, inklusive minst en funnen divergens).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 docs/reference/atkomst-och-nycklar.md finns: regel i fetstil överst (mät åtkomsten, inte omgivningen), tabell per åtkomst (namn/plats/klass/vad den öppnar/bevis-kommando/senast verifierad), klassdistinktion Supabase PAT (sbp_) vs projektnycklar (sb_publishable_/sb_secret_/anon/service_role JWT), fil-åtkomstmatris per värdapp med mätdata + ~/Documents-anomalin öppet bokförd som omätt, manuell Downloads-fix med varför den inte automatiseras, inga hemliga värden i filen
- [x] #2 scripts/atkomst-diagnos.sh finns, körbar via npm run atkomst:diagnos: skriver värdapp, faktisk läsbarhet Downloads/Desktop/Documents (rc+stderr separat, inte pipe-formen), TCC-uppslag + fix vid NEKAD, nyckelringspost-namn (aldrig värden), gh auth status + npx supabase projects list (bounded, tydligt utfall vid timeout), exit 0 alltid; klarar shellcheck strict
- [x] #3 Lesson-fragment i tasks/lessons.d/ märkt [UNIVERSAL]: mät åtkomsten innan du deklarerar att den saknas, med den inverterade bevisningen (tom ~/.supabase/ som bevis för rätt lagring) och hängnings-är-inte-ett-felmeddelande-tvåbottningen (TASK-201.2-instansen) som konkreta instanser
- [x] #4 Pekare i CLAUDE.md § Verktygsfakta som lätt gissas fel till registret + diagnosskriptet, kort
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
PREMISS-PASS (ADR-086), utfört av bygg-agenten 2026-08-12 innan design:

VERIFIERAT MOT DISK/LIVE (samtliga stämde med uppdraget, källa bygg-agentens egen körning):
- Supabase CLI-nyckelring: security dump-keychain → tjänst "Supabase CLI", acct "supabase", cdat 20260330064650Z (2026-03-30) — matchar uppdraget exakt.
- npx supabase projects list → båda projekten listade direkt (staging pqtshyierkdgwdnxuirz, prod lvjsfnphlauldxqlncpl).
- TASK-201.2 Implementation Notes läst ordagrant via `npx backlog task 201.2 --plain` — citatet om "hängde oändligt" verifierat verbatim.
- ~/.zshrc rad 7-9 (GITHUB_PERSONAL_ACCESS_TOKEN via keychain "github-pat") och rad 15-17 (OPENAI_API_KEY via "openai-api-key") — läst direkt, matchar exakt.
- gh secret list → alla 8 secrets matchar uppdragets lista exakt.
- 9 .env-filer i repo-roten — räknat, stämmer exakt.
- Supabase-dokumentationens citat (CLI native credentials storage; PAT-prefix sbp_; sb_publishable_/sb_secret_ vs legacy anon/service_role JWT) — läst via WebFetch, citaten verbatim i registret.

DIVERGENSER FUNNA AV BYGG-AGENTEN (rapporterade öppet, byggda på INTE tyst):
1. System-TCC.db (/Library/...) BÄR en VS Code-post (kTCCServiceSystemPolicyAllFiles=2), trots att uppdraget påstod att ingen sådan post fanns. Bokfört i registret — gör TCC-gåtan djupare, inte grundare (Full Disk Access borde INTE ge nekad Documents-läsning).
2. Bygg-agentens egen session uppvisade INTERMITTENS: vid sessionsstart nekades alla tre kataloger (Downloads/Desktop/Documents); senare i SAMMA session (efter att skriptet byggts och körts) blev Desktop OK utan känd utlösande händelse, medan Downloads/Documents förblev NEKAD. Fullständig tidsordning i registret § Fil-åtkomstmatris.

STOPP OCH RÄTTELSE MITT I UPPDRAGET (orkestrerarens meddelande, källmärkt S105 2026-08-12): den ursprungliga TCC-kausala förklaringen för Downloads-nekandet ("com.microsoft.VSCode/kTCCServiceSystemPolicyDownloadsFolder=0 är boven, fixen är Systeminställningar-togglen") FALSIFIERADES — TCC-raden är oförändrad sedan 2026-01-03 men session S104 (2026-08-10) läste ~/Downloads FRAMGÅNGSRIKT med exakt samma rad (transkript-belägg: ~/.claude/projects/.../a02154a9-654a-4f95-9120-0e8b18398ffc.jsonl). Registret och diagnosskriptet SKREVS OM: TCC-tabellen står kvar som verifierad mätning men INTE som förklaring; "Downloads-fixen" nedgraderad till "möjlig åtgärd, OPRÖVAD"; nytt § Aktuellt öppet läge med hela falsifieringskedjan + version-korrelationen (2.1.226 fungerade / 2.1.227 fungerade inte / 2.1.228 installerad men oprövad) uttryckligen märkt korrelation-inte-orsak; § Nästa mätning skriven för nästa session. Lesson-fragmentet fick en tredje botten (den viktigaste enligt orkestreraren): en förklaring som passar symptomet är inte verifierad förrän den också förklarar frånvaron av symptomet.

GRINDAR (mätta, exitkod separat från output):
- npm run check:docs → KOD=0, "14 gröna" (samtliga dokumentations-grindar). Första körningen: KOD=1, Vale.Terms fällde 3 fel (lowercase "supabase" i länk-text i det nya registret) — fixat genom att backtick-wrappa länk-etiketterna (samma mönster som docs/research/*.md redan använder). Övriga Vale-suggestions i outputen (14 st, "Undvik enkelt/simply") ligger i filer denna PR inte rör — pre-existing, ej åtgärdade.
- npx @biomejs/biome check . → KOD=0.
- shellcheck --severity=style --enable=all scripts/atkomst-diagnos.sh .atkomst-diagnos-policy.conf → KOD=0 (0/0/0/0). Första körningen gav 1 SC2312-info (command substitution i say()-anrop); fixat genom separat variabel-tilldelning.
- actionlint -color -ignore 'unexpected key "queue" for "concurrency" section' → KOD=0 (kört eftersom .github/workflows/ci.yml ändrades för att wire:a in .atkomst-diagnos-policy.conf i shellcheck-strict-scopen, samma konvention som alla 24 tidigare .xxx-policy.conf-tillägg; räkningskommentaren uppdaterad till 25).
- scripts/atkomst-diagnos.sh kört skarpt (bash scripts/atkomst-diagnos.sh) → KOD=0, samtliga sex avsnitt producerade utdata, gh auth status och npx supabase projects list svarade inom tidsbudgeten.

Kortet checkat: AC 1-4, DoD 1/2/4. DoD #3 (CI grön per jobb) lämnas till orkestreraren efter push, per bygg-agent-kontraktet.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängningspass (nattgrind-fix, 2026-08-14, källa: gh run 31766814810 'Backlog-stängning' röd). Ursprungliga bygg-agentens arbete (2026-08-12, Implementation Notes ovan) var fullt levererat men kortet stod kvar på '○ To Do' med DoD #3 avbockad — nightly-grinden fällde på det, inte på faktiskt ofärdigt arbete. Detta pass re-verifierade varje AC mot disk (inte förtroende): AC1 docs/reference/atkomst-och-nycklar.md finns, regelraden (rad 8) och PAT/projektnyckel-tabellen (rad 98-101) och Documents-anomalin (rad 155/169/220) bekräftade. AC2 npm run atkomst:diagnos kört skarpt, KOD=0, gh auth + supabase projects list svarade inom budget. AC3 tasks/lessons.d/mat-atkomsten-inte-forklaringen-som-rakar-passa.md finns, [UNIVERSAL]-märkt (rad 10). AC4 CLAUDE.md-pekare bekräftad (rad 559-562). shellcheck --severity=style --enable=all scripts/atkomst-diagnos.sh .atkomst-diagnos-policy.conf: KOD=0 (tomt, 0 fynd). DoD #3 (CI grön per jobb): PR #1203 (commit d55b4264), merged 2026-08-12T15:11:46Z via merge queue — gh pr view statusCheckRollup: samtliga jobb SUCCESS utom tre förväntat SKIPPED (Staging sentinel purge/A11y/Staging E2E — docs+script-ändring rör aldrig staging). d55b4264 bekräftad som ancestor av HEAD (git merge-base --is-ancestor). Ingen kod ändrad i detta pass — endast kortets metadata.
<!-- SECTION:FINAL_SUMMARY:END -->
