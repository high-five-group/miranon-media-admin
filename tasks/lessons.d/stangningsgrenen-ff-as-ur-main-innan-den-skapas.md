# Stängningsgrenen fast-forwardas ur `main` INNAN den skapas — annars kolliderar kortets `updated_date` med sin egen landning

**En stängnings-commit (AC-bockning, `status: Done`) rör exakt den fil som
arbetets egen PR just skrev. Skapas stängningsgrenen ur en `main` som ännu
inte bär arbets-landningen får kortets `updated_date`-rad två skribenter och
mergen konflikter — på en ändring som är ren bokföring. `git fetch` +
fast-forward FÖRE `git switch -c` gör klassen strukturellt omöjlig.**

Instans (S102, 2026-08-16): `task-244`:s stängning i PR **#1429**
(`a92877d9`) fick en `updated_date`-konflikt som fick läkas för hand —
stängningsgrenen var skapad innan arbets-PR:en (#1417/#1424) hunnit landa i
`main`. Bokförd i sessionsdokets Del 14 som "ff-före-stängningsgren-
lärdomen" och buren vidare som carry-kandidat genom sjätte, sjunde och
åttonde pausen.

**Skilj den från `L440`-familjen och från `L499`.** `L499` säger att en grön
grind mot ett föråldrat träd är ett falskt godkännande — där är skadan ett
felaktigt PASS. Här är skadan en MERGE-konflikt i en fil som ägs av verktyget
(backlog-CLI:t), och den kostar en manuell läkning som lätt görs
handredigerande i stället för via CLI:t. Ordningen är därför: landa arbetet →
`git fetch` + ff → skapa stängningsgrenen → `task edit` → commit.
