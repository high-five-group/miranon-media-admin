# Bygguppdrag ska uttryckligen förbjuda att stänga av staging-preflighten

**Varje bygguppdrag ska uttryckligen förbjuda `MM_STAGING_PREFLIGHT=off`.**
`451.7`-agenten körde förbi låset en gång under trängsel (fem falska röda
uppstod som följd); agenterna som hade förbudet uttryckt i sin egen order
väntade 14 respektive 64 minuter i stället och körde aldrig förbi.
Frånvaro av ett uttryckligt förbud tolkas alltså inte tillförlitligt som
"förbjudet av princip" — en agent under tidspress hittar override-flaggan
och använder den om ordern inte explicit stänger den vägen.

Inte `[UNIVERSAL]`: specifik för detta repos staging-preflight-mekanism
(`tests/support/staging-preflight.ts`, `MM_STAGING_PREFLIGHT`) — men det
generella mönstret (en order som ska förbjuda en känd override-flagga
måste göra det EXPLICIT, inte förlita sig på underförstådd disciplin) kan
återkomma i andra spokes med liknande skyddsmekanismer.

Källa: `tasks/sessions/2026-09-18-session-127.md` Del 6, Lesson-kandidat 11.
