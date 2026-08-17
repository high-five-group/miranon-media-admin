# En deny-hook som prövar RESULTATET i stället för DELTAT gör den godkända artefakten permanent agent-immutabel

**En vakt kan pröva två saker: "vad står i filen efter ändringen?" (resultat)
eller "vad ändrade den här skrivningen?" (delta). Skyddar vakten ett
godkännande-fält och prövar RESULTATET, nekar den varje edit av filen —
inklusive edits som inte rör godkännandet alls. Artefakten blir därmed
oföränderlig för varje agent, och även ren underhållsändring kräver ett
människo-moment. Prövar den DELTAT nekas exakt det den ska skydda och inget
mer.**

Instans (S102, 2026-08-17, `TASK-168`-klassens **sjätte** instans): 241.7-
rivningen var färdigmätt (typecheck 0, 243.5-avblockeringen probe-bevisad) men
kunde inte landa. Facit-manifestets `kallor`-lista pekade på filer rivningen
tar bort → `check-facit` exit 1 med sex fel → och deny-facit-hooken nekade
VARJE edit av det stämplade manifestet. Två vägar lades fram för Marcus:
**(a)** han lägger själv om `kallor` per rivning, **(b)** hooken delta-fixas
(rekommenderad — löser 241.7 och 243.5 permanent). Bokfört i PR **#1535**;
samma vägg väntade 243.5.

**Relaterat, men inte samma sak:** fragmentet
`facit-kallor-ompekas-fore-stampeln.md` ger den OPERATIVA vägen runt väggen —
peka om `kallor` i flip-skivan medan manifestet ännu är skrivbart. Denna post
handlar om VAKTENS DESIGN, alltså varför väggen finns även när man gör rätt i
övrigt. Sjätte instansen är beviset för att den operativa omvägen inte räcker:
en klass som återkommer sex gånger ska mekaniseras bort, inte kringgås en
sjunde.
