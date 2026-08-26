# Registrerade worktrees kan tyst passera dev-portschemats tak utan att någon mekanism städar dem

**Antalet registrerade worktrees kan växa förbi
`tests/support/dev-portar.ts`s portschemas tak (`MAX_INDEX`) utan att
något varnar förrän en testsvit (`test:api`) blir okörbar i de
worktrees som hamnat utanför taket. Städning av gamla worktrees är i
dagsläget ett manuellt, inte mekaniserat, steg.**

Instans (S112, Paushistorik 1 § Lesson-KANDIDATER punkt 8 + Del 4 §
Handoff-verifikat, 2026-08-24→26): vid paus (2026-08-25) stod 35
registrerade worktrees mot ett tak på `MAX_INDEX = 26`
(`tests/support/dev-portar.ts`). Vid resume-mätningen (2026-08-26, Del
4) var antalet nedgått till **15** registrerade — disk-verifierat i
sessionsdoket. Uppdraget till detta lesson-skrivpass angav vidare att
städningen landade på 35→13 och att mekaniserad städning fortfarande
saknas; det exakta sluttalet 13 och avsaknaden av ett städ-skript är
INTE verifierat i den del av sessionsdoket jag läste — disk visar 15
vid Del 4:s mättillfälle; en senare manuell städning till 13 kan ha
skett efter det (detalj saknas i det sessionsdok jag läste; källa för
"13" är uppdragets egen instruktion).

**Det generella:** ett numeriskt tak utan en egen bevakare (till
skillnad från t.ex. `check-lesson-numbers.sh` för lesson-nummer) är ett
tillstånd utan bevakare — samma T108-klass som redan är namngiven i
CLAUDE.md § Åtgärdsregeln för en armerings-kandidat. Frågan "städning +
ev. tak-höjning" är fortfarande öppen och egen (ej löst av detta pass).
