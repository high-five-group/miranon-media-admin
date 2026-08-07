---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: active
---

# T120 — Ägarlappen överlever sin session — och `ask` som beslutsvärde levererar inte skyddet vi trodde vi köpte

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
**Ägarlappen överlever sin session — och `ask` som beslutsvärde levererar inte skyddet vi trodde vi köpte.** Registrerad 2026-08-04 (S97, resumen) på Marcus order: _"Ta reda på varför lappen hamnade där från första början, de lär ju hända igen. LÖS ROTORSAK inte symptom."_ **MÄTT samma dag:** en ägarlapp (`.git/katalogagarskap-agare.json`, `session_id: 06546c16-…`, `satt_vid: 2026-08-04T16:41:33Z`) blockerade S97-resumen tre minuter efter att den skrevs. Den ägande sessionen var då redan död: **noll** levande processer (mätt med `ps -Ao pid,ppid,lstart,command` filtrerad på sessions-ID:t, med den egna kommandoraden exkluderad → tom), **ingen** transcript-fil i `~/.claude/projects/…` (den blockerade sessionens egen är 237 KB), **tom** scratchpad, **noll** rader i `.claude/agent-spawn-log.jsonl`. Marcus uppger att han inte startade den. Sessionen hann alltså köra `SessionStart`-hooken, sätta lappen och dö innan den tog emot ett meddelande. **ROTORSAKEN ÄR INTE TRÖSKELN:** `KATALOG_STALE_TIMMAR=12` (`.katalogagarskap-policy.conf`) beskriver en lapp som blir gammal — men denna var stale efter ~3 sekunder. Fail-closed-designen HÅLLER (den blockerade korrekt), men **skälet modellen läser är osant under hela tolvtimmarsfönstret**: den säger "sannolikt äkta ägare" om en död session. En livstid mätt i tid kan strukturellt inte uttrycka liveness. **ANDRA ORDNINGENS FYND, dyrare än det första:** ett godkänt `ask` är i orkestrerarens tool-resultat **omöjligt att skilja från att hooken aldrig fällde** — båda ger kommandots normala utdata. Orkestreraren rapporterade därför `deny-grind-genom-pipe.sh` som "släppte igenom" när den i själva verket hade fällt och Marcus godkänt prompten. **Konsekvens: en `ask`-hooks fällande sida kan inte skarpbevisas av orkestreraren ensam** — bara Marcus ser signalen, vilket gör CARRY-blockets planerade skarpbevis strukturellt omöjligt i den form det skrevs. **MARCUS IFRÅGASÄTTER `ask` SOM DESIGNVAL** (verbatim): _"jag fick en fråga innan vi designade Hooks:en om vi skulle köra på 'ask' eller om det skulle ske automatiskt, du föreslog 'ask' men nu vet jag inte om de var rätt val. Dels är jobbigt att få de där frågorna och dels så förstår jag ju knappt det som står där."_ Två distinkta problem: (1) **prompt-trötthet** — om `ask` leder till reflexmässigt godkännande levererar den inget skydd, bara friktion; (2) **begripligheten** — hook-meddelandet bryter mot husregeln Gunilla-principen i vårt EGET system. **ÅTGÄRDSRIKTNINGAR (ej beslutade):** (a) lappen bär `pid` och hooken gör `kill -0` i stället för att räkna timmar · (b) städning vid `SessionEnd` — men den fångar per definition inte en session som dör onormalt, så den kan bara komplettera (a), aldrig ersätta den · (c) `ask` → `deny` per mekanism, med kriteriet _"är falska positiva möjliga, och vad kostar de?"_ · (d) hook-meddelanden skrivs om i Gunilla-form. Research-pass löper på (a)–(d) med förstapartsdok + branschprecedent (admission controllers, OPA `enforcementAction`, PID-filer, `flock`, Kubernetes leases, prompt-fatigue-forskning). Besläktad: `T119` (detta ÄR mekaniserings-programmets yta) · `ADR-090` (regeln lappen mekaniserar) · `T108`/`T112` (ett tillstånd utan bevakare) · `T110` (orkestrerarens felklasser — feltolkningen av godkänt `ask` är en ny klass A-instans: instrumentet ser en form men inte alla)

**Ursprunglig Ingång-cell:**
_(ingen kort än — endast registrerad)_
