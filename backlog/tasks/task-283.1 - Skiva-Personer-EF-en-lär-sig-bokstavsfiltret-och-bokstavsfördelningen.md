---
id: TASK-283.1
title: 'Skiva: Personer-EF:en lär sig bokstavsfiltret och bokstavsfördelningen'
status: Done
assignee: []
created_date: '2026-08-21 08:51'
updated_date: '2026-08-22 11:06'
labels:
  - ready-for-agent
  - wontfix
dependencies: []
parent_task_id: TASK-283
ordinal: 510000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Personer-EF:en lär sig ett bokstavsvillkor, och börjar svara med hur många personer varje bokstav rymmer.

ÄNDE TILL ÄNDE: ett anrop utan bokstav beter sig exakt som idag. Ett anrop med en bokstav svarar med enbart de personer vars namn börjar på den — diakritik-korrekt, så Å ger Å-namn och aldrig A-namn. Ett anrop med hinken för namnlösa svarar med enbart dem. Ett anrop med bokstaven E svarar med personer som faktiskt heter något på E, aldrig med de namnlösa. Bokstav och fritext kan kombineras och smalnar av tillsammans. Svaret bär dessutom en fördelning: hur många personer varje bokstav och hinken rymmer, räknat över hela registret och inte över den aktuella sökningen.

FÖRDELNINGEN HAR EN STOPP-GRIND, och den är verklig. Den ska komma ur den genomgång av samtliga namn som EF:en REDAN gör för att räkna totalen. Visar sig den genomgången inte bära fördelningen: landa filtret ensamt, STOPPA på fördelningen och eskalera. Lägg aldrig till en andra genomgång för att få talen — kostnaden var hela skälet till att formen valdes.

Ingen klientändring i denna skiva. Skivan avslutas med deploy till staging, så nästa skiva kan skicka parametern mot en EF som redan förstår den.

Täcker användarberättelser: 1, 8, 9, 18
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ett anrop UTAN bokstav ger byte-identiskt svar mot dagens beteende
- [ ] #2 Ett anrop med bokstav ger enbart personer vars namn börjar på den — Å ger Å-namn, aldrig A-namn (fälla 51)
- [ ] #3 Bokstaven E ger INTE de namnlösa; sentinelen är explicit undantagen
- [ ] #4 Hinken för namnlösa ger enbart dem, via exakt likhet mot sentinel-strängen
- [ ] #5 Bokstav och fritext kombineras med AND och smalnar av tillsammans
- [ ] #6 Svaret bär fördelning per bokstav och hink, räknad över HELA registret — aldrig över aktuell sökning
- [ ] #7 Fördelningen härleds ur den namn-genomgång EF:en redan gör; en andra genomgång läggs ALDRIG till — går det inte, landa filtret ensamt och STOPPA
- [ ] #8 Testfall i EF:ens staging-fil täcker bokstav, sentinel-undantaget, hinken och kombinationen med fritext
- [ ] #9 EF:en deployad till staging och verifierad med direktanrop
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Sentinelen undantagen ur E-filtret — bevisat med testfall, aldrig antaget (fälla 51)
- [ ] #6 EF deployad till staging FÖRE den landning som börjar skicka bokstavs-parametern (deploy-ordningen)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Orkestrerar-stängning 2026-08-22 — stängs som ÖVERFLÖDIGT, inte tyst

Källa: tasks/sessions/2026-08-20-session-109.md § Del 7 (landad på main, 2026-08-21).

**Vad hände.** Marcus observerade att personlistan 'laddas om' vid varje teckeninmatning i sökrutan — ett UX-problem, inte ett buggfynd i denna skivas kod. Två vägar restes som ett STOPP: (A) lappa symptomet med keepPreviousData, eller (B) förladda hela personregistret (559 personer) och sök/filtrera/sortera i klienten, i ADR-078:s (INSTANT-regeln) anda och samma mönster repot redan bär på två andra ytor. Marcus: 'Då kör vi B!' (Del 7 § B).

**Väg B river denna skivas hela premiss.** Beslutet är bokfört i ADR-123 (Förladdat personregister — sök och bokstavsindex i klienten, Accepted 2026-08-21), vars § Relation till tidigare beslut säger uttryckligen: 'Amenderar TASK-283:s implementationsbeslut (väg A, EF-filter) — öppet, i kortet, via CLI:t.' Med hela registret laddat och filtrerat i klienten behöver Personer-EF:en inget serverside bokstavsfilter eller bokstavsfördelning att lära sig — bokstavsindexet (TASK-283.2/283.3) byggs i stället ovanpå den klientsorterade arrayen TASK-286.3 levererade. TASK-283-föräldrakortet är redan omskrivet mot detta via CLI:t (se dess AMENDERING 2026-08-21-post, S109, ADR-123 — väg B).

**Bygg-agentens stopp.** Agenten arbetade i worktree agent-add265ceade8e9e7a och stoppades mitt i när beslutet föll. Ingen AC bockas, ingen kod landade härifrån — se den befintliga WONTFIX-kommentaren 2026-08-21 för detaljerna om EF-deploy/återställning till staging (v27→v28).

**Worktreen städad 2026-08-22.** Verifierad ren före borttagning (via filsystem-läsning, eftersom Bash-git mot en syskon-worktree är spärrat för en isolerad agent — samma gräns som CLAUDE.md dokumenterar för huvudkatalogen, empiriskt bredare här): reflog bar exakt tre poster (branch-skapelse + två 'reset: moving to HEAD'), NOLL commit-poster, branch-tippen identisk med skapelse-basen (origin/mains SHA vid checkout), ingen fjärr-ref. Exakt 7 filer ändrade efter checkout — task-283.1-kortet, docs/reference/data-model.md, tre testfiler, get-persons/index.ts, airtable-filter.ts — matchande den beskrivna, övergivna diffen (EF, filter-builder, tester, data-model.md, kortet). Inga främmande filer. Worktreen togs bort med `git worktree remove --force` (git blockerade utan --force pga 'modified or untracked files' — förväntat för en okommitterad diff, inte ett tecken på problem). En kvarvarande LOKAL gren `worktree-agent-add265ceade8e9e7a` (noll commits, ingen fjärr-ref) lämnades orörd — utanför uppdragets uttalade scope ('ta bort worktreen'), bokförd här för synlighet.

**Statusval.** Repot har enbart To Do / In Progress / Done (backlog/config.yml). Ingen 'avbruten'-status finns eller uppfinns här. Status sätts Done; detta kort avslutades genom ett medvetet arkitekturbeslut och blev överflödigt — det glömdes aldrig bort.

**Divergens mot uppdraget, bokförd öppet (ADR-086).** Uppdraget bad om en hänvisning till 'väg B, ADR-123 och ADR-122'. ADR-122 ('Eventlänkens vakt — A1 verifierar mot facit') är en HELT ANNAN, orelaterad ADR (Airtable-automation A1 / eventlänk-matchning, landad S110/T158, commit 3ce9c65d) — den nämns inte ovan eftersom den inte hör hemma i detta beslut. Roten till felet: Del 7:s egen tabellrad ('Fortsättning | ADR-122 efter research... → TASK-283 skrivs om') citerar fel ADR-nummer. Verifierat mot git-historik (ADR-123: commit dbdaf228, S109, 2026-08-21 — samma session och datum som Del 7) och mot filinnehåll (ADR-123:s eget § Relation, samt TASK-283-föräldrakortets AMENDERING-post) — endast ADR-123 hör hemma här.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-21 11:34
---
WONTFIX 2026-08-21 (S109, ADR-123): skivan byggde bokstavsfiltret och fördelningen i EF:en (väg A). Marcus valde väg B — registret laddas helt och filtreras i klienten — vilket gör EF-filtret onödigt och stopp-grinden om 'en andra genomgång' moot. Bygg-agenten stoppades mitt i (okommittad diff kvar i dess worktree agent-add265ceade8e9e7a, ingen gren, ingen PR); staging-EF:en get-persons hade hunnit deployas (v27) och återställdes till main (v28). Inga AC bockas. Ersätts av registerskivan i det nya PRD-kortet.
---
<!-- COMMENTS:END -->
