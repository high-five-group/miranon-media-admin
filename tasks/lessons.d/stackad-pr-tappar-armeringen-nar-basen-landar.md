# En PR stackad på en köad PR tappar sin armering när basen landar

**En PR vars gren utgår från en annan köad PR sparkas ur kön när basen
landar — armeringen konsumeras tyst och PR:en står `CLEAN` utan
`autoMergeRequest`, exakt som en aldrig armerad. Heartbeat-svepets
"ARMERINGS-KANDIDAT" är då ett riktigt larm, inte det kända falsklarmet.**
Mätt 2026-09-17 (S125): #2494 (stackad på #2492) var `isInMergeQueue: true`
kl 11:19Z, `false` kl 11:21Z direkt efter att #2492 landat, och krävde ett
nytt `gh pr merge --auto`. Disambiguera alltid med GraphQL `isInMergeQueue`
(inte `autoMergeRequest`): samma svep gav falsklarm på #2492/#2494 medan
de faktiskt stod i kön (CLEAN vid armering ⇒ fältet sätts aldrig, CLAUDE.md
§ Landning rad 2). Regel: efter varje landning av en bas, kontrollera dess
stackade barn och armera om.
