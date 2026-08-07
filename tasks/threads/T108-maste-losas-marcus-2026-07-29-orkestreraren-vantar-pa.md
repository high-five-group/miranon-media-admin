---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T108 — MÅSTE LÖSAS (Marcus 2026-07-29). Orkestreraren väntar på notifieringar som strukturellt aldrig kommer — PR-landningar notifierar ingen

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
**MÅSTE LÖSAS (Marcus 2026-07-29). Orkestreraren väntar på notifieringar som strukturellt aldrig kommer — PR-landningar notifierar ingen.** Empiri samma dag, TVÅ gånger: (1) `TASK-77`/`78`/`82` landade gröna och stod kvar som `To Do` tills Marcus frågade varför ingenting hände; (2) `#439`/`#440`/`#442` landade 12:06–12:20 medan orkestreraren sade sig "vänta på att `#439` landar" — Marcus fångade det med _"VEM ska du få notifiering ifrån?????"_. **Mekanismen är känd och entydig:** endast bakgrundsjobb som agenten SJÄLV startar, och spawnade agenter, producerar notifieringar. En mergad PR gör det inte. Orkestreraren använde vakter korrekt fyra gånger samma dag (`#418`, `#421`, `#433`, `#437`) och slutade sedan — utan att något ändrats i förutsättningarna. **Varför det inte räcker med en regel:** dagen bevisade två gånger att en nedskriven regel utan mekanism inte efterlevs (`L328`-klassen, och `check-backlog-closure.sh` byggdes av exakt det skälet). En lesson som säger "sätt alltid en vakt" är samma svaga form. **Klassen är dessutom bredare än PR:er:** varje tillstånd som ändras utanför agentens egen process har samma egenskap — kö-läge, CI-utfall, externa system, en annan sessions landningar. Frågan är inte "hur bevakar jag PR-landningar" utan **"vilka tillstånd antar jag att någon berättar om för mig?"**. **Former att utforska:** (a) parkoppling — armering av auto-merge får aldrig ske utan att en vakt startas i samma andetag, mekaniserat snarare än ihågkommet; (b) en periodisk tillstånds-avstämning under aktivt arbete (`/loop`-klassen) som läser kö, kort-status och grind-utfall utan att fråga; (c) grinden `check-backlog-closure.sh` körd lokalt som del av varje leverans-kadens, så drift fångas av mekanik i stället för av Marcus; (d) omvänd default — anta ALDRIG att en väntan är bevakad, och gör passiv väntan till ett explicit, motiverat val. **Kostnaden är mätt, inte befarad:** åtta kort-stängningar fördröjdes över dagen, och båda gångerna var det Marcus som fångade det — alltså den dyraste fångst-mekanismen vi har. Besläktad: `check-backlog-closure.sh` (fångar UTFALLET av felet, inte orsaken) · `L328` (regel utan mekanism efterlevs inte)

**Ursprunglig Ingång-cell:**
_`TASK-113` levererad 2026-08-01: form (d) mekaniserad som `Stop`-/`SubagentStop`-hook (`scripts/stop-vakt.sh` + `.stop-vakt-policy.json`, beslut ADR-087, Marcus GO klass A) — väntepåstående utan buren mekanism blockeras en gång med avstämningens resultat; T112-hålet (notifikationskedjan mot idle huvudsession) kvarstår öppet bokfört. **PAUSAD 2026-08-02 (session-end S91):** trevägs-heartbeaten + svep-vid-väckning i drift (T112-formen), mekaniseringen kortad → `TASK-119`; trigger = `TASK-119`-exekvering och `T111`-bygget (cron-beslutet)_
