# Ett fynd måste säga VAR felet sitter, annars larmar det om fel yta

**En korrekt observation som utelämnar vilket lager den gäller läses som om det
mest synliga lagret är trasigt. Det leder prioriteringen fel och skickar
läsaren till fel fil.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-29):** efter merge queue-aktiveringen skrevs fyndet som
*"#405 rörde en backlog-kortfil och drog ändå full staging-svit"*. Sant — men
utan att säga var.

<!-- vale Vale.Terms = NO -->
Marcus svarade: *"Vad jag kan se på Github så körde inte #405 full svit i alla
fall."*
<!-- vale Vale.Terms = YES -->

Han hade rätt om ytan han såg. Tre ytor, och bara den tredje var drabbad:

| Yta | Körning | Utfall |
|---|---|---|
| PR-grinden | `30410841005` (`pull_request`) | `Test suite` **skipped** ✅ |
| Merge queue | `30410912068` (`merge_group`) | `Test suite` **skipped** ✅ |
| Post-merge på `main` | `30410980946` (`push`) | `Staging (API + E2E)` success ← fyndet |

Formuleringen läste som om PR-grinden vore trasig. Den var orörd. Det som
faktiskt blev dyrare var efterkontrollen på `main` — ett långsammare och
mindre akut problem, som dessutom ligger i en helt annan fil.

**Konsekvensen av utelämnandet är inte kosmetisk.** Ett kort som antyder att
PR-grinden är trasig prioriteras som akut, och den som plockar det öppnar
`ci.yml` i stället för `scripts/classify-post-merge.sh`. Felaktig
allvarlighetsgrad och felaktig startpunkt, ur en observation som var korrekt i
sak.

**Formen:** ett fynd bär alltid tre delar — **vad**, **var**, och **vad som
INTE påverkas**. Den tredje delen är den som oftast utelämnas och den som
oftast avgör prioriteringen. Skriv den även när den känns självklar; den är
självklar bara för den som just gjort mätningen.

Släkt med [[harled-ur-kallan-skriv-aldrig-av-kortets-tal]]: båda handlar om att
ett sant delpåstående kan bära en falsk helhet.
