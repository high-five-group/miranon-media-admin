# En level-triggered vakt utan undantagslista kostar en modelltur per svep, för alltid

**En level-triggered vakt utan undantagslista kostar en modelltur per svep
för varje känd, utanför-scope-röd PR — och kräver därför en mute-lista per
session, inte bara vid sessionsstart.** Level-triggered betyder att vakten
rapporterar tillståndet den håller VARJE svep, inte bara vid övergången
(det är avsikten — immunitet mot att missa en övergång, jfr Kubernetes'
watch+resync-mönster). Priset är att en känd, redan-bokförd röd PR eller
en annan sessions PR larmar om och om igen tills den explicit tystas.

Mätt (S127, 2026-09-18): heartbeat-svepet larmade fyra gånger på en
eftermiddag för kända röda/andras PR:er (Dependabot-högen, S126:s PR
`#2514`), och krävde fyra omstarter med mute-lista samma dag.

Källa: `tasks/sessions/2026-09-18-session-127.md` Del 2 ("En level-triggered
vakt utan undantagslista kostar en modelltur per svep för varje känd,
utanför-scope-röd PR") + Del 4 Kandidat 6 ("En level-triggered vakt kräver
en mute-lista per session: fyra omstarter av svepet på en eftermiddag för
kända röda/andras PR:er").
