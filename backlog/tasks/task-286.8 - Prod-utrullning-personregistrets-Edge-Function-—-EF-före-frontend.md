---
id: TASK-286.8
title: 'Prod-utrullning: personregistrets Edge Function — EF före frontend'
status: To Do
assignee: []
created_date: '2026-08-22 17:34'
updated_date: '2026-08-22 17:37'
labels:
  - ready-for-human
dependencies: []
parent_task_id: TASK-286
priority: high
ordinal: 538000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
MARCUS-MOMENT. Prod-deploy av Edge Functions kan inte köras av en agent: `scripts/deny-prod-ref.sh` matchar prod-refens närvaro i hela Bash-kommandosträngen och avvisar anropet (`.prod-ref-policy.conf` § Matchning). Vägen är `bash scripts/fas4-prod-deploy.sh --deploya PROD-REF` i Marcus egen terminal eller via `!`-prefixet (CLAUDE.md § Prod-EF-deploy körs via SKRIPTET).

## DELVIS RETROAKTIVT — och det ska stå

`get-persons` ÄR redan deployad till prod. Kortet skapas i efterhand därför att posten aldrig fanns när den behövdes: TASK-286-familjen fick aldrig ett prod-utrullningskort. S110:s parallella spår hade ett (TASK-284.6, Done, "Prod-utrullning: eventlänkens vakt och åtgärdskön") — registerspåret hade inget, så ingen rad i registret sa att Edge Functions måste följa med koden ut.

## Incidenten 2026-08-22 — mätt led för led

Källmärkning: git-/disk-mätningarna nedan är gjorda av denna agent i worktree mot `origin/main` `3849ac5a`. Prod-tidsstämplarna och `ezbr_sha256`-värdena kommer från MARCUS mätning mot prod 2026-08-22 (`supabase functions list` via `fas4-prod-deploy.sh --kontrollera`) — de kan strukturellt inte reproduceras av en agent (prod-låset ovan) och behandlas därför som källmärkt extern mätning, inte som agent-verifierat.

1. FRONTEND GICK LIVE ENSAM. Vercel deployar Production automatiskt från `main`. Commit `d4997b5a` (agent-verifierad committid `2026-08-22 16:28:33 +0000`, "Merge pull request #1802") gick ut i Production `2026-08-22 16:37:26Z` (Marcus mätning). Edge Functions deployas INTE automatiskt — ingen automatik, inget CI-workflow (`docs/reference/prod-driftsattning-runbook.md` rad ~344: "inget CI-workflow refererar `supabase functions deploy`").

2. PROD-EF:EN VAR 31–52 TIMMAR GAMMAL. `get-persons` i prod bar `UPDATED_AT 2026-08-20 07:35:10Z` (Marcus mätning). Agent-verifierat mot git: registerläget landade med TASK-286.1 `22aed794` `2026-08-21 14:31:02 +0200`, och TASK-286.3 `1b226272` `2026-08-22 11:28:06 +0200`. Prod-EF:en var alltså äldre än BÅDA.

3. FÖLJDEN FÖR LOTTA — TYST STYMPNING, INTE ETT FEL. Klienten anropar `get-persons?register=true`. Agent-verifierat i `supabase/functions/get-persons/index.ts`: registerläget är en EGEN TIDIG RETUR (rad 121, en strikt likhetsjämförelse mot query-parametern register=true) som ignorerar sök/cursor/pageSize helt. En EF UTAN den grenen känner inte parametern, faller igenom till sök-/cursor-flödet och klampar `pageSize` till `DEFAULT_PAGE_SIZE = 50` (rad 13). Personlistan visade 50 av 559. Bokstavsraden renderades — men nedtoningen räknas ur registret (TASK-283.3, `0761d3f3`), och registret var stympat, så nästan hela alfabetet stod nedtonat. Ingen 500, ingen röd yta, inget larm: den gamla EF:en svarade korrekt på en fråga klienten inte ställt.

4. EF-DEPLOYEN KÖRDES 2026-08-22 17:13:34Z (Marcus). `ezbr_sha256` för `get-persons` gick `31a8b234…` → `85306a63…`. KONTRASTEN ÄR BEVISET: `get-events` behöll `636539ed…` genom samma deploy — samma innehåll, ny deploy. `ezbr_sha256` skiljer alltså "omdeployad" från "deployad med NY KOD"; varken `VERSION` eller `UPDATED_AT` gör det (`VERSION` bumpas +1 på ALLA funktioner vid en deploy, `UPDATED_AT` står stilla för orörda — CLAUDE.md § Prod-EF-deploy). Samma instrument bar S107:s bevis (`tasks/sessions/2026-08-17-session-107.md` rad ~302: "Innehålls-hashen (`ezbr_sha256`) bytte på samtliga nio S107-rörda funktioner — starkare bevis än `UPDATED_AT`").

5. PROD VAR FORTFARANDE FEL EFTER DEPLOYEN — den persisterade cachen. Agent-verifierat i `src/queries/persist.ts`: hela query-cachen persisteras i `localStorage` under bibliotekets defaultnyckel `REACT_QUERY_OFFLINE_CACHE`, med `maxAge` 24 h (`PERSIST_MAX_AGE_MS`) och `buster: __APP_VERSION__` (ADR-072). Marcus hade laddat sidan i fönstret MELLAN frontend- och EF-deployen, så de 50 personerna sparades UNDER DEN NYA APP-VERSIONEN — bustern matchade och cachen behölls vid restore. Och TASK-286.4 (`6fa82a32`) hade satt `PERSONREGISTER_STALE_TIME_MS = 30 * 60 * 1000` (`src/queries/personregister-farskhet.ts` rad 21), vilket gör den persisterade datan FÄRSK — ingen bakgrundshämtning. Löst med ett `localStorage.removeItem` mot nyckeln `REACT_QUERY_OFFLINE_CACHE`.

KODENS EGEN KOMMENTAR FÖRUTSADE STEG 5, agent-verifierat på EXAKT rad 51 i `src/queries/personregister-farskhet.ts`: "ÖPPET, värt att veta: `refetchOnWindowFocus` verkar bara på en STALE fråga. Med 30 minuters livstid hämtar en fokus-återkomst inom fönstret alltså inte om." Kommentaren var korrekt och stod i koden när felet inträffade. Den var en anteckning, inte en grind.

## ÅTERFALL, INTE FÖRSTA GÅNGEN — divergens mot uppdragstexten

Uppdraget som gav detta kort beskrev incidenten som ny. Agent-verifierat är den ANDRA kända instansen av samma klass. `tasks/sessions/2026-08-17-session-107.md` rad ~285–325 bokför S107 (2026-08-17): "git-integration deployar automatiskt på `main`; EF:erna kräver ett manuellt kommando" — prod-EF-deployen låg 13:08:12–13:09:07Z medan S107:s EF-rörande mergar landade 15:42–18:16Z, samtliga efter. Då bar den gamla `_shared/attachments.ts` inte nycklarna `rackvidd`/`kursfamilj`/`kursniva`, den nya fronten parsade dem med `.nullable()` (inte `.optional()`) via kastande `.parse()`, och varje yta som listade bilagor KASTADE i prod.

Skillnaden mellan instanserna är bara hur felet syntes: S107 kastade högljutt, 2026-08-22 stympade tyst. Rotorsaken är identisk, och S107 namngav den redan: defekten sitter i KOMPOSITIONEN. Prod-runbookens ordning är EF (steg 4) före front (steg 6), men steg 6 heter "Front-deployen verifierad utrullad" — "den kan bara VERIFIERA, aldrig sekvensera, eftersom Vercel skickar ut fronten i merge-ögonblicket. Ordningen är dokumenterad men omöjlig att hålla."

Att klassen återkom inom fem dagar med en dokumenterad ordning på plats är kortets starkaste argument: ordningen behöver en BÄRARE (denna kortklass, per EF-rörande PRD-familj), inte bara en runbook-rad.

## REGELN KORTET BÄR: EF FÖRE FRONTEND

Deploy-ordningen är EF FÖRST, frontend sedan. Motiveringen är mätt, inte principiell:

- Gör man tvärtom öppnas ett fönster där klienten talar ett API-språk servern ännu inte kan. Det i sig är transient och stänger vid EF-deployen.
- Men i det fönstret kan en persisterad cache FÖDAS med gammal data under NY app-version. Bustern (`__APP_VERSION__`) är då redan den nya och matchar vid restore — glappet blir alltså osynligt för det enda versionsskydd som finns, och långlivat av `staleTime` (30 min för registernyckeln) plus `maxAge` (24 h). Felet överlever den fix som stängde det.
- Åt andra hållet finns ingen motsvarande fälla: en NY EF som svarar en GAMMAL klient är bakåtkompatibel så länge grenen är additiv — `register=true`-grenen är just det (egen tidig retur, koden nedan bokstavligen orörd; se EF-filens egen kommentar rad ~104–110).

Asymmetrin är själva fällan och ska stå uttalad i varje utrullning: Vercel auto-deployar från `main` i merge-ögonblicket; Supabase Edge Functions gör det inte alls. Två halvor av samma system, två olika utlösare, ingen gemensam grind. Ingen mätning i CI kan se glappet — repot är internt konsistent hela tiden.

## Praktisk konsekvens för nästa utrullning

- Landa EF-rörande PR:er och DEPLOYA EF:erna innan den frontend-PR som konsumerar dem mergas. Går det inte (kön äger ordningen) är fönstret känt och ska stängas aktivt, inte inväntas.
- Verifiera med `ezbr_sha256`, inte `VERSION`/`UPDATED_AT`.
- Rensa `localStorage`-cachen för den som satt i glappet — annars bär den felet vidare efter att glappet stängts.

## Utrullningens omfång — agent-mätt

En name-only-loggning över `supabase/`, begränsad till TASK-286-commits sedan 2026-08-21, ger EXAKT EN fil: `supabase/functions/get-persons/index.ts` (rörd av TASK-286.1 `22aed794`, +64/-23, och TASK-286.3 `1b226272`, +60/-46; TASK-286.4/286.7 rörde inga supabase-filer). Ingen `_shared/`-fil ingår, alltså finns ingen rippel till andra Edge Functions — till skillnad från S107, där `_shared/field-allowlists.ts` + `_shared/airtable-filter.ts` gjorde ~23 funktioner deploy-pliktiga. Utrullningens yta är därmed en enda funktion, och den är redan gjord.

Referenser: `docs/reference/prod-driftsattning-runbook.md` (steg 4 EF, steg 6 front), `scripts/fas4-prod-deploy.sh`, `.prod-ref-policy.conf`, ADR-072 (persist-lagret), ADR-123 (förladdat personregister), TASK-284.6 (mall för prod-utrullningskort), TASK-289 (staleTime-risken), `tasks/sessions/2026-08-17-session-107.md` (S107-instansen).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 get-persons deployad till prod med ezbr_sha256-verifierat innehållsbyte — RETROAKTIVT UPPFYLLD 2026-08-22 17:13:34Z (31a8b234… → 85306a63…). KÄLLA: Marcus prod-mätning, strukturellt ej agent-reproducerbar (prod-låset)
- [x] #2 Utrullningens omfång är MÄTT, inte antaget: vilka Edge Functions familjens diffar faktiskt rör, inklusive rippel via _shared/ — en enda _shared-fil gör dussintals funktioner deploy-pliktiga (S107: ~23). Mätt här till exakt en fil, get-persons/index.ts
- [ ] #3 Deploy-ordningen EF FÖRE frontend är uttalad i utrullningen, med den mätta motiveringen: en persisterad cache som föds i glappet bär gammal data under NY app-version — osynlig för bustern, långlivad av staleTime
- [x] #4 Verifieringen använder ezbr_sha256, inte VERSION eller UPDATED_AT — kontrasten get-events (oförändrad hash genom samma deploy) står som belägg för att instrumentet skiljer omdeployad från deployad-med-ny-kod
- [x] #5 localStorage-cachen REACT_QUERY_OFFLINE_CACHE rensad eller kommunicerad för var och en som laddade sidan i glappet — annars bär klienten felet vidare efter att glappet stängts
- [ ] #6 Nästa EF-rörande PRD-familj är kontrollerad: finns ett prod-utrullningskort som säger att Edge Functions måste följa med koden ut, eller saknas det som det saknades här
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
RETROAKTIV DEL — belägg per bockat AC (2026-08-22, bokförings-agent i worktree mot origin/main 3849ac5a).

AC #1 BOCKAT på KÄLLMÄRKT EXTERN MÄTNING, inte agent-verifikation. get-persons deployades till prod 2026-08-22 17:13:34Z av Marcus; ezbr_sha256 gick 31a8b234… → 85306a63…. En agent kan strukturellt inte reproducera detta: deny-prod-ref.sh avvisar varje Bash-kommando som bär prod-refen (.prod-ref-policy.conf § Matchning, substräng-match över hela kommandosträngen). Bocken vilar därför på Marcus mätning och ska läsas så.

AC #2 BOCKAT på AGENT-MÄTNING. En name-only-loggning över supabase/ begränsad till TASK-286-commits sedan 2026-08-21 ger exakt en fil: supabase/functions/get-persons/index.ts. Rörd av TASK-286.1 (22aed794, +64/-23) och TASK-286.3 (1b226272, +60/-46). TASK-286.4 (6fa82a32, 38d3a85a) och TASK-286.7 (62fc3acc) rörde inga supabase-filer alls. Ingen _shared/-fil ingår, alltså noll rippel till andra Edge Functions — utrullningens yta är EN funktion. Kontrast som visar varför mätningen behövdes: i S107 gjorde _shared/field-allowlists.ts + _shared/airtable-filter.ts ~23 funktioner deploy-pliktiga, och den siffran rättades i efterhand från 9.

AC #4 BOCKAT. Instrumentvalet är belagt i båda riktningar av samma deploy: get-persons bytte hash (ny kod ute), get-events behöll 636539ed… (omdeployad, samma innehåll). VERSION kan inte skilja dem åt — den bumpas +1 på alla funktioner vid varje deploy — och UPDATED_AT står stilla för orörda funktioner. Källa: Marcus prod-mätning, samma begränsning som AC #1.

AC #5 BOCKAT. Marcus rensade REACT_QUERY_OFFLINE_CACHE efter EF-deployen; personlistan visade därefter hela registret. Detta var det steg som faktiskt löste incidenten — EF-deployen ensam gjorde det inte, vilket är hela poängen med kortets § REGELN.

AC #3 och #6 LÄMNAS ÖPPNA MED AVSIKT. Båda är framåtriktade: #3 gäller nästa utrullning, #6 gäller nästa EF-rörande PRD-familj. De kan inte bockas av att detta kort existerar — det vore att förväxla nedskrivningen med efterlevnaden, vilket är exakt felet S107 gjorde när ordningen bokfördes i runbooken och sedan bröts fem dagar senare.

DIVERGENS MOT UPPDRAGSTEXTEN, öppet bokförd: uppdraget som gav detta kort beskrev incidenten som en förstagångshändelse. Den är den ANDRA kända instansen av klassen. S107 (tasks/sessions/2026-08-17-session-107.md rad ~285–325) bar samma orsak fem dagar tidigare, med motsatt symptom (kastande Zod-parse i stället för tyst stympning) och namngav redan rotorsaken i kompositionen. Divergensen ändrar inte vad kortet ska göra, men den ändrar styrkan i argumentet: klassen är återfallsbenägen, och en runbook-rad har redan bevisats otillräcklig som enda bärare.
<!-- SECTION:NOTES:END -->
