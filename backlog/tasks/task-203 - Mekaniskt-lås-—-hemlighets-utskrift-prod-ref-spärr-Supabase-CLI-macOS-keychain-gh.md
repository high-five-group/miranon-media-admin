---
id: TASK-203
title: >-
  Mekaniskt lås — hemlighets-utskrift + prod-ref-spärr (Supabase CLI, macOS
  keychain, gh)
status: In Progress
assignee: []
created_date: '2026-08-12 15:44'
updated_date: '2026-08-12 16:02'
labels: []
dependencies: []
ordinal: 378000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND-kort, byggt på direkt Marcus-order 2026-08-12 (verbatim): "Fixa skiten för gott, så det aldrig händer varken staging eller prod. Gör det PROFFSIGT!"

## Incidenten (källa: uppdragstext till bygg-agenten, 2026-08-12)

`npx supabase projects api-keys --project-ref pqtshyierkdgwdnxuirz -o json` skrev ut den fullständiga legacy service_role-JWT:n i klartext — UTAN `--reveal`. Nyckeln hamnade i ett agent-transkript. Marcus verifierade efteråt: nyckeln fanns varken i `~/.zshrc` eller i någon `.env`-fil — CLI:t hämtade den live och skrev ut den. Ingen spärr fanns i första ledet.

Prod-skydds-kortet var sedan tidigare föreslaget och obesvarat (källa: `tasks/todo.md` rad 47, "Öppet beslut: prod-skydds-kortet") — denna order är dess kvittens, båda byggs i samma arbete.

## Två oberoende lås, samma mönster som TASK-137 (MAIL-LÅSET, närmaste släkting)

**Lås 1 — `scripts/deny-hemlighet-utskrift.sh` + `.hemlighet-utskrift-policy.conf`.** Blockerar Bash-kommandon som skriver ut en hemlighets VÄRDE (inte dess existens/digest). Fail-closed (exit 2 på varje nekande väg och varje internt fel), matchar TASK-137:s motivering: skadan (ett värde i ett transkript) är irreversibel.

**Lås 2 — `scripts/deny-prod-ref.sh` + `.prod-ref-policy.conf`.** Blockerar agent-Bash-kommandon som nämner produktions-Supabase-projektets ref (`lvjsfnphlauldxqlncpl`, verifierad mot `docs/reference/atkomst-och-nycklar.md` § Register, oberoende andra källa än uppdragstexten). Staging-ref (`pqtshyierkdgwdnxuirz`) är ORÖRD. Konsekvens, öppet bokförd: agent-drivna prod-EF-deployer via `scripts/deploy-prod-functions.sh` (tidigare körda under Marcus verbala GO, se `tasks/todo.md` S84/S102-historik) kan inte längre köras av en agent — kräver antingen Marcus egen terminal (utanför Claude Code, hooken ser bara Claude Codes Bash-anrop) eller den designade medvetna vägen förbi.

## Fulla listan + gränsfallsmotivering

Se scriptens egna header-kommentarer för den uttömmande listan och per-gränsfall-motivering (samma disciplin som `.mail-lock-policy.conf`). Sammanfattning:

BLOCKERAS (skriver ut VÄRDE):
- `supabase projects api-keys` — MED och UTAN `--reveal` (incidenten hände utan flaggan)
- `supabase secrets list --reveal` — defensivt inkluderad; disk-verifierat 2026-08-12 att CLI 2.113.0 REDAN avvisar flaggan (`UnrecognizedOption`) — se premiss-avsnittet i slutrapporten
- `security find-generic-password ... -w` (värde only) och `... -g` (värde + attribut)
- `security dump-keychain ... -d` (eller kombinerad flagga som innehåller d, t.ex. `-ad`) — dumpar HELA nyckelringen dekrypterad
- `gh auth token` — skriver ut aktivt PAT rakt av
- `gh auth status ... -t`/`--show-token`

SLÄPPS IGENOM (existens/digest, redan legitimt bruk i repot):
- `security find-generic-password -s <tjänst>` utan `-w`/`-g` (använts av `scripts/atkomst-diagnos.sh` rad 221, existens-check mot /dev/null)
- `gh secret list`, `supabase secrets list` utan `--reveal` (GitHubs API returnerar aldrig värden ens om man ville)
- `security dump-keychain` utan `-d`/kombinerad d-flagga (metadata only, redan använt i `docs/reference/atkomst-och-nycklar.md`)
- `gh auth status` utan `-t` (redan använt i samma dokument)

MEDVETET UTANFÖR SCOPE (motiverat, inte tyst): `.env*`-filläsning (cat/grep mot lokala env-filer) — det är en annan riskklass (statisk lokal fil, inte en live-hämtning från ett valv) och att blockera den skulle bryta etablerade, legitima flöden (`ls -1 .env*` i `atkomst-diagnos.sh`, CONTRIBUTING.md:s egna env-instruktioner). Incidenten var specifikt en CLI som HÄMTAR OCH SKRIVER UT en levande hemlighet — det är den klassen detta lås stänger.

## Den medvetna vägen förbi (prod-ref-låset)

Miljöfaktum som styr designen: en PreToolUse-hook ser BARA Claude Codes egna Bash-anrop — den kan aldrig se eller påverka ett kommando Marcus skriver i sin egen terminal utanför Claude Code. Den vägen kräver ingen mekanism alls; den är strukturellt garanterad redan av hur hooken fungerar.

Utöver det byggs en explicit, avsiktligt ograciös bypass FÖR fall där Marcus vill dirigera en agent i chatten: miljövariabel-prefix på SAMMA kommandorad, vars krävda värde är prod-refen SJÄLV (samma typa-för-att-bekräfta-mönster som GitHubs repo-radering/Herokus `--confirm APP_NAME`) — se scriptets header för exakt namn och form. En agent konstruerar inte denna prefix-form av vana; den kräver att någon (Marcus, i klartext) uttryckligen dikterar den. Varje användning loggas synligt (aldrig tyst).

## Öppen skuld (bokförd, inte gjord)

Skarpbevis att hooken faktiskt LADDAS och fäller i en session startad EFTER denna landning är INTE gjort i detta kort (CLAUDE.md § "En ny hooks skarpbevis…" — kan inte förlitas på i byggsessionen). Logiken är bevisad via testsviterna + manuell körning mot verkligt tillstånd. Nästa sessions ansvar att betala skulden, ELLER stängs tidigt om hooken fäller skarpt redan under detta korts eget arbete (samma instans-regel som `task-167`).

## Källor

Uppdragstext till bygg-agenten, 2026-08-12 (Marcus-citat + incidentbeskrivning).
`tasks/todo.md` rad 47 (prod-skydds-kortets tidigare, obesvarade status).
`docs/reference/atkomst-och-nycklar.md` § Register (oberoende bekräftelse av båda project-refs).
`npx supabase projects api-keys --help` / `npx supabase secrets list --reveal` (körda 2026-08-12 mot installerad CLI 2.113.0).
`man security` (macOS, körd 2026-08-12) — find-generic-password/dump-keychain flaggsemantik.
`gh auth token --help` / `gh auth status --help` (körda 2026-08-12).
`scripts/deny-resend-send.sh` + `.mail-lock-policy.conf` (TASK-137, formmall).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 scripts/deny-hemlighet-utskrift.sh finns, fail-closed (exit 2 på varje nekande + varje internt fel), config-driven via .hemlighet-utskrift-policy.conf — blockerar minst: supabase projects api-keys (med/utan --reveal), supabase secrets list --reveal, security find-generic-password -w/-g, security dump-keychain -d (inkl. kombinerad flagga), gh auth token, gh auth status -t/--show-token
- [x] #2 scripts/deny-prod-ref.sh finns, blockerar agent-Bash-kommandon som nämner produktions-Supabase-refen (lvjsfnphlauldxqlncpl) — staging-refen (pqtshyierkdgwdnxuirz) förblir opåverkad; en designad, dokumenterad medveten väg förbi finns för Marcus, formad så en agent inte kan trigga den av vana
- [x] #3 scripts/test-deny-hemlighet-utskrift.sh och scripts/test-deny-prod-ref.sh bevisar båda riktningarna (planterade förbjudna kommandon NEKAS exit 2, legitima kommandon SLÄPPS exit 0) — körda, exitkod fångad separat (aldrig genom en pipe), resultat rapporterat verbatim
- [x] #4 Båda hookarna registrerade i .claude/settings.json PreToolUse med statusMessage i husets stil; båda .conf-filerna wirade in i ci.yml:s shellcheck-strict-scope med uppdaterad räkning
- [x] #5 shellcheck --severity=style --enable=all grön (0/0/0/0) på de nya skripten och conf-filerna; npm run check:docs och npx @biomejs/biome check . gröna
- [x] #6 Premiss-pass redovisat i slutrapporten: båda project-refs verifierade mot minst två oberoende källor, samt varje avvikelse mot uppdragets ordalydelse (t.ex. --reveal-flaggans faktiska status i installerad CLI) öppet bokförd
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererat: två oberoende mekaniska PreToolUse-lås, samma trelagers-mönster som TASK-137 (MAIL-LÅSET) minus lager 1 (permissions.deny passar inte Bash-fri-textmatchning).

scripts/deny-hemlighet-utskrift.sh + .hemlighet-utskrift-policy.conf: blockerar (exit 2, fail-closed) supabase projects api-keys (med/utan --reveal — incidenten hände UTAN flaggan), supabase secrets list --reveal (defensivt — se premiss-divergens nedan), security find-generic-password -w/-g, security dump-keychain -d/kombinerad d-flagga, gh auth token, gh auth status -t/--show-token. Släpper existens-/digest-formerna redan i skarpt bruk (atkomst-diagnos.sh rad 221, atkomst-och-nycklar.md). scripts/test-deny-hemlighet-utskrift.sh: 24/24 gröna (9 NEKAS + 9 SLÄPPS + 5 fail-closed + E1).

scripts/deny-prod-ref.sh + .prod-ref-policy.conf: blockerar VARJE Bash-kommando som nämner produktions-Supabase-refen (lvjsfnphlauldxqlncpl), oavsett subkommando — medvetet bredare än uppdragets exempellista (link/db push/functions deploy/secrets set) eftersom en ren ref-match inte behöver hållas i synk med varje nytt skrivande CLI-subkommando och även täcker rå curl mot Management-API samt scripts/deploy-prod-functions.sh:s wrapper-anrop. Staging-refen opåverkad. Medveten väg förbi: (1) strukturellt redan öppen — Marcus egen terminal utanför Claude Code, hooken ser bara Claude Codes Bash-anrop, (2) designad typa-för-att-bekräfta-bypass (PROD_REF_GODKAND_AV_MARCUS=<prod-ref> inline på samma kommandorad, loggas alltid synligt). Öppen, ärligt bokförd begränsning: skriptets källkod är läsbar av varje agent — bypass-formen är dokumenterad konvention + smal teknisk spärr, inte matematiskt outbrytbar (samma avvägningsklass som ADR-104:s "!"-kanal). KONSEKVENS: agent-drivna prod-EF-deployer via deploy-prod-functions.sh (tidigare körda under Marcus verbala GO) kräver nu antingen hans egen terminal eller den designade bypass-formen. scripts/test-deny-prod-ref.sh: 21/21 gröna (6 NEKAS + 2 fel-bypass-NEKAS + 5 SLÄPPS + 2 korrekt-bypass-SLÄPPS + 5 fail-closed + E1).

Båda hookarna registrerade i .claude/settings.json (matcher Bash, statusMessage i husets stil). Båda .conf-filerna wirade in i ci.yml:s shellcheck-strict-scope (räkningen 25→27, TASK-203-raden tillagd i kommentarhistoriken).

Grindar körda och gröna: shellcheck --severity=style --enable=all (0.11.0, matchar CI:s pinnade version) 0/0/0/0 på fulla CI-scopet inkl. de nya filerna · actionlint -ignore 'unexpected key "queue"...' 0 fynd · js-yaml-parse av ci.yml OK · npm run check:docs 14/14 gröna · npx @biomejs/biome check . grön · npm run typecheck grön · npm run build grön · npm run test:api: 660/661 gröna, EN förväntad, ORELATERAD, redan spårad avvikelse (attachment-upload-large.staging.test.ts, matchar TASK-196 exakt — In Progress, rotorsakad till storage.list() limit:100 + växande delad testmapp, fix pending EF-deploy som väntar på Supabase-token per dagens sessionsnarrativ; noll commits i denna diff rör supabase/functions, storage eller attachment-testerna). verify:ci-parity kördes INTE (diagnosverktyg, ej rutin — ci.yml-ändringen var additiv/mekanisk, en befintlig steg fick två nya argument, ingen jobbgraf-ändring; validerad i stället direkt: js-yaml + actionlint + den EXAKTA shellcheck-kommandoraden körd lokalt).

Skarpbevis att hookarna faktiskt LADDAS i en session startad EFTER denna landning är INTE gjort (kan inte förlitas på i byggsessionen, CLAUDE.md § "En ny hooks skarpbevis…") — bokförs som ÖPPEN SKULD för nästa session, ej stängd i denna leverans. Logiken är bevisad via testsviterna (45/45) + manuell körning mot verkligt konstruerat hook-JSON.

Premiss-pass (ADR-086): båda project-refs verifierade mot TVÅ oberoende källor (uppdragstexten + docs/reference/atkomst-och-nycklar.md § Register, landad samma dag via oberoende PR #1203) — identiska värden, ingen divergens. Prod-skydds-kortets tidigare "föreslaget och obesvarat"-status verifierad ordagrant mot tasks/todo.md rad 47. DIVERGENS FUNNEN OCH BOKFÖRD: uppdraget nämner "supabase secrets list --reveal" som ett kommando att blockera — disk-verifierat 2026-08-12 att installerad CLI 2.113.0 REDAN avvisar flaggan (`{"code":"UnrecognizedOption","message":"Unrecognized flag: --reveal in command supabase secrets list"}`, körd direkt, ingen verklig hemlighet exponerad). Mönstret behölls ändå, defensivt/framtidssäkert, men är i dag inert — CLI:t skulle redan fela innan mönstret någonsin behöver träda in. `supabase projects api-keys` (utan --reveal) reproducerades AVSIKTLIGT INTE mot en riktig prod-ref under detta arbete — det vore att återskapa exakt den incident kortet finns för att stänga; incidentens faktiska utfall togs som källmärkt fakta från Marcus egen order i stället.
<!-- SECTION:FINAL_SUMMARY:END -->
