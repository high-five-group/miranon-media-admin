# Ett per-post-CLI-anrop i en grind är kvadratklass — mät bulk-vägen innan du bygger loopen

**En grind som frågar verktyget en gång per post skalar som antal poster ×
per-anropskostnad, och båda faktorerna växer med projektet. Bär verktyget en
bulk-väg (`list --json`, ett enda anrop som läser allt) är den nästan alltid
storleksordningar billigare. Mät bulk-vägen FÖRST; skriv per-post-loopen bara
om bulk-vägen bevisligen saknar det du behöver.** `[UNIVERSAL]`

Instans (S102, 2026-08-17, `task-238`): `check-backlog-closure.sh` gjorde
**502 × `task view`** ≈ 22 minuter. Samma faktamängd låg i `task list --json`
på **1,68 s**. Omskrivningen till bulk-faktainsamling med korsvalidering (exit
2 vid oenighet mellan källorna) tog grinden från **1332 s till 14,57 s** —
landad i PR **#1503**, beslutet öppet mintat som `ADR-117`.

**Den skärpande detaljen:** kostnaden var kvadratisk, inte linjär, eftersom
varje enskilt anrop självt gjorde ett svep (gren-skanningen). Det syns aldrig
i en enstaka mätning av ETT anrop — bara i totalen. Därför räcker det inte att
multiplicera ett per-anropstal; totalen måste mätas i den kontext där den gör
ont. Den regeln har fällt oss två gånger i rad, och den står nu även i
`CLAUDE.md` § Kortnummer.
