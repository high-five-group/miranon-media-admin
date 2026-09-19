# En order som förbjuder en yta ska säga vad som i stället ÄR agentens ansvar där

`[UNIVERSAL]`

**En order som förbjuder en yta ska säga vad som i stället ÄR agentens
ansvar på samma yta — annars läses förbudet som "rör den inte alls".**
Instans (`TASK-455`/PR #2547): ordern "Rör inte facit" var korrekt, men
ADR-102 A3 föreskriver att agenten SKA skriva en AMENDERING-sidofil när
formen utökas — "det är inte ett val". Bygg-agenten läste "rör inte facit"
bokstavligt och hoppade över sidofilen tills en tilläggsorder rättade det.

Varför `[UNIVERSAL]`: detta är en generell regel för hur ett förbud
formuleras i ett agentuppdrag, oberoende av vilken yta eller vilket repo
förbudet gäller — ett förbud utan en positiv motsvarighet är strukturellt
ofullständigt.

Källa: `tasks/sessions/2026-09-18-session-127.md` Del 6, Lesson-kandidat 12
och "Fångster värda att minnas" #3.
